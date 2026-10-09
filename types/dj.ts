export interface MidiBinding {
  status: number;
  note: number;
}

export interface SoundItem {
  id: string;
  name: string;
  key: string;
  midi: MidiBinding;
  isPlay?: boolean;
  isCue?: boolean;
  color?: string;
  customFileName?: string;
  audioBuffer?: AudioBuffer | null;
  isPlaying?: boolean;
  volume?: number; // 0 to 1
  category: 'jingle' | 'sampleL' | 'sampleR' | 'transport';
}

export interface DeckState {
  id: 'L' | 'R';
  name: string;
  trackName: string;
  artist: string;
  bpm: number;
  targetBpm: number;
  pitchPercent: number; // -16% to +16%
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  cuePoint: number;
  isLooping: boolean;
  loopLength: number; // in beats: 0.5, 1, 2, 4, 8, 16
  sync: boolean;
  keyLock: boolean;
  hotCues: (number | null)[]; // 4 hot cues in seconds
  audioBuffer: AudioBuffer | null;
  // Mixer strip settings
  gain: number; // 0 to 2, 1 = neutral
  eqHigh: number; // -26dB to +6dB, 0 = neutral
  eqMid: number; // -26dB to +6dB, 0 = neutral
  eqLow: number; // -26dB to +6dB, 0 = neutral
  eqHighKill: boolean;
  eqMidKill: boolean;
  eqLowKill: boolean;
  filter: number; // -1 (LPF) to 0 (flat) to +1 (HPF)
  volume: number; // 0 to 1 (channel fader)
  cueMonitor: boolean; // PFL headphone
}

export interface MixerState {
  crossfader: number; // -1 (Deck L) to 0 (Center) to 1 (Deck R)
  crossfaderCurve: 'smooth' | 'scratch';
  masterVolume: number; // 0 to 1
  boothVolume: number; // 0 to 1
  fxType: 'filter' | 'echo' | 'reverb' | 'flanger';
  fxWet: number; // 0 to 1
  fxParam: number; // 0 to 1
  fxActive: boolean;
}

export interface MidiLogEntry {
  status: number;
  note: number;
  velocity: number;
  timestamp: number;
  targetName?: string;
}
