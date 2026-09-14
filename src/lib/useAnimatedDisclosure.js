import { useEffect, useRef, useState } from 'react';

// <details> 펼침/접힘을 애니메이션과 함께 제어한다.
// 네이티브 토글은 즉시 닫혀 퇴장 애니메이션을 못 보여주므로, summary 클릭을 가로채
// 닫을 때는 closing 상태로 애니메이션을 돌린 뒤 closeMs 후 open을 해제한다.
export function useAnimatedDisclosure(closeMs = 260) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const timerRef = useRef(0);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const onSummaryClick = (e) => {
    e.preventDefault();
    if (open && !closing) {
      setClosing(true);
      timerRef.current = setTimeout(() => {
        setOpen(false);
        setClosing(false);
      }, closeMs);
    } else {
      clearTimeout(timerRef.current);
      setClosing(false);
      setOpen(true);
    }
  };

  return { open, closing, onSummaryClick };
}
