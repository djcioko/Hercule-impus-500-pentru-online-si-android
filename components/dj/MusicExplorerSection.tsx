import React, { useState, useRef, useEffect } from 'react';
import { audioEngine } from '../../utils/audioEngine';
import {
  FolderOpen,
  Music,
  Play,
  Pause,
  Disc,
  Search,
  Upload,
  HardDrive,
  Headphones,
  Usb,
  Volume2,
  RefreshCw,
  CheckCircle2,
  Radio,
  Sliders,
  ListMusic
} from 'lucide-react';

export interface LocalTrack {
  id: string;
  name: string;
  artist: string;
  duration: number;
  file: File;
  buffer: AudioBuffer | null;
  sizeStr: string;
  format: string;
}

interface MusicExplorerSectionProps {
  onLoadTrackToDeck: (deckId: 'L' | 'R', file: File, buffer?: AudioBuffer) => void;
  trackEndMode: 'stop' | 'loop' | 'next';
  onTrackEndModeChange: (mode: 'stop' | 'loop' | 'next') => void;
  connectedMidiDevice: string;
  deckLTrackName: string;
  deckRTrackName: string;
}

export const MusicExplorerSection: React.FC<MusicExplorerSectionProps> = ({
  onLoadTrackToDeck,
  trackEndMode,
  onTrackEndModeChange,
  connectedMidiDevice,
  deckLTrackName,
  deckRTrackName,
}) => {
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  // Audio Output Devices state
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');
  const [isChangingDevice, setIsChangingDevice] = useState(false);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  // Load available audio output devices
  const refreshAudioDevices = async () => {
    try {
      const devices = await audioEngine.getAudioOutputDevices();
      setOutputDevices(devices);
      if (devices.length > 0 && selectedDeviceId === 'default') {
        setSelectedDeviceId(devices[0].deviceId || 'default');
      }
    } catch (e) {
      console.warn('Failed to get audio devices:', e);
    }
  };

  useEffect(() => {
    refreshAudioDevices();
  }, []);

  const handleDeviceChange = async (deviceId: string) => {
    setIsChangingDevice(true);
    setSelectedDeviceId(deviceId);
    await audioEngine.setAudioOutputDevice(deviceId);
    setIsChangingDevice(false);
  };

  const formatDuration = (sec: number) => {
    if (!sec || isNaN(sec)) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newTracks: LocalTrack[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith('audio/') && !/\.(mp3|wav|flac|m4a|aac|ogg|webm)$/i.test(file.name)) {
        continue;
      }

      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'AUDIO';
      const cleanName = file.name.replace(/\.[^/.]+$/, '');

      newTracks.push({
        id: `track-${Date.now()}-${i}`,
        name: cleanName,
        artist: 'Colecție Locală',
        duration: 0,
        file,
        buffer: null,
        sizeStr: `${sizeMb} MB`,
        format: ext,
      });
    }

    setTracks(prev => [...prev, ...newTracks]);
  };

  const handleTogglePreview = (track: LocalTrack) => {
    if (previewTrackId === track.id) {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.src = '';
      }
      setPreviewTrackId(null);
      setPreviewAudio(null);
      return;
    }

    if (previewAudio) {
      previewAudio.pause();
      previewAudio.src = '';
    }

    const audio = new Audio(URL.createObjectURL(track.file));
    audio.volume = 0.8;
    audio.play();
    audio.onended = () => {
      setPreviewTrackId(null);
      setPreviewAudio(null);
    };

    setPreviewAudio(audio);
    setPreviewTrackId(track.id);
  };

  const handleLoadDeck = (deckId: 'L' | 'R', track: LocalTrack) => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.src = '';
      setPreviewTrackId(null);
      setPreviewAudio(null);
    }
    onLoadTrackToDeck(deckId, track.file, track.buffer || undefined);
  };

  const filteredTracks = tracks.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-zinc-900/95 border border-zinc-800 rounded-xl p-4 sm:p-6 flex flex-col gap-5 shadow-2xl backdrop-blur select-none">
      {/* Top Header & System Info */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <HardDrive size={22} className="text-cyan-400" /> EXPLORER MUZICĂ LOCALĂ (PC / LAPTOP / TELEFON)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Navighează și încarcă colecția ta de muzică direct pe Deck A (Stânga) sau Deck B (Dreapta)!
          </p>
        </div>

        {/* Hardware Status Cards: Audio Output & MIDI */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Audio Output Source Selector */}
          <div className="bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800 flex items-center gap-2.5 shadow-inner">
            <Headphones size={16} className="text-amber-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold flex items-center gap-1">
                SURSA IEȘIRE AUDIO (CONSOLE / DIFUZOARE)
              </span>
              {outputDevices.length > 0 ? (
                <select
                  value={selectedDeviceId}
                  onChange={e => handleDeviceChange(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-amber-300 font-mono text-xs rounded px-2 py-0.5 mt-0.5 focus:outline-none focus:border-amber-400"
                >
                  {outputDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Ieșire Audio (${d.deviceId.slice(0, 8)}...)`}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-mono font-bold text-amber-300">
                  Difuzoare Sistem (Default Output)
                </span>
              )}
            </div>
            <button
              onClick={refreshAudioDevices}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
              title="Reîmprospătează lista ieșirilor audio"
            >
              <RefreshCw size={12} className={isChangingDevice ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Connected MIDI Device Badge */}
          <div className="bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800 flex items-center gap-2.5 shadow-inner">
            <Usb size={16} className={connectedMidiDevice ? 'text-emerald-400' : 'text-zinc-500'} />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">
                CONTROLLER MIDI CONECTAT
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 truncate max-w-[200px]">
                {connectedMidiDevice || 'Niciun controller detectat (Conectează Hercules USB/OTG)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Track End Playback Behavior Bar */}
      <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-purple-400" />
          <span className="text-xs font-mono font-bold text-zinc-200">
            COMPORTAMENT CÂND PIESA SE TERMINĂ (FINAL DECK 1 / 2):
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onTrackEndModeChange('stop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
              trackEndMode === 'stop'
                ? 'bg-red-600 text-white border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="Piesa se oprește la final și revine la început (Mod Standard DJ Club)"
          >
            ⏹️ OPRIRE LA FINAL (STOP)
          </button>

          <button
            onClick={() => onTrackEndModeChange('loop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
              trackEndMode === 'loop'
                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="Piesa reîncepe în buclă la nesfârșit"
          >
            🔁 BUCLĂ (LOOP CONTINUU)
          </button>

          <button
            onClick={() => onTrackEndModeChange('next')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
              trackEndMode === 'next'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="Încarcă și redă automat următoarea piesă din Explorer (Auto-Mix Petrecere)"
          >
            ⏭️ AUTO-MIX (URMĂTOAREA PIESĂ)
          </button>
        </div>
      </div>

      {/* Explorer Controls: Add Folder / Files & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Buttons for folder / files */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Open Folder Button */}
          <button
            onClick={() => folderInputRef.current?.click()}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-mono font-bold text-xs rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
          >
            <FolderOpen size={16} />
            <span>Deschide Folder Muzică</span>
          </button>
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error - webkitdirectory is standard for folder picker in modern browsers
            webkitdirectory=""
            directory=""
            multiple
            onChange={e => handleFilesSelected(e.target.files)}
            className="hidden"
          />

          {/* Add Multiple Files Button */}
          <button
            onClick={() => filesInputRef.current?.click()}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-mono font-bold text-xs rounded-xl flex items-center gap-2 border border-zinc-700 transition-all"
          >
            <Upload size={16} />
            <span>Adaugă Fișiere Audio</span>
          </button>
          <input
            ref={filesInputRef}
            type="file"
            multiple
            accept="audio/*"
            onChange={e => handleFilesSelected(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Search in library */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Caută în fișierele tale..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Tracks Table / List */}
      <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-inner flex flex-col min-h-[340px]">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-[10px] font-mono font-bold text-zinc-400 uppercase">
          <div className="col-span-1">Preview</div>
          <div className="col-span-6 sm:col-span-5">Titlu Piesă / Fișier</div>
          <div className="hidden sm:block sm:col-span-2">Format / Mărime</div>
          <div className="col-span-5 sm:col-span-4 text-right">Acțiuni Decks</div>
        </div>

        {/* Tracks Rows */}
        <div className="flex-1 overflow-y-auto max-h-[460px] divide-y divide-zinc-900">
          {filteredTracks.length > 0 ? (
            filteredTracks.map(track => {
              const isPlayingPreview = previewTrackId === track.id;
              const isLoadedDeckL = deckLTrackName.toLowerCase() === track.name.toLowerCase();
              const isLoadedDeckR = deckRTrackName.toLowerCase() === track.name.toLowerCase();

              return (
                <div
                  key={track.id}
                  className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-zinc-900/60 transition-colors text-xs font-mono"
                >
                  {/* Preview button */}
                  <div className="col-span-1">
                    <button
                      onClick={() => handleTogglePreview(track)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        isPlayingPreview
                          ? 'bg-amber-500 text-black animate-pulse shadow-[0_0_8px_#f59e0b]'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}
                      title={isPlayingPreview ? 'Oprește preview' : 'Ascultă preview'}
                    >
                      {isPlayingPreview ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                    </button>
                  </div>

                  {/* Title & Artist */}
                  <div className="col-span-6 sm:col-span-5 truncate">
                    <div className="font-bold text-zinc-100 truncate flex items-center gap-1.5">
                      <Music size={13} className="text-cyan-400 shrink-0" />
                      <span className="truncate">{track.name}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {track.artist}
                    </div>
                  </div>

                  {/* Format & Size */}
                  <div className="hidden sm:flex sm:col-span-2 items-center gap-2 text-zinc-400 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-850 text-cyan-300 font-bold text-[9px] border border-zinc-750">
                      {track.format}
                    </span>
                    <span>{track.sizeStr}</span>
                  </div>

                  {/* Load to Deck L / Deck R Buttons */}
                  <div className="col-span-5 sm:col-span-4 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleLoadDeck('L', track)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all border ${
                        isLoadedDeckL
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 ring-1 ring-cyan-400'
                          : 'bg-cyan-600/80 hover:bg-cyan-500 text-white border-cyan-500/40 hover:shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                      }`}
                      title="Încarcă această piesă pe Deck 1 (Stânga)"
                    >
                      <Disc size={12} />
                      <span>{isLoadedDeckL ? 'Încărcat D1' : 'Deck 1 (L)'}</span>
                    </button>

                    <button
                      onClick={() => handleLoadDeck('R', track)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all border ${
                        isLoadedDeckR
                          ? 'bg-orange-500/20 text-orange-300 border-orange-400/50 ring-1 ring-orange-400'
                          : 'bg-orange-600/80 hover:bg-orange-500 text-white border-orange-500/40 hover:shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                      }`}
                      title="Încarcă această piesă pe Deck 2 (Dreapta)"
                    >
                      <Disc size={12} />
                      <span>{isLoadedDeckR ? 'Încărcat D2' : 'Deck 2 (R)'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-zinc-500">
              <FolderOpen size={40} className="text-zinc-700" />
              <div>
                <p className="text-sm font-bold text-zinc-300">
                  Niciun fișier audio încărcat încă în Explorer
                </p>
                <p className="text-xs text-zinc-500 mt-1 max-w-md">
                  Apasă pe butonul <strong>&ldquo;Deschide Folder Muzică&rdquo;</strong> sau <strong>&ldquo;Adaugă Fișiere Audio&rdquo;</strong> pentru a vizualiza muzica din PC-ul, laptopul sau telefonul tău.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
