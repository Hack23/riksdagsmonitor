/**
 * @module rewrite-article-metadata/rewriter
 * @description Single-file rewrite pipeline. Reads HTML, scores
 * violations, derives a fresh title + description, and returns the
 * mutated HTML alongside an audit-friendly RewriteOutcome.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import { __test__ } from '../render-lib/aggregator/index.js';

import { META_REGEXES, resolveBudget } from './budget.js';
import {
  decodeEntities,
  extractBestDescription,
  htmlEscape,
  stripAdminFromDescription,
} from './html.js';
import { detectViolations, needsRewrite } from './violations.js';

const { truncateToSentenceBoundary, cleanArticleTitle, titleFromBluf } = __test__;

export interface RewriteOutcome {
  readonly file: string;
  readonly changed: boolean;
  readonly reasons: readonly string[];
  readonly beforeTitle: string;
  readonly afterTitle: string;
  readonly beforeDescription: string;
  readonly afterDescription: string;
}

export function rewriteOne(filePath: string): { outcome: RewriteOutcome; nextHtml: string | null } {
  const html = fs.readFileSync(filePath, 'utf8');
  const filename = path.basename(filePath);

  const budget = resolveBudget(html, filename);

  const docTitleRaw = html.match(META_REGEXES.title)?.[1]?.trim() ?? '';
  const docTitleText = decodeEntities(docTitleRaw);

  const descRaw = html.match(META_REGEXES.metaDescription)?.[2] ?? '';
  const descText = decodeEntities(descRaw);

  const ogDescRaw = html.match(META_REGEXES.ogDescription)?.[2] ?? '';
  const ogDescText = decodeEntities(ogDescRaw);

  const ogTitleRaw = html.match(META_REGEXES.ogTitle)?.[2] ?? '';
  const ogTitleText = decodeEntities(ogTitleRaw);

  const twTitleRaw = html.match(META_REGEXES.twitterTitle)?.[2] ?? '';
  const twTitleText = decodeEntities(twTitleRaw);

  const richestCurrentDescription =
    [descText, ogDescText].sort((a, b) => b.length - a.length)[0] ?? '';

  const violations = detectViolations(
    docTitleText,
    richestCurrentDescription,
    ogTitleText,
    twTitleText,
    budget,
  );

  if (!needsRewrite(violations) && !violations.descriptionTooShort) {
    return {
      outcome: {
        file: filePath,
        changed: false,
        reasons: [],
        beforeTitle: docTitleText,
        afterTitle: docTitleText,
        beforeDescription: richestCurrentDescription,
        afterDescription: richestCurrentDescription,
      },
      nextHtml: null,
    };
  }

  const reasons: string[] = [];
  for (const [k, v] of Object.entries(violations)) if (v) reasons.push(k);

  let newDescription = richestCurrentDescription;

  if (violations.adminInDescription || violations.bannedPhraseInDescription || violations.genericFiller) {
    const stripped = stripAdminFromDescription(richestCurrentDescription);
    if (stripped && stripped.length >= 40) newDescription = stripped;
    else newDescription = '';
  }

  const needsNewFromBody =
    newDescription.length < budget.descMin ||
    newDescription.length > budget.descHardMax ||
    violations.midWordDescriptionCut ||
    violations.genericFiller;

  if (needsNewFromBody) {
    const articleBlock = html.match(META_REGEXES.article)?.[1] ?? '';
    const fromBody = extractBestDescription(articleBlock);
    if (fromBody && fromBody.length >= budget.descMin) {
      newDescription = fromBody;
    } else if (fromBody && fromBody.length >= 40) {
      newDescription = fromBody;
    }
  }

  newDescription = truncateToSentenceBoundary(
    newDescription,
    budget.descSoftMin,
    budget.descHardMax,
  ).trim();

  if (newDescription.length === 0) {
    return {
      outcome: {
        file: filePath,
        changed: false,
        reasons: [...reasons, 'no-usable-prose'],
        beforeTitle: docTitleText,
        afterTitle: docTitleText,
        beforeDescription: richestCurrentDescription,
        afterDescription: richestCurrentDescription,
      },
      nextHtml: null,
    };
  }

  const titleWithoutBrand = docTitleText.replace(/\s*[—\-|]\s*Riksdagsmonitor\s*$/i, '').trim();

  let newTitle = titleWithoutBrand;
  const titleHasStructuralIssue =
    violations.isoDateInTitle ||
    violations.executiveBriefPrefix ||
    violations.titleTooLong ||
    violations.doubleBrandOgOrTwitter;

  if (titleHasStructuralIssue) {
    const cleaned = cleanArticleTitle(titleWithoutBrand);
    if (cleaned) {
      newTitle = cleaned;
    } else {
      const fromBluf = titleFromBluf(newDescription, budget.titleMax);
      if (fromBluf) newTitle = fromBluf;
    }

    newTitle = newTitle.replace(/\s*\d{4}-\d{2}-\d{2}(?:\s+\d{1,2}:\d{2})?\s*/g, ' ').replace(/\s+/g, ' ').trim();
    newTitle = newTitle.replace(/[\s,;:]*(?:to|till|bis|à|a|إلى|から|til|–|—|-|:)\s*$/iu, '').trim();

    if (newTitle.length > budget.titleMax + 50) {
      const slice = newTitle.slice(0, budget.titleMax);
      const lastSpace = slice.lastIndexOf(' ');
      newTitle = (lastSpace > budget.titleMin ? slice.slice(0, lastSpace) : slice).trim();
    }

    if (!newTitle || newTitle.length < 5) {
      newTitle = titleWithoutBrand || docTitleText;
    }
  }

  const brandedTitle = /riksdagsmonitor/i.test(newTitle)
    ? newTitle
    : `${newTitle} — Riksdagsmonitor`;

  let next = html;
  const escTitle = htmlEscape(newTitle);
  const escBranded = htmlEscape(brandedTitle);
  const escDesc = htmlEscape(newDescription);

  next = next.replace(META_REGEXES.title, `<title>${escBranded}</title>`);
  next = next.replace(META_REGEXES.metaDescription, (_m, pre: string, _old: string, post: string) => `${pre}${escDesc}${post}`);
  next = next.replace(META_REGEXES.ogTitle, (_m, pre: string, _old: string, post: string) => `${pre}${escBranded}${post}`);
  next = next.replace(META_REGEXES.ogDescription, (_m, pre: string, _old: string, post: string) => `${pre}${escDesc}${post}`);
  next = next.replace(META_REGEXES.twitterTitle, (_m, pre: string, _old: string, post: string) => `${pre}${escBranded}${post}`);
  next = next.replace(META_REGEXES.twitterDescription, (_m, pre: string, _old: string, post: string) => `${pre}${escDesc}${post}`);
  next = next.replace(META_REGEXES.ogImageAlt, (_m, pre: string, _old: string, post: string) => `${pre}Riksdagsmonitor ${escTitle}${post}`);
  next = next.replace(META_REGEXES.twitterImageAlt, (_m, pre: string, _old: string, post: string) => `${pre}Riksdagsmonitor ${escTitle}${post}`);

  next = next.replace(META_REGEXES.jsonLd, (whole: string, body: string) => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(body.trim()) as Record<string, unknown>;
    } catch {
      return whole;
    }
    if (typeof parsed['@type'] === 'string' && /NewsArticle/i.test(parsed['@type'] as string)) {
      parsed.headline = newTitle;
      parsed.description = newDescription;
      if (Object.prototype.hasOwnProperty.call(parsed, 'alternativeHeadline')) {
        parsed.alternativeHeadline = newTitle;
      }
    }
    return `<script type="application/ld+json">${JSON.stringify(parsed)}</script>`;
  });

  if (next === html) {
    return {
      outcome: {
        file: filePath,
        changed: false,
        reasons: [...reasons, 'no-change-after-rewrite'],
        beforeTitle: docTitleText,
        afterTitle: docTitleText,
        beforeDescription: richestCurrentDescription,
        afterDescription: richestCurrentDescription,
      },
      nextHtml: null,
    };
  }

  return {
    outcome: {
      file: filePath,
      changed: true,
      reasons,
      beforeTitle: docTitleText,
      afterTitle: newTitle,
      beforeDescription: richestCurrentDescription,
      afterDescription: newDescription,
    },
    nextHtml: next,
  };
}
