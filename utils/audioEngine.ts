/**
 * Pro Web Audio API Engine for Turbo Soundboard & DJ Mixing Console
 */

import { createDjDeckLoopBuffer, createSynthesizedBuffer } from './soundSynthesizer';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  // Master nodes
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private recorderDest: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  // Decks
  private deckNodes: {
    [key in 'L' | 'R']: {
      source: AudioBufferSourceNode | null;
      gainNode: GainNode;
      trimGain: GainNode;
      eqLow: BiquadFilterNode;
      eqMid: BiquadFilterNode;
      eqHigh: BiquadFilterNode;
      colorFilter: BiquadFilterNode;
      crossfaderGain: GainNode;
      analyser: AnalyserNode;
      buffer: AudioBuffer | null;
      startTime: number;
      pauseOffset: number;
      isPlaying: boolean;
      playbackRate: number;
    } | null;
  } = { L: null, R: null };

  // FX Nodes
  private fxDelay: DelayNode | null = null;
  private fxFeedback: GainNode | null = null;
  private fxWetGain: GainNode | null = null;
  private fxDryGain: GainNode | null = null;
  private fxBiquad: BiquadFilterNode | null = null;

  // Active playing sound nodes (for Jingles and Samples)
  private activeSoundSources: Map<string, { source: AudioBufferSourceNode; gain: GainNode }> = new Map();

  // Persistent volume, gain and crossfader state
  private deckVolumes: { L: number; R: number } = { L: 0.9, R: 0.9 };
  private deckGains: { L: number; R: number } = { L: 1.0, R: 1.0 };
  private masterVolumeVal: number = 0.9;
  private crossfaderVal = 0; // -1 to +1
  private crossfaderCurve: 'smooth' | 'scratch' = 'smooth';

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public init() {
    if (this.isInitialized) return;
    const ctx = this.getContext();

    // Master bus
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolumeVal, ctx.currentTime);

    this.masterCompressor = ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.setValueAtTime(-1.5, ctx.currentTime);
    this.masterCompressor.knee.setValueAtTime(6, ctx.currentTime);
    this.masterCompressor.ratio.setValueAtTime(4, ctx.currentTime);
    this.masterCompressor.attack.setValueAtTime(0.003, ctx.currentTime);
    this.masterCompressor.release.setValueAtTime(0.15, ctx.currentTime);

    this.masterAnalyser = ctx.createAnalyser();
    this.masterAnalyser.fftSize = 256;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    // Recorder destination
    this.recorderDest = ctx.createMediaStreamDestination();

    // FX Bus
    this.fxDelay = ctx.createDelay();
    this.fxDelay.delayTime.setValueAtTime(0.25, ctx.currentTime); // 1/4 beat echo
    this.fxFeedback = ctx.createGain();
    this.fxFeedback.gain.setValueAtTime(0.4, ctx.currentTime);
    this.fxDelay.connect(this.fxFeedback);
    this.fxFeedback.connect(this.fxDelay);

    this.fxBiquad = ctx.createBiquadFilter();
    this.fxBiquad.type = 'bandpass';
    this.fxBiquad.frequency.setValueAtTime(1200, ctx.currentTime);
    this.fxBiquad.Q.setValueAtTime(2.0, ctx.currentTime);

    this.fxWetGain = ctx.createGain();
    this.fxWetGain.gain.setValueAtTime(0, ctx.currentTime);
    this.fxDryGain = ctx.createGain();
    this.fxDryGain.gain.setValueAtTime(1, ctx.currentTime);

    this.fxDelay.connect(this.fxWetGain);
    this.fxWetGain.connect(this.masterGain);

    // Connect Master chain
    this.masterGain.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterAnalyser);
    this.masterAnalyser.connect(ctx.destination);
    this.masterAnalyser.connect(this.recorderDest);

    // Init Deck L and Deck R nodes
    (['L', 'R'] as const).forEach(deckId => {
      const trimGain = ctx.createGain();
      const eqLow = ctx.createBiquadFilter();
      eqLow.type = 'lowshelf';
      eqLow.frequency.setValueAtTime(250, ctx.currentTime);
      eqLow.gain.setValueAtTime(0, ctx.currentTime);

      const eqMid = ctx.createBiquadFilter();
      eqMid.type = 'peaking';
      eqMid.frequency.setValueAtTime(1050, ctx.currentTime);
      eqMid.Q.setValueAtTime(1.1, ctx.currentTime);
      eqMid.gain.setValueAtTime(0, ctx.currentTime);

      const eqHigh = ctx.createBiquadFilter();
      eqHigh.type = 'highshelf';
      eqHigh.frequency.setValueAtTime(3800, ctx.currentTime);
      eqHigh.gain.setValueAtTime(0, ctx.currentTime);

      const colorFilter = ctx.createBiquadFilter();
      colorFilter.type = 'allpass';
      colorFilter.frequency.setValueAtTime(1000, ctx.currentTime);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(this.deckVolumes[deckId], ctx.currentTime);

      const crossfaderGain = ctx.createGain();
      crossfaderGain.gain.setValueAtTime(1.0, ctx.currentTime);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;

      // Audio Graph routing for Deck:
      // Source -> Trim -> EQLow -> EQMid -> EQHigh -> ColorFilter -> ChannelGain -> Analyser -> CrossfaderGain -> MasterGain
      trimGain.connect(eqLow);
      eqLow.connect(eqMid);
      eqMid.connect(eqHigh);
      eqHigh.connect(colorFilter);
      colorFilter.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(crossfaderGain);
      crossfaderGain.connect(this.masterGain!);

      // Also connect to FX delay
      gainNode.connect(this.fxDelay!);

      // Preload default deck club loops
      const defaultLoop = createDjDeckLoopBuffer(ctx, deckId, 128);

      this.deckNodes[deckId] = {
        source: null,
        gainNode,
        trimGain,
        eqLow,
        eqMid,
        eqHigh,
        colorFilter,
        crossfaderGain,
        analyser,
        buffer: defaultLoop,
        startTime: 0,
        pauseOffset: 0,
        isPlaying: false,
        playbackRate: 1.0,
      };
    });

    this.updateCrossfaderGains();
    this.isInitialized = true;
  }

  // --- DECK TRANSPORT & CONTROLS ---

  public playDeck(deckId: 'L' | 'R', onEnded?: () => void, isLooping = false) {
    this.init();
    const ctx = this.getContext();
    const deck = this.deckNodes[deckId];
    if (!deck || !deck.buffer) return;

    if (deck.isPlaying) return;

    // Strict volume enforcement: immediately apply current fader volume!
    // If fader is down (<=0.01), gain is STRICTLY 0!
    const effectiveVol = this.deckVolumes[deckId] <= 0.01 ? 0 : this.deckVolumes[deckId];
    deck.gainNode.gain.cancelScheduledValues(ctx.currentTime);
    deck.gainNode.gain.setValueAtTime(effectiveVol, ctx.currentTime);
    this.updateCrossfaderGains();

    const source = ctx.createBufferSource();
    source.buffer = deck.buffer;
    source.loop = isLooping;
    source.playbackRate.setValueAtTime(deck.playbackRate, ctx.currentTime);

    source.connect(deck.trimGain);

    const dur = deck.buffer.duration;
    const offset = Math.min(dur - 0.01, Math.max(0, deck.pauseOffset % dur));
    source.start(0, offset);
    deck.startTime = ctx.currentTime - offset / deck.playbackRate;
    deck.source = source;
    deck.isPlaying = true;

    source.onended = () => {
      deck.isPlaying = false;
      // When non-looping track finishes, reset position to beginning
      if (!isLooping) {
        deck.pauseOffset = 0;
      }
      if (onEnded) onEnded();
    };
  }

  public scratchDeck(deckId: 'L' | 'R', deltaSeconds: number, isLooping = false) {
    this.init();
    const deck = this.deckNodes[deckId];
    if (!deck || !deck.buffer) return;
    const dur = deck.buffer.duration;
    const cur = this.getDeckCurrentTime(deckId);
    const newTime = Math.max(0, Math.min(dur - 0.05, cur + deltaSeconds));
    deck.pauseOffset = newTime;

    if (deck.isPlaying) {
      this.pauseDeck(deckId);
      this.playDeck(deckId, undefined, isLooping);
    }
  }

  public async getAudioOutputDevices(): Promise<MediaDeviceInfo[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'audiooutput');
    } catch {
      return [];
    }
  }

  public async setAudioOutputDevice(deviceId: string): Promise<boolean> {
    const ctx = this.getContext() as unknown as { setSinkId?: (id: string) => Promise<void> };
    if (typeof ctx.setSinkId === 'function') {
      try {
        await ctx.setSinkId(deviceId);
        return true;
      } catch (err) {
        console.warn('AudioContext setSinkId error:', err);
      }
    }
    return false;
  }

  public pauseDeck(deckId: 'L' | 'R') {
    const deck = this.deckNodes[deckId];
    if (!deck || !deck.isPlaying || !deck.source) return;

    const ctx = this.getContext();
    const elapsed = (ctx.currentTime - deck.startTime) * deck.playbackRate;
    deck.pauseOffset = deck.buffer ? elapsed % deck.buffer.duration : 0;

    try {
      deck.source.stop();
      deck.source.disconnect();
    } catch {
      // ignore if already stopped
    }
    deck.source = null;
    deck.isPlaying = false;
  }

  public cueDeck(deckId: 'L' | 'R', cueTime: number = 0) {
    this.init();
    const deck = this.deckNodes[deckId];
    if (!deck) return;

    // Stop if currently playing
    if (deck.isPlaying && deck.source) {
      try {
        deck.source.stop();
        deck.source.disconnect();
      } catch {
        // ignore
      }
      deck.source = null;
      deck.isPlaying = false;
    }
    deck.pauseOffset = Math.max(0, cueTime);
  }

  public playDeckFromCue(deckId: 'L' | 'R', cueTime: number = 0, onEnded?: () => void) {
    this.init();
    this.cueDeck(deckId, cueTime);
    this.playDeck(deckId, onEnded);
  }

  public scrubDeck(deckId: 'L' | 'R', targetSeconds: number) {
    this.init();
    const deck = this.deckNodes[deckId];
    if (!deck || !deck.buffer) return;
    const clamped = Math.max(0, Math.min(deck.buffer.duration, targetSeconds));
    deck.pauseOffset = clamped;

    if (deck.isPlaying) {
      this.pauseDeck(deckId);
      this.playDeck(deckId);
    }
  }

  public setDeckPitch(deckId: 'L' | 'R', pitchPercent: number) {
    this.init();
    const deck = this.deckNodes[deckId];
    if (!deck) return;

    // rate: 1.0 + (pitchPercent / 100)
    const rate = Math.max(0.5, Math.min(2.0, 1.0 + pitchPercent / 100));
    deck.playbackRate = rate;

    if (deck.source && this.ctx) {
      deck.source.playbackRate.setValueAtTime(rate, this.ctx.currentTime);
    }
  }

  public setDeckBuffer(deckId: 'L' | 'R', buffer: AudioBuffer) {
    this.init();
    const deck = this.deckNodes[deckId];
    if (!deck) return;

    if (deck.isPlaying) {
      this.pauseDeck(deckId);
    }
    deck.buffer = buffer;
    deck.pauseOffset = 0;
  }

  public getDeckCurrentTime(deckId: 'L' | 'R'): number {
    const deck = this.deckNodes[deckId];
    if (!deck || !deck.buffer) return 0;
    if (!deck.isPlaying || !this.ctx) return deck.pauseOffset;

    const elapsed = (this.ctx.currentTime - deck.startTime) * deck.playbackRate;
    return elapsed % deck.buffer.duration;
  }

  // --- MIXER EQ & GAIN CONTROLS ---

  public setDeckGain(deckId: 'L' | 'R', gainVal: number) {
    const deck = this.deckNodes[deckId];
    if (!deck || !this.ctx) return;
    deck.trimGain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
  }

  public setDeckEQ(
    deckId: 'L' | 'R',
    eqHigh: number,
    eqMid: number,
    eqLow: number,
    highKill = false,
    midKill = false,
    lowKill = false
  ) {
    const deck = this.deckNodes[deckId];
    if (!deck || !this.ctx) return;

    deck.eqHigh.gain.setValueAtTime(highKill ? -70 : eqHigh, this.ctx.currentTime);
    deck.eqMid.gain.setValueAtTime(midKill ? -70 : eqMid, this.ctx.currentTime);
    deck.eqLow.gain.setValueAtTime(lowKill ? -70 : eqLow, this.ctx.currentTime);
  }

  public setDeckFilter(deckId: 'L' | 'R', filterVal: number) {
    // filterVal: -1 (Low Pass) to 0 (flat/allpass) to +1 (High Pass)
    const deck = this.deckNodes[deckId];
    if (!deck || !this.ctx) return;

    if (Math.abs(filterVal) < 0.05) {
      deck.colorFilter.type = 'allpass';
      deck.colorFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    } else if (filterVal < 0) {
      // Low pass: 20000Hz down to 200Hz
      deck.colorFilter.type = 'lowpass';
      const freq = 200 + Math.pow(1 + filterVal, 3) * 19800;
      deck.colorFilter.frequency.setValueAtTime(freq, this.ctx.currentTime);
      deck.colorFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);
    } else {
      // High pass: 20Hz up to 8000Hz
      deck.colorFilter.type = 'highpass';
      const freq = 20 + Math.pow(filterVal, 2.5) * 7980;
      deck.colorFilter.frequency.setValueAtTime(freq, this.ctx.currentTime);
      deck.colorFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);
    }
  }

  public setDeckVolume(deckId: 'L' | 'R', volume: number) {
    const clamped = Math.max(0, Math.min(1.2, volume));
    // When fader is down (<= 0.01), ensure STRICT 0.0 mute
    const effective = clamped <= 0.01 ? 0 : clamped;
    this.deckVolumes[deckId] = effective;
    const deck = this.deckNodes[deckId];
    if (deck && this.ctx) {
      deck.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      deck.gainNode.gain.setValueAtTime(effective, this.ctx.currentTime);
    }
  }

  // --- CROSSFADER ---

  public setCrossfader(val: number, curve: 'smooth' | 'scratch' = 'smooth') {
    this.crossfaderVal = Math.max(-1, Math.min(1, val));
    this.crossfaderCurve = curve;
    this.updateCrossfaderGains();
  }

  private updateCrossfaderGains() {
    if (!this.ctx) return;
    const deckL = this.deckNodes.L;
    const deckR = this.deckNodes.R;
    if (!deckL || !deckR) return;

    const x = this.crossfaderVal; // -1 to +1
    let gainL = 1;
    let gainR = 1;

    if (this.crossfaderCurve === 'smooth') {
      // Constant power crossfade
      // angle from 0 (Deck L only) to PI/2 (Deck R only)
      const norm = (x + 1) / 2; // 0 to 1
      gainL = Math.cos(norm * 0.5 * Math.PI);
      gainR = Math.sin(norm * 0.5 * Math.PI);
    } else {
      // Scratch curve: sharp cut within 5% from edges
      if (x < -0.9) {
        gainL = 1;
        gainR = (x + 1) * 10;
      } else if (x > 0.9) {
        gainL = (1 - x) * 10;
        gainR = 1;
      } else {
        gainL = 1;
        gainR = 1;
      }
    }

    // Cut completely if at extreme ends
    if (x <= -0.99) {
      gainL = 1;
      gainR = 0;
    } else if (x >= 0.99) {
      gainL = 0;
      gainR = 1;
    }

    deckL.crossfaderGain.gain.setValueAtTime(gainL, this.ctx.currentTime);
    deckR.crossfaderGain.gain.setValueAtTime(gainR, this.ctx.currentTime);
  }

  // --- MASTER & FX ---

  public setMasterVolume(val: number) {
    const clamped = Math.max(0, Math.min(1.5, val));
    const effective = clamped <= 0.01 ? 0 : clamped;
    this.masterVolumeVal = effective;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(effective, this.ctx.currentTime);
    }
  }

  public setFx(active: boolean, type: string, wet: number, param: number) {
    if (!this.ctx || !this.fxWetGain || !this.fxDelay || !this.fxFeedback) return;

    if (!active || wet <= 0.01) {
      this.fxWetGain.gain.setValueAtTime(0, this.ctx.currentTime);
      return;
    }

    this.fxWetGain.gain.setValueAtTime(wet, this.ctx.currentTime);

    if (type === 'echo') {
      // param controls delay time (1/8 to 1/2 beat)
      const delayTime = 0.125 + param * 0.375;
      this.fxDelay.delayTime.setValueAtTime(delayTime, this.ctx.currentTime);
      this.fxFeedback.gain.setValueAtTime(0.3 + param * 0.45, this.ctx.currentTime);
    } else if (type === 'filter' && this.fxBiquad) {
      const f = 200 + param * 4000;
      this.fxBiquad.frequency.setValueAtTime(f, this.ctx.currentTime);
    }
  }

  // --- SOUNDBOARD (JINGLES & SAMPLES) ---

  public playSound(
    id: string,
    buffer: AudioBuffer | null,
    defaultType: string,
    volume: number = 0.9,
    onEnded?: () => void
  ) {
    this.init();
    const ctx = this.getContext();

    // Stop if already playing this pad
    this.stopSound(id);

    // If no buffer provided yet, generate synthesized fallback immediately!
    const audioBuf = buffer || createSynthesizedBuffer(ctx, defaultType);

    const source = ctx.createBufferSource();
    source.buffer = audioBuf;

    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(Math.max(0, Math.min(1.5, volume)), ctx.currentTime);

    source.connect(padGain);
    padGain.connect(this.masterGain!);

    source.start(0);
    this.activeSoundSources.set(id, { source, gain: padGain });

    source.onended = () => {
      this.activeSoundSources.delete(id);
      if (onEnded) onEnded();
    };
  }

  public stopSound(id: string) {
    const active = this.activeSoundSources.get(id);
    if (active) {
      try {
        active.source.stop();
        active.source.disconnect();
      } catch {
        // ignore
      }
      this.activeSoundSources.delete(id);
    }
  }

  public stopAll() {
    // 1. Stop all active sampler & jingle nodes
    this.activeSoundSources.forEach(({ source }) => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeSoundSources.clear();

    // 2. Pause both decks
    this.pauseDeck('L');
    this.pauseDeck('R');
  }

  // --- ANALYSERS & VU METERS ---

  public getMasterPeak(): { left: number; right: number } {
    if (!this.masterAnalyser) return { left: 0, right: 0 };
    const data = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    const peak = Math.min(1.0, rms * 3.5);
    // Slight stereo variation for visual realism
    return { left: peak, right: Math.min(1.0, peak * (0.95 + Math.random() * 0.1)) };
  }

  // Microphone nodes
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;
  private isMicOn = false;

  public async startMicrophone(): Promise<boolean> {
    try {
      this.init();
      const ctx = this.getContext();
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micSource = ctx.createMediaStreamSource(this.micStream);
      this.micGain = ctx.createGain();
      this.micGain.gain.setValueAtTime(1.0, ctx.currentTime);
      this.micSource.connect(this.micGain);
      this.micGain.connect(this.masterGain!);
      this.isMicOn = true;
      return true;
    } catch (e) {
      console.warn('Microphone access error:', e);
      return false;
    }
  }

  public stopMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch {}
      this.micSource = null;
    }
    if (this.micGain) {
      try {
        this.micGain.disconnect();
      } catch {}
      this.micGain = null;
    }
    this.isMicOn = false;
  }

  public isMicrophoneActive(): boolean {
    return this.isMicOn;
  }

  public setMicrophoneVolume(vol: number) {
    if (this.micGain && this.ctx) {
      this.micGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  public async loadAudioFromUrl(url: string): Promise<AudioBuffer> {
    const ctx = this.getContext();
    const response = await fetch(url);
    const arrayBuf = await response.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuf);
  }

  public getDeckPeak(deckId: 'L' | 'R'): number {
    const deck = this.deckNodes[deckId];
    if (!deck || !deck.isPlaying) return 0;

    const data = new Uint8Array(deck.analyser.frequencyBinCount);
    deck.analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    return Math.min(1.0, rms * 3.2);
  }

  // --- FILE DECODING ---

  public async decodeAudioFile(file: File | Blob): Promise<AudioBuffer> {
    const ctx = this.getContext();
    const arrayBuffer = await file.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  }

  // --- MASTER RECORDING ---

  public startRecording(): boolean {
    if (!this.recorderDest) return false;
    try {
      this.recordedChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      this.mediaRecorder = new MediaRecorder(this.recorderDest.stream, { mimeType });

      this.mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };

      this.mediaRecorder.start(200);
      return true;
    } catch (e) {
      console.error('Failed to start recording:', e);
      return false;
    }
  }

  public stopRecording(): Blob | null {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') return null;
    this.mediaRecorder.stop();
    const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
    this.recordedChunks = [];
    return blob;
  }
}

export const audioEngine = new AudioEngine();
