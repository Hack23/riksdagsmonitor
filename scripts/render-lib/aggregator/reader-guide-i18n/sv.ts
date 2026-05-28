/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/SV
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — Swedish bundle
 *
 * @description
 * Swedish translations for the Reader Intelligence Guide
 * chrome (heading, preamble, column headers) and per-entry label /
 * readerValue strings. Exports `CHROME` and `ENTRIES`; the barrel
 * `./index.ts` composes the 14 bundles into `READER_GUIDE_I18N`.
 *
 * Translation guide: https://github.com/Hack23/homepage/blob/main/Swedish-Translation-Guide.md
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { ReaderGuideChrome, ReaderGuideEntryI18n } from './types.js';

export const CHROME: ReaderGuideChrome = {
  heading: 'Läsarens underrättelseguide',
  preamble: 'Använd denna guide för att läsa artikeln som en politisk underrättelseprodukt snarare än en rå artefaktsamling. Högt värde för läsaren visas först; teknisk härkomst finns i revisionsappendixet.',
  colReaderNeed: 'Läsarbehov',
  colWhatYouGet: 'Vad du får',
  perDocLabel: 'Dokumentspecifik underrättelse',
  perDocValue: 'dok_id-nivå bevisning, namngivna aktörer, datum och primärkällspårbarhet',
  auditLabel: 'Revisionsappendix',
  auditValue: 'klassificering, korsreferens, metodik och manifestbevisning för granskare',
  colIcon: 'Ikon',
  defaultReaderValue: 'stödjande analytisk lins med primärkällsbevisning och spårbara citat',
};

export const ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'Ingress och redaktionella beslut',
    readerValue: 'snabbt svar på vad som hände, varför det spelar roll, vem som är ansvarig och nästa daterade utlösare',
  },
  'intelligence-assessment.md': {
    label: 'Nyckelbedömningar',
    readerValue: 'konfidensgrundade politisk-underrättelse slutsatser och insamlingsgap',
  },
  'significance-scoring.md': {
    label: 'Betydelsepoängsättning',
    readerValue: 'varför denna nyhet rangordnas högre eller lägre än andra parlamentariska signaler samma dag',
  },
  'media-framing-analysis.md': {
    label: 'Mediegestaltning och påverkansoperationer',
    readerValue: 'gestaltningspaket med Entman-funktioner, kognitiv sårbarhetsanalys, DISARM-indikatorer och motståndskraftsstege L1–L5',
  },
  'forward-indicators.md': {
    label: 'Framåtblickande indikatorer',
    readerValue: 'daterade bevakningspunkter som låter läsare verifiera eller falsifiera bedömningen senare',
  },
  'scenario-analysis.md': {
    label: 'Scenarier',
    readerValue: 'alternativa utfall med sannolikheter, utlösare och varningssignaler',
  },
  'risk-assessment.md': {
    label: 'Riskbedömning',
    readerValue: 'policy-, val-, institutionell-, kommunikations- och implementeringsriskregister',
  },
};
