import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { interviewsApi } from '../../../api/client';
import { Button } from '../../../components/ui/Button';

export function JoinInterviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async (e) => {
    e?.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Enter the interview code your interviewer shared with you.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await interviewsApi.getByCode(trimmed);
      // Valid — hand off to the pre-join screen, which performs the real join.
      navigate(`/interviews/prejoin/${trimmed}`);
    } catch (err) {
      setError(err.message || 'Could not find that interview.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-lookup if a code arrived via a shared link (?code=XXXXXX)
  useEffect(() => {
    if (searchParams.get('code')) {
      handleLookup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-6" onClick={() => navigate('/interviews')}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
          <h1 className="text-xl font-bold mb-1">Join an Interview</h1>
          <p className="text-slate-400 text-sm mb-6">Enter the code your interviewer shared with you.</p>

          {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <form onSubmit={handleLookup} className="space-y-5">
            <input
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-center font-mono text-lg tracking-[0.3em] uppercase focus:outline-none focus:border-cyan-500/50"
              placeholder="ABC123"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoFocus
            />
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default JoinInterviewPage;
