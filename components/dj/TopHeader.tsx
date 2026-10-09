import React from 'react';
import { MidiStatusType } from '../../utils/midiManager';
import { RotaryKnob } from './RotaryKnob';
import { VuMeter } from './VuMeter';
import {
  SlidersHorizontal,
  Layers,
  Radio,
  Sparkles,
  Square,
  Circle,
  Download,
  Usb,
  Volume2,
  Tv
} from 'lucide-react';

interface TopHeaderProps {
  midiStatus: MidiStatusType;
  midiDevices: string[];
  lastMidiEvent: { status: number; note: number; velocity: number } | null;
  masterVolume: number;
  masterPeakL: number;
  masterPeakR: number;
  isRecording: boolean;
  recordingDuration: number;
  activeView: 'decks' | 'samples' | 'jingles' | 'full' | 'ai';
  onConnectMidi: () => void;
  onDisconnectMidi: () => void;
  onMasterVolumeChange: (vol: number) => void;
  onStopAll: () => void;
  onToggleRecording: () => void;
  onDownloadRecording: () => void;
  hasRecording: boolean;
  onSelectView: (view: 'decks' | 'samples' | 'jingles' | 'full' | 'ai') => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  midiStatus,
  midiDevices,
  lastMidiEvent,
  masterVolume,
  masterPeakL,
  masterPeakR,
  isRecording,
  recordingDuration,
  activeView,
  onConnectMidi,
  onDisconnectMidi,
  onMasterVolumeChange,
  onStopAll,
  onToggleRecording,
  onDownloadRecording,
  hasRecording,
  onSelectView,
}) => {
  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 p-3 sm:px-6 flex flex-col gap-3 shadow-2xl sticky top-0 z-40 select-none">
      {/* Top Main Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <span className="text-xl">🚀</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                TURBO SOUNDBOARD <span className="text-cyan-400 font-mono text-sm">& PRO DJ</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
                PRO STUDIO V2
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Web Audio 64-bit Engine · Web MIDI Controller · Dynamic Platter DJ Suite
            </p>
          </div>
        </div>

        {/* MIDI Control Section */}
        <div className="flex flex-wrap items-center gap-2.5 bg-zinc-900/90 px-3 py-1.5 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-1.5">
            <Usb size={14} className={midiStatus === 'connected' ? 'text-emerald-400' : 'text-zinc-500'} />
            <span
              className={`text-xs font-mono font-bold ${
                midiStatus === 'connected'
                  ? 'text-emerald-400'
                  : midiStatus === 'error'
                  ? 'text-red-400'
                  : midiStatus === 'unsupported'
                  ? 'text-zinc-500'
                  : 'text-zinc-400'
              }`}
            >
              {midiStatus === 'connected'
                ? 'MIDI: ✅ Conectat'
                : midiStatus === 'error'
                ? 'MIDI: ❌ Eroare conexiune'
                : midiStatus === 'unsupported'
                ? 'MIDI: ❌ Nu e suportat'
                : 'MIDI: ❌ Neconectat'}
            </span>
          </div>

          {midiStatus !== 'connected' ? (
            <button
              onClick={onConnectMidi}
              className="px-2.5 py-1 text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-md border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.4)] transition-all"
            >
              Conectează MIDI
            </button>
          ) : (
            <button
              onClick={onDisconnectMidi}
              className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700"
            >
              Deconectează
            </button>
          )}

          {/* Last MIDI Note Readout matching prompt specs */}
          <div className="min-w-[170px] text-[10px] font-mono text-amber-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-850">
            {lastMidiEvent ? (
              <span>
                MIDI In: Status={lastMidiEvent.status}, Note={lastMidiEvent.note}, Vel={lastMidiEvent.velocity}
              </span>
            ) : (
              <span className="text-zinc-500">MIDI In: Așteptare semnal...</span>
            )}
          </div>
        </div>

        {/* Master Output & STOP ALL Controls */}
        <div className="flex items-center gap-4">
          {/* Master Stereo VU Meter */}
          <div className="flex items-center gap-1 bg-zinc-900/80 p-1.5 rounded-lg border border-zinc-800">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-mono text-zinc-500">L</span>
              <VuMeter level={masterPeakL} height={50} segments={10} />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-mono text-zinc-500">R</span>
              <VuMeter level={masterPeakR} height={50} segments={10} />
            </div>
          </div>

          {/* Master Volume */}
          <RotaryKnob
            label="MASTER"
            value={masterVolume}
            min={0}
            max={1.5}
            defaultValue={1.0}
            step={0.02}
            unit="%"
            color="emerald"
            size="md"
            onChange={onMasterVolumeChange}
          />

          {/* Master Live Recording */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onToggleRecording}
              className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 text-xs font-bold font-mono ${
                isRecording
                  ? 'bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
              title={isRecording ? 'Stop Recording' : 'Record DJ Live Set'}
            >
              <Circle size={14} className={isRecording ? 'fill-white' : 'text-red-500 fill-red-500'} />
              <span>{isRecording ? formatSecs(recordingDuration) : 'REC MIX'}</span>
            </button>

            {hasRecording && (
              <button
                onClick={onDownloadRecording}
                className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                title="Download recorded WAV/WebM"
              >
                <Download size={10} /> Salvează
              </button>
            )}
          </div>

          {/* STOP ALL PANIC BUTTON */}
          <button
            onClick={onStopAll}
            className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 border-2 border-red-400 text-white font-black text-sm tracking-wider uppercase shadow-[0_0_15px_rgba(239,68,68,0.6)] flex items-center gap-1.5 transition-all"
            title="Panic Stop: Stop all samples, jingles and decks immediately! (SPACE / ESC)"
          >
            <Square size={16} className="fill-white" />
            <span>STOP ALL</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center justify-between border-t border-zinc-850 pt-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => onSelectView('decks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeView === 'decks'
                ? 'bg-zinc-800 text-cyan-400 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal size={14} /> DUAL DECKS & MIXER
          </button>

          <button
            onClick={() => onSelectView('samples')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeView === 'samples'
                ? 'bg-zinc-800 text-amber-400 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers size={14} /> SAMPLES RACK (L & R)
          </button>

          <button
            onClick={() => onSelectView('jingles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeView === 'jingles'
                ? 'bg-zinc-800 text-purple-400 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Radio size={14} /> JINGLES MATRIX (16)
          </button>

          <button
            onClick={() => onSelectView('full')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeView === 'full'
                ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tv size={14} /> ALL-IN-ONE CONSOLE
          </button>

          <button
            onClick={() => onSelectView('ai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeView === 'ai'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} /> AI VIBE DETECTOR
          </button>
        </div>

        {/* Quick Hotkey Help Indicator */}
        <div className="hidden xl:flex items-center gap-3 text-[11px] font-mono text-zinc-400">
          <span>
            [Z/X]: <strong className="text-emerald-400">PLAY</strong>
          </span>
          <span>
            [C/V]: <strong className="text-amber-400">CUE</strong>
          </span>
          <span>
            [Q-I]: <strong className="text-cyan-400">SAMPLES L</strong>
          </span>
          <span>
            [A-K]: <strong className="text-orange-400">SAMPLES R</strong>
          </span>
          <span>
            [F-M, 1-8]: <strong className="text-purple-400">JINGLES</strong>
          </span>
          <span>
            [SPACE]: <strong className="text-red-400">STOP ALL</strong>
          </span>
        </div>
      </div>
    </header>
  );
};
