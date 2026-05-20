/**
 * @module tests/agentic/gate-checks/executive-brief
 * @description Check 7a — executive-brief.md BLUF/Decisions structure and
 *              H1 quality (boilerplate, dates, dangling punctuation,
 *              renderer collapse, across-days uniqueness).
 *
 * The Markdown-vs-HTML H1 parity scenarios live in the sibling
 * `executive-brief-h1.test.ts` file.
 *
 * @see scripts/agentic/gate-checks/executive-brief.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { checkExecutiveBrief } from '../../../scripts/agentic/gate-checks/executive-brief.js';
import { createTestDir, writeArtifact } from '../gate-shared/fixtures.js';

let testDir: string;

describe('checkExecutiveBrief', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes with publishable H1, BLUF and Decisions sections', async () => {
    writeArtifact(testDir, 'executive-brief.md',
      '# Riksdag narrowly approves FiU48 fuel-tax cut\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions This Brief Supports\n\n1. A\n');
    const results = await checkExecutiveBrief(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'executive-brief.md');
    expect(failures).toHaveLength(0);
  });

  it('fails when BLUF missing', async () => {
    writeArtifact(testDir, 'executive-brief.md',
      '# Riksdag approves FiU48\n\n## Introduction\n\n## Decisions This Brief Supports\n\n1. A\n');
    const results = await checkExecutiveBrief(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'executive-brief.md');
    expect(failures.length).toBeGreaterThan(0);
  });

  it("fails when H1 is bare-boilerplate '# Executive Brief'", async () => {
    writeArtifact(testDir, 'executive-brief.md',
      '# Executive Brief\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
    const results = await checkExecutiveBrief(testDir);
    const failures = results.filter(
      (r) => !r.passed && r.artifact === 'executive-brief.md' && /bare boilerplate/i.test(r.message ?? ''),
    );
    expect(failures.length).toBeGreaterThan(0);
  });

  it("fails when H1 contains the banned phrase 'AI-generated political intelligence'", async () => {
    writeArtifact(testDir, 'executive-brief.md',
      '# AI-generated political intelligence: daily Riksdag brief\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
    const results = await checkExecutiveBrief(testDir);
    const failures = results.filter(
      (r) => !r.passed && r.artifact === 'executive-brief.md' && /AI-generated political intelligence/i.test(r.message ?? ''),
    );
    expect(failures.length).toBeGreaterThan(0);
  });

  it('tolerates a leading emoji in an otherwise publishable H1', async () => {
    writeArtifact(testDir, 'executive-brief.md',
      '# 📰 Riksdag approves FiU48 narrowly — opposition splits on amendment 3\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
    const results = await checkExecutiveBrief(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'executive-brief.md');
    expect(failures).toHaveLength(0);
  });

  it('fails when the brief has no H1 at all (renderer would fall back to BLUF first sentence)', async () => {
    writeArtifact(testDir, 'executive-brief.md',
      '## 🎯 BLUF\n\nThree simultaneous pressure points are converging.\n\n## 🧭 Decisions\n\n1. A\n');
    const results = await checkExecutiveBrief(testDir);
    const failures = results.filter(
      (r) => !r.passed && r.artifact === 'executive-brief.md' && /no '# H1' heading/i.test(r.message ?? ''),
    );
    expect(failures.length).toBeGreaterThan(0);
  });

  it("fails when H1 collapses to nothing via cleanArticleTitle (subfolder-label boilerplate)", async () => {
    const subfolderDir = join(tmpdir(), `agentic-gate-test-realtime-pulse-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(subfolderDir, { recursive: true });
    try {
      writeArtifact(subfolderDir, 'executive-brief.md',
        '# Executive Brief — Realtime Pulse 2026-05-16\n\n## 🎯 BLUF\n\nSwedish parliamentary activity.\n\n## 🧭 Decisions\n\n1. A\n');
      const results = await checkExecutiveBrief(subfolderDir);
      const failures = results.filter(
        (r) => !r.passed && r.artifact === 'executive-brief.md' && /collapses to nothing/i.test(r.message ?? ''),
      );
      expect(failures.length).toBeGreaterThan(0);
    } finally {
      rmSync(subfolderDir, { recursive: true, force: true });
    }
  });

  it('fails when H1 contains a literal ISO date (YYYY-MM-DD)', async () => {
    writeArtifact(testDir, 'executive-brief.md',
      '# Sweden Evening Analysis 2026-05-11: Constitutional Moment Continues\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
    const results = await checkExecutiveBrief(testDir);
    const failures = results.filter(
      (r) => !r.passed && r.artifact === 'executive-brief.md' && /literal.*date/i.test(r.message ?? ''),
    );
    expect(failures.length).toBeGreaterThan(0);
  });

  it('fails when H1 contains an English long-form date', async () => {
    writeArtifact(testDir, 'executive-brief.md',
      '# Riksdagsmonitor Realtime Pulse — 15 May 2026: Defence and Aid Tensions Converge\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
    const results = await checkExecutiveBrief(testDir);
    const failures = results.filter(
      (r) => !r.passed && r.artifact === 'executive-brief.md' && /literal.*date/i.test(r.message ?? ''),
    );
    expect(failures.length).toBeGreaterThan(0);
  });

  it('fails when H1 contains a Swedish long-form date', async () => {
    writeArtifact(testDir, 'executive-brief.md',
      '# Riksdagen Realtime Pulse 12 maj 2026: Försvarsdebatt och migrationspaket\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
    const results = await checkExecutiveBrief(testDir);
    const failures = results.filter(
      (r) => !r.passed && r.artifact === 'executive-brief.md' && /literal.*date/i.test(r.message ?? ''),
    );
    expect(failures.length).toBeGreaterThan(0);
  });

  it('fails when H1 ends with a trailing comma', async () => {
    writeArtifact(testDir, 'executive-brief.md',
      '# Sweden Evening Analysis, Constitutional Moment Builds Toward Election Sprint,\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
    const results = await checkExecutiveBrief(testDir);
    const failures = results.filter(
      (r) => !r.passed && r.artifact === 'executive-brief.md' && /dangling punctuation/i.test(r.message ?? ''),
    );
    expect(failures.length).toBeGreaterThan(0);
  });

  it('fails when H1 ends with a coordinating connector', async () => {
    writeArtifact(testDir, 'executive-brief.md',
      '# Riksdag Approves FiU48 Fuel-Tax Cut Despite Opposition From\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
    const results = await checkExecutiveBrief(testDir);
    const failures = results.filter(
      (r) => !r.passed && r.artifact === 'executive-brief.md' && /coordinating connector/i.test(r.message ?? ''),
    );
    expect(failures.length).toBeGreaterThan(0);
  });

  it('fails when H1 is normalised-identical to a prior day brief in the same subfolder', async () => {
    const fakeRoot = join(tmpdir(), `agentic-gate-test-acrossdays-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const subfolder = 'forecast-year-ahead';
    const today = join(fakeRoot, 'analysis', 'daily', '2026-05-16', subfolder);
    const yesterday = join(fakeRoot, 'analysis', 'daily', '2026-05-15', subfolder);
    mkdirSync(today, { recursive: true });
    mkdirSync(yesterday, { recursive: true });
    try {
      const h1Line = '# Sweden Year-Ahead Forecast: Tidö Coalition Faces Election Sprint\n';
      const body = '\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n';
      writeArtifact(today, 'executive-brief.md', h1Line + body);
      writeArtifact(yesterday, 'executive-brief.md', h1Line + body);
      const results = await checkExecutiveBrief(today);
      const failures = results.filter(
        (r) => !r.passed && r.artifact === 'executive-brief.md' && /normalised-identical/i.test(r.message ?? ''),
      );
      expect(failures.length).toBeGreaterThan(0);
      expect(failures[0]?.message).toMatch(/2026-05-15/);
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });

  it('passes when prior-day brief in same subfolder has a different H1', async () => {
    const fakeRoot = join(tmpdir(), `agentic-gate-test-acrossdays-ok-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const subfolder = 'evening-analysis';
    const today = join(fakeRoot, 'analysis', 'daily', '2026-05-16', subfolder);
    const yesterday = join(fakeRoot, 'analysis', 'daily', '2026-05-15', subfolder);
    mkdirSync(today, { recursive: true });
    mkdirSync(yesterday, { recursive: true });
    try {
      const body = '\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n';
      writeArtifact(today, 'executive-brief.md',
        '# Riksdag Approves FiU48 Fuel-Tax Cut by 175-174 Margin\n' + body);
      writeArtifact(yesterday, 'executive-brief.md',
        '# Opposition Mobilises Against Migration Restriction Package\n' + body);
      const results = await checkExecutiveBrief(today);
      const failures = results.filter(
        (r) => !r.passed && r.artifact === 'executive-brief.md' && /normalised-identical/i.test(r.message ?? ''),
      );
      expect(failures).toHaveLength(0);
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });
});
