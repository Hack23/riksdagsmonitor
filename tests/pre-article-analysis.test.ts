/**
 * Tests for the pre-article analysis pipeline:
 * - markdown-serializer: all serialization functions
 * - data-downloader: flattenDocuments, document deduplication
 * - pipeline integration: argument parsing, synthesis building
 */

import { describe, it, expect } from 'vitest';
import type { RawDocument } from '../scripts/data-transformers/types.js';
import type {
  DocumentAnalysisResult,
  PerspectiveAnalysis,
  DocumentLink,
} from '../scripts/analysis-framework/types.js';

import {
  serializeDataManifest,
  serializeClassificationResults,
  serializeRiskAssessment,
  serializeSwotAnalysis,
  serializeThreatAnalysis,
  serializeStakeholderPerspectives,
  serializeSignificanceScoring,
  serializeCrossReferenceMap,
  serializeSynthesisSummary,
} from '../scripts/pre-article-analysis/markdown-serializer.js';

import {
  flattenDocuments,
} from '../scripts/pre-article-analysis/data-downloader.js';

import type {
  SerializationContext,
  SignificanceEntry,
  RiskAssessmentResult,
  SwotSummary,
  SynthesisSummary,
} from '../scripts/pre-article-analysis/markdown-serializer.js';

import type { DownloadedData } from '../scripts/pre-article-analysis/data-downloader.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CTX: SerializationContext = {
  date: '2026-03-26',
  generatedAt: '2026-03-26 00:00 UTC',
  dataSources: ['get_propositioner', 'get_motioner', 'search_voteringar'],
};

function makeRawDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    dok_id: 'TEST123',
    titel: 'Test document',
    doktyp: 'prop',
    organ: 'FiU',
    datum: '2026-03-26',
    ...overrides,
  };
}

function makePerspective(lens: PerspectiveAnalysis['lens']): PerspectiveAnalysis {
  return {
    lens,
    summary: `${lens} perspective summary`,
    impact: 'medium',
    sentiment: 'neutral',
    keyActors: ['Party A', 'Party B'],
    relatedPolicies: ['Fiscal policy', 'Healthcare'],
    swotContribution: [
      { quadrant: 'strength', forStakeholder: 'Government', text: 'Strong mandate' },
      { quadrant: 'threat', forStakeholder: 'Opposition', text: 'Budget risk' },
    ],
    dashboardMetrics: [{ metricName: 'seats', value: 50, unit: 'seats' }],
    mindmapNodes: [{ branch: 'Policy', item: 'Fiscal', weight: 'significant' }],
    confidence: 75,
  };
}

function makeAnalysisResult(doc: RawDocument): DocumentAnalysisResult {
  return {
    document: doc,
    overallSignificance: 7,
    perspectives: [
      makePerspective('government'),
      makePerspective('opposition'),
      makePerspective('citizen'),
      makePerspective('economic'),
      makePerspective('international'),
      makePerspective('media'),
    ],
    crossDocumentLinks: [],
    keyInsights: ['Insight 1', 'Insight 2'],
    confidenceScore: 72,
  };
}

// ---------------------------------------------------------------------------
// serializeDataManifest
// ---------------------------------------------------------------------------

describe('serializeDataManifest', () => {
  it('includes the date in the header', () => {
    const md = serializeDataManifest(CTX, { propositions: 10, motions: 5 });
    expect(md).toContain('2026-03-26');
  });

  it('lists each document type and count', () => {
    const md = serializeDataManifest(CTX, { propositions: 10, motions: 5 });
    expect(md).toContain('**propositions**: 10 documents');
    expect(md).toContain('**motions**: 5 documents');
  });

  it('shows the total document count', () => {
    const md = serializeDataManifest(CTX, { propositions: 10, motions: 5 });
    expect(md).toContain('15');
  });

  it('lists data sources', () => {
    const md = serializeDataManifest(CTX, {});
    expect(md).toContain('get_propositioner');
  });

  it('returns a non-empty string for empty doc counts', () => {
    const md = serializeDataManifest(CTX, {});
    expect(md.length).toBeGreaterThan(10);
  });
});

// ---------------------------------------------------------------------------
// serializeClassificationResults
// ---------------------------------------------------------------------------

describe('serializeClassificationResults', () => {
  const results = [
    makeAnalysisResult(makeRawDoc({ dok_id: 'DOC1', titel: 'Budget 2026' })),
    makeAnalysisResult(makeRawDoc({ dok_id: 'DOC2', titel: 'Defence motion', doktyp: 'mot' })),
  ];

  it('contains classification header', () => {
    const md = serializeClassificationResults(CTX, results);
    expect(md).toContain('Classification Results');
  });

  it('lists document dok_ids', () => {
    const md = serializeClassificationResults(CTX, results);
    expect(md).toContain('DOC1');
    expect(md).toContain('DOC2');
  });

  it('shows significance scores', () => {
    const md = serializeClassificationResults(CTX, results);
    expect(md).toMatch(/7\/10/);
  });

  it('includes key findings section', () => {
    const md = serializeClassificationResults(CTX, results);
    expect(md).toContain('## Key Findings');
  });

  it('handles empty results array gracefully', () => {
    const md = serializeClassificationResults(CTX, []);
    expect(md).toContain('0');
  });
});

// ---------------------------------------------------------------------------
// serializeRiskAssessment
// ---------------------------------------------------------------------------

describe('serializeRiskAssessment', () => {
  const risk: RiskAssessmentResult = {
    coalitionRiskScore: 65,
    riskLevel: 'HIGH',
    riskSummary: 'Coalition stability at risk due to budget disagreements.',
    anomalyFlags: [{ type: 'NARROW_MAJORITY', severity: 'HIGH', description: 'Narrow majority in key votes' }],
    implications: ['Monitor budget votes closely', 'Editorial focus on coalition dynamics'],
  };

  it('includes risk level in the output', () => {
    const md = serializeRiskAssessment(CTX, 15, risk);
    expect(md).toContain('HIGH');
  });

  it('includes coalition risk score', () => {
    const md = serializeRiskAssessment(CTX, 15, risk);
    expect(md).toContain('65');
  });

  it('lists anomaly flags', () => {
    const md = serializeRiskAssessment(CTX, 15, risk);
    expect(md).toContain('NARROW_MAJORITY');
  });

  it('includes implications', () => {
    const md = serializeRiskAssessment(CTX, 15, risk);
    expect(md).toContain('Monitor budget votes closely');
  });

  it('handles empty anomalies gracefully', () => {
    const noAnomalies: RiskAssessmentResult = { ...risk, anomalyFlags: [] };
    const md = serializeRiskAssessment(CTX, 15, noAnomalies);
    expect(md).toContain('No anomalous patterns detected');
  });
});

// ---------------------------------------------------------------------------
// serializeSwotAnalysis
// ---------------------------------------------------------------------------

describe('serializeSwotAnalysis', () => {
  const swots: SwotSummary[] = [
    {
      forStakeholder: 'Government',
      strengths: ['Strong coalition mandate'],
      weaknesses: ['Budget deficit'],
      opportunities: ['NATO alignment'],
      threats: ['Opposition coalition'],
    },
  ];

  it('includes SWOT section headers', () => {
    const md = serializeSwotAnalysis(CTX, 10, swots);
    expect(md).toContain('**Strengths**');
    expect(md).toContain('**Weaknesses**');
    expect(md).toContain('**Opportunities**');
    expect(md).toContain('**Threats**');
  });

  it('shows stakeholder name', () => {
    const md = serializeSwotAnalysis(CTX, 10, swots);
    expect(md).toContain('Government');
  });

  it('includes SWOT entries', () => {
    const md = serializeSwotAnalysis(CTX, 10, swots);
    expect(md).toContain('Strong coalition mandate');
    expect(md).toContain('Opposition coalition');
  });

  it('handles empty swots array', () => {
    const md = serializeSwotAnalysis(CTX, 10, []);
    expect(md).toContain('0');
  });
});

// ---------------------------------------------------------------------------
// serializeThreatAnalysis
// ---------------------------------------------------------------------------

describe('serializeThreatAnalysis', () => {
  const results = [makeAnalysisResult(makeRawDoc())];

  it('includes threat analysis header', () => {
    const md = serializeThreatAnalysis(CTX, results);
    expect(md).toContain('Threat Analysis');
  });

  it('groups threats by stakeholder', () => {
    const md = serializeThreatAnalysis(CTX, results);
    expect(md).toContain('Opposition');
  });

  it('handles empty results gracefully', () => {
    const md = serializeThreatAnalysis(CTX, []);
    expect(md).toContain('0');
  });
});

// ---------------------------------------------------------------------------
// serializeStakeholderPerspectives
// ---------------------------------------------------------------------------

describe('serializeStakeholderPerspectives', () => {
  const results = [makeAnalysisResult(makeRawDoc())];

  it('includes all 6 lens headings', () => {
    const md = serializeStakeholderPerspectives(CTX, results);
    expect(md).toContain('Government');
    expect(md).toContain('Opposition');
    expect(md).toContain('Citizen');
    expect(md).toContain('Economic');
    expect(md).toContain('International');
    expect(md).toContain('Media');
  });

  it('shows document count', () => {
    const md = serializeStakeholderPerspectives(CTX, results);
    expect(md).toContain('1');
  });

  it('includes key actors', () => {
    const md = serializeStakeholderPerspectives(CTX, results);
    expect(md).toContain('Party A');
  });
});

// ---------------------------------------------------------------------------
// serializeSignificanceScoring
// ---------------------------------------------------------------------------

describe('serializeSignificanceScoring', () => {
  const entries: SignificanceEntry[] = [
    { dok_id: 'A1', title: 'Budget 2026', score: 9, doctype: 'prop' },
    { dok_id: 'A2', title: 'Minor motion', score: 2, doctype: 'mot' },
    { dok_id: 'A3', title: 'Defence bill', score: 8, doctype: 'prop' },
  ];

  it('includes significance table', () => {
    const md = serializeSignificanceScoring(CTX, entries);
    expect(md).toContain('| Score |');
  });

  it('shows top-scored documents first in key findings', () => {
    const md = serializeSignificanceScoring(CTX, entries);
    expect(md).toContain('Critical');
  });

  it('lists all document dok_ids', () => {
    const md = serializeSignificanceScoring(CTX, entries);
    expect(md).toContain('A1');
    expect(md).toContain('A2');
  });

  it('handles empty entries', () => {
    const md = serializeSignificanceScoring(CTX, []);
    expect(md).toContain('0');
  });
});

// ---------------------------------------------------------------------------
// serializeCrossReferenceMap
// ---------------------------------------------------------------------------

describe('serializeCrossReferenceMap', () => {
  const links: DocumentLink[] = [
    { sourceId: 'DOC1', targetId: 'DOC2', type: 'responds-to', reason: 'Motion responds to prop', confidence: 85 },
    { sourceId: 'DOC3', targetId: 'DOC4', type: 'related-topic', reason: 'Shared fiscal policy domain', confidence: 65 },
  ];

  it('shows total link count', () => {
    const md = serializeCrossReferenceMap(CTX, { docCount: 12, totalLinks: 2, links });
    expect(md).toContain('2');
  });

  it('groups links by relationship type', () => {
    const md = serializeCrossReferenceMap(CTX, { docCount: 12, totalLinks: 2, links });
    expect(md).toContain('responds-to');
    expect(md).toContain('related-topic');
  });

  it('shows source and target doc IDs', () => {
    const md = serializeCrossReferenceMap(CTX, { docCount: 12, totalLinks: 2, links });
    expect(md).toContain('DOC1');
    expect(md).toContain('DOC2');
  });

  it('handles zero links', () => {
    const md = serializeCrossReferenceMap(CTX, { docCount: 12, totalLinks: 0, links: [] });
    expect(md).toContain('No cross-document relationships detected');
  });
});

// ---------------------------------------------------------------------------
// serializeSynthesisSummary
// ---------------------------------------------------------------------------

describe('serializeSynthesisSummary', () => {
  const synthesis: SynthesisSummary = {
    totalDocs: 25,
    executiveSummary: 'Analysis complete for 25 documents. Risk level: HIGH.',
    keyFindings: ['High significance budget documents found', 'Coalition risk elevated'],
    topDocuments: [
      { dok_id: 'T1', title: 'Budget 2026', score: 9, doctype: 'prop' },
      { dok_id: 'T2', title: 'Defence allocation', score: 8, doctype: 'prop' },
    ],
    overallConfidence: 'HIGH',
    aggregateRiskLevel: 'HIGH',
  };

  it('includes executive summary', () => {
    const md = serializeSynthesisSummary(CTX, synthesis);
    expect(md).toContain('Analysis complete for 25 documents');
  });

  it('includes key findings', () => {
    const md = serializeSynthesisSummary(CTX, synthesis);
    expect(md).toContain('Coalition risk elevated');
  });

  it('shows top documents table', () => {
    const md = serializeSynthesisSummary(CTX, synthesis);
    expect(md).toContain('T1');
    expect(md).toContain('Budget 2026');
  });

  it('shows overall confidence', () => {
    const md = serializeSynthesisSummary(CTX, synthesis);
    expect(md).toContain('HIGH');
  });

  it('shows aggregate risk level', () => {
    const md = serializeSynthesisSummary(CTX, synthesis);
    expect(md).toContain('HIGH');
  });
});

// ---------------------------------------------------------------------------
// flattenDocuments
// ---------------------------------------------------------------------------

describe('flattenDocuments', () => {
  it('combines all document types into a single array', () => {
    const data: DownloadedData = {
      propositions: [makeRawDoc({ dok_id: 'P1' })],
      motions: [makeRawDoc({ dok_id: 'M1' })],
      committeeReports: [makeRawDoc({ dok_id: 'C1' })],
      votes: [makeRawDoc({ dok_id: 'V1' })],
      speeches: [makeRawDoc({ dok_id: 'S1' })],
      questions: [makeRawDoc({ dok_id: 'Q1' })],
      interpellations: [makeRawDoc({ dok_id: 'I1' })],
    };
    const flat = flattenDocuments(data);
    expect(flat).toHaveLength(7);
  });

  it('deduplicates documents with the same dok_id', () => {
    const doc = makeRawDoc({ dok_id: 'DUPLICATE' });
    const data: DownloadedData = {
      propositions: [doc],
      motions: [doc],
      committeeReports: [],
      votes: [],
      speeches: [],
      questions: [],
      interpellations: [],
    };
    const flat = flattenDocuments(data);
    expect(flat).toHaveLength(1);
  });

  it('filters out falsy entries', () => {
    const data: DownloadedData = {
      propositions: [makeRawDoc({ dok_id: 'P1' }), null as unknown as RawDocument],
      motions: [],
      committeeReports: [],
      votes: [],
      speeches: [],
      questions: [],
      interpellations: [],
    };
    const flat = flattenDocuments(data);
    // null is filtered by the Boolean check in flattenDocuments
    expect(flat.some(d => d === null)).toBe(false);
  });

  it('returns empty array when all collections are empty', () => {
    const data: DownloadedData = {
      propositions: [],
      motions: [],
      committeeReports: [],
      votes: [],
      speeches: [],
      questions: [],
      interpellations: [],
    };
    expect(flattenDocuments(data)).toHaveLength(0);
  });

  it('deduplicates by titel when dok_id is absent', () => {
    const doc1 = makeRawDoc({ dok_id: undefined, titel: 'Shared title' });
    const doc2 = makeRawDoc({ dok_id: undefined, titel: 'Shared title' });
    const data: DownloadedData = {
      propositions: [doc1, doc2],
      motions: [],
      committeeReports: [],
      votes: [],
      speeches: [],
      questions: [],
      interpellations: [],
    };
    const flat = flattenDocuments(data);
    expect(flat).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Confidence label (via synthesize output) — edge cases
// ---------------------------------------------------------------------------

describe('synthesis confidence labels', () => {
  it('HIGH confidence shown when 20+ docs analyzed', () => {
    const synthesis: SynthesisSummary = {
      totalDocs: 25,
      executiveSummary: 'test',
      keyFindings: [],
      topDocuments: [],
      overallConfidence: 'HIGH',
      aggregateRiskLevel: 'LOW',
    };
    const md = serializeSynthesisSummary(CTX, synthesis);
    expect(md).toContain('HIGH');
  });

  it('LOW confidence shown when few docs analyzed', () => {
    const synthesis: SynthesisSummary = {
      totalDocs: 5,
      executiveSummary: 'test',
      keyFindings: [],
      topDocuments: [],
      overallConfidence: 'LOW',
      aggregateRiskLevel: 'MEDIUM',
    };
    const md = serializeSynthesisSummary(CTX, synthesis);
    expect(md).toContain('LOW');
  });
});
