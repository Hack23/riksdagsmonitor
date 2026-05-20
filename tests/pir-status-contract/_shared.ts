/**
 * @module tests/pir-status-contract/_shared
 * @description Shared fixtures and IO-capture helpers for the PIR-status
 * contract test suite. Split per Hack23/riksdagsmonitor#2624 from the
 * 889-line `tests/pir-status-contract.test.ts`.
 *
 * Each split file imports from this module to avoid duplicating the
 * `validFixture()` and `runMainSafe()` helpers (~70 lines).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { runMain, type PirStatusFile } from '../../scripts/roll-forward-pirs';

export function validFixture(overrides: Partial<PirStatusFile> = {}): PirStatusFile {
  return {
    schema_version: '1.0',
    cycle: 'month-ahead',
    date: '2026-04-26',
    subfolder: 'month-ahead',
    generated_at: '2026-04-26T10:00:00Z',
    inherited_from: null,
    pirs: [
      {
        pir_id: 'PIR-1',
        statement: 'SD voting discipline on prop. 2025/26:236 (fuel tax)',
        trigger: 'May 2026 chamber vote on HD01FiU48',
        status: 'open',
        confidence: 'HIGH',
        inherits_from: [],
        evidence_refs: ['HD01FiU48'],
        horizon: '2026-05-15',
        admiralty_grade: 'B2',
      },
      {
        pir_id: 'PIR-2',
        statement: 'Riksbank repo-rate decision macroeconomic impact on budget debates',
        status: 'answered',
        confidence: 'HIGH',
        answer_summary: 'Riksbank held rate at 2.25% on 2026-04-23 per press release.',
        inherits_from: [],
        evidence_refs: ['https://www.riksbank.se/press-release/2026/04/23'],
      },
    ],
    ...overrides,
  };
}

export interface CapturedIO {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export function captureIO() {
  const captured: CapturedIO = { stdout: '', stderr: '', exitCode: null };
  const out = {
    write: (chunk: string | Uint8Array): boolean => {
      captured.stdout += String(chunk);
      return true;
    },
  } as unknown as NodeJS.WritableStream;
  const err = {
    write: (chunk: string | Uint8Array): boolean => {
      captured.stderr += String(chunk);
      return true;
    },
  } as unknown as NodeJS.WritableStream;
  const exit = ((code: number): never => {
    captured.exitCode = code;
    throw new Error(`__exit_${code}__`);
  }) as (code: number) => never;
  return { captured, io: { stdout: out, stderr: err, exit } };
}

export function runMainSafe(argv: string[], extraIO: Record<string, unknown> = {}) {
  const { captured, io } = captureIO();
  try {
    runMain(argv, { ...io, ...extraIO });
  } catch (e) {
    if (!(e instanceof Error) || !/^__exit_/.test(e.message)) throw e;
  }
  return captured;
}
