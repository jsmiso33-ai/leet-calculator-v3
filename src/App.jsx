import { useEffect, useState } from 'react';
import { useApp } from './context/AppContext.jsx';
import { track } from './lib/analytics.js';
import Masthead from './components/Masthead.jsx';
import TabNav from './components/TabNav.jsx';
import DailyPromo from './components/DailyPromo.jsx';
import Feedback from './components/Feedback.jsx';
import Footer from './components/Footer.jsx';
import CalcTab from './tabs/CalcTab.jsx';
import ExamsTab from './tabs/ExamsTab.jsx';
import LogTab from './tabs/LogTab.jsx';
import SchoolsTab from './tabs/SchoolsTab.jsx';
import AdmissionTab from './tabs/AdmissionTab.jsx';
import AdminTab from './tabs/AdminTab.jsx';
import DailyTab from './tabs/DailyTab.jsx';

const ALL_TABS = [
  { id: 'calc', label: '표준점수 계산기', short: '계산기', Comp: CalcTab, panelClass: 'tab-panel tw:space-y-4' },
  { id: 'daily', label: '오늘의 지문', short: '오늘', Comp: DailyTab, panelClass: 'tab-panel tw:space-y-4' },
  { id: 'exams', label: '기출문제', short: '기출', Comp: ExamsTab, panelClass: 'tab-panel tw:space-y-4' },
  { id: 'log', label: '기출 풀이 기록', short: '기록', Comp: LogTab, panelClass: 'tab-panel tw:space-y-4' },
  { id: 'schools', label: '학교별 환산점수', short: '환산', Comp: SchoolsTab, panelClass: 'tab-panel tw:space-y-4' },
  { id: 'admission', label: '입시결과 비교', short: '입시', Comp: AdmissionTab, panelClass: 'tab-panel tw:space-y-4' },
  { id: 'admin', label: '메타데이터 관리', short: '관리', Comp: AdminTab, panelClass: 'tab-panel', adminOnly: true },
];

// 새 기능 홍보: daily 탭에 한 번 들어가기 전까지 탭 버튼에 NEW 배지 표시
const DAILY_SEEN_KEY = 'leet_daily_seen_v1';

export default function App() {
  const { activeTab, setActiveTab, isAdmin } = useApp();
  const [dailySeen, setDailySeen] = useState(() => {
    try { return !!localStorage.getItem(DAILY_SEEN_KEY); } catch { return true; }
  });
  const tabs = ALL_TABS
    .filter((t) => !t.adminOnly || isAdmin)
    .map((t) => (t.id === 'daily' && !dailySeen ? { ...t, badge: 'NEW' } : t));

  useEffect(() => { track('page_view', { title: document.title }); }, []);

  const onSelect = (id) => {
    setActiveTab(id);
    track('tab_view', { tab: id });
    if (id === 'daily' && !dailySeen) {
      setDailySeen(true);
      try { localStorage.setItem(DAILY_SEEN_KEY, '1'); } catch { /* ignore */ }
    }
  };

  return (
    <>
      <a className="skip-link" href="#main">본문으로 건너뛰기</a>
      <div className="container" id="main">
        <Masthead />
        <TabNav tabs={tabs} activeTab={activeTab} onSelect={onSelect} />
        {activeTab !== 'daily' && <DailyPromo onGo={() => onSelect('daily')} />}
        {tabs.map((t) => (
          <div
            key={t.id}
            className={t.panelClass + (t.id === activeTab ? ' active' : '')}
            id={'tab-' + t.id}
            role="tabpanel"
            aria-labelledby={'tab-btn-' + t.id}
            tabIndex={0}
          >
            <t.Comp />
          </div>
        ))}
        <Footer />
      </div>
      <Feedback />
    </>
  );
}
