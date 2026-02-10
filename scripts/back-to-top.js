/**
 * Back to Top Button
 * Shows a button to scroll back to the top of the page
 * Respects prefers-reduced-motion for accessibility
 */
(function() {
  'use strict';
  
  const backToTopButton = document.getElementById('back-to-top');
  
  if (!backToTopButton) return;
  
  // Show/hide button based on scroll position
  function toggleButtonVisibility() {
    if (window.pageYOffset > 300) {
      backToTopButton.classList.add('visible');
    } else {
      backToTopButton.classList.remove('visible');
    }
  }
  
  // Scroll to top with accessibility support
  function scrollToTop() {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }
  
  // Add event listeners
  window.addEventListener('scroll', toggleButtonVisibility);
  backToTopButton.addEventListener('click', scrollToTop);
  
  // Initial check
  toggleButtonVisibility();
})();
