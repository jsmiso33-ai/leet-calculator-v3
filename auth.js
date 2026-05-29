// ===========================================================================
// Supabase 클라우드 연동
// ===========================================================================
const SUPABASE_URL = 'https://bokmpwwcjiqqzffxrxnk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva21wd3djamlxcXpmZnhyeG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMDAzOTUsImV4cCI6MjA5Mjc3NjM5NX0.xbRnEVxIiOZ1JwNJlcPl9WpkC8WmpgVQVzCnwfue5A8';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;  // null이면 게스트 모드

// 동기화 인디케이터 업데이트
function setSyncStatus(status, text) {
  const ind = document.getElementById('syncIndicator');
  const txt = document.getElementById('syncText');
  if (!currentUser) { ind.style.display = 'none'; return; }
  ind.style.display = 'inline-flex';
  ind.className = 'sync-indicator ' + status;
  txt.textContent = text;
}

// UI 업데이트 (로그인 상태에 따라)
function updateAuthUI() {
  const mode = document.getElementById('authMode');
  const btn = document.getElementById('authBtn');
  const info = document.getElementById('authInfo');

  if (currentUser) {
    mode.textContent = '☁️ 클라우드 동기화';
    mode.classList.add('signed-in');
    btn.textContent = '로그아웃';
    btn.classList.add('signed-in');
    const email = currentUser.email || '';
    info.textContent = email ? `${email} · 모든 기기에서 동기화됨` : '모든 기기에서 동기화됨';
  } else {
    mode.textContent = '📱 게스트 모드';
    mode.classList.remove('signed-in');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align:-3px;margin-right:8px;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Google 로그인';
    btn.classList.remove('signed-in');
    info.textContent = '기록은 이 브라우저에만 저장됩니다';
  }
  if (typeof updateLoginNudges === 'function') updateLoginNudges();
}

// 구글 로그인
async function signIn() {
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (error) throw error;
  } catch (e) {
    toast('로그인 실패: ' + e.message, { type: 'error' });
  }
}

// 로그아웃
async function signOut() {
  const ok = await confirmAsync(
    '클라우드 데이터는 그대로 유지되고, 다음에 로그인하면 다시 보입니다.',
    { title: '로그아웃하시겠어요?' }
  );
  if (!ok) return;
  try {
    await supabaseClient.auth.signOut();
    currentUser = null;
    updateAuthUI();
    // 게스트 모드로 복귀: localStorage 데이터 다시 로드
    logEntries = loadLog();
    renderLog();
  } catch (e) {
    toast('로그아웃 실패: ' + e.message, { type: 'error' });
  }
}

// 클라우드에서 기록 가져오기
async function fetchCloudLogs() {
  if (!currentUser) return [];
  setSyncStatus('syncing', '불러오는 중...');
  try {
    const { data, error } = await withTimeout(
      supabaseClient.from('leet_logs').select('*').order('date', { ascending: true }),
      30000,
      '불러오기'
    );
    if (error) {
      setSyncStatus('error', '동기화 실패');
      console.error(error);
      return [];
    }
    setSyncStatus('synced', '동기화됨');
    // Supabase 데이터를 우리 포맷으로 변환
    return data.map(row => ({
      id: row.id,
      year: row.year,
      date: row.date,
      eon: row.eon,
      chu: row.chu,
      memo: row.memo || '',
      createdAt: row.created_at,
    }));
  } catch (e) {
    setSyncStatus('error', '동기화 실패');
    console.error('fetchCloudLogs timeout/error:', e);
    return [];
  }
}

// 30초 타임아웃 래퍼 (Supabase 응답이 영원히 안 오는 상황 방지)
function withTimeout(promise, ms, label) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label || '네트워크'} 응답 없음 (${ms / 1000}초 초과)`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// 클라우드에 기록 추가
async function pushCloudLog(entry) {
  if (!currentUser) return null;
  setSyncStatus('syncing', '저장 중...');
  try {
    const { data, error } = await withTimeout(
      supabaseClient
        .from('leet_logs')
        .insert({
          user_id: currentUser.id,
          year: entry.year,
          date: entry.date,
          eon: entry.eon,
          chu: entry.chu,
          memo: entry.memo || null,
        })
        .select()
        .single(),
      30000,
      '저장'
    );
    if (error) {
      setSyncStatus('error', '저장 실패');
      console.error(error);
      return null;
    }
    setSyncStatus('synced', '동기화됨');
    return data;
  } catch (e) {
    setSyncStatus('error', '저장 실패');
    console.error('pushCloudLog timeout/error:', e);
    return null;
  }
}

// 클라우드에서 기록 삭제
async function deleteCloudLog(id) {
  if (!currentUser) return false;
  setSyncStatus('syncing', '삭제 중...');
  try {
    const { error } = await withTimeout(
      supabaseClient.from('leet_logs').delete().eq('id', id),
      30000,
      '삭제'
    );
    if (error) {
      setSyncStatus('error', '삭제 실패');
      console.error(error);
      return false;
    }
    setSyncStatus('synced', '동기화됨');
    return true;
  } catch (e) {
    setSyncStatus('error', '삭제 실패');
    console.error('deleteCloudLog timeout/error:', e);
    return false;
  }
}

// 게스트 모드 → 로그인 시 로컬 데이터 마이그레이션
async function migrateLocalToCloud() {
  const localLogs = loadLog();
  if (localLogs.length === 0) return;

  const ok = await confirmAsync(
    `이 브라우저에 저장된 ${localLogs.length}개의 게스트 기록이 있습니다.\n` +
    `클라우드 계정으로 옮길까요?\n\n` +
    `[확인] 옮기기 (게스트 + 클라우드 기록 모두 보임)\n` +
    `[취소] 게스트 기록은 그대로 두고 클라우드 기록만 사용`,
    { title: '게스트 기록 가져오기', okLabel: '옮기기' }
  );
  if (!ok) return;

  setSyncStatus('syncing', '게스트 기록 옮기는 중...');
  for (const e of localLogs) {
    await supabaseClient.from('leet_logs').insert({
      user_id: currentUser.id,
      year: e.year,
      date: e.date,
      eon: e.eon,
      chu: e.chu,
      memo: e.memo || null,
    });
  }
  // 마이그레이션 완료 후 로컬 클리어
  localStorage.removeItem(LOG_STORAGE_KEY);
  setSyncStatus('synced', '동기화됨');
}

// 로그인 상태 초기화 + 변화 감지
async function initAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    currentUser = session.user;
    await migrateLocalToCloud();
    logEntries = await fetchCloudLogs();
    renderLog();
  }
  updateAuthUI();

  // 로그인 상태 변화 감지 (OAuth 콜백 후 등)
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      const wasGuest = (currentUser === null);
      currentUser = session.user;
      if (wasGuest) await migrateLocalToCloud();
      logEntries = await fetchCloudLogs();
      updateAuthUI();
      renderLog();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      logEntries = loadLog();
      updateAuthUI();
      renderLog();
    }
  });
}

document.getElementById('authBtn').addEventListener('click', () => {
  if (currentUser) signOut();
  else signIn();
});
