/**
 * PATÉLLE product detail — gallery + variant selection
 */
(() => {
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
        thumb.addEventListener('click', () => this.setActiveMedia(thumb));
      });

      this.optionInputs.forEach((input) => {
        input.addEventListener('change', () => this.updateVariant());
      });

      this.updateVariant({ silent: true });
    }

    setActiveMedia(thumb) {
      const src = thumb.getAttribute('data-src');
      const srcset = thumb.getAttribute('data-srcset');
      if (!this.mainImage || !src) return;

      this.mainImage.src = src;
      if (srcset) this.mainImage.srcset = srcset;
      const alt = thumb.getAttribute('data-alt');
      if (alt) this.mainImage.alt = alt;

      this.thumbs.forEach((t) => {
        t.classList.toggle('is-active', t === thumb);
        t.setAttribute('aria-pressed', t === thumb ? 'true' : 'false');
      });
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

      if (!silent && variant && history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        history.replaceState({}, '', url.toString());
      }

      this.syncOptionAvailability(options);
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

  if (!window.ptReviewsMoreBound) {
    window.ptReviewsMoreBound = true;
    document.addEventListener('click', (event) => {
      const more = event.target.closest('[data-pt-reviews-more]');
      if (!more) return;
      const list = more.closest('.pt-pdp-reviews')?.querySelector('[data-pt-reviews-list]');
      if (!list) return;
      const step = Number(more.dataset.step) || 4;
      const hidden = [...list.querySelectorAll('.pt-pdp-review[hidden]')];
      hidden.slice(0, step).forEach((item) => {
        item.hidden = false;
      });
      if (hidden.length <= step) more.closest('.pt-pdp-reviews__more')?.remove();
    });
  }

  document.querySelectorAll('.pt-pdp-reels').forEach((root) => {
    const track = root.querySelector('[data-pt-reels-track]');
    if (!track) return;
    const step = () => Math.min(track.clientWidth * 0.7, 280);
    root.querySelector('[data-pt-reels-prev]')?.addEventListener('click', () => {
      track.scrollBy({ left: -step(), behavior: 'smooth' });
    });
    root.querySelector('[data-pt-reels-next]')?.addEventListener('click', () => {
      track.scrollBy({ left: step(), behavior: 'smooth' });
    });
  });
})();
