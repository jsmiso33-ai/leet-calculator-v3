// LEET 지원권 판정 — 전년도 입시결과의 합격자 LEET 50%선(중간값)과 75%선(하위 25% 지점) 기준.
// 75%선은 50%선보다 낮은 점수다(예: 고려대 50%선 140.9, 75%선 137.8).
//   안정: 50%선 이상  ·  적정: 75%선 이상  ·  도전: 75%선 아래 (50%선-75%선 간격) 이내  ·  위험: 그 아래
// 75%선이 없거나 50%선보다 낮지 않은 학교는 50%선 아래 기본 폭을 75%선 대신 쓴다.
// (원자료 확인됨: 건국대 75%선 131.9 > 50%선 129.7, 중앙대 두 선 모두 99 — 데이터는 수정하지 않는다)
export const DEFAULT_BAND_GAP = 3;

export function gradeFromCutoffs(myLeet, leet50, leet75) {
  if (!Number.isFinite(myLeet) || !Number.isFinite(leet50)) return null;
  const lower = Number.isFinite(leet75) && leet75 < leet50 ? leet75 : leet50 - DEFAULT_BAND_GAP;
  const gap = leet50 - lower;
  if (myLeet >= leet50) return 'safe';
  if (myLeet >= lower) return 'match';
  if (myLeet >= lower - gap) return 'reach';
  return 'hard';
}
