import { supabase } from './supabase.js';

// analytics.js 이식 — track('이벤트', {속성}). Supabase leet_activity 테이블 + GA4.
// 테이블/엔드포인트 이름이 'events'면 광고·추적 차단 필터(EasyPrivacy 등)가 /events
// 경로를 추적으로 보고 막아 일부 사용자가 통째로 누락됨. 앱 데이터처럼 보이는 이름 사용.
const ACTIVITY_TABLE = 'leet_activity';
const SID_KEY = 'leet_sid';
// 로컬 개발 환경에서는 events 테이블을 오염시키지 않는다 (프로덕션 동작은 동일).
const isProd = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';

let _uid = null;
export function setAnalyticsUser(uid) { _uid = uid || null; }

function getSessionId() {
  try {
    let sid = localStorage.getItem(SID_KEY);
    if (!sid) {
      sid = 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch { return null; }
}

export async function track(name, props = {}) {
  try { if (window.gtag) window.gtag('event', name, props); } catch { /* noop */ }
  if (!isProd) return;
  try {
    await supabase.from(ACTIVITY_TABLE).insert({
      name,
      props,
      session_id: getSessionId(),
      user_id: _uid,
      path: location.pathname,
      referrer: document.referrer || null,
    });
  } catch { /* 추적 실패는 조용히 무시 */ }
}

const _debTimers = {};
export function trackDebounced(name, props, opts) {
  const key = (opts && opts.key) || name;
  const delay = (opts && opts.delay) || 1200;
  clearTimeout(_debTimers[key]);
  _debTimers[key] = setTimeout(() => track(name, props), delay);
}

// 기존 코드(가드된 window.track 호출)와의 호환을 위해 전역에도 노출
window.track = track;
window.trackDebounced = trackDebounced;
