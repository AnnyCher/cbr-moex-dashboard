// js/main.js
import { Dashboard } from './core/Dashboard.js';
import { CurrencyRatesWidget } from './widgets/CurrencyRatesWidget.js';
import { KeyRateWidget } from './widgets/KeyRateWidget.js';
import { MetalsWidget } from './widgets/MetalsWidget.js';
import { StockQuotesWidget } from './widgets/StockQuotesWidget.js';
import { IndexWidget } from './widgets/IndexWidget.js';
import { ChartWidget } from './widgets/ChartWidget.js';

const dash = new Dashboard('#app');

dash.register('currency-rates', CurrencyRatesWidget, 'Курсы валют');
dash.register('key-rate',       KeyRateWidget,       'Ключевая ставка');
dash.register('metals',         MetalsWidget,        'Драгоценные металлы');
dash.register('stocks',         StockQuotesWidget,   'Акции MOEX');
dash.register('indices',        IndexWidget,         'Индексы MOEX');
dash.register('chart',          ChartWidget,         'График курса USD');

/* ── Тема ─────────────────────────────────────────── */
function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
function toggleTheme() {
  document.documentElement.classList.add('theme-transition');
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transition');
  }, 380);
}

/* ── Метка времени в шапке ────────────────────────── */
function setUpdatedAt() {
  const ts = document.querySelector('#updated-at span:last-child');
  if (ts) {
    ts.textContent = 'Обновлено ' + new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit', minute: '2-digit'
    });
  }
}

/* ── Обновить все виджеты ─────────────────────────── */
function refreshAll() {
  dash.instances.forEach((w) => {
    // короткая вспышка на карточке
    w.el.classList.remove('is-refreshed');
    void w.el.offsetWidth;              // перезапуск CSS-анимации
    w.el.classList.add('is-refreshed');
    setTimeout(() => w.el.classList.remove('is-refreshed'), 1200);

    // перезагрузка содержимого
    w.load();
  });
  setUpdatedAt();
}
/* ── Кнопки ───────────────────────────────────────── */
document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);
document.getElementById('btn-refresh')?.addEventListener('click', refreshAll);

/* ── Горячие клавиши ──────────────────────────────── */
document.addEventListener('keydown', (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') refreshAll();
  if (e.key === 't' || e.key === 'T' || e.key === 'е' || e.key === 'Е') toggleTheme();
});

/* ── Инициализация ────────────────────────────────── */
(async () => {
  await dash.init([
    'chart',
    'indices', 'metals',
    'key-rate', 'currency-rates',
    'stocks'
  ]);
  setUpdatedAt();
})();