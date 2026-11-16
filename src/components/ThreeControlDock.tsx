import React, { useState, useRef, useEffect } from 'react';
import { SceneMode } from './ThreeViewport';
import { Eye, ChevronDown, ChevronUp, Box, RotateCw, Compass, Shield, BookOpen, Zap, Download, Film, Camera, Check, ExternalLink, X } from 'lucide-react';

export interface SnapshotCaptureOutcome {
  ok: boolean;
  previewUrl?: string;
  title?: string;
  resolution?: string;
}

interface ThreeControlDockProps {
  sceneMode: SceneMode;
  onSceneModeChange: (mode: SceneMode) => void;
  cameraPreset: string;
  onCameraPresetChange: (preset: string) => void;
  wireframeOnly: boolean;
  onToggleWireframe: () => void;
  rotationSpeed: number;
  onRotationSpeedChange: (speed: number) => void;
  pulseSync?: boolean;
  onTogglePulseSync?: () => void;
  isCinemaMode: boolean;
  onToggleCinemaMode: () => void;
  polarityAlpha: number;
  polarityBeta: number;
  onToggleGuide?: () => void;
  isGuideOpen?: boolean;
  onOpenExport3D?: () => void;
  onOpenVideoStudio?: () => void;
  onCaptureSnapshot?: () => SnapshotCaptureOutcome | null;
  onJumpToSessionLog?: () => void;
}

export const ThreeControlDock: React.FC<ThreeControlDockProps> = ({
  sceneMode,
  onSceneModeChange,
  cameraPreset,
  onCameraPresetChange,
  wireframeOnly,
  onToggleWireframe,
  rotationSpeed,
  onRotationSpeedChange,
  pulseSync = false,
  onTogglePulseSync,
  isCinemaMode,
  onToggleCinemaMode,
  polarityAlpha,
  polarityBeta,
  onToggleGuide,
  isGuideOpen = false,
  onOpenExport3D,
  onOpenVideoStudio,
  onCaptureSnapshot,
  onJumpToSessionLog,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [justCaptured, setJustCaptured] = useState(false);
  const [snapshotFeedback, setSnapshotFeedback] = useState<{
    previewUrl?: string;
    title: string;
    resolution: string;
  } | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const handleSnapshotClick = () => {
    if (!onCaptureSnapshot) return;
    const outcome = onCaptureSnapshot();
    if (outcome && outcome.ok) {
      setJustCaptured(true);
      setSnapshotFeedback({
        previewUrl: outcome.previewUrl,
        title: outcome.title || '3D Scene Snapshot Logged',
        resolution: outcome.resolution || '1280×720',
      });
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = window.setTimeout(() => {
        setJustCaptured(false);
        setSnapshotFeedback(null);
        feedbackTimerRef.current = null;
      }, 5000);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 'min(940px, 95vw)',
        zIndex: 30,
      }}
      className="flex flex-col items-center pointer-events-auto transition-all duration-300"
    >
      {/* Snapshot Confirmation Preview Toast */}
      {snapshotFeedback && (
        <div className="mb-2 flex items-center gap-2.5 bg-slate-950 cyber:bg-black lab:bg-white border border-emerald-500/60 cyber:border-emerald-400 lab:border-emerald-500 rounded-xl px-2.5 py-1.5 shadow-2xl text-xs font-mono">
          {snapshotFeedback.previewUrl && (
            <img
              src={snapshotFeedback.previewUrl}
              alt="Captured 3D scene snapshot thumbnail"
              className="w-16 h-9 rounded object-cover border border-emerald-400/50 shrink-0 bg-slate-900"
            />
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-emerald-300 cyber:text-emerald-300 lab:text-emerald-800 font-bold text-[11px] flex items-center gap-1 whitespace-nowrap">
              <Check className="w-3.5 h-3.5 text-emerald-400 lab:text-emerald-600 shrink-0" />
              <span>Added to Session Log ({snapshotFeedback.resolution})</span>
            </span>
            <span className="text-slate-400 cyber:text-zinc-300 lab:text-slate-600 text-[10px] truncate max-w-[220px]">
              {snapshotFeedback.title}
            </span>
          </div>
          {onJumpToSessionLog && (
            <button
              type="button"
              onClick={() => {
                setSnapshotFeedback(null);
                onJumpToSessionLog();
              }}
              className="ml-1 px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-500/50 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-600 lab:text-white lab:hover:bg-emerald-700 text-[10px] font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors"
            >
              <span>View Log</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setSnapshotFeedback(null)}
            aria-label="Dismiss snapshot confirmation"
            className="p-0.5 text-slate-500 hover:text-slate-200 lab:text-slate-400 lab:hover:text-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mb-1.5 flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 cyber:bg-black cyber:hover:bg-cyan-950 lab:bg-white/95 lab:hover:bg-slate-100 text-slate-300 hover:text-cyan-400 cyber:text-cyan-300 lab:text-slate-700 lab:hover:text-sky-700 border border-slate-700/70 cyber:border-cyan-400 lab:border-slate-300 rounded-full text-xs font-mono tracking-wider shadow-lg lab:shadow-sm transition-colors cursor-pointer"
        title="Toggle HUD (Hotkey: H)"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-cyan-400 lab:text-sky-700" />
            <span>SHOW 3D DOCK</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400 lab:text-sky-700" />
            <span>COLLAPSE HUD</span>
          </>
        )}
      </button>

      {/* Dock Content Panel */}
      {!isCollapsed && (
        <div className="w-full bg-slate-950/90 cyber:bg-black lab:bg-white/95 border border-cyan-500/30 cyber:border-cyan-400 lab:border-slate-300 rounded-2xl p-3 shadow-2xl lab:shadow-md flex flex-wrap items-center justify-between gap-3 text-xs text-slate-200 cyber:text-white lab:text-slate-800 transition-colors">
          {/* Scene Mode Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 cyber:text-cyan-300 lab:text-slate-600 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Box className="w-3.5 h-3.5 text-cyan-400 lab:text-sky-700" />
              Mode:
            </span>
            <div className="flex bg-slate-900 cyber:bg-black lab:bg-slate-100 border border-slate-800 cyber:border-cyan-500/60 lab:border-slate-300 rounded-lg p-0.5">
              {(
                [
                  { id: 'sovereign-core', label: 'Core' },
                  { id: 'cathie-grid', label: 'Cathie Grid' },
                  { id: 'nonary-clock', label: 'Clock' },
                  { id: 'lissajous-wave', label: 'Wave 432' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSceneModeChange(m.id)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    sceneMode === m.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-white lab:text-sky-700 lab:border-slate-300 lab:shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600 lab:hover:text-slate-900'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Camera View Presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 cyber:text-yellow-300 lab:text-slate-600 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-amber-400 lab:text-amber-600" />
              Cam:
            </span>
            <div className="flex bg-slate-900 cyber:bg-black lab:bg-slate-100 border border-slate-800 cyber:border-cyan-500/60 lab:border-slate-300 rounded-lg p-0.5">
              {[
                { id: 'perspective', label: 'Iso' },
                { id: 'top-grid', label: 'Top' },
                { id: 'core-focus', label: 'Nucleus' },
                { id: 'polar-axis', label: 'Polar' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => onCameraPresetChange(p.id)}
                  className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                    cameraPreset === p.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cyber:bg-yellow-300 cyber:text-black lab:bg-white lab:text-amber-700 lab:border-slate-300 lab:shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600 lab:hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Toggles: Wireframe & Rotation */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleWireframe}
              className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] transition-colors cursor-pointer ${
                wireframeOnly
                  ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:text-white lab:border-sky-800'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/50 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-slate-900'
              }`}
            >
              Wireframe: {wireframeOnly ? 'ON' : 'OFF'}
            </button>

            <div className="flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-slate-400 lab:text-slate-600" />
              <select
                value={rotationSpeed}
                onChange={(e) => onRotationSpeedChange(parseFloat(e.target.value))}
                aria-label="3D Rotation Speed"
                className="bg-slate-900 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-500/60 lab:border-slate-300 text-slate-300 cyber:text-white lab:text-slate-800 text-xs rounded px-1.5 py-1 cursor-pointer focus:outline-none focus:border-cyan-500"
              >
                <option value={0}>Freeze</option>
                <option value={0.5}>0.5x</option>
                <option value={1}>1.0x</option>
                <option value={2}>2.0x</option>
              </select>
            </div>

            {onTogglePulseSync && (
              <button
                onClick={onTogglePulseSync}
                className={`px-2 py-1 rounded-lg border font-mono text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
                  pulseSync
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/80 font-bold shadow-sm shadow-emerald-500/20 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-600 lab:text-white lab:border-emerald-700'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/50 lab:bg-white lab:text-slate-600 lab:border-slate-300'
                }`}
                title="Toggle dynamic rotation speed pulse synchronization to audio frequency"
              >
                <Zap className={`w-3 h-3 ${pulseSync ? 'text-emerald-400 cyber:text-black lab:text-white fill-current' : 'text-slate-500'}`} />
                <span>Pulse: {pulseSync ? 'SYNC' : 'OFF'}</span>
              </button>
            )}

            {/* Polarity Quick Indicator */}
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 cyber:border-cyan-500/50 lab:border-slate-300 pl-3">
              <Shield className="w-3.5 h-3.5 text-cyan-400 lab:text-sky-700" />
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <span className="text-cyan-400 cyber:text-cyan-300 lab:text-sky-700">α {polarityAlpha}%</span>
                <span className="text-slate-600 lab:text-slate-400">/</span>
                <span className="text-fuchsia-400 cyber:text-fuchsia-300 lab:text-fuchsia-700">β {polarityBeta}%</span>
              </div>
            </div>

            {/* Explain Model Progression Guide Toggle */}
            {onToggleGuide && (
              <button
                onClick={onToggleGuide}
                className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 text-[11px] transition-colors cursor-pointer ${
                  isGuideOpen
                    ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 font-bold cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:text-white'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-cyan-300 hover:border-cyan-500/50 cyber:bg-black cyber:text-white cyber:border-cyan-400/70 lab:bg-white lab:text-slate-700 lab:border-slate-300 lab:hover:text-sky-700'
                }`}
                title="Explain the Model Progression & Mechanics"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400 cyber:text-inherit lab:text-inherit" />
                <span>Explain Model</span>
              </button>
            )}

            {/* Capture Scene Snapshot Button */}
            {onCaptureSnapshot && (
              <button
                type="button"
                onClick={handleSnapshotClick}
                aria-label="Capture Scene Snapshot"
                className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  justCaptured
                    ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-600 lab:text-white lab:border-emerald-700'
                    : 'bg-emerald-500/15 text-emerald-200 border-emerald-500/50 hover:bg-emerald-500/30 hover:border-emerald-400 cyber:bg-black cyber:text-emerald-300 cyber:border-emerald-400 cyber:hover:bg-emerald-400 cyber:hover:text-black lab:bg-emerald-700 lab:text-white lab:border-emerald-800 lab:hover:bg-emerald-800'
                }`}
                title="Capture high-resolution 2D thumbnail of the 3D scene and add it to the Session Log"
              >
                {justCaptured ? <Check className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                <span>{justCaptured ? 'Captured' : 'Snapshot'}</span>
              </button>
            )}

            {/* Export 3D Model Button */}
            {onOpenExport3D && (
              <button
                type="button"
                onClick={onOpenExport3D}
                className="px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-cyan-500/15 text-cyan-200 border-cyan-500/50 hover:bg-cyan-500/30 hover:border-cyan-400 cyber:bg-black cyber:text-yellow-300 cyber:border-yellow-400 cyber:hover:bg-yellow-400 cyber:hover:text-black lab:bg-sky-700 lab:text-white lab:border-sky-800 lab:hover:bg-sky-800"
                title="Export 3D models (.GLB, .GLTF, .OBJ, .STL)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export 3D</span>
              </button>
            )}

            {/* MP3 -> 3D Video Studio Button */}
            {onOpenVideoStudio && (
              <button
                type="button"
                onClick={onOpenVideoStudio}
                className="px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/50 hover:bg-fuchsia-500/30 hover:border-fuchsia-400 cyber:bg-black cyber:text-fuchsia-300 cyber:border-fuchsia-400 cyber:hover:bg-fuchsia-400 cyber:hover:text-black lab:bg-fuchsia-700 lab:text-white lab:border-fuchsia-800 lab:hover:bg-fuchsia-800"
                title="Upload MP3 & generate a 3D video showcasing the creative models"
              >
                <Film className="w-3.5 h-3.5" />
                <span>MP3 Video</span>
              </button>
            )}

            {/* Cinema / Zen View Toggle */}
            <button
              onClick={onToggleCinemaMode}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${
                isCinemaMode
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50 cyber:bg-fuchsia-400 cyber:text-black lab:bg-fuchsia-700 lab:text-white'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/50 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-slate-900'
              }`}
              title="Full 3D Viewport without side chambers"
            >
              <Eye className="w-3 h-3" />
              {isCinemaMode ? 'Split View' : 'Zen 3D'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
