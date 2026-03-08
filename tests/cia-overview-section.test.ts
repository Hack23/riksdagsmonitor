/**
 * Tests for generateCiaOverviewSection — CIA intelligence overview section.
 * Validates HTML structure, coalition panel, party table, voting alignment bars,
 * XSS escaping, accessibility, RTL support, all 14 languages, and
 * TemplateSection shape.
 */

import { describe, it, expect } from 'vitest';
import { generateCiaOverviewSection } from '../scripts/data-transformers/content-generators/cia-overview-section.js';
import type { CIAContext } from '../scripts/data-transformers/types.js';

/** Minimal CIAContext fixture that covers all render paths */
function makeContext(): CIAContext {
  return {
    partyPerformance: [
      {
        id: 'S',
        partyName: 'Social Democrats',
        metrics: { seats: 107, successRate: 43.4, motionsSubmitted: 523, motionsPassed: 187, cohesionScore: 92 },
        trends: { supportTrend: 'declining', activityTrend: 'stable' },
      },
      {
        id: 'M',
        partyName: 'Moderates',
        metrics: { seats: 68, successRate: 86.5, motionsSubmitted: 412, motionsPassed: 356, cohesionScore: 88 },
        trends: { supportTrend: 'rising', activityTrend: 'increasing' },
      },
      {
        id: 'SD',
        partyName: 'Sweden Democrats',
        metrics: { seats: 73, successRate: 19.5, motionsSubmitted: 456, motionsPassed: 89, cohesionScore: 95 },
        trends: { supportTrend: 'rising', activityTrend: 'increasing' },
      },
    ],
    coalitionStability: {
      stabilityScore: 72,
      riskLevel: 'moderate',
      defectionProbability: 15,
      majorityMargin: 3,
    },
    votingPatterns: {
      keyIssues: [
        { topic: 'Defence/NATO', coalitionAlignment: 96, oppositionAlignment: 84, crossPartyVotes: 2 },
        { topic: 'Climate Policy', coalitionAlignment: 72, oppositionAlignment: 93, crossPartyVotes: 12 },
        { topic: 'Economy/Budget', coalitionAlignment: 91, oppositionAlignment: 67, crossPartyVotes: 5 },
      ],
    },
    overallMotionDenialRate: 64,
  };
}

describe('generateCiaOverviewSection', () => {
  it('returns a TemplateSection with correct id and className', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.id).toBe('cia-overview-section');
    expect(section.className).toBe('cia-overview-section-wrapper');
    expect(typeof section.html).toBe('string');
  });

  it('renders h2 section title', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('<h2>');
    expect(section.html).toContain('Parliamentary Intelligence Overview');
  });

  it('uses custom title when provided', () => {
    const section = generateCiaOverviewSection({
      cia: makeContext(), lang: 'en', title: 'My Intelligence Report',
    });
    expect(section.html).toContain('My Intelligence Report');
  });

  it('renders coalition stability score', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('72/100');
  });

  it('renders risk level badge', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('MODERATE');
  });

  it('renders stability progress bar with correct width', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('width:72%');
  });

  it('renders defection probability', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('15%');
  });

  it('renders majority margin', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('3 seats'); // English locale
  });

  it('renders party table rows for all parties', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('Social Democrats');
    expect(section.html).toContain('Moderates');
    expect(section.html).toContain('Sweden Democrats');
  });

  it('renders party IDs in the table', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('>S<');
    expect(section.html).toContain('>M<');
    expect(section.html).toContain('>SD<');
  });

  it('renders seat counts', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('>107<');
    expect(section.html).toContain('>68<');
    expect(section.html).toContain('>73<');
  });

  it('renders cohesion scores', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('92%');
    expect(section.html).toContain('88%');
  });

  it('renders trend arrows', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    // S has declining trend → ↓; M and SD have rising trend → ↑
    expect(section.html).toContain('↑');
    expect(section.html).toContain('↓');
  });

  it('renders voting alignment bars with issue topics', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('Defence/NATO');
    expect(section.html).toContain('Climate Policy');
    expect(section.html).toContain('Economy/Budget');
  });

  it('renders coalition alignment width percentages', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    // coalitionAlignment: 96, 72, 91
    expect(section.html).toContain('width:96%');
    expect(section.html).toContain('width:72%'); // note: overlaps stability bar (both 72%)
    expect(section.html).toContain('width:91%');
  });

  it('renders opposition alignment width percentages', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    // oppositionAlignment: 84, 93, 67
    expect(section.html).toContain('width:84%');
    expect(section.html).toContain('width:93%');
    expect(section.html).toContain('width:67%');
  });

  it('renders data source note', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('CIA Platform');
    expect(section.html).toContain('cia-data-source-note');
  });

  it('renders summary block when provided', () => {
    const section = generateCiaOverviewSection({
      cia: makeContext(), lang: 'en',
      summary: 'Intelligence briefing for the week.',
    });
    expect(section.html).toContain('Intelligence briefing for the week.');
    expect(section.html).toContain('cia-section-summary');
  });

  it('does not render summary block when not provided', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).not.toContain('cia-section-summary');
  });

  it('renders progressbar role for accessibility', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('role="progressbar"');
    expect(section.html).toContain('aria-valuenow=');
  });

  it('renders aria-label on the section', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('aria-label=');
  });

  it('renders aria-label on the party table', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('<table class="cia-party-table" aria-label=');
  });

  it('escapes XSS in riskLevel', () => {
    const cia = makeContext();
    cia.coalitionStability.riskLevel = '<script>alert(1)</script>';
    const section = generateCiaOverviewSection({ cia, lang: 'en' });
    expect(section.html).not.toContain('<script>');
    expect(section.html).toContain('&lt;script&gt;');
  });

  it('escapes XSS in party name', () => {
    const cia = makeContext();
    cia.partyPerformance[0]!.partyName = '<img src=x onerror=alert(1)>';
    const section = generateCiaOverviewSection({ cia, lang: 'en' });
    expect(section.html).not.toContain('<img');
    expect(section.html).toContain('&lt;img');
  });

  it('escapes XSS in voting issue topic', () => {
    const cia = makeContext();
    cia.votingPatterns.keyIssues[0]!.topic = '<b>bold</b>';
    const section = generateCiaOverviewSection({ cia, lang: 'en' });
    expect(section.html).not.toContain('<b>');
    expect(section.html).toContain('&lt;b&gt;');
  });

  it('escapes XSS in custom title', () => {
    const section = generateCiaOverviewSection({
      cia: makeContext(), lang: 'en', title: '<script>xss</script>',
    });
    expect(section.html).not.toContain('<script>');
  });

  it('escapes XSS in summary', () => {
    const section = generateCiaOverviewSection({
      cia: makeContext(), lang: 'en', summary: '<script>xss</script>',
    });
    expect(section.html).not.toContain('<script>');
  });

  it('handles empty partyPerformance gracefully (no table)', () => {
    const cia = makeContext();
    cia.partyPerformance = [];
    expect(() => generateCiaOverviewSection({ cia, lang: 'en' })).not.toThrow();
    const section = generateCiaOverviewSection({ cia, lang: 'en' });
    expect(section.html).not.toContain('cia-party-table');
  });

  it('handles empty keyIssues gracefully (no alignment panel)', () => {
    const cia = makeContext();
    cia.votingPatterns.keyIssues = [];
    expect(() => generateCiaOverviewSection({ cia, lang: 'en' })).not.toThrow();
    const section = generateCiaOverviewSection({ cia, lang: 'en' });
    expect(section.html).not.toContain('cia-alignment-list');
  });

  it('clamps stabilityScore to 0-100 range in bar width', () => {
    const cia = makeContext();
    cia.coalitionStability.stabilityScore = 150; // out of range
    const section = generateCiaOverviewSection({ cia, lang: 'en' });
    // Bar width must be clamped to 100%
    expect(section.html).toContain('width:100%');
  });

  it('clamps stabilityScore at lower bound (0)', () => {
    const cia = makeContext();
    cia.coalitionStability.stabilityScore = -10;
    const section = generateCiaOverviewSection({ cia, lang: 'en' });
    expect(section.html).toContain('width:0%');
  });

  it('renders high stability with green color', () => {
    const cia = makeContext();
    cia.coalitionStability.stabilityScore = 80;
    const section = generateCiaOverviewSection({ cia, lang: 'en' });
    expect(section.html).toContain('#83cf39');
  });

  it('renders moderate stability with yellow color', () => {
    const cia = makeContext();
    cia.coalitionStability.stabilityScore = 60;
    const section = generateCiaOverviewSection({ cia, lang: 'en' });
    expect(section.html).toContain('#ffbe0b');
  });

  it('renders low stability score with magenta color', () => {
    const cia = makeContext();
    cia.coalitionStability.stabilityScore = 40;
    const section = generateCiaOverviewSection({ cia, lang: 'en' });
    expect(section.html).toContain('#ff006e');
  });

  it('renders high risk level with magenta border', () => {
    const cia = makeContext();
    cia.coalitionStability.riskLevel = 'high';
    const section = generateCiaOverviewSection({ cia, lang: 'en' });
    expect(section.html).toContain('#ff006e');
    expect(section.html).toContain('HIGH');
  });

  it('renders low risk level with green color', () => {
    const cia = makeContext();
    cia.coalitionStability.riskLevel = 'low';
    const section = generateCiaOverviewSection({ cia, lang: 'en' });
    expect(section.html).toContain('#83cf39');
    expect(section.html).toContain('LOW');
  });

  it('renders all 14 language titles without error', () => {
    const langs = ['en','sv','da','no','fi','de','fr','es','nl','ar','he','ja','ko','zh'] as const;
    for (const lang of langs) {
      expect(() => generateCiaOverviewSection({ cia: makeContext(), lang })).not.toThrow();
      const section = generateCiaOverviewSection({ cia: makeContext(), lang });
      expect(section.html).toContain('<h2>');
      expect(section.html).not.toContain('<h2></h2>');
    }
  });

  it('renders Swedish title correctly', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'sv' });
    expect(section.html).toContain('Parlamentarisk intelligensöversikt');
  });

  it('renders Arabic title correctly', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'ar' });
    expect(section.html).toContain('نظرة عامة على الاستخبارات البرلمانية');
  });

  it('renders Japanese title correctly', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'ja' });
    expect(section.html).toContain('議会インテリジェンス概要');
  });

  it('renders German coalition label', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'de' });
    expect(section.html).toContain('Koalitionsstabilität');
  });

  it('renders cia-panels-grid wrapper', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('class="cia-panels-grid"');
  });

  it('renders max 6 voting alignment bars (even if more issues provided)', () => {
    const cia = makeContext();
    cia.votingPatterns.keyIssues = Array.from({ length: 10 }, (_, i) => ({
      topic: `Issue ${i}`,
      coalitionAlignment: 80,
      oppositionAlignment: 60,
      crossPartyVotes: i,
    }));
    const section = generateCiaOverviewSection({ cia, lang: 'en' });
    // Only first 6 issues should appear
    expect(section.html).toContain('Issue 5');
    expect(section.html).not.toContain('Issue 6');
  });

  it('parties are sorted by seats descending in the table', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    const socialDemPos = section.html.indexOf('Social Democrats');
    const sdPos        = section.html.indexOf('Sweden Democrats');
    const moderatesPos = section.html.indexOf('Moderates');
    // S (107 seats) → SD (73 seats) → M (68 seats)
    expect(socialDemPos).toBeLessThan(sdPos);
    expect(sdPos).toBeLessThan(moderatesPos);
  });

  it('renders cia-coalition-panel, cia-party-panel, cia-voting-panel classes', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('class="cia-coalition-panel"');
    expect(section.html).toContain('class="cia-party-panel"');
    expect(section.html).toContain('class="cia-voting-panel"');
  });

  it('renders correct "Party" column header in table', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'en' });
    expect(section.html).toContain('>Party<');
  });

  it('renders correct Swedish "Parti" column header', () => {
    const section = generateCiaOverviewSection({ cia: makeContext(), lang: 'sv' });
    expect(section.html).toContain('>Parti<');
  });

  it('uses cohesionScore from metrics when provided', () => {
    const cia = makeContext();
    cia.partyPerformance[0]!.metrics.cohesionScore = 77;
    const section = generateCiaOverviewSection({ cia, lang: 'en' });
    expect(section.html).toContain('77%');
  });

  it('computes cohesion fallback when cohesionScore is not provided', () => {
    const cia = makeContext();
    cia.partyPerformance[0]!.metrics.cohesionScore = undefined;
    // Should not throw
    expect(() => generateCiaOverviewSection({ cia, lang: 'en' })).not.toThrow();
  });
});
