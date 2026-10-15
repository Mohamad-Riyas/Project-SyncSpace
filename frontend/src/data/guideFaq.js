/**
 * Rule-based knowledge base for the global Guide chatbox.
 *
 * There is no AI/LLM backend wired up for this chat yet — this is a real,
 * working keyword-matching FAQ system, not a placeholder. The `match()`
 * function below is written so a real API call (see api/client.js style)
 * can be dropped in later without changing the UI.
 */
export const FAQ_ENTRIES = [
  {
    id: 'join-interview',
    question: 'How do I join an interview?',
    keywords: ['join', 'interview', 'code', 'candidate'],
    answer:
      "Go to Interviews → Join Interview, then enter the 6-character code your interviewer shared with you (or open the link they sent). You'll land on a pre-join screen where you can test your microphone before the real join happens.",
  },
  {
    id: 'create-interview',
    question: 'How do I create an interview?',
    keywords: ['create', 'schedule', 'new interview', 'interviewer', 'start interview'],
    answer:
      "If you're signed in as an Interviewer or Admin, go to Interviews → Create Interview. Give it a title, optionally lock it to a candidate's email, and you'll get a shareable code and link right away.",
  },
  {
    id: 'find-interviews',
    question: 'Where can I find my interviews?',
    keywords: ['find', 'my interviews', 'list', 'history'],
    answer: 'The Interviews page lists everything you\'ve created (as an interviewer) or joined (as a candidate), with live status.',
  },
  {
    id: 'whiteboard',
    question: 'How do I use the whiteboard?',
    keywords: ['whiteboard', 'draw', 'diagram', 'canvas'],
    answer:
      'Open a workspace or interview and switch to the Whiteboard panel. Use the toolbar to pick a pen, shape, or eraser — everything you draw syncs live to everyone else in the room.',
  },
  {
    id: 'code-editor',
    question: 'How do I run my code?',
    keywords: ['run code', 'code editor', 'monaco', 'execute'],
    answer:
      "The Code Editor panel supports JavaScript, TypeScript, Python, Java, C++, HTML, CSS, and JSON, and syncs in real time via Yjs. Check the editor toolbar for a Run action where supported.",
  },
  {
    id: 'microphone',
    question: 'Why isn\'t my microphone working?',
    keywords: ['microphone', 'mic', 'audio', 'mute'],
    answer:
      "Make sure you allowed microphone access when your browser prompted you. On the pre-join screen you can retest it, and inside the workspace the mic icon in the header shows connecting/connected/error states.",
  },
  {
    id: 'roles',
    question: 'What can each account role do?',
    keywords: ['role', 'admin', 'interviewer', 'candidate', 'permission'],
    answer:
      'Admins manage users and all interviews. Interviewers create and run interviews and see notes/controls candidates don\'t. Candidates join interviews, and use the editor, whiteboard, chat, and mic.',
  },
];

export function matchFaq(userText) {
  const text = String(userText || '').toLowerCase();
  if (!text.trim()) return null;

  let best = null;
  let bestScore = 0;
  for (const entry of FAQ_ENTRIES) {
    const score = entry.keywords.reduce((sum, kw) => (text.includes(kw.toLowerCase()) ? sum + 1 : sum), 0);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore > 0 ? best : null;
}
