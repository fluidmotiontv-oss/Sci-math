export interface CathieConceptModule {
  id: 'light-speed' | 'harmonic-second' | 'mass-energy' | 'planetary-grid' | 'nonary-432';
  shortTitle: string;
  title: string;
  formula: string;
  keyConstant: string;
  summary: string;
  deepDive: string[];
  dragon9Link: string;
  evaluateForN: (n: number) => {
    label: string;
    value: string;
    note: string;
  }[];
}

export function getDigitalRootSteps(n: number): string {
  const abs = Math.abs(Math.round(n));
  if (abs === 0) return '0 → 9 (Nonary Null Cycle)';
  const steps: string[] = [];
  let current = abs;
  while (current >= 10) {
    const digits = String(current).split('').map(Number);
    const sum = digits.reduce((a, b) => a + b, 0);
    steps.push(`${digits.join(' + ')} = ${sum}`);
    current = sum;
  }
  return steps.length > 0 ? `${abs} → ${steps.join(' → ')}` : `${abs} (Single-digit root)`;
}

export const CATHIE_CONCEPT_MODULES: CathieConceptModule[] = [
  {
    id: 'light-speed',
    shortTitle: '144,000 Light-Speed Grid',
    title: 'Geodesic Speed of Light (144,000 Arc-Minutes / Grid Sec)',
    formula: 'c_grid = 144,000′ / grid-sec = 144,000 nautical miles / grid-sec',
    keyConstant: '144,000 arc-min/s (c ≈ 299,792.458 km/s)',
    summary:
      'Capt. Bruce Cathie proposed that the speed of light is a direct geometric harmonic of Earth’s spherical coordinate grid when measured in minutes of arc (nautical miles) rather than arbitrary metric units.',
    deepDive: [
      'A sphere contains 360 degrees × 60 minutes of arc = 21,600 arc-minutes around a great circle. By definition, 1 nautical mile equals 1 minute of arc on Earth’s mean meridian.',
      'In standard solar seconds, light travels ~299,792.458 km/s (≈ 161,875 nautical miles/s). Cathie observed that when time is scaled by his 8/9 harmonic second ratio (86,400 → 97,200 grid seconds/day), light travels almost exactly 144,000 arc-minutes per grid second (21,600 × 6.6667).',
      'Because 144 is the core harmonic whole-number grid unit (144 × 1,000 = 144,000), planetary distances, wave frequencies, and geometric coordinates lock into integer multiples of 144 and 9.',
    ],
    dragon9Link:
      'In Dragon 9, the 1,440 minutes of a solar day (144 × 10) mirror Cathie’s 144 baseline, turning daily temporal divisions into an exact harmonic sub-multiple of the light-speed grid.',
    evaluateForN: (n: number) => [
      {
        label: 'Ratio to 144 Base (N / 144)',
        value: `${(n / 144).toFixed(4)}×`,
        note: Number.isInteger(n / 144) ? 'Exact integer harmonic multiple of 144' : 'Fractional grid offset',
      },
      {
        label: 'Earth Circumferences (N × 1000 / 21600)',
        value: `${((n * 1000) / 21600).toFixed(4)} orbits`,
        note: '21,600 arc-min = 1 planetary great circle',
      },
      {
        label: 'Light-Grid Arc Equivalents',
        value: `${(n * 1000).toLocaleString()} arc-min`,
        note: 'At N=144 equals 144,000 nm/grid-sec',
      },
    ],
  },
  {
    id: 'harmonic-second',
    shortTitle: '97,200 Grid Second & 8:9 Ratio',
    title: 'Harmonic Time Scale: 97,200 Grid Seconds vs 86,400 Solar Seconds',
    formula: 'T_ratio = 86,400 / 97,200 = 8 / 9 = 0.888888...',
    keyConstant: '97,200 grid-sec/day (27 harmonic hrs × 3,600)',
    summary:
      'Cathie introduced a 27-hour harmonic grid clock containing 97,200 harmonic seconds per rotation—producing an exact 8:9 ratio against the conventional 86,400-second solar day.',
    deepDive: [
      'A standard 24-hour clock contains 24 × 3,600 = 86,400 solar seconds. Cathie’s harmonic grid clock uses 27 grid hours per Earth rotation (27 × 3,600 = 97,200 grid seconds), so 1 grid second = 8/9 of a solar second.',
      'Notice the harmonic symmetries of 97,200: 97,200 = 432 Hz × 225, and 97,200 = 54 × 1,800. Every partition preserves modulo-9 invariance (9 + 7 + 2 + 0 + 0 = 18 → 9).',
      'Multiplying 161,875 nm/solar-sec × (8 / 9) yields ~143,889 → 144,000 nm/grid-sec, explaining how Cathie unified terrestrial rotation with the velocity of light.',
    ],
    dragon9Link:
      'Dragon 9 replaces rigid 60-minute hours with 54-minute hours (26.667 Dragon hours/day) and 18-minute Apex windows—operating directly inside this 97,200 / 54 / 432 nonary harmonic bridge.',
    evaluateForN: (n: number) => [
      {
        label: 'Calculated Harmonic Second',
        value: `${(n * (1440 / 86400) * 299.796).toFixed(4)}`,
        note: 'N × (1440 / 86400) × (c / 1000)',
      },
      {
        label: '8:9 Scaled Value (N × 8/9)',
        value: `${((n * 8) / 9).toFixed(4)}`,
        note: 'Solar-to-grid temporal conversion factor',
      },
      {
        label: '9:8 Inverse Expansion (N × 9/8)',
        value: `${((n * 9) / 8).toFixed(4)}`,
        note: 'Grid-to-solar harmonic expansion (432×9/8 = 486)',
      },
    ],
  },
  {
    id: 'mass-energy',
    shortTitle: 'Unified Mass-Energy (c = 144)',
    title: 'Harmonic Mass-Energy Equation & Reciprocal Wave Fields',
    formula: 'E_harmonic = N × 144² = N × 20,736 | Reciprocal = 1 / N',
    keyConstant: 'c² harmonic = 144² = 20,736 (Digital Root 9)',
    summary:
      'Replacing standard metric c² with the harmonic grid constant 144² (20,736) maps mass, energy, and wave reciprocals into dimensionless lattice coordinates.',
    deepDive: [
      'In Cathie’s Energy Grid formulation, Einstein’s E = mc² is analyzed through base-9 harmonic integers where c is normalized to 144 (representing 144,000 arc-minutes/grid-sec scaled by 10⁻³).',
      'Squaring 144 yields 20,736 (2 + 0 + 7 + 3 + 6 = 18 → 9). Multiplying a reference lattice node N by 144² gives the volumetric grid energy equivalent in harmonic units.',
      'Cathie also paired every grid value N with its reciprocal 1 / N (reciprocal light harmonic), positing that physical matter (N) and counter-spatial gravity/wave fields (1/N) mirror one another across spherical nodes.',
    ],
    dragon9Link:
      'The Two-Pin Polarity Core models this dualism: Static Reference Alpha (structural N lattice) balanced against Dynamic Reactor Beta (reciprocal 1/N wave adaptability).',
    evaluateForN: (n: number) => [
      {
        label: 'Grid Energy (N × 144²)',
        value: `${(n * 20736).toLocaleString()} units`,
        note: '20,736 has digital root 9 (2+0+7+3+6=18→9)',
      },
      {
        label: 'Reciprocal Wave (1 / N)',
        value: (1 / Math.max(0.0001, n)).toFixed(8),
        note: 'Counter-spatial reciprocal harmonic index',
      },
      {
        label: 'Harmonic Geometric Mean √(N × 144)',
        value: Math.sqrt(Math.max(0, n * 144)).toFixed(4),
        note: 'Equilibrium radius between N and 144 base',
      },
    ],
  },
  {
    id: 'planetary-grid',
    shortTitle: 'Global Polyhedral Grid & Nodes',
    title: 'Planetary Energy Grid & Great-Circle Geodetic Intersections',
    formula: 'Harmonic Index = (N × |Latitude°|) / 360°',
    keyConstant: '360° Sphere · Giza 29.9792° N · Stonehenge 51.1789° N',
    summary:
      'Beginning with flight tracks over New Zealand and the Tasman Sea in the 1960s, Cathie mapped an interlocking geometric lattice across Earth’s crust linking ancient megaliths and geomagnetic anomalies.',
    deepDive: [
      'Cathie first charted unexplained aerial trajectories along precise orthodromic (great-circle) lines radiating across the South Pacific from Wellington/Tasman (41.2865° S), later extending the grid globally.',
      'A famous numerical coincidence highlighted in his work is the Great Pyramid of Giza at 29.9792° N latitude—whose decimal digits directly mirror the vacuum speed of light (299,792.458 km/s).',
      'Other primary nodes—such as Stonehenge (51.1789° N, matching the classic 51.84°/51.18° pyramidal & geometric angle), the Bermuda magnetic zone (25° N, 71° W), and Mount Kailash (31.0674° N)—serve as planetary intersection vertices in this chamber’s 3D geodesic sphere.',
    ],
    dragon9Link:
      'Switching the 3D Viewport to "Cathie Grid" renders this exact icosahedral geodesic cage, major harmonic latitude rings, and all 5 planetary beacon rays.',
    evaluateForN: (n: number) => [
      {
        label: 'Circle Perimeter Share (N / 360°)',
        value: `${((n / 360) * 100).toFixed(2)}%`,
        note: 'At N=144 equals 40.00% (2/5 of 360° sphere)',
      },
      {
        label: 'Giza 29.9792° Index',
        value: ((n * 29.9792) / 360).toFixed(3),
        note: 'N=144 → 11.992 (≈ 12.000 harmonic twelfth)',
      },
      {
        label: 'Stonehenge 51.1789° Index',
        value: ((n * 51.1789) / 360).toFixed(3),
        note: 'N=144 → 20.472 · N=216 → 30.707',
      },
    ],
  },
  {
    id: 'nonary-432',
    shortTitle: 'Nonary Roots & 432 Hz Tuning',
    title: 'Modulo-9 Nonary Invariance & 432 Hz Pythagorean Alignment',
    formula: '432 = 3 × 144 = 8 × 54 = 4 × 108 · DR(432) = 4+3+2 = 9',
    keyConstant: 'Nonary Digital Root = 9 · Pythagorean A4 = 432 Hz',
    summary:
      'All core Bruce Cathie grid constants (144, 216, 288, 432, 576, 2160, 4320, 97200) reduce to a Nonary Digital Root of 9, unifying spatial grid math with 432 Hz Pythagorean acoustic resonance.',
    deepDive: [
      'Digital root reduction (mod 9 arithmetic) reveals whether a wave ratio closes cleanly into a whole standing wave cycle: 144 (1+4+4=9), 216 (2+1+6=9), 432 (4+3+2=9), and 2,160 (Platonic month / Moon diameter in miles = 9).',
      '432 Hz sits at an exact integer triad multiple of Cathie’s 144 light-speed base (144 × 3 = 432 Hz) and 8× the Dragon 9 54-minute cycle (54 × 8 = 432).',
      'Dividing 432 Hz by 108 yields 4.0 Hz—used by the laboratory’s Pulse Synchronization mode so the 3D Sovereign Core rotates in phase with acoustic sub-harmonics.',
    ],
    dragon9Link:
      'Use Chamber 1 (432Hz Audio Synthesizer) with Sub-Harmonic Layers (/2 = 216Hz, /3 = 144Hz, /4 = 108Hz, /9 = 48Hz) to hear Cathie’s exact 144 & 216 grid ratios in real time.',
    evaluateForN: (n: number) => [
      {
        label: 'Digital Root Reduction',
        value: getDigitalRootSteps(n),
        note: 'Mod-9 reduction of current grid coordinate N',
      },
      {
        label: '432 Hz Ratio (N / 432)',
        value: `${(n / 432).toFixed(4)}×`,
        note: 'At N=144 equals 0.3333× (exact 1/3 sub-harmonic)',
      },
      {
        label: '54-Min Factor (N / 54)',
        value: `${(n / 54).toFixed(4)}×`,
        note: 'Dragon 9 nonary hour divisor ratio',
      },
    ],
  },
];
