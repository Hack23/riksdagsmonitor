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
 * Strip parens from `section …` headers in `timeline` diagrams.
 * Mermaid 11 parses `section Morning (08-12)` as `section Morning` +
 * an extra token `(08-12)` and bails with a parse error. The label
 * survives without the brackets (e.g. `section Morning 08-12`).
 */
export function stripParensFromTimelineSections(body: string): string {
  if (detectMermaidDiagramType(body) !== 'timeline') return body;
  return body
    .split('\n')
    .map((line) => {
      if (!/^[\t ]*section\b/.test(line)) return line;
      return line.replace(/[()]/g, '').replace(/[\t ]{2,}/g, ' ').trimEnd();
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
  next = quoteQuadrantDataPointLabels(next);
  next = quoteChartTitle(next);
  next = quoteXychartAxisItems(next);
  next = stripParensFromTimelineSections(next);
  next = quoteFlowchartNodeLabels(next);
  next = repairDottedEdgeLabel(next);
  next = stripInvalidStyleDirectives(next);
  next = repairEdgeLabelClosingBracket(next);
  next = disableUnsupportedDiagramType(next);
  return next;
}
