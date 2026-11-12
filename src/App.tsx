import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChamberTab, NonaryClockState, SessionLogEntry, LogCategory, AppTheme } from './types/dragon';
import { calculateNonaryTime } from './utils/nonaryClock';
import { usePersistentNodeConfig, DEFAULT_NODE_CONFIG } from './hooks/usePersistentNodeConfig';
import { useWebMidi } from './hooks/useWebMidi';
import { audioEngine } from './utils/audioEngine';
import { Live3DSnapshotRefs } from './utils/export3DModel';
import { Header } from './components/Header';
import { ThreeViewport, SceneMode } from './components/ThreeViewport';
import { ThreeControlDock } from './components/ThreeControlDock';
import { AudioSynthesizerLab } from './components/AudioSynthesizerLab';
import { CathieGridLab } from './components/CathieGridLab';
import { VectorCipherLab } from './components/VectorCipherLab';
import { NonaryClockLab } from './components/NonaryClockLab';
import { DragonConfigLab } from './components/DragonConfigLab';
import { ModelProgressionGuide } from './components/ModelProgressionGuide';
import { HarmonicResonatorLab } from './components/HarmonicResonatorLab';
import { Export3DModal } from './components/Export3DModal';
import { CreativeVideoStudioModal } from './components/CreativeVideoStudioModal';
import { MidiControllerModal } from './components/MidiControllerModal';
import { ApexTransitionOverlay, ApexFeedbackBurst } from './components/ApexTransitionOverlay';
import { Waves, Globe, Binary, Clock, Cpu, Box, BookOpen, Layers } from 'lucide-react';

const LOG_STORAGE_KEY = 'dragon9_session_logs';
const THEME_STORAGE_KEY = 'dragon9_theme';

const getInitialTheme = (): AppTheme => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'sovereign-dark' || saved === 'high-contrast-cyber' || saved === 'minimalist-lab') {
      return saved;
    }
  } catch (e) {
    console.error('Failed to read theme from localStorage:', e);
  }
  return 'sovereign-dark';
};

const getInitialLogs = (): SessionLogEntry[] => {
  try {
    const saved = localStorage.getItem(LOG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse session logs from localStorage:', e);
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  return [
    {
      id: `log_init_1_${Date.now()}`,
      timestamp: now.toISOString(),
      timeFormatted: timeStr,
      dragonHourDisplay: 'D9·00:00:00',
      category: 'SYSTEM_EVENT',
      title: 'Laboratory Subsystem Initialized',
      details: 'Dragon 9 Sovereign Laboratory session started. All 5 chambers operational.',
      metadata: { codename: 'Aether-Viper-9', baseFreq: 432, status: 'NOMINAL' },
    },
    {
      id: `log_init_2_${Date.now()}`,
      timestamp: now.toISOString(),
      timeFormatted: timeStr,
      dragonHourDisplay: 'D9·00:00:01',
      category: 'TAB_SWITCH',
      title: 'Switched to Chamber 1: 432Hz Audio Synthesizer',
      details: 'Loaded 432Hz Pythagorean acoustic wave oscillator workspace.',
      metadata: { chamber: 'Audio Synthesizer' },
    },
  ];
};

export default function App() {
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);
  const [activeTab, setActiveTab] = useState<ChamberTab>('audio');
  const [timeState, setTimeState] = useState<NonaryClockState>(() => calculateNonaryTime());

  // Keep HTML data-theme attribute synchronized with active Tailwind CSS v4 theme variant
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.error('Failed to persist theme:', e);
    }
  }, [theme]);
  
  // Custom Dragon Specification Matrix (Directive Section 1) — automatically persisted to localStorage
  const [nodeConfig, setNodeConfig, { resetNodeConfig, wasRestoredFromStorage }] = usePersistentNodeConfig();

  // 3D Scene Controls
  const [sceneMode, setSceneMode] = useState<SceneMode>('sovereign-core');
  const [cameraPreset, setCameraPreset] = useState<string>('perspective');
  const [wireframeOnly, setWireframeOnly] = useState<boolean>(false);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1.0);
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [show3DInSplit, setShow3DInSplit] = useState<boolean>(true);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isExport3DModalOpen, setIsExport3DModalOpen] = useState<boolean>(false);
  const [isVideoStudioOpen, setIsVideoStudioOpen] = useState<boolean>(false);
  const [isMidiModalOpen, setIsMidiModalOpen] = useState<boolean>(false);
  const [midiPulseActive, setMidiPulseActive] = useState<boolean>(false);
  const live3DRefsGetterRef = useRef<(() => Live3DSnapshotRefs) | null>(null);

  const handleRegisterLiveRefs = useCallback((getter: () => Live3DSnapshotRefs) => {
    live3DRefsGetterRef.current = getter;
  }, []);

  const getLive3DSnapshotRefs = useCallback((): Live3DSnapshotRefs | null => {
    return live3DRefsGetterRef.current ? live3DRefsGetterRef.current() : null;
  }, []);

  // Audio state synced with 3D animation & restored base harmonic frequency
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioFrequency, setAudioFrequency] = useState<number>(() => nodeConfig.harmonicBaseFrequency);
  const [audioVolume, setAudioVolume] = useState<number>(() => audioEngine.getVolume());

  // Laboratory state tracked across chambers
  const [cathieGridVal, setCathieGridVal] = useState<number>(144);
  const [lastCipherHash, setLastCipherHash] = useState<string>('D9-00B291-B84976-9-9');
  const [visitedChambers, setVisitedChambers] = useState<ChamberTab[]>(['audio']);

  // Persistent Session Logs State
  const [sessionLogs, setSessionLogs] = useState<SessionLogEntry[]>(getInitialLogs);

  // Helper function to append and persist log entries
  const addLogEntry = (
    category: LogCategory,
    title: string,
    details: string,
    metadata?: Record<string, any>
  ) => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString();
    const newEntry: SessionLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      timeFormatted,
      dragonHourDisplay: timeState ? timeState.dragonHourDisplay : undefined,
      category,
      title,
      details,
      metadata,
    };

    setSessionLogs((prev) => {
      const updated = [...prev, newEntry];
      try {
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updated.slice(-250)));
      } catch (e) {
        console.error('Failed to save session log to localStorage', e);
      }
      return updated;
    });
  };

  const handleClearLogs = () => {
    const now = new Date();
    const resetEntry: SessionLogEntry = {
      id: `log_reset_${Date.now()}`,
      timestamp: now.toISOString(),
      timeFormatted: now.toLocaleTimeString(),
      dragonHourDisplay: timeState ? timeState.dragonHourDisplay : undefined,
      category: 'SYSTEM_EVENT',
      title: 'Session Logs Cleared',
      details: 'User manually cleared previous laboratory session audit trail.',
    };
    setSessionLogs([resetEntry]);
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify([resetEntry]));
    } catch (e) {
      console.error('Failed to reset session logs in localStorage', e);
    }
  };

  const handleAddTestEntry = () => {
    addLogEntry(
      'SYSTEM_EVENT',
      'Diagnostic Health Check Executed',
      'Verified nonary clock pulse, 3D WebGL render pipeline, and Two-Pin Polarity homeostasis.',
      { alpha: nodeConfig.polarityAlpha, beta: nodeConfig.polarityBeta, fps: 60 }
    );
  };

  // Web MIDI API hardware bridge integration
  const midi = useWebMidi({
    currentFrequency: audioFrequency,
    isAudioPlaying,
    onFrequencyChange: (hz) => {
      audioEngine.setFrequency(hz);
      setAudioFrequency(hz);
    },
    onCathieGridChange: (val) => {
      setCathieGridVal(val);
    },
    onVolumeChange: (vol) => {
      audioEngine.setVolume(vol);
      setAudioVolume(vol);
    },
    onPolarityAlphaChange: (alpha) => {
      setNodeConfig((prev) => ({
        ...prev,
        polarityAlpha: alpha,
        polarityBeta: Math.max(0, Math.min(100, 100 - alpha)),
      }));
    },
    onOscillatorToggle: async (targetState) => {
      const nextPlaying = targetState !== undefined ? targetState : !isAudioPlaying;
      if (nextPlaying) {
        const ok = await audioEngine.start();
        if (ok) {
          setIsAudioPlaying(true);
          addLogEntry(
            'AUDIO_SYNTH',
            'MIDI Hardware Engaged 432Hz Oscillator',
            `External MIDI trigger started oscillator at ${audioEngine.getFrequency()}Hz.`,
            { frequency: audioEngine.getFrequency(), source: 'WEB_MIDI' }
          );
        }
      } else {
        audioEngine.stop();
        setIsAudioPlaying(false);
        addLogEntry(
          'AUDIO_SYNTH',
          'MIDI Hardware Halted Oscillator',
          'External MIDI trigger silenced oscillator output.',
          { source: 'WEB_MIDI' }
        );
      }
    },
    onHardwareEventLog: (title, details, metadata) => {
      addLogEntry('SYSTEM_EVENT', title, details, metadata);
    },
  });

  // Brief pulse indicator when live MIDI hardware packets arrive
  useEffect(() => {
    if (!midi.lastActivityAt) return;
    setMidiPulseActive(true);
    const t = window.setTimeout(() => setMidiPulseActive(false), 320);
    return () => window.clearTimeout(t);
  }, [midi.lastActivityAt]);

  const oscFrequencyCc = midi.mappings.find((m) => m.target === 'oscFrequency')?.cc ?? 1;
  const cathieGridCc = midi.mappings.find((m) => m.target === 'cathieGridVal')?.cc ?? 74;

  // Apex state transition visual feedback
  const [apexBurst, setApexBurst] = useState<ApexFeedbackBurst | null>(null);
  const apexBurstTimerRef = useRef<number | null>(null);
  const prevApexStateRef = useRef<{ isApexActive: boolean; apexWindowName: string }>({
    isApexActive: timeState.isApexActive,
    apexWindowName: timeState.apexWindowName,
  });

  const triggerApexFeedback = useCallback((windowName: string, isSimulated = false) => {
    if (apexBurstTimerRef.current !== null) {
      window.clearTimeout(apexBurstTimerRef.current);
    }
    setApexBurst({
      id: Date.now(),
      windowName,
      isSimulated,
    });
    apexBurstTimerRef.current = window.setTimeout(() => {
      setApexBurst(null);
      apexBurstTimerRef.current = null;
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (apexBurstTimerRef.current !== null) {
        window.clearTimeout(apexBurstTimerRef.current);
      }
    };
  }, []);

  // Real-time clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeState(calculateNonaryTime());
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Detect live nonary clock transitions into a new Apex state
  useEffect(() => {
    const prev = prevApexStateRef.current;
    const enteredNewApex =
      timeState.isApexActive &&
      (!prev.isApexActive || prev.apexWindowName !== timeState.apexWindowName);

    prevApexStateRef.current = {
      isApexActive: timeState.isApexActive,
      apexWindowName: timeState.apexWindowName,
    };

    if (enteredNewApex) {
      triggerApexFeedback(timeState.apexWindowName, false);
      addLogEntry(
        'SYSTEM_EVENT',
        `Apex State Transition: ${timeState.apexWindowName}`,
        `Nonary temporal clock transitioned into active 18-minute Apex alignment window (${timeState.dragonHourDisplay}).`,
        {
          apexWindowName: timeState.apexWindowName,
          dragonHourDisplay: timeState.dragonHourDisplay,
          solarTime: timeState.solarTime,
        }
      );
    }
  }, [timeState.isApexActive, timeState.apexWindowName, timeState.dragonHourDisplay, timeState.solarTime, triggerApexFeedback]);

  // Synchronize 3D Scene Mode with active lab when user switches tabs & log action
  const handleTabSwitch = (tab: ChamberTab) => {
    setActiveTab(tab);
    setVisitedChambers((prev) => (prev.includes(tab) ? prev : [...prev, tab]));

    const tabNames: Record<ChamberTab, string> = {
      audio: '1. 432Hz Audio Synthesizer',
      cathie: '2. Bruce Cathie Harmonic Grid',
      cipher: '3. Geometric Vector Cipher',
      resonator: '4. Harmonic Resonator',
      nonary: '5. Dragon 9 Temporal Clock',
      config: '6. Sovereign Node Protocol',
      guide: '7. Model Progression Guide',
    };

    addLogEntry(
      'TAB_SWITCH',
      `Navigated to ${tabNames[tab]}`,
      `User switched workspace to ${tabNames[tab]}.`,
      { tab, totalChambersVisited: visitedChambers.includes(tab) ? visitedChambers.length : visitedChambers.length + 1 }
    );

    if (tab === 'audio') {
      setSceneMode('lissajous-wave');
    } else if (tab === 'resonator') {
      setSceneMode('lissajous-wave');
    } else if (tab === 'cathie') {
      setSceneMode('cathie-grid');
    } else if (tab === 'nonary') {
      setSceneMode('nonary-clock');
    } else if (tab === 'guide') {
      setSceneMode('sovereign-core');
    } else {
      setSceneMode('sovereign-core');
    }
  };

  const handleFocusComponent = (preset: string, mode: string) => {
    setCameraPreset(preset);
    setSceneMode(mode as SceneMode);
  };

  const handleAudioStateChange = (playing: boolean, freq: number) => {
    if (playing !== isAudioPlaying || freq !== audioFrequency) {
      addLogEntry(
        'AUDIO_SYNTH',
        playing ? 'Audio Oscillator Activated' : 'Audio Oscillator Silenced',
        `432Hz synthesizer state changed: ${playing ? 'ACTIVE (PLAYING)' : 'STANDBY'} at ${freq}Hz.`,
        { isPlaying: playing, frequency: freq }
      );
    }
    setIsAudioPlaying(playing);
    setAudioFrequency(freq);
  };

  const handleCathieGridChange = (val: number) => {
    if (val !== cathieGridVal) {
      addLogEntry(
        'GRID_UPDATE',
        'Cathie Grid Parameter Modified',
        `Updated Bruce Cathie harmonic reference coordinate N = ${val}.`,
        { referenceValue: val }
      );
    }
    setCathieGridVal(val);
  };

  const handleCipherGenerated = (res: { input: string; hash: string }) => {
    if (res.hash !== lastCipherHash) {
      addLogEntry(
        'CIPHER_GENERATE',
        'Geometric Vector Cipher Computed',
        `Generated vector cipher hash [${res.hash}] for payload "${res.input}".`,
        { input: res.input, hash: res.hash }
      );
    }
    setLastCipherHash(res.hash);
  };

  const handleTogglePulseSync = () => {
    const nextState = !(nodeConfig.pulseSync ?? false);
    setNodeConfig((prev) => ({
      ...prev,
      pulseSync: nextState,
    }));

    addLogEntry(
      'CONFIG_CHANGE',
      nextState ? 'Pulse Synchronization Mode Engaged' : 'Pulse Synchronization Mode Disengaged',
      nextState
        ? `3D mesh rotation velocity dynamically coupled to ${audioFrequency}Hz audio oscillator at ${(audioFrequency / 108).toFixed(1)}Hz pulse rate.`
        : 'Pulse Synchronization disengaged. 3D mesh rotation restored to constant rate.',
      {
        pulseSync: nextState,
        audioFrequency,
        pulseRateHz: Number((audioFrequency / 108).toFixed(1)),
      }
    );
  };

  const toggleGuide = () => {
    setIsGuideOpen((prev) => !prev);
  };

  const handleThemeChange = (nextTheme: AppTheme) => {
    if (nextTheme === theme) return;
    setTheme(nextTheme);
    const themeLabels: Record<AppTheme, string> = {
      'sovereign-dark': 'Sovereign Dark',
      'high-contrast-cyber': 'High-Contrast Cyber',
      'minimalist-lab': 'Minimalist Laboratory',
    };
    addLogEntry(
      'SYSTEM_EVENT',
      `UI Theme Switched: ${themeLabels[nextTheme]}`,
      `Applied Tailwind CSS variant theme "${themeLabels[nextTheme]}" (${nextTheme}).`,
      { previousTheme: theme, newTheme: nextTheme }
    );
  };

  const handleResetNodeConfig = () => {
    resetNodeConfig();
    setAudioFrequency(DEFAULT_NODE_CONFIG.harmonicBaseFrequency);
    addLogEntry(
      'CONFIG_CHANGE',
      'Node Configuration Reset to Defaults',
      `Restored nodeConfig to factory Dragon 9 baseline (${DEFAULT_NODE_CONFIG.codename}, ${DEFAULT_NODE_CONFIG.harmonicBaseFrequency}Hz) and updated localStorage.`,
      { codename: DEFAULT_NODE_CONFIG.codename, baseFrequency: DEFAULT_NODE_CONFIG.harmonicBaseFrequency }
    );
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'z' || e.key === 'Z') {
        setIsCinemaMode((prev) => !prev);
      } else if (e.key === 'g' || e.key === 'G') {
        setIsGuideOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { id: 'audio' as ChamberTab, label: '1. 432Hz Audio Synthesizer', icon: Waves, badge: isAudioPlaying ? 'PLAYING' : undefined },
    { id: 'cathie' as ChamberTab, label: '2. Bruce Cathie Harmonic Grid', icon: Globe },
    { id: 'cipher' as ChamberTab, label: '3. Geometric Vector Cipher', icon: Binary },
    { id: 'resonator' as ChamberTab, label: '4. Harmonic Resonator', icon: Layers },
    { id: 'nonary' as ChamberTab, label: '5. Dragon 9 Temporal Clock', icon: Clock, badge: timeState.isApexActive ? 'APEX' : undefined },
    { id: 'config' as ChamberTab, label: '6. Sovereign Node Protocol', icon: Cpu },
    { id: 'guide' as ChamberTab, label: '7. Model Progression Guide', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-[#030712] cyber:bg-black lab:bg-slate-50 text-slate-100 cyber:text-white lab:text-slate-900 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 lab:selection:bg-sky-200 lab:selection:text-slate-900 transition-colors">
      {/* Top Application Header */}
      <Header
        timeState={timeState}
        nodeConfig={nodeConfig}
        isCinemaMode={isCinemaMode}
        onToggleCinemaMode={() => setIsCinemaMode(!isCinemaMode)}
        show3DInSplit={show3DInSplit}
        onToggle3DSplit={() => setShow3DInSplit(!show3DInSplit)}
        onToggleGuide={toggleGuide}
        isGuideOpen={isGuideOpen || activeTab === 'guide'}
        theme={theme}
        onThemeChange={handleThemeChange}
        midiStatus={midi.status}
        midiDeviceCount={midi.devices.length}
        midiPulseActive={midiPulseActive}
        onOpenMidiModal={() => setIsMidiModalOpen(true)}
      />

      {/* Main Container Layout */}
      {isCinemaMode ? (
        /* ZEN / FULLSCREEN 3D MODE */
        <div className="relative flex-1 w-full h-[calc(100vh-65px)] overflow-hidden">
          <ThreeViewport
            sceneMode={sceneMode}
            isAudioPlaying={isAudioPlaying}
            frequency={audioFrequency}
            polarityAlpha={nodeConfig.polarityAlpha}
            polarityBeta={nodeConfig.polarityBeta}
            cameraPreset={cameraPreset}
            wireframeOnly={wireframeOnly}
            rotationSpeed={rotationSpeed}
            pulseSync={nodeConfig.pulseSync ?? false}
            timeState={timeState}
            onToggleGuide={toggleGuide}
            theme={theme}
            onRegisterLiveRefs={handleRegisterLiveRefs}
          />
          <ThreeControlDock
            sceneMode={sceneMode}
            onSceneModeChange={setSceneMode}
            cameraPreset={cameraPreset}
            onCameraPresetChange={setCameraPreset}
            wireframeOnly={wireframeOnly}
            onToggleWireframe={() => setWireframeOnly(!wireframeOnly)}
            rotationSpeed={rotationSpeed}
            onRotationSpeedChange={setRotationSpeed}
            pulseSync={nodeConfig.pulseSync ?? false}
            onTogglePulseSync={handleTogglePulseSync}
            isCinemaMode={isCinemaMode}
            onToggleCinemaMode={() => setIsCinemaMode(false)}
            polarityAlpha={nodeConfig.polarityAlpha}
            polarityBeta={nodeConfig.polarityBeta}
            onToggleGuide={toggleGuide}
            isGuideOpen={isGuideOpen}
            onOpenExport3D={() => setIsExport3DModalOpen(true)}
            onOpenVideoStudio={() => setIsVideoStudioOpen(true)}
          />

          {/* Collapsible Model Progression Drawer in Zen Mode */}
          {isGuideOpen && (
            <div className="absolute top-16 right-4 sm:right-8 z-30 max-w-xl w-[calc(100%-2rem)] max-h-[calc(100vh-170px)] overflow-y-auto">
              <ModelProgressionGuide
                timeState={timeState}
                nodeConfig={nodeConfig}
                onFocusComponent={handleFocusComponent}
                isAudioPlaying={isAudioPlaying}
                frequency={audioFrequency}
                gridReferenceValue={cathieGridVal}
                cipherGenerated={true}
                lastCipherHash={lastCipherHash}
                onNavigateToTab={handleTabSwitch}
                visitedChambers={visitedChambers}
              />
            </div>
          )}
        </div>
      ) : (
        /* STANDARD DUAL LAB WORKSPACE */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-65px)]">
          {/* Left Navigation Sidebar */}
          <aside className="w-full lg:w-72 bg-slate-950/70 cyber:bg-black lab:bg-white border-b lg:border-b-0 lg:border-r border-slate-800/80 cyber:border-cyan-400/60 lab:border-slate-200 p-3 sm:p-4 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto shrink-0 transition-colors">
            <div className="hidden lg:block text-[11px] font-mono uppercase tracking-wider text-slate-500 cyber:text-cyan-300 lab:text-slate-500 px-2 py-1">
              Chambers & Laboratories
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSwitch(item.id)}
                  className={`flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-xl border text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap text-left ${
                    isActive
                      ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/10 cyber:bg-cyan-400 cyber:text-black cyber:border-white lab:bg-sky-50 lab:border-sky-600 lab:text-sky-800 lab:shadow-none'
                      : 'bg-transparent border-slate-800/70 text-slate-400 hover:border-slate-700 hover:text-slate-200 cyber:border-cyan-900 cyber:text-zinc-200 cyber:hover:border-cyan-400 cyber:hover:text-white lab:border-slate-200 lab:text-slate-600 lab:hover:bg-slate-100 lab:hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400 cyber:text-black lab:text-sky-700' : 'text-slate-500 cyber:text-cyan-400 lab:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        item.badge === 'APEX'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 cyber:bg-yellow-300 cyber:text-black lab:bg-amber-100 lab:text-amber-800 lab:border-amber-300'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 cyber:bg-black cyber:text-cyan-300 lab:bg-sky-100 lab:text-sky-800 lab:border-sky-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Two-Pin Polarity Gauge in Sidebar (Desktop) */}
            <div className="hidden lg:flex flex-col gap-2 mt-auto pt-4 border-t border-slate-800/80 cyber:border-cyan-500/50 lab:border-slate-200">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 cyber:text-white lab:text-slate-500">
                <span>TWO-PIN POLARITY CORE</span>
                <span className="text-cyan-400 cyber:text-yellow-300 lab:text-sky-700 font-semibold">D9 HOMEOSTASIS</span>
              </div>
              <div className="h-2 w-full bg-slate-900 cyber:bg-zinc-900 lab:bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${nodeConfig.polarityAlpha}%` }}
                  className="bg-cyan-500 cyber:bg-cyan-400 lab:bg-sky-600 h-full transition-all duration-300"
                  title={`Alpha Grounding: ${nodeConfig.polarityAlpha}%`}
                />
                <div
                  style={{ width: `${nodeConfig.polarityBeta}%` }}
                  className="bg-fuchsia-500 cyber:bg-fuchsia-400 lab:bg-fuchsia-600 h-full transition-all duration-300"
                  title={`Beta Reactor: ${nodeConfig.polarityBeta}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono tabular-nums">
                <span className="text-cyan-400 cyber:text-cyan-300 lab:text-sky-700">α Static {nodeConfig.polarityAlpha}%</span>
                <span className="text-fuchsia-400 cyber:text-fuchsia-300 lab:text-fuchsia-700">β Reactor {nodeConfig.polarityBeta}%</span>
              </div>
            </div>
          </aside>

          {/* Center / Right Content Workspace */}
          <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950/40 cyber:bg-black lab:bg-slate-100/70 transition-colors">
            {/* Left/Top Half: Interactive 3D Viewport (When Split is Active) */}
            {show3DInSplit && (
              <div className="w-full lg:w-1/2 h-72 sm:h-96 lg:h-full relative border-b lg:border-b-0 lg:border-r border-slate-800/80 cyber:border-cyan-400/60 lab:border-slate-300 bg-slate-950/80 cyber:bg-black lab:bg-slate-900 shrink-0">
                <ThreeViewport
                  sceneMode={sceneMode}
                  isAudioPlaying={isAudioPlaying}
                  frequency={audioFrequency}
                  polarityAlpha={nodeConfig.polarityAlpha}
                  polarityBeta={nodeConfig.polarityBeta}
                  cameraPreset={cameraPreset}
                  wireframeOnly={wireframeOnly}
                  rotationSpeed={rotationSpeed}
                  pulseSync={nodeConfig.pulseSync ?? false}
                  timeState={timeState}
                  onToggleGuide={toggleGuide}
                  theme={theme}
                  onRegisterLiveRefs={handleRegisterLiveRefs}
                />
                <ThreeControlDock
                  sceneMode={sceneMode}
                  onSceneModeChange={setSceneMode}
                  cameraPreset={cameraPreset}
                  onCameraPresetChange={setCameraPreset}
                  wireframeOnly={wireframeOnly}
                  onToggleWireframe={() => setWireframeOnly(!wireframeOnly)}
                  rotationSpeed={rotationSpeed}
                  onRotationSpeedChange={setRotationSpeed}
                  pulseSync={nodeConfig.pulseSync ?? false}
                  onTogglePulseSync={handleTogglePulseSync}
                  isCinemaMode={isCinemaMode}
                  onToggleCinemaMode={() => setIsCinemaMode(true)}
                  polarityAlpha={nodeConfig.polarityAlpha}
                  polarityBeta={nodeConfig.polarityBeta}
                  onToggleGuide={toggleGuide}
                  isGuideOpen={isGuideOpen}
                  onOpenExport3D={() => setIsExport3DModalOpen(true)}
                  onOpenVideoStudio={() => setIsVideoStudioOpen(true)}
                />
              </div>
            )}

            {/* Right/Bottom Half: Selected Laboratory Chamber Panel */}
            <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${!show3DInSplit ? 'max-w-5xl mx-auto w-full' : ''}`}>
              <div className="bg-slate-900/40 cyber:bg-[#050811] lab:bg-white border border-slate-800/90 cyber:border-cyan-400/60 lab:border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xl lab:shadow-sm backdrop-blur-md lab:backdrop-blur-none transition-colors">
                {activeTab === 'audio' && (
                  <AudioSynthesizerLab
                    onAudioStateChange={handleAudioStateChange}
                    onLogEvent={addLogEntry}
                    theme={theme}
                    onOpenVideoStudio={() => setIsVideoStudioOpen(true)}
                    externalFrequency={audioFrequency}
                    externalIsPlaying={isAudioPlaying}
                    externalVolume={audioVolume}
                    onVolumeChange={setAudioVolume}
                    midiStatus={midi.status}
                    midiDeviceCount={midi.devices.length}
                    midiOscCc={oscFrequencyCc}
                    onOpenMidiModal={() => setIsMidiModalOpen(true)}
                  />
                )}
                {activeTab === 'cathie' && (
                  <CathieGridLab
                    gridValue={cathieGridVal}
                    onGridValueChange={handleCathieGridChange}
                    midiStatus={midi.status}
                    midiDeviceCount={midi.devices.length}
                    midiGridCc={cathieGridCc}
                    onOpenMidiModal={() => setIsMidiModalOpen(true)}
                  />
                )}
                {activeTab === 'cipher' && (
                  <VectorCipherLab
                    onCipherGenerated={handleCipherGenerated}
                    onLogEvent={addLogEntry}
                  />
                )}
                {activeTab === 'resonator' && (
                  <HarmonicResonatorLab
                    currentBaseFrequency={audioFrequency}
                    isAudioPlaying={isAudioPlaying}
                    onFrequencyChange={(freq) => {
                      setAudioFrequency(freq);
                    }}
                    onAudioStateChange={handleAudioStateChange}
                    onLogEvent={addLogEntry}
                    theme={theme}
                  />
                )}
                {activeTab === 'nonary' && (
                  <NonaryClockLab
                    theme={theme}
                    onTriggerApexFeedback={() => {
                      const targetWindow = timeState.isApexActive
                        ? timeState.apexWindowName
                        : timeState.dragonHour < 13.3333
                        ? 'Apex Alpha Alignment (Midday Harmonic Pivot)'
                        : 'Apex Beta Alignment (Midnight Nonary Genesis)';
                      triggerApexFeedback(targetWindow, true);
                      addLogEntry(
                        'SYSTEM_EVENT',
                        'Apex Visual Transition Preview Triggered',
                        `Triggered visual ripple & glow feedback for ${targetWindow}.`,
                        { simulated: true, apexWindowName: targetWindow }
                      );
                    }}
                  />
                )}
                {activeTab === 'config' && (
                  <DragonConfigLab
                    config={nodeConfig}
                    onConfigChange={setNodeConfig}
                    timeState={timeState}
                    isAudioPlaying={isAudioPlaying}
                    frequency={audioFrequency}
                    onAudioFrequencyChange={(freq) => handleAudioStateChange(isAudioPlaying, freq)}
                    cathieGridVal={cathieGridVal}
                    onGridValueChange={handleCathieGridChange}
                    lastCipherHash={lastCipherHash}
                    visitedChambers={visitedChambers}
                    logs={sessionLogs}
                    onClearLogs={handleClearLogs}
                    onAddTestEntry={handleAddTestEntry}
                    onLogEvent={addLogEntry}
                    onOpenExport3D={() => setIsExport3DModalOpen(true)}
                    onOpenVideoStudio={() => setIsVideoStudioOpen(true)}
                    onResetConfig={handleResetNodeConfig}
                    isConfigRestored={wasRestoredFromStorage}
                    theme={theme}
                  />
                )}
                {activeTab === 'guide' && (
                  <ModelProgressionGuide
                    timeState={timeState}
                    nodeConfig={nodeConfig}
                    onFocusComponent={handleFocusComponent}
                    isAudioPlaying={isAudioPlaying}
                    frequency={audioFrequency}
                    gridReferenceValue={cathieGridVal}
                    cipherGenerated={true}
                    lastCipherHash={lastCipherHash}
                    onNavigateToTab={handleTabSwitch}
                    visitedChambers={visitedChambers}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Export 3D Models Modal */}
      <Export3DModal
        isOpen={isExport3DModalOpen}
        onClose={() => setIsExport3DModalOpen(false)}
        sceneMode={sceneMode}
        frequency={audioFrequency}
        isAudioPlaying={isAudioPlaying}
        polarityAlpha={nodeConfig.polarityAlpha}
        polarityBeta={nodeConfig.polarityBeta}
        codename={nodeConfig.codename}
        getLiveRefs={getLive3DSnapshotRefs}
        onLogEvent={addLogEntry}
      />

      {/* Creative 3D Model Video Studio Modal (MP3 -> Video) */}
      <CreativeVideoStudioModal
        isOpen={isVideoStudioOpen}
        onClose={() => setIsVideoStudioOpen(false)}
        polarityAlpha={nodeConfig.polarityAlpha}
        polarityBeta={nodeConfig.polarityBeta}
        baseFrequency={audioFrequency}
        codename={nodeConfig.codename}
        onLogEvent={addLogEntry}
      />
      {/* Web MIDI Hardware Controller Modal */}
      <MidiControllerModal
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
        status={midi.status}
        errorMessage={midi.errorMessage}
        devices={midi.devices}
        mappings={midi.mappings}
        settings={midi.settings}
        learningTarget={midi.learningTarget}
        recentMessages={midi.recentMessages}
        currentFrequency={audioFrequency}
        currentGridVal={cathieGridVal}
        currentPolarityAlpha={nodeConfig.polarityAlpha}
        isAudioPlaying={isAudioPlaying}
        onConnectMidi={midi.connectMidi}
        onUpdateMapping={midi.updateMapping}
        onResetMappings={midi.resetMappings}
        onUpdateSettings={midi.updateSettings}
        onStartLearn={midi.startLearn}
        onCancelLearn={midi.cancelLearn}
        onClearMessages={midi.clearMessages}
        onSimulatePacket={midi.simulateMidiPacket}
      />
      {/* Screen-wide visual glow & ripple feedback on Nonary Clock Apex transition */}
      <ApexTransitionOverlay
        activeBurst={apexBurst}
        isApexActive={timeState.isApexActive}
        theme={theme}
      />
    </div>
  );
}
