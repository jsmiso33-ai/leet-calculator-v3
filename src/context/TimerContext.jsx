import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const TIMER_STORAGE_KEY = 'leet_exam_timer_v1';
const IDLE_TIMER = { status: 'idle' };

function loadTimer() {
  try {
    const saved = JSON.parse(localStorage.getItem(TIMER_STORAGE_KEY) || 'null');
    return saved && typeof saved === 'object' ? saved : IDLE_TIMER;
  } catch { return IDLE_TIMER; }
}

function getRemaining(timer, now = Date.now()) {
  if (timer.status !== 'running') return Math.max(0, timer.remainingSeconds || 0);
  return Math.max(0, Math.ceil((timer.endAt - now) / 1000));
}

export function formatTimer(seconds) {
  const safe = Math.max(0, Math.round(seconds || 0));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [timer, setTimer] = useState(loadTimer);
  const [now, setNow] = useState(Date.now());
  const remainingSeconds = getRemaining(timer, now);

  useEffect(() => {
    if (timer.status !== 'running') return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [timer.status]);

  useEffect(() => {
    if (timer.status !== 'running' || remainingSeconds > 0) return;
    setTimer((current) => ({
      ...current,
      status: 'finished',
      remainingSeconds: 0,
      elapsedSeconds: current.durationSeconds,
      endAt: null,
      finishedAt: Date.now(),
    }));
  }, [timer.status, remainingSeconds]);

  useEffect(() => {
    try { localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer)); } catch { /* ignore */ }
  }, [timer]);

  const start = useCallback(({ year, subject, durationMinutes }) => {
    const requestedMinutes = Number(durationMinutes);
    const durationSeconds = Number.isFinite(requestedMinutes)
      ? Math.max(60, Math.round(requestedMinutes * 60))
      : 60;
    setTimer({
      status: 'running', year, subject, durationSeconds,
      remainingSeconds: durationSeconds,
      startedAt: Date.now(), endAt: Date.now() + durationSeconds * 1000,
      elapsedSeconds: 0,
    });
  }, []);

  const pause = useCallback(() => {
    setTimer((current) => {
      if (current.status !== 'running') return current;
      const remaining = getRemaining(current);
      return { ...current, status: 'paused', remainingSeconds: remaining, endAt: null };
    });
  }, []);

  const resume = useCallback(() => {
    setTimer((current) => {
      if (current.status !== 'paused') return current;
      return { ...current, status: 'running', endAt: Date.now() + current.remainingSeconds * 1000 };
    });
  }, []);

  const finish = useCallback(() => {
    setTimer((current) => {
      if (current.status === 'idle' || current.status === 'finished') return current;
      const remaining = getRemaining(current);
      return {
        ...current,
        status: 'finished',
        remainingSeconds: remaining,
        elapsedSeconds: Math.max(0, current.durationSeconds - remaining),
        endAt: null,
        finishedAt: Date.now(),
      };
    });
  }, []);

  const dismiss = useCallback(() => setTimer(IDLE_TIMER), []);

  const value = useMemo(() => ({ timer, remainingSeconds, start, pause, resume, finish, dismiss }), [timer, remainingSeconds, start, pause, resume, finish, dismiss]);
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
}
