import React from 'react';
import { MidiStatusType } from '../../utils/midiManager';
import { SoundItem } from '../../types/dj';
import { Usb, X, CheckCircle, AlertCircle } from 'lucide-react';

interface MidiConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: MidiStatusType;
  deviceNames: string[];
  lastMidiEvent: { status: number; note: number; velocity: number; timestamp: number } | null;
  allBindings: SoundItem[];
  onConnect: () => void;
}

export const MidiConsoleModal: React.FC<MidiConsoleModalProps> = ({
  isOpen,
  onClose,
  status,
  deviceNames,
  lastMidiEvent,
  allBindings,
  onConnect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <Usb className="text-cyan-400" size={20} />
            <h2 className="text-base font-bold font-mono tracking-tight text-white">
              MIDI CONTROLLER MONITOR & MAPPINGS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4">
          {/* Status Bar */}
          <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2">
              {status === 'connected' ? (
                <CheckCircle className="text-emerald-400" size={18} />
              ) : (
                <AlertCircle className="text-amber-400" size={18} />
              )}
              <div>
                <div className="text-xs font-mono font-bold">
                  Status: <span className={status === 'connected' ? 'text-emerald-400' : 'text-amber-400'}>{status.toUpperCase()}</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  {deviceNames.length > 0 ? deviceNames.join(', ') : 'Niciun controller USB detectat încă'}
                </div>
              </div>
            </div>

            {status !== 'connected' && (
              <button
                onClick={onConnect}
                className="px-3 py-1.5 text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg"
              >
                Conectează MIDI
              </button>
            )}
          </div>

          {/* Live Monitor */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <h4 className="text-[11px] font-mono text-zinc-400 uppercase font-bold mb-2">
              Ultimul Semnal MIDI Primit
            </h4>
            {lastMidiEvent ? (
              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                <div className="bg-zinc-900 p-2 rounded">
                  <div className="text-[9px] text-zinc-500">STATUS</div>
                  <div className="text-sm font-bold text-cyan-400">{lastMidiEvent.status}</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded">
                  <div className="text-[9px] text-zinc-500">NOTE</div>
                  <div className="text-sm font-bold text-amber-400">{lastMidiEvent.note}</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded">
                  <div className="text-[9px] text-zinc-500">VELOCITY</div>
                  <div className="text-sm font-bold text-emerald-400">{lastMidiEvent.velocity}</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded">
                  <div className="text-[9px] text-zinc-500">TRIGGER</div>
                  <div className="text-xs font-bold text-purple-400 truncate">
                    {lastMidiEvent.velocity > 0 ? 'NOTE ON' : 'NOTE OFF'}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 font-mono italic">
                Apasă pe un pad fizic de pe mixerul / orga ta MIDI pentru a citi semnalul...
              </p>
            )}
          </div>

          {/* Preset Bindings Table */}
          <div>
            <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase mb-2">
              Mapare Prestabilită Butoane & Note MIDI
            </h4>
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-950 text-zinc-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Funcție</th>
                    <th className="p-2.5">Tastă Tastatură</th>
                    <th className="p-2.5">MIDI Status</th>
                    <th className="p-2.5">MIDI Note</th>
                    <th className="p-2.5">Categorie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 bg-zinc-900/50">
                  {allBindings.map(b => (
                    <tr key={b.id} className="hover:bg-zinc-800/40">
                      <td className="p-2.5 font-bold text-gray-200">{b.name}</td>
                      <td className="p-2.5">
                        <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-400 border border-zinc-700">
                          {b.key.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2.5 text-cyan-400 font-bold">{b.midi.status}</td>
                      <td className="p-2.5 text-purple-400 font-bold">{b.midi.note}</td>
                      <td className="p-2.5 text-zinc-400 capitalize">{b.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
