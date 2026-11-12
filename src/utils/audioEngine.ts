import { SubHarmonicLayer } from '../types/dragon';

export type WaveformType = 'sine' | 'triangle' | 'sawtooth' | 'square';

export interface BinauralMode {
  enabled: boolean;
  beatHz: number; // e.g. 2, 6, 10, 18, 40
  category: 'Delta (Deep Sleep)' | 'Theta (Meditation)' | 'Alpha (Relaxation)' | 'Beta (Focus)' | 'Gamma (Peak Cognition)';
}

export interface AudioEngineState {
  isPlaying: boolean;
  frequency: number;
  waveform: WaveformType;
  volume: number; // 0 to 1
  binaural: BinauralMode;
  overtonesEnabled: boolean;
  subHarmonicsEnabled: boolean;
}

class DragonAudioEngine {
  private audioCtx: AudioContext | null = null;
  private primaryOsc: OscillatorNode | null = null;
  private primaryGain: GainNode | null = null;
  private secondaryOsc: OscillatorNode | null = null;
  private secondaryGain: GainNode | null = null;
  private pannerLeft: StereoPannerNode | null = null;
  private pannerRight: StereoPannerNode | null = null;
  private overtoneOscs: OscillatorNode[] = [];
  private overtoneGain: GainNode | null = null;
  private subHarmonicOscs: { id: string; osc: OscillatorNode; gainNode: GainNode; divisor: number }[] = [];
  private subHarmonicMasterGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  private isRunning: boolean = false;
  private currentFreq: number = 432;
  private currentWaveform: WaveformType = 'sine';
  private currentVolume: number = 0.15;
  private binauralState: BinauralMode = {
    enabled: false,
    beatHz: 6,
    category: 'Theta (Meditation)'
  };
  private overtonesActive: boolean = false;
  private subHarmonicsActive: boolean = false;
  private subHarmonicLayers: SubHarmonicLayer[] = [
    {
      id: 'sub-2',
      name: 'Sub-Octave 1 (f / 2)',
      divisor: 2,
      ratio: 0.5,
      enabled: true,
      gain: 0.5,
      title: 'First Sub-Octave',
      description: '216Hz fundamental undertone for acoustic physical grounding'
    },
    {
      id: 'sub-3',
      name: 'Cathie Undertone (f / 3)',
      divisor: 3,
      ratio: 1 / 3,
      enabled: false,
      gain: 0.4,
      title: 'Bruce Cathie Geodesic Harmonic',
      description: '144Hz undertone matching harmonic light-speed grid coordinate'
    },
    {
      id: 'sub-4',
      name: 'Nonary Sub-Bass (f / 4)',
      divisor: 4,
      ratio: 0.25,
      enabled: false,
      gain: 0.35,
      title: 'Second Sub-Octave',
      description: '108Hz Nonary temporal sub-bass resonance layer'
    },
    {
      id: 'sub-9',
      name: 'Infrasonic 9th (f / 9)',
      divisor: 9,
      ratio: 1 / 9,
      enabled: false,
      gain: 0.3,
      title: 'Sacred Nonary Root',
      description: '48Hz infrasonic sub-harmonic base vibration'
    }
  ];

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.85;

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.audioCtx.currentTime);
      
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public async start(): Promise<boolean> {
    try {
      this.initContext();
      if (!this.audioCtx || !this.masterGain) return false;

      this.stop(); // Clean up any active nodes
      const now = this.audioCtx.currentTime;

      if (this.binauralState.enabled) {
        // Binaural setup: 2 separate oscillators panned -1 and +1
        const delta = this.binauralState.beatHz;
        const leftFreq = Math.max(20, this.currentFreq - delta / 2);
        const rightFreq = this.currentFreq + delta / 2;

        this.primaryOsc = this.audioCtx.createOscillator();
        this.primaryOsc.type = this.currentWaveform;
        this.primaryOsc.frequency.setValueAtTime(leftFreq, now);

        this.primaryGain = this.audioCtx.createGain();
        this.primaryGain.gain.setValueAtTime(0.5, now);

        this.secondaryOsc = this.audioCtx.createOscillator();
        this.secondaryOsc.type = this.currentWaveform;
        this.secondaryOsc.frequency.setValueAtTime(rightFreq, now);

        this.secondaryGain = this.audioCtx.createGain();
        this.secondaryGain.gain.setValueAtTime(0.5, now);

        try {
          this.pannerLeft = this.audioCtx.createStereoPanner();
          this.pannerLeft.pan.setValueAtTime(-1, now);
          this.pannerRight = this.audioCtx.createStereoPanner();
          this.pannerRight.pan.setValueAtTime(1, now);

          this.primaryOsc.connect(this.primaryGain);
          this.primaryGain.connect(this.pannerLeft);
          this.pannerLeft.connect(this.masterGain);

          this.secondaryOsc.connect(this.secondaryGain);
          this.secondaryGain.connect(this.pannerRight);
          this.pannerRight.connect(this.masterGain);
        } catch {
          // Fallback if StereoPannerNode unsupported in older environments
          this.primaryOsc.connect(this.primaryGain);
          this.primaryGain.connect(this.masterGain);
          this.secondaryOsc.connect(this.secondaryGain);
          this.secondaryGain.connect(this.masterGain);
        }

        this.primaryOsc.start();
        this.secondaryOsc.start();
      } else {
        // Monophonic / Natural Harmonic setup
        this.primaryOsc = this.audioCtx.createOscillator();
        this.primaryOsc.type = this.currentWaveform;
        this.primaryOsc.frequency.setValueAtTime(this.currentFreq, now);

        this.primaryGain = this.audioCtx.createGain();
        this.primaryGain.gain.setValueAtTime(0.8, now);

        this.primaryOsc.connect(this.primaryGain);
        this.primaryGain.connect(this.masterGain);
        this.primaryOsc.start();
      }

      // Harmonic Overtones
      if (this.overtonesActive) {
        this.overtoneGain = this.audioCtx.createGain();
        this.overtoneGain.gain.setValueAtTime(0.12, now);
        this.overtoneGain.connect(this.masterGain);

        const ratios = [2, 3, 4, 9]; // Nonary 9th overtone
        this.overtoneOscs = ratios.map((r, i) => {
          const osc = this.audioCtx!.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(this.currentFreq * r, now);
          const subGain = this.audioCtx!.createGain();
          subGain.gain.setValueAtTime(1 / (i + 2), now);
          osc.connect(subGain);
          subGain.connect(this.overtoneGain!);
          osc.start();
          return osc;
        });
      }

      // Harmonic Resonator (Sub-Harmonic Layers)
      if (this.subHarmonicsActive) {
        this.subHarmonicMasterGain = this.audioCtx.createGain();
        this.subHarmonicMasterGain.gain.setValueAtTime(0.28, now);
        this.subHarmonicMasterGain.connect(this.masterGain);

        this.subHarmonicLayers.forEach((layer) => {
          if (!layer.enabled) return;
          const osc = this.audioCtx!.createOscillator();
          osc.type = 'sine';
          const subFreq = Math.max(10, this.currentFreq / layer.divisor);
          osc.frequency.setValueAtTime(subFreq, now);

          const layerGain = this.audioCtx!.createGain();
          layerGain.gain.setValueAtTime(layer.gain * 0.45, now);

          osc.connect(layerGain);
          layerGain.connect(this.subHarmonicMasterGain!);
          osc.start();

          this.subHarmonicOscs.push({
            id: layer.id,
            osc,
            gainNode: layerGain,
            divisor: layer.divisor,
          });
        });
      }

      this.isRunning = true;
      return true;
    } catch (e) {
      console.error('Audio engine start failed', e);
      return false;
    }
  }

  public stop(): void {
    if (this.primaryOsc) {
      try {
        this.primaryOsc.stop();
        this.primaryOsc.disconnect();
      } catch { /* ignore */ }
      this.primaryOsc = null;
    }
    if (this.secondaryOsc) {
      try {
        this.secondaryOsc.stop();
        this.secondaryOsc.disconnect();
      } catch { /* ignore */ }
      this.secondaryOsc = null;
    }
    this.overtoneOscs.forEach(o => {
      try {
        o.stop();
        o.disconnect();
      } catch { /* ignore */ }
    });
    this.overtoneOscs = [];

    this.subHarmonicOscs.forEach(entry => {
      try {
        entry.osc.stop();
        entry.osc.disconnect();
        entry.gainNode.disconnect();
      } catch { /* ignore */ }
    });
    this.subHarmonicOscs = [];

    if (this.subHarmonicMasterGain) {
      try {
        this.subHarmonicMasterGain.disconnect();
      } catch { /* ignore */ }
      this.subHarmonicMasterGain = null;
    }

    this.isRunning = false;
  }

  public setFrequency(freq: number): void {
    this.currentFreq = Math.max(20, Math.min(2000, freq));
    if (this.audioCtx && this.isRunning) {
      const now = this.audioCtx.currentTime;
      if (this.binauralState.enabled && this.primaryOsc && this.secondaryOsc) {
        const delta = this.binauralState.beatHz;
        this.primaryOsc.frequency.setTargetAtTime(Math.max(20, this.currentFreq - delta / 2), now, 0.05);
        this.secondaryOsc.frequency.setTargetAtTime(this.currentFreq + delta / 2, now, 0.05);
      } else if (this.primaryOsc) {
        this.primaryOsc.frequency.setTargetAtTime(this.currentFreq, now, 0.05);
      }

      if (this.overtoneOscs.length > 0) {
        const ratios = [2, 3, 4, 9];
        this.overtoneOscs.forEach((osc, i) => {
          osc.frequency.setTargetAtTime(this.currentFreq * ratios[i], now, 0.05);
        });
      }

      if (this.subHarmonicOscs.length > 0) {
        this.subHarmonicOscs.forEach(entry => {
          const subFreq = Math.max(10, this.currentFreq / entry.divisor);
          entry.osc.frequency.setTargetAtTime(subFreq, now, 0.05);
        });
      }
    }
  }

  public setWaveform(waveform: WaveformType): void {
    this.currentWaveform = waveform;
    if (this.primaryOsc) this.primaryOsc.type = waveform;
    if (this.secondaryOsc) this.secondaryOsc.type = waveform;
  }

  public setVolume(vol: number): void {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.audioCtx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.audioCtx.currentTime, 0.03);
    }
  }

  public setBinaural(binaural: BinauralMode): void {
    this.binauralState = binaural;
    if (this.isRunning) {
      this.start(); // reconfigure node graph for stereo binaural
    }
  }

  public setOvertones(active: boolean): void {
    this.overtonesActive = active;
    if (this.isRunning) {
      this.start();
    }
  }

  public setSubHarmonicResonance(active: boolean): void {
    this.subHarmonicsActive = active;
    if (this.isRunning) {
      this.start();
    }
  }

  public toggleSubHarmonicLayer(id: string, enabled?: boolean): void {
    this.subHarmonicLayers = this.subHarmonicLayers.map(layer => {
      if (layer.id === id) {
        return {
          ...layer,
          enabled: enabled !== undefined ? enabled : !layer.enabled,
        };
      }
      return layer;
    });

    if (this.isRunning && this.subHarmonicsActive) {
      this.start();
    }
  }

  public setSubHarmonicLayerGain(id: string, gain: number): void {
    this.subHarmonicLayers = this.subHarmonicLayers.map(layer => {
      if (layer.id === id) {
        return { ...layer, gain: Math.max(0, Math.min(1, gain)) };
      }
      return layer;
    });

    if (this.audioCtx && this.isRunning) {
      const entry = this.subHarmonicOscs.find(e => e.id === id);
      if (entry) {
        entry.gainNode.gain.setTargetAtTime(gain * 0.45, this.audioCtx.currentTime, 0.03);
      }
    }
  }

  public getSubHarmonicLayers(): SubHarmonicLayer[] {
    return [...this.subHarmonicLayers];
  }

  public getSubHarmonicsActive(): boolean {
    return this.subHarmonicsActive;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getFrequency(): number {
    return this.currentFreq;
  }

  public getVolume(): number {
    return this.currentVolume;
  }
}

export const audioEngine = new DragonAudioEngine();
