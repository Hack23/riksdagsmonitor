/**
 * @module scripts/agentic/analysis-gate
 * @description TypeScript implementation of the analysis gate validation
 *              logic defined in `.github/prompts/05-analysis-gate.md`.
 *
 * This module extracts a subset of the inline bash gate checks into
 * testable, strictly-typed functions. It implements checks 1–9b of the
 * prompt specification. Additional prompt-level gates (e.g. check 10
 * full-text outcomes, supplementary/editorial gates) are NOT covered
 * here and must be validated separately.
 *
 * Implemented checks:
 *   1. Artifact existence (all 23 files present and non-empty)
 *   2. Per-document coverage (Family E vs manifest)
 *   3. No stub placeholders (recursive scan)
 *   4. Evidence citations in SWOT and significance-scoring
 *   5. Mermaid diagrams with colour config
 *   6. Pass-2 evidence (mtime or pass1/ snapshot)
 *   7. Family C structure checks
 *   8. Family D structure checks
 *   9. PIR status sidecar validation
 *   9b. Statskontoret evidence in implementation-feasibility
 *
 * @example
 *   import { validateAnalysisGate } from './analysis-gate.js';
 *   const result = await validateAnalysisGate('analysis/daily/2026-05-01/propositions');
 *   if (!result.passed) {
 *     result.checks.filter(c => !c.passed).forEach(c => console.error(c.message));
 *   }
 *
 * @see .github/prompts/05-analysis-gate.md — canonical gate specification
 * @see scripts/agentic/artifact-inventory.ts — artifact definitions
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile, stat, readdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  type GateCheckResult,
  type GateValidationResult,
  REQUIRED_ARTIFACT_FILENAMES,
  MERMAID_REQUIRED_ARTIFACTS,
  PASS2_REQUIRED_ARTIFACTS,
  STUB_PLACEHOLDERS,
  DOK_ID_PATTERN,
  EVIDENCE_PATTERN,
  RECOGNISED_AGENCIES,
} from './artifact-inventory.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run all analysis gate checks against an analysis directory.
 *
 * @param analysisDir - Absolute or relative path to the analysis subfolder
 *                      (e.g. `analysis/daily/2026-05-01/propositions`).
 * @returns Aggregate validation result with per-check details.
 */
export async function validateAnalysisGate(
  analysisDir: string,
): Promise<GateValidationResult> {
  const checks: GateCheckResult[] = [];

  checks.push(...checkArtifactExistence(analysisDir));

  checks.push(...(await checkPerDocumentCoverage(analysisDir)));

  checks.push(...(await checkNoStubs(analysisDir)));

  checks.push(...(await checkEvidenceCitations(analysisDir)));

  checks.push(...(await checkMermaidDiagrams(analysisDir)));

  checks.push(...(await checkPass2Evidence(analysisDir)));

  checks.push(...(await checkFamilyCStructure(analysisDir)));

  checks.push(...(await checkFamilyDStructure(analysisDir)));

  checks.push(...(await checkPirStatus(analysisDir)));

  checks.push(...(await checkStatskontoretEvidence(analysisDir)));

  const failureCount = checks.filter((c) => !c.passed).length;
  return {
    passed: failureCount === 0,
    checks,
    failureCount,
  };
}

// ---------------------------------------------------------------------------
// Check 1 — Artifact existence
// ---------------------------------------------------------------------------

/**
 * Verify all 23 required artifacts exist and are non-empty.
 */
export function checkArtifactExistence(analysisDir: string): GateCheckResult[] {
  const results: GateCheckResult[] = [];
  for (const filename of REQUIRED_ARTIFACT_FILENAMES) {
    const filePath = join(analysisDir, filename);
    if (!existsSync(filePath)) {
      results.push({
        checkId: 'artifact-existence',
        passed: false,
        message: `Missing artifact: ${filename}`,
        artifact: filename,
      });
    } else if (statSync(filePath).size === 0) {
      results.push({
        checkId: 'artifact-existence',
        passed: false,
        message: `Empty artifact (zero bytes): ${filename}`,
        artifact: filename,
      });
    } else {
      results.push({
        checkId: 'artifact-existence',
        passed: true,
        message: `Artifact present: ${filename}`,
        artifact: filename,
      });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Check 2 — Per-document coverage
// ---------------------------------------------------------------------------

/**
 * Extract dok_ids from the data-download-manifest and verify each has
 * a corresponding analysis document in the `documents/` subdirectory.
 */
export async function checkPerDocumentCoverage(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const manifestPath = join(analysisDir, 'data-download-manifest.md');

  if (!existsSync(manifestPath)) {
    return results;
  }

  const content = await readFile(manifestPath, 'utf-8');
  const dokIds = extractDokIds(content);

  if (dokIds.length === 0) {
    results.push({
      checkId: 'per-document-coverage',
      passed: false,
      message: 'Manifest has no dok_id entries',
    });
    return results;
  }

  const documentsDir = join(analysisDir, 'documents');
  for (const dokId of dokIds) {
    const found = hasDocumentAnalysis(documentsDir, dokId);
    results.push({
      checkId: 'per-document-coverage',
      passed: found,
      message: found
        ? `Document analysis found for ${dokId}`
        : `documents/${dokId}.md or documents/${dokId}-analysis.md missing (any case)`,
      artifact: `documents/${dokId}-analysis.md`,
    });
  }

  return results;
}

/**
 * Extract unique dok_ids from markdown content.
 */
export function extractDokIds(content: string): string[] {
  const globalPattern = new RegExp(DOK_ID_PATTERN.source, 'g');
  const matches = content.match(globalPattern);
  if (!matches) return [];
  return [...new Set(matches)];
}

/**
 * Check if a document analysis file exists and is non-empty (any case variant).
 * Mirrors the prompt gate's `-s` check (file exists AND size > 0).
 */
function hasDocumentAnalysis(documentsDir: string, dokId: string): boolean {
  const variants = [
    `${dokId}.md`,
    `${dokId}-analysis.md`,
    `${dokId.toLowerCase()}.md`,
    `${dokId.toLowerCase()}-analysis.md`,
  ];
  return variants.some((v) => {
    const p = join(documentsDir, v);
    return existsSync(p) && statSync(p).size > 0;
  });
}

// ---------------------------------------------------------------------------
// Check 3 — No stubs
// ---------------------------------------------------------------------------

/**
 * Scan all markdown files under the analysis directory (recursive, including
 * `documents/` and `pass1/` subdirs) for stub placeholder strings. The
 * canonical gate uses a recursive grep over the entire `$ANALYSIS_DIR`.
 */
export async function checkNoStubs(analysisDir: string): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];

  const mdFiles = await collectMdFilesRecursive(analysisDir, '');

  for (const relPath of mdFiles) {
    const filePath = join(analysisDir, relPath);
    const content = await readFile(filePath, 'utf-8');
    for (const stub of STUB_PLACEHOLDERS) {
      if (content.includes(stub)) {
        results.push({
          checkId: 'no-stubs',
          passed: false,
          message: `Stub placeholder "${stub}" found in ${relPath}`,
          artifact: relPath,
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({
      checkId: 'no-stubs',
      passed: true,
      message: 'No stub placeholders detected',
    });
  }

  return results;
}

/**
 * Recursively collect all `.md` files under a directory, returning paths
 * relative to `baseDir`. Used by the stub scanner to mirror the canonical
 * gate's recursive grep over the entire analysis tree.
 */
async function collectMdFilesRecursive(
  baseDir: string,
  prefix: string,
): Promise<string[]> {
  const results: string[] = [];
  const currentDir = prefix ? join(baseDir, prefix) : baseDir;
  if (!existsSync(currentDir)) return results;
  const entries = await readdir(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...(await collectMdFilesRecursive(baseDir, relPath)));
    } else if (entry.name.endsWith('.md')) {
      results.push(relPath);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Check 4 — Evidence citations
// ---------------------------------------------------------------------------

/**
 * Verify that swot-analysis.md and significance-scoring.md contain primary-
 * source evidence (a dok_id or recognised URL host) in each bullet/table row.
 * Mirrors the awk-based gate in `05-analysis-gate.md` (check 4).
 */
export async function checkEvidenceCitations(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];

  results.push(...(await checkSwotEvidence(analysisDir)));
  results.push(...(await checkSignificanceScoringEvidence(analysisDir)));

  return results;
}

/** SWOT section headings that trigger per-line evidence enforcement. */
const SWOT_SECTION_RE = /^###\s+.*(Strengths|Weaknesses|Opportunities|Threats)\b/i;
/** Any heading resets the active SWOT section. */
const ANY_HEADING_RE = /^#{1,6}\s+/;
/** Bullet lines (- or * style). */
const BULLET_RE = /^\s*[-*]\s+/;
/** Table row (starts with |). */
const TABLE_ROW_RE = /^\s*\|/;
/** Separator row (only |, :, -, whitespace). */
const TABLE_SEP_RE = /^\s*[|:\-\s]+$/;

/**
 * Check swot-analysis.md: every bullet and table row inside a SWOT section
 * must contain at least one evidence citation.
 */
async function checkSwotEvidence(analysisDir: string): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'swot-analysis.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  let currentSection = '';
  let tableRowCount = 0;

  for (const line of lines) {
    if (SWOT_SECTION_RE.test(line)) {
      currentSection = line.trim();
      tableRowCount = 0;
      continue;
    }
    if (ANY_HEADING_RE.test(line)) {
      currentSection = '';
      tableRowCount = 0;
      continue;
    }
    if (!currentSection) continue;

    if (/^\s*$/.test(line)) {
      tableRowCount = 0;
      continue;
    }

    if (BULLET_RE.test(line)) {
      if (!EVIDENCE_PATTERN.test(line)) {
        results.push({
          checkId: 'evidence-citations',
          passed: false,
          message: `swot-analysis.md ${currentSection}: bullet missing evidence (dok_id or primary-source URL): ${line.trim()}`,
          artifact: 'swot-analysis.md',
        });
      }
      continue;
    }

    if (TABLE_ROW_RE.test(line)) {
      if (TABLE_SEP_RE.test(line)) continue;
      tableRowCount++;
      if (tableRowCount === 1) continue;
      if (!EVIDENCE_PATTERN.test(line)) {
        results.push({
          checkId: 'evidence-citations',
          passed: false,
          message: `swot-analysis.md ${currentSection}: table row missing evidence (dok_id or primary-source URL): ${line.trim()}`,
          artifact: 'swot-analysis.md',
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({
      checkId: 'evidence-citations',
      passed: true,
      message: 'swot-analysis.md: evidence citations present',
      artifact: 'swot-analysis.md',
    });
  }

  return results;
}

/** Mermaid structural keywords — these lines are never checked for evidence. */
const MERMAID_STRUCTURAL_RE =
  /^\s*(%%|style\b|classDef\b|class\b|linkStyle\b|subgraph\b|end\b|graph\b|flowchart\b|quadrantChart\b|mindmap\b|timeline\b|journey\b|gantt\b|pie\b|xychart-beta\b|sequenceDiagram\b|stateDiagram(-v2)?\b|erDiagram\b|sankey-beta\b|gitGraph\b|requirementDiagram\b|block-beta\b)/;
/** Mermaid node/label content — lines with bracket/paren/curly-enclosed content indicate node labels. */
const MERMAID_NODE_RE = /\[[^\]\n]+\]|\([^)\n]+\)|\{[^}\n]+\}/;

/**
 * Check significance-scoring.md: every ranked bullet/list item and table
 * row (outside Mermaid) must contain evidence. Mermaid node labels are
 * also checked unless they are structural keywords.
 */
async function checkSignificanceScoringEvidence(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'significance-scoring.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  let inMermaid = false;
  let tableRowCount = 0;

  for (const line of lines) {
    if (/^```mermaid\s*$/.test(line)) {
      inMermaid = true;
      tableRowCount = 0;
      continue;
    }
    if (inMermaid && /^```\s*$/.test(line)) {
      inMermaid = false;
      continue;
    }

    if (inMermaid) {
      if (MERMAID_STRUCTURAL_RE.test(line)) continue;
      if (MERMAID_NODE_RE.test(line) && !EVIDENCE_PATTERN.test(line)) {
        results.push({
          checkId: 'evidence-citations',
          passed: false,
          message: `significance-scoring.md Mermaid node missing evidence (dok_id or primary-source URL): ${line.trim()}`,
          artifact: 'significance-scoring.md',
        });
      }
      continue;
    }

    if (/^\s*$/.test(line)) {
      tableRowCount = 0;
      continue;
    }

    if (/^\s*([0-9]+\.\s+|[-*]\s+)/.test(line) && !EVIDENCE_PATTERN.test(line)) {
      results.push({
        checkId: 'evidence-citations',
        passed: false,
        message: `significance-scoring.md ranked item missing evidence (dok_id or primary-source URL): ${line.trim()}`,
        artifact: 'significance-scoring.md',
      });
      continue;
    }

    if (TABLE_ROW_RE.test(line)) {
      if (TABLE_SEP_RE.test(line)) continue;
      tableRowCount++;
      if (tableRowCount === 1) continue;
      if (!EVIDENCE_PATTERN.test(line)) {
        results.push({
          checkId: 'evidence-citations',
          passed: false,
          message: `significance-scoring.md ranking table row missing evidence (dok_id or primary-source URL): ${line.trim()}`,
          artifact: 'significance-scoring.md',
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({
      checkId: 'evidence-citations',
      passed: true,
      message: 'significance-scoring.md: evidence citations present',
      artifact: 'significance-scoring.md',
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check 5 — Mermaid diagrams
// ---------------------------------------------------------------------------

/**
 * Verify Mermaid diagrams with colour-coded config exist in required files.
 */
export async function checkMermaidDiagrams(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];

  for (const filename of MERMAID_REQUIRED_ARTIFACTS) {
    const filePath = join(analysisDir, filename);
    if (!existsSync(filePath)) continue;

    const content = await readFile(filePath, 'utf-8');

    const hasMermaid = /^```mermaid/m.test(content);
    if (!hasMermaid) {
      results.push({
        checkId: 'mermaid-diagrams',
        passed: false,
        message: `${filename}: missing Mermaid block`,
        artifact: filename,
      });
      continue;
    }

    const hasColourConfig =
      /^\s*style\s+/m.test(content) ||
      /themeVariables/m.test(content) ||
      /%%\{\s*init/m.test(content);

    if (!hasColourConfig) {
      results.push({
        checkId: 'mermaid-diagrams',
        passed: false,
        message: `${filename}: missing Mermaid colour-coded config`,
        artifact: filename,
      });
    } else {
      results.push({
        checkId: 'mermaid-diagrams',
        passed: true,
        message: `${filename}: Mermaid with colour config present`,
        artifact: filename,
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check 6 — Pass-2 evidence
// ---------------------------------------------------------------------------

/**
 * Minimum mtime delta (ms) from birth time that constitutes evidence of a
 * second-pass edit (180 seconds = 3 minutes, matching the bash gate threshold
 * in `05-analysis-gate.md §Check 6`).
 */
const PASS2_MTIME_THRESHOLD_MS = 180_000;

/**
 * Verify that Pass-2 iteration was performed on each artifact: either a
 * `pass1/` snapshot exists on disk that differs from the current file, OR
 * the file's mtime is at least 180 s after its birth time (Linux birth time
 * may not be reliable; the `pass1/` check is the preferred mechanism).
 */
export async function checkPass2Evidence(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const pass1Dir = join(analysisDir, 'pass1');

  for (const filename of PASS2_REQUIRED_ARTIFACTS) {
    const filePath = join(analysisDir, filename);
    if (!existsSync(filePath)) continue;

    let pass2Done = false;

    const pass1Path = join(pass1Dir, filename);
    if (existsSync(pass1Path)) {
      const [current, snapshot] = await Promise.all([
        readFile(filePath, 'utf-8'),
        readFile(pass1Path, 'utf-8'),
      ]);
      if (current !== snapshot) {
        pass2Done = true;
      }
    }

    if (!pass2Done) {
      const fileStat = await stat(filePath);
      const birthtimeMs = fileStat.birthtimeMs;
      const mtimeMs = fileStat.mtimeMs;
      if (birthtimeMs > 0 && mtimeMs >= birthtimeMs + PASS2_MTIME_THRESHOLD_MS) {
        pass2Done = true;
      }
    }

    if (!pass2Done) {
      results.push({
        checkId: 'pass2-evidence',
        passed: false,
        message: `${filename}: Pass-2 evidence missing (mtime < birth+180s and no differing pass1/ snapshot)`,
        artifact: filename,
      });
    } else {
      results.push({
        checkId: 'pass2-evidence',
        passed: true,
        message: `${filename}: Pass-2 evidence confirmed`,
        artifact: filename,
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check 7 — Family C structure
// ---------------------------------------------------------------------------

/**
 * Validate Family C structural requirements.
 */
export async function checkFamilyCStructure(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];

  results.push(...(await checkExecutiveBrief(analysisDir)));

  results.push(...(await checkIntelligenceAssessment(analysisDir)));

  results.push(...(await checkScenarioAnalysis(analysisDir)));

  results.push(...(await checkDevilsAdvocate(analysisDir)));

  results.push(...(await checkMethodologyReflection(analysisDir)));

  results.push(...(await checkComparativeInternational(analysisDir)));

  return results;
}

/**
 * Check executive-brief.md for BLUF and Decisions sections.
 */
async function checkExecutiveBrief(analysisDir: string): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'executive-brief.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');

  const hasBluf = /^##\s.*BLUF/m.test(content);
  if (!hasBluf) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: "executive-brief.md: missing '## BLUF' section",
      artifact: 'executive-brief.md',
    });
  }

  const hasDecisions = /^##\s.*(Decision|Decisions\s+This\s+Brief)/m.test(content);
  if (!hasDecisions) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: "executive-brief.md: missing 'Decisions' section",
      artifact: 'executive-brief.md',
    });
  }

  if (hasBluf && hasDecisions) {
    results.push({
      checkId: 'family-c-structure',
      passed: true,
      message: 'executive-brief.md: BLUF and Decisions present',
      artifact: 'executive-brief.md',
    });
  }

  return results;
}

/**
 * Check intelligence-assessment.md for Key Judgments, confidence labels, PIR.
 */
async function checkIntelligenceAssessment(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'intelligence-assessment.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');

  const kjPattern = /(Key\s+Judgment|KJ-?\d+)/;
  const kjLines = content.split('\n').filter((line) => kjPattern.test(line));
  const kjCount = kjLines.length;
  if (kjCount < 3) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: `intelligence-assessment.md: fewer than 3 Key Judgments (found ${kjCount})`,
      artifact: 'intelligence-assessment.md',
    });
  }

  const confMatches = content.match(
    /\b(VERY\s+HIGH|VERY\s+LOW|HIGH|MEDIUM|LOW)\b/g,
  );
  const confCount = confMatches ? confMatches.length : 0;
  if (confCount < 3) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: `intelligence-assessment.md: fewer than 3 confidence labels (found ${confCount})`,
      artifact: 'intelligence-assessment.md',
    });
  }

  const hasPir = /PIR/i.test(content);
  if (!hasPir) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: 'intelligence-assessment.md: no PIR reference',
      artifact: 'intelligence-assessment.md',
    });
  }

  if (kjCount >= 3 && confCount >= 3 && hasPir) {
    results.push({
      checkId: 'family-c-structure',
      passed: true,
      message: 'intelligence-assessment.md: structure valid',
      artifact: 'intelligence-assessment.md',
    });
  }

  return results;
}

/**
 * Check scenario-analysis.md for ≥3 distinct scenarios.
 */
async function checkScenarioAnalysis(analysisDir: string): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'scenario-analysis.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');
  const scenarioMatches = content.match(/^##?\s+.*Scenario/gm);
  const count = scenarioMatches ? scenarioMatches.length : 0;

  if (count < 3) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: `scenario-analysis.md: fewer than 3 scenarios (found ${count})`,
      artifact: 'scenario-analysis.md',
    });
  } else {
    results.push({
      checkId: 'family-c-structure',
      passed: true,
      message: `scenario-analysis.md: ${count} scenarios found`,
      artifact: 'scenario-analysis.md',
    });
  }

  return results;
}

/**
 * Check devils-advocate.md for ≥3 competing hypotheses.
 */
async function checkDevilsAdvocate(analysisDir: string): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'devils-advocate.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');
  const hyMatches = content.match(
    /^#{2,4}\s*(Hypothesis|H[0-9]+\s*[:.—-])/gm,
  );
  const count = hyMatches ? hyMatches.length : 0;

  if (count < 3) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: `devils-advocate.md: fewer than 3 competing hypotheses (found ${count})`,
      artifact: 'devils-advocate.md',
    });
  } else {
    results.push({
      checkId: 'family-c-structure',
      passed: true,
      message: `devils-advocate.md: ${count} hypotheses found`,
      artifact: 'devils-advocate.md',
    });
  }

  // KJ Coverage Matrix enforcement — the template documents this as a
  // required gate; verify the matching ## heading and that every KJ row is
  // covered (no ❌ markers on KJ rows).
  const kjMatrixHeadingPresent = hasHeading(
    content,
    /Key\s+Judgment\s+Coverage\s+Matrix/i,
  );
  if (!kjMatrixHeadingPresent) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: "devils-advocate.md: missing '## Key Judgment Coverage Matrix' section",
      artifact: 'devils-advocate.md',
    });
  } else {
    const matrixSection = extractSection(
      content,
      /Key\s+Judgment\s+Coverage\s+Matrix/i,
    );
    const kjRows = matrixSection
      .split('\n')
      .filter((line) => /^\|\s*KJ[-\s]?\d/i.test(line.trim()));
    const uncoveredRow = kjRows.find((row) => /❌/.test(row));
    if (kjRows.length === 0) {
      results.push({
        checkId: 'family-c-structure',
        passed: false,
        message: 'devils-advocate.md: KJ Coverage Matrix has no KJ rows (expected ≥1 row mapping each intelligence-assessment KJ to a hypothesis)',
        artifact: 'devils-advocate.md',
      });
    } else if (uncoveredRow) {
      results.push({
        checkId: 'family-c-structure',
        passed: false,
        message: 'devils-advocate.md: KJ Coverage Matrix has ❌ row(s); coverage must be 100%',
        artifact: 'devils-advocate.md',
      });
    } else {
      results.push({
        checkId: 'family-c-structure',
        passed: true,
        message: `devils-advocate.md: KJ Coverage Matrix has ${kjRows.length} covered KJ row(s)`,
        artifact: 'devils-advocate.md',
      });
    }
  }

  return results;
}

/**
 * Check methodology-reflection.md for required section contract.
 */
/**
 * Test whether a markdown document contains an H2-H4 heading whose visible
 * text (after stripping a single optional leading emoji + whitespace) matches
 * the given pattern. Anchoring to a real heading prevents the loose
 * "anywhere in the file" matches that earlier versions of this gate allowed.
 */
function hasHeading(content: string, pattern: RegExp): boolean {
  for (const rawLine of content.split('\n')) {
    const headingMatch = rawLine.match(/^#{2,4}\s+(.*?)\s*#*\s*$/);
    if (!headingMatch) continue;
    // Strip a single leading emoji (any non-ASCII glyph or symbol) plus optional whitespace.
    const text = headingMatch[1]!.replace(/^[^\p{L}\p{N}]+\s*/u, '').trim();
    if (pattern.test(text)) return true;
  }
  return false;
}

/**
 * Return the body of the section starting at the heading that matches
 * `headingPattern`, up to (but not including) the next H2 heading. Returns an
 * empty string when the section is not present.
 */
function extractSection(content: string, headingPattern: RegExp): string {
  const lines = content.split('\n');
  let inSection = false;
  const collected: string[] = [];
  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.*?)\s*#*\s*$/);
    if (headingMatch) {
      const text = headingMatch[1]!.replace(/^[^\p{L}\p{N}]+\s*/u, '').trim();
      if (inSection) break;
      if (headingPattern.test(text)) {
        inSection = true;
        continue;
      }
    }
    if (inSection) collected.push(line);
  }
  return collected.join('\n');
}

async function checkMethodologyReflection(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'methodology-reflection.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');

  const kjCoverageSection = extractSection(
    content,
    /Devil'?s[-\s]Advocate\s+Key\s+Judgment\s+Coverage\s+Matrix/i,
  );
  const confidenceSection = extractSection(
    content,
    /Confidence\s+Distribution\s+by\s+Key\s+Judgment/i,
  );
  const reRunSection = extractSection(content, /Re[-\s]?run\s+Log/i);

  // Re-run log unified column schema — must appear as a table header row
  // inside the Re-run Log section, not just anywhere in the file.
  const reRunColumnHeaderPresent = reRunSection.split('\n').some((line) => {
    if (!line.trim().startsWith('|')) return false;
    const lower = line.toLowerCase();
    return (
      lower.includes('run_id') &&
      lower.includes('attempt') &&
      /new[\s_]+dok_ids/.test(lower) &&
      /artifacts[\s_]+extended/.test(lower) &&
      /flags[\s_]+closed/.test(lower) &&
      /vintage[\s_]+refresh/.test(lower)
    );
  });

  // KJ-coverage content quality — every KJ row must be ✅ and CLOSED; ❌ or
  // OPEN markers on KJ rows indicate the 100% coverage target was not met.
  const kjCoverageRows = kjCoverageSection
    .split('\n')
    .filter((line) => /^\|\s*KJ[-\s]?\d/i.test(line.trim()));
  const kjCoverageHasUncovered = kjCoverageRows.some((row) => /❌/.test(row));
  const kjCoverageHasOpenStatus = kjCoverageRows.some((row) =>
    /\bOPEN\b/i.test(row),
  );
  const kjCoverageRowsPresent = kjCoverageRows.length > 0;

  // Posterior content quality — every KJ row must have a filled Posterior
  // value (no `[REQUIRED]` placeholder, no empty cell). Locate the Posterior
  // column from the table header within the Confidence Distribution section.
  const confidenceLines = confidenceSection.split('\n');
  const headerLineIndex = confidenceLines.findIndex(
    (line) => line.trim().startsWith('|') && /posterior/i.test(line),
  );
  let posteriorColumnIndex = -1;
  if (headerLineIndex >= 0) {
    const cells = confidenceLines[headerLineIndex]!
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim().toLowerCase());
    posteriorColumnIndex = cells.findIndex((cell) =>
      cell.includes('posterior'),
    );
  }
  const confidenceKjRows = confidenceLines.filter((line) =>
    /^\|\s*KJ[-\s]?\d/i.test(line.trim()),
  );
  let confidencePosteriorFilledForAllKjs = confidenceKjRows.length > 0;
  if (posteriorColumnIndex < 0) {
    confidencePosteriorFilledForAllKjs = false;
  } else {
    for (const row of confidenceKjRows) {
      const cells = row.split('|').slice(1, -1).map((c) => c.trim());
      const cell = cells[posteriorColumnIndex] ?? '';
      const stripped = cell.replace(/`/g, '').trim();
      if (
        stripped === '' ||
        /^\[\s*REQUIRED\s*\]?$/i.test(stripped) ||
        /^-+$/.test(stripped)
      ) {
        confidencePosteriorFilledForAllKjs = false;
        break;
      }
    }
  }

  const requiredSectionChecks: Array<{ label: string; present: boolean }> = [
    {
      label: 'ICD 203 audit checklist (## heading)',
      present: hasHeading(content, /ICD\s+203/i),
    },
    {
      label: "Devil's-Advocate KJ coverage matrix (## heading)",
      present: hasHeading(
        content,
        /Devil'?s[-\s]Advocate\s+Key\s+Judgment\s+Coverage\s+Matrix/i,
      ),
    },
    {
      label: "Devil's-Advocate KJ coverage matrix: 100% coverage (no ❌ / OPEN rows)",
      present:
        kjCoverageRowsPresent &&
        !kjCoverageHasUncovered &&
        !kjCoverageHasOpenStatus,
    },
    {
      label: 'Confidence distribution (## heading)',
      present: hasHeading(content, /Confidence\s+Distribution\s+by\s+Key\s+Judgment/i),
    },
    {
      label: 'Confidence distribution: filled Posterior per KJ row',
      present: confidencePosteriorFilledForAllKjs,
    },
    {
      label: 'Lagrådet / Statskontoret / SKR tracking (## heading)',
      present: hasHeading(content, /Lagrådet.*Statskontoret.*SKR/i),
    },
    {
      label: 'Sibling-folder ingestion record (## heading)',
      present: hasHeading(content, /Sibling[-\s]?Folder\s+Ingestion/i),
    },
    {
      label: 'Re-run log (## heading)',
      present: hasHeading(content, /Re[-\s]?run\s+Log/i),
    },
    {
      label: 'Re-run log unified schema (header row inside Re-run Log section)',
      present: reRunColumnHeaderPresent,
    },
    {
      label: 'Banned-phrase audit grid (## heading)',
      present: hasHeading(content, /Banned[-\s]?Phrase\s+Audit/i),
    },
    {
      label: 'Pass 1 → Pass 2 delta table (## heading)',
      present: hasHeading(content, /Pass\s*1.*Pass\s*2.*Delta/i),
    },
    {
      label: 'Improvement opportunities → PIR roll-forward (## heading)',
      present: hasHeading(
        content,
        /Improvement\s+Opportunities.*PIR\s+Roll[-\s]?Forward/i,
      ),
    },
  ];

  const missingSections = requiredSectionChecks
    .filter(({ present }) => !present)
    .map(({ label }) => label);

  if (missingSections.length > 0) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: `methodology-reflection.md: missing required section(s): ${missingSections.join(', ')}`,
      artifact: 'methodology-reflection.md',
    });
  } else {
    results.push({
      checkId: 'family-c-structure',
      passed: true,
      message: 'methodology-reflection.md: all required sections present',
      artifact: 'methodology-reflection.md',
    });
  }

  return results;
}

/**
 * Check comparative-international.md for comparator set or ≥2 rows.
 */
async function checkComparativeInternational(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'comparative-international.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');

  const COMPARATOR_SET_RE = /^\s*\*{0,2}Comparator set\*{0,2}\s*:/m;
  const hasComparatorSet = COMPARATOR_SET_RE.test(content) &&
    !/^\s*\*{0,2}Comparator set\*{0,2}\s*:\s*[-–—]*\s*$/m.test(content);

  const tableRows = content.split('\n').filter((line) => {
    if (!/^\|/.test(line)) return false;
    if (/^\|[\s:-]+(\|[\s:-]+)+\|?\s*$/.test(line)) return false;
    if (/^\|\s*(Jurisdiction|Comparator|Country)\s*\|/.test(line)) return false;
    return true;
  });

  const hasEnoughRows = tableRows.length >= 2;

  if (!hasComparatorSet && !hasEnoughRows) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: 'comparative-international.md: missing comparator set or fewer than 2 comparator rows',
      artifact: 'comparative-international.md',
    });
  } else {
    results.push({
      checkId: 'family-c-structure',
      passed: true,
      message: 'comparative-international.md: comparator data present',
      artifact: 'comparative-international.md',
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check 8 — Family D structure
// ---------------------------------------------------------------------------

/**
 * Validate Family D structural requirements.
 */
export async function checkFamilyDStructure(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];

  results.push(...(await checkForwardIndicators(analysisDir)));

  results.push(...(await checkCoalitionMathematics(analysisDir)));

  return results;
}

/**
 * Check forward-indicators.md for ≥10 dated indicators.
 */
async function checkForwardIndicators(analysisDir: string): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'forward-indicators.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');
  const datePattern = /20[0-9]{2}-[0-1][0-9]-[0-3][0-9]|20[0-9]{2}Q[1-4]|\+[0-9]+\s*(h|d|day|week|month)/g;
  const matches = content.match(datePattern);
  const count = matches ? matches.length : 0;

  if (count < 10) {
    results.push({
      checkId: 'family-d-structure',
      passed: false,
      message: `forward-indicators.md: fewer than 10 dated indicators (found ${count})`,
      artifact: 'forward-indicators.md',
    });
  } else {
    results.push({
      checkId: 'family-d-structure',
      passed: true,
      message: `forward-indicators.md: ${count} dated indicators found`,
      artifact: 'forward-indicators.md',
    });
  }

  return results;
}

/**
 * Check coalition-mathematics.md for seat-count / vote-breakdown table.
 */
async function checkCoalitionMathematics(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'coalition-mathematics.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');
  const hasTable = /^\|.*(Ja|Nej|Avstår|Frånvarande|Seats|Mandat)/m.test(content);

  if (!hasTable) {
    results.push({
      checkId: 'family-d-structure',
      passed: false,
      message: 'coalition-mathematics.md: missing seat-count / vote-breakdown table',
      artifact: 'coalition-mathematics.md',
    });
  } else {
    results.push({
      checkId: 'family-d-structure',
      passed: true,
      message: 'coalition-mathematics.md: vote/seat table present',
      artifact: 'coalition-mathematics.md',
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check 9 — PIR status sidecar
// ---------------------------------------------------------------------------

/** PIR status JSON schema structure. */
interface PirStatusFile {
  readonly schema_version?: string;
  readonly cycle?: string;
  readonly date?: string;
  readonly subfolder?: string;
  readonly pirs?: readonly PirEntry[];
  readonly generated_at?: string;
}

/** A single PIR entry in the sidecar file. */
interface PirEntry {
  readonly pir_id?: string;
  readonly statement?: string;
  readonly status?: string;
  readonly confidence?: string;
  readonly answer_summary?: string;
}

const VALID_PIR_STATUSES = new Set([
  'open', 'answered', 'superseded', 'deferred', 'cancelled',
]);

const VALID_CONFIDENCE_LEVELS = new Set([
  'VERY HIGH', 'HIGH', 'MEDIUM', 'LOW', 'VERY LOW',
]);

const PIR_ID_PATTERN = /^PIR-[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/;

/**
 * Validate pir-status.json exists and has valid structure.
 */
export async function checkPirStatus(analysisDir: string): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'pir-status.json');

  if (!existsSync(filePath)) {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: 'pir-status.json missing or empty',
    });
    return results;
  }

  let data: PirStatusFile;
  try {
    const raw = await readFile(filePath, 'utf-8');
    data = JSON.parse(raw) as PirStatusFile;
  } catch {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: 'pir-status.json: invalid JSON',
    });
    return results;
  }

  const requiredFields = ['schema_version', 'cycle', 'date', 'subfolder', 'pirs', 'generated_at'] as const;
  for (const field of requiredFields) {
    if (!(field in data) || data[field as keyof PirStatusFile] === undefined) {
      results.push({
        checkId: 'pir-status',
        passed: false,
        message: `pir-status.json: missing required field '${field}'`,
      });
    }
  }

  if (data.schema_version !== '1.0') {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: "pir-status.json: schema_version must be '1.0'",
    });
  }

  if (!Array.isArray(data.pirs)) {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: "pir-status.json: 'pirs' field must be a JSON array",
    });
    return results;
  }

  if (data.subfolder !== data.cycle) {
    results.push({
      checkId: 'pir-status',
      passed: false,
      message: `pir-status.json: subfolder='${data.subfolder}' must equal cycle='${data.cycle}'`,
    });
  }

  for (const pir of data.pirs) {
    const pid = pir.pir_id ?? '(no id)';

    if (!pir.pir_id || !PIR_ID_PATTERN.test(pir.pir_id)) {
      results.push({
        checkId: 'pir-status',
        passed: false,
        message: `pir-status.json pir=${pid}: invalid pir_id format`,
      });
    }

    for (const field of ['statement', 'status', 'confidence'] as const) {
      if (!pir[field]) {
        results.push({
          checkId: 'pir-status',
          passed: false,
          message: `pir-status.json pir=${pid}: missing required field "${field}"`,
        });
      }
    }

    if (pir.status && !VALID_PIR_STATUSES.has(pir.status)) {
      results.push({
        checkId: 'pir-status',
        passed: false,
        message: `pir-status.json pir=${pid}: invalid status '${pir.status}'`,
      });
    }

    if (pir.confidence && !VALID_CONFIDENCE_LEVELS.has(pir.confidence)) {
      results.push({
        checkId: 'pir-status',
        passed: false,
        message: `pir-status.json pir=${pid}: invalid confidence '${pir.confidence}'`,
      });
    }

    if (pir.status === 'answered' && !pir.answer_summary) {
      results.push({
        checkId: 'pir-status',
        passed: false,
        message: `pir-status.json pir=${pid}: status=answered requires non-empty answer_summary`,
      });
    }
    if (pir.status !== 'answered' && pir.answer_summary !== undefined) {
      results.push({
        checkId: 'pir-status',
        passed: false,
        message: `pir-status.json pir=${pid}: status=${pir.status} must not carry answer_summary`,
      });
    }
  }

  if (results.length === 0) {
    results.push({
      checkId: 'pir-status',
      passed: true,
      message: 'pir-status.json: valid',
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check 9b — Statskontoret evidence
// ---------------------------------------------------------------------------

/**
 * When implementation-feasibility.md names a recognised agency, verify
 * the Statskontoret relevance row has a URL or 'none found'.
 */
export async function checkStatskontoretEvidence(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'implementation-feasibility.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');

  const agencyPattern = new RegExp(RECOGNISED_AGENCIES.join('|'), 'i');
  if (!agencyPattern.test(content)) {
    results.push({
      checkId: 'statskontoret-evidence',
      passed: true,
      message: 'implementation-feasibility.md: no recognised agency mentioned',
      artifact: 'implementation-feasibility.md',
    });
    return results;
  }

  const statskontoretRow =
    /^\|\s*\*{0,2}Statskontoret relevance\*{0,2}\s*\|\s*([^|]*statskontoret\.se[^|]*|[^|]*none found[^|]*)\|/im;

  if (!statskontoretRow.test(content)) {
    results.push({
      checkId: 'statskontoret-evidence',
      passed: false,
      message: "implementation-feasibility.md: names a recognised agency but Statskontoret relevance row lacks a statskontoret.se URL or 'none found'",
      artifact: 'implementation-feasibility.md',
    });
  } else {
    results.push({
      checkId: 'statskontoret-evidence',
      passed: true,
      message: 'implementation-feasibility.md: Statskontoret evidence present',
      artifact: 'implementation-feasibility.md',
    });
  }

  return results;
}
