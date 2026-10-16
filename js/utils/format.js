export const fmtRub = (v) => (v == null ? '—' : v.toFixed(4) + ' ₽');
export const fmtNum = (v, d = 2) => (v == null ? '—' : v.toFixed(d));
export const fmtPct = (v) => {
  if (v == null) return '—';
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${Math.abs(v).toFixed(2)} %`;
};
export const changeClass = (v) =>
  v == null ? 'change--flat' : v > 0 ? 'change--up' : v < 0 ? 'change--down' : 'change--flat';