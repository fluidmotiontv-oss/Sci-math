import React, { useMemo, useState } from 'react';
import {
  Box,
  Download,
  X,
  CheckCircle2,
  Layers,
  Waves,
  Globe,
  Compass,
  Sparkles,
  FileCode,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import {
  Export3DFormat,
  Export3DTarget,
  Export3DResult,
  Live3DSnapshotRefs,
  ViewportSceneMode,
  buildExportSceneGroup,
  disposeExportGroup,
  exportDragon3DModel,
} from '../utils/export3DModel';
import { LogCategory } from '../types/dragon';

interface Export3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneMode: ViewportSceneMode;
  frequency: number;
  isAudioPlaying: boolean;
  polarityAlpha: number;
  polarityBeta: number;
  codename: string;
  getLiveRefs?: () => Live3DSnapshotRefs | null;
  onLogEvent?: (category: LogCategory, title: string, details: string, metadata?: Record<string, any>) => void;
}

const TARGET_OPTIONS: {
  id: Export3DTarget;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'visible',
    label: 'Active Viewport Assembly',
    subtitle: 'Matches currently displayed 3D mode & active layers',
    icon: Compass,
  },
  {
    id: 'sovereign-core',
    label: 'Dragon 9 Sovereign Core',
    subtitle: 'TorusKnot (3,4), Dodecahedron Heart, α/β Polarity Pins & Rings',
    icon: Box,
  },
  {
    id: 'cathie-grid',
    label: 'Bruce Cathie Geodesic Sphere',
    subtitle: '144k arc-min icosahedral cage, latitudes & 5 planetary nodes',
    icon: Globe,
  },
  {
    id: 'cymatic-shell',
    label: 'Cymatic Interference Shell',
    subtitle: 'Harmonic standing-wave displaced icosahedron with vertex colors',
    icon: Sparkles,
  },
  {
    id: 'acoustic-wave',
    label: 'Acoustic Waveform Halo',
    subtitle: '256-point radial Fourier ring (solidified tube for STL)',
    icon: Waves,
  },
  {
    id: 'full-ecosystem',
    label: 'Complete 3D Ecosystem',
    subtitle: 'All 4 procedural assemblies merged in a single hierarchy',
    icon: Layers,
  },
];

const FORMAT_OPTIONS: {
  id: Export3DFormat;
  ext: string;
  label: string;
  badge?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'glb',
    ext: '.GLB',
    label: 'Binary glTF 2.0',
    badge: 'RECOMMENDED',
    description: 'Single binary with PBR metals, emissives & vertex colors (Blender, Unity, Web)',
    icon: Box,
  },
  {
    id: 'gltf',
    ext: '.GLTF',
    label: 'JSON glTF 2.0',
    description: 'Human-readable JSON scene hierarchy & embedded geometry buffers',
    icon: FileCode,
  },
  {
    id: 'obj',
    ext: '.OBJ',
    label: 'Wavefront OBJ',
    description: 'Universal ASCII geometry & wireframe lines for DCC tools',
    icon: Layers,
  },
  {
    id: 'stl',
    ext: '.STL',
    label: 'Binary STL',
    description: 'Watertight triangle mesh for 3D printing & CAD (auto-solidifies lines)',
    icon: Printer,
  },
];

export const Export3DModal: React.FC<Export3DModalProps> = ({
  isOpen,
  onClose,
  sceneMode,
  frequency,
  isAudioPlaying,
  polarityAlpha,
  polarityBeta,
  codename,
  getLiveRefs,
  onLogEvent,
}) => {
  const [target, setTarget] = useState<Export3DTarget>('sovereign-core');
  const [format, setFormat] = useState<Export3DFormat>('glb');
  const [bakeHarmonicWave, setBakeHarmonicWave] = useState<boolean>(true);
  const [centerAtOrigin, setCenterAtOrigin] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<Export3DResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const previewStats = useMemo(() => {
    if (!isOpen) return null;
    try {
      const liveRefs = getLiveRefs ? getLiveRefs() : null;
      const { exportGroup, stats } = buildExportSceneGroup({
        target,
        format,
        sceneMode,
        frequency,
        isAudioPlaying,
        polarityAlpha,
        polarityBeta,
        codename,
        bakeHarmonicWave,
        centerAtOrigin,
        liveRefs,
      });
      disposeExportGroup(exportGroup);
      return stats;
    } catch (err) {
      console.error('Failed to preview export geometry:', err);
      return null;
    }
  }, [
    isOpen,
    target,
    format,
    sceneMode,
    frequency,
    isAudioPlaying,
    polarityAlpha,
    polarityBeta,
    codename,
    bakeHarmonicWave,
    centerAtOrigin,
    getLiveRefs,
  ]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportResult(null);

    try {
      const liveRefs = getLiveRefs ? getLiveRefs() : null;
      const result = await exportDragon3DModel({
        target,
        format,
        sceneMode,
        frequency,
        isAudioPlaying,
        polarityAlpha,
        polarityBeta,
        codename,
        bakeHarmonicWave,
        centerAtOrigin,
        liveRefs,
      });

      setExportResult(result);

      if (onLogEvent) {
        onLogEvent(
          'SYSTEM_EVENT',
          `3D Model Exported: ${result.filename}`,
          `Exported "${target}" assembly as ${format.toUpperCase()} (${(result.byteSize / 1024).toFixed(1)} KB, ${result.stats.triangleCount.toLocaleString()} triangles, ${result.stats.vertexCount.toLocaleString()} vertices) at ${frequency}Hz.`,
          {
            filename: result.filename,
            format,
            target,
            byteSize: result.byteSize,
            triangles: result.stats.triangleCount,
            vertices: result.stats.vertexCount,
            bakeHarmonicWave,
            centerAtOrigin,
          }
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to serialize 3D model geometry.';
      setExportError(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 cyber:bg-black/90 lab:bg-slate-900/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-3d-modal-title"
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-950 cyber:bg-black lab:bg-white border border-cyan-500/40 cyber:border-cyan-400 lab:border-slate-300 rounded-2xl shadow-2xl text-slate-100 cyber:text-white lab:text-slate-900 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 cyber:border-cyan-500/50 lab:border-slate-200 sticky top-0 bg-slate-950 cyber:bg-black lab:bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 cyber:bg-cyan-400/20 lab:bg-sky-100 border border-cyan-500/40 cyber:border-cyan-400 lab:border-sky-300 flex items-center justify-center">
              <Download className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-700" />
            </div>
            <div>
              <h3
                id="export-3d-modal-title"
                className="text-sm sm:text-base font-bold tracking-wide text-cyan-300 cyber:text-cyan-300 lab:text-sky-800"
              >
                Export Procedural 3D Models
              </h3>
              <p className="text-[11px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
                Serialize Dragon 9 meshes, harmonic standing waves &amp; geodesic lattices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Export 3D Models dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 cyber:text-cyan-300 cyber:hover:bg-cyan-950 lab:text-slate-500 lab:hover:text-slate-900 lab:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* 1. Model Assembly Target */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 cyber:text-cyan-300 lab:text-slate-700">
                1. Select 3D Model Assembly
              </label>
              <span className="text-[10px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-500">
                Active Viewport: <strong className="text-cyan-400 cyber:text-yellow-300 lab:text-sky-700">{sceneMode}</strong>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TARGET_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = target === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setTarget(opt.id);
                      setExportResult(null);
                    }}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      active
                        ? 'bg-cyan-500/15 border-cyan-400 cyber:bg-cyan-950 cyber:border-cyan-300 lab:bg-sky-50 lab:border-sky-600'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 cyber:bg-black cyber:border-cyan-900 cyber:hover:border-cyan-400 lab:bg-slate-50 lab:border-slate-200 lab:hover:border-slate-300'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        active
                          ? 'text-cyan-300 cyber:text-yellow-300 lab:text-sky-700'
                          : 'text-slate-400 cyber:text-cyan-400 lab:text-slate-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold ${
                          active
                            ? 'text-cyan-200 cyber:text-white lab:text-sky-900'
                            : 'text-slate-200 cyber:text-zinc-100 lab:text-slate-800'
                        }`}
                      >
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 leading-snug mt-0.5">
                        {opt.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Export Format */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 cyber:text-cyan-300 lab:text-slate-700">
              2. Export File Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FORMAT_OPTIONS.map((fmt) => {
                const Icon = fmt.icon;
                const active = format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      setFormat(fmt.id);
                      setExportResult(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      active
                        ? 'bg-fuchsia-500/15 border-fuchsia-400 cyber:bg-fuchsia-950 cyber:border-fuchsia-300 lab:bg-sky-50 lab:border-sky-600'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 cyber:bg-black cyber:border-cyan-900 cyber:hover:border-cyan-400 lab:bg-slate-50 lab:border-slate-200 lab:hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-mono text-xs font-bold flex items-center gap-1 ${
                          active
                            ? 'text-fuchsia-300 cyber:text-yellow-300 lab:text-sky-800'
                            : 'text-slate-200 cyber:text-white lab:text-slate-900'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {fmt.ext}
                      </span>
                      {fmt.badge && (
                        <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cyber:bg-yellow-300 cyber:text-black lab:bg-emerald-100 lab:text-emerald-800 lab:border-emerald-300">
                          BEST
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-300 cyber:text-zinc-200 lab:text-slate-800">
                      {fmt.label}
                    </div>
                    <div className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 leading-tight">
                      {fmt.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Geometry Conditioning Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/70 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={bakeHarmonicWave}
                onChange={(e) => setBakeHarmonicWave(e.target.checked)}
                className="mt-0.5 accent-cyan-500 lab:accent-sky-700 cursor-pointer"
              />
              <div>
                <div className="text-xs font-bold text-slate-200 cyber:text-white lab:text-slate-900">
                  Bake Harmonic Wave Displacement ({frequency} Hz)
                </div>
                <div className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-0.5">
                  Sculpts standing-wave interference directly into TorusKnot, Heart &amp; Cymatic vertices.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/70 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={centerAtOrigin}
                onChange={(e) => setCenterAtOrigin(e.target.checked)}
                className="mt-0.5 accent-cyan-500 lab:accent-sky-700 cursor-pointer"
              />
              <div>
                <div className="text-xs font-bold text-slate-200 cyber:text-white lab:text-slate-900">
                  Center Assembly at Origin (0, 0, 0)
                </div>
                <div className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-0.5">
                  Normalizes bounding center to world origin for Blender, CAD &amp; 3D slicers.
                </div>
              </div>
            </label>
          </div>

          {/* 4. Live Geometry Telemetry */}
          {previewStats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-slate-900/80 cyber:bg-[#050811] lab:bg-slate-100 border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 font-mono text-[11px] tabular-nums">
              <div>
                <span className="text-[9px] uppercase text-slate-500 cyber:text-zinc-400 lab:text-slate-500 block">
                  Triangles
                </span>
                <span className="font-bold text-cyan-300 cyber:text-cyan-300 lab:text-sky-700">
                  {previewStats.triangleCount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-500 cyber:text-zinc-400 lab:text-slate-500 block">
                  Vertices
                </span>
                <span className="font-bold text-slate-200 cyber:text-white lab:text-slate-900">
                  {previewStats.vertexCount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-500 cyber:text-zinc-400 lab:text-slate-500 block">
                  Sub-Meshes
                </span>
                <span className="font-bold text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-700">
                  {previewStats.meshCount}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-500 cyber:text-zinc-400 lab:text-slate-500 block">
                  Wire/Lines
                </span>
                <span className="font-bold text-amber-300 cyber:text-yellow-300 lab:text-amber-700">
                  {previewStats.lineCount}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-500 cyber:text-zinc-400 lab:text-slate-500 block">
                  Bounds (X·Y·Z)
                </span>
                <span className="font-bold text-slate-200 cyber:text-white lab:text-slate-900">
                  {previewStats.boundsSize.x}×{previewStats.boundsSize.y}×{previewStats.boundsSize.z}
                </span>
              </div>
            </div>
          )}

          {/* Export Feedback */}
          {exportError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/50 text-rose-200 lab:bg-rose-50 lab:text-rose-800 lab:border-rose-300 text-xs font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}

          {exportResult && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-emerald-200 cyber:bg-emerald-950 cyber:border-emerald-400 lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300 text-xs font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 lab:text-emerald-600 shrink-0" />
                <span>
                  Exported <strong>{exportResult.filename}</strong> ({formatBytes(exportResult.byteSize)})
                </span>
              </div>
              <span className="text-[10px] opacity-80 hidden sm:inline">
                Logged to Session Stream
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-800 cyber:border-cyan-500/50 lab:border-slate-200 bg-slate-900/50 cyber:bg-black lab:bg-slate-50">
          <span className="text-[10px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
            α {polarityAlpha}% / β {polarityBeta}% · Node {codename}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 cyber:border-cyan-500/50 cyber:text-white lab:border-slate-300 lab:text-slate-700 lab:hover:bg-slate-200 text-xs font-mono cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white text-xs font-mono font-bold shadow-lg shadow-cyan-500/20 lab:shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'SERIALIZING MESH...' : `EXPORT ${format.toUpperCase()} MODEL`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
