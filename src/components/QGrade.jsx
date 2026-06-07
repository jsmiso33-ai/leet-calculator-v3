import { useEffect, useState } from 'react';
import { LEET } from '../../data/leet.js';
import { gradeSection, computeWeakness, countFilled, hasMeta, loadQgState, saveQgState, LEET_TAXONOMY, DIFFICULTY_LEVELS } from '../lib/qg.js';
import { toast, confirmAsync } from '../lib/ui.js';

const YEARS_DESC = Object.keys(LEET).map(Number).sort((a, b) => b - a);
function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const EMPTY_SESSION = { eon: {}, chu: {}, memo: '', bulk: {} };

// app.js의 문항별 채점(qg) — 일괄 정답 입력 모드 + 유형별 약점분석
export default function QGrade({ onSave }) {
  const [qgState, setQgState] = useState(loadQgState);
  const [year, setYear] = useState(YEARS_DESC.includes(2026) ? 2026 : YEARS_DESC[0]);
  const [date, setDate] = useState(todayStr);
  const [saving, setSaving] = useState(false);

  useEffect(() => { saveQgState(qgState); }, [qgState]);

  const key = `${year}_${date}`;
  const session = qgState[key] || EMPTY_SESSION;
  const bulkEon = session.bulk?.eon || '';
  const bulkChu = session.bulk?.chu || '';
  const d = LEET[year];

  const setBulk = (sec, text) => {
    const g = gradeSection(year, sec, text);
    setQgState((prev) => {
      const s = prev[key] || EMPTY_SESSION;
      return { ...prev, [key]: { ...s, bulk: { ...s.bulk, [sec]: text }, [sec]: g.ok ? g.marks : {} } };
    });
  };
  const setMemo = (text) => setQgState((prev) => {
    const s = prev[key] || EMPTY_SESSION;
    return { ...prev, [key]: { ...s, memo: text } };
  });

  const eonGrade = gradeSection(year, 'eon', bulkEon);
  const chuGrade = gradeSection(year, 'chu', bulkChu);
  const eonCnt = countFilled(bulkEon, d ? d.items_eon : 30);
  const chuCnt = countFilled(bulkChu, d ? d.items_chu : 40);

  // 결과 텍스트 (qgBulkApplyAll 이식)
  const resultParts = [];
  let hasError = false;
  if (bulkEon.trim()) {
    if (eonGrade.ok) resultParts.push(`언어 ${eonGrade.correct}/${eonGrade.total - eonGrade.blank}`);
    else { resultParts.push(`언어: ${eonGrade.msg}`); hasError = true; }
  }
  if (bulkChu.trim()) {
    if (chuGrade.ok) resultParts.push(`추리 ${chuGrade.correct}/${chuGrade.total - chuGrade.blank}`);
    else { resultParts.push(`추리: ${chuGrade.msg}`); hasError = true; }
  }
  if (eonGrade.ok && chuGrade.ok && (bulkEon.trim() || bulkChu.trim())) {
    const totalCorrect = eonGrade.correct + chuGrade.correct;
    const totalGraded = (eonGrade.total - eonGrade.blank) + (chuGrade.total - chuGrade.blank);
    if (totalGraded > 0) resultParts.push(`전체 ${totalCorrect}/${totalGraded} (${(totalCorrect / totalGraded * 100).toFixed(1)}%)`);
  }
  const showResult = (bulkEon.trim() || bulkChu.trim()) && resultParts.length > 0;

  const handleSave = async () => {
    if (saving) return;
    if (!date) { toast('풀이 날짜를 입력해주세요.', { type: 'warning' }); return; }
    const eonCorrect = Object.values(session.eon).filter((v) => v === 'correct').length;
    const chuCorrect = Object.values(session.chu).filter((v) => v === 'correct').length;
    if (eonCorrect === 0 && chuCorrect === 0) { toast('정답으로 표시된 문항이 없습니다.', { type: 'warning' }); return; }
    setSaving(true);
    try {
      const ok = await onSave({ year: parseInt(year, 10), date, eon: eonCorrect, chu: chuCorrect, memo: session.memo || '' });
      if (ok) toast(`저장 완료 · 언어 ${eonCorrect}/${d.items_eon}, 추리 ${chuCorrect}/${d.items_chu}`, { type: 'success', duration: 4000 });
    } finally { setSaving(false); }
  };

  const handleReset = async () => {
    const ok = await confirmAsync('이 회차의 모든 채점을 초기화하시겠습니까?', { title: '채점 초기화', okLabel: '초기화', danger: true });
    if (!ok) return;
    setQgState((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  return (
    <>
      <section className="qgrade-section tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-5 tw:!shadow-sm tw:md:!p-7" id="modePerQuestion">
        <div className="section-label tw:!text-xl tw:!font-extrabold tw:!text-slate-950">문항별 채점</div>
        <div className="section-desc tw:!mt-1 tw:!text-sm tw:!leading-6 tw:!text-slate-600">학년도와 풀이 날짜를 선택하고 본인이 고른 답을 순서대로 입력하면 메타데이터의 정답과 비교해 자동 채점되고, 카테고리·난이도별 약점이 분석됩니다.</div>

        <div className="qgrade-controls tw:!grid tw:!grid-cols-1 tw:!gap-3 tw:md:!grid-cols-3">
          <div className="field">
            <label>학년도 기출</label>
            <select className="log-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {YEARS_DESC.map((y) => <option key={y} value={y}>{y}학년도</option>)}
            </select>
          </div>
          <div className="field">
            <label>푼 날짜</label>
            <input type="date" className="log-date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 2 }}>
            <label>메모 (선택)</label>
            <input type="text" className="log-memo" placeholder="예: 추리 후반부 시간 부족" value={session.memo || ''} onChange={(e) => setMemo(e.target.value)} />
          </div>
        </div>

        <div className="qg-mode-pane" id="qgModeBulk">
          <div className="qg-bulk-help">
            본인이 고른 답을 순서대로 입력하세요. 공백·쉼표·줄바꿈 등 어떤 구분자든 OK. 안 푼 문항은 <code>-</code> 또는 <code>0</code> 또는 빈칸으로.
          </div>
          <div className="qg-bulk-block">
            <div className="qg-bulk-label">
              <span>언어이해 <span className={'qg-bulk-cnt' + (eonCnt.filled === eonCnt.max ? ' complete' : '') + (eonCnt.over ? ' over' : '')}>{eonCnt.filled}/{eonCnt.max}</span></span>
              <button className="btn-tiny" onClick={() => setBulk('eon', '')}>지우기</button>
            </div>
            <textarea className="qg-bulk-input" rows="2" placeholder="예: 4 2 3 2 1 4 2 3 4 1  3 1 2 3 3 4 5 4 3 2  5 2 1 5 5 2 3 4 1 2" value={bulkEon} onChange={(e) => setBulk('eon', e.target.value)} />
          </div>
          <div className="qg-bulk-block">
            <div className="qg-bulk-label">
              <span>추리논증 <span className={'qg-bulk-cnt' + (chuCnt.filled === chuCnt.max ? ' complete' : '') + (chuCnt.over ? ' over' : '')}>{chuCnt.filled}/{chuCnt.max}</span></span>
              <button className="btn-tiny" onClick={() => setBulk('chu', '')}>지우기</button>
            </div>
            <textarea className="qg-bulk-input" rows="3" placeholder="예: 2 3 2 5 3 2 1 4 5 2  1 3 1 5 1 3 5 1 2 3  ..." value={bulkChu} onChange={(e) => setBulk('chu', e.target.value)} />
          </div>
          {showResult && (
            <div className={'qg-bulk-result' + (hasError ? ' has-error' : '')} id="qgBulkResult" style={{ display: 'block' }}>
              <span>{resultParts.join(' · ')}</span>
            </div>
          )}
        </div>

        <div className="log-actions" style={{ marginTop: '18px' }}>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? '저장 중…' : '채점 결과 저장'}</button>
          <button className="btn-secondary" onClick={handleReset}>전체 초기화</button>
        </div>
      </section>

      <QStats year={year} session={session} />
    </>
  );
}

function QStats({ year, session }) {
  if (!hasMeta(year)) {
    return (
      <section className="qstats-section tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-5 tw:!shadow-sm" id="qstatsSection" style={{ display: 'block' }}>
        <div className="qstats-header"><div className="section-label" style={{ margin: 0 }}>유형별 정답률 분석</div></div>
        <div className="qstats-grid" id="qstatsGrid">
          <div className="qstats-empty" style={{ gridColumn: '1/-1' }}>{year}학년도 메타데이터가 아직 입력되지 않았습니다.<br />관리자 모드(URL에 ?admin=1)에서 정답·카테고리·난이도를 입력하면 약점 분석이 활성화됩니다.</div>
        </div>
      </section>
    );
  }
  const totalGraded = Object.keys(session.eon).length + Object.keys(session.chu).length;
  if (totalGraded === 0) {
    return (
      <section className="qstats-section tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-5 tw:!shadow-sm" id="qstatsSection" style={{ display: 'block' }}>
        <div className="qstats-header"><div className="section-label" style={{ margin: 0 }}>유형별 정답률 분석</div></div>
        <div className="qstats-grid" id="qstatsGrid">
          <div className="qstats-empty" style={{ gridColumn: '1/-1' }}>위에서 답안을 입력하면 카테고리·난이도별 정답률이 표시됩니다.</div>
        </div>
      </section>
    );
  }

  const wk = computeWeakness(year, session);
  const top3 = Object.values(wk.categories).filter((c) => c.total >= 2).sort((a, b) => b.weaknessScore - a.weaknessScore).slice(0, 3).filter((c) => c.weaknessScore > 0.05);

  const allCorrect = Object.values(session.eon).filter((v) => v === 'correct').length + Object.values(session.chu).filter((v) => v === 'correct').length;
  const allGraded = Object.keys(session.eon).length + Object.keys(session.chu).length;
  const summaryText = allGraded > 0 ? `채점 ${allGraded}문항 중 정답 ${allCorrect}개 (${(allCorrect / allGraded * 100).toFixed(1)}%)` : '';

  const Bar = ({ label, actualPct, expectedPct, color, cls, gapNode, valNode }) => (
    <div className="qstats-row">
      <span className="qs-label">{label}</span>
      <div className="qs-bar qs-bar-overlay">
        <div className={'qs-fill' + (cls ? ' ' + cls : '')} style={{ width: `${actualPct}%`, background: color }} />
        {expectedPct !== null && expectedPct !== undefined && <div className="qs-bar-expected" style={{ left: `${expectedPct}%` }} title={`예상 ${expectedPct.toFixed(0)}%`} />}
      </div>
      <span className="qs-pct">{gapNode}{valNode}</span>
    </div>
  );

  const fmtN = (n) => n.toFixed(n % 1 === 0 ? 0 : 1);
  const gapSpan = (gap) => <span className={gap >= 0 ? 'qs-gap-positive' : 'qs-gap-negative'}>({gap >= 0 ? '+' : ''}{gap})</span>;

  // 영역별 종합
  const sectionBlock = ['eon', 'chu'].filter((s) => wk.sections[s]).map((s) => {
    const sec = wk.sections[s];
    const actualPct = sec.total > 0 ? sec.correct / sec.total * 100 : 0;
    const expectedPct = sec.expectedCount > 0 ? sec.expectedSum / sec.expectedCount * 100 : null;
    const cls = actualPct >= 70 ? 'high' : (actualPct >= 50 ? 'med' : 'low');
    const gap = expectedPct !== null ? Math.round(actualPct - expectedPct) : null;
    return <Bar key={s} label={LEET_TAXONOMY[s].name} actualPct={actualPct} expectedPct={expectedPct} color="#7a7166" cls={cls}
      gapNode={gap !== null ? <>{gapSpan(gap)} </> : null} valNode={`${fmtN(sec.correct)}/${sec.total}`} />;
  });

  // 카테고리별 (영역별)
  const catBlocks = ['eon', 'chu'].map((sec) => {
    const cats = Object.values(wk.categories).filter((c) => c.sec === sec);
    if (cats.length === 0) return null;
    cats.sort((a, b) => b.weaknessScore - a.weaknessScore);
    return (
      <div key={sec}>
        <div className="qstats-block-title">{LEET_TAXONOMY[sec].name} 유형별 <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--ink-muted,#6b6256)' }}>· 점선=예상 정답률</span></div>
        {cats.map((c) => {
          const actualPct = c.actualRate * 100;
          const expectedPct = c.expectedRate !== null ? c.expectedRate * 100 : null;
          const cls = actualPct >= 70 ? 'high' : (actualPct >= 50 ? 'med' : 'low');
          const gap = c.gap !== null ? Math.round(c.gap * 100) : null;
          return <Bar key={c.category} label={c.name} actualPct={actualPct} expectedPct={expectedPct} color={c.color} cls={cls}
            gapNode={gap !== null ? <>{gapSpan(gap)} </> : null} valNode={`${fmtN(c.correct)}/${c.total}`} />;
        })}
      </div>
    );
  }).filter(Boolean);

  // 난이도별
  const diffOrder = ['하', '중하', '중', '중상', '상'];
  const diffRows = diffOrder.filter((dl) => wk.byDifficulty[dl]).map((dl) => {
    const s = wk.byDifficulty[dl];
    const actualPct = s.total > 0 ? (s.correct / s.total * 100) : 0;
    const expectedPct = s.expected * 100;
    const gap = Math.round(actualPct - expectedPct);
    return <Bar key={dl} label={dl} actualPct={actualPct} expectedPct={expectedPct} color={DIFFICULTY_LEVELS[dl].color} cls={null}
      gapNode={<>{gapSpan(gap)} </>} valNode={`${fmtN(s.correct)}/${s.total}`} />;
  });

  return (
    <section className="qstats-section tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-5 tw:!shadow-sm" id="qstatsSection" style={{ display: 'block' }}>
      <div className="qstats-header">
        <div className="section-label" style={{ margin: 0 }}>유형별 정답률 분석</div>
        <span className="qstats-summary">{summaryText}</span>
      </div>
      <div className="qstats-grid" id="qstatsGrid">
        {top3.length > 0 && (
          <div className="weakness-card" style={{ gridColumn: '1/-1' }}>
            <div className="weakness-card-header">
              <span className="weakness-card-icon"></span>
              <span className="weakness-card-title">집중 학습이 필요한 영역 TOP {top3.length}</span>
            </div>
            <div className="weakness-list">
              {top3.map((c, i) => {
                const sectionName = c.sec === 'eon' ? '언어' : '추리';
                const actualPct = (c.actualRate * 100).toFixed(0);
                const expectedPct = c.expectedRate !== null ? (c.expectedRate * 100).toFixed(0) : null;
                let detailText = `정답률 ${actualPct}%`;
                if (expectedPct !== null) {
                  const gap = Math.round((c.actualRate - c.expectedRate) * 100);
                  detailText += ` (예상 ${expectedPct}%, ${gap >= 0 ? '+' : ''}${gap}%p)`;
                }
                detailText += ` · ${c.correct}/${c.total}문항`;
                return (
                  <div className="weakness-item" key={c.category}>
                    <div className="weakness-rank">{String(i + 1).padStart(2, '0')}</div>
                    <div>
                      <div className="weakness-name">{sectionName} · {c.name}</div>
                      <div className="weakness-detail">{detailText}</div>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--ink-on-dark-mute)', textAlign: 'right', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
                      약점 점수<br />
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-on-dark)', fontSize: '18px', letterSpacing: '-0.02em' }}>{(c.weaknessScore * 100).toFixed(0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {sectionBlock.length > 0 && (
          <div>
            <div className="qstats-block-title">영역별 종합 <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--ink-muted,#6b6256)' }}>· 점선=예상 정답률</span></div>
            {sectionBlock}
          </div>
        )}
        {catBlocks}
        {diffRows.length > 0 && (
          <div>
            <div className="qstats-block-title">난이도별 <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--ink-muted,#6b6256)' }}>· 점선=예상 정답률</span></div>
            {diffRows}
          </div>
        )}
      </div>
    </section>
  );
}
