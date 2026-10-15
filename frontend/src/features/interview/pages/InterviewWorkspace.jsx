import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Code2, Palette, Share2, Copy, Check, Award, GripVertical } from 'lucide-react';
import { getWorkspaceStore, saveWorkspaceHistory } from '../../../data/workspaceStore';
import { isInterviewWorkspace } from '../../../types/workspace';
import { InterviewStatus } from '../types/interview.types';
import { useInterview } from '../hooks/useInterview';
import { useInterviewAudio } from '../hooks/useInterviewAudio';
import { useInterviewRecording } from '../hooks/useInterviewRecording';
import { InterviewHeader } from '../components/InterviewHeader';
import { CandidateInfo } from '../components/CandidateInfo';
import { InterviewQuestion } from '../components/InterviewQuestion';
import { InterviewNotes } from '../components/InterviewNotes';
import { InterviewWhiteboard } from '../components/InterviewWhiteboard';
import { InterviewCodeEditor } from '../components/InterviewCodeEditor';
import { InterviewSetup } from './InterviewSetup';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { interviewsApi } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import '../styles/InterviewWorkspace.css';

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;

export function InterviewWorkspacePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { role: authRole } = useAuth();
  const workspace = getWorkspaceStore().workspaces.find((item) => String(item.id) === String(id));
  const workspaceId = Number(id) || id;
  const [activeTool, setActiveTool] = useState('split');
  const [backendInterview, setBackendInterview] = useState(null);
  const [copied, setCopied] = useState(false);
  const [score, setScore] = useState('');
  const [scoreFeedback, setScoreFeedback] = useState('');
  const [savingScore, setSavingScore] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50);
  const stageRef = useRef(null);
  const resizingRef = useRef(false);

  const isBackendInterview = MONGO_ID_RE.test(String(id));

  useEffect(() => {
    if (!isBackendInterview) return undefined;
    let cancelled = false;
    interviewsApi.getById(id).then(({ interview }) => {
      if (!cancelled) setBackendInterview(interview);
    }).catch((err) => showToast(err.message || 'Could not load interview', 'error'));
    return () => { cancelled = true; };
  }, [id, isBackendInterview, showToast]);

  const interview = useInterview(workspaceId, workspace, backendInterview, authRole);
  const isInterviewer = authRole === 'interviewer' || authRole === 'admin';
  const roomId = backendInterview?.roomId || `workspace-${workspaceId}`;
  const audio = useInterviewAudio(roomId);
  const recording = useInterviewRecording(isBackendInterview ? id : null, audio, isInterviewer);

  const remainingSeconds = useMemo(
    () => Math.max(interview.durationMinutes * 60 - interview.elapsedSeconds, 0),
    [interview.durationMinutes, interview.elapsedSeconds]
  );

  const showSetup = isBackendInterview && isInterviewer && interview.status === InterviewStatus.SCHEDULED;

  const shareLink = backendInterview
    ? `${window.location.origin}/interviews/join?code=${backendInterview.code}`
    : `${window.location.origin}/interview/${id}`;

  const shareInterview = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: backendInterview?.title || 'SyncSpace Interview', url: shareLink });
      } else {
        await navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        showToast('Interview link copied', 'success');
      }
    } catch {
      // User cancelled native share.
    }
  };

  const recordActivity = (action, source) => {
    saveWorkspaceHistory(workspaceId, { action, source });
  };

  const updateSplitRatio = (clientX) => {
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds?.width) return;
    setSplitRatio(Math.min(75, Math.max(25, ((clientX - bounds.left) / bounds.width) * 100)));
  };

  const handleSplitterKeyDown = (event) => {
    if (event.key === 'ArrowLeft') setSplitRatio((ratio) => Math.max(25, ratio - 5));
    else if (event.key === 'ArrowRight') setSplitRatio((ratio) => Math.min(75, ratio + 5));
    else if (event.key === 'Home') setSplitRatio(25);
    else if (event.key === 'End') setSplitRatio(75);
    else return;
    event.preventDefault();
  };
  const saveScore = async () => {
    const numeric = Number(score);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) { showToast('Score must be between 0 and 100', 'error'); return; }
    setSavingScore(true);
    try { const { interview: fresh } = await interviewsApi.score(id, { score: numeric, feedback: scoreFeedback }); setBackendInterview(fresh); showToast('Interview score saved', 'success'); } catch (err) { showToast(err.message || 'Could not save score', 'error'); } finally { setSavingScore(false); }
  };

  const handleEnd = async () => {
    if (recording.recording) await recording.stopRecording();
    await interview.endInterview();
    showToast('Interview ended', 'info');
    if (isBackendInterview) {
      try {
        const { interview: fresh } = await interviewsApi.getById(id);
        setBackendInterview(fresh);
      } catch {}
    }
  };

  if (workspace && !isInterviewWorkspace(workspace)) {
    return <Navigate to={`/workspaces/${id}`} replace />;
  }

  if (showSetup) {
    return (
      <div className="interview-workspace">
        <div className="flex items-center justify-between gap-2 p-4 border-b border-slate-800 bg-slate-950">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
          <Button variant="outline" size="sm" icon={<Share2 className="w-4 h-4" />} onClick={shareInterview}>
            {copied ? 'Copied' : 'Share Interview'}
          </Button>
        </div>
        <InterviewSetup
          workspaceName={backendInterview?.title || `Interview ${id}`}
          defaultCandidate={backendInterview?.candidateInfo?.name || ''}
          questionCount={interview.questions.length}
          onStart={async () => {
            try {
              const fresh = await interview.configureAndStart();
              setBackendInterview((prev) => ({ ...prev, ...fresh }));
              showToast('Interview started', 'success');
            } catch (err) {
              showToast(err.message || 'Could not start interview', 'error');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="interview-workspace">
      <InterviewHeader
        title={backendInterview?.title || workspace?.name || `Interview ${id}`}
        status={interview.status}
        interviewerName={interview.interviewer.name}
        candidateName={interview.candidate.name}
        elapsedSeconds={interview.elapsedSeconds}
        remainingSeconds={remainingSeconds}
        timerMode="down"
        onBack={() => navigate('/dashboard')}
        onPause={interview.pauseInterview}
        onResume={interview.resumeInterview}
        onEnd={handleEnd}
        canControl={isInterviewer}
        micMuted={audio.muted}
        onToggleMic={audio.toggleMute}
        micConnectionState={audio.connectionState}
        micError={audio.error}
        recording={recording.recording}
        recordingProcessing={recording.processing}
        onStartRecording={recording.startRecording}
        onStopRecording={recording.stopRecording}
        recordingError={recording.error}
      />

      <div className="flex items-center justify-end gap-2 px-4 py-2 bg-slate-950 border-b border-slate-800">
        <span className="text-xs text-slate-500 font-mono">Room: {roomId}</span>
        {backendInterview?.code && <span className="text-xs text-slate-500">Code: {backendInterview.code}</span>}
        <Button variant="outline" size="sm" icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} onClick={shareInterview}>
          {copied ? 'Copied' : 'Share'}
        </Button>
      </div>

      {recording.error && <div className="mx-4 mt-3 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{recording.error}</div>}
      {backendInterview?.status === 'ended' && <section className="mx-4 mt-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center gap-2 mb-3"><Award className="w-4 h-4 text-amber-300" /><h2 className="font-semibold">Interview Result</h2></div>
        {isInterviewer ? <div className="grid md:grid-cols-[140px_1fr_auto] gap-3"><input type="number" min="0" max="100" value={score !== '' ? score : (backendInterview.score ?? '')} onChange={(e) => setScore(e.target.value)} placeholder="Score / 100" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" /><input value={scoreFeedback || backendInterview.scoreFeedback || ''} onChange={(e) => setScoreFeedback(e.target.value)} placeholder="Feedback for the candidate" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm" /><Button variant="thunder" size="sm" onClick={saveScore} disabled={savingScore}>{savingScore ? 'Saving…' : 'Save Score'}</Button></div> : <div><p className="text-2xl font-bold text-cyan-300">{backendInterview.score ?? 'Pending'}{backendInterview.score != null ? ' / 100' : ''}</p>{backendInterview.scoreFeedback && <p className="text-sm text-slate-400 mt-1">{backendInterview.scoreFeedback}</p>}</div>}
        {backendInterview.startedAt && <p className="text-[11px] text-slate-500 mt-3">Started {new Date(backendInterview.startedAt).toLocaleString()} · Ended {backendInterview.endedAt ? new Date(backendInterview.endedAt).toLocaleString() : '—'}</p>}
      </section>}

      <div className="interview-body">
        <aside className="interview-sidebar">
          <CandidateInfo interviewer={interview.interviewer} candidate={interview.candidate} />
          <InterviewQuestion
            question={interview.currentQuestion}
            questionIndex={interview.currentQuestionIndex}
            total={interview.questions.length}
            onPrev={interview.prevQuestion}
            onNext={interview.nextQuestion}
          />
          {isInterviewer && (
            <div className="interview-notes-wrap">
              <InterviewNotes notes={interview.notes} onNotesChange={interview.setNotes} onSave={async () => {
                try {
                  await interview.saveNotes();
                  showToast('Interview notes saved', 'success');
                } catch (err) {
                  showToast(err.message || 'Could not save notes', 'error');
                }
              }} />
            </div>
          )}
        </aside>

        <main className="interview-main">
          <div className="interview-tool-tabs">
            <button type="button" className={activeTool === 'whiteboard' || activeTool === 'split' ? 'active' : ''} onClick={() => setActiveTool('whiteboard')}>
              <Palette className="w-4 h-4" /> Whiteboard
            </button>
            <button type="button" className={activeTool === 'code' ? 'active' : ''} onClick={() => setActiveTool('code')}>
              <Code2 className="w-4 h-4" /> Code Editor
            </button>
            <button type="button" className={`interview-split-tab ${activeTool === 'split' ? 'active' : ''}`} onClick={() => setActiveTool('split')}>Split</button>
          </div>

          <div
            ref={stageRef}
            className={`interview-stage interview-stage-${activeTool}`}
            style={{
              '--interview-split-left': `${splitRatio}fr`,
              '--interview-split-right': `${100 - splitRatio}fr`,
            }}
          >
            <section className="interview-panel whiteboard-panel" data-panel="whiteboard">
              <div className="panel-title">Whiteboard <span>Shared canvas</span></div>
              <InterviewWhiteboard workspaceId={workspaceId} roomId={roomId} onActivity={recordActivity} />
            </section>
            {activeTool === 'split' && (
              <div
                className="interview-resize-handle"
                role="separator"
                aria-label="Resize whiteboard and code editor panels"
                aria-orientation="vertical"
                aria-valuemin={25}
                aria-valuemax={75}
                aria-valuenow={Math.round(splitRatio)}
                tabIndex={0}
                onKeyDown={handleSplitterKeyDown}
                onPointerDown={(event) => {
                  resizingRef.current = true;
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (resizingRef.current) updateSplitRatio(event.clientX);
                }}
                onPointerUp={() => { resizingRef.current = false; }}
                onLostPointerCapture={() => { resizingRef.current = false; }}
              >
                <GripVertical className="w-4 h-4" aria-hidden="true" />
              </div>
            )}
            <section className="interview-panel code-panel" data-panel="code">
              <div className="panel-title">Code Editor <span>Shared collaborative editor</span></div>
              <InterviewCodeEditor workspaceId={workspaceId} roomId={roomId} onActivity={recordActivity} />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default InterviewWorkspacePage;
