/**
 * @module scripts/validators/article/rules/per-document
 * @description Per-document subsection extractor + minimum dok_id
 *              citation threshold.
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 108
 *              (`MIN_PER_DOC_DOK_ID_HITS`) and 187–209
 *              (`extractPerDocumentSections`). Logic is byte-identical
 *              to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export const MIN_PER_DOC_DOK_ID_HITS = 1;

/**
 * Find every per-document subsection (`### HD12345` produced by the
 * aggregator beneath the `## Per-document intelligence` header) and
 * return each one's body. The body must contain at least one
 * `dok_id` reference so the article remains traceable to a primary
 * source — orphan per-document sections are blocked.
 */
export function extractPerDocumentSections(article: string): Array<{ id: string; body: string }> {
  const start = article.match(/^##\s+Per-document intelligence\s*$/m);
  if (!start || start.index === undefined) return [];
  const tail = article.slice(start.index + start[0].length);
  const stop = tail.search(/^##\s+\S/m);
  const region = stop === -1 ? tail : tail.slice(0, stop);
  const sections: Array<{ id: string; body: string }> = [];

  const DOK_ID_HEADING = /^###\s+(H[A-Z0-9]{6,10}|[A-ZÅÄÖ]{1,4}\d{4,8})\s*$/m;
  let cursor = region;
  let m = cursor.match(DOK_ID_HEADING);
  while (m && m.index !== undefined) {
    const id = m[1]!;
    const after = cursor.slice(m.index + m[0].length);
    const next = after.match(DOK_ID_HEADING);
    const body = next && next.index !== undefined ? after.slice(0, next.index) : after;
    sections.push({ id, body });
    if (!next || next.index === undefined) break;
    cursor = after.slice(next.index);
    m = cursor.match(DOK_ID_HEADING);
  }
  return sections;
}

/** Regex matching a dok_id token. Exported because the orchestrator counts hits per section body. */
export const DOK_ID_TOKEN_RE = /\b(?:H[A-Z0-9]{6,10}|[A-ZÅÄÖ]{1,4}\d{4,8})\b/;

import type { ArticleViolation } from '../types.js';

/** Per-document `dok_id` citation rule. */
export function checkPerDocument(rel: string, text: string): ArticleViolation[] {
  const out: ArticleViolation[] = [];
  for (const section of extractPerDocumentSections(text)) {
    const hits = section.body.match(new RegExp(DOK_ID_TOKEN_RE.source, 'g')) ?? [];
    if (hits.length < MIN_PER_DOC_DOK_ID_HITS) {
      out.push({
        file: rel,
        code: 'per-doc-missing-dok_id',
        message: `Per-document section "${section.id}" cites zero dok_id-style codes — minimum is ${MIN_PER_DOC_DOK_ID_HITS}. Every per-document subsection must trace back to at least one primary-source identifier (e.g. HD12345, FiU17).`,
      });
    }
  }
  return out;
}
