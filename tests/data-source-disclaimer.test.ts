/**
 * Tests for data source disclaimer functionality
 * Tests the showDataSourceDisclaimer() utility:
 *   - Creates disclaimer banners with correct data source type
 *   - Inserts after heading or prepends to container
 *   - Replaces existing disclaimers to avoid duplicates
 *   - Sets correct ARIA attributes for accessibility
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { showDataSourceDisclaimer } from '../src/browser/shared/dom-utils.js';
import type { DataSourceType } from '../src/browser/shared/dom-utils.js';

describe('Data Source Disclaimer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('section');
    container.id = 'test-dashboard';
    container.innerHTML = '<h2>Test Dashboard</h2><div class="dashboard-grid"></div>';
    document.body.appendChild(container);
  });

  // ============================================================================
  // CREATION
  // ============================================================================

  describe('Creation', () => {
    it('should create a disclaimer element for live data', () => {
      showDataSourceDisclaimer(container, 'live');
      const disclaimer = container.querySelector('.data-source-disclaimer');
      expect(disclaimer).not.toBeNull();
      expect(disclaimer!.textContent).toContain('Live data');
    });

    it('should create a disclaimer element for synthetic data', () => {
      showDataSourceDisclaimer(container, 'synthetic');
      const disclaimer = container.querySelector('.data-source-disclaimer');
      expect(disclaimer).not.toBeNull();
      expect(disclaimer!.textContent).toContain('Synthetic fallback data');
    });

    it('should create a disclaimer element for mock data', () => {
      showDataSourceDisclaimer(container, 'mock');
      const disclaimer = container.querySelector('.data-source-disclaimer');
      expect(disclaimer).not.toBeNull();
      expect(disclaimer!.textContent).toContain('Mock demonstration data');
    });
  });

  // ============================================================================
  // CSS CLASSES
  // ============================================================================

  describe('CSS Classes', () => {
    it('should have data-source-live class for live data', () => {
      showDataSourceDisclaimer(container, 'live');
      const disclaimer = container.querySelector('.data-source-disclaimer');
      expect(disclaimer!.classList.contains('data-source-live')).toBe(true);
    });

    it('should have data-source-synthetic class for synthetic data', () => {
      showDataSourceDisclaimer(container, 'synthetic');
      const disclaimer = container.querySelector('.data-source-disclaimer');
      expect(disclaimer!.classList.contains('data-source-synthetic')).toBe(true);
    });

    it('should have data-source-mock class for mock data', () => {
      showDataSourceDisclaimer(container, 'mock');
      const disclaimer = container.querySelector('.data-source-disclaimer');
      expect(disclaimer!.classList.contains('data-source-mock')).toBe(true);
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  describe('Accessibility', () => {
    it('should have role="status" for screen readers', () => {
      showDataSourceDisclaimer(container, 'live');
      const disclaimer = container.querySelector('.data-source-disclaimer');
      expect(disclaimer!.getAttribute('role')).toBe('status');
    });
  });

  // ============================================================================
  // POSITIONING
  // ============================================================================

  describe('Positioning', () => {
    it('should insert after heading when heading exists', () => {
      showDataSourceDisclaimer(container, 'live');
      const heading = container.querySelector('h2');
      const disclaimer = container.querySelector('.data-source-disclaimer');
      expect(heading!.nextElementSibling).toBe(disclaimer);
    });

    it('should prepend to container when no heading exists', () => {
      container.innerHTML = '<div class="dashboard-grid"></div>';
      showDataSourceDisclaimer(container, 'live');
      const disclaimer = container.querySelector('.data-source-disclaimer');
      expect(container.firstElementChild).toBe(disclaimer);
    });
  });

  // ============================================================================
  // DEDUPLICATION
  // ============================================================================

  describe('Deduplication', () => {
    it('should replace existing disclaimer when called again', () => {
      showDataSourceDisclaimer(container, 'live');
      showDataSourceDisclaimer(container, 'synthetic');

      const disclaimers = container.querySelectorAll('.data-source-disclaimer');
      expect(disclaimers.length).toBe(1);
      expect(disclaimers[0].textContent).toContain('Synthetic');
    });

    it('should update CSS class when source type changes', () => {
      showDataSourceDisclaimer(container, 'live');
      showDataSourceDisclaimer(container, 'mock');

      const disclaimer = container.querySelector('.data-source-disclaimer');
      expect(disclaimer!.classList.contains('data-source-mock')).toBe(true);
      expect(disclaimer!.classList.contains('data-source-live')).toBe(false);
    });
  });

  // ============================================================================
  // ICONS
  // ============================================================================

  describe('Icons', () => {
    it('should show ✅ icon for live data', () => {
      showDataSourceDisclaimer(container, 'live');
      const disclaimer = container.querySelector('.data-source-disclaimer');
      expect(disclaimer!.textContent).toContain('✅');
    });

    it('should show ⚠️ icon for synthetic data', () => {
      showDataSourceDisclaimer(container, 'synthetic');
      const disclaimer = container.querySelector('.data-source-disclaimer');
      expect(disclaimer!.textContent).toContain('⚠️');
    });

    it('should show 🔧 icon for mock data', () => {
      showDataSourceDisclaimer(container, 'mock');
      const disclaimer = container.querySelector('.data-source-disclaimer');
      expect(disclaimer!.textContent).toContain('🔧');
    });
  });

  // ============================================================================
  // TYPE SAFETY
  // ============================================================================

  describe('Type Safety', () => {
    it('should accept all valid DataSourceType values', () => {
      const types: DataSourceType[] = ['live', 'synthetic', 'mock'];
      types.forEach(type => {
        showDataSourceDisclaimer(container, type);
        const disclaimer = container.querySelector('.data-source-disclaimer');
        expect(disclaimer).not.toBeNull();
      });
    });
  });
});
