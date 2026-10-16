import { Widget } from '../core/Widget.js';
import { fetchCbr, parseDaily } from '../api/cbr.js';
import { DEMO } from '../utils/demo.js';

const MAIN = ['USD', 'EUR', 'CNY', 'GBP', 'JPY'];

export const CurrencyRatesWidget = () => {
  const w = new Widget({
    id: 'currency-rates',
    title: 'Курсы валют',
    accent: 'accent-blue-soft',
    span: 'half',
    render: async () => {
      let data, isDemo = false;
      try {
        data = parseDaily(await fetchCbr('daily'));
        if (!data.rates || !Object.keys(data.rates).length) throw new Error('empty');
      } catch {
        data = DEMO.currencyRates; isDemo = true;
      }
      w._data = data;
      w._isDemo = isDemo;
      w._tab = w._tab || 'main';
      return renderShell();
    }
  });

  function renderShell() {
    const tabs = [
      { id: 'main', label: 'Основные' },
      { id: 'all',  label: 'Все' }
    ];
    return `
      ${w._isDemo ? '<div class="demo-badge">ДЕМО</div>' : ''}
      <div class="card-tabs">
        ${tabs.map(t => `<button data-tab="${t.id}" class="${w._tab === t.id ? 'is-active' : ''}">${t.label}</button>`).join('')}
      </div>
      <div class="card-tab-body">${renderBody()}</div>`;
  }

  function renderBody() {
    const rates = w._data.rates;
    const codes = w._tab === 'main'
      ? MAIN.filter(c => rates[c])
      : Object.keys(rates).sort();
    const cls = w._tab === 'all' ? 'card-tab-body--scroll' : '';

    return `<div class="${cls}">
      <table class="table">
        <thead><tr><th>Код</th><th class="num">Курс, ₽</th><th class="num">Номинал</th></tr></thead>
        <tbody>
          ${codes.map(c => {
            const r = rates[c];
            return `<tr>
              <td><span class="code">${c}</span></td>
              <td class="num val">${r.unitRate.toFixed(4)}</td>
              <td class="num">за ${r.nominal} ${c}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
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