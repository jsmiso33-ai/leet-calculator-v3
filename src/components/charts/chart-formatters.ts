// 사이트 차트는 학년도(연 단위) 데이터만 다루므로 Bklit 기본 날짜 포맷 대신 연도로 표기한다.
export const shortDateFmt = {
  format: (date: Date) => String(date.getFullYear()),
};

export const weekdayDateFmt = {
  format: (date: Date) => `${date.getFullYear()}학년도`,
};

export const hmsTimeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

// `Intl.NumberFormat.prototype.format` is a bound getter — safe to extract.
export const intFmt = new Intl.NumberFormat("en-US").format;
