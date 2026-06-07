// 기출문제 다운로드 (app.js renderExams/examRow 이식)
const YEARS = [];
for (let y = 2026; y >= 2009; y--) YEARS.push(y);

function ExamRow({ year, subj }) {
  const qName = `${year}학년도 ${subj}.pdf`;
  const aName = `${year}학년도 ${subj} 정답.pdf`;
  const q = encodeURI(`exams/${qName}`);
  const a = encodeURI(`exams/${aName}`);
  return (
    <div className="exam-row tw:!flex tw:!items-center tw:!justify-between tw:!gap-2 tw:!border-t tw:!border-slate-100 tw:!py-3">
      <span className="exam-subj tw:!text-sm tw:!font-extrabold tw:!text-slate-700">{subj}</span>
      <a className="exam-link tw:!inline-flex tw:!min-h-8 tw:!items-center tw:!justify-center tw:!rounded-lg tw:!border tw:!border-slate-200 tw:!bg-white tw:!px-3 tw:!text-xs tw:!font-extrabold tw:!text-slate-700 tw:!shadow-sm tw:transition-colors tw:hover:!border-blue-300 tw:hover:!text-blue-700" href={q} download={qName}>문제</a>
      <a className="exam-link exam-link-ans tw:!inline-flex tw:!min-h-8 tw:!items-center tw:!justify-center tw:!rounded-lg tw:!border tw:!border-blue-200 tw:!bg-blue-50 tw:!px-3 tw:!text-xs tw:!font-extrabold tw:!text-blue-700 tw:transition-colors tw:hover:!border-blue-300" href={a} download={aName}>정답</a>
    </div>
  );
}

export default function ExamsTab() {
  return (
    <>
      <section className="input-area tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-5 tw:!shadow-sm tw:md:!p-7">
        <div className="section-label tw:!text-2xl tw:!font-extrabold tw:!text-slate-950">LEET 기출문제 다운로드</div>
        <div className="section-desc tw:!mt-2 tw:!max-w-3xl tw:!text-sm tw:!leading-6 tw:!text-slate-600">2009~2026학년도 법학적성시험 기출문제와 정답입니다. 과목을 클릭하면 새 탭에서 PDF가 열립니다. (출처: 법학전문대학원협의회 공개 자료)</div>
        <p className="exams-copyright tw:!mt-3 tw:!text-xs tw:!font-semibold tw:!text-slate-500">※ 법학적성시험 문제·정답의 저작권 및 출판권은 법학전문대학원협의회에 있습니다.</p>
      </section>
      <section className="exams-grid tw:!grid tw:!grid-cols-1 tw:!gap-3 tw:md:!grid-cols-2 tw:xl:!grid-cols-3" id="examsGrid">
        {YEARS.map((y) => (
          <div key={y} className="exam-card tw:!rounded-xl tw:!border tw:!border-slate-200 tw:!bg-white tw:!p-4 tw:!shadow-sm tw:transition tw:duration-200 tw:hover:!-translate-y-0.5 tw:hover:!border-blue-200 tw:hover:!shadow-lg tw:motion-reduce:!transform-none tw:motion-reduce:!transition-none">
            <a className="exam-year tw:!mb-2 tw:!block tw:!text-lg tw:!font-extrabold tw:!text-slate-950 tw:focus-visible:!outline tw:focus-visible:!outline-2 tw:focus-visible:!outline-offset-2 tw:focus-visible:!outline-blue-500" href={`exams/${y}/`}>{y}학년도</a>
            <div className="exam-rows tw:!grid">
              <ExamRow year={y} subj="언어이해" />
              <ExamRow year={y} subj="추리논증" />
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
