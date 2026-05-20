/**
 * @module tests/agentic/gate-shared/markdown-helpers
 * @description Unit tests for the shared markdown parsing primitives —
 *              `stripHeadingMarkup`, `hasHeading`, `extractSection`. These
 *              helpers are reused by five gate-check modules so their
 *              behaviour is locked down independently.
 * @see scripts/agentic/gate-shared/markdown-helpers.ts
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';

import {
  ANY_HEADING_RE,
  BULLET_RE,
  TABLE_ROW_RE,
  TABLE_SEP_RE,
  extractSection,
  hasHeading,
  stripHeadingMarkup,
} from '../../../scripts/agentic/gate-shared/markdown-helpers.js';

describe('stripHeadingMarkup', () => {
  it('returns plain headings unchanged', () => {
    expect(stripHeadingMarkup('Riksdag approves FiU48')).toBe('Riksdag approves FiU48');
  });

  it('strips simple HTML tags', () => {
    expect(stripHeadingMarkup('<span>Riksdag</span> approves')).toBe('Riksdag approves');
  });

  it('strips multi-tag HTML wrapping with collapse of whitespace', () => {
    expect(stripHeadingMarkup('<h1 align="center"><em>📰</em> Riksdag approves</h1>')).toBe('📰 Riksdag approves');
  });

  it('decodes &nbsp; entities', () => {
    expect(stripHeadingMarkup('Riksdag&nbsp;approves&#160;FiU48')).toBe('Riksdag approves FiU48');
  });

  it('collapses internal whitespace and trims edges', () => {
    expect(stripHeadingMarkup('   Riksdag    approves   FiU48   ')).toBe('Riksdag approves FiU48');
  });
});

describe('hasHeading', () => {
  it('matches an H2 heading body', () => {
    expect(hasHeading('## ICD 203 Audit\n\nBody', /ICD 203/)).toBe(true);
  });

  it('matches an H4 heading', () => {
    expect(hasHeading('#### Sub-section\n', /Sub-section/)).toBe(true);
  });

  it('does not match H1', () => {
    expect(hasHeading('# Riksdag approves', /Riksdag/)).toBe(false);
  });

  it('strips a leading emoji before matching', () => {
    expect(hasHeading('## 📋 ICD 203 Audit', /^ICD 203/)).toBe(true);
  });

  it('returns false when no heading line matches', () => {
    expect(hasHeading('Paragraph mentioning ICD 203 in the body.', /ICD 203/)).toBe(false);
  });
});

describe('extractSection', () => {
  it('returns the body of the matching ## section', () => {
    const content = '## First\n\nA\nB\n\n## Second\n\nC\nD\n';
    expect(extractSection(content, /Second/).trim()).toBe('C\nD');
  });

  it('stops at the next H2 heading', () => {
    const content = '## Target\n\nBody\n\n## Other\n\nIgnored\n';
    expect(extractSection(content, /Target/)).not.toContain('Ignored');
  });

  it('returns empty string when section is absent', () => {
    expect(extractSection('## Other\n\nBody\n', /Target/)).toBe('');
  });

  it('tolerates an emoji prefix on the section heading', () => {
    const content = '## 📋 Target Section\n\nBody\n\n## Other\n';
    expect(extractSection(content, /^Target Section/).trim()).toBe('Body');
  });
});

describe('exported regex primitives', () => {
  it('BULLET_RE matches dash and asterisk bullets', () => {
    expect(BULLET_RE.test('  - item')).toBe(true);
    expect(BULLET_RE.test('* item')).toBe(true);
    expect(BULLET_RE.test('paragraph')).toBe(false);
  });

  it('TABLE_ROW_RE matches markdown table rows', () => {
    expect(TABLE_ROW_RE.test('| col |')).toBe(true);
    expect(TABLE_ROW_RE.test('not a row')).toBe(false);
  });

  it('TABLE_SEP_RE matches table separator rows', () => {
    expect(TABLE_SEP_RE.test('|---|---|')).toBe(true);
    expect(TABLE_SEP_RE.test('|:---:|')).toBe(true);
    expect(TABLE_SEP_RE.test('| data |')).toBe(false);
  });

  it('ANY_HEADING_RE matches H1–H6', () => {
    expect(ANY_HEADING_RE.test('# H1')).toBe(true);
    expect(ANY_HEADING_RE.test('###### H6')).toBe(true);
    expect(ANY_HEADING_RE.test('####### too deep')).toBe(false);
    expect(ANY_HEADING_RE.test('paragraph')).toBe(false);
  });
});
