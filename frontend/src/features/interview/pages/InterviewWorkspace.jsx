import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Code2, Palette, Share2, Copy, Check, Award, GripVertical, Mic, MicOff, UserPlus, X } from 'lucide-react';
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
import { getSocket } from '../../../services/socket';
import { Button } from '../../../components/ui/Button';
import '../styles/InterviewWorkspace.css';

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;

function VideoTile({ stream, label, muted = false }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
    return () => {
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [stream]);
  return (
    <div className="relative aspect-video w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
      <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white">{label}</span>
    </div>
  );
}

export function InterviewWorkspacePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { role: authRole } = useAuth();
  const workspace = getWorkspaceStore().workspaces.find((item) => String(item.id) === String(id));
  const workspaceId = Number(id) || id;
  const [activeTool, setActiveTool] = useState('split');
  const [backendInterview, setBackendInterview] = useState(null);
  const [interviewLoadState, setInterviewLoadState] = useState({ id: null, error: '' });
  const [availableInterviews, setAvailableInterviews] = useState([]);
  const [candidateManagerOpen, setCandidateManagerOpen] = useState(false);
  const [candidateEmailInput, setCandidateEmailInput] = useState('');
  const [candidateBusy, setCandidateBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [score, setScore] = useState('');
  const [scoreFeedback, setScoreFeedback] = useState('');
  const [savingScore, setSavingScore] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50);
  const [recordingAnnouncement, setRecordingAnnouncement] = useState(false);
  const stageRef = useRef(null);
  const resizingRef = useRef(false);

  const isBackendInterview = MONGO_ID_RE.test(String(id));
  const interviewLoading = isBackendInterview && interviewLoadState.id !== id;
  const interviewLoadError = interviewLoadState.id === id ? interviewLoadState.error : '';

  useEffect(() => {
    if (!isBackendInterview) return undefined;
    let cancelled = false;
    interviewsApi.getById(id).then(({ interview }) => {
      if (!cancelled) {
        setBackendInterview(interview);
        setInterviewLoadState({ id, error: '' });
      }
    }).catch((err) => {
      if (!cancelled) setInterviewLoadState({ id, error: err.message || 'Could not load interview' });
      if (err.status === 404) {
        interviewsApi.list().then(({ interviews: items = [] }) => {
          if (!cancelled) setAvailableInterviews(items);
        }).catch((listError) => {
          console.error('Could not load accessible interviews after a missing interview link:', listError);
        });
      }
    });
    return () => { cancelled = true; };
  }, [id, isBackendInterview]);

  const interview = useInterview(workspaceId, workspace, backendInterview, authRole);
  const isInterviewer = authRole === 'interviewer' || authRole === 'admin';
  const roomId = backendInterview?.roomId || `workspace-${workspaceId}`;
  const audio = useInterviewAudio(roomId);
  const recording = useInterviewRecording(isBackendInterview ? id : null, audio, isInterviewer);

  useEffect(() => {
    if (!isBackendInterview || !backendInterview?.id) return undefined;
    const socket = getSocket();
    const joinWorkspace = () => socket.emit('join-workspace', id);
    const onFileUpdated = (file) => {
      window.dispatchEvent(new CustomEvent('syncspace:file-updated', { detail: file }));
    };
    const onFileDeleted = (payload) => {
      window.dispatchEvent(new CustomEvent('syncspace:file-deleted', { detail: payload }));
    };
    const onRecordingStatus = ({ status }) => setRecordingAnnouncement(status === 'recording');
    if (socket.connected) joinWorkspace();
    else socket.once('connect', joinWorkspace);
    socket.on('workspace:file-updated', onFileUpdated);
    socket.on('workspace:file-deleted', onFileDeleted);
    socket.on('recording:status', onRecordingStatus);
    return () => {
      socket.off('connect', joinWorkspace);
      socket.off('workspace:file-updated', onFileUpdated);
      socket.off('workspace:file-deleted', onFileDeleted);
      socket.off('recording:status', onRecordingStatus);
      socket.emit('leave-workspace', id);
    };
  }, [backendInterview?.id, id, isBackendInterview]);

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

  const addCandidate = async (event) => {
    event.preventDefault();
    const email = candidateEmailInput.trim();
    if (!email || !backendInterview) return;
    setCandidateBusy(true);
    try {
      const { interview: updated } = await interviewsApi.addCandidate(id, email);
      setBackendInterview(updated);
      setCandidateEmailInput('');
      showToast('Candidate invited', 'success');
    } catch (err) {
      showToast(err.message || 'Could not add candidate', 'error');
    } finally {
      setCandidateBusy(false);
    }
  };

  const removeCandidate = async (email) => {
    try {
      const { interview: updated } = await interviewsApi.removeCandidateByEmail(id, email);
      setBackendInterview(updated);
      showToast('Candidate removed', 'success');
    } catch (err) {
      showToast(err.message || 'Could not remove candidate', 'error');
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
      } catch (err) {
        showToast(err.message || 'Could not refresh the interview details', 'error');
      }
    }
  };

  if (workspace && !isInterviewWorkspace(workspace)) {
    return <Navigate to={`/workspaces/${id}`} replace />;
  }

  if (isBackendInterview && (interviewLoading || interviewLoadError || !backendInterview)) {
    return (
      <div className="interview-workspace min-h-screen flex items-center justify-center px-6">
        <div role={interviewLoadError ? 'alert' : 'status'} className="max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
          <h1 className="text-lg font-semibold text-slate-100">{interviewLoading ? 'Loading interview…' : 'Interview unavailable'}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {interviewLoading
              ? 'Connecting to the interview workspace.'
              : interviewLoadError || 'The interview details could not be loaded.'}
          </p>
          {!interviewLoading && (
            <p className="mt-2 text-xs text-slate-500">Check that the backend is running and sign in with the interviewer or invited candidate account.</p>
          )}
          {!interviewLoading && availableInterviews.length > 0 && (
            <div className="mt-5 border-t border-slate-800 pt-4 text-left">
              <p className="mb-2 text-xs font-semibold text-slate-300">This link may be outdated. Choose an interview available to your account:</p>
              <ul className="space-y-2">
                {availableInterviews.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/interview/${item.id}`)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-left hover:border-cyan-500/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-slate-100">{item.title}</span>
                        <span className="block text-xs text-slate-500">{item.status}</span>
                      </span>
                      <span className="shrink-0 font-mono text-sm tracking-wider text-cyan-300">{item.code}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-5 flex justify-center gap-2">
            {!interviewLoading && <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>}
            <Button variant="outline" onClick={() => navigate('/interviews')}>Back to Interviews</Button>
          </div>
        </div>
      </div>
    );
  }

  const candidateManager = isInterviewer && backendInterview && (
    <section className="mx-4 mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Manage candidates</h2>
          <p className="mt-1 text-xs text-slate-500">Invite registered accounts by email. They can join with the six-digit code or notification.</p>
        </div>
        <button type="button" aria-label="Close candidate manager" onClick={() => setCandidateManagerOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={addCandidate} className="mt-3 flex flex-wrap gap-2">
        <input
          type="email"
          required
          value={candidateEmailInput}
          onChange={(event) => setCandidateEmailInput(event.target.value)}
          placeholder="candidate@example.com"
          aria-label="Candidate email"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
        />
        <Button type="submit" size="sm" disabled={candidateBusy || !candidateEmailInput.trim()} icon={<UserPlus className="h-4 w-4" />}>
          {candidateBusy ? 'Adding…' : 'Add candidate'}
        </Button>
      </form>
      {(backendInterview.candidateEmails || []).length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {backendInterview.candidateEmails.map((email) => (
            <li key={email} className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
              {email}
              <button type="button" onClick={() => removeCandidate(email)} aria-label={`Remove ${email}`} className="text-slate-500 hover:text-rose-300">
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-xs text-slate-500">No candidates invited yet.</p>}
    </section>
  );

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
          <Button variant="secondary" size="sm" icon={<UserPlus className="h-4 w-4" />} onClick={() => setCandidateManagerOpen((open) => !open)}>
            Manage candidates
          </Button>
        </div>
        {candidateManagerOpen && candidateManager}
        <InterviewSetup
          workspaceName={backendInterview?.title || `Interview ${id}`}
          defaultCandidate={backendInterview?.candidateInfo?.name || ''}
          candidateEmails={backendInterview?.candidateEmails || []}
          showCandidateName={!isBackendInterview}
          showDuration={!isBackendInterview}
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
        cameraEnabled={audio.cameraEnabled}
        cameraError={audio.cameraError}
        onToggleCamera={audio.toggleCamera}
        onMuteCandidates={audio.muteCandidates}
        recording={recording.recording}
        recordingProcessing={recording.processing}
        onStartRecording={recording.startRecording}
        onStopRecording={recording.stopRecording}
        recordingError={recording.error}
      />

      <div className="flex items-center justify-end gap-2 px-4 py-2 bg-slate-950 border-b border-slate-800">
        {backendInterview
          ? <span className="rounded-md border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1 text-xs text-cyan-200">Interview code <strong className="ml-1 font-mono tracking-wider">{backendInterview.code}</strong></span>
          : <span className="text-xs text-slate-500 font-mono">Practice room</span>}
        {isInterviewer && backendInterview && <Button variant="secondary" size="sm" icon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setCandidateManagerOpen((open) => !open)}>Manage candidates</Button>}
        <Button variant="outline" size="sm" icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} onClick={shareInterview}>
          {copied ? 'Copied' : 'Share'}
        </Button>
      </div>

      {recording.error && <div className="mx-4 mt-3 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{recording.error}</div>}
      {recording.notice && <div role="status" className="mx-4 mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">{recording.notice}</div>}
      {candidateManagerOpen && candidateManager}
      {recordingAnnouncement && <div role="status" className="mx-4 mt-3 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-rose-400 animate-pulse" />This interview is being recorded.</div>}
      {isInterviewer && audio.remotePeers.length > 0 && (
        <section aria-label="Interview participants" className="mx-4 mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
          <span className="mr-1 text-xs font-semibold text-slate-400">Participants</span>
          {audio.remotePeers.map((peer, index) => (
            <div key={peer.id} className="flex items-center gap-2 rounded-lg bg-slate-900 px-2.5 py-1.5">
              <span className="text-xs text-slate-200">Participant {index + 1}</span>
              <span className="text-[11px] text-slate-500">{peer.muted ? 'Muted' : 'Mic on'}</span>
              <button type="button" onClick={() => audio.muteCandidate(peer.id)} disabled={peer.muted} className="rounded-md p-1 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50" aria-label={peer.muted ? `Participant ${index + 1} is muted` : `Mute participant ${index + 1}`} title={peer.muted ? 'Microphone is muted' : 'Mute participant'}>
                {peer.muted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </button>
            </div>
          ))}
        </section>
      )}
      {(audio.localCameraStream || audio.remoteStreams.some(([, stream]) => stream.getVideoTracks().some((track) => track.readyState === 'live'))) && (
        <div className="flex gap-3 overflow-x-auto px-4 pt-3">
          {audio.localCameraStream && <VideoTile stream={audio.localCameraStream} label="You" muted />}
          {audio.remoteStreams.filter(([, stream]) => stream.getVideoTracks().some((track) => track.readyState === 'live')).map(([peerId, stream], index) => (
            <VideoTile key={peerId} stream={stream} label={`Participant ${index + 1}`} />
          ))}
        </div>
      )}
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
