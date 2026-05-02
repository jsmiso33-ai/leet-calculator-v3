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
    calc(input) {
      let leet = null;
      if (input.eonStd !== null && input.chuStd !== null) {
        const sum = input.eonStd + input.chuStd;
        leet = 85 + 65 * (sum / 210);
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
function yonseiLeetTable(sum) {
  // 환산표1: LEET 표점합 → 환산점수 (168이상=150, 85이하=50)
  // 연세대 PDF 별첨 환산표1 데이터 (1점 단위)
  if (sum >= 168) return 150;
  if (sum <= 85) return 50;
  const tbl = [
    [168,150.0],[167,149.7],[166,149.4],[165,149.1],[164,148.8],
    [163,148.5],[162,148.2],[161,147.9],[160,147.6],[159,147.3],
    [158,147.0],[157,146.7],[156,146.4],[155,146.1],[154,145.8],
    [153,145.5],[152,145.2],[151,144.9],[150,144.6],[149,144.3],
    [148,144.0],[147,143.7],[146,143.4],[145,143.1],[144,142.8],
    [143,142.5],[142,142.2],[141,141.9],[140,141.6],[139,141.3],
    [138,141.0],[137,140.7],[136,140.4],[135,140.1],[134,139.7],
    [133,139.3],[132,138.9],[131,138.5],[130,138.1],[129,137.6],
    [128,137.1],[127,136.6],[126,136.1],[125,135.6],[124,135.1],
    [123,134.6],[122,134.1],[121,133.6],[120,133.1],[119,132.6],
    [118,132.1],[117,131.6],[116,131.1],[115,130.6],[114,130.1],
    [113,129.6],[112,129.1],[111,128.6],[110,128.1],[109,127.1],
    [108,126.1],[107,125.1],[106,124.1],[105,123.1],[104,121.6],
    [103,120.1],[102,118.6],[101,117.1],[100,115.6],[99,113.6],
    [98,111.6],[97,109.6],[96,107.6],[95,105.6],[94,103.1],
    [93,100.6],[92,98.1],[91,95.6],[90,93.1],[89,90.1],
    [88,87.1],[87,84.1],[86,81.1],[85,50.0],
  ];
  // 정수면 직접 룩업
  const rounded = Math.round(sum);
  for (let i = 0; i < tbl.length; i++) {
    if (rounded === tbl[i][0]) return tbl[i][1];
  }
  // 소수점이면 선형 보간
  for (let i = 0; i < tbl.length - 1; i++) {
    if (sum >= tbl[i+1][0] && sum <= tbl[i][0]) {
      const [x1, y1] = tbl[i+1];
      const [x2, y2] = tbl[i];
      return y1 + (y2 - y1) * (sum - x1) / (x2 - x1);
    }
  }
  return 50;
}

function yonseiGpaTable(pct) {
  // 환산표2: 학점 백분위 → 환산점수 (50~150)
  // 연세대 PDF 별첨 환산표2 데이터
  // 100%=150, 비선형 변환 (73.5% 이하에서 급격한 감소)
  if (pct >= 100) return 150;
  if (pct <= 0) return 50;
  // 0.5% 단위 핵심 구간 포함
  const tbl = [
    [100.0,150.0],[99.5,149.7],[99.0,149.4],[98.5,149.1],[98.0,148.8],
    [97.5,148.5],[97.0,148.2],[96.5,147.9],[96.0,147.6],[95.5,147.3],
    [95.0,147.0],[94.5,146.7],[94.0,146.4],[93.5,146.1],[93.0,145.8],
    [92.5,145.5],[92.0,145.2],[91.5,144.9],[91.0,144.6],[90.5,144.3],
    [90.0,144.0],[89.5,143.7],[89.0,143.4],[88.5,143.1],[88.0,142.8],
    [87.5,142.5],[87.0,142.2],[86.5,141.9],[86.0,141.6],[85.5,141.3],
    [85.0,141.0],[84.5,140.7],[84.0,140.4],[83.5,140.1],[83.0,139.7],
    [82.5,139.3],[82.0,138.9],[81.5,138.5],[81.0,138.1],[80.5,137.6],
    [80.0,137.1],[79.5,136.6],[79.0,136.1],[78.5,135.6],[78.0,135.1],
    [77.5,134.6],[77.0,134.1],[76.5,133.6],[76.0,133.1],[75.5,132.6],
    [75.0,132.1],[74.5,131.1],[74.0,130.1],[73.5,128.1],
    [73.0,125.6],[72.5,123.1],[72.0,120.6],[71.5,118.1],
    [71.0,115.6],[70.0,110.6],[69.0,105.6],[68.0,100.6],
    [67.0,95.6],[66.0,90.6],[65.0,85.6],[64.0,80.6],
    [63.0,75.6],[62.0,70.6],[60.0,65.0],[58.0,60.0],
    [55.0,55.0],[52.0,50.0],
  ];
  for (let i = 0; i < tbl.length - 1; i++) {
    if (pct >= tbl[i+1][0] && pct <= tbl[i][0]) {
      const [x1, y1] = tbl[i+1];
      const [x2, y2] = tbl[i];
      return y1 + (y2 - y1) * (pct - x1) / (x2 - x1);
    }
  }
  return 50;
}

// ========== 고려대 ==========
function koreaLeetEon(pct) {
  // 별첨2: 백분위 → 언어이해 환산점수 (만점 80, 하한 ~35)
  // 고려대 PDF 별첨2 완전 데이터
  if (pct >= 100) return 80.0;
  if (pct < 21) return 35.0;
  const tbl = [
    [100,80.0],[99,79.6],[98,79.2],[97,78.8],[96,78.4],
    [95,78.0],[94,77.8],[93,77.7],[92,77.5],[91,77.4],
    [90,77.2],[89,77.1],[88,77.0],[87,76.8],[86,76.6],
    [85,76.4],[84,76.2],[83,76.0],[82,75.8],[81,75.6],
    [80,75.4],[79,75.2],[78,75.0],[77,74.8],[76,74.6],
    [75,74.4],[74,74.2],[73,74.0],[72,73.8],[71,73.6],
    [70,73.4],[69,73.2],[68,73.0],[67,72.8],[66,72.6],
    [65,72.4],[64,72.2],[63,72.0],[62,71.8],[61,71.6],
    [60,71.4],[59,71.3],[58,71.2],[57,71.1],[56,71.0],
    [55,70.9],[54,70.85],[53,70.8],[52,70.75],[51,70.7],
    [50,70.6],[49,70.55],[48,70.5],[47,70.45],[46,70.4],
    [45,70.35],[44,70.3],[43,70.25],[42,70.2],[41,70.15],
    [40,70.1],[39,70.05],[38,70.0],[37,69.95],[36,69.9],
    [35,69.85],[34,69.8],[33,69.75],[32,69.7],[31,69.65],
    [30,69.6],[29,69.5],[28,69.4],[27,69.3],[26,69.2],
    [25,69.0],[24,68.6],[23,68.0],[22,67.0],[21,35.0],
  ];
  for (let i = 0; i < tbl.length - 1; i++) {
    if (pct >= tbl[i+1][0] && pct <= tbl[i][0]) {
      const [x1, y1] = tbl[i+1];
      const [x2, y2] = tbl[i];
      return y1 + (y2 - y1) * (pct - x1) / (x2 - x1);
    }
  }
  return 35.0;
}

function koreaLeetChu(pct) {
  // 별첨2: 백분위 → 추리논증 환산점수 (만점 120, 하한 ~69)
  if (pct >= 100) return 120.0;
  if (pct < 21) return 69.0;
  const tbl = [
    [100,120.0],[99,119.4],[98,118.8],[97,118.2],[96,117.6],
    [95,117.0],[94,116.4],[93,115.6],[92,114.8],[91,114.0],
    [90,113.2],[89,112.6],[88,112.0],[87,111.4],[86,110.8],
    [85,110.2],[84,109.6],[83,109.0],[82,108.4],[81,107.8],
    [80,107.2],[79,106.6],[78,106.0],[77,105.4],[76,104.8],
    [75,104.2],[74,103.6],[73,103.0],[72,102.4],[71,101.8],
    [70,101.2],[69,100.6],[68,100.0],[67,99.4],[66,98.8],
    [65,98.2],[64,97.6],[63,97.0],[62,96.4],[61,95.8],
    [60,95.2],[59,94.8],[58,94.4],[57,94.0],[56,93.6],
    [55,93.2],[54,92.8],[53,92.4],[52,92.0],[51,91.6],
    [50,91.2],[49,90.8],[48,90.4],[47,90.0],[46,89.6],
    [45,89.2],[44,88.8],[43,88.4],[42,88.0],[41,87.6],
    [40,87.2],[39,86.8],[38,86.4],[37,86.0],[36,85.6],
    [35,85.2],[34,84.8],[33,84.4],[32,84.0],[31,83.6],
    [30,83.2],[29,82.4],[28,81.6],[27,80.8],[26,80.0],
    [25,78.8],[24,77.2],[23,75.2],[22,72.4],[21,69.0],
  ];
  for (let i = 0; i < tbl.length - 1; i++) {
    if (pct >= tbl[i+1][0] && pct <= tbl[i][0]) {
      const [x1, y1] = tbl[i+1];
      const [x2, y2] = tbl[i];
      return y1 + (y2 - y1) * (pct - x1) / (x2 - x1);
    }
  }
  return 69.0;
}

function koreaGpaTable(pct) {
  // 별첨1: 학점 백분위 → 환산점수 (만점 150, 하한 ~130)
  if (pct >= 100) return 150.0;
  if (pct <= 0) return 130.0;
  const tbl = [
    [100,150.0],[99,149.6],[98,149.2],[97,148.6],[96,148.0],
    [95,147.4],[94,146.8],[93,146.4],[92,146.1],[91,145.8],
    [90,145.2],[89,143.8],[88,142.0],[87,140.5],[86,139.2],
    [85,137.8],[84,136.6],[83,135.8],[82,135.0],[81,134.4],
    [80,133.8],[79,133.4],[78,133.0],[77,132.6],[76,132.2],
    [75,131.8],[74,131.6],[73,131.4],[72,131.2],[71,131.0],
    [70,130.8],
  ];
  for (let i = 0; i < tbl.length - 1; i++) {
    if (pct >= tbl[i+1][0] && pct <= tbl[i][0]) {
      const [x1, y1] = tbl[i+1];
      const [x2, y2] = tbl[i];
      return y1 + (y2 - y1) * (pct - x1) / (x2 - x1);
    }
  }
  if (pct > 100) return 150.0;
  return 130.0;
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
function chungangLeetTable(sum) {
  // 130 이상 100, 125~130 99, 85 미만 75 등
  if (sum >= 130) return 100;
  if (sum >= 125) return 99;
  if (sum >= 120) return 98;
  if (sum >= 115) return 96;
  if (sum >= 110) return 94;
  if (sum >= 105) return 92;
  if (sum >= 100) return 90;
  if (sum >= 95) return 87;
  if (sum >= 90) return 83;
  if (sum >= 85) return 79;
  return 75;
}

function chungangGpaTable(gpa45) {
  if (gpa45 >= 4.10) return 100;
  if (gpa45 >= 3.80) return 99;
  if (gpa45 >= 3.50) return 98;
  if (gpa45 >= 3.10) return 97;
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

// ========== 시립대 ==========
function uosTepsToToeic(teps) {
  // 대략적 환산 (실제 환산표 단순화)
  if (teps >= 555) return 990;
  if (teps >= 387) return 800;
  if (teps >= 309) return 700;
  if (teps >= 268) return 600;
  return 500;
}

function uosToeflToToeic(toefl) {
  if (toefl >= 110) return 990;
  if (toefl >= 95) return 900;
  if (toefl >= 87) return 800;
  if (toefl >= 76) return 700;
  return 600;
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
  if (score === null) return null;
  // 1등급(만점) → 100점, 13등급 → 40점, 미만 → 40점
  // 환산점수 = 성적반영점수 × 0.12 + 8 (만점 기준 100×0.12+8 = 20)
  let raw = null;
  if (engType === 'toefl') {
    if (score >= 105) raw = 100;
    else if (score >= 100) raw = 95;
    else if (score >= 95) raw = 90;
    else if (score >= 90) raw = 85;
    else if (score >= 85) raw = 80;
    else if (score >= 80) raw = 75;
    else if (score >= 75) raw = 70;
    else if (score >= 70) raw = 65;
    else if (score >= 65) raw = 60;
    else if (score >= 60) raw = 55;
    else if (score >= 55) raw = 50;
    else if (score >= 50) raw = 45;
    else raw = 40;
  } else if (engType === 'toeic') {
    if (score >= 900) raw = 100;
    else if (score >= 850) raw = 95;
    else if (score >= 800) raw = 90;
    else if (score >= 750) raw = 85;
    else if (score >= 700) raw = 80;
    else if (score >= 650) raw = 75;
    else if (score >= 600) raw = 70;
    else if (score >= 550) raw = 65;
    else if (score >= 500) raw = 60;
    else if (score >= 450) raw = 55;
    else if (score >= 400) raw = 50;
    else if (score >= 350) raw = 45;
    else raw = 40;
  } else if (engType === 'teps') {
    if (score >= 370) raw = 100;
    else if (score >= 340) raw = 95;
    else if (score >= 310) raw = 90;
    else if (score >= 280) raw = 85;
    else if (score >= 250) raw = 80;
    else if (score >= 220) raw = 75;
    else raw = 40;
  }
  if (raw === null) return null;
  return raw * 0.12 + 8;
}

// ========== 인하대 학부/영어 환산표 ==========
function inhaGpaTable(gpa45) {
  if (gpa45 >= 4.30) return 200;
  if (gpa45 >= 4.0) return 195;
  if (gpa45 >= 3.7) return 190;
  if (gpa45 >= 3.4) return 185;
  if (gpa45 >= 3.0) return 180;
  if (gpa45 >= 2.5) return 170;
  if (gpa45 >= 2.0) return 150;
  if (gpa45 >= 1.5) return 120;
  return 90;  // 기본점수
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
    if (score >= 69) return 87;
    if (score >= 68) return 86;
    return 85;
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
function jbnuGpaTable(pct) {
  if (pct >= 98) return 15;
  if (pct >= 95) return 14.5;
  if (pct >= 93) return 14;
  if (pct >= 90) return 13;
  if (pct >= 85) return 12;
  if (pct >= 80) return 10;
  if (pct >= 75) return 8;
  if (pct >= 70) return 6;
  return 0;
}

// ========== 원광대 영어 ==========
function wonkwangEngTable(engType, score) {
  if (score === null) return null;
  // 단순 비례 환산 (만점 20점)
  // TOEIC 750~950, TEPS 285~436, TOEFL 85~112
  if (engType === 'toeic') {
    if (score >= 950) return 20;
    if (score < 750) return 0;
    return 5 + ((score - 750) / 200) * 15;
  }
  if (engType === 'teps') {
    if (score >= 436) return 20;
    if (score < 285) return 0;
    return 5 + ((score - 285) / 151) * 15;
  }
  if (engType === 'toefl') {
    if (score >= 112) return 20;
    if (score < 85) return 0;
    return 5 + ((score - 85) / 27) * 15;
  }
  return null;
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
