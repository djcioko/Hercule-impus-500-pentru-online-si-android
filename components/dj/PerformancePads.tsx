import React, { useRef } from 'react';
import { SoundItem } from '../../types/dj';
import { Upload, Volume2 } from 'lucide-react';

interface PerformancePadsProps {
  title: string;
  deckSide: 'L' | 'R';
  samples: (SoundItem & { defaultSynth: string })[];
  activePads: Set<string>;
  onTriggerPad: (id: string) => void;
  onFileUpload: (id: string, file: File) => void;
  onVolumeChange: (id: string, vol: number) => void;
}

export const PerformancePads: React.FC<PerformancePadsProps> = ({
  title,
  deckSide,
  samples,
  activePads,
  onTriggerPad,
  onFileUpload,
  onVolumeChange,
}) => {
  const isLeft = deckSide === 'L';
  const themeColor = isLeft ? 'border-cyan-500/40 text-cyan-400' : 'border-orange-500/40 text-orange-400';
  const activeGlow = isLeft
    ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_20px_#00f2ff] scale-95'
    : 'bg-orange-400 text-black border-orange-300 shadow-[0_0_20px_#ff7700] scale-95';

  return (
    <div className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2.5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <h4 className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${themeColor}`}>
          <span
            className={`w-2.5 h-2.5 rounded-full ${isLeft ? 'bg-cyan-400 shadow-[0_0_6px_#00f2ff]' : 'bg-orange-400 shadow-[0_0_6px_#ff7700]'}`}
          />
          {title} ({samples.length} PADS)
        </h4>
        <span className="text-[10px] font-mono text-zinc-500">
          MIDI STATUS: {isLeft ? '150' : '151'}
        </span>
      </div>

      {/* 2x4 MPC Pads Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {samples.map(sample => {
          const isActive = activePads.has(sample.id);
          const fileInputId = `pad-upload-${sample.id}`;

          return (
            <div
              key={sample.id}
              className="group relative flex flex-col justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all shadow-md"
            >
              {/* Top info: Key badge & MIDI note badge */}
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="font-bold text-amber-400 bg-zinc-900 px-1 rounded border border-zinc-750">
                  [{sample.key.toUpperCase()}]
                </span>
                <span className="text-zinc-500 text-[8px]">
                  N:{sample.midi.note}
                </span>
              </div>

              {/* Main Performance Trigger Button */}
              <button
                onClick={() => onTriggerPad(sample.id)}
                className={`w-full my-2 py-3.5 px-1 rounded-md text-center transition-all duration-75 border font-semibold flex flex-col items-center justify-center gap-1 select-none active:scale-95 ${
                  isActive
                    ? activeGlow
                    : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-gray-200'
                }`}
              >
                <span className="text-xs truncate max-w-full font-bold">
                  {sample.name}
                </span>
                {sample.customFileName ? (
                  <span className="text-[8px] text-zinc-400 truncate max-w-full italic">
                    📁 {sample.customFileName}
                  </span>
                ) : (
                  <span className="text-[8px] text-zinc-500">
                    synth #{sample.defaultSynth}
                  </span>
                )}
              </button>

              {/* Bottom bar: Volume & File Upload */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-900">
                <label
                  htmlFor={fileInputId}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                  title="Upload custom audio for this pad"
                >
                  <Upload size={11} />
                </label>
                <input
                  id={fileInputId}
                  type="file"
                  accept="audio/*"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) onFileUpload(sample.id, f);
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
                    value={sample.volume ?? 0.9}
                    onChange={e => onVolumeChange(sample.id, parseFloat(e.target.value))}
                    className="w-12 h-1 bg-zinc-800 rounded accent-amber-400 cursor-pointer"
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
