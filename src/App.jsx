import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { useApp } from './context/AppContext.jsx';
import { track } from './lib/analytics.js';
import Masthead from './components/Masthead.jsx';
import TabNav from './components/TabNav.jsx';
import UpdateBanner from './components/UpdateBanner.jsx';
import Feedback from './components/Feedback.jsx';
import Footer from './components/Footer.jsx';
import TimerDock from './components/TimerDock.jsx';
import CalcTab from './tabs/CalcTab.jsx';
const ExamsTab = lazy(() => import('./tabs/ExamsTab.jsx'));
const LogTab = lazy(() => import('./tabs/LogTab.jsx'));
const SchoolsTab = lazy(() => import('./tabs/SchoolsTab.jsx'));
const AdmissionTab = lazy(() => import('./tabs/AdmissionTab.jsx'));
const AdminTab = lazy(() => import('./tabs/AdminTab.jsx'));
const DailyTab = lazy(() => import('./tabs/DailyTab.jsx'));

class TabErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return (
      <div className="tab-load-state" role="alert">
        <p>화면을 불러오지 못했습니다. 연결 상태를 확인하고 다시 시도해주세요.</p>
        <button type="button" onClick={() => window.location.reload()}>새로고침</button>
      </div>
    );
    return this.props.children;
  }
}

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

function scrollToTabPanel(id) {
  if (!window.matchMedia?.('(max-width: 820px)').matches) return;
  requestAnimationFrame(() => {
    const panel = document.getElementById(`tab-${id}`);
    if (!panel) return;
    const mobilePicker = document.querySelector('.mobile-tab-picker');
    const nav = mobilePicker?.offsetParent ? mobilePicker : document.querySelector('nav.tab-nav');
    const stickyTop = nav ? Number.parseFloat(getComputedStyle(nav).top) || 0 : 0;
    const offset = (nav?.offsetHeight || 0) + stickyTop + 12;
    const top = panel.getBoundingClientRect().top + window.scrollY - offset;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

export default function App() {
  const { activeTab, setActiveTab, isAdmin } = useApp();
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([activeTab]));
  const [dailySeen, setDailySeen] = useState(() => {
    try { return !!localStorage.getItem(DAILY_SEEN_KEY); } catch { return true; }
  });
  const tabs = ALL_TABS
    .filter((t) => !t.adminOnly || isAdmin)
    .map((t) => (t.id === 'daily' && !dailySeen ? { ...t, badge: 'NEW' } : t));

  useEffect(() => { track('page_view', { title: document.title }); }, []);

  useEffect(() => {
    setVisitedTabs((previous) => previous.has(activeTab) ? previous : new Set([...previous, activeTab]));
    track('tab_view', { tab: activeTab });
    if (activeTab === 'daily') {
      track('daily_view', {});
      setDailySeen(true);
      try { localStorage.setItem(DAILY_SEEN_KEY, '1'); } catch { /* ignore */ }
    }
  }, [activeTab]);

  const onSelect = (id) => {
    setActiveTab(id);
    scrollToTabPanel(id);
  };

  return (
    <>
      <a className="skip-link" href="#main">본문으로 건너뛰기</a>
      <div className={'container' + (activeTab === 'daily' ? ' container--daily' : '')} id="main">
        <Masthead />
        <TabNav tabs={tabs} activeTab={activeTab} onSelect={onSelect} />
        {tabs.map((t) => (
          <div
            key={t.id}
            className={t.panelClass + (t.id === activeTab ? ' active' : '')}
            id={'tab-' + t.id}
            role="tabpanel"
            aria-labelledby={'tab-btn-' + t.id}
            tabIndex={0}
            hidden={t.id !== activeTab}
          >
            {(visitedTabs.has(t.id) || t.id === activeTab) && (
              <TabErrorBoundary>
                <Suspense fallback={<p className="tab-load-state" role="status">{t.label} 불러오는 중…</p>}>
                  <t.Comp />
                </Suspense>
              </TabErrorBoundary>
            )}
          </div>
        ))}
        {activeTab !== 'schools' && <UpdateBanner onGo={() => onSelect('schools')} />}
        <Footer />
      </div>
      <Feedback />
      <TimerDock onOpenLog={() => onSelect('log')} />
    </>
  );
}
