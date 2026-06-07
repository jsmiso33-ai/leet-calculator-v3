import { LEET } from '../../data/leet.js';
import { LEET_META, LEET_TAXONOMY, DIFFICULTY_LEVELS } from '../../data/meta.js';

export const QG_STORAGE_KEY = 'leet_qgrade_v1';

export function loadQgState() {
  try { const raw = localStorage.getItem(QG_STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}
export function saveQgState(state) {
  try { localStorage.setItem(QG_STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export function hasMeta(year) {
  return !!(LEET_META[year] && (LEET_META[year].eon || LEET_META[year].chu));
}

// 다양한 구분자로 답안 파싱 (1~5=답, 0/-/_/x/?/.=미응답, 그 외=구분자)
export function qgParseAnswers(text) {
  if (!text) return [];
  const result = [];
  for (const ch of text) {
    if (ch >= '1' && ch <= '5') result.push(parseInt(ch, 10));
    else if (ch === '0' || ch === '-' || ch === '_' || ch === 'x' || ch === 'X' || ch === '?' || ch === '.') result.push(null);
  }
  return result;
}

// 한 영역 일괄 채점
export function gradeSection(year, sec, text) {
  const yearData = LEET[year];
  if (!yearData) return { ok: false, msg: '학년도 데이터 없음', marks: {} };
  const max = sec === 'eon' ? yearData.items_eon : yearData.items_chu;
  const meta = LEET_META[year] && LEET_META[year][sec];
  if (!meta || meta.length === 0) {
    return { ok: false, msg: `${year}학년도 ${sec === 'eon' ? '언어' : '추리'} 메타데이터(정답)가 입력되어 있지 않습니다. 관리자 모드에서 정답을 입력하세요.`, marks: {} };
  }
  const userAnswers = qgParseAnswers(text);
  const marks = {};
  let correct = 0, incorrect = 0, blank = 0, missing = 0;
  for (let n = 1; n <= max; n++) {
    const userAns = userAnswers[n - 1];
    if (userAns === undefined || userAns === null) { blank++; continue; }
    const metaItem = meta.find((q) => q.no === n);
    if (!metaItem || metaItem.answer == null) { missing++; continue; }
    if (userAns === metaItem.answer) { marks[n] = 'correct'; correct++; }
    else { marks[n] = 'incorrect'; incorrect++; }
  }
  return { ok: true, marks, correct, incorrect, blank, missing, total: max, parsed: userAnswers.length };
}

export function countFilled(text, max) {
  const parsed = qgParseAnswers(text);
  const filled = parsed.filter((x) => x !== null && x !== undefined).length;
  return { filled, max, over: parsed.length > max };
}

// app.js computeWeakness 이식 — 치명도 기반 약점 진단
export function computeWeakness(year, session) {
  const result = { categories: {}, byDifficulty: {}, sections: {} };
  ['eon', 'chu'].forEach((sec) => {
    const meta = LEET_META[year] && LEET_META[year][sec];
    if (!meta) return;
    meta.forEach((q) => {
      if (!q.category && !q.difficulty) return;
      const status = session[sec] && session[sec][q.no];
      if (!status) return;
      const isCorrect = status === 'correct';
      const correctValue = isCorrect ? 1 : 0;

      if (q.category) {
        const key = `${sec}::${q.category}`;
        if (!result.categories[key]) {
          result.categories[key] = {
            sec, category: q.category,
            name: LEET_TAXONOMY[sec].categories[q.category]?.name || q.category,
            color: LEET_TAXONOMY[sec].categories[q.category]?.color || '#888',
            total: 0, correct: 0, expectedSum: 0, expectedCount: 0, criticalitySum: 0, criticalityCount: 0,
          };
        }
        const c = result.categories[key];
        c.total++; c.correct += correctValue;
        if (q.difficulty && DIFFICULTY_LEVELS[q.difficulty]) {
          const exp = DIFFICULTY_LEVELS[q.difficulty].expected_rate;
          c.expectedSum += exp; c.expectedCount++;
          c.criticalitySum += (1 - correctValue) * exp; c.criticalityCount++;
        }
      }

      if (q.difficulty) {
        if (!result.byDifficulty[q.difficulty]) {
          result.byDifficulty[q.difficulty] = { total: 0, correct: 0, expected: DIFFICULTY_LEVELS[q.difficulty].expected_rate };
        }
        result.byDifficulty[q.difficulty].total++;
        result.byDifficulty[q.difficulty].correct += correctValue;
      }

      if (!result.sections[sec]) result.sections[sec] = { total: 0, correct: 0, expectedSum: 0, expectedCount: 0 };
      result.sections[sec].total++; result.sections[sec].correct += correctValue;
      if (q.difficulty) {
        result.sections[sec].expectedSum += DIFFICULTY_LEVELS[q.difficulty].expected_rate;
        result.sections[sec].expectedCount++;
      }
    });
  });

  Object.values(result.categories).forEach((c) => {
    c.actualRate = c.total > 0 ? c.correct / c.total : 0;
    c.expectedRate = c.expectedCount > 0 ? c.expectedSum / c.expectedCount : null;
    c.gap = c.expectedRate !== null ? c.actualRate - c.expectedRate : null;
    c.criticality = c.criticalityCount > 0 ? c.criticalitySum / c.criticalityCount : 0;
    const reliability = Math.min(1, c.total / 5);
    c.weaknessScore = c.gap !== null ? (-c.gap * 0.6 + c.criticality * 0.4) * reliability : c.criticality * reliability;
  });

  return result;
}

export { LEET_TAXONOMY, DIFFICULTY_LEVELS };
