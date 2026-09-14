// 기출문제 다운로드 (app.js renderExams/examRow 이식)
const YEARS = [];
for (let y = 2027; y >= 2009; y--) YEARS.push(y);

function ExamRow({ year, subj }) {
  const qName = `${year}학년도 ${subj}.pdf`;
  const aName = `${year}학년도 ${subj} 정답.pdf`;
  const q = encodeURI(`exams/${qName}`);
  const a = encodeURI(`exams/${aName}`);
  return (
    <div className="exam-row">
      <span className="exam-subj">{subj}</span>
      <a className="exam-link" href={q} download={qName}>문제</a>
      <a className="exam-link exam-link-ans" href={a} download={aName}>정답</a>
    </div>
  );
}

export default function ExamsTab() {
  return (
    <>
      <section className="input-area">
        <div className="section-label">LEET 기출문제 다운로드</div>
        <div className="section-desc">2009~2027학년도 법학적성시험 기출문제와 정답입니다. 과목을 클릭하면 새 탭에서 PDF가 열립니다. (출처: 법학전문대학원협의회 공개 자료)</div>
        <p className="exams-copyright">※ 법학적성시험 문제·정답의 저작권 및 출판권은 법학전문대학원협의회에 있습니다.</p>
      </section>
      <section className="exams-grid" id="examsGrid">
        {YEARS.map((y) => (
          <div key={y} className="exam-card">
            <a className="exam-year" href={`exams/${y}/`}>{y}학년도</a>
            <div className="exam-rows">
              <ExamRow year={y} subj="언어이해" />
              <ExamRow year={y} subj="추리논증" />
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
