/**
 * Procedural Audio Synthesizer for Turbo Soundboard & DJ Mixer
 * Generates crisp, studio-quality sound samples and DJ club loops
 * using Web Audio API offline synthesis.
 */

export function createSynthesizedBuffer(
  ctx: AudioContext,
  type: string,
  bpm: number = 128
): AudioBuffer {
  const sampleRate = ctx.sampleRate;

  switch (type) {
    // --- SAMPLER SOUNDS ---
    case 'kick': {
      // 808 Punchy Kick
      const duration = 0.45;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const freq = 145 * Math.exp(-t * 24) + 48;
        const phase = 2 * Math.PI * freq * t;
        const click = Math.exp(-t * 250) * 0.4 * (Math.random() * 2 - 1);
        const body = Math.sin(phase) * Math.exp(-t * 7.5);
        data[i] = (body + click) * 0.95;
      }
      return buffer;
    }

    case 'snare': {
      // Snappy Studio Snare
      const duration = 0.35;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const toneFreq = 185 * Math.exp(-t * 20);
        const tone = Math.sin(2 * Math.PI * toneFreq * t) * Math.exp(-t * 18) * 0.5;
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 12) * 0.65;
        data[i] = (tone + noise) * 0.9;
      }
      return buffer;
    }

    case 'hihat_closed': {
      // Crisp 909 Closed Hat
      const duration = 0.09;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const metallic = (Math.sin(t * 7000 * 2 * Math.PI) + Math.sin(t * 11200 * 2 * Math.PI)) * 0.3;
        const noise = (Math.random() * 2 - 1) * 0.7;
        data[i] = (metallic + noise) * Math.exp(-t * 55) * 0.7;
      }
      return buffer;
    }

    case 'hihat_open': {
      // Sizzling Open Hi-Hat
      const duration = 0.4;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const noise = (Math.random() * 2 - 1) * 0.8;
        const ring = Math.sin(t * 9800 * 2 * Math.PI) * 0.2;
        data[i] = (noise + ring) * Math.exp(-t * 9) * 0.75;
      }
      return buffer;
    }

    case 'clap': {
      // Wide Club Clap with multi-hit transients
      const duration = 0.45;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const noise = Math.random() * 2 - 1;
        let env = 0;
        if (t < 0.012) env += Math.exp(-t * 120) * 0.4;
        if (t >= 0.012 && t < 0.024) env += Math.exp(-(t - 0.012) * 120) * 0.6;
        if (t >= 0.024 && t < 0.038) env += Math.exp(-(t - 0.024) * 120) * 0.8;
        if (t >= 0.038) env += Math.exp(-(t - 0.038) * 15) * 0.9;
        data[i] = noise * env * 0.85;
      }
      return buffer;
    }

    case 'rimshot': {
      const duration = 0.15;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const ring = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 40);
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.5;
        data[i] = (ring + noise) * 0.8;
      }
      return buffer;
    }

    case 'tom': {
      const duration = 0.35;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const freq = 120 * Math.exp(-t * 12) + 60;
        data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 9) * 0.85;
      }
      return buffer;
    }

    case 'shaker': {
      const duration = 0.2;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const env = Math.sin(Math.min(t / duration, 1) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * env * 0.6;
      }
      return buffer;
    }

    case 'sub_bass': {
      // Heavy 808 Sub Boom
      const duration = 0.85;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const freq = 65 * Math.exp(-t * 3.5) + 38;
        const sine = Math.sin(2 * Math.PI * freq * t);
        // Soft tube saturation
        const saturated = Math.tanh(sine * 1.5);
        data[i] = saturated * Math.exp(-t * 3.2) * 0.9;
      }
      return buffer;
    }

    case 'crash': {
      // 16" Crash Cymbal
      const duration = 1.4;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const metallic = (Math.sin(t * 4320 * 2 * Math.PI) + Math.sin(t * 6840 * 2 * Math.PI) + Math.sin(t * 8900 * 2 * Math.PI)) * 0.25;
        const noise = (Math.random() * 2 - 1) * 0.75;
        data[i] = (metallic + noise) * Math.exp(-t * 3.2) * 0.75;
      }
      return buffer;
    }

    case 'synth_stab': {
      // Rave / Club Synth Chord Stab (Minor 9th chord)
      const duration = 0.5;
      const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      const freqs = [220, 261.63, 329.63, 392, 493.88]; // Am9 chord
      for (let i = 0; i < left.length; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 6.5);
        let sumL = 0;
        let sumR = 0;
        freqs.forEach((f, idx) => {
          // Sawtooth approx
          const saw1 = ((t * f) % 1) * 2 - 1;
          const saw2 = ((t * (f * 1.008) + 0.2) % 1) * 2 - 1;
          sumL += (saw1 + saw2 * 0.5) / freqs.length;
          sumR += (saw2 + saw1 * 0.5) / freqs.length;
        });
        left[i] = Math.tanh(sumL * 1.6) * env * 0.8;
        right[i] = Math.tanh(sumR * 1.6) * env * 0.8;
      }
      return buffer;
    }

    case 'laser_zap': {
      // Sci-fi Laser Zap
      const duration = 0.35;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const freq = 2400 * Math.exp(-t * 18) + 80;
        data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 10) * 0.85;
      }
      return buffer;
    }

    case 'siren': {
      // DJ Dub Siren
      const duration = 1.2;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const lfo = Math.sin(2 * Math.PI * 4 * t);
        const freq = 650 + lfo * 250;
        const square = Math.sin(2 * Math.PI * freq * t) > 0 ? 0.7 : -0.7;
        data[i] = square * Math.exp(-t * 1.2) * 0.8;
      }
      return buffer;
    }

    case 'vox_chant': {
      // "HEY!" DJ Vocal Chant
      const duration = 0.4;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const f1 = Math.sin(2 * Math.PI * 700 * t);
        const f2 = Math.sin(2 * Math.PI * 1200 * t) * 0.7;
        const noise = (Math.random() * 2 - 1) * 0.3;
        const env = Math.sin(Math.min(t / duration, 1) * Math.PI) * Math.exp(-t * 4);
        data[i] = (f1 + f2 + noise) * env * 0.85;
      }
      return buffer;
    }

    case 'sweep_down': {
      // Drop Downsweeper FX
      const duration = 0.9;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const freq = 1200 * Math.pow(1 - t / duration, 2) + 40;
        const noise = (Math.random() * 2 - 1) * 0.4;
        const tone = Math.sin(2 * Math.PI * freq * t) * 0.6;
        data[i] = (tone + noise) * (1 - t / duration) * 0.85;
      }
      return buffer;
    }

    // --- BROADCASTER JINGLES (16 SLOTS) ---
    case 'airhorn': {
      // Jamaican Reggae / Club Airhorn Blast!
      const duration = 1.1;
      const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      // Dual horn pitches: F# and A (ragga chords)
      const bursts = [0, 0.22, 0.44];
      for (let i = 0; i < left.length; i++) {
        const t = i / sampleRate;
        let v = 0;
        bursts.forEach(b => {
          if (t >= b && t < b + 0.18) {
            const bt = t - b;
            const f1 = 466.16; // Bb4
            const f2 = 587.33; // D5
            const s1 = Math.sin(2 * Math.PI * f1 * bt);
            const s2 = Math.sin(2 * Math.PI * f2 * bt);
            const horn = Math.tanh((s1 + s2 * 0.8) * 2.5);
            v += horn * Math.exp(-bt * 5);
          }
        });
        left[i] = v * 0.8;
        right[i] = v * 0.8;
      }
      return buffer;
    }

    case 'drop_bass': {
      // "DROP THE BASS" 808 Mega Drop
      const duration = 2.2;
      const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      for (let i = 0; i < left.length; i++) {
        const t = i / sampleRate;
        const subFreq = 85 * Math.exp(-t * 1.8) + 32;
        const sub = Math.sin(2 * Math.PI * subFreq * t);
        const sat = Math.tanh(sub * 2.2);
        const rumble = sat * Math.exp(-t * 1.2);
        left[i] = rumble * 0.9;
        right[i] = rumble * 0.9;
      }
      return buffer;
    }

    case 'rewind_scratch': {
      // Turntable Vinyl Scratch & Tape Stop Rewind
      const duration = 1.3;
      const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      for (let i = 0; i < left.length; i++) {
        const t = i / sampleRate;
        const scrubRate = Math.sin(t * 12 * 2 * Math.PI) * Math.exp(-t * 2);
        const freq = 450 + scrubRate * 380;
        const noise = (Math.random() * 2 - 1) * 0.35;
        const tone = Math.sin(2 * Math.PI * freq * t) * 0.65;
        const out = Math.tanh((tone + noise) * 1.8) * Math.exp(-t * 2.4);
        left[i] = out * 0.85;
        right[i] = out * 0.85;
      }
      return buffer;
    }

    case 'radio_id': {
      // High-energy Station ID Chime & Impact
      const duration = 1.6;
      const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      for (let i = 0; i < left.length; i++) {
        const t = i / sampleRate;
        let sum = 0;
        notes.forEach((f, idx) => {
          const start = idx * 0.12;
          if (t >= start) {
            const dt = t - start;
            sum += Math.sin(2 * Math.PI * f * dt) * Math.exp(-dt * 4) * 0.35;
          }
        });
        const impact = t < 0.2 ? (Math.random() * 2 - 1) * Math.exp(-t * 15) * 0.5 : 0;
        const total = (sum + impact) * 0.9;
        left[i] = total;
        right[i] = total;
      }
      return buffer;
    }

    case 'laser_burst': {
      // Fast triple laser burst
      const duration = 0.8;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      const shots = [0, 0.15, 0.3];
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        let v = 0;
        shots.forEach(s => {
          if (t >= s && t < s + 0.18) {
            const dt = t - s;
            const f = 2800 * Math.exp(-dt * 26) + 120;
            v += Math.sin(2 * Math.PI * f * dt) * Math.exp(-dt * 14);
          }
        });
        data[i] = v * 0.85;
      }
      return buffer;
    }

    case 'crowd_cheer': {
      // Stadium Crowd Cheering & Applause
      const duration = 2.4;
      const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      for (let i = 0; i < left.length; i++) {
        const t = i / sampleRate;
        const noiseL = Math.random() * 2 - 1;
        const noiseR = Math.random() * 2 - 1;
        const swell = Math.sin(Math.min(t / 0.8, 1) * Math.PI * 0.5) * Math.exp(-Math.max(0, t - 1.2) * 1.5);
        left[i] = noiseL * swell * 0.65;
        right[i] = noiseR * swell * 0.65;
      }
      return buffer;
    }

    case 'cyber_hit': {
      // Cinematic Cyber Impact
      const duration = 1.4;
      const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      for (let i = 0; i < left.length; i++) {
        const t = i / sampleRate;
        const f = 110 * Math.exp(-t * 8) + 40;
        const boom = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 2.5);
        const metallic = (Math.random() * 2 - 1) * Math.exp(-t * 14) * 0.5;
        const sig = Math.tanh((boom + metallic) * 2.0);
        left[i] = sig * 0.85;
        right[i] = sig * 0.85;
      }
      return buffer;
    }

    case 'synth_riser': {
      // DJ Club Build Riser
      const duration = 2.2;
      const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      for (let i = 0; i < left.length; i++) {
        const t = i / sampleRate;
        const prog = t / duration;
        const f = 80 + Math.pow(prog, 2.5) * 1400;
        const saw = ((t * f) % 1) * 2 - 1;
        const noise = (Math.random() * 2 - 1) * prog * 0.4;
        const amp = prog * 0.8;
        left[i] = Math.tanh((saw + noise) * 1.5) * amp;
        right[i] = Math.tanh((saw + noise) * 1.5) * amp;
      }
      return buffer;
    }

    // Default general sound
    default: {
      const duration = 0.5;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const freq = 440 * Math.exp(-t * 4);
        data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 6) * 0.8;
      }
      return buffer;
    }
  }
}

/**
 * Procedural Full-Length DJ Club Grooves for Deck L and Deck R
 * Deck L: 128 BPM Energetic Festival Club Beat (House / Electro)
 * Deck R: 128 BPM Romanian Tech / Minimal Groove (Bassline + Percussion)
 */
export function createDjDeckLoopBuffer(
  ctx: AudioContext,
  deckId: 'L' | 'R',
  bpm: number = 128
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const secondsPerBeat = 60 / bpm;
  // 16 beats = 4 bars of seamless looping DJ groove
  const totalBeats = 16;
  const duration = secondsPerBeat * totalBeats;
  const numSamples = Math.floor(sampleRate * duration);

  const buffer = ctx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  if (deckId === 'L') {
    // --- DECK L: "FESTIVAL CLUB ANTHEM" (128 BPM) ---
    // 4-on-the-floor kick, off-beat hi-hat, claps on 2 & 4, energetic pumping bass & synth hook
    const kickBuf = createSynthesizedBuffer(ctx, 'kick');
    const hatBuf = createSynthesizedBuffer(ctx, 'hihat_open');
    const clapBuf = createSynthesizedBuffer(ctx, 'clap');
    const chordBuf = createSynthesizedBuffer(ctx, 'synth_stab');

    const kickData = kickBuf.getChannelData(0);
    const hatData = hatBuf.getChannelData(0);
    const clapData = clapBuf.getChannelData(0);
    const chordL = chordBuf.getChannelData(0);
    const chordR = chordBuf.getChannelData(1);

    for (let beat = 0; beat < totalBeats; beat++) {
      const beatSample = Math.floor(beat * secondsPerBeat * sampleRate);

      // Four-on-the-floor Kick (Every beat)
      for (let i = 0; i < kickData.length && beatSample + i < numSamples; i++) {
        left[beatSample + i] += kickData[i] * 0.95;
        right[beatSample + i] += kickData[i] * 0.95;
      }

      // Off-beat Open Hat (on beat + 0.5)
      const offSample = Math.floor((beat + 0.5) * secondsPerBeat * sampleRate);
      for (let i = 0; i < hatData.length && offSample + i < numSamples; i++) {
        left[offSample + i] += hatData[i] * 0.55;
        right[offSample + i] += hatData[i] * 0.55;
      }

      // Clap on 2 and 4 (beats 1, 3, 5, 7, 9, 11, 13, 15)
      if (beat % 2 === 1) {
        for (let i = 0; i < clapData.length && beatSample + i < numSamples; i++) {
          left[beatSample + i] += clapData[i] * 0.7;
          right[beatSample + i] += clapData[i] * 0.7;
        }
      }

      // Synth chord stab on syncopated beats (0, 3, 6, 10, 14)
      if ([0, 3, 6, 10, 14].includes(beat)) {
        for (let i = 0; i < chordL.length && beatSample + i < numSamples; i++) {
          left[beatSample + i] += chordL[i] * 0.6;
          right[beatSample + i] += chordR[i] * 0.6;
        }
      }
    }
  } else {
    // --- DECK R: "ROMANIAN PARTY & TECH GROOVE" (128 BPM) ---
    // Punchy syncopated percussion, rolling sub-bassline, shakers and rimshots
    const kickBuf = createSynthesizedBuffer(ctx, 'kick');
    const closedHatBuf = createSynthesizedBuffer(ctx, 'hihat_closed');
    const openHatBuf = createSynthesizedBuffer(ctx, 'hihat_open');
    const rimBuf = createSynthesizedBuffer(ctx, 'rimshot');
    const shakerBuf = createSynthesizedBuffer(ctx, 'shaker');
    const bassBuf = createSynthesizedBuffer(ctx, 'sub_bass');

    const kickData = kickBuf.getChannelData(0);
    const cHatData = closedHatBuf.getChannelData(0);
    const oHatData = openHatBuf.getChannelData(0);
    const rimData = rimBuf.getChannelData(0);
    const shakerData = shakerBuf.getChannelData(0);
    const bassData = bassBuf.getChannelData(0);

    for (let beat = 0; beat < totalBeats; beat++) {
      const beatSample = Math.floor(beat * secondsPerBeat * sampleRate);

      // Kick on 1, 2, 3, 4
      for (let i = 0; i < kickData.length && beatSample + i < numSamples; i++) {
        left[beatSample + i] += kickData[i] * 0.9;
        right[beatSample + i] += kickData[i] * 0.9;
      }

      // Rolling 16th-note hats & shakers
      for (let sub = 0; sub < 4; sub++) {
        const subSample = Math.floor((beat + sub * 0.25) * secondsPerBeat * sampleRate);
        if (sub === 2) {
          // Offbeat hat
          for (let i = 0; i < oHatData.length && subSample + i < numSamples; i++) {
            left[subSample + i] += oHatData[i] * 0.5;
            right[subSample + i] += oHatData[i] * 0.5;
          }
        } else {
          // Closed hat / shaker
          for (let i = 0; i < cHatData.length && subSample + i < numSamples; i++) {
            left[subSample + i] += cHatData[i] * 0.35;
            right[subSample + i] += cHatData[i] * 0.35;
          }
        }
      }

      // Rimshot percussion fills
      if ([1, 3, 4.75, 7, 9, 11, 12.75, 15].includes(beat)) {
        for (let i = 0; i < rimData.length && beatSample + i < numSamples; i++) {
          left[beatSample + i] += rimData[i] * 0.65;
          right[beatSample + i] += rimData[i] * 0.65;
        }
      }

      // Rolling bassline on the "and" of beat
      const bassSample = Math.floor((beat + 0.5) * secondsPerBeat * sampleRate);
      for (let i = 0; i < bassData.length && bassSample + i < numSamples; i++) {
        left[bassSample + i] += bassData[i] * 0.7;
        right[bassSample + i] += bassData[i] * 0.7;
      }
    }
  }

  // Soft master clip limiter to ensure clean punch without distortion
  for (let i = 0; i < numSamples; i++) {
    left[i] = Math.tanh(left[i] * 0.95);
    right[i] = Math.tanh(right[i] * 0.95);
  }

  return buffer;
}
