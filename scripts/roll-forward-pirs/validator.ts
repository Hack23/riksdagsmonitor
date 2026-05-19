/**
 * @module roll-forward-pirs/validator
 * @description Strict structural + enum validation for `pir-status.json`
 * documents. Dependency-free (no ajv).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import {
  PIR_ID_PATTERN,
  VALID_CONFIDENCES,
  VALID_CYCLES,
  VALID_STATUSES,
} from './constants.js';
import type { Confidence, CycleType, PirStatus, PirStatusFile } from './types.js';

/**
 * Strict structural + enum validation. Validates top-level required fields,
 * `schema_version`, `cycle`, `date`, `subfolder`, `generated_at`, optional
 * `inherited_from`, `pirs` array shape, and each PIR's `pir_id` pattern,
 * `status`, and `confidence` enum membership. Does not call ajv to keep the
 * script dependency-free.
 *
 * @throws Error with descriptive message on any validation failure.
 */
export function validateSource(raw: unknown, filePath: string): PirStatusFile {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`${filePath}: not a JSON object`);
  }
  const obj = raw as Record<string, unknown>;
  for (const key of ['schema_version', 'cycle', 'date', 'subfolder', 'generated_at', 'pirs'] as const) {
    if (!(key in obj)) throw new Error(`${filePath}: missing required field '${key}'`);
  }
  if (obj['schema_version'] !== '1.0') {
    throw new Error(
      `${filePath}: unsupported schema_version '${String(obj['schema_version'])}'`,
    );
  }
  if (typeof obj['cycle'] !== 'string' || !VALID_CYCLES.has(obj['cycle'] as CycleType)) {
    throw new Error(`${filePath}: cycle '${String(obj['cycle'])}' is not a valid cycle`);
  }
  if (typeof obj['date'] !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(obj['date'])) {
    throw new Error(`${filePath}: date '${String(obj['date'])}' must match YYYY-MM-DD`);
  }
  if (typeof obj['subfolder'] !== 'string' || obj['subfolder'].length === 0) {
    throw new Error(`${filePath}: subfolder must be a non-empty string`);
  }
  if (obj['subfolder'] !== obj['cycle']) {
    throw new Error(
      `${filePath}: subfolder '${String(obj['subfolder'])}' must equal cycle '${String(obj['cycle'])}'`,
    );
  }
  if (typeof obj['generated_at'] !== 'string' || Number.isNaN(Date.parse(obj['generated_at']))) {
    throw new Error(`${filePath}: generated_at '${String(obj['generated_at'])}' must be a valid date-time string`);
  }
  if (
    obj['inherited_from'] !== undefined &&
    obj['inherited_from'] !== null &&
    typeof obj['inherited_from'] !== 'string'
  ) {
    throw new Error(`${filePath}: inherited_from must be a string or null when present`);
  }
  if (!Array.isArray(obj['pirs'])) {
    throw new Error(`${filePath}: 'pirs' must be an array`);
  }
  for (let i = 0; i < (obj['pirs'] as unknown[]).length; i++) {
    const p = (obj['pirs'] as unknown[])[i] as Record<string, unknown>;
    if (typeof p !== 'object' || p === null) {
      throw new Error(`${filePath}: pirs[${i}] is not an object`);
    }
    if (typeof p['pir_id'] !== 'string' || !PIR_ID_PATTERN.test(p['pir_id'])) {
      throw new Error(
        `${filePath}: pirs[${i}].pir_id '${String(p['pir_id'])}' does not match ${PIR_ID_PATTERN}`,
      );
    }
    if (typeof p['statement'] !== 'string' || p['statement'].length < 10) {
      throw new Error(
        `${filePath}: pirs[${i}] (${String(p['pir_id'])}).statement missing or shorter than 10 chars`,
      );
    }
    if (!VALID_STATUSES.has(p['status'] as PirStatus)) {
      throw new Error(
        `${filePath}: pirs[${i}] (${String(p['pir_id'])}).status '${String(p['status'])}' is not a valid PIR status`,
      );
    }
    if (!VALID_CONFIDENCES.has(p['confidence'] as Confidence)) {
      throw new Error(
        `${filePath}: pirs[${i}] (${String(p['pir_id'])}).confidence '${String(p['confidence'])}' is not a valid confidence value`,
      );
    }
    if (p['status'] === 'answered') {
      if (typeof p['answer_summary'] !== 'string' || p['answer_summary'].length === 0) {
        throw new Error(
          `${filePath}: pirs[${i}] (${String(p['pir_id'])}) status='answered' requires non-empty answer_summary`,
        );
      }
    } else if (p['answer_summary'] !== undefined) {
      throw new Error(
        `${filePath}: pirs[${i}] (${String(p['pir_id'])}) status='${String(p['status'])}' must not carry answer_summary`,
      );
    }
  }
  return obj as unknown as PirStatusFile;
}
