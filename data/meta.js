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
  2025: {
    eon: [
      // 지문 1 (1~3): 규범(법학) — 범죄소설에서 법과 문학의 상호작용
      { no: 1,  answer: 2, category: 'passage_law',  subcategory: '법학',     difficulty: '하', passage_group: 1, tags: ['정보확인'], memo: '범죄소설에서 법과 문학의 상호작용' },
      { no: 2,  answer: 2, category: 'passage_law',  subcategory: '법학',     difficulty: '중', passage_group: 1, tags: ['정보추론'], memo: '범죄소설에서 법과 문학의 상호작용' },
      { no: 3,  answer: 5, category: 'passage_law',  subcategory: '법학',     difficulty: '하', passage_group: 1, tags: ['주제파악'], memo: '범죄소설에서 법과 문학의 상호작용' },
      // 지문 2 (4~6): 과학기술(생물) — 프로피린증
      { no: 4,  answer: 4, category: 'passage_sci',  subcategory: '생물',     difficulty: '하', passage_group: 2, tags: ['정보확인'], memo: '프로피린증' },
      { no: 5,  answer: 4, category: 'passage_sci',  subcategory: '생물',     difficulty: '중', passage_group: 2, tags: ['정보추론'], memo: '프로피린증' },
      { no: 6,  answer: 3, category: 'passage_sci',  subcategory: '생물',     difficulty: '상', passage_group: 2, tags: ['정보평가'], memo: '프로피린증' },
      // 지문 3 (7~9): 인문(사학) — 고대 그리스 로마의 소년애
      { no: 7,  answer: 2, category: 'passage_lit',  subcategory: '사학',     difficulty: '하', passage_group: 3, tags: ['주제파악'], memo: '고대 그리스 로마의 소년애' },
      { no: 8,  answer: 3, category: 'passage_lit',  subcategory: '사학',     difficulty: '하', passage_group: 3, tags: ['정보확인'], memo: '고대 그리스 로마의 소년애' },
      { no: 9,  answer: 2, category: 'passage_lit',  subcategory: '사학',     difficulty: '중', passage_group: 3, tags: ['정보평가'], memo: '고대 그리스 로마의 소년애' },
      // 지문 4 (10~12): 사회(정치) — 사법심사와 여론의 관계
      { no: 10, answer: 3, category: 'passage_soc',  subcategory: '정치',     difficulty: '하', passage_group: 4, tags: ['정보확인'], memo: '사법심사와 여론의 관계' },
      { no: 11, answer: 3, category: 'passage_soc',  subcategory: '정치',     difficulty: '하', passage_group: 4, tags: ['정보추론'], memo: '사법심사와 여론의 관계' },
      { no: 12, answer: 2, category: 'passage_soc',  subcategory: '정치',     difficulty: '중', passage_group: 4, tags: ['정보평가'], memo: '사법심사와 여론의 관계' },
      // 지문 5 (13~15): 규범(윤리) — 공리주의와 반공리주의
      { no: 13, answer: 1, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 5, tags: ['정보확인'], memo: '공리주의와 반공리주의' },
      { no: 14, answer: 5, category: 'passage_law',  subcategory: '윤리',     difficulty: '상', passage_group: 5, tags: ['정보추론'], memo: '공리주의와 반공리주의' },
      { no: 15, answer: 4, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 5, tags: ['정보평가'], memo: '공리주의와 반공리주의' },
      // 지문 6 (16~18): 사회(경제) — 솔로우 성장모형
      { no: 16, answer: 1, category: 'passage_soc',  subcategory: '경제',     difficulty: '하', passage_group: 6, tags: ['정보확인'], memo: '솔로우 성장모형' },
      { no: 17, answer: 1, category: 'passage_soc',  subcategory: '경제',     difficulty: '중', passage_group: 6, tags: ['정보추론'], memo: '솔로우 성장모형' },
      { no: 18, answer: 2, category: 'passage_soc',  subcategory: '경제',     difficulty: '상', passage_group: 6, tags: ['정보평가'], memo: '솔로우 성장모형' },
      // 지문 7 (19~21): 규범(법학) — 배아에 관한 법령
      { no: 19, answer: 4, category: 'passage_law',  subcategory: '법학',     difficulty: '중', passage_group: 7, tags: ['정보확인'], memo: '배아에 관한 법령' },
      { no: 20, answer: 1, category: 'passage_law',  subcategory: '법학',     difficulty: '상', passage_group: 7, tags: ['정보추론'], memo: '배아에 관한 법령' },
      { no: 21, answer: 2, category: 'passage_law',  subcategory: '법학',     difficulty: '중', passage_group: 7, tags: ['정보평가'], memo: '배아에 관한 법령' },
      // 지문 8 (22~24): 인문(철학) — 「변론」과 「크리톤」 해석
      { no: 22, answer: 5, category: 'passage_phil', subcategory: '철학',     difficulty: '하', passage_group: 8, tags: ['정보확인'], memo: '「변론」과 「크리톤」 해석' },
      { no: 23, answer: 4, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 8, tags: ['정보평가'], memo: '「변론」과 「크리톤」 해석' },
      { no: 24, answer: 5, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 8, tags: ['정보추론'], memo: '「변론」과 「크리톤」 해석' },
      // 지문 9 (25~27): 과학기술(기술) — 데이터베이스 트랜잭션
      { no: 25, answer: 1, category: 'passage_sci',  subcategory: '기술',     difficulty: '중', passage_group: 9, tags: ['정보확인'], memo: '데이터베이스 트랜잭션' },
      { no: 26, answer: 5, category: 'passage_sci',  subcategory: '기술',     difficulty: '중', passage_group: 9, tags: ['정보추론'], memo: '데이터베이스 트랜잭션' },
      { no: 27, answer: 4, category: 'passage_sci',  subcategory: '기술',     difficulty: '상', passage_group: 9, tags: ['정보평가'], memo: '데이터베이스 트랜잭션' },
      // 지문 10 (28~30): 인문(문학비평) — 희곡과 공연의 관계
      { no: 28, answer: 3, category: 'passage_lit',  subcategory: '문학비평', difficulty: '하', passage_group: 10, tags: ['정보확인'], memo: '희곡과 공연의 관계' },
      { no: 29, answer: 4, category: 'passage_lit',  subcategory: '문학비평', difficulty: '중', passage_group: 10, tags: ['정보추론'], memo: '희곡과 공연의 관계' },
      { no: 30, answer: 3, category: 'passage_lit',  subcategory: '문학비평', difficulty: null, passage_group: 10, tags: ['정보평가'], memo: '희곡과 공연의 관계' },
    ],
    chu: [
      // 법규범 (1~13)
      { no: 1,  answer: 1, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 2,  answer: 1, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 3,  answer: 5, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 4,  answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 5,  answer: 1, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 6,  answer: 5, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 7,  answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 8,  answer: 5, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 9,  answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 10, answer: 3, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 11, answer: 4, category: 'principle_apply', subcategory: '법규범',     difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 12, answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 13, answer: 4, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      // 인문 (14~25)
      { no: 14, answer: 2, category: 'principle_apply', subcategory: '인문',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 15, answer: 2, category: 'principle_apply', subcategory: '인문',       difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 16, answer: 2, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 17, answer: 4, category: 'principle_apply', subcategory: '인문',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 18, answer: 4, category: 'principle_apply', subcategory: '인문',       difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 19, answer: 5, category: 'principle_apply', subcategory: '인문',       difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 20, answer: 4, category: 'principle_apply', subcategory: '인문',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 21, answer: 2, category: 'argument_struct', subcategory: '인문',       difficulty: '하', tags: ['논증 분석'],            memo: '' },
      { no: 22, answer: 2, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 23, answer: 5, category: 'argument_eval',   subcategory: '인문',       difficulty: '상', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 24, answer: 2, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 25, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      // 과학기술 (26)
      { no: 26, answer: 1, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      // 사회 (27~32)
      { no: 27, answer: 4, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 28, answer: 3, category: 'argument_eval',   subcategory: '사회',       difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 29, answer: 1, category: 'argument_eval',   subcategory: '사회',       difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 30, answer: 1, category: 'argument_eval',   subcategory: '사회',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 31, answer: 4, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 32, answer: 5, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      // 논리학수학 (33~35)
      { no: 33, answer: 1, category: 'analytical',      subcategory: '논리학수학', difficulty: '상', tags: ['모형 추리'],            memo: '' },
      { no: 34, answer: 4, category: 'analytical',      subcategory: '논리학수학', difficulty: '상', tags: ['모형 추리'],            memo: '' },
      { no: 35, answer: 4, category: 'analytical',      subcategory: '논리학수학', difficulty: '상', tags: ['모형 추리'],            memo: '' },
      // 과학기술 (36~40)
      { no: 36, answer: 2, category: 'principle_apply', subcategory: '과학기술',   difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 37, answer: 3, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 38, answer: 3, category: 'principle_apply', subcategory: '과학기술',   difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 39, answer: 3, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 40, answer: 1, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
    ],
  },
  2024: {
    eon: [
      // 지문 1 (1~3): 규범(법철학) — 법학의 학문성에 관한 논쟁
      { no: 1,  answer: 3, category: 'passage_law',  subcategory: '법철학',   difficulty: '상', passage_group: 1, tags: ['주제파악'], memo: '법학의 학문성에 관한 논쟁' },
      { no: 2,  answer: 4, category: 'passage_law',  subcategory: '법철학',   difficulty: '하', passage_group: 1, tags: ['정보확인'], memo: '법학의 학문성에 관한 논쟁' },
      { no: 3,  answer: 3, category: 'passage_law',  subcategory: '법철학',   difficulty: '중', passage_group: 1, tags: ['정보추론'], memo: '법학의 학문성에 관한 논쟁' },
      // 지문 2 (4~6): 과학기술(기술) — 개인정보 비식별화 기술
      { no: 4,  answer: 2, category: 'passage_sci',  subcategory: '기술',     difficulty: '중', passage_group: 2, tags: ['정보확인'], memo: '개인정보 비식별화 기술' },
      { no: 5,  answer: 5, category: 'passage_sci',  subcategory: '기술',     difficulty: '중', passage_group: 2, tags: ['정보추론'], memo: '개인정보 비식별화 기술' },
      { no: 6,  answer: 3, category: 'passage_sci',  subcategory: '기술',     difficulty: '중', passage_group: 2, tags: ['정보평가'], memo: '개인정보 비식별화 기술' },
      // 지문 3 (7~9): 사회(정치) — 투표 비용과 투표 참여
      { no: 7,  answer: 5, category: 'passage_soc',  subcategory: '정치',     difficulty: '하', passage_group: 3, tags: ['정보확인'], memo: '투표 비용과 투표 참여' },
      { no: 8,  answer: 2, category: 'passage_soc',  subcategory: '정치',     difficulty: '하', passage_group: 3, tags: ['정보평가'], memo: '투표 비용과 투표 참여' },
      { no: 9,  answer: 5, category: 'passage_soc',  subcategory: '정치',     difficulty: '중', passage_group: 3, tags: ['정보추론'], memo: '투표 비용과 투표 참여' },
      // 지문 4 (10~12): 인문(철학) — 아퀴나스의 진리론과 그에 대한 비판
      { no: 10, answer: 4, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 4, tags: ['정보확인'], memo: '아퀴나스의 진리론과 그에 대한 비판' },
      { no: 11, answer: 1, category: 'passage_phil', subcategory: '철학',     difficulty: '상', passage_group: 4, tags: ['정보추론'], memo: '아퀴나스의 진리론과 그에 대한 비판' },
      { no: 12, answer: 3, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 4, tags: ['주제파악'], memo: '아퀴나스의 진리론과 그에 대한 비판' },
      // 지문 5 (13~15): 사회(경제) — 사회적 가치와 사회성과
      { no: 13, answer: 1, category: 'passage_soc',  subcategory: '경제',     difficulty: '중', passage_group: 5, tags: ['정보확인'], memo: '사회적 가치와 사회성과' },
      { no: 14, answer: 4, category: 'passage_soc',  subcategory: '경제',     difficulty: '중', passage_group: 5, tags: ['정보추론'], memo: '사회적 가치와 사회성과' },
      { no: 15, answer: 3, category: 'passage_soc',  subcategory: '경제',     difficulty: '상', passage_group: 5, tags: ['정보평가'], memo: '사회적 가치와 사회성과' },
      // 지문 6 (16~18): 인문(문학비평) — 문학적 언어와 시적 진실
      { no: 16, answer: 3, category: 'passage_lit',  subcategory: '문학비평', difficulty: '중', passage_group: 6, tags: ['정보확인'], memo: '문학적 언어와 시적 진실' },
      { no: 17, answer: 2, category: 'passage_lit',  subcategory: '문학비평', difficulty: '중', passage_group: 6, tags: ['정보추론'], memo: '문학적 언어와 시적 진실' },
      { no: 18, answer: 1, category: 'passage_lit',  subcategory: '문학비평', difficulty: '중', passage_group: 6, tags: ['정보평가'], memo: '문학적 언어와 시적 진실' },
      // 지문 7 (19~21): 인문(고전) — 박세당 「예술변」
      { no: 19, answer: 5, category: 'passage_lit',  subcategory: '고전',     difficulty: '상', passage_group: 7, tags: ['정보확인'], memo: '박세당 「예술변」' },
      { no: 20, answer: 4, category: 'passage_lit',  subcategory: '고전',     difficulty: '중', passage_group: 7, tags: ['주제파악'], memo: '박세당 「예술변」' },
      { no: 21, answer: 1, category: 'passage_lit',  subcategory: '고전',     difficulty: '상', passage_group: 7, tags: ['정보평가'], memo: '박세당 「예술변」' },
      // 지문 8 (22~24): 과학기술(생물) — 광역학 치료 기전
      { no: 22, answer: 4, category: 'passage_sci',  subcategory: '생물',     difficulty: '중', passage_group: 8, tags: ['정보확인'], memo: '광역학 치료 기전' },
      { no: 23, answer: 2, category: 'passage_sci',  subcategory: '생물',     difficulty: '상', passage_group: 8, tags: ['정보평가'], memo: '광역학 치료 기전' },
      { no: 24, answer: 2, category: 'passage_sci',  subcategory: '생물',     difficulty: '상', passage_group: 8, tags: ['정보추론'], memo: '광역학 치료 기전' },
      // 지문 9 (25~27): 규범(윤리) — 흄의 도덕 판단에 대한 해석
      { no: 25, answer: 5, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 9, tags: ['정보확인'], memo: '흄의 도덕 판단에 대한 해석' },
      { no: 26, answer: 4, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 9, tags: ['정보추론'], memo: '흄의 도덕 판단에 대한 해석' },
      { no: 27, answer: 1, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 9, tags: ['정보평가'], memo: '흄의 도덕 판단에 대한 해석' },
      // 지문 10 (28~30): 규범(법학) — 미성년 자녀 반환에 관한 국제 협약
      { no: 28, answer: 2, category: 'passage_law',  subcategory: '법학',     difficulty: '중', passage_group: 10, tags: ['정보확인'], memo: '미성년 자녀 반환에 관한 국제 협약' },
      { no: 29, answer: 2, category: 'passage_law',  subcategory: '법학',     difficulty: '중', passage_group: 10, tags: ['정보추론'], memo: '미성년 자녀 반환에 관한 국제 협약' },
      { no: 30, answer: 4, category: 'passage_law',  subcategory: '법학',     difficulty: '중', passage_group: 10, tags: ['정보평가'], memo: '미성년 자녀 반환에 관한 국제 협약' },
    ],
    chu: [
      // 법규범 (1~12)
      { no: 1,  answer: 4, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 2,  answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 3,  answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 4,  answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 5,  answer: 3, category: 'argument_eval',   subcategory: '법규범',     difficulty: '상', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 6,  answer: 3, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 7,  answer: 5, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 8,  answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 9,  answer: 4, category: 'principle_apply', subcategory: '법규범',     difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 10, answer: 4, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 11, answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 12, answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '상', tags: ['언어 추리'],            memo: '' },
      // 인문 (13~26)
      { no: 13, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 14, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 15, answer: 5, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 16, answer: 3, category: 'principle_apply', subcategory: '인문',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 17, answer: 2, category: 'principle_apply', subcategory: '인문',       difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 18, answer: 5, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 19, answer: 5, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 20, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 21, answer: 2, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 22, answer: 2, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 23, answer: 1, category: 'principle_apply', subcategory: '인문',       difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 24, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 25, answer: 4, category: 'argument_struct', subcategory: '인문',       difficulty: '중', tags: ['논증 분석'],            memo: '' },
      { no: 26, answer: 4, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      // 사회 (27~32)
      { no: 27, answer: 2, category: 'argument_eval',   subcategory: '사회',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 28, answer: 3, category: 'argument_eval',   subcategory: '사회',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 29, answer: 5, category: 'argument_eval',   subcategory: '사회',       difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 30, answer: 1, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 31, answer: 1, category: 'principle_apply', subcategory: '사회',       difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 32, answer: 5, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      // 논리학수학 (33~35)
      { no: 33, answer: 5, category: 'analytical',      subcategory: '논리학수학', difficulty: '상', tags: ['모형 추리'],            memo: '' },
      { no: 34, answer: 4, category: 'analytical',      subcategory: '논리학수학', difficulty: '상', tags: ['모형 추리'],            memo: '' },
      { no: 35, answer: 1, category: 'analytical',      subcategory: '논리학수학', difficulty: '상', tags: ['모형 추리'],            memo: '' },
      // 과학기술/사회 (36~40)
      { no: 36, answer: 2, category: 'principle_apply', subcategory: '과학기술',   difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 37, answer: 4, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 38, answer: 3, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 39, answer: 5, category: 'principle_apply', subcategory: '과학기술',   difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 40, answer: 3, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
    ],
  },
  2023: {
    eon: [
      // 지문 1 (1~3): 규범(법철학) — 판사의 진술에 대한 논의
      { no: 1,  answer: 3, category: 'passage_law',  subcategory: '법철학',   difficulty: '중', passage_group: 1, tags: ['정보확인'], memo: '판사의 진술에 대한 논의' },
      { no: 2,  answer: 1, category: 'passage_law',  subcategory: '법철학',   difficulty: '하', passage_group: 1, tags: ['정보추론'], memo: '판사의 진술에 대한 논의' },
      { no: 3,  answer: 5, category: 'passage_law',  subcategory: '법철학',   difficulty: '하', passage_group: 1, tags: ['정보평가'], memo: '판사의 진술에 대한 논의' },
      // 지문 2 (4~6): 규범(윤리) — 식물인간의 도덕적 고려
      { no: 4,  answer: 2, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 2, tags: ['정보확인'], memo: '식물인간의 도덕적 고려' },
      { no: 5,  answer: 4, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 2, tags: ['정보추론'], memo: '식물인간의 도덕적 고려' },
      { no: 6,  answer: 3, category: 'passage_law',  subcategory: '윤리',     difficulty: '하', passage_group: 2, tags: ['정보평가'], memo: '식물인간의 도덕적 고려' },
      // 지문 3 (7~9): 과학기술(생물) — 단백질 합성과 신호서열 이론
      { no: 7,  answer: 5, category: 'passage_sci',  subcategory: '생물',     difficulty: '중', passage_group: 3, tags: ['정보확인'], memo: '단백질 합성과 신호서열 이론' },
      { no: 8,  answer: 5, category: 'passage_sci',  subcategory: '생물',     difficulty: '중', passage_group: 3, tags: ['정보추론'], memo: '단백질 합성과 신호서열 이론' },
      { no: 9,  answer: 3, category: 'passage_sci',  subcategory: '생물',     difficulty: '중', passage_group: 3, tags: ['정보평가'], memo: '단백질 합성과 신호서열 이론' },
      // 지문 4 (10~12): 인문(사학) — 미국 역사학의 흐름
      { no: 10, answer: 4, category: 'passage_lit',  subcategory: '사학',     difficulty: '하', passage_group: 4, tags: ['정보확인'], memo: '미국 역사학의 흐름' },
      { no: 11, answer: 1, category: 'passage_lit',  subcategory: '사학',     difficulty: '중', passage_group: 4, tags: ['주제파악'], memo: '미국 역사학의 흐름' },
      { no: 12, answer: 2, category: 'passage_lit',  subcategory: '사학',     difficulty: '중', passage_group: 4, tags: ['정보평가'], memo: '미국 역사학의 흐름' },
      // 지문 5 (13~15): 사회(정치) — 나이의 정치적 효과
      { no: 13, answer: 2, category: 'passage_soc',  subcategory: '정치',     difficulty: '중', passage_group: 5, tags: ['정보확인'], memo: '나이의 정치적 효과' },
      { no: 14, answer: 5, category: 'passage_soc',  subcategory: '정치',     difficulty: '중', passage_group: 5, tags: ['정보추론'], memo: '나이의 정치적 효과' },
      { no: 15, answer: 4, category: 'passage_soc',  subcategory: '정치',     difficulty: '중', passage_group: 5, tags: ['정보평가'], memo: '나이의 정치적 효과' },
      // 지문 6 (16~18): 인문(문학비평) — 김자림 「이민선」과 근대화 여성 담론 (가/나)
      { no: 16, answer: 1, category: 'passage_lit',  subcategory: '문학비평', difficulty: '중', passage_group: 6, tags: ['정보확인'], memo: '김자림 「이민선」과 근대화 여성 담론' },
      { no: 17, answer: 1, category: 'passage_lit',  subcategory: '문학비평', difficulty: '중', passage_group: 6, tags: ['주제파악'], memo: '김자림 「이민선」과 근대화 여성 담론' },
      { no: 18, answer: 5, category: 'passage_lit',  subcategory: '문학비평', difficulty: '중', passage_group: 6, tags: ['정보평가'], memo: '김자림 「이민선」과 근대화 여성 담론' },
      // 지문 7 (19~21): 사회(경제) — 제도가능곡선 모델
      { no: 19, answer: 1, category: 'passage_soc',  subcategory: '경제',     difficulty: '상', passage_group: 7, tags: ['정보확인'], memo: '제도가능곡선 모델' },
      { no: 20, answer: 3, category: 'passage_soc',  subcategory: '경제',     difficulty: '상', passage_group: 7, tags: ['정보추론'], memo: '제도가능곡선 모델' },
      { no: 21, answer: 1, category: 'passage_soc',  subcategory: '경제',     difficulty: '중', passage_group: 7, tags: ['정보평가'], memo: '제도가능곡선 모델' },
      // 지문 8 (22~24): 인문(철학) — 헤겔의 '낭만적인 것'의 의미
      { no: 22, answer: 2, category: 'passage_phil', subcategory: '철학',     difficulty: '상', passage_group: 8, tags: ['주제파악'], memo: "헤겔의 '낭만적인 것'의 의미" },
      { no: 23, answer: 2, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 8, tags: ['정보추론'], memo: "헤겔의 '낭만적인 것'의 의미" },
      { no: 24, answer: 4, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 8, tags: ['정보평가'], memo: "헤겔의 '낭만적인 것'의 의미" },
      // 지문 9 (25~27): 과학기술(생물) — 중력파 검출 실험의 원리
      { no: 25, answer: 3, category: 'passage_sci',  subcategory: '생물',     difficulty: '중', passage_group: 9, tags: ['정보확인'], memo: '중력파 검출 실험의 원리' },
      { no: 26, answer: 5, category: 'passage_sci',  subcategory: '생물',     difficulty: '상', passage_group: 9, tags: ['정보추론'], memo: '중력파 검출 실험의 원리' },
      { no: 27, answer: 3, category: 'passage_sci',  subcategory: '생물',     difficulty: '상', passage_group: 9, tags: ['정보평가'], memo: '중력파 검출 실험의 원리' },
      // 지문 10 (28~30): 규범(법철학) — 법정립적 폭력과 법보존적 폭력
      { no: 28, answer: 5, category: 'passage_law',  subcategory: '법철학',   difficulty: '하', passage_group: 10, tags: ['정보확인'], memo: '법정립적 폭력과 법보존적 폭력' },
      { no: 29, answer: 5, category: 'passage_law',  subcategory: '법철학',   difficulty: '중', passage_group: 10, tags: ['정보추론'], memo: '법정립적 폭력과 법보존적 폭력' },
      { no: 30, answer: 3, category: 'passage_law',  subcategory: '법철학',   difficulty: '중', passage_group: 10, tags: ['정보평가'], memo: '법정립적 폭력과 법보존적 폭력' },
    ],
    chu: [
      // 법규범 (1~12)
      { no: 1,  answer: 1, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 2,  answer: 5, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 3,  answer: 4, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 4,  answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 5,  answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 6,  answer: 5, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 7,  answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 8,  answer: 4, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 9,  answer: 2, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 10, answer: 4, category: 'principle_apply', subcategory: '법규범',     difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 11, answer: 3, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 12, answer: 1, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      // 인문 (13~25)
      { no: 13, answer: 3, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 14, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 15, answer: 4, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 16, answer: 1, category: 'principle_apply', subcategory: '인문',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 17, answer: 3, category: 'principle_apply', subcategory: '인문',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 18, answer: 2, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 19, answer: 3, category: 'argument_struct', subcategory: '인문',       difficulty: '중', tags: ['논증 분석'],            memo: '' },
      { no: 20, answer: 3, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 21, answer: 2, category: 'argument_eval',   subcategory: '인문',       difficulty: '상', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 22, answer: 3, category: 'argument_eval',   subcategory: '인문',       difficulty: '상', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 23, answer: 5, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 24, answer: 4, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 25, answer: 1, category: 'principle_apply', subcategory: '인문',       difficulty: '하', tags: ['언어 추리'],            memo: '' },
      // 사회 (26~31)
      { no: 26, answer: 1, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 27, answer: 2, category: 'argument_eval',   subcategory: '사회',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 28, answer: 1, category: 'argument_eval',   subcategory: '사회',       difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 29, answer: 1, category: 'argument_eval',   subcategory: '사회',       difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 30, answer: 5, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 31, answer: 5, category: 'principle_apply', subcategory: '사회',       difficulty: '상', tags: ['언어 추리'],            memo: '' },
      // 논리학수학 (32~34)
      { no: 32, answer: 5, category: 'analytical',      subcategory: '논리학수학', difficulty: '중', tags: ['모형 추리'],            memo: '' },
      { no: 33, answer: 2, category: 'analytical',      subcategory: '논리학수학', difficulty: '상', tags: ['모형 추리'],            memo: '' },
      { no: 34, answer: 2, category: 'analytical',      subcategory: '논리학수학', difficulty: '상', tags: ['모형 추리'],            memo: '' },
      // 사회/과학기술 (35~40)
      { no: 35, answer: 4, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 36, answer: 4, category: 'principle_apply', subcategory: '사회',       difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 37, answer: 2, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 38, answer: 4, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 39, answer: 1, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 40, answer: 3, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
    ],
  },
  2022: {
    eon: [
      // 지문 1 (1~3): 규범(법사학) — 부랑인 정책
      { no: 1,  answer: 3, category: 'passage_law',  subcategory: '법사학',   difficulty: '중', passage_group: 1, tags: ['정보확인'], memo: '부랑인 정책' },
      { no: 2,  answer: 5, category: 'passage_law',  subcategory: '법사학',   difficulty: '중', passage_group: 1, tags: ['정보평가'], memo: '부랑인 정책' },
      { no: 3,  answer: 5, category: 'passage_law',  subcategory: '법사학',   difficulty: '하', passage_group: 1, tags: ['정보평가'], memo: '부랑인 정책' },
      // 지문 2 (4~6): 인문(철학) — 환경 위기와 철학적 근대 담론
      { no: 4,  answer: 4, category: 'passage_phil', subcategory: '철학',     difficulty: '하', passage_group: 2, tags: ['정보확인'], memo: '환경 위기와 철학적 근대 담론' },
      { no: 5,  answer: 1, category: 'passage_phil', subcategory: '철학',     difficulty: '하', passage_group: 2, tags: ['정보추론'], memo: '환경 위기와 철학적 근대 담론' },
      { no: 6,  answer: 2, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 2, tags: ['정보추론'], memo: '환경 위기와 철학적 근대 담론' },
      // 지문 3 (7~9): 인문(문학비평) — 소설의 화자에 대한 논의
      { no: 7,  answer: 1, category: 'passage_lit',  subcategory: '문학비평', difficulty: '하', passage_group: 3, tags: ['정보확인'], memo: '소설의 화자에 대한 논의' },
      { no: 8,  answer: 4, category: 'passage_lit',  subcategory: '문학비평', difficulty: '중', passage_group: 3, tags: ['주제파악'], memo: '소설의 화자에 대한 논의' },
      { no: 9,  answer: 3, category: 'passage_lit',  subcategory: '문학비평', difficulty: '중', passage_group: 3, tags: ['정보평가'], memo: '소설의 화자에 대한 논의' },
      // 지문 4 (10~12): 과학기술(생물) — 망막의 신호 처리
      { no: 10, answer: 3, category: 'passage_sci',  subcategory: '생물',     difficulty: '중', passage_group: 4, tags: ['정보확인'], memo: '망막의 신호 처리' },
      { no: 11, answer: 4, category: 'passage_sci',  subcategory: '생물',     difficulty: '상', passage_group: 4, tags: ['정보추론'], memo: '망막의 신호 처리' },
      { no: 12, answer: 5, category: 'passage_sci',  subcategory: '생물',     difficulty: '상', passage_group: 4, tags: ['정보평가'], memo: '망막의 신호 처리' },
      // 지문 5 (13~15): 인문(사학) — 파시즘의 정의에 대한 견해
      { no: 13, answer: 1, category: 'passage_lit',  subcategory: '사학',     difficulty: '중', passage_group: 5, tags: ['정보확인'], memo: '파시즘의 정의에 대한 견해' },
      { no: 14, answer: 1, category: 'passage_lit',  subcategory: '사학',     difficulty: '중', passage_group: 5, tags: ['정보추론'], memo: '파시즘의 정의에 대한 견해' },
      { no: 15, answer: 2, category: 'passage_lit',  subcategory: '사학',     difficulty: '중', passage_group: 5, tags: ['정보평가'], memo: '파시즘의 정의에 대한 견해' },
      // 지문 6 (16~18): 과학기술(기술) — 클러스터링
      { no: 16, answer: 4, category: 'passage_sci',  subcategory: '기술',     difficulty: '중', passage_group: 6, tags: ['정보확인'], memo: '클러스터링' },
      { no: 17, answer: 4, category: 'passage_sci',  subcategory: '기술',     difficulty: '상', passage_group: 6, tags: ['정보추론'], memo: '클러스터링' },
      { no: 18, answer: 2, category: 'passage_sci',  subcategory: '기술',     difficulty: '중', passage_group: 6, tags: ['정보평가'], memo: '클러스터링' },
      // 지문 7 (19~21): 사회(경제) — 소유와 지배의 분리
      { no: 19, answer: 4, category: 'passage_soc',  subcategory: '경제',     difficulty: '중', passage_group: 7, tags: ['주제파악'], memo: '소유와 지배의 분리' },
      { no: 20, answer: 1, category: 'passage_soc',  subcategory: '경제',     difficulty: '상', passage_group: 7, tags: ['정보추론'], memo: '소유와 지배의 분리' },
      { no: 21, answer: 5, category: 'passage_soc',  subcategory: '경제',     difficulty: '중', passage_group: 7, tags: ['정보평가'], memo: '소유와 지배의 분리' },
      // 지문 8 (22~24): 사회(정치) — 미국 민주주의 규범
      { no: 22, answer: 5, category: 'passage_soc',  subcategory: '정치',     difficulty: '하', passage_group: 8, tags: ['정보확인'], memo: '미국 민주주의 규범' },
      { no: 23, answer: 3, category: 'passage_soc',  subcategory: '정치',     difficulty: '하', passage_group: 8, tags: ['정보추론'], memo: '미국 민주주의 규범' },
      { no: 24, answer: 3, category: 'passage_soc',  subcategory: '정치',     difficulty: '중', passage_group: 8, tags: ['정보평가'], memo: '미국 민주주의 규범' },
      // 지문 9 (25~27): 규범(윤리) — 인공 지능과 인공 감정
      { no: 25, answer: 2, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 9, tags: ['정보확인'], memo: '인공 지능과 인공 감정' },
      { no: 26, answer: 2, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 9, tags: ['정보평가'], memo: '인공 지능과 인공 감정' },
      { no: 27, answer: 5, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 9, tags: ['정보평가'], memo: '인공 지능과 인공 감정' },
      // 지문 10 (28~30): 규범(법철학) — 칸트의 법규범 설명 체계
      { no: 28, answer: 5, category: 'passage_law',  subcategory: '법철학',   difficulty: '상', passage_group: 10, tags: ['주제파악'], memo: '칸트의 법규범 설명 체계' },
      { no: 29, answer: 3, category: 'passage_law',  subcategory: '법철학',   difficulty: '상', passage_group: 10, tags: ['정보추론'], memo: '칸트의 법규범 설명 체계' },
      { no: 30, answer: 2, category: 'passage_law',  subcategory: '법철학',   difficulty: '상', passage_group: 10, tags: ['정보평가'], memo: '칸트의 법규범 설명 체계' },
    ],
    chu: [
      // 법규범 (1~14)
      { no: 1,  answer: 1, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 2,  answer: 2, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 3,  answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 4,  answer: 4, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 5,  answer: 1, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 6,  answer: 1, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 7,  answer: 4, category: 'principle_apply', subcategory: '법규범',     difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 8,  answer: 2, category: 'argument_struct', subcategory: '법규범',     difficulty: '하', tags: ['논증 분석'],            memo: '' },
      { no: 9,  answer: 1, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 10, answer: 5, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 11, answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 12, answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 13, answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 14, answer: 5, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      // 인문 (15~24)
      { no: 15, answer: 4, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 16, answer: 4, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 17, answer: 5, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 18, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '상', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 19, answer: 5, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 20, answer: 2, category: 'principle_apply', subcategory: '인문',       difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 21, answer: 3, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 22, answer: 4, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 23, answer: 4, category: 'principle_apply', subcategory: '인문',       difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 24, answer: 1, category: 'principle_apply', subcategory: '인문',       difficulty: '상', tags: ['언어 추리'],            memo: '' },
      // 사회/인문 혼합 (25~31)
      { no: 25, answer: 3, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 26, answer: 2, category: 'principle_apply', subcategory: '인문',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 27, answer: 3, category: 'principle_apply', subcategory: '사회',       difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 28, answer: 2, category: 'argument_eval',   subcategory: '사회',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 29, answer: 3, category: 'argument_eval',   subcategory: '사회',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 30, answer: 2, category: 'argument_eval',   subcategory: '사회',       difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 31, answer: 2, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      // 논리학수학 (32~34)
      { no: 32, answer: 2, category: 'analytical',      subcategory: '논리학수학', difficulty: '중', tags: ['모형 추리'],            memo: '' },
      { no: 33, answer: 4, category: 'analytical',      subcategory: '논리학수학', difficulty: '상', tags: ['모형 추리'],            memo: '' },
      { no: 34, answer: 3, category: 'analytical',      subcategory: '논리학수학', difficulty: '중', tags: ['모형 추리'],            memo: '' },
      // 사회/인문/과학기술 (35~40)
      { no: 35, answer: 5, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 36, answer: 1, category: 'argument_struct', subcategory: '인문',       difficulty: '중', tags: ['논증 분석'],            memo: '' },
      { no: 37, answer: 5, category: 'principle_apply', subcategory: '인문',       difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 38, answer: 3, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '상', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 39, answer: 1, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 40, answer: 3, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
    ],
  },
  2021: {
    eon: [
      // 지문 1 (1~3): 과학기술(기술) — 프로세스 마이닝
      { no: 1,  answer: 1, category: 'passage_sci',  subcategory: '기술',     difficulty: '중', passage_group: 1, tags: ['정보확인'], memo: '프로세스 마이닝' },
      { no: 2,  answer: 4, category: 'passage_sci',  subcategory: '기술',     difficulty: '중', passage_group: 1, tags: ['정보추론'], memo: '프로세스 마이닝' },
      { no: 3,  answer: 5, category: 'passage_sci',  subcategory: '기술',     difficulty: '상', passage_group: 1, tags: ['정보평가'], memo: '프로세스 마이닝' },
      // 지문 2 (4~6): 인문(비평) — 고진의 풍경론
      { no: 4,  answer: 5, category: 'passage_lit',  subcategory: '비평',     difficulty: '중', passage_group: 2, tags: ['정보확인'], memo: '고진의 풍경론' },
      { no: 5,  answer: 5, category: 'passage_lit',  subcategory: '비평',     difficulty: '중', passage_group: 2, tags: ['정보추론'], memo: '고진의 풍경론' },
      { no: 6,  answer: 3, category: 'passage_lit',  subcategory: '비평',     difficulty: '중', passage_group: 2, tags: ['정보평가'], memo: '고진의 풍경론' },
      // 지문 3 (7~9): 규범(윤리) — 롤스의 평등론에 대한 싱어의 비판
      { no: 7,  answer: 4, category: 'passage_law',  subcategory: '윤리',     difficulty: '하', passage_group: 3, tags: ['주제파악'], memo: '롤스의 평등론에 대한 싱어의 비판' },
      { no: 8,  answer: 1, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 3, tags: ['정보추론'], memo: '롤스의 평등론에 대한 싱어의 비판' },
      { no: 9,  answer: 4, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 3, tags: ['정보평가'], memo: '롤스의 평등론에 대한 싱어의 비판' },
      // 지문 4 (10~12): 인문(사학) — 윤기 「논형법」
      { no: 10, answer: 1, category: 'passage_lit',  subcategory: '사학',     difficulty: '상', passage_group: 4, tags: ['주제파악'], memo: '윤기 「논형법」' },
      { no: 11, answer: 2, category: 'passage_lit',  subcategory: '사학',     difficulty: '중', passage_group: 4, tags: ['정보추론'], memo: '윤기 「논형법」' },
      { no: 12, answer: 5, category: 'passage_lit',  subcategory: '사학',     difficulty: '상', passage_group: 4, tags: ['정보평가'], memo: '윤기 「논형법」' },
      // 지문 5 (13~15): 사회(정치) — 인권에 대한 트로트의 견해
      { no: 13, answer: 3, category: 'passage_soc',  subcategory: '정치',     difficulty: '중', passage_group: 5, tags: ['정보확인'], memo: '인권에 대한 트로트의 견해' },
      { no: 14, answer: 2, category: 'passage_soc',  subcategory: '정치',     difficulty: '중', passage_group: 5, tags: ['주제파악'], memo: '인권에 대한 트로트의 견해' },
      { no: 15, answer: 4, category: 'passage_soc',  subcategory: '정치',     difficulty: '중', passage_group: 5, tags: ['정보평가'], memo: '인권에 대한 트로트의 견해' },
      // 지문 6 (16~18): 인문(사학) — 수피즘이 제국주의에 저항할 수 있었던 원동력
      { no: 16, answer: 5, category: 'passage_lit',  subcategory: '사학',     difficulty: '하', passage_group: 6, tags: ['정보확인'], memo: '수피즘이 제국주의에 저항할 수 있었던 원동력' },
      { no: 17, answer: 5, category: 'passage_lit',  subcategory: '사학',     difficulty: '하', passage_group: 6, tags: ['주제파악'], memo: '수피즘이 제국주의에 저항할 수 있었던 원동력' },
      { no: 18, answer: 1, category: 'passage_lit',  subcategory: '사학',     difficulty: '중', passage_group: 6, tags: ['정보추론'], memo: '수피즘이 제국주의에 저항할 수 있었던 원동력' },
      // 지문 7 (19~21): 인문(철학) — 귀신 개념에 대한 성리학적 논쟁
      { no: 19, answer: 4, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 7, tags: ['정보확인'], memo: '귀신 개념에 대한 성리학적 논쟁' },
      { no: 20, answer: 1, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 7, tags: ['정보추론'], memo: '귀신 개념에 대한 성리학적 논쟁' },
      { no: 21, answer: 1, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 7, tags: ['주제파악'], memo: '귀신 개념에 대한 성리학적 논쟁' },
      // 지문 8 (22~24): 사회(경제) — 삭스가 주장한 빈곤의 원인에 대한 경제학자들의 비판
      { no: 22, answer: 3, category: 'passage_soc',  subcategory: '경제',     difficulty: '중', passage_group: 8, tags: ['정보확인'], memo: '삭스가 주장한 빈곤의 원인에 대한 경제학자들의 비판' },
      { no: 23, answer: 2, category: 'passage_soc',  subcategory: '경제',     difficulty: '중', passage_group: 8, tags: ['주제파악'], memo: '삭스가 주장한 빈곤의 원인에 대한 경제학자들의 비판' },
      { no: 24, answer: 2, category: 'passage_soc',  subcategory: '경제',     difficulty: '상', passage_group: 8, tags: ['정보평가'], memo: '삭스가 주장한 빈곤의 원인에 대한 경제학자들의 비판' },
      // 지문 9 (25~27): 과학기술(과학) — 바르부르크 효과
      { no: 25, answer: 4, category: 'passage_sci',  subcategory: '과학',     difficulty: '상', passage_group: 9, tags: ['정보확인'], memo: '바르부르크 효과' },
      { no: 26, answer: 5, category: 'passage_sci',  subcategory: '과학',     difficulty: '상', passage_group: 9, tags: ['정보추론'], memo: '바르부르크 효과' },
      { no: 27, answer: 3, category: 'passage_sci',  subcategory: '과학',     difficulty: '중', passage_group: 9, tags: ['정보평가'], memo: '바르부르크 효과' },
      // 지문 10 (28~30): 규범(법철학) — 법률 문언 해석에 관한 법학방법론적·법철학적 논의
      { no: 28, answer: 2, category: 'passage_law',  subcategory: '법철학',   difficulty: '상', passage_group: 10, tags: ['주제파악'], memo: '법률 문언 해석에 관한 법학방법론적·법철학적 논의' },
      { no: 29, answer: 2, category: 'passage_law',  subcategory: '법철학',   difficulty: '상', passage_group: 10, tags: ['정보추론'], memo: '법률 문언 해석에 관한 법학방법론적·법철학적 논의' },
      { no: 30, answer: 3, category: 'passage_law',  subcategory: '법철학',   difficulty: '중', passage_group: 10, tags: ['정보평가'], memo: '법률 문언 해석에 관한 법학방법론적·법철학적 논의' },
    ],
    chu: [
      // 법규범 (1~13)
      { no: 1,  answer: 3, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 2,  answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 3,  answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 4,  answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 5,  answer: 4, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 6,  answer: 5, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 7,  answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 8,  answer: 4, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 9,  answer: 1, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 10, answer: 5, category: 'principle_apply', subcategory: '법규범',     difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 11, answer: 4, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 12, answer: 5, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 13, answer: 3, category: 'argument_eval',   subcategory: '법규범',     difficulty: '상', tags: ['논증 평가 및 문제 해결'], memo: '' },
      // 인문 (14~20)
      { no: 14, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 15, answer: 4, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 16, answer: 2, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 17, answer: 3, category: 'argument_struct', subcategory: '인문',       difficulty: '중', tags: ['논증 분석'],            memo: '' },
      { no: 18, answer: 2, category: 'argument_eval',   subcategory: '인문',       difficulty: '상', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 19, answer: 2, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 20, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      // 논리학수학 (21~23)
      { no: 21, answer: 1, category: 'analytical',      subcategory: '논리학수학', difficulty: '상', tags: ['모형 추리'],            memo: '' },
      { no: 22, answer: 3, category: 'analytical',      subcategory: '논리학수학', difficulty: '중', tags: ['모형 추리'],            memo: '' },
      { no: 23, answer: 5, category: 'analytical',      subcategory: '논리학수학', difficulty: '중', tags: ['모형 추리'],            memo: '' },
      // 사회/인문 (24~33)
      { no: 24, answer: 2, category: 'argument_eval',   subcategory: '사회',       difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 25, answer: 5, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 26, answer: 1, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 27, answer: 3, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 28, answer: 4, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 29, answer: 4, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 30, answer: 3, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 31, answer: 4, category: 'principle_apply', subcategory: '인문',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 32, answer: 5, category: 'principle_apply', subcategory: '사회',       difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 33, answer: 5, category: 'principle_apply', subcategory: '인문',       difficulty: '상', tags: ['언어 추리'],            memo: '' },
      // 사회/인문/과학기술 (34~40)
      { no: 34, answer: 5, category: 'argument_eval',   subcategory: '사회',       difficulty: '상', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 35, answer: 3, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 36, answer: 2, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '상', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 37, answer: 2, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '상', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 38, answer: 1, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 39, answer: 1, category: 'principle_apply', subcategory: '과학기술',   difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 40, answer: 2, category: 'principle_apply', subcategory: '과학기술',   difficulty: '상', tags: ['언어 추리'],            memo: '' },
    ],
  },
  2020: {
    eon: [
      // 지문 1 (1~3): 규범(법철학) — 법률 언어에서 '물(物)'의 의미 변화
      { no: 1,  answer: 4, category: 'passage_law',  subcategory: '법철학',   difficulty: '중', passage_group: 1, tags: ['정보확인'], memo: "법률 언어에서 '물(物)'의 의미 변화" },
      { no: 2,  answer: 4, category: 'passage_law',  subcategory: '법철학',   difficulty: '중', passage_group: 1, tags: ['정보추론'], memo: "법률 언어에서 '물(物)'의 의미 변화" },
      { no: 3,  answer: 2, category: 'passage_law',  subcategory: '법철학',   difficulty: '중', passage_group: 1, tags: ['정보평가'], memo: "법률 언어에서 '물(物)'의 의미 변화" },
      // 지문 2 (4~6): 인문(사학) — 조선 초 중흥 규제에 관한 법적 논의
      { no: 4,  answer: 2, category: 'passage_lit',  subcategory: '사학',     difficulty: '하', passage_group: 2, tags: ['정보확인'], memo: '조선 초 중흥 규제에 관한 법적 논의' },
      { no: 5,  answer: 5, category: 'passage_lit',  subcategory: '사학',     difficulty: '중', passage_group: 2, tags: ['주제파악'], memo: '조선 초 중흥 규제에 관한 법적 논의' },
      { no: 6,  answer: 5, category: 'passage_lit',  subcategory: '사학',     difficulty: '상', passage_group: 2, tags: ['정보추론'], memo: '조선 초 중흥 규제에 관한 법적 논의' },
      // 지문 3 (7~9): 과학기술(생물) — 오믹스
      { no: 7,  answer: 5, category: 'passage_sci',  subcategory: '생물',     difficulty: '중', passage_group: 3, tags: ['정보확인'], memo: '오믹스' },
      { no: 8,  answer: 2, category: 'passage_sci',  subcategory: '생물',     difficulty: '중', passage_group: 3, tags: ['정보추론'], memo: '오믹스' },
      { no: 9,  answer: 3, category: 'passage_sci',  subcategory: '생물',     difficulty: '중', passage_group: 3, tags: ['정보평가'], memo: '오믹스' },
      // 지문 4 (10~12): 인문(문학비평) — 채만식의 「탁류」 비평
      { no: 10, answer: 1, category: 'passage_lit',  subcategory: '문학비평', difficulty: '중', passage_group: 4, tags: ['주제파악'], memo: '채만식의 「탁류」 비평' },
      { no: 11, answer: 2, category: 'passage_lit',  subcategory: '문학비평', difficulty: '하', passage_group: 4, tags: ['정보추론'], memo: '채만식의 「탁류」 비평' },
      { no: 12, answer: 5, category: 'passage_lit',  subcategory: '문학비평', difficulty: '중', passage_group: 4, tags: ['정보평가'], memo: '채만식의 「탁류」 비평' },
      // 지문 5 (13~15): 사회(경제) — 헨리 조지의 토지가치세
      { no: 13, answer: 1, category: 'passage_soc',  subcategory: '경제',     difficulty: '중', passage_group: 5, tags: ['주제파악'], memo: '헨리 조지의 토지가치세' },
      { no: 14, answer: 5, category: 'passage_soc',  subcategory: '경제',     difficulty: '중', passage_group: 5, tags: ['정보추론'], memo: '헨리 조지의 토지가치세' },
      { no: 15, answer: 4, category: 'passage_soc',  subcategory: '경제',     difficulty: '중', passage_group: 5, tags: ['정보평가'], memo: '헨리 조지의 토지가치세' },
      // 지문 6 (16~18): 사회(일반) — 지식인의 정의와 역할에 대한 논쟁
      { no: 16, answer: 3, category: 'passage_soc',  subcategory: '일반',     difficulty: '중', passage_group: 6, tags: ['정보확인'], memo: '지식인의 정의와 역할에 대한 논쟁' },
      { no: 17, answer: 1, category: 'passage_soc',  subcategory: '일반',     difficulty: '중', passage_group: 6, tags: ['정보추론'], memo: '지식인의 정의와 역할에 대한 논쟁' },
      { no: 18, answer: 5, category: 'passage_soc',  subcategory: '일반',     difficulty: '중', passage_group: 6, tags: ['주제파악'], memo: '지식인의 정의와 역할에 대한 논쟁' },
      // 지문 7 (19~21): 인문(철학) — 시간여행의 논리적 문제
      { no: 19, answer: 3, category: 'passage_phil', subcategory: '철학',     difficulty: '하', passage_group: 7, tags: ['주제파악'], memo: '시간여행의 논리적 문제' },
      { no: 20, answer: 3, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 7, tags: ['정보추론'], memo: '시간여행의 논리적 문제' },
      { no: 21, answer: 4, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 7, tags: ['정보평가'], memo: '시간여행의 논리적 문제' },
      // 지문 8 (22~24): 규범(윤리) — 도덕적 행위의 조건
      { no: 22, answer: 5, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 8, tags: ['정보확인'], memo: '도덕적 행위의 조건' },
      { no: 23, answer: 1, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 8, tags: ['정보추론'], memo: '도덕적 행위의 조건' },
      { no: 24, answer: 2, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 8, tags: ['정보평가'], memo: '도덕적 행위의 조건' },
      // 지문 9 (25~27): 과학기술(기술) — 우주선 랑데부와 궤도 운동 원리
      { no: 25, answer: 2, category: 'passage_sci',  subcategory: '기술',     difficulty: '중', passage_group: 9, tags: ['정보확인'], memo: '우주선 랑데부와 궤도 운동 원리' },
      { no: 26, answer: 3, category: 'passage_sci',  subcategory: '기술',     difficulty: '상', passage_group: 9, tags: ['정보추론'], memo: '우주선 랑데부와 궤도 운동 원리' },
      { no: 27, answer: 4, category: 'passage_sci',  subcategory: '기술',     difficulty: '상', passage_group: 9, tags: ['정보평가'], memo: '우주선 랑데부와 궤도 운동 원리' },
      // 지문 10 (28~30): 규범(법학) — 언론연대학에 기초한 법적 증거의 활용
      { no: 28, answer: 1, category: 'passage_law',  subcategory: '법학',     difficulty: '상', passage_group: 10, tags: ['정보추론'], memo: '언론연대학에 기초한 법적 증거의 활용' },
      { no: 29, answer: 3, category: 'passage_law',  subcategory: '법학',     difficulty: '중', passage_group: 10, tags: ['정보추론'], memo: '언론연대학에 기초한 법적 증거의 활용' },
      { no: 30, answer: 3, category: 'passage_law',  subcategory: '법학',     difficulty: '중', passage_group: 10, tags: ['정보평가'], memo: '언론연대학에 기초한 법적 증거의 활용' },
    ],
    chu: [
      // 법규범 (1~11)
      { no: 1,  answer: 3, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 2,  answer: 2, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 3,  answer: 4, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 4,  answer: 3, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 5,  answer: 3, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 6,  answer: 3, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 7,  answer: 5, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 8,  answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 9,  answer: 4, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 10, answer: 1, category: 'principle_apply', subcategory: '법규범',     difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 11, answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      // 사회/법규범 (12~13)
      { no: 12, answer: 5, category: 'principle_apply', subcategory: '사회',       difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 13, answer: 5, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      // 인문 (14~22)
      { no: 14, answer: 2, category: 'principle_apply', subcategory: '인문',       difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 15, answer: 2, category: 'principle_apply', subcategory: '인문',       difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 16, answer: 2, category: 'principle_apply', subcategory: '인문',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 17, answer: 3, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 18, answer: 5, category: 'principle_apply', subcategory: '인문',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 19, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 20, answer: 5, category: 'argument_struct', subcategory: '인문',       difficulty: '중', tags: ['논증 분석'],            memo: '' },
      { no: 21, answer: 5, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 22, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      // 사회/인문 혼합 (23~30)
      { no: 23, answer: 1, category: 'analytical',      subcategory: '사회',       difficulty: '중', tags: ['모형 추리'],            memo: '' },
      { no: 24, answer: 3, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 25, answer: 4, category: 'argument_eval',   subcategory: '사회',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 26, answer: 3, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 27, answer: 5, category: 'argument_eval',   subcategory: '사회',       difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 28, answer: 4, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 29, answer: 2, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 30, answer: 4, category: 'argument_eval',   subcategory: '사회',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      // 논리학수학 (31~33)
      { no: 31, answer: 4, category: 'principle_apply', subcategory: '논리학수학', difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 32, answer: 3, category: 'analytical',      subcategory: '논리학수학', difficulty: '중', tags: ['모형 추리'],            memo: '' },
      { no: 33, answer: 4, category: 'analytical',      subcategory: '논리학수학', difficulty: '중', tags: ['모형 추리'],            memo: '' },
      // 과학기술/인문 (34~40)
      { no: 34, answer: 1, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 35, answer: 5, category: 'principle_apply', subcategory: '인문',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 36, answer: 2, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 37, answer: 1, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 38, answer: 5, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 39, answer: 1, category: 'principle_apply', subcategory: '과학기술',   difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 40, answer: 2, category: 'principle_apply', subcategory: '과학기술',   difficulty: '상', tags: ['언어 추리'],            memo: '' },
    ],
  },
  2019: {
    eon: [
      // 지문 1 (1~3): 규범(법철학) — 법의 본질에 대한 이론들
      { no: 1,  answer: 1, category: 'passage_law',  subcategory: '법철학',   difficulty: '중', passage_group: 1, tags: ['정보확인'], memo: '법의 본질에 대한 이론들' },
      { no: 2,  answer: 1, category: 'passage_law',  subcategory: '법철학',   difficulty: '중', passage_group: 1, tags: ['정보추론'], memo: '법의 본질에 대한 이론들' },
      { no: 3,  answer: 3, category: 'passage_law',  subcategory: '법철학',   difficulty: '하', passage_group: 1, tags: ['정보추론'], memo: '법의 본질에 대한 이론들' },
      // 지문 2 (4~6): 인문(사학) — 아리스티데스 「로마 송사」
      { no: 4,  answer: 4, category: 'passage_lit',  subcategory: '사학',     difficulty: '하', passage_group: 2, tags: ['정보확인'], memo: '아리스티데스 「로마 송사」' },
      { no: 5,  answer: 5, category: 'passage_lit',  subcategory: '사학',     difficulty: '상', passage_group: 2, tags: ['관점파악'], memo: '아리스티데스 「로마 송사」' },
      { no: 6,  answer: 1, category: 'passage_lit',  subcategory: '사학',     difficulty: '상', passage_group: 2, tags: ['정보평가'], memo: '아리스티데스 「로마 송사」' },
      // 지문 3 (7~9): 과학기술(과학) — 전자 현미경
      { no: 7,  answer: 5, category: 'passage_sci',  subcategory: '과학',     difficulty: '중', passage_group: 3, tags: ['정보확인'], memo: '전자 현미경' },
      { no: 8,  answer: 2, category: 'passage_sci',  subcategory: '과학',     difficulty: '상', passage_group: 3, tags: ['정보추론'], memo: '전자 현미경' },
      { no: 9,  answer: 4, category: 'passage_sci',  subcategory: '과학',     difficulty: '중', passage_group: 3, tags: ['정보추론'], memo: '전자 현미경' },
      // 지문 4 (10~12): 인문(문학비평) — 멜랑콜리
      { no: 10, answer: 2, category: 'passage_lit',  subcategory: '문학비평', difficulty: '하', passage_group: 4, tags: ['정보확인'], memo: '멜랑콜리' },
      { no: 11, answer: 2, category: 'passage_lit',  subcategory: '문학비평', difficulty: '상', passage_group: 4, tags: ['정보추론'], memo: '멜랑콜리' },
      { no: 12, answer: 4, category: 'passage_lit',  subcategory: '문학비평', difficulty: '중', passage_group: 4, tags: ['정보평가'], memo: '멜랑콜리' },
      // 지문 5 (13~15): 규범(윤리학) — 동물감정론과 동물권리론
      { no: 13, answer: 2, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 5, tags: ['관점파악'], memo: '동물감정론과 동물권리론' },
      { no: 14, answer: 2, category: 'passage_law',  subcategory: '윤리',     difficulty: '중', passage_group: 5, tags: ['정보추론'], memo: '동물감정론과 동물권리론' },
      { no: 15, answer: 1, category: 'passage_law',  subcategory: '윤리',     difficulty: '하', passage_group: 5, tags: ['정보추론'], memo: '동물감정론과 동물권리론' },
      // 지문 6 (16~18): 사회(경제) — 전통적 경제학과 행동경제학의 '이상 현상' 해석
      { no: 16, answer: 5, category: 'passage_soc',  subcategory: '경제',     difficulty: '하', passage_group: 6, tags: ['정보확인'], memo: "전통적 경제학과 행동경제학의 '이상 현상' 해석" },
      { no: 17, answer: 3, category: 'passage_soc',  subcategory: '경제',     difficulty: '하', passage_group: 6, tags: ['관점파악'], memo: "전통적 경제학과 행동경제학의 '이상 현상' 해석" },
      { no: 18, answer: 2, category: 'passage_soc',  subcategory: '경제',     difficulty: '중', passage_group: 6, tags: ['정보평가'], memo: "전통적 경제학과 행동경제학의 '이상 현상' 해석" },
      // 지문 7 (19~21): 인문(철학) — 뒤집힌 감각질 사고 실험
      { no: 19, answer: 3, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 7, tags: ['정보확인'], memo: '뒤집힌 감각질 사고 실험' },
      { no: 20, answer: 2, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 7, tags: ['정보추론'], memo: '뒤집힌 감각질 사고 실험' },
      { no: 21, answer: 4, category: 'passage_phil', subcategory: '철학',     difficulty: '중', passage_group: 7, tags: ['정보평가'], memo: '뒤집힌 감각질 사고 실험' },
      // 지문 8 (22~24): 과학기술(기술) — 온톨로지
      { no: 22, answer: 4, category: 'passage_sci',  subcategory: '기술',     difficulty: '상', passage_group: 8, tags: ['정보확인'], memo: '온톨로지' },
      { no: 23, answer: 3, category: 'passage_sci',  subcategory: '기술',     difficulty: '중', passage_group: 8, tags: ['정보추론'], memo: '온톨로지' },
      { no: 24, answer: 2, category: 'passage_sci',  subcategory: '기술',     difficulty: '상', passage_group: 8, tags: ['정보평가'], memo: '온톨로지' },
      // 지문 9 (25~27): 사회(정치) — 극우민족주의
      { no: 25, answer: 5, category: 'passage_soc',  subcategory: '정치',     difficulty: '중', passage_group: 9, tags: ['정보확인'], memo: '극우민족주의' },
      { no: 26, answer: 4, category: 'passage_soc',  subcategory: '정치',     difficulty: '중', passage_group: 9, tags: ['주제파악'], memo: '극우민족주의' },
      { no: 27, answer: 5, category: 'passage_soc',  subcategory: '정치',     difficulty: '중', passage_group: 9, tags: ['정보평가'], memo: '극우민족주의' },
      // 지문 10 (28~30): 규범(법사학) — 근대법의 기획
      { no: 28, answer: 2, category: 'passage_law',  subcategory: '법사학',   difficulty: '중', passage_group: 10, tags: ['정보확인'], memo: '근대법의 기획' },
      { no: 29, answer: 1, category: 'passage_law',  subcategory: '법사학',   difficulty: '중', passage_group: 10, tags: ['정보추론'], memo: '근대법의 기획' },
      { no: 30, answer: 3, category: 'passage_law',  subcategory: '법사학',   difficulty: null, passage_group: 10, tags: ['정보추론'], memo: '근대법의 기획' },
    ],
    chu: [
      // 법규범 (1~14)
      { no: 1,  answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 2,  answer: 1, category: 'argument_eval',   subcategory: '법규범',     difficulty: '상', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 3,  answer: 1, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 4,  answer: 4, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 5,  answer: 5, category: 'argument_eval',   subcategory: '법규범',     difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 6,  answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 7,  answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 8,  answer: 2, category: 'principle_apply', subcategory: '법규범',     difficulty: '상', tags: ['언어 추리'],            memo: '' },
      { no: 9,  answer: 4, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 10, answer: 3, category: 'argument_eval',   subcategory: '법규범',     difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 11, answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 12, answer: 3, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 13, answer: 1, category: 'principle_apply', subcategory: '법규범',     difficulty: '하', tags: ['언어 추리'],            memo: '' },
      { no: 14, answer: 5, category: 'principle_apply', subcategory: '법규범',     difficulty: '중', tags: ['언어 추리'],            memo: '' },
      // 인문 (15~22)
      { no: 15, answer: 4, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 16, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 17, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 18, answer: 1, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 19, answer: 4, category: 'argument_eval',   subcategory: '인문',       difficulty: '하', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 20, answer: 4, category: 'argument_struct', subcategory: '인문',       difficulty: '중', tags: ['논증 분석'],            memo: '' },
      { no: 21, answer: 2, category: 'principle_apply', subcategory: '인문',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 22, answer: 3, category: 'argument_eval',   subcategory: '인문',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      // 사회 (23~28)
      { no: 23, answer: 4, category: 'argument_eval',   subcategory: '사회',       difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 24, answer: 5, category: 'argument_eval',   subcategory: '사회',       difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 25, answer: 5, category: 'argument_eval',   subcategory: '사회',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 26, answer: 4, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 27, answer: 1, category: 'argument_eval',   subcategory: '사회',       difficulty: '중', tags: ['논쟁 및 반론'],          memo: '' },
      { no: 28, answer: 4, category: 'principle_apply', subcategory: '사회',       difficulty: '중', tags: ['언어 추리'],            memo: '' },
      // 논리학수학 (29~32)
      { no: 29, answer: 3, category: 'analytical',      subcategory: '논리학수학', difficulty: '중', tags: ['모형 추리'],            memo: '' },
      { no: 30, answer: 5, category: 'analytical',      subcategory: '논리학수학', difficulty: '중', tags: ['모형 추리'],            memo: '' },
      { no: 31, answer: 5, category: 'analytical',      subcategory: '논리학수학', difficulty: '상', tags: ['모형 추리'],            memo: '' },
      { no: 32, answer: 3, category: 'analytical',      subcategory: '논리학수학', difficulty: '중', tags: ['모형 추리'],            memo: '' },
      // 과학기술 (33~40)
      { no: 33, answer: 2, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '하', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 34, answer: 3, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '중', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 35, answer: 5, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 36, answer: 2, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 37, answer: 4, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 38, answer: 3, category: 'principle_apply', subcategory: '과학기술',   difficulty: '중', tags: ['언어 추리'],            memo: '' },
      { no: 39, answer: 4, category: 'argument_eval',   subcategory: '과학기술',   difficulty: '상', tags: ['논증 평가 및 문제 해결'], memo: '' },
      { no: 40, answer: 5, category: 'principle_apply', subcategory: '과학기술',   difficulty: '상', tags: ['언어 추리'],            memo: '' },
    ],
  },
};

// 메타데이터 조회 헬퍼
function getMeta(year, section, no) {
  const yearData = LEET_META[year];
  if (!yearData || !yearData[section]) return null;
  return yearData[section].find(q => q.no === no) || null;
}
