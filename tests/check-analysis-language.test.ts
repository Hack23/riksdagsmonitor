/**
 * Unit tests for check-analysis-language.ts
 * 
 * @description Validates English-only enforcement for analysis artifacts.
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  stripMarkdownCodeAndFrontmatter,
  tokenizeWords,
  calculateSwedishDensity,
  findAnalysisMarkdownFiles,
  validateAnalysisLanguage,
} from '../scripts/check-analysis-language.js';

describe('check-analysis-language', () => {
  describe('stripMarkdownCodeAndFrontmatter', () => {
    it('removes YAML frontmatter', () => {
      const input = '---\ntitle: Test\n---\n\nBody text';
      const result = stripMarkdownCodeAndFrontmatter(input);
      expect(result).not.toContain('---');
      expect(result).toContain('Body text');
    });

    it('removes code fences', () => {
      const input = 'Text\n```js\nconst x = 1;\n```\nMore text';
      const result = stripMarkdownCodeAndFrontmatter(input);
      expect(result).not.toContain('const x');
      expect(result).toContain('Text');
      expect(result).toContain('More text');
    });

    it('removes inline code', () => {
      const input = 'Text with `inline code` here';
      const result = stripMarkdownCodeAndFrontmatter(input);
      expect(result).not.toContain('`');
      expect(result).toContain('Text with');
      expect(result).toContain('here');
    });

    it('does NOT strip body text between two `---` thematic breaks (regression: regex `/m` flag)', () => {
      // Body containing two `---` rules. With a multiline regex `^---`
      // would match the first thematic break and strip everything up to
      // the second one — hiding any Swedish prose in between from the
      // density check. The non-multiline anchor ensures only file-start
      // frontmatter is stripped.
      const input = [
        '# Heading',
        '',
        'Section one English prose.',
        '',
        '---',
        '',
        'och att för inte är den det har hade kommer skall',
        '',
        '---',
        '',
        'Section two English prose.',
      ].join('\n');
      const result = stripMarkdownCodeAndFrontmatter(input);
      expect(result).toContain('och att för');
      expect(result).toContain('Section one');
      expect(result).toContain('Section two');
    });
  });

  describe('tokenizeWords', () => {
    it('extracts lowercase words', () => {
      const text = 'Hello World Test';
      const words = tokenizeWords(text);
      expect(words).toEqual(['hello', 'world', 'test']);
    });

    it('handles Swedish characters', () => {
      const text = 'Riksdagen är Sveriges parlament';
      const words = tokenizeWords(text);
      expect(words).toContain('riksdagen');
      expect(words).toContain('är');
      expect(words).toContain('sveriges');
    });

    it('returns empty array for no words', () => {
      const text = '123 456 !@#';
      const words = tokenizeWords(text);
      expect(words).toEqual([]);
    });
  });

  describe('calculateSwedishDensity', () => {
    const tmpDir = '/tmp/test-check-lang';

    beforeEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
      mkdirSync(tmpDir, { recursive: true });
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('detects 100% English content', () => {
      const file = join(tmpDir, 'english.md');
      writeFileSync(file, '# English Test\n\nThis is a test of English prose with no Swedish markers.');
      
      const { density, swedishMarkerCount } = calculateSwedishDensity(file);
      expect(density).toBe(0);
      expect(swedishMarkerCount).toBe(0);
    });

    it('detects heavily Swedish content', () => {
      const file = join(tmpDir, 'swedish.md');
      const content = `
# Test

Riksdagen är Sveriges parlament och beslutande församling. 
Regeringen föreslår att införa nya regler enligt propositionen. 
Detta beslut måste genom utskottet för vidare behandling.
      `.trim();
      writeFileSync(file, content);
      
      const { density, swedishMarkerCount } = calculateSwedishDensity(file);
      expect(density).toBeGreaterThan(0.05);
      expect(swedishMarkerCount).toBeGreaterThan(5);
    });

    it('handles empty file', () => {
      const file = join(tmpDir, 'empty.md');
      writeFileSync(file, '');
      
      const { totalWords, density } = calculateSwedishDensity(file);
      expect(totalWords).toBe(0);
      expect(density).toBe(0);
    });
  });

  describe('findAnalysisMarkdownFiles', () => {
    const tmpDir = '/tmp/test-find-files';

    beforeEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
      mkdirSync(tmpDir, { recursive: true });
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('finds regular markdown files', () => {
      writeFileSync(join(tmpDir, 'synthesis-summary.md'), '# Test');
      writeFileSync(join(tmpDir, 'swot-analysis.md'), '# SWOT');
      
      const files = findAnalysisMarkdownFiles(tmpDir);
      expect(files).toHaveLength(2);
      expect(files.some(f => f.endsWith('synthesis-summary.md'))).toBe(true);
      expect(files.some(f => f.endsWith('swot-analysis.md'))).toBe(true);
    });

    it('excludes executive-brief_<lang>.md files', () => {
      writeFileSync(join(tmpDir, 'executive-brief.md'), '# English');
      writeFileSync(join(tmpDir, 'executive-brief_sv.md'), '# Swedish');
      writeFileSync(join(tmpDir, 'executive-brief_da.md'), '# Danish');
      
      const files = findAnalysisMarkdownFiles(tmpDir);
      expect(files).toHaveLength(1);
      expect(files[0]).toContain('executive-brief.md');
      expect(files[0]).not.toContain('_sv');
      expect(files[0]).not.toContain('_da');
    });

    it('excludes pass1/ subdirectories', () => {
      mkdirSync(join(tmpDir, 'pass1'), { recursive: true });
      writeFileSync(join(tmpDir, 'synthesis-summary.md'), '# Current');
      writeFileSync(join(tmpDir, 'pass1', 'synthesis-summary.md'), '# Old');
      
      const files = findAnalysisMarkdownFiles(tmpDir);
      expect(files).toHaveLength(1);
      expect(files[0]).toContain('synthesis-summary.md');
      expect(files[0]).not.toContain('pass1');
    });

    it('excludes data-download-manifest.md', () => {
      writeFileSync(join(tmpDir, 'synthesis-summary.md'), '# Test');
      writeFileSync(join(tmpDir, 'data-download-manifest.md'), '# Manifest');
      
      const files = findAnalysisMarkdownFiles(tmpDir);
      expect(files).toHaveLength(1);
      expect(files[0]).toContain('synthesis-summary.md');
    });

    it('excludes full-text/ subdirectories (raw downloaded Swedish source material)', () => {
      mkdirSync(join(tmpDir, 'full-text'), { recursive: true });
      writeFileSync(join(tmpDir, 'synthesis-summary.md'), '# English');
      writeFileSync(join(tmpDir, 'full-text', 'H901FiU1.md'), '# Riksdagen är');
      writeFileSync(join(tmpDir, 'full-text', 'H901AU10.md'), '# Regeringen föreslår');

      const files = findAnalysisMarkdownFiles(tmpDir);
      expect(files).toHaveLength(1);
      expect(files[0]).toContain('synthesis-summary.md');
      expect(files.some(f => f.includes('full-text'))).toBe(false);
    });
  });

  describe('validateAnalysisLanguage', () => {
    const tmpDir = '/tmp/test-validate-lang';

    beforeEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
      mkdirSync(tmpDir, { recursive: true });
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('passes for all-English artifacts', () => {
      writeFileSync(join(tmpDir, 'synthesis-summary.md'), 
        '# Test\n\nThis is English prose with no Swedish markers at all.');
      writeFileSync(join(tmpDir, 'swot-analysis.md'), 
        '# SWOT\n\nStrengths include robust analysis and clear methodology.');
      
      const violations = validateAnalysisLanguage(tmpDir);
      expect(violations).toHaveLength(0);
    });

    it('detects Swedish violations', () => {
      const swedishContent = `
# Test

Riksdagen är Sveriges parlament och beslutande församling enligt grundlagen.
Regeringen föreslår att införa nya regler enligt denna proposition.
Utskottet måste därför behandla ärendet vidare och fatta beslut.
Detta kommer att påverka samtliga kommuner och därmed invånarna.
      `.trim();
      
      writeFileSync(join(tmpDir, 'synthesis-summary.md'), swedishContent);
      
      const violations = validateAnalysisLanguage(tmpDir);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]?.density).toBeGreaterThan(0.05);
      expect(violations[0]?.swedishMarkerCount).toBeGreaterThan(5);
    });

    it('always exempts executive-brief_sv.md', () => {
      const pureSwedish = `
# Swedish Executive Brief

Riksdagen är Sveriges parlament och beslutande församling enligt grundlagen.
Regeringen föreslår att införa nya regler enligt denna proposition.
Utskottet måste därför behandla ärendet vidare och fatta beslut.
Detta kommer att påverka samtliga kommuner och därmed invånarna.
Enligt propositionen skall nya regler införas som påverkar samtliga.
      `.trim();
      
      writeFileSync(join(tmpDir, 'executive-brief_sv.md'), pureSwedish);
      writeFileSync(join(tmpDir, 'executive-brief.md'), '# English Brief\n\nThis is English.');
      
      const violations = validateAnalysisLanguage(tmpDir);
      // Should have zero violations because executive-brief_sv.md is exempt
      expect(violations).toHaveLength(0);
    });

    it('skips short snippets with few Swedish words', () => {
      // Short text with 1-2 Swedish words shouldn't trigger (below MIN_SWEDISH_MARKERS)
      writeFileSync(join(tmpDir, 'test.md'), 
        '# Test\n\nRiksdagen is the Swedish parliament och test.');
      
      const violations = validateAnalysisLanguage(tmpDir);
      expect(violations).toHaveLength(0);
    });

    it('ignores Swedish prose inside blockquote-attributed source quotations', () => {
      // English analytical prose, but with a long Swedish quotation in a
      // blockquote. The prompt contract allows verbatim Swedish source
      // quotes; the gate should not fire on those.
      const content = [
        '# Analysis',
        '',
        'The committee report addresses several procedural concerns and proposes a balanced framework.',
        '',
        '> Riksdagen är Sveriges parlament och beslutande församling enligt grundlagen.',
        '> Regeringen föreslår att införa nya regler enligt denna proposition.',
        '> Utskottet måste därför behandla ärendet vidare och fatta beslut.',
        '> Detta kommer att påverka samtliga kommuner och därmed invånarna.',
        '',
        'The analysis concludes that the proposal is consistent with prior practice.',
      ].join('\n');
      writeFileSync(join(tmpDir, 'synthesis-summary.md'), content);

      const violations = validateAnalysisLanguage(tmpDir);
      expect(violations).toHaveLength(0);
    });

    it('ignores verbatim Swedish source-title lines', () => {
      // Source titles are permitted in Swedish; they must not push the file
      // over the density threshold.
      const content = [
        '# Analysis',
        '',
        'This synthesis cross-references three primary sources from the Riksdag corpus.',
        '',
        '- Source title: Riksdagen är Sveriges parlament och beslutande församling',
        '- Källa: Regeringen föreslår att införa nya regler enligt propositionen',
        '- Original title: Utskottet måste därför behandla ärendet vidare och fatta beslut',
        '- **Source title:** Detta kommer att påverka samtliga kommuner och därmed invånarna',
        '',
        'The full body of analytical prose is written in English with consistent terminology.',
      ].join('\n');
      writeFileSync(join(tmpDir, 'cross-reference-map.md'), content);

      const violations = validateAnalysisLanguage(tmpDir);
      expect(violations).toHaveLength(0);
    });

    it('does NOT exempt bare `Title:` lines (only explicit source-attribution labels are exempted)', () => {
      // A bare `Title:` label must not be allowed to hide Swedish analytical
      // prose. Only `Source title`, `Källa`, `Källtitel`, `Original title`
      // are exempted; `Title` alone is too generic.
      const swedishOnTitleLines = [
        '# Analysis',
        '',
        '- Title: Riksdagen är Sveriges parlament och beslutande församling enligt grundlagen',
        '- Title: Regeringen föreslår att införa nya regler enligt denna proposition från utskottet',
        '- Title: Utskottet måste därför behandla ärendet vidare och fatta beslut i kammaren',
        '- Title: Detta kommer att påverka samtliga kommuner och därmed invånarna i landet',
        '- Title: Propositionen innehåller flera viktiga ändringar som påverkar både stat och kommun',
      ].join('\n');
      writeFileSync(join(tmpDir, 'synthesis-summary.md'), swedishOnTitleLines);

      const violations = validateAnalysisLanguage(tmpDir);
      expect(violations.length).toBeGreaterThan(0);
    });
  });
});
