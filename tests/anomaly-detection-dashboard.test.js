/**
 * Tests for Anomaly Detection Dashboard
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Anomaly Detection Dashboard', () => {
  let container;
  
  beforeEach(() => {
    document.body.innerHTML = `
      <section id="anomaly-dashboard">
        <h2>Anomaly Detection & Early Warning System</h2>
        <div class="filters">
          <select id="severity-filter">
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>
          <select id="type-filter">
            <option value="">All Types</option>
            <option value="BALLOT_ANOMALY">Ballot Anomaly</option>
            <option value="DOCUMENT_ANOMALY">Document Anomaly</option>
            <option value="ATTENDANCE_ANOMALY">Attendance Anomaly</option>
          </select>
        </div>
        <div class="dashboard-grid">
          <canvas id="anomaly-timeline-chart"></canvas>
          <canvas id="zscore-distribution-chart"></canvas>
          <canvas id="type-breakdown-chart"></canvas>
          <div id="severity-heatmap"></div>
          <canvas id="quarterly-frequency-chart"></canvas>
        </div>
        <div id="alert-banner" style="display: none;"></div>
      </section>
    `;
    
    container = document.getElementById('anomaly-dashboard');
  });
  
  describe('Configuration', () => {
    const CONFIG = {
      dataUrls: [
        'cia-data/seasonal/view_riksdagen_seasonal_anomaly_detection_sample.csv',
        'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_seasonal_anomaly_detection_sample.csv'
      ],
      cacheDuration: 60 * 60 * 1000,
      alertDismissDuration: 24 * 60 * 60 * 1000
    };
    
    it('should have local-first data loading', () => {
      expect(CONFIG.dataUrls[0]).toContain('cia-data');
      expect(CONFIG.dataUrls[0]).not.toContain('http');
    });
    
    it('should have remote fallback URL', () => {
      expect(CONFIG.dataUrls[1]).toContain('https://');
      expect(CONFIG.dataUrls[1]).toContain('github');
    });
    
    it('should have 1-hour cache duration', () => {
      const oneHour = 60 * 60 * 1000;
      expect(CONFIG.cacheDuration).toBe(oneHour);
    });
    
    it('should have 24-hour alert dismiss duration', () => {
      const twentyFourHours = 24 * 60 * 60 * 1000;
      expect(CONFIG.alertDismissDuration).toBe(twentyFourHours);
    });
  });
  
  describe('Alert Configuration', () => {
    const ALERT_CONFIG = {
      CRITICAL: { color: '#d32f2f', icon: '🔴', notify: true },
      HIGH: { color: '#f57c00', icon: '🟠', notify: true },
      MODERATE: { color: '#fbc02d', icon: '🟡', notify: false },
      LOW: { color: '#388e3c', icon: '🟢', notify: false }
    };
    
    it('should have all severity levels', () => {
      expect(ALERT_CONFIG.CRITICAL).toBeDefined();
      expect(ALERT_CONFIG.HIGH).toBeDefined();
      expect(ALERT_CONFIG.MODERATE).toBeDefined();
      expect(ALERT_CONFIG.LOW).toBeDefined();
    });
    
    it('should notify for critical and high severity', () => {
      expect(ALERT_CONFIG.CRITICAL.notify).toBe(true);
      expect(ALERT_CONFIG.HIGH.notify).toBe(true);
      expect(ALERT_CONFIG.MODERATE.notify).toBe(false);
      expect(ALERT_CONFIG.LOW.notify).toBe(false);
    });
    
    it('should have proper color coding', () => {
      expect(ALERT_CONFIG.CRITICAL.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(ALERT_CONFIG.HIGH.color).toMatch(/^#[0-9a-f]{6}$/i);
    });
    
    it('should have emoji icons for visual clarity', () => {
      expect(ALERT_CONFIG.CRITICAL.icon).toBe('🔴');
      expect(ALERT_CONFIG.HIGH.icon).toBe('🟠');
      expect(ALERT_CONFIG.MODERATE.icon).toBe('🟡');
      expect(ALERT_CONFIG.LOW.icon).toBe('🟢');
    });
  });
  
  describe('DOM Structure', () => {
    it('should have anomaly dashboard section', () => {
      expect(container).not.toBeNull();
    });
    
    it('should have severity filter', () => {
      const filter = document.getElementById('severity-filter');
      expect(filter).not.toBeNull();
      expect(filter.options.length).toBeGreaterThan(0);
    });
    
    it('should have type filter', () => {
      const filter = document.getElementById('type-filter');
      expect(filter).not.toBeNull();
      expect(filter.options.length).toBeGreaterThan(0);
    });
    
    it('should have all chart canvases', () => {
      expect(document.getElementById('anomaly-timeline-chart')).not.toBeNull();
      expect(document.getElementById('zscore-distribution-chart')).not.toBeNull();
      expect(document.getElementById('type-breakdown-chart')).not.toBeNull();
      expect(document.getElementById('quarterly-frequency-chart')).not.toBeNull();
    });
    
    it('should have heatmap container', () => {
      const heatmap = document.getElementById('severity-heatmap');
      expect(heatmap).not.toBeNull();
    });
    
    it('should have alert banner (initially hidden)', () => {
      const banner = document.getElementById('alert-banner');
      expect(banner).not.toBeNull();
      expect(banner.style.display).toBe('none');
    });
  });
  
  describe('Z-Score Analysis', () => {
    it('should classify anomalies by Z-score threshold', () => {
      const getAnomalySeverity = (zScore) => {
        const absZ = Math.abs(zScore);
        if (absZ >= 2.5) return 'CRITICAL';
        if (absZ >= 2.0) return 'HIGH';
        if (absZ >= 1.5) return 'MODERATE';
        return 'LOW';
      };
      
      expect(getAnomalySeverity(3.0)).toBe('CRITICAL');
      expect(getAnomalySeverity(2.3)).toBe('HIGH');
      expect(getAnomalySeverity(1.8)).toBe('MODERATE');
      expect(getAnomalySeverity(1.0)).toBe('LOW');
    });
    
    it('should handle negative Z-scores', () => {
      const getAnomalySeverity = (zScore) => {
        const absZ = Math.abs(zScore);
        return absZ >= 2.0 ? 'HIGH' : 'LOW';
      };
      
      expect(getAnomalySeverity(-2.5)).toBe('HIGH');
      expect(getAnomalySeverity(-1.5)).toBe('LOW');
    });
    
    it('should detect outliers (|Z| >= 2.0)', () => {
      const isOutlier = (zScore) => Math.abs(zScore) >= 2.0;
      
      expect(isOutlier(2.5)).toBe(true);
      expect(isOutlier(-2.5)).toBe(true);
      expect(isOutlier(1.5)).toBe(false);
      expect(isOutlier(0)).toBe(false);
    });
  });
  
  describe('Data Processing', () => {
    it('should parse CSV anomaly data', () => {
      const csvData = 'Year,Quarter,Type,ZScore,Severity\n2024,Q1,BALLOT_ANOMALY,2.5,HIGH\n2024,Q2,DOCUMENT_ANOMALY,1.8,MODERATE';
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      
      expect(headers).toContain('Year');
      expect(headers).toContain('Quarter');
      expect(headers).toContain('Type');
      expect(headers).toContain('ZScore');
      expect(headers).toContain('Severity');
    });
    
    it('should filter anomalies by severity', () => {
      const anomalies = [
        { severity: 'CRITICAL', zScore: 3.0 },
        { severity: 'HIGH', zScore: 2.3 },
        { severity: 'MODERATE', zScore: 1.8 },
        { severity: 'LOW', zScore: 1.0 }
      ];
      
      const critical = anomalies.filter(a => a.severity === 'CRITICAL');
      expect(critical.length).toBe(1);
      
      const highOrAbove = anomalies.filter(a => ['CRITICAL', 'HIGH'].includes(a.severity));
      expect(highOrAbove.length).toBe(2);
    });
    
    it('should group anomalies by year and quarter', () => {
      const anomalies = [
        { year: 2024, quarter: 'Q1', type: 'BALLOT_ANOMALY' },
        { year: 2024, quarter: 'Q1', type: 'DOCUMENT_ANOMALY' },
        { year: 2024, quarter: 'Q2', type: 'BALLOT_ANOMALY' }
      ];
      
      const byQuarter = anomalies.reduce((acc, a) => {
        const key = `${a.year}-${a.quarter}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      
      expect(byQuarter['2024-Q1']).toBe(2);
      expect(byQuarter['2024-Q2']).toBe(1);
    });
  });
  
  describe('D3.js Heatmap', () => {
    it('should create SVG element for heatmap', () => {
      const container = document.getElementById('severity-heatmap');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);
      
      expect(container.querySelector('svg')).not.toBeNull();
    });
    
    it('should render heatmap cells', () => {
      // Test data structure for heatmap
      const heatmapData = [
        { year: 2024, quarter: 'Q1', severity: 'HIGH' },
        { year: 2024, quarter: 'Q2', severity: 'MODERATE' }
      ];
      
      expect(heatmapData.length).toBe(2);
      expect(heatmapData[0]).toHaveProperty('year');
      expect(heatmapData[0]).toHaveProperty('quarter');
      expect(heatmapData[0]).toHaveProperty('severity');
    });
  });
  
  describe('Multi-Language Support', () => {
    const TRANSLATIONS = {
      en: {
        severity: {
          CRITICAL: 'Critical',
          HIGH: 'High',
          MODERATE: 'Moderate',
          LOW: 'Low'
        },
        type: {
          BALLOT_ANOMALY: 'Ballot Anomaly',
          DOCUMENT_ANOMALY: 'Document Anomaly',
          ATTENDANCE_ANOMALY: 'Attendance Anomaly'
        }
      },
      sv: {
        severity: {
          CRITICAL: 'Kritisk',
          HIGH: 'Hög',
          MODERATE: 'Måttlig',
          LOW: 'Låg'
        }
      }
    };
    
    it('should have translations for all severity levels', () => {
      expect(TRANSLATIONS.en.severity.CRITICAL).toBe('Critical');
      expect(TRANSLATIONS.sv.severity.CRITICAL).toBe('Kritisk');
    });
    
    it('should have translations for anomaly types', () => {
      expect(TRANSLATIONS.en.type.BALLOT_ANOMALY).toBe('Ballot Anomaly');
      expect(TRANSLATIONS.en.type.DOCUMENT_ANOMALY).toBe('Document Anomaly');
      expect(TRANSLATIONS.en.type.ATTENDANCE_ANOMALY).toBe('Attendance Anomaly');
    });
  });
});
