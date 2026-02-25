/**
 * @module pipeline
 * @description Barrel re-export for the content pipeline module.
 *
 * Public API:
 * - Types: `ContentPipeline`, `PipelineOptions`, `PipelineResult`,
 *          `OrchestratorConfig`, `OrchestratorResult`, `PipelineStage`
 * - Class: `PipelineOrchestrator`
 * - Validation: `validateArticleHTML`, `validateArticleBatch`,
 *               `ArticleValidationResult`, `ValidationOptions`
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export type {
  ContentPipeline,
  PipelineOptions,
  PipelineResult,
  PipelineStage,
  OrchestratorConfig,
  OrchestratorResult,
} from './types.js';

export { PipelineOrchestrator } from './orchestrator.js';

export type {
  ArticleValidationResult,
  ValidationOptions,
} from './validation.js';

export { validateArticleHTML, validateArticleBatch } from './validation.js';
