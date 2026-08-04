import { formatTimer, useTimer } from '../context/TimerContext.jsx';

export default function TimerDock({ onOpenLog }) {
  const { timer, remainingSeconds, pause, resume, finish, dismiss } = useTimer();
  if (timer.status === 'idle') return null;

  const endingSoon = timer.status === 'running' && remainingSeconds <= 300;
  const finished = timer.status === 'finished';
  const subject = timer.subject || '실전';

  return (
    <aside className={'timer-dock' + (endingSoon ? ' is-ending' : '') + (finished ? ' is-finished' : '')} aria-label="실전 타이머">
      <div className="timer-dock-copy">
        <span className="timer-dock-label">{finished ? '타이머 종료' : `${timer.year} ${subject}`}</span>
        <strong className="timer-dock-time" aria-live="polite">{finished ? formatTimer(timer.elapsedSeconds) : formatTimer(remainingSeconds)}</strong>
      </div>
      <div className="timer-dock-actions">
        {timer.status === 'running' && <button type="button" onClick={pause}>일시정지</button>}
        {timer.status === 'paused' && <button type="button" onClick={resume}>재개</button>}
        {!finished && <button type="button" className="timer-dock-end" onClick={finish}>종료</button>}
        {finished && <button type="button" className="timer-dock-save" onClick={onOpenLog}>기록 입력</button>}
        {finished && <button type="button" className="timer-dock-close" aria-label="타이머 닫기" onClick={dismiss}>×</button>}
      </div>
    </aside>
  );
}
