#!/usr/bin/env tsx
/**
 * @module scripts/fetch-calendar
 * @description Thin re-export shim + CLI entry for the bounded-context
 * Riksdag calendar fetcher.
 *
 * The implementation was split into `scripts/fetch-calendar/` in the
 * 2026-05 refactor (Hack23/riksdagsmonitor#2581). This shim preserves
 * the stable public surface so callers (`calendar-fetch`, the test suite,
 * news-prewarm composite action) keep working unchanged.  Add new symbols
 * to the relevant submodule, not here.
 *
 * Usage (CLI):
 *   tsx scripts/fetch-calendar.ts --from 2026-04-28 --to 2026-05-04 [--persist]
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CliArgsError, main, parseCalendarArgs } from './fetch-calendar/cli.js';

export type {
  CalendarEvent,
  CalendarFetchConfig,
  CalendarFetchManifest,
  CalendarFetchResult,
} from './fetch-calendar/types.js';

export {
  CalendarMcpError,
  HTML_PREFIX_RE,
  isDegradedKalenderSentinel,
  isHtmlErrorResponse,
} from './fetch-calendar/mcp/errors.js';
export { callMcpCalendarEvents } from './fetch-calendar/mcp/client.js';
export { normalizeMcpCalendarEvent } from './fetch-calendar/mcp/normaliser.js';
export {
  fetchWebCalendar,
  parseRiksdagKalendariumHtml,
} from './fetch-calendar/scraper/parse.js';
export { parseCalendarArticle } from './fetch-calendar/scraper/article-block.js';
export { parseCalendarListItem } from './fetch-calendar/scraper/list-item.js';
export { fetchCalendarWithFallback } from './fetch-calendar/orchestrator.js';
export {
  formatManifestMarkdown,
  persistCalendarJson,
} from './fetch-calendar/manifest.js';
export { CliArgsError, parseCalendarArgs };

// Guard: run `main()` only when this file is the direct entry point.
if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '')) {
  main().catch((err: unknown) => {
    console.error(
      '❌ [fetch-calendar] Fatal error:',
      err instanceof Error ? err.message : err,
    );
    process.exit(err instanceof CliArgsError ? 2 : 1);
  });
}
