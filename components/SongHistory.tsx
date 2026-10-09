import React from 'react';
import { HistoryEntry } from '../types';

interface SongHistoryProps {
  history: HistoryEntry[];
  onSelectSong: (id: string) => void;
}

const SongHistory: React.FC<SongHistoryProps> = ({ history, onSelectSong }) => {
  if (history.length === 0) {
    return (
      <div className="mt-8 text-center text-gray-400">
        No songs in history yet. Upload an image to start!
      </div>
    );
  }

  return (
    <div className="w-full mt-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-purple-400">📂 History</h2>
      <ul className="space-y-3">
        {history.map((entry) => (
          <li
            key={entry.id + entry.timestamp}
            className="flex items-center justify-between p-4 bg-gray-800 rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
            onClick={() => onSelectSong(entry.id)}
          >
            <div className="flex-1">
              <p className="font-semibold text-lg text-green-300">{entry.name}</p>
              <p className="text-sm text-gray-400">{entry.vibe}</p>
            </div>
            <span className="text-xs text-gray-500 ml-4">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SongHistory;
