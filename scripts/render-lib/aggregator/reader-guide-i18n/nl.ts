/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/NL
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — Dutch bundle
 *
 * @description
 * Dutch translations for the Reader Intelligence Guide
 * chrome (heading, preamble, column headers) and per-entry label /
 * readerValue strings. Exports `CHROME` and `ENTRIES`; the barrel
 * `./index.ts` composes the 14 bundles into `READER_GUIDE_I18N`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { ReaderGuideChrome, ReaderGuideEntryI18n } from './types.js';

export const CHROME: ReaderGuideChrome = {
  heading: 'Inlichtingengids voor de lezer',
  preamble: 'Gebruik deze gids om het artikel te lezen als een politiek inlichtingenproduct in plaats van een ruwe artefactverzameling. Perspectieven met hoge waarde verschijnen eerst; technische herkomst is beschikbaar in de auditbijlage.',
  colReaderNeed: 'Lezersbehoefte',
  colWhatYouGet: 'Wat u krijgt',
  perDocLabel: 'Documentspecifieke inlichtingen',
  perDocValue: 'bewijs op dok_id-niveau, benoemde actoren, datums en traceerbaarheid van primaire bron',
  auditLabel: 'Auditbijlage',
  auditValue: 'classificatie, kruisverwijzingen, methodologie en manifest-bewijs voor beoordelaars',
  colIcon: 'Pictogram',
  defaultReaderValue: 'ondersteunende analytische lens met primaire-bron bewijs en traceerbare citaten',
};

export const ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'Lede en redactionele beslissingen',
    readerValue: 'snel antwoord op wat er gebeurde, waarom het ertoe doet, wie verantwoordelijk is en de volgende gedateerde trigger',
  },
  'intelligence-assessment.md': {
    label: 'Kernbeoordelingen',
    readerValue: 'op vertrouwen gebaseerde politiek-inlichtingenconclusies en verzamelingshiaten',
  },
  'significance-scoring.md': {
    label: 'Significantiescoring',
    readerValue: 'waarom dit verhaal hoger of lager gerangschikt is dan andere parlementaire signalen van dezelfde dag',
  },
  'media-framing-analysis.md': {
    label: 'Mediaframing en beïnvloedingsoperaties',
    readerValue: 'framingpakketten met Entman-functies, cognitieve kwetsbaarheidskaart en DISARM-indicatoren',
  },
  'forward-indicators.md': {
    label: 'Toekomstgerichte indicatoren',
    readerValue: 'gedateerde bewakingspunten waarmee lezers de beoordeling later kunnen verifiëren of weerleggen',
  },
  'scenario-analysis.md': {
    label: "Scenario's",
    readerValue: 'alternatieve uitkomsten met waarschijnlijkheden, triggers en waarschuwingssignalen',
  },
  'risk-assessment.md': {
    label: 'Risicobeoordeling',
    readerValue: 'register van beleids-, verkiezings-, institutionele, communicatie- en implementatierisico\'s',
  },
};
