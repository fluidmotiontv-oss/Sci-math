import React from 'react';
import { NonaryClockState, DragonNodeConfig, AppTheme, MidiConnectionStatus } from '../types/dragon';
import { Zap, Shield, Box, Eye, Activity, BookOpen, Palette, Moon, Monitor, Sun, Cable } from 'lucide-react';

interface HeaderProps {
  timeState: NonaryClockState;
  nodeConfig: DragonNodeConfig;
  isCinemaMode: boolean;
  onToggleCinemaMode: () => void;
  show3DInSplit: boolean;
  onToggle3DSplit: () => void;
  onToggleGuide?: () => void;
  isGuideOpen?: boolean;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  midiStatus?: MidiConnectionStatus;
  midiDeviceCount?: number;
  midiPulseActive?: boolean;
  onOpenMidiModal?: () => void;
}

const THEME_OPTIONS: { id: AppTheme; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'sovereign-dark', label: 'Sovereign Dark', shortLabel: 'Sovereign', icon: Moon },
  { id: 'high-contrast-cyber', label: 'High-Contrast Cyber', shortLabel: 'Cyber HC', icon: Monitor },
  { id: 'minimalist-lab', label: 'Minimalist Laboratory', shortLabel: 'Lab Light', icon: Sun },
];

export const Header: React.FC<HeaderProps> = ({
  timeState,
  nodeConfig,
  isCinemaMode,
  onToggleCinemaMode,
  show3DInSplit,
  onToggle3DSplit,
  onToggleGuide,
  isGuideOpen = false,
  theme,
  onThemeChange,
  midiStatus = 'disconnected',
  midiDeviceCount = 0,
  midiPulseActive = false,
  onOpenMidiModal,
}) => {
  return (
    <header className="flex flex-wrap justify-between items-center gap-3 bg-slate-950/90 cyber:bg-black lab:bg-white/95 border-b border-cyan-500/20 cyber:border-cyan-400/70 lab:border-slate-200 px-4 py-3 sm:px-6 z-20 backdrop-blur-md transition-colors">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-fuchsia-600 cyber:from-cyan-300 cyber:to-yellow-300 lab:from-sky-600 lab:via-cyan-700 lab:to-slate-800 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 lab:shadow-sm">
          <div className="w-full h-full bg-slate-950 cyber:bg-black lab:bg-white rounded-[10px] flex items-center justify-center">
            <span className="font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 cyber:from-cyan-300 cyber:to-yellow-300 lab:from-sky-700 lab:to-slate-900 text-sm">
              D9
            </span>
          </div>
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 cyber:text-white cyber:bg-none lab:text-slate-900 lab:bg-none">
            Advanced Science &amp; Maths Lab
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-400 cyber:text-cyan-200 lab:text-slate-500 tracking-wide font-mono">
            Harmonic Audio, Light-Speed Grid &amp; Cipher Engine · Dragon 9
          </p>
        </div>
      </div>

      {/* Node Telemetry, Theme Selector & Workspace Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* Theme Selector */}
        <div
          role="group"
          aria-label="Theme selector"
          className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 cyber:bg-black lab:bg-slate-100 border border-slate-800 cyber:border-cyan-400/70 lab:border-slate-300"
        >
          <span className="hidden xl:flex items-center gap-1 px-1.5 text-[10px] font-mono text-slate-400 cyber:text-cyan-300 lab:text-slate-600 whitespace-nowrap">
            <Palette className="w-3 h-3" />
            Theme:
          </span>
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onThemeChange(opt.id)}
                aria-pressed={isSelected}
                title={`Switch to ${opt.label} theme`}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 font-bold cyber:bg-cyan-400 cyber:text-black cyber:border-cyan-300 lab:bg-white lab:text-sky-700 lab:border-slate-300 lab:shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent cyber:text-zinc-300 cyber:hover:text-cyan-300 lab:text-slate-600 lab:hover:text-slate-900'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="hidden md:inline">{opt.label}</span>
                <span className="md:hidden">{opt.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Web MIDI Hardware Controller Button */}
        {onOpenMidiModal && (
          <button
            type="button"
            onClick={onOpenMidiModal}
            title="Open Web MIDI Hardware Controller Bridge"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              midiStatus === 'connected'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/25 cyber:bg-emerald-400 cyber:text-black cyber:border-white lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-cyan-300 hover:border-cyan-500/50 cyber:bg-black cyber:text-white cyber:border-cyan-400/70 lab:bg-white lab:text-slate-700 lab:border-slate-300 lab:hover:text-sky-700'
            }`}
          >
            <Cable className="w-3.5 h-3.5" />
            <span>
              MIDI{midiStatus === 'connected' ? (midiDeviceCount > 0 ? ` (${midiDeviceCount})` : ' READY') : ''}
            </span>
            {midiPulseActive && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        )}

        {/* Node Codename */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 cyber:bg-black lab:bg-slate-100 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 text-xs font-mono whitespace-nowrap">
          <span className="text-slate-500 cyber:text-zinc-300 lab:text-slate-500">NODE:</span>
          <span className="text-cyan-400 cyber:text-yellow-300 lab:text-sky-700 font-bold">{nodeConfig.codename}</span>
        </div>

        {/* Two-Pin Polarity Ratio */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 cyber:bg-black lab:bg-slate-100 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 text-xs font-mono tabular-nums whitespace-nowrap">
          <Activity className="w-3.5 h-3.5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-700" />
          <span className="text-cyan-400 cyber:text-cyan-300 lab:text-sky-700">α {nodeConfig.polarityAlpha}%</span>
          <span className="text-slate-600 cyber:text-zinc-500 lab:text-slate-400">/</span>
          <span className="text-fuchsia-400 cyber:text-fuchsia-300 lab:text-fuchsia-700">β {nodeConfig.polarityBeta}%</span>
        </div>

        {/* Apex Alignment Live Status */}
        {timeState.isApexActive ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 cyber:bg-yellow-400 lab:bg-amber-50 border border-amber-400 cyber:border-yellow-300 lab:border-amber-400 text-amber-300 cyber:text-black lab:text-amber-800 text-xs font-mono font-bold shadow-md shadow-amber-500/20 lab:shadow-none whitespace-nowrap">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>APEX ACTIVE</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 cyber:bg-black lab:bg-slate-100 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 text-slate-400 cyber:text-white lab:text-slate-700 text-xs font-mono tabular-nums whitespace-nowrap">
            <Shield className="w-3.5 h-3.5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-700" />
            <span>APEX T - {timeState.timeToNextApexMin}m</span>
          </div>
        )}

        {/* Model Progression Guide Button */}
        {onToggleGuide && (
          <button
            type="button"
            onClick={onToggleGuide}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isGuideOpen
                ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 font-bold shadow-lg shadow-cyan-500/20 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:text-white lab:border-sky-800 lab:shadow-none'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-cyan-300 hover:border-cyan-500/50 cyber:bg-black cyber:text-white cyber:border-cyan-400/70 cyber:hover:border-yellow-300 lab:bg-white lab:text-slate-700 lab:border-slate-300 lab:hover:bg-slate-100 lab:hover:text-sky-700'
            }`}
            title="Open Model Progression & Mechanics Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400 cyber:text-inherit lab:text-inherit" />
            <span className="hidden sm:inline">MODEL</span> GUIDE
          </button>
        )}

        {/* 3D Viewport Split Toggles */}
        <button
          type="button"
          onClick={onToggle3DSplit}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            show3DInSplit
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 cyber:bg-cyan-950 cyber:text-cyan-200 cyber:border-cyan-400 lab:bg-sky-50 lab:text-sky-800 lab:border-sky-300'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-300 cyber:border-cyan-500/50 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-slate-900'
          }`}
          title="Toggle 3D Viewport on/off in workspace"
        >
          <Box className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">3D MESH:</span> {show3DInSplit ? 'SPLIT' : 'OFF'}
        </button>

        <button
          type="button"
          onClick={onToggleCinemaMode}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            isCinemaMode
              ? 'bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-400 font-bold cyber:bg-fuchsia-400 cyber:text-black cyber:border-white lab:bg-fuchsia-700 lab:text-white lab:border-fuchsia-800'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/50 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-slate-900'
          }`}
          title="Toggle Zen Fullscreen 3D Viewport"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ZEN</span> 3D
        </button>
      </div>
    </header>
  );
};

