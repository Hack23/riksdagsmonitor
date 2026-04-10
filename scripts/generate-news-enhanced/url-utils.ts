/**
 * @module generate-news-enhanced/url-utils
 * @description URL parsing and text sanitization utilities for the
 * deep-inspection article generator. Provides Riksdag/government URL
 * extraction, GitHub raw URL conversion, and XSS-safe text cleaning.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Extract a `dok_id` from a Riksdag or data.riksdagen.se document URL.
 * Returns `null` if the URL is not a recognised Riksdag document URL.
 *
 * Supported patterns:
 * - `https://riksdagen.se/sv/dokument-och-lagar/dokument/{type}/{dok_id}`
 * - `https://data.riksdagen.se/dokument/{dok_id}[.json|.xml|.html]`
 */
export function extractDocIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const segments = parsed.pathname.split('/').filter(Boolean);

    // https://riksdagen.se/sv/dokument-och-lagar/dokument/{type}/{dok_id}
    if (hostname === 'riksdagen.se' || hostname === 'www.riksdagen.se') {
      const dokIdx = segments.indexOf('dokument');
      if (dokIdx >= 0 && segments.length > dokIdx + 2) {
        return segments[dokIdx + 2];
      }
    }

    // https://data.riksdagen.se/dokument/{dok_id}[.json|.xml|.html]
    if (hostname === 'data.riksdagen.se') {
      const dokIdx = segments.indexOf('dokument');
      if (dokIdx >= 0 && segments.length > dokIdx + 1) {
        return segments[dokIdx + 1].replace(/\.(json|xml|html|pdf)$/i, ''); // strip known file extensions
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Determine whether a URL points to a government (regeringen.se) resource
 * that can be fetched via the get_g0v_document_content MCP tool.
 */
export function isGovernmentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === 'regeringen.se' || hostname === 'www.regeringen.se';
  } catch {
    return false;
  }
}

/**
 * Determine whether a URL points to a GitHub repository resource
 * (github.com or raw.githubusercontent.com) that can be fetched as raw content.
 */
export function isGitHubUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === 'github.com'
      || hostname === 'www.github.com'
      || hostname === 'raw.githubusercontent.com';
  } catch {
    return false;
  }
}

/**
 * Convert a GitHub blob/tree URL to a raw.githubusercontent.com URL.
 * Handles patterns like:
 *   - https://github.com/{owner}/{repo}/blob/{branch}/{path}
 *   - https://github.com/{owner}/{repo}/raw/{branch}/{path}
 *   - https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path} (returned as-is)
 *
 * @returns The raw URL, or null if the URL cannot be converted.
 */
export function toGitHubRawUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Already a raw URL — return as-is
    if (hostname === 'raw.githubusercontent.com') {
      return url;
    }

    if (hostname !== 'github.com' && hostname !== 'www.github.com') {
      return null;
    }

    // Path: /{owner}/{repo}/blob/{branch}/{...path}
    // or:   /{owner}/{repo}/raw/{branch}/{...path}
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length < 4) return null;

    const [owner, repo, refType, ...rest] = segments;
    if (refType !== 'blob' && refType !== 'raw') return null;

    // rest = [branch, ...pathParts]
    return `https://raw.githubusercontent.com/${owner}/${repo}/${rest.join('/')}`;
  } catch {
    return null;
  }
}

/**
 * Compute a short, deterministic hash suffix from a URL path string.
 * Used to generate collision-resistant `dok_id` values for documents
 * fetched from government or GitHub URLs.
 *
 * The hash is a simple DJB2-style left-shift-and-add over each character,
 * rendered in base-36. A leading `-` (from negative ints) is replaced with `n`.
 */
export function hashPathSuffix(path: string): string {
  return path
    .split('')
    .reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
    .toString(36)
    .replace(/^-/, 'n');
}

/**
 * Strip HTML tags from a user-supplied string to prevent XSS.
 * Uses a multi-pass loop to handle nested tag reconstruction attempts
 * (e.g. `<scr<script>ipt>`). Returns **plain text** — callers must
 * apply `escapeHtml()` at their render sites so escaping happens exactly once.
 */
export function sanitizePlainText(text: string): string {
  let cleaned = text;
  let prev: string;
  do {
    prev = cleaned;
    cleaned = cleaned.replace(/<[^>]*>/g, '');
  } while (cleaned !== prev);
  return cleaned;
}
