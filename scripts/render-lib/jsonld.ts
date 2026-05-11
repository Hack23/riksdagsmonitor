/**
 * @module Infrastructure/RenderLib/JsonLd
 * @category Intelligence Operations / Supporting Infrastructure
 * @name JSON-LD structured data builders
 *
 * @description
 * Pure, stateless factory functions for Schema.org JSON-LD objects used
 * across the article pipeline. Each builder returns a strongly-typed
 * object ready to be serialized via `JSON.stringify` and injected into a
 * `<script type="application/ld+json">` block.
 *
 * Supported types:
 * - `NewsArticle` — individual news articles with `isBasedOn` provenance
 * - `BreadcrumbList` — hierarchical navigation path
 * - `SpeakableSpecification` — voice-assistant TTS regions (via WebPage)
 *
 * All functions accept explicit inputs and produce deterministic output
 * (no Date.now, no filesystem access). Currently consumed by
 * `article.ts` (the article renderer).
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { BASE_URL } from './constants.js';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

/** A breadcrumb entry with a required URL. Used for all but the last position. */
export interface BreadcrumbEntryWithItem {
  readonly name: string;
  readonly item: string;
}

/** The final breadcrumb entry (current page) — URL is omitted. */
export interface BreadcrumbEntryCurrentPage {
  readonly name: string;
}

/** Union input accepted by `buildBreadcrumbListLd`. */
export type BreadcrumbEntry = BreadcrumbEntryWithItem | BreadcrumbEntryCurrentPage;

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
// Output types (JSON-LD shapes)
// ---------------------------------------------------------------------------

export interface JsonLdListItem {
  readonly '@type': 'ListItem';
  readonly position: number;
  readonly name: string;
  readonly item?: string;
}

export interface BreadcrumbListLd {
  readonly '@context': 'https://schema.org';
  readonly '@type': 'BreadcrumbList';
  readonly itemListElement: JsonLdListItem[];
}

export interface NewsArticleLd {
  readonly '@context': 'https://schema.org';
  readonly '@type': 'NewsArticle';
  readonly headline: string;
  readonly description: string;
  readonly datePublished: string;
  readonly dateModified: string;
  readonly inLanguage: string;
  readonly url: string;
  readonly mainEntityOfPage: string;
  readonly author: { readonly '@type': 'Organization'; readonly name: string; readonly url: string };
  readonly publisher: { readonly '@type': 'Organization'; readonly name: string; readonly url: string; readonly logo: { readonly '@type': 'ImageObject'; readonly url: string } };
  readonly isAccessibleForFree: true;
  readonly isPartOf: { readonly '@type': 'WebSite'; readonly '@id': string; readonly name: string; readonly url: string };
  readonly isBasedOn?: readonly { readonly '@type': 'CreativeWork'; readonly url: string; readonly name: string }[];
}

export interface SpeakableWebPageLd {
  readonly '@context': 'https://schema.org';
  readonly '@type': 'WebPage';
  readonly url: string;
  readonly inLanguage: string;
  readonly speakable: { readonly '@type': 'SpeakableSpecification'; readonly cssSelector: string[] };
  readonly isPartOf: { readonly '@type': 'WebSite'; readonly '@id': string };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum display length for a breadcrumb label before truncation. */
export const BREADCRUMB_TITLE_MAX_LENGTH = 50;

/** Characters reserved for the trailing ellipsis when truncating a breadcrumb. */
export const BREADCRUMB_ELLIPSIS_OVERHEAD = 3;

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

/**
 * Build a Schema.org `BreadcrumbList` JSON-LD object.
 *
 * Entries are positional: all entries except the last **must** include an
 * `item` URL. The final entry represents the current page and omits
 * `item` (Google tolerates this). A runtime assertion enforces this
 * contract so malformed breadcrumbs are caught early.
 *
 * @throws {Error} if `entries` is empty or an intermediate entry is missing `item`.
 */
export function buildBreadcrumbListLd(entries: readonly BreadcrumbEntry[]): BreadcrumbListLd {
  if (entries.length === 0) {
    throw new Error('BreadcrumbList requires at least one entry.');
  }
  for (let i = 0; i < entries.length - 1; i++) {
    if (!('item' in entries[i]) || !(entries[i] as BreadcrumbEntryWithItem).item) {
      throw new Error(
        `BreadcrumbList entry at position ${i + 1} must have an \`item\` URL (only the last entry may omit it).`,
      );
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: entries.map((entry, idx) => {
      const li: JsonLdListItem = {
        '@type': 'ListItem',
        position: idx + 1,
        name: entry.name,
        ...('item' in entry && entry.item ? { item: entry.item } : {}),
      };
      return li;
    }),
  };
}

/**
 * Build a Schema.org `NewsArticle` JSON-LD object with provenance via
 * `isBasedOn` (linking to the analysis artifacts that produced it).
 */
export function buildNewsArticleLd(input: NewsArticleLdInput): NewsArticleLd {
  const ld: NewsArticleLd = {
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
    isPartOf: { '@type': 'WebSite', '@id': `${BASE_URL}/#website`, name: 'Riksdagsmonitor', url: BASE_URL },
    ...(input.isBasedOn && input.isBasedOn.length > 0
      ? {
          isBasedOn: input.isBasedOn.map((a) => ({
            '@type': 'CreativeWork' as const,
            url: a.url,
            name: a.name,
          })),
        }
      : {}),
  };
  return ld;
}

/**
 * Build a Schema.org `SpeakableSpecification` as part of a `WebPage`
 * node. Returns a full `WebPage` JSON-LD object with `speakable`.
 *
 * CSS selectors identify the TTS-readable regions of the page for
 * voice-assistant surfacing (Google Assistant / Actions for News).
 *
 * @throws {Error} if `cssSelectors` is empty or contains blank entries.
 */
export function buildSpeakableWebPageLd(
  url: string,
  inLanguage: string,
  cssSelectors: readonly string[],
): SpeakableWebPageLd {
  const valid = cssSelectors.filter((s) => s.trim().length > 0);
  if (valid.length === 0) {
    throw new Error('SpeakableSpecification requires at least one non-empty CSS selector.');
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url,
    inLanguage,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: [...valid],
    },
    isPartOf: { '@type': 'WebSite', '@id': `${BASE_URL}/#website` },
  };
}
