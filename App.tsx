import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DeckState, MixerState } from './types/dj';
import {
  INITIAL_JINGLES,
  INITIAL_SAMPLES_L,
  INITIAL_SAMPLES_R,
} from './constants/djPresets';
import { audioEngine } from './utils/audioEngine';
import { midiManager, MidiStatusType, MidiEventData } from './utils/midiManager';
import { midiMappingService } from './utils/midiMappingService';
import { abletonLinkManager } from './utils/abletonLinkManager';

import { TopHeader } from './components/dj/TopHeader';
import { DeckPlayer } from './components/dj/DeckPlayer';
import { CentralMixer } from './components/dj/CentralMixer';
import { PerformancePads } from './components/dj/PerformancePads';
import { JinglesMatrix } from './components/dj/JinglesMatrix';
import { MidiNotepadModal } from './components/dj/MidiNotepadModal';
import { AudioSourcesModal } from './components/dj/AudioSourcesModal';
import { AiDjSection } from './components/dj/AiDjSection';
import { MusicExplorerSection } from './components/dj/MusicExplorerSection';
import { AndroidConsoleView } from './components/dj/AndroidConsoleView';

import { geminiService } from './services/geminiService';
import { fileToBase64 } from './utils/imageUtils';
import { YoutubeSong, HistoryEntry, GeminiResponseData } from './types';
import { YOUTUBE_DB, DEFAULT_YOUTUBE_ID, LOCAL_STORAGE_HISTORY_KEY } from './constants';

const App: React.FC = () => {
  // Navigation View (Includes Explorer & Mobile Android Console)
  const [activeView, setActiveView] = useState<'decks' | 'samples' | 'jingles' | 'full' | 'ai' | 'explorer' | 'android'>('decks');
  const [trackEndMode, setTrackEndMode] = useState<'stop' | 'loop' | 'next'>('stop');

  // MIDI state & Ableton-style MIDI Edit Mode
  const [midiStatus, setMidiStatus] = useState<MidiStatusType>('disconnected');
  const [midiDevices, setMidiDevices] = useState<string[]>([]);
  const [lastMidiEvent, setLastMidiEvent] = useState<{
    status: number;
    note: number;
    velocity: number;
    timestamp: number;
  } | null>(null);

  // Ableton-style MIDI Mapping state
  const [isMidiEditMode, setIsMidiEditMode] = useState<boolean>(false);
  const [selectedMidiControl, setSelectedMidiControl] = useState<string | null>(null);
  const [isMidiNotepadOpen, setIsMidiNotepadOpen] = useState<boolean>(false);

  // Audio Sources Modal State
  const [audioSourcesModalDeck, setAudioSourcesModalDeck] = useState<'L' | 'R' | null>(null);

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

  // Track if CUE is being held for temporary cue-preview
  const cueHeldLRef = useRef(false);
  const cueHeldRRef = useRef(false);

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
      const isLoop = trackEndMode === 'loop' || deckLRef.current.isLooping;
      audioEngine.playDeck(
        'L',
        () => {
          // When track reaches end: "CAND DECK UNUL SAU DECK DOI AJUNGE LA FINAL PIESA SE OPRESTE NU MAI CANTA"
          if (trackEndMode === 'stop') {
            audioEngine.cueDeck('L', 0);
            setDeckL(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
          } else if (trackEndMode === 'loop') {
            audioEngine.playDeck('L', undefined, true);
          }
        },
        isLoop
      );
      setDeckL(prev => ({ ...prev, isPlaying: true }));
    }
  }, [trackEndMode]);

  const handlePlayDeckR = useCallback(() => {
    if (deckRRef.current.isPlaying) {
      audioEngine.pauseDeck('R');
      setDeckR(prev => ({ ...prev, isPlaying: false }));
    } else {
      const isLoop = trackEndMode === 'loop' || deckRRef.current.isLooping;
      audioEngine.playDeck(
        'R',
        () => {
          if (trackEndMode === 'stop') {
            audioEngine.cueDeck('R', 0);
            setDeckR(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
          } else if (trackEndMode === 'loop') {
            audioEngine.playDeck('R', undefined, true);
          }
        },
        isLoop
      );
      setDeckR(prev => ({ ...prev, isPlaying: true }));
    }
  }, [trackEndMode]);

  const handleJogScratch = useCallback((deckId: 'L' | 'R', deltaSeconds: number) => {
    const target = deckId === 'L' ? deckLRef.current : deckRRef.current;
    audioEngine.scratchDeck(deckId, deltaSeconds, target.isLooping);
    const newTime = audioEngine.getDeckCurrentTime(deckId);
    if (deckId === 'L') setDeckL(p => ({ ...p, currentTime: newTime }));
    else setDeckR(p => ({ ...p, currentTime: newTime }));
  }, []);

  const handleDeckCueMonitorToggle = useCallback((deckId: 'L' | 'R') => {
    if (deckId === 'L') {
      setDeckL(p => {
        const next = !p.cueMonitor;
        midiManager.sendDeckPflFeedback('L', next);
        return { ...p, cueMonitor: next };
      });
    } else {
      setDeckR(p => {
        const next = !p.cueMonitor;
        midiManager.sendDeckPflFeedback('R', next);
        return { ...p, cueMonitor: next };
      });
    }
  }, []);

  const handleCueDeckL = useCallback((isHold = false) => {
    audioEngine.init();
    if (deckLRef.current.isPlaying) {
      // 1. Deck is playing -> Stop and snap back to cuePoint (standard CDJ/Hercules behavior)
      audioEngine.cueDeck('L', deckLRef.current.cuePoint);
      setDeckL(prev => ({ ...prev, isPlaying: false, currentTime: prev.cuePoint }));
      cueHeldLRef.current = false;
    } else {
      // 2. Deck is stopped -> Play from cue point immediately (soundboard trigger & cue preview)!
      audioEngine.playDeckFromCue('L', deckLRef.current.cuePoint, () => {
        setDeckL(prev => ({ ...prev, isPlaying: false }));
      });
      setDeckL(prev => ({ ...prev, isPlaying: true, currentTime: prev.cuePoint }));
      if (isHold) {
        cueHeldLRef.current = true;
      }
    }
  }, []);

  const handleCueDeckLRelease = useCallback(() => {
    if (cueHeldLRef.current) {
      cueHeldLRef.current = false;
      audioEngine.cueDeck('L', deckLRef.current.cuePoint);
      setDeckL(prev => ({ ...prev, isPlaying: false, currentTime: prev.cuePoint }));
    }
  }, []);

  const handleSetCueDeckL = useCallback(() => {
    const cur = deckLRef.current.currentTime;
    setDeckL(prev => ({ ...prev, cuePoint: cur }));
  }, []);

  const handleCueDeckR = useCallback((isHold = false) => {
    audioEngine.init();
    if (deckRRef.current.isPlaying) {
      // 1. Deck is playing -> Stop and snap back to cuePoint
      audioEngine.cueDeck('R', deckRRef.current.cuePoint);
      setDeckR(prev => ({ ...prev, isPlaying: false, currentTime: prev.cuePoint }));
      cueHeldRRef.current = false;
    } else {
      // 2. Deck is stopped -> Play from cue point immediately
      audioEngine.playDeckFromCue('R', deckRRef.current.cuePoint, () => {
        setDeckR(prev => ({ ...prev, isPlaying: false }));
      });
      setDeckR(prev => ({ ...prev, isPlaying: true, currentTime: prev.cuePoint }));
      if (isHold) {
        cueHeldRRef.current = true;
      }
    }
  }, []);

  const handleCueDeckRRelease = useCallback(() => {
    if (cueHeldRRef.current) {
      cueHeldRRef.current = false;
      audioEngine.cueDeck('R', deckRRef.current.cuePoint);
      setDeckR(prev => ({ ...prev, isPlaying: false, currentTime: prev.cuePoint }));
    }
  }, []);

  const handleSetCueDeckR = useCallback(() => {
    const cur = deckRRef.current.currentTime;
    setDeckR(prev => ({ ...prev, cuePoint: cur }));
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

  // --- MIXER PARAMETERS ADJUSTMENTS ---
  const handleMasterVolumeChange = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1.5, vol));
    const effective = clamped <= 0.01 ? 0 : clamped;
    audioEngine.setMasterVolume(effective);
    setMixer(prev => ({ ...prev, masterVolume: effective }));
  }, []);

  const handleCrossfaderChange = useCallback((val: number) => {
    audioEngine.setCrossfader(val, mixer.crossfaderCurve);
    setMixer(prev => ({ ...prev, crossfader: val }));
  }, [mixer.crossfaderCurve]);

  const handleCrossfaderCurveToggle = useCallback(() => {
    const nextCurve = mixer.crossfaderCurve === 'smooth' ? 'scratch' : 'smooth';
    audioEngine.setCrossfader(mixer.crossfader, nextCurve);
    setMixer(prev => ({ ...prev, crossfaderCurve: nextCurve }));
  }, [mixer.crossfader, mixer.crossfaderCurve]);

  const handleDeckGainChange = useCallback((deckId: 'L' | 'R', val: number) => {
    audioEngine.setDeckGain(deckId, val);
    if (deckId === 'L') setDeckL(prev => ({ ...prev, gain: val }));
    else setDeckR(prev => ({ ...prev, gain: val }));
  }, []);

  const handleDeckEQChange = useCallback((deckId: 'L' | 'R', band: 'high' | 'mid' | 'low', val: number) => {
    const target = deckId === 'L' ? deckLRef.current : deckRRef.current;
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
      setDeckL(prev => ({ ...prev, eqHigh: nextHigh, eqMid: nextMid, eqLow: nextLow }));
    } else {
      setDeckR(prev => ({ ...prev, eqHigh: nextHigh, eqMid: nextMid, eqLow: nextLow }));
    }
  }, []);

  const handleDeckEQKillToggle = useCallback((deckId: 'L' | 'R', band: 'high' | 'mid' | 'low') => {
    const target = deckId === 'L' ? deckLRef.current : deckRRef.current;
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
      setDeckL(prev => ({ ...prev, eqHighKill: killHigh, eqMidKill: killMid, eqLowKill: killLow }));
    } else {
      setDeckR(prev => ({ ...prev, eqHighKill: killHigh, eqMidKill: killMid, eqLowKill: killLow }));
    }
  }, []);

  const handleDeckFilterChange = useCallback((deckId: 'L' | 'R', val: number) => {
    audioEngine.setDeckFilter(deckId, val);
    if (deckId === 'L') setDeckL(prev => ({ ...prev, filter: val }));
    else setDeckR(prev => ({ ...prev, filter: val }));
  }, []);

  const handleDeckVolumeChange = useCallback((deckId: 'L' | 'R', val: number) => {
    const clamped = Math.max(0, Math.min(1.2, val));
    const effective = clamped <= 0.01 ? 0 : clamped;
    audioEngine.setDeckVolume(deckId, effective);
    if (deckId === 'L') setDeckL(prev => ({ ...prev, volume: effective }));
    else setDeckR(prev => ({ ...prev, volume: effective }));
  }, []);

  const handleDeckPitchChange = useCallback((deckId: 'L' | 'R', val: number) => {
    audioEngine.setDeckPitch(deckId, val);
    if (deckId === 'L') setDeckL(prev => ({ ...prev, pitchPercent: val }));
    else setDeckR(prev => ({ ...prev, pitchPercent: val }));
  }, []);

  const handleDeckPitchBend = useCallback((deckId: 'L' | 'R', amount: number) => {
    const current = deckId === 'L' ? deckLRef.current.pitchPercent : deckRRef.current.pitchPercent;
    audioEngine.setDeckPitch(deckId, current + amount * 100);
  }, []);

  const handleSyncDecks = useCallback((deckId: 'L' | 'R') => {
    if (deckId === 'L') {
      const targetPitch = ((deckRRef.current.bpm - deckLRef.current.bpm) / deckLRef.current.bpm) * 100;
      handleDeckPitchChange('L', targetPitch);
      setDeckL(prev => ({ ...prev, sync: !prev.sync }));
    } else {
      const targetPitch = ((deckLRef.current.bpm - deckRRef.current.bpm) / deckRRef.current.bpm) * 100;
      handleDeckPitchChange('R', targetPitch);
      setDeckR(prev => ({ ...prev, sync: !prev.sync }));
    }
  }, [handleDeckPitchChange]);

  const handleFxChange = useCallback((key: keyof MixerState, val: unknown) => {
    setMixer(prev => {
      const next = { ...prev, [key]: val };
      audioEngine.setFx(next.fxActive, next.fxType, next.fxWet, next.fxParam);
      return next;
    });
  }, []);

  // --- RECORDING CONTROLS ---
  const handleToggleRecording = useCallback(() => {
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
  }, [isRecording]);

  const handleDownloadRecording = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `turbo-dj-mix-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- UNIVERSAL MIDI ROUTING & ABLETON LEARN HANDLER ---
  const handleMidiMessage = useCallback(
    (event: MidiEventData) => {
      const { status, note, velocity } = event;
      setLastMidiEvent(event);

      const isCC = status >= 176 && status <= 191;

      // 1. If in MIDI EDIT MODE and user selected a control, MAP IT!
      if (isMidiEditMode && selectedMidiControl) {
        midiMappingService.updateMapping(selectedMidiControl, status, note, isCC);
        // Deselect control after learning or keep ready
        setSelectedMidiControl(null);
        return;
      }

      // If Note Off (velocity === 0), handle release for CUE preview
      if (!isCC && velocity === 0) {
        const offMapping = midiMappingService.findControlByMidi(status, note);
        if (offMapping?.controlId === 'transport_cue_l') {
          handleCueDeckLRelease();
        } else if (offMapping?.controlId === 'transport_cue_r') {
          handleCueDeckRRelease();
        }
        return;
      }

      // 2. Lookup mapping in MidiMappingService
      const mapping = midiMappingService.findControlByMidi(status, note);
      if (mapping) {
        const normVal = velocity / 127;

        switch (mapping.controlId) {
          // Transport
          case 'transport_play_l':
            handlePlayDeckL();
            return;
          case 'transport_play_r':
            handlePlayDeckR();
            return;
          case 'transport_cue_l':
            handleCueDeckL(true);
            return;
          case 'transport_cue_r':
            handleCueDeckR(true);
            return;
          case 'transport_stop_all':
            handleStopAll();
            return;
          case 'link_toggle':
            abletonLinkManager.toggleLink();
            return;
          case 'rec_toggle':
            handleToggleRecording();
            return;

          // Mixer Faders & Master
          case 'fader_volume_l':
            handleDeckVolumeChange('L', normVal * 1.2);
            return;
          case 'fader_volume_r':
            handleDeckVolumeChange('R', normVal * 1.2);
            return;
          case 'fader_master':
            handleMasterVolumeChange(normVal * 1.5);
            return;
          case 'fader_crossfader':
            handleCrossfaderChange(normVal * 2 - 1);
            return;

          // Deck L Controls
          case 'deck_gain_l':
            handleDeckGainChange('L', normVal * 2.0);
            return;
          case 'deck_eq_high_l':
            handleDeckEQChange('L', 'high', normVal * 32 - 26);
            return;
          case 'deck_eq_mid_l':
            handleDeckEQChange('L', 'mid', normVal * 32 - 26);
            return;
          case 'deck_eq_low_l':
            handleDeckEQChange('L', 'low', normVal * 32 - 26);
            return;
          case 'deck_eq_kill_high_l':
            handleDeckEQKillToggle('L', 'high');
            return;
          case 'deck_eq_kill_mid_l':
            handleDeckEQKillToggle('L', 'mid');
            return;
          case 'deck_eq_kill_low_l':
            handleDeckEQKillToggle('L', 'low');
            return;
          case 'deck_filter_l':
            handleDeckFilterChange('L', normVal * 2 - 1);
            return;
          case 'deck_cue_pfl_l':
            handleDeckCueMonitorToggle('L');
            return;
          case 'deck_pitch_l':
            handleDeckPitchChange('L', normVal * 32 - 16);
            return;
          case 'deck_sync_l':
            handleSyncDecks('L');
            return;
          case 'deck_loop_l':
            setDeckL(p => ({ ...p, isLooping: !p.isLooping }));
            return;
          case 'deck_jog_l': {
            const delta = velocity >= 64 ? (velocity - 128) * 0.04 : velocity * 0.04;
            handleJogScratch('L', delta);
            return;
          }
          case 'deck_hotcue_1_l':
          case 'deck_hotcue_2_l':
          case 'deck_hotcue_3_l':
          case 'deck_hotcue_4_l': {
            const cueIdx = parseInt(mapping.controlId.split('_')[2], 10) - 1;
            const target = deckLRef.current.hotCues[cueIdx];
            if (target !== null && target !== undefined) audioEngine.scrubDeck('L', target);
            return;
          }

          // Deck R Controls
          case 'deck_gain_r':
            handleDeckGainChange('R', normVal * 2.0);
            return;
          case 'deck_eq_high_r':
            handleDeckEQChange('R', 'high', normVal * 32 - 26);
            return;
          case 'deck_eq_mid_r':
            handleDeckEQChange('R', 'mid', normVal * 32 - 26);
            return;
          case 'deck_eq_low_r':
            handleDeckEQChange('R', 'low', normVal * 32 - 26);
            return;
          case 'deck_eq_kill_high_r':
            handleDeckEQKillToggle('R', 'high');
            return;
          case 'deck_eq_kill_mid_r':
            handleDeckEQKillToggle('R', 'mid');
            return;
          case 'deck_eq_kill_low_r':
            handleDeckEQKillToggle('R', 'low');
            return;
          case 'deck_filter_r':
            handleDeckFilterChange('R', normVal * 2 - 1);
            return;
          case 'deck_cue_pfl_r':
            handleDeckCueMonitorToggle('R');
            return;
          case 'deck_pitch_r':
            handleDeckPitchChange('R', normVal * 32 - 16);
            return;
          case 'deck_sync_r':
            handleSyncDecks('R');
            return;
          case 'deck_loop_r':
            setDeckR(p => ({ ...p, isLooping: !p.isLooping }));
            return;
          case 'deck_jog_r': {
            const delta = velocity >= 64 ? (velocity - 128) * 0.04 : velocity * 0.04;
            handleJogScratch('R', delta);
            return;
          }
          case 'deck_hotcue_1_r':
          case 'deck_hotcue_2_r':
          case 'deck_hotcue_3_r':
          case 'deck_hotcue_4_r': {
            const cueIdx = parseInt(mapping.controlId.split('_')[2], 10) - 1;
            const target = deckRRef.current.hotCues[cueIdx];
            if (target !== null && target !== undefined) audioEngine.scrubDeck('R', target);
            return;
          }

          // FX Rack
          case 'fx_active':
            handleFxChange('fxActive', !mixer.fxActive);
            return;
          case 'fx_wet':
            handleFxChange('fxWet', normVal);
            return;
          case 'fx_param':
            handleFxChange('fxParam', normVal);
            return;

          // Samples L
          default:
            if (mapping.controlId.startsWith('sample_l_')) {
              const idx = parseInt(mapping.controlId.replace('sample_l_', ''), 10) - 1;
              if (samplesL[idx]) handleTriggerSampleL(samplesL[idx].id);
              return;
            }
            if (mapping.controlId.startsWith('sample_r_')) {
              const idx = parseInt(mapping.controlId.replace('sample_r_', ''), 10) - 1;
              if (samplesR[idx]) handleTriggerSampleR(samplesR[idx].id);
              return;
            }
            if (mapping.controlId.startsWith('jingle_')) {
              const idx = parseInt(mapping.controlId.replace('jingle_', ''), 10) - 1;
              if (jingles[idx]) handleTriggerJingle(jingles[idx].id);
              return;
            }
            break;
        }
      }
    },
    [
      isMidiEditMode,
      selectedMidiControl,
      handlePlayDeckL,
      handlePlayDeckR,
      handleCueDeckL,
      handleCueDeckLRelease,
      handleCueDeckR,
      handleCueDeckRRelease,
      handleStopAll,
      handleToggleRecording,
      handleDeckVolumeChange,
      handleMasterVolumeChange,
      handleCrossfaderChange,
      handleDeckGainChange,
      handleDeckEQChange,
      handleDeckEQKillToggle,
      handleDeckFilterChange,
      handleDeckPitchChange,
      handleSyncDecks,
      handleFxChange,
      handleTriggerSampleL,
      handleTriggerSampleR,
      handleTriggerJingle,
      samplesL,
      samplesR,
      jingles,
      mixer.fxActive,
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
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.repeat) return;

      const key = e.key.toLowerCase();
      const code = e.code;

      // STOP ALL (Space or Escape)
      if (key === ' ' || key === 'escape' || code === 'Space' || code === 'Escape') {
        e.preventDefault();
        handleStopAll();
        return;
      }

      // Transport controls
      if (key === 'z' || code === 'KeyZ') {
        e.preventDefault();
        handlePlayDeckL();
        return;
      }
      if (key === 'x' || code === 'KeyX') {
        e.preventDefault();
        handlePlayDeckR();
        return;
      }
      if (key === 'c' || code === 'KeyC') {
        e.preventDefault();
        handleCueDeckL(true);
        return;
      }
      if (key === 'v' || code === 'KeyV') {
        e.preventDefault();
        handleCueDeckR(true);
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

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const key = e.key.toLowerCase();
      const code = e.code;

      // Release CUE preview on key release
      if (key === 'c' || code === 'KeyC') {
        e.preventDefault();
        handleCueDeckLRelease();
        return;
      }
      if (key === 'v' || code === 'KeyV') {
        e.preventDefault();
        handleCueDeckRRelease();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    handleStopAll,
    handlePlayDeckL,
    handlePlayDeckR,
    handleCueDeckL,
    handleCueDeckLRelease,
    handleCueDeckR,
    handleCueDeckRRelease,
    handleTriggerSampleL,
    handleTriggerSampleR,
    handleTriggerJingle,
    samplesL,
    samplesR,
    jingles,
  ]);

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
      setDeckL(prev => ({ ...prev, trackName: trackTitle, artist: 'Online / Search Track' }));
    } else {
      setDeckR(prev => ({ ...prev, trackName: trackTitle, artist: 'Online / Search Track' }));
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Professional DJ Header with Ableton Link, MIDI Bar & Blue MIDI EDIT button */}
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
        isMidiEditMode={isMidiEditMode}
        selectedMidiControl={selectedMidiControl}
        onToggleMidiEditMode={() => {
          setIsMidiEditMode(prev => !prev);
          setSelectedMidiControl(null);
        }}
        onOpenMidiNotepad={() => setIsMidiNotepadOpen(true)}
        onConnectMidi={handleConnectMidi}
        onDisconnectMidi={handleDisconnectMidi}
        onMasterVolumeChange={handleMasterVolumeChange}
        onStopAll={handleStopAll}
        onToggleRecording={handleToggleRecording}
        onDownloadRecording={handleDownloadRecording}
        hasRecording={!!recordedBlob}
        onSelectView={setActiveView}
        onBpmChange={bpm => {
          setDeckL(p => ({ ...p, bpm }));
          setDeckR(p => ({ ...p, bpm }));
        }}
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
              deckPeak={deckPeakL}
              isMidiEditMode={isMidiEditMode}
              selectedMidiControl={selectedMidiControl}
              onSelectMidiControl={id => setSelectedMidiControl(id)}
              onPlayToggle={handlePlayDeckL}
              onCue={handleCueDeckL}
              onCueHoldStart={() => handleCueDeckL(true)}
              onCueHoldEnd={handleCueDeckLRelease}
              onSetCuePoint={handleSetCueDeckL}
              onVolumeChange={val => handleDeckVolumeChange('L', val)}
              onScrub={sec => {
                audioEngine.scrubDeck('L', sec);
                setDeckL(p => ({ ...p, currentTime: sec }));
              }}
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
                  setDeckL(p => ({ ...p, currentTime: target }));
                }
              }}
              onSetLoop={beats => setDeckL(p => ({ ...p, loopLength: beats, isLooping: true }))}
              onToggleLoop={() => setDeckL(p => ({ ...p, isLooping: !p.isLooping }))}
              onLoadTrackFile={file => handleLoadDeckTrack('L', file)}
              onOpenAudioSources={() => setAudioSourcesModalDeck('L')}
            />

            {/* Central DJ Mixer */}
            <CentralMixer
              deckL={deckL}
              deckR={deckR}
              mixer={mixer}
              peakL={deckPeakL}
              peakR={deckPeakR}
              isMidiEditMode={isMidiEditMode}
              selectedMidiControl={selectedMidiControl}
              onSelectMidiControl={id => setSelectedMidiControl(id)}
              onDeckGainChange={handleDeckGainChange}
              onDeckEQChange={handleDeckEQChange}
              onDeckEQKillToggle={handleDeckEQKillToggle}
              onDeckFilterChange={handleDeckFilterChange}
              onDeckVolumeChange={handleDeckVolumeChange}
              onDeckCueMonitorToggle={handleDeckCueMonitorToggle}
              onCrossfaderChange={handleCrossfaderChange}
              onCrossfaderCurveToggle={handleCrossfaderCurveToggle}
              onFxChange={handleFxChange}
            />

            {/* Deck B (Right) */}
            <DeckPlayer
              deck={deckR}
              otherDeckBpm={deckL.bpm}
              deckPeak={deckPeakR}
              isMidiEditMode={isMidiEditMode}
              selectedMidiControl={selectedMidiControl}
              onSelectMidiControl={id => setSelectedMidiControl(id)}
              onPlayToggle={handlePlayDeckR}
              onCue={handleCueDeckR}
              onCueHoldStart={() => handleCueDeckR(true)}
              onCueHoldEnd={handleCueDeckRRelease}
              onSetCuePoint={handleSetCueDeckR}
              onVolumeChange={val => handleDeckVolumeChange('R', val)}
              onScrub={sec => {
                audioEngine.scrubDeck('R', sec);
                setDeckR(p => ({ ...p, currentTime: sec }));
              }}
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
                  setDeckR(p => ({ ...p, currentTime: target }));
                }
              }}
              onSetLoop={beats => setDeckR(p => ({ ...p, loopLength: beats, isLooping: true }))}
              onToggleLoop={() => setDeckR(p => ({ ...p, isLooping: !p.isLooping }))}
              onLoadTrackFile={file => handleLoadDeckTrack('R', file)}
              onOpenAudioSources={() => setAudioSourcesModalDeck('R')}
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
                isMidiEditMode={isMidiEditMode}
                selectedMidiControl={selectedMidiControl}
                onSelectMidiControl={id => setSelectedMidiControl(id)}
                onTriggerPad={handleTriggerSampleL}
                onFileUpload={(id, file) => handleFileUpload(id, file, 'sampleL')}
                onVolumeChange={(id, vol) => handlePadVolumeChange(id, vol, 'sampleL')}
              />
              <PerformancePads
                title="Samples Dreapta (Deck B Pads)"
                deckSide="R"
                samples={samplesR}
                activePads={activePads}
                isMidiEditMode={isMidiEditMode}
                selectedMidiControl={selectedMidiControl}
                onSelectMidiControl={id => setSelectedMidiControl(id)}
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
              isMidiEditMode={isMidiEditMode}
              selectedMidiControl={selectedMidiControl}
              onSelectMidiControl={id => setSelectedMidiControl(id)}
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
                deckPeak={deckPeakL}
                isMidiEditMode={isMidiEditMode}
                selectedMidiControl={selectedMidiControl}
                onSelectMidiControl={id => setSelectedMidiControl(id)}
                onPlayToggle={handlePlayDeckL}
                onCue={handleCueDeckL}
                onCueHoldStart={() => handleCueDeckL(true)}
                onCueHoldEnd={handleCueDeckLRelease}
                onSetCuePoint={handleSetCueDeckL}
                onVolumeChange={val => handleDeckVolumeChange('L', val)}
                onScrub={sec => {
                  audioEngine.scrubDeck('L', sec);
                  setDeckL(p => ({ ...p, currentTime: sec }));
                }}
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
                    setDeckL(p => ({ ...p, currentTime: target }));
                  }
                }}
                onSetLoop={beats => setDeckL(p => ({ ...p, loopLength: beats, isLooping: true }))}
                onToggleLoop={() => setDeckL(p => ({ ...p, isLooping: !p.isLooping }))}
                onLoadTrackFile={file => handleLoadDeckTrack('L', file)}
                onOpenAudioSources={() => setAudioSourcesModalDeck('L')}
              />

              <CentralMixer
                deckL={deckL}
                deckR={deckR}
                mixer={mixer}
                peakL={deckPeakL}
                peakR={deckPeakR}
                isMidiEditMode={isMidiEditMode}
                selectedMidiControl={selectedMidiControl}
                onSelectMidiControl={id => setSelectedMidiControl(id)}
                onDeckGainChange={handleDeckGainChange}
                onDeckEQChange={handleDeckEQChange}
                onDeckEQKillToggle={handleDeckEQKillToggle}
                onDeckFilterChange={handleDeckFilterChange}
                onDeckVolumeChange={handleDeckVolumeChange}
                onDeckCueMonitorToggle={handleDeckCueMonitorToggle}
                onCrossfaderChange={handleCrossfaderChange}
                onCrossfaderCurveToggle={handleCrossfaderCurveToggle}
                onFxChange={handleFxChange}
              />

              <DeckPlayer
                deck={deckR}
                otherDeckBpm={deckL.bpm}
                deckPeak={deckPeakR}
                isMidiEditMode={isMidiEditMode}
                selectedMidiControl={selectedMidiControl}
                onSelectMidiControl={id => setSelectedMidiControl(id)}
                onPlayToggle={handlePlayDeckR}
                onCue={handleCueDeckR}
                onCueHoldStart={() => handleCueDeckR(true)}
                onCueHoldEnd={handleCueDeckRRelease}
                onSetCuePoint={handleSetCueDeckR}
                onVolumeChange={val => handleDeckVolumeChange('R', val)}
                onScrub={sec => {
                  audioEngine.scrubDeck('R', sec);
                  setDeckR(p => ({ ...p, currentTime: sec }));
                }}
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
                    setDeckR(p => ({ ...p, currentTime: target }));
                  }
                }}
                onSetLoop={beats => setDeckR(p => ({ ...p, loopLength: beats, isLooping: true }))}
                onToggleLoop={() => setDeckR(p => ({ ...p, isLooping: !p.isLooping }))}
                onLoadTrackFile={file => handleLoadDeckTrack('R', file)}
                onOpenAudioSources={() => setAudioSourcesModalDeck('R')}
              />
            </div>

            {/* Performance Samples & Jingles */}
            <div className="flex flex-col md:flex-row gap-4">
              <PerformancePads
                title="Samples Stânga"
                deckSide="L"
                samples={samplesL}
                activePads={activePads}
                isMidiEditMode={isMidiEditMode}
                selectedMidiControl={selectedMidiControl}
                onSelectMidiControl={id => setSelectedMidiControl(id)}
                onTriggerPad={handleTriggerSampleL}
                onFileUpload={(id, file) => handleFileUpload(id, file, 'sampleL')}
                onVolumeChange={(id, vol) => handlePadVolumeChange(id, vol, 'sampleL')}
              />
              <PerformancePads
                title="Samples Dreapta"
                deckSide="R"
                samples={samplesR}
                activePads={activePads}
                isMidiEditMode={isMidiEditMode}
                selectedMidiControl={selectedMidiControl}
                onSelectMidiControl={id => setSelectedMidiControl(id)}
                onTriggerPad={handleTriggerSampleR}
                onFileUpload={(id, file) => handleFileUpload(id, file, 'sampleR')}
                onVolumeChange={(id, vol) => handlePadVolumeChange(id, vol, 'sampleR')}
              />
            </div>

            <JinglesMatrix
              jingles={jingles}
              activeJingles={activePads}
              isMidiEditMode={isMidiEditMode}
              selectedMidiControl={selectedMidiControl}
              onSelectMidiControl={id => setSelectedMidiControl(id)}
              onTriggerJingle={handleTriggerJingle}
              onFileUpload={(id, file) => handleFileUpload(id, file, 'jingle')}
              onVolumeChange={(id, vol) => handlePadVolumeChange(id, vol, 'jingle')}
            />
          </div>
        )}

        {/* VIEW 5: YOUTUBE, SPOTIFY & FESTIFY SEARCH */}
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

        {/* VIEW 6: LOCAL MUSIC EXPLORER (PC / LAPTOP / PHONE) */}
        {activeView === 'explorer' && (
          <MusicExplorerSection
            onLoadTrackToDeck={(deckId, file, buffer) => {
              if (buffer) {
                audioEngine.setDeckBuffer(deckId, buffer);
                const name = file.name.replace(/\.[^/.]+$/, '');
                if (deckId === 'L') {
                  setDeckL(prev => ({
                    ...prev,
                    trackName: name,
                    artist: 'Colecție Locală',
                    duration: buffer.duration,
                    audioBuffer: buffer,
                    currentTime: 0,
                    isPlaying: false,
                  }));
                } else {
                  setDeckR(prev => ({
                    ...prev,
                    trackName: name,
                    artist: 'Colecție Locală',
                    duration: buffer.duration,
                    audioBuffer: buffer,
                    currentTime: 0,
                    isPlaying: false,
                  }));
                }
              } else {
                handleLoadDeckTrack(deckId, file);
              }
            }}
            trackEndMode={trackEndMode}
            onTrackEndModeChange={mode => setTrackEndMode(mode)}
            connectedMidiDevice={midiDevices.length > 0 ? midiDevices.join(', ') : 'Hercules DJ / OTG'}
            deckLTrackName={deckL.trackName}
            deckRTrackName={deckR.trackName}
          />
        )}

        {/* VIEW 7: ANDROID & MOBILE TACTILE DJ CONSOLE (OTG COMPATIBLE) */}
        {activeView === 'android' && (
          <AndroidConsoleView
            deckL={deckL}
            deckR={deckR}
            mixer={mixer}
            peakL={deckPeakL}
            peakR={deckPeakR}
            connectedMidiDevice={midiDevices.length > 0 ? midiDevices.join(', ') : 'Hercules DJControl Inpulse (OTG)'}
            onPlayToggleL={handlePlayDeckL}
            onPlayToggleR={handlePlayDeckR}
            onCueL={handleCueDeckL}
            onCueR={handleCueDeckR}
            onCueHoldStartL={() => handleCueDeckL(true)}
            onCueHoldEndL={handleCueDeckLRelease}
            onCueHoldStartR={() => handleCueDeckR(true)}
            onCueHoldEndR={handleCueDeckRRelease}
            onSetCuePointL={handleSetCueDeckL}
            onSetCuePointR={handleSetCueDeckR}
            onSyncL={() => handleSyncDecks('L')}
            onSyncR={() => handleSyncDecks('R')}
            onToggleLoopL={() => setDeckL(p => ({ ...p, isLooping: !p.isLooping }))}
            onToggleLoopR={() => setDeckR(p => ({ ...p, isLooping: !p.isLooping }))}
            onHotCueL={idx => {
              const target = deckL.hotCues[idx];
              if (target !== null && target !== undefined) {
                audioEngine.scrubDeck('L', target);
                setDeckL(p => ({ ...p, currentTime: target }));
              }
            }}
            onHotCueR={idx => {
              const target = deckR.hotCues[idx];
              if (target !== null && target !== undefined) {
                audioEngine.scrubDeck('R', target);
                setDeckR(p => ({ ...p, currentTime: target }));
              }
            }}
            onJogScratchL={delta => handleJogScratch('L', delta)}
            onJogScratchR={delta => handleJogScratch('R', delta)}
            onVolumeChangeL={val => handleDeckVolumeChange('L', val)}
            onVolumeChangeR={val => handleDeckVolumeChange('R', val)}
            onCrossfaderChange={handleCrossfaderChange}
            onCueMonitorToggleL={() => handleDeckCueMonitorToggle('L')}
            onCueMonitorToggleR={() => handleDeckCueMonitorToggle('R')}
            onDeckEQChange={handleDeckEQChange}
            onDeckFilterChange={handleDeckFilterChange}
            onTriggerSample={id => {
              if (id.startsWith('j-')) handleTriggerJingle(id);
              else if (id.startsWith('s-l-')) handleTriggerSampleL(id);
              else handleTriggerSampleR(id);
            }}
            onOpenExplorer={() => setActiveView('explorer')}
          />
        )}
      </main>

      {/* MIDI Notepad & Table Editor Modal */}
      <MidiNotepadModal
        isOpen={isMidiNotepadOpen}
        onClose={() => setIsMidiNotepadOpen(false)}
        learningControlId={selectedMidiControl}
        onSelectControlToLearn={id => {
          setSelectedMidiControl(id);
          setIsMidiEditMode(true);
          setIsMidiNotepadOpen(false);
        }}
      />

      {/* Audio Sources Modal (Files, Presets, URLs, Mic) */}
      {audioSourcesModalDeck && (
        <AudioSourcesModal
          isOpen={true}
          deckId={audioSourcesModalDeck}
          onClose={() => setAudioSourcesModalDeck(null)}
          onSelectTrack={(trackName, artist, buffer, bpm) => {
            const id = audioSourcesModalDeck;
            audioEngine.setDeckBuffer(id, buffer);
            if (id === 'L') {
              setDeckL(prev => ({
                ...prev,
                trackName,
                artist,
                duration: buffer.duration,
                audioBuffer: buffer,
                bpm,
                currentTime: 0,
                isPlaying: false,
              }));
            } else {
              setDeckR(prev => ({
                ...prev,
                trackName,
                artist,
                duration: buffer.duration,
                audioBuffer: buffer,
                bpm,
                currentTime: 0,
                isPlaying: false,
              }));
            }
          }}
        />
      )}
    </div>
  );
};

export default App;
