/**
 * Tests for the analysis-reader module.
 *
 * Validates:
 * - parseClassificationResults() parses classification markdown correctly
 * - parseRiskAssessment() extracts risk level, factors, and indicators
 * - parseSwotAnalysis() extracts SWOT quadrants with confidence and impact
 * - parseThreatAnalysis() extracts threat indicators and democratic health
 * - parseStakeholderPerspectives() extracts all 6 perspective summaries
 * - parseSignificanceScoring() extracts score, urgency, and top documents
 * - parseSynthesisSummary() extracts narrative direction and forward indicators
 * - readDailyAnalysis() returns hasAnalysis:false when no files exist
 * - readDailyAnalysis() parses all files when they exist
 * - readLatestAnalysis() returns stub when no analysis directory exists
 * - deriveArticleClassificationMeta() returns safe defaults when hasAnalysis:false
 * - findLatestAnalysisDate() returns null when no analysis directories exist
 * - Graceful handling of malformed markdown inputs
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import {
  parseClassificationResults,
  parseRiskAssessment,
  parseSwotAnalysis,
  parseThreatAnalysis,
  parseStakeholderPerspectives,
  parseSignificanceScoring,
  parseSynthesisSummary,
  readDailyAnalysis,
  readLatestAnalysis,
  findLatestAnalysisDate,
  deriveArticleClassificationMeta,
  isNonEmptyAnalysis,
  readLatestNonEmptyAnalysis,
} from '../scripts/analysis-reader.js';
import type {
  ClassificationResult,
  RiskAssessment,
  SwotAnalysisResult,
  ThreatAnalysisResult,
  StakeholderPerspectivesResult,
  SignificanceScoringResult,
  SynthesisSummaryResult,
  DailyAnalysis,
} from '../scripts/analysis-reader.js';

// ---------------------------------------------------------------------------
// Sample markdown fixtures
// ---------------------------------------------------------------------------

const CLASSIFICATION_MD = `# Classification Results

**Level**: HIGH
**Priority**: major
**Confidence**: HIGH

## Policy Domains

- Defense policy
- Budget

## Summary

Coalition advanced defense budget amendment H9011 with 198-148 margin.

H9011 H902A
`;

const RISK_MD = `# Risk Assessment

**Overall Risk**: elevated
**Confidence**: HIGH

## Risk Factors

- Coalition margin thin at 13 votes
- KD defection risk on welfare reform

## Summary

Elevated coalition stability risk due to narrow voting margins.

⚠️ KD internal division over welfare spending
⚠️ SD withdrawal from supply-and-confidence agreement
`;

const SWOT_MD = `# SWOT Analysis

**Subject**: Government Coalition

## Strengths

- Budget surplus 15 billion SEK — fiscal room for social spending [HIGH] Impact: high
- H901 majority secured with 198 votes [HIGH] Impact: medium

## Weaknesses

- Narrow 13-vote margin [MEDIUM] Impact: high
- KD defection risk on welfare [LOW] Impact: medium

## Opportunities

- Pre-election spending window open [MEDIUM] Impact: medium

## Threats

- ☁️ SD withdrawal triggers minority government [HIGH] Impact: high

## Context

Analysis covers 2026-03-26 parliamentary session.
`;

const THREAT_MD = `# Threat Analysis

**Democratic Health**: HIGH
**Confidence**: MEDIUM

## Key Actors

- SD party leadership
- KD parliamentary group

## Summary

Structural coalition stability threat identified.

🎯 SD bloc may withdraw supply-and-confidence support
🎯 KD could cross floor on welfare vote
`;

const STAKEHOLDERS_MD = `# Stakeholder Perspectives

## 🏛️ Government

Coalition defended budget surplus approach citing fiscal responsibility.

## ⚖️ Opposition

S demanded full welfare funding; V rejected entire budget framework.

## 👥 Citizen

Housing affordability and healthcare wait times remain top concerns.

## 💰 Economic

Business confederation warned export sector exposed to new tariffs.

## 🌍 International

EU Commission reviewing Swedish housing regulation alignment.

## 📰 Media

Tabloids focused on coalition drama; quality press covered substance.
`;

const SIGNIFICANCE_MD = `# Significance Scoring

**Overall Score**: 78
**Urgency**: major
**Confidence**: HIGH

## Top Documents

- H9011 85 score — Defense budget amendment with coalition implications
- H902A 72 score — Healthcare reform proposition
`;

const SYNTHESIS_MD = `# Synthesis Summary

## Narrative Direction

Coalition's narrow margin on H9011 exposes structural fragility heading into election year.

## Key Themes

- Coalition stability under pressure
- Defense budget expansion
- Opposition unity challenges

## Article Focus

Lead with the 13-vote margin and KD defection risk — not the policy substance.

## Forward Indicators

- Watch KD parliamentary group statement by Thursday
- SD confidence vote motion expected next week
- EU Commission review result due in 30 days
`;

// ---------------------------------------------------------------------------
// Parser unit tests
// ---------------------------------------------------------------------------

describe('parseClassificationResults', () => {
  it('extracts level, priority, and confidence from valid markdown', () => {
    const result: ClassificationResult = parseClassificationResults(CLASSIFICATION_MD);
    expect(result.level).toBe('HIGH');
    expect(result.priority).toBe('major');
    expect(result.confidence).toBe('HIGH');
  });

  it('extracts document IDs from markdown', () => {
    const result = parseClassificationResults(CLASSIFICATION_MD);
    expect(result.documentIds).toContain('H9011');
    expect(result.documentIds).toContain('H902A');
  });

  it('extracts policy domains from markdown', () => {
    const result = parseClassificationResults(CLASSIFICATION_MD);
    expect(result.domains.some(d => d.includes('Defense'))).toBe(true);
  });

  it('returns MEDIUM as default level for unrecognized input', () => {
    const result = parseClassificationResults('**Level**: UNKNOWN\n**Priority**: weird');
    expect(result.level).toBe('MEDIUM');
    expect(result.priority).toBe('standard');
  });

  it('handles CRITICAL classification level', () => {
    const result = parseClassificationResults('**Level**: CRITICAL\n**Priority**: breaking\n**Confidence**: HIGH');
    expect(result.level).toBe('CRITICAL');
    expect(result.priority).toBe('breaking');
  });

  it('handles LOW classification level', () => {
    const result = parseClassificationResults('**Level**: LOW\n**Confidence**: LOW');
    expect(result.level).toBe('LOW');
    expect(result.confidence).toBe('LOW');
  });

  it('returns empty summary for empty markdown', () => {
    const result = parseClassificationResults('');
    expect(result.level).toBe('MEDIUM');
    expect(result.summary).toBe('');
    expect(result.documentIds).toEqual([]);
  });
});

describe('parseRiskAssessment', () => {
  it('extracts risk level, factors, and indicators', () => {
    const result: RiskAssessment = parseRiskAssessment(RISK_MD);
    expect(result.level).toBe('elevated');
    expect(result.confidence).toBe('HIGH');
    expect(result.factors.length).toBeGreaterThan(0);
    expect(result.indicators.length).toBeGreaterThan(0);
  });

  it('extracts ⚠️ tagged indicators', () => {
    const result = parseRiskAssessment(RISK_MD);
    expect(result.indicators.some(i => i.includes('KD'))).toBe(true);
    expect(result.indicators.some(i => i.includes('SD'))).toBe(true);
  });

  it('defaults to moderate risk for unrecognized level', () => {
    const result = parseRiskAssessment('**Overall Risk**: unknown');
    expect(result.level).toBe('moderate');
  });

  it('handles high and low risk levels', () => {
    const high = parseRiskAssessment('**Overall Risk**: high');
    const low = parseRiskAssessment('**Overall Risk**: low');
    expect(high.level).toBe('high');
    expect(low.level).toBe('low');
  });

  it('returns empty factors for empty markdown', () => {
    const result = parseRiskAssessment('');
    expect(result.factors).toEqual([]);
    expect(result.indicators).toEqual([]);
  });
});

describe('parseSwotAnalysis', () => {
  it('extracts subject and four SWOT quadrants', () => {
    const result: SwotAnalysisResult = parseSwotAnalysis(SWOT_MD);
    expect(result.subject).toBe('Government Coalition');
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.weaknesses.length).toBeGreaterThan(0);
    expect(result.opportunities.length).toBeGreaterThan(0);
    expect(result.threats.length).toBeGreaterThan(0);
  });

  it('extracts confidence labels from SWOT entries', () => {
    const result = parseSwotAnalysis(SWOT_MD);
    // Strengths should have HIGH confidence
    const highEntry = result.strengths.find(e => e.confidence === 'HIGH');
    expect(highEntry).toBeDefined();
    // Weaknesses should have MEDIUM and LOW confidence
    const medEntry = result.weaknesses.find(e => e.confidence === 'MEDIUM');
    expect(medEntry).toBeDefined();
  });

  it('extracts impact levels from SWOT entries', () => {
    const result = parseSwotAnalysis(SWOT_MD);
    const highImpact = result.strengths.find(e => e.impact === 'high');
    expect(highImpact).toBeDefined();
  });

  it('extracts context section', () => {
    const result = parseSwotAnalysis(SWOT_MD);
    expect(result.context).toBeDefined();
    expect(result.context).toContain('2026-03-26');
  });

  it('uses default subject when not specified', () => {
    const result = parseSwotAnalysis('## Strengths\n- Strong foundation [HIGH]');
    expect(result.subject).toBe('Swedish Parliament');
  });

  it('returns empty arrays for all quadrants when markdown has no sections', () => {
    const result = parseSwotAnalysis('**Subject**: Test Subject\nNo SWOT data here');
    expect(result.strengths).toEqual([]);
    expect(result.weaknesses).toEqual([]);
    expect(result.opportunities).toEqual([]);
    expect(result.threats).toEqual([]);
  });
});

describe('parseThreatAnalysis', () => {
  it('extracts indicators, democratic health, and actors', () => {
    const result: ThreatAnalysisResult = parseThreatAnalysis(THREAT_MD);
    expect(result.democraticHealth).toBe('HIGH');
    expect(result.confidence).toBe('MEDIUM');
    expect(result.indicators.length).toBeGreaterThan(0);
    expect(result.actors.length).toBeGreaterThan(0);
  });

  it('extracts 🎯 tagged indicators', () => {
    const result = parseThreatAnalysis(THREAT_MD);
    expect(result.indicators.some(i => i.includes('SD'))).toBe(true);
    expect(result.indicators.some(i => i.includes('KD'))).toBe(true);
  });

  it('returns empty indicators for markdown with no 🎯 tags', () => {
    const result = parseThreatAnalysis('**Democratic Health**: MEDIUM\nNo threats here.');
    expect(result.indicators).toEqual([]);
  });

  it('defaults confidence to MEDIUM for missing field', () => {
    const result = parseThreatAnalysis('**Democratic Health**: LOW\n🎯 Some threat');
    expect(result.confidence).toBe('MEDIUM');
  });
});

describe('parseStakeholderPerspectives', () => {
  it('extracts all 6 perspectives', () => {
    const result: StakeholderPerspectivesResult = parseStakeholderPerspectives(STAKEHOLDERS_MD);
    expect(result.government.length).toBeGreaterThan(0);
    expect(result.opposition.length).toBeGreaterThan(0);
    expect(result.citizen.length).toBeGreaterThan(0);
    expect(result.economic.length).toBeGreaterThan(0);
    expect(result.international.length).toBeGreaterThan(0);
    expect(result.media.length).toBeGreaterThan(0);
  });

  it('extracts government perspective correctly', () => {
    const result = parseStakeholderPerspectives(STAKEHOLDERS_MD);
    expect(result.government).toContain('Coalition');
  });

  it('extracts opposition perspective correctly', () => {
    const result = parseStakeholderPerspectives(STAKEHOLDERS_MD);
    expect(result.opposition).toContain('welfare');
  });

  it('returns empty strings for missing perspectives', () => {
    const result = parseStakeholderPerspectives('## 🏛️ Government\nOnly government here.');
    expect(result.government.length).toBeGreaterThan(0);
    expect(result.opposition).toBe('');
    expect(result.citizen).toBe('');
  });

  it('handles plain section headers without emoji', () => {
    const md = '## Government\nPlain gov text.\n## Opposition\nPlain opp text.';
    const result = parseStakeholderPerspectives(md);
    expect(result.government).toContain('Plain gov text');
    expect(result.opposition).toContain('Plain opp text');
  });
});

describe('parseSignificanceScoring', () => {
  it('extracts score, urgency, confidence, and top documents', () => {
    const result: SignificanceScoringResult = parseSignificanceScoring(SIGNIFICANCE_MD);
    expect(result.score).toBe(78);
    expect(result.urgency).toBe('major');
    expect(result.confidence).toBe('HIGH');
    expect(result.topDocuments.length).toBeGreaterThan(0);
  });

  it('clamps score to 0-100 range', () => {
    const over = parseSignificanceScoring('**Overall Score**: 150');
    const under = parseSignificanceScoring('**Overall Score**: -10');
    expect(over.score).toBe(100);
    expect(under.score).toBe(0);
  });

  it('defaults to score 50 when no score found', () => {
    const result = parseSignificanceScoring('**Urgency**: standard');
    expect(result.score).toBe(50);
  });

  it('extracts top document IDs and scores', () => {
    const result = parseSignificanceScoring(SIGNIFICANCE_MD);
    const h9011 = result.topDocuments.find(d => d.docId === 'H9011');
    expect(h9011).toBeDefined();
    expect(h9011?.score).toBe(85);
  });
});

describe('parseSynthesisSummary', () => {
  it('extracts narrative direction, key themes, and forward indicators', () => {
    const result: SynthesisSummaryResult = parseSynthesisSummary(SYNTHESIS_MD);
    expect(result.narrativeDirection.length).toBeGreaterThan(0);
    expect(result.keyThemes.length).toBeGreaterThan(0);
    expect(result.forwardIndicators.length).toBeGreaterThan(0);
  });

  it('extracts narrative direction containing key facts', () => {
    const result = parseSynthesisSummary(SYNTHESIS_MD);
    expect(result.narrativeDirection).toContain('H9011');
  });

  it('extracts key themes as bullet list', () => {
    const result = parseSynthesisSummary(SYNTHESIS_MD);
    expect(result.keyThemes.some(t => t.includes('Coalition stability'))).toBe(true);
  });

  it('extracts forward indicators as bullet list', () => {
    const result = parseSynthesisSummary(SYNTHESIS_MD);
    expect(result.forwardIndicators.some(i => i.includes('KD'))).toBe(true);
  });

  it('returns empty values for empty markdown', () => {
    const result = parseSynthesisSummary('');
    expect(result.narrativeDirection).toBe('');
    expect(result.keyThemes).toEqual([]);
    expect(result.forwardIndicators).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// File-based integration tests using a temporary directory
// ---------------------------------------------------------------------------

describe('readDailyAnalysis', () => {
  const TEST_DATE = '2026-03-26';
  let tempBase: string;

  beforeEach(() => {
    tempBase = join(tmpdir(), `rdm-test-${randomUUID()}`);
    mkdirSync(join(tempBase, TEST_DATE), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempBase)) {
      rmSync(tempBase, { recursive: true, force: true });
    }
  });

  it('returns hasAnalysis:false when no files exist in directory', async () => {
    const result = await readDailyAnalysis(TEST_DATE, tempBase);
    expect(result.hasAnalysis).toBe(false);
    expect(result.classification).toBeNull();
    expect(result.riskAssessment).toBeNull();
    expect(result.swot).toBeNull();
    expect(result.date).toBe(TEST_DATE);
  });

  it('returns hasAnalysis:false for non-existent date directory', async () => {
    const result = await readDailyAnalysis('1900-01-01', tempBase);
    expect(result.hasAnalysis).toBe(false);
  });

  it('parses classification when file exists', async () => {
    writeFileSync(join(tempBase, TEST_DATE, 'classification-results.md'), CLASSIFICATION_MD, 'utf-8');
    const result = await readDailyAnalysis(TEST_DATE, tempBase);
    expect(result.hasAnalysis).toBe(true);
    expect(result.classification).not.toBeNull();
    expect(result.classification?.level).toBe('HIGH');
  });

  it('parses risk assessment when file exists', async () => {
    writeFileSync(join(tempBase, TEST_DATE, 'risk-assessment.md'), RISK_MD, 'utf-8');
    const result = await readDailyAnalysis(TEST_DATE, tempBase);
    expect(result.hasAnalysis).toBe(true);
    expect(result.riskAssessment?.level).toBe('elevated');
  });

  it('parses SWOT when file exists', async () => {
    writeFileSync(join(tempBase, TEST_DATE, 'swot-analysis.md'), SWOT_MD, 'utf-8');
    const result = await readDailyAnalysis(TEST_DATE, tempBase);
    expect(result.swot?.subject).toBe('Government Coalition');
    expect(result.swot?.strengths.length).toBeGreaterThan(0);
  });

  it('parses threat analysis when file exists', async () => {
    writeFileSync(join(tempBase, TEST_DATE, 'threat-analysis.md'), THREAT_MD, 'utf-8');
    const result = await readDailyAnalysis(TEST_DATE, tempBase);
    expect(result.threatAnalysis?.indicators.length).toBeGreaterThan(0);
  });

  it('parses stakeholder perspectives when file exists', async () => {
    writeFileSync(join(tempBase, TEST_DATE, 'stakeholder-perspectives.md'), STAKEHOLDERS_MD, 'utf-8');
    const result = await readDailyAnalysis(TEST_DATE, tempBase);
    expect(result.stakeholderPerspectives?.government.length).toBeGreaterThan(0);
    expect(result.stakeholderPerspectives?.opposition.length).toBeGreaterThan(0);
  });

  it('parses significance scoring when file exists', async () => {
    writeFileSync(join(tempBase, TEST_DATE, 'significance-scoring.md'), SIGNIFICANCE_MD, 'utf-8');
    const result = await readDailyAnalysis(TEST_DATE, tempBase);
    expect(result.significance?.score).toBe(78);
    expect(result.significance?.urgency).toBe('major');
  });

  it('parses synthesis summary when file exists', async () => {
    writeFileSync(join(tempBase, TEST_DATE, 'synthesis-summary.md'), SYNTHESIS_MD, 'utf-8');
    const result = await readDailyAnalysis(TEST_DATE, tempBase);
    expect(result.synthesis?.keyThemes.length).toBeGreaterThan(0);
    expect(result.synthesis?.forwardIndicators.length).toBeGreaterThan(0);
  });

  it('parses all files when all exist', async () => {
    writeFileSync(join(tempBase, TEST_DATE, 'classification-results.md'), CLASSIFICATION_MD, 'utf-8');
    writeFileSync(join(tempBase, TEST_DATE, 'risk-assessment.md'), RISK_MD, 'utf-8');
    writeFileSync(join(tempBase, TEST_DATE, 'swot-analysis.md'), SWOT_MD, 'utf-8');
    writeFileSync(join(tempBase, TEST_DATE, 'threat-analysis.md'), THREAT_MD, 'utf-8');
    writeFileSync(join(tempBase, TEST_DATE, 'stakeholder-perspectives.md'), STAKEHOLDERS_MD, 'utf-8');
    writeFileSync(join(tempBase, TEST_DATE, 'significance-scoring.md'), SIGNIFICANCE_MD, 'utf-8');
    writeFileSync(join(tempBase, TEST_DATE, 'synthesis-summary.md'), SYNTHESIS_MD, 'utf-8');

    const result = await readDailyAnalysis(TEST_DATE, tempBase);
    expect(result.hasAnalysis).toBe(true);
    expect(result.classification).not.toBeNull();
    expect(result.riskAssessment).not.toBeNull();
    expect(result.swot).not.toBeNull();
    expect(result.threatAnalysis).not.toBeNull();
    expect(result.stakeholderPerspectives).not.toBeNull();
    expect(result.significance).not.toBeNull();
    expect(result.synthesis).not.toBeNull();
  });

  it('returns partial data when only some files exist', async () => {
    writeFileSync(join(tempBase, TEST_DATE, 'classification-results.md'), CLASSIFICATION_MD, 'utf-8');
    // Deliberately omit other files

    const result = await readDailyAnalysis(TEST_DATE, tempBase);
    expect(result.hasAnalysis).toBe(true);
    expect(result.classification).not.toBeNull();
    expect(result.riskAssessment).toBeNull();  // Missing file → null
    expect(result.swot).toBeNull();            // Missing file → null
  });

  it('finds analysis files in subdirectories when root-level files are absent', async () => {
    // Place analysis in a subdirectory (e.g., deep-inspection/)
    const subDir = join(tempBase, TEST_DATE, 'deep-inspection');
    mkdirSync(subDir, { recursive: true });
    writeFileSync(join(subDir, 'classification-results.md'), CLASSIFICATION_MD, 'utf-8');
    writeFileSync(join(subDir, 'risk-assessment.md'), RISK_MD, 'utf-8');

    const result = await readDailyAnalysis(TEST_DATE, tempBase);
    expect(result.hasAnalysis).toBe(true);
    expect(result.classification).not.toBeNull();
    expect(result.classification?.level).toBe('HIGH');
    expect(result.riskAssessment).not.toBeNull();
    expect(result.riskAssessment?.level).toBe('elevated');
  });

  it('prefers root-level files over subdirectory files', async () => {
    // Root-level classification
    writeFileSync(join(tempBase, TEST_DATE, 'classification-results.md'), CLASSIFICATION_MD, 'utf-8');
    // Subdirectory classification with different content
    const subDir = join(tempBase, TEST_DATE, 'propositions');
    mkdirSync(subDir, { recursive: true });
    writeFileSync(join(subDir, 'classification-results.md'), '# Classification\n**Level**: LOW\n**Confidence**: LOW', 'utf-8');

    const result = await readDailyAnalysis(TEST_DATE, tempBase);
    expect(result.classification?.level).toBe('HIGH');  // Root takes precedence
  });

  it('selects subdirectory deterministically (alphabetical) when multiple exist', async () => {
    // Create two subdirectories with different classification levels
    const subA = join(tempBase, TEST_DATE, 'aaa-first');
    const subZ = join(tempBase, TEST_DATE, 'zzz-last');
    mkdirSync(subA, { recursive: true });
    mkdirSync(subZ, { recursive: true });
    writeFileSync(join(subA, 'classification-results.md'), CLASSIFICATION_MD, 'utf-8'); // HIGH
    writeFileSync(join(subZ, 'classification-results.md'), '# Classification\n**Level**: LOW\n**Confidence**: LOW', 'utf-8');

    const result = await readDailyAnalysis(TEST_DATE, tempBase);
    expect(result.classification?.level).toBe('HIGH');  // 'aaa-first' comes first alphabetically
  });
});

// ---------------------------------------------------------------------------
// findLatestAnalysisDate tests
// ---------------------------------------------------------------------------

describe('findLatestAnalysisDate', () => {
  let tempBase: string;

  beforeEach(() => {
    tempBase = join(tmpdir(), `rdm-latest-${randomUUID()}`);
    mkdirSync(tempBase, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempBase)) {
      rmSync(tempBase, { recursive: true, force: true });
    }
  });

  it('returns null when no analysis directories exist', async () => {
    const result = await findLatestAnalysisDate(7, tempBase);
    expect(result).toBeNull();
  });

  it('returns the date when a directory with files exists', async () => {
    const today = new Date().toISOString().split('T')[0]!;
    mkdirSync(join(tempBase, today), { recursive: true });
    writeFileSync(join(tempBase, today, 'classification-results.md'), CLASSIFICATION_MD, 'utf-8');

    const result = await findLatestAnalysisDate(7, tempBase);
    expect(result).toBe(today);
  });

  it('returns null when directory exists but has no analysis files', async () => {
    const today = new Date().toISOString().split('T')[0]!;
    mkdirSync(join(tempBase, today), { recursive: true });
    // Empty directory — no files

    const result = await findLatestAnalysisDate(7, tempBase);
    expect(result).toBeNull();
  });

  it('finds analysis date when files exist only in subdirectories', async () => {
    const today = new Date().toISOString().split('T')[0]!;
    const subDir = join(tempBase, today, 'propositions');
    mkdirSync(subDir, { recursive: true });
    writeFileSync(join(subDir, 'classification-results.md'), CLASSIFICATION_MD, 'utf-8');

    const result = await findLatestAnalysisDate(7, tempBase);
    expect(result).toBe(today);
  });
});

// ---------------------------------------------------------------------------
// readLatestAnalysis tests
// ---------------------------------------------------------------------------

describe('readLatestAnalysis', () => {
  let tempBase: string;

  beforeEach(() => {
    tempBase = join(tmpdir(), `rdm-rl-${randomUUID()}`);
    mkdirSync(tempBase, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempBase)) {
      rmSync(tempBase, { recursive: true, force: true });
    }
  });

  it('returns hasAnalysis:false stub when no analysis exists', async () => {
    const result = await readLatestAnalysis(7, tempBase);
    expect(result.hasAnalysis).toBe(false);
    expect(result.classification).toBeNull();
  });

  it('returns parsed analysis when today\'s files exist', async () => {
    const today = new Date().toISOString().split('T')[0]!;
    mkdirSync(join(tempBase, today), { recursive: true });
    writeFileSync(join(tempBase, today, 'classification-results.md'), CLASSIFICATION_MD, 'utf-8');
    writeFileSync(join(tempBase, today, 'risk-assessment.md'), RISK_MD, 'utf-8');

    const result = await readLatestAnalysis(7, tempBase);
    expect(result.hasAnalysis).toBe(true);
    expect(result.classification?.level).toBe('HIGH');
    expect(result.date).toBe(today);
  });
});

// ---------------------------------------------------------------------------
// deriveArticleClassificationMeta tests
// ---------------------------------------------------------------------------

describe('deriveArticleClassificationMeta', () => {
  it('returns MEDIUM/moderate/MEDIUM defaults when hasAnalysis is false', () => {
    const stub: DailyAnalysis = {
      date: '2026-03-26',
      classification: null,
      riskAssessment: null,
      swot: null,
      threatAnalysis: null,
      stakeholderPerspectives: null,
      significance: null,
      synthesis: null,
      hasAnalysis: false,
    };
    const meta = deriveArticleClassificationMeta(stub);
    expect(meta.classificationLevel).toBe('MEDIUM');
    expect(meta.riskLevel).toBe('moderate');
    expect(meta.confidenceLabel).toBe('MEDIUM');
    expect(meta.significanceScore).toBeUndefined();
    expect(meta.urgency).toBeUndefined();
  });

  it('derives metadata from classification and risk fields', () => {
    const analysis: DailyAnalysis = {
      date: '2026-03-26',
      classification: {
        level: 'HIGH',
        priority: 'major',
        confidence: 'HIGH',
        summary: 'Test',
        documentIds: [],
        domains: [],
      },
      riskAssessment: {
        level: 'elevated',
        factors: [],
        indicators: [],
        confidence: 'HIGH',
        summary: 'Test',
      },
      swot: null,
      threatAnalysis: null,
      stakeholderPerspectives: null,
      significance: { score: 78, urgency: 'major', topDocuments: [], confidence: 'HIGH' },
      synthesis: null,
      hasAnalysis: true,
    };
    const meta = deriveArticleClassificationMeta(analysis);
    expect(meta.classificationLevel).toBe('HIGH');
    expect(meta.riskLevel).toBe('elevated');
    expect(meta.confidenceLabel).toBe('HIGH');
    expect(meta.significanceScore).toBe(78);
    expect(meta.urgency).toBe('major');
  });

  it('falls back to riskAssessment confidence when classification is null', () => {
    const analysis: DailyAnalysis = {
      date: '2026-03-26',
      classification: null,
      riskAssessment: {
        level: 'high',
        factors: [],
        indicators: [],
        confidence: 'LOW',
        summary: '',
      },
      swot: null,
      threatAnalysis: null,
      stakeholderPerspectives: null,
      significance: null,
      synthesis: null,
      hasAnalysis: true,
    };
    const meta = deriveArticleClassificationMeta(analysis);
    expect(meta.confidenceLabel).toBe('LOW');
    expect(meta.riskLevel).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// Edge case and robustness tests
// ---------------------------------------------------------------------------

describe('parser robustness', () => {
  it('parseClassificationResults handles markdown with only a heading', () => {
    const result = parseClassificationResults('# Classification Results\n');
    expect(result.level).toBe('MEDIUM');
    expect(result.documentIds).toEqual([]);
  });

  it('parseRiskAssessment handles markdown with no recognized keywords', () => {
    const result = parseRiskAssessment('Some random text without any keys.');
    expect(result.level).toBe('moderate');
    expect(result.factors).toEqual([]);
  });

  it('parseSwotAnalysis handles unicode and special characters', () => {
    const md = '**Subject**: Miljöpartiet (MP)\n## Strengths\n- Klimatpolitisk profil [HIGH] Impact: high\n## Weaknesses\n## Opportunities\n## Threats\n';
    const result = parseSwotAnalysis(md);
    expect(result.subject).toBe('Miljöpartiet (MP)');
    expect(result.strengths.length).toBe(1);
  });

  it('parseSynthesisSummary handles missing sections gracefully', () => {
    const result = parseSynthesisSummary('# Synthesis\n\nJust a paragraph with no sections.');
    expect(result.narrativeDirection).toBe('');
    expect(result.keyThemes).toEqual([]);
    expect(result.forwardIndicators).toEqual([]);
  });

  it('parseSignificanceScoring handles Score field variant', () => {
    const result = parseSignificanceScoring('**Score**: 65\n**Urgency**: standard');
    expect(result.score).toBe(65);
    expect(result.urgency).toBe('standard');
  });
});

// ---------------------------------------------------------------------------
// getAnalysisEnrichment integration tests
// ---------------------------------------------------------------------------

import {
  getAnalysisEnrichment,
  resetAnalysisEnrichmentCache,
} from '../scripts/generate-news-enhanced/helpers.js';

describe('getAnalysisEnrichment', () => {
  beforeEach(() => {
    resetAnalysisEnrichmentCache();
  });

  afterEach(() => {
    resetAnalysisEnrichmentCache();
  });

  it('returns null when no analysis files exist', async () => {
    // Use a unique non-existent temp path to make the test hermetic
    const basePath = join(tmpdir(), `nonexistent-analysis-dir-${randomUUID()}`);
    const result = await getAnalysisEnrichment({ basePath });
    expect(result).toBeNull();
  });

  it('caches the result across calls', async () => {
    // Create temporary analysis directory with files so enrichment is non-null
    const tmpBase = join(tmpdir(), `enrichment-cache-test-${randomUUID()}`);
    const today = new Date().toISOString().split('T')[0]!;
    const dailyDir = join(tmpBase, 'analysis', 'daily', today);
    mkdirSync(dailyDir, { recursive: true });
    writeFileSync(join(dailyDir, 'classification-results.md'), CLASSIFICATION_MD);
    writeFileSync(join(dailyDir, 'risk-assessment.md'), RISK_MD);
    writeFileSync(join(dailyDir, 'significance-scoring.md'), SIGNIFICANCE_MD);

    try {
      resetAnalysisEnrichmentCache();
      const opts = { basePath: join(tmpBase, 'analysis', 'daily') };

      const first = await getAnalysisEnrichment(opts);
      const second = await getAnalysisEnrichment(opts);

      // Ensure we actually got an enrichment object
      expect(first).not.toBeNull();
      // Both should be the same reference (cached)
      expect(first).toBe(second);
    } finally {
      if (existsSync(tmpBase)) {
        rmSync(tmpBase, { recursive: true, force: true });
      }
    }
  });

  it('returns enrichment when analysis files exist', async () => {
    // Create temporary analysis directory with classification
    const tmpBase = join(tmpdir(), `enrichment-test-${randomUUID()}`);
    const today = new Date().toISOString().split('T')[0]!;
    const dailyDir = join(tmpBase, 'analysis', 'daily', today);
    mkdirSync(dailyDir, { recursive: true });
    writeFileSync(join(dailyDir, 'classification-results.md'), CLASSIFICATION_MD);
    writeFileSync(join(dailyDir, 'risk-assessment.md'), RISK_MD);
    writeFileSync(join(dailyDir, 'significance-scoring.md'), SIGNIFICANCE_MD);

    try {
      resetAnalysisEnrichmentCache();

      // Use basePath to make the test hermetic
      const enrichment = await getAnalysisEnrichment({
        basePath: join(tmpBase, 'analysis', 'daily'),
      });
      expect(enrichment).not.toBeNull();
      expect(enrichment!.classificationLevel).toBe('HIGH');
      expect(enrichment!.riskLevel).toBe('elevated');
      expect(enrichment!.confidenceLabel).toBe('HIGH');
      expect(enrichment!.significance).toBe(78);
      expect(enrichment!.urgency).toBe('major');
    } finally {
      if (existsSync(tmpBase)) {
        rmSync(tmpBase, { recursive: true, force: true });
      }
    }
  });
});

// ---------------------------------------------------------------------------
// subtractBusinessDays tests
// ---------------------------------------------------------------------------

import { subtractBusinessDays, MAX_LOOKBACK_BUSINESS_DAYS } from '../scripts/pre-article-analysis/data-downloader.js';

describe('subtractBusinessDays', () => {
  it('subtracts 0 business days (returns same date)', () => {
    expect(subtractBusinessDays('2026-04-07', 0)).toBe('2026-04-07');
  });

  it('subtracts 1 business day (Monday → Friday)', () => {
    // 2026-04-06 is Monday, 1 business day back = Friday 2026-04-03
    expect(subtractBusinessDays('2026-04-06', 1)).toBe('2026-04-03');
  });

  it('subtracts 1 business day (Wednesday → Tuesday)', () => {
    expect(subtractBusinessDays('2026-04-08', 1)).toBe('2026-04-07');
  });

  it('skips weekends when subtracting', () => {
    // 2026-04-06 is Monday, 5 business days back = 2026-03-30 (Mon)
    expect(subtractBusinessDays('2026-04-06', 5)).toBe('2026-03-30');
  });

  it('handles crossing month boundary', () => {
    // 2026-04-01 is Wednesday, 1 business day = 2026-03-31 (Tue)
    expect(subtractBusinessDays('2026-04-01', 1)).toBe('2026-03-31');
  });

  it('handles Saturday as start date', () => {
    // 2026-04-04 is Saturday, 1 business day back = 2026-04-03 (Fri)
    expect(subtractBusinessDays('2026-04-04', 1)).toBe('2026-04-03');
  });

  it('handles negative days as 0', () => {
    expect(subtractBusinessDays('2026-04-07', -3)).toBe('2026-04-07');
  });

  it('throws RangeError for non-date string', () => {
    expect(() => subtractBusinessDays('not-a-date', 1)).toThrow(RangeError);
  });

  it('throws RangeError for wrong separator', () => {
    expect(() => subtractBusinessDays('2026/04/07', 1)).toThrow(RangeError);
  });

  it('throws RangeError for empty string', () => {
    expect(() => subtractBusinessDays('', 1)).toThrow(RangeError);
  });

  it('throws RangeError for invalid calendar date', () => {
    // Matches YYYY-MM-DD format but is not a real calendar date
    expect(() => subtractBusinessDays('2026-13-45', 1)).toThrow(RangeError);
  });
});

describe('MAX_LOOKBACK_BUSINESS_DAYS', () => {
  it('is 5', () => {
    expect(MAX_LOOKBACK_BUSINESS_DAYS).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// parseSynthesisSummary dataFreshness tests
// ---------------------------------------------------------------------------

describe('parseSynthesisSummary dataFreshness', () => {
  it('extracts dataFreshness from Data Quality Notes section', () => {
    const md = `# Synthesis Summary

## Key Themes

- Budget debate

## Data Quality Notes

Overall confidence: **MEDIUM**. All analysis results are available in sibling files.
**Data Freshness**: Documents sourced from **2026-04-01** via lookback fallback (article date: 2026-04-03).
`;
    const result = parseSynthesisSummary(md);
    expect(result.dataFreshness).toBe('2026-04-01');
  });

  it('returns null dataFreshness when no lookback used', () => {
    const result = parseSynthesisSummary(SYNTHESIS_MD);
    expect(result.dataFreshness).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isNonEmptyAnalysis tests
// ---------------------------------------------------------------------------

describe('isNonEmptyAnalysis', () => {
  const emptyStub: DailyAnalysis = {
    date: '2026-04-03',
    classification: null,
    riskAssessment: null,
    swot: null,
    threatAnalysis: null,
    stakeholderPerspectives: null,
    significance: null,
    synthesis: null,
    hasAnalysis: false,
  };

  it('returns false when hasAnalysis is false', () => {
    expect(isNonEmptyAnalysis(emptyStub)).toBe(false);
  });

  it('returns true when synthesis has key themes', () => {
    const analysis: DailyAnalysis = {
      ...emptyStub,
      hasAnalysis: true,
      synthesis: {
        narrativeDirection: '',
        keyThemes: ['Budget debate'],
        articleFocus: '',
        forwardIndicators: [],
        dataFreshness: null,
      },
    };
    expect(isNonEmptyAnalysis(analysis)).toBe(true);
  });

  it('returns true when synthesis has narrative direction', () => {
    const analysis: DailyAnalysis = {
      ...emptyStub,
      hasAnalysis: true,
      synthesis: {
        narrativeDirection: 'Coalition advances defense budget.',
        keyThemes: [],
        articleFocus: '',
        forwardIndicators: [],
        dataFreshness: null,
      },
    };
    expect(isNonEmptyAnalysis(analysis)).toBe(true);
  });

  it('returns false when synthesis is empty (no themes or narrative)', () => {
    const analysis: DailyAnalysis = {
      ...emptyStub,
      hasAnalysis: true,
      synthesis: {
        narrativeDirection: '',
        keyThemes: [],
        articleFocus: '',
        forwardIndicators: [],
        dataFreshness: null,
      },
    };
    expect(isNonEmptyAnalysis(analysis)).toBe(false);
  });

  it('returns true when synthesis is null but other analysis exists', () => {
    const analysis: DailyAnalysis = {
      ...emptyStub,
      hasAnalysis: true,
      classification: {
        level: 'HIGH',
        priority: 'major',
        confidence: 'HIGH',
        summary: 'Test',
        documentIds: [],
        domains: [],
      },
      synthesis: null,
    };
    expect(isNonEmptyAnalysis(analysis)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// readLatestNonEmptyAnalysis tests
// ---------------------------------------------------------------------------

describe('readLatestNonEmptyAnalysis', () => {
  let tempBase: string;

  beforeEach(() => {
    tempBase = join(tmpdir(), `rdm-nonempty-${randomUUID()}`);
    mkdirSync(tempBase, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempBase)) {
      rmSync(tempBase, { recursive: true, force: true });
    }
  });

  it('returns current date analysis when it is non-empty', async () => {
    const targetDate = '2026-04-03';
    mkdirSync(join(tempBase, targetDate), { recursive: true });
    writeFileSync(join(tempBase, targetDate, 'synthesis-summary.md'), SYNTHESIS_MD, 'utf-8');
    writeFileSync(join(tempBase, targetDate, 'classification-results.md'), CLASSIFICATION_MD, 'utf-8');

    const result = await readLatestNonEmptyAnalysis(targetDate, 5, tempBase);
    expect(result.date).toBe(targetDate);
    expect(result.hasAnalysis).toBe(true);
    expect(result.synthesis?.keyThemes.length).toBeGreaterThan(0);
  });

  it('falls back to previous day when current is empty', async () => {
    const emptyDate = '2026-04-03';
    const goodDate = '2026-04-02';

    // Empty analysis for requested date
    mkdirSync(join(tempBase, emptyDate), { recursive: true });
    writeFileSync(join(tempBase, emptyDate, 'synthesis-summary.md'), '# Synthesis\n\nNo data.', 'utf-8');

    // Good analysis for previous date
    mkdirSync(join(tempBase, goodDate), { recursive: true });
    writeFileSync(join(tempBase, goodDate, 'synthesis-summary.md'), SYNTHESIS_MD, 'utf-8');
    writeFileSync(join(tempBase, goodDate, 'classification-results.md'), CLASSIFICATION_MD, 'utf-8');

    const result = await readLatestNonEmptyAnalysis(emptyDate, 5, tempBase);
    expect(result.date).toBe(goodDate);
    expect(result.hasAnalysis).toBe(true);
    expect(result.synthesis?.keyThemes.length).toBeGreaterThan(0);
  });

  it('returns original empty analysis when no non-empty analysis exists within range', async () => {
    const emptyDate = '2026-04-03';
    mkdirSync(join(tempBase, emptyDate), { recursive: true });
    writeFileSync(join(tempBase, emptyDate, 'synthesis-summary.md'), '# Synthesis\n\nNo data.', 'utf-8');

    const result = await readLatestNonEmptyAnalysis(emptyDate, 2, tempBase);
    expect(result.date).toBe(emptyDate);
  });

  it('returns stub when no analysis exists at all', async () => {
    const result = await readLatestNonEmptyAnalysis('2026-04-03', 5, tempBase);
    // Should return the empty stub for the original date
    expect(result.hasAnalysis).toBe(false);
  });

  it('returns empty result without lookback when date format is invalid', async () => {
    // Invalid date format should skip lookback and just return readDailyAnalysis result
    const result = await readLatestNonEmptyAnalysis('not-a-date', 5, tempBase);
    expect(result.hasAnalysis).toBe(false);
  });
});
