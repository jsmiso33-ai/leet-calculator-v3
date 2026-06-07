import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { toast } from '../lib/ui.js';

// feedback.js 이식 — 우측 하단 플로팅 버튼 + 모달, Supabase feedback 테이블
const MAX_LEN = 2000;
const CATEGORIES = [
  { value: 'general', label: '일반 의견' },
  { value: 'bug', label: '버그 신고' },
  { value: 'feature', label: '기능 제안' },
  { value: 'data', label: '데이터 오류 (점수·환산)' },
];

export default function Feedback() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const taRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (user?.email) setEmail((prev) => prev || user.email);
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => taRef.current?.focus(), 50);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    const msg = message.trim();
    const em = email.trim();
    if (msg.length < 5) { toast('내용을 5자 이상 적어주세요.', { type: 'error' }); taRef.current?.focus(); return; }
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { toast('이메일 형식이 올바르지 않아요.', { type: 'error' }); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        category, message: msg, email: em || null,
        user_id: user?.id ?? null, page: location.pathname,
        user_agent: navigator.userAgent.slice(0, 500),
      });
      if (error) throw error;
      setMessage(''); setOpen(false);
      toast('소중한 의견 감사합니다! 잘 전달됐어요.', { type: 'success' });
    } catch (e) {
      console.error('feedback submit error:', e);
      toast('전송에 실패했어요. 잠시 후 다시 시도해주세요.', { type: 'error' });
    } finally { setSubmitting(false); }
  };

  return (
    <>
      <button className="fb-fab" type="button" aria-label="의견 보내기" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z" /></svg>
        <span className="fb-fab-label">의견</span>
      </button>
      {open && (
        <div className="fb-overlay open" role="dialog" aria-modal="true" aria-labelledby="fbTitle" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="fb-modal">
            <div className="fb-head">
              <h3 id="fbTitle">의견 보내기</h3>
              <button className="fb-close" type="button" aria-label="닫기" onClick={() => setOpen(false)}>×</button>
            </div>
            <p className="fb-desc">불편한 점, 잘못된 데이터, 추가했으면 하는 기능 무엇이든 편하게 남겨주세요. 직접 읽고 반영합니다.</p>
            <div className="fb-field">
              <label htmlFor="fbCategory">분류</label>
              <select id="fbCategory" className="log-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="fb-field">
              <label htmlFor="fbMessage">내용</label>
              <textarea id="fbMessage" ref={taRef} className="fb-textarea" rows="5" maxLength={MAX_LEN} placeholder="여기에 의견을 적어주세요" value={message} onChange={(e) => setMessage(e.target.value)} />
              <div className="fb-count"><span>{message.length}</span> / {MAX_LEN}</div>
            </div>
            <div className="fb-field">
              <label htmlFor="fbEmail">답변 받을 이메일 <span className="fb-optional">(선택)</span></label>
              <input type="email" id="fbEmail" className="log-memo" placeholder="답변이 필요하면 적어주세요" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="fb-actions">
              <button className="btn-secondary" type="button" onClick={() => setOpen(false)}>취소</button>
              <button className="btn-primary" type="button" onClick={submit} disabled={submitting}>{submitting ? '보내는 중...' : '보내기'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
