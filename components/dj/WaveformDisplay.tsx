import React, { useRef, useEffect, useCallback } from 'react';

interface WaveformDisplayProps {
  deckId: 'L' | 'R';
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  bpm: number;
  onScrub: (seconds: number) => void;
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  deckId,
  audioBuffer,
  currentTime,
  duration,
  isPlaying,
  bpm,
  onScrub,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const primaryColor = deckId === 'L' ? '#00f2ff' : '#ff7700';
  const secondaryColor = deckId === 'L' ? '#0284c7' : '#ea580c';
  const beatGridColor = deckId === 'L' ? 'rgba(0, 242, 255, 0.25)' : 'rgba(255, 119, 0, 0.25)';

  // Draw scrolling waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#09090b');
    bgGrad.addColorStop(0.5, '#18181b');
    bgGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Center playhead line at 35% of width
    const playheadX = width * 0.35;
    const centerY = height / 2;

    // Center horizontal divider
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Seconds visible on screen (zoom window)
    const windowSeconds = 6.0;
    const pixelsPerSecond = width / windowSeconds;
    const startSec = currentTime - playheadX / pixelsPerSecond;
    const endSec = startSec + windowSeconds;

    // Draw beatgrid markers (every beat = 60 / bpm seconds)
    const secondsPerBeat = 60 / (bpm || 128);
    const firstBeatIndex = Math.floor(startSec / secondsPerBeat);
    const lastBeatIndex = Math.ceil(endSec / secondsPerBeat);

    ctx.strokeStyle = beatGridColor;
    ctx.lineWidth = 1;
    for (let b = firstBeatIndex; b <= lastBeatIndex; b++) {
      const beatTime = b * secondsPerBeat;
      const x = playheadX + (beatTime - currentTime) * pixelsPerSecond;
      if (x >= 0 && x <= width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Downbeat (every 4 beats) bold marker
        if (b % 4 === 0) {
          ctx.fillStyle = primaryColor;
          ctx.fillRect(x - 1, 0, 2, 4);
          ctx.fillRect(x - 1, height - 4, 2, 4);
        }
      }
    }

    // Draw audio peaks
    if (audioBuffer) {
      const rawData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const step = 2; // draw every 2px

      ctx.fillStyle = primaryColor;
      for (let px = 0; px < width; px += step) {
        const timeAtPx = currentTime + (px - playheadX) / pixelsPerSecond;
        if (timeAtPx < 0 || timeAtPx > duration) continue;

        // Loop wrapping if audio is looping
        const wrappedTime = timeAtPx % duration;
        const sampleIdx = Math.floor(wrappedTime * sampleRate);

        if (sampleIdx >= 0 && sampleIdx < rawData.length) {
          const val = Math.abs(rawData[sampleIdx]);
          const barHeight = Math.min(centerY - 2, val * (centerY * 1.5));

          // Multi-color frequency layers
          ctx.fillStyle = val > 0.6 ? '#ffffff' : val > 0.3 ? primaryColor : secondaryColor;
          ctx.fillRect(px, centerY - barHeight, step - 0.5, barHeight * 2);
        }
      }
    } else {
      // Synthetic placeholder waveform
      ctx.fillStyle = primaryColor;
      for (let px = 0; px < width; px += 3) {
        const t = (px + currentTime * 50) * 0.05;
        const val = Math.sin(t) * 0.4 + Math.cos(t * 2.3) * 0.3;
        const h = Math.abs(val) * (centerY * 0.8);
        ctx.fillRect(px, centerY - h, 2, h * 2);
      }
    }

    // Draw Playhead Line (Illuminated cursor)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Small red playhead pointer triangle at top
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(playheadX - 5, 0);
    ctx.lineTo(playheadX + 5, 0);
    ctx.lineTo(playheadX, 8);
    ctx.closePath();
    ctx.fill();
  }, [audioBuffer, currentTime, duration, bpm, primaryColor, secondaryColor, beatGridColor]);

  // Scrub handler
  const handleScrubClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = clickX / rect.width;
      if (duration > 0) {
        onScrub(ratio * duration);
      }
    },
    [duration, onScrub]
  );

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const remainTime = Math.max(0, duration - currentTime);

  return (
    <div className="w-full bg-zinc-950 rounded-lg p-2 border border-zinc-800 shadow-inner flex flex-col gap-1 select-none">
      {/* Time & BPM Header */}
      <div className="flex items-center justify-between text-xs font-mono px-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-[10px]">ELAPSED:</span>
          <span className={`font-bold ${deckId === 'L' ? 'text-cyan-400' : 'text-orange-400'}`}>
            {formatTime(currentTime)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-[10px]">REMAIN:</span>
          <span className="text-gray-300 font-bold">-{formatTime(remainTime)}</span>
        </div>
      </div>

      {/* Main Scrolling Dynamic Waveform Canvas */}
      <div
        ref={containerRef}
        onClick={handleScrubClick}
        className="relative w-full h-20 rounded overflow-hidden cursor-ew-resize border border-zinc-800/80 bg-zinc-950"
      >
        <canvas ref={canvasRef} width={640} height={80} className="w-full h-full block" />
      </div>

      {/* Full Track Progress Bar / Overview Scrubber */}
      <div
        onClick={handleScrubClick}
        className="relative w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden cursor-pointer border border-zinc-800"
      >
        <div
          className={`h-full transition-all duration-75 ${
            deckId === 'L' ? 'bg-cyan-500 shadow-[0_0_8px_#00f2ff]' : 'bg-orange-500 shadow-[0_0_8px_#ff7700]'
          }`}
          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
};
