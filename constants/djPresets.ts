import { SoundItem } from '../types/dj';

export const INITIAL_JINGLES: (SoundItem & { defaultSynth: string })[] = [
  { id: 'j-1', name: 'Airhorn Blast', key: 'f', midi: { status: 153, note: 36 }, category: 'jingle', color: 'from-amber-500 to-red-600', defaultSynth: 'airhorn' },
  { id: 'j-2', name: 'Drop The Bass', key: 'g', midi: { status: 153, note: 37 }, category: 'jingle', color: 'from-purple-600 to-indigo-700', defaultSynth: 'drop_bass' },
  { id: 'j-3', name: 'Rewind Scratch', key: 'h', midi: { status: 153, note: 38 }, category: 'jingle', color: 'from-blue-600 to-cyan-600', defaultSynth: 'rewind_scratch' },
  { id: 'j-4', name: 'Radio Station ID', key: 'j', midi: { status: 153, note: 39 }, category: 'jingle', color: 'from-emerald-500 to-teal-700', defaultSynth: 'radio_id' },
  { id: 'j-5', name: 'Laser Burst', key: '5', midi: { status: 153, note: 40 }, category: 'jingle', color: 'from-pink-500 to-rose-600', defaultSynth: 'laser_burst' },
  { id: 'j-6', name: 'Crowd Cheer', key: 'b', midi: { status: 153, note: 41 }, category: 'jingle', color: 'from-yellow-500 to-amber-600', defaultSynth: 'crowd_cheer' },
  { id: 'j-7', name: 'Cyber Impact', key: 'n', midi: { status: 153, note: 42 }, category: 'jingle', color: 'from-cyan-500 to-blue-700', defaultSynth: 'cyber_hit' },
  { id: 'j-8', name: 'Synth Riser', key: 'm', midi: { status: 153, note: 43 }, category: 'jingle', color: 'from-violet-600 to-fuchsia-700', defaultSynth: 'synth_riser' },
  { id: 'j-9', name: 'Dub Siren FX', key: '1', midi: { status: 153, note: 44 }, category: 'jingle', color: 'from-red-600 to-orange-600', defaultSynth: 'siren' },
  { id: 'j-10', name: 'Vocal "Hey!"', key: '2', midi: { status: 153, note: 45 }, category: 'jingle', color: 'from-emerald-600 to-green-700', defaultSynth: 'vox_chant' },
  { id: 'j-11', name: '808 Sub Drop', key: '3', midi: { status: 153, note: 46 }, category: 'jingle', color: 'from-blue-700 to-indigo-900', defaultSynth: 'sub_bass' },
  { id: 'j-12', name: 'Crash Sweep', key: '4', midi: { status: 153, note: 47 }, category: 'jingle', color: 'from-orange-500 to-red-500', defaultSynth: 'crash' },
  { id: 'j-13', name: 'Club Stabs', key: '6', midi: { status: 153, note: 48 }, category: 'jingle', color: 'from-purple-500 to-pink-600', defaultSynth: 'synth_stab' },
  { id: 'j-14', name: 'Down Sweeper', key: '7', midi: { status: 153, note: 49 }, category: 'jingle', color: 'from-teal-500 to-cyan-700', defaultSynth: 'sweep_down' },
  { id: 'j-15', name: 'Snappy Clap', key: '8', midi: { status: 153, note: 50 }, category: 'jingle', color: 'from-amber-600 to-yellow-700', defaultSynth: 'clap' },
  { id: 'j-16', name: 'Turbo Laser', key: '9', midi: { status: 153, note: 51 }, category: 'jingle', color: 'from-rose-600 to-red-700', defaultSynth: 'laser_zap' },
];

export const INITIAL_SAMPLES_L: (SoundItem & { defaultSynth: string })[] = [
  { id: 's-l-1', name: 'Kick 808', key: 'q', midi: { status: 150, note: 48 }, category: 'sampleL', color: 'from-cyan-600 to-blue-800', defaultSynth: 'kick' },
  { id: 's-l-2', name: 'Snare Snap', key: 'w', midi: { status: 150, note: 52 }, category: 'sampleL', color: 'from-cyan-500 to-teal-700', defaultSynth: 'snare' },
  { id: 's-l-3', name: 'Closed Hat', key: 'e', midi: { status: 150, note: 49 }, category: 'sampleL', color: 'from-blue-500 to-indigo-700', defaultSynth: 'hihat_closed' },
  { id: 's-l-4', name: 'Open Hi-Hat', key: 'r', midi: { status: 150, note: 53 }, category: 'sampleL', color: 'from-sky-500 to-cyan-700', defaultSynth: 'hihat_open' },
  { id: 's-l-5', name: 'Club Clap', key: 't', midi: { status: 150, note: 50 }, category: 'sampleL', color: 'from-cyan-600 to-blue-700', defaultSynth: 'clap' },
  { id: 's-l-6', name: 'Rimshot Perc', key: 'y', midi: { status: 150, note: 54 }, category: 'sampleL', color: 'from-teal-600 to-emerald-800', defaultSynth: 'rimshot' },
  { id: 's-l-7', name: 'Low Tom Drum', key: 'u', midi: { status: 150, note: 51 }, category: 'sampleL', color: 'from-blue-600 to-sky-800', defaultSynth: 'tom' },
  { id: 's-l-8', name: 'House Shaker', key: 'i', midi: { status: 150, note: 55 }, category: 'sampleL', color: 'from-indigo-600 to-cyan-800', defaultSynth: 'shaker' },
];

export const INITIAL_SAMPLES_R: (SoundItem & { defaultSynth: string })[] = [
  { id: 's-r-1', name: 'Sub Boom 808', key: 'a', midi: { status: 151, note: 48 }, category: 'sampleR', color: 'from-amber-600 to-orange-800', defaultSynth: 'sub_bass' },
  { id: 's-r-2', name: 'Crash Cymbal', key: 's', midi: { status: 151, note: 52 }, category: 'sampleR', color: 'from-orange-500 to-red-700', defaultSynth: 'crash' },
  { id: 's-r-3', name: 'Rave Synth Stab', key: 'd', midi: { status: 151, note: 49 }, category: 'sampleR', color: 'from-red-600 to-rose-800', defaultSynth: 'synth_stab' },
  { id: 's-r-4', name: 'Laser Zap', key: 'f', midi: { status: 151, note: 53 }, category: 'sampleR', color: 'from-amber-500 to-yellow-700', defaultSynth: 'laser_zap' },
  { id: 's-r-5', name: 'DJ Dub Siren', key: 'g', midi: { status: 151, note: 50 }, category: 'sampleR', color: 'from-orange-600 to-amber-700', defaultSynth: 'siren' },
  { id: 's-r-6', name: 'Vocal "Hey!"', key: 'h', midi: { status: 151, note: 54 }, category: 'sampleR', color: 'from-yellow-600 to-orange-700', defaultSynth: 'vox_chant' },
  { id: 's-r-7', name: 'Sweep Down', key: 'j', midi: { status: 151, note: 51 }, category: 'sampleR', color: 'from-red-500 to-pink-700', defaultSynth: 'sweep_down' },
  { id: 's-r-8', name: 'Airhorn Mini', key: 'k', midi: { status: 151, note: 55 }, category: 'sampleR', color: 'from-rose-600 to-orange-800', defaultSynth: 'airhorn' },
];

export const TRANSPORT_CONTROLS: SoundItem[] = [
  { id: 'tr-play-l', name: 'PLAY L', key: 'z', midi: { status: 145, note: 7 }, isPlay: true, category: 'transport' },
  { id: 'tr-play-r', name: 'PLAY R', key: 'x', midi: { status: 146, note: 7 }, isPlay: true, category: 'transport' },
  { id: 'tr-cue-l', name: 'CUE L', key: 'c', midi: { status: 145, note: 6 }, isCue: true, category: 'transport' },
  { id: 'tr-cue-r', name: 'CUE R', key: 'v', midi: { status: 146, note: 6 }, isCue: true, category: 'transport' },
];
