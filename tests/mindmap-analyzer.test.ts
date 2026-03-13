/**
 * Tests for buildAIMindmapBranches — three-pass AI mindmap analyzer.
 * Validates branch generation from document collections, relationship discovery,
 * completeness guarantees, and summary generation.
 */

import { describe, it, expect } from 'vitest';
import { buildAIMindmapBranches } from '../scripts/ai-analysis/mindmap-analyzer.js';
import type { MindmapAnalysisResult } from '../scripts/ai-analysis/mindmap-analyzer.js';
import type { RawDocument } from '../scripts/data-transformers.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makePropDoc(title: string, organ = 'FiU'): RawDocument {
  return { doktyp: 'prop', titel: title, organ, dok_id: `prop-${title.slice(0, 10)}` };
}

function makeBetDoc(title: string, organ = 'FiU'): RawDocument {
  return { doktyp: 'bet', titel: title, organ, dok_id: `bet-${title.slice(0, 10)}` };
}

function makeMotDoc(title: string, parti = 'S'): RawDocument {
  return { doktyp: 'mot', titel: title, parti, dok_id: `mot-${title.slice(0, 10)}` };
}

function makeEuDoc(title: string): RawDocument {
  return { doktyp: 'fpm', titel: title, dok_id: `fpm-${title.slice(0, 10)}` };
}

/** A realistic document set spanning multiple policy areas */
function makeDocSet(): RawDocument[] {
  return [
    makePropDoc('Budget proposition for fiscal year 2026', 'FiU'),
    makePropDoc('Defence preparedness appropriation', 'FöU'),
    makeBetDoc('Finance committee report on tax reform', 'FiU'),
    makeBetDoc('Defence committee review of preparedness', 'FöU'),
    makeMotDoc('Opposition motion on education funding', 'UbU'),
    makeMotDoc('Opposition motion on healthcare reform', 'SoU'),
    makeEuDoc('EU directive on financial regulation transposition'),
  ];
}

// ---------------------------------------------------------------------------
// Core tests
// ---------------------------------------------------------------------------

describe('buildAIMindmapBranches', () => {
  it('returns a MindmapAnalysisResult with branches, connections, and summary', () => {
    const result: MindmapAnalysisResult = buildAIMindmapBranches(makeDocSet(), 'Budget', 'en');
    expect(result).toHaveProperty('branches');
    expect(result).toHaveProperty('connections');
    expect(result).toHaveProperty('summary');
  });

  it('returns at least 5 branches for any non-empty document set', () => {
    const result = buildAIMindmapBranches(makeDocSet(), null, 'en');
    expect(result.branches.length).toBeGreaterThanOrEqual(5);
  });

  it('returns a single branch with fallback content for an empty document set', () => {
    const result = buildAIMindmapBranches([], 'Cybersecurity', 'en');
    expect(result.branches.length).toBeGreaterThanOrEqual(1);
    expect(result.summary).toBeTruthy();
  });

  it('includes a Legislative Pipeline branch when propositions are present', () => {
    const result = buildAIMindmapBranches(makeDocSet(), null, 'en');
    const pipelineBranch = result.branches.find(b => b.label.includes('Pipeline') || b.label.includes('Lagstiftning'));
    expect(pipelineBranch).toBeDefined();
  });

  it('marks the Legislative Pipeline branch as critical importance', () => {
    const result = buildAIMindmapBranches(makeDocSet(), null, 'en');
    const pipelineBranch = result.branches.find(b => b.label.includes('Pipeline'));
    expect(pipelineBranch?.importance).toBe('critical');
  });

  it('includes sub-branches for the legislative pipeline when multiple doc types present', () => {
    const result = buildAIMindmapBranches(makeDocSet(), null, 'en');
    const pipelineBranch = result.branches.find(b => b.label.includes('Pipeline'));
    expect(pipelineBranch?.subBranches).toBeDefined();
    expect(pipelineBranch?.subBranches!.length).toBeGreaterThan(0);
  });

  it('includes a Risks & Blockers branch when motions are present', () => {
    const result = buildAIMindmapBranches(makeDocSet(), null, 'en');
    const riskBranch = result.branches.find(b => b.label.includes('Risk') || b.label.includes('Blocker'));
    expect(riskBranch).toBeDefined();
  });

  it('includes an EU Context branch when EU documents are present', () => {
    const result = buildAIMindmapBranches(makeDocSet(), null, 'en');
    const euBranch = result.branches.find(b => b.label.includes('EU') || b.label.includes('International'));
    expect(euBranch).toBeDefined();
  });

  it('includes cross-committee dependencies when multiple organs are involved', () => {
    const result = buildAIMindmapBranches(makeDocSet(), null, 'en');
    const crossBranch = result.branches.find(b =>
      b.label.includes('Committee') || b.label.includes('Kommitté') || b.label.includes('Cross'));
    expect(crossBranch).toBeDefined();
  });

  it('always includes a data context branch (📊 icon)', () => {
    const result = buildAIMindmapBranches(makeDocSet(), null, 'en');
    const dataBranch = result.branches.find(b => b.icon === '📊');
    expect(dataBranch).toBeDefined();
  });

  it('generates connections array (may be empty for simple doc sets)', () => {
    const result = buildAIMindmapBranches(makeDocSet(), null, 'en');
    expect(Array.isArray(result.connections)).toBe(true);
  });

  it('generates a dependency connection from pipeline to EU context', () => {
    const result = buildAIMindmapBranches(makeDocSet(), null, 'en');
    const euConn = result.connections.find(c => c.type === 'alignment' && c.to.includes('EU'));
    expect(euConn).toBeDefined();
  });

  it('generates a conflict connection when motions oppose propositions', () => {
    const result = buildAIMindmapBranches(makeDocSet(), null, 'en');
    const conflictConn = result.connections.find(c => c.type === 'conflict');
    expect(conflictConn).toBeDefined();
  });

  it('generates a non-generic summary paragraph', () => {
    const result = buildAIMindmapBranches(makeDocSet(), 'Budget', 'en');
    expect(result.summary).not.toBe('');
    // Should reference the document count
    expect(result.summary).toContain('7');
  });

  it('works with Swedish language output', () => {
    const result = buildAIMindmapBranches(makeDocSet(), null, 'sv');
    expect(result.branches.length).toBeGreaterThanOrEqual(5);
    // Swedish pipeline label
    const pipelineBranch = result.branches.find(b => b.label.includes('Lagstiftning'));
    expect(pipelineBranch).toBeDefined();
  });

  it('works with all branch labels as strings', () => {
    const result = buildAIMindmapBranches(makeDocSet(), null, 'en');
    result.branches.forEach(b => {
      expect(typeof b.label).toBe('string');
      expect(b.label.length).toBeGreaterThan(0);
    });
  });

  it('all branches have a valid color', () => {
    const validColors = ['cyan', 'magenta', 'yellow', 'green', 'purple', 'orange', 'blue', 'red'];
    const result = buildAIMindmapBranches(makeDocSet(), null, 'en');
    result.branches.forEach(b => {
      expect(validColors).toContain(b.color);
    });
  });

  it('handles documents with only motions (no propositions)', () => {
    const docs = [
      makeMotDoc('Motion on healthcare'), makeMotDoc('Motion on education'),
      makeMotDoc('Motion on transport'), makeMotDoc('Motion on environment'),
    ];
    const result = buildAIMindmapBranches(docs, null, 'en');
    expect(result.branches.length).toBeGreaterThanOrEqual(5);
  });

  it('handles a single-document set', () => {
    const result = buildAIMindmapBranches([makePropDoc('Single prop')], null, 'en');
    expect(result.branches.length).toBeGreaterThanOrEqual(1);
    expect(result.summary).toBeTruthy();
  });
});
