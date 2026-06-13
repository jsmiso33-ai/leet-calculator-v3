import { useEffect, useState } from 'react';
import { supabase, withTimeout } from '../lib/supabase.js';
import { track } from '../lib/analytics.js';

// 오늘의 지문 홍보 배너 — daily 탭 밖에서 최신 발행분을 한 줄로 노출.
// 이미 푼 지문이거나 사용자가 닫은 지문(id 기준)은 다시 보여주지 않는다.
const DONE_KEY = 'leet_daily_v1';
const DISMISS_KEY = 'leet_daily_promo_v1';

function fmtShort(iso) {
  const [, m, d] = iso.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}

export default function DailyPromo({ onGo }) {
  const [row, setRow] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await withTimeout(
          supabase.from('daily_passages')
            .select('id, publish_date, passage_title, topic')
            .eq('status', 'published').order('publish_date', { ascending: false }).limit(1),
          15000, '오늘의 지문 배너'
        );
        if (alive && !error && data?.length) setRow(data[0]);
      } catch { /* 배너는 실패해도 조용히 생략 */ }
    })();
    return () => { alive = false; };
  }, []);

  if (!row || dismissed) return null;
  try {
    if (localStorage.getItem(DISMISS_KEY) === row.id) return null;
    const done = JSON.parse(localStorage.getItem(DONE_KEY) || '{}');
    if (done[row.id]) return null;
  } catch { /* ignore */ }

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, row.id); } catch { /* ignore */ }
  };

  return (
    <div className="tw:!mb-4 tw:!flex tw:!items-center tw:!gap-3 tw:!rounded-xl tw:!border tw:!border-blue-200 tw:!bg-gradient-to-r tw:!from-blue-50 tw:!to-indigo-50 tw:!px-4 tw:!py-3 tw:!shadow-sm">
      <span className="tw:!text-xl" aria-hidden="true">📖</span>
      <div className="tw:!min-w-0 tw:!flex-1">
        <div className="tw:!text-[11px] tw:!font-extrabold tw:!tracking-wide tw:!text-blue-700">NEW · 오늘의 지문</div>
        <div className="tw:!truncate tw:!text-sm tw:!font-bold tw:!text-slate-900">
          {fmtShort(row.publish_date)} — {row.passage_title}
        </div>
      </div>
      <button
        type="button"
        className="tw:!shrink-0 tw:!rounded-lg tw:!bg-blue-600 tw:!px-3.5 tw:!py-2 tw:!text-sm tw:!font-bold tw:!text-white tw:transition-colors tw:hover:!bg-blue-700"
        onClick={() => { track('daily_promo_click', {}); onGo(); }}
      >
        풀어보기
      </button>
      <button
        type="button"
        className="tw:!shrink-0 tw:!p-1 tw:!text-base tw:!leading-none tw:!text-slate-400 tw:hover:!text-slate-600"
        aria-label="오늘의 지문 배너 닫기"
        onClick={dismiss}
      >
        ✕
      </button>
    </div>
  );
}
