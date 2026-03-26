/**
 * @module pre-article-analysis
 * @description Barrel re-export for the pre-article analysis pipeline.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export { downloadAllDocuments, flattenDocuments } from './data-downloader.js';
export type { DownloadedData, DownloadManifest, DownloadResult } from './data-downloader.js';

export {
  serializeDataManifest,
  serializeClassificationResults,
  serializeRiskAssessment,
  serializeSwotAnalysis,
  serializeThreatAnalysis,
  serializeStakeholderPerspectives,
  serializeSignificanceScoring,
  serializeCrossReferenceMap,
  serializeSynthesisSummary,
} from './markdown-serializer.js';

export type {
  SerializationContext,
  SignificanceEntry,
  RiskAssessmentResult,
  SwotSummary,
  CrossReferenceSummary,
  SynthesisSummary,
} from './markdown-serializer.js';
