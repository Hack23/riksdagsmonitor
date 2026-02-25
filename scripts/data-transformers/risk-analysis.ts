/**
 * @module data-transformers/risk-analysis
 * @description Political risk analysis for parliamentary intelligence.
 * Provides coalition risk scoring, anomalous pattern detection, and
 * trend comparison capabilities for the Riksdagsmonitor platform.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { CIAContext } from './types.js';

/** Risk level categories for coalition stability assessment */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Component scores for coalition risk index */
export interface CoalitionRiskComponents {
  /** Voting discipline score (0-100, higher = more disciplined = lower risk) */
  votingDiscipline: number;
  /** Party defection risk (0-100, higher = more defections = higher risk) */
  defectionRisk: number;
  /** Confidence threshold proximity (0-100, higher = closer to losing majority = higher risk) */
  majorityMarginRisk: number;
}

/** Coalition risk index result */
export interface CoalitionRiskIndex {
  /** Composite risk score 0-100 (higher = more risk) */
  score: number;
  /** Categorical risk level */
  level: RiskLevel;
  /** Individual component scores */
  components: CoalitionRiskComponents;
  /** Human-readable summary */
  summary: string;
}

/** Anomaly flag detected in parliamentary data */
export interface AnomalyFlag {
  /** Type of anomaly detected */
  type: 'CROSS_PARTY_VOTE' | 'LOW_COHESION' | 'HIGH_DEFECTION' | 'NARROW_MAJORITY' | 'UNSTABLE_COALITION';
  /** Severity level */
  severity: RiskLevel;
  /** Human-readable description */
  description: string;
  /** Party or issue involved (if applicable) */
  subject?: string;
}

/** Trend direction indicator */
export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'VOLATILE';

/** Trend data point */
export interface TrendDataPoint {
  /** Time window label */
  window: '30d' | '90d' | '365d';
  /** Score or value at this window */
  value: number;
  /** Direction of trend relative to current */
  direction: TrendDirection;
  /** Percentage change */
  changePercent: number;
}

/** Trend comparison result */
export interface TrendComparison {
  /** Trend data across time windows */
  trends: TrendDataPoint[];
  /** Overall trajectory */
  overallDirection: TrendDirection;
  /** Key insights from trend analysis */
  insights: string[];
}

/**
 * Map a numeric stability score to a risk level.
 * Higher stability = lower risk.
 */
function stabilityToRiskLevel(stabilityScore: number): RiskLevel {
  if (stabilityScore >= 75) return 'LOW';
  if (stabilityScore >= 50) return 'MEDIUM';
  if (stabilityScore >= 25) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Determine categorical risk level from composite score.
 */
function scoreToRiskLevel(score: number): RiskLevel {
  if (score < 25) return 'LOW';
  if (score < 50) return 'MEDIUM';
  if (score < 75) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Calculate the Coalition Risk Index from CIA intelligence context.
 *
 * Combines three components:
 * - Voting discipline: derived from party cohesion scores
 * - Defection risk: derived from defection probability
 * - Majority margin risk: derived from the coalition's majority margin
 *
 * @param data - CIA intelligence context (may be undefined for safe fallback)
 * @returns Structured coalition risk index
 */
export function calculateCoalitionRiskIndex(data: CIAContext | undefined): CoalitionRiskIndex {
  if (!data) {
    return {
      score: 50,
      level: 'MEDIUM',
      components: {
        votingDiscipline: 50,
        defectionRisk: 50,
        majorityMarginRisk: 50,
      },
      summary: 'Insufficient data to assess coalition risk.',
    };
  }

  const { coalitionStability, partyPerformance } = data;

  // Component 1: Voting discipline (average cohesion score across parties, inverted to risk)
  const cohesionScores = partyPerformance
    .map(p => p.metrics.cohesionScore ?? 0)
    .filter(s => s > 0);
  const avgCohesion = cohesionScores.length > 0
    ? cohesionScores.reduce((a, b) => a + b, 0) / cohesionScores.length
    : 50;
  // Lower cohesion = higher discipline risk (invert)
  const votingDiscipline = Math.max(0, Math.min(100, 100 - avgCohesion));

  // Component 2: Defection risk (directly from defection probability, scaled 0-100)
  const defectionRisk = Math.max(0, Math.min(100,
    (coalitionStability.defectionProbability ?? 0) * 100
  ));

  // Component 3: Majority margin risk (lower margin = higher risk)
  // majorityMargin of 0 = critical (50 point risk), margin of 50+ = low risk
  const margin = coalitionStability.majorityMargin ?? 0;
  const majorityMarginRisk = Math.max(0, Math.min(100,
    margin <= 0 ? 90 : Math.max(5, 50 - margin * 2)
  ));

  // Composite score: weighted average (defection 40%, discipline 30%, margin 30%)
  const score = Math.round(
    defectionRisk * 0.4 +
    votingDiscipline * 0.3 +
    majorityMarginRisk * 0.3
  );

  const level = scoreToRiskLevel(score);
  const stabilityLevel = stabilityToRiskLevel(coalitionStability.stabilityScore ?? 50);

  const summary = level === 'CRITICAL'
    ? `Coalition faces critical stability risk. Defection probability is elevated and majority margin is dangerously thin.`
    : level === 'HIGH'
    ? `Coalition stability is under strain. Voting discipline issues and defection risk require monitoring.`
    : level === 'MEDIUM'
    ? `Coalition shows moderate risk indicators. Stability score is ${coalitionStability.stabilityScore ?? 'unknown'} (${stabilityLevel}).`
    : `Coalition demonstrates low risk. Voting discipline is strong and majority margin is adequate.`;

  return {
    score,
    level,
    components: {
      votingDiscipline,
      defectionRisk,
      majorityMarginRisk,
    },
    summary,
  };
}

/**
 * Detect anomalous patterns in parliamentary voting and coalition data.
 *
 * Flags:
 * - Cross-party voting alignments where opposition aligns with coalition
 * - Low party cohesion scores
 * - High defection probability
 * - Narrow majority margins
 * - General coalition instability
 *
 * @param data - CIA intelligence context (may be undefined)
 * @returns Array of anomaly flags (empty if no anomalies detected)
 */
export function detectAnomalousPatterns(data: CIAContext | undefined): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];

  if (!data) return flags;

  const { coalitionStability, partyPerformance, votingPatterns } = data;

  // Check for coalition instability
  if (coalitionStability.stabilityScore < 40) {
    flags.push({
      type: 'UNSTABLE_COALITION',
      severity: coalitionStability.stabilityScore < 20 ? 'CRITICAL' : 'HIGH',
      description: `Coalition stability score is critically low at ${coalitionStability.stabilityScore}.`,
    });
  }

  // Check for narrow majority
  if (coalitionStability.majorityMargin <= 2) {
    flags.push({
      type: 'NARROW_MAJORITY',
      severity: coalitionStability.majorityMargin <= 0 ? 'CRITICAL' : 'HIGH',
      description: `Coalition majority margin is only ${coalitionStability.majorityMargin} seat(s) — any defection risks government defeat.`,
    });
  }

  // Check for high defection probability
  if (coalitionStability.defectionProbability > 0.3) {
    flags.push({
      type: 'HIGH_DEFECTION',
      severity: coalitionStability.defectionProbability > 0.6 ? 'CRITICAL' : 'HIGH',
      description: `Defection probability is elevated at ${(coalitionStability.defectionProbability * 100).toFixed(0)}%.`,
    });
  }

  // Check for low party cohesion
  partyPerformance.forEach(party => {
    const cohesion = party.metrics.cohesionScore ?? 100;
    if (cohesion < 60) {
      flags.push({
        type: 'LOW_COHESION',
        severity: cohesion < 40 ? 'HIGH' : 'MEDIUM',
        description: `${party.partyName} shows low voting cohesion at ${cohesion.toFixed(0)}% — internal divisions are likely.`,
        subject: party.partyName,
      });
    }
  });

  // Check for cross-party voting patterns (opposition aligning with coalition on key issues)
  if (votingPatterns?.keyIssues) {
    votingPatterns.keyIssues.forEach(issue => {
      const crossPartyRate = issue.crossPartyVotes ?? 0;
      if (crossPartyRate > 30) {
        flags.push({
          type: 'CROSS_PARTY_VOTE',
          severity: crossPartyRate > 60 ? 'HIGH' : 'MEDIUM',
          description: `Unusually high cross-party voting (${crossPartyRate}%) detected on topic: ${issue.topic}.`,
          subject: issue.topic,
        });
      }
    });
  }

  return flags;
}

/**
 * Generate 30/90/365-day trend comparison for coalition stability.
 *
 * Uses the stability score and party performance trends to project
 * historical trajectory. Since actual historical data is aggregated
 * in the CIA context, this function derives directional trends from
 * available trend indicators.
 *
 * @param data - CIA intelligence context (may be undefined)
 * @returns Trend comparison with direction indicators and insights
 */
export function generateTrendComparison(data: CIAContext | undefined): TrendComparison {
  if (!data) {
    return {
      trends: [
        { window: '30d', value: 50, direction: 'STABLE', changePercent: 0 },
        { window: '90d', value: 50, direction: 'STABLE', changePercent: 0 },
        { window: '365d', value: 50, direction: 'STABLE', changePercent: 0 },
      ],
      overallDirection: 'STABLE',
      insights: ['Insufficient data for trend analysis.'],
    };
  }

  const currentScore = data.coalitionStability.stabilityScore ?? 50;

  // Derive trend from party-level support trends
  let improvingCount = 0;
  let decliningCount = 0;

  data.partyPerformance.forEach(party => {
    if (party.trends.supportTrend === 'improving' || party.trends.activityTrend === 'increasing') {
      improvingCount++;
    } else if (party.trends.supportTrend === 'declining' || party.trends.activityTrend === 'decreasing') {
      decliningCount++;
    }
  });

  const netTrendBias = improvingCount - decliningCount;

  // Estimate past values based on current + trend bias
  // These are derived estimates, not historical data points
  const shortTermDelta = netTrendBias > 0 ? -3 : netTrendBias < 0 ? 3 : 0;
  const medTermDelta = netTrendBias > 0 ? -6 : netTrendBias < 0 ? 6 : 0;
  const longTermDelta = netTrendBias > 0 ? -10 : netTrendBias < 0 ? 10 : 0;

  const score30d = Math.max(0, Math.min(100, currentScore + shortTermDelta));
  const score90d = Math.max(0, Math.min(100, currentScore + medTermDelta));
  const score365d = Math.max(0, Math.min(100, currentScore + longTermDelta));

  function directionFromChange(change: number): TrendDirection {
    if (Math.abs(change) < 2) return 'STABLE';
    if (change > 0) return 'IMPROVING';
    if (change < -5) return 'VOLATILE';
    return 'DECLINING';
  }

  const change30d = currentScore - score30d;
  const change90d = currentScore - score90d;
  const change365d = currentScore - score365d;

  const trends: TrendDataPoint[] = [
    {
      window: '30d',
      value: score30d,
      direction: directionFromChange(change30d),
      changePercent: score30d > 0 ? Math.round((change30d / score30d) * 100) : 0,
    },
    {
      window: '90d',
      value: score90d,
      direction: directionFromChange(change90d),
      changePercent: score90d > 0 ? Math.round((change90d / score90d) * 100) : 0,
    },
    {
      window: '365d',
      value: score365d,
      direction: directionFromChange(change365d),
      changePercent: score365d > 0 ? Math.round((change365d / score365d) * 100) : 0,
    },
  ];

  // Determine overall direction
  const overallChange = change365d;
  const overallDirection: TrendDirection = directionFromChange(overallChange);

  // Generate insights
  const insights: string[] = [];

  if (overallDirection === 'IMPROVING') {
    insights.push('Coalition stability has been trending upward over the past year.');
  } else if (overallDirection === 'DECLINING') {
    insights.push('Coalition stability shows a declining trend over the past year — monitor closely.');
  } else if (overallDirection === 'VOLATILE') {
    insights.push('Coalition stability is highly volatile — significant shifts detected in trajectory.');
  } else {
    insights.push('Coalition stability has remained broadly stable over the observed period.');
  }

  if (data.coalitionStability.majorityMargin <= 5) {
    insights.push(`Thin majority margin of ${data.coalitionStability.majorityMargin} amplifies trend sensitivity.`);
  }

  if (data.partyPerformance.length > 0) {
    const highActivity = data.partyPerformance
      .filter(p => p.trends.activityTrend === 'increasing')
      .map(p => p.partyName);
    if (highActivity.length > 0) {
      insights.push(`Increasing legislative activity from: ${highActivity.join(', ')}.`);
    }
  }

  return {
    trends,
    overallDirection,
    insights,
  };
}
