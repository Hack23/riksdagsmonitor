/**
 * @module tests/agentic/gate-checks/mermaid-diagrams
 * @description Check 5 — required Mermaid blocks with colour-coded config.
 * @see scripts/agentic/gate-checks/mermaid-diagrams.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { checkMermaidDiagrams } from '../../../scripts/agentic/gate-checks/mermaid-diagrams.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkMermaidDiagrams', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes with Mermaid block and style directive', async () => {
    writeArtifact(testDir, 'synthesis-summary.md', '# Summary\n\n```mermaid\ngraph TD\n  A --> B\n  style A fill:#f00\n```\n');
    const results = await checkMermaidDiagrams(testDir);
    const passes = results.filter((r) => r.passed);
    expect(passes.length).toBeGreaterThan(0);
  });

  it('passes with themeVariables', async () => {
    writeArtifact(testDir, 'synthesis-summary.md', '# Summary\n\n```mermaid\n%%{init: {themeVariables: {primaryColor: "#f00"}}}%%\ngraph TD\n  A --> B\n```\n');
    const results = await checkMermaidDiagrams(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
  });

  it('fails when Mermaid block missing', async () => {
    writeArtifact(testDir, 'synthesis-summary.md', '# Summary\n\nNo diagram here.\n');
    const results = await checkMermaidDiagrams(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.message).toContain('missing Mermaid block');
  });

  it('fails when colour config missing', async () => {
    writeArtifact(testDir, 'synthesis-summary.md', '# Summary\n\n```mermaid\ngraph TD\n  A --> B\n```\n');
    const results = await checkMermaidDiagrams(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.message).toContain('colour-coded config');
  });
});
