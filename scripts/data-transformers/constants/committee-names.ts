/**
 * @module data-transformers/constants/committee-names
 * @description Swedish Riksdag committee code to full name mapping.
 * Provides English and Swedish names for all 15 standing committees,
 * plus a committee→policy-domain mapping used as the primary classifier.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { CommitteeNameMap } from '../../types/content.js';

/**
 * Map Swedish committee codes to full names for richer descriptions.
 * Uses "Committee on [Subject]" English naming convention.
 */
export const COMMITTEE_NAMES: CommitteeNameMap = {
  AU: { en: 'Committee on Labour Market Affairs', sv: 'Arbetsmarknadsutskottet' },
  CU: { en: 'Committee on Civil Affairs', sv: 'Civilutskottet' },
  FiU: { en: 'Committee on Finance', sv: 'Finansutskottet' },
  FöU: { en: 'Committee on Defence', sv: 'Försvarsutskottet' },
  JuU: { en: 'Committee on Justice', sv: 'Justitieutskottet' },
  KU: { en: 'Committee on the Constitution', sv: 'Konstitutionsutskottet' },
  KrU: { en: 'Committee on Cultural Affairs', sv: 'Kulturutskottet' },
  MJU: { en: 'Committee on Environment and Agriculture', sv: 'Miljö- och jordbruksutskottet' },
  NU: { en: 'Committee on Industry and Trade', sv: 'Näringsutskottet' },
  SkU: { en: 'Committee on Taxation', sv: 'Skatteutskottet' },
  SfU: { en: 'Committee on Social Insurance', sv: 'Socialförsäkringsutskottet' },
  SoU: { en: 'Committee on Social Affairs', sv: 'Socialutskottet' },
  TU: { en: 'Committee on Transport', sv: 'Trafikutskottet' },
  UbU: { en: 'Committee on Education', sv: 'Utbildningsutskottet' },
  UU: { en: 'Committee on Foreign Affairs', sv: 'Utrikesutskottet' },
};

/**
 * Authoritative mapping from Riksdag committee code to policy domain key.
 * This is the **primary** classifier — committee codes are the canonical
 * indicator of policy domain in the Swedish parliamentary system.
 * Keyword-based heuristics should only be used as a fallback when committee
 * code is unavailable.
 *
 * Domain keys correspond to the `DomainKey` union in policy-analysis.ts.
 */
export const COMMITTEE_TO_DOMAIN: Readonly<Record<string, string>> = {
  AU: 'labour',
  CU: 'housing',
  FiU: 'fiscal',
  FöU: 'defence',
  JuU: 'justice',
  KU: 'constitutional',
  KrU: 'culture',
  MJU: 'environment',
  NU: 'trade',
  SkU: 'fiscal',
  SfU: 'social-insurance',
  SoU: 'healthcare',
  TU: 'transport',
  UbU: 'education',
  UU: 'eu-foreign',
};
