/**
 * @jest-environment jsdom
 */

/**
 * Chart Utilities Test Suite
 * 
 * Tests for the ChartUtils module including:
 * - Responsive configuration generation
 * - State management (loading/empty/error)
 * - Accessibility helpers
 * - Formatting utilities
 * - Performance utilities
 */

describe('ChartUtils', () => {
  let container;
  
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-chart-container';
    document.body.appendChild(container);
    
    // Mock window dimensions
    global.innerWidth = 1024;
    global.innerHeight = 768;
    
    // Mock getComputedStyle
    global.getComputedStyle = jest.fn(() => ({
      getPropertyValue: jest.fn(() => '')
    }));
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });
  
  describe('getResponsiveOptions()', () => {
    test('should return responsive options for bar chart', () => {
      const options = window.ChartUtils.getResponsiveOptions('bar');
      
      expect(options).toHaveProperty('responsive', true);
      expect(options).toHaveProperty('maintainAspectRatio', false);
      expect(options.plugins).toHaveProperty('legend');
      expect(options.plugins).toHaveProperty('tooltip');
    });
    
    test('should position legend at top on desktop', () => {
      global.innerWidth = 1024;
      const options = window.ChartUtils.getResponsiveOptions('bar');
      
      expect(options.plugins.legend.position).toBe('top');
    });
    
    test('should position legend at bottom on mobile', () => {
      global.innerWidth = 375;
      const options = window.ChartUtils.getResponsiveOptions('bar');
      
      expect(options.plugins.legend.position).toBe('bottom');
    });
    
    test('should include scales for bar/line/scatter charts', () => {
      const options = window.ChartUtils.getResponsiveOptions('bar');
      
      expect(options).toHaveProperty('scales');
      expect(options.scales).toHaveProperty('x');
      expect(options.scales).toHaveProperty('y');
    });
    
    test('should not include scales for pie/doughnut charts', () => {
      const options = window.ChartUtils.getResponsiveOptions('pie');
      
      expect(options.scales).toBeUndefined();
    });
    
    test('should merge custom options', () => {
      const customOptions = {
        plugins: {
          title: {
            display: true,
            text: 'Custom Title'
          }
        }
      };
      
      const options = window.ChartUtils.getResponsiveOptions('bar', customOptions);
      
      expect(options.plugins.title).toBeDefined();
      expect(options.plugins.title.text).toBe('Custom Title');
      expect(options.plugins.legend).toBeDefined(); // Should still have default legend
    });
  });
  
  describe('State Management', () => {
    test('showLoadingState() should create loading overlay', () => {
      window.ChartUtils.showLoadingState('test-chart-container');
      
      const loadingState = document.querySelector('.chart-loading-state');
      expect(loadingState).toBeTruthy();
      expect(loadingState.getAttribute('role')).toBe('status');
      expect(loadingState.getAttribute('aria-live')).toBe('polite');
      
      const spinner = loadingState.querySelector('.spinner');
      expect(spinner).toBeTruthy();
    });
    
    test('showEmptyState() should create empty overlay', () => {
      const message = 'No data available';
      window.ChartUtils.showEmptyState('test-chart-container', message);
      
      const emptyState = document.querySelector('.chart-empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain(message);
      expect(emptyState.getAttribute('role')).toBe('status');
    });
    
    test('showErrorState() should create error overlay', () => {
      const error = 'Failed to load data';
      window.ChartUtils.showErrorState('test-chart-container', error);
      
      const errorState = document.querySelector('.chart-error-state');
      expect(errorState).toBeTruthy();
      expect(errorState.textContent).toContain(error);
      expect(errorState.getAttribute('role')).toBe('alert');
      
      const retryButton = errorState.querySelector('.retry-button');
      expect(retryButton).toBeTruthy();
    });
    
    test('hideStateOverlays() should remove all state overlays', () => {
      window.ChartUtils.showLoadingState('test-chart-container');
      window.ChartUtils.hideStateOverlays('test-chart-container');
      
      const loadingState = document.querySelector('.chart-loading-state');
      expect(loadingState).toBeFalsy();
    });
    
    test('should handle non-existent container gracefully', () => {
      // Should not throw error
      expect(() => {
        window.ChartUtils.showLoadingState('non-existent-container');
      }).not.toThrow();
    });
  });
  
  describe('Formatting Utilities', () => {
    test('formatNumber() should format with Swedish locale', () => {
      const formatted = window.ChartUtils.formatNumber(1234567);
      
      // Swedish locale uses space as thousands separator
      expect(formatted).toMatch(/1[\s\u00A0]234[\s\u00A0]567/);
    });
    
    test('formatNumber() should handle decimals', () => {
      const formatted = window.ChartUtils.formatNumber(1234.5678, 2);
      
      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
      expect(formatted).toContain(',56'); // Swedish uses comma for decimals
    });
    
    test('formatNumber() should handle null/undefined', () => {
      expect(window.ChartUtils.formatNumber(null)).toBe('N/A');
      expect(window.ChartUtils.formatNumber(undefined)).toBe('N/A');
      expect(window.ChartUtils.formatNumber(NaN)).toBe('N/A');
    });
    
    test('formatPercent() should format as percentage', () => {
      const formatted = window.ChartUtils.formatPercent(0.755);
      
      expect(formatted).toContain('75');
      expect(formatted).toContain('%');
    });
  });
  
  describe('Performance Utilities', () => {
    test('debounce() should delay function execution', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = window.ChartUtils.debounce(mockFn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      // Should not have been called yet
      expect(mockFn).not.toHaveBeenCalled();
      
      // Should be called once after delay
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });
    
    test('createResizeHandler() should return debounced function', () => {
      const mockChart = {
        options: {
          plugins: {
            legend: {}
          }
        },
        update: jest.fn()
      };
      
      const handler = window.ChartUtils.createResizeHandler([mockChart]);
      
      expect(typeof handler).toBe('function');
    });
  });
  
  describe('Theme Colors', () => {
    test('should expose theme colors', () => {
      expect(window.ChartUtils.THEME_COLORS).toBeDefined();
      expect(window.ChartUtils.THEME_COLORS.cyan).toBeTruthy();
      expect(window.ChartUtils.THEME_COLORS.magenta).toBeTruthy();
      expect(window.ChartUtils.THEME_COLORS.yellow).toBeTruthy();
    });
    
    test('should expose party colors', () => {
      expect(window.ChartUtils.THEME_COLORS.parties).toBeDefined();
      expect(window.ChartUtils.THEME_COLORS.parties.S).toBeTruthy(); // Socialdemokraterna
      expect(window.ChartUtils.THEME_COLORS.parties.M).toBeTruthy(); // Moderaterna
      expect(window.ChartUtils.THEME_COLORS.parties.SD).toBeTruthy(); // Sverigedemokraterna
    });
  });
  
  describe('Responsive Breakpoints', () => {
    test('should expose breakpoint constants', () => {
      expect(window.ChartUtils.BREAKPOINTS).toBeDefined();
      expect(window.ChartUtils.BREAKPOINTS.mobile).toBe(320);
      expect(window.ChartUtils.BREAKPOINTS.tablet).toBe(768);
      expect(window.ChartUtils.BREAKPOINTS.desktop).toBe(1024);
      expect(window.ChartUtils.BREAKPOINTS.large).toBe(1440);
    });
  });
  
  describe('Accessibility', () => {
    test('addKeyboardNavigation() should add keyboard event listener', () => {
      const canvas = document.createElement('canvas');
      canvas.id = 'test-canvas';
      document.body.appendChild(canvas);
      
      const mockChart = {
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [{
            data: [10, 20, 30]
          }]
        }
      };
      
      window.ChartUtils.addKeyboardNavigation(canvas, mockChart);
      
      expect(canvas.getAttribute('tabindex')).toBe('0');
      expect(canvas.getAttribute('role')).toBe('img');
    });
    
    test('announceDataPoint() should create live region', () => {
      const mockChart = {
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [{
            data: [10, 20, 30]
          }]
        }
      };
      
      window.ChartUtils.announceDataPoint(mockChart, 0);
      
      const liveRegion = document.getElementById('chart-live-region');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion.getAttribute('role')).toBe('status');
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.textContent).toContain('A');
    });
  });
});
