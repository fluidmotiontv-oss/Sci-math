import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BarChart3, Radio, Activity } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { AppTheme } from '../types/dragon';

interface D3HarmonicBarAnalyzerProps {
  isPlaying: boolean;
  fundamentalBaseHz: number;
  activeFrequencyHz: number;
  intervalLabel: string;
  intervalRatio: number;
  isLfoActive?: boolean;
  theme?: AppTheme;
}

interface BarDatum {
  index: number;
  centerHz: number;
  minHz: number;
  maxHz: number;
  amp: number; // 0..255
  peakHold: number; // 0..255
}

const BAR_COUNT = 44;

export const D3HarmonicBarAnalyzer: React.FC<D3HarmonicBarAnalyzerProps> = ({
  isPlaying,
  fundamentalBaseHz,
  activeFrequencyHz,
  intervalLabel,
  intervalRatio,
  isLfoActive = false,
  theme = 'sovereign-dark',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const animRef = useRef<number>(0);
  const peakHoldArrRef = useRef<number[]>(new Array(BAR_COUNT).fill(0));

  // Mutable ref for high-frequency animation props so D3 SVG isn't torn down on LFO ticks
  const livePropsRef = useRef({
    isPlaying,
    fundamentalBaseHz,
    activeFrequencyHz,
    intervalRatio,
  });

  useEffect(() => {
    livePropsRef.current = {
      isPlaying,
      fundamentalBaseHz,
      activeFrequencyHz,
      intervalRatio,
    };
  }, [isPlaying, fundamentalBaseHz, activeFrequencyHz, intervalRatio]);

  const [bandRange, setBandRange] = useState<'harmonic' | 'wide'>('harmonic');
  const [showPeakCaps, setShowPeakCaps] = useState<boolean>(true);
  const [peakTelemetry, setPeakTelemetry] = useState<{ freqHz: number; db: number }>({
    freqHz: Math.round(activeFrequencyHz),
    db: -12.0,
  });
  const [hoveredBar, setHoveredBar] = useState<BarDatum | null>(null);

  const freqBounds = useMemo(
    () => (bandRange === 'harmonic' ? { min: 60, max: 1200 } : { min: 20, max: 2400 }),
    [bandRange]
  );

  const palette = useMemo(() => {
    if (theme === 'minimalist-lab') {
      return {
        bg: '#ffffff',
        grid: '#cbd5e1',
        axisText: '#475569',
        axisLine: '#94a3b8',
        barDefault: '#38bdf8',
        barActive: '#0284c7',
        barHarmonic: '#c026d3',
        barFundamental: '#059669',
        peakCap: '#d97706',
        markerBase: '#059669',
        markerActive: '#0284c7',
      };
    }
    if (theme === 'high-contrast-cyber') {
      return {
        bg: '#000000',
        grid: '#164e63',
        axisText: '#e0f2fe',
        axisLine: '#22d3ee',
        barDefault: '#0891b2',
        barActive: '#00f0ff',
        barHarmonic: '#f0abfc',
        barFundamental: '#4ade80',
        peakCap: '#fde047',
        markerBase: '#4ade80',
        markerActive: '#00f0ff',
      };
    }
    return {
      bg: '#020617',
      grid: '#1e293b',
      axisText: '#64748b',
      axisLine: '#334155',
      barDefault: '#0ea5e9',
      barActive: '#38bdf8',
      barHarmonic: '#e879f9',
      barFundamental: '#34d399',
      peakCap: '#facc15',
      markerBase: '#34d399',
      markerActive: '#38bdf8',
    };
  }, [theme]);

  useEffect(() => {
    const svgEl = svgRef.current;
    const container = containerRef.current;
    if (!svgEl || !container) return;

    let width = container.clientWidth || 640;
    const height = 216;
    const margin = { top: 26, right: 20, bottom: 34, left: 46 };

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const defs = svg.append('defs');
    const barGrad = defs
      .append('linearGradient')
      .attr('id', 'resonator-bar-grad')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');
    barGrad.append('stop').attr('offset', '0%').attr('stop-color', palette.barDefault).attr('stop-opacity', 0.45);
    barGrad.append('stop').attr('offset', '70%').attr('stop-color', palette.barActive).attr('stop-opacity', 0.85);
    barGrad.append('stop').attr('offset', '100%').attr('stop-color', palette.barHarmonic).attr('stop-opacity', 0.98);

    const xBand = d3
      .scaleBand<number>()
      .domain(d3.range(BAR_COUNT))
      .range([margin.left, width - margin.right])
      .paddingInner(0.2)
      .paddingOuter(0.1);

    const xLinear = d3
      .scaleLinear()
      .domain([freqBounds.min, freqBounds.max])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 255])
      .range([height - margin.bottom, margin.top]);

    // Horizontal grid lines
    const gridGroup = svg.append('g').attr('class', 'grid');
    gridGroup
      .selectAll('line.h-grid')
      .data([64, 128, 192, 255])
      .enter()
      .append('line')
      .attr('class', 'h-grid')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', palette.grid)
      .attr('stroke-dasharray', '3,3');

    // Bottom frequency axis
    const tickValues =
      bandRange === 'harmonic'
        ? [108, 216, 432, 528, 699, 864, 1080, 1200]
        : [108, 216, 432, 699, 864, 1296, 1728, 2160];

    const xAxis = d3
      .axisBottom(xLinear)
      .tickValues(tickValues)
      .tickFormat((d) => {
        const val = Number(d);
        return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`;
      });

    const xAxisG = svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .attr('color', palette.axisText)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');
    xAxisG.select('.domain').attr('stroke', palette.axisLine);

    // Left amplitude dB axis
    const yAxis = d3
      .axisLeft(yScale)
      .tickValues([0, 64, 128, 192, 255])
      .tickFormat((d) => {
        const v = Number(d);
        if (v === 255) return '0 dB';
        if (v === 192) return '-12 dB';
        if (v === 128) return '-24 dB';
        if (v === 64) return '-40 dB';
        return '-60 dB';
      });

    const yAxisG = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxis)
      .attr('color', palette.axisText)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');
    yAxisG.select('.domain').attr('stroke', palette.axisLine);

    const barsLayer = svg.append('g').attr('class', 'bars-layer');
    const capsLayer = svg.append('g').attr('class', 'caps-layer');
    const markersLayer = svg.append('g').attr('class', 'markers-layer');

    // Reference marker elements for Fundamental Base and Active Modulated Frequency
    const baseMarkerG = markersLayer.append('g');
    const baseMarkerLine = baseMarkerG
      .append('line')
      .attr('y1', margin.top - 6)
      .attr('y2', height - margin.bottom)
      .attr('stroke', palette.markerBase)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3');
    const baseMarkerText = baseMarkerG
      .append('text')
      .attr('y', margin.top - 10)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', palette.markerBase)
      .attr('text-anchor', 'middle');

    const activeMarkerG = markersLayer.append('g');
    const activeMarkerLine = activeMarkerG
      .append('line')
      .attr('y1', margin.top - 6)
      .attr('y2', height - margin.bottom)
      .attr('stroke', palette.markerActive)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,2');
    const activeMarkerText = activeMarkerG
      .append('text')
      .attr('y', margin.top - 10)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', palette.markerActive)
      .attr('text-anchor', 'middle');

    // Reusable bar data structure
    const span = freqBounds.max - freqBounds.min;
    const binWidthHz = span / BAR_COUNT;
    const barsData: BarDatum[] = Array.from({ length: BAR_COUNT }, (_, idx) => {
      const minHz = freqBounds.min + idx * binWidthHz;
      const maxHz = minHz + binWidthHz;
      return {
        index: idx,
        centerHz: (minHz + maxHz) / 2,
        minHz,
        maxHz,
        amp: 0,
        peakHold: 0,
      };
    });

    let freqBuf: Uint8Array<ArrayBuffer> | null = null;
    let idleTick = 0;
    let lastTelemetryPush = 0;

    const renderFrame = (now: number) => {
      animRef.current = requestAnimationFrame(renderFrame);
      const { isPlaying: playing, fundamentalBaseHz: fBase, activeFrequencyHz: fActive } =
        livePropsRef.current;

      const analyser = audioEngine.getAnalyser();
      const sampleRate = audioEngine.getSampleRate();

      let maxAmp = 0;
      let maxFreqHz = fActive;

      if (playing && analyser) {
        const binCount = analyser.frequencyBinCount;
        if (!freqBuf || freqBuf.length !== binCount) {
          freqBuf = new Uint8Array(binCount);
        }
        analyser.getByteFrequencyData(freqBuf);

        const hzPerFftBin = sampleRate / (binCount * 2);

        for (let i = 0; i < BAR_COUNT; i++) {
          const b = barsData[i];
          const startBin = Math.max(0, Math.floor(b.minHz / hzPerFftBin));
          const endBin = Math.min(binCount - 1, Math.max(startBin, Math.ceil(b.maxHz / hzPerFftBin)));

          let peakInRange = 0;
          for (let j = startBin; j <= endBin; j++) {
            if (freqBuf[j] > peakInRange) peakInRange = freqBuf[j];
          }
          b.amp = peakInRange;

          // Smooth peak-hold decay
          if (peakInRange >= peakHoldArrRef.current[i]) {
            peakHoldArrRef.current[i] = peakInRange;
          } else {
            peakHoldArrRef.current[i] = Math.max(peakInRange, peakHoldArrRef.current[i] - 1.6);
          }
          b.peakHold = peakHoldArrRef.current[i];

          if (b.amp > maxAmp) {
            maxAmp = b.amp;
            maxFreqHz = b.centerHz;
          }
        }
      } else {
        // Standby Harmonic Bar Preview modeling fundamental, modulated interval & overtones
        idleTick += 0.05;
        for (let i = 0; i < BAR_COUNT; i++) {
          const b = barsData[i];
          const distActive = Math.abs(b.centerHz - fActive);
          const distBase = Math.abs(b.centerHz - fBase);
          const dist2nd = Math.abs(b.centerHz - fActive * 2);
          const distSub = Math.abs(b.centerHz - fActive * 0.5);

          const activePeak = Math.exp(-Math.pow(distActive / (binWidthHz * 1.15), 2)) * 175;
          const basePeak = Math.exp(-Math.pow(distBase / (binWidthHz * 1.1), 2)) * 95;
          const overtone2 = Math.exp(-Math.pow(dist2nd / (binWidthHz * 1.25), 2)) * 75;
          const subHalf = Math.exp(-Math.pow(distSub / (binWidthHz * 1.1), 2)) * 60;
          const ripple = (Math.sin(i * 0.45 + idleTick) + 1) * 5 + 6;

          const val = Math.min(245, activePeak + basePeak + overtone2 + subHalf + ripple);
          b.amp = val;
          peakHoldArrRef.current[i] = Math.max(val, peakHoldArrRef.current[i] - 1.4);
          b.peakHold = peakHoldArrRef.current[i];

          if (b.amp > maxAmp) {
            maxAmp = b.amp;
            maxFreqHz = b.centerHz;
          }
        }
      }

      // Throttle React state readout updates (~8fps) while SVG bars run smoothly at 60fps
      if (now - lastTelemetryPush > 125) {
        lastTelemetryPush = now;
        const dbVal = Math.round(((maxAmp / 255) * 60 - 60) * 10) / 10;
        setPeakTelemetry({ freqHz: Math.round(maxFreqHz), db: dbVal });
      }

      // Bind & update frequency bars
      const bars = barsLayer.selectAll<SVGRectElement, BarDatum>('rect.freq-bar').data(barsData, (d) => d.index);
      bars
        .enter()
        .append('rect')
        .attr('class', 'freq-bar')
        .attr('rx', 2)
        .style('cursor', 'crosshair')
        .on('mouseenter', (_ev, d) => setHoveredBar({ ...d }))
        .on('mousemove', (_ev, d) => setHoveredBar({ ...d }))
        .on('mouseleave', () => setHoveredBar(null))
        .merge(bars)
        .attr('x', (d) => xBand(d.index) ?? margin.left)
        .attr('width', xBand.bandwidth())
        .attr('y', (d) => yScale(d.amp))
        .attr('height', (d) => Math.max(2, height - margin.bottom - yScale(d.amp)))
        .attr('fill', (d) => {
          if (Math.abs(d.centerHz - fActive) <= binWidthHz * 0.9) return palette.barHarmonic;
          if (Math.abs(d.centerHz - fBase) <= binWidthHz * 0.9) return palette.barFundamental;
          if (d.amp > 120) return palette.barActive;
          return 'url(#resonator-bar-grad)';
        });

      // Peak-hold caps
      if (showPeakCaps) {
        const caps = capsLayer.selectAll<SVGRectElement, BarDatum>('rect.peak-cap').data(barsData, (d) => d.index);
        caps
          .enter()
          .append('rect')
          .attr('class', 'peak-cap')
          .attr('height', 2.5)
          .attr('rx', 1)
          .attr('fill', palette.peakCap)
          .merge(caps)
          .attr('x', (d) => xBand(d.index) ?? margin.left)
          .attr('width', xBand.bandwidth())
          .attr('y', (d) => Math.max(margin.top, yScale(d.peakHold) - 3))
          .attr('opacity', (d) => (d.peakHold > 12 ? 0.9 : 0.2));
      } else {
        capsLayer.selectAll('rect.peak-cap').remove();
      }

      // Update vertical markers for Base vs Active Modulated Frequency
      const clampedBaseX = xLinear(Math.max(freqBounds.min, Math.min(freqBounds.max, fBase)));
      baseMarkerLine.attr('x1', clampedBaseX).attr('x2', clampedBaseX);
      baseMarkerText
        .attr('x', Math.max(margin.left + 28, Math.min(width - margin.right - 28, clampedBaseX)))
        .text(`f₀ ${Math.round(fBase)}Hz`)
        .attr('opacity', Math.abs(fBase - fActive) < 18 ? 0 : 0.9);

      const clampedActiveX = xLinear(Math.max(freqBounds.min, Math.min(freqBounds.max, fActive)));
      activeMarkerLine.attr('x1', clampedActiveX).attr('x2', clampedActiveX);
      activeMarkerText
        .attr('x', Math.max(margin.left + 32, Math.min(width - margin.right - 32, clampedActiveX)))
        .text(`Active ${Math.round(fActive * 10) / 10}Hz`);
    };

    animRef.current = requestAnimationFrame(renderFrame);

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 640;
      svg.attr('width', width);
      xBand.range([margin.left, width - margin.right]);
      xLinear.range([margin.left, width - margin.right]);
      xAxisG.call(xAxis);
      gridGroup.selectAll('line.h-grid').attr('x2', width - margin.right);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [bandRange, freqBounds, palette, showPeakCaps]);

  return (
    <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 cyber:bg-cyan-400/20 cyber:border-cyan-400 cyber:text-cyan-300 lab:bg-sky-100 lab:border-sky-300 lab:text-sky-700">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 uppercase tracking-wide">
                D3.js Frequency Domain Bar Analyzer
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 cyber:bg-black cyber:text-cyan-300 cyber:border-cyan-400 lab:bg-sky-50 lab:text-sky-800 lab:border-sky-300 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                {isPlaying ? 'LIVE FFT SPECTRUM' : 'HARMONIC MODEL PREVIEW'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 font-sans mt-0.5">
              Real-time {BAR_COUNT}-band FFT bar spectrum tracking fundamental ({fundamentalBaseHz}Hz) &amp; interval ({intervalLabel} · {intervalRatio.toFixed(4)}×).
            </p>
          </div>
        </div>

        {/* Analyzer Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-300 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setBandRange('harmonic')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                bandRange === 'harmonic'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:text-white'
                  : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600'
              }`}
            >
              60–1200 Hz
            </button>
            <button
              type="button"
              onClick={() => setBandRange('wide')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                bandRange === 'wide'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:text-white'
                  : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600'
              }`}
            >
              20–2400 Hz
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPeakCaps((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
              showPeakCaps
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 cyber:bg-yellow-300 cyber:text-black lab:bg-amber-50 lab:text-amber-800 lab:border-amber-300'
                : 'bg-slate-950 text-slate-400 border-slate-800 cyber:bg-black cyber:text-zinc-300 lab:bg-white lab:text-slate-600 lab:border-slate-300'
            }`}
          >
            Peak Caps: {showPeakCaps ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Telemetry Readout Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-950/80 cyber:bg-black lab:bg-white p-2 rounded-lg border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
        <div>
          <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-500 block text-[9px] uppercase">Base Anchor</span>
          <span className="text-emerald-300 cyber:text-emerald-300 lab:text-emerald-700 font-bold flex items-center gap-1">
            <Radio className="w-3 h-3" />
            {fundamentalBaseHz} Hz
          </span>
        </div>
        <div>
          <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-500 block text-[9px] uppercase">Active Output</span>
          <span className="text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 font-bold">
            {activeFrequencyHz} Hz {isLfoActive ? '(LFO)' : ''}
          </span>
        </div>
        <div>
          <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-500 block text-[9px] uppercase">Peak Spectral Bin</span>
          <span className="text-amber-300 cyber:text-yellow-300 lab:text-amber-700 font-bold flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {peakTelemetry.freqHz} Hz ({peakTelemetry.db} dB)
          </span>
        </div>
        <div>
          <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-500 block text-[9px] uppercase">
            {hoveredBar ? 'Hovered Band' : 'FFT Bins'}
          </span>
          <span className="text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-700 font-bold">
            {hoveredBar
              ? `${Math.round(hoveredBar.minHz)}–${Math.round(hoveredBar.maxHz)}Hz`
              : `${BAR_COUNT} Discrete Bands`}
          </span>
        </div>
      </div>

      {/* D3 Bar Chart SVG Container */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden border border-cyan-500/30 cyber:border-cyan-400 lab:border-slate-300 bg-[#020617] cyber:bg-black lab:bg-white"
      >
        <svg ref={svgRef} className="w-full h-54 block select-none" />
        <div className="absolute bottom-1.5 right-3 flex items-center gap-3 text-[9px] pointer-events-none bg-slate-950/80 cyber:bg-black lab:bg-white/95 px-2 py-0.5 rounded border border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-300">
          <span className="flex items-center gap-1 text-emerald-300 lab:text-emerald-700">
            <span className="w-2 h-2 rounded-xs bg-emerald-400" /> Fundamental
          </span>
          <span className="flex items-center gap-1 text-fuchsia-300 lab:text-fuchsia-700">
            <span className="w-2 h-2 rounded-xs bg-fuchsia-400" /> Interval Peak
          </span>
          {showPeakCaps && (
            <span className="flex items-center gap-1 text-amber-300 lab:text-amber-700">
              <span className="w-2 h-0.5 bg-amber-400" /> Peak Hold
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
