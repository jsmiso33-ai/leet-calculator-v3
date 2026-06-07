import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// app.js renderLogChart 이식 — 시간순 표준점수 추이
export default function LogChart({ rows }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const valid = rows.filter((e) => e.total !== null);
  const labels = valid.map((e) => e.date.slice(5).replace('-', '/') + ` (${e.year})`);
  const data = valid.map((e) => e.total);
  const dataMin = valid.length ? Math.min(...data) : null;
  const dataMax = valid.length ? Math.max(...data) : null;
  const maxIndex = data.findIndex((v) => v === dataMax);
  const recent = valid.length ? valid[valid.length - 1] : null;
  const spread = (dataMax != null && dataMin != null) ? dataMax - dataMin : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    if (!canvas || !valid.length) return;
    const ctx = canvas.getContext('2d');
    const eonStds = valid.map((e) => e.eonStd);
    const chuStds = valid.map((e) => e.chuStd);
    const memos = valid.map((e) => e.memo);
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
          label: '표점 합계', data,
          borderColor: '#2563EB', backgroundColor: fillGradient,
          borderWidth: 2.4, pointRadius: 4, pointHoverRadius: 6,
          pointBackgroundColor: (c) => { const v = c.parsed && c.parsed.y; if (v === dataMax) return '#2563EB'; if (v === dataMin) return '#0F766E'; return '#FFFFFF'; },
          pointBorderColor: (c) => { const v = c.parsed && c.parsed.y; return v === dataMin ? '#0F766E' : '#2563EB'; },
          pointBorderWidth: 2, pointHitRadius: 14, tension: 0.24, fill: true,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { top: 32, right: 26, bottom: 10, left: 18 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.98)', borderColor: 'rgba(15, 23, 42, 0.12)', borderWidth: 1,
            titleColor: '#0F172A', bodyColor: '#334155',
            titleFont: { family: 'JetBrains Mono, monospace', size: 13, weight: 'bold' },
            bodyFont: { family: 'Pretendard, -apple-system, sans-serif', size: 12 },
            padding: 14, displayColors: false, cornerRadius: 8, caretPadding: 8,
            callbacks: {
              label: (c) => {
                const i = c.dataIndex;
                const lines = ['합계: ' + data[i].toFixed(1)];
                if (eonStds[i] !== null) lines.push('  언어이해: ' + eonStds[i].toFixed(1));
                if (chuStds[i] !== null) lines.push('  추리논증: ' + chuStds[i].toFixed(1));
                if (memos[i]) lines.push('  메모: ' + memos[i]);
                return lines;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false, min: yMin, max: yMax, border: { display: false },
            grid: { color: 'rgba(15, 23, 42, 0.07)', drawTicks: false },
            ticks: { padding: 10, font: { family: 'JetBrains Mono, monospace', size: 11 }, color: '#64748B' },
            title: { display: true, text: '합계 표준점수', font: { family: 'Pretendard, -apple-system, sans-serif', size: 11, weight: '700' }, color: '#334155' },
          },
          x: {
            border: { display: false }, grid: { display: false }, offset: true,
            ticks: { padding: 8, font: { family: 'JetBrains Mono, monospace', size: 11, weight: '700' }, color: '#334155', maxRotation: 45, minRotation: 0 },
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
            let textAlign = 'center';
            if (point.x - textWidth / 2 < chartArea.left + 2) textAlign = 'left';
            else if (point.x + textWidth / 2 > chartArea.right - 2) textAlign = 'right';
            c.textAlign = textAlign;
            c.strokeStyle = 'rgba(255,255,255,0.94)';
            c.lineWidth = 4;
            c.strokeText(text, point.x, labelY);
            c.fillText(text, point.x, labelY);
          });
          c.restore();
        },
      }],
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  return (
    <>
      <div className="chart-summary" id="logChartSummary" aria-live="polite">
        {valid.length > 0 && (
          <>
            <div className="chart-pill chart-pill-strong"><span className="chart-pill-label">최근</span><span className="chart-pill-value">{recent.date.slice(5).replace('-', '/')} · {recent.total.toFixed(1)}</span></div>
            <div className="chart-pill"><span className="chart-pill-label">최고</span><span className="chart-pill-value">{labels[maxIndex]} · {dataMax.toFixed(1)}</span></div>
            <div className="chart-pill"><span className="chart-pill-label">변동폭</span><span className="chart-pill-value">{spread.toFixed(1)}</span></div>
          </>
        )}
      </div>
      <div className="chart-wrap"><canvas ref={canvasRef} /></div>
    </>
  );
}
