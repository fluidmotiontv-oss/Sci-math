import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { audioEngine } from '../utils/audioEngine';
import { AppTheme } from '../types/dragon';
import { Activity, Radio, Waves, Zap } from 'lucide-react';

interface D3CircularWaveVisualizerProps {
  frequency: number;
  isAudioPlaying: boolean;
  pulseSync: boolean;
  polarityAlpha: number;
  polarityBeta: number;
  theme?: AppTheme;
}

type PolarViewMode = 'combined' | 'standing' | 'spectrum';

interface PolarPoint {
  angle: number;
  radius: number;
}

export const D3CircularWaveVisualizer: React.FC<D3CircularWaveVisualizerProps> = ({
  frequency,
  isAudioPlaying,
  pulseSync,
  polarityAlpha,
  polarityBeta,
  theme = 'sovereign-dark',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const animRef = useRef<number>(0);

  const [viewMode, setViewMode] = useState<PolarViewMode>('combined');
  const [liveMetrics, setLiveMetrics] = useState<{
    rmsPct: number;
    pulseGain: number;
    peakHarmonic: number;
  }>({
    rmsPct: 0,
    pulseGain: 1.0,
    peakHarmonic: frequency,
  });

  const pulseRateHz = useMemo(() => Math.max(0.1, frequency / 108), [frequency]);
  const nonaryLobes = useMemo(() => Math.max(3, Math.min(24, Math.round(frequency / 54))), [frequency]);

  const palette = useMemo(() => {
    if (theme === 'minimalist-lab') {
      return {
        bgInner: '#f8fafc',
        bgOuter: '#e2e8f0',
        ringStroke: '#cbd5e1',
        spokeStroke: '#cbd5e1',
        labelText: '#475569',
        waveStroke: '#0284c7',
        waveFillStart: '#0284c7',
        waveFillEnd: '#0ea5e9',
        pulseStroke: '#059669',
        betaStroke: '#a21caf',
        fftBar: '#0284c7',
        centerFreqText: '#0f172a',
        centerSubText: '#0369a1',
        useGlow: false,
      };
    }
    if (theme === 'high-contrast-cyber') {
      return {
        bgInner: '#030712',
        bgOuter: '#000000',
        ringStroke: '#155e75',
        spokeStroke: '#0e7490',
        labelText: '#a5f3fc',
        waveStroke: '#00f0ff',
        waveFillStart: '#00f0ff',
        waveFillEnd: '#f0abfc',
        pulseStroke: '#4ade80',
        betaStroke: '#f0abfc',
        fftBar: '#fde047',
        centerFreqText: '#ffffff',
        centerSubText: '#fde047',
        useGlow: true,
      };
    }
    return {
      bgInner: '#0b1324',
      bgOuter: '#020617',
      ringStroke: '#1e293b',
      spokeStroke: '#1e293b',
      labelText: '#64748b',
      waveStroke: '#38bdf8',
      waveFillStart: '#38bdf8',
      waveFillEnd: '#e879f9',
      pulseStroke: '#34d399',
      betaStroke: '#e879f9',
      fftBar: '#facc15',
      centerFreqText: '#f8fafc',
      centerSubText: '#34d399',
      useGlow: true,
    };
  }, [theme]);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const size = 280;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = 114;
    const baseR = 72;
    const innerR = 46;
    const numSamples = 180;
    const fftPetalCount = 36;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${size} ${size}`);

    const defs = svg.append('defs');

    // Radial gradient for wave area fill
    const areaGrad = defs
      .append('radialGradient')
      .attr('id', 'd9-circular-wave-grad')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');

    areaGrad
      .append('stop')
      .attr('offset', '25%')
      .attr('stop-color', palette.waveFillStart)
      .attr('stop-opacity', 0.08);
    areaGrad
      .append('stop')
      .attr('offset', '75%')
      .attr('stop-color', palette.waveFillStart)
      .attr('stop-opacity', 0.32);
    areaGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', palette.waveFillEnd)
      .attr('stop-opacity', 0.45);

    if (palette.useGlow) {
      const glow = defs.append('filter').attr('id', 'd9-circular-glow');
      glow.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'blur');
      const merge = glow.append('feMerge');
      merge.append('feMergeNode').attr('in', 'blur');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');
    }

    const root = svg.append('g').attr('transform', `translate(${cx}, ${cy})`);

    // 1. Subtle Polar Background & Concentric Reference Rings
    root
      .append('circle')
      .attr('r', maxR + 6)
      .attr('fill', palette.bgOuter)
      .attr('fill-opacity', theme === 'minimalist-lab' ? 0.55 : 0.7)
      .attr('stroke', palette.ringStroke)
      .attr('stroke-width', 1);

    [0.38, 0.65, 0.88, 1.0].forEach((ratio, idx) => {
      root
        .append('circle')
        .attr('r', maxR * ratio)
        .attr('fill', 'none')
        .attr('stroke', palette.ringStroke)
        .attr('stroke-width', idx === 1 ? 1 : 0.8)
        .attr('stroke-dasharray', idx === 2 ? '3,3' : 'none');
    });

    // 2. Nonary 9-Sector Radial Spokes (every 40 degrees)
    const sectors = d3.range(9);
    const spokeGroup = root.append('g');
    sectors.forEach((s) => {
      const angle = (s / 9) * Math.PI * 2 - Math.PI / 2;
      const x1 = Math.cos(angle) * innerR;
      const y1 = Math.sin(angle) * innerR;
      const x2 = Math.cos(angle) * (maxR + 4);
      const y2 = Math.sin(angle) * (maxR + 4);
      const lx = Math.cos(angle) * (maxR + 14);
      const ly = Math.sin(angle) * (maxR + 14);

      spokeGroup
        .append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', palette.spokeStroke)
        .attr('stroke-width', 0.8)
        .attr('stroke-opacity', 0.75);

      spokeGroup
        .append('text')
        .attr('x', lx)
        .attr('y', ly + 3)
        .attr('text-anchor', 'middle')
        .attr('fill', palette.labelText)
        .attr('font-family', 'monospace')
        .attr('font-size', '8px')
        .text(`${s + 1}`);
    });

    // 3. Polarity Alpha/Beta Balance Arc Indicators (around inner ring)
    const alphaArcGen = d3
      .arc<unknown>()
      .innerRadius(innerR - 4)
      .outerRadius(innerR - 1.5)
      .startAngle(0)
      .endAngle((polarityAlpha / 100) * Math.PI);

    const betaArcGen = d3
      .arc<unknown>()
      .innerRadius(innerR - 4)
      .outerRadius(innerR - 1.5)
      .startAngle(Math.PI)
      .endAngle(Math.PI + (polarityBeta / 100) * Math.PI);

    root
      .append('path')
      .attr('d', alphaArcGen({}) || '')
      .attr('fill', palette.waveStroke)
      .attr('fill-opacity', 0.85);

    root
      .append('path')
      .attr('d', betaArcGen({}) || '')
      .attr('fill', palette.betaStroke)
      .attr('fill-opacity', 0.85);

    // 4. Radial Spectrum Petals (D3 scale-mapped FFT bars)
    const petalGroup = root.append('g');
    const petals = petalGroup
      .selectAll('line')
      .data(d3.range(fftPetalCount))
      .enter()
      .append('line')
      .attr('stroke', palette.fftBar)
      .attr('stroke-width', 2.2)
      .attr('stroke-linecap', 'round')
      .attr('stroke-opacity', 0.75);

    // 5. D3 Radial Area + Line Generators
    const areaRadial = d3
      .areaRadial<PolarPoint>()
      .angle((d) => d.angle)
      .innerRadius(innerR)
      .outerRadius((d) => d.radius)
      .curve(d3.curveCardinalClosed);

    const lineRadial = d3
      .lineRadial<PolarPoint>()
      .angle((d) => d.angle)
      .radius((d) => d.radius)
      .curve(d3.curveCardinalClosed);

    const waveAreaPath = root
      .append('path')
      .attr('fill', 'url(#d9-circular-wave-grad)');

    const secondaryPulsePath = root
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', palette.pulseStroke)
      .attr('stroke-width', 1.4)
      .attr('stroke-opacity', 0.85)
      .attr('stroke-dasharray', '4,2');

    const waveStrokePath = root
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', palette.waveStroke)
      .attr('stroke-width', 2.2)
      .attr('filter', palette.useGlow ? 'url(#d9-circular-glow)' : null);

    // 6. Center Telemetry Hub
    root
      .append('circle')
      .attr('r', innerR - 6)
      .attr('fill', palette.bgInner)
      .attr('stroke', palette.ringStroke)
      .attr('stroke-width', 1);

    const centerPulseText = root
      .append('text')
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('fill', palette.centerSubText)
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('font-size', '13px')
      .text(`${pulseRateHz.toFixed(2)} Hz`);

    root
      .append('text')
      .attr('y', 8)
      .attr('text-anchor', 'middle')
      .attr('fill', palette.labelText)
      .attr('font-family', 'monospace')
      .attr('font-size', '7.5px')
      .text('PULSE ENVELOPE');

    const centerOscText = root
      .append('text')
      .attr('y', 21)
      .attr('text-anchor', 'middle')
      .attr('fill', palette.centerFreqText)
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('font-size', '10px')
      .text(`${frequency} Hz ${isAudioPlaying ? 'LIVE' : 'IDLE'}`);

    // Reusable typed arrays for audio capture
    let timeData: Float32Array<ArrayBuffer> | null = null;
    let freqData: Uint8Array<ArrayBuffer> | null = null;
    let lastUiUpdate = 0;

    const renderFrame = (now: number) => {
      const t = now * 0.001;
      const analyser = audioEngine.getAnalyser();
      const audioActive = isAudioPlaying && analyser !== null && audioEngine.getIsRunning();

      let rms = 0;
      if (audioActive && analyser) {
        if (!timeData || timeData.length !== analyser.fftSize) {
          timeData = new Float32Array(analyser.fftSize);
        }
        if (!freqData || freqData.length !== analyser.frequencyBinCount) {
          freqData = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getFloatTimeDomainData(timeData);
        analyser.getByteFrequencyData(freqData);

        let sumSq = 0;
        for (let i = 0; i < timeData.length; i++) {
          sumSq += timeData[i] * timeData[i];
        }
        rms = Math.sqrt(sumSq / timeData.length);
      }

      // Harmonic pulse oscillation rate matched to Dragon 9 ThreeViewport (f / 108 Hz)
      const pulsePhase = t * pulseRateHz * Math.PI * 2;
      const pulseAmp = pulseSync ? (audioActive ? 0.75 : 0.45) : 0.14;
      const pulseFactor = 1.0 + pulseAmp * Math.sin(pulsePhase);
      const breathRadiusOffset = (pulseFactor - 1.0) * 18;

      const primaryPoints: PolarPoint[] = [];
      const secondaryPoints: PolarPoint[] = [];

      const harmonicK = nonaryLobes;
      const harmonicK2 = Math.max(2, Math.round(harmonicK / 2));

      for (let i = 0; i < numSamples; i++) {
        const angle = (i / numSamples) * Math.PI * 2;

        // Live PCM audio displacement normalized around circle
        let pcmSample = 0;
        if (audioActive && timeData) {
          const sampleIdx = Math.floor((i / numSamples) * Math.min(512, timeData.length));
          pcmSample = timeData[sampleIdx] * 26;
        }

        // Harmonic standing wave + rotary oscillation at active frequency
        const speedMultiplier = pulseSync ? Math.max(0.25, pulseFactor) : 1.0;
        const wave1 = Math.sin(angle * harmonicK - t * 2.8 * speedMultiplier);
        const wave2 = Math.cos(angle * harmonicK2 + t * 1.9);

        // Live FFT bin influence for spectrum / combined mode
        let fftBoost = 0;
        if (audioActive && freqData) {
          const bin = Math.min(freqData.length - 1, Math.floor((i / numSamples) * 96));
          fftBoost = (freqData[bin] / 255) * 18;
        } else {
          const simPeak = Math.exp(-Math.pow((Math.sin(angle * 3 - t * 2) - 0.5) * 2, 2));
          fftBoost = simPeak * 5;
        }

        let rOuter = baseR + breathRadiusOffset;
        if (viewMode === 'combined') {
          rOuter += wave1 * (audioActive ? 10 : 6.5) + wave2 * 4.5 + pcmSample + fftBoost * 0.4;
        } else if (viewMode === 'standing') {
          rOuter += (wave1 * 12 + wave2 * 6) * (pulseSync ? pulseFactor * 0.85 : 1) + pcmSample * 0.5;
        } else {
          // 'spectrum' radial emphasis
          rOuter = baseR + breathRadiusOffset * 0.6 + fftBoost * 1.45 + Math.abs(pcmSample) * 0.45;
        }

        const clampedOuter = Math.max(innerR + 4, Math.min(maxR + 4, rOuter));
        primaryPoints.push({ angle, radius: clampedOuter });

        // Inner pulse-sync ring tracks pure pulse frequency envelope
        const rPulse =
          innerR +
          10 +
          breathRadiusOffset * 0.85 +
          Math.sin(angle * 9 + pulsePhase) * (pulseSync ? 3.5 : 1.5);
        secondaryPoints.push({
          angle,
          radius: Math.max(innerR + 2, Math.min(maxR - 8, rPulse)),
        });
      }

      waveAreaPath.datum(primaryPoints).attr('d', areaRadial);
      waveStrokePath.datum(primaryPoints).attr('d', lineRadial);
      secondaryPulsePath.datum(secondaryPoints).attr('d', lineRadial);

      // Update Radial FFT Petals
      petals
        .attr('x1', (d) => {
          const ang = (d / fftPetalCount) * Math.PI * 2 - Math.PI / 2;
          return Math.cos(ang) * (innerR + 2);
        })
        .attr('y1', (d) => {
          const ang = (d / fftPetalCount) * Math.PI * 2 - Math.PI / 2;
          return Math.sin(ang) * (innerR + 2);
        })
        .attr('x2', (d) => {
          const ang = (d / fftPetalCount) * Math.PI * 2 - Math.PI / 2;
          let mag = 4 + Math.abs(Math.sin(ang * 4 + pulsePhase)) * (pulseSync ? 8 : 3);
          if (audioActive && freqData) {
            const bin = Math.min(freqData.length - 1, Math.floor((d / fftPetalCount) * 80));
            mag = 3 + (freqData[bin] / 255) * 26;
          }
          return Math.cos(ang) * (innerR + 2 + mag);
        })
        .attr('y2', (d) => {
          const ang = (d / fftPetalCount) * Math.PI * 2 - Math.PI / 2;
          let mag = 4 + Math.abs(Math.sin(ang * 4 + pulsePhase)) * (pulseSync ? 8 : 3);
          if (audioActive && freqData) {
            const bin = Math.min(freqData.length - 1, Math.floor((d / fftPetalCount) * 80));
            mag = 3 + (freqData[bin] / 255) * 26;
          }
          return Math.sin(ang) * (innerR + 2 + mag);
        });

      centerPulseText.text(`${pulseRateHz.toFixed(2)} Hz`);
      centerOscText.text(`${frequency} Hz ${audioActive ? 'LIVE' : 'SYNC'}`);

      // Throttle React state telemetry updates (~10fps) while D3 SVG animates smoothly at 60fps
      if (now - lastUiUpdate > 100) {
        lastUiUpdate = now;
        const rmsPct = audioActive ? Math.min(100, Math.round(rms * 320)) : Math.round(18 + 10 * Math.abs(Math.sin(pulsePhase)));
        setLiveMetrics({
          rmsPct,
          pulseGain: Number(pulseFactor.toFixed(2)),
          peakHarmonic: frequency,
        });
      }

      animRef.current = requestAnimationFrame(renderFrame);
    };

    animRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [frequency, isAudioPlaying, pulseSync, polarityAlpha, polarityBeta, palette, theme, viewMode, pulseRateHz, nonaryLobes]);

  return (
    <div className="bg-slate-950/80 cyber:bg-black lab:bg-white border border-emerald-500/30 cyber:border-cyan-400 lab:border-slate-200 rounded-xl p-3.5 flex flex-col gap-3">
      {/* Visualizer Header & Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 cyber:text-cyan-300 lab:text-sky-700" />
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 cyber:text-cyan-300 lab:text-sky-800">
              D3.js Circular Pulse Wave Visualizer
            </h4>
            <p className="text-[10px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
              Coupled to {isAudioPlaying ? 'live Web Audio oscillator PCM/FFT' : 'harmonic oscillator standby model'} ({frequency} Hz → {pulseRateHz.toFixed(2)} Hz pulse)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 cyber:bg-black lab:bg-slate-100 border border-slate-800 cyber:border-cyan-500/50 lab:border-slate-300 rounded-lg p-0.5 text-[10px] font-mono">
          {(
            [
              { id: 'combined', label: 'Combined' },
              { id: 'standing', label: 'Standing' },
              { id: 'spectrum', label: 'FFT Polar' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setViewMode(m.id)}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                viewMode === m.id
                  ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/60 font-bold cyber:bg-cyan-400 cyber:text-black lab:bg-white lab:text-sky-700 lab:border-slate-300'
                  : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: D3 Polar SVG + Real-Time Telemetry Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-6 flex items-center justify-center">
          <svg
            ref={svgRef}
            className="w-full max-w-[270px] h-auto select-none"
            role="img"
            aria-label={`D3.js circular pulse wave visualizer operating at ${pulseRateHz.toFixed(2)} Hz from ${frequency} Hz audio oscillator`}
          />
        </div>

        <div className="md:col-span-6 flex flex-col gap-2 font-mono text-[11px] tabular-nums">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-slate-900/90 cyber:bg-[#050811] lab:bg-slate-50 border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
              <span className="text-[9px] text-slate-500 cyber:text-zinc-400 lab:text-slate-500 uppercase flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400 lab:text-emerald-600" />
                Pulse Frequency
              </span>
              <span className="text-sm font-bold text-emerald-300 cyber:text-yellow-300 lab:text-emerald-700 block mt-0.5">
                {pulseRateHz.toFixed(2)} Hz
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/90 cyber:bg-[#050811] lab:bg-slate-50 border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
              <span className="text-[9px] text-slate-500 cyber:text-zinc-400 lab:text-slate-500 uppercase flex items-center gap-1">
                <Waves className="w-3 h-3 text-cyan-400 lab:text-sky-600" />
                Oscillator Output
              </span>
              <span className="text-sm font-bold text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 block mt-0.5">
                {frequency} Hz
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/90 cyber:bg-[#050811] lab:bg-slate-50 border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
              <span className="text-[9px] text-slate-500 cyber:text-zinc-400 lab:text-slate-500 uppercase flex items-center gap-1">
                <Activity className="w-3 h-3 text-fuchsia-400 lab:text-fuchsia-600" />
                Instant Pulse Gain
              </span>
              <span className="text-sm font-bold text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-700 block mt-0.5">
                {liveMetrics.pulseGain.toFixed(2)}×
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/90 cyber:bg-[#050811] lab:bg-slate-50 border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
              <span className="text-[9px] text-slate-500 cyber:text-zinc-400 lab:text-slate-500 uppercase">
                Harmonic Symmetry
              </span>
              <span className="text-sm font-bold text-amber-300 cyber:text-yellow-300 lab:text-amber-700 block mt-0.5">
                {nonaryLobes}-Lobe ({Math.round(frequency / 432 * 9)}N)
              </span>
            </div>
          </div>

          {/* Signal Energy Bar */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 cyber:bg-[#050811] lab:bg-slate-50 border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 cyber:text-zinc-300 lab:text-slate-600 uppercase">
                {isAudioPlaying ? 'Live Oscillator RMS Energy' : 'Simulated Envelope Level'}
              </span>
              <span className={isAudioPlaying ? 'text-emerald-400 cyber:text-emerald-300 lab:text-emerald-700 font-bold' : 'text-cyan-400 lab:text-sky-700'}>
                {liveMetrics.rmsPct}% · {isAudioPlaying ? 'AUDIO ACTIVE' : 'STANDBY'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 cyber:bg-zinc-900 lab:bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-fuchsia-400 transition-all duration-100"
                style={{ width: `${liveMetrics.rmsPct}%` }}
              />
            </div>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 pt-0.5">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-cyan-400 lab:bg-sky-600 inline-block" />
              Carrier Wave ({frequency}Hz)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-emerald-400 lab:bg-emerald-600 inline-block" />
              Pulse Ring ({pulseRateHz.toFixed(2)}Hz)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-amber-400 lab:bg-amber-600 inline-block" />
              FFT Petals
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
