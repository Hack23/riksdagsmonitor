/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/FR
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — French bundle
 *
 * @description
 * French translations for the Reader Intelligence Guide
 * chrome (heading, preamble, column headers) and per-entry label /
 * readerValue strings. Exports `CHROME` and `ENTRIES`; the barrel
 * `./index.ts` composes the 14 bundles into `READER_GUIDE_I18N`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { ReaderGuideChrome, ReaderGuideEntryI18n } from './types.js';

export const CHROME: ReaderGuideChrome = {
  heading: 'Guide de renseignement du lecteur',
  preamble: "Utilisez ce guide pour lire l'article comme un produit de renseignement politique plutôt qu'une collection brute d'artefacts. Les perspectives à haute valeur apparaissent en premier ; la provenance technique est disponible dans l'annexe d'audit.",
  colReaderNeed: 'Besoin du lecteur',
  colWhatYouGet: 'Ce que vous obtenez',
  perDocLabel: 'Renseignement par document',
  perDocValue: "preuve au niveau dok_id, acteurs nommés, dates et traçabilité de la source primaire",
  auditLabel: "Annexe d'audit",
  auditValue: "classification, références croisées, méthodologie et preuve manifeste pour les réviseurs",
  colIcon: 'Icône',
  defaultReaderValue: 'lentille analytique de soutien avec preuves de source primaire et citations traçables',
};

export const ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'Lede et décisions éditoriales',
    readerValue: "réponse rapide sur ce qui s'est passé, pourquoi c'est important, qui est responsable et le prochain déclencheur daté",
  },
  'intelligence-assessment.md': {
    label: 'Jugements clés',
    readerValue: 'conclusions de renseignement politique avec niveau de confiance et lacunes de collecte',
  },
  'significance-scoring.md': {
    label: 'Score de significativité',
    readerValue: 'pourquoi cette information est classée plus haut ou plus bas que les autres signaux parlementaires du même jour',
  },
  'media-framing-analysis.md': {
    label: 'Cadrage médiatique et opérations d\'influence',
    readerValue: "paquets de cadrage avec fonctions Entman, carte de vulnérabilité cognitive et indicateurs DISARM",
  },
  'forward-indicators.md': {
    label: 'Indicateurs prospectifs',
    readerValue: "points de surveillance datés permettant aux lecteurs de vérifier ou falsifier l'évaluation ultérieurement",
  },
  'scenario-analysis.md': {
    label: 'Scénarios',
    readerValue: 'résultats alternatifs avec probabilités, déclencheurs et signaux d\'alerte',
  },
  'risk-assessment.md': {
    label: 'Évaluation des risques',
    readerValue: 'registre des risques politiques, électoraux, institutionnels, de communication et de mise en œuvre',
  },
};
