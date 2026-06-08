import { useMemo, useState } from 'react';
import { LAW_SCHOOLS } from '../../data/schools.js';
import { calcSchool } from '../lib/schoolCalc.js';
import { useSchoolInput } from '../context/SchoolInputContext.jsx';
import { track } from '../lib/analytics.js';
import { Input } from '../components/ui/input.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';

const SORTS = [
  ['leet', 'LEET 비중 높은 순'],
  ['alpha', '학교명 가나다순'],
  ['myscore', '내 점수율 높은 순'],
];

export default function SchoolsTab() {
  const { schState, patch, input, favSet, getFavoriteSchoolNames, toggleFavorite } = useSchoolInput();
  const [searchQuery, setSearchQuery] = useState('');
  // 비제어 입력 초기값 (마운트 시 1회 캡처)
  const initial = useMemo(() => schState, []); // eslint-disable-line react-hooks/exhaustive-deps

  const numChange = (key) => (e) => {
    const v = e.target.value;
    patch({ [key]: (v === '' || isNaN(parseFloat(v))) ? null : parseFloat(v) });
    if (window.trackDebounced) window.trackDebounced('school_calc_input', { field: key }, { key: 'school_calc_input', delay: 1500 });
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
      <section className="input-area tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-5 tw:!shadow-sm tw:md:!p-7">
        <div className="section-label tw:!text-xl tw:!font-extrabold tw:!text-slate-950">정량 점수 입력</div>
        <div className="section-desc tw:!mt-1 tw:!text-sm tw:!leading-6 tw:!text-slate-600">본인의 LEET 표준점수, 백분위, GPA, 영어 점수를 입력하면 25개 로스쿨 각각의 정량 환산점수가 계산됩니다. 입력값은 자동 저장되고 입시결과 탭과 공유됩니다.</div>

        <div className="schools-input-grid tw:!grid tw:!grid-cols-1 tw:!gap-3 tw:md:!grid-cols-2">
          <div className="field">
            <label>LEET 언어이해 표준점수</label>
            <Input type="number" inputMode="decimal" min="0" max="100" step="0.1" placeholder="예: 62.5" defaultValue={initial.eonStd ?? ''} onChange={numChange('eonStd')} />
          </div>
          <div className="field">
            <label>LEET 추리논증 표준점수</label>
            <Input type="number" inputMode="decimal" min="0" max="100" step="0.1" placeholder="예: 78.9" defaultValue={initial.chuStd ?? ''} onChange={numChange('chuStd')} />
          </div>
        </div>

        <div className="schools-input-grid tw:!mt-3 tw:!grid tw:!grid-cols-1 tw:!gap-3 tw:md:!grid-cols-2" style={{ marginTop: '12px' }}>
          <div className="field">
            <label>LEET 언어이해 백분위 <span className="max">(서울대·고려대·아주대·부산대용)</span></label>
            <Input type="number" inputMode="decimal" min="0" max="100" step="0.1" placeholder="예: 88.5" defaultValue={initial.eonPct ?? ''} onChange={numChange('eonPct')} />
          </div>
          <div className="field">
            <label>LEET 추리논증 백분위 <span className="max">(서울대·고려대·아주대·부산대용)</span></label>
            <Input type="number" inputMode="decimal" min="0" max="100" step="0.1" placeholder="예: 95.2" defaultValue={initial.chuPct ?? ''} onChange={numChange('chuPct')} />
          </div>
        </div>

        <div className="schools-input-grid tw:!mt-3 tw:!grid tw:!grid-cols-1 tw:!gap-3 tw:md:!grid-cols-2" style={{ marginTop: '12px' }}>
          <div className="field">
            <label>GPA 백분위 <span className="max">(0–100)</span></label>
            <Input type="number" inputMode="decimal" min="0" max="100" step="0.01" placeholder="예: 95.5" defaultValue={initial.gpaPct ?? ''} onChange={numChange('gpaPct')} />
          </div>
          <div className="field">
            <label>GPA <span className="max">(평점, 한국외대·중앙대·영남대·동아대 등에서 사용)</span></label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Input type="number" inputMode="decimal" min="0" max="4.5" step="0.01" placeholder="예: 4.21" style={{ flex: 1 }} defaultValue={initial.gpaScore ?? ''} onChange={numChange('gpaScore')} />
              <Select value={schState.gpaScale} onValueChange={(v) => patch({ gpaScale: v })}>
                <SelectTrigger className="w-[104px] shrink-0" aria-label="GPA 만점 기준">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4.5">4.5만점</SelectItem>
                  <SelectItem value="4.3">4.3만점</SelectItem>
                  <SelectItem value="4.0">4.0만점</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="schools-input-grid tw:!mt-3 tw:!grid tw:!grid-cols-1 tw:!gap-3 tw:md:!grid-cols-2" style={{ marginTop: '12px' }}>
          <div className="field">
            <label>공인영어 종류</label>
            <Select value={schState.engType} onValueChange={(v) => patch({ engType: v })}>
              <SelectTrigger aria-label="공인영어 종류">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toeic">TOEIC</SelectItem>
                <SelectItem value="teps">TEPS (뉴텝스)</SelectItem>
                <SelectItem value="toefl">TOEFL iBT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="field">
            <label>영어 점수</label>
            <Input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="990" step="1" placeholder="예: 950" defaultValue={initial.engScore ?? ''} onChange={numChange('engScore')} />
          </div>
        </div>

        <details className="info-callout guidance-callout">
          <summary>입력 방법 안내</summary>
          <ul>
            <li><strong>LEET 표준점수 / 백분위</strong>: 표준점수는 거의 모든 학교에서 사용되고, 백분위는 서울대·고려대·아주대·부산대 등에서 추가로 사용됩니다. 표준점수만 입력해도 대부분 학교 계산은 가능해요.</li>
            <li><strong>GPA 백분위</strong>: 학교마다 환산식이 달라서 본인 학교에서 받은 백분위(또는 동일 학과 내 본인 위치)를 직접 입력하세요. 학적팀에서 발급받거나 졸업증명서/성적증명서에서 확인할 수 있습니다.</li>
            <li><strong>GPA 평점</strong>: 한국외대·중앙대·영남대·동아대·원광대·인하대 등은 평점 자체를 환산표에 적용합니다. 백분위만 입력하면 추정 평점으로 계산하니 가능하면 둘 다 입력하세요.</li>
            <li><strong>영어</strong>: 9개 학교만 점수 반영, 나머지는 P/F입니다 (각 학교 카드에 표시).</li>
            <li>실제 입시 점수는 정성평가(서류·면접)가 더해져 최종 결정되므로, 이 도구는 <strong>정량 영역 비교용</strong>으로만 사용하세요.</li>
          </ul>
        </details>
      </section>

      <section className="schools-controls tw:!flex tw:!flex-wrap tw:!items-center tw:!gap-2">
        <div className="ctrl-label tw:!text-xs tw:!font-bold tw:!text-slate-500">정렬 기준:</div>
        <div className="ctrl-buttons tw:!flex tw:!flex-wrap tw:!gap-2">
          {SORTS.map(([key, label]) => (
            <button key={key} className={'sort-btn' + (schState.sortBy === key ? ' active' : '')} data-sort={key} onClick={() => setSort(key)}>{label}</button>
          ))}
        </div>
      </section>

      <details className="school-filter-card tw:!overflow-hidden tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!shadow-sm">
        <summary>
          <span className="sf-label">학교 선택</span>
          <span className="sf-count">{countText}</span>
        </summary>
        <div className="sf-body">
          <div className="sf-quick-actions">
            <button onClick={() => quickSelect('all')}>전체 선택</button>
            <button onClick={() => quickSelect('favorites')}>즐겨찾기만</button>
            <button onClick={() => quickSelect('seoul')}>서울권만</button>
            <button onClick={() => quickSelect('metro')}>서울/경기·인천</button>
            <button onClick={() => quickSelect('clear')}>선택 해제</button>
          </div>
          <div className="sf-chips">
            {Object.entries(groups).map(([gName, gSchools]) => gSchools.length === 0 ? null : (
              <div key={gName} className="sch-chip-group" data-region={gName}>
                <div className="sch-chip-glabel">{gName}</div>
                <div className="sch-chip-row">
                  {gSchools.map((s) => (
                    <div key={s.name} className={'sch-chip' + (selSetForChips.has(s.name) ? ' active' : '')} role="button" tabIndex={0}
                      onClick={() => toggleChip(s.name)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleChip(s.name); } }}>
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>

      <div className="school-search-bar tw:!flex tw:!items-center tw:!gap-2 tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!px-3 tw:!py-2 tw:!shadow-sm">
        <svg className="school-search-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.35-4.35" /></svg>
        <input type="search" className="school-search-input" placeholder="학교 이름 검색 (예: 서울, 연세, 부산)" autoComplete="off" enterKeyHint="search" aria-label="학교 이름 검색"
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        {searchQuery && (
          <button type="button" className="school-search-clear" aria-label="검색어 지우기" style={{ display: 'flex' }} onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      <section className="schools-grid tw:!grid tw:!grid-cols-1 tw:!gap-3 tw:md:!grid-cols-2 tw:lg:!grid-cols-3">
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
    <div className="sc-row tw:!grid tw:!grid-cols-[52px_minmax(0,1fr)_auto] tw:!items-center tw:!gap-3">
      <div className="sc-area tw:!text-xs tw:!font-extrabold tw:!text-slate-500">{area}</div>
      <div className="sc-bar">{barPct != null && <div className={'sc-bar-fill' + (fillClass ? ' ' + fillClass : '')} style={{ width: `${barPct}%` }} />}</div>
      <div className="sc-val tw:!font-mono tw:!text-xs tw:!font-bold tw:!text-slate-900">{valNode}</div>
    </div>
  );
}

function ValWithDenom({ value, denom }) {
  if (value === null || value === undefined) return <span className="empty">—</span>;
  return <>{value.toFixed(1)}<span className="denom"> / {denom}</span></>;
}

function SchoolCard({ s, c, isFavorite, onToggleFavorite }) {
  const tier = s.leetRatio >= 50 ? '' : (s.leetRatio >= 40 ? 'tier-mid' : 'tier-low');
  const favoriteLabel = isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가';
  const leetBarPct = c.leet !== null ? (c.leet / c.leetDenom * 100) : 0;
  const gpaBarPct = c.gpa !== null ? (c.gpa / c.gpaDenom * 100) : 0;

  return (
    <div className={'school-card ' + tier + ' tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-4 tw:!shadow-sm'}>
      <div className="sc-head tw:!mb-4">
        <div className="sc-title-row tw:!flex tw:!items-start tw:!justify-between tw:!gap-3">
          <div className="sc-name tw:!text-lg tw:!font-extrabold tw:!leading-tight tw:!text-slate-950">{s.name}</div>
          <button
            className={'favorite-btn ' + (isFavorite ? 'active tw:!border-amber-300 tw:!bg-amber-50 tw:!text-amber-700' : 'tw:!border-slate-200 tw:!bg-white tw:!text-slate-500') + ' tw:!inline-flex tw:!h-8 tw:!w-8 tw:!items-center tw:!justify-center tw:!rounded-full tw:!border tw:!text-sm tw:!font-extrabold tw:transition-colors tw:hover:!border-amber-300 tw:hover:!text-amber-700 tw:focus-visible:!outline tw:focus-visible:!outline-2 tw:focus-visible:!outline-offset-2 tw:focus-visible:!outline-blue-500'}
            type="button" aria-pressed={isFavorite} aria-label={`${s.name} ${favoriteLabel}`} title={favoriteLabel} onClick={onToggleFavorite}>
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
        <div className="sc-leet-pct tw:!mt-1 tw:!text-xs tw:!font-bold tw:!text-slate-500">LEET 실질반영 <span className="num tw:!font-mono tw:!font-extrabold tw:!text-slate-700">{s.leetRatio.toFixed(1)}%</span></div>
      </div>
      <div className="sc-total-row tw:!mb-4 tw:!flex tw:!items-end tw:!justify-between tw:!gap-3 tw:!rounded-xl tw:!bg-slate-50 tw:!p-3">
        <div><span className="sc-total-label tw:!text-[11px] tw:!font-extrabold tw:!text-slate-500">정량 환산점수</span></div>
        {c.total !== null
          ? <span className="sc-total-val tw:!font-mono tw:!text-2xl tw:!font-extrabold tw:!text-blue-600">{c.total.toFixed(1)}<span className="denom tw:!text-sm tw:!font-bold tw:!text-slate-500">/{c.totalDenom}</span></span>
          : <span className="sc-total-val empty tw:!text-sm tw:!font-bold tw:!text-slate-400">— 점수 입력 필요</span>}
      </div>
      <div className="sc-rows tw:!grid tw:!gap-3">
        <ScoreRow area="LEET" fillClass="" barPct={leetBarPct} valNode={<ValWithDenom value={c.leet} denom={c.leetDenom} />} />
        <ScoreRow area="학점" fillClass="gpa" barPct={gpaBarPct} valNode={<ValWithDenom value={c.gpa} denom={c.gpaDenom} />} />
        {s.engType === 'pf'
          ? <ScoreRow area="영어" fillClass={null} barPct={null} valNode={<span className="sc-eng-pf">P/F</span>} />
          : <ScoreRow area="영어" fillClass="eng" barPct={c.eng !== null ? (c.eng / c.engDenom * 100) : 0} valNode={<ValWithDenom value={c.eng} denom={c.engDenom} />} />}
      </div>
      {s.note && <div className="sc-note tw:!mt-4 tw:!rounded-lg tw:!bg-slate-50 tw:!p-3 tw:!text-xs tw:!leading-5 tw:!text-slate-500">{s.note}</div>}
    </div>
  );
}
