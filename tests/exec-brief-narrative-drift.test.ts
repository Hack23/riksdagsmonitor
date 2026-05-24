import { describe, expect, it } from 'vitest';
import {
  isDiffMermaidOnly,
  stripMermaidBlocks,
} from '../scripts/validators/executive-brief-translations/narrative-drift.js';

describe('stripMermaidBlocks', () => {
  it('removes a single ```mermaid block while preserving surrounding prose', () => {
    const md = [
      '# Brief',
      '',
      'Narrative paragraph.',
      '',
      '```mermaid',
      'flowchart LR',
      '  A --> B',
      '```',
      '',
      'After.',
    ].join('\n');
    expect(stripMermaidBlocks(md)).toBe(
      ['# Brief', '', 'Narrative paragraph.', '', '', 'After.'].join('\n'),
    );
  });

  it('preserves non-mermaid fenced code blocks', () => {
    const md = ['Before.', '```bash', 'echo hi', '```', 'After.'].join('\n');
    expect(stripMermaidBlocks(md)).toBe(md);
  });

  it('strips multiple ```mermaid blocks independently', () => {
    const md = [
      'A',
      '```mermaid',
      'flowchart LR',
      '  X --> Y',
      '```',
      'B',
      '```mermaid',
      'pie title T',
      '  "x" : 1',
      '```',
      'C',
    ].join('\n');
    expect(stripMermaidBlocks(md)).toBe(['A', 'B', 'C'].join('\n'));
  });

  it('is case-insensitive on the mermaid fence opener', () => {
    const md = ['```Mermaid', 'flowchart LR', '  A --> B', '```', 'tail'].join('\n');
    expect(stripMermaidBlocks(md)).toBe('tail');
  });
});

describe('isDiffMermaidOnly', () => {
  const before = [
    '# Brief',
    'Paragraph.',
    '```mermaid',
    'flowchart LR',
    '  A --> B',
    '```',
    'Tail.',
  ].join('\n');

  it('returns true for identical inputs', () => {
    expect(isDiffMermaidOnly(before, before)).toBe(true);
  });

  it('returns true when the only change is inside a ```mermaid block (autofix case)', () => {
    const after = before.replace('  A --> B', '  A --> C\n  C --> B');
    expect(isDiffMermaidOnly(before, after)).toBe(true);
  });

  it('returns false when a brand-new ```mermaid block is appended with surrounding blank lines', () => {
    // Adding a whole new section (even if its body is mermaid) introduces
    // narrative whitespace, which is conservatively treated as drift.
    const after = before + '\n\n```mermaid\npie title T\n  "x" : 1\n```\n';
    expect(isDiffMermaidOnly(before, after)).toBe(false);
  });

  it('returns false when a narrative line changes', () => {
    const after = before.replace('Paragraph.', 'Paragraph edited.');
    expect(isDiffMermaidOnly(before, after)).toBe(false);
  });

  it('returns false when a non-mermaid fenced block changes', () => {
    const beforeBash = ['Before.', '```bash', 'echo hi', '```'].join('\n');
    const afterBash = ['Before.', '```bash', 'echo bye', '```'].join('\n');
    expect(isDiffMermaidOnly(beforeBash, afterBash)).toBe(false);
  });

  it('returns false when a heading is added', () => {
    const after = before + '\n## New section';
    expect(isDiffMermaidOnly(before, after)).toBe(false);
  });

  it('normalises CRLF vs LF line endings', () => {
    const lf = 'Para.\n```mermaid\nA --> B\n```\nTail.\n';
    const crlf = lf.replace(/\n/g, '\r\n');
    expect(isDiffMermaidOnly(lf, crlf)).toBe(true);
  });
});
