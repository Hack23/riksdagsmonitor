/**
 * Shared lower bound for treating MCP document bodies as substantive full text.
 *
 * Must stay aligned between download-time enrichment, retry-queue rechecks,
 * and manifest coverage-state inference.
 */
export const FULL_TEXT_MIN_LENGTH = 100;
