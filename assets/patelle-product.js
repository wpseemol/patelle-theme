/**
 * PATÉLLE product detail — gallery + variant selection
 */
(() => {
  if (window.ptProductScriptLoaded) return;
  window.ptProductScriptLoaded = true;

  const clampQuantity = (input, value) => {
    const min = Number(input.min) || 1;
    const max = input.max ? Number(input.max) : Infinity;
    const step = Number(input.step) || 1;
    let next = Number.isFinite(value) ? value : min;
    next = Math.round((next - min) / step) * step + min;
    return Math.min(Math.max(next, min), max);
  };

  const syncQuantityButtons = (stepper) => {
    const input = stepper?.querySelector('[data-pt-qty-input]');
    if (!input) return;
    const value = Number(input.value);
    const max = input.max ? Number(input.max) : Infinity;
    stepper.querySelector('[data-pt-qty-step="-1"]').disabled = value <= (Number(input.min) || 1);
    stepper.querySelector('[data-pt-qty-step="1"]').disabled = value >= max;
  };

  class PatelleProductMain extends HTMLElement {
    connectedCallback() {
      this.mainImage = this.querySelector('[data-pt-gallery-main]');
      this.thumbs = [...this.querySelectorAll('[data-pt-gallery-thumb]')];
      this.priceEl = this.querySelector('[data-pt-price]');
      this.compareEl = this.querySelector('[data-pt-compare]');
      this.saveEl = this.querySelector('[data-pt-save]');
      this.saveValueEl = this.querySelector('[data-pt-save-value]');
      this.variantInput = this.querySelector('[name="id"]');
      this.submitButton = this.querySelector('[type="submit"]');
      this.submitLabel = this.submitButton?.querySelector('[data-pt-atc-label]');
      this.optionInputs = [...this.querySelectorAll('[data-pt-option-input]')];

      try {
        this.variants = JSON.parse(this.querySelector('[data-pt-variants]')?.textContent || '[]');
      } catch (_) {
        this.variants = [];
      }

      this.thumbs.forEach((thumb) => {
        thumb.addEventListener('click', () => this.swapMedia(thumb));
      });

      this.optionInputs.forEach((input) => {
        input.addEventListener('change', () => this.updateVariant());
      });

      this.updateVariant({ silent: true });
    }

    swapMedia(thumb) {
      const main = this.mainImage;
      const next = {
        src: thumb.dataset.src,
        srcset: thumb.dataset.srcset || '',
        alt: thumb.dataset.alt || '',
      };
      if (!main || !next.src) return;

      const prev = {
        src: main.getAttribute('src'),
        srcset: main.getAttribute('srcset') || '',
        alt: main.getAttribute('alt') || '',
      };

      main.src = next.src;
      main.srcset = next.srcset;
      main.alt = next.alt;

      thumb.dataset.src = prev.src;
      thumb.dataset.srcset = prev.srcset;
      thumb.dataset.alt = prev.alt;
      const thumbImg = thumb.querySelector('img');
      if (thumbImg) {
        thumbImg.src = prev.src;
        thumbImg.srcset = prev.srcset;
        thumbImg.alt = prev.alt;
      }
    }

    selectedOptions() {
      const options = [];
      const groups = new Map();

      this.optionInputs.forEach((input) => {
        const name = input.getAttribute('data-option-position');
        if (!groups.has(name)) groups.set(name, null);
        if (input.checked) groups.set(name, input.value);
      });

      [...groups.keys()]
        .sort((a, b) => Number(a) - Number(b))
        .forEach((key) => options.push(groups.get(key)));

      return options;
    }

    findVariant(options) {
      return this.variants.find((variant) =>
        variant.options.every((value, index) => value === options[index])
      );
    }

    updateVariant({ silent } = {}) {
      if (!this.variants.length) return;

      const options = this.selectedOptions();
      const variant = this.findVariant(options) || this.variants.find((v) => v.available) || this.variants[0];
      if (!variant) return;

      if (this.variantInput) {
        this.variantInput.value = variant.id;
        this.variantInput.disabled = !variant.available;
      }

      if (this.priceEl) {
        this.priceEl.textContent = this.formatMoney(variant.price);
      }

      if (this.compareEl) {
        if (variant.compare_at_price > variant.price) {
          this.compareEl.hidden = false;
          this.compareEl.textContent = this.formatMoney(variant.compare_at_price);
        } else {
          this.compareEl.hidden = true;
          this.compareEl.textContent = '';
        }
      }

      if (this.saveEl && this.saveValueEl) {
        if (variant.compare_at_price > variant.price) {
          const pct = Math.round(
            ((variant.compare_at_price - variant.price) / variant.compare_at_price) * 100
          );
          this.saveValueEl.textContent = String(pct);
          this.saveEl.hidden = false;
        } else {
          this.saveEl.hidden = true;
        }
      }

      if (this.submitButton && this.submitLabel) {
        this.submitButton.disabled = !variant.available;
        this.submitButton.setAttribute('aria-disabled', variant.available ? 'false' : 'true');
        this.submitLabel.textContent = variant.available
          ? this.dataset.addLabel || 'Add to cart'
          : this.dataset.soldOutLabel || 'Sold out';
      }

      this.updateQuantityLimits(variant);

      if (!silent && variant && history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        history.replaceState({}, '', url.toString());
      }

      this.syncOptionAvailability(options);
    }

    updateQuantityLimits(variant) {
      const input = this.querySelector('[data-pt-qty-input]');
      if (!input || !('qty_max' in variant)) return;

      input.min = variant.qty_min || 1;
      input.step = variant.qty_step || 1;
      if (variant.qty_max == null) {
        input.removeAttribute('max');
      } else {
        input.max = variant.qty_max;
      }
      input.value = clampQuantity(input, parseInt(input.value, 10));
      syncQuantityButtons(input.closest('[data-pt-qty]'));
    }

    syncOptionAvailability(selected) {
      this.optionInputs.forEach((input) => {
        const position = Number(input.getAttribute('data-option-position')) - 1;
        const value = input.value;
        const trial = selected.slice();
        trial[position] = value;
        const match = this.variants.find((variant) =>
          variant.options.every((opt, i) => opt === trial[i])
        );
        input.disabled = !(match && match.available);
      });
    }

    formatMoney(cents) {
      const format = this.dataset.moneyFormat || window.Shopify?.money_format || '${{amount}}';
      if (window.Shopify?.formatMoney) {
        return window.Shopify.formatMoney(cents, format);
      }
      const amount = (Number(cents) / 100).toFixed(2);
      return format.replace(/\{\{\s*amount\s*\}\}/, amount).replace(/\{\{\s*amount_no_decimals\s*\}\}/, String(Math.round(cents / 100)));
    }
  }

  if (!customElements.get('patelle-product-main')) {
    customElements.define('patelle-product-main', PatelleProductMain);
  }

  const selectTab = (tab, { focus = false } = {}) => {
    const root = tab.closest('[data-pt-tabs]');
    if (!root) return;
    root.querySelectorAll('[data-pt-tab]').forEach((other) => {
      const selected = other === tab;
      other.setAttribute('aria-selected', String(selected));
      other.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(other.getAttribute('aria-controls'));
      if (panel) panel.hidden = !selected;
    });
    if (focus) tab.focus();
  };

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-pt-tab]');
    if (tab) selectTab(tab);
  });

  document.addEventListener('keydown', (event) => {
    const tab = event.target.closest('[data-pt-tab]');
    if (!tab) return;
    const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[data-pt-tab]')];
    const index = tabs.indexOf(tab);
    const moves = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = tabs[(moves[event.key] + tabs.length) % tabs.length];
    selectTab(next, { focus: true });
  });

  // Theme editor: selecting a tab or FAQ block shows its panel.
  document.addEventListener('shopify:block:select', (event) => {
    const target = event.target;
    if (!target.closest?.('[data-pt-tabs]')) return;
    if (target.matches('[data-pt-tab]')) {
      selectTab(target);
      return;
    }
    const panel = target.closest('[role="tabpanel"]');
    const tab = panel && document.querySelector(`[aria-controls="${panel.id}"]`);
    if (tab) selectTab(tab);
    if (target.matches('details')) target.open = true;
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-pt-qty-step]');
    if (!button) return;
    const stepper = button.closest('[data-pt-qty]');
    const input = stepper?.querySelector('[data-pt-qty-input]');
    if (!input) return;
    const step = Number(input.step) || 1;
    const direction = Number(button.dataset.ptQtyStep);
    input.value = clampQuantity(input, Number(input.value) + direction * step);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  document.addEventListener('change', (event) => {
    const input = event.target.closest('[data-pt-qty-input]');
    if (!input) return;
    input.value = clampQuantity(input, parseInt(input.value, 10));
    syncQuantityButtons(input.closest('[data-pt-qty]'));
  });

  document.addEventListener('click', (event) => {
    const play = event.target.closest('[data-pt-video-play]');
    if (!play) return;
    const frame = play.closest('[data-pt-video-frame]');
    const video = frame?.querySelector('video');
    if (!video) return;
    frame.classList.add('is-playing');
    video.setAttribute('controls', '');
    video.play();
  });

  document.addEventListener('click', (event) => {
    const control = event.target.closest(
      '[data-pt-reviews-more], [data-pt-reviews-prev], [data-pt-reviews-next]'
    );
    if (!control) return;
    const root = control.closest('.pt-pdp-reviews');
    const list = root?.querySelector('[data-pt-reviews-list]');
    if (!list) return;

    const items = [...list.querySelectorAll('.pt-pdp-review')];
    const step = Number(list.dataset.step) || 2;
    let start = Number(list.dataset.start) || 0;
    let count = Number(list.dataset.count) || step;

    if (control.hasAttribute('data-pt-reviews-more')) {
      count += step;
    } else if (control.hasAttribute('data-pt-reviews-next')) {
      if (start + count >= items.length) return;
      start += count;
      count = step;
    } else {
      start = Math.max(0, start - step);
      count = step;
    }

    list.dataset.start = String(start);
    list.dataset.count = String(count);
    items.forEach((item, i) => {
      item.hidden = i < start || i >= start + count;
    });

    const atEnd = start + count >= items.length;
    const prev = root.querySelector('[data-pt-reviews-prev]');
    const next = root.querySelector('[data-pt-reviews-next]');
    const more = root.querySelector('[data-pt-reviews-more]');
    if (prev) prev.disabled = start === 0;
    if (next) next.disabled = atEnd;
    if (more) more.disabled = atEnd;
  });

  document.addEventListener('click', (event) => {
    const arrow = event.target.closest('[data-pt-reels-prev], [data-pt-reels-next]');
    if (!arrow) return;
    const track = arrow.closest('.pt-pdp-reels')?.querySelector('[data-pt-reels-track]');
    if (!track) return;
    const step = Math.min(track.clientWidth * 0.7, 280);
    const dir = arrow.hasAttribute('data-pt-reels-prev') ? -1 : 1;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  });
})();
