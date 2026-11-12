export type HarmonicIntervalFamily =
  | 'just-intonation'
  | 'pythagorean-commas'
  | 'golden-ratio-phi'
  | 'dragon9-nonary';

export interface HarmonicInterval {
  id: string;
  name: string;
  symbol: string;
  family: HarmonicIntervalFamily;
  ratioFraction: string;
  ratioDecimal: number;
  cents: number; // 1200 * log2(ratio)
  description: string;
  harmonicContext: string;
}

export interface IntervalFamilyDefinition {
  id: HarmonicIntervalFamily;
  title: string;
  shortTitle: string;
  description: string;
  governingPrinciple: string;
  intervals: HarmonicInterval[];
}

export const PHI = 1.618033988749895; // Golden Ratio

export function calculateCents(ratio: number): number {
  if (ratio <= 0) return 0;
  return Math.round(1200 * Math.log2(ratio) * 100) / 100;
}

export const HARMONIC_INTERVAL_FAMILIES: IntervalFamilyDefinition[] = [
  {
    id: 'just-intonation',
    title: 'Just Intonation (Pure Harmonic Ratios)',
    shortTitle: 'Just Intonation',
    description: 'Acoustic tuning where frequencies are related by whole-number ratios (3:2, 4:3, 5:4), maximizing constructive wave interference.',
    governingPrinciple: 'Constructive Integer Standing Waves (Harmonics 1–16)',
    intervals: [
      {
        id: 'ji-unison',
        name: 'Harmonic Fundamental (Unison)',
        symbol: '1/1',
        family: 'just-intonation',
        ratioFraction: '1/1',
        ratioDecimal: 1.0,
        cents: 0.0,
        description: 'Prime fundamental acoustic reference standing wave.',
        harmonicContext: 'Zero phase drift; identical carrier frequency.',
      },
      {
        id: 'ji-minor-second',
        name: 'Diatonic Semitone (Minor Second)',
        symbol: '16/15',
        family: 'just-intonation',
        ratioFraction: '16/15',
        ratioDecimal: 16 / 15, // 1.066667
        cents: calculateCents(16 / 15), // 111.73 cents
        description: 'Natural 5-limit diatonic semitone between major 7th and octave.',
        harmonicContext: 'High harmonic tension; fast micro-beating.',
      },
      {
        id: 'ji-major-second',
        name: 'Greater Tone (Major Second)',
        symbol: '9/8',
        family: 'just-intonation',
        ratioFraction: '9/8',
        ratioDecimal: 9 / 8, // 1.125
        cents: calculateCents(9 / 8), // 203.91 cents
        description: 'Primary nonary whole tone; 9:8 acoustic interval derived from 2 fifths.',
        harmonicContext: 'Direct Dragon 9 nonary whole step resonance.',
      },
      {
        id: 'ji-minor-third',
        name: 'Pure Minor Third',
        symbol: '6/5',
        family: 'just-intonation',
        ratioFraction: '6/5',
        ratioDecimal: 6 / 5, // 1.200
        cents: calculateCents(6 / 5), // 315.64 cents
        description: 'Harmonic 5-limit minor third (difference between 5th and 3rd).',
        harmonicContext: 'Contemplative, stable introspective timbre.',
      },
      {
        id: 'ji-major-third',
        name: 'Pure Major Third',
        symbol: '5/4',
        family: 'just-intonation',
        ratioFraction: '5/4',
        ratioDecimal: 5 / 4, // 1.250
        cents: calculateCents(5 / 4), // 386.31 cents
        description: '5th harmonic partial; completely beat-free consonant triad tone.',
        harmonicContext: 'Pure harmonic radiance without equal-temperament beating.',
      },
      {
        id: 'ji-fourth',
        name: 'Perfect Fourth',
        symbol: '4/3',
        family: 'just-intonation',
        ratioFraction: '4/3',
        ratioDecimal: 4 / 3, // 1.333333
        cents: calculateCents(4 / 3), // 498.04 cents
        description: 'Inversion of the perfect fifth; foundational spatial fourth.',
        harmonicContext: 'Spacious tetrahedral spatial architecture.',
      },
      {
        id: 'ji-tritone',
        name: 'Septimal Tritone',
        symbol: '7/5',
        family: 'just-intonation',
        ratioFraction: '7/5',
        ratioDecimal: 7 / 5, // 1.400
        cents: calculateCents(7 / 5), // 582.51 cents
        description: '7-limit natural diminished fifth acoustic bridge.',
        harmonicContext: 'Maximum symmetry point of the octave.',
      },
      {
        id: 'ji-fifth',
        name: 'Perfect Fifth (Diapente)',
        symbol: '3/2',
        family: 'just-intonation',
        ratioFraction: '3/2',
        ratioDecimal: 3 / 2, // 1.500
        cents: calculateCents(3 / 2), // 701.96 cents
        description: 'Sacred 3:2 ratio; purest harmonic consonant interval after octave.',
        harmonicContext: 'Foundational universal generator for Pythagorean spiraling.',
      },
      {
        id: 'ji-minor-sixth',
        name: 'Pure Minor Sixth',
        symbol: '8/5',
        family: 'just-intonation',
        ratioFraction: '8/5',
        ratioDecimal: 8 / 5, // 1.600
        cents: calculateCents(8 / 5), // 813.69 cents
        description: 'Inversion of the pure major third; deep resonant acoustic color.',
        harmonicContext: 'Resonant harmonic grounding.',
      },
      {
        id: 'ji-major-sixth',
        name: 'Pure Major Sixth',
        symbol: '5/3',
        family: 'just-intonation',
        ratioFraction: '5/3',
        ratioDecimal: 5 / 3, // 1.666667
        cents: calculateCents(5 / 3), // 884.36 cents
        description: 'Inversion of the pure minor third; warm expansive harmonic blend.',
        harmonicContext: 'Fibonacci harmonic step (5:3).',
      },
      {
        id: 'ji-harmonic-seventh',
        name: 'Harmonic Seventh (Septimal)',
        symbol: '7/4',
        family: 'just-intonation',
        ratioFraction: '7/4',
        ratioDecimal: 7 / 4, // 1.750
        cents: calculateCents(7 / 4), // 968.83 cents
        description: '7th harmonic overtone; organic blues/sacred overtone interval.',
        harmonicContext: 'Direct natural overtone of the 432Hz fundamental.',
      },
      {
        id: 'ji-octave',
        name: 'Harmonic Octave (Diapason)',
        symbol: '2/1',
        family: 'just-intonation',
        ratioFraction: '2/1',
        ratioDecimal: 2.0,
        cents: 1200.0,
        description: 'Exact frequency doubling; complete acoustic cycle closure.',
        harmonicContext: 'Universal boundary condition of cyclic waveform vibration.',
      },
    ],
  },
  {
    id: 'pythagorean-commas',
    title: 'Pythagorean Tuning & Microtonal Commas',
    shortTitle: 'Pythagorean Commas',
    description: 'Pythagorean intervals generated purely from stacked 3:2 fifths, capturing the sacred geometric comma disparities of antiquity.',
    governingPrinciple: 'Powers of 3 and 2: f = (3^p) / (2^q)',
    intervals: [
      {
        id: 'pyth-comma',
        name: 'Pythagorean Comma (Ditonic)',
        symbol: '531441/524288',
        family: 'pythagorean-commas',
        ratioFraction: '3¹² / 2¹⁹',
        ratioDecimal: 531441 / 524288, // 1.01364326...
        cents: calculateCents(531441 / 524288), // 23.46 cents
        description: 'The ancient disparity between 12 pure fifths (3:2)¹² and 7 pure octaves (2:1)⁷.',
        harmonicContext: 'Crucial microtonal shift: exactly +23.46 cents above unison.',
      },
      {
        id: 'pyth-syntonic',
        name: 'Syntonic Comma (Didymus)',
        symbol: '81/80',
        family: 'pythagorean-commas',
        ratioFraction: '81/80',
        ratioDecimal: 81 / 80, // 1.0125
        cents: calculateCents(81 / 80), // 21.51 cents
        description: 'Discrepancy between 4 Pythagorean fifths (81/64) and a pure just major third (5/4).',
        harmonicContext: 'The fundamental acoustic bridge between 3-limit and 5-limit harmony.',
      },
      {
        id: 'pyth-schisma',
        name: 'Schisma',
        symbol: '32805/32768',
        family: 'pythagorean-commas',
        ratioFraction: '3⁸·5 / 2¹⁵',
        ratioDecimal: 32805 / 32768, // 1.001129
        cents: calculateCents(32805 / 32768), // 1.95 cents
        description: 'Tiny difference between the Pythagorean comma and the syntonic comma.',
        harmonicContext: 'Sub-audible microtonal phasing interval (~1.95 cents).',
      },
      {
        id: 'pyth-diaschisma',
        name: 'Diaschisma',
        symbol: '2048/2025',
        family: 'pythagorean-commas',
        ratioFraction: '2¹¹ / (3⁴·5²)',
        ratioDecimal: 2048 / 2025, // 1.011358
        cents: calculateCents(2048 / 2025), // 19.55 cents
        description: 'Interval between two syntonic commas and a Pythagorean comma.',
        harmonicContext: 'Precision geometric tuning correction.',
      },
      {
        id: 'pyth-limma',
        name: 'Pythagorean Limma (Minor Semitone)',
        symbol: '256/243',
        family: 'pythagorean-commas',
        ratioFraction: '256/243',
        ratioDecimal: 256 / 243, // 1.053498
        cents: calculateCents(256 / 243), // 90.22 cents
        description: 'Diatonic semitone obtained by subtracting two whole tones (9/8)² from a fourth (4/3).',
        harmonicContext: 'Ancient Greek diatonic tetrachord building block.',
      },
      {
        id: 'pyth-apotome',
        name: 'Pythagorean Apotome (Major Semitone)',
        symbol: '2187/2048',
        family: 'pythagorean-commas',
        ratioFraction: '3⁷ / 2¹¹',
        ratioDecimal: 2187 / 2048, // 1.067871
        cents: calculateCents(2187 / 2048), // 113.69 cents
        description: 'Chromatic semitone: difference between whole tone (9/8) and limma (256/243).',
        harmonicContext: 'Apotome minus Limma = Pythagorean Comma.',
      },
      {
        id: 'pyth-ditone',
        name: 'Pythagorean Ditone (Major Third)',
        symbol: '81/64',
        family: 'pythagorean-commas',
        ratioFraction: '81/64',
        ratioDecimal: 81 / 64, // 1.265625
        cents: calculateCents(81 / 64), // 407.82 cents
        description: 'Tuned by stacking four pure fifths (3:2)⁴ / 2²; sharper than just 5/4 third.',
        harmonicContext: 'Bright, penetrating historic Pythagorean harmony.',
      },
      {
        id: 'pyth-tritone',
        name: 'Pythagorean Tritone',
        symbol: '729/512',
        family: 'pythagorean-commas',
        ratioFraction: '3⁶ / 2⁹',
        ratioDecimal: 729 / 512, // 1.423828
        cents: calculateCents(729 / 512), // 611.73 cents
        description: 'Six pure fifths reduced into octave; the apex geometric tritone.',
        harmonicContext: '729 = 9³ (Dragon 9 cubic power).',
      },
      {
        id: 'pyth-fifth',
        name: 'Pythagorean Fifth',
        symbol: '3/2',
        family: 'pythagorean-commas',
        ratioFraction: '3/2',
        ratioDecimal: 1.5,
        cents: calculateCents(1.5),
        description: 'Pure unaltered 3:2 fifth generator.',
        harmonicContext: 'Anchor of Pythagorean scale generation.',
      },
    ],
  },
  {
    id: 'golden-ratio-phi',
    title: '432Hz Golden Ratio (Phi Φ & Fibonacci Series)',
    shortTitle: 'Golden Ratio Φ Series',
    description: 'Acoustic wave expansions based on the Golden Section (Φ ≈ 1.618034) and Fibonacci ratio convergence, creating non-repeating self-similar spirals.',
    governingPrinciple: 'Φ = (1 + √5) / 2 ≈ 1.6180339887... and lim(Fₙ₊₁ / Fₙ)',
    intervals: [
      {
        id: 'phi-neg2',
        name: 'Phi Negative Square (Φ⁻²)',
        symbol: 'Φ⁻²',
        family: 'golden-ratio-phi',
        ratioFraction: '1 / Φ²',
        ratioDecimal: 1 / (PHI * PHI), // ~0.381966
        cents: calculateCents(1 / (PHI * PHI)), // -1666.18 cents
        description: 'Sub-harmonic golden reflection: 432Hz × 0.381966 ≈ 165.01 Hz.',
        harmonicContext: 'Infrasonic golden spiral foundation.',
      },
      {
        id: 'phi-neg1',
        name: 'Phi Golden Reciprocal (Φ⁻¹)',
        symbol: 'Φ⁻¹',
        family: 'golden-ratio-phi',
        ratioFraction: '1 / Φ',
        ratioDecimal: 1 / PHI, // ~0.618034
        cents: calculateCents(1 / PHI), // -833.09 cents
        description: 'The golden cut remainder: 432Hz × 0.618034 ≈ 266.99 Hz.',
        harmonicContext: 'Inward golden ratio standing wave node.',
      },
      {
        id: 'phi-unison',
        name: '432Hz Harmonic Center (Φ⁰)',
        symbol: 'Φ⁰',
        family: 'golden-ratio-phi',
        ratioFraction: '1.0',
        ratioDecimal: 1.0,
        cents: 0.0,
        description: '432Hz Pythagorean natural baseline resonance.',
        harmonicContext: 'Master equilibrium focal point.',
      },
      {
        id: 'phi-pos1',
        name: 'Phi Golden Ratio (Φ¹)',
        symbol: 'Φ¹',
        family: 'golden-ratio-phi',
        ratioFraction: 'Φ',
        ratioDecimal: PHI, // ~1.618034
        cents: calculateCents(PHI), // +833.09 cents
        description: 'Sacred golden proportion: 432Hz × 1.618034 ≈ 698.99 Hz (High F5).',
        harmonicContext: 'Universal spiral growth acoustic expansion.',
      },
      {
        id: 'phi-pos2',
        name: 'Phi Golden Square (Φ²)',
        symbol: 'Φ²',
        family: 'golden-ratio-phi',
        ratioFraction: 'Φ²',
        ratioDecimal: PHI * PHI, // ~2.618034
        cents: calculateCents(PHI * PHI), // +1666.18 cents
        description: 'Double golden expansion: 432Hz × 2.618034 ≈ 1130.99 Hz.',
        harmonicContext: 'Upper crystalline spatial resonance.',
      },
      {
        id: 'fib-5-3',
        name: 'Fibonacci 5:3 Ratio',
        symbol: 'F₅/F₄ (5/3)',
        family: 'golden-ratio-phi',
        ratioFraction: '5/3',
        ratioDecimal: 5 / 3, // 1.666667
        cents: calculateCents(5 / 3),
        description: 'Fibonacci major sixth approximation: 432Hz × (5/3) = 720 Hz.',
        harmonicContext: 'Platonic geometric 720° angle constant.',
      },
      {
        id: 'fib-8-5',
        name: 'Fibonacci 8:5 Ratio',
        symbol: 'F₆/F₅ (8/5)',
        family: 'golden-ratio-phi',
        ratioFraction: '8/5',
        ratioDecimal: 8 / 5, // 1.600
        cents: calculateCents(8 / 5),
        description: 'Fibonacci minor sixth approximation: 432Hz × (8/5) = 691.2 Hz.',
        harmonicContext: 'Pythagorean pentagonal diagonal ratio.',
      },
      {
        id: 'fib-13-8',
        name: 'Fibonacci 13:8 Ratio',
        symbol: 'F₇/F₆ (13/8)',
        family: 'golden-ratio-phi',
        ratioFraction: '13/8',
        ratioDecimal: 13 / 8, // 1.625
        cents: calculateCents(13 / 8),
        description: 'High-order Fibonacci approximation: 432Hz × (13/8) = 702 Hz.',
        harmonicContext: 'Aligns 13-month calendar geometry with 432Hz base.',
      },
      {
        id: 'fib-144-89',
        name: 'Fibonacci 144:89 (Cathie Apex)',
        symbol: 'F₁₂/F₁₁ (144/89)',
        family: 'golden-ratio-phi',
        ratioFraction: '144/89',
        ratioDecimal: 144 / 89, // ~1.6179775
        cents: calculateCents(144 / 89),
        description: '12th Fibonacci number F₁₂ = 144 (Cathie speed-of-light grid harmonic) divided by F₁₁ = 89.',
        harmonicContext: 'Precision convergence on Φ within 0.003% error; 432Hz × (144/89) ≈ 698.97 Hz.',
      },
    ],
  },
  {
    id: 'dragon9-nonary',
    title: 'Dragon 9 Nonary & Bruce Cathie Grid Harmonics',
    shortTitle: 'Dragon 9 Nonary Grid',
    description: 'Intervals calibrated to 9-cycle digital root arithmetic, 54-minute temporal divisions, and Bruce Cathie 144k light-speed harmonics.',
    governingPrinciple: 'Nonary Modulo 9 Arithmetic & 144-unit Grid Proportions',
    intervals: [
      {
        id: 'd9-root-1-9',
        name: 'Nonary Infrasonic Root (1/9)',
        symbol: '1/9',
        family: 'dragon9-nonary',
        ratioFraction: '1/9',
        ratioDecimal: 1 / 9, // 0.111111
        cents: calculateCents(1 / 9),
        description: 'Deep nonary base sub-carrier: 432Hz / 9 = 48.0 Hz.',
        harmonicContext: 'Earth fundamental sub-harmonic grounding.',
      },
      {
        id: 'd9-cathie-144',
        name: 'Bruce Cathie Grid Fundamental (1/3)',
        symbol: '144/432 (1/3)',
        family: 'dragon9-nonary',
        ratioFraction: '1/3',
        ratioDecimal: 1 / 3, // 0.333333
        cents: calculateCents(1 / 3),
        description: 'Harmonic speed of light grid constant: 432Hz × (1/3) = 144.0 Hz.',
        harmonicContext: '144,000 arc-minutes/grid-sec light speed resonance.',
      },
      {
        id: 'd9-moon-216',
        name: 'Lunar Radius Harmonic (1/2)',
        symbol: '216/432 (1/2)',
        family: 'dragon9-nonary',
        ratioFraction: '1/2',
        ratioDecimal: 0.5,
        cents: -1200.0,
        description: 'First sub-octave: 432Hz × (1/2) = 216.0 Hz (2,160 mile Moon diameter harmonic).',
        harmonicContext: 'Dragon 9 physical grounding and sub-octave anchor.',
      },
      {
        id: 'd9-double-cathie-288',
        name: 'Double Cathie Harmonic (2/3)',
        symbol: '288/432 (2/3)',
        family: 'dragon9-nonary',
        ratioFraction: '2/3',
        ratioDecimal: 2 / 3, // 0.666667
        cents: calculateCents(2 / 3),
        description: 'Double light harmonic: 432Hz × (2/3) = 288.0 Hz (144 × 2).',
        harmonicContext: 'Planetary grid pole-to-equator wave propagation.',
      },
      {
        id: 'd9-tetrahedral-576',
        name: 'Tetrahedral Base Harmonic (4/3)',
        symbol: '576/432 (4/3)',
        family: 'dragon9-nonary',
        ratioFraction: '4/3',
        ratioDecimal: 4 / 3, // 1.333333
        cents: calculateCents(4 / 3),
        description: 'Tetrahedral circumscription frequency: 432Hz × (4/3) = 576.0 Hz (144 × 4).',
        harmonicContext: 'Polyhedral grid vertex convergence frequency.',
      },
      {
        id: 'd9-solar-864',
        name: 'Solar Nonary Octave (2/1)',
        symbol: '864/432 (2/1)',
        family: 'dragon9-nonary',
        ratioFraction: '2/1',
        ratioDecimal: 2.0,
        cents: 1200.0,
        description: 'Solar diameter harmonic: 432Hz × 2 = 864.0 Hz (Sun diameter 864,000 miles).',
        harmonicContext: 'Solar octave completion and upper nonary crown.',
      },
      {
        id: 'd9-solfeggio-528',
        name: '528Hz Solfeggio Mirabile Ratio',
        symbol: '528/432 (11/9)',
        family: 'dragon9-nonary',
        ratioFraction: '11/9',
        ratioDecimal: 11 / 9, // 1.222222
        cents: calculateCents(11 / 9),
        description: 'Solfeggio transformation ratio: 432Hz × (11/9) = 528.0 Hz.',
        harmonicContext: 'Golden bridge linking Pythagorean 432Hz and Solfeggio 528Hz.',
      },
    ],
  },
];

export function getIntervalById(id: string): HarmonicInterval | undefined {
  for (const family of HARMONIC_INTERVAL_FAMILIES) {
    const found = family.intervals.find((i) => i.id === id);
    if (found) return found;
  }
  return undefined;
}
