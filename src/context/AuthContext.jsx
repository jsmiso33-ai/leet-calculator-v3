import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase, hasStoredSession, afterIdle } from '../lib/supabase.js';
import { setAnalyticsUser } from '../lib/analytics.js';
import { toast, confirmAsync } from '../lib/ui.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  // SDK는 동적으로 로드되므로 준비 전까지 null. user가 채워졌다면 항상 준비된 상태다.
  const [supabase, setSupabase] = useState(null);

  useEffect(() => {
    let mounted = true;
    let subscription = null;
    (async () => {
      // 복원할 세션이 없는 게스트는 첫 화면이 자리 잡은 뒤에 인증 SDK를 불러온다.
      if (!hasStoredSession()) await afterIdle();
      try {
        const client = await getSupabase();
        if (!mounted) return;
        setSupabase(client);
        const { data } = client.auth.onAuthStateChange((_event, session) => {
          const u = session?.user ?? null;
          setUser(u);
          setAnalyticsUser(u?.id ?? null);
        });
        subscription = data.subscription;
        const { data: { session } } = await client.auth.getSession();
        if (!mounted) return;
        const u = session?.user ?? null;
        setUser(u);
        setAnalyticsUser(u?.id ?? null);
      } catch { /* SDK 로드·세션 확인 실패 시 게스트로 동작 */ }
      if (mounted) setReady(true);
    })();
    return () => { mounted = false; subscription?.unsubscribe(); };
  }, []);

  const signIn = async (provider = 'google') => {
    try {
      const client = await getSupabase();
      const { data, error } = await client.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + window.location.pathname, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data || !data.url) { toast('로그인 URL을 받지 못했습니다.', { type: 'error' }); return; }
      window.location.href = data.url;
    } catch (e) {
      toast('로그인 실패: ' + (e && e.message ? e.message : String(e)), { type: 'error' });
    }
  };

  const signInWithPassword = async (email, password) => {
    try {
      const client = await getSupabase();
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast('로그인되었습니다.', { type: 'success' });
      return true;
    } catch {
      toast('이메일 또는 비밀번호를 확인해 주세요.', { type: 'error' });
      return false;
    }
  };

  const signUpWithPassword = async (email, password) => {
    try {
      const client = await getSupabase();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + window.location.pathname },
      });
      if (error) throw error;
      const requiresConfirmation = !data?.session;
      toast(
        requiresConfirmation ? '가입 확인 메일을 보냈습니다. 이메일을 확인해 주세요.' : '회원가입이 완료되었습니다.',
        { type: 'success' }
      );
      return { ok: true, requiresConfirmation };
    } catch {
      toast('회원가입을 완료하지 못했습니다. 입력 내용을 확인해 주세요.', { type: 'error' });
      return { ok: false, requiresConfirmation: false };
    }
  };

  const resetPassword = async (email) => {
    try {
      const client = await getSupabase();
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname,
      });
      if (error) throw error;
      toast('비밀번호 재설정 링크를 이메일로 보냈습니다.', { type: 'success' });
      return true;
    } catch {
      toast('재설정 이메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.', { type: 'error' });
      return false;
    }
  };

  const signOut = async () => {
    const ok = await confirmAsync(
      '클라우드 데이터는 그대로 유지되고, 다음에 로그인하면 다시 보입니다.',
      { title: '로그아웃하시겠어요?' }
    );
    if (!ok) return;
    try {
      const client = await getSupabase();
      await client.auth.signOut();
      setUser(null);
      setAnalyticsUser(null);
    } catch (e) {
      toast('로그아웃 실패: ' + e.message, { type: 'error' });
    }
  };

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signInWithPassword, signUpWithPassword, resetPassword, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
