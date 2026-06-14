import { useEffect, useState } from 'react';

// 2027학년도 LEET 시험일까지 D-day. KST 자정 기준으로 남은 일수를 계산.
const EXAM_KST = { y: 2026, m: 7, d: 19 }; // 2026-07-19 (토)
const EXAM_UTC = Date.UTC(EXAM_KST.y, EXAM_KST.m - 1, EXAM_KST.d);

function getDday() {
  const now = new Date();
  // 현재 시각을 KST로 옮긴 뒤 그날 자정(UTC 기준 숫자)으로 환산
  const kst = new Date(now.getTime() + 9 * 3600e3);
  const todayMidnight = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate());
  return Math.round((EXAM_UTC - todayMidnight) / 86400e3);
}

export default function DdayBadge() {
  const [dday, setDday] = useState(getDday);

  // 자정을 넘겨도 숫자가 갱신되도록 1시간마다 재계산
  useEffect(() => {
    const t = setInterval(() => setDday(getDday()), 3600e3);
    return () => clearInterval(t);
  }, []);

  const label = dday > 0 ? `D-${dday}` : dday === 0 ? 'D-DAY' : `D+${Math.abs(dday)}`;

  return (
    <div className="dday-badge" role="img" aria-label={`2027학년도 LEET 시험 ${dday > 0 ? `${dday}일 전` : dday === 0 ? '당일' : `${Math.abs(dday)}일 경과`}`}>
      <span className="dday-num">{label}</span>
      <span className="dday-date">7.19<span className="dday-dow"> SAT</span></span>
    </div>
  );
}
