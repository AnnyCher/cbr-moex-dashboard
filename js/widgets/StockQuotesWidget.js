import { Widget } from '../core/Widget.js';
import { fetchMoex, parseMoex } from '../api/moex.js';
import { DEMO } from '../utils/demo.js';
import { fmtNum, fmtPct, changeClass } from '../utils/format.js';

export const StockQuotesWidget = () => new Widget({
  id: 'stocks',
  title: 'Акции · MOEX',
  accent: 'accent-green-soft',
  span: 'full',
  render: async () => {
    let rows, isDemo = false;
    try {
      rows = parseMoex(await fetchMoex('shares'), 'shares');
      if (!rows.length) throw new Error('empty');
    } catch {
      rows = DEMO.stocks;
      isDemo = true;
    }

    const body = rows.map((r) => `
      <tr>
        <td><span class="code">${r.secid}</span></td>
        <td class="name">${r.name}</td>
        <td class="num val">${fmtNum(r.last, 2)} ₽</td>
        <td class="num"><span class="change ${changeClass(r.percent)}">${fmtPct(r.percent)}</span></td>
      </tr>`).join('');

    return `${isDemo ? '<div class="demo-badge">ДЕМО</div>' : ''}
      <table class="table">
        <thead><tr>
          <th>Тикер</th><th>Название</th>
          <th class="num">Цена</th><th class="num">Δ</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>`;
  }
});