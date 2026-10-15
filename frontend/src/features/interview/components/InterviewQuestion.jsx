import { ChevronLeft, ChevronRight, ListChecks } from 'lucide-react';

export function InterviewQuestion({
  question,
  questionIndex = 0,
  total = 0,
  onPrev,
  onNext,
}) {
  if (!question) {
    return (
      <div className="interview-panel-card">
        <p className="text-sm text-slate-400">No questions available for this interview.</p>
      </div>
    );
  }

  return (
    <div className="interview-panel-card interview-question-card">
      <div className="interview-panel-heading">
        <ListChecks className="w-4 h-4 text-cyan-400" />
        <h3>Interview Question</h3>
        <span className="interview-question-count">
          {questionIndex + 1} / {total}
        </span>
      </div>

      <div className="interview-question-meta">
        <span className="interview-category">{question.category || 'General'}</span>
      </div>

      <h4 className="interview-question-title">{question.title}</h4>
      <p className="interview-question-body">{question.description}</p>

      <div className="interview-question-nav">
        <button type="button" onClick={onPrev} disabled={questionIndex === 0}>
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button type="button" onClick={onNext} disabled={questionIndex >= total - 1}>
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default InterviewQuestion;
