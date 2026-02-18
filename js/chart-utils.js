/**
 * @module ChartUtils
 * @category Visualization - Shared Chart.js & D3.js Utilities
 * 
 * @description
 * **Shared Chart Configuration & Utility Functions**
 * 
 * Centralized utility module for Chart.js and D3.js visualizations across all
 * 9 dashboard sections. Provides responsive configuration, empty/loading states,
 * accessibility helpers, and cyberpunk theme integration.
 * 
 * ## Features
 * 
 * 1. **Responsive Chart Configuration**: Mobile-first responsive options for Chart.js
 * 2. **Empty/Loading States**: User-friendly fallback UI components
 * 3. **Accessibility Helpers**: ARIA labels, keyboard navigation, screen reader support
 * 4. **Theme Integration**: Cyberpunk color palette with CSS custom properties
 * 5. **Number Formatting**: Swedish locale formatting (1,234,567)
 * 6. **Performance**: Debounced resize handlers, lazy rendering
 * 
 * ## Usage Examples
 * 
 * ```javascript
 * // Responsive Chart.js configuration
 * const chart = new Chart(ctx, {
 *   ...ChartUtils.getResponsiveOptions('bar'),
 *   data: { ... }
 * });
 * 
 * // Show loading state
 * ChartUtils.showLoadingState('partyEffectivenessChart');
 * 
 * // Handle empty data
 * if (!data || data.length === 0) {
 *   ChartUtils.showEmptyState('partyEffectivenessChart', 'No party data available');
 *   return;
 * }
 * ```
 * 
 * @author Hack23 AB - Political Intelligence Team
 * @license Apache-2.0
 * @version 1.0.0
 * @since 2026
 * 
 * @requires Chart.js v4.4.1
 */

(function(window) {
  'use strict';

  // ============================================================================
  // CONFIGURATION & CONSTANTS
  // ============================================================================

  /**
   * Cyberpunk theme colors from CSS custom properties
   * Fallback values provided for browsers without CSS variable support
   */
  const THEME_COLORS = {
    // Cyberpunk primary colors
    cyan: getComputedStyle(document.documentElement).getPropertyValue('--primary-cyan').trim() || '#00d9ff',
    magenta: getComputedStyle(document.documentElement).getPropertyValue('--primary-magenta').trim() || '#ff006e',
    yellow: getComputedStyle(document.documentElement).getPropertyValue('--primary-yellow').trim() || '#ffbe0b',
    
    // Background colors
    darkBg: getComputedStyle(document.documentElement).getPropertyValue('--dark-bg').trim() || '#0a0e27',
    midBg: getComputedStyle(document.documentElement).getPropertyValue('--mid-bg').trim() || '#1a1e3d',
    
    // Text colors
    lightText: getComputedStyle(document.documentElement).getPropertyValue('--light-text').trim() || '#e0e0e0',
    
    // Party colors (Swedish political parties)
    parties: {
      'S': '#E8112d',   // Socialdemokraterna (Red)
      'M': '#52B6EC',   // Moderaterna (Blue)
      'SD': '#DDDD00',  // Sverigedemokraterna (Yellow)
      'C': '#009933',   // Centerpartiet (Green)
      'V': '#DA291C',   // Vänsterpartiet (Red)
      'KD': '#000077',  // Kristdemokraterna (Dark Blue)
      'L': '#006AB3',   // Liberalerna (Blue)
      'MP': '#83CF39'   // Miljöpartiet (Green)
    }
  };

  /**
   * Responsive breakpoints (mobile-first)
   */
  const BREAKPOINTS = {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
    large: 1440
  };

  // ============================================================================
  // RESPONSIVE CHART CONFIGURATION
  // ============================================================================

  /**
   * Get responsive Chart.js options based on chart type and screen size
   * 
   * @param {string} chartType - Chart type: 'bar', 'line', 'pie', 'doughnut', 'scatter', 'radar'
   * @param {Object} customOptions - Optional custom options to merge
   * @returns {Object} Chart.js configuration object
   */
  function getResponsiveOptions(chartType = 'bar', customOptions = {}) {
    const isMobile = window.innerWidth < BREAKPOINTS.tablet;
    const isTablet = window.innerWidth >= BREAKPOINTS.tablet && window.innerWidth < BREAKPOINTS.desktop;
    
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false, // Allow height control via CSS
      plugins: {
        legend: {
          position: isMobile ? 'bottom' : 'top',
          labels: {
            font: {
              family: "'Inter', sans-serif",
              size: isMobile ? 10 : 12
            },
            color: THEME_COLORS.lightText,
            padding: isMobile ? 8 : 12,
            usePointStyle: true, // Use circles instead of rectangles
            boxWidth: isMobile ? 8 : 12,
            boxHeight: isMobile ? 8 : 12
          }
        },
        tooltip: {
          backgroundColor: THEME_COLORS.darkBg,
          titleColor: THEME_COLORS.cyan,
          bodyColor: THEME_COLORS.lightText,
          borderColor: THEME_COLORS.cyan,
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              // Format numbers with Swedish locale (1,234,567)
              if (context.parsed.y !== null) {
                label += formatNumber(context.parsed.y);
              } else if (context.parsed !== null) {
                label += formatNumber(context.parsed);
              }
              return label;
            }
          }
        }
      }
    };

    // Add axes configuration for bar/line/scatter charts
    if (['bar', 'line', 'scatter'].includes(chartType)) {
      baseOptions.scales = {
        y: {
          ticks: {
            color: THEME_COLORS.lightText,
            font: {
              family: "'Inter', sans-serif",
              size: isMobile ? 9 : 11
            },
            callback: function(value) {
              return formatNumber(value);
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            borderColor: THEME_COLORS.lightText
          }
        },
        x: {
          ticks: {
            color: THEME_COLORS.lightText,
            font: {
              family: "'Inter', sans-serif",
              size: isMobile ? 9 : 11
            },
            maxRotation: isMobile ? 90 : 45,
            minRotation: isMobile ? 90 : 0
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            borderColor: THEME_COLORS.lightText
          }
        }
      };
    }

    // Merge custom options
    return deepMerge(baseOptions, customOptions);
  }

  // ============================================================================
  // EMPTY/LOADING/ERROR STATES
  // ============================================================================

  /**
   * Show loading state in chart container
   * 
   * @param {string} containerId - ID of chart container element
   */
  function showLoadingState(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container not found: ${containerId}`);
      return;
    }

    // If container is a canvas, wrap it
    const parent = container.parentElement;
    
    container.innerHTML = '';
    container.insertAdjacentHTML('beforebegin', `
      <div class="chart-loading-state" role="status" aria-live="polite" aria-label="Loading chart data">
        <div class="spinner" aria-hidden="true"></div>
        <p>Loading data...</p>
      </div>
    `);
    
    // Hide the canvas/container temporarily
    container.style.display = 'none';
  }

  /**
   * Show empty state when no data available
   * 
   * @param {string} containerId - ID of chart container element
   * @param {string} message - Custom message (optional)
   */
  function showEmptyState(containerId, message = 'No data available') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container not found: ${containerId}`);
      return;
    }

    // Remove loading state if present
    const loadingState = container.previousElementSibling;
    if (loadingState && loadingState.classList.contains('chart-loading-state')) {
      loadingState.remove();
    }

    container.innerHTML = '';
    container.insertAdjacentHTML('beforebegin', `
      <div class="chart-empty-state" role="status" aria-live="polite">
        <svg class="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="M3 3v18h18"></path>
          <path d="M18 17V9"></path>
          <path d="M13 17V5"></path>
          <path d="M8 17v-3"></path>
        </svg>
        <h3>No Data Available</h3>
        <p>${message}</p>
        <p class="help-text">Check back later or <a href="mailto:support@riksdagsmonitor.com">contact support</a>.</p>
      </div>
    `);
    
    container.style.display = 'none';
  }

  /**
   * Show error state when data loading fails
   * 
   * @param {string} containerId - ID of chart container element
   * @param {string} error - Error message
   */
  function showErrorState(containerId, error = 'Failed to load data') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container not found: ${containerId}`);
      return;
    }

    // Remove loading state if present
    const loadingState = container.previousElementSibling;
    if (loadingState && loadingState.classList.contains('chart-loading-state')) {
      loadingState.remove();
    }

    container.innerHTML = '';
    container.insertAdjacentHTML('beforebegin', `
      <div class="chart-error-state" role="alert" aria-live="assertive">
        <svg class="error-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>Error Loading Data</h3>
        <p>${error}</p>
        <button class="retry-button" onclick="location.reload()">Retry</button>
      </div>
    `);
    
    container.style.display = 'none';
  }

  /**
   * Hide empty/loading/error states and show chart
   * 
   * @param {string} containerId - ID of chart container element
   */
  function hideStateOverlays(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Remove all state overlays
    const states = ['chart-loading-state', 'chart-empty-state', 'chart-error-state'];
    states.forEach(stateClass => {
      const element = container.previousElementSibling;
      if (element && element.classList.contains(stateClass)) {
        element.remove();
      }
    });

    // Show the container
    container.style.display = '';
  }

  // ============================================================================
  // ACCESSIBILITY HELPERS
  // ============================================================================

  /**
   * Add keyboard navigation to chart canvas
   * 
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {Chart} chart - Chart.js instance
   */
  function addKeyboardNavigation(canvas, chart) {
    let currentDataPointIndex = 0;
    
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('role', 'img');
    
    canvas.addEventListener('keydown', (e) => {
      const datasetLength = chart.data.datasets[0].data.length;
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        currentDataPointIndex = (currentDataPointIndex + 1) % datasetLength;
        announceDataPoint(chart, currentDataPointIndex);
        highlightDataPoint(chart, currentDataPointIndex);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        currentDataPointIndex = (currentDataPointIndex - 1 + datasetLength) % datasetLength;
        announceDataPoint(chart, currentDataPointIndex);
        highlightDataPoint(chart, currentDataPointIndex);
      }
    });
  }

  /**
   * Announce data point to screen readers
   * 
   * @param {Chart} chart - Chart.js instance
   * @param {number} index - Data point index
   */
  function announceDataPoint(chart, index) {
    const label = chart.data.labels[index];
    const value = chart.data.datasets[0].data[index];
    const announcement = `${label}: ${formatNumber(value)}`;
    
    // Create or update live region
    let liveRegion = document.getElementById('chart-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'chart-live-region';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    
    liveRegion.textContent = announcement;
  }

  /**
   * Highlight data point on chart (for keyboard navigation)
   * 
   * @param {Chart} chart - Chart.js instance
   * @param {number} index - Data point index
   */
  function highlightDataPoint(chart, index) {
    // Trigger tooltip programmatically
    chart.tooltip.setActiveElements([{datasetIndex: 0, index: index}]);
    chart.update();
  }

  // ============================================================================
  // FORMATTING UTILITIES
  // ============================================================================

  /**
   * Format number with Swedish locale (thousands separator)
   * 
   * @param {number} value - Number to format
   * @param {number} decimals - Number of decimal places (default: 0)
   * @returns {string} Formatted number
   */
  function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    
    return value.toLocaleString('sv-SE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Format percentage
   * 
   * @param {number} value - Number to format as percentage
   * @returns {string} Formatted percentage
   */
  function formatPercent(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    
    return value.toLocaleString('sv-SE', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  }

  // ============================================================================
  // PERFORMANCE UTILITIES
  // ============================================================================

  /**
   * Debounce function for performance optimization
   * 
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Create debounced resize handler for chart updates
   * 
   * @param {Chart[]} charts - Array of Chart.js instances
   * @returns {Function} Debounced resize handler
   */
  function createResizeHandler(charts) {
    return debounce(() => {
      const isMobile = window.innerWidth < BREAKPOINTS.tablet;
      
      charts.forEach(chart => {
        if (chart && chart.options && chart.options.plugins && chart.options.plugins.legend) {
          chart.options.plugins.legend.position = isMobile ? 'bottom' : 'top';
          chart.update();
        }
      });
    }, 250);
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Deep merge objects
   * 
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  function deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  /**
   * Check if value is an object
   * 
   * @param {*} item - Value to check
   * @returns {boolean} True if object
   */
  function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  window.ChartUtils = {
    // Configuration
    THEME_COLORS,
    BREAKPOINTS,
    
    // Responsive options
    getResponsiveOptions,
    
    // State management
    showLoadingState,
    showEmptyState,
    showErrorState,
    hideStateOverlays,
    
    // Accessibility
    addKeyboardNavigation,
    announceDataPoint,
    
    // Formatting
    formatNumber,
    formatPercent,
    
    // Performance
    debounce,
    createResizeHandler
  };

})(window);
