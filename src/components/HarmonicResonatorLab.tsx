import React, { useEffect, useRef, useState } from 'react';
import {
  Waves,
  Sparkles,
  Sliders,
  Play,
  Square,
  RotateCcw,
  Volume2,
  CheckCircle2,
  Activity,
  Zap,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { AppTheme, LogCategory } from '../types/dragon';
import { audioEngine } from '../utils/audioEngine';
import {
  HARMONIC_INTERVAL_FAMILIES,
  HarmonicInterval,
  HarmonicIntervalFamily,
} from '../utils/harmonicIntervals';

interface HarmonicResonatorLabProps {
  currentBaseFrequency: number;
  isAudioPlaying: boolean;
  onFrequencyChange: (freq: number) => void;
  onAudioStateChange: (isPlaying: boolean, freq: number) => void;
  onLogEvent?: (category: LogCategory, title: string, details: string, metadata?: Record<string, unknown>) => void;
  theme?: AppTheme;
}

export const HarmonicResonatorLab: React.FC<HarmonicResonatorLabProps> = ({
  currentBaseFrequency,
  isAudioPlaying,
  onFrequencyChange,
  onAudioStateChange,
  onLogEvent,
  theme = 'sovereign-dark',
}) => {
  const [selectedFamilyId, setSelectedFamilyId] = useState<HarmonicIntervalFamily>('just-intonation');
  const [fundamentalBase, setFundamentalBase] = useState<number>(() =>
    currentBaseFrequency > 0 ? currentBaseFrequency : 432
  );
  const [activeInterval, setActiveInterval] = useState<HarmonicInterval | null>(() => {
    const ji = HARMONIC_INTERVAL_FAMILIES[0];
    return ji.intervals.find((i) => i.ratioDecimal === 1.0) ?? ji.intervals[0];
  });

  // LFO Continuous Modulation State
  const [isLfoActive, setIsLfoActive] = useState<boolean>(false);
  const [lfoRateHz, setLfoRateHz] = useState<number>(0.54); // 0.54 Hz aligns with 54-min nonary hour
  const [lfoDepthPct, setLfoDepthPct] = useState<number>(45); // 0 - 100%
  const [lfoWaveform, setLfoWaveform] = useState<'sine' | 'triangle' | 'pulse'>('sine');

  // Animation & LFO Refs
  const lfoAnimRef = useRef<number>(0);
  const lfoStartTimeRef = useRef<number>(performance.now());
  const visualPhaseRef = useRef<number>(0);

  // Sync fundamentalBase when parent changes base externally
  useEffect(() => {
    if (Math.abs(currentBaseFrequency - fundamentalBase) > 0.05 && !isLfoActive) {
      setFundamentalBase(currentBaseFrequency);
    }
  }, [currentBaseFrequency, fundamentalBase, isLfoActive]);

  const activeFamily =
    HARMONIC_INTERVAL_FAMILIES.find((f) => f.id === selectedFamilyId) ?? HARMONIC_INTERVAL_FAMILIES[0];

  // Calculate target frequency for active interval
  const activeRatio = activeInterval ? activeInterval.ratioDecimal : 1.0;
  const calculatedTargetFreq = Math.round(fundamentalBase * activeRatio * 100) / 100;

  // LFO Modulation loop
  useEffect(() => {
    if (!isLfoActive) {
      if (lfoAnimRef.current) cancelAnimationFrame(lfoAnimRef.current);
      return;
    }

    lfoStartTimeRef.current = performance.now();

    const loop = (now: number) => {
      const elapsedSec = (now - lfoStartTimeRef.current) / 1000;
      const phase = elapsedSec * lfoRateHz * Math.PI * 2;
      visualPhaseRef.current = phase;

      let lfoVal = 0;
      if (lfoWaveform === 'sine') {
        lfoVal = Math.sin(phase);
      } else if (lfoWaveform === 'triangle') {
        lfoVal = (Math.asin(Math.sin(phase)) * 2) / Math.PI;
      } else {
        lfoVal = Math.sin(phase) >= 0 ? 1 : -1;
      }

      // Modulate frequency between fundamentalBase and calculatedTargetFreq
      const targetDelta = (calculatedTargetFreq - fundamentalBase) * (lfoDepthPct / 100);
      const modulatedFreq = fundamentalBase + (targetDelta * (lfoVal + 1)) / 2;
      const clampedFreq = Math.max(20, Math.min(2000, Math.round(modulatedFreq * 10) / 10));

      audioEngine.setFrequency(clampedFreq);
      onFrequencyChange(clampedFreq);

      lfoAnimRef.current = requestAnimationFrame(loop);
    };

    lfoAnimRef.current = requestAnimationFrame(loop);

    return () => {
      if (lfoAnimRef.current) cancelAnimationFrame(lfoAnimRef.current);
    };
  }, [isLfoActive, lfoRateHz, lfoDepthPct, lfoWaveform, fundamentalBase, calculatedTargetFreq, onFrequencyChange]);

  const handleApplyInterval = (interval: HarmonicInterval) => {
    setActiveInterval(interval);
    const newFreq = Math.round(fundamentalBase * interval.ratioDecimal * 100) / 100;
    const clampedFreq = Math.max(20, Math.min(2000, newFreq));

    if (!isLfoActive) {
      audioEngine.setFrequency(clampedFreq);
      onFrequencyChange(clampedFreq);
    }

    onLogEvent?.(
      'AUDIO_SYNTH',
      `Harmonic Interval Engaged: ${interval.name} (${interval.symbol})`,
      `Modulated base frequency from ${fundamentalBase}Hz by ratio ${interval.ratioFraction} (${interval.ratioDecimal.toFixed(4)}, ${interval.cents > 0 ? '+' : ''}${interval.cents} cents) to target ${clampedFreq}Hz.`,
      {
        family: interval.family,
        intervalId: interval.id,
        ratioFraction: interval.ratioFraction,
        ratioDecimal: interval.ratioDecimal,
        cents: interval.cents,
        baseFrequency: fundamentalBase,
        modulatedFrequency: clampedFreq,
      }
    );
  };

  const handleTogglePlay = async () => {
    if (!isAudioPlaying) {
      const ok = await audioEngine.start();
      if (ok) {
        onAudioStateChange(true, currentBaseFrequency);
      }
    } else {
      audioEngine.stop();
      onAudioStateChange(false, currentBaseFrequency);
    }
  };

  const handleResetTo432 = () => {
    setIsLfoActive(false);
    setFundamentalBase(432);
    const unison = activeFamily.intervals.find((i) => i.ratioDecimal === 1.0) ?? activeFamily.intervals[0];
    setActiveInterval(unison);
    audioEngine.setFrequency(432);
    onFrequencyChange(432);

    onLogEvent?.(
      'AUDIO_SYNTH',
      'Harmonic Resonator Reset to 432Hz Fundamental',
      'Harmonic Resonator restored fundamental oscillator to 432Hz Pythagorean natural baseline.',
      { frequency: 432, status: 'NOMINAL_432HZ' }
    );
  };

  // SVG Sacred Harmonic Lissajous Node Visualizer Path
  const renderHarmonicSvgPath = () => {
    const k = activeInterval ? activeInterval.ratioDecimal : 1.0;
    const points: string[] = [];
    const steps = 180;
    const cx = 100;
    const cy = 100;
    const baseRadius = 65;

    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      const r = baseRadius * (1 + 0.22 * Math.cos(k * theta * 4 + visualPhaseRef.current));
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return points.join(' ') + ' Z';
  };

  return (
    <div className="flex flex-col gap-5 text-slate-100 cyber:text-white lab:text-slate-900">
      {/* Title & Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 tracking-wide flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
            Harmonic Resonator &amp; Interval Modulator
          </h2>
          <p className="text-xs text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-0.5">
            Modulate the 432Hz base frequency using pre-calculated Just Intonation ratios, Pythagorean commas, and Golden Ratio series.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
              isAudioPlaying
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 cyber:bg-rose-500 cyber:text-black lab:bg-rose-600 lab:text-white'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white'
            }`}
          >
            {isAudioPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isAudioPlaying ? 'HALT OSCILLATOR' : 'START AUDIO'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetTo432}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-cyan-300 cyber:bg-black cyber:text-cyan-300 cyber:border-cyan-400 lab:bg-white lab:hover:bg-slate-100 lab:text-sky-700 lab:border-slate-300 transition-colors cursor-pointer"
            title="Reset fundamental to 432Hz baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET 432Hz</span>
          </button>
        </div>
      </div>

      {/* Main Modulation Overview & Active Interval Hero Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Active Interval Hero Banner */}
        <div className="lg:col-span-8 bg-slate-950 cyber:bg-black lab:bg-white border border-cyan-500/40 cyber:border-cyan-400 lab:border-sky-300 rounded-xl p-4 shadow-xl lab:shadow-xs flex flex-col justify-between gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
            <span className="flex items-center gap-1.5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 font-bold uppercase">
              <Zap className="w-4 h-4 text-cyan-400 lab:text-sky-600" />
              Active Modulated Frequency
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-900 cyber:bg-zinc-900 lab:bg-slate-100 text-[10px] text-slate-300 cyber:text-white lab:text-slate-700 border border-slate-800 lab:border-slate-300">
                Base: {fundamentalBase} Hz
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 cyber:bg-black cyber:text-cyan-300 cyber:border-cyan-400 lab:bg-sky-50 lab:text-sky-800 lab:border-sky-300 text-[10px] font-bold">
                Ratio: {activeInterval ? activeInterval.ratioFraction : '1/1'} ({activeRatio.toFixed(4)})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 py-1">
            <div className="text-3xl sm:text-4xl font-mono font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 cyber:text-cyan-300 cyber:bg-none lab:text-sky-800 lab:bg-none tabular-nums">
              {calculatedTargetFreq} Hz
            </div>
            {activeInterval && (
              <div className="text-xs font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
                {activeInterval.cents !== 0 ? (
                  <span className={`font-bold ${activeInterval.cents > 0 ? 'text-amber-400 cyber:text-yellow-300 lab:text-amber-700' : 'text-fuchsia-400 cyber:text-fuchsia-300 lab:text-fuchsia-700'}`}>
                    {activeInterval.cents > 0 ? `+${activeInterval.cents}` : activeInterval.cents} cents
                  </span>
                ) : (
                  <span className="text-emerald-400 cyber:text-emerald-300 lab:text-emerald-700 font-bold">
                    Pure Unison (0 cents)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 cyber:bg-zinc-950 lab:bg-slate-50 border border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200">
            <div className="text-xs font-bold text-slate-200 cyber:text-white lab:text-slate-900 flex items-center gap-1.5">
              <span>{activeInterval?.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                {activeInterval?.symbol}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-1 leading-relaxed">
              {activeInterval?.description} {activeInterval?.harmonicContext}
            </p>
          </div>
        </div>

        {/* Right: Sacred Harmonic Node Visualization */}
        <div className="lg:col-span-4 bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 cyber:text-cyan-300 lab:text-slate-500 text-center flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400 cyber:text-yellow-300 lab:text-amber-600" />
            <span>Harmonic Wave Mandala (k = {activeRatio.toFixed(3)})</span>
          </div>

          <svg viewBox="0 0 200 200" className="w-36 h-36">
            <defs>
              <linearGradient id="harmonicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#e879f9" />
                <stop offset="100%" stopColor="#facc15" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="65" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(232, 121, 249, 0.12)" strokeWidth="1" />
            <path d={renderHarmonicSvgPath()} fill="rgba(56, 189, 248, 0.08)" stroke="url(#harmonicGrad)" strokeWidth="2" />
            <circle cx="100" cy="100" r="3" fill="#facc15" />
          </svg>

          <span className="text-[9px] font-mono text-slate-500 cyber:text-zinc-400 lab:text-slate-500 text-center">
            {isLfoActive ? `LFO Cycling @ ${lfoRateHz}Hz` : 'Standing Wave Orbit'}
          </span>
        </div>
      </div>

      {/* Fundamental Base Frequency Calibration & Presets */}
      <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 cyber:text-white lab:text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
            Reference Carrier Base Fundamental (f_base)
          </span>
          <span className="text-xs font-mono font-bold text-cyan-300 cyber:text-cyan-300 lab:text-sky-700">
            {fundamentalBase} Hz
          </span>
        </div>

        <input
          type="range"
          min={108}
          max={864}
          step={1}
          value={fundamentalBase}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setFundamentalBase(val);
            if (!isLfoActive && activeInterval) {
              const newFreq = Math.round(val * activeInterval.ratioDecimal * 100) / 100;
              audioEngine.setFrequency(newFreq);
              onFrequencyChange(newFreq);
            }
          }}
          className="w-full accent-cyan-400 lab:accent-sky-600 cursor-pointer"
          aria-label="Reference Base Frequency"
        />

        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200">
          <span className="text-[11px] font-mono text-slate-500 cyber:text-zinc-300 lab:text-slate-500 mr-1">
            Fundamental Anchors:
          </span>
          {[
            { hz: 432, label: '432 Hz Pythagorean Master' },
            { hz: 528, label: '528 Hz Solfeggio' },
            { hz: 144, label: '144 Hz Bruce Cathie' },
            { hz: 216, label: '216 Hz Lunar Sub-Octave' },
            { hz: 108, label: '108 Hz Nonary Base' },
            { hz: 864, label: '864 Hz Solar Octave' },
          ].map((item) => (
            <button
              key={item.hz}
              type="button"
              onClick={() => {
                setFundamentalBase(item.hz);
                if (!isLfoActive && activeInterval) {
                  const newFreq = Math.round(item.hz * activeInterval.ratioDecimal * 100) / 100;
                  audioEngine.setFrequency(newFreq);
                  onFrequencyChange(newFreq);
                }
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                fundamentalBase === item.hz
                  ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:text-white lab:border-sky-800'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/40 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interval Family Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {HARMONIC_INTERVAL_FAMILIES.map((family) => {
          const isSelected = selectedFamilyId === family.id;
          return (
            <button
              key={family.id}
              type="button"
              onClick={() => setSelectedFamilyId(family.id)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-md shadow-cyan-500/10 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:text-white lab:border-sky-800 lab:shadow-none'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700 cyber:bg-black cyber:text-zinc-300 cyber:border-cyan-900 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-slate-900'
              }`}
            >
              <span>{family.shortTitle}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-cyan-400/30 text-cyan-100 cyber:bg-black cyber:text-white' : 'bg-slate-800 text-slate-500 lab:bg-slate-100'}`}>
                {family.intervals.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Family Description Banner */}
      <div className="p-3 rounded-xl bg-slate-900/40 cyber:bg-zinc-950 lab:bg-slate-100 border border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200 flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs font-bold text-slate-200 cyber:text-white lab:text-slate-800">
          <span>{activeFamily.title}</span>
          <span className="text-[10px] font-mono text-cyan-400 cyber:text-cyan-300 lab:text-sky-700">
            {activeFamily.governingPrinciple}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
          {activeFamily.description}
        </p>
      </div>

      {/* Harmonic Interval Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeFamily.intervals.map((interval) => {
          const isCurrentActive = activeInterval?.id === interval.id;
          const targetHz = Math.round(fundamentalBase * interval.ratioDecimal * 100) / 100;

          return (
            <div
              key={interval.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                isCurrentActive
                  ? 'bg-slate-950/95 border-cyan-400 shadow-lg shadow-cyan-500/10 cyber:bg-black cyber:border-cyan-300 lab:bg-white lab:border-sky-600 lab:shadow-sm'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 cyber:bg-black cyber:border-cyan-900 lab:bg-white lab:border-slate-200 lab:hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 cyber:text-cyan-300 lab:text-slate-500 uppercase tracking-wider">
                      {interval.symbol}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100 cyber:text-white lab:text-slate-900 leading-tight">
                      {interval.name}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${interval.cents > 0 ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : interval.cents < 0 ? 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'}`}>
                    {interval.cents > 0 ? `+${interval.cents}¢` : `${interval.cents}¢`}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-800/80 cyber:border-cyan-500/30 lab:border-slate-200">
                  <span className="text-[11px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
                    Ratio: <strong className="text-cyan-300 cyber:text-cyan-300 lab:text-sky-700">{interval.ratioFraction}</strong> ({interval.ratioDecimal.toFixed(4)})
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-100 cyber:text-white lab:text-slate-900 tabular-nums">
                    {targetHz} Hz
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-1 leading-snug">
                  {interval.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleApplyInterval(interval)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isCurrentActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:text-white'
                    : 'bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-400 cyber:bg-black cyber:text-white cyber:border-cyan-500/50 lab:bg-slate-50 lab:text-sky-800 lab:border-slate-300 lab:hover:bg-slate-100'
                }`}
              >
                {isCurrentActive ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ENGAGED ON OSCILLATOR</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>MODULATE TO {targetHz} Hz</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Continuous Harmonic LFO / Frequency Modulation (FM) Suite */}
      <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-fuchsia-400 cyber:text-fuchsia-300 lab:text-fuchsia-600" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 cyber:text-white lab:text-slate-800">
              Continuous Harmonic LFO Modulator
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-800 cyber:bg-black cyber:text-fuchsia-300 cyber:border-fuchsia-400 lab:bg-fuchsia-50 lab:text-fuchsia-800 lab:border-fuchsia-300">
              Fluid Wave Sweep
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsLfoActive((v) => !v)}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              isLfoActive
                ? 'bg-fuchsia-500 text-slate-950 shadow-md shadow-fuchsia-500/20 cyber:bg-fuchsia-400 cyber:text-black lab:bg-fuchsia-700 lab:text-white'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/40 lab:bg-white lab:text-slate-700 lab:border-slate-300'
            }`}
          >
            {isLfoActive ? 'LFO MODULATION ACTIVE' : 'ENGAGE LFO MODULATOR'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* LFO Rate */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-400 cyber:text-zinc-200 lab:text-slate-600">
              <span>LFO Frequency Rate:</span>
              <span className="text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 font-bold">{lfoRateHz} Hz</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={6.0}
              step={0.01}
              value={lfoRateHz}
              onChange={(e) => setLfoRateHz(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 lab:accent-sky-600 cursor-pointer"
              aria-label="LFO Frequency Rate"
            />
            <div className="flex gap-1">
              {[
                { hz: 0.18, label: '0.18 Hz (18m Apex)' },
                { hz: 0.54, label: '0.54 Hz (54m Hour)' },
                { hz: 1.618, label: '1.618 Hz (Φ Pulse)' },
                { hz: 4.32, label: '4.32 Hz (432 Nonary)' },
              ].map((p) => (
                <button
                  key={p.hz}
                  type="button"
                  onClick={() => setLfoRateHz(p.hz)}
                  className={`flex-1 py-0.5 rounded text-[9px] border transition-colors cursor-pointer ${
                    lfoRateHz === p.hz
                      ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:text-white'
                      : 'bg-slate-950 text-slate-500 border-slate-800 cyber:bg-black cyber:text-zinc-300 lab:bg-white lab:text-slate-700 lab:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* LFO Depth */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-400 cyber:text-zinc-200 lab:text-slate-600">
              <span>Modulation Depth:</span>
              <span className="text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-700 font-bold">{lfoDepthPct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={lfoDepthPct}
              onChange={(e) => setLfoDepthPct(parseInt(e.target.value, 10))}
              className="w-full accent-fuchsia-400 lab:accent-fuchsia-600 cursor-pointer"
              aria-label="LFO Modulation Depth"
            />
            <span className="text-[10px] text-slate-500 cyber:text-zinc-400 lab:text-slate-500">
              Sweeps between {fundamentalBase}Hz and {calculatedTargetFreq}Hz
            </span>
          </div>

          {/* LFO Waveform Shape */}
          <div className="flex flex-col gap-1.5">
            <div className="text-slate-400 cyber:text-zinc-200 lab:text-slate-600">
              Modulation Waveform:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['sine', 'triangle', 'pulse'] as const).map((shape) => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => setLfoWaveform(shape)}
                  className={`py-1.5 rounded-lg border text-[11px] uppercase transition-colors cursor-pointer ${
                    lfoWaveform === shape
                      ? 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400 font-bold cyber:bg-fuchsia-400 cyber:text-black lab:bg-fuchsia-700 lab:text-white'
                      : 'bg-slate-950 text-slate-400 border-slate-800 cyber:bg-black cyber:text-zinc-300 lab:bg-white lab:text-slate-700 lab:border-slate-300'
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
