/**
 * Tests for `src/browser/cia/visualizations.ts` — CIA chart rendering engine.
 *
 * Covers all 9 public `render*()` methods plus the `destroy()` lifecycle:
 *   - renderKeyMetrics
 *   - renderPartyPerformance
 *   - renderTop10Rankings
 *   - renderVotingPatterns
 *   - renderCommitteeNetwork
 *   - renderMinistryPerformance
 *   - renderDemographics
 *   - renderDocumentActivity
 *   - renderRiskEvolution
 *   - destroy
 *
 * Strategy:
 *  - happy-dom provides `globalThis.document`; `tests/setup.ts` provides the
 *    base `globalThis.Chart` mock. We replace it locally with a `vi.fn()`
 *    spy so we can capture each Chart.js configuration.
 *  - Fixture data is kept minimal but shape-compliant with the
 *    `RendererData` interface used by the visualizations module.
 *  - Edge cases: empty/missing dashboards, missing Chart constructor,
 *    null/NaN numeric fields.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RendererData } from '../src/browser/cia/visualizations.js';
import type {
  OverviewDashboard,
  PartyPerformance,
  Top10Influential,
  CommitteeNetwork,
  VotingPatterns,
  MinistryDashboard,
  DemographicsDashboard,
  DocumentActivityDashboard,
  RiskEvolutionDashboard,
} from '../src/browser/cia/data-loader.js';

/* ------------------------------------------------------------------ */
/*  Chart.js mock — captures (canvas, config) pairs                   */
/* ------------------------------------------------------------------ */

interface CapturedChart {
  ctx: unknown;
  type: string;
  data: { labels?: unknown[]; datasets: unknown[] };
  options?: unknown;
  destroyed: boolean;
  updated: boolean;
}

let chartCalls: CapturedChart[];
let originalChart: unknown;

function installChartMock(): void {
  chartCalls = [];
  originalChart = (globalThis as Record<string, unknown>).Chart;

  const ChartMock = vi.fn().mockImplementation(function (
    this: CapturedChart,
    ctx: unknown,
    config: { type: string; data: CapturedChart['data']; options?: unknown },
  ) {
    const captured: CapturedChart = {
      ctx,
      type: config.type,
      data: config.data,
      options: config.options,
      destroyed: false,
      updated: false,
    };
    chartCalls.push(captured);
    // Return the captured object so renderer-held references can be inspected
    captured.destroyed = false;
    return Object.assign(captured, {
      destroy: vi.fn(() => {
        captured.destroyed = true;
      }),
      update: vi.fn(() => {
        captured.updated = true;
      }),
    });
  });
  (ChartMock as unknown as { defaults: { color: string } }).defaults = {
    color: '#fff',
  };

  (globalThis as Record<string, unknown>).Chart = ChartMock;
}

function uninstallChartMock(): void {
  if (originalChart === undefined) {
    delete (globalThis as Record<string, unknown>).Chart;
  } else {
    (globalThis as Record<string, unknown>).Chart = originalChart;
  }
}

/* ------------------------------------------------------------------ */
/*  Module loader — re-imports visualizations.ts so its module-level  */
/*  `const Chart = (globalThis as any).Chart;` capture sees the mock. */
/* ------------------------------------------------------------------ */

type RendererCtor = new (data: RendererData) => {
  renderKeyMetrics(): void;
  renderPartyPerformance(): void;
  renderTop10Rankings(): void;
  renderVotingPatterns(): void;
  renderCommitteeNetwork(): void;
  renderMinistryPerformance(): void;
  renderDemographics(): void;
  renderDocumentActivity(): void;
  renderRiskEvolution(): void;
  destroy(): void;
};

async function loadRenderer(): Promise<RendererCtor> {
  vi.resetModules();
  const mod = await import('../src/browser/cia/visualizations.js');
  return mod.CIADashboardRenderer as unknown as RendererCtor;
}

/* ------------------------------------------------------------------ */
/*  DOM helpers                                                        */
/* ------------------------------------------------------------------ */

function makeEl(tag: string, id: string): HTMLElement {
  const el = document.createElement(tag);
  el.id = id;
  document.body.appendChild(el);
  return el;
}

function makeCanvas(id: string): HTMLCanvasElement {
  return makeEl('canvas', id) as HTMLCanvasElement;
}

/* ------------------------------------------------------------------ */
/*  Fixture builders                                                  */
/* ------------------------------------------------------------------ */

function fxOverview(): OverviewDashboard {
  return {
    title: 'Overview',
    description: 'desc',
    lastUpdated: '2026-04-27',
    keyMetrics: {
      totalMPs: 349,
      totalParties: 8,
      totalRiskRules: 45,
      governmentCoalition: 'M+KD+L',
      coalitionSeats: 176,
      oppositionSeats: 173,
      majorityMargin: 3,
    },
    riskAlerts: {
      critical: 5,
      major: 12,
      minor: 25,
      last90Days: { critical: 2, major: 4, minor: 9 },
    },
    parliamentActivity: {
      votesLastMonth: 100,
      documentsProcessed: 250,
      motionsSubmitted: 80,
      committeeMeetings: 30,
    },
    coalitionStability: {
      stabilityScore: 0.7,
      riskLevel: 'medium',
      defectionProbability: 0.1,
      ideologicalTension: 'low',
    },
    dataQuality: { completeness: 0.95, lastDataSync: '2026-04-27', coverage: 'full' },
    _source: 'fixture',
  };
}

function fxPartyPerf(): PartyPerformance {
  const parties = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'].map((short, i) => ({
    id: short,
    partyName: short,
    shortName: short,
    metrics: {
      seats: 30 + i * 5,
      voteShare: 0.1,
      memberCount: 30 + i,
      documentsAuthored: 100,
      motionsSubmitted: 50,
      successRate: 0.5,
    },
    voting: { totalVotes: 1000, cohesionScore: 90 - i, rebellionRate: 5 + i },
    trends: { supportTrend: 'stable', activityTrend: 'rising', performanceLevel: 'high' },
    _source: 'fixture',
  }));
  return {
    title: 'Party Performance',
    description: 'd',
    lastUpdated: 'now',
    parties,
    _source: 'fixture',
  };
}

function fxTop10(): Top10Influential {
  const rankings = Array.from({ length: 3 }, (_, i) => ({
    rank: i + 1,
    id: `mp-${i}`,
    firstName: `First${i}`,
    lastName: `Last${i}`,
    party: 'S',
    role: 'Minister',
    influenceScore: 90 - i,
    networkConnections: 50,
    brokerClassification: 'core',
    riskLevel: 'low',
    riskScore: 10,
    _source: 'fixture',
  }));
  return {
    title: 'Top 10',
    description: 'd',
    lastUpdated: 'now',
    methodology: 'm',
    rankings,
    _source: 'fixture',
  };
}

function fxCommittees(): CommitteeNetwork {
  return {
    title: 'Committees',
    description: 'd',
    lastUpdated: 'now',
    committees: [
      {
        id: 'fiu',
        name: 'Finance Committee',
        memberCount: 17,
        influenceScore: 85.5,
        documentsProcessed: 120,
        productivityLevel: 'high',
        meetingsPerYear: 40,
        keyIssues: ['budget', 'tax'],
        _source: 'fixture',
      },
    ],
    networkGraph: {
      nodes: [{ id: 'fiu', name: 'Finance', size: 17 }],
      edges: [{ source: 'fiu', target: 'au', weight: 0.5, type: 'co-membership' }],
    },
    crossCommitteeMPs: [],
    _source: 'fixture',
  };
}

function fxVotingPatterns(): VotingPatterns {
  return {
    title: 'Voting',
    description: 'd',
    lastUpdated: 'now',
    analysisPeriod: '2024-2025',
    votingMatrix: {
      labels: ['M', 'S', 'SD'],
      partyNames: ['M', 'S', 'SD'],
      agreementMatrix: [
        [100, 60, 70],
        [60, 100, 30],
        [70, 30, 100],
      ],
    },
    keyIssues: [],
    rebellionTracking: [],
    _source: 'fixture',
  };
}

function fxMinistry(): MinistryDashboard {
  return {
    title: 'Ministry',
    description: 'd',
    lastUpdated: 'now',
    ministries: [
      {
        name: 'Finance',
        effectiveness: 'high',
        documentsProduced: 80,
        governmentBills: 12,
        year: 2026,
        quarter: 1,
      },
    ],
    _source: 'fixture',
  };
}

function fxDemographics(): DemographicsDashboard {
  return {
    title: 'Demographics',
    description: 'd',
    lastUpdated: 'now',
    genderByParty: [
      { party: 'S', gender: 'MAN', count: 50 },
      { party: 'S', gender: 'KVINNA', count: 50 },
      { party: 'M', gender: 'MAN', count: 40 },
      { party: 'M', gender: 'KVINNA', count: 30 },
    ],
    experienceByParty: [
      { party: 'S', experienceLevel: 'SENIOR', politicianCount: 30 },
      { party: 'S', experienceLevel: 'JUNIOR', politicianCount: 40 },
      { party: 'M', experienceLevel: 'SENIOR', politicianCount: 25 },
    ],
    _source: 'fixture',
  };
}

function fxDocActivity(): DocumentActivityDashboard {
  return {
    title: 'Doc Activity',
    description: 'd',
    lastUpdated: 'now',
    documentTypes: [
      { year: 2023, documentType: 'mot', docCount: 1200 },
      { year: 2024, documentType: 'mot', docCount: 1300 },
      { year: 2024, documentType: 'bet', docCount: 220 },
      { year: 2024, documentType: 'prop', docCount: 80 },
    ],
    decisionTrends: [
      {
        year: 2024,
        month: 1,
        decisionCount: 50,
        approvedDecisions: 40,
        rejectedDecisions: 10,
        approvalRate: 0.8,
      },
    ],
    _source: 'fixture',
  };
}

function fxRiskEvolution(): RiskEvolutionDashboard {
  return {
    title: 'Risk Evolution',
    description: 'd',
    lastUpdated: 'now',
    entries: [
      { period: '2026-03-01', severity: 'CRITICAL', politicianCount: 3, avgRiskScore: 80.5 },
      { period: '2026-03-01', severity: 'MAJOR', politicianCount: 7, avgRiskScore: 55.2 },
      { period: '2026-04-01', severity: 'CRITICAL', politicianCount: 1, avgRiskScore: 90.0 },
    ],
    _source: 'fixture',
  };
}

function fullData(): RendererData {
  return {
    overview: fxOverview(),
    partyPerf: fxPartyPerf(),
    top10: fxTop10(),
    committees: fxCommittees(),
    votingPatterns: fxVotingPatterns(),
    ministry: fxMinistry(),
    demographics: fxDemographics(),
    documentActivity: fxDocActivity(),
    riskEvolution: fxRiskEvolution(),
  };
}

/* ================================================================== */
/*  Test suites                                                       */
/* ================================================================== */

describe('CIADashboardRenderer', () => {
  beforeEach(() => {
    installChartMock();
  });

  afterEach(() => {
    uninstallChartMock();
    document.body.innerHTML = '';
  });

  /* ---------------------------------------------------------------- */
  /*  renderKeyMetrics                                                */
  /* ---------------------------------------------------------------- */

  describe('renderKeyMetrics', () => {
    it('writes the key metrics into matching DOM elements', async () => {
      const Renderer = await loadRenderer();
      const totalMPsEl = makeEl('div', 'metric-total-mps');
      const totalPartiesEl = makeEl('div', 'metric-total-parties');
      const riskRulesEl = makeEl('div', 'metric-risk-rules');
      const coalitionSeatsEl = makeEl('div', 'metric-coalition-seats');
      const alertCriticalEl = makeEl('div', 'alert-critical');
      const alertMajorEl = makeEl('div', 'alert-major');
      const alertMinorEl = makeEl('div', 'alert-minor');

      const renderer = new Renderer({ overview: fxOverview() });
      renderer.renderKeyMetrics();

      expect(totalMPsEl.textContent).toBe('349');
      expect(totalPartiesEl.textContent).toBe('8');
      expect(riskRulesEl.textContent).toBe('45');
      expect(coalitionSeatsEl.textContent).toBe('176');
      expect(alertCriticalEl.textContent).toBe('2');
      expect(alertMajorEl.textContent).toBe('4');
      expect(alertMinorEl.textContent).toBe('9');
    });

    it('warns and is a no-op when overview is missing', async () => {
      const Renderer = await loadRenderer();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const totalMPsEl = makeEl('div', 'metric-total-mps');
      const renderer = new Renderer({});
      renderer.renderKeyMetrics();
      expect(totalMPsEl.textContent).toBe('');
      expect(warn).toHaveBeenCalled();
    });

    it('skips alert elements when riskAlerts.last90Days is missing', async () => {
      const Renderer = await loadRenderer();
      const overview = fxOverview();
      // Simulate missing riskAlerts.last90Days
      (overview as unknown as { riskAlerts: unknown }).riskAlerts = undefined;
      const alertCriticalEl = makeEl('div', 'alert-critical');
      makeEl('div', 'metric-total-mps');

      new Renderer({ overview }).renderKeyMetrics();
      expect(alertCriticalEl.textContent).toBe('');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  renderPartyPerformance                                          */
  /* ---------------------------------------------------------------- */

  describe('renderPartyPerformance', () => {
    it('builds bar + line charts with correct labels and party count', async () => {
      const Renderer = await loadRenderer();
      makeCanvas('party-seats-chart');
      makeCanvas('party-cohesion-chart');

      new Renderer({ partyPerf: fxPartyPerf() }).renderPartyPerformance();

      expect(chartCalls).toHaveLength(2);
      const seats = chartCalls[0];
      expect(seats.type).toBe('bar');
      expect(seats.data.labels).toEqual(['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP']);
      const seatDataset = (seats.data.datasets as Array<{ data: number[] }>)[0];
      expect(seatDataset.data).toHaveLength(8);

      const cohesion = chartCalls[1];
      expect(cohesion.type).toBe('line');
      expect((cohesion.data.datasets as Array<{ label: string }>).map(d => d.label)).toEqual([
        'Voting Cohesion (%)',
        'Rebellion Rate (%)',
      ]);
    });

    it('warns and is a no-op when parties array is missing', async () => {
      const Renderer = await loadRenderer();
      makeCanvas('party-seats-chart');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      new Renderer({}).renderPartyPerformance();
      expect(chartCalls).toHaveLength(0);
      expect(warn).toHaveBeenCalled();
    });

    it('does not call Chart when Chart is undefined', async () => {
      makeCanvas('party-seats-chart');
      makeCanvas('party-cohesion-chart');
      // Delete Chart BEFORE loading the renderer so its module-level
      // `const Chart = (globalThis as any).Chart;` capture is undefined.
      delete (globalThis as Record<string, unknown>).Chart;
      const Renderer = await loadRenderer();

      new Renderer({ partyPerf: fxPartyPerf() }).renderPartyPerformance();
      expect(chartCalls).toHaveLength(0);
    });

    it('replaces invalid numeric metrics with 0 and unnamed shortName with "Unknown"', async () => {
      const Renderer = await loadRenderer();
      makeCanvas('party-seats-chart');
      makeCanvas('party-cohesion-chart');
      const partyPerf = fxPartyPerf();
      // Corrupt one entry
      (partyPerf.parties[0] as unknown as { metrics: unknown }).metrics = {};
      partyPerf.parties[0].shortName = '';
      (partyPerf.parties[0] as unknown as { voting: unknown }).voting = {};

      new Renderer({ partyPerf }).renderPartyPerformance();
      const seatData = (chartCalls[0].data.datasets as Array<{ data: number[] }>)[0].data;
      expect(seatData[0]).toBe(0);
      expect((chartCalls[0].data.labels as string[])[0]).toBe('Unknown');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  renderTop10Rankings                                             */
  /* ---------------------------------------------------------------- */

  describe('renderTop10Rankings', () => {
    it('renders one ranking-item per MP with name, party and influence score', async () => {
      const Renderer = await loadRenderer();
      const container = makeEl('div', 'influential-mps');
      new Renderer({ top10: fxTop10() }).renderTop10Rankings();

      const items = container.querySelectorAll('.ranking-item');
      expect(items).toHaveLength(3);
      expect(container.querySelector('.ranking-name')?.textContent).toBe('First0 Last0');
      expect(container.querySelector('.score-value')?.textContent).toBe('90.0');
    });

    it('renders "N/A" when influenceScore is NaN', async () => {
      const Renderer = await loadRenderer();
      const container = makeEl('div', 'influential-mps');
      const top10 = fxTop10();
      top10.rankings[0].influenceScore = Number.NaN;
      new Renderer({ top10 }).renderTop10Rankings();
      const firstScore = container.querySelector('.score-value');
      expect(firstScore?.textContent).toBe('N/A');
    });

    it('does nothing when the container is missing', async () => {
      const Renderer = await loadRenderer();
      // No #influential-mps element in DOM
      expect(() =>
        new Renderer({ top10: fxTop10() }).renderTop10Rankings(),
      ).not.toThrow();
    });

    it('warns and clears when rankings is invalid', async () => {
      const Renderer = await loadRenderer();
      const container = makeEl('div', 'influential-mps');
      container.innerHTML = '<span>old</span>';
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      new Renderer({}).renderTop10Rankings();
      // Container should remain untouched (early return before clear)
      expect(warn).toHaveBeenCalled();
    });
  });

  /* ---------------------------------------------------------------- */
  /*  renderVotingPatterns                                            */
  /* ---------------------------------------------------------------- */

  describe('renderVotingPatterns', () => {
    it('produces a stacked bar chart with one dataset per party row', async () => {
      const Renderer = await loadRenderer();
      makeCanvas('voting-heatmap');
      new Renderer({ votingPatterns: fxVotingPatterns() }).renderVotingPatterns();
      expect(chartCalls).toHaveLength(1);
      expect(chartCalls[0].type).toBe('bar');
      expect(chartCalls[0].data.labels).toEqual(['M', 'S', 'SD']);
      expect(chartCalls[0].data.datasets).toHaveLength(3);
    });

    it('returns silently when canvas is missing', async () => {
      const Renderer = await loadRenderer();
      new Renderer({ votingPatterns: fxVotingPatterns() }).renderVotingPatterns();
      expect(chartCalls).toHaveLength(0);
    });

    it('warns when votingMatrix structure is invalid', async () => {
      const Renderer = await loadRenderer();
      makeCanvas('voting-heatmap');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const bad = { ...fxVotingPatterns(), votingMatrix: undefined } as unknown as VotingPatterns;
      new Renderer({ votingPatterns: bad }).renderVotingPatterns();
      expect(chartCalls).toHaveLength(0);
      expect(warn).toHaveBeenCalled();
    });
  });

  /* ---------------------------------------------------------------- */
  /*  renderCommitteeNetwork                                          */
  /* ---------------------------------------------------------------- */

  describe('renderCommitteeNetwork', () => {
    it('renders one committee-card per committee and a network note', async () => {
      const Renderer = await loadRenderer();
      const list = makeEl('div', 'committee-list');
      const network = makeEl('div', 'network-visualization');

      new Renderer({ committees: fxCommittees() }).renderCommitteeNetwork();
      expect(list.querySelectorAll('.committee-card')).toHaveLength(1);
      expect(list.querySelector('.committee-name')?.textContent).toBe('Finance Committee');
      expect(list.querySelectorAll('.issue-tag')).toHaveLength(2);
      expect(network.textContent).toContain('1 committees');
      expect(network.textContent).toContain('1 interconnections');
    });

    it('formats missing/invalid stats as "N/A"', async () => {
      const Renderer = await loadRenderer();
      const list = makeEl('div', 'committee-list');
      const committees = fxCommittees();
      committees.committees[0].influenceScore = Number.NaN;
      (committees.committees[0] as unknown as { memberCount: unknown }).memberCount = 'oops';
      new Renderer({ committees }).renderCommitteeNetwork();
      const stats = Array.from(list.querySelectorAll('.stat-value')).map(e => e.textContent);
      expect(stats).toContain('N/A');
    });

    it('warns and bails when committees is invalid', async () => {
      const Renderer = await loadRenderer();
      makeEl('div', 'committee-list');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      new Renderer({}).renderCommitteeNetwork();
      expect(warn).toHaveBeenCalled();
    });

    it('does nothing when container is missing', async () => {
      const Renderer = await loadRenderer();
      expect(() =>
        new Renderer({ committees: fxCommittees() }).renderCommitteeNetwork(),
      ).not.toThrow();
    });
  });

  /* ---------------------------------------------------------------- */
  /*  renderMinistryPerformance                                       */
  /* ---------------------------------------------------------------- */

  describe('renderMinistryPerformance', () => {
    it('renders one card per ministry with assessment tag', async () => {
      const Renderer = await loadRenderer();
      const list = makeEl('div', 'ministry-list');
      new Renderer({ ministry: fxMinistry() }).renderMinistryPerformance();
      expect(list.querySelectorAll('.committee-card')).toHaveLength(1);
      expect(list.querySelector('.issue-tag')?.textContent).toBe('high');
    });

    it('warns when ministry list is empty', async () => {
      const Renderer = await loadRenderer();
      makeEl('div', 'ministry-list');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      new Renderer({
        ministry: { ...fxMinistry(), ministries: [] },
      }).renderMinistryPerformance();
      expect(warn).toHaveBeenCalled();
    });

    it('falls back to "N/A" when effectiveness is missing', async () => {
      const Renderer = await loadRenderer();
      const list = makeEl('div', 'ministry-list');
      const ministry = fxMinistry();
      ministry.ministries[0].effectiveness = '';
      new Renderer({ ministry }).renderMinistryPerformance();
      expect(list.querySelector('.issue-tag')?.textContent).toBe('N/A');
    });
  });

  /* ---------------------------------------------------------------- */
  /*  renderDemographics                                              */
  /* ---------------------------------------------------------------- */

  describe('renderDemographics', () => {
    it('builds gender + experience charts indexed by Riksdag party order', async () => {
      const Renderer = await loadRenderer();
      makeCanvas('gender-chart');
      makeCanvas('experience-chart');

      new Renderer({ demographics: fxDemographics() }).renderDemographics();

      expect(chartCalls).toHaveLength(2);
      const gender = chartCalls[0];
      expect(gender.data.labels).toEqual(['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP']);
      const datasets = gender.data.datasets as Array<{ label: string; data: number[] }>;
      const male = datasets.find(d => d.label === 'Male');
      const female = datasets.find(d => d.label === 'Female');
      expect(male?.data[0]).toBe(50); // S MAN
      expect(female?.data[0]).toBe(50); // S KVINNA
      expect(male?.data[2]).toBe(0); // SD MAN missing -> 0

      const experience = chartCalls[1];
      // Two distinct experience levels in the fixture
      expect(experience.data.datasets).toHaveLength(2);
    });

    it('warns and is a no-op when demographics arrays are missing', async () => {
      const Renderer = await loadRenderer();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      new Renderer({}).renderDemographics();
      expect(warn).toHaveBeenCalled();
      expect(chartCalls).toHaveLength(0);
    });

    it('does not crash when canvases are missing from DOM', async () => {
      const Renderer = await loadRenderer();
      expect(() =>
        new Renderer({ demographics: fxDemographics() }).renderDemographics(),
      ).not.toThrow();
      expect(chartCalls).toHaveLength(0);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  renderDocumentActivity                                          */
  /* ---------------------------------------------------------------- */

  describe('renderDocumentActivity', () => {
    it('produces a line chart with motions/bet/prop datasets in recent years', async () => {
      const Renderer = await loadRenderer();
      makeCanvas('document-trends-chart');
      new Renderer({ documentActivity: fxDocActivity() }).renderDocumentActivity();
      expect(chartCalls).toHaveLength(1);
      const cfg = chartCalls[0];
      expect(cfg.type).toBe('line');
      const labels = (cfg.data.datasets as Array<{ label: string }>).map(d => d.label);
      expect(labels).toEqual(['Motions', 'Committee Reports', 'Propositions']);
      expect((cfg.data.labels as string[]).length).toBeGreaterThan(0);
    });

    it('warns and is a no-op when document activity is malformed', async () => {
      const Renderer = await loadRenderer();
      makeCanvas('document-trends-chart');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      new Renderer({}).renderDocumentActivity();
      expect(warn).toHaveBeenCalled();
      expect(chartCalls).toHaveLength(0);
    });
  });

  /* ---------------------------------------------------------------- */
  /*  renderRiskEvolution                                             */
  /* ---------------------------------------------------------------- */

  describe('renderRiskEvolution', () => {
    it('groups entries by YYYY-MM and renders sorted descending', async () => {
      const Renderer = await loadRenderer();
      const container = makeEl('div', 'risk-evolution-list');
      new Renderer({ riskEvolution: fxRiskEvolution() }).renderRiskEvolution();
      const cards = container.querySelectorAll('.committee-card');
      // Two distinct YYYY-MM groups in the fixture
      expect(cards).toHaveLength(2);
      // First (newest) card should be 2026-04
      expect(cards[0].querySelector('.committee-name')?.textContent).toBe('2026-04');
      // Numeric formatting verifies avgRiskScore.toFixed(1)
      expect(container.textContent).toContain('80.5');
    });

    it('warns and is a no-op for empty entries', async () => {
      const Renderer = await loadRenderer();
      makeEl('div', 'risk-evolution-list');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      new Renderer({
        riskEvolution: { ...fxRiskEvolution(), entries: [] },
      }).renderRiskEvolution();
      expect(warn).toHaveBeenCalled();
    });

    it('does nothing when the container is missing', async () => {
      const Renderer = await loadRenderer();
      expect(() =>
        new Renderer({ riskEvolution: fxRiskEvolution() }).renderRiskEvolution(),
      ).not.toThrow();
    });
  });

  /* ---------------------------------------------------------------- */
  /*  destroy                                                         */
  /* ---------------------------------------------------------------- */

  describe('destroy', () => {
    it('calls destroy() on every chart instance and clears the map', async () => {
      const Renderer = await loadRenderer();
      makeCanvas('party-seats-chart');
      makeCanvas('party-cohesion-chart');
      const renderer = new Renderer({ partyPerf: fxPartyPerf() });
      renderer.renderPartyPerformance();
      expect(chartCalls).toHaveLength(2);

      renderer.destroy();
      // Both captured charts should be marked as destroyed by the spy
      expect(chartCalls.every(c => c.destroyed)).toBe(true);

      // Calling destroy a second time should be a safe no-op
      expect(() => renderer.destroy()).not.toThrow();
    });

    it('is a safe no-op when no charts have been created', async () => {
      const Renderer = await loadRenderer();
      const renderer = new Renderer(fullData());
      expect(() => renderer.destroy()).not.toThrow();
    });
  });

  /* ---------------------------------------------------------------- */
  /*  Integration smoke test                                          */
  /* ---------------------------------------------------------------- */

  it('drives all 9 renderers end-to-end without throwing', async () => {
      const Renderer = await loadRenderer();
    // Provide every DOM hook each render method may look up.
    [
      'metric-total-mps',
      'metric-total-parties',
      'metric-risk-rules',
      'metric-coalition-seats',
      'alert-critical',
      'alert-major',
      'alert-minor',
      'influential-mps',
      'committee-list',
      'network-visualization',
      'ministry-list',
      'risk-evolution-list',
    ].forEach(id => makeEl('div', id));
    [
      'party-seats-chart',
      'party-cohesion-chart',
      'voting-heatmap',
      'gender-chart',
      'experience-chart',
      'document-trends-chart',
    ].forEach(id => makeCanvas(id));

    const renderer = new Renderer(fullData());
    renderer.renderKeyMetrics();
    renderer.renderPartyPerformance();
    renderer.renderTop10Rankings();
    renderer.renderVotingPatterns();
    renderer.renderCommitteeNetwork();
    renderer.renderMinistryPerformance();
    renderer.renderDemographics();
    renderer.renderDocumentActivity();
    renderer.renderRiskEvolution();

    // 2 (party perf) + 1 (voting) + 2 (demographics) + 1 (doc activity) = 6 charts
    expect(chartCalls).toHaveLength(6);
    renderer.destroy();
    expect(chartCalls.every(c => c.destroyed)).toBe(true);
  });
});
