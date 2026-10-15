/**
 * Interview Service — frontend adapters for Interview Mode.
 *
 * There is no dedicated interview REST API in the current backend
 * (Socket.IO room server only). These methods persist locally via the
 * workspace store when possible and stay ready to swap in real HTTP calls.
 *
 * Future endpoints could follow the existing /api style:
 * POST /interviews, GET /interviews/:id, POST /interviews/:id/start|pause|end
 */

const LOG_PREFIX = '[InterviewService]';

/**
 * Create a new interview session for a workspace.
 */
export const createInterview = async (workspaceId, data) => {
  console.log(LOG_PREFIX, 'createInterview', { workspaceId, data });
  return {
    id: `interview-${workspaceId}-${Date.now()}`,
    workspaceId,
    status: 'scheduled',
    ...data,
    createdAt: new Date().toISOString(),
  };
};

/**
 * Fetch interview data by workspace ID.
 */
export const getInterview = async (workspaceId) => {
  console.log(LOG_PREFIX, 'getInterview', { workspaceId });
  return null; // No backend yet — caller falls back to local state
};

/**
 * Update interview fields (status, notes, etc.).
 */
export const updateInterview = async (workspaceId, updates) => {
  console.log(LOG_PREFIX, 'updateInterview', { workspaceId, updates });
  return { workspaceId, ...updates, updatedAt: new Date().toISOString() };
};

/**
 * Start an interview session.
 */
export const startInterview = async (workspaceId, data = {}) => {
  console.log(LOG_PREFIX, 'startInterview', { workspaceId, data });
  return { workspaceId, status: 'active', startedAt: new Date().toISOString(), ...data };
};

/**
 * Pause an active interview.
 */
export const pauseInterview = async (workspaceId) => {
  console.log(LOG_PREFIX, 'pauseInterview', { workspaceId });
  return { workspaceId, status: 'paused' };
};

/**
 * Resume a paused interview.
 */
export const resumeInterview = async (workspaceId) => {
  console.log(LOG_PREFIX, 'resumeInterview', { workspaceId });
  return { workspaceId, status: 'active' };
};

/**
 * End an interview session.
 */
export const endInterview = async (workspaceId) => {
  console.log(LOG_PREFIX, 'endInterview', { workspaceId });
  return { workspaceId, status: 'completed', endedAt: new Date().toISOString() };
};

/**
 * Save interviewer notes.
 */
export const saveNotes = async (workspaceId, notes) => {
  console.log(LOG_PREFIX, 'saveNotes', { workspaceId, notesLength: notes.length });
  return { workspaceId, notes, savedAt: new Date().toISOString() };
};

/**
 * Fetch questions for an interview.
 * Currently returns null — the caller uses the local question bank.
 */
export const getQuestions = async (workspaceId) => {
  console.log(LOG_PREFIX, 'getQuestions', { workspaceId });
  return null;
};
