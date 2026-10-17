import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, AlertCircle, Plus, Trash2, ShieldCheck, Clock3, Link2, Mail } from 'lucide-react';
import { interviewsApi } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

const emptyQuestion = () => ({ title: '', description: '', category: 'General', starterCode: '' });

export function CreateInterviewPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, role } = useAuth();
  const [title, setTitle] = useState('');
  const [candidateEmailsInput, setCandidateEmailsInput] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [updatingCandidate, setUpdatingCandidate] = useState(false);
  const [candidateEmailUpdate, setCandidateEmailUpdate] = useState(created?.candidateEmail || '');
  const canCreate = role === 'interviewer' || role === 'admin';

  const updateQuestion = (index, field, value) => setQuestions((prev) => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleaned = questions.map((q, i) => ({ ...q, title: q.title.trim(), description: q.description.trim(), starterCode: q.starterCode, order: i })).filter((q) => q.title);
    if (!title.trim()) return setError('Please give the interview a title.');
    if (!cleaned.length) return setError('Add at least one interview question.');
    setSubmitting(true); setError('');
    try {
      const candidateEmails = [...new Set(candidateEmailsInput.split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean))];
      const { interview } = await interviewsApi.create({ title: title.trim(), candidateEmails, scheduledAt: scheduledAt || undefined, durationMinutes, questions: cleaned });
      setCreated(interview);
      setCandidateEmailUpdate('');
      showToast('Interview created successfully', 'success');
    } catch (err) { setError(err.message || 'Could not create the interview.'); }
    finally { setSubmitting(false); }
  };

  const handleUpdateCandidate = async (e) => {
    e.preventDefault();
    if (!candidateEmailUpdate.trim()) return;
    setUpdatingCandidate(true);
    try {
      const { interview } = await interviewsApi.addCandidate(created.id, candidateEmailUpdate.trim());
      setCreated(interview);
      setCandidateEmailUpdate('');
      showToast('Candidate email updated', 'success');
    } catch (err) {
      showToast(err.message || 'Could not update candidate', 'error');
    } finally {
      setUpdatingCandidate(false);
    }
  };

  const shareLink = created ? `${window.location.origin}/interviews/join?code=${created.code}` : '';
  if (!canCreate) return <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6"><div className="max-w-md w-full bg-slate-900 border border-rose-500/20 rounded-2xl p-7 text-center"><ShieldCheck className="w-10 h-10 mx-auto text-rose-300 mb-3" /><h1 className="text-xl font-bold">Interview creation restricted</h1><p className="text-sm text-slate-400 mt-2">Only users with the <b>Interviewer</b> or <b>Admin</b> role can create an interview.</p><Button className="mt-6" onClick={() => navigate('/interviews')}>Back to Interviews</Button></div></div>;

  if (created) return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="max-w-xl mx-auto">
        <div className="bg-slate-900/80 border border-emerald-500/20 rounded-3xl p-8 shadow-2xl shadow-black/20">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center mb-5"><Check className="w-6 h-6 text-emerald-300" /></div>
          <h1 className="text-2xl font-bold">Interview created</h1>
          <p className="text-slate-400 text-sm mt-2">Created by {user?.name || (role === 'admin' ? 'Admin' : 'Interviewer')}. Share the link or code with the candidate.</p>
          <div className="mt-6 rounded-2xl bg-slate-950 border border-slate-800 p-5 flex items-center justify-between"><div><p className="text-[11px] uppercase tracking-[.18em] text-slate-500">Interview Code</p><p className="mt-2 text-3xl font-mono tracking-[.28em] text-cyan-300">{created.code}</p></div><Link2 className="w-7 h-7 text-cyan-300/70" /></div>
          <div className="mt-3 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2"><input readOnly value={window.location.origin + `/interviews/join?code=${created.code}`} className="flex-1 min-w-0 bg-transparent text-xs text-slate-300 outline-none" /><button type="button" className="shrink-0 h-9 w-9 rounded-lg border border-slate-700 hover:border-cyan-400/40 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-200 flex items-center justify-center" onClick={async () => { await navigator.clipboard.writeText(window.location.origin + `/interviews/join?code=${created.code}`); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button></div>

          <div className="mt-6 rounded-2xl bg-slate-950 border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-cyan-300" />
              <h3 className="text-sm font-semibold">Invite candidates</h3>
            </div>
            <form onSubmit={handleUpdateCandidate} className="space-y-3">
              <input type="email" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-500/50" placeholder="candidate@example.com" value={candidateEmailUpdate} onChange={(e) => setCandidateEmailUpdate(e.target.value)} />
              <p className="text-xs text-slate-500">Only registered accounts invited to this interview can join. Candidates receive an in-app notification when online.</p>
              <Button type="submit" size="sm" disabled={updatingCandidate || !candidateEmailUpdate.trim()}>{updatingCandidate ? 'Adding…' : 'Add Candidate'}</Button>
            </form>
            {created.candidateEmails?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{created.candidateEmails.map((email) => <span key={email} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">{email}</span>)}</div>}
          </div>

          <div className="mt-6 flex flex-wrap gap-3"><Button variant="outline" onClick={() => navigate('/interviews')}>Back to Interviews</Button><Button onClick={() => navigate(`/interview/${created.id}`)}>Open Interview</Button></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <button className="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-sm mb-7" onClick={() => navigate('/interviews')}><ArrowLeft className="w-4 h-4" /> Back to interviews</button>
        <div className="flex items-start justify-between gap-5 mb-8 flex-wrap"><div><h1 className="text-3xl font-bold tracking-tight">Create Interview</h1><p className="text-slate-400 text-sm mt-2">Build a custom interview and send a secure join link to the candidate.</p></div><div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-200 text-xs"><ShieldCheck className="w-4 h-4" /> {role === 'admin' ? 'Admin' : 'Interviewer'} · Creator access</div></div>
        <div className="mb-7 rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-4 flex items-center gap-3"><Clock3 className="w-5 h-5 text-cyan-300" /><div><p className="text-sm font-semibold">Role is automatic</p><p className="text-xs text-slate-500 mt-0.5">You are creating this interview as <b className="text-slate-300">{role === 'admin' ? 'Admin' : 'Interviewer'}</b>. Candidates only join; they cannot create interviews or start recordings.</p></div></div>
        {error && <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl px-4 py-3 mb-6"><AlertCircle className="w-4 h-4" /> {error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-slate-900/65 border border-slate-800 rounded-2xl p-6"><h2 className="font-semibold">Interview details</h2><div className="grid lg:grid-cols-2 gap-5 mt-5">
            <label className="block text-sm text-slate-300">Interview title<input className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm outline-none focus:border-cyan-500/50" placeholder="Frontend Developer — Round 2" value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
            <label className="block text-sm text-slate-300">Candidate emails <span className="text-slate-600">(optional)</span><textarea className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm outline-none focus:border-cyan-500/50 min-h-24 resize-y" placeholder="candidate@example.com, teammate@example.com" value={candidateEmailsInput} onChange={(e) => setCandidateEmailsInput(e.target.value)} /><span className="block mt-1 text-xs text-slate-500">Separate registered candidate emails with commas, spaces, or new lines.</span></label>
            <label className="block text-sm text-slate-300">Duration<select value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm">{[15,30,45,60,90,120].map((v) => <option key={v} value={v}>{v} minutes</option>)}</select></label>
            <label className="block text-sm text-slate-300">Scheduled for <span className="text-slate-600">(optional)</span><input type="datetime-local" className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></label>
          </div></section>

          <section className="bg-slate-900/65 border border-slate-800 rounded-2xl p-6"><div className="flex items-start justify-between gap-4 flex-wrap"><div><h2 className="font-semibold">Interview questions</h2><p className="text-xs text-slate-500 mt-1">No Easy / Medium / Hard presets. Define exactly what you want to ask.</p></div><Button type="button" variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}>Add Question</Button></div>
            <div className="space-y-4 mt-5">{questions.map((q, index) => <div key={index} className="border border-slate-800 rounded-2xl p-5 bg-slate-950/55"><div className="flex items-center justify-between mb-4"><span className="text-xs font-bold text-cyan-300">Question {index + 1}</span>{questions.length > 1 && <button type="button" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}><Trash2 className="w-4 h-4" /></button>}</div><div className="grid lg:grid-cols-2 gap-3"><input className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm" placeholder="Question title" value={q.title} onChange={(e) => updateQuestion(index, 'title', e.target.value)} /><input className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm" placeholder="Category (React, JavaScript, SQL...)" value={q.category} onChange={(e) => updateQuestion(index, 'category', e.target.value)} /><textarea className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm min-h-24 resize-y" placeholder="What should the candidate explain or build?" value={q.description} onChange={(e) => updateQuestion(index, 'description', e.target.value)} /><textarea className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-mono min-h-20 resize-y" placeholder="Starter code (optional)" value={q.starterCode} onChange={(e) => updateQuestion(index, 'starterCode', e.target.value)} /></div></div>)}</div>
          </section>
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => navigate('/interviews')}>Cancel</Button><Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create Interview'}</Button></div>
        </form>
      </div>
    </div>
  );
}

export default CreateInterviewPage;
