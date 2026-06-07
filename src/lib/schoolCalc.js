import { LAW_SCHOOLS } from '../../data/schools.js';

export const SCH_STORAGE_KEY = 'leet_schools_input_v1';

export const DEFAULT_SCHOOL_STATE = {
  eonStd: null, chuStd: null, eonPct: null, chuPct: null,
  gpaPct: null, gpaScore: null, gpaScale: '4.5',
  engType: 'toeic', engScore: null,
  sortBy: 'leet', selectedSchools: null, favoriteSchools: [],
};

export function normalizeFavoriteSchools(names) {
  if (!Array.isArray(names)) return [];
  const valid = new Set(LAW_SCHOOLS.map((s) => s.name));
  const seen = new Set();
  return names.filter((name) => {
    if (!valid.has(name) || seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

// app.js calcSchool 이식 — 학교별 정량 환산점수
export function calcSchool(school, input) {
  const r = school.calc(input);
  const leet = r.leet, gpa = r.gpa, eng = r.eng;
  let totalDenom = school.leetMax + school.gpaMax;
  if (school.engType === 'score' && school.engMax) totalDenom += school.engMax;
  const parts = [leet, gpa];
  if (school.engType === 'score') parts.push(eng);
  let totalSum = 0, totalValid = true;
  for (const p of parts) {
    if (p === null || p === undefined) { totalValid = false; break; }
    totalSum += p;
  }
  return {
    leet, gpa, eng,
    total: totalValid ? totalSum : null,
    totalDenom, leetDenom: school.leetMax, gpaDenom: school.gpaMax, engDenom: school.engMax,
  };
}

// schState에서 calc 입력 객체만 추출
export function toCalcInput(schState) {
  return {
    eonStd: schState.eonStd, chuStd: schState.chuStd, eonPct: schState.eonPct, chuPct: schState.chuPct,
    gpaPct: schState.gpaPct, gpaScore: schState.gpaScore, gpaScale: schState.gpaScale,
    engType: schState.engType, engScore: schState.engScore,
  };
}
