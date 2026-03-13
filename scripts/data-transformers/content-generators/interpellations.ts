/**
 * @module data-transformers/content-generators/interpellations
 * @description Dedicated generator for "interpellations" article content.
 * Renders interpellation debates grouped by target minister and policy theme,
 * with a ministerial accountability focus distinct from opposition motions.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { generateDeepAnalysisSection } from './shared.js';
import { escapeHtml } from '../../html-utils.js';
import type { Language } from '../../types/language.js';
import type { ArticleContentData, RawDocument } from '../types.js';
import { getPillarTransition } from '../../editorial-pillars.js';
import {
  L,
  svSpan,
  normalizePartyKey,
} from '../helpers.js';
import { detectPolicyDomains } from '../policy-analysis.js';

/**
 * Generate article content for an interpellation debates article.
 * Renders interpellations grouped by target minister and policy theme,
 * with ministerial accountability analysis.
 *
 * @param data - Structured data from MCP API calls (uses data.interpellations)
 * @param lang - Target language
 * @returns Generated HTML content string
 */
export function generateInterpellationsContent(
  data: ArticleContentData,
  lang: Language | string,
): string {
  const interpellations: RawDocument[] = data.interpellations ?? [];

  const heading = L(lang, 'interpellationsTag') as string || 'Interpellation Debates';
  let content = `<h2>${heading}</h2>\n`;

  if (interpellations.length === 0) {
    const noMotionsLabel = L(lang, 'noMotions') as string;
    const noDataMsg =
      noMotionsLabel.replace(/motion/gi, 'interpellation') ||
      'No interpellation debates available at this time.';
    content += `<p>${noDataMsg}</p>\n`;
    return content;
  }

  // Analytical lede paragraph — accountability focus, not opposition strategy
  const breakdownFn = L(lang, 'motionsBreakdown') as string | ((n: number) => string);
  const rawBreakdown =
    typeof breakdownFn === 'function' ? breakdownFn(interpellations.length) : null;
  const ledeParagraph = rawBreakdown
    ? String(rawBreakdown).replace(/motion/gi, 'interpellation')
    : `${interpellations.length} interpellations pending minister responses in the Riksdag, highlighting key accountability debates.`;
  content += `<p class="article-lede">${escapeHtml(ledeParagraph)}</p>\n`;

  // Group by target minister (mottagare field) for ministerial accountability analysis
  const byMinister: Record<string, RawDocument[]> = {};
  interpellations.forEach(interp => {
    const minister = escapeHtml(String(interp.mottagare ?? 'Minister'));
    if (!byMinister[minister]) byMinister[minister] = [];
    byMinister[minister].push(interp);
  });

  const ministerCount = Object.keys(byMinister).length;
  if (ministerCount > 0) {
    const accountabilityHeading = _getLocalizedHeading(lang, 'ministerialAccountability');
    content += `\n    <h2>${accountabilityHeading}</h2>\n`;
    const contextMsg = _getMinisterContextMsg(lang, ministerCount);
    content += `    <p>${escapeHtml(contextMsg)}</p>\n`;

    // Per-minister breakdown
    content += `    <div class="context-box">\n      <ul>\n`;
    Object.entries(byMinister)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 8)
      .forEach(([minister, interps]) => {
        const countLabel = interps.length === 1 ? 'interpellation' : 'interpellations';
        content += `        <li><strong>${minister}</strong> — ${interps.length} ${countLabel}</li>\n`;
      });
    content += `      </ul>\n    </div>\n`;
  }

  // Group by party for opposition oversight analysis
  const byParty: Record<string, RawDocument[]> = {};
  interpellations.forEach(interp => {
    const party = normalizePartyKey(interp.parti);
    if (!byParty[party]) byParty[party] = [];
    byParty[party].push(interp);
  });

  const partyCount = Object.keys(byParty).filter(p => p !== 'other').length;

  // Individual interpellation entries grouped by policy theme
  const byTheme: Record<string, RawDocument[]> = {};
  interpellations.forEach(interp => {
    const domains = detectPolicyDomains(interp, lang);
    const theme = domains[0] || String(L(lang, 'generalMatters'));
    if (!byTheme[theme]) byTheme[theme] = [];
    byTheme[theme].push(interp);
  });

  const themeCount = Object.keys(byTheme).length;
  if (themeCount > 1) {
    const thematicHeading = L(lang, 'thematicAnalysis') as string || 'Thematic Analysis';
    content += `\n    <h2>${thematicHeading}</h2>\n`;
    Object.entries(byTheme).forEach(([theme, themeInterps]) => {
      content += `\n    <h3>${escapeHtml(theme)} (${themeInterps.length})</h3>\n`;
      themeInterps.forEach(interp => {
        content += _renderInterpellationEntry(interp, lang);
      });
    });
  } else {
    interpellations.forEach(interp => {
      content += _renderInterpellationEntry(interp, lang);
    });
  }

  // Deep Analysis section (5W framework)
  content += generateDeepAnalysisSection({
    documents: interpellations,
    lang,
    cia: data.ciaContext,
    articleType: 'interpellations',
  });

  // Inter-pillar transition before opposition oversight section
  const watchTransition = getPillarTransition(lang, 'watchToOpposition');
  if (watchTransition) {
    content += `    <p class="pillar-transition">${escapeHtml(watchTransition)}</p>\n`;
  }

  // Opposition oversight section — which parties are most active in accountability
  if (partyCount > 0) {
    const coalitionHeading = L(lang, 'coalitionDynamics') as string || 'Parliamentary Oversight';
    content += `\n    <h2>${coalitionHeading}</h2>\n`;
    content += `    <div class="context-box">\n      <ul>\n`;
    Object.entries(byParty)
      .filter(([p]) => p !== 'other')
      .sort(([, a], [, b]) => b.length - a.length)
      .forEach(([party, partyInterps]) => {
        const detailFn = L(lang, 'partyMotionsFiled') as string | ((party: string, n: number) => string);
        const detail =
          typeof detailFn === 'function'
            ? String(detailFn(party, partyInterps.length)).replace(/motion/gi, 'interpellation')
            : `${party}: ${partyInterps.length} interpellations filed`;
        content += `        <li>${escapeHtml(String(detail))}</li>\n`;
      });
    content += `      </ul>\n    </div>\n`;
  }

  // Government engagement section (from analyze_g0v_by_department)
  const govDeptData = data.govDeptData ?? [];
  if (govDeptData.length > 0) {
    const govEngagementHeading = L(lang, 'govEngagement') as string || 'Government Engagement';
    content += `\n    <h2>${govEngagementHeading}</h2>\n`;
    content += `    <div class="context-box">\n      <ul>\n`;
    govDeptData.slice(0, 5).forEach(dept => {
      const deptName = escapeHtml(
        String(dept['name'] ?? dept['departement'] ?? dept['department'] ?? ''),
      );
      const deptCount = dept['count'] ?? dept['total'] ?? dept['document_count'];
      if (deptName) {
        const hasDeptCount = deptCount !== null && deptCount !== undefined;
        content += hasDeptCount
          ? `        <li><strong>${deptName}</strong> (${escapeHtml(String(deptCount))})</li>\n`
          : `        <li><strong>${deptName}</strong></li>\n`;
      }
    });
    content += `      </ul>\n    </div>\n`;
  }

  return content;
}

/**
 * Render a single interpellation entry as an HTML block.
 * Uses interpellation-specific terminology (not "motion" or "proposition").
 *
 * @param interp - Raw interpellation document
 * @param lang - Target language
 * @returns HTML string for a single interpellation entry
 */
function _renderInterpellationEntry(interp: RawDocument, lang: Language | string): string {
  const title = escapeHtml(String(interp.titel ?? interp.title ?? ''));
  const minister = escapeHtml(String(interp.mottagare ?? ''));
  const party = escapeHtml(String(interp.parti ?? ''));
  const author = escapeHtml(String(interp.intressent_id ?? interp.intressent_namn ?? ''));
  const datum = escapeHtml(String(interp.datum ?? ''));
  const url = String(interp.url ?? interp.dok_url ?? '');
  const safeUrl = url && /^https?:\/\//.test(url) ? url : '';

  const askedByLabel = _getLocalizedLabel(lang, 'askedBy', 'Asked by');
  const targetLabel = _getLocalizedLabel(lang, 'targetMinister', 'Target minister');
  const publishedLabel = L(lang, 'published') as string || 'Published';
  const whyMattersLabel = L(lang, 'whyItMatters') as string || 'Why it matters';

  let entry = `    <div class="motion-entry">\n`;
  if (title) {
    entry += safeUrl
      ? `      <h3><a href="${escapeHtml(safeUrl)}" rel="noopener noreferrer" target="_blank">${svSpan(title, lang)}</a></h3>\n`
      : `      <h3>${svSpan(title, lang)}</h3>\n`;
  }
  if (minister) {
    entry += `      <p><strong>${targetLabel}:</strong> ${minister}</p>\n`;
  }
  if (party || author) {
    const byParts: string[] = [];
    if (party) byParts.push(party);
    if (author) byParts.push(`(${author})`);
    entry += `      <p><strong>${askedByLabel}:</strong> ${byParts.join(' ')}</p>\n`;
  }
  if (datum) {
    entry += `      <p><em>${publishedLabel}: ${datum}</em></p>\n`;
  }
  // Why it matters — interpellation-specific context
  const whyText = _generateInterpellationWhyItMatters(interp, lang);
  entry += `      <p class="why-it-matters"><strong>${whyMattersLabel}:</strong> ${escapeHtml(whyText)}</p>\n`;
  entry += `    </div>\n`;
  return entry;
}

/**
 * Generate a "Why it matters" explanation for an interpellation.
 * Focuses on ministerial accountability rather than legislative impact.
 *
 * @param interp - Raw interpellation document
 * @param lang - Target language
 * @returns Localized explanation string
 */
function _generateInterpellationWhyItMatters(
  interp: RawDocument,
  lang: Language | string,
): string {
  const domains = detectPolicyDomains(interp, lang);
  const domain = domains[0] ?? '';
  const minister = String(interp.mottagare ?? '');

  if (domain && minister) {
    return `This interpellation demands ${minister} respond publicly to parliamentary scrutiny on ${domain} policy, creating formal accountability in the legislative record.`;
  }
  if (minister) {
    return `This interpellation requires ${minister} to provide a formal written response to parliament, strengthening democratic oversight.`;
  }
  const whyDefault = L(lang, 'whyMattersDefault') as string;
  return (
    whyDefault ||
    'Interpellations create formal accountability by requiring ministers to respond publicly to parliamentary questions, strengthening democratic oversight.'
  );
}

/**
 * Get a localized heading for interpellation-specific sections.
 * Falls back to an English default if no localized version exists.
 *
 * @param lang - Target language
 * @param key - Heading key
 * @returns Localized heading string
 */
function _getLocalizedHeading(lang: Language | string, key: string): string {
  const headings: Record<string, Record<string, string>> = {
    ministerialAccountability: {
      en: 'Ministerial Accountability',
      sv: 'Ministeransvar',
      da: 'Ministerielt ansvar',
      no: 'Ministerielt ansvar',
      fi: 'Ministerivastuu',
      de: 'Ministerielle Rechenschaftspflicht',
      fr: 'Responsabilité Ministérielle',
      es: 'Responsabilidad Ministerial',
      nl: 'Ministeriële Verantwoordelijkheid',
      ar: 'المساءلة الوزارية',
      he: 'אחריות שרים',
      ja: '大臣の説明責任',
      ko: '장관 책임',
      zh: '部长问责',
    },
  };
  return headings[key]?.[String(lang)] ?? headings[key]?.['en'] ?? key;
}

/**
 * Get a localized label for interpellation entry metadata fields.
 *
 * @param lang - Target language
 * @param key - Label key
 * @param fallback - English fallback text
 * @returns Localized label string
 */
function _getLocalizedLabel(lang: Language | string, key: string, fallback: string): string {
  const labels: Record<string, Record<string, string>> = {
    askedBy: {
      en: 'Asked by',
      sv: 'Frågad av',
      da: 'Spurgt af',
      no: 'Spurt av',
      fi: 'Kysyjä',
      de: 'Gestellt von',
      fr: 'Posée par',
      es: 'Formulada por',
      nl: 'Gesteld door',
      ar: 'سألت بواسطة',
      he: 'נשאל על ידי',
      ja: '質問者',
      ko: '질의자',
      zh: '提问人',
    },
    targetMinister: {
      en: 'Target minister',
      sv: 'Riktad till minister',
      da: 'Rettet mod minister',
      no: 'Rettet mot statsråd',
      fi: 'Kohdeministeri',
      de: 'Zielminister',
      fr: 'Ministre cible',
      es: 'Ministro destinatario',
      nl: 'Doelminister',
      ar: 'الوزير المستهدف',
      he: 'שר היעד',
      ja: '対象大臣',
      ko: '대상 장관',
      zh: '目标部长',
    },
  };
  return labels[key]?.[String(lang)] ?? labels[key]?.['en'] ?? fallback;
}

/**
 * Build a localized context message for the ministerial accountability section.
 *
 * @param lang - Target language
 * @param ministerCount - Number of distinct ministers facing interpellations
 * @returns Localized context string
 */
function _getMinisterContextMsg(lang: Language | string, ministerCount: number): string {
  const templates: Record<string, (n: number) => string> = {
    en: n => `Interpellations target ${n} minister${n !== 1 ? 's' : ''}, reflecting broad parliamentary scrutiny of government accountability.`,
    sv: n => `Interpellationerna riktar sig mot ${n} minister${n !== 1 ? 'ar' : ''}, vilket speglar en bred parlamentarisk granskning av regeringens ansvar.`,
    da: n => `Interpellationerne retter sig mod ${n} minister${n !== 1 ? 'e' : ''}, hvilket afspejler bred parlamentarisk kontrol med regeringens ansvar.`,
    no: n => `Interpellasjonene retter seg mot ${n} statsråd, noe som gjenspeiler bred parlamentarisk granskning av regjeringens ansvarlighet.`,
    fi: n => `Välikysymykset kohdistuvat ${n} ministeriin, mikä heijastaa laajaa parlamentaarista hallituksen valvontaa.`,
    de: n => `Die Interpellationen richten sich an ${n} Minister, was eine breite parlamentarische Kontrolle der Regierungsverantwortung widerspiegelt.`,
    fr: n => `Les interpellations visent ${n} ministre${n !== 1 ? 's' : ''}, reflétant un large contrôle parlementaire de la responsabilité gouvernementale.`,
    es: n => `Las interpelaciones se dirigen a ${n} ministro${n !== 1 ? 's' : ''}, reflejando un amplio escrutinio parlamentario de la responsabilidad gubernamental.`,
    nl: n => `Interpellaties richten zich op ${n} minister${n !== 1 ? 's' : ''}, wat een brede parlementaire controle op de verantwoordelijkheid van de regering weerspiegelt.`,
    ar: n => `تستهدف الاستجوابات ${n} وزير${n !== 1 ? 'اً' : ''}، مما يعكس رقابة برلمانية واسعة على مساءلة الحكومة.`,
    he: n => `האינטרפלציות מכוונות ל-${n} שר${n !== 1 ? 'ים' : ''}, המשקפות פיקוח פרלמנטרי רחב על אחריות הממשלה.`,
    ja: n => `質問主意書は${n}人の大臣を対象としており、政府の説明責任に対する幅広い議会の監視を反映しています。`,
    ko: n => `대정부 질의는 ${n}명의 장관을 대상으로 하며, 정부 책임에 대한 광범위한 의회 감시를 반영합니다.`,
    zh: n => `质询针对${n}位部长，反映了议会对政府问责制的广泛监督。`,
  };
  const fn = templates[String(lang)] ?? templates['en']!;
  return fn(ministerCount);
}
