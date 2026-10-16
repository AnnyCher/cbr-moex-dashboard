// js/core/Widget.js
export class Widget {
  /**
   * @param {Object} opts
   * @param {string} opts.id       — уникальный id
   * @param {string} opts.title    — заголовок
   * @param {string} opts.accent   — css-класс акцента (accent-blue и т.п.)
   * @param {string} opts.span     — 'half' | 'wide' | 'full'
   * @param {Function} opts.render — async () => HTMLElement | string
   */
  constructor({ id, title, accent = 'accent-blue-soft', span = 'half', render }) {
    this.id = id;
    this.title = title;
    this.accent = accent;
    this.span = span;
    this.render = render;
    this.collapsed = false;
    this.el = null;
  }

  mount(container) {
    this.el = document.createElement('article');
    this.el.className = `card card--${this.span} ${this.accent}`;
    this.el.dataset.widgetId = this.id;

    this.el.innerHTML = `
      <div class="card__head">
        <h2 class="card__title">${this.title}</h2>
        <div class="widget-actions">
          <button class="widget-btn" data-action="collapse" title="Свернуть">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <button class="widget-btn" data-action="remove" title="Удалить">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <div class="card__body"></div>
    `;

    this.body = this.el.querySelector('.card__body');
    container.appendChild(this.el);

    this.el.querySelector('[data-action="collapse"]').addEventListener('click', () => this.toggleCollapse());
    this.el.querySelector('[data-action="remove"]').addEventListener('click', () => this.remove());

    if (this.collapsed) this.el.classList.add('is-collapsed');
    this.load();
    return this;
  }

  async load() {
    this.body.innerHTML = '<div class="widget-loading">Загрузка…</div>';
    try {
      const html = await Promise.race([
        this.render(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('client timeout')), 12000)
        )
      ]);
      this.body.innerHTML = html;

      // даём браузеру отрисовать DOM и только потом сообщаем виджету
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (typeof this.afterRender === 'function') {
            try { this.afterRender(); }
            catch (e) { console.error(`[${this.id}] afterRender:`, e); }
          }
        });
      });
    } catch (err) {
      console.error(`[${this.id}] failed:`, err);
      this.body.innerHTML = `<div class="widget-error">Данные недоступны</div>`;
    }
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.el.classList.toggle('is-collapsed', this.collapsed);
  }

  remove() {
    this.el.dispatchEvent(new CustomEvent('widget:remove', {
      bubbles: true,
      detail: { id: this.id }
    }));
  }
}