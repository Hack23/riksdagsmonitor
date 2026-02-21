/**
 * @module Types/Editorial
 * @description Editorial pillar types for the five-pillar analysis framework.
 */

import type { Language } from './language.js';

/** The four content pillars used in evening analysis articles (plus the lead paragraph) */
export type EditorialPillar =
  | 'parliamentaryPulse'
  | 'governmentWatch'
  | 'oppositionDynamics'
  | 'lookingAhead';

/** Localized heading strings for all four editorial pillars */
export interface PillarHeadings {
  parliamentaryPulse: string;
  governmentWatch: string;
  oppositionDynamics: string;
  lookingAhead: string;
}

/** Full set of pillar headings for all 14 supported languages */
export type LocalizedPillarHeadings = Record<Language, PillarHeadings>;
