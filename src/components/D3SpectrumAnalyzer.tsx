import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { audioEngine } from '../utils/audioEngine';
import { BarChart2, Radio } from 'lucide-react';
import { AppTheme, SubHarmonicLayer } from '../types/dragon';

interface D3SpectrumAnalyzerProps {
  isPlaying: boolean;
  frequency: number;
  subHarmonicsActive?: boolean;
  subHarmonicLayers?: SubHarmonicLayer[];
  overtonesActive?: boolean;
  theme?: AppTheme;
}

interface HarmonicMarker {
  freq: number;
  label: string;
  type: 'fundamental' | 'subharmonic' | 'overtone';
  color: string;
}

export const D3SpectrumAnalyzer: React.FC<D3SpectrumAnalyzerProps> = ({
  isPlaying,
  frequency = 432,
  subHarmonicsActive = false,
  subHarmonicLayers = [],
  overtonesActive = false,
  theme = 'sovereign-dark',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const animRef = useRef<number>(0);

  // Analyzer Configuration Options
  const [scaleMode, setScaleMode] = useState<'log' | 'linear'>('log');
  const [showSpectralBands, setShowSpectralBands] = useState<boolean>(true);
  const [hoveredNode, setHoveredNode] = useState<{ freq: number; amp: number; x: number; y: number } | null>(null);

  // Peak tracking state
  const [peakFreq, setPeakFreq] = useState<number>(432);
  const [peakDb, setPeakDb] = useState<number>(-2.4);

  const markerColors = useMemo(() => {
    if (theme === 'minimalist-lab') {
      return {
        fundamental: '#0369a1',
        subharmonic: '#047857',
        overtone: '#b45309',
      };
    }
    if (theme === 'high-contrast-cyber') {
      return {
        fundamental: '#00f0ff',
        subharmonic: '#4ade80',
        overtone: '#fde047',
      };
    }
    return {
      fundamental: '#38bdf8',
      subharmonic: '#34d399',
      overtone: '#facc15',
    };
  }, [theme]);

  // Calculate Key Harmonic Markers based on active frequency
  const harmonicMarkers: HarmonicMarker[] = useMemo(() => {
    const list: HarmonicMarker[] = [
      {
        freq: frequency,
        label: `${frequency}Hz Fundamental`,
        type: 'fundamental',
        color: markerColors.fundamental,
      },
    ];

    // Sub-harmonic markers
    if (subHarmonicsActive) {
      subHarmonicLayers.forEach((layer) => {
        if (layer.enabled) {
          const subF = Math.round((frequency / layer.divisor) * 10) / 10;
          list.push({
            freq: subF,
            label: `${subF}Hz (${layer.name})`,
            type: 'subharmonic',
            color: markerColors.subharmonic,
          });
        }
      });
    }

    // Overtones
    if (overtonesActive) {
      const overtoneRatios = [2, 3, 4];
      overtoneRatios.forEach((r) => {
        const oF = frequency * r;
        if (oF <= 3200) {
          list.push({
            freq: oF,
            label: `${oF}Hz (${r}x Overtone)`,
            type: 'overtone',
            color: markerColors.overtone,
          });
        }
      });
    }

    return list.sort((a, b) => a.freq - b.freq);
  }, [frequency, subHarmonicsActive, subHarmonicLayers, overtonesActive, markerColors]);

  useEffect(() => {
    const svgEl = svgRef.current;
    const container = containerRef.current;
    if (!svgEl || !container) return;

    const chartPalette =
      theme === 'minimalist-lab'
        ? {
            gradTop: '#0284c7',
            gradTopOpacity: 0.4,
            gradMid: '#059669',
            gradMidOpacity: 0.18,
            gradBottom: '#ffffff',
            grid: '#0284c7',
            gridOpacity: 0.16,
            axisText: '#475569',
            axisLine: '#cbd5e1',
            lineStroke: '#0284c7',
            useGlow: false,
            barHighlight: '#0284c7',
            barSub: '#059669',
            barBase: '#cbd5e1',
          }
        : theme === 'high-contrast-cyber'
        ? {
            gradTop: '#00f0ff',
            gradTopOpacity: 0.72,
            gradMid: '#4ade80',
            gradMidOpacity: 0.35,
            gradBottom: '#000000',
            grid: '#22d3ee',
            gridOpacity: 0.25,
            axisText: '#e0f2fe',
            axisLine: '#22d3ee',
            lineStroke: '#00f0ff',
            useGlow: true,
            barHighlight: '#00f0ff',
            barSub: '#4ade80',
            barBase: '#164e63',
          }
        : {
            gradTop: '#38bdf8',
            gradTopOpacity: 0.65,
            gradMid: '#34d399',
            gradMidOpacity: 0.3,
            gradBottom: '#030712',
            grid: '#38bdf8',
            gridOpacity: 0.15,
            axisText: '#64748b',
            axisLine: '#334155',
            lineStroke: '#38bdf8',
            useGlow: true,
            barHighlight: '#38bdf8',
            barSub: '#34d399',
            barBase: '#1e293b',
          };

    let width = container.clientWidth || 640;
    const height = 220;
    const margin = { top: 25, right: 30, bottom: 35, left: 45 };

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height);

    // Definitions for gradients & glow filters
    const defs = svg.append('defs');

    // Area Gradient
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'd3-spectrum-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient.append('stop').attr('offset', '0%').attr('stop-color', chartPalette.gradTop).attr('stop-opacity', chartPalette.gradTopOpacity);
    areaGradient.append('stop').attr('offset', '45%').attr('stop-color', chartPalette.gradMid).attr('stop-opacity', chartPalette.gradMidOpacity);
    areaGradient.append('stop').attr('offset', '100%').attr('stop-color', chartPalette.gradBottom).attr('stop-opacity', 0.0);

    // Filter for line crest glow
    const filter = defs.append('filter').attr('id', 'd3-glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Scales
    const minFreq = 20;
    const maxFreq = 2600;

    const xScale = scaleMode === 'log'
      ? d3.scaleLog().domain([minFreq, maxFreq]).range([margin.left, width - margin.right])
      : d3.scaleLinear().domain([minFreq, maxFreq]).range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear().domain([0, 255]).range([height - margin.bottom, margin.top]);

    // Grid lines
    const gridGroup = svg.append('g').attr('class', 'grid-lines').attr('opacity', chartPalette.gridOpacity);

    // Horizontal grid
    const yTicks = [50, 100, 150, 200];
    gridGroup
      .selectAll('line.horizontal-grid')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', chartPalette.grid)
      .attr('stroke-dasharray', '3,3');

    // Vertical grid ticks at sacred frequencies
    const freqGridTicks = scaleMode === 'log'
      ? [24, 48, 108, 144, 216, 432, 528, 864, 1296, 2000]
      : [200, 432, 800, 1200, 1600, 2000, 2400];

    gridGroup
      .selectAll('line.vertical-grid')
      .data(freqGridTicks)
      .enter()
      .append('line')
      .attr('x1', (d) => xScale(Math.max(minFreq, d)))
      .attr('x2', (d) => xScale(Math.max(minFreq, d)))
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('stroke', chartPalette.grid)
      .attr('stroke-dasharray', '2,4');

    // Bottom Axis (Frequency Hz)
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(freqGridTicks)
      .tickFormat((d) => {
        const val = Number(d);
        return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`;
      });

    const xAxisGroup = svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .attr('color', chartPalette.axisText)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    xAxisGroup.select('.domain').attr('stroke', chartPalette.axisLine);

    // Left Axis (Amplitude Magnitude dB)
    const yAxis = d3
      .axisLeft(yScale)
      .tickValues([0, 64, 128, 192, 255])
      .tickFormat((d) => {
        const val = Number(d);
        if (val === 255) return '0 dB';
        if (val === 192) return '-12 dB';
        if (val === 128) return '-24 dB';
        if (val === 64) return '-40 dB';
        return '-60 dB';
      });

    const yAxisGroup = svg
      .append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxis)
      .attr('color', chartPalette.axisText)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    yAxisGroup.select('.domain').attr('stroke', chartPalette.axisLine);

    // Spectral Energy Bars Group (when enabled)
    const barsGroup = svg.append('g').attr('class', 'spectral-bars').attr('opacity', showSpectralBands ? 0.35 : 0);

    // Spectrum Area & Line Path elements
    const areaPath = svg.append('path').attr('class', 'spectrum-area').attr('fill', 'url(#d3-spectrum-gradient)');

    const linePath = svg
      .append('path')
      .attr('class', 'spectrum-line')
      .attr('fill', 'none')
      .attr('stroke', chartPalette.lineStroke)
      .attr('stroke-width', 2);

    if (chartPalette.useGlow) {
      linePath.attr('filter', 'url(#d3-glow)');
    }

    // Group for Harmonic Target Markers
    const markersGroup = svg.append('g').attr('class', 'harmonic-markers');

    // Area Generator
    const areaGen = d3
      .area<{ freq: number; amp: number }>()
      .x((d) => xScale(Math.max(minFreq, d.freq)))
      .y0(height - margin.bottom)
      .y1((d) => yScale(d.amp))
      .curve(d3.curveMonotoneX);

    // Line Generator
    const lineGen = d3
      .line<{ freq: number; amp: number }>()
      .x((d) => xScale(Math.max(minFreq, d.freq)))
      .y((d) => yScale(d.amp))
      .curve(d3.curveMonotoneX);

    // Dynamic animation loop
    let idlePhase = 0;

    const renderLoop = () => {
      animRef.current = requestAnimationFrame(renderLoop);

      const analyser = audioEngine.getAnalyser();
      const points: { freq: number; amp: number }[] = [];

      if (isPlaying && analyser) {
        const binCount = analyser.frequencyBinCount;
        const freqData = new Uint8Array(binCount);
        analyser.getByteFrequencyData(freqData);

        const sampleRate = 48000;
        const hzPerBin = sampleRate / (binCount * 2);

        let maxVal = -1;
        let maxIdx = -1;

        const numSamplePoints = 140;
        for (let j = 0; j < numSamplePoints; j++) {
          const ratio = j / (numSamplePoints - 1);
          const sampleFreq = scaleMode === 'log'
            ? minFreq * Math.pow(maxFreq / minFreq, ratio)
            : minFreq + (maxFreq - minFreq) * ratio;

          const binIndex = Math.min(binCount - 1, Math.max(0, Math.round(sampleFreq / hzPerBin)));
          const amp = freqData[binIndex] || 0;

          if (amp > maxVal && sampleFreq > 30) {
            maxVal = amp;
            maxIdx = binIndex;
          }

          points.push({ freq: sampleFreq, amp });
        }

        if (maxIdx >= 0) {
          const detectedHz = Math.round(maxIdx * hzPerBin);
          setPeakFreq(detectedHz);
          const db = Math.round(((maxVal / 255) * 60 - 60) * 10) / 10;
          setPeakDb(db);
        }
      } else {
        idlePhase += 0.04;
        const numSamplePoints = 100;
        setPeakFreq(frequency);
        setPeakDb(-18.5);

        for (let j = 0; j < numSamplePoints; j++) {
          const ratio = j / (numSamplePoints - 1);
          const sampleFreq = scaleMode === 'log'
            ? minFreq * Math.pow(maxFreq / minFreq, ratio)
            : minFreq + (maxFreq - minFreq) * ratio;

          const distCarrier = Math.abs(sampleFreq - frequency);
          const peakCarrier = Math.exp(-Math.pow(distCarrier / 24, 2)) * 120;

          let peakSubs = 0;
          if (subHarmonicsActive) {
            subHarmonicLayers.forEach((l) => {
              if (l.enabled) {
                const subF = frequency / l.divisor;
                const distSub = Math.abs(sampleFreq - subF);
                peakSubs += Math.exp(-Math.pow(distSub / 18, 2)) * (l.gain * 90);
              }
            });
          }

          const noise = (Math.sin(sampleFreq * 0.05 + idlePhase) + Math.cos(sampleFreq * 0.08 - idlePhase)) * 4 + 8;
          const amp = Math.min(240, peakCarrier + peakSubs + noise);

          points.push({ freq: sampleFreq, amp });
        }
      }

      // Update D3 Path Data
      areaPath.attr('d', areaGen(points) || '');
      linePath.attr('d', lineGen(points) || '');

      // Update Spectral Energy Bars (sampled bands)
      if (showSpectralBands) {
        const bandData = points.filter((_, idx) => idx % 4 === 0);
        const barWidth = Math.max(2, (width - margin.left - margin.right) / bandData.length - 2);

        const bars = barsGroup.selectAll<SVGRectElement, { freq: number; amp: number }>('rect').data(bandData);

        bars
          .enter()
          .append('rect')
          .merge(bars)
          .attr('x', (d) => xScale(Math.max(minFreq, d.freq)) - barWidth / 2)
          .attr('y', (d) => yScale(d.amp))
          .attr('width', barWidth)
          .attr('height', (d) => Math.max(0, height - margin.bottom - yScale(d.amp)))
          .attr('fill', (d) => {
            if (Math.abs(d.freq - frequency) < 25) return chartPalette.barHighlight;
            if (d.freq < frequency && d.amp > 45) return chartPalette.barSub;
            return chartPalette.barBase;
          });

        bars.exit().remove();
      } else {
        barsGroup.selectAll('rect').remove();
      }

      // Update Harmonic Target Markers
      const markers = markersGroup.selectAll<SVGGElement, HarmonicMarker>('g.marker').data(harmonicMarkers);

      const markerEnter = markers.enter().append('g').attr('class', 'marker');

      markerEnter
        .append('line')
        .attr('class', 'marker-line')
        .attr('stroke-dasharray', '3,3')
        .attr('stroke-width', 1.5)
        .attr('y1', margin.top - 8)
        .attr('y2', height - margin.bottom);

      markerEnter
        .append('circle')
        .attr('class', 'marker-dot')
        .attr('r', 3.5)
        .attr('y', margin.top - 8);

      markerEnter
        .append('text')
        .attr('class', 'marker-text')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .attr('y', margin.top - 12);

      const markerMerged = markerEnter.merge(markers);

      markerMerged.each(function (d) {
        const markerG = d3.select(this);
        const xPos = xScale(Math.max(minFreq, d.freq));

        markerG
          .select('line.marker-line')
          .attr('x1', xPos)
          .attr('x2', xPos)
          .attr('stroke', d.color);

        markerG
          .select('circle.marker-dot')
          .attr('cx', xPos)
          .attr('cy', margin.top - 8)
          .attr('fill', d.color);

        markerG
          .select('text.marker-text')
          .attr('x', xPos)
          .attr('fill', d.color)
          .text(`${d.freq}Hz`);
      });

      markers.exit().remove();
    };

    renderLoop();

    // Mouse Tracking for Tooltip Inspection
    const handleMouseMove = (event: MouseEvent) => {
      const rect = svgEl.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      if (mouseX >= margin.left && mouseX <= width - margin.right && mouseY >= margin.top && mouseY <= height - margin.bottom) {
        const freqAtX = xScale.invert(mouseX);
        const ampAtY = yScale.invert(mouseY);
        setHoveredNode({
          freq: Math.round(freqAtX * 10) / 10,
          amp: Math.round(ampAtY),
          x: mouseX,
          y: mouseY,
        });
      } else {
        setHoveredNode(null);
      }
    };

    const handleMouseLeave = () => {
      setHoveredNode(null);
    };

    svgEl.addEventListener('mousemove', handleMouseMove);
    svgEl.addEventListener('mouseleave', handleMouseLeave);

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 640;
      svg.attr('width', width);
      xScale.range([margin.left, width - margin.right]);
      xAxisGroup.call(xAxis);
      gridGroup.selectAll('line.horizontal-grid').attr('x2', width - margin.right);
      gridGroup.selectAll('line.vertical-grid').attr('x1', (d) => xScale(Math.max(minFreq, Number(d)))).attr('x2', (d) => xScale(Math.max(minFreq, Number(d))));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      svgEl.removeEventListener('mousemove', handleMouseMove);
      svgEl.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [scaleMode, showSpectralBands, harmonicMarkers, isPlaying, frequency, subHarmonicsActive, overtonesActive, theme]);

  return (
    <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3 font-mono text-xs">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 cyber:bg-cyan-400/20 cyber:border-cyan-400 cyber:text-cyan-300 lab:bg-sky-100 lab:border-sky-300 lab:text-sky-700">
            <BarChart2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 font-mono tracking-wide uppercase">
                D3.js Audio Frequency Spectrum Analyzer
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 cyber:bg-black cyber:text-cyan-300 cyber:border-cyan-400 lab:bg-sky-50 lab:text-sky-800 lab:border-sky-300 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-cyan-400 lab:bg-sky-600 animate-ping' : 'bg-slate-500 lab:bg-slate-400'}`} />
                {isPlaying ? 'LIVE FFT ANALYSIS' : 'STANDBY HARMONIC MATRIX'}
              </span>
            </div>
            <p className="text-xs text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-0.5">
              Continuous D3-powered Fourier spectral transform mapping {frequency}Hz fundamental carrier, undertones & acoustic overtone energy.
            </p>
          </div>
        </div>

        {/* View Options & Scale Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Scale mode: Log vs Linear */}
          <div className="flex bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-300 rounded-lg p-0.5">
            <button
              onClick={() => setScaleMode('log')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                scaleMode === 'log'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:text-white lab:border-sky-800'
                  : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600 lab:hover:text-slate-900'
              }`}
              title="Acoustic logarithmic octave scale"
            >
              Log Scale (Acoustic)
            </button>
            <button
              onClick={() => setScaleMode('linear')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                scaleMode === 'linear'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:text-white lab:border-sky-800'
                  : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600 lab:hover:text-slate-900'
              }`}
              title="Linear Hz frequency scale"
            >
              Linear Hz
            </button>
          </div>

          {/* Spectral Bands Toggle */}
          <button
            onClick={() => setShowSpectralBands(!showSpectralBands)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
              showSpectralBands
                ? 'bg-slate-950 text-cyan-300 border-cyan-500/40 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-50 lab:text-sky-800 lab:border-sky-400'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300 cyber:bg-black cyber:text-zinc-300 cyber:border-cyan-500/40 lab:bg-white lab:text-slate-600 lab:border-slate-300'
            }`}
            title="Toggle discrete spectral energy bars"
          >
            Bars: {showSpectralBands ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Real-time Spectrum Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] bg-slate-950/80 cyber:bg-black lab:bg-white p-2.5 rounded-lg border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
        <div>
          <span className="text-slate-500 cyber:text-zinc-300 lab:text-slate-500 block text-[9px] uppercase">Fundamental Carrier:</span>
          <span className="text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 font-bold flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
            {frequency} Hz (Pythagorean)
          </span>
        </div>
        <div>
          <span className="text-slate-500 cyber:text-zinc-300 lab:text-slate-500 block text-[9px] uppercase">Peak Spectral Power:</span>
          <span className="text-emerald-300 cyber:text-emerald-300 lab:text-emerald-700 font-bold">
            {peakFreq} Hz ({peakDb} dB)
          </span>
        </div>
        <div>
          <span className="text-slate-500 cyber:text-zinc-300 lab:text-slate-500 block text-[9px] uppercase">Active Harmonic Markers:</span>
          <span className="text-amber-300 cyber:text-yellow-300 lab:text-amber-700 font-bold">
            {harmonicMarkers.length} Nodes Tracked
          </span>
        </div>
        <div>
          <span className="text-slate-500 cyber:text-zinc-300 lab:text-slate-500 block text-[9px] uppercase">Analysis Bandwidth:</span>
          <span className="text-slate-300 cyber:text-white lab:text-slate-700 font-bold">20 Hz – 2.6 kHz</span>
        </div>
      </div>

      {/* Main D3 Canvas / SVG Viewport */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden border border-cyan-500/30 cyber:border-cyan-400 lab:border-slate-300 bg-[#010409] cyber:bg-black lab:bg-white shadow-inner lab:shadow-none"
      >
        <svg ref={svgRef} className="w-full h-56 block cursor-crosshair select-none" />

        {/* Live Hover Tooltip */}
        {hoveredNode && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(window.innerWidth - 180, hoveredNode.x + 10)}px`,
              top: `${Math.max(10, hoveredNode.y - 45)}px`,
              pointerEvents: 'none',
            }}
            className="bg-slate-950/95 cyber:bg-black lab:bg-white border border-cyan-400 cyber:border-cyan-300 lab:border-sky-600 text-cyan-300 cyber:text-cyan-300 lab:text-sky-800 text-[10px] font-mono px-2 py-1 rounded shadow-2xl lab:shadow-md z-20 backdrop-blur-md"
          >
            <div className="font-bold flex items-center gap-1">
              <span>{hoveredNode.freq} Hz</span>
              <span className="text-slate-500 lab:text-slate-400">|</span>
              <span className="text-emerald-300 cyber:text-emerald-300 lab:text-emerald-700">{Math.round(((hoveredNode.amp / 255) * 60 - 60) * 10) / 10} dB</span>
            </div>
            <div className="text-[9px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
              {Math.abs(hoveredNode.freq - frequency) < 15
                ? '★ Carrier Fundamental'
                : hoveredNode.freq < frequency
                ? 'Sub-Harmonic Undertone Range'
                : 'Overtone / Harmonic Resonance'}
            </div>
          </div>
        )}

        {/* Harmonic Legend Chips */}
        <div className="absolute bottom-2 left-3 flex flex-wrap gap-2 text-[9px] font-mono pointer-events-none bg-slate-950/80 cyber:bg-black lab:bg-white/95 px-2 py-1 rounded border border-slate-800/80 cyber:border-cyan-500/50 lab:border-slate-300">
          <span className="flex items-center gap-1 text-cyan-400 cyber:text-cyan-300 lab:text-sky-700">
            <span className="w-2 h-2 rounded-full bg-cyan-400 lab:bg-sky-600" />
            Carrier Fundamental ({frequency}Hz)
          </span>
          {subHarmonicsActive && (
            <span className="flex items-center gap-1 text-emerald-400 cyber:text-emerald-300 lab:text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 lab:bg-emerald-600" />
              Sub-Harmonic Undertones
            </span>
          )}
          {overtonesActive && (
            <span className="flex items-center gap-1 text-amber-400 cyber:text-yellow-300 lab:text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-400 lab:bg-amber-600" />
              Nonary Overtones
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

