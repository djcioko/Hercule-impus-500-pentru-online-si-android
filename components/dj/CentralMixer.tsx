import React from 'react';
import { DeckState, MixerState } from '../../types/dj';
import { RotaryKnob } from './RotaryKnob';
import { VuMeter } from './VuMeter';
import { Headphones, Activity, Sliders } from 'lucide-react';

interface CentralMixerProps {
  deckL: DeckState;
  deckR: DeckState;
  mixer: MixerState;
  peakL: number;
  peakR: number;
  onDeckGainChange: (deckId: 'L' | 'R', val: number) => void;
  onDeckEQChange: (
    deckId: 'L' | 'R',
    band: 'high' | 'mid' | 'low',
    val: number
  ) => void;
  onDeckEQKillToggle: (deckId: 'L' | 'R', band: 'high' | 'mid' | 'low') => void;
  onDeckFilterChange: (deckId: 'L' | 'R', val: number) => void;
  onDeckVolumeChange: (deckId: 'L' | 'R', val: number) => void;
  onDeckCueMonitorToggle: (deckId: 'L' | 'R') => void;
  onCrossfaderChange: (val: number) => void;
  onCrossfaderCurveToggle: () => void;
  onFxChange: (key: keyof MixerState, val: unknown) => void;
}

export const CentralMixer: React.FC<CentralMixerProps> = ({
  deckL,
  deckR,
  mixer,
  peakL,
  peakR,
  onDeckGainChange,
  onDeckEQChange,
  onDeckEQKillToggle,
  onDeckFilterChange,
  onDeckVolumeChange,
  onDeckCueMonitorToggle,
  onCrossfaderChange,
  onCrossfaderCurveToggle,
  onFxChange,
}) => {
  return (
    <div className="w-full lg:w-[380px] bg-zinc-950/95 border-2 border-zinc-800 rounded-xl p-3 flex flex-col gap-3 shadow-2xl backdrop-blur select-none">
      {/* Mixer Header & Master FX Unit */}
      <div className="bg-zinc-900/90 rounded-lg p-2 border border-zinc-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
            <Activity size={12} /> BEAT FX RACK
          </span>

          <button
            onClick={() => onFxChange('fxActive', !mixer.fxActive)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider transition-all border ${
              mixer.fxActive
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.7)]'
                : 'bg-zinc-800 text-gray-400 border-zinc-700 hover:text-white'
            }`}
          >
            {mixer.fxActive ? 'FX ON' : 'FX OFF'}
          </button>
        </div>

        {/* FX Type Tabs & Parameter Knobs */}
        <div className="flex items-center justify-between gap-2">
          {/* FX Type Selector */}
          <div className="grid grid-cols-2 gap-1 flex-1">
            {(['echo', 'filter', 'reverb', 'flanger'] as const).map(type => (
              <button
                key={type}
                onClick={() => onFxChange('fxType', type)}
                className={`py-1 text-[9px] font-mono uppercase font-bold rounded transition-colors ${
                  mixer.fxType === type
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-zinc-800/80 text-gray-400 hover:bg-zinc-800 hover:text-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Wet/Dry & Param Knobs */}
          <div className="flex items-center gap-2">
            <RotaryKnob
              label="WET/DRY"
              value={mixer.fxWet}
              min={0}
              max={1}
              step={0.01}
              unit="%"
              color="purple"
              size="sm"
              onChange={val => onFxChange('fxWet', val)}
            />
            <RotaryKnob
              label="PARAM"
              value={mixer.fxParam}
              min={0}
              max={1}
              step={0.01}
              unit="%"
              color="purple"
              size="sm"
              onChange={val => onFxChange('fxParam', val)}
            />
          </div>
        </div>
      </div>

      {/* Dual Channel Strips: CH 1 (Deck L) & CH 2 (Deck R) */}
      <div className="grid grid-cols-2 gap-3 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-850">
        {/* --- CHANNEL 1 (DECK L) --- */}
        <div className="flex flex-col items-center gap-2 border-r border-zinc-800/80 pr-2">
          <div className="text-[11px] font-black font-mono text-cyan-400 flex items-center gap-1">
            CH 1 <span className="text-[9px] text-zinc-500">(DECK L)</span>
          </div>

          {/* GAIN */}
          <RotaryKnob
            label="GAIN"
            value={deckL.gain}
            min={0}
            max={2}
            defaultValue={1}
            step={0.05}
            unit="dB"
            color="cyan"
            size="sm"
            onChange={val => onDeckGainChange('L', val)}
          />

          {/* HIGH EQ + Kill */}
          <div className="flex items-center gap-1">
            <RotaryKnob
              label="HIGH"
              value={deckL.eqHigh}
              min={-26}
              max={6}
              defaultValue={0}
              step={0.5}
              unit="dB"
              bipolar
              color="cyan"
              size="sm"
              onChange={val => onDeckEQChange('L', 'high', val)}
            />
            <button
              onClick={() => onDeckEQKillToggle('L', 'high')}
              className={`text-[8px] font-mono px-1 py-0.5 rounded border transition-colors ${
                deckL.eqHighKill
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
              }`}
              title="Kill High frequencies"
            >
              KILL
            </button>
          </div>

          {/* MID EQ + Kill */}
          <div className="flex items-center gap-1">
            <RotaryKnob
              label="MID"
              value={deckL.eqMid}
              min={-26}
              max={6}
              defaultValue={0}
              step={0.5}
              unit="dB"
              bipolar
              color="cyan"
              size="sm"
              onChange={val => onDeckEQChange('L', 'mid', val)}
            />
            <button
              onClick={() => onDeckEQKillToggle('L', 'mid')}
              className={`text-[8px] font-mono px-1 py-0.5 rounded border transition-colors ${
                deckL.eqMidKill
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
              }`}
              title="Kill Mid frequencies"
            >
              KILL
            </button>
          </div>

          {/* LOW EQ + Kill */}
          <div className="flex items-center gap-1">
            <RotaryKnob
              label="LOW"
              value={deckL.eqLow}
              min={-26}
              max={6}
              defaultValue={0}
              step={0.5}
              unit="dB"
              bipolar
              color="cyan"
              size="sm"
              onChange={val => onDeckEQChange('L', 'low', val)}
            />
            <button
              onClick={() => onDeckEQKillToggle('L', 'low')}
              className={`text-[8px] font-mono px-1 py-0.5 rounded border transition-colors ${
                deckL.eqLowKill
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
              }`}
              title="Kill Low frequencies"
            >
              KILL
            </button>
          </div>

          {/* COLOR FILTER */}
          <RotaryKnob
            label="COLOR FILTER"
            value={deckL.filter}
            min={-1}
            max={1}
            defaultValue={0}
            step={0.02}
            bipolar
            color="cyan"
            size="md"
            onChange={val => onDeckFilterChange('L', val)}
          />

          {/* Headphone CUE */}
          <button
            onClick={() => onDeckCueMonitorToggle('L')}
            className={`px-3 py-1 rounded text-[10px] font-mono flex items-center gap-1 border transition-colors ${
              deckL.cueMonitor
                ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-[0_0_8px_#f59e0b]'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
            }`}
          >
            <Headphones size={12} /> CUE
          </button>

          {/* Fader & Channel VU Meter */}
          <div className="flex items-center gap-2 mt-1">
            <VuMeter level={peakL} height={100} />
            <div className="relative h-28 flex items-center justify-center">
              <input
                type="range"
                min="0"
                max="1.2"
                step="0.01"
                value={deckL.volume}
                onChange={e => onDeckVolumeChange('L', parseFloat(e.target.value))}
                className="h-28 -rotate-90 origin-center cursor-pointer appearance-none bg-zinc-800 rounded w-24 accent-cyan-400"
                style={{ width: '100px' }}
              />
            </div>
          </div>
        </div>

        {/* --- CHANNEL 2 (DECK R) --- */}
        <div className="flex flex-col items-center gap-2 pl-2">
          <div className="text-[11px] font-black font-mono text-orange-400 flex items-center gap-1">
            CH 2 <span className="text-[9px] text-zinc-500">(DECK R)</span>
          </div>

          {/* GAIN */}
          <RotaryKnob
            label="GAIN"
            value={deckR.gain}
            min={0}
            max={2}
            defaultValue={1}
            step={0.05}
            unit="dB"
            color="orange"
            size="sm"
            onChange={val => onDeckGainChange('R', val)}
          />

          {/* HIGH EQ + Kill */}
          <div className="flex items-center gap-1">
            <RotaryKnob
              label="HIGH"
              value={deckR.eqHigh}
              min={-26}
              max={6}
              defaultValue={0}
              step={0.5}
              unit="dB"
              bipolar
              color="orange"
              size="sm"
              onChange={val => onDeckEQChange('R', 'high', val)}
            />
            <button
              onClick={() => onDeckEQKillToggle('R', 'high')}
              className={`text-[8px] font-mono px-1 py-0.5 rounded border transition-colors ${
                deckR.eqHighKill
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
              }`}
              title="Kill High frequencies"
            >
              KILL
            </button>
          </div>

          {/* MID EQ + Kill */}
          <div className="flex items-center gap-1">
            <RotaryKnob
              label="MID"
              value={deckR.eqMid}
              min={-26}
              max={6}
              defaultValue={0}
              step={0.5}
              unit="dB"
              bipolar
              color="orange"
              size="sm"
              onChange={val => onDeckEQChange('R', 'mid', val)}
            />
            <button
              onClick={() => onDeckEQKillToggle('R', 'mid')}
              className={`text-[8px] font-mono px-1 py-0.5 rounded border transition-colors ${
                deckR.eqMidKill
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
              }`}
              title="Kill Mid frequencies"
            >
              KILL
            </button>
          </div>

          {/* LOW EQ + Kill */}
          <div className="flex items-center gap-1">
            <RotaryKnob
              label="LOW"
              value={deckR.eqLow}
              min={-26}
              max={6}
              defaultValue={0}
              step={0.5}
              unit="dB"
              bipolar
              color="orange"
              size="sm"
              onChange={val => onDeckEQChange('R', 'low', val)}
            />
            <button
              onClick={() => onDeckEQKillToggle('R', 'low')}
              className={`text-[8px] font-mono px-1 py-0.5 rounded border transition-colors ${
                deckR.eqLowKill
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
              }`}
              title="Kill Low frequencies"
            >
              KILL
            </button>
          </div>

          {/* COLOR FILTER */}
          <RotaryKnob
            label="COLOR FILTER"
            value={deckR.filter}
            min={-1}
            max={1}
            defaultValue={0}
            step={0.02}
            bipolar
            color="orange"
            size="md"
            onChange={val => onDeckFilterChange('R', val)}
          />

          {/* Headphone CUE */}
          <button
            onClick={() => onDeckCueMonitorToggle('R')}
            className={`px-3 py-1 rounded text-[10px] font-mono flex items-center gap-1 border transition-colors ${
              deckR.cueMonitor
                ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-[0_0_8px_#f59e0b]'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
            }`}
          >
            <Headphones size={12} /> CUE
          </button>

          {/* Fader & Channel VU Meter */}
          <div className="flex items-center gap-2 mt-1">
            <div className="relative h-28 flex items-center justify-center">
              <input
                type="range"
                min="0"
                max="1.2"
                step="0.01"
                value={deckR.volume}
                onChange={e => onDeckVolumeChange('R', parseFloat(e.target.value))}
                className="h-28 -rotate-90 origin-center cursor-pointer appearance-none bg-zinc-800 rounded w-24 accent-orange-400"
                style={{ width: '100px' }}
              />
            </div>
            <VuMeter level={peakR} height={100} />
          </div>
        </div>
      </div>

      {/* --- CROSSFADER SECTION --- */}
      <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
          <span className="text-cyan-400 font-bold">DECK A (L)</span>
          <div className="flex items-center gap-1">
            <span className="text-gray-500 uppercase text-[9px]">Curve:</span>
            <button
              onClick={onCrossfaderCurveToggle}
              className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-[9px] uppercase border border-zinc-700"
            >
              {mixer.crossfaderCurve}
            </button>
          </div>
          <span className="text-orange-400 font-bold">DECK B (R)</span>
        </div>

        {/* Crossfader Horizontal Slider with Cut Buttons */}
        <div className="flex items-center gap-2">
          {/* Instant Cut Left Button */}
          <button
            onClick={() => onCrossfaderChange(-1)}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 active:bg-cyan-600 text-xs font-mono font-bold text-cyan-300 rounded border border-zinc-700"
            title="Snap Crossfader to Deck L"
          >
            CUT L
          </button>

          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="-1"
              max="1"
              step="0.02"
              value={mixer.crossfader}
              onChange={e => onCrossfaderChange(parseFloat(e.target.value))}
              className="w-full h-3 cursor-pointer appearance-none bg-zinc-950 rounded-full border border-zinc-700 accent-purple-500"
            />
            {/* Center tick */}
            <div className="absolute left-1/2 -translate-x-1/2 w-1 h-4 bg-gray-500 pointer-events-none rounded-xs" />
          </div>

          {/* Instant Cut Right Button */}
          <button
            onClick={() => onCrossfaderChange(1)}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 active:bg-orange-600 text-xs font-mono font-bold text-orange-300 rounded border border-zinc-700"
            title="Snap Crossfader to Deck R"
          >
            CUT R
          </button>
        </div>

        {/* Reset to Center Button */}
        <div className="flex justify-center">
          <button
            onClick={() => onCrossfaderChange(0)}
            className="text-[9px] font-mono text-zinc-400 hover:text-zinc-200"
          >
            [ Center Crossfader ]
          </button>
        </div>
      </div>
    </div>
  );
};
