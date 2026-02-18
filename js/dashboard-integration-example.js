/**
 * @module DashboardIntegration
 * @category Example - How to Integrate ChartUtils into Existing Dashboards
 * 
 * @description
 * **Example Pattern for Integrating ChartUtils into Dashboard Files**
 * 
 * This file demonstrates the pattern for updating existing dashboard JavaScript
 * files to use the new ChartUtils module for:
 * - Responsive Chart.js configuration
 * - Empty/loading/error states
 * - Accessibility features
 * - Performance optimization
 * 
 * ## Integration Steps
 * 
 * 1. **Add Loading State**: Show loading indicator before data fetch
 * 2. **Handle Empty Data**: Display user-friendly empty state
 * 3. **Handle Errors**: Show error state with retry option
 * 4. **Use Responsive Options**: Apply ChartUtils.getResponsiveOptions()
 * 5. **Add Keyboard Nav**: Enable keyboard navigation for charts
 * 6. **Add Resize Handler**: Create debounced resize handler
 * 
 * ## Before (Original Code)
 * 
 * ```javascript
 * function createChart(data) {
 *   const ctx = document.getElementById('myChart');
 *   
 *   new Chart(ctx, {
 *     type: 'bar',
 *     data: {
 *       labels: data.labels,
 *       datasets: [{
 *         label: 'My Dataset',
 *         data: data.values
 *       }]
 *     },
 *     options: {
 *       responsive: true,
 *       // ... basic options
 *     }
 *   });
 * }
 * ```
 * 
 * ## After (With ChartUtils)
 * 
 * ```javascript
 * function createChart(data) {
 *   const ctx = document.getElementById('myChart');
 *   
 *   // Hide loading state
 *   ChartUtils.hideStateOverlays('myChart');
 *   
 *   // Handle empty data
 *   if (!data || data.values.length === 0) {
 *     ChartUtils.showEmptyState('myChart', 'No data available for selected period');
 *     return;
 *   }
 *   
 *   // Create chart with responsive options
 *   const chart = new Chart(ctx, {
 *     type: 'bar',
 *     data: {
 *       labels: data.labels,
 *       datasets: [{
 *         label: 'My Dataset',
 *         data: data.values,
 *         backgroundColor: ChartUtils.THEME_COLORS.cyan
 *       }]
 *     },
 *     options: ChartUtils.getResponsiveOptions('bar', {
 *       plugins: {
 *         tooltip: {
 *           callbacks: {
 *             label: (context) => {
 *               return `${context.dataset.label}: ${ChartUtils.formatNumber(context.parsed.y)}`;
 *             }
 *           }
 *         }
 *       }
 *     })
 *   });
 *   
 *   // Add keyboard navigation
 *   ChartUtils.addKeyboardNavigation(ctx, chart);
 * }
 * 
 * // Main initialization function
 * async function initDashboard() {
 *   // Show loading state
 *   ChartUtils.showLoadingState('myChart');
 *   
 *   try {
 *     // Fetch data
 *     const data = await fetchData();
 *     
 *     // Create chart
 *     createChart(data);
 *     
 *   } catch (error) {
 *     // Show error state
 *     ChartUtils.showErrorState('myChart', error.message);
 *   }
 * }
 * 
 * // Add resize handler
 * const charts = [];
 * window.addEventListener('resize', ChartUtils.createResizeHandler(charts));
 * ```
 * 
 * @author Hack23 AB - Political Intelligence Team
 * @license Apache-2.0
 * @version 1.0.0
 * @since 2026
 */

// =============================================================================
// EXAMPLE 1: Simple Bar Chart with Empty State Handling
// =============================================================================

function example1_SimpleBarChart() {
  const containerId = 'example1Chart';
  
  // Step 1: Show loading state
  ChartUtils.showLoadingState(containerId);
  
  // Step 2: Fetch data (simulated)
  setTimeout(() => {
    const data = {
      labels: ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'],
      values: [25, 20, 18, 12, 10, 7, 5, 3]
    };
    
    // Step 3: Hide loading state
    ChartUtils.hideStateOverlays(containerId);
    
    // Step 4: Handle empty data
    if (!data || data.values.length === 0) {
      ChartUtils.showEmptyState(containerId, 'No party data available');
      return;
    }
    
    // Step 5: Create chart with responsive options
    const ctx = document.getElementById(containerId);
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Party Votes (%)',
          data: data.values,
          backgroundColor: ChartUtils.THEME_COLORS.cyan
        }]
      },
      options: ChartUtils.getResponsiveOptions('bar')
    });
    
    // Step 6: Add keyboard navigation
    ChartUtils.addKeyboardNavigation(ctx, chart);
  }, 1000);
}

// =============================================================================
// EXAMPLE 2: Line Chart with Error Handling
// =============================================================================

function example2_LineChartWithError() {
  const containerId = 'example2Chart';
  
  // Show loading state
  ChartUtils.showLoadingState(containerId);
  
  // Simulate data fetch with error
  setTimeout(() => {
    const hasError = Math.random() > 0.5; // 50% chance of error
    
    if (hasError) {
      // Show error state
      ChartUtils.showErrorState(containerId, 'Failed to load data from CIA Platform');
      return;
    }
    
    // Success: create chart
    ChartUtils.hideStateOverlays(containerId);
    
    const ctx = document.getElementById(containerId);
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['2020', '2021', '2022', '2023', '2024', '2025', '2026'],
        datasets: [{
          label: 'Legislative Activity',
          data: [120, 135, 150, 142, 158, 165, 170],
          borderColor: ChartUtils.THEME_COLORS.magenta,
          backgroundColor: 'rgba(255, 0, 110, 0.1)',
          tension: 0.4
        }]
      },
      options: ChartUtils.getResponsiveOptions('line')
    });
    
    ChartUtils.addKeyboardNavigation(ctx, chart);
  }, 1500);
}

// =============================================================================
// EXAMPLE 3: Multiple Charts with Resize Handler
// =============================================================================

function example3_MultipleChartsWithResize() {
  const charts = [];
  
  // Create multiple charts
  ['chart1', 'chart2', 'chart3'].forEach((id, index) => {
    ChartUtils.showLoadingState(id);
    
    setTimeout(() => {
      ChartUtils.hideStateOverlays(id);
      
      const ctx = document.getElementById(id);
      const chart = new Chart(ctx, {
        type: index === 0 ? 'bar' : index === 1 ? 'line' : 'doughnut',
        data: {
          labels: ['A', 'B', 'C', 'D'],
          datasets: [{
            label: `Dataset ${index + 1}`,
            data: [10, 20, 30, 40].map(v => v * (index + 1)),
            backgroundColor: [
              ChartUtils.THEME_COLORS.cyan,
              ChartUtils.THEME_COLORS.magenta,
              ChartUtils.THEME_COLORS.yellow,
              ChartUtils.THEME_COLORS.lightText
            ]
          }]
        },
        options: ChartUtils.getResponsiveOptions(
          index === 0 ? 'bar' : index === 1 ? 'line' : 'pie'
        )
      });
      
      charts.push(chart);
      ChartUtils.addKeyboardNavigation(ctx, chart);
    }, 1000 + (index * 500));
  });
  
  // Add resize handler for all charts
  window.addEventListener('resize', ChartUtils.createResizeHandler(charts));
}

// =============================================================================
// EXAMPLE 4: D3.js Heatmap with ChartUtils Colors
// =============================================================================

function example4_D3HeatmapWithThemeColors() {
  const containerId = 'example4Heatmap';
  
  ChartUtils.showLoadingState(containerId);
  
  setTimeout(() => {
    ChartUtils.hideStateOverlays(containerId);
    
    const container = d3.select(`#${containerId}`);
    const width = container.node().getBoundingClientRect().width;
    const height = 400;
    
    // Use ChartUtils theme colors for D3.js
    const colorScale = d3.scaleSequential()
      .domain([0, 100])
      .interpolator(d3.interpolateRgb(
        ChartUtils.THEME_COLORS.cyan,
        ChartUtils.THEME_COLORS.magenta
      ));
    
    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Risk assessment heatmap')
      .style('background', ChartUtils.THEME_COLORS.darkBg);
    
    // Create sample heatmap cells
    const data = d3.range(100).map(i => ({
      x: i % 10,
      y: Math.floor(i / 10),
      value: Math.random() * 100
    }));
    
    const cellSize = Math.min(width / 10, height / 10);
    
    svg.selectAll('rect')
      .data(data)
      .enter().append('rect')
      .attr('x', d => d.x * cellSize)
      .attr('y', d => d.y * cellSize)
      .attr('width', cellSize - 2)
      .attr('height', cellSize - 2)
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', ChartUtils.THEME_COLORS.darkBg)
      .attr('stroke-width', 2)
      .attr('tabindex', 0) // Keyboard accessibility
      .on('focus', function(event, d) {
        // Announce to screen readers
        ChartUtils.announceDataPoint({
          data: {
            labels: [`Cell ${d.x},${d.y}`],
            datasets: [{ data: [d.value] }]
          }
        }, 0);
      });
  }, 1000);
}

// =============================================================================
// EXAMPLE 5: Complete Dashboard Integration Pattern
// =============================================================================

(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    dataUrl: 'cia-data/example-data.csv',
    chartContainerIds: [
      'effectivenessChart',
      'comparisonChart',
      'momentumChart'
    ]
  };
  
  // Store chart instances
  let chartInstances = [];
  
  /**
   * Initialize dashboard
   */
  async function initDashboard() {
    // Show loading states for all charts
    CONFIG.chartContainerIds.forEach(id => {
      ChartUtils.showLoadingState(id);
    });
    
    try {
      // Fetch data
      const data = await fetchData();
      
      // Create charts
      createEffectivenessChart(data);
      createComparisonChart(data);
      createMomentumChart(data);
      
      // Setup resize handler
      window.addEventListener('resize', 
        ChartUtils.createResizeHandler(chartInstances)
      );
      
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      CONFIG.chartContainerIds.forEach(id => {
        ChartUtils.showErrorState(id, error.message);
      });
    }
  }
  
  /**
   * Fetch data from CIA Platform
   */
  async function fetchData() {
    const response = await fetch(CONFIG.dataUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch data`);
    }
    return await response.json();
  }
  
  /**
   * Create effectiveness chart
   */
  function createEffectivenessChart(data) {
    const containerId = 'effectivenessChart';
    ChartUtils.hideStateOverlays(containerId);
    
    if (!data || data.effectiveness.length === 0) {
      ChartUtils.showEmptyState(containerId, 'No effectiveness data available');
      return;
    }
    
    const ctx = document.getElementById(containerId);
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.effectiveness.map(d => d.year),
        datasets: [{
          label: 'Effectiveness Score',
          data: data.effectiveness.map(d => d.score),
          borderColor: ChartUtils.THEME_COLORS.cyan,
          backgroundColor: 'rgba(0, 217, 255, 0.1)',
          tension: 0.4
        }]
      },
      options: ChartUtils.getResponsiveOptions('line', {
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Score: ${ChartUtils.formatNumber(context.parsed.y, 1)}`;
              }
            }
          }
        }
      })
    });
    
    chartInstances.push(chart);
    ChartUtils.addKeyboardNavigation(ctx, chart);
  }
  
  /**
   * Create comparison chart
   */
  function createComparisonChart(data) {
    const containerId = 'comparisonChart';
    ChartUtils.hideStateOverlays(containerId);
    
    if (!data || data.comparison.length === 0) {
      ChartUtils.showEmptyState(containerId, 'No comparison data available');
      return;
    }
    
    const ctx = document.getElementById(containerId);
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.comparison.map(d => d.party),
        datasets: [{
          label: 'Performance',
          data: data.comparison.map(d => d.performance),
          backgroundColor: ChartUtils.THEME_COLORS.parties['S'] // Example: use party colors
        }]
      },
      options: ChartUtils.getResponsiveOptions('bar')
    });
    
    chartInstances.push(chart);
    ChartUtils.addKeyboardNavigation(ctx, chart);
  }
  
  /**
   * Create momentum chart
   */
  function createMomentumChart(data) {
    const containerId = 'momentumChart';
    ChartUtils.hideStateOverlays(containerId);
    
    if (!data || data.momentum.length === 0) {
      ChartUtils.showEmptyState(containerId, 'No momentum data available');
      return;
    }
    
    const ctx = document.getElementById(containerId);
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.momentum.map(d => d.party),
        datasets: [{
          label: 'Momentum',
          data: data.momentum.map(d => d.score),
          backgroundColor: [
            ChartUtils.THEME_COLORS.cyan,
            ChartUtils.THEME_COLORS.magenta,
            ChartUtils.THEME_COLORS.yellow
          ]
        }]
      },
      options: ChartUtils.getResponsiveOptions('doughnut')
    });
    
    chartInstances.push(chart);
    ChartUtils.addKeyboardNavigation(ctx, chart);
  }
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }
  
})();

// =============================================================================
// EXPORT FOR DOCUMENTATION
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    example1_SimpleBarChart,
    example2_LineChartWithError,
    example3_MultipleChartsWithResize,
    example4_D3HeatmapWithThemeColors
  };
}
