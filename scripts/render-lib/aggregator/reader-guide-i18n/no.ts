/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/NO
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — Norwegian (BCP-47 `nb`; file kept as `no.ts` for legacy compatibility) bundle
 *
 * @description
 * Norwegian (BCP-47 `nb`; file kept as `no.ts` for legacy compatibility) translations for the Reader Intelligence Guide
 * chrome (heading, preamble, column headers) and per-entry label /
 * readerValue strings. Exports `CHROME` and `ENTRIES`; the barrel
 * `./index.ts` composes the 14 bundles into `READER_GUIDE_I18N`.
 *
 * NOTE: Norwegian uses BCP-47 code `nb` (Norsk Bokmål). This file is
 * kept as `no.ts` for legacy compatibility with the existing `Language`
 * union; the rendered `lang` attribute follows `LANGUAGE_META`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { ReaderGuideChrome, ReaderGuideEntryI18n } from './types.js';

export const CHROME: ReaderGuideChrome = {
  heading: 'Leserens etterretningsguide',
  preamble: 'Bruk denne guiden for å lese artikkelen som et politisk etterretningsprodukt i stedet for en rå artefaktsamling. Høyverdiperspektiver for leseren vises først; teknisk opprinnelse er tilgjengelig i revisjonsvedlegget.',
  colReaderNeed: 'Leserbehov',
  colWhatYouGet: 'Hva du får',
  perDocLabel: 'Dokumentspesifikk etterretning',
  perDocValue: 'dok_id-nivå bevis, navngitte aktører, datoer og primærkildesporing',
  auditLabel: 'Revisjonsvedlegg',
  auditValue: 'klassifisering, kryssreferanse, metodikk og manifest-bevis for anmeldere',
  colIcon: 'Ikon',
  defaultReaderValue: 'støttende analytisk linse med primærkildebevis og sporbare sitater',
};

export const ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'Ingress og redaksjonelle beslutninger',
    readerValue: 'raskt svar på hva som skjedde, hvorfor det betyr noe, hvem som er ansvarlig og neste daterte utløser',
  },
  'intelligence-assessment.md': {
    label: 'Nøkkelvurderinger',
    readerValue: 'konfidensbærende politisk-etterretningskonklusjoner og innsamlingshull',
  },
  'significance-scoring.md': {
    label: 'Betydelighetsscoring',
    readerValue: 'hvorfor denne saken rangerer høyere eller lavere enn andre parlamentariske signaler samme dag',
  },
  'media-framing-analysis.md': {
    label: 'Medieframing og påvirkningsoperasjoner',
    readerValue: 'framingpakker med Entman-funksjoner, kognitivsårbarhets-kart og DISARM-indikatorer',
  },
  'forward-indicators.md': {
    label: 'Fremadrettede indikatorer',
    readerValue: 'daterte overvåkningspunkter som lar lesere verifisere eller falsifisere vurderingen senere',
  },
  'scenario-analysis.md': {
    label: 'Scenarier',
    readerValue: 'alternative utfall med sannsynligheter, utløsere og advarselstegn',
  },
  'risk-assessment.md': {
    label: 'Risikovurdering',
    readerValue: 'politikk-, valg-, institusjons-, kommunikasjons- og implementeringsrisikoregister',
  },
};
