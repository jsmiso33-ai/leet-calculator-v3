import { LineChart, Line } from './charts/line-chart';
import { Grid } from './charts/grid';
import { XAxis } from './charts/x-axis';
import { YAxis } from './charts/y-axis';
import { PointLabels } from './charts/point-labels';
import { ChartTooltip } from './charts/tooltip';

// 연도별 표준점수 합계 추이 차트
export default function TrendChart({ results }) {
  const sorted = [...results].sort((a, b) => a.year - b.year);
  const chartData = sorted
    .filter((r) => r.eon && r.chu && r.eon.std !== null && r.chu.std !== null)
    .map((r) => ({
      date: new Date(r.year, 0, 1),
      year: r.year,
      total: r.eon.std + r.chu.std,
      eon: r.eon.std,
      chu: r.chu.std,
    }));

  if (!chartData.length) return null;

  const totals = chartData.map((d) => d.total);
  const dataMax = Math.max(...totals);
  const dataMin = Math.min(...totals);
  const maxPoint = chartData.find((d) => d.total === dataMax);
  const minPoint = chartData.find((d) => d.total === dataMin);

  return (
    <>
      <div className="chart-summary" aria-live="polite">
        <div className="chart-pill chart-pill-strong">
          <span className="chart-pill-label">최고</span>
          <span className="chart-pill-value">{maxPoint.year} · {dataMax.toFixed(1)}</span>
        </div>
        <div className="chart-pill">
          <span className="chart-pill-label">최저</span>
          <span className="chart-pill-value">{minPoint.year} · {dataMin.toFixed(1)}</span>
        </div>
        <div className="chart-pill">
          <span className="chart-pill-label">변동폭</span>
          <span className="chart-pill-value">{(dataMax - dataMin).toFixed(1)}</span>
        </div>
      </div>
      <div className="chart-wrap">
        <LineChart
          data={chartData}
          xDataKey="date"
          aspectRatio=""
          style={{ height: '100%' }}
          margin={{ top: 28, right: 32, bottom: 40, left: 56 }}
          xDomain={[
            new Date(chartData[0].year - 1, 8, 1),
            new Date(chartData[chartData.length - 1].year, 4, 1),
          ]}
          xDomainSlotCount={chartData.length}
          revealSignature={chartData.map((d) => `${d.year}:${d.total}`).join('|')}
        >
          <Grid horizontal />
          <YAxis />
          <Line
            dataKey="total"
            fadeEdges={false}
            showMarkers
            stroke="var(--chart-line-primary)"
            strokeWidth={2.5}
          />
          <PointLabels dataKey="total" format={(v) => v.toFixed(1)} />
          <XAxis tickMode="data" />
          <ChartTooltip
            panelStyle={{
              border: '1px solid var(--line-strong)',
              boxShadow: 'var(--shadow-lg)',
              fontFamily: 'var(--font-sans)',
            }}
            rows={(point) => [
              { color: 'var(--chart-line-primary)', label: '합계', value: point.total.toFixed(1) },
              { color: 'var(--chart-2)', label: '언어이해', value: point.eon.toFixed(1) },
              { color: 'var(--chart-3)', label: '추리논증', value: point.chu.toFixed(1) },
            ]}
          />
        </LineChart>
      </div>
    </>
  );
}
