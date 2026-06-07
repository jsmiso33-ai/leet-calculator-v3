import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { withTimeout } from './supabase.js';
import { toast, confirmAsync } from './ui.js';
import { track } from './analytics.js';

export const LOG_STORAGE_KEY = 'leet_log_v1';

export function loadLocalLog() {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    const a = raw ? JSON.parse(raw) : [];
    return Array.isArray(a) ? a : [];
  } catch { return []; }
}
function saveLocalLog(entries) {
  try { localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(entries)); } catch { /* ignore */ }
}

// auth.js + app.js의 로그 동기화 로직을 React 훅으로 이식
export function useLogs() {
  const { user, supabase } = useAuth();
  const [entries, setEntries] = useState(loadLocalLog);
  const [syncStatus, setSyncStatus] = useState(null); // { status, text } | null
  const prevUserRef = useRef(undefined);

  const fetchCloud = useCallback(async () => {
    if (!user) return [];
    setSyncStatus({ status: 'syncing', text: '불러오는 중...' });
    try {
      const { data, error } = await withTimeout(
        supabase.from('leet_logs').select('*').order('date', { ascending: true }), 30000, '불러오기'
      );
      if (error) { setSyncStatus({ status: 'error', text: '동기화 실패' }); console.error(error); return []; }
      setSyncStatus({ status: 'synced', text: '동기화됨' });
      return data.map((row) => ({
        id: row.id, year: row.year, date: row.date, eon: row.eon, chu: row.chu,
        memo: row.memo || '', createdAt: row.created_at,
      }));
    } catch (e) { setSyncStatus({ status: 'error', text: '동기화 실패' }); console.error(e); return []; }
  }, [user, supabase]);

  const migrateLocalToCloud = useCallback(async () => {
    const local = loadLocalLog();
    if (local.length === 0) return;
    const ok = await confirmAsync(
      `이 브라우저에 저장된 ${local.length}개의 게스트 기록이 있습니다.\n` +
      `클라우드 계정으로 옮길까요?\n\n` +
      `[확인] 옮기기 (게스트 + 클라우드 기록 모두 보임)\n` +
      `[취소] 게스트 기록은 그대로 두고 클라우드 기록만 사용`,
      { title: '게스트 기록 가져오기', okLabel: '옮기기' }
    );
    if (!ok) return;
    setSyncStatus({ status: 'syncing', text: '게스트 기록 옮기는 중...' });
    for (const e of local) {
      await supabase.from('leet_logs').insert({ user_id: user.id, year: e.year, date: e.date, eon: e.eon, chu: e.chu, memo: e.memo || null });
    }
    localStorage.removeItem(LOG_STORAGE_KEY);
    setSyncStatus({ status: 'synced', text: '동기화됨' });
  }, [user, supabase]);

  // user 변화에 반응: 로그인 → (게스트 기록 이관) + 클라우드 로드 / 게스트 → 로컬 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user) {
        if (prevUserRef.current !== user) await migrateLocalToCloud();
        const cloud = await fetchCloud();
        if (!cancelled) setEntries(cloud);
      } else {
        if (!cancelled) { setEntries(loadLocalLog()); setSyncStatus(null); }
      }
      prevUserRef.current = user;
    })();
    return () => { cancelled = true; };
  }, [user, fetchCloud, migrateLocalToCloud]);

  const addEntry = useCallback(async ({ year, date, eon, chu, memo }) => {
    let saved = false;
    if (user) {
      setSyncStatus({ status: 'syncing', text: '저장 중...' });
      try {
        const { data, error } = await withTimeout(
          supabase.from('leet_logs').insert({ user_id: user.id, year, date, eon, chu, memo: memo || null }).select().single(),
          30000, '저장'
        );
        if (error) { setSyncStatus({ status: 'error', text: '저장 실패' }); toast('저장 실패. 잠시 후 다시 시도해주세요.', { type: 'error' }); return false; }
        setSyncStatus({ status: 'synced', text: '동기화됨' });
        setEntries((prev) => [...prev, { id: data.id, year: data.year, date: data.date, eon: data.eon, chu: data.chu, memo: data.memo || '', createdAt: data.created_at }]);
        saved = true;
      } catch (e) { setSyncStatus({ status: 'error', text: '저장 실패' }); console.error(e); toast('저장 중 오류가 발생했습니다.', { type: 'error' }); return false; }
    } else {
      const entry = { id: Date.now() + '_' + Math.random().toString(36).slice(2, 7), year, date, eon, chu, memo, createdAt: new Date().toISOString() };
      setEntries((prev) => { const next = [...prev, entry]; saveLocalLog(next); return next; });
      saved = true;
    }
    if (saved && window.track) track('log_save', { year, mode: user ? 'cloud' : 'guest', has_eon: eon !== null, has_chu: chu !== null });
    return saved;
  }, [user, supabase]);

  const deleteEntry = useCallback(async (id) => {
    const ok = await confirmAsync('이 기록을 삭제할까요?', { title: '기록 삭제', okLabel: '삭제', danger: true });
    if (!ok) return;
    if (user) {
      setSyncStatus({ status: 'syncing', text: '삭제 중...' });
      try {
        const { error } = await withTimeout(supabase.from('leet_logs').delete().eq('id', id), 30000, '삭제');
        if (error) { setSyncStatus({ status: 'error', text: '삭제 실패' }); console.error(error); return; }
        setSyncStatus({ status: 'synced', text: '동기화됨' });
      } catch (e) { setSyncStatus({ status: 'error', text: '삭제 실패' }); console.error(e); return; }
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } else {
      setEntries((prev) => { const next = prev.filter((e) => e.id !== id); saveLocalLog(next); return next; });
    }
  }, [user, supabase]);

  return { entries, syncStatus, addEntry, deleteEntry };
}
