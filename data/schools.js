// ===========================================================================
// 학교별 환산점수 탭
// ===========================================================================

// ===========================================================================
// 25개 로스쿨 정량 환산 데이터 (2026학년도 기준)
// 각 학교의 모집요강 1단계 전형 환산식을 직접 구현
// 입력: { eonStd, chuStd, eonPct, chuPct, gpaPct, gpaScale, engType, engScore }
// 반환: { leet, gpa, eng, total, leetMax, gpaMax, engMax, totalMax, engPF }
// ===========================================================================

// ===== 헬퍼: 영어 점수 → 학교별 등급 환산 =====
// 학교별로 환산표가 모두 달라서 학교별 함수에서 직접 처리

// 학점 백분위 → 환산점수 (선형 비례, 룩업 테이블이 있는 학교는 별도 처리)
function gpaLinear(pct, base, max) {
  if (pct === null) return null;
  return base + (pct / 100) * (max - base);
}

// 영어 P/F 통과 여부만 반환 (점수반영 학교는 별도 환산)
function engPass(school, engType, engScore) {
  if (engScore === null) return null;
  const std = school.engPF;
  if (!std) return null;
  return engScore >= (std[engType] || Infinity);
}

const LAW_SCHOOLS = [
  // ========== 서울대 ==========
  {
    name: '서울대', group: '서울', leetRatio: 30.0,
    leetMax: 60, gpaMax: 60, engMax: null, engType: 'pf',
    totalMax: 200,  // LEET 60 + 학부 60 + 정성평가 80
    note: 'LEET는 백분위 기반 (표점 아님). 정성평가 80점은 별도.',
    engPF: { toeic: 1, teps: 387, toefl: 107 },  // toeic 기준 없음 (TEPS/TOEFL만)
    calc(input) {
      // LEET: (언어 백분위 × 0.4 + 추리 백분위 × 0.6) × 0.6
      let leet = null;
      if (input.eonPct !== null && input.chuPct !== null) {
        leet = (input.eonPct * 0.4 + input.chuPct * 0.6) * 0.6;
      }
      // 학부: 백분위 × 0.6
      const gpa = input.gpaPct !== null ? input.gpaPct * 0.6 : null;
      return { leet, gpa, eng: null };
    },
  },

  // ========== 고려대 ==========
  // 별첨1 학부 환산표 + 별첨2 LEET 환산표 (모두 백분위 기반)
  {
    name: '고려대', group: '서울', leetRatio: 41.74,
    leetMax: 200, gpaMax: 150, engMax: null, engType: 'pf',
    totalMax: 500,
    engPF: { toeic: 815, teps: 316, toefl: 94 },
    calc(input) {
      // LEET: 별첨2 환산표 기반 (백분위 → 환산점수)
      let leet = null;
      if (input.eonPct !== null && input.chuPct !== null) {
        leet = koreaLeetEon(input.eonPct) + koreaLeetChu(input.chuPct);
      }
      // 학부: 별첨1 환산표 (4.5만점 평점 + 백분위 → 환산점수)
      // 백분위 100 → 150, 91 → 146, 89 → 141, 85 → 137, 80 → 134
      const gpa = input.gpaPct !== null ? koreaGpaTable(input.gpaPct) : null;
      return { leet, gpa, eng: null };
    },
  },

  // ========== 연세대 ==========
  // 별첨 환산표1(LEET 표점합 → 50~150) + 환산표2(백분위 → 50~150)
  {
    name: '연세대', group: '서울', leetRatio: 35.7,
    leetMax: 150, gpaMax: 150, engMax: null, engType: 'pf',
    totalMax: 400,
    engPF: { toeic: 800, teps: 309, toefl: 90 },  // 일반적 기준 (모집요강 기반)
    calc(input) {
      // LEET 환산표1: 168 이상 150, ..., 85 이하 50
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        const sum = input.eonStd + input.chuStd;
        leet = yonseiLeetTable(sum);
      }
      // 학부 환산표2: 100% → 150, 백분위 비례 감소 (대략 80% → 130, 60% → 110, 40% → 95 정도)
      const gpa = input.gpaPct !== null ? yonseiGpaTable(input.gpaPct) : null;
      return { leet, gpa, eng: null };
    },
  },

  // ========== 성균관대 ==========
  {
    name: '성균관대', group: '서울', leetRatio: 35.3,
    leetMax: 30, gpaMax: 25, engMax: null, engType: 'pf',
    totalMax: 85,
    engPF: { toeic: 830, teps: 325, toefl: 96 },
    calc(input) {
      // LEET: 표점 합산 → 별첨1 환산점수표
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        const sum = input.eonStd + input.chuStd;
        leet = sungkyunLeetTable(sum);
      }
      // 학부: 백분위 → 별첨2 환산점수표
      const gpa = input.gpaPct !== null ? sungkyunGpaTable(input.gpaPct) : null;
      return { leet, gpa, eng: null };
    },
  },

  // ========== 한양대 (나군) ==========
  {
    name: '한양대', group: '서울', leetRatio: 50.0,
    leetMax: 40, gpaMax: 20, engMax: null, engType: 'pf',
    totalMax: 80,
    engPF: { toeic: 800, teps: 309, toefl: 91 },
    calc(input) {
      // LEET: 모집요강 환산공식
      // A = 언어 표점 / 언어 최상위 급간 상한점수
      // B = 추리 표점 / 추리 최상위 급간 상한점수
      // "최상위 급간 상한점수" = 해당 연도 만점 표준점수
      // 2026학년도: 언어 만점 73.1, 추리 만점 97.6
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        const eonMax = 73.1;  // 2026학년도 언어 30/30 표준점수
        const chuMax = 97.6;  // 2026학년도 추리 40/40 표준점수
        const A = Math.min(1, input.eonStd / eonMax);
        const B = Math.min(1, input.chuStd / chuMax);
        const C = (A + B) / 2;
        if (C >= 0.95) leet = 40;
        else if (C >= 0.45) leet = 12 + (C - 0.45) * 56;
        else leet = 12;
      }
      // 학부: x = 학부성적 백점만점 환산점수
      // x ≥ 60 → 6 + (x-60) × 0.35, x < 60 → 6
      const gpa = input.gpaPct !== null
        ? (input.gpaPct >= 60 ? 6 + (input.gpaPct - 60) * 0.35 : 6)
        : null;
      return { leet, gpa, eng: null };
    },
  },

  // ========== 이화여대 ==========
  {
    name: '이화여대', group: '서울', leetRatio: 35.0,
    leetMax: 70, gpaMax: 40, engMax: 20, engType: 'score',
    totalMax: 200,
    engPF: null,
    calc(input) {
      // LEET: (언어 표점 + 추리 표점) × 0.7 - 30 (130 이상 시 70)
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        const sum = input.eonStd + input.chuStd;
        leet = sum >= 130 ? 70 : Math.max(0, sum * 0.7 - 30);
      }
      // 학부: 백분위 비례 (가중평균 방식이지만 단순 비례로 근사)
      const gpa = input.gpaPct !== null ? (input.gpaPct / 100) * 40 : null;
      // 영어: 21등급 환산표
      const eng = ewhaEngTable(input.engType, input.engScore);
      return { leet, gpa, eng };
    },
  },

  // ========== 경희대 ==========
  {
    name: '경희대', group: '서울', leetRatio: 50.9,
    leetMax: 100, gpaMax: 100, engMax: null, engType: 'pf',
    totalMax: 400,
    engPF: { toeic: 800, teps: 309, toefl: 90 },
    calc(input) {
      // LEET: 0.28 × (언어 표점 + 추리 표점) + 58.5
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        leet = 0.28 * (input.eonStd + input.chuStd) + 58.5;
        leet = Math.min(100, Math.max(0, leet));
      }
      // 학부: 11등급 환산표 (백분위)
      const gpa = input.gpaPct !== null ? kyungheeGpaTable(input.gpaPct) : null;
      return { leet, gpa, eng: null };
    },
  },

  // ========== 한국외대 ==========
  {
    name: '한국외대', group: '서울', leetRatio: 45.8,
    leetMax: 100, gpaMax: 100, engMax: 100, engType: 'score',
    totalMax: 450,
    engPF: null,
    calc(input) {
      // LEET: (언어 표점 + 추리 표점) × 2/3
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        leet = (input.eonStd + input.chuStd) * 2 / 3;
        leet = Math.min(100, Math.max(0, leet));
      }
      // 학부: 4.5만점 평점 → 10등급 환산표 (기본점수 80 포함)
      // GPA 점수가 있으면 그걸로, 없으면 백분위로 근사
      let gpa = null;
      if (input.gpaScore !== null && input.gpaScale) {
        const conv = parseFloat(input.gpaScore) * (4.5 / parseFloat(input.gpaScale));
        gpa = hufsGpaTable(conv);
      } else if (input.gpaPct !== null) {
        // 백분위 → 4.5만점 평점 추정 (단순 비례)
        const estGpa = 1.5 + (input.gpaPct / 100) * 3.0;  // 백분위 100 → 4.5
        gpa = hufsGpaTable(estGpa);
      }
      // 영어: 6등급 환산표
      const eng = hufsEngTable(input.engType, input.engScore);
      return { leet, gpa, eng };
    },
  },

  // ========== 서강대 ==========
  {
    name: '서강대', group: '서울', leetRatio: 50.0,
    leetMax: 30, gpaMax: 20, engMax: null, engType: 'pf',
    totalMax: 70,
    engPF: { toeic: 700, teps: 300, toefl: 79 },
    calc(input) {
      // LEET: 기본점수 10 + (언어 표점 + 추리 표점) × 0.1
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        leet = 10 + (input.eonStd + input.chuStd) * 0.1;
        leet = Math.min(30, Math.max(10, leet));
      }
      // 학부: 기본점수 15 + 백분위 × 0.05
      const gpa = input.gpaPct !== null ? 15 + input.gpaPct * 0.05 : null;
      return { leet, gpa, eng: null };
    },
  },

  // ========== 중앙대 ==========
  {
    name: '중앙대', group: '서울', leetRatio: 38.4,
    leetMax: 100, gpaMax: 100, engMax: 100, engType: 'score',
    totalMax: 400,
    engPF: null,
    calc(input) {
      // LEET: 표점합 구간별 환산표 (130 이상 100, 85 미만 75)
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        const sum = input.eonStd + input.chuStd;
        leet = chungangLeetTable(sum);
      }
      // 학부: 4.5만점 평점 구간별 환산표
      // 평점 정보가 있으면 그걸로, 없으면 백분위로 근사
      let gpa = null;
      if (input.gpaScore !== null && input.gpaScale) {
        const conv = parseFloat(input.gpaScore) * (4.5 / parseFloat(input.gpaScale));
        gpa = chungangGpaTable(conv);
      } else if (input.gpaPct !== null) {
        const estGpa = 1.5 + (input.gpaPct / 100) * 3.0;
        gpa = chungangGpaTable(estGpa);
      }
      // 영어: TOEIC 기준 환산표
      const eng = chungangEngTable(input.engType, input.engScore);
      return { leet, gpa, eng };
    },
  },

  // ========== 서울시립대 ==========
  {
    name: '서울시립대', group: '서울', leetRatio: 50.0,
    leetMax: 35, gpaMax: 15, engMax: 10, engType: 'score',
    totalMax: 80,
    engPF: null,
    calc(input) {
      // LEET: (언어 표점 × 0.2) + (추리 표점 × 0.2)
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        leet = input.eonStd * 0.2 + input.chuStd * 0.2;
        leet = Math.min(35, Math.max(0, leet));
      }
      // 학부: (100점만점 환산점수 × 0.10) + 5
      const gpa = input.gpaPct !== null ? input.gpaPct * 0.10 + 5 : null;
      // 영어: TOEIC 935 이상 만점 10, 미만 (토익점수 × 0.005) + 5
      let eng = null;
      if (input.engScore !== null) {
        let toeic = input.engScore;
        if (input.engType === 'teps') toeic = uosTepsToToeic(input.engScore);
        else if (input.engType === 'toefl') toeic = uosToeflToToeic(input.engScore);
        if (toeic >= 935) eng = 10;
        else eng = toeic * 0.005 + 5;
        eng = Math.min(10, Math.max(0, eng));
      }
      return { leet, gpa, eng };
    },
  },

  // ========== 건국대 ==========
  {
    name: '건국대', group: '서울', leetRatio: 34.97,
    leetMax: 200, gpaMax: 200, engMax: null, engType: 'pf',
    totalMax: 600,
    engPF: { toeic: 800, teps: 310, toefl: 91 },
    calc(input) {
      // LEET: (언어 표점 - 45) × 1.45 + (추리 표점 - 60) × 1.55 + 125
      // 100 미만 100, 200 초과 200
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        leet = (input.eonStd - 45) * 1.45 + (input.chuStd - 60) * 1.55 + 125;
        leet = Math.min(200, Math.max(100, leet));
      }
      // 학부: 백분위 구간별 환산표
      const gpa = input.gpaPct !== null ? konkukGpaTable(input.gpaPct) : null;
      return { leet, gpa, eng: null };
    },
  },

  // ========== 아주대 ==========
  {
    name: '아주대', group: '경기/인천', leetRatio: 45.5,
    leetMax: 30, gpaMax: 20, engMax: 20, engType: 'score',
    totalMax: 80,
    engPF: null,
    calc(input) {
      // LEET: {(언어표점×0.4 + 추리표점×0.6)×0.8 + (언어백분위×0.4 + 추리백분위×0.6)×0.2} × 0.25 + 5
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        const stdPart = (input.eonStd * 0.4 + input.chuStd * 0.6) * 0.8;
        const pctPart = (input.eonPct !== null && input.chuPct !== null)
          ? (input.eonPct * 0.4 + input.chuPct * 0.6) * 0.2
          : 0;
        leet = (stdPart + pctPart) * 0.25 + 5;
        leet = Math.min(30, Math.max(0, leet));
      }
      // 학부: 백분위환산점수 × 0.1 + 10
      const gpa = input.gpaPct !== null ? input.gpaPct * 0.1 + 10 : null;
      // 영어: 13등급 환산표
      const eng = ajouEngTable(input.engType, input.engScore);
      return { leet, gpa, eng };
    },
  },

  // ========== 인하대 ==========
  {
    name: '인하대', group: '경기/인천', leetRatio: 35.0,
    leetMax: 250, gpaMax: 200, engMax: 100, engType: 'score',
    totalMax: 750,
    engPF: null,
    calc(input) {
      // LEET: 30 + (언어×0.4 + 추리×0.6) × 220/90
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        leet = 30 + (input.eonStd * 0.4 + input.chuStd * 0.6) * 220 / 90;
        leet = Math.min(250, Math.max(30, leet));
      }
      // 학부: 4.5만점 환산표 (90 기본 + 110 실질)
      let gpa = null;
      if (input.gpaScore !== null && input.gpaScale) {
        const conv = parseFloat(input.gpaScore) * (4.5 / parseFloat(input.gpaScale));
        gpa = inhaGpaTable(conv);
      } else if (input.gpaPct !== null) {
        const estGpa = 1.5 + (input.gpaPct / 100) * 3.0;
        gpa = inhaGpaTable(estGpa);
      }
      // 영어: TOEIC 기준 환산표 (50 기본 + 50 실질)
      const eng = inhaEngTable(input.engType, input.engScore);
      return { leet, gpa, eng };
    },
  },

  // ========== 부산대 ==========
  {
    name: '부산대', group: '지방', leetRatio: 40.0,
    leetMax: 30, gpaMax: 30, engMax: null, engType: 'pf',
    totalMax: 80,
    engPF: { toeic: 700, teps: 285, toefl: 80 },
    calc(input) {
      // LEET: {(언어/90×40 + 추리/120×60)×0.8 + (언어백분위×0.4 + 추리백분위×0.6)×0.2} × 0.3
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        const stdPart = (input.eonStd / 90 * 40 + input.chuStd / 120 * 60) * 0.8;
        const pctPart = (input.eonPct !== null && input.chuPct !== null)
          ? (input.eonPct * 0.4 + input.chuPct * 0.6) * 0.2
          : 0;
        leet = (stdPart + pctPart) * 0.30;
        leet = Math.min(30, Math.max(0, leet));
      }
      // 학부: 백분위 × 0.25 + 5
      const gpa = input.gpaPct !== null ? input.gpaPct * 0.25 + 5 : null;
      return { leet, gpa, eng: null };
    },
  },

  // ========== 경북대 ==========
  {
    name: '경북대', group: '지방', leetRatio: 46.4,
    leetMax: 150, gpaMax: 100, engMax: null, engType: 'pf',
    totalMax: 300,
    engPF: { toeic: 800, teps: 310, toefl: 91 },
    note: '분모는 매년 협의회가 발표하는 언어/추리 표점 최상위 급간 상한의 합. 2026학년도 기준 73.1+97.6=170.7',
    calc(input) {
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        const sum = input.eonStd + input.chuStd;
        // 2026학년도 표점 최상위 급간 상한 합 (한양대 코드와 동일 출처): 73.1 + 97.6 = 170.7
        leet = 85 + 65 * (sum / 170.7);
        leet = Math.min(150, Math.max(85, leet));
      }
      const gpa = input.gpaPct !== null ? 65 + 35 * input.gpaPct / 100 : null;
      return { leet, gpa, eng: null };
    },
  },

  // ========== 전남대 ==========
  {
    name: '전남대', group: '지방', leetRatio: 42.6,
    leetMax: 150, gpaMax: 150, engMax: null, engType: 'pf',
    totalMax: 500,
    engPF: { toeic: 750, teps: 285, toefl: 85 },
    calc(input) {
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        leet = input.eonStd + input.chuStd + 5;
        leet = Math.min(150, Math.max(75, leet));
      }
      let gpa = null;
      if (input.gpaPct !== null) {
        gpa = 77.5 * input.gpaPct / 100 + 72.5;
        gpa = Math.max(119, gpa);
        gpa = Math.min(150, gpa);
      }
      return { leet, gpa, eng: null };
    },
  },

  // ========== 전북대 ==========
  {
    name: '전북대', group: '지방', leetRatio: 53.3,
    leetMax: 40, gpaMax: 15, engMax: null, engType: 'pf',
    totalMax: 75,
    engPF: { toeic: 700, teps: 300, toefl: 80 },
    note: 'LEET 환산이 시그모이드 함수',
    calc(input) {
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        const x = input.eonStd + input.chuStd;
        if (x >= 150) leet = 40;
        else if (x < 75) leet = 21.5;
        else leet = 18.6 / (1 + Math.exp(-0.13 * (x - 110))) + 21.5;
      }
      const gpa = input.gpaPct !== null ? jbnuGpaTable(input.gpaPct) : null;
      return { leet, gpa, eng: null };
    },
  },

  // ========== 충남대 ==========
  {
    name: '충남대', group: '지방', leetRatio: 69.77,
    leetMax: 120, gpaMax: 100, engMax: 100, engType: 'score',
    totalMax: 350,
    engPF: null,
    calc(input) {
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        leet = (input.eonStd + input.chuStd) * 0.7 - 20;
        leet = Math.min(120, Math.max(0, leet));
      }
      const gpa = input.gpaPct !== null ? Math.min(100, input.gpaPct) : null;
      const eng = cnuEngTable(input.engType, input.engScore);
      return { leet, gpa, eng };
    },
  },

  // ========== 충북대 ==========
  {
    name: '충북대', group: '지방', leetRatio: 89.3,
    leetMax: 200, gpaMax: 100, engMax: null, engType: 'pf',
    totalMax: 330,
    engPF: { toeic: 750, teps: 286, toefl: 85 },
    note: '학부 백분율 81.00 미만 지원 불가',
    calc(input) {
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        leet = (input.eonStd + input.chuStd) * 1.3;
        leet = Math.min(200, Math.max(0, leet));
      }
      let gpa = null;
      if (input.gpaPct !== null) {
        if (input.gpaPct >= 93) gpa = 100;
        else if (input.gpaPct >= 87) gpa = 98;
        else if (input.gpaPct >= 81) gpa = 96;
        else gpa = 0;
      }
      return { leet, gpa, eng: null };
    },
  },

  // ========== 강원대 ==========
  {
    name: '강원대', group: '지방', leetRatio: 44.0,
    leetMax: 150, gpaMax: 100, engMax: null, engType: 'pf',
    totalMax: 350,
    engPF: { toeic: 720, teps: 308, toefl: 75 },
    calc(input) {
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        const sum = input.eonStd + input.chuStd;
        if (sum < 80) leet = 40;
        else if (sum < 100) leet = 50 + (sum - 80);
        else if (sum < 140) leet = 70 + (sum - 100) * 2;
        else leet = 150;
      }
      let gpa = null;
      if (input.gpaPct !== null) {
        const p = input.gpaPct;
        if (p < 70) gpa = 40;
        else if (p < 80) gpa = 60 + (p - 70);
        else gpa = 70 + (p - 80) * 1.5;
        gpa = Math.min(100, Math.max(40, gpa));
      }
      return { leet, gpa, eng: null };
    },
  },

  // ========== 제주대 ==========
  {
    name: '제주대', group: '지방', leetRatio: 66.7,
    leetMax: 40, gpaMax: 20, engMax: null, engType: 'pf',
    totalMax: 60,
    engPF: { toeic: 710, teps: 334, toefl: 75 },
    calc(input) {
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        leet = (input.eonStd * 0.4 + input.chuStd * 0.6) * 0.40;
        leet = Math.min(40, Math.max(0, leet));
      }
      const gpa = input.gpaPct !== null ? 20 * input.gpaPct / 100 : null;
      return { leet, gpa, eng: null };
    },
  },

  // ========== 동아대 (가·나군) ==========
  {
    name: '동아대', group: '지방', leetRatio: 51.3,
    leetMax: 300, gpaMax: 100, engMax: 200, engType: 'score',
    totalMax: 800,
    engPF: null,
    note: '영어 명목 200점이지만 실질 0점 (사실상 P/F)',
    calc(input) {
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        const sum = input.eonStd + input.chuStd;
        let base = 200;
        if (sum >= 100) base = 220;
        else if (sum >= 90) base = 210;
        leet = base + sum / 2;
        leet = Math.min(300, Math.max(0, leet));
      }
      let gpa = null;
      if (input.gpaScore !== null && input.gpaScale) {
        const conv = parseFloat(input.gpaScore) * (4.5 / parseFloat(input.gpaScale));
        gpa = 85 + (conv / 4.5) * 15;
      } else if (input.gpaPct !== null) {
        gpa = 85 + (input.gpaPct / 100) * 15;
      }
      let eng = null;
      if (input.engScore !== null) {
        const std = { toefl: 68, toeic: 600, teps: 255 };
        if (input.engScore >= (std[input.engType] || Infinity)) eng = 200;
        else eng = 0;
      }
      return { leet, gpa, eng };
    },
  },

  // ========== 원광대 ==========
  {
    name: '원광대', group: '지방', leetRatio: 54.5,
    leetMax: 40, gpaMax: 20, engMax: 20, engType: 'score',
    totalMax: 100,
    engPF: null,
    calc(input) {
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        const avg = (input.eonStd + input.chuStd) / 2;
        leet = (avg + 72) * 2 / 7;
        leet = Math.min(40, Math.max(28, leet));
      }
      let gpa = null;
      if (input.gpaScore !== null && input.gpaScale) {
        const conv = parseFloat(input.gpaScore) * (4.5 / parseFloat(input.gpaScale));
        gpa = (conv / 4.5) * 2 + 18;
      } else if (input.gpaPct !== null) {
        gpa = (input.gpaPct / 100) * 2 + 18;
      }
      const eng = wonkwangEngTable(input.engType, input.engScore);
      return { leet, gpa, eng };
    },
  },

  // ========== 영남대 ==========
  {
    name: '영남대', group: '지방', leetRatio: 58.8,
    leetMax: 300, gpaMax: 100, engMax: 100, engType: 'score',
    totalMax: 700,
    engPF: null,
    calc(input) {
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        leet = (input.eonStd + input.chuStd) / 2;
        leet = leet * 3;
        leet = Math.min(300, Math.max(0, leet));
      }
      let gpa = null;
      if (input.gpaScore !== null && input.gpaScale) {
        const conv = parseFloat(input.gpaScore) * (4.5 / parseFloat(input.gpaScale));
        if (conv >= 4.0) gpa = 100;
        else if (conv >= 3.5) gpa = 95;
        else if (conv >= 3.0) gpa = 90;
        else gpa = 80;
      } else if (input.gpaPct !== null) {
        const estGpa = 1.5 + (input.gpaPct / 100) * 3.0;
        if (estGpa >= 4.0) gpa = 100;
        else if (estGpa >= 3.5) gpa = 95;
        else if (estGpa >= 3.0) gpa = 90;
        else gpa = 80;
      }
      const eng = yuEngTable(input.engType, input.engScore);
      return { leet, gpa, eng };
    },
  },
];

// ===========================================================================
// 학교별 환산표 헬퍼 함수들
// ===========================================================================

// ========== 연세대 ==========
// 연세대 PDF 별첨 환산표1: LEET 표점합 → 환산점수 (정수 84개, 168↑=150, 85↓=50)
const YONSEI_LEET_TBL = {
  168:150.0, 167:149.7, 166:149.4, 165:149.1, 164:148.8,
  163:148.5, 162:148.2, 161:147.9, 160:147.6, 159:147.3,
  158:147.0, 157:146.7, 156:146.4, 155:146.1, 154:145.8,
  153:145.5, 152:145.2, 151:144.9, 150:144.6, 149:144.3,
  148:144.0, 147:143.7, 146:143.4, 145:143.1, 144:142.8,
  143:142.5, 142:142.2, 141:141.9, 140:141.6, 139:141.3,
  138:141.0, 137:140.7, 136:140.4, 135:140.1, 134:139.7,
  133:139.3, 132:138.9, 131:138.5, 130:138.1, 129:137.7,
  128:137.3, 127:136.9, 126:136.5, 125:136.1, 124:135.6,
  123:135.1, 122:134.6, 121:134.1, 120:133.6, 119:133.1,
  118:132.6, 117:132.1, 116:131.6, 115:131.1, 114:130.6,
  113:130.1, 112:129.6, 111:129.1, 110:128.6, 109:127.9,
  108:127.2, 107:126.5, 106:125.8, 105:125.1, 104:122.0,
  103:119.0, 102:116.0, 101:113.0, 100:110.0, 99:107.0,
   98:104.0,  97:101.0,  96:98.0,   95:95.0,   94:90.5,
   93:86.0,   92:81.5,   91:77.0,   90:72.5,   89:68.0,
   88:63.5,   87:59.0,   86:54.5,
};
function yonseiLeetTable(sum) {
  if (sum === null || sum === undefined) return null;
  // PDF 명시: "법학적성시험(LEET)의 소수점을 반올림 처리함"
  const s = Math.round(sum);
  if (s >= 168) return 150;
  if (s <= 85) return 50;
  return YONSEI_LEET_TBL[s];
}

// 연세대 PDF 별첨 환산표2: 학부 백점환산% → 환산점수 (구간별 선형식, 52↓=50)
// 100~70 구간: pct + 50 (1당 +1)
//  70~65 구간: pct × 2 - 20 (1당 +2)
//  65~60 구간: pct × 4 - 150 (1당 +4)
//  60~52 구간: pct × 5 - 210 (1당 +5)
//   52이하: 50
function yonseiGpaTable(pct) {
  if (pct === null || pct === undefined) return null;
  if (pct >= 100) return 150;
  if (pct >= 70) return pct + 50;
  if (pct >= 65) return pct * 2 - 20;
  if (pct >= 60) return pct * 4 - 150;
  if (pct >= 52) return pct * 5 - 210;
  return 50;
}

// ========== 고려대 ==========
// PDF 별첨2: 백분위 → LEET 환산점수 (정수 백분위 룩업)
// "환산시 소수 첫째자리 버림" 명시 → 입력 백분위는 floor 처리, 22~100 정수만 매핑
const KOREA_LEET_EON_TBL = {
  100:80.0, 99:79.8, 98:79.6, 97:79.4, 96:79.2,
  95:79.0, 94:78.8, 93:78.6, 92:78.4, 91:78.2,
  90:78.0, 89:77.8, 88:77.6, 87:77.33, 86:77.06,
  85:76.79, 84:76.52, 83:76.25, 82:75.98, 81:75.71,
  80:75.44, 79:75.17, 78:74.90, 77:74.63, 76:74.36,
  75:74.09, 74:73.82, 73:73.55, 72:73.28, 71:73.01,
  70:72.74, 69:72.47, 68:72.20, 67:71.93, 66:71.66,
  65:71.39, 64:71.12, 63:70.85, 62:70.58, 61:70.31,
  60:70.04, 59:69.77, 58:69.50, 57:69.23, 56:68.96,
  55:68.69, 54:67.69, 53:66.69, 52:65.69, 51:64.69,
  50:63.69, 49:62.69, 48:61.69, 47:60.69, 46:59.69,
  45:58.69, 44:57.69, 43:56.69, 42:55.69, 41:54.69,
  40:53.69, 39:52.69, 38:51.69, 37:50.69, 36:49.69,
  35:48.69, 34:47.69, 33:46.69, 32:45.69, 31:44.69,
  30:43.69, 29:42.69, 28:41.69, 27:40.69, 26:39.69,
  25:38.69, 24:37.69, 23:36.69, 22:35.69,
};
const KOREA_LEET_CHU_TBL = {
  100:120.0, 99:119.7, 98:119.4, 97:119.1, 96:118.8,
  95:118.5, 94:118.2, 93:117.9, 92:117.6, 91:117.3,
  90:117.0, 89:116.7, 88:116.4, 87:116.0, 86:115.6,
  85:115.2, 84:114.8, 83:114.4, 82:114.0, 81:113.6,
  80:113.2, 79:112.8, 78:112.4, 77:112.0, 76:111.6,
  75:111.2, 74:110.8, 73:110.4, 72:110.0, 71:109.6,
  70:109.2, 69:108.8, 68:108.4, 67:108.0, 66:107.6,
  65:107.2, 64:106.8, 63:106.4, 62:106.0, 61:105.6,
  60:105.2, 59:104.8, 58:104.4, 57:104.0, 56:103.6,
  55:103.2, 54:102.2, 53:101.2, 52:100.2, 51:99.2,
  50:98.2, 49:97.2, 48:96.2, 47:95.2, 46:94.2,
  45:93.2, 44:92.2, 43:91.2, 42:90.2, 41:89.2,
  40:88.2, 39:87.2, 38:86.2, 37:85.2, 36:84.2,
  35:83.2, 34:82.2, 33:81.2, 32:80.2, 31:79.2,
  30:78.2, 29:77.2, 28:76.2, 27:75.2, 26:74.2,
  25:73.2, 24:72.2, 23:71.2, 22:70.2,
};

function koreaLeetEon(pct) {
  if (pct === null || pct === undefined) return null;
  const p = Math.floor(pct);
  if (p >= 100) return 80.0;
  if (p < 22) return 35.0;
  return KOREA_LEET_EON_TBL[p];
}

function koreaLeetChu(pct) {
  if (pct === null || pct === undefined) return null;
  const p = Math.floor(pct);
  if (p >= 100) return 120.0;
  if (p < 22) return 69.0;
  return KOREA_LEET_CHU_TBL[p];
}

// PDF 별첨1: 학부 백분위 → 환산점수 (만점 150, 81.6% 이하 일괄 101)
// 표는 정수 백분위 + 81.6 종단점만 박고 사이는 선형 보간 (각 구간 내 직선이라 PDF값과 일치)
function koreaGpaTable(pct) {
  if (pct === null || pct === undefined) return null;
  if (pct >= 100) return 150.0;
  if (pct <= 81.6) return 101.0;
  const tbl = {
    100:150.00, 99:149.60, 98:149.20, 97:148.80, 96:148.40,
    95:148.00, 94:147.60, 93:147.20, 92:146.80, 91:146.10,
    90:145.40, 89:141.40, 88:137.40, 87:133.40, 86:127.40,
    85:121.40, 84:115.40, 83:109.40, 82:103.40,
  };
  // 81.6 ~ 82 구간 (PDF: 81.6→101.00, 82→103.40, 0.6점/0.1백분위)
  if (pct < 82) {
    return 101.0 + (103.40 - 101.0) * (pct - 81.6) / 0.4;
  }
  if (Number.isInteger(pct)) return tbl[pct];
  const lo = Math.floor(pct), hi = Math.ceil(pct);
  return tbl[lo] + (tbl[hi] - tbl[lo]) * (pct - lo);
}

// ========== 성균관대 ==========
// 모집요강 별첨1 (LEET 환산점수표) 그대로 반영
function sungkyunLeetTable(sum) {
  // 표점합 → 환산점수 (만점 30)
  if (sum >= 160) return 30;
  if (sum <= 50) return 0;
  // 명시 구간 (160 이상 30, 159~146 까지 0.04씩 감소, 그 후 점진적 감소)
  const tbl = [
    [160, 30.00], [159, 29.96], [158, 29.92], [157, 29.88], [156, 29.84],
    [155, 29.80], [154, 29.76], [153, 29.72], [152, 29.68], [151, 29.64],
    [150, 29.60], [149, 29.56], [148, 29.52], [147, 29.48], [146, 29.44],
    [145, 29.40], [144, 29.36], [143, 29.32], [142, 29.28], [141, 29.24],
    [140, 29.20], [139, 29.16], [138, 29.12], [137, 29.08], [136, 29.04],
    [135, 29.00], [134, 28.96], [133, 28.92], [132, 28.88], [131, 28.84],
    [130, 28.74], [129, 28.64], [128, 28.54], [127, 28.44], [126, 28.34],
    [125, 28.24], [124, 28.14], [123, 28.04], [122, 27.88], [121, 27.72],
    [120, 27.56], [119, 27.40], [118, 27.24], [117, 27.08], [116, 26.92],
    [115, 26.76], [114, 26.60], [113, 26.44], [112, 26.28], [111, 26.12],
    [110, 25.96], [100, 22.00], [90, 18.00], [80, 14.00], [70, 8.00],
    [60, 2.00], [50, 0.00],
  ];
  // 정수 점수면 직접 룩업, 아니면 선형 보간
  for (let i = 0; i < tbl.length; i++) {
    if (sum === tbl[i][0]) return tbl[i][1];
    if (sum > tbl[i+1][0] && sum < tbl[i][0]) {
      // 선형 보간
      const [x1, y1] = tbl[i+1];
      const [x2, y2] = tbl[i];
      return y1 + (y2 - y1) * (sum - x1) / (x2 - x1);
    }
  }
  return 0;
}

// 모집요강 별첨2 (학부성적 환산점수표)
function sungkyunGpaTable(pct) {
  // 백분위 → 환산점수 (만점 25)
  if (pct >= 100) return 25;
  if (pct <= 0) return 0;
  // 명시 구간 (1%당 0.05점 감소가 기본, 80~30 구간은 가속 감소)
  const tbl = [
    [100, 25.00], [99, 24.95], [98, 24.90], [97, 24.85], [96, 24.80],
    [95, 24.75], [94, 24.70], [93, 24.65], [92, 24.60], [91, 24.55],
    [90, 24.50], [89, 24.25], [88, 24.00], [87, 23.60], [86, 23.20],
    [85, 22.80], [84, 22.20], [83, 21.60], [82, 21.00], [81, 20.40],
    [80, 19.80], [70, 18.50], [60, 17.00], [50, 15.00], [40, 12.00],
    [30, 9.00], [20, 6.00], [10, 3.00], [0, 0.00],
  ];
  for (let i = 0; i < tbl.length; i++) {
    if (pct === tbl[i][0]) return tbl[i][1];
    if (pct > tbl[i+1][0] && pct < tbl[i][0]) {
      const [x1, y1] = tbl[i+1];
      const [x2, y2] = tbl[i];
      return y1 + (y2 - y1) * (pct - x1) / (x2 - x1);
    }
  }
  return 0;
}

// ========== 경희대 ==========
function kyungheeGpaTable(pct) {
  if (pct >= 90) return 100;
  if (pct >= 87) return 99;
  if (pct >= 84) return 98;
  if (pct >= 81) return 97;
  if (pct >= 78) return 96;
  if (pct >= 75) return 95;
  if (pct >= 72) return 94;
  if (pct >= 69) return 93;
  if (pct >= 66) return 92;
  if (pct >= 63) return 91;
  return 90;
}

// ========== 한국외대 ==========
function hufsGpaTable(gpa45) {
  if (gpa45 >= 4.0) return 100;
  if (gpa45 >= 3.8) return 99;
  if (gpa45 >= 3.6) return 98;
  if (gpa45 >= 3.4) return 96;
  if (gpa45 >= 3.2) return 94;
  if (gpa45 >= 3.0) return 92;
  if (gpa45 >= 2.8) return 89;
  if (gpa45 >= 2.6) return 86;
  if (gpa45 >= 2.4) return 83;
  return 80;
}

function hufsEngTable(engType, score) {
  if (score === null) return null;
  // 6등급 (90~100)
  if (engType === 'toeic') {
    if (score >= 900) return 100;
    if (score >= 860) return 98;
    if (score >= 820) return 96;
    if (score >= 780) return 94;
    if (score >= 740) return 92;
    if (score >= 700) return 90;
    return 90;
  }
  if (engType === 'teps') {
    if (score >= 374) return 100;
    if (score >= 344) return 98;
    if (score >= 321) return 96;
    if (score >= 300) return 94;
    if (score >= 282) return 92;
    if (score >= 265) return 90;
    return 90;
  }
  if (engType === 'toefl') {
    if (score >= 105) return 100;
    if (score >= 99) return 98;
    if (score >= 94) return 96;
    if (score >= 88) return 94;
    if (score >= 83) return 92;
    if (score >= 79) return 90;
    return 90;
  }
  return null;
}

// ========== 중앙대 ==========
// PDF 환산표: 130↑→100, 125↑→99, 120↑→98, 115↑→97, 110↑→95, 105↑→93,
// 100↑→91, 95↑→87, 85↑→80 (단일 구간), 85↓→75
function chungangLeetTable(sum) {
  if (sum === null || sum === undefined) return null;
  if (sum >= 130) return 100;
  if (sum >= 125) return 99;
  if (sum >= 120) return 98;
  if (sum >= 115) return 97;
  if (sum >= 110) return 95;
  if (sum >= 105) return 93;
  if (sum >= 100) return 91;
  if (sum >=  95) return 87;
  if (sum >=  85) return 80;
  return 75;
}

// PDF 환산표 (4.5만점): 4.10↑→100, 3.80↑→99, 3.50↑→98, 3.10↑→96, 2.40↑→90, <2.40→85
function chungangGpaTable(gpa45) {
  if (gpa45 === null || gpa45 === undefined) return null;
  if (gpa45 >= 4.10) return 100;
  if (gpa45 >= 3.80) return 99;
  if (gpa45 >= 3.50) return 98;
  if (gpa45 >= 3.10) return 96;
  if (gpa45 >= 2.40) return 90;
  return 85;
}

function chungangEngTable(engType, score) {
  if (score === null) return null;
  // TOEIC 기준 환산
  let toeic = score;
  if (engType === 'teps') toeic = uosTepsToToeic(score);
  else if (engType === 'toefl') toeic = uosToeflToToeic(score);
  if (toeic >= 965) return 100;
  if (toeic >= 900) return 99;
  if (toeic >= 850) return 97;
  if (toeic >= 800) return 96;
  if (toeic >= 700) return 95;
  return 95;
}

// ========== TEPS/TOEFL → TOEIC 환산 ==========
// 서울대 TEPS 위원회 공식 영어성적 환산표 (2021.6.23 제공)
// New TEPS (2018+, 600점 만점) / TOEFL iBT (120점 만점)
// 표는 TOEIC 5점 단위로 TEPS·TOEFL 구간을 정의함.
// 입력 점수가 어느 구간에 속하는지 top-down 으로 탐색.

const TEPS_TO_TOEIC_TABLE = [
  // [TEPS 하한, TOEIC]
  [558, 990], [526, 985], [504, 980], [486, 975], [471, 970],
  [458, 965], [446, 960], [437, 955], [428, 950], [420, 945],
  [412, 940], [406, 935], [400, 930], [394, 925], [389, 920],
  [384, 915], [379, 910], [375, 905], [370, 900], [366, 895],
  [362, 890], [359, 885], [355, 880], [352, 875], [348, 870],
  [345, 865], [342, 860], [339, 855], [336, 850], [333, 845],
  [330, 840], [327, 835], [324, 830], [321, 825], [319, 820],
  [316, 815], [314, 810], [311, 805], [309, 800], [306, 795],
  [304, 790], [301, 785], [299, 780], [297, 775], [294, 770],
  [292, 765], [290, 760], [288, 755], [285, 750], [283, 745],
  [281, 740], [279, 735], [277, 730], [274, 725], [272, 720],
  [270, 715], [268, 710], [266, 705], [264, 700], [262, 695],
  [260, 690], [258, 685], [256, 680], [254, 675], [252, 670],
  [250, 665], [248, 660], [247, 655], [245, 650], [243, 645],
  [241, 640], [239, 635], [237, 630], [236, 625], [234, 620],
  [232, 615], [230, 610], [229, 605], [227, 600], [225, 595],
  [224, 590], [222, 585], [220, 580], [219, 575], [217, 570],
  [215, 565], [214, 560], [212, 555], [211, 550], [209, 545],
  [208, 540], [206, 535], [204, 530], [203, 525], [201, 520],
  [200, 515], [198, 510], [197, 505], [195, 500], [194, 495],
  [193, 490], [191, 485], [190, 480], [188, 475], [187, 470],
  [185, 465], [184, 460], [183, 455], [181, 450], [180, 445],
  [178, 440], [177, 435], [176, 430], [174, 425], [173, 420],
  [171, 415], [170, 410], [169, 405], [167, 400], [166, 395],
  [164, 390], [163, 385], [161, 380], [160, 375], [158, 370],
  [157, 365], [156, 360], [154, 355], [153, 350], [151, 345],
  [150, 340], [148, 335], [146, 330], [145, 325], [143, 320],
];

const TOEFL_TO_TOEIC_TABLE = [
  // [TOEFL iBT 하한, TOEIC] — 표의 낮은 경계값 사용 (top-down 탐색)
  [118, 990], [117, 985], [116, 980], [115, 970],
  [114, 965], [113, 960], [112, 955], [111, 950],
  [110, 940], [109, 930], [108, 920], [107, 915],
  [106, 910], [105, 900], [104, 895], [103, 885],
  [102, 880], [101, 870], [100, 860], [99, 855],
  [98, 850], [97, 845], [96, 835], [95, 830],
  [94, 820], [93, 815], [92, 810], [91, 800],
  [90, 790], [89, 785], [88, 775], [87, 770],
  [86, 760], [85, 750], [84, 745], [83, 735],
  [82, 725], [81, 715], [80, 705], [79, 695],
  [78, 685], [77, 670], [76, 660], [75, 655],
  [74, 645], [73, 635], [72, 630], [71, 620],
  [70, 610], [69, 605], [68, 595], [67, 585],
  [66, 575], [65, 565], [64, 550], [63, 545],
  [62, 540], [61, 530], [60, 525], [59, 515],
  [58, 510], [57, 500], [56, 495], [55, 485],
  [54, 480], [53, 475], [52, 470], [51, 465],
  [50, 465], [49, 455], [48, 450], [47, 440],
  [46, 435], [45, 430], [44, 420], [43, 415],
  [42, 410], [41, 400], [40, 395], [39, 390],
  [38, 385], [37, 380], [36, 375], [35, 370],
  [34, 365], [33, 360], [32, 355], [31, 350],
  [30, 345], [29, 335], [28, 330], [27, 325],
  [26, 320],
];

function uosTepsToToeic(teps) {
  if (teps == null || isNaN(teps)) return 0;
  for (const [low, toeic] of TEPS_TO_TOEIC_TABLE) {
    if (teps >= low) return toeic;
  }
  return 0; // 143 미만은 기본점수만 적용 (= 환산 0, 학교별 기본점수 사용)
}

function uosToeflToToeic(toefl) {
  if (toefl == null || isNaN(toefl)) return 0;
  for (const [low, toeic] of TOEFL_TO_TOEIC_TABLE) {
    if (toefl >= low) return toeic;
  }
  return 0;
}

// ========== 건국대 ==========
function konkukGpaTable(pct) {
  if (pct >= 96) return 200;
  if (pct >= 93) return 195;
  if (pct >= 90) return 190;
  if (pct >= 87) return 185;
  if (pct >= 84) return 180;
  if (pct >= 81) return 175;
  if (pct >= 78) return 165;
  if (pct >= 75) return 155;
  if (pct >= 72) return 135;
  if (pct >= 69) return 115;
  return 110;
}

// ========== 이화여대 영어 환산표 ==========
function ewhaEngTable(engType, score) {
  if (score === null) return null;
  // 21등급, 0~20점
  if (engType === 'toeic') {
    if (score >= 975) return 20;
    if (score >= 950) return 19;
    if (score >= 925) return 18;
    if (score >= 900) return 17;
    if (score >= 875) return 16;
    if (score >= 850) return 15;
    if (score >= 840) return 14;
    if (score >= 830) return 13;
    if (score >= 820) return 12;
    if (score >= 810) return 11;
    if (score >= 800) return 10;
    if (score >= 790) return 9;
    if (score >= 780) return 8;
    if (score >= 770) return 7;
    if (score >= 760) return 6;
    if (score >= 750) return 5;
    if (score >= 740) return 4;
    if (score >= 730) return 3;
    if (score >= 720) return 2;
    if (score >= 710) return 1;
    return 0;
  }
  if (engType === 'teps') {
    if (score >= 486) return 20;
    if (score >= 428) return 19;
    if (score >= 394) return 18;
    if (score >= 370) return 17;
    if (score >= 352) return 16;
    if (score >= 336) return 15;
    if (score >= 330) return 14;
    if (score >= 324) return 13;
    if (score >= 319) return 12;
    if (score >= 314) return 11;
    if (score >= 309) return 10;
    if (score >= 304) return 9;
    if (score >= 299) return 8;
    if (score >= 294) return 7;
    if (score >= 290) return 6;
    if (score >= 285) return 5;
    if (score >= 281) return 4;
    if (score >= 277) return 3;
    if (score >= 272) return 2;
    if (score >= 268) return 1;
    return 0;
  }
  if (engType === 'toefl') {
    if (score >= 111) return 20;
    if (score >= 108) return 19;
    if (score >= 105) return 18;
    if (score >= 103) return 17;
    if (score >= 101) return 16;
    if (score >= 99) return 15;
    if (score >= 97) return 14;
    if (score >= 95) return 13;
    if (score >= 93) return 12;
    if (score >= 91) return 11;
    if (score >= 89) return 10;
    if (score >= 87) return 9;
    if (score >= 85) return 8;
    if (score >= 83) return 7;
    if (score >= 81) return 6;
    if (score >= 79) return 5;
    if (score >= 78) return 4;
    if (score >= 77) return 3;
    if (score >= 76) return 2;
    if (score >= 75) return 1;
    return 0;
  }
  return null;
}

// ========== 아주대 영어 환산표 (13등급) ==========
function ajouEngTable(engType, score) {
  if (score === null || score === undefined) return null;
  // PDF 13등급 환산표: raw 100/98/96/94/92/90/88/85/82/77/72/66/60, 13등급 미만 → 40
  // 최종 환산점수 = raw × 0.12 + 8 (만점 100×0.12+8 = 20점)
  let raw = null;
  if (engType === 'toefl') {
    if      (score >= 105) raw = 100;  // 1등급 105~120
    else if (score >= 100) raw = 98;   // 2등급 100~104
    else if (score >=  98) raw = 96;   // 3등급  98~99
    else if (score >=  93) raw = 94;   // 4등급  93~97
    else if (score >=  90) raw = 92;   // 5등급  90~92
    else if (score >=  87) raw = 90;   // 6등급  87~89
    else if (score >=  84) raw = 88;   // 7등급  84~86
    else if (score >=  81) raw = 85;   // 8등급  81~83
    else if (score >=  78) raw = 82;   // 9등급  78~80
    else if (score >=  77) raw = 77;   // 10등급 77
    else if (score >=  73) raw = 72;   // 11등급 73~76
    else if (score >=  70) raw = 66;   // 12등급 70~72
    else if (score >=  67) raw = 60;   // 13등급 67~69
    else                   raw = 40;
  } else if (engType === 'toeic') {
    if      (score >= 900) raw = 100;  // 1등급 900~990
    else if (score >= 865) raw = 98;   // 2등급 865~899
    else if (score >= 850) raw = 96;   // 3등급 850~864
    else if (score >= 815) raw = 94;   // 4등급 815~849
    else if (score >= 795) raw = 92;   // 5등급 795~814
    else if (score >= 770) raw = 90;   // 6등급 770~794
    else if (score >= 745) raw = 88;   // 7등급 745~769
    else if (score >= 720) raw = 85;   // 8등급 720~744
    else if (score >= 690) raw = 82;   // 9등급 690~719
    else if (score >= 670) raw = 77;   // 10등급 670~689
    else if (score >= 640) raw = 72;   // 11등급 640~669
    else if (score >= 615) raw = 66;   // 12등급 615~639
    else if (score >= 590) raw = 60;   // 13등급 590~614
    else                   raw = 40;
  } else if (engType === 'teps') {
    if      (score >= 370) raw = 100;  // 1등급 370~600
    else if (score >= 345) raw = 98;   // 2등급 345~369
    else if (score >= 336) raw = 96;   // 3등급 336~344
    else if (score >= 316) raw = 94;   // 4등급 316~335
    else if (score >= 306) raw = 92;   // 5등급 306~315
    else if (score >= 294) raw = 90;   // 6등급 294~305
    else if (score >= 283) raw = 88;   // 7등급 283~293
    else if (score >= 272) raw = 85;   // 8등급 272~282
    else if (score >= 260) raw = 82;   // 9등급 260~271
    else if (score >= 252) raw = 77;   // 10등급 252~259
    else if (score >= 241) raw = 72;   // 11등급 241~251
    else if (score >= 232) raw = 66;   // 12등급 232~240
    else if (score >= 224) raw = 60;   // 13등급 224~231
    else                   raw = 40;
  }
  if (raw === null) return null;
  return raw * 0.12 + 8;
}

// ========== 인하대 학부/영어 환산표 ==========
// PDF 별첨: 4.30↑→200, 1.55~4.30 → 5×GPA + 178.5 (0.05점 단위 표), 1.55 미만 → 90 (기본점수만)
function inhaGpaTable(gpa45) {
  if (gpa45 === null || gpa45 === undefined) return null;
  if (gpa45 >= 4.30) return 200.00;
  if (gpa45 < 1.55) return 90.00;
  return Math.round((gpa45 * 5 + 178.5) * 100) / 100;
}

function inhaEngTable(engType, score) {
  if (score === null) return null;
  let toeic = score;
  if (engType === 'teps') toeic = uosTepsToToeic(score);
  else if (engType === 'toefl') toeic = uosToeflToToeic(score);
  // TOEIC 기준 환산표 (50 기본 + 50 실질)
  // 990→100, 765이하→50
  if (toeic >= 990) return 100;
  if (toeic <= 765) return 50;
  return 50 + ((toeic - 765) / 225) * 50;
}

// ========== 충남대 영어 ==========
function cnuEngTable(engType, score) {
  if (score === null) return null;
  // 16등급 (85~100)
  if (engType === 'toeic') {
    if (score >= 850) return 100;
    if (score >= 830) return 99;
    if (score >= 810) return 98;
    if (score >= 790) return 97;
    if (score >= 770) return 96;
    if (score >= 750) return 95;
    if (score >= 730) return 94;
    if (score >= 710) return 93;
    if (score >= 690) return 92;
    if (score >= 670) return 91;
    if (score >= 650) return 90;
    if (score >= 630) return 89;
    if (score >= 610) return 88;
    if (score >= 590) return 87;
    if (score >= 570) return 86;
    return 85;
  }
  if (engType === 'teps') {
    if (score >= 336) return 100;
    if (score >= 324) return 99;
    if (score >= 314) return 98;
    if (score >= 304) return 97;
    if (score >= 294) return 96;
    if (score >= 285) return 95;
    if (score >= 277) return 94;
    if (score >= 268) return 93;
    if (score >= 260) return 92;
    if (score >= 252) return 91;
    if (score >= 245) return 90;
    if (score >= 237) return 89;
    if (score >= 230) return 88;
    if (score >= 224) return 87;
    if (score >= 217) return 86;
    return 85;
  }
  if (engType === 'toefl') {
    if (score >= 98) return 100;
    if (score >= 95) return 99;
    if (score >= 93) return 98;
    if (score >= 90) return 97;
    if (score >= 87) return 96;
    if (score >= 85) return 95;
    if (score >= 83) return 94;
    if (score >= 81) return 93;
    if (score >= 79) return 92;
    if (score >= 77) return 91;
    if (score >= 75) return 90;
    if (score >= 72) return 89;
    if (score >= 70) return 88;
    if (score >= 68) return 87;  // PDF: 87점 = 68~69
    if (score >= 66) return 86;  // PDF: 86점 = 66~67
    return 85;                    // PDF: 85점 = 0~65
  }
  return null;
}

// ========== 영남대 영어 ==========
function yuEngTable(engType, score) {
  if (score === null) return null;
  if (engType === 'toeic') {
    if (score >= 950) return 100;
    if (score >= 900) return 95;
    if (score >= 600) return 90;
    return 90;
  }
  if (engType === 'teps') {
    if (score >= 428) return 100;
    if (score >= 370) return 95;
    if (score >= 227) return 90;
    return 90;
  }
  if (engType === 'toefl') {
    if (score >= 112) return 100;
    if (score >= 105) return 95;
    if (score >= 69) return 90;
    return 90;
  }
  return null;
}

// ========== 전북대 학부 환산표 ==========
// PDF [별표 1] 11구간: 98↑→15, 95↑→14.5, 93↑→14, 90↑→13.5, 88↑→13,
// 85↑→12.5, 83↑→12, 80↑→11, 75↑→9, 70↑→6, 69↓→0
function jbnuGpaTable(pct) {
  if (pct === null || pct === undefined) return null;
  if (pct >= 98) return 15;
  if (pct >= 95) return 14.5;
  if (pct >= 93) return 14;
  if (pct >= 90) return 13.5;
  if (pct >= 88) return 13;
  if (pct >= 85) return 12.5;
  if (pct >= 83) return 12;
  if (pct >= 80) return 11;
  if (pct >= 75) return 9;
  if (pct >= 70) return 6;
  return 0;
}

// ========== 원광대 영어 ==========
// PDF: 만점 20점 / 기본점수 19점. 산식 [(score-low) / (high-low)] + 19
// 상한↑ → 20.00, 하한↓ → 19.00 (기본점수)
function wonkwangEngTable(engType, score) {
  if (score === null || score === undefined) return null;
  const ranges = {
    toeic: { low: 750, high: 950 },
    teps:  { low: 285, high: 436 },
    toefl: { low:  85, high: 112 },
  };
  const r = ranges[engType];
  if (!r) return null;
  if (score >= r.high) return 20.00;
  if (score <= r.low) return 19.00;
  return 19 + (score - r.low) / (r.high - r.low);
}

// ===========================================================================
// 2026학년도 입시결과: 합격자 상위50% 커트라인 데이터
// 각 학교별 자체 채점 기준에 맞춘 상위50% 점수
// ===========================================================================
const ADMISSION_2026 = {
  '서울대': {
    // 백분위 기반 60점 만점
    year: 2026, enrolled: 152,
    leet: { val: 58.83, max: 60, label: 'LEET 환산', unit: '/ 60' },
    leet75: { val: 58.33, max: 60 },
    gpa:  { val: 58.86, max: 60, label: '학부 환산', unit: '/ 60' },
  },
  '고려대': {
    year: 2026, enrolled: 124,
    leet: { val: 140.9, max: null, label: 'LEET (표점합)', unit: '' },
    leet75: { val: 137.8, max: null },
    gpa:  { val: null, max: null, label: '학부', unit: '', note: '96.8%' },
    ref: '언어 백분위 50%=96.2, 추리 백분위 50%=97.3',
  },
  '연세대': {
    year: 2026, enrolled: 132,
    leet: { val: 140.70, max: 150, label: 'LEET 환산', unit: '/ 150' },
    leet75: { val: 139.70, max: 150 },
    gpa:  { val: 148.40, max: 150, label: '학부 환산', unit: '/ 150' },
  },
  '성균관대': {
    year: 2026, enrolled: 132,
    leet: { val: 136.6, max: null, label: 'LEET (표점합)', unit: '' },
    leet75: { val: 134.0, max: null },
    gpa:  { val: null, max: null, label: '학부', unit: '', note: '96.4%' },
  },
  '한양대': {
    year: 2026, enrolled: 105,
    leet: { val: 31.710, max: 40, label: 'LEET 환산', unit: '/ 40' },
    leet75: { val: 31.070, max: 40 },
    gpa:  { val: 18.751, max: 20, label: '학부 환산', unit: '/ 20' },
  },
  '서강대': {
    year: 2026, enrolled: 42,
    leet: { val: 125.6, max: null, label: 'LEET 가군 (표점합)', unit: '' },
    leet75: { val: 121.8, max: null },
    gpa:  { val: null, max: null, label: '학점', unit: '', note: '93.8%' },
    ref: '나군 LEET 50%=123.2 · 학점 나군 96.1%',
  },
  '한국외대': {
    year: 2026, enrolled: 55,
    leet: { val: 131.8, max: null, label: 'LEET (표점합)', unit: '' },
    leet75: { val: 128.8, max: null },
    gpa:  { val: 100, max: 100, label: '학부 환산', unit: '/ 100', note: 'GPA 4.0이상=100' },
    eng:  { val: 100, max: 100, label: '영어 환산', unit: '/ 100' },
  },
  '경희대': {
    year: 2026, enrolled: 65,
    leet: { val: 135.3, max: null, label: 'LEET (표점합)', unit: '' },
    leet75: { val: 131.2, max: null },
    gpa:  { val: null, max: null, label: '학부', unit: '', note: '97.97%' },
  },
  '이화여대': {
    year: 2026, enrolled: 106,
    leet: { val: 62.33, max: 70, label: 'LEET 환산', unit: '/ 70' },
    leet75: { val: 60.70, max: 70 },
    gpa:  { val: 38.14, max: 40, label: '학부 환산', unit: '/ 40' },
    eng:  { val: 20, max: 20, label: '영어 환산', unit: '/ 20' },
  },
  '서울시립대': {
    year: 2026, enrolled: 55,
    leet: { val: 132.0, max: null, label: 'LEET (표점합)', unit: '' },
    leet75: { val: 128.2, max: null },
    gpa:  { val: null, max: null, label: '학부', unit: '', note: '97.4%' },
    eng:  { val: null, max: null, label: '영어', unit: '', note: 'TOEIC 960' },
  },
  '중앙대': {
    year: 2026, enrolled: 55,
    leet: { val: 99, max: 100, label: 'LEET 환산', unit: '/ 100' },
    leet75: { val: 99, max: 100 },
    gpa:  { val: 100, max: 100, label: '학부 환산', unit: '/ 100', note: '환산 만점 몰림, 변별력 낮음' },
    eng:  { val: 100, max: 100, label: '영어 환산', unit: '/ 100' },
  },
  '건국대': {
    year: 2026, enrolled: 44,
    leet: { val: 129.7, max: null, label: 'LEET (표점합)', unit: '' },
    leet25: { val: 131.8, max: null },
    leet75: { val: 131.9, max: null },
    gpa:  { val: null, max: null, label: '학부', unit: '', note: '97.7%' },
    ref: '언어 55.5 + 추리 74.2',
  },
  '아주대': {
    year: 2026, enrolled: 55,
    leet: { val: 134.0, max: null, label: 'LEET 가군 (표점합)', unit: '' },
    leet25: { val: 129.8, max: null },
    leet75: { val: 129.7, max: null },
    gpa:  { val: null, max: null, label: '학점', unit: '', note: '97.8%' },
    eng:  { val: null, max: null, label: '영어', unit: '', note: '890' },
    ref: '나군 LEET 50%=129.7 · 학점 나군 96.0% · 영어 나군 955',
  },
  '인하대': {
    year: 2026, enrolled: 54,
    leet: { val: 125.2, max: null, label: 'LEET 가군 (표점합)', unit: '' },
    leet25: { val: 127.8, max: null },
    leet75: { val: 122.9, max: null },
    gpa:  { val: null, max: null, label: '학점 GPA', unit: '', note: '4.01 / 4.5' },
    eng:  { val: null, max: null, label: '영어', unit: '', note: '970' },
    ref: '나군 LEET 50%=125.5 · 학점 나군 4.23 · 영어 나군 975',
  },
  '부산대': {
    year: 2026, enrolled: 132,
    leet: { val: 19.74, max: 30, label: 'LEET 가군 환산', unit: '/ 30' },
    leet25: { val: 20.15, max: 30 },
    leet75: { val: 19.53, max: 30 },
    gpa:  { val: 29.45, max: 30, label: '학부 가군 환산', unit: '/ 30' },
    ref: '나군 LEET 50%=19.67, 학점 50%=29.50',
  },
  '경북대': {
    year: 2026, enrolled: 132,
    leet: { val: 127.5, max: null, label: 'LEET (표점합)', unit: '' },
    leet25: { val: 129.7, max: null },
    leet75: { val: 125.2, max: null },
    gpa:  { val: null, max: null, label: '학부', unit: '', note: '96.7%' },
  },
  '전남대': {
    year: 2026, enrolled: 126,
    leet: { val: 125.2, max: null, label: 'LEET 나군 (표점합)', unit: '' },
    leet25: { val: 127.5, max: null },
    leet75: { val: 123.2, max: null },
    gpa:  { val: null, max: null, label: '학점', unit: '', note: '97.8%' },
    ref: '가군일반 LEET 50%=125.5 · 학점 가군 97.0%',
  },
  '전북대': {
    year: 2026, enrolled: 88,
    leet: { val: 123.1, max: null, label: 'LEET (표점합)', unit: '' },
    leet25: { val: 125.1, max: null },
    leet75: { val: 122.6, max: null },
    gpa:  { val: null, max: null, label: '학부', unit: '', note: '96.6%' },
  },
  '충남대': {
    year: 2026, enrolled: 110,
    leet: { val: 66.24, max: 120, label: 'LEET 환산', unit: '/ 120' },
    leet25: { val: 67.78, max: 120 },
    leet75: { val: 64.63, max: 120 },
    gpa:  { val: null, max: null, label: '학부', unit: '', note: '98.1%' },
    eng:  { val: 100, max: 100, label: '영어 환산', unit: '/ 100' },
  },
  '충북대': {
    year: 2026, enrolled: 77,
    leet: { val: 168.61, max: 200, label: 'LEET 환산', unit: '/ 200' },
    leet25: { val: 171.47, max: 200 },
    leet75: { val: 167.75, max: 200 },
    gpa:  { val: null, max: null, label: '학부', unit: '', note: '98.0%' },
  },
  '강원대': {
    year: 2026, enrolled: 41,
    leet: { val: 125.4, max: null, label: 'LEET (표점합)', unit: '' },
    leet25: { val: 127.4, max: null },
    leet75: { val: 125.0, max: null },
    gpa:  { val: null, max: null, label: '학점', unit: '', note: '95.9%' },
  },
  '제주대': {
    year: 2026, enrolled: 44,
    leet: { val: 25.096, max: 40, label: 'LEET 가군 환산', unit: '/ 40' },
    leet25: { val: 25.496, max: 40 },
    leet75: { val: 24.744, max: 40 },
    gpa:  { val: 19.220, max: 20, label: '학부 가군 환산', unit: '/ 20' },
    ref: '나군 LEET 50%=25.096, 학점 50%=19.219',
  },
  '동아대': {
    year: 2026, enrolled: 86,
    leet: { val: 120.9, max: null, label: 'LEET (표점합)', unit: '' },
    leet25: { val: 123.5, max: null },
    leet75: { val: 118.5, max: null },
    gpa:  { val: null, max: null, label: '학부 GPA', unit: '', note: '4.03 / 4.5' },
    eng:  { val: null, max: null, label: '영어', unit: '', note: 'TOEIC 900' },
  },
  '원광대': {
    year: 2026, enrolled: 62,
    leet: { val: 116.2, max: null, label: 'LEET (표점합)', unit: '' },
    leet25: { val: 120.4, max: null },
    leet75: { val: 112.0, max: null },
    gpa:  { val: null, max: null, label: '학부 GPA', unit: '', note: '4.12 / 4.5' },
    eng:  { val: null, max: null, label: '영어', unit: '', note: 'TOEIC 935' },
  },
  '영남대': {
    year: 2026, enrolled: 76,
    leet: { val: 120.5, max: null, label: 'LEET (표점합)', unit: '' },
    leet25: { val: 122.8, max: null },
    leet75: { val: 116.2, max: null },
    gpa:  { val: null, max: null, label: '학부 GPA', unit: '', note: '4.18 / 4.5' },
    eng:  { val: null, max: null, label: '영어', unit: '', note: 'TOEIC 965' },
  },
};

export { LAW_SCHOOLS, ADMISSION_2026 };
