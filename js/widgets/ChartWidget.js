import { Widget } from '../core/Widget.js';
import { fetchCbr, parseDynamic } from '../api/cbr.js';

const CURRENCIES = [
  { code: 'R01235', label: 'USD' },
  { code: 'R01239', label: 'EUR' },
  { code: 'R01375', label: 'CNY' }
];
const PERIODS = [
  { days: 7,   label: '7д' },
  { days: 30,  label: '30д' },
  { days: 90,  label: '90д' },
  { days: 365, label: 'Год' }
];

export const ChartWidget = () => {
  const w = new Widget({
    id: 'chart',
    title: 'Динамика курса',
    accent: 'accent-blue-soft',
    span: 'full',
    render: async () => {
      w._days = w._days || 30;
      w._code = w._code || 'R01235';
      w._points = await loadPoints(w._days, w._code);
      return renderShell();
    }
  });

  async function loadPoints(days, code) {
    try {
      return parseDynamic(await fetchCbr('dynamic', { days, code }));
    } catch (e) {
      console.error('[chart]', e);
      return [];
    }
  }

  function renderShell() {
    return `
      <div class="chart-controls">
        <div class="card-tabs" data-ctrl="period">
          ${PERIODS.map(p => `
            <button data-days="${p.days}" class="${p.days === w._days ? 'is-active' : ''}">${p.label}</button>
          `).join('')}
        </div>
        <div class="card-tabs" data-ctrl="cur">
          ${CURRENCIES.map(c => `
            <button data-code="${c.code}" class="${c.code === w._code ? 'is-active' : ''}">${c.label}</button>
          `).join('')}
        </div>
      </div>
      <div class="chart-holder">${renderChart()}</div>`;
  }

  function renderChart() {
    const points = w._points;
    if (!points.length) return '<div class="widget-error">Нет данных за период</div>';

    const W = 800, H = 260, P = 40;
    const values = points.map(p => p.value);
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min || 1;
    const x = i => P + (i * (W - 2 * P)) / (points.length - 1 || 1);
    const y = v => H - P - ((v - min) / range) * (H - 2 * P);

    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
    const area = `${line} L${x(points.length - 1).toFixed(1)},${H - P} L${P},${H - P} Z`;

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(t => {
      const val = min + range * (1 - t);
      const yy = P + t * (H - 2 * P);
      return `
        <line x1="${P}" y1="${yy.toFixed(1)}" x2="${W - P}" y2="${yy.toFixed(1)}"
              stroke="var(--chart-grid)" stroke-width="1"/>
        <text x="${P - 6}" y="${yy + 4}" text-anchor="end"
              fill="var(--chart-tick)" font-size="11">${val.toFixed(2)}</text>`;
    }).join('');

    const step = Math.max(1, Math.ceil(points.length / 5));
    const xLabels = points.filter((_, i) => i % step === 0).map((p, idx) => {
      const i = idx * step;
      return `<text x="${x(i).toFixed(1)}" y="${H - P + 18}" text-anchor="middle"
                    fill="var(--chart-tick)" font-size="11">${p.date.slice(0, 5)}</text>`;
    }).join('');

    const dots = points.map((p, i) => `
      <circle cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="8" fill="transparent">
        <title>${p.date}: ${p.value.toFixed(4)} ₽</title>
      </circle>`).join('');

    return `<div class="chart-svg-wrap">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="chart-svg">
        <defs>
          <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="var(--blue)" stop-opacity="0.28"/>
            <stop offset="100%" stop-color="var(--blue)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${gridLines}
        <path d="${area}" fill="url(#chart-grad)"/>
        <path d="${line}" fill="none" stroke="var(--blue)" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
        ${xLabels}
        ${dots}
      </svg>
      <div class="chart-svg-legend">
        <span>мин: <b>${min.toFixed(4)} ₽</b></span>
        <span>макс: <b>${max.toFixed(4)} ₽</b></span>
        <span>точек: <b>${points.length}</b></span>
      </div>
    </div>`;
  }

  w.afterRender = () => {
    w.body.onclick = async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const periodBox = btn.closest('[data-ctrl="period"]');
      const curBox    = btn.closest('[data-ctrl="cur"]');

      if (periodBox) {
        periodBox.querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        w._days = parseInt(btn.dataset.days, 10);
        w._points = await loadPoints(w._days, w._code);
        w.body.querySelector('.chart-holder').innerHTML = renderChart();
      }
      if (curBox) {
        curBox.querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        w._code = btn.dataset.code;
        w._points = await loadPoints(w._days, w._code);
        w.body.querySelector('.chart-holder').innerHTML = renderChart();
      }
    };
  };

  return w;
};