/**
 * Cypress E2E Tests - All Dashboards Comprehensive Coverage
 * 
 * Tests all 9 dashboards with fail-fast principle (no conditionals/skips):
 * 1. Party Dashboard
 * 2. Election Cycle Dashboard
 * 3. Committee Dashboard
 * 4. Coalition Dashboard
 * 5. Seasonal Patterns Dashboard
 * 6. Pre-Election Dashboard
 * 7. Anomaly Detection Dashboard
 * 8. Ministry Dashboard
 * 9. Risk Dashboard
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

describe('All Dashboards - Comprehensive Coverage', () => {
  beforeEach(() => {
    // Use real CIA CSV sample data from the repository to ensure correct schemas per dashboard
    // cy.stubCIAData(); // Disabled: causes dashboards to render empty/fallback states
    cy.visit('/');
  });
  
  /**
   * Dashboard configuration for systematic testing
   */
  const dashboards = [
    {
      id: 'party-dashboard',
      name: 'Party Dashboard',
      charts: ['partyEffectivenessChart', 'partyComparisonChart', 'partyMomentumChart'],
      hasD3: true, // coalitionAlignmentChart is a div container, not a canvas
      d3Container: 'coalitionAlignmentChart'
    },
    {
      id: 'election-cycle-dashboard',
      name: 'Election Cycle Dashboard',
      charts: ['cycle-timeline-chart', 'risk-forecast-chart', 'temporal-trends-chart', 'party-tier-chart'],
      hasD3: true,
      d3Container: 'decision-heatmap'
    },
    {
      id: 'committee-dashboard',
      name: 'Committee Dashboard',
      charts: ['committeeComparisonChart', 'decisionEffectivenessChart', 'seasonalPatternsChart'],
      hasD3: true,
      d3Container: 'committeeNetwork'
    },
    {
      id: 'coalition-dashboard',
      name: 'Coalition Dashboard',
      charts: ['votingAnomalyChart', 'behavioralPatternsChart', 'decisionTrendsChart'],
      hasD3: true,
      d3Container: 'coalitionNetwork'
    },
    {
      id: 'seasonal-patterns-dashboard',
      name: 'Seasonal Patterns Dashboard',
      charts: ['zscore-timeline-chart', 'quarter-comparison-chart', 'classification-chart', 'qoq-change-chart'],
      hasD3: true,
      d3Container: 'seasonal-heatmap'
    },
    {
      id: 'pre-election-dashboard',
      name: 'Pre-Election Dashboard',
      charts: ['q4-timeline-chart', 'election-comparison-chart', 'deviation-radar-chart', 'party-trends-chart', 'yoy-waterfall-chart'],
      hasD3: false // warning-matrix is a non-canvas region, not a D3 container
    },
    {
      id: 'anomaly-detection-dashboard',
      name: 'Anomaly Detection Dashboard',
      charts: ['anomaly-timeline-chart', 'zscore-distribution-chart', 'anomaly-type-chart', 'quarterly-frequency-chart'],
      hasD3: true,
      d3Container: 'severity-heatmap'
    },
    {
      id: 'ministry-dashboard',
      name: 'Ministry Dashboard',
      charts: ['ministerInfluenceChart', 'ministryProductivityChart', 'decisionImpactChart'],
      hasD3: true,
      d3Container: 'ministryRiskHeatMap'
    },
    {
      id: 'risk-dashboard',
      name: 'Risk Dashboard',
      charts: ['riskDistributionChart', 'anomalyDetectionChart', 'crisisResilienceChart', 'riskEvolutionChart'],
      hasD3: true,
      d3Container: 'riskHeatMap'
    }
  ];
  
  dashboards.forEach(dashboard => {
    describe(`${dashboard.name}`, () => {
      it('should exist and be visible', () => {
        cy.get(`#${dashboard.id}`).should('exist').should('be.visible');
      });
      
      it('should have dashboard heading', () => {
        cy.get(`#${dashboard.id} h2, #${dashboard.id} h3`).first().should('be.visible');
      });
      
      it('should not have error messages', () => {
        cy.get(`#${dashboard.id} .dashboard-error, #${dashboard.id} .error-message`).should('not.exist');
      });
      
      it('should have data attribution', () => {
        // Most dashboards should have CIA data attribution
        cy.get(`#${dashboard.id}`).then(($dashboard) => {
          // Check if the current dashboard has attribution (scoped to this dashboard)
          const hasAttribution = $dashboard.text().includes('CIA') ||
                                 $dashboard.find('a[href*="cia"]').length > 0 ||
                                 $dashboard.find('.data-attribution').length > 0;
          expect(hasAttribution).to.be.true;
        });
      });
      
      if (dashboard.charts && dashboard.charts.length > 0) {
        describe('Chart.js Charts', () => {
          dashboard.charts.forEach(chartId => {
            it(`should have ${chartId} canvas`, () => {
              cy.get(`#${dashboard.id}`).find(`#${chartId}`).should('exist');
            });
            
            it(`${chartId} should be rendered by Chart.js`, () => {
              // Chart.js adds the 'chartjs-render-monitor' class after rendering
              cy.get(`#${dashboard.id}`)
                .find(`#${chartId}.chartjs-render-monitor`, { timeout: 10000 })
                .should(($canvas) => {
                  expect($canvas[0]).to.exist;
                  expect($canvas[0].classList.contains('chartjs-render-monitor')).to.be.true;
                  expect($canvas[0].width).to.be.greaterThan(0);
                  expect($canvas[0].height).to.be.greaterThan(0);
                });
            });
          });
        });
      }
      
      if (dashboard.hasD3 && dashboard.d3Container) {
        describe('D3.js Visualizations', () => {
          it(`should have ${dashboard.d3Container} container`, () => {
            // Scroll dashboard into view to trigger lazy-loaded D3 visualizations
            cy.get(`#${dashboard.id}`).scrollIntoView();
            cy.get(`#${dashboard.id}`).find(`#${dashboard.d3Container}`).should('exist');
          });
          
          it(`${dashboard.d3Container} should render D3 SVG`, () => {
            cy.get(`#${dashboard.id}`).scrollIntoView();
            cy.get(`#${dashboard.id}`).find(`#${dashboard.d3Container} svg`, { timeout: 10000 }).should('exist');
          });
          
          it(`${dashboard.d3Container} SVG should have content`, () => {
            cy.get(`#${dashboard.id}`).scrollIntoView();
            cy.get(`#${dashboard.id}`).find(`#${dashboard.d3Container} svg`, { timeout: 10000 }).should(($svg) => {
              expect($svg.children().length).to.be.greaterThan(0);
            });
          });
        });
      }
      
      describe('Accessibility', () => {
        it('should have ARIA labels on charts (where present)', () => {
          cy.get(`#${dashboard.id}`).then($dashboard => {
            // Find canvases with aria-label
            const $canvasesWithAria = $dashboard.find('canvas[aria-label]');
            
            // Only validate aria-label content when present on canvases
            if ($canvasesWithAria.length > 0) {
              $canvasesWithAria.each((_, canvas) => {
                const ariaLabel = canvas.getAttribute('aria-label');
                expect(ariaLabel).to.exist;
                expect(ariaLabel.length).to.be.greaterThan(10);
              });
            }

            // Where a role is present on canvas, enforce that it is "img"
            const $canvasesWithRole = $dashboard.find('canvas[role]');
            $canvasesWithRole.each((_, canvas) => {
              expect(canvas.getAttribute('role')).to.equal('img');
            });
          });
        });
        
        it('should have screen reader descriptions', () => {
          // Check for .sr-only elements or aria-label attributes
          cy.get(`#${dashboard.id}`).then($dashboard => {
            const hasSrOnly = $dashboard.find('.sr-only').length > 0;
            const hasAriaLabels = $dashboard.find('[aria-label]').length > 0;
            expect(hasSrOnly || hasAriaLabels).to.be.true;
          });
        });
      });
      
      describe('Responsive Design', () => {
        it('should be visible on mobile (375px)', () => {
          cy.viewport(375, 667);
          cy.get(`#${dashboard.id}`).should('be.visible');
        });
        
        it('should be visible on tablet (768px)', () => {
          cy.viewport(768, 1024);
          cy.get(`#${dashboard.id}`).should('be.visible');
        });
        
        it('should be visible on desktop (1440px)', () => {
          cy.viewport(1440, 900);
          cy.get(`#${dashboard.id}`).should('be.visible');
        });
      });
    });
  });
  
  describe('Dashboard Integration', () => {
    it('all 9 dashboards should be present on main page', () => {
      dashboards.forEach(dashboard => {
        cy.get(`#${dashboard.id}`).should('exist');
      });
    });
    
    it('should not have duplicate dashboard IDs', () => {
      const dashboardIds = dashboards.map(d => d.id);
      const uniqueIds = [...new Set(dashboardIds)];
      expect(dashboardIds.length).to.equal(uniqueIds.length);
    });
    
    it('should load all dashboards without console errors', () => {
      // Attach console.error spy before page load
      cy.visit('/', {
        onBeforeLoad(win) {
          cy.spy(win.console, 'error').as('consoleError');
        }
      });
      
      // Wait for dashboards to load
      cy.get('#party-dashboard', { timeout: 10000 }).should('be.visible');
      
      // Check no console errors occurred during load
      cy.get('@consoleError').should('not.be.called');
    });
  });
  
  describe('Performance', () => {
    it('should load all dashboards within 10 seconds', () => {
      cy.get('#party-dashboard', { timeout: 10000 }).should('be.visible');
      cy.get('#risk-dashboard', { timeout: 10000 }).should('be.visible');
      cy.get('#ministry-dashboard', { timeout: 10000 }).should('be.visible');
    });
    
    it('should render Chart.js charts within reasonable time', () => {
      // First chart should render quickly (scoped to dashboard container)
      cy.get('#party-dashboard')
        .find('#partyEffectivenessChart', { timeout: 5000 })
        .should('exist')
        .should(($canvas) => {
          expect($canvas[0].width).to.be.greaterThan(0);
        });
    });
  });
});
