import { User } from 'lucide-react';

/**
 * CandidateInfo — shows interviewer and candidate info cards.
 */
export function CandidateInfo({ interviewer, candidate }) {
  const PersonCard = ({ person, label }) => (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-300">
        {person.avatar || person.name?.charAt(0) || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
        <p className="text-sm font-semibold text-slate-200 truncate">{person.name}</p>
      </div>
      <div className="flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${person.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
        <span className="text-[10px] text-slate-400">{person.status === 'online' ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <PersonCard person={interviewer} label="Interviewer" />
      <PersonCard person={candidate} label="Candidate" />
    </div>
  );
}

export default CandidateInfo;
