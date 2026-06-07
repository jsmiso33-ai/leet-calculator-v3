import { useState } from 'react';
import { useSchoolInput } from '../context/SchoolInputContext.jsx';
import { calcSchool } from '../lib/schoolCalc.js';
import { buildModel, ADM_COMPARE_LIMIT, totalSchoolCount, admSchoolNames, admGroupOf } from '../lib/admission.js';
import { AdmissionApp } from '../admission-react.jsx';
import { toast } from '../lib/ui.js';
import { track } from '../lib/analytics.js';

// 입시결과 비교 — schState(점수)는 학교 탭과 공유, 입시 UI 상태는 로컬
export default function AdmissionTab() {
  const { input, favSet, getFavoriteSchoolNames, toggleFavorite } = useSchoolInput();
  const [sortKey, setSortKey] = useState('leet-cut');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [selectedSchools, setSelectedSchools] = useState(null);
  const [compareSchools, setCompareSchools] = useState([]);

  const leetSum = (input.eonStd !== null && input.chuStd !== null) ? input.eonStd + input.chuStd : null;
  const gpaPct = input.gpaPct;
  const calc = (school) => calcSchool(school, input);
  const isFav = (name) => favSet.has(name);
  const total = totalSchoolCount();

  const model = buildModel({ leetSum, gpaPct, calc, isFav, sortKey, gradeFilter, selectedSchools, compareSchools });

  const actions = {
    setGrade(grade) { setGradeFilter(grade || 'all'); if (window.track) track('admission_grade_filter', { grade: grade || 'all' }); },
    setSort(sort) { setSortKey(sort || 'leet-cut'); if (window.track) track('admission_sort', { sort: sort || 'leet-cut' }); },
    toggleSchool(name) {
      const cur = selectedSchools === null ? new Set(admSchoolNames()) : new Set(selectedSchools);
      if (cur.has(name)) cur.delete(name); else cur.add(name);
      setSelectedSchools(cur.size === total ? null : [...cur]);
    },
    setSchoolQuickAction(action) {
      if (action === 'all') setSelectedSchools(null);
      else if (action === 'favorites') { const names = new Set(admSchoolNames()); setSelectedSchools(getFavoriteSchoolNames().filter((n) => names.has(n))); }
      else if (action === 'clear') setSelectedSchools([]);
      else if (action === 'seoul') setSelectedSchools(admSchoolNames().filter((n) => admGroupOf(n) === '서울'));
      else if (action === 'metro') setSelectedSchools(admSchoolNames().filter((n) => { const g = admGroupOf(n); return g === '서울' || g === '경기/인천'; }));
    },
    toggleCompare(name) {
      setCompareSchools((prev) => {
        const wasSelected = prev.includes(name);
        let next, replaced = null;
        if (wasSelected) next = prev.filter((n) => n !== name);
        else { next = [...prev, name]; if (next.length > ADM_COMPARE_LIMIT) { replaced = next[0]; next = next.slice(1); } }
        if (window.track) track('school_compare', { school: name, action: wasSelected ? 'remove' : 'add' });
        toast(wasSelected ? `${name} 비교에서 제거` : `${name} 비교에 추가${replaced ? ` · ${replaced} 제외` : ''}`, { type: 'success', duration: 1600 });
        return next;
      });
    },
    clearCompare() { setCompareSchools((prev) => { if (prev.length && window.track) track('school_compare_clear'); return []; }); },
    toggleFavorite(name) { toggleFavorite(name); },
  };

  return (
    <>
      <section className="input-area adm-intro tw:!mb-4 tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!px-5 tw:!py-5 tw:!shadow-sm tw:md:!px-8 tw:md:!py-7">
        <div className="section-label tw:!text-2xl tw:!font-extrabold tw:!leading-tight tw:!text-slate-950 tw:md:!text-3xl">입시결과 비교 분석</div>
        <div className="section-desc tw:!mt-2 tw:!max-w-3xl tw:!text-sm tw:!leading-6 tw:!text-slate-600">나의 LEET·학점 입력값과 2026학년도 25개 로스쿨 입시결과를 비교해 추천 쇼트리스트와 학교별 비교표를 구성합니다. (점수 입력은 학교별 환산점수 탭과 공유됩니다.)</div>
      </section>
      <AdmissionApp model={model} actions={actions} />
    </>
  );
}
