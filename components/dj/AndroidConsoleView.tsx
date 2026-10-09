import React, { useState } from 'react';
import { DeckState, MixerState } from '../../types/dj';
import {
  Play,
  Pause,
  Repeat,
  Zap,
  Headphones,
  Sliders,
  Disc,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Smartphone,
  Flame,
  Music2
} from 'lucide-react';
import { RotaryKnob } from './RotaryKnob';
import { JogWheel } from './JogWheel';
import { VuMeter } from './VuMeter';

interface AndroidConsoleViewProps {
  deckL: DeckState;
  deckR: DeckState;
  mixer: MixerState;
  peakL: number;
  peakR: number;
  connectedMidiDevice: string;
  onPlayToggleL: () => void;
  onPlayToggleR: () => void;
  onCueL: () => void;
  onCueR: () => void;
  onCueHoldStartL: () => void;
  onCueHoldEndL: () => void;
  onCueHoldStartR: () => void;
  onCueHoldEndR: () => void;
  onSetCuePointL: () => void;
  onSetCuePointR: () => void;
  onSyncL: () => void;
  onSyncR: () => void;
  onToggleLoopL: () => void;
  onToggleLoopR: () => void;
  onHotCueL: (idx: number) => void;
  onHotCueR: (idx: number) => void;
  onJogScratchL: (delta: number) => void;
  onJogScratchR: (delta: number) => void;
  onVolumeChangeL: (val: number) => void;
  onVolumeChangeR: (val: number) => void;
  onCrossfaderChange: (val: number) => void;
  onCueMonitorToggleL: () => void;
  onCueMonitorToggleR: () => void;
  onDeckEQChange: (deckId: 'L' | 'R', band: 'high' | 'mid' | 'low', val: number) => void;
  onDeckFilterChange: (deckId: 'L' | 'R', val: number) => void;
  onTriggerSample: (id: string) => void;
  onOpenExplorer: () => void;
}

export const AndroidConsoleView: React.FC<AndroidConsoleViewProps> = ({
  deckL,
  deckR,
  mixer,
  peakL,
  peakR,
  connectedMidiDevice,
  onPlayToggleL,
  onPlayToggleR,
  onCueL,
  onCueR,
  onCueHoldStartL,
  onCueHoldEndL,
  onCueHoldStartR,
  onCueHoldEndR,
  onSetCuePointL,
  onSetCuePointR,
  onSyncL,
  onSyncR,
  onToggleLoopL,
  onToggleLoopR,
  onHotCueL,
  onHotCueR,
  onJogScratchL,
  onJogScratchR,
  onVolumeChangeL,
  onVolumeChangeR,
  onCrossfaderChange,
  onCueMonitorToggleL,
  onCueMonitorToggleR,
  onDeckEQChange,
  onDeckFilterChange,
  onTriggerSample,
  onOpenExplorer,
}) => {
  const [activeTab, setActiveTab] = useState<'decks' | 'eq'>('decks');

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-3 sm:p-5 flex flex-col gap-4 shadow-2xl select-none">
      {/* Mobile / Android Header Status Bar */}
      <div className="flex flex-wrap items-center justify-between bg-zinc-900/90 px-4 py-2.5 rounded-xl border border-zinc-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-sm">
            <Smartphone size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black font-mono text-white tracking-wide">
                MOD CONSOLĂ ANDROID / MOBIL
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-bold">
                OTG READY
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono truncate max-w-xs sm:max-w-md">
              MIDI OTG: {connectedMidiDevice || 'Conectat prin browser / OTG USB'}
            </p>
          </div>
        </div>

        {/* View Switcher: DECKS vs EQ & EXPLORER Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'decks' ? 'eq' : 'decks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
              activeTab === 'eq'
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
            }`}
          >
            {activeTab === 'eq' ? '🎛️ EQ DESCHIS' : '🎛️ EGALIZATOR (EQ)'}
          </button>

          <button
            onClick={onOpenExplorer}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.4)] flex items-center gap-1.5"
          >
            <Music2 size={13} />
            <span>EXPLORER MUZICĂ</span>
          </button>
        </div>
      </div>

      {/* Main Dual Decks + Mixer Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* --- DECK 1 (LEFT / A) --- */}
        <div className="md:col-span-5 bg-zinc-900/80 border-2 border-cyan-500/40 rounded-xl p-3.5 flex flex-col gap-3 shadow-lg">
          {/* Deck Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <div className="truncate">
                <span className="text-xs font-black font-mono text-cyan-400 uppercase">DECK 1 (A)</span>
                <div className="text-[11px] font-mono font-bold text-white truncate max-w-[160px]">
                  {deckL.trackName}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-mono font-bold text-cyan-300">{deckL.bpm.toFixed(1)} BPM</div>
              <div className="text-[10px] font-mono text-zinc-400">
                {formatTime(deckL.currentTime)} / {formatTime(deckL.duration)}
              </div>
            </div>
          </div>

          {/* Jog Wheel Touch / Platter */}
          <div className="flex justify-center py-1">
            <JogWheel
              deckId="L"
              isPlaying={deckL.isPlaying}
              bpm={deckL.bpm}
              onScratch={onJogScratchL}
              size={135}
            />
          </div>

          {/* Big Tactile Transport Buttons: PLAY / CUE / SYNC */}
          <div className="grid grid-cols-3 gap-2">
            {/* CUE Button */}
            <button
              onClick={onCueL}
              onMouseDown={onCueHoldStartL}
              onMouseUp={onCueHoldEndL}
              onTouchStart={onCueHoldStartL}
              onTouchEnd={onCueHoldEndL}
              className={`h-14 rounded-xl flex flex-col items-center justify-center font-black font-mono transition-all border-2 active:scale-95 shadow-md ${
                deckL.currentTime === deckL.cuePoint && !deckL.isPlaying
                  ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_#f59e0b]'
                  : 'bg-zinc-800 text-amber-400 border-amber-500/50 hover:bg-zinc-750'
              }`}
            >
              <span className="text-base tracking-wider">CUE</span>
              <span className="text-[8px] font-sans opacity-80">HOLD PREV</span>
            </button>

            {/* PLAY / PAUSE Button */}
            <button
              onClick={onPlayToggleL}
              className={`h-14 rounded-xl flex flex-col items-center justify-center font-black font-mono transition-all border-2 active:scale-95 shadow-md ${
                deckL.isPlaying
                  ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_20px_#10b981] animate-pulse'
                  : 'bg-zinc-800 text-emerald-400 border-emerald-500/50 hover:bg-zinc-750'
              }`}
            >
              <div className="flex items-center gap-1">
                {deckL.isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span className="text-base tracking-wider">{deckL.isPlaying ? 'PAUZĂ' : 'PLAY'}</span>
              </div>
              <span className="text-[8px] font-sans opacity-80">DECK 1</span>
            </button>

            {/* SYNC Button */}
            <button
              onClick={onSyncL}
              className={`h-14 rounded-xl flex flex-col items-center justify-center font-black font-mono transition-all border-2 active:scale-95 ${
                deckL.sync
                  ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_#3b82f6]'
                  : 'bg-zinc-800 text-blue-400 border-blue-500/40 hover:bg-zinc-750'
              }`}
            >
              <div className="flex items-center gap-1">
                <Zap size={14} />
                <span className="text-sm">SYNC</span>
              </div>
              <span className="text-[8px] font-sans opacity-80">AUTO BPM</span>
            </button>
          </div>

          {/* Quick Loops & Hot Cues Row */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            <button
              onClick={onToggleLoopL}
              className={`py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 border ${
                deckL.isLooping
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-zinc-850 text-zinc-400 border-zinc-750'
              }`}
            >
              <Repeat size={11} /> LOOP
            </button>
            {[1, 2, 3, 4].map(idx => (
              <button
                key={idx}
                onClick={() => onHotCueL(idx - 1)}
                className="py-1.5 rounded-lg bg-zinc-850 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold active:scale-95 transition-all"
              >
                CUE {idx}
              </button>
            ))}
          </div>

          {/* Headphone CUE (Simbol Căști) Button */}
          <button
            onClick={onCueMonitorToggleL}
            className={`w-full py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 border transition-all ${
              deckL.cueMonitor
                ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_#f59e0b] animate-pulse font-black'
                : 'bg-zinc-850 text-zinc-400 border-zinc-750 hover:text-white'
            }`}
            title="Căști PFL Deck 1 (Simbol Căști)"
          >
            <Headphones size={15} />
            <span>{deckL.cueMonitor ? '🎧 CĂȘTI PFL ACTIV (APRINS)' : '🎧 CĂȘTI PFL (STINS)'}</span>
          </button>
        </div>

        {/* --- CENTRAL MIXER STRIP (COL-SPAN-2) --- */}
        <div className="md:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between items-center gap-3">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
            MIXER CONSOLĂ
          </span>

          {/* Dual Volume Faders L & R */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {/* Fader Deck L */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-mono text-cyan-400 font-bold">CH 1</span>
              <input
                type="range"
                min="0"
                max="1.2"
                step="0.01"
                value={deckL.volume}
                onChange={e => onVolumeChangeL(parseFloat(e.target.value))}
                className="h-32 -rotate-180 appearance-none bg-zinc-950 rounded-lg cursor-pointer accent-cyan-400 w-4 border border-zinc-800"
                style={{ writingMode: 'vertical-lr' as unknown as undefined }}
              />
              <span className={`text-[9px] font-mono font-bold ${deckL.volume <= 0.01 ? 'text-red-400 animate-pulse' : 'text-zinc-300'}`}>
                {deckL.volume <= 0.01 ? 'MUT (0%)' : `${Math.round((deckL.volume / 1.0) * 100)}%`}
              </span>
            </div>

            {/* Fader Deck R */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-mono text-orange-400 font-bold">CH 2</span>
              <input
                type="range"
                min="0"
                max="1.2"
                step="0.01"
                value={deckR.volume}
                onChange={e => onVolumeChangeR(parseFloat(e.target.value))}
                className="h-32 -rotate-180 appearance-none bg-zinc-950 rounded-lg cursor-pointer accent-orange-400 w-4 border border-zinc-800"
                style={{ writingMode: 'vertical-lr' as unknown as undefined }}
              />
              <span className={`text-[9px] font-mono font-bold ${deckR.volume <= 0.01 ? 'text-red-400 animate-pulse' : 'text-zinc-300'}`}>
                {deckR.volume <= 0.01 ? 'MUT (0%)' : `${Math.round((deckR.volume / 1.0) * 100)}%`}
              </span>
            </div>
          </div>

          {/* Crossfader */}
          <div className="w-full flex flex-col items-center gap-1 pt-2 border-t border-zinc-800">
            <span className="text-[9px] font-mono text-zinc-400">CROSSFADER</span>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.02"
              value={mixer.crossfader}
              onChange={e => onCrossfaderChange(parseFloat(e.target.value))}
              className="w-full h-3 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-purple-500 border border-zinc-800"
            />
            <div className="w-full flex justify-between text-[8px] font-mono text-zinc-500">
              <span className={mixer.crossfader <= -0.9 ? 'text-cyan-400 font-bold' : ''}>A (L)</span>
              <span className={Math.abs(mixer.crossfader) < 0.1 ? 'text-purple-400 font-bold' : ''}>CENTER</span>
              <span className={mixer.crossfader >= 0.9 ? 'text-orange-400 font-bold' : ''}>B (R)</span>
            </div>
          </div>
        </div>

        {/* --- DECK 2 (RIGHT / B) --- */}
        <div className="md:col-span-5 bg-zinc-900/80 border-2 border-orange-500/40 rounded-xl p-3.5 flex flex-col gap-3 shadow-lg">
          {/* Deck Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
              <div className="truncate">
                <span className="text-xs font-black font-mono text-orange-400 uppercase">DECK 2 (B)</span>
                <div className="text-[11px] font-mono font-bold text-white truncate max-w-[160px]">
                  {deckR.trackName}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-mono font-bold text-orange-300">{deckR.bpm.toFixed(1)} BPM</div>
              <div className="text-[10px] font-mono text-zinc-400">
                {formatTime(deckR.currentTime)} / {formatTime(deckR.duration)}
              </div>
            </div>
          </div>

          {/* Jog Wheel Touch / Platter */}
          <div className="flex justify-center py-1">
            <JogWheel
              deckId="R"
              isPlaying={deckR.isPlaying}
              bpm={deckR.bpm}
              onScratch={onJogScratchR}
              size={135}
            />
          </div>

          {/* Big Tactile Transport Buttons: PLAY / CUE / SYNC */}
          <div className="grid grid-cols-3 gap-2">
            {/* CUE Button */}
            <button
              onClick={onCueR}
              onMouseDown={onCueHoldStartR}
              onMouseUp={onCueHoldEndR}
              onTouchStart={onCueHoldStartR}
              onTouchEnd={onCueHoldEndR}
              className={`h-14 rounded-xl flex flex-col items-center justify-center font-black font-mono transition-all border-2 active:scale-95 shadow-md ${
                deckR.currentTime === deckR.cuePoint && !deckR.isPlaying
                  ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_#f59e0b]'
                  : 'bg-zinc-800 text-amber-400 border-amber-500/50 hover:bg-zinc-750'
              }`}
            >
              <span className="text-base tracking-wider">CUE</span>
              <span className="text-[8px] font-sans opacity-80">HOLD PREV</span>
            </button>

            {/* PLAY / PAUSE Button */}
            <button
              onClick={onPlayToggleR}
              className={`h-14 rounded-xl flex flex-col items-center justify-center font-black font-mono transition-all border-2 active:scale-95 shadow-md ${
                deckR.isPlaying
                  ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_20px_#10b981] animate-pulse'
                  : 'bg-zinc-800 text-emerald-400 border-emerald-500/50 hover:bg-zinc-750'
              }`}
            >
              <div className="flex items-center gap-1">
                {deckR.isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span className="text-base tracking-wider">{deckR.isPlaying ? 'PAUZĂ' : 'PLAY'}</span>
              </div>
              <span className="text-[8px] font-sans opacity-80">DECK 2</span>
            </button>

            {/* SYNC Button */}
            <button
              onClick={onSyncR}
              className={`h-14 rounded-xl flex flex-col items-center justify-center font-black font-mono transition-all border-2 active:scale-95 ${
                deckR.sync
                  ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_#3b82f6]'
                  : 'bg-zinc-800 text-blue-400 border-blue-500/40 hover:bg-zinc-750'
              }`}
            >
              <div className="flex items-center gap-1">
                <Zap size={14} />
                <span className="text-sm">SYNC</span>
              </div>
              <span className="text-[8px] font-sans opacity-80">AUTO BPM</span>
            </button>
          </div>

          {/* Quick Loops & Hot Cues Row */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            <button
              onClick={onToggleLoopR}
              className={`py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 border ${
                deckR.isLooping
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-zinc-850 text-zinc-400 border-zinc-750'
              }`}
            >
              <Repeat size={11} /> LOOP
            </button>
            {[1, 2, 3, 4].map(idx => (
              <button
                key={idx}
                onClick={() => onHotCueR(idx - 1)}
                className="py-1.5 rounded-lg bg-zinc-850 hover:bg-orange-900 text-orange-300 border border-orange-500/30 text-[10px] font-mono font-bold active:scale-95 transition-all"
              >
                CUE {idx}
              </button>
            ))}
          </div>

          {/* Headphone CUE (Simbol Căști) Button */}
          <button
            onClick={onCueMonitorToggleR}
            className={`w-full py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 border transition-all ${
              deckR.cueMonitor
                ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_#f59e0b] animate-pulse font-black'
                : 'bg-zinc-850 text-zinc-400 border-zinc-750 hover:text-white'
            }`}
            title="Căști PFL Deck 2 (Simbol Căști)"
          >
            <Headphones size={15} />
            <span>{deckR.cueMonitor ? '🎧 CĂȘTI PFL ACTIV (APRINS)' : '🎧 CĂȘTI PFL (STINS)'}</span>
          </button>
        </div>
      </div>

      {/* Optional Collapsible EQ & Filter Section */}
      {activeTab === 'eq' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
          <span className="text-xs font-bold font-mono text-purple-300 uppercase">
            3-BAND EQ & COLOR FILTER (CH 1 & CH 2)
          </span>
          <div className="grid grid-cols-2 gap-6">
            {/* Channel 1 EQ */}
            <div className="flex flex-col gap-2 bg-zinc-950 p-3 rounded-lg border border-zinc-850">
              <span className="text-[10px] font-mono text-cyan-400 font-bold">CH 1 EQ</span>
              <div className="grid grid-cols-4 gap-2">
                <RotaryKnob
                  label="HIGH"
                  value={deckL.eqHigh}
                  min={-26}
                  max={6}
                  size="sm"
                  color="cyan"
                  bipolar
                  onChange={v => onDeckEQChange('L', 'high', v)}
                />
                <RotaryKnob
                  label="MID"
                  value={deckL.eqMid}
                  min={-26}
                  max={6}
                  size="sm"
                  color="cyan"
                  bipolar
                  onChange={v => onDeckEQChange('L', 'mid', v)}
                />
                <RotaryKnob
                  label="LOW"
                  value={deckL.eqLow}
                  min={-26}
                  max={6}
                  size="sm"
                  color="cyan"
                  bipolar
                  onChange={v => onDeckEQChange('L', 'low', v)}
                />
                <RotaryKnob
                  label="FILTER"
                  value={deckL.filter}
                  min={-1}
                  max={1}
                  size="sm"
                  color="cyan"
                  bipolar
                  onChange={v => onDeckFilterChange('L', v)}
                />
              </div>
            </div>

            {/* Channel 2 EQ */}
            <div className="flex flex-col gap-2 bg-zinc-950 p-3 rounded-lg border border-zinc-850">
              <span className="text-[10px] font-mono text-orange-400 font-bold">CH 2 EQ</span>
              <div className="grid grid-cols-4 gap-2">
                <RotaryKnob
                  label="HIGH"
                  value={deckR.eqHigh}
                  min={-26}
                  max={6}
                  size="sm"
                  color="orange"
                  bipolar
                  onChange={v => onDeckEQChange('R', 'high', v)}
                />
                <RotaryKnob
                  label="MID"
                  value={deckR.eqMid}
                  min={-26}
                  max={6}
                  size="sm"
                  color="orange"
                  bipolar
                  onChange={v => onDeckEQChange('R', 'mid', v)}
                />
                <RotaryKnob
                  label="LOW"
                  value={deckR.eqLow}
                  min={-26}
                  max={6}
                  size="sm"
                  color="orange"
                  bipolar
                  onChange={v => onDeckEQChange('R', 'low', v)}
                />
                <RotaryKnob
                  label="FILTER"
                  value={deckR.filter}
                  min={-1}
                  max={1}
                  size="sm"
                  color="orange"
                  bipolar
                  onChange={v => onDeckFilterChange('R', v)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Mobile Sample Trigger Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between gap-2 overflow-x-auto">
        <span className="text-[10px] font-mono text-purple-400 font-bold shrink-0 flex items-center gap-1">
          <Flame size={12} /> PAD-URI RAPIDE:
        </span>
        <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
          {[
            { id: 'j-1', name: '🎺 Airhorn' },
            { id: 'j-2', name: '💥 Drop Bass' },
            { id: 's-l-1', name: '🥁 Kick 808' },
            { id: 's-l-2', name: '👏 Snare' },
            { id: 'j-9', name: '🚨 Siren FX' },
          ].map(pad => (
            <button
              key={pad.id}
              onClick={() => onTriggerSample(pad.id)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-purple-700 text-zinc-200 text-xs font-mono font-bold active:scale-95 transition-all shrink-0 border border-zinc-700"
            >
              {pad.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
