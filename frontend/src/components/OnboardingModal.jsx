import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, LogIn, LayoutGrid, HelpCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SEEN_KEY = 'syncspace-onboarded';

/**
 * First-time-user welcome. Shown once per browser (dismissible), only to
 * authenticated users, so it never appears on the public login/register
 * screens.
 */
export function OnboardingModal() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !window.localStorage.getItem(SEEN_KEY)) {
      setOpen(true);
    }
  }, [isAuthenticated]);

  const dismiss = () => {
    window.localStorage.setItem(SEEN_KEY, '1');
    setOpen(false);
  };

  const go = (path) => {
    dismiss();
    navigate(path);
  };

  if (!open) return null;

  const canCreate = role === 'interviewer' || role === 'admin';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-950 border border-cyan-500/30 rounded-3xl shadow-2xl p-7">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-xl font-bold text-slate-100">Welcome to SyncSpace</h2>
          <button className="text-slate-500 hover:text-slate-300" onClick={dismiss} aria-label="Dismiss">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-400 text-sm mb-6">What would you like to do first?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {canCreate && (
            <button
              className="flex items-center gap-3 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl px-4 py-3.5 text-left transition-colors"
              onClick={() => go('/interviews/create')}
            >
              <Video className="w-5 h-5 text-cyan-400 shrink-0" />
              <span className="text-sm text-slate-200 font-medium">Create an Interview</span>
            </button>
          )}
          <button
            className="flex items-center gap-3 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl px-4 py-3.5 text-left transition-colors"
            onClick={() => go('/interviews/join')}
          >
            <LogIn className="w-5 h-5 text-cyan-400 shrink-0" />
            <span className="text-sm text-slate-200 font-medium">Join an Interview</span>
          </button>
          <button
            className="flex items-center gap-3 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl px-4 py-3.5 text-left transition-colors"
            onClick={() => go('/workspaces')}
          >
            <LayoutGrid className="w-5 h-5 text-cyan-400 shrink-0" />
            <span className="text-sm text-slate-200 font-medium">Open a Workspace</span>
          </button>
          <button
            className="flex items-center gap-3 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl px-4 py-3.5 text-left transition-colors"
            onClick={dismiss}
          >
            <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0" />
            <span className="text-sm text-slate-200 font-medium">Learn how SyncSpace works</span>
          </button>
        </div>

        <button className="w-full text-center text-slate-500 hover:text-slate-300 text-xs mt-6" onClick={dismiss}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

export default OnboardingModal;
