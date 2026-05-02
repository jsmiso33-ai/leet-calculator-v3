// ===========================================================================
// 관리자 모드 (메타데이터 입력)
// ===========================================================================
// 메타데이터 작업 상태 (LocalStorage) - 다른 함수보다 먼저 선언
const ADMIN_KEY = 'leet_meta_draft_v1';
let adminDraft = {}; // { 2026: { eon: [...], chu: [...] }, ... }
let adminCurrent = null; // { year, sec, no } 현재 편집 중인 문항

function loadAdminDraft() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveAdminDraft() {
  try { localStorage.setItem(ADMIN_KEY, JSON.stringify(adminDraft)); } catch {}
}

// 진입: URL ?admin=1 또는 헤더 로고 5번 빠르게 클릭
(function setupAdminAccess() {
  const params = new URLSearchParams(location.search);
  if (params.get('admin') === '1') {
    enableAdminMode();
  }

  // 헤더 5번 빠르게 클릭으로도 활성화
  let clicks = 0, timer = null;
  const header = document.querySelector('header') || document.body;
  header.addEventListener('click', (e) => {
    // 일반 사용자가 우연히 트리거하지 않게: Shift 키와 함께 5번
    if (!e.shiftKey) return;
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(() => { clicks = 0; }, 1500);
    if (clicks >= 5) {
      clicks = 0;
      enableAdminMode();
      alert('🔧 관리자 모드 활성화됨');
    }
  });
})();

function enableAdminMode() {
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
  // 자동 초기화는 탭 클릭 시 hookAdminTabSwitch가 처리.
  // 다만 이벤트 바인딩은 미리 해둬야 모달 등이 동작함.
  if (!window._adminEventsBound) {
    // 학년도 셀렉트만 미리 채워두기 (탭 클릭 시 즉시 보이도록)
    const sel = document.getElementById('adminYear');
    if (sel && !sel.options.length) {
      Object.keys(LEET).map(Number).sort((a,b) => b-a).forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y + '학년도';
        sel.appendChild(opt);
      });
      sel.value = '2026';
    }
    adminDraft = loadAdminDraft();
    Object.keys(LEET_META).forEach(y => {
      if (!adminDraft[y]) adminDraft[y] = LEET_META[y];
    });
    adminBindEvents();
    window._adminEventsBound = true;
    window._adminInited = true; // 셀렉트와 데이터는 준비됨, 탭 클릭 시 adminRender만 호출
  }
}

function adminInit() {
  // 학년도 셀렉트 채우기
  const sel = document.getElementById('adminYear');
  if (!sel.options.length) {
    Object.keys(LEET).map(Number).sort((a,b) => b-a).forEach(y => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y + '학년도';
      sel.appendChild(opt);
    });
    sel.value = '2026';
  }

  // 카테고리 셀렉트는 나중에 sec에 따라 동적 생성
  adminDraft = loadAdminDraft();

  // 코드에 내장된 LEET_META가 있으면 머지(기존 작업 보존)
  Object.keys(LEET_META).forEach(y => {
    if (!adminDraft[y]) adminDraft[y] = LEET_META[y];
  });

  adminRender();
  // 이벤트 바인딩은 한 번만
  if (!window._adminEventsBound) {
    adminBindEvents();
    window._adminEventsBound = true;
  }
}

function adminGetYearData(year) {
  if (!adminDraft[year]) {
    adminDraft[year] = { eon: [], chu: [] };
  }
  if (!adminDraft[year].eon) adminDraft[year].eon = [];
  if (!adminDraft[year].chu) adminDraft[year].chu = [];
  return adminDraft[year];
}

function adminGetItem(year, sec, no) {
  const yd = adminGetYearData(year);
  return yd[sec].find(q => q.no === no) || null;
}

function adminSetItem(year, sec, no, data) {
  const yd = adminGetYearData(year);
  const idx = yd[sec].findIndex(q => q.no === no);
  if (idx >= 0) {
    yd[sec][idx] = { ...yd[sec][idx], ...data, no };
  } else {
    yd[sec].push({ no, ...data });
    yd[sec].sort((a, b) => a.no - b.no);
  }
  saveAdminDraft();
}

function adminDeleteItem(year, sec, no) {
  const yd = adminGetYearData(year);
  yd[sec] = yd[sec].filter(q => q.no !== no);
  saveAdminDraft();
}

function adminItemStatus(item) {
  if (!item) return 'empty';
  const hasAns = item.answer !== null && item.answer !== undefined;
  const hasCat = !!item.category;
  const hasDiff = !!item.difficulty;
  if (hasAns && hasCat && hasDiff) return 'complete';
  if (hasAns || hasCat || hasDiff) return 'partial';
  return 'empty';
}

function adminRender() {
  const yearEl = document.getElementById('adminYear');
  if (!yearEl) {
    console.error('[admin] adminYear element not found');
    return;
  }
  let year = parseInt(yearEl.value);
  if (isNaN(year) || !LEET[year]) {
    // 셀렉트가 비어있으면 채우고 기본값 설정
    if (!yearEl.options.length) {
      Object.keys(LEET).map(Number).sort((a,b) => b-a).forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y + '학년도';
        yearEl.appendChild(opt);
      });
    }
    yearEl.value = '2026';
    year = 2026;
  }
  const yearData = LEET[year];
  if (!yearData) {
    console.error('[admin] No data for year', year);
    return;
  }

  ['eon', 'chu'].forEach(sec => {
    const count = sec === 'eon' ? yearData.items_eon : yearData.items_chu;
    const grid = document.getElementById('adminGrid' + (sec === 'eon' ? 'Eon' : 'Chu'));
    if (!grid) {
      console.error('[admin] Grid element not found for', sec);
      return;
    }
    grid.innerHTML = '';

    let completeCount = 0;
    for (let n = 1; n <= count; n++) {
      const item = adminGetItem(year, sec, n);
      const status = adminItemStatus(item);
      if (status === 'complete') completeCount++;

      const cell = document.createElement('div');
      cell.className = 'admin-cell';
      if (status === 'complete') cell.classList.add('complete');
      else if (status === 'partial') cell.classList.add('partial');

      const catColor = item && item.category && LEET_TAXONOMY[sec].categories[item.category]
        ? LEET_TAXONOMY[sec].categories[item.category].color
        : null;

      cell.innerHTML = `
        <div class="admin-cell-num">${n}</div>
        ${item && item.answer ? `<div class="admin-cell-ans">정답 ${item.answer}</div>` : ''}
        ${catColor ? `<div class="admin-cell-cat-bar" style="background:${catColor};"></div>` : ''}
      `;
      cell.addEventListener('click', () => adminOpenModal(year, sec, n));
      grid.appendChild(cell);
    }

    document.getElementById('admin' + (sec === 'eon' ? 'Eon' : 'Chu') + 'Progress').textContent =
      `${completeCount} / ${count}`;
  });

  // 전체 진행률
  const total = yearData.items_eon + yearData.items_chu;
  const yd = adminGetYearData(year);
  const allComplete = yd.eon.filter(q => adminItemStatus(q) === 'complete').length
                    + yd.chu.filter(q => adminItemStatus(q) === 'complete').length;
  const pct = total > 0 ? (allComplete / total * 100) : 0;
  document.getElementById('adminProgressFill').style.width = pct.toFixed(1) + '%';
  document.getElementById('adminProgressText').textContent = `${allComplete} / ${total} (${pct.toFixed(0)}%)`;
}

function adminOpenModal(year, sec, no) {
  adminCurrent = { year, sec, no };
  const item = adminGetItem(year, sec, no) || {};

  document.getElementById('adminModalTitle').textContent =
    `${year}학년도 ${sec === 'eon' ? '언어이해' : '추리논증'} ${no}번`;

  // 카테고리 셀렉트 채우기 (sec에 따라 다름)
  const catSel = document.getElementById('adminCategory');
  catSel.innerHTML = '<option value="">-- 선택 --</option>';
  Object.entries(LEET_TAXONOMY[sec].categories).forEach(([key, cat]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = cat.name;
    catSel.appendChild(opt);
  });

  // 값 채우기
  catSel.value = item.category || '';
  document.getElementById('adminSubcategory').value = item.subcategory || '';
  document.getElementById('adminPassageGroup').value = item.passage_group || '';
  document.getElementById('adminTags').value = (item.tags || []).join(', ');
  document.getElementById('adminMemo').value = item.memo || '';

  // 정답 버튼
  document.querySelectorAll('#adminAnswerRow button').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.ans) === item.answer);
  });
  // 난이도 버튼
  document.querySelectorAll('#adminDiffRow button').forEach(b => {
    b.classList.toggle('active', b.dataset.diff === item.difficulty);
  });
  adminUpdateDiffHint(item.difficulty);

  // 지문 묶음은 언어이해만
  document.getElementById('adminPassageGroup').parentElement.style.display =
    sec === 'eon' ? '' : 'none';

  document.getElementById('adminModal').style.display = 'flex';
}

function adminUpdateDiffHint(diff) {
  const hint = document.getElementById('adminDiffHint');
  if (diff && DIFFICULTY_LEVELS[diff]) {
    const rate = DIFFICULTY_LEVELS[diff].expected_rate;
    hint.textContent = `예상 정답률: ${(rate * 100).toFixed(0)}% — 이 난이도면 평균적으로 이 비율로 맞춥니다.`;
  } else {
    hint.textContent = '난이도를 선택하면 예상 정답률이 표시됩니다.';
  }
}

function adminCloseModal() {
  document.getElementById('adminModal').style.display = 'none';
  adminCurrent = null;
}

function adminCollectModal() {
  const ans = document.querySelector('#adminAnswerRow button.active');
  const diff = document.querySelector('#adminDiffRow button.active');
  const cat = document.getElementById('adminCategory').value;
  const sub = document.getElementById('adminSubcategory').value.trim();
  const grp = document.getElementById('adminPassageGroup').value;
  const tagsRaw = document.getElementById('adminTags').value.trim();
  const memo = document.getElementById('adminMemo').value.trim();
  return {
    answer: ans ? parseInt(ans.dataset.ans) : null,
    category: cat || null,
    subcategory: sub || null,
    difficulty: diff ? diff.dataset.diff : null,
    passage_group: grp ? parseInt(grp) : null,
    tags: tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [],
    memo: memo || null,
  };
}

function adminSaveModal() {
  if (!adminCurrent) return;
  const data = adminCollectModal();
  adminSetItem(adminCurrent.year, adminCurrent.sec, adminCurrent.no, data);
}

function adminMoveTo(delta) {
  if (!adminCurrent) return;
  adminSaveModal();

  const { year, sec, no } = adminCurrent;
  const yearData = LEET[year];
  const eonMax = yearData.items_eon;
  const chuMax = yearData.items_chu;

  // 통합 인덱스: eon 1..eonMax, chu 1..chuMax
  let absIdx;
  if (sec === 'eon') absIdx = no;
  else absIdx = eonMax + no;

  absIdx += delta;
  const totalMax = eonMax + chuMax;
  if (absIdx < 1) absIdx = 1;
  if (absIdx > totalMax) {
    adminCloseModal();
    adminRender();
    return;
  }

  let nextSec, nextNo;
  if (absIdx <= eonMax) {
    nextSec = 'eon';
    nextNo = absIdx;
  } else {
    nextSec = 'chu';
    nextNo = absIdx - eonMax;
  }

  adminRender();
  adminOpenModal(year, nextSec, nextNo);
}

function adminBindEvents() {
  // 학년도 변경
  document.getElementById('adminYear').addEventListener('change', adminRender);

  // 모달 닫기
  document.getElementById('adminModalClose').addEventListener('click', adminCloseModal);
  document.querySelector('.admin-modal-backdrop').addEventListener('click', adminCloseModal);

  // 정답 버튼
  document.querySelectorAll('#adminAnswerRow button').forEach(b => {
    b.addEventListener('click', () => {
      const wasActive = b.classList.contains('active');
      document.querySelectorAll('#adminAnswerRow button').forEach(bb => bb.classList.remove('active'));
      if (!wasActive) b.classList.add('active');
    });
  });
  // 난이도 버튼
  document.querySelectorAll('#adminDiffRow button').forEach(b => {
    b.addEventListener('click', () => {
      const wasActive = b.classList.contains('active');
      document.querySelectorAll('#adminDiffRow button').forEach(bb => bb.classList.remove('active'));
      if (!wasActive) {
        b.classList.add('active');
        adminUpdateDiffHint(b.dataset.diff);
      } else {
        adminUpdateDiffHint(null);
      }
    });
  });

  // 이전/다음
  document.getElementById('adminModalPrev').addEventListener('click', () => adminMoveTo(-1));
  document.getElementById('adminModalNext').addEventListener('click', () => adminMoveTo(1));

  // 삭제
  document.getElementById('adminModalDelete').addEventListener('click', () => {
    if (!adminCurrent) return;
    if (!confirm('이 문항의 메타데이터를 삭제하시겠습니까?')) return;
    adminDeleteItem(adminCurrent.year, adminCurrent.sec, adminCurrent.no);
    adminCloseModal();
    adminRender();
  });

  // ESC로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('adminModal').style.display === 'flex') {
      adminCloseModal();
    }
    // Enter로 다음
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && document.getElementById('adminModal').style.display === 'flex') {
      adminMoveTo(1);
    }
  });

  // JSON 다운로드
  document.getElementById('adminExport').addEventListener('click', () => {
    const year = parseInt(document.getElementById('adminYear').value);
    const yd = adminGetYearData(year);
    const exportObj = {
      year,
      generated_at: new Date().toISOString(),
      eon: yd.eon,
      chu: yd.chu,
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leet_meta_${year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // JSON 불러오기
  document.getElementById('adminImport').addEventListener('click', () => {
    document.getElementById('adminImportFile').click();
  });
  document.getElementById('adminImportFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.year || !data.eon || !data.chu) {
          alert('JSON 형식이 올바르지 않습니다. {year, eon, chu} 구조여야 합니다.');
          return;
        }
        if (!confirm(`${data.year}학년도 데이터를 불러오시겠습니까? 기존 데이터는 덮어쓰여집니다.`)) return;
        adminDraft[data.year] = { eon: data.eon, chu: data.chu };
        saveAdminDraft();
        document.getElementById('adminYear').value = data.year;
        adminRender();
        alert(`${data.year}학년도 메타데이터 불러오기 완료`);
      } catch (err) {
        alert('JSON 파싱 실패: ' + err.message);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  // 코드에서 불러오기 (개발용)
  document.getElementById('adminLoadFromCode').addEventListener('click', () => {
    if (!confirm('코드에 내장된 LEET_META를 불러옵니다. 현재 작업물이 덮어쓰여질 수 있습니다.')) return;
    Object.keys(LEET_META).forEach(y => {
      adminDraft[y] = LEET_META[y];
    });
    saveAdminDraft();
    adminRender();
    alert('코드 데이터 불러오기 완료');
  });

  // 일괄 도구
  document.getElementById('adminFillSequential').addEventListener('click', () => {
    const year = parseInt(document.getElementById('adminYear').value);
    const yearData = LEET[year];
    const yd = adminGetYearData(year);
    let added = 0;
    ['eon', 'chu'].forEach(sec => {
      const max = sec === 'eon' ? yearData.items_eon : yearData.items_chu;
      for (let n = 1; n <= max; n++) {
        if (!yd[sec].find(q => q.no === n)) {
          yd[sec].push({ no: n, answer: null, category: null, difficulty: null });
          added++;
        }
      }
      yd[sec].sort((a, b) => a.no - b.no);
    });
    saveAdminDraft();
    adminRender();
    alert(`${added}개 빈 슬롯 생성됨`);
  });

  document.getElementById('adminCopyFromYear').addEventListener('click', () => {
    const year = parseInt(document.getElementById('adminYear').value);
    const others = Object.keys(adminDraft)
      .map(Number)
      .filter(y => y !== year && adminDraft[y] && (adminDraft[y].eon?.length || adminDraft[y].chu?.length))
      .sort((a, b) => b - a);
    if (others.length === 0) {
      alert('복사할 다른 학년도 데이터가 없습니다.');
      return;
    }
    const fromYear = prompt(`어느 학년도에서 복사할까요? (사용 가능: ${others.join(', ')})\n\n주의: 카테고리·난이도 구조만 참고용으로 복사하며, 정답은 복사하지 않습니다.`, others[0]);
    if (!fromYear) return;
    const fy = parseInt(fromYear);
    if (!adminDraft[fy]) { alert('해당 학년도 데이터 없음'); return; }
    const yd = adminGetYearData(year);
    let copied = 0;
    ['eon', 'chu'].forEach(sec => {
      (adminDraft[fy][sec] || []).forEach(src => {
        if (!yd[sec].find(q => q.no === src.no)) {
          yd[sec].push({
            no: src.no,
            answer: null, // 정답은 복사 안 함
            category: src.category,
            subcategory: src.subcategory,
            difficulty: src.difficulty,
            passage_group: src.passage_group,
            tags: src.tags ? [...src.tags] : [],
          });
          copied++;
        }
      });
      yd[sec].sort((a, b) => a.no - b.no);
    });
    saveAdminDraft();
    adminRender();
    alert(`${fy}학년도에서 ${copied}개 항목 복사됨 (정답 제외)`);
  });

  document.getElementById('adminClearYear').addEventListener('click', () => {
    const year = parseInt(document.getElementById('adminYear').value);
    if (!confirm(`${year}학년도 메타데이터를 모두 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    delete adminDraft[year];
    saveAdminDraft();
    adminRender();
  });
}

// 탭 전환 시 관리자 탭이면 자동 초기화 (visible해진 후 렌더해야 정확함)
(function hookAdminTabSwitch() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === 'admin') {
        // 탭 전환은 다른 핸들러가 처리하므로, 약간 지연 후 렌더
        setTimeout(() => {
          if (!window._adminInited) {
            adminInit();
            window._adminInited = true;
          } else {
            // 이미 초기화됨 - 그리드만 다시 렌더 (display:block 직후 정확한 크기 확보)
            adminRender();
          }
        }, 50);
      }
    });
  });
})();

// 디버그 헬퍼 (콘솔에서 호출 가능)
window.adminDebug = function() {
  const sel = document.getElementById('adminYear');
  console.log('=== Admin Debug ===');
  console.log('LEET keys:', Object.keys(LEET));
  console.log('adminYear element:', sel);
  console.log('adminYear options:', sel ? Array.from(sel.options).map(o => o.value) : 'no element');
  console.log('adminYear value:', sel ? sel.value : 'no element');
  console.log('LEET[selected]:', sel ? LEET[parseInt(sel.value)] : 'no element');
  console.log('Grid eon:', document.getElementById('adminGridEon'));
  console.log('Grid chu:', document.getElementById('adminGridChu'));
  console.log('Tab panel:', document.getElementById('tab-admin'));
  console.log('Tab panel display:', document.getElementById('tab-admin')?.style.display, getComputedStyle(document.getElementById('tab-admin'))?.display);
  console.log('_adminInited:', window._adminInited, '_adminEventsBound:', window._adminEventsBound);
  console.log('adminDraft:', adminDraft);
  console.log('==================');
  console.log('Try: adminRender() to force re-render');
};
window.adminForceInit = function() {
  window._adminInited = false;
  window._adminEventsBound = false;
  adminInit();
  window._adminInited = true;
  console.log('Admin force re-initialized');
};

// LocalStorage의 메타데이터 작업물을 지우고 코드에 박힌 메타데이터를 사용
window.metaResetToCode = function() {
  if (!confirm('LocalStorage의 메타데이터 작업물을 모두 삭제하고 코드에 내장된 데이터만 사용합니다. 진행할까요?')) return;
  try {
    localStorage.removeItem('leet_meta_draft_v1');
    console.log('LocalStorage cleared. Reloading page...');
    location.reload();
  } catch (e) { console.error(e); }
};

// 현재 LEET_META 상태 확인 (분석 안 떴을 때 디버깅용)
window.metaStatus = function() {
  const years = Object.keys(LEET_META).sort();
  console.log('=== LEET_META 현재 상태 ===');
  years.forEach(y => {
    const d = LEET_META[y];
    const eonCount = (d.eon || []).filter(q => q.answer != null).length;
    const chuCount = (d.chu || []).filter(q => q.answer != null).length;
    console.log(`${y}학년도: 언어 ${eonCount}문항, 추리 ${chuCount}문항`);
  });
  console.log('===========================');
  console.log('LocalStorage 키 leet_meta_draft_v1:', localStorage.getItem('leet_meta_draft_v1') ? '있음 (작업물)' : '없음');
  console.log('Reset 명령: metaResetToCode()');
};

// ===========================================================================
// 메타데이터 통합: 관리자가 입력한 draft를 LEET_META에 머지
// 기존 코드(qgRenderStats 등)가 LEET_META를 참조하므로, 페이지 로드 시 통합
// 단, 코드에 하드코딩된 데이터가 더 완성도 높으면 보존
// ===========================================================================
(function mergeAdminDraftIntoMeta() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    Object.keys(draft).forEach(y => {
      const draftYear = draft[y];
      const codeYear = LEET_META[y];
      if (!draftYear) return;

      // 코드에 데이터가 없으면 draft 사용
      if (!codeYear) {
        LEET_META[y] = draftYear;
        return;
      }

      // 둘 다 있으면 더 완성도 높은 쪽 선택 (영역별로 별개 판단)
      ['eon', 'chu'].forEach(sec => {
        const codeArr = (codeYear[sec] || []);
        const draftArr = (draftYear[sec] || []);
        // "완성도": 정답이 채워진 항목 수
        const codeFilled = codeArr.filter(q => q && q.answer != null).length;
        const draftFilled = draftArr.filter(q => q && q.answer != null).length;
        if (draftFilled > codeFilled) {
          if (!LEET_META[y]) LEET_META[y] = {};
          LEET_META[y][sec] = draftArr;
        }
        // 코드 쪽이 같거나 더 완성도 높으면 코드 데이터 유지
      });
    });
  } catch (e) {
    console.warn('[meta merge] error:', e);
  }
})();
