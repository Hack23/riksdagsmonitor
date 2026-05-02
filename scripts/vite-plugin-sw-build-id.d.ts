/**
 * Type declarations for `scripts/vite-plugin-sw-build-id.js`.
 *
 * The plugin is authored in plain JavaScript so it can be loaded
 * directly from `vite.config.js` (which is itself ESM JS and runs
 * before tsx is on the loader path). This `.d.ts` exposes its
 * public contract to TypeScript consumers — primarily the unit
 * tests under `tests/vite-plugin-sw-build-id.test.ts`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Configuration accepted by the {@link swBuildIdPlugin} factory. */
export interface SwBuildIdPluginOptions {
  /** Absolute path to the project root (used to resolve `public/sw.js`). */
  readonly projectRoot: string;
  /**
   * Vite output directory. Either an absolute path or a path relative to
   * {@link projectRoot}. Defaults to `'dist'`.
   */
  readonly outDir?: string;
}

/**
 * Concrete shape of the plugin returned by the factory.
 * Narrowed from the generic Vite `Plugin` type so tests can access
 * `closeBundle.handler` / `.order` / `.sequential` without union narrowing.
 */
export interface SwBuildIdPlugin {
  readonly name: 'sw-build-id';
  readonly apply: 'build';
  readonly enforce: 'post';
  readonly closeBundle: {
    readonly order: 'post';
    readonly sequential: true;
    handler(): void;
  };
}

/**
 * Vite plugin factory — substitutes the `__BUILD_ID__` placeholder in
 * `public/sw.js` with a short per-build unique identifier when emitting
 * `dist/sw.js`.
 *
 * The build-id resolution order is:
 * 1. `process.env.GITHUB_SHA` (first 12 chars) — GitHub Actions primary signal.
 * 2. `git rev-parse --short=12 HEAD` — local builds / release runs.
 * 3. `Date.now().toString(36)` — final fallback for sandboxed CI contexts.
 *
 * See `scripts/vite-plugin-sw-build-id.js` for the full design rationale.
 */
declare function swBuildIdPlugin(options: SwBuildIdPluginOptions): SwBuildIdPlugin;

export default swBuildIdPlugin;
