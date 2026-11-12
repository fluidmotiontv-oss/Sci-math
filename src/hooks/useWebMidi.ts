import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MidiConnectionStatus,
  MidiDeviceInfo,
  MidiMapping,
  MidiMessageLog,
  MidiTargetId,
} from '../types/dragon';
import {
  DEFAULT_MIDI_MAPPINGS,
  isWebMidiSupported,
  mapCcValueToCathieSnap,
  mapCcValueToRange,
  MIDI_MAPPINGS_STORAGE_KEY,
  MIDI_SETTINGS_STORAGE_KEY,
  midiNoteTo432Hz,
  midiNoteToName,
  parseMidiPacket,
} from '../utils/webMidi';

export interface MidiBehavioralSettings {
  selectedInputId: string; // 'all' or specific MIDIInput.id
  notePitchEnabled: boolean;
  autoGateOnNote: boolean;
  cathieSnapMode: boolean;
  pitchBendSemitones: number;
}

const DEFAULT_MIDI_SETTINGS: MidiBehavioralSettings = {
  selectedInputId: 'all',
  notePitchEnabled: true,
  autoGateOnNote: false,
  cathieSnapMode: false,
  pitchBendSemitones: 2,
};

function loadInitialMappings(): MidiMapping[] {
  try {
    const raw = localStorage.getItem(MIDI_MAPPINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return DEFAULT_MIDI_MAPPINGS.map((def) => {
          const match = parsed.find((p: Partial<MidiMapping>) => p.target === def.target);
          return match ? { ...def, ...match } : def;
        });
      }
    }
  } catch (err) {
    console.warn('Failed to load MIDI mappings from localStorage:', err);
  }
  return DEFAULT_MIDI_MAPPINGS;
}

function loadInitialSettings(): MidiBehavioralSettings {
  try {
    const raw = localStorage.getItem(MIDI_SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_MIDI_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Failed to load MIDI settings from localStorage:', err);
  }
  return DEFAULT_MIDI_SETTINGS;
}

export interface UseWebMidiHandlers {
  currentFrequency: number;
  isAudioPlaying: boolean;
  onFrequencyChange: (freqHz: number, sourceLabel?: string) => void;
  onCathieGridChange: (gridVal: number, sourceLabel?: string) => void;
  onVolumeChange: (volume: number) => void;
  onPolarityAlphaChange: (alphaPct: number) => void;
  onOscillatorToggle: (playing?: boolean) => void;
  onHardwareEventLog?: (title: string, details: string, metadata?: Record<string, unknown>) => void;
}

export function useWebMidi(handlers: UseWebMidiHandlers) {
  const [status, setStatus] = useState<MidiConnectionStatus>(() =>
    isWebMidiSupported() ? 'disconnected' : 'unsupported'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MidiDeviceInfo[]>([]);
  const [mappings, setMappings] = useState<MidiMapping[]>(loadInitialMappings);
  const [settings, setSettings] = useState<MidiBehavioralSettings>(loadInitialSettings);
  const [learningTarget, setLearningTarget] = useState<MidiTargetId | null>(null);
  const [recentMessages, setRecentMessages] = useState<MidiMessageLog[]>([]);
  const [lastActivityAt, setLastActivityAt] = useState<number>(0);

  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const handlersRef = useRef(handlers);
  const mappingsRef = useRef(mappings);
  const settingsRef = useRef(settings);
  const learningRef = useRef(learningTarget);
  const pitchBendBaseFreqRef = useRef<number>(handlers.currentFrequency);
  const sustainToggleLockRef = useRef<boolean>(false);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    mappingsRef.current = mappings;
    try {
      localStorage.setItem(MIDI_MAPPINGS_STORAGE_KEY, JSON.stringify(mappings));
    } catch {
      // ignore storage quota
    }
  }, [mappings]);

  useEffect(() => {
    settingsRef.current = settings;
    try {
      localStorage.setItem(MIDI_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore storage quota
    }
  }, [settings]);

  useEffect(() => {
    learningRef.current = learningTarget;
  }, [learningTarget]);

  const appendMessageLog = useCallback((entry: MidiMessageLog) => {
    setLastActivityAt(Date.now());
    setRecentMessages((prev) => [entry, ...prev].slice(0, 24));
  }, []);

  const processIncomingBytes = useCallback(
    (rawBytes: Uint8Array, deviceName: string, inputId: string) => {
      const cfg = settingsRef.current;
      if (cfg.selectedInputId !== 'all' && inputId !== cfg.selectedInputId && inputId !== 'virtual-sim') {
        return;
      }

      const packet = parseMidiPacket(rawBytes);
      let mappedAction: string | undefined;

      // 1. Handle MIDI Learn interception on CC packets
      if (packet.type === 'CC' && learningRef.current) {
        const target = learningRef.current;
        setMappings((prev) =>
          prev.map((m) => (m.target === target ? { ...m, cc: packet.data1 } : m))
        );
        setLearningTarget(null);
        mappedAction = `LEARNED CC ${packet.data1} → ${target}`;
        handlersRef.current.onHardwareEventLog?.(
          `MIDI Learn Mapped CC ${packet.data1}`,
          `Bound external hardware controller "${deviceName}" CC #${packet.data1} (Ch ${packet.channel}) to ${target}.`,
          { deviceName, cc: packet.data1, channel: packet.channel, target }
        );
      }

      // 2. Route Control Change (CC) to mapped Dragon 9 parameters
      if (packet.type === 'CC') {
        const matched = mappingsRef.current.filter(
          (m) => m.cc === packet.data1 && (m.channel === 'all' || m.channel === packet.channel)
        );

        for (const mapping of matched) {
          if (mapping.target === 'oscFrequency') {
            const hz = mapCcValueToRange(packet.data2, mapping.min, mapping.max, mapping.step);
            pitchBendBaseFreqRef.current = hz;
            handlersRef.current.onFrequencyChange(hz, `${deviceName} CC${packet.data1}`);
            mappedAction = `Oscillator → ${hz} Hz`;
          } else if (mapping.target === 'cathieGridVal') {
            const gridVal = cfg.cathieSnapMode
              ? mapCcValueToCathieSnap(packet.data2)
              : mapCcValueToRange(packet.data2, mapping.min, mapping.max, mapping.step);
            handlersRef.current.onCathieGridChange(gridVal, `${deviceName} CC${packet.data1}`);
            mappedAction = `Cathie Grid N = ${gridVal}`;
          } else if (mapping.target === 'oscVolume') {
            const vol = mapCcValueToRange(packet.data2, mapping.min, mapping.max, mapping.step);
            handlersRef.current.onVolumeChange(vol);
            mappedAction = `Gain → ${Math.round(vol * 100)}%`;
          } else if (mapping.target === 'polarityAlpha') {
            const alpha = mapCcValueToRange(packet.data2, mapping.min, mapping.max, mapping.step);
            handlersRef.current.onPolarityAlphaChange(alpha);
            mappedAction = `Polarity α ${alpha}% / β ${100 - alpha}%`;
          } else if (mapping.target === 'oscToggle') {
            if (packet.data2 >= 64 && !sustainToggleLockRef.current) {
              sustainToggleLockRef.current = true;
              handlersRef.current.onOscillatorToggle();
              mappedAction = handlersRef.current.isAudioPlaying ? 'Oscillator → STOP' : 'Oscillator → START';
            } else if (packet.data2 < 64) {
              sustainToggleLockRef.current = false;
              mappedAction = 'Gate Released';
            }
          }
        }
      } else if (packet.type === 'NOTE_ON' && cfg.notePitchEnabled) {
        const hz = midiNoteTo432Hz(packet.data1);
        const noteLabel = midiNoteToName(packet.data1);
        pitchBendBaseFreqRef.current = hz;
        handlersRef.current.onFrequencyChange(hz, `${deviceName} ${noteLabel}`);
        if (cfg.autoGateOnNote && !handlersRef.current.isAudioPlaying) {
          handlersRef.current.onOscillatorToggle(true);
        }
        mappedAction = `Note ${noteLabel} → ${hz} Hz (432Hz tuned)`;
      } else if (packet.type === 'NOTE_OFF' && cfg.notePitchEnabled && cfg.autoGateOnNote) {
        if (handlersRef.current.isAudioPlaying) {
          handlersRef.current.onOscillatorToggle(false);
        }
        mappedAction = `Note Off (${midiNoteToName(packet.data1)}) → Gate Off`;
      } else if (packet.type === 'PITCH_BEND') {
        const base = pitchBendBaseFreqRef.current || handlersRef.current.currentFrequency || 432;
        const bent = Math.round(
          base * Math.pow(2, (packet.pitchBendNormalized * cfg.pitchBendSemitones) / 12) * 10
        ) / 10;
        const clamped = Math.max(20, Math.min(2000, bent));
        handlersRef.current.onFrequencyChange(clamped, `${deviceName} PitchBend`);
        mappedAction = `Pitch Bend → ${clamped} Hz`;
      }

      appendMessageLog({
        id: `midi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        deviceName,
        type: packet.type,
        channel: packet.channel,
        data1: packet.data1,
        data2: packet.data2,
        rawHex: packet.rawHex,
        mappedAction,
      });
    },
    [appendMessageLog]
  );

  const syncInputsFromAccess = useCallback(
    (access: MIDIAccess) => {
      const nextDevices: MidiDeviceInfo[] = [];
      access.inputs.forEach((input) => {
        nextDevices.push({
          id: input.id,
          name: input.name || 'Unnamed MIDI Controller',
          manufacturer: input.manufacturer || 'Generic Hardware',
          state: input.state,
          connection: input.connection,
        });

        input.onmidimessage = (ev: MIDIMessageEvent) => {
          if (ev.data) {
            processIncomingBytes(ev.data, input.name || 'MIDI Controller', input.id);
          }
        };
      });

      setDevices(nextDevices);
      setStatus('connected');
      setErrorMessage(null);
    },
    [processIncomingBytes]
  );

  const connectMidi = useCallback(async () => {
    if (!isWebMidiSupported()) {
      setStatus('unsupported');
      setErrorMessage('Web MIDI API is not supported in this browser environment (try Chromium / Chrome / Edge).');
      return false;
    }

    setStatus('requesting');
    setErrorMessage(null);

    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      midiAccessRef.current = access;
      syncInputsFromAccess(access);

      access.onstatechange = () => {
        syncInputsFromAccess(access);
      };

      const inputNames = Array.from(access.inputs.values()).map((i) => i.name || 'Unknown Device');
      handlersRef.current.onHardwareEventLog?.(
        'Web MIDI Hardware Bridge Connected',
        inputNames.length > 0
          ? `Connected to ${inputNames.length} MIDI input device(s): ${inputNames.join(', ')}.`
          : 'Web MIDI permission granted. Listening for external hardware controller plug-in.',
        { deviceCount: inputNames.length, devices: inputNames }
      );
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'MIDI permission denied or unavailable.';
      const isDenied = /denied|permission|security/i.test(msg);
      setStatus(isDenied ? 'denied' : 'error');
      setErrorMessage(msg);
      return false;
    }
  }, [syncInputsFromAccess]);

  // Soft-probe permissions on mount so previously authorized controllers auto-connect seamlessly
  useEffect(() => {
    if (!isWebMidiSupported()) return;

    let cancelled = false;
    const probePermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const perm = await navigator.permissions.query({
            name: 'midi' as PermissionName,
          });
          if (!cancelled && perm.state === 'granted') {
            await connectMidi();
          }
        }
      } catch {
        // Fallback silently; user can click Connect MIDI Hardware explicitly
      }
    };
    probePermission();

    return () => {
      cancelled = true;
      if (midiAccessRef.current) {
        midiAccessRef.current.inputs.forEach((input) => {
          input.onmidimessage = null;
        });
        midiAccessRef.current.onstatechange = null;
      }
    };
  }, [connectMidi]);

  const updateMapping = useCallback(
    (target: MidiTargetId, patch: Partial<Pick<MidiMapping, 'cc' | 'channel' | 'min' | 'max' | 'step'>>) => {
      setMappings((prev) => prev.map((m) => (m.target === target ? { ...m, ...patch } : m)));
    },
    []
  );

  const resetMappings = useCallback(() => {
    setMappings(DEFAULT_MIDI_MAPPINGS);
    setLearningTarget(null);
  }, []);

  const updateSettings = useCallback((patch: Partial<MidiBehavioralSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const simulateMidiPacket = useCallback(
    (bytes: [number, number, number], deviceName = 'Virtual Hardware Controller') => {
      processIncomingBytes(new Uint8Array(bytes), deviceName, 'virtual-sim');
    },
    [processIncomingBytes]
  );

  return {
    status,
    errorMessage,
    devices,
    mappings,
    settings,
    learningTarget,
    recentMessages,
    lastActivityAt,
    connectMidi,
    updateMapping,
    resetMappings,
    updateSettings,
    startLearn: (target: MidiTargetId) => setLearningTarget(target),
    cancelLearn: () => setLearningTarget(null),
    clearMessages: () => setRecentMessages([]),
    simulateMidiPacket,
  };
}
