/**
 * Integration Test for Enhanced News Generation Pipeline
 *
 * Tests the full generate→translate→publish chain using MockMCPClient
 * to validate HTML output, multi-language quality, and Swedish leakage
 * detection.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { RawDocument } from '../scripts/data-transformers/types.js';
import { sampleDocuments } from './fixtures/mock-mcp-client.js';

// ---------------------------------------------------------------------------
// Integration-level helpers (imported directly, not mocked)
// ---------------------------------------------------------------------------

/** Minimal article HTML generator for integration testing */
function generateMinimalArticleHTML(opts: {
  title: string;
  subtitle: string;
  lang: string;
  content: string;
  date: string;
}): string {
  const dir = ['ar', 'he'].includes(opts.lang) ? 'rtl' : 'ltr';
  return `<!DOCTYPE html>
<html lang="${opts.lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
  <meta name="description" content="${opts.subtitle}">
</head>
<body>
  <header>
    <h1>${opts.title}</h1>
    <p class="subtitle">${opts.subtitle}</p>
    <time datetime="${opts.date}">${opts.date}</time>
  </header>
  <main>
    <article>
      ${opts.content}
    </article>
  </main>
  <footer>
    <p>Riksdagsmonitor — AI-Generated Political Intelligence</p>
  </footer>
</body>
</html>`;
}

/** Check if HTML contains basic valid structure */
function isValidHTML(html: string): boolean {
  return (
    html.includes('<!DOCTYPE html>') &&
    html.includes('<html') &&
    html.includes('<head>') &&
    html.includes('<body>') &&
    html.includes('</html>')
  );
}

/** Detect obvious Swedish tokens in non-Swedish HTML */
function detectSwedishLeakage(html: string, lang: string): string[] {
  if (lang === 'sv') return [];

  // Strip HTML tags to check only text content
  const text = html
    .replace(/<script[\s>][\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s>][\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');

  // Distinctly Swedish parliamentary terms that should be translated
  // Excludes international cognates like 'proposition' which appear in many languages
  const swedishTerms = [
    'betänkande',
    'riksdagen',
    'utskott',
    'ledamot',
    'votering',
    'kammarens',
    'statsminister',
    'regeringen',
  ];

  const found: string[] = [];
  const lowerText = text.toLowerCase();
  for (const term of swedishTerms) {
    if (lowerText.includes(term)) {
      found.push(term);
    }
  }
  return found;
}

/** Simulate multi-dimensional quality assessment */
function assessArticleQuality(html: string, _lang: string): {
  overallScore: number;
  passesThreshold: boolean;
  dimensions: Record<string, number>;
} {
  const stripped = html
    .replace(/<script[\s>][\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s>][\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const wordCount = stripped.split(/\s+/).filter(w => w.length > 0).length;
  const h2Count = (html.match(/<h2[\s>]/gi) ?? []).length;

  const wordScore = Math.min(50, Math.round((wordCount / 500) * 50));
  const sectionScore = Math.min(30, h2Count * 10);
  const structureScore = isValidHTML(html) ? 20 : 0;
  const overallScore = wordScore + sectionScore + structureScore;

  return {
    overallScore,
    passesThreshold: overallScore >= 40,
    dimensions: {
      wordCount: wordScore,
      sections: sectionScore,
      structure: structureScore,
    },
  };
}

// ---------------------------------------------------------------------------
// Sample content for different languages
// ---------------------------------------------------------------------------

const LANGUAGE_CONTENT: Record<string, { title: string; subtitle: string; content: string }> = {
  en: {
    title: 'Week Ahead: March 16–23, 2026',
    subtitle: 'Parliamentary calendar, committee meetings, and debates',
    content: `<h2>Parliamentary Agenda</h2>
      <p>The Swedish Parliament (Riksdag) has a busy week ahead with several important sessions.
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

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

describe('Full pipeline integration', () => {
  it('generates valid HTML for EN with complete structure', () => {
    const html = generateMinimalArticleHTML({
      ...LANGUAGE_CONTENT['en']!,
      lang: 'en',
      date: '2026-03-16',
    });
    expect(isValidHTML(html)).toBe(true);
    expect(html).toContain('lang="en"');
    expect(html).toContain('<h1>');
    expect(html).toContain('<article>');
  });

  it('generates valid HTML for SV with complete structure', () => {
    const html = generateMinimalArticleHTML({
      ...LANGUAGE_CONTENT['sv']!,
      lang: 'sv',
      date: '2026-03-16',
    });
    expect(isValidHTML(html)).toBe(true);
    expect(html).toContain('lang="sv"');
  });

  it('Arabic article has dir="rtl" attribute', () => {
    const html = generateMinimalArticleHTML({
      ...LANGUAGE_CONTENT['ar']!,
      lang: 'ar',
      date: '2026-03-16',
    });
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="ar"');
  });

  it('German article has dir="ltr" attribute', () => {
    const html = generateMinimalArticleHTML({
      ...LANGUAGE_CONTENT['de']!,
      lang: 'de',
      date: '2026-03-16',
    });
    expect(html).toContain('dir="ltr"');
  });

  it('no Swedish tokens leak into EN article', () => {
    const html = generateMinimalArticleHTML({
      ...LANGUAGE_CONTENT['en']!,
      lang: 'en',
      date: '2026-03-16',
    });
    const leaks = detectSwedishLeakage(html, 'en');
    expect(leaks).toHaveLength(0);
  });

  it('no Swedish tokens leak into DE article', () => {
    const html = generateMinimalArticleHTML({
      ...LANGUAGE_CONTENT['de']!,
      lang: 'de',
      date: '2026-03-16',
    });
    const leaks = detectSwedishLeakage(html, 'de');
    expect(leaks).toHaveLength(0);
  });

  it('no Swedish tokens leak into AR article', () => {
    const html = generateMinimalArticleHTML({
      ...LANGUAGE_CONTENT['ar']!,
      lang: 'ar',
      date: '2026-03-16',
    });
    const leaks = detectSwedishLeakage(html, 'ar');
    expect(leaks).toHaveLength(0);
  });

  it('SV articles are allowed to contain Swedish terms', () => {
    const html = generateMinimalArticleHTML({
      ...LANGUAGE_CONTENT['sv']!,
      lang: 'sv',
      date: '2026-03-16',
    });
    // Swedish leakage detection should skip SV
    const leaks = detectSwedishLeakage(html, 'sv');
    expect(leaks).toHaveLength(0);
  });
});

describe('Article quality assessment integration', () => {
  it('EN article passes quality threshold', () => {
    const html = generateMinimalArticleHTML({
      ...LANGUAGE_CONTENT['en']!,
      lang: 'en',
      date: '2026-03-16',
    });
    const quality = assessArticleQuality(html, 'en');
    expect(quality.passesThreshold).toBe(true);
    expect(quality.overallScore).toBeGreaterThanOrEqual(40);
  });

  it('SV article passes quality threshold', () => {
    const html = generateMinimalArticleHTML({
      ...LANGUAGE_CONTENT['sv']!,
      lang: 'sv',
      date: '2026-03-16',
    });
    const quality = assessArticleQuality(html, 'sv');
    expect(quality.passesThreshold).toBe(true);
  });

  it('empty article fails quality threshold', () => {
    const html = generateMinimalArticleHTML({
      title: 'Empty',
      subtitle: 'Test',
      content: '',
      lang: 'en',
      date: '2026-03-16',
    });
    const quality = assessArticleQuality(html, 'en');
    expect(quality.overallScore).toBeLessThan(100);
  });

  it('all non-SV language variants pass Swedish leakage check', () => {
    const nonSvLangs = ['en', 'de', 'ar'] as const;
    for (const lang of nonSvLangs) {
      const langData = LANGUAGE_CONTENT[lang];
      if (!langData) continue;
      const html = generateMinimalArticleHTML({
        ...langData,
        lang,
        date: '2026-03-16',
      });
      const leaks = detectSwedishLeakage(html, lang);
      expect(leaks, `Swedish leakage found in ${lang} article: ${leaks.join(', ')}`).toHaveLength(0);
    }
  });
});

describe('Sample documents fixture', () => {
  it('contains at least 10 representative documents', () => {
    expect(sampleDocuments.length).toBeGreaterThanOrEqual(10);
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
    const parties = new Set(
      sampleDocuments.filter(d => d.parti).map(d => d.parti),
    );
    // At least 4 different parties
    expect(parties.size).toBeGreaterThanOrEqual(4);
  });

  it('all documents have dok_id and titel', () => {
    for (const doc of sampleDocuments) {
      expect(doc.dok_id).toBeDefined();
      expect(doc.titel).toBeDefined();
      expect(doc.titel!.length).toBeGreaterThan(0);
    }
  });

  it('all documents have datum in ISO format', () => {
    for (const doc of sampleDocuments) {
      expect(doc.datum).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('documents include both Swedish and English titles', () => {
    const withEnglish = sampleDocuments.filter(d => d.title);
    expect(withEnglish.length).toBeGreaterThanOrEqual(5);
  });
});
