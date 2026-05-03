

// ===========================================================================
// 표준점수 체계
// ===========================================================================
function getStdParams(era, subject) {
  if (era === 'old') return { mean: 50, sd: 10 };
  if (subject === 'eon') return { mean: 45, sd: 9 };
  return { mean: 60, sd: 12 };
}

// 만점-원평균-표점평균-표점SD로부터 원점수 SD 역산
function deriveRawSD(maxItems, rawMean, topStd, stdMean, stdSD) {
  if (topStd <= stdMean) return null;
  return (maxItems - rawMean) * stdSD / (topStd - stdMean);
}

// ===========================================================================
// 환산 함수: 표가 있으면 룩업, 없으면 평균/SD로 보정 계산
// ===========================================================================
function getStdScore(year, subject, raw) {
  const d = LEET[year];
  if (!d) return null;
  if (raw === null || raw < 0) return null;
  const items = subject === 'eon' ? d.items_eon : d.items_chu;
  if (raw > items) return null;

  const table = subject === 'eon' ? d.eon : d.chu;
  const estList = subject === 'eon' ? d.eon_est : d.chu_est;

  // 1) 표에 직접 있는 경우
  if (table[raw] && table[raw][0] !== null) {
    const isEst = (estList === 'all') || (Array.isArray(estList) && estList.includes(raw)) || d.isFullyEstimated;
    return { std: table[raw][0], pct: table[raw][1], estimated: isEst, source: 'table' };
  }

  // 2) 표에 없는 경우 → 보정 계산
  // 보정 방식: 표의 가장 가까운 두 점에서 선형 보간, 또는 평균-만점 기준 역산
  const stdP = getStdParams(d.era, subject);
  const rawMean = subject === 'eon' ? d.eon_mean : d.chu_mean;

  // 만점 표준점수 찾기 (표에 있으면 사용, 2026이면 d.eon_top/chu_top 사용)
  let topStd = null;
  if (table[items] && table[items][0] !== null) {
    topStd = table[items][0];
  } else if (subject === 'eon' && d.eon_top !== undefined) {
    topStd = d.eon_top;
  } else if (subject === 'chu' && d.chu_top !== undefined) {
    topStd = d.chu_top;
  } else {
    // 표에서 가장 높은 점수 사용
    const keys = Object.keys(table).map(Number).filter(k => table[k][0] !== null);
    if (keys.length > 0) {
      const maxK = Math.max(...keys);
      // (maxK, table[maxK][0]) ↔ (rawMean, stdP.mean) 두 점으로 직선 외삽
      const slope = (table[maxK][0] - stdP.mean) / (maxK - rawMean);
      topStd = stdP.mean + (items - rawMean) * slope;
    } else {
      return null;
    }
  }

  const rawSD = deriveRawSD(items, rawMean, topStd, stdP.mean, stdP.sd);
  if (!rawSD) return null;
  const z = (raw - rawMean) / rawSD;
  const std = z * stdP.sd + stdP.mean;
  return { std: Math.max(0, std), pct: null, estimated: true, source: 'computed' };
}

function calcForYear(year, eonRaw, chuRaw) {
  const d = LEET[year];
  if (!d) return null;
  const eon = (eonRaw !== null) ? getStdScore(year, 'eon', eonRaw) : null;
  const chu = (chuRaw !== null) ? getStdScore(year, 'chu', chuRaw) : null;
  return { year, era: d.era, eon, chu };
}

// ===========================================================================
// localStorage: 입력값 자동 저장/복원
// ===========================================================================
const STORAGE_KEY = 'leet_calculator_state_v1';

function saveState() {
  try {
    const data = {
      eonRaw: state.eonRaw,
      chuRaw: state.chuRaw,
      selectedYears: [...state.selectedYears],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { /* localStorage 비활성화 환경 무시 */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

// ===========================================================================
// State
// ===========================================================================
const saved = loadState();
const state = {
  selectedYears: new Set(saved?.selectedYears ?? [2023, 2024, 2025, 2026]),
  eonRaw: saved?.eonRaw ?? null,
  chuRaw: saved?.chuRaw ?? null,
  detailYear: 2025,
};

// ===========================================================================
// UI
// ===========================================================================
function buildYearChips() {
  const wrap = document.getElementById('yearChips');
  wrap.innerHTML = '';
  const years = Object.keys(LEET).map(Number).sort((a,b) => a-b);
  let breakInserted = false;
  years.forEach(y => {
    if (!breakInserted && y >= 2020) {
      const br = document.createElement('div');
      br.className = 'year-row-break';
      wrap.appendChild(br);
      breakInserted = true;
    }
    const chip = document.createElement('div');
    chip.className = 'y-chip';
    if (LEET[y].era === 'old') chip.classList.add('era-old');
    if (state.selectedYears.has(y)) chip.classList.add('active');
    chip.textContent = y;
    chip.addEventListener('click', () => {
      if (state.selectedYears.has(y)) state.selectedYears.delete(y);
      else state.selectedYears.add(y);
      chip.classList.toggle('active');
      saveState();
      render();
    });
    wrap.appendChild(chip);
  });
}

function buildYearTabs() {
  const wrap = document.getElementById('yearTabs');
  wrap.innerHTML = '';
  const years = Object.keys(LEET).map(Number).sort((a,b) => a-b);
  years.forEach(y => {
    const tab = document.createElement('button');
    tab.className = 'y-tab';
    if (state.detailYear === y) tab.classList.add('active');
    tab.textContent = y;
    tab.addEventListener('click', () => {
      state.detailYear = y;
      buildYearTabs();
      renderConvTables();
    });
    wrap.appendChild(tab);
  });
}

function renderConvTables() {
  const area = document.getElementById('convTablesArea');
  const y = state.detailYear;
  const d = LEET[y];
  if (!d) { area.innerHTML = ''; return; }

  if (d.isFullyEstimated) {
    area.innerHTML = `
      <div class="empty-state" style="padding: 20px;">
        ${y}학년도는 공식 환산표가 아직 정리되지 않았습니다.<br>
        법률저널 발표 데이터(언어 평균 ${d.eon_mean}·만점 표점 ${d.eon_top} / 추리 평균 ${d.chu_mean}·만점 표점 ${d.chu_top})를 기반으로 추정 계산만 가능합니다.
      </div>`;
    return;
  }

  const buildTable = (subject, table, est, items) => {
    const subName = subject === 'eon' ? '언어이해' : '추리논증';
    const keys = Object.keys(table).map(Number).sort((a,b) => b-a);
    const userRaw = subject === 'eon' ? state.eonRaw : state.chuRaw;
    let rows = '';
    keys.forEach(k => {
      const [s, p] = table[k];
      const isEst = (Array.isArray(est) && est.includes(k));
      const isHit = (userRaw !== null && userRaw === k);
      rows += `<tr class="${isHit ? 'user-hit' : ''}">
        <td class="r">${k}</td>
        <td class="s ${isEst ? 'est' : ''}">${s !== null ? s.toFixed(1) : '—'}</td>
        <td class="p">${p !== null ? p.toFixed(1) : '—'}</td>
      </tr>`;
    });
    return `
      <div class="conv-table">
        <div class="ct-head">${subName} <span style="font-weight:400;color:var(--ink-mute);font-size:11px;">${items}문항</span></div>
        <table class="conv">
          <thead><tr><th>원점수</th><th>표점</th><th>백분위</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  };

  area.innerHTML = `<div class="conv-tables">
    ${buildTable('eon', d.eon, d.eon_est, d.items_eon)}
    ${buildTable('chu', d.chu, d.chu_est, d.items_chu)}
  </div>`;
}

// ===========================================================================
// Render
// ===========================================================================
let chartInstance = null;

function render() {
  document.getElementById('eonRawDisplay').textContent = state.eonRaw !== null ? state.eonRaw : '—';
  document.getElementById('chuRawDisplay').textContent = state.chuRaw !== null ? state.chuRaw : '—';
  document.getElementById('eonHeadMax').textContent = state.eonRaw !== null ? `${state.eonRaw} / 30` : '— / 30';
  document.getElementById('chuHeadMax').textContent = state.chuRaw !== null ? `${state.chuRaw} / 40` : '— / 40';

  const years = [...state.selectedYears].sort((a,b) => a-b);
  const results = years.map(y => calcForYear(y, state.eonRaw, state.chuRaw)).filter(r => r);

  renderHeroPulse();
  renderSubjectTable('eonTable', results, 'eon', state.eonRaw);
  renderSubjectTable('chuTable', results, 'chu', state.chuRaw);
  renderCombined(results);
  renderChart(results);
  renderConvTables();
}

// ===========================================================================
// Hero Pulse: 선택된 학년도 중 가장 최근 연도 기준으로 표점합·백분위·전년 대비 델타 표시
// ===========================================================================
function renderHeroPulse() {
  const eraYearEl = document.getElementById('heroEraYear');
  const scoreEl = document.getElementById('heroScoreValue');
  const pctEl = document.getElementById('heroPercentileText');
  const deltaEl = document.getElementById('heroDelta');
  const eonMaxEl = document.getElementById('eonMaxLabel');
  const chuMaxEl = document.getElementById('chuMaxLabel');
  if (!scoreEl) return;

  const allYears = Object.keys(LEET).map(Number);
  const selected = [...state.selectedYears].filter(y => LEET[y]).sort((a, b) => b - a);
  const heroYear = selected[0] ?? Math.max(...allYears);
  const heroData = LEET[heroYear];

  eraYearEl.textContent = heroYear;
  if (heroData) {
    eonMaxEl.textContent = `/ ${heroData.items_eon}`;
    chuMaxEl.textContent = `/ ${heroData.items_chu}`;
  }

  const heroResult = calcForYear(heroYear, state.eonRaw, state.chuRaw);
  const eonStd = heroResult && heroResult.eon ? heroResult.eon.std : null;
  const chuStd = heroResult && heroResult.chu ? heroResult.chu.std : null;

  if (state.eonRaw === null || state.chuRaw === null || eonStd === null || chuStd === null) {
    scoreEl.textContent = '—';
    scoreEl.classList.remove('has-value');
    pctEl.innerHTML = '원점수를 입력하세요';
    deltaEl.style.display = 'none';
    return;
  }

  const total = eonStd + chuStd;
  scoreEl.textContent = total.toFixed(1);
  scoreEl.classList.add('has-value');

  let pctText = `원점수 <b>${state.eonRaw}+${state.chuRaw}</b>`;
  const eonPct = heroResult.eon.pct;
  const chuPct = heroResult.chu.pct;
  if (eonPct !== null && eonPct !== undefined && chuPct !== null && chuPct !== undefined) {
    const combinedPct = Math.sqrt(eonPct * chuPct);
    pctText = `백분위 <b>${combinedPct.toFixed(1)}</b> · ${pctText}`;
  }
  pctEl.innerHTML = pctText;

  // 전년 대비 델타: 같은 era 안에서만 (구↔신 시험제도 변경 구간은 비교 무의미)
  const prevYear = heroYear - 1;
  const prevData = LEET[prevYear];
  if (!prevData || prevData.era !== heroData.era) {
    deltaEl.style.display = 'none';
    return;
  }
  const prevResult = calcForYear(prevYear, state.eonRaw, state.chuRaw);
  const prevEonStd = prevResult && prevResult.eon ? prevResult.eon.std : null;
  const prevChuStd = prevResult && prevResult.chu ? prevResult.chu.std : null;
  if (prevEonStd === null || prevChuStd === null) {
    deltaEl.style.display = 'none';
    return;
  }
  const prevTotal = prevEonStd + prevChuStd;
  const delta = total - prevTotal;
  const sign = delta >= 0 ? '+' : '';
  const cls = delta >= 0 ? 'up' : 'down';
  const verb = delta >= 0 ? '상승' : '하락';
  const svg = delta >= 0
    ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>'
    : '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 7 9 13 13 9 21 17"/><polyline points="14 17 21 17 21 10"/></svg>';
  deltaEl.innerHTML = `<span class="ico ${cls}">${svg}</span>${prevYear}학년도 동일 원점수 대비 <span class="${cls}">${sign}${delta.toFixed(1)}</span> ${verb}`;
  deltaEl.style.display = 'inline-flex';
}

function renderSubjectTable(tableId, results, key, raw) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = '';
  if (raw === null || results.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">원점수를 입력하고 학년도를 선택하세요</td></tr>';
    return;
  }
  // 연도 오름차순
  const sorted = [...results].sort((a,b) => a.year - b.year);
  sorted.forEach(r => {
    const v = r[key];
    const eraLabel = r.era === 'new' ? '신리트' : '구리트';
    const stdHtml = v && v.std !== null
      ? `<td class="std ${v.estimated ? 'estimated' : ''}">${v.std.toFixed(1)}${v.estimated ? '<span class="badge-est">추정</span>' : ''}</td>`
      : `<td class="std">—</td>`;
    const pctHtml = v && v.pct !== null && v.pct !== undefined
      ? `<td class="pct">${v.pct.toFixed(1)}</td>`
      : `<td class="pct">—</td>`;
    tbody.innerHTML += `
      <tr>
        <td class="year">${r.year}</td>
        <td class="era">${eraLabel}</td>
        ${stdHtml}
        ${pctHtml}
      </tr>`;
  });
}

function renderCombined(results) {
  const sec = document.getElementById('combinedSection');
  const tbody = document.querySelector('#combinedTable tbody');
  tbody.innerHTML = '';
  const valid = results.filter(r => r.eon && r.chu && r.eon.std !== null && r.chu.std !== null);
  if (valid.length === 0) { sec.style.display = 'none'; return; }
  sec.style.display = 'grid';
  const sorted = [...valid].sort((a,b) => a.year - b.year);
  sorted.forEach(r => {
    const total = r.eon.std + r.chu.std;
    const isEst = r.eon.estimated || r.chu.estimated;
    // 합계 백분위 추정: 두 영역 백분위가 모두 있을 때만 기하평균으로 근사
    let pctCell = '<td class="combined-pct">—</td>';
    if (r.eon.pct !== null && r.eon.pct !== undefined && r.chu.pct !== null && r.chu.pct !== undefined) {
      // 백분위는 "내 아래에 있는 비율"이므로, 1-pct/100을 z-score처럼 다뤄서 결합
      // 단순화: 두 영역 백분위의 기하평균 (보수적 추정)
      const combined = Math.sqrt(r.eon.pct * r.chu.pct);
      pctCell = `<td class="combined-pct has-value">${combined.toFixed(1)}%</td>`;
    }
    tbody.innerHTML += `
      <tr>
        <td class="year">${r.year}</td>
        <td>${r.eon.std.toFixed(1)}${r.eon.estimated ? '*' : ''}</td>
        <td>${r.chu.std.toFixed(1)}${r.chu.estimated ? '*' : ''}</td>
        <td class="total">${total.toFixed(1)}${isEst ? '*' : ''}</td>
        ${pctCell}
      </tr>`;
  });
}

function renderChart(results) {
  const ctx = document.getElementById('chart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  if (results.length === 0) return;

  const sorted = [...results].sort((a,b) => a.year - b.year);
  const labels = sorted.map(r => r.year);
  const totalData = sorted.map(r => (r.eon && r.chu && r.eon.std !== null && r.chu.std !== null) ? r.eon.std + r.chu.std : null);

  // 합계 데이터 포인트별 상세 (툴팁용)
  const eonStds = sorted.map(r => r.eon ? r.eon.std : null);
  const chuStds = sorted.map(r => r.chu ? r.chu.std : null);

  // y축 범위를 데이터에 맞춰 동적 계산 (위아래 여유)
  const validData = totalData.filter(v => v !== null && !isNaN(v));
  const dataMin = Math.min(...validData);
  const dataMax = Math.max(...validData);
  const range = dataMax - dataMin;
  const padTop = Math.max(range * 0.25, 4);
  const padBottom = Math.max(range * 0.15, 2);
  const yMin = Math.floor((dataMin - padBottom) * 2) / 2;
  const yMax = Math.ceil((dataMax + padTop) * 2) / 2;

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '표준점수 합계',
          data: totalData,
          borderColor: '#1A56DB',
          backgroundColor: 'rgba(26, 86, 219, 0.08)',
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 9,
          pointBackgroundColor: '#1A56DB',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      // 좌우 여유를 두어서 첫/마지막 포인트 라벨이 잘리지 않도록
      layout: { padding: { top: 36, right: 32, bottom: 12, left: 24 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17,17,17,0.95)',
          titleFont: { family: 'JetBrains Mono, monospace', size: 13, weight: 'bold' },
          bodyFont: { family: 'Pretendard, -apple-system, sans-serif', size: 12 },
          padding: 14,
          displayColors: false,
          callbacks: {
            title: items => items[0].label + '학년도',
            label: ctx => {
              const i = ctx.dataIndex;
              const lines = [];
              const total = ctx.parsed.y;
              if (total !== null && !isNaN(total)) {
                lines.push('합계: ' + total.toFixed(1));
              }
              if (eonStds[i] !== null) lines.push('  언어이해: ' + eonStds[i].toFixed(1));
              if (chuStds[i] !== null) lines.push('  추리논증: ' + chuStds[i].toFixed(1));
              return lines;
            },
          },
        },
        datalabels: false,
      },
      scales: {
        y: {
          beginAtZero: false,
          min: yMin,
          max: yMax,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { family: 'JetBrains Mono, monospace', size: 11 }, color: '#71717A' },
          title: {
            display: true,
            text: '표준점수 합계 (언어 + 추리)',
            font: { family: 'Pretendard, -apple-system, sans-serif', size: 11, weight: '500' },
            color: '#27272A',
          },
        },
        x: {
          grid: { display: false },
          // 첫/마지막 포인트가 axis와 겹치지 않도록 여유 추가
          offset: true,
          ticks: { font: { family: 'JetBrains Mono, monospace', size: 12, weight: '600' }, color: '#18181B' },
        },
      },
    },
    plugins: [{
      // 각 데이터 포인트 위에 숫자 표시 (지능적 배치)
      id: 'pointLabels',
      afterDatasetsDraw(chart) {
        const { ctx, chartArea } = chart;
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);
        ctx.save();
        ctx.font = "600 11px JetBrains Mono, monospace";
        ctx.fillStyle = '#111111';
        ctx.textBaseline = 'middle';
        meta.data.forEach((point, i) => {
          const v = dataset.data[i];
          if (v === null || isNaN(v)) return;
          const text = v.toFixed(1);
          const textWidth = ctx.measureText(text).width;

          // 라벨을 점 위쪽에 배치, 위쪽 여유가 부족하면 아래쪽에 배치
          let labelY = point.y - 16;
          if (labelY - 6 < chartArea.top) {
            labelY = point.y + 16;  // 위가 부족하면 아래로
          }

          // 좌우 가장자리 처리: 첫 점은 왼쪽 정렬(오른쪽으로 밀고), 마지막 점은 오른쪽 정렬(왼쪽으로 밀고)
          let labelX = point.x;
          let textAlign = 'center';
          if (point.x - textWidth/2 < chartArea.left + 2) {
            labelX = point.x;
            textAlign = 'left';
          } else if (point.x + textWidth/2 > chartArea.right - 2) {
            labelX = point.x;
            textAlign = 'right';
          }
          ctx.textAlign = textAlign;

          // 가독성을 위한 흰색 외곽선
          ctx.strokeStyle = 'rgba(255,255,255,0.9)';
          ctx.lineWidth = 3;
          ctx.strokeText(text, labelX, labelY);
          ctx.fillText(text, labelX, labelY);
        });
        ctx.restore();
      },
    }],
  });
}

// ===========================================================================
// Events
// ===========================================================================
document.getElementById('eonInput').addEventListener('input', e => {
  const v = e.target.value;
  state.eonRaw = (v === '' || isNaN(parseInt(v))) ? null : Math.max(0, Math.min(40, parseInt(v)));
  saveState();
  render();
});
document.getElementById('chuInput').addEventListener('input', e => {
  const v = e.target.value;
  state.chuRaw = (v === '' || isNaN(parseInt(v))) ? null : Math.max(0, Math.min(40, parseInt(v)));
  saveState();
  render();
});
document.getElementById('selectAll').addEventListener('click', () => {
  state.selectedYears = new Set(Object.keys(LEET).map(Number));
  buildYearChips(); saveState(); render();
});
document.getElementById('selectNew').addEventListener('click', () => {
  state.selectedYears = new Set(Object.keys(LEET).map(Number).filter(y => LEET[y].era === 'new'));
  buildYearChips(); saveState(); render();
});
document.getElementById('selectRecent').addEventListener('click', () => {
  state.selectedYears = new Set([2022, 2023, 2024, 2025, 2026]);
  buildYearChips(); saveState(); render();
});
document.getElementById('selectClear').addEventListener('click', () => {
  state.selectedYears = new Set();
  buildYearChips(); saveState(); render();
});

// Init: 저장된 입력값이 있으면 입력 칸에 복원
if (state.eonRaw !== null) document.getElementById('eonInput').value = state.eonRaw;
if (state.chuRaw !== null) document.getElementById('chuInput').value = state.chuRaw;

buildYearChips();
buildYearTabs();
render();

// ===========================================================================
// 입시결과 비교 탭
// ===========================================================================
let admSortKey = 'diff';
let admSelectedSchools = null; // null = 전체, 배열 = 선택된 학교만

function buildAdmChips() {
  const wrap = document.getElementById('admChips');
  if (!wrap) return;
  wrap.innerHTML = '';

  const selSet = (admSelectedSchools === null)
    ? new Set(Object.keys(ADMISSION_2026))
    : new Set(admSelectedSchools);

  const groups = { '서울': [], '경기/인천': [], '지방': [] };
  for (const name of Object.keys(ADMISSION_2026)) {
    const school = LAW_SCHOOLS.find(s => s.name === name);
    if (!school) continue;
    const g = school.group || '지방';
    if (!groups[g]) groups[g] = [];
    groups[g].push(name);
  }

  Object.entries(groups).forEach(([gName, names]) => {
    if (names.length === 0) return;
    const groupDiv = document.createElement('div');
    groupDiv.className = 'sch-chip-group';
    groupDiv.setAttribute('data-region', gName);
    groupDiv.innerHTML = `<div class="sch-chip-glabel">${gName}</div><div class="sch-chip-row"></div>`;
    const row = groupDiv.querySelector('.sch-chip-row');
    names.forEach(name => {
      const chip = document.createElement('div');
      chip.className = 'sch-chip';
      if (selSet.has(name)) chip.classList.add('active');
      chip.textContent = name;
      chip.addEventListener('click', () => {
        const cur = (admSelectedSchools === null)
          ? new Set(Object.keys(ADMISSION_2026))
          : new Set(admSelectedSchools);
        if (cur.has(name)) cur.delete(name);
        else cur.add(name);
        if (cur.size === Object.keys(ADMISSION_2026).length) {
          admSelectedSchools = null;
        } else {
          admSelectedSchools = [...cur];
        }
        chip.classList.toggle('active');
        updateAdmFilterCount();
        renderAdmission();
      });
      row.appendChild(chip);
    });
    wrap.appendChild(groupDiv);
  });

  // 빠른 선택 버튼
  const actions = document.getElementById('admChipsActions');
  if (actions) {
    actions.innerHTML = `
      <button data-action="all">전체 선택</button>
      <button data-action="seoul">서울권만</button>
      <button data-action="metro">서울/경기·인천</button>
      <button data-action="clear">선택 해제</button>
    `;
    actions.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        if (a === 'all') {
          admSelectedSchools = null;
        } else if (a === 'clear') {
          admSelectedSchools = [];
        } else if (a === 'seoul') {
          admSelectedSchools = Object.keys(ADMISSION_2026).filter(name => {
            const s = LAW_SCHOOLS.find(x => x.name === name);
            return s && s.group === '서울';
          });
        } else if (a === 'metro') {
          admSelectedSchools = Object.keys(ADMISSION_2026).filter(name => {
            const s = LAW_SCHOOLS.find(x => x.name === name);
            return s && (s.group === '서울' || s.group === '경기/인천');
          });
        }
        buildAdmChips();
        updateAdmFilterCount();
        renderAdmission();
      });
    });
  }
  updateAdmFilterCount();
}

function updateAdmFilterCount() {
  const countEl = document.getElementById('admFilterCount');
  if (!countEl) return;
  const total = Object.keys(ADMISSION_2026).length;
  if (admSelectedSchools === null) {
    countEl.textContent = `전체 ${total}개 표시 중`;
  } else {
    countEl.textContent = `${admSelectedSchools.length} / ${total}개 표시 중`;
  }
}

// 입시 합격등급 분류: 'safe' | 'match' | 'reach' | 'hard' | null
function classifyAdm(school, ad, leetSum) {
  if (!ad.leet || ad.leet.val === null) return null;
  let myLeet;
  if (ad.leet.max !== null) {
    // 자체환산 → 학교 자체 calc로 내 점수 환산
    const c = calcSchool(school);
    if (c.leet === null || c.leet === undefined) return null;
    myLeet = c.leet;
  } else {
    // 표점합 기준 → 내 표점합과 직접 비교
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

const ADM_GRADE_LABEL = { safe: '안정', match: '적정', reach: '도전', hard: '위험' };

function renderAdmission() {
  // 내 점수 요약 (KPI 렌더링은 행 빌드 + 등급 계산 후 아래에서)
  const sum = document.getElementById('admSummary');
  const eonStd = schState.eonStd;
  const chuStd = schState.chuStd;
  const leetSum = (eonStd !== null && chuStd !== null) ? eonStd + chuStd : null;
  const gpaPct = schState.gpaPct;

  // 25개교 데이터 빌드 (필터 적용)
  const admFilter = (admSelectedSchools === null)
    ? null
    : new Set(admSelectedSchools);
  const rows = [];
  for (const [name, ad] of Object.entries(ADMISSION_2026)) {
    if (admFilter && !admFilter.has(name)) continue;
    const school = LAW_SCHOOLS.find(s => s.name === name);
    if (!school) continue;

    // LEET 50% 표시값
    let leet50Text = '—';
    let leet50Val = null;
    let leet50IsConverted = false; // 학교 자체 환산인가?
    if (ad.leet && ad.leet.val !== null) {
      leet50Val = ad.leet.val;
      if (ad.leet.max !== null) {
        leet50Text = `${ad.leet.val.toFixed(1)} <span class="sub">/ ${ad.leet.max}</span>`;
        leet50IsConverted = true;
      } else {
        leet50Text = `${ad.leet.val.toFixed(1)}`;
      }
    }

    // LEET 분포 데이터 (25%, 50%, 75%)
    const leet75Val = (ad.leet75 && ad.leet75.val !== null) ? ad.leet75.val : null;

    // LEET 75% 표시값
    let leet75Text = '—';
    if (ad.leet75 && ad.leet75.val !== null) {
      if (ad.leet75.max !== null) {
        leet75Text = `${ad.leet75.val.toFixed(1)} <span class="sub">/ ${ad.leet75.max}</span>`;
      } else {
        leet75Text = `${ad.leet75.val.toFixed(1)}`;
      }
    }

    // 내 LEET와 비교
    let leetDiffText = '';
    let leetDiffClass = 'na';
    let leetDiffVal = null;
    if (ad.leet && ad.leet.val !== null && ad.leet.max !== null) {
      // 학교 자체 환산 체계 → calc() 결과와 비교
      const c = calcSchool(school);
      if (c.leet !== null) {
        const diff = c.leet - ad.leet.val;
        leetDiffVal = diff;
        if (diff > 0.05) {
          leetDiffClass = 'plus';
          leetDiffText = `▲ ${diff.toFixed(1)}`;
        } else if (diff < -0.05) {
          leetDiffClass = 'minus';
          leetDiffText = `▼ ${Math.abs(diff).toFixed(1)}`;
        } else {
          leetDiffClass = 'even';
          leetDiffText = '±0.0';
        }
      } else {
        leetDiffText = '—';
      }
    } else if (ad.leet && ad.leet.val !== null && ad.leet.max === null && leetSum !== null) {
      // 표점합 기준 → 내 표점합과 직접 비교
      const diff = leetSum - ad.leet.val;
      leetDiffVal = diff;
      if (diff > 0.05) {
        leetDiffClass = 'plus';
        leetDiffText = `▲ ${diff.toFixed(1)}`;
      } else if (diff < -0.05) {
        leetDiffClass = 'minus';
        leetDiffText = `▼ ${Math.abs(diff).toFixed(1)}`;
      } else {
        leetDiffClass = 'even';
        leetDiffText = '±0.0';
      }
    } else {
      leetDiffText = '—';
    }

    // GPA 50% 표시 — 짧게
    let gpa50Text = '—';
    if (ad.gpa && ad.gpa.val !== null && ad.gpa.max !== null) {
      gpa50Text = `${ad.gpa.val.toFixed(1)} <span class="sub">/ ${ad.gpa.max}</span>`;
    } else if (ad.gpa && ad.gpa.note) {
      // 긴 텍스트를 축약: 백분위 숫자만 추출 시도
      const pctMatch = ad.gpa.note.match(/([\d.]+)%/);
      if (pctMatch) {
        gpa50Text = `${pctMatch[1]}%`;
      } else if (ad.gpa.note.match(/GPA\s*([\d.]+)/i)) {
        const gpaMatch = ad.gpa.note.match(/([\d.]+)\s*\/\s*([\d.]+)/);
        gpa50Text = gpaMatch ? `${gpaMatch[1]} <span class="sub">/ ${gpaMatch[2]}</span>` : ad.gpa.note;
      } else {
        gpa50Text = ad.gpa.note.length > 12 ? ad.gpa.note.slice(0, 12) + '…' : ad.gpa.note;
      }
    }

    // 영어 50% 표시 — 짧게
    let eng50Text = '—';
    if (school.engType === 'pf') {
      eng50Text = 'P/F';
    } else if (ad.eng && ad.eng.val !== null && ad.eng.max !== null) {
      eng50Text = `${ad.eng.val.toFixed(0)} <span class="sub">/ ${ad.eng.max}</span>`;
    } else if (ad.eng && ad.eng.note) {
      // TOEIC 숫자만 추출
      const toeicMatch = ad.eng.note.match(/TOEIC\s*([\d]+)/i);
      if (toeicMatch) {
        eng50Text = toeicMatch[1];
      } else {
        eng50Text = ad.eng.note.length > 10 ? ad.eng.note.slice(0, 10) + '…' : ad.eng.note;
      }
    }

    // 학교명 아래 서브텍스트 (비고+추가정보)
    const subParts = [];
    if (ad.ref) subParts.push(ad.ref);
    // GPA 원본 note가 축약된 경우 풀텍스트 추가
    if (ad.gpa && ad.gpa.note && ad.gpa.note.includes('/')) {
      subParts.push('학부: ' + ad.gpa.note);
    }
    // 영어 원본 note가 축약된 경우 풀텍스트 추가
    if (ad.eng && ad.eng.note && ad.eng.note.includes('/')) {
      subParts.push('영어: ' + ad.eng.note);
    }
    const subText = subParts.join(' · ');

    // 지역 뱃지
    const regionCls = school.group === '서울' ? 'seoul' : (school.group === '경기/인천' ? 'metro' : 'local');
    const regionText = school.group;

    rows.push({
      name, enrolled: ad.enrolled, school, ad,
      leet50Val: leet50Val, leet50Text, leet50IsConverted,
      leet50Max: (ad.leet && ad.leet.max) ? ad.leet.max : null,
      leet75Text,
      leetDiffVal, leetDiffText, leetDiffClass,
      gpa50Text, eng50Text, subText,
      regionCls, regionText,
    });
  }

  // 합격등급 분류 + 집계
  const gradeCounts = { safe: 0, match: 0, reach: 0, hard: 0 };
  let bestSafeName = null, bestSafeCut = -Infinity;
  let bestMatchName = null, bestMatchCut = -Infinity;
  for (const r of rows) {
    r.grade = classifyAdm(r.school, r.ad, leetSum);
    if (r.grade) gradeCounts[r.grade]++;
    if (!r.leet50IsConverted && r.leet50Val !== null) {
      if (r.grade === 'safe' && r.leet50Val > bestSafeCut) {
        bestSafeCut = r.leet50Val;
        bestSafeName = r.name;
      } else if (r.grade === 'match' && r.leet50Val > bestMatchCut) {
        bestMatchCut = r.leet50Val;
        bestMatchName = r.name;
      }
    }
  }

  // KPI 4-card 렌더링
  const totalGraded = gradeCounts.safe + gradeCounts.match + gradeCounts.reach + gradeCounts.hard;
  let recHtml;
  if (bestSafeName) {
    recHtml = `<div class="as-val as-val-school">${bestSafeName}</div>
      <div class="as-sub">LEET ${bestSafeCut.toFixed(1)} · 안정권 ${gradeCounts.safe}곳 중 최상위</div>`;
  } else if (bestMatchName) {
    recHtml = `<div class="as-val as-val-school muted">안정권 없음</div>
      <div class="as-sub">적정 ${gradeCounts.match}곳 · 최상위 ${bestMatchName}</div>`;
  } else if (leetSum === null) {
    recHtml = `<div class="as-val empty">LEET 입력 필요</div>`;
  } else {
    recHtml = `<div class="as-val empty">합격권 없음</div>
      <div class="as-sub">점수 보강 필요</div>`;
  }
  let distribHtml;
  if (totalGraded > 0) {
    distribHtml = `<div class="as-distrib">
      <span class="grade-pill grade-safe">안정 ${gradeCounts.safe}</span>
      <span class="grade-pill grade-match">적정 ${gradeCounts.match}</span>
      <span class="grade-pill grade-reach">도전 ${gradeCounts.reach}</span>
      <span class="grade-pill grade-hard">위험 ${gradeCounts.hard}</span>
    </div>`;
  } else {
    distribHtml = `<div class="as-val empty">${leetSum === null ? 'LEET 입력 필요' : '데이터 없음'}</div>`;
  }
  sum.innerHTML = `
    <div class="adm-summary-item">
      <div class="as-label">내 LEET 표점합</div>
      <div class="as-val ${leetSum === null ? 'empty' : ''}">${leetSum !== null ? leetSum.toFixed(1) : '학교별 탭에서 입력'}</div>
    </div>
    <div class="adm-summary-item">
      <div class="as-label">내 학점 백분위</div>
      <div class="as-val ${gpaPct === null ? 'empty' : ''}">${gpaPct !== null ? gpaPct.toFixed(1) + '%' : '학교별 탭에서 입력'}</div>
    </div>
    <div class="adm-summary-item adm-summary-distrib">
      <div class="as-label">합격권 분포 ${totalGraded > 0 ? `(${totalGraded}개교)` : ''}</div>
      ${distribHtml}
    </div>
    <div class="adm-summary-item">
      <div class="as-label">추천 안정 라인</div>
      ${recHtml}
    </div>
  `;

  // 정렬
  if (admSortKey === 'leet-cut') {
    // 표점합 기준 학교만 의미있는 정렬 → 자체환산 학교는 하단에 별도 배치
    rows.sort((a, b) => {
      // 둘 다 표점합 → 값 비교
      if (!a.leet50IsConverted && !b.leet50IsConverted) {
        return (b.leet50Val ?? -999) - (a.leet50Val ?? -999);
      }
      // 표점합이 자체환산보다 위
      if (!a.leet50IsConverted && b.leet50IsConverted) return -1;
      if (a.leet50IsConverted && !b.leet50IsConverted) return 1;
      // 둘 다 자체환산 → 이름순
      return a.name.localeCompare(b.name, 'ko');
    });
  } else if (admSortKey === 'enrolled') {
    rows.sort((a, b) => b.enrolled - a.enrolled);
  } else if (admSortKey === 'alpha') {
    rows.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  } else if (admSortKey === 'diff') {
    // 표점합 학교끼리, 자체환산 학교끼리 각각 여유 큰 순 정렬
    rows.sort((a, b) => {
      if (!a.leet50IsConverted && !b.leet50IsConverted) {
        return (b.leetDiffVal ?? -999) - (a.leetDiffVal ?? -999);
      }
      if (!a.leet50IsConverted && b.leet50IsConverted) return -1;
      if (a.leet50IsConverted && !b.leet50IsConverted) return 1;
      // 둘 다 자체환산 → 만점 대비 비율로 정규화 비교
      const aRatio = (a.leetDiffVal !== null && a.leet50Max) ? a.leetDiffVal / a.leet50Max : -999;
      const bRatio = (b.leetDiffVal !== null && b.leet50Max) ? b.leetDiffVal / b.leet50Max : -999;
      return bRatio - aRatio;
    });
  }

  // 렌더링
  const tbody = document.getElementById('admTableBody');
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px 20px;color:var(--ink-mute);font-style:italic;">선택된 학교가 없습니다. 학교 선택에서 하나 이상 선택하세요.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map((r, i) => {
    const subHtml = r.subText ? `<span class="adm-school-sub">${r.subText}</span>` : '';
    const gradeBadge = r.grade
      ? `<span class="adm-grade-badge grade-${r.grade}">${ADM_GRADE_LABEL[r.grade]}</span>`
      : '';
    // title 속성용 plain text (HTML 태그 제거)
    const gpaPlain = r.gpa50Text.replace(/<[^>]*>/g, '');
    const engPlain = r.eng50Text.replace(/<[^>]*>/g, '');
    // 표점합→자체환산 경계에 구분선 추가
    let separator = '';
    if ((admSortKey === 'leet-cut' || admSortKey === 'diff') && i > 0 && !rows[i-1].leet50IsConverted && r.leet50IsConverted) {
      separator = `<tr class="adm-separator-row"><td colspan="7">▼ 이하 자체 환산점수 (표점합과 직접 비교 불가)</td></tr>`;
    }
    return `${separator}<tr data-grade="${r.grade || ''}">
      <td class="school-name">${r.name}${gradeBadge}<span class="adm-region-badge ${r.regionCls}">${r.regionText}</span>${subHtml}</td>
      <td class="num">${r.enrolled}명</td>
      <td class="num">${r.leet50Text}</td>
      <td class="num">${r.leet75Text}</td>
      <td class="diff ${r.leetDiffClass}">${r.leetDiffText}</td>
      <td class="num" title="${gpaPlain}">${r.gpa50Text}</td>
      <td class="num" title="${engPlain}">${r.eng50Text}</td>
    </tr>`;
  }).join('');
}

// 입시결과 탭 정렬 버튼 이벤트
document.querySelectorAll('[data-adm-sort]').forEach(btn => {
  btn.addEventListener('click', () => {
    admSortKey = btn.dataset.admSort;
    document.querySelectorAll('[data-adm-sort]').forEach(b => b.classList.toggle('active', b === btn));
    renderAdmission();
  });
});

// ===========================================================================
// 탭 전환
// ===========================================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + target));
    if (target === 'log') renderLog();
    if (target === 'admission') { buildAdmChips(); renderAdmission(); }
  });
});


initAuth();


// 입력 상태
const SCH_STORAGE_KEY = 'leet_schools_input_v1';
function loadSchInput() {
  try {
    const r = localStorage.getItem(SCH_STORAGE_KEY);
    return r ? JSON.parse(r) : {};
  } catch (e) { return {}; }
}
function saveSchInput(data) {
  try { localStorage.setItem(SCH_STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}

const schState = Object.assign({
  eonStd: null,
  chuStd: null,
  eonPct: null,
  chuPct: null,
  gpaPct: null,
  gpaScore: null,
  gpaScale: '4.5',
  engType: 'toeic',
  engScore: null,
  sortBy: 'leet',
  selectedSchools: null,  // null = 전체 표시, 배열이면 해당 학교만 표시
}, loadSchInput());

// 입력칸 초기 복원
function restoreSchInputs() {
  if (schState.eonStd !== null) document.getElementById('schEonStd').value = schState.eonStd;
  if (schState.chuStd !== null) document.getElementById('schChuStd').value = schState.chuStd;
  if (schState.eonPct !== null) {
    const el = document.getElementById('schEonPct');
    if (el) el.value = schState.eonPct;
  }
  if (schState.chuPct !== null) {
    const el = document.getElementById('schChuPct');
    if (el) el.value = schState.chuPct;
  }
  if (schState.gpaPct !== null) document.getElementById('schGpaPct').value = schState.gpaPct;
  if (schState.gpaScore !== null) document.getElementById('schGpaScore').value = schState.gpaScore;
  if (schState.gpaScale) document.getElementById('schGpaScale').value = schState.gpaScale;
  if (schState.engType) document.getElementById('schEngType').value = schState.engType;
  if (schState.engScore !== null) document.getElementById('schEngScore').value = schState.engScore;
}

// ===== 학교별 종합 정량점수 계산 (각 학교 calc 함수 사용) =====
function calcSchool(school) {
  const input = {
    eonStd: schState.eonStd,
    chuStd: schState.chuStd,
    eonPct: schState.eonPct,
    chuPct: schState.chuPct,
    gpaPct: schState.gpaPct,
    gpaScore: schState.gpaScore,
    gpaScale: schState.gpaScale,
    engType: schState.engType,
    engScore: schState.engScore,
  };

  const r = school.calc(input);
  const leet = r.leet;
  const gpa = r.gpa;
  const eng = r.eng;

  // 합산 만점 (LEET + 학부 + 점수반영 영어)
  let totalDenom = school.leetMax + school.gpaMax;
  if (school.engType === 'score' && school.engMax) totalDenom += school.engMax;

  // 총점: LEET + GPA + (점수반영 영어)
  const parts = [leet, gpa];
  if (school.engType === 'score') parts.push(eng);

  let totalSum = 0;
  let totalValid = true;
  for (const p of parts) {
    if (p === null || p === undefined) { totalValid = false; break; }
    totalSum += p;
  }

  return {
    leet, gpa, eng,
    total: totalValid ? totalSum : null,
    totalDenom,
    leetDenom: school.leetMax,
    gpaDenom: school.gpaMax,
    engDenom: school.engMax,
  };
}


// 커트라인 비교 결과 생성
function getCutlineComparison(schoolName, calcResult) {
  const ad = ADMISSION_2026[schoolName];
  if (!ad) return null;

  const comparisons = [];

  // LEET 비교 (학교 자체 환산점수 기준으로 비교 가능한 경우만)
  if (ad.leet && ad.leet.val !== null && ad.leet.max !== null && calcResult.leet !== null) {
    const diff = calcResult.leet - ad.leet.val;
    comparisons.push({
      label: 'LEET',
      myVal: calcResult.leet,
      cutVal: ad.leet.val,
      max: ad.leet.max,
      diff,
      unit: ad.leet.unit,
    });
  }

  // GPA 비교
  if (ad.gpa && ad.gpa.val !== null && ad.gpa.max !== null && calcResult.gpa !== null) {
    const diff = calcResult.gpa - ad.gpa.val;
    comparisons.push({
      label: '학부',
      myVal: calcResult.gpa,
      cutVal: ad.gpa.val,
      max: ad.gpa.max,
      diff,
      unit: ad.gpa.unit,
    });
  }

  // 영어 비교
  if (ad.eng && ad.eng.val !== null && ad.eng.max !== null && calcResult.eng !== null) {
    const diff = calcResult.eng - ad.eng.val;
    comparisons.push({
      label: '영어',
      myVal: calcResult.eng,
      cutVal: ad.eng.val,
      max: ad.eng.max,
      diff,
      unit: ad.eng.unit,
    });
  }

  return { enrolled: ad.enrolled, comparisons, ad };
}

// ===== 학교 카드 렌더링 =====
function renderSchools() {
  const grid = document.getElementById('schoolsGrid');

  // 필터: 선택된 학교만 표시 (null이면 전체)
  let filteredSchools = LAW_SCHOOLS;
  if (Array.isArray(schState.selectedSchools) && schState.selectedSchools.length > 0) {
    const selSet = new Set(schState.selectedSchools);
    filteredSchools = LAW_SCHOOLS.filter(s => selSet.has(s.name));
  } else if (Array.isArray(schState.selectedSchools) && schState.selectedSchools.length === 0) {
    filteredSchools = [];
  }

  // 학교 선택 카운트 표시
  const countEl = document.getElementById('schoolFilterCount');
  if (countEl) {
    if (!Array.isArray(schState.selectedSchools)) {
      countEl.textContent = `전체 ${LAW_SCHOOLS.length}개 표시 중`;
    } else {
      countEl.textContent = `${filteredSchools.length} / ${LAW_SCHOOLS.length}개 표시 중`;
    }
  }

  // 정렬
  let schools = filteredSchools.map(s => ({ school: s, calc: calcSchool(s) }));
  if (schState.sortBy === 'leet') {
    schools.sort((a, b) => b.school.leetRatio - a.school.leetRatio);
  } else if (schState.sortBy === 'alpha') {
    schools.sort((a, b) => a.school.name.localeCompare(b.school.name, 'ko'));
  } else if (schState.sortBy === 'myscore') {
    schools.sort((a, b) => {
      const ar = a.calc.total !== null ? a.calc.total / a.calc.totalDenom : -1;
      const br = b.calc.total !== null ? b.calc.total / b.calc.totalDenom : -1;
      return br - ar;
    });
  }

  if (schools.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">선택된 학교가 없습니다. 학교 선택에서 하나 이상 선택하세요.</div>`;
    return;
  }

  grid.innerHTML = schools.map(({ school: s, calc: c }) => {
    // tier 색상: LEET 실질반영비율에 따라
    let tier = '';
    if (s.leetRatio >= 50) tier = '';  // 빨강 (default)
    else if (s.leetRatio >= 40) tier = 'tier-mid';  // 골드
    else tier = 'tier-low';  // 블루

    // 총점 표시
    const totalHtml = c.total !== null
      ? `<span class="sc-total-val">${c.total.toFixed(1)}<span class="denom">/${c.totalDenom}</span></span>`
      : `<span class="sc-total-val empty">— 점수 입력 필요</span>`;

    const totalPctHtml = '';

    // 각 영역 행
    const leetVal = c.leet !== null
      ? `${c.leet.toFixed(1)}<span class="denom"> / ${c.leetDenom}</span>`
      : '<span class="empty">—</span>';
    const leetBarPct = c.leet !== null ? (c.leet / c.leetDenom * 100) : 0;

    const gpaVal = c.gpa !== null
      ? `${c.gpa.toFixed(1)}<span class="denom"> / ${c.gpaDenom}</span>`
      : '<span class="empty">—</span>';
    const gpaBarPct = c.gpa !== null ? (c.gpa / c.gpaDenom * 100) : 0;

    let engHtml;
    if (s.engType === 'pf') {
      engHtml = `<div class="sc-row">
        <div class="sc-area">영어</div>
        <div class="sc-bar"></div>
        <div class="sc-val"><span class="sc-eng-pf">P/F</span></div>
      </div>`;
    } else {
      const engVal = c.eng !== null
        ? `${c.eng.toFixed(1)}<span class="denom"> / ${c.engDenom}</span>`
        : '<span class="empty">—</span>';
      const engBarPct = c.eng !== null ? (c.eng / c.engDenom * 100) : 0;
      engHtml = `<div class="sc-row">
        <div class="sc-area">영어</div>
        <div class="sc-bar"><div class="sc-bar-fill eng" style="width:${engBarPct}%"></div></div>
        <div class="sc-val">${engVal}</div>
      </div>`;
    }

    const noteHtml = s.note ? `<div class="sc-note">${s.note}</div>` : '';

    return `
      <div class="school-card ${tier}">
        <div class="sc-head">
          <div class="sc-name">${s.name}</div>
          <div class="sc-leet-pct">LEET 실질반영 <span class="num">${s.leetRatio.toFixed(1)}%</span></div>
        </div>
        <div class="sc-total-row">
          <div>
            <span class="sc-total-label">정량 환산점수</span>
            ${totalPctHtml}
          </div>
          ${totalHtml}
        </div>
        <div class="sc-rows">
          <div class="sc-row">
            <div class="sc-area">LEET</div>
            <div class="sc-bar"><div class="sc-bar-fill" style="width:${leetBarPct}%"></div></div>
            <div class="sc-val">${leetVal}</div>
          </div>
          <div class="sc-row">
            <div class="sc-area">학점</div>
            <div class="sc-bar"><div class="sc-bar-fill gpa" style="width:${gpaBarPct}%"></div></div>
            <div class="sc-val">${gpaVal}</div>
          </div>
          ${engHtml}
        </div>
        ${noteHtml}
      </div>`;
  }).join('');
}

// 입력 이벤트 연결
function attachSchoolEvents() {
  const inputs = [
    ['schEonStd', 'eonStd', 'float'],
    ['schChuStd', 'chuStd', 'float'],
    ['schEonPct', 'eonPct', 'float'],
    ['schChuPct', 'chuPct', 'float'],
    ['schGpaPct', 'gpaPct', 'float'],
    ['schGpaScore', 'gpaScore', 'float'],
    ['schEngScore', 'engScore', 'float'],
  ];
  inputs.forEach(([id, key, type]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', e => {
      const v = e.target.value;
      schState[key] = (v === '' || isNaN(parseFloat(v))) ? null : parseFloat(v);
      saveSchInput(schState);
      renderSchools();
    });
  });
  document.getElementById('schGpaScale').addEventListener('change', e => {
    schState.gpaScale = e.target.value;
    saveSchInput(schState);
    renderSchools();
  });
  document.getElementById('schEngType').addEventListener('change', e => {
    schState.engType = e.target.value;
    saveSchInput(schState);
    renderSchools();
  });
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sort = btn.dataset.sort;
      schState.sortBy = sort;
      saveSchInput(schState);
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderSchools();
    });
  });
  // 정렬 버튼 active 상태 복원
  document.querySelectorAll('.sort-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.sort === schState.sortBy);
  });

  // 학교 선택 칩 빌드 + 이벤트
  buildSchoolChips();
}

// ===== 학교 선택 칩 (그룹별 칩) =====
function buildSchoolChips() {
  const wrap = document.getElementById('schoolChips');
  if (!wrap) return;
  wrap.innerHTML = '';

  // 현재 선택 상태 계산:
  // - selectedSchools가 null이면 전체 선택으로 간주 (모든 학교 active)
  // - 빈 배열 []이면 아무것도 선택 안 됨
  // - 배열에 값이 있으면 해당 학교만 선택됨
  const selSet = (schState.selectedSchools === null)
    ? new Set(LAW_SCHOOLS.map(s => s.name))
    : new Set(schState.selectedSchools);

  // 그룹별로 나누기
  const groups = { '서울': [], '경기/인천': [], '지방': [] };
  LAW_SCHOOLS.forEach(s => {
    const g = s.group || '지방';
    if (!groups[g]) groups[g] = [];
    groups[g].push(s);
  });

  Object.entries(groups).forEach(([gName, gSchools]) => {
    if (gSchools.length === 0) return;
    const groupDiv = document.createElement('div');
    groupDiv.className = 'sch-chip-group';
    groupDiv.setAttribute('data-region', gName);
    groupDiv.innerHTML = `<div class="sch-chip-glabel">${gName}</div><div class="sch-chip-row"></div>`;
    const row = groupDiv.querySelector('.sch-chip-row');
    gSchools.forEach(s => {
      const chip = document.createElement('div');
      chip.className = 'sch-chip';
      if (selSet.has(s.name)) chip.classList.add('active');
      chip.textContent = s.name;
      chip.addEventListener('click', () => {
        // 현재 선택 상태를 정확히 계산
        // null = 전체 선택, [] = 아무것도 선택 안 함, [...] = 해당 항목들만
        const cur = (schState.selectedSchools === null)
          ? new Set(LAW_SCHOOLS.map(x => x.name))
          : new Set(schState.selectedSchools);

        if (cur.has(s.name)) cur.delete(s.name);
        else cur.add(s.name);

        // 전체 선택과 같으면 null 처리 (모든 학교 표시)
        if (cur.size === LAW_SCHOOLS.length) {
          schState.selectedSchools = null;
        } else {
          schState.selectedSchools = [...cur];
        }
        chip.classList.toggle('active');
        saveSchInput(schState);
        renderSchools();
      });
      row.appendChild(chip);
    });
    wrap.appendChild(groupDiv);
  });

  // 빠른 선택 버튼
  const actions = document.getElementById('schoolChipsActions');
  if (actions) {
    actions.innerHTML = `
      <button data-action="all">전체 선택</button>
      <button data-action="seoul">서울권만</button>
      <button data-action="metro">서울/경기·인천</button>
      <button data-action="clear">선택 해제</button>
    `;
    actions.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        if (a === 'all') {
          schState.selectedSchools = null;
        } else if (a === 'clear') {
          schState.selectedSchools = [];
        } else if (a === 'seoul') {
          schState.selectedSchools = LAW_SCHOOLS.filter(s => s.group === '서울').map(s => s.name);
        } else if (a === 'metro') {
          schState.selectedSchools = LAW_SCHOOLS.filter(s => s.group === '서울' || s.group === '경기/인천').map(s => s.name);
        }
        saveSchInput(schState);
        buildSchoolChips();
        renderSchools();
      });
    });
  }
}

// 계산기 탭에서 입력한 LEET 점수와 자동 동기화 (편의)
// 계산기 탭 입력값이 있으면 자동으로 학교별 탭의 LEET 표점 칸도 채워줌
// 단, 학교별 탭에서 직접 입력한 값이 우선
function syncFromCalcTab() {
  // 계산기 탭의 가장 최근 선택된 학년도 결과 활용은 복잡하므로,
  // 사용자가 직접 입력하도록 두는 게 안전함. 별도 동기화 로직은 생략.
}

// ===== 기출 기록에서 LEET 점수 불러오기 =====
function toggleImportLog() {
  const dd = document.getElementById('importLogDropdown');
  if (dd.style.display === 'none') {
    buildImportLogList();
    dd.style.display = 'block';
    // 바깥 클릭 시 닫기
    setTimeout(() => {
      document.addEventListener('click', closeImportLogOutside);
    }, 0);
  } else {
    dd.style.display = 'none';
    document.removeEventListener('click', closeImportLogOutside);
  }
}

function closeImportLogOutside(e) {
  const row = document.getElementById('importLogRow');
  if (!row.contains(e.target)) {
    document.getElementById('importLogDropdown').style.display = 'none';
    document.removeEventListener('click', closeImportLogOutside);
  }
}

function buildImportLogList() {
  const list = document.getElementById('importLogList');
  if (!logEntries || logEntries.length === 0) {
    list.innerHTML = '<div class="import-log-empty">기출 풀이 기록이 없습니다.<br>기출 풀이 기록 탭에서 먼저 점수를 기록하세요.</div>';
    return;
  }

  // 최신순 정렬
  const sorted = [...logEntries].sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  list.innerHTML = sorted.map((entry, idx) => {
    const result = calcForYear(entry.year, entry.eon, entry.chu);
    if (!result || !result.eon || !result.chu) return '';

    const eonStd = result.eon.std !== null ? result.eon.std.toFixed(1) : '—';
    const chuStd = result.chu.std !== null ? result.chu.std.toFixed(1) : '—';
    const eonPct = result.eon.pct !== null && result.eon.pct !== undefined ? result.eon.pct.toFixed(1) : '—';
    const chuPct = result.chu.pct !== null && result.chu.pct !== undefined ? result.chu.pct.toFixed(1) : '—';

    const dateStr = entry.date || '';
    const memo = entry.memo ? ` (${escapeHtml(entry.memo)})` : '';

    return `<div class="import-log-item" onclick="applyLogEntry(${idx})" data-idx="${idx}">
      <span class="ili-year">${entry.year}</span>
      <span class="ili-scores">언어 ${eonStd} / 추리 ${chuStd} · 백분위 ${eonPct} / ${chuPct}${memo}</span>
      <span class="ili-date">${dateStr}</span>
    </div>`;
  }).filter(Boolean).join('');

  if (list.innerHTML === '') {
    list.innerHTML = '<div class="import-log-empty">유효한 점수가 있는 기록이 없습니다.</div>';
  }
}

function applyLogEntry(sortedIdx) {
  const sorted = [...logEntries].sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
  const entry = sorted[sortedIdx];
  if (!entry) return;

  const result = calcForYear(entry.year, entry.eon, entry.chu);
  if (!result || !result.eon || !result.chu) return;

  // 표준점수 적용
  if (result.eon.std !== null) {
    schState.eonStd = parseFloat(result.eon.std.toFixed(1));
    document.getElementById('schEonStd').value = schState.eonStd;
  }
  if (result.chu.std !== null) {
    schState.chuStd = parseFloat(result.chu.std.toFixed(1));
    document.getElementById('schChuStd').value = schState.chuStd;
  }

  // 백분위 적용
  if (result.eon.pct !== null && result.eon.pct !== undefined) {
    schState.eonPct = parseFloat(result.eon.pct.toFixed(1));
    const el = document.getElementById('schEonPct');
    if (el) el.value = schState.eonPct;
  }
  if (result.chu.pct !== null && result.chu.pct !== undefined) {
    schState.chuPct = parseFloat(result.chu.pct.toFixed(1));
    const el = document.getElementById('schChuPct');
    if (el) el.value = schState.chuPct;
  }

  // 저장 + 렌더링
  saveSchInput(schState);
  renderSchools();

  // 드롭다운 닫기
  document.getElementById('importLogDropdown').style.display = 'none';
  document.removeEventListener('click', closeImportLogOutside);

  // 적용 완료 표시
  const btn = document.getElementById('importLogBtn');
  const badge = document.createElement('span');
  badge.className = 'import-log-applied';
  badge.textContent = `${entry.year}학년도 적용됨`;
  const oldBadge = btn.parentElement.querySelector('.import-log-applied');
  if (oldBadge) oldBadge.remove();
  btn.after(badge);
  setTimeout(() => badge.remove(), 3000);
}

restoreSchInputs();
attachSchoolEvents();
renderSchools();

// ===========================================================================
// 기출 풀이 기록 기능
// ===========================================================================
const LOG_STORAGE_KEY = 'leet_log_v1';

function loadLog() {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

function saveLog(entries) {
  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {}
}

let logEntries = loadLog();
let logChartInstance = null;

// 학년도 셀렉트 채우기
function buildLogYearSelect() {
  const sel = document.getElementById('logYear');
  const years = Object.keys(LEET).map(Number).sort((a,b) => b-a);  // 최신 연도부터
  sel.innerHTML = years.map(y => `<option value="${y}">${y}학년도 (제${y - 2008}회)</option>`).join('');
  sel.value = years[0];  // 기본값: 가장 최근 연도
  updateLogMaxLabels();
}

function updateLogMaxLabels() {
  const y = parseInt(document.getElementById('logYear').value);
  const d = LEET[y];
  if (!d) return;
  document.getElementById('logEonMax').textContent = `/ ${d.items_eon}`;
  document.getElementById('logChuMax').textContent = `/ ${d.items_chu}`;
  document.getElementById('logEon').max = d.items_eon;
  document.getElementById('logChu').max = d.items_chu;
}

// 미리보기 업데이트
function updateLogPreview() {
  const y = parseInt(document.getElementById('logYear').value);
  const eonV = document.getElementById('logEon').value;
  const chuV = document.getElementById('logChu').value;
  const eonRaw = (eonV === '' || isNaN(parseInt(eonV))) ? null : parseInt(eonV);
  const chuRaw = (chuV === '' || isNaN(parseInt(chuV))) ? null : parseInt(chuV);

  const preview = document.getElementById('logPreview');
  if (eonRaw === null && chuRaw === null) {
    preview.style.display = 'none';
    return;
  }
  preview.style.display = 'block';

  const eonResult = eonRaw !== null ? getStdScore(y, 'eon', eonRaw) : null;
  const chuResult = chuRaw !== null ? getStdScore(y, 'chu', chuRaw) : null;
  document.getElementById('prevEon').textContent = eonResult ? eonResult.std.toFixed(1) : '—';
  document.getElementById('prevChu').textContent = chuResult ? chuResult.std.toFixed(1) : '—';
  if (eonResult && chuResult) {
    document.getElementById('prevTotal').textContent = (eonResult.std + chuResult.std).toFixed(1);
  } else {
    document.getElementById('prevTotal').textContent = '—';
  }
}

// 기록 추가 — boolean 반환 (true=저장됨, false=저장 안 됨)
let _addingLog = false;
async function addLogEntry() {
  if (_addingLog) return false;  // 이전 추가가 진행 중이면 무시

  // 검증을 잠금 설정 앞에서 수행 (검증 실패가 잠금에 영향 없도록)
  const y = parseInt(document.getElementById('logYear').value);
  const date = document.getElementById('logDate').value;
  const eonV = document.getElementById('logEon').value;
  const chuV = document.getElementById('logChu').value;
  const memo = document.getElementById('logMemo').value.trim();

  if (!date) { showFieldError('logDate', '날짜를 입력해주세요.'); return false; }
  const eonRaw = (eonV === '' || isNaN(parseInt(eonV))) ? null : parseInt(eonV);
  const chuRaw = (chuV === '' || isNaN(parseInt(chuV))) ? null : parseInt(chuV);
  if (eonRaw === null && chuRaw === null) {
    toast('언어 또는 추리 점수 중 하나는 입력해주세요.', { type: 'warning' });
    document.getElementById('logEon')?.focus();
    return false;
  }

  // 잠금 + 버튼 상태 변경 (반드시 try/finally로 보장)
  _addingLog = true;
  const addBtn = document.getElementById('logAdd');
  if (addBtn) {
    addBtn.disabled = true;
    addBtn.textContent = '저장 중…';
  }

  let saved = false;
  try {
    if (currentUser) {
      // 클라우드 모드
      const cloud = await pushCloudLog({ year: y, date, eon: eonRaw, chu: chuRaw, memo });
      if (cloud) {
        logEntries.push({
          id: cloud.id,
          year: cloud.year,
          date: cloud.date,
          eon: cloud.eon,
          chu: cloud.chu,
          memo: cloud.memo || '',
          createdAt: cloud.created_at,
        });
        saved = true;
      } else {
        // 클라우드 저장 실패 — 입력값 보존
        toast('저장 실패. 잠시 후 다시 시도해주세요.', { type: 'error' });
      }
    } else {
      // 게스트 모드 (localStorage)
      const entry = {
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        year: y,
        date: date,
        eon: eonRaw,
        chu: chuRaw,
        memo: memo,
        createdAt: new Date().toISOString(),
      };
      logEntries.push(entry);
      saveLog(logEntries);
      saved = true;
    }

    if (saved) {
      // 성공 시에만 입력 초기화
      document.getElementById('logEon').value = '';
      document.getElementById('logChu').value = '';
      document.getElementById('logMemo').value = '';
      document.getElementById('logPreview').style.display = 'none';
      renderLog();
    }
  } catch (e) {
    console.error('addLogEntry error:', e);
    toast('저장 중 오류가 발생했습니다.', { type: 'error' });
  } finally {
    if (addBtn) {
      addBtn.disabled = false;
      addBtn.textContent = '기록 추가';
    }
    _addingLog = false;
  }
  return saved;
}

// 기록 삭제
async function deleteLogEntry(id) {
  const ok = await confirmAsync('이 기록을 삭제할까요?', {
    title: '기록 삭제',
    okLabel: '삭제',
    danger: true,
  });
  if (!ok) return;
  if (currentUser) {
    const ok = await deleteCloudLog(id);
    if (!ok) return;
  } else {
    saveLog(logEntries.filter(e => e.id !== id));
  }
  logEntries = logEntries.filter(e => e.id !== id);
  renderLog();
}

function renderLog() {
  const list = document.getElementById('logList');
  const stats = document.getElementById('logStats');
  const chartCard = document.getElementById('logChartCard');

  if (logEntries.length === 0) {
    list.innerHTML = `<div class="empty-state" style="padding: 40px 20px;">
      아직 기록이 없습니다.<br>위쪽에서 첫 기출 풀이 기록을 추가해보세요.
    </div>`;
    stats.style.display = 'none';
    chartCard.style.display = 'none';
    return;
  }

  // 각 기록 환산 결과 계산
  const enriched = logEntries.map(e => {
    const eon = e.eon !== null ? getStdScore(e.year, 'eon', e.eon) : null;
    const chu = e.chu !== null ? getStdScore(e.year, 'chu', e.chu) : null;
    const total = (eon && chu) ? eon.std + chu.std : null;
    return { ...e, eonStd: eon?.std ?? null, chuStd: chu?.std ?? null, total };
  });

  // 통계
  const validTotals = enriched.filter(e => e.total !== null).map(e => e.total);
  const sortedByDate = [...enriched].sort((a,b) => a.date.localeCompare(b.date));
  const recent = sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1] : null;

  if (validTotals.length > 0) {
    stats.style.display = 'grid';
    document.getElementById('statCount').textContent = enriched.length;
    document.getElementById('statAvg').textContent = (validTotals.reduce((a,b) => a+b, 0) / validTotals.length).toFixed(1);
    document.getElementById('statMax').textContent = Math.max(...validTotals).toFixed(1);
    document.getElementById('statRecent').textContent = recent.total !== null ? recent.total.toFixed(1) : '—';
  } else {
    stats.style.display = 'none';
  }

  // 그래프
  if (validTotals.length >= 2) {
    chartCard.style.display = 'block';
    renderLogChart(sortedByDate);
  } else {
    chartCard.style.display = 'none';
  }

  // 목록 (최신 날짜부터)
  const sortedByDateDesc = [...enriched].sort((a,b) => b.date.localeCompare(a.date));
  list.innerHTML = sortedByDateDesc.map(e => {
    const dateFormatted = e.date.replace(/-/g, '.');
    const eonText = e.eon !== null ? `언어 ${e.eon}→${e.eonStd !== null ? e.eonStd.toFixed(1) : '—'}` : '';
    const chuText = e.chu !== null ? `추리 ${e.chu}→${e.chuStd !== null ? e.chuStd.toFixed(1) : '—'}` : '';
    const detailParts = [eonText, chuText].filter(s => s).join(' · ');
    const memoHtml = e.memo ? `<div class="e-memo">"${escapeHtml(e.memo)}"</div>` : '';
    const totalText = e.total !== null ? e.total.toFixed(1) : '—';
    return `
      <div class="log-entry">
        <div class="e-date">${dateFormatted}</div>
        <div class="e-info">
          <div class="e-year">${e.year}학년도 기출</div>
          <div class="e-detail">${detailParts}</div>
          ${memoHtml}
        </div>
        <div class="e-scores">
          <div class="e-total">${totalText}</div>
          <div class="e-sub">표점 합계</div>
        </div>
        <button class="e-delete" onclick="deleteLogEntry('${e.id}')" title="삭제">×</button>
      </div>`;
  }).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderLogChart(sortedByDate) {
  const ctx = document.getElementById('logChart').getContext('2d');
  if (logChartInstance) logChartInstance.destroy();

  const valid = sortedByDate.filter(e => e.total !== null);
  if (valid.length === 0) return;

  const labels = valid.map(e => e.date.slice(5).replace('-', '/') + ` (${e.year})`);
  const data = valid.map(e => e.total);
  const eonStds = valid.map(e => e.eonStd);
  const chuStds = valid.map(e => e.chuStd);
  const memos = valid.map(e => e.memo);

  // y축 범위 동적 계산
  const dataMin = Math.min(...data);
  const dataMax = Math.max(...data);
  const range = dataMax - dataMin;
  const padTop = Math.max(range * 0.25, 4);
  const padBottom = Math.max(range * 0.15, 2);
  const yMin = Math.floor((dataMin - padBottom) * 2) / 2;
  const yMax = Math.ceil((dataMax + padTop) * 2) / 2;

  logChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '표점 합계',
        data,
        borderColor: '#1A56DB',
        backgroundColor: 'rgba(26, 86, 219, 0.08)',
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 9,
        pointBackgroundColor: '#1A56DB',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 36, right: 32, bottom: 12, left: 24 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17,17,17,0.95)',
          titleFont: { family: 'JetBrains Mono, monospace', size: 13, weight: 'bold' },
          bodyFont: { family: 'Pretendard, -apple-system, sans-serif', size: 12 },
          padding: 14,
          displayColors: false,
          callbacks: {
            label: ctx => {
              const i = ctx.dataIndex;
              const lines = ['합계: ' + data[i].toFixed(1)];
              if (eonStds[i] !== null) lines.push('  언어이해: ' + eonStds[i].toFixed(1));
              if (chuStds[i] !== null) lines.push('  추리논증: ' + chuStds[i].toFixed(1));
              if (memos[i]) lines.push('  메모: ' + memos[i]);
              return lines;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          min: yMin,
          max: yMax,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { family: 'JetBrains Mono, monospace', size: 11 }, color: '#71717A' },
          title: { display: true, text: '표준점수 합계', font: { family: 'Pretendard, -apple-system, sans-serif', size: 11, weight: '500' }, color: '#27272A' },
        },
        x: {
          grid: { display: false },
          offset: true,
          ticks: { font: { family: 'JetBrains Mono, monospace', size: 11 }, color: '#18181B', maxRotation: 45, minRotation: 0 },
        },
      },
    },
    plugins: [{
      id: 'pointLabels',
      afterDatasetsDraw(chart) {
        const { ctx, chartArea } = chart;
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);
        ctx.save();
        ctx.font = "600 11px JetBrains Mono, monospace";
        ctx.fillStyle = '#111111';
        ctx.textBaseline = 'middle';
        meta.data.forEach((point, i) => {
          const v = dataset.data[i];
          if (v === null || isNaN(v)) return;
          const text = v.toFixed(1);
          const textWidth = ctx.measureText(text).width;

          let labelY = point.y - 16;
          if (labelY - 6 < chartArea.top) {
            labelY = point.y + 16;
          }

          let labelX = point.x;
          let textAlign = 'center';
          if (point.x - textWidth/2 < chartArea.left + 2) {
            textAlign = 'left';
          } else if (point.x + textWidth/2 > chartArea.right - 2) {
            textAlign = 'right';
          }
          ctx.textAlign = textAlign;

          ctx.strokeStyle = 'rgba(255,255,255,0.9)';
          ctx.lineWidth = 3;
          ctx.strokeText(text, labelX, labelY);
          ctx.fillText(text, labelX, labelY);
        });
        ctx.restore();
      },
    }],
  });
}

// 기록 탭 이벤트 연결
buildLogYearSelect();
// 오늘 날짜 기본값
document.getElementById('logDate').valueAsDate = new Date();

document.getElementById('logYear').addEventListener('change', () => {
  updateLogMaxLabels();
  updateLogPreview();
});
document.getElementById('logEon').addEventListener('input', updateLogPreview);
document.getElementById('logChu').addEventListener('input', updateLogPreview);
document.getElementById('logAdd').addEventListener('click', addLogEntry);

// ===========================================================================
// 문항별 채점 모드
// ===========================================================================
// qgState[year-date] = { eon: { 1: 'correct'|'incorrect', ... }, chu: {...}, memo, bulkEon, bulkChu }
let qgState = {};

function qgStorageKey() {
  return 'leet_qgrade_v1';
}
function loadQgState() {
  try {
    const raw = localStorage.getItem(qgStorageKey());
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveQgState() {
  try { localStorage.setItem(qgStorageKey(), JSON.stringify(qgState)); } catch {}
}

function qgSessionKey() {
  const y = document.getElementById('qgYear').value;
  const d = document.getElementById('qgDate').value;
  return `${y}_${d}`;
}

function qgGetSession() {
  const key = qgSessionKey();
  if (!qgState[key]) {
    qgState[key] = { eon: {}, chu: {}, memo: '' };
  }
  return qgState[key];
}

// 모드 토글
document.querySelectorAll('[data-grade-mode]').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.gradeMode;
    document.querySelectorAll('[data-grade-mode]').forEach(b => b.classList.toggle('active', b === btn));
    document.getElementById('modeTotal').style.display = (mode === 'total') ? '' : 'none';
    document.getElementById('modePerQuestion').style.display = (mode === 'per-question') ? '' : 'none';
    if (mode === 'per-question') {
      qgInit();
    }
  });
});

function qgInit() {
  // 학년도 선택 채우기
  const sel = document.getElementById('qgYear');
  if (!sel.options.length) {
    Object.keys(LEET).map(Number).sort((a,b) => b-a).forEach(y => {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y + '학년도';
      sel.appendChild(opt);
    });
    sel.value = '2026';
    document.getElementById('qgDate').value = new Date().toISOString().slice(0, 10);
  }
  qgState = loadQgState();
  qgRender();
  qgBulkInit();
}

// ===========================================================================
// 일괄 정답 입력 시스템
// ===========================================================================
// 사용자가 자기 답안을 텍스트로 한 번에 입력 → 메타데이터의 정답과 비교 → O/X 자동 채점

// 다양한 구분자(공백/쉼표/줄바꿈/점/슬래시 등)로 답안 파싱
// 0, -, _, x, ?, . → 미응답으로 처리
function qgParseAnswers(text) {
  if (!text) return [];
  // 한 글자 단위로 토큰 추출: 1-5는 답, 0/-/_/x/?/. 은 미응답, 그 외 글자는 무시
  const result = [];
  for (const ch of text) {
    if (ch >= '1' && ch <= '5') {
      result.push(parseInt(ch));
    } else if (ch === '0' || ch === '-' || ch === '_' || ch === 'x' || ch === 'X' || ch === '?' || ch === '.') {
      result.push(null);
    }
    // 그 외(공백, 쉼표, 줄바꿈, 한글 등)는 구분자로 취급, 무시
  }
  return result;
}

// 텍스트 → 채점 결과 적용
function qgApplyBulk(sec, text) {
  const year = parseInt(document.getElementById('qgYear').value);
  const yearData = LEET[year];
  if (!yearData) return { ok: false, msg: '학년도 데이터 없음' };
  const max = sec === 'eon' ? yearData.items_eon : yearData.items_chu;

  const meta = LEET_META[year] && LEET_META[year][sec];
  if (!meta || meta.length === 0) {
    return { ok: false, msg: `${year}학년도 ${sec === 'eon' ? '언어' : '추리'} 메타데이터(정답)가 입력되어 있지 않습니다. 셀 클릭 채점을 사용하세요.` };
  }

  const userAnswers = qgParseAnswers(text);

  const session = qgGetSession();
  // 일괄 입력 텍스트도 세션에 저장 (모드 전환 시 보존)
  if (!session.bulk) session.bulk = {};
  session.bulk[sec] = text;

  // 기존 채점 클리어 (이 영역만)
  session[sec] = {};

  let correct = 0, incorrect = 0, blank = 0, missing = 0;
  for (let n = 1; n <= max; n++) {
    const userAns = userAnswers[n - 1]; // 0-indexed
    if (userAns === undefined || userAns === null) {
      blank++;
      continue;
    }
    const metaItem = meta.find(q => q.no === n);
    if (!metaItem || metaItem.answer == null) {
      missing++; // 메타데이터의 정답이 없는 문항
      continue;
    }
    if (userAns === metaItem.answer) {
      session[sec][n] = 'correct';
      correct++;
    } else {
      session[sec][n] = 'incorrect';
      incorrect++;
    }
  }

  saveQgState();
  return { ok: true, correct, incorrect, blank, missing, total: max, parsed: userAnswers.length };
}

let qgBulkDebounce = null;

function qgBulkInit() {
  ['eon', 'chu'].forEach(sec => {
    const input = document.getElementById('qgBulk' + (sec === 'eon' ? 'Eon' : 'Chu'));
    const clearBtn = document.getElementById('qgBulk' + (sec === 'eon' ? 'Eon' : 'Chu') + 'Clear');

    if (input && !input._bound) {
      input.addEventListener('input', () => {
        qgBulkUpdateCount(sec);
        // 디바운스: 입력 중에는 500ms 후 채점
        clearTimeout(qgBulkDebounce);
        qgBulkDebounce = setTimeout(() => {
          qgBulkApplyAll();
        }, 400);
      });
      input._bound = true;
    }
    if (clearBtn && !clearBtn._bound) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        const session = qgGetSession();
        if (session.bulk) delete session.bulk[sec];
        session[sec] = {};
        saveQgState();
        qgBulkUpdateCount(sec);
        qgBulkApplyAll();
        qgRender();
      });
      clearBtn._bound = true;
    }
  });

  // 모드 토글 버튼
  document.querySelectorAll('[data-qg-mode]').forEach(btn => {
    if (btn._bound) return;
    btn.addEventListener('click', () => {
      const mode = btn.dataset.qgMode;
      document.querySelectorAll('[data-qg-mode]').forEach(b => b.classList.toggle('active', b === btn));
      document.getElementById('qgModeBulk').style.display = (mode === 'bulk') ? '' : 'none';
      document.getElementById('qgModeClick').style.display = (mode === 'click') ? '' : 'none';
      // 모드 전환 시 데이터 동기화
      if (mode === 'click') {
        qgRender();
      } else {
        qgBulkSyncFromSession();
      }
    });
    btn._bound = true;
  });

  // 처음 렌더 시 세션에서 텍스트 복원
  qgBulkSyncFromSession();
}

// 세션에 저장된 일괄 입력 텍스트를 textarea에 복원
function qgBulkSyncFromSession() {
  const session = qgGetSession();
  ['eon', 'chu'].forEach(sec => {
    const input = document.getElementById('qgBulk' + (sec === 'eon' ? 'Eon' : 'Chu'));
    if (!input) return;
    const saved = session.bulk && session.bulk[sec];
    input.value = saved || '';
    qgBulkUpdateCount(sec);
  });
  qgBulkApplyAll(true /* silent */);
}

function qgBulkUpdateCount(sec) {
  const input = document.getElementById('qgBulk' + (sec === 'eon' ? 'Eon' : 'Chu'));
  const cntEl = document.getElementById('qgBulk' + (sec === 'eon' ? 'Eon' : 'Chu') + 'Cnt');
  if (!input || !cntEl) return;
  const year = parseInt(document.getElementById('qgYear').value);
  const yearData = LEET[year];
  if (!yearData) return;
  const max = sec === 'eon' ? yearData.items_eon : yearData.items_chu;
  const parsed = qgParseAnswers(input.value);
  const filled = parsed.filter(x => x !== null && x !== undefined).length;
  cntEl.textContent = `${filled}/${max}`;
  cntEl.classList.toggle('complete', filled === max);
  cntEl.classList.toggle('over', parsed.length > max);
}

function qgBulkApplyAll(silent) {
  const eonInput = document.getElementById('qgBulkEon');
  const chuInput = document.getElementById('qgBulkChu');
  if (!eonInput || !chuInput) return;

  const eonResult = qgApplyBulk('eon', eonInput.value);
  const chuResult = qgApplyBulk('chu', chuInput.value);

  const resultBox = document.getElementById('qgBulkResult');
  const resultText = document.getElementById('qgBulkResultText');

  // 둘 다 비어있으면 결과 박스 숨김
  if ((!eonInput.value.trim() && !chuInput.value.trim()) || (!eonResult.ok && !chuResult.ok)) {
    if (resultBox) resultBox.style.display = 'none';
  } else {
    if (resultBox && resultText) {
      const parts = [];
      let hasError = false;
      if (eonInput.value.trim()) {
        if (eonResult.ok) {
          parts.push(`언어 ${eonResult.correct}/${eonResult.total - eonResult.blank}`);
        } else {
          parts.push(`언어: ${eonResult.msg}`);
          hasError = true;
        }
      }
      if (chuInput.value.trim()) {
        if (chuResult.ok) {
          parts.push(`추리 ${chuResult.correct}/${chuResult.total - chuResult.blank}`);
        } else {
          parts.push(`추리: ${chuResult.msg}`);
          hasError = true;
        }
      }
      // 종합
      if (eonResult.ok && chuResult.ok && (eonInput.value.trim() || chuInput.value.trim())) {
        const totalCorrect = eonResult.correct + chuResult.correct;
        const totalGraded = (eonResult.total - eonResult.blank) + (chuResult.total - chuResult.blank);
        if (totalGraded > 0) {
          const pct = (totalCorrect / totalGraded * 100).toFixed(1);
          parts.push(`전체 ${totalCorrect}/${totalGraded} (${pct}%)`);
        }
      }
      resultText.textContent = parts.join(' · ');
      resultBox.style.display = parts.length > 0 ? '' : 'none';
      resultBox.classList.toggle('has-error', hasError);
    }
  }

  // 그리드/통계 다시 그리기
  if (!silent) {
    qgUpdateScores();
    qgRenderStats();
    // 클릭 모드 그리드도 동기화 (사용자가 모드 전환했을 때 즉시 반영)
    const clickPane = document.getElementById('qgModeClick');
    if (clickPane && clickPane.style.display !== 'none') {
      qgRender();
    }
  }
}

function qgRender() {
  const year = parseInt(document.getElementById('qgYear').value);
  const yearData = LEET[year];
  if (!yearData) return;

  const session = qgGetSession();
  document.getElementById('qgMemo').value = session.memo || '';

  ['eon', 'chu'].forEach(sec => {
    const count = sec === 'eon' ? yearData.items_eon : yearData.items_chu;
    const grid = document.getElementById('qgGrid' + (sec === 'eon' ? 'Eon' : 'Chu'));
    grid.innerHTML = '';
    for (let n = 1; n <= count; n++) {
      const cell = document.createElement('div');
      cell.className = 'qg-cell';
      const status = session[sec][n];
      if (status) cell.classList.add(status);

      const meta = getMeta(year, sec, n);
      const catColor = meta && meta.category && LEET_TAXONOMY[sec].categories[meta.category]
        ? LEET_TAXONOMY[sec].categories[meta.category].color
        : null;

      let tooltipText = `${n}번`;
      if (meta) {
        if (meta.category) {
          const catName = LEET_TAXONOMY[sec].categories[meta.category]?.name || meta.category;
          tooltipText += ` · ${catName}`;
        }
        if (meta.difficulty) tooltipText += ` · ${meta.difficulty}`;
      }

      cell.innerHTML = `
        <div class="qg-num">${n}</div>
        <div class="qg-mark">${status === 'correct' ? 'O' : status === 'incorrect' ? 'X' : ''}</div>
        ${catColor ? `<div class="qg-cat-bar" style="background:${catColor};"></div>` : ''}
        <div class="qg-tooltip">${tooltipText}</div>
      `;
      cell.addEventListener('click', () => qgToggle(sec, n));
      grid.appendChild(cell);
    }
  });

  qgUpdateScores();
  qgRenderStats();
}

function qgToggle(sec, n) {
  const session = qgGetSession();
  const cur = session[sec][n];
  // 미채점 → correct → incorrect → 미채점
  let next;
  if (!cur) next = 'correct';
  else if (cur === 'correct') next = 'incorrect';
  else next = null;

  if (next === null) delete session[sec][n];
  else session[sec][n] = next;

  saveQgState();
  qgRender();
}

function qgUpdateScores() {
  const year = parseInt(document.getElementById('qgYear').value);
  const yearData = LEET[year];
  const session = qgGetSession();
  ['eon', 'chu'].forEach(sec => {
    const total = sec === 'eon' ? yearData.items_eon : yearData.items_chu;
    const correct = Object.values(session[sec]).filter(v => v === 'correct').length;
    const elId = 'qg' + (sec === 'eon' ? 'Eon' : 'Chu') + 'Score';
    document.getElementById(elId).textContent = `${correct} / ${total}`;
  });
}

document.getElementById('qgYear').addEventListener('change', () => {
  qgRender();
  qgBulkSyncFromSession();
});
document.getElementById('qgDate').addEventListener('change', () => {
  qgRender();
  qgBulkSyncFromSession();
});
document.getElementById('qgMemo').addEventListener('input', () => {
  const session = qgGetSession();
  session.memo = document.getElementById('qgMemo').value;
  saveQgState();
});

document.getElementById('qgReset').addEventListener('click', async () => {
  const ok = await confirmAsync('이 회차의 모든 채점을 초기화하시겠습니까?', {
    title: '채점 초기화',
    okLabel: '초기화',
    danger: true,
  });
  if (!ok) return;
  const key = qgSessionKey();
  delete qgState[key];
  saveQgState();
  qgRender();
  qgBulkSyncFromSession();
});

document.getElementById('qgSave').addEventListener('click', async () => {
  const qgSaveBtn = document.getElementById('qgSave');
  if (qgSaveBtn.disabled) return;  // 중복 클릭 방지

  const year = parseInt(document.getElementById('qgYear').value);
  const date = document.getElementById('qgDate').value;
  if (!date) { showFieldError('qgDate', '풀이 날짜를 입력해주세요.'); return; }
  const session = qgGetSession();
  const yearData = LEET[year];
  const eonCorrect = Object.values(session.eon).filter(v => v === 'correct').length;
  const chuCorrect = Object.values(session.chu).filter(v => v === 'correct').length;
  if (eonCorrect === 0 && chuCorrect === 0) {
    toast('정답으로 표시된 문항이 없습니다.', { type: 'warning' });
    return;
  }
  // 기존 logEntries 형식으로 저장
  document.getElementById('logYear').value = year;
  document.getElementById('logDate').value = date;
  document.getElementById('logEon').value = eonCorrect;
  document.getElementById('logChu').value = chuCorrect;
  document.getElementById('logMemo').value = session.memo || '';

  // qgSave 버튼도 잠금 (중복 클릭 시 토스트 스팸 방지)
  const originalText = qgSaveBtn.textContent;
  qgSaveBtn.disabled = true;
  qgSaveBtn.textContent = '저장 중…';
  try {
    const saved = await addLogEntry();
    if (saved) {
      toast(`저장 완료 · 언어 ${eonCorrect}/${yearData.items_eon}, 추리 ${chuCorrect}/${yearData.items_chu}`, { type: 'success', duration: 4000 });
    }
  } finally {
    qgSaveBtn.disabled = false;
    qgSaveBtn.textContent = originalText;
  }
});

// 카테고리별 통계 렌더
function qgRenderStats() {
  const year = parseInt(document.getElementById('qgYear').value);
  const session = qgGetSession();
  const statsSection = document.getElementById('qstatsSection');
  const grid = document.getElementById('qstatsGrid');
  const summary = document.getElementById('qstatsSummary');

  // 메타데이터 있는지 확인
  const hasMeta = LEET_META[year] && (LEET_META[year].eon || LEET_META[year].chu);
  if (!hasMeta) {
    statsSection.style.display = 'block';
    summary.textContent = '';
    grid.innerHTML = `<div class="qstats-empty" style="grid-column:1/-1;">${year}학년도 메타데이터가 아직 입력되지 않았습니다.<br>관리자 모드(URL에 ?admin=1)에서 정답·카테고리·난이도를 입력하면 약점 분석이 활성화됩니다.</div>`;
    return;
  }

  // 채점 결과 있는지 확인
  const totalGraded = Object.keys(session.eon).length + Object.keys(session.chu).length;
  if (totalGraded === 0) {
    statsSection.style.display = 'block';
    summary.textContent = '';
    grid.innerHTML = `<div class="qstats-empty" style="grid-column:1/-1;">위에서 문항을 채점하면 카테고리·난이도별 정답률이 표시됩니다.</div>`;
    return;
  }

  statsSection.style.display = 'block';

  // 가중치 약점 진단 호출
  const wk = computeWeakness(year, session);

  // ===== TOP 3 약점 카드 =====
  const sortedCats = Object.values(wk.categories)
    .filter(c => c.total >= 2) // 최소 2문항 이상 채점된 카테고리만
    .sort((a, b) => b.weaknessScore - a.weaknessScore);

  const top3 = sortedCats.slice(0, 3).filter(c => c.weaknessScore > 0.05);

  let weaknessCardHtml = '';
  if (top3.length > 0) {
    weaknessCardHtml = `
      <div class="weakness-card" style="grid-column:1/-1;">
        <div class="weakness-card-header">
          <span class="weakness-card-icon"></span>
          <span class="weakness-card-title">집중 학습이 필요한 영역 TOP ${top3.length}</span>
        </div>
        <div class="weakness-list">
          ${top3.map((c, i) => {
            const sectionName = c.sec === 'eon' ? '언어' : '추리';
            const actualPct = (c.actualRate * 100).toFixed(0);
            const expectedPct = c.expectedRate !== null ? (c.expectedRate * 100).toFixed(0) : null;
            let detailText = `정답률 ${actualPct}%`;
            if (expectedPct !== null) {
              const gap = Math.round((c.actualRate - c.expectedRate) * 100);
              detailText += ` (예상 ${expectedPct}%, ${gap >= 0 ? '+' : ''}${gap}%p)`;
            }
            detailText += ` · ${c.correct}/${c.total}문항`;
            return `<div class="weakness-item">
              <div class="weakness-rank">${String(i + 1).padStart(2, '0')}</div>
              <div>
                <div class="weakness-name">${sectionName} · ${c.name}</div>
                <div class="weakness-detail">${detailText}</div>
              </div>
              <div style="font-size:10px;color:var(--ink-on-dark-mute);text-align:right;letter-spacing:0.04em;text-transform:uppercase;font-weight:600;">
                약점 점수<br>
                <span style="font-family:var(--font-mono);font-weight:600;color:var(--accent-on-dark);font-size:18px;letter-spacing:-0.02em;">${(c.weaknessScore * 100).toFixed(0)}</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ===== 카테고리별 막대그래프 (예상 정답률 점선 포함) =====
  const blocks = ['eon', 'chu'].map(sec => {
    const cats = Object.values(wk.categories).filter(c => c.sec === sec);
    if (cats.length === 0) return null;
    cats.sort((a, b) => b.weaknessScore - a.weaknessScore);

    const rows = cats.map(c => {
      const actualPct = c.actualRate * 100;
      const expectedPct = c.expectedRate !== null ? c.expectedRate * 100 : null;
      const cls = actualPct >= 70 ? 'high' : (actualPct >= 50 ? 'med' : 'low');
      const expectedMarker = expectedPct !== null
        ? `<div class="qs-bar-expected" style="left:${expectedPct}%;" title="예상 ${expectedPct.toFixed(0)}%"></div>`
        : '';
      let gapHtml = '';
      if (c.gap !== null) {
        const gapPct = Math.round(c.gap * 100);
        const gapCls = gapPct >= 0 ? 'qs-gap-positive' : 'qs-gap-negative';
        gapHtml = `<span class="${gapCls}">(${gapPct >= 0 ? '+' : ''}${gapPct})</span> `;
      }
      return `<div class="qstats-row">
        <span class="qs-label">${c.name}</span>
        <div class="qs-bar qs-bar-overlay">
          <div class="qs-fill ${cls}" style="width:${actualPct}%;background:${c.color};"></div>
          ${expectedMarker}
        </div>
        <span class="qs-pct">${gapHtml}${(c.correct).toFixed(c.correct % 1 === 0 ? 0 : 1)}/${c.total}</span>
      </div>`;
    }).join('');

    return `<div>
      <div class="qstats-block-title">${LEET_TAXONOMY[sec].name} 유형별 <span style="font-size:10px;font-weight:400;color:var(--ink-muted,#6b6256);">· 점선=예상 정답률</span></div>
      ${rows}
    </div>`;
  }).filter(b => b !== null);

  // ===== 난이도별 (예상 대비) =====
  const diffOrder = ['하', '중하', '중', '중상', '상'];
  const diffRows = diffOrder.filter(d => wk.byDifficulty[d]).map(d => {
    const s = wk.byDifficulty[d];
    const actualPct = s.total > 0 ? (s.correct / s.total * 100) : 0;
    const expectedPct = s.expected * 100;
    const color = DIFFICULTY_LEVELS[d].color;
    const gap = Math.round(actualPct - expectedPct);
    const gapCls = gap >= 0 ? 'qs-gap-positive' : 'qs-gap-negative';
    return `<div class="qstats-row">
      <span class="qs-label">${d}</span>
      <div class="qs-bar qs-bar-overlay">
        <div class="qs-fill" style="width:${actualPct}%;background:${color};"></div>
        <div class="qs-bar-expected" style="left:${expectedPct}%;" title="예상 ${expectedPct.toFixed(0)}%"></div>
      </div>
      <span class="qs-pct"><span class="${gapCls}">(${gap >= 0 ? '+' : ''}${gap})</span> ${(s.correct).toFixed(s.correct % 1 === 0 ? 0 : 1)}/${s.total}</span>
    </div>`;
  }).join('');

  if (diffRows) {
    blocks.push(`<div>
      <div class="qstats-block-title">난이도별 <span style="font-size:10px;font-weight:400;color:var(--ink-muted,#6b6256);">· 점선=예상 정답률</span></div>
      ${diffRows}
    </div>`);
  }

  // ===== 영역별 종합 =====
  const sectionRows = ['eon', 'chu'].filter(s => wk.sections[s]).map(s => {
    const sec = wk.sections[s];
    const actualPct = sec.total > 0 ? sec.correct / sec.total * 100 : 0;
    const expectedPct = sec.expectedCount > 0 ? sec.expectedSum / sec.expectedCount * 100 : null;
    const cls = actualPct >= 70 ? 'high' : (actualPct >= 50 ? 'med' : 'low');
    const expectedMarker = expectedPct !== null
      ? `<div class="qs-bar-expected" style="left:${expectedPct}%;" title="예상 ${expectedPct.toFixed(0)}%"></div>`
      : '';
    let gapHtml = '';
    if (expectedPct !== null) {
      const gap = Math.round(actualPct - expectedPct);
      const gapCls = gap >= 0 ? 'qs-gap-positive' : 'qs-gap-negative';
      gapHtml = `<span class="${gapCls}">(${gap >= 0 ? '+' : ''}${gap})</span> `;
    }
    return `<div class="qstats-row">
      <span class="qs-label">${LEET_TAXONOMY[s].name}</span>
      <div class="qs-bar qs-bar-overlay">
        <div class="qs-fill ${cls}" style="width:${actualPct}%;background:#7a7166;"></div>
        ${expectedMarker}
      </div>
      <span class="qs-pct">${gapHtml}${(sec.correct).toFixed(sec.correct % 1 === 0 ? 0 : 1)}/${sec.total}</span>
    </div>`;
  }).join('');

  if (sectionRows) {
    blocks.unshift(`<div>
      <div class="qstats-block-title">영역별 종합 <span style="font-size:10px;font-weight:400;color:var(--ink-muted,#6b6256);">· 점선=예상 정답률</span></div>
      ${sectionRows}
    </div>`);
  }

  if (blocks.length === 0 && !weaknessCardHtml) {
    grid.innerHTML = `<div class="qstats-empty" style="grid-column:1/-1;">채점된 문항에 분류 정보가 없습니다.</div>`;
  } else {
    grid.innerHTML = weaknessCardHtml + blocks.join('');
  }

  // 요약: 전체 정답률
  const allCorrect = Object.values(session.eon).filter(v => v === 'correct').length
                  + Object.values(session.chu).filter(v => v === 'correct').length;
  const allGraded = Object.keys(session.eon).length + Object.keys(session.chu).length;
  if (allGraded > 0) {
    summary.textContent = `채점 ${allGraded}문항 중 정답 ${allCorrect}개 (${(allCorrect/allGraded*100).toFixed(1)}%)`;
  }
}

// 전역 노출 (onclick 핸들러용)
window.deleteLogEntry = deleteLogEntry;


// ===========================================================================
// 가중치 약점 진단
// ===========================================================================
// 핵심 공식:
// - "치명도 점수" = 오답률 × 예상정답률
//   쉬운 문제(예상 90%) 자주 틀림(60%) = 0.54 (높음, 치명적)
//   어려운 문제(예상 30%) 자주 틀림(60%) = 0.18 (낮음, 정상적)
// - 카테고리 약점 점수 = 평균(치명도) — 0에 가까울수록 정상, 클수록 약점
// - 동시에 카테고리별 단순 정답률도 계산하여 둘 다 표시
function computeWeakness(year, session) {
  const result = { categories: {}, byDifficulty: {}, sections: {} };
  ['eon', 'chu'].forEach(sec => {
    const meta = LEET_META[year] && LEET_META[year][sec];
    if (!meta) return;
    meta.forEach(q => {
      if (!q.category && !q.difficulty) return;
      const status = session[sec][q.no];
      if (!status) return; // 미채점 제외
      const isCorrect = status === 'correct';
      const correctValue = isCorrect ? 1 : 0;

      // 카테고리별
      if (q.category) {
        const key = `${sec}::${q.category}`;
        if (!result.categories[key]) {
          result.categories[key] = {
            sec,
            category: q.category,
            name: LEET_TAXONOMY[sec].categories[q.category]?.name || q.category,
            color: LEET_TAXONOMY[sec].categories[q.category]?.color || '#888',
            total: 0,
            correct: 0,
            expectedSum: 0,    // 예상정답률 합 (난이도 있는 문항만)
            expectedCount: 0,
            criticalitySum: 0, // 치명도 합
            criticalityCount: 0,
          };
        }
        const c = result.categories[key];
        c.total++;
        c.correct += correctValue;
        if (q.difficulty && DIFFICULTY_LEVELS[q.difficulty]) {
          const exp = DIFFICULTY_LEVELS[q.difficulty].expected_rate;
          c.expectedSum += exp;
          c.expectedCount++;
          // 치명도: (1 - 정답값) × 예상정답률
          c.criticalitySum += (1 - correctValue) * exp;
          c.criticalityCount++;
        }
      }

      // 난이도별
      if (q.difficulty) {
        if (!result.byDifficulty[q.difficulty]) {
          result.byDifficulty[q.difficulty] = { total: 0, correct: 0, expected: DIFFICULTY_LEVELS[q.difficulty].expected_rate };
        }
        result.byDifficulty[q.difficulty].total++;
        result.byDifficulty[q.difficulty].correct += correctValue;
      }

      // 영역별
      if (!result.sections[sec]) result.sections[sec] = { total: 0, correct: 0, expectedSum: 0, expectedCount: 0 };
      result.sections[sec].total++;
      result.sections[sec].correct += correctValue;
      if (q.difficulty) {
        result.sections[sec].expectedSum += DIFFICULTY_LEVELS[q.difficulty].expected_rate;
        result.sections[sec].expectedCount++;
      }
    });
  });

  // 카테고리별 점수 계산
  Object.values(result.categories).forEach(c => {
    c.actualRate = c.total > 0 ? c.correct / c.total : 0;
    c.expectedRate = c.expectedCount > 0 ? c.expectedSum / c.expectedCount : null;
    c.gap = c.expectedRate !== null ? c.actualRate - c.expectedRate : null;
    c.criticality = c.criticalityCount > 0 ? c.criticalitySum / c.criticalityCount : 0;
    // 약점 종합 점수: gap이 음수일수록 + criticality가 높을수록 큼
    // 표본이 적으면 신뢰도 낮음 (Wilson-style 보정)
    const reliability = Math.min(1, c.total / 5); // 5문항 이상이면 만점 신뢰도
    c.weaknessScore = c.gap !== null
      ? (-c.gap * 0.6 + c.criticality * 0.4) * reliability
      : c.criticality * reliability;
  });

  return result;
}

// ===========================================================================
// Toast / Confirm Modal / 인라인 폼 에러 (alert/confirm 대체용)
// ===========================================================================
function ensureToastContainer() {
  let c = document.getElementById('toastContainer');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toastContainer';
    c.className = 'toast-container';
    c.setAttribute('aria-live', 'polite');
    c.setAttribute('aria-atomic', 'true');
    document.body.appendChild(c);
  }
  return c;
}

function toast(msg, opts) {
  opts = opts || {};
  const type = opts.type || 'info';
  const duration = opts.duration === undefined ? 3000 : opts.duration;
  const action = opts.action || null;
  const c = ensureToastContainer();
  const t = document.createElement('div');
  t.className = 'toast' + (type !== 'info' ? ' ' + type : '');
  t.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const text = document.createElement('span');
  text.textContent = msg;
  t.appendChild(text);

  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      try { action.onClick(); } finally { dismissToast(t); }
    });
    t.appendChild(btn);
  }

  c.appendChild(t);
  if (duration > 0) setTimeout(() => dismissToast(t), duration);
  return t;
}

function dismissToast(t) {
  if (!t || !t.parentNode) return;
  t.classList.add('dismissing');
  setTimeout(() => { if (t.parentNode) t.remove(); }, 200);
}

// Promise<boolean> 반환 — confirm() 대체
function confirmAsync(msg, opts) {
  opts = opts || {};
  const title = opts.title || '확인';
  const okLabel = opts.okLabel || '확인';
  const cancelLabel = opts.cancelLabel || '취소';
  const danger = !!opts.danger;
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    const titleId = 'confirmTitle_' + Date.now();
    overlay.setAttribute('aria-labelledby', titleId);
    overlay.innerHTML =
      '<div class="confirm-modal">' +
        '<div class="confirm-title" id="' + titleId + '">' + escapeHtml(title) + '</div>' +
        '<div class="confirm-message">' + escapeHtml(msg) + '</div>' +
        '<div class="confirm-actions">' +
          '<button class="confirm-btn cancel" type="button">' + escapeHtml(cancelLabel) + '</button>' +
          '<button class="confirm-btn ' + (danger ? 'danger' : 'confirm') + '" type="button">' + escapeHtml(okLabel) + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    const cancelBtn = overlay.querySelector('.cancel');
    const okBtn = overlay.querySelector('.confirm-btn:not(.cancel)');
    const prevFocus = document.activeElement;

    function close(result) {
      document.removeEventListener('keydown', keyHandler);
      if (overlay.parentNode) overlay.remove();
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      resolve(result);
    }
    function keyHandler(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      else if (e.key === 'Enter') { e.preventDefault(); close(true); }
    }

    cancelBtn.addEventListener('click', () => close(false));
    okBtn.addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', keyHandler);
    okBtn.focus();
  });
}

function showFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.classList.add('has-error');
  input.setAttribute('aria-invalid', 'true');

  const errId = inputId + '-error';
  let err = document.getElementById(errId);
  if (!err) {
    err = document.createElement('div');
    err.id = errId;
    err.className = 'field-error';
    err.setAttribute('role', 'alert');
    input.insertAdjacentElement('afterend', err);
    input.setAttribute('aria-describedby', errId);
  }
  err.textContent = message;

  const clear = () => {
    input.classList.remove('has-error');
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    if (err.parentNode) err.remove();
    input.removeEventListener('input', clear);
    input.removeEventListener('change', clear);
  };
  input.addEventListener('input', clear, { once: true });
  input.addEventListener('change', clear, { once: true });
}

function clearFieldErrors() {
  for (let i = 0; i < arguments.length; i++) {
    const id = arguments[i];
    const input = document.getElementById(id);
    if (input) {
      input.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
    const err = document.getElementById(id + '-error');
    if (err) err.remove();
  }
}

// ===========================================================================
// 탭 키보드 네비게이션 (← → 키로 탭 이동, ARIA 동기화)
// ===========================================================================
(function initTabA11y() {
  const tabs = Array.from(document.querySelectorAll('.tab-nav .tab-btn'));
  if (!tabs.length) return;
  const tabNav = document.querySelector('.tab-nav');
  if (tabNav) tabNav.setAttribute('role', 'tablist');

  tabs.forEach((btn, i) => {
    btn.setAttribute('role', 'tab');
    const target = btn.dataset.tab;
    btn.id = 'tab-btn-' + target;
    btn.setAttribute('aria-controls', 'tab-' + target);
    const isActive = btn.classList.contains('active');
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    btn.setAttribute('tabindex', isActive ? '0' : '-1');

    const panel = document.getElementById('tab-' + target);
    if (panel) {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', 'tab-btn-' + target);
      if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '0');
    }

    btn.addEventListener('keydown', (e) => {
      const visible = tabs.filter(t => t.offsetParent !== null);
      const idx = visible.indexOf(btn);
      if (idx === -1) return;
      let next = -1;
      if (e.key === 'ArrowRight') next = (idx + 1) % visible.length;
      else if (e.key === 'ArrowLeft') next = (idx - 1 + visible.length) % visible.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = visible.length - 1;
      if (next !== -1) {
        e.preventDefault();
        visible[next].focus();
        visible[next].click();
      }
    });

    btn.addEventListener('click', () => {
      tabs.forEach(b => {
        const active = b === btn;
        b.setAttribute('aria-selected', active ? 'true' : 'false');
        b.setAttribute('tabindex', active ? '0' : '-1');
      });
    });
  });
})();
