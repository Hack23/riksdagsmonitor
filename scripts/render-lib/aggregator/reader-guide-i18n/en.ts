/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/EN
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — English (source of truth) bundle
 *
 * @description
 * English (source of truth) translations for the Reader Intelligence Guide
 * chrome (heading, preamble, column headers) and per-entry label /
 * readerValue strings. Exports `CHROME` and `ENTRIES`; the barrel
 * `./index.ts` composes the 14 bundles into `READER_GUIDE_I18N`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { ReaderGuideChrome, ReaderGuideEntryI18n } from './types.js';

export const CHROME: ReaderGuideChrome = {
  heading: 'Reader Intelligence Guide',
  preamble: 'Use this guide to read the article as a political-intelligence product rather than a raw artifact dump. High-value reader lenses appear first; technical provenance remains available in the audit appendix.',
  colReaderNeed: 'Reader need',
  colWhatYouGet: "What you'll get",
  perDocLabel: 'Per-document intelligence',
  perDocValue: 'dok_id-level evidence, named actors, dates, and primary-source traceability',
  auditLabel: 'Audit appendix',
  auditValue: 'classification, cross-reference, methodology and manifest evidence for reviewers',
  colIcon: 'Icon',
  defaultReaderValue: 'supporting analytical lens with primary-source evidence and audit-traceable citations',
};

export const ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'Lede and editorial decisions',
    readerValue: 'fast answer to what happened, why it matters, who is accountable, and the next dated trigger',
  },
  'intelligence-assessment.md': {
    label: 'Key Judgments',
    readerValue: 'confidence-bearing political-intelligence conclusions and collection gaps',
  },
  'significance-scoring.md': {
    label: 'Significance scoring',
    readerValue: 'why this story outranks or trails other same-day parliamentary signals',
  },
  'media-framing-analysis.md': {
    label: 'Media framing & influence operations',
    readerValue: 'frame packages with Entman functions, cognitive-vulnerability map, DISARM manipulation indicators, narrative-laundering chain, comparative-international cognates, frame lifecycle and half-life, RRPA impact, an Outlet Bias Audit (no outlet is neutral — every outlet declared with ownership, funding, board-appointment authority and editorial lean), and the L1–L5 counter-resilience ladder',
  },
  'forward-indicators.md': {
    label: 'Forward indicators',
    readerValue: 'dated watch items that let readers verify or falsify the assessment later',
  },
  'scenario-analysis.md': {
    label: 'Scenarios',
    readerValue: 'alternative outcomes with probabilities, triggers, and warning signs',
  },
  'risk-assessment.md': {
    label: 'Risk assessment',
    readerValue: 'policy, electoral, institutional, communications, and implementation risk register',
  },
};
