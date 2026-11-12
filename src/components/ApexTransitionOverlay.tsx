import React from 'react';
import { Zap } from 'lucide-react';
import { AppTheme } from '../types/dragon';

export interface ApexFeedbackBurst {
  id: number;
  windowName: string;
  isSimulated?: boolean;
}

interface ApexTransitionOverlayProps {
  activeBurst: ApexFeedbackBurst | null;
  isApexActive: boolean;
  theme: AppTheme;
}

export const ApexTransitionOverlay: React.FC<ApexTransitionOverlayProps> = ({
  activeBurst,
  isApexActive,
  theme,
}) => {
  const isLab = theme === 'minimalist-lab';
  const isCyber = theme === 'high-contrast-cyber';

  const glowStyle: React.CSSProperties = isLab
    ? {
        background:
          'radial-gradient(circle at 50% 50%, rgba(2, 132, 199, 0.08) 0%, rgba(217, 119, 6, 0.14) 55%, rgba(217, 119, 6, 0.24) 100%)',
        boxShadow: 'inset 0 0 90px rgba(217, 119, 6, 0.25)',
      }
    : isCyber
    ? {
        background:
          'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.1) 0%, rgba(250, 204, 21, 0.16) 60%, rgba(0, 240, 255, 0.28) 100%)',
        boxShadow: 'inset 0 0 110px rgba(253, 224, 71, 0.32)',
      }
    : {
        background:
          'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08) 0%, rgba(250, 204, 21, 0.14) 58%, rgba(250, 204, 21, 0.24) 100%)',
        boxShadow: 'inset 0 0 100px rgba(250, 204, 21, 0.22)',
      };

  return (
    <div
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden"
      aria-live="polite"
    >
      {/* Subtle sustained ambient edge aura while live clock sits inside an 18-min Apex window */}
      {isApexActive && !activeBurst && (
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            boxShadow: isLab
              ? 'inset 0 0 42px rgba(217, 119, 6, 0.14)'
              : 'inset 0 0 48px rgba(250, 204, 21, 0.16)',
          }}
        />
      )}

      {/* Keyed burst effect triggered cleanly on each Apex transition */}
      {activeBurst && (
        <div key={activeBurst.id} className="absolute inset-0">
          {/* Screen-wide faint harmonic glow pulse */}
          <div className="absolute inset-0 animate-apex-glow" style={glowStyle} />

          {/* Dual expanding concentric harmonic ripples */}
          <div
            className="absolute top-1/2 left-1/2 w-[55vmax] h-[55vmax] rounded-full border-2 border-amber-400/60 cyber:border-yellow-300/80 lab:border-amber-600/55 animate-apex-ripple-1"
            style={{
              boxShadow: isLab
                ? '0 0 28px rgba(217, 119, 6, 0.22)'
                : '0 0 36px rgba(250, 204, 21, 0.35)',
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-[55vmax] h-[55vmax] rounded-full border border-cyan-400/55 cyber:border-cyan-300/80 lab:border-sky-600/50 animate-apex-ripple-2"
            style={{
              boxShadow: isLab
                ? '0 0 24px rgba(2, 132, 199, 0.2)'
                : '0 0 32px rgba(56, 189, 248, 0.32)',
            }}
          />

          {/* Compact Apex Transition Banner */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 animate-apex-banner">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/70 bg-slate-950/90 text-amber-200 cyber:bg-black cyber:border-yellow-300 cyber:text-yellow-300 lab:bg-white/95 lab:border-amber-500 lab:text-amber-800 shadow-2xl text-xs font-mono whitespace-nowrap">
              <Zap className="w-3.5 h-3.5 text-amber-400 cyber:text-yellow-300 lab:text-amber-600 fill-current shrink-0" />
              <span className="font-bold tracking-wide uppercase">
                {activeBurst.isSimulated ? 'APEX TRANSITION PREVIEW' : 'APEX PORTAL TRANSITION'}
              </span>
              <span className="text-slate-500 lab:text-slate-400">·</span>
              <span className="text-cyan-300 cyber:text-cyan-300 lab:text-sky-700 font-semibold">
                {activeBurst.windowName}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
