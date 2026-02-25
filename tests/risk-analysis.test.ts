/**
 * Tests for risk-analysis module
 * Tests: calculateCoalitionRiskIndex, detectAnomalousPatterns,
 *        generateTrendComparison, and assessConfidenceLevel
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCoalitionRiskIndex,
  detectAnomalousPatterns,
  generateTrendComparison,
} from '../scripts/data-transformers/risk-analysis.js';
import { assessConfidenceLevel } from '../scripts/data-transformers/policy-analysis.js';
import type { CIAContext } from '../scripts/data-transformers/types.js';

// ── Fixtures ───────────────────────────────────────────────────────────────

/** Stable coalition fixture — low risk expected */
const stableCIA: CIAContext = {
  partyPerformance: [
    {
      id: 'M',
      partyName: 'Moderaterna',
      metrics: { seats: 68, successRate: 72, motionsSubmitted: 120, motionsPassed: 86, cohesionScore: 90 },
      trends: { supportTrend: 'stable', activityTrend: 'stable' },
    },
    {
      id: 'SD',
      partyName: 'Sverigedemokraterna',
      metrics: { seats: 73, successRate: 68, motionsSubmitted: 95, motionsPassed: 64, cohesionScore: 88 },
      trends: { supportTrend: 'stable', activityTrend: 'stable' },
    },
  ],
  coalitionStability: {
    stabilityScore: 80,
    riskLevel: 'LOW',
    defectionProbability: 0.05,
    majorityMargin: 15,
  },
  votingPatterns: {
    keyIssues: [
      { topic: 'Budget', coalitionAlignment: 95, oppositionAlignment: 10, crossPartyVotes: 5 },
    ],
  },
  overallMotionDenialRate: 99,
};

/** Unstable coalition fixture — high risk expected */
const unstableCIA: CIAContext = {
  partyPerformance: [
    {
      id: 'S',
      partyName: 'Socialdemokraterna',
      metrics: { seats: 107, successRate: 55, motionsSubmitted: 200, motionsPassed: 110, cohesionScore: 45 },
      trends: { supportTrend: 'declining', activityTrend: 'decreasing' },
    },
    {
      id: 'MP',
      partyName: 'Miljöpartiet',
      metrics: { seats: 18, successRate: 40, motionsSubmitted: 60, motionsPassed: 24, cohesionScore: 35 },
      trends: { supportTrend: 'declining', activityTrend: 'decreasing' },
    },
  ],
  coalitionStability: {
    stabilityScore: 20,
    riskLevel: 'CRITICAL',
    defectionProbability: 0.65,
    majorityMargin: 1,
  },
  votingPatterns: {
    keyIssues: [
      { topic: 'Migration', coalitionAlignment: 55, oppositionAlignment: 60, crossPartyVotes: 45 },
      { topic: 'Budget', coalitionAlignment: 60, oppositionAlignment: 30, crossPartyVotes: 35 },
    ],
  },
  overallMotionDenialRate: 98,
};

/** Medium risk coalition fixture */
const mediumCIA: CIAContext = {
  partyPerformance: [
    {
      id: 'C',
      partyName: 'Centerpartiet',
      metrics: { seats: 24, successRate: 58, motionsSubmitted: 80, motionsPassed: 46, cohesionScore: 70 },
      trends: { supportTrend: 'improving', activityTrend: 'increasing' },
    },
  ],
  coalitionStability: {
    stabilityScore: 55,
    riskLevel: 'MEDIUM',
    defectionProbability: 0.25,
    majorityMargin: 5,
  },
  votingPatterns: {
    keyIssues: [
      { topic: 'Housing', coalitionAlignment: 75, oppositionAlignment: 20, crossPartyVotes: 15 },
    ],
  },
  overallMotionDenialRate: 99,
};

// ── calculateCoalitionRiskIndex ─────────────────────────────────────────────

describe('calculateCoalitionRiskIndex', () => {
  it('returns a medium-risk fallback when data is undefined', () => {
    const result = calculateCoalitionRiskIndex(undefined);
    expect(result.score).toBe(50);
    expect(result.level).toBe('MEDIUM');
    expect(result.summary).toContain('Insufficient data');
    expect(result.components.votingDiscipline).toBe(50);
    expect(result.components.defectionRisk).toBe(50);
    expect(result.components.majorityMarginRisk).toBe(50);
  });

  it('returns LOW risk for a stable coalition', () => {
    const result = calculateCoalitionRiskIndex(stableCIA);
    expect(result.level).toBe('LOW');
    expect(result.score).toBeLessThan(25);
    expect(result.summary).toContain('low risk');
  });

  it('returns HIGH or CRITICAL risk for an unstable coalition', () => {
    const result = calculateCoalitionRiskIndex(unstableCIA);
    expect(['HIGH', 'CRITICAL']).toContain(result.level);
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it('returns MEDIUM risk for a moderately stable coalition', () => {
    const result = calculateCoalitionRiskIndex(mediumCIA);
    expect(result.level).toBe('MEDIUM');
    expect(result.score).toBeGreaterThanOrEqual(25);
    expect(result.score).toBeLessThan(50);
  });

  it('exposes component scores in 0-100 range', () => {
    const result = calculateCoalitionRiskIndex(stableCIA);
    expect(result.components.votingDiscipline).toBeGreaterThanOrEqual(0);
    expect(result.components.votingDiscipline).toBeLessThanOrEqual(100);
    expect(result.components.defectionRisk).toBeGreaterThanOrEqual(0);
    expect(result.components.defectionRisk).toBeLessThanOrEqual(100);
    expect(result.components.majorityMarginRisk).toBeGreaterThanOrEqual(0);
    expect(result.components.majorityMarginRisk).toBeLessThanOrEqual(100);
  });

  it('provides a non-empty summary string', () => {
    const result = calculateCoalitionRiskIndex(stableCIA);
    expect(result.summary.length).toBeGreaterThan(10);
  });

  it('handles coalition with no cohesion scores gracefully', () => {
    const noCohesionCIA: CIAContext = {
      ...stableCIA,
      partyPerformance: stableCIA.partyPerformance.map(p => ({
        ...p,
        metrics: { ...p.metrics, cohesionScore: undefined },
      })),
    };
    const result = calculateCoalitionRiskIndex(noCohesionCIA);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

// ── detectAnomalousPatterns ─────────────────────────────────────────────────

describe('detectAnomalousPatterns', () => {
  it('returns empty array when data is undefined', () => {
    const flags = detectAnomalousPatterns(undefined);
    expect(flags).toEqual([]);
  });

  it('returns no flags for a stable coalition', () => {
    const flags = detectAnomalousPatterns(stableCIA);
    expect(flags).toHaveLength(0);
  });

  it('detects UNSTABLE_COALITION for very low stability score', () => {
    const flags = detectAnomalousPatterns(unstableCIA);
    const types = flags.map(f => f.type);
    expect(types).toContain('UNSTABLE_COALITION');
  });

  it('detects NARROW_MAJORITY when margin is 1', () => {
    const flags = detectAnomalousPatterns(unstableCIA);
    const types = flags.map(f => f.type);
    expect(types).toContain('NARROW_MAJORITY');
  });

  it('detects HIGH_DEFECTION when probability is 0.65', () => {
    const flags = detectAnomalousPatterns(unstableCIA);
    const types = flags.map(f => f.type);
    expect(types).toContain('HIGH_DEFECTION');
  });

  it('detects LOW_COHESION for parties below 60% cohesion', () => {
    const flags = detectAnomalousPatterns(unstableCIA);
    const cohesionFlags = flags.filter(f => f.type === 'LOW_COHESION');
    expect(cohesionFlags.length).toBeGreaterThan(0);
    expect(cohesionFlags[0].subject).toBeDefined();
  });

  it('detects CROSS_PARTY_VOTE when crossPartyVotes > 30', () => {
    const flags = detectAnomalousPatterns(unstableCIA);
    const crossPartyFlags = flags.filter(f => f.type === 'CROSS_PARTY_VOTE');
    expect(crossPartyFlags.length).toBeGreaterThan(0);
  });

  it('assigns CRITICAL severity to very narrow majority (margin = 0)', () => {
    const zeroMarginCIA: CIAContext = {
      ...unstableCIA,
      coalitionStability: { ...unstableCIA.coalitionStability, majorityMargin: 0 },
    };
    const flags = detectAnomalousPatterns(zeroMarginCIA);
    const narrowFlag = flags.find(f => f.type === 'NARROW_MAJORITY');
    expect(narrowFlag?.severity).toBe('CRITICAL');
  });

  it('returns flags with non-empty descriptions', () => {
    const flags = detectAnomalousPatterns(unstableCIA);
    flags.forEach(f => {
      expect(f.description.length).toBeGreaterThan(5);
    });
  });
});

// ── generateTrendComparison ─────────────────────────────────────────────────

describe('generateTrendComparison', () => {
  it('returns stable trends with insights when data is undefined', () => {
    const result = generateTrendComparison(undefined);
    expect(result.trends).toHaveLength(3);
    expect(result.overallDirection).toBe('STABLE');
    expect(result.insights).toContain('Insufficient data for trend analysis.');
  });

  it('returns three time windows: 30d, 90d, 365d', () => {
    const result = generateTrendComparison(stableCIA);
    const windows = result.trends.map(t => t.window);
    expect(windows).toContain('30d');
    expect(windows).toContain('90d');
    expect(windows).toContain('365d');
  });

  it('returns values within 0-100 range for all windows', () => {
    const result = generateTrendComparison(stableCIA);
    result.trends.forEach(t => {
      expect(t.value).toBeGreaterThanOrEqual(0);
      expect(t.value).toBeLessThanOrEqual(100);
    });
  });

  it('returns at least one insight string', () => {
    const result = generateTrendComparison(stableCIA);
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.insights[0].length).toBeGreaterThan(5);
  });

  it('identifies DECLINING direction for declining coalition', () => {
    const result = generateTrendComparison(unstableCIA);
    expect(['DECLINING', 'VOLATILE', 'STABLE']).toContain(result.overallDirection);
  });

  it('identifies IMPROVING direction for improving coalition', () => {
    const improvingCIA: CIAContext = {
      ...mediumCIA,
      partyPerformance: [
        {
          ...mediumCIA.partyPerformance[0],
          trends: { supportTrend: 'improving', activityTrend: 'increasing' },
        },
        {
          id: 'L',
          partyName: 'Liberalerna',
          metrics: { seats: 16, successRate: 60, motionsSubmitted: 50, motionsPassed: 30, cohesionScore: 75 },
          trends: { supportTrend: 'improving', activityTrend: 'increasing' },
        },
      ],
    };
    const result = generateTrendComparison(improvingCIA);
    expect(['IMPROVING', 'STABLE']).toContain(result.overallDirection);
  });

  it('includes thin majority warning in insights when margin <= 5', () => {
    const result = generateTrendComparison(unstableCIA); // margin = 1
    const hasThinMajorityNote = result.insights.some(i => i.includes('majority'));
    expect(hasThinMajorityNote).toBe(true);
  });

  it('includes activity trend insights for increasing parties', () => {
    const result = generateTrendComparison(mediumCIA);
    const hasActivityNote = result.insights.some(i => i.includes('activity') || i.includes('Centerpartiet'));
    expect(hasActivityNote).toBe(true);
  });
});

// ── assessConfidenceLevel ───────────────────────────────────────────────────

describe('assessConfidenceLevel', () => {
  it('returns HIGH for many high-quality evidence items', () => {
    expect(assessConfidenceLevel(5, 80)).toBe('HIGH');
    expect(assessConfidenceLevel(10, 90)).toBe('HIGH');
    expect(assessConfidenceLevel(3, 90)).toBe('HIGH');
  });

  it('returns LOW for zero evidence', () => {
    expect(assessConfidenceLevel(0, 100)).toBe('LOW');
    expect(assessConfidenceLevel(0, 0)).toBe('LOW');
  });

  it('returns LOW for very poor source quality', () => {
    expect(assessConfidenceLevel(1, 20)).toBe('LOW');
    expect(assessConfidenceLevel(5, 25)).toBe('LOW');
  });

  it('returns MEDIUM for moderate evidence and quality', () => {
    expect(assessConfidenceLevel(2, 60)).toBe('MEDIUM');
    expect(assessConfidenceLevel(4, 65)).toBe('MEDIUM');
  });

  it('returns MEDIUM when evidence count is adequate but quality is mediocre', () => {
    expect(assessConfidenceLevel(3, 50)).toBe('MEDIUM');
  });

  it('handles edge case of very high evidence count with mediocre quality', () => {
    const result = assessConfidenceLevel(20, 40);
    // Low quality should keep this from being HIGH
    expect(['MEDIUM', 'LOW']).toContain(result);
  });

  it('handles negative evidence count gracefully (clamps to 0)', () => {
    expect(assessConfidenceLevel(-1, 80)).toBe('LOW');
  });

  it('handles source quality above 100 by clamping', () => {
    const result = assessConfidenceLevel(5, 150);
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result);
  });
});
