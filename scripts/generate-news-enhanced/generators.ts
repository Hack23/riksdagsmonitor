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
import { generateArticleHTML } from '../article-template.js';
import { MCPClient } from '../mcp-client.js';
import type { Language } from '../types/language.js';
import type { GenerationResult, DateRange, ArticleCategory } from '../types/article.js';
import type { TitleSet } from './types.js';
import { languages, stats, getSharedClient, requireMcp, toISODate } from './config.js';
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
