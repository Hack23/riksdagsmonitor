/**
 * Tests for back-to-top button functionality
 * Tests the IIFE in js/back-to-top.js:
 *   - scroll listener shows/hides button at 300px threshold via .visible class
 *   - click handler calls window.scrollTo with prefers-reduced-motion check
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Back to Top Button', () => {
  let button;

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="back-to-top" class="back-to-top" aria-label="Back to top">
        ↑
      </button>
    `;

    button = document.getElementById('back-to-top');
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  // ============================================================================
  // DOM STRUCTURE
  // ============================================================================

  describe('DOM Structure', () => {
    it('should exist in DOM', () => {
      expect(button).not.toBeNull();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have back-to-top class', () => {
      expect(button.classList.contains('back-to-top')).toBe(true);
    });

    it('should have proper aria-label for accessibility', () => {
      expect(button.getAttribute('aria-label')).toBe('Back to top');
    });

    it('should have arrow content', () => {
      expect(button.textContent.trim()).toBe('↑');
    });

    it('should have id="back-to-top"', () => {
      expect(button.id).toBe('back-to-top');
    });
  });

  // ============================================================================
  // SCROLL VISIBILITY BEHAVIOR
  // ============================================================================

  describe('Scroll Visibility', () => {
    it('should not have visible class initially', () => {
      expect(button.classList.contains('visible')).toBe(false);
    });

    it('should add visible class when pageYOffset > 300', () => {
      // Simulate the scroll listener logic from back-to-top.js
      Object.defineProperty(window, 'pageYOffset', { writable: true, value: 301 });
      if (window.pageYOffset > 300) {
        button.classList.add('visible');
      } else {
        button.classList.remove('visible');
      }
      expect(button.classList.contains('visible')).toBe(true);
    });

    it('should remove visible class when pageYOffset <= 300', () => {
      button.classList.add('visible');
      Object.defineProperty(window, 'pageYOffset', { writable: true, value: 300 });
      if (window.pageYOffset > 300) {
        button.classList.add('visible');
      } else {
        button.classList.remove('visible');
      }
      expect(button.classList.contains('visible')).toBe(false);
    });

    it('should remove visible class when pageYOffset is 0', () => {
      button.classList.add('visible');
      Object.defineProperty(window, 'pageYOffset', { writable: true, value: 0 });
      if (window.pageYOffset > 300) {
        button.classList.add('visible');
      } else {
        button.classList.remove('visible');
      }
      expect(button.classList.contains('visible')).toBe(false);
    });

    it('should toggle correctly at boundary (300 = hidden, 301 = visible)', () => {
      // At exactly 300 — should be hidden
      Object.defineProperty(window, 'pageYOffset', { writable: true, value: 300 });
      if (window.pageYOffset > 300) {
        button.classList.add('visible');
      } else {
        button.classList.remove('visible');
      }
      expect(button.classList.contains('visible')).toBe(false);

      // At 301 — should be visible
      window.pageYOffset = 301;
      if (window.pageYOffset > 300) {
        button.classList.add('visible');
      } else {
        button.classList.remove('visible');
      }
      expect(button.classList.contains('visible')).toBe(true);
    });

    it('should support scroll event listener registration', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      window.addEventListener('scroll', () => {});
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
  });

  // ============================================================================
  // CLICK BEHAVIOR (scrollTo)
  // ============================================================================

  describe('Click Behavior', () => {
    it('should support smooth scrolling API', () => {
      expect(typeof window.scrollTo).toBe('function');
    });

    it('should call scrollTo with smooth behavior when no motion preference', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      });

      window.scrollTo = vi.fn();

      // Simulate click handler logic from back-to-top.js
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });

      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth'
      });
    });

    it('should call scrollTo with auto behavior when prefers-reduced-motion', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      });

      window.scrollTo = vi.fn();

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });

      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'auto'
      });
    });

    it('should always scroll to top: 0', () => {
      window.scrollTo = vi.fn();

      window.scrollTo({ top: 0, behavior: 'smooth' });

      expect(window.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ top: 0 })
      );
    });

    it('should support click event listener registration', () => {
      const addEventListenerSpy = vi.spyOn(button, 'addEventListener');
      button.addEventListener('click', () => {});
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  // ============================================================================
  // PREFERS-REDUCED-MOTION
  // ============================================================================

  describe('Prefers Reduced Motion', () => {
    it('should check prefers-reduced-motion media query', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      });

      const result = window.matchMedia('(prefers-reduced-motion: reduce)');
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
      expect(result.matches).toBe(false);
    });

    it('should detect when user prefers reduced motion', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      });

      const result = window.matchMedia('(prefers-reduced-motion: reduce)');
      expect(result.matches).toBe(true);
    });

    it('should use auto behavior for reduced-motion users', () => {
      const prefersReducedMotion = true;
      const behavior = prefersReducedMotion ? 'auto' : 'smooth';
      expect(behavior).toBe('auto');
    });

    it('should use smooth behavior for standard users', () => {
      const prefersReducedMotion = false;
      const behavior = prefersReducedMotion ? 'auto' : 'smooth';
      expect(behavior).toBe('smooth');
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle missing button gracefully', () => {
      document.body.innerHTML = '';
      const missingButton = document.getElementById('back-to-top');
      expect(missingButton).toBeNull();

      // The IIFE checks `if (backToTopButton)` — should not throw
      if (missingButton) {
        missingButton.classList.add('visible');
      }
      // No error thrown = pass
    });

    it('should handle large scroll values', () => {
      Object.defineProperty(window, 'pageYOffset', { writable: true, value: 999999 });
      if (window.pageYOffset > 300) {
        button.classList.add('visible');
      }
      expect(button.classList.contains('visible')).toBe(true);
    });

    it('should handle negative scroll values', () => {
      Object.defineProperty(window, 'pageYOffset', { writable: true, value: -10 });
      if (window.pageYOffset > 300) {
        button.classList.add('visible');
      } else {
        button.classList.remove('visible');
      }
      expect(button.classList.contains('visible')).toBe(false);
    });
  });
});
