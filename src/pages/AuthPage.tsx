import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Layers, LogIn, UserPlus, ShieldCheck, Zap } from 'lucide-react';
import { ThunderCanvas } from '../components/ui/ThunderCanvas';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRegister = location.pathname.includes('register');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Interactive Thunder Radiations Canvas */}
      <ThunderCanvas />

      <div className="relative z-10 w-full max-w-md electric-card rounded-3xl p-8 shadow-2xl space-y-6 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 animate-thunder-pulse">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-xl text-slate-100 tracking-tight flex items-center gap-1">
              <span>SyncSpace</span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 -mt-1">Authentication Portal</span>
          </div>
        </div>

        {/* Header Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-100 flex items-center justify-center gap-2">
            {isRegister ? <UserPlus className="w-6 h-6 text-cyan-400" /> : <LogIn className="w-6 h-6 text-cyan-400" />}
            <span>{isRegister ? 'Create an Account' : 'Welcome Back'}</span>
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Authentication & user login service coming soon...
          </p>
        </div>

        {/* Info Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-left space-y-2">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Frontend Dashboard Mode Active</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The dashboard UI is currently running in guest prototype mode. Full authentication will connect to JWT & OAuth services in the next backend integration phase.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button
            variant="thunder"
            size="lg"
            className="w-full"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            {isRegister ? (
              <>
                <span>Already have an account?</span>
                <button
                  onClick={() => navigate('/login')}
                  className="text-cyan-400 font-semibold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                <span>Don't have an account?</span>
                <button
                  onClick={() => navigate('/register')}
                  className="text-cyan-400 font-semibold hover:underline cursor-pointer"
                >
                  Register Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
