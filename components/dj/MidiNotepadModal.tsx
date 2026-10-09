import React, { useState, useEffect } from 'react';
import { midiMappingService, MidiMappingEntry } from '../../utils/midiMappingService';
import { FileText, Table, RotateCcw, Copy, Check, X, Download, Upload, Usb, FileUp, Sparkles } from 'lucide-react';

interface MidiNotepadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectControlToLearn?: (controlId: string) => void;
  learningControlId?: string | null;
}

export const MidiNotepadModal: React.FC<MidiNotepadModalProps> = ({
  isOpen,
  onClose,
  onSelectControlToLearn,
  learningControlId,
}) => {
  const [viewMode, setViewMode] = useState<'notepad' | 'table'>('table');
  const [mappings, setMappings] = useState<MidiMappingEntry[]>([]);
  const [notepadText, setNotepadText] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMappings();
    }
  }, [isOpen]);

  const loadMappings = () => {
    const all = midiMappingService.getAll();
    setMappings(all);

    // Format in clean notepad style
    const textLines = [
      '# ==========================================================================',
      '# HERCULES & TURBO DJ CONSOLE - MIDI CONFIGURATION NOTEPAD',
      '# Suportă numere Zecimale (145, 176) sau Hexazecimale (0x91, 0xB0)',
      '# Format: FUNCTION_ID | NAME | STATUS | NOTE/CC | TYPE',
      '# ==========================================================================',
      '',
    ];

    all.forEach(m => {
      const hexStatus = `0x${m.status.toString(16).toUpperCase()}`;
      const hexNote = `0x${m.noteOrCC.toString(16).padStart(2, '0').toUpperCase()}`;
      textLines.push(
        `${m.controlId.padEnd(24)} | ${m.name.padEnd(26)} | STATUS: ${m.status.toString().padEnd(4)} (${hexStatus}) | NOTE/CC: ${m.noteOrCC.toString().padEnd(4)} (${hexNote}) | ${m.isCC ? 'CC' : 'NOTE'}`
      );
    });

    setNotepadText(textLines.join('\n'));
  };

  if (!isOpen) return null;

  // Smart parser: parses either our formatted text OR any raw Hercules mapping table copied from the web!
  const parseAndApplyText = (text: string) => {
    try {
      const lines = text.split('\n');
      let updatedCount = 0;

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        // Try pipe format first: FUNCTION_ID | NAME | STATUS | NOTE
        if (trimmed.includes('|')) {
          const parts = trimmed.split('|').map(p => p.trim());
          if (parts.length >= 4) {
            const controlId = parts[0];
            const statusMatch = parts[2].match(/(?:STATUS:|\b)(\d+|0x[0-9a-fA-F]+)/i);
            const noteMatch = parts[3].match(/(?:NOTE\/CC:|\b)(\d+|0x[0-9a-fA-F]+)/i);
            const isCC = parts[4]?.toUpperCase().includes('CC') || parts[3]?.toUpperCase().includes('CC') || false;

            if (controlId && statusMatch && noteMatch) {
              const status = statusMatch[1].startsWith('0x')
                ? parseInt(statusMatch[1], 16)
                : parseInt(statusMatch[1], 10);
              const noteOrCC = noteMatch[1].startsWith('0x')
                ? parseInt(noteMatch[1], 16)
                : parseInt(noteMatch[1], 10);

              midiMappingService.updateMapping(controlId, status, noteOrCC, isCC);
              updatedCount++;
              return;
            }
          }
        }

        // Try raw keyword matching (e.g. "PLAY DECK 1: 0x91 0x07" or "Volume 1 CC 0")
        const lower = trimmed.toLowerCase();
        let targetId: string | null = null;
        if (lower.includes('play') && (lower.includes('1') || lower.includes('left') || lower.includes('l'))) targetId = 'transport_play_l';
        else if (lower.includes('play') && (lower.includes('2') || lower.includes('right') || lower.includes('r'))) targetId = 'transport_play_r';
        else if (lower.includes('cue') && (lower.includes('1') || lower.includes('l'))) targetId = 'transport_cue_l';
        else if (lower.includes('cue') && (lower.includes('2') || lower.includes('r'))) targetId = 'transport_cue_r';
        else if (lower.includes('volume') && (lower.includes('1') || lower.includes('l'))) targetId = 'fader_volume_l';
        else if (lower.includes('volume') && (lower.includes('2') || lower.includes('r'))) targetId = 'fader_volume_r';
        else if (lower.includes('master')) targetId = 'fader_master';
        else if (lower.includes('crossfader')) targetId = 'fader_crossfader';
        else if (lower.includes('gain') && (lower.includes('1') || lower.includes('l'))) targetId = 'deck_gain_l';
        else if (lower.includes('gain') && (lower.includes('2') || lower.includes('r'))) targetId = 'deck_gain_r';
        else if (lower.includes('high') && (lower.includes('1') || lower.includes('l'))) targetId = 'deck_eq_high_l';
        else if (lower.includes('high') && (lower.includes('2') || lower.includes('r'))) targetId = 'deck_eq_high_r';
        else if (lower.includes('mid') && (lower.includes('1') || lower.includes('l'))) targetId = 'deck_eq_mid_l';
        else if (lower.includes('mid') && (lower.includes('2') || lower.includes('r'))) targetId = 'deck_eq_mid_r';
        else if (lower.includes('low') && (lower.includes('1') || lower.includes('l'))) targetId = 'deck_eq_low_l';
        else if (lower.includes('low') && (lower.includes('2') || lower.includes('r'))) targetId = 'deck_eq_low_r';
        else if (lower.includes('filter') && (lower.includes('1') || lower.includes('l'))) targetId = 'deck_filter_l';
        else if (lower.includes('filter') && (lower.includes('2') || lower.includes('r'))) targetId = 'deck_filter_r';
        else if (lower.includes('pitch') || lower.includes('tempo')) {
          if (lower.includes('1') || lower.includes('l')) targetId = 'deck_pitch_l';
          else if (lower.includes('2') || lower.includes('r')) targetId = 'deck_pitch_r';
        } else if (lower.includes('jog') || lower.includes('wheel')) {
          if (lower.includes('1') || lower.includes('l')) targetId = 'deck_jog_l';
          else if (lower.includes('2') || lower.includes('r')) targetId = 'deck_jog_r';
        }

        if (targetId) {
          const numbers = trimmed.match(/(?:0x[0-9a-fA-F]+|\b\d+\b)/g);
          if (numbers && numbers.length >= 2) {
            const st = numbers[0].startsWith('0x') ? parseInt(numbers[0], 16) : parseInt(numbers[0], 10);
            const nt = numbers[1].startsWith('0x') ? parseInt(numbers[1], 16) : parseInt(numbers[1], 10);
            const isCC = st >= 176 && st <= 191;
            midiMappingService.updateMapping(targetId, st, nt, isCC);
            updatedCount++;
          }
        }
      });

      loadMappings();
      setImportNotice(`Succes: Au fost analizate și actualizate ${updatedCount} mapări MIDI!`);
      setTimeout(() => setImportNotice(null), 4000);
    } catch (e) {
      alert('Eroare la parsarea textului: ' + String(e));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = evt => {
        const content = evt.target?.result as string;
        if (content) {
          setNotepadText(content);
          parseAndApplyText(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(notepadText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([notepadText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hercule-turbo-midi-map-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetDefaults = () => {
    if (confirm('Sigur dorești să resetezi toate mapările MIDI la setările originale din fabrică?')) {
      midiMappingService.resetToDefaults();
      loadMappings();
    }
  };

  const filteredMappings = mappings.filter(
    m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.controlId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_12px_#3b82f6]">
              <Usb size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-mono text-white flex items-center gap-2">
                HERCULES & TURBO MIDI CONTROLLER EDITOR
              </h2>
              <p className="text-[11px] text-zinc-400">
                Importă, editează și aplică fișiere text cu maparea oficială a controllerului tău Hercules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Table size={13} /> Tabel
              </button>
              <button
                onClick={() => setViewMode('notepad')}
                className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'notepad' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileText size={13} /> Stil Notepad (Text)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preset & Import Bar */}
        <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Preseturi Rapide:</span>
            <button
              onClick={() => {
                midiMappingService.loadPreset('hercules');
                loadMappings();
                setImportNotice('Maparea oficială Hercules DJControl (Inpulse / Universal) a fost activată!');
                setTimeout(() => setImportNotice(null), 3500);
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/50 text-xs font-mono font-bold flex items-center gap-1 transition-all"
            >
              <Sparkles size={12} /> ⚡ Hercules DJControl Oficial
            </button>
            <button
              onClick={() => {
                midiMappingService.loadPreset('original');
                loadMappings();
                setImportNotice('Maparea Turbo Soundboard (Cod Original) a fost activată!');
                setTimeout(() => setImportNotice(null), 3500);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/50 text-xs font-mono font-bold transition-all"
            >
              🚀 Turbo Original (Codul Tău)
            </button>
            <button
              onClick={handleResetDefaults}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-700"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* File Upload & Export Tools */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="midi-upload-file-input"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all"
              title="Încarcă fișier text Hercules (.txt / .csv / .json / .xml)"
            >
              <FileUp size={14} />
              <span>📁 Încarcă Fișier Text (.txt)</span>
            </label>
            <input
              id="midi-upload-file-input"
              type="file"
              accept=".txt,.csv,.tsv,.json,.xml"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={handleDownloadFile}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs flex items-center gap-1"
              title="Descarcă configurația curentă ca fișier text .txt"
            >
              <Download size={13} />
            </button>
          </div>
        </div>

        {/* Notice Message if any */}
        {importNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-500 text-emerald-300 px-4 py-2 text-xs font-mono flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            <span>{importNotice}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="p-3 bg-zinc-950/40 border-b border-zinc-850 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            {viewMode === 'table' ? (
              <input
                type="text"
                placeholder="Filtrează control (fader, eq, play, cue, jog...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-400"
              />
            ) : (
              <span className="text-xs font-mono text-zinc-400">
                Lipește (Paste) textul oficial de la Hercules mai jos și apasă <strong>„Aplică Text”</strong>:
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'notepad' && (
              <>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 flex items-center gap-1.5 border border-zinc-700"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? 'Copiat!' : 'Copiază'}</span>
                </button>
                <button
                  onClick={() => parseAndApplyText(notepadText)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-mono font-bold text-white shadow-[0_0_10px_#3b82f6]"
                >
                  Aplică Text în Consolă
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Content View */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-950 text-zinc-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Funcție / Control</th>
                    <th className="p-3">Categorie</th>
                    <th className="p-3">Tip</th>
                    <th className="p-3">Status (Dec / Hex)</th>
                    <th className="p-3">Notă sau CC (Dec / Hex)</th>
                    <th className="p-3">Mod</th>
                    <th className="p-3 text-right">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 bg-zinc-900/40">
                  {filteredMappings.map(entry => {
                    const isLearning = learningControlId === entry.controlId;
                    const hexStatus = `0x${entry.status.toString(16).toUpperCase()}`;
                    const hexNote = `0x${entry.noteOrCC.toString(16).toUpperCase()}`;

                    return (
                      <tr
                        key={entry.controlId}
                        className={`hover:bg-zinc-800/40 transition-colors ${
                          isLearning ? 'bg-blue-900/30' : ''
                        }`}
                      >
                        <td className="p-3 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            {entry.name}
                            <span className="text-[9px] text-zinc-500 font-normal">
                              ({entry.controlId})
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-zinc-400 capitalize">{entry.category}</td>
                        <td className="p-3 text-cyan-400 uppercase font-semibold">{entry.type}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="128"
                              max="255"
                              value={entry.status}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  midiMappingService.updateMapping(
                                    entry.controlId,
                                    val,
                                    entry.noteOrCC,
                                    entry.isCC
                                  );
                                  loadMappings();
                                }
                              }}
                              className="w-16 bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-amber-400 font-mono text-center"
                            />
                            <span className="text-[10px] text-zinc-500">({hexStatus})</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="127"
                              value={entry.noteOrCC}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  midiMappingService.updateMapping(
                                    entry.controlId,
                                    entry.status,
                                    val,
                                    entry.isCC
                                  );
                                  loadMappings();
                                }
                              }}
                              className="w-16 bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-purple-400 font-mono text-center"
                            />
                            <span className="text-[10px] text-zinc-500">({hexNote})</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              entry.isCC ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-purple-950 text-purple-300 border border-purple-800'
                            }`}
                          >
                            {entry.isCC ? 'CC' : 'NOTE'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              if (onSelectControlToLearn) {
                                onSelectControlToLearn(entry.controlId);
                              }
                            }}
                            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                              isLearning
                                ? 'bg-blue-400 text-black shadow-[0_0_10px_#60a5fa] animate-pulse'
                                : 'bg-blue-600/80 hover:bg-blue-600 text-white'
                            }`}
                          >
                            {isLearning ? 'Așteptare...' : 'Learn'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Notepad View */
            <div className="h-full flex flex-col gap-2">
              <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                <span>Notepad Text (Poți edita, copia sau da paste la fișierul text Hercules):</span>
                <span>Linii totale: {notepadText.split('\n').length}</span>
              </div>
              <textarea
                value={notepadText}
                onChange={e => setNotepadText(e.target.value)}
                className="w-full h-[450px] bg-zinc-950 font-mono text-xs text-green-400 p-4 rounded-xl border border-zinc-800 focus:outline-none focus:border-blue-400 resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>
            {mappings.length} controale mapate complet (Fadere, EQ, Filtre, Jog, Transport, Pad-uri, Jingle-uri).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
          >
            FINAL EDIT MIDI
          </button>
        </div>
      </div>
    </div>
  );
};
