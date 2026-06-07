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
    <AuthContext.Provider value={{ user, ready, signIn, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
