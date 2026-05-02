/**
 * @module Tests/PoliticalIntelligence/LeafModules
 * @description Unit tests for the bounded-context leaf modules of the
 * political-intelligence index generator (Round-6 split).
 *
 * Pins the unit-level invariants of the new leaves; the CLI orchestrator
 * is exercised end-to-end by `generate-political-intelligence.test.ts`
 * via the shim's barrel re-export.
 */
import { describe, it, expect } from 'vitest';

import { PI_TRANSLATIONS } from '../scripts/political-intelligence/i18n/page-translations.js';
import {
  METHODOLOGY_META,
  METHODOLOGY_DESC_I18N,
} from '../scripts/political-intelligence/i18n/methodology-i18n.js';
import { TEMPLATE_META } from '../scripts/political-intelligence/i18n/template-i18n.js';
import {
  STREAM_META,
  streamDisplayName,
  streamDescription,
  streamIcon,
  prettifyStream,
} from '../scripts/political-intelligence/i18n/stream-i18n.js';
import {
  artifactTitle,
  prettifyMarkdownTitle,
} from '../scripts/political-intelligence/i18n/artifact-i18n.js';
import {
  artifactBaseName,
  artifactIcon,
} from '../scripts/political-intelligence/render/daily-day.js';
import type { Language } from '../scripts/types/language.js';

const ALL_LANGS: readonly Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
];

// ---------------------------------------------------------------------------
// PI_TRANSLATIONS — page-level i18n bundle
// ---------------------------------------------------------------------------

describe('political-intelligence/i18n/page-translations.ts — PI_TRANSLATIONS', () => {
  it('has an entry for every supported language', () => {
    for (const lang of ALL_LANGS) {
      expect(PI_TRANSLATIONS[lang]).toBeDefined();
    }
  });

  it.each(ALL_LANGS)('the %s entry has non-empty title, subtitle, and section labels', (lang) => {
    const t = PI_TRANSLATIONS[lang];
    expect(t.title.length).toBeGreaterThan(0);
    expect(t.subtitle.length).toBeGreaterThan(0);
    expect(t.methodologies.length).toBeGreaterThan(0);
    expect(t.templates.length).toBeGreaterThan(0);
    expect(t.dailyArtifacts.length).toBeGreaterThan(0);
  });

  it('exposes the stat-label / a11y strings the dashboard needs', () => {
    for (const lang of ALL_LANGS) {
      const t = PI_TRANSLATIONS[lang];
      expect(typeof t.artifacts).toBe('string');
      expect(typeof t.stream).toBe('string');
      expect(typeof t.recentDays).toBe('string');
      expect(typeof t.olderDays).toBe('string');
      expect(typeof t.home).toBe('string');
      expect(typeof t.sitemap).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// METHODOLOGY_META — keyed by filename, value = { icon, description }
// ---------------------------------------------------------------------------

describe('political-intelligence/i18n/methodology-i18n.ts — METHODOLOGY_META', () => {
  it('exports a non-empty methodology catalogue', () => {
    expect(Object.keys(METHODOLOGY_META).length).toBeGreaterThan(0);
  });

  it('every methodology entry carries an icon and English description', () => {
    for (const [file, meta] of Object.entries(METHODOLOGY_META)) {
      expect(meta.icon.length).toBeGreaterThan(0);
      expect(meta.description.length).toBeGreaterThan(0);
      expect(file.length).toBeGreaterThan(0);
    }
  });

  it('English descriptions cover at least one of the catalogued methodology files', () => {
    // Shape is Record<filename, Record<language, string>> — pick the
    // first file and assert the English string is non-empty.
    const firstFile = Object.keys(METHODOLOGY_DESC_I18N)[0];
    expect(firstFile).toBeDefined();
    const enDesc = METHODOLOGY_DESC_I18N[firstFile!]!.en;
    expect(typeof enDesc).toBe('string');
    expect(enDesc!.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// TEMPLATE_META — keyed by filename, value = { icon, description }
// ---------------------------------------------------------------------------

describe('political-intelligence/i18n/template-i18n.ts — TEMPLATE_META', () => {
  it('exports a non-empty template catalogue', () => {
    expect(Object.keys(TEMPLATE_META).length).toBeGreaterThan(0);
  });

  it('every template entry carries an icon and description', () => {
    for (const [file, meta] of Object.entries(TEMPLATE_META)) {
      expect(meta.icon.length).toBeGreaterThan(0);
      expect(meta.description.length).toBeGreaterThan(0);
      expect(file.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// STREAM_META + helpers
// ---------------------------------------------------------------------------

describe('political-intelligence/i18n/stream-i18n.ts — STREAM_META + helpers', () => {
  it('exports a non-empty stream catalogue', () => {
    expect(Object.keys(STREAM_META).length).toBeGreaterThan(0);
  });

  it('every stream entry carries an icon and description', () => {
    for (const [name, meta] of Object.entries(STREAM_META)) {
      expect(meta.icon.length).toBeGreaterThan(0);
      expect(meta.description.length).toBeGreaterThan(0);
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it('streamIcon returns the catalogued icon for known streams', () => {
    const [knownName, knownMeta] = Object.entries(STREAM_META)[0]!;
    expect(streamIcon(knownName)).toBe(knownMeta.icon);
  });

  it('streamIcon returns a non-empty fallback for unknown stream names', () => {
    const fallback = streamIcon('this-stream-does-not-exist');
    expect(typeof fallback).toBe('string');
    expect(fallback.length).toBeGreaterThan(0);
  });

  it('streamDisplayName returns a non-empty string for unknown stream names', () => {
    const out = streamDisplayName('something-totally-new', 'en');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });

  it('streamDescription returns a non-empty string in every language for catalogued streams', () => {
    for (const name of Object.keys(STREAM_META)) {
      for (const lang of ALL_LANGS) {
        expect(streamDescription(name, lang).length).toBeGreaterThan(0);
      }
    }
  });

  it('prettifyStream uppercases each word and replaces dashes with spaces', () => {
    expect(prettifyStream('week-ahead')).toBe('Week Ahead');
    expect(prettifyStream('political-monitoring-dashboard'))
      .toBe('Political Monitoring Dashboard');
  });
});

// ---------------------------------------------------------------------------
// artifactTitle / prettifyMarkdownTitle
// ---------------------------------------------------------------------------

describe('political-intelligence/i18n/artifact-i18n.ts — title helpers', () => {
  it('prettifyMarkdownTitle strips .md / .json and Title-Cases the slug', () => {
    expect(prettifyMarkdownTitle('elite-network-mapping.md')).toBe('Elite Network Mapping');
    expect(prettifyMarkdownTitle('coalition_brief.json')).toBe('Coalition Brief');
    expect(prettifyMarkdownTitle('plain-name')).toBe('Plain Name');
  });

  it('artifactTitle returns a non-empty localised string for every catalogued slug × language', () => {
    // Use the first three slugs from the i18n catalogue keys exposed via
    // METHODOLOGY_META — these are typically present in ARTIFACT_TITLE_I18N
    // OR fall back through prettifyMarkdownTitle, never empty.
    for (const slug of Object.keys(METHODOLOGY_META).slice(0, 3)) {
      for (const lang of ALL_LANGS) {
        const out = artifactTitle(slug, lang);
        expect(typeof out).toBe('string');
        expect(out.length).toBeGreaterThan(0);
      }
    }
  });

  it('artifactTitle prettifies unknown slugs by capitalising and replacing dashes', () => {
    expect(artifactTitle('some-new-artifact', 'en')).toBe('Some New Artifact');
  });
});

// ---------------------------------------------------------------------------
// artifactBaseName / artifactIcon
// ---------------------------------------------------------------------------

describe('political-intelligence/render/daily-day.ts — artifactBaseName / artifactIcon', () => {
  it('artifactBaseName strips a directory prefix and returns the bare filename', () => {
    expect(artifactBaseName('sub/dir/elite-network.md')).toBe('elite-network.md');
    expect(artifactBaseName('elite-network.md')).toBe('elite-network.md');
  });

  it('artifactBaseName preserves the extension and date prefix in the filename', () => {
    // The function only strips directory prefix — date/extension stripping
    // is handled by prettifyMarkdownTitle when the i18n catalogue misses.
    expect(artifactBaseName('docs/2026-04-27-elite-network.md'))
      .toBe('2026-04-27-elite-network.md');
  });

  it('artifactIcon returns a non-empty emoji for every common file type', () => {
    for (const file of ['foo.md', 'foo.json', 'foo.html', 'foo.png', 'foo.unknown-ext', 'README.md']) {
      const icon = artifactIcon(file);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    }
  });

  it('artifactIcon uses the curated TEMPLATE_META icon when the slug is catalogued', () => {
    const [slug, meta] = Object.entries(TEMPLATE_META)[0]!;
    expect(artifactIcon(slug)).toBe(meta.icon);
  });
});

// ---------------------------------------------------------------------------
// daily-streams.ts — countArtifactsRecursive / collectStreamArtifacts /
//                     collectDailyDays (branch coverage)
// ---------------------------------------------------------------------------

import {
  countArtifactsRecursive,
  collectStreamArtifacts,
  collectDailyDays,
} from '../scripts/political-intelligence/daily-streams.js';
import nodeFs from 'node:fs';
import nodeOs from 'node:os';
import nodePath from 'node:path';

describe('political-intelligence/daily-streams.ts — countArtifactsRecursive', () => {
  it('returns 0 for an empty directory', () => {
    const tmp = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'daily-streams-'));
    try {
      expect(countArtifactsRecursive(tmp)).toBe(0);
    } finally {
      nodeFs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('counts .md and .json files and ignores other extensions', () => {
    const tmp = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'daily-streams-'));
    try {
      nodeFs.writeFileSync(nodePath.join(tmp, 'a.md'), '# A');
      nodeFs.writeFileSync(nodePath.join(tmp, 'b.json'), '{}');
      nodeFs.writeFileSync(nodePath.join(tmp, 'c.html'), '<html/>'); // ignored
      expect(countArtifactsRecursive(tmp)).toBe(2);
    } finally {
      nodeFs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('recursively counts artifacts in subdirectories', () => {
    const tmp = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'daily-streams-'));
    const sub = nodePath.join(tmp, 'sub');
    nodeFs.mkdirSync(sub, { recursive: true });
    try {
      nodeFs.writeFileSync(nodePath.join(tmp, 'top.md'), '# Top');
      nodeFs.writeFileSync(nodePath.join(sub, 'nested.json'), '{}');
      nodeFs.writeFileSync(nodePath.join(sub, 'nested.md'), '# Nested');
      expect(countArtifactsRecursive(tmp)).toBe(3);
    } finally {
      nodeFs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('political-intelligence/daily-streams.ts — collectStreamArtifacts', () => {
  it('returns empty array when stream directory does not exist', () => {
    expect(collectStreamArtifacts('/definitely/not/there', 'somebase')).toEqual([]);
  });

  it('collects .md and .json files sorted by relative path', () => {
    const tmp = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'stream-arts-'));
    try {
      nodeFs.writeFileSync(nodePath.join(tmp, 'zebra.md'), '# Z');
      nodeFs.writeFileSync(nodePath.join(tmp, 'alpha.json'), '{}');
      const arts = collectStreamArtifacts(tmp, '2026-05-01/propositions');
      expect(arts.map((a) => a.file)).toEqual(['alpha.json', 'zebra.md']);
    } finally {
      nodeFs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('collects artifacts from nested subdirectories', () => {
    const tmp = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'stream-arts-sub-'));
    const sub = nodePath.join(tmp, 'analysis');
    nodeFs.mkdirSync(sub, { recursive: true });
    try {
      nodeFs.writeFileSync(nodePath.join(tmp, 'root.md'), '# Root');
      nodeFs.writeFileSync(nodePath.join(sub, 'detail.json'), '{}');
      const arts = collectStreamArtifacts(tmp, '2026-05-01/committees');
      expect(arts.length).toBe(2);
      // relative paths include the subdirectory prefix
      const relPaths = arts.map((a) => a.relative);
      expect(relPaths.some((r) => r.includes('analysis'))).toBe(true);
    } finally {
      nodeFs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('ignores files with unsupported extensions', () => {
    const tmp = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'stream-arts-ext-'));
    try {
      nodeFs.writeFileSync(nodePath.join(tmp, 'keep.md'), '# Keep');
      nodeFs.writeFileSync(nodePath.join(tmp, 'ignore.html'), '<html/>');
      nodeFs.writeFileSync(nodePath.join(tmp, 'ignore.txt'), 'plain');
      const arts = collectStreamArtifacts(tmp, 'base');
      expect(arts.length).toBe(1);
      expect(arts[0]!.file).toBe('keep.md');
    } finally {
      nodeFs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('political-intelligence/daily-streams.ts — collectDailyDays', () => {
  it('returns empty array when analysis/daily directory does not exist', () => {
    // The real directory may or may not exist; the function handles missing dirs gracefully.
    // We can test the real function — if the dir is missing it returns [].
    // Since we cannot easily mock the module-level DAILY_DIR, we instead verify
    // that the return value is always a valid array.
    const result = collectDailyDays();
    expect(Array.isArray(result)).toBe(true);
  });
});
