import { cloneElement, lazy, Suspense, useState } from 'react';

// 로그인 모달(Radix Dialog + 폼)은 첫 화면에 필요 없으므로 버튼을 처음 누를 때 불러온다.
const TravelConnectSignIn = lazy(() =>
  import('./ui/travel-connect-signin-1.jsx').then((m) => ({ default: m.TravelConnectSignIn }))
);

export default function LazySignIn({ trigger }) {
  const [requested, setRequested] = useState(false);
  if (!requested) {
    return cloneElement(trigger, { onClick: () => setRequested(true) });
  }
  return (
    <Suspense fallback={cloneElement(trigger, { disabled: true, 'aria-busy': true })}>
      <TravelConnectSignIn trigger={trigger} initialOpen />
    </Suspense>
  );
}
