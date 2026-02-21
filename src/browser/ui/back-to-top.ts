/**
 * @module UI/BackToTop
 * @description WCAG-compliant scroll-to-top button with reduced motion support.
 */

export function initBackToTop(): void {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const toggleVisibility = () => {
    const scrolled = window.scrollY > 300;
    btn.classList.toggle('visible', scrolled);
    btn.setAttribute('aria-hidden', String(!scrolled));
    btn.tabIndex = scrolled ? 0 : -1;
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        toggleVisibility();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'instant' : 'smooth',
    });
  });

  btn.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });

  // Initial state
  toggleVisibility();
}
