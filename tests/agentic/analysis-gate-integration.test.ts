/**
 * @module tests/agentic/analysis-gate-integration
 * @description End-to-end scenarios for the orchestrator
 *              `validateAnalysisGate()` plus invariant checks on the
 *              `artifact-inventory` constants that every individual gate
 *              check pivots off.
 *
 * Per-check behaviour lives in `tests/agentic/gate-checks/*.test.ts`. This
 * file owns only the cross-cutting scenarios: pass-through on a fully
 * seeded analysis, aggregated failure on a partially seeded analysis, and
 * structural assertions on the inventory.
 *
 * @see scripts/agentic/analysis-gate.ts
 * @see scripts/agentic/artifact-inventory.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import {
  ALL_REQUIRED_ARTIFACTS,
  FAMILY_A_ARTIFACTS,
  FAMILY_B_ARTIFACTS,
  FAMILY_C_ARTIFACTS,
  FAMILY_D_ARTIFACTS,
  MERMAID_REQUIRED_ARTIFACTS,
  PASS2_REQUIRED_ARTIFACTS,
  REQUIRED_ARTIFACT_FILENAMES,
  STUB_PLACEHOLDERS,
  RECOGNISED_AGENCIES,
  EVIDENCE_URL_HOSTS,
  DOK_ID_PATTERN,
  EVIDENCE_PATTERN,
} from '../../scripts/agentic/artifact-inventory.js';
import { validateAnalysisGate } from '../../scripts/agentic/analysis-gate.js';
import { createMinimalValidAnalysis, createTestDir, writeArtifact } from './gate-shared/fixtures.js';

let testDir: string;

beforeEach(() => {
  testDir = createTestDir();
});

afterEach(() => {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
});

describe('Artifact Inventory', () => {
  it('defines exactly 23 required artifacts', () => {
    expect(ALL_REQUIRED_ARTIFACTS).toHaveLength(23);
  });

  it('Family A has 9 artifacts', () => {
    expect(FAMILY_A_ARTIFACTS).toHaveLength(9);
  });

  it('Family B has 2 artifacts', () => {
    expect(FAMILY_B_ARTIFACTS).toHaveLength(2);
  });

  it('Family C has 5 artifacts', () => {
    expect(FAMILY_C_ARTIFACTS).toHaveLength(5);
  });

  it('Family D has 7 artifacts', () => {
    expect(FAMILY_D_ARTIFACTS).toHaveLength(7);
  });

  it('all artifact filenames end with .md', () => {
    for (const artifact of ALL_REQUIRED_ARTIFACTS) {
      expect(artifact.filename).toMatch(/\.md$/);
    }
  });

  it('REQUIRED_ARTIFACT_FILENAMES matches ALL_REQUIRED_ARTIFACTS count', () => {
    expect(REQUIRED_ARTIFACT_FILENAMES).toHaveLength(23);
  });

  it('MERMAID_REQUIRED_ARTIFACTS is a subset of all artifacts', () => {
    for (const filename of MERMAID_REQUIRED_ARTIFACTS) {
      expect(REQUIRED_ARTIFACT_FILENAMES).toContain(filename);
    }
  });

  it('PASS2_REQUIRED_ARTIFACTS excludes data-download-manifest.md', () => {
    expect(PASS2_REQUIRED_ARTIFACTS).not.toContain('data-download-manifest.md');
  });

  it('STUB_PLACEHOLDERS contains expected markers', () => {
    expect(STUB_PLACEHOLDERS).toContain('AI_MUST_REPLACE');
    expect(STUB_PLACEHOLDERS).toContain('[REQUIRED]');
    expect(STUB_PLACEHOLDERS).toContain('TODO:');
    expect(STUB_PLACEHOLDERS).toContain('Lorem ipsum');
  });

  it('RECOGNISED_AGENCIES contains known Swedish agencies', () => {
    expect(RECOGNISED_AGENCIES).toContain('Skatteverket');
    expect(RECOGNISED_AGENCIES).toContain('Polismyndigheten');
    expect(RECOGNISED_AGENCIES.length).toBe(12);
  });

  it('EVIDENCE_URL_HOSTS covers all required primary sources', () => {
    expect(EVIDENCE_URL_HOSTS).toContain('riksdagen.se');
    expect(EVIDENCE_URL_HOSTS).toContain('api.imf.org');
    expect(EVIDENCE_URL_HOSTS).toContain('statskontoret.se');
  });

  it('DOK_ID_PATTERN matches valid Riksdag document IDs', () => {
    expect(DOK_ID_PATTERN.test('H901FiU1')).toBe(true);
    expect(DOK_ID_PATTERN.test('HD01CU27')).toBe(true);
    expect(DOK_ID_PATTERN.test('invalid')).toBe(false);
    expect(DOK_ID_PATTERN.test('abc')).toBe(false);
  });

  it('EVIDENCE_PATTERN matches dok_ids and URL hosts', () => {
    expect(EVIDENCE_PATTERN.test('H901FiU1')).toBe(true);
    expect(EVIDENCE_PATTERN.test('riksdagen.se')).toBe(true);
    expect(EVIDENCE_PATTERN.test('api.imf.org')).toBe(true);
    expect(EVIDENCE_PATTERN.test('random text')).toBe(false);
  });
});

describe('validateAnalysisGate (orchestrator)', () => {
  it('returns passed=true for a fully seeded analysis directory', async () => {
    createMinimalValidAnalysis(testDir);
    const result = await validateAnalysisGate(testDir);
    const failureMessages = result.checks
      .filter((c) => !c.passed)
      .map((c) => `${c.checkId}/${c.artifact ?? ''}: ${c.message}`);
    expect(failureMessages, failureMessages.join('\n')).toEqual([]);
    expect(result.passed).toBe(true);
    expect(result.failureCount).toBe(0);
  });

  it('returns passed=false and aggregates check failures for an empty directory', async () => {
    const result = await validateAnalysisGate(testDir);
    expect(result.passed).toBe(false);
    expect(result.failureCount).toBeGreaterThan(20);
    // Sanity: failures should span multiple check IDs (artifact-existence,
    // per-document-coverage, …), not just a single category.
    const distinctCheckIds = new Set(
      result.checks.filter((c) => !c.passed).map((c) => c.checkId),
    );
    expect(distinctCheckIds.size).toBeGreaterThanOrEqual(2);
  });

  it('reports the dok_id that lacks per-document coverage', async () => {
    createMinimalValidAnalysis(testDir);
    // Overwrite the manifest with an extra dok_id whose analysis file
    // does NOT exist.
    writeArtifact(testDir, 'data-download-manifest.md', 'Docs:\n- H901FiU1\n- HD01CU27\n- HMISSING01\n');
    const result = await validateAnalysisGate(testDir);
    const missingCoverage = result.checks.find(
      (c) => !c.passed && c.checkId === 'per-document-coverage',
    );
    expect(missingCoverage?.message).toContain('HMISSING01');
  });
});
