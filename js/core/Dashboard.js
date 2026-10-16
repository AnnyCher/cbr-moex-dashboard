import { Store } from './Store.js';

export class Dashboard {
  constructor(rootSelector) {
    this.root = document.querySelector(rootSelector);
    this.grid = this.root.querySelector('.grid');
    this.toolbar = this.root.querySelector('.dashboard-toolbar');
    this.registry = new Map();   // id → фабрика виджета
    this.labels   = new Map();   // id → человеческое название для кнопки
    this.instances = new Map();  // id → Widget
    this.order = [];             // эталонный порядок виджетов
    this.bindGlobalEvents();
  }

  /** id — внутренний, label — то, что увидит пользователь на кнопке */
  register(id, factory, label = id) {
    this.registry.set(id, factory);
    this.labels.set(id, label);
  }

  async init(ids = []) {
    this.order = [...ids];
    const saved = Store.load();
    const present = saved.length ? saved : ids;

    for (const id of this.order) {
      if (present.includes(id) && this.registry.has(id)) {
        await this.add(id, false);
      }
    }
    this.renderToolbar();
    this.persist();
  }

  insertAtOrder(widgetEl, id) {
    const idx = this.order.indexOf(id);
    if (idx === -1) { this.grid.appendChild(widgetEl); return; }
    for (let i = idx + 1; i < this.order.length; i++) {
      const nextEl = this.grid.querySelector(`[data-widget-id="${this.order[i]}"]`);
      if (nextEl) { this.grid.insertBefore(widgetEl, nextEl); return; }
    }
    this.grid.appendChild(widgetEl);
  }

  async add(id, persist = true) {
    if (this.instances.has(id)) return;
    const factory = this.registry.get(id);
    if (!factory) return;

    const widget = factory();
    widget.mount(this.grid);
    this.insertAtOrder(widget.el, id);
    this.instances.set(id, widget);

    if (persist) this.persist();
    this.renderToolbar();
  }

  remove(id) {
    const w = this.instances.get(id);
    if (!w) return;
    w.el.remove();
    this.instances.delete(id);
    this.persist();
    this.renderToolbar();
  }

  persist() {
    const present = this.order.filter((id) => this.instances.has(id));
    Store.save(present);
  }

  renderToolbar() {
    const available = this.order.filter((id) => !this.instances.has(id));
    if (!available.length) {
      this.toolbar.innerHTML = '<span class="toolbar-empty">Все виджеты добавлены</span>';
      return;
    }
    this.toolbar.innerHTML = available.map((id) => {
      const label = this.labels.get(id) || id;
      return `<button class="btn-add" data-add="${id}">+ ${label}</button>`;
    }).join('');
  }

  bindGlobalEvents() {
    this.grid.addEventListener('widget:remove', (e) => this.remove(e.detail.id));
    this.toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add]');
      if (btn) this.add(btn.dataset.add);
    });
  }
}