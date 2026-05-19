/**
 * @module normalize-static-html-chrome/constants
 * @description Shared constants and types for the chrome normalizer.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Language } from '../types/language.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.join(__dirname, '..', '..');

export const LANGUAGES: readonly Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
];

export const API_DOCS_URL = 'https://riksdagsmonitor.com/docs/api/index.html';
export const ISSUE_URL = 'https://github.com/Hack23/riksdagsmonitor/issues/new/choose';

export type PageFamily = 'home' | 'dashboard' | 'politician';

export interface PageTarget {
  readonly file: string;
  readonly lang: Language;
  readonly family: PageFamily;
}

export const DASHBOARD_SLUGS = [
  'anomaly-detection',
  'coalitions',
  'committees',
  'election-cycle',
  'ministers',
  'parties',
  'pre-election',
  'risk',
  'seasonal-patterns',
] as const;

export interface ModernTarget {
  readonly file: string;
  readonly lang: Language;
  readonly family: 'home' | 'dashboard-hub' | 'politician' | 'dashboard-slug';
  readonly slug?: string;
}
