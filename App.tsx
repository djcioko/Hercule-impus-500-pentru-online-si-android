import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DeckState, MixerState, SoundItem } from './types/dj';
import {
  INITIAL_JINGLES,
  INITIAL_SAMPLES_L,
  INITIAL_SAMPLES_R,
  TRANSPORT_CONTROLS,
} from './constants/djPresets';
import { audioEngine } from './utils/audioEngine';
import { midiManager, MidiStatusType, MidiEventData } from './utils/midiManager';
import { TopHeader } from './components/dj/TopHeader';
import { DeckPlayer } from './components/dj/DeckPlayer';
import { CentralMixer } from './components/dj/CentralMixer';
import { PerformancePads } from './components/dj/PerformancePads';
import { JinglesMatrix } from './components/dj/JinglesMatrix';
import { MidiConsoleModal } from './components/dj/MidiConsoleModal';
import { AiDjSection } from './components/dj/AiDjSection';

import { geminiService } from './services/geminiService';
import { fileToBase64 } from './utils/imageUtils';
import { YoutubeSong, HistoryEntry, GeminiResponseData } from './types';
import { YOUTUBE_DB, DEFAULT_YOUTUBE_ID, LOCAL_STORAGE_HISTORY_KEY } from './constants';

const App: React.FC = () => {
  // Navigation View
  const [activeView, setActiveView] = useState<'decks' | 'samples' | 'jingles' | 'full' | 'ai'>('decks');

  // MIDI state
  const [midiStatus, setMidiStatus] = useState<MidiStatusType>('disconnected');
  const [midiDevices, setMidiDevices] = useState<string[]>([]);
  const [lastMidiEvent, setLastMidiEvent] = useState<{
    status: number;
    note: number;
    velocity: number;
    timestamp: number;
  } | null>(null);
  const [isMidiModalOpen, setIsMidiModalOpen] = useState(false);

  // VU Meters & Audio Engine Peak state
  const [masterPeakL, setMasterPeakL] = useState(0);
  const [masterPeakR, setMasterPeakR] = useState(0);
  const [deckPeakL, setDeckPeakL] = useState(0);
  const [deckPeakR, setDeckPeakR] = useState(0);

  // Master Mixer State
  const [mixer, setMixer] = useState<MixerState>({
    crossfader: 0,
    crossfaderCurve: 'smooth',
    masterVolume: 1.0,
    boothVolume: 0.8,
    fxType: 'echo',
    fxWet: 0.35,
    fxParam: 0.5,
    fxActive: false,
  });

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Deck A (Left) & Deck B (Right) States
  const [deckL, setDeckL] = useState<DeckState>({
    id: 'L',
    name: 'DECK A',
    trackName: 'Festival House Anthem (Club Mix)',
    artist: 'DJ Cioko · Studio Stems',
    bpm: 128.0,
    targetBpm: 128.0,
    pitchPercent: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 30.0,
    cuePoint: 0,
    isLooping: true,
    loopLength: 4,
    sync: false,
    keyLock: false,
    hotCues: [0, 4, 8, 16],
    audioBuffer: null,
    gain: 1.0,
    eqHigh: 0,
    eqMid: 0,
    eqLow: 0,
    eqHighKill: false,
    eqMidKill: false,
    eqLowKill: false,
    filter: 0,
    volume: 0.9,
    cueMonitor: false,
  });

  const [deckR, setDeckR] = useState<DeckState>({
    id: 'R',
    name: 'DECK B',
    trackName: 'Romanian Tech-House Groove',
    artist: 'Bucharest Underground Beats',
    bpm: 128.0,
    targetBpm: 128.0,
    pitchPercent: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 30.0,
    cuePoint: 0,
    isLooping: true,
    loopLength: 4,
    sync: false,
    keyLock: false,
    hotCues: [0, 4, 8, 16],
    audioBuffer: null,
    gain: 1.0,
    eqHigh: 0,
    eqMid: 0,
    eqLow: 0,
    eqHighKill: false,
    eqMidKill: false,
    eqLowKill: false,
    filter: 0,
    volume: 0.9,
    cueMonitor: false,
  });

  // Jingles and Samples States
  const [jingles, setJingles] = useState(INITIAL_JINGLES);
  const [samplesL, setSamplesL] = useState(INITIAL_SAMPLES_L);
  const [samplesR, setSamplesR] = useState(INITIAL_SAMPLES_R);
  const [activePads, setActivePads] = useState<Set<string>>(new Set());

  // AI & Gemini State
  const [currentYoutubeId, setCurrentYoutubeId] = useState<string>(DEFAULT_YOUTUBE_ID);
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiResponseData | null>(null);
  const [suggestedSong, setSuggestedSong] = useState<YoutubeSong | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Ref tracking for real-time play states
  const deckLRef = useRef(deckL);
  const deckRRef = useRef(deckR);
  deckLRef.current = deckL;
  deckRRef.current = deckR;

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) {
      console.error('History load error:', e);
    }
  }, []);

  // Save history
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('History save error:', e);
    }
  }, [history]);

  // Request Animation Frame loop for VU Meters and Waveform playheads
  useEffect(() => {
    let animId: number;
    const updateAudioMeters = () => {
      const masterPeak = audioEngine.getMasterPeak();
      setMasterPeakL(masterPeak.left);
      setMasterPeakR(masterPeak.right);

      const pL = audioEngine.getDeckPeak('L');
      const pR = audioEngine.getDeckPeak('R');
      setDeckPeakL(pL);
      setDeckPeakR(pR);

      if (deckLRef.current.isPlaying) {
        const tL = audioEngine.getDeckCurrentTime('L');
        setDeckL(prev => ({ ...prev, currentTime: tL }));
      }
      if (deckRRef.current.isPlaying) {
        const tR = audioEngine.getDeckCurrentTime('R');
        setDeckR(prev => ({ ...prev, currentTime: tR }));
      }

      animId = requestAnimationFrame(updateAudioMeters);
    };

    animId = requestAnimationFrame(updateAudioMeters);
    return () => cancelAnimationFrame(animId);
  }, []);

  // --- TRANSPORT DECK HANDLERS ---

  const handlePlayDeckL = useCallback(() => {
    if (deckLRef.current.isPlaying) {
      audioEngine.pauseDeck('L');
      setDeckL(prev => ({ ...prev, isPlaying: false }));
    } else {
      audioEngine.playDeck('L', () => {
        setDeckL(prev => ({ ...prev, isPlaying: false }));
      });
      setDeckL(prev => ({ ...prev, isPlaying: true }));
    }
  }, []);

  const handlePlayDeckR = useCallback(() => {
    if (deckRRef.current.isPlaying) {
      audioEngine.pauseDeck('R');
      setDeckR(prev => ({ ...prev, isPlaying: false }));
    } else {
      audioEngine.playDeck('R', () => {
        setDeckR(prev => ({ ...prev, isPlaying: false }));
      });
      setDeckR(prev => ({ ...prev, isPlaying: true }));
    }
  }, []);

  const handleCueDeckL = useCallback(() => {
    audioEngine.cueDeck('L', deckLRef.current.cuePoint);
    setDeckL(prev => ({ ...prev, isPlaying: false, currentTime: prev.cuePoint }));
  }, []);

  const handleCueDeckR = useCallback(() => {
    audioEngine.cueDeck('R', deckRRef.current.cuePoint);
    setDeckR(prev => ({ ...prev, isPlaying: false, currentTime: prev.cuePoint }));
  }, []);

  // --- STOP ALL HANDLER ---
  const handleStopAll = useCallback(() => {
    audioEngine.stopAll();
    setActivePads(new Set());
    setDeckL(prev => ({ ...prev, isPlaying: false }));
    setDeckR(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // --- SOUNDBOARD (JINGLES & SAMPLES) TRIGGER ---

  const handleTriggerJingle = useCallback((id: string) => {
    const item = jingles.find(j => j.id === id);
    if (!item) return;

    setActivePads(prev => new Set(prev).add(id));
    audioEngine.playSound(
      id,
      item.audioBuffer || null,
      item.defaultSynth,
      item.volume ?? 0.9,
      () => {
        setActivePads(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    );
  }, [jingles]);

  const handleTriggerSampleL = useCallback((id: string) => {
    const item = samplesL.find(s => s.id === id);
    if (!item) return;

    setActivePads(prev => new Set(prev).add(id));
    audioEngine.playSound(
      id,
      item.audioBuffer || null,
      item.defaultSynth,
      item.volume ?? 0.9,
      () => {
        setActivePads(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    );
  }, [samplesL]);

  const handleTriggerSampleR = useCallback((id: string) => {
    const item = samplesR.find(s => s.id === id);
    if (!item) return;

    setActivePads(prev => new Set(prev).add(id));
    audioEngine.playSound(
      id,
      item.audioBuffer || null,
      item.defaultSynth,
      item.volume ?? 0.9,
      () => {
        setActivePads(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    );
  }, [samplesR]);

  // File Upload for Jingles and Samples
  const handleFileUpload = useCallback(
    async (id: string, file: File, category: 'jingle' | 'sampleL' | 'sampleR') => {
      try {
        const buffer = await audioEngine.decodeAudioFile(file);
        if (category === 'jingle') {
          setJingles(prev =>
            prev.map(j => (j.id === id ? { ...j, audioBuffer: buffer, customFileName: file.name } : j))
          );
        } else if (category === 'sampleL') {
          setSamplesL(prev =>
            prev.map(s => (s.id === id ? { ...s, audioBuffer: buffer, customFileName: file.name } : s))
          );
        } else {
          setSamplesR(prev =>
            prev.map(s => (s.id === id ? { ...s, audioBuffer: buffer, customFileName: file.name } : s))
          );
        }
      } catch (err) {
        console.error('Audio file decode error:', err);
      }
    },
    []
  );

  // Volume Change for Pads
  const handlePadVolumeChange = useCallback(
    (id: string, vol: number, category: 'jingle' | 'sampleL' | 'sampleR') => {
      if (category === 'jingle') {
        setJingles(prev => prev.map(j => (j.id === id ? { ...j, volume: vol } : j)));
      } else if (category === 'sampleL') {
        setSamplesL(prev => prev.map(s => (s.id === id ? { ...s, volume: vol } : s)));
      } else {
        setSamplesR(prev => prev.map(s => (s.id === id ? { ...s, volume: vol } : s)));
      }
    },
    []
  );

  // File Upload for Decks
  const handleLoadDeckTrack = useCallback(async (deckId: 'L' | 'R', file: File) => {
    try {
      const buffer = await audioEngine.decodeAudioFile(file);
      audioEngine.setDeckBuffer(deckId, buffer);
      if (deckId === 'L') {
        setDeckL(prev => ({
          ...prev,
          trackName: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'User Track',
          duration: buffer.duration,
          audioBuffer: buffer,
          isPlaying: false,
          currentTime: 0,
        }));
      } else {
        setDeckR(prev => ({
          ...prev,
          trackName: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'User Track',
          duration: buffer.duration,
          audioBuffer: buffer,
          isPlaying: false,
          currentTime: 0,
        }));
      }
    } catch (err) {
      console.error('Failed to load track on deck:', err);
    }
  }, []);

  // --- MIDI MESSAGE ROUTING (Exact specs from user prompt) ---
  const handleMidiMessage = useCallback(
    (event: MidiEventData) => {
      const { status, note, velocity } = event;
      setLastMidiEvent(event);

      // Note Off = velocity 0 (ignore triggering)
      if (velocity === 0) return;

      // 1. Transport PLAY L (Status 145, Note 7)
      if (status === 145 && note === 7) {
        handlePlayDeckL();
        return;
      }

      // 2. Transport PLAY R (Status 146, Note 7)
      if (status === 146 && note === 7) {
        handlePlayDeckR();
        return;
      }

      // 3. Transport CUE L (Status 145, Note 6)
      if (status === 145 && note === 6) {
        handleCueDeckL();
        return;
      }

      // 4. Transport CUE R (Status 146, Note 6)
      if (status === 146 && note === 6) {
        handleCueDeckR();
        return;
      }

      // 5. Samples L (Status 150)
      if (status === 150) {
        const target = samplesL.find(s => s.midi.note === note);
        if (target) {
          handleTriggerSampleL(target.id);
          return;
        }
      }

      // 6. Samples R (Status 151)
      if (status === 151) {
        const target = samplesR.find(s => s.midi.note === note);
        if (target) {
          handleTriggerSampleR(target.id);
          return;
        }
      }

      // 7. Jingles (Status 153)
      if (status === 153) {
        const target = jingles.find(j => j.midi.note === note);
        if (target) {
          handleTriggerJingle(target.id);
          return;
        }
      }
    },
    [
      handlePlayDeckL,
      handlePlayDeckR,
      handleCueDeckL,
      handleCueDeckR,
      handleTriggerSampleL,
      handleTriggerSampleR,
      handleTriggerJingle,
      samplesL,
      samplesR,
      jingles,
    ]
  );

  // Connect MIDI
  const handleConnectMidi = useCallback(async () => {
    const res = await midiManager.connect();
    setMidiStatus(res);
    setMidiDevices(midiManager.getDeviceNames());
  }, []);

  const handleDisconnectMidi = useCallback(() => {
    midiManager.disconnect();
    setMidiStatus('disconnected');
    setMidiDevices([]);
  }, []);

  // Subscribe to MIDI Manager
  useEffect(() => {
    const unsubscribe = midiManager.subscribe(handleMidiMessage);
    return () => unsubscribe();
  }, [handleMidiMessage]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.repeat) return;

      const key = e.key.toLowerCase();

      // STOP ALL (Space or Escape)
      if (key === ' ' || key === 'escape') {
        e.preventDefault();
        handleStopAll();
        return;
      }

      // Transport controls
      if (key === 'z') {
        e.preventDefault();
        handlePlayDeckL();
        return;
      }
      if (key === 'x') {
        e.preventDefault();
        handlePlayDeckR();
        return;
      }
      if (key === 'c') {
        e.preventDefault();
        handleCueDeckL();
        return;
      }
      if (key === 'v') {
        e.preventDefault();
        handleCueDeckR();
        return;
      }

      // Samples L (q, w, e, r, t, y, u, i)
      const sampleLTarget = samplesL.find(s => s.key.toLowerCase() === key);
      if (sampleLTarget) {
        e.preventDefault();
        handleTriggerSampleL(sampleLTarget.id);
        return;
      }

      // Samples R (a, s, d, f, g, h, j, k)
      const sampleRTarget = samplesR.find(s => s.key.toLowerCase() === key);
      if (sampleRTarget) {
        e.preventDefault();
        handleTriggerSampleR(sampleRTarget.id);
        return;
      }

      // Jingles (f, g, h, j, b, n, m, 1-8)
      const jingleTarget = jingles.find(j => j.key.toLowerCase() === key);
      if (jingleTarget) {
        e.preventDefault();
        handleTriggerJingle(jingleTarget.id);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleStopAll,
    handlePlayDeckL,
    handlePlayDeckR,
    handleCueDeckL,
    handleCueDeckR,
    handleTriggerSampleL,
    handleTriggerSampleR,
    handleTriggerJingle,
    samplesL,
    samplesR,
    jingles,
  ]);

  // --- RECORDING CONTROLS ---
  const handleToggleRecording = () => {
    if (!isRecording) {
      const ok = audioEngine.startRecording();
      if (ok) {
        setIsRecording(true);
        setRecordingDuration(0);
        setRecordedBlob(null);
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(d => d + 1);
        }, 1000);
      }
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      const blob = audioEngine.stopRecording();
      setIsRecording(false);
      if (blob) {
        setRecordedBlob(blob);
      }
    }
  };

  const handleDownloadRecording = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `turbo-dj-mix-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- MIXER PARAMETERS ADJUSTMENTS ---
  const handleMasterVolumeChange = (vol: number) => {
    audioEngine.setMasterVolume(vol);
    setMixer(prev => ({ ...prev, masterVolume: vol }));
  };

  const handleCrossfaderChange = (val: number) => {
    audioEngine.setCrossfader(val, mixer.crossfaderCurve);
    setMixer(prev => ({ ...prev, crossfader: val }));
  };

  const handleCrossfaderCurveToggle = () => {
    const nextCurve = mixer.crossfaderCurve === 'smooth' ? 'scratch' : 'smooth';
    audioEngine.setCrossfader(mixer.crossfader, nextCurve);
    setMixer(prev => ({ ...prev, crossfaderCurve: nextCurve }));
  };

  const handleDeckGainChange = (deckId: 'L' | 'R', val: number) => {
    audioEngine.setDeckGain(deckId, val);
    if (deckId === 'L') setDeckL(prev => ({ ...prev, gain: val }));
    else setDeckR(prev => ({ ...prev, gain: val }));
  };

  const handleDeckEQChange = (deckId: 'L' | 'R', band: 'high' | 'mid' | 'low', val: number) => {
    const target = deckId === 'L' ? deckL : deckR;
    const nextHigh = band === 'high' ? val : target.eqHigh;
    const nextMid = band === 'mid' ? val : target.eqMid;
    const nextLow = band === 'low' ? val : target.eqLow;

    audioEngine.setDeckEQ(
      deckId,
      nextHigh,
      nextMid,
      nextLow,
      target.eqHighKill,
      target.eqMidKill,
      target.eqLowKill
    );

    if (deckId === 'L') {
      setDeckL(prev => ({
        ...prev,
        eqHigh: nextHigh,
        eqMid: nextMid,
        eqLow: nextLow,
      }));
    } else {
      setDeckR(prev => ({
        ...prev,
        eqHigh: nextHigh,
        eqMid: nextMid,
        eqLow: nextLow,
      }));
    }
  };

  const handleDeckEQKillToggle = (deckId: 'L' | 'R', band: 'high' | 'mid' | 'low') => {
    const target = deckId === 'L' ? deckL : deckR;
    const killHigh = band === 'high' ? !target.eqHighKill : target.eqHighKill;
    const killMid = band === 'mid' ? !target.eqMidKill : target.eqMidKill;
    const killLow = band === 'low' ? !target.eqLowKill : target.eqLowKill;

    audioEngine.setDeckEQ(
      deckId,
      target.eqHigh,
      target.eqMid,
      target.eqLow,
      killHigh,
      killMid,
      killLow
    );

    if (deckId === 'L') {
      setDeckL(prev => ({
        ...prev,
        eqHighKill: killHigh,
        eqMidKill: killMid,
        eqLowKill: killLow,
      }));
    } else {
      setDeckR(prev => ({
        ...prev,
        eqHighKill: killHigh,
        eqMidKill: killMid,
        eqLowKill: killLow,
      }));
    }
  };

  const handleDeckFilterChange = (deckId: 'L' | 'R', val: number) => {
    audioEngine.setDeckFilter(deckId, val);
    if (deckId === 'L') setDeckL(prev => ({ ...prev, filter: val }));
    else setDeckR(prev => ({ ...prev, filter: val }));
  };

  const handleDeckVolumeChange = (deckId: 'L' | 'R', val: number) => {
    audioEngine.setDeckVolume(deckId, val);
    if (deckId === 'L') setDeckL(prev => ({ ...prev, volume: val }));
    else setDeckR(prev => ({ ...prev, volume: val }));
  };

  const handleDeckPitchChange = (deckId: 'L' | 'R', val: number) => {
    audioEngine.setDeckPitch(deckId, val);
    if (deckId === 'L') setDeckL(prev => ({ ...prev, pitchPercent: val }));
    else setDeckR(prev => ({ ...prev, pitchPercent: val }));
  };

  const handleDeckPitchBend = (deckId: 'L' | 'R', amount: number) => {
    const current = deckId === 'L' ? deckL.pitchPercent : deckR.pitchPercent;
    audioEngine.setDeckPitch(deckId, current + amount * 100);
  };

  const handleSyncDecks = (deckId: 'L' | 'R') => {
    if (deckId === 'L') {
      const targetPitch = ((deckR.bpm - deckL.bpm) / deckL.bpm) * 100;
      handleDeckPitchChange('L', targetPitch);
      setDeckL(prev => ({ ...prev, sync: !prev.sync }));
    } else {
      const targetPitch = ((deckL.bpm - deckR.bpm) / deckR.bpm) * 100;
      handleDeckPitchChange('R', targetPitch);
      setDeckR(prev => ({ ...prev, sync: !prev.sync }));
    }
  };

  const handleFxChange = (key: keyof MixerState, val: unknown) => {
    setMixer(prev => {
      const next = { ...prev, [key]: val };
      audioEngine.setFx(next.fxActive, next.fxType, next.fxWet, next.fxParam);
      return next;
    });
  };

  // --- GEMINI AI VIBE PROCESSING ---
  const handleAiImageUpload = useCallback(async (file: File | Blob) => {
    setIsAiLoading(true);
    setAiError(null);
    setGeminiAnalysis(null);
    setSuggestedSong(null);

    try {
      const base64Image = await fileToBase64(file);
      const mimeType = file.type;
      const result = await geminiService.analyzeImage({ base64Image, mimeType });

      if (result) {
        setGeminiAnalysis(result);
        const lower = result.vibe.toLowerCase();
        let match = YOUTUBE_DB.find(s => s.vibe.toLowerCase() === lower);
        if (!match) {
          match = YOUTUBE_DB[Math.floor(Math.random() * YOUTUBE_DB.length)];
        }
        if (match) {
          setSuggestedSong(match);
          setCurrentYoutubeId(match.id);
          const newEntry: HistoryEntry = {
            vibe: result.vibe,
            name: match.name,
            id: match.id,
            timestamp: Date.now(),
          };
          setHistory(prev => [newEntry, ...prev].slice(0, 10));
        }
      }
    } catch (err) {
      if (err instanceof Error) setAiError(err.message);
      else setAiError('Eroare necunoscută la analiza imaginii.');
    } finally {
      setIsAiLoading(false);
    }
  }, []);

  const handleSelectSongFromHistory = (videoId: string) => {
    setCurrentYoutubeId(videoId);
    const entry = history.find(item => item.id === videoId);
    if (entry) {
      setSuggestedSong({ vibe: entry.vibe, name: entry.name, id: entry.id });
      setGeminiAnalysis({ vibe: entry.vibe, description: `Din istoric: ${entry.name}` });
    }
  };

  const handleSendToDeck = (deckId: 'L' | 'R', trackTitle: string) => {
    if (deckId === 'L') {
      setDeckL(prev => ({ ...prev, trackName: trackTitle, artist: 'Gemini Vibe Selection' }));
    } else {
      setDeckR(prev => ({ ...prev, trackName: trackTitle, artist: 'Gemini Vibe Selection' }));
    }
  };

  const allMidiBindings = [
    ...TRANSPORT_CONTROLS,
    ...samplesL,
    ...samplesR,
    ...jingles,
  ];

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Professional DJ Header & MIDI Bar */}
      <TopHeader
        midiStatus={midiStatus}
        midiDevices={midiDevices}
        lastMidiEvent={lastMidiEvent}
        masterVolume={mixer.masterVolume}
        masterPeakL={masterPeakL}
        masterPeakR={masterPeakR}
        isRecording={isRecording}
        recordingDuration={recordingDuration}
        activeView={activeView}
        onConnectMidi={handleConnectMidi}
        onDisconnectMidi={handleDisconnectMidi}
        onMasterVolumeChange={handleMasterVolumeChange}
        onStopAll={handleStopAll}
        onToggleRecording={handleToggleRecording}
        onDownloadRecording={handleDownloadRecording}
        hasRecording={!!recordedBlob}
        onSelectView={setActiveView}
      />

      {/* Main DJ Console Workspace */}
      <main className="flex-1 p-3 sm:p-5 flex flex-col gap-5 max-w-[1700px] w-full mx-auto">
        {/* VIEW 1: DUAL DECKS & MIXER */}
        {activeView === 'decks' && (
          <div className="flex flex-col lg:flex-row items-stretch gap-4">
            {/* Deck A (Left) */}
            <DeckPlayer
              deck={deckL}
              otherDeckBpm={deckR.bpm}
              onPlayToggle={handlePlayDeckL}
              onCue={handleCueDeckL}
              onScrub={sec => audioEngine.scrubDeck('L', sec)}
              onPitchChange={p => handleDeckPitchChange('L', p)}
              onPitchBend={amt => handleDeckPitchBend('L', amt)}
              onSync={() => handleSyncDecks('L')}
              onKeyLockToggle={() => setDeckL(p => ({ ...p, keyLock: !p.keyLock }))}
              onSetHotCue={idx => {
                setDeckL(p => {
                  const arr = [...p.hotCues];
                  arr[idx] = p.currentTime;
                  return { ...p, hotCues: arr };
                });
              }}
              onJumpHotCue={idx => {
                const target = deckL.hotCues[idx];
                if (target !== null && target !== undefined) {
                  audioEngine.scrubDeck('L', target);
                }
              }}
              onSetLoop={beats => setDeckL(p => ({ ...p, loopLength: beats, isLooping: true }))}
              onToggleLoop={() => setDeckL(p => ({ ...p, isLooping: !p.isLooping }))}
              onLoadTrackFile={file => handleLoadDeckTrack('L', file)}
            />

            {/* Central DJ Mixer */}
            <CentralMixer
              deckL={deckL}
              deckR={deckR}
              mixer={mixer}
              peakL={deckPeakL}
              peakR={deckPeakR}
              onDeckGainChange={handleDeckGainChange}
              onDeckEQChange={handleDeckEQChange}
              onDeckEQKillToggle={handleDeckEQKillToggle}
              onDeckFilterChange={handleDeckFilterChange}
              onDeckVolumeChange={handleDeckVolumeChange}
              onDeckCueMonitorToggle={deckId => {
                if (deckId === 'L') setDeckL(p => ({ ...p, cueMonitor: !p.cueMonitor }));
                else setDeckR(p => ({ ...p, cueMonitor: !p.cueMonitor }));
              }}
              onCrossfaderChange={handleCrossfaderChange}
              onCrossfaderCurveToggle={handleCrossfaderCurveToggle}
              onFxChange={handleFxChange}
            />

            {/* Deck B (Right) */}
            <DeckPlayer
              deck={deckR}
              otherDeckBpm={deckL.bpm}
              onPlayToggle={handlePlayDeckR}
              onCue={handleCueDeckR}
              onScrub={sec => audioEngine.scrubDeck('R', sec)}
              onPitchChange={p => handleDeckPitchChange('R', p)}
              onPitchBend={amt => handleDeckPitchBend('R', amt)}
              onSync={() => handleSyncDecks('R')}
              onKeyLockToggle={() => setDeckR(p => ({ ...p, keyLock: !p.keyLock }))}
              onSetHotCue={idx => {
                setDeckR(p => {
                  const arr = [...p.hotCues];
                  arr[idx] = p.currentTime;
                  return { ...p, hotCues: arr };
                });
              }}
              onJumpHotCue={idx => {
                const target = deckR.hotCues[idx];
                if (target !== null && target !== undefined) {
                  audioEngine.scrubDeck('R', target);
                }
              }}
              onSetLoop={beats => setDeckR(p => ({ ...p, loopLength: beats, isLooping: true }))}
              onToggleLoop={() => setDeckR(p => ({ ...p, isLooping: !p.isLooping }))}
              onLoadTrackFile={file => handleLoadDeckTrack('R', file)}
            />
          </div>
        )}

        {/* VIEW 2: SAMPLES RACK (Samples L 1-8 + Samples R 1-8) */}
        {activeView === 'samples' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <PerformancePads
                title="Samples Stânga (Deck A Pads)"
                deckSide="L"
                samples={samplesL}
                activePads={activePads}
                onTriggerPad={handleTriggerSampleL}
                onFileUpload={(id, file) => handleFileUpload(id, file, 'sampleL')}
                onVolumeChange={(id, vol) => handlePadVolumeChange(id, vol, 'sampleL')}
              />
              <PerformancePads
                title="Samples Dreapta (Deck B Pads)"
                deckSide="R"
                samples={samplesR}
                activePads={activePads}
                onTriggerPad={handleTriggerSampleR}
                onFileUpload={(id, file) => handleFileUpload(id, file, 'sampleR')}
                onVolumeChange={(id, vol) => handlePadVolumeChange(id, vol, 'sampleR')}
              />
            </div>

            {/* Quick Transport Bar underneath */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayDeckL}
                  className={`px-4 py-2 rounded-lg font-mono font-bold text-xs ${
                    deckL.isPlaying ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  DECK L [Z]: {deckL.isPlaying ? 'PAUSE' : 'PLAY'}
                </button>
                <button
                  onClick={handleCueDeckL}
                  className="px-4 py-2 rounded-lg font-mono font-bold text-xs bg-zinc-800 text-amber-400"
                >
                  CUE L [C]
                </button>
              </div>

              <button
                onClick={handleStopAll}
                className="px-6 py-2 rounded-lg font-mono font-bold text-xs bg-red-600 hover:bg-red-500 text-white uppercase shadow-md"
              >
                STOP ALL [SPACE]
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayDeckR}
                  className={`px-4 py-2 rounded-lg font-mono font-bold text-xs ${
                    deckR.isPlaying ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  DECK R [X]: {deckR.isPlaying ? 'PAUSE' : 'PLAY'}
                </button>
                <button
                  onClick={handleCueDeckR}
                  className="px-4 py-2 rounded-lg font-mono font-bold text-xs bg-zinc-800 text-amber-400"
                >
                  CUE R [V]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: JINGLES BROADCASTER MATRIX */}
        {activeView === 'jingles' && (
          <div className="flex flex-col gap-4">
            <JinglesMatrix
              jingles={jingles}
              activeJingles={activePads}
              onTriggerJingle={handleTriggerJingle}
              onFileUpload={(id, file) => handleFileUpload(id, file, 'jingle')}
              onVolumeChange={(id, vol) => handlePadVolumeChange(id, vol, 'jingle')}
            />

            {/* Quick Transport Bar underneath */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400">
                Apasă tastele [F, G, H, J, B, N, M, 1-8] sau folosește controllerul MIDI (Status 153).
              </span>
              <button
                onClick={handleStopAll}
                className="px-6 py-2 rounded-lg font-mono font-bold text-xs bg-red-600 hover:bg-red-500 text-white uppercase shadow-md"
              >
                STOP ALL [SPACE]
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: ALL-IN-ONE PRO CONSOLE */}
        {activeView === 'full' && (
          <div className="flex flex-col gap-5">
            {/* Dual Decks & Mixer */}
            <div className="flex flex-col lg:flex-row items-stretch gap-4">
              <DeckPlayer
                deck={deckL}
                otherDeckBpm={deckR.bpm}
                onPlayToggle={handlePlayDeckL}
                onCue={handleCueDeckL}
                onScrub={sec => audioEngine.scrubDeck('L', sec)}
                onPitchChange={p => handleDeckPitchChange('L', p)}
                onPitchBend={amt => handleDeckPitchBend('L', amt)}
                onSync={() => handleSyncDecks('L')}
                onKeyLockToggle={() => setDeckL(p => ({ ...p, keyLock: !p.keyLock }))}
                onSetHotCue={idx => {
                  setDeckL(p => {
                    const arr = [...p.hotCues];
                    arr[idx] = p.currentTime;
                    return { ...p, hotCues: arr };
                  });
                }}
                onJumpHotCue={idx => {
                  const target = deckL.hotCues[idx];
                  if (target !== null && target !== undefined) {
                    audioEngine.scrubDeck('L', target);
                  }
                }}
                onSetLoop={beats => setDeckL(p => ({ ...p, loopLength: beats, isLooping: true }))}
                onToggleLoop={() => setDeckL(p => ({ ...p, isLooping: !p.isLooping }))}
                onLoadTrackFile={file => handleLoadDeckTrack('L', file)}
              />

              <CentralMixer
                deckL={deckL}
                deckR={deckR}
                mixer={mixer}
                peakL={deckPeakL}
                peakR={deckPeakR}
                onDeckGainChange={handleDeckGainChange}
                onDeckEQChange={handleDeckEQChange}
                onDeckEQKillToggle={handleDeckEQKillToggle}
                onDeckFilterChange={handleDeckFilterChange}
                onDeckVolumeChange={handleDeckVolumeChange}
                onDeckCueMonitorToggle={deckId => {
                  if (deckId === 'L') setDeckL(p => ({ ...p, cueMonitor: !p.cueMonitor }));
                  else setDeckR(p => ({ ...p, cueMonitor: !p.cueMonitor }));
                }}
                onCrossfaderChange={handleCrossfaderChange}
                onCrossfaderCurveToggle={handleCrossfaderCurveToggle}
                onFxChange={handleFxChange}
              />

              <DeckPlayer
                deck={deckR}
                otherDeckBpm={deckL.bpm}
                onPlayToggle={handlePlayDeckR}
                onCue={handleCueDeckR}
                onScrub={sec => audioEngine.scrubDeck('R', sec)}
                onPitchChange={p => handleDeckPitchChange('R', p)}
                onPitchBend={amt => handleDeckPitchBend('R', amt)}
                onSync={() => handleSyncDecks('R')}
                onKeyLockToggle={() => setDeckR(p => ({ ...p, keyLock: !p.keyLock }))}
                onSetHotCue={idx => {
                  setDeckR(p => {
                    const arr = [...p.hotCues];
                    arr[idx] = p.currentTime;
                    return { ...p, hotCues: arr };
                  });
                }}
                onJumpHotCue={idx => {
                  const target = deckR.hotCues[idx];
                  if (target !== null && target !== undefined) {
                    audioEngine.scrubDeck('R', target);
                  }
                }}
                onSetLoop={beats => setDeckR(p => ({ ...p, loopLength: beats, isLooping: true }))}
                onToggleLoop={() => setDeckR(p => ({ ...p, isLooping: !p.isLooping }))}
                onLoadTrackFile={file => handleLoadDeckTrack('R', file)}
              />
            </div>

            {/* Performance Samples & Jingles */}
            <div className="flex flex-col md:flex-row gap-4">
              <PerformancePads
                title="Samples Stânga"
                deckSide="L"
                samples={samplesL}
                activePads={activePads}
                onTriggerPad={handleTriggerSampleL}
                onFileUpload={(id, file) => handleFileUpload(id, file, 'sampleL')}
                onVolumeChange={(id, vol) => handlePadVolumeChange(id, vol, 'sampleL')}
              />
              <PerformancePads
                title="Samples Dreapta"
                deckSide="R"
                samples={samplesR}
                activePads={activePads}
                onTriggerPad={handleTriggerSampleR}
                onFileUpload={(id, file) => handleFileUpload(id, file, 'sampleR')}
                onVolumeChange={(id, vol) => handlePadVolumeChange(id, vol, 'sampleR')}
              />
            </div>

            <JinglesMatrix
              jingles={jingles}
              activeJingles={activePads}
              onTriggerJingle={handleTriggerJingle}
              onFileUpload={(id, file) => handleFileUpload(id, file, 'jingle')}
              onVolumeChange={(id, vol) => handlePadVolumeChange(id, vol, 'jingle')}
            />
          </div>
        )}

        {/* VIEW 5: GEMINI AI VIBE DETECTOR */}
        {activeView === 'ai' && (
          <AiDjSection
            onImageUpload={handleAiImageUpload}
            isLoading={isAiLoading}
            error={aiError}
            geminiAnalysis={geminiAnalysis}
            suggestedSong={suggestedSong}
            currentYoutubeId={currentYoutubeId}
            history={history}
            onSelectSongFromHistory={handleSelectSongFromHistory}
            onSendToDeck={handleSendToDeck}
          />
        )}
      </main>

      {/* MIDI Controller Monitor Modal */}
      <MidiConsoleModal
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
        status={midiStatus}
        deviceNames={midiDevices}
        lastMidiEvent={lastMidiEvent}
        allBindings={allMidiBindings}
        onConnect={handleConnectMidi}
      />
    </div>
  );
};

export default App;
