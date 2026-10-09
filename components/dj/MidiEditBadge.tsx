import React from 'react';
import { midiMappingService } from '../../utils/midiMappingService';

interface MidiEditBadgeProps {
  controlId: string;
  isEditMode: boolean;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
}

export const MidiEditBadge: React.FC<MidiEditBadgeProps> = ({
  controlId,
  isEditMode,
  isSelected,
  onClick,
  children,
  className = '',
}) => {
  if (!isEditMode) {
    return <div className={`relative ${className}`}>{children}</div>;
  }

  const mapping = midiMappingService.get(controlId);
  const label = mapping
    ? mapping.isCC
      ? `CC ${mapping.noteOrCC}`
      : `${mapping.status}:${mapping.noteOrCC}`
    : 'None';

  return (
    <div
      onClick={e => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`relative cursor-pointer transition-all ${className} ${
        isSelected
          ? 'ring-4 ring-blue-400 ring-offset-2 ring-offset-black shadow-[0_0_20px_#3b82f6] z-30'
          : 'ring-2 ring-blue-500/70 hover:ring-blue-400 hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] z-20'
      }`}
    >
      {/* Blue Ableton-style mapping overlay badge */}
      <div
        className={`absolute -top-2 -right-1.5 z-40 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-tight shadow-md flex items-center gap-0.5 pointer-events-none ${
          isSelected
            ? 'bg-blue-400 text-black shadow-[0_0_8px_#60a5fa] animate-pulse'
            : 'bg-blue-600 text-white border border-blue-400'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
        {label}
      </div>

      {children}
    </div>
  );
};
