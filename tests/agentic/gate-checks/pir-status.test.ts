/**
 * @module tests/agentic/gate-checks/pir-status
 * @description Check 9 — pir-status.json sidecar must match the v1.0
 *              schema (cycle == subfolder, PIR entry validation,
 *              answer_summary required iff status === 'answered').
 * @see scripts/agentic/gate-checks/pir-status.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { checkPirStatus } from '../../../scripts/agentic/gate-checks/pir-status.js';
import { createTestDir } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkPirStatus', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes with valid pir-status.json', async () => {
    const pir = {
      schema_version: '1.0',
      cycle: 'propositions',
      date: '2026-05-01',
      subfolder: 'propositions',
      pirs: [{
        pir_id: 'PIR-FISCAL-001',
        statement: 'What is the fiscal impact?',
        status: 'open',
        confidence: 'HIGH',
      }],
      generated_at: '2026-05-01T10:00:00Z',
    };
    writeFileSync(join(testDir, 'pir-status.json'), JSON.stringify(pir), 'utf-8');

    const results = await checkPirStatus(testDir);
    expect(results.filter((r) => !r.passed)).toHaveLength(0);
  });

  it('fails when file missing', async () => {
    const results = await checkPirStatus(testDir);
    expect(results.filter((r) => !r.passed).length).toBeGreaterThan(0);
  });

  it('fails with invalid JSON', async () => {
    writeFileSync(join(testDir, 'pir-status.json'), 'not json', 'utf-8');
    const results = await checkPirStatus(testDir);
    expect(results.filter((r) => !r.passed).length).toBeGreaterThan(0);
  });

  it('fails when schema_version is not 1.0', async () => {
    const pir = {
      schema_version: '2.0',
      cycle: 'propositions',
      date: '2026-05-01',
      subfolder: 'propositions',
      pirs: [],
      generated_at: '2026-05-01T10:00:00Z',
    };
    writeFileSync(join(testDir, 'pir-status.json'), JSON.stringify(pir), 'utf-8');
    const results = await checkPirStatus(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.some((f) => f.message.includes('schema_version'))).toBe(true);
  });

  it('fails when subfolder != cycle', async () => {
    const pir = {
      schema_version: '1.0',
      cycle: 'propositions',
      date: '2026-05-01',
      subfolder: 'motions',
      pirs: [],
      generated_at: '2026-05-01T10:00:00Z',
    };
    writeFileSync(join(testDir, 'pir-status.json'), JSON.stringify(pir), 'utf-8');
    const results = await checkPirStatus(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.some((f) => f.message.includes('subfolder'))).toBe(true);
  });

  it('validates PIR entry fields', async () => {
    const pir = {
      schema_version: '1.0',
      cycle: 'propositions',
      date: '2026-05-01',
      subfolder: 'propositions',
      pirs: [{
        pir_id: 'INVALID',
        statement: '',
        status: 'invalid-status',
        confidence: 'INVALID',
      }],
      generated_at: '2026-05-01T10:00:00Z',
    };
    writeFileSync(join(testDir, 'pir-status.json'), JSON.stringify(pir), 'utf-8');
    const results = await checkPirStatus(testDir);
    expect(results.filter((r) => !r.passed).length).toBeGreaterThan(0);
  });

  it('requires answer_summary when status is "answered"', async () => {
    const pir = {
      schema_version: '1.0',
      cycle: 'propositions',
      date: '2026-05-01',
      subfolder: 'propositions',
      pirs: [{
        pir_id: 'PIR-FISCAL-001',
        statement: 'Was the budget passed?',
        status: 'answered',
        confidence: 'HIGH',
      }],
      generated_at: '2026-05-01T10:00:00Z',
    };
    writeFileSync(join(testDir, 'pir-status.json'), JSON.stringify(pir), 'utf-8');
    const results = await checkPirStatus(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.some((f) => f.message.includes('answer_summary'))).toBe(true);
  });

  it('passes when status is "answered" and answer_summary is present', async () => {
    const pir = {
      schema_version: '1.0',
      cycle: 'propositions',
      date: '2026-05-01',
      subfolder: 'propositions',
      pirs: [{
        pir_id: 'PIR-FISCAL-001',
        statement: 'Was the budget passed?',
        status: 'answered',
        confidence: 'HIGH',
        answer_summary: 'Yes, budget was passed with majority.',
      }],
      generated_at: '2026-05-01T10:00:00Z',
    };
    writeFileSync(join(testDir, 'pir-status.json'), JSON.stringify(pir), 'utf-8');
    const results = await checkPirStatus(testDir);
    expect(results.filter((r) => !r.passed)).toHaveLength(0);
  });

  it('fails when non-answered PIR carries answer_summary', async () => {
    const pir = {
      schema_version: '1.0',
      cycle: 'propositions',
      date: '2026-05-01',
      subfolder: 'propositions',
      pirs: [{
        pir_id: 'PIR-FISCAL-001',
        statement: 'What will the budget be?',
        status: 'open',
        confidence: 'MEDIUM',
        answer_summary: 'Not yet resolved.',
      }],
      generated_at: '2026-05-01T10:00:00Z',
    };
    writeFileSync(join(testDir, 'pir-status.json'), JSON.stringify(pir), 'utf-8');
    const results = await checkPirStatus(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.some((f) => f.message.includes('must not carry answer_summary'))).toBe(true);
  });
});
