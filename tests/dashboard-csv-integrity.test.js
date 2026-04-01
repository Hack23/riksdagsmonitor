/**
 * Dashboard-CSV Data Integrity Tests
 *
 * Validates that every dashboard module has valid CSV data files
 * in the cia-data directory structure. Ensures no dashboard references
 * empty or missing CSV files.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

const CIA_DATA_DIR = resolve(process.cwd(), 'cia-data');

/**
 * Dashboard-to-CSV dependency map.
 * Each dashboard lists the CSV files it requires (relative to cia-data/).
 * All listed files must exist AND contain at least one data row (not just headers).
 */
const DASHBOARD_CSV_DEPENDENCIES = {
  // ─── Main Page Dashboards (index.html, loaded via main.ts) ──────────────────

  'stats-loader': {
    module: 'src/browser/dashboards/stats-loader.ts',
    csvFiles: [
      'extraction_summary_report.csv'
    ]
  },

  'party-dashboard': {
    module: 'src/browser/dashboards/party-dashboard.ts',
    csvFiles: [
      'party/distribution_party_performance.csv',
      'party/distribution_party_effectiveness_trends.csv',
      'party/distribution_party_momentum.csv',
      'party/distribution_coalition_alignment.csv',
      'party/distribution_annual_party_members.csv',
      'party/distribution_annual_party_votes.csv'
    ]
  },

  'election-cycle': {
    module: 'src/browser/dashboards/election-cycle.ts',
    csvFiles: [
      'election-cycle/view_election_cycle_comparative_analysis_sample.csv',
      'election-cycle/view_election_cycle_decision_intelligence_sample.csv',
      'election-cycle/view_election_cycle_predictive_intelligence_sample.csv',
      'election-cycle/view_election_cycle_temporal_trends_sample.csv'
    ]
  },

  'committees-dashboard': {
    module: 'src/browser/dashboards/committees-dashboard.ts',
    csvFiles: [
      'distribution_committee_productivity_matrix.csv',
      'view_riksdagen_committee_decisions.csv',
      'distribution_annual_committee_documents.csv',
      'view_riksdagen_committee_ballot_decision_party_summary.csv',
      'percentile_seasonal_activity_patterns.csv'
    ]
  },

  'coalition-dashboard': {
    module: 'src/browser/dashboards/coalition-dashboard.ts',
    csvFiles: [
      'party/distribution_coalition_alignment.csv',
      'parties/distribution_behavioral_patterns_by_party.csv',
      'parties/distribution_decision_patterns_by_party.csv',
      'anomaly/distribution_anomaly_by_party.csv',
      'voting/distribution_annual_party_votes.csv',
      'voting/distribution_decision_trends.csv',
      'distribution_party_momentum.csv'
    ]
  },

  'seasonal-patterns': {
    module: 'src/browser/dashboards/seasonal-patterns.ts',
    csvFiles: [
      'seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv'
    ]
  },

  'pre-election': {
    module: 'src/browser/dashboards/pre-election.ts',
    csvFiles: [
      'pre-election/view_riksdagen_pre_election_quarterly_activity_sample.csv',
      'pre-election/view_riksdagen_q4_election_year_comparison_sample.csv'
    ]
  },

  'anomaly-detection': {
    module: 'src/browser/dashboards/anomaly-detection.ts',
    csvFiles: [
      'seasonal/view_riksdagen_seasonal_anomaly_detection_sample.csv'
    ]
  },

  'ministry-dashboard': {
    module: 'src/browser/dashboards/ministry-dashboard.ts',
    csvFiles: [
      'ministry/distribution_ministry_risk_levels.csv',
      'ministry/distribution_ministry_productivity_matrix.csv',
      'ministry/distribution_ministry_decision_impact.csv',
      'ministry/distribution_ministry_effectiveness.csv',
      'ministry/distribution_ministry_risk_quarterly.csv'
    ]
  },

  'risk-dashboard': {
    module: 'src/browser/dashboards/risk-dashboard.ts',
    csvFiles: [
      'politician/view_politician_risk_summary_sample.csv'
    ]
  },

  'politician-dashboard': {
    module: 'src/browser/dashboards/politician-dashboard.ts',
    csvFiles: [
      'politician/view_politician_risk_summary_sample.csv',
      'politician/view_riksdagen_politician_influence_metrics_sample.csv',
      'politician/view_politician_behavioral_trends_sample.csv',
      'politician/distribution_experience_levels.csv',
      'politician/distribution_influence_buckets.csv',
      'politician/distribution_assignment_roles.csv'
    ]
  },

  // ─── CIA Dashboard (dashboard/index*.html, loaded via cia-entry.ts) ─────────

  'cia-dashboard': {
    module: 'src/browser/cia/data-loader.ts',
    csvFiles: [
      'distribution_person_status.csv',
      'distribution_risk_by_party.csv',
      'distribution_politician_risk_levels.csv',
      'voting/distribution_annual_ballots.csv',
      'risk/distribution_crisis_resilience.csv',
      'party/distribution_party_performance.csv',
      'party/view_party_performance_metrics_sample.csv',
      'party/distribution_party_momentum.csv',
      'party/distribution_annual_party_members.csv',
      'politician/view_riksdagen_politician_influence_metrics_sample.csv',
      'politician/view_politician_risk_summary_sample.csv',
      'committee/distribution_committee_productivity.csv',
      'committee/distribution_committee_activity.csv',
      'party/distribution_party_effectiveness_trends.csv',
      'election/election_forecast.csv',
      'election/coalition_scenarios.csv',
      'party/distribution_coalition_alignment.csv',
      'party/distribution_gender_by_party.csv',
      'party/distribution_experience_by_party.csv',
      'ministry/distribution_ministry_effectiveness.csv',
      'voting/distribution_annual_document_types.csv',
      'voting/distribution_decision_trends.csv',
      'election/distribution_election_regions.csv',
      'view_riksdagen_goverment_role_member_sample.csv',
      'distribution_risk_evolution_temporal.csv',
      'party/distribution_behavioral_patterns_by_party.csv'
    ]
  }
};

/**
 * Count data rows in a CSV file (excluding header)
 */
function countDataRows(filePath) {
  const content = readFileSync(filePath, 'utf-8').trim();
  const lines = content.split('\n');
  return lines.length - 1; // Subtract header row
}

describe('Dashboard-CSV Data Integrity', () => {

  describe('All dashboard CSV files exist', () => {
    Object.entries(DASHBOARD_CSV_DEPENDENCIES).forEach(([dashboardName, config]) => {
      describe(dashboardName, () => {
        config.csvFiles.forEach(csvFile => {
          it(`should have ${csvFile}`, () => {
            const filePath = resolve(CIA_DATA_DIR, csvFile);
            expect(existsSync(filePath), `Dashboard "${dashboardName}" requires ${csvFile} but file not found`).toBe(true);
          });
        });
      });
    });
  });

  describe('All dashboard CSV files have data rows (not just headers)', () => {
    Object.entries(DASHBOARD_CSV_DEPENDENCIES).forEach(([dashboardName, config]) => {
      describe(dashboardName, () => {
        config.csvFiles.forEach(csvFile => {
          it(`${csvFile} should have at least 1 data row`, () => {
            const filePath = resolve(CIA_DATA_DIR, csvFile);
            if (!existsSync(filePath)) return; // Covered by existence tests

            const dataRows = countDataRows(filePath);
            expect(dataRows, `Dashboard "${dashboardName}" requires ${csvFile} but file has 0 data rows (header-only)`).toBeGreaterThanOrEqual(1);
          });
        });
      });
    });
  });

  describe('Dashboard module files exist', () => {
    Object.entries(DASHBOARD_CSV_DEPENDENCIES).forEach(([dashboardName, config]) => {
      it(`${dashboardName} module should exist at ${config.module}`, () => {
        const modulePath = resolve(process.cwd(), config.module);
        expect(existsSync(modulePath), `Dashboard module not found: ${config.module}`).toBe(true);
      });
    });
  });

  describe('No orphaned dashboard HTML containers (main page)', () => {
    const DASHBOARD_CONTAINER_IDS = [
      'party-dashboard',
      'election-cycle-dashboard',
      'committee-dashboard',
      'coalition-dashboard',
      'seasonal-patterns-dashboard',
      'pre-election-dashboard',
      'anomaly-detection-dashboard',
      'ministry-dashboard',
      'risk-dashboard'
    ];

    const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');

    DASHBOARD_CONTAINER_IDS.forEach(containerId => {
      it(`index.html should have container #${containerId}`, () => {
        expect(indexHtml).toContain(`id="${containerId}"`);
      });
    });
  });

  describe('CIA dashboard HTML files exist for all 14 languages', () => {
    const languages = ['', '_ar', '_da', '_de', '_es', '_fi', '_fr', '_he', '_ja', '_ko', '_nl', '_no', '_sv', '_zh'];

    languages.forEach(suffix => {
      const filename = `dashboard/index${suffix}.html`;
      it(`should have ${filename}`, () => {
        const filePath = resolve(process.cwd(), filename);
        expect(existsSync(filePath), `Missing CIA dashboard: ${filename}`).toBe(true);
      });
    });
  });

  describe('Main page HTML files exist for all 14 languages', () => {
    const languages = ['', '_ar', '_da', '_de', '_es', '_fi', '_fr', '_he', '_ja', '_ko', '_nl', '_no', '_sv', '_zh'];

    languages.forEach(suffix => {
      const filename = suffix === '' ? 'index.html' : `index${suffix}.html`;
      it(`should have ${filename}`, () => {
        const filePath = resolve(process.cwd(), filename);
        expect(existsSync(filePath), `Missing main page: ${filename}`).toBe(true);
      });
    });
  });

  describe('CSV data quality summary', () => {
    it('should report all empty/header-only CSV files in cia-data', () => {
      const emptyFiles = [];

      function scanDir(dir) {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath);
          } else if (entry.name.endsWith('.csv')) {
            const rows = countDataRows(fullPath);
            if (rows === 0) {
              emptyFiles.push(fullPath.replace(CIA_DATA_DIR + '/', ''));
            }
          }
        }
      }

      scanDir(CIA_DATA_DIR);

      // Log empty files for visibility but don't fail the test
      // Empty CSV files are acceptable if they are not referenced by any dashboard
      if (emptyFiles.length > 0) {
        console.log(`\n⚠️ Empty/header-only CSV files (${emptyFiles.length}):`);
        emptyFiles.forEach(f => console.log(`  - ${f}`));
      }

      // Verify that no dashboard-referenced CSV is in the empty list
      const dashboardCsvs = new Set();
      Object.values(DASHBOARD_CSV_DEPENDENCIES).forEach(config => {
        config.csvFiles.forEach(csv => dashboardCsvs.add(csv));
      });

      const brokenDashboardCsvs = emptyFiles.filter(f => dashboardCsvs.has(f));
      expect(brokenDashboardCsvs, `Dashboard-referenced CSVs that are empty: ${brokenDashboardCsvs.join(', ')}`).toEqual([]);
    });
  });
});
