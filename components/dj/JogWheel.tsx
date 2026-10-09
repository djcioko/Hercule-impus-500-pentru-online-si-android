import React, { useRef, useState, useEffect } from 'react';

interface JogWheelProps {
  deckId: 'L' | 'R';
  isPlaying: boolean;
  bpm: number;
  pitchPercent: number;
  onScratch?: (deltaSec: number) => void;
}

export const JogWheel: React.FC<JogWheelProps> = ({
  deckId,
  isPlaying,
  bpm,
  pitchPercent,
  onScratch,
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const isScratching = useRef(false);
  const lastAngle = useRef(0);

  const themeColor = deckId === 'L' ? '#00f2ff' : '#ff7700';
  const glowShadow = deckId === 'L' ? '0 0 25px rgba(0, 242, 255, 0.3)' : '0 0 25px rgba(255, 119, 0, 0.3)';

  // Spin wheel continuously when playing
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let prev = performance.now();

    const speedMultiplier = 1.0 + pitchPercent / 100;
    // Standard vinyl 33.3 RPM = approx 200 deg/sec
    const degPerSec = 200 * speedMultiplier;

    const loop = (now: number) => {
      const delta = (now - prev) / 1000;
      prev = now;
      if (!isScratching.current) {
        setRotation(r => (r + degPerSec * delta) % 360);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, pitchPercent]);

  // Handle Scratching / Jog Nudge drag
  const getAngle = (clientX: number, clientY: number) => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rad = Math.atan2(clientY - cy, clientX - cx);
    return (rad * 180) / Math.PI;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isScratching.current = true;
    lastAngle.current = getAngle(e.clientX, e.clientY);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isScratching.current) return;
    const currentAngle = getAngle(e.clientX, e.clientY);
    let deltaAngle = currentAngle - lastAngle.current;

    // Handle wrapping around +/-180
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    lastAngle.current = currentAngle;
    setRotation(r => (r + deltaAngle) % 360);

    if (onScratch) {
      // 360 deg = approx 1.8 seconds of audio
      const deltaSec = (deltaAngle / 360) * 1.8;
      onScratch(deltaSec);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isScratching.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col items-center justify-center select-none my-2">
      <div
        ref={wheelRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-44 h-44 md:w-48 md:h-48 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center p-2.5 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-950 border-4 border-zinc-700 shadow-2xl transition-shadow"
        style={{ boxShadow: isPlaying ? glowShadow : '0 10px 25px rgba(0,0,0,0.8)' }}
      >
        {/* Outer Strobe Rim Marks */}
        <div
          className="absolute inset-1 rounded-full border border-dashed border-zinc-600/60 pointer-events-none"
          style={{ transform: `rotate(${rotation}deg)` }}
        />

        {/* Concentric Vinyl Grooves */}
        <div
          className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden bg-neutral-900 shadow-inner"
          style={{
            backgroundImage: `repeating-radial-gradient(circle at center, #18181b 0, #18181b 2px, #09090b 3px, #09090b 4px)`,
          }}
        >
          {/* Rotating Platter Marker / Needle */}
          <div
            className="absolute inset-0 flex items-start justify-center pointer-events-none"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div
              className="w-1.5 h-10 mt-1 rounded-full shadow-lg"
              style={{ backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}` }}
            />
          </div>

          {/* Center Digital LCD Hub (Non-rotating or rotating with artwork) */}
          <div className="relative w-24 h-24 rounded-full bg-zinc-950 border-2 border-zinc-700 shadow-2xl flex flex-col items-center justify-center pointer-events-none z-10">
            {/* Center LED Ring */}
            <div
              className="absolute inset-0 rounded-full border-2 opacity-60 animate-pulse"
              style={{ borderColor: themeColor }}
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              DECK {deckId}
            </span>
            <span className={`text-base font-extrabold font-mono tracking-tight ${deckId === 'L' ? 'text-cyan-400' : 'text-orange-400'}`}>
              {(bpm * (1 + pitchPercent / 100)).toFixed(1)}
            </span>
            <span className="text-[9px] font-mono text-zinc-400 uppercase">
              BPM
            </span>
            <div className="mt-0.5 text-[8px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-300">
              {pitchPercent > 0 ? `+${pitchPercent.toFixed(1)}%` : `${pitchPercent.toFixed(1)}%`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
