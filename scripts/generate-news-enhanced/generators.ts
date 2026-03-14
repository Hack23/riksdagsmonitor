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
  type MindmapBranch,
  type SankeyNode,
  type SankeyFlow,
} from '../data-transformers/index.js';
import { buildAISwotStakeholders, STAKEHOLDER_NAMES } from '../data-transformers/content-generators/ai-swot-analyzer.js';
import { generateDeepAnalysisSection, localizeDocType } from '../data-transformers/content-generators/index.js';
import { generateDeepPolicyAnalysis, detectPolicyDomains } from '../data-transformers/policy-analysis.js';
import { escapeHtml } from '../html-utils.js';
import { generateArticleHTML } from '../article-template.js';
import { MCPClient } from '../mcp-client.js';
import type { Language } from '../types/language.js';
import type { GenerationResult, DateRange, ArticleCategory, TemplateSection } from '../types/article.js';
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
 * Generate Interpellation Debates article
 */
export async function generateInterpellations(): Promise<GenerationResult> {
  console.log('🔔 Generating Interpellation Debates article...');

  try {
    const client: MCPClient = await getSharedClient();

    console.log('  🔄 Fetching interpellations from riksdag-regering-mcp...');
    let interpellations: unknown[] = filterFreshDocuments(await client.fetchInterpellations({ limit: 15 }) as RawDocument[]);
    console.log(`  📊 Found ${interpellations.length} interpellations`);

    if (interpellations.length === 0) {
      console.log('  ℹ️ No new interpellations found, skipping');
      return { success: true, files: 0 };
    }

    // Enrich documents with content and metadata
    console.log('  🔍 Enriching documents with detailed content...');
    interpellations = await client.enrichDocumentsWithContent(interpellations as Parameters<MCPClient['enrichDocumentsWithContent']>[0], 3);
    const enrichedCount: number = (interpellations as Array<Record<string, unknown>>).filter(m => m['contentFetched']).length;
    console.log(`  ✅ Enriched ${enrichedCount}/${interpellations.length} interpellations with content`);

    const today: Date = new Date();
    const slug: string = `${formatDateForSlug(today)}-interpellation-debates`;

    for (const lang of languages) {
      console.log(`  🌐 Generating ${lang.toUpperCase()} version...`);

      const typedInterps = interpellations as Parameters<typeof generateArticleContent>[0]['motions'];
      const content: string = generateArticleContent({ motions: typedInterps }, 'interpellations', lang);
      const watchPoints = extractWatchPoints({ motions: typedInterps }, lang);
      const metadata = generateMetadata({ motions: typedInterps }, 'interpellations', lang);
      const readTime: string = calculateReadTime(content);
      const sources: string[] = generateSources(['get_interpellationer', 'get_dokument_innehall']);

      const titles: Record<Language, TitleSet> = {
        en: { title: `Interpellation Debates: Holding Government to Account`, subtitle: `Analysis of ${interpellations.length} interpellation debates demanding ministerial accountability` },
        sv: { title: `Interpellationsdebatter: Regeringen ställs till svars`, subtitle: `Analys av ${interpellations.length} interpellationsdebatter som kräver ministersvar` },
        da: { title: `Interpellationsdebatter: Regeringen stilles til ansvar`, subtitle: `Analyse af ${interpellations.length} interpellationsdebatter` },
        no: { title: `Interpellasjonsdebatter: Regjeringen stilles til ansvar`, subtitle: `Analyse av ${interpellations.length} interpellasjonsdebatter` },
        fi: { title: `Välikysymyskeskustelut: Hallitus tilivelvollisena`, subtitle: `Analyysi ${interpellations.length} välikysymyskeskustelusta` },
        de: { title: `Interpellationsdebatten: Regierung in der Verantwortung`, subtitle: `Analyse von ${interpellations.length} Interpellationsdebatten` },
        fr: { title: `Débats d'interpellation: Le gouvernement sommé de répondre`, subtitle: `Analyse de ${interpellations.length} débats d'interpellation` },
        es: { title: `Debates de interpelación: El gobierno rinde cuentas`, subtitle: `Análisis de ${interpellations.length} debates de interpelación` },
        nl: { title: `Interpellatiedebatten: Regering ter verantwoording`, subtitle: `Analyse van ${interpellations.length} interpellatiedebatten` },
        ar: { title: `مناقشات الاستجواب: محاسبة الحكومة`, subtitle: `تحليل ${interpellations.length} مناقشات استجواب` },
        he: { title: `דיוני אינטרפלציה: הממשלה נדרשת לתת דין וחשבון`, subtitle: `ניתוח ${interpellations.length} דיוני אינטרפלציה` },
        ja: { title: `質問主意書討論：政府の説明責任を追及`, subtitle: `${interpellations.length}件の質問主意書討論の分析` },
        ko: { title: `대정부 질의 토론: 정부 책임 추궁`, subtitle: `${interpellations.length}건의 대정부 질의 토론 분석` },
        zh: { title: `质询辩论：追究政府责任`, subtitle: `${interpellations.length}场质询辩论分析` }
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

      await writeSingleArticle(html, slug, lang, 'interpellations');
    }

    return { success: true, files: languages.length, slug };

  } catch (error: unknown) {
    console.error('❌ Error generating Interpellations:', (error as Error).message);
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
 * Determine whether a URL points to a GitHub repository resource
 * (github.com or raw.githubusercontent.com) that can be fetched as raw content.
 */
export function isGitHubUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === 'github.com'
      || hostname === 'www.github.com'
      || hostname === 'raw.githubusercontent.com';
  } catch {
    return false;
  }
}

/**
 * Convert a GitHub blob/tree URL to a raw.githubusercontent.com URL.
 * Handles patterns like:
 *   - https://github.com/{owner}/{repo}/blob/{branch}/{path}
 *   - https://github.com/{owner}/{repo}/raw/{branch}/{path}
 *   - https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path} (returned as-is)
 *
 * @returns The raw URL, or null if the URL cannot be converted.
 */
export function toGitHubRawUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Already a raw URL — return as-is
    if (hostname === 'raw.githubusercontent.com') {
      return url;
    }

    if (hostname !== 'github.com' && hostname !== 'www.github.com') {
      return null;
    }

    // Path: /{owner}/{repo}/blob/{branch}/{...path}
    // or:   /{owner}/{repo}/raw/{branch}/{...path}
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length < 4) return null;

    const [owner, repo, refType, ...rest] = segments;
    if (refType !== 'blob' && refType !== 'raw') return null;

    // rest = [branch, ...pathParts]
    return `https://raw.githubusercontent.com/${owner}/${repo}/${rest.join('/')}`;
  } catch {
    return null;
  }
}

/**
 * Compute a short, deterministic hash suffix from a URL path string.
 * Used to generate collision-resistant `dok_id` values for documents
 * fetched from government or GitHub URLs.
 *
 * The hash is a simple DJB2-style left-shift-and-add over each character,
 * rendered in base-36.  A leading `-` (from negative ints) is replaced with `n`.
 */
export function hashPathSuffix(path: string): string {
  return path
    .split('')
    .reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
    .toString(36)
    .replace(/^-/, 'n');
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
  documentsByType: {
    en: 'Documents by Type', sv: 'Dokument efter typ', da: 'Dokumenter efter type', no: 'Dokumenter etter type',
    fi: 'Asiakirjat tyypin mukaan', de: 'Dokumente nach Typ', fr: 'Documents par type', es: 'Documentos por tipo',
    nl: 'Documenten per type', ar: 'الوثائق حسب النوع', he: 'מסמכים לפי סוג',
    ja: '種類別文書', ko: '유형별 문서', zh: '按类型分类的文件',
  },
  documents: {
    en: 'Documents', sv: 'Dokument', da: 'Dokumenter', no: 'Dokumenter',
    fi: 'Asiakirjat', de: 'Dokumente', fr: 'Documents', es: 'Documentos',
    nl: 'Documenten', ar: 'وثائق', he: 'מסמכים',
    ja: '文書', ko: '문서', zh: '文件',
  },
  documentsAnalysed: {
    en: 'parliamentary documents analysed', sv: 'riksdagsdokument analyserade', da: 'parlamentsdokumenter analyseret', no: 'parlamentsdokumenter analysert',
    fi: 'asiakirjaa analysoitu', de: 'parlamentarische Dokumente analysiert', fr: 'documents parlementaires analysés', es: 'documentos parlamentarios analizados',
    nl: 'parlementaire documenten geanalyseerd', ar: 'وثيقة برلمانية تم تحليلها', he: 'מסמכים פרלמנטריים שנותחו',
    ja: '件の議会文書を分析', ko: '의회 문서 분석됨', zh: '份议会文件已分析',
  },
  documentAnalysed: {
    en: 'parliamentary document analysed', sv: 'riksdagsdokument analyserat', da: 'parlamentsdokument analyseret', no: 'parlamentsdokument analysert',
    fi: 'asiakirja analysoitu', de: 'parlamentarisches Dokument analysiert', fr: 'document parlementaire analysé', es: 'documento parlamentario analizado',
    nl: 'parlementair document geanalyseerd', ar: 'وثيقة برلمانية تم تحليلها', he: 'מסמך פרלמנטרי שנותח',
    ja: '件の議会文書を分析', ko: '의회 문서 분석됨', zh: '份议会文件已分析',
  },
  documentTypes: {
    en: 'Document Types', sv: 'Dokumenttyper', da: 'Dokumenttyper', no: 'Dokumenttyper',
    fi: 'Asiakirjatyypit', de: 'Dokumenttypen', fr: 'Types de documents', es: 'Tipos de documentos',
    nl: 'Documenttypen', ar: 'أنواع الوثائق', he: 'סוגי מסמכים',
    ja: '文書種類', ko: '문서 유형', zh: '文件类型',
  },
  policyDomains: {
    en: 'Policy Domains', sv: 'Politikområden', da: 'Politikområder', no: 'Politikkområder',
    fi: 'Politiikka-alueet', de: 'Politikbereiche', fr: 'Domaines politiques', es: 'Áreas de política',
    nl: 'Beleidsdomeinen', ar: 'مجالات السياسة', he: 'תחומי מדיניות',
    ja: '政策分野', ko: '정책 영역', zh: '政策领域',
  },
  stakeholders: {
    en: 'Stakeholders', sv: 'Intressenter', da: 'Interessenter', no: 'Interessenter',
    fi: 'Sidosryhmät', de: 'Stakeholder', fr: 'Parties prenantes', es: 'Partes interesadas',
    nl: 'Belanghebbenden', ar: 'أصحاب المصلحة', he: 'בעלי עניין',
    ja: 'ステークホルダー', ko: '이해관계자', zh: '利益相关者',
  },
};

function deepLabel(key: string, lang: Language): string {
  const map = DEEP_SECTION_LABELS[key];
  return (map?.[lang]) ?? (map?.en ?? key);
}

function docTypeLabel(doktyp: string, lang: Language, count?: number): string {
  return localizeDocType(doktyp, lang, count);
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
  const typeLabel = doktyp ? docTypeLabel(doktyp, lang, 1) : '';
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
  const pressmCount = docs.filter(d => (d.doktyp || d.documentType) === 'pressm').length;
  const extCount = docs.filter(d => (d.doktyp || d.documentType) === 'ext').length;
  const enrichedCount = docs.filter(d => d.contentFetched).length;
  const legislativeCount = propCount + betCount + motCount;

  // Detect all policy domains across documents for richer context
  const allDomains = new Set<string>();
  docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
  const domainPhrase = allDomains.size > 0 ? [...allDomains].slice(0, 3).join(', ') : '';

  // Choose a template style based on document composition
  const isLegislativeFocused = legislativeCount > 0;
  const isPressOrExternal = pressmCount + extCount > 0 && legislativeCount === 0;

  let enText: string;
  if (isPressOrExternal) {
    // Non-legislative documents (press releases, external) — differentiate messaging
    const typeDesc = pressmCount > 0 ? `${pressmCount} government press release${pressmCount !== 1 ? 's' : ''}` : `${extCount} external reference${extCount !== 1 ? 's' : ''}`;
    const signalText = pressmCount > 0
      ? 'Government press communications signal policy priorities and upcoming legislative action.'
      : 'These external references illuminate the policy landscape and highlight areas of potential legislative interest.';
    enText = `Based on analysis of ${docs.length} document${docs.length !== 1 ? 's' : ''} (${enrichedCount} enriched with full text)${topic ? ` specifically addressing <strong>${esc(topic)}</strong>` : ''}: This deep inspection examines ${typeDesc}${domainPhrase ? ` spanning ${domainPhrase}` : ''}. ${signalText} Stakeholders should track whether formal propositions or committee referrals follow, which would confirm the transition from policy signalling to legislative commitment.`;
  } else if (isLegislativeFocused) {
    const signalText = propCount > betCount ? 'active government agenda-setting' : betCount > propCount ? 'strong parliamentary scrutiny' : 'balanced legislative activity';
    enText = `Based on analysis of ${docs.length} parliamentary document${docs.length !== 1 ? 's' : ''} (${enrichedCount} enriched with full text)${topic ? ` specifically addressing <strong>${esc(topic)}</strong>` : ''}: The legislative pipeline shows ${propCount} government proposition${propCount !== 1 ? 's' : ''}, ${betCount} committee report${betCount !== 1 ? 's' : ''}, and ${motCount} opposition motion${motCount !== 1 ? 's' : ''}. This distribution signals ${signalText}${domainPhrase ? ` in ${domainPhrase}` : ' in this policy area'}. Stakeholders should monitor committee deliberations and chamber voting patterns as the most reliable indicators of policy trajectory.`;
  } else {
    enText = `Based on analysis of ${docs.length} document${docs.length !== 1 ? 's' : ''} (${enrichedCount} enriched with full text)${topic ? ` specifically addressing <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? `, covering ${domainPhrase}` : ''}: This analysis provides a snapshot of current policy direction. Stakeholders should monitor subsequent legislative developments for concrete implementation signals.`;
  }

  const enrichedPhraseSv = `${enrichedCount} ${enrichedCount === 1 ? 'berikat' : 'berikade'} med fulltext`;
  let svText: string;
  if (isPressOrExternal) {
    const typeDescSv = pressmCount > 0 ? `${pressmCount} pressmeddelande${pressmCount !== 1 ? 'n' : ''}` : `${extCount} extern${extCount !== 1 ? 'a' : ''} referens${extCount !== 1 ? 'er' : ''}`;
    const signalTextSv = pressmCount > 0
      ? 'Regeringens presskommunikation signalerar politiska prioriteringar och kommande lagstiftningsåtgärder.'
      : 'Dessa externa referenser belyser det politiska landskapet och lyfter fram områden med potentiellt lagstiftningsintresse.';
    svText = `Baserat på analys av ${docs.length} dokument (${enrichedPhraseSv})${topic ? ` med specifik inriktning på <strong>${esc(topic)}</strong>` : ''}: Denna djupanalys granskar ${typeDescSv}${domainPhrase ? ` inom ${domainPhrase}` : ''}. ${signalTextSv} Intressenter bör bevaka om formella propositioner eller utskottsremisser följer.`;
  } else if (isLegislativeFocused && legislativeCount > 0) {
    svText = `Baserat på analys av ${docs.length} riksdagsdokument (${enrichedPhraseSv})${topic ? ` med specifik inriktning på <strong>${esc(topic)}</strong>` : ''}: Det lagstiftande flödet visar ${propCount} proposition${propCount !== 1 ? 'er' : ''}, ${betCount} betänkande${betCount !== 1 ? 'n' : ''} och ${motCount} motion${motCount !== 1 ? 'er' : ''}. Intressenter bör följa utskottens överläggningar och kammarens voteringsmönster.`;
  } else {
    svText = `Baserat på analys av ${docs.length} dokument (${enrichedPhraseSv})${topic ? ` med specifik inriktning på <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` inom ${domainPhrase}` : ''}: Analysen ger en ögonblicksbild av den aktuella politiska inriktningen och dess betydelse för centrala intressenter.`;
  }

  const templates: Partial<Record<Language, string>> = {
    en: enText,
    sv: svText,
    de: `Basierend auf der Analyse von ${docs.length} Dokument${docs.length !== 1 ? 'en' : ''} (${enrichedCount} mit vollständigem Text angereichert)${topic ? ` speziell zu <strong>${esc(topic)}</strong>` : ''}: ${isLegislativeFocused ? `Der Gesetzgebungsprozess zeigt ${propCount} Regierungsvorlage${propCount !== 1 ? 'n' : ''}, ${betCount} Ausschussbericht${betCount !== 1 ? 'e' : ''} und ${motCount} Oppositionsantrag${motCount !== 1 ? 'e' : ''}.` : 'Die Analyse bietet eine Momentaufnahme der aktuellen politischen Richtung.'}`,
    fr: `Basé sur l'analyse de ${docs.length} document${docs.length !== 1 ? 's' : ''} (${enrichedCount} enrichi${enrichedCount !== 1 ? 's' : ''} avec le texte complet)${topic ? ` abordant spécifiquement <strong>${esc(topic)}</strong>` : ''}: ${isLegislativeFocused ? `Le pipeline législatif montre ${propCount} proposition${propCount !== 1 ? 's' : ''} gouvernementale${propCount !== 1 ? 's' : ''}, ${betCount} rapport${betCount !== 1 ? 's' : ''} de commission et ${motCount} motion${motCount !== 1 ? 's' : ''} d'opposition.` : 'L\'analyse offre un aperçu de l\'orientation politique actuelle.'}`,
    es: `Basado en el análisis de ${docs.length} documento${docs.length !== 1 ? 's' : ''} (${enrichedCount} enriquecido${enrichedCount !== 1 ? 's' : ''} con texto completo)${topic ? ` que abordan específicamente <strong>${esc(topic)}</strong>` : ''}: ${isLegislativeFocused ? `La actividad legislativa muestra ${propCount} proposición${propCount !== 1 ? 'es' : ''} gubernamental${propCount !== 1 ? 'es' : ''}, ${betCount} informe${betCount !== 1 ? 's' : ''} de comité y ${motCount} moción${motCount !== 1 ? 'es' : ''} de oposición.` : 'El análisis proporciona una instantánea de la dirección política actual.'}`,
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
  const pressmDocs = docs.filter(d => (d.doktyp || d.documentType) === 'pressm');

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

  // Press release / government communication insights
  if (pressmDocs.length > 0) {
    items.push(lang === 'sv'
      ? `<strong>${pressmDocs.length} pressmeddelande${pressmDocs.length !== 1 ? 'n' : ''} från regeringen</strong> signalerar kommande policyåtgärder${topicPhrase}`
      : `<strong>${pressmDocs.length} government press release${pressmDocs.length !== 1 ? 's' : ''}</strong> signal${pressmDocs.length === 1 ? 's' : ''} upcoming policy action${topicPhrase}`);
  }

  // Content-derived insight: detected policy domains
  const allDomains = new Set<string>();
  docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
  if (allDomains.size > 0) {
    const domainList = [...allDomains].slice(0, 4).map(d => esc(d)).join(', ');
    items.push(lang === 'sv'
      ? `<strong>Identifierade policyområden:</strong> ${domainList}`
      : `<strong>Policy domains identified:</strong> ${domainList}`);
  }

  const enriched = docs.filter(d => d.contentFetched).length;
  if (enriched > 0) {
    items.push(lang === 'sv'
      ? `<strong>${enriched} av ${docs.length} dokument</strong> ${enriched === 1 ? 'berikat' : 'berikade'} med fulltext för djupanalys`
      : `<strong>${enriched} of ${docs.length} document${docs.length !== 1 ? 's' : ''}</strong> enriched with full text for deep analysis`);
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

  // Classify by document type (used for Sankey flow diagram below)
  const propDocs = docs.filter(d => (d.doktyp || d.documentType) === 'prop');
  const betDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'bet');
  const motDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'mot');
  const skrDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'skr');
  const sfsDocs  = docs.filter(d =>
    (d.doktyp || d.documentType) === 'sfs' || (d.dokumentnamn || '').startsWith('SFS'));
  const euDocs   = docs.filter(d => (d.doktyp || d.documentType) === 'fpm');
  const pressmDocs = docs.filter(d => (d.doktyp || d.documentType) === 'pressm');
  const extDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'ext');
  const otherDocs = docs.filter(d =>
    !['prop','bet','mot','skr','sfs','fpm','pressm','ext'].includes((d.doktyp || d.documentType) || '')
    && !(d.dokumentnamn || '').startsWith('SFS'));

  // ── AI-driven 6-stakeholder SWOT ─────────────────────────────────────────
  const stakeholders = buildAISwotStakeholders(docs, topic, lang);

  const strategicContext = topic
    ? `Analysis exclusively focused on: ${topic} — ${docs.length} parliamentary documents examined`
    : `Multi-stakeholder analysis of ${docs.length} parliamentary documents`;
  const swotSection = generateStakeholderSwotSection({ stakeholders, lang, strategicContext });

  // ── Localised names for mindmap/sankey labels (single source from ai-swot-analyzer)
  const govNames    = STAKEHOLDER_NAMES['government-coalition'];
  const oppNames    = STAKEHOLDER_NAMES['opposition'];
  const privateNames = STAKEHOLDER_NAMES['private-sector'];
  const euNames     = STAKEHOLDER_NAMES['eu-international'];
  const civilNames  = STAKEHOLDER_NAMES['civil-society'];
  const citizenNames = STAKEHOLDER_NAMES['citizens-voters'];

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


  // ── Dashboard: document type distribution ─────────────────────────────────
  const typeCounts: Record<string, number> = {};
  docs.forEach(d => {
    const t = d.doktyp || d.documentType || 'other';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const rawTypeKeys = Object.keys(typeCounts);
  // Use localized display names for chart labels (e.g., "Press Release" not "pressm")
  const chartLabels = rawTypeKeys.map(t => docTypeLabel(t, lang, typeCounts[t]));
  const chartValues = rawTypeKeys.map(t => typeCounts[t]);

  const dashboardSection = generateDashboardSection({
    data: {
      title: topic
        ? `${deepLabel('documentIntelligence', lang)} — ${topic}`
        : deepLabel('documentIntelligence', lang),
      summary: `${docs.length} ${deepLabel(docs.length === 1 ? 'documentAnalysed' : 'documentsAnalysed', lang)}`,
      charts: [{
        id: 'deep-inspection-doc-types',
        type: 'bar',
        title: deepLabel('documentsByType', lang),
        labels: chartLabels,
        datasets: [{
          label: deepLabel('documents', lang),
          data: chartValues,
          backgroundColor: rawTypeKeys.map((_, i) => DEEP_CHART_PALETTE[i % DEEP_CHART_PALETTE.length]),
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

  // Document type branch — use localized names
  if (rawTypeKeys.length > 0) {
    mindmapBranches.push({
      label: deepLabel('documentTypes', lang),
      color: 'cyan',
      icon: '📄',
      items: rawTypeKeys.map((t, i) => `${docTypeLabel(t, lang, chartValues[i])} (${chartValues[i] ?? 0})`),
    });
  }

  // Policy domain branch
  if (detectedDomainList.length > 0) {
    mindmapBranches.push({
      label: deepLabel('policyDomains', lang),
      color: 'green',
      icon: '🏛️',
      items: detectedDomainList,
    });
  }

  // Stakeholder branch
  mindmapBranches.push({
    label: deepLabel('stakeholders', lang),
    color: 'yellow',
    icon: '👥',
    items: [
      govNames[lang] ?? govNames.en!,
      oppNames[lang] ?? oppNames.en!,
      euNames[lang] ?? euNames.en!,
      privateNames[lang] ?? privateNames.en!,
      civilNames[lang] ?? civilNames.en!,
      citizenNames[lang] ?? citizenNames.en!,
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
    sankeyFlows.push({ source: 'gov', target: 'eu', value: euDocs.length, label: `${euDocs.length}` });
  }
  if (pressmDocs.length > 0) {
    sankeyNodes.push({ id: 'pressm', label: 'Press Releases', color: 'orange' });
    sankeyFlows.push({ source: 'gov', target: 'pressm', value: pressmDocs.length, label: `${pressmDocs.length}` });
  }
  if (skrDocs.length > 0) {
    sankeyNodes.push({ id: 'skr', label: 'Gov. Communications (Skr)', color: 'green' });
    sankeyFlows.push({ source: 'gov', target: 'skr', value: skrDocs.length, label: `${skrDocs.length}` });
  }
  if (extDocs.length > 0) {
    sankeyNodes.push({ id: 'ext', label: 'External / Reference', color: 'purple' });
    sankeyFlows.push({ source: 'pvt', target: 'ext', value: extDocs.length, label: `${extDocs.length}` });
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

    // Resolve document IDs from URLs and collect government/GitHub URLs separately
    const urlDerivedIds: string[] = [];
    const governmentUrls: string[] = [];
    const gitHubUrls: string[] = [];
    for (const url of documentUrls) {
      const docId = extractDocIdFromUrl(url);
      if (docId) {
        console.log(`  🔗 Resolved URL → dok_id: ${docId}`);
        urlDerivedIds.push(docId);
      } else if (isGovernmentUrl(url)) {
        console.log(`  🏛️ Government URL detected (will fetch via g0v): ${url}`);
        governmentUrls.push(url);
      } else if (isGitHubUrl(url)) {
        console.log(`  📦 GitHub URL detected (will fetch raw content): ${url}`);
        gitHubUrls.push(url);
      } else {
        console.warn(`  ⚠️ Unsupported URL type (riksdagen.se, regeringen.se, github.com supported): ${url}`);
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
          // Extract a human-readable title from the URL path's last segment.
          // e.g. "/pressmeddelanden/2026/03/91-atgarder-ska-starka-..." → "91 atgarder ska starka ..."
          const urlPath = new URL(govUrl).pathname;
          const segments = urlPath.split('/').filter(Boolean);
          const titleSlug = segments[segments.length - 1] ?? 'government-document';
          const titleFromSlug = titleSlug.replace(/-/g, ' ');

          // Use a URL-path-based hash suffix to avoid dok_id collisions between
          // government documents that share the same first 30 chars of their slug.
          const hashSuffix = hashPathSuffix(urlPath);
          const govDoc: RawDocument = {
            doktyp: 'pressm',
            documentType: 'pressm',
            titel: titleFromSlug,
            title: titleFromSlug,
            url: govUrl,
            dok_id: `gov-${titleSlug.slice(0, 30)}-${hashSuffix}`,
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

    // Fetch GitHub raw content for github.com URLs (e.g. strategy documents, reference docs)
    for (const ghUrl of gitHubUrls) {
      try {
        const rawUrl = toGitHubRawUrl(ghUrl);
        if (!rawUrl) {
          console.warn(`  ⚠️ Cannot convert GitHub URL to raw format: ${ghUrl}`);
          continue;
        }
        console.log(`  📦 Fetching GitHub content: ${rawUrl}`);
        const content = await client.fetchExternalUrlContent(rawUrl);
        if (content) {
          // Extract title from file path — e.g. "Information_Security_Strategy.md" → "Information Security Strategy"
          const urlPath = new URL(ghUrl).pathname;
          // After split('/').filter(Boolean), segments = ['owner', 'repo', 'blob', 'branch', ...pathParts]
          const segments = urlPath.split('/').filter(Boolean);
          const filename = segments[segments.length - 1] ?? 'external-document';
          const titleFromFilename = filename
            .replace(/\.(md|txt|rst|adoc|html)$/i, '')
            .replace(/[-_]/g, ' ');

          // Identify the repository context (owner/repo) for the title
          const repoContext = segments.length >= 2 ? `${segments[0]}/${segments[1]}` : '';
          const fullTitle = repoContext ? `${titleFromFilename} (${repoContext})` : titleFromFilename;

          // Use full URL path hash to avoid dok_id collisions across repositories
          const hashSuffix = hashPathSuffix(urlPath);
          // Include repo context in dok_id for cross-repository uniqueness
          const repoSlug = repoContext ? repoContext.replace('/', '-').slice(0, 20) : '';
          const fileSlug = filename.slice(0, 30).replace(/\.(md|txt|rst|adoc|html)$/i, '');
          const ghDoc: RawDocument = {
            doktyp: 'ext',
            documentType: 'ext',
            titel: fullTitle,
            title: fullTitle,
            url: ghUrl,
            dok_id: `gh-${repoSlug}-${fileSlug}-${hashSuffix}`,
            fullText: content,
            fullContent: content,
            contentFetched: true,
            summary: content.slice(0, 500),
            datum: new Date().toISOString().split('T')[0],
          };
          targetDocs.push(ghDoc);
          console.log(`  ✅ GitHub document fetched: ${fullTitle}`);
        } else {
          console.warn(`  ⚠️ No content returned for GitHub URL: ${ghUrl}`);
        }
      } catch (err: unknown) {
        console.warn(`  ⚠️ Failed to fetch GitHub document ${ghUrl}: ${(err as Error).message}`);
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
      if (gitHubUrls.length > 0) sourceMethods.push('GitHub raw content');
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
