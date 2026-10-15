import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { workspaceApi, saveGuestSession } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export default function JoinWorkspacePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { status } = useAuth();
  const [error, setError] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestError, setGuestError] = useState('');
  const [joining, setJoining] = useState(false);
  const code = params.get('code');
  const needsChoice = status === 'anonymous' && Boolean(code) && !error;

  useEffect(() => {
    if (!code) {
      setError('This workspace link does not contain a valid invite code.');
      return;
    }
    if (status !== 'authenticated') return;
    workspaceApi.join(code)
      .then(({ workspace }) => {
        showToast(`Joined ${workspace.name}`, 'success');
        navigate(`/workspaces/${workspace.id}`, { replace: true });
      })
      .catch((err) => setError(err.message || 'Could not join workspace.'));
  }, [status, code]);

  const continueAsGuest = async (event) => {
    event.preventDefault();
    if (!guestName.trim()) {
      setGuestError('Enter a name so others can see who you are.');
      return;
    }
    setJoining(true);
    setGuestError('');
    try {
      const { token, guest, workspace } = await workspaceApi.joinAsGuest(code, guestName);
      saveGuestSession({ token, guestId: guest.id, name: guest.name, workspaceId: guest.workspaceId });
      navigate(`/workspaces/${workspace.id}`, { replace: true });
    } catch (err) {
      setGuestError(err.message || 'Could not join as a guest.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-8 text-center">
        {needsChoice ? (
          <form onSubmit={continueAsGuest} className="text-left space-y-4">
            <h1 className="font-semibold text-lg text-center">You've been invited to a workspace</h1>
            <p className="text-sm text-slate-400 text-center">Sign in to join as a member, or continue as a guest with just a name.</p>
            <input
              value={guestName}
              onChange={(event) => { setGuestName(event.target.value); setGuestError(''); }}
              maxLength={40}
              placeholder="Your name"
              aria-label="Your name"
              autoFocus
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-teal-500"
            />
            {guestError && <p className="text-xs text-rose-400">{guestError}</p>}
            <Button type="submit" variant="thunder" className="w-full" disabled={joining}>{joining ? 'Joining…' : 'Continue as guest'}</Button>
            <div className="flex items-center justify-center gap-4 text-sm">
              <Link className="text-teal-500 hover:underline" to={`/login?returnTo=${encodeURIComponent(`/workspaces/join?code=${code}`)}`}>Sign in</Link>
              <Link className="text-teal-500 hover:underline" to="/register">Create account</Link>
            </div>
          </form>
        ) : error ? (
          <>
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
            <h1 className="font-semibold mb-2">Unable to join workspace</h1>
            <p className="text-sm text-slate-400">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-cyan-400 mx-auto mb-3 animate-spin" />
            <h1 className="font-semibold">Joining workspace…</h1>
            <p className="text-sm text-slate-500 mt-2">Checking the invite and opening the room.</p>
          </>
        )}
      </div>
    </div>
  );
}
