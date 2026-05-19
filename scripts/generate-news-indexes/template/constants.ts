/**
 * @module generate-news-indexes/template/constants
 * @description Constants shared by news-index template modules.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Default app version when `npm_package_version` is not set. */
export const APP_VERSION_FALLBACK = '0.0.0';

/** Canonical absolute base URL used in JSON-LD blocks. */
export const BASE_URL = 'https://riksdagsmonitor.com';

/** Single source of truth for the app-version marker in the rendered HTML. */
export function appVersionMarker(): string {
  const version = (process.env.npm_package_version ?? APP_VERSION_FALLBACK).trim();
  return `<!-- app-version: v${version} -->`;
}
