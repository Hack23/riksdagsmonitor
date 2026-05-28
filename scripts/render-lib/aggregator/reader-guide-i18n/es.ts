/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/ES
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — Spanish bundle
 *
 * @description
 * Spanish translations for the Reader Intelligence Guide
 * chrome (heading, preamble, column headers) and per-entry label /
 * readerValue strings. Exports `CHROME` and `ENTRIES`; the barrel
 * `./index.ts` composes the 14 bundles into `READER_GUIDE_I18N`.
 *
 * Translation guide: https://github.com/Hack23/homepage/blob/main/Spanish-Translation-Guide.md
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { ReaderGuideChrome, ReaderGuideEntryI18n } from './types.js';

export const CHROME: ReaderGuideChrome = {
  heading: 'Guía de inteligencia del lector',
  preamble: 'Use esta guía para leer el artículo como un producto de inteligencia política en lugar de una colección bruta de artefactos. Las perspectivas de alto valor aparecen primero; la procedencia técnica está disponible en el apéndice de auditoría.',
  colReaderNeed: 'Necesidad del lector',
  colWhatYouGet: 'Lo que obtendrá',
  perDocLabel: 'Inteligencia por documento',
  perDocValue: 'evidencia a nivel de dok_id, actores nombrados, fechas y trazabilidad de fuente primaria',
  auditLabel: 'Apéndice de auditoría',
  auditValue: 'clasificación, referencias cruzadas, metodología y evidencia manifiesta para revisores',
  colIcon: 'Icono',
  defaultReaderValue: 'lente analítica de apoyo con evidencia de fuente primaria y citas trazables',
};

export const ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'Entradilla y decisiones editoriales',
    readerValue: 'respuesta rápida sobre qué sucedió, por qué importa, quién es responsable y el próximo disparador fechado',
  },
  'intelligence-assessment.md': {
    label: 'Juicios clave',
    readerValue: 'conclusiones de inteligencia política con nivel de confianza y brechas de recopilación',
  },
  'significance-scoring.md': {
    label: 'Puntuación de significancia',
    readerValue: 'por qué esta noticia se clasifica más alto o más bajo que otras señales parlamentarias del mismo día',
  },
  'media-framing-analysis.md': {
    label: 'Encuadre mediático y operaciones de influencia',
    readerValue: 'paquetes de encuadre con funciones Entman, mapa de vulnerabilidad cognitiva e indicadores DISARM',
  },
  'forward-indicators.md': {
    label: 'Indicadores prospectivos',
    readerValue: 'puntos de vigilancia fechados que permiten a los lectores verificar o falsificar la evaluación posteriormente',
  },
  'scenario-analysis.md': {
    label: 'Escenarios',
    readerValue: 'resultados alternativos con probabilidades, disparadores y señales de advertencia',
  },
  'risk-assessment.md': {
    label: 'Evaluación de riesgos',
    readerValue: 'registro de riesgos de política, electorales, institucionales, de comunicación y de implementación',
  },
};
