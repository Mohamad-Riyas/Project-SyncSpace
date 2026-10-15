import { Clock } from 'lucide-react';

/**
 * Formats seconds into HH:MM:SS display.
 */
function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * InterviewTimer — displays elapsed time with a pulsing indicator when running.
 */
export function InterviewTimer({ elapsedSeconds = 0, isRunning = false, mode = 'up' }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
      <Clock className="w-4 h-4 text-cyan-400" />
      {isRunning && (
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
      )}
      <span className="font-mono text-sm font-semibold text-slate-100 tracking-wider">
        {formatTime(elapsedSeconds)}
      </span>
      {mode === 'down' && (
        <span className="text-[10px] uppercase tracking-wider text-slate-500">left</span>
      )}
    </div>
  );
}

export default InterviewTimer;
