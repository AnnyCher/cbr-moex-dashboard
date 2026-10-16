// js/core/Store.js
const KEY = 'cbr-dashboard:widgets';

export const Store = {
  load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  },
  save(ids) {
    localStorage.setItem(KEY, JSON.stringify(ids));
  }
};