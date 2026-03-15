/**
 * @module analysis-framework/cross-reference
 * @description Cross-document relationship detection for parliamentary document batches.
 *
 * Detects the following relationship types between documents:
 * - `responds-to`   — Motion responding to a government proposition
 * - `amends`        — Amendment document modifying an existing act
 * - `implements`    — Implementation measure for an EU directive or treaty commitment
 * - `contradicts`   — Conflicting policy positions between two documents
 * - `related-topic` — Thematically related documents sharing policy domains
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../data-transformers/types.js';
import type { DocumentLink } from './types.js';
import { detectPolicyDomains } from '../data-transformers/policy-analysis.js';
import { extractPropRef } from '../data-transformers/document-analysis.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum domain overlap to classify two documents as `related-topic` */
const RELATED_TOPIC_DOMAIN_OVERLAP = 2;

/** EU implementation keywords */
const EU_IMPL_KEYWORDS: readonly string[] = [
  'implementering', 'implementation', 'genomförande', 'transponering', 'transposition',
  'genomföra', 'implementera', 'med anledning av eu', 'eu-direktiv', 'eu directive',
];

/** Amendment keywords */
const AMEND_KEYWORDS: readonly string[] = [
  'ändring', 'amendment', 'ändringslag', 'ändringsförordning', 'tillägg', 'addition',
  'komplettering', 'supplement', 'uppdatering', 'update', 'revision',
];

/** Conflict indicator terms (paired policy positions) */
const CONFLICT_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['skattehöjning', 'skattesänkning'],
  ['tax increase', 'tax cut'],
  ['privatisering', 'förstatligande'],
  ['privatization', 'nationalization'],
  ['avreglering', 'reglering'],
  ['deregulation', 'regulation'],
  ['immigration increase', 'immigration decrease'],
  ['fler i arbete', 'bidragsbegränsning'],
];

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function docId(doc: RawDocument): string {
  return doc.dok_id || doc.url || doc.titel || doc.title || 'unknown';
}

function docText(doc: RawDocument): string {
  return [doc.titel, doc.title, doc.summary, doc.notis].filter(Boolean).join(' ').toLowerCase();
}

function containsAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some(kw => text.includes(kw.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Individual link detectors
// ---------------------------------------------------------------------------

/**
 * Detect "responds-to" links: motions that reference a specific proposition.
 */
function detectRespondsTo(docs: RawDocument[]): DocumentLink[] {
  const links: DocumentLink[] = [];
  const propositions = docs.filter(d => d.doktyp === 'prop' || d.documentType === 'prop');

  for (const motion of docs.filter(d => d.doktyp === 'mot' || d.documentType === 'mot')) {
    const title = motion.titel || motion.title || '';
    const propRef = extractPropRef(title);
    if (!propRef) continue;

    // Match against propositions in the batch by dok_id or title substring
    const matched = propositions.find(p =>
      (p.dok_id && p.dok_id.includes(propRef)) ||
      ((p.titel || p.title || '').includes(propRef))
    );

    if (matched) {
      links.push({
        sourceId: docId(motion),
        targetId: docId(matched),
        type: 'responds-to',
        reason: `Motion references proposition ${propRef}`,
        confidence: 95,
      });
    }
  }

  return links;
}

/**
 * Detect "implements" links: documents implementing EU directives or treaty commitments.
 */
function detectImplements(docs: RawDocument[], domainCache: Map<string, string[]>): DocumentLink[] {
  const links: DocumentLink[] = [];
  const implementers = docs.filter(d => containsAny(docText(d), EU_IMPL_KEYWORDS));
  const directives = docs.filter(d => containsAny(docText(d), ['eu-direktiv', 'eu directive', 'förordning', 'fördrag']));

  for (const impl of implementers) {
    for (const dir of directives) {
      if (docId(impl) === docId(dir)) continue;

      // Heuristic: same policy domain and implementation keyword
      const implDomains = domainCache.get(docId(impl)) ?? [];
      const dirDomains = domainCache.get(docId(dir)) ?? [];
      const overlap = implDomains.filter(d => dirDomains.includes(d));

      if (overlap.length >= 1) {
        links.push({
          sourceId: docId(impl),
          targetId: docId(dir),
          type: 'implements',
          reason: `Implementation document shares domain(s) ${overlap.join(', ')} with directive/treaty document`,
          confidence: 60,
        });
      }
    }
  }

  return links;
}

/**
 * Detect "amends" links: documents explicitly amending earlier legislation.
 */
function detectAmends(docs: RawDocument[]): DocumentLink[] {
  const links: DocumentLink[] = [];
  const amenders = docs.filter(d => containsAny(docText(d), AMEND_KEYWORDS));

  for (const amender of amenders) {
    for (const other of docs) {
      if (docId(amender) === docId(other)) continue;

      // If the amending doc's title references keywords from another doc's title
      const amenderTitle = (amender.titel || amender.title || '').toLowerCase();
      const otherTitle = (other.titel || other.title || '').toLowerCase();

      if (otherTitle.length > 5 && amenderTitle.includes(otherTitle.slice(0, Math.min(20, otherTitle.length)))) {
        links.push({
          sourceId: docId(amender),
          targetId: docId(other),
          type: 'amends',
          reason: `Amending document title overlaps with target document title`,
          confidence: 55,
        });
      }
    }
  }

  return links;
}

/**
 * Detect "contradicts" links: documents with opposing policy positions.
 */
function detectContradicts(docs: RawDocument[]): DocumentLink[] {
  const links: DocumentLink[] = [];

  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const docA = docs[i];
      const docB = docs[j];
      const textA = docText(docA);
      const textB = docText(docB);

      for (const [termA, termB] of CONFLICT_PAIRS) {
        const aHasA = textA.includes(termA.toLowerCase());
        const aHasB = textA.includes(termB.toLowerCase());
        const bHasA = textB.includes(termA.toLowerCase());
        const bHasB = textB.includes(termB.toLowerCase());

        // True contradiction: one doc has term A, the other has term B (not both)
        if ((aHasA && !aHasB) && (bHasB && !bHasA)) {
          links.push({
            sourceId: docId(docA),
            targetId: docId(docB),
            type: 'contradicts',
            reason: `Conflicting policy positions: "${termA}" vs "${termB}"`,
            confidence: 65,
          });
          break; // One contradiction per pair is enough
        }
        if ((aHasB && !aHasA) && (bHasA && !bHasB)) {
          links.push({
            sourceId: docId(docA),
            targetId: docId(docB),
            type: 'contradicts',
            reason: `Conflicting policy positions: "${termB}" vs "${termA}"`,
            confidence: 65,
          });
          break;
        }
      }
    }
  }

  return links;
}

/**
 * Detect "related-topic" links: documents sharing multiple policy domains.
 */
function detectRelatedTopics(docs: RawDocument[], domainCache: Map<string, string[]>): DocumentLink[] {
  const links: DocumentLink[] = [];

  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const idA = docId(docs[i]);
      const idB = docId(docs[j]);
      const domainsA = domainCache.get(idA) ?? [];
      const domainsB = domainCache.get(idB) ?? [];

      const overlap = domainsA.filter(d => domainsB.includes(d));
      if (overlap.length >= RELATED_TOPIC_DOMAIN_OVERLAP) {
        links.push({
          sourceId: idA,
          targetId: idB,
          type: 'related-topic',
          reason: `Shares ${overlap.length} policy domain(s): ${overlap.join(', ')}`,
          confidence: Math.min(90, 40 + overlap.length * 15),
        });
      }
    }
  }

  return links;
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

/**
 * Remove duplicate links (same source, target, and type), keeping the
 * entry with the highest confidence.
 */
function deduplicateLinks(links: DocumentLink[]): DocumentLink[] {
  const seen = new Map<string, DocumentLink>();
  for (const link of links) {
    const key = `${link.sourceId}||${link.targetId}||${link.type}`;
    const existing = seen.get(key);
    if (!existing || link.confidence > existing.confidence) {
      seen.set(key, link);
    }
  }
  return Array.from(seen.values());
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect cross-document relationships in a batch of parliamentary documents.
 *
 * Identifies five relationship types:
 * - `responds-to`   — Motion cites a government proposition
 * - `implements`    — Implementation document for an EU directive or treaty
 * - `amends`        — Document explicitly amending earlier legislation
 * - `contradicts`   — Documents with opposing policy positions
 * - `related-topic` — Thematically related documents (≥2 shared domains)
 *
 * @param docs - Batch of documents to cross-reference
 * @returns    Deduplicated array of detected `DocumentLink` objects
 */
export function detectCrossDocumentLinks(docs: RawDocument[]): DocumentLink[] {
  if (docs.length < 2) return [];

  // Pre-compute domains once for the entire batch — shared by detectImplements and detectRelatedTopics
  const domainCache = new Map<string, string[]>();
  for (const doc of docs) {
    domainCache.set(docId(doc), detectPolicyDomains(doc, 'en'));
  }

  const all: DocumentLink[] = [
    ...detectRespondsTo(docs),
    ...detectImplements(docs, domainCache),
    ...detectAmends(docs),
    ...detectContradicts(docs),
    ...detectRelatedTopics(docs, domainCache),
  ];

  return deduplicateLinks(all);
}
