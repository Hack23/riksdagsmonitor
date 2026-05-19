/**
 * @module analysis-reader/helpers/doc-ids
 * @description Shared regex pattern for matching Riksdag document IDs.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Regex pattern for matching Riksdag document IDs (e.g., H9011, H902A) */
export const DOC_ID_PATTERN = /\b[A-Z]\d{3,7}[A-Z]?\b/g;
