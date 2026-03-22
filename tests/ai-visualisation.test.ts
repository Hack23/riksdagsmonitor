/**
 * Tests for scripts/ai-analysis/visualisation/index.ts
 *
 * Covers:
 * - buildMindmapBranches: document types, stakeholders, policy domains, data sources
 * - buildDashboardData: title, summary, typeDistribution with colors
 * - narrativeFramesLabel: localised label retrieval
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  buildMindmapBranches,
  buildDashboardData,
  narrativeFramesLabel,
} from '../scripts/ai-analysis/visualisation/index.js';
import type { RawDocument } from '../scripts/data-transformers/types.js';

// ---------------------------------------------------------------------------
// Test document factory
// ---------------------------------------------------------------------------

function makeDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    dok_id: 'TEST001',
    titel: 'Test document',
    title: 'Test document',
    doktyp: 'prop',
    datum: '2026-03-01',
    ...overrides,
  } as RawDocument;
}

const PROP = makeDoc({ dok_id: 'PROP1', titel: 'Proposition om säkerhet', doktyp: 'prop' });
const BET = makeDoc({ dok_id: 'BET1', titel: 'Betänkande om budget', doktyp: 'bet' });
const MOT = makeDoc({ dok_id: 'MOT1', titel: 'Motion om klimat', doktyp: 'mot' });

// ---------------------------------------------------------------------------
// buildMindmapBranches
// ---------------------------------------------------------------------------

describe('buildMindmapBranches', () => {
  it('returns document types branch', () => {
    const branches = buildMindmapBranches([PROP, BET], null, [], 'en');
    const typeBranch = branches.find(b => b.icon === '📄');
    expect(typeBranch).toBeDefined();
    expect(typeBranch!.label).toContain('Document');
    expect(typeBranch!.items.length).toBeGreaterThanOrEqual(1);
  });

  it('returns stakeholders branch with localised names', () => {
    const branches = buildMindmapBranches([PROP], null, [], 'sv');
    const shBranch = branches.find(b => b.icon === '👥');
    expect(shBranch).toBeDefined();
    expect(shBranch!.items).toContain('Regering / Policyförvaltning');
    expect(shBranch!.items).toContain('Riksdag / Opposition');
  });

  it('returns policy domains branch when domains available', () => {
    const branches = buildMindmapBranches([PROP], null, ['Fiscal Policy', 'Defence'], 'en');
    const domainBranch = branches.find(b => b.icon === '🏛️');
    expect(domainBranch).toBeDefined();
    expect(domainBranch!.items).toContain('Fiscal Policy');
    expect(domainBranch!.items).toContain('Defence');
  });

  it('does not include policy domains branch when no domains', () => {
    const branches = buildMindmapBranches([PROP], null, [], 'en');
    const domainBranch = branches.find(b => b.icon === '🏛️');
    expect(domainBranch).toBeUndefined();
  });

  it('returns data sources branch', () => {
    const branches = buildMindmapBranches([PROP], null, [], 'en');
    const srcBranch = branches.find(b => b.icon === '📊');
    expect(srcBranch).toBeDefined();
    expect(srcBranch!.label).toContain('Data');
    expect(srcBranch!.items.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// buildDashboardData
// ---------------------------------------------------------------------------

describe('buildDashboardData', () => {
  it('returns title, summary, and typeDistribution', () => {
    const data = buildDashboardData([PROP, BET, MOT], null, 'en');
    expect(data.title.length).toBeGreaterThan(0);
    expect(data.summary.length).toBeGreaterThan(0);
    expect(data.typeDistribution.length).toBeGreaterThanOrEqual(1);
  });

  it('includes color for each type in distribution', () => {
    const data = buildDashboardData([PROP, BET, MOT], null, 'en');
    for (const entry of data.typeDistribution) {
      expect(entry.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(entry.value).toBeGreaterThan(0);
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it('includes topic in title when provided', () => {
    const data = buildDashboardData([PROP], 'defence', 'en');
    expect(data.title).toContain('defence');
  });
});

// ---------------------------------------------------------------------------
// narrativeFramesLabel
// ---------------------------------------------------------------------------

describe('narrativeFramesLabel', () => {
  it('returns localised label for en', () => {
    expect(narrativeFramesLabel('en')).toBe('Narrative Frames');
  });

  it('returns localised label for sv', () => {
    expect(narrativeFramesLabel('sv')).toBe('Narrativa ramar');
  });
});
