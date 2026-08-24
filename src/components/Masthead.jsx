import { useAuth } from '../context/AuthContext.jsx';
import { ArrowRight, Cloud } from 'lucide-react';
import { TravelConnectSignIn } from './ui/travel-connect-signin-1.jsx';

// 헤더 (제목 + 인증). auth.js의 updateAuthUI 동작을 React로 이식.
export default function Masthead() {
  const { user, signOut } = useAuth();
  const email = user?.email || '';

  return (
    <header className="masthead">
      <div className="title-block">
        <div className="title-block-text">
          <h1>LEET 표준점수 계산기</h1>
          <div className="subtitle">법학적성시험 · 2009 — 2027 학년도</div>
        </div>
      </div>
      <div className={'meta' + (!user ? ' is-guest' : '')}>
        <div id="authStatus" className={'auth-status' + (!user ? ' auth-sync-card' : '')}>
          {user && <span className="auth-mode signed-in" id="authMode">클라우드 동기화</span>}
          {!user && (
            <>
              <span className="auth-sync-icon" aria-hidden="true">
                <Cloud size={21} strokeWidth={2} />
              </span>
              <span className="auth-sync-copy" id="authNudgeHeader">
                <strong>학습 기록을 안전하게 보관하세요</strong>
                <span>로그인하면 모든 기기에서 이어집니다.</span>
              </span>
            </>
          )}
          <div className={'auth-actions' + (!user ? ' is-guest' : '')} id="authActions">
            {user ? (
              <button className="auth-btn signed-in" id="authBtn" type="button" onClick={() => signOut()}>로그아웃</button>
            ) : (
              <TravelConnectSignIn trigger={(
                <button className="auth-btn auth-login-open" id="authBtn" type="button">
                  로그인
                  <ArrowRight aria-hidden="true" size={15} strokeWidth={2.4} />
                </button>
              )} />
            )}
          </div>
        </div>
        {user && (
          <div className="auth-info">
            <span id="authInfo">{email ? `${email} · 모든 기기에서 동기화됨` : '모든 기기에서 동기화됨'}</span>
          </div>
        )}
      </div>
    </header>
  );
}
