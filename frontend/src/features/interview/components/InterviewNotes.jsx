import { StickyNote, Save } from 'lucide-react';

/**
 * InterviewNotes — textarea for interviewer notes with save button.
 */
export function InterviewNotes({ notes, onNotesChange, onSave }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">Interview Notes</h3>
        </div>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
        >
          <Save className="w-3 h-3" />
          Save
        </button>
      </div>
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Write your interview observations and feedback here..."
        className="flex-1 w-full bg-slate-950 text-sm text-slate-200 placeholder-slate-600 p-3 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/30 rounded-b-xl"
      />
    </div>
  );
}

export default InterviewNotes;
