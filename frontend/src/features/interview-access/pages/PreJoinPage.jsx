import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, AlertCircle, Loader2, ArrowLeft, Wifi } from 'lucide-react';
import { interviewsApi } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import { useMicrophoneCheck } from '../hooks/useMicrophoneCheck';
import { Button } from '../../../components/ui/Button';

export function PreJoinPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, status } = useAuth();
  const mic = useMicrophoneCheck();

  const [interview, setInterview] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;
    interviewsApi
      .getByCode(code)
      .then(({ interview: iv }) => {
        if (!cancelled) setInterview(iv);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'This interview could not be found.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code, status]);

  const handleJoinAsGuest = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setJoining(true);
    setJoinError('');
    try {
      const { token, guest, interview: joined } = await interviewsApi.joinAsGuest(code, guestName.trim());
      mic.stop();
      const { saveGuestSession } = await import('../../../api/client');
      saveGuestSession({ token, guest: true, name: guest.name, interviewId: guest.interviewId });
      navigate(`/interview/${joined.id}`, { replace: true });
    } catch (err) {
      setJoinError(err.message || 'Could not join as guest.');
    } finally {
      setJoining(false);
    }
  };

  const handleJoinAsAuthenticated = async () => {
    setJoining(true);
    setJoinError('');
    try {
      const { interview: joined, guest, guestAccess } = await interviewsApi.join(code);
      mic.stop();

      if (guestAccess && guest?.token) {
        const { saveGuestSession } = await import('../../../api/client');
        saveGuestSession({ token: guest.token, guest: true, name: guest.name, interviewId: guest.interviewId });
      }

      navigate(`/interview/${joined.id}`, { replace: true });
    } catch (err) {
      setJoinError(err.message || 'Could not join the interview.');
    } finally {
      setJoining(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Checking interview…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100 px-6">
        <div className="max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-4" />
          <h1 className="text-lg font-semibold mb-2">Can't join this interview</h1>
          <p className="text-slate-400 text-sm mb-6">{loadError}</p>
          <Button variant="outline" onClick={() => navigate('/interviews/join')}>Try a different code</Button>
        </div>
      </div>
    );
  }

  if (showGuestForm || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-6" onClick={() => navigate('/interviews')}>
            <ArrowLeft className="w-4 h-4" /> Cancel
          </button>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
            <h1 className="text-xl font-bold mb-1">{interview.title}</h1>
            {interview.interviewer?.name && (
              <p className="text-slate-400 text-sm mb-6">Interviewer: {interview.interviewer.name}</p>
            )}

            <form onSubmit={handleJoinAsGuest} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Your Name</label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-500/50"
                  placeholder="Enter your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>

              {joinError && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4" /> {joinError}
                </div>
              )}

              <Button variant="primary" className="w-full" type="submit" disabled={joining || !guestName.trim()}>
                {joining ? 'Joining…' : 'Join as Guest'}
              </Button>
            </form>

            {isAuthenticated && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-3">Or join with your account:</p>
                <Button variant="outline" className="w-full" onClick={handleJoinAsAuthenticated} disabled={joining}>
                  Join as {user?.name}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-lg">
        <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-6" onClick={() => navigate('/interviews')}>
          <ArrowLeft className="w-4 h-4" /> Cancel
        </button>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
          <h1 className="text-xl font-bold mb-1">{interview.title}</h1>
          {interview.interviewer?.name && (
            <p className="text-slate-400 text-sm mb-6">Interviewer: {interview.interviewer.name}</p>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Wifi className="w-4 h-4 text-emerald-400" /> Connection
              </div>
              <span className="text-xs text-emerald-400">Ready</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  {mic.permission === 'granted' ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-slate-500" />}
                  Microphone
                </div>
                {mic.permission !== 'granted' ? (
                  <Button size="sm" variant="outline" onClick={mic.start}>Test microphone</Button>
                ) : (
                  <span className="text-xs text-emerald-400">Working</span>
                )}
              </div>
              {mic.permission === 'granted' && (
                <div className="mt-3 h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${Math.max(4, mic.level * 100)}%` }}
                  />
                </div>
              )}
              {mic.error && <p className="text-xs text-rose-400 mt-2">{mic.error}</p>}
            </div>

            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-300">
              <span>Joining as</span>
              <span className="font-medium text-slate-100">{user?.name} ({user?.email})</span>
            </div>
          </div>

          {joinError && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4" /> {joinError}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="primary" className="flex-1" onClick={handleJoinAsAuthenticated} disabled={joining}>
              {joining ? 'Joining…' : 'Join Interview'}
            </Button>
            <Button variant="outline" onClick={() => setShowGuestForm(true)}>Join as Guest</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreJoinPage;
