import { useState, useEffect, useCallback, useRef } from 'react';
import { DragonNodeConfig, OperationalChamber } from '../types/dragon';

export const NODE_CONFIG_STORAGE_KEY = 'dragon9_node_config';

export const DEFAULT_NODE_CONFIG: DragonNodeConfig = {
  codename: 'Aether-Viper-9',
  chamber: 'Command & Control',
  primaryMission: 'FFmpeg stream ingestion, WireGuard mesh routing & 432Hz acoustic harmonic synthesis',
  clockSync: 'Active',
  harmonicBaseFrequency: 432,
  polarityAlpha: 82, // Static Reference Grounding (0-100%)
  polarityBeta: 64, // Dynamic Reactor Adaptability (0-100%)
  consensusStatus: 'Synchronized',
  pulseSync: true,
};

const VALID_CHAMBERS: OperationalChamber[] = [
  'Command & Control',
  'The Central Chamber',
  'Action & Propulsion',
  'Resource Processing',
  'Defense & Environment',
];

const VALID_CLOCK_SYNC: DragonNodeConfig['clockSync'][] = ['Active', 'Standard UTC Match'];
const VALID_CONSENSUS: DragonNodeConfig['consensusStatus'][] = ['Synchronized', 'Evaluating', 'Broadcasting'];

const clampPct = (val: unknown, fallback: number): number => {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(0, Math.min(100, Math.round(val)));
};

/**
 * Validates and normalizes untrusted/deserialized JSON into a complete DragonNodeConfig object.
 */
export function sanitizeNodeConfig(raw: unknown): DragonNodeConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_NODE_CONFIG };
  }

  const candidate = raw as Record<string, unknown>;
  const source =
    candidate.config && typeof candidate.config === 'object'
      ? (candidate.config as Record<string, unknown>)
      : candidate;

  const codename =
    typeof source.codename === 'string' && source.codename.trim().length > 0
      ? source.codename
      : DEFAULT_NODE_CONFIG.codename;

  const chamber = VALID_CHAMBERS.includes(source.chamber as OperationalChamber)
    ? (source.chamber as OperationalChamber)
    : DEFAULT_NODE_CONFIG.chamber;

  const primaryMission =
    typeof source.primaryMission === 'string'
      ? source.primaryMission
      : DEFAULT_NODE_CONFIG.primaryMission;

  const clockSync = VALID_CLOCK_SYNC.includes(source.clockSync as DragonNodeConfig['clockSync'])
    ? (source.clockSync as DragonNodeConfig['clockSync'])
    : DEFAULT_NODE_CONFIG.clockSync;

  const harmonicBaseFrequency =
    typeof source.harmonicBaseFrequency === 'number' &&
    Number.isFinite(source.harmonicBaseFrequency) &&
    source.harmonicBaseFrequency > 0
      ? Math.max(1, Math.min(20000, source.harmonicBaseFrequency))
      : DEFAULT_NODE_CONFIG.harmonicBaseFrequency;

  const polarityAlpha = clampPct(source.polarityAlpha, DEFAULT_NODE_CONFIG.polarityAlpha);
  const polarityBeta = clampPct(source.polarityBeta, DEFAULT_NODE_CONFIG.polarityBeta);

  const consensusStatus = VALID_CONSENSUS.includes(
    source.consensusStatus as DragonNodeConfig['consensusStatus']
  )
    ? (source.consensusStatus as DragonNodeConfig['consensusStatus'])
    : DEFAULT_NODE_CONFIG.consensusStatus;

  const pulseSync =
    typeof source.pulseSync === 'boolean' ? source.pulseSync : DEFAULT_NODE_CONFIG.pulseSync;

  return {
    codename,
    chamber,
    primaryMission,
    clockSync,
    harmonicBaseFrequency,
    polarityAlpha,
    polarityBeta,
    consensusStatus,
    pulseSync,
  };
}

function readStoredNodeConfig(storageKey: string): {
  config: DragonNodeConfig;
  restored: boolean;
} {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { config: { ...DEFAULT_NODE_CONFIG }, restored: false };
    }
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return { config: { ...DEFAULT_NODE_CONFIG }, restored: false };
    }
    const parsed: unknown = JSON.parse(raw);
    return {
      config: sanitizeNodeConfig(parsed),
      restored: true,
    };
  } catch (err) {
    console.warn('Failed to deserialize nodeConfig from localStorage, falling back to defaults:', err);
    return { config: { ...DEFAULT_NODE_CONFIG }, restored: false };
  }
}

export interface PersistentNodeConfigMeta {
  resetNodeConfig: () => void;
  wasRestoredFromStorage: boolean;
}

/**
 * Automatically restores DragonNodeConfig from localStorage on mount and
 * serializes every subsequent state update back to localStorage.
 */
export function usePersistentNodeConfig(storageKey: string = NODE_CONFIG_STORAGE_KEY) {
  const initialRef = useRef<{ config: DragonNodeConfig; restored: boolean } | null>(null);
  if (initialRef.current === null) {
    initialRef.current = readStoredNodeConfig(storageKey);
  }

  const [nodeConfig, setNodeConfig] = useState<DragonNodeConfig>(() => initialRef.current!.config);
  const [wasRestoredFromStorage] = useState<boolean>(() => initialRef.current!.restored);
  const lastSerializedRef = useRef<string | null>(null);

  // Automatically serialize nodeConfig to localStorage whenever it changes
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const serialized = JSON.stringify(nodeConfig);
      if (serialized === lastSerializedRef.current) return;
      window.localStorage.setItem(storageKey, serialized);
      lastSerializedRef.current = serialized;
    } catch (err) {
      console.error('Failed to serialize nodeConfig to localStorage:', err);
    }
  }, [nodeConfig, storageKey]);

  // Synchronize updates across concurrent browser tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== storageKey || event.newValue === null) return;
      try {
        const parsed: unknown = JSON.parse(event.newValue);
        const normalized = sanitizeNodeConfig(parsed);
        lastSerializedRef.current = JSON.stringify(normalized);
        setNodeConfig(normalized);
      } catch (err) {
        console.warn('Ignored malformed cross-tab nodeConfig update:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  const resetNodeConfig = useCallback(() => {
    const defaults = { ...DEFAULT_NODE_CONFIG };
    const serialized = JSON.stringify(defaults);
    lastSerializedRef.current = serialized;
    setNodeConfig(defaults);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(storageKey, serialized);
      }
    } catch (err) {
      console.error('Failed to reset nodeConfig in localStorage:', err);
    }
  }, [storageKey]);

  return [
    nodeConfig,
    setNodeConfig,
    {
      resetNodeConfig,
      wasRestoredFromStorage,
    } satisfies PersistentNodeConfigMeta,
  ] as const;
}
