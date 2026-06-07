import { LEET } from '../../data/leet.js';

// ===========================================================================
// 표준점수 체계 (app.js에서 그대로 이식 — 수식 변경 없음)
// ===========================================================================
export function getStdParams(era, subject) {
  if (era === 'old') return { mean: 50, sd: 10 };
  if (subject === 'eon') return { mean: 45, sd: 9 };
  return { mean: 60, sd: 12 };
}

// 만점-원평균-표점평균-표점SD로부터 원점수 SD 역산
export function deriveRawSD(maxItems, rawMean, topStd, stdMean, stdSD) {
  if (topStd <= stdMean) return null;
  return (maxItems - rawMean) * stdSD / (topStd - stdMean);
}

// 환산 함수: 표가 있으면 룩업, 없으면 평균/SD로 보정 계산
export function getStdScore(year, subject, raw) {
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
    const keys = Object.keys(table).map(Number).filter(k => table[k][0] !== null);
    if (keys.length > 0) {
      const maxK = Math.max(...keys);
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

export function calcForYear(year, eonRaw, chuRaw) {
  const d = LEET[year];
  if (!d) return null;
  const eon = (eonRaw !== null) ? getStdScore(year, 'eon', eonRaw) : null;
  const chu = (chuRaw !== null) ? getStdScore(year, 'chu', chuRaw) : null;
  return { year, era: d.era, eon, chu };
}

export const ALL_YEARS = Object.keys(LEET).map(Number).sort((a, b) => a - b);
