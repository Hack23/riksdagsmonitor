/**
 * Tests for the analysis-references module.
 *
 * Validates:
 * - scanAnalysisFiles() returns null when no analysis directory exists
 * - scanAnalysisFiles() discovers all .md files and documents/ subdirectory
 * - scanAnalysisFiles() rejects invalid date formats
 * - scanAnalysisFiles() handles unknown article types gracefully
 * - generateAnalysisReferencesHtml() returns empty string when no files exist
 * - generateAnalysisReferencesHtml() generates correct HTML with links to all analysis files
 * - generateAnalysisReferencesHtml() includes per-document link when documents/ dir exists
 * - generateAnalysisReferencesHtml() localizes labels for each language
 * - generateAnalysisReferencesHtml() includes unknown .md files not in known list
 * - ARTICLE_TYPE_TO_ANALYSIS_SUBFOLDER covers all article types
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import {
  scanAnalysisFiles,
  generateAnalysisReferencesHtml,
  ARTICLE_TYPE_TO_ANALYSIS_SUBFOLDER,
} from '../scripts/analysis-references.js';

describe('analysis-references', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `analysis-refs-test-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  // ---------------------------------------------------------------------------
  // ARTICLE_TYPE_TO_ANALYSIS_SUBFOLDER
  // ---------------------------------------------------------------------------

  describe('ARTICLE_TYPE_TO_ANALYSIS_SUBFOLDER', () => {
    it('covers all standard article types', () => {
      const expectedTypes = [
        'committee-reports', 'propositions', 'interpellations', 'motions',
        'evening-analysis', 'breaking', 'week-ahead', 'month-ahead',
        'weekly-review', 'monthly-review', 'deep-inspection',
      ];
      for (const t of expectedTypes) {
        expect(ARTICLE_TYPE_TO_ANALYSIS_SUBFOLDER).toHaveProperty(t);
        expect(ARTICLE_TYPE_TO_ANALYSIS_SUBFOLDER[t]).toBeTruthy();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // scanAnalysisFiles()
  // ---------------------------------------------------------------------------

  describe('scanAnalysisFiles()', () => {
    it('returns null when analysis directory does not exist', () => {
      const result = scanAnalysisFiles({
        date: '2026-04-10',
        articleType: 'propositions',
        lang: 'en',
        analysisBasePath: testDir,
      });
      expect(result).toBeNull();
    });

    it('returns null for invalid date format', () => {
      const result = scanAnalysisFiles({
        date: '../../../etc/passwd',
        articleType: 'propositions',
        lang: 'en',
        analysisBasePath: testDir,
      });
      expect(result).toBeNull();
    });

    it('returns null for unknown article type', () => {
      const result = scanAnalysisFiles({
        date: '2026-04-10',
        articleType: 'unknown-type',
        lang: 'en',
        analysisBasePath: testDir,
      });
      expect(result).toBeNull();
    });

    it('returns null when directory exists but has no .md files', () => {
      const dir = join(testDir, '2026-04-10', 'propositions');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'readme.txt'), 'not a md file');

      const result = scanAnalysisFiles({
        date: '2026-04-10',
        articleType: 'propositions',
        lang: 'en',
        analysisBasePath: testDir,
      });
      expect(result).toBeNull();
    });

    it('discovers .md files and detects documents/ subdirectory', () => {
      const dir = join(testDir, '2026-04-10', 'propositions');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'synthesis-summary.md'), '# Summary');
      writeFileSync(join(dir, 'swot-analysis.md'), '# SWOT');
      writeFileSync(join(dir, 'risk-assessment.md'), '# Risk');
      mkdirSync(join(dir, 'documents'));
      writeFileSync(join(dir, 'documents', 'hd03230-analysis.md'), '# Doc');

      const result = scanAnalysisFiles({
        date: '2026-04-10',
        articleType: 'propositions',
        lang: 'en',
        analysisBasePath: testDir,
      });

      expect(result).not.toBeNull();
      expect(result!.files).toContain('synthesis-summary.md');
      expect(result!.files).toContain('swot-analysis.md');
      expect(result!.files).toContain('risk-assessment.md');
      expect(result!.files).not.toContain('hd03230-analysis.md'); // in subdirectory
      expect(result!.hasDocumentsDir).toBe(true);
      expect(result!.subfolder).toBe('propositions');
      expect(result!.date).toBe('2026-04-10');
    });

    it('returns hasDocumentsDir=false when no documents/ subdirectory', () => {
      const dir = join(testDir, '2026-04-10', 'committeeReports');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'synthesis-summary.md'), '# Summary');

      const result = scanAnalysisFiles({
        date: '2026-04-10',
        articleType: 'committee-reports',
        lang: 'en',
        analysisBasePath: testDir,
      });

      expect(result).not.toBeNull();
      expect(result!.hasDocumentsDir).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // generateAnalysisReferencesHtml()
  // ---------------------------------------------------------------------------

  describe('generateAnalysisReferencesHtml()', () => {
    it('returns empty string when no analysis files exist', () => {
      const html = generateAnalysisReferencesHtml({
        date: '2026-04-10',
        articleType: 'propositions',
        lang: 'en',
        analysisBasePath: testDir,
      });
      expect(html).toBe('');
    });

    it('generates correct HTML with links to all known analysis files', () => {
      const dir = join(testDir, '2026-04-10', 'propositions');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'synthesis-summary.md'), '# Summary');
      writeFileSync(join(dir, 'swot-analysis.md'), '# SWOT');
      writeFileSync(join(dir, 'risk-assessment.md'), '# Risk');
      writeFileSync(join(dir, 'threat-analysis.md'), '# Threat');
      writeFileSync(join(dir, 'stakeholder-perspectives.md'), '# Stakeholders');
      writeFileSync(join(dir, 'significance-scoring.md'), '# Significance');
      writeFileSync(join(dir, 'classification-results.md'), '# Classification');
      writeFileSync(join(dir, 'cross-reference-map.md'), '# Cross-ref');
      writeFileSync(join(dir, 'data-download-manifest.md'), '# Manifest');

      const html = generateAnalysisReferencesHtml({
        date: '2026-04-10',
        articleType: 'propositions',
        lang: 'en',
        analysisBasePath: testDir,
      });

      // Verify section structure
      expect(html).toContain('<section class="analysis-references"');
      expect(html).toContain('aria-label="Analysis sources and methodology"');
      expect(html).toContain('📊 Analysis &amp; Sources');

      // Verify all known file links
      expect(html).toContain('analysis/daily/2026-04-10/propositions/synthesis-summary.md');
      expect(html).toContain('analysis/daily/2026-04-10/propositions/swot-analysis.md');
      expect(html).toContain('analysis/daily/2026-04-10/propositions/risk-assessment.md');
      expect(html).toContain('analysis/daily/2026-04-10/propositions/threat-analysis.md');
      expect(html).toContain('analysis/daily/2026-04-10/propositions/stakeholder-perspectives.md');
      expect(html).toContain('analysis/daily/2026-04-10/propositions/significance-scoring.md');
      expect(html).toContain('analysis/daily/2026-04-10/propositions/classification-results.md');
      expect(html).toContain('analysis/daily/2026-04-10/propositions/cross-reference-map.md');
      expect(html).toContain('analysis/daily/2026-04-10/propositions/data-download-manifest.md');

      // Verify methodology link is always present
      expect(html).toContain('analysis/methodologies/ai-driven-analysis-guide.md');
      expect(html).toContain('AI Analysis Methodology');

      // Verify rel attributes for security
      expect(html).toContain('rel="noopener noreferrer"');
    });

    it('includes per-document link when documents/ dir exists', () => {
      const dir = join(testDir, '2026-04-10', 'propositions');
      mkdirSync(join(dir, 'documents'), { recursive: true });
      writeFileSync(join(dir, 'synthesis-summary.md'), '# Summary');
      writeFileSync(join(dir, 'documents', 'hd03230-analysis.md'), '# Doc');

      const html = generateAnalysisReferencesHtml({
        date: '2026-04-10',
        articleType: 'propositions',
        lang: 'en',
        analysisBasePath: testDir,
      });

      expect(html).toContain('Per-document analyses');
      expect(html).toContain('analysis/daily/2026-04-10/propositions/documents/');
    });

    it('does not include per-document link when documents/ dir missing', () => {
      const dir = join(testDir, '2026-04-10', 'propositions');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'synthesis-summary.md'), '# Summary');

      const html = generateAnalysisReferencesHtml({
        date: '2026-04-10',
        articleType: 'propositions',
        lang: 'en',
        analysisBasePath: testDir,
      });

      expect(html).not.toContain('documents/');
    });

    it('includes unknown .md files with auto-generated labels', () => {
      const dir = join(testDir, '2026-04-10', 'propositions');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'synthesis-summary.md'), '# Summary');
      writeFileSync(join(dir, 'custom-analysis-report.md'), '# Custom');

      const html = generateAnalysisReferencesHtml({
        date: '2026-04-10',
        articleType: 'propositions',
        lang: 'en',
        analysisBasePath: testDir,
      });

      expect(html).toContain('Custom Analysis Report');
      expect(html).toContain('analysis/daily/2026-04-10/propositions/custom-analysis-report.md');
    });

    it('localizes labels for Swedish', () => {
      const dir = join(testDir, '2026-04-10', 'propositions');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'synthesis-summary.md'), '# Summary');
      writeFileSync(join(dir, 'swot-analysis.md'), '# SWOT');

      const html = generateAnalysisReferencesHtml({
        date: '2026-04-10',
        articleType: 'propositions',
        lang: 'sv',
        analysisBasePath: testDir,
      });

      expect(html).toContain('Analys och källor');
      expect(html).toContain('Syntessammanfattning');
      expect(html).toContain('SWOT-analys');
      expect(html).toContain('AI-analysmetodik');
    });

    it('localizes labels for Arabic (RTL)', () => {
      const dir = join(testDir, '2026-04-10', 'propositions');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'risk-assessment.md'), '# Risk');

      const html = generateAnalysisReferencesHtml({
        date: '2026-04-10',
        articleType: 'propositions',
        lang: 'ar',
        analysisBasePath: testDir,
      });

      expect(html).toContain('التحليل والمصادر');
      expect(html).toContain('تقييم المخاطر');
    });

    it('uses correct subfolder for committee-reports', () => {
      const dir = join(testDir, '2026-04-10', 'committeeReports');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'synthesis-summary.md'), '# Summary');

      const html = generateAnalysisReferencesHtml({
        date: '2026-04-10',
        articleType: 'committee-reports',
        lang: 'en',
        analysisBasePath: testDir,
      });

      expect(html).toContain('analysis/daily/2026-04-10/committeeReports/synthesis-summary.md');
    });

    it('uses correct subfolder for interpellations', () => {
      const dir = join(testDir, '2026-04-10', 'interpellations');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'synthesis-summary.md'), '# Summary');

      const html = generateAnalysisReferencesHtml({
        date: '2026-04-10',
        articleType: 'interpellations',
        lang: 'en',
        analysisBasePath: testDir,
      });

      expect(html).toContain('analysis/daily/2026-04-10/interpellations/synthesis-summary.md');
    });

    it('links use GitHub blob base URL', () => {
      const dir = join(testDir, '2026-04-10', 'propositions');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'synthesis-summary.md'), '# Summary');

      const html = generateAnalysisReferencesHtml({
        date: '2026-04-10',
        articleType: 'propositions',
        lang: 'en',
        analysisBasePath: testDir,
      });

      expect(html).toContain('https://github.com/Hack23/riksdagsmonitor/blob/main/');
    });
  });
});
