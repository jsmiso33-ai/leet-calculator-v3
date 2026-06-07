import { useEffect, useLayoutEffect, useRef } from 'react';

// 기존 .tab-nav + .tab-lamp 동작을 React로 이식 (a11y, 화살표키, 스크롤 힌트, lamp 위치)
export default function TabNav({ tabs, activeTab, onSelect }) {
  const navRef = useRef(null);
  const lampRef = useRef(null);
  const btnRefs = useRef({});

  const positionLamp = () => {
    const nav = navRef.current;
    const lamp = lampRef.current;
    const btn = btnRefs.current[activeTab];
    if (!nav || !lamp || !btn) return;
    if (btn.offsetParent === null) { lamp.style.setProperty('--tab-lamp-opacity', '0'); return; }
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const x = btnRect.left - navRect.left + nav.scrollLeft;
    const y = btnRect.top - navRect.top + nav.scrollTop;
    lamp.style.setProperty('--tab-lamp-x', `${x}px`);
    lamp.style.setProperty('--tab-lamp-y', `${y}px`);
    lamp.style.setProperty('--tab-lamp-width', `${btnRect.width}px`);
    lamp.style.setProperty('--tab-lamp-height', `${btnRect.height}px`);
    lamp.style.setProperty('--tab-lamp-opacity', '1');
  };

  const updateScrollHint = () => {
    const nav = navRef.current;
    if (!nav) return;
    const scrollable = nav.scrollWidth - nav.clientWidth > 8;
    const atEnd = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 8;
    nav.classList.toggle('is-scrollable', scrollable);
    nav.classList.toggle('is-scrolled-end', !scrollable || atEnd);
  };

  useLayoutEffect(() => { positionLamp(); updateScrollHint(); });

  useEffect(() => {
    const onResize = () => { positionLamp(); updateScrollHint(); };
    window.addEventListener('resize', onResize);
    // 폰트 로드 후 lamp 위치 보정
    const t = requestAnimationFrame(() => { positionLamp(); updateScrollHint(); });
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tabs.length]);

  const onKeyDown = (e, idx) => {
    const n = tabs.length;
    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % n;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next !== -1) {
      e.preventDefault();
      onSelect(tabs[next].id);
      btnRefs.current[tabs[next].id]?.focus();
    }
  };

  const handleClick = (id) => {
    onSelect(id);
    const nav = navRef.current;
    const btn = btnRefs.current[id];
    if (nav && btn && window.innerWidth <= 820) {
      requestAnimationFrame(() => btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }));
    }
  };

  return (
    <nav
      className="tab-nav"
      role="tablist"
      ref={navRef}
      onScroll={() => { positionLamp(); updateScrollHint(); }}
    >
      <span className="tab-lamp" aria-hidden="true" ref={lampRef} />
      {tabs.map((t, idx) => {
        const active = t.id === activeTab;
        return (
          <button
            key={t.id}
            ref={(el) => { btnRefs.current[t.id] = el; }}
            className={'tab-btn' + (active ? ' active' : '') + (t.adminOnly ? ' admin-only' : '')}
            data-tab={t.id}
            data-short-label={t.short}
            role="tab"
            id={'tab-btn-' + t.id}
            aria-controls={'tab-' + t.id}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => handleClick(t.id)}
            onKeyDown={(e) => onKeyDown(e, idx)}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
