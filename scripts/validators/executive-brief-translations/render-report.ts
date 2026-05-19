/**
 * @module scripts/validators/executive-brief-translations/render-report
 * @description Human-readable summary renderer for the executive-brief
 *              translation validator CLI.
 *
 *              Rule census: extracted from
 *              `scripts/validate-executive-brief-translations.ts` lines
 *              510–537. Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { ValidationSummary } from './types.js';

export function renderHumanReport(summary: ValidationSummary): string {
  const lines: string[] = [];
  lines.push(`Executive-brief translation validator`);
  lines.push(`─────────────────────────────────────`);
  lines.push(`Sources scanned:           ${summary.totalSources}`);
  lines.push(`Translations expected:     ${summary.totalTranslationsExpected}`);
  lines.push(`Translations present:      ${summary.totalTranslationsPresent}`);
  lines.push(`Translations missing:      ${summary.totalTranslationsExpected - summary.totalTranslationsPresent}`);
  lines.push(`Checks run:                ${summary.totalChecksRun}`);
  lines.push(`Checks failed:             ${summary.totalChecksFailed}`);
  lines.push('');

  for (const src of summary.sources) {
    const failedT = src.translations.filter((t) => !t.passed);
    if (failedT.length === 0) {
      lines.push(`✅ ${src.sourcePath} — all ${src.translations.length} translation(s) valid`);
      continue;
    }
    lines.push(`❌ ${src.sourcePath} (sha=${src.sourceSha?.slice(0, 8) ?? 'unknown'})`);
    for (const t of failedT) {
      lines.push(`    └─ ${t.lang}: ${t.exists ? 'invalid' : 'MISSING'} — ${t.translationPath}`);
      for (const c of t.checks.filter((x) => !x.passed)) {
        lines.push(`        ✗ ${c.check}${c.detail ? ` — ${c.detail}` : ''}`);
      }
    }
  }
  return lines.join('\n');
}
