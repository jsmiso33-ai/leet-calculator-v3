import { useAuth } from '../context/AuthContext.jsx';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" style={{ verticalAlign: '-3px', marginRight: '8px' }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg className="auth-provider-mark" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#191600" d="M12 3.4c-5.2 0-9.5 3.3-9.5 7.4 0 2.6 1.8 4.9 4.5 6.3-.2.7-.7 2.6-.8 3-.1.5.2.5.4.4.2-.1 2.5-1.7 3.5-2.4.6.1 1.2.1 1.9.1 5.2 0 9.5-3.3 9.5-7.4S17.2 3.4 12 3.4z" />
    </svg>
  );
}

// 헤더 (제목 + 인증). auth.js의 updateAuthUI 동작을 React로 이식.
export default function Masthead() {
  const { user, signIn, signOut } = useAuth();
  const email = user?.email || '';

  return (
    <header className="masthead">
      <div className="title-block">
        <div className="title-block-text">
          <h1>LEET 표준점수 계산기</h1>
          <div className="subtitle">법학적성시험 · 2009 — 2026 학년도</div>
        </div>
      </div>
      <div className="meta">
        <div id="authStatus" className="auth-status">
          <span className={'auth-mode' + (user ? ' signed-in' : '')} id="authMode">
            {user ? '클라우드 동기화' : '게스트 모드'}
          </span>
          <div className="auth-actions" id="authActions">
            {user ? (
              <button className="auth-btn signed-in" id="authBtn" type="button" onClick={() => signOut()}>로그아웃</button>
            ) : (
              <>
                <button className="auth-btn" id="authBtn" type="button" onClick={() => signIn('google')}><GoogleIcon />Google</button>
                <button className="auth-btn auth-provider-btn auth-kakao" type="button" data-auth-provider="kakao" onClick={() => signIn('kakao')}><KakaoIcon />Kakao</button>
              </>
            )}
          </div>
        </div>
        <div className="auth-info">
          <span id="authInfo">{user ? (email ? `${email} · 모든 기기에서 동기화됨` : '모든 기기에서 동기화됨') : '기록은 이 브라우저에만 저장됩니다'}</span>
        </div>
        {!user && (
          <div className="auth-nudge" id="authNudgeHeader">
            로그인하면 기록을 모든 기기에서 이어볼 수 있어요.
          </div>
        )}
      </div>
    </header>
  );
}
