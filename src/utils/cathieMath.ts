import { CathieGridResult } from '../types/dragon';

export function calculateDigitalRoot(n: number): number {
  let num = Math.abs(Math.round(n));
  if (num === 0) return 9;
  const root = num % 9;
  return root === 0 ? 9 : root;
}

export function computeCathieHarmonics(referenceValue: number): CathieGridResult {
  const val = isNaN(referenceValue) || referenceValue <= 0 ? 144 : referenceValue;
  
  // Bruce Cathie Constants
  const lightSpeedKmSec = 299796;
  const lightSpeedHarmonicArcSec = 144000; // Nautical miles / arc minutes per grid second
  
  // Standard solar seconds per day = 86400.
  // Cathie Harmonic seconds per day = 97200 (86400 * 9/8)
  const harmonicSecondRatio = 8 / 9; // 0.88888888...
  const harmonicSecondsPerDay = 97200;
  
  // Harmonic second calculation based on reference grid value
  // val * (1440 / 86400) * lightSpeedHarmonicArcSec
  const calculatedHarmonicSecond = val * (1440 / 86400) * (lightSpeedKmSec / 1000);
  
  // Grid Resonance Ratio relative to 360-degree planetary circumference
  const gridResonanceRatio = (val / 360) * 100;
  
  // Mass-Energy Grid Unit: E = mc^2 scaled by harmonic resonance
  // Harmonic c = 144, c^2 = 20736
  const cHarmonic = 144;
  const massEnergyGridUnit = val * Math.pow(cHarmonic, 2);
  
  // Reciprocal Harmonic
  const reciprocalHarmonic = 1 / val;
  
  // Nonary Digital Root (mod 9 reduction)
  const nonaryDigitalRoot = calculateDigitalRoot(val);
  
  // Key Planetary Grid Resonances
  const planetaryResonances = [
    {
      name: 'Great Pyramid of Giza',
      latitude: '29.9792° N',
      longitude: '31.1342° E',
      harmonicIndex: Math.round(((val * 29.9792) / 360) * 1000) / 1000,
      description: 'Primary geometric terrestrial node. Latitude digits 29.9792 match light speed 299,792 km/s harmonic.'
    },
    {
      name: 'Stonehenge Megalithic Henge',
      latitude: '51.1789° N',
      longitude: '1.8262° W',
      harmonicIndex: Math.round(((val * 51.1789) / 360) * 1000) / 1000,
      description: 'Acoustic-astronomic focal beacon on the 51.18° Cathie harmonic nodal ring.'
    },
    {
      name: 'Bermuda Magnetic Node',
      latitude: '25.0000° N',
      longitude: '71.0000° W',
      harmonicIndex: Math.round(((val * 25.0) / 360) * 1000) / 1000,
      description: 'Hyper-dimensional electromagnetic vortex intersection on the 144 Cathie grid.'
    },
    {
      name: 'Cathie Antipodal Station (Tasman)',
      latitude: '41.2865° S',
      longitude: '174.7762° E',
      harmonicIndex: Math.round(((val * 41.2865) / 360) * 1000) / 1000,
      description: 'Bruce Cathie original tracking epicenter for harmonic aerial wave trajectories.'
    },
    {
      name: 'Mount Kailash Axis Mundi',
      latitude: '31.0674° N',
      longitude: '81.3119° E',
      harmonicIndex: Math.round(((val * 31.0674) / 360) * 1000) / 1000,
      description: 'Central nonary harmonic spire aligning continental energy flux vectors.'
    }
  ];

  return {
    referenceValue: val,
    lightSpeedKmSec,
    lightSpeedHarmonicArcSec,
    harmonicSecondRatio,
    harmonicSecondsPerDay,
    calculatedHarmonicSecond,
    gridResonanceRatio,
    massEnergyGridUnit,
    reciprocalHarmonic,
    nonaryDigitalRoot,
    planetaryResonances
  };
}
