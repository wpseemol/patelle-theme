/**
 * PATÉLLE — custom character cursor
 */
(() => {
  if (window.ptCursorLoaded) return;
  window.ptCursorLoaded = true;

  const cursor = document.querySelector('[data-pt-cursor]');
  if (!cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const tiltEl = cursor.querySelector('.pt-cursor__tilt');
  const offsetEl = cursor.querySelector('[data-pt-cursor-offset]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smooth = cursor.dataset.follow === 'smooth' && !reduceMotion;
  const playful = cursor.classList.contains('pt-cursor--playful') && !reduceMotion;
  const starColors = reduceMotion ? [] : (cursor.dataset.stars || '').split(',').filter(Boolean);

  const ctaSelector =
    'button, [role="button"], input[type="submit"], input[type="button"], .button, .pt-pdp-atc';
  const cardSelector = '.pt-card, .card-wrapper, a, summary, label, select, video';
  const textSelector =
    'input:not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]), textarea, [contenteditable="true"]';

  if (cursor.dataset.pointer === 'hidden') {
    document.documentElement.classList.add('pt-cursor-hide');
  }

  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  let lastX = null;
  let velocity = 0;
  let tilt = 0;
  let frame = null;
  let idleTimer = null;
  let hopTimer = null;

  const render = () => {
    frame = null;
    const ease = smooth ? 0.28 : 1;
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    cursor.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;

    if (playful && tiltEl) {
      velocity *= 0.85;
      const goal = Math.max(-18, Math.min(18, velocity * 1.2));
      tilt += (goal - tilt) * 0.18;
      tiltEl.style.transform = `rotate(${tilt.toFixed(2)}deg)`;
    }

    const moving = Math.abs(targetX - x) > 0.1 || Math.abs(targetY - y) > 0.1;
    if (moving || Math.abs(tilt) > 0.1 || Math.abs(velocity) > 0.1) {
      frame = requestAnimationFrame(render);
    }
  };

  const requestRender = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };

  const resetIdle = () => {
    cursor.classList.remove('is-idle');
    clearTimeout(idleTimer);
    if (playful) idleTimer = setTimeout(() => cursor.classList.add('is-idle'), 2500);
  };

  const burstStars = () => {
    if (!starColors.length || !offsetEl) return;
    for (let i = 0; i < 6; i += 1) {
      const star = document.createElement('span');
      const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.6;
      const distance = 28 + Math.random() * 22;
      star.className = 'pt-cursor__star';
      star.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      star.style.setProperty('--dy', `${Math.sin(angle) * distance - 12}px`);
      star.style.setProperty('--rot', `${Math.round(Math.random() * 240 - 120)}deg`);
      star.style.setProperty('--size', `${8 + Math.round(Math.random() * 6)}px`);
      star.style.setProperty('--color', starColors[i % starColors.length]);
      star.addEventListener('animationend', () => star.remove(), { once: true });
      offsetEl.appendChild(star);
    }
  };

  document.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      targetX = event.clientX;
      targetY = event.clientY;

      if (lastX !== null) {
        velocity = Math.max(-30, Math.min(30, velocity + (event.clientX - lastX)));
      }
      lastX = event.clientX;

      if (!cursor.classList.contains('is-visible')) {
        x = targetX;
        y = targetY;
        cursor.classList.add('is-visible');
      }
      resetIdle();
      requestRender();
    },
    { passive: true }
  );

  document.addEventListener('pointerover', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const overCta = Boolean(target.closest(ctaSelector));
    cursor.classList.toggle('is-over-cta', overCta);
    cursor.classList.toggle('is-over-card', !overCta && Boolean(target.closest(cardSelector)));
    cursor.classList.toggle('is-text', Boolean(target.closest(textSelector)));
  });

  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') return;
    resetIdle();
    cursor.classList.remove('is-hopping');
    cursor.classList.add('is-pressed');
  });

  document.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'mouse') return;
    cursor.classList.remove('is-pressed');
    if (playful) {
      cursor.classList.add('is-hopping');
      clearTimeout(hopTimer);
      hopTimer = setTimeout(() => cursor.classList.remove('is-hopping'), 600);
    }
    burstStars();
  });

  const hide = () => {
    cursor.classList.remove('is-visible', 'is-pressed', 'is-idle');
    clearTimeout(idleTimer);
    lastX = null;
  };
  document.documentElement.addEventListener('pointerleave', hide);
  window.addEventListener('blur', hide);
})();
