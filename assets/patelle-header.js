/* ==========================================================================
   PATÉLLE — Glass header
   <pt-header>: scroll states, Apple-style flyouts, search panel, mobile
   sheet with drill-in panels, a live cart count, and the sliding glass lens
   in the nav pill. No dependencies.
   ========================================================================== */

(() => {
  if (customElements.get('pt-header')) return;

  const desktopQuery = window.matchMedia('(min-width: 990px)');

  class PtHeader extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.abort = new AbortController();
      const signal = this.abort.signal;

      this.sticky = this.dataset.sticky;
      this.bg = this.querySelector('[data-bg]');
      this.flyouts = new Map(
        Array.from(this.querySelectorAll('[data-flyout]')).map((el) => [el.dataset.flyout, el])
      );
      this.toggles = Array.from(this.querySelectorAll('[data-flyout-toggle]'));
      this.sheet = this.querySelector('[data-sheet]');
      this.sheetToggle = this.querySelector('[data-sheet-toggle]');
      this.activeKey = null;
      this.lastY = window.scrollY;

      this.bindScroll(signal);
      this.bindFlyouts(signal);
      this.bindSheet(signal);
      this.bindCart(signal);
      this.bindEditor(signal);
      this.bindLens(signal);

      document.addEventListener(
        'keydown',
        (event) => {
          if (event.key !== 'Escape') return;
          if (this.activeKey) this.closeFlyout(true);
          if (this.classList.contains('is-sheet-open')) this.toggleSheet(false);
        },
        { signal }
      );

      desktopQuery.addEventListener(
        'change',
        () => {
          this.closeFlyout();
          this.toggleSheet(false);
        },
        { signal }
      );
    }

    disconnectedCallback() {
      this.initialized = false;
      this.abort?.abort();
      this.unsubscribeCart?.();
      this.lensObserver?.disconnect();
      clearTimeout(this.openTimer);
      clearTimeout(this.closeTimer);
      document.documentElement.classList.remove('pt-header-locked');
    }

    /* Glass lens ---------------------------------------------------------- */

    // One glass lens slides under the nav links: to whichever item the pointer
    // or keyboard focus is on, and back to the open panel's item or the
    // current page when it leaves. All the drawing is CSS; this only measures
    // the item and writes --lens-x / --lens-w / --lens-o on the pill.
    bindLens(signal) {
      if (this.dataset.lens === 'false') return;
      const menu = this.querySelector('.pt-header__menu');
      if (!menu) return;
      const items = Array.from(menu.querySelectorAll('.pt-header__item'));
      if (!items.length) return;

      let target = null;

      const restingItem = () =>
        items.find((item) => item.classList.contains('is-active')) ||
        items.find((item) => item.querySelector('.pt-header__link[aria-current]')) ||
        null;

      const place = (item, { instant = false } = {}) => {
        target = item;
        if (!item || !item.offsetWidth) {
          menu.style.setProperty('--lens-o', '0');
          return;
        }
        // Coming out of hidden, appear in place instead of sliding across.
        const hidden = menu.style.getPropertyValue('--lens-o') !== '1';
        if (instant || hidden) menu.classList.add('is-lens-instant');
        menu.style.setProperty('--lens-x', `${item.offsetLeft}px`);
        menu.style.setProperty('--lens-w', `${item.offsetWidth}px`);
        menu.style.setProperty('--lens-o', '1');
        if (instant || hidden) {
          requestAnimationFrame(() =>
            requestAnimationFrame(() => menu.classList.remove('is-lens-instant'))
          );
        }
      };

      items.forEach((item) => {
        item.addEventListener(
          'pointerenter',
          (event) => event.pointerType === 'mouse' && place(item),
          { signal }
        );
        item.addEventListener('focusin', () => place(item), { signal });
      });

      menu.addEventListener('pointerleave', () => place(restingItem()), { signal });
      menu.addEventListener(
        'focusout',
        (event) => {
          if (!menu.contains(event.relatedTarget)) place(restingItem());
        },
        { signal }
      );
      // A panel closing elsewhere (Escape, scrim, scroll) sends the lens home.
      this.addEventListener(
        'transitionend',
        (event) => {
          if (event.target === this.bg && !this.activeKey && !menu.matches(':hover')) {
            place(restingItem());
          }
        },
        { signal }
      );

      // Items change width when a panel opens (the active badge adds padding),
      // when web fonts land, and on resize, so keep the lens measured.
      if ('ResizeObserver' in window) {
        this.lensObserver = new ResizeObserver(() => place(target));
        items.forEach((item) => this.lensObserver.observe(item));
      }
      document.fonts?.ready.then(() => this.isConnected && place(target, { instant: true }));

      this.classList.add('has-lens');
      place(restingItem(), { instant: true });
    }

    /* Scroll -------------------------------------------------------------- */

    bindScroll(signal) {
      let ticking = false;
      const update = () => {
        ticking = false;
        const y = Math.max(0, window.scrollY);
        this.classList.toggle('is-scrolled', y > 8);

        if (this.sticky === 'reveal') {
          const barHeight = this.offsetHeight || 60;
          const goingDown = y > this.lastY;
          if (Math.abs(y - this.lastY) > 4) {
            const hide = goingDown && y > barHeight * 2;
            this.classList.toggle('is-hidden', hide);
            if (hide) this.closeFlyout();
          }
        }
        this.lastY = y;
      };

      window.addEventListener(
        'scroll',
        () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(update);
        },
        { passive: true, signal }
      );
      update();
    }

    reveal() {
      this.classList.remove('is-hidden');
    }

    /* Flyouts ------------------------------------------------------------- */

    bindFlyouts(signal) {
      if (!this.flyouts.size) return;

      // Hover intent on desktop menu items
      this.querySelectorAll('[data-flyout-item]').forEach((item) => {
        const key = item.dataset.flyoutItem;
        item.addEventListener(
          'pointerenter',
          (event) => {
            if (event.pointerType !== 'mouse' || !desktopQuery.matches) return;
            clearTimeout(this.closeTimer);
            clearTimeout(this.openTimer);
            // Switch instantly between panels once one is open; wait briefly otherwise.
            const delay = this.activeKey ? 0 : 120;
            this.openTimer = setTimeout(() => this.openFlyout(key), delay);
          },
          { signal }
        );
      });

      // Plain menu items close an open panel as the pointer passes over them
      this.querySelectorAll('.pt-header__item:not([data-flyout-item])').forEach((item) => {
        item.addEventListener(
          'pointerenter',
          (event) => {
            if (event.pointerType !== 'mouse' || this.activeKey === 'search') return;
            clearTimeout(this.openTimer);
            if (this.activeKey) this.scheduleClose(160);
          },
          { signal }
        );
      });

      const shell = this.querySelector('[data-shell]');
      shell.addEventListener(
        'pointerleave',
        (event) => {
          clearTimeout(this.openTimer);
          if (event.pointerType !== 'mouse' || this.activeKey === 'search') return;
          this.scheduleClose(220);
        },
        { signal }
      );
      shell.addEventListener('pointerenter', () => clearTimeout(this.closeTimer), { signal });

      // Buttons: keyboard disclosure chevrons and the search icon
      this.toggles.forEach((button) => {
        button.addEventListener(
          'click',
          (event) => {
            const key = button.dataset.flyoutToggle;
            // detail is 0 for keyboard-triggered clicks; keep the chevron visible then.
            this.classList.toggle('is-keyboard', event.detail === 0);
            if (this.activeKey === key) {
              this.closeFlyout(true);
            } else {
              if (this.classList.contains('is-sheet-open')) this.toggleSheet(false);
              this.openFlyout(key, { focus: true });
            }
          },
          { signal }
        );
      });

      this.querySelector('[data-scrim]').addEventListener('click', () => this.closeFlyout(), { signal });

      // Keyboard: leaving the header closes the panel
      this.addEventListener(
        'focusout',
        (event) => {
          if (this.activeKey && event.relatedTarget && !this.contains(event.relatedTarget)) {
            this.closeFlyout();
          }
        },
        { signal }
      );

      window.addEventListener('resize', () => this.activeKey && this.measure(), { passive: true, signal });
    }

    openFlyout(key, { focus = false } = {}) {
      const panel = this.flyouts.get(key);
      if (!panel) return;

      if (this.activeKey && this.activeKey !== key) this.deactivate(this.activeKey);
      this.activeKey = key;

      panel.classList.add('is-active');
      panel.removeAttribute('inert');
      panel.setAttribute('aria-hidden', 'false');
      this.classList.add('is-open');
      this.reveal();

      this.toggles
        .filter((button) => button.dataset.flyoutToggle === key)
        .forEach((button) => button.setAttribute('aria-expanded', 'true'));
      this.querySelectorAll('[data-flyout-item]').forEach((item) => {
        item.classList.toggle('is-active', item.dataset.flyoutItem === key);
      });

      this.measure();

      if (key === 'search') {
        const input = panel.querySelector('[data-search-input]');
        // Wait for the panel to become visible before moving focus.
        setTimeout(() => input?.focus({ preventScroll: true }), 60);
      } else if (focus) {
        setTimeout(() => panel.querySelector('a')?.focus({ preventScroll: true }), 60);
      }
    }

    measure() {
      const panel = this.flyouts.get(this.activeKey);
      if (!panel) return;
      this.style.setProperty('--ph-flyout-h', `${panel.offsetHeight}px`);
    }

    deactivate(key) {
      const panel = this.flyouts.get(key);
      if (!panel) return;
      panel.classList.remove('is-active');
      panel.setAttribute('inert', '');
      panel.setAttribute('aria-hidden', 'true');
      this.toggles
        .filter((button) => button.dataset.flyoutToggle === key)
        .forEach((button) => button.setAttribute('aria-expanded', 'false'));
    }

    scheduleClose(delay) {
      clearTimeout(this.closeTimer);
      this.closeTimer = setTimeout(() => this.closeFlyout(), delay);
    }

    closeFlyout(returnFocus = false) {
      clearTimeout(this.closeTimer);
      clearTimeout(this.openTimer);
      if (!this.activeKey) return;

      const key = this.activeKey;
      this.deactivate(key);
      this.activeKey = null;
      this.classList.remove('is-open');
      this.style.setProperty('--ph-flyout-h', '0px');
      this.querySelectorAll('[data-flyout-item].is-active').forEach((item) => item.classList.remove('is-active'));

      if (returnFocus) {
        this.toggles.find((button) => button.dataset.flyoutToggle === key)?.focus({ preventScroll: true });
      }
    }

    /* Mobile sheet --------------------------------------------------------- */

    bindSheet(signal) {
      if (!this.sheet || !this.sheetToggle) return;

      this.sheetToggle.addEventListener(
        'click',
        () => this.toggleSheet(!this.classList.contains('is-sheet-open')),
        { signal }
      );

      this.sheet.addEventListener(
        'click',
        (event) => {
          const drill = event.target.closest('[data-drill]');
          const back = event.target.closest('[data-back]');
          if (drill) this.showPanel(drill.dataset.drill, drill);
          if (back) this.showPanel('root');
        },
        { signal }
      );
    }

    toggleSheet(open) {
      if (!this.sheet) return;
      const isOpen = this.classList.contains('is-sheet-open');
      if (open === isOpen) return;

      if (open) this.closeFlyout();
      this.classList.toggle('is-sheet-open', open);
      this.sheet.toggleAttribute('inert', !open);
      this.sheet.setAttribute('aria-hidden', String(!open));
      this.sheetToggle.setAttribute('aria-expanded', String(open));
      document.documentElement.classList.toggle('pt-header-locked', open);

      const label = this.sheetToggle.querySelector('[data-toggle-label]');
      if (label) label.textContent = open ? label.dataset.close : label.dataset.open;

      if (open) {
        this.reveal();
        this.showPanel('root');
        setTimeout(() => this.sheet.querySelector('.is-current a, .is-current button')?.focus({ preventScroll: true }), 120);
      } else {
        this.sheetToggle.focus({ preventScroll: true });
        // Reset to the first level once the sheet has closed.
        setTimeout(() => !this.classList.contains('is-sheet-open') && this.showPanel('root'), 500);
      }
    }

    showPanel(key, opener) {
      const panels = Array.from(this.sheet.querySelectorAll('[data-panel]'));
      panels.forEach((panel) => {
        const current = panel.dataset.panel === key;
        panel.classList.toggle('is-current', current);
        // The root slides left when a child opens; children slide right when closed.
        panel.classList.toggle('is-behind', panel.dataset.panel === 'root' && key !== 'root');
        panel.toggleAttribute('inert', !current);
        panel.setAttribute('aria-hidden', String(!current));
      });
      this.sheet.querySelectorAll('[data-drill]').forEach((button) => {
        button.setAttribute('aria-expanded', String(button.dataset.drill === key));
      });

      if (!this.classList.contains('is-sheet-open')) return;
      const target = key === 'root' ? this.sheet.querySelector(`[data-drill="${this.lastDrill}"]`) : null;
      if (opener) this.lastDrill = key;
      setTimeout(() => {
        const current = this.sheet.querySelector('[data-panel].is-current');
        (target || current?.querySelector('a, button'))?.focus({ preventScroll: true });
      }, 80);
    }

    /* Cart count ---------------------------------------------------------- */

    bindCart(signal) {
      const count = this.querySelector('[data-cart-count]');
      if (!count) return;

      const refresh = async () => {
        try {
          const response = await fetch(`${(window.routes && window.routes.cart_url) || '/cart'}.js`, {
            headers: { Accept: 'application/json' },
          });
          const cart = await response.json();
          this.setCount(cart.item_count);
        } catch (error) {
          /* The count is decorative; the cart page stays the source of truth. */
        }
      };

      if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        this.unsubscribeCart = subscribe(PUB_SUB_EVENTS.cartUpdate, () => {
          this.reveal();
          refresh();
        });
      }

      // Restore the count when a page comes back from the back/forward cache.
      window.addEventListener('pageshow', (event) => event.persisted && refresh(), { signal });
    }

    setCount(value) {
      const count = this.querySelector('[data-cart-count]');
      if (!count) return;
      const previous = count.textContent.trim();
      count.textContent = value > 99 ? '99+' : String(value);
      count.hidden = value === 0;

      const label = this.querySelector('[data-cart-count-label]');
      if (label) label.textContent = String(value);

      if (previous !== count.textContent) {
        count.classList.remove('is-bump');
        void count.offsetWidth;
        count.classList.add('is-bump');
      }
    }

    /* Theme editor -------------------------------------------------------- */

    bindEditor(signal) {
      if (!window.Shopify || !window.Shopify.designMode) return;
      document.addEventListener(
        'shopify:section:select',
        (event) => {
          if (!this.closest(`#shopify-section-${event.detail.sectionId}`)) return;
          this.reveal();
        },
        { signal }
      );
      document.addEventListener(
        'shopify:section:deselect',
        () => {
          this.closeFlyout();
          this.toggleSheet(false);
        },
        { signal }
      );
    }
  }

  customElements.define('pt-header', PtHeader);

  document.addEventListener('shopify:section:load', (event) => {
    event.target.querySelectorAll('pt-header').forEach((header) => {
      if (!header.initialized) header.connectedCallback();
    });
  });
})();
