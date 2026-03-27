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
  serializeDocumentAnalysis,
  sanitizeDokId,
} from '../scripts/pre-article-analysis/markdown-serializer.js';

import {
  flattenDocuments,
  downloadAllDocuments,
} from '../scripts/pre-article-analysis/data-downloader.js';

import { parseArgs } from '../scripts/pre-article-analysis.js';
import { buildWeeklySynthesisMarkdown } from '../scripts/pre-article-analysis.js';

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

  it('shows date-filtered total when provided', () => {
    const md = serializeDataManifest(CTX, { propositions: 10, motions: 5 }, 8);
    expect(md).toContain('**8** documents selected for analysis');
    expect(md).toContain('**15** documents (session-wide)');
  });

  it('uses date-filtered count in frontmatter Documents Analyzed when provided', () => {
    const md = serializeDataManifest(CTX, { propositions: 10, motions: 5 }, 8);
    expect(md).toContain('**Documents Analyzed**: 8');
  });

  it('falls back to session-wide total when dateFilteredTotal is omitted', () => {
    const md = serializeDataManifest(CTX, { propositions: 10, motions: 5 });
    expect(md).toContain('**Documents Analyzed**: 15');
    expect(md).not.toContain('documents selected for analysis');
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

  it('escapes markdown table control characters in cell values', () => {
    const md = serializeSignificanceScoring(CTX, [
      { dok_id: 'A|1\\x', title: 'Budget\n2026 | revised \\test', score: 9, doctype: 'pr|op\\x' },
    ]);
    expect(md).toContain('A\\|1');
    expect(md).toContain('pr\\|op');
    expect(md).toContain('A\\|1\\\\x');
    expect(md).toContain('pr\\|op\\\\x');
    expect(md).toContain('Budget 2026 \\| revised');
    expect(md).toContain('Budget 2026 \\| revised \\\\test');
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

  it('escapes markdown table control characters in top document cells', () => {
    const escaped: SynthesisSummary = {
      ...synthesis,
      topDocuments: [
        { dok_id: 'X|42\\z', title: 'Title\nwith | separators \\x', score: 8, doctype: 'ty|pe\\z' },
      ],
    };
    const md = serializeSynthesisSummary(CTX, escaped);
    expect(md).toContain('X\\|42');
    expect(md).toContain('ty\\|pe');
    expect(md).toContain('X\\|42\\\\z');
    expect(md).toContain('ty\\|pe\\\\z');
    expect(md).toContain('Title with \\| separators');
    expect(md).toContain('Title with \\| separators \\\\x');
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

  it('deduplicates by title when titel is absent', () => {
    const sharedFallback = { dok_id: undefined, titel: undefined, title: 'Shared fallback title' } as unknown as Partial<RawDocument>;
    const doc1 = makeRawDoc(sharedFallback);
    const doc2 = makeRawDoc(sharedFallback);
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

  it('uses dok_url as fallback identifier when dok_id is absent', () => {
    const sharedFallback = { dok_id: undefined, titel: undefined, dok_url: 'https://data.riksdagen.se/dokument/ABC123' } as unknown as Partial<RawDocument>;
    const doc1 = makeRawDoc(sharedFallback);
    const doc2 = makeRawDoc(sharedFallback);
    const data: DownloadedData = {
      propositions: [doc1],
      motions: [doc2],
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

// ---------------------------------------------------------------------------
// parseArgs — CLI validation
// ---------------------------------------------------------------------------

describe('parseArgs', () => {
  it('accepts a valid YYYY-MM-DD date', () => {
    const result = parseArgs(['node', 'script', '--date', '2026-03-26']);
    expect(result.date).toBe('2026-03-26');
  });

  it('resolves "today" to a valid ISO date', () => {
    const result = parseArgs(['node', 'script', '--date', 'today']);
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('defaults date to today when --date is omitted', () => {
    const result = parseArgs(['node', 'script']);
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('throws on an invalid --date value', () => {
    expect(() => parseArgs(['node', 'script', '--date', 'not-a-date'])).toThrow('Invalid --date');
  });

  it('throws on a malformed date like 2026-02-30', () => {
    expect(() => parseArgs(['node', 'script', '--date', '2026-02-30'])).toThrow('Invalid --date');
  });

  it('accepts a valid --limit', () => {
    const result = parseArgs(['node', 'script', '--limit', '50']);
    expect(result.limit).toBe(50);
  });

  it('defaults limit to 20 when --limit is omitted', () => {
    const result = parseArgs(['node', 'script']);
    expect(result.limit).toBe(20);
  });

  it('throws on a non-numeric --limit', () => {
    expect(() => parseArgs(['node', 'script', '--limit', 'abc'])).toThrow('Invalid --limit');
  });

  it('throws on a decimal --limit', () => {
    expect(() => parseArgs(['node', 'script', '--limit', '10.5'])).toThrow('Invalid --limit');
  });

  it('throws on an alphanumeric --limit', () => {
    expect(() => parseArgs(['node', 'script', '--limit', '10abc'])).toThrow('Invalid --limit');
  });

  it('throws on a negative --limit', () => {
    expect(() => parseArgs(['node', 'script', '--limit', '-5'])).toThrow('Invalid --limit');
  });

  it('throws on --limit of zero', () => {
    expect(() => parseArgs(['node', 'script', '--limit', '0'])).toThrow('Invalid --limit');
  });

  it('accepts --aggregate weekly with a valid week label', () => {
    const result = parseArgs(['node', 'script', '--aggregate', 'weekly', '--date', '2026-W13']);
    expect(result.aggregate).toBe(true);
    expect(result.weekLabel).toBe('2026-W13');
    // date must always be a YYYY-MM-DD value, even in aggregate mode
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('throws on an invalid weekly --date label', () => {
    expect(() => parseArgs(['node', 'script', '--aggregate', 'weekly', '--date', 'bad-week'])).toThrow('Invalid weekly --date');
  });

  it('throws on unsupported --aggregate value', () => {
    expect(() => parseArgs(['node', 'script', '--aggregate', 'monthly'])).toThrow('Invalid --aggregate value');
  });

  it('accepts --rm override', () => {
    const result = parseArgs(['node', 'script', '--rm', '2025/26']);
    expect(result.rm).toBe('2025/26');
  });

  it('throws when --date flag is present without a value', () => {
    expect(() => parseArgs(['node', 'script', '--date'])).toThrow('Missing value for --date');
  });

  it('throws when --date is followed by another flag instead of a value', () => {
    expect(() => parseArgs(['node', 'script', '--date', '--limit', '10'])).toThrow('Missing value for --date');
  });

  it('throws when --limit flag is present without a value', () => {
    expect(() => parseArgs(['node', 'script', '--limit'])).toThrow('Missing value for --limit');
  });

  it('throws when --rm flag is present without a value', () => {
    expect(() => parseArgs(['node', 'script', '--rm'])).toThrow('Missing value for --rm');
  });
});

// ---------------------------------------------------------------------------
// downloadAllDocuments — parallel fetch behaviour
// ---------------------------------------------------------------------------

describe('downloadAllDocuments', () => {
  /** Minimal MCPClient stub factory. Each method resolves to `override[name]`
   *  if provided, or an empty array otherwise. A `reject` key causes that
   *  method to throw. */
  function stubClient(overrides: Record<string, unknown[] | Error> = {}): any {
    const make = (name: string) => {
      return async () => {
        const val = overrides[name];
        if (val instanceof Error) throw val;
        return val ?? [];
      };
    };
    return {
      fetchPropositions: make('fetchPropositions'),
      fetchMotions: make('fetchMotions'),
      fetchCommitteeReports: make('fetchCommitteeReports'),
      fetchVotingRecords: make('fetchVotingRecords'),
      searchSpeeches: make('searchSpeeches'),
      fetchWrittenQuestions: make('fetchWrittenQuestions'),
      fetchInterpellations: make('fetchInterpellations'),
    };
  }

  it('returns empty collections when all fetches return nothing', async () => {
    const { data, manifest } = await downloadAllDocuments(stubClient());
    expect(data.propositions).toHaveLength(0);
    expect(data.motions).toHaveLength(0);
    expect(data.committeeReports).toHaveLength(0);
    expect(data.votes).toHaveLength(0);
    expect(data.speeches).toHaveLength(0);
    expect(data.questions).toHaveLength(0);
    expect(data.interpellations).toHaveLength(0);
    expect(manifest.dataSources).toHaveLength(7);
    expect(manifest.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('populates document counts from successful fetches', async () => {
    const client = stubClient({
      fetchPropositions: [{ dok_id: 'p1' }, { dok_id: 'p2' }],
      fetchMotions: [{ dok_id: 'm1' }],
    });
    const { data, manifest } = await downloadAllDocuments(client);
    expect(data.propositions).toHaveLength(2);
    expect(data.motions).toHaveLength(1);
    expect(manifest.docCounts.propositions).toBe(2);
    expect(manifest.docCounts.motions).toBe(1);
    expect(manifest.docCounts.interpellations).toBe(0);
  });

  it('collects partial results when one fetch rejects', async () => {
    const client = stubClient({
      fetchPropositions: [{ dok_id: 'p1' }],
      fetchMotions: new Error('MCP unavailable'),
    });
    const { data, manifest } = await downloadAllDocuments(client);
    // propositions should still be present
    expect(data.propositions).toHaveLength(1);
    // motions should be empty (failed)
    expect(data.motions).toHaveLength(0);
    // dataSources should not include the failed source
    expect(manifest.dataSources).not.toContain('get_motioner');
    expect(manifest.dataSources).toContain('get_propositioner');
  });

  it('includes all 7 document types in docCounts', async () => {
    const { manifest } = await downloadAllDocuments(stubClient());
    const keys = Object.keys(manifest.docCounts);
    expect(keys).toContain('propositions');
    expect(keys).toContain('motions');
    expect(keys).toContain('committeeReports');
    expect(keys).toContain('votes');
    expect(keys).toContain('speeches');
    expect(keys).toContain('questions');
    expect(keys).toContain('interpellations');
  });

  it('records durationMs as a non-negative number', async () => {
    const { manifest } = await downloadAllDocuments(stubClient());
    expect(typeof manifest.durationMs).toBe('number');
    expect(manifest.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('continues when post-processing assign throws for one source', async () => {
    const badPayload = [null];
    const client = stubClient({
      fetchPropositions: [{ dok_id: 'p1' }],
      fetchMotions: badPayload,
    });

    const { data, manifest } = await downloadAllDocuments(client);
    expect(data.propositions).toHaveLength(1);
    // normalise([null]) -> [] so assignment still works; source remains included
    expect(data.motions).toHaveLength(0);
    expect(manifest.dataSources).toContain('get_motioner');
  });

  it('handles non-array payloads as post-processing failures and keeps partial results', async () => {
    const client = stubClient({
      fetchPropositions: [{ dok_id: 'p1' }],
      fetchMotions: 'not-an-array' as unknown as unknown[],
    });

    const { data, manifest } = await downloadAllDocuments(client);
    expect(data.propositions).toHaveLength(1);
    expect(data.motions).toHaveLength(0);
    expect(manifest.dataSources).toContain('get_propositioner');
    expect(manifest.dataSources).not.toContain('get_motioner');
  });

  it('returns empty dataSources when all fetches reject', async () => {
    const err = new Error('all failed');
    const client = stubClient({
      fetchPropositions: err,
      fetchMotions: err,
      fetchCommitteeReports: err,
      fetchVotingRecords: err,
      searchSpeeches: err,
      fetchWrittenQuestions: err,
      fetchInterpellations: err,
    });

    const { data, manifest } = await downloadAllDocuments(client);
    expect(manifest.dataSources).toEqual([]);
    expect(data.propositions).toHaveLength(0);
    expect(data.motions).toHaveLength(0);
    expect(data.committeeReports).toHaveLength(0);
    expect(data.votes).toHaveLength(0);
    expect(data.speeches).toHaveLength(0);
    expect(data.questions).toHaveLength(0);
    expect(data.interpellations).toHaveLength(0);
  });
});

describe('weekly aggregation output', () => {
  it('uses standardized frontmatter fields in weekly-synthesis output', () => {
    const output = buildWeeklySynthesisMarkdown({
      weekLabel: '2026-W13',
      generatedAt: '2026-03-26 17:00 UTC',
      documentsAnalyzed: 12,
      daysIncluded: 1,
      allSyntheses: '\n\n---\n\n## Day: 2026-03-23\n\nSample synthesis.',
    });

    expect(output).toContain('**Generated**: 2026-03-26 17:00 UTC');
    expect(output).toMatch(/\*\*Generated\*\*:\s\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\sUTC/);
    expect(output).toContain('**Data Sources**: Aggregated from daily synthesis summaries');
    expect(output).toContain('**Documents Analyzed**: 12');
    expect(output).toContain('**Confidence**: MEDIUM');
    expect(output).toContain('**Days Included**: 1');
    expect(output).toContain('## Day: 2026-03-23');
    expect(output).toContain('Sample synthesis.');
  });
});

// ---------------------------------------------------------------------------
// serializeDocumentAnalysis — per-document analysis files
// ---------------------------------------------------------------------------

describe('serializeDocumentAnalysis', () => {
  it('includes full document metadata in frontmatter', () => {
    const doc = makeRawDoc({
      dok_id: 'H901FiU10',
      titel: 'Ekonomisk politik',
      doktyp: 'bet',
      organ: 'FiU',
      datum: '2026-03-26',
      intressent_namn: 'Anna Svensson',
      parti: 'S',
      rm: '2025/26',
    });
    const result = makeAnalysisResult(doc);
    const md = serializeDocumentAnalysis(CTX, result);

    expect(md).toContain('# Document Analysis: Ekonomisk politik');
    expect(md).toContain('**dok_id**: H901FiU10');
    expect(md).toContain('**Document Type**: bet');
    expect(md).toContain('**Committee**: FiU');
    expect(md).toContain('**Author**: Anna Svensson');
    expect(md).toContain('**Party**: S');
    expect(md).toContain('**Riksmöte**: 2025/26');
    expect(md).toContain('**Significance**: 🟠 High (7/10)');
    expect(md).toContain('**Confidence**: HIGH (72%)');
  });

  it('includes executive summary with key insights', () => {
    const doc = makeRawDoc();
    const result = makeAnalysisResult(doc);
    const md = serializeDocumentAnalysis(CTX, result);

    expect(md).toContain('## Executive Summary');
    expect(md).toContain('- Insight 1');
    expect(md).toContain('- Insight 2');
  });

  it('generates SWOT analysis per stakeholder', () => {
    const doc = makeRawDoc();
    const result = makeAnalysisResult(doc);
    const md = serializeDocumentAnalysis(CTX, result);

    expect(md).toContain('## SWOT Analysis');
    expect(md).toContain('### SWOT: Government');
    expect(md).toContain('#### Strengths 💪');
    expect(md).toContain('Strong mandate');
    expect(md).toContain('#### Threats 🔴');
    expect(md).toContain('Budget risk');
  });

  it('includes all 6 stakeholder perspectives', () => {
    const doc = makeRawDoc();
    const result = makeAnalysisResult(doc);
    const md = serializeDocumentAnalysis(CTX, result);

    expect(md).toContain('## Stakeholder Perspective Analysis');
    expect(md).toContain('### 🏛️ Government Perspective');
    expect(md).toContain('### ⚖️ Opposition Perspective');
    expect(md).toContain('### 👥 Citizen Perspective');
    expect(md).toContain('### 💰 Economic Perspective');
    expect(md).toContain('### 🌍 International Perspective');
    expect(md).toContain('### 📰 Media Perspective');
  });

  it('includes dashboard metrics for each perspective', () => {
    const doc = makeRawDoc();
    const result = makeAnalysisResult(doc);
    const md = serializeDocumentAnalysis(CTX, result);

    expect(md).toContain('**Dashboard Metrics**:');
    expect(md).toContain('seats: 50 seats');
  });

  it('includes significance assessment with scoring factors', () => {
    const doc = makeRawDoc();
    const result = makeAnalysisResult(doc);
    const md = serializeDocumentAnalysis(CTX, result);

    expect(md).toContain('## Significance Assessment');
    expect(md).toContain('**Overall Score**: 7/10');
    expect(md).toContain('Document type tier (prop)');
    expect(md).toContain('Committee tier (FiU)');
    expect(md).toContain('Policy domain breadth');
  });

  it('includes cross-document references when present', () => {
    const doc = makeRawDoc();
    const result = makeAnalysisResult(doc);
    result.crossDocumentLinks = [
      { sourceId: 'DOC1', targetId: 'DOC2', type: 'responds-to', reason: 'Opposition motion', confidence: 85 },
    ];
    const md = serializeDocumentAnalysis(CTX, result);

    expect(md).toContain('## Cross-Document References');
    expect(md).toContain('responds-to');
    expect(md).toContain('DOC1 → DOC2');
    expect(md).toContain('confidence: 85%');
  });

  it('handles documents without full-text content', () => {
    const doc = makeRawDoc({ fullText: undefined, fullContent: undefined });
    const result = makeAnalysisResult(doc);
    const md = serializeDocumentAnalysis(CTX, result);

    expect(md).toContain('No — metadata-only ⚠️');
    expect(md).toContain('Metadata-only');
  });

  it('handles documents with full-text content', () => {
    const doc = makeRawDoc({ fullText: 'Some full text content here' });
    const result = makeAnalysisResult(doc);
    const md = serializeDocumentAnalysis(CTX, result);

    expect(md).toContain('Yes ✅');
    expect(md).toContain('Full-text available');
  });

  it('includes data quality notes section', () => {
    const doc = makeRawDoc();
    const result = makeAnalysisResult(doc);
    const md = serializeDocumentAnalysis(CTX, result);

    expect(md).toContain('## Data Quality Notes');
    expect(md).toContain('6-lens stakeholder analysis with SWOT extraction');
  });

  it('escapes markdown-special characters in user-sourced and AI-generated text', () => {
    const dangerous = 'Text with # heading, *stars*, [link] and <tag>';
    const doc = makeRawDoc({ summary: dangerous });
    const result = makeAnalysisResult(doc);
    result.keyInsights = [dangerous];

    // Override a SWOT contribution text
    result.perspectives[0].swotContribution[0].text = dangerous;
    result.perspectives[0].summary = dangerous;

    const md = serializeDocumentAnalysis(CTX, result);

    // The raw dangerous string should NOT appear unescaped
    expect(md).not.toContain(`- ${dangerous}`);
    expect(md).not.toContain(`**Summary**: ${dangerous}`);

    // Escaped versions should be present
    expect(md).toContain('\\#');
    expect(md).toContain('\\*');
    expect(md).toContain('\\[');
    expect(md).toContain('\\<');
  });
});

// ---------------------------------------------------------------------------
// sanitizeDokId — filename sanitization
// ---------------------------------------------------------------------------

describe('sanitizeDokId', () => {
  it('lowercases and replaces special characters', () => {
    expect(sanitizeDokId('H901FiU10')).toBe('h901fiu10');
  });

  it('replaces spaces and slashes with hyphens', () => {
    expect(sanitizeDokId('Some Doc/ID 2025')).toBe('some-doc-id-2025');
  });

  it('collapses multiple hyphens', () => {
    expect(sanitizeDokId('DOC--ID---123')).toBe('doc-id-123');
  });

  it('truncates to 100 characters', () => {
    const longId = 'A'.repeat(200);
    expect(sanitizeDokId(longId).length).toBeLessThanOrEqual(100);
  });

  it('removes leading and trailing hyphens', () => {
    expect(sanitizeDokId('--test-id--')).toBe('test-id');
  });

  it('handles empty string', () => {
    expect(sanitizeDokId('')).toBe('');
  });

  it('preserves Swedish characters', () => {
    const result = sanitizeDokId('Årsredovisning-Ämne');
    expect(result).toContain('årsredovisning');
    expect(result).toContain('ämne');
  });
});

// ---------------------------------------------------------------------------
// parseArgs — --doc-type parameter
// ---------------------------------------------------------------------------

describe('parseArgs --doc-type', () => {
  it('returns null docType when --doc-type is omitted', () => {
    const result = parseArgs(['node', 'script', '--date', '2026-03-26']);
    expect(result.docType).toBeNull();
  });

  it('accepts a valid --doc-type value', () => {
    const result = parseArgs(['node', 'script', '--date', '2026-03-26', '--doc-type', 'propositions']);
    expect(result.docType).toBe('propositions');
  });

  it('accepts committeeReports as --doc-type', () => {
    const result = parseArgs(['node', 'script', '--date', '2026-03-26', '--doc-type', 'committeeReports']);
    expect(result.docType).toBe('committeeReports');
  });

  it('accepts all valid doc-type values', () => {
    const validTypes = ['propositions', 'motions', 'committeeReports', 'votes', 'speeches', 'questions', 'interpellations'];
    for (const dt of validTypes) {
      const result = parseArgs(['node', 'script', '--doc-type', dt]);
      expect(result.docType).toBe(dt);
    }
  });

  it('throws on an invalid --doc-type value', () => {
    expect(() => parseArgs(['node', 'script', '--doc-type', 'invalid']))
      .toThrow('Invalid --doc-type value');
  });
});

// ---------------------------------------------------------------------------
// downloadAllDocuments — docTypes filtering
// ---------------------------------------------------------------------------

describe('downloadAllDocuments with docTypes filter', () => {
  function stubClient(overrides: Record<string, unknown[] | Error> = {}): any {
    const make = (name: string) => {
      return async () => {
        const val = overrides[name];
        if (val instanceof Error) throw val;
        return val ?? [];
      };
    };
    return {
      fetchPropositions: make('fetchPropositions'),
      fetchMotions: make('fetchMotions'),
      fetchCommitteeReports: make('fetchCommitteeReports'),
      fetchVotingRecords: make('fetchVotingRecords'),
      searchSpeeches: make('searchSpeeches'),
      fetchWrittenQuestions: make('fetchWrittenQuestions'),
      fetchInterpellations: make('fetchInterpellations'),
    };
  }

  it('only fetches propositions when docTypes is ["propositions"]', async () => {
    const client = stubClient({
      fetchPropositions: [{ dok_id: 'p1' }, { dok_id: 'p2' }],
      fetchMotions: [{ dok_id: 'm1' }],
      fetchCommitteeReports: [{ dok_id: 'c1' }],
    });
    const { data, manifest } = await downloadAllDocuments(client, {
      docTypes: ['propositions'],
    });
    expect(data.propositions).toHaveLength(2);
    expect(data.motions).toHaveLength(0);
    expect(data.committeeReports).toHaveLength(0);
    expect(manifest.dataSources).toContain('get_propositioner');
    expect(manifest.dataSources).not.toContain('get_motioner');
  });

  it('only fetches committeeReports when scoped', async () => {
    const client = stubClient({
      fetchPropositions: [{ dok_id: 'p1' }],
      fetchCommitteeReports: [{ dok_id: 'c1' }, { dok_id: 'c2' }],
    });
    const { data, manifest } = await downloadAllDocuments(client, {
      docTypes: ['committeeReports'],
    });
    expect(data.propositions).toHaveLength(0);
    expect(data.committeeReports).toHaveLength(2);
    expect(manifest.dataSources).toContain('get_betankanden');
    expect(manifest.dataSources).not.toContain('get_propositioner');
  });

  it('fetches multiple types when docTypes has multiple entries', async () => {
    const client = stubClient({
      fetchPropositions: [{ dok_id: 'p1' }],
      fetchMotions: [{ dok_id: 'm1' }],
    });
    const { data } = await downloadAllDocuments(client, {
      docTypes: ['propositions', 'motions'],
    });
    expect(data.propositions).toHaveLength(1);
    expect(data.motions).toHaveLength(1);
    expect(data.committeeReports).toHaveLength(0);
  });

  it('fetches all types when docTypes is not provided', async () => {
    const client = stubClient({
      fetchPropositions: [{ dok_id: 'p1' }],
      fetchMotions: [{ dok_id: 'm1' }],
    });
    const { manifest } = await downloadAllDocuments(client);
    expect(manifest.dataSources.length).toBeGreaterThanOrEqual(2);
  });
});
