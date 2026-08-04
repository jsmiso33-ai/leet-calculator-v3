import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase, withTimeout } from '../lib/supabase.js';
import { toast, confirmAsync } from '../lib/ui.js';
import { track } from '../lib/analytics.js';
import PassageAnnotator from '../components/PassageAnnotator.jsx';

// 오늘의 지문 — AI 생성 언어이해 지문 1개 + 문항 3개를 매일 발행.
// 발행분은 Supabase daily_passages(RLS: published만 공개)에서 읽는다.
// 관리자(?admin=1 + 소유자 Google 로그인)는 같은 탭 하단에서 pending 검수·발행.

const DONE_KEY = 'leet_daily_v1';
const SOLVER_KEY = 'leet_solver_id_v1'; // 게스트 익명 식별자(브라우저별 1개)
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
function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}
// 게스트 익명 ID (로그인 사용자는 auth uid를 쓰므로 호출 안 함)
function getGuestId() {
  try {
    let id = localStorage.getItem(SOLVER_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : 'g-' + Date.now() + '-' + Math.random().toString(36).slice(2));
      localStorage.setItem(SOLVER_KEY, id);
    }
    return id;
  } catch { return 'guest-anon'; }
}

// ── 지문 + 문항 풀이 카드 (일반/관리자 미리보기 공용) ──────────────────────────
function PassageCard({ row, preview }) {
  const { user } = useAuth();
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
      recordAnswer(); // 서버에 제출 기록(관리자 집계용) — 실패해도 무시
    }
  };
  // 누가 어떤 답을 골랐는지 Supabase에 저장. 로그인=auth uid, 게스트=익명 ID.
  // RLS상 관리자만 읽고 anon/authenticated는 insert만 가능(upsert는 ON CONFLICT 가시성 때문에 불가).
  // 재제출 시 새 행이 쌓이고, 관리자 표에서 solver별 최신 1건만 보여준다.
  const recordAnswer = () => {
    const md = user?.user_metadata || {};
    supabase.from('daily_passage_answers').insert({
      passage_id: row.id,
      solver_id: user?.id || getGuestId(),
      user_email: user?.email || null,
      user_name: md.full_name || md.name || md.user_name || null,
      is_guest: !user,
      answers,
      correct_count: correctCount,
      total: questions.length,
      submitted_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) console.warn('답 기록 실패(무시):', error.message);
    });
  };
  const retry = () => {
    setAnswers({}); setSubmitted(false);
    if (!preview) { const map = loadDone(); delete map[row.id]; saveDone(map); }
  };

  const firstNo = questions[0]?.no ?? 1;
  const lastNo = questions[questions.length - 1]?.no ?? questions.length;

  return (
    <div className="exam-paper">
      <div className="exam-meta">{fmtDate(row.publish_date)}</div>
      {row.passage_title && <h2 className="exam-title">{row.passage_title}</h2>}
      <div className="exam-instr">
        <span className="range">[{firstNo} ~ {lastNo}]</span>다음 글을 읽고 물음에 답하시오.
      </div>

      <div className="exam-grid">
        {preview ? (
          <div className="exam-passage">
            {row.passage.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        ) : (
          <PassageAnnotator key={row.id} passageId={row.id} paragraphs={row.passage.split(/\n{2,}/)} />
        )}

        <div className="exam-questions">
          {questions.map((q) => {
            const chosen = answers[q.no];
            return (
              <div key={q.no} className="exam-q">
                <div className="exam-stem">
                  <span className="qno">{q.no}.</span>{q.stem}
                  {q.qtype && <span className="exam-qtype">[{q.qtype}]</span>}
                </div>
                <div className="exam-choices">
                  {q.choices.map((c, i) => {
                    const n = i + 1;
                    const isChosen = chosen === n;
                    const isAnswer = q.answer === n;
                    let cls = 'exam-choice';
                    if (submitted) {
                      if (isAnswer) cls += ' is-correct';
                      else if (isChosen) cls += ' is-wrong';
                      else cls += ' is-dim';
                    } else if (isChosen) cls += ' is-chosen';
                    return (
                      <button key={n} type="button" className={cls} disabled={submitted}
                        onClick={() => setAnswers((a) => ({ ...a, [q.no]: n }))}>
                        <span className="num">{NUMS[i]}</span><span>{c}</span>
                      </button>
                    );
                  })}
                </div>
                {submitted && (
                  <div className="exam-explain">
                    <span className="verdict">
                      {chosen === q.answer ? '정답' : `오답 — 정답 ${NUMS[q.answer - 1]}`}
                    </span>
                    <span className="label">해설</span> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}

          <div className="exam-actions">
            {!submitted ? (
              <button className="btn-primary" onClick={submit} disabled={!allAnswered}>채점하기</button>
            ) : (
              <>
                <span className="exam-score">
                  {questions.length}문항 중 <b>{correctCount}개</b> 정답
                </span>
                <button className="btn-secondary" onClick={retry}>다시 풀기</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
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

// ── 관리자 응답 기록 테이블 (현재 보고 있는 지문 기준) ─────────────────────────
function AdminAnswers({ passage }) {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    if (!user) { setRows(null); return undefined; }
    let alive = true;
    (async () => {
      const { data, error } = await withTimeout(
        supabase.from('daily_passage_answers').select('*')
          .eq('passage_id', passage.id).order('submitted_at', { ascending: false }),
        30000, '응답 기록'
      );
      if (!alive) return;
      if (error) { console.error(error); setRows([]); return; }
      // solver별 최신 1건만(내림차순이라 첫 등장이 최신). 재제출로 쌓인 이전 행은 제외.
      const seen = new Set();
      const latest = (data || []).filter((r) => (seen.has(r.solver_id) ? false : seen.add(r.solver_id)));
      setRows(latest);
    })();
    return () => { alive = false; };
  }, [user, passage.id]);

  const questions = Array.isArray(passage.questions) ? passage.questions : [];
  const label = (r) => {
    if (!r.is_guest) return r.user_name || r.user_email || '회원';
    return '게스트 #' + String(r.solver_id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  };
  const choiceOf = (r, q) => r.answers?.[String(q.no)] ?? r.answers?.[q.no] ?? null;
  const dist = (q) => {
    const c = [0, 0, 0, 0, 0];
    (rows || []).forEach((r) => { const v = choiceOf(r, q); if (v >= 1 && v <= 5) c[v - 1]++; });
    return c;
  };

  return (
    <section className="input-area tw:!rounded-xl tw:!border tw:!border-amber-300 tw:!bg-amber-50/40 tw:!p-5">
      <div className="section-label">응답 기록 (관리자)</div>
      <div className="section-desc">
        지금 보고 있는 지문 “{passage.passage_title}” ({fmtDate(passage.publish_date)})에 제출된 답입니다. 관리자만 볼 수 있어요.
      </div>
      {!user && <p className="tw:!mt-3 tw:!text-sm tw:!font-semibold tw:!text-slate-500">소유자 계정으로 로그인하면 응답 기록을 볼 수 있어요.</p>}
      {user && rows === null && <p className="tw:!mt-3 tw:!text-sm tw:!font-semibold tw:!text-slate-500">불러오는 중...</p>}
      {user && rows && rows.length === 0 && <p className="tw:!mt-3 tw:!text-sm tw:!font-semibold tw:!text-slate-500">아직 제출된 답이 없습니다.</p>}
      {user && rows && rows.length > 0 && (
        <div className="ans-wrap">
          <table className="ans-table">
            <thead>
              <tr>
                <th className="ans-name">응답자</th>
                {questions.map((q) => <th key={q.no}>{q.no}번</th>)}
                <th>점수</th>
                <th>제출</th>
              </tr>
              <tr className="ans-correct">
                <td className="ans-name">정답</td>
                {questions.map((q) => <td key={q.no}>{NUMS[q.answer - 1]}</td>)}
                <td colSpan={2} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="ans-name">{label(r)}</td>
                  {questions.map((q) => {
                    const v = choiceOf(r, q);
                    const cls = v == null ? '' : v === q.answer ? 'ans-o' : 'ans-x';
                    return <td key={q.no} className={cls}>{v ? NUMS[v - 1] : '–'}</td>;
                  })}
                  <td>{r.correct_count}/{r.total}</td>
                  <td className="ans-time">{fmtTime(r.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="ans-name">분포</td>
                {questions.map((q) => {
                  const c = dist(q);
                  return (
                    <td key={q.no} className="ans-dist">
                      {NUMS.map((n, i) => (c[i] ? <span key={i} className={i + 1 === q.answer ? 'ans-dist-a' : ''}>{n}{c[i]} </span> : null))}
                    </td>
                  );
                })}
                <td colSpan={2}>{rows.length}명</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
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
                  onClick={() => {
                    setCurrentId(r.id);
                    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
                    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
                  }}>
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
      {isAdmin && current && <AdminAnswers passage={current} />}
    </>
  );
}
