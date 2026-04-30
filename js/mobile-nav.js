/**
 * Mobile navigation: hamburger toggle + Escape-key close.
 * Uses aria-expanded on the .mobile-menu-toggle button (WCAG 2.1 AA).
 * Consistent with the existing theme-toggle.js pattern.
 * @module js/mobile-nav
 */
(function () {
  'use strict';
  var btn = document.querySelector('.mobile-menu-toggle');
  if (!btn) { return; }
  btn.addEventListener('click', function () {
    var expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') &&
        btn.getAttribute('aria-expanded') === 'true') {
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    }
  });
}());
