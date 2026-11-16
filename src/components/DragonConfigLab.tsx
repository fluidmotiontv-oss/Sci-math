import React, { useState } from 'react';
import { DragonNodeConfig, OperationalChamber, NonaryClockState, ChamberTab, AppTheme, SessionLogEntry, LogCategory, LabPreset } from '../types/dragon';
import { computeCathieHarmonics } from '../utils/cathieMath';
import { generateGeometricVectorCipher } from '../utils/vectorCipher';
import { Shield, Cpu, Terminal, Copy, Check, Sliders, PlayCircle, Network, Download, FileJson, CheckCircle2, BookmarkPlus, RotateCcw, Trash2, Sparkles, Bookmark, Zap, Share2, Upload, FileCode, CheckCheck, Box, Film } from 'lucide-react';

import { SessionLogView } from './SessionLogView';
import { CathieCoordinatesCrossReference } from './CathieCoordinatesCrossReference';
import { D3CircularWaveVisualizer } from './D3CircularWaveVisualizer';

const PRESETS_STORAGE_KEY = 'dragon9_saved_presets';

const defaultPresets: LabPreset[] = [
  {
    id: 'preset_default_1',
    name: '432Hz Pythagorean Homeostasis',
    createdAt: '2026-11-09T01:00:00.000Z',
    polarityAlpha: 82,
    polarityBeta: 64,
    gridValue: 144,
    frequency: 432,
    codename: 'Aether-Viper-9',
    chamber: 'Command & Control',
    baseFrequency: 432,
    pulseSync: true,
    description: 'Pythagorean acoustic grounding, 144k arc-min grid resonance & balanced homeostasis.',
  },
  {
    id: 'preset_default_2',
    name: 'Bruce Cathie Geodesic Apex',
    createdAt: '2026-11-09T01:15:00.000Z',
    polarityAlpha: 95,
    polarityBeta: 42,
    gridValue: 216,
    frequency: 144,
    codename: 'Cathie-Grid-Node',
    chamber: 'Resource Processing',
    baseFrequency: 144,
    pulseSync: false,
    description: 'High grounding static lattice for planetary geodetic light-speed calculations.',
  },
  {
    id: 'preset_default_3',
    name: 'Dynamic Solfeggio Reactor',
    createdAt: '2026-11-09T01:30:00.000Z',
    polarityAlpha: 50,
    polarityBeta: 90,
    gridValue: 528,
    frequency: 528,
    codename: 'Solfeggio-Igniter',
    chamber: 'Action & Propulsion',
    baseFrequency: 528,
    pulseSync: true,
    description: 'High Beta mutation potential paired with 528Hz Solfeggio DNA repair frequency.',
  },
];

const getInitialPresets = (): LabPreset[] => {
  try {
    const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse presets from localStorage', e);
  }
  return defaultPresets;
};

interface DragonConfigLabProps {
  config: DragonNodeConfig;
  onConfigChange: (newConfig: DragonNodeConfig) => void;
  timeState?: NonaryClockState;
  isAudioPlaying?: boolean;
  frequency?: number;
  onAudioFrequencyChange?: (freq: number) => void;
  cathieGridVal?: number;
  onGridValueChange?: (val: number) => void;
  lastCipherHash?: string;
  visitedChambers?: ChamberTab[];
  logs?: SessionLogEntry[];
  onClearLogs?: () => void;
  onAddTestEntry?: () => void;
  onLogEvent?: (category: LogCategory, title: string, details: string, metadata?: Record<string, any>) => void;
  onOpenExport3D?: () => void;
  onOpenVideoStudio?: () => void;
  onResetConfig?: () => void;
  isConfigRestored?: boolean;
  theme?: AppTheme;
}

export const DragonConfigLab: React.FC<DragonConfigLabProps> = ({
  config,
  onConfigChange,
  timeState,
  isAudioPlaying = false,
  frequency = 432,
  onAudioFrequencyChange,
  cathieGridVal = 144,
  onGridValueChange,
  lastCipherHash = 'D9-00B291-B84976-9-9',
  visitedChambers = ['audio', 'cathie', 'cipher', 'nonary', 'config'],
  logs = [],
  onClearLogs = () => {},
  onAddTestEntry,
  onLogEvent,
  onOpenExport3D,
  onOpenVideoStudio,
  onResetConfig,
  isConfigRestored = false,
  theme = 'sovereign-dark',
}) => {
  const [activeScriptTab, setActiveScriptTab] = useState<'bash' | 'python' | 'pm2' | 'telemetry'>('bash');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [isSimulatingConsensus, setIsSimulatingConsensus] = useState<boolean>(false);
  const [consensusLog, setConsensusLog] = useState<string | null>(null);

  // Saved Presets State
  const [presets, setPresets] = useState<LabPreset[]>(getInitialPresets);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [presetToast, setPresetToast] = useState<string | null>(null);

  // Export & Import Presets State
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportScope, setExportScope] = useState<'all-presets' | 'active-config'>('all-presets');
  const [exportFormat, setExportFormat] = useState<'json' | 'compact' | 'base64'>('json');
  const [copiedExport, setCopiedExport] = useState<boolean>(false);
  const [copiedPresetId, setCopiedPresetId] = useState<string | null>(null);
  const [importInput, setImportInput] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Safe clipboard helper with fallback for iframe / browser security restrictions
  const safeCopyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn('Navigator clipboard error, trying fallback', err);
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Safe copy fallback failed', err);
      return false;
    }
  };

  // Generate serialized configuration string based on current scope & format
  const generateExportString = (
    scope: 'all-presets' | 'active-config' | 'single-preset' = exportScope,
    format: 'json' | 'compact' | 'base64' = exportFormat,
    targetPreset?: LabPreset
  ): string => {
    let payload: Record<string, any>;

    if (scope === 'single-preset' && targetPreset) {
      payload = {
        protocol: 'Dragon 9 Sovereign Protocol',
        packageType: 'SINGLE_PRESET',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        preset: targetPreset,
      };
    } else if (scope === 'active-config') {
      payload = {
        protocol: 'Dragon 9 Sovereign Protocol',
        packageType: 'ACTIVE_LAB_STATE',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        configuration: {
          codename: config.codename,
          chamber: config.chamber,
          primaryMission: config.primaryMission,
          clockSync: config.clockSync,
          harmonicBaseFrequency: config.harmonicBaseFrequency,
          polarityAlpha: config.polarityAlpha,
          polarityBeta: config.polarityBeta,
          pulseSync: config.pulseSync ?? false,
        },
        coupledParameters: {
          frequency: frequency,
          cathieGridVal: cathieGridVal,
        },
        homeostasisRatio: (config.polarityAlpha / Math.max(1, config.polarityBeta)).toFixed(2),
      };
    } else {
      // 'all-presets'
      payload = {
        protocol: 'Dragon 9 Sovereign Protocol',
        packageType: 'PRESETS_COLLECTION',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        activeSetup: {
          codename: config.codename,
          chamber: config.chamber,
          polarityAlpha: config.polarityAlpha,
          polarityBeta: config.polarityBeta,
          harmonicBaseFrequency: config.harmonicBaseFrequency,
          pulseSync: config.pulseSync ?? false,
          frequency: frequency,
          cathieGridVal: cathieGridVal,
        },
        presets: presets,
        totalPresets: presets.length,
        checksum: `D9-EXPORT-${Date.now().toString(36).toUpperCase()}`,
      };
    }

    if (format === 'compact') {
      return JSON.stringify(payload);
    } else if (format === 'base64') {
      try {
        const jsonStr = JSON.stringify(payload);
        return `D9CFG:${btoa(encodeURIComponent(jsonStr))}`;
      } catch (e) {
        return JSON.stringify(payload);
      }
    }
    return JSON.stringify(payload, null, 2);
  };

  // 1-Click Export Presets to Clipboard
  const handleExportPresetsToClipboard = async () => {
    const configString = generateExportString(exportScope, exportFormat);
    const ok = await safeCopyToClipboard(configString);
    if (ok) {
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2500);

      const msg = exportScope === 'active-config'
        ? 'Active configuration string copied to clipboard!'
        : `Configuration string with ${presets.length} presets copied to clipboard!`;
      setPresetToast(msg);
      setTimeout(() => setPresetToast(null), 3500);

      if (onLogEvent) {
        onLogEvent(
          'CONFIG_CHANGE',
          'Export Presets: Configuration String Copied',
          `Copied ${exportScope === 'active-config' ? 'active node setup' : `${presets.length} presets`} configuration string to clipboard (${configString.length} chars, format: ${exportFormat.toUpperCase()}). Ready to backup or share outside local storage.`,
          {
            scope: exportScope,
            format: exportFormat,
            stringLength: configString.length,
            presetsCount: presets.length,
            activeCodename: config.codename,
          }
        );
      }
    }
  };

  // Export individual preset to clipboard
  const handleExportSinglePreset = async (preset: LabPreset) => {
    const presetStr = generateExportString('single-preset', 'json', preset);
    const ok = await safeCopyToClipboard(presetStr);
    if (ok) {
      setCopiedPresetId(preset.id);
      setTimeout(() => setCopiedPresetId(null), 2000);
      setPresetToast(`Preset "${preset.name}" copied to clipboard!`);
      setTimeout(() => setPresetToast(null), 3000);

      if (onLogEvent) {
        onLogEvent(
          'CONFIG_CHANGE',
          `Preset String Copied: "${preset.name}"`,
          `Copied configuration string for preset "${preset.name}" (α=${preset.polarityAlpha}%, β=${preset.polarityBeta}%, N=${preset.gridValue}, ${preset.frequency}Hz) to clipboard.`,
          { presetId: preset.id, presetName: preset.name }
        );
      }
    }
  };

  // Import configuration string
  const handleImportConfiguration = () => {
    setImportError(null);
    setImportSuccess(null);

    const raw = importInput.trim();
    if (!raw) {
      setImportError('Please paste a configuration string or token to import.');
      return;
    }

    try {
      let parsed: any;
      if (raw.startsWith('D9CFG:')) {
        const decoded = decodeURIComponent(atob(raw.slice(6)));
        parsed = JSON.parse(decoded);
      } else {
        parsed = JSON.parse(raw);
      }

      let importedPresetsCount = 0;
      let appliedConfig = false;

      // Case 1: PRESETS_COLLECTION
      if (Array.isArray(parsed.presets)) {
        const newPresetsList: LabPreset[] = [...presets];
        parsed.presets.forEach((p: any) => {
          if (p.name && typeof p.polarityAlpha === 'number') {
            const exists = newPresetsList.some((existing) => existing.id === p.id || existing.name === p.name);
            if (!exists) {
              newPresetsList.push({
                ...p,
                id: p.id || `preset_imported_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              });
              importedPresetsCount++;
            }
          }
        });

        if (importedPresetsCount > 0) {
          setPresets(newPresetsList);
          try {
            localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(newPresetsList));
          } catch (e) {
            console.error('Failed to save imported presets to localStorage', e);
          }
        }

        // Apply activeSetup if present
        if (parsed.activeSetup) {
          const s = parsed.activeSetup;
          onConfigChange({
            ...config,
            codename: s.codename || config.codename,
            chamber: s.chamber || config.chamber,
            polarityAlpha: typeof s.polarityAlpha === 'number' ? s.polarityAlpha : config.polarityAlpha,
            polarityBeta: typeof s.polarityBeta === 'number' ? s.polarityBeta : config.polarityBeta,
            harmonicBaseFrequency: s.harmonicBaseFrequency || config.harmonicBaseFrequency,
            pulseSync: s.pulseSync ?? config.pulseSync ?? false,
          });
          if (typeof s.cathieGridVal === 'number' && onGridValueChange) {
            onGridValueChange(s.cathieGridVal);
          }
          if (typeof s.frequency === 'number' && onAudioFrequencyChange) {
            onAudioFrequencyChange(s.frequency);
          }
          appliedConfig = true;
        }
      } else if (parsed.preset) {
        // Case 2: SINGLE_PRESET
        handleLoadPreset(parsed.preset);
        const exists = presets.some((p) => p.id === parsed.preset.id || p.name === parsed.preset.name);
        if (!exists) {
          const updated = [parsed.preset, ...presets];
          setPresets(updated);
          localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
          importedPresetsCount = 1;
        }
        appliedConfig = true;
      } else if (parsed.configuration) {
        // Case 3: ACTIVE_LAB_STATE
        const c = parsed.configuration;
        onConfigChange({
          ...config,
          codename: c.codename || config.codename,
          chamber: c.chamber || config.chamber,
          primaryMission: c.primaryMission || config.primaryMission,
          clockSync: c.clockSync || config.clockSync,
          polarityAlpha: typeof c.polarityAlpha === 'number' ? c.polarityAlpha : config.polarityAlpha,
          polarityBeta: typeof c.polarityBeta === 'number' ? c.polarityBeta : config.polarityBeta,
          harmonicBaseFrequency: c.harmonicBaseFrequency || config.harmonicBaseFrequency,
          pulseSync: c.pulseSync ?? config.pulseSync ?? false,
        });
        if (parsed.coupledParameters) {
          if (typeof parsed.coupledParameters.frequency === 'number' && onAudioFrequencyChange) {
            onAudioFrequencyChange(parsed.coupledParameters.frequency);
          }
          if (typeof parsed.coupledParameters.cathieGridVal === 'number' && onGridValueChange) {
            onGridValueChange(parsed.coupledParameters.cathieGridVal);
          }
        }
        appliedConfig = true;
      } else if (typeof parsed.polarityAlpha === 'number') {
        // Fallback: direct preset or config object
        handleLoadPreset(parsed as LabPreset);
        appliedConfig = true;
      } else {
        setImportError('Unrecognized configuration structure. Please check the JSON format.');
        return;
      }

      setImportSuccess(`Successfully imported! ${importedPresetsCount > 0 ? `Added ${importedPresetsCount} preset(s). ` : ''}${appliedConfig ? 'Applied active laboratory parameters.' : ''}`);
      setImportInput('');
      setTimeout(() => setImportSuccess(null), 4000);

      if (onLogEvent) {
        onLogEvent(
          'CONFIG_CHANGE',
          'Configuration String Imported',
          `Restored external configuration. Imported presets: ${importedPresetsCount}. Applied active setup: ${appliedConfig ? 'YES' : 'NO'}.`,
          { importedPresetsCount, appliedConfig }
        );
      }
    } catch (err: any) {
      setImportError(`Invalid configuration string: ${err?.message || 'JSON parse error'}`);
    }
  };

  const handleSaveCurrentPreset = () => {
    const nameToSave = newPresetName.trim() || `Preset ${config.codename} (${frequency}Hz)`;
    const newPreset: LabPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: nameToSave,
      createdAt: new Date().toISOString(),
      polarityAlpha: config.polarityAlpha,
      polarityBeta: config.polarityBeta,
      gridValue: cathieGridVal,
      frequency: frequency,
      codename: config.codename,
      chamber: config.chamber,
      baseFrequency: config.harmonicBaseFrequency,
      pulseSync: config.pulseSync ?? false,
      description: `Saved state: α=${config.polarityAlpha}%, β=${config.polarityBeta}%, N=${cathieGridVal}, ${frequency}Hz, PulseSync: ${config.pulseSync ? 'ON' : 'OFF'}.`,
    };

    const updatedPresets = [newPreset, ...presets];
    setPresets(updatedPresets);
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
    } catch (e) {
      console.error('Failed to save preset to localStorage', e);
    }

    setNewPresetName('');
    setPresetToast(`Preset "${nameToSave}" saved to local storage!`);
    setTimeout(() => setPresetToast(null), 3000);

    if (onLogEvent) {
      onLogEvent(
        'CONFIG_CHANGE',
        `Preset Saved: "${nameToSave}"`,
        `Captured state: α=${config.polarityAlpha}%, β=${config.polarityBeta}%, Cathie Grid N=${cathieGridVal}, Synth=${frequency}Hz, PulseSync=${config.pulseSync ? 'ON' : 'OFF'}.`,
        { name: nameToSave, alpha: config.polarityAlpha, beta: config.polarityBeta, gridVal: cathieGridVal, frequency, pulseSync: config.pulseSync }
      );
    }
  };

  const handleLoadPreset = (preset: LabPreset) => {
    onConfigChange({
      ...config,
      codename: preset.codename || config.codename,
      chamber: preset.chamber || config.chamber,
      polarityAlpha: preset.polarityAlpha,
      polarityBeta: preset.polarityBeta,
      harmonicBaseFrequency: preset.baseFrequency || preset.frequency || config.harmonicBaseFrequency,
      pulseSync: preset.pulseSync ?? config.pulseSync ?? false,
    });

    if (onGridValueChange) {
      onGridValueChange(preset.gridValue);
    }

    if (onAudioFrequencyChange) {
      onAudioFrequencyChange(preset.frequency);
    }

    setPresetToast(`Restored preset "${preset.name}".`);
    setTimeout(() => setPresetToast(null), 3000);

    if (onLogEvent) {
      onLogEvent(
        'CONFIG_CHANGE',
        `Preset Loaded: "${preset.name}"`,
        `Restored parameters: α=${preset.polarityAlpha}%, β=${preset.polarityBeta}%, Grid N=${preset.gridValue}, Freq=${preset.frequency}Hz, PulseSync=${preset.pulseSync ? 'ON' : 'OFF'}.`,
        { presetId: preset.id, name: preset.name, pulseSync: preset.pulseSync }
      );
    }
  };

  const handleDeletePreset = (id: string, name: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update presets in localStorage', e);
    }

    setPresetToast(`Deleted preset "${name}".`);
    setTimeout(() => setPresetToast(null), 3000);

    if (onLogEvent) {
      onLogEvent(
        'CONFIG_CHANGE',
        `Preset Deleted: "${name}"`,
        `Removed preset from Sovereign Node Protocol registry.`
      );
    }
  };

  const chambers: OperationalChamber[] = [
    'Command & Control',
    'The Central Chamber',
    'Action & Propulsion',
    'Resource Processing',
    'Defense & Environment',
  ];

  const updateField = <K extends keyof DragonNodeConfig>(key: K, value: DragonNodeConfig[K]) => {
    onConfigChange({
      ...config,
      [key]: value,
    });
    if (onLogEvent) {
      onLogEvent(
        'CONFIG_CHANGE',
        `Node Spec Updated: ${String(key)}`,
        `Set parameter "${String(key)}" to ${typeof value === 'object' ? JSON.stringify(value) : value}.`,
        { field: key, value }
      );
    }
  };

  const handleDownloadLabReport = () => {
    const cathieResult = computeCathieHarmonics(cathieGridVal);
    const cipherResult = generateGeometricVectorCipher(lastCipherHash ? 'SOVEREIGN MESH' : 'FLUID MOTION');

    const labReport = {
      reportTitle: 'Dragon 9 Sovereign Lab Session Report',
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      nodeSpecification: {
        codename: config.codename,
        chamber: config.chamber,
        primaryMission: config.primaryMission,
        clockSync: config.clockSync,
        harmonicBaseFrequencyHz: config.harmonicBaseFrequency,
        consensusStatus: config.consensusStatus,
        pulseSync: config.pulseSync ?? false,
      },
      polarityHomeostasis: {
        staticReferenceAlphaPct: config.polarityAlpha,
        dynamicReactorBetaPct: config.polarityBeta,
        homeostasisRatio: (config.polarityAlpha / Math.max(1, config.polarityBeta)).toFixed(2),
      },
      laboratories: {
        audioSynthesizer: {
          status: isAudioPlaying ? 'OSCILLATING' : 'STANDBY',
          isPlaying: isAudioPlaying,
          frequencyHz: frequency,
          tuningReference: '432 Hz Pythagorean Harmonic',
        },
        cathieHarmonicGrid: {
          referenceGridValue: cathieGridVal,
          geometricLightSpeedKmSec: cathieResult.lightSpeedKmSec,
          lightSpeedHarmonicArcSec: cathieResult.lightSpeedHarmonicArcSec,
          calculatedHarmonicSecond: cathieResult.calculatedHarmonicSecond,
          gridResonanceRatioPct: cathieResult.gridResonanceRatio,
          massEnergyGridUnit: cathieResult.massEnergyGridUnit,
          nonaryDigitalRoot: cathieResult.nonaryDigitalRoot,
          planetaryResonances: cathieResult.planetaryResonances.map((p) => ({
            name: p.name,
            latitude: p.latitude,
            longitude: p.longitude,
            harmonicIndex: p.harmonicIndex,
          })),
        },
        vectorCipher: {
          lastCipherHash: lastCipherHash || cipherResult.cipherHash,
          vectorComponents: cipherResult.vectorComponents,
          nonaryChecksum: cipherResult.nonaryChecksum,
          matrix3x3: cipherResult.matrix3x3,
        },
        nonaryTemporalClock: timeState
          ? {
              solarTime: timeState.solarTime,
              utcTime: timeState.utcTime,
              dragonHour: timeState.dragonHour,
              dragonHourDisplay: timeState.dragonHourDisplay,
              currentCycle: timeState.currentCycle,
              isApexActive: timeState.isApexActive,
              apexWindowName: timeState.apexWindowName,
              timeToNextApexMin: timeState.timeToNextApexMin,
              harmonicSecond: timeState.harmonicSecond,
            }
          : {
              solarTime: new Date().toLocaleTimeString(),
              dragonHourDisplay: 'D9·00:00:00',
              currentCycle: 'Cycle Alpha (00:00 - 12:00)',
              isApexActive: false,
            },
      },
      sessionTelemetry: {
        visitedChambers: visitedChambers,
      },
    };

    const jsonString = JSON.stringify(labReport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `dragon9-lab-report-${config.codename.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.json`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleSimulateConsensus = () => {
    setIsSimulatingConsensus(true);
    setConsensusLog('Initiating Two-Pin Polarity Homeostasis handshake...');
    
    setTimeout(() => {
      setConsensusLog((prev) => `${prev}\n[ALPHA-STATIC]: Grounding reference locked at ${config.polarityAlpha}%.`);
    }, 400);

    setTimeout(() => {
      setConsensusLog((prev) => `${prev}\n[BETA-REACTOR]: Dynamic mutation potential calibrated at ${config.polarityBeta}%.`);
    }, 800);

    setTimeout(() => {
      setConsensusLog((prev) => `${prev}\n[NONARY-CLOCK]: Synchronized to 54-minute hour cycle. Base: ${config.harmonicBaseFrequency}Hz.`);
    }, 1200);

    setTimeout(() => {
      setConsensusLog((prev) => `${prev}\n[CONSENSUS]: Master Mesh consensus verified. Signature: D9-SIG-${Math.floor(Math.random() * 899999 + 100000)}.`);
      setIsSimulatingConsensus(false);
      updateField('consensusStatus', 'Synchronized');
    }, 1600);
  };

  // Generate actionable scripts
  const bashScript = `#!/usr/bin/env bash
# ==============================================================================
# TARGET ENGINE: Cyber Dragon Genesis / FluidmotionTV Sovereign Mesh
# NODE CODENAME: ${config.codename}
# CHAMBER: ${config.chamber}
# RUNTIME ENVIRONMENT: antiX Linux / Termux Android Sandbox
# ==============================================================================

set -euo pipefail

echo "[*] Initializing Cyber Dragon Node: ${config.codename}"
echo "[*] Operational Chamber: ${config.chamber}"
echo "[*] Harmonic Base: ${config.harmonicBaseFrequency} Hz"

# Update package tree & install core dependencies
if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y && sudo apt-get install -y ffmpeg wireguard-tools nodejs npm python3
elif command -v pkg >/dev/null 2>&1; then
    # Termux environment
    pkg update -y && pkg install -y ffmpeg wireguard-tools nodejs python
fi

# Configure Two-Pin Polarity parameters in environment
export DRAGON_NODE_NAME="${config.codename}"
export DRAGON_CHAMBER="${config.chamber}"
export DRAGON_POLARITY_ALPHA="${config.polarityAlpha}"
export DRAGON_POLARITY_BETA="${config.polarityBeta}"
export DRAGON_BASE_FREQ="${config.harmonicBaseFrequency}"
export DRAGON_CLOCK_SYNC="${config.clockSync}"

# Launch mission process
echo "[+] Starting Subsystem: ${config.primaryMission}..."
node -e '
console.log("Sovereign mesh node active. Listening for Nonary temporal clock ticks...");
setInterval(() => {
    const mins = (new Date().getMinutes() + (new Date().getSeconds()/60)) % 54;
    console.log("[TICK] Dragon 9 Minute:", mins.toFixed(2), "/ 54 | Polarity Alpha:", process.env.DRAGON_POLARITY_ALPHA);
}, 60000);
'
`;

  const pythonScript = `#!/usr/bin/env python3
"""
Cyber Dragon Genesis - Sovereign Mesh Node Daemon
Codename: ${config.codename} | Chamber: ${config.chamber}
Harmonic Base: ${config.harmonicBaseFrequency}Hz | Polarity: α=${config.polarityAlpha}%, β=${config.polarityBeta}%
"""

import time
import math
import json
import sys

CONFIG = {
    "node_id": "${config.codename}",
    "chamber": "${config.chamber}",
    "mission": "${config.primaryMission}",
    "polarity": {
        "alpha_static": ${config.polarityAlpha},
        "beta_reactor": ${config.polarityBeta}
    },
    "base_frequency": ${config.harmonicBaseFrequency},
    "clock_sync": "${config.clockSync}"
}

def get_nonary_hour():
    t = time.localtime()
    total_minutes = t.tm_hour * 60 + t.tm_min + t.tm_sec / 60.0
    dragon_hour = total_minutes / 54.0
    return dragon_hour

def evaluate_homeostasis():
    alpha = CONFIG["polarity"]["alpha_static"]
    beta = CONFIG["polarity"]["beta_reactor"]
    balance_ratio = alpha / max(1, beta)
    return round(balance_ratio, 4)

def main():
    print(f"[*] Cyber Dragon Node Daemon initialized: {CONFIG['node_id']}")
    print(f"[*] Chamber: {CONFIG['chamber']} | Mission: {CONFIG['mission']}")
    print(f"[*] Polarity Homeostasis Ratio (α/β): {evaluate_homeostasis()}")
    
    while True:
        d_hour = get_nonary_hour()
        payload = {
            "node": CONFIG["node_id"],
            "d9_hour": round(d_hour, 3),
            "cycle_half": "Alpha" if d_hour < 13.333 else "Beta",
            "polarity_ratio": evaluate_homeostasis(),
            "status": "HOMEOSTASIS_LOCKED"
        }
        print(f"[TELEMETRY] {json.dumps(payload)}")
        time.sleep(10)

if __name__ == "__main__":
    main()
`;

  const pm2Config = `// PM2 Ecosystem Configuration for FluidmotionTV Sovereign Mesh
// File: ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "dragon-${config.codename.toLowerCase().replace(/[^a-z0-9]/g, '-')}",
      script: "python3",
      args: "dragon_daemon.py",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: {
        NODE_ENV: "production",
        DRAGON_NODE_NAME: "${config.codename}",
        DRAGON_CHAMBER: "${config.chamber}",
        DRAGON_POLARITY_ALPHA: "${config.polarityAlpha}",
        DRAGON_POLARITY_BETA: "${config.polarityBeta}",
        DRAGON_BASE_FREQ: "${config.harmonicBaseFrequency}"
      }
    }
  ]
};
`;

  const telemetryJson = JSON.stringify(
    {
      targetEngine: 'Cyber Dragon Genesis / FluidmotionTV Sovereign Mesh',
      framework: 'Dragon 9 Temporal Clock & Two-Pin Polarity Core',
      nodeConfig: {
        codename: config.codename,
        chamber: config.chamber,
        primaryMission: config.primaryMission,
        temporalBalance: {
          clockSync: config.clockSync,
          harmonicBaseFrequencyHz: config.harmonicBaseFrequency,
          hourCycleSolarMinutes: 54,
          dailyCycleSolarMinutes: 1440,
          dragonHoursPerDay: 26.666667,
          apexWindows: ['11:51-12:09', '23:51-00:09']
        },
        twoPinPolarityState: {
          staticReferenceAlpha: `${config.polarityAlpha}% (Grounding & Stability)`,
          dynamicReactorBeta: `${config.polarityBeta}% (Mutation & Adaptability)`,
          homeostasisRatio: (config.polarityAlpha / Math.max(1, config.polarityBeta)).toFixed(3)
        },
        consensusStatus: config.consensusStatus,
        broadcastTimestamp: new Date().toISOString()
      }
    },
    null,
    2
  );

  const getActiveCode = () => {
    switch (activeScriptTab) {
      case 'bash':
        return bashScript;
      case 'python':
        return pythonScript;
      case 'pm2':
        return pm2Config;
      case 'telemetry':
        return telemetryJson;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 text-slate-100 cyber:text-white lab:text-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 tracking-wide flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
            Custom Dragon Configuration Protocol
          </h2>
          <p className="text-xs text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-0.5">
            Cyber Dragon Genesis node specification matrix, Two-Pin Polarity Homeostasis &amp; consensus generator.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 cyber:bg-black cyber:text-white cyber:border-cyan-400/60 lab:bg-slate-100 lab:border-slate-300 lab:text-slate-700">
            Node: <span className="text-cyan-400 cyber:text-yellow-300 lab:text-sky-700 font-bold">{config.codename}</span>
          </span>
          {onOpenExport3D && (
            <button
              type="button"
              onClick={onOpenExport3D}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold border border-fuchsia-500/50 bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-200 cyber:bg-black cyber:text-yellow-300 cyber:border-yellow-400 cyber:hover:bg-yellow-400 cyber:hover:text-black lab:bg-white lab:text-sky-700 lab:border-sky-300 lab:hover:bg-sky-50 transition-colors cursor-pointer"
              title="Export 3D models (.GLB, .GLTF, .OBJ, .STL)"
            >
              <Box className="w-3.5 h-3.5" />
              <span>EXPORT 3D MODELS</span>
            </button>
          )}
          {onOpenVideoStudio && (
            <button
              type="button"
              onClick={onOpenVideoStudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold border border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 cyber:bg-black cyber:text-fuchsia-300 cyber:border-fuchsia-400 cyber:hover:bg-fuchsia-400 cyber:hover:text-black lab:bg-white lab:text-fuchsia-700 lab:border-fuchsia-300 lab:hover:bg-fuchsia-50 transition-colors cursor-pointer"
              title="Upload an MP3 track & generate a creative 3D model showcase video"
            >
              <Film className="w-3.5 h-3.5" />
              <span>MP3 → 3D VIDEO</span>
            </button>
          )}
          <button
            onClick={handleDownloadLabReport}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shadow-lg lab:shadow-xs ${
              downloaded
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-emerald-500/10 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-600 lab:text-white lab:border-emerald-700'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white'
            }`}
            title="Download full laboratory session JSON report"
          >
            {downloaded ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 cyber:text-black lab:text-white" />
                <span>REPORT DOWNLOADED</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>DOWNLOAD LAB REPORT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 1: CUSTOMER SPECIFICATION MATRIX */}
      <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-2">
          <div className="text-xs font-mono text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
            <span>Section 1: Node Specification Matrix</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 cyber:bg-emerald-950 cyber:text-emerald-300 cyber:border-emerald-400 lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300">
              {isConfigRestored ? 'RESTORED · AUTO-SAVED' : 'LOCALSTORAGE AUTO-SYNC'}
            </span>
            {onResetConfig && (
              <button
                type="button"
                onClick={onResetConfig}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700 bg-slate-950 text-slate-300 hover:text-amber-300 hover:border-amber-500/50 cyber:bg-black cyber:border-cyan-500/50 cyber:text-white cyber:hover:text-yellow-300 lab:bg-white lab:border-slate-300 lab:text-slate-700 lab:hover:text-amber-700 transition-colors cursor-pointer"
                title="Reset nodeConfig back to factory Dragon 9 defaults"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Designation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-slate-300 cyber:text-white lab:text-slate-700">1. Dragon Designation / Codename:</label>
            <input
              type="text"
              value={config.codename}
              onChange={(e) => updateField('codename', e.target.value)}
              className="bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-500/50 lab:border-slate-300 focus:border-cyan-400 lab:focus:border-sky-600 text-cyan-300 cyber:text-cyan-300 lab:text-sky-800 font-mono text-sm px-3 py-2 rounded-lg"
              placeholder="Aether-Viper-9"
            />
          </div>

          {/* 2. Operational Chamber */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-slate-300 cyber:text-white lab:text-slate-700">2. Operational Chamber / Triad:</label>
            <select
              value={config.chamber}
              onChange={(e) => updateField('chamber', e.target.value as OperationalChamber)}
              aria-label="Operational Chamber Triad"
              className="bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-500/50 lab:border-slate-300 focus:border-cyan-400 lab:focus:border-sky-600 text-slate-200 cyber:text-white lab:text-slate-900 font-mono text-sm px-3 py-2 rounded-lg cursor-pointer"
            >
              {chambers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Primary Mission */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-mono text-slate-300 cyber:text-white lab:text-slate-700">3. Primary Mission / Core Subsystem:</label>
            <input
              type="text"
              value={config.primaryMission}
              onChange={(e) => updateField('primaryMission', e.target.value)}
              className="bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-500/50 lab:border-slate-300 focus:border-cyan-400 lab:focus:border-sky-600 text-slate-200 cyber:text-white lab:text-slate-900 font-mono text-sm px-3 py-2 rounded-lg"
              placeholder="FFmpeg stream ingestion, WireGuard mesh routing, 432Hz acoustic harmonic synthesis"
            />
          </div>

          {/* 4. Temporal Framework Balance */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-slate-300 cyber:text-white lab:text-slate-700">4a. Dragon 9 Clock Sync:</label>
            <div className="flex gap-2">
              {(['Active', 'Standard UTC Match'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateField('clockSync', s)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                    config.clockSync === s
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:text-white lab:border-sky-800'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/40 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-slate-900'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-slate-300 cyber:text-white lab:text-slate-700">4b. Harmonic Base Frequency:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={config.harmonicBaseFrequency}
                onChange={(e) => updateField('harmonicBaseFrequency', parseFloat(e.target.value) || 432)}
                className="w-28 bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-500/50 lab:border-slate-300 focus:border-cyan-400 lab:focus:border-sky-600 text-cyan-300 cyber:text-cyan-300 lab:text-sky-800 font-mono text-sm px-3 py-1.5 rounded-lg"
              />
              <span className="text-xs font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600">Hz (Natural Pythagorean)</span>
            </div>
          </div>
        </div>

        {/* 5. Two-Pin Polarity State (Homeostasis) */}
        <div className="pt-3 border-t border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-slate-300 cyber:text-white lab:text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
              5. Two-Pin Polarity State (Homeostasis):
            </label>
            <span className="text-xs font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
              Ratio (α/β):{' '}
              <span className="text-cyan-400 cyber:text-yellow-300 lab:text-sky-700 font-bold">
                {(config.polarityAlpha / Math.max(1, config.polarityBeta)).toFixed(2)}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pole Alpha */}
            <div className="bg-slate-950 cyber:bg-black lab:bg-white p-3 rounded-lg border border-cyan-500/30 cyber:border-cyan-400 lab:border-sky-300 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 font-bold">Static Reference (Alpha)</span>
                <span className="text-cyan-300 cyber:text-cyan-300 lab:text-sky-800 font-bold">{config.polarityAlpha}%</span>
              </div>
              <p className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600">Grounding, stability, structural lattice integrity</p>
              <input
                type="range"
                min={0}
                max={100}
                value={config.polarityAlpha}
                onChange={(e) => updateField('polarityAlpha', parseInt(e.target.value, 10))}
                aria-label="Static Reference Alpha Polarity"
                className="w-full accent-cyan-400 lab:accent-sky-600 cursor-pointer"
              />
            </div>

            {/* Pole Beta */}
            <div className="bg-slate-950 cyber:bg-black lab:bg-white p-3 rounded-lg border border-fuchsia-500/30 cyber:border-fuchsia-400 lab:border-fuchsia-300 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-fuchsia-400 cyber:text-fuchsia-300 lab:text-fuchsia-700 font-bold">Dynamic Reactor (Beta)</span>
                <span className="text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-800 font-bold">{config.polarityBeta}%</span>
              </div>
              <p className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600">Mutation, adaptability, energetic propulsion</p>
              <input
                type="range"
                min={0}
                max={100}
                value={config.polarityBeta}
                onChange={(e) => updateField('polarityBeta', parseInt(e.target.value, 10))}
                aria-label="Dynamic Reactor Beta Polarity"
                className="w-full accent-fuchsia-400 lab:accent-fuchsia-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 6. Pulse Synchronization Mode */}
        <div className="pt-3 border-t border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-mono text-slate-300 cyber:text-white lab:text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400 cyber:text-emerald-300 lab:text-emerald-600" />
              6. Pulse Synchronization Mode (Dynamic Harmonic Rotation):
            </label>
            <button
              onClick={() => {
                const nextState = !config.pulseSync;
                updateField('pulseSync', nextState);
                onLogEvent?.(
                  'CONFIG_CHANGE',
                  nextState ? 'Pulse Synchronization Mode Engaged' : 'Pulse Synchronization Mode Disengaged',
                  nextState
                    ? `3D mesh rotation velocity dynamically coupled to ${frequency}Hz audio oscillator. Rotational velocity breathes along harmonic sine wave envelope at ${(frequency / 108).toFixed(1)}Hz pulse rate.`
                    : 'Pulse Synchronization disengaged. 3D mesh rotation restored to constant rate.',
                  {
                    pulseSync: nextState,
                    audioFrequency: frequency,
                    pulseRateHz: Number((frequency / 108).toFixed(1)),
                    oscillationModel: 'omega(t) = omega_0 * [1.0 + 0.75 * sin(2*pi*(f/108)*t)]',
                  }
                );
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                config.pulseSync
                  ? 'bg-emerald-500 text-slate-950 border border-emerald-400 shadow-lg shadow-emerald-500/20 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-700 lab:text-white lab:border-emerald-800 lab:shadow-xs'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/50 lab:bg-white lab:hover:bg-slate-100 lab:text-slate-700 lab:border-slate-300'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${config.pulseSync ? 'text-slate-950 cyber:text-black lab:text-white fill-current' : 'text-slate-500 cyber:text-cyan-300 lab:text-slate-500'}`} />
              <span>{config.pulseSync ? 'PULSE SYNC ACTIVE' : 'ENGAGE PULSE SYNC'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 cyber:text-zinc-300 lab:text-slate-600 leading-relaxed font-sans">
            Dynamically couples the 3D mesh rotational velocity to the acoustic frequency of the 432Hz audio synthesizer. When engaged, node rotation speed breathes dynamically along a harmonic standing wave envelope rather than spinning at a flat rate.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <div className="bg-slate-950 cyber:bg-black lab:bg-white p-2.5 rounded-lg border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 flex flex-col gap-0.5">
              <span className="text-slate-500 cyber:text-zinc-300 lab:text-slate-500 text-[9px] uppercase">Coupled Frequency</span>
              <span className="text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 font-bold">{frequency} Hz</span>
            </div>
            <div className="bg-slate-950 cyber:bg-black lab:bg-white p-2.5 rounded-lg border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 flex flex-col gap-0.5">
              <span className="text-slate-500 cyber:text-zinc-300 lab:text-slate-500 text-[9px] uppercase">Harmonic Pulse Rate</span>
              <span className="text-emerald-300 cyber:text-emerald-300 lab:text-emerald-700 font-bold">{(frequency / 108).toFixed(2)} Hz</span>
            </div>
            <div className="bg-slate-950 cyber:bg-black lab:bg-white p-2.5 rounded-lg border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 flex flex-col gap-0.5">
              <span className="text-slate-500 cyber:text-zinc-300 lab:text-slate-500 text-[9px] uppercase">Velocity Modulation</span>
              <span className="text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-700 font-bold">0.15× ↔ 1.75×</span>
            </div>
            <div className="bg-slate-950 cyber:bg-black lab:bg-white p-2.5 rounded-lg border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 flex flex-col gap-0.5">
              <span className="text-slate-500 cyber:text-zinc-300 lab:text-slate-500 text-[9px] uppercase">Engine State</span>
              <span className={config.pulseSync ? 'text-emerald-400 cyber:text-emerald-300 lab:text-emerald-700 font-bold animate-pulse' : 'text-slate-500 cyber:text-zinc-400 lab:text-slate-500'}>
                {config.pulseSync ? 'DYNAMIC PULSATION' : 'CONSTANT RATE'}
              </span>
            </div>
          </div>

          {/* Real-Time D3.js Circular Wave Visualizer */}
          <D3CircularWaveVisualizer
            frequency={frequency}
            isAudioPlaying={isAudioPlaying}
            pulseSync={config.pulseSync ?? false}
            polarityAlpha={config.polarityAlpha}
            polarityBeta={config.polarityBeta}
            theme={theme}
          />
        </div>
      </div>

      {/* SECTION: SAVED LABORATORY PRESETS MATRIX */}
      <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-4">
        {/* Header with Title, Export & Import Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xs font-mono text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
              Sovereign Node Protocol Saved Presets ({presets.length})
            </div>
            {presetToast && (
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 cyber:text-black lab:text-emerald-600" />
                {presetToast}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Primary 'Export Presets' Button */}
            <button
              onClick={() => {
                handleExportPresetsToClipboard();
                setShowExportModal(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shadow-lg lab:shadow-xs ${
                copiedExport
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20 border border-emerald-400 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-700 lab:text-white'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white'
              }`}
              title="Copy current laboratory configuration string to clipboard for backup or sharing"
            >
              {copiedExport ? <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedExport ? 'COPIED TO CLIPBOARD' : 'EXPORT PRESETS'}</span>
            </button>

            {/* Toggle Drawer for Export / Import Options */}
            <button
              onClick={() => setShowExportModal(!showExportModal)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-mono text-xs border transition-colors cursor-pointer ${
                showExportModal
                  ? 'bg-slate-800 text-cyan-300 border-cyan-500/50 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-50 lab:text-sky-800 lab:border-sky-400'
                  : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 cyber:bg-black cyber:text-white cyber:border-cyan-500/50 lab:bg-white lab:hover:bg-slate-100 lab:text-slate-700 lab:border-slate-300'
              }`}
              title="Configure export format or import external configuration string"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400 cyber:text-inherit lab:text-inherit" />
              <span>{showExportModal ? 'HIDE EXPORT TRAY' : 'VIEW CONFIG STRING'}</span>
            </button>
          </div>
        </div>

        {/* EXPANDABLE EXPORT & IMPORT CONFIGURATION CONSOLE */}
        {showExportModal && (
          <div className="bg-slate-950 cyber:bg-black lab:bg-white border border-cyan-500/40 cyber:border-cyan-400 lab:border-sky-300 rounded-xl p-4 flex flex-col gap-3 font-mono shadow-2xl lab:shadow-sm transition-all">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
                <span className="text-xs font-bold text-cyan-300 cyber:text-cyan-300 lab:text-sky-800 uppercase tracking-wider">
                  Portable Configuration String &amp; Presets Export
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-50 lab:text-sky-800 lab:border-sky-300">
                  Clipboard Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 font-sans">
                Copy your laboratory configuration string to your clipboard to share setups or backup outside local storage.
              </p>
            </div>

            {/* Scope and Format Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Export Scope */}
              <div className="flex flex-col gap-1.5">
                <span className="text-slate-400 cyber:text-zinc-300 lab:text-slate-600 text-[10px] uppercase">Export Scope:</span>
                <div className="flex bg-slate-900 cyber:bg-black lab:bg-slate-100 border border-slate-800 cyber:border-cyan-500/50 lab:border-slate-300 rounded-lg p-0.5">
                  <button
                    onClick={() => setExportScope('all-presets')}
                    className={`flex-1 py-1 px-2 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                      exportScope === 'all-presets'
                        ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-white lab:text-sky-700 lab:border-slate-300 lab:shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600'
                    }`}
                  >
                    All {presets.length} Presets + Active State
                  </button>
                  <button
                    onClick={() => setExportScope('active-config')}
                    className={`flex-1 py-1 px-2 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                      exportScope === 'active-config'
                        ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-white lab:text-sky-700 lab:border-slate-300 lab:shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600'
                    }`}
                  >
                    Active Setup Only
                  </button>
                </div>
              </div>

              {/* Export Format */}
              <div className="flex flex-col gap-1.5">
                <span className="text-slate-400 cyber:text-zinc-300 lab:text-slate-600 text-[10px] uppercase">String Encoding Format:</span>
                <div className="flex bg-slate-900 cyber:bg-black lab:bg-slate-100 border border-slate-800 cyber:border-cyan-500/50 lab:border-slate-300 rounded-lg p-0.5">
                  {(['json', 'compact', 'base64'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                        exportFormat === fmt
                          ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-white lab:text-sky-700 lab:border-slate-300 lab:shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600'
                      }`}
                    >
                      {fmt === 'base64' ? 'Base64 Token' : fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* String Code Viewport */}
            <div className="relative bg-slate-900/90 cyber:bg-zinc-950 lab:bg-slate-900 rounded-lg border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-700 p-2.5 max-h-48 overflow-y-auto">
              <pre className="text-[11px] text-cyan-200/90 whitespace-pre font-mono leading-tight select-all">
                {generateExportString(exportScope, exportFormat)}
              </pre>
            </div>

            {/* Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPresetsToClipboard}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    copiedExport
                      ? 'bg-emerald-500 text-slate-950 border border-emerald-400 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-700 lab:text-white'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white'
                  }`}
                >
                  {copiedExport ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedExport ? 'COPIED TO CLIPBOARD' : 'COPY CONFIGURATION STRING'}</span>
                </button>

                <button
                  onClick={() => {
                    const str = generateExportString(exportScope, exportFormat);
                    const blob = new Blob([str], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `dragon9-${exportScope}-${Date.now()}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    setPresetToast('Configuration file downloaded!');
                    setTimeout(() => setPresetToast(null), 3000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 cyber:bg-black cyber:text-white cyber:border-cyan-500/50 lab:bg-slate-100 lab:hover:bg-slate-200 lab:text-slate-700 lab:border-slate-300 text-xs transition-colors cursor-pointer"
                  title="Download configuration file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>SAVE AS FILE (.JSON)</span>
                </button>
              </div>

              <span className="text-[10px] text-slate-500 cyber:text-zinc-300 lab:text-slate-500">
                Payload Size: {generateExportString(exportScope, exportFormat).length} characters
              </span>
            </div>

            {/* RESTORE / IMPORT SUB-PANEL */}
            <div className="mt-2 pt-3 border-t border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 cyber:text-white lab:text-slate-700 font-bold flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-400 cyber:text-emerald-300 lab:text-emerald-600" />
                  Restore or Import Configuration String:
                </span>
                <span className="text-[10px] text-slate-500 cyber:text-zinc-300 lab:text-slate-500">Accepts JSON or D9CFG: token</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder="Paste external configuration string or D9CFG: token here..."
                  className="flex-1 bg-slate-900 cyber:bg-zinc-950 lab:bg-slate-50 border border-slate-800 cyber:border-cyan-500/50 lab:border-slate-300 focus:border-cyan-400 lab:focus:border-sky-600 text-slate-200 cyber:text-white lab:text-slate-900 text-xs px-3 py-1.5 rounded-lg font-mono placeholder:text-slate-600 lab:placeholder:text-slate-400"
                />
                <button
                  onClick={handleImportConfiguration}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-700 lab:hover:bg-emerald-800 lab:text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>IMPORT CONFIG</span>
                </button>
              </div>

              {importError && (
                <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-500/40 cyber:bg-black cyber:text-red-300 lab:bg-red-50 lab:text-red-800 lab:border-red-300 p-2 rounded">
                  {importError}
                </div>
              )}
              {importSuccess && (
                <div className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 cyber:bg-black cyber:text-emerald-300 lab:bg-emerald-50 lab:text-emerald-800 lab:border-emerald-300 p-2 rounded">
                  {importSuccess}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Current State Form */}
        <div className="bg-slate-950 cyber:bg-black lab:bg-white p-3 rounded-xl border border-cyan-500/30 cyber:border-cyan-400/60 lab:border-slate-200 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600 uppercase">Save Active Lab Parameters (Polarity α/β, Grid N={cathieGridVal}, Synth {frequency}Hz):</label>
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder={`e.g. Preset ${config.codename} (${frequency}Hz)`}
              className="bg-slate-900 cyber:bg-zinc-950 lab:bg-slate-50 border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-300 focus:border-cyan-400 lab:focus:border-sky-600 text-cyan-300 cyber:text-white lab:text-sky-800 font-mono text-xs px-3 py-1.5 rounded-lg placeholder:text-slate-600 lab:placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={handleSaveCurrentPreset}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 shadow-lg shadow-cyan-500/10 lab:shadow-xs"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>SAVE CURRENT PRESET</span>
          </button>
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {presets.map((p) => {
            const isCurrentlyActive =
              config.polarityAlpha === p.polarityAlpha &&
              config.polarityBeta === p.polarityBeta &&
              cathieGridVal === p.gridValue &&
              frequency === p.frequency;

            const isThisPresetCopied = copiedPresetId === p.id;

            return (
              <div
                key={p.id}
                className={`bg-slate-950 cyber:bg-black lab:bg-white p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                  isCurrentlyActive
                    ? 'border-cyan-400/80 shadow-lg shadow-cyan-500/10 bg-slate-900/80 cyber:border-cyan-300 lab:border-sky-600 lab:shadow-xs'
                    : 'border-slate-800/80 hover:border-slate-700 cyber:border-cyan-500/40 lab:border-slate-200 lab:hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-100 cyber:text-white lab:text-slate-900 truncate flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600 shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </span>
                    {isCurrentlyActive && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-100 lab:text-sky-800 lab:border-sky-300 shrink-0">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 leading-tight">
                    {p.description || `Node ${p.codename} | Chamber ${p.chamber}`}
                  </p>
                </div>

                {/* Preset Parameter Badges */}
                <div className="grid grid-cols-3 gap-1 font-mono text-[10px] bg-slate-900/90 cyber:bg-zinc-950 lab:bg-slate-50 p-1.5 rounded border border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200">
                  <div className="text-center">
                    <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-500 text-[8px] block uppercase">Polarity</span>
                    <span className="text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 font-bold">α{p.polarityAlpha} / β{p.polarityBeta}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-500 text-[8px] block uppercase">Cathie Grid</span>
                    <span className="text-amber-300 cyber:text-yellow-300 lab:text-amber-700 font-bold">N={p.gridValue}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-500 text-[8px] block uppercase">Synth Freq</span>
                    <span className="text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-700 font-bold">{p.frequency} Hz</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 cyber:border-cyan-500/30 lab:border-slate-200">
                  <button
                    onClick={() => handleLoadPreset(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-700 cyber:bg-black cyber:text-cyan-300 cyber:border-cyan-400 cyber:hover:bg-cyan-400 cyber:hover:text-black lab:bg-slate-100 lab:hover:bg-slate-200 lab:text-sky-700 lab:border-slate-300 font-mono text-[11px] font-bold transition-colors cursor-pointer"
                    title="Load this preset into live laboratory state"
                  >
                    <RotateCcw className="w-3 h-3 text-current" />
                    <span>LOAD</span>
                  </button>

                  {/* Copy Individual Preset Configuration String */}
                  <button
                    onClick={() => handleExportSinglePreset(p)}
                    className={`p-1.5 rounded font-mono text-[11px] border transition-colors cursor-pointer flex items-center gap-1 ${
                      isThisPresetCopied
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-100 lab:text-emerald-800 lab:border-emerald-300'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border-slate-800 hover:border-slate-700 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/40 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-sky-700'
                    }`}
                    title="Copy this preset's configuration string to clipboard"
                  >
                    {isThisPresetCopied ? <Check className="w-3.5 h-3.5 text-emerald-400 cyber:text-black lab:text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleDeletePreset(p.id, p.name)}
                    className="p-1.5 rounded bg-slate-900 hover:bg-red-950/60 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-500/40 cyber:bg-black cyber:text-red-300 cyber:border-red-400/60 lab:bg-white lab:hover:bg-red-50 lab:text-slate-500 lab:hover:text-red-600 lab:border-slate-300 transition-colors cursor-pointer"
                    title="Delete preset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: BRUCE CATHIE HARMONIC GRID GOOGLE SEARCH & HISTORICAL COORDINATES */}
      <CathieCoordinatesCrossReference
        currentGridValue={cathieGridVal}
        onApplyGridValue={onGridValueChange}
        frequency={frequency}
        onLogEvent={onLogEvent}
      />

      {/* SECTION: LABORATORY SESSION SERIALIZATION & REPORT */}
      <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-2">
          <div className="text-xs font-mono text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileJson className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
            Laboratory Session State Serializer
          </div>
          <button
            onClick={handleDownloadLabReport}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer ${
              downloaded
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-600 lab:text-white lab:border-emerald-700'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/50 shadow-cyan-500/10 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white lab:border-sky-800'
            }`}
          >
            {downloaded ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 cyber:text-black lab:text-white" /> : <Download className="w-3.5 h-3.5 text-cyan-400 cyber:text-black lab:text-white" />}
            <span>{downloaded ? 'REPORT DOWNLOADED (.JSON)' : 'DOWNLOAD SESSION REPORT (.JSON)'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 cyber:text-zinc-200 lab:text-slate-700 leading-relaxed font-sans">
          Save your current laboratory session state. The downloaded JSON report serializes all operational parameters across the five laboratories (432Hz Audio Synthesizer, Bruce Cathie Harmonic Grid, Geometric Vector Cipher, Dragon 9 Nonary Clock, and Sovereign Node Protocol), along with homeostasis telemetry and planetary geodetic resonances.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-1">
          <div className="bg-slate-950 cyber:bg-black lab:bg-white p-2 rounded border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
            <span className="text-slate-500 cyber:text-zinc-300 lab:text-slate-500 block text-[9px] uppercase">1. Audio Synth</span>
            <span className="text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 font-bold">{frequency} Hz ({isAudioPlaying ? 'Active' : 'Standby'})</span>
          </div>
          <div className="bg-slate-950 cyber:bg-black lab:bg-white p-2 rounded border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
            <span className="text-slate-500 cyber:text-zinc-300 lab:text-slate-500 block text-[9px] uppercase">2. Cathie Grid</span>
            <span className="text-amber-300 cyber:text-yellow-300 lab:text-amber-700 font-bold">Ref N = {cathieGridVal}</span>
          </div>
          <div className="bg-slate-950 cyber:bg-black lab:bg-white p-2 rounded border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
            <span className="text-slate-500 cyber:text-zinc-300 lab:text-slate-500 block text-[9px] uppercase">3. Vector Cipher</span>
            <span className="text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-700 font-bold truncate block">{lastCipherHash.slice(0, 11)}...</span>
          </div>
          <div className="bg-slate-950 cyber:bg-black lab:bg-white p-2 rounded border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200">
            <span className="text-slate-500 cyber:text-zinc-300 lab:text-slate-500 block text-[9px] uppercase">4. Two-Pin Polarity</span>
            <span className="text-emerald-300 cyber:text-emerald-300 lab:text-emerald-700 font-bold">α{config.polarityAlpha} / β{config.polarityBeta}</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: ACTIONABLE OUTPUTS & CONSENSUS INTEGRATION */}
      <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-2">
          <div className="text-xs font-mono text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
            Section 2: Runnable Mesh Artifacts &amp; Consensus
          </div>
          <button
            onClick={handleSimulateConsensus}
            disabled={isSimulatingConsensus}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 cyber:bg-cyan-400 cyber:text-black lab:bg-sky-700 lab:hover:bg-sky-800 lab:text-white font-mono text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>{isSimulatingConsensus ? 'ROUTING CONSENSUS...' : 'EXECUTE CONSENSUS ROUTE'}</span>
          </button>
        </div>

        {/* Live Consensus Diagnostic Console */}
        {consensusLog && (
          <div className="bg-slate-950 cyber:bg-black lab:bg-slate-900 border border-cyan-500/40 cyber:border-cyan-400 lab:border-slate-700 rounded-lg p-3 font-mono text-[11px] text-cyan-300 whitespace-pre-line">
            {consensusLog}
          </div>
        )}

        {/* Artifact Code Tabs */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-1">
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'bash', label: 'antiX/Termux Bash' },
                { id: 'python', label: 'Python Daemon' },
                { id: 'pm2', label: 'PM2 Config' },
                { id: 'telemetry', label: 'JSON Telemetry' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveScriptTab(t.id as 'bash')}
                  className={`px-3 py-1 rounded text-xs font-mono border transition-colors cursor-pointer ${
                    activeScriptTab === t.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-700 lab:text-white lab:border-sky-800'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/40 lab:bg-white lab:text-slate-600 lab:border-slate-300 lab:hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer px-2 py-1 rounded bg-slate-950 border border-slate-800 cyber:bg-black cyber:text-white cyber:border-cyan-400/60 lab:bg-white lab:text-slate-700 lab:border-slate-300 lab:hover:text-sky-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 lab:text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED SCRIPT' : 'COPY SCRIPT'}</span>
            </button>
          </div>

          <div className="bg-slate-950 cyber:bg-black lab:bg-slate-900 border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-700 rounded-lg p-3 max-h-80 overflow-y-auto">
            <pre className="font-mono text-[11px] text-slate-300 cyber:text-cyan-200 lab:text-slate-100 whitespace-pre-wrap leading-relaxed select-all">
              {getActiveCode()}
            </pre>
          </div>
        </div>
      </div>

      {/* SECTION 3: PERSISTENT LABORATORY SESSION AUDIT LOG */}
      <div id="session-log-section">
        <SessionLogView
          logs={logs}
          onClearLogs={onClearLogs}
          onAddTestEntry={onAddTestEntry}
        />
      </div>
    </div>
  );
};
