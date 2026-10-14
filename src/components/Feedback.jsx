import { lazy, Suspense, useState } from 'react';

const FeedbackDialog = lazy(() => import('./FeedbackDialog.jsx'));

// 의견 버튼은 항상 보이고, 모달은 처음 누를 때 불러온다.
export default function Feedback() {
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);
  return (
    <>
      <button className="fb-fab" type="button" aria-label="의견 보내기" onClick={() => { setRequested(true); setOpen(true); }}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z" /></svg>
        <span className="fb-fab-label">의견</span>
      </button>
      {requested && (
        <Suspense fallback={null}>
          <FeedbackDialog open={open} setOpen={setOpen} />
        </Suspense>
      )}
    </>
  );
}
