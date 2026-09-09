// Preserve the typed value; invalid scores must never be silently clamped or rounded.
export function validateRawInput(value, maxItems, subject) {
  const text = String(value ?? '').trim();
  if (!text) return { raw: null, error: null };
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(Number(text)) || Number(text) > maxItems) {
    return { raw: null, error: `${subject}는 0~${maxItems}개 사이의 정수로 입력하세요.` };
  }
  return { raw: Number(text), error: null };
}
