/**
 * @module generate-news-enhanced/generators
 * @description Article generator functions for week-ahead, committee reports,
 * propositions, and motions article types.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import {
  transformCalendarToEventGrid,
  generateArticleContent,
  extractWatchPoints,
  generateMetadata,
  calculateReadTime,
  generateSources,
  filterFreshDocuments,
  type RawDocument,
} from '../data-transformers.js';
import {
  generateStakeholderSwotSection,
  generateDashboardSection,
  generateEconomicDashboardSection,
  generateMindmapSection,
  generateSankeySection,
  type StakeholderSwot,
  type MindmapBranch,
  type SankeyNode,
  type SankeyFlow,
} from '../data-transformers/index.js';
import { generateDeepAnalysisSection } from '../data-transformers/content-generators/index.js';
import { generateDeepPolicyAnalysis, detectPolicyDomains } from '../data-transformers/policy-analysis.js';
import { escapeHtml } from '../html-utils.js';
import { generateArticleHTML } from '../article-template.js';
import { MCPClient } from '../mcp-client.js';
import type { Language } from '../types/language.js';
import type { GenerationResult, DateRange, ArticleCategory, TemplateSection, SwotEntry } from '../types/article.js';
import type { TitleSet } from './types.js';
import { languages, stats, getSharedClient, requireMcp, toISODate, documentIds, documentUrls, focusTopic } from './config.js';
import {
  getWeekAheadDateRange,
  formatDateForSlug,
  writeSingleArticle,
} from './helpers.js';

// ---------------------------------------------------------------------------
// Generator functions
// ---------------------------------------------------------------------------

/**
 * Generate Week Ahead article in specified languages
 */
export async function generateWeekAhead(): Promise<GenerationResult> {
  console.log('📅 Generating Week Ahead article...');

  try {
    const client: MCPClient = await getSharedClient();
    const dateRange: DateRange = getWeekAheadDateRange();

    console.log(`  📆 Date range: ${dateRange.start} to ${dateRange.end}`);

    // 1. Fetch calendar events from MCP
    console.log('  🔄 Fetching calendar events from riksdag-regering-mcp...');
    const events: unknown[] = await client.fetchCalendarEvents(dateRange.start, dateRange.end);
    console.log(`  📊 Found ${events.length} events`);

    // 2. Fetch upcoming/recent documents
    const rawDocs = await client.searchDocuments({ from_date: dateRange.start, to_date: dateRange.end, limit: 30 })
      .catch((e: unknown) => { if (requireMcp) throw e; return [] as unknown[]; });
    const documents: RawDocument[] = Array.isArray(rawDocs) ? rawDocs as RawDocument[] : [];
    console.log(`  📊 Found ${documents.length} upcoming documents`);

    // 3. Fetch parliamentary questions (fragor)
    console.log('  🔄 Fetching parliamentary questions...');
    const rawQuestions = await client.fetchWrittenQuestions({ limit: 20 })
      .catch((e: unknown) => { if (requireMcp) throw e; return [] as unknown[]; });
    const questions: unknown[] = Array.isArray(rawQuestions) ? rawQuestions : [];
    console.log(`  📊 Found ${questions.length} written questions`);

    // 4. Fetch interpellations (interpellationer)
    console.log('  🔄 Fetching interpellations...');
    const rawInterpellations = await client.fetchInterpellations({ limit: 15 })
      .catch((e: unknown) => { if (requireMcp) throw e; return [] as unknown[]; });
    const interpellations: unknown[] = Array.isArray(rawInterpellations) ? rawInterpellations : [];
    console.log(`  📊 Found ${interpellations.length} interpellations`);

    const today: Date = new Date();
    const slug: string = `${formatDateForSlug(today)}-week-ahead`;

    // 5. Generate for each requested language
    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      // Transform data for this language
      // MCP returns unknown[] — cast to match data-transformers' expected shapes
      const eventGrid = transformCalendarToEventGrid(events as Parameters<typeof transformCalendarToEventGrid>[0], lang);
      const weekData = {
        events: events as Parameters<typeof transformCalendarToEventGrid>[0],
        documents,
        questions,
        interpellations,
        highlights: [] as Array<{title: string; description: string}>,
      };
      const content: string = generateArticleContent(weekData, 'week-ahead', lang);
      const watchPoints = extractWatchPoints({ events: events as Parameters<typeof transformCalendarToEventGrid>[0], documents }, lang);
      const metadata = generateMetadata({ events: events as Parameters<typeof transformCalendarToEventGrid>[0], documents }, 'week-ahead', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_calendar_events', 'search_dokument', 'get_fragor', 'get_interpellationer']);

      // Language-specific titles
      const titles: Record<Language, TitleSet> = {
        en: { title: `Week Ahead: ${dateRange.start} to ${dateRange.end}`, subtitle: `Parliamentary calendar, committee meetings, and chamber debates for the coming week` },
        sv: { title: `Vecka Framåt: ${dateRange.start} till ${dateRange.end}`, subtitle: `Riksdagens kalender, utskottsmöten och kammarens debatter för kommande vecka` },
        da: { title: `Ugen Fremover: ${dateRange.start} til ${dateRange.end}`, subtitle: `Parlamentarisk kalender, udvalgsmøder og debatter for den kommende uge` },
        no: { title: `Uke Fremover: ${dateRange.start} til ${dateRange.end}`, subtitle: `Parlamentarisk kalender, komitémøter og debatter for kommende uke` },
        fi: { title: `Tuleva Viikko: ${dateRange.start} - ${dateRange.end}`, subtitle: `Parlamentin kalenteri, valiokuntien kokoukset ja keskustelut tulevalle viikolle` },
        de: { title: `Woche Voraus: ${dateRange.start} bis ${dateRange.end}`, subtitle: `Parlamentarischer Kalender, Ausschusssitzungen und Debatten für die kommende Woche` },
        fr: { title: `Semaine à Venir: ${dateRange.start} au ${dateRange.end}`, subtitle: `Calendrier parlementaire, réunions de commission et débats pour la semaine à venir` },
        es: { title: `Semana Próxima: ${dateRange.start} a ${dateRange.end}`, subtitle: `Calendario parlamentario, reuniones de comisión y debates para la próxima semana` },
        nl: { title: `Week Vooruit: ${dateRange.start} tot ${dateRange.end}`, subtitle: `Parlementaire kalender, commissievergaderingen en debatten voor de komende week` },
        ar: { title: `الأسبوع القادم: ${dateRange.start} إلى ${dateRange.end}`, subtitle: `التقويم البرلماني واجتماعات اللجان والمناقشات للأسبوع المقبل` },
        he: { title: `השבוע הקרוב: ${dateRange.start} עד ${dateRange.end}`, subtitle: `לוח שנה פרלמנטרי, פגישות ועדה ודיונים לשבוע הקרוב` },
        ja: { title: `来週の展望: ${dateRange.start} から ${dateRange.end}`, subtitle: `来週の議会カレンダー、委員会会議、討論` },
        ko: { title: `다음 주 전망: ${dateRange.start}부터 ${dateRange.end}까지`, subtitle: `다음 주 의회 일정, 위원회 회의 및 토론` },
        zh: { title: `下周展望：${dateRange.start} 至 ${dateRange.end}`, subtitle: `下周议会日程、委员会会议和辩论` }
      };

      const langTitles: TitleSet = titles[lang] || titles.en;

      // Generate HTML for this language
      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: langTitles.title,
        subtitle: langTitles.subtitle,
        date: toISODate(today),
        type: 'prospective' as ArticleCategory,
        readTime,
        lang,
        content,
        events: eventGrid,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags
      });

      // Write article
      await writeSingleArticle(html, slug, lang, 'week-ahead');
      console.log(`  ✅ ${lang.toUpperCase()} version generated`);
    }

    console.log('  ✅ Week Ahead article generated successfully in all requested languages');
    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Week Ahead:', (error as Error).message);
    console.error('   Stack:', (error as Error).stack);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate Committee Reports article
 */
export async function generateCommitteeReports(): Promise<GenerationResult> {
  console.log('📋 Generating Committee Reports article...');

  try {
    const client: MCPClient = await getSharedClient();

    console.log('  🔄 Fetching committee reports from riksdag-regering-mcp...');
    let reports: unknown[] = filterFreshDocuments(await client.fetchCommitteeReports(10) as RawDocument[]);
    console.log(`  📊 Found ${reports.length} committee reports`);

    if (reports.length === 0) {
      console.log('  ℹ️ No new committee reports found, skipping');
      return { success: true, files: 0 };
    }

    // Enrich documents with content and metadata
    console.log('  🔍 Enriching documents with detailed content...');
    reports = await client.enrichDocumentsWithContent(reports as Parameters<MCPClient['enrichDocumentsWithContent']>[0], 3);
    const enrichedCount: number = (reports as Array<Record<string, unknown>>).filter(r => r['contentFetched']).length;
    console.log(`  ✅ Enriched ${enrichedCount}/${reports.length} reports with content`);

    const today: Date = new Date();
    const slug: string = `${formatDateForSlug(today)}-committee-reports`;

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const typedReports = reports as Parameters<typeof generateArticleContent>[0]['reports'];
      const content: string = generateArticleContent({ reports: typedReports }, 'committee-reports', lang);
      const watchPoints = extractWatchPoints({ reports: typedReports }, lang);
      const metadata = generateMetadata({ reports: typedReports }, 'committee-reports', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_betankanden', 'get_dokument_innehall']);

      const titles: Record<Language, TitleSet> = {
        en: { title: `Committee Reports: Parliamentary Priorities This Week`, subtitle: `Analysis of ${reports.length} committee reports revealing Riksdag priorities for the current session` },
        sv: { title: `Utskottsbetänkanden: Riksdagens prioriteringar denna vecka`, subtitle: `Analys av ${reports.length} utskottsbetänkanden som avslöjar riksdagens prioriteringar` },
        da: { title: `Udvalgsbetænkninger: Parlamentets prioriteringer denne uge`, subtitle: `Analyse af ${reports.length} udvalgsbetænkninger` },
        no: { title: `Komitéinnstillinger: Stortingets prioriteringer denne uken`, subtitle: `Analyse av ${reports.length} komitéinnstillinger` },
        fi: { title: `Valiokunnan mietinnöt: Eduskunnan prioriteetit tällä viikolla`, subtitle: `Analyysi ${reports.length} valiokunnan mietinnöstä` },
        de: { title: `Ausschussberichte: Parlamentarische Prioritäten diese Woche`, subtitle: `Analyse von ${reports.length} Ausschussberichten` },
        fr: { title: `Rapports de commission: Priorités parlementaires cette semaine`, subtitle: `Analyse de ${reports.length} rapports de commission` },
        es: { title: `Informes de comisión: Prioridades parlamentarias esta semana`, subtitle: `Análisis de ${reports.length} informes de comisión` },
        nl: { title: `Commissierapporten: Parlementaire prioriteiten deze week`, subtitle: `Analyse van ${reports.length} commissierapporten` },
        ar: { title: `تقارير اللجان: أولويات البرلمان هذا الأسبوع`, subtitle: `تحليل ${reports.length} تقارير لجان` },
        he: { title: `דוחות ועדה: סדרי עדיפויות פרלמנטריים השבוע`, subtitle: `ניתוח ${reports.length} דוחות ועדה` },
        ja: { title: `委員会報告：今週の議会優先事項`, subtitle: `${reports.length}件の委員会報告の分析` },
        ko: { title: `위원회 보고서: 이번 주 의회 우선순위`, subtitle: `${reports.length}개 위원회 보고서 분석` },
        zh: { title: `委员会报告：本周议会优先事项`, subtitle: `${reports.length}份委员会报告分析` }
      };

      const langTitles: TitleSet = titles[lang] || titles.en;

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: langTitles.title,
        subtitle: langTitles.subtitle,
        date: toISODate(today),
        type: 'analysis' as ArticleCategory,
        readTime,
        lang,
        content,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags
      });

      await writeSingleArticle(html, slug, lang, 'committee-reports');
    }

    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Committee Reports:', (error as Error).message);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate Government Propositions article
 */
export async function generatePropositions(): Promise<GenerationResult> {
  console.log('📜 Generating Government Propositions article...');

  try {
    const client: MCPClient = await getSharedClient();

    console.log('  🔄 Fetching propositions from riksdag-regering-mcp...');
    let propositions: unknown[] = filterFreshDocuments(await client.fetchPropositions(10) as RawDocument[]);
    console.log(`  📊 Found ${propositions.length} propositions`);

    if (propositions.length === 0) {
      console.log('  ℹ️ No new propositions found, skipping');
      return { success: true, files: 0 };
    }

    // Enrich documents with content and metadata
    console.log('  🔍 Enriching documents with detailed content...');
    propositions = await client.enrichDocumentsWithContent(propositions as Parameters<MCPClient['enrichDocumentsWithContent']>[0], 3);
    const enrichedCount: number = (propositions as Array<Record<string, unknown>>).filter(p => p['contentFetched']).length;
    console.log(`  ✅ Enriched ${enrichedCount}/${propositions.length} propositions with content`);

    const today: Date = new Date();
    const slug: string = `${formatDateForSlug(today)}-government-propositions`;

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const typedPropositions = propositions as Parameters<typeof generateArticleContent>[0]['propositions'];
      const content: string = generateArticleContent({ propositions: typedPropositions }, 'propositions', lang);
      const watchPoints = extractWatchPoints({ propositions: typedPropositions }, lang);
      const metadata = generateMetadata({ propositions: typedPropositions }, 'propositions', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_propositioner', 'get_dokument_innehall']);

      const titles: Record<Language, TitleSet> = {
        en: { title: `Government Propositions: Policy Priorities This Week`, subtitle: `Analysis of ${propositions.length} government propositions shaping the legislative agenda` },
        sv: { title: `Regeringens propositioner: Veckans prioriteringar`, subtitle: `Analys av ${propositions.length} propositioner som formar den lagstiftande agendan` },
        da: { title: `Regeringsforslag: Politiske prioriteringer denne uge`, subtitle: `Analyse af ${propositions.length} regeringsforslag` },
        no: { title: `Regjeringens proposisjoner: Politiske prioriteringer denne uken`, subtitle: `Analyse av ${propositions.length} regjeringsproposisjoner` },
        fi: { title: `Hallituksen esitykset: Viikon poliittiset prioriteetit`, subtitle: `Analyysi ${propositions.length} hallituksen esityksestä` },
        de: { title: `Regierungsvorlagen: Politische Prioritäten diese Woche`, subtitle: `Analyse von ${propositions.length} Regierungsvorlagen` },
        fr: { title: `Propositions gouvernementales: Priorités politiques cette semaine`, subtitle: `Analyse de ${propositions.length} propositions gouvernementales` },
        es: { title: `Proposiciones gubernamentales: Prioridades políticas esta semana`, subtitle: `Análisis de ${propositions.length} proposiciones gubernamentales` },
        nl: { title: `Regeringsvoorstellen: Politieke prioriteiten deze week`, subtitle: `Analyse van ${propositions.length} regeringsvoorstellen` },
        ar: { title: `مقترحات الحكومة: الأولويات السياسية هذا الأسبوع`, subtitle: `تحليل ${propositions.length} مقترحات حكومية` },
        he: { title: `הצעות ממשלה: סדרי עדיפויות מדיניים השבוע`, subtitle: `ניתוח ${propositions.length} הצעות ממשלה` },
        ja: { title: `政府提案：今週の政策優先事項`, subtitle: `${propositions.length}件の政府提案の分析` },
        ko: { title: `정부 법안: 이번 주 정책 우선순위`, subtitle: `${propositions.length}개 정부 법안 분석` },
        zh: { title: `政府提案：本周政策优先事项`, subtitle: `${propositions.length}份政府提案分析` }
      };

      const langTitles: TitleSet = titles[lang] || titles.en;

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: langTitles.title,
        subtitle: langTitles.subtitle,
        date: toISODate(today),
        type: 'analysis' as ArticleCategory,
        readTime,
        lang,
        content,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags
      });

      await writeSingleArticle(html, slug, lang, 'propositions');
    }

    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Propositions:', (error as Error).message);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate Opposition Motions article
 */
export async function generateMotions(): Promise<GenerationResult> {
  console.log('📝 Generating Opposition Motions article...');

  try {
    const client: MCPClient = await getSharedClient();

    console.log('  🔄 Fetching motions from riksdag-regering-mcp...');
    let motions: unknown[] = filterFreshDocuments(await client.fetchMotions(10) as RawDocument[]);
    console.log(`  📊 Found ${motions.length} motions`);

    if (motions.length === 0) {
      console.log('  ℹ️ No new motions found, skipping');
      return { success: true, files: 0 };
    }

    // Enrich documents with content and metadata
    console.log('  🔍 Enriching documents with detailed content...');
    motions = await client.enrichDocumentsWithContent(motions as Parameters<MCPClient['enrichDocumentsWithContent']>[0], 3);
    const enrichedCount: number = (motions as Array<Record<string, unknown>>).filter(m => m['contentFetched']).length;
    console.log(`  ✅ Enriched ${enrichedCount}/${motions.length} motions with content`);

    const today: Date = new Date();
    const slug: string = `${formatDateForSlug(today)}-opposition-motions`;

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const typedMotions = motions as Parameters<typeof generateArticleContent>[0]['motions'];
      const content: string = generateArticleContent({ motions: typedMotions }, 'motions', lang);
      const watchPoints = extractWatchPoints({ motions: typedMotions }, lang);
      const metadata = generateMetadata({ motions: typedMotions }, 'motions', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_motioner', 'get_dokument_innehall']);

      const titles: Record<Language, TitleSet> = {
        en: { title: `Opposition Motions: Battle Lines This Week`, subtitle: `Analysis of ${motions.length} opposition motions revealing parliamentary fault lines` },
        sv: { title: `Oppositionsmotioner: Veckans stridslinjer`, subtitle: `Analys av ${motions.length} oppositionsmotioner som avslöjar parlamentariska skiljelinjer` },
        da: { title: `Oppositionsforslag: Ugens kamppladser`, subtitle: `Analyse af ${motions.length} oppositionsforslag` },
        no: { title: `Opposisjonsforslag: Ukens kamplinjer`, subtitle: `Analyse av ${motions.length} opposisjonsforslag` },
        fi: { title: `Opposition aloitteet: Viikon taistelulinjat`, subtitle: `Analyysi ${motions.length} opposition aloitteesta` },
        de: { title: `Oppositionsanträge: Kampflinien dieser Woche`, subtitle: `Analyse von ${motions.length} Oppositionsanträgen` },
        fr: { title: `Motions d'opposition: Lignes de bataille cette semaine`, subtitle: `Analyse de ${motions.length} motions d'opposition` },
        es: { title: `Mociones de oposición: Líneas de batalla esta semana`, subtitle: `Análisis de ${motions.length} mociones de oposición` },
        nl: { title: `Oppositiemoties: Strijdlijnen deze week`, subtitle: `Analyse van ${motions.length} oppositiemoties` },
        ar: { title: `اقتراحات المعارضة: خطوط المعركة هذا الأسبوع`, subtitle: `تحليل ${motions.length} اقتراحات المعارضة` },
        he: { title: `הצעות אופוזיציה: קווי העימות השבוע`, subtitle: `ניתוח ${motions.length} הצעות אופוזיציה` },
        ja: { title: `野党動議：今週の対立構図`, subtitle: `${motions.length}件の野党動議の分析` },
        ko: { title: `야당 동의: 이번 주 대립 구도`, subtitle: `${motions.length}개 야당 동의 분석` },
        zh: { title: `反对党动议：本周对立格局`, subtitle: `${motions.length}份反对党动议分析` }
      };

      const langTitles: TitleSet = titles[lang] || titles.en;

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: langTitles.title,
        subtitle: langTitles.subtitle,
        date: toISODate(today),
        type: 'analysis' as ArticleCategory,
        readTime,
        lang,
        content,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags
      });

      await writeSingleArticle(html, slug, lang, 'motions');
    }

    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Motions:', (error as Error).message);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Extract a Riksdag document ID (dok_id) from a known URL pattern.
 * Supports:
 *   - https://riksdagen.se/sv/dokument-och-lagar/dokument/{type}/{dok_id}/
 *   - https://data.riksdagen.se/dokument/{dok_id}
 *   - https://data.riksdagen.se/dokument/{dok_id}.json
 *
 * @returns The extracted dok_id, or null if the URL doesn't match a known pattern.
 */
export function extractDocIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const segments = parsed.pathname.split('/').filter(Boolean);

    // https://riksdagen.se/sv/dokument-och-lagar/dokument/{type}/{dok_id}
    if (hostname === 'riksdagen.se' || hostname === 'www.riksdagen.se') {
      // Path: /sv/dokument-och-lagar/dokument/{type}/{dok_id}
      const dokIdx = segments.indexOf('dokument');
      if (dokIdx >= 0 && segments.length > dokIdx + 2) {
        return segments[dokIdx + 2];
      }
    }

    // https://data.riksdagen.se/dokument/{dok_id}[.json|.xml|.html]
    if (hostname === 'data.riksdagen.se') {
      const dokIdx = segments.indexOf('dokument');
      if (dokIdx >= 0 && segments.length > dokIdx + 1) {
        return segments[dokIdx + 1].replace(/\.(json|xml|html|pdf)$/i, ''); // strip known file extensions
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Determine whether a URL points to a government (regeringen.se) resource
 * that can be fetched via the get_g0v_document_content MCP tool.
 */
export function isGovernmentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === 'regeringen.se' || hostname === 'www.regeringen.se';
  } catch {
    return false;
  }
}

/**
 * Strip HTML tags from a user-supplied string to prevent XSS.
 * Uses a multi-pass loop to handle nested tag reconstruction attempts
 * (e.g. `<scr<script>ipt>`).  Returns **plain text** — callers must
 * apply `escapeHtml()` at their render sites so escaping happens exactly once.
 */
export function sanitizePlainText(text: string): string {
  let cleaned = text;
  let prev: string;
  do {
    prev = cleaned;
    cleaned = cleaned.replace(/<[^>]*>/g, '');
  } while (cleaned !== prev);
  return cleaned;
}

// ---------------------------------------------------------------------------
// Deep-Inspection content generator (topic-focused, comprehensive)
// ---------------------------------------------------------------------------

/** Cyberpunk-theme colour palette for deep-inspection dashboard charts. */
const DEEP_CHART_PALETTE: readonly string[] = [
  '#00d9ff', '#ff006e', '#ffbe0b', '#00ff88', '#ff8800', '#aa00ff',
];

/** Per-language document type display names used in deep-inspection article headers. */
const DEEP_DOC_TYPE_LABELS: Readonly<Record<string, Partial<Record<Language, string>>>> = {
  prop: { en: 'Government Proposition', sv: 'Proposition', da: 'Lovforslag', no: 'Proposisjon', fi: 'Hallituksen esitys', de: 'Regierungsvorlage', fr: 'Proposition du gouvernement', es: 'Proposición del gobierno', nl: 'Regeringsvoorstel', ar: 'اقتراح حكومي', he: 'הצעת חוק ממשלתית', ja: '政府提案', ko: '정부 제안', zh: '政府提案' },
  bet:  { en: 'Committee Report', sv: 'Betänkande', da: 'Betænkning', no: 'Innstilling', fi: 'Mietintö', de: 'Ausschussbericht', fr: 'Rapport de commission', es: 'Informe de comité', nl: 'Commissierapport', ar: 'تقرير لجنة', he: 'דוח ועדה', ja: '委員会報告', ko: '위원회 보고서', zh: '委员会报告' },
  mot:  { en: 'Motion', sv: 'Motion', da: 'Forslag', no: 'Forslag', fi: 'Aloite', de: 'Antrag', fr: 'Motion', es: 'Moción', nl: 'Motie', ar: 'اقتراح', he: 'הצעה', ja: '動議', ko: '동의', zh: '动议' },
  skr:  { en: 'Government Communication', sv: 'Skrivelse', da: 'Regeringsmeddelelse', no: 'Regjeringsmelding', fi: 'Hallituksen kirje', de: 'Regierungsschreiben', fr: 'Communication gouvernementale', es: 'Comunicación gubernamental', nl: 'Regeringsmededeling', ar: 'مراسلة حكومية', he: 'תקשורת ממשלתית', ja: '政府通知', ko: '정부 서한', zh: '政府通知' },
  sfs:  { en: 'Law/Statute', sv: 'Lag/Förordning', da: 'Lov', no: 'Lov', fi: 'Laki', de: 'Gesetz', fr: 'Loi', es: 'Ley', nl: 'Wet', ar: 'قانون', he: 'חוק', ja: '法律', ko: '법률', zh: '法律' },
  fpm:  { en: 'EU Position Paper', sv: 'Faktapromemoria (EU)', da: 'EU-faktaark', no: 'EU-posisjonsnotat', fi: 'EU-faktamuistio', de: 'EU-Positionspapier', fr: 'Note de position UE', es: 'Documento de posición UE', nl: 'EU-positiepapier', ar: 'ورقة موقف الاتحاد الأوروبي', he: 'מסמך עמדה לאיחוד האירופי', ja: 'EU立場文書', ko: 'EU 입장 문서', zh: 'EU立场文件' },
  pressm: { en: 'Press Release', sv: 'Pressmeddelande', da: 'Pressemeddelelse', no: 'Pressemelding', fi: 'Lehdistötiedote', de: 'Pressemitteilung', fr: 'Communiqué de presse', es: 'Comunicado de prensa', nl: 'Persbericht', ar: 'بيان صحفي', he: 'הודעה לעיתונות', ja: 'プレスリリース', ko: '보도자료', zh: '新闻稿' },
};

/** Per-language headings for sections of the deep-inspection article. */
const DEEP_SECTION_LABELS: Readonly<Record<string, Partial<Record<Language, string>>>> = {
  documentIntelligence: {
    en: 'Document Intelligence Analysis',
    sv: 'Dokumentunderrättelseanalys',
    da: 'Dokumentefterretningsanalyse',
    no: 'Dokumentetterretningsanalyse',
    fi: 'Asiakirjatiedusteluanalyysi',
    de: 'Dokumentenintelligenz-Analyse',
    fr: 'Analyse renseignement documentaire',
    es: 'Análisis de inteligencia documental',
    nl: 'Documentintelligentie-analyse',
    ar: 'تحليل استخبارات الوثائق',
    he: 'ניתוח מודיעין מסמכים',
    ja: '文書インテリジェンス分析',
    ko: '문서 인텔리전스 분석',
    zh: '文件情报分析',
  },
  strategicImplications: {
    en: 'Strategic Implications',
    sv: 'Strategiska implikationer',
    da: 'Strategiske implikationer',
    no: 'Strategiske implikasjoner',
    fi: 'Strategiset vaikutukset',
    de: 'Strategische Implikationen',
    fr: 'Implications stratégiques',
    es: 'Implicaciones estratégicas',
    nl: 'Strategische implicaties',
    ar: 'الآثار الاستراتيجية',
    he: 'השלכות אסטרטגיות',
    ja: '戦略的示唆',
    ko: '전략적 시사점',
    zh: '战略影响',
  },
  keyTakeaways: {
    en: 'Key Takeaways',
    sv: 'Viktiga slutsatser',
    da: 'Vigtigste konklusioner',
    no: 'Viktigste konklusjoner',
    fi: 'Tärkeimmät johtopäätökset',
    de: 'Wesentliche Erkenntnisse',
    fr: 'Points clés',
    es: 'Conclusiones clave',
    nl: 'Belangrijkste bevindingen',
    ar: 'النقاط الرئيسية',
    he: 'נקודות מפתח',
    ja: '主なポイント',
    ko: '핵심 사항',
    zh: '关键要点',
  },
  topicContext: {
    en: 'Topic Context & Significance',
    sv: 'Ämneskontext och betydelse',
    da: 'Emnekontext og betydning',
    no: 'Emnekontext og betydning',
    fi: 'Aiheyhteyssä ja merkityksessä',
    de: 'Themenkontext und Bedeutung',
    fr: 'Contexte thématique et signification',
    es: 'Contexto temático y significación',
    nl: 'Onderwerpcontext en betekenis',
    ar: 'السياق الموضوعي والأهمية',
    he: 'הקשר נושאי ומשמעות',
    ja: 'トピックの文脈と重要性',
    ko: '주제 맥락 및 중요성',
    zh: '主题背景与意义',
  },
};

function deepLabel(key: string, lang: Language): string {
  const map = DEEP_SECTION_LABELS[key];
  return (map?.[lang]) ?? (map?.en ?? key);
}

function docTypeLabel(doktyp: string, lang: Language): string {
  const map = DEEP_DOC_TYPE_LABELS[doktyp];
  return (map?.[lang]) ?? (map?.en ?? doktyp.toUpperCase());
}

/**
 * Generate topic-focused, comprehensive deep-inspection article content.
 * All sections are explicitly oriented around `topic`. Uses enriched full-text
 * content from each document and the 5W deep-analysis framework.
 */
function generateDeepInspectionContent(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
): string {
  const esc = escapeHtml;
  let html = '';

  // ── 1. Topic Context ───────────────────────────────────────────────────────
  const topicHeading = deepLabel('topicContext', lang);
  const topicCtxPara = buildTopicContextParagraph(docs, topic, lang);
  html += `\n<section class="deep-topic-context" aria-label="${esc(topicHeading)}">\n`;
  html += `  <h2>${esc(topicHeading)}</h2>\n`;
  html += `  ${topicCtxPara}\n`;
  html += `</section>\n`;

  // ── 2. Per-document deep intelligence entries ──────────────────────────────
  const docIntelHeading = deepLabel('documentIntelligence', lang);
  html += `\n<section class="document-intelligence-analysis" aria-label="${esc(docIntelHeading)}">\n`;
  html += `  <h2>${esc(docIntelHeading)}</h2>\n`;

  docs.forEach((doc, idx) => {
    html += buildDocumentEntry(doc, topic, lang, idx + 1, docs.length);
  });

  html += `</section>\n`;

  // ── 3. Cross-document 5W deep analysis ────────────────────────────────────
  const deepAnalysis = generateDeepAnalysisSection({
    documents: docs,
    lang,
    articleType: 'deep-inspection',
    whyContext: topic
      ? `This deep-inspection focuses exclusively on: ${topic}. All findings are evaluated in this context.`
      : undefined,
  });
  if (deepAnalysis) html += deepAnalysis;

  // ── 4. Strategic implications ──────────────────────────────────────────────
  const stratHeading = deepLabel('strategicImplications', lang);
  html += `\n<section class="strategic-implications" aria-label="${esc(stratHeading)}">\n`;
  html += `  <h2>${esc(stratHeading)}</h2>\n`;
  html += `  ${buildStrategicImplications(docs, topic, lang)}\n`;
  html += `</section>\n`;

  // ── 5. Key takeaways ───────────────────────────────────────────────────────
  const takeawayHeading = deepLabel('keyTakeaways', lang);
  html += `\n<section class="key-takeaways" aria-label="${esc(takeawayHeading)}">\n`;
  html += `  <h2>${esc(takeawayHeading)}</h2>\n`;
  html += buildKeyTakeaways(docs, topic, lang);
  html += `</section>\n`;

  return html;
}

/** Build the topic context introductory paragraph. */
function buildTopicContextParagraph(docs: RawDocument[], topic: string | null, lang: Language): string {
  const esc = escapeHtml;
  const docCount = docs.length;
  const allDomains = new Set<string>();
  // When a focus topic is provided, suppress generic detected domains entirely — they can
  // include tangential policy areas that bleed into "other areas" beyond the stated focus.
  // The topic itself IS the scope; detected domains would only add noise.
  if (!topic) {
    docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
  }
  const domainList = [...allDomains].slice(0, 5).map(d => esc(d)).join(', ');

  const templates: Partial<Record<Language, string>> = {
    en: `This deep-inspection analyses ${docCount} targeted parliamentary document${docCount !== 1 ? 's' : ''}${topic ? ` with an exclusive focus on <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Policy domains covered: ${domainList}.` : ''} Each document has been individually reviewed for relevance, legislative significance, and strategic implications — all findings are evaluated through the lens of the stated focus.`,
    sv: `Denna djupanalys granskar ${docCount} riktade riksdagsdokument${topic ? ` med exklusivt fokus på <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Policyområden: ${domainList}.` : ''} Varje dokument har granskats individuellt avseende relevans, lagstiftningssignifikans och strategiska implikationer — alla resultat utvärderas genom det angivna fokuset.`,
    de: `Diese Tiefenanalyse untersucht ${docCount} gezielte Parlamentsdokument${docCount !== 1 ? 'e' : ''}${topic ? ` mit ausschließlichem Fokus auf <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Politikbereiche: ${domainList}.` : ''} Jedes Dokument wurde einzeln auf Relevanz, gesetzgeberische Bedeutung und strategische Implikationen geprüft.`,
    fr: `Cette analyse approfondie examine ${docCount} document${docCount !== 1 ? 's' : ''} parlementaire${docCount !== 1 ? 's' : ''} ciblé${docCount !== 1 ? 's' : ''}${topic ? ` avec un focus exclusif sur <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Domaines politiques couverts: ${domainList}.` : ''} Chaque document a été examiné individuellement.`,
    es: `Esta inspección profunda analiza ${docCount} documento${docCount !== 1 ? 's' : ''} parlamentario${docCount !== 1 ? 's' : ''} específico${docCount !== 1 ? 's' : ''}${topic ? ` con enfoque exclusivo en <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Áreas de política cubiertos: ${domainList}.` : ''}`,
    da: `Denne dybdeanalyse undersøger ${docCount} målrettede parlamentariske dokument${docCount !== 1 ? 'er' : ''}${topic ? ` med eksklusivt fokus på <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Politikområder: ${domainList}.` : ''}`,
    no: `Denne dybdeanalysen undersøker ${docCount} målrettede parlamentariske dokument${docCount !== 1 ? 'er' : ''}${topic ? ` med eksklusivt fokus på <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Politikkområder: ${domainList}.` : ''}`,
    fi: `Tämä syväanalyysi tutkii ${docCount} kohdennettua parlamentaarista asiakirjaa${topic ? `, joissa on yksinomainen fokus aiheeseen <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Politiikka-alueet: ${domainList}.` : ''}`,
    nl: `Deze diepteanalyse bestudeert ${docCount} gerichte parlementaire document${docCount !== 1 ? 'en' : ''}${topic ? ` met exclusieve focus op <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `Beleidsdomeinen: ${domainList}.` : ''}`,
    ar: `يحلل هذا الفحص المعمق ${docCount} وثيقة برلمانية مستهدفة${topic ? ` مع التركيز الحصري على <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `مجالات السياسة المشمولة: ${domainList}.` : ''}`,
    he: `ניתוח מעמיק זה בוחן ${docCount} מסמכים פרלמנטריים ממוקדים${topic ? ` עם מיקוד בלעדי על <strong>${esc(topic)}</strong>` : ''}. ${domainList ? `תחומי מדיניות: ${domainList}.` : ''}`,
    ja: `この詳細分析は${docCount}件のターゲット議会文書を調査します${topic ? `、<strong>${esc(topic)}</strong>に専ら焦点を当てています` : ''}。${domainList ? `政策分野: ${domainList}。` : ''}`,
    ko: `이 심층 분석은 ${docCount}건의 대상 의회 문서를 분석합니다${topic ? `, <strong>${esc(topic)}</strong>에 전적으로 집중합니다` : ''}. ${domainList ? `정책 분야: ${domainList}.` : ''}`,
    zh: `本次深度分析对${docCount}份目标议会文件进行分析${topic ? `，专注于<strong>${esc(topic)}</strong>` : ''}。${domainList ? `涵盖政策领域：${domainList}。` : ''}`,
  };
  return `<p>${templates[lang] ?? templates.en}</p>`;
}

/** Build a comprehensive HTML entry for a single document — topic-focused. */
function buildDocumentEntry(
  doc: RawDocument,
  topic: string | null,
  lang: Language,
  index: number,
  total: number,
): string {
  const esc = escapeHtml;
  const title = doc.titel || doc.title || doc.dokumentnamn || doc.dok_id || '';
  const doktyp = doc.doktyp || doc.documentType || '';
  const date = doc.datum ? esc(doc.datum) : '';
  const organ = doc.organ || doc.committee || '';
  const typeLabel = doktyp ? docTypeLabel(doktyp, lang) : '';
  const domains = detectPolicyDomains(doc, lang);

  let entry = `\n  <article class="document-entry" data-index="${index}">\n`;
  entry += `    <h3>${esc(title)}</h3>\n`;

  // Document metadata line
  const metaParts: string[] = [];
  if (typeLabel) metaParts.push(`<span class="doc-type">${esc(typeLabel)}</span>`);
  if (doc.dok_id) metaParts.push(`<code>${esc(doc.dok_id)}</code>`);
  if (date) metaParts.push(`<time datetime="${date}">${date}</time>`);
  if (organ) metaParts.push(`<span class="doc-organ">${esc(organ)}</span>`);
  if (domains.length > 0 && !topic) metaParts.push(`<em>${domains.map(d => esc(d)).join(', ')}</em>`);
  if (metaParts.length > 0) {
    entry += `    <p class="doc-meta">${metaParts.join(' · ')}</p>\n`;
  }

  // Topic relevance note when topic is provided
  if (topic) {
    const topicRelevanceTemplates: Partial<Record<Language, string>> = {
      en: `Relevance to <strong>${esc(topic)}</strong>:`,
      sv: `Relevans för <strong>${esc(topic)}</strong>:`,
      de: `Relevanz für <strong>${esc(topic)}</strong>:`,
      fr: `Pertinence pour <strong>${esc(topic)}</strong>:`,
      es: `Relevancia para <strong>${esc(topic)}</strong>:`,
      da: `Relevans for <strong>${esc(topic)}</strong>:`,
      no: `Relevans for <strong>${esc(topic)}</strong>:`,
      fi: `Relevanssi aiheeseen <strong>${esc(topic)}</strong>:`,
      nl: `Relevantie voor <strong>${esc(topic)}</strong>:`,
      ar: `الصلة بـ <strong>${esc(topic)}</strong>:`,
      he: `הרלוונטיות ל<strong>${esc(topic)}</strong>:`,
      ja: `<strong>${esc(topic)}</strong>への関連性:`,
      ko: `<strong>${esc(topic)}</strong>에 대한 관련성:`,
      zh: `与<strong>${esc(topic)}</strong>的关联:`,
    };
    entry += `    <p class="topic-relevance"><strong>${topicRelevanceTemplates[lang] ?? topicRelevanceTemplates.en}</strong></p>\n`;
  }

  // Deep policy analysis (uses full text if enriched, otherwise significance)
  // Pass 600-char limit — deep inspection requires substantive per-document analysis.
  const deepAnalysis = generateDeepPolicyAnalysis(doc, lang, doktyp || undefined, 600);
  if (deepAnalysis) {
    entry += `    <div class="doc-analysis">${deepAnalysis}</div>\n`;
  }

  // Summary/notis when no full text but summary is available
  const summary = doc.summary || doc.notis || '';
  if (summary && !doc.contentFetched) {
    entry += `    <blockquote class="doc-summary">${esc(summary)}</blockquote>\n`;
  }

  if (index < total) {
    entry += `    <hr class="doc-separator">\n`;
  }

  entry += `  </article>\n`;
  return entry;
}

/** Build strategic implications paragraph tied to the topic and document patterns. */
function buildStrategicImplications(docs: RawDocument[], topic: string | null, lang: Language): string {
  const esc = escapeHtml;
  const propCount = docs.filter(d => (d.doktyp || d.documentType) === 'prop').length;
  const betCount = docs.filter(d => (d.doktyp || d.documentType) === 'bet').length;
  const motCount = docs.filter(d => (d.doktyp || d.documentType) === 'mot').length;
  const enrichedCount = docs.filter(d => d.contentFetched).length;

  const templates: Partial<Record<Language, string>> = {
    en: `Based on analysis of ${docs.length} parliamentary documents (${enrichedCount} enriched with full text)${topic ? ` specifically addressing <strong>${esc(topic)}</strong>` : ''}: The legislative pipeline shows ${propCount} government proposition${propCount !== 1 ? 's' : ''}, ${betCount} committee report${betCount !== 1 ? 's' : ''}, and ${motCount} opposition motion${motCount !== 1 ? 's' : ''}. This distribution signals ${propCount > betCount ? 'active government agenda-setting' : betCount > propCount ? 'strong parliamentary scrutiny' : 'balanced legislative activity'} in this policy area. Stakeholders should monitor committee deliberations and chamber voting patterns as the most reliable indicators of policy trajectory.`,
    sv: `Baserat på analys av ${docs.length} riksdagsdokument (${enrichedCount} berikade med fulltext)${topic ? ` med specifik inriktning på <strong>${esc(topic)}</strong>` : ''}: Det lagstiftande flödet visar ${propCount} proposition${propCount !== 1 ? 'er' : ''}, ${betCount} betänkande${betCount !== 1 ? 'n' : ''} och ${motCount} motion${motCount !== 1 ? 'er' : ''}. Intressenter bör följa utskottens överläggningar och kammarens voteringsmönster.`,
    de: `Basierend auf der Analyse von ${docs.length} parlamentarischen Dokumenten (${enrichedCount} mit vollständigem Text angereichert)${topic ? ` speziell zu <strong>${esc(topic)}</strong>` : ''}: Der Gesetzgebungsprozess zeigt ${propCount} Regierungsvorlage${propCount !== 1 ? 'n' : ''}, ${betCount} Ausschussbericht${betCount !== 1 ? 'e' : ''} und ${motCount} Oppositionsantrag${motCount !== 1 ? 'e' : ''}.`,
    fr: `Basé sur l'analyse de ${docs.length} documents parlementaires (${enrichedCount} enrichis avec le texte complet)${topic ? ` abordant spécifiquement <strong>${esc(topic)}</strong>` : ''}: Le pipeline législatif montre ${propCount} proposition${propCount !== 1 ? 's' : ''} gouvernementale${propCount !== 1 ? 's' : ''}, ${betCount} rapport${betCount !== 1 ? 's' : ''} de commission et ${motCount} motion${motCount !== 1 ? 's' : ''} d'opposition.`,
    es: `Basado en el análisis de ${docs.length} documentos parlamentarios (${enrichedCount} enriquecidos con texto completo)${topic ? ` que abordan específicamente <strong>${esc(topic)}</strong>` : ''}: La actividad legislativa muestra ${propCount} proposición${propCount !== 1 ? 'es' : ''} gubernamental${propCount !== 1 ? 'es' : ''}, ${betCount} informe${betCount !== 1 ? 's' : ''} de comité y ${motCount} moción${motCount !== 1 ? 'es' : ''} de oposición.`,
  };
  const text = templates[lang] ?? templates.en ?? '';
  return `<p>${text}</p>`;
}

/** Build a bulleted key-takeaways list derived from document patterns and topic. */
function buildKeyTakeaways(docs: RawDocument[], topic: string | null, lang: Language): string {
  const esc = escapeHtml;
  const items: string[] = [];

  // Derive takeaways from document patterns
  const propDocs = docs.filter(d => (d.doktyp || d.documentType) === 'prop');
  const betDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'bet');
  const motDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'mot');
  const euDocs   = docs.filter(d => (d.doktyp || d.documentType) === 'fpm');
  const sfsDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'sfs');

  const topicPhrase = topic ? ` (${esc(topic)})` : '';

  if (propDocs.length > 0) {
    const titles = propDocs.slice(0, 2).map(d => esc(d.titel || d.title || d.dok_id || '')).join('; ');
    items.push(lang === 'sv'
      ? `<strong>${propDocs.length} proposition${propDocs.length !== 1 ? 'er' : ''}</strong>${topicPhrase} aktiv lagstiftning: ${titles}`
      : `<strong>${propDocs.length} government proposition${propDocs.length !== 1 ? 's' : ''}</strong>${topicPhrase} in active legislation: ${titles}`);
  }
  if (sfsDocs.length > 0) {
    items.push(lang === 'sv'
      ? `<strong>${sfsDocs.length} antagen lag/förordning</strong>${topicPhrase} — rättsligt ramverk etablerat`
      : `<strong>${sfsDocs.length} enacted law/statute</strong>${topicPhrase} — legal framework established`);
  }
  if (betDocs.length > 0) {
    items.push(lang === 'sv'
      ? `<strong>${betDocs.length} utskottsbetänkande${betDocs.length !== 1 ? 'n' : ''}</strong> visar parlamentarisk granskning av${topicPhrase}`
      : `<strong>${betDocs.length} committee report${betDocs.length !== 1 ? 's' : ''}</strong> demonstrate parliamentary scrutiny of${topicPhrase}`);
  }
  if (motDocs.length > 0) {
    items.push(lang === 'sv'
      ? `<strong>${motDocs.length} oppositionsmotion${motDocs.length !== 1 ? 'er' : ''}</strong> utmanar${topicPhrase} inriktning`
      : `<strong>${motDocs.length} opposition motion${motDocs.length !== 1 ? 's' : ''}</strong> challenge${motDocs.length === 1 ? 's' : ''} the${topicPhrase} direction`);
  }
  if (euDocs.length > 0) {
    items.push(lang === 'sv'
      ? `<strong>${euDocs.length} EU-faktapromemoria</strong> visar europeisk dimension av${topicPhrase}`
      : `<strong>${euDocs.length} EU position paper${euDocs.length !== 1 ? 's' : ''}</strong> reveal the European dimension of${topicPhrase}`);
  }

  const enriched = docs.filter(d => d.contentFetched).length;
  if (enriched > 0) {
    items.push(lang === 'sv'
      ? `<strong>${enriched} av ${docs.length} dokument</strong> berikade med fulltext för djupanalys`
      : `<strong>${enriched} of ${docs.length} documents</strong> enriched with full text for deep analysis`);
  }

  if (items.length === 0) {
    items.push(lang === 'sv'
      ? `Djupanalys genomförd av ${docs.length} dokument${topicPhrase}`
      : `Deep analysis conducted on ${docs.length} document${docs.length !== 1 ? 's' : ''}${topicPhrase}`);
  }

  return `<ul class="key-takeaways-list">\n${items.map(i => `  <li>${i}</li>`).join('\n')}\n</ul>\n`;
}

// ---------------------------------------------------------------------------
// Deep-Inspection TemplateSection builders (SWOT + Dashboard)
// ---------------------------------------------------------------------------

/** Localised default SWOT entry text for when a stakeholder's quadrant has no documents. */
const SWOT_DEFAULTS: Readonly<Record<string, Partial<Record<Language, [string, string]>>>> = {
  // [withTopic, withoutTopic]
  govStrength:        { en: ['Policy framework on %t', 'Policy legislation in place'], sv: ['Policyramverk för %t', 'Befintlig policylagstiftning'], de: ['Politikrahmen zu %t', 'Politikgesetzgebung vorhanden'], fr: ['Cadre politique sur %t', 'Législation politique en place'], es: ['Marco de política sobre %t', 'Legislación de política vigente'] },
  govWeakness:        { en: ['Implementation timeline and resource prioritisation', 'Implementation timeline and resource prioritisation'], sv: ['Genomförandetidsplan och resursprioritering', 'Genomförandetidsplan och resursprioritering'], de: ['Umsetzungszeitplan und Ressourcenpriorisierung', 'Umsetzungszeitplan und Ressourcenpriorisierung'] },
  govOpportunity:     { en: ['EU and international cooperation on %t', 'EU framework alignment'], sv: ['EU och internationellt samarbete om %t', 'EU-ramverksanpassning'], de: ['EU- und internationale Kooperation zu %t', 'EU-Rahmenausrichtung'] },
  govThreat:          { en: ['Evolving threats and execution risks in %t', 'Evolving threat landscape'], sv: ['Föränderliga hot och genomföranderisker inom %t', 'Föränderligt hotlandskap'], de: ['Sich entwickelnde Bedrohungen in %t', 'Sich entwickelnde Bedrohungslandschaft'] },
  oppStrength:        { en: ['Parliamentary oversight and accountability function', 'Parliamentary oversight and accountability function'], sv: ['Parlamentarisk tillsyn och ansvarsfunktion', 'Parlamentarisk tillsyn och ansvarsfunktion'], de: ['Parlamentarische Aufsicht und Rechenschaftsfunktion', 'Parlamentarische Aufsicht und Rechenschaftsfunktion'] },
  oppWeakness:        { en: ['Limited access to classified data on %t', 'Limited classified information access'], sv: ['Begränsad tillgång till sekretessbelagd data om %t', 'Begränsad tillgång till sekretessbelagd information'], de: ['Begrenzter Zugang zu klassifizierten Daten zu %t', 'Begrenzter Zugang zu klassifizierten Informationen'] },
  oppOpportunity:     { en: ['Cross-party consensus building on %t', 'Cross-party consensus building'], sv: ['Konsensusbyggande över partigränser om %t', 'Konsensusbyggande över partigränser'], de: ['Parteiübergreifender Konsensaufbau zu %t', 'Parteiübergreifender Konsensaufbau'] },
  oppThreat:          { en: ['Government majority limiting amendment capacity', 'Government majority limiting amendment capacity'], sv: ['Regeringsmajoriteten begränsar ändringskapaciteten', 'Regeringsmajoriteten begränsar ändringskapaciteten'], de: ['Regierungsmehrheit schränkt Änderungskapazität ein', 'Regierungsmehrheit schränkt Änderungskapazität ein'] },
  privateStrength:    { en: ['Technical expertise and operational capacity in %t', 'Technical expertise and operational capacity'], sv: ['Teknisk expertis och operativ kapacitet inom %t', 'Teknisk expertis och operativ kapacitet'], de: ['Technisches Fachwissen und operative Kapazität in %t', 'Technisches Fachwissen und operative Kapazität'] },
  privateWeakness1:   { en: ['Compliance costs and regulatory burden', 'Compliance costs and regulatory burden'], sv: ['Efterlevnadskostnader och regulatorisk börda', 'Efterlevnadskostnader och regulatorisk börda'], de: ['Compliance-Kosten und regulatorische Belastung', 'Compliance-Kosten und regulatorische Belastung'] },
  privateWeakness2:   { en: ['Resource allocation for emerging requirements', 'Resource allocation for emerging requirements'], sv: ['Resursallokering för nya krav', 'Resursallokering för nya krav'], de: ['Ressourcenzuweisung für neue Anforderungen', 'Ressourcenzuweisung für neue Anforderungen'] },
  privateOpportunity: { en: ['Investment and innovation driven by %t policy', 'Policy-driven investment and innovation'], sv: ['Investering och innovation driven av %t-politik', 'Policydriven investering och innovation'], de: ['Investitionen und Innovation durch %t-Politik', 'Politikgetriebene Investitionen und Innovation'] },
  privateThreat1:     { en: ['Rapid evolution of threats within %t', 'Rapid threat evolution'], sv: ['Snabb hotutveckling inom %t', 'Snabb hotutveckling'], de: ['Schnelle Entwicklung der Bedrohungen in %t', 'Schnelle Bedrohungsentwicklung'] },
  privateThreat2:     { en: ['Short implementation timelines for new requirements', 'Short implementation timelines for new requirements'], sv: ['Korta implementeringstidsplaner för nya krav', 'Korta implementeringstidsplaner för nya krav'], de: ['Kurze Umsetzungsfristen für neue Anforderungen', 'Kurze Umsetzungsfristen für neue Anforderungen'] },
};

/** Return a localised SWOT fallback string, substituting %t for the topic when present. */
function swotDefault(key: string, topic: string | null, lang: Language): string {
  const variants = SWOT_DEFAULTS[key];
  const pair = variants?.[lang] ?? variants?.en ?? [key, key];
  const [withTopic, withoutTopic] = pair;
  return topic ? withTopic.replace('%t', topic) : withoutTopic;
}

/**
 * Build SWOT and dashboard TemplateSections for a deep-inspection article.
 * Derives SWOT entries from actual document metadata and titles — every entry
 * is explicitly tied to the focus topic. Returns TemplateSection[] ready for
 * generateArticleHTML.sections.
 */
function buildDeepInspectionSections(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
): TemplateSection[] {
  if (docs.length === 0) return [];

  const titleOf = (d: RawDocument): string =>
    (d.titel || d.title || d.dokumentnamn || d.dok_id || '').slice(0, 80);
  const toEntry = (d: RawDocument, impact: 'high' | 'medium' | 'low' = 'medium'): SwotEntry => ({
    text: titleOf(d), impact,
  });

  // Classify by document type
  const propDocs = docs.filter(d => (d.doktyp || d.documentType) === 'prop');
  const betDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'bet');
  const motDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'mot');
  const skrDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'skr');
  const sfsDocs  = docs.filter(d =>
    (d.doktyp || d.documentType) === 'sfs' || (d.dokumentnamn || '').startsWith('SFS'));
  const euDocs   = docs.filter(d => (d.doktyp || d.documentType) === 'fpm');
  const otherDocs = docs.filter(d =>
    !['prop','bet','mot','skr','sfs','fpm'].includes((d.doktyp || d.documentType) || ''));

  // ── Government / Policy Administration ────────────────────────────────────
  const govStrengths: SwotEntry[] = [
    ...propDocs.slice(0, 3).map(d => toEntry(d, 'high')),
    ...sfsDocs.slice(0, 2).map(d => toEntry(d, 'high')),
    ...skrDocs.slice(0, 1).map(d => toEntry(d, 'medium')),
    ...otherDocs.filter(d => (d.doktyp || d.documentType) === 'pressm').slice(0, 1).map(d => toEntry(d, 'high')),
  ];
  const govWeaknesses: SwotEntry[] = [
    ...betDocs.slice(0, 2).map(d => toEntry(d, 'medium')),
  ];
  const govOpportunities: SwotEntry[] = [
    ...euDocs.slice(0, 2).map(d => toEntry(d, 'high')),
    ...skrDocs.slice(1, 2).map(d => toEntry(d, 'medium')),
  ];
  const govThreats: SwotEntry[] = [
    ...motDocs.slice(0, 2).map(d => toEntry(d, 'medium')),
  ];

  if (govStrengths.length === 0) govStrengths.push({ text: swotDefault('govStrength', topic, lang), impact: 'medium' });
  if (govWeaknesses.length === 0) govWeaknesses.push({ text: swotDefault('govWeakness', topic, lang), impact: 'medium' });
  if (govOpportunities.length === 0) govOpportunities.push({ text: swotDefault('govOpportunity', topic, lang), impact: 'high' });
  if (govThreats.length === 0) govThreats.push({ text: swotDefault('govThreat', topic, lang), impact: 'medium' });

  // ── Parliament / Opposition ────────────────────────────────────────────────
  const oppStrengths: SwotEntry[] = [
    ...betDocs.slice(0, 3).map(d => toEntry(d, 'high')),
    ...motDocs.slice(0, 2).map(d => toEntry(d, 'medium')),
  ];
  const oppWeaknesses: SwotEntry[] = [];
  const oppOpportunities: SwotEntry[] = [];
  const oppThreats: SwotEntry[] = [
    ...propDocs.slice(0, 1).map(d => toEntry(d, 'medium')),
  ];

  if (oppStrengths.length === 0) oppStrengths.push({ text: swotDefault('oppStrength', topic, lang), impact: 'high' });
  if (oppWeaknesses.length === 0) oppWeaknesses.push({ text: swotDefault('oppWeakness', topic, lang), impact: 'medium' });
  if (oppOpportunities.length === 0) oppOpportunities.push({ text: swotDefault('oppOpportunity', topic, lang), impact: 'high' });
  if (oppThreats.length === 0) oppThreats.push({ text: swotDefault('oppThreat', topic, lang), impact: 'medium' });

  // ── Private Sector / Civil Society ────────────────────────────────────────
  const privateStrengths: SwotEntry[] = [
    { text: swotDefault('privateStrength', topic, lang), impact: 'high' },
    ...sfsDocs.slice(0, 1).map(d => toEntry(d, 'medium')),
  ];
  const privateWeaknesses: SwotEntry[] = [
    { text: swotDefault('privateWeakness1', topic, lang), impact: 'medium' },
    { text: swotDefault('privateWeakness2', topic, lang), impact: 'medium' },
  ];
  const privateOpportunities: SwotEntry[] = [
    { text: swotDefault('privateOpportunity', topic, lang), impact: 'high' },
    ...euDocs.slice(0, 1).map(d => toEntry(d, 'high')),
  ];
  const privateThreats: SwotEntry[] = [
    { text: swotDefault('privateThreat1', topic, lang), impact: 'high' },
    { text: swotDefault('privateThreat2', topic, lang), impact: 'medium' },
  ];

  // ── Localised stakeholder names ────────────────────────────────────────────
  const govNames: Partial<Record<Language, string>> = {
    en: 'Government / Policy Administration', sv: 'Regering / Policyförvaltning',
    da: 'Regering / Politisk forvaltning', no: 'Regjering / Politisk forvaltning',
    fi: 'Hallitus / Poliittinen hallinto', de: 'Regierung / Politikverwaltung',
    fr: 'Gouvernement / Administration', es: 'Gobierno / Administración pública',
    nl: 'Regering / Beleidsadministratie', ar: 'الحكومة / الإدارة السياسية',
    he: 'ממשלה / מינהל מדיניות', ja: '政府 / 政策行政', ko: '정부 / 정책 행정', zh: '政府 / 政策管理',
  };
  const oppNames: Partial<Record<Language, string>> = {
    en: 'Parliament / Opposition', sv: 'Riksdag / Opposition',
    da: 'Folketing / Opposition', no: 'Storting / Opposisjon',
    fi: 'Eduskunta / Oppositio', de: 'Parlament / Opposition',
    fr: 'Parlement / Opposition', es: 'Parlamento / Oposición',
    nl: 'Parlement / Oppositie', ar: 'البرلمان / المعارضة',
    he: 'פרלמנט / אופוזיציה', ja: '議会 / 野党', ko: '의회 / 야당', zh: '议会 / 反对派',
  };
  const privateNames: Partial<Record<Language, string>> = {
    en: 'Private Sector / Civil Society', sv: 'Privat sektor / Civilsamhälle',
    da: 'Privat sektor / Civilsamfund', no: 'Privat sektor / Sivilsamfunn',
    fi: 'Yksityissektori / Kansalaisyhteiskunta', de: 'Privatsektor / Zivilgesellschaft',
    fr: 'Secteur privé / Société civile', es: 'Sector privado / Sociedad civil',
    nl: 'Privésector / Maatschappelijk middenveld', ar: 'القطاع الخاص / المجتمع المدني',
    he: 'המגזר הפרטי / החברה האזרחית', ja: '民間セクター / 市民社会', ko: '민간 부문 / 시민 사회', zh: '私营部门 / 民间社会',
  };

  const dataSourceBranchLabels: Partial<Record<Language, string>> = {
    en: 'Data Sources', sv: 'Datakällor', da: 'Datakilder', no: 'Datakilder',
    fi: 'Tietolähteet', de: 'Datenquellen', fr: 'Sources de données', es: 'Fuentes de datos',
    nl: 'Gegevensbronnen', ar: 'مصادر البيانات', he: 'מקורות נתונים',
    ja: 'データソース', ko: '데이터 출처', zh: '数据来源',
  };
  const dataSourceItems: Partial<Record<Language, string[]>> = {
    en: ['Riksdag MCP (laws, motions, propositions)', 'World Bank (economic indicators)', 'SCB Statistics Sweden'],
    sv: ['Riksdagens MCP (lagar, motioner, propositioner)', 'Världsbanken (ekonomiska indikatorer)', 'SCB Statistikmyndigheten'],
    da: ['Riksdag MCP (love, motioner, forslag)', 'Verdensbanken (økonomiske indikatorer)', 'SCB Statistikmyndigheten'],
    no: ['Riksdag MCP (lover, motioner, proposisjoner)', 'Verdensbanken (økonomiske indikatorer)', 'SCB Statistikmyndigheten'],
    fi: ['Riksdagin MCP (lait, kirjelmät, esitykset)', 'Maailmanpankki (taloudelliset indikaattorit)', 'SCB Tilastoviranomainen'],
    de: ['Riksdag MCP (Gesetze, Anträge, Vorlagen)', 'Weltbank (Wirtschaftsindikatoren)', 'SCB Statistikmyndigheten'],
    fr: ['Riksdag MCP (lois, motions, propositions)', 'Banque mondiale (indicateurs économiques)', 'SCB Statistikmyndigheten'],
    es: ['Riksdag MCP (leyes, mociones, proposiciones)', 'Banco Mundial (indicadores económicos)', 'SCB Statistikmyndigheten'],
    nl: ['Riksdag MCP (wetten, moties, voorstellen)', 'Wereldbank (economische indicatoren)', 'SCB Statistikmyndigheten'],
    ar: ['ريكسداغ MCP (قوانين، اقتراحات)', 'البنك الدولي (مؤشرات اقتصادية)', 'SCB إحصاء السويد'],
    he: ['ריקסדאג MCP (חוקים, הצעות)', 'הבנק העולמי (אינדיקטורים כלכליים)', 'SCB הלשכה המרכזית לסטטיסטיקה'],
    ja: ['Riksdag MCP (法律・動議・提案)', '世界銀行（経済指標）', 'SCB スウェーデン統計局'],
    ko: ['Riksdag MCP (법률, 동의, 제안)', '세계은행 (경제 지표)', 'SCB 스웨덴 통계청'],
    zh: ['议会 MCP（法律、动议、提案）', '世界银行（经济指标）', 'SCB 瑞典统计局'],
  };

  const stakeholders: StakeholderSwot[] = [
    {
      name: govNames[lang] ?? govNames.en!,
      swot: { strengths: govStrengths, weaknesses: govWeaknesses, opportunities: govOpportunities, threats: govThreats },
    },
    {
      name: oppNames[lang] ?? oppNames.en!,
      swot: { strengths: oppStrengths, weaknesses: oppWeaknesses, opportunities: oppOpportunities, threats: oppThreats },
    },
    {
      name: privateNames[lang] ?? privateNames.en!,
      swot: { strengths: privateStrengths, weaknesses: privateWeaknesses, opportunities: privateOpportunities, threats: privateThreats },
    },
  ];

  const strategicContext = topic
    ? `Analysis exclusively focused on: ${topic} — ${docs.length} parliamentary documents examined`
    : `Multi-stakeholder analysis of ${docs.length} parliamentary documents`;
  const swotSection = generateStakeholderSwotSection({ stakeholders, lang, strategicContext });

  // ── Dashboard: document type distribution ─────────────────────────────────
  const typeCounts: Record<string, number> = {};
  docs.forEach(d => {
    const t = d.doktyp || d.documentType || 'other';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const chartLabels = Object.keys(typeCounts);
  const chartValues = chartLabels.map(t => typeCounts[t]);

  const dashboardSection = generateDashboardSection({
    data: {
      title: topic
        ? `Document Intelligence Dashboard — ${topic}`
        : 'Document Intelligence Dashboard',
      summary: `${docs.length} parliamentary documents analysed`,
      charts: [{
        id: 'deep-inspection-doc-types',
        type: 'bar',
        title: 'Documents by Type',
        labels: chartLabels,
        datasets: [{
          label: 'Documents',
          data: chartValues,
          backgroundColor: chartLabels.map((_, i) => DEEP_CHART_PALETTE[i % DEEP_CHART_PALETTE.length]),
        }],
      }],
    },
    lang,
  });

  // ── Mindmap: topic → detected policy domains → document types ────────────
  const allDetectedDomains = new Set<string>();
  docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDetectedDomains.add(dom)));
  const detectedDomainList = [...allDetectedDomains].slice(0, 8);

  const mindmapBranches: MindmapBranch[] = [];

  // Document type branch
  if (chartLabels.length > 0) {
    mindmapBranches.push({
      label: 'Document Types',
      color: 'cyan',
      icon: '📄',
      items: chartLabels.map((t, i) => `${t} (${chartValues[i] ?? 0})`),
    });
  }

  // Policy domain branch
  if (detectedDomainList.length > 0) {
    mindmapBranches.push({
      label: 'Policy Domains',
      color: 'green',
      icon: '🏛️',
      items: detectedDomainList,
    });
  }

  // Stakeholder branch
  mindmapBranches.push({
    label: 'Stakeholders',
    color: 'yellow',
    icon: '👥',
    items: [
      govNames[lang] ?? govNames.en!,
      oppNames[lang] ?? oppNames.en!,
      privateNames[lang] ?? privateNames.en!,
    ],
  });

  // Data context branch
  mindmapBranches.push({
    label: dataSourceBranchLabels[lang] ?? dataSourceBranchLabels.en!,
    color: 'purple',
    icon: '📊',
    items: dataSourceItems[lang] ?? dataSourceItems.en!,
  });

  const mindmapSection = generateMindmapSection({
    topic: topic || 'Parliamentary Analysis',
    branches: mindmapBranches,
    lang,
    summary: topic
      ? `Conceptual map for deep inspection: ${topic}`
      : `Conceptual map for ${docs.length} parliamentary documents`,
  });

  // ── Sankey: party/doc-type flow → legislative outcome ─────────────────────
  const sankeyNodes: SankeyNode[] = [
    { id: 'gov', label: govNames[lang]    ?? 'Government', color: 'cyan' },
    { id: 'opp', label: oppNames[lang]    ?? 'Parliament', color: 'magenta' },
    { id: 'pvt', label: privateNames[lang] ?? 'Civil Society', color: 'purple' },
  ];

  // Add document type nodes and target outcome nodes
  const sankeyFlows: SankeyFlow[] = [];
  if (propDocs.length > 0) {
    sankeyNodes.push({ id: 'prop', label: 'Propositions', color: 'orange' });
    sankeyFlows.push({ source: 'gov', target: 'prop', value: propDocs.length, label: `${propDocs.length}` });
  }
  if (betDocs.length > 0) {
    sankeyNodes.push({ id: 'bet', label: 'Committee Reports', color: 'blue' });
    sankeyFlows.push({ source: 'opp', target: 'bet', value: betDocs.length, label: `${betDocs.length}` });
  }
  if (motDocs.length > 0) {
    sankeyNodes.push({ id: 'mot', label: 'Motions', color: 'yellow' });
    sankeyFlows.push({ source: 'opp', target: 'mot', value: motDocs.length, label: `${motDocs.length}` });
  }
  if (sfsDocs.length > 0) {
    sankeyNodes.push({ id: 'sfs', label: 'Laws (SFS)', color: 'green' });
    sankeyFlows.push({ source: 'gov', target: 'sfs', value: sfsDocs.length, label: `${sfsDocs.length}` });
  }
  if (euDocs.length > 0) {
    sankeyNodes.push({ id: 'eu', label: 'EU Positions', color: 'blue' });
    sankeyFlows.push({ source: 'pvt', target: 'eu', value: euDocs.length, label: `${euDocs.length}` });
  }
  if (otherDocs.length > 0) {
    sankeyNodes.push({ id: 'other', label: 'Other Docs', color: 'purple' });
    sankeyFlows.push({ source: 'pvt', target: 'other', value: otherDocs.length, label: `${otherDocs.length}` });
  }

  // Only include Sankey when there is more than one non-trivial flow (otherwise uninformative)
  const sankeySection: TemplateSection | null = sankeyFlows.length >= 2
    ? generateSankeySection({
        nodes: sankeyNodes,
        flows: sankeyFlows,
        lang,
        title: topic ? `Legislative Flow — ${topic}` : 'Legislative Flow',
        summary: `Flow of ${docs.length} parliamentary documents from initiating actors to document types`,
      })
    : null;

  // ── World Bank / Economic Dashboard ──────────────────────────────────────
  const economicSection = detectedDomainList.length > 0
    ? generateEconomicDashboardSection({ policyDomains: detectedDomainList, lang })
    : null;

  const additionalSections: TemplateSection[] = [
    ...(sankeySection ? [sankeySection] : []),
    ...(economicSection ? [economicSection] : []),
    mindmapSection,
  ];

  return [dashboardSection, swotSection, ...additionalSections];
}

/**
 * Generate Deep-Inspection article targeting specific documents or policy topics.
 * Uses documentIds, documentUrls, and focusTopic from CLI config to fetch
 * targeted Riksdag documents and generate in-depth analysis articles.
 */
export async function generateDeepInspection(): Promise<GenerationResult> {
  console.log('🔍 Generating Deep-Inspection article...');

  if (documentIds.length === 0 && documentUrls.length === 0 && !focusTopic) {
    console.log('  ⚠️ No targeting parameters provided (--document-ids, --document-urls, or --focus-topic)');
    console.log('  ℹ️ Deep-inspection requires at least one targeting parameter — skipping');
    return { success: true, files: 0 };
  }

  console.log(`  📋 Document IDs: ${documentIds.length > 0 ? documentIds.join(', ') : '(none)'}`);
  console.log(`  🔗 Document URLs: ${documentUrls.length > 0 ? documentUrls.join(', ') : '(none)'}`);
  console.log(`  🎯 Focus topic: ${focusTopic || '(none)'}`);

  try {
    const client: MCPClient = await getSharedClient();

    // Resolve document IDs from URLs and collect government URLs separately
    const urlDerivedIds: string[] = [];
    const governmentUrls: string[] = [];
    for (const url of documentUrls) {
      const docId = extractDocIdFromUrl(url);
      if (docId) {
        console.log(`  🔗 Resolved URL → dok_id: ${docId}`);
        urlDerivedIds.push(docId);
      } else if (isGovernmentUrl(url)) {
        console.log(`  🏛️ Government URL detected (will fetch via g0v): ${url}`);
        governmentUrls.push(url);
      } else {
        console.warn(`  ⚠️ Could not extract dok_id from URL: ${url}`);
      }
    }

    // Combine explicit IDs + URL-derived IDs (deduplicated)
    const allDocIds: string[] = [...new Set([...documentIds, ...urlDerivedIds])];

    // Fetch targeted documents by ID
    const targetDocs: RawDocument[] = [];
    for (const docId of allDocIds) {
      try {
        console.log(`  🔄 Fetching document ${docId}...`);
        const doc = await client.request('get_dokument', { dok_id: docId });
        if (doc) targetDocs.push(doc as RawDocument);
      } catch (err: unknown) {
        console.warn(`  ⚠️ Could not fetch document ${docId}: ${(err as Error).message}`);
      }
    }

    // Fetch government document content for regeringen.se URLs via g0v
    for (const govUrl of governmentUrls) {
      try {
        console.log(`  🏛️ Fetching government document: ${govUrl}`);
        const content = await client.fetchGovernmentDocumentContent(govUrl);
        if (content) {
          // Extract a title from the URL path (last meaningful segment)
          const urlPath = new URL(govUrl).pathname;
          const segments = urlPath.split('/').filter(Boolean);
          const titleSlug = segments[segments.length - 1] ?? 'government-document';
          const titleFromSlug = titleSlug.replace(/-/g, ' ').replace(/^\d+\s*/, '');

          const govDoc: RawDocument = {
            doktyp: 'pressm',
            documentType: 'pressm',
            titel: titleFromSlug,
            title: titleFromSlug,
            url: govUrl,
            dok_id: `gov-${titleSlug.slice(0, 30)}`,
            fullText: content,
            fullContent: content,
            contentFetched: true,
            summary: content.slice(0, 500),
            datum: new Date().toISOString().split('T')[0],
          };
          targetDocs.push(govDoc);
          console.log(`  ✅ Government document fetched: ${titleFromSlug}`);
        } else {
          console.warn(`  ⚠️ No content returned for government URL: ${govUrl}`);
        }
      } catch (err: unknown) {
        console.warn(`  ⚠️ Failed to fetch government document ${govUrl}: ${(err as Error).message}`);
      }
    }

    // Fetch documents by focus topic if no IDs resolved
    if (targetDocs.length === 0 && focusTopic) {
      console.log(`  🔄 Searching documents for topic: ${focusTopic}`);
      const rawDocs = await client.searchDocuments({ titel: focusTopic, limit: 10 })
        .catch((e: unknown) => { if (requireMcp) throw e; return [] as RawDocument[]; });
      targetDocs.push(...(Array.isArray(rawDocs) ? rawDocs as RawDocument[] : []));
    }

    if (targetDocs.length === 0) {
      console.log('  ℹ️ No target documents found for deep inspection — skipping');
      return { success: true, files: 0 };
    }

    console.log(`  📊 Found ${targetDocs.length} target documents for deep inspection`);

    // Enrich documents with content
    console.log('  🔍 Enriching documents with detailed content...');
    const enriched = await client.enrichDocumentsWithContent(
      targetDocs as Parameters<MCPClient['enrichDocumentsWithContent']>[0], 3
    );
    const enrichedDocs = enriched as RawDocument[];
    const enrichedCount: number = (enrichedDocs as Array<Record<string, unknown>>).filter(d => d['contentFetched']).length;
    console.log(`  ✅ Enriched ${enrichedCount}/${enrichedDocs.length} documents with content`);

    const today: Date = new Date();

    const sanitizeSlugSegment = (value: string): string =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 40)
        .replace(/^-+|-+$/g, '');

    const focusSlug: string = focusTopic ? sanitizeSlugSegment(focusTopic) : '';

    let topicSlug: string;
    if (focusSlug) {
      topicSlug = focusSlug;
    } else {
      const primaryDocId: string =
        allDocIds[0]
        ?? enrichedDocs[0]?.dok_id
        ?? 'analysis';
      const fallbackSlug: string = sanitizeSlugSegment(primaryDocId);
      topicSlug = fallbackSlug || 'analysis';
    }

    const slug: string = `${formatDateForSlug(today)}-deep-inspection-${topicSlug}`;

    const sanitizedTopic: string | null = focusTopic ? sanitizePlainText(focusTopic) : null;
    const defaultTopicLabels: Record<Language, string> = {
      en: 'Policy Analysis',
      sv: 'Policyanalys',
      da: 'Politisk analyse',
      no: 'Politisk analyse',
      fi: 'Politiikka-analyysi',
      de: 'Politikanalyse',
      fr: 'Analyse politique',
      es: 'Análisis político',
      nl: 'Beleidsanalyse',
      ar: 'تحليل السياسات',
      he: 'ניתוח מדיניות',
      ja: '政策分析',
      ko: '정책 분석',
      zh: '政策分析',
    };
    const titles: Record<Language, TitleSet> = {
      en: { title: `Deep Inspection: ${sanitizedTopic || defaultTopicLabels.en}`, subtitle: `In-depth analysis of ${enrichedDocs.length} parliamentary documents` },
      sv: { title: `Djupanalys: ${sanitizedTopic || defaultTopicLabels.sv}`, subtitle: `Fördjupad analys av ${enrichedDocs.length} riksdagsdokument` },
      da: { title: `Dybdeanalyse: ${sanitizedTopic || defaultTopicLabels.da}`, subtitle: `Dybdegående analyse af ${enrichedDocs.length} parlamentariske dokumenter` },
      no: { title: `Dybdeanalyse: ${sanitizedTopic || defaultTopicLabels.no}`, subtitle: `Inngående analyse av ${enrichedDocs.length} parlamentariske dokumenter` },
      fi: { title: `Syväanalyysi: ${sanitizedTopic || defaultTopicLabels.fi}`, subtitle: `Syvällinen analyysi ${enrichedDocs.length} parlamentaarisesta asiakirjasta` },
      de: { title: `Tiefenanalyse: ${sanitizedTopic || defaultTopicLabels.de}`, subtitle: `Eingehende Analyse von ${enrichedDocs.length} parlamentarischen Dokumenten` },
      fr: { title: `Analyse approfondie: ${sanitizedTopic || defaultTopicLabels.fr}`, subtitle: `Analyse en profondeur de ${enrichedDocs.length} documents parlementaires` },
      es: { title: `Análisis en profundidad: ${sanitizedTopic || defaultTopicLabels.es}`, subtitle: `Análisis detallado de ${enrichedDocs.length} documentos parlamentarios` },
      nl: { title: `Diepteanalyse: ${sanitizedTopic || defaultTopicLabels.nl}`, subtitle: `Diepgaande analyse van ${enrichedDocs.length} parlementaire documenten` },
      ar: { title: `تحليل معمّق: ${sanitizedTopic || defaultTopicLabels.ar}`, subtitle: `تحليل متعمق لـ ${enrichedDocs.length} وثائق برلمانية` },
      he: { title: `ניתוח מעמיק: ${sanitizedTopic || defaultTopicLabels.he}`, subtitle: `ניתוח מעמיק של ${enrichedDocs.length} מסמכים פרלמנטריים` },
      ja: { title: `詳細分析：${sanitizedTopic || defaultTopicLabels.ja}`, subtitle: `${enrichedDocs.length}件の議会文書の詳細分析` },
      ko: { title: `심층 분석: ${sanitizedTopic || defaultTopicLabels.ko}`, subtitle: `${enrichedDocs.length}개 의회 문서 심층 분석` },
      zh: { title: `深度分析：${sanitizedTopic || defaultTopicLabels.zh}`, subtitle: `${enrichedDocs.length}份议会文件深度分析` },
    };

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      // Topic-focused deep-inspection content (NOT generic content)
      const content: string = generateDeepInspectionContent(enrichedDocs, sanitizedTopic, lang);

      // Metadata still derived from document data
      const contentData = { documents: enrichedDocs as Parameters<typeof generateArticleContent>[0]['documents'] };
      const watchPoints = extractWatchPoints(contentData, lang);
      const metadata = generateMetadata(contentData, 'deep-inspection', lang);
      const readTime: string = calculateReadTime(content);
      const sourceMethods = ['get_dokument', 'get_dokument_innehall', 'search_dokument'];
      if (governmentUrls.length > 0) sourceMethods.push('get_g0v_document_content');
      const sources: string[] = generateSources(sourceMethods);

      // SWOT + dashboard sections — topic-focused, document-derived
      const sections = buildDeepInspectionSections(enrichedDocs, sanitizedTopic, lang);

      const langTitles: TitleSet = titles[lang] || titles.en;

      const html: string = generateArticleHTML({
        slug: `${slug}-${lang}.html`,
        title: langTitles.title,
        subtitle: langTitles.subtitle,
        date: toISODate(today),
        type: 'analysis' as ArticleCategory,
        readTime,
        lang,
        content,
        watchPoints,
        sources,
        keywords: metadata.keywords,
        topics: metadata.topics,
        tags: metadata.tags,
        sections,
      });

      await writeSingleArticle(html, slug, lang, 'deep-inspection');
    }

    console.log('  ✅ Deep-Inspection article generated successfully in all requested languages');
    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Deep-Inspection:', (error as Error).message);
    stats.errors++;
    return { success: false, error: (error as Error).message };
  }
}
