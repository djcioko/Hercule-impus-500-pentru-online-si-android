import React from 'react';
import { SoundItem } from '../../types/dj';
import { Radio, Upload, Volume2 } from 'lucide-react';

interface JinglesMatrixProps {
  jingles: (SoundItem & { defaultSynth: string })[];
  activeJingles: Set<string>;
  onTriggerJingle: (id: string) => void;
  onFileUpload: (id: string, file: File) => void;
  onVolumeChange: (id: string, vol: number) => void;
}

export const JinglesMatrix: React.FC<JinglesMatrixProps> = ({
  jingles,
  activeJingles,
  onTriggerJingle,
  onFileUpload,
  onVolumeChange,
}) => {
  return (
    <div className="w-full bg-zinc-900/95 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-2xl backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7] animate-pulse" />
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Radio size={16} /> BROADCAST JINGLES & RADIO DROPS (16 CARTS)
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
          <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            MIDI STATUS: <span className="text-purple-400 font-bold">153</span> (NOTES 36 - 51)
          </span>
        </div>
      </div>

      {/* 4x4 Jingles Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {jingles.map(jingle => {
          const isActive = activeJingles.has(jingle.id);
          const fileInputId = `jingle-upload-${jingle.id}`;

          return (
            <div
              key={jingle.id}
              className="group relative flex flex-col justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all shadow-md"
            >
              {/* Header: Key & MIDI Note */}
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="font-extrabold text-amber-400 bg-zinc-900 px-1 py-0.2 rounded border border-zinc-750">
                  [{jingle.key.toUpperCase()}]
                </span>
                <span className="text-zinc-500 text-[8px]">
                  N:{jingle.midi.note}
                </span>
              </div>

              {/* Main Jingle Trigger Button */}
              <button
                onClick={() => onTriggerJingle(jingle.id)}
                className={`w-full my-2 py-3 px-1.5 rounded-md text-center transition-all duration-75 border font-semibold flex flex-col items-center justify-center gap-0.5 select-none active:scale-95 ${
                  isActive
                    ? 'bg-purple-500 text-white border-purple-300 shadow-[0_0_20px_#a855f7] scale-95 font-bold animate-pulse'
                    : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-gray-200 hover:text-white'
                }`}
              >
                <span className="text-[11px] truncate max-w-full font-bold">
                  {jingle.name}
                </span>
                {jingle.customFileName ? (
                  <span className="text-[8px] text-purple-300 truncate max-w-full italic">
                    📁 {jingle.customFileName}
                  </span>
                ) : (
                  <span className="text-[8px] text-zinc-500">
                    FX: {jingle.defaultSynth}
                  </span>
                )}
              </button>

              {/* Footer: Upload & Volume */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-900">
                <label
                  htmlFor={fileInputId}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                  title="Upload audio for this jingle cart"
                >
                  <Upload size={11} />
                </label>
                <input
                  id={fileInputId}
                  type="file"
                  accept="audio/*"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) onFileUpload(jingle.id, f);
                  }}
                  className="hidden"
                />

                <div className="flex items-center gap-1">
                  <Volume2 size={10} className="text-zinc-500" />
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={jingle.volume ?? 0.9}
                    onChange={e => onVolumeChange(jingle.id, parseFloat(e.target.value))}
                    className="w-10 h-1 bg-zinc-800 rounded accent-purple-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
