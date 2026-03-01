/**
 * @module data-transformers/constants/committee-names
 * @description Swedish Riksdag committee code to full name mapping.
 * Provides English and Swedish names for all 15 standing committees.
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
