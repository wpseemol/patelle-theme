/* Patelle — hero slider + cursor parallax */
(() => {
  const LEAVE_MS = 900;
  const canHover = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  class PatelleHero {
    constructor(root) {
      this.root = root;
      this.slides = [...root.querySelectorAll('.ph-slide')];
      this.index = Math.max(0, this.slides.findIndex((s) => s.classList.contains('is-active')));
      this.interval = +root.dataset.interval || 7000;
      this.autoplay = root.dataset.autoplay === 'true' && this.slides.length > 1 && !reduced();
      this.hovered = false;
      root.style.setProperty('--ph-interval', this.interval + 'ms');

      this.bindSlider();
      this.bindCards();
      this.bindParallax();
      this.observe();
      this.fitWords();
      this.onResize = () => { cancelAnimationFrame(this.fitRaf); this.fitRaf = requestAnimationFrame(() => this.fitWords()); };
      addEventListener('resize', this.onResize);
      document.fonts && document.fonts.ready.then(() => this.fitWords());
      this.play();
    }

    /* ---------- Slider ---------- */
    go(next, dir = next > this.index ? 1 : -1) {
      const n = this.slides.length;
      next = (next + n) % n;
      if (next === this.index) return;
      const prev = this.slides[this.index];
      const cur = this.slides[next];
      this.root.style.setProperty('--dir', dir);
      clearTimeout(this.leaveTimer);
      this.slides.forEach((s) => s.classList.remove('is-leaving'));
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      prev.setAttribute('aria-hidden', 'true'); prev.inert = true;
      cur.classList.add('is-active');
      cur.removeAttribute('aria-hidden'); cur.inert = false;
      this.leaveTimer = setTimeout(() => prev.classList.remove('is-leaving'), LEAVE_MS);
      this.index = next;
      this.play();
    }
    next() { this.go(this.index + 1, 1); }
    prev() { this.go(this.index - 1, -1); }

    play() {
      clearTimeout(this.timer);
      this.root.classList.remove('is-playing');
      if (!this.autoplay) return;
      void this.root.offsetWidth; // restart progress bar
      this.root.classList.add('is-playing');
      this.remaining = this.interval;
      this.started = performance.now();
      this.root.classList.toggle('is-paused', this.paused());
      this.tick();
    }
    tick() {
      clearTimeout(this.timer);
      if (this.paused()) return;
      this.timer = setTimeout(() => this.next(), this.remaining);
    }
    paused() { return this.hovered || this.focused || !this.inView || document.hidden; }
    syncPause() {
      if (!this.autoplay) return;
      const p = this.paused();
      if (p && !this.root.classList.contains('is-paused')) {
        clearTimeout(this.timer);
        this.remaining -= performance.now() - this.started;
      } else if (!p && this.root.classList.contains('is-paused')) {
        this.started = performance.now();
        this.tick();
      }
      this.root.classList.toggle('is-paused', p);
    }

    bindSlider() {
      const r = this.root;
      r.querySelector('[data-ph-next]')?.addEventListener('click', () => this.next());
      r.querySelector('[data-ph-prev]')?.addEventListener('click', () => this.prev());
      r.addEventListener('keydown', (e) => {
        if (e.target.closest('input, textarea')) return;
        if (e.key === 'ArrowRight') this.next();
        if (e.key === 'ArrowLeft') this.prev();
      });
      r.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { this.hovered = true; this.syncPause(); } });
      r.addEventListener('pointerleave', () => { this.hovered = false; this.syncPause(); });
      r.addEventListener('focusin', () => { this.focused = true; this.syncPause(); });
      r.addEventListener('focusout', (e) => { if (!r.contains(e.relatedTarget)) { this.focused = false; this.syncPause(); } });
      document.addEventListener('visibilitychange', () => this.syncPause());

      // Swipe (touch)
      let x0 = null, y0 = 0;
      r.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      r.addEventListener('touchend', (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? this.next() : this.prev();
        x0 = null;
      }, { passive: true });

      // Theme editor
      document.addEventListener('shopify:block:select', (e) => {
        const i = this.slides.indexOf(e.target);
        if (i > -1) { this.go(i); this.autoplayWas = this.autoplay; this.autoplay = false; this.play(); }
      });
      document.addEventListener('shopify:block:deselect', () => {
        if (this.autoplayWas !== undefined) { this.autoplay = this.autoplayWas; this.play(); }
      });
    }

    observe() {
      this.inView = true;
      if (!('IntersectionObserver' in window)) return this.root.classList.add('is-inview');
      new IntersectionObserver(([e]) => {
        this.inView = e.isIntersecting;
        this.root.classList.toggle('is-inview', e.isIntersecting);
        this.syncPause();
      }, { threshold: 0.15 }).observe(this.root);
    }

    /* ---------- Word fitting (respects min/max font size) ---------- */
    fitWords() {
      const cs = getComputedStyle(this.root);
      const min = parseFloat(cs.getPropertyValue('--ph-word-min')) || 88;
      const max = parseFloat(cs.getPropertyValue('--ph-word-max')) || 420;
      const avail = this.root.clientWidth * 0.98;
      this.root.querySelectorAll('[data-ph-fit]').forEach((el) => {
        el.style.setProperty('--ph-word-size', '100px');
        const w = el.scrollWidth || 1;
        const size = Math.min(max, Math.max(min, (avail / w) * 100));
        el.style.setProperty('--ph-word-size', size.toFixed(1) + 'px');
      });
    }

    /* ---------- Product card ---------- */
    bindCards() {
      this.root.querySelectorAll('.ph-card').forEach((card) => {
        const input = card.querySelector('[data-ph-variant]');
        card.querySelectorAll('button.ph-size').forEach((btn) => {
          btn.addEventListener('click', () => {
            card.querySelectorAll('button.ph-size').forEach((b) => b.setAttribute('aria-pressed', b === btn));
            if (input) input.value = btn.dataset.variant;
          });
        });
      });
    }

    /* ---------- Cursor parallax (rAF + lerp, desktop only) ---------- */
    bindParallax() {
      if (!canHover() || reduced()) return;
      const r = this.root;
      const t = { x: 0, y: 0 }, c = { x: 0, y: 0 };
      let raf = 0, rect = null;
      const loop = () => {
        c.x += (t.x - c.x) * 0.12;
        c.y += (t.y - c.y) * 0.12;
        r.style.setProperty('--mouse-x', c.x.toFixed(4));
        r.style.setProperty('--mouse-y', c.y.toFixed(4));
        raf = Math.abs(t.x - c.x) + Math.abs(t.y - c.y) > 0.001 ? requestAnimationFrame(loop) : 0;
      };
      const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
      r.addEventListener('pointerenter', () => { rect = r.getBoundingClientRect(); });
      r.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        rect = rect || r.getBoundingClientRect();
        t.x = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
        t.y = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
        kick();
      }, { passive: true });
      r.addEventListener('pointerleave', () => { t.x = 0; t.y = 0; rect = null; kick(); });
      addEventListener('scroll', () => { rect = null; }, { passive: true });
    }

    destroy() {
      clearTimeout(this.timer); clearTimeout(this.leaveTimer);
      removeEventListener('resize', this.onResize);
    }
  }

  const init = (scope = document) =>
    scope.querySelectorAll('[data-ph-hero]').forEach((el) => {
      if (!el._phHero) el._phHero = new PatelleHero(el);
    });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
  document.addEventListener('shopify:section:load', (e) => init(e.target));
  document.addEventListener('shopify:section:unload', (e) => e.target.querySelector('[data-ph-hero]')?._phHero?.destroy());
})();
