import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const TIMER_STORAGE_KEY = 'leet_exam_timer_v2';
const IDLE_TIMER = { status: 'idle' };

function loadTimer() {
  try {
    const saved = JSON.parse(localStorage.getItem(TIMER_STORAGE_KEY) || 'null');
    return saved && typeof saved === 'object' ? saved : IDLE_TIMER;
  } catch { return IDLE_TIMER; }
}

function getElapsed(timer, now = Date.now()) {
  const elapsed = Math.max(0, timer.elapsedSeconds || 0);
  if (timer.status !== 'running') return elapsed;
  return elapsed + Math.max(0, Math.floor((now - timer.startedAt) / 1000));
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
  const elapsedSeconds = getElapsed(timer, now);

  useEffect(() => {
    if (timer.status !== 'running') return undefined;
    const updateNow = () => setNow(Date.now());
    updateNow();
    const id = window.setInterval(updateNow, 1000);
    document.addEventListener('visibilitychange', updateNow);
    window.addEventListener('focus', updateNow);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', updateNow);
      window.removeEventListener('focus', updateNow);
    };
  }, [timer.status]);

  useEffect(() => {
    try { localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer)); } catch { /* ignore */ }
  }, [timer]);

  const start = useCallback(({ year, subject }) => {
    const startedAt = Date.now();
    setNow(startedAt);
    setTimer({
      status: 'running', year, subject,
      startedAt,
      elapsedSeconds: 0,
    });
  }, []);

  const pause = useCallback(() => {
    setTimer((current) => {
      if (current.status !== 'running') return current;
      const elapsedSeconds = getElapsed(current);
      return { ...current, status: 'paused', elapsedSeconds, startedAt: null };
    });
  }, []);

  const resume = useCallback(() => {
    const resumedAt = Date.now();
    setNow(resumedAt);
    setTimer((current) => {
      if (current.status !== 'paused') return current;
      return { ...current, status: 'running', startedAt: resumedAt };
    });
  }, []);

  const finish = useCallback(() => {
    setTimer((current) => {
      if (current.status === 'idle' || current.status === 'finished') return current;
      const elapsedSeconds = getElapsed(current);
      return {
        ...current,
        status: 'finished',
        elapsedSeconds,
        startedAt: null,
        finishedAt: Date.now(),
      };
    });
  }, []);

  const dismiss = useCallback(() => setTimer(IDLE_TIMER), []);

  const value = useMemo(() => ({ timer, elapsedSeconds, start, pause, resume, finish, dismiss }), [timer, elapsedSeconds, start, pause, resume, finish, dismiss]);
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
}
