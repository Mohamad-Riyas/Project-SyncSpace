import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { InterviewRole, InterviewStatus } from '../types/interview.types';
import * as interviewService from '../services/interviewService';
import { getCurrentUserName } from '../../../data/currentUser';
import { getInterviewRecord, saveInterviewRecord } from '../../../data/workspaceStore';
import { interviewsApi } from '../../../api/client';

const initials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

export function useInterview(workspaceId, workspace, backendInterview = null, authRole = null) {
  const saved = getInterviewRecord(workspaceId) || {};
  const isBackend = Boolean(backendInterview);
  const interviewerName =
    backendInterview?.interviewer?.name ||
    getCurrentUserName() ||
    workspace?.owner ||
    'Interviewer';
  const candidateName =
    backendInterview?.candidateInfo?.name ||
    (backendInterview?.candidateEmail ? backendInterview.candidateEmail.split('@')[0] : '') ||
    saved.candidateName ||
    'Candidate';

  const [status, setStatus] = useState(backendInterview?.status || saved.status || InterviewStatus.SCHEDULED);
  const [role] = useState(
    authRole === 'admin' || authRole === 'interviewer'
      ? InterviewRole.INTERVIEWER
      : InterviewRole.CANDIDATE
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(saved.elapsedSeconds || 0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(saved.currentQuestionIndex || 0);
  const [notes, setNotes] = useState(backendInterview?.notes || saved.notes || '');
  const timerRef = useRef(null);
  const elapsedRef = useRef(elapsedSeconds);

  useEffect(() => {
    if (backendInterview?.status) setStatus(backendInterview.status);
    if (backendInterview?.notes !== undefined) setNotes(backendInterview.notes || '');
  }, [backendInterview?.status, backendInterview?.notes]);

  elapsedRef.current = elapsedSeconds;

  const questions = useMemo(() => {
    if (isBackend) {
      return Array.isArray(backendInterview?.questions) ? backendInterview.questions : [];
    }
    return [];
  }, [isBackend, backendInterview?.questions]);

  const currentQuestion = questions[currentQuestionIndex] || questions[0] || null;

  const persist = useCallback((patch) => {
    saveInterviewRecord(workspaceId, {
      status,
      role,
      candidateName,
      elapsedSeconds: elapsedRef.current,
      currentQuestionIndex,
      notes,
      ...patch,
    });
  }, [workspaceId, status, role, candidateName, currentQuestionIndex, notes]);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);
  useEffect(() => {
    if (status === InterviewStatus.ACTIVE) startTimer();
  }, [status, startTimer]);

  const nextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => {
      const next = Math.min(prev + 1, Math.max(questions.length - 1, 0));
      persist({ currentQuestionIndex: next });
      return next;
    });
  }, [questions.length, persist]);

  const prevQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      persist({ currentQuestionIndex: next });
      return next;
    });
  }, [persist]);

  const saveNotes = useCallback(async () => {
    persist({ notes });
    if (isBackend && backendInterview?.id) {
      await interviewsApi.update(backendInterview.id, { notes });
    } else {
      await interviewService.saveNotes(workspaceId, notes);
    }
  }, [backendInterview?.id, isBackend, notes, persist, workspaceId]);

  const configureAndStart = useCallback(async (setup = {}) => {
    if (isBackend && backendInterview?.id) {
      const { interview } = await interviewsApi.start(backendInterview.id);
      setStatus(interview.status);
      setElapsedSeconds(0);
      setCurrentQuestionIndex(0);
      startTimer();
      persist({ status: interview.status, elapsedSeconds: 0, currentQuestionIndex: 0 });
      return interview;
    }

    const next = {
      status: InterviewStatus.ACTIVE,
      role,
      candidateName: setup.candidateName || candidateName,
      elapsedSeconds: 0,
      currentQuestionIndex: 0,
      startedAt: new Date().toISOString(),
    };
    setStatus(next.status);
    setElapsedSeconds(0);
    setCurrentQuestionIndex(0);
    persist(next);
    startTimer();
    return interviewService.startInterview(workspaceId, next);
  }, [backendInterview?.id, candidateName, isBackend, persist, role, startTimer, workspaceId]);

  const pauseInterview = useCallback(() => {
    setStatus(InterviewStatus.PAUSED);
    stopTimer();
    persist({ status: InterviewStatus.PAUSED, elapsedSeconds: elapsedRef.current });
  }, [persist, stopTimer]);

  const resumeInterview = useCallback(() => {
    setStatus(InterviewStatus.ACTIVE);
    persist({ status: InterviewStatus.ACTIVE });
    startTimer();
  }, [persist, startTimer]);

  const endInterview = useCallback(async () => {
    stopTimer();
    if (isBackend && backendInterview?.id) {
      await interviewsApi.end(backendInterview.id);
    }
    setStatus(InterviewStatus.COMPLETED);
    persist({
      status: InterviewStatus.COMPLETED,
      elapsedSeconds: elapsedRef.current,
      endedAt: new Date().toISOString(),
    });
    if (!isBackend) await interviewService.endInterview(workspaceId);
  }, [backendInterview?.id, isBackend, persist, stopTimer, workspaceId]);

  return {
    status,
    role,
    interviewer: {
      id: backendInterview?.interviewer?.id || backendInterview?.interviewer || 'interviewer',
      name: interviewerName,
      role: InterviewRole.INTERVIEWER,
      status: 'online',
      avatar: initials(interviewerName),
    },
    candidate: {
      id: backendInterview?.candidate || 'candidate',
      name: candidateName,
      role: InterviewRole.CANDIDATE,
      status: 'online',
      avatar: initials(candidateName),
    },
    elapsedSeconds,
    durationMinutes: backendInterview?.durationMinutes || 60,
    questions,
    currentQuestion,
    currentQuestionIndex,
    nextQuestion,
    prevQuestion,
    notes,
    setNotes,
    saveNotes,
    configureAndStart,
    pauseInterview,
    resumeInterview,
    endInterview,
  };
}
