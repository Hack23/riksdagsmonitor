#!/usr/bin/env tsx
/**
 * @module pre-article-analysis
 * @description Pre-article data download and deep analysis pipeline.
 *
 * Orchestrates all analysis steps before article generation:
 * 1. Download all relevant parliamentary documents from riksdag-regering-mcp
 * 2. Political classification — Classify each document by significance, impact, domain
 * 3. Risk assessment — Assess political risks (coalition stability, anomaly detection)
 * 4. SWOT analysis — Generate political SWOT for relevant actors
 * 5. Threat analysis — Identify threats from SWOT contributions
 * 6. Stakeholder perspective analysis — Run all 6 lenses
 * 7. Significance scoring — Score all documents (0–10)
 * 8. Cross-reference mapping — Identify relationships between documents
 * 9. Synthesis — Combined analysis summary integrating all methods
 * 10. Per-document analysis — Individual analysis files per document
 * 11. Persist — Write structured markdown to analysis/daily/YYYY-MM-DD/[doctype/]
 *
 * Usage:
 *   npx tsx scripts/pre-article-analysis.ts [--date YYYY-MM-DD] [--limit N] [--doctype TYPE]
 *   npx tsx scripts/pre-article-analysis.ts --aggregate weekly [--date YYYY-WNN]
 *
 * Document types: propositions, motions, committee-reports, votes, speeches, questions, interpellations, all
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MCPClient } from './mcp-client/client.js';
import { analyzeDocuments } from './analysis-framework/index.js';
import { calculateCoalitionRiskIndex, detectAnomalousPatterns } from './data-transformers/risk-analysis.js';
import type { RawDocument, CIAContext } from './data-transformers/types.js';
import { loadCIAContext } from './news-types/weekly-review/index.js';
import { normalizedCIAContext } from './news-types/weekly-review/data-loader.js';

import {
  downloadAllDocuments,
  flattenDocuments,
} from './pre-article-analysis/data-downloader.js';

import type {
  DocType,
} from './pre-article-analysis/data-downloader.js';

import {
  VALID_DOC_TYPES,
} from './pre-article-analysis/data-downloader.js';

import type {
  SerializationContext,
  SignificanceEntry,
  RiskAssessmentResult,
  SwotSummary,
  CrossReferenceSummary,
  SynthesisSummary,
} from './pre-article-analysis/markdown-serializer.js';

import {
  serializeDataManifest,
  serializeClassificationResults,
  serializeRiskAssessment,
  serializeSwotAnalysis,
  serializeThreatAnalysis,
  serializeStakeholderPerspectives,
  serializeSignificanceScoring,
  serializeCrossReferenceMap,
  serializeSynthesisSummary,
  serializePerDocumentAnalysis,
} from './pre-article-analysis/markdown-serializer.js';
