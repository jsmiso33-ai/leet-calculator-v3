import { useState } from 'react';
import { GraduationCap, X } from 'lucide-react';
import { track } from '../lib/analytics.js';

// 2027학년도 모집요강 반영 공지 배너 — 한 번 닫으면 다시 보여주지 않는다.
const DISMISS_KEY = 'leet_update_2027schools_v1';

export default function UpdateBanner({ onGo }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  return (
    <div className="notice-banner notice-banner--update tw:!mb-4 tw:!flex tw:!items-center tw:!gap-3 tw:!rounded-xl tw:!border tw:!border-emerald-200 tw:!bg-gradient-to-r tw:!from-emerald-50 tw:!to-teal-50 tw:!px-4 tw:!py-3 tw:!shadow-sm">
      <GraduationCap className="notice-banner__icon" size={20} strokeWidth={2} aria-hidden="true" />
      <div className="notice-banner__content tw:!min-w-0 tw:!flex-1">
        <div className="notice-banner__eyebrow tw:!text-[11px] tw:!font-extrabold tw:!tracking-wide tw:!text-emerald-700">UPDATE · 2027학년도 모집요강 반영</div>
        <div className="notice-banner__message tw:!truncate tw:!text-sm tw:!font-bold tw:!text-slate-900">
          25개 로스쿨 반영비율·환산식이 2027학년도 기준으로 업데이트됐습니다
        </div>
      </div>
      <button
        type="button"
        className="notice-banner__action tw:!shrink-0 tw:!rounded-lg tw:!bg-emerald-600 tw:!px-3.5 tw:!py-2 tw:!text-sm tw:!font-bold tw:!text-white tw:transition-colors tw:hover:!bg-emerald-700"
        onClick={() => { track('update_2027_banner_click', {}); onGo(); }}
      >
        확인하기
      </button>
      <button
        type="button"
        className="notice-banner__close tw:!shrink-0 tw:!p-1 tw:!text-base tw:!leading-none tw:!text-slate-400 tw:hover:!text-slate-600"
        aria-label="2027학년도 업데이트 배너 닫기"
        onClick={dismiss}
      >
        <X size={18} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
