import React from 'react';

interface VuMeterProps {
  level: number; // 0.0 to 1.0
  height?: number;
  segments?: number;
  orientation?: 'vertical' | 'horizontal';
  showClip?: boolean;
}

export const VuMeter: React.FC<VuMeterProps> = ({
  level,
  height = 96,
  segments = 12,
  orientation = 'vertical',
  showClip = true,
}) => {
  const activeSegments = Math.round(Math.min(1, Math.max(0, level)) * segments);

  // Array of segment indices from bottom (0) to top (segments - 1)
  const segmentIndices = Array.from({ length: segments }, (_, i) => i);

  if (orientation === 'horizontal') {
    return (
      <div className="flex items-center gap-0.5 bg-zinc-950 p-1 rounded border border-zinc-800">
        {segmentIndices.map(idx => {
          const isActive = idx < activeSegments;
          const isRed = idx >= segments - 2;
          const isAmber = idx >= segments - 5 && idx < segments - 2;

          let colorClass = 'bg-zinc-800';
          if (isActive) {
            if (isRed) colorClass = 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]';
            else if (isAmber) colorClass = 'bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.6)]';
            else colorClass = 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]';
          }

          return (
            <div
              key={idx}
              className={`w-1.5 h-3.5 rounded-xs transition-colors duration-75 ${colorClass}`}
            />
          );
        })}
      </div>
    );
  }

  // Vertical orientation (standard DJ channel VU meter)
  return (
    <div
      className="flex flex-col-reverse justify-between bg-zinc-950/90 p-1 rounded-sm border border-zinc-800/80 shadow-inner"
      style={{ height: `${height}px`, width: '14px' }}
    >
      {segmentIndices.map(idx => {
        const isActive = idx < activeSegments;
        const isRed = idx >= segments - 2;
        const isAmber = idx >= segments - 5 && idx < segments - 2;

        let colorClass = 'bg-zinc-850 opacity-25';
        if (isActive) {
          if (isRed) colorClass = 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)] opacity-100';
          else if (isAmber) colorClass = 'bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.8)] opacity-100';
          else colorClass = 'bg-emerald-400 shadow-[0_0_3px_rgba(52,211,153,0.7)] opacity-100';
        }

        return (
          <div
            key={idx}
            className={`w-full h-1 rounded-[1px] transition-all duration-75 ${colorClass}`}
          />
        );
      })}
    </div>
  );
};
