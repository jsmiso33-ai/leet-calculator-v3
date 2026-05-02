// ===========================================================================
// 기출 메타데이터: 분류 체계
// ===========================================================================
const LEET_TAXONOMY = {
  eon: {
    name: '언어이해',
    categories: {
      passage_lit:  { name: '인문/문학',   color: '#a855f7' },
      passage_phil: { name: '철학/사상',   color: '#7c3aed' },
      passage_soc:  { name: '사회과학',   color: '#3b82f6' },
      passage_sci:  { name: '자연과학/기술', color: '#10b981' },
      passage_law:  { name: '법/규범',    color: '#dc2626' },
      passage_art:  { name: '예술/문화',   color: '#ec4899' },
    },
  },
  chu: {
    name: '추리논증',
    categories: {
      formal_logic:    { name: '형식논리',    color: '#1e40af' },
      analytical:      { name: '분석추리',    color: '#0ea5e9' },
      argument_eval:   { name: '논증 평가',   color: '#059669' },
      argument_struct: { name: '논증 구조',   color: '#65a30d' },
      principle_apply: { name: '원칙 적용',   color: '#ca8a04' },
      case_analysis:   { name: '사례 분석',   color: '#dc2626' },
      quantitative:    { name: '수리/통계',   color: '#7c3aed' },
      dilemma:         { name: '딜레마/역설', color: '#be185d' },
    },
  },
};
const DIFFICULTY_LEVELS = {
  '하':   { code: 1, color: '#6db98a', expected_rate: 0.85 },
  '중하': { code: 2, color: '#9bc97a', expected_rate: 0.70 },
  '중':   { code: 3, color: '#d4b54a', expected_rate: 0.55 },
  '중상': { code: 4, color: '#d18d45', expected_rate: 0.40 },
  '상':   { code: 5, color: '#c44545', expected_rate: 0.25 },
};

// 학년도별 기출 메타데이터 (사용자가 채워야 함)
// 각 항목: { no, answer, category, subcategory, difficulty, tags, memo }
// answer/category/difficulty가 null이면 미입력 상태
const LEET_META = {
  2026: {
    eon: [
      // 지문 1 (1~3): 규범(법철학) — 지구법학과 지구권
      { no: 1,  answer: 4, category: 'passage_law',  subcategory: '법철학', difficulty: '중', passage_group: 1, tags: ['지구법학', '정보확인'], memo: '지구법학과 지구권' },
      { no: 2,  answer: 2, category: 'passage_law',  subcategory: '법철학', difficulty: '하', passage_group: 1, tags: ['지구법학', '정보평가'], memo: '지구법학과 지구권' },
      { no: 3,  answer: 3, category: 'passage_law',  subcategory: '법철학', difficulty: '중', passage_group: 1, tags: ['지구법학', '정보평가'], memo: '지구법학과 지구권' },
      // 지문 2 (4~6): 과학기술(기술) — 모델링 표준 DMN
      { no: 4,  answer: 2, category: 'passage_sci',  subcategory: '기술',   difficulty: '중', passage_group: 2, tags: ['DMN', '정보확인'], memo: '모델링 표준 DMN' },
      { no: 5,  answer: 1, category: 'passage_sci',  subcategory: '기술',   difficulty: '상', passage_group: 2, tags: ['DMN', '정보추론'], memo: '모델링 표준 DMN' },
      { no: 6,  answer: 4, category: 'passage_sci',  subcategory: '기술',   difficulty: '상', passage_group: 2, tags: ['DMN', '정보평가'], memo: '모델링 표준 DMN' },
      // 지문 3 (7~9): 사회(정치) — 집권자의 조작과 민주주의 퇴행
      { no: 7,  answer: 2, category: 'passage_soc',  subcategory: '정치',   difficulty: '하', passage_group: 3, tags: ['민주주의', '정보확인'], memo: '집권자의 조작과 민주주의 퇴행' },
      { no: 8,  answer: 3, category: 'passage_soc',  subcategory: '정치',   difficulty: '중', passage_group: 3, tags: ['민주주의', '정보추론'], memo: '집권자의 조작과 민주주의 퇴행' },
      { no: 9,  answer: 4, category: 'passage_soc',  subcategory: '정치',   difficulty: '중', passage_group: 3, tags: ['민주주의', '정보평가'], memo: '집권자의 조작과 민주주의 퇴행' },
      // 지문 4 (10~12): 인문(사학) — 중종 대 과거제와 천거제
      { no: 10, answer: 1, category: 'passage_lit',  subcategory: '사학',   difficulty: '중', passage_group: 4, tags: ['과거제', '정보확인'], memo: '중종 대 과거제와 천거제' },
      { no: 11, answer: 3, category: 'passage_lit',  subcategory: '사학',   difficulty: '하', passage_group: 4, tags: ['과거제', '정보추론'], memo: '중종 대 과거제와 천거제' },
      { no: 12, answer: 1, category: 'passage_lit',  subcategory: '사학',   difficulty: '중', passage_group: 4, tags: ['과거제', '정보평가'], memo: '중종 대 과거제와 천거제' },
      // 지문 5 (13~15): 인문(철학) — 수의주의와 불수의주의
      { no: 13, answer: 2, category: 'passage_phil', subcategory: '철학',   difficulty: '중', passage_group: 5, tags: ['수의주의', '정보확인'], memo: '수의주의와 불수의주의' },
      { no: 14, answer: 3, category: 'passage_phil', subcategory: '철학',   difficulty: '중', passage_group: 5, tags: ['수의주의', '주제파악'], memo: '수의주의와 불수의주의' },
      { no: 15, answer: 3, category: 'passage_phil', subcategory: '철학',   difficulty: '상', passage_group: 5, tags: ['수의주의', '정보평가'], memo: '수의주의와 불수의주의' },
      // 지문 6 (16~18): 사회(경제) — 제도와 성장 사이의 인과관계
      { no: 16, answer: 4, category: 'passage_soc',  subcategory: '경제',   difficulty: '중', passage_group: 6, tags: ['제도와성장', '정보확인'], memo: '제도와 성장 사이의 인과관계' },
      { no: 17, answer: 5, category: 'passage_soc',  subcategory: '경제',   difficulty: '상', passage_group: 6, tags: ['제도와성장', '정보추론'], memo: '제도와 성장 사이의 인과관계' },
      { no: 18, answer: 4, category: 'passage_soc',  subcategory: '경제',   difficulty: '중', passage_group: 6, tags: ['제도와성장', '정보평가'], memo: '제도와 성장 사이의 인과관계' },
      // 지문 7 (19~21): 인문(소설) — 최인훈 '크리스마스 캐럴 IV'
      { no: 19, answer: 3, category: 'passage_lit',  subcategory: '소설',   difficulty: '중', passage_group: 7, tags: ['최인훈', '정보확인'], memo: "최인훈 '크리스마스 캐럴 IV'" },
      { no: 20, answer: 2, category: 'passage_lit',  subcategory: '소설',   difficulty: '하', passage_group: 7, tags: ['최인훈', '주제파악'], memo: "최인훈 '크리스마스 캐럴 IV'" },
      { no: 21, answer: 5, category: 'passage_lit',  subcategory: '소설',   difficulty: '중', passage_group: 7, tags: ['최인훈', '정보평가'], memo: "최인훈 '크리스마스 캐럴 IV'" },
      // 지문 8 (22~24): 규범(윤리) — 행위와 무위의 도덕적 책임
      { no: 22, answer: 2, category: 'passage_law',  subcategory: '윤리',   difficulty: '하', passage_group: 8, tags: ['행위와무위', '정보확인'], memo: '행위와 무위의 도덕적 책임' },
      { no: 23, answer: 1, category: 'passage_law',  subcategory: '윤리',   difficulty: '중', passage_group: 8, tags: ['행위와무위', '정보추론'], memo: '행위와 무위의 도덕적 책임' },
      { no: 24, answer: 5, category: 'passage_law',  subcategory: '윤리',   difficulty: '중', passage_group: 8, tags: ['행위와무위', '정보평가'], memo: '행위와 무위의 도덕적 책임' },
      // 지문 9 (25~27): 과학기술(화학) — 혼합물에서 분몰 부피 변화
      { no: 25, answer: 5, category: 'passage_sci',  subcategory: '화학',   difficulty: '중', passage_group: 9, tags: ['분몰부피', '정보확인'], memo: '혼합물에서 분몰 부피 변화' },
      { no: 26, answer: 2, category: 'passage_sci',  subcategory: '화학',   difficulty: '상', passage_group: 9, tags: ['분몰부피', '정보추론'], memo: '혼합물에서 분몰 부피 변화' },
      { no: 27, answer: 3, category: 'passage_sci',  subcategory: '화학',   difficulty: '중', passage_group: 9, tags: ['분몰부피', '정보평가'], memo: '혼합물에서 분몰 부피 변화' },
      // 지문 10 (28~30): 규범(법사학) — 대한제국기 군주제와 공화제 논의
      { no: 28, answer: 4, category: 'passage_law',  subcategory: '법사학', difficulty: '중', passage_group: 10, tags: ['대한제국기', '정보확인'], memo: '대한제국기 군주제와 공화제 논의' },
      { no: 29, answer: 1, category: 'passage_law',  subcategory: '법사학', difficulty: '하', passage_group: 10, tags: ['대한제국기', '정보추론'], memo: '대한제국기 군주제와 공화제 논의' },
      { no: 30, answer: 2, category: 'passage_law',  subcategory: '법사학', difficulty: '중', passage_group: 10, tags: ['대한제국기', '주제파악'], memo: '대한제국기 군주제와 공화제 논의' },
    ],
    chu: [
      // 법규범 (1~13)
      { no: 1,  answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],         memo: '' },
      { no: 2,  answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '상', tags: ['언어 추리'],         memo: '' },
      { no: 3,  answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],         memo: '' },
      { no: 4,  answer: 5, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논쟁 및 반론'],       memo: '' },
      { no: 5,  answer: 3, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논쟁 및 반론'],       memo: '' },
      { no: 6,  answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],         memo: '' },
      { no: 7,  answer: 1, category: 'principle_apply', subcategory: '법규범',     difficulty: '상', tags: ['언어 추리'],         memo: '' },
      { no: 8,  answer: 4, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논쟁 및 반론'],       memo: '' },
      { no: 9,  answer: 5, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],         memo: '' },
      { no: 10, answer: 2, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논쟁 및 반론'],       memo: '' },
      { no: 11, answer: 1, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논쟁 및 반론'],       memo: '' },
      { no: 12, answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],         memo: '' },
      { no: 13, answer: 1, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논쟁 및 반론'],       memo: '' },
      // 인문 (14~16, 18~23)
      { no: 14, answer: 5, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],       memo: '' },
      { no: 15, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],       memo: '' },
      { no: 16, answer: 3, category: 'principle_apply', subcategory: '인문',       difficulty: '중', tags: ['언어 추리'],         memo: '' },
      // 사회 (17, 24~31)
      { no: 17, answer: 5, category: 'argument_eval',   subcategory: '사회',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 18, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],       memo: '' },
      { no: 19, answer: 2, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논쟁 및 반론'],       memo: '' },
      { no: 20, answer: 3, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],       memo: '' },
      { no: 21, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논쟁 및 반론'],       memo: '' },
      { no: 22, answer: 1, category: 'principle_apply', subcategory: '인문',       difficulty: '하', tags: ['언어 추리'],         memo: '' },
      { no: 23, answer: 5, category: 'argument_struct', subcategory: '인문',       difficulty: '상', tags: ['논증 분석'],         memo: '' },
      { no: 24, answer: 2, category: 'principle_apply', subcategory: '사회',       difficulty: '하', tags: ['언어 추리'],         memo: '' },
      { no: 25, answer: 4, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],         memo: '' },
      { no: 26, answer: 4, category: 'principle_apply', subcategory: '사회',       difficulty: '상', tags: ['언어 추리'],         memo: '' },
      { no: 27, answer: 3, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],         memo: '' },
      { no: 28, answer: 3, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],         memo: '' },
      { no: 29, answer: 2, category: 'argument_eval',   subcategory: '사회',       difficulty: '중', tags: ['논쟁 및 반론'],       memo: '' },
      { no: 30, answer: 2, category: 'argument_eval',   subcategory: '사회',       difficulty: '하', tags: ['논쟁 및 반론'],       memo: '' },
      { no: 31, answer: 1, category: 'principle_apply', subcategory: '사회',       difficulty: '상', tags: ['언어 추리'],         memo: '' },
      // 논리학수학 (32~34)
      { no: 32, answer: 4, category: 'analytical',      subcategory: '논리학수학', difficulty: '중', tags: ['모형 추리'],          memo: '' },
      { no: 33, answer: 4, category: 'analytical',      subcategory: '논리학수학', difficulty: '중', tags: ['모형 추리'],          memo: '' },
      { no: 34, answer: 3, category: 'analytical',      subcategory: '논리학수학', difficulty: '상', tags: ['모형 추리'],          memo: '' },
      // 과학기술 (35~40)
      { no: 35, answer: 2, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],         memo: '' },
      { no: 36, answer: 5, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],         memo: '' },
      { no: 37, answer: 5, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 38, answer: 3, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 39, answer: 5, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],         memo: '' },
      { no: 40, answer: 4, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '상', tags: ['논증 평가 및 문제 해결'], memo: '' },
    ],
  },
};

// 메타데이터 조회 헬퍼
function getMeta(year, section, no) {
  const yearData = LEET_META[year];
  if (!yearData || !yearData[section]) return null;
  return yearData[section].find(q => q.no === no) || null;
}
