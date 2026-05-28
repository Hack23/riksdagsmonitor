/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/DA
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — Danish bundle
 *
 * @description
 * Danish translations for the Reader Intelligence Guide
 * chrome (heading, preamble, column headers) and per-entry label /
 * readerValue strings. Exports `CHROME` and `ENTRIES`; the barrel
 * `./index.ts` composes the 14 bundles into `READER_GUIDE_I18N`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { ReaderGuideChrome, ReaderGuideEntryI18n } from './types.js';

export const CHROME: ReaderGuideChrome = {
  heading: 'Læserens efterretningsguide',
  preamble: 'Brug denne guide til at læse artiklen som et politisk efterretningsprodukt frem for en rå artefaktsamling. Højværdi-læserperspektiver vises først; teknisk oprindelse er tilgængelig i revisionsappendiksset.',
  colReaderNeed: 'Læserbehov',
  colWhatYouGet: 'Hvad du får',
  perDocLabel: 'Dokumentspecifik efterretning',
  perDocValue: 'dok_id-niveau bevismateriale, navngivne aktører, datoer og primærkildesporing',
  auditLabel: 'Revisionsappendiks',
  auditValue: 'klassifikation, krydsreference, metodik og manifest-bevismateriale til anmeldere',
  colIcon: 'Ikon',
  defaultReaderValue: 'støttende analytisk linse med primærkildebevis og sporbare citater',
};

export const ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'Lede og redaktionelle beslutninger',
    readerValue: 'hurtigt svar på hvad der skete, hvorfor det betyder noget, hvem der er ansvarlig, og den næste daterede udløser',
  },
  'intelligence-assessment.md': {
    label: 'Nøglevurderinger',
    readerValue: 'konfidensbærende politisk-efterretningskonklusioner og indsamlingshuller',
  },
  'significance-scoring.md': {
    label: 'Betydelighedsscoring',
    readerValue: 'hvorfor denne historie rangerer højere eller lavere end andre parlamentariske signaler samme dag',
  },
  'media-framing-analysis.md': {
    label: 'Medieframing og påvirkningsoperationer',
    readerValue: 'framingpakker med Entman-funktioner, kognitivsårbarheds-kort og DISARM-indikatorer',
  },
  'forward-indicators.md': {
    label: 'Fremadrettede indikatorer',
    readerValue: 'daterede overvågningspunkter der lader læsere verificere eller falsificere vurderingen senere',
  },
  'scenario-analysis.md': {
    label: 'Scenarier',
    readerValue: 'alternative udfald med sandsynligheder, udløsere og advarselstegn',
  },
  'risk-assessment.md': {
    label: 'Risikovurdering',
    readerValue: 'politik-, valg-, institutionelt-, kommunikations- og implementeringsrisikoregister',
  },
};
