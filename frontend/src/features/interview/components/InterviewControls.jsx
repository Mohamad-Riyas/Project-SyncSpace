import { useState } from 'react';
import { Pause, Play, Square } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { InterviewStatus } from '../types/interview.types';

export function InterviewControls({ status, onPause, onResume, onEnd }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isActive = status === InterviewStatus.ACTIVE;
  const isPaused = status === InterviewStatus.PAUSED;
  const isCompleted = status === InterviewStatus.COMPLETED;
  const isScheduled = status === InterviewStatus.SCHEDULED;

  if (isCompleted || isScheduled) return null;

  return (
    <>
      <div className="interview-controls">
        {isActive && (
          <Button type="button" variant="outline" size="sm" icon={<Pause className="w-3.5 h-3.5" />} onClick={onPause}>
            Pause
          </Button>
        )}
        {isPaused && (
          <Button type="button" variant="secondary" size="sm" icon={<Play className="w-3.5 h-3.5" />} onClick={onResume}>
            Resume
          </Button>
        )}
        <Button
          type="button"
          variant="danger"
          size="sm"
          icon={<Square className="w-3.5 h-3.5" />}
          onClick={() => setConfirmOpen(true)}
        >
          End Interview
        </Button>
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="End Interview?"
        subtitle="This will stop the timer and mark the session as completed."
        maxWidth="sm"
      >
        <p className="text-sm text-slate-400 mb-5">
          Are you sure you want to end this interview? You can still review notes, the whiteboard, and the code editor afterwards.
        </p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              setConfirmOpen(false);
              onEnd();
            }}
          >
            End Interview
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default InterviewControls;
