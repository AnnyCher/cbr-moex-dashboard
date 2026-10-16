import { Widget } from '../core/Widget.js';
import { fetchCbr, parseMetals } from '../api/cbr.js';
import { DEMO } from '../utils/demo.js';

const NAMES = { '1': 'Золото', '2': 'Серебро', '3': 'Платина', '4': 'Палладий' };
const CLS = { '1': 'metal--gold', '2': 'metal--silver', '3': 'metal--plat', '4': 'metal--pall' };
const GRAMS_PER_OZ = 31.1034768;

function parsePrice(str) {
  if (!str) return null;
  const n = parseFloat(String(str).replace(/\s/g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
}
function fmtPrice(n) {
  if (n == null) return '—';
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const MetalsWidget = () => {
  const w = new Widget({
    id: 'metals',
    title: 'Драгоценные металлы',
    accent: 'accent-amber-soft',
    span: 'half',
    render: async () => {
      let metals, isDemo = false;
      try {
        metals = parseMetals(await fetchCbr('metals', { days: 1 }));
        if (!metals.length) throw new Error('empty');
      } catch {
        metals = DEMO.metals; isDemo = true;
      }
      w._metals = metals;
      w._isDemo = isDemo;
      w._unit = w._unit || 'g';
      return renderShell();
    }
  });

  function renderShell() {
    const tabs = [
      { id: 'g',  label: '₽ / грамм' },
      { id: 'oz', label: '₽ / унция' }
    ];
    return `
      ${w._isDemo ? '<div class="demo-badge">ДЕМО</div>' : ''}
      <div class="card-tabs">
        ${tabs.map(t => `<button data-tab="${t.id}" class="${w._unit === t.id ? 'is-active' : ''}">${t.label}</button>`).join('')}
      </div>
      <div class="card-tab-body">${renderBody()}</div>`;
  }

  function renderBody() {
    const mult = w._unit === 'oz' ? GRAMS_PER_OZ : 1;
    return `<ul class="metals">${w._metals
      .filter(m => NAMES[m.code])
      .map(m => {
        const raw = parsePrice(m.sell || m.buy);
        const val = raw != null ? raw * mult : null;
        return `<li class="metal">
          <span class="metal__dot ${CLS[m.code]}"></span>
          <span class="metal__name">${NAMES[m.code]}</span>
          <span class="metal__val">${fmtPrice(val)}</span>
        </li>`;
      }).join('')}</ul>`;
  }

  w.afterRender = () => {
    w.body.onclick = (e) => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      w._unit = btn.dataset.tab;
      w.body.querySelectorAll('[data-tab]').forEach(b =>
        b.classList.toggle('is-active', b === btn));
      w.body.querySelector('.card-tab-body').innerHTML = renderBody();
    };
  };

  return w;
};