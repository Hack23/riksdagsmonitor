/**
 * @module scripts/validators/executive-brief-translations/cli
 * @description argv parsing + main entry point for the CLI shim. Kept
 *              in the subtree (and not the legacy shim) so that the
 *              shim itself stays at the ≤ 20-line re-export contract
 *              required by the validator-split refactor.
 *
 *              Rule census: extracted from
 *              `scripts/validate-executive-brief-translations.ts` lines
 *              542–606 (parseArgs + the `if (isCliEntry)` block).
 *              Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { resolve } from 'node:path';

import { renderHumanReport } from './render-report.js';
import { TRANSLATION_LANGS, type TranslationLang } from './types.js';
import { validateExecutiveBriefSources } from './index.js';

interface ParsedArgs {
  jsonOut: boolean;
  soft: boolean;
  sources: string[];
  langs: ReadonlyArray<TranslationLang>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {
    jsonOut: false,
    soft: false,
    sources: [],
    langs: TRANSLATION_LANGS as ReadonlyArray<TranslationLang>,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.jsonOut = true;
    else if (a === '--soft') out.soft = true;
    else if (a === '--source' && argv[i + 1]) {
      out.sources.push(argv[++i]);
    } else if (a === '--lang' && argv[i + 1]) {
      const list = argv[++i].split(',').map((s) => s.trim()) as TranslationLang[];
      for (const l of list) {
        if (!TRANSLATION_LANGS.includes(l)) {
          console.error(`Unknown language code: ${l}`);
          process.exit(2);
        }
      }
      out.langs = list;
    } else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: npx tsx scripts/validate-executive-brief-translations.ts [options]\n' +
        '  --source <path>   Validate a single executive-brief.md (repeatable).\n' +
        '  --lang sv,de,...  Restrict to a subset of target languages.\n' +
        '  --json            Emit JSON summary on stdout.\n' +
        '  --soft            Exit 0 even when checks fail (report only).',
      );
      process.exit(0);
    }
  }
  return out;
}

export function runCli(argv: string[]): void {
  const args = parseArgs(argv);
  const repoRoot = process.cwd();
  const summary = validateExecutiveBriefSources({
    repoRoot,
    sources: args.sources.map((p) => resolve(repoRoot, p)),
    langs: args.langs,
  });

  if (args.jsonOut) {
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  } else {
    console.log(renderHumanReport(summary));
  }

  const failed = summary.totalChecksFailed > 0
    || summary.totalTranslationsPresent < summary.totalTranslationsExpected;
  if (failed && !args.soft) {
    process.exit(1);
  }
  process.exit(0);
}
