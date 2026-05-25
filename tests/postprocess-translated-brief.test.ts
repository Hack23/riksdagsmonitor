/**
 * Unit tests for `scripts/postprocess-translated-brief.ts`.
 *
 * Covers path-parsing, in-memory H1 rewrite logic, and the
 * end-to-end file-rewrite helper (using a temp dir).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  parseBriefPath,
  postprocessBriefMarkdown,
  postprocessBriefFile,
} from '../scripts/postprocess-translated-brief.js';

describe('parseBriefPath', () => {
  it('parses canonical analysis/daily/<date>/<sub>/executive-brief_<lang>.md', () => {
    const out = parseBriefPath('analysis/daily/2026-05-15/propositions/executive-brief_sv.md');
    expect(out).toEqual({ lang: 'sv', subfolder: 'propositions' });
  });

  it('handles nested subfolders', () => {
    const out = parseBriefPath('analysis/daily/2026-05-15/committees/justice/executive-brief_de.md');
    expect(out).toEqual({ lang: 'de', subfolder: 'committees/justice' });
  });

  it('returns null for the English source file (no _lang suffix)', () => {
    expect(parseBriefPath('analysis/daily/2026-05-15/propositions/executive-brief.md')).toBeNull();
  });

  it('returns null for unrelated paths', () => {
    expect(parseBriefPath('analysis/daily/2026-05-15/propositions/article.md')).toBeNull();
    expect(parseBriefPath('scripts/some-file.ts')).toBeNull();
  });

  it('returns null for an unknown language code', () => {
    expect(parseBriefPath('analysis/daily/2026-05-15/propositions/executive-brief_xx.md')).toBeNull();
  });
});

describe('postprocessBriefMarkdown', () => {
  it('strips a translated Executive-Brief prefix from the H1', () => {
    const md = [
      '# Exekutiv sammanfattning — Sveriges Riksdag Antar Migrationsreform',
      '',
      'Brödtext på svenska.',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'sv', 'propositions');
    expect(out.changed).toBe(true);
    expect(out.cleanedH1).toBe('Sveriges Riksdag Antar Migrationsreform');
    expect(out.markdown.split('\n')[0]).toBe('# Sveriges Riksdag Antar Migrationsreform');
  });

  it('strips trailing date suffix from the H1', () => {
    const md = [
      '# Riksdagen Beslutar Om Reform — 2026-05-15',
      '',
      'Brödtext.',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'sv', 'propositions');
    expect(out.changed).toBe(true);
    expect(out.cleanedH1).toBe('Riksdagen Beslutar Om Reform');
  });

  it('does not rewrite an already-clean H1', () => {
    const md = [
      '# Sveriges Riksdag Antar Migrationsreform Med Stor Majoritet',
      '',
      'Brödtext på svenska.',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'sv', 'propositions');
    expect(out.changed).toBe(false);
    expect(out.markdown).toBe(md);
  });

  it('preserves YAML frontmatter and locates the body H1', () => {
    const md = [
      '---',
      'title: "Brief"',
      'lang: sv',
      '---',
      '',
      '<!-- source-sha: abc -->',
      '',
      '# Exekutiv sammanfattning — Konstitutionsutskottet Granskar Reformer',
      '',
      'Brödtext.',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'sv', 'committees');
    expect(out.changed).toBe(true);
    expect(out.cleanedH1).toBe('Konstitutionsutskottet Granskar Reformer');
    // Frontmatter and HTML comment must survive verbatim.
    const lines = out.markdown.split('\n');
    expect(lines[0]).toBe('---');
    expect(lines[3]).toBe('---');
    expect(lines[5]).toBe('<!-- source-sha: abc -->');
    expect(lines[7]).toBe('# Konstitutionsutskottet Granskar Reformer');
  });

  it('preserves the H1 when the cleaned form would be too short', () => {
    const md = [
      '# Exekutiv sammanfattning — Reform',
      '',
      'Brödtext.',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'sv', 'propositions');
    // Cleaning would yield "Reform" (< 20 chars) — null — preserve original.
    expect(out.changed).toBe(false);
    expect(out.markdown).toBe(md);
  });

  it('does nothing when there is no body H1', () => {
    const md = [
      '---',
      'title: foo',
      '---',
      '',
      'Just body text, no heading.',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'sv', 'propositions');
    expect(out.changed).toBe(false);
    expect(out.originalH1).toBeNull();
  });

  it('strips translated boilerplate for DE briefs', () => {
    const md = [
      '# Zusammenfassung — Schwedisches Parlament Verabschiedet Migrationsreform',
      '',
      'Inhalt.',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'de', 'propositions');
    expect(out.changed).toBe(true);
    expect(out.cleanedH1).toBe('Schwedisches Parlament Verabschiedet Migrationsreform');
  });
});

describe('postprocessBriefFile (integration)', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'postprocess-brief-'));
  });

  afterEach(() => {
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  function writeBrief(relPath: string, contents: string): string {
    const fullPath = join(tmpRoot, relPath);
    mkdirSync(join(fullPath, '..'), { recursive: true });
    writeFileSync(fullPath, contents);
    return fullPath;
  }

  it('rewrites a brief on disk when the H1 changes', () => {
    const path = writeBrief(
      'analysis/daily/2026-05-15/propositions/executive-brief_sv.md',
      [
        '# Exekutiv sammanfattning — Riksdagen Beslutar Om Migrationsreform',
        '',
        'Brödtext.',
      ].join('\n'),
    );
    const r = postprocessBriefFile(path);
    expect(r.status).toBe('rewrote');
    expect(r.cleanedH1).toBe('Riksdagen Beslutar Om Migrationsreform');
    expect(readFileSync(path, 'utf8').split('\n')[0]).toBe('# Riksdagen Beslutar Om Migrationsreform');
  });

  it('reports "unchanged" when the H1 is already clean', () => {
    const path = writeBrief(
      'analysis/daily/2026-05-15/propositions/executive-brief_sv.md',
      [
        '# Sveriges Riksdag Antar Reform Med Stor Majoritet',
        '',
        'Brödtext.',
      ].join('\n'),
    );
    const before = readFileSync(path, 'utf8');
    const r = postprocessBriefFile(path);
    expect(r.status).toBe('unchanged');
    expect(readFileSync(path, 'utf8')).toBe(before);
  });

  it('returns "skipped" for a non-canonical path', () => {
    const path = writeBrief('docs/some-readme.md', '# Heading\nbody');
    const r = postprocessBriefFile(path);
    expect(r.status).toBe('skipped');
  });

  it('returns "error" for a missing file', () => {
    const r = postprocessBriefFile(join(tmpRoot, 'nope/executive-brief_sv.md'));
    expect(r.status).toBe('error');
  });
});
