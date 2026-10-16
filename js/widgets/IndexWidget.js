import { Widget } from '../core/Widget.js';
import { fetchMoex, parseMoex } from '../api/moex.js';
import { DEMO } from '../utils/demo.js';
import { fmtNum, fmtPct, changeClass } from '../utils/format.js';

export const IndexWidget = () => {
  const w = new Widget({
    id: 'indices',
    title: 'Индексы · MOEX',
    accent: 'accent-cyan',
    span: 'half',
    render: async () => {
      let rows, isDemo = false;
      try {
        rows = parseMoex(await fetchMoex('index'), 'index');
        if (!rows.length) throw new Error('empty');
      } catch {
        rows = DEMO.indices; isDemo = true;
      }
      w._rows = rows;
      w._isDemo = isDemo;
      w._tab = w._tab || 'all';
      return renderShell();
    }
  });

  function renderShell() {
    const tabs = [
      { id: 'all',   label: 'Оба' },
      { id: 'IMOEX', label: 'IMOEX' },
      { id: 'RTSI',  label: 'RTS' }
    ];
    return `
      ${w._isDemo ? '<div class="demo-badge">ДЕМО</div>' : ''}
      <div class="card-tabs">
        ${tabs.map(t => `<button data-tab="${t.id}" class="${w._tab === t.id ? 'is-active' : ''}">${t.label}</button>`).join('')}
      </div>
      <div class="card-tab-body">${renderBody()}</div>`;
  }

  function renderBody() {
    if (w._tab === 'all') {
      return `<ul class="index-list">${w._rows.map(r => `
        <li class="index-row">
          <span class="index-row__name">${r.name}</span>
          <span class="index-row__val">${fmtNum(r.last, 2)}</span>
          <span class="change ${changeClass(r.percent)}">${fmtPct(r.percent)}</span>
        </li>`).join('')}</ul>`;
    }
    const r = w._rows.find(x => x.secid === w._tab);
    if (!r) return '<div class="widget-error">Нет данных</div>';
    return `<div class="index-single">
      <div class="index-single__value">${fmtNum(r.last, 2)}</div>
      <div class="index-single__meta">
        <span>${r.name}</span>
        <span class="change ${changeClass(r.percent)}">${fmtPct(r.percent)}</span>
      </div>
    </div>`;
  }

  w.afterRender = () => {
    w.body.onclick = (e) => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      w._tab = btn.dataset.tab;
      w.body.querySelectorAll('[data-tab]').forEach(b =>
        b.classList.toggle('is-active', b === btn));
      w.body.querySelector('.card-tab-body').innerHTML = renderBody();
    };
  };

  return w;
};