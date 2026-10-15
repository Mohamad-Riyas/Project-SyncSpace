/**
 * Interview Mode — Type Definitions
 *
 * Plain-JS enums and JSDoc shapes used throughout the interview feature.
 * Mirrors the project's existing convention in src/types/*.js.
 */

// ─── Enums ───────────────────────────────────────────────

export const InterviewStatus = {
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

export const InterviewRole = {
  INTERVIEWER: 'interviewer',
  CANDIDATE: 'candidate',
};

export const QuestionCategory = {
  ALGORITHMS: 'Algorithms',
  DATA_STRUCTURES: 'Data Structures',
  JAVASCRIPT: 'JavaScript',
  REACT: 'React',
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  DATABASE: 'Database',
  SYSTEM_DESIGN: 'System Design',
  FUNDAMENTALS: 'Programming Fundamentals',
};

// ─── Shape Documentation (JSDoc) ─────────────────────────

/**
 * @typedef {Object} InterviewParticipant
 * @property {string} id
 * @property {string} name
 * @property {'interviewer'|'candidate'} role
 * @property {'online'|'offline'} status
 * @property {string} [avatar] - Initials or image URL
 */

/**
 * @typedef {Object} InterviewQuestion
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} category
 * @property {string} [starterCode]
 */

/**
 * @typedef {Object} InterviewNote
 * @property {string} id
 * @property {string} content
 * @property {string} createdAt
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} InterviewState
 * @property {string} workspaceId
 * @property {'scheduled'|'active'|'paused'|'completed'} status
 * @property {InterviewParticipant} interviewer
 * @property {InterviewParticipant} candidate
 * @property {number} elapsedSeconds
 * @property {number} currentQuestionIndex
 * @property {InterviewQuestion[]} questions
 * @property {string} notes
 * @property {string} [startedAt]
 * @property {string} [endedAt]
 */
