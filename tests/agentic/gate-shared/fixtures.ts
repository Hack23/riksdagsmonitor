/**
 * @module tests/agentic/gate-shared/fixtures
 * @description Shared fixture builders for the per-check analysis-gate test
 *              suites. Lifted out of the monolithic
 *              `tests/agentic-analysis-gate.test.ts` (1 417 lines) as part of
 *              the follow-up to PR #2584 — each gate-check test now imports
 *              only the helpers it needs and stays well within the 250-line
 *              per-file budget.
 *
 * The integration seed `createMinimalValidAnalysis()` must keep a
 * **story-oriented** executive-brief H1 (memory invariant: not bare
 * "Executive Brief", "REPLACE THIS H1", "Executive Brief Template",
 * "AI_MUST_REPLACE", or "AI-generated political intelligence").
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  ALL_REQUIRED_ARTIFACTS,
  PASS2_REQUIRED_ARTIFACTS,
} from '../../../scripts/agentic/artifact-inventory.js';

/** Canonical methodology-reflection skeleton required by Check 7e. */
export const REQUIRED_REFLECTION_SECTIONS = `
## ICD 203 Analytic Tradecraft Compliance Audit

## Devil's-Advocate Key Judgment Coverage Matrix

| KJ ID | KJ summary | Challenged | DA row | Status |
|-------|------------|:----------:|--------|:------:|
| KJ-1 | A | ✅ | DA-01 | CLOSED |
| KJ-2 | B | ✅ | DA-02 | CLOSED |
| KJ-3 | C | ✅ | DA-03 | CLOSED |

## Confidence Distribution by Key Judgment (Posterior Required)
| KJ | Prior | Evidence | Posterior | Rationale |
|----|-------|----------|-----------|-----------|
| KJ-1 | HIGH | new data | MEDIUM | downgrade |
| KJ-2 | MEDIUM | confirmation | HIGH | upgrade |
| KJ-3 | LOW | unchanged | LOW | stable |

## Lagrådet / Statskontoret / SKR Tracking

## Sibling-Folder Ingestion Record (Tier-C)

## Re-run Log (Unified Schema)
| run_id | attempt | new dok_ids | artifacts extended | flags closed | vintage refresh |
|--------|---------|-------------|--------------------|--------------|-----------------|
| 1 | 1 | none | methodology-reflection.md | 0 | no |

## Banned-Phrase Audit (Zero-Count Grid)

## Pass 1 → Pass 2 Delta Table
| Pass 1 | Pass 2 | Delta |
|--------|--------|-------|
| A | B | +1 |

## Improvement Opportunities → PIR Roll-Forward
`;

export function createTestDir(): string {
  const dir = join(tmpdir(), `agentic-gate-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeArtifact(dir: string, filename: string, content: string): void {
  const filePath = join(dir, filename);
  writeFileSync(filePath, content, 'utf-8');
}

/**
 * Seed an analysis directory with all 23 required artifacts, a `documents/`
 * per-document-coverage layout, a valid `pir-status.json`, and a `pass1/`
 * snapshot — the minimal layout that satisfies every gate check.
 */
export function createMinimalValidAnalysis(dir: string): void {
  // Create all 23 required artifacts with minimal valid content
  for (const artifact of ALL_REQUIRED_ARTIFACTS) {
    let content = `# ${artifact.filename}\n\nMinimal content for testing.\n`;

    // Add Mermaid if required
    if (artifact.requiresMermaid) {
      content += '\n```mermaid\ngraph TD\n  A --> B\n  style A fill:#f00\n```\n';
    }

    // Add specific content for structural checks
    if (artifact.filename === 'executive-brief.md') {
      // Story-oriented H1 — memory invariant must remain. Bare 'Executive
      // Brief', 'REPLACE THIS H1', 'Executive Brief Template',
      // 'AI_MUST_REPLACE' and 'AI-generated political intelligence' are
      // all rejected by the gate; this title is none of them.
      content = '# Riksdag approves SEK 12 bn fuel-tax cut ahead of September election\n\n## 🎯 BLUF\n\nBrief summary.\n\n## 🧭 3 Decisions This Brief Supports\n\n1. Decision A\n\n```mermaid\ngraph TD\n  A --> B\n  style A fill:#f00\n```\n';
    } else if (artifact.filename === 'swot-analysis.md') {
      // Check 4: SWOT sections with evidence citations (dok_id per bullet)
      content = '# SWOT Analysis\n\n'
        + '### Strengths\n- Strong fiscal position H901FiU1 government reform data\n- Parliamentary support HD01CU27 vote record\n\n'
        + '### Weaknesses\n- Budget deficit riksdagen.se/sv/dokument-lagar\n- Limited capacity regeringen.se/rattsliga-dokument\n\n'
        + '### Opportunities\n- Economic growth scb.se/statistik\n- Policy reform api.imf.org/external/datamapper\n\n'
        + '### Threats\n- Geopolitical risks www.imf.org/en/Publications\n- Market volatility data.imf.org/regular.aspx\n\n'
        + '```mermaid\ngraph TD\n  A --> B\n  style A fill:#f00\n```\n';
    } else if (artifact.filename === 'significance-scoring.md') {
      // Check 4: ranked bullets with evidence citations
      content = '# Significance Scoring\n\n'
        + '1. Fiscal policy reform H901FiU1 high impact\n'
        + '2. Tax legislation HD01CU27 medium impact\n'
        + '3. Social welfare riksdagen.se/sv/ high importance\n\n'
        + '| Rank | Item | Evidence |\n|------|------|----------|\n'
        + '| 1 | Reform | H901FiU1 |\n'
        + '| 2 | Tax | HD01CU27 |\n\n'
        + '```mermaid\ngraph TD\n  A[H901FiU1] --> B\n  style A fill:#f00\n```\n';
    } else if (artifact.filename === 'intelligence-assessment.md') {
      content = '# Intelligence Assessment\n\n## Key Judgment KJ-1\nHIGH confidence.\n\n## Key Judgment KJ-2\nMEDIUM confidence.\n\n## Key Judgment KJ-3\nLOW confidence.\n\nReferences PIR-FISCAL-001.\n';
    } else if (artifact.filename === 'scenario-analysis.md') {
      content = '# Scenario Analysis\n\n## Scenario 1: Status Quo\n\n## Scenario 2: Reform\n\n## Scenario 3: Crisis\n\n';
    } else if (artifact.filename === 'devils-advocate.md') {
      content = `# Devil's Advocate

## Hypothesis 1: Government succeeds

## Hypothesis 2: Opposition blocks

## Hypothesis 3: Coalition fractures

## Key Judgment Coverage Matrix (Required)

| KJ ID | KJ summary | Hypothesis | Challenged |
|-------|------------|------------|:----------:|
| KJ-1 | Fiscal | H1 | ✅ |
| KJ-2 | Coalition | H2 | ✅ |
| KJ-3 | Reform | H3 | ✅ |
`;
    } else if (artifact.filename === 'methodology-reflection.md') {
      content = `# Methodology Reflection\n\n${REQUIRED_REFLECTION_SECTIONS}`;
    } else if (artifact.filename === 'comparative-international.md') {
      content = '# Comparative International\n\n**Comparator set**: Denmark, Norway, Finland\n\n| Country | Policy |\n|---------|--------|\n| Denmark | A |\n| Norway | B |\n';
    } else if (artifact.filename === 'forward-indicators.md') {
      content = '# Forward Indicators\n\n' + Array.from({ length: 12 }, (_, i) =>
        `- 2026-06-${String(i + 1).padStart(2, '0')}: Indicator ${i + 1}\n`
      ).join('') + '\n```mermaid\ngraph TD\n  A --> B\n  style A fill:#f00\n```\n';
    } else if (artifact.filename === 'coalition-mathematics.md') {
      content = '# Coalition Mathematics\n\n| Party | Seats | Ja | Nej |\n|-------|-------|-----|-----|\n| S | 107 | Yes | |\n\n```mermaid\ngraph TD\n  A --> B\n  style A fill:#f00\n```\n';
    } else if (artifact.filename === 'data-download-manifest.md') {
      content = '# Data Download Manifest\n\nDownloaded documents:\n- H901FiU1\n- HD01CU27\n';
    }

    writeArtifact(dir, artifact.filename, content);
  }

  // Create documents directory with per-document analyses
  const docsDir = join(dir, 'documents');
  mkdirSync(docsDir, { recursive: true });
  writeFileSync(join(docsDir, 'H901FiU1-analysis.md'), '# H901FiU1 Analysis\n\nDocument analysis content.\n', 'utf-8');
  writeFileSync(join(docsDir, 'HD01CU27-analysis.md'), '# HD01CU27 Analysis\n\nDocument analysis content.\n', 'utf-8');

  // Create PIR status sidecar
  const pirStatus = {
    schema_version: '1.0',
    cycle: 'propositions',
    date: '2026-05-01',
    subfolder: 'propositions',
    pirs: [
      {
        pir_id: 'PIR-FISCAL-001',
        statement: 'What is the fiscal impact?',
        status: 'open',
        confidence: 'MEDIUM',
      },
    ],
    generated_at: '2026-05-01T10:00:00Z',
  };
  writeFileSync(join(dir, 'pir-status.json'), JSON.stringify(pirStatus, null, 2), 'utf-8');

  // Create pass1/ snapshot directory with content that differs from the current
  // artifacts — this satisfies check 6 (Pass-2 evidence) without requiring
  // a 180-second mtime window that is not reproducible in a test environment.
  const pass1Dir = join(dir, 'pass1');
  mkdirSync(pass1Dir, { recursive: true });
  for (const filename of PASS2_REQUIRED_ARTIFACTS) {
    const mainPath = join(dir, filename);
    if (existsSync(mainPath)) {
      const mainContent = readFileSync(mainPath, 'utf-8');
      // Prepend a pass-1 marker so the snapshot differs from the final version
      writeFileSync(join(pass1Dir, filename), `<!-- pass1 draft -->\n${mainContent}`, 'utf-8');
    }
  }
}
