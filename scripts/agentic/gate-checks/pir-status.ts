/**
 * @module scripts/agentic/gate-checks/pir-status
 * @description Check 9 — Validate pir-status.json sidecar file structure
 *              (schema version, cycle/date/subfolder consistency, per-PIR
 *              id/status/confidence/answer_summary rules).
 *
 * @see .github/prompts/05-analysis-gate.md §Check 9
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { GateCheckResult } from '../gate-shared/types.js';

/** PIR status JSON schema structure. */
interface PirStatusFile {
  readonly schema_version?: string;
  readonly cycle?: string;
  readonly date?: string;
  readonly subfolder?: string;
  readonly pirs?: readonly PirEntry[];
  readonly generated_at?: string;
}

/** A single PIR entry in the sidecar file. */
interface PirEntry {
  readonly pir_id?: string;
  readonly statement?: string;
  readonly status?: string;
  readonly confidence?: string;
  readonly answer_summary?: string;
}

const VALID_PIR_STATUSES = new Set([
  'open', 'answered', 'superseded', 'deferred', 'cancelled',
]);

const VALID_CONFIDENCE_LEVELS = new Set([
  'VERY HIGH', 'HIGH', 'MEDIUM', 'LOW', 'VERY LOW',
]);

const PIR_ID_PATTERN = /^PIR-[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/;

/**
 * Validate pir-status.json exists and has valid structure.
 */
export async function checkPirStatus(analysisDir: string): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'pir-status.json');

  if (!existsSync(filePath)) {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: 'pir-status.json missing or empty',
    });
    return results;
  }

  let data: PirStatusFile;
  try {
    const raw = await readFile(filePath, 'utf-8');
    data = JSON.parse(raw) as PirStatusFile;
  } catch {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: 'pir-status.json: invalid JSON',
    });
    return results;
  }

  validateTopLevel(data, results);

  if (!Array.isArray(data.pirs)) {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: "pir-status.json: 'pirs' field must be a JSON array",
    });
    return results;
  }

  if (data.subfolder !== data.cycle) {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: `pir-status.json: subfolder='${data.subfolder}' must equal cycle='${data.cycle}'`,
    });
  }

  for (const pir of data.pirs) {
    validatePirEntry(pir, results);
  }

  if (results.length === 0) {
    results.push({
      checkId: 'pir-status',
      passed: true,
      message: 'pir-status.json: valid',
    });
  }

  return results;
}

function validateTopLevel(data: PirStatusFile, results: GateCheckResult[]): void {
  const requiredFields = ['schema_version', 'cycle', 'date', 'subfolder', 'pirs', 'generated_at'] as const;
  for (const field of requiredFields) {
    if (!(field in data) || data[field as keyof PirStatusFile] === undefined) {
      results.push({
        checkId: 'pir-status',
        passed: false,
        message: `pir-status.json: missing required field '${field}'`,
      });
    }
  }

  if (data.schema_version !== '1.0') {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: "pir-status.json: schema_version must be '1.0'",
    });
  }
}

function validatePirEntry(pir: PirEntry, results: GateCheckResult[]): void {
  const pid = pir.pir_id ?? '(no id)';

  if (!pir.pir_id || !PIR_ID_PATTERN.test(pir.pir_id)) {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: `pir-status.json pir=${pid}: invalid pir_id format`,
    });
  }

  for (const field of ['statement', 'status', 'confidence'] as const) {
    if (!pir[field]) {
      results.push({
        checkId: 'pir-status',
        passed: false,
        message: `pir-status.json pir=${pid}: missing required field "${field}"`,
      });
    }
  }

  if (pir.status && !VALID_PIR_STATUSES.has(pir.status)) {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: `pir-status.json pir=${pid}: invalid status '${pir.status}'`,
    });
  }

  if (pir.confidence && !VALID_CONFIDENCE_LEVELS.has(pir.confidence)) {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: `pir-status.json pir=${pid}: invalid confidence '${pir.confidence}'`,
    });
  }

  if (pir.status === 'answered' && !pir.answer_summary) {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: `pir-status.json pir=${pid}: status=answered requires non-empty answer_summary`,
    });
  }
  if (pir.status !== 'answered' && pir.answer_summary !== undefined) {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: `pir-status.json pir=${pid}: status=${pir.status} must not carry answer_summary`,
    });
  }
}
