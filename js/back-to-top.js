/**
 * Back to Top Button Functionality
 * Respects user's prefers-reduced-motion preference
 */
(function() {
  'use strict';
  
  const backToTopButton = document.getElementById('backToTop');
  
  if (!backToTopButton) {
    return; // Exit if button doesn't exist
  }
  
  // Show/hide button based on scroll position
  window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
      backToTopButton.classList.add('visible');
    } else {
      backToTopButton.classList.remove('visible');
    }
  }, { passive: true });
  
  // Scroll to top with reduced motion support
  backToTopButton.addEventListener('click', function() {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  });
})();
