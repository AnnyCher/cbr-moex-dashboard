import { Widget } from '../core/Widget.js';
import { fetchCbr } from '../api/cbr.js';
import { DEMO } from '../utils/demo.js';

export const KeyRateWidget = () => {
  const w = new Widget({
    id: 'key-rate',
    title: 'Ключевая ставка',
    accent: 'accent-violet',
    span: 'half',
    render: async () => {
      let rate, date, history, isDemo = false;
      try {
        const html = await fetchCbr('keyrate');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        history = [];
        doc.querySelectorAll('table tr').forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const d = cells[0].textContent.trim();
            const r = parseFloat(cells[1].textContent.replace(',', '.'));
            if (!isNaN(r)) history.push({ date: d, rate: r });
          }
        });
        if (!history.length) throw new Error('empty');
        const last = history[history.length - 1];
        rate = last.rate;
        date = last.date;
      } catch {
        rate = DEMO.keyRate.rate;
        date = DEMO.keyRate.date;
        history = [{ date, rate }];
        isDemo = true;
      }
      w._rate = rate;
      w._date = date;
      w._history = history.reverse();
      w._isDemo = isDemo;
      w._tab = w._tab || 'current';
      return renderShell();
    }
  });

  function renderShell() {
    const tabs = [
      { id: 'current', label: 'Текущая' },
      { id: 'history', label: 'История' }
    ];
    return `
      ${w._isDemo ? '<div class="demo-badge">ДЕМО</div>' : ''}
      <div class="card-tabs">
        ${tabs.map(t => `<button data-tab="${t.id}" class="${w._tab === t.id ? 'is-active' : ''}">${t.label}</button>`).join('')}
      </div>
      <div class="card-tab-body">${renderBody()}</div>`;
  }

  function renderBody() {
    if (w._tab === 'history') {
      const rows = w._history.slice(0, 12).map(h => `
        <li>
          <span class="rate-history__date">${h.date}</span>
          <span class="rate-history__val">${h.rate.toFixed(2)} %</span>
        </li>`).join('');
      return `<ul class="rate-history card-tab-body--scroll">${rows}</ul>`;
    }

    let heldText = '';
    if (w._date) {
      const m = w._date.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      if (m) {
        const from = new Date(+m[3], +m[2] - 1, +m[1]);
        const days = Math.max(0, Math.round((Date.now() - from.getTime()) / 86400000));
        if (days > 0) heldText = `удерживается ${days} дн.`;
      }
    }

    return `
      <div class="card__value">${w._rate.toFixed(2)}<span class="unit">%</span></div>
      <div class="card__sub">с ${w._date || '—'}${heldText ? ' · ' + heldText : ''}</div>
      <div class="rate-note">
        Ключевая ставка ЦБ РФ определяет стоимость денег в экономике
        и влияет на курсы, инфляцию и доходность вкладов.
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