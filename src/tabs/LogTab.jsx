import { useMemo, useState } from 'react';
import { LEET } from '../../data/leet.js';
import { getStdScore } from '../lib/score.js';
import { useLogs } from '../lib/useLogs.js';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from '../lib/ui.js';
import LogChart from '../components/LogChart.jsx';
import QGrade from '../components/QGrade.jsx';
import { Input } from '../components/ui/input.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';

const YEARS_DESC = Object.keys(LEET).map(Number).sort((a, b) => b - a);

function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const parseRaw = (v) => (v === '' || isNaN(parseInt(v, 10))) ? null : parseInt(v, 10);

export default function LogTab() {
  const { user, signIn } = useAuth();
  const { entries, syncStatus, addEntry, deleteEntry } = useLogs();

  const [mode, setMode] = useState('total'); // 'total' | 'per-question'
  const [logYear, setLogYear] = useState(YEARS_DESC[0]);
  const [logDate, setLogDate] = useState(todayStr);
  const [logEon, setLogEon] = useState('');
  const [logChu, setLogChu] = useState('');
  const [logMemo, setLogMemo] = useState('');
  const [dateError, setDateError] = useState('');
  const [adding, setAdding] = useState(false);

  const d = LEET[logYear];
  const eonRaw = parseRaw(logEon);
  const chuRaw = parseRaw(logChu);

  // 미리보기
  const prevEonR = eonRaw !== null ? getStdScore(logYear, 'eon', eonRaw) : null;
  const prevChuR = chuRaw !== null ? getStdScore(logYear, 'chu', chuRaw) : null;
  const showPreview = eonRaw !== null || chuRaw !== null;
  const prevTotal = (prevEonR && prevChuR) ? (prevEonR.std + prevChuR.std) : null;

  const handleAdd = async () => {
    if (adding) return;
    if (!logDate) { setDateError('날짜를 입력해주세요.'); return; }
    if (eonRaw === null && chuRaw === null) {
      toast('언어 또는 추리 점수 중 하나는 입력해주세요.', { type: 'warning' });
      return;
    }
    setAdding(true);
    try {
      const ok = await addEntry({ year: parseInt(logYear, 10), date: logDate, eon: eonRaw, chu: chuRaw, memo: logMemo.trim() });
      if (ok) { setLogEon(''); setLogChu(''); setLogMemo(''); }
    } finally { setAdding(false); }
  };

  // 기록 환산 + 통계
  const enriched = useMemo(() => entries.map((e) => {
    const eon = e.eon !== null && e.eon !== undefined ? getStdScore(e.year, 'eon', e.eon) : null;
    const chu = e.chu !== null && e.chu !== undefined ? getStdScore(e.year, 'chu', e.chu) : null;
    const total = (eon && chu) ? eon.std + chu.std : null;
    return { ...e, eonStd: eon?.std ?? null, chuStd: chu?.std ?? null, total };
  }), [entries]);

  const validTotals = enriched.filter((e) => e.total !== null).map((e) => e.total);
  const sortedByDate = useMemo(() => [...enriched].sort((a, b) => a.date.localeCompare(b.date)), [enriched]);
  const sortedDesc = useMemo(() => [...enriched].sort((a, b) => b.date.localeCompare(a.date)), [enriched]);
  const recent = sortedByDate.length ? sortedByDate[sortedByDate.length - 1] : null;
  const avg = validTotals.length ? (validTotals.reduce((a, b) => a + b, 0) / validTotals.length) : null;

  return (
    <>
      <div className="grade-mode-toggle tw:!mb-4 tw:!flex tw:!flex-wrap tw:!gap-2 tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-2 tw:!shadow-sm">
        <button data-grade-mode="total" className={mode === 'total' ? 'active' : ''} onClick={() => setMode('total')}>회차 단위 입력 (점수만)</button>
        <button data-grade-mode="per-question" className={mode === 'per-question' ? 'active' : ''} onClick={() => setMode('per-question')}>문항별 채점 (O/X)</button>
      </div>

      {!user && (
        <section className="login-nudge-card tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-4 tw:!shadow-sm" id="loginNudgeCard">
          <div className="login-nudge-copy">
            <div className="login-nudge-kicker">게스트 기록 저장 중</div>
            <div className="login-nudge-title" id="loginNudgeTitle">
              {entries.length === 0
                ? '첫 풀이 기록부터 계정에 안전하게 보관하세요.'
                : <>지금까지 만든 <span id="loginNudgeCount">{entries.length}</span>개의 풀이 기록을 계정에 보관하세요.</>}
            </div>
            <div className="login-nudge-desc">로그인하면 게스트 기록을 계정에 보관하고 이어볼 수 있어요.</div>
          </div>
          <button className="login-nudge-btn" type="button" onClick={() => signIn('google')}>로그인해서 기록 보관</button>
        </section>
      )}

      {mode === 'total' ? (
        <section className="input-area tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-5 tw:!shadow-sm tw:md:!p-7" id="modeTotal">
          <div className="section-label tw:!text-xl tw:!font-extrabold tw:!text-slate-950">새 기출 기록 추가</div>
          <div className="section-desc tw:!mt-1 tw:!text-sm tw:!leading-6 tw:!text-slate-600">푼 학년도 기출, 풀이 날짜, 점수를 입력하면 표준점수가 자동 계산되어 기록됩니다.</div>

          <div className="log-input-grid tw:!grid tw:!grid-cols-1 tw:!gap-3 tw:md:!grid-cols-2 tw:xl:!grid-cols-4">
            <div className="field">
              <label>학년도 기출</label>
              <Select value={String(logYear)} onValueChange={(v) => setLogYear(Number(v))}>
                <SelectTrigger aria-label="학년도 기출">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS_DESC.map((y) => <SelectItem key={y} value={String(y)}>{y}학년도 (제{y - 2008}회)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="field">
              <label>푼 날짜</label>
              <Input type="date" value={logDate} onChange={(e) => { setLogDate(e.target.value); setDateError(''); }} />
              {dateError && <div className="field-error" role="alert">{dateError}</div>}
            </div>
            <div className="field">
              <label>언어이해 원점수 <span className="max">/ {d ? d.items_eon : 30}</span></label>
              <Input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max={d ? d.items_eon : 40} step="1" placeholder="0" value={logEon} onChange={(e) => setLogEon(e.target.value)} />
            </div>
            <div className="field">
              <label>추리논증 원점수 <span className="max">/ {d ? d.items_chu : 40}</span></label>
              <Input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max={d ? d.items_chu : 40} step="1" placeholder="0" value={logChu} onChange={(e) => setLogChu(e.target.value)} />
            </div>
          </div>
          <div className="field" style={{ marginTop: '12px' }}>
            <label>메모 (선택)</label>
            <Input type="text" placeholder="예: 시간 부족, 추리 연습장 활용 등" value={logMemo} onChange={(e) => setLogMemo(e.target.value)} />
          </div>

          {showPreview && (
            <div className="log-preview" id="logPreview" style={{ display: 'block' }}>
              <div className="preview-row">
                <div className="preview-item"><span className="pl">언어이해 표점</span><span className="pv">{prevEonR ? prevEonR.std.toFixed(1) : '—'}</span></div>
                <div className="preview-item"><span className="pl">추리논증 표점</span><span className="pv">{prevChuR ? prevChuR.std.toFixed(1) : '—'}</span></div>
                <div className="preview-item"><span className="pl">합계</span><span className="pv total">{prevTotal !== null ? prevTotal.toFixed(1) : '—'}</span></div>
              </div>
            </div>
          )}

          <div className="log-actions">
            <button className="btn-primary" onClick={handleAdd} disabled={adding}>{adding ? '저장 중…' : '기록 추가'}</button>
          </div>
        </section>
      ) : (
        <QGrade onSave={addEntry} />
      )}

      {validTotals.length > 0 && (
        <section className="log-stats tw:!grid tw:!grid-cols-2 tw:!gap-3 tw:lg:!grid-cols-4" id="logStats" style={{ display: 'grid' }}>
          <div className="stat-card"><div className="stat-label">총 풀이 기록</div><div className="stat-value">{enriched.length}</div></div>
          <div className="stat-card"><div className="stat-label">평균 합계</div><div className="stat-value">{avg !== null ? avg.toFixed(1) : '—'}</div></div>
          <div className="stat-card"><div className="stat-label">최고 합계</div><div className="stat-value">{Math.max(...validTotals).toFixed(1)}</div></div>
          <div className="stat-card"><div className="stat-label">최근 합계</div><div className="stat-value">{recent && recent.total !== null ? recent.total.toFixed(1) : '—'}</div></div>
        </section>
      )}

      {validTotals.length >= 2 && (
        <section className="chart-card tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-5 tw:!shadow-sm" id="logChartCard" style={{ display: 'block' }}>
          <div className="section-label">시간순 표준점수 추이</div>
          <div className="section-desc">푼 날짜 순으로 표준점수 합계 변화를 보여줍니다.</div>
          <LogChart rows={sortedByDate} />
        </section>
      )}

      <section className="log-list-card tw:!overflow-hidden tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!shadow-sm">
        <div style={{ display: 'flex', alignItems: 'center', padding: '24px 28px 0' }}>
          <div className="section-label" style={{ margin: 0 }}>기록 목록</div>
          {user && syncStatus && (
            <span className={'sync-indicator ' + syncStatus.status} id="syncIndicator" style={{ display: 'inline-flex' }}>
              <span className="sync-dot"></span>
              <span id="syncText">{syncStatus.text}</span>
            </span>
          )}
        </div>
        <div className="log-list" id="logList">
          {sortedDesc.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              아직 기록이 없습니다.<br />위쪽에서 첫 기출 풀이 기록을 추가해보세요.
            </div>
          ) : sortedDesc.map((e) => {
            const dateFormatted = e.date.replace(/-/g, '.');
            const eonText = e.eon !== null && e.eon !== undefined ? `언어 ${e.eon}→${e.eonStd !== null ? e.eonStd.toFixed(1) : '—'}` : '';
            const chuText = e.chu !== null && e.chu !== undefined ? `추리 ${e.chu}→${e.chuStd !== null ? e.chuStd.toFixed(1) : '—'}` : '';
            const detailParts = [eonText, chuText].filter(Boolean).join(' · ');
            return (
              <div key={e.id} className="log-entry tw:!grid tw:!grid-cols-[88px_minmax(0,1fr)_auto_auto] tw:!items-center tw:!gap-3 tw:!border-t tw:!border-slate-100 tw:!px-4 tw:!py-3 tw:transition-colors tw:hover:!bg-blue-50/40 tw:max-sm:!grid-cols-[1fr_auto]">
                <div className="e-date tw:!font-mono tw:!text-xs tw:!font-bold tw:!text-slate-500">{dateFormatted}</div>
                <div className="e-info tw:!min-w-0">
                  <div className="e-year tw:!text-sm tw:!font-extrabold tw:!text-slate-950">{e.year}학년도 기출</div>
                  <div className="e-detail tw:!mt-1 tw:!text-xs tw:!font-semibold tw:!text-slate-500">{detailParts}</div>
                  {e.memo && <div className="e-memo tw:!mt-1 tw:!truncate tw:!text-xs tw:!text-slate-400">"{e.memo}"</div>}
                </div>
                <div className="e-scores tw:!text-right">
                  <div className="e-total tw:!font-mono tw:!text-lg tw:!font-extrabold tw:!text-slate-950">{e.total !== null ? e.total.toFixed(1) : '—'}</div>
                  <div className="e-sub tw:!text-[11px] tw:!font-bold tw:!text-slate-500">표점 합계</div>
                </div>
                <button className="e-delete tw:!inline-flex tw:!h-8 tw:!w-8 tw:!items-center tw:!justify-center tw:!rounded-lg tw:!border tw:!border-slate-200 tw:!bg-white tw:!text-base tw:!font-bold tw:!text-slate-500 tw:transition-colors tw:hover:!border-red-300 tw:hover:!text-red-600 tw:focus-visible:!outline tw:focus-visible:!outline-2 tw:focus-visible:!outline-offset-2 tw:focus-visible:!outline-blue-500" onClick={() => deleteEntry(e.id)} title="삭제">×</button>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
