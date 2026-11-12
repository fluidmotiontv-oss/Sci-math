import React, { useState } from 'react';
import { NonaryClockState, DragonNodeConfig, ChamberTab } from '../types/dragon';
import { 
  Compass, 
  Zap, 
  Activity, 
  Clock, 
  Layers, 
  ChevronRight, 
  Info, 
  Maximize2, 
  Minimize2,
  Play,
  RotateCw,
  Waves,
  Globe,
  Binary,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

interface ModelProgressionGuideProps {
  timeState: NonaryClockState;
  nodeConfig: DragonNodeConfig;
  onFocusComponent?: (cameraPreset: string, sceneMode: string) => void;
  isAudioPlaying: boolean;
  frequency: number;
  gridReferenceValue?: number;
  cipherGenerated?: boolean;
  lastCipherHash?: string;
  onNavigateToTab?: (tab: ChamberTab) => void;
  visitedChambers?: ChamberTab[];
}

interface ProgressionPhase {
  id: string;
  solarWindow: string;
  d9HourRange: string;
  title: string;
  cycle: 'Alpha' | 'Beta' | 'Apex Alpha' | 'Apex Beta';
  summary: string;
  mechanics: string;
  focusPreset: string;
  focusMode: string;
  color: string;
}

const PROGRESSION_PHASES: ProgressionPhase[] = [
  {
    id: 'p1',
    solarWindow: '00:00 - 06:00',
    d9HourRange: 'D9·00:00 to D9·06:40',
    title: 'Phase I: Nonary Genesis & Grounding Baseline',
    cycle: 'Alpha',
    summary: 'Cycle Alpha initializes. Static Reference Alpha pin establishes baseline grounding at 432Hz.',
    mechanics: 'The central toroidal nucleus anchors to the primary grounding plane. Outer nonary chapter ring turns through sectors D9·01–D9·03. Grounding crystal discs stabilize electromagnetic drift.',
    focusPreset: 'core-focus',
    focusMode: 'sovereign-core',
    color: '#38bdf8'
  },
  {
    id: 'p2',
    solarWindow: '06:00 - 11:51',
    d9HourRange: 'D9·06:40 to D9·13:10',
    title: 'Phase II: Harmonic Ascension & Grid Calibration',
    cycle: 'Alpha',
    summary: 'Rotational momentum increases toward noon. Cathie light-speed grid aligns with terrestrial meridian.',
    mechanics: 'Counter-rotating chapter rings establish 54-minute differential speed ratio. Planetary grid coordinates (Stonehenge 51.18°, Giza 29.98°) enter harmonic synchronization with the 144,000 arc-minute constant.',
    focusPreset: 'top-grid',
    focusMode: 'cathie-grid',
    color: '#38bdf8'
  },
  {
    id: 'p3',
    solarWindow: '11:51 - 12:09',
    d9HourRange: 'D9·13:10 to D9·13:30 (Peak Pivot)',
    title: 'Phase III: Apex Alpha Midday Pivot Portal',
    cycle: 'Apex Alpha',
    summary: '18-minute primary portal. Dual polarity poles align at zero phase variance across the solar meridian.',
    mechanics: 'The model achieves planar equilibrium. Kinetic energy transfers from Static Alpha grounding to Dynamic Beta reactor. Inner dodecahedron heart pulses at maximum harmonic coherence.',
    focusPreset: 'polar-axis',
    focusMode: 'sovereign-core',
    color: '#facc15'
  },
  {
    id: 'p4',
    solarWindow: '12:09 - 18:00',
    d9HourRange: 'D9·13:30 to D9·20:00',
    title: 'Phase IV: Dynamic Reactor Mutation & Adaptability',
    cycle: 'Beta',
    summary: 'Cycle Beta engages. Dynamic Reactor Beta pin leads energetic propulsion and adaptive mesh routing.',
    mechanics: 'Beta conical emitter radiates high-frequency field pulses. Nonary cipher vector matrices mutate into dynamic non-Euclidean angles. WireGuard mesh pathways recalculate topology.',
    focusPreset: 'polar-axis',
    focusMode: 'sovereign-core',
    color: '#e879f9'
  },
  {
    id: 'p5',
    solarWindow: '18:00 - 23:51',
    d9HourRange: 'D9·20:00 to D9·26:30',
    title: 'Phase V: Harmonic Dispersion & Global Mesh Diffusion',
    cycle: 'Beta',
    summary: 'Spatial wave diffusion across all 5 terrestrial nodal stations as twilight transitions into midnight.',
    mechanics: 'Bruce Cathie geodesic sphere rotates through antipodal nodes (Tasman Station 41.29°S, Bermuda 25°N). 432Hz acoustic halo expands into 9th-order harmonic overtones.',
    focusPreset: 'top-grid',
    focusMode: 'cathie-grid',
    color: '#e879f9'
  },
  {
    id: 'p6',
    solarWindow: '23:51 - 00:09',
    d9HourRange: 'D9·26:30 to D9·26:40 / D9·00:00',
    title: 'Phase VI: Apex Beta Midnight Rebirth & Nonary Reset',
    cycle: 'Apex Beta',
    summary: '18-minute midnight apex. Complete nonary cycle completes and resets to digital root 9.',
    mechanics: 'The 1,440-minute solar cycle finishes its 26.666 Dragon hour loop. Static reference Alpha resets grounding, and the nonary mathematical lattice regenerates for the next diurnal cycle.',
    focusPreset: 'perspective',
    focusMode: 'nonary-clock',
    color: '#facc15'
  }
];

interface ComponentSpec {
  name: string;
  role: string;
  pbrSpecs: string;
  mathFormula: string;
  significance: string;
  preset: string;
  mode: string;
}

const COMPONENTS: ComponentSpec[] = [
  {
    name: 'Toroidal Nonary Nucleus',
    role: 'Central Space-Time Wormhole Knot',
    pbrSpecs: 'TorusKnot (p=3, q=4) | Metalness: 0.92, Roughness: 0.15',
    mathFormula: 'x(u) = (0.85 + 0.22 cos 4u) cos 3u, y(u) = (0.85 + 0.22 cos 4u) sin 3u',
    significance: 'Models non-Euclidean energy circulation. Rotates along dual axes to balance positive and negative space-time curvature.',
    preset: 'core-focus',
    mode: 'sovereign-core'
  },
  {
    name: 'Inner Resonant Dodecahedron Heart',
    role: 'Sacred Acoustic Harmonic Anchor',
    pbrSpecs: 'DodecahedronGeometry(0.55) | Emissive Cyan: 0x0284c7',
    mathFormula: 'V = (1/4)(15 + 7√5) a³ ≈ 7.663 a³ (Golden Ratio Φ = 1.618)',
    significance: '12 pentagonal facets represent the 12 semi-tones of the Pythagorean octave tuned to 432Hz fundamental acoustic resonance.',
    preset: 'core-focus',
    mode: 'sovereign-core'
  },
  {
    name: 'Pole Alpha: Static Reference Pin',
    role: 'Grounding, Structural Stability & Lattice Anchor',
    pbrSpecs: 'Stepped Cylinders + Octahedron | Height dynamic based on α%',
    mathFormula: 'Scale_α = 0.5 + (α / 100) × 0.8 | Target: Structural Inertia',
    significance: 'Maintains static spatial reference. Prevents drift during rapid network mutation. Rooted to the lower grounding contact shadow.',
    preset: 'polar-axis',
    mode: 'sovereign-core'
  },
  {
    name: 'Pole Beta: Dynamic Reactor Emitter',
    role: 'Mutation, Adaptability & Propulsion Emitter',
    pbrSpecs: 'Inverted Cone Crown + 4 Torus Coils | Magenta Emissive: 0xe879f9',
    mathFormula: 'Scale_β = 0.5 + (β / 100) × 0.8 | Target: Adaptive Entropy',
    significance: 'Emits dynamic adaptation vectors. Enables real-time stream ingestion, WireGuard mesh routing, and topological metamorphosis.',
    preset: 'polar-axis',
    mode: 'sovereign-core'
  },
  {
    name: 'Counter-Rotating Nonary Chapter Rings',
    role: '54-Minute Gear Ratio Chronometer',
    pbrSpecs: 'Outer Torus (r=1.85) + Inner Torus (r=1.5) | 9 Gold Node Ticks',
    mathFormula: '1,440 Solar Minutes ÷ 54 = 26.6667 Dragon Hours/Day',
    significance: 'Differential rotation provides gyroscopic torque stabilization while tracking the nonary 54-minute hour progression.',
    preset: 'top-grid',
    mode: 'nonary-clock'
  },
  {
    name: 'Bruce Cathie Geodesic Sphere & Beacons',
    role: '144,000 Arc-Minute Planetary Light-Speed Grid',
    pbrSpecs: 'Icosahedron (lvl 2) + 5 Planetary Beacons + Connecting Rays',
    mathFormula: 'c_geo = 144,000 arc-min/sec (299,796 km/s) | Nodal factor: 8/9 ratio',
    significance: 'Maps planetary energy grid intersections: Giza (29.98°), Stonehenge (51.18°), Bermuda (25°), Tasman (41.29°S), Kailash (31.07°).',
    preset: 'top-grid',
    mode: 'cathie-grid'
  },
  {
    name: '3D Acoustic Waveform Halo',
    role: '432Hz Longitudinal Fourier Wave Visualizer',
    pbrSpecs: 'Dynamic BufferGeometry (256 pts) | Responsive to live oscillator',
    mathFormula: 'R(θ) = R₀ + A sin(9θ + ωt) + B cos(3θ + ωt)',
    significance: 'Visualizes natural acoustic resonance in 3D space. Flexes dynamically with audio frequency and overtone activation.',
    preset: 'perspective',
    mode: 'lissajous-wave'
  }
];

export const ModelProgressionGuide: React.FC<ModelProgressionGuideProps> = ({
  timeState,
  nodeConfig,
  onFocusComponent,
  isAudioPlaying,
  frequency,
  gridReferenceValue = 144,
  cipherGenerated = true,
  lastCipherHash = 'D9-00B291-B84976-9-9',
  onNavigateToTab,
  visitedChambers = ['audio', 'cathie', 'cipher', 'nonary', 'config'],
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'live' | 'phases' | 'anatomy'>('pipeline');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('p1');
  const [selectedCompName, setSelectedCompName] = useState<string>(COMPONENTS[0].name);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedPipelineStep, setSelectedPipelineStep] = useState<number>(0);

  // Determine current active diurnal phase based on solar minutes
  const now = new Date();
  const solarMins = now.getHours() * 60 + now.getMinutes();
  
  let currentPhaseIndex = 0;
  if (solarMins >= 0 && solarMins < 360) currentPhaseIndex = 0;
  else if (solarMins >= 360 && solarMins < 711) currentPhaseIndex = 1;
  else if (solarMins >= 711 && solarMins <= 729) currentPhaseIndex = 2;
  else if (solarMins > 729 && solarMins < 1080) currentPhaseIndex = 3;
  else if (solarMins >= 1080 && solarMins < 1431) currentPhaseIndex = 4;
  else currentPhaseIndex = 5;

  const currentPhase = PROGRESSION_PHASES[currentPhaseIndex];
  const selectedPhase = PROGRESSION_PHASES.find(p => p.id === selectedPhaseId) || currentPhase;
  const selectedComp = COMPONENTS.find(c => c.name === selectedCompName) || COMPONENTS[0];

  // Calculate dynamic Dragon 9 Model Maturity Score (0-100%)
  const hasAudioActive = isAudioPlaying;
  const isOptimalFreq = frequency === 432 || frequency === 528;
  const isCathieHarmonic = [144, 216, 288, 432, 576, 2160, 4320].includes(gridReferenceValue);
  const polarityRatio = nodeConfig.polarityAlpha / Math.max(1, nodeConfig.polarityBeta);
  const isPolarityHomeostatic = polarityRatio >= 0.8 && polarityRatio <= 1.6;
  const hasConsensus = nodeConfig.consensusStatus === 'Synchronized';

  let maturityScore = 20; // Base baseline
  if (hasAudioActive) maturityScore += 15;
  if (isOptimalFreq) maturityScore += 10;
  if (isCathieHarmonic) maturityScore += 15;
  if (cipherGenerated) maturityScore += 15;
  if (isPolarityHomeostatic) maturityScore += 10;
  if (hasConsensus) maturityScore += 15;
  maturityScore = Math.min(100, maturityScore);

  let maturityLevel = 'Level 1: Carrier Seed';
  if (maturityScore >= 85) maturityLevel = 'Level 5: Sovereign Mesh Homeostasis';
  else if (maturityScore >= 70) maturityLevel = 'Level 4: Chrono-Locked Vector Node';
  else if (maturityScore >= 50) maturityLevel = 'Level 3: Cryptographic Lattice';
  else if (maturityScore >= 35) maturityLevel = 'Level 2: Geodetic Spatial Resonance';

  // Pipeline Stages Definition
  const pipelineStages = [
    {
      id: 0,
      chamber: 'audio' as ChamberTab,
      name: 'Chamber 1: Acoustic Genesis',
      subtitle: 'Fourier Harmonic Wave Carrier',
      status: isAudioPlaying ? 'OSCILLATING' : 'STANDBY',
      isComplete: isAudioPlaying,
      color: '#38bdf8',
      summary: `Generates the fundamental longitudinal acoustic wave at ${frequency} Hz. This provides the continuous energy carrier upon which higher-dimensional geometric vectors ride.`,
      currentData: `Base: ${frequency} Hz (${isOptimalFreq ? 'Pythagorean Sacred' : 'Custom Frequency'}) | State: ${isAudioPlaying ? 'Carrier Engaged' : 'Oscillator Standby'}`,
      feedback: isAudioPlaying
        ? '✓ Acoustic carrier is active and pulsing the 3D nucleus.'
        : '→ Turn on the 432Hz oscillator in Chamber 1 to energize the acoustic lattice.',
      mathRef: 'Standing wave f₀ = 432 Hz; λ = c / f₀'
    },
    {
      id: 1,
      chamber: 'cathie' as ChamberTab,
      name: 'Chamber 2: Geodesic Translation',
      subtitle: 'Bruce Cathie Light-Speed Grid',
      status: isCathieHarmonic ? 'HARMONIC LOCKED' : 'CALIBRATED',
      isComplete: true,
      color: '#38bdf8',
      summary: `Translates scalar frequency vibrations into spherical light-speed coordinates using Bruce Cathie's c = 144,000 arc-min/sec geometric constant and 97,200 harmonic seconds/day.`,
      currentData: `Grid Value N = ${gridReferenceValue} | Light Speed: 299,796 km/s | Harmonic Sec: ${(gridReferenceValue * (1440/86400) * 299.796).toFixed(2)}`,
      feedback: isCathieHarmonic
        ? `✓ Grid value ${gridReferenceValue} matches sacred Cathie harmonic geometry.`
        : `→ Current value ${gridReferenceValue} is active; try 144 or 432 for maximum perimeter resonance.`,
      mathRef: 'c_geo = 144,000 arc-min/grid-sec | Ratio: 8/9'
    },
    {
      id: 2,
      chamber: 'cipher' as ChamberTab,
      name: 'Chamber 3: Vector Cryptography',
      subtitle: 'Nonary Base-9 Geometric Hash',
      status: 'VECTOR ENCODED',
      isComplete: cipherGenerated,
      color: '#e879f9',
      summary: `Folds raw information into structured geometric vector hash codes based on nonary digital root reduction mod 9, yielding 4D polar vectors (Vx, Vy, Vz, Vθ).`,
      currentData: `Hash: ${lastCipherHash} | Mod 9 Checksum: Verified | Nonary Matrix: 3×3 Active`,
      feedback: '✓ Geometric vector cipher generated and bound to 432Hz harmonic integrity.',
      mathRef: 'D9-[HEX1]-[HEX2]-[ROOT]-9 | Modulo 9 parity'
    },
    {
      id: 3,
      chamber: 'resonator' as ChamberTab,
      name: 'Chamber 4: Harmonic Resonance',
      subtitle: 'Interval & Comma Modulation',
      status: 'RESONANCE MATRIX',
      isComplete: true,
      color: '#38bdf8',
      summary: `Modulates the fundamental 432Hz acoustic frequency across Just Intonation ratios, Pythagorean commas (531441/524288), and the Golden Ratio Φ series.`,
      currentData: `Base: ${frequency} Hz | Systems: Just Intonation, Pythagorean, Golden Ratio Φ, Dragon 9 Nonary`,
      feedback: '✓ Harmonic intervals calibrated to natural geometric proportions.',
      mathRef: 'f = f₀ × (p/q) | Φ = 1.618034 | Comma = +23.46¢'
    },
    {
      id: 4,
      chamber: 'nonary' as ChamberTab,
      name: 'Chamber 5: Chrono-Lock',
      subtitle: '54-Minute Nonary Timekeeper',
      status: timeState.isApexActive ? 'APEX PORTAL ACTIVE' : 'TEMPORAL SYNC',
      isComplete: true,
      color: '#facc15',
      summary: `Serializes data into the 54-minute hour cycle (26.666 Dragon hours/day) across Cycle Alpha (00:00–12:00) and Beta (12:00–24:00), detecting 18-minute Apex alignment portals.`,
      currentData: `D9 Time: ${timeState.dragonHourDisplay} | ${timeState.currentCycle} | Next Apex: ${timeState.timeToNextApexMin}m`,
      feedback: timeState.isApexActive
        ? '⚡ APEX ALIGNMENT ACTIVE: Dual poles at zero-phase meridian equilibrium.'
        : `✓ Synchronized with 54-minute hour progression. Next Apex portal in ${timeState.timeToNextApexMin} minutes.`,
      mathRef: '1,440 Solar Min ÷ 54 = 26.6667 D9 Hours'
    },
    {
      id: 5,
      chamber: 'config' as ChamberTab,
      name: 'Chamber 6: Sovereign Homeostasis',
      subtitle: 'Two-Pin Polarity & Mesh Consensus',
      status: hasConsensus ? 'CONSENSUS VERIFIED' : 'EVALUATING',
      isComplete: hasConsensus && isPolarityHomeostatic,
      color: '#4ade80',
      summary: `Balances Static Reference Grounding (Alpha) and Dynamic Reactor Adaptability (Beta), compiling runnable antiX/Termux daemons and broadcasting master consensus telemetry.`,
      currentData: `Polarity: α ${nodeConfig.polarityAlpha}% / β ${nodeConfig.polarityBeta}% (Ratio: ${polarityRatio.toFixed(2)}) | Status: ${nodeConfig.consensusStatus}`,
      feedback: hasConsensus
        ? '✓ Sovereign mesh node consensus verified. Telemetry payload ready for antiX/Termux deployment.'
        : '→ Execute master consensus route in Chamber 6 to verify final cryptographic broadcast signatures.',
      mathRef: 'Homeostasis Ratio = α / β | Daemon: PM2 + Python'
    }
  ];

  const activePipelineStage = pipelineStages[selectedPipelineStep];

  const handleInspectPhase = (phase: ProgressionPhase) => {
    setSelectedPhaseId(phase.id);
    if (onFocusComponent) {
      onFocusComponent(phase.focusPreset, phase.focusMode);
    }
  };

  const handleInspectComponent = (comp: ComponentSpec) => {
    setSelectedCompName(comp.name);
    if (onFocusComponent) {
      onFocusComponent(comp.preset, comp.mode);
    }
  };

  return (
    <div className="bg-slate-950/95 cyber:bg-black lab:bg-white border border-cyan-500/30 cyber:border-cyan-400 lab:border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xl lab:shadow-sm flex flex-col gap-5 text-slate-100 cyber:text-white lab:text-slate-900">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30 cyber:from-cyan-400/30 cyber:to-fuchsia-400/30 lab:from-sky-100 lab:to-fuchsia-100 border border-cyan-500/40 cyber:border-cyan-400 lab:border-sky-300 flex items-center justify-center text-cyan-400 cyber:text-cyan-300 lab:text-sky-700">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-cyan-300 cyber:text-cyan-300 lab:text-sky-800 tracking-wide flex items-center gap-2">
              Dragon 9 Maturation &amp; Mechanics Guide
            </h2>
            <p className="text-[11px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 font-mono">
              Dynamic data pipeline telemetry &amp; step-by-step model maturation feedback
            </p>
          </div>
        </div>

        {/* Tab Switcher & Collapse Button */}
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap bg-slate-900 cyber:bg-black lab:bg-slate-100 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-300 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pipeline'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-white lab:text-sky-700 lab:border-slate-300 lab:shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600 lab:hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400 cyber:text-inherit lab:text-inherit" />
              <span>Data Pipeline &amp; Maturity</span>
            </button>
            <button
              onClick={() => setActiveTab('phases')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeTab === 'phases'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-white lab:text-sky-700 lab:border-slate-300 lab:shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600 lab:hover:text-slate-900'
              }`}
            >
              Diurnal Cycle (6 Phases)
            </button>
            <button
              onClick={() => setActiveTab('anatomy')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeTab === 'anatomy'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-white lab:text-sky-700 lab:border-slate-300 lab:shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600 lab:hover:text-slate-900'
              }`}
            >
              Component Anatomy
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-300 cyber:bg-black cyber:text-white cyber:border-cyan-400/60 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-sky-700 transition-colors cursor-pointer"
            title={isExpanded ? 'Minimize Guide' : 'Expand Guide'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* TAB 1: DYNAMIC DATA PIPELINE, MODEL MATURITY & LABORATORY PROGRESS FEEDBACK */}
          {activeTab === 'pipeline' && (
            <div className="flex flex-col gap-5">
              {/* Dragon 9 Model Maturation Progress Header Card */}
              <div className="bg-slate-900/90 cyber:bg-black lab:bg-slate-50 border border-cyan-500/40 cyber:border-cyan-400 lab:border-sky-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl lab:shadow-xs">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
                      DRAGON 9 MODEL MATURITY STATUS:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-50 lab:text-sky-800 lab:border-sky-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 cyber:text-black lab:text-amber-600" />
                      {maturityLevel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 cyber:text-zinc-200 lab:text-slate-700 leading-relaxed font-sans">
                    The Dragon 9 cyber-biological node matures as information traverses its five specialized chambers: from raw acoustic standing waves (Chamber 1) through spherical geodetic grids (Chamber 2) and nonary vector cryptography (Chamber 3), into 54-minute temporal synchronization (Chamber 4), culminating in Two-Pin Polarity homeostasis (Chamber 5).
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono pt-1 text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
                    <div>
                      Carrier: <span className={hasAudioActive ? 'text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 font-bold' : 'text-slate-500 lab:text-slate-500'}>{frequency} Hz ({hasAudioActive ? 'Oscillating' : 'Standby'})</span>
                    </div>
                    <span className="text-slate-700 lab:text-slate-300">•</span>
                    <div>
                      Cathie Grid: <span className="text-amber-300 cyber:text-yellow-300 lab:text-amber-700 font-bold">N={gridReferenceValue}</span>
                    </div>
                    <span className="text-slate-700 lab:text-slate-300">•</span>
                    <div>
                      Polarity Ratio: <span className="text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-700 font-bold">{polarityRatio.toFixed(2)}</span>
                    </div>
                    <span className="text-slate-700 lab:text-slate-300">•</span>
                    <div>
                      Apex Portal: <span className={timeState.isApexActive ? 'text-amber-300 cyber:text-yellow-300 lab:text-amber-700 font-bold' : 'text-slate-400 cyber:text-zinc-300 lab:text-slate-600'}>{timeState.isApexActive ? 'ACTIVE' : `T - ${timeState.timeToNextApexMin}m`}</span>
                    </div>
                  </div>
                </div>

                {/* Circular Maturity Gauge & Score */}
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 cyber:bg-zinc-950 lab:bg-white border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 shrink-0 min-w-[130px]">
                  <div className="text-3xl font-mono font-black text-cyan-400 cyber:text-cyan-300 lab:text-sky-700">
                    {maturityScore}%
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-500 uppercase tracking-wider mt-0.5">
                    Maturity Index
                  </div>
                  <div className="w-full bg-slate-800 cyber:bg-zinc-800 lab:bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      style={{ width: `${maturityScore}%` }}
                      className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 lab:from-sky-600 lab:to-fuchsia-600 h-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC VISUALIZATION: Chamber Data Pipeline Flow Chart */}
              <div className="bg-slate-950 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-inner lab:shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200 pb-2">
                  <div className="text-xs font-mono text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
                    Interactive Chamber Data Pipeline (Click Any Node to Inspect Data Processing)
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 cyber:text-zinc-300 lab:text-slate-500">
                    Real-time Data Transmission Flow
                  </span>
                </div>

                {/* SVG & Node Pipeline Flow */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                  {pipelineStages.map((stage, idx) => {
                    const isSelected = selectedPipelineStep === idx;
                    const Icon = idx === 0 ? Waves : idx === 1 ? Globe : idx === 2 ? Binary : idx === 3 ? Clock : Cpu;

                    return (
                      <div
                        key={stage.id}
                        onClick={() => setSelectedPipelineStep(idx)}
                        className={`relative rounded-xl border p-3 flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-500/20 cyber:bg-cyan-950 cyber:border-cyan-300 lab:bg-sky-50 lab:border-sky-600 lab:shadow-xs'
                            : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900 cyber:bg-black cyber:border-cyan-500/40 cyber:hover:border-cyan-400 lab:bg-white lab:border-slate-200 lab:hover:border-slate-300'
                        }`}
                      >
                        {/* Step number badge & icon */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-400 cyber:text-cyan-300 lab:text-slate-600 bg-slate-950 cyber:bg-black lab:bg-slate-100 px-2 py-0.5 rounded border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
                            STEP 0{idx + 1}
                          </span>
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400 cyber:text-cyan-300 lab:text-sky-700' : 'text-slate-500 cyber:text-zinc-400 lab:text-slate-400'}`} />
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-200 cyber:text-white lab:text-slate-900 truncate">
                            {stage.name.split(': ')[1]}
                          </div>
                          <div className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 truncate">
                            {stage.subtitle}
                          </div>
                        </div>

                        {/* Status Tag */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 cyber:border-cyan-500/30 lab:border-slate-200 text-[10px] font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold uppercase truncate ${
                              stage.isComplete
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cyber:bg-yellow-300 cyber:text-black lab:bg-amber-50 lab:text-amber-800 lab:border-amber-300'
                            }`}
                          >
                            {stage.status}
                          </span>
                          {stage.isComplete ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 cyber:text-emerald-300 lab:text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 cyber:text-yellow-300 lab:text-amber-600 shrink-0" />
                          )}
                        </div>

                        {/* Connection arrow between nodes on desktop */}
                        {idx < 4 && (
                          <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                            <ArrowRight className="w-4 h-4 text-slate-600 cyber:text-cyan-400 lab:text-slate-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DETAILED DATA PROCESSING & USER PROGRESS FEEDBACK CARD */}
              <div className="bg-slate-900/80 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-100 lab:text-sky-800 lab:border-sky-300">
                        STEP 0{activePipelineStage.id + 1} OF 05
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-cyan-300 cyber:text-cyan-300 lab:text-sky-800">
                        {activePipelineStage.name}
                      </h3>
                    </div>
                    <p className="text-xs text-amber-300/90 cyber:text-yellow-300 lab:text-amber-700 font-mono mt-0.5">
                      Subsystem: {activePipelineStage.subtitle}
                    </p>
                  </div>

                  {onNavigateToTab && (
                    <button
                      onClick={() => onNavigateToTab(activePipelineStage.chamber)}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Open {activePipelineStage.name.split(':')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Explanation Narrative */}
                <div className="text-xs text-slate-200 cyber:text-white lab:text-slate-800 leading-relaxed font-sans">
                  {activePipelineStage.summary}
                </div>

                {/* Dynamic Laboratory State & Feedback Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  {/* Current Ingested Data Payload */}
                  <div className="bg-slate-950 cyber:bg-zinc-950 lab:bg-white p-3.5 rounded-xl border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 flex flex-col justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 cyber:text-zinc-300 lab:text-slate-500 uppercase tracking-wider block">
                        CURRENT LAB DATA INGESTION:
                      </span>
                      <p className="text-cyan-300 cyber:text-cyan-300 lab:text-sky-800 font-medium mt-1">
                        {activePipelineStage.currentData}
                      </p>
                    </div>
                    <div className="text-[10px] text-slate-400 cyber:text-zinc-200 lab:text-slate-600 bg-slate-900/90 cyber:bg-black lab:bg-slate-50 p-2 rounded border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
                      Formula: {activePipelineStage.mathRef}
                    </div>
                  </div>

                  {/* Contextual User Progress Feedback */}
                  <div className="bg-slate-950 cyber:bg-zinc-950 lab:bg-white p-3.5 rounded-xl border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 flex flex-col justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 cyber:text-zinc-300 lab:text-slate-500 uppercase tracking-wider block">
                        PROGRESS DIAGNOSTIC &amp; GUIDANCE:
                      </span>
                      <p className="text-slate-200 cyber:text-white lab:text-slate-800 mt-1 leading-relaxed">
                        {activePipelineStage.feedback}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 cyber:text-emerald-300 lab:text-emerald-700">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Homeostasis Telemetry Verified</span>
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Data Pipeline Flow Mechanics */}
                <div className="bg-slate-950/60 cyber:bg-black lab:bg-white border border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200 rounded-xl p-3.5 text-xs">
                  <span className="text-[10px] font-mono text-slate-400 cyber:text-cyan-300 lab:text-slate-500 uppercase tracking-wider block mb-1">
                    How Data Progresses Through this Chamber:
                  </span>
                  {activePipelineStage.id === 0 && (
                    <p className="text-slate-300 cyber:text-zinc-200 lab:text-slate-700 leading-relaxed">
                      1. The Web Audio oscillator synthesizes a continuous acoustic frequency (default 432 Hz). As sound waves oscillate, they define the fundamental periodicity of the system. Without this carrier wave, geometric cipher vectors lack spatial-temporal propulsion.
                    </p>
                  )}
                  {activePipelineStage.id === 1 && (
                    <p className="text-slate-300 cyber:text-zinc-200 lab:text-slate-700 leading-relaxed">
                      2. The frequency enters Bruce Cathie&apos;s harmonic light-speed matrix (c = 144,000 arc-min/sec). The scalar audio oscillation is translated into planetary arc geometry, matching geodetic nodes such as the Great Pyramid of Giza (29.98°N) and Stonehenge (51.18°N) with 97,200 harmonic seconds per day.
                    </p>
                  )}
                  {activePipelineStage.id === 2 && (
                    <p className="text-slate-300 cyber:text-zinc-200 lab:text-slate-700 leading-relaxed">
                      3. Input data strings are compressed into Nonary (base-9) cryptographic hashes (D9-HEX-HEX-ROOT-9) and mapped onto a 3×3 matrix with digital root reduction [1-9]. Angular cosine/sine projections compute 4D polar vectors (Vx, Vy, Vz, Vθ) to ensure mathematical reversibility.
                    </p>
                  )}
                  {activePipelineStage.id === 3 && (
                    <p className="text-slate-300 cyber:text-zinc-200 lab:text-slate-700 leading-relaxed">
                      4. The encrypted geometric vectors are time-stamped using the 54-minute hour cycle (26.666 Dragon hours per 1,440-minute day). During the midday (11:51–12:09) and midnight (23:51–00:09) Apex portals, vectors achieve phase synchronization across the solar meridian.
                    </p>
                  )}
                  {activePipelineStage.id === 4 && (
                    <p className="text-slate-300 cyber:text-zinc-200 lab:text-slate-700 leading-relaxed">
                      5. The Two-Pin Polarity Core balances Static Reference Grounding (Alpha) against Dynamic Reactor Adaptability (Beta). The final matured state generates runnable antiX Linux / Termux Bash scripts, Python daemons, and PM2 configurations, broadcasting validated telemetry to the FluidmotionTV Sovereign Mesh.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STEP-BY-STEP DIURNAL CYCLE (6 PHASES) */}
          {activeTab === 'phases' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-slate-400 cyber:text-zinc-300 lab:text-slate-600 font-mono flex flex-wrap items-center justify-between gap-2">
                <span>Select any phase below to inspect the model&apos;s mechanical state during that diurnal window:</span>
                <span className="text-cyan-400 cyber:text-cyan-300 lab:text-sky-700">Diurnal Cycle: 1,440 Solar Min = 26.666 D9 Hours</span>
              </div>

              {/* Phase Selection Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {PROGRESSION_PHASES.map((p, idx) => {
                  const isCurrent = idx === currentPhaseIndex;
                  const isSelected = p.id === selectedPhaseId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleInspectPhase(p)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/10 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-50 lab:border-sky-600 lab:text-sky-900 lab:shadow-none'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/40 lab:bg-slate-50 lab:border-slate-200 lab:text-slate-600 lab:hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold">Phase {idx + 1}</span>
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 cyber:bg-black lab:bg-sky-600" title="Active Solar Window" />
                        )}
                      </div>
                      <div className={`font-semibold text-xs truncate ${isSelected ? 'cyber:text-black lab:text-sky-900' : 'text-slate-200 cyber:text-white lab:text-slate-800'}`}>{p.cycle}</div>
                      <div className={`font-mono text-[10px] truncate ${isSelected ? 'cyber:text-black lab:text-sky-700' : 'text-slate-500 cyber:text-zinc-400 lab:text-slate-500'}`}>{p.solarWindow}</div>
                    </button>
                  );
                })}
              </div>

              {/* Detailed Phase Inspection Card */}
              <div className="bg-slate-900/80 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-5 items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-cyan-300 cyber:text-cyan-300 lab:text-sky-800">{selectedPhase.title}</h3>
                    <span
                      style={{ color: selectedPhase.color, borderColor: selectedPhase.color }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono uppercase border bg-slate-950 font-bold"
                    >
                      {selectedPhase.cycle}
                    </span>
                    <span className="text-xs font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
                      Window: {selectedPhase.solarWindow} ({selectedPhase.d9HourRange})
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 cyber:text-white lab:text-slate-800 leading-relaxed">
                    {selectedPhase.summary}
                  </p>

                  <div className="bg-slate-950 cyber:bg-zinc-950 lab:bg-white border border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200 p-3 rounded-lg text-xs font-mono space-y-1">
                    <span className="text-slate-500 cyber:text-cyan-300 lab:text-slate-500 uppercase text-[10px]">Mechanical Physics:</span>
                    <p className="text-slate-300 cyber:text-zinc-200 lab:text-slate-700">{selectedPhase.mechanics}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => handleInspectPhase(selectedPhase)}
                    className="w-full px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white font-bold text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Focus 3D View on Phase</span>
                  </button>
                  <div className="text-[10px] font-mono text-slate-500 cyber:text-zinc-300 lab:text-slate-600 text-center">
                    Presets: {selectedPhase.focusPreset} | {selectedPhase.focusMode}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 3D COMPONENT ANATOMY & GEOMETRY */}
          {activeTab === 'anatomy' && (
            <div className="flex flex-col md:flex-row gap-4">
              {/* Component List */}
              <div className="w-full md:w-64 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0 pb-2 md:pb-0">
                {COMPONENTS.map((comp) => (
                  <button
                    key={comp.name}
                    onClick={() => handleInspectComponent(comp)}
                    className={`px-3 py-2.5 rounded-lg border text-left text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-between gap-2 ${
                      selectedCompName === comp.name
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-50 lab:text-sky-800 lab:border-sky-600'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/40 lab:bg-slate-50 lab:border-slate-200 lab:text-slate-600 lab:hover:bg-slate-100 lab:hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{comp.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 text-cyan-400 cyber:text-inherit lab:text-inherit" />
                  </button>
                ))}
              </div>

              {/* Component Detail Breakdown */}
              <div className="flex-1 bg-slate-900/80 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-2">
                    <div>
                      <h3 className="text-base font-bold text-cyan-300 cyber:text-cyan-300 lab:text-sky-800">{selectedComp.name}</h3>
                      <p className="text-xs text-amber-300/90 cyber:text-yellow-300 lab:text-amber-700 font-mono mt-0.5">{selectedComp.role}</p>
                    </div>
                    <button
                      onClick={() => handleInspectComponent(selectedComp)}
                      className="px-3 py-1 rounded-lg border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white lab:border-sky-800 text-xs font-mono transition-colors cursor-pointer"
                    >
                      Inspect in 3D View
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-mono text-slate-500 cyber:text-zinc-300 lab:text-slate-500 uppercase text-[10px] block">
                        PBR Material &amp; Procedural Spec:
                      </span>
                      <p className="font-mono text-slate-300 cyber:text-white lab:text-slate-800 bg-slate-950 cyber:bg-zinc-950 lab:bg-white p-2 rounded border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 mt-1">
                        {selectedComp.pbrSpecs}
                      </p>
                    </div>

                    <div>
                      <span className="font-mono text-slate-500 cyber:text-zinc-300 lab:text-slate-500 uppercase text-[10px] block">
                        Underlying Mathematical Equation:
                      </span>
                      <p className="font-mono text-cyan-300 cyber:text-cyan-300 lab:text-sky-800 bg-slate-950 cyber:bg-zinc-950 lab:bg-white p-2 rounded border border-cyan-500/20 cyber:border-cyan-500/50 lab:border-sky-200 mt-1">
                        {selectedComp.mathFormula}
                      </p>
                    </div>

                    <div>
                      <span className="font-mono text-slate-500 cyber:text-zinc-300 lab:text-slate-500 uppercase text-[10px] block">
                        Physical &amp; Harmonic Significance:
                      </span>
                      <p className="text-slate-300 cyber:text-zinc-200 lab:text-slate-700 leading-relaxed mt-1">
                        {selectedComp.significance}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
