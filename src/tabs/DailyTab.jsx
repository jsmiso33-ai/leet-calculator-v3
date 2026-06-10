import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase, withTimeout } from '../lib/supabase.js';
import { toast, confirmAsync } from '../lib/ui.js';
import { track } from '../lib/analytics.js';

// 오늘의 지문 — AI 생성 언어이해 지문 1개 + 문항 3개를 매일 발행.
// 발행분은 Supabase daily_passages(RLS: published만 공개)에서 읽는다.
// 관리자(?admin=1 + 소유자 Google 로그인)는 같은 탭 하단에서 pending 검수·발행.

const DONE_KEY = 'leet_daily_v1';
const NUMS = ['①', '②', '③', '④', '⑤'];

function loadDone() {
  try { const r = localStorage.getItem(DONE_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function saveDone(map) {
  try { localStorage.setItem(DONE_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}
function fmtDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

// ── 지문 + 문항 풀이 카드 (일반/관리자 미리보기 공용) ──────────────────────────
function PassageCard({ row, preview }) {
  const doneMap = loadDone();
  const saved = !preview ? doneMap[row.id] : null;
  const [answers, setAnswers] = useState(saved?.answers || {});
  const [submitted, setSubmitted] = useState(!!saved);

  useEffect(() => {
    const d = loadDone()[row.id];
    setAnswers(d?.answers || {});
    setSubmitted(!!d);
  }, [row.id]);

  const questions = Array.isArray(row.questions) ? row.questions : [];
  const allAnswered = questions.every((q) => answers[q.no] >= 1);
  const correctCount = questions.filter((q) => answers[q.no] === q.answer).length;

  const submit = () => {
    if (!allAnswered) { toast('모든 문항에 답해주세요.', { type: 'error' }); return; }
    setSubmitted(true);
    if (!preview) {
      const map = loadDone();
      map[row.id] = { answers, correct: correctCount, total: questions.length, at: new Date().toISOString() };
      saveDone(map);
      track('daily_submit', { passage_date: row.publish_date, correct: correctCount });
    }
  };
  const retry = () => {
    setAnswers({}); setSubmitted(false);
    if (!preview) { const map = loadDone(); delete map[row.id]; saveDone(map); }
  };

  return (
    <>
      <section className="input-area tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-5 tw:!shadow-sm tw:md:!p-7">
        <div className="tw:!flex tw:!flex-wrap tw:!items-center tw:!gap-2 tw:!text-xs tw:!font-bold tw:!text-slate-500">
          <span>{fmtDate(row.publish_date)}</span>
          <span className="tw:!rounded-full tw:!bg-blue-50 tw:!px-2.5 tw:!py-0.5 tw:!text-blue-700">{row.topic}</span>
          {row.difficulty && <span className="tw:!rounded-full tw:!bg-amber-50 tw:!px-2.5 tw:!py-0.5 tw:!text-amber-700">난이도 {row.difficulty}</span>}
        </div>
        <h2 className="tw:!mt-2 tw:!text-xl tw:!font-extrabold tw:!text-slate-950 tw:md:!text-2xl">{row.passage_title}</h2>
        <div className="tw:!mt-4 tw:!space-y-4 tw:!text-[15px] tw:!leading-7 tw:!text-slate-800">
          {row.passage.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      {questions.map((q) => {
        const chosen = answers[q.no];
        return (
          <section key={q.no} className="input-area tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-5 tw:!shadow-sm">
            <div className="tw:!text-sm tw:!font-extrabold tw:!text-slate-950">
              <span className="tw:!mr-2 tw:!text-blue-700">{q.no}.</span>{q.stem}
              <span className="tw:!ml-2 tw:!text-xs tw:!font-bold tw:!text-slate-400">[{q.qtype}]</span>
            </div>
            <div className="tw:!mt-3 tw:!space-y-1.5">
              {q.choices.map((c, i) => {
                const n = i + 1;
                const isChosen = chosen === n;
                const isAnswer = q.answer === n;
                let cls = 'tw:!w-full tw:!rounded-lg tw:!border tw:!px-3 tw:!py-2.5 tw:!text-left tw:!text-sm tw:!leading-6 tw:transition-colors ';
                if (submitted) {
                  if (isAnswer) cls += 'tw:!border-green-400 tw:!bg-green-50 tw:!font-bold tw:!text-green-900';
                  else if (isChosen) cls += 'tw:!border-red-300 tw:!bg-red-50 tw:!text-red-800';
                  else cls += 'tw:!border-slate-200 tw:!bg-white tw:!text-slate-500';
                } else {
                  cls += isChosen
                    ? 'tw:!border-blue-500 tw:!bg-blue-50 tw:!font-bold tw:!text-blue-900'
                    : 'tw:!border-slate-200 tw:!bg-white tw:!text-slate-700 tw:hover:!border-blue-300 tw:hover:!bg-slate-50';
                }
                return (
                  <button key={n} type="button" className={cls} disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [q.no]: n }))}>
                    <span className="tw:!mr-1.5 tw:!font-bold">{NUMS[i]}</span>{c}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div className="tw:!mt-3 tw:!rounded-lg tw:!border tw:!border-slate-200 tw:!bg-slate-50 tw:!p-3.5 tw:!text-sm tw:!leading-6 tw:!text-slate-700">
                <div className="tw:!mb-1 tw:!font-extrabold tw:!text-slate-900">
                  {chosen === q.answer ? '⭕ 정답' : `❌ 오답 (정답: ${NUMS[q.answer - 1]})`}
                </div>
                {q.explanation}
              </div>
            )}
          </section>
        );
      })}

      <div className="tw:!flex tw:!items-center tw:!gap-3">
        {!submitted ? (
          <button className="btn-primary" onClick={submit} disabled={!allAnswered}>채점하기</button>
        ) : (
          <>
            <span className="tw:!text-sm tw:!font-extrabold tw:!text-slate-900">
              {questions.length}문항 중 <span className="tw:!text-blue-700">{correctCount}개</span> 정답
            </span>
            <button className="btn-secondary" onClick={retry}>다시 풀기</button>
          </>
        )}
      </div>
    </>
  );
}

// ── 관리자 검수 패널 ──────────────────────────────────────────────────────────
function AdminReview({ onPublished }) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error } = await withTimeout(
      supabase.from('daily_passages').select('*')
        .in('status', ['pending', 'rejected']).order('publish_date', { ascending: false }),
      30000, '검수 목록'
    );
    if (error) { console.error(error); return; }
    setRows(data || []);
  }, []);

  useEffect(() => { if (user) refresh(); }, [user, refresh]);

  if (!user) {
    return (
      <section className="input-area tw:!rounded-xl tw:!border tw:!border-dashed tw:!border-slate-300 tw:!bg-slate-50 tw:!p-5">
        <div className="section-label">지문 검수 (관리자)</div>
        <div className="section-desc">pending 지문을 보려면 소유자 Google 계정으로 로그인하세요. (RLS로 보호됨)</div>
      </section>
    );
  }

  const setStatus = async (row, status) => {
    const label = status === 'published' ? '발행' : '반려';
    const ok = await confirmAsync(`${fmtDate(row.publish_date)} "${row.passage_title}" 지문을 ${label}하시겠습니까?`, { title: `지문 ${label}`, okLabel: label, danger: status === 'rejected' });
    if (!ok) return;
    setBusy(true);
    try {
      const { error, count } = await supabase.from('daily_passages')
        .update({ status, published_at: status === 'published' ? new Date().toISOString() : null, reviewed_by: user.email }, { count: 'exact' })
        .eq('id', row.id);
      if (error) throw error;
      if (count === 0) throw new Error('권한이 없거나 행을 찾지 못했습니다 (RLS).');
      toast(`${label} 완료`, { type: 'success' });
      await refresh();
      if (status === 'published') onPublished();
    } catch (e) {
      toast(`${label} 실패: ` + e.message, { type: 'error' });
    } finally { setBusy(false); }
  };

  return (
    <section className="input-area tw:!rounded-xl tw:!border tw:!border-amber-300 tw:!bg-amber-50/40 tw:!p-5">
      <div className="section-label">지문 검수 (관리자)</div>
      <div className="section-desc">매일 09:00에 다음 날 발행분이 자동 생성됩니다. 검수 후 발행하면 해당 날짜부터 공개됩니다.</div>
      {rows.length === 0 && <p className="tw:!mt-3 tw:!text-sm tw:!font-semibold tw:!text-slate-500">검수 대기 중인 지문이 없습니다.</p>}
      <div className="tw:!mt-3 tw:!space-y-3">
        {rows.map((row) => {
          const v = row.verification;
          return (
            <div key={row.id} className="tw:!rounded-lg tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-4">
              <div className="tw:!flex tw:!flex-wrap tw:!items-center tw:!gap-2 tw:!text-sm">
                <span className="tw:!font-extrabold tw:!text-slate-950">{fmtDate(row.publish_date)}</span>
                <span className="tw:!font-bold tw:!text-slate-700">{row.passage_title}</span>
                <span className={'tw:!rounded-full tw:!px-2 tw:!py-0.5 tw:!text-xs tw:!font-bold ' + (row.status === 'pending' ? 'tw:!bg-amber-100 tw:!text-amber-800' : 'tw:!bg-red-100 tw:!text-red-700')}>{row.status === 'pending' ? '검수 대기' : '반려됨'}</span>
                {v && (
                  <span className={'tw:!rounded-full tw:!px-2 tw:!py-0.5 tw:!text-xs tw:!font-bold ' + (v.passed ? 'tw:!bg-green-100 tw:!text-green-800' : 'tw:!bg-red-100 tw:!text-red-700')}>
                    AI 검증 {v.passed ? `통과 (${v.attempt}차)` : '미통과 ⚠'}
                  </span>
                )}
              </div>
              {v && !v.passed && (
                <div className="tw:!mt-2 tw:!rounded tw:!bg-red-50 tw:!p-2.5 tw:!text-xs tw:!leading-5 tw:!text-red-800">
                  {(v.problems || []).map((p, i) => <div key={i}>· {p}</div>)}
                </div>
              )}
              <div className="tw:!mt-3 tw:!flex tw:!gap-2">
                <button className="btn-secondary" onClick={() => setOpenId(openId === row.id ? null : row.id)}>{openId === row.id ? '미리보기 닫기' : '미리보기'}</button>
                <button className="btn-primary" disabled={busy} onClick={() => setStatus(row, 'published')}>발행</button>
                {row.status === 'pending' && <button className="btn-secondary" disabled={busy} onClick={() => setStatus(row, 'rejected')}>반려</button>}
              </div>
              {openId === row.id && (
                <div className="tw:!mt-4 tw:!space-y-4 tw:!border-t tw:!border-slate-200 tw:!pt-4">
                  <PassageCard row={row} preview />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── 탭 본체 ──────────────────────────────────────────────────────────────────
export default function DailyTab() {
  const { isAdmin } = useApp();
  const [rows, setRows] = useState(null); // null = 로딩 중
  const [currentId, setCurrentId] = useState(null);

  const fetchPublished = useCallback(async () => {
    try {
      const { data, error } = await withTimeout(
        supabase.from('daily_passages')
          .select('id, publish_date, topic, passage_title, passage, questions, difficulty')
          .eq('status', 'published').order('publish_date', { ascending: false }).limit(30),
        30000, '오늘의 지문'
      );
      if (error) throw error;
      setRows(data || []);
      setCurrentId((prev) => prev || data?.[0]?.id || null);
    } catch (e) { console.error(e); setRows([]); }
  }, []);

  useEffect(() => { fetchPublished(); }, [fetchPublished]);
  useEffect(() => { track('daily_view', {}); }, []);

  const current = rows?.find((r) => r.id === currentId) || rows?.[0] || null;
  const doneMap = loadDone();

  return (
    <>
      <section className="input-area tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-5 tw:!shadow-sm tw:md:!p-7">
        <div className="section-label tw:!text-2xl tw:!font-extrabold tw:!text-slate-950">오늘의 지문</div>
        <div className="section-desc tw:!mt-2 tw:!max-w-3xl tw:!text-sm tw:!leading-6 tw:!text-slate-600">
          매일 LEET 언어이해 스타일 지문 1개와 문항 3개가 올라옵니다. 출퇴근길 10분 워밍업으로 활용하세요.
          AI가 생성하고 교차 검증한 학습용 콘텐츠로, 실제 기출과는 출제 수준이 다를 수 있습니다.
        </div>
      </section>

      {rows === null && <p className="tw:!text-sm tw:!font-semibold tw:!text-slate-500">불러오는 중...</p>}
      {rows !== null && !current && (
        <section className="input-area tw:!rounded-xl tw:!border tw:!border-dashed tw:!border-slate-300 tw:!bg-slate-50 tw:!p-8 tw:!text-center">
          <p className="tw:!text-sm tw:!font-bold tw:!text-slate-600">첫 지문을 준비하고 있어요. 내일 다시 들러주세요!</p>
        </section>
      )}
      {current && <PassageCard row={current} />}

      {rows && rows.length > 1 && (
        <section className="input-area tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-5 tw:!shadow-sm">
          <div className="section-label">지난 지문</div>
          <div className="tw:!mt-3 tw:!grid tw:!grid-cols-1 tw:!gap-2 tw:md:!grid-cols-2">
            {rows.map((r) => {
              const done = doneMap[r.id];
              const active = r.id === current?.id;
              return (
                <button key={r.id} type="button"
                  className={'tw:!flex tw:!items-center tw:!justify-between tw:!rounded-lg tw:!border tw:!px-3.5 tw:!py-2.5 tw:!text-left tw:!text-sm tw:transition-colors ' + (active ? 'tw:!border-blue-500 tw:!bg-blue-50' : 'tw:!border-slate-200 tw:!bg-white tw:hover:!border-blue-300')}
                  onClick={() => { setCurrentId(r.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <span>
                    <span className="tw:!mr-2 tw:!text-xs tw:!font-bold tw:!text-slate-400">{r.publish_date.slice(5).replace('-', '/')}</span>
                    <span className="tw:!font-bold tw:!text-slate-800">{r.passage_title}</span>
                  </span>
                  {done && <span className="tw:!shrink-0 tw:!text-xs tw:!font-extrabold tw:!text-green-700">{done.correct}/{done.total}</span>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {isAdmin && <AdminReview onPublished={fetchPublished} />}
    </>
  );
}
