/**
 * PATÉLLE search page — filter dropdowns and auto-submit
 */
(() => {
  if (window.ptSearchScriptLoaded) return;
  window.ptSearchScriptLoaded = true;

  const submit = (form) => {
    form.querySelectorAll('input, select').forEach((field) => {
      if (field.type !== 'checkbox' && field.value === '') field.disabled = true;
    });
    form.submit();
  };

  document.addEventListener('change', (event) => {
    const form = event.target.closest('[data-pt-search-filters]');
    if (!form) return;
    if (event.target.matches('input[type="checkbox"], [data-pt-search-sort]')) submit(form);
  });

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-pt-search-filters]');
    if (!form) return;
    event.preventDefault();
    submit(form);
  });

  document.addEventListener(
    'toggle',
    (event) => {
      const details = event.target;
      if (!details.matches?.('[data-pt-filter]') || !details.open) return;
      document.querySelectorAll('[data-pt-filter][open]').forEach((other) => {
        if (other !== details) other.open = false;
      });
    },
    true
  );

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-pt-filter]')) return;
    document.querySelectorAll('[data-pt-filter][open]').forEach((details) => {
      details.open = false;
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const open = document.querySelector('[data-pt-filter][open]');
    if (!open) return;
    open.open = false;
    open.querySelector('summary')?.focus();
  });
})();
