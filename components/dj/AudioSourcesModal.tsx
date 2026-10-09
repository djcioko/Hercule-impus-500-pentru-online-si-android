import React, { useState } from 'react';
import { audioEngine } from '../../utils/audioEngine';
import { createDjDeckLoopBuffer } from '../../utils/soundSynthesizer';
import { Upload, Radio, Mic, Disc, Music, X, Play, Volume2 } from 'lucide-react';

interface AudioSourcesModalProps {
  isOpen: boolean;
  deckId: 'L' | 'R';
  onClose: () => void;
  onSelectTrack: (trackName: string, artist: string, buffer: AudioBuffer, bpm: number) => void;
}

export const AudioSourcesModal: React.FC<AudioSourcesModalProps> = ({
  isOpen,
  deckId,
  onClose,
  onSelectTrack,
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'file' | 'url' | 'mic'>('preset');
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Mic state
  const [isMicActive, setIsMicActive] = useState(audioEngine.isMicrophoneActive());
  const [micVol, setMicVol] = useState(1.0);

  if (!isOpen) return null;

  const presets = [
    {
      id: 'house',
      name: 'Festival House Anthem (Club Mix)',
      artist: 'DJ Cioko · Mainstage Stems',
      bpm: 128,
      genre: 'Electro House',
      synthDeck: 'L' as const,
    },
    {
      id: 'tech_house',
      name: 'Romanian Tech-House & Party Groove',
      artist: 'Bucharest Underground Beats',
      bpm: 128,
      genre: 'Tech-House / Minimal',
      synthDeck: 'R' as const,
    },
    {
      id: 'minimal',
      name: 'Deep Minimal Club Groove',
      artist: 'Sunrise Club Recordings',
      bpm: 126,
      genre: 'Minimal Techno',
      synthDeck: 'R' as const,
    },
    {
      id: 'dnb',
      name: 'Liquid Drum & Bass Roller',
      artist: 'High-Velocity Stems',
      bpm: 174,
      genre: 'Drum & Bass',
      synthDeck: 'L' as const,
    },
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    const ctx = audioEngine.getContext();
    const buffer = createDjDeckLoopBuffer(ctx, p.synthDeck, p.bpm);
    onSelectTrack(p.name, p.artist, buffer, p.bpm);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const buffer = await audioEngine.decodeAudioFile(file);
        const trackTitle = file.name.replace(/\.[^/.]+$/, '');
        onSelectTrack(trackTitle, 'Fișier Local Utilizator', buffer, 128);
        onClose();
      } catch (err) {
        alert('Eroare la decodarea fișierului audio.');
      }
    }
  };

  const handleLoadUrl = async () => {
    if (!urlInput.trim()) return;
    setIsLoadingUrl(true);
    setUrlError(null);
    try {
      const buffer = await audioEngine.loadAudioFromUrl(urlInput.trim());
      onSelectTrack('Online Audio Stream', urlInput.trim(), buffer, 128);
      onClose();
    } catch (err) {
      setUrlError('Nu s-a putut încărca stream-ul audio. Verifică adresa URL sau permisiunile CORS.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleToggleMic = async () => {
    if (!isMicActive) {
      const ok = await audioEngine.startMicrophone();
      setIsMicActive(ok);
    } else {
      audioEngine.stopMicrophone();
      setIsMicActive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <Music className={deckId === 'L' ? 'text-cyan-400' : 'text-orange-400'} size={20} />
            <h3 className="text-sm font-bold font-mono text-white">
              SURSE AUDIO DE PLAYARE · {deckId === 'L' ? 'DECK A (STÂNGA)' : 'DECK B (DREAPTA)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 p-1">
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'preset' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Disc size={13} /> Colecție DJ
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'file' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Upload size={13} /> Fișier Local
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'url' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Radio size={13} /> Web Stream URL
          </button>
          <button
            onClick={() => setActiveTab('mic')}
            className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'mic' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mic size={13} /> Microfon Live
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Preset Tracks */}
          {activeTab === 'preset' && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-mono text-zinc-400 mb-1">
                Alege o piesă / stem DJ de club de înaltă definiție gata sintetizată:
              </span>
              {presets.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">{p.artist}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-amber-400 border border-zinc-800 font-bold">
                      {p.bpm} BPM
                    </span>
                    <Play size={14} className="text-zinc-400 group-hover:text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Local File Upload */}
          {activeTab === 'file' && (
            <div className="flex flex-col items-center justify-center gap-4 py-6 border-2 border-dashed border-zinc-750 rounded-xl bg-zinc-950/50">
              <Upload size={32} className="text-zinc-500" />
              <div className="text-center">
                <div className="text-xs font-bold text-gray-200">
                  Încarcă orice piesă audio de pe dispozitiv
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Suportă fișiere MP3, WAV, FLAC, AAC, OGG
                </div>
              </div>
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono rounded-lg cursor-pointer transition-all shadow">
                Răsfoiește Fișiere
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Web Stream URL */}
          {activeTab === 'url' && (
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-mono text-zinc-400 uppercase">
                Adresă Web Stream / Link MP3 Direct:
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://exemplu.com/stream.mp3"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              />
              {urlError && (
                <div className="text-[11px] text-red-400 font-mono">{urlError}</div>
              )}
              <button
                onClick={handleLoadUrl}
                disabled={isLoadingUrl}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs font-mono rounded-lg transition-all"
              >
                {isLoadingUrl ? 'Se descarcă și decodifică...' : 'Încarcă Stream-ul în Deck'}
              </button>
            </div>
          )}

          {/* Live Microphone Talkover */}
          {activeTab === 'mic' && (
            <div className="flex flex-col gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className={isMicActive ? 'text-red-400 animate-pulse' : 'text-zinc-500'} size={20} />
                  <div>
                    <div className="text-xs font-bold text-white">Microfon Live DJ Talkover</div>
                    <div className="text-[10px] text-zinc-400">
                      {isMicActive ? 'Microfon ACTIV pe ieșirea Master' : 'Microfon oprit'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleToggleMic}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    isMicActive
                      ? 'bg-red-600 text-white shadow-[0_0_12px_#ef4444]'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  {isMicActive ? 'OPREȘTE MIC' : 'PORNEȘTE MIC'}
                </button>
              </div>

              {isMicActive && (
                <div className="flex items-center gap-3 pt-2 border-t border-zinc-900">
                  <Volume2 size={14} className="text-zinc-400" />
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={micVol}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      setMicVol(v);
                      audioEngine.setMicrophoneVolume(v);
                    }}
                    className="flex-1 h-1.5 bg-zinc-800 rounded accent-red-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-zinc-400 w-10 text-right">
                    {Math.round(micVol * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
