import React from 'react';
import { Plus, UserPlus, Zap, Flame, Radio } from 'lucide-react';
import { Button } from '../ui/Button';

interface WelcomeSectionProps {
  onCreateWorkspace: () => void;
  onJoinWorkspace: () => void;
  readOnly?: boolean;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  onCreateWorkspace,
  onJoinWorkspace,
  readOnly = false,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-950/80 border border-cyan-500/30 p-6 sm:p-10 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl group">
      {/* Background Animated Thunder Radiation Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-thunder-pulse" />
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Radiating Electric Arc Beams */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="space-y-3 max-w-2xl">
          {/* Thunder Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold tracking-wide shadow-md shadow-cyan-950">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>SyncSpace Thunder Platform</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>

          {/* Radiating Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight flex flex-wrap items-center gap-3">
            <span>Welcome to</span>
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">
              SyncSpace
            </span>
            <Zap className="w-8 h-8 text-cyan-400 animate-bounce hidden sm:inline-block" />
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Explore focused collaboration rooms for code editing, visual planning, and real-time team work.
          </p>

          {/* Live Status Indicators */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 pt-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Real-Time Yjs Sync</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Low-Latency WebSockets</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Button variant="thunder" size="lg" icon={<Plus className="w-5 h-5" />} onClick={onCreateWorkspace}>
              Create Workspace
            </Button>
            <Button variant="secondary" size="lg" icon={<UserPlus className="w-5 h-5 text-cyan-400" />} onClick={onJoinWorkspace}>
              Join Workspace
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
