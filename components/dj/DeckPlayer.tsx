import React, { useRef } from 'react';
import { DeckState } from '../../types/dj';
import { WaveformDisplay } from './WaveformDisplay';
import { JogWheel } from './JogWheel';
import { VuMeter } from './VuMeter';
import { MidiEditBadge } from './MidiEditBadge';
import { Play, Pause, Disc, Upload, Repeat, Zap, Music2 } from 'lucide-react';

interface DeckPlayerProps {
  deck: DeckState;
  otherDeckBpm: number;
  deckPeak: number;
  isMidiEditMode: boolean;
  selectedMidiControl: string | null;
  onSelectMidiControl: (id: string) => void;
  onPlayToggle: () => void;
  onCue: () => void;
  onScrub: (seconds: number) => void;
  onPitchChange: (pitch: number) => void;
  onPitchBend: (amount: number) => void;
  onSync: () => void;
  onKeyLockToggle: () => void;
  onSetHotCue: (index: number) => void;
  onJumpHotCue: (index: number) => void;
  onSetLoop: (lengthBeats: number) => void;
  onToggleLoop: () => void;
  onLoadTrackFile: (file: File) => void;
  onOpenAudioSources: () => void;
}

export const DeckPlayer: React.FC<DeckPlayerProps> = ({
  deck,
  otherDeckBpm,
  deckPeak,
  isMidiEditMode,
  selectedMidiControl,
  onSelectMidiControl,
  onPlayToggle,
  onCue,
  onScrub,
  onPitchChange,
  onPitchBend,
  onSync,
  onKeyLockToggle,
  onSetHotCue,
  onJumpHotCue,
  onSetLoop,
  onToggleLoop,
  onLoadTrackFile,
  onOpenAudioSources,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDeckL = deck.id === 'L';
  const prefix = isDeckL ? 'l' : 'r';
  const themeBorder = isDeckL ? 'border-cyan-500/40 shadow-cyan-950/20' : 'border-orange-500/40 shadow-orange-950/20';
  const themeText = isDeckL ? 'text-cyan-400' : 'text-orange-400';
  const playKey = isDeckL ? 'Z' : 'X';
  const cueKey = isDeckL ? 'C' : 'V';
  const midiPlayNote = isDeckL ? 'S:145 N:7' : 'S:146 N:7';
  const midiCueNote = isDeckL ? 'S:145 N:6' : 'S:146 N:6';

  const effectiveBpm = deck.bpm * (1 + deck.pitchPercent / 100);

  // Effective volume peak: calculated directly from signal peak multiplied by channel fader volume!
  const effectivePeak = (deckPeak || 0) * Math.min(1.2, deck.volume);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadTrackFile(file);
    }
  };

  return (
    <div
      className={`flex-1 min-w-[340px] max-w-full bg-zinc-900/95 border-2 ${themeBorder} rounded-xl p-3.5 flex flex-col gap-3 shadow-2xl relative overflow-hidden backdrop-blur select-none`}
    >
      {/* Top Deck Header: Deck ID, Track Title, BPM, Mini VU Meter & Audio Sources */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center font-black text-xs font-mono text-black shrink-0 ${
              isDeckL ? 'bg-cyan-400 shadow-[0_0_10px_#00f2ff]' : 'bg-orange-400 shadow-[0_0_10px_#ff7700]'
            }`}
          >
            {deck.id}
          </div>
          <div className="min-w-0 truncate">
            <h3 className="text-sm font-bold text-gray-100 truncate flex items-center gap-1.5">
              {deck.trackName}
            </h3>
            <span className="text-[11px] text-gray-400 truncate block">
              {deck.artist}
            </span>
          </div>
        </div>

        {/* Mini VU Meter & Audio Sources Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mini VU Meter modulated by channel volume */}
          <div className="flex flex-col items-end gap-0.5 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-mono text-zinc-500 uppercase">VOL VU</span>
              <VuMeter level={effectivePeak} height={20} segments={8} orientation="horizontal" />
            </div>
            <div className={`text-[10px] font-mono font-bold ${themeText}`}>
              {effectiveBpm.toFixed(1)} <span className="text-[8px] text-gray-500">BPM</span>
            </div>
          </div>

          {/* Audio Sources selector button */}
          <button
            onClick={onOpenAudioSources}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 hover:text-white rounded border border-zinc-700 text-xs flex items-center gap-1 transition-colors"
            title="Surse Audio de Playare (Colecție DJ, Stream URL, Microfon, Fișiere)"
          >
            <Music2 size={14} />
            <span className="hidden sm:inline text-[11px] font-mono">Surse Audio</span>
          </button>

          {/* Quick File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white rounded border border-zinc-700 text-xs flex items-center gap-1 transition-colors"
            title="Încarcă fișier audio local"
          >
            <Upload size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Dynamic Waveform Display */}
      <WaveformDisplay
        deckId={deck.id}
        audioBuffer={deck.audioBuffer}
        currentTime={deck.currentTime}
        duration={deck.duration || 60}
        isPlaying={deck.isPlaying}
        bpm={effectiveBpm}
        onScrub={onScrub}
      />

      {/* Center Platter & Pitch Fader Section */}
      <div className="flex items-center justify-between gap-3 my-1">
        {/* Hot Cues & Loop buttons on left */}
        <div className="flex flex-col gap-2 shrink-0">
          {/* SYNC button */}
          <MidiEditBadge
            controlId={`deck_sync_${prefix}`}
            isEditMode={isMidiEditMode}
            isSelected={selectedMidiControl === `deck_sync_${prefix}`}
            onClick={() => onSelectMidiControl(`deck_sync_${prefix}`)}
          >
            <button
              onClick={onSync}
              className={`w-full px-3 py-1.5 rounded text-xs font-bold font-mono uppercase tracking-wider transition-all border ${
                deck.sync
                  ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.6)]'
                  : 'bg-zinc-800 text-gray-300 border-zinc-700 hover:bg-zinc-750 hover:text-white'
              }`}
              title={`Sync to ${otherDeckBpm.toFixed(1)} BPM`}
            >
              <span className="flex items-center gap-1 justify-center">
                <Zap size={12} className={deck.sync ? 'text-yellow-300' : ''} />
                SYNC
              </span>
            </button>
          </MidiEditBadge>

          {/* Key Lock toggle */}
          <button
            onClick={onKeyLockToggle}
            className={`px-3 py-1 rounded text-[10px] font-mono uppercase border transition-colors ${
              deck.keyLock
                ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                : 'bg-zinc-800/80 text-gray-400 border-zinc-700/60 hover:text-gray-200'
            }`}
          >
            MASTER TEMPO
          </button>

          {/* Quick Loops (1, 2, 4, 8 beats) */}
          <MidiEditBadge
            controlId={`deck_loop_${prefix}`}
            isEditMode={isMidiEditMode}
            isSelected={selectedMidiControl === `deck_loop_${prefix}`}
            onClick={() => onSelectMidiControl(`deck_loop_${prefix}`)}
          >
            <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 px-0.5">
                <span className="flex items-center gap-1">
                  <Repeat size={10} /> LOOP
                </span>
                <button
                  onClick={onToggleLoop}
                  className={`text-[8px] font-bold px-1 rounded ${
                    deck.isLooping ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-gray-400'
                  }`}
                >
                  {deck.isLooping ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {[1, 2, 4, 8].map(beats => (
                  <button
                    key={beats}
                    onClick={() => onSetLoop(beats)}
                    className={`py-1 text-[10px] font-mono font-bold rounded transition-colors ${
                      deck.isLooping && deck.loopLength === beats
                        ? 'bg-emerald-500 text-black shadow-[0_0_6px_#10b981]'
                        : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                    }`}
                  >
                    {beats}B
                  </button>
                ))}
              </div>
            </div>
          </MidiEditBadge>

          {/* Hot Cues 1 - 4 */}
          <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 flex flex-col gap-1">
            <span className="text-[9px] font-mono text-gray-400 px-0.5">HOT CUES</span>
            <div className="grid grid-cols-2 gap-1">
              {[0, 1, 2, 3].map(idx => {
                const cueTime = deck.hotCues[idx];
                const isSet = cueTime !== null && cueTime !== undefined;
                const cueCtrlId = `deck_hotcue_${idx + 1}_${prefix}`;

                return (
                  <MidiEditBadge
                    key={idx}
                    controlId={cueCtrlId}
                    isEditMode={isMidiEditMode}
                    isSelected={selectedMidiControl === cueCtrlId}
                    onClick={() => onSelectMidiControl(cueCtrlId)}
                  >
                    <button
                      onClick={() => (isSet ? onJumpHotCue(idx) : onSetHotCue(idx))}
                      onContextMenu={e => {
                        e.preventDefault();
                        onSetHotCue(idx);
                      }}
                      className={`w-full py-1 text-[10px] font-mono font-bold rounded transition-all ${
                        isSet
                          ? 'bg-amber-500 text-black shadow-[0_0_6px_#f59e0b]'
                          : 'bg-zinc-800/80 text-gray-400 hover:bg-zinc-700 hover:text-gray-200'
                      }`}
                      title={isSet ? `Cue ${idx + 1}: ${cueTime.toFixed(1)}s (Right click to reset)` : `Set Cue ${idx + 1}`}
                    >
                      #{idx + 1}
                    </button>
                  </MidiEditBadge>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Platter Jog Wheel */}
        <MidiEditBadge
          controlId={`deck_jog_${prefix}`}
          isEditMode={isMidiEditMode}
          isSelected={selectedMidiControl === `deck_jog_${prefix}`}
          onClick={() => onSelectMidiControl(`deck_jog_${prefix}`)}
          className="flex-1 flex justify-center"
        >
          <JogWheel
            deckId={deck.id}
            isPlaying={deck.isPlaying}
            bpm={deck.bpm}
            pitchPercent={deck.pitchPercent}
            onScratch={delta => onScrub(deck.currentTime + delta)}
          />
        </MidiEditBadge>

        {/* Pitch / Tempo Slider on right */}
        <MidiEditBadge
          controlId={`deck_pitch_${prefix}`}
          isEditMode={isMidiEditMode}
          isSelected={selectedMidiControl === `deck_pitch_${prefix}`}
          onClick={() => onSelectMidiControl(`deck_pitch_${prefix}`)}
        >
          <div className="flex flex-col items-center gap-1.5 bg-zinc-950 p-2 rounded-lg border border-zinc-800 shrink-0">
            <span className="text-[9px] font-mono text-gray-400 font-bold uppercase">TEMPO</span>

            <button
              onMouseDown={() => onPitchBend(0.04)}
              onMouseUp={() => onPitchBend(0)}
              className="w-7 h-5 bg-zinc-800 hover:bg-zinc-700 text-gray-200 text-xs font-bold rounded flex items-center justify-center border border-zinc-700"
              title="Pitch Bend +"
            >
              +
            </button>

            <div className="relative h-32 flex items-center justify-center my-1">
              <input
                type="range"
                min="-16"
                max="16"
                step="0.1"
                value={deck.pitchPercent}
                onChange={e => onPitchChange(parseFloat(e.target.value))}
                className="h-32 -rotate-90 origin-center cursor-pointer appearance-none bg-zinc-800 rounded w-28 accent-cyan-400"
                style={{ width: '128px' }}
              />
              <div className="absolute w-3 h-0.5 bg-gray-500 pointer-events-none" />
            </div>

            <button
              onClick={() => onPitchChange(0)}
              className="text-[9px] font-mono text-gray-400 hover:text-white px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800"
              title="Reset Tempo to 0.0%"
            >
              RESET
            </button>

            <button
              onMouseDown={() => onPitchBend(-0.04)}
              onMouseUp={() => onPitchBend(0)}
              className="w-7 h-5 bg-zinc-800 hover:bg-zinc-700 text-gray-200 text-xs font-bold rounded flex items-center justify-center border border-zinc-700"
              title="Pitch Bend -"
            >
              -
            </button>
          </div>
        </MidiEditBadge>
      </div>

      {/* Big Illuminated DJ Transport Buttons: CUE and PLAY/PAUSE */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
        {/* CUE Button */}
        <MidiEditBadge
          controlId={`transport_cue_${prefix}`}
          isEditMode={isMidiEditMode}
          isSelected={selectedMidiControl === `transport_cue_${prefix}`}
          onClick={() => onSelectMidiControl(`transport_cue_${prefix}`)}
        >
          <button
            onClick={onCue}
            className="w-full py-3.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:scale-[0.98] border-2 border-amber-600/70 shadow-lg text-white font-extrabold flex flex-col items-center justify-center gap-0.5 group transition-all"
          >
            <div className="flex items-center gap-2">
              <Disc size={18} className="text-amber-400 group-hover:rotate-45 transition-transform" />
              <span className="text-lg tracking-wider text-amber-300">CUE</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-amber-400/80">
              <span className="bg-zinc-900/90 px-1.5 py-0.2 rounded border border-amber-500/40">
                KEY: {cueKey}
              </span>
              <span className="text-zinc-500">{midiCueNote}</span>
            </div>
          </button>
        </MidiEditBadge>

        {/* PLAY / PAUSE Button */}
        <MidiEditBadge
          controlId={`transport_play_${prefix}`}
          isEditMode={isMidiEditMode}
          isSelected={selectedMidiControl === `transport_play_${prefix}`}
          onClick={() => onSelectMidiControl(`transport_play_${prefix}`)}
        >
          <button
            onClick={onPlayToggle}
            className={`w-full py-3.5 px-4 rounded-xl active:scale-[0.98] border-2 shadow-xl font-extrabold flex flex-col items-center justify-center gap-0.5 transition-all ${
              deck.isPlaying
                ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.7)] animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-750 border-emerald-600/60 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {deck.isPlaying ? <Pause size={18} /> : <Play size={18} className="text-emerald-400" />}
              <span className="text-lg tracking-wider">
                {deck.isPlaying ? 'PAUSE' : 'PLAY'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="bg-zinc-900/90 px-1.5 py-0.2 rounded border border-emerald-500/40 text-emerald-300">
                KEY: {playKey}
              </span>
              <span className="text-zinc-400">{midiPlayNote}</span>
            </div>
          </button>
        </MidiEditBadge>
      </div>
    </div>
  );
};
