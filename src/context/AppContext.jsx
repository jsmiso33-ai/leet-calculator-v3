import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState('calc');
  // 관리자 모드: URL ?admin=1 진입 (admin.js setupAdminAccess 이식)
  const [isAdmin, setIsAdmin] = useState(() => {
    try { return new URLSearchParams(location.search).get('admin') === '1'; } catch { return false; }
  });
  const [user, setUser] = useState(null);
  // 계산기 → 학교 환산 탭으로 점수 넘기기용 공유 상태 (schools 탭 작업 시 사용)
  const [sharedScore, setSharedScore] = useState(null);

  const value = {
    activeTab, setActiveTab,
    isAdmin, setIsAdmin,
    user, setUser,
    sharedScore, setSharedScore,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
