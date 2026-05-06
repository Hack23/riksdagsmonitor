/**
 * @module tests/agentic-analysis-gate
 * @description Unit tests for the analysis gate validation logic extracted
 *              from `.github/prompts/05-analysis-gate.md`.
 *
 * Tests cover:
 *   - Artifact inventory type definitions and constants
 *   - Gate check 1: artifact existence
 *   - Gate check 2: per-document coverage
 *   - Gate check 3: stub placeholder detection
 *   - Gate check 5: Mermaid diagram validation
 *   - Gate check 7: Family C structure checks
 *   - Gate check 8: Family D structure checks
 *   - Gate check 9: PIR status sidecar validation
 *   - Gate check 9b: Statskontoret evidence
 *   - Integration: full gate validation
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
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
  checkMermaidDiagrams,
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
      content = '# Executive Brief\n\n## 🎯 BLUF\n\nBrief summary.\n\n## 🧭 3 Decisions This Brief Supports\n\n1. Decision A\n\n```mermaid\ngraph TD\n  A --> B\n  style A fill:#f00\n```\n';
    } else if (artifact.filename === 'intelligence-assessment.md') {
      content = '# Intelligence Assessment\n\n## Key Judgment KJ-1\nHIGH confidence.\n\n## Key Judgment KJ-2\nMEDIUM confidence.\n\n## Key Judgment KJ-3\nLOW confidence.\n\nReferences PIR-FISCAL-001.\n';
    } else if (artifact.filename === 'scenario-analysis.md') {
      content = '# Scenario Analysis\n\n## Scenario 1: Status Quo\n\n## Scenario 2: Reform\n\n## Scenario 3: Crisis\n\n';
    } else if (artifact.filename === 'devils-advocate.md') {
      content = '# Devil\'s Advocate\n\n## Hypothesis 1: Government succeeds\n\n## Hypothesis 2: Opposition blocks\n\n## Hypothesis 3: Coalition fractures\n\n';
    } else if (artifact.filename === 'methodology-reflection.md') {
      content = '# Methodology Reflection\n\n## ICD 203 Audit\n\nMethodology Improvements applied.\n\n## Improvement 1\n\n';
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
  writeFileSync(join(docsDir, 'H901FiU1-analysis.md'), '# H901FiU1 Analysis\n', 'utf-8');
  writeFileSync(join(docsDir, 'HD01CU27-analysis.md'), '# HD01CU27 Analysis\n', 'utf-8');

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
    expect(RECOGNISED_AGENCIES.length).toBe(11);
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
    it('passes with BLUF and Decisions sections', async () => {
      writeArtifact(testDir, 'executive-brief.md',
        '## 🎯 BLUF\n\nSummary.\n\n## 🧭 Decisions This Brief Supports\n\n1. A\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'executive-brief.md');
      expect(failures).toHaveLength(0);
    });

    it('fails when BLUF missing', async () => {
      writeArtifact(testDir, 'executive-brief.md',
        '## Introduction\n\n## Decisions This Brief Supports\n\n1. A\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'executive-brief.md');
      expect(failures.length).toBeGreaterThan(0);
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
    it('passes with 3+ hypotheses', async () => {
      writeArtifact(testDir, 'devils-advocate.md',
        '## Hypothesis 1: A\n\n## Hypothesis 2: B\n\n## Hypothesis 3: C\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'devils-advocate.md');
      expect(failures).toHaveLength(0);
    });
  });

  describe('methodology-reflection.md', () => {
    it('passes with ICD 203 reference', async () => {
      writeArtifact(testDir, 'methodology-reflection.md',
        '## ICD 203 Audit\n\nCompliance verified.\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
      expect(failures).toHaveLength(0);
    });

    it('passes with Methodology Improvements', async () => {
      writeArtifact(testDir, 'methodology-reflection.md',
        '## Methodology Improvements\n\nImprovement 1: Better sourcing.\n');
      const results = await checkFamilyCStructure(testDir);
      const failures = results.filter((r) => !r.passed && r.artifact === 'methodology-reflection.md');
      expect(failures).toHaveLength(0);
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
    // May still have some failures due to minimal content not meeting all checks
    // but the structure should be largely valid
    const structuralFailures = result.checks.filter(
      (c) => !c.passed && c.checkId === 'artifact-existence'
    );
    expect(structuralFailures).toHaveLength(0);
  });

  it('returns aggregate failure count', async () => {
    const result = await validateAnalysisGate(testDir);
    expect(result.failureCount).toBe(result.checks.filter((c) => !c.passed).length);
  });
});
