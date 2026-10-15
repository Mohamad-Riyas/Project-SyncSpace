import { useState } from 'react';
import { Mic, ListChecks } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export function InterviewSetup({
  workspaceName,
  defaultCandidate = '',
  defaultDuration = 60,
  questionCount = 0,
  onStart,
}) {
  const [candidateName, setCandidateName] = useState(defaultCandidate);
  const [durationMinutes, setDurationMinutes] = useState(defaultDuration);

  const handleSubmit = (event) => {
    event.preventDefault();
    onStart({
      candidateName: candidateName.trim() || 'Candidate',
      durationMinutes: Number(durationMinutes) || 60,
    });
  };

  return (
    <div className="interview-setup">
      <div className="interview-setup-card">
        <div className="interview-setup-icon">
          <Mic className="w-6 h-6 text-cyan-300" />
        </div>
        <p className="interview-kicker">Interview Setup</p>
        <h2>{workspaceName}</h2>
        <p className="interview-setup-copy">
          This session uses the questions configured by the interviewer. There are no fixed Easy / Medium / Hard levels.
        </p>

        <div className="mb-5 flex items-center gap-2 text-sm text-slate-400">
          <ListChecks className="w-4 h-4 text-cyan-400" />
          {questionCount} question{questionCount === 1 ? '' : 's'} configured
        </div>

        <form onSubmit={handleSubmit} className="interview-setup-form">
          <label>
            Candidate name
            <input
              type="text"
              value={candidateName}
              onChange={(event) => setCandidateName(event.target.value)}
              placeholder="e.g. Jordan Lee"
            />
          </label>

          <label>
            Duration
            <select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))}>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </label>

          <Button type="submit" variant="thunder">
            Start Interview
          </Button>
        </form>
      </div>
    </div>
  );
}

export default InterviewSetup;
