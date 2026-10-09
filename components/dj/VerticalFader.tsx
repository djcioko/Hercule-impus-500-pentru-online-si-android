import React, { useRef, useCallback, useState, useEffect } from 'react';

interface VerticalFaderProps {
  value: number; // current value
  min?: number;
  max?: number;
  defaultValue?: number;
  step?: number;
  label: string;
  color?: 'cyan' | 'orange' | 'purple' | 'amber';
  height?: number; // in pixels, default 130
  onChange: (val: number) => void;
  className?: string;
}

export const VerticalFader: React.FC<VerticalFaderProps> = ({
  value,
  min = 0,
  max = 1.2,
  defaultValue = 1.0,
  step = 0.01,
  label,
  color = 'cyan',
  height = 140,
  onChange,
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Accent color styles
  const colorMap = {
    cyan: {
      accent: 'bg-cyan-400',
      glow: 'shadow-[0_0_12px_#00f2ff]',
      line: 'bg-cyan-400',
      text: 'text-cyan-400',
      thumbBorder: 'border-cyan-400',
    },
    orange: {
      accent: 'bg-orange-400',
      glow: 'shadow-[0_0_12px_#ff7700]',
      line: 'bg-orange-400',
      text: 'text-orange-400',
      thumbBorder: 'border-orange-400',
    },
    purple: {
      accent: 'bg-purple-400',
      glow: 'shadow-[0_0_12px_#c084fc]',
      line: 'bg-purple-400',
      text: 'text-purple-400',
      thumbBorder: 'border-purple-400',
    },
    amber: {
      accent: 'bg-amber-400',
      glow: 'shadow-[0_0_12px_#fbbf24]',
      line: 'bg-amber-400',
      text: 'text-amber-400',
      thumbBorder: 'border-amber-400',
    },
  }[color];

  // Normalized position: 0 (bottom = min) to 1 (top = max)
  const clampedVal = Math.max(min, Math.min(max, value));
  const range = max - min;
  const ratio = range > 0 ? (clampedVal - min) / range : 0; // 0 to 1

  // Determine if muted / fader is completely down
  const isMuted = clampedVal <= 0.01;

  const calculateValueFromPointer = useCallback(
    (clientY: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      // clientY is distance from top of viewport.
      // Top of track corresponds to max (ratio = 1).
      // Bottom of track corresponds to min (ratio = 0).
      const offsetY = clientY - rect.top;
      const rawRatio = 1 - offsetY / rect.height;
      const clampedRatio = Math.max(0, Math.min(1, rawRatio));

      // If dragged within bottom 3% of the fader, snap strictly to 0
      if (clampedRatio <= 0.03) {
        onChange(0);
        return;
      }

      // If dragged within 1.5% of unity (1.0), snap to unity
      const rawVal = min + clampedRatio * range;
      if (Math.abs(rawVal - 1.0) < 0.02 && max >= 1.0) {
        onChange(1.0);
        return;
      }

      // Apply step
      const steppedVal = Math.round(rawVal / step) * step;
      const finalVal = Math.max(min, Math.min(max, steppedVal));
      onChange(parseFloat(finalVal.toFixed(2)));
    },
    [min, max, range, step, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    calculateValueFromPointer(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    calculateValueFromPointer(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Wheel scroll
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = -Math.sign(e.deltaY) * step * 2;
    const nextVal = Math.max(min, Math.min(max, clampedVal + delta));
    onChange(nextVal <= 0.01 ? 0 : parseFloat(nextVal.toFixed(2)));
  };

  // Percentage and dB label
  const percentText = isMuted ? 'MUTE (0%)' : `${Math.round((clampedVal / 1.0) * 100)}%`;

  return (
    <div
      className={`flex flex-col items-center select-none ${className}`}
      onWheel={handleWheel}
    >
      {/* Label & Value Readout */}
      <div className="flex flex-col items-center mb-1">
        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        <span
          className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded transition-colors ${
            isMuted
              ? 'bg-red-950/80 text-red-400 border border-red-500/50 animate-pulse'
              : `${colorMap.text} bg-zinc-950 border border-zinc-800`
          }`}
          title="Nivel volum curent (Dublu-click pentru 100%)"
          onDoubleClick={() => onChange(defaultValue)}
        >
          {percentText}
        </span>
      </div>

      {/* Main Vertical Fader Track Container */}
      <div className="flex items-center gap-1.5 my-1">
        {/* dB Scale Markings on Left */}
        <div
          className="flex flex-col justify-between text-[7px] font-mono text-zinc-500 h-full py-1 text-right select-none pointer-events-none"
          style={{ height: `${height}px` }}
        >
          <span className="text-zinc-400">+6dB</span>
          <span className="text-zinc-300 font-bold">0dB</span>
          <span>-6dB</span>
          <span>-12dB</span>
          <span>-24dB</span>
          <span className="text-red-400 font-bold">-∞</span>
        </div>

        {/* Interactive Fader Track */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative w-8 bg-zinc-950 border-2 rounded-lg cursor-ns-resize shadow-inner transition-colors ${
            isDragging ? 'border-zinc-500 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'
          }`}
          style={{ height: `${height}px` }}
        >
          {/* Central Slot Groove */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-1.5 bg-black rounded-full border border-zinc-800" />

          {/* Active Level Bar (fills from bottom to current ratio) */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 bottom-2 w-1 rounded-full pointer-events-none transition-all ${
              isMuted ? 'bg-transparent' : colorMap.accent
            }`}
            style={{
              height: isMuted ? '0px' : `calc(${ratio * 100}% - 4px)`,
              maxHeight: `calc(${height}px - 16px)`,
            }}
          />

          {/* Zero dB Notch Indicator Line */}
          <div
            className="absolute left-1 right-1 h-0.5 bg-zinc-600 pointer-events-none opacity-60"
            style={{
              bottom: `calc(${((1.0 - min) / range) * 100}% - 1px)`,
            }}
            title="0dB Unity Gain"
          />

          {/* Physical Fader Handle / Cap */}
          <div
            className={`absolute left-0.5 right-0.5 h-6 -translate-y-1/2 rounded shadow-2xl transition-transform border pointer-events-none ${
              isMuted
                ? 'bg-zinc-800 border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                : `bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border-zinc-500 ${
                    isDragging ? colorMap.glow : ''
                  }`
            }`}
            style={{
              bottom: `calc(8px + ${ratio * (height - 24)}px)`,
            }}
          >
            {/* Horizontal Grooves on Cap for grip texture */}
            <div className="w-full h-full flex flex-col justify-center items-center gap-0.5 px-1">
              <div className="w-full h-[1px] bg-zinc-500/60" />
              {/* White Center Line Indicator */}
              <div
                className={`w-full h-[2px] rounded-full shadow-sm ${
                  isMuted ? 'bg-red-400' : colorMap.line
                }`}
              />
              <div className="w-full h-[1px] bg-zinc-500/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons: CUT (0% MUTE) & 0dB (100%) */}
      <div className="flex items-center gap-1 mt-1">
        <button
          onClick={() => onChange(0)}
          className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all border ${
            isMuted
              ? 'bg-red-600 text-white border-red-500 shadow-[0_0_6px_#ef4444]'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border-zinc-800'
          }`}
          title="Fader Jos: MUTE COMPLET (0%)"
        >
          CUT 0%
        </button>

        <button
          onClick={() => onChange(1.0)}
          className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          title="Reset Volum la 0dB (100%)"
        >
          0dB
        </button>
      </div>
    </div>
  );
};
