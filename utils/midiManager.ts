/**
 * Web MIDI API Manager for Turbo Soundboard & DJ Mixing Software
 */

export type MidiStatusType = 'unsupported' | 'disconnected' | 'connected' | 'error';

export interface MidiEventData {
  status: number;
  note: number;
  velocity: number;
  timestamp: number;
  channel: number;
}

export type MidiCallback = (event: MidiEventData) => void;

class MidiManager {
  private midiAccess: WebMidi.MIDIAccess | null = null;
  private status: MidiStatusType = 'disconnected';
  private listeners: Set<MidiCallback> = new Set();
  private connectedDeviceNames: string[] = [];

  public getStatus(): MidiStatusType {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      return 'unsupported';
    }
    return this.status;
  }

  public getDeviceNames(): string[] {
    return this.connectedDeviceNames;
  }

  public async connect(): Promise<MidiStatusType> {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      this.status = 'unsupported';
      return 'unsupported';
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.status = 'connected';
      this.updateInputs();

      this.midiAccess.onstatechange = () => {
        this.updateInputs();
      };

      return 'connected';
    } catch (err) {
      console.warn('MIDI connection error:', err);
      this.status = 'error';
      return 'error';
    }
  }

  public disconnect() {
    if (this.midiAccess) {
      for (const input of this.midiAccess.inputs.values()) {
        input.onmidimessage = null;
      }
      this.midiAccess = null;
    }
    this.status = 'disconnected';
    this.connectedDeviceNames = [];
  }

  private updateInputs() {
    if (!this.midiAccess) return;
    this.connectedDeviceNames = [];

    for (const input of this.midiAccess.inputs.values()) {
      if (input.state === 'connected') {
        this.connectedDeviceNames.push(input.name || 'Generic MIDI Device');
      }
      input.onmidimessage = (event: WebMidi.MIDIMessageEvent) => {
        this.handleMIDIMessage(event);
      };
    }
  }

  private handleMIDIMessage(event: WebMidi.MIDIMessageEvent) {
    if (!event.data || event.data.length < 2) return;

    const [statusByte, noteByte, velByte = 0] = event.data;
    // Separate MIDI channel (statusByte & 0x0F) and command (statusByte & 0xF0)
    const channel = (statusByte & 0x0f) + 1;

    const midiEvent: MidiEventData = {
      status: statusByte,
      note: noteByte,
      velocity: velByte,
      timestamp: Date.now(),
      channel,
    };

    this.listeners.forEach(cb => {
      try {
        cb(midiEvent);
      } catch (e) {
        console.error('Error in MIDI listener:', e);
      }
    });
  }

  public subscribe(cb: MidiCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public sendMidiMessage(status: number, note: number, velocity: number) {
    if (!this.midiAccess) return;
    for (const output of this.midiAccess.outputs.values()) {
      try {
        output.send([status, note, velocity]);
      } catch (err) {
        // ignore
      }
    }
  }

  public sendDeckPflFeedback(deckId: 'L' | 'R', isActive: boolean) {
    // Hercules Inpulse / Universal DJ headphone PFL LEDs:
    // Deck L: Ch 1 Note 5 (0x90 0x05) or Note 24
    // Deck R: Ch 2 Note 5 (0x91 0x05) or Note 41
    const velocity = isActive ? 127 : 0;
    if (deckId === 'L') {
      this.sendMidiMessage(144, 5, velocity);
      this.sendMidiMessage(144, 24, velocity);
    } else {
      this.sendMidiMessage(145, 5, velocity);
      this.sendMidiMessage(145, 24, velocity);
    }
  }
}

export const midiManager = new MidiManager();
