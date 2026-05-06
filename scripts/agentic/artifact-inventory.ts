/**
 * @module scripts/agentic/artifact-inventory
 * @description Typed definitions for the 23 required analysis artifacts
 *              produced by every agentic news workflow run.
 *
 * The artifact families (A through E) are defined in
 * `.github/prompts/04-analysis-pipeline.md` and enforced by
 * `.github/prompts/05-analysis-gate.md`. This module provides a single
 * source of truth for artifact file names, family membership, and gate
 * check metadata — consumable by both the gate validator and downstream
 * tooling (aggregate-analysis, render-articles, quality dashboards).
 *
 * @see .github/prompts/04-analysis-pipeline.md — defines the 23 artifacts
 * @see .github/prompts/05-analysis-gate.md — gate checks reference
 * @see analysis/methodologies/artifact-catalog.md — canonical catalog
 * @author Hack23 AB
 * @license Apache-2.0
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Artifact family identifier matching the analysis pipeline spec. */
export type ArtifactFamily = 'A' | 'B' | 'C' | 'D' | 'E';

/** A single required artifact in the analysis pipeline. */
export interface ArtifactDefinition {
  /** File name relative to the analysis subfolder. */
  readonly filename: string;
  /** Family this artifact belongs to. */
  readonly family: ArtifactFamily;
  /** Human-readable description. */
  readonly description: string;
  /** Whether this artifact requires a Mermaid diagram with colour config. */
  readonly requiresMermaid: boolean;
  /** Whether this artifact is subject to Pass-2 evidence checking. */
  readonly requiresPass2: boolean;
}

/** Gate check result for a single artifact or validation rule. */
export interface GateCheckResult {
  /** Check identifier (e.g. 'artifact-existence', 'no-stubs'). */
  readonly checkId: string;
  /** Whether the check passed. */
  readonly passed: boolean;
  /** Human-readable message (populated on failure). */
  readonly message: string;
  /** The artifact or file that failed (if applicable). */
  readonly artifact?: string;
}

/** Aggregate result from running all gate checks. */
export interface GateValidationResult {
  /** Whether all checks passed. */
  readonly passed: boolean;
  /** Individual check results. */
  readonly checks: readonly GateCheckResult[];
  /** Count of failures. */
  readonly failureCount: number;
}

// ---------------------------------------------------------------------------
// Family A — Core Synthesis (9 files)
// ---------------------------------------------------------------------------

/** Family A artifact file names — Core Synthesis. */
export const FAMILY_A_ARTIFACTS: readonly ArtifactDefinition[] = Object.freeze([
  { filename: 'README.md', family: 'A', description: 'Folder README with index links', requiresMermaid: false, requiresPass2: true },
  { filename: 'executive-brief.md', family: 'A', description: 'BLUF + 3 decisions supported', requiresMermaid: true, requiresPass2: true },
  { filename: 'synthesis-summary.md', family: 'A', description: 'Lead-story decision + DIW ranking', requiresMermaid: true, requiresPass2: true },
  { filename: 'significance-scoring.md', family: 'A', description: 'DIW scores + sensitivity analysis', requiresMermaid: true, requiresPass2: true },
  { filename: 'classification-results.md', family: 'A', description: '7-dimension classification', requiresMermaid: true, requiresPass2: true },
  { filename: 'swot-analysis.md', family: 'A', description: 'S/W/O/T with evidence + TOWS matrix', requiresMermaid: true, requiresPass2: true },
  { filename: 'risk-assessment.md', family: 'A', description: 'Risk matrix + mitigation strategies', requiresMermaid: true, requiresPass2: true },
  { filename: 'threat-analysis.md', family: 'A', description: 'STRIDE-style threat assessment', requiresMermaid: true, requiresPass2: true },
  { filename: 'stakeholder-perspectives.md', family: 'A', description: 'Stakeholder mapping + positions', requiresMermaid: true, requiresPass2: true },
]);

// ---------------------------------------------------------------------------
// Family B — Structural Metadata (2 files)
// ---------------------------------------------------------------------------

/** Family B artifact file names — Structural Metadata. */
export const FAMILY_B_ARTIFACTS: readonly ArtifactDefinition[] = Object.freeze([
  { filename: 'data-download-manifest.md', family: 'B', description: 'Download manifest with dok_ids', requiresMermaid: false, requiresPass2: false },
  { filename: 'cross-reference-map.md', family: 'B', description: 'Cross-reference map', requiresMermaid: true, requiresPass2: true },
]);

// ---------------------------------------------------------------------------
// Family C — Strategic Extensions (5 files)
// ---------------------------------------------------------------------------

/** Family C artifact file names — Strategic Extensions. */
export const FAMILY_C_ARTIFACTS: readonly ArtifactDefinition[] = Object.freeze([
  { filename: 'scenario-analysis.md', family: 'C', description: '≥3 distinct scenarios', requiresMermaid: false, requiresPass2: true },
  { filename: 'comparative-international.md', family: 'C', description: 'Comparator set + rows', requiresMermaid: false, requiresPass2: true },
  { filename: 'devils-advocate.md', family: 'C', description: '≥3 competing hypotheses (ACH)', requiresMermaid: false, requiresPass2: true },
  { filename: 'intelligence-assessment.md', family: 'C', description: '≥3 Key Judgments with confidence', requiresMermaid: false, requiresPass2: true },
  { filename: 'methodology-reflection.md', family: 'C', description: 'ICD 203 audit / improvements', requiresMermaid: false, requiresPass2: true },
]);

// ---------------------------------------------------------------------------
// Family D — Electoral & Domain Lenses (7 files)
// ---------------------------------------------------------------------------

/** Family D artifact file names — Electoral & Domain Lenses. */
export const FAMILY_D_ARTIFACTS: readonly ArtifactDefinition[] = Object.freeze([
  { filename: 'election-2026-analysis.md', family: 'D', description: 'Election 2026 analysis', requiresMermaid: true, requiresPass2: true },
  { filename: 'voter-segmentation.md', family: 'D', description: 'Voter segmentation analysis', requiresMermaid: true, requiresPass2: true },
  { filename: 'coalition-mathematics.md', family: 'D', description: 'Seat-count / vote-breakdown table', requiresMermaid: true, requiresPass2: true },
  { filename: 'historical-parallels.md', family: 'D', description: 'Historical parallels analysis', requiresMermaid: true, requiresPass2: true },
  { filename: 'media-framing-analysis.md', family: 'D', description: 'Media framing analysis', requiresMermaid: true, requiresPass2: true },
  { filename: 'implementation-feasibility.md', family: 'D', description: 'Implementation feasibility', requiresMermaid: true, requiresPass2: true },
  { filename: 'forward-indicators.md', family: 'D', description: '≥10 dated forward indicators', requiresMermaid: true, requiresPass2: true },
]);

// ---------------------------------------------------------------------------
// Aggregate constants
// ---------------------------------------------------------------------------

/** All 23 required artifacts (Families A + B + C + D). */
export const ALL_REQUIRED_ARTIFACTS: readonly ArtifactDefinition[] = Object.freeze([
  ...FAMILY_A_ARTIFACTS,
  ...FAMILY_B_ARTIFACTS,
  ...FAMILY_C_ARTIFACTS,
  ...FAMILY_D_ARTIFACTS,
]);

/** All required artifact file names as a flat array. */
export const REQUIRED_ARTIFACT_FILENAMES: readonly string[] = Object.freeze(
  ALL_REQUIRED_ARTIFACTS.map((a) => a.filename),
);

/** Artifacts that require Mermaid diagrams with colour config. */
export const MERMAID_REQUIRED_ARTIFACTS: readonly string[] = Object.freeze(
  ALL_REQUIRED_ARTIFACTS.filter((a) => a.requiresMermaid).map((a) => a.filename),
);

/** Artifacts subject to Pass-2 evidence checking. */
export const PASS2_REQUIRED_ARTIFACTS: readonly string[] = Object.freeze(
  ALL_REQUIRED_ARTIFACTS.filter((a) => a.requiresPass2).map((a) => a.filename),
);

/**
 * Stub placeholder strings that must not appear in committed artifacts.
 * Matches check 3 in `05-analysis-gate.md`.
 */
export const STUB_PLACEHOLDERS: readonly string[] = Object.freeze([
  'AI_MUST_REPLACE',
  '[REQUIRED]',
  'TODO:',
  'Lorem ipsum',
]);

/**
 * Recognised Swedish government agencies for the Statskontoret evidence check
 * (gate check 9b in `05-analysis-gate.md`).
 */
export const RECOGNISED_AGENCIES: readonly string[] = Object.freeze([
  'Kriminalvården',
  'Polismyndigheten',
  'Försäkringskassan',
  'Skatteverket',
  'Migrationsverket',
  'Arbetsförmedlingen',
  'Socialstyrelsen',
  'Transportstyrelsen',
  'Trafikverket',
  'Naturvårdsverket',
  'Energimyndigheten',
]);

/**
 * Primary-source evidence URL hosts accepted by the evidence citation check
 * (gate check 4 in `05-analysis-gate.md`).
 */
export const EVIDENCE_URL_HOSTS: readonly string[] = Object.freeze([
  'riksdagen.se',
  'regeringen.se',
  'scb.se',
  'statskontoret.se',
  'worldbank.org',
  'api.imf.org',
  'data.imf.org',
  'www.imf.org',
]);

/**
 * Regex pattern matching a valid Riksdag document ID (dok_id).
 * Examples: H901FiU1, HD01CU27
 */
export const DOK_ID_PATTERN = /[Hh][A-Za-z0-9]{3,}[0-9]+/;

/**
 * Combined evidence regex — matches either a dok_id or a primary-source URL host.
 */
export const EVIDENCE_PATTERN = new RegExp(
  `${DOK_ID_PATTERN.source}|${EVIDENCE_URL_HOSTS.map((h) => h.replace(/\./g, '\\.')).join('|')}`,
);
