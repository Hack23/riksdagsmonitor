/**
 * Vitest unit tests — Cross-family chrome harmonisation block in styles.css
 *
 * Asserts that the new CSS section that visually unifies the static
 * (.site-header / .site-footer) and generated-article (.rm-site-header /
 * .rm-site-footer) chrome families is present and contains the required
 * cross-family selectors. The block is CSS-only by design — no HTML markup
 * was modified — so all of the structural / interaction guarantees live in
 * styles.css and can be guarded by string assertions.
 *
 * Documented in Article-Generation.md §"Shared article chrome".
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const CSS_PATH = resolve(process.cwd(), 'styles.css');
const css = readFileSync(CSS_PATH, 'utf8');

describe('Cross-family chrome harmonisation block (styles.css)', () => {
  it('includes the section header comment that introduces the block', () => {
    expect(css).toContain(
      '── Cross-family chrome harmonisation (static `.site-header`/`.site-footer` + article `.rm-site-header`/`.rm-site-footer`) ──'
    );
  });

  it('uses :where() to target both header families with controlled specificity', () => {
    expect(css).toMatch(/:where\(\.site-header,\s*\.rm-site-header\)/);
  });

  it('uses :where() to target both footer families with controlled specificity', () => {
    expect(css).toMatch(/:where\(\.site-footer,\s*\.rm-site-footer\)/);
  });

  it('harmonises both theme-toggle button variants', () => {
    expect(css).toMatch(/:where\(#theme-toggle\.theme-toggle-btn,\s*\.rm-theme-toggle\)/);
  });

  it('harmonises both language-switcher variants', () => {
    expect(css).toMatch(/:where\(\.site-language-switcher,\s*\.rm-lang-switcher\)/);
  });

  it('makes both header families sticky at the top', () => {
    const block = css.split('── Cross-family chrome harmonisation')[1];
    expect(block).toBeDefined();
    expect(block).toMatch(/position:\s*sticky/);
    expect(block).toMatch(/top:\s*0/);
    expect(block).toMatch(/z-index:\s*60/);
  });

  it('provides explicit light-mode polish for the header (rgba glass + cyan border)', () => {
    expect(css).toMatch(
      /html\[data-theme="light"\]\s+:where\(\.site-header,\s*\.rm-site-header\)/
    );
    expect(css).toContain('rgba(255, 255, 255, 0.92)');
  });

  it('enforces WCAG 2.5.5 touch targets (≥ 44×44) on mobile', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*768px\)/);
    const block = css.split('── Cross-family chrome harmonisation')[1];
    expect(block).toMatch(/width:\s*44px/);
    expect(block).toMatch(/height:\s*44px/);
  });

  it('declares a visible :focus-visible outline using the cyan token', () => {
    const block = css.split('── Cross-family chrome harmonisation')[1];
    expect(block).toMatch(/:focus-visible[\s\S]{0,200}outline:\s*2px solid/);
    expect(block).toMatch(/var\(--primary-cyan/);
  });

  it('wraps hover transforms inside prefers-reduced-motion: no-preference', () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*no-preference\)/);
  });

  it('does not introduce any !important declarations in the harmonisation block', () => {
    const block = css.split('── Cross-family chrome harmonisation')[1] ?? '';
    // Strip CSS block comments before scanning for declarations — the block's
    // own preamble explains *why* !important is avoided, and that prose must
    // not trigger the guard.
    const codeOnly = block.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(codeOnly).not.toMatch(/!\s*important/);
  });
});
