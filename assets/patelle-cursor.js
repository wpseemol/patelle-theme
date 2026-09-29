/**
 * PATÉLLE — custom character cursor
 */
(() => {
  const cursor = document.querySelector('[data-pt-cursor]');
  if (!cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const tiltEl = cursor.querySelector('.pt-cursor__tilt');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smooth = cursor.dataset.follow === 'smooth' && !reduceMotion;
  const playful = cursor.classList.contains('pt-cursor--playful') && !reduceMotion;

  const hoverSelector =
    'a, button, [role="button"], label, select, summary, input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"]';
  const textSelector =
    'input:not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]), textarea, [contenteditable="true"]';

  if (cursor.dataset.hideDefault === 'true') {
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

  const render = () => {
    frame = null;
    const ease = smooth ? 0.25 : 1;
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    cursor.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;

    if (playful && tiltEl) {
      velocity *= 0.85;
      const goal = Math.max(-25, Math.min(25, velocity * 1.5));
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
      requestRender();
    },
    { passive: true }
  );

  document.addEventListener('pointerover', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    cursor.classList.toggle('is-hover', Boolean(target.closest(hoverSelector)));
    cursor.classList.toggle('is-text', Boolean(target.closest(textSelector)));
  });

  document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));

  const hide = () => {
    cursor.classList.remove('is-visible', 'is-down');
    lastX = null;
  };
  document.documentElement.addEventListener('pointerleave', hide);
  window.addEventListener('blur', hide);
})();
