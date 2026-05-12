/**
 * Ambient module declaration for the `minify` (coderaiser/minify) package.
 *
 * The upstream package ships no TypeScript type declarations, and there is
 * no `@types/minify` on DefinitelyTyped.  Add only the surface that
 * `scripts/minify-dist.ts` actually uses.
 *
 * The package is dual-purpose: imported as `{ minify }` it returns a
 * Promise<string> that resolves to the minified content of the file at
 * the given absolute path.
 *
 * @see https://www.npmjs.com/package/minify
 * @author Hack23 AB
 * @license Apache-2.0
 */
declare module 'minify' {
  /**
   * Minify the file at `filePath` and return the minified content.
   *
   * Detects content type from the file extension and dispatches to the
   * appropriate minifier (clean-css for `.css`, html-minifier-terser for
   * `.html`, terser for `.js` / `.mjs`, etc.).
   *
   * @param filePath Absolute or process-relative path to the file to minify.
   * @returns Minified content as a UTF-8 string.
   */
  export function minify(filePath: string): Promise<string>;
}
