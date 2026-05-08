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
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const CIA_DATA_DIR = resolve(process.cwd(), 'cia-data');
// Static filenames keep the repository's legacy `_no` suffix for Norwegian;
// rendered `hreflang` attributes use BCP-47 `nb` and are validated elsewhere.
const LOCALIZED_FILE_SUFFIXES = ['', '_ar', '_da', '_de', '_es', '_fi', '_fr', '_he', '_ja', '_ko', '_nl', '_no', '_sv', '_zh'];
const LOCALIZED_STATIC_PAGE_SETS = [
  { base: 'index', directory: '.', label: 'main page' },
  { base: 'politician-dashboard', directory: '.', label: 'politician dashboard' },
  { base: 'political-intelligence', directory: '.', label: 'political intelligence' },
  { base: 'index', directory: 'dashboard', label: 'CIA dashboard' },
];

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
  if (content.length === 0) return 0;
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  return Math.max(0, lines.length - 1); // Subtract header row
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

  describe('No orphaned dashboard HTML containers (specialised dashboard pages)', () => {
    // Each dashboard now lives on its own /dashboards/<slug>.html page
    // (PR #2349). The container ID stays the same so JS lazy-loaders bind
    // unchanged; only the host page changes.
    const DASHBOARD_CONTAINERS = [
      { id: 'party-dashboard',              page: 'dashboards/parties.html' },
      { id: 'election-cycle-dashboard',     page: 'dashboards/election-cycle.html' },
      { id: 'committee-dashboard',          page: 'dashboards/committees.html' },
      { id: 'coalition-dashboard',          page: 'dashboards/coalitions.html' },
      { id: 'seasonal-patterns-dashboard',  page: 'dashboards/seasonal-patterns.html' },
      { id: 'pre-election-dashboard',       page: 'dashboards/pre-election.html' },
      { id: 'anomaly-detection-dashboard',  page: 'dashboards/anomaly-detection.html' },
      { id: 'ministry-dashboard',           page: 'dashboards/ministers.html' },
      { id: 'risk-dashboard',               page: 'dashboards/risk.html' },
    ];

    DASHBOARD_CONTAINERS.forEach(({ id, page }) => {
      it(`${page} should have container #${id}`, () => {
        const html = readFileSync(resolve(process.cwd(), page), 'utf-8');
        expect(html).toContain(`id="${id}"`);
      });
    });

    it('index.html should expose a hub linking to every specialised dashboard', () => {
      const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
      expect(indexHtml).toContain('id="political-intelligence-dashboards"');
      DASHBOARD_CONTAINERS.forEach(({ page }) => {
        expect(indexHtml).toContain(`href="${page}"`);
      });
    });
  });

  describe('Specialised dashboard pages exist for all 14 languages', () => {
    const DASHBOARD_SLUGS = [
      'parties', 'election-cycle', 'committees', 'coalitions',
      'seasonal-patterns', 'pre-election', 'anomaly-detection',
      'ministers', 'risk',
    ];
    const LANG_SUFFIXES = ['', '_ar', '_da', '_de', '_es', '_fi', '_fr',
      '_he', '_ja', '_ko', '_nl', '_no', '_sv', '_zh'];

    DASHBOARD_SLUGS.forEach(slug => {
      LANG_SUFFIXES.forEach(suffix => {
        const filename = `dashboards/${slug}${suffix}.html`;
        it(`should have ${filename}`, () => {
          expect(existsSync(resolve(process.cwd(), filename)),
            `Missing dashboard page: ${filename}`).toBe(true);
        });
      });
    });
  });

  describe('CIA dashboard HTML files exist for all 14 languages', () => {
    LOCALIZED_FILE_SUFFIXES.forEach(suffix => {
      const filename = `dashboard/index${suffix}.html`;
      it(`should have ${filename}`, () => {
        const filePath = resolve(process.cwd(), filename);
        expect(existsSync(filePath), `Missing CIA dashboard: ${filename}`).toBe(true);
      });
    });
  });

  describe('Main page HTML files exist for all 14 languages', () => {
    LOCALIZED_FILE_SUFFIXES.forEach(suffix => {
      const filename = suffix === '' ? 'index.html' : `index${suffix}.html`;
      it(`should have ${filename}`, () => {
        const filePath = resolve(process.cwd(), filename);
        expect(existsSync(filePath), `Missing main page: ${filename}`).toBe(true);
      });
    });
  });

  describe('Political Intelligence localized page coverage', () => {
    LOCALIZED_STATIC_PAGE_SETS.forEach(({ base, directory, label }) => {
      LOCALIZED_FILE_SUFFIXES.forEach(suffix => {
        const filename = `${base}${suffix}.html`;
        const relativePath = directory === '.' ? filename : `${directory}/${filename}`;
        const languageLabel = suffix === '' ? 'en (default)' : suffix.slice(1);

        it(`should have ${label} for ${languageLabel}`, () => {
          expect(existsSync(resolve(process.cwd(), relativePath)),
            `Missing localized ${label}: ${relativePath}`).toBe(true);
        });
      });
    });

    LOCALIZED_FILE_SUFFIXES.forEach(suffix => {
      const homepage = suffix === '' ? 'index.html' : `index${suffix}.html`;
      const piPage = suffix === '' ? 'political-intelligence.html' : `political-intelligence${suffix}.html`;

      it(`should promote Political Intelligence on ${homepage}`, () => {
        const content = readFileSync(resolve(process.cwd(), homepage), 'utf-8');
        expect(content).toContain('<section class="political-intelligence-cta"');
        expect(content).toContain(`href="${piPage}"`);
        expect(content).not.toContain('<nav class="political-intelligence-cta"');
      });

      it(`should hide decorative Political Intelligence CTA feature emojis on ${homepage}`, () => {
        const content = readFileSync(resolve(process.cwd(), homepage), 'utf-8');
        const match = content.match(/<ul class="political-intelligence-cta-features"[\s\S]*?<\/ul>/);
        expect(match, `Missing Political Intelligence CTA features in ${homepage}`).not.toBeNull();
        if (match === null) return;
        const features = match[0];
        expect(features).toContain('<span aria-hidden="true">🧭</span>');
        expect(features).toContain('<span aria-hidden="true">📚</span>');
        expect(features).toContain('<span aria-hidden="true">⚠️</span>');
        expect(features).toContain('<span aria-hidden="true">🔎</span>');
        ['<li>🧭', '<li>📚', '<li>⚠️', '<li>🔎'].forEach(rawEmojiListItem => {
          expect(features).not.toContain(rawEmojiListItem);
        });
      });
    });
  });

  describe('Dashboard CSV column validation', () => {
    /**
     * Critical column references per dashboard.
     * Each key must be present as a CSV header in at least one of the dashboard's CSV files.
     * These are the columns accessed via row['col'] or row.col in the TypeScript source.
     */
    const DASHBOARD_COLUMN_REQUIREMENTS = {
      'stats-loader': {
        columns: ['object_name', 'row_count', 'status'],
      },
      'party-dashboard': {
        columns: ['party', 'year', 'momentum', 'alignment_rate', 'party1', 'party2'],
      },
      'election-cycle': {
        columns: ['election_cycle_id', 'party', 'cycle_year', 'overall_performance_score', 'avg_approval_rate',
          'forecast_confidence', 'semester', 'total_ballots', 'is_pre_election_semester'],
      },
      'committees-dashboard': {
        columns: ['year', 'committee', 'committee_code', 'productivity_level', 'quarter'],
      },
      'coalition-dashboard': {
        columns: ['party', 'party1', 'party2', 'alignment_rate', 'behavioral_assessment',
          'anomaly_classification', 'avg_rebellions', 'politician_count', 'vote_count', 'year'],
      },
      'seasonal-patterns': {
        columns: ['quarter', 'total_ballots', 'attendance_rate', 'documents_produced',
          'ballot_z_score', 'doc_z_score', 'year', 'is_election_year', 'seasonal_pattern_classification'],
      },
      'pre-election': {
        columns: ['year', 'total_ballots', 'total_documents', 'is_election_year',
          'avg_party_win_rate', 'avg_party_absence_rate'],
      },
      'anomaly-detection': {
        columns: ['quarter', 'year', 'anomaly_severity', 'anomaly_type', 'max_z_score'],
      },
      'ministry-dashboard': {
        columns: ['ministry_name', 'documents_produced', 'risk_level', 'year',
          'ministry_code', 'committee', 'approval_rate', 'total_proposals'],
      },
      'risk-dashboard': {
        columns: ['party'],
      },
      'politician-dashboard': {
        columns: ['person_id', 'first_name', 'last_name', 'risk_level', 'risk_score',
          'experience_level', 'politician_count', 'influence_classification'],
      },
      'cia-dashboard': {
        columns: ['party', 'year', 'risk_level', 'politician_count', 'status',
          'alignment_rate', 'ministry_name', 'effectiveness_assessment'],
      },
    };

    /** Get CSV headers as an array */
    function getCsvHeaders(csvPath) {
      const fullPath = resolve(CIA_DATA_DIR, csvPath);
      if (!existsSync(fullPath)) return [];
      const content = readFileSync(fullPath, 'utf-8').trim();
      if (!content) return [];
      return content.split('\n')[0].split(',').map(h => h.trim().replace(/"/g, ''));
    }

    Object.entries(DASHBOARD_COLUMN_REQUIREMENTS).forEach(([dashboardName, { columns }]) => {
      describe(dashboardName, () => {
        // Get all CSV headers for this dashboard
        const dashConfig = DASHBOARD_CSV_DEPENDENCIES[dashboardName];
        if (!dashConfig) return;

        const allHeaders = new Set();
        dashConfig.csvFiles.forEach(csv => {
          getCsvHeaders(csv).forEach(h => allHeaders.add(h));
        });

        columns.forEach(col => {
          it(`should have column "${col}" in at least one CSV`, () => {
            expect(allHeaders.has(col),
              `Dashboard "${dashboardName}" accesses column "${col}" but no CSV has this header. Available: ${[...allHeaders].join(', ')}`
            ).toBe(true);
          });
        });
      });
    });
  });

  describe('Extraction summary row count validation', () => {
    const summaryPath = resolve(CIA_DATA_DIR, 'extraction_summary_report.csv');

    it('extraction_summary_report.csv should have at least 100 rows', () => {
      expect(existsSync(summaryPath)).toBe(true);
      const rows = countDataRows(summaryPath);
      // CIA extraction summary should contain both tables and views
      // Currently ~200 rows; use a lower bound to avoid brittle exact-count tests
      expect(rows).toBeGreaterThanOrEqual(100);
    });

    it('should contain view entries matching dashboard source views', () => {
      const content = readFileSync(summaryPath, 'utf-8');
      const viewNames = [
        'view_politician_risk_summary',
        'view_riksdagen_politician_influence_metrics',
        'view_party_effectiveness_trends',
        'view_riksdagen_party_momentum_analysis',
        'view_committee_productivity_matrix',
        'view_riksdagen_committee_decisions',
        'view_ministry_productivity_matrix',
        'view_ministry_decision_impact',
        'view_ministry_effectiveness_trends',
        'view_election_cycle_comparative_analysis',
        'view_election_cycle_decision_intelligence',
        'view_riksdagen_seasonal_activity_patterns',
        'view_riksdagen_seasonal_anomaly_detection',
        'view_riksdagen_pre_election_quarterly_activity',
        'view_decision_temporal_trends',
        'view_riksdagen_crisis_resilience_indicators',
      ];
      viewNames.forEach(view => {
        expect(content).toContain(view);
      });
    });

    it('all source views should have success status', () => {
      const lines = readFileSync(summaryPath, 'utf-8').trim().split('\n').slice(1);
      const viewNames = [
        'view_politician_risk_summary',
        'view_riksdagen_politician_influence_metrics',
        'view_party_effectiveness_trends',
        'view_riksdagen_party_momentum_analysis',
        'view_committee_productivity_matrix',
        'view_riksdagen_committee_decisions',
        'view_ministry_productivity_matrix',
        'view_ministry_decision_impact',
        'view_ministry_effectiveness_trends',
        'view_election_cycle_comparative_analysis',
        'view_election_cycle_decision_intelligence',
        'view_riksdagen_seasonal_activity_patterns',
        'view_riksdagen_seasonal_anomaly_detection',
        'view_riksdagen_pre_election_quarterly_activity',
        'view_decision_temporal_trends',
        'view_riksdagen_crisis_resilience_indicators',
      ];
      for (const line of lines) {
        const [, objName, status] = line.split(',');
        if (viewNames.includes(objName)) {
          expect(status, `View ${objName} should have success status`).toBe('success');
        }
      }
    });
  });

  describe('CSV data quality summary', () => {
    it('should report all empty/header-only CSV files in cia-data', () => {
      const emptyFiles = [];

      function collectEmptyCsvFiles(dir) {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            collectEmptyCsvFiles(fullPath);
          } else if (entry.name.endsWith('.csv')) {
            const rows = countDataRows(fullPath);
            if (rows === 0) {
              const relative = fullPath.substring(CIA_DATA_DIR.length + 1);
              emptyFiles.push(relative);
            }
          }
        }
      }

      collectEmptyCsvFiles(CIA_DATA_DIR);

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

      const referencedEmptyCsvs = emptyFiles.filter(f => dashboardCsvs.has(f));
      expect(referencedEmptyCsvs, `Dashboard-referenced CSVs that are empty: ${referencedEmptyCsvs.join(', ')}`).toEqual([]);
    });
  });
});
