/**
 * @module scripts/validators/executive-brief-translations/validate-translation-content
 * @description Per-translation rule runner — builds the 10-item
 *              `CheckResult[]` shape used by the orchestrator and
 *              consumed by `tests/validate-executive-brief-translations.test.ts`.
 *
 *              Rule census: extracted from
 *              `scripts/validate-executive-brief-translations.ts` lines
 *              232–382. Logic is byte-identical to the original — each
 *              check pushes the same `check` identifier and `detail`
 *              string into the result array.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { countCodeFences } from './counters/code-fences.js';
import { countHeadings } from './counters/headings.js';
import { countMermaidBlocks } from './counters/mermaid-blocks.js';
import { countTableRows } from './counters/table-rows.js';
import { countWords } from './counters/words.js';
import { extractDokIds } from './extractors/dok-ids.js';
import { extractSourceShaMarker, hasRtlMarker } from './extractors/source-sha.js';
import { extractUrls } from './extractors/urls.js';
import { findBannedEnglishPhrases } from './rules/banned-english.js';
import { RTL_LANGS, type CheckResult, type TranslationLang } from './types.js';

export interface ValidateTranslationOptions {
  /** Source executive-brief.md content. */
  sourceContent: string;
  /** Translation file path (used for diagnostic context only). */
  translationPath: string;
  /** Translation file content. May be empty if file doesn't exist. */
  translationContent: string;
  /** Target language code. */
  lang: TranslationLang;
  /** Optional source SHA — when supplied, the trailer must match. */
  sourceSha?: string | null;
}

export function validateTranslationContent(opts: ValidateTranslationOptions): CheckResult[] {
  const { sourceContent, translationContent, lang, sourceSha } = opts;
  const checks: CheckResult[] = [];

  // 1. Heading parity
  const srcHeadings = countHeadings(sourceContent);
  const tgtHeadings = countHeadings(translationContent);
  checks.push({
    check: 'heading-count',
    passed: srcHeadings === tgtHeadings,
    detail: srcHeadings === tgtHeadings
      ? `${tgtHeadings}`
      : `source=${srcHeadings} translation=${tgtHeadings}`,
  });

  // 2. Table-row parity
  const srcRows = countTableRows(sourceContent);
  const tgtRows = countTableRows(translationContent);
  checks.push({
    check: 'table-row-count',
    passed: srcRows === tgtRows,
    detail: srcRows === tgtRows
      ? `${tgtRows}`
      : `source=${srcRows} translation=${tgtRows}`,
  });

  // 3. Code-fence parity
  const srcFences = countCodeFences(sourceContent);
  const tgtFences = countCodeFences(translationContent);
  checks.push({
    check: 'code-fence-count',
    passed: srcFences === tgtFences,
    detail: srcFences === tgtFences
      ? `${tgtFences}`
      : `source=${srcFences} translation=${tgtFences}`,
  });

  // 4. Mermaid-block parity
  const srcMermaid = countMermaidBlocks(sourceContent);
  const tgtMermaid = countMermaidBlocks(translationContent);
  checks.push({
    check: 'mermaid-block-count',
    passed: srcMermaid === tgtMermaid,
    detail: srcMermaid === tgtMermaid
      ? `${tgtMermaid}`
      : `source=${srcMermaid} translation=${tgtMermaid}`,
  });

  // 5. dok_id preservation (set equality — no missing, no extras)
  const srcDokIds = extractDokIds(sourceContent);
  const tgtDokIds = extractDokIds(translationContent);
  const missingDokIds = [...srcDokIds].filter((id) => !tgtDokIds.has(id));
  const extraDokIds = [...tgtDokIds].filter((id) => !srcDokIds.has(id));
  const dokIdPassed = missingDokIds.length === 0 && extraDokIds.length === 0;
  checks.push({
    check: 'dok-id-preservation',
    passed: dokIdPassed,
    detail: dokIdPassed
      ? `${srcDokIds.size} preserved`
      : [
          missingDokIds.length > 0 ? `missing: ${missingDokIds.join(', ')}` : '',
          extraDokIds.length > 0 ? `extra: ${extraDokIds.join(', ')}` : '',
        ].filter(Boolean).join('; '),
  });

  // 6. URL preservation (set equality — no missing, no extras)
  const srcUrls = extractUrls(sourceContent);
  const tgtUrls = extractUrls(translationContent);
  const missingUrls = [...srcUrls].filter((u) => !tgtUrls.has(u));
  const extraUrls = [...tgtUrls].filter((u) => !srcUrls.has(u));
  const urlPassed = missingUrls.length === 0 && extraUrls.length === 0;
  checks.push({
    check: 'url-preservation',
    passed: urlPassed,
    detail: urlPassed
      ? `${srcUrls.size} preserved`
      : [
          missingUrls.length > 0 ? `missing ${missingUrls.length} of ${srcUrls.size}` : '',
          extraUrls.length > 0 ? `extra ${extraUrls.length} URLs injected` : '',
        ].filter(Boolean).join('; '),
  });

  // 7. RTL marker (ar / he only)
  if (RTL_LANGS.includes(lang)) {
    const rtlOk = hasRtlMarker(translationContent);
    checks.push({
      check: 'rtl-marker',
      passed: rtlOk,
      detail: rtlOk ? 'present' : 'missing `<!-- dir: rtl -->` marker',
    });
  }

  // 8. source-sha trailer
  const trailerSha = extractSourceShaMarker(translationContent);
  if (sourceSha === null || sourceSha === undefined) {
    checks.push({
      check: 'source-sha-marker',
      passed: trailerSha !== null,
      detail: trailerSha ? 'present' : 'missing `<!-- source-sha: -->` trailer',
    });
  } else {
    const shaMatches = trailerSha === sourceSha;
    checks.push({
      check: 'source-sha-marker',
      passed: shaMatches,
      detail: !trailerSha
        ? 'missing `<!-- source-sha: -->` trailer'
        : shaMatches
          ? 'matches source'
          : `stale (trailer=${trailerSha.slice(0, 8)} source=${sourceSha.slice(0, 8)})`,
    });
  }

  // 9. Banned English phrases (non-EN files)
  const banned = findBannedEnglishPhrases(translationContent);
  checks.push({
    check: 'no-banned-english',
    passed: banned.length === 0,
    detail: banned.length === 0 ? 'clean' : `found: ${banned.join(', ')}`,
  });

  // 10. Word-count drift (±25%) — skipped for CJK scripts (Japanese, Chinese)
  // because they do not use whitespace word boundaries and the whitespace
  // tokeniser systematically undercounts them by ~4–6×. Structural parity
  // (headings, table rows, code fences, mermaid blocks, dok_id and URL sets)
  // still guarantees the translation is not truncated or padded.
  const NON_WORDSPACE_LANGS: ReadonlyArray<TranslationLang> = ['ja', 'zh'];
  if (NON_WORDSPACE_LANGS.includes(lang)) {
    checks.push({
      check: 'word-count-drift',
      passed: true,
      detail: 'skipped (CJK script — no whitespace word boundaries)',
    });
  } else {
    const srcWords = countWords(sourceContent);
    const tgtWords = countWords(translationContent);
    const tolerance = 0.25;
    const lowerBound = Math.floor(srcWords * (1 - tolerance));
    const upperBound = Math.ceil(srcWords * (1 + tolerance));
    const inBounds = tgtWords >= lowerBound && tgtWords <= upperBound;
    checks.push({
      check: 'word-count-drift',
      passed: inBounds,
      detail: inBounds
        ? `${tgtWords} words (source=${srcWords})`
        : `${tgtWords} words outside [${lowerBound}, ${upperBound}] (source=${srcWords})`,
    });
  }

  return checks;
}
