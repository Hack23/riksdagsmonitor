/**
 * @module OSINT/DataAcquisition
 * @category Intelligence Platform - Data Collection
 * 
 * @description
 * **Dynamic Political Intelligence Statistics Loader**
 * 
 * Core OSINT data acquisition module for the Riksdagsmonitor Intelligence Platform.
 * Implements automated statistical intelligence collection from the CIA Platform
 * (Citizen Intelligence Agency) production database exports.
 * 
 * ## Intelligence Methodology
 * 
 * This module implements **systematic intelligence collection** following OSINT best practices:
 * - **Source Authority**: Direct database exports from CIA Platform (verified source)
 * - **Data Freshness**: Nightly updates ensure 24-hour maximum staleness
 * - **Data Integrity**: CSV parsing with validation and error handling
 * - **Fallback Strategy**: Local-first with remote fallback for resilience
 * 
 * ## Data Source Intelligence
 * 
 * **Primary Source**: `extraction_summary_report.csv` (CIA Platform ETL report)
 * - **Columns**: object_type, object_name, status, row_count, error_message, extraction_time
 * - **Scope**: 349 MPs, 8 parties, 50+ years of parliamentary data
 * - **Update Frequency**: Nightly automated ETL pipeline
 * - **Data Coverage**: Votes, documents, committees, government proposals, risk violations
 * 
 * ## OSINT Collection Strategy
 * 
 * 1. **Local-First Acquisition**: Attempt local cached data (cia-data/)
 * 2. **Remote Fallback**: GitHub raw content as backup source
 * 3. **Validation**: Parse and verify data structure before use
 * 4. **Error Resilience**: Graceful degradation if sources unavailable
 * 
 * ## Intelligence Metrics Tracked
 * 
 * **Hero Statistics** (Homepage dashboard):
 * - Historical political figures (person_data)
 * - Total recorded votes (view_riksdagen_vote_data_ballot_politician_summary)
 * - Parliamentary documents (document_data)
 * - Rule violations detected (rule_violation)
 * - Government proposals (view_riksdagen_goverment_proposals)
 * - Committee decisions (view_riksdagen_committee_decisions)
 * 
 * **Detailed Intelligence** (Analysis sections):
 * - Committee activities and proposals
 * - Document lifecycle tracking
 * - Party membership and voting blocs
 * - Government role assignments
 * - Ballot summaries and voting patterns
 * 
 * ## GDPR Compliance
 * 
 * @gdpr Political data processing compliant with Article 9(2)(e) - "manifestly made public"
 * All data sourced from official Riksdag public records and parliamentary proceedings.
 * No personal data beyond public official roles.
 * 
 * ## Security Architecture
 * 
 * @risk Low - Read-only data acquisition from public sources
 * @security CSP-compliant fetch operations, no user input, XSS-safe number formatting
 * 
 * @author Hack23 AB - Intelligence Platform Team
 * @license Apache-2.0
 * @version 1.0.0
 * @since 2024
 * 
 * @see {@link https://github.com/Hack23/cia|CIA Platform Data Source}
 * @see {@link https://data.riksdagen.se|Riksdag Open Data API}
 */

(function () {
  'use strict';

  /**
   * @constant {string} REMOTE_CSV
   * @description
   * Remote OSINT data source URL (CIA Platform GitHub repository)
   * Used as fallback when local cached data is unavailable.
   * 
   * @intelligence Backup source for resilient data acquisition
   */
  const REMOTE_CSV = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/extraction_summary_report.csv';
  
  /**
   * @constant {string} LOCAL_CSV
   * @description
   * Local cached OSINT data path for faster load times and offline resilience.
   * Primary source in local-first acquisition strategy.
   * 
   * @intelligence Primary source with sub-second response time
   */
  const LOCAL_CSV = 'cia-data/extraction_summary_report.csv';

  /**
   * @constant {Object.<string, string>} STAT_MAPPINGS
   * @description
   * Intelligence metric mapping: DOM identifier → CIA database object name
   * 
   * Each entry connects a UI statistic element to its authoritative data source
   * in the CIA Platform extraction report. This mapping ensures traceability
   * from displayed intelligence to source data.
   * 
   * @property {string} stat-historical-persons - Total political figures tracked
   * @property {string} stat-total-votes - Comprehensive voting record count
   * @property {string} stat-total-documents - Parliamentary document archive size
   * @property {string} stat-rule-violations - Detected anomalies and rule breaches
   * @property {string} stat-government-proposals - Executive branch legislative initiatives
   * @property {string} stat-committee-decisions - Committee-level decision tracking
   * 
   * @intelligence Maps UI intelligence indicators to authoritative database sources
   * @osint Single source of truth principle - all metrics traceable to CIA Platform
   */
  const STAT_MAPPINGS = {
    // Hero stats
    'stat-historical-persons':    'person_data',
    'stat-total-votes':           'view_riksdagen_vote_data_ballot_politician_summary',
    'stat-total-documents':       'document_data',
    'stat-rule-violations':       'rule_violation',
    'stat-government-proposals':  'view_riksdagen_goverment_proposals',
    'stat-committee-decisions':   'view_riksdagen_committee_decisions',

    // Intelligence section stats
    'stat-committee-documents':   'view_riksdagen_committee_decision_type_summary',
    'stat-document-activities':   'view_riksdagen_document_type_daily_summary',
    'stat-riksdag-parties':       'view_riksdagen_party',
    'stat-against-proposals':     'view_riksdagen_vote_data_ballot_summary',
    'stat-committee-proposals':   'view_riksdagen_committee_decision_type_org_summary',
    'stat-government-roles':      'view_riksdagen_goverment_roles',
    'stat-government-role-members': 'view_riksdagen_goverment_role_member',
    'stat-member-proposals':      'view_riksdagen_person_signed_document_summary',
    'stat-committee-role-members': 'view_riksdagen_committee_role_member',
    'stat-party-members':         'view_riksdagen_party_member',
    'stat-party-summary':         'view_riksdagen_party_summary',
    'stat-ballot-summaries':      'view_riksdagen_vote_data_ballot_party_summary',
    'stat-political-parties':     'sweden_political_party',
    'stat-assignments':           'assignment_data',
    'stat-document-attachments':  'document_attachment',
  };

  /**
   * @function fetchCSV
   * @async
   * @category OSINT Data Acquisition
   * 
   * @description
   * Multi-source CSV fetch with intelligent fallback strategy.
   * Implements **resilient OSINT collection** by attempting local cached data first,
   * then falling back to remote GitHub source if local is unavailable.
   * 
   * ## Intelligence Collection Strategy
   * 
   * 1. **Primary**: Local cached data (cia-data/ directory)
   *    - Advantage: Sub-second response, offline capability
   *    - Source: Nightly automated data pipeline
   * 
   * 2. **Fallback**: Remote GitHub raw content
   *    - Advantage: Always available, continuously updated
   *    - Source: CIA Platform master branch
   * 
   * ## Validation Logic
   * 
   * - HTTP 200 response required
   * - Non-empty text content
   * - Minimum 3 lines (header + 2 data rows) for validity
   * 
   * @returns {Promise<string|null>} CSV text content or null if all sources fail
   * 
   * @throws {Error} Silently catches and logs fetch errors, continues to next source
   * 
   * @intelligence Implements source redundancy for intelligence platform availability
   * @osint Local-first acquisition reduces dependency on external network
   * 
   * @example
   * const csvData = await fetchCSV();
   * if (csvData) {
   *   const intelligence = parseCSV(csvData);
   *   updateDashboard(intelligence);
   * }
   */
  async function fetchCSV() {
    const urls = [LOCAL_CSV, REMOTE_CSV];
    for (const url of urls) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const text = await resp.text();
        if (text && text.trim().split('\n').length > 2) {
          return text;
        }
      } catch (_) {
        // try next URL
      }
    }
    return null;
  }

  /**
   * @function parseCSV
   * @category Data Transformation
   * 
   * @description
   * Lightweight CSV parser for intelligence data transformation.
   * Converts raw CSV text into structured intelligence objects for analysis.
   * 
   * ## Parsing Logic
   * 
   * 1. Split text into lines (newline-delimited)
   * 2. Extract header row (first line defines schema)
   * 3. Parse data rows (comma-separated values)
   * 4. Map values to header keys for object creation
   * 
   * ## Data Integrity
   * 
   * - Handles empty cells gracefully
   * - Trims whitespace from all values
   * - Returns empty array if invalid input
   * 
   * @param {string} text - Raw CSV text content
   * @returns {Array<Object>} Array of intelligence data objects with properties matching CSV headers
   * 
   * @intelligence Transforms unstructured OSINT data into analyzable intelligence format
   * 
   * @example
   * const csvText = "object_name,row_count,status\nperson_data,45678,success";
   * const data = parseCSV(csvText);
   * // Returns: [{ object_name: 'person_data', row_count: '45678', status: 'success' }]
   */
  function parseCSV(text) {
    if (!text) return [];
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] ? values[i].trim() : '';
      });
      return obj;
    });
  }

  /**
   * @function updateStat
   * @category UI Intelligence Display
   * 
   * @description
   * Updates all DOM elements displaying a specific intelligence metric.
   * Implements **multi-element synchronization** to ensure consistency across
   * hero statistics, dashboard panels, and intelligence sections.
   * 
   * ## Update Strategy
   * 
   * 1. **Number Formatting**: Locale-aware formatting with thousands separators
   *    - Raw: 45678 → Display: "45,678"
   * 2. **Multi-Element**: Updates both ID-based and data-attribute selectors
   *    - `<span id="stat-total-votes">...</span>`
   *    - `<span data-stat-id="stat-total-votes">...</span>`
   * 3. **Safe Updates**: Validates value before DOM manipulation
   * 
   * ## Intelligence Display Principles
   * 
   * - **Readability**: Human-friendly number formatting
   * - **Consistency**: Same metric shown identically across UI
   * - **Accessibility**: Text content updates for screen readers
   * 
   * @param {string} identifier - Stat identifier (matches data-stat-id attribute or element ID)
   * @param {number|string} value - Intelligence metric value to display
   * 
   * @returns {void}
   * 
   * @intelligence Ensures intelligence metrics are displayed consistently across platform
   * @accessibility Updates textContent for screen reader compatibility
   * 
   * @example
   * updateStat('stat-total-votes', 1234567);
   * // Updates all elements: <span id="stat-total-votes">1,234,567</span>
   * // And: <span data-stat-id="stat-total-votes">1,234,567</span>
   */
  function updateStat(identifier, value) {
    if (value === null || value === undefined) return;

    // Format numbers with locale separators
    let displayValue = value;
    if (typeof value === 'number') {
      displayValue = value.toLocaleString();
    } else if (typeof value === 'string') {
      const normalized = value.replace(/[,.\s]/g, '');
      if (/^[0-9]+$/.test(normalized)) {
        displayValue = Number(normalized).toLocaleString();
      }
    }

    // Update by ID
    const elById = document.getElementById(identifier);
    if (elById) {
      elById.textContent = displayValue;
    }

    // Update ALL elements with matching data-stat-id attribute
    const elements = document.querySelectorAll(`[data-stat-id="${identifier}"]`);
    elements.forEach(el => {
      el.textContent = displayValue;
    });
  }

  /**
   * @function loadStats
   * @async
   * @category Intelligence Platform Initialization
   * 
   * @description
   * **Master Intelligence Statistics Loader**
   * 
   * Orchestrates the complete intelligence data acquisition, parsing, and display pipeline.
   * This is the main entry point for populating the platform with real-time political
   * intelligence metrics from the CIA Platform database.
   * 
   * ## Intelligence Pipeline
   * 
   * ```
   * 1. ACQUISITION  → fetchCSV() - Multi-source data retrieval
   * 2. PARSING      → parseCSV() - CSV to structured objects
   * 3. VALIDATION   → Filter by status === 'success'
   * 4. MAPPING      → Apply STAT_MAPPINGS lookup
   * 5. DISPLAY      → updateStat() for each metric
   * ```
   * 
   * ## Data Validation
   * 
   * Only processes extraction records with:
   * - `status === 'success'` (successful ETL extraction)
   * - Non-empty `object_name` (valid data source identifier)
   * - Non-empty `row_count` (actual metric value)
   * 
   * ## Intelligence Quality Control
   * 
   * - Logs successful load with update count
   * - Warns on fetch failures (graceful degradation)
   * - Tracks coverage: updated stats / total mapped stats
   * 
   * @returns {Promise<void>} Completes when all intelligence metrics are updated
   * 
   * @throws {Error} Catches and logs all errors, never crashes platform
   * 
   * @intelligence Implements end-to-end intelligence data pipeline with error resilience
   * @osint Single source of truth from CIA Platform extraction report
   * 
   * @example
   * // Automatically called on DOMContentLoaded
   * await loadStats();
   * // Console: "✅ Stats loaded from extraction_summary_report.csv (24/24 stats updated)"
   */
  async function loadStats() {
    try {
      const csvText = await fetchCSV();
      if (!csvText) {
        console.warn('Stats loader: could not fetch extraction_summary_report.csv');
        return;
      }

      const rows = parseCSV(csvText);
      if (rows.length === 0) {
        console.warn('Stats loader: CSV parsed but no data rows found');
        return;
      }

      // Build lookup: object_name → row_count (only successful extractions)
      const lookup = {};
      for (const row of rows) {
        if (row.status === 'success' && row.object_name && row.row_count) {
          lookup[row.object_name] = parseInt(row.row_count, 10);
        }
      }

      // Update all mapped stats
      let updated = 0;
      for (const [statId, objectName] of Object.entries(STAT_MAPPINGS)) {
        if (objectName in lookup) {
          updateStat(statId, lookup[objectName]);
          updated++;
        }
      }

      console.log(`✅ Stats loaded from extraction_summary_report.csv (${updated}/${Object.keys(STAT_MAPPINGS).length} stats updated)`);
    } catch (error) {
      console.warn('Stats loader error:', error.message);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadStats);
  } else {
    loadStats();
  }
})();
