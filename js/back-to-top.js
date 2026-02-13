/**
 * Back to Top Button
 * 
 * Shows/hides a scroll-to-top button based on scroll position.
 * Supports prefers-reduced-motion for accessibility.
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

(function() {
  'use strict';
  
  const backToTopButton = document.getElementById('back-to-top');
  
  if (backToTopButton) {
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
    });
    
    // Smooth scroll to top with reduced motion support
    backToTopButton.addEventListener('click', function() {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  }
})();
