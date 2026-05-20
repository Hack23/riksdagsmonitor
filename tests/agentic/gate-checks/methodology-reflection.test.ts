/**
 * @module tests/agentic/gate-checks/methodology-reflection
 * @description Check 7e — methodology-reflection.md must contain the nine
 *              required `##` sections, a 100% KJ Coverage Matrix, filled
 *              Posterior cells in the Confidence Distribution, and the
 *              unified Re-run Log schema.
 * @see scripts/agentic/gate-checks/methodology-reflection.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { checkMethodologyReflection } from '../../../scripts/agentic/gate-checks/methodology-reflection.js';
import {
  REQUIRED_REFLECTION_SECTIONS,
  createTestDir,
  writeArtifact,
} from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkMethodologyReflection', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes when all nine required methodology-reflection sections are present', async () => {
    writeArtifact(testDir, 'methodology-reflection.md', REQUIRED_REFLECTION_SECTIONS);
    const results = await checkMethodologyReflection(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
    expect(failures).toHaveLength(0);
  });

  it('accepts ## headings with leading emoji', async () => {
    const withEmoji = REQUIRED_REFLECTION_SECTIONS
      .replace('## ICD 203', '## 📋 ICD 203')
      .replace("## Devil's-Advocate", "## 🎯 Devil's-Advocate")
      .replace('## Confidence Distribution', '## 📈 Confidence Distribution')
      .replace('## Lagrådet', '## ⚖️ Lagrådet')
      .replace('## Sibling-Folder', '## 🔗 Sibling-Folder')
      .replace('## Re-run Log', '## 🔁 Re-run Log')
      .replace('## Banned-Phrase', '## 🚫 Banned-Phrase')
      .replace('## Pass 1', '## 🔄 Pass 1')
      .replace('## Improvement Opportunities', '## 🧭 Improvement Opportunities');
    writeArtifact(testDir, 'methodology-reflection.md', withEmoji);
    const results = await checkMethodologyReflection(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
    expect(failures).toHaveLength(0);
  });

  it('fails when required sections are missing', async () => {
    writeArtifact(testDir, 'methodology-reflection.md',
      '## ICD 203 Analytic Tradecraft Compliance Audit\n\n## Banned-Phrase Audit (Zero-Count Grid)\n');
    const results = await checkMethodologyReflection(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.message).toContain('missing required section(s)');
  });

  it('fails when phrases are present only in body text but not as ## headings', async () => {
    const phraseOnly = `# Methodology Reflection

Paragraph mentioning ICD 203 Analytic Tradecraft Compliance Audit and Devil's-Advocate Key Judgment Coverage Matrix and Confidence Distribution by Key Judgment (Posterior Required) and Lagrådet / Statskontoret / SKR Tracking and Sibling-Folder Ingestion Record (Tier-C) and Re-run Log (Unified Schema) and Banned-Phrase Audit (Zero-Count Grid) and Pass 1 Pass 2 Delta Table and Improvement Opportunities PIR Roll-Forward.

| run_id | attempt | new dok_ids | artifacts extended | flags closed | vintage refresh |
|--------|---------|-------------|--------------------|--------------|-----------------|
| 1 | 1 | none | x | 0 | no |
`;
    writeArtifact(testDir, 'methodology-reflection.md', phraseOnly);
    const results = await checkMethodologyReflection(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
    expect(failures.length).toBeGreaterThan(0);
  });

  it('fails when KJ Coverage Matrix has ❌ rows', async () => {
    const broken = REQUIRED_REFLECTION_SECTIONS.replace(
      '| KJ-2 | B | ✅ | DA-02 | CLOSED |',
      '| KJ-2 | B | ❌ | DA-02 | OPEN |',
    );
    writeArtifact(testDir, 'methodology-reflection.md', broken);
    const results = await checkMethodologyReflection(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some((f) => /100% coverage|no ❌ \/ OPEN/.test(f.message ?? ''))).toBe(true);
  });

  it('fails when a Confidence Distribution KJ row has empty Posterior', async () => {
    const broken = REQUIRED_REFLECTION_SECTIONS.replace(
      '| KJ-1 | HIGH | new data | MEDIUM | downgrade |',
      '| KJ-1 | HIGH | new data |  | downgrade |',
    );
    writeArtifact(testDir, 'methodology-reflection.md', broken);
    const results = await checkMethodologyReflection(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some((f) => /filled Posterior per KJ row/.test(f.message ?? ''))).toBe(true);
  });

  it('fails when Posterior cell is a `[REQUIRED]` placeholder', async () => {
    const broken = REQUIRED_REFLECTION_SECTIONS.replace(
      '| KJ-2 | MEDIUM | confirmation | HIGH | upgrade |',
      '| KJ-2 | MEDIUM | confirmation | [REQUIRED] | upgrade |',
    );
    writeArtifact(testDir, 'methodology-reflection.md', broken);
    const results = await checkMethodologyReflection(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some((f) => /filled Posterior per KJ row/.test(f.message ?? ''))).toBe(true);
  });

  it('fails when Re-run Log section is present but column header row is outside the section', async () => {
    const broken = REQUIRED_REFLECTION_SECTIONS
      .replace(
        '## Re-run Log (Unified Schema)\n| run_id | attempt | new dok_ids | artifacts extended | flags closed | vintage refresh |\n|--------|---------|-------------|--------------------|--------------|-----------------|\n| 1 | 1 | none | methodology-reflection.md | 0 | no |\n',
        '## Re-run Log (Unified Schema)\n\n_no table here_\n',
      )
      + '\n## Bogus\n| run_id | attempt | new dok_ids | artifacts extended | flags closed | vintage refresh |\n|---|---|---|---|---|---|\n| 1 | 1 | none | x | 0 | no |\n';
    writeArtifact(testDir, 'methodology-reflection.md', broken);
    const results = await checkMethodologyReflection(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some((f) => /Re-run log unified schema/.test(f.message ?? ''))).toBe(true);
  });
});
