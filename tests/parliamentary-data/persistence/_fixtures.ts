/**
 * @module tests/parliamentary-data/persistence/_fixtures
 * @description Shared fixtures + tmp-dir helpers for the per-module
 * persistence test suites split from the original 710-line
 * `tests/data-persistence.test.ts`.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { RawDocument } from '../../../scripts/data-transformers/types.js';
import type { DownloadedData } from '../../../scripts/parliamentary-data/data-downloader.js';

export function makeRawDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    dok_id: 'H901FiU1',
    titel: 'Test proposition',
    doktyp: 'prop',
    organ: 'FiU',
    datum: '2026-03-28',
    ...overrides,
  };
}

export function emptyDownloadedData(): DownloadedData {
  return {
    propositions: [],
    motions: [],
    committeeReports: [],
    votes: [],
    speeches: [],
    questions: [],
    interpellations: [],
  };
}

/** Allocate an isolated tmpDir and return cleanup-aware helpers. */
export function mkTmpDir(prefix = 'riksdag-persist-test-'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function cleanupTmpDir(tmpDir: string): void {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
