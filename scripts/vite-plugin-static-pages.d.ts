/**
 * Type declarations for `scripts/vite-plugin-static-pages.js`.
 *
 * The plugin is authored in plain JavaScript so it can be loaded
 * directly from `vite.config.js` (which is itself ESM JS and runs
 * before tsx is on the loader path). This `.d.ts` exposes its
 * public contract to TypeScript consumers — primarily the unit
 * tests under `tests/vite-plugin-static-pages.test.ts`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Plugin } from 'vite';

/** A single source path that contributes to a {@link StaticPageSet}. */
export interface StaticPageSource {
  /**
   * Path relative to {@link StaticPagesPluginOptions.projectRoot}.
   * May be either a literal `*.html` file or a directory whose
   * `*.html` children should be emitted.
   */
  readonly path: string;
  /**
   * When `path` is a directory, also walk subdirectories. Defaults
   * to `false` (top-level files only).
   */
  readonly recurse?: boolean;
}

/** A logical grouping of static HTML pages to emit. */
export interface StaticPageSet {
  /** Human-readable label used in the build summary log line. */
  readonly label: string;
  /** Source files / directories that constitute this set. */
  readonly sources: ReadonlyArray<StaticPageSource>;
}

/** Configuration accepted by the {@link staticPagesPlugin} factory. */
export interface StaticPagesPluginOptions {
  /** Absolute path to the project root (used to resolve `sources`). */
  readonly projectRoot: string;
  /**
   * Vite output directory. Either an absolute path or a path
   * relative to {@link projectRoot}. Typically `'dist'`.
   */
  readonly outDir: string;
  /** The static page sets to emit, in declaration order. */
  readonly pageSets: ReadonlyArray<StaticPageSet>;
}

/**
 * Vite plugin factory — emits pre-rendered static HTML pages
 * outside Rollup's module graph so the build does not OOM at
 * 4 250+ modules.
 *
 * See `scripts/vite-plugin-static-pages.js` for the full design
 * rationale.
 */
declare function staticPagesPlugin(options: StaticPagesPluginOptions): Plugin;

export default staticPagesPlugin;
