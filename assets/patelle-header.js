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
      this.bindSearch(signal);
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
      clearTimeout(this.miniTimer);
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
      const heroOffset = Number(this.dataset.heroOffset);
      const watchHero = Boolean(this.dataset.heroOffset);

      const update = () => {
        ticking = false;
        const y = Math.max(0, window.scrollY);
        this.classList.toggle('is-scrolled', y > 8);

        // The header text flips to ink once the hero no longer sits behind the bar.
        // Looked up on every update: the theme editor replaces and reorders sections.
        if (watchHero) {
          const hero = document.querySelector('main .shopify-section, #MainContent > *');
          this.classList.toggle('is-past-hero', !hero || hero.getBoundingClientRect().bottom <= heroOffset);
        }

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
      if (watchHero) {
        window.addEventListener('resize', update, { passive: true, signal });
        ['shopify:section:load', 'shopify:section:unload', 'shopify:section:reorder'].forEach((type) =>
          document.addEventListener(type, () => requestAnimationFrame(update), { signal })
        );
      }
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
            const delay = this.activeKey ? 0 : 30;
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

    openFlyout(key, { focus = false, keepFocus = false } = {}) {
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
      this.seekButton?.setAttribute('aria-expanded', String(key === 'search'));

      if (keepFocus) return;
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
      this.seekButton?.setAttribute('aria-expanded', 'false');
      if (this.seek && !this.seek.contains(document.activeElement)) this.seek.classList.remove('is-filled');

      if (returnFocus) {
        this.toggles.find((button) => button.dataset.flyoutToggle === key)?.focus({ preventScroll: true });
      }
    }

    /* Live search ---------------------------------------------------------- */

    bindSearch(signal) {
      const panel = this.flyouts.get('search');
      const results = panel?.querySelector('[data-search-results]');
      if (!results) return;

      const panelInput = panel.querySelector('[data-search-input]');
      const links = panel.querySelector('[data-search-links]');
      this.seek = this.querySelector('[data-seek]');
      const seekInput = this.seek?.querySelector('[data-seek-input]');
      this.seekButton = this.seek?.querySelector('[data-seek-button]');
      // Matches the CSS breakpoint where the nav pill and the expanding field show.
      const wideQuery = window.matchMedia('(min-width: 1100px)');
      const cache = new Map();
      let timer;
      let request;
      let source = panelInput;

      const show = (html) => {
        results.innerHTML = html;
        results.hidden = !html;
        if (links) links.hidden = Boolean(html);
        if (seekInput && source === seekInput) {
          if (html) this.openFlyout('search', { keepFocus: true });
          else if (this.activeKey === 'search') this.closeFlyout();
        } else if (this.activeKey === 'search') {
          this.measure();
        }
      };

      const run = async (query) => {
        request?.abort();
        // Theme settings → Search behavior → Enable search suggestions.
        if (query.length < 2 || results.dataset.live === 'false') {
          show('');
          return;
        }
        if (cache.has(query)) {
          show(cache.get(query));
          return;
        }

        const controller = new AbortController();
        request = controller;
        results.setAttribute('aria-busy', 'true');
        try {
          const url = new URL(results.dataset.url, window.location.origin);
          url.searchParams.set('q', query);
          url.searchParams.set('resources[type]', 'product,collection,query');
          url.searchParams.set('resources[limit]', '4');
          url.searchParams.set('resources[options][unavailable_products]', 'last');
          const response = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          });
          if (!response.ok) throw new Error(`Search failed: ${response.status}`);
          const data = await response.json();
          const html = this.renderResults(data.resources?.results || {}, query, results.dataset);
          cache.set(query, html);
          show(html);
        } catch (error) {
          if (error.name !== 'AbortError') show('');
        } finally {
          if (request === controller) results.removeAttribute('aria-busy');
        }
      };

      const search = (input, wait = 250) => {
        source = input;
        clearTimeout(timer);
        const query = input.value.trim();
        timer = setTimeout(() => run(query), query ? wait : 0);
      };

      [panelInput, seekInput].filter(Boolean).forEach((input) => {
        input.addEventListener('input', () => search(input), { signal });
      });

      if (seekInput) {
        const seek = this.seek;
        const nav = this.querySelector('.pt-header__menu');

        // Grow into the free space beside the nav pill; when that is too narrow,
        // the nav fades out while the field is open (is-seek-tight).
        const fit = () => {
          if (!nav || !wideQuery.matches) return;
          const room = seek.getBoundingClientRect().right - nav.getBoundingClientRect().right - 16;
          const tight = room < 200;
          this.classList.toggle('is-seek-tight', tight);
          seek.style.setProperty('--ph-seek-w', `${tight ? 240 : Math.round(Math.min(300, room))}px`);
        };

        seek.addEventListener(
          'pointerenter',
          (event) => {
            if (event.pointerType !== 'mouse' || !wideQuery.matches) return;
            if (this.activeKey && this.activeKey !== 'search') this.closeFlyout();
            fit();
            seekInput.focus({ preventScroll: true });
          },
          { signal }
        );
        seekInput.addEventListener('focus', fit, { signal });

        seek.addEventListener(
          'pointerleave',
          (event) => {
            if (event.pointerType === 'mouse' && !seekInput.value) seekInput.blur();
          },
          { signal }
        );

        seekInput.addEventListener(
          'input',
          () => seek.classList.toggle('is-filled', Boolean(seekInput.value)),
          { signal }
        );

        seekInput.addEventListener(
          'focus',
          () => {
            if (!seekInput.value.trim()) return;
            seek.classList.add('is-filled');
            search(seekInput, 0);
          },
          { signal }
        );

        seekInput.addEventListener(
          'blur',
          () => {
            if (this.activeKey !== 'search') seek.classList.remove('is-filled');
          },
          { signal }
        );

        seekInput.addEventListener(
          'keydown',
          (event) => {
            if (event.key !== 'Escape') return;
            seekInput.value = '';
            seek.classList.remove('is-filled');
            search(seekInput);
            seekInput.blur();
          },
          { signal }
        );

        // Phones and tablets have no hover: the icon opens the glass panel instead.
        this.seekButton?.addEventListener(
          'click',
          (event) => {
            if (!wideQuery.matches) {
              event.preventDefault();
              if (this.activeKey === 'search') {
                this.closeFlyout();
              } else {
                if (this.classList.contains('is-sheet-open')) this.toggleSheet(false);
                this.openFlyout('search');
              }
              return;
            }
            if (!seekInput.value.trim()) {
              event.preventDefault();
              seekInput.focus({ preventScroll: true });
            }
          },
          { signal }
        );
      }

      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        request?.abort();
      });
    }

    renderResults({ products = [], collections = [], queries = [] }, query, labels) {
      const esc = (value) =>
        String(value ?? '').replace(
          /[&<>"']/g,
          (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
        );
      const terms = esc(query);

      if (!products.length && !collections.length && !queries.length) {
        return `<p class="pt-header__results-empty">${esc(labels.empty).replace('__TERMS__', terms)}</p>`;
      }

      const arrowLink = (url, text) =>
        `<li><a class="pt-header__flyout-link pt-header__flyout-link--arrow" href="${esc(url)}">${esc(text)}</a></li>`;
      const suggestions = [
        ...queries.map((item) => arrowLink(item.url, item.text)),
        ...collections.map((item) => arrowLink(item.url, item.title)),
      ].slice(0, 6);

      const items = products
        .map((product) => {
          const image = product.featured_image?.url || product.image;
          const src = image ? `${image}${image.includes('?') ? '&' : '?'}width=320` : '';
          const alt = product.featured_image?.alt || product.title;
          return `<li class="pt-header__result">
            <a class="pt-header__result-link" href="${esc(product.url)}">
              <span class="pt-header__result-media">${
                src ? `<img src="${esc(src)}" alt="${esc(alt)}" width="160" height="160" loading="lazy">` : ''
              }</span>
              ${labels.showVendor === 'true' && product.vendor ? `<span class="pt-header__result-vendor">${esc(product.vendor)}</span>` : ''}
              <span class="pt-header__result-title">${esc(product.title)}</span>
              ${
                labels.showPrice === 'true'
                  ? `<span class="pt-header__result-price">${esc(this.formatMoney(product.price, labels.moneyFormat))}</span>`
                  : ''
              }
            </a>
          </li>`;
        })
        .join('');

      const searchUrl = `${labels.searchUrl}?q=${encodeURIComponent(query)}&options%5Bprefix%5D=last`;

      return `<div class="pt-header__results-grid">
          ${
            suggestions.length
              ? `<div class="pt-header__col"><p class="pt-header__col-title">${esc(labels.suggestions)}</p><ul role="list">${suggestions.join('')}</ul></div>`
              : ''
          }
          ${
            items
              ? `<div class="pt-header__col pt-header__col--products"><p class="pt-header__col-title">${esc(labels.products)}</p><ul class="pt-header__result-list" role="list">${items}</ul></div>`
              : ''
          }
        </div>
        <a class="pt-header__results-all" href="${esc(searchUrl)}">
          ${esc(labels.viewAll).replace('__TERMS__', terms)}
          <svg width="12" height="10" viewBox="0 0 12 10" aria-hidden="true" focusable="false"><path d="M1 5h9.5M6.5 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>`;
    }

    formatMoney(amount, format = '${{amount}}') {
      const value = Number(amount);
      if (!Number.isFinite(value)) return '';
      return format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
        if (key === 'amount_no_decimals') return Math.round(value).toLocaleString('en-US');
        if (key.includes('comma')) return value.toFixed(2).replace('.', ',');
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      });
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
      // Theme settings → Cart → Drawer: the bag icon opens Dawn's cart drawer.
      this.querySelectorAll('[data-cart-link]').forEach((link) => {
        link.addEventListener(
          'click',
          (event) => {
            const drawer = document.querySelector('cart-drawer');
            if (!drawer || typeof drawer.open !== 'function') return;
            event.preventDefault();
            this.closeFlyout();
            if (this.classList.contains('is-sheet-open')) this.toggleSheet(false);
            drawer.open(link);
          },
          { signal }
        );
      });

      const count = this.querySelector('[data-cart-count]');
      if (!count) return;

      const refresh = () => {
        this.cartRequest = null;
        return this.loadCart();
      };

      if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        this.unsubscribeCart = subscribe(PUB_SUB_EVENTS.cartUpdate, () => {
          this.reveal();
          this.closeMiniCart(true);
          refresh();
        });
      }

      // Restore the count when a page comes back from the back/forward cache.
      window.addEventListener('pageshow', (event) => event.persisted && refresh(), { signal });

      this.bindMiniCart(signal);
    }

    loadCart() {
      if (this.cartRequest) return this.cartRequest;
      this.cartRequest = fetch(`${(window.routes && window.routes.cart_url) || '/cart'}.js`, {
        headers: { Accept: 'application/json' },
      })
        .then((response) => response.json())
        .then((cart) => {
          this.cart = cart;
          this.setCount(cart.item_count);
          this.renderMiniCart();
          return cart;
        })
        .catch(() => {
          /* The count is decorative; the cart page stays the source of truth. */
          this.cartRequest = null;
        });
      return this.cartRequest;
    }

    /* Cart preview --------------------------------------------------------- */

    // Desktop hover (or keyboard focus) on the bag shows a glass summary of
    // the cart. The bag stays a plain link, so a click still opens the cart.
    bindMiniCart(signal) {
      this.miniCart = this.querySelector('[data-minicart]');
      this.miniPanel = this.miniCart?.querySelector('[data-minicart-panel]');
      if (!this.miniCart || !this.miniPanel) return;

      const canHover = window.matchMedia('(hover: hover) and (min-width: 990px)');
      const open = () => {
        if (!canHover.matches) return;
        clearTimeout(this.miniTimer);
        this.loadCart();
        this.miniTimer = setTimeout(() => {
          if (this.activeKey) this.closeFlyout();
          this.miniCart.classList.add('is-preview-open');
        }, 90);
      };
      const close = () => {
        clearTimeout(this.miniTimer);
        this.miniTimer = setTimeout(() => this.closeMiniCart(), 180);
      };

      this.miniCart.addEventListener('pointerenter', open, { signal });
      this.miniCart.addEventListener('pointerleave', close, { signal });
      this.miniCart.addEventListener(
        'focusin',
        () => {
          if (this.miniCart.querySelector(':focus-visible')) open();
        },
        { signal }
      );
      this.miniCart.addEventListener(
        'focusout',
        (event) => {
          if (!this.miniCart.contains(event.relatedTarget)) close();
        },
        { signal }
      );
      document.addEventListener(
        'keydown',
        (event) => {
          if (event.key !== 'Escape' || !this.miniCart.classList.contains('is-preview-open')) return;
          this.closeMiniCart(true);
          this.miniCart.querySelector('[data-cart-link]')?.focus();
        },
        { signal }
      );
    }

    closeMiniCart(instant = false) {
      if (!this.miniCart) return;
      clearTimeout(this.miniTimer);
      this.miniCart.classList.remove('is-preview-open');
      if (instant) this.miniPanel.style.transition = 'none';
      requestAnimationFrame(() => {
        if (this.miniPanel) this.miniPanel.style.transition = '';
      });
    }

    renderMiniCart() {
      const panel = this.miniPanel;
      const cart = this.cart;
      if (!panel || !cart) return;

      const labels = panel.dataset;
      const esc = (value) =>
        String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
      const money = (cents) => esc(this.formatMoney(cents / 100, labels.moneyFormat));
      const countLabel = (labels[cart.item_count === 1 ? 'countOne' : 'countOther'] || '').replace(/\d+/, cart.item_count);

      if (!cart.item_count) {
        panel.innerHTML = `
          <div class="pt-minicart__head"><p class="pt-minicart__title">${esc(labels.title)}</p></div>
          <p class="pt-minicart__empty">${esc(labels.empty)}</p>
          <a class="pt-minicart__btn pt-minicart__btn--dark" href="${esc(labels.shopUrl)}">${esc(labels.shop)}</a>`;
        return;
      }

      const items = cart.items
        .map((item) => {
          let image = '';
          if (item.image) {
            const src = new URL(item.image, window.location.origin);
            src.searchParams.set('width', '120');
            image = `<img src="${esc(src.href)}" alt="" width="56" height="56" loading="lazy">`;
          }
          const variant = item.product_has_only_default_variant ? '' : item.variant_title;
          return `
            <li>
              <a class="pt-minicart__item" href="${esc(item.url)}">
                <span class="pt-minicart__media">
                  ${image}
                  <span class="pt-minicart__qty"><span class="visually-hidden">${esc(labels.qty)}</span> ${item.quantity}</span>
                </span>
                <span>
                  <span class="pt-minicart__name">${esc(item.product_title)}</span>
                  ${variant ? `<span class="pt-minicart__variant">${esc(variant)}</span>` : ''}
                </span>
                <span class="pt-minicart__price">${money(item.final_line_price)}</span>
              </a>
            </li>`;
        })
        .join('');

      panel.innerHTML = `
        <div class="pt-minicart__head">
          <p class="pt-minicart__title">${esc(labels.title)}</p>
          <span class="pt-minicart__count">${esc(countLabel)}</span>
        </div>
        <ul class="pt-minicart__list" role="list">${items}</ul>
        <div class="pt-minicart__total">
          <span>${esc(labels.total)}</span>
          <strong>${money(cart.total_price)}</strong>
        </div>
        <div class="pt-minicart__actions">
          <a class="pt-minicart__btn" href="${esc(labels.cartUrl)}">${esc(labels.view)}</a>
          <form action="${esc(labels.cartUrl)}" method="post">
            <button type="submit" class="pt-minicart__btn pt-minicart__btn--dark" name="checkout">${esc(labels.checkout)}</button>
          </form>
        </div>`;
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
