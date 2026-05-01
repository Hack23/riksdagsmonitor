/**
 * Tests for scripts/generate-article-types-doc.ts
 *
 * Validates:
 *   - Table rendering contains all registry IDs
 *   - Sentinel replacement is idempotent
 *   - Invalid registry is rejected
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadAndValidateRegistry,
  renderTable,
  replaceBetweenSentinels,
} from '../scripts/generate-article-types-doc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

const registryPath = resolve(repoRoot, 'analysis/article-types.json');

describe('generate-article-types-doc', () => {
  it('loads and validates the real registry without error', () => {
    const registry = loadAndValidateRegistry(registryPath);
    expect(registry.types.length).toBeGreaterThanOrEqual(13);
    expect(registry.version).toBeDefined();
  });

  it('renders a table containing all registry IDs', () => {
    const registry = loadAndValidateRegistry(registryPath);
    const table = renderTable(registry.types);

    for (const t of registry.types) {
      expect(table).toContain(t.id);
    }
    // Table has a header row
    expect(table).toContain('| id |');
    expect(table).toContain('|---|');
  });

  it('replaces content between sentinels correctly', () => {
    const doc = [
      '# Title',
      '',
      '<!-- ARTICLE-TYPES:BEGIN -->',
      'old content here',
      '<!-- ARTICLE-TYPES:END -->',
      '',
      '## Footer',
    ].join('\n');

    const result = replaceBetweenSentinels(doc, '| new table |');
    expect(result).toContain('| new table |');
    expect(result).not.toContain('old content here');
    expect(result).toContain('# Title');
    expect(result).toContain('## Footer');
    expect(result).toContain('<!-- ARTICLE-TYPES:BEGIN -->');
    expect(result).toContain('<!-- ARTICLE-TYPES:END -->');
  });

  it('is idempotent — running twice produces same output', () => {
    const doc = [
      '# Title',
      '',
      '<!-- ARTICLE-TYPES:BEGIN -->',
      'old content',
      '<!-- ARTICLE-TYPES:END -->',
      '',
      '## Footer',
    ].join('\n');

    const registry = loadAndValidateRegistry(registryPath);
    const table = renderTable(registry.types);

    const first = replaceBetweenSentinels(doc, table);
    const second = replaceBetweenSentinels(first, table);
    expect(second).toBe(first);
  });

  it('throws on missing sentinels', () => {
    expect(() => replaceBetweenSentinels('no sentinels here', 'table')).toThrow(
      /Sentinels not found/,
    );
  });

  it('throws on invalid registry (empty types)', async () => {
    const { writeFileSync } = await import('node:fs');
    const tmpPath = '/tmp/empty-registry.json';
    writeFileSync(tmpPath, JSON.stringify({ version: '1.0', types: [] }), 'utf8');
    expect(() => loadAndValidateRegistry(tmpPath)).toThrow(/empty/);
  });

  it('renders dispatch-only types with italic marker', () => {
    const registry = loadAndValidateRegistry(registryPath);
    const electionCycle = registry.types.find((t) => t.id === 'election-cycle');
    expect(electionCycle?.dispatchOnly).toBe(true);

    const table = renderTable(registry.types);
    expect(table).toContain('_dispatch-only_');
  });

  it('does not modify content outside sentinels in Article-Generation.md', () => {
    const doc = readFileSync(resolve(repoRoot, 'Article-Generation.md'), 'utf8');
    const beginIdx = doc.indexOf('<!-- ARTICLE-TYPES:BEGIN -->');
    const endIdx = doc.indexOf('<!-- ARTICLE-TYPES:END -->');

    expect(beginIdx).toBeGreaterThan(-1);
    expect(endIdx).toBeGreaterThan(beginIdx);

    // Content before sentinels contains the heading
    const before = doc.slice(0, beginIdx);
    expect(before).toContain('### Forward-look horizons');
  });
});
