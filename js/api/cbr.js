// js/api/cbr.js
export async function fetchCbr(endpoint, params = {}) {
  const url = new URL('/api/cbr', location.origin);
  url.searchParams.set('endpoint', endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CBR HTTP ${res.status}`);
  return res.text();
}

export function parseDaily(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
  const rates = {};
  xml.querySelectorAll('Valute').forEach((n) => {
    const code = n.querySelector('CharCode')?.textContent?.trim();
    const value = parseFloat((n.querySelector('Value')?.textContent || '0').replace(',', '.'));
    const nominal = parseFloat(n.querySelector('Nominal')?.textContent || '1');
    if (code && value) rates[code] = { value, nominal, unitRate: value / nominal };
  });
  return { date: xml.querySelector('ValCurs')?.getAttribute('Date'), rates };
}

export function parseDynamic(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
  const points = [];
  xml.querySelectorAll('Record').forEach((n) => {
    const value = parseFloat((n.querySelector('Value')?.textContent || '0').replace(',', '.'));
    if (value) points.push({ date: n.getAttribute('Date'), value });
  });
  return points;
}

export function parseMetals(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
  const map = new Map(); // code → последняя запись
  xml.querySelectorAll('Record').forEach((n) => {
    const code = n.getAttribute('Code');
    const date = n.getAttribute('Date') || '';
    const sell = n.querySelector('Sell')?.textContent?.trim() || '';
    const buy  = n.querySelector('Buy')?.textContent?.trim()  || '';
    if (code) map.set(code, { code, sell, buy, date }); // поздние записи перезаписывают ранние
  });
  return [...map.values()];
}