import { LineChart, Line } from './charts/line-chart';
import { Grid } from './charts/grid';
import { XAxis } from './charts/x-axis';
import { YAxis } from './charts/y-axis';
import { PointLabels } from './charts/point-labels';
import { ChartTooltip } from './charts/tooltip';

const shortDate = (iso) => iso.slice(5).replace('-', '/');

// 시간순 표준점수 추이. 풀이 날짜 간격과 무관하게 기록을 같은 간격으로 놓기 위해
// 순번을 가상 날짜로 쓰고, 축·툴팁에는 실제 날짜를 __label/__title로 넘긴다.
export default function LogChart({ rows }) {
  const valid = rows.filter((e) => e.total !== null);
  if (!valid.length) return null;

  const chartData = valid.map((e, i) => ({
    date: new Date(2000, 0, 1 + i),
    __label: shortDate(e.date),
    __title: `${e.date.replaceAll('-', '.')} · ${e.year}학년도 기출`,
    total: e.total,
    eon: e.eonStd,
    chu: e.chuStd,
    memo: e.memo,
  }));

  const totals = valid.map((e) => e.total);
  const dataMax = Math.max(...totals);
  const dataMin = Math.min(...totals);
  const maxEntry = valid[totals.indexOf(dataMax)];
  const recent = valid[valid.length - 1];
  const last = chartData.length - 1;

  return (
    <>
      <div className="chart-summary" id="logChartSummary" aria-live="polite">
        <div className="chart-pill chart-pill-strong"><span className="chart-pill-label">최근</span><span className="chart-pill-value">{shortDate(recent.date)} · {recent.total.toFixed(1)}</span></div>
        <div className="chart-pill"><span className="chart-pill-label">최고</span><span className="chart-pill-value">{shortDate(maxEntry.date)} ({maxEntry.year}) · {dataMax.toFixed(1)}</span></div>
        <div className="chart-pill"><span className="chart-pill-label">변동폭</span><span className="chart-pill-value">{(dataMax - dataMin).toFixed(1)}</span></div>
      </div>
      <div className="chart-wrap">
        <LineChart
          data={chartData}
          xDataKey="date"
          aspectRatio=""
          style={{ height: '100%' }}
          margin={{ top: 28, right: 32, bottom: 40, left: 56 }}
          xDomain={[new Date(2000, 0, 1, -8), new Date(2000, 0, 1 + last, 8)]}
          xDomainSlotCount={chartData.length}
          revealSignature={chartData.map((d) => `${d.__title}:${d.total}`).join('|')}
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
              ...(point.eon != null ? [{ color: 'var(--chart-2)', label: '언어이해', value: point.eon.toFixed(1) }] : []),
              ...(point.chu != null ? [{ color: 'var(--chart-3)', label: '추리논증', value: point.chu.toFixed(1) }] : []),
              ...(point.memo ? [{ color: 'transparent', label: '메모', value: point.memo }] : []),
            ]}
          />
        </LineChart>
      </div>
    </>
  );
}
