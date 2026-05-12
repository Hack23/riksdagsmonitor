/**
 * Ambient module declaration for the `js-yaml` package.
 *
 * The upstream package ships no TypeScript type declarations bundled
 * (they live in `@types/js-yaml`, which we don't add to keep the
 * dev-dep surface small).  Declare only the `load` surface that
 * `tests/css-purge-and-minify.test.ts` and any other consumer in this
 * repo actually use.
 *
 * @see https://www.npmjs.com/package/js-yaml
 * @author Hack23 AB
 * @license Apache-2.0
 */
declare module 'js-yaml' {
  /**
   * Parse a YAML string into a JavaScript value (object/array/primitive).
   *
   * @param str YAML text to parse.
   * @returns Parsed value, or `undefined` if `str` is empty.
   */
  export function load(str: string): unknown;

  const _default: { load: typeof load };
  export default _default;
}
