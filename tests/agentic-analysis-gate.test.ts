/**
 * @module tests/agentic-analysis-gate
 * @description Unit tests for the analysis gate validation logic extracted
 *              from `.github/prompts/05-analysis-gate.md`.
 *
 * Tests cover:
 *   - Artifact inventory type definitions and constants
 *   - Gate check 1: artifact existence (present and non-empty)
 *   - Gate check 2: per-document coverage
 *   - Gate check 3: stub placeholder detection (including documents/ dir)
 *   - Gate check 4: evidence citations (SWOT and significance-scoring)
 *   - Gate check 5: Mermaid diagram validation
 *   - Gate check 6: Pass-2 evidence (pass1/ snapshot or mtime)
 *   - Gate check 7: Family C structure checks
 *   - Gate check 8: Family D structure checks
 *   - Gate check 9: PIR status sidecar validation (incl. answer_summary rule)
 *   - Gate check 9b: Statskontoret evidence
 *   - Integration: full gate validation (result.passed === true)
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  ALL_REQUIRED_ARTIFACTS,
  FAMILY_A_ARTIFACTS,
  FAMILY_B_ARTIFACTS,
  FAMILY_C_ARTIFACTS,
  FAMILY_D_ARTIFACTS,
  REQUIRED_ARTIFACT_FILENAMES,
  MERMAID_REQUIRED_ARTIFACTS,
  PASS2_REQUIRED_ARTIFACTS,
  STUB_PLACEHOLDERS,
  RECOGNISED_AGENCIES,
  EVIDENCE_URL_HOSTS,
  DOK_ID_PATTERN,
  EVIDENCE_PATTERN,
} from '../scripts/agentic/artifact-inventory.js';

import {
  validateAnalysisGate,
  checkArtifactExistence,
  checkPerDocumentCoverage,
  checkNoStubs,
  checkEvidenceCitations,
  checkMermaidDiagrams,
  checkPass2Evidence,
  checkFamilyCStructure,
  checkFamilyDStructure,
  checkPirStatus,
  checkStatskontoretEvidence,
  extractDokIds,
} from '../scripts/agentic/analysis-gate.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let testDir: string;
const REQUIRED_REFLECTION_SECTIONS = `
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

function createTestDir(): string {
  const dir = join(tmpdir(), `agentic-gate-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeArtifact(dir: string, filename: string, content: string): void {
  const filePath = join(dir, filename);
  writeFileSync(filePath, content, 'utf-8');
}

function createMinimalValidAnalysis(dir: string): void {
  // Create all 23 required artifacts with minimal valid content
  for (const artifact of ALL_REQUIRED_ARTIFACTS) {
    let content = `# ${artifact.filename}\n\nMinimal content for testing.\n`;

    // Add Mermaid if required
    if (artifact.requiresMermaid) {
      content += '\n```mermaid\ngraph TD\n  A --> B\n  style A fill:#f00\n```\n';
    }

    // Add specific content for structural checks
    if (artifact.filename === 'executive-brief.md') {
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

// ---------------------------------------------------------------------------
// Tests: Artifact Inventory
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests: extractDokIds
// ---------------------------------------------------------------------------

describe('extractDokIds', () => {
  it('extracts dok_ids from markdown content', () => {
    const content = 'Documents: H901FiU1, HD01CU27, and H901AU10.';
    const ids = extractDokIds(content);
    expect(ids).toContain('H901FiU1');
    expect(ids).toContain('HD01CU27');
    expect(ids).toContain('H901AU10');
  });

  it('deduplicates dok_ids', () => {
    const content = 'H901FiU1 appears twice: H901FiU1.';
    const ids = extractDokIds(content);
    expect(ids.filter((id) => id === 'H901FiU1')).toHaveLength(1);
  });

  it('returns empty array when no dok_ids found', () => {
    const content = 'No document references here.';
    expect(extractDokIds(content)).toHaveLength(0);
  });

  it('handles empty content', () => {
    expect(extractDokIds('')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: Check 1 — Artifact Existence
// ---------------------------------------------------------------------------

describe('checkArtifactExistence', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('reports all artifacts missing when directory is empty', () => {
    const results = checkArtifactExistence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(23);
  });

  it('reports success when all artifacts present', () => {
    for (const filename of REQUIRED_ARTIFACT_FILENAMES) {
      writeArtifact(testDir, filename, 'content');
    }
    const results = checkArtifactExistence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
  });

  it('reports specific missing artifact', () => {
    for (const filename of REQUIRED_ARTIFACT_FILENAMES) {
      if (filename !== 'swot-analysis.md') {
        writeArtifact(testDir, filename, 'content');
      }
    }
    const results = checkArtifactExistence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.artifact).toBe('swot-analysis.md');
  });

  it('reports failure for zero-byte (empty) artifact', () => {
    for (const filename of REQUIRED_ARTIFACT_FILENAMES) {
      // Write empty content for one artifact, non-empty for others
      writeArtifact(testDir, filename, filename === 'README.md' ? '' : 'content');
    }
    const results = checkArtifactExistence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.message).toContain('Empty artifact');
    expect(failures[0]?.artifact).toBe('README.md');
  });
});

// ---------------------------------------------------------------------------
// Tests: Check 2 — Per-document Coverage
// ---------------------------------------------------------------------------

describe('checkPerDocumentCoverage', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes when all dok_ids have analysis files', async () => {
    writeArtifact(testDir, 'data-download-manifest.md', 'Docs: H901FiU1, HD01CU27');
    const docsDir = join(testDir, 'documents');
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, 'H901FiU1-analysis.md'), 'analysis', 'utf-8');
    writeFileSync(join(docsDir, 'HD01CU27-analysis.md'), 'analysis', 'utf-8');

    const results = await checkPerDocumentCoverage(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
  });

  it('reports missing document analysis', async () => {
    writeArtifact(testDir, 'data-download-manifest.md', 'Docs: H901FiU1, HD01CU27');
    const docsDir = join(testDir, 'documents');
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, 'H901FiU1-analysis.md'), 'analysis', 'utf-8');
    // HD01CU27 intentionally missing

    const results = await checkPerDocumentCoverage(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.message).toContain('HD01CU27');
  });

  it('reports failure when manifest has no dok_ids', async () => {
    writeArtifact(testDir, 'data-download-manifest.md', 'No documents here.');

    const results = await checkPerDocumentCoverage(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.message).toContain('no dok_id entries');
  });

  it('returns empty when manifest does not exist', async () => {
    const results = await checkPerDocumentCoverage(testDir);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: Check 3 — No Stubs
// ---------------------------------------------------------------------------

describe('checkNoStubs', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes when no stubs present', async () => {
    writeArtifact(testDir, 'README.md', '# README\n\nClean content.');
    const results = await checkNoStubs(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
  });

  it('detects AI_MUST_REPLACE placeholder', async () => {
    writeArtifact(testDir, 'README.md', '# README\n\nAI_MUST_REPLACE this.');
    const results = await checkNoStubs(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.message).toContain('AI_MUST_REPLACE');
  });

  it('detects TODO: placeholder', async () => {
    writeArtifact(testDir, 'swot-analysis.md', '# SWOT\n\nTODO: add evidence');
    const results = await checkNoStubs(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.message).toContain('TODO:');
  });

  it('detects multiple stub types in same file', async () => {
    writeArtifact(testDir, 'README.md', 'AI_MUST_REPLACE and [REQUIRED] and TODO: fix');
    const results = await checkNoStubs(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(3);
  });

  it('detects stubs in documents/ directory (Family E)', async () => {
    // No stubs in required artifacts
    writeArtifact(testDir, 'README.md', '# README\n\nClean content.');
    // But stub in documents/ per-document analysis
    const docsDir = join(testDir, 'documents');
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, 'H901FiU1-analysis.md'), '# Analysis\n\nAI_MUST_REPLACE\n', 'utf-8');

    const results = await checkNoStubs(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.artifact).toContain('documents/');
  });
});

// ---------------------------------------------------------------------------
// Tests: Check 4 — Evidence Citations
// ---------------------------------------------------------------------------

describe('checkEvidenceCitations', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes when all SWOT bullets have evidence', async () => {
    writeArtifact(testDir, 'swot-analysis.md',
      '# SWOT\n\n'
      + '### Strengths\n- Strong position H901FiU1 data\n\n'
      + '### Weaknesses\n- Deficit HD01CU27 evidence\n\n'
      + '### Opportunities\n- Growth riksdagen.se/sv/\n\n'
      + '### Threats\n- Risk www.imf.org/en/\n\n'
    );
    writeArtifact(testDir, 'significance-scoring.md', '# Scores\n\n1. Item H901FiU1\n');
    const results = await checkEvidenceCitations(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'swot-analysis.md');
    expect(failures).toHaveLength(0);
  });

  it('fails when a SWOT bullet is missing evidence', async () => {
    writeArtifact(testDir, 'swot-analysis.md',
      '# SWOT\n\n### Strengths\n- Strong position with no citation\n'
    );
    writeArtifact(testDir, 'significance-scoring.md', '# Scores\n\n');
    const results = await checkEvidenceCitations(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.checkId).toBe('evidence-citations');
  });

  it('passes when all significance-scoring bullets have evidence', async () => {
    writeArtifact(testDir, 'swot-analysis.md', '# SWOT\n\n');
    writeArtifact(testDir, 'significance-scoring.md',
      '# Significance\n\n1. Reform H901FiU1\n2. Tax HD01CU27\n'
    );
    const results = await checkEvidenceCitations(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'significance-scoring.md');
    expect(failures).toHaveLength(0);
  });

  it('fails when significance-scoring bullet is missing evidence', async () => {
    writeArtifact(testDir, 'swot-analysis.md', '# SWOT\n\n');
    writeArtifact(testDir, 'significance-scoring.md',
      '# Significance\n\n1. Generic ranked item with no citation\n'
    );
    const results = await checkEvidenceCitations(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'significance-scoring.md');
    expect(failures.length).toBeGreaterThan(0);
  });

  it('returns empty when files do not exist', async () => {
    const results = await checkEvidenceCitations(testDir);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: Check 5 — Mermaid Diagrams
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests: Check 6 — Pass-2 Evidence
// ---------------------------------------------------------------------------

describe('checkPass2Evidence', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes when pass1/ snapshot differs from current file', async () => {
    writeArtifact(testDir, 'README.md', '# Pass-2 improved content\n\nMore analysis here.\n');
    const pass1Dir = join(testDir, 'pass1');
    mkdirSync(pass1Dir, { recursive: true });
    writeFileSync(join(pass1Dir, 'README.md'), '# Original pass1 draft\n\n', 'utf-8');

    const results = await checkPass2Evidence(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'README.md');
    expect(failures).toHaveLength(0);
  });

  it('fails when pass1/ snapshot is identical to current file (no improvements)', async () => {
    const content = '# Same content in both passes\n\nNothing changed.\n';
    writeArtifact(testDir, 'README.md', content);
    const pass1Dir = join(testDir, 'pass1');
    mkdirSync(pass1Dir, { recursive: true });
    writeFileSync(join(pass1Dir, 'README.md'), content, 'utf-8');

    const results = await checkPass2Evidence(testDir);
    const failures = results.filter((r) => !r.passed && r.artifact === 'README.md');
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.message).toContain('Pass-2 evidence missing');
  });

  it('skips artifacts that do not exist', async () => {
    // No files written — all PASS2 artifacts missing
    const results = await checkPass2Evidence(testDir);
    // Should return empty (non-existent files are skipped)
    expect(results).toHaveLength(0);
  });

  it('returns pass2-evidence checkId on failure', async () => {
    const content = '# Same content\n';
    writeArtifact(testDir, 'README.md', content);
    const pass1Dir = join(testDir, 'pass1');
    mkdirSync(pass1Dir, { recursive: true });
    writeFileSync(join(pass1Dir, 'README.md'), content, 'utf-8');

    const results = await checkPass2Evidence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.checkId).toBe('pass2-evidence');
  });
});

// ---------------------------------------------------------------------------
// Tests: Check 7 — Family C Structure
// ---------------------------------------------------------------------------

describe('checkFamilyCStructure', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('executive-brief.md', () => {
    it('passes with publishable H1, BLUF and Decisions sections', async () => {
      writeArtifact(testDir, 'executive-brief.md',
        '# Riksdag narrowly approves FiU48 fuel-tax cut\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions This Brief Supports\n\n1. A\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'executive-brief.md');
      expect(failures).toHaveLength(0);
    });

    it('fails when BLUF missing', async () => {
      writeArtifact(testDir, 'executive-brief.md',
        '# Riksdag approves FiU48\n\n## Introduction\n\n## Decisions This Brief Supports\n\n1. A\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'executive-brief.md');
      expect(failures.length).toBeGreaterThan(0);
    });

    it("fails when H1 still contains the 'REPLACE THIS H1' template placeholder", async () => {
      writeArtifact(testDir, 'executive-brief.md',
        '# 📰 Executive Brief Template — REPLACE THIS H1 WITH A PUBLISHABLE STORY-ORIENTED TITLE\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter(
        (r) => !r.passed && r.artifact === 'executive-brief.md' && /REPLACE THIS H1/i.test(r.message ?? ''),
      );
      expect(failures.length).toBeGreaterThan(0);
    });

    it('fails when the template placeholder is left in an HTML H1', async () => {
      writeArtifact(testDir, 'executive-brief.md',
        '<h1 align="center">📰 Executive Brief Template — REPLACE THIS H1 WITH A PUBLISHABLE STORY-ORIENTED TITLE</h1>\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter(
        (r) => !r.passed && r.artifact === 'executive-brief.md' && /REPLACE THIS H1/i.test(r.message ?? ''),
      );
      expect(failures.length).toBeGreaterThan(0);
    });

    it("fails when H1 is bare-boilerplate '# Executive Brief'", async () => {
      writeArtifact(testDir, 'executive-brief.md',
        '# Executive Brief\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter(
        (r) => !r.passed && r.artifact === 'executive-brief.md' && /bare boilerplate/i.test(r.message ?? ''),
      );
      expect(failures.length).toBeGreaterThan(0);
    });

    it("fails when H1 contains the banned phrase 'AI-generated political intelligence'", async () => {
      writeArtifact(testDir, 'executive-brief.md',
        '# AI-generated political intelligence: daily Riksdag brief\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter(
        (r) => !r.passed && r.artifact === 'executive-brief.md' && /AI-generated political intelligence/i.test(r.message ?? ''),
      );
      expect(failures.length).toBeGreaterThan(0);
    });

    it('tolerates a leading emoji in an otherwise publishable H1', async () => {
      writeArtifact(testDir, 'executive-brief.md',
        '# 📰 Riksdag approves FiU48 narrowly — opposition splits on amendment 3\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'executive-brief.md');
      expect(failures).toHaveLength(0);
    });

    // ------------------------------------------------------------------
    // 2026-05-16 hardening (Phase 1 of the PR #2527 follow-up): close
    // gate holes that allowed BLUF-leak titles to ship across all 14
    // languages. Each new case maps to a live regression observed on
    // https://riksdagsmonitor.com/news/index.html for May 2026 cards.
    // ------------------------------------------------------------------

    it('fails when the brief has no H1 at all (renderer would fall back to BLUF first sentence)', async () => {
      // Reproduces 2026-05-16 weekly-review live regression where the
      // brief started with YAML front-matter only and the card title
      // shipped as "Three simultaneous pressure points are converging
      // on the Tidö" — a truncated BLUF fragment.
      writeArtifact(testDir, 'executive-brief.md',
        '## 🎯 BLUF\n\nThree simultaneous pressure points are converging.\n\n## 🧭 Decisions\n\n1. A\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter(
        (r) => !r.passed && r.artifact === 'executive-brief.md' && /no '# H1' heading/i.test(r.message ?? ''),
      );
      expect(failures.length).toBeGreaterThan(0);
    });

    it("fails when H1 collapses to nothing via cleanArticleTitle (subfolder-label boilerplate)", async () => {
      // `# Executive Brief — Realtime Pulse 2026-05-16` is what the
      // generator workflows write by default. After cleanArticleTitle
      // strips `Executive Brief — ` and the trailing date, only
      // `Realtime Pulse` remains — which equals the prettified
      // subfolder label and is collapsed to null. The renderer then
      // falls back to BLUF. Reject at the gate.
      const subfolderDir = join(tmpdir(), `agentic-gate-test-realtime-pulse-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      mkdirSync(subfolderDir, { recursive: true });
      try {
        writeArtifact(subfolderDir, 'executive-brief.md',
          '# Executive Brief — Realtime Pulse 2026-05-16\n\n## 🎯 BLUF\n\nSwedish parliamentary activity.\n\n## 🧭 Decisions\n\n1. A\n');
        const results = await checkFamilyCStructure(subfolderDir);
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
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter(
        (r) => !r.passed && r.artifact === 'executive-brief.md' && /literal.*date/i.test(r.message ?? ''),
      );
      expect(failures.length).toBeGreaterThan(0);
    });

    it('fails when H1 contains an English long-form date', async () => {
      writeArtifact(testDir, 'executive-brief.md',
        '# Riksdagsmonitor Realtime Pulse — 15 May 2026: Defence and Aid Tensions Converge\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter(
        (r) => !r.passed && r.artifact === 'executive-brief.md' && /literal.*date/i.test(r.message ?? ''),
      );
      expect(failures.length).toBeGreaterThan(0);
    });

    it('fails when H1 contains a Swedish long-form date', async () => {
      // Live 2026-05-12 regression: `# Riksdagen Realtime Pulse 12 maj 2026`
      writeArtifact(testDir, 'executive-brief.md',
        '# Riksdagen Realtime Pulse 12 maj 2026: Försvarsdebatt och migrationspaket\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter(
        (r) => !r.passed && r.artifact === 'executive-brief.md' && /literal.*date/i.test(r.message ?? ''),
      );
      expect(failures.length).toBeGreaterThan(0);
    });

    it('fails when H1 ends with a trailing comma', async () => {
      // Live regression: `# Sweden Evening Analysis,`
      writeArtifact(testDir, 'executive-brief.md',
        '# Sweden Evening Analysis, Constitutional Moment Builds Toward Election Sprint,\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter(
        (r) => !r.passed && r.artifact === 'executive-brief.md' && /dangling punctuation/i.test(r.message ?? ''),
      );
      expect(failures.length).toBeGreaterThan(0);
    });

    it('fails when H1 ends with a coordinating connector', async () => {
      writeArtifact(testDir, 'executive-brief.md',
        '# Riksdag Approves FiU48 Fuel-Tax Cut Despite Opposition From\n\n## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions\n\n1. A\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter(
        (r) => !r.passed && r.artifact === 'executive-brief.md' && /coordinating connector/i.test(r.message ?? ''),
      );
      expect(failures.length).toBeGreaterThan(0);
    });

    it('fails when H1 is normalised-identical to a prior day brief in the same subfolder', async () => {
      // Reproduces the Phase-2 regression: period-aggregation briefs
      // ("Tidö Current Mandate" × 2 days, "Sweden Year-Ahead → +365"
      // × 2 days) shipped duplicate cards on /news/index.html because
      // the workflow scope barely changes day-to-day. Build a
      // synthetic `analysis/daily/<date>/<subfolder>/` layout with
      // two sibling dates whose brief H1s normalise to the same
      // string.
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
        const results = await checkFamilyCStructure(today);
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
      // Negative test for the across-days check — a story that
      // genuinely evolves day-to-day must NOT be flagged.
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
        const results = await checkFamilyCStructure(today);
        const failures = results.filter(
          (r) => !r.passed && r.artifact === 'executive-brief.md' && /normalised-identical/i.test(r.message ?? ''),
        );
        expect(failures).toHaveLength(0);
      } finally {
        rmSync(fakeRoot, { recursive: true, force: true });
      }
    });
  });

  describe('intelligence-assessment.md', () => {
    it('passes with 3+ Key Judgments, confidence labels, and PIR', async () => {
      writeArtifact(testDir, 'intelligence-assessment.md',
        '## Key Judgment KJ-1\nHIGH confidence.\n## Key Judgment KJ-2\nMEDIUM.\n## Key Judgment KJ-3\nLOW.\n\nReferences PIR-FISCAL-001.\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'intelligence-assessment.md');
      expect(failures).toHaveLength(0);
    });

    it('fails with fewer than 3 Key Judgments', async () => {
      writeArtifact(testDir, 'intelligence-assessment.md',
        '## Assessment\nOnly one KJ-1 here.\nHIGH confidence. MEDIUM. LOW.\nPIR-001\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.message?.includes('Key Judgment'));
      expect(failures.length).toBeGreaterThan(0);
    });
  });

  describe('scenario-analysis.md', () => {
    it('passes with 3+ scenarios', async () => {
      writeArtifact(testDir, 'scenario-analysis.md',
        '## Scenario 1\n\n## Scenario 2\n\n## Scenario 3\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'scenario-analysis.md');
      expect(failures).toHaveLength(0);
    });

    it('fails with fewer than 3 scenarios', async () => {
      writeArtifact(testDir, 'scenario-analysis.md',
        '## Scenario 1\n\n## Scenario 2\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'scenario-analysis.md');
      expect(failures.length).toBeGreaterThan(0);
    });
  });

  describe('devils-advocate.md', () => {
    const HYPOTHESES_WITH_MATRIX = (rows: string) => `
## Hypothesis 1: A

## Hypothesis 2: B

## Hypothesis 3: C

## Key Judgment Coverage Matrix (Required)

| KJ ID | KJ summary | Hypothesis | Challenged |
|-------|------------|------------|:----------:|
${rows}
`;

    it('passes with 3+ hypotheses and 100% KJ coverage matrix', async () => {
      writeArtifact(testDir, 'devils-advocate.md',
        HYPOTHESES_WITH_MATRIX('| KJ-1 | A | H1 | ✅ |\n| KJ-2 | B | H2 | ✅ |\n| KJ-3 | C | H3 | ✅ |'));
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'devils-advocate.md');
      expect(failures).toHaveLength(0);
    });

    it('fails when KJ Coverage Matrix heading is missing', async () => {
      writeArtifact(testDir, 'devils-advocate.md',
        '## Hypothesis 1: A\n\n## Hypothesis 2: B\n\n## Hypothesis 3: C\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'devils-advocate.md');
      expect(failures.length).toBeGreaterThan(0);
      expect(failures.some((f) => /Key Judgment Coverage Matrix/.test(f.message ?? ''))).toBe(true);
    });

    it('fails when any KJ coverage row contains ❌', async () => {
      writeArtifact(testDir, 'devils-advocate.md',
        HYPOTHESES_WITH_MATRIX('| KJ-1 | A | H1 | ✅ |\n| KJ-2 | B | — | ❌ |\n| KJ-3 | C | H3 | ✅ |'));
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'devils-advocate.md');
      expect(failures.length).toBeGreaterThan(0);
      expect(failures.some((f) => /coverage must be 100%/.test(f.message ?? ''))).toBe(true);
    });
  });

  describe('methodology-reflection.md', () => {
    it('passes when all nine required methodology-reflection sections are present', async () => {
      writeArtifact(testDir, 'methodology-reflection.md',
        REQUIRED_REFLECTION_SECTIONS);
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
      expect(failures).toHaveLength(0);
    });

    it('accepts ## headings with leading emoji', async () => {
      // Mirrors the actual template, which renders each required heading with
      // a leading emoji (e.g. `## 📋 ICD 203 …`).
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
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
      expect(failures).toHaveLength(0);
    });

    it('fails when required sections are missing', async () => {
      writeArtifact(testDir, 'methodology-reflection.md',
        '## ICD 203 Analytic Tradecraft Compliance Audit\n\n## Banned-Phrase Audit (Zero-Count Grid)\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
      expect(failures.length).toBeGreaterThan(0);
      expect(failures[0]?.message).toContain('missing required section(s)');
    });

    it('fails when phrases are present only in body text but not as ## headings', async () => {
      // All nine section names appear, but as paragraph text rather than
      // `##` headings — the loose phrase-anywhere check would pass; the
      // heading-anchored check must fail.
      const phraseOnly = `# Methodology Reflection

Paragraph mentioning ICD 203 Analytic Tradecraft Compliance Audit and Devil's-Advocate Key Judgment Coverage Matrix and Confidence Distribution by Key Judgment (Posterior Required) and Lagrådet / Statskontoret / SKR Tracking and Sibling-Folder Ingestion Record (Tier-C) and Re-run Log (Unified Schema) and Banned-Phrase Audit (Zero-Count Grid) and Pass 1 Pass 2 Delta Table and Improvement Opportunities PIR Roll-Forward.

| run_id | attempt | new dok_ids | artifacts extended | flags closed | vintage refresh |
|--------|---------|-------------|--------------------|--------------|-----------------|
| 1 | 1 | none | x | 0 | no |
`;
      writeArtifact(testDir, 'methodology-reflection.md', phraseOnly);
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
      expect(failures.length).toBeGreaterThan(0);
    });

    it('fails when KJ Coverage Matrix has ❌ rows', async () => {
      const broken = REQUIRED_REFLECTION_SECTIONS.replace(
        '| KJ-2 | B | ✅ | DA-02 | CLOSED |',
        '| KJ-2 | B | ❌ | DA-02 | OPEN |',
      );
      writeArtifact(testDir, 'methodology-reflection.md', broken);
      const results = await checkFamilyCStructure(testDir);
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
      const results = await checkFamilyCStructure(testDir);
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
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
      expect(failures.length).toBeGreaterThan(0);
      expect(failures.some((f) => /filled Posterior per KJ row/.test(f.message ?? ''))).toBe(true);
    });

    it('fails when Re-run Log section is present but column header row is outside the section', async () => {
      // Move the schema header into a different section — the unified schema
      // check should fail because the table header is not under Re-run Log.
      const broken = REQUIRED_REFLECTION_SECTIONS
        .replace(
          '## Re-run Log (Unified Schema)\n| run_id | attempt | new dok_ids | artifacts extended | flags closed | vintage refresh |\n|--------|---------|-------------|--------------------|--------------|-----------------|\n| 1 | 1 | none | methodology-reflection.md | 0 | no |\n',
          '## Re-run Log (Unified Schema)\n\n_no table here_\n',
        )
        + '\n## Bogus\n| run_id | attempt | new dok_ids | artifacts extended | flags closed | vintage refresh |\n|---|---|---|---|---|---|\n| 1 | 1 | none | x | 0 | no |\n';
      writeArtifact(testDir, 'methodology-reflection.md', broken);
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
      expect(failures.length).toBeGreaterThan(0);
      expect(failures.some((f) => /Re-run log unified schema/.test(f.message ?? ''))).toBe(true);
    });
  });

  describe('comparative-international.md', () => {
    it('passes with comparator set declared', async () => {
      writeArtifact(testDir, 'comparative-international.md',
        '**Comparator set**: Denmark, Norway, Finland\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'comparative-international.md');
      expect(failures).toHaveLength(0);
    });

    it('passes with 2+ comparator table rows', async () => {
      writeArtifact(testDir, 'comparative-international.md',
        '| Country | Policy |\n|---------|--------|\n| Denmark | A |\n| Norway | B |\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'comparative-international.md');
      expect(failures).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: Check 8 — Family D Structure
// ---------------------------------------------------------------------------

describe('checkFamilyDStructure', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('forward-indicators.md', () => {
    it('passes with 10+ dated indicators', async () => {
      const dates = Array.from({ length: 12 }, (_, i) =>
        `- 2026-06-${String(i + 1).padStart(2, '0')}: Event ${i + 1}`
      ).join('\n');
      writeArtifact(testDir, 'forward-indicators.md', `# Indicators\n\n${dates}\n`);
      const results = await checkFamilyDStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'forward-indicators.md');
      expect(failures).toHaveLength(0);
    });

    it('fails with fewer than 10 dated indicators', async () => {
      writeArtifact(testDir, 'forward-indicators.md', '# Indicators\n\n- 2026-06-01: Only one.\n');
      const results = await checkFamilyDStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'forward-indicators.md');
      expect(failures.length).toBeGreaterThan(0);
    });

    it('recognises quarterly date format', async () => {
      const quarters = Array.from({ length: 12 }, (_, i) =>
        `- 2026Q${(i % 4) + 1}: Event ${i + 1}`
      ).join('\n');
      writeArtifact(testDir, 'forward-indicators.md', `# Indicators\n\n${quarters}\n`);
      const results = await checkFamilyDStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'forward-indicators.md');
      expect(failures).toHaveLength(0);
    });
  });

  describe('coalition-mathematics.md', () => {
    it('passes with seat-count table', async () => {
      writeArtifact(testDir, 'coalition-mathematics.md',
        '| Party | Seats | Ja | Nej |\n|-------|-------|-----|-----|\n| S | 107 | X | |\n');
      const results = await checkFamilyDStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'coalition-mathematics.md');
      expect(failures).toHaveLength(0);
    });

    it('fails without vote-breakdown table', async () => {
      writeArtifact(testDir, 'coalition-mathematics.md', '# Coalition\n\nNo table here.\n');
      const results = await checkFamilyDStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'coalition-mathematics.md');
      expect(failures.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: Check 9 — PIR Status
// ---------------------------------------------------------------------------

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
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
  });

  it('fails when file missing', async () => {
    const results = await checkPirStatus(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.length).toBeGreaterThan(0);
  });

  it('fails with invalid JSON', async () => {
    writeFileSync(join(testDir, 'pir-status.json'), 'not json', 'utf-8');
    const results = await checkPirStatus(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.length).toBeGreaterThan(0);
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
    const failures = results.filter((r) => !r.passed);
    expect(failures.length).toBeGreaterThan(0);
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
        // answer_summary intentionally omitted
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
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
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
        answer_summary: 'Not yet resolved.',  // should not be present for 'open'
      }],
      generated_at: '2026-05-01T10:00:00Z',
    };
    writeFileSync(join(testDir, 'pir-status.json'), JSON.stringify(pir), 'utf-8');
    const results = await checkPirStatus(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.some((f) => f.message.includes('must not carry answer_summary'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests: Check 9b — Statskontoret Evidence
// ---------------------------------------------------------------------------

describe('checkStatskontoretEvidence', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('passes when no recognised agency mentioned', async () => {
    writeArtifact(testDir, 'implementation-feasibility.md', '# Implementation\n\nGeneric content.\n');
    const results = await checkStatskontoretEvidence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
  });

  it('passes when agency mentioned with statskontoret.se URL', async () => {
    writeArtifact(testDir, 'implementation-feasibility.md',
      '# Implementation\n\nSkatteverket is relevant.\n\n| **Statskontoret relevance** | https://www.statskontoret.se/report |\n');
    const results = await checkStatskontoretEvidence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
  });

  it('passes when agency mentioned with "none found"', async () => {
    writeArtifact(testDir, 'implementation-feasibility.md',
      '# Implementation\n\nPolismyndigheten is relevant.\n\n| **Statskontoret relevance** | none found |\n');
    const results = await checkStatskontoretEvidence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures).toHaveLength(0);
  });

  it('fails when agency mentioned without Statskontoret row', async () => {
    writeArtifact(testDir, 'implementation-feasibility.md',
      '# Implementation\n\nSkatteverket is relevant.\n\nNo Statskontoret row.\n');
    const results = await checkStatskontoretEvidence(testDir);
    const failures = results.filter((r) => !r.passed);
    expect(failures.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: Integration — Full Gate Validation
// ---------------------------------------------------------------------------

describe('validateAnalysisGate', () => {
  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('fails on empty directory', async () => {
    const result = await validateAnalysisGate(testDir);
    expect(result.passed).toBe(false);
    expect(result.failureCount).toBeGreaterThan(0);
  });

  it('passes with complete valid analysis', async () => {
    createMinimalValidAnalysis(testDir);
    const result = await validateAnalysisGate(testDir);
    // Log failures to aid debugging if the test fails
    if (!result.passed) {
      for (const f of result.checks.filter((c) => !c.passed)) {
        console.error('GATE FAILURE:', f.checkId, f.message);
      }
    }
    expect(result.passed).toBe(true);
    expect(result.failureCount).toBe(0);
  });

  it('returns aggregate failure count', async () => {
    const result = await validateAnalysisGate(testDir);
    expect(result.failureCount).toBe(result.checks.filter((c) => !c.passed).length);
  });
});
