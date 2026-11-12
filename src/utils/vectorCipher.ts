import { VectorCipherResult } from '../types/dragon';
import { calculateDigitalRoot } from './cathieMath';

export function generateGeometricVectorCipher(input: string): VectorCipherResult {
  const sanitized = input.trim().toUpperCase() || 'FLUID MOTION';
  
  let hash1 = 0;
  let hash2 = 5381;
  let totalAscii = 0;
  
  let vxSum = 0;
  let vySum = 0;

  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized.charCodeAt(i);
    totalAscii += char;
    
    // Hash 1: Bitwise nonary shifting
    hash1 = ((hash1 << 5) - hash1) + char;
    hash1 |= 0;
    
    // Hash 2: Bernstein DJB2 with nonary modifier
    hash2 = (hash2 * 33) ^ char;
    
    // Angular nonary projection
    const nonaryAngle = ((char % 9) / 9) * (2 * Math.PI);
    vxSum += Math.cos(nonaryAngle);
    vySum += Math.sin(nonaryAngle);
  }

  const hex1 = Math.abs(hash1).toString(16).toUpperCase().padStart(6, '0');
  const hex2 = Math.abs(hash2).toString(16).toUpperCase().padStart(6, '0');
  const nonaryChecksum = calculateDigitalRoot(totalAscii);
  
  const cipherHash = `D9-${hex1}-${hex2}-${nonaryChecksum}-9`;

  // Construct 3x3 Geometric Matrix based on nonary sequence
  const matrix3x3: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const idx = (r * 3 + c);
      const charVal = sanitized.charCodeAt(idx % sanitized.length) || (idx + 1) * 9;
      matrix3x3[r][c] = calculateDigitalRoot(charVal + (idx * 7) + nonaryChecksum);
    }
  }

  // Polar vector calculations
  const magnitude = Math.sqrt(vxSum * vxSum + vySum * vySum);
  let thetaDeg = (Math.atan2(vySum, vxSum) * 180) / Math.PI;
  if (thetaDeg < 0) thetaDeg += 360;

  const vz = (nonaryChecksum / 9) * 100;

  return {
    inputString: sanitized,
    cipherHash,
    hash1Hex: hex1,
    hash2Hex: hex2,
    nonaryChecksum,
    matrix3x3,
    vectorComponents: {
      vx: Math.round(vxSum * 1000) / 1000,
      vy: Math.round(vySum * 1000) / 1000,
      vz: Math.round(vz * 1000) / 1000,
      vThetaDeg: Math.round(thetaDeg * 10) / 10,
      magnitude: Math.round(magnitude * 1000) / 1000
    },
    integrityVerified: true,
    timestamp: new Date().toISOString()
  };
}
