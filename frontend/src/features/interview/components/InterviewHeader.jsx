import { ArrowLeft, Mic, MicOff, Wifi, WifiOff, Loader2, Circle, Square } from 'lucide-react';
import { InterviewTimer } from './InterviewTimer';
import { InterviewControls } from './InterviewControls';
import { InterviewStatus } from '../types/interview.types';

const statusLabel = {
  [InterviewStatus.SCHEDULED]: 'Scheduled',
  [InterviewStatus.ACTIVE]: 'LIVE',
  [InterviewStatus.PAUSED]: 'Paused',
  [InterviewStatus.COMPLETED]: 'Ended',
};

export function InterviewHeader({
  title,
  status,
  interviewerName,
  candidateName,
  elapsedSeconds,
  remainingSeconds,
  timerMode = 'up',
  onBack,
  onPause,
  onResume,
  onEnd,
  canControl = true,
  micMuted = true,
  onToggleMic,
  micConnectionState = 'idle',
  micError = '',
  recording = false,
  recordingProcessing = false,
  onStartRecording,
  onStopRecording,
  recordingError = '',
}) {
  const isLive = status === InterviewStatus.ACTIVE;
  const displaySeconds = timerMode === 'down' ? remainingSeconds : elapsedSeconds;

  return (
    <header className="interview-header">
      <div className="interview-header-left">
        <button type="button" className="interview-back-btn" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
        <div className="interview-header-title-block">
          <p className="interview-kicker">Technical Interview</p>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="interview-header-center">
        <div className="interview-people">
          <span>
            Interviewer <strong>{interviewerName}</strong>
          </span>
          <span>
            Candidate <strong>{candidateName}</strong>
          </span>
        </div>
      </div>

      <div className="interview-header-right">
        <span className={`interview-status-badge interview-status-${status}`}>
          <span className={isLive ? 'interview-live-dot' : ''} />
          {statusLabel[status] || status}
        </span>
        <InterviewTimer
          elapsedSeconds={displaySeconds}
          isRunning={isLive}
          mode={timerMode}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} title={micError || undefined}>
          {micConnectionState === 'connecting' && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          {micConnectionState === 'connected' && <Wifi className="w-4 h-4 text-emerald-400" />}
          {micConnectionState === 'error' && <WifiOff className="w-4 h-4 text-rose-400" />}
          <button
            type="button"
            className="interview-controls-btn"
            onClick={onToggleMic}
            disabled={micConnectionState !== 'connected'}
            style={{
              padding: '6px',
              borderRadius: '4px',
              background: micMuted ? 'rgba(255,255,255,0.1)' : 'rgba(16,185,129,0.2)',
              border: 'none',
              cursor: micConnectionState === 'connected' ? 'pointer' : 'not-allowed',
              color: 'var(--color-text-main)'
            }}
          >
            {!micMuted ? <Mic className="w-5 h-5 text-emerald-400" /> : <MicOff className="w-5 h-5 text-red-400" />}
          </button>
          {canControl && isLive && (
            <button
              type="button"
              className="interview-controls-btn"
              onClick={recording ? onStopRecording : onStartRecording}
              disabled={recordingProcessing}
              title={recordingError || (recording ? 'Stop recording' : 'Start meeting recording')}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: recording ? 'rgba(244,63,94,0.16)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${recording ? 'rgba(244,63,94,0.45)' : 'rgba(255,255,255,0.12)'}`,
                color: 'var(--color-text-main)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: recordingProcessing ? 'wait' : 'pointer',
              }}
            >
              {recording ? <Square className="w-3.5 h-3.5 text-rose-400" /> : <Circle className="w-3.5 h-3.5 text-rose-400" />}
              {recordingProcessing ? 'Saving…' : recording ? 'Recording' : 'Record'}
            </button>
          )}
          {canControl && (
            <InterviewControls
              status={status}
              onPause={onPause}
              onResume={onResume}
              onEnd={onEnd}
            />
          )}
        </div>
      </div>
    </header>
  );
}

export default InterviewHeader;
