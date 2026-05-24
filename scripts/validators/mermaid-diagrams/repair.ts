/**
 * @module scripts/validators/mermaid-diagrams/repair
 * @description Deterministic, semantics-preserving auto-repair for the
 *              four dominant Mermaid parse failures observed in the
 *              `analysis/` corpus (see initial scan: 643 broken
 *              blocks across 410 files):
 *
 *              1. **quadrantChart with parens in quadrant labels** —
 *                 `quadrant-1 SO Strategies (Leverage)` ⇒ Lexical error
 *                 ⇒ strip the parens.
 *              2. **quadrantChart / xychart-beta with trailing `style …`
 *                 directives** — these chart types do not accept
 *                 per-data-point `style`. The canonical palette is
 *                 already enforced via the `themeVariables` prologue,
 *                 so dropping the directives is loss-less.
 *              3. **mindmap with `classDef` / `style`** — produces
 *                 "There can be only one root". Same fix: drop the
 *                 invalid directives.
 *              4. **Unsupported top-level diagram types** (`radar`,
 *                 `bar`, `gauge`) — comment out the whole body so the
 *                 source artifact survives but the renderer no longer
 *                 attempts a failing parse.
 *              5. **Edge-label closing-bracket typo** (`-->|label]` →
 *                 `-->|label|`) — already auto-repaired by the
 *                 renderer's preprocessor, but fixing at source makes
 *                 the artifact valid for offline review tools.
 *
 *              Unclosed fences are *not* fixed here — that is the job
 *              of the file-level CLI which sees the surrounding
 *              Markdown context (only the CLI can decide where to
 *              insert the closing ` ``` `).
 *
 *              Every function is pure (string ⇒ string). The orchestrator
 *              calls them in a fixed order and re-validates after each
 *              pass, so a fix that does not help is detected immediately.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { detectMermaidDiagramType } from './extract.js';

const QUADRANT_LABEL_RE = /^(\s*quadrant-[1-4]\s+)(.+)$/;
const STYLE_DIRECTIVE_RE = /^[\t ]*style[\t ]+\S+/;
const CLASSDEF_DIRECTIVE_RE = /^[\t ]*classDef[\t ]+\S+/;
const LINKSTYLE_DIRECTIVE_RE = /^[\t ]*linkStyle[\t ]+\S+/;

/**
 * Strip the characters Mermaid v11's quadrantChart lexer rejects from
 * a `quadrant-N <label>` line: `(`, `)`, and `:`. Mermaid accepts
 * other punctuation (— · / etc.) so the human-readable meaning
 * survives — a colon-separated label like
 *
 *     quadrant-1 Critical: High priority, high risk
 *
 * becomes
 *
 *     quadrant-1 Critical High priority, high risk
 *
 * which still renders correctly inside the chart cell.
 */
export function stripParensFromQuadrantLabels(body: string): string {
  return body
    .split('\n')
    .map((line) => {
      const m = QUADRANT_LABEL_RE.exec(line);
      if (!m) return line;
      const head = m[1]!;
      const label = m[2]!.replace(/[():]/g, '').replace(/[\t ]{2,}/g, ' ').trimEnd();
      return `${head}${label}`;
    })
    .join('\n');
}

/**
 * Insert the missing `:` separator in `quadrantChart` data points
 * authored as `"Label" [x, y]` (space instead of colon between the
 * label and the coordinate block). Idempotent — lines already in
 * `"Label": [x, y]` shape are left untouched.
 */
export function insertQuadrantDataPointColon(body: string): string {
  if (detectMermaidDiagramType(body) !== 'quadrantChart') return body;
  return body
    .split('\n')
    .map((line) => {
      // Already-correct shape ends `": [...]` — skip.
      if (/":\s*\[[^\]\n]+\]\s*$/.test(line)) return line;
      const m = /^([\t ]*)("[^"\n]+")[\t ]+(\[[^\]\n]+\])\s*$/.exec(line);
      if (!m) return line;
      return `${m[1]!}${m[2]!}: ${m[3]!}`;
    })
    .join('\n');
}

/**
 * Quote `quadrantChart` data-point labels that contain characters
 * Mermaid's lexer rejects when bare — most commonly `(` and `)` from
 * dok-id annotations:
 *
 *     Deportation Rules (HD03235): [0.75, 0.85]
 *       ⇒ "Deportation Rules (HD03235)": [0.75, 0.85]
 *
 * Lines that are already quoted (`"…"`) are left untouched. Only the
 * label is wrapped; the `[x, y]` coordinate block is preserved exactly.
 * Applies only to `quadrantChart`.
 */
export function quoteQuadrantDataPointLabels(body: string): string {
  if (detectMermaidDiagramType(body) !== 'quadrantChart') return body;
  return body
    .split('\n')
    .map((line) => {
      // Data-point shape: `Label: [x, y]` with optional leading
      // whitespace. Reject lines whose head is already quoted, and
      // skip non-data lines (title / x-axis / y-axis / quadrant-N).
      const m = /^([\t ]*)([^"\n].+):\s*\[([^\]\n]+)\]\s*$/.exec(line);
      if (!m) return line;
      const indent = m[1]!;
      const label = m[2]!.trim();
      const coords = m[3]!;
      if (/^(title|x-axis|y-axis|quadrant-[1-4])\b/i.test(label)) return line;
      if (!/[(){}\[\]<>:,#&!\\/]/.test(label)) return line;
      const escaped = label.replace(/"/g, '#quot;');
      return `${indent}"${escaped}": [${coords}]`;
    })
    .join('\n');
}

/**
 * Quote the `title …` line of `xychart-beta` (and `quadrantChart`)
 * diagrams when it contains characters the Mermaid lexer rejects
 * bare — parens, commas, slashes, etc. Idempotent (already-quoted
 * titles are left untouched).
 */
export function quoteChartTitle(body: string): string {
  const type = detectMermaidDiagramType(body);
  if (type !== 'xychart-beta' && type !== 'quadrantChart') return body;
  return body
    .split('\n')
    .map((line) => {
      const m = /^([\t ]*title[\t ]+)(.+?)[\t ]*$/.exec(line);
      if (!m) return line;
      const head = m[1]!;
      const title = m[2]!;
      if (title.startsWith('"') && title.endsWith('"')) return line;
      // Trigger on bare ASCII specials OR any character outside the
      // strict `[A-Za-z0-9 .\-_]` Mermaid lexer-safe set (covers em
      // dashes, accented letters, etc. that lex as "Unrecognized text").
      if (!/[^A-Za-z0-9 .\-_]/.test(title)) return line;
      const escaped = title.replace(/"/g, '#quot;');
      return `${head}"${escaped}"`;
    })
    .join('\n');
}

/**
 * Quote bare identifiers in `xychart-beta` `x-axis [a, b, c]` arrays
 * when any contain characters Mermaid's xychart lexer rejects bare
 * (anything outside `[A-Za-z0-9 .\-_]`, e.g. umlauts, accents). Bare
 * ASCII identifiers are left untouched.
 *
 *   x-axis [KU36, FöU13, NU22]
 *     ⇒  x-axis ["KU36", "FöU13", "NU22"]
 *
 * Idempotent: items already wrapped in `"…"` stay as-is.
 */
export function quoteXychartAxisItems(body: string): string {
  if (detectMermaidDiagramType(body) !== 'xychart-beta') return body;
  return body
    .split('\n')
    .map((line) => {
      const m = /^([\t ]*x-axis[\t ]+)\[([^\]\n]*)\]([\t ]*)$/.exec(line);
      if (!m) return line;
      const head = m[1]!;
      const inside = m[2]!;
      const tail = m[3] ?? '';
      const items = inside.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      if (items.length === 0) return line;
      // Already-quoted? Leave as-is.
      if (items.every((s) => s.startsWith('"') && s.endsWith('"'))) return line;
      // Only act if at least one bare item carries lexer-unsafe chars.
      const NEEDS = /[^A-Za-z0-9 .\-_"]/;
      const needsRewrite = items.some(
        (s) => !(s.startsWith('"') && s.endsWith('"')) && NEEDS.test(s),
      );
      if (!needsRewrite) return line;
      const quoted = items.map((s) => {
        if (s.startsWith('"') && s.endsWith('"')) return s;
        return `"${s.replace(/"/g, '#quot;')}"`;
      });
      return `${head}[${quoted.join(', ')}]${tail}`;
    })
    .join('\n');
}


/**
 * Normalise integer-valued floats in `quadrantChart` data-point
 * coordinates. Mermaid v11 tokenises `1.0` as `INT(1) DOT(.) INT(0)`
 * which fails the data-point grammar `LABEL ":" "[" NUMBER "," NUMBER "]"`
 * (lexical error on the offending line).
 *
 * Only `1.0` → `1` and `0.0` → `0` are rewritten — any non-zero
 * fractional value (e.g. `0.85`, `1.5`) is left untouched so we never
 * silently change a data point's meaning. Applies only to `quadrantChart`.
 */
export function normaliseQuadrantDataPointFloats(body: string): string {
  if (detectMermaidDiagramType(body) !== 'quadrantChart') return body;
  return body
    .split('\n')
    .map((line) => {
      // Only touch data-point lines: `Label: [x, y]`.
      if (!/^\s*[^:\n]+:\s*\[[^\]]*\]\s*$/.test(line)) return line;
      return line.replace(/\[([^\]]*)\]/, (_m, inner) => {
        const fixed = String(inner)
          .split(',')
          .map((coord: string) => {
            const trimmed = coord.trim();
            if (/^[01]\.0+$/.test(trimmed)) return trimmed.split('.')[0];
            return trimmed;
          })
          .join(', ');
        return `[${fixed}]`;
      });
    })
    .join('\n');
}

/**
 * Normalise quadrantChart data-point coordinates that were authored as
 * **percentages** (`[35, 55]`, `[75, 25]`) rather than the required
 * 0..1 fractions. Only applies when **every** finite numeric coord in
 * the block is > 1 (so we don't accidentally rescale a block that mixes
 * fractions and percentages — that's a content authoring bug the user
 * must resolve). Negatives and out-of-range values that survive after
 * scaling are clamped to [0, 1] so the renderer never crashes on
 * out-of-axis points.
 */
export function normaliseQuadrantPercentageCoords(body: string): string {
  if (detectMermaidDiagramType(body) !== 'quadrantChart') return body;
  const dataLineRe = /^(\s*[^:\n]+:\s*\[)([^\]]*)(\]\s*)$/;
  const lines = body.split('\n');
  const numericCoords: number[] = [];
  for (const line of lines) {
    const m = dataLineRe.exec(line);
    if (m === null) continue;
    for (const part of m[2]!.split(',')) {
      const n = Number(part.trim());
      if (Number.isFinite(n)) numericCoords.push(n);
    }
  }
  if (numericCoords.length === 0) return body;
  const allOverOne = numericCoords.every((n) => n > 1);
  if (!allOverOne) return body;
  return lines
    .map((line) => {
      const m = dataLineRe.exec(line);
      if (m === null) return line;
      const scaled = m[2]!
        .split(',')
        .map((part) => {
          const trimmed = part.trim();
          const n = Number(trimmed);
          if (!Number.isFinite(n)) return trimmed;
          const v = Math.max(0, Math.min(1, n / 100));
          // Two-decimal trim, dropping trailing zeros, but keep `0`/`1`
          // as bare integers (lexer-clean).
          if (v === 0 || v === 1) return String(v);
          return v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
        })
        .join(', ');
      return `${m[1]}${scaled}${m[3]}`;
    })
    .join('\n');
}

/**
 * Collapse `R-01 "Long Label": [x, y]` data points (a bare identifier
 * followed by a quoted label) into the canonical Mermaid 11 form
 * `"R-01 — Long Label": [x, y]`. The bare-then-quoted pattern is a
 * common author shortcut that the Mermaid 11 grammar does not accept.
 */
export function collapseQuadrantBareThenQuotedLabels(body: string): string {
  if (detectMermaidDiagramType(body) !== 'quadrantChart') return body;
  // `^<indent>(bare-id) "(quoted)": [x, y]$` — bare-id is a token of
  // non-whitespace, non-quote characters that doesn't already start
  // with `"`.
  const re = /^(\s*)([^\s":][^\s":]*)\s+"([^"\n]+)"(\s*:\s*\[[^\]]*\]\s*)$/;
  return body
    .split('\n')
    .map((line) => {
      const m = re.exec(line);
      if (m === null) return line;
      return `${m[1]}"${m[2]} — ${m[3]}"${m[4]}`;
    })
    .join('\n');
}

/**
 * Quote unquoted node-label payloads in flowchart-family diagrams when
 * they contain characters that the Mermaid 11 lexer treats as control
 * tokens — specifically `(`, `)`, `{`, `}`, `,`, `:`. Idempotent: a
 * label that already begins with `"` is left untouched.
 *
 * Recognised label shapes (the inner payload is what gets quoted):
 *
 * - `A[…]`     square-bracket node
 * - `A(…)`     rounded node — **only when the inner payload starts
 *              with another delimiter** (e.g. `A((..))`, `A(["..."])`),
 *              never plain `A(text)` which is a valid shape on its own.
 * - `A{…}`     diamond node
 * - `A{{…}}`   hexagon node
 * - `A[/…/]`   trapezoid / parallelogram variants
 * - `A>…]`     asymmetric / flag node
 *
 * Applies only to top-level diagram types `flowchart` / `graph`.
 */
export function quoteFlowchartNodeLabels(body: string): string {
  const type = detectMermaidDiagramType(body);
  if (type !== 'flowchart' && type !== 'graph') return body;
  // For each bracket shape we have an "open" / "close" pair to match.
  // Order matters: hex `{{…}}` before `{…}`; trapezoid `[/…/]` /
  // `[\…\]` before plain `[…]`.
  const SHAPES: ReadonlyArray<readonly [RegExp, string, string]> = [
    [/\{\{([^"{}\n][^{}\n]*)\}\}/g, '{{', '}}'],
    [/\[\/([^"\n/][^\n/]*)\/\]/g, '[/', '/]'],
    [/\[\\([^"\n\\][^\n\\]*)\\\]/g, '[\\', '\\]'],
    [/\[\(([^"\n)][^\n)]*)\)\]/g, '[(', ')]'],
    [/\(\(([^"\n)][^\n)]*)\)\)/g, '((', '))'],
    [/\[([^"\]\n][^\]\n]*)\]/g, '[', ']'],
    [/\{([^"{}\n][^{}\n]*)\}/g, '{', '}'],
  ];
  const NEEDS_QUOTE_RE = /[(){}<>,:#&!\\/]/;
  return body
    .split('\n')
    .map((line) => {
      // Skip directive lines so we don't quote `style A fill:#fff`.
      if (/^[\t ]*(?:style|classDef|linkStyle|class|click|subgraph|end)\b/.test(line)) {
        return line;
      }
      let next = line;
      for (const [re, open, close] of SHAPES) {
        next = next.replace(re, (match, inner: string) => {
          if (!NEEDS_QUOTE_RE.test(inner)) return match;
          const trimmed = inner.trim();
          if (trimmed.startsWith('"') && trimmed.endsWith('"')) return match;
          // Escape any embedded quote so the produced label stays
          // syntactically valid.
          const escaped = trimmed.replace(/"/g, '#quot;');
          return `${open}"${escaped}"${close}`;
        });
      }
      return next;
    })
    .join('\n');
}

/**
 * Strip parens (and the colons that often precede a unit suffix) from
 * `x-axis` / `y-axis` lines of `quadrantChart` diagrams. Mermaid v11's
 * lexer rejects bare `(` / `)` in axis labels, so:
 *
 *     x-axis Low Impact (1) --> High Impact (5)
 *       ⇒ x-axis Low Impact 1 --> High Impact 5
 *
 * Preserves the `-->` separator and the directional reading.
 */
export function stripParensFromQuadrantAxisLabels(body: string): string {
  if (detectMermaidDiagramType(body) !== 'quadrantChart') return body;
  return body
    .split('\n')
    .map((line) => {
      if (!/^[\t ]*(?:x-axis|y-axis)\b/.test(line)) return line;
      return line.replace(/[()]/g, '').replace(/[\t ]{2,}/g, ' ').trimEnd();
    })
    .join('\n');
}

/**
 * Strip parens from `section …` headers **and** event lines in
 * `timeline` diagrams. Mermaid 11 parses `section Morning (08-12)` as
 * `section Morning` + an extra token `(08-12)` and bails with a parse
 * error; the same applies to event lines such as
 * `08:38 : CU22 published (guardianship)`. The label survives without
 * the brackets (e.g. `section Morning 08-12`,
 * `08:38 : CU22 published guardianship`).
 *
 * The `timeline` keyword line, `title …` headers, directives and
 * comments are left untouched — they accept parens fine.
 */
export function stripParensFromTimelineLines(body: string): string {
  if (detectMermaidDiagramType(body) !== 'timeline') return body;
  return body
    .split('\n')
    .map((line) => {
      if (/^[\t ]*timeline\b/.test(line)) return line;
      if (/^[\t ]*title\b/.test(line)) return line;
      if (/^[\t ]*%%/.test(line)) return line;
      if (line.indexOf('(') === -1 && line.indexOf(')') === -1) return line;
      return line.replace(/[()]/g, '').replace(/[\t ]{2,}/g, ' ').trimEnd();
    })
    .join('\n');
}

/**
 * Backwards-compatible alias for {@link stripParensFromTimelineLines}.
 * Earlier versions of the pipeline only stripped `section …` header
 * lines, so the old name is kept for any external imports.
 *
 * @deprecated Use {@link stripParensFromTimelineLines} instead.
 */
export const stripParensFromTimelineSections = stripParensFromTimelineLines;

/**
 * Repair `timeline` `section <title> : <event> : <details>` lines —
 * Mermaid 11's timeline parser expects `section <title>` on its own
 * line (events follow on the next, indented line as
 * `<time> : <event>`). When the author squashed everything onto the
 * `section` line with `:` separators the parser crashes with
 * `Cannot read properties of undefined (reading 'events')`.
 *
 * The safest semantics-preserving fix is to drop the `section`
 * keyword — the remaining `<title> : <event> : <details>` becomes a
 * valid timeline event line (the visual grouping is lost but every
 * datum survives).
 */
export function repairTimelineSectionWithEvents(body: string): string {
  if (detectMermaidDiagramType(body) !== 'timeline') return body;
  return body
    .split('\n')
    .map((line) => {
      const m = /^(\s*)section[\t ]+(.+:.+)$/.exec(line);
      if (m === null) return line;
      return `${m[1]}${m[2]}`;
    })
    .join('\n');
}

/**
 * Repair `timeline` event lines that lead with an `HH:MM` clock time:
 *
 *     08:38 : CU22 published        ⇒   08.38 : CU22 published
 *
 * Mermaid's timeline grammar treats `:` as the *separator* between
 * `<title>` and `<event>`. An event line `08:38 : CU22 published`
 * therefore parses as `title=08`, `event=38`, and the third colon
 * triggers a "Parse error". Replacing the colon between the two
 * leading digit pairs with `.` keeps the clock readable for humans
 * and parseable for Mermaid.
 *
 * Only triggers on lines that are not the `timeline` keyword,
 * `title …`, `section …`, comments, or directives.
 */
export function normaliseTimelineEventTimeColon(body: string): string {
  if (detectMermaidDiagramType(body) !== 'timeline') return body;
  return body
    .split('\n')
    .map((line) => {
      if (/^[\t ]*timeline\b/.test(line)) return line;
      if (/^[\t ]*title\b/.test(line)) return line;
      if (/^[\t ]*section\b/.test(line)) return line;
      if (/^[\t ]*%%/.test(line)) return line;
      // Match leading optional whitespace, then HH:MM with the colon
      // between two digit pairs, followed by whitespace + `:` (the
      // mermaid title/event separator) — rewrite the inner colon.
      return line.replace(/^([\t ]*)(\d{2}):(\d{2})([\t ]+:)/, '$1$2.$3$4');
    })
    .join('\n');
}

/**
 * Repair the `-.text->` / `=.text=>` typo in `flowchart` / `graph`
 * dotted/thick edge labels — the closing form requires the same dot
 * (or `=`) before `->`/`=>`, otherwise Mermaid's parser bails with a
 * "Parse error" at the offending line:
 *
 *     A -.oppose-> B          ⇒   A -.oppose.-> B
 *     A ==accept==> B         (already valid — left alone)
 *     A -.support.-> B        (already valid — left alone)
 *
 * Only triggers when the label has no `.`/`=` pair already and there
 * is at least one whitespace-separated label token. Applies only to
 * `flowchart`/`graph`.
 */
export function repairDottedEdgeLabel(body: string): string {
  const type = detectMermaidDiagramType(body);
  if (type !== 'flowchart' && type !== 'graph') return body;
  return body
    .split('\n')
    .map((line) =>
      line
        // `-.label->` ⇒ `-.label.->` (label must not contain `.->`)
        .replace(/-\.([^.\->\n][^.\n]*?)->/g, '-.$1.->')
        // `==label==>` already symmetric; handle the lopsided form
        // `==label=>` ⇒ `==label==>`.
        .replace(/==([^=\n][^=\n]*?)=>/g, '==$1==>'),
    )
    .join('\n');
}

/**
 * Drop every `style …` / `classDef …` / `linkStyle …` directive from
 * diagram bodies whose top-level diagram type does **not** accept
 * them (`quadrantChart`, `xychart-beta`, `mindmap`, `pie`, `radar`,
 * `gauge`, `journey`, `timeline`, `gantt`, `sankey-beta`).
 *
 * Bodies of supported types (`flowchart`, `graph`, `stateDiagram`,
 * `stateDiagram-v2`, `erDiagram`, `classDiagram`, `requirementDiagram`,
 * `block-beta`, `sequenceDiagram`, `gitGraph`) are returned unchanged.
 */
export function stripInvalidStyleDirectives(body: string): string {
  const type = detectMermaidDiagramType(body);
  const TYPES_THAT_REJECT_STYLE = new Set([
    'quadrantChart',
    'xychart-beta',
    'mindmap',
    'pie',
    'radar',
    'gauge',
    'journey',
    'timeline',
    'gantt',
    'sankey-beta',
    'packet-beta',
    'kanban',
    'architecture-beta',
    // sequenceDiagram does not accept `style`/`classDef`/`linkStyle`
    // directives — the v11 grammar reserves those tokens for the
    // flowchart family. Authors occasionally copy a `style GATE
    // fill:#00aa00,color:#fff` block from a flowchart and it crashes
    // the parser; dropping the directive is loss-less (the diagram
    // already inherits the dark-theme defaults from `themeVariables`).
    'sequenceDiagram',
  ]);
  if (!TYPES_THAT_REJECT_STYLE.has(type)) return body;
  return body
    .split('\n')
    .filter(
      (line) =>
        !STYLE_DIRECTIVE_RE.test(line) &&
        !CLASSDEF_DIRECTIVE_RE.test(line) &&
        !LINKSTYLE_DIRECTIVE_RE.test(line),
    )
    .join('\n')
    // Collapse the trailing blank-line run that the removed lines
    // leave behind so the resulting body still parses cleanly.
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n+$/, '\n');
}

/**
 * Repair the renderer-side `-->|label]` typo (closing `]` where `|`
 * was intended) at source. The Mermaid v11 flowchart parser rejects
 * it; the renderer already auto-repairs at render time
 * (see `repairEdgeLabelClosingBracket` in
 * `scripts/render-lib/markdown/mermaid-preprocess.ts`). Applying the
 * fix at source means the artifact passes offline tooling too.
 */
export function repairEdgeLabelClosingBracket(body: string): string {
  // Matches: `--`, then any chain of `-` characters, `>`, `|`,
  // then any text not containing `|` or `]`, then `]`.
  // Capture group 1 = everything up to and including the label text.
  return body.replace(/(--+>\|[^|\]\n]*)\]/g, '$1|');
}

/**
 * Replace an unsupported top-level diagram (`radar`, `bar`, `gauge`)
 * with a minimal **valid** `flowchart LR` placeholder that:
 *
 *  1. Parses cleanly in Mermaid 11 core (no plugin required).
 *  2. Carries the original diagram body inside a `%% original-source:`
 *     comment block, so the authoring intent is preserved and a human
 *     reviewer can promote it back when the plugin lands.
 *  3. Renders as a single labelled node that names the missing
 *     diagram type — making the regression visible at the article
 *     surface rather than failing silently.
 */
export function disableUnsupportedDiagramType(body: string): string {
  const type = detectMermaidDiagramType(body);
  const UNSUPPORTED = new Set(['radar', 'bar', 'gauge']);
  if (!UNSUPPORTED.has(type)) return body;
  const commented = body
    .split('\n')
    .map((line) => (line === '' ? '%%' : `%% ${line}`))
    .join('\n');
  return [
    `flowchart LR`,
    `    unsupported["⚠️ Mermaid ${type} diagram unsupported — see %% original-source below"]`,
    `%% mermaid-unsupported-type: ${type}`,
    `%% original-source:`,
    commented,
  ].join('\n');
}

/**
 * Repair the **closing-bracket-as-pipe typo** seen in flowchart /
 * graph node-label declarations: the author meant to close a quoted
 * node label with `"]` but typed `"|` instead. Two failure modes
 * occur in the wild:
 *
 *   A. `B2["SfU16<br/>Migration debate"| -.->|"…"| M3`
 *      — followed by an edge operator; the orphan `|` confuses the
 *      lexer. Fix: `"|` ⇒ `"]`.
 *
 *   B. `MP["🔴 MP (18)\nNohrén"| OPP`
 *      — followed by a bare identifier (no edge operator). The
 *      author both mistyped the bracket *and* dropped the edge.
 *      Fix: `"|` ⇒ `"] -->` so the dangling node connects to the
 *      following identifier.
 *
 * Applies only to `flowchart`/`graph`. Idempotent: a correctly closed
 * `"]` is never touched.
 */
export function repairFlowchartLabelClosingPipe(body: string): string {
  const type = detectMermaidDiagramType(body);
  if (type !== 'flowchart' && type !== 'graph') return body;
  return body
    .split('\n')
    .map((line) => {
      let next = line;
      // Case B first (more specific): `"|` followed by whitespace and
      // an identifier at end-of-line. We do this BEFORE case A so the
      // generic `"|` ⇒ `"]` rewrite doesn't strand the trailing ID.
      next = next.replace(
        /(\["[^"\n]*?")\|([\t ]+)([A-Za-z_][\w]*)(\s*)$/u,
        '$1]$2-->$2$3$4',
      );
      // Case A: `"|` followed by an edge operator (-, =, .).
      next = next.replace(/(\["[^"\n]*?")\|(\s*[-=.])/g, '$1]$2');
      return next;
    })
    .join('\n');
}

/**
 * Replace `\"` (backslash-escaped quote) inside flowchart / graph
 * `["…"]` node labels with the Mermaid-safe `#quot;` entity. The
 * backslash escape is **not** recognised by the Mermaid 11 lexer: a
 * `\"` inside a quoted string terminates the string and the trailing
 * characters become orphan tokens (typical failure: Hebrew/RTL
 * labels copied from a JSON source — `["…תחזית תמ\"ג כלפי מטה"]`).
 *
 * Applies only to `flowchart` / `graph`. Idempotent — labels with no
 * `\"` are returned unchanged.
 */
export function escapeBackslashQuoteInFlowchartLabels(body: string): string {
  const type = detectMermaidDiagramType(body);
  if (type !== 'flowchart' && type !== 'graph') return body;
  return body
    .split('\n')
    .map((line) =>
      line.replace(/\["((?:[^"\n\\]|\\[^"]|\\")*?)"\]/g, (match, inner: string) => {
        if (!inner.includes('\\"')) return match;
        return `["${inner.replace(/\\"/g, '#quot;')}"]`;
      }),
    )
    .join('\n');
}

/**
 * Strip the bracketed label re-declaration from `style <id>[…]` lines
 * in flowchart / graph diagrams. Mermaid 11's `style` directive
 * accepts only `style <ID> <prop>:<value>[, <prop>:<value>]*` — a
 * bracketed label suffix (`style C["Centerpartiet"] fill:#006600`) is
 * a parse error. The bracketed payload is redundant with the node's
 * original declaration, so dropping it is loss-less.
 *
 * Applies only to `flowchart` / `graph`. Handles `[…]`, `(…)`,
 * `{…}`, and the compound shapes `[(…)]`, `((…))`, `{{…}}`.
 */
export function stripBracketLabelFromStyleReference(body: string): string {
  const type = detectMermaidDiagramType(body);
  if (type !== 'flowchart' && type !== 'graph') return body;
  return body
    .split('\n')
    .map((line) => {
      if (!/^[\t ]*style[\t ]+/.test(line)) return line;
      // `style ID[label] fill:…` (any shape) ⇒ `style ID fill:…`
      return line.replace(
        /^([\t ]*style[\t ]+[A-Za-z_][\w-]*)(?:\[\(.+?\)\]|\(\(.+?\)\)|\{\{.+?\}\}|\[.+?\]|\(.+?\)|\{.+?\})([\t ]+)/,
        '$1$2',
      );
    })
    .join('\n');
}

/**
 * Quote flowchart / graph node labels that contain an **inner** `[`
 * inside the outer bracketed payload — e.g.
 *
 *     Hamas[55 MSEK\nHamas-linked payment\n[A2 unverified]]
 *
 * The Mermaid 11 lexer reads the first `]` as the node closer and
 * bails on the trailing `]`. Wrapping the whole content in `"…"` and
 * preserving the inner `[…]` text fixes the parse — quoted node
 * labels accept `[` and `]` as literal text.
 *
 * Idempotent: labels that are already quoted or that have no nested
 * `[` are returned unchanged. Runs before `quoteFlowchartNodeLabels`
 * so that pipeline does not see the malformed bracket nesting.
 */
export function quoteFlowchartLabelsWithInnerBracket(body: string): string {
  const type = detectMermaidDiagramType(body);
  if (type !== 'flowchart' && type !== 'graph') return body;
  return body
    .split('\n')
    .map((line) => {
      // Skip directive lines.
      if (/^[\t ]*(?:style|classDef|linkStyle|class|click|subgraph|end)\b/.test(line)) {
        return line;
      }
      // Match `<id>[…[inner]…]` (exactly one nested `[…]` inside the
      // outer brackets). The inner content must not itself contain
      // unbalanced brackets, so we capture greedily but require the
      // outer payload to start with non-quote text.
      return line.replace(
        /([A-Za-z_][\w-]*)\[([^"\[\]\n]*\[[^\[\]\n]*\][^\[\]\n]*)\]/g,
        (_match, id: string, inner: string) =>
          `${id}["${inner.replace(/"/g, '#quot;')}"]`,
      );
    })
    .join('\n');
}

/**
 * Quote flowchart / graph **edge labels** (`-->|…|`, `==>|…|`,
 * `-.->|…|`) when their inner payload contains characters the
 * Mermaid 11 lexer rejects unquoted: `(`, `)`, `{`, `}`, `:`, `,`,
 * `#`. The fix wraps the inner text in `"…"` which the lexer accepts
 * as an opaque string literal.
 *
 *     C_Position --> |C accepts (60%)| SD_Check
 *       ⇒ C_Position --> |"C accepts (60%)"| SD_Check
 *
 * Idempotent: payloads already wrapped in `"…"` are left alone.
 */
export function quoteFlowchartEdgeLabelsWithSpecials(body: string): string {
  const type = detectMermaidDiagramType(body);
  if (type !== 'flowchart' && type !== 'graph') return body;
  const NEEDS_QUOTE_RE = /[(){}:,#]/;
  return body
    .split('\n')
    .map((line) => {
      // The line must contain an edge operator immediately before the
      // pipe pair (so we don't accidentally quote node-shape pipes).
      // Match operators `-->`, `==>`, `-.->`, `===>`, `--x`, `--o`,
      // `~~~`, possibly preceded by whitespace.
      return line.replace(
        /(--+>|==+>|-\.+->|=\.+=>|--[xo]|~~~)([\t ]*)\|([^"|\n][^|\n]*)\|/g,
        (match, op: string, sp: string, inner: string) => {
          if (!NEEDS_QUOTE_RE.test(inner)) return match;
          const trimmed = inner.trim();
          if (trimmed.startsWith('"') && trimmed.endsWith('"')) return match;
          return `${op}${sp}|"${trimmed.replace(/"/g, '#quot;')}"|`;
        },
      );
    })
    .join('\n');
}

/**
 * Quote mindmap node-label payloads when they contain characters the
 * Mermaid 11 mindmap parser treats as control tokens — specifically
 * `(`, `)`, `:`, and `#`. The `:` is the icon-syntax delimiter
 * (`::icon(fa fa-…)`); a bare colon in human text (e.g.
 * `HD11726: constitutional knowledge question`) crashes the parser
 * with `Expecting 'NL', got ':' ` even though no icon was intended.
 *
 * The fix wraps the affected line content in the bracketed-shape
 * form `["…"]`, which the mindmap grammar accepts as an opaque
 * label. Indentation (which carries the mindmap tree depth) is
 * preserved verbatim.
 *
 * Skips:
 *   * the `mindmap` keyword line,
 *   * the `root((…))` line (intentional double parens),
 *   * comments (`%%…`),
 *   * blank lines,
 *   * lines already wrapped in `[…]`, `(…)`, `((…))`, `[(…)]`, or
 *     `{…}` — these were authored explicitly and need no quoting.
 *
 * Applies only to `mindmap`.
 */
export function quoteMindmapNodeLabels(body: string): string {
  if (detectMermaidDiagramType(body) !== 'mindmap') return body;
  const NEEDS_QUOTE_RE = /[():#]/;
  return body
    .split('\n')
    .map((line) => {
      if (/^[\t ]*mindmap\b/.test(line)) return line;
      if (/^[\t ]*%%/.test(line)) return line;
      if (/^[\t ]*$/.test(line)) return line;
      if (/^[\t ]*root\s*\(\(/.test(line)) return line;
      const m = /^([\t ]+)(.+)$/.exec(line);
      if (m === null) return line;
      const indent = m[1]!;
      const content = m[2]!.trimEnd();
      // Skip if already wrapped in a shape.
      if (/^\[.*\]$/.test(content)) return line;
      if (/^\(\(.*\)\)$/.test(content)) return line;
      if (/^\[\(.*\)\]$/.test(content)) return line;
      if (/^\(.*\)$/.test(content)) return line;
      if (/^\{.*\}$/.test(content)) return line;
      if (/^"[^"]*"$/.test(content)) return line;
      if (!NEEDS_QUOTE_RE.test(content)) return line;
      return `${indent}["${content.replace(/"/g, '#quot;')}"]`;
    })
    .join('\n');
}

/**
 * Normalise quadrantChart data-point coordinates that were authored
 * on a **signed** axis (range `[-1, 1]`, e.g.
 * `Implementation bottleneck: [0.75, -0.65]`) into the required
 * `[0, 1]` range using the affine map `v ⇒ (v + 1) / 2`.
 *
 * Mermaid 11's quadrantChart lexer rejects negative numerics, so the
 * authoring convention "negative = threat / down-left quadrant" is
 * mechanically incompatible with the renderer. Rescaling preserves
 * the spatial layout: a value of `-1` lands at `0` (origin edge),
 * `0` lands at `0.5` (centre), `+1` lands at `1` (far edge).
 *
 * Trigger conditions (all must hold; otherwise body returned
 * unchanged):
 *
 *   1. Top-level diagram type is `quadrantChart`.
 *   2. At least one numeric coordinate is `< 0`.
 *   3. **Every** numeric coordinate is in `[-1, 1]` (so we never
 *      silently rescale a mixed-percentage / mixed-fraction block).
 *
 * Numbers are emitted with at most two decimal places, trailing
 * zeros trimmed, identical to the convention in
 * {@link normaliseQuadrantPercentageCoords}.
 */
export function normaliseQuadrantSignedCoords(body: string): string {
  if (detectMermaidDiagramType(body) !== 'quadrantChart') return body;
  const dataLineRe = /^(\s*[^:\n]+:\s*\[)([^\]]*)(\]\s*)$/;
  const lines = body.split('\n');
  const numericCoords: number[] = [];
  for (const line of lines) {
    const m = dataLineRe.exec(line);
    if (m === null) continue;
    for (const part of m[2]!.split(',')) {
      const n = Number(part.trim());
      if (Number.isFinite(n)) numericCoords.push(n);
    }
  }
  if (numericCoords.length === 0) return body;
  const allInSigned = numericCoords.every((n) => n >= -1 && n <= 1);
  const hasNegative = numericCoords.some((n) => n < 0);
  if (!allInSigned || !hasNegative) return body;
  return lines
    .map((line) => {
      const m = dataLineRe.exec(line);
      if (m === null) return line;
      const scaled = m[2]!
        .split(',')
        .map((part) => {
          const trimmed = part.trim();
          const n = Number(trimmed);
          if (!Number.isFinite(n)) return trimmed;
          const v = Math.max(0, Math.min(1, (n + 1) / 2));
          if (v === 0 || v === 1) return String(v);
          return v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
        })
        .join(', ');
      return `${m[1]}${scaled}${m[3]}`;
    })
    .join('\n');
}


/**
 * Repair pipeline used by the orchestrator. Applies the safe fixes in
 * the order that yields the most converging behaviour observed during
 * the corpus scan:
 *
 *   1. quadrant label parens (lexical-error class A)
 *   2. quadrant data-point float normalisation (lexical-error class B)
 *   3. timeline section parens (parse-error class A)
 *   4. flowchart node label quoting (parse-error class B)
 *   5. invalid `style` / `classDef` / `linkStyle` purge
 *      (chart-type-rejects-style class)
 *   6. edge-label closing-bracket typo (`-->|x]` → `-->|x|`)
 *   7. unsupported diagram replacement (last resort)
 *
 * @param body Raw diagram body, in the same shape extract.ts produces.
 * @returns Repaired body. If no rule matched, returns the input
 *          unchanged (string-equal).
 */
export function repairMermaidBlock(body: string): string {
  let next = body;
  next = stripParensFromQuadrantLabels(next);
  next = stripParensFromQuadrantAxisLabels(next);
  next = collapseQuadrantBareThenQuotedLabels(next);
  next = insertQuadrantDataPointColon(next);
  next = normaliseQuadrantDataPointFloats(next);
  next = normaliseQuadrantPercentageCoords(next);
  next = normaliseQuadrantSignedCoords(next);
  next = quoteQuadrantDataPointLabels(next);
  next = quoteChartTitle(next);
  next = quoteXychartAxisItems(next);
  next = stripParensFromTimelineLines(next);
  next = repairTimelineSectionWithEvents(next);
  next = normaliseTimelineEventTimeColon(next);
  // Flowchart label structural repairs MUST precede the generic
  // node-label quoter — that function assumes balanced `[…]` shapes
  // and well-formed `"…"` payloads.
  next = repairFlowchartLabelClosingPipe(next);
  next = escapeBackslashQuoteInFlowchartLabels(next);
  next = stripBracketLabelFromStyleReference(next);
  next = quoteFlowchartLabelsWithInnerBracket(next);
  next = quoteFlowchartNodeLabels(next);
  next = quoteFlowchartEdgeLabelsWithSpecials(next);
  next = quoteMindmapNodeLabels(next);
  next = repairDottedEdgeLabel(next);
  next = stripInvalidStyleDirectives(next);
  next = repairEdgeLabelClosingBracket(next);
  next = disableUnsupportedDiagramType(next);
  return next;
}
