import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, LogIn, Copy, Check, Loader2, AlertCircle, Video } from 'lucide-react';
import { interviewsApi } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';

const STATUS_STYLES = {
  scheduled: 'bg-slate-800 text-slate-300 border-slate-700',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  ended: 'bg-slate-900 text-slate-500 border-slate-800',
  cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

function CopyCode({ code }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 font-mono text-sm bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-cyan-300 hover:border-cyan-500/40 transition-colors"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {code} {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function InterviewsListPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canCreate = role === 'interviewer' || role === 'admin';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    interviewsApi
      .list()
      .then((data) => {
        if (!cancelled) setInterviews(data.interviews || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load interviews.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Interviews</h1>
            <p className="text-slate-400 text-sm mt-1">
              {canCreate ? 'Create and manage your interview sessions.' : 'Join an interview using a code or link from your interviewer.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            {canCreate && (
              <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/interviews/create')}>
                Create Interview
              </Button>
            )}
            <Button variant="secondary" icon={<LogIn className="w-4 h-4" />} onClick={() => navigate('/interviews/join')}>
              Join Interview
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading interviews…
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {!loading && !error && interviews.length === 0 && (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
            <Video className="w-10 h-10 mx-auto text-slate-700 mb-3" />
            <p className="text-slate-400">
              {canCreate ? "You haven't created any interviews yet." : "You haven't joined any interviews yet."}
            </p>
            <p className="text-slate-600 text-sm mt-1">
              {canCreate ? 'Create one to generate a shareable code for your candidate.' : 'Ask your interviewer for an interview code or link.'}
            </p>
          </div>
        )}

        {!loading && !error && interviews.length > 0 && (
          <div className="space-y-3">
            {interviews.map((iv) => (
              <div
                key={iv.id}
                className="flex items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl px-5 py-4 hover:border-cyan-500/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/interview/${iv.id}`)}
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{iv.title}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[iv.status] || STATUS_STYLES.scheduled}`}>
                      {iv.status}
                    </span>
                    <CopyCode code={iv.code} />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/interview/${iv.id}`);
                  }}
                >
                  Open
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewsListPage;
