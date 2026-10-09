import React, { useState } from 'react';
import ImageUploadSection from '../ImageUploadSection';
import { GeminiResponseData, YoutubeSong, HistoryEntry } from '../../types';
import { Sparkles, Disc, Search, Music, ExternalLink, Radio, Users, Copy, Check, Tv, Share2 } from 'lucide-react';

interface AiDjSectionProps {
  onImageUpload: (file: File | Blob) => void;
  isLoading: boolean;
  error: string | null;
  geminiAnalysis: GeminiResponseData | null;
  suggestedSong: YoutubeSong | null;
  currentYoutubeId: string;
  history: HistoryEntry[];
  onSelectSongFromHistory: (videoId: string) => void;
  onSendToDeck: (deckId: 'L' | 'R', trackTitle: string) => void;
}

export const AiDjSection: React.FC<AiDjSectionProps> = ({
  onImageUpload,
  isLoading,
  error,
  geminiAnalysis,
  suggestedSong,
  history,
  onSendToDeck,
}) => {
  const FESTIFY_PARTY_URL = 'https://festify.us/party/-OMkDNoyn7nohBDBnLWmA';
  const FESTIFY_ACCESS_CODE = '384862';

  const [activeTab, setActiveTab] = useState<'festify' | 'youtube' | 'spotify'>('festify');
  const [searchQuery, setSearchQuery] = useState('Romanian Party Mix');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFestifyEmbed, setShowFestifyEmbed] = useState(true);

  // Quick party vibe presets
  const quickSearchPresets = [
    'Bogdan DLP - Hitana (Party Remix)',
    'B.U.G. Mafia - Pantelimon',
    'Bastard! - Bailalo Club Edit',
    'Daft Punk - Around The World',
    'Dua Lipa - Don\'t Start Now',
    'Tech-House Romanian Club Hits',
    'Festival EDM Bass Drop 2026',
    'Minimal Techno Bucharest',
  ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(FESTIFY_ACCESS_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(FESTIFY_PARTY_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleYouTubeSearch = (query: string = searchQuery) => {
    if (!query.trim()) return;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`;
    window.open(url, '_blank');
  };

  const handleSpotifySearch = (query: string = searchQuery) => {
    if (!query.trim()) return;
    const url = `https://open.spotify.com/search/${encodeURIComponent(query.trim())}`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 sm:p-6 flex flex-col gap-6 shadow-2xl backdrop-blur select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-4 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <Sparkles size={20} className="text-purple-400" /> CĂUTARE MUZICĂ & FESTIFY PARTY LIVE
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Playlist activ Festify (Cod: <strong className="text-purple-400 font-mono">384862</strong>), căutare rapidă YouTube și Spotify!
          </p>
        </div>

        {/* 3 Platforms Tabs Selector */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('festify')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'festify'
                ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.7)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users size={14} /> FESTIFY PARTY ({FESTIFY_ACCESS_CODE})
          </button>

          <button
            onClick={() => setActiveTab('youtube')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'youtube'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.7)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Radio size={14} /> CĂUTARE YOUTUBE
          </button>

          <button
            onClick={() => setActiveTab('spotify')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'spotify'
                ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.7)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Music size={14} /> SPOTIFY
          </button>
        </div>
      </div>

      {/* --- TAB 1: FESTIFY PARTY QUEUE INTEGRATION --- */}
      {activeTab === 'festify' && (
        <div className="flex flex-col gap-5">
          {/* Main Festify Banner with Access Code & Direct Links */}
          <div className="bg-gradient-to-r from-purple-950/80 via-zinc-950 to-purple-950/80 p-5 rounded-2xl border-2 border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.25)] flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center shadow-[0_0_15px_#a855f7] shrink-0">
                <Users size={28} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/30 text-purple-300 font-bold border border-purple-500/40">
                    PLAYLIST ACTIV FESTIFY
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-mono text-emerald-400">Live & Ready</span>
                </div>
                <h3 className="text-lg font-black font-mono text-white mt-1">
                  Petrecere Festify Online
                </h3>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Publicul intră pe <strong>festify.us</strong> și introduce codul pentru a adăuga și vota melodii în timp real!
                </p>
              </div>
            </div>

            {/* Access Code Box */}
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="bg-zinc-950 px-4 py-2.5 rounded-xl border border-purple-500/50 flex flex-col items-center shadow-inner">
                <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">
                  COD ACCES PETRECERE
                </span>
                <span className="text-2xl font-black font-mono tracking-widest text-yellow-300">
                  {FESTIFY_ACCESS_CODE}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow"
                >
                  {copiedCode ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Cod Copiat!' : 'Copiază Cod'}</span>
                </button>

                <a
                  href={FESTIFY_PARTY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-purple-300 hover:text-white font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-purple-500/40 shadow"
                >
                  <ExternalLink size={14} />
                  <span>Deschide Festify</span>
                </a>
              </div>
            </div>
          </div>

          {/* Controls Bar for Embed & Share */}
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFestifyEmbed(prev => !prev)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-1.5 border border-zinc-700"
              >
                <Tv size={13} />
                <span>{showFestifyEmbed ? 'Ascunde Fereastra Festify' : 'Afișează Fereastra Festify'}</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center gap-1.5 border border-zinc-700"
              >
                <Share2 size={13} />
                <span>{copiedLink ? 'Link Copiat!' : 'Copiază Link Invitație'}</span>
              </button>
            </div>
            <span className="hidden sm:inline text-zinc-500">
              Link: {FESTIFY_PARTY_URL}
            </span>
          </div>

          {/* Embedded Festify Party Window */}
          {showFestifyEmbed && (
            <div className="relative w-full h-[540px] bg-zinc-950 rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-2xl">
              <iframe
                src={FESTIFY_PARTY_URL}
                className="w-full h-full border-0"
                title="Festify Party Live Playlist"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen"
              />
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: YOUTUBE SEARCH & AI SENSOR (NO BROKEN PREVIEW!) --- */}
      {activeTab === 'youtube' && (
        <div className="flex flex-col gap-6">
          {/* Clean YouTube Search Form */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="text-red-500" size={20} />
                <h3 className="text-sm font-bold font-mono text-white">
                  CĂUTARE DIRECTĂ YOUTUBE (FĂRĂ PREVIEW BLOCAT)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                Rezultate directe din YouTube
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleYouTubeSearch();
                    }
                  }}
                  placeholder="Introdu numele piesei, artistul sau vibe-ul..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                onClick={() => handleYouTubeSearch()}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
              >
                <ExternalLink size={14} /> Caută pe YouTube
              </button>

              <button
                onClick={() => onSendToDeck('L', searchQuery)}
                className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all"
                title="Încarcă titlul căutat în Deck L"
              >
                <Disc size={13} /> DECK L
              </button>

              <button
                onClick={() => onSendToDeck('R', searchQuery)}
                className="px-3.5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all"
                title="Încarcă titlul căutat în Deck R"
              >
                <Disc size={13} /> DECK R
              </button>
            </div>

            {/* Quick Party Presets */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-900">
              <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">
                Căutări Rapide Piese Club & Petrecere:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickSearchPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(preset);
                      handleYouTubeSearch(preset);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] font-mono transition-colors"
                  >
                    🎵 {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gemini Camera / Image Vibe Sensor Section */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-400" size={18} />
              <h4 className="text-xs font-mono font-bold text-purple-300 uppercase">
                Senzor Vizual Gemini AI (Analiză Vibe din Cameră / Poză)
              </h4>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ImageUploadSection onImageReady={onImageUpload} isLoading={isLoading} />

              {/* Gemini Result Box */}
              <div className="flex flex-col justify-center">
                {geminiAnalysis && !isLoading ? (
                  <div className="bg-zinc-900 p-5 rounded-xl border border-purple-500/50 flex flex-col gap-3">
                    <div className="text-xs font-mono font-bold text-purple-300 uppercase flex items-center gap-1.5">
                      <Sparkles size={14} /> Rezultat Analiză Vibe:
                    </div>
                    <div className="text-lg font-black text-emerald-400 font-mono">
                      &ldquo;{geminiAnalysis.vibe}&rdquo;
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {geminiAnalysis.description}
                    </p>

                    {suggestedSong && (
                      <div className="mt-2 pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-zinc-500 font-mono uppercase">
                            Piesă Recomandată de AI:
                          </span>
                          <div className="text-sm font-bold text-yellow-300 font-mono">
                            {suggestedSong.name}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleYouTubeSearch(suggestedSong.name)}
                            className="px-2.5 py-1 text-[11px] font-mono font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> Caută
                          </button>
                          <button
                            onClick={() => onSendToDeck('L', suggestedSong.name)}
                            className="px-2.5 py-1 text-[11px] font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-1"
                          >
                            <Disc size={12} /> DECK L
                          </button>
                          <button
                            onClick={() => onSendToDeck('R', suggestedSong.name)}
                            className="px-2.5 py-1 text-[11px] font-mono font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-lg flex items-center gap-1"
                          >
                            <Disc size={12} /> DECK R
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs font-mono text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                    Fă o poză sau încarcă o imagine cu publicul pentru ca Gemini să detecteze vibe-ul petrecerii.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: SPOTIFY SEARCH --- */}
      {activeTab === 'spotify' && (
        <div className="bg-zinc-950 p-6 rounded-2xl border border-emerald-500/30 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/30 border border-emerald-500 flex items-center justify-center">
                <Music className="text-emerald-400" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-white">
                  SPOTIFY WEB CATALOG & SEARCH
                </h3>
                <p className="text-xs text-zinc-400">
                  Caută orice piesă din Spotify și trimite titlul în deck-urile DJ!
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSpotifySearch()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
            >
              Deschide în Spotify <ExternalLink size={13} />
            </button>
          </div>

          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Caută pe Spotify..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => handleSpotifySearch()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl"
            >
              Caută
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
