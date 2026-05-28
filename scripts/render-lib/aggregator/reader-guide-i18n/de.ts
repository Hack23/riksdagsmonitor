/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/DE
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — German bundle
 *
 * @description
 * German translations for the Reader Intelligence Guide
 * chrome (heading, preamble, column headers) and per-entry label /
 * readerValue strings. Exports `CHROME` and `ENTRIES`; the barrel
 * `./index.ts` composes the 14 bundles into `READER_GUIDE_I18N`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { ReaderGuideChrome, ReaderGuideEntryI18n } from './types.js';

export const CHROME: ReaderGuideChrome = {
  heading: 'Nachrichtendienstlicher Leseleitfaden',
  preamble: 'Nutzen Sie diesen Leitfaden, um den Artikel als nachrichtendienstliches Produkt statt als rohe Artefaktsammlung zu lesen. Hochwertige Leseperspektiven erscheinen zuerst; technische Herkunft ist im Prüfungsanhang verfügbar.',
  colReaderNeed: 'Leserbedarf',
  colWhatYouGet: 'Was Sie erhalten',
  perDocLabel: 'Dokumentspezifische Analyse',
  perDocValue: 'dok_id-Ebene Beweismaterial, benannte Akteure, Daten und Primärquellenrückverfolgbarkeit',
  auditLabel: 'Prüfungsanhang',
  auditValue: 'Klassifizierung, Querverweise, Methodik und Manifest-Beweismaterial für Prüfer',
  colIcon: 'Symbol',
  defaultReaderValue: 'unterstützende analytische Linse mit Primärquellenbeweisen und nachvollziehbaren Zitaten',
};

export const ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'Lede und redaktionelle Entscheidungen',
    readerValue: 'schnelle Antwort auf was geschah, warum es wichtig ist, wer verantwortlich ist und der nächste datierte Auslöser',
  },
  'intelligence-assessment.md': {
    label: 'Kernbewertungen',
    readerValue: 'konfidenzbasierte nachrichtendienstliche Schlussfolgerungen und Erfassungslücken',
  },
  'significance-scoring.md': {
    label: 'Bedeutungsbewertung',
    readerValue: 'warum diese Meldung höher oder niedriger eingestuft wird als andere parlamentarische Signale desselben Tages',
  },
  'media-framing-analysis.md': {
    label: 'Medienrahmung und Einflussoperationen',
    readerValue: 'Rahmungspakete mit Entman-Funktionen, kognitive Schwachstellenkarte und DISARM-Indikatoren',
  },
  'forward-indicators.md': {
    label: 'Vorausschauende Indikatoren',
    readerValue: 'datierte Beobachtungspunkte, mit denen Leser die Bewertung später verifizieren oder falsifizieren können',
  },
  'scenario-analysis.md': {
    label: 'Szenarien',
    readerValue: 'alternative Ergebnisse mit Wahrscheinlichkeiten, Auslösern und Warnsignalen',
  },
  'risk-assessment.md': {
    label: 'Risikobewertung',
    readerValue: 'Politik-, Wahl-, institutionelles, Kommunikations- und Umsetzungsrisikoregister',
  },
};
