import { useEffect, useRef, useState } from 'react';
import { formatTimer, useTimer } from '../context/TimerContext.jsx';

export default function TimerDock({ onOpenLog }) {
  const { timer, elapsedSeconds, pause, resume, finish, dismiss } = useTimer();
  const primaryActionRef = useRef(null);
  const [isTimerModal, setIsTimerModal] = useState(true);

  useEffect(() => {
    if (timer.status !== 'idle') primaryActionRef.current?.focus();
  }, [timer.status]);

  useEffect(() => {
    if (timer.status !== 'idle') setIsTimerModal(true);
  }, [timer.status]);

  if (timer.status === 'idle') return null;

  const finished = timer.status === 'finished';
  const subject = timer.subject || '실전';
  const handleOpenLog = () => {
    setIsTimerModal(false);
    onOpenLog();
  };

  return (
    <aside className={'timer-dock' + (isTimerModal ? ' is-timer-modal' : '') + (finished ? ' is-finished' : '')} aria-label="실전 타이머">
      <div className="timer-dock-copy">
        <span className="timer-dock-label">{finished ? '타이머 종료' : `${timer.year} ${subject} · 경과 시간`}</span>
        <strong className="timer-dock-time">{formatTimer(elapsedSeconds)}</strong>
        {finished && <span className="timer-dock-announcement" aria-live="polite">타이머가 종료되었습니다.</span>}
      </div>
      <div className="timer-dock-actions">
        {timer.status === 'running' && <button ref={primaryActionRef} type="button" onClick={pause}>일시정지</button>}
        {timer.status === 'paused' && <button ref={primaryActionRef} type="button" onClick={resume}>재개</button>}
        {!finished && <button type="button" className="timer-dock-end" onClick={finish}>종료</button>}
        {finished && <button ref={primaryActionRef} type="button" className="timer-dock-save" onClick={handleOpenLog}>기록 입력</button>}
        {finished && <button type="button" className="timer-dock-close" aria-label="타이머 닫기" onClick={dismiss}>×</button>}
      </div>
    </aside>
  );
}
