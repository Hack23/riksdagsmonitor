/**
 * @module generate-news-indexes/template/page-sections
 * @description Standalone page sections (AI newsroom + FAQ).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import { FAQ_HEADING } from '../../render-lib/faq-i18n.js';
import type { Language } from '../../types/language.js';
import type { LanguageConfig } from '../types.js';

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

/** Render the "AI newsroom" promotional section. */
export function renderAiNewsroomSection(lang: LanguageConfig): string {
  return `  <section class="ai-newsroom-section" aria-labelledby="ai-newsroom-heading">
    <div class="container">
      <h2 id="ai-newsroom-heading"><span aria-hidden="true">🤖</span> ${escapeHtml(lang.aiNewsroomTitle)}</h2>
      <p>${escapeHtml(lang.aiNewsroomText)}</p>
    </div>
  </section>`;
}

/** Render the FAQ section with localised heading + accordion. */
export function renderFaqSection(chromeLang: Language, faqItems: readonly FaqItem[]): string {
  const items = faqItems.map((f) => `      <details class="news-faq-item">
        <summary>${escapeHtml(f.question)}</summary>
        <p>${escapeHtml(f.answer)}</p>
      </details>`).join('\n');
  return `  <section class="news-faq-section" aria-labelledby="news-faq-heading">
    <div class="container">
      <h2 id="news-faq-heading"><span aria-hidden="true">❓</span> ${escapeHtml(FAQ_HEADING[chromeLang])}</h2>
${items}
    </div>
  </section>`;
}
