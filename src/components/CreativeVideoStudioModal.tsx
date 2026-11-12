import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Film,
  Music,
  Upload,
  Play,
  Square,
  Download,
  X,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Video,
  Sliders,
  Eye,
} from 'lucide-react';
import {
  createCreativeVideoStage,
  CreativeVideoStageHandle,
  pickSupportedVideoMimeType,
  VIDEO_RESOLUTIONS,
  VideoResolutionOption,
  VideoShowcasePreset,
} from '../utils/creativeVideoScene';
import { LogCategory } from '../types/dragon';

interface CreativeVideoStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  polarityAlpha: number;
  polarityBeta: number;
  baseFrequency: number;
  codename: string;
  onLogEvent?: (category: LogCategory, title: string, details: string, metadata?: Record<string, any>) => void;
}

interface LoadedAudioInfo {
  fileName: string;
  fileSizeBytes: number;
  durationSec: number;
  sampleRate: number;
  channels: number;
  waveformPeaks: number[];
}

const SHOWCASE_PRESETS: { id: VideoShowcasePreset; label: string; description: string }[] = [
  {
    id: 'auto-director',
    label: 'Auto-Director Cutaway',
    description: 'Dynamic multi-angle orbital & elevation sweeps across all creative 3D models',
  },
  {
    id: 'orbit-showcase',
    label: 'Full Ecosystem 360° Orbit',
    description: 'Continuous wide showcase of Sovereign Core, Cathie Sphere, Cymatic Shell & FFT Halo',
  },
  {
    id: 'sovereign-core',
    label: 'Sovereign Core Closeup',
    description: 'Focused on TorusKnot (3,4) shader interference, Dodecahedron Heart & α/β Poles',
  },
  {
    id: 'cathie-grid',
    label: 'Cathie Geodesic Lattice',
    description: 'High-angle inspection of the 144k arc-min geodesic sphere & 5 planetary beacons',
  },
];

const CLIP_DURATION_OPTIONS = [
  { id: '15', label: '15s Clip', seconds: 15 },
  { id: '30', label: '30s Clip', seconds: 30 },
  { id: '60', label: '60s Clip', seconds: 60 },
  { id: 'full', label: 'Full Track', seconds: Infinity },
] as const;

export const CreativeVideoStudioModal: React.FC<CreativeVideoStudioModalProps> = ({
  isOpen,
  onClose,
  polarityAlpha,
  polarityBeta,
  baseFrequency,
  codename,
  onLogEvent,
}) => {
  const previewMountRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<CreativeVideoStageHandle | null>(null);
  const animFrameRef = useRef<number>(0);

  // Audio decode & live playback refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const monitorGainRef = useRef<GainNode | null>(null);
  const recordDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Component state
  const [loadedAudio, setLoadedAudio] = useState<LoadedAudioInfo | null>(null);
  const [isDecodingAudio, setIsDecodingAudio] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [showcasePreset, setShowcasePreset] = useState<VideoShowcasePreset>('auto-director');
  const [resolutionId, setResolutionId] = useState<VideoResolutionOption['id']>('hd-720');
  const [clipDurationId, setClipDurationId] = useState<'15' | '30' | '60' | 'full'>('15');
  const [fps, setFps] = useState<30 | 60>(30);
  const [showHudOverlay, setShowHudOverlay] = useState<boolean>(true);
  const [monitorAudio, setMonitorAudio] = useState<boolean>(true);

  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [generatedVideo, setGeneratedVideo] = useState<{
    url: string;
    filename: string;
    ext: 'mp4' | 'webm';
    sizeBytes: number;
    durationSec: number;
  } | null>(null);

  const selectedResolution = useMemo(
    () => VIDEO_RESOLUTIONS.find((r) => r.id === resolutionId) ?? VIDEO_RESOLUTIONS[0],
    [resolutionId]
  );

  const targetDurationSec = useMemo(() => {
    const trackLen = loadedAudio?.durationSec ?? 15;
    if (clipDurationId === 'full') return Math.max(5, trackLen);
    const cap = Number(clipDurationId);
    return loadedAudio ? Math.min(cap, trackLen) : cap;
  }, [loadedAudio, clipDurationId]);

  // Mutable ref keeping render loop synced without tearing down stage
  const loopParamsRef = useRef({
    showcasePreset,
    polarityAlpha,
    polarityBeta,
    baseFrequency,
    showHudOverlay,
    trackTitle: loadedAudio?.fileName ?? `${codename} · ${baseFrequency}Hz Harmonic Showcase`,
    targetDurationSec,
    isRecording,
    isPreviewPlaying,
  });

  useEffect(() => {
    loopParamsRef.current = {
      showcasePreset,
      polarityAlpha,
      polarityBeta,
      baseFrequency,
      showHudOverlay,
      trackTitle: loadedAudio?.fileName ?? `${codename} · ${baseFrequency}Hz Harmonic Showcase`,
      targetDurationSec,
      isRecording,
      isPreviewPlaying,
    };
  }, [
    showcasePreset,
    polarityAlpha,
    polarityBeta,
    baseFrequency,
    showHudOverlay,
    loadedAudio,
    codename,
    targetDurationSec,
    isRecording,
    isPreviewPlaying,
  ]);

  // Sync monitor speaker gain dynamically
  useEffect(() => {
    if (monitorGainRef.current && audioCtxRef.current) {
      monitorGainRef.current.gain.setTargetAtTime(
        monitorAudio ? 0.85 : 0,
        audioCtxRef.current.currentTime,
        0.03
      );
    }
  }, [monitorAudio]);

  // Stop any running audio + recording cleanly
  const stopPlaybackAndRecording = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {
        // already stopped
      }
      sourceNodeRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    setIsPreviewPlaying(false);
    setIsRecording(false);
  }, []);

  // Initialize & clean up dedicated Creative 3D Stage whenever modal opens
  useEffect(() => {
    if (!isOpen) {
      stopPlaybackAndRecording();
      return;
    }

    const container = previewMountRef.current;
    if (!container) return;

    const stage = createCreativeVideoStage({
      width: selectedResolution.width,
      height: selectedResolution.height,
      polarityAlpha,
      polarityBeta,
      baseFrequency,
    });
    stageRef.current = stage;

    stage.outputCanvas.className = 'w-full h-full object-contain block rounded-xl';
    container.innerHTML = '';
    container.appendChild(stage.outputCanvas);

    let lastNow = performance.now();
    let freqData: Uint8Array<ArrayBuffer> | null = null;
    let timeData: Float32Array<ArrayBuffer> | null = null;
    let startTimestamp = performance.now();
    let lastTimerUiTick = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastNow) / 1000);
      lastNow = now;

      const p = loopParamsRef.current;
      const isActive = p.isPreviewPlaying || p.isRecording;
      if (!isActive) {
        startTimestamp = now;
      }
      const elapsed = isActive ? (now - startTimestamp) / 1000 : now * 0.001;

      const analyser = analyserRef.current;
      let bass = 0.12 + 0.08 * Math.sin(now * 0.003);
      let mid = 0.14 + 0.06 * Math.cos(now * 0.0022);
      let high = 0.1 + 0.05 * Math.sin(now * 0.0041);
      let rms = 0.12;

      if (isActive && analyser && audioBufferRef.current) {
        if (!freqData || freqData.length !== analyser.frequencyBinCount) {
          freqData = new Uint8Array(analyser.frequencyBinCount);
        }
        if (!timeData || timeData.length !== analyser.fftSize) {
          timeData = new Float32Array(analyser.fftSize);
        }
        analyser.getByteFrequencyData(freqData);
        analyser.getFloatTimeDomainData(timeData);

        // Compute Bass (bins 0..10), Mid (11..55), High (56..160)
        let bSum = 0;
        for (let i = 0; i <= 10 && i < freqData.length; i++) bSum += freqData[i];
        bass = bSum / (11 * 255);

        let mSum = 0;
        for (let i = 11; i <= 55 && i < freqData.length; i++) mSum += freqData[i];
        mid = mSum / (45 * 255);

        let hSum = 0;
        for (let i = 56; i <= 160 && i < freqData.length; i++) hSum += freqData[i];
        high = hSum / (105 * 255);

        let sqSum = 0;
        for (let i = 0; i < timeData.length; i++) sqSum += timeData[i] * timeData[i];
        rms = Math.sqrt(sqSum / timeData.length);
      }

      stage.renderFrame({
        elapsedSec: elapsed,
        dtSec: dt,
        preset: p.showcasePreset,
        bassEnergy: bass,
        midEnergy: mid,
        highEnergy: high,
        overallRms: rms,
        freqData: isActive && audioBufferRef.current ? freqData : null,
        timeData: isActive && audioBufferRef.current ? timeData : null,
        polarityAlpha: p.polarityAlpha,
        polarityBeta: p.polarityBeta,
        baseFrequency: p.baseFrequency,
        trackTitle: p.trackTitle,
        totalDurationSec: p.targetDurationSec,
        showHudOverlay: p.showHudOverlay,
      });

      if (isActive && now - lastTimerUiTick > 100) {
        lastTimerUiTick = now;
        setElapsedSec(elapsed);
        if (p.isRecording && elapsed >= p.targetDurationSec) {
          stopPlaybackAndRecording();
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      stopPlaybackAndRecording();
      stage.dispose();
      stageRef.current = null;
      if (container) container.innerHTML = '';
    };
    // Intentionally initialize once when modal opens; resolution updates handled via stage.resize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, stopPlaybackAndRecording]);

  // Update stage resolution without destroying WebGL context
  useEffect(() => {
    if (stageRef.current && !isRecording) {
      stageRef.current.resize(selectedResolution.width, selectedResolution.height);
    }
  }, [selectedResolution, isRecording]);

  // Revoke previous generated video ObjectURL when replaced or unmounted
  useEffect(() => {
    const url = generatedVideo?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [generatedVideo?.url]);

  // Close AudioContext only when modal component unmounts
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const ensureAudioContextGraph = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new Ctx();
      analyserRef.current = null;
      monitorGainRef.current = null;
      recordDestRef.current = null;
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.82;
      analyserRef.current = analyser;
    }

    if (!monitorGainRef.current) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(monitorAudio ? 0.85 : 0, ctx.currentTime);
      gain.connect(ctx.destination);
      monitorGainRef.current = gain;
    }

    if (!recordDestRef.current) {
      recordDestRef.current = ctx.createMediaStreamDestination();
    }

    if (analyserRef.current && monitorGainRef.current && recordDestRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // ignore if not previously connected
      }
      analyserRef.current.connect(monitorGainRef.current);
      analyserRef.current.connect(recordDestRef.current);
    }

    return ctx;
  }, [monitorAudio]);

  const handleFileUpload = async (file: File | null | undefined) => {
    if (!file) return;
    stopPlaybackAndRecording();
    setAudioError(null);
    setIsDecodingAudio(true);

    try {
      const ctx = ensureAudioContextGraph();
      const arrayBuf = await file.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
      audioBufferRef.current = decoded;

      // Compute compact 64-bar waveform thumbnail
      const channelData = decoded.getChannelData(0);
      const barCount = 64;
      const step = Math.max(1, Math.floor(channelData.length / barCount));
      const peaks: number[] = [];
      for (let i = 0; i < barCount; i++) {
        let maxAbs = 0;
        const start = i * step;
        const end = Math.min(channelData.length, start + step);
        const stride = Math.max(1, Math.floor((end - start) / 48));
        for (let j = start; j < end; j += stride) {
          const val = Math.abs(channelData[j]);
          if (val > maxAbs) maxAbs = val;
        }
        peaks.push(Math.max(0.08, Math.min(1, maxAbs)));
      }

      setLoadedAudio({
        fileName: file.name,
        fileSizeBytes: file.size,
        durationSec: decoded.duration,
        sampleRate: decoded.sampleRate,
        channels: decoded.numberOfChannels,
        waveformPeaks: peaks,
      });

      if (onLogEvent) {
        onLogEvent(
          'AUDIO_SYNTH',
          `MP3 Track Loaded: ${file.name}`,
          `Decoded audio track (${decoded.duration.toFixed(1)}s, ${decoded.sampleRate}Hz, ${decoded.numberOfChannels}ch) for Creative 3D Video Studio.`,
          {
            fileName: file.name,
            durationSec: Number(decoded.duration.toFixed(2)),
            sampleRate: decoded.sampleRate,
            channels: decoded.numberOfChannels,
          }
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to decode audio file. Please upload a valid MP3/audio track.';
      setAudioError(msg);
      audioBufferRef.current = null;
      setLoadedAudio(null);
    } finally {
      setIsDecodingAudio(false);
    }
  };

  const startAudioStreamPlayback = () => {
    const ctx = ensureAudioContextGraph();
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {
        // ignore
      }
    }

    if (!audioBufferRef.current || !analyserRef.current || !monitorGainRef.current || !recordDestRef.current) {
      return;
    }

    const src = ctx.createBufferSource();
    src.buffer = audioBufferRef.current;
    src.connect(analyserRef.current);
    src.onended = () => {
      if (loopParamsRef.current.isRecording) {
        stopPlaybackAndRecording();
      } else {
        setIsPreviewPlaying(false);
      }
    };
    src.start(0);
    sourceNodeRef.current = src;
  };

  const handleTogglePreview = () => {
    if (isPreviewPlaying) {
      stopPlaybackAndRecording();
      return;
    }
    setAudioError(null);
    setElapsedSec(0);
    if (audioBufferRef.current) {
      startAudioStreamPlayback();
    }
    setIsPreviewPlaying(true);
  };

  const handleStartRecording = () => {
    if (!stageRef.current) return;
    if (typeof MediaRecorder === 'undefined') {
      setAudioError('Video generation via MediaRecorder is not supported in this browser.');
      return;
    }

    stopPlaybackAndRecording();
    setAudioError(null);
    setElapsedSec(0);

    if (generatedVideo?.url) {
      URL.revokeObjectURL(generatedVideo.url);
      setGeneratedVideo(null);
    }

    const ctx = ensureAudioContextGraph();
    if (audioBufferRef.current) {
      startAudioStreamPlayback();
    }

    const canvasStream = stageRef.current.outputCanvas.captureStream(fps);
    const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

    if (audioBufferRef.current && recordDestRef.current) {
      // Ensure AudioContext stays active during recording
      if (ctx.state === 'suspended') ctx.resume();
      const audioTracks = recordDestRef.current.stream.getAudioTracks();
      audioTracks.forEach((t) => combinedTracks.push(t));
    }

    const combinedStream = new MediaStream(combinedTracks);
    const { mimeType, ext } = pickSupportedVideoMimeType();

    try {
      const recorderOptions: MediaRecorderOptions = {
        videoBitsPerSecond: resolutionId === 'fhd-1080' ? 9_000_000 : 6_000_000,
      };
      if (mimeType) recorderOptions.mimeType = mimeType;

      const recorder = new MediaRecorder(combinedStream, recorderOptions);
      recordedChunksRef.current = [];
      const startedAt = performance.now();

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          recordedChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        const finalType = mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: finalType });
        const url = URL.createObjectURL(blob);
        const slug = (loadedAudio?.fileName.replace(/\.[^/.]+$/, '') || codename)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-');
        const filename = `dragon9-${slug}-${showcasePreset}-${selectedResolution.width}x${selectedResolution.height}.${ext}`;
        const actualDur = Math.max(0.5, (performance.now() - startedAt) / 1000);

        setGeneratedVideo({
          url,
          filename,
          ext,
          sizeBytes: blob.size,
          durationSec: actualDur,
        });
        setIsRecording(false);
        setIsPreviewPlaying(false);

        if (onLogEvent) {
          onLogEvent(
            'SYSTEM_EVENT',
            `Creative 3D Video Generated: ${filename}`,
            `Rendered ${actualDur.toFixed(1)}s ${selectedResolution.label} @ ${fps}fps (${(blob.size / (1024 * 1024)).toFixed(2)} MB) displaying ${showcasePreset} models${loadedAudio ? ` with MP3 "${loadedAudio.fileName}"` : ''}.`,
            {
              filename,
              format: ext.toUpperCase(),
              resolution: `${selectedResolution.width}x${selectedResolution.height}`,
              fps,
              durationSec: Number(actualDur.toFixed(1)),
              mp3Track: loadedAudio?.fileName ?? null,
              sizeBytes: blob.size,
            }
          );
        }
      };

      recorder.onerror = () => {
        setAudioError('MediaRecorder encountered an error while encoding the video stream.');
        stopPlaybackAndRecording();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
      setIsPreviewPlaying(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize video encoder.';
      setAudioError(msg);
      stopPlaybackAndRecording();
    }
  };

  if (!isOpen) return null;

  const formatTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const progressPct = Math.min(100, Math.round((elapsedSec / Math.max(1, targetDurationSec)) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 cyber:bg-black/90 lab:bg-slate-900/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="creative-video-studio-title"
    >
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-slate-950 cyber:bg-black lab:bg-white border border-cyan-500/40 cyber:border-cyan-400 lab:border-slate-300 rounded-2xl shadow-2xl text-slate-100 cyber:text-white lab:text-slate-900 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800 cyber:border-cyan-500/50 lab:border-slate-200 sticky top-0 bg-slate-950 cyber:bg-black lab:bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-fuchsia-500/15 cyber:bg-cyan-400/20 lab:bg-sky-100 border border-fuchsia-500/40 cyber:border-cyan-400 lab:border-sky-300 flex items-center justify-center">
              <Film className="w-4 h-4 text-fuchsia-400 cyber:text-cyan-300 lab:text-sky-700" />
            </div>
            <div>
              <h3
                id="creative-video-studio-title"
                className="text-sm sm:text-base font-bold tracking-wide text-cyan-300 cyber:text-cyan-300 lab:text-sky-800"
              >
                MP3 → Creative 3D Model Video Studio
              </h3>
              <p className="text-[11px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
                Upload an MP3 track to drive Sovereign Core, Cathie Sphere &amp; Cymatic 3D models and render downloadable video
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopPlaybackAndRecording();
              onClose();
            }}
            aria-label="Close Creative 3D Video Studio"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 cyber:text-cyan-300 cyber:hover:bg-cyan-950 lab:text-slate-500 lab:hover:text-slate-900 lab:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Controls Column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Step 1: Add MP3 Track */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5" />
                  1. Add MP3 Audio Track
                </span>
                {loadedAudio && (
                  <span className="text-[10px] font-mono text-emerald-300 cyber:text-yellow-300 lab:text-emerald-700 font-bold">
                    {formatTime(loadedAudio.durationSec)} READY
                  </span>
                )}
              </div>

              <label
                className={`flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                  loadedAudio
                    ? 'border-emerald-500/50 bg-emerald-950/20 cyber:border-cyan-400 cyber:bg-cyan-950/20 lab:border-emerald-400 lab:bg-emerald-50/60'
                    : 'border-cyan-500/40 bg-slate-950/70 hover:border-cyan-400 cyber:border-cyan-400/70 cyber:bg-black lab:border-slate-300 lab:bg-white lab:hover:border-sky-600'
                }`}
              >
                <Upload className="w-5 h-5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-700" />
                <span className="text-xs font-semibold text-slate-200 cyber:text-white lab:text-slate-800 text-center">
                  {isDecodingAudio
                    ? 'Decoding MP3 audio stream...'
                    : loadedAudio
                    ? loadedAudio.fileName
                    : 'Click to upload .MP3 (or WAV / OGG / M4A)'}
                </span>
                <span className="text-[10px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-500">
                  {loadedAudio
                    ? `${(loadedAudio.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB · ${(loadedAudio.sampleRate / 1000).toFixed(1)} kHz · ${loadedAudio.channels}ch`
                    : 'Audio FFT & Bass Envelope drive live 3D meshes'}
                </span>
                <input
                  type="file"
                  accept=".mp3,audio/mpeg,audio/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                />
              </label>

              {/* Decoded Waveform Strip */}
              {loadedAudio && (
                <div className="h-9 flex items-end gap-0.5 px-2 py-1.5 rounded-lg bg-slate-950 cyber:bg-black lab:bg-slate-900 border border-slate-800 cyber:border-cyan-500/40">
                  {loadedAudio.waveformPeaks.map((pk, idx) => (
                    <div
                      key={idx}
                      className="flex-1 rounded-xs bg-gradient-to-t from-cyan-500 to-fuchsia-400"
                      style={{ height: `${Math.round(pk * 100)}%` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Creative Model Showcase Mode */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                2. Creative Models Choreography
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {SHOWCASE_PRESETS.map((p) => {
                  const active = showcasePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setShowcasePreset(p.id)}
                      className={`text-left p-2 rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'bg-cyan-500/15 border-cyan-400 cyber:bg-cyan-950 cyber:border-cyan-300 lab:bg-sky-50 lab:border-sky-600'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 cyber:bg-black cyber:border-cyan-900 lab:bg-white lab:border-slate-200'
                      }`}
                    >
                      <div className={`text-xs font-bold ${active ? 'text-cyan-200 cyber:text-white lab:text-sky-900' : 'text-slate-200 cyber:text-zinc-200 lab:text-slate-800'}`}>
                        {p.label}
                      </div>
                      <div className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600 leading-tight mt-0.5">
                        {p.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Render Settings */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                3. Video Encoding Options
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600">Resolution</label>
                  <select
                    value={resolutionId}
                    disabled={isRecording}
                    onChange={(e) => setResolutionId(e.target.value as VideoResolutionOption['id'])}
                    className="bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-500/60 lab:border-slate-300 text-slate-200 cyber:text-white lab:text-slate-900 rounded-lg px-2 py-1.5 text-[11px] cursor-pointer"
                  >
                    {VIDEO_RESOLUTIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600">Frame Rate</label>
                  <select
                    value={fps}
                    disabled={isRecording}
                    onChange={(e) => setFps(Number(e.target.value) as 30 | 60)}
                    className="bg-slate-950 cyber:bg-black lab:bg-white border border-slate-800 cyber:border-cyan-500/60 lab:border-slate-300 text-slate-200 cyber:text-white lab:text-slate-900 rounded-lg px-2 py-1.5 text-[11px] cursor-pointer"
                  >
                    <option value={30}>30 FPS (Smooth)</option>
                    <option value={60}>60 FPS (Ultra Fluid)</option>
                  </select>
                </div>
              </div>

              {/* Duration Pills */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600 block">
                  Clip Duration ({formatTime(targetDurationSec)})
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {CLIP_DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isRecording}
                      onClick={() => setClipDurationId(opt.id)}
                      className={`py-1 px-1.5 rounded-lg border text-[10px] font-mono transition-colors cursor-pointer ${
                        clipDurationId === opt.id
                          ? 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400 font-bold cyber:bg-yellow-300 cyber:text-black lab:bg-sky-700 lab:text-white lab:border-sky-800'
                          : 'bg-slate-950 text-slate-400 border-slate-800 cyber:bg-black cyber:text-zinc-200 cyber:border-cyan-500/40 lab:bg-white lab:text-slate-700 lab:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 cyber:text-white lab:text-slate-700">
                  <input
                    type="checkbox"
                    checked={showHudOverlay}
                    onChange={(e) => setShowHudOverlay(e.target.checked)}
                    className="accent-cyan-500 lab:accent-sky-700 cursor-pointer"
                  />
                  <span>Burn-In Telemetry HUD</span>
                </label>

                <button
                  type="button"
                  onClick={() => setMonitorAudio((v) => !v)}
                  className="flex items-center gap-1 px-2 py-1 rounded border border-slate-700 bg-slate-950 text-slate-300 hover:text-cyan-300 cyber:bg-black cyber:border-cyan-500/50 cyber:text-white lab:bg-white lab:border-slate-300 lab:text-slate-700 text-[10px] cursor-pointer"
                >
                  {monitorAudio ? <Volume2 className="w-3 h-3 text-emerald-400 lab:text-emerald-600" /> : <VolumeX className="w-3 h-3 text-slate-500" />}
                  <span>{monitorAudio ? 'Speaker Monitor ON' : 'Silent Monitor'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Preview & Render Output Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Live 3D WebGL Composition Viewport */}
            <div className="bg-slate-900/70 cyber:bg-black lab:bg-slate-100 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-300 rounded-xl p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300 cyber:text-cyan-300 lab:text-slate-700 flex items-center gap-1.5 font-bold">
                  <Eye className="w-3.5 h-3.5 text-cyan-400 lab:text-sky-700" />
                  LIVE 3D VIDEO STAGE PREVIEW ({selectedResolution.width}×{selectedResolution.height})
                </span>
                {isRecording ? (
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/50 cyber:bg-rose-500 cyber:text-black font-bold tabular-nums">
                    ● RECORDING {formatTime(elapsedSec)} / {formatTime(targetDurationSec)}
                  </span>
                ) : isPreviewPlaying ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 cyber:bg-emerald-400 cyber:text-black font-bold tabular-nums">
                    ▶ PREVIEW {formatTime(elapsedSec)}
                  </span>
                ) : (
                  <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-500">READY</span>
                )}
              </div>

              <div
                ref={previewMountRef}
                className={`w-full ${
                  resolutionId === 'square-1080' ? 'aspect-square max-h-[380px] mx-auto' : 'aspect-video'
                } bg-[#030712] rounded-xl overflow-hidden border border-slate-800 cyber:border-cyan-500/40`}
              />

              {/* Progress Bar */}
              {(isRecording || isPreviewPlaying) && (
                <div className="h-1.5 w-full bg-slate-800 cyber:bg-zinc-900 lab:bg-slate-300 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      isRecording
                        ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400'
                        : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}

              {/* Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTogglePreview}
                  disabled={isRecording}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-200 cyber:bg-black cyber:border-cyan-400 cyber:text-white lab:bg-white lab:border-slate-300 lab:text-slate-800 lab:hover:bg-slate-100 text-xs font-mono font-semibold cursor-pointer transition-colors"
                >
                  {isPreviewPlaying && !isRecording ? (
                    <>
                      <Square className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span>STOP PREVIEW</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-400 lab:text-emerald-600 fill-current" />
                      <span>{loadedAudio ? 'PREVIEW WITH MP3' : 'PREVIEW 3D STAGE'}</span>
                    </>
                  )}
                </button>

                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopPlaybackAndRecording}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold shadow-lg cursor-pointer transition-colors"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>FINISH &amp; SAVE VIDEO ({formatTime(elapsedSec)})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    disabled={isDecodingAudio}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 disabled:opacity-50 text-slate-950 cyber:from-cyan-400 cyber:to-yellow-300 cyber:text-black lab:from-sky-700 lab:to-sky-800 lab:text-white font-mono text-xs font-bold shadow-lg cursor-pointer transition-all"
                  >
                    <Video className="w-4 h-4" />
                    <span>
                      {loadedAudio
                        ? `GENERATE ${formatTime(targetDurationSec)} MP3 VIDEO`
                        : `GENERATE ${formatTime(targetDurationSec)} 3D VIDEO`}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {audioError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/50 text-rose-200 lab:bg-rose-50 lab:text-rose-800 lab:border-rose-300 text-xs font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{audioError}</span>
              </div>
            )}

            {/* Generated Video Output Player & Download */}
            {generatedVideo && (
              <div className="p-3.5 rounded-xl bg-emerald-950/25 cyber:bg-black lab:bg-emerald-50 border border-emerald-500/50 cyber:border-emerald-400 lab:border-emerald-300 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-300 cyber:text-emerald-300 lab:text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      VIDEO GENERATED ({generatedVideo.ext.toUpperCase()} · {(generatedVideo.sizeBytes / (1024 * 1024)).toFixed(2)} MB · {generatedVideo.durationSec.toFixed(1)}s)
                    </span>
                  </div>
                  <a
                    href={generatedVideo.url}
                    download={generatedVideo.filename}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 cyber:bg-emerald-400 cyber:text-black lab:bg-emerald-700 lab:hover:bg-emerald-800 lab:text-white font-mono text-xs font-bold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DOWNLOAD VIDEO</span>
                  </a>
                </div>
                <video
                  controls
                  src={generatedVideo.url}
                  className="w-full max-h-56 rounded-lg bg-black border border-slate-800 lab:border-slate-300"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
