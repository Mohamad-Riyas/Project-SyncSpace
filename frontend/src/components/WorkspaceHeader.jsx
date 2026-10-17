import { useState } from "react";
import { Mic, MicOff, Share2, Check } from "lucide-react";
import { ThemeToggle } from "./ui/ThemeToggle";
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
        <ThemeToggle className="workspace-theme-toggle" />
        <button type="button" onClick={() => setIsMicOn(!isMicOn)} className="workspace-control-button" aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}>
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-400" />}
        </button>
        <button type="button" onClick={share} title="Share workspace" className="workspace-control-button workspace-share-button">
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
