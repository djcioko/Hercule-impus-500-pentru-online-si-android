import React, { useRef, useState, useCallback, useEffect } from 'react';

interface RotaryKnobProps {
  label: string;
  value: number; // current value
  min: number;
  max: number;
  defaultValue?: number;
  step?: number;
  unit?: string;
  color?: 'cyan' | 'orange' | 'purple' | 'amber' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  bipolar?: boolean; // 0 in center
  onChange: (val: number) => void;
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  label,
  value,
  min,
  max,
  defaultValue = 0,
  step = 0.01,
  unit = '',
  color = 'cyan',
  size = 'md',
  bipolar = false,
  onChange,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const startVal = useRef(value);

  // Map value to angle (-135deg to +135deg = 270deg total sweep)
  const norm = (value - min) / (max - min);
  const angle = -135 + norm * 270;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    startVal.current = value;
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartY.current = e.touches[0].clientY;
      startVal.current = value;
    }
  };

  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.002 * (max - min);
    const next = Math.min(max, Math.max(min, value + delta));
    onChange(Math.round(next / step) * step);
  };

  const handleMove = useCallback(
    (clientY: number) => {
      const deltaY = dragStartY.current - clientY;
      const range = max - min;
      const change = (deltaY / 150) * range;
      const next = Math.min(max, Math.max(min, startVal.current + change));
      onChange(Math.round(next / step) * step);
    },
    [min, max, step, onChange]
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const onMouseUp = () => setIsDragging(false);

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) handleMove(e.touches[0].clientY);
    };
    const onTouchEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove]);

  // Color mapping
  const colorMap = {
    cyan: { ring: '#00f2ff', glow: 'rgba(0, 242, 255, 0.4)', text: 'text-cyan-400' },
    orange: { ring: '#ff7700', glow: 'rgba(255, 119, 0, 0.4)', text: 'text-orange-400' },
    purple: { ring: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', text: 'text-purple-400' },
    amber: { ring: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', text: 'text-amber-400' },
    emerald: { ring: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', text: 'text-emerald-400' },
  }[color];

  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }[size];

  // Format display string
  const displayVal =
    unit === 'dB'
      ? `${value > 0 ? '+' : ''}${value.toFixed(1)}dB`
      : unit === '%'
      ? `${Math.round(value * 100)}%`
      : value.toFixed(1);

  return (
    <div
      className="flex flex-col items-center select-none group cursor-pointer"
      onWheel={handleWheel}
      title={`${label}: ${displayVal} (Double click to reset)`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-200 transition-colors">
        {label}
      </span>

      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        className={`relative ${sizeClasses} my-1 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 border-2 border-zinc-600 shadow-md flex items-center justify-center transition-shadow ${
          isDragging ? 'ring-2 ring-cyan-400 shadow-lg' : ''
        }`}
        style={{
          boxShadow: isDragging ? `0 0 12px ${colorMap.glow}` : '0 2px 5px rgba(0,0,0,0.6)',
        }}
      >
        {/* Center metallic cap */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-700 border border-zinc-800" />

        {/* Center detent mark if bipolar */}
        {bipolar && (
          <div className="absolute top-0 w-0.5 h-1.5 bg-gray-500 -translate-y-1 pointer-events-none" />
        )}

        {/* Pointer indicator line */}
        <div
          className="absolute inset-0 flex items-start justify-center pointer-events-none"
          style={{
            transform: `rotate(${angle}deg)`,
            transition: isDragging ? 'none' : 'transform 0.08s ease-out',
          }}
        >
          <div
            className="w-1 h-3 rounded-full mt-0.5 shadow-sm"
            style={{ backgroundColor: colorMap.ring, boxShadow: `0 0 6px ${colorMap.glow}` }}
          />
        </div>
      </div>

      <span className={`text-[9px] font-mono font-semibold ${colorMap.text}`}>
        {displayVal}
      </span>
    </div>
  );
};
