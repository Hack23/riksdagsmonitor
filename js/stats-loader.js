/**
 * Dynamic Stats Loader
 * Riksdagsmonitor - Swedish Parliament Intelligence Platform
 *
 * Loads ALL statistics directly from extraction_summary_report.csv
 * (CIA Platform production database export, updated nightly).
 *
 * Data Source:
 *   extraction_summary_report.csv — columns: object_type, object_name, status, row_count, error_message, extraction_time
 *   Each row represents a database table or view with its current row count.
 *
 * The CSV is the single source of truth. No JSON intermediary.
 * Hero stats and intelligence section stats are populated from this CSV.
 *
 * Updates DOM elements with data-stat-id attributes.
 *
 * License: Apache 2.0
 */

(function () {
  'use strict';

  const REMOTE_CSV = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/extraction_summary_report.csv';
  const LOCAL_CSV = 'cia-data/extraction_summary_report.csv';

  /**
   * Mapping from data-stat-id attribute → object_name in extraction_summary_report.csv
   * Each entry: stat DOM identifier → CSV object_name whose row_count provides the value
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
    'stat-government-proposals':  'view_riksdagen_goverment_proposals',
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
   * Fetch CSV text from local path first, then remote
   * @returns {Promise<string|null>} CSV text or null
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
   * Simple CSV parser (header + rows)
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
   * Update ALL DOM elements matching an identifier
   * Supports both id-based and data-stat-id attribute selectors
   * Uses querySelectorAll to update ALL matching elements (e.g. hero stats + intelligence section)
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
   * Load statistics from extraction_summary_report.csv
   * Parses CSV, builds lookup by object_name, and updates all mapped DOM elements
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
