/**
 * @module data-transformers/content-generators/impact-helpers
 * @description Political impact and legislative consequences analysis helpers.
 * Generates AI_MUST_REPLACE stub paragraphs for political impact,
 * implementation consequences, and related analysis sections.
 *
 * ⚠️ DEPRECATED FOR ANALYSIS GENERATION (v3.0, 2026-04-02):
 * All functions in this module produce fallback stub text.
 * AI agents in agentic workflow .md files MUST overwrite this
 * template-generated text with genuine political intelligence.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../types.js';
import type { CIAContext } from '../types.js';
import type { Language } from '../../types/language.js';

// ---------------------------------------------------------------------------
// Political impact analysis (AI_MUST_REPLACE stubs)
// ---------------------------------------------------------------------------

function propImpactText(_lang: Language | string, n: number): string {
  return `<!-- AI_MUST_REPLACE: political_impact — DATA: ${n} government proposition(s) filed. Analyse the specific political impact: which propositions face opposition, what coalition dynamics are at play, which policy areas face the strongest resistance, and what the vote arithmetic looks like. Output MUST be in the article's language. -->`;
}

function betImpactText(_lang: Language | string, n: number): string {
  return `<!-- AI_MUST_REPLACE: political_impact — DATA: ${n} committee report(s) issued. Analyse the political significance of these specific committee recommendations: key votes, reservation patterns, which parties are aligned or divided, and implications for chamber votes. Output MUST be in the article's language. -->`;
}

function motImpactText(_lang: Language | string, n: number): string {
  return `<!-- AI_MUST_REPLACE: political_impact — DATA: ${n} opposition motion(s) filed. Analyse the strategic purpose of these specific motions: which target government vulnerabilities, which signal election campaign themes, and what they reveal about opposition coordination. Output MUST be in the article's language. -->`;
}

function thinMajorityImpactText(_lang: Language | string, margin: number): string {
  return `<!-- AI_MUST_REPLACE: majority_impact — DATA: majority margin ${margin} seat(s). Analyse how this thin margin affects these specific legislative items and which measures are most vulnerable to defection. Output MUST be in the article's language. -->`;
}

function genericImpactText(_lang: Language | string): string {
  return '<!-- AI_MUST_REPLACE: political_impact — Write specific analysis of the political impact of these items, naming parties, citing vote margins, and identifying which measures will pass or face challenges. Output MUST be in the article\'s language. -->';
}

/**
 * Generate a political impact analysis paragraph for the deep analysis section.
 * Returns an AI_MUST_REPLACE stub that AI agents must overwrite.
 */
export function generateImpactAnalysis(docs: RawDocument[], lang: Language | string, cia: CIAContext | undefined): string {
  const parts: string[] = [];

  const propCount = docs.filter(d => d.doktyp === 'prop').length;
  const motCount = docs.filter(d => d.doktyp === 'mot').length;
  const betCount = docs.filter(d => d.doktyp === 'bet').length;

  if (propCount > 0) {
    parts.push(propImpactText(lang, propCount));
  }
  if (betCount > 0) {
    parts.push(betImpactText(lang, betCount));
  }
  if (motCount > 0) {
    parts.push(motImpactText(lang, motCount));
  }

  if (cia) {
    const margin = cia.coalitionStability?.majorityMargin ?? 0;
    if (margin <= 5) {
      parts.push(thinMajorityImpactText(lang, margin));
    }
  }

  return parts.join(' ') || genericImpactText(lang);
}

// ---------------------------------------------------------------------------
// Legislative consequences analysis (AI_MUST_REPLACE stubs)
// ---------------------------------------------------------------------------

function propConsequencesText(_lang: Language | string, n: number): string {
  return `<!-- AI_MUST_REPLACE: consequences — DATA: ${n} proposition(s) pending. Analyse the specific implementation consequences: which agencies must act, what regulatory changes are required, budget implications, and timeline for each proposition. Output MUST be in the article's language. -->`;
}

function motConsequencesText(_lang: Language | string, n: number): string {
  return `<!-- AI_MUST_REPLACE: consequences — DATA: ${n} opposition motion(s) pending. Analyse the strategic consequences: how will rejection/acceptance affect party positioning, which motions establish new policy alternatives, and what campaign value do they carry. Output MUST be in the article's language. -->`;
}

function genericConsequencesText(_lang: Language | string): string {
  return '<!-- AI_MUST_REPLACE: consequences — Write specific analysis of the consequences and next steps for these items, including committee timelines, expected vote dates, implementation requirements, and political ramifications. Output MUST be in the article\'s language. -->';
}

/**
 * Generate a legislative consequences analysis paragraph for the deep analysis section.
 * Returns AI_MUST_REPLACE stubs that AI agents must overwrite.
 */
export function generateConsequencesAnalysis(docs: RawDocument[], lang: Language | string, _articleType: string): string {
  const propCount = docs.filter(d => d.doktyp === 'prop').length;
  const motCount = docs.filter(d => d.doktyp === 'mot').length;
  const parts: string[] = [];

  if (propCount > 0) {
    parts.push(propConsequencesText(lang, propCount));
  }
  if (motCount > 0) {
    parts.push(motConsequencesText(lang, motCount));
  }
  if (parts.length === 0) {
    parts.push(genericConsequencesText(lang));
  }
  return parts.join(' ');
}
