import React, { useState, useEffect, useRef } from 'react';
import { SessionLogEntry, LogCategory } from '../types/dragon';
import { 
  ScrollText, 
  Search, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  ArrowDown, 
  Filter, 
  Waves, 
  Globe, 
  Binary, 
  Cpu, 
  Activity, 
  Terminal, 
  CheckCircle2,
  RefreshCw,
  Camera,
  Maximize2,
  X
} from 'lucide-react';

interface SessionLogViewProps {
  logs: SessionLogEntry[];
  onClearLogs: () => void;
  onAddTestEntry?: () => void;
}

export const SessionLogView: React.FC<SessionLogViewProps> = ({
  logs,
  onClearLogs,
  onAddTestEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | 'ALL'>('ALL');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [expandedSnapshot, setExpandedSnapshot] = useState<SessionLogEntry | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs update if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, selectedCategory, searchTerm]);

  // Filter logs based on search and category
  const filteredLogs = logs.filter((log) => {
    const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    const titleMatch = log.title.toLowerCase().includes(term);
    const detailsMatch = log.details.toLowerCase().includes(term);
    const categoryMatch = log.category.toLowerCase().includes(term);
    const metaMatch = log.metadata ? JSON.stringify(log.metadata).toLowerCase().includes(term) : false;

    return titleMatch || detailsMatch || categoryMatch || metaMatch;
  });

  const getCategoryConfig = (category: LogCategory) => {
    switch (category) {
      case 'TAB_SWITCH':
        return {
          label: 'TAB SWITCH',
          color: 'text-cyan-400 bg-cyan-950/80 border-cyan-800 cyber:bg-black cyber:text-cyan-300 cyber:border-cyan-400 lab:bg-sky-50 lab:text-sky-800 lab:border-sky-300',
          icon: Globe,
          dotColor: 'bg-cyan-400 lab:bg-sky-600',
        };
      case 'CONFIG_CHANGE':
        return {
          label: 'CONFIG',
          color: 'text-fuchsia-400 bg-fuchsia-950/80 border-fuchsia-800 cyber:bg-black cyber:text-fuchsia-300 cyber:border-fuchsia-400 lab:bg-fuchsia-50 lab:text-fuchsia-800 lab:border-fuchsia-300',
          icon: Cpu,
          dotColor: 'bg-fuchsia-400 lab:bg-fuchsia-600',
        };
      case 'CIPHER_GENERATE':
        return {
          label: 'CIPHER',
          color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800 cyber:bg-black cyber:text-emerald-300 cyber:border-emerald-400 lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300',
          icon: Binary,
          dotColor: 'bg-emerald-400 lab:bg-emerald-600',
        };
      case 'AUDIO_SYNTH':
        return {
          label: 'AUDIO SYNTH',
          color: 'text-amber-400 bg-amber-950/80 border-amber-800 cyber:bg-black cyber:text-yellow-300 cyber:border-yellow-300 lab:bg-amber-50 lab:text-amber-800 lab:border-amber-300',
          icon: Waves,
          dotColor: 'bg-amber-400 lab:bg-amber-600',
        };
      case 'GRID_UPDATE':
        return {
          label: 'CATHIE GRID',
          color: 'text-yellow-400 bg-yellow-950/80 border-yellow-800 cyber:bg-black cyber:text-yellow-300 cyber:border-yellow-300 lab:bg-yellow-50 lab:text-yellow-800 lab:border-yellow-300',
          icon: Activity,
          dotColor: 'bg-yellow-400 lab:bg-yellow-600',
        };
      case 'SCENE_SNAPSHOT':
        return {
          label: 'SNAPSHOT',
          color: 'text-teal-300 bg-teal-950/80 border-teal-700 cyber:bg-black cyber:text-emerald-300 cyber:border-emerald-400 lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300',
          icon: Camera,
          dotColor: 'bg-teal-400 lab:bg-emerald-600',
        };
      case 'SYSTEM_EVENT':
      default:
        return {
          label: 'SYSTEM',
          color: 'text-slate-300 bg-slate-900 border-slate-700 cyber:bg-black cyber:text-white cyber:border-cyan-400 lab:bg-slate-100 lab:text-slate-800 lab:border-slate-300',
          icon: Terminal,
          dotColor: 'bg-slate-400 lab:bg-slate-600',
        };
    }
  };

  const handleDownloadSnapshot = (log: SessionLogEntry) => {
    if (!log.thumbnailDataUrl) return;
    const mimeMatch = log.thumbnailDataUrl.match(/^data:image\/([a-zA-Z0-9+]+);/);
    const ext = mimeMatch ? (mimeMatch[1] === 'jpeg' ? 'jpg' : mimeMatch[1]) : 'png';
    const modeSlug = typeof log.metadata?.sceneMode === 'string' ? log.metadata.sceneMode : 'scene';
    const link = document.createElement('a');
    link.href = log.thumbnailDataUrl;
    link.download = `dragon9-snapshot-${modeSlug}-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySingle = (log: SessionLogEntry) => {
    const text = `[${log.timeFormatted}] [${log.category}] ${log.title}: ${log.details}${log.metadata ? ` | Meta: ${JSON.stringify(log.metadata)}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyAllLogs = () => {
    const rawText = filteredLogs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.category}] ${log.title} - ${log.details}${
            log.metadata ? ` (Data: ${JSON.stringify(log.metadata)})` : ''
          }`
      )
      .join('\n');
    navigator.clipboard.writeText(rawText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadLogFile = () => {
    const exportData = {
      exportTitle: 'Dragon 9 Laboratory Session Execution Log',
      exportedAt: new Date().toISOString(),
      totalEntries: logs.length,
      filteredEntries: filteredLogs.length,
      sessionLogs: filteredLogs,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dragon9-session-audit-log-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3 font-mono text-xs">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600 animate-pulse" />
          <h3 className="text-xs font-bold text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 tracking-wider uppercase flex items-center gap-2">
            <span>Laboratory Session Audit Log</span>
            <span className="flex items-center gap-1 text-[10px] bg-slate-950 cyber:bg-black lab:bg-white px-2 py-0.5 rounded border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-300 text-slate-300 cyber:text-white lab:text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 lab:bg-emerald-600 animate-ping" />
              <span>{logs.length} EVENTS RECORDED</span>
            </span>
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
              autoScroll
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-50 lab:text-sky-800 lab:border-sky-300'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-300 cyber:border-cyan-500/40 lab:bg-white lab:text-slate-600 lab:border-slate-300'
            }`}
            title="Toggle automatic scroll to bottom when new logs arrive"
          >
            <ArrowDown className={`w-3 h-3 ${autoScroll ? 'text-cyan-400 cyber:text-black lab:text-sky-700' : 'text-slate-500 lab:text-slate-400'}`} />
            <span>AUTO-SCROLL: {autoScroll ? 'ON' : 'OFF'}</span>
          </button>

          {/* Copy All */}
          <button
            onClick={handleCopyAllLogs}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-slate-700 cyber:bg-black cyber:text-white cyber:border-cyan-400/60 lab:bg-white lab:text-slate-700 lab:border-slate-300 lab:hover:text-sky-700 transition-colors cursor-pointer disabled:opacity-40"
            title="Copy filtered logs to clipboard"
          >
            {copiedAll ? <Check className="w-3 h-3 text-emerald-400 lab:text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400 cyber:text-cyan-300 lab:text-slate-500" />}
            <span>{copiedAll ? 'COPIED' : 'COPY RAW'}</span>
          </button>

          {/* Download JSON */}
          <button
            onClick={handleDownloadLogFile}
            disabled={filteredLogs.length === 0}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer disabled:opacity-40 ${
              downloaded
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:text-white lab:border-sky-800 lab:hover:bg-sky-800'
            }`}
            title="Download log history as JSON file"
          >
            {downloaded ? <CheckCircle2 className="w-3 h-3 text-emerald-400 cyber:text-black lab:text-emerald-700" /> : <Download className="w-3 h-3 text-cyan-400 cyber:text-black lab:text-white" />}
            <span>{downloaded ? 'DOWNLOADED' : 'EXPORT LOG'}</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold bg-slate-950 border border-red-500/30 text-red-400 hover:bg-red-950/40 cyber:bg-black cyber:text-red-300 cyber:border-red-400 lab:bg-white lab:text-red-600 lab:border-red-300 lab:hover:bg-red-50 transition-colors cursor-pointer"
            title="Clear current log history"
          >
            <Trash2 className="w-3 h-3 text-red-400 lab:text-red-600" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between bg-slate-950 cyber:bg-black lab:bg-white p-2 rounded-lg border border-slate-800 cyber:border-cyan-500/50 lab:border-slate-200">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 cyber:text-cyan-300 lab:text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by keyword, hash, action..."
            className="w-full bg-slate-900 cyber:bg-zinc-950 lab:bg-slate-50 border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-300 focus:border-cyan-500/60 lab:focus:border-sky-600 rounded text-[11px] text-slate-200 cyber:text-white lab:text-slate-800 pl-8 pr-3 py-1.5 font-mono placeholder:text-slate-600 lab:placeholder:text-slate-400"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] text-slate-500 cyber:text-zinc-300 lab:text-slate-500 uppercase flex items-center gap-1 pr-1 shrink-0">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {(['ALL', 'SCENE_SNAPSHOT', 'TAB_SWITCH', 'CONFIG_CHANGE', 'CIPHER_GENERATE', 'AUDIO_SYNTH', 'GRID_UPDATE'] as const).map(
            (cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:text-white lab:border-sky-800'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-300 cyber:border-cyan-500/40 lab:bg-slate-50 lab:text-slate-600 lab:border-slate-300 lab:hover:text-slate-900'
                  }`}
                >
                  {cat === 'ALL' ? 'ALL' : cat === 'SCENE_SNAPSHOT' ? 'SNAPSHOTS' : cat.replace('_', ' ')}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Scrollable Technical Log Stream */}
      <div
        ref={logContainerRef}
        className="bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800/90 cyber:border-cyan-500/50 lab:border-slate-200 rounded-lg p-3 max-h-96 min-h-[220px] overflow-y-auto space-y-2 select-text font-mono"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center text-slate-500 cyber:text-zinc-300 lab:text-slate-500 gap-2">
            <Terminal className="w-8 h-8 text-slate-700 cyber:text-cyan-400/60 lab:text-slate-300" />
            <p className="text-xs">No session log entries match the current filter criteria.</p>
            {onAddTestEntry && (
              <button
                onClick={onAddTestEntry}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-50 lab:text-sky-700 lab:border-sky-300 rounded text-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Inject Sample Diagnostic Log Entry</span>
              </button>
            )}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const catConfig = getCategoryConfig(log.category);
            const Icon = catConfig.icon;
            const isJustCopied = copiedId === log.id;

            return (
              <div
                key={log.id}
                className="group relative border-l-2 border-slate-800 hover:border-cyan-400/80 cyber:border-cyan-500/60 cyber:hover:border-yellow-300 lab:border-slate-300 lab:hover:border-sky-600 bg-slate-900/40 hover:bg-slate-900/80 cyber:bg-zinc-950 cyber:hover:bg-zinc-900 lab:bg-slate-50 lab:hover:bg-slate-100/80 p-2.5 rounded-r-lg transition-all text-[11px] leading-relaxed flex flex-col gap-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 cyber:border-cyan-500/30 lab:border-slate-200 pb-1">
                  {/* Timestamp & Category Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 cyber:text-zinc-200 lab:text-slate-600 text-[10px] font-bold bg-slate-950 cyber:bg-black lab:bg-white px-1.5 py-0.5 rounded border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-300">
                      {log.timeFormatted}
                    </span>
                    {log.dragonHourDisplay && (
                      <span className="text-cyan-400/80 cyber:text-cyan-300 lab:text-sky-700 text-[10px]">
                        {log.dragonHourDisplay}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase flex items-center gap-1 ${catConfig.color}`}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span>{catConfig.label}</span>
                    </span>
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={() => handleCopySingle(log)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-cyan-300 cyber:text-zinc-300 cyber:hover:text-cyan-300 lab:text-slate-500 lab:hover:text-sky-700 rounded hover:bg-slate-800 lab:hover:bg-slate-200 cursor-pointer"
                    title="Copy this entry"
                  >
                    {isJustCopied ? <Check className="w-3 h-3 text-emerald-400 lab:text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                {/* Entry Title & Details */}
                <div className="flex flex-col gap-0.5 pt-0.5">
                  <div className="text-slate-100 cyber:text-white lab:text-slate-900 font-bold flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${catConfig.dotColor}`} />
                    <span>{log.title}</span>
                  </div>
                  <div className="text-slate-300 cyber:text-zinc-200 lab:text-slate-700 text-[11px] font-sans pl-3 border-l border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-300">
                    {log.details}
                  </div>
                </div>

                {/* Visual 2D Scene Snapshot Thumbnail if present */}
                {log.thumbnailDataUrl && (
                  <div className="mt-1.5 pl-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedSnapshot(log)}
                      className="relative group/thumb w-56 sm:w-64 aspect-video rounded-lg overflow-hidden border border-teal-500/40 hover:border-cyan-400 cyber:border-emerald-400 lab:border-slate-300 bg-slate-950 shadow-md cursor-pointer shrink-0 transition-colors"
                      title="Inspect full-resolution 3D scene snapshot"
                    >
                      <img
                        src={log.thumbnailDataUrl}
                        alt={log.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/90 text-teal-300 border border-teal-500/40 text-[9px] font-mono font-bold flex items-center gap-1">
                        <Maximize2 className="w-2.5 h-2.5" />
                        <span>{log.badge || '1280×720'}</span>
                      </div>
                    </button>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-teal-300 cyber:text-emerald-300 lab:text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        <span>Visual 3D Viewport Record</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setExpandedSnapshot(log)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 cyber:bg-black cyber:text-cyan-300 cyber:border-cyan-400 lab:bg-white lab:text-sky-700 lab:border-slate-300 text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>INSPECT FULL-RES</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadSnapshot(log)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-teal-500/15 hover:bg-teal-500/30 text-teal-200 border border-teal-500/40 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-600 lab:text-white lab:hover:bg-emerald-700 text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>DOWNLOAD IMAGE</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata JSON Tags if present */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5 pl-3">
                    {Object.entries(log.metadata).map(([key, val]) => (
                      <span
                        key={key}
                        className="bg-slate-950/90 cyber:bg-black lab:bg-white text-[10px] text-cyan-300/90 cyber:text-cyan-300 lab:text-sky-700 px-1.5 py-0.5 rounded border border-slate-800/90 cyber:border-cyan-500/40 lab:border-slate-200 font-mono"
                      >
                        <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-500">{key}:</span>{' '}
                        <span className="font-semibold text-slate-200 cyber:text-white lab:text-slate-800">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 cyber:text-zinc-300 lab:text-slate-600 pt-1 border-t border-slate-800/60 cyber:border-cyan-500/40 lab:border-slate-200">
        <span>Persistent Audit Storage: LocalStorage (`dragon9_session_logs`)</span>
        <span>Showing {filteredLogs.length} of {logs.length} entries</span>
      </div>

      {/* Full-Resolution Snapshot Lightbox Modal */}
      {expandedSnapshot && expandedSnapshot.thumbnailDataUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
          onClick={() => setExpandedSnapshot(null)}
        >
          <div
            className="max-w-5xl w-full bg-slate-900 cyber:bg-black lab:bg-white border border-cyan-500/50 cyber:border-cyan-400 lab:border-slate-300 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
              <div className="flex items-center gap-2 min-w-0">
                <Camera className="w-4 h-4 text-teal-400 lab:text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-100 cyber:text-white lab:text-slate-900 truncate">
                    {expandedSnapshot.title}
                  </div>
                  <div className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
                    {expandedSnapshot.timeFormatted} • {expandedSnapshot.badge || '1280×720'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadSnapshot(expandedSnapshot)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/35 text-teal-200 border border-teal-400/50 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-600 lab:text-white text-[11px] font-bold cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedSnapshot(null)}
                  aria-label="Close snapshot preview"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cyber:bg-zinc-900 cyber:text-white lab:bg-slate-100 lab:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3 bg-slate-950 cyber:bg-black lab:bg-slate-900 flex items-center justify-center">
              <img
                src={expandedSnapshot.thumbnailDataUrl}
                alt={expandedSnapshot.title}
                className="w-full max-h-[72vh] object-contain rounded-lg border border-slate-800"
              />
            </div>
            <div className="px-4 py-2.5 border-t border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 text-[11px] text-slate-300 cyber:text-zinc-200 lab:text-slate-700 font-sans">
              {expandedSnapshot.details}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
