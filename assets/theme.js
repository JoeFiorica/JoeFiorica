(() => {
  'use strict';
  const root = document.documentElement;
  const storageKey = 'joefiorica.theme';
  let fadeTimer;

  function show(theme, animate = false) {
    if (theme !== root.dataset.theme) {
      window.clearTimeout(fadeTimer);
      root.classList.toggle('theme-fade', animate);
      root.dataset.theme = theme;
      // Remove animation styles after the 320 ms page fade has settled.
      if (animate) fadeTimer = window.setTimeout(() => root.classList.remove('theme-fade'), 400);
    }
    const button = document.querySelector('.theme-toggle');
    if (button) {
      const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
      button.title = label;
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(theme === 'dark'));
    }
  }

  let saved;
  try { saved = localStorage.getItem(storageKey); } catch { /* Use light mode. */ }
  // This script runs in the head so the saved palette is ready before first paint.
  show(saved === 'dark' ? 'dark' : 'light');

  document.addEventListener('DOMContentLoaded', () => {
    show(root.dataset.theme);
    document.querySelector('.theme-toggle').addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(storageKey, next); } catch { /* Keep it for this visit. */ }
      show(next, true);
    });
  });

  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    const next = event.newValue === 'dark' ? 'dark' : 'light';
    show(next, !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  });
})();
