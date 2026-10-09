import React from 'react';
import ImageUploadSection from '../ImageUploadSection';
import YouTubePlayer from '../YouTubePlayer';
import SongHistory from '../SongHistory';
import { GeminiResponseData, YoutubeSong, HistoryEntry } from '../../types';
import { Sparkles, ArrowRight, Disc } from 'lucide-react';

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
  currentYoutubeId,
  history,
  onSelectSongFromHistory,
  onSendToDeck,
}) => {
  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 flex flex-col gap-6 shadow-2xl backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-purple-400 flex items-center gap-2">
            <Sparkles size={22} className="text-purple-400" /> AI DJ VIBE DETECTOR (GEMINI)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Capturează sala, ringul de dans sau o poză; Gemini detectează vibe-ul și găsește piesa perfectă!
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/60 border border-red-700 p-3 rounded-lg text-red-200 text-xs font-mono">
          Eroare: {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Image Input & Gemini Analysis */}
        <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-850 flex flex-col gap-4">
          <ImageUploadSection onImageReady={onImageUpload} isLoading={isLoading} />

          {geminiAnalysis && !isLoading && (
            <div className="mt-4 bg-zinc-900 p-4 rounded-lg border border-purple-500/50 flex flex-col gap-2">
              <div className="text-xs font-mono font-bold text-purple-300 uppercase flex items-center gap-1.5">
                <Sparkles size={14} /> Analiză Vibe Gemini:
              </div>
              <div className="text-base font-extrabold text-emerald-400 font-mono">
                &ldquo;{geminiAnalysis.vibe}&rdquo;
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {geminiAnalysis.description}
              </p>

              {suggestedSong && (
                <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase">Piesă Recomandată:</span>
                    <div className="text-sm font-bold text-yellow-300">{suggestedSong.name}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSendToDeck('L', suggestedSong.name)}
                      className="px-2 py-1 text-[10px] font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded flex items-center gap-1"
                    >
                      <Disc size={11} /> Încarcă DECK L
                    </button>
                    <button
                      onClick={() => onSendToDeck('R', suggestedSong.name)}
                      className="px-2 py-1 text-[10px] font-mono font-bold bg-orange-600 hover:bg-orange-500 text-white rounded flex items-center gap-1"
                    >
                      <Disc size={11} /> Încarcă DECK R
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: YouTube Player & History */}
        <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-850 flex flex-col gap-6">
          <YouTubePlayer videoId={currentYoutubeId} />
          <SongHistory history={history} onSelectSong={onSelectSongFromHistory} />
        </div>
      </div>
    </div>
  );
};
