/* PATÉLLE — Shop All category tabs */

class PatelleTabs extends HTMLElement {
  connectedCallback() {
    this.tabs = Array.from(this.querySelectorAll('[role="tab"]'));
    if (!this.tabs.length) return;

    this.tabs.forEach((tab) => {
      tab.addEventListener('click', () => this.select(tab));
      tab.addEventListener('keydown', (event) => this.onKeydown(event, tab));
    });
  }

  panelFor(tab) {
    const id = tab.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  }

  select(tab) {
    this.tabs.forEach((item) => {
      const isTarget = item === tab;
      const panel = this.panelFor(item);

      item.classList.toggle('is-active', isTarget);
      item.setAttribute('aria-selected', isTarget ? 'true' : 'false');

      if (panel) {
        panel.classList.toggle('is-hidden', !isTarget);
        panel.toggleAttribute('hidden', !isTarget);
      }
    });
  }

  onKeydown(event, tab) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    const current = this.tabs.indexOf(tab);
    let next = current;

    if (event.key === 'ArrowLeft') next = current - 1;
    if (event.key === 'ArrowRight') next = current + 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = this.tabs.length - 1;

    if (next < 0) next = this.tabs.length - 1;
    if (next >= this.tabs.length) next = 0;

    this.tabs[next].focus();
    this.select(this.tabs[next]);
  }
}

if (!customElements.get('patelle-tabs')) {
  customElements.define('patelle-tabs', PatelleTabs);
}
