/**
 * @module scripts/validators/news-translations/rules/body-leakage
 * @description Detect untranslated English / Swedish body content in
 *              non-EN translations. Compares the translated article
 *              against its EN source and scans for canonical English
 *              analytical phrases + Swedish API excerpts.
 *
 *              Rule census: extracted from
 *              `scripts/validate-news-translations.ts` lines 102–289
 *              (MIN_PARAGRAPH_LENGTH, SCRIPT_TAG_RE, STYLE_TAG_RE,
 *              ENGLISH_LEAKAGE_PHRASES, SWEDISH_LEAKAGE_PHRASES,
 *              extractBodyParagraphs, checkBodyContentLeakage).
 *              Logic is byte-identical to the original; every phrase
 *              regex is preserved as-is.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { existsSync, readFileSync } from 'fs';
import { basename } from 'path';

import type { ContentLeakageRecord } from '../types.js';

/**
 * Minimum paragraph character length to consider for leakage checks.
 * Short fragments like dates or single words are skipped.
 */
const MIN_PARAGRAPH_LENGTH = 40;

/**
 * Regex patterns that match opening-through-closing script/style tags,
 * handling whitespace and attributes in closing tags (e.g. </script > or </style\tbar>).
 * Hoisted to module level to avoid repeated compilation per file.
 */
const SCRIPT_TAG_RE = /<script\b[^<]*(?:(?!<\/script\b)<[^<]*)*<\/script\b[^>]*>/gi;
const STYLE_TAG_RE = /<style\b[^<]*(?:(?!<\/style\b)<[^<]*)*<\/style\b[^>]*>/gi;

/**
 * English phrases that MUST NOT appear verbatim in non-EN translations.
 * These indicate untranslated analytical body content.
 */
const ENGLISH_LEAKAGE_PHRASES: readonly RegExp[] = [
  /\bThe pace of activity signals\b/i,
  /\bbroad legislative push\b/i,
  /\bculmination of legislative review\b/i,
  /\bcascade through committee deliberations\b/i,
  /\bStandard parliamentary procedures\b/i,
  /\bWhile parliament deliberates\b/i,
  /\bWhy It Matters\b/i,
  /\bPolicy Context\b/i,
  /\bCoalition Dynamics\b/i,
  /\bStakeholder Impact\b/i,
  /\bForward Indicators\b/i,
  /\bRead the full proposition\b/i,
  /\bLive intelligence platform for Swedish Parliament\b/i,
  /\bSwedish cybersecurity consultancy specializing\b/i,
  /\bAI-generated political intelligence based on OSINT\b/i,
  /\bThe outcomes of these proceedings will cascade\b/i,
  /\bThe legislative activity reflects the ongoing interplay\b/i,
  /\bopposition parties have mounted coordinated responses\b/i,
  /\banalysis confidence:/i,
  /\bThis article is supported by structured political intelligence\b/i,
];

/**
 * Swedish phrases that MUST NOT appear in non-SV articles.
 * These indicate raw API text that was not translated.
 */
const SWEDISH_LEAKAGE_PHRASES: readonly RegExp[] = [
  /Regeringen överlämnar denna/,
  /till riksdagen/,
  /riksdagen\.?\s*Stockholm den/,
  /Riksrevisionens rapport om/,
  /med anledning av prop\./,
  /med anledning av skr\./,
  /Skyddet för yttrandefriheten/,
  /Åtgärder mot social dumpning/,
  /Regeringens integrationspolitik/,
  /Nationell plan för nya datacenter/,
  /Funktionsrätt Sveriges granskning/,
  /Polismyndighetens myndighetsutövning/,
  /Fördelning av ansvar för infrastrukturkostnader/,
  /Statligt säkerställande av bra vård/,
];

/**
 * Extract visible text paragraphs from HTML body content.
 * Strips tags, scripts, styles; returns non-trivial paragraphs.
 *
 * NOTE: This is a best-effort HTML text extraction helper for validator
 * comparisons, not a full HTML parser. Because it is used for leakage
 * detection, extraction correctness matters: missed script/style/tag
 * stripping can reduce comparison accuracy. The iterative approach is
 * intended to remove nested script/style content more completely.
 */
export function extractBodyParagraphs(html: string): string[] {
  SCRIPT_TAG_RE.lastIndex = 0;
  STYLE_TAG_RE.lastIndex = 0;

  let cleaned = html;
  let prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(SCRIPT_TAG_RE, '');
  }
  prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(STYLE_TAG_RE, '');
  }

  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pRegex.exec(cleaned)) !== null) {
    let text = match[1] ?? '';
    let prevText = '';
    while (prevText !== text) {
      prevText = text;
      text = text.replace(/<[^>]*>/g, '');
    }
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length >= MIN_PARAGRAPH_LENGTH) {
      paragraphs.push(text);
    }
  }
  return paragraphs;
}

/**
 * Check how many paragraphs from an EN source appear verbatim in a translated article.
 * Returns an object with leakage metrics.
 */
export function checkBodyContentLeakage(
  translatedFilePath: string,
  enSourcePath: string | null,
  fileLang: string,
): ContentLeakageRecord | null {
  if (fileLang === 'en') return null;

  const translatedContent = readFileSync(translatedFilePath, 'utf-8');
  const filename = basename(translatedFilePath);
  const translatedParagraphs = extractBodyParagraphs(translatedContent);

  if (translatedParagraphs.length === 0) return null;

  let enParagraphLeakageCount = 0;
  let phraseLeakageCount = 0;
  const samples: string[] = [];

  if (enSourcePath && existsSync(enSourcePath)) {
    const enContent = readFileSync(enSourcePath, 'utf-8');
    const enParagraphs = extractBodyParagraphs(enContent);
    const translatedParagraphSet = new Set(translatedParagraphs);

    for (const enPara of enParagraphs) {
      if (enPara.length >= MIN_PARAGRAPH_LENGTH && translatedParagraphSet.has(enPara)) {
        enParagraphLeakageCount++;
        if (samples.length < 5) {
          samples.push(`[EN leakage] ${enPara.slice(0, 100)}...`);
        }
      }
    }
  }

  for (const pattern of ENGLISH_LEAKAGE_PHRASES) {
    if (pattern.test(translatedContent)) {
      phraseLeakageCount++;
      const m = translatedContent.match(pattern);
      if (m && samples.length < 5) {
        samples.push(`[EN phrase] ${m[0]}`);
      }
    }
  }

  if (fileLang !== 'sv') {
    for (const pattern of SWEDISH_LEAKAGE_PHRASES) {
      if (pattern.test(translatedContent)) {
        phraseLeakageCount++;
        const m = translatedContent.match(pattern);
        if (m && samples.length < 5) {
          samples.push(`[SV leakage] ${m[0]}`);
        }
      }
    }
  }

  const totalParagraphs = translatedParagraphs.length;
  const percentUntranslated = totalParagraphs > 0
    ? Math.round((enParagraphLeakageCount / totalParagraphs) * 100)
    : 0;
  const hasLeakage = enParagraphLeakageCount > 0 || phraseLeakageCount > 0;

  if (!hasLeakage) return null;

  if (phraseLeakageCount > 0 && samples.length < 5) {
    samples.unshift(`[Phrase matches] ${phraseLeakageCount} English/Swedish leakage phrase match(es) detected.`);
  }

  return {
    filename,
    lang: fileLang,
    untranslatedParagraphs: enParagraphLeakageCount,
    phraseMatches: phraseLeakageCount,
    totalParagraphs,
    percentUntranslated,
    samples,
  };
}
