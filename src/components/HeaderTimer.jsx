import { useState } from 'react';
import { formatTimer, useTimer } from '../context/TimerContext.jsx';

const YEARS = Array.from({ length: 18 }, (_, index) => 2026 - index);
const SUBJECTS = ['언어이해', '추리논증'];

export default function HeaderTimer() {
  const { timer, start } = useTimer();
  const [year, setYear] = useState(2026);
  const [subject, setSubject] = useState('추리논증');
  if (timer.status !== 'idle') return null;

  const seconds = 0;
  const minutes = Math.floor(seconds / 60) % 60;
  const minuteRotation = minutes * 6 + (seconds % 60) * 0.1;
  const hourRotation = (Math.floor(seconds / 3600) % 12) * 30 + minutes * 0.5;
  const label = '경과 시간';

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
          <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {YEARS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          <span>영역</span>
          <select value={subject} onChange={(event) => setSubject(event.target.value)}>
            {SUBJECTS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => start({ year, subject })}>
          시작
        </button>
      </div>
    </section>
  );
}
