import { useChart, useYScale } from './chart-context';

// 각 데이터 점 위에 값 라벨을 그린다. 흰 외곽선(halo)으로 선·격자 위에서도 읽히게 한다.
export function PointLabels({ dataKey, yAxisId, format = (v) => String(v), gap = 14 }) {
  const { data, xScale, xAccessor, margin, chartPhase } = useChart();
  const yScale = useYScale(yAxisId);
  const visible = chartPhase === 'ready';

  return (
    <g
      aria-hidden="true"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 240ms ease-out', pointerEvents: 'none' }}
    >
      {data.map((d, i) => {
        const value = d[dataKey];
        if (typeof value !== 'number' || Number.isNaN(value)) return null;
        const x = xScale(xAccessor(d));
        const y = yScale(value);
        // 위쪽 여백이 모자라면 점 아래에 표시
        const labelY = y - gap + margin.top < 10 ? y + gap + 6 : y - gap;
        return (
          <text
            key={i}
            x={x}
            y={labelY}
            textAnchor="middle"
            fill="var(--ink)"
            stroke="rgba(255, 255, 255, 0.94)"
            strokeWidth={4}
            strokeLinejoin="round"
            paintOrder="stroke"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}
          >
            {format(value)}
          </text>
        );
      })}
    </g>
  );
}

// 시리즈 reveal 클립 밖(오버레이 뒤)에 렌더해 위쪽 라벨이 잘리지 않게 한다.
PointLabels.__isPostOverlay = true;
PointLabels.displayName = 'PointLabels';

export default PointLabels;
