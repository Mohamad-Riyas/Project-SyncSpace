import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, LogIn, Copy, Check, Loader2, AlertCircle, Video, UserPlus, X } from 'lucide-react';
import { interviewsApi, workspaceApi } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';

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
  const [interviewWorkspaces, setInterviewWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateBusy, setCandidateBusy] = useState(false);
  const canCreate = role === 'interviewer' || role === 'admin';

  const updateInterview = (interview) => {
    setInterviews((current) => current.map((item) => item.id === interview.id ? interview : item));
  };

  const addCandidate = async (event, interviewId) => {
    event.preventDefault();
    event.stopPropagation();
    if (!candidateEmail.trim()) return;
    setCandidateBusy(true);
    try {
      const { interview } = await interviewsApi.addCandidate(interviewId, candidateEmail.trim());
      updateInterview(interview);
      setCandidateEmail('');
      showToast('Candidate invited', 'success');
    } catch (err) {
      showToast(err.message || 'Could not add candidate', 'error');
    } finally {
      setCandidateBusy(false);
    }
  };

  const removeCandidate = async (event, interviewId, email) => {
    event.stopPropagation();
    try {
      const { interview } = await interviewsApi.removeCandidateByEmail(interviewId, email);
      updateInterview(interview);
      showToast('Candidate removed', 'success');
    } catch (err) {
      showToast(err.message || 'Could not remove candidate', 'error');
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([interviewsApi.list(), workspaceApi.list()])
      .then(([interviewData, workspaceData]) => {
        if (cancelled) return;
        setInterviews(interviewData.interviews || []);
        setInterviewWorkspaces((workspaceData.workspaces || []).filter((workspace) => workspace.kind === 'interview'));
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
            <ThemeToggle />
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

        {!loading && !error && interviews.length === 0 && interviewWorkspaces.length === 0 && (
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
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Interview sessions</h2>
            <div className="space-y-3">
              {interviews.map((iv) => (
                <div
                  key={iv.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl px-5 py-4 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4 cursor-pointer" onClick={() => navigate(`/interview/${iv.id}`)}>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{iv.title}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[iv.status] || STATUS_STYLES.scheduled}`}>
                          {iv.status}
                        </span>
                        <CopyCode code={iv.code} />
                        <span className="text-xs text-slate-500">{(iv.candidateEmails || []).length} candidate{(iv.candidateEmails || []).length === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {canCreate && <Button variant="secondary" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === iv.id ? null : iv.id); setCandidateEmail(''); }}>Manage</Button>}
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
                  </div>
                  {expandedId === iv.id && canCreate && (
                    <div className="mt-4 pt-4 border-t border-slate-800" onClick={(event) => event.stopPropagation()}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Interview candidates</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(iv.candidateEmails || []).map((email) => (
                          <span key={email} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300">
                            {email}
                            <button type="button" aria-label={`Remove ${email}`} onClick={(event) => removeCandidate(event, iv.id, email)} className="text-slate-500 hover:text-rose-300"><X className="w-3.5 h-3.5" /></button>
                          </span>
                        ))}
                        {!iv.candidateEmails?.length && <span className="text-xs text-slate-500">No candidates invited yet.</span>}
                      </div>
                      <form className="flex flex-col sm:flex-row gap-2" onSubmit={(event) => addCandidate(event, iv.id)}>
                        <input type="email" required value={candidateEmail} onChange={(event) => setCandidateEmail(event.target.value)} placeholder="candidate@example.com" className="flex-1 min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500/50" />
                        <Button type="submit" size="sm" disabled={candidateBusy} icon={<UserPlus className="w-4 h-4" />}>{candidateBusy ? 'Adding…' : 'Add candidate'}</Button>
                      </form>
                      <p className="text-[11px] text-slate-500 mt-2">Candidates must have a registered SyncSpace account. They get an in-app join notification when online.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && !error && interviewWorkspaces.length > 0 && (
          <section className="mb-8">
            <div className="mb-3">
              <h2 className="text-lg font-semibold">Interview workspaces</h2>
              <p className="text-xs text-slate-500 mt-1">Collaborative rooms for code, whiteboard, and team presence.</p>
            </div>
            <div className="space-y-3">
              {interviewWorkspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl px-5 py-4 hover:border-violet-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{workspace.name}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300">Workspace</span>
                        <CopyCode code={workspace.code} />
                        <span className="text-xs text-slate-500">{workspace.collaborators || 0} collaborator{workspace.collaborators === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/workspaces/${workspace.id}`)}>
                      Open Workspace
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default InterviewsListPage;
