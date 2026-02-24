/**
 * @module generate-news-enhanced/types
 * @description Local type definitions for the enhanced news generation system.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';

export interface TitleSet {
  title: string;
  subtitle: string;
}

export interface BatchStatus {
  complete: boolean;
  completedLanguages?: string[];
  remainingLanguages?: string[];
  allRequestedLanguages?: string[];
  allDone?: string[];
  timestamp: string;
}

export interface LastGenerationMetadata {
  timestamp: string;
  types: string[];
  languagesGenerated: Language[];
  allRequestedLanguages: Language[];
  batchSize: number | string;
  skipExisting: boolean;
  generated: number;
  errors: number;
  articles: string[];
  status: string;
  note: string;
}
