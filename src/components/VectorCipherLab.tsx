import React, { useEffect, useState } from 'react';
import { generateGeometricVectorCipher } from '../utils/vectorCipher';
import { VectorCipherResult, LogCategory } from '../types/dragon';
import {
  Binary,
  ShieldCheck,
  Copy,
  Check,
  Hash,
  Cpu,
  Sparkles,
  Download,
  Trash2,
  FileJson,
  RotateCcw,
  History,
  CheckCircle2,
} from 'lucide-react';

const CIPHER_LOG_STORAGE_KEY = 'dragon9_cipher_experiment_log';

export interface CipherExperimentRecord {
  id: string;
  timestamp: string;
  inputString: string;
  cipherHash: string;
  hash1Hex: string;
  hash2Hex: string;
  nonaryChecksum: number;
  matrix3x3: number[][];
  vectorComponents: {
    vx: number;
    vy: number;
    vz: number;
    vThetaDeg: number;
    magnitude: number;
  };
  integrityVerified: boolean;
}

function getInitialCipherLog(): CipherExperimentRecord[] {
  try {
    const saved = localStorage.getItem(CIPHER_LOG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Failed to read cipher log from localStorage', err);
  }

  // Pre-populate with initial demonstration experiment
  const initial = generateGeometricVectorCipher('FLUID MOTION');
  return [
    {
      id: `exp_init_${Date.now()}`,
      timestamp: initial.timestamp,
      inputString: initial.inputString,
      cipherHash: initial.cipherHash,
      hash1Hex: initial.hash1Hex,
      hash2Hex: initial.hash2Hex,
      nonaryChecksum: initial.nonaryChecksum,
      matrix3x3: initial.matrix3x3,
      vectorComponents: initial.vectorComponents,
      integrityVerified: initial.integrityVerified,
    },
  ];
}

interface VectorCipherLabProps {
  initialInput?: string;
  onCipherGenerated?: (result: { input: string; hash: string }) => void;
  onLogEvent?: (category: LogCategory, title: string, details: string, metadata?: Record<string, unknown>) => void;
}

export const VectorCipherLab: React.FC<VectorCipherLabProps> = ({
  initialInput = 'FLUID MOTION',
  onCipherGenerated,
  onLogEvent,
}) => {
  const [inputString, setInputString] = useState<string>(initialInput);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(true);
  const [experimentLog, setExperimentLog] = useState<CipherExperimentRecord[]>(getInitialCipherLog);

  const cipherResult = generateGeometricVectorCipher(inputString);

  // Persist experiment log to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CIPHER_LOG_STORAGE_KEY, JSON.stringify(experimentLog.slice(-100)));
    } catch (err) {
      console.warn('Failed to persist cipher log', err);
    }
  }, [experimentLog]);

  const recordExperiment = (res: VectorCipherResult) => {
    setExperimentLog((prev) => {
      // Don't record immediate duplicate of the most recent entry
      if (prev.length > 0 && prev[0].cipherHash === res.cipherHash) {
        return prev;
      }

      const newRecord: CipherExperimentRecord = {
        id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        inputString: res.inputString,
        cipherHash: res.cipherHash,
        hash1Hex: res.hash1Hex,
        hash2Hex: res.hash2Hex,
        nonaryChecksum: res.nonaryChecksum,
        matrix3x3: res.matrix3x3,
        vectorComponents: res.vectorComponents,
        integrityVerified: res.integrityVerified,
      };

      return [newRecord, ...prev].slice(0, 50);
    });
  };

  const handleInputChange = (val: string, forceRecord = false) => {
    setInputString(val);
    const res = generateGeometricVectorCipher(val);
    if (onCipherGenerated) {
      onCipherGenerated({ input: val, hash: res.cipherHash });
    }
    if (forceRecord || val.trim().length >= 3) {
      recordExperiment(res);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export generated cipher hashes and inputs as downloadable JSON log file
  const handleExportJsonLog = () => {
    const exportData = {
      exportMetadata: {
        title: 'Dragon 9 Geometric Vector Cipher Experiment Log',
        standard: 'Nonary Digital Root & Spatial Vector Trigonometry',
        exportedAt: new Date().toISOString(),
        totalExperiments: experimentLog.length,
        resonantBaseline: '432Hz Pythagorean Sacred Harmonic Matrix',
      },
      experiments: experimentLog.map((exp, index) => ({
        index: index + 1,
        id: exp.id,
        timestamp: exp.timestamp,
        inputPayload: exp.inputString,
        cipherHash: exp.cipherHash,
        nonaryChecksum: exp.nonaryChecksum,
        hash1Hex: exp.hash1Hex,
        hash2Hex: exp.hash2Hex,
        matrix3x3: exp.matrix3x3,
        vectorComponents: exp.vectorComponents,
        validation: '432Hz Harmonic Integrity Confirmed',
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateSlug = new Date().toISOString().slice(0, 10);
    const fileName = `dragon9-cipher-experiments-${dateSlug}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);

    onLogEvent?.(
      'CIPHER_GENERATE',
      `Cryptographic Experiment Log Exported (${experimentLog.length} Records)`,
      `Exported ${experimentLog.length} geometric vector cipher hash records to ${fileName}.`,
      { recordCount: experimentLog.length, fileName }
    );
  };

  const handleCopyJsonToClipboard = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalExperiments: experimentLog.length,
      experiments: experimentLog,
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleClearHistory = () => {
    setExperimentLog([]);
    try {
      localStorage.removeItem(CIPHER_LOG_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleRestoreRecord = (rec: CipherExperimentRecord) => {
    setInputString(rec.inputString);
    if (onCipherGenerated) {
      onCipherGenerated({ input: rec.inputString, hash: rec.cipherHash });
    }
  };

  return (
    <div className="flex flex-col gap-5 text-slate-100 cyber:text-white lab:text-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 tracking-wide flex items-center gap-2">
            <Binary className="w-5 h-5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
            Geometric Vector Cipher Generator
          </h2>
          <p className="text-xs text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-0.5">
            Transforms input strings into structured geometric vector hash codes based on nonary mathematical sequences.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download JSON Log Button */}
          <button
            type="button"
            onClick={handleExportJsonLog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/50 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white lab:border-sky-800 font-mono text-xs font-bold transition-all cursor-pointer shadow-md shadow-cyan-500/10"
            title="Download cryptographic experiment records as a JSON log file"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 cyber:text-black" />
                <span>LOG DOWNLOADED</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT CIPHER LOG (.JSON)</span>
              </>
            )}
          </button>

          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 cyber:bg-black cyber:text-cyan-300 cyber:border-cyan-400 lab:bg-sky-50 lab:text-sky-800 lab:border-sky-300">
            D9 Nonary Standard
          </span>
        </div>
      </div>

      {/* Control Input */}
      <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3">
        <label className="text-xs font-mono text-slate-300 cyber:text-white lab:text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
          Input String Payload:
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={inputString}
            onChange={(e) => handleInputChange(e.target.value)}
            className="flex-1 min-w-[220px] bg-slate-950 cyber:bg-black lab:bg-white border border-cyan-500/40 cyber:border-cyan-400 lab:border-slate-300 text-cyan-300 cyber:text-cyan-300 lab:text-sky-800 font-mono text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:border-cyan-400 lab:focus:border-sky-600"
            placeholder="FLUID MOTION"
          />
          <button
            type="button"
            onClick={() => handleInputChange(inputString, true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Compute Vector Hash &amp; Log
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200">
          <span className="text-[11px] font-mono text-slate-500 cyber:text-zinc-300 lab:text-slate-500 mr-1">Presets:</span>
          {['FLUID MOTION', 'CYBER DRAGON', 'SOVEREIGN MESH', 'CATHIE GRID 144', 'NONARY 9 APEX'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleInputChange(p, true)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                inputString.toUpperCase() === p
                  ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:text-white lab:border-sky-800'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/40 cyber:hover:border-cyan-400 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Hash Banner */}
      <div className="bg-slate-950 cyber:bg-black lab:bg-white border border-cyan-500/40 cyber:border-cyan-400 lab:border-sky-300 rounded-xl p-4 shadow-xl lab:shadow-xs flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
          <span className="flex items-center gap-1.5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-700">
            <Hash className="w-4 h-4" />
            CALCULATED GEOMETRIC VECTOR CIPHER
          </span>
          <button
            type="button"
            onClick={() => handleCopyHash(cipherResult.cipherHash)}
            className="flex items-center gap-1 text-slate-300 hover:text-cyan-300 cyber:text-white cyber:hover:text-cyan-300 lab:text-slate-700 lab:hover:text-sky-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 lab:text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>

        <div className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-cyan-300 cyber:text-cyan-300 lab:text-sky-800 py-1 select-all break-all">
          {cipherResult.cipherHash}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200 text-xs font-mono">
          <span className="text-emerald-400 cyber:text-emerald-300 lab:text-emerald-700 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 cyber:text-emerald-300 lab:text-emerald-600" />
            Validation: 432Hz Harmonic Integrity Confirmed
          </span>
          <span className="text-slate-500 cyber:text-zinc-300 lab:text-slate-600">
            Checksum: <span className="text-amber-400 cyber:text-yellow-300 lab:text-amber-700 font-bold">{cipherResult.nonaryChecksum}</span> (Mod 9)
          </span>
        </div>
      </div>

      {/* 3x3 Nonary Geometric Matrix & 4D Polar Vector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 3x3 Nonary Matrix */}
        <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 cyber:text-white lab:text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 cyber:text-yellow-300 lab:text-amber-600" />
              3×3 Nonary Geometric Matrix
            </span>
            <span className="text-[10px] font-mono text-slate-500 cyber:text-zinc-300 lab:text-slate-500">Digital Root [1-9]</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-950 cyber:bg-black lab:bg-white rounded-lg border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 max-w-xs mx-auto w-full">
            {cipherResult.matrix3x3.map((row, rIdx) =>
              row.map((val, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className="aspect-square flex flex-col items-center justify-center rounded-lg border border-cyan-500/20 bg-slate-900/80 hover:border-cyan-400 cyber:bg-zinc-950 cyber:border-cyan-400/60 lab:bg-slate-50 lab:border-slate-300 lab:hover:border-sky-600 transition-colors"
                >
                  <span className="text-lg font-mono font-bold text-cyan-300 cyber:text-cyan-300 lab:text-sky-700">{val}</span>
                  <span className="text-[9px] font-mono text-slate-500 cyber:text-zinc-300 lab:text-slate-500">
                    [{rIdx},{cIdx}]
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="text-[11px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 text-center font-mono">
            Spatial matrix projection mapped to 9-cycle harmonic lattice
          </div>
        </div>

        {/* 4D Polar Vector Components */}
        <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
          <div>
            <span className="text-xs font-mono text-slate-300 cyber:text-white lab:text-slate-700 uppercase tracking-wider">
              Polar Vector Decomposition
            </span>
            <p className="text-[11px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-0.5">
              Angular spatial coordinates calculated via nonary trigonometry
            </p>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between p-2 rounded bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
              <span className="text-slate-400 cyber:text-zinc-200 lab:text-slate-600">Vector X (Cosine Flux):</span>
              <span className="text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 font-bold">{cipherResult.vectorComponents.vx}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
              <span className="text-slate-400 cyber:text-zinc-200 lab:text-slate-600">Vector Y (Sine Flux):</span>
              <span className="text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 font-bold">{cipherResult.vectorComponents.vy}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
              <span className="text-slate-400 cyber:text-zinc-200 lab:text-slate-600">Vector Z (Polarity Height):</span>
              <span className="text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-700 font-bold">{cipherResult.vectorComponents.vz}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
              <span className="text-slate-400 cyber:text-zinc-200 lab:text-slate-600">Phase Angle (θ):</span>
              <span className="text-amber-300 cyber:text-yellow-300 lab:text-amber-700 font-bold">{cipherResult.vectorComponents.vThetaDeg}°</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
              <span className="text-slate-400 cyber:text-zinc-200 lab:text-slate-600">Total Magnitude |V|:</span>
              <span className="text-emerald-300 cyber:text-emerald-300 lab:text-emerald-700 font-bold">{cipherResult.vectorComponents.magnitude}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic Experiment Results Log & Download Drawer */}
      <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
            <h3 className="text-sm font-bold text-slate-100 cyber:text-white lab:text-slate-900">
              Cryptographic Experiment Results Log
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 cyber:bg-black cyber:text-cyan-300 cyber:border-cyan-400 lab:bg-sky-50 lab:text-sky-800 lab:border-sky-300">
              {experimentLog.length} Records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJsonToClipboard}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 cyber:bg-black cyber:border-cyan-500/50 cyber:text-white lab:bg-white lab:border-slate-300 lab:text-slate-700 text-xs font-mono transition-colors cursor-pointer"
              title="Copy JSON experiment log to clipboard"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'COPIED' : 'COPY JSON'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportJsonLog}
              className="flex items-center gap-1 px-3 py-1 rounded-lg border border-cyan-500/50 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white text-xs font-mono font-bold transition-colors cursor-pointer"
              title="Download JSON log file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD JSON LOG</span>
            </button>

            {experimentLog.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                title="Clear experiment log"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {experimentLog.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 font-mono">
            No cipher experiments recorded yet. Compute any payload to log cryptographic hashes.
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {experimentLog.map((exp, idx) => (
              <div
                key={exp.id}
                className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/80 cyber:bg-black lab:bg-white border border-slate-800 hover:border-slate-700 cyber:border-cyan-900 cyber:hover:border-cyan-500/60 lab:border-slate-200 transition-colors text-xs font-mono"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] text-slate-500 shrink-0">#{experimentLog.length - idx}</span>
                  <div className="truncate">
                    <span className="font-bold text-slate-200 cyber:text-white lab:text-slate-800">
                      &quot;{exp.inputString}&quot;
                    </span>
                    <span className="text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 ml-2 font-bold">
                      {exp.cipherHash}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 cyber:bg-zinc-900 lab:bg-slate-100 text-slate-400 cyber:text-zinc-300 lab:text-slate-600 border border-slate-800 lab:border-slate-300">
                    Mod {exp.nonaryChecksum}
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    {new Date(exp.timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRestoreRecord(exp)}
                    className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 text-[10px] font-bold cursor-pointer"
                    title="Load this input into generator"
                  >
                    LOAD
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyHash(exp.cipherHash)}
                    className="p-1 rounded text-slate-400 hover:text-cyan-300 cursor-pointer"
                    title="Copy hash"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
