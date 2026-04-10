/**
 * @module Types/Editorial
 * @description Editorial pillar types for the five-pillar analysis framework,
 * plus structured data types for new rich article sections (What Happens Next,
 * Winners & Losers, FAQ).
 */

import type { Language } from './language.js';

/** The four content pillars used in evening analysis articles (plus the lead paragraph) */
export type EditorialPillar =
  | 'parliamentaryPulse'
  | 'governmentWatch'
  | 'oppositionDynamics'
  | 'lookingAhead';

/** Localized heading strings for all four editorial pillars */
export interface PillarHeadings {
  parliamentaryPulse: string;
  governmentWatch: string;
  oppositionDynamics: string;
  lookingAhead: string;
}

/** Full set of pillar headings for all 14 supported languages */
export type LocalizedPillarHeadings = Record<Language, PillarHeadings>;

// ---------------------------------------------------------------------------
// What Happens Next — legislative timeline entries
// ---------------------------------------------------------------------------

/**
 * A single step in the legislative pipeline rendered in the
 * "What Happens Next" timeline section.
 */
export interface WhatHappensNextItem {
  /** ISO date string for the event (YYYY-MM-DD) */
  date: string;
  /** Short description of the event, e.g. "Second reading vote" */
  event: string;
  /** Relative political significance of this step */
  significance: 'high' | 'medium' | 'low';
}

// ---------------------------------------------------------------------------
// Winners & Losers — political actor outcome entries
// ---------------------------------------------------------------------------

/**
 * A single actor entry in the "Winners & Losers" analysis section.
 */
export interface WinnersLosersEntry {
  /** Named political actor (party, minister, interest group) */
  actor: string;
  /** Net outcome for this actor given the legislative action */
  outcome: 'wins' | 'loses' | 'mixed';
  /**
   * One-sentence evidence statement justifying the outcome classification.
   * Must cite a specific document, vote, or statement.
   */
  evidence: string;
}

// ---------------------------------------------------------------------------
// FAQ — structured Q&A for Schema.org FAQPage + reader engagement
// ---------------------------------------------------------------------------

/**
 * A single question/answer pair for the FAQ section.
 * Rendered both as HTML and as Schema.org FAQPage structured data.
 */
export interface FAQItem {
  /** Reader-facing question */
  question: string;
  /** Concise, factual answer (1–3 sentences) */
  answer: string;
}
