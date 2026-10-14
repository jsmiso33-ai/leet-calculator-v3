import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getSupabase } from '../lib/supabase.js';
import { toast } from '../lib/ui.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Textarea } from './ui/textarea.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select.jsx';

// 의견 보내기 모달. Feedback.jsx의 버튼을 처음 누를 때 불러온다(Radix Dialog·Select를 첫 화면 번들에서 제외).
const MAX_LEN = 2000;
const CATEGORIES = [
  { value: 'general', label: '일반 의견' },
  { value: 'bug', label: '버그 신고' },
  { value: 'feature', label: '기능 제안' },
  { value: 'data', label: '데이터 오류 (점수·환산)' },
];

export default function FeedbackDialog({ open, setOpen }) {
  const { user } = useAuth();
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && user?.email) setEmail((prev) => prev || user.email);
  }, [open, user?.email]);

  const handleOpenChange = (next) => {
    setOpen(next);
    if (next && user?.email) setEmail((prev) => prev || user.email);
  };

  const submit = async () => {
    const msg = message.trim();
    const em = email.trim();
    if (msg.length < 5) { toast('내용을 5자 이상 적어주세요.', { type: 'error' }); return; }
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { toast('이메일 형식이 올바르지 않아요.', { type: 'error' }); return; }
    setSubmitting(true);
    try {
      const supabase = await getSupabase();
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
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="feedback-dialog-content">
          <DialogHeader>
            <DialogTitle>의견 보내기</DialogTitle>
            <DialogDescription>불편한 점, 잘못된 데이터, 추가했으면 하는 기능 무엇이든 편하게 남겨주세요. 직접 읽고 반영합니다.</DialogDescription>
          </DialogHeader>

          <div className="fb-field">
            <label htmlFor="fbCategory">분류</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="fbCategory" aria-label="분류">
                <SelectValue placeholder="분류 선택" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="fb-field">
            <label htmlFor="fbMessage">내용</label>
            <Textarea id="fbMessage" rows="5" maxLength={MAX_LEN} placeholder="여기에 의견을 적어주세요" value={message} onChange={(e) => setMessage(e.target.value)} autoFocus />
            <div className="fb-count"><span>{message.length}</span> / {MAX_LEN}</div>
          </div>
          <div className="fb-field">
            <label htmlFor="fbEmail">답변 받을 이메일 <span className="fb-optional">(선택)</span></label>
            <Input type="email" id="fbEmail" placeholder="답변이 필요하면 적어주세요" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>취소</Button>
            <Button onClick={submit} disabled={submitting}>{submitting ? '보내는 중...' : '보내기'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
