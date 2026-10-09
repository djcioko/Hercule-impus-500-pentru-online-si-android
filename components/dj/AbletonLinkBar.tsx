import React, { useState, useEffect } from 'react';
import { abletonLinkManager, LinkSessionState } from '../../utils/abletonLinkManager';
import { Radio, Wifi, Settings2, X, Plus, Minus } from 'lucide-react';

interface AbletonLinkBarProps {
  onBpmChange?: (bpm: number) => void;
}

export const AbletonLinkBar: React.FC<AbletonLinkBarProps> = ({ onBpmChange }) => {
  const [linkState, setLinkState] = useState<LinkSessionState>(abletonLinkManager.getState());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionInput, setSessionInput] = useState(linkState.sessionId);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  useEffect(() => {
    const unsub = abletonLinkManager.subscribe(state => {
      setLinkState(state);
    });
    return () => unsub();
  }, []);

  const handleToggle = () => {
    abletonLinkManager.toggleLink();
  };

  const handleTap = () => {
    const now = Date.now();
    const newTaps = [...tapTimes, now].filter(t => now - t < 3000).slice(-4);
    setTapTimes(newTaps);

    if (newTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 60 && calculatedBpm <= 220) {
        abletonLinkManager.setBpm(calculatedBpm);
        if (onBpmChange) onBpmChange(calculatedBpm);
      }
    }
  };

  const handleSaveSession = () => {
    if (sessionInput.trim()) {
      abletonLinkManager.setSessionId(sessionInput.trim());
      setIsModalOpen(false);
    }
  };

  const currentBeatInBar = Math.floor(linkState.phase);

  return (
    <>
      <div className="flex items-center gap-2 bg-zinc-900/90 px-2.5 py-1 rounded-xl border border-zinc-800 select-none">
        {/* LINK Main Toggle Button */}
        <button
          onClick={handleToggle}
          className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
            linkState.enabled
              ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.8)] border border-amber-300'
              : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
          }`}
          title="Ableton Link: Sincronizează tempo și beat prin Wi-Fi sau date mobile"
        >
          <Wifi size={13} className={linkState.enabled ? 'animate-pulse' : ''} />
          <span>LINK</span>
          {linkState.enabled && (
            <span className="text-[10px] bg-black/20 px-1 rounded">
              {linkState.peersCount} {linkState.peersCount === 1 ? 'PEER' : 'PEERS'}
            </span>
          )}
        </button>

        {/* 4-Beat Phase Meter LED Ring/Bar */}
        <div className="flex items-center gap-1 px-1">
          {[0, 1, 2, 3].map(beatIdx => {
            const isActive = linkState.enabled && currentBeatInBar === beatIdx;
            const isDownbeat = beatIdx === 0;

            return (
              <div
                key={beatIdx}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-75 ${
                  isActive
                    ? isDownbeat
                      ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] scale-125'
                      : 'bg-yellow-300 shadow-[0_0_6px_#fde047] scale-110'
                    : 'bg-zinc-800'
                }`}
              />
            );
          })}
        </div>

        {/* BPM Readout & Tap Tempo */}
        <div className="flex items-center gap-1 text-xs font-mono">
          <span className="font-bold text-gray-200">
            {linkState.bpm.toFixed(1)} <span className="text-[9px] text-zinc-500">BPM</span>
          </span>
          <button
            onClick={handleTap}
            className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 font-bold active:scale-95"
            title="Tap Tempo (Apasă ritmic pentru a seta BPM)"
          >
            TAP
          </button>
        </div>

        {/* Settings button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
          title="Configurare Cameră Sincronizare Wi-Fi / Mobile"
        >
          <Settings2 size={13} />
        </button>
      </div>

      {/* Link Settings Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4 text-gray-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Wifi className="text-amber-400" size={20} />
                <h3 className="text-sm font-bold font-mono tracking-tight text-white">
                  ABLETON LINK & SYNC WI-FI / MOBILE
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Sincronizează în timp real acest DJ console cu alte telefoane, laptopuri, tablete sau DAW-uri
              conectate la aceeași rețea Wi-Fi sau Hotspot Mobil!
            </p>

            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex flex-col gap-2">
              <label className="text-[11px] font-mono text-zinc-400 uppercase font-bold">
                Camera Sesiune Wi-Fi (Session Room ID):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sessionInput}
                  onChange={e => setSessionInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  placeholder="ex: TURBO-DJ-LINK-1"
                />
                <button
                  onClick={handleSaveSession}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg font-mono"
                >
                  Conectează
                </button>
              </div>
            </div>

            {/* BPM Adjust */}
            <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-xs font-mono text-zinc-300">Tempo Sincronizat:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const b = linkState.bpm - 1;
                    abletonLinkManager.setBpm(b);
                    if (onBpmChange) onBpmChange(b);
                  }}
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-bold font-mono text-amber-400 w-16 text-center">
                  {linkState.bpm.toFixed(1)}
                </span>
                <button
                  onClick={() => {
                    const b = linkState.bpm + 1;
                    abletonLinkManager.setBpm(b);
                    if (onBpmChange) onBpmChange(b);
                  }}
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono rounded-lg"
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
