/**
 * Tests for buildAIMindmapAnalysis and buildMindmapOptionsFromAnalysis.
 * Validates AI-driven conceptual mindmap generation across 5 political
 * dimensions, stakeholder sub-branches, connections, and central thesis.
 */

import { describe, it, expect } from 'vitest';
import {
  buildAIMindmapAnalysis,
  buildMindmapOptionsFromAnalysis,
} from '../scripts/data-transformers/content-generators/ai-mindmap-analyzer.js';
import type { AIMindmapAnalysis } from '../scripts/data-transformers/content-generators/ai-mindmap-analyzer.js';
import type { RawDocument } from '../scripts/data-transformers/types.js';

/** Build a set of mock parliamentary documents for testing */
function makeDocs(): RawDocument[] {
  return [
    { doktyp: 'prop', titel: 'Budget Bill 2026', datum: new Date().toISOString().slice(0, 10), organ: 'FiU' },
    { doktyp: 'bet',  titel: 'Committee Report on Finance', datum: '2025-12-01', organ: 'FiU' },
    { doktyp: 'mot',  titel: 'Motion on Climate Policy', datum: '2025-11-15', organ: 'MJU' },
    { doktyp: 'fpm',  titel: 'EU Position Paper', datum: '2025-10-01' },
    { doktyp: 'pressm', titel: 'Government Press Release', datum: new Date().toISOString().slice(0, 10) },
  ];
}

describe('buildAIMindmapAnalysis', () => {
  it('returns an AIMindmapAnalysis with all required fields', () => {
    const analysis = buildAIMindmapAnalysis(makeDocs(), 'Budget Policy', 'en');
    expect(analysis).toHaveProperty('centralThesis');
    expect(analysis).toHaveProperty('branches');
    expect(analysis).toHaveProperty('connections');
    expect(analysis).toHaveProperty('confidenceScore');
  });

  it('returns exactly 5 branches', () => {
    const analysis = buildAIMindmapAnalysis(makeDocs(), 'Tax Reform', 'en');
    expect(analysis.branches).toHaveLength(5);
  });

  it('assigns each branch a distinct dimension', () => {
    const analysis = buildAIMindmapAnalysis(makeDocs(), 'Housing', 'en');
    const dimensions = analysis.branches.map(b => b.dimension).filter(Boolean);
    const unique = new Set(dimensions);
    expect(unique.size).toBe(5);
    expect(unique).toContain('power');
    expect(unique).toContain('impact');
    expect(unique).toContain('timeline');
    expect(unique).toContain('scope');
    expect(unique).toContain('motivation');
  });

  it('generates a non-empty centralThesis', () => {
    const analysis = buildAIMindmapAnalysis(makeDocs(), 'Energy Policy', 'en');
    expect(typeof analysis.centralThesis).toBe('string');
    expect(analysis.centralThesis.length).toBeGreaterThan(10);
  });

  it('includes the topic in the centralThesis', () => {
    const analysis = buildAIMindmapAnalysis(makeDocs(), 'Defence Budget', 'en');
    expect(analysis.centralThesis).toContain('Defence Budget');
  });

  it('centralThesis falls back gracefully when topic is null', () => {
    const analysis = buildAIMindmapAnalysis(makeDocs(), null, 'en');
    expect(typeof analysis.centralThesis).toBe('string');
    expect(analysis.centralThesis.length).toBeGreaterThan(5);
  });

  it('produces cross-branch connections', () => {
    const analysis = buildAIMindmapAnalysis(makeDocs(), 'Climate', 'en');
    expect(analysis.connections.length).toBeGreaterThan(0);
    analysis.connections.forEach(c => {
      expect(typeof c.fromBranch).toBe('string');
      expect(typeof c.toBranch).toBe('string');
      expect(typeof c.relationship).toBe('string');
    });
  });

  it('confidenceScore is in [0, 1]', () => {
    const analysis = buildAIMindmapAnalysis(makeDocs(), 'Justice', 'en');
    expect(analysis.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(analysis.confidenceScore).toBeLessThanOrEqual(1);
  });

  it('confidenceScore is 0 for empty docs', () => {
    const analysis = buildAIMindmapAnalysis([], null, 'en');
    expect(analysis.confidenceScore).toBe(0);
  });

  it('handles empty docs array without error', () => {
    expect(() => buildAIMindmapAnalysis([], null, 'en')).not.toThrow();
    const analysis = buildAIMindmapAnalysis([], null, 'en');
    expect(analysis.branches).toHaveLength(5);
    expect(analysis.connections.length).toBeGreaterThanOrEqual(0);
  });

  it('each branch has aiItems with valid weights', () => {
    const analysis = buildAIMindmapAnalysis(makeDocs(), 'Social Policy', 'en');
    const validWeights = new Set(['critical', 'significant', 'moderate', 'minor']);
    for (const branch of analysis.branches) {
      if (branch.aiItems) {
        for (const item of branch.aiItems) {
          expect(validWeights).toContain(item.weight);
        }
      }
    }
  });

  it('each branch has sub-branches for stakeholder perspectives', () => {
    const analysis = buildAIMindmapAnalysis(makeDocs(), 'Education', 'en');
    const branchesWithSubs = analysis.branches.filter(b => b.subBranches && b.subBranches.length > 0);
    expect(branchesWithSubs.length).toBeGreaterThan(0);
  });

  it('power branch reflects document counts', () => {
    const docs = makeDocs();
    const analysis = buildAIMindmapAnalysis(docs, 'Finance', 'en');
    const powerBranch = analysis.branches.find(b => b.dimension === 'power');
    expect(powerBranch).toBeDefined();
    // Power branch aiItems should include government and opposition document counts
    const itemTexts = powerBranch!.aiItems?.map(i => i.text) ?? [];
    expect(itemTexts.some(t => /Government/.test(t))).toBe(true);
    expect(itemTexts.some(t => /Opposition/.test(t))).toBe(true);
  });

  it('scope branch reflects EU document presence', () => {
    const docs = makeDocs(); // includes fpm (EU) doc
    const analysis = buildAIMindmapAnalysis(docs, 'EU Affairs', 'en');
    const scopeBranch = analysis.branches.find(b => b.dimension === 'scope');
    expect(scopeBranch).toBeDefined();
    const itemTexts = scopeBranch!.aiItems?.map(i => i.text) ?? [];
    expect(itemTexts.some(t => /EU|international/i.test(t))).toBe(true);
  });

  it('generates Swedish-language labels for sv', () => {
    const analysis = buildAIMindmapAnalysis(makeDocs(), 'Hälsovård', 'sv');
    // Power branch should have Swedish label
    const powerBranch = analysis.branches.find(b => b.dimension === 'power');
    expect(powerBranch?.label).toBe('Maktdynamik');
  });

  it('generates labels for all 14 supported languages', () => {
    const langs = ['en','sv','da','no','fi','de','fr','es','nl','ar','he','ja','ko','zh'] as const;
    for (const lang of langs) {
      const analysis = buildAIMindmapAnalysis(makeDocs(), 'Policy', lang);
      // All 5 dimension branches should have non-empty labels
      for (const branch of analysis.branches) {
        expect(branch.label.length).toBeGreaterThan(0);
      }
      // centralThesis should be non-empty
      expect(analysis.centralThesis.length).toBeGreaterThan(5);
    }
  });
});

describe('buildMindmapOptionsFromAnalysis', () => {
  let analysis: AIMindmapAnalysis;

  it('returns MindmapSectionOptions with correct fields', () => {
    analysis = buildAIMindmapAnalysis(makeDocs(), 'Security', 'en');
    const opts = buildMindmapOptionsFromAnalysis(analysis, 'en', 'Security Policy');
    expect(opts.topic).toBe('Security Policy');
    expect(opts.branches).toBe(analysis.branches);
    expect(opts.centralThesis).toBe(analysis.centralThesis);
    expect(opts.connections).toBe(analysis.connections);
    expect(opts.lang).toBe('en');
  });

  it('applies title and summary overrides', () => {
    analysis = buildAIMindmapAnalysis(makeDocs(), 'Security', 'en');
    const opts = buildMindmapOptionsFromAnalysis(analysis, 'en', 'Security Policy', {
      title: 'Custom Title',
      summary: 'Custom summary text',
    });
    expect(opts.title).toBe('Custom Title');
    expect(opts.summary).toBe('Custom summary text');
  });
});

describe('buildAIMindmapAnalysis — localization completeness', () => {
  const nonEnglishLangs: Array<{ code: string; name: string; sampleWord: RegExp }> = [
    { code: 'sv', name: 'Swedish', sampleWord: /Maktdynamik/ },
    { code: 'de', name: 'German', sampleWord: /Machtdynamik/ },
    { code: 'fr', name: 'French', sampleWord: /Dynamiques de pouvoir/ },
    { code: 'ja', name: 'Japanese', sampleWord: /権力力学/ },
    { code: 'zh', name: 'Chinese', sampleWord: /权力动态/ },
    { code: 'ar', name: 'Arabic', sampleWord: /ديناميكيات القوة/ },
  ];

  nonEnglishLangs.forEach(({ code, name, sampleWord }) => {
    it(`timeline branch items do not contain English-only text for ${name}`, () => {
      const analysis = buildAIMindmapAnalysis(makeDocs(), 'Policy', code);
      const timelineBranch = analysis.branches.find(b => b.dimension === 'timeline');
      expect(timelineBranch).toBeDefined();
      const itemTexts = timelineBranch!.aiItems?.map(i => i.text).join(' ') ?? '';
      // Should NOT have the old English-only strings
      expect(itemTexts).not.toContain('Recent activity:');
      expect(itemTexts).not.toContain('Active propositions:');
      expect(itemTexts).not.toContain('Total legislative pipeline:');
    });

    it(`power branch label uses localized text for ${name}`, () => {
      const analysis = buildAIMindmapAnalysis(makeDocs(), 'Policy', code);
      const powerBranch = analysis.branches.find(b => b.dimension === 'power');
      expect(powerBranch?.label).toMatch(sampleWord);
    });
  });

  // Languages where document word is clearly different from English
  const distinctDocLangs: Array<{ code: string; name: string; docWord: RegExp }> = [
    { code: 'sv', name: 'Swedish', docWord: /dokument/ },
    { code: 'de', name: 'German', docWord: /Dokument/ },
    { code: 'ja', name: 'Japanese', docWord: /件/ },
    { code: 'zh', name: 'Chinese', docWord: /份文件/ },
    { code: 'ar', name: 'Arabic', docWord: /وثيقة/ },
  ];

  distinctDocLangs.forEach(({ code, name, docWord }) => {
    it(`power branch items use localized document word for ${name}`, () => {
      const analysis = buildAIMindmapAnalysis(makeDocs(), 'Policy', code);
      const powerBranch = analysis.branches.find(b => b.dimension === 'power');
      expect(powerBranch).toBeDefined();
      const itemTexts = powerBranch!.aiItems?.map(i => i.text).join(' ') ?? '';
      expect(itemTexts).toMatch(docWord);
    });
  });

  it('precomputedDomains parameter avoids duplicate domain detection', () => {
    const docs = makeDocs();
    const domains = ['Healthcare', 'Finance'];
    const analysis1 = buildAIMindmapAnalysis(docs, 'Test', 'en', domains);
    const analysis2 = buildAIMindmapAnalysis(docs, 'Test', 'en');
    // Both should produce same number of branches/connections
    expect(analysis1.branches).toHaveLength(5);
    expect(analysis1.connections.length).toBeGreaterThan(0);
    // Impact branch should use the precomputed domains
    const impactBranch = analysis1.branches.find(b => b.dimension === 'impact');
    expect(impactBranch?.aiItems?.some(i => i.text === 'Healthcare')).toBe(true);
    // Normal analysis should still work
    expect(analysis2.branches).toHaveLength(5);
  });

  it('null topic fallback uses localized language for German', () => {
    const analysis = buildAIMindmapAnalysis([], null, 'de');
    expect(analysis.centralThesis).toContain('parlamentarische Tätigkeit');
    expect(analysis.centralThesis).not.toContain('parliamentary activity');
  });

  it('null topic fallback uses localized language for Swedish', () => {
    const analysis = buildAIMindmapAnalysis([], null, 'sv');
    expect(analysis.centralThesis).toContain('riksdagsverksamhet');
    expect(analysis.centralThesis).not.toContain('parliamentary activity');
  });
});
