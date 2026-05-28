/**
 * @module Infrastructure/RenderLib/PoliticalContext
 * @description Glossary/party-context enrichment + political context model.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Language, ContextDepth } from '../types/language.js';
import { CONTEXT_DEPTH_BY_LANGUAGE } from '../types/language.js';

interface GlossaryTerm {
  readonly label: string;
  readonly definition: string;
}

interface PartyDefinition {
  readonly name: string;
  readonly description: string;
  readonly seats: number;
  readonly position: string;
  readonly governmentRole: string;
}

interface ComponentLabels {
  readonly heading: string;
  readonly summary: string;
  readonly govHeading: string;
  readonly spectrumHeading: string;
  readonly institutionsHeading: string;
  readonly comparisonsHeading: string;
  readonly actorsHeading: string;
}

interface PoliticalGlossaryData {
  readonly version: number;
  readonly contextDepthByLanguage: Record<Language, ContextDepth>;
  readonly parties: Record<string, PartyDefinition>;
  readonly terms: Record<string, GlossaryTerm>;
  readonly institutions: readonly string[];
  readonly comparativeAnchors: readonly string[];
  readonly componentLabels: Record<Language, ComponentLabels>;
  readonly spectrum: readonly string[];
  readonly governmentComposition: string;
}

export interface PoliticalContextPartyCard {
  readonly abbreviation: string;
  readonly name: string;
  readonly description: string;
  readonly seats: number;
  readonly position: string;
  readonly governmentRole: string;
}

export interface PoliticalContextModel {
  readonly depth: ContextDepth;
  readonly labels: ComponentLabels;
  readonly governmentComposition: string;
  readonly spectrum: readonly string[];
  readonly institutions: readonly string[];
  readonly comparativeAnchors: readonly string[];
  readonly partyCards: readonly PoliticalContextPartyCard[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GLOSSARY_PATH = path.join(__dirname, '..', '..', 'data', 'political-glossary.json');

const PARTY_ORDER = ['SD', 'KD', 'M', 'L', 'S', 'V', 'MP', 'C'] as const;

let glossaryCache: PoliticalGlossaryData | null = null;

function readGlossary(): PoliticalGlossaryData {
  if (glossaryCache) return glossaryCache;
  const parsed = JSON.parse(fs.readFileSync(GLOSSARY_PATH, 'utf8')) as PoliticalGlossaryData;
  glossaryCache = parsed;
  return parsed;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceFirstWholeWord(
  markdown: string,
  token: string,
  replacement: string,
): string {
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegex(token)})(?=[^\\p{L}\\p{N}]|$)`, 'u');
  return markdown.replace(pattern, (_m, prefix) => `${prefix}${replacement}`);
}

function replaceFirstOutsideCodeFence(
  markdown: string,
  token: string,
  replacement: string,
): string {
  const lines = markdown.split('\n');
  let inFence = false;
  let replaced = false;
  const out = lines.map((line) => {
    if (/^```/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence || replaced) return line;
    const next = replaceFirstWholeWord(line, token, replacement);
    if (next !== line) replaced = true;
    return next;
  });
  return out.join('\n');
}

export function enrichArticleMarkdownWithPoliticalContext(markdown: string, lang: Language): string {
  const data = readGlossary();
  let enriched = markdown;

  for (const token of ['riksmöte', 'betänkande', 'proposition', 'motion', 'utskott', 'Tidökoalition', 'A2', 'B3']) {
    const entry = data.terms[token];
    if (!entry) continue;
    const abbr = `<abbr class="rm-glossary-term" tabindex="0" title="${entry.definition}" aria-label="${entry.label}: ${entry.definition}">${entry.label}</abbr>`;
    enriched = replaceFirstOutsideCodeFence(enriched, token, abbr);
  }

  for (const party of PARTY_ORDER) {
    const details = data.parties[party];
    if (!details) continue;
    const expansion = `${party} (${details.name} — ${details.description} Seats: ${details.seats}/349 | Position: ${details.position} | Government role: ${details.governmentRole})`;
    enriched = replaceFirstOutsideCodeFence(enriched, party, expansion);
  }

  // Swedish pages still get term definitions, but we avoid additional comparative expansion noise.
  if (lang === 'sv') return enriched;
  return enriched;
}

function detectPresentParties(markdown: string): string[] {
  const matches: string[] = [];
  for (const party of PARTY_ORDER) {
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])${party}(?=[^\\p{L}\\p{N}]|$)`, 'u');
    if (re.test(markdown)) matches.push(party);
  }
  return matches;
}

export function buildPoliticalContextModel(markdown: string, lang: Language): PoliticalContextModel {
  const data = readGlossary();
  const depth = CONTEXT_DEPTH_BY_LANGUAGE[lang] ?? data.contextDepthByLanguage[lang] ?? 'medium';
  const partyCards = detectPresentParties(markdown)
    .map((abbreviation) => {
      const p = data.parties[abbreviation];
      if (!p) return null;
      return {
        abbreviation,
        name: p.name,
        description: p.description,
        seats: p.seats,
        position: p.position,
        governmentRole: p.governmentRole,
      } satisfies PoliticalContextPartyCard;
    })
    .filter((v): v is PoliticalContextPartyCard => v !== null);

  return {
    depth,
    labels: data.componentLabels[lang] ?? data.componentLabels.en,
    governmentComposition: data.governmentComposition,
    spectrum: data.spectrum,
    institutions: data.institutions,
    comparativeAnchors: depth === 'minimal' ? [] : data.comparativeAnchors.slice(0, 3),
    partyCards,
  };
}
