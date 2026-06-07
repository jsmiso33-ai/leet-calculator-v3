import { createClient } from '@supabase/supabase-js';

// auth.js에서 이식 — 동일 백엔드(공개 anon 키)
const SUPABASE_URL = 'https://bokmpwwcjiqqzffxrxnk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva21wd3djamlxcXpmZnhyeG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMDAzOTUsImV4cCI6MjA5Mjc3NjM5NX0.xbRnEVxIiOZ1JwNJlcPl9WpkC8WmpgVQVzCnwfue5A8';

// Safari ITP가 PKCE code_verifier를 지워 로그인이 간헐 실패 → implicit 흐름 사용
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
});

// 30초 타임아웃 래퍼 (Supabase 응답이 영원히 안 오는 상황 방지)
export function withTimeout(promise, ms, label) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label || '네트워크'} 응답 없음 (${ms / 1000}초 초과)`)), ms)
  );
  return Promise.race([promise, timeout]);
}
