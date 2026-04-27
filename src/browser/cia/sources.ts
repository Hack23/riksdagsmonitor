/**
 * @module CIA/Sources
 * @category Intelligence Platform - Data Acquisition & Pipeline Management
 *
 * @description
 * CIA CSV source URL configuration and class-level political-system
 * constants used across the CIA data pipeline.
 *
 * Extracted from `data-loader.ts` so the URL inventory can be unit-tested,
 * imported by alternative pipeline implementations, and modified without
 * cracking open the orchestrator class. Pure data — no runtime side effects.
 *
 * @author Hack23 AB - Data Pipeline Engineering
 * @license Apache-2.0
 * @since 2026
 */

import type { CSVSourceMap } from './types.js';

/** The 8 parties represented in the Swedish Riksdag. */
export const RIKSDAG_PARTIES: readonly string[] = Object.freeze([
  'S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'
]);

/** Mapping of full Swedish committee names to their Riksdag org codes. */
export const COMMITTEE_ORG_CODES: Readonly<Record<string, string>> = Object.freeze({
  'Konstitutionsutskottet': 'KU',
  'Civilutskottet': 'CU',
  'Trafikutskottet': 'TU',
  'Näringsutskottet': 'NU',
  'Miljö- och jordbruksutskottet': 'MJU',
  'Utrikesutskottet': 'UU',
  'Arbetsmarknadsutskottet': 'AU',
  'Socialförsäkringsutskottet': 'SfU',
  'Socialutskottet': 'SoU',
  'Justitieutskottet': 'JuU',
  'Skatteutskottet': 'SkU',
  'EU-nämnden': 'EUN',
  'Kulturutskottet': 'KrU',
  'Utbildningsutskottet': 'UbU',
  'Finansutskottet': 'FiU',
  'Försvarsutskottet': 'FöU',
  'Lagutskottet': 'LU',
  'Bostadsutskottet': 'BoU'
});

/**
 * Heuristic divisor to estimate meetings/year from committee document counts.
 * Assumption: ~25 published documents per active committee meeting.
 */
export const COMMITTEE_DOCS_PER_MEETING_ESTIMATE = 25;

/**
 * CSV data source definitions – maps to real PostgreSQL view exports.
 *
 * Both the outer map and each inner descriptor are deep-frozen so that
 * historical `CIADataLoader.CSV_SOURCES` consumers cannot mutate the shared
 * source inventory.
 */
const CSV_SOURCES_RAW: CSVSourceMap = {
  personStatus: {
    local: 'distribution_person_status.csv',
    description: 'Active MP counts by status'
  },
  riskByParty: {
    local: 'distribution_risk_by_party.csv',
    description: 'Risk levels per party'
  },
  riskLevels: {
    local: 'distribution_politician_risk_levels.csv',
    description: 'Aggregate risk level distribution'
  },
  annualBallots: {
    local: 'voting/distribution_annual_ballots.csv',
    description: 'Annual ballot/vote counts'
  },
  crisisResilience: {
    local: 'risk/distribution_crisis_resilience.csv',
    description: 'Coalition stability/resilience scores'
  },
  partyPerformance: {
    local: 'party/distribution_party_performance.csv',
    description: 'Party metrics (docs, motions, performance level)'
  },
  partyMetrics: {
    local: 'party/view_party_performance_metrics_sample.csv',
    description: 'Full party metrics with win rate, rebel rate, absence rate'
  },
  partyMomentum: {
    local: 'party/distribution_party_momentum.csv',
    description: 'Party trend direction and stability'
  },
  partyMembers: {
    local: 'party/distribution_annual_party_members.csv',
    description: 'Annual party membership counts'
  },
  influenceMetrics: {
    local: 'politician/view_riksdagen_politician_influence_metrics_sample.csv',
    description: 'MP influence scores and network connections'
  },
  riskSummary: {
    local: 'politician/view_politician_risk_summary_sample.csv',
    description: 'MP risk scores and assessments'
  },
  committeeProductivity: {
    local: 'committee/distribution_committee_productivity.csv',
    description: 'Committee productivity and member counts'
  },
  committeeActivity: {
    local: 'committee/distribution_committee_activity.csv',
    description: 'Committee document counts'
  },
  partyEffectiveness: {
    local: 'party/distribution_party_effectiveness_trends.csv',
    description: 'Party effectiveness trends with win rate'
  },
  electionForecast: {
    local: 'election/election_forecast.csv',
    description: 'Election 2026 seat predictions per party'
  },
  coalitionScenarios: {
    local: 'election/coalition_scenarios.csv',
    description: 'Coalition scenario probability modeling'
  },
  coalitionAlignment: {
    local: 'party/distribution_coalition_alignment.csv',
    description: 'Real party-pair voting alignment rates'
  },
  genderByParty: {
    local: 'party/distribution_gender_by_party.csv',
    description: 'Gender distribution per party'
  },
  experienceByParty: {
    local: 'party/distribution_experience_by_party.csv',
    description: 'Experience levels per party'
  },
  ministryEffectiveness: {
    local: 'ministry/distribution_ministry_effectiveness.csv',
    description: 'Ministry effectiveness assessments'
  },
  annualDocTypes: {
    local: 'voting/distribution_annual_document_types.csv',
    description: 'Annual document type counts'
  },
  decisionTrends: {
    local: 'voting/distribution_decision_trends.csv',
    description: 'Decision approval trends over time'
  },
  electionRegions: {
    local: 'election/distribution_election_regions.csv',
    description: 'MPs per election region'
  },
  governmentRoles: {
    local: 'view_riksdagen_goverment_role_member_sample.csv',
    description: 'Government minister role assignments'
  },
  riskEvolution: {
    local: 'distribution_risk_evolution_temporal.csv',
    description: 'Risk score changes over time'
  },
  behavioralPatterns: {
    local: 'party/distribution_behavioral_patterns_by_party.csv',
    description: 'Behavioral risk patterns per party'
  }
};

/** Deep-frozen CSV source inventory shared across the CIA pipeline. */
export const CSV_SOURCES: Readonly<CSVSourceMap> = Object.freeze(
  Object.fromEntries(
    Object.entries(CSV_SOURCES_RAW).map(([key, value]) => [key, Object.freeze({ ...value })])
  )
) as Readonly<CSVSourceMap>;
