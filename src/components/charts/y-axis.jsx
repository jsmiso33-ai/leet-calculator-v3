import { chartCssVars, useYScale } from './chart-context';

// Grid의 가로선과 같은 눈금(yScale.ticks)에 값 라벨을 붙이는 왼쪽 Y축
export function YAxis({ numTicks = 5, yAxisId, format = (v) => String(v), offset = 10 }) {
  const yScale = useYScale(yAxisId);
  const ticks = yScale.ticks ? yScale.ticks(numTicks) : [];

  return (
    <g aria-hidden="true">
      {ticks.map((value) => (
        <text
          key={value}
          x={-offset}
          y={yScale(value)}
          dy="0.32em"
          textAnchor="end"
          fill={chartCssVars.label}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
        >
          {format(value)}
        </text>
      ))}
    </g>
  );
}

// 차트 셸이 이름으로 축을 식별해 시리즈 reveal 클립 밖에 렌더한다(빌드 시 함수명 축약 대비).
YAxis.displayName = 'YAxis';

export default YAxis;
