import { useState } from 'react';
import { formatTimer, useTimer } from '../context/TimerContext.jsx';

const YEARS = Array.from({ length: 18 }, (_, index) => 2026 - index);
const PRESETS = { '언어이해': 70, '추리논증': 125 };

export default function HeaderTimer() {
  const { timer, remainingSeconds, start } = useTimer();
  const [year, setYear] = useState(2026);
  const [subject, setSubject] = useState('추리논증');
  const [durationMinutes, setDurationMinutes] = useState(PRESETS['추리논증']);
  if (timer.status !== 'idle') return null;

  const running = timer.status === 'running' || timer.status === 'paused';
  const seconds = timer.status === 'idle' ? 125 * 60 : timer.status === 'finished' ? timer.elapsedSeconds : remainingSeconds;
  const minutes = Math.floor(seconds / 60) % 60;
  const minuteRotation = minutes * 6 + (seconds % 60) * 0.1;
  const hourRotation = (Math.floor(seconds / 3600) % 12) * 30 + minutes * 0.5;
  const label = timer.status === 'running' ? '진행 중' : timer.status === 'paused' ? '일시정지' : timer.status === 'finished' ? '종료' : '타이머';
  const changeSubject = (next) => {
    setSubject(next);
    setDurationMinutes(PRESETS[next]);
  };

  return (
    <section className="timer-setup-card" aria-live="polite" aria-label={`${label} ${formatTimer(seconds)}`}>
      <div className="timer-setup-summary">
        <div className="header-analog-clock" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => <i key={index} className="header-clock-tick" style={{ '--tick-rotation': `${index * 30}deg` }} />)}
          <span className="header-clock-hand header-clock-hour" style={{ transform: `rotate(${hourRotation}deg)` }} />
          <span className="header-clock-hand header-clock-minute" style={{ transform: `rotate(${minuteRotation}deg)` }} />
          <span className="header-clock-pin" />
        </div>
        <div className="header-timer-copy">
          <span>{label}</span>
          <strong>{formatTimer(seconds)}</strong>
        </div>
      </div>
      <div className="header-timer-controls">
        <label>
          <span>학년도</span>
          <select value={year} onChange={(event) => setYear(Number(event.target.value))} disabled={running}>
            {YEARS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          <span>영역</span>
          <select value={subject} onChange={(event) => changeSubject(event.target.value)} disabled={running}>
            {Object.keys(PRESETS).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          <span>시간(분)</span>
          <input type="number" inputMode="numeric" min="1" max="300" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} disabled={running} />
        </label>
        <button type="button" disabled={running || Number(durationMinutes) < 1} onClick={() => start({ year, subject, durationMinutes })}>
          {running ? '실행 중' : '시작'}
        </button>
      </div>
    </section>
  );
}
