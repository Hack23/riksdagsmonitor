/**
 * @module rewrite-article-metadata/violations
 * @description Contract violation detector (subset sufficient for rewrite
 * decisions per `.github/prompts/seo-metadata-contract.md`).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { __test__ } from '../render-lib/aggregator/index.js';

import type { LangBudget } from './budget.js';
import { BANNED_PHRASES } from './html.js';

const { ADMIN_FIELD_RE, ADMIN_FRAGMENT_SPLITTER } = __test__;

export interface ViolationSet {
  adminInDescription: boolean;
  brandInDocTitle: boolean;
  doubleBrandOgOrTwitter: boolean;
  executiveBriefPrefix: boolean;
  isoDateInTitle: boolean;
  descriptionTooShort: boolean;
  descriptionTooLong: boolean;
  titleTooLong: boolean;
  midWordDescriptionCut: boolean;
  genericFiller: boolean;
  bannedPhraseInDescription: boolean;
}

export function detectViolations(
  titleText: string,
  description: string,
  ogTitleText: string,
  twitterTitleText: string,
  budget: LangBudget,
): ViolationSet {
  const adminInDescription = (() => {
    const fragments = description.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    return fragments.some((f) => ADMIN_FIELD_RE.test(f.trim()));
  })();

  const isoDateInTitle = /\b\d{4}-\d{2}-\d{2}\b/.test(titleText);
  const executiveBriefPrefix = /^\s*Executive Brief\s*[—-]/i.test(titleText) ||
    /^\s*Realtime Monitor\s*[—-]/i.test(titleText);
  const brandInDocTitle = /\bRiksdagsmonitor\b/i.test(titleText);
  const doubleBrandOgOrTwitter =
    /Riksdagsmonitor.*Riksdagsmonitor/i.test(ogTitleText) ||
    /Riksdagsmonitor.*Riksdagsmonitor/i.test(twitterTitleText);

  const descriptionTooShort = description.trim().length < budget.descMin;
  const descriptionTooLong = description.trim().length > budget.descHardMax + 30;
  const titleTooLong = titleText.trim().length > budget.titleMax + 50;

  const midWordDescriptionCut = /[a-zåäöøæéèüñç]$/i.test(description.trim()) &&
    description.length >= 120;

  const genericFiller = /AI[- ]generated\s+political\s+intelligence/i.test(description);
  const bannedPhraseInDescription = BANNED_PHRASES.some((re) => re.test(description));

  return {
    adminInDescription,
    brandInDocTitle,
    doubleBrandOgOrTwitter,
    executiveBriefPrefix,
    isoDateInTitle,
    descriptionTooShort,
    descriptionTooLong,
    titleTooLong,
    midWordDescriptionCut,
    genericFiller,
    bannedPhraseInDescription,
  };
}

export function needsRewrite(v: ViolationSet): boolean {
  return (
    v.adminInDescription ||
    v.doubleBrandOgOrTwitter ||
    v.executiveBriefPrefix ||
    v.isoDateInTitle ||
    v.descriptionTooLong ||
    v.titleTooLong ||
    v.midWordDescriptionCut ||
    v.genericFiller ||
    v.bannedPhraseInDescription
  );
}
