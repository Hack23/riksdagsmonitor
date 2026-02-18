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

    // Build loading state overlay safely using DOM APIs
    const loadingState = document.createElement('div');
    loadingState.className = 'chart-loading-state';
    loadingState.setAttribute('role', 'status');
    loadingState.setAttribute('aria-live', 'polite');
    loadingState.setAttribute('aria-label', 'Loading chart data');

    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.setAttribute('aria-hidden', 'true');

    const message = document.createElement('p');
    message.textContent = 'Loading data...';

    loadingState.appendChild(spinner);
    loadingState.appendChild(message);

    // Insert before the container
    if (container.parentNode) {
      container.parentNode.insertBefore(loadingState, container);
    }
    
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

    // Build empty state overlay safely using DOM APIs
    const emptyState = document.createElement('div');
    emptyState.className = 'chart-empty-state';
    emptyState.setAttribute('role', 'status');
    emptyState.setAttribute('aria-live', 'polite');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'empty-icon');
    svg.setAttribute('width', '64');
    svg.setAttribute('height', '64');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');

    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M3 3v18h18');
    svg.appendChild(path1);

    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', 'M18 17V9');
    svg.appendChild(path2);

    const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path3.setAttribute('d', 'M13 17V5');
    svg.appendChild(path3);

    const path4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path4.setAttribute('d', 'M8 17v-3');
    svg.appendChild(path4);

    const heading = document.createElement('h3');
    heading.textContent = 'No Data Available';

    const messagePara = document.createElement('p');
    // Use textContent to avoid injecting untrusted HTML
    messagePara.textContent = message;

    const helpText = document.createElement('p');
    helpText.className = 'help-text';
    helpText.textContent = 'Check back later or ';
    
    const contactLink = document.createElement('a');
    contactLink.href = 'mailto:support@riksdagsmonitor.com';
    contactLink.textContent = 'contact support';
    helpText.appendChild(contactLink);
    helpText.appendChild(document.createTextNode('.'));

    emptyState.appendChild(svg);
    emptyState.appendChild(heading);
    emptyState.appendChild(messagePara);
    emptyState.appendChild(helpText);

    // Insert before the container
    if (container.parentNode) {
      container.parentNode.insertBefore(emptyState, container);
    }
    
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

    // Build error state overlay safely using DOM APIs
    const errorState = document.createElement('div');
    errorState.className = 'chart-error-state';
    errorState.setAttribute('role', 'alert');
    errorState.setAttribute('aria-live', 'assertive');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'error-icon');
    svg.setAttribute('width', '64');
    svg.setAttribute('height', '64');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    svg.appendChild(circle);

    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '12');
    line1.setAttribute('y1', '8');
    line1.setAttribute('x2', '12');
    line1.setAttribute('y2', '12');
    svg.appendChild(line1);

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '12');
    line2.setAttribute('y1', '16');
    line2.setAttribute('x2', '12.01');
    line2.setAttribute('y2', '16');
    svg.appendChild(line2);

    const heading = document.createElement('h3');
    heading.textContent = 'Error Loading Data';

    const messagePara = document.createElement('p');
    // Use textContent to avoid injecting untrusted HTML
    messagePara.textContent = error;

    const retryButton = document.createElement('button');
    retryButton.className = 'retry-button';
    retryButton.textContent = 'Retry';
    // Attach click handler programmatically to avoid inline event handlers
    retryButton.addEventListener('click', function() {
      window.location.reload();
    });

    errorState.appendChild(svg);
    errorState.appendChild(heading);
    errorState.appendChild(messagePara);
    errorState.appendChild(retryButton);

    // Insert before the container
    if (container.parentNode) {
      container.parentNode.insertBefore(errorState, container);
    }
    
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
    // Guard for disabled tooltips
    const tooltip = chart.tooltip;
    if (!tooltip) {
      return;
    }

    const meta = chart.getDatasetMeta(0);
    const element = meta && meta.data && meta.data[index];
    if (!element) {
      return;
    }

    // Determine tooltip position for Chart.js v4
    const position = typeof element.tooltipPosition === 'function'
      ? element.tooltipPosition()
      : { x: element.x, y: element.y };

    // Trigger tooltip programmatically with position
    tooltip.setActiveElements(
      [{ datasetIndex: 0, index: index }],
      position
    );
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
