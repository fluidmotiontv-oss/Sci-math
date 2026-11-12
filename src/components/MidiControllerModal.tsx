import React, { useState } from 'react';
import {
  Cable,
  X,
  Radio,
  Sliders,
  Music,
  Globe,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Piano,
  Activity,
  Trash2,
  Target,
} from 'lucide-react';
import {
  MidiConnectionStatus,
  MidiDeviceInfo,
  MidiMapping,
  MidiMessageLog,
  MidiTargetId,
} from '../types/dragon';
import { MidiBehavioralSettings } from '../hooks/useWebMidi';
import { midiNoteTo432Hz } from '../utils/webMidi';

interface MidiControllerModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: MidiConnectionStatus;
  errorMessage: string | null;
  devices: MidiDeviceInfo[];
  mappings: MidiMapping[];
  settings: MidiBehavioralSettings;
  learningTarget: MidiTargetId | null;
  recentMessages: MidiMessageLog[];
  currentFrequency: number;
  currentGridVal: number;
  currentPolarityAlpha: number;
  isAudioPlaying: boolean;
  onConnectMidi: () => void;
  onUpdateMapping: (
    target: MidiTargetId,
    patch: Partial<Pick<MidiMapping, 'cc' | 'channel' | 'min' | 'max' | 'step'>>
  ) => void;
  onResetMappings: () => void;
  onUpdateSettings: (patch: Partial<MidiBehavioralSettings>) => void;
  onStartLearn: (target: MidiTargetId) => void;
  onCancelLearn: () => void;
  onClearMessages: () => void;
  onSimulatePacket: (bytes: [number, number, number], deviceName?: string) => void;
}

export const MidiControllerModal: React.FC<MidiControllerModalProps> = ({
  isOpen,
  onClose,
  status,
  errorMessage,
  devices,
  mappings,
  settings,
  learningTarget,
  recentMessages,
  currentFrequency,
  currentGridVal,
  currentPolarityAlpha,
  isAudioPlaying,
  onConnectMidi,
  onUpdateMapping,
  onResetMappings,
  onUpdateSettings,
  onStartLearn,
  onCancelLearn,
  onClearMessages,
  onSimulatePacket,
}) => {
  const [simFreqCc, setSimFreqCc] = useState<number>(54);
  const [simGridCc, setSimGridCc] = useState<number>(11);

  if (!isOpen) return null;

  const statusBadge = (() => {
    switch (status) {
      case 'connected':
        return {
          text:
            devices.length > 0
              ? `CONNECTED (${devices.length} DEVICE${devices.length > 1 ? 'S' : ''})`
              : 'MIDI READY · LISTENING FOR HARDWARE',
          cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300',
        };
      case 'requesting':
        return {
          text: 'REQUESTING HARDWARE ACCESS...',
          cls: 'bg-amber-500/20 text-amber-300 border-amber-500/50 cyber:bg-yellow-300 cyber:text-black lab:bg-amber-50 lab:text-amber-800 lab:border-amber-300',
        };
      case 'unsupported':
        return {
          text: 'BROWSER WEB MIDI UNSUPPORTED',
          cls: 'bg-rose-500/20 text-rose-300 border-rose-500/50 cyber:bg-rose-500 cyber:text-black lab:bg-rose-50 lab:text-rose-800 lab:border-rose-300',
        };
      case 'denied':
      case 'error':
        return {
          text: 'ACCESS BLOCKED / ERROR',
          cls: 'bg-rose-500/20 text-rose-300 border-rose-500/50 cyber:bg-rose-500 cyber:text-black lab:bg-rose-50 lab:text-rose-800 lab:border-rose-300',
        };
      default:
        return {
          text: 'DISCONNECTED',
          cls: 'bg-slate-900 text-slate-400 border-slate-700 cyber:bg-black cyber:text-zinc-300 cyber:border-cyan-500/50 lab:bg-slate-100 lab:text-slate-600 lab:border-slate-300',
        };
    }
  })();

  const freqMapping = mappings.find((m) => m.target === 'oscFrequency');
  const gridMapping = mappings.find((m) => m.target === 'cathieGridVal');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 cyber:bg-black/90 lab:bg-slate-900/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="web-midi-studio-title"
    >
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-slate-950 cyber:bg-black lab:bg-white border border-cyan-500/40 cyber:border-cyan-400 lab:border-slate-300 rounded-2xl shadow-2xl text-slate-100 cyber:text-white lab:text-slate-900 flex flex-col">
        {/* Sticky Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800 cyber:border-cyan-500/50 lab:border-slate-200 sticky top-0 bg-slate-950 cyber:bg-black lab:bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 cyber:bg-cyan-400/20 lab:bg-sky-100 border border-cyan-500/40 cyber:border-cyan-400 lab:border-sky-300 flex items-center justify-center">
              <Cable className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-700" />
            </div>
            <div>
              <h3
                id="web-midi-studio-title"
                className="text-sm sm:text-base font-bold tracking-wide text-cyan-300 cyber:text-cyan-300 lab:text-sky-800"
              >
                Web MIDI Hardware Controller Bridge
              </h3>
              <p className="text-[11px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
                Drive 432Hz oscillator pitch, Cathie harmonic grid &amp; α/β polarity from external MIDI controllers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md border text-[10px] font-mono font-bold ${statusBadge.cls}`}>
              {statusBadge.text}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Web MIDI Hardware Bridge"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 cyber:text-cyan-300 cyber:hover:bg-cyan-950 lab:text-slate-500 lab:hover:text-slate-900 lab:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Hardware Connection, Tuning & Live Telemetry */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Hardware Connection Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  1. MIDI Input Interface
                </span>
                <button
                  type="button"
                  onClick={onConnectMidi}
                  disabled={status === 'unsupported' || status === 'requesting'}
                  className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white font-mono text-[11px] font-bold transition-colors cursor-pointer"
                >
                  {status === 'connected' ? 'RESCAN DEVICES' : 'CONNECT MIDI HARDWARE'}
                </button>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200 lab:bg-rose-50 lab:text-rose-800 lab:border-rose-300 text-[11px] font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Device Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600 block">
                  Active Hardware Port Filter
                </label>
                <select
                  value={settings.selectedInputId}
                  onChange={(e) => onUpdateSettings({ selectedInputId: e.target.value })}
                  className="w-full bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-500/60 lab:border-slate-300 text-slate-200 cyber:text-white lab:text-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-mono cursor-pointer"
                >
                  <option value="all">All Connected MIDI Inputs ({devices.length})</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.manufacturer})
                    </option>
                  ))}
                </select>
              </div>

              {/* Connected Hardware List */}
              {devices.length > 0 ? (
                <div className="space-y-1.5">
                  {devices.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/80 cyber:bg-black lab:bg-white border border-emerald-500/30 cyber:border-emerald-400/60 lab:border-emerald-300 text-[11px] font-mono"
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-emerald-300 cyber:text-emerald-300 lab:text-emerald-700">
                          {d.name}
                        </span>
                        <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-500 ml-1.5 text-[10px]">
                          {d.manufacturer}
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-100 lab:text-emerald-800 font-bold uppercase shrink-0">
                        {d.state}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600 p-2.5 rounded-lg bg-slate-950/60 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-500/30 lab:border-slate-200">
                  {status === 'connected'
                    ? 'No external USB/Bluetooth MIDI controllers detected yet. Plug in a controller anytime or use the Hardware Simulator below.'
                    : 'Click "Connect MIDI Hardware" to grant browser Web MIDI access to your external faders, knobs, or keyboard.'}
                </div>
              )}
            </div>

            {/* Live Controlled Targets Readout */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-900/70 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 font-mono">
                <div className="text-[9px] text-slate-400 cyber:text-zinc-300 lab:text-slate-500 uppercase">Oscillator</div>
                <div className="text-sm font-bold text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 tabular-nums mt-0.5">
                  {currentFrequency} Hz
                </div>
                <div className="text-[9px] text-slate-500 cyber:text-zinc-400 lab:text-slate-500">
                  {isAudioPlaying ? 'PLAYING' : 'STANDBY'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/70 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 font-mono">
                <div className="text-[9px] text-slate-400 cyber:text-zinc-300 lab:text-slate-500 uppercase">Cathie Grid</div>
                <div className="text-sm font-bold text-amber-300 cyber:text-yellow-300 lab:text-amber-700 tabular-nums mt-0.5">
                  N = {currentGridVal}
                </div>
                <div className="text-[9px] text-slate-500 cyber:text-zinc-400 lab:text-slate-500">Harmonic Ref</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/70 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 font-mono">
                <div className="text-[9px] text-slate-400 cyber:text-zinc-300 lab:text-slate-500 uppercase">Polarity</div>
                <div className="text-sm font-bold text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-700 tabular-nums mt-0.5">
                  {currentPolarityAlpha}/{100 - currentPolarityAlpha}
                </div>
                <div className="text-[9px] text-slate-500 cyber:text-zinc-400 lab:text-slate-500">α Static / β</div>
              </div>
            </div>

            {/* 432Hz Keyboard & Harmonic Behavior Options */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 space-y-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 flex items-center gap-1.5">
                <Piano className="w-3.5 h-3.5" />
                2. 432Hz Tuning &amp; Grid Quantization
              </span>

              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-300 cyber:text-white lab:text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.notePitchEnabled}
                  onChange={(e) => onUpdateSettings({ notePitchEnabled: e.target.checked })}
                  className="mt-0.5 accent-cyan-400 lab:accent-sky-600 cursor-pointer"
                />
                <span>
                  <strong className="font-mono text-cyan-300 cyber:text-cyan-300 lab:text-sky-700">
                    432Hz Pythagorean Keyboard Pitch
                  </strong>
                  <span className="block text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-500">
                    MIDI Note On tunes oscillator via f = 432 × 2^((note − 69) / 12) (A4 = 432.0 Hz)
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-300 cyber:text-white lab:text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.autoGateOnNote}
                  onChange={(e) => onUpdateSettings({ autoGateOnNote: e.target.checked })}
                  className="mt-0.5 accent-cyan-400 lab:accent-sky-600 cursor-pointer"
                />
                <span>
                  <strong className="font-mono text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-700">
                    Auto-Gate Audio on Note On / Off
                  </strong>
                  <span className="block text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-500">
                    Pressing a MIDI key starts oscillator output; releasing mutes on Note Off
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-300 cyber:text-white lab:text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.cathieSnapMode}
                  onChange={(e) => onUpdateSettings({ cathieSnapMode: e.target.checked })}
                  className="mt-0.5 accent-amber-400 lab:accent-amber-600 cursor-pointer"
                />
                <span>
                  <strong className="font-mono text-amber-300 cyber:text-yellow-300 lab:text-amber-700">
                    Snap Grid CC to Canonical Cathie Harmonics
                  </strong>
                  <span className="block text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-500">
                    Locks Grid CC sweep to 18, 36, 72, 144, 216, 288, 432, 576, 864, 1440, 2160
                  </span>
                </span>
              </label>

              <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                <span className="text-slate-400 cyber:text-zinc-300 lab:text-slate-600">Pitch Bend Depth:</span>
                <div className="flex gap-1">
                  {[2, 5, 12].map((semi) => (
                    <button
                      key={semi}
                      type="button"
                      onClick={() => onUpdateSettings({ pitchBendSemitones: semi })}
                      className={`px-2 py-0.5 rounded border text-[10px] cursor-pointer ${
                        settings.pitchBendSemitones === semi
                          ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 font-bold cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:text-white'
                          : 'bg-slate-950 text-slate-400 border-slate-800 cyber:bg-black cyber:text-zinc-300 lab:bg-white lab:text-slate-700 lab:border-slate-300'
                      }`}
                    >
                      ±{semi} st
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Virtual Hardware MIDI Signal Simulator */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Virtual MIDI Signal Test Pad
                </span>
                <span className="text-[10px] font-mono text-slate-500 cyber:text-zinc-400 lab:text-slate-500">
                  No hardware needed
                </span>
              </div>

              <div className="space-y-2 text-[11px] font-mono">
                <div>
                  <div className="flex justify-between text-slate-300 cyber:text-white lab:text-slate-700 mb-0.5">
                    <span>CC #{freqMapping?.cc ?? 1} · Oscillator Pitch</span>
                    <span className="text-cyan-300 cyber:text-cyan-300 lab:text-sky-700">val {simFreqCc}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={127}
                    value={simFreqCc}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSimFreqCc(val);
                      onSimulatePacket([0xb0, freqMapping?.cc ?? 1, val], 'Virtual Knob');
                    }}
                    className="w-full accent-cyan-400 lab:accent-sky-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 cyber:text-white lab:text-slate-700 mb-0.5">
                    <span>CC #{gridMapping?.cc ?? 74} · Cathie Grid (N)</span>
                    <span className="text-amber-300 cyber:text-yellow-300 lab:text-amber-700">val {simGridCc}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={127}
                    value={simGridCc}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSimGridCc(val);
                      onSimulatePacket([0xb0, gridMapping?.cc ?? 74, val], 'Virtual Fader');
                    }}
                    className="w-full accent-amber-400 lab:accent-amber-600 cursor-pointer"
                  />
                </div>

                {/* 432Hz Note Trigger Pads */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { note: 57, label: 'A3 · 216Hz' },
                    { note: 60, label: `C4 · ${midiNoteTo432Hz(60)}Hz` },
                    { note: 69, label: 'A4 · 432Hz' },
                    { note: 72, label: `C5 · ${midiNoteTo432Hz(72)}Hz` },
                    { note: 81, label: 'A5 · 864Hz' },
                  ].map((k) => (
                    <button
                      key={k.note}
                      type="button"
                      onClick={() => onSimulatePacket([0x90, k.note, 100], 'Virtual 432Hz Keys')}
                      className="px-2 py-1 rounded border border-slate-700 bg-slate-950 hover:border-cyan-400 text-slate-200 cyber:bg-black cyber:border-cyan-500/60 cyber:text-white lab:bg-white lab:border-slate-300 lab:text-slate-800 text-[10px] cursor-pointer transition-colors"
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: CC Parameter Mapping Matrix & Live MIDI Monitor */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* CC Mapping Matrix */}
            <div className="p-4 rounded-xl bg-slate-900/70 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-2.5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  3. Hardware CC Mapping &amp; MIDI Learn
                </span>
                <button
                  type="button"
                  onClick={onResetMappings}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 cyber:bg-black cyber:border-cyan-500/50 cyber:text-white lab:bg-white lab:border-slate-300 lab:text-slate-700 text-[10px] font-mono cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET DEFAULTS</span>
                </button>
              </div>

              {learningTarget && (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-200 cyber:bg-yellow-300 cyber:text-black lab:bg-amber-50 lab:text-amber-900 lab:border-amber-400 text-xs font-mono animate-pulse">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Target className="w-4 h-4" />
                    MIDI LEARN ACTIVE: Turn any knob or fader on your hardware controller for &quot;{learningTarget}&quot;...
                  </span>
                  <button
                    type="button"
                    onClick={onCancelLearn}
                    className="px-2 py-0.5 rounded bg-slate-950/60 text-white text-[10px] cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              )}

              <div className="space-y-2.5">
                {mappings.map((m) => {
                  const isLearning = learningTarget === m.target;
                  const icon =
                    m.target === 'oscFrequency' || m.target === 'oscToggle' || m.target === 'oscVolume' ? (
                      <Music className="w-3.5 h-3.5 text-cyan-400 lab:text-sky-600 shrink-0" />
                    ) : m.target === 'cathieGridVal' ? (
                      <Globe className="w-3.5 h-3.5 text-amber-400 lab:text-amber-600 shrink-0" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-fuchsia-400 lab:text-fuchsia-600 shrink-0" />
                    );

                  return (
                    <div
                      key={m.target}
                      className={`p-3 rounded-xl border transition-colors ${
                        isLearning
                          ? 'bg-amber-500/10 border-amber-400 cyber:bg-amber-950 lab:bg-amber-50'
                          : 'bg-slate-950/70 border-slate-800 cyber:bg-black cyber:border-cyan-500/40 lab:bg-white lab:border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {icon}
                          <div>
                            <div className="text-xs font-bold text-slate-100 cyber:text-white lab:text-slate-900">
                              {m.label}
                            </div>
                            <div className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
                              {m.description}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <label className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600">CC#</label>
                          <input
                            type="number"
                            min={0}
                            max={127}
                            value={m.cc}
                            onChange={(e) => {
                              const parsed = parseInt(e.target.value, 10);
                              if (!isNaN(parsed)) {
                                onUpdateMapping(m.target, {
                                  cc: Math.max(0, Math.min(127, parsed)),
                                });
                              }
                            }}
                            className="w-14 bg-slate-900 cyber:bg-black lab:bg-slate-50 border border-slate-700 cyber:border-cyan-400 lab:border-slate-300 rounded px-1.5 py-1 text-center text-cyan-300 cyber:text-yellow-300 lab:text-sky-700 font-bold"
                          />

                          <select
                            value={m.channel}
                            onChange={(e) =>
                              onUpdateMapping(m.target, {
                                channel: e.target.value === 'all' ? 'all' : Number(e.target.value),
                              })
                            }
                            aria-label={`${m.label} MIDI channel`}
                            className="bg-slate-900 cyber:bg-black lab:bg-slate-50 border border-slate-700 cyber:border-cyan-400 lab:border-slate-300 rounded px-1.5 py-1 text-[10px] text-slate-200 cyber:text-white lab:text-slate-800 cursor-pointer"
                          >
                            <option value="all">All Ch</option>
                            {Array.from({ length: 16 }, (_, idx) => idx + 1).map((ch) => (
                              <option key={ch} value={ch}>
                                Ch {ch}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => (isLearning ? onCancelLearn() : onStartLearn(m.target))}
                            className={`px-2.5 py-1 rounded border text-[10px] font-bold transition-colors cursor-pointer ${
                              isLearning
                                ? 'bg-amber-500 text-slate-950 border-amber-300'
                                : 'bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-50 lab:text-sky-800 lab:border-sky-300 lab:hover:bg-sky-100'
                            }`}
                          >
                            {isLearning ? 'LISTENING...' : 'LEARN'}
                          </button>
                        </div>
                      </div>

                      {m.target !== 'oscToggle' && (
                        <div className="mt-2 pt-2 border-t border-slate-800/70 cyber:border-cyan-500/30 lab:border-slate-200 flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
                          <div className="flex items-center gap-1">
                            <span>Min:</span>
                            <input
                              type="number"
                              value={m.min}
                              step={m.step}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (!isNaN(v)) onUpdateMapping(m.target, { min: v });
                              }}
                              className="w-16 bg-slate-900 cyber:bg-black lab:bg-slate-50 border border-slate-700 lab:border-slate-300 rounded px-1.5 py-0.5 text-slate-200 cyber:text-white lab:text-slate-800"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Max:</span>
                            <input
                              type="number"
                              value={m.max}
                              step={m.step}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (!isNaN(v)) onUpdateMapping(m.target, { max: v });
                              }}
                              className="w-16 bg-slate-900 cyber:bg-black lab:bg-slate-50 border border-slate-700 lab:border-slate-300 rounded px-1.5 py-0.5 text-slate-200 cyber:text-white lab:text-slate-800"
                            />
                          </div>
                          <span className="ml-auto text-slate-500 cyber:text-zinc-400 lab:text-slate-500">
                            Span: {m.min}–{m.max} {m.unit} (step {m.step})
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Incoming MIDI Stream Monitor */}
            <div className="p-3.5 rounded-xl bg-slate-950 cyber:bg-black lab:bg-slate-900 border border-cyan-500/30 cyber:border-cyan-400 lab:border-slate-700 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  LIVE HARDWARE MIDI TELEMETRY MONITOR
                </span>
                <button
                  type="button"
                  onClick={onClearMessages}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>

              {recentMessages.length === 0 ? (
                <div className="text-[11px] text-slate-500 py-3 text-center">
                  Turn a knob, move a fader, or press a virtual pad to observe raw MIDI packets &amp; Dragon 9 mappings.
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                  {recentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 rounded bg-slate-900/90 border border-slate-800 text-[10px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{msg.timestamp}</span>
                        <span className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">{msg.rawHex}</span>
                        <span className="text-cyan-300 font-bold">
                          {msg.type} Ch{msg.channel} [{msg.data1}, {msg.data2}]
                        </span>
                      </div>
                      {msg.mappedAction ? (
                        <span className="text-emerald-300 font-bold">{msg.mappedAction}</span>
                      ) : (
                        <span className="text-slate-500 italic">unmapped ({msg.deviceName})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
