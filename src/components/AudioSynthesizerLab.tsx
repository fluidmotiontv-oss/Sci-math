import React, { useEffect, useRef, useState } from 'react';
import { audioEngine, WaveformType } from '../utils/audioEngine';
import { Play, Square, Volume2, Sparkles, Sliders, Waves, Activity, AlertTriangle, TrendingDown, RotateCcw, CheckCircle2, Layers, Radio, Zap, BarChart2, Film, Cable } from 'lucide-react';
import { AppTheme, LogCategory, MidiConnectionStatus, SubHarmonicLayer } from '../types/dragon';
import { D3SpectrumAnalyzer } from './D3SpectrumAnalyzer';

interface AudioSynthesizerLabProps {
  onAudioStateChange: (isPlaying: boolean, frequency: number) => void;
  onLogEvent?: (category: LogCategory, title: string, details: string, metadata?: Record<string, any>) => void;
  theme?: AppTheme;
  onOpenVideoStudio?: () => void;
  externalFrequency?: number;
  externalIsPlaying?: boolean;
  externalVolume?: number;
  onVolumeChange?: (volume: number) => void;
  midiStatus?: MidiConnectionStatus;
  midiDeviceCount?: number;
  midiOscCc?: number;
  onOpenMidiModal?: () => void;
}

export const AudioSynthesizerLab: React.FC<AudioSynthesizerLabProps> = ({
  onAudioStateChange,
  onLogEvent,
  theme = 'sovereign-dark',
  onOpenVideoStudio,
  externalFrequency,
  externalIsPlaying,
  externalVolume,
  onVolumeChange,
  midiStatus = 'disconnected',
  midiDeviceCount = 0,
  midiOscCc = 1,
  onOpenMidiModal,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(() => externalIsPlaying ?? audioEngine.getIsRunning());
  const [frequency, setFrequency] = useState<number>(() => externalFrequency ?? audioEngine.getFrequency());
  const [waveform, setWaveform] = useState<WaveformType>('sine');
  const [volume, setVolume] = useState<number>(() => externalVolume ?? audioEngine.getVolume());
  const [binauralActive, setBinauralActive] = useState<boolean>(false);
  const [binauralBeat, setBinauralBeat] = useState<number>(6);
  const [binauralCategory, setBinauralCategory] = useState<string>('Theta (Meditation)');
  const [overtonesActive, setOvertonesActive] = useState<boolean>(false);
  const [subHarmonicsActive, setSubHarmonicsActive] = useState<boolean>(() => audioEngine.getSubHarmonicsActive());
  const [subHarmonicLayers, setSubHarmonicLayers] = useState<SubHarmonicLayer[]>(() => audioEngine.getSubHarmonicLayers());
  const [visualMode, setVisualMode] = useState<'d3-spectrum' | 'oscilloscope' | 'lissajous'>('d3-spectrum');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);
  const prevFreqRef = useRef<number>(frequency);

  // Sync external frequency / play state / volume driven by Web MIDI hardware or Node Config
  useEffect(() => {
    if (externalFrequency !== undefined && externalFrequency !== frequency) {
      setFrequency(externalFrequency);
      prevFreqRef.current = externalFrequency;
      audioEngine.setFrequency(externalFrequency);
    }
  }, [externalFrequency, frequency]);

  useEffect(() => {
    if (externalIsPlaying !== undefined && externalIsPlaying !== isPlaying) {
      setIsPlaying(externalIsPlaying);
    }
  }, [externalIsPlaying, isPlaying]);

  useEffect(() => {
    if (externalVolume !== undefined && Math.abs(externalVolume - volume) > 0.005) {
      setVolume(externalVolume);
    }
  }, [externalVolume, volume]);

  // Sync with audio engine
  const handleTogglePlay = async () => {
    if (!isPlaying) {
      const ok = await audioEngine.start();
      if (ok) {
        setIsPlaying(true);
        onAudioStateChange(true, frequency);
      }
    } else {
      audioEngine.stop();
      setIsPlaying(false);
      onAudioStateChange(false, frequency);
    }
  };

  const handleFrequencyChange = (val: number) => {
    setFrequency(val);
    audioEngine.setFrequency(val);
    onAudioStateChange(isPlaying, val);

    const prevVal = prevFreqRef.current;
    if (val !== prevVal) {
      prevFreqRef.current = val;
      const delta = val - 432;
      if (val !== 432) {
        const isHigh = val > 432;
        onLogEvent?.(
          'AUDIO_SYNTH',
          `Frequency Threshold Drift Alert (${isHigh ? '> 432Hz High' : '< 432Hz Sub-Base'})`,
          `Oscillator frequency shifted to ${val}Hz (${delta > 0 ? '+' : ''}${delta}Hz deviation from 432Hz Pythagorean baseline).`,
          { frequency: val, baselineHz: 432, driftHz: delta, deviationPct: `${((delta / 432) * 100).toFixed(1)}%` }
        );
      } else if (prevVal !== 432) {
        onLogEvent?.(
          'AUDIO_SYNTH',
          'Frequency Resynchronized to 432Hz Baseline',
          'Acoustic oscillator restored to 432Hz Pythagorean natural harmonic baseline.',
          { frequency: 432, status: 'NOMINAL_PYTHAGOREAN' }
        );
      }
    }
  };

  const handleWaveformChange = (w: WaveformType) => {
    setWaveform(w);
    audioEngine.setWaveform(w);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    audioEngine.setVolume(v);
    onVolumeChange?.(v);
  };

  const handleToggleBinaural = (enabled: boolean) => {
    setBinauralActive(enabled);
    audioEngine.setBinaural({
      enabled,
      beatHz: binauralBeat,
      category: binauralCategory as 'Theta (Meditation)',
    });
  };

  const handleBinauralPreset = (hz: number, cat: string) => {
    setBinauralBeat(hz);
    setBinauralCategory(cat);
    audioEngine.setBinaural({
      enabled: binauralActive,
      beatHz: hz,
      category: cat as 'Theta (Meditation)',
    });
  };

  const handleToggleOvertones = (active: boolean) => {
    setOvertonesActive(active);
    audioEngine.setOvertones(active);
  };

  const handleToggleSubHarmonicResonance = (active: boolean) => {
    setSubHarmonicsActive(active);
    audioEngine.setSubHarmonicResonance(active);

    const activeLayers = subHarmonicLayers
      .filter((l) => l.enabled)
      .map((l) => `${l.name} (${(frequency / l.divisor).toFixed(1)} Hz)`);

    onLogEvent?.(
      'AUDIO_SYNTH',
      active ? 'Harmonic Resonator Engaged' : 'Harmonic Resonator Disengaged',
      active
        ? `Acoustic sub-harmonic resonance activated on ${frequency}Hz sine wave with ${activeLayers.length} active undertone layers: ${activeLayers.join(', ')}.`
        : `Acoustic sub-harmonic resonance disengaged. Restored to pure fundamental output at ${frequency}Hz.`,
      {
        fundamentalHz: frequency,
        subHarmonicsActive: active,
        activeLayerCount: activeLayers.length,
        engagedLayers: activeLayers,
      }
    );
  };

  const handleToggleSubHarmonicLayer = (layerId: string) => {
    audioEngine.toggleSubHarmonicLayer(layerId);
    const updated = audioEngine.getSubHarmonicLayers();
    setSubHarmonicLayers(updated);

    const target = updated.find((l) => l.id === layerId);
    if (target) {
      const subFreq = (frequency / target.divisor).toFixed(1);
      onLogEvent?.(
        'AUDIO_SYNTH',
        `Harmonic Resonator Layer ${target.enabled ? 'Engaged' : 'Muted'}: ${target.name}`,
        `Sub-harmonic layer ${target.name} (${subFreq}Hz, 1/${target.divisor} ratio) ${target.enabled ? 'activated' : 'muted'} on ${frequency}Hz carrier.`,
        {
          layerId,
          layerName: target.name,
          divisor: target.divisor,
          subFrequencyHz: Number(subFreq),
          enabled: target.enabled,
          fundamentalHz: frequency,
          gain: target.gain,
        }
      );
    }
  };

  const handleSetSubHarmonicLayerGain = (layerId: string, gain: number) => {
    audioEngine.setSubHarmonicLayerGain(layerId, gain);
    setSubHarmonicLayers(audioEngine.getSubHarmonicLayers());
  };

  const handleApplySubHarmonicPreset = (mode: 'all' | 'cathie' | 'sub-octaves' | 'deep') => {
    let newLayers = [...subHarmonicLayers];
    if (mode === 'all') {
      newLayers = newLayers.map(l => ({ ...l, enabled: true }));
    } else if (mode === 'cathie') {
      newLayers = newLayers.map(l => ({ ...l, enabled: l.id === 'sub-3' || l.id === 'sub-2' }));
    } else if (mode === 'sub-octaves') {
      newLayers = newLayers.map(l => ({ ...l, enabled: l.id === 'sub-2' || l.id === 'sub-4' }));
    } else if (mode === 'deep') {
      newLayers = newLayers.map(l => ({ ...l, enabled: l.id === 'sub-4' || l.id === 'sub-9' }));
    }

    newLayers.forEach(l => audioEngine.toggleSubHarmonicLayer(l.id, l.enabled));
    if (!subHarmonicsActive) {
      setSubHarmonicsActive(true);
      audioEngine.setSubHarmonicResonance(true);
    }
    setSubHarmonicLayers(audioEngine.getSubHarmonicLayers());

    const activeList = newLayers.filter(l => l.enabled).map(l => `${l.name} (${(frequency / l.divisor).toFixed(1)}Hz)`);
    onLogEvent?.(
      'AUDIO_SYNTH',
      `Harmonic Resonator Preset Applied: ${mode.toUpperCase()}`,
      `Configured sub-harmonic preset "${mode}" with active layers: ${activeList.join(', ')}.`,
      { preset: mode, fundamentalHz: frequency, activeLayers: activeList }
    );
  };


  // Canvas visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localPhase = 0;

    const palette =
      theme === 'minimalist-lab'
        ? {
            bg: '#ffffff',
            grid: 'rgba(2, 132, 199, 0.2)',
            wave: '#0284c7',
            lissajous: '#a21caf',
            idle: 'rgba(2, 132, 199, 0.5)',
          }
        : theme === 'high-contrast-cyber'
        ? {
            bg: '#000000',
            grid: 'rgba(34, 211, 238, 0.32)',
            wave: '#00f0ff',
            lissajous: '#f0abfc',
            idle: 'rgba(0, 240, 255, 0.65)',
          }
        : {
            bg: '#010409',
            grid: 'rgba(56, 189, 248, 0.15)',
            wave: '#38bdf8',
            lissajous: '#e879f9',
            idle: 'rgba(56, 189, 248, 0.4)',
          };

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      const analyser = audioEngine.getAnalyser();

      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;

      const w = canvas.width;
      const h = canvas.height;

      // Background with subtle centerline
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      if (isPlaying && analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        if (visualMode === 'oscilloscope') {
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = palette.wave;
          ctx.beginPath();

          const sliceWidth = w / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * h) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.stroke();
        } else {
          // Lissajous Phase Trajectory
          ctx.lineWidth = 2;
          ctx.strokeStyle = palette.lissajous;
          ctx.beginPath();
          const cx = w / 2;
          const cy = h / 2;
          const radius = Math.min(w, h) * 0.38;

          for (let i = 0; i < bufferLength - 20; i += 2) {
            const v1 = (dataArray[i] - 128) / 128.0;
            const v2 = (dataArray[i + 16] - 128) / 128.0;
            const x = cx + v1 * radius * 1.5;
            const y = cy + v2 * radius * 1.5;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else {
        // Idle smooth harmonic wave
        localPhase += 0.03 * (frequency / 432);
        ctx.lineWidth = 2;
        ctx.strokeStyle = palette.idle;
        ctx.beginPath();

        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin(x * 0.02 + localPhase) * 25;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    draw();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, visualMode, frequency, theme]);

  return (
    <div className="flex flex-col gap-5 text-slate-100 cyber:text-white lab:text-slate-900">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 tracking-wide flex items-center gap-2">
            <Waves className="w-5 h-5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
            432Hz Harmonic Sound Generator
          </h2>
          <p className="text-xs text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-0.5">
            Pythagorean tuning frequency synthesizer calibrated to natural harmonic ratios & space-time resonance.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400 cyber:text-zinc-300 lab:text-slate-600">STATUS:</span>
          <span
            className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wider ${
              isPlaying
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-100 lab:text-sky-800 lab:border-sky-400'
                : 'bg-slate-900 text-slate-500 border-slate-800 cyber:bg-black cyber:text-zinc-300 cyber:border-cyan-500/50 lab:bg-slate-100 lab:text-slate-600 lab:border-slate-300'
            }`}
          >
            {isPlaying ? 'OSCILLATING' : 'STANDBY'}
          </span>
          {frequency === 432 ? (
            <span className="px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border-emerald-500/50 cyber:bg-emerald-400 cyber:text-black cyber:border-white lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 cyber:text-black lab:text-emerald-600" /> 432Hz NOMINAL
            </span>
          ) : frequency > 432 ? (
            <span className="px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border-amber-500/50 cyber:bg-yellow-300 cyber:text-black cyber:border-white lab:bg-amber-50 lab:text-amber-800 lab:border-amber-400 animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400 cyber:text-black lab:text-amber-600" /> HIGH DRIFT (+{frequency - 432}Hz)
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50 cyber:bg-fuchsia-400 cyber:text-black cyber:border-white lab:bg-fuchsia-50 lab:text-fuchsia-800 lab:border-fuchsia-400 animate-pulse flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-fuchsia-400 cyber:text-black lab:text-fuchsia-600" /> SUB-BASE DRIFT (-{432 - frequency}Hz)
            </span>
          )}
          {onOpenMidiModal && (
            <button
              type="button"
              onClick={onOpenMidiModal}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer ${
                midiStatus === 'connected'
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300'
                  : 'border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 cyber:bg-black cyber:text-cyan-300 cyber:border-cyan-400 lab:bg-white lab:text-sky-700 lab:border-slate-300'
              }`}
              title="Configure Web MIDI hardware controllers for 432Hz oscillator & harmonic grid"
            >
              <Cable className="w-3.5 h-3.5" />
              <span>
                MIDI{midiStatus === 'connected' ? (midiDeviceCount > 0 ? ` · ${midiDeviceCount} ON` : ' READY') : ' Control'}
              </span>
            </button>
          )}
          {onOpenVideoStudio && (
            <button
              type="button"
              onClick={onOpenVideoStudio}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-fuchsia-500/50 bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-200 cyber:bg-black cyber:text-yellow-300 cyber:border-yellow-400 cyber:hover:bg-yellow-400 cyber:hover:text-black lab:bg-fuchsia-700 lab:hover:bg-fuchsia-800 lab:text-white lab:border-fuchsia-800 text-[11px] font-bold transition-colors cursor-pointer"
              title="Upload an MP3 track & generate a creative 3D model showcase video"
            >
              <Film className="w-3.5 h-3.5" />
              <span>MP3 → 3D Video</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Threshold Alert Banner */}
      {frequency !== 432 && (
        <div
          className={`p-3.5 rounded-xl border font-mono text-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between transition-all shadow-lg lab:shadow-xs ${
            frequency > 432
              ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-amber-500/10 cyber:bg-black cyber:border-yellow-300 cyber:text-yellow-200 lab:bg-amber-50 lab:border-amber-300 lab:text-amber-900'
              : 'bg-fuchsia-950/40 border-fuchsia-500/60 text-fuchsia-200 shadow-fuchsia-500/10 cyber:bg-black cyber:border-fuchsia-300 cyber:text-fuchsia-200 lab:bg-fuchsia-50 lab:border-fuchsia-300 lab:text-fuchsia-900'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                frequency > 432
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 cyber:bg-yellow-300 cyber:text-black lab:bg-amber-100 lab:text-amber-700 lab:border-amber-300'
                  : 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/40 cyber:bg-fuchsia-400 cyber:text-black lab:bg-fuchsia-100 lab:text-fuchsia-700 lab:border-fuchsia-300'
              }`}
            >
              {frequency > 432 ? (
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              ) : (
                <TrendingDown className="w-5 h-5 animate-bounce" />
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="font-bold flex items-center gap-2">
                <span>
                  {frequency > 432 ? 'HARMONIC FREQUENCY HIGH DRIFT DETECTED (> 432Hz BASELINE)' : 'HARMONIC FREQUENCY SUB-BASE DRIFT DETECTED (< 432Hz BASELINE)'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950/80 cyber:bg-black lab:bg-white font-bold border border-slate-800 cyber:border-yellow-300 lab:border-slate-300">
                  {frequency > 432 ? `+${frequency - 432} Hz` : `-${432 - frequency} Hz`}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 cyber:text-zinc-200 lab:text-slate-700 leading-relaxed font-sans">
                Oscillator frequency shifted from 432Hz Pythagorean baseline to{' '}
                <strong className="font-mono text-cyan-300 cyber:text-cyan-300 lab:text-sky-700">{frequency} Hz</strong> ({((frequency / 432) * 100).toFixed(1)}% ratio). Drift logged to Session Audit Trail.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleFrequencyChange(432)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-700 text-cyan-300 hover:text-cyan-200 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-white lab:hover:bg-slate-100 lab:text-sky-700 lab:border-slate-300 font-bold text-xs transition-colors cursor-pointer shrink-0 shadow lab:shadow-xs"
            title="Restore oscillator to 432Hz natural harmonic baseline"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400 cyber:text-black lab:text-sky-700" />
            <span>RESET TO 432Hz BASELINE</span>
          </button>
        </div>
      )}

      {/* Primary Visualizer Deck: D3 Frequency Spectrum / Oscilloscope / Lissajous */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300 cyber:text-white lab:text-slate-700">
            <BarChart2 className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
            <span>Acoustic Output Visualizer:</span>
          </div>
          <div className="flex bg-slate-950 cyber:bg-black lab:bg-slate-100 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-300 rounded-lg p-0.5">
            <button
              onClick={() => setVisualMode('d3-spectrum')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                visualMode === 'd3-spectrum'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-white lab:text-sky-700 lab:border-slate-300 lab:shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600 lab:hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400 cyber:text-inherit lab:text-inherit" />
              <span>D3.js Frequency Spectrum</span>
            </button>
            <button
              onClick={() => setVisualMode('oscilloscope')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                visualMode === 'oscilloscope'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-white lab:text-sky-700 lab:border-slate-300 lab:shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600 lab:hover:text-slate-900'
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-cyan-400 cyber:text-inherit lab:text-inherit" />
              <span>Oscilloscope</span>
            </button>
            <button
              onClick={() => setVisualMode('lissajous')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                visualMode === 'lissajous'
                  ? 'bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-500/50 shadow-sm shadow-fuchsia-500/20 cyber:bg-fuchsia-400 cyber:text-black cyber:border-white lab:bg-white lab:text-fuchsia-700 lab:border-slate-300 lab:shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600 lab:hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-fuchsia-400 cyber:text-inherit lab:text-inherit" />
              <span>Lissajous Orbit</span>
            </button>
          </div>
        </div>

        {visualMode === 'd3-spectrum' ? (
          <D3SpectrumAnalyzer
            isPlaying={isPlaying}
            frequency={frequency}
            subHarmonicsActive={subHarmonicsActive}
            subHarmonicLayers={subHarmonicLayers}
            overtonesActive={overtonesActive}
            theme={theme}
          />
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 cyber:border-cyan-400 lab:border-slate-300 shadow-lg lab:shadow-xs bg-slate-950 cyber:bg-black lab:bg-white">
            <canvas ref={canvasRef} className="w-full h-48 block" />
            <div className="absolute bottom-2.5 right-3 font-mono text-xs text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 bg-slate-900/80 cyber:bg-black lab:bg-white/95 px-2 py-1 rounded border border-cyan-500/20 cyber:border-cyan-400 lab:border-slate-300">
              f = {frequency} Hz {binauralActive ? `± ${binauralBeat / 2} Hz` : ''}
            </div>
          </div>
        )}
      </div>

      {/* Primary Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4">
        {/* Play/Stop & Volume */}
        <div className="flex flex-col justify-between gap-3">
          <button
            onClick={handleTogglePlay}
            className={`w-full py-3 px-4 rounded-xl font-bold tracking-wider text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isPlaying
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 shadow-lg shadow-red-900/20 cyber:bg-red-500 cyber:text-black cyber:border-white lab:bg-red-600 lab:hover:bg-red-700 lab:text-white lab:border-red-700 lab:shadow-xs'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white lab:shadow-xs'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>HALT OSCILLATOR</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>START 432Hz OSCILLATOR</span>
              </>
            )}
          </button>

          <div>
            <div className="flex justify-between text-xs text-slate-400 cyber:text-zinc-200 lab:text-slate-600 mb-1">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" /> Output Gain
              </span>
              <span className="font-mono text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 font-semibold">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              aria-label="Audio Output Gain"
              className="w-full accent-cyan-400 lab:accent-sky-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Frequency Slider & Harmonic Presets */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 cyber:text-white lab:text-slate-700 font-mono flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" /> Harmonic Base Frequency
              {midiStatus === 'connected' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300">
                  MIDI CC#{midiOscCc} + 432Hz Keys
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {frequency !== 432 && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    frequency > 432
                      ? 'bg-amber-950 text-amber-300 border-amber-500/50 cyber:bg-yellow-300 cyber:text-black lab:bg-amber-100 lab:text-amber-800 lab:border-amber-300'
                      : 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500/50 cyber:bg-fuchsia-400 cyber:text-black lab:bg-fuchsia-100 lab:text-fuchsia-800 lab:border-fuchsia-300'
                  }`}
                >
                  {frequency > 432 ? `+${frequency - 432}Hz DRIFT` : `-${432 - frequency}Hz DRIFT`}
                </span>
              )}
              <span
                className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded border transition-all ${
                  frequency === 432
                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800 cyber:bg-black cyber:text-cyan-300 cyber:border-cyan-400 lab:bg-sky-50 lab:text-sky-800 lab:border-sky-300'
                    : frequency > 432
                    ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-lg shadow-amber-500/20 cyber:bg-yellow-300 cyber:text-black lab:bg-amber-100 lab:text-amber-900 lab:border-amber-400 lab:shadow-none animate-pulse'
                    : 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500 shadow-lg shadow-fuchsia-500/20 cyber:bg-fuchsia-400 cyber:text-black lab:bg-fuchsia-100 lab:text-fuchsia-900 lab:border-fuchsia-400 lab:shadow-none animate-pulse'
                }`}
              >
                {frequency} Hz
              </span>
            </div>
          </div>

          <input
            type="range"
            min={108}
            max={864}
            step={1}
            value={frequency}
            onChange={(e) => handleFrequencyChange(parseFloat(e.target.value))}
            aria-label="Harmonic Base Frequency"
            className="w-full accent-cyan-400 lab:accent-sky-600 cursor-pointer"
          />

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {[
              { hz: 432, label: '432 Hz Natural' },
              { hz: 528, label: '528 Hz Solfeggio' },
              { hz: 144, label: '144 Hz Cathie' },
              { hz: 216, label: '216 Hz Sub-Oct' },
              { hz: 864, label: '864 Hz Solar' },
              { hz: 108, label: '108 Hz Nonary' },
            ].map((p) => (
              <button
                key={p.hz}
                onClick={() => handleFrequencyChange(p.hz)}
                className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                  frequency === p.hz
                    ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:text-white lab:border-sky-800'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/40 cyber:hover:border-cyan-400 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-slate-900 lab:hover:border-slate-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Waveform & Binaural Generator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Waveform Selector & Overtones */}
        <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="text-xs font-mono text-slate-300 cyber:text-white lab:text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Waveform Geometry</span>
            <span className="text-slate-500 cyber:text-cyan-300 lab:text-slate-500">Pure Fourier</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['sine', 'triangle', 'sawtooth', 'square'] as WaveformType[]).map((w) => (
              <button
                key={w}
                onClick={() => handleWaveformChange(w)}
                className={`py-2 rounded-lg font-mono text-xs uppercase border text-center transition-colors cursor-pointer ${
                  waveform === w
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:text-white lab:border-sky-800'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-300 cyber:border-cyan-500/40 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-slate-900'
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
            <div>
              <div className="text-xs font-medium text-slate-200 cyber:text-white lab:text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 cyber:text-yellow-300 lab:text-amber-600" />
                Nonary 9th Overtones
              </div>
              <div className="text-[11px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600">Injects 2nd, 3rd, 4th & 9th sacred ratios</div>
            </div>
            <button
              onClick={() => handleToggleOvertones(!overtonesActive)}
              className={`px-3 py-1 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                overtonesActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 cyber:bg-yellow-300 cyber:text-black cyber:border-white lab:bg-amber-600 lab:text-white lab:border-amber-700'
                  : 'bg-slate-950 text-slate-400 border-slate-800 cyber:bg-black cyber:text-zinc-300 cyber:border-cyan-500/40 lab:bg-white lab:text-slate-600 lab:border-slate-300'
              }`}
            >
              {overtonesActive ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Binaural Beat Generator */}
        <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 cyber:text-white lab:text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-fuchsia-400 cyber:text-fuchsia-300 lab:text-fuchsia-600" />
              Binaural Beat Entrainment
            </span>
            <button
              onClick={() => handleToggleBinaural(!binauralActive)}
              className={`px-2.5 py-0.5 rounded text-xs font-mono border transition-colors cursor-pointer ${
                binauralActive
                  ? 'bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-400 cyber:bg-fuchsia-400 cyber:text-black cyber:border-white lab:bg-fuchsia-700 lab:text-white lab:border-fuchsia-800'
                  : 'bg-slate-950 text-slate-400 border-slate-800 cyber:bg-black cyber:text-zinc-300 cyber:border-cyan-500/40 lab:bg-white lab:text-slate-600 lab:border-slate-300'
              }`}
            >
              {binauralActive ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { hz: 2, cat: 'Delta (Deep Sleep)' },
              { hz: 6, cat: 'Theta (Meditation)' },
              { hz: 10, cat: 'Alpha (Relaxation)' },
              { hz: 18, cat: 'Beta (Focus)' },
              { hz: 40, cat: 'Gamma (Peak Cognition)' },
            ].map((b) => (
              <button
                key={b.hz}
                onClick={() => handleBinauralPreset(b.hz, b.cat)}
                className={`p-1.5 rounded text-left border text-[11px] font-mono transition-colors cursor-pointer ${
                  binauralBeat === b.hz
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400 cyber:bg-fuchsia-400 cyber:text-black cyber:border-white lab:bg-fuchsia-50 lab:text-fuchsia-800 lab:border-fuchsia-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-300 cyber:border-cyan-500/40 lab:bg-white lab:text-slate-700 lab:border-slate-300 lab:hover:bg-slate-100'
                }`}
              >
                <div className="font-bold">{b.hz} Hz</div>
                <div className={`text-[9px] truncate ${binauralBeat === b.hz ? 'cyber:text-black lab:text-fuchsia-700' : 'text-slate-400 cyber:text-zinc-400 lab:text-slate-500'}`}>
                  {b.cat.split(' ')[0]}
                </div>
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 cyber:text-cyan-200 lab:text-slate-700 bg-slate-950/60 cyber:bg-black lab:bg-white p-2 rounded border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
            {binauralActive
              ? `L: ${(frequency - binauralBeat / 2).toFixed(1)} Hz | R: ${(frequency + binauralBeat / 2).toFixed(1)} Hz (${binauralCategory})`
              : 'Requires stereo headphones for acoustic brainwave entrainment.'}
          </div>
        </div>
      </div>

      {/* NEW: HARMONIC RESONATOR SUITE (SUB-HARMONIC LAYERS) */}
      <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-4">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cyber:bg-emerald-400/20 cyber:border-emerald-400 cyber:text-emerald-300 lab:bg-emerald-100 lab:border-emerald-300 lab:text-emerald-700">
              <Layers className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-emerald-400 cyber:text-emerald-300 lab:text-emerald-700 font-mono tracking-wide uppercase">
                  Harmonic Resonator Suite
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 cyber:bg-black cyber:text-emerald-300 cyber:border-emerald-400 lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300">
                  Sub-Harmonic Undertones
                </span>
              </div>
              <p className="text-xs text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-0.5">
                Injects fractional undertone wave layers (f/2, f/3, f/4, f/9) beneath the {frequency}Hz carrier, generating dense acoustic resonance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleSubHarmonicResonance(!subHarmonicsActive)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shadow-lg lab:shadow-xs ${
                subHarmonicsActive
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/25 border border-emerald-400 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-700 lab:text-white lab:border-emerald-800'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-400 lab:bg-white lab:hover:bg-slate-100 lab:text-slate-700 lab:border-slate-300'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${subHarmonicsActive ? 'text-slate-950 cyber:text-black lab:text-white' : 'text-slate-500 cyber:text-cyan-300 lab:text-slate-500'}`} />
              <span>{subHarmonicsActive ? 'RESONANCE ENGAGED' : 'ENGAGE RESONATOR'}</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 cyber:bg-black lab:bg-white p-2.5 rounded-lg border border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 cyber:text-zinc-200 lab:text-slate-600">
            <Radio className="w-3.5 h-3.5 text-emerald-400 cyber:text-emerald-300 lab:text-emerald-600" />
            <span>Resonance Presets:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all' as const, label: 'All 4 Undertones' },
              { id: 'cathie' as const, label: 'Cathie 144Hz (f/3 + f/2)' },
              { id: 'sub-octaves' as const, label: 'Sub-Octaves (f/2 & f/4)' },
              { id: 'deep' as const, label: 'Infrasonic Sub-Bass' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleApplySubHarmonicPreset(p.id)}
                className="px-2.5 py-1 rounded text-[10px] font-mono border border-slate-800 bg-slate-900 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/50 cyber:bg-black cyber:text-white cyber:border-cyan-500/50 cyber:hover:border-emerald-400 lab:bg-slate-50 lab:text-slate-700 lab:border-slate-300 lab:hover:text-emerald-800 lab:hover:border-emerald-500 transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-Harmonic Layer Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {subHarmonicLayers.map((layer) => {
            const calculatedSubFreq = (frequency / layer.divisor).toFixed(1);
            const isEngaged = subHarmonicsActive && layer.enabled;

            return (
              <div
                key={layer.id}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                  isEngaged
                    ? 'bg-slate-950/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10 cyber:bg-black cyber:border-emerald-400 lab:bg-white lab:border-emerald-500 lab:shadow-xs'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 cyber:bg-black cyber:border-cyan-900 lab:bg-white lab:border-slate-200 lab:hover:border-slate-300'
                }`}
              >
                {/* Card Top: Title and Toggle */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold text-slate-400 cyber:text-cyan-300 lab:text-slate-500 uppercase tracking-wider">
                      {layer.name}
                    </span>
                    <span className="text-xs font-bold text-slate-100 cyber:text-white lab:text-slate-900 flex items-center gap-1.5 mt-0.5">
                      <span>{layer.title}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleSubHarmonicLayer(layer.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer shrink-0 ${
                      layer.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 cyber:bg-emerald-400 cyber:text-black cyber:border-white lab:bg-emerald-600 lab:text-white lab:border-emerald-700'
                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300 cyber:bg-black cyber:text-zinc-300 cyber:border-cyan-500/40 lab:bg-slate-100 lab:text-slate-600 lab:border-slate-300'
                    }`}
                  >
                    {layer.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Frequency Display */}
                <div className="bg-slate-900/90 cyber:bg-zinc-950 lab:bg-slate-50 p-2 rounded-lg border border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200 flex items-center justify-between font-mono">
                  <span className="text-[10px] text-slate-500 cyber:text-zinc-300 lab:text-slate-500 uppercase">Sub-Freq (1/{layer.divisor}):</span>
                  <span className={`text-xs font-bold ${isEngaged ? 'text-emerald-300 cyber:text-emerald-300 lab:text-emerald-700' : 'text-slate-400 cyber:text-zinc-300 lab:text-slate-600'}`}>
                    {calculatedSubFreq} Hz
                  </span>
                </div>

                {/* Description */}
                <p className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 leading-tight">
                  {layer.description}
                </p>

                {/* Layer Gain Control */}
                <div className="pt-2 border-t border-slate-800/60 cyber:border-cyan-500/30 lab:border-slate-200 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 cyber:text-zinc-200 lab:text-slate-600">
                    <span>Gain / Blend:</span>
                    <span className="text-emerald-400 cyber:text-emerald-300 lab:text-emerald-700 font-semibold">{Math.round(layer.gain * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={layer.gain}
                    onChange={(e) => handleSetSubHarmonicLayerGain(layer.id, parseFloat(e.target.value))}
                    aria-label={`${layer.name} gain`}
                    className="w-full accent-emerald-400 lab:accent-emerald-600 cursor-pointer"
                  />
                </div>

                {/* Resonance Status Indicator Bar */}
                <div className="h-1 w-full bg-slate-900 cyber:bg-zinc-900 lab:bg-slate-200 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isEngaged && isPlaying
                        ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 lab:from-emerald-600 lab:to-sky-600 animate-pulse'
                        : 'bg-slate-800 lab:bg-slate-300'
                    }`}
                    style={{ width: isEngaged ? `${Math.round(layer.gain * 100)}%` : '0%' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

