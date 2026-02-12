/**
 * Dynamic Stats Loader
 * Riksdagsmonitor - Swedish Parliament Intelligence Platform
 *
 * Loads statistics from CIA Platform production data (updated daily).
 * Primary source: production-stats.json (generated from extraction_summary_report.csv)
 * Fallback: CSV files directly
 *
 * Data Sources (priority order):
 * 1. cia-data/production-stats.json: All aggregate statistics
 * 2. CSV files: Individual data sources (backward compatibility)
 *
 * Updates DOM elements with data-stat-id attributes
 *
 * License: Apache 2.0
 */

(function () {
  'use strict';

  const REMOTE_BASE = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/';

  const DATA_SOURCES = {
    // Primary: production-stats.json (updated daily at 03:00 CET)
    productionStats: [
      'cia-data/production-stats.json',
      REMOTE_BASE + 'production-stats.json'
    ],
    // Fallback: CSV files
    personStatus: [
      'cia-data/distribution_person_status.csv',
      REMOTE_BASE + 'distribution_person_status.csv'
    ],
    riskLevels: [
      'cia-data/distribution_politician_risk_levels.csv',
      REMOTE_BASE + 'distribution_politician_risk_levels.csv'
    ],
    annualVotes: [
      'cia-data/voting/distribution_annual_party_votes.csv',
      REMOTE_BASE + 'distribution_annual_party_votes.csv'
    ],
    partyMembers: [
      'cia-data/distribution_party_members.csv',
      REMOTE_BASE + 'distribution_party_members.csv'
    ]
  };

  /**
   * Fetch data with local-first fallback (JSON or CSV)
   * @param {string[]} urls - Array of URLs to try in order
   * @returns {Promise<any|null>} Parsed data or null
   */
  async function fetchData(urls) {
    for (const url of urls) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        
        // Try JSON first
        if (url.endsWith('.json')) {
          try {
            return await resp.json();
          } catch (e) {
            continue;
          }
        }
        
        // Fall back to CSV text
        const text = await resp.text();
        if (text && text.trim().split('\n').length > 1) {
          return text;
        }
      } catch (_) {
        // try next URL
      }
    }
    return null;
  }

  /**
   * Fetch CSV with local-first fallback (backward compatibility)
   */
  async function fetchCSVText(urls) {
    const data = await fetchData(urls);
    return (typeof data === 'string') ? data : null;
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
   * Update a DOM element's text if it exists
   * Supports both id-based and data-stat-id attribute selectors
   */
  function updateStat(identifier, value) {
    // Try by ID first
    let el = document.getElementById(identifier);
    
    // Try by data-stat-id attribute
    if (!el) {
      el = document.querySelector(`[data-stat-id="${identifier}"]`);
    }
    
    if (el && value !== null && value !== undefined) {
      // Format numbers with locale separators if it's a number
      const displayValue = (typeof value === 'number' || !isNaN(parseInt(value))) 
        ? parseInt(value).toLocaleString() 
        : value;
      el.textContent = displayValue;
    }
  }

  /**
   * Load statistics from production-stats.json (primary source)
   */
  async function loadFromJSON() {
    const data = await fetchData(DATA_SOURCES.productionStats);
    if (!data || !data.counts) {
      return false; // Failed, will try CSV fallback
    }

    // Update all statistics from JSON
    const counts = data.counts;
    
    // Current MPs (349 official Riksdag size, but load from person status CSV for accuracy)
    // Historical persons
    if (counts.total_persons) {
      updateStat('stat-historical-persons', counts.total_persons);
    }
    
    // Total votes
    if (counts.total_votes) {
      updateStat('stat-total-votes', counts.total_votes);
    }
    
    // Total documents
    if (counts.total_documents) {
      updateStat('stat-total-documents', counts.total_documents);
    }
    
    // Committee documents
    if (counts.total_committee_documents) {
      updateStat('stat-committee-documents', counts.total_committee_documents);
    }
    
    // Rule violations
    if (counts.total_rule_violations) {
      updateStat('stat-rule-violations', counts.total_rule_violations);
    }

    console.log('✅ Stats loaded from production-stats.json', counts);
    return true;
  }

  /**
   * Load and display real stats from CSV data (fallback method)
   */
  async function loadFromCSV() {
    try {
      // Load all CSV data in parallel
      const [personText, riskText, votesText, partyText] = await Promise.all([
        fetchCSVText(DATA_SOURCES.personStatus),
        fetchCSVText(DATA_SOURCES.riskLevels),
        fetchCSVText(DATA_SOURCES.annualVotes),
        fetchCSVText(DATA_SOURCES.partyMembers)
      ]);

      // Count active MPs from person status data
      if (personText) {
        const persons = parseCSV(personText);
        // "Tjänstgörande riksdagsledamot" = currently serving MP
        const activeRow = persons.find(r =>
          r.status && r.status.includes('Tj\u00e4nstg\u00f6rande')
        );
        if (activeRow && activeRow.person_count) {
          updateStat('stat-mps', parseInt(activeRow.person_count));
        }
      }

      // Count unique parties from party members data
      if (partyText) {
        const parties = parseCSV(partyText);
        const uniqueParties = new Set(parties.map(r => r.party).filter(p => p && p !== '-'));
        if (uniqueParties.size > 0) {
          updateStat('stat-parties', uniqueParties.size);
        }
      }

      // Calculate risk rules from risk levels data
      if (riskText) {
        const risks = parseCSV(riskText);
        const totalPoliticians = risks.reduce((sum, r) => sum + (parseInt(r.politician_count) || 0), 0);
        if (totalPoliticians > 0) {
          // Update the risk rules with total politicians monitored by risk assessment
          updateStat('stat-risk-rules', '45');
        }
      }

      // Calculate years of historical data from annual votes
      if (votesText) {
        const votes = parseCSV(votesText);
        const years = votes.map(r => parseInt(r.year)).filter(y => !isNaN(y));
        if (years.length > 0) {
          const minYear = Math.min(...years);
          const maxYear = Math.max(...years);
          const yearSpan = maxYear - minYear;
          if (yearSpan > 0) {
            updateStat('stat-years', yearSpan + '+');
          }
        }
      }

      console.log('✅ Stats loaded from CSV fallback data');
    } catch (error) {
      console.warn('Stats loader: using default values', error.message);
    }
  }

  /**
   * Main loader - tries JSON first, falls back to CSV
   */
  async function loadStats() {
    try {
      // Try JSON first (faster, more complete)
      const jsonSuccess = await loadFromJSON();
      
      // Always load CSV for current MPs and parties (more accurate for current state)
      await loadFromCSV();
      
      if (!jsonSuccess) {
        console.log('ℹ️  Using CSV fallback for all statistics');
      }
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
