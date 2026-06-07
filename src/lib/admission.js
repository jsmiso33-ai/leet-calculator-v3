import { ADMISSION_2026, LAW_SCHOOLS } from '../../data/schools.js';

// app.js 입시결과(admission) 로직 이식 — 전역 상태를 파라미터(ui)로 받도록 재구성

export const ADM_COMPARE_LIMIT = 3;
const ADM_GRADE_LONG_LABEL = { safe: '안정권', match: '적정권', reach: '도전권', hard: '위험권' };

export function stripHtml(value) {
  return String(value ?? '').replace(/<[^>]*>/g, '');
}
export function formatAdmSignedDiff(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  if (value > 0.05) return `+${value.toFixed(1)}`;
  if (value < -0.05) return `-${Math.abs(value).toFixed(1)}`;
  return '±0.0';
}
export function getAdmGradeLabel(grade) {
  return ADM_GRADE_LONG_LABEL[grade] || '판단 대기';
}
function formatAdmValue(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '입력 필요';
  return `${Number(value).toFixed(1)}`;
}
function getAdmDiffToneTw(cls) {
  if (cls === 'plus') return 'tw:!text-emerald-700';
  if (cls === 'minus') return 'tw:!text-red-600';
  return 'tw:!text-slate-500';
}

const schoolByName = (name) => LAW_SCHOOLS.find((s) => s.name === name);

// 합격등급: 'safe' | 'match' | 'reach' | 'hard' | null
function classifyAdm(school, ad, leetSum, calc) {
  if (!ad.leet || ad.leet.val === null) return null;
  let myLeet;
  if (ad.leet.max !== null) {
    const c = calc(school);
    if (c.leet === null || c.leet === undefined) return null;
    myLeet = c.leet;
  } else {
    if (leetSum === null) return null;
    myLeet = leetSum;
  }
  const leet50 = ad.leet.val;
  const leet75 = (ad.leet75 && ad.leet75.val !== null) ? ad.leet75.val : null;
  if (leet75 !== null && myLeet >= leet75) return 'safe';
  if (myLeet >= leet50) return 'match';
  const step = (leet75 !== null) ? (leet75 - leet50) : 3;
  if (myLeet >= leet50 - step) return 'reach';
  return 'hard';
}

function getMyCompareValue(row, leetSum, calc) {
  if (!row) return null;
  if (row.leet50IsConverted) {
    const c = calc(row.school);
    return c && c.leet !== null && c.leet !== undefined ? c.leet : null;
  }
  return leetSum;
}

// 25개교 행 빌드 (renderAdmission 1358-1492 이식)
function buildRows({ selectedSchools, leetSum, calc, isFav }) {
  const admFilter = selectedSchools === null ? null : new Set(selectedSchools);
  const rows = [];
  for (const [name, ad] of Object.entries(ADMISSION_2026)) {
    if (admFilter && !admFilter.has(name)) continue;
    const school = schoolByName(name);
    if (!school) continue;

    let leet50Text = '—', leet50Val = null, leet50IsConverted = false;
    if (ad.leet && ad.leet.val !== null) {
      leet50Val = ad.leet.val;
      if (ad.leet.max !== null) { leet50Text = `${ad.leet.val.toFixed(1)} <span class="sub">/ ${ad.leet.max}</span>`; leet50IsConverted = true; }
      else leet50Text = `${ad.leet.val.toFixed(1)}`;
    }

    let leet75Text = '—';
    if (ad.leet75 && ad.leet75.val !== null) {
      leet75Text = ad.leet75.max !== null ? `${ad.leet75.val.toFixed(1)} <span class="sub">/ ${ad.leet75.max}</span>` : `${ad.leet75.val.toFixed(1)}`;
    }

    let leetDiffText = '', leetDiffClass = 'na', leetDiffVal = null;
    if (ad.leet && ad.leet.val !== null && ad.leet.max !== null) {
      const c = calc(school);
      if (c.leet !== null) {
        const diff = c.leet - ad.leet.val;
        leetDiffVal = diff;
        if (diff > 0.05) { leetDiffClass = 'plus'; leetDiffText = `▲ ${diff.toFixed(1)}`; }
        else if (diff < -0.05) { leetDiffClass = 'minus'; leetDiffText = `▼ ${Math.abs(diff).toFixed(1)}`; }
        else { leetDiffClass = 'even'; leetDiffText = '±0.0'; }
      } else leetDiffText = '—';
    } else if (ad.leet && ad.leet.val !== null && ad.leet.max === null && leetSum !== null) {
      const diff = leetSum - ad.leet.val;
      leetDiffVal = diff;
      if (diff > 0.05) { leetDiffClass = 'plus'; leetDiffText = `▲ ${diff.toFixed(1)}`; }
      else if (diff < -0.05) { leetDiffClass = 'minus'; leetDiffText = `▼ ${Math.abs(diff).toFixed(1)}`; }
      else { leetDiffClass = 'even'; leetDiffText = '±0.0'; }
    } else leetDiffText = '—';

    let gpa50Text = '—';
    if (ad.gpa && ad.gpa.val !== null && ad.gpa.max !== null) {
      gpa50Text = `${ad.gpa.val.toFixed(1)} <span class="sub">/ ${ad.gpa.max}</span>`;
    } else if (ad.gpa && ad.gpa.note) {
      const pctMatch = ad.gpa.note.match(/([\d.]+)%/);
      if (pctMatch) gpa50Text = `${pctMatch[1]}%`;
      else if (ad.gpa.note.match(/GPA\s*([\d.]+)/i)) {
        const gpaMatch = ad.gpa.note.match(/([\d.]+)\s*\/\s*([\d.]+)/);
        gpa50Text = gpaMatch ? `${gpaMatch[1]} <span class="sub">/ ${gpaMatch[2]}</span>` : ad.gpa.note;
      } else gpa50Text = ad.gpa.note.length > 12 ? ad.gpa.note.slice(0, 12) + '…' : ad.gpa.note;
    }

    let eng50Text = '—';
    if (school.engType === 'pf') eng50Text = 'P/F';
    else if (ad.eng && ad.eng.val !== null && ad.eng.max !== null) eng50Text = `${ad.eng.val.toFixed(0)} <span class="sub">/ ${ad.eng.max}</span>`;
    else if (ad.eng && ad.eng.note) {
      const toeicMatch = ad.eng.note.match(/TOEIC\s*([\d]+)/i);
      eng50Text = toeicMatch ? toeicMatch[1] : (ad.eng.note.length > 10 ? ad.eng.note.slice(0, 10) + '…' : ad.eng.note);
    }

    const subParts = [];
    if (ad.ref) subParts.push(ad.ref);
    if (ad.gpa && ad.gpa.note && ad.gpa.note.includes('/')) subParts.push('학부: ' + ad.gpa.note);
    if (ad.eng && ad.eng.note && ad.eng.note.includes('/')) subParts.push('영어: ' + ad.eng.note);

    const regionCls = school.group === '서울' ? 'seoul' : (school.group === '경기/인천' ? 'metro' : 'local');

    rows.push({
      name, enrolled: ad.enrolled, school, ad,
      leet50Val, leet50Text, leet50IsConverted,
      leet50Max: (ad.leet && ad.leet.max) ? ad.leet.max : null,
      leet75Text, leetDiffVal, leetDiffText, leetDiffClass,
      gpa50Text, eng50Text, subText: subParts.join(' · '),
      regionCls, regionText: school.group,
      favorite: isFav(name),
    });
  }
  return rows;
}

function getPlainRow(row, leetSum, gpaPct, calc) {
  const myValue = getMyCompareValue(row, leetSum, calc);
  const myGpaLabel = gpaPct !== null ? `${gpaPct.toFixed(1)}%` : '입력 필요';
  const diffTone = getAdmDiffToneTw(row.leetDiffClass);
  const leetLabel = row.leet50IsConverted ? '자체환산 50%' : 'LEET 50%';
  return {
    name: row.name, enrolled: row.enrolled, grade: row.grade,
    gradeLabel: getAdmGradeLabel(row.grade), initial: row.name.slice(0, 1),
    regionText: row.regionText, regionCls: row.regionCls, favorite: row.favorite,
    subText: stripHtml(row.subText || ''),
    leet50: stripHtml(row.leet50Text), leet75: stripHtml(row.leet75Text),
    gpa50: stripHtml(row.gpa50Text), eng50: stripHtml(row.eng50Text),
    diffClass: row.leetDiffClass, diffText: row.leetDiffText, diffDisplay: row.leetDiffDisplay,
    myValue: formatAdmValue(myValue),
    lines: [
      { label: '내 기준점수', value: formatAdmValue(myValue) },
      { label: leetLabel, value: stripHtml(row.leet50Text) },
      { label: '학점 50%', value: stripHtml(row.gpa50Text) },
      { label: '내 학점', value: myGpaLabel },
      { label: '합격 가능성', value: `${getAdmGradeLabel(row.grade)} · ${row.leetDiffDisplay || '-'}`, tone: diffTone },
    ],
    tone: row.grade || 'pending',
  };
}

function filterGroupsForReact(selectedSchools) {
  const selected = selectedSchools === null ? new Set(Object.keys(ADMISSION_2026)) : new Set(selectedSchools);
  const groups = { '서울': [], '경기/인천': [], '지방': [] };
  for (const name of Object.keys(ADMISSION_2026)) {
    const school = schoolByName(name);
    if (!school) continue;
    const group = school.group || '지방';
    if (!groups[group]) groups[group] = [];
    groups[group].push({ name, selected: selected.has(name) });
  }
  return Object.entries(groups).filter(([, schools]) => schools.length).map(([name, schools]) => ({ name, schools }));
}

function filterCountText(selectedSchools) {
  const total = Object.keys(ADMISSION_2026).length;
  if (selectedSchools === null) return `전체 ${total}개 표시 중`;
  return `${selectedSchools.length} / ${total}개 표시 중`;
}

function getCompareRows(allRows, shortlistRows, compareSchools) {
  const byName = new Map(allRows.map((row) => [row.name, row]));
  let rows = compareSchools.map((name) => byName.get(name)).filter(Boolean);
  if (rows.length === 0) rows = shortlistRows.slice(0, ADM_COMPARE_LIMIT);
  return rows.slice(0, ADM_COMPARE_LIMIT);
}

export function totalSchoolCount() { return Object.keys(ADMISSION_2026).length; }
export function admSchoolNames() { return Object.keys(ADMISSION_2026); }
export function admGroupOf(name) { const s = schoolByName(name); return s ? s.group : null; }

// renderAdmission + buildAdmissionReactModel 통합
export function buildModel({ leetSum, gpaPct, calc, isFav, sortKey, gradeFilter, selectedSchools, compareSchools }) {
  const rows = buildRows({ selectedSchools, leetSum, calc, isFav });

  // 등급 분류 + 집계
  const gradeCounts = { safe: 0, match: 0, reach: 0, hard: 0 };
  let bestSafeName = null, bestSafeCut = -Infinity, bestMatchName = null, bestMatchCut = -Infinity;
  for (const r of rows) {
    r.grade = classifyAdm(r.school, r.ad, leetSum, calc);
    r.gradeLabel = getAdmGradeLabel(r.grade);
    r.leetDiffDisplay = formatAdmSignedDiff(r.leetDiffVal);
    r.meterPct = r.leetDiffVal === null ? 12 : Math.max(8, Math.min(100, 54 + (r.leetDiffVal * 6)));
    if (r.grade) gradeCounts[r.grade]++;
    if (!r.leet50IsConverted && r.leet50Val !== null) {
      if (r.grade === 'safe' && r.leet50Val > bestSafeCut) { bestSafeCut = r.leet50Val; bestSafeName = r.name; }
      else if (r.grade === 'match' && r.leet50Val > bestMatchCut) { bestMatchCut = r.leet50Val; bestMatchName = r.name; }
    }
  }
  const totalGraded = gradeCounts.safe + gradeCounts.match + gradeCounts.reach + gradeCounts.hard;

  const missingInputs = [];
  if (leetSum === null) missingInputs.push('LEET');
  if (gpaPct === null) missingInputs.push('학점');
  let recTitle, recCopy;
  if (leetSum === null) {
    recTitle = 'LEET 표준점수를 먼저 입력하세요';
    recCopy = '학교별 환산점수 탭에서 LEET와 학점 정보를 입력하면 지원권이 자동 분류됩니다.';
  } else if (bestSafeName) {
    recTitle = `${bestSafeName}까지 안정권`;
    recCopy = `안정권 ${gradeCounts.safe}곳, 적정권 ${gradeCounts.match}곳이 잡힙니다. 즐겨찾기로 관심 학교를 좁혀보세요.`;
  } else if (bestMatchName) {
    recTitle = `${bestMatchName}가 가장 가까운 적정권`;
    recCopy = `안정권은 없지만 적정권 ${gradeCounts.match}곳이 있습니다. 75%선과의 차이를 같이 확인하세요.`;
  } else {
    recTitle = '현재는 도전권 이하 중심';
    recCopy = 'LEET 50%선 대비 차이가 큰 학교부터 확인하고 지원 조합을 보수적으로 잡는 편이 좋습니다.';
  }

  // 정렬
  if (sortKey === 'leet-cut') {
    rows.sort((a, b) => {
      if (!a.leet50IsConverted && !b.leet50IsConverted) return (b.leet50Val ?? -999) - (a.leet50Val ?? -999);
      if (!a.leet50IsConverted && b.leet50IsConverted) return -1;
      if (a.leet50IsConverted && !b.leet50IsConverted) return 1;
      return a.name.localeCompare(b.name, 'ko');
    });
  } else if (sortKey === 'enrolled') {
    rows.sort((a, b) => b.enrolled - a.enrolled);
  } else if (sortKey === 'alpha') {
    rows.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }

  const cardRows = gradeFilter === 'all' ? rows : rows.filter((r) => r.grade === gradeFilter);
  const compareRows = getCompareRows(rows, cardRows, compareSchools);
  const filterLabel = gradeFilter === 'all' ? '전체' : getAdmGradeLabel(gradeFilter);

  const tableRows = rows.map((row, index) => {
    const plain = getPlainRow(row, leetSum, gpaPct, calc);
    plain.separatorBefore = sortKey === 'leet-cut' && index > 0 && !rows[index - 1].leet50IsConverted && row.leet50IsConverted;
    return plain;
  });

  return {
    leetSum, gpaPct,
    myGpaLabel: gpaPct !== null ? `${gpaPct.toFixed(1)}%` : '입력 필요',
    recTitle, recCopy,
    readinessText: missingInputs.length ? `입력 필요: ${missingInputs.join(', ')}` : '필수 입력값 반영 완료',
    gradeCounts, totalGraded, totalRows: rows.length,
    gradeFilter, sortKey,
    filterGroups: filterGroupsForReact(selectedSchools),
    filterCountText: filterCountText(selectedSchools),
    shortlistRows: cardRows.map((row) => getPlainRow(row, leetSum, gpaPct, calc)),
    shortlistMeta: `${filterLabel} ${cardRows.length}개 표시 중`,
    compareRows: compareRows.map((row) => getPlainRow(row, leetSum, gpaPct, calc)),
    compareSelected: [...compareSchools],
    compareLimit: ADM_COMPARE_LIMIT,
    compareStatus: compareSchools.length ? `비교 선택 ${compareRows.length}/${ADM_COMPARE_LIMIT}` : '추천 상위 3개 자동 비교',
    tableRows,
    tableMeta: `${filterLabel} 카드 ${cardRows.length}개 · 상세 표 ${rows.length}개`,
  };
}
