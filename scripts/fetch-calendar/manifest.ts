/**
 * @module scripts/fetch-calendar/manifest
 * @description Manifest serialisation and JSON persistence for the calendar
 * fetcher.
 *
 * Writes the `{schema, manifest, events}` envelope to
 * `data/calendar/{from}_{to}.json` so consumers load both the data and the
 * ICD-203 provenance record from a single file.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { CalendarFetchManifest, CalendarFetchResult } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// scripts/fetch-calendar/manifest.ts → ../.. = repo root
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CALENDAR_DIR = path.join(REPO_ROOT, 'data', 'calendar');

/**
 * Write a `CalendarFetchResult` to `data/calendar/{from}_{to}.json`.
 *
 * The file is an object with `{ manifest, events }` so that consumers can
 * load a single file and get both the data and the provenance record.
 * Including `to` in the filename prevents collisions when the same `from`
 * date is fetched with different ranges (e.g. week-ahead vs month-ahead).
 */
export function persistCalendarJson(
  from: string,
  result: CalendarFetchResult,
  outputDir: string = CALENDAR_DIR,
): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const dateTo = result.manifest.dateTo ?? from;
  const fileName = dateTo && dateTo !== from ? `${from}_${dateTo}.json` : `${from}.json`;
  const outputPath = path.join(outputDir, fileName);
  const payload = {
    schema: 'riksdagsmonitor-calendar/1.0',
    manifest: result.manifest,
    events: result.events,
  };
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');
  console.error(
    `  💾 [fetch-calendar] Persisted ${result.events.length} events → ${outputPath}`,
  );
  return outputPath;
}

/**
 * Generate a manifest markdown snippet suitable for appending to
 * `data-download-manifest.md`.
 */
export function formatManifestMarkdown(manifest: CalendarFetchManifest): string {
  const pathLabel =
    manifest.path === 'mcp-primary'
      ? '✅ MCP primary (`get_calendar_events`)'
      : manifest.path === 'web-fallback'
        ? '⚠️ Web fallback (`riksdagen.se/sv/kalendarium/`)'
        : '❌ None (both paths failed)';

  const lines = [
    `## Calendar Fetch — ${manifest.date}`,
    '',
    `- **Path used**: ${pathLabel}`,
    `- **Events**: ${manifest.eventCount}`,
    `- **Fetched at**: ${manifest.fetchedAt}`,
  ];
  if (manifest.primaryError) {
    lines.push(`- **Primary error**: ${manifest.primaryError.slice(0, 200)}`);
  }
  if (manifest.fallbackError) {
    lines.push(`- **Fallback error**: ${manifest.fallbackError.slice(0, 200)}`);
  }
  return lines.join('\n');
}
