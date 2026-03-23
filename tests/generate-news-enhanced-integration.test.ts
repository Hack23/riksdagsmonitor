/**
 * Integration Test for Enhanced News Generation Pipeline
 *
 * Exercises real production modules (generateArticleHTML, validateArticleQuality,
 * assessArticleQuality) with representative document data to validate the
 * HTML output structure, multi-language support, and Swedish leakage detection.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { generateArticleHTML } from '../scripts/article-template/template.js';
import { validateArticleQuality } from '../scripts/generate-news-enhanced/helpers.js';
import { assessArticleQuality } from '../scripts/ai-analysis/quality-assessor.js';
import type { ArticleData } from '../scripts/types/article.js';
import type { Language } from '../scripts/types/language.js';

// ---------------------------------------------------------------------------
// Inline sample documents (avoid cross-test import issues with vi.mock)
// ---------------------------------------------------------------------------
const sampleDocuments = [
  { dok_id: 'H901FiU1', titel: 'Utgiftsramar och beräkning av statsinkomsterna', title: 'Expenditure frameworks and calculation of state revenues', doktyp: 'bet', organ: 'FiU', datum: '2026-03-15', parti: '' },
  { dok_id: 'H9011', titel: 'Proposition om stärkt nationell säkerhet', title: 'Proposition on strengthened national security', doktyp: 'prop', datum: '2026-03-14' },
  { dok_id: 'H901Ju22', titel: 'Betänkande om rättsväsendets digitalisering', title: 'Committee report on digitalization', doktyp: 'bet', organ: 'JuU', datum: '2026-03-13' },
  { dok_id: 'H9023456', titel: 'Motion om klimatanpassning', title: 'Motion on climate adaptation', doktyp: 'mot', datum: '2026-03-12', parti: 'MP' },
  { dok_id: 'H9034567', titel: 'Interpellation om sjukvårdens resurser', title: 'Interpellation on healthcare resources', doktyp: 'ip', datum: '2026-03-11', parti: 'V' },
  { dok_id: 'H9045678', titel: 'Skriftlig fråga om infrastrukturinvesteringar', title: 'Written question on infrastructure investments', doktyp: 'fr', datum: '2026-03-10', parti: 'S' },
];

// ---------------------------------------------------------------------------
// Language-specific article content simulating translated output
// ---------------------------------------------------------------------------
const LANGUAGE_ARTICLES: Record<string, { title: string; subtitle: string; content: string }> = {
  en: {
    title: 'Week Ahead: March 16–23, 2026',
    subtitle: 'Parliamentary calendar, committee meetings, and debates',
    content: `<h2>Parliamentary Agenda</h2>
      <p>The Swedish Parliament has a busy week ahead with several important sessions.
      The Finance Committee will meet to discuss the budget framework. The Justice Committee
      continues its review of digital justice reforms. Multiple propositions are scheduled for debate
      in the chamber, including national security legislation and education reform.</p>
      <h2>Key Votes</h2>
      <p>Members of Parliament will vote on the defense budget motion and energy policy green transition.
      Coalition dynamics may shift as several parties signal disagreement on climate adaptation measures.</p>
      <h2>Committee Reports</h2>
      <p>New reports expected from the Finance Committee on expenditure frameworks and state revenues.
      The Defense Committee will present its cybersecurity review findings.</p>`,
  },
  sv: {
    title: 'Vecka Framåt: 16–23 mars 2026',
    subtitle: 'Riksdagens kalender, utskottsmöten och kammarens debatter',
    content: `<h2>Riksdagens agenda</h2>
      <p>Riksdagen har en intensiv vecka framför sig med flera viktiga sessioner.
      Finansutskottet sammanträder för att diskutera budgetramen. Justitieutskottet
      fortsätter sin granskning av digitaliseringsreformerna. Flera propositioner är
      planerade för debatt i kammaren.</p>
      <h2>Viktiga omröstningar</h2>
      <p>Ledamöterna ska rösta om försvarsbudgeten och energipolitiken.
      Koalitionsdynamiken kan förändras då flera partier signalerar oenighet.</p>
      <h2>Utskottsbetänkanden</h2>
      <p>Nya betänkanden väntas från finansutskottet och försvarsutskottet.</p>`,
  },
  de: {
    title: 'Woche Voraus: 16.–23. März 2026',
    subtitle: 'Parlamentarischer Kalender und Ausschusssitzungen',
    content: `<h2>Parlamentarische Agenda</h2>
      <p>Das schwedische Parlament hat eine arbeitsreiche Woche vor sich mit mehreren wichtigen Sitzungen.
      Der Finanzausschuss wird den Haushaltsrahmen diskutieren. Der Justizausschuss
      setzt seine Überprüfung der digitalen Justizreformen fort.</p>
      <h2>Wichtige Abstimmungen</h2>
      <p>Die Abgeordneten werden über den Verteidigungshaushalt und die Energiepolitik abstimmen.</p>
      <h2>Ausschussberichte</h2>
      <p>Neue Berichte werden vom Finanzausschuss und Verteidigungsausschuss erwartet.</p>`,
  },
  ar: {
    title: 'الأسبوع القادم: 16-23 مارس 2026',
    subtitle: 'التقويم البرلماني واجتماعات اللجان',
    content: `<h2>جدول الأعمال البرلماني</h2>
      <p>يواجه البرلمان السويدي أسبوعاً حافلاً بعدة جلسات مهمة.
      ستجتمع لجنة المالية لمناقشة إطار الميزانية. تواصل لجنة العدل
      مراجعتها لإصلاحات العدالة الرقمية.</p>
      <h2>التصويتات الرئيسية</h2>
      <p>سيصوت أعضاء البرلمان على ميزانية الدفاع وسياسة الطاقة.</p>
      <h2>تقارير اللجان</h2>
      <p>من المتوقع صدور تقارير جديدة من لجنة المالية ولجنة الدفاع.</p>`,
  },
};

/** Build an ArticleData object for the real template */
function buildArticleData(lang: Language): ArticleData {
  const content = LANGUAGE_ARTICLES[lang] ?? LANGUAGE_ARTICLES['en']!;
  return {
    slug: 'week-ahead-2026-03-16',
    title: content.title,
    subtitle: content.subtitle,
    date: '2026-03-16',
    type: 'prospective',
    articleType: 'week-ahead',
    readTime: '5 min read',
    lang,
    content: content.content,
    events: [],
    watchPoints: [],
    sources: ['Riksdagen Open Data'],
    keywords: ['parliament', 'committee', 'budget'],
    tags: ['week-ahead', 'parliament'],
  };
}

/**
 * Strip all content between matching open/close tags (case-insensitive).
 * Uses iterative indexOf-based extraction instead of regex to avoid
 * CodeQL js/bad-tag-filter alerts.
 */
function stripTagBlocks(html: string, tagName: string): string {
  let result = html;
  const openTag = `<${tagName}`;
  const closeTag = `</${tagName}`;
  let lower = result.toLowerCase();
  let start = lower.indexOf(openTag);
  while (start !== -1) {
    // Ensure we matched a real tag boundary (next char must be '>', ' ', or newline)
    const charAfterTag = lower[start + openTag.length];
    if (charAfterTag !== '>' && charAfterTag !== ' ' && charAfterTag !== '\n' && charAfterTag !== '\t') {
      // Not a real tag match — skip past this position
      const nextSearch = start + openTag.length;
      lower = result.toLowerCase();
      start = lower.indexOf(openTag, nextSearch);
      continue;
    }
    const end = lower.indexOf(closeTag, start);
    if (end === -1) break;
    const closeEnd = lower.indexOf('>', end);
    if (closeEnd === -1) break;
    result = result.slice(0, start) + ' ' + result.slice(closeEnd + 1);
    lower = result.toLowerCase();
    start = lower.indexOf(openTag);
  }
  return result;
}

/** Detect obvious Swedish tokens in non-Swedish HTML text content */
function detectSwedishLeakage(html: string, lang: string): string[] {
  if (lang === 'sv') return [];
  // Strip script, style, and footer blocks (they contain brand names like "Riksdag")
  // Uses iterative indexOf extraction instead of regex to satisfy CodeQL js/bad-tag-filter
  let stripped = stripTagBlocks(html, 'script');
  stripped = stripTagBlocks(stripped, 'style');
  stripped = stripTagBlocks(stripped, 'footer');
  // Remove remaining HTML tags
  stripped = stripped.replace(/<[^>]*>/g, ' ');
  // Distinctly Swedish parliamentary terms that should be translated.
  // Excludes "riksdagen" — the real template embeds this as a proper
  // noun / brand name in all language variants (meta descriptions, JSON-LD).
  const swedishTerms = [
    'betänkande', 'utskott', 'ledamot',
    'votering', 'kammarens', 'statsminister',
  ];
  const found: string[] = [];
  const lowerText = stripped.toLowerCase();
  for (const term of swedishTerms) {
    if (lowerText.includes(term)) found.push(term);
  }
  return found;
}

// ---------------------------------------------------------------------------
// Integration tests — real generateArticleHTML
// ---------------------------------------------------------------------------

describe('Full pipeline integration (real template)', () => {
  it('generates valid HTML for EN using the real article template', () => {
    const html = generateArticleHTML(buildArticleData('en'));
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('lang="en"');
    expect(html).toContain('<h1>');
    expect(html).toContain('<article');
    expect(html).toContain('</html>');
  });

  it('generates valid HTML for SV using the real article template', () => {
    const html = generateArticleHTML(buildArticleData('sv'));
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('lang="sv"');
  });

  it('Arabic article has dir="rtl" attribute from real template', () => {
    const html = generateArticleHTML(buildArticleData('ar'));
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="ar"');
  });

  it('German article does not have dir="rtl" (defaults to ltr)', () => {
    const html = generateArticleHTML(buildArticleData('de'));
    expect(html).not.toContain('dir="rtl"');
    expect(html).toContain('lang="de"');
  });

  it('no Swedish tokens leak into EN article from real template', () => {
    const html = generateArticleHTML(buildArticleData('en'));
    const leaks = detectSwedishLeakage(html, 'en');
    expect(leaks).toHaveLength(0);
  });

  it('no Swedish tokens leak into DE article from real template', () => {
    const html = generateArticleHTML(buildArticleData('de'));
    const leaks = detectSwedishLeakage(html, 'de');
    expect(leaks).toHaveLength(0);
  });

  it('no Swedish tokens leak into AR article from real template', () => {
    const html = generateArticleHTML(buildArticleData('ar'));
    const leaks = detectSwedishLeakage(html, 'ar');
    expect(leaks).toHaveLength(0);
  });

  it('SV articles are allowed to contain Swedish terms', () => {
    const html = generateArticleHTML(buildArticleData('sv'));
    const leaks = detectSwedishLeakage(html, 'sv');
    expect(leaks).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Article quality assessment — real validateArticleQuality + assessArticleQuality
// ---------------------------------------------------------------------------

describe('Article quality assessment (real production modules)', () => {
  it('EN article passes structural quality validation', () => {
    const html = generateArticleHTML(buildArticleData('en'));
    const result = validateArticleQuality(html, 'en', 'week-ahead', 'week-ahead-2026-03-16-en.html');
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it('SV article passes structural quality validation', () => {
    const html = generateArticleHTML(buildArticleData('sv'));
    const result = validateArticleQuality(html, 'sv', 'week-ahead', 'week-ahead-2026-03-16-sv.html');
    expect(result.passed).toBe(true);
  });

  it('EN article passes multi-dimensional quality assessment', () => {
    const html = generateArticleHTML(buildArticleData('en'));
    const assessment = assessArticleQuality(html, 'en', [], 40);
    expect(assessment.overallScore).toBeGreaterThan(0);
    expect(assessment.dimensions).toBeDefined();
  });

  it('SV article passes multi-dimensional quality assessment', () => {
    const html = generateArticleHTML(buildArticleData('sv'));
    const assessment = assessArticleQuality(html, 'sv', [], 40);
    expect(assessment.overallScore).toBeGreaterThan(0);
  });

  it('quality score improves when source doc IDs are provided', () => {
    const html = generateArticleHTML(buildArticleData('en'));
    const docIds = sampleDocuments.map(d => d.dok_id);
    const withDocs = assessArticleQuality(html, 'en', docIds, 40);
    const withoutDocs = assessArticleQuality(html, 'en', [], 40);
    // Source doc IDs contribute to factual accuracy / evidence quality scores
    expect(withDocs.overallScore).toBeGreaterThanOrEqual(withoutDocs.overallScore);
  });

  it('all non-SV language variants pass Swedish leakage check', () => {
    const nonSvLangs: Language[] = ['en', 'de', 'ar'];
    for (const lang of nonSvLangs) {
      const html = generateArticleHTML(buildArticleData(lang));
      const leaks = detectSwedishLeakage(html, lang);
      expect(leaks, `Swedish leakage found in ${lang}: ${leaks.join(', ')}`).toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Sample documents fixture validation
// ---------------------------------------------------------------------------

describe('Sample documents fixture', () => {
  it('contains at least 5 representative documents', () => {
    expect(sampleDocuments.length).toBeGreaterThanOrEqual(5);
  });

  it('covers all major document types', () => {
    const types = new Set(sampleDocuments.map(d => d.doktyp));
    expect(types.has('bet')).toBe(true);
    expect(types.has('prop')).toBe(true);
    expect(types.has('mot')).toBe(true);
    expect(types.has('ip')).toBe(true);
    expect(types.has('fr')).toBe(true);
  });

  it('includes diverse party signatories', () => {
    const parties = new Set(sampleDocuments.filter(d => d.parti).map(d => d.parti));
    expect(parties.size).toBeGreaterThanOrEqual(3);
  });

  it('all documents have dok_id and titel', () => {
    for (const doc of sampleDocuments) {
      expect(doc.dok_id).toBeDefined();
      expect(doc.titel).toBeDefined();
      expect(doc.titel.length).toBeGreaterThan(0);
    }
  });

  it('all documents have datum in ISO format', () => {
    for (const doc of sampleDocuments) {
      expect(doc.datum).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('documents include both Swedish and English titles', () => {
    const withEnglish = sampleDocuments.filter(d => d.title);
    expect(withEnglish.length).toBeGreaterThanOrEqual(3);
  });
});
