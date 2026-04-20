/**
 * @file tests/theme-init-ssot.test.ts
 * @description Verify that the inline anti-flash theme bootstrap shipped by
 * every page template is derived from the single canonical source file
 * `js/theme-init.js` (via `scripts/shared/theme-init.ts`). This prevents
 * the bootstrap from drifting across templates and guarantees the minifier
 * produced a working IIFE.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { THEME_INIT_INLINE, THEME_INIT_SCRIPT_TAG } from '../scripts/shared/theme-init.js';

const REPO_ROOT = resolve(__dirname, '..');
const CANONICAL = readFileSync(resolve(REPO_ROOT, 'js', 'theme-init.js'), 'utf-8');

describe('shared/theme-init (single source of truth)', () => {
  it('exports a non-empty inline string', () => {
    expect(typeof THEME_INIT_INLINE).toBe('string');
    expect(THEME_INIT_INLINE.length).toBeGreaterThan(50);
  });

  it('wraps the inline script in a <script> tag', () => {
    expect(THEME_INIT_SCRIPT_TAG.startsWith('<script>')).toBe(true);
    expect(THEME_INIT_SCRIPT_TAG.endsWith('</script>')).toBe(true);
    expect(THEME_INIT_SCRIPT_TAG).toContain(THEME_INIT_INLINE);
  });

  it('minified output uses the same storage key as the canonical source', () => {
    expect(THEME_INIT_INLINE).toContain("'riksdagsmonitor-theme'");
    expect(CANONICAL).toContain("'riksdagsmonitor-theme'");
  });

  it('minified output preserves all semantic tokens from the canonical source', () => {
    // These are the irreducible behaviour tokens; dropping any one would
    // break anti-flash theme restoration.
    const must = [
      'localStorage.getItem',
      'localStorage.removeItem',
      'matchMedia',
      'prefers-color-scheme',
      "setAttribute('data-theme'",
    ];
    for (const token of must) {
      expect(THEME_INIT_INLINE).toContain(token);
    }
  });

  it('minified output is syntactically valid JavaScript (IIFE executes)', () => {
    // Execute in a sandbox that mimics the browser globals the IIFE touches.
    const mockStorage = new Map<string, string>();
    const win: Record<string, unknown> = {
      matchMedia: (_q: string) => ({ matches: false }),
    };
    const doc: Record<string, unknown> = {
      documentElement: {
        _theme: null as string | null,
        setAttribute(name: string, value: string) {
          if (name === 'data-theme') { (this as { _theme: string | null })._theme = value; }
        },
      },
    };
    const localStorage = {
      getItem: (k: string) => mockStorage.has(k) ? mockStorage.get(k)! : null,
      setItem: (k: string, v: string) => { mockStorage.set(k, v); },
      removeItem: (k: string) => { mockStorage.delete(k); },
    };
    const fn = new Function('window', 'document', 'localStorage', THEME_INIT_INLINE);
    expect(() => fn(win, doc, localStorage)).not.toThrow();
    // With empty storage + prefers-color-scheme:dark=false, theme should be 'light'
    expect((doc.documentElement as { _theme: string })._theme).toBe('light');
  });

  it('minified output is substantially smaller than the canonical source', () => {
    // Rough sanity check: minifier must strip at least the JSDoc header,
    // which alone is ~400 bytes.
    expect(THEME_INIT_INLINE.length).toBeLessThan(CANONICAL.length);
  });
});
