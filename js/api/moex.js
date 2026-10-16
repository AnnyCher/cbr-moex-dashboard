export async function fetchMoex(type = 'shares') {
  const url = new URL('/api/moex', location.origin);
  url.searchParams.set('type', type);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MOEX HTTP ${res.status}`);
  return res.json();
}

function tableToObjects(table) {
  if (!table || !table.columns) return [];
  const { columns, data } = table;
  return (data || []).map((row) => {
    const obj = {};
    columns.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
}

export function parseMoex(json, mode = 'shares') {
  const securities = tableToObjects(json.securities);
  const marketdata = tableToObjects(json.marketdata);
  const bySecid = new Map(marketdata.map((m) => [m.SECID, m]));

  const priceField = mode === 'index' ? 'CURRENTVALUE' : 'LAST';
  const pctField   = 'LASTCHANGEPRCNT';

  const result = securities.map((s) => {
    const md = bySecid.get(s.SECID) || {};
    return {
      secid: s.SECID,
      name: s.SHORTNAME || s.SECID,
      last: md[priceField] ?? null,
      percent: md[pctField] ?? null
    };
  }).filter((r) => r.last != null);

  // сохраняем исходный порядок из запроса (SBER, GAZP, LKOH…)
  return result;
}