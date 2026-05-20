/**
 * @module tests/agentic/gate-checks/executive-brief-h1
 * @description H1 validators (Markdown + centered `<h1>` parity) for the
 *              executive-brief gate. Memory invariant: the gate must
 *              inspect BOTH Markdown H1 (`# …`) and centered HTML `<h1>`
 *              template headings in TS and bash.
 *
 * @see scripts/agentic/gate-checks/executive-brief-h1.ts
 * @see .github/prompts/05-analysis-gate.md §Check 7 H1 parity rules
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';

import { extractExecutiveBriefH1 } from '../../../scripts/agentic/gate-checks/executive-brief-h1.js';
import { checkExecutiveBrief } from '../../../scripts/agentic/gate-checks/executive-brief.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('extractExecutiveBriefH1', () => {
  it('extracts the visible text from a Markdown H1', () => {
    expect(
      extractExecutiveBriefH1('# Riksdag approves FiU48\n\n## BLUF\n\n…'),
    ).toBe('Riksdag approves FiU48');
  });

  it('extracts the visible text from a centered HTML <h1> template heading', () => {
    expect(
      extractExecutiveBriefH1(
        '<h1 align="center">📰 Riksdag approves FiU48</h1>\n\n## BLUF\n\n…',
      ),
    ).toBe('📰 Riksdag approves FiU48');
  });

  it('prefers the Markdown H1 when both forms are present', () => {
    // Per gate spec the Markdown H1 wins — HTML is the template fallback
    // used by some renderer-generated stubs.
    const content = '# Markdown wins\n\n<h1>HTML fallback</h1>\n';
    expect(extractExecutiveBriefH1(content)).toBe('Markdown wins');
  });

  it('returns null when neither form is present', () => {
    expect(extractExecutiveBriefH1('## Only a BLUF heading here\n')).toBeNull();
  });

  it('strips HTML tags and entities from the heading value', () => {
    expect(
      extractExecutiveBriefH1('<h1><span>Riksdag&nbsp;approves</span> FiU48</h1>'),
    ).toBe('Riksdag approves FiU48');
  });
});

describe('checkExecutiveBrief — H1 placeholder parity (Markdown + HTML)', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("fails when H1 still contains the 'REPLACE THIS H1' template placeholder (Markdown H1 path)", async () => {
    writeArtifact(testDir, 'executive-brief.md',
      '# 📰 Executive Brief Template — REPLACE THIS H1 WITH A PUBLISHABLE STORY-ORIENTED TITLE\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
    const results = await checkExecutiveBrief(testDir);
    const failures = results.filter(
      (r) => !r.passed && r.artifact === 'executive-brief.md' && /REPLACE THIS H1/i.test(r.message ?? ''),
    );
    expect(failures.length).toBeGreaterThan(0);
  });

  it('fails when the template placeholder is left in an HTML H1 (centered <h1> parity)', async () => {
    writeArtifact(testDir, 'executive-brief.md',
      '<h1 align="center">📰 Executive Brief Template — REPLACE THIS H1 WITH A PUBLISHABLE STORY-ORIENTED TITLE</h1>\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
    const results = await checkExecutiveBrief(testDir);
    const failures = results.filter(
      (r) => !r.passed && r.artifact === 'executive-brief.md' && /REPLACE THIS H1/i.test(r.message ?? ''),
    );
    expect(failures.length).toBeGreaterThan(0);
  });
});
