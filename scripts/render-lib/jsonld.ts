/**
 * @module Infrastructure/RenderLib/JsonLd
 * @category Intelligence Operations / Supporting Infrastructure
 * @name JSON-LD structured data builders
 *
 * @description
 * Pure, stateless factory functions for Schema.org JSON-LD objects used
 * across the article pipeline. Each builder returns a plain object ready
 * to be serialized via `JSON.stringify` and injected into a
 * `<script type="application/ld+json">` block.
 *
 * Supported types:
 * - `NewsArticle` — individual news articles with `isBasedOn` provenance
 * - `BreadcrumbList` — hierarchical navigation path
 * - `SpeakableSpecification` — voice-assistant TTS regions (via WebPage)
 * - `Organization` — publisher/author identity
 *
 * All functions accept explicit inputs and produce deterministic output
 * (no Date.now, no filesystem access). Callers in `article.ts`,
 * `generate-news-indexes/template.ts`, and `political-intelligence/`
 * consume these builders instead of inlining JSON-LD objects.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { BASE_URL } from './constants.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BreadcrumbEntry {
  readonly name: string;
  readonly item?: string;
}

export interface NewsArticleLdInput {
  readonly headline: string;
  readonly description: string;
  readonly datePublished: string;
  readonly dateModified: string;
  readonly inLanguage: string;
  readonly url: string;
  readonly isBasedOn?: readonly { url: string; name: string }[];
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

/**
 * Build a Schema.org `BreadcrumbList` JSON-LD object.
 *
 * Each entry becomes a `ListItem` with `position` 1-indexed. The final
 * entry may omit `item` (Google tolerates this for the current page).
 */
export function buildBreadcrumbListLd(entries: readonly BreadcrumbEntry[]): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: entries.map((entry, idx) => {
      const li: Record<string, unknown> = {
        '@type': 'ListItem',
        position: idx + 1,
        name: entry.name,
      };
      if (entry.item) {
        li.item = entry.item;
      }
      return li;
    }),
  };
}

/**
 * Build a Schema.org `NewsArticle` JSON-LD object with provenance via
 * `isBasedOn` (linking to the analysis artifacts that produced it).
 */
export function buildNewsArticleLd(input: NewsArticleLdInput): unknown {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    inLanguage: input.inLanguage,
    url: input.url,
    mainEntityOfPage: input.url,
    author: {
      '@type': 'Organization',
      name: 'Riksdagsmonitor (Hack23 AB)',
      url: 'https://www.hack23.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Hack23 AB',
      url: 'https://www.hack23.com',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/logo.png` },
    },
    isAccessibleForFree: true,
    isPartOf: { '@type': 'WebSite', name: 'Riksdagsmonitor', url: BASE_URL },
  };
  if (input.isBasedOn && input.isBasedOn.length > 0) {
    ld.isBasedOn = input.isBasedOn.map((a) => ({
      '@type': 'CreativeWork',
      url: a.url,
      name: a.name,
    }));
  }
  return ld;
}

/**
 * Build a Schema.org `SpeakableSpecification` as part of a `WebPage`
 * node. Returns a full `WebPage` JSON-LD object with `speakable`.
 *
 * CSS selectors identify the TTS-readable regions of the page for
 * voice-assistant surfacing (Google Assistant / Actions for News).
 */
export function buildSpeakableWebPageLd(
  url: string,
  inLanguage: string,
  cssSelectors: readonly string[],
): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url,
    inLanguage,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: [...cssSelectors],
    },
    isPartOf: { '@type': 'WebSite', '@id': `${BASE_URL}/#website` },
  };
}
