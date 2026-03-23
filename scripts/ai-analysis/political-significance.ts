/**
 * @module ai-analysis/political-significance
 * @description Political significance scoring for news generation pipelines.
 *
 * Produces a 0–100 score reflecting a document set's overall political
 * significance, plus an editorial urgency label. Used by:
 * - Real-time monitor to gate article generation (≥ 60 threshold)
 * - Breaking news generator to classify urgency
 * - Workflow-state coordinator to prioritise high-significance articles
 * - Article template for machine-readable metadata
 *
 * Scoring signals:
 * 1. Document type weight       (40 %)
 * 2. Volume / party breadth     (20 %)
 * 3. Opposition pressure        (20 %)
 * 4. Historical rarity / topic  (20 %)
 *
 * The function is **pure** — deterministic for the same input, no randomness.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../data-transformers/types.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Urgency label derived from the significance score */
export type UrgencyLabel = 'breaking' | 'major' | 'standard' | 'background';

/** Contribution of a single scoring signal to the overall score */
export interface SignalContribution {
  /** Human-readable signal name */
  signal: string;
  /** Weight (0-1) of this signal in the composite score */
  weight: number;
  /** Raw value (0-100) before weighting */
  value: number;
}

/** Full significance assessment for a set of documents */
export interface SignificanceScore {
  /** Composite score 0-100 */
  score: number;
  /** Editorial urgency label */
  urgency: UrgencyLabel;
  /** Per-signal breakdown */
  signals: SignalContribution[];
}

// ---------------------------------------------------------------------------
// Default threshold
// ---------------------------------------------------------------------------

/** Default minimum significance score for breaking-news generation */
export const BREAKING_NEWS_THRESHOLD = 60;

// ---------------------------------------------------------------------------
// Document type weights (normalised to 0-100 scale)
// ---------------------------------------------------------------------------

/**
 * Base weight per document type, reflecting parliamentary significance.
 * Values are on a 0-100 scale.
 */
const DOC_TYPE_WEIGHTS: Readonly<Record<string, number>> = {
  prop: 60,   // Government bill
  bet: 70,    // Committee report (pending vote)
  prot: 55,   // Plenary minutes
  ip: 45,     // Interpellation
  mot: 35,    // Motion
  skr: 50,    // Government communication
  sou: 55,    // Government official report (SOU)
  ds: 40,     // Departmental series
  dir: 35,    // Committee directive
  fr: 25,     // Written question
  frs: 25,    // Response to written question
  sfs: 65,    // Swedish Code of Statutes
  fpm: 40,    // EU factual memorandum
};

const DEFAULT_DOC_TYPE_WEIGHT = 30;

// ---------------------------------------------------------------------------
// Signal scorers (each returns 0-100)
// ---------------------------------------------------------------------------

/**
 * Score based on the most significant document type in the set.
 * Uses the maximum type weight across all documents.
 */
function scoreDocumentType(docs: RawDocument[]): number {
  if (docs.length === 0) return 0;
  let maxWeight = 0;
  for (const doc of docs) {
    const docType = (doc.doktyp || doc.documentType || '').toLowerCase();
    const weight = DOC_TYPE_WEIGHTS[docType] ?? DEFAULT_DOC_TYPE_WEIGHT;
    if (weight > maxWeight) maxWeight = weight;
  }
  return maxWeight;
}

/**
 * Score based on the volume of documents and breadth of parties involved.
 * - Multiple documents increase significance (diminishing returns)
 * - Multiple parties (signatories) increase significance
 */
function scoreVolume(docs: RawDocument[]): number {
  if (docs.length === 0) return 0;

  // Volume: logarithmic scaling for document count
  const volumeScore = Math.min(50, Math.round(Math.log2(docs.length + 1) * 15));

  // Party breadth: unique parties involved
  const parties = new Set<string>();
  for (const doc of docs) {
    const party = doc.parti;
    if (party) parties.add(party.toUpperCase());
  }
  const partyScore = Math.min(50, parties.size * 10);

  return Math.min(100, volumeScore + partyScore);
}

/**
 * Score based on opposition pressure: interpellations per unique minister.
 * High interpellation density (multiple IPs to same minister) signals
 * concentrated political pressure.
 */
function scoreOppositionPressure(docs: RawDocument[]): number {
  const interpellations = docs.filter(d =>
    (d.doktyp || d.documentType || '').toLowerCase() === 'ip'
  );
  if (interpellations.length === 0) return 0;

  // Count IPs per minister (mottagare)
  const ministerCounts = new Map<string, number>();
  for (const ip of interpellations) {
    const minister = ip.mottagare || 'unknown';
    ministerCounts.set(minister, (ministerCounts.get(minister) || 0) + 1);
  }

  // Max pressure on any single minister
  let maxPressure = 0;
  for (const count of ministerCounts.values()) {
    if (count > maxPressure) maxPressure = count;
  }

  // Scale: 1 IP = 20, 2 = 40, 3 = 60, 4 = 80, 5+ = 100
  return Math.min(100, maxPressure * 20);
}

/**
 * Score based on historical rarity: whether documents' topics appear
 * in a set of recently covered topics.
 *
 * Documents covering topics NOT seen in the recent window score higher
 * (novel topics are more newsworthy).
 *
 * @param docs - Current document set
 * @param recentTopics - Topics covered in the last 30 days (titles/keywords)
 */
function scoreTopicRarity(docs: RawDocument[], recentTopics: string[]): number {
  if (docs.length === 0) return 0;

  const recentLower = new Set(recentTopics.map(t => t.toLowerCase()));

  // Minimum length for a recent topic to be considered for substring matching.
  // Very short strings (≤ 3 chars) cause false positives (e.g. "tax" matching "syntax").
  const MIN_TOPIC_LENGTH_FOR_MATCH = 4;

  let novelCount = 0;
  for (const doc of docs) {
    const title = (doc.titel || doc.title || '').toLowerCase();
    if (title.length === 0) continue;
    // If none of the recent topics appear as a substring, it's novel
    let isNovel = true;
    for (const recent of recentLower) {
      if (recent.length >= MIN_TOPIC_LENGTH_FOR_MATCH && title.includes(recent)) {
        isNovel = false;
        break;
      }
    }
    if (isNovel) novelCount++;
  }

  const novelRatio = novelCount / docs.length;
  return Math.round(novelRatio * 100);
}

// ---------------------------------------------------------------------------
// Urgency classification
// ---------------------------------------------------------------------------

/**
 * Map a 0-100 score to an editorial urgency label.
 */
export function classifyUrgency(score: number): UrgencyLabel {
  if (score >= 80) return 'breaking';
  if (score >= 60) return 'major';
  if (score >= 40) return 'standard';
  return 'background';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Score a set of parliamentary documents for political significance.
 *
 * The function is **deterministic**: identical inputs always produce
 * identical outputs (no randomness, no date-dependent logic beyond
 * the explicit `recentTopics` parameter).
 *
 * @param docs         - Documents to score
 * @param recentTopics - Topics covered in the last 30 days (for rarity signal).
 *                       Pass an empty array when historical context is unavailable.
 * @returns            Composite significance score (0-100), urgency label, and signal breakdown
 */
export function scoreDocuments(
  docs: RawDocument[],
  recentTopics: string[] = [],
): SignificanceScore {
  const docTypeValue = scoreDocumentType(docs);
  const volumeValue = scoreVolume(docs);
  const pressureValue = scoreOppositionPressure(docs);
  const rarityValue = scoreTopicRarity(docs, recentTopics);

  const signals: SignalContribution[] = [
    { signal: 'documentType', weight: 0.40, value: docTypeValue },
    { signal: 'volume', weight: 0.20, value: volumeValue },
    { signal: 'oppositionPressure', weight: 0.20, value: pressureValue },
    { signal: 'topicRarity', weight: 0.20, value: rarityValue },
  ];

  const raw = signals.reduce((sum, s) => sum + s.value * s.weight, 0);
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    score,
    urgency: classifyUrgency(score),
    signals,
  };
}
