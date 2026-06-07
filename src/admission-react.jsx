import React from 'react';

const gradeLabels = {
  all: '전체',
  safe: '안정',
  match: '적정',
  reach: '도전',
  hard: '위험',
};

const sortLabels = {
  'leet-cut': 'LEET 표점합 높은 순',
  enrolled: '등록인원 많은 순',
  alpha: '학교명 가나다순',
};

const gradePillClass = {
  safe: 'grade-safe tw:!bg-emerald-50 tw:!text-emerald-700',
  match: 'grade-match tw:!bg-sky-50 tw:!text-sky-700',
  reach: 'grade-reach tw:!bg-amber-50 tw:!text-amber-700',
  hard: 'grade-hard tw:!bg-zinc-100 tw:!text-zinc-600',
};

const gradeToneClass = {
  safe: 'tw:!border-t-emerald-500',
  match: 'tw:!border-t-sky-500',
  reach: 'tw:!border-t-amber-500',
  hard: 'tw:!border-t-zinc-500',
  pending: 'tw:!border-t-zinc-300',
};

const slotToneClass = {
  safe: 'tw:!border-l-emerald-500',
  match: 'tw:!border-l-sky-500',
  reach: 'tw:!border-l-amber-500',
  hard: 'tw:!border-l-zinc-500',
  pending: 'tw:!border-l-zinc-300',
};

const diffToneClass = {
  plus: 'tw:!text-emerald-700',
  minus: 'tw:!text-red-600',
  even: 'tw:!text-slate-500',
  na: 'tw:!text-slate-500',
};

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function Summary({ model }) {
  const counts = model.gradeCounts;
  return (
    <section className="adm-summary adm-summary-react tw:!mb-4 tw:!grid tw:!grid-cols-1 tw:!gap-3 tw:lg:!grid-cols-[1.45fr_1fr]">
      <div className="adm-summary-lead adm-report-card tw:!rounded-xl tw:!border tw:!border-blue-200 tw:!bg-blue-50 tw:!p-5 tw:!shadow-sm">
        <div className="adm-report-kicker tw:!text-[11px] tw:!font-extrabold tw:!uppercase tw:!tracking-normal tw:!text-blue-700">Admission Report</div>
        <strong className="tw:!mt-2 tw:!block tw:!text-3xl tw:!font-extrabold tw:!leading-tight tw:!text-slate-950">
          {model.recTitle}
        </strong>
        <p className="tw:!mt-2 tw:!max-w-3xl tw:!text-sm tw:!font-semibold tw:!leading-6 tw:!text-slate-600">{model.recCopy}</p>
        <div className="adm-report-footer tw:!mt-4 tw:!flex tw:!flex-wrap tw:!items-center tw:!justify-center tw:!gap-2">
          <span className="adm-readiness tw:!m-0 tw:!inline-flex tw:!min-h-9 tw:!items-center tw:!justify-center tw:!rounded-lg tw:!bg-white tw:!px-3 tw:!py-2 tw:!text-[11px] tw:!font-extrabold tw:!leading-tight tw:!text-slate-700 tw:!shadow-sm">{model.readinessText}</span>
          <span className="tw:!inline-flex tw:!min-h-9 tw:!items-center tw:!justify-center tw:!rounded-lg tw:!bg-blue-600 tw:!px-3 tw:!py-2 tw:!text-[11px] tw:!font-extrabold tw:!leading-tight tw:!text-white">상세 표 {model.totalRows}개교</span>
        </div>
      </div>

      <div className="adm-summary-stack tw:!grid tw:!grid-cols-1 tw:!gap-3 tw:md:!grid-cols-3 tw:lg:!grid-cols-1">
        <div className="adm-summary-item adm-metric-card tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-4 tw:!shadow-sm">
          <div className="as-label tw:!text-[11px] tw:!font-extrabold tw:!text-slate-500">LEET 표점합</div>
          <div className={cx('as-val tw:!mt-1.5 tw:!font-mono tw:!text-3xl tw:!font-extrabold', model.leetSum === null ? 'empty tw:!text-slate-400' : 'tw:!text-blue-600')}>
            {model.leetSum === null ? '입력 필요' : model.leetSum.toFixed(1)}
          </div>
          <div className="as-sub tw:!mt-1.5 tw:!text-[11px] tw:!font-semibold tw:!text-slate-500">학교별 환산점수 기준</div>
        </div>

        <div className="adm-summary-item adm-metric-card tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-4 tw:!shadow-sm">
          <div className="as-label tw:!text-[11px] tw:!font-extrabold tw:!text-slate-500">학점 백분위</div>
          <div className={cx('as-val tw:!mt-1.5 tw:!font-mono tw:!text-3xl tw:!font-extrabold', model.gpaPct === null ? 'empty tw:!text-slate-400' : 'tw:!text-slate-950')}>
            {model.gpaPct === null ? '입력 필요' : `${model.gpaPct.toFixed(1)}%`}
          </div>
          <div className="as-sub tw:!mt-1.5 tw:!text-[11px] tw:!font-semibold tw:!text-slate-500">입력 학점 백분위</div>
        </div>

        <div className="adm-summary-item adm-summary-distrib adm-metric-card tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-4 tw:!text-center tw:!shadow-sm">
          <div className="as-label tw:!mb-3 tw:!text-xs tw:!font-extrabold tw:!text-slate-500">
            지원권 분포 {model.totalGraded > 0 ? `(${model.totalGraded}개교)` : ''}
          </div>
          {model.totalGraded > 0 ? (
            <div className="as-distrib tw:!flex tw:!flex-wrap tw:!items-center tw:!justify-center tw:!gap-2">
              {['safe', 'match', 'reach', 'hard'].map((grade) => (
                <span key={grade} className={cx('grade-pill tw:!rounded-full tw:!px-2.5 tw:!py-1.5 tw:!text-xs tw:!font-extrabold', gradePillClass[grade])}>
                  {gradeLabels[grade]} {counts[grade] || 0}
                </span>
              ))}
            </div>
          ) : (
            <div className="as-val empty tw:!text-sm tw:!font-extrabold tw:!text-slate-400">
              {model.leetSum === null ? 'LEET 입력 필요' : '데이터 없음'}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function DecisionToolbar({ model, actions }) {
  return (
    <section className="adm-decision-toolbar tw:!mb-3 tw:!flex tw:!flex-wrap tw:!items-center tw:!justify-between tw:!gap-3 tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-3 tw:!shadow-sm" aria-label="입시결과 보기 옵션">
      <div className="adm-grade-tabs tw:!flex tw:!min-w-0 tw:!flex-wrap tw:!gap-2" role="tablist" aria-label="지원권 필터">
        {['all', 'safe', 'match', 'reach', 'hard'].map((grade) => (
          <button
            key={grade}
            type="button"
            className={cx('tw:!min-h-9 tw:!rounded-lg tw:!px-3 tw:!text-xs tw:!font-extrabold tw:transition-colors tw:focus-visible:!outline tw:focus-visible:!outline-2 tw:focus-visible:!outline-offset-2 tw:focus-visible:!outline-blue-500', model.gradeFilter === grade && 'active')}
            aria-selected={model.gradeFilter === grade}
            onClick={() => actions.setGrade(grade)}
          >
            {gradeLabels[grade]} <span>{grade === 'all' ? model.totalRows : model.gradeCounts[grade] || 0}</span>
          </button>
        ))}
      </div>

      <div className="schools-controls adm-sort-controls tw:!m-0 tw:!ml-auto tw:!flex tw:!flex-wrap tw:!items-center tw:!gap-2">
        <div className="ctrl-label tw:!text-xs tw:!font-bold tw:!text-slate-500">정렬:</div>
        <div className="ctrl-buttons tw:!flex tw:!flex-wrap tw:!gap-2">
          {Object.entries(sortLabels).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={cx('sort-btn tw:!rounded-lg tw:!border tw:!border-slate-200 tw:!bg-white tw:!px-3 tw:!py-2 tw:!text-xs tw:!font-bold tw:!text-slate-600 tw:!shadow-sm tw:transition-colors tw:hover:!border-blue-300 tw:hover:!text-blue-700', model.sortKey === key && 'active')}
              onClick={() => actions.setSort(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function SchoolFilter({ model, actions }) {
  return (
    <details className="school-filter-card tw:!mb-4 tw:!overflow-hidden tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!shadow-sm">
      <summary>
        <span className="sf-label">학교 선택</span>
        <span className="sf-count">{model.filterCountText}</span>
      </summary>
      <div className="sf-body">
        <div className="sf-quick-actions">
          {[
            ['all', '전체 선택'],
            ['favorites', '즐겨찾기만'],
            ['seoul', '서울권만'],
            ['metro', '서울/경기·인천'],
            ['clear', '선택 해제'],
          ].map(([key, label]) => (
            <button key={key} type="button" onClick={() => actions.setSchoolQuickAction(key)}>{label}</button>
          ))}
        </div>
        <div className="sf-chips">
          {model.filterGroups.map((group) => (
            <div key={group.name} className="sch-chip-group" data-region={group.name}>
              <div className="sch-chip-glabel">{group.name}</div>
              <div className="sch-chip-row">
                {group.schools.map((school) => (
                  <div
                    key={school.name}
                    className={cx('sch-chip', school.selected && 'active')}
                    role="button"
                    tabIndex={0}
                    onClick={() => actions.toggleSchool(school.name)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        actions.toggleSchool(school.name);
                      }
                    }}
                  >
                    {school.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

function Shortlist({ model, actions }) {
  return (
    <section className="adm-shortlist-panel tw:!mb-4 tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-4 tw:!shadow-sm tw:md:!p-5">
      <div className="adm-panel-head tw:!mb-4 tw:!flex tw:!items-start tw:!justify-between tw:!gap-3 tw:max-sm:!flex-col">
        <div>
          <h3 className="tw:!m-0 tw:!text-lg tw:!font-extrabold tw:!leading-tight tw:!text-slate-950">학교별 입시결과</h3>
          <p className="tw:!mt-1 tw:!text-xs tw:!leading-5 tw:!text-slate-500">선택한 정렬과 지원권 필터 기준으로 모든 학교를 카드로 보여줍니다.</p>
        </div>
        <span className="tw:!shrink-0 tw:!rounded-lg tw:!bg-slate-100 tw:!px-2.5 tw:!py-1.5 tw:!font-mono tw:!text-[11px] tw:!font-extrabold tw:!text-slate-500 tw:max-sm:!w-full tw:max-sm:!text-center">
          {model.shortlistMeta}
        </span>
      </div>

      <section className="adm-card-list tw:!grid tw:!grid-cols-1 tw:!gap-3 tw:md:!grid-cols-2 tw:xl:!grid-cols-3" aria-label="학교별 입시결과">
        {model.shortlistRows.length ? model.shortlistRows.map((row, index) => (
          <ShortlistCard key={row.name} row={row} index={index} selected={model.compareSelected.includes(row.name)} actions={actions} />
        )) : (
          <div className="adm-empty-card tw:!min-h-40 tw:!rounded-xl tw:!border tw:!border-dashed tw:!border-slate-300 tw:!bg-slate-50 tw:!p-5 tw:!text-center tw:!text-sm tw:!text-slate-500">
            <strong>표시할 학교가 없습니다</strong>
            <span>지원권 필터나 학교 선택 조건을 조정해보세요.</span>
          </div>
        )}
      </section>
    </section>
  );
}

function ShortlistCard({ row, index, selected, actions }) {
  const grade = row.grade || 'pending';
  return (
    <article className={cx('adm-short-card', `grade-${grade}`, selected && 'selected', 'tw:!relative tw:!flex tw:!min-w-0 tw:!flex-col tw:!gap-3 tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!border-t-[3px] tw:!bg-white tw:!p-4 tw:!shadow-sm tw:transition tw:duration-200 tw:ease-out tw:hover:!-translate-y-0.5 tw:hover:!border-blue-200 tw:hover:!shadow-lg tw:motion-reduce:!transform-none tw:motion-reduce:!transition-none', gradeToneClass[grade], selected && 'tw:!border-blue-300 tw:!shadow-md tw:!ring-2 tw:!ring-blue-100')}>
      <div className="adm-short-top tw:!grid tw:!grid-cols-[2.625rem_minmax(0,1fr)_auto] tw:!items-start tw:!gap-3 tw:max-sm:!grid-cols-[2.375rem_minmax(0,1fr)]">
        <span className="adm-short-initial tw:!inline-flex tw:!h-10 tw:!w-10 tw:!items-center tw:!justify-center tw:!rounded-full tw:!bg-slate-100 tw:!text-base tw:!font-extrabold tw:!text-slate-500">{row.initial}</span>
        <div className="adm-short-title tw:!min-w-0">
          <strong className="tw:!block tw:!truncate tw:!text-lg tw:!font-extrabold tw:!leading-tight tw:!text-slate-950">{row.name}</strong>
          <span className="tw:!mt-1 tw:!block tw:!text-xs tw:!font-semibold tw:!text-slate-500">{row.regionText} · {row.gradeLabel}</span>
        </div>
        <span className="adm-short-rank tw:!rounded-lg tw:!bg-slate-100 tw:!px-2 tw:!py-1 tw:!text-[10px] tw:!font-extrabold tw:!text-slate-500 tw:max-sm:!col-start-2 tw:max-sm:!justify-self-start">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <div className="adm-short-lines tw:!grid tw:!divide-y tw:!divide-slate-100 tw:!border-y tw:!border-slate-100">
        {row.lines.map((line) => (
          <div key={line.label} className="tw:!flex tw:!min-h-10 tw:!items-center tw:!justify-between tw:!gap-3 tw:max-sm:!items-start tw:max-sm:!py-2 tw:max-sm:!flex-col">
            <span className="tw:!text-xs tw:!font-bold tw:!text-slate-500">{line.label}</span>
            <strong className={cx('tw:!font-mono tw:!text-sm tw:!font-extrabold', line.tone || 'tw:!text-slate-900')}>{line.value}</strong>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={cx('adm-compare-toggle tw:!inline-flex tw:!min-h-9 tw:!items-center tw:!justify-center tw:!rounded-lg tw:!border tw:!px-3 tw:!text-xs tw:!font-extrabold tw:!shadow-sm tw:transition tw:duration-200 tw:hover:!border-blue-300 tw:hover:!text-blue-700 tw:focus-visible:!outline tw:focus-visible:!outline-2 tw:focus-visible:!outline-offset-2 tw:focus-visible:!outline-blue-500 tw:motion-reduce:!transition-none', selected ? 'active tw:!border-blue-600 tw:!bg-blue-600 tw:!text-white tw:!shadow-blue-100' : 'tw:!border-slate-200 tw:!bg-white tw:!text-slate-700')}
        aria-pressed={selected}
        onClick={() => actions.toggleCompare(row.name)}
      >
        {selected ? '비교에서 빼기' : '비교에 추가'}
      </button>
    </article>
  );
}

function ComparePanel({ model, actions }) {
  const compareRows = model.compareRows;
  return (
    <section className="adm-compare-panel tw:!mb-4 tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-4 tw:!shadow-sm tw:md:!p-5">
      <div className="adm-panel-head tw:!mb-4 tw:!flex tw:!items-start tw:!justify-between tw:!gap-3 tw:max-sm:!flex-col">
        <div>
          <h3 className="tw:!m-0 tw:!text-lg tw:!font-extrabold tw:!leading-tight tw:!text-slate-950">선택 학교 비교</h3>
          <p className="tw:!mt-1 tw:!text-xs tw:!leading-5 tw:!text-slate-500">관심 학교를 최대 3개까지 골라 같은 기준으로 나란히 비교합니다.</p>
        </div>
        <div className="adm-compare-actions tw:!flex tw:!shrink-0 tw:!items-center tw:!gap-2 tw:max-sm:!w-full tw:max-sm:!flex-col tw:max-sm:!items-stretch">
          <span className="adm-compare-status tw:!min-h-8 tw:!rounded-lg tw:!border tw:!border-slate-200 tw:!bg-slate-50 tw:!px-2.5 tw:!py-2 tw:!text-center tw:!text-[11px] tw:!font-extrabold tw:!leading-tight tw:!text-slate-500" aria-live="polite">
            {model.compareStatus}
          </span>
          <button type="button" className="adm-compare-clear tw:!inline-flex tw:!min-h-8 tw:!items-center tw:!justify-center tw:!rounded-lg tw:!border tw:!border-slate-200 tw:!bg-white tw:!px-3 tw:!text-xs tw:!font-extrabold tw:!text-slate-600 tw:!shadow-sm tw:transition-colors tw:hover:!border-blue-300 tw:hover:!text-blue-700 tw:focus-visible:!outline tw:focus-visible:!outline-2 tw:focus-visible:!outline-offset-2 tw:focus-visible:!outline-blue-500" onClick={actions.clearCompare}>
            선택 초기화
          </button>
        </div>
      </div>

      <div className="adm-compare-slots tw:!mb-3 tw:!grid tw:!grid-cols-1 tw:!gap-2 tw:md:!grid-cols-3" aria-live="polite">
        {Array.from({ length: model.compareLimit }, (_, index) => {
          const row = compareRows[index];
          if (!row) return <EmptyCompareSlot key={index} index={index} />;
          const grade = row.grade || 'pending';
          return (
            <div key={row.name} className={cx('adm-compare-slot', `grade-${grade}`, slotToneClass[grade], 'tw:!grid tw:!min-h-16 tw:!grid-cols-[auto_minmax(0,1fr)] tw:!items-center tw:!gap-x-2 tw:!rounded-lg tw:!border tw:!border-slate-200 tw:!border-l-4 tw:!bg-white tw:!p-3 tw:!shadow-sm')}>
              <span className="tw:!row-span-2 tw:!inline-flex tw:!h-7 tw:!w-7 tw:!items-center tw:!justify-center tw:!rounded-full tw:!bg-slate-100 tw:!font-mono tw:!text-xs tw:!font-extrabold tw:!text-slate-500">{index + 1}</span>
              <strong className="tw:!truncate tw:!text-sm tw:!font-extrabold tw:!text-slate-900">{row.name}</strong>
              <small className="tw:!text-xs tw:!font-bold tw:!text-slate-500">{row.gradeLabel} · {row.diffDisplay || '-'}</small>
            </div>
          );
        })}
      </div>

      <div className="adm-compare-table-wrap tw:!overflow-x-auto tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white">
        {compareRows.length ? <CompareTable model={model} /> : (
          <div className="adm-empty-card tw:!min-h-40 tw:!rounded-xl tw:!border tw:!border-dashed tw:!border-slate-300 tw:!bg-slate-50 tw:!p-5 tw:!text-center tw:!text-sm tw:!text-slate-500">
            <strong>비교할 학교가 없습니다</strong>
            <span>학교 카드에서 학교를 선택하면 비교표가 표시됩니다.</span>
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyCompareSlot({ index }) {
  return (
    <div className="adm-compare-slot empty tw:!grid tw:!min-h-16 tw:!grid-cols-[auto_minmax(0,1fr)] tw:!items-center tw:!gap-x-2 tw:!rounded-lg tw:!border tw:!border-dashed tw:!border-slate-300 tw:!border-l-4 tw:!bg-slate-50 tw:!p-3">
      <span className="tw:!row-span-2 tw:!inline-flex tw:!h-7 tw:!w-7 tw:!items-center tw:!justify-center tw:!rounded-full tw:!bg-white tw:!font-mono tw:!text-xs tw:!font-extrabold tw:!text-slate-500">{index + 1}</span>
      <strong className="tw:!truncate tw:!text-sm tw:!font-extrabold tw:!text-slate-600">학교 선택</strong>
      <small className="tw:!text-xs tw:!font-bold tw:!text-slate-400">학교 카드에서 추가</small>
    </div>
  );
}

function CompareTable({ model }) {
  const rows = [
    ['지원권', (row) => row.gradeLabel],
    ['내 기준점수', (row) => row.myValue],
    ['LEET 50%', (row) => row.leet50],
    ['LEET 75%', (row) => row.leet75],
    ['50% 대비', (row) => row.diffDisplay || '-'],
    ['학점 50%', (row) => row.gpa50],
    ['내 학점', () => model.myGpaLabel],
    ['영어 50%', (row) => row.eng50],
    ['등록인원', (row) => `${row.enrolled}명`],
    ['권역', (row) => row.regionText],
  ];

  return (
    <table className="adm-compare-table tw:!w-full tw:!min-w-[640px] tw:!table-fixed tw:!border-collapse">
      <thead>
        <tr>
          <th className="tw:!border-b tw:!border-slate-200 tw:!bg-slate-50 tw:!px-4 tw:!py-3 tw:!text-left tw:!text-xs tw:!font-extrabold tw:!text-slate-600">비교 항목</th>
          {model.compareRows.map((row) => (
            <th key={row.name} className="tw:!border-b tw:!border-slate-200 tw:!bg-slate-50 tw:!px-4 tw:!py-3 tw:!text-left tw:!text-xs tw:!font-extrabold tw:!text-slate-900">{row.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, getter]) => (
          <tr key={label} className="tw:transition-colors tw:hover:!bg-blue-50/40">
            <th className="tw:!w-32 tw:!border-b tw:!border-slate-100 tw:!px-4 tw:!py-3 tw:!text-left tw:!text-xs tw:!font-extrabold tw:!text-slate-500">{label}</th>
            {model.compareRows.map((row) => (
              <td key={row.name} className={cx(label === '50% 대비' ? diffToneClass[row.diffClass] : 'tw:!text-slate-900', 'tw:!border-b tw:!border-slate-100 tw:!px-4 tw:!py-3 tw:!text-left tw:!font-mono tw:!text-sm tw:!font-bold')}>
                {getter(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DetailTable({ model, actions }) {
  return (
    <details className="adm-table-details tw:!overflow-hidden tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!shadow-sm">
      <summary className="tw:!flex tw:!min-h-12 tw:!cursor-pointer tw:!items-center tw:!justify-between tw:!gap-3 tw:!px-4 tw:!text-sm tw:!font-extrabold tw:!text-slate-900 tw:focus-visible:!outline tw:focus-visible:!outline-2 tw:focus-visible:!outline-offset-2 tw:focus-visible:!outline-blue-500">
        <span>전체 상세 표</span>
        <span className="adm-table-meta tw:!ml-auto tw:!font-mono tw:!text-[11px] tw:!font-medium tw:!text-slate-500">{model.tableMeta}</span>
      </summary>
      <section className="adm-table-wrap tw:!border-0 tw:!border-t tw:!border-slate-200">
        <table className="adm-table">
          <colgroup>
            <col className="col-name" />
            <col className="col-enrolled" />
            <col className="col-leet" />
            <col className="col-leet75" />
            <col className="col-diff" />
            <col className="col-gpa" />
            <col className="col-eng" />
          </colgroup>
          <thead>
            <tr>
              <th data-col="name" style={{ textAlign: 'left' }}>학교명</th>
              <th data-col="enrolled">등록</th>
              <th data-col="leet50">LEET 50%</th>
              <th data-col="leet75">LEET 75%</th>
              <th data-col="leetDiff">50% 대비</th>
              <th data-col="gpa50">학점 50%</th>
              <th data-col="eng50">영어 50%</th>
            </tr>
          </thead>
          <tbody>
            {model.tableRows.length ? model.tableRows.map((row) => (
              <React.Fragment key={row.name}>
                {row.separatorBefore && (
                  <tr className="adm-separator-row"><td colSpan="7">▼ 이하 자체 환산점수 (표점합과 직접 비교 불가)</td></tr>
                )}
                <tr data-grade={row.grade || ''}>
                  <td className="school-name">
                    <button
                      className={cx('favorite-btn adm-favorite-btn', row.favorite && 'active')}
                      type="button"
                      aria-pressed={row.favorite}
                      aria-label={`${row.name} ${row.favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}`}
                      title={row.favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                      onClick={() => actions.toggleFavorite(row.name)}
                    >
                      {row.favorite ? '★' : '☆'}
                    </button>
                    <span className="adm-school-main">{row.name}</span>
                    {row.grade && <span className={cx('adm-grade-badge', `grade-${row.grade}`)}>{row.gradeLabel}</span>}
                    <span className={cx('adm-region-badge', row.regionCls)}>{row.regionText}</span>
                    {row.subText && <span className="adm-school-sub">{row.subText}</span>}
                  </td>
                  <td className="num">{row.enrolled}명</td>
                  <td className="num">{row.leet50}</td>
                  <td className="num">{row.leet75}</td>
                  <td className={cx('diff', row.diffClass)}>{row.diffDisplay || row.diffText}</td>
                  <td className="num" title={row.gpa50}>{row.gpa50}</td>
                  <td className="num" title={row.eng50}>{row.eng50}</td>
                </tr>
              </React.Fragment>
            )) : (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-mute)', fontStyle: 'italic' }}>선택된 학교가 없습니다. 학교 선택에서 하나 이상 선택하세요.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </details>
  );
}

function AdmissionApp({ model, actions }) {
  return (
    <>
      <Summary model={model} />
      <DecisionToolbar model={model} actions={actions} />
      <SchoolFilter model={model} actions={actions} />
      <Shortlist model={model} actions={actions} />
      <ComparePanel model={model} actions={actions} />
      <DetailTable model={model} actions={actions} />
    </>
  );
}

export { AdmissionApp };
