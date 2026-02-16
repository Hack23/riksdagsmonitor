/**
 * @module Infrastructure/Accessibility
 * @category Infrastructure
 * 
 * @title Back-to-Top Navigation Utility - Accessibility & User Experience
 * 
 * @description
 * **INTELLIGENCE OPERATIVE PERSPECTIVE**
 * 
 * This utility provides a "back to top" button that scrolls long-form political
 * intelligence articles to the top with accessibility support. While seemingly
 * simple, back-to-top functionality serves critical accessibility functions:
 * enabling users with mobility challenges to navigate lengthy documents without
 * extensive scrolling, and supporting accessibility standards compliance (WCAG 2.1).
 * 
 * **ACCESSIBILITY RATIONALE:**
 * Intelligence articles are often lengthy (2000-5000 words), presenting navigation
 * challenges for users with:
 * - Mobility limitations (cannot scroll rapidly)
 * - Motor control issues (fine mouse control difficult)
 * - Keyboard-only navigation (must tab through entire document)
 * - Visual impairments (screen reader users need navigation aids)
 * - Cognitive disabilities (need quick navigation to return to familiar points)
 * 
 * Back-to-top functionality addresses these accessibility needs.
 * 
 * **FUNCTIONAL REQUIREMENTS:**
 * The utility implements:
 * 1. **Auto-Hide**: Button only visible after user scrolls 300px down
 * 2. **Scroll Animation**: Smooth scrolling (respects prefers-reduced-motion)
 * 3. **Keyboard Access**: Can be triggered with keyboard navigation
 * 4. **Screen Reader Support**: Button announces purpose to screen readers
 * 5. **Visual Clarity**: High contrast, appropriate size, clear labeling
 * 
 * **USER EXPERIENCE FLOW:**
 * 1. User loads article (button hidden, not in initial view)
 * 2. User scrolls past 300px threshold
 * 3. Button becomes visible with CSS fade-in animation
 * 4. User clicks button or presses Enter
 * 5. Page smoothly scrolls to top (respecting motion preferences)
 * 6. Button becomes hidden again
 * 7. User can resume reading from top
 * 
 * **ACCESSIBILITY COMPLIANCE:**
 * Implementation meets WCAG 2.1 AA standards:
 * - **Keyboard Accessible**: Fully operable via keyboard (Tab, Enter, Space)
 * - **Visual Contrast**: High contrast colors (4.5:1 minimum)
 * - **Clear Purpose**: Button label clearly states action
 * - **Focus Indicator**: Visible focus ring for keyboard navigation
 * - **Motion Respect**: Honors prefers-reduced-motion media query
 * 
 * **MOTION PREFERENCE HANDLING:**
 * Respects user's accessibility preferences:
 * - **prefers-reduced-motion: no-preference**: Smooth scroll animation
 * - **prefers-reduced-motion: reduce**: Instant jump (no animation)
 * 
 * Implementation:
 * ```javascript
 * const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 * window.scrollTo({
 *   top: 0,
 *   behavior: prefersReducedMotion ? 'auto' : 'smooth'
 * });
 * ```
 * 
 * This ensures users who experience motion sickness from animations aren't
 * subjected to scroll animations they disabled at OS level.
 * 
 * **VISIBILITY THRESHOLD:**
 * Button appears after 300px scroll (approximately 1.5-2 screen heights):
 * - Too early: Button clutters screen for short articles
 * - Too late: Users unable to get back up for very long articles
 * - 300px: Balanced default for typical viewport heights
 * - Configurable: Can be adjusted per article type/length
 * 
 * **IMPLEMENTATION CONSIDERATIONS:**
 * Self-contained IIFE prevents global scope pollution:
 * - (function() { ... })() immediately-invoked function
 * - 'use strict' enforces strict mode
 * - localStorage not used (no persistence needed)
 * - No external dependencies
 * - Minimal performance impact
 * 
 * **PERFORMANCE CHARACTERISTICS:**
 * - Load impact: Minimal (small script)
 * - Runtime cost: Single scroll event listener
 * - Memory: Negligible (no large data structures)
 * - CPU: Scroll detection only when scrolling
 * 
 * **BROWSER COMPATIBILITY:**
 * Works in all modern browsers:
 * - Chrome/Edge: Full support
 * - Firefox: Full support
 * - Safari: Full support
 * - IE 11: Requires polyfills for smooth scroll behavior
 * 
 * **TOUCH DEVICE HANDLING:**
 * Works on mobile/tablet devices:
 * - Touch scrolling triggers scroll events
 * - Button visible on touch devices
 * - Click targets sized for touch (44px minimum)
 * - No hover effects (not applicable to touch)
 * 
 * **RESPONSIVE BEHAVIOR:**
 * Adapts to different viewport sizes:
 * - **Mobile (320px)**: Button positioned for thumb accessibility
 * - **Tablet (768px)**: Button positioned at edge, not blocking content
 * - **Desktop (1920px)**: Button fixed position at corner
 * 
 * **INTELLIGENCE ARTICLE CONTEXT:**
 * Back-to-top particularly valuable for political intelligence content:
 * - Evening Analysis: 3000+ word articles need navigation
 * - Committee Reports: Dense analytical content benefits from quick nav
 * - Week Ahead: Long event lists need return-to-top
 * - Breaking News: Archives accumulate 20+ related articles
 * 
 * Users need quick navigation between article sections.
 * 
 * **COMBINATION WITH ANCHOR NAVIGATION:**
 * Works alongside table-of-contents and anchor links:
 * - User navigates via TOC to section
 * - Reads content (potentially long section)
 * - Uses back-to-top to return quickly
 * - May then navigate to different section
 * 
 * **LANGUAGE AGNOSTIC:**
 * Implementation language-independent:
 * - Button label provided by HTML (supports 14 languages)
 * - No language in JavaScript code
 * - Works identically in all language editions
 * 
 * **ANALYTICS INTEGRATION:**
 * Optional: Track back-to-top usage:
 * - When used: Indicates article length perception
 * - Frequency: Shows deep reading behavior
 * - Timing: When in article do users jump back to top
 * - A/B Testing: Different threshold positions
 * 
 * **FAILURE HANDLING:**
 * Graceful degradation:
 * - Button not found (missing HTML): Script exits silently
 * - JavaScript disabled: Button not functional (but not harmful)
 * - CSS missing: Button visible, click still works (no animation)
 * - Event listener fails: Page still usable, navigation broken
 * 
 * **GDPR COMPLIANCE:**
 * No personal data processing:
 * - No analytics tracking (unless explicitly added)
 * - No cookies or local storage
 * - No external communication
 * - Minimal privacy impact
 * 
 * **SECURITY IMPLICATIONS:**
 * Minimal security surface:
 * - No external resource loading
 * - No DOM manipulation beyond button
 * - No eval or dynamic code execution
 * - No storage of user data
 * 
 * @osint User Behavior Intelligence
 * - Back-to-top usage indicates article length perception
 * - Frequency patterns show reading habits
 * - Scroll patterns indicate information seeking
 * - Valuable for UX research and optimization
 * 
 * @risk Accessibility Assurance
 * - Enables access for mobility-impaired users
 * - Meets WCAG 2.1 AA standards
 * - Respects motion preferences
 * - Prevents user frustration on long articles
 * 
 * @gdpr Accessibility Compliance
 * - WCAG 2.1 AA compliance supports accessibility mandate
 * - Motion preference respect supports disability accommodation
 * - No personal data processing
 * - Supports inclusive access to political information
 * 
 * @security Accessibility Integrity
 * - Simple, secure implementation
 * - No external dependencies
 * - No data transmission
 * - Minimal attack surface
 * 
 * @author Hack23 AB (Accessibility & User Experience)
 * @license Apache-2.0
 * @version 1.0.0
 * @since 2024-06-20
 * @see https://www.w3.org/WAI/WCAG21/quickref/ (WCAG 2.1 Guidelines)
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/prefers-reduced-motion (Motion Preference)
 * @see tests/accessibility.test.js (Accessibility Tests)
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
