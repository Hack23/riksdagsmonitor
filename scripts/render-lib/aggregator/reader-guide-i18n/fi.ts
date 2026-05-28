/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/FI
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — Finnish bundle
 *
 * @description
 * Finnish translations for the Reader Intelligence Guide
 * chrome (heading, preamble, column headers) and per-entry label /
 * readerValue strings. Exports `CHROME` and `ENTRIES`; the barrel
 * `./index.ts` composes the 14 bundles into `READER_GUIDE_I18N`.
 *
 * Translation guide: https://github.com/Hack23/homepage/blob/main/Finnish-Translation-Guide.md
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { ReaderGuideChrome, ReaderGuideEntryI18n } from './types.js';

export const CHROME: ReaderGuideChrome = {
  heading: 'Lukijan tiedusteluopas',
  preamble: 'Käytä tätä opasta lukeaksesi artikkelin poliittisena tiedustelutuotteena raa\'an artefaktikokoelman sijaan. Korkean arvon lukijanäkökulmat esitetään ensin; tekninen alkuperä on saatavilla tarkastusliitteessä.',
  colReaderNeed: 'Lukijan tarve',
  colWhatYouGet: 'Mitä saat',
  perDocLabel: 'Dokumenttikohtainen tiedustelu',
  perDocValue: 'dok_id-tason todistusaineisto, nimetyt toimijat, päivämäärät ja alkuperäislähteen jäljitettävyys',
  auditLabel: 'Tarkastusliite',
  auditValue: 'luokitus, ristiviittaus, metodologia ja manifest-todistusaineisto tarkastajille',
  colIcon: 'Kuvake',
  defaultReaderValue: 'tukeva analyyttinen näkökulma ensisijaislähde-todisteilla ja jäljitettävillä viittauksilla',
};

export const ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'Ingressi ja toimitukselliset päätökset',
    readerValue: 'nopea vastaus siihen mitä tapahtui, miksi sillä on väliä, kuka on vastuussa ja seuraava päivätty laukaisin',
  },
  'intelligence-assessment.md': {
    label: 'Keskeiset arviot',
    readerValue: 'luottamustasoon perustuvat poliittis-tiedustelulliset johtopäätökset ja tiedonkeruuaukot',
  },
  'significance-scoring.md': {
    label: 'Merkittävyyspisteytys',
    readerValue: 'miksi tämä juttu sijoittuu korkeammalle tai matalammalle kuin muut saman päivän parlamentaariset signaalit',
  },
  'media-framing-analysis.md': {
    label: 'Mediakehystys ja vaikutusoperaatiot',
    readerValue: 'kehyspaketit Entman-funktioilla, kognitiivisen haavoittuvuuden kartta ja DISARM-indikaattorit',
  },
  'forward-indicators.md': {
    label: 'Tulevaisuusindikaattorit',
    readerValue: 'päivätyt seurantakohteet, joiden avulla lukijat voivat myöhemmin todentaa tai kumota arvion',
  },
  'scenario-analysis.md': {
    label: 'Skenaariot',
    readerValue: 'vaihtoehtoiset lopputulokset todennäköisyyksineen, laukaisimineen ja varoitusmerkkeineen',
  },
  'risk-assessment.md': {
    label: 'Riskiarvio',
    readerValue: 'politiikka-, vaali-, institutionaalinen, viestintä- ja toimeenpanoriskien rekisteri',
  },
};
