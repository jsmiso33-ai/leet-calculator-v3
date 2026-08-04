import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog.jsx';

const ROUTES = [
  { start: [0.12, 0.62], end: [0.42, 0.3], delay: 0 },
  { start: [0.42, 0.3], end: [0.72, 0.48], delay: 1.4 },
  { start: [0.18, 0.25], end: [0.52, 0.72], delay: 0.7 },
  { start: [0.82, 0.22], end: [0.57, 0.7], delay: 1.8 },
];

function DotMap() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return undefined;
    let frame = 0;
    let startedAt = performance.now();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const draw = (now) => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const gap = 12;
      for (let x = gap; x < width - gap; x += gap) {
        for (let y = gap; y < height - gap; y += gap) {
          const nx = x / width;
          const ny = y / height;
          const inShape =
            (nx > .05 && nx < .28 && ny > .12 && ny < .44) ||
            (nx > .16 && nx < .3 && ny > .45 && ny < .82) ||
            (nx > .34 && nx < .54 && ny > .18 && ny < .68) ||
            (nx > .5 && nx < .82 && ny > .12 && ny < .54) ||
            (nx > .7 && nx < .88 && ny > .62 && ny < .82);
          if (!inShape || ((x / gap + y / gap) % 4 === 0)) continue;
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(37, 99, 235, ${.2 + ((x + y) % 5) * .06})`;
          ctx.fill();
        }
      }

      const elapsed = reduceMotion ? 20 : ((now - startedAt) / 1000) % 8;
      ROUTES.forEach(({ start, end, delay }) => {
        const progress = reduceMotion ? 1 : Math.max(0, Math.min(1, (elapsed - delay) / 2.8));
        if (progress <= 0) return;
        const sx = start[0] * width;
        const sy = start[1] * height;
        const ex = end[0] * width;
        const ey = end[1] * height;
        const x = sx + (ex - sx) * progress;
        const y = sy + (ey - sy) * progress;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(37, 99, 235, .72)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        [[sx, sy, 2.5], [x, y, 3]].forEach(([px, py, radius]) => {
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fillStyle = '#2563eb';
          ctx.fill();
        });
        if (!reduceMotion) {
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59, 130, 246, .18)';
          ctx.fill();
        }
      });

      if (!reduceMotion) frame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      startedAt = performance.now();
      frame = requestAnimationFrame(draw);
    });
    observer.observe(host);
    frame = requestAnimationFrame(draw);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="travel-map-canvas" aria-hidden="true" />;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
      <path fill="#191600" d="M12 3.4c-5.2 0-9.5 3.3-9.5 7.4 0 2.6 1.8 4.9 4.5 6.3-.2.7-.7 2.6-.8 3-.1.5.2.5.4.4.2-.1 2.5-1.7 3.5-2.4.6.1 1.2.1 1.9.1 5.2 0 9.5-3.3 9.5-7.4S17.2 3.4 12 3.4z" />
    </svg>
  );
}

export function TravelConnectSignIn({ trigger }) {
  const { signIn, signInWithPassword, signUpWithPassword, resetPassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState('');
  const [formError, setFormError] = useState('');
  const [signupNotice, setSignupNotice] = useState('');
  const emailRef = useRef(null);

  const handleOAuth = async (provider) => {
    setLoading(provider);
    await signIn(provider);
    setLoading('');
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSignupNotice('');

    if (mode === 'signup') {
      if (password.length < 8) {
        setFormError('비밀번호는 8자 이상으로 입력해 주세요.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('비밀번호가 서로 일치하지 않습니다.');
        return;
      }
      setLoading('signup');
      const result = await signUpWithPassword(email.trim(), password);
      setLoading('');
      if (!result.ok) {
        setFormError('회원가입을 완료하지 못했습니다. 입력 내용을 확인해 주세요.');
        return;
      }
      if (result.requiresConfirmation) {
        setPassword('');
        setConfirmPassword('');
        setMode('login');
        setSignupNotice('가입 확인 메일을 보냈습니다. 이메일 인증 후 로그인해 주세요.');
      } else {
        setOpen(false);
      }
      return;
    }

    setLoading('password');
    const success = await signInWithPassword(email.trim(), password);
    setLoading('');
    if (success) setOpen(false);
    else setFormError('이메일 또는 비밀번호를 다시 확인해 주세요.');
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setFormError('');
    setSignupNotice('');
  };

  const handleReset = async () => {
    if (!email.trim()) {
      setFormError('비밀번호를 재설정할 이메일을 먼저 입력해 주세요.');
      emailRef.current?.focus();
      return;
    }
    setFormError('');
    setLoading('reset');
    await resetPassword(email.trim());
    setLoading('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="travel-dialog-content" overlayClassName="travel-dialog-overlay">
        <section className="travel-signin-visual" aria-hidden="true">
          <DotMap />
          <div className="travel-visual-copy">
            <div className="travel-visual-mark"><ArrowRight size={24} /></div>
            <strong>LEET 학습 기록</strong>
            <p>계산 결과와 기출 풀이 기록을 안전하게 연결하고, 어느 기기에서나 이어보세요.</p>
          </div>
        </section>

        <section className="travel-signin-form-panel">
          <DialogHeader className="travel-signin-header">
            <DialogTitle className="travel-signin-title">{mode === 'login' ? '다시 만나서 반가워요' : '이메일로 회원가입'}</DialogTitle>
            <DialogDescription className="travel-signin-description">
              {mode === 'login' ? '계정에 로그인해 학습 기록을 이어보세요.' : '계정을 만들고 학습 기록을 안전하게 보관하세요.'}
            </DialogDescription>
          </DialogHeader>

          <div className="travel-social-buttons">
            <button type="button" className="travel-social-button" disabled={!!loading} onClick={() => handleOAuth('google')}>
              <GoogleIcon /><span>{loading === 'google' ? 'Google로 이동 중…' : 'Google로 로그인'}</span>
            </button>
            <button type="button" className="travel-social-button is-kakao" disabled={!!loading} onClick={() => handleOAuth('kakao')}>
              <KakaoIcon /><span>{loading === 'kakao' ? 'Kakao로 이동 중…' : 'Kakao로 로그인'}</span>
            </button>
          </div>

          <div className="travel-signin-divider"><span>{mode === 'login' ? '또는 이메일로 로그인' : '또는 이메일로 회원가입'}</span></div>

          <form className="travel-signin-form" onSubmit={handleEmailSubmit}>
            <label htmlFor="travel-login-email">
              <span>이메일</span>
              <input ref={emailRef} id="travel-login-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required />
            </label>
            <label htmlFor="travel-login-password">
              <span>비밀번호</span>
              <div className="travel-password-field">
                <input id="travel-login-password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'signup' ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'login' ? '비밀번호 입력' : '8자 이상 입력'} required />
                <button type="button" aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {mode === 'signup' && (
              <label htmlFor="travel-login-password-confirm">
                <span>비밀번호 확인</span>
                <input id="travel-login-password-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength="8" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="비밀번호 다시 입력" required />
              </label>
            )}
            {signupNotice && <p className="travel-signup-notice" role="status">{signupNotice}</p>}
            {formError && <p className="travel-signin-error" role="alert">{formError}</p>}
            <button className="travel-signin-submit" type="submit" disabled={!!loading}>
              <span>{loading === 'password' ? '로그인 중…' : loading === 'signup' ? '가입 중…' : mode === 'login' ? '로그인' : '회원가입'}</span><ArrowRight size={17} />
            </button>
            {mode === 'login' && (
              <button className="travel-signin-reset" type="button" disabled={!!loading} onClick={handleReset}>
                {loading === 'reset' ? '재설정 링크 전송 중…' : '비밀번호를 잊으셨나요?'}
              </button>
            )}
            <p className="travel-auth-switch">
              {mode === 'login' ? '이메일 계정이 없으신가요?' : '이미 이메일 계정이 있으신가요?'}
              <button type="button" disabled={!!loading} onClick={() => changeMode(mode === 'login' ? 'signup' : 'login')}>
                {mode === 'login' ? '회원가입' : '로그인으로 돌아가기'}
              </button>
            </p>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
