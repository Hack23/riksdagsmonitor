/**
 * @module ai-analysis/helpers
 * @description Shared document utility functions for the AI analysis pipeline.
 *
 * Provides low-level document inspection helpers used across all bounded
 * contexts (SWOT, domains, visualisation) to avoid duplication and ensure
 * consistent document-type normalisation.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import type { RawDocument } from '../data-transformers/types.js';
import { extractKeyPassage, cleanMotionText, isPersonProfileText } from '../data-transformers/helpers.js';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/** Shorthand for a partial language lookup record. */
export type LangRecord = Partial<Record<Language, string>>;

// ---------------------------------------------------------------------------
// Document inspection helpers
// ---------------------------------------------------------------------------

/** Extract the normalised document type key. */
export function docType(doc: RawDocument): string {
  return (doc.doktyp || doc.documentType || '').toLowerCase();
}

/** Extract a human-readable document title. */
export function docTitle(doc: RawDocument): string {
  return (doc.titel || doc.title || doc.dokumentnamn || doc.dok_id || '').trim();
}

/** Extract a stable document identifier. */
export function docId(doc: RawDocument): string {
  return doc.dok_id || doc.url || doc.titel || doc.title || doc.dokumentnamn || 'unknown';
}

/**
 * Test whether a document is an SFS (enacted law/statute) — matches both
 * `doktyp === 'sfs'` and `dokumentnamn` starting with 'SFS'.
 */
export function isSfsDoc(doc: RawDocument): boolean {
  return docType(doc) === 'sfs' || (doc.dokumentnamn || '').startsWith('SFS');
}

/**
 * Normalize document type key, treating SFS-by-name documents (missing `doktyp`
 * but with `dokumentnamn` starting with 'SFS') as `'sfs'` and empty types as `'other'`.
 * Reuse this everywhere a doc-type key is needed (mindmap, dashboard, confidence).
 */
export function normalizedDocType(doc: RawDocument): string {
  const raw = docType(doc);
  if (raw === 'eu') return 'fpm';
  if (raw) return raw;
  if (isSfsDoc(doc)) return 'sfs';
  return 'other';
}

/**
 * Predicate: document metadata was enriched via `enrichDocumentsWithContent()`.
 */
export function isMetadataEnriched(doc: RawDocument): boolean {
  return Boolean(doc.contentFetched);
}

/**
 * Predicate: document has full-text or full-HTML content available.
 */
export function hasFullTextContent(doc: RawDocument): boolean {
  return Boolean(doc.contentFetched && (doc.fullText || doc.fullContent));
}

/** Extract a meaningful text passage from an enriched document. */
export function extractPassage(doc: RawDocument, maxChars = 400): string | null {
  const raw = doc.fullText || doc.fullContent || '';
  if (!raw || isPersonProfileText(raw)) return null;
  const cleaned = docType(doc) === 'mot' && raw.includes('Motion till riksdagen')
    ? cleanMotionText(raw)
    : raw;
  return extractKeyPassage(cleaned, maxChars) || null;
}
