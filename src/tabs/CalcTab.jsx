import { useEffect, useMemo, useRef, useState } from 'react';
import { LEET } from '../../data/leet.js';
import { calcForYear, ALL_YEARS } from '../lib/score.js';
import TrendChart from '../components/TrendChart.jsx';

const STORAGE_KEY = 'leet_calculator_state_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function yearsSummary(set) {
  const years = [...set].filter((y) => LEET[y]).sort((a, b) => b - a);
  if (!years.length) return '선택 없음';
  if (years.length === 1) return `${years[0]}학년도`;
  if (years.length <= 3) return years.map(String).join(', ');
  return `${years.length}개 선택 · 최신 ${years[0]}`;
}

const parseRaw = (v) =>
  (v === '' || isNaN(parseInt(v, 10))) ? null : Math.max(0, Math.min(40, parseInt(v, 10)));

export default function CalcTab() {
  const saved = useMemo(loadState, []);
  const [eonRaw, setEonRaw] = useState(saved?.eonRaw ?? null);
  const [chuRaw, setChuRaw] = useState(saved?.chuRaw ?? null);
  const [selectedYears, setSelectedYears] = useState(
    () => new Set(saved?.selectedYears ?? [2023, 2024, 2025, 2026])
  );
  const [detailYear, setDetailYear] = useState(2025);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  // 자동 저장 (기존 키/형식 유지)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        eonRaw, chuRaw, selectedYears: [...selectedYears],
      }));
    } catch { /* localStorage 비활성 환경 무시 */ }
  }, [eonRaw, chuRaw, selectedYears]);

  // 연도 팝오버: 바깥 클릭/Esc로 닫기
  useEffect(() => {
    if (!pickerOpen) return;
    const onDoc = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setPickerOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, [pickerOpen]);

  const results = useMemo(
    () => [...selectedYears].sort((a, b) => a - b).map((y) => calcForYear(y, eonRaw, chuRaw)).filter(Boolean),
    [selectedYears, eonRaw, chuRaw]
  );

  // Hero Pulse
  const heroYear = useMemo(() => {
    const sel = [...selectedYears].filter((y) => LEET[y]).sort((a, b) => b - a);
    return sel[0] ?? Math.max(...ALL_YEARS);
  }, [selectedYears]);
  const heroData = LEET[heroYear];
  const heroResult = useMemo(() => calcForYear(heroYear, eonRaw, chuRaw), [heroYear, eonRaw, chuRaw]);
  const eonStd = heroResult?.eon?.std ?? null;
  const chuStd = heroResult?.chu?.std ?? null;
  const hasHero = eonRaw !== null && chuRaw !== null && eonStd !== null && chuStd !== null;
  const heroTotal = hasHero ? eonStd + chuStd : null;
  const eonPct = heroResult?.eon?.pct;
  const chuPct = heroResult?.chu?.pct;
  const combinedPct = (hasHero && eonPct != null && chuPct != null) ? Math.sqrt(eonPct * chuPct) : null;

  const toggleYear = (y) => setSelectedYears((prev) => {
    const n = new Set(prev);
    if (n.has(y)) n.delete(y); else n.add(y);
    return n;
  });
  const quick = (which) => {
    if (which === 'all') setSelectedYears(new Set(ALL_YEARS));
    else if (which === 'new') setSelectedYears(new Set(ALL_YEARS.filter((y) => LEET[y].era === 'new')));
    else if (which === 'recent') setSelectedYears(new Set([2022, 2023, 2024, 2025, 2026].filter((y) => LEET[y])));
    else if (which === 'clear') setSelectedYears(new Set());
  };

  // 연도 칩 (구/신 리트 라벨 삽입)
  const chips = [];
  let oldLabel = false, newLabel = false;
  ALL_YEARS.forEach((y) => {
    const isOld = LEET[y].era === 'old';
    if (isOld && !oldLabel) { chips.push({ type: 'label', text: '구 리트', key: 'lbl-old' }); oldLabel = true; }
    if (!isOld && !newLabel) { chips.push({ type: 'label', text: '신 리트', key: 'lbl-new' }); newLabel = true; }
    chips.push({ type: 'chip', y, isOld, key: 'y-' + y });
  });

  const detail = LEET[detailYear];

  return (
    <>
      <section className="hero-pulse tw:!mb-4 tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!shadow-sm" id="heroPulse">
        <div className="hero-pulse-bg"></div>
        <div className="hp-result">
          <div className="hp-era-badge">
            <span className="hp-era-dot"></span>
            <span className="hp-era-text"><span>{heroYear}</span>학년도 환산</span>
          </div>
          <div className="hp-score-block">
            <div className={'hp-score' + (hasHero ? ' has-value' : '')}>{hasHero ? heroTotal.toFixed(1) : '—'}</div>
            <div className="hp-score-meta">합계 표준점수 <span className="dim">· 언어 + 추리</span></div>
          </div>
          <div className={'hp-percentile-text' + (hasHero ? ' has-stats' : '')}>
            {!hasHero ? '원점수를 입력하세요' : (
              <>
                {combinedPct != null && (
                  <div className="hp-stat"><span className="hp-stat-label">백분위</span><span className="hp-stat-val">{combinedPct.toFixed(1)}</span></div>
                )}
                <div className="hp-stat"><span className="hp-stat-label">원점수</span><span className="hp-stat-val">{eonRaw}+{chuRaw}</span></div>
              </>
            )}
          </div>
        </div>

        <div className="hp-input">
          <div className="hp-input-header"><strong>원점수 입력</strong><span className="save-tag">· 자동 저장</span></div>
          <div className="hp-input-grid">
            <label className="hp-field">
              <div className="hp-field-label">언어이해</div>
              <div className="hp-field-row">
                <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="40" step="1" placeholder="0"
                  defaultValue={saved?.eonRaw ?? ''} onChange={(e) => setEonRaw(parseRaw(e.target.value))} />
                <span className="hp-field-max">/ {heroData ? heroData.items_eon : 30}</span>
              </div>
            </label>
            <label className="hp-field">
              <div className="hp-field-label">추리논증</div>
              <div className="hp-field-row">
                <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="40" step="1" placeholder="0"
                  defaultValue={saved?.chuRaw ?? ''} onChange={(e) => setChuRaw(parseRaw(e.target.value))} />
                <span className="hp-field-max">/ {heroData ? heroData.items_chu : 40}</span>
              </div>
            </label>
          </div>

          <div className="hp-years" id="hpYearsPicker" ref={pickerRef}>
            <button type="button" className={'hp-years-trigger' + (pickerOpen ? ' open' : '')} aria-expanded={pickerOpen} aria-controls="hpYearsPopover"
              onClick={(e) => { e.stopPropagation(); setPickerOpen((o) => !o); }}>
              <span className="hp-years-label">비교할 학년도</span>
              <span className="hp-years-current">{yearsSummary(selectedYears)}</span>
              <svg className="hp-years-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            <div className={'hp-years-popover' + (pickerOpen ? ' open' : '')} id="hpYearsPopover" onClick={(e) => e.stopPropagation()}>
              <div className="hp-years-inner">
                <div className="hp-years-body">
                  <div className="year-chips">
                    {chips.map((c) => c.type === 'label'
                      ? <div key={c.key} className="year-era-label">{c.text}</div>
                      : <div key={c.key} className={'y-chip' + (c.isOld ? ' era-old' : '') + (selectedYears.has(c.y) ? ' active' : '')} onClick={() => toggleYear(c.y)}>{c.y}</div>
                    )}
                  </div>
                  <div className="hp-quick-actions">
                    <button onClick={() => quick('all')}>전체 선택</button>
                    <button onClick={() => quick('new')}>신리트만 (2020~)</button>
                    <button onClick={() => quick('recent')}>최근 5개년</button>
                    <button onClick={() => quick('clear')}>선택 해제</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CombinedSection results={results} />

      <div className="results-area tw:!grid tw:!grid-cols-1 tw:!gap-4 tw:lg:!grid-cols-2">
        <div className="result-card tw:!overflow-hidden tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!shadow-sm">
          <div className="head"><span className="name">언어이해</span><span className="max-info">{eonRaw !== null ? `${eonRaw} / 30` : '— / 30'}</span></div>
          <div className="raw-display">원점수 <span className="num">{eonRaw !== null ? eonRaw : '—'}</span></div>
          <SubjectTable results={results} subjectKey="eon" raw={eonRaw} />
        </div>
        <div className="result-card tw:!overflow-hidden tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!shadow-sm">
          <div className="head"><span className="name">추리논증</span><span className="max-info">{chuRaw !== null ? `${chuRaw} / 40` : '— / 40'}</span></div>
          <div className="raw-display">원점수 <span className="num">{chuRaw !== null ? chuRaw : '—'}</span></div>
          <SubjectTable results={results} subjectKey="chu" raw={chuRaw} />
        </div>
      </div>

      <section className="chart-card tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-5 tw:!shadow-sm">
        <div className="section-label tw:!text-lg tw:!font-extrabold tw:!text-slate-950">연도별 표준점수 합계 추이</div>
        <div className="section-desc tw:!mt-1 tw:!text-sm tw:!leading-6 tw:!text-slate-600">같은 원점수가 학년도별로 합산 표준점수가 어떻게 다르게 환산되는지 보여줍니다. 점에 마우스를 올리면 영역별 점수도 같이 확인할 수 있어요.</div>
        <TrendChart results={results} />
      </section>

      <details className="detail-viewer tw:!overflow-hidden tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!shadow-sm">
        <summary>전체 환산표 (연도별 원점수–표준점수–백분위)</summary>
        <div className="viewer-body">
          <div className="year-tabs">
            {ALL_YEARS.map((y) => (
              <button key={y} className={'y-tab' + (detailYear === y ? ' active' : '')} onClick={() => setDetailYear(y)}>{y}</button>
            ))}
          </div>
          <div><ConvTables detail={detail} detailYear={detailYear} eonRaw={eonRaw} chuRaw={chuRaw} /></div>
        </div>
      </details>
    </>
  );
}

function SubjectTable({ results, subjectKey, raw }) {
  const sorted = [...results].sort((a, b) => a.year - b.year);
  return (
    <table className="score-table">
      <thead><tr><th>학년도</th><th>구분</th><th>표준점수</th><th>백분위</th></tr></thead>
      <tbody>
        {(raw === null || results.length === 0) ? (
          <tr><td colSpan="4" className="empty-state">원점수를 입력하고 학년도를 선택하세요</td></tr>
        ) : sorted.map((r) => {
          const v = r[subjectKey];
          const eraLabel = r.era === 'new' ? '신리트' : '구리트';
          return (
            <tr key={r.year}>
              <td className="year">{r.year}</td>
              <td className="era">{eraLabel}</td>
              {v && v.std !== null
                ? <td className={'std' + (v.estimated ? ' estimated' : '')}>{v.std.toFixed(1)}{v.estimated && <span className="badge-est">추정</span>}</td>
                : <td className="std">—</td>}
              {v && v.pct != null
                ? <td className="pct">{v.pct.toFixed(1)}</td>
                : <td className="pct">—</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function CombinedSection({ results }) {
  const valid = results.filter((r) => r.eon && r.chu && r.eon.std !== null && r.chu.std !== null);
  if (valid.length === 0) return null;
  const sorted = [...valid].sort((a, b) => a.year - b.year);
  return (
    <section className="combined tw:!mb-4 tw:!overflow-hidden tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!shadow-sm" style={{ display: 'grid' }}>
      <div className="label-block"><div className="lbl">표준점수 합계</div><div className="lbl-main">언어 + 추리</div></div>
      <div className="table-block">
        <table>
          <thead><tr><th>학년도</th><th>언어이해</th><th>추리논증</th><th>합계</th><th>추정 백분위</th></tr></thead>
          <tbody>
            {sorted.map((r) => {
              const total = r.eon.std + r.chu.std;
              const isEst = r.eon.estimated || r.chu.estimated;
              const hasPct = r.eon.pct != null && r.chu.pct != null;
              const combined = hasPct ? Math.sqrt(r.eon.pct * r.chu.pct) : null;
              return (
                <tr key={r.year}>
                  <td className="year">{r.year}</td>
                  <td>{r.eon.std.toFixed(1)}{r.eon.estimated ? '*' : ''}</td>
                  <td>{r.chu.std.toFixed(1)}{r.chu.estimated ? '*' : ''}</td>
                  <td className="total">{total.toFixed(1)}{isEst ? '*' : ''}</td>
                  {hasPct ? <td className="combined-pct has-value">{combined.toFixed(1)}%</td> : <td className="combined-pct">—</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ConvTables({ detail, detailYear, eonRaw, chuRaw }) {
  if (!detail) return null;
  if (detail.isFullyEstimated) {
    return (
      <div className="empty-state" style={{ padding: '20px' }}>
        {detailYear}학년도는 공식 환산표가 아직 정리되지 않았습니다.<br />
        법률저널 발표 데이터(언어 평균 {detail.eon_mean}·만점 표점 {detail.eon_top} / 추리 평균 {detail.chu_mean}·만점 표점 {detail.chu_top})를 기반으로 추정 계산만 가능합니다.
      </div>
    );
  }
  const renderTable = (subject, table, est, items, userRaw) => {
    const subName = subject === 'eon' ? '언어이해' : '추리논증';
    const keys = Object.keys(table).map(Number).sort((a, b) => b - a);
    return (
      <div className="conv-table" key={subject}>
        <div className="ct-head">{subName} <span style={{ fontWeight: 400, color: 'var(--ink-mute)', fontSize: '11px' }}>{items}문항</span></div>
        <table className="conv">
          <thead><tr><th>원점수</th><th>표점</th><th>백분위</th></tr></thead>
          <tbody>
            {keys.map((k) => {
              const [s, p] = table[k];
              const isEst = Array.isArray(est) && est.includes(k);
              const isHit = userRaw !== null && userRaw === k;
              return (
                <tr key={k} className={isHit ? 'user-hit' : ''}>
                  <td className="r">{k}</td>
                  <td className={'s' + (isEst ? ' est' : '')}>{s !== null ? s.toFixed(1) : '—'}</td>
                  <td className="p">{p !== null ? p.toFixed(1) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };
  return (
    <div className="conv-tables">
      {renderTable('eon', detail.eon, detail.eon_est, detail.items_eon, eonRaw)}
      {renderTable('chu', detail.chu, detail.chu_est, detail.items_chu, chuRaw)}
    </div>
  );
}
