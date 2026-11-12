import { MidiMapping } from '../types/dragon';

export const MIDI_MAPPINGS_STORAGE_KEY = 'dragon9_midi_mappings_v1';
export const MIDI_SETTINGS_STORAGE_KEY = 'dragon9_midi_settings_v1';

export const CATHIE_HARMONIC_GRID_SNAPS = [
  18, 36, 54, 72, 108, 144, 216, 288, 360, 432, 528, 576, 720, 864, 1080, 1440, 2160,
];

export const DEFAULT_MIDI_MAPPINGS: MidiMapping[] = [
  {
    target: 'oscFrequency',
    label: '432Hz Oscillator Frequency',
    description: 'Modulates acoustic oscillator carrier pitch across 108–864 Hz Pythagorean span',
    cc: 1,
    channel: 'all',
    min: 108,
    max: 864,
    step: 1,
    unit: 'Hz',
  },
  {
    target: 'cathieGridVal',
    label: 'Cathie Harmonic Grid (N)',
    description: 'Sweeps Bruce Cathie harmonic reference value in 9-unit nonary increments (18–1440)',
    cc: 74,
    channel: 'all',
    min: 18,
    max: 1440,
    step: 9,
    unit: 'N',
  },
  {
    target: 'oscVolume',
    label: 'Oscillator Output Gain',
    description: 'Hardware fader / knob for master Web Audio oscillator amplitude',
    cc: 7,
    channel: 'all',
    min: 0,
    max: 1,
    step: 0.01,
    unit: '%',
  },
  {
    target: 'polarityAlpha',
    label: 'α / β Polarity Balance',
    description: 'Shifts Two-Pin Polarity Core α Static vs β Reactor equilibrium (0–100%)',
    cc: 10,
    channel: 'all',
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
  },
  {
    target: 'oscToggle',
    label: 'Oscillator Gate (Start / Stop)',
    description: 'Pad / sustain trigger (val ≥ 64) engages or halts the 432Hz audio engine',
    cc: 64,
    channel: 'all',
    min: 0,
    max: 1,
    step: 1,
    unit: 'GATE',
  },
];

export function isWebMidiSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';
}

/**
 * Converts a standard MIDI note number (0–127) into 432Hz Pythagorean concert pitch.
 * Note 69 (A4) = exactly 432.00 Hz.
 */
export function midiNoteTo432Hz(note: number): number {
  const clamped = Math.max(0, Math.min(127, note));
  const freq = 432 * Math.pow(2, (clamped - 69) / 12);
  return Math.round(freq * 10) / 10;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiNoteToName(note: number): string {
  const clamped = Math.max(0, Math.min(127, Math.round(note)));
  const octave = Math.floor(clamped / 12) - 1;
  return `${NOTE_NAMES[clamped % 12]}${octave}`;
}

/**
 * Scales a 7-bit MIDI CC value (0–127) cleanly onto [min, max] with step quantization.
 * Exact 127 maps cleanly to max, 0 maps cleanly to min.
 */
export function mapCcValueToRange(
  ccValue: number,
  min: number,
  max: number,
  step: number = 1
): number {
  const norm = Math.max(0, Math.min(127, ccValue)) / 127;
  const raw = min + norm * (max - min);
  if (step <= 0) return raw;
  const stepped = Math.round((raw - min) / step) * step + min;
  const precision = step < 1 ? 2 : 0;
  return Number(Math.max(min, Math.min(max, stepped)).toFixed(precision));
}

/**
 * Snaps a 7-bit MIDI CC value (0–127) directly onto Bruce Cathie's canonical harmonic constants.
 */
export function mapCcValueToCathieSnap(ccValue: number): number {
  const norm = Math.max(0, Math.min(127, ccValue)) / 127;
  const idx = Math.round(norm * (CATHIE_HARMONIC_GRID_SNAPS.length - 1));
  return CATHIE_HARMONIC_GRID_SNAPS[idx] ?? 144;
}

export interface ParsedMidiPacket {
  type: 'CC' | 'NOTE_ON' | 'NOTE_OFF' | 'PITCH_BEND' | 'OTHER';
  statusByte: number;
  channel: number; // 1..16
  data1: number;
  data2: number;
  pitchBendNormalized: number; // -1..+1 when type === 'PITCH_BEND'
  rawHex: string;
}

export function parseMidiPacket(data: Uint8Array): ParsedMidiPacket {
  const status = data[0] ?? 0;
  const data1 = data[1] ?? 0;
  const data2 = data[2] ?? 0;
  const command = status & 0xf0;
  const channel = (status & 0x0f) + 1;
  const rawHex = Array.from(data.slice(0, 3))
    .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');

  let type: ParsedMidiPacket['type'] = 'OTHER';
  let pitchBendNormalized = 0;

  if (command === 0xb0) {
    type = 'CC';
  } else if (command === 0x90) {
    type = data2 > 0 ? 'NOTE_ON' : 'NOTE_OFF';
  } else if (command === 0x80) {
    type = 'NOTE_OFF';
  } else if (command === 0xe0) {
    type = 'PITCH_BEND';
    const raw14 = ((data2 & 0x7f) << 7) | (data1 & 0x7f);
    pitchBendNormalized = (raw14 - 8192) / 8192;
  }

  return {
    type,
    statusByte: status,
    channel,
    data1,
    data2,
    pitchBendNormalized,
    rawHex,
  };
}
