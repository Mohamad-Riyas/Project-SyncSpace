import { useState } from "react";
import { Mic, MicOff, Share2, Check } from "lucide-react";
import "./WorkspaceHeader.css";

function WorkspaceHeader({ roomId, workspaceName, workspaceType, inviteCode, collaborators = [], onLeave }) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const link = `${window.location.origin}/workspaces/join?code=${encodeURIComponent(inviteCode || roomId)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: workspaceName || "SyncSpace Workspace", url: link });
      } else {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {}
  };

  return (
    <header className="workspace-header">
      <div className="header-left">
        <span className="syncspace-mark-crop brand-mark"><img src="/SyncSpace%20Logo.png" alt="SyncSpace" /></span>
        <div className="workspace-heading">
          <h2>{workspaceName || "SyncSpace"}</h2>
          <span>{workspaceType}</span>
        </div>
        <span className="room-id">Room: {inviteCode || roomId}</span>
      </div>

      <div className="header-right">
        <button type="button" onClick={() => setIsMicOn(!isMicOn)} style={{ padding: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)', marginRight: '4px' }}>
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-400" />}
        </button>
        <button type="button" onClick={share} title="Share workspace" style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--color-text-main)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          {copied ? 'Copied' : 'Share'}
        </button>
        <span className="connection-status"><span className="status-dot" /> Connected</span>
        <div className="user-avatars">
          {(collaborators.length ? collaborators.slice(0, 4) : []).map((user, index) => (
            <span key={user.id || index} className="avatar" title={user.name}>{String(user.name || '?').slice(0, 2).toUpperCase()}</span>
          ))}
          {collaborators.length > 4 && <span className="avatar">+{collaborators.length - 4}</span>}
        </div>
        <button className="leave-btn" onClick={onLeave}>Leave workspace</button>
      </div>
    </header>
  );
}

export default WorkspaceHeader;
