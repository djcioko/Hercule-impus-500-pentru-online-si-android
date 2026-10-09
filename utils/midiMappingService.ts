/**
 * Universal MIDI Mapping & Ableton-style MIDI Learn Service
 * Maps any control ID (faders, knobs, buttons, jog, pads) to MIDI events.
 */

export type ControlType = 'button' | 'fader' | 'knob' | 'jog';

export interface MidiMappingEntry {
  controlId: string;
  name: string;
  category: 'transport' | 'mixer' | 'deck_l' | 'deck_r' | 'fx' | 'samples' | 'jingles' | 'master';
  type: ControlType;
  status: number; // e.g. 144..159 (Note On), 176..191 (CC)
  noteOrCC: number; // note number (0-127) or CC number (0-127)
  isCC: boolean;
  channel?: number;
  defaultValue?: number;
}

const STORAGE_KEY = 'turbo_dj_midi_mappings_v2';

export const DEFAULT_MIDI_MAPPINGS: MidiMappingEntry[] = [
  // --- TRANSPORT ---
  { controlId: 'transport_play_l', name: 'PLAY DECK L', category: 'transport', type: 'button', status: 145, noteOrCC: 7, isCC: false },
  { controlId: 'transport_play_r', name: 'PLAY DECK R', category: 'transport', type: 'button', status: 146, noteOrCC: 7, isCC: false },
  { controlId: 'transport_cue_l', name: 'CUE DECK L', category: 'transport', type: 'button', status: 145, noteOrCC: 6, isCC: false },
  { controlId: 'transport_cue_r', name: 'CUE DECK R', category: 'transport', type: 'button', status: 146, noteOrCC: 6, isCC: false },
  { controlId: 'transport_stop_all', name: 'STOP ALL', category: 'transport', type: 'button', status: 144, noteOrCC: 120, isCC: false },
  { controlId: 'link_toggle', name: 'ABLETON LINK SYNC', category: 'transport', type: 'button', status: 144, noteOrCC: 121, isCC: false },
  { controlId: 'rec_toggle', name: 'REC MIX LIVE', category: 'transport', type: 'button', status: 144, noteOrCC: 122, isCC: false },

  // --- MIXER FADERS & KNOBS ---
  { controlId: 'fader_volume_l', name: 'Fader Volum Deck L', category: 'mixer', type: 'fader', status: 176, noteOrCC: 1, isCC: true },
  { controlId: 'fader_volume_r', name: 'Fader Volum Deck R', category: 'mixer', type: 'fader', status: 176, noteOrCC: 2, isCC: true },
  { controlId: 'fader_master', name: 'Master Volum', category: 'master', type: 'knob', status: 176, noteOrCC: 7, isCC: true },
  { controlId: 'fader_crossfader', name: 'Crossfader L/R', category: 'mixer', type: 'fader', status: 176, noteOrCC: 8, isCC: true },

  // --- DECK L STRIP ---
  { controlId: 'deck_gain_l', name: 'Gain Deck L', category: 'deck_l', type: 'knob', status: 176, noteOrCC: 16, isCC: true },
  { controlId: 'deck_eq_high_l', name: 'EQ High Deck L', category: 'deck_l', type: 'knob', status: 176, noteOrCC: 17, isCC: true },
  { controlId: 'deck_eq_mid_l', name: 'EQ Mid Deck L', category: 'deck_l', type: 'knob', status: 176, noteOrCC: 18, isCC: true },
  { controlId: 'deck_eq_low_l', name: 'EQ Low Deck L', category: 'deck_l', type: 'knob', status: 176, noteOrCC: 19, isCC: true },
  { controlId: 'deck_eq_kill_high_l', name: 'Kill High L', category: 'deck_l', type: 'button', status: 144, noteOrCC: 20, isCC: false },
  { controlId: 'deck_eq_kill_mid_l', name: 'Kill Mid L', category: 'deck_l', type: 'button', status: 144, noteOrCC: 21, isCC: false },
  { controlId: 'deck_eq_kill_low_l', name: 'Kill Low L', category: 'deck_l', type: 'button', status: 144, noteOrCC: 22, isCC: false },
  { controlId: 'deck_filter_l', name: 'Color Filter Deck L', category: 'deck_l', type: 'knob', status: 176, noteOrCC: 23, isCC: true },
  { controlId: 'deck_cue_pfl_l', name: 'PFL Headphone Cue L', category: 'deck_l', type: 'button', status: 144, noteOrCC: 24, isCC: false },
  { controlId: 'deck_pitch_l', name: 'Pitch / Tempo Deck L', category: 'deck_l', type: 'fader', status: 176, noteOrCC: 25, isCC: true },
  { controlId: 'deck_sync_l', name: 'Sync BPM Deck L', category: 'deck_l', type: 'button', status: 144, noteOrCC: 26, isCC: false },
  { controlId: 'deck_loop_l', name: 'Loop Toggle Deck L', category: 'deck_l', type: 'button', status: 144, noteOrCC: 27, isCC: false },
  { controlId: 'deck_jog_l', name: 'Jog Vinyl Scratch L', category: 'deck_l', type: 'jog', status: 176, noteOrCC: 28, isCC: true },
  { controlId: 'deck_hotcue_1_l', name: 'Hot Cue 1 Deck L', category: 'deck_l', type: 'button', status: 144, noteOrCC: 29, isCC: false },
  { controlId: 'deck_hotcue_2_l', name: 'Hot Cue 2 Deck L', category: 'deck_l', type: 'button', status: 144, noteOrCC: 30, isCC: false },
  { controlId: 'deck_hotcue_3_l', name: 'Hot Cue 3 Deck L', category: 'deck_l', type: 'button', status: 144, noteOrCC: 31, isCC: false },
  { controlId: 'deck_hotcue_4_l', name: 'Hot Cue 4 Deck L', category: 'deck_l', type: 'button', status: 144, noteOrCC: 32, isCC: false },

  // --- DECK R STRIP ---
  { controlId: 'deck_gain_r', name: 'Gain Deck R', category: 'deck_r', type: 'knob', status: 176, noteOrCC: 33, isCC: true },
  { controlId: 'deck_eq_high_r', name: 'EQ High Deck R', category: 'deck_r', type: 'knob', status: 176, noteOrCC: 34, isCC: true },
  { controlId: 'deck_eq_mid_r', name: 'EQ Mid Deck R', category: 'deck_r', type: 'knob', status: 176, noteOrCC: 35, isCC: true },
  { controlId: 'deck_eq_low_r', name: 'EQ Low Deck R', category: 'deck_r', type: 'knob', status: 176, noteOrCC: 36, isCC: true },
  { controlId: 'deck_eq_kill_high_r', name: 'Kill High R', category: 'deck_r', type: 'button', status: 144, noteOrCC: 37, isCC: false },
  { controlId: 'deck_eq_kill_mid_r', name: 'Kill Mid R', category: 'deck_r', type: 'button', status: 144, noteOrCC: 38, isCC: false },
  { controlId: 'deck_eq_kill_low_r', name: 'Kill Low R', category: 'deck_r', type: 'button', status: 144, noteOrCC: 39, isCC: false },
  { controlId: 'deck_filter_r', name: 'Color Filter Deck R', category: 'deck_r', type: 'knob', status: 176, noteOrCC: 40, isCC: true },
  { controlId: 'deck_cue_pfl_r', name: 'PFL Headphone Cue R', category: 'deck_r', type: 'button', status: 144, noteOrCC: 41, isCC: false },
  { controlId: 'deck_pitch_r', name: 'Pitch / Tempo Deck R', category: 'deck_r', type: 'fader', status: 176, noteOrCC: 42, isCC: true },
  { controlId: 'deck_sync_r', name: 'Sync BPM Deck R', category: 'deck_r', type: 'button', status: 144, noteOrCC: 43, isCC: false },
  { controlId: 'deck_loop_r', name: 'Loop Toggle Deck R', category: 'deck_r', type: 'button', status: 144, noteOrCC: 44, isCC: false },
  { controlId: 'deck_jog_r', name: 'Jog Vinyl Scratch R', category: 'deck_r', type: 'jog', status: 176, noteOrCC: 45, isCC: true },
  { controlId: 'deck_hotcue_1_r', name: 'Hot Cue 1 Deck R', category: 'deck_r', type: 'button', status: 144, noteOrCC: 46, isCC: false },
  { controlId: 'deck_hotcue_2_r', name: 'Hot Cue 2 Deck R', category: 'deck_r', type: 'button', status: 144, noteOrCC: 47, isCC: false },
  { controlId: 'deck_hotcue_3_r', name: 'Hot Cue 3 Deck R', category: 'deck_r', type: 'button', status: 144, noteOrCC: 48, isCC: false },
  { controlId: 'deck_hotcue_4_r', name: 'Hot Cue 4 Deck R', category: 'deck_r', type: 'button', status: 144, noteOrCC: 49, isCC: false },

  // --- FX RACK ---
  { controlId: 'fx_active', name: 'Master FX ON/OFF', category: 'fx', type: 'button', status: 144, noteOrCC: 50, isCC: false },
  { controlId: 'fx_wet', name: 'FX Wet/Dry Mix', category: 'fx', type: 'knob', status: 176, noteOrCC: 51, isCC: true },
  { controlId: 'fx_param', name: 'FX Param Knob', category: 'fx', type: 'knob', status: 176, noteOrCC: 52, isCC: true },
  { controlId: 'fx_type', name: 'FX Tip Schimbare', category: 'fx', type: 'button', status: 144, noteOrCC: 53, isCC: false },

  // --- SAMPLES L (Exact notes from initial spec) ---
  { controlId: 'sample_l_1', name: 'Sample L 1 [Q]', category: 'samples', type: 'button', status: 150, noteOrCC: 48, isCC: false },
  { controlId: 'sample_l_2', name: 'Sample L 2 [W]', category: 'samples', type: 'button', status: 150, noteOrCC: 52, isCC: false },
  { controlId: 'sample_l_3', name: 'Sample L 3 [E]', category: 'samples', type: 'button', status: 150, noteOrCC: 49, isCC: false },
  { controlId: 'sample_l_4', name: 'Sample L 4 [R]', category: 'samples', type: 'button', status: 150, noteOrCC: 53, isCC: false },
  { controlId: 'sample_l_5', name: 'Sample L 5 [T]', category: 'samples', type: 'button', status: 150, noteOrCC: 50, isCC: false },
  { controlId: 'sample_l_6', name: 'Sample L 6 [Y]', category: 'samples', type: 'button', status: 150, noteOrCC: 54, isCC: false },
  { controlId: 'sample_l_7', name: 'Sample L 7 [U]', category: 'samples', type: 'button', status: 150, noteOrCC: 51, isCC: false },
  { controlId: 'sample_l_8', name: 'Sample L 8 [I]', category: 'samples', type: 'button', status: 150, noteOrCC: 55, isCC: false },

  // --- SAMPLES R (Exact notes from initial spec) ---
  { controlId: 'sample_r_1', name: 'Sample R 1 [A]', category: 'samples', type: 'button', status: 151, noteOrCC: 48, isCC: false },
  { controlId: 'sample_r_2', name: 'Sample R 2 [S]', category: 'samples', type: 'button', status: 151, noteOrCC: 52, isCC: false },
  { controlId: 'sample_r_3', name: 'Sample R 3 [D]', category: 'samples', type: 'button', status: 151, noteOrCC: 49, isCC: false },
  { controlId: 'sample_r_4', name: 'Sample R 4 [F]', category: 'samples', type: 'button', status: 151, noteOrCC: 53, isCC: false },
  { controlId: 'sample_r_5', name: 'Sample R 5 [G]', category: 'samples', type: 'button', status: 151, noteOrCC: 50, isCC: false },
  { controlId: 'sample_r_6', name: 'Sample R 6 [H]', category: 'samples', type: 'button', status: 151, noteOrCC: 54, isCC: false },
  { controlId: 'sample_r_7', name: 'Sample R 7 [J]', category: 'samples', type: 'button', status: 151, noteOrCC: 51, isCC: false },
  { controlId: 'sample_r_8', name: 'Sample R 8 [K]', category: 'samples', type: 'button', status: 151, noteOrCC: 55, isCC: false },

  // --- JINGLES (Exact notes 36-51 from initial spec) ---
  { controlId: 'jingle_1', name: 'Jingle 1 [F]', category: 'jingles', type: 'button', status: 153, noteOrCC: 36, isCC: false },
  { controlId: 'jingle_2', name: 'Jingle 2 [G]', category: 'jingles', type: 'button', status: 153, noteOrCC: 37, isCC: false },
  { controlId: 'jingle_3', name: 'Jingle 3 [H]', category: 'jingles', type: 'button', status: 153, noteOrCC: 38, isCC: false },
  { controlId: 'jingle_4', name: 'Jingle 4 [J]', category: 'jingles', type: 'button', status: 153, noteOrCC: 39, isCC: false },
  { controlId: 'jingle_5', name: 'Jingle 5 [5]', category: 'jingles', type: 'button', status: 153, noteOrCC: 40, isCC: false },
  { controlId: 'jingle_6', name: 'Jingle 6 [B]', category: 'jingles', type: 'button', status: 153, noteOrCC: 41, isCC: false },
  { controlId: 'jingle_7', name: 'Jingle 7 [N]', category: 'jingles', type: 'button', status: 153, noteOrCC: 42, isCC: false },
  { controlId: 'jingle_8', name: 'Jingle 8 [M]', category: 'jingles', type: 'button', status: 153, noteOrCC: 43, isCC: false },
  { controlId: 'jingle_9', name: 'Jingle 9 [1]', category: 'jingles', type: 'button', status: 153, noteOrCC: 44, isCC: false },
  { controlId: 'jingle_10', name: 'Jingle 10 [2]', category: 'jingles', type: 'button', status: 153, noteOrCC: 45, isCC: false },
  { controlId: 'jingle_11', name: 'Jingle 11 [3]', category: 'jingles', type: 'button', status: 153, noteOrCC: 46, isCC: false },
  { controlId: 'jingle_12', name: 'Jingle 12 [4]', category: 'jingles', type: 'button', status: 153, noteOrCC: 47, isCC: false },
  { controlId: 'jingle_13', name: 'Jingle 13 [6]', category: 'jingles', type: 'button', status: 153, noteOrCC: 48, isCC: false },
  { controlId: 'jingle_14', name: 'Jingle 14 [7]', category: 'jingles', type: 'button', status: 153, noteOrCC: 49, isCC: false },
  { controlId: 'jingle_15', name: 'Jingle 15 [8]', category: 'jingles', type: 'button', status: 153, noteOrCC: 50, isCC: false },
  { controlId: 'jingle_16', name: 'Jingle 16 [9]', category: 'jingles', type: 'button', status: 153, noteOrCC: 51, isCC: false },
];

export class MidiMappingService {
  private mappings: Map<string, MidiMappingEntry> = new Map();

  constructor() {
    this.load();
  }

  public load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MidiMappingEntry[];
        this.mappings.clear();
        parsed.forEach(entry => this.mappings.set(entry.controlId, entry));
        return;
      }
    } catch (e) {
      console.warn('Failed to load MIDI mappings from localStorage:', e);
    }
    this.resetToDefaults();
  }

  public save(): void {
    try {
      const arr = Array.from(this.mappings.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      console.error('Failed to save MIDI mappings:', e);
    }
  }

  public loadPreset(presetName: 'hercules' | 'original' | 'pioneer'): void {
    this.mappings.clear();
    if (presetName === 'hercules') {
      // Official Hercules DJControl Preset (Inpulse / Universal DJ)
      DEFAULT_MIDI_MAPPINGS.forEach(entry => {
        const copy = { ...entry };
        if (copy.controlId === 'fader_volume_l') { copy.status = 176; copy.noteOrCC = 0; copy.isCC = true; }
        if (copy.controlId === 'fader_volume_r') { copy.status = 177; copy.noteOrCC = 0; copy.isCC = true; }
        if (copy.controlId === 'fader_master') { copy.status = 176; copy.noteOrCC = 7; copy.isCC = true; }
        if (copy.controlId === 'fader_crossfader') { copy.status = 176; copy.noteOrCC = 8; copy.isCC = true; }
        if (copy.controlId === 'deck_gain_l') { copy.status = 176; copy.noteOrCC = 16; copy.isCC = true; }
        if (copy.controlId === 'deck_gain_r') { copy.status = 177; copy.noteOrCC = 16; copy.isCC = true; }
        if (copy.controlId === 'deck_eq_high_l') { copy.status = 176; copy.noteOrCC = 17; copy.isCC = true; }
        if (copy.controlId === 'deck_eq_high_r') { copy.status = 177; copy.noteOrCC = 17; copy.isCC = true; }
        if (copy.controlId === 'deck_eq_mid_l') { copy.status = 176; copy.noteOrCC = 18; copy.isCC = true; }
        if (copy.controlId === 'deck_eq_mid_r') { copy.status = 177; copy.noteOrCC = 18; copy.isCC = true; }
        if (copy.controlId === 'deck_eq_low_l') { copy.status = 176; copy.noteOrCC = 19; copy.isCC = true; }
        if (copy.controlId === 'deck_eq_low_r') { copy.status = 177; copy.noteOrCC = 19; copy.isCC = true; }
        if (copy.controlId === 'deck_filter_l') { copy.status = 176; copy.noteOrCC = 23; copy.isCC = true; }
        if (copy.controlId === 'deck_filter_r') { copy.status = 177; copy.noteOrCC = 23; copy.isCC = true; }
        if (copy.controlId === 'deck_pitch_l') { copy.status = 176; copy.noteOrCC = 9; copy.isCC = true; }
        if (copy.controlId === 'deck_pitch_r') { copy.status = 177; copy.noteOrCC = 9; copy.isCC = true; }
        if (copy.controlId === 'deck_jog_l') { copy.status = 176; copy.noteOrCC = 33; copy.isCC = true; }
        if (copy.controlId === 'deck_jog_r') { copy.status = 177; copy.noteOrCC = 33; copy.isCC = true; }
        this.mappings.set(copy.controlId, copy);
      });
    } else {
      DEFAULT_MIDI_MAPPINGS.forEach(entry => {
        this.mappings.set(entry.controlId, { ...entry });
      });
    }
    this.save();
  }

  public resetToDefaults(): void {
    this.mappings.clear();
    DEFAULT_MIDI_MAPPINGS.forEach(entry => {
      this.mappings.set(entry.controlId, { ...entry });
    });
    this.save();
  }

  public getAll(): MidiMappingEntry[] {
    return Array.from(this.mappings.values());
  }

  public get(controlId: string): MidiMappingEntry | undefined {
    return this.mappings.get(controlId);
  }

  public setMapping(entry: MidiMappingEntry): void {
    this.mappings.set(entry.controlId, entry);
    this.save();
  }

  public updateMapping(controlId: string, status: number, noteOrCC: number, isCC: boolean): void {
    const existing = this.mappings.get(controlId);
    if (existing) {
      existing.status = status;
      existing.noteOrCC = noteOrCC;
      existing.isCC = isCC;
      this.save();
    }
  }

  public findControlByMidi(status: number, noteOrCC: number): MidiMappingEntry | undefined {
    const isCC = status >= 176 && status <= 191;
    for (const entry of this.mappings.values()) {
      if (entry.status === status && entry.noteOrCC === noteOrCC) {
        return entry;
      }
    }
    // Also check generic channel match for Note On (144..159) or CC (176..191)
    for (const entry of this.mappings.values()) {
      const entryIsCC = entry.status >= 176 && entry.status <= 191;
      if (isCC === entryIsCC && entry.noteOrCC === noteOrCC) {
        return entry;
      }
    }
    return undefined;
  }
}

export const midiMappingService = new MidiMappingService();
