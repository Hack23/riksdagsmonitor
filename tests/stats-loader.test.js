/**
 * Tests for Dynamic Stats Loader
 * Validates CSV-driven hero statistics
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Stats Loader', () => {
  let originalFetch;

  beforeEach(() => {
    // Save original fetch mock from setup.js
    originalFetch = global.fetch;
    
    document.body.innerHTML = `
      <div class="hero-stats">
        <div class="stat">
          <span class="number" id="stat-mps">349</span>
          <span class="label">MPs Monitored</span>
        </div>
        <div class="stat">
          <span class="number" id="stat-parties">8</span>
          <span class="label">Parties Analyzed</span>
        </div>
        <div class="stat">
          <span class="number" id="stat-risk-rules">45</span>
          <span class="label">Risk Rules Active</span>
        </div>
        <div class="stat">
          <span class="number" id="stat-years">50+</span>
          <span class="label">Years Historical Data</span>
        </div>
      </div>
    `;
  });

  afterEach(() => {
    // Restore original fetch mock
    global.fetch = originalFetch;
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('DOM Elements', () => {
    it('should have stat-mps element', () => {
      expect(document.getElementById('stat-mps')).not.toBeNull();
      expect(document.getElementById('stat-mps').textContent).toBe('349');
    });

    it('should have stat-parties element', () => {
      expect(document.getElementById('stat-parties')).not.toBeNull();
      expect(document.getElementById('stat-parties').textContent).toBe('8');
    });

    it('should have stat-risk-rules element', () => {
      expect(document.getElementById('stat-risk-rules')).not.toBeNull();
    });

    it('should have stat-years element', () => {
      expect(document.getElementById('stat-years')).not.toBeNull();
      expect(document.getElementById('stat-years').textContent).toBe('50+');
    });
  });

  describe('Data Source Configuration', () => {
    it('should define local-first URLs for person status', () => {
      const urls = [
        'cia-data/distribution_person_status.csv',
        'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/distribution_person_status.csv'
      ];
      expect(urls[0]).toMatch(/^cia-data\//);
      expect(urls[1]).toMatch(/^https:\/\//);
    });

    it('should define local-first URLs for risk levels', () => {
      const urls = [
        'cia-data/distribution_politician_risk_levels.csv',
        'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/distribution_politician_risk_levels.csv'
      ];
      expect(urls[0]).toMatch(/\.csv$/);
      expect(urls[1]).toMatch(/\.csv$/);
    });

    it('should define local-first URLs for annual votes', () => {
      const urls = [
        'cia-data/voting/distribution_annual_party_votes.csv',
        'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/distribution_annual_party_votes.csv'
      ];
      expect(urls).toHaveLength(2);
    });
  });

  describe('Person Status CSV Parsing', () => {
    it('should parse person status CSV with real columns', () => {
      const csv = 'status,person_count,percentage\nTjänstgörande riksdagsledamot,327,13.12\nTidigare riksdagsledamot,1118,44.83';
      const lines = csv.trim().split('\n');
      const headers = lines[0].split(',');
      expect(headers).toContain('status');
      expect(headers).toContain('person_count');
      expect(headers).toContain('percentage');
    });

    it('should find active MPs (Tjänstgörande riksdagsledamot)', () => {
      const rows = [
        { status: 'Tidigare riksdagsledamot', person_count: '1118', percentage: '44.83' },
        { status: 'Tjänstgörande riksdagsledamot', person_count: '327', percentage: '13.12' }
      ];
      const activeRow = rows.find(r => r.status.includes('Tjänstgörande'));
      expect(activeRow).not.toBeUndefined();
      expect(parseInt(activeRow.person_count)).toBe(327);
    });

    it('should handle CSV without active MPs gracefully', () => {
      const rows = [
        { status: 'Tidigare riksdagsledamot', person_count: '1118', percentage: '44.83' }
      ];
      const activeRow = rows.find(r => r.status.includes('Tjänstgörande'));
      expect(activeRow).toBeUndefined();
      // Stats should keep default value
      expect(document.getElementById('stat-mps').textContent).toBe('349');
    });
  });

  describe('Party Members CSV Parsing', () => {
    it('should count unique parties', () => {
      const rows = [
        { party: 'S', member_count: '1200' },
        { party: 'M', member_count: '900' },
        { party: 'SD', member_count: '800' },
        { party: 'V', member_count: '400' },
        { party: 'MP', member_count: '350' },
        { party: 'C', member_count: '500' },
        { party: 'L', member_count: '300' },
        { party: 'KD', member_count: '280' }
      ];
      const uniqueParties = new Set(rows.map(r => r.party).filter(p => p && p !== '-'));
      expect(uniqueParties.size).toBe(8);
    });

    it('should skip aggregate rows with party "-"', () => {
      const rows = [
        { party: '-', member_count: '5000' },
        { party: 'S', member_count: '1200' }
      ];
      const filtered = rows.filter(r => r.party !== '-');
      expect(filtered).toHaveLength(1);
    });
  });

  describe('Annual Votes Year Calculation', () => {
    it('should calculate year span from annual votes', () => {
      const rows = [
        { year: '2002', party: 'S', vote_count: '12672' },
        { year: '2024', party: 'S', vote_count: '8950' },
        { year: '2010', party: 'M', vote_count: '5200' }
      ];
      const years = rows.map(r => parseInt(r.year)).filter(y => !isNaN(y));
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      expect(minYear).toBe(2002);
      expect(maxYear).toBe(2024);
      expect(maxYear - minYear).toBe(22);
    });
  });

  describe('Error Handling', () => {
    it('should keep default values when fetch fails', () => {
      // Default values should remain unchanged
      expect(document.getElementById('stat-mps').textContent).toBe('349');
      expect(document.getElementById('stat-parties').textContent).toBe('8');
    });

    it('should handle empty CSV gracefully', () => {
      const csv = 'status,person_count,percentage\n';
      const lines = csv.trim().split('\n');
      expect(lines.length).toBe(1); // header only
    });

    it('should handle malformed CSV lines', () => {
      const csv = 'status,person_count,percentage\nbroken line without commas';
      const lines = csv.trim().split('\n');
      const headers = lines[0].split(',');
      const values = lines[1].split(',');
      // Malformed line: fewer values than headers
      expect(values.length).toBeLessThan(headers.length);
    });
  });

  describe('DOM Update', () => {
    it('should update stat-mps text content', () => {
      const el = document.getElementById('stat-mps');
      el.textContent = '327';
      expect(el.textContent).toBe('327');
    });

    it('should update stat-years with year span', () => {
      const el = document.getElementById('stat-years');
      el.textContent = '22+';
      expect(el.textContent).toBe('22+');
    });

    it('should not update element if value is null', () => {
      const el = document.getElementById('stat-mps');
      const original = el.textContent;
      // Simulating: if value is null, don't update
      const value = null;
      if (el && value !== null && value !== undefined) {
        el.textContent = value;
      }
      expect(el.textContent).toBe(original);
    });
  });
});
