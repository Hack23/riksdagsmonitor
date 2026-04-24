/**
 * @module Infrastructure/BackfillLib/ContractChecker
 * @category Intelligence Operations / Supporting Infrastructure
 * @name SEO metadata contract checker (PR 2 of the 5-PR SEO rescue plan)
 *
 * @description
 * Encodes every rule in `.github/prompts/seo-metadata-contract.md` as a
 * machine-readable check that returns a `{ ok, violations[] }` result
 * with per-field violation codes suitable for the CSV diff report
 * consumed by PR 3 (Tier A regenerate), PR 4 (Tier B rewrite) and PR 5
 * (Tier C translation repair + CI gate).
 *
 * ## Rules encoded
 *
 * | Contract § | Code                            | Field         |
 * | ---------- | ------------------------------- | ------------- |
 * | §2.1/§4    | `TITLE_EMPTY`                   | `title`       |
 * | §2.1/§4    | `TITLE_TOO_SHORT`               | `title`       |
 * | §2.1/§4    | `TITLE_TOO_LONG`                | `title`       |
 * | §2.2       | `TITLE_HAS_ISO_DATE`            | `title`       |
 * | §2.2       | `TITLE_HAS_BANNED_PHRASE`       | `title`       |
 * | §2.2       | `TITLE_ENDS_WITH_BRAND`         | `title`       |
 * | §3.1/§4    | `DESCRIPTION_EMPTY`             | `description` |
 * | §3.1/§4    | `DESCRIPTION_TOO_SHORT`         | `description` |
 * | §3.1/§4    | `DESCRIPTION_TOO_LONG`          | `description` |
 * | §3.1       | `DESCRIPTION_HAS_ADMIN_LEAK`    | `description` |
 * | §3.1       | `DESCRIPTION_NOT_TERMINATED`    | `description` |
 * | §3.1       | `DESCRIPTION_TRUNCATED_MIDWORD` | `description` |
 * | §3.1       | `DESCRIPTION_GENERIC_FILLER`    | `description` |
 *
 * All codes are stable and form the public CSV contract. Renaming a
 * code is a breaking change for PRs 3-5.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/** Language code as used in the `news/*-$LANG.html` filename suffix. */
export type LangCode =
  | 'en' | 'sv' | 'da' | 'no' | 'nb' | 'fi' | 'de' | 'fr' | 'es' | 'nl'
  | 'ar' | 'he' | 'ja' | 'ko' | 'zh';

/** Per-language character-count window (visual SERP width). */
export interface LangWindow {
  readonly titleMin: number;
  readonly titleMax: number;
  readonly descriptionMin: number;
  readonly descriptionMax: number;
}

/** Latin-script budgets (en, sv, da, no/nb, fi, de, fr, es, nl). */
const LATIN_WINDOW: LangWindow = {
  titleMin: 55,
  titleMax: 70,
  descriptionMin: 140,
  descriptionMax: 200,
};

/** RTL budgets (ar, he). */
const RTL_WINDOW: LangWindow = {
  titleMin: 45,
  titleMax: 60,
  descriptionMin: 120,
  descriptionMax: 170,
};

/** CJK budgets (ja, ko, zh). */
const CJK_WINDOW: LangWindow = {
  titleMin: 30,
  titleMax: 45,
  descriptionMin: 70,
  descriptionMax: 120,
};

/** Contract §4 per-language windows. Exported for tests + report writers. */
export const LANG_WINDOWS: Record<LangCode, LangWindow> = {
  en: LATIN_WINDOW,
  sv: LATIN_WINDOW,
  da: LATIN_WINDOW,
  no: LATIN_WINDOW,
  nb: LATIN_WINDOW,
  fi: LATIN_WINDOW,
  de: LATIN_WINDOW,
  fr: LATIN_WINDOW,
  es: LATIN_WINDOW,
  nl: LATIN_WINDOW,
  ar: RTL_WINDOW,
  he: RTL_WINDOW,
  ja: CJK_WINDOW,
  ko: CJK_WINDOW,
  zh: CJK_WINDOW,
};

/** Visual-width counter. CJK glyphs count as 1 glyph here; the windows in
 *  `LANG_WINDOWS` already encode the SERP-width ratio by using smaller
 *  numbers for CJK languages. `Array.from` preserves surrogate pairs. */
function visualLength(text: string): number {
  return Array.from(text).length;
}

/** Contract §2.2 banned phrases for `<title>`. */
export const BANNED_TITLE_PHRASES: readonly RegExp[] = [
  /Executive\s+Brief\s*[—\-–]/i,
  /AI-generated\s+political\s+intelligence/i,
  /\bBrief\s*ID\s*:/i,
  /\bClassification\s*:/i,
  /\bPrepared\s*(?:by|at)\s*:/i,
  /\bAnalyst\s*:/i,
  /\b60[-\s]?second\s+read\s*:/i,
  /\bAdmiralty(?:\s+baseline)?\s*:/i,
];

/** Contract §3.1 admin-metadata phrases that must never leak into a
 *  description. */
export const BANNED_DESCRIPTION_PHRASES: readonly RegExp[] = [
  /\bBrief\s*ID\s*:/i,
  /\bClassification\s*:/i,
  /\bPrepared\s*(?:by|at)\s*:/i,
  /\bAnalyst\s*:/i,
  /\b60[-\s]?second\s+read\s*:/i,
  /\bAdmiralty(?:\s+baseline)?\s*:/i,
  /\bDistribution\s*:/i,
  /\bMethodology\s*:/i,
  /\bReviewed\s*by\s*:/i,
  /\bReviewer\s*:/i,
  /\bDisseminated\s*:/i,
  /\bRun\s*ID\s*:/i,
];

/** Literal ISO 8601 date — `YYYY-MM-DD` or `YYYY/MM/DD`. */
export const ISO_DATE_RE = /\b\d{4}[-/]\d{2}[-/]\d{2}\b/;

/** Trailing brand suffix that doubles up with the chrome template.
 *  Contract §2.2: the raw editorial `<title>` must not end in
 *  ` — Riksdagsmonitor` because the chrome template appends it for
 *  og:title / twitter:title only. */
export const TRAILING_BRAND_RE = /\s*[—\-–|]\s*Riksdagsmonitor\s*$/;

/** Generic fallback phrases that the aggregator emitted when it could
 *  not find a real description (contract §1, issue "Generic filler"). */
export const GENERIC_FILLER_RE =
  /AI-generated\s+political\s+intelligence|Evidence-based\s+political\s+intelligence\s+analysis\s+for/i;

/** Sentence-terminator check — the final character must be one of these.
 *  Mirrors `SENTENCE_END_RE` in `scripts/render-lib/aggregator.ts` and
 *  tolerates the Unicode ellipsis (intentional truncation marker). */
export const SENTENCE_TERMINATOR_RE = /[.!?…。।]$/;

/** Mid-word truncation heuristic — a description that ends with a
 *  letter (any script) with no terminator is almost certainly a blind
 *  `.slice(0, 300)` cut. */
export const MIDWORD_TRUNCATION_RE = /[\p{Ll}\p{Lu}\p{Lo}]$/u;

/** One violation entry. Stable shape — CSV writer + PRs 3/4/5 depend on
 *  these field names. */
export interface ContractViolation {
  /** Stable machine-readable code (see module JSDoc table). */
  readonly code: string;
  /** Which field the violation applies to. */
  readonly field: 'title' | 'description';
  /** Human-readable diagnostic, safe for CSV escaping. */
  readonly message: string;
  /** Observed offending value (may be empty for `TITLE_EMPTY` etc.). */
  readonly value: string;
}

/** Input to `checkAgainstContract`. */
export interface ContractInput {
  readonly title: string;
  readonly description: string;
}

/** Result of `checkAgainstContract`. */
export interface ContractResult {
  readonly ok: boolean;
  readonly violations: readonly ContractViolation[];
  /** The language window actually used (helpful for diagnostics). */
  readonly window: LangWindow;
}

/** Resolve a language code to its window, with fall-back to Latin for
 *  unknown codes. */
export function windowFor(lang: string): LangWindow {
  const key = lang.toLowerCase() as LangCode;
  return LANG_WINDOWS[key] ?? LATIN_WINDOW;
}

/**
 * Check `{title, description}` against every rule in the contract.
 *
 * `ok` is `true` iff `violations` is empty. Order is stable so two runs
 * against the same input produce the same CSV row ordering.
 */
export function checkAgainstContract(
  meta: ContractInput,
  lang: string,
): ContractResult {
  const violations: ContractViolation[] = [];
  const window = windowFor(lang);

  const title = meta.title ?? '';
  const description = meta.description ?? '';

  // --- Title checks -------------------------------------------------------
  const titleLen = visualLength(title.trim());
  if (titleLen === 0) {
    violations.push({
      code: 'TITLE_EMPTY',
      field: 'title',
      message: 'Document <title> is missing or empty.',
      value: '',
    });
  } else {
    if (titleLen < window.titleMin) {
      violations.push({
        code: 'TITLE_TOO_SHORT',
        field: 'title',
        message: `Title is ${titleLen} chars (min ${window.titleMin} for lang=${lang}).`,
        value: title,
      });
    }
    if (titleLen > window.titleMax) {
      violations.push({
        code: 'TITLE_TOO_LONG',
        field: 'title',
        message: `Title is ${titleLen} chars (max ${window.titleMax} for lang=${lang}).`,
        value: title,
      });
    }
  }

  if (ISO_DATE_RE.test(title)) {
    violations.push({
      code: 'TITLE_HAS_ISO_DATE',
      field: 'title',
      message: 'Title contains a literal YYYY-MM-DD / YYYY/MM/DD date.',
      value: title,
    });
  }

  if (TRAILING_BRAND_RE.test(title)) {
    violations.push({
      code: 'TITLE_ENDS_WITH_BRAND',
      field: 'title',
      message: 'Title ends with " — Riksdagsmonitor" (chrome template double-brand).',
      value: title,
    });
  }

  for (const re of BANNED_TITLE_PHRASES) {
    if (re.test(title)) {
      violations.push({
        code: 'TITLE_HAS_BANNED_PHRASE',
        field: 'title',
        message: `Title contains a contract §2.2 banned phrase (${re.source}).`,
        value: title,
      });
      break;
    }
  }

  // --- Description checks -------------------------------------------------
  const descTrimmed = description.trim();
  const descLen = visualLength(descTrimmed);

  if (descLen === 0) {
    violations.push({
      code: 'DESCRIPTION_EMPTY',
      field: 'description',
      message: 'Meta description is missing or empty.',
      value: '',
    });
  } else {
    if (descLen < window.descriptionMin) {
      violations.push({
        code: 'DESCRIPTION_TOO_SHORT',
        field: 'description',
        message: `Description is ${descLen} chars (min ${window.descriptionMin} for lang=${lang}).`,
        value: description,
      });
    }
    if (descLen > window.descriptionMax) {
      violations.push({
        code: 'DESCRIPTION_TOO_LONG',
        field: 'description',
        message: `Description is ${descLen} chars (max ${window.descriptionMax} for lang=${lang}).`,
        value: description,
      });
    }

    if (!SENTENCE_TERMINATOR_RE.test(descTrimmed)) {
      violations.push({
        code: 'DESCRIPTION_NOT_TERMINATED',
        field: 'description',
        message: 'Description does not end on ., !, ?, …, 。, or ।.',
        value: description,
      });
      const lastChar = descTrimmed.slice(-1);
      if (MIDWORD_TRUNCATION_RE.test(lastChar)) {
        violations.push({
          code: 'DESCRIPTION_TRUNCATED_MIDWORD',
          field: 'description',
          message: 'Description ends on a letter — likely a blind .slice() cut.',
          value: description,
        });
      }
    }

    for (const re of BANNED_DESCRIPTION_PHRASES) {
      if (re.test(description)) {
        violations.push({
          code: 'DESCRIPTION_HAS_ADMIN_LEAK',
          field: 'description',
          message: `Description contains admin-metadata leak (${re.source}).`,
          value: description,
        });
        break;
      }
    }

    if (GENERIC_FILLER_RE.test(description)) {
      violations.push({
        code: 'DESCRIPTION_GENERIC_FILLER',
        field: 'description',
        message: 'Description is the aggregator generic-filler fallback.',
        value: description,
      });
    }
  }

  return {
    ok: violations.length === 0,
    violations,
    window,
  };
}

export const __test__ = {
  visualLength,
  LATIN_WINDOW,
  RTL_WINDOW,
  CJK_WINDOW,
};
