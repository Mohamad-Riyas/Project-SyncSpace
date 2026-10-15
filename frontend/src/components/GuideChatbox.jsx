import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Minus, Send, Trash2, Bot, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { FAQ_ENTRIES, matchFaq } from '../data/guideFaq';
import './GuideChatbox.css';

const WELCOME = { role: 'assistant', text: "Hi! I'm the SyncSpace Guide. Ask me about workspaces, interviews, the whiteboard, code editor, files, recording, or account roles." };
const CHAT_POSITION_KEY = 'syncspace-guide-chat-position';

export function GuideChatbox() {
  const location = useLocation();
  const isWorkspaceContext = location.pathname.startsWith('/workspaces/') || location.pathname.startsWith('/interview/');
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const bodyRef = useRef(null);
  const containerRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [position, setPosition] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(CHAT_POSITION_KEY) || 'null');
    } catch {
      return null;
    }
  });
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [messages, thinking]);
  useEffect(() => {
    if (position) window.localStorage.setItem(CHAT_POSITION_KEY, JSON.stringify(position));
  }, [position]);
  // Window listeners instead of pointer capture, so the toggle's click still fires; drag starts after 5px.
  const beginDrag = (event) => {
    if (!isWorkspaceContext || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (event.target.closest('.guide-chatbox-header button')) return;
    const rect = containerRef.current.getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height, moved: false };
    const onMove = (move) => {
      const dx = move.clientX - start.x;
      const dy = move.clientY - start.y;
      if (!start.moved && Math.hypot(dx, dy) < 5) return;
      start.moved = true;
      setIsDragging(true);
      setPosition({
        left: Math.max(12, Math.min(window.innerWidth - start.width - 12, start.left + dx)),
        top: Math.max(12, Math.min(window.innerHeight - start.height - 12, start.top + dy)),
      });
    };
    const onEnd = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      setIsDragging(false);
      if (start.moved) {
        suppressClickRef.current = true;
        window.setTimeout(() => { suppressClickRef.current = false; }, 0);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
  };
  const send = (text) => {
    const trimmed = String(text || '').trim(); if (!trimmed || thinking) return;
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]); setInput(''); setThinking(true);
    window.setTimeout(() => { const match = matchFaq(trimmed); const reply = match ? match.answer : "I don't have a specific answer yet. Try asking about workspaces, interviews, files, running code, recording, or roles."; setMessages((prev) => [...prev, { role: 'assistant', text: reply }]); setThinking(false); }, 280);
  };
  const clearConversation = () => setMessages([WELCOME]);
  return <div
    ref={containerRef}
    className={`guide-chatbox-container ${isWorkspaceContext ? 'workspace-context' : ''} ${isDragging ? 'is-dragging' : ''}`}
    style={isWorkspaceContext && position ? { left: position.left, top: position.top, right: 'auto', bottom: 'auto' } : undefined}
  >
    {isOpen && <div className={`guide-chatbox-window ${minimized ? 'guide-minimized' : ''}`}>
      <div className="guide-chatbox-header" onPointerDown={beginDrag}><div className="guide-title"><div className="guide-avatar"><Bot /></div><div><h3>SyncSpace Guide</h3><span><i /> Online help</span></div></div><div className="guide-header-actions"><button onClick={() => setMinimized((m) => !m)} className="guide-close-btn" aria-label={minimized ? 'Expand' : 'Minimize'}><Minus /></button><button onClick={clearConversation} className="guide-close-btn" aria-label="Clear conversation"><Trash2 /></button><button onClick={() => setIsOpen(false)} className="guide-close-btn" aria-label="Close"><X /></button></div></div>
      {!minimized && <><div className="guide-chatbox-body" ref={bodyRef}>{messages.map((m, i) => <div key={i} className={`guide-message-row ${m.role}`}><div className="guide-message-bubble">{m.role === 'assistant' && <Bot className="message-bot" /> }<span>{m.text}</span></div></div>)}{thinking && <div className="guide-message-row assistant"><div className="guide-message-bubble thinking"><Sparkles className="message-bot" /> Thinking…</div></div>}</div>
        <div className="guide-suggestions">{FAQ_ENTRIES.slice(0, 3).map((f) => <button key={f.id} className="guide-suggestion-chip" onClick={() => send(f.question)}>{f.question}</button>)}</div>
        <form className="guide-chatbox-input-row" onSubmit={(e) => { e.preventDefault(); send(input); }}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask SyncSpace…" aria-label="Ask the SyncSpace guide" /><button type="submit" aria-label="Send" disabled={!input.trim() || thinking}><Send /></button></form>
      </>}
    </div>}
    {!isOpen && <button className="guide-chatbox-toggle" onPointerDown={beginDrag} onClick={() => { if (suppressClickRef.current) return; setIsOpen(true); setMinimized(false); }} aria-label="Open help chat"><MessageCircle /></button>}
  </div>;
}
export default GuideChatbox;
