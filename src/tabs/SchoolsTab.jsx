import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine } from 'lucide-react';
import { LAW_SCHOOLS } from '../../data/schools.js';
import { calcSchool } from '../lib/schoolCalc.js';
import { calcForYear } from '../lib/score.js';
import { loadLocalLog } from '../lib/useLogs.js';
import { useSchoolInput } from '../context/SchoolInputContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { withTimeout } from '../lib/supabase.js';
import { track } from '../lib/analytics.js';
import { useAnimatedDisclosure } from '../lib/useAnimatedDisclosure.js';

const SORTS = [
  ['leet', 'LEET 비중 높은 순'],
  ['alpha', '학교명 가나다순'],
  ['myscore', '내 점수율 높은 순'],
];

// ── 기출 풀이 기록에서 LEET 점수 불러오기 (레거시 import-log 위젯 이식) ────────
// 게스트면 localStorage, 로그인 상태면 클라우드(leet_logs)에서 기록을 읽는다.
function ImportLogRow({ onApply }) {
  const { user, supabase } = useAuth();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState(null); // null = 로딩 중
  const [appliedYear, setAppliedYear] = useState(null);
  const rowRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rowRef.current && !rowRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    const onEscape = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!appliedYear) return undefined;
    const t = setTimeout(() => setAppliedYear(null), 3000);
    return () => clearTimeout(t);
  }, [appliedYear]);

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setEntries(null);
    let list = [];
    if (user) {
      try {
        const { data, error } = await withTimeout(
          supabase.from('leet_logs').select('*'), 30000, '기록 불러오기'
        );
        if (!error && data) {
          list = data.map((row) => ({
            year: row.year, date: row.date, eon: row.eon, chu: row.chu,
            memo: row.memo || '', createdAt: row.created_at,
          }));
        }
      } catch { /* 빈 목록으로 처리 */ }
    } else {
      list = loadLocalLog();
    }
    list.sort((a, b) => {
      if (a.date && b.date) return b.date.localeCompare(a.date);
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    setEntries(list);
  };

  const items = (entries || [])
    .map((entry) => ({ entry, result: calcForYear(entry.year, entry.eon, entry.chu) }))
    .filter(({ result }) => result && result.eon && result.chu);

  const fmt = (v) => (v !== null && v !== undefined ? v.toFixed(1) : '—');

  return (
    <div className="import-log-row" ref={rowRef}>
      <div className="qs-import-action">
        <button ref={triggerRef} type="button" className="import-log-btn" onClick={toggle} aria-expanded={open} aria-controls="qs-import-list">
          <ArrowDownToLine size={15} aria-hidden="true" /> 기출 풀이 기록에서 불러오기
        </button>
        {appliedYear && <span className="import-log-applied" role="status">{appliedYear}학년도 적용됨</span>}
      </div>
      {open && (
        <div className="import-log-dropdown" id="qs-import-list">
          <div className="import-log-list">
            {entries === null && <div className="import-log-empty">불러오는 중...</div>}
            {entries !== null && entries.length === 0 && (
              <div className="import-log-empty">기출 풀이 기록이 없습니다.<br />기출 풀이 기록 탭에서 먼저 점수를 기록하세요.</div>
            )}
            {entries !== null && entries.length > 0 && items.length === 0 && (
              <div className="import-log-empty">유효한 점수가 있는 기록이 없습니다.</div>
            )}
            {items.map(({ entry, result }, idx) => (
              <div key={entry.id || idx} className="import-log-item" role="button" tabIndex={0}
                onClick={() => { onApply(result); setAppliedYear(entry.year); setOpen(false); track('school_import_log', { year: entry.year }); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}>
                <span className="ili-year">{entry.year}</span>
                <span className="ili-scores">
                  언어 {fmt(result.eon.std)} / 추리 {fmt(result.chu.std)} · 백분위 {fmt(result.eon.pct)} / {fmt(result.chu.pct)}{entry.memo ? ` (${entry.memo})` : ''}
                </span>
                <span className="ili-date">{entry.date || ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ENG_MAX = { toeic: 990, teps: 600, toefl: 120 };
const ENG_SCORE_SCHOOLS = LAW_SCHOOLS.filter((s) => s.engType === 'score').length;

function rangeError(value, min, max) {
  if (value === null || value === undefined) return null;
  if (value < min || value > max) return `${min}~${max} 사이로 입력하세요`;
  return null;
}

// 숫자 입력칸: 단위/만점 표시를 칸 안쪽 오른쪽에 붙이고, 범위를 벗어나면 바로 알려준다
function NumField({ id, label, value, onChange, placeholder, suffix, error, step = '0.1', inputMode = 'decimal' }) {
  return (
    <div className={'qs-num' + (error ? ' invalid' : (value !== null && value !== undefined ? ' filled' : ''))}>
      <input
        id={id}
        type="number"
        inputMode={inputMode}
        step={step}
        placeholder={placeholder}
        aria-label={label}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        value={value ?? ''}
        onChange={onChange}
        data-qs-input=""
      />
      {suffix && <span className="qs-suffix" aria-hidden="true">{suffix}</span>}
      {error && <span className="qs-error" id={`${id}-error`} aria-live="polite">{error}</span>}
    </div>
  );
}

function Segmented({ value, onChange, options, label, labelledBy }) {
  return (
    <div className="qs-seg" role="radiogroup" aria-label={label} aria-labelledby={labelledBy}>
      {options.map(([key, text]) => (
        <label key={key} className={'qs-choice' + (value === key ? ' on' : '')}>
          <input type="radio" name={labelledBy || label} value={key} checked={value === key} onChange={() => onChange(key)} />
          <span>{text}</span>
        </label>
      ))}
    </div>
  );
}

export default function SchoolsTab() {
  const { schState, patch, input, favSet, getFavoriteSchoolNames, toggleFavorite, handoff } = useSchoolInput();
  const [searchQuery, setSearchQuery] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const schoolFilter = useAnimatedDisclosure();

  const gpaMissing = schState.gpaPct === null && schState.gpaScore === null;
  const engMissing = schState.engScore === null;

  // 계산기에서 넘어왔으면 아직 비어 있는 다음 입력칸으로 바로 안내한다.
  const handledHandoffRef = useRef(null);
  useEffect(() => {
    if (!handoff || handledHandoffRef.current === handoff.at) return undefined;
    handledHandoffRef.current = handoff.at;
    const frame = requestAnimationFrame(() => {
      const nextId = gpaMissing ? 'sch-gpa-pct' : (engMissing ? 'sch-eng-score' : null);
      const el = nextId ? document.getElementById(nextId) : null;
      if (!el) return;
      const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      const note = document.querySelector('#tab-schools .handoff-note');
      // 안내 문구를 화면 위쪽에 두면 바로 아래의 입력칸도 함께 보인다(모바일 포함)
      if (note) note.scrollIntoView({ block: 'start', behavior });
      else el.scrollIntoView({ block: 'center', behavior });
      el.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoff]);

  const applyLogResult = (result) => {
    const p = {};
    const set = (key, val) => {
      if (val === null || val === undefined) return;
      p[key] = parseFloat(val.toFixed(1));
    };
    set('eonStd', result.eon.std);
    set('chuStd', result.chu.std);
    set('eonPct', result.eon.pct);
    set('chuPct', result.chu.pct);
    patch(p);
  };

  const numChange = (key) => (e) => {
    const v = e.target.value;
    patch({ [key]: (v === '' || isNaN(parseFloat(v))) ? null : parseFloat(v) });
    if (window.trackDebounced) window.trackDebounced('school_calc_input', { field: key }, { key: 'school_calc_input', delay: 1500 });
  };

  const inputErrors = {
    eonStd: rangeError(schState.eonStd, 0, 100),
    chuStd: rangeError(schState.chuStd, 0, 100),
    eonPct: rangeError(schState.eonPct, 0, 100),
    chuPct: rangeError(schState.chuPct, 0, 100),
    gpaScore: rangeError(schState.gpaScore, 0, Number(schState.gpaScale)),
    gpaPct: rangeError(schState.gpaPct, 0, 100),
    engScore: rangeError(schState.engScore, 0, ENG_MAX[schState.engType]),
  };
  const leetError = inputErrors.eonStd || inputErrors.chuStd || inputErrors.eonPct || inputErrors.chuPct;
  const gpaError = inputErrors.gpaScore || inputErrors.gpaPct;
  const leetDone = schState.eonStd !== null && schState.chuStd !== null && !leetError;
  const engScoreSchools = ENG_SCORE_SCHOOLS;

  // Enter를 누르면 다음 입력칸으로 이동
  const focusNextOnEnter = (e) => {
    if (e.key !== 'Enter' || !e.target.matches('input[data-qs-input]')) return;
    e.preventDefault();
    const fields = [...e.currentTarget.querySelectorAll('input[data-qs-input]')];
    const next = fields[fields.indexOf(e.target) + 1];
    if (next) next.focus(); else e.target.blur();
  };

  // 필터
  let filtered = LAW_SCHOOLS;
  if (Array.isArray(schState.selectedSchools) && schState.selectedSchools.length > 0) {
    const selSet = new Set(schState.selectedSchools);
    filtered = LAW_SCHOOLS.filter((s) => selSet.has(s.name));
  } else if (Array.isArray(schState.selectedSchools) && schState.selectedSchools.length === 0) {
    filtered = [];
  }
  const q = searchQuery.trim().toLowerCase();
  if (q) filtered = filtered.filter((s) => s.name.toLowerCase().includes(q));

  // 정렬
  let schools = filtered.map((s) => ({ school: s, calc: calcSchool(s, input) }));
  if (schState.sortBy === 'leet') schools.sort((a, b) => b.school.leetRatio - a.school.leetRatio);
  else if (schState.sortBy === 'alpha') schools.sort((a, b) => a.school.name.localeCompare(b.school.name, 'ko'));
  else if (schState.sortBy === 'myscore') schools.sort((a, b) => {
    const ar = a.calc.total !== null ? a.calc.total / a.calc.totalDenom : -1;
    const br = b.calc.total !== null ? b.calc.total / b.calc.totalDenom : -1;
    return br - ar;
  });
  if (favSet.size > 0) schools.sort((a, b) => Number(favSet.has(b.school.name)) - Number(favSet.has(a.school.name)));

  const countText = q
    ? `"${searchQuery.trim()}" 검색: ${filtered.length}개`
    : (!Array.isArray(schState.selectedSchools) ? `전체 ${LAW_SCHOOLS.length}개 표시 중` : `${filtered.length} / ${LAW_SCHOOLS.length}개 표시 중`);

  // 칩 그룹
  const selSetForChips = schState.selectedSchools === null
    ? new Set(LAW_SCHOOLS.map((s) => s.name))
    : new Set(schState.selectedSchools);
  const groups = { '서울': [], '경기/인천': [], '지방': [] };
  LAW_SCHOOLS.forEach((s) => { const g = s.group || '지방'; (groups[g] || (groups[g] = [])).push(s); });

  const toggleChip = (name) => {
    const cur = schState.selectedSchools === null
      ? new Set(LAW_SCHOOLS.map((x) => x.name))
      : new Set(schState.selectedSchools);
    if (cur.has(name)) cur.delete(name); else cur.add(name);
    patch({ selectedSchools: cur.size === LAW_SCHOOLS.length ? null : [...cur] });
  };
  const quickSelect = (a) => {
    if (a === 'all') patch({ selectedSchools: null });
    else if (a === 'favorites') patch({ selectedSchools: getFavoriteSchoolNames() });
    else if (a === 'clear') patch({ selectedSchools: [] });
    else if (a === 'seoul') patch({ selectedSchools: LAW_SCHOOLS.filter((s) => s.group === '서울').map((s) => s.name) });
    else if (a === 'metro') patch({ selectedSchools: LAW_SCHOOLS.filter((s) => s.group === '서울' || s.group === '경기/인천').map((s) => s.name) });
  };
  const setSort = (sort) => { patch({ sortBy: sort }); if (window.track) track('school_sort', { sort }); };

  return (
    <>
      <section className="input-area qs-panel" aria-labelledby="qs-title">
        <div className="qs-head">
          <h2 id="qs-title">정량 점수 입력</h2>
          <span className="qs-save-note">2027학년도 모집요강 기준 · 입력값 자동 저장</span>
        </div>

        {handoff && (
          <div className="handoff-note" role="status">
            <strong>계산기 점수를 가져왔습니다</strong>
            <span>
              {handoff.year}학년도 언어이해 {handoff.eonStd.toFixed(1)} · 추리논증 {handoff.chuStd.toFixed(1)} (백분위 포함).{' '}
              {gpaMissing
                ? '학점을 입력하면 25개교 정량 환산점수가 완성됩니다.'
                : (engMissing ? '영어 점수를 반영하는 학교는 영어 점수를 입력하면 완성됩니다.' : '아래 학교 카드에서 환산점수를 확인하세요.')}
            </span>
          </div>
        )}

        {/* 세 묶음 모두 두 줄: 첫 줄은 점수, 둘째 줄은 보조(백분위·만점 기준·시험 종류). 같은 높이로 가로선을 맞춘다. */}
        <div className="qs-grid" onKeyDown={focusNextOnEnter}>
          <fieldset className={'qs-block' + (leetDone ? ' done' : '')}>
            <legend className="qs-block-head">
              LEET
              {(leetError || !leetDone) && <span className={'qs-state' + (leetError ? ' has-error' : '')}>{leetError ? '점수 확인' : '필요'}</span>}
            </legend>
            <div className="qs-cols"><label htmlFor="sch-eon-std">언어이해</label><label htmlFor="sch-chu-std">추리논증</label></div>
            <div className="qs-row qs-row-2">
              <NumField id="sch-eon-std" label="언어이해 표준점수" value={schState.eonStd} onChange={numChange('eonStd')} placeholder="표준점수" error={inputErrors.eonStd} />
              <NumField id="sch-chu-std" label="추리논증 표준점수" value={schState.chuStd} onChange={numChange('chuStd')} placeholder="표준점수" error={inputErrors.chuStd} />
            </div>
            <div className="qs-row qs-row-2">
              <NumField id="sch-eon-pct" label="언어이해 백분위 (%)" value={schState.eonPct} onChange={numChange('eonPct')} placeholder="백분위" suffix="%" error={inputErrors.eonPct} />
              <NumField id="sch-chu-pct" label="추리논증 백분위 (%)" value={schState.chuPct} onChange={numChange('chuPct')} placeholder="백분위" suffix="%" error={inputErrors.chuPct} />
            </div>
          </fieldset>

          <fieldset className={'qs-block' + (!gpaMissing && !gpaError ? ' done' : '')}>
            <legend className="qs-block-head">
              학부 성적
              {(gpaError || gpaMissing) && <span className={'qs-state' + (gpaError ? ' has-error' : '')}>{gpaError ? '점수 확인' : '필요'}</span>}
            </legend>
            <div className="qs-cols"><label htmlFor="sch-gpa-score">평점</label><label htmlFor="sch-gpa-pct">백분위</label></div>
            <div className="qs-row qs-row-2">
              <NumField id="sch-gpa-score" label={`학부 평점 (${schState.gpaScale} 만점)`} value={schState.gpaScore} onChange={numChange('gpaScore')} placeholder="평점" step="0.01" suffix={`/ ${schState.gpaScale}`} error={inputErrors.gpaScore} />
              <NumField id="sch-gpa-pct" label="학부 성적 백분위 (%)" value={schState.gpaPct} onChange={numChange('gpaPct')} placeholder="백분위" step="0.01" suffix="%" error={inputErrors.gpaPct} />
            </div>
            <div className="qs-row">
              <Segmented label="평점 만점 기준" value={schState.gpaScale} onChange={(v) => patch({ gpaScale: v })}
                options={[['4.5', '4.5 만점'], ['4.3', '4.3 만점'], ['4.0', '4.0 만점']]} />
            </div>
          </fieldset>

          <fieldset className={'qs-block' + (!engMissing && !inputErrors.engScore ? ' done' : '')}>
            <legend className="qs-block-head">
              공인영어
              {inputErrors.engScore
                ? <span className="qs-state has-error">점수 확인</span>
                : engMissing && <span className="qs-state">{engScoreSchools}개교 반영</span>}
            </legend>
            <div className="qs-cols"><label htmlFor="sch-eng-score">점수</label></div>
            <div className="qs-row">
              <NumField id="sch-eng-score" label={`공인영어 점수 (${ENG_MAX[schState.engType]} 만점)`} value={schState.engScore} onChange={numChange('engScore')} placeholder="점수" step="1" inputMode="numeric" suffix={`/ ${ENG_MAX[schState.engType]}`} error={inputErrors.engScore} />
            </div>
            <div className="qs-row">
              <Segmented label="공인영어 시험 종류" value={schState.engType} onChange={(v) => patch({ engType: v })}
                options={[['toeic', 'TOEIC'], ['teps', 'TEPS'], ['toefl', 'TOEFL iBT']]} />
            </div>
          </fieldset>
        </div>

        <div className="qs-foot">
          <ImportLogRow onApply={applyLogResult} />
          <span className="qs-foot-sep" aria-hidden="true">·</span>
          <button type="button" className="qs-guide-toggle" aria-expanded={guideOpen} aria-controls="qs-guide" onClick={() => setGuideOpen((v) => !v)}>
            입력 방법 안내
          </button>
        </div>
        {guideOpen && (
          <ul className="qs-guide" id="qs-guide">
            <li><strong>LEET 표준점수 / 백분위</strong>: 표준점수는 거의 모든 학교에서 사용되고, 백분위는 서울대·고려대·아주대·부산대 등에서 추가로 사용됩니다. 표준점수만 입력해도 대부분 학교는 계산됩니다.</li>
            <li><strong>GPA 백분위</strong>: 학교마다 환산식이 달라서 본인 학교에서 받은 백분위(또는 동일 학과 내 본인 위치)를 직접 입력하세요. 학적팀에서 발급받거나 졸업증명서/성적증명서에서 확인할 수 있습니다.</li>
            <li><strong>GPA 평점</strong>: 한국외대·중앙대·영남대·동아대·원광대·인하대 등은 평점 자체를 환산표에 적용합니다. 백분위만 입력하면 추정 평점으로 계산하니 가능하면 둘 다 입력하세요.</li>
            <li><strong>영어</strong>: {ENG_SCORE_SCHOOLS}개 학교만 점수 반영, 나머지는 P/F입니다 (각 학교 카드에 표시). TEPS는 뉴텝스 기준입니다.</li>
            <li>실제 입시 점수는 정성평가(서류·면접)가 더해져 최종 결정되므로, 이 도구는 <strong>정량 영역 비교용</strong>으로만 사용하세요.</li>
          </ul>
        )}
      </section>

      <section className="schools-controls">
        <div className="ctrl-label">정렬 기준:</div>
        <div className="ctrl-buttons">
          {SORTS.map(([key, label]) => (
            <button key={key} className={'sort-btn' + (schState.sortBy === key ? ' active' : '')} data-sort={key} onClick={() => setSort(key)}>{label}</button>
          ))}
        </div>
      </section>

      <details className={'school-filter-card' + (schoolFilter.closing ? ' closing' : '')} open={schoolFilter.open}>
        <summary onClick={schoolFilter.onSummaryClick}>
          <span className="sf-label">학교 선택</span>
          <span className="sf-count">{countText}</span>
        </summary>
        <div className="disclosure-panel"><div className="disclosure-panel-inner">
        <div className="sf-body">
          <div className="sf-quick-actions">
            <button style={{ '--i': 0 }} onClick={() => quickSelect('all')}>전체 선택</button>
            <button style={{ '--i': 1 }} onClick={() => quickSelect('favorites')}>즐겨찾기만</button>
            <button style={{ '--i': 2 }} onClick={() => quickSelect('seoul')}>서울권만</button>
            <button style={{ '--i': 3 }} onClick={() => quickSelect('metro')}>서울/경기·인천</button>
            <button style={{ '--i': 4 }} onClick={() => quickSelect('clear')}>선택 해제</button>
          </div>
          <div className="sf-chips">
            {(() => {
              let stagger = 5;
              return Object.entries(groups).map(([gName, gSchools]) => gSchools.length === 0 ? null : (
                <div key={gName} className="sch-chip-group" data-region={gName}>
                  <div className="sch-chip-glabel" style={{ '--i': stagger++ }}>{gName}</div>
                  <div className="sch-chip-row">
                    {gSchools.map((s) => (
                      <div key={s.name} style={{ '--i': stagger++ }} className={'sch-chip' + (selSetForChips.has(s.name) ? ' active' : '')} role="button" tabIndex={0}
                        onClick={() => toggleChip(s.name)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleChip(s.name); } }}>
                        {s.name}
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
        </div></div>
      </details>

      <div className="school-search-bar tw:!flex tw:!items-center tw:!gap-2 tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!px-3 tw:!py-2 tw:!shadow-sm">
        <svg className="school-search-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.35-4.35" /></svg>
        <input type="search" className="school-search-input" placeholder="학교 이름 검색 (예: 서울, 연세, 부산)" autoComplete="off" enterKeyHint="search" aria-label="학교 이름 검색"
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        {searchQuery && (
          <button type="button" className="school-search-clear" aria-label="검색어 지우기" style={{ display: 'flex' }} onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      <section className="schools-grid">
        {schools.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            {q ? `"${searchQuery.trim()}" 검색 결과가 없습니다. 다른 학교 이름으로 검색해 보세요.` : '선택된 학교가 없습니다. 학교 선택에서 하나 이상 선택하세요.'}
          </div>
        ) : schools.map(({ school: s, calc: c }) => (
          <SchoolCard key={s.name} s={s} c={c} isFavorite={favSet.has(s.name)} onToggleFavorite={() => toggleFavorite(s.name)} />
        ))}
      </section>
    </>
  );
}

function ScoreRow({ area, fillClass, barPct, valNode }) {
  return (
    <div className="sc-row">
      <div className="sc-area">{area}</div>
      <div className="sc-bar">{barPct != null && <div className={'sc-bar-fill' + (fillClass ? ' ' + fillClass : '')} style={{ width: `${barPct}%` }} />}</div>
      <div className="sc-val">{valNode}</div>
    </div>
  );
}

function ValWithDenom({ value, denom }) {
  if (value === null || value === undefined) return <span className="empty">—</span>;
  return <>{value.toFixed(1)}<span className="denom"> / {denom}</span></>;
}

function SchoolCard({ s, c, isFavorite, onToggleFavorite }) {
  // 총점이 비어 있으면 무엇이 빠졌는지 알려준다 ("점수 입력 필요"만 반복하지 않도록)
  const missingParts = [];
  if (c.leet === null) missingParts.push('LEET');
  if (c.gpa === null) missingParts.push('학점');
  if (s.engType === 'score' && c.eng === null) missingParts.push('영어');
  const tier = s.leetRatio >= 50 ? '' : (s.leetRatio >= 40 ? 'tier-mid' : 'tier-low');
  const favoriteLabel = isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가';
  const leetBarPct = c.leet !== null ? (c.leet / c.leetDenom * 100) : 0;
  const gpaBarPct = c.gpa !== null ? (c.gpa / c.gpaDenom * 100) : 0;

  return (
    <div className={'school-card ' + tier}>
      <div className="sc-head">
        <div className="sc-title-row">
          <div className="sc-name">{s.name}</div>
          <button
            className={'favorite-btn' + (isFavorite ? ' active' : '')}
            type="button" aria-pressed={isFavorite} aria-label={`${s.name} ${favoriteLabel}`} title={favoriteLabel} onClick={onToggleFavorite}>
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
        <div className="sc-leet-pct">LEET 실질반영 <span className="num">{s.leetRatio.toFixed(1)}%</span></div>
      </div>
      <div className="sc-total-row">
        <div><span className="sc-total-label">정량 환산점수</span></div>
        {c.total !== null
          ? <span className="sc-total-val">{c.total.toFixed(1)}<span className="denom">/{c.totalDenom}</span></span>
          : <span className="sc-total-val empty">{missingParts.length ? `${missingParts.join('·')} 입력 필요` : '— 점수 입력 필요'}</span>}
      </div>
      <div className="sc-rows">
        <ScoreRow area="LEET" fillClass="" barPct={leetBarPct} valNode={<ValWithDenom value={c.leet} denom={c.leetDenom} />} />
        <ScoreRow area="학점" fillClass="gpa" barPct={gpaBarPct} valNode={<ValWithDenom value={c.gpa} denom={c.gpaDenom} />} />
        {s.engType === 'pf'
          ? <ScoreRow area="영어" fillClass={null} barPct={null} valNode={<span className="sc-eng-pf">P/F</span>} />
          : <ScoreRow area="영어" fillClass="eng" barPct={c.eng !== null ? (c.eng / c.engDenom * 100) : 0} valNode={<ValWithDenom value={c.eng} denom={c.engDenom} />} />}
      </div>
      {s.note && <div className="sc-note">{s.note}</div>}
    </div>
  );
}
