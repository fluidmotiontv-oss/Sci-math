import React, { useState, useEffect } from 'react';
import { calculateNonaryTime } from '../utils/nonaryClock';
import { AppTheme, NonaryClockState } from '../types/dragon';
import { Clock, Zap, Shield, Sun, Moon } from 'lucide-react';

interface NonaryClockLabProps {
  theme?: AppTheme;
  onTriggerApexFeedback?: () => void;
}

export const NonaryClockLab: React.FC<NonaryClockLabProps> = ({
  theme = 'sovereign-dark',
  onTriggerApexFeedback,
}) => {
  const [timeState, setTimeState] = useState<NonaryClockState>(() => calculateNonaryTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeState(calculateNonaryTime());
    }, 250);
    return () => clearInterval(timer);
  }, []);

  // Dial rotation angles: 26.6667 total hours = 360 degrees
  const hourAngle = (timeState.dragonHour / 26.666667) * 360;
  // 54 minutes = 360 degrees
  const minuteAngle = (timeState.dragonMinute / 54) * 360;

  const dialPalette =
    theme === 'minimalist-lab'
      ? {
          discFill: '#ffffff',
          discStroke: '#cbd5e1',
          alphaArc: 'rgba(2, 132, 199, 0.35)',
          betaArc: 'rgba(192, 38, 211, 0.3)',
          apexStroke: '#d97706',
          majorTick: '#0284c7',
          labelText: '#334155',
          subTick: '#cbd5e1',
          innerRing: '#e2e8f0',
          hourHand: '#0284c7',
          minuteHand: '#d97706',
          hubStroke: '#ffffff',
        }
      : theme === 'high-contrast-cyber'
      ? {
          discFill: '#000000',
          discStroke: '#22d3ee',
          alphaArc: 'rgba(0, 240, 255, 0.45)',
          betaArc: 'rgba(240, 171, 252, 0.45)',
          apexStroke: '#fde047',
          majorTick: '#00f0ff',
          labelText: '#ffffff',
          subTick: '#155e75',
          innerRing: '#0891b2',
          hourHand: '#00f0ff',
          minuteHand: '#fde047',
          hubStroke: '#000000',
        }
      : {
          discFill: '#010409',
          discStroke: '#1e293b',
          alphaArc: 'rgba(56, 189, 248, 0.25)',
          betaArc: 'rgba(232, 121, 249, 0.25)',
          apexStroke: '#facc15',
          majorTick: '#38bdf8',
          labelText: '#94a3b8',
          subTick: '#334155',
          innerRing: '#0f172a',
          hourHand: '#38bdf8',
          minuteHand: '#facc15',
          hubStroke: '#0f172a',
        };

  return (
    <div className="flex flex-col gap-5 text-slate-100 cyber:text-white lab:text-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 tracking-wide flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
            Dragon 9 Nonary Timekeeper
          </h2>
          <p className="text-xs text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-0.5">
            54-minute hour cycle, 1,440-minute daily cycle divided into two 13.33-hour halves & Apex alignment windows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onTriggerApexFeedback && (
            <button
              type="button"
              onClick={onTriggerApexFeedback}
              className="px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 cyber:bg-black cyber:text-yellow-300 cyber:border-yellow-400 cyber:hover:bg-yellow-400 cyber:hover:text-black lab:bg-white lab:text-amber-800 lab:border-amber-400 lab:hover:bg-amber-50 font-mono text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Preview the screen-wide Apex transition glow and ripple effect"
            >
              <Zap className="w-3 h-3" />
              <span>Test Apex Ripple</span>
            </button>
          )}
          {timeState.isApexActive ? (
            <div className="px-3 py-1 rounded-full border border-amber-400 bg-amber-500/20 text-amber-300 cyber:bg-yellow-300 cyber:text-black cyber:border-white lab:bg-amber-50 lab:text-amber-800 lab:border-amber-400 font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 lab:shadow-none">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>APEX ALIGNMENT ACTIVE</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full border border-cyan-500/30 bg-slate-900 text-cyan-300 cyber:bg-black cyber:text-cyan-300 cyber:border-cyan-400 lab:bg-sky-50 lab:text-sky-800 lab:border-sky-300 font-mono text-xs flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
              <span>NOMINAL FLOW</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Clock Centerpiece: Dual Dial & Digital Readout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
        {/* SVG Nonary Radial Dial */}
        <div className="relative aspect-square max-w-[320px] mx-auto w-full flex items-center justify-center p-2">
          <svg viewBox="0 0 300 300" className="w-full h-full select-none">
            {/* Background disc */}
            <circle cx="150" cy="150" r="140" fill={dialPalette.discFill} stroke={dialPalette.discStroke} strokeWidth="2" />

            {/* Cycle Alpha Half Arc (0 to 180 deg) */}
            <path
              d="M 150 15 A 135 135 0 0 1 150 285"
              fill="none"
              stroke={dialPalette.alphaArc}
              strokeWidth="6"
            />
            {/* Cycle Beta Half Arc (180 to 360 deg) */}
            <path
              d="M 150 285 A 135 135 0 0 1 150 15"
              fill="none"
              stroke={dialPalette.betaArc}
              strokeWidth="6"
            />

            {/* Apex Alignment Highlight Zones (11:51 to 12:09 at bottom, 23:51 to 00:09 at top) */}
            {/* Apex Beta (Top) */}
            <path
              d="M 143 15 A 135 135 0 0 1 157 15"
              fill="none"
              stroke={dialPalette.apexStroke}
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Apex Alpha (Bottom) */}
            <path
              d="M 157 285 A 135 135 0 0 1 143 285"
              fill="none"
              stroke={dialPalette.apexStroke}
              strokeWidth="10"
              strokeLinecap="round"
            />

            {/* 9 Major Sectors & Ticks */}
            {Array.from({ length: 9 }).map((_, i) => {
              const deg = (i / 9) * 360 - 90;
              const rad = (deg * Math.PI) / 180;
              const x1 = 150 + Math.cos(rad) * 128;
              const y1 = 150 + Math.sin(rad) * 128;
              const x2 = 150 + Math.cos(rad) * 115;
              const y2 = 150 + Math.sin(rad) * 115;
              const tx = 150 + Math.cos(rad) * 102;
              const ty = 150 + Math.sin(rad) * 102;

              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={dialPalette.majorTick} strokeWidth="2.5" />
                  <text
                    x={tx}
                    y={ty + 4}
                    fill={dialPalette.labelText}
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    D{i === 0 ? 9 : i}
                  </text>
                </g>
              );
            })}

            {/* 27 Sub-divisions (3 per major sector) */}
            {Array.from({ length: 27 }).map((_, i) => {
              const deg = (i / 27) * 360 - 90;
              const rad = (deg * Math.PI) / 180;
              const x1 = 150 + Math.cos(rad) * 126;
              const y1 = 150 + Math.sin(rad) * 126;
              const x2 = 150 + Math.cos(rad) * 120;
              const y2 = 150 + Math.sin(rad) * 120;
              return <line key={`sub-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={dialPalette.subTick} strokeWidth="1" />;
            })}

            {/* Inner 54-Minute Ring */}
            <circle cx="150" cy="150" r="75" fill="none" stroke={dialPalette.innerRing} strokeWidth="2" strokeDasharray="2,4" />

            {/* Dragon Hour Hand */}
            <line
              x1="150"
              y1="150"
              x2={150 + Math.cos(((hourAngle - 90) * Math.PI) / 180) * 85}
              y2={150 + Math.sin(((hourAngle - 90) * Math.PI) / 180) * 85}
              stroke={dialPalette.hourHand}
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* 54-Minute Hand */}
            <line
              x1="150"
              y1="150"
              x2={150 + Math.cos(((minuteAngle - 90) * Math.PI) / 180) * 65}
              y2={150 + Math.sin(((minuteAngle - 90) * Math.PI) / 180) * 65}
              stroke={dialPalette.minuteHand}
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Center Pivot Hub */}
            <circle cx="150" cy="150" r="6" fill={dialPalette.minuteHand} stroke={dialPalette.hubStroke} strokeWidth="2" />
          </svg>
          <div className="absolute bottom-3 text-[10px] font-mono text-slate-500 cyber:text-zinc-300 lab:text-slate-600">
            26.66 D9 Hours / 1440 Solar Min
          </div>
        </div>

        {/* Digital Readout & Coordinates */}
        <div className="flex flex-col gap-3">
          {/* Main Dragon 9 Digital Time */}
          <div className="bg-slate-950 cyber:bg-black lab:bg-white border border-cyan-500/40 cyber:border-cyan-400 lab:border-sky-300 rounded-xl p-4 shadow-xl lab:shadow-xs">
            <div className="text-[11px] font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Dragon 9 Coordinate</span>
              <span className="text-cyan-400 cyber:text-cyan-300 lab:text-sky-700">54-Min Cycle</span>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-cyan-300 cyber:text-cyan-300 lab:text-sky-800 tracking-wider">
              {timeState.dragonHourDisplay}
            </div>
            <div className="text-xs font-mono text-slate-400 cyber:text-zinc-300 lab:text-slate-600 mt-1 flex items-center gap-3">
              <span>Solar: {timeState.solarTime}</span>
              <span className="text-slate-600 lab:text-slate-400">|</span>
              <span>{timeState.utcTime}</span>
            </div>
          </div>

          {/* Cycle Phase & Apex Window Card */}
          <div className="bg-slate-900/60 cyber:bg-black lab:bg-slate-50 border border-slate-800 cyber:border-cyan-400/60 lab:border-slate-200 rounded-xl p-3.5 space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 cyber:text-zinc-200 lab:text-slate-600 flex items-center gap-1.5">
                {timeState.currentCycle.includes('Alpha') ? (
                  <Sun className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-600" />
                ) : (
                  <Moon className="w-4 h-4 text-fuchsia-400 cyber:text-fuchsia-300 lab:text-fuchsia-600" />
                )}
                Active Cycle:
              </span>
              <span className="font-bold text-slate-200 cyber:text-white lab:text-slate-900">{timeState.currentCycle}</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200 pt-2">
              <span className="text-slate-400 cyber:text-zinc-200 lab:text-slate-600">Dragon Hour Index:</span>
              <span className="text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 font-bold">
                {timeState.dragonHour.toFixed(3)} / 26.666
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200 pt-2">
              <span className="text-slate-400 cyber:text-zinc-200 lab:text-slate-600">Harmonic Second (Cathie):</span>
              <span className="text-amber-300 cyber:text-yellow-300 lab:text-amber-700 font-bold">
                {timeState.harmonicSecond.toLocaleString()} / 97,200
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200 pt-2">
              <span className="text-slate-400 cyber:text-zinc-200 lab:text-slate-600">Apex Window Status:</span>
              <span className={timeState.isApexActive ? 'text-amber-300 cyber:text-yellow-300 lab:text-amber-700 font-bold' : 'text-slate-400 cyber:text-zinc-300 lab:text-slate-600'}>
                {timeState.isApexActive ? '⚡ ACTIVE ALIGNMENT' : `T - ${timeState.timeToNextApexMin} min`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Style Output Block */}
      <div className="bg-slate-950 cyber:bg-black lab:bg-slate-900 border border-cyan-500/30 cyber:border-cyan-400 lab:border-slate-700 rounded-xl p-4 font-mono text-xs text-cyan-300 leading-relaxed shadow-inner">
        <div className="text-slate-500 cyber:text-cyan-300 lab:text-slate-400 text-[11px] mb-2 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-700 pb-1">
          // DRAGON 9 NONARY TEMPORAL TELEMETRY
        </div>
        <div><span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-400">Current Time:</span> {timeState.solarTime}</div>
        <div><span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-400">Current Cycle:</span> {timeState.currentCycle}</div>
        <div><span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-400">Dragon 9 Hour Index:</span> {timeState.dragonHour.toFixed(2)} / 26.66</div>
        <div>
          <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-400">Apex Status:</span>{' '}
          {timeState.isApexActive ? (
            <span className="text-amber-400 font-bold">⚡ APEX ALIGNMENT PERIOD ACTIVE (11:51–12:09 & 23:51–00:09)</span>
          ) : (
            <span className="text-cyan-300">Normal Flow (Next Apex in {timeState.timeToNextApexMin} minutes)</span>
          )}
        </div>
        <div><span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-400">Tuning Reference:</span> 432 Hz Pythagorean Harmonic (Space-Time Resonance)</div>
      </div>
    </div>
  );
};

