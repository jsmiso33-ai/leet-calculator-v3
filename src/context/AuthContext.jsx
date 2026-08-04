import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { setAnalyticsUser } from '../lib/analytics.js';
import { toast, confirmAsync } from '../lib/ui.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      setAnalyticsUser(u?.id ?? null);
      setReady(true);
    }).catch(() => { if (mounted) setReady(true); });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setAnalyticsUser(u?.id ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const signIn = async (provider = 'google') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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
      const { data, error } = await supabase.auth.signUp({
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
      await supabase.auth.signOut();
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
