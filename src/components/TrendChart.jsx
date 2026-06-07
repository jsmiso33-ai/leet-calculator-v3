import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// 연도별 표준점수 합계 추이 차트 (app.js renderChart 이식)
export default function TrendChart({ results }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const sorted = [...results].sort((a, b) => a.year - b.year);
  const labels = sorted.map((r) => r.year);
  const totalData = sorted.map((r) =>
    (r.eon && r.chu && r.eon.std !== null && r.chu.std !== null) ? r.eon.std + r.chu.std : null
  );
  const validData = totalData.filter((v) => v !== null && !isNaN(v));
  const dataMin = validData.length ? Math.min(...validData) : null;
  const dataMax = validData.length ? Math.max(...validData) : null;
  const minIndex = totalData.findIndex((v) => v === dataMin);
  const maxIndex = totalData.findIndex((v) => v === dataMax);
  const spread = (dataMax != null && dataMin != null) ? dataMax - dataMin : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    if (!canvas || !validData.length) return;

    const ctx = canvas.getContext('2d');
    const eonStds = sorted.map((r) => (r.eon ? r.eon.std : null));
    const chuStds = sorted.map((r) => (r.chu ? r.chu.std : null));
    const range = dataMax - dataMin;
    const padTop = Math.max(range * 0.25, 4);
    const padBottom = Math.max(range * 0.15, 2);
    const yMin = Math.floor((dataMin - padBottom) * 2) / 2;
    const yMax = Math.ceil((dataMax + padTop) * 2) / 2;
    const fillGradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 360);
    fillGradient.addColorStop(0, 'rgba(37, 99, 235, 0.14)');
    fillGradient.addColorStop(0.62, 'rgba(37, 99, 235, 0.05)');
    fillGradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '표준점수 합계',
          data: totalData,
          borderColor: '#2563EB',
          backgroundColor: fillGradient,
          borderWidth: 2.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: (c) => {
            const value = c.parsed && c.parsed.y;
            if (value === dataMax) return '#2563EB';
            if (value === dataMin) return '#0F766E';
            return '#FFFFFF';
          },
          pointBorderColor: (c) => {
            const value = c.parsed && c.parsed.y;
            return value === dataMin ? '#0F766E' : '#2563EB';
          },
          pointBorderWidth: 2,
          pointHitRadius: 14,
          tension: 0.24,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { top: 32, right: 26, bottom: 10, left: 18 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.98)',
            borderColor: 'rgba(15, 23, 42, 0.12)',
            borderWidth: 1,
            titleColor: '#0F172A',
            bodyColor: '#334155',
            titleFont: { family: 'JetBrains Mono, monospace', size: 13, weight: 'bold' },
            bodyFont: { family: 'Pretendard, -apple-system, sans-serif', size: 12 },
            padding: 14,
            displayColors: false,
            cornerRadius: 8,
            caretPadding: 8,
            callbacks: {
              title: (items) => items[0].label + '학년도',
              label: (c) => {
                const i = c.dataIndex;
                const lines = [];
                const total = c.parsed.y;
                if (total !== null && !isNaN(total)) lines.push('합계: ' + total.toFixed(1));
                if (eonStds[i] !== null) lines.push('  언어이해: ' + eonStds[i].toFixed(1));
                if (chuStds[i] !== null) lines.push('  추리논증: ' + chuStds[i].toFixed(1));
                return lines;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            min: yMin,
            max: yMax,
            border: { display: false },
            grid: { color: 'rgba(15, 23, 42, 0.07)', drawTicks: false },
            ticks: { padding: 10, font: { family: 'JetBrains Mono, monospace', size: 11 }, color: '#64748B' },
            title: {
              display: true,
              text: '합계 표준점수',
              font: { family: 'Pretendard, -apple-system, sans-serif', size: 11, weight: '700' },
              color: '#334155',
            },
          },
          x: {
            border: { display: false },
            grid: { display: false },
            offset: true,
            ticks: { padding: 8, font: { family: 'JetBrains Mono, monospace', size: 12, weight: '700' }, color: '#334155' },
          },
        },
      },
      plugins: [{
        id: 'pointLabels',
        afterDatasetsDraw(chart) {
          const { ctx: c, chartArea } = chart;
          const dataset = chart.data.datasets[0];
          const meta = chart.getDatasetMeta(0);
          c.save();
          c.font = '700 11px JetBrains Mono, monospace';
          c.fillStyle = '#0F172A';
          c.textBaseline = 'middle';
          meta.data.forEach((point, i) => {
            const v = dataset.data[i];
            if (v === null || isNaN(v)) return;
            const text = v.toFixed(1);
            const textWidth = c.measureText(text).width;
            let labelY = point.y - 16;
            if (labelY - 6 < chartArea.top) labelY = point.y + 16;
            let labelX = point.x;
            let textAlign = 'center';
            if (point.x - textWidth / 2 < chartArea.left + 2) { labelX = point.x; textAlign = 'left'; }
            else if (point.x + textWidth / 2 > chartArea.right - 2) { labelX = point.x; textAlign = 'right'; }
            c.textAlign = textAlign;
            c.strokeStyle = 'rgba(255,255,255,0.94)';
            c.lineWidth = 4;
            c.strokeText(text, labelX, labelY);
            c.fillText(text, labelX, labelY);
          });
          c.restore();
        },
      }],
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  return (
    <>
      <div className="chart-summary" aria-live="polite">
        {validData.length > 0 && (
          <>
            <div className="chart-pill chart-pill-strong">
              <span className="chart-pill-label">최고</span>
              <span className="chart-pill-value">{labels[maxIndex]} · {dataMax.toFixed(1)}</span>
            </div>
            <div className="chart-pill">
              <span className="chart-pill-label">최저</span>
              <span className="chart-pill-value">{labels[minIndex]} · {dataMin.toFixed(1)}</span>
            </div>
            <div className="chart-pill">
              <span className="chart-pill-label">변동폭</span>
              <span className="chart-pill-value">{spread.toFixed(1)}</span>
            </div>
          </>
        )}
      </div>
      <div className={'chart-wrap' + (validData.length ? '' : ' chart-empty')}>
        <canvas ref={canvasRef} />
      </div>
    </>
  );
}
