/**
 * @module Tests/BakeStatsHtml
 *
 * Guards the deploy-time stats baker so that:
 *   1. Its `STAT_MAPPINGS` mirror the browser stats-loader's mapping
 *      exactly. Drift between the two would mean baked HTML and the
 *      runtime fetch disagree on which CSV column populates which DOM
 *      id, producing inconsistent numbers across pages.
 *   2. CSV parsing → lookup → HTML substitution preserves placeholder
 *      attributes and only mutates the inner text node.
 *   3. Untouched stat ids (unmapped or missing in CSV) are left as-is
 *      so the runtime path on non-baked pages keeps working.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  STAT_MAPPINGS,
  buildStatLookup,
  bakeHtml,
} from '../scripts/bake-stats-html.js';

describe('bake-stats-html', () => {
  it('mirrors the browser stats-loader STAT_MAPPINGS exactly', () => {
    const loaderSrc = fs.readFileSync(
      path.resolve('src/browser/dashboards/stats-loader.ts'),
      'utf8',
    );
    // Pull the literal mapping block out of the source so the test
    // does not need to import a browser-only module under Vitest's
    // Node environment.
    const blockMatch = loaderSrc.match(
      /STAT_MAPPINGS:\s*StatMappings\s*=\s*\{([\s\S]*?)\n\};/,
    );
    expect(blockMatch, 'STAT_MAPPINGS literal block not found in stats-loader.ts').toBeTruthy();
    const block = blockMatch![1];
    const entries: Record<string, string> = {};
    const entryRe = /'([^']+)'\s*:\s*\n?\s*'([^']+)'/g;
    let m: RegExpExecArray | null;
    while ((m = entryRe.exec(block)) !== null) {
      entries[m[1]] = m[2];
    }
    expect(Object.keys(entries).length).toBeGreaterThan(0);
    expect(entries).toEqual(STAT_MAPPINGS);
  });

  it('builds a lookup from a representative CSV slice', () => {
    const csv = [
      'object_type,object_name,status,row_count,error_message,extraction_time',
      'table,person_data,success,2495,,2026-05-10 17:00:43.121483',
      'table,document_data,success,109480,,2026-05-10 17:00:24.455264',
      'table,rule_violation,success,2309,,2026-05-10 17:00:43.139586',
      'view,view_riksdagen_vote_data_ballot_politician_summary,success,3745119,,2026-05-10 17:10:26.811978',
      'view,view_riksdagen_goverment_proposals,success,5879,,2026-05-10 17:07:11.654802',
      'view,view_riksdagen_committee_decisions,success,59646,,2026-05-10 17:07:05.538488',
      // an "empty" row that must be ignored
      'table,application_view,empty,0,,2026-05-10 17:00:22.462014',
    ].join('\n');
    const lookup = buildStatLookup(csv);
    expect(lookup['stat-historical-persons']).toBe('2,495');
    expect(lookup['stat-total-documents']).toBe('109,480');
    expect(lookup['stat-rule-violations']).toBe('2,309');
    expect(lookup['stat-total-votes']).toBe('3,745,119');
    expect(lookup['stat-government-proposals']).toBe('5,879');
    expect(lookup['stat-committee-decisions']).toBe('59,646');
    // unmapped ids stay absent so the runtime path sees nothing baked
    expect(lookup['stat-application-view']).toBeUndefined();
  });

  it('rewrites only the text content of matching stat spans', () => {
    const lookup = {
      'stat-historical-persons': '2,495',
      'stat-total-votes': '3,745,119',
    };
    const html = [
      '<span class="number" data-stat-id="stat-historical-persons">—</span>',
      '<span data-stat-id="stat-total-votes" aria-live="polite">—</span>',
      '<span data-stat-id="stat-unmapped">—</span>',
      // Should never be replaced: id matches but no value in lookup
      '<span data-stat-id="stat-rule-violations">—</span>',
    ].join('\n');
    const { html: out, replaced } = bakeHtml(html, lookup);
    expect(replaced).toBe(2);
    expect(out).toContain(
      '<span class="number" data-stat-id="stat-historical-persons">2,495</span>',
    );
    expect(out).toContain(
      '<span data-stat-id="stat-total-votes" aria-live="polite">3,745,119</span>',
    );
    // Untouched placeholders preserved for the runtime stats-loader
    expect(out).toContain('<span data-stat-id="stat-unmapped">—</span>');
    expect(out).toContain('<span data-stat-id="stat-rule-violations">—</span>');
  });

  it('is idempotent — re-baking concrete values is a no-op for those', () => {
    const lookup = { 'stat-historical-persons': '2,495' };
    const html = '<span data-stat-id="stat-historical-persons">2,495</span>';
    const { html: out, replaced } = bakeHtml(html, lookup);
    expect(out).toBe(html);
    expect(replaced).toBe(1);
  });

  it('does not match across element boundaries', () => {
    const lookup = { 'stat-x': 'BAKED' };
    const html = '<span data-stat-id="stat-x">a<b>nested</b></span>';
    const { html: out, replaced } = bakeHtml(html, lookup);
    // Refuses to bake when the inner text contains markup — preserves
    // the original DOM so we never accidentally swallow a child node.
    expect(out).toBe(html);
    expect(replaced).toBe(0);
  });
});
