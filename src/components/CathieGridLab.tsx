import React, { useEffect, useState } from 'react';
import { computeCathieHarmonics } from '../utils/cathieMath';
import { CATHIE_CONCEPT_MODULES, CathieConceptModule } from '../utils/cathieExplanations';
import { MidiConnectionStatus } from '../types/dragon';
import { Globe, Calculator, Copy, Check, ShieldCheck, MapPin, BookOpen, ChevronDown, ChevronUp, Sigma, Sparkles, Compass, Cable } from 'lucide-react';

interface CathieGridLabProps {
  gridValue?: number;
  onGridValueChange?: (val: number) => void;
  midiStatus?: MidiConnectionStatus;
  midiDeviceCount?: number;
  midiGridCc?: number;
  onOpenMidiModal?: () => void;
}

export const CathieGridLab: React.FC<CathieGridLabProps> = ({
  gridValue = 144,
  onGridValueChange,
  midiStatus = 'disconnected',
  midiDeviceCount = 0,
  midiGridCc = 74,
  onOpenMidiModal,
}) => {
  const [inputValue, setInputValue] = useState<string>(gridValue.toString());
  const [copied, setCopied] = useState<boolean>(false);
  const [showExplanations, setShowExplanations] = useState<boolean>(true);
  const [activeConceptId, setActiveConceptId] = useState<CathieConceptModule['id']>('light-speed');

  useEffect(() => {
    setInputValue((prev) => (parseFloat(prev) === gridValue ? prev : gridValue.toString()));
  }, [gridValue]);

  const handleInputChange = (valStr: string) => {
    setInputValue(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && onGridValueChange) {
      onGridValueChange(parsed);
    }
  };

  const numVal = parseFloat(inputValue) || 144;
  const result = computeCathieHarmonics(numVal);
  const activeConcept =
    CATHIE_CONCEPT_MODULES.find((m) => m.id === activeConceptId) ?? CATHIE_CONCEPT_MODULES[0];
  const liveDerivations = activeConcept.evaluateForN(result.referenceValue);

  const handleCopy = () => {
    const text = `=== BRUCE CATHIE HARMONIC GRID TELEMETRY ===
Reference Harmonic: ${result.referenceValue}
Geometric Light-Speed Constant: ${result.lightSpeedKmSec} km/sec (${result.lightSpeedHarmonicArcSec} arc min/sec)
Calculated Harmonic Second: ${result.calculatedHarmonicSecond.toFixed(4)}
Grid Resonance Ratio: ${result.gridResonanceRatio.toFixed(3)}% of 360° planetary circle
Mass-Energy Grid Equivalent: ${result.massEnergyGridUnit.toLocaleString()} units
Harmonic Reciprocal (1/N): ${result.reciprocalHarmonic.toFixed(8)}
Nonary Digital Root: ${result.nonaryDigitalRoot}
Harmonic Second Ratio: ${result.harmonicSecondRatio.toFixed(6)} (86,400 / 97,200)
Status: Synchronized with sovereign planetary coordinates.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 text-slate-100 cyber:text-white lab:text-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 tracking-wide flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
            Harmonic Light-Speed Grid Calculation
          </h2>
          <p className="text-xs text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-0.5">
            Calculates geometric grid harmonics & speed-of-light grid equations inspired by Bruce Cathie&apos;s harmonic research.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenMidiModal && (
            <button
              type="button"
              onClick={onOpenMidiModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                midiStatus === 'connected'
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300'
                  : 'border-cyan-500/40 bg-slate-900 hover:bg-slate-800 text-cyan-300 cyber:bg-black cyber:text-cyan-300 cyber:border-cyan-400 lab:bg-white lab:text-sky-700 lab:border-slate-300'
              }`}
              title="Assign external MIDI CC knob or fader to Bruce Cathie Reference Grid Value (N)"
            >
              <Cable className="w-3.5 h-3.5" />
              <span>
                MIDI CC#{midiGridCc}
                {midiStatus === 'connected' && midiDeviceCount > 0 ? ` · ${midiDeviceCount} ON` : ''}
              </span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-cyan-300 cyber:bg-black cyber:text-cyan-300 cyber:border-cyan-400 cyber:hover:bg-cyan-400 cyber:hover:text-black lab:bg-white lab:hover:bg-slate-100 lab:text-sky-700 lab:border-slate-300 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 lab:text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'TELEMETRY COPIED' : 'COPY MATRIX'}</span>
          </button>
        </div>
      </div>

      {/* Input & Presets */}
      <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-mono text-slate-300 cyber:text-white lab:text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
            Reference Grid Value (N):
          </label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-32 bg-slate-950 cyber:bg-black lab:bg-white border border-cyan-500/40 cyber:border-cyan-400 lab:border-slate-300 text-cyan-300 cyber:text-cyan-300 lab:text-sky-800 font-mono text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-cyan-400 lab:focus:border-sky-600"
            placeholder="144"
          />
          <span className="text-xs text-slate-400 cyber:text-zinc-200 lab:text-slate-600">
            Digital Root: <span className="font-mono font-bold text-amber-400 cyber:text-yellow-300 lab:text-amber-700">{result.nonaryDigitalRoot}</span>
          </span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200">
          <span className="text-[11px] font-mono text-slate-500 cyber:text-zinc-300 lab:text-slate-500 mr-1">Cathie Harmonic Presets:</span>
          {[
            { val: 144, label: '144 (Light Speed Grid)' },
            { val: 216, label: '216 (Moon Rad Harmonic)' },
            { val: 288, label: '288 (Double Harmonic)' },
            { val: 432, label: '432 (Pythagorean A4)' },
            { val: 576, label: '576 (Tetrahedral Base)' },
            { val: 2160, label: '2160 (Platonic Month)' },
            { val: 4320, label: '4320 (Great Cycle Sub)' },
          ].map((p) => (
            <button
              key={p.val}
              onClick={() => handleInputChange(p.val.toString())}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                numVal === p.val
                  ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:text-white lab:border-sky-800'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/40 cyber:hover:border-cyan-400 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Mathematical Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-3.5 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600 uppercase">Light-Speed Arc Harmonic</span>
          <span className="font-mono text-lg font-bold text-cyan-300 cyber:text-cyan-300 lab:text-sky-700">
            {result.lightSpeedHarmonicArcSec.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 cyber:text-zinc-400 lab:text-slate-500 font-mono">arc-minutes/grid-sec (144k nm/s)</span>
        </div>

        <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-3.5 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600 uppercase">Calculated Harmonic Second</span>
          <span className="font-mono text-lg font-bold text-amber-300 cyber:text-yellow-300 lab:text-amber-700">
            {result.calculatedHarmonicSecond.toFixed(4)}
          </span>
          <span className="text-[10px] text-slate-500 cyber:text-zinc-400 lab:text-slate-500 font-mono">N × (1440/86400) × (c/1000)</span>
        </div>

        <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-3.5 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600 uppercase">Mass-Energy Equivalent</span>
          <span className="font-mono text-lg font-bold text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-700 truncate">
            {result.massEnergyGridUnit.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 cyber:text-zinc-400 lab:text-slate-500 font-mono">E = N × (144)² grid units</span>
        </div>

        <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-3.5 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600 uppercase">Grid Perimeter Ratio</span>
          <span className="font-mono text-lg font-bold text-emerald-300 cyber:text-emerald-300 lab:text-emerald-700">
            {result.gridResonanceRatio.toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-500 cyber:text-zinc-400 lab:text-slate-500 font-mono">(N / 360°) planetary arc</span>
        </div>
      </div>

      {/* Output Matrix Console (Terminal Style) */}
      <div className="bg-slate-950 cyber:bg-black lab:bg-slate-900 border border-cyan-500/30 cyber:border-cyan-400 lab:border-slate-700 rounded-xl p-4 font-mono text-xs text-cyan-300 shadow-inner">
        <div className="text-slate-500 cyber:text-cyan-300 lab:text-slate-400 text-[11px] mb-2 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-700 pb-1 flex items-center justify-between">
          <span>// CATHIE HARMONIC MATRIX EXECUTION OUTPUT</span>
          <span className="text-emerald-400 cyber:text-emerald-300 lab:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            SYNCHRONIZED WITH GLOBAL GRID
          </span>
        </div>
        <div className="space-y-1.5 leading-relaxed">
          <div><span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-400">Reference Value:</span> {result.referenceValue}</div>
          <div><span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-400">Geometric Light-Speed Constant:</span> {result.lightSpeedKmSec} km/sec</div>
          <div><span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-400">Harmonic Daily Seconds:</span> 97,200 grid seconds (vs 86,400 solar seconds, ratio: 8/9 = 0.888888)</div>
          <div><span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-400">Calculated Harmonic Second:</span> {result.calculatedHarmonicSecond.toFixed(4)}</div>
          <div><span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-400">Grid Resonance Ratio:</span> {result.gridResonanceRatio.toFixed(2)}% of circle perimeter</div>
          <div><span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-400">Reciprocal Light Harmonic (1/N):</span> {result.reciprocalHarmonic.toFixed(8)}</div>
          <div><span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-400">Nonary Digital Root:</span> {result.nonaryDigitalRoot} (Cycle {result.nonaryDigitalRoot === 9 ? 'Apex Nonary Completeness' : `Harmonic Phase ${result.nonaryDigitalRoot}`})</div>
          <div className="text-emerald-300 pt-1">Status: Synchronized with global harmonic grid coordinates.</div>
        </div>
      </div>

      {/* Planetary Grid Resonances Table */}
      <div className="bg-slate-900/60 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-300 cyber:text-white lab:text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400 cyber:text-yellow-300 lab:text-amber-600" />
            Planetary Polyhedral Grid Intersections
          </span>
          <span className="text-[10px] text-slate-500 cyber:text-zinc-300 lab:text-slate-500 font-mono">Cathie Harmonic Nodal Geometry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 text-slate-400 cyber:text-cyan-300 lab:text-slate-600">
                <th className="pb-2 font-medium">Terrestrial Node</th>
                <th className="pb-2 font-medium">Coordinates</th>
                <th className="pb-2 font-medium">Harmonic Index</th>
                <th className="pb-2 font-medium hidden md:table-cell">Geodetic Function</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 cyber:divide-cyan-500/30 lab:divide-slate-200">
              {result.planetaryResonances.map((node) => (
                <tr key={node.name} className="hover:bg-slate-800/30 cyber:hover:bg-cyan-950/50 lab:hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 font-medium text-cyan-300 cyber:text-cyan-300 lab:text-sky-700">{node.name}</td>
                  <td className="py-2.5 text-slate-300 cyber:text-white lab:text-slate-700 text-[11px]">{node.latitude}, {node.longitude}</td>
                  <td className="py-2.5 text-amber-300 cyber:text-yellow-300 lab:text-amber-700 font-bold">{node.harmonicIndex}</td>
                  <td className="py-2.5 text-slate-400 cyber:text-zinc-300 lab:text-slate-600 text-[11px] hidden md:table-cell">{node.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bruce Cathie Harmonic Theory & Mathematical Explanations */}
      <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-cyan-500/30 cyber:border-cyan-400 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-2.5">
          <div>
            <h3 className="text-sm font-bold text-cyan-300 cyber:text-cyan-300 lab:text-sky-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-700" />
              Bruce Cathie Harmonic Grid Explanations
            </h3>
            <p className="text-[11px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-0.5">
              Conceptual principles &amp; step-by-step derivations evaluated live for <strong className="font-mono text-cyan-300 cyber:text-yellow-300 lab:text-sky-700">N = {result.referenceValue}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowExplanations((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:text-cyan-300 cyber:bg-black cyber:border-cyan-400 cyber:text-white lab:bg-white lab:border-slate-300 lab:text-slate-700 lab:hover:text-sky-700 text-[11px] font-mono transition-colors cursor-pointer"
          >
            {showExplanations ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showExplanations ? 'Hide Explanations' : 'Show Explanations'}</span>
          </button>
        </div>

        {showExplanations && (
          <div className="flex flex-col gap-4">
            {/* Topic Selector Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {CATHIE_CONCEPT_MODULES.map((mod, idx) => {
                const isActive = mod.id === activeConcept.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setActiveConceptId(mod.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 font-bold cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:text-white lab:border-sky-800'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/40 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-slate-900'
                    }`}
                  >
                    {idx + 1}. {mod.shortTitle}
                  </button>
                );
              })}
            </div>

            {/* Active Concept Card */}
            <div className="bg-slate-950/70 cyber:bg-[#050811] lab:bg-white border border-slate-800 cyber:border-cyan-500/50 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 cyber:text-white lab:text-slate-900">
                    {activeConcept.title}
                  </h4>
                  <p className="text-xs text-slate-300 cyber:text-zinc-200 lab:text-slate-700 mt-1 leading-relaxed">
                    {activeConcept.summary}
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 cyber:bg-black cyber:text-yellow-300 cyber:border-yellow-400 lab:bg-amber-50 lab:text-amber-800 lab:border-amber-300 shrink-0">
                  {activeConcept.keyConstant}
                </span>
              </div>

              {/* Governing Equation */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 cyber:bg-black lab:bg-slate-900 border border-cyan-500/30 cyber:border-cyan-400 lab:border-slate-700 font-mono text-xs text-cyan-300">
                <Sigma className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="break-all">{activeConcept.formula}</span>
              </div>

              {/* Core Analytical Points */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 cyber:text-cyan-300 lab:text-slate-500 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400 lab:text-sky-600" />
                  <span>Harmonic Mechanics &amp; Derivation</span>
                </div>
                <ol className="space-y-1.5 pl-4 list-decimal text-xs text-slate-300 cyber:text-zinc-200 lab:text-slate-700 leading-relaxed">
                  {activeConcept.deepDive.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ol>
              </div>

              {/* Live Calculated Breakdown for Current N */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {liveDerivations.map((item) => (
                  <div
                    key={item.label}
                    className="p-2.5 rounded-lg bg-slate-900/90 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200"
                  >
                    <div className="text-[10px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-500 uppercase">
                      {item.label}
                    </div>
                    <div className="font-mono text-xs sm:text-sm font-bold text-cyan-300 cyber:text-yellow-300 lab:text-sky-700 mt-0.5 tabular-nums">
                      {item.value}
                    </div>
                    <div className="text-[10px] text-slate-500 cyber:text-zinc-400 lab:text-slate-600 mt-0.5">
                      {item.note}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dragon 9 Synthesis Integration Callout */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-fuchsia-500/10 cyber:bg-fuchsia-950/60 lab:bg-sky-50 border border-fuchsia-500/30 cyber:border-fuchsia-400 lab:border-sky-200 text-xs">
                <Sparkles className="w-4 h-4 text-fuchsia-400 cyber:text-fuchsia-300 lab:text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-bold text-fuchsia-300 cyber:text-fuchsia-300 lab:text-sky-800 uppercase text-[10px] block">
                    Dragon 9 &amp; 432 Hz Synthesis Link
                  </span>
                  <span className="text-slate-200 cyber:text-white lab:text-slate-700 leading-relaxed">
                    {activeConcept.dragon9Link}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

