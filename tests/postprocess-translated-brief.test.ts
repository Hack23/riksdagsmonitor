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

  it('skips leading <div dir="rtl"> wrapper and rewrites the inner H1 (ar)', () => {
    const md = [
      '<div dir="rtl">',
      '',
      '# ملخص تنفيذي — البرلمان السويدي يقر إصلاح قانون الهجرة الجديد',
      '',
      'نص الموجز باللغة العربية.',
      '',
      '</div>',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'ar', 'propositions');
    expect(out.changed).toBe(true);
    expect(out.cleanedH1).toBe('البرلمان السويدي يقر إصلاح قانون الهجرة الجديد');
    // Wrapper must survive verbatim.
    expect(out.markdown.split('\n')[0]).toBe('<div dir="rtl">');
    expect(out.markdown).toContain('</div>');
  });

  it('skips leading <div dir="rtl"> wrapper and rewrites the inner H1 (he)', () => {
    const md = [
      '<div dir="rtl">',
      '',
      '# תקציר מנהלים — הפרלמנט השוודי מאשר רפורמה במדיניות ההגירה',
      '',
      'תוכן הסיכום בעברית.',
      '',
      '</div>',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'he', 'propositions');
    expect(out.changed).toBe(true);
    expect(out.cleanedH1).toBe('הפרלמנט השוודי מאשר רפורמה במדיניות ההגירה');
  });

  it('rewrites an inline HTML <h1> as the title form', () => {
    const md = [
      '<h1 class="title">Exekutiv sammanfattning — Riksdagen Antar Migrationsreform Med Stor Majoritet</h1>',
      '',
      'Brödtext.',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'sv', 'propositions');
    expect(out.changed).toBe(true);
    expect(out.cleanedH1).toBe('Riksdagen Antar Migrationsreform Med Stor Majoritet');
    // HTML H1 collapses to a normalised markdown # heading.
    expect(out.markdown.split('\n')[0]).toBe('# Riksdagen Antar Migrationsreform Med Stor Majoritet');
  });

  it('rewrites a multi-line HTML <h1> block', () => {
    const md = [
      '<h1>',
      '  Zusammenfassung — Schwedisches Parlament Verabschiedet Migrationsreform',
      '</h1>',
      '',
      'Inhalt.',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'de', 'propositions');
    expect(out.changed).toBe(true);
    expect(out.cleanedH1).toBe('Schwedisches Parlament Verabschiedet Migrationsreform');
    const lines = out.markdown.split('\n');
    expect(lines[0]).toBe('# Schwedisches Parlament Verabschiedet Migrationsreform');
    expect(lines[1]).toBe('');
    expect(lines[2]).toBe('Inhalt.');
  });

  it('skips a leading hero image before the H1', () => {
    const md = [
      '![Riksdag chamber](hero.jpg)',
      '',
      '# Résumé exécutif — Le Parlement Suédois Adopte Une Réforme Migratoire',
      '',
      'Contenu en français.',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'fr', 'propositions');
    expect(out.changed).toBe(true);
    expect(out.cleanedH1).toBe('Le Parlement Suédois Adopte Une Réforme Migratoire');
  });

  it('skips leading <center> wrapper and rewrites the inner H1', () => {
    const md = [
      '<center>',
      '# 执行摘要 — 瑞典议会通过历史性移民改革法案并启动新的边境管理程序',
      '</center>',
      '',
      '中文正文。',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'zh', 'propositions');
    expect(out.changed).toBe(true);
    expect(out.cleanedH1).toBe('瑞典议会通过历史性移民改革法案并启动新的边境管理程序');
  });

  it('strips nested HTML tags from the heading text', () => {
    const md = [
      '<h1><span class="boilerplate">Executive Brief</span> — <strong>Sweden Passes Migration Reform Bill</strong></h1>',
      '',
      'Body.',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'en', 'propositions');
    expect(out.changed).toBe(true);
    expect(out.cleanedH1).toBe('Sweden Passes Migration Reform Bill');
  });

  it('returns no H1 when leading content is plain prose (no wrapper or heading)', () => {
    const md = [
      'Plain prose line with no heading.',
      '',
      '# Later Heading Should Not Be Picked Up',
    ].join('\n');
    const out = postprocessBriefMarkdown(md, 'sv', 'propositions');
    expect(out.changed).toBe(false);
    expect(out.originalH1).toBeNull();
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
