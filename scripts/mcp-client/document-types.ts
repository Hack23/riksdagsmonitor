/**
 * @module mcp-client/document-types
 * @description Riksdag document type normalisation. Maps raw Swedish
 * `doktyp` API codes to human-readable English type strings and stamps
 * documents with normalised `type`/`subtype` fields.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Map of Swedish riksdag API `doktyp` codes to normalized English type strings.
 *
 * Source: https://data.riksdagen.se/dokumentlista/dokumenttyper/
 */
const DOKTYP_TO_TYPE: Readonly<Record<string, string>> = {
  mot:      'motion',
  bet:      'committee-report',
  prop:     'proposition',
  skr:      'government-communication',
  ip:       'interpellation',
  fr:       'written-question',
  kammakt:  'chamber-action',
  prot:     'minutes',
  sfs:      'statute',
  sfst:     'statute-consolidated',
  ds:       'departmental-report',
  sou:      'government-inquiry',
  dir:      'committee-directive',
  yttr:     'external-opinion',
  fpm:      'eu-factsheet',
  utl:      'referral',
  redog:    'government-account',
  rskr:     'riksdag-communication',
  samtr:    'joint-committee-report',
};

/**
 * Normalize a raw `doktyp` API code to a human-readable `type` string.
 * Returns the code unchanged when not recognised, so unknown types remain
 * discoverable rather than silently dropping to 'unknown'.
 */
export function normalizeDocumentType(doktyp: string | undefined): string {
  if (!doktyp) return 'document';
  const lower = doktyp.toLowerCase().trim();
  return DOKTYP_TO_TYPE[lower] ?? lower;
}

/**
 * Stamp `type` and `subtype` fields onto a raw API document record in place.
 * - `type`    = normalised English label derived from `doktyp`
 * - `subtype` = mirrors the raw `subtyp` field (kept as-is; Swedish codes)
 * The raw `doktyp` field is preserved untouched for backward compatibility.
 */
export function annotateDocumentTypes(doc: Record<string, unknown>): Record<string, unknown> {
  const doktyp = typeof doc['doktyp'] === 'string' ? doc['doktyp'] : undefined;
  const subtyp = typeof doc['subtyp'] === 'string' ? doc['subtyp'] : undefined;
  if (!doc['type'])    doc['type']    = normalizeDocumentType(doktyp);
  if (!doc['subtype'] && subtyp) doc['subtype'] = subtyp;
  return doc;
}
