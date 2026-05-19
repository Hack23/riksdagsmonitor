/**
 * @module download-parliamentary-data/args
 * @description CLI argument parser for `scripts/download-parliamentary-data.ts`
 * plus the `resolveAutoFullTextTopN` helper that decides the effective
 * full-text follow-up target for the current run.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { DocumentTypeKey } from '../parliamentary-data/data-downloader.js';
import { LONG_HORIZON_FULL_TEXT_FLOOR } from '../parliamentary-data/data-downloader.js';
import {
  isoWeekNumber,
  parseAndValidateIsoDate,
  parseIsoWeekLabel,
} from './rm-helpers.js';

export interface ParsedArgs {
  date: string;
  aggregate: boolean;
  limit: number;
  weekLabel: string | null;
  rm: string | null;
  docType: DocumentTypeKey | null;
  documentIds: string[];
  autoFullTextTopN: number | null;
  fullTextForAll: boolean;
}

/** Valid `--doc-type` values. */
const VALID_DOC_TYPES: readonly DocumentTypeKey[] = [
  'propositions',
  'motions',
  'committeeReports',
  'votes',
  'speeches',
  'questions',
  'interpellations',
];

/** Pattern for a single `--document-ids` entry (alphanumeric / hyphen / underscore). */
const DOK_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

/** Default `--limit` when not supplied. */
const DEFAULT_LIMIT = 20;

/**
 * Parse `process.argv`-style arguments into a typed object.
 *
 * Throws on invalid flag combinations (e.g. malformed `--date`, missing
 * value after a flag, unknown `--doc-type`, non-integer `--limit`).
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const get = (flag: string): string | null => {
    const idx = args.indexOf(flag);
    if (idx === -1) return null;
    const next = args[idx + 1];
    if (!next || next.startsWith('--')) {
      throw new Error(`Missing value for ${flag}.`);
    }
    return next;
  };

  const dateArg = get('--date');
  const aggregateArg = get('--aggregate');
  const aggregate = (() => {
    if (aggregateArg === null) return false;
    if (aggregateArg === 'weekly') return true;
    throw new Error(`Invalid --aggregate value: ${aggregateArg}. Supported value: 'weekly'.`);
  })();

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);

  const weekLabel = aggregate
    ? dateArg || `${now.getUTCFullYear()}-W${isoWeekNumber(now).toString().padStart(2, '0')}`
    : null;
  if (aggregate && weekLabel && !parseIsoWeekLabel(weekLabel)) {
    throw new Error(`Invalid weekly --date value: ${weekLabel}. Expected YYYY-WNN.`);
  }

  if (dateArg && dateArg !== 'today' && !aggregate && !parseAndValidateIsoDate(dateArg)) {
    throw new Error(`Invalid --date value: ${dateArg}. Expected YYYY-MM-DD or 'today'.`);
  }

  const isoDate = aggregate
    ? todayIso
    : dateArg === 'today' || !dateArg
      ? todayIso
      : dateArg;

  const limitArg = get('--limit');
  const parsedLimit = limitArg ? Number(limitArg) : DEFAULT_LIMIT;
  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    throw new Error(`Invalid --limit value: ${limitArg}. Expected a positive integer.`);
  }
  const limit = parsedLimit;
  const rm = get('--rm');

  const docTypeArg = get('--doc-type');
  const isDocumentTypeKey = (value: string): value is DocumentTypeKey =>
    VALID_DOC_TYPES.includes(value as DocumentTypeKey);
  let docType: DocumentTypeKey | null = null;
  if (docTypeArg !== null) {
    if (!isDocumentTypeKey(docTypeArg)) {
      throw new Error(
        `Invalid --doc-type value: ${docTypeArg}. Supported values: ${VALID_DOC_TYPES.join(', ')}.`,
      );
    }
    docType = docTypeArg;
  }

  const documentIdsArg = get('--document-ids');
  const documentIds = documentIdsArg
    ? documentIdsArg
        .split(',')
        .map((id) => id.trim())
        .filter((id) => {
          if (!id) return false;
          if (!DOK_ID_PATTERN.test(id)) {
            console.warn(
              `⚠️ Skipping invalid document ID: ${id} (must be alphanumeric/hyphens/underscores only)`,
            );
            return false;
          }
          return true;
        })
    : [];

  const autoFullTextTopNArg = get('--auto-full-text-top-n');
  let autoFullTextTopN: number | null = null;
  if (autoFullTextTopNArg !== null) {
    const parsed = Number(autoFullTextTopNArg);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new Error(
        `Invalid --auto-full-text-top-n value: ${autoFullTextTopNArg}. Expected a non-negative integer.`,
      );
    }
    autoFullTextTopN = parsed;
  }

  const fullTextForAll = args.includes('--full-text-for-all');

  return {
    date: isoDate,
    aggregate,
    limit,
    weekLabel,
    rm,
    docType,
    documentIds,
    autoFullTextTopN,
    fullTextForAll,
  };
}

/**
 * Resolve the effective full-text follow-up target for the current run.
 *
 * Resolution order:
 * 1. `--full-text-for-all` always wins and fetches the entire selected batch.
 * 2. `--auto-full-text-top-n 0` explicitly disables the follow-up fetch.
 * 3. Long-horizon batches (`--limit >= 30`) enforce a minimum floor of
 *    `LONG_HORIZON_FULL_TEXT_FLOOR` so year-ahead style runs cannot silently
 *    stay at the old top-5 behaviour.
 * 4. Shorter-horizon runs preserve the caller-supplied top-N or `null`.
 */
export function resolveAutoFullTextTopN(
  limit: number,
  autoFullTextTopN: number | null,
  fullTextForAll: boolean,
  docCount = 0,
): number | null {
  if (fullTextForAll) {
    return Math.max(0, docCount);
  }
  if (autoFullTextTopN === 0) {
    return 0;
  }
  const longHorizonFloorApplies = limit >= 30;
  if (autoFullTextTopN === null) {
    return longHorizonFloorApplies ? LONG_HORIZON_FULL_TEXT_FLOOR : null;
  }
  if (longHorizonFloorApplies && autoFullTextTopN > 0) {
    return Math.max(autoFullTextTopN, LONG_HORIZON_FULL_TEXT_FLOOR);
  }
  return autoFullTextTopN;
}
