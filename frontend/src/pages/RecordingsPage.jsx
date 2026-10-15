import { useEffect, useState } from 'react';
import { Loader2, Play, Square, Video } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { recordingsApi } from '../api/client';
import { Button } from '../components/ui/Button';

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [urls, setUrls] = useState({});

  useEffect(() => {
    recordingsApi.list().then((data) => setRecordings(data.recordings || [])).finally(() => setLoading(false));
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const play = async (id) => {
    if (playingId === id) {
      setPlayingId(null);
      return;
    }
    try {
      const url = urls[id] || await recordingsApi.stream(id);
      if (!urls[id]) setUrls((prev) => ({ ...prev, [id]: url }));
      setPlayingId(id);
    } catch (err) {
      alert(err.message || 'Could not load recording');
    }
  };

  return (
    <DashboardLayout title="Recordings">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Video className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Interview Recordings</h1>
          <p className="text-sm text-slate-500">Saved interview meeting audio available to authorized interviewers and admins.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {recordings.map((recording) => (
            <div key={recording.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-200">{recording.interviewTitle}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Recorded by {recording.startedBy || 'Interviewer'} · {new Date(recording.createdAt).toLocaleString()} · {formatDuration(recording.durationSeconds)}
                  </p>
                </div>
                <Button variant="outline" size="sm" icon={playingId === recording.id ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />} onClick={() => play(recording.id)}>
                  {playingId === recording.id ? 'Stop' : 'Play'}
                </Button>
              </div>
              {playingId === recording.id && urls[recording.id] && (
                <audio className="w-full mt-4" controls autoPlay src={urls[recording.id]} />
              )}
            </div>
          ))}
          {!recordings.length && <div className="p-10 text-center border border-dashed border-slate-800 rounded-2xl text-sm text-slate-600">No recordings have been saved yet.</div>}
        </div>
      )}
    </DashboardLayout>
  );
}
