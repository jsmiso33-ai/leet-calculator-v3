// auth.js에서 이식 — 동일 백엔드(공개 anon 키)
const SUPABASE_URL = 'https://bokmpwwcjiqqzffxrxnk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva21wd3djamlxcXpmZnhyeG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMDAzOTUsImV4cCI6MjA5Mjc3NjM5NX0.xbRnEVxIiOZ1JwNJlcPl9WpkC8WmpgVQVzCnwfue5A8';
const AUTH_STORAGE_KEY = 'sb-bokmpwwcjiqqzffxrxnk-auth-token';

// @supabase/supabase-js(약 200KB)는 첫 화면 렌더를 막지 않도록 처음 필요할 때 동적으로 불러온다.
// 로그인 없이 계산기만 쓰는 방문자는 초기 번들에서 이 비용을 내지 않는다.
let clientPromise = null;

export function getSupabase() {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js')
      .then(({ createClient }) =>
        // Safari ITP가 PKCE code_verifier를 지워 로그인이 간헐 실패 → implicit 흐름 사용
        createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
        })
      )
      .catch((e) => {
        clientPromise = null; // 네트워크 실패 후 다음 호출에서 재시도할 수 있게
        throw e;
      });
  }
  return clientPromise;
}

// 저장된 세션이 있거나 OAuth 리다이렉트로 돌아온 경우엔 로그인 상태를 바로 복원해야 한다.
export function hasStoredSession() {
  try {
    if (/(^|[#&])(access_token|error_description)=/.test(location.hash)) return true;
    return !!localStorage.getItem(AUTH_STORAGE_KEY);
  } catch { return false; }
}

// 브라우저가 한가해질 때까지 기다린다(첫 입력·렌더와 경쟁하지 않도록).
export function afterIdle(timeout = 3000) {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => resolve(), { timeout });
    else setTimeout(resolve, 1500);
  });
}

// 30초 타임아웃 래퍼 (Supabase 응답이 영원히 안 오는 상황 방지)
export function withTimeout(promise, ms, label) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label || '네트워크'} 응답 없음 (${ms / 1000}초 초과)`)), ms)
  );
  return Promise.race([promise, timeout]);
}
