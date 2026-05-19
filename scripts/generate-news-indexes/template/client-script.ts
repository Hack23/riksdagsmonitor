/**
 * @module generate-news-indexes/template/client-script
 * @description Composer that emits the full inline `<script>` block — prelude
 * declarations followed by the pure-literal runtime body.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { ArticleDisplayData, LanguageConfig } from '../types.js';
import { buildPrelude } from './client-script-prelude.js';
import { CLIENT_RUNTIME_BODY } from './client-script-runtime.js';

export interface ClientScriptInput {
  readonly langKey: string;
  readonly lang: LanguageConfig;
  readonly displayData: readonly ArticleDisplayData[];
  readonly isRTL: boolean;
}

/** Render the full inline `<script>` body (prelude + runtime). */
export function renderClientScript(input: ClientScriptInput): string {
  const prelude = buildPrelude({
    langKey: input.langKey,
    lang: input.lang,
    displayData: input.displayData,
    isRTL: input.isRTL,
  });
  return `  <script>
${prelude}
${CLIENT_RUNTIME_BODY}  </script>`;
}
