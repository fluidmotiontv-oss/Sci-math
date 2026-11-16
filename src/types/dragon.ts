export type AppTheme = 'sovereign-dark' | 'high-contrast-cyber' | 'minimalist-lab';

export type ChamberTab = 'audio' | 'cathie' | 'cipher' | 'resonator' | 'nonary' | 'config' | 'guide';

export type OperationalChamber = 
  | 'Command & Control'
  | 'The Central Chamber'
  | 'Action & Propulsion'
  | 'Resource Processing'
  | 'Defense & Environment';

export interface DragonNodeConfig {
  codename: string;
  chamber: OperationalChamber;
  primaryMission: string;
  clockSync: 'Active' | 'Standard UTC Match';
  harmonicBaseFrequency: number; // e.g. 432 or 528
  polarityAlpha: number; // 0-100% Static Reference (Grounding & Stability)
  polarityBeta: number; // 0-100% Dynamic Reactor (Mutation & Adaptability)
  consensusStatus: 'Synchronized' | 'Evaluating' | 'Broadcasting';
  pulseSync?: boolean; // Dynamic 3D mesh rotation oscillation coupled to audio frequency
}

export interface CathieGridResult {
  referenceValue: number;
  lightSpeedKmSec: number;
  lightSpeedHarmonicArcSec: number;
  harmonicSecondRatio: number;
  harmonicSecondsPerDay: number;
  calculatedHarmonicSecond: number;
  gridResonanceRatio: number;
  massEnergyGridUnit: number;
  reciprocalHarmonic: number;
  nonaryDigitalRoot: number;
  planetaryResonances: {
    name: string;
    latitude: string;
    longitude: string;
    harmonicIndex: number;
    description: string;
  }[];
}

export interface VectorCipherResult {
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
  timestamp: string;
}

export interface NonaryClockState {
  solarTime: string;
  utcTime: string;
  dragonHour: number; // 0 to 26.666...
  dragonHourDisplay: string;
  dragonMinute: number; // 0 to 53.999...
  dragonSecond: number; // 0 to 53.999...
  totalMinutes: number;
  currentCycle: 'Cycle Alpha (00:00 - 12:00)' | 'Cycle Beta (12:00 - 24:00)';
  isApexActive: boolean;
  apexWindowName: string;
  timeToNextApexMin: number;
  apexProgressPct: number;
  harmonicSecond: number;
}

export type LogCategory = 
  | 'TAB_SWITCH' 
  | 'CONFIG_CHANGE' 
  | 'CIPHER_GENERATE' 
  | 'AUDIO_SYNTH' 
  | 'GRID_UPDATE' 
  | 'SCENE_SNAPSHOT'
  | 'SYSTEM_EVENT';

export interface SessionLogEntry {
  id: string;
  timestamp: string;
  timeFormatted: string;
  dragonHourDisplay?: string;
  category: LogCategory;
  title: string;
  details: string;
  badge?: string;
  thumbnailDataUrl?: string;
  metadata?: Record<string, any>;
}

export interface LabPreset {
  id: string;
  name: string;
  createdAt: string;
  polarityAlpha: number;
  polarityBeta: number;
  gridValue: number;
  frequency: number;
  codename: string;
  chamber: OperationalChamber;
  baseFrequency: number;
  description?: string;
  pulseSync?: boolean;
}

export interface SubHarmonicLayer {
  id: string;
  name: string;
  divisor: number; // 2 (f/2), 3 (f/3), 4 (f/4), 9 (f/9)
  ratio: number;
  enabled: boolean;
  gain: number;
  title: string;
  description: string;
}

export type MidiTargetId =
  | 'oscFrequency'
  | 'cathieGridVal'
  | 'oscVolume'
  | 'polarityAlpha'
  | 'oscToggle';

export type MidiConnectionStatus =
  | 'unsupported'
  | 'disconnected'
  | 'requesting'
  | 'connected'
  | 'denied'
  | 'error';

export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
  connection: string;
}

export interface MidiMapping {
  target: MidiTargetId;
  label: string;
  description: string;
  cc: number;
  channel: number | 'all';
  min: number;
  max: number;
  step: number;
  unit: string;
}

export interface MidiMessageLog {
  id: string;
  timestamp: string;
  deviceName: string;
  type: 'CC' | 'NOTE_ON' | 'NOTE_OFF' | 'PITCH_BEND' | 'OTHER';
  channel: number;
  data1: number;
  data2: number;
  rawHex: string;
  mappedAction?: string;
}

