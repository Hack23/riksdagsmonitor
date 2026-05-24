/**
 * @module scripts/validators/mermaid-diagrams/parse
 * @description Real Mermaid-grammar validator. Runs the full
 *              `mermaid@11` parser in Node by bootstrapping a minimal
 *              `happy-dom` window and a no-op `DOMPurify`. This is the
 *              same parser invoked client-side, so a block that passes
 *              here is guaranteed to render in the browser; one that
 *              fails here is exactly the parse error a reader would
 *              see on the production site.
 *
 *              Why a real parser instead of regex? AI-authored
 *              diagrams routinely combine valid keywords in invalid
 *              positions (e.g. `style …` after `quadrantChart` data
 *              points, or `radar`/`bar` as top-level diagram types
 *              that are plugin-only). Regex heuristics miss these;
 *              only the Mermaid grammar is authoritative.
 *
 *              The parser is loaded **lazily** the first time
 *              {@link parseMermaidBlock} is called so importing this
 *              module from a worker that never validates a diagram is
 *              free of side effects.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

interface MermaidParseFn {
  parse: (
    src: string,
    opts?: { suppressErrors?: boolean },
  ) => Promise<{ diagramType: string } | false>;
  initialize: (cfg: Record<string, unknown>) => void;
}

let mermaidPromise: Promise<MermaidParseFn> | null = null;

/**
 * Bootstrap `globalThis.window`, `globalThis.document`, and
 * `globalThis.DOMPurify` so the `mermaid` package can be imported in
 * a plain Node process. Idempotent — safe to call from multiple
 * concurrent test files that share the module registry.
 *
 * We intentionally use the same versions of `mermaid` and `happy-dom`
 * that the production renderer / client bundles ship (declared in
 * the root `package.json`), so divergence between validator and
 * runtime is impossible.
 */
async function loadMermaid(): Promise<MermaidParseFn> {
  if (mermaidPromise) return mermaidPromise;
  mermaidPromise = (async () => {
    const { Window } = await import('happy-dom');
    const w = new Window();
    const g = globalThis as unknown as {
      window?: unknown;
      document?: unknown;
      DOMPurify?: unknown;
      navigator?: unknown;
    };
    if (!g.window) g.window = w;
    if (!g.document) g.document = w.document;
    if (!g.navigator) g.navigator = w.navigator;
    if (!g.DOMPurify) {
      g.DOMPurify = {
        sanitize: (s: string) => s,
        addHook: () => {
          /* no-op */
        },
      };
    }
    const mod = (await import('mermaid')) as unknown as { default: MermaidParseFn };
    const mermaid = mod.default;
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      logLevel: 'fatal',
    });
    return mermaid;
  })();
  return mermaidPromise;
}

/**
 * One parse violation, ready to be reported by the CLI or asserted by
 * vitest. `bodyLineNumber` is 1-indexed and refers to the line **inside
 * the diagram body** (i.e. relative to `bodyStartLineNumber` from
 * {@link MermaidBlock}). The CLI converts this to an absolute file line
 * by adding `bodyStartLineNumber - 1`.
 */
export interface MermaidParseViolation {
  readonly message: string;
  readonly bodyLineNumber: number | null;
  readonly category: MermaidParseCategory;
}

export type MermaidParseCategory =
  | 'unsupported-diagram-type'
  | 'invalid-style-directive'
  | 'mindmap-multiroot'
  | 'lexical-error'
  | 'parse-error'
  | 'empty-block'
  | 'unknown';

/**
 * Categorise a raw `mermaid.parse()` error message into one of
 * {@link MermaidParseCategory} so reports + autofix dispatch can act
 * on the structured cause rather than re-grepping the message at every
 * call site.
 *
 * Pure function — safe to call without bootstrapping Mermaid.
 */
export function categoriseMermaidParseError(message: string): MermaidParseCategory {
  if (/^No diagram type detected/i.test(message)) {
    // Either truly empty body (handled separately) or an unsupported
    // top-level keyword such as `radar`/`bar`/`gauge`.
    return /for text:\s*(radar|bar|gauge)\b/i.test(message)
      ? 'unsupported-diagram-type'
      : 'empty-block';
  }
  if (/There can be only one root/i.test(message)) return 'mindmap-multiroot';
  if (/Lexical error/i.test(message)) return 'lexical-error';
  if (/Expecting\s+'STYLE'/.test(message)) return 'invalid-style-directive';
  if (/Parse error/i.test(message)) return 'parse-error';
  return 'unknown';
}

/**
 * Parse a single Mermaid diagram body. Returns `null` when the body
 * is syntactically valid; otherwise returns the structured violation.
 *
 * @param body Raw diagram body (everything between the opening
 *             ` ```mermaid ` and the closing ` ``` `), exactly as it
 *             would be rendered.
 */
export async function parseMermaidBlock(
  body: string,
): Promise<MermaidParseViolation | null> {
  if (body.trim() === '') {
    return {
      message: 'Empty mermaid block',
      bodyLineNumber: 1,
      category: 'empty-block',
    };
  }
  const mermaid = await loadMermaid();
  try {
    await mermaid.parse(body);
    return null;
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    // First line of the Mermaid error message carries the diagnostic
    // (subsequent lines are the source listing with the `^` caret).
    const headLine = raw.split('\n')[0]!;
    const lineMatch = /on line (\d+)/i.exec(headLine);
    return {
      message: headLine.trim(),
      bodyLineNumber: lineMatch ? Number(lineMatch[1]) : null,
      category: categoriseMermaidParseError(headLine),
    };
  }
}

/**
 * Convenience: reset the cached Mermaid loader. Only used by the
 * vitest suite to exercise the bootstrap path more than once; the CLI
 * never needs this.
 *
 * @internal
 */
export function __resetMermaidLoaderForTests(): void {
  mermaidPromise = null;
}
