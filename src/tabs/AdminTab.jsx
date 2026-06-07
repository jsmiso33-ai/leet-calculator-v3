import { useEffect, useState } from 'react';
import { LEET } from '../../data/leet.js';
import { LEET_META, LEET_TAXONOMY, DIFFICULTY_LEVELS } from '../../data/meta.js';
import { confirmAsync, toast } from '../lib/ui.js';

// admin.js 이식 — 메타데이터 관리자(소유자 전용, ?admin=1). 드래프트는 localStorage.
const ADMIN_KEY = 'leet_meta_draft_v1';
const YEARS_DESC = Object.keys(LEET).map(Number).sort((a, b) => b - a);
const DIFFS = ['하', '중하', '중', '중상', '상'];

function loadDraft() {
  try { const r = localStorage.getItem(ADMIN_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function itemStatus(item) {
  if (!item) return 'empty';
  const hasAns = item.answer !== null && item.answer !== undefined;
  if (hasAns && !!item.category && !!item.difficulty) return 'complete';
  if (hasAns || item.category || item.difficulty) return 'partial';
  return 'empty';
}

export default function AdminTab() {
  const [draft, setDraft] = useState(() => {
    const d = loadDraft();
    Object.keys(LEET_META).forEach((y) => { if (!d[y]) d[y] = LEET_META[y]; });
    return d;
  });
  const [year, setYear] = useState(YEARS_DESC.includes(2026) ? 2026 : YEARS_DESC[0]);
  const [form, setForm] = useState(null); // 편집 모달 폼 (열려있으면 객체)

  useEffect(() => { try { localStorage.setItem(ADMIN_KEY, JSON.stringify(draft)); } catch { /* ignore */ } }, [draft]);

  const yearData = LEET[year];
  const yd = { eon: draft[year]?.eon || [], chu: draft[year]?.chu || [] };
  const getItem = (sec, no) => yd[sec].find((q) => q.no === no) || null;

  const setItem = (sec, no, data) => setDraft((prev) => {
    const d = { ...prev };
    const cur = { eon: [...(d[year]?.eon || [])], chu: [...(d[year]?.chu || [])] };
    const idx = cur[sec].findIndex((q) => q.no === no);
    if (idx >= 0) cur[sec][idx] = { ...cur[sec][idx], ...data, no };
    else cur[sec] = [...cur[sec], { no, ...data }].sort((a, b) => a.no - b.no);
    d[year] = cur;
    return d;
  });
  const deleteItem = (sec, no) => setDraft((prev) => {
    const d = { ...prev };
    const cur = { eon: [...(d[year]?.eon || [])], chu: [...(d[year]?.chu || [])] };
    cur[sec] = cur[sec].filter((q) => q.no !== no);
    d[year] = cur;
    return d;
  });

  const openModal = (sec, no) => {
    const item = getItem(sec, no) || {};
    setForm({
      sec, no,
      answer: item.answer ?? null, category: item.category || '', subcategory: item.subcategory || '',
      difficulty: item.difficulty || '', passage_group: item.passage_group || '', tags: (item.tags || []).join(', '), memo: item.memo || '',
    });
  };
  const closeModal = () => setForm(null);
  const collectForm = (f) => ({
    answer: f.answer ?? null, category: f.category || null, subcategory: f.subcategory.trim() || null,
    difficulty: f.difficulty || null, passage_group: f.passage_group ? parseInt(f.passage_group, 10) : null,
    tags: f.tags.trim() ? f.tags.split(',').map((t) => t.trim()).filter(Boolean) : [], memo: f.memo.trim() || null,
  });
  const saveForm = (f) => { if (f) setItem(f.sec, f.no, collectForm(f)); };
  const moveTo = (delta) => {
    saveForm(form);
    const eonMax = yearData.items_eon, chuMax = yearData.items_chu;
    let absIdx = form.sec === 'eon' ? form.no : eonMax + form.no;
    absIdx += delta;
    if (absIdx < 1) absIdx = 1;
    if (absIdx > eonMax + chuMax) { closeModal(); return; }
    if (absIdx <= eonMax) openModal('eon', absIdx); else openModal('chu', absIdx - eonMax);
  };

  // 진행률
  const completeCount = (sec) => {
    const max = sec === 'eon' ? yearData.items_eon : yearData.items_chu;
    let c = 0; for (let n = 1; n <= max; n++) if (itemStatus(getItem(sec, n)) === 'complete') c++;
    return c;
  };
  const eonDone = completeCount('eon'), chuDone = completeCount('chu');
  const total = yearData.items_eon + yearData.items_chu;
  const allComplete = eonDone + chuDone;
  const pct = total > 0 ? (allComplete / total * 100) : 0;

  // 액션
  const doExport = () => {
    const obj = { year, generated_at: new Date().toISOString(), eon: yd.eon, chu: yd.chu };
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leet_meta_${year}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const doImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.year || !data.eon || !data.chu) { toast('JSON 형식이 올바르지 않습니다. {year, eon, chu} 구조여야 합니다.', { type: 'error' }); return; }
        const ok = await confirmAsync(`${data.year}학년도 데이터를 불러오시겠습니까? 기존 데이터는 덮어쓰여집니다.`, { title: 'JSON 불러오기', okLabel: '불러오기' });
        if (!ok) return;
        setDraft((prev) => ({ ...prev, [data.year]: { eon: data.eon, chu: data.chu } }));
        setYear(data.year);
        toast(`${data.year}학년도 메타데이터 불러오기 완료`, { type: 'success' });
      } catch (err) { toast('JSON 파싱 실패: ' + err.message, { type: 'error' }); }
      e.target.value = '';
    };
    reader.readAsText(file);
  };
  const fillSequential = () => {
    setDraft((prev) => {
      const d = { ...prev };
      const cur = { eon: [...(d[year]?.eon || [])], chu: [...(d[year]?.chu || [])] };
      ['eon', 'chu'].forEach((sec) => {
        const max = sec === 'eon' ? yearData.items_eon : yearData.items_chu;
        for (let n = 1; n <= max; n++) if (!cur[sec].find((q) => q.no === n)) cur[sec].push({ no: n, answer: null, category: null, difficulty: null });
        cur[sec].sort((a, b) => a.no - b.no);
      });
      d[year] = cur;
      return d;
    });
    toast('빈 슬롯 생성 완료', { type: 'success' });
  };
  const loadFromCode = async () => {
    const ok = await confirmAsync('코드에 내장된 LEET_META를 불러옵니다. 현재 작업물이 덮어쓰여질 수 있습니다.', { title: '코드에서 불러오기', okLabel: '불러오기' });
    if (!ok) return;
    setDraft((prev) => { const d = { ...prev }; Object.keys(LEET_META).forEach((y) => { d[y] = LEET_META[y]; }); return d; });
    toast('코드 데이터 불러오기 완료', { type: 'success' });
  };
  const clearYear = async () => {
    const ok = await confirmAsync(`${year}학년도 데이터를 모두 삭제하시겠습니까?`, { title: '학년도 초기화', okLabel: '삭제', danger: true });
    if (!ok) return;
    setDraft((prev) => ({ ...prev, [year]: { eon: [], chu: [] } }));
  };

  const Grid = ({ sec }) => {
    const max = sec === 'eon' ? yearData.items_eon : yearData.items_chu;
    const cells = [];
    for (let n = 1; n <= max; n++) {
      const item = getItem(sec, n);
      const status = itemStatus(item);
      const catColor = item && item.category && LEET_TAXONOMY[sec].categories[item.category]
        ? LEET_TAXONOMY[sec].categories[item.category].color : null;
      cells.push(
        <div key={n} className={'admin-cell' + (status === 'complete' ? ' complete' : status === 'partial' ? ' partial' : '')} onClick={() => openModal(sec, n)}>
          <div className="admin-cell-num">{n}</div>
          {item && item.answer ? <div className="admin-cell-ans">정답 {item.answer}</div> : null}
          {catColor ? <div className="admin-cell-cat-bar" style={{ background: catColor }} /> : null}
        </div>
      );
    }
    return <div className="admin-grid">{cells}</div>;
  };

  return (
    <>
      <section className="input-area">
        <div className="section-label">메타데이터 관리자 모드</div>
        <div className="section-desc">기출문제의 정답·카테고리·난이도를 입력해서 약점 진단 기능을 활성화합니다. 입력한 데이터는 브라우저에 자동 저장되며, JSON으로 다운로드해서 코드에 포함시킬 수 있습니다.</div>

        <div className="admin-controls">
          <div className="field">
            <label>학년도</label>
            <select className="log-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {YEARS_DESC.map((y) => <option key={y} value={y}>{y}학년도</option>)}
            </select>
          </div>
          <div className="field admin-progress-field">
            <label>입력 진행률</label>
            <div className="admin-progress-wrap">
              <div className="admin-progress-bar"><div className="admin-progress-fill" style={{ width: pct.toFixed(1) + '%' }} /></div>
              <span className="admin-progress-text">{allComplete} / {total} ({pct.toFixed(0)}%)</span>
            </div>
          </div>
          <div className="field admin-actions-field">
            <label>&nbsp;</label>
            <div className="admin-action-buttons">
              <button className="btn-secondary" onClick={loadFromCode} title="코드에 내장된 기존 데이터 불러오기">코드에서 불러오기</button>
              <label className="btn-secondary" style={{ cursor: 'pointer' }}>JSON 불러오기
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={doImport} />
              </label>
              <button className="btn-primary" onClick={doExport}>JSON 다운로드</button>
            </div>
          </div>
        </div>

        <div className="admin-bulk-bar">
          <span className="admin-bulk-label">일괄 도구:</span>
          <button className="btn-tiny" onClick={fillSequential} title="모든 문항에 빈 카테고리 슬롯 생성">빈 슬롯 생성</button>
          <button className="btn-tiny btn-danger" onClick={clearYear} title="이 학년도 데이터 모두 삭제">이 학년도 초기화</button>
        </div>
      </section>

      <section className="qgrade-section">
        <div className="qgrade-section-block">
          <div className="qgrade-section-title"><span>언어이해</span><span className="qg-score">{eonDone} / {yearData.items_eon}</span></div>
          <Grid sec="eon" />
        </div>
        <div className="qgrade-section-block" style={{ marginTop: '24px' }}>
          <div className="qgrade-section-title"><span>추리논증</span><span className="qg-score">{chuDone} / {yearData.items_chu}</span></div>
          <Grid sec="chu" />
        </div>
        <div className="admin-legend">
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>셀 색상:</span>
          <span className="qgrade-legend-item"><span className="qgrade-legend-swatch" style={{ background: '#FAFBFC' }} />미입력</span>
          <span className="qgrade-legend-item"><span className="qgrade-legend-swatch" style={{ background: '#fff8e1', borderColor: '#c4a14a' }} />일부 입력</span>
          <span className="qgrade-legend-item"><span className="qgrade-legend-swatch" style={{ background: '#e8f5e9', borderColor: '#2e7d32' }} />완료 (정답+분류+난이도)</span>
        </div>
      </section>

      {form && (
        <div className="admin-modal" style={{ display: 'flex' }}>
          <div className="admin-modal-backdrop" onClick={closeModal} />
          <div className="admin-modal-card">
            <div className="admin-modal-head">
              <h3>{year}학년도 {form.sec === 'eon' ? '언어이해' : '추리논증'} {form.no}번</h3>
              <button className="admin-modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-field">
                <label>정답</label>
                <div className="admin-answer-row">
                  {[1, 2, 3, 4, 5].map((a) => (
                    <button key={a} type="button" className={form.answer === a ? 'active' : ''} onClick={() => setForm((f) => ({ ...f, answer: f.answer === a ? null : a }))}>{a}</button>
                  ))}
                </div>
              </div>
              <div className="admin-field">
                <label>카테고리 (대분류)</label>
                <select className="log-select" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  <option value="">-- 선택 --</option>
                  {Object.entries(LEET_TAXONOMY[form.sec].categories).map(([key, cat]) => <option key={key} value={key}>{cat.name}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label>소분류 (자유 입력, 선택)</label>
                <input type="text" placeholder="예: 주제찾기, 강화·약화, 모순 찾기" value={form.subcategory} onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))} />
              </div>
              <div className="admin-field">
                <label>난이도</label>
                <div className="admin-diff-row">
                  {DIFFS.map((dl) => (
                    <button key={dl} type="button" className={form.difficulty === dl ? 'active' : ''} onClick={() => setForm((f) => ({ ...f, difficulty: f.difficulty === dl ? '' : dl }))}>{dl}</button>
                  ))}
                </div>
                <div className="admin-diff-hint">
                  {form.difficulty && DIFFICULTY_LEVELS[form.difficulty]
                    ? `예상 정답률: ${(DIFFICULTY_LEVELS[form.difficulty].expected_rate * 100).toFixed(0)}% — 이 난이도면 평균적으로 이 비율로 맞춥니다.`
                    : '난이도를 선택하면 예상 정답률이 표시됩니다.'}
                </div>
              </div>
              {form.sec === 'eon' && (
                <div className="admin-field">
                  <label>지문 묶음 ID (언어이해, 선택)</label>
                  <input type="number" inputMode="numeric" pattern="[0-9]*" min="1" placeholder="같은 지문 문항끼리 같은 숫자" value={form.passage_group} onChange={(e) => setForm((f) => ({ ...f, passage_group: e.target.value }))} />
                </div>
              )}
              <div className="admin-field">
                <label>태그 (쉼표로 구분, 선택)</label>
                <input type="text" placeholder="예: 주제찾기, 비유추리" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
              </div>
              <div className="admin-field">
                <label>메모 (선택)</label>
                <input type="text" placeholder="주관적 메모" value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} />
              </div>
            </div>
            <div className="admin-modal-foot">
              <button className="btn-secondary" onClick={() => { deleteItem(form.sec, form.no); closeModal(); }}>삭제</button>
              <div style={{ flex: 1 }} />
              <button className="btn-secondary" onClick={() => moveTo(-1)}>← 이전</button>
              <button className="btn-primary" onClick={() => moveTo(1)}>저장 후 다음 →</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
