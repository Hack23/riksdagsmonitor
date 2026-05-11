/**
 * @module analysis-reader
 * @description Reads pre-computed political intelligence analysis files from
 * `analysis/daily/YYYY-MM-DD/` and provides a structured TypeScript API for
 * article generators to consume classification, risk, SWOT, threat, and
 * significance data.
 *
 * Falls back gracefully when analysis files are absent — backward compatible
 * with article generators that do not yet consume pre-computed analysis.
 *
 * ## ⚠️ Scoped deprecation (§P0-6 of the agentic-workflow quality plan)
 *
 * The structural parsers in this module (SWOT, threat, significance, risk,
 * stakeholder-perspective extractors) **must not** be used to summarise or
 * pre-digest the analysis body for article prose. The user-level rule is:
 *
 * > "Analysis in md files should not ever be parsed. AI must read it all
 * > as context."
 *
 * Instead, agentic workflows print every analysis file in full through the
 * `UNIVERSAL PRE-ARTICLE GATE` in `.github/aw/SHARED_PROMPT_PATTERNS.md`,
 * and the AI reads the full prose directly. The *only* remaining permitted
 * use of this module is `deriveArticleClassificationMeta()` and the
 * `readLatestAnalysis()` front-matter derivation, which extract a tiny
 * classification tuple (label + confidence) for article HTML metadata.
 *
 * New article-body content generators MUST read analysis files with a
 * plain `readFile()` and pass the markdown untouched to the AI — they MUST
 * NOT import the typed parsers from this module. A follow-up PR will add
 * lint rules to enforce this; for now this JSDoc notice is the contract.
 *
 * @example
 * ```typescript
 * // Permitted use — metadata only
 * import { deriveArticleClassificationMeta } from './analysis-reader.js';
 *
 * // DEPRECATED for article-body generation — read the file as prose instead:
 * // import { readFile } from 'node:fs/promises';
 * // const prose = await readFile(`analysis/daily/${date}/.../file.md`, 'utf-8');
 * ```
 *
 * @see analysis/agentic-workflow-quality-plan §P0-5 / §P0-6
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

/** Urgency label for political significance assessment */
export type UrgencyLabel = 'breaking' | 'major' | 'standard' | 'background';

// ---------------------------------------------------------------------------
// Classification types
// ---------------------------------------------------------------------------

/** Political intelligence classification level */
export type ClassificationLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Editorial priority level */
export type PriorityLevel = 'breaking' | 'major' | 'standard' | 'background';

/** Confidence label for analytical claims */
export type ConfidenceLabel = 'HIGH' | 'MEDIUM' | 'LOW';

/** Risk level for political assessments */
export type RiskLevel = 'high' | 'elevated' | 'moderate' | 'low';

// ---------------------------------------------------------------------------
// Analysis result types
// ---------------------------------------------------------------------------

/** Parsed classification results from `classification-results.md` */
export interface ClassificationResult {
  /** Overall classification level */
  level: ClassificationLevel;
  /** Editorial priority */
  priority: PriorityLevel;
  /** Overall confidence in the classification */
  confidence: ConfidenceLabel;
  /** Raw summary text extracted from the markdown */
  summary: string;
  /** Document IDs classified in this analysis */
  documentIds: string[];
  /** Policy domains identified */
  domains: string[];
}

/** Parsed risk assessment from `risk-assessment.md` */
export interface RiskAssessment {
  /** Overall risk level */
  level: RiskLevel;
  /** Key risk factors (parsed bullet list) */
  factors: string[];
  /** Risk indicators (inline ⚠️ tagged items) */
  indicators: string[];
  /** Overall confidence in the risk assessment */
  confidence: ConfidenceLabel;
  /** Raw summary text */
  summary: string;
}

/** Single SWOT entry with confidence and impact */
export interface AnalysisSwotEntry {
  /** Description text */
  text: string;
  /** Confidence level of this entry */
  confidence: ConfidenceLabel;
  /** Relative impact */
  impact?: 'high' | 'medium' | 'low';
  /** Source document IDs */
  sourceDocIds?: string[];
}

/** Parsed SWOT analysis from `swot-analysis.md` */
export interface SwotAnalysisResult {
  /** Subject of the SWOT analysis */
  subject: string;
  strengths: AnalysisSwotEntry[];
  weaknesses: AnalysisSwotEntry[];
  opportunities: AnalysisSwotEntry[];
  threats: AnalysisSwotEntry[];
  /** Additional context note */
  context?: string;
}

/** Democratic health assessment label */
export type DemocraticHealthLabel = 'HIGH' | 'MEDIUM' | 'LOW' | 'AT_RISK';

/** Parsed threat analysis from `threat-analysis.md` */
export interface ThreatAnalysisResult {
  /** Named threat indicators (🎯 tagged items) */
  indicators: string[];
  /** Democratic health assessment (HIGH/MEDIUM/LOW/AT_RISK) */
  democraticHealth: DemocraticHealthLabel;
  /** Key threat actors */
  actors: string[];
  /** Overall confidence in the threat analysis */
  confidence: ConfidenceLabel;
  /** Raw summary text */
  summary: string;
}

/** Parsed stakeholder perspectives from `stakeholder-perspectives.md` */
export interface StakeholderPerspectivesResult {
  /** Government/coalition perspective summary */
  government: string;
  /** Opposition perspective summary */
  opposition: string;
  /** Citizen perspective summary */
  citizen: string;
  /** Economic perspective summary */
  economic: string;
  /** International perspective summary */
  international: string;
  /** Media/discourse perspective summary */
  media: string;
}

/** Parsed significance scoring from `significance-scoring.md` */
export interface SignificanceScoringResult {
  /** Significance score (0–100) */
  score: number;
  /** Urgency label */
  urgency: UrgencyLabel;
  /** Ranked list of most significant documents */
  topDocuments: Array<{ docId: string; score: number; reason: string }>;
  /** Overall confidence in significance scoring */
  confidence: ConfidenceLabel;
}

/** Parsed synthesis summary from `synthesis-summary.md` */
export interface SynthesisSummaryResult {
  /** Primary narrative direction for the lede */
  narrativeDirection: string;
  /** Key themes identified across all documents */
  keyThemes: string[];
  /** Recommended article focus */
  articleFocus: string;
  /** Forward indicators for "What to Watch Next" */
  forwardIndicators: string[];
  /** When lookback was used, the actual date of the data (YYYY-MM-DD).
   *  `null` when documents match the requested article date exactly. */
  dataFreshness: string | null;
}

/** Complete pre-computed daily analysis for a given date */
export interface DailyAnalysis {
  /** Date of the analysis (YYYY-MM-DD) */
  date: string;
  /** Classification results (from classification-results.md) */
  classification: ClassificationResult | null;
  /** Risk assessment (from risk-assessment.md) */
  riskAssessment: RiskAssessment | null;
  /** SWOT analysis (from swot-analysis.md) */
  swot: SwotAnalysisResult | null;
  /** Threat analysis (from threat-analysis.md) */
  threatAnalysis: ThreatAnalysisResult | null;
  /** Stakeholder perspectives (from stakeholder-perspectives.md) */
  stakeholderPerspectives: StakeholderPerspectivesResult | null;
  /** Significance scoring (from significance-scoring.md) */
  significance: SignificanceScoringResult | null;
  /** Synthesis summary (from synthesis-summary.md) */
  synthesis: SynthesisSummaryResult | null;
  /** Whether any analysis files were found */
  hasAnalysis: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Regex pattern for matching Riksdag document IDs (e.g., H9011, H902A) */
const DOC_ID_PATTERN = /\b[A-Z]\d{3,7}[A-Z]?\b/g;

/** Default significance score when none is found in the markdown */
const DEFAULT_SIGNIFICANCE_SCORE = 50;

// ---------------------------------------------------------------------------
// Markdown parsing helpers
// ---------------------------------------------------------------------------

/**
 * Extract the first heading level 2 section content from markdown.
 * Returns the text content between the heading and the next heading.
 */
function extractSection(markdown: string, sectionName: string): string {
  const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `##\\s+${escapedName}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`,
    'i',
  );
  const match = regex.exec(markdown);
  return match?.[1]?.trim() ?? '';
}

/**
 * Extract the value of a key-value pair from markdown.
 * Supports formats: `**Key**: Value`, `- Key: Value`, `Key: Value`
 */
function extractValue(markdown: string, key: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`\\*\\*${escapedKey}\\*\\*:\\s*(.+)`, 'i'),
    new RegExp(`-\\s+${escapedKey}:\\s*(.+)`, 'i'),
    new RegExp(`${escapedKey}:\\s*(.+)`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(markdown);
    if (match?.[1]) {
      return match[1].trim().replace(/\*\*/g, '').replace(/`/g, '');
    }
  }
  return '';
}

/**
 * Extract a bullet list from a markdown section as an array of strings.
 * Handles both `- item` and `* item` formats.
 */
function extractBulletList(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.replace(/^[\s\-*]+/, '').trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

/**
 * Extract items tagged with a specific emoji icon from text.
 */
function extractIconTagged(text: string, icon: string): string[] {
  const results: string[] = [];
  for (const line of text.split('\n')) {
    if (line.includes(icon)) {
      const cleaned = line.replace(/^[\s\-*]+/, '').trim();
      if (cleaned) results.push(cleaned);
    }
  }
  return results;
}

/**
 * Normalize a string to a ClassificationLevel.
 * Returns 'MEDIUM' as default when unrecognized.
 */
function toClassificationLevel(value: string): ClassificationLevel {
  const upper = value.toUpperCase().trim();
  if (upper === 'CRITICAL') return 'CRITICAL';
  if (upper === 'HIGH') return 'HIGH';
  if (upper === 'LOW') return 'LOW';
  return 'MEDIUM';
}

/**
 * Normalize a string to a ConfidenceLabel.
 * Returns 'MEDIUM' as default when unrecognized.
 */
function toConfidenceLabel(value: string): ConfidenceLabel {
  const upper = value.toUpperCase().trim();
  if (upper === 'HIGH') return 'HIGH';
  if (upper === 'LOW') return 'LOW';
  return 'MEDIUM';
}

/**
 * Normalize a string to a RiskLevel.
 * Returns 'moderate' as default when unrecognized.
 */
function toRiskLevel(value: string): RiskLevel {
  const lower = value.toLowerCase().trim();
  if (lower === 'high') return 'high';
  if (lower === 'elevated') return 'elevated';
  if (lower === 'low') return 'low';
  return 'moderate';
}

/**
 * Normalize a string to a DemocraticHealthLabel.
 * Returns 'MEDIUM' as default when unrecognized.
 */
function toDemocraticHealthLabel(value: string): DemocraticHealthLabel {
  const upper = value.toUpperCase().trim().replace(/[\s_-]+/g, '_');
  if (upper === 'HIGH') return 'HIGH';
  if (upper === 'LOW') return 'LOW';
  if (upper === 'AT_RISK' || upper === 'ATRISK') return 'AT_RISK';
  return 'MEDIUM';
}

/**
 * Normalize a string to a PriorityLevel.
 * Returns 'standard' as default when unrecognized.
 */
function toPriorityLevel(value: string): PriorityLevel {
  const lower = value.toLowerCase().trim();
  if (lower === 'breaking') return 'breaking';
  if (lower === 'major') return 'major';
  if (lower === 'background') return 'background';
  return 'standard';
}

/**
 * Normalize urgency labels to the known UrgencyLabel union.
 * Returns 'standard' as safe default for unrecognized values.
 */
function toUrgencyLabel(value: string): UrgencyLabel {
  const lower = value.toLowerCase().trim();
  if (lower === 'breaking') return 'breaking';
  if (lower === 'major') return 'major';
  if (lower === 'background') return 'background';
  return 'standard';
}

/**
 * Parse SWOT entries from a markdown quadrant section.
 */
function parseSwotEntries(sectionText: string): AnalysisSwotEntry[] {
  const entries: AnalysisSwotEntry[] = [];
  const blocks = sectionText.split(/\n(?=[-*]|\d+\.)/);
  for (const block of blocks) {
    const text = block.replace(/^\s*(?:[-*]|\d+\.)\s+/, '').trim();
    if (!text || text.startsWith('#')) continue;

    const confMatch = /\[(HIGH|MEDIUM|LOW)\]/i.exec(text);
    const confidence = confMatch ? toConfidenceLabel(confMatch[1]!) : 'MEDIUM';

    const impactMatch = /impact:\s*(high|medium|low)/i.exec(text);
    const impact = impactMatch
      ? (impactMatch[1]!.toLowerCase() as 'high' | 'medium' | 'low')
      : undefined;

    const docIdMatches = text.match(DOC_ID_PATTERN) ?? [];

    entries.push({
      text: text.replace(/\[(HIGH|MEDIUM|LOW)\]/gi, '').replace(/impact:\s*(high|medium|low)/gi, '').trim(),
      confidence,
      impact,
      sourceDocIds: docIdMatches,
    });
  }
  return entries.filter(e => e.text.length > 0);
}

// ---------------------------------------------------------------------------
// File parsers
// ---------------------------------------------------------------------------

/**
 * Parse `classification-results.md` into a structured ClassificationResult.
 */
export function parseClassificationResults(markdown: string): ClassificationResult {
  const level = toClassificationLevel(extractValue(markdown, 'Level') || extractValue(markdown, 'Classification Level'));
  const priority = toPriorityLevel(extractValue(markdown, 'Priority'));
  const confidence = toConfidenceLabel(extractValue(markdown, 'Confidence'));

  const documentIds = Array.from(new Set(markdown.match(DOC_ID_PATTERN) ?? []));

  const domainsSection = extractSection(markdown, 'Policy Domains') || extractSection(markdown, 'Domains');
  const domains = domainsSection
    ? extractBulletList(domainsSection)
    : extractBulletList(extractSection(markdown, 'Classification') || '');

  const summarySection = extractSection(markdown, 'Summary');
  const summary =
    (summarySection && summarySection.trim()) ||
    /^(?!#)(.{30,})/m.exec(markdown)?.[1]?.trim() ||
    markdown.split('\n').find(l => l.trim().length > 30)?.trim() ||
    '';

  return { level, priority, confidence, summary, documentIds, domains: domains.slice(0, 10) };
}

/**
 * Parse `risk-assessment.md` into a structured RiskAssessment.
 */
export function parseRiskAssessment(markdown: string): RiskAssessment {
  const level = toRiskLevel(extractValue(markdown, 'Overall Risk') || extractValue(markdown, 'Risk Level'));
  const confidence = toConfidenceLabel(extractValue(markdown, 'Confidence'));

  const factorsSection = extractSection(markdown, 'Risk Factors') || extractSection(markdown, 'Factors');
  const factors = factorsSection ? extractBulletList(factorsSection) : [];

  const indicators = extractIconTagged(markdown, '⚠️');

  const summarySection = extractSection(markdown, 'Summary') || extractSection(markdown, 'Overview');
  const summary = summarySection || markdown.split('\n').filter(l => l.trim().length > 30).slice(0, 2).join(' ');

  return { level, factors: factors.slice(0, 10), indicators: indicators.slice(0, 8), confidence, summary };
}

/**
 * Parse `swot-analysis.md` into a structured SwotAnalysisResult.
 */
export function parseSwotAnalysis(markdown: string): SwotAnalysisResult {
  const subject = extractValue(markdown, 'Subject') || 'Swedish Parliament';
  const context = extractSection(markdown, 'Context') || undefined;

  const strengthsSection = extractSection(markdown, 'Strengths') || extractSection(markdown, '💪 Strengths');
  const weaknessesSection = extractSection(markdown, 'Weaknesses') || extractSection(markdown, '⚡ Weaknesses');
  const opportunitiesSection = extractSection(markdown, 'Opportunities') || extractSection(markdown, '🚀 Opportunities');
  const threatsSection = extractSection(markdown, 'Threats') || extractSection(markdown, '☁️ Threats');

  return {
    subject,
    strengths: parseSwotEntries(strengthsSection),
    weaknesses: parseSwotEntries(weaknessesSection),
    opportunities: parseSwotEntries(opportunitiesSection),
    threats: parseSwotEntries(threatsSection),
    context,
  };
}

/**
 * Parse `threat-analysis.md` into a structured ThreatAnalysisResult.
 */
export function parseThreatAnalysis(markdown: string): ThreatAnalysisResult {
  const indicators = extractIconTagged(markdown, '🎯');
  const democraticHealth = toDemocraticHealthLabel(extractValue(markdown, 'Democratic Health') || extractValue(markdown, 'Health Status') || 'MEDIUM');
  const confidence = toConfidenceLabel(extractValue(markdown, 'Confidence'));

  const actorsSection = extractSection(markdown, 'Key Actors') || extractSection(markdown, 'Actors');
  const actors = actorsSection ? extractBulletList(actorsSection) : [];

  const summarySection = extractSection(markdown, 'Summary') || extractSection(markdown, 'Overview');
  const summary = summarySection || markdown.split('\n').filter(l => l.trim().length > 30).slice(0, 2).join(' ');

  return { indicators: indicators.slice(0, 8), democraticHealth, actors: actors.slice(0, 6), confidence, summary };
}

/**
 * Parse `stakeholder-perspectives.md` into a structured StakeholderPerspectivesResult.
 */
export function parseStakeholderPerspectives(markdown: string): StakeholderPerspectivesResult {
  const government = extractSection(markdown, '🏛️ Government') || extractSection(markdown, 'Government') || '';
  const opposition = extractSection(markdown, '⚖️ Opposition') || extractSection(markdown, 'Opposition') || '';
  const citizen =
    extractSection(markdown, '👥 Citizen') ||
    extractSection(markdown, 'Citizen') ||
    extractSection(markdown, 'Citizens') ||
    '';
  const economic = extractSection(markdown, '💰 Economic') || extractSection(markdown, 'Economic') || '';
  const international = extractSection(markdown, '🌍 International') || extractSection(markdown, 'International') || '';
  const media = extractSection(markdown, '📰 Media') || extractSection(markdown, 'Media') || '';

  return {
    government: government.split('\n').filter(l => l.trim()).join(' ').trim(),
    opposition: opposition.split('\n').filter(l => l.trim()).join(' ').trim(),
    citizen: citizen.split('\n').filter(l => l.trim()).join(' ').trim(),
    economic: economic.split('\n').filter(l => l.trim()).join(' ').trim(),
    international: international.split('\n').filter(l => l.trim()).join(' ').trim(),
    media: media.split('\n').filter(l => l.trim()).join(' ').trim(),
  };
}

/**
 * Parse `significance-scoring.md` into a structured SignificanceScoringResult.
 */
export function parseSignificanceScoring(markdown: string): SignificanceScoringResult {
  const scoreStr = extractValue(markdown, 'Overall Score') || extractValue(markdown, 'Score');
  const score = scoreStr ? Math.min(100, Math.max(0, parseInt(scoreStr, 10) || DEFAULT_SIGNIFICANCE_SCORE)) : DEFAULT_SIGNIFICANCE_SCORE;
  const urgency = toUrgencyLabel(extractValue(markdown, 'Urgency') || 'standard');
  const confidence = toConfidenceLabel(extractValue(markdown, 'Confidence'));

  const topDocumentsSection = extractSection(markdown, 'Top Documents') || extractSection(markdown, 'Significant Documents');
  const topDocuments: Array<{ docId: string; score: number; reason: string }> = [];
  for (const line of topDocumentsSection.split('\n')) {
    const match = /([A-Z]\d{3,7}[A-Z]?).*?(\d{1,3})(?:%|\s+points?|\s+score)?[:\s—-]+(.+)/i.exec(line.trim());
    if (match) {
      const rawScore = parseInt(match[2]!, 10);
      topDocuments.push({
        docId: match[1]!,
        score: Math.min(100, Math.max(0, Number.isFinite(rawScore) ? rawScore : 0)),
        reason: match[3]!.trim(),
      });
    }
  }

  return { score, urgency, topDocuments: topDocuments.slice(0, 5), confidence };
}

/**
 * Parse `synthesis-summary.md` into a structured SynthesisSummaryResult.
 */
export function parseSynthesisSummary(markdown: string): SynthesisSummaryResult {
  const narrativeDirection = extractSection(markdown, 'Narrative Direction') || extractSection(markdown, 'Primary Narrative') || '';
  const articleFocus = extractSection(markdown, 'Article Focus') || extractSection(markdown, 'Focus') || '';

  const themesSection = extractSection(markdown, 'Key Themes') || extractSection(markdown, 'Themes');
  const keyThemes = themesSection ? extractBulletList(themesSection) : [];

  const forwardSection = extractSection(markdown, 'Forward Indicators') || extractSection(markdown, 'What to Watch');
  const forwardIndicators = forwardSection ? extractBulletList(forwardSection) : [];

  const freshnessMatch = /\*\*Data Freshness\*\*:\s*Documents sourced from \*\*(\d{4}-\d{2}-\d{2})\*\*/.exec(markdown);
  const dataFreshness = freshnessMatch?.[1] ?? null;

  return {
    narrativeDirection: narrativeDirection.split('\n').filter(l => l.trim()).join(' ').trim(),
    keyThemes: keyThemes.slice(0, 8),
    articleFocus: articleFocus.split('\n').filter(l => l.trim()).join(' ').trim(),
    forwardIndicators: forwardIndicators.slice(0, 5),
    dataFreshness,
  };
}

// ---------------------------------------------------------------------------
// File reading helpers
// ---------------------------------------------------------------------------

/** Base path for the analysis directory relative to project root */
const ANALYSIS_BASE_PATH = 'analysis/daily';

/** Analysis file names within a daily directory */
const ANALYSIS_FILES = {
  classification: 'classification-results.md',
  risk: 'risk-assessment.md',
  swot: 'swot-analysis.md',
  threat: 'threat-analysis.md',
  stakeholders: 'stakeholder-perspectives.md',
  significance: 'significance-scoring.md',
  synthesis: 'synthesis-summary.md',
} as const;

/** Strict YYYY-MM-DD format guard to prevent path traversal via `date`. */
const DATE_FORMAT_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Attempt to read a markdown file from the analysis directory.
 * First checks `analysis/daily/{date}/{filename}`, then scans immediate
 * subdirectories (e.g., `deep-inspection/`, `propositions/`) for the file.
 * Returns `null` if the file does not exist, cannot be read, or `date` is
 * not a valid YYYY-MM-DD string (guards against path traversal).
 */
async function readAnalysisFile(date: string, filename: string, basePath?: string): Promise<string | null> {
  if (!DATE_FORMAT_RE.test(date)) return null;
  const resolvedBase = basePath ?? ANALYSIS_BASE_PATH;
  const dateDir = join(resolvedBase, date);

  try {
    const entries = await readdir(dateDir, { withFileTypes: true });
    const sortedDirs = entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of sortedDirs) {
      const subPath = join(dateDir, entry.name, filename);
      try {
        return await readFile(subPath, 'utf-8');
      } catch {
        // Not in this subdirectory — continue
      }
    }
  } catch {
    // Date directory doesn't exist or can't be read
  }

  const rootPath = join(resolvedBase, date, filename);
  try {
    return await readFile(rootPath, 'utf-8');
  } catch {
    // Root-level file not found either
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read and parse all pre-computed analysis files for a given date.
 *
 * @param date - Date string in YYYY-MM-DD format
 * @param basePath - Optional override for the base analysis directory path
 * @returns Complete DailyAnalysis object; individual fields are `null` when
 *          the corresponding file is absent or cannot be parsed.
 *
 * @example
 * ```typescript
 * const analysis = await readDailyAnalysis('2026-03-26');
 * if (analysis.hasAnalysis) {
 *   console.log(analysis.classification?.level); // 'HIGH'
 *   console.log(analysis.significance?.score);   // 72
 * }
 * ```
 */
export async function readDailyAnalysis(date: string, basePath?: string): Promise<DailyAnalysis> {
  const [
    classificationMd,
    riskMd,
    swotMd,
    threatMd,
    stakeholdersMd,
    significanceMd,
    synthesisMd,
  ] = await Promise.all([
    readAnalysisFile(date, ANALYSIS_FILES.classification, basePath),
    readAnalysisFile(date, ANALYSIS_FILES.risk, basePath),
    readAnalysisFile(date, ANALYSIS_FILES.swot, basePath),
    readAnalysisFile(date, ANALYSIS_FILES.threat, basePath),
    readAnalysisFile(date, ANALYSIS_FILES.stakeholders, basePath),
    readAnalysisFile(date, ANALYSIS_FILES.significance, basePath),
    readAnalysisFile(date, ANALYSIS_FILES.synthesis, basePath),
  ]);

  const classification = classificationMd ? parseClassificationResults(classificationMd) : null;
  const riskAssessment = riskMd ? parseRiskAssessment(riskMd) : null;
  const swot = swotMd ? parseSwotAnalysis(swotMd) : null;
  const threatAnalysis = threatMd ? parseThreatAnalysis(threatMd) : null;
  const stakeholderPerspectives = stakeholdersMd ? parseStakeholderPerspectives(stakeholdersMd) : null;
  const significance = significanceMd ? parseSignificanceScoring(significanceMd) : null;
  const synthesis = synthesisMd ? parseSynthesisSummary(synthesisMd) : null;

  const hasAnalysis = [
    classification,
    riskAssessment,
    swot,
    threatAnalysis,
    stakeholderPerspectives,
    significance,
    synthesis,
  ].some(field => field !== null);

  return {
    date,
    classification,
    riskAssessment,
    swot,
    threatAnalysis,
    stakeholderPerspectives,
    significance,
    synthesis,
    hasAnalysis,
  };
}

/**
 * Derive the most recent date for which analysis files exist.
 * Searches backwards from today up to `maxDaysBack` days.
 *
 * @param maxDaysBack - Maximum number of days to search back (default 7)
 * @param basePath - Optional override for the base analysis directory path
 * @returns ISO date string (YYYY-MM-DD) or `null` if no analysis found
 */
export async function findLatestAnalysisDate(maxDaysBack = 7, basePath?: string): Promise<string | null> {
  const resolvedBase = basePath ?? ANALYSIS_BASE_PATH;
  const today = new Date();
  for (let i = 0; i < maxDaysBack; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0]!;
    const dirPath = join(resolvedBase, dateStr);
    if (existsSync(dirPath)) {
      const hasRootFile = Object.values(ANALYSIS_FILES).some(f => existsSync(join(dirPath, f)));
      if (hasRootFile) return dateStr;

      try {
        const entries = await readdir(dirPath, { withFileTypes: true });
        const sortedDirs = entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
        for (const entry of sortedDirs) {
          const hasSubFile = Object.values(ANALYSIS_FILES).some(
            f => existsSync(join(dirPath, entry.name, f)),
          );
          if (hasSubFile) return dateStr;
        }
      } catch {
        // Can't read subdirectories — skip
      }
    }
  }
  return null;
}

/**
 * Read the most recent available daily analysis.
 * Convenience wrapper around `findLatestAnalysisDate` + `readDailyAnalysis`.
 *
 * @param maxDaysBack - Maximum number of days to search back (default 7)
 * @param basePath - Optional override for the base analysis directory path
 * @returns DailyAnalysis for the most recent date found, or a stub with
 *          `hasAnalysis: false` when no analysis files exist.
 */
export async function readLatestAnalysis(maxDaysBack = 7, basePath?: string): Promise<DailyAnalysis> {
  const date = await findLatestAnalysisDate(maxDaysBack, basePath);
  if (!date) {
    const today = new Date().toISOString().split('T')[0]!;
    return {
      date: today,
      classification: null,
      riskAssessment: null,
      swot: null,
      threatAnalysis: null,
      stakeholderPerspectives: null,
      significance: null,
      synthesis: null,
      hasAnalysis: false,
    };
  }
  return readDailyAnalysis(date, basePath);
}

/**
 * Derive article classification metadata from a DailyAnalysis.
 * Returns safe defaults when analysis is absent.
 *
 * @param analysis - DailyAnalysis object (may have hasAnalysis: false)
 * @returns Flattened metadata suitable for ArticleData enrichment
 */
export function deriveArticleClassificationMeta(analysis: DailyAnalysis): {
  classificationLevel: ClassificationLevel;
  riskLevel: RiskLevel;
  confidenceLabel: ConfidenceLabel;
  significanceScore: number | undefined;
  urgency: UrgencyLabel | undefined;
} {
  return {
    classificationLevel: analysis.classification?.level ?? 'MEDIUM',
    riskLevel: analysis.riskAssessment?.level ?? 'moderate',
    confidenceLabel: analysis.classification?.confidence ?? analysis.riskAssessment?.confidence ?? 'MEDIUM',
    significanceScore: analysis.significance?.score,
    urgency: analysis.significance?.urgency,
  };
}

/**
 * Check whether a daily analysis has substantive content.
 *
 * An analysis is considered non-empty when the synthesis contains at least
 * one key theme or a narrative direction. When the synthesis-summary.md file
 * was not generated (synthesis is null), the function defers to `hasAnalysis`
 * since other analysis files may still contain useful data.
 */
export function isNonEmptyAnalysis(analysis: DailyAnalysis): boolean {
  if (!analysis.hasAnalysis) return false;
  if (analysis.synthesis === null) return analysis.hasAnalysis;
  const hasThemes = analysis.synthesis.keyThemes.length > 0;
  const hasNarrative = analysis.synthesis.narrativeDirection.length > 0;
  return hasThemes || hasNarrative;
}

/**
 * Read the daily analysis for `date`, falling back to previous dates when the
 * current analysis is empty (Documents Analyzed: 0).
 *
 * This prevents article generators from receiving empty analysis data when the
 * requested date had no parliamentary activity (weekends, holidays, etc.).
 *
 * @param date        - Date string in YYYY-MM-DD format
 * @param maxDaysBack - Maximum number of days to search back (default 5)
 * @param basePath    - Optional override for the base analysis directory path
 * @returns DailyAnalysis for the most recent non-empty date found, or the
 *          original empty analysis if no non-empty analysis exists within range.
 */
export async function readLatestNonEmptyAnalysis(
  date: string,
  maxDaysBack = 5,
  basePath?: string,
): Promise<DailyAnalysis> {
  if (!DATE_FORMAT_RE.test(date)) {
    return readDailyAnalysis(date, basePath);
  }
  const primary = await readDailyAnalysis(date, basePath);
  if (isNonEmptyAnalysis(primary)) return primary;

  for (let i = 1; i <= maxDaysBack; i++) {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    const prevDate = d.toISOString().slice(0, 10);
    const prev = await readDailyAnalysis(prevDate, basePath);
    if (isNonEmptyAnalysis(prev)) {
      console.log(`[analysis-reader] Lookback fallback: using analysis from ${prevDate} (requested: ${date})`);
      return prev;
    }
  }

  return primary;
}
