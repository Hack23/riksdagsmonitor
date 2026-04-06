/**
 * Analysis Quality Validation Test Suite
 *
 * Validates analysis output files against template structure requirements,
 * evidence density minimums, Mermaid diagram presence, banned pattern
 * detection, and confidence label completeness.
 *
 * This serves as an automated quality gate to catch the quality issues
 * identified in the 2026-04-03 audit.
 *
 * The analysis pipeline has evolved over time:
 * - **v1 format** (March 2026): paragraph-style metadata (`**Key**: value`)
 * - **v2 format** (April 2026+): table-style metadata with emoji headers,
 *   structured IDs (e.g., `SYN-2026-04-04-001`), and Mermaid diagrams
 *
 * Tests detect the format and apply appropriate validation rules.
 * V2-specific checks only apply to directories whose synthesis file contains
 * both a table-format metadata block AND a structured analysis ID.
 *
 * @see SHARED_PROMPT_PATTERNS.md §Quality Self-Check Protocol
 * @see ai-driven-analysis-guide.md §Mandatory Quality Requirements
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Paths & Constants
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ANALYSIS_BASE = path.join(PROJECT_ROOT, 'analysis', 'daily');

/** The 8 expected sibling files in a complete analysis set (v2 template) */
const EXPECTED_ANALYSIS_FILES = [
  'classification-results.md',
  'risk-assessment.md',
  'swot-analysis.md',
  'threat-analysis.md',
  'stakeholder-perspectives.md',
  'significance-scoring.md',
  'synthesis-summary.md',
  'cross-reference-map.md',
] as const;

/** Additional manifest file */
const DATA_DOWNLOAD_MANIFEST = 'data-download-manifest.md';

/** Patterns that must NOT appear in committed analysis files */
const UNFILLED_PLACEHOLDER_PATTERNS = [
  /\[REQUIRED\]/,
  /\[OPTIONAL\]/,
  /\[INSERT .+?\]/i,
  /\[TODO\]/i,
  /\[PLACEHOLDER\]/i,
];

/** Banned content patterns per SHARED_PROMPT_PATTERNS.md §BANNED Content Patterns */
const ANALYSIS_BANNED_PATTERNS: readonly { label: string; pattern: RegExp }[] = [
  {
    label: 'neutralText: "The political landscape remains fluid…"',
    pattern: /The political landscape remains fluid,? with both government and opposition positioning for advantage/i,
  },
  {
    label: 'debateAnalysisMarker: "No chamber debate data is available…"',
    pattern: /No chamber debate data is available for these items,? limiting our ability/i,
  },
  {
    label: 'policySignificanceGeneric: "Requires committee review and chamber debate…"',
    pattern: /Requires committee review and chamber debate/i,
  },
];

/** Regex for Riksdag document IDs (e.g., HD03214, H901AU10, hd10428) */
const DOK_ID_PATTERN = /\b[Hh][A-Za-z]?\d{2,7}[A-Za-zÅÄÖåäö]*\d*\b/g;

/** Confidence label pattern (inline [HIGH]/[MEDIUM]/[LOW] annotations) */
const CONFIDENCE_LABEL_PATTERN = /\[(HIGH|MEDIUM|LOW)\]/g;

/** Mermaid code block pattern */
const MERMAID_BLOCK_PATTERN = /```mermaid[\s\S]*?```/g;

/** Mermaid style directive pattern (indicates color-coded diagrams) */
const MERMAID_STYLE_PATTERN = /style\s+\w+\s+fill:|fill:#[0-9a-fA-F]{3,6}/;

/** L×I scoring pattern for risk assessments */
const LXI_SCORING_PATTERN = /[Ll](?:ikelihood)?\s*[×xX*]\s*[Ii](?:mpact)?|Risk\s+Score|L×I/;

/**
 * Structured analysis ID pattern. Matches IDs with a known prefix, ISO date,
 * and a suffix that is either numeric (001, 1212) or alphabetic with optional
 * trailing digits (MOT, CR01, RT1018, DI).
 *
 * Examples: `SYN-2026-04-04-001`, `RSK-2026-04-02-CR01`, `CLS-2026-04-03-RT1018`, `SYN-2026-04-03-DI`
 */
const STRUCTURED_ID_PATTERN = /\b(?:SYN|RSK|SWT|THR|STK|SIG|CLS|XRF|DDM)-\d{4}-\d{2}-\d{2}-(?:\d{3,4}|[A-Za-z]{2,}(?:\d{2,})?)\b/;

/**
 * Detect whether a file uses the **strict v2** template format:
 * - Must have table-format metadata (`| **Field** | Value |`)
 * - Must have a structured analysis ID (see STRUCTURED_ID_PATTERN)
 */
function isStrictV2Format(content: string): boolean {
  const hasTableMetadata = /\|\s*\*\*\w+.*\*\*\s*\|/.test(content);
  return hasTableMetadata && STRUCTURED_ID_PATTERN.test(content);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface AnalysisDirectory {
  fullPath: string;
  date: string;
  articleType: string;
  files: Map<string, string>;
  /** Whether directory uses the strict v2 template format */
  isStrictV2: boolean;
  /** Whether the directory has a documents/ subfolder with JSON files */
  hasDocuments: boolean;
}

/**
 * Discover all analysis directories that contain at least one .md file.
 * Scans both analysis/daily/YYYY-MM-DD/ (root-level analysis sets) and
 * analysis/daily/YYYY-MM-DD/{articleType}/ (subdirectory analysis sets).
 */
function discoverAnalysisDirectories(): AnalysisDirectory[] {
  const dirs: AnalysisDirectory[] = [];

  if (!fs.existsSync(ANALYSIS_BASE)) return dirs;

  const dateDirs = fs.readdirSync(ANALYSIS_BASE, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name))
    .map(d => d.name)
    .sort();

  const addAnalysisDirectory = (fullPath: string, date: string, articleType: string): void => {
    const mdFiles = fs.readdirSync(fullPath, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => entry.name);

    if (mdFiles.length === 0) return;

    const files = new Map<string, string>();
    for (const f of mdFiles) {
      files.set(f, path.join(fullPath, f));
    }

    // Detect strict v2 format from synthesis or the first available file
    const samplePath = files.get('synthesis-summary.md') ?? [...files.values()][0];
    const sampleContent = samplePath ? fs.readFileSync(samplePath, 'utf-8') : '';
    const isStrictV2 = isStrictV2Format(sampleContent);

    const docsDir = path.join(fullPath, 'documents');
    const hasDocuments = fs.existsSync(docsDir) &&
      fs.readdirSync(docsDir, { withFileTypes: true })
        .some(entry => entry.isFile() && entry.name.endsWith('.json'));

    dirs.push({ fullPath, date, articleType, files, isStrictV2, hasDocuments });
  };

  for (const date of dateDirs) {
    const datePath = path.join(ANALYSIS_BASE, date);

    // Support root-level daily analysis sets stored directly under YYYY-MM-DD/
    addAnalysisDirectory(datePath, date, date);

    const subdirs = fs.readdirSync(datePath, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== 'documents');

    for (const sub of subdirs) {
      const fullPath = path.join(datePath, sub.name);
      addAnalysisDirectory(fullPath, date, sub.name);
    }
  }

  return dirs;
}

function readAnalysisFile(dir: AnalysisDirectory, filename: string): string | null {
  const filePath = dir.files.get(filename);
  if (!filePath) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

function countDokIds(text: string): number {
  const matches = text.match(DOK_ID_PATTERN);
  if (!matches) return 0;
  return new Set(matches.map(m => m.toUpperCase())).size;
}

function countMermaidBlocks(text: string): number {
  const matches = text.match(MERMAID_BLOCK_PATTERN);
  return matches ? matches.length : 0;
}

function hasMermaidStyling(text: string): boolean {
  const blocks = text.match(MERMAID_BLOCK_PATTERN);
  if (!blocks) return false;
  return blocks.some(block => MERMAID_STYLE_PATTERN.test(block));
}

function countConfidenceLabels(text: string): number {
  const matches = text.match(CONFIDENCE_LABEL_PATTERN);
  return matches ? matches.length : 0;
}

function extractDocumentsAnalyzedCount(text: string): number | null {
  // V2 table format: | **Documents Analyzed** | 5 |
  const tableMatch = /\*\*Documents Analyzed\*\*\s*\|\s*(\d+)/i.exec(text);
  if (tableMatch?.[1]) return parseInt(tableMatch[1], 10);
  // V1 paragraph format: **Documents Analyzed**: 5
  const paraMatch = /\*\*Documents Analyzed\*\*:\s*(\d+)/i.exec(text);
  if (paraMatch?.[1]) return parseInt(paraMatch[1], 10);
  return null;
}

function hasRequiredMetadata(content: string, fields: string[]): string[] {
  const missing: string[] = [];
  for (const field of fields) {
    const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\*\\*${escaped}\\*\\*`, 'i');
    if (!pattern.test(content)) {
      missing.push(field);
    }
  }
  return missing;
}

/**
 * Extract the Overall Confidence value from a synthesis file's metadata.
 * Supports v2 table format (`| **Overall Confidence** | HIGH |` or `` | **Overall Confidence** | `HIGH` | ``),
 * v1 paragraph format (`**Overall Confidence**: HIGH` or `**Overall Confidence:** HIGH`),
 * and bracket-wrapped variants (`**Confidence**: **[HIGH]** (80%)`).
 */
function extractOverallConfidence(content: string): 'HIGH' | 'MEDIUM' | 'LOW' | null {
  // V2 table format: | **Overall Confidence** | HIGH | or | **Overall Confidence** | `HIGH` | or | **Overall Confidence** | **HIGH** |
  const tableMatch = /\*\*(?:Overall\s+)?Confidence\*\*\s*\|\s*(?:`|\*{0,2})?(HIGH|MEDIUM|LOW)\b/i.exec(content);
  if (tableMatch?.[1]) return tableMatch[1].toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW';

  // V1 paragraph format: **Overall Confidence**: HIGH  or  **Confidence**: HIGH
  const paraMatch = /\*\*(?:Overall\s+)?Confidence\*\*:\s*(?:\*{0,2}\[?)?(HIGH|MEDIUM|LOW)\b/i.exec(content);
  if (paraMatch?.[1]) return paraMatch[1].toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW';

  // Colon-inside-bold: **Overall Confidence:** HIGH
  const colonInsideMatch = /\*\*(?:Overall\s+)?Confidence:\*\*\s*(HIGH|MEDIUM|LOW)\b/i.exec(content);
  if (colonInsideMatch?.[1]) return colonInsideMatch[1].toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW';

  return null;
}

/**
 * Check whether a file contains any confidence-related indicator.
 * This is a loose check suitable for non-synthesis files (e.g. threat analysis)
 * that may use inline labels, tables, or paragraph mentions.
 */
function hasAnyConfidenceIndicator(content: string): boolean {
  // First try structured Overall Confidence metadata
  if (extractOverallConfidence(content) !== null) return true;
  // Fall back to contextual detection: require "confidence" near HIGH/MEDIUM/LOW
  // or the word "confidence" used as a metadata/table header
  return /\bconfidence\b.*\b(HIGH|MEDIUM|LOW)\b/im.test(content) ||
    /\b(HIGH|MEDIUM|LOW)\b.*\bconfidence\b/im.test(content) ||
    /\|\s*Confidence\s*\|/i.test(content);
}

// ---------------------------------------------------------------------------
// Test Data Discovery
// ---------------------------------------------------------------------------

let analysisDirs: AnalysisDirectory[] = [];
let synthesisDirectories: AnalysisDirectory[] = [];
let strictV2Directories: AnalysisDirectory[] = [];
let strictV2SynthesisDirectories: AnalysisDirectory[] = [];
let dirsWithDocuments: AnalysisDirectory[] = [];

beforeAll(() => {
  analysisDirs = discoverAnalysisDirectories();
  synthesisDirectories = analysisDirs.filter(d => d.files.has('synthesis-summary.md'));
  strictV2Directories = analysisDirs.filter(d => d.isStrictV2);
  strictV2SynthesisDirectories = synthesisDirectories.filter(d => d.isStrictV2);
  dirsWithDocuments = analysisDirs.filter(d => d.hasDocuments);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Analysis Quality Validation', () => {

  // -----------------------------------------------------------------------
  // 1. Template Structure Compliance
  // -----------------------------------------------------------------------
  describe('Template Structure', () => {

    it('should discover at least one analysis directory', () => {
      expect(analysisDirs.length).toBeGreaterThan(0);
    });

    it('should have at least one date directory in analysis/daily/', () => {
      const dateDirs = fs.readdirSync(ANALYSIS_BASE, { withFileTypes: true })
        .filter(d => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name));
      expect(dateDirs.length).toBeGreaterThan(0);
    });

    it('should have Overall Confidence metadata in all strict-v2 synthesis files', () => {
      const failures: string[] = [];

      for (const dir of strictV2SynthesisDirectories) {
        const content = readAnalysisFile(dir, 'synthesis-summary.md');
        if (!content) continue;

        // Template-structure check: require a dedicated confidence metadata field
        // with a non-empty value. Only enforced for strict-v2 templates.
        // Supports both documented formats:
        // - v1: **Confidence**: High / **Overall Confidence**: Medium
        // - v2: | **Overall Confidence** | High | or | **Confidence** | HIGH |
        const hasConfidenceMetadata =
          /\*\*(?:Overall\s+)?Confidence\*\*:\s*[^\n]+/i.test(content) ||
          /\*\*(?:Overall\s+)?Confidence:\*\*\s*[^\n]+/i.test(content) ||
          /\|\s*\*\*(?:Overall\s+)?Confidence\*\*\s*\|\s*[^|\n]+\|/i.test(content);

        if (!hasConfidenceMetadata) {
          failures.push(
            `${dir.date}/${dir.articleType}/synthesis-summary.md: missing Overall Confidence metadata field/value`
          );
        }
      }

      expect(
        failures,
        `Strict-v2 synthesis files without Overall Confidence metadata:\n${failures.join('\n')}`
      ).toHaveLength(0);
    });

    it('should have all 8 expected sibling files in complete strict-v2 synthesis directories', () => {
      // Only check directories that already have ≥5 .md files (indicating intent to be complete)
      const completeDirs = strictV2SynthesisDirectories.filter(d => d.files.size >= 5);
      const failures: string[] = [];

      for (const dir of completeDirs) {
        const missingSiblings = EXPECTED_ANALYSIS_FILES.filter(
          f => !dir.files.has(f)
        );
        if (missingSiblings.length > 0) {
          failures.push(
            `${dir.date}/${dir.articleType}: missing siblings: ${missingSiblings.join(', ')}`
          );
        }
      }

      expect(failures, `Complete strict-v2 directories with missing sibling files:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have a data-download-manifest in complete strict-v2 synthesis directories that include it', () => {
      // Directories with ≥9 .md files (8 analysis + manifest) should have the manifest
      const fullSetDirs = strictV2SynthesisDirectories.filter(d => d.files.size >= 9);
      const failures: string[] = [];

      for (const dir of fullSetDirs) {
        if (!dir.files.has(DATA_DOWNLOAD_MANIFEST)) {
          failures.push(`${dir.date}/${dir.articleType}: missing ${DATA_DOWNLOAD_MANIFEST}`);
        }
      }

      expect(failures, `Full-set strict-v2 directories missing manifest:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have no unfilled [REQUIRED] or [OPTIONAL] placeholders in any analysis file', () => {
      const failures: string[] = [];

      for (const dir of analysisDirs) {
        for (const [filename, filePath] of dir.files) {
          const content = fs.readFileSync(filePath, 'utf-8');
          for (const pattern of UNFILLED_PLACEHOLDER_PATTERNS) {
            if (pattern.test(content)) {
              failures.push(
                `${dir.date}/${dir.articleType}/${filename}: contains unfilled placeholder matching ${pattern.source}`
              );
            }
          }
        }
      }

      expect(failures, `Files with unfilled placeholders:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have structured IDs in strict-v2 synthesis files', () => {
      const failures: string[] = [];

      for (const dir of strictV2SynthesisDirectories) {
        const content = readAnalysisFile(dir, 'synthesis-summary.md');
        if (!content) continue;
        if (!STRUCTURED_ID_PATTERN.test(content)) {
          failures.push(
            `${dir.date}/${dir.articleType}/synthesis-summary.md: missing structured Synthesis ID`
          );
        }
      }

      expect(failures, `Strict-v2 synthesis files missing ID:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have required metadata in strict-v2 risk assessment files', () => {
      const failures: string[] = [];

      for (const dir of strictV2Directories) {
        const content = readAnalysisFile(dir, 'risk-assessment.md');
        if (!content) continue;
        // Accept either "Analysis Date", "Assessment Date", "Date", or "Generated" as a date field
        const hasDateField =
          /\*\*(?:Analysis Date|Assessment Date|Date|Generated)\*\*/i.test(content) ||
          /\*\*(?:Analysis Date|Assessment Date|Date|Generated):\*\*/i.test(content);
        if (!hasDateField) {
          failures.push(
            `${dir.date}/${dir.articleType}/risk-assessment.md: missing date metadata (Analysis Date, Assessment Date, or Generated)`
          );
        }
      }

      expect(failures, `Strict-v2 risk assessments with missing metadata:\n${failures.join('\n')}`).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // 2. Evidence Density Validation
  // -----------------------------------------------------------------------
  describe('Evidence Density', () => {

    it('should have ≥1 unique dok_id citation in strict-v2 directories with companion documents', () => {
      const strictV2WithDocs = dirsWithDocuments.filter(d => d.isStrictV2);
      const failures: string[] = [];

      for (const dir of strictV2WithDocs) {
        for (const analysisFile of ['classification-results.md', 'significance-scoring.md'] as const) {
          const content = readAnalysisFile(dir, analysisFile);
          if (!content) continue;
          const count = countDokIds(content);
          if (count < 1) {
            failures.push(
              `${dir.date}/${dir.articleType}/${analysisFile}: 0 dok_id citations despite having documents/`
            );
          }
        }
      }

      expect(failures, `Strict-v2 files with documents but no dok_id citations:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have ≥1 unique dok_id citation in strict-v2 risk assessment files with documents', () => {
      const strictV2WithDocs = dirsWithDocuments.filter(d => d.isStrictV2);
      const failures: string[] = [];

      for (const dir of strictV2WithDocs) {
        const content = readAnalysisFile(dir, 'risk-assessment.md');
        if (!content) continue;
        const count = countDokIds(content);
        if (count < 1) {
          failures.push(
            `${dir.date}/${dir.articleType}/risk-assessment.md: 0 dok_id citations despite having documents/`
          );
        }
      }

      expect(failures, `Strict-v2 risk assessments with docs but no citations:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have ≥2 unique dok_id citations in strict-v2 synthesis summary files', () => {
      const failures: string[] = [];

      for (const dir of strictV2SynthesisDirectories) {
        const content = readAnalysisFile(dir, 'synthesis-summary.md');
        if (!content) continue;
        const count = countDokIds(content);
        if (count < 2) {
          failures.push(
            `${dir.date}/${dir.articleType}/synthesis-summary.md: only ${count} dok_id citations (minimum 2)`
          );
        }
      }

      expect(failures, `Strict-v2 synthesis below dok_id density:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have evidence points in strict-v2 SWOT analysis files with documents', () => {
      const strictV2WithDocs = dirsWithDocuments.filter(d => d.isStrictV2);
      const failures: string[] = [];

      for (const dir of strictV2WithDocs) {
        const content = readAnalysisFile(dir, 'swot-analysis.md');
        if (!content) continue;
        const dokIdCount = countDokIds(content);
        if (dokIdCount < 1) {
          failures.push(
            `${dir.date}/${dir.articleType}/swot-analysis.md: 0 dok_id citations despite having documents/`
          );
        }
      }

      expect(failures, `Strict-v2 SWOT files with docs but no evidence:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should not have "Documents Analyzed: 0" in synthesis files with sibling document files', () => {
      const failures: string[] = [];

      for (const dir of synthesisDirectories) {
        const content = readAnalysisFile(dir, 'synthesis-summary.md');
        if (!content) continue;
        const docCount = extractDocumentsAnalyzedCount(content);
        if (docCount === 0 && dir.hasDocuments) {
          const docsDir = path.join(dir.fullPath, 'documents');
          const jsonCount = fs.readdirSync(docsDir).filter(f => f.endsWith('.json')).length;
          failures.push(
            `${dir.date}/${dir.articleType}/synthesis-summary.md: "Documents Analyzed: 0" but ${jsonCount} JSON files exist in documents/`
          );
        }
      }

      expect(failures, `Empty synthesis with existing documents:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have Documents Analyzed count in strict-v2 synthesis files', () => {
      const failures: string[] = [];

      for (const dir of strictV2SynthesisDirectories) {
        const content = readAnalysisFile(dir, 'synthesis-summary.md');
        if (!content) continue;
        const docCount = extractDocumentsAnalyzedCount(content);
        if (docCount === null) {
          failures.push(
            `${dir.date}/${dir.articleType}/synthesis-summary.md: missing "Documents Analyzed" metadata`
          );
        }
      }

      expect(failures, `Strict-v2 synthesis files missing document count:\n${failures.join('\n')}`).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // 3. Mermaid Diagram Presence
  // -----------------------------------------------------------------------
  describe('Mermaid Diagrams', () => {

    it('should have ≥1 Mermaid diagram in strict-v2 SWOT analysis files', () => {
      const failures: string[] = [];

      for (const dir of strictV2Directories) {
        const content = readAnalysisFile(dir, 'swot-analysis.md');
        if (!content) continue;
        const count = countMermaidBlocks(content);
        if (count < 1) {
          failures.push(
            `${dir.date}/${dir.articleType}/swot-analysis.md: ${count} Mermaid diagrams (minimum 1)`
          );
        }
      }

      expect(failures, `Strict-v2 SWOT files missing Mermaid:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have ≥1 risk matrix Mermaid diagram in strict-v2 risk assessment files', () => {
      const failures: string[] = [];

      for (const dir of strictV2Directories) {
        const content = readAnalysisFile(dir, 'risk-assessment.md');
        if (!content) continue;
        const count = countMermaidBlocks(content);
        if (count < 1) {
          failures.push(
            `${dir.date}/${dir.articleType}/risk-assessment.md: ${count} Mermaid diagrams (minimum 1)`
          );
        }
      }

      expect(failures, `Strict-v2 risk assessments missing Mermaid:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have ≥1 intelligence dashboard Mermaid diagram in strict-v2 synthesis files', () => {
      const failures: string[] = [];

      for (const dir of strictV2SynthesisDirectories) {
        const content = readAnalysisFile(dir, 'synthesis-summary.md');
        if (!content) continue;
        const count = countMermaidBlocks(content);
        if (count < 1) {
          failures.push(
            `${dir.date}/${dir.articleType}/synthesis-summary.md: ${count} Mermaid diagrams (minimum 1)`
          );
        }
      }

      expect(failures, `Strict-v2 synthesis missing Mermaid:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have color-coded (styled) Mermaid diagrams in strict-v2 risk files', () => {
      const failures: string[] = [];

      for (const dir of strictV2Directories) {
        const content = readAnalysisFile(dir, 'risk-assessment.md');
        if (!content) continue;
        const mermaidCount = countMermaidBlocks(content);
        if (mermaidCount > 0 && !hasMermaidStyling(content)) {
          failures.push(
            `${dir.date}/${dir.articleType}/risk-assessment.md: Mermaid diagrams lack color styling`
          );
        }
      }

      expect(failures, `Strict-v2 risk files with unstyled Mermaid:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have Mermaid diagrams in strict-v2 cross-reference map files', () => {
      const failures: string[] = [];

      for (const dir of strictV2Directories) {
        const content = readAnalysisFile(dir, 'cross-reference-map.md');
        if (!content) continue;
        if (!isStrictV2Format(content)) continue; // Only check if cross-ref itself is v2
        const count = countMermaidBlocks(content);
        if (count < 1) {
          failures.push(
            `${dir.date}/${dir.articleType}/cross-reference-map.md: ${count} Mermaid diagrams (minimum 1)`
          );
        }
      }

      expect(failures, `Strict-v2 cross-reference maps missing Mermaid:\n${failures.join('\n')}`).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // 4. Confidence Label Completeness
  // -----------------------------------------------------------------------
  describe('Confidence Labels', () => {

    it('should have a parseable HIGH/MEDIUM/LOW confidence value in strict-v2 synthesis summary files', () => {
      // Complementary to Template Structure's metadata presence check —
      // this validates the extracted value is actually one of HIGH/MEDIUM/LOW
      const failures: string[] = [];

      for (const dir of strictV2SynthesisDirectories) {
        const content = readAnalysisFile(dir, 'synthesis-summary.md');
        if (!content) continue;
        const confidence = extractOverallConfidence(content);
        if (!confidence) {
          failures.push(
            `${dir.date}/${dir.articleType}/synthesis-summary.md: no parseable Overall Confidence value (expected HIGH, MEDIUM, or LOW)`
          );
        }
      }

      expect(failures, `Strict-v2 synthesis files without parseable confidence:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have confidence-annotated key findings when using inline labels', () => {
      // Verify that strict-v2 files using inline [HIGH]/[MEDIUM]/[LOW] labels have ≥2 for proper coverage
      const v2FilesWithLabels = strictV2SynthesisDirectories.filter(dir => {
        const content = readAnalysisFile(dir, 'synthesis-summary.md');
        return content ? countConfidenceLabels(content) > 0 : false;
      });

      // Strict-v2 files that use inline labels should have ≥2 of them for proper coverage
      for (const dir of v2FilesWithLabels) {
        const content = readAnalysisFile(dir, 'synthesis-summary.md');
        if (!content) continue;
        const count = countConfidenceLabels(content);
        expect(count, `${dir.date}/${dir.articleType}: inline confidence label count`).toBeGreaterThanOrEqual(2);
      }
    });

    it('should have L×I scoring or risk level in strict-v2 risk assessment files', () => {
      const failures: string[] = [];

      for (const dir of strictV2Directories) {
        const content = readAnalysisFile(dir, 'risk-assessment.md');
        if (!content) continue;
        // Accept either L×I formula or a Risk Level indicator
        const hasLxI = LXI_SCORING_PATTERN.test(content);
        const hasRiskLevel = /\bRisk\s+Level\b/i.test(content);
        if (!hasLxI && !hasRiskLevel) {
          failures.push(
            `${dir.date}/${dir.articleType}/risk-assessment.md: missing both L×I scoring and Risk Level`
          );
        }
      }

      expect(failures, `Strict-v2 risk assessments missing scoring:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have a valid Overall Confidence value (HIGH, MEDIUM, or LOW) in strict-v2 synthesis files', () => {
      const failures: string[] = [];

      for (const dir of strictV2SynthesisDirectories) {
        const content = readAnalysisFile(dir, 'synthesis-summary.md');
        if (!content) continue;
        const confidence = extractOverallConfidence(content);
        if (!confidence) {
          failures.push(
            `${dir.date}/${dir.articleType}/synthesis-summary.md: missing or invalid Overall Confidence metadata (expected HIGH, MEDIUM, or LOW)`
          );
        }
      }

      expect(failures, `Strict-v2 synthesis files with missing/invalid confidence:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have confidence or severity indicators in all threat analysis files', () => {
      const failures: string[] = [];

      for (const dir of analysisDirs) {
        const content = readAnalysisFile(dir, 'threat-analysis.md');
        if (!content) continue;
        // Threat analysis files may use severity, threat level, or confidence labels
        const hasIndicator = hasAnyConfidenceIndicator(content) ||
          /\b(?:Severity|Threat\s+Level|Overall\s+Threat)\b/i.test(content);
        if (!hasIndicator) {
          failures.push(
            `${dir.date}/${dir.articleType}/threat-analysis.md: no confidence or severity indicators found`
          );
        }
      }

      expect(failures, `Threat analyses missing indicators:\n${failures.join('\n')}`).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Banned Pattern Detection
  // -----------------------------------------------------------------------
  describe('Banned Patterns', () => {

    it('should detect no banned boilerplate patterns in analysis files', () => {
      const failures: string[] = [];

      for (const dir of analysisDirs) {
        for (const [filename, filePath] of dir.files) {
          const content = fs.readFileSync(filePath, 'utf-8');
          for (const { label, pattern } of ANALYSIS_BANNED_PATTERNS) {
            if (pattern.test(content)) {
              failures.push(
                `${dir.date}/${dir.articleType}/${filename}: contains banned pattern "${label}"`
              );
            }
          }
        }
      }

      expect(failures, `Files containing banned patterns:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should not contain "This is significant because" without evidence', () => {
      // Check within the same line (not across paragraphs) for a dok_id after the phrase
      const GENERIC_SIGNIFICANCE = /This is significant because(?!.{0,200}\b[Hh][A-Za-z]?\d{2,7})/;
      const failures: string[] = [];

      for (const dir of analysisDirs) {
        for (const [filename, filePath] of dir.files) {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (GENERIC_SIGNIFICANCE.test(content)) {
            failures.push(
              `${dir.date}/${dir.articleType}/${filename}: contains "This is significant because" without dok_id evidence`
            );
          }
        }
      }

      expect(failures, `Files with unsupported significance claims:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should not contain unattributed political claims', () => {
      const UNATTRIBUTED_CLAIMS = /\b(?:many believe|some argue|it is widely|observers note)\b/i;
      const failures: string[] = [];

      for (const dir of analysisDirs) {
        for (const [filename, filePath] of dir.files) {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (UNATTRIBUTED_CLAIMS.test(content)) {
            failures.push(
              `${dir.date}/${dir.articleType}/${filename}: contains unattributed political claim`
            );
          }
        }
      }

      expect(failures, `Files with unattributed claims:\n${failures.join('\n')}`).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // 6. Cross-Reference Integrity
  // -----------------------------------------------------------------------
  describe('Cross-Reference Integrity', () => {

    it('should have cross-reference-map.md referencing dok_ids that exist in companion JSON files', () => {
      const failures: string[] = [];

      for (const dir of dirsWithDocuments) {
        const crossRefContent = readAnalysisFile(dir, 'cross-reference-map.md');
        if (!crossRefContent) continue;

        const docsDir = path.join(dir.fullPath, 'documents');
        const jsonFiles = fs.readdirSync(docsDir)
          .filter(f => f.endsWith('.json'))
          .map(f => f.replace('.json', '').toUpperCase());

        if (jsonFiles.length === 0) continue;

        const referencedIds = crossRefContent.match(DOK_ID_PATTERN);
        if (!referencedIds) continue;

        const uniqueRefs = [...new Set(referencedIds.map(id => id.toUpperCase()))];

        const matchingIds = uniqueRefs.filter(id =>
          jsonFiles.some(jf => {
            if (jf === id) return true;
            // Only match if the shorter string is at least 4 chars to avoid false positives
            if (id.length >= 4 && jf.includes(id)) return true;
            if (jf.length >= 4 && id.includes(jf)) return true;
            return false;
          })
        );

        if (matchingIds.length === 0 && uniqueRefs.length > 0) {
          failures.push(
            `${dir.date}/${dir.articleType}/cross-reference-map.md: references ${uniqueRefs.length} dok_ids but none match JSON files`
          );
        }
      }

      expect(failures, `Cross-reference maps with unmatched dok_ids:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have consistent document counts between synthesis and companion files', () => {
      const failures: string[] = [];

      for (const dir of synthesisDirectories) {
        const content = readAnalysisFile(dir, 'synthesis-summary.md');
        if (!content || !dir.hasDocuments) continue;

        const declaredCount = extractDocumentsAnalyzedCount(content);
        if (declaredCount === null) continue;

        const docsDir = path.join(dir.fullPath, 'documents');
        const jsonCount = fs.readdirSync(docsDir).filter(f => f.endsWith('.json')).length;

        if (jsonCount > 0 && declaredCount === 0) {
          failures.push(
            `${dir.date}/${dir.articleType}: declares 0 documents but has ${jsonCount} JSON files`
          );
        }
      }

      expect(failures, `Inconsistent document counts:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should have stakeholder-perspectives.md in complete strict-v2 directories with synthesis', () => {
      // Only check directories that have ≥5 files (indicating completeness)
      const completeDirs = strictV2SynthesisDirectories.filter(d => d.files.size >= 5);
      const failures: string[] = [];

      for (const dir of completeDirs) {
        if (!dir.files.has('stakeholder-perspectives.md')) {
          failures.push(
            `${dir.date}/${dir.articleType}: has synthesis but missing stakeholder-perspectives.md`
          );
        }
      }

      expect(failures, `Complete strict-v2 directories missing stakeholder perspectives:\n${failures.join('\n')}`).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // 7. Overall Quality Summary (meta-tests)
  // -----------------------------------------------------------------------
  describe('Overall Quality', () => {

    it('should discover analysis directories', () => {
      expect(analysisDirs.length).toBeGreaterThan(0);
    });

    it('should have synthesis summary files across retained dates', () => {
      expect(synthesisDirectories.length).toBeGreaterThan(0);
    });

    it('should have analysis directories spanning retained dates when enough history exists', () => {
      const uniqueDates = new Set(analysisDirs.map(d => d.date));

      if (analysisDirs.length > 1) {
        expect(uniqueDates.size).toBeGreaterThanOrEqual(2);
        return;
      }

      expect(uniqueDates.size).toBeGreaterThan(0);
    });

    it('should have all analysis .md files be non-empty (>100 bytes)', () => {
      const failures: string[] = [];

      for (const dir of analysisDirs) {
        for (const [filename, filePath] of dir.files) {
          const stats = fs.statSync(filePath);
          if (stats.size < 100) {
            failures.push(
              `${dir.date}/${dir.articleType}/${filename}: file is only ${stats.size} bytes (minimum 100)`
            );
          }
        }
      }

      expect(failures, `Analysis files that are too small:\n${failures.join('\n')}`).toHaveLength(0);
    });

    it('should detect strict-v2 format analysis directories', () => {
      expect(strictV2Directories.length).toBeGreaterThan(0);
    });

    it('should detect analysis directories with companion documents', () => {
      expect(dirsWithDocuments.length).toBeGreaterThan(0);
    });
  });
});
