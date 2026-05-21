import { describe, expect, it } from 'vitest';
import {
  countCodeFences,
  countHeadings,
  countMermaidBlocks,
  countTableRows,
  countWords,
  extractDokIds,
  extractSourceShaMarker,
  extractUrls,
  findBannedEnglishPhrases,
  hasRtlMarker,
  TRANSLATION_LANGS,
  validateTranslationContent,
} from '../scripts/validate-executive-brief-translations.js';

const SOURCE = `---
title: Daily Executive Brief
date: 2026-05-15
---

# Daily Executive Brief — Propositions

## Bottom-Line-Up-Front

Government tabled three new propositions today: \`H901FiU1\`, \`H8011AU10\`, and \`HA02UU3\`.

## Decisions

- See [Riksdag tracker](https://www.riksdagen.se/sv/dokument-lagar/) for full context.
- Refer also to https://www.regeringen.se/pressmeddelanden/ for ministry-side details.

## Confidence Matrix

| Item | Confidence |
|------|------------|
| Fiscal | HIGH |
| Labour | MEDIUM |

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`
`;

const VALID_SV_TRANSLATION = `---
title: Dagens översikt
date: 2026-05-15
---

# Dagens översikt — Propositioner

## Sammanfattning

Regeringen lade i dag fram tre nya propositioner: \`H901FiU1\`, \`H8011AU10\` och \`HA02UU3\`.

## Beslut

- Se [Riksdagens spårning](https://www.riksdagen.se/sv/dokument-lagar/) för full kontext.
- Se även https://www.regeringen.se/pressmeddelanden/ för ministeriets detaljer.

## Konfidensmatris

| Punkt | Konfidens |
|-------|-----------|
| Finanspolitik | HIGH |
| Arbetsmarknad | MEDIUM |

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`

<!-- source-sha: 1234567890abcdef1234567890abcdef12345678 -->
`;

const VALID_AR_TRANSLATION = `<!-- dir: rtl -->
---
title: الموجز التنفيذي اليومي
date: 2026-05-15
---

# الموجز التنفيذي اليومي — المقترحات الحكومية

## الخلاصة الفورية

قدّمت الحكومة اليوم ثلاثة مقترحات: \`H901FiU1\` و\`H8011AU10\` و\`HA02UU3\`.

## القرارات

- انظر [متتبع البرلمان](https://www.riksdagen.se/sv/dokument-lagar/) للسياق الكامل.
- راجع أيضا https://www.regeringen.se/pressmeddelanden/ لتفاصيل الوزارة.

## مصفوفة الثقة

| البند | الثقة |
|-------|-------|
| المالية | HIGH |
| العمل | MEDIUM |

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`

<!-- source-sha: 1234567890abcdef1234567890abcdef12345678 -->
`;

describe('executive-brief structural counters', () => {
  it('countHeadings counts all #-headings outside fences', () => {
    expect(countHeadings(SOURCE)).toBe(4);
  });

  it('countCodeFences counts fenced blocks (pairs of ```)', () => {
    expect(countCodeFences(SOURCE)).toBe(1);
  });

  it('countCodeFences reports malformed unpaired fences', () => {
    expect(Number.isNaN(countCodeFences(`${SOURCE}\n\`\`\`\n`))).toBe(true);
  });

  it('countMermaidBlocks counts only ```mermaid blocks', () => {
    expect(countMermaidBlocks(SOURCE)).toBe(1);
  });

  it('countTableRows counts every line of every markdown table', () => {
    // 1 header row + 1 separator + 2 data rows = 4
    expect(countTableRows(SOURCE)).toBe(4);
  });

  it('extractDokIds picks up Riksdag dok_ids', () => {
    const ids = extractDokIds(SOURCE);
    expect(ids.has('H901FiU1')).toBe(true);
    expect(ids.has('H8011AU10')).toBe(true);
    expect(ids.has('HA02UU3')).toBe(true);
    expect(ids.size).toBe(3);
  });

  it('extractUrls returns absolute URLs in link targets and bare text', () => {
    const urls = extractUrls(SOURCE);
    expect(urls.has('https://www.riksdagen.se/sv/dokument-lagar/')).toBe(true);
    expect(urls.has('https://www.regeringen.se/pressmeddelanden/')).toBe(true);
  });

  it('extractSourceShaMarker returns the 40-hex sha when present', () => {
    expect(extractSourceShaMarker(VALID_SV_TRANSLATION)).toBe(
      '1234567890abcdef1234567890abcdef12345678',
    );
    expect(extractSourceShaMarker(SOURCE)).toBeNull();
  });

  it('extractSourceShaMarker only accepts the marker as the trailing non-empty line', () => {
    expect(extractSourceShaMarker(`${VALID_SV_TRANSLATION}\n\n`)).toBe(
      '1234567890abcdef1234567890abcdef12345678',
    );
    expect(extractSourceShaMarker(
      `${VALID_SV_TRANSLATION}\n## Extra translated content\n`,
    )).toBeNull();
  });

  it('hasRtlMarker only matches when within the first 1KB', () => {
    expect(hasRtlMarker(VALID_AR_TRANSLATION)).toBe(true);
    expect(hasRtlMarker(VALID_SV_TRANSLATION)).toBe(false);
  });

  it('countWords returns a reasonable approximation', () => {
    expect(countWords(SOURCE)).toBeGreaterThan(20);
  });

  it('TRANSLATION_LANGS lists exactly the 13 non-English target languages', () => {
    expect(TRANSLATION_LANGS).toEqual([
      'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl',
      'ar', 'he', 'ja', 'ko', 'zh',
    ]);
  });
});

describe('findBannedEnglishPhrases', () => {
  it('returns empty array when translation has no banned English phrases', () => {
    expect(findBannedEnglishPhrases(VALID_SV_TRANSLATION)).toEqual([]);
    expect(findBannedEnglishPhrases(VALID_AR_TRANSLATION)).toEqual([]);
  });

  it('flags a translation that left "Executive Brief" untranslated', () => {
    const bad = VALID_SV_TRANSLATION.replace(
      '# Dagens översikt — Propositioner',
      '# Executive Brief — Propositioner',
    );
    expect(findBannedEnglishPhrases(bad)).toContain('Executive Brief');
  });

  it('flags a translation that left "BLUF" in the body', () => {
    const bad = VALID_SV_TRANSLATION.replace(
      '## Sammanfattning',
      '## BLUF Sammanfattning',
    );
    expect(findBannedEnglishPhrases(bad)).toContain('BLUF');
  });
});

describe('validateTranslationContent end-to-end', () => {
  const sourceSha = '1234567890abcdef1234567890abcdef12345678';

  it('passes every check for a valid Swedish translation', () => {
    const checks = validateTranslationContent({
      sourceContent: SOURCE,
      translationContent: VALID_SV_TRANSLATION,
      translationPath: 'analysis/daily/2026-05-15/propositions/executive-brief_sv.md',
      lang: 'sv',
      sourceSha,
    });
    const failed = checks.filter((c) => !c.passed);
    expect(failed).toEqual([]);
  });

  it('passes every check (including RTL marker) for a valid Arabic translation', () => {
    const checks = validateTranslationContent({
      sourceContent: SOURCE,
      translationContent: VALID_AR_TRANSLATION,
      translationPath: 'analysis/daily/2026-05-15/propositions/executive-brief_ar.md',
      lang: 'ar',
      sourceSha,
    });
    const failed = checks.filter((c) => !c.passed);
    expect(failed).toEqual([]);
    expect(checks.find((c) => c.check === 'rtl-marker')?.passed).toBe(true);
  });

  it('fails dok-id-preservation when the translation drops an identifier', () => {
    const bad = VALID_SV_TRANSLATION.replace('`H8011AU10`', '`borttagen`');
    const checks = validateTranslationContent({
      sourceContent: SOURCE,
      translationContent: bad,
      translationPath: 'x_sv.md',
      lang: 'sv',
      sourceSha,
    });
    const dokCheck = checks.find((c) => c.check === 'dok-id-preservation');
    expect(dokCheck?.passed).toBe(false);
    expect(dokCheck?.detail).toContain('H8011AU10');
  });

  it('fails url-preservation when the translation drops an external URL', () => {
    const bad = VALID_SV_TRANSLATION.replace(
      'https://www.regeringen.se/pressmeddelanden/',
      '',
    );
    const checks = validateTranslationContent({
      sourceContent: SOURCE,
      translationContent: bad,
      translationPath: 'x_sv.md',
      lang: 'sv',
      sourceSha,
    });
    expect(checks.find((c) => c.check === 'url-preservation')?.passed).toBe(false);
  });

  it('fails rtl-marker when an Arabic translation is missing the marker', () => {
    const bad = VALID_AR_TRANSLATION.replace('<!-- dir: rtl -->\n', '');
    const checks = validateTranslationContent({
      sourceContent: SOURCE,
      translationContent: bad,
      translationPath: 'x_ar.md',
      lang: 'ar',
      sourceSha,
    });
    expect(checks.find((c) => c.check === 'rtl-marker')?.passed).toBe(false);
  });

  it('flags source-sha-marker as stale when trailer does not match current source SHA', () => {
    const checks = validateTranslationContent({
      sourceContent: SOURCE,
      translationContent: VALID_SV_TRANSLATION,
      translationPath: 'x_sv.md',
      lang: 'sv',
      sourceSha: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    });
    const sha = checks.find((c) => c.check === 'source-sha-marker');
    expect(sha?.passed).toBe(false);
    expect(sha?.detail).toContain('stale');
  });

  it('flags source-sha-marker as missing when trailer is absent', () => {
    const bad = VALID_SV_TRANSLATION.replace(
      /<!-- source-sha: [0-9a-f]{40} -->\s*$/m,
      '',
    );
    const checks = validateTranslationContent({
      sourceContent: SOURCE,
      translationContent: bad,
      translationPath: 'x_sv.md',
      lang: 'sv',
      sourceSha,
    });
    expect(checks.find((c) => c.check === 'source-sha-marker')?.passed).toBe(false);
  });

  it('flags code-fence-count when the translation has an unpaired fence', () => {
    const checks = validateTranslationContent({
      sourceContent: SOURCE,
      translationContent: `${VALID_SV_TRANSLATION}\n\`\`\`\n`,
      translationPath: 'x_sv.md',
      lang: 'sv',
      sourceSha,
    });
    expect(checks.find((c) => c.check === 'code-fence-count')?.passed).toBe(false);
  });

  it('flags word-count-drift when the translation is more than 25% shorter', () => {
    const tiny = `# kort\n\n## kort\n\n## kort\n\n## kort\n\nordet.\n\n| a | b |\n|---|---|\n| c | d |\n| e | f |\n\n\`\`\`mermaid\nflowchart LR\n  A --> B\n\`\`\`\n\n<!-- source-sha: ${sourceSha} -->\n`;
    const checks = validateTranslationContent({
      sourceContent: SOURCE,
      translationContent: tiny,
      translationPath: 'x_sv.md',
      lang: 'sv',
      sourceSha,
    });
    expect(checks.find((c) => c.check === 'word-count-drift')?.passed).toBe(false);
  });

  it('skips word-count-drift for CJK scripts (ja, zh) — whitespace tokeniser systematically undercounts', () => {
    // Tiny CJK body that would fail the ±25% drift gate if not skipped.
    const tinyCjk = `# 簡短\n\n## 短\n\n## 短\n\n## 短\n\n字。\n\n| a | b |\n|---|---|\n| c | d |\n| e | f |\n\n\`\`\`mermaid\nflowchart LR\n  A --> B\n\`\`\`\n\n<!-- source-sha: ${sourceSha} -->\n`;
    for (const lang of ['ja', 'zh'] as const) {
      const checks = validateTranslationContent({
        sourceContent: SOURCE,
        translationContent: tinyCjk,
        translationPath: `x_${lang}.md`,
        lang,
        sourceSha,
      });
      const wc = checks.find((c) => c.check === 'word-count-drift');
      expect(wc?.passed).toBe(true);
      expect(wc?.detail).toMatch(/skipped/i);
    }
  });
});
