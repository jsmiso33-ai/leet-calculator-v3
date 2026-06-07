import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LAW_SCHOOLS } from '../../data/schools.js';
import { SCH_STORAGE_KEY, DEFAULT_SCHOOL_STATE, normalizeFavoriteSchools, toCalcInput } from '../lib/schoolCalc.js';

function loadSchInput() {
  try { const r = localStorage.getItem(SCH_STORAGE_KEY); return r ? JSON.parse(r) : {}; }
  catch { return {}; }
}
function saveSchInput(data) {
  try { localStorage.setItem(SCH_STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

const Ctx = createContext(null);

// 학교별 환산 탭과 입시결과 탭이 공유하는 점수 입력 + 즐겨찾기 (localStorage leet_schools_input_v1)
export function SchoolInputProvider({ children }) {
  const [schState, setSchState] = useState(() => {
    const s = { ...DEFAULT_SCHOOL_STATE, ...loadSchInput() };
    s.favoriteSchools = normalizeFavoriteSchools(s.favoriteSchools);
    return s;
  });

  useEffect(() => { saveSchInput(schState); }, [schState]);

  const patch = (p) => setSchState((prev) => ({ ...prev, ...p }));

  const favSet = useMemo(() => new Set(normalizeFavoriteSchools(schState.favoriteSchools)), [schState.favoriteSchools]);
  const getFavoriteSchoolNames = () => LAW_SCHOOLS.map((s) => s.name).filter((n) => favSet.has(n));
  const toggleFavorite = (name) => {
    const next = new Set(favSet);
    if (next.has(name)) next.delete(name); else next.add(name);
    patch({ favoriteSchools: LAW_SCHOOLS.map((s) => s.name).filter((n) => next.has(n)) });
  };

  const value = {
    schState, patch,
    input: toCalcInput(schState),
    favSet, getFavoriteSchoolNames, toggleFavorite,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSchoolInput() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSchoolInput must be used within SchoolInputProvider');
  return ctx;
}
