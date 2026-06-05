// ===========================================================================
// 행동 이벤트 추적
//   - track('이벤트명', { 속성 })  한 줄로 어디서든 기록
//   - Supabase의 events 테이블에 적재 + (있으면) GA4로도 같은 이벤트 전송
//   - 로그인 안 한 사용자도 익명 세션 ID로 사용 흐름 파악 가능
//   - 추적 실패는 조용히 무시 → 사용자 경험에 절대 영향 주지 않음
// ===========================================================================
(function () {
  // 익명 세션 ID: 브라우저별로 한 번 만들어 재사용 (로그인과 무관)
  const SID_KEY = 'leet_sid';
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

  // 핵심 함수 — window.track 으로 전역 노출
  async function track(name, props = {}) {
    // 1) GA4 로도 전송 (gtag 로드됐을 때만)
    try { if (window.gtag) window.gtag('event', name, props); } catch {}

    // 2) Supabase events 테이블에 적재 (fire-and-forget)
    try {
      if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
      const uid = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.id : null;
      await supabaseClient.from('events').insert({
        name: name,
        props: props,
        session_id: getSessionId(),
        user_id: uid,
        path: location.pathname,
        referrer: document.referrer || null,
      });
    } catch (e) {
      // 의도적 무시 — 추적은 부가기능이라 실패해도 사이트 동작에 영향 X
    }
  }
  window.track = track;

  // ---- 자동 추적 -----------------------------------------------------------
  function init() {
    // 페이지 진입
    track('page_view', { title: document.title });

    // 탭 전환 (계산기 / 기출 / 기록 / 학교환산 / 입시결과)
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        track('tab_view', { tab: btn.dataset.tab || '' });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
