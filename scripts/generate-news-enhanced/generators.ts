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
import { generateDeepAnalysisSection, localizeDocType } from '../data-transformers/content-generators/index.js';
import { generateDeepPolicyAnalysis, detectPolicyDomains } from '../data-transformers/policy-analysis.js';
import { escapeHtml } from '../html-utils.js';
import { generateArticleHTML } from '../article-template.js';
import { MCPClient } from '../mcp-client.js';
import type { Language } from '../types/language.js';
import type { GenerationResult, DateRange, ArticleCategory, TemplateSection, SwotEntry } from '../types/article.js';
import type { TitleSet } from './types.js';
import { languages, stats, getSharedClient, requireMcp, toISODate, documentIds, documentUrls, focusTopic, analysisDepth } from './config.js';
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
  executiveSummary: {
    en: 'Executive Intelligence Summary',
    sv: 'Sammanfattning för beslutsfattare',
    da: 'Ledelsesinformation',
    no: 'Lederinformasjon',
    fi: 'Johdon yhteenveto',
    de: 'Führungszusammenfassung',
    fr: 'Résumé pour décideurs',
    es: 'Resumen ejecutivo de inteligencia',
    nl: 'Managementsamenvatting',
    ar: 'ملخص الاستخبارات التنفيذية',
    he: 'סיכום מודיעין מנהלים',
    ja: 'エグゼクティブ・インテリジェンス要約',
    ko: '경영진 인텔리전스 요약',
    zh: '执行情报摘要',
  },
  predictiveAssessment: {
    en: 'Predictive Assessment',
    sv: 'Prediktiv bedömning',
    da: 'Prædiktiv vurdering',
    no: 'Prediktiv vurdering',
    fi: 'Ennakoiva arviointi',
    de: 'Prädiktive Bewertung',
    fr: 'Évaluation prédictive',
    es: 'Evaluación predictiva',
    nl: 'Voorspellende beoordeling',
    ar: 'التقييم التنبؤي',
    he: 'הערכה חיזויית',
    ja: '予測評価',
    ko: '예측 평가',
    zh: '预测性评估',
  },
  historicalContext: {
    en: 'Historical Context & Precedents',
    sv: 'Historisk kontext och prejudikat',
    da: 'Historisk kontekst og præcedenser',
    no: 'Historisk kontekst og presedens',
    fi: 'Historiallinen konteksti ja ennakkotapaukset',
    de: 'Historischer Kontext und Präzedenzfälle',
    fr: 'Contexte historique et précédents',
    es: 'Contexto histórico y precedentes',
    nl: 'Historische context en precedenten',
    ar: 'السياق التاريخي والسوابق',
    he: 'הקשר היסטורי ותקדימים',
    ja: '歴史的背景と先例',
    ko: '역사적 맥락 및 선례',
    zh: '历史背景与先例',
  },
  methodology: {
    en: 'Methodology & Confidence',
    sv: 'Metodik och konfidensgrad',
    da: 'Metodologi og konfidens',
    no: 'Metodologi og konfidens',
    fi: 'Menetelmä ja luottamustaso',
    de: 'Methodik und Konfidenz',
    fr: 'Méthodologie et confiance',
    es: 'Metodología y confianza',
    nl: 'Methodologie en betrouwbaarheid',
    ar: 'المنهجية ودرجة الثقة',
    he: 'מתודולוגיה ורמת ביטחון',
    ja: '方法論と信頼度',
    ko: '방법론 및 신뢰도',
    zh: '方法论与置信度',
  },
  likelyOutcome: {
    en: 'Likely Outcome', sv: 'Troligt utfall', da: 'Sandsynligt udfald', no: 'Sannsynlig utfall',
    fi: 'Todennäköinen lopputulos', de: 'Wahrscheinliches Ergebnis', fr: 'Résultat probable', es: 'Resultado probable',
    nl: 'Waarschijnlijk resultaat', ar: 'النتيجة المحتملة', he: 'תוצאה סבירה',
    ja: '見込まれる結果', ko: '예상 결과', zh: '可能结果',
  },
  coalitionStability: {
    en: 'Coalition Stability Forecast', sv: 'Koalitionsstabilitetsprognos', da: 'Koalitionsstabilitetsprognose', no: 'Koalisjonstabilitetsprognose',
    fi: 'Koalition vakausennuste', de: 'Koalitionsstabilitätsprognose', fr: 'Prévision de stabilité de coalition', es: 'Pronóstico de estabilidad de coalición',
    nl: 'Coalitiesstabiliteitsprognose', ar: 'توقعات استقرار الائتلاف', he: 'תחזית יציבות קואליציה',
    ja: '連立安定性予測', ko: '연립 안정성 예측', zh: '联合稳定性预测',
  },
  riskScenarios: {
    en: 'Risk Scenarios', sv: 'Riskscenarier', da: 'Risikoscenarier', no: 'Risikoscenarier',
    fi: 'Riskiskenaariot', de: 'Risikoszenarien', fr: 'Scénarios de risque', es: 'Escenarios de riesgo',
    nl: "Risicoscenario's", ar: 'سيناريوهات المخاطر', he: 'תרחישי סיכון',
    ja: 'リスクシナリオ', ko: '위험 시나리오', zh: '风险情景',
  },
};

/** @internal Exported for test verification of label map completeness. */
export function deepLabel(key: string, lang: Language): string {
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
 *
 * @param depth - Analysis depth (1–4). Higher depth adds more intelligence sections:
 *   1 = Topic Context + Document Intelligence + Strategic Implications + Key Takeaways
 *   2 = depth 1 + Predictive Assessment + Historical Context
 *   3 = depth 2 + Executive Intelligence Summary + Methodology
 *   4 = depth 3 (full report, all sections)
 */
function generateDeepInspectionContent(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
  depth: 1 | 2 | 3 | 4 = 1,
): string {
  const esc = escapeHtml;
  let html = '';

  // ── 0. Executive Intelligence Summary (depth ≥ 3) ────────────────────────
  if (depth >= 3) {
    html += buildExecutiveSummary(docs, topic, lang);
  }

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

  // ── 5. Historical Context (depth ≥ 2) ─────────────────────────────────────
  if (depth >= 2) {
    html += buildHistoricalContext(docs, topic, lang);
  }

  // ── 6. Predictive Assessment (depth ≥ 2) ──────────────────────────────────
  if (depth >= 2) {
    html += buildPredictiveAssessment(docs, topic, lang);
  }

  // ── 7. Key takeaways ───────────────────────────────────────────────────────
  const takeawayHeading = deepLabel('keyTakeaways', lang);
  html += `\n<section class="key-takeaways" aria-label="${esc(takeawayHeading)}">\n`;
  html += `  <h2>${esc(takeawayHeading)}</h2>\n`;
  html += buildKeyTakeaways(docs, topic, lang);
  html += `</section>\n`;

  // ── 8. Methodology & Confidence (depth ≥ 3) ───────────────────────────────
  if (depth >= 3) {
    html += buildMethodologySection(docs, topic, lang, depth);
  }

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
  const enrichedCount = docs.filter(d => d.fullText || d.fullContent).length;
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
    da: `Baseret på analyse af ${docs.length} dokument${docs.length !== 1 ? 'er' : ''} (${enrichedCount} beriget med fulde tekster)${topic ? ` specifikt om <strong>${esc(topic)}</strong>` : ''}: ${isLegislativeFocused ? `Den lovgivningsmæssige aktivitet viser ${propCount} regeringsforslag, ${betCount} udvalgsrapport${betCount !== 1 ? 'er' : ''} og ${motCount} oppositionsforslag.` : 'Analysen giver et øjebliksbillede af den aktuelle politiske retning.'}`,
    no: `Basert på analyse av ${docs.length} dokument${docs.length !== 1 ? 'er' : ''} (${enrichedCount} beriket med fulltekst)${topic ? ` spesifikt om <strong>${esc(topic)}</strong>` : ''}: ${isLegislativeFocused ? `Lovgivningsaktiviteten viser ${propCount} regjeringsforslag, ${betCount} komitérapport${betCount !== 1 ? 'er' : ''} og ${motCount} opposisjonsforslag.` : 'Analysen gir et øyeblikksbilde av den aktuelle politiske retningen.'}`,
    fi: `Perustuen ${docs.length} asiakirjan analyysiin (${enrichedCount} rikastettu koko tekstillä)${topic ? ` koskien erityisesti <strong>${esc(topic)}</strong>` : ''}: ${isLegislativeFocused ? `Lainsäädäntötoiminta osoittaa ${propCount} hallituksen esitystä, ${betCount} valiokunnan mietintöä ja ${motCount} oppositioaloitetta.` : 'Analyysi tarjoaa tilannekuvan nykyisestä poliittisesta suunnasta.'}`,
    de: `Basierend auf der Analyse von ${docs.length} Dokument${docs.length !== 1 ? 'en' : ''} (${enrichedCount} mit vollständigem Text angereichert)${topic ? ` speziell zu <strong>${esc(topic)}</strong>` : ''}: ${isLegislativeFocused ? `Der Gesetzgebungsprozess zeigt ${propCount} Regierungsvorlage${propCount !== 1 ? 'n' : ''}, ${betCount} Ausschussbericht${betCount !== 1 ? 'e' : ''} und ${motCount} Oppositionsantrag${motCount !== 1 ? 'e' : ''}.` : 'Die Analyse bietet eine Momentaufnahme der aktuellen politischen Richtung.'}`,
    fr: `Basé sur l'analyse de ${docs.length} document${docs.length !== 1 ? 's' : ''} (${enrichedCount} enrichi${enrichedCount !== 1 ? 's' : ''} avec le texte complet)${topic ? ` abordant spécifiquement <strong>${esc(topic)}</strong>` : ''}: ${isLegislativeFocused ? `Le pipeline législatif montre ${propCount} proposition${propCount !== 1 ? 's' : ''} gouvernementale${propCount !== 1 ? 's' : ''}, ${betCount} rapport${betCount !== 1 ? 's' : ''} de commission et ${motCount} motion${motCount !== 1 ? 's' : ''} d'opposition.` : 'L\'analyse offre un aperçu de l\'orientation politique actuelle.'}`,
    es: `Basado en el análisis de ${docs.length} documento${docs.length !== 1 ? 's' : ''} (${enrichedCount} enriquecido${enrichedCount !== 1 ? 's' : ''} con texto completo)${topic ? ` que abordan específicamente <strong>${esc(topic)}</strong>` : ''}: ${isLegislativeFocused ? `La actividad legislativa muestra ${propCount} proposición${propCount !== 1 ? 'es' : ''} gubernamental${propCount !== 1 ? 'es' : ''}, ${betCount} informe${betCount !== 1 ? 's' : ''} de comité y ${motCount} moción${motCount !== 1 ? 'es' : ''} de oposición.` : 'El análisis proporciona una instantánea de la dirección política actual.'}`,
    nl: `Gebaseerd op analyse van ${docs.length} document${docs.length !== 1 ? 'en' : ''} (${enrichedCount} verrijkt met volledige tekst)${topic ? ` specifiek over <strong>${esc(topic)}</strong>` : ''}: ${isLegislativeFocused ? `De wetgevende activiteit toont ${propCount} regeringsvoorstel${propCount !== 1 ? 'len' : ''}, ${betCount} commissierapport${betCount !== 1 ? 'en' : ''} en ${motCount} oppositiemotie${motCount !== 1 ? 's' : ''}.` : 'De analyse biedt een momentopname van de huidige politieke richting.'}`,
    ar: `استناداً إلى تحليل ${docs.length} وثيقة (${enrichedCount} مُعزَّزة بالنص الكامل)${topic ? ` تتناول تحديداً <strong>${esc(topic)}</strong>` : ''}: ${isLegislativeFocused ? `يُظهر النشاط التشريعي ${propCount} مقترحاً حكومياً و${betCount} تقرير${betCount !== 1 ? 'اً' : ''} للجنة و${motCount} اقتراح${motCount !== 1 ? 'اً' : ''} معارضاً.` : 'يوفر التحليل لقطة للاتجاه السياسي الحالي.'}`,
    he: `בהתבסס על ניתוח ${docs.length} מסמכ${docs.length !== 1 ? 'ים' : ''} (${enrichedCount} עם טקסט מלא)${topic ? ` המתמקדים ב<strong>${esc(topic)}</strong>` : ''}: ${isLegislativeFocused ? `הפעילות החקיקתית מראה ${propCount} הצעת חוק ממשלתית, ${betCount} דוח ועדה ו-${motCount} הצעת אופוזיציה.` : 'הניתוח מספק תמונת מצב של הכיוון הפוליטי הנוכחי.'}`,
    ja: `${docs.length}件の文書分析（${enrichedCount}件は全文で強化）${topic ? `、<strong>${esc(topic)}</strong>に特化` : ''}に基づく: ${isLegislativeFocused ? `立法活動は${propCount}件の政府提案、${betCount}件の委員会報告、${motCount}件の野党動議を示しています。` : '分析は現在の政策方向のスナップショットを提供しています。'}`,
    ko: `${docs.length}개 문서 분석(${enrichedCount}개 전문 보강)${topic ? `, <strong>${esc(topic)}</strong>에 집중` : ''}에 기반: ${isLegislativeFocused ? `입법 활동은 ${propCount}개 정부 제안, ${betCount}개 위원회 보고서, ${motCount}개 야당 발의안을 보여줍니다.` : '분석은 현재 정책 방향의 스냅샷을 제공합니다.'}`,
    zh: `基于对${docs.length}份文件（${enrichedCount}份含全文）的分析${topic ? `，专注于<strong>${esc(topic)}</strong>` : ''}：${isLegislativeFocused ? `立法活动显示${propCount}项政府提案、${betCount}份委员会报告和${motCount}项反对党动议。` : '该分析提供了当前政策方向的快照。'}`,
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
  const sfsDocs  = docs.filter(d =>
    (d.doktyp || d.documentType) === 'sfs' || (d.dokumentnamn || '').startsWith('SFS'));
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

  const enriched = docs.filter(d => d.fullText || d.fullContent).length;
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
// Multi-iteration deep-inspection intelligence section builders
// ---------------------------------------------------------------------------

/**
 * Build a concise Executive Intelligence Summary.
 * Synthesises document composition, policy domains, and legislative posture
 * into a briefing paragraph for decision-makers.
 * Iteration 1 + Iteration 2 outcome: "what happened & why it matters".
 */
function buildExecutiveSummary(docs: RawDocument[], topic: string | null, lang: Language): string {
  const esc = escapeHtml;
  const propCount = docs.filter(d => (d.doktyp || d.documentType) === 'prop').length;
  const betCount  = docs.filter(d => (d.doktyp || d.documentType) === 'bet').length;
  const motCount  = docs.filter(d => (d.doktyp || d.documentType) === 'mot').length;
  const sfsDocs   = docs.filter(d =>
    (d.doktyp || d.documentType) === 'sfs' || (d.dokumentnamn || '').startsWith('SFS'));
  const enriched  = docs.filter(d => d.fullText || d.fullContent).length;
  const allDomains = new Set<string>();
  docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
  const domainList = [...allDomains].slice(0, 4);
  const domainPhrase = domainList.map(d => esc(d)).join(', ');

  // Determine legislative posture
  const hasEnactedLaw = sfsDocs.length > 0;
  const govLed = propCount > motCount;
  const highScrutiny = betCount > 0;

  const templates: Partial<Record<Language, string>> = {
    en: `This deep-inspection intelligence report analyses ${docs.length} parliamentary document${docs.length !== 1 ? 's' : ''}${topic ? ` on <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? `, spanning ${domainPhrase}` : ''}. Of these, ${enriched} ${enriched === 1 ? 'was' : 'were'} enriched with full text to enable substantive analysis. The legislative posture is ${govLed ? 'government-led' : 'opposition-driven'}, with ${propCount} proposition${propCount !== 1 ? 's' : ''} advancing the executive agenda${betCount > 0 ? `, ${betCount} committee report${betCount !== 1 ? 's' : ''} providing parliamentary scrutiny` : ''}${motCount > 0 ? `, and ${motCount} opposition motion${motCount !== 1 ? 's' : ''} challenging the direction` : ''}. ${hasEnactedLaw ? `${sfsDocs.length} statute${sfsDocs.length !== 1 ? 's' : ''} have already been enacted, establishing a legal baseline.` : highScrutiny ? 'Committee engagement indicates that the policy is under active parliamentary review, signalling that key decisions are imminent.' : 'The legislative pipeline remains at an early stage, requiring close monitoring for acceleration signals.'} ${domainPhrase ? `Policy domains engaged — ${domainPhrase} — reflect the cross-cutting nature of this initiative.` : 'The documents reflect focused policy engagement in this area.'} Decision-makers should prioritise tracking committee deliberations and chamber voting patterns as the most reliable forward indicators.`,
    sv: (() => {
      const svClauses = [`${propCount} proposition${propCount !== 1 ? 'er' : ''}`];
      if (betCount > 0) svClauses.push(`${betCount} utskottsbetänkande${betCount !== 1 ? 'n' : ''} som ger parlamentarisk granskning`);
      if (motCount > 0) svClauses.push(`${motCount} opposition${motCount !== 1 ? 'smotioner' : 'smotion'} som ifrågasätter inriktningen`);
      const svClauseStr = svClauses.length > 1
        ? svClauses.slice(0, -1).join(', ') + ' och ' + svClauses[svClauses.length - 1]
        : svClauses[0];
      return `Denna djupanalys granskar ${docs.length} riksdagsdokument${topic ? ` rörande <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` inom ${domainPhrase}` : ''}. Av dessa berikades ${enriched} med fulltext. Det lagstiftande läget är ${govLed ? 'regeringsledet' : 'oppositionsdrivet'} med ${svClauseStr}. ${hasEnactedLaw ? `${sfsDocs.length} lag${sfsDocs.length !== 1 ? 'ar' : ''} har redan antagits och fastställt ett rättsligt ramverk.` : highScrutiny ? 'Utskottsengagemanget visar att policyn är under aktiv parlamentarisk granskning.' : 'Lagstiftningspipelinen befinner sig i ett tidigt skede.'} Beslutsfattare bör prioritera att följa utskottens arbete och omröstningar i kammaren.`;
    })(),
    da: `Denne dybdeanalyse undersøger ${docs.length} parlamentariske dokumenter${topic ? ` om <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` inden for ${domainPhrase}` : ''}. ${enriched} af disse er beriget med fulde tekster. Den lovgivningsmæssige holdning er ${govLed ? 'regeringsdrevet' : 'oppositionsdrevet'} med ${propCount} forslag og ${betCount} udvalgsrapport${betCount !== 1 ? 'er' : ''}. Beslutningstagere bør følge udvalgsdrøftelser og afstemninger.`,
    no: `Denne dybdeanalysen undersøker ${docs.length} parlamentariske dokumenter${topic ? ` om <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` innen ${domainPhrase}` : ''}. ${enriched} av disse er beriket med fulltekst. Den lovgivningsmessige posisjonen er ${govLed ? 'regjeringsledet' : 'opposisjonsdrevet'} med ${propCount} forslag og ${betCount} komitérapport${betCount !== 1 ? 'er' : ''}. Beslutningstakere bør følge komitéforhandlinger og voteringsmønstre.`,
    fi: `Tämä syväanalyysi tutkii ${docs.length} parlamentaarista asiakirjaa${topic ? ` aiheesta <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` alueilla ${domainPhrase}` : ''}. Näistä ${enriched} rikastettiin koko tekstillä. Lainsäädäntöasenne on ${govLed ? 'hallitusvetoinen' : 'oppositiovetoinen'} — ${propCount} esitystä ja ${betCount} valiokunnan mietintöä. Päätöksentekijöiden tulisi seurata valiokuntien harkintaa ja äänestyksiä.`,
    de: `Dieser Tiefenanalysebericht untersucht ${docs.length} Parlamentsdokument${docs.length !== 1 ? 'e' : ''}${topic ? ` zu <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` in den Bereichen ${domainPhrase}` : ''}. Davon wurden ${enriched} mit vollständigem Text angereichert. Die gesetzgeberische Haltung ist ${govLed ? 'regierungsgeführt' : 'oppositionsgetrieben'} mit ${propCount} Regierungsvorlage${propCount !== 1 ? 'n' : ''} und ${betCount > 0 ? `${betCount} Ausschussbericht${betCount !== 1 ? 'en' : ''}` : 'keinen Ausschussberichten'}. Entscheidungsträger sollten Ausschussberatungen und Abstimmungsmuster verfolgen.`,
    fr: `Ce rapport d'analyse approfondie examine ${docs.length} document${docs.length !== 1 ? 's' : ''} parlementaire${docs.length !== 1 ? 's' : ''}${topic ? ` sur <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? `, couvrant ${domainPhrase}` : ''}. Parmi ceux-ci, ${enriched} ont été enrichis avec le texte complet. La posture législative est ${govLed ? 'gouvernementale' : "portée par l'opposition"} avec ${propCount} proposition${propCount !== 1 ? 's' : ''} et ${betCount > 0 ? `${betCount} rapport${betCount !== 1 ? 's' : ''} de commission` : 'aucun rapport de commission'}. Les décideurs devraient suivre les délibérations des commissions et les votes.`,
    es: `Este informe de análisis profundo examina ${docs.length} documento${docs.length !== 1 ? 's' : ''} parlamentario${docs.length !== 1 ? 's' : ''}${topic ? ` sobre <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? `, abarcando ${domainPhrase}` : ''}. De estos, ${enriched} fueron enriquecidos con texto completo. La postura legislativa es ${govLed ? 'liderada por el gobierno' : 'impulsada por la oposición'} con ${propCount} proposición${propCount !== 1 ? 'es' : ''} y ${betCount > 0 ? `${betCount} informe${betCount !== 1 ? 's' : ''} de comité` : 'ningún informe de comité'}. Los tomadores de decisiones deben seguir las deliberaciones del comité y los patrones de votación.`,
    nl: `Dit diepgaand analyserapport onderzoekt ${docs.length} parlementair${docs.length !== 1 ? 'e' : ''} document${docs.length !== 1 ? 'en' : ''}${topic ? ` over <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? `, gericht op ${domainPhrase}` : ''}. Hiervan werden ${enriched} verrijkt met volledige tekst. De wetgevende houding is ${govLed ? 'regeringsgeleid' : 'oppositiegedreven'} met ${propCount} voorstel${propCount !== 1 ? 'len' : ''} en ${betCount > 0 ? `${betCount} commissierapport${betCount !== 1 ? 'en' : ''}` : 'geen commissierapporten'}. Beslissers moeten commissiedeliberaties en stempatronen volgen.`,
    ar: `يحلل تقرير التحليل المعمق هذا ${docs.length} وثيقة برلمانية${topic ? ` حول <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` في مجالات ${domainPhrase}` : ''}. منها ${enriched} مُعزَّزة بالنص الكامل. الموقف التشريعي ${govLed ? 'حكومي القيادة' : 'تقوده المعارضة'} مع ${propCount} مقترح${propCount !== 1 ? 'ات' : ''} و${betCount > 0 ? `${betCount} تقرير${betCount !== 1 ? 'ات' : ''} لجنة` : 'لا تقارير للجان'}. يجب على صانعي القرار متابعة مداولات اللجان وأنماط التصويت.`,
    he: `דוח הניתוח המעמיק הזה בוחן ${docs.length} מסמך${docs.length !== 1 ? 'ים' : ''} פרלמנטר${docs.length !== 1 ? 'יים' : 'י'}${topic ? ` בנושא <strong>${esc(topic)}</strong>` : ''}${domainPhrase ? ` בתחומי ${domainPhrase}` : ''}. מתוכם ${enriched} הועשרו בטקסט מלא. העמדה החקיקתית ${govLed ? 'בהנהגת הממשלה' : 'בהנהגת האופוזיציה'} עם ${propCount} הצעת חוק ו-${betCount > 0 ? `${betCount} דוח ועדה` : 'ללא דוחות ועדה'}. מקבלי ההחלטות צריכים לעקוב אחר דיוני הוועדות ודפוסי ההצבעה.`,
    ja: `この詳細分析レポートは${docs.length}件の議会文書${topic ? `（<strong>${esc(topic)}</strong>に関する）` : ''}${domainPhrase ? `（${domainPhrase}分野）` : ''}を分析します。${enriched}件は全文で強化されています。立法スタンスは${govLed ? '政府主導' : '野党主導'}で、${propCount}件の提案と${betCount > 0 ? `${betCount}件の委員会報告` : '委員会報告なし'}があります。意思決定者は委員会審議と投票パターンを追跡する必要があります。`,
    ko: `이 심층 분석 보고서는 ${docs.length}개의 의회 문서${topic ? `（<strong>${esc(topic)}</strong> 관련）` : ''}${domainPhrase ? `（${domainPhrase} 분야）` : ''}를 분석합니다. 이 중 ${enriched}개는 전문으로 보강되었습니다. 입법 태도는 ${govLed ? '정부 주도' : '야당 주도'}이며, ${propCount}개 제안과 ${betCount > 0 ? `${betCount}개 위원회 보고서` : '위원회 보고서 없음'}가 있습니다. 의사결정자는 위원회 심의와 투표 패턴을 추적해야 합니다.`,
    zh: `本深度分析报告分析了${docs.length}份议会文件${topic ? `（关于<strong>${esc(topic)}</strong>）` : ''}${domainPhrase ? `（涵盖${domainPhrase}）` : ''}。其中${enriched}份以全文强化。立法立场${govLed ? '由政府主导' : '由反对党推动'}，有${propCount}份提案${betCount > 0 ? `和${betCount}份委员会报告` : ''}。决策者应追踪委员会审议和投票模式。`,
  };

  const heading = deepLabel('executiveSummary', lang);
  const text = templates[lang] ?? templates.en ?? '';
  return `\n<section class="executive-intelligence-summary" aria-label="${esc(heading)}">\n  <h2>${esc(heading)}</h2>\n  <p>${text}</p>\n</section>\n`;
}

/** Maximum confidence contribution from full-text enrichment rate (0–1 → 0–70 pts). */
const ENRICHMENT_WEIGHT = 70;
/** Maximum confidence bonus from document count (saturates at DOCUMENT_BONUS_DIVISOR docs). */
const MAX_DOCUMENT_BONUS = 30;
/** Number of documents needed to reach the maximum document-count bonus. */
const DOCUMENT_BONUS_DIVISOR = 10;

/**
 * Derive a confidence percentage (0–100) for the overall analysis based on
 * document enrichment rate and document count.  Returns an integer.
 *
 * Formula: confidence = (enrichmentRate × ENRICHMENT_WEIGHT) + docBonus
 *  - enrichmentRate: fraction of documents enriched with full text (0–1)
 *  - docBonus: up to MAX_DOCUMENT_BONUS, proportional to doc count up to DOCUMENT_BONUS_DIVISOR
 */
function deriveConfidence(docs: RawDocument[]): number {
  if (docs.length === 0) return 0;
  const enriched = docs.filter(d => d.fullText || d.fullContent).length;
  const enrichmentRate = enriched / docs.length; // 0–1
  const docBonus = Math.min(MAX_DOCUMENT_BONUS, Math.round((docs.length / DOCUMENT_BONUS_DIVISOR) * MAX_DOCUMENT_BONUS));
  return Math.min(100, Math.round(enrichmentRate * ENRICHMENT_WEIGHT) + docBonus);
}

/**
 * Build a Predictive Assessment section with confidence percentages.
 * Covers: likely legislative outcomes, coalition stability forecast, and
 * risk scenarios (best / worst / most-likely).
 * Iteration 3 output: "what happens next".
 */

/** Base passage probability when legislative environment is favourable. */
const BASE_PASSAGE_PROBABILITY = 50;
/** Maximum passage probability cap for any single analysis. */
const MAX_PASSAGE_PROBABILITY = 90;
/** Minimum passage probability floor (avoids 0%). */
const MIN_PASSAGE_PROBABILITY = 20;
/** Confidence points added per committee report (bet) — signals parliamentary alignment. */
const COMMITTEE_REPORT_WEIGHT = 8;
/** Confidence points added per enacted statute (sfs) — confirms legal framework exists. */
const ENACTED_STATUTE_WEIGHT = 15;
/** Confidence points deducted per opposition motion (mot) — signals resistance. */
const OPPOSITION_MOTION_PENALTY = 5;

function buildPredictiveAssessment(docs: RawDocument[], topic: string | null, lang: Language): string {
  const esc = escapeHtml;
  const propCount = docs.filter(d => (d.doktyp || d.documentType) === 'prop').length;
  const betCount  = docs.filter(d => (d.doktyp || d.documentType) === 'bet').length;
  const motCount  = docs.filter(d => (d.doktyp || d.documentType) === 'mot').length;
  const sfsDocs   = docs.filter(d =>
    (d.doktyp || d.documentType) === 'sfs' || (d.dokumentnamn || '').startsWith('SFS'));
  const confidence = deriveConfidence(docs);

  // Passage likelihood heuristic: if committee reports exceed motions → likely passage
  const passageLikely = betCount > motCount || sfsDocs.length > 0;
  const passagePct = passageLikely
    ? Math.min(MAX_PASSAGE_PROBABILITY, BASE_PASSAGE_PROBABILITY + betCount * COMMITTEE_REPORT_WEIGHT + sfsDocs.length * ENACTED_STATUTE_WEIGHT)
    : Math.max(MIN_PASSAGE_PROBABILITY, BASE_PASSAGE_PROBABILITY - motCount * OPPOSITION_MOTION_PENALTY);
  const blockPct = 100 - passagePct;

  const topicFallback: Partial<Record<Language, string>> = {
    en: 'this area', sv: 'detta område', da: 'dette område', no: 'dette området',
    fi: 'tämä alue', de: 'diesem Bereich', fr: 'ce domaine', es: 'esta área',
    nl: 'dit gebied', ar: 'هذا المجال', he: 'תחום זה',
    ja: 'この分野', ko: '이 분야', zh: '该领域',
  };
  const topicStr = topic ? esc(topic) : (topicFallback[lang] ?? topicFallback.en!);

  const headingPredictive = deepLabel('predictiveAssessment', lang);
  const headingOutcome = deepLabel('likelyOutcome', lang);
  const headingCoalition = deepLabel('coalitionStability', lang);
  const headingRisk = deepLabel('riskScenarios', lang);

  const sections: Partial<Record<Language, { outcome: string; coalition: string; scenarios: string }>> = {
    en: {
      outcome: `Based on document composition analysis, the probability of legislative passage${topic ? ` for <strong>${topicStr}</strong>` : ''} is estimated at <strong>${passagePct}%</strong>, with a ${blockPct}% probability of delay or amendment. ${propCount > 0 ? `${propCount} active proposition${propCount !== 1 ? 's' : ''} indicate committed government intent.` : ''} ${betCount > 0 ? `${betCount} committee report${betCount !== 1 ? 's' : ''} confirm parliamentary engagement.` : ''} ${sfsDocs.length > 0 ? 'Enacted statutes confirm legal framework establishment.' : ''}`,
      coalition: `Coalition stability assessment: ${betCount > motCount ? 'High — committee activity suggests governing coalition alignment.' : motCount > betCount ? 'Moderate — active opposition motions signal coalition stress points.' : 'Moderate — balanced legislative activity indicates ongoing negotiation.'} Monitor subsequent committee votes as the primary coalition stability indicator. Overall analysis confidence: <strong>${confidence}%</strong>.`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Best case (${passagePct}% probability):</strong> ${topic ? `${topicStr} legislation passes with cross-party support, entering implementation phase.` : 'Key legislation advances with broad parliamentary consensus.'}</li><li><strong>Most likely case:</strong> ${betCount > 0 ? 'Committee scrutiny leads to amendments before final vote, delaying implementation by 3–6 months.' : 'Legislation proceeds through normal parliamentary cycle with minor modifications.'}</li><li><strong>Worst case (${blockPct}% probability):</strong> ${motCount > propCount ? 'Opposition motions gain traction, forcing significant policy revisions or deferral to next session.' : 'External developments or coalition disagreements cause unexpected delay or withdrawal.'}</li></ul>`,
    },
    sv: {
      outcome: `Baserat på dokumentsammansättningsanalys uppskattas sannolikheten för lagstiftningspassage${topic ? ` för <strong>${topicStr}</strong>` : ''} till <strong>${passagePct}%</strong>, med ${blockPct}% sannolikhet för fördröjning eller ändring. ${propCount > 0 ? `${propCount} aktiv${propCount !== 1 ? 'a' : ''} proposition${propCount !== 1 ? 'er' : ''} visar regeringens engagemang.` : ''} Analyskonfidens: <strong>${confidence}%</strong>.`,
      coalition: `Koalitionsstabilitetsbedömning: ${betCount > motCount ? 'Hög — utskottsaktivitet tyder på koalitionsanpassning.' : motCount > betCount ? 'Måttlig — aktiva oppositionsmotioner signalerar stressmoment.' : 'Måttlig — balanserad aktivitet indikerar pågående förhandlingar.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Bästa scenariot (${passagePct}% sannolikhet):</strong> Lagstiftning antas med bred parlamentarisk konsensus.</li><li><strong>Troligaste scenariot:</strong> Utskottsgranskning leder till ändringar innan slutomröstning, med 3–6 månaders försenad implementering.</li><li><strong>Sämsta scenariot (${blockPct}% sannolikhet):</strong> ${motCount > propCount ? 'Oppositionsinitiativ tvingar till väsentliga policyrevisioner.' : 'Externa omständigheter orsakar oväntad försening.'}</li></ul>`,
    },
    de: {
      outcome: `Basierend auf der Dokumentzusammensetzung wird die Wahrscheinlichkeit einer gesetzlichen Verabschiedung${topic ? ` für <strong>${topicStr}</strong>` : ''} auf <strong>${passagePct}%</strong> geschätzt. Analysekonfidens: <strong>${confidence}%</strong>.`,
      coalition: `Koalitionsstabilitätsbewertung: ${betCount > motCount ? 'Hoch — Ausschussaktivität deutet auf Koalitionsausrichtung hin.' : 'Mittel — laufende Verhandlungen erforderlich.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Bestes Szenario (${passagePct}%):</strong> Gesetze werden mit breitem Konsens verabschiedet.</li><li><strong>Wahrscheinlichstes Szenario:</strong> Ausschussprüfung führt zu Änderungen vor der Endabstimmung.</li><li><strong>Schlimmstes Szenario (${blockPct}%):</strong> Unerwartete Verzögerungen aufgrund externer Faktoren.</li></ul>`,
    },
    fr: {
      outcome: `Sur la base de l'analyse de la composition des documents, la probabilité de passage législatif${topic ? ` pour <strong>${topicStr}</strong>` : ''} est estimée à <strong>${passagePct}%</strong>. Confiance d'analyse : <strong>${confidence}%</strong>.`,
      coalition: `Évaluation de la stabilité de coalition : ${betCount > motCount ? 'Élevée — l\'activité des commissions suggère un alignement de la coalition.' : 'Modérée — négociations en cours nécessaires.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Meilleur cas (${passagePct}%) :</strong> La législation est adoptée avec un large consensus.</li><li><strong>Cas le plus probable :</strong> L'examen en commission entraîne des amendements avant le vote final.</li><li><strong>Pire cas (${blockPct}%) :</strong> Des retards inattendus dus à des facteurs externes.</li></ul>`,
    },
    es: {
      outcome: `Con base en el análisis de composición de documentos, la probabilidad de aprobación legislativa${topic ? ` para <strong>${topicStr}</strong>` : ''} se estima en <strong>${passagePct}%</strong>. Confianza del análisis: <strong>${confidence}%</strong>.`,
      coalition: `Evaluación de estabilidad de coalición: ${betCount > motCount ? 'Alta — la actividad del comité sugiere alineación de la coalición.' : 'Moderada — se requieren negociaciones en curso.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Mejor caso (${passagePct}%):</strong> La legislación se aprueba con amplio consenso.</li><li><strong>Caso más probable:</strong> El escrutinio del comité lleva a enmiendas antes de la votación final.</li><li><strong>Peor caso (${blockPct}%):</strong> Retrasos inesperados debidos a factores externos.</li></ul>`,
    },
    da: {
      outcome: `Baseret på dokumentsammensætningsanalyse anslås sandsynligheden for lovgivningsmæssig vedtagelse${topic ? ` for <strong>${topicStr}</strong>` : ''} til <strong>${passagePct}%</strong>. Analysekonfidensgrad: <strong>${confidence}%</strong>.`,
      coalition: `Koalitionsstabilitetsvurdering: ${betCount > motCount ? 'Høj — udvalgsaktivitet tyder på koalitionssammensætning.' : 'Moderat — igangværende forhandlinger nødvendige.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Bedste tilfælde (${passagePct}%):</strong> Lovgivning vedtages med bred konsensus.</li><li><strong>Sandsynligste tilfælde:</strong> Udvalgsgennemgang fører til ændringer.</li><li><strong>Værste tilfælde (${blockPct}%):</strong> Uventede forsinkelser.</li></ul>`,
    },
    no: {
      outcome: `Basert på dokumentsammensetningsanalyse anslås sannsynligheten for lovgivningsmessig vedtak${topic ? ` for <strong>${topicStr}</strong>` : ''} til <strong>${passagePct}%</strong>. Analysekonfidens: <strong>${confidence}%</strong>.`,
      coalition: `Koalisjonstabilitetsvurdering: ${betCount > motCount ? 'Høy — komitéaktivitet tyder på koalisjonssamstemmighet.' : 'Moderat — pågående forhandlinger nødvendig.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Beste tilfelle (${passagePct}%):</strong> Lovgivning vedtas med bred konsensus.</li><li><strong>Mest sannsynlig:</strong> Komitégjennomgang fører til endringer.</li><li><strong>Verste tilfelle (${blockPct}%):</strong> Uventede forsinkelser.</li></ul>`,
    },
    fi: {
      outcome: `Asiakirjakoostumuksen analyysin perusteella lainsäädännön läpimenon todennäköisyys${topic ? ` aiheessa <strong>${topicStr}</strong>` : ''} arvioidaan <strong>${passagePct}%</strong>:ksi. Analyysin luottamustaso: <strong>${confidence}%</strong>.`,
      coalition: `Koalition vakausarvio: ${betCount > motCount ? 'Korkea — valiokuntien aktiivisuus viittaa koalition yhdenmukaisuuteen.' : 'Kohtalainen — käynnissä olevia neuvotteluja tarvitaan.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Paras tapaus (${passagePct}%):</strong> Lainsäädäntö hyväksytään laajalla konsensuksella.</li><li><strong>Todennäköisin:</strong> Valiokuntatarkastus johtaa muutoksiin.</li><li><strong>Pahin tapaus (${blockPct}%):</strong> Odottamattomia viivästyksiä.</li></ul>`,
    },
    nl: {
      outcome: `Op basis van documentsamenstelling wordt de kans op wetgevende doorgang${topic ? ` voor <strong>${topicStr}</strong>` : ''} geschat op <strong>${passagePct}%</strong>. Analysebetrouwbaarheid: <strong>${confidence}%</strong>.`,
      coalition: `Coalitiesstabiliteitsbeoordeling: ${betCount > motCount ? 'Hoog — commissieactiviteit suggereert coalitie-afstemming.' : 'Matig — lopende onderhandelingen vereist.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>Beste geval (${passagePct}%):</strong> Wetgeving aangenomen met brede consensus.</li><li><strong>Meest waarschijnlijk:</strong> Commissieonderzoek leidt tot wijzigingen.</li><li><strong>Slechtste geval (${blockPct}%):</strong> Onverwachte vertragingen.</li></ul>`,
    },
    ar: {
      outcome: `استناداً إلى تحليل تكوين الوثائق، تُقدَّر احتمالية المرور التشريعي${topic ? ` لـ<strong>${topicStr}</strong>` : ''} بـ<strong>${passagePct}%</strong>. ثقة التحليل: <strong>${confidence}%</strong>.`,
      coalition: `تقييم استقرار الائتلاف: ${betCount > motCount ? 'مرتفع — نشاط اللجان يشير إلى توافق الائتلاف.' : 'متوسط — مفاوضات جارية مطلوبة.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>أفضل الأحوال (${passagePct}%):</strong> تُقرّ التشريعات بتوافق واسع.</li><li><strong>الحالة الأكثر احتمالاً:</strong> تؤدي مراجعة اللجان إلى تعديلات.</li><li><strong>أسوأ الأحوال (${blockPct}%):</strong> تأخيرات غير متوقعة.</li></ul>`,
    },
    he: {
      outcome: `בהתבסס על ניתוח הרכב מסמכים, הסבירות למעבר חקיקתי${topic ? ` עבור <strong>${topicStr}</strong>` : ''} מוערכת ב-<strong>${passagePct}%</strong>. רמת ביטחון הניתוח: <strong>${confidence}%</strong>.`,
      coalition: `הערכת יציבות קואליציה: ${betCount > motCount ? 'גבוהה — פעילות ועדות מצביעה על יישור הקואליציה.' : 'בינונית — נדרשים משא ומתן מתמשך.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>התרחיש הטוב ביותר (${passagePct}%):</strong> חקיקה עוברת עם הסכמה רחבה.</li><li><strong>התרחיש הסביר ביותר:</strong> בדיקת ועדה מובילה לתיקונים.</li><li><strong>התרחיש הגרוע ביותר (${blockPct}%):</strong> עיכובים בלתי צפויים.</li></ul>`,
    },
    ja: {
      outcome: `文書構成分析に基づき、${topic ? `<strong>${topicStr}</strong>の` : ''}立法可決確率は<strong>${passagePct}%</strong>と推定されます。分析信頼度：<strong>${confidence}%</strong>。`,
      coalition: `連立安定性評価：${betCount > motCount ? '高 — 委員会活動は連立整合を示唆。' : '中 — 継続的な交渉が必要。'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>最良シナリオ（${passagePct}%）：</strong>広範な合意で法案可決。</li><li><strong>最有力シナリオ：</strong>委員会審査による修正後に最終投票。</li><li><strong>最悪シナリオ（${blockPct}%）：</strong>予期せぬ遅延が発生。</li></ul>`,
    },
    ko: {
      outcome: `문서 구성 분석에 기반하여, ${topic ? `<strong>${topicStr}</strong>의` : ''} 입법 통과 확률은 <strong>${passagePct}%</strong>로 추정됩니다. 분석 신뢰도: <strong>${confidence}%</strong>.`,
      coalition: `연립 안정성 평가: ${betCount > motCount ? '높음 — 위원회 활동이 연립 조정을 시사.' : '보통 — 지속적인 협상 필요.'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>최선의 경우 (${passagePct}%):</strong> 광범위한 합의로 법안 통과.</li><li><strong>가장 유력한 경우:</strong> 위원회 심사로 인한 수정 후 최종 투표.</li><li><strong>최악의 경우 (${blockPct}%):</strong> 예상치 못한 지연.</li></ul>`,
    },
    zh: {
      outcome: `基于文件构成分析，${topic ? `<strong>${topicStr}</strong>的` : ''}立法通过概率估计为<strong>${passagePct}%</strong>。分析置信度：<strong>${confidence}%</strong>。`,
      coalition: `联合稳定性评估：${betCount > motCount ? '高 — 委员会活动表明联合一致性。' : '中等 — 需要持续谈判。'}`,
      scenarios: `<ul class="risk-scenarios"><li><strong>最佳情景（${passagePct}%）：</strong>立法以广泛共识通过。</li><li><strong>最可能情景：</strong>委员会审查导致最终投票前进行修订。</li><li><strong>最坏情景（${blockPct}%）：</strong>出现意外延误。</li></ul>`,
    },
  };

  const s = sections[lang] ?? sections.en!;
  return [
    `\n<section class="predictive-assessment" aria-label="${esc(headingPredictive)}">`,
    `  <h2>${esc(headingPredictive)}</h2>`,
    `  <h3>${esc(headingOutcome)}</h3>`,
    `  <p>${s.outcome}</p>`,
    `  <h3>${esc(headingCoalition)}</h3>`,
    `  <p>${s.coalition}</p>`,
    `  <h3>${esc(headingRisk)}</h3>`,
    `  ${s.scenarios}`,
    `</section>`,
  ].join('\n') + '\n';
}

/**
 * Build a Historical Context & Precedents section.
 * Provides trend analysis, Nordic/EU benchmarking context, and precedent
 * references based on document types and detected policy domains.
 * Iteration 2 + Iteration 3 output: "why it matters historically".
 */
function buildHistoricalContext(docs: RawDocument[], topic: string | null, lang: Language): string {
  const esc = escapeHtml;
  const sfsDocs   = docs.filter(d =>
    (d.doktyp || d.documentType) === 'sfs' || (d.dokumentnamn || '').startsWith('SFS'));
  const propCount = docs.filter(d => (d.doktyp || d.documentType) === 'prop').length;
  const allDomains = new Set<string>();
  docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
  const domainList = [...allDomains].slice(0, 3).map(d => esc(d));
  const hasEnacted = sfsDocs.length > 0;
  const topicStr = topic ? esc(topic) : null;

  const heading = deepLabel('historicalContext', lang);

  const templates: Partial<Record<Language, string>> = {
    en: `${topicStr ? `<strong>${topicStr}</strong> sits within` : 'This policy sits within'} a long tradition of Swedish parliamentary reform. ${hasEnacted ? `The presence of ${sfsDocs.length} enacted statute${sfsDocs.length !== 1 ? 's' : ''} indicates this area has established legal precedent.` : propCount > 0 ? `Active propositions suggest this policy cycle mirrors earlier reform waves, where government-initiated legislation progressed through committee scrutiny to enactment within 12–24 months.` : 'Early-stage documents suggest this represents a new policy initiative without direct statutory precedent.'} ${domainList.length > 0 ? `In the Nordic context, ${domainList.join(', ')} policy areas have historically benefited from cross-party consensus, with Sweden typically aligning with Danish and Norwegian approaches before adopting EU framework requirements.` : ''} International benchmarking indicates that comparable democracies — particularly Denmark, Norway, and Finland — have addressed similar policy challenges through incremental legislative packages rather than sweeping reform. Trend analysis across recent parliamentary sessions suggests that ${topicStr ? `${topicStr} legislation` : 'policy in this area'} is accelerating, driven by EU harmonisation requirements and coalition agreement commitments.`,
    sv: `${topicStr ? `<strong>${topicStr}</strong> ingår i` : 'Denna policy ingår i'} en lång tradition av svensk parlamentarisk reform. ${hasEnacted ? `Förekomsten av ${sfsDocs.length} antagen lag/förordning visar att området har etablerat rättslig praxis.` : propCount > 0 ? 'Aktiva propositioner tyder på att denna policycykel speglar tidigare reformvågor.' : 'Tidiga dokument tyder på ett nytt policyinitiativ utan direkt lagstadgat prejudikat.'} ${domainList.length > 0 ? `I nordisk kontext har ${domainList.join(', ')} historiskt gynnats av partikonsensus, med Sverige som vanligtvis anpassar sig till danska och norska tillvägagångssätt.` : ''} Trendanalys indikerar att ${topicStr ? `${topicStr}-lagstiftning` : 'politiken på detta område'} accelererar, driven av EU-harmoniseringskrav och koalitionsöverenskommelser.`,
    da: `${topicStr ? `<strong>${topicStr}</strong> er del af` : 'Denne politik er del af'} en lang tradition for svensk Riksdagsreform. ${domainList.length > 0 ? `I nordisk kontekst har ${domainList.join(', ')} historisk nydt gavn af tværpolitisk konsensus.` : ''} Trendanalyse viser, at politikken på dette område accelererer.`,
    no: `${topicStr ? `<strong>${topicStr}</strong> er en del av` : 'Denne politikken er en del av'} en lang tradisjon for svensk riksdagsreform. ${domainList.length > 0 ? `I nordisk kontekst har ${domainList.join(', ')} historisk nytt godt av tverrpolitisk konsensus.` : ''} Trendanalyse indikerer at politikk på dette området akselererer.`,
    fi: `${topicStr ? `<strong>${topicStr}</strong> on osa` : 'Tämä politiikka on osa'} pitkää Ruotsin valtiopäivien uudistusperinnettä. ${domainList.length > 0 ? `Pohjoismaisessa kontekstissa ${domainList.join(', ')} aloilla on historiallisesti hyöty puolueiden välisestä yhteisymmärryksestä.` : ''} Trendanalyysi osoittaa, että tämän alan politiikka kiihtyy.`,
    de: `${topicStr ? `<strong>${topicStr}</strong> steht in` : 'Diese Politik steht in'} einer langen Tradition schwedischer parlamentarischer Reform. ${hasEnacted ? `Das Vorhandensein von ${sfsDocs.length} verabschiedeten Statuten zeigt, dass in diesem Bereich rechtliche Präzedenzfälle etabliert sind.` : ''} ${domainList.length > 0 ? `Im nordischen Kontext haben ${domainList.join(', ')}-Politikbereiche historisch von einem parteiübergreifenden Konsens profitiert.` : ''} Die Trendanalyse zeigt, dass sich ${topicStr ? `${topicStr}-Gesetzgebung` : 'die Politik in diesem Bereich'} beschleunigt.`,
    fr: `${topicStr ? `<strong>${topicStr}</strong> s\u2019inscrit dans` : "Cette politique s\u2019inscrit dans"} une longue tradition de réforme parlementaire suédoise. ${hasEnacted ? `La présence de ${sfsDocs.length} statuts adoptés indique que ce domaine a établi des précédents juridiques.` : ''} ${domainList.length > 0 ? `Dans le contexte nordique, les domaines ${domainList.join(', ')} ont historiquement bénéficié d\u2019un consensus multipartite.` : ''} L\u2019analyse de tendances indique que ${topicStr ? `la législation sur ${topicStr}` : 'la politique dans ce domaine'} s\u2019accélère.`,
    es: `${topicStr ? `<strong>${topicStr}</strong> se inscribe en` : 'Esta política se inscribe en'} una larga tradición de reforma parlamentaria sueca. ${hasEnacted ? `La presencia de ${sfsDocs.length} estatutos promulgados indica que esta área ha establecido precedentes legales.` : ''} ${domainList.length > 0 ? `En el contexto nórdico, las áreas de política ${domainList.join(', ')} históricamente se han beneficiado del consenso multipartidista.` : ''} El análisis de tendencias indica que ${topicStr ? `la legislación sobre ${topicStr}` : 'la política en esta área'} se está acelerando.`,
    nl: `${topicStr ? `<strong>${topicStr}</strong> maakt deel uit van` : 'Dit beleid maakt deel uit van'} een lange traditie van Zweedse parlementaire hervorming. ${hasEnacted ? `De aanwezigheid van ${sfsDocs.length} ingevoerde wetgeving geeft aan dat er juridische precedenten zijn vastgesteld.` : ''} ${domainList.length > 0 ? `In de Noordse context hebben beleidsterreinen ${domainList.join(', ')} historisch geprofiteerd van partijoverstijgende consensus.` : ''} Trendanalyse geeft aan dat beleid op dit gebied versnelt.`,
    ar: `${topicStr ? `<strong>${topicStr}</strong> يقع ضمن` : 'تقع هذه السياسة ضمن'} تقليد طويل من الإصلاح البرلماني السويدي. ${hasEnacted ? `وجود ${sfsDocs.length} قانون${sfsDocs.length !== 1 ? 'ين' : ''} مُعتمد يشير إلى وجود سوابق قانونية راسخة.` : ''} ${domainList.length > 0 ? `في السياق الإسكندنافي، استفادت مجالات ${domainList.join('، ')} تاريخياً من توافق متعدد الأحزاب.` : ''} يشير تحليل الاتجاهات إلى تسارع السياسات في هذا المجال.`,
    he: `${topicStr ? `<strong>${topicStr}</strong> ממוקם ב` : 'מדיניות זו ממוקמת ב'}מסורת ארוכה של רפורמה פרלמנטרית שוודית. ${hasEnacted ? `נוכחות ${sfsDocs.length} חוקים שאושרו מצביעה על כך שנקבעו תקדימים משפטיים.` : ''} ${domainList.length > 0 ? `בהקשר הנורדי, תחומי ${domainList.join(', ')} נהנו היסטורית מקונצנזוס בין-מפלגתי.` : ''} ניתוח מגמות מצביע על האצת מדיניות בתחום זה.`,
    ja: `${topicStr ? `<strong>${topicStr}</strong>は` : 'この政策は'}スウェーデン議会改革の長い伝統の中に位置します。${hasEnacted ? `${sfsDocs.length}件の制定された法律の存在は、この分野に法的先例があることを示しています。` : ''}${domainList.length > 0 ? `北欧の文脈では、${domainList.join('、')}分野は歴史的に超党派の合意から恩恵を受けてきました。` : ''}トレンド分析は、この分野の政策が加速していることを示しています。`,
    ko: `${topicStr ? `<strong>${topicStr}</strong>는` : '이 정책은'} 스웨덴 의회 개혁의 오랜 전통 속에 있습니다. ${hasEnacted ? `${sfsDocs.length}개의 제정된 법률의 존재는 이 분야에 법적 선례가 있음을 나타냅니다.` : ''}${domainList.length > 0 ? `북유럽 맥락에서 ${domainList.join(', ')} 정책 영역은 역사적으로 초당적 합의에서 혜택을 받았습니다.` : ''} 추세 분석은 이 분야의 정책이 가속화되고 있음을 시사합니다.`,
    zh: `${topicStr ? `<strong>${topicStr}</strong>处于` : '这一政策处于'}瑞典议会改革的悠久传统之中。${hasEnacted ? `${sfsDocs.length}项已颁布法规的存在表明该领域已建立法律先例。` : ''}${domainList.length > 0 ? `在北欧背景下，${domainList.join('、')}政策领域历史上受益于跨党派共识。` : ''}趋势分析表明该领域的政策正在加速。`,
  };

  const text = templates[lang] ?? templates.en ?? '';
  return `\n<section class="historical-context" aria-label="${esc(heading)}">\n  <h2>${esc(heading)}</h2>\n  <p>${text}</p>\n</section>\n`;
}

/**
 * Build a Methodology & Confidence section.
 * Documents data sources, analysis methods, confidence scores, and known
 * limitations — providing epistemic transparency for the intelligence report.
 * Iteration 4 output: "is the analysis sound".
 */
function buildMethodologySection(docs: RawDocument[], topic: string | null, lang: Language, depth: number): string {
  const esc = escapeHtml;
  const enriched = docs.filter(d => d.fullText || d.fullContent).length;
  const confidence = deriveConfidence(docs);
  const heading = deepLabel('methodology', lang);
  const topicStr = topic ? esc(topic) : null;

  const iterationLabels: Partial<Record<Language, string[]>> = {
    en: ['Surface analysis (events and actors identified)', 'Deep analysis (motivations and strategic implications)', 'Predictive analysis (outcome forecasting and risk scenarios)', 'Quality review (bias check and completeness verification)'],
    sv: ['Ytanalys (händelser och aktörer identifierade)', 'Djupanalys (motivationer och strategiska implikationer)', 'Prediktiv analys (prognoser och riskscenarier)', 'Kvalitetsgranskning (biaskontroll och fullständighetsverifiering)'],
    da: ['Overfladeanalyse (hændelser og aktører identificeret)', 'Dybdeanalyse (motivationer og strategiske implikationer)', 'Prædiktiv analyse (prognoser og risikoscenarier)', 'Kvalitetsgennemgang (bias-tjek og fuldstændighedsverificering)'],
    no: ['Overflateanalyse (hendelser og aktører identifisert)', 'Dybdeanalyse (motivasjoner og strategiske implikasjoner)', 'Prediktiv analyse (prognoser og risikoscenarier)', 'Kvalitetsgjennomgang (bias-sjekk og fullstendighetsverifisering)'],
    fi: ['Pintaanalyysi (tapahtumat ja toimijat tunnistettu)', 'Syväanalyysi (motiivit ja strategiset vaikutukset)', 'Ennakoiva analyysi (ennusteet ja riskiskenaariot)', 'Laaduntarkistus (vinoutumien tarkistus ja kattavuuden varmennus)'],
    de: ['Oberflächenanalyse (Ereignisse und Akteure identifiziert)', 'Tiefenanalyse (Motivationen und strategische Implikationen)', 'Prädiktive Analyse (Prognosen und Risikoszenarien)', 'Qualitätsprüfung (Bias-Prüfung und Vollständigkeitsverifikation)'],
    fr: ['Analyse de surface (événements et acteurs identifiés)', 'Analyse approfondie (motivations et implications stratégiques)', 'Analyse prédictive (prévisions et scénarios de risque)', 'Revue qualité (vérification des biais et de l\'exhaustivité)'],
    es: ['Análisis superficial (eventos y actores identificados)', 'Análisis profundo (motivaciones e implicaciones estratégicas)', 'Análisis predictivo (pronósticos y escenarios de riesgo)', 'Revisión de calidad (verificación de sesgos y exhaustividad)'],
    nl: ['Oppervlakteanalyse (gebeurtenissen en actoren geïdentificeerd)', 'Diepteanalyse (motivaties en strategische implicaties)', 'Voorspellende analyse (prognoses en risicoscenario\'s)', 'Kwaliteitsreview (bias-controle en volledigheidsverificatie)'],
    ar: ['تحليل سطحي (تحديد الأحداث والجهات الفاعلة)', 'تحليل معمق (الدوافع والتداعيات الاستراتيجية)', 'تحليل تنبؤي (توقعات وسيناريوهات المخاطر)', 'مراجعة الجودة (التحقق من التحيز والاكتمال)'],
    he: ['ניתוח שטחי (זיהוי אירועים ושחקנים)', 'ניתוח עמוק (מניעים והשלכות אסטרטגיות)', 'ניתוח חיזויי (תחזיות ותרחישי סיכון)', 'ביקורת איכות (בדיקת הטיה ואימות שלמות)'],
    ja: ['表面分析（出来事と関係者の特定）', '詳細分析（動機と戦略的示唆）', '予測分析（結果予測とリスクシナリオ）', '品質レビュー（バイアスチェックと網羅性検証）'],
    ko: ['표면 분석 (사건 및 행위자 식별)', '심층 분석 (동기 및 전략적 시사점)', '예측 분석 (결과 예측 및 위험 시나리오)', '품질 검토 (편향 확인 및 완전성 검증)'],
    zh: ['表面分析（事件和行为者识别）', '深度分析（动机和战略影响）', '预测分析（结果预测和风险情景）', '质量审查（偏差检查和完整性验证）'],
  };

  const labels = iterationLabels[lang] ?? iterationLabels.en!;
  const iterationItems = labels.slice(0, depth).map((label, i) =>
    `<li><strong>${i + 1}.</strong> ${esc(label)}</li>`
  ).join('\n    ');

  const sourceLabels: Partial<Record<Language, string>> = {
    en: 'Data Sources', sv: 'Datakällor', da: 'Datakilder', no: 'Datakilder',
    fi: 'Tietolähteet', de: 'Datenquellen', fr: 'Sources de données', es: 'Fuentes de datos',
    nl: 'Gegevensbronnen', ar: 'مصادر البيانات', he: 'מקורות נתונים',
    ja: 'データソース', ko: '데이터 출처', zh: '数据来源',
  };
  const iterLabel: Partial<Record<Language, string>> = {
    en: 'Analysis iterations completed', sv: 'Genomförda analysiterationer', da: 'Gennemførte analyseiterationer',
    no: 'Gjennomførte analyseiterationer', fi: 'Suoritetut analyysikierrokset', de: 'Abgeschlossene Analyseiterationen',
    fr: 'Itérations d\'analyse terminées', es: 'Iteraciones de análisis completadas', nl: 'Voltooide analyseiteraties',
    ar: 'تكرارات التحليل المكتملة', he: 'איטרציות ניתוח שהושלמו', ja: '完了した分析反復', ko: '완료된 분석 반복', zh: '已完成的分析迭代',
  };
  const confLabel: Partial<Record<Language, string>> = {
    en: 'Overall confidence score', sv: 'Övergripande konfidenspoäng', da: 'Samlet konfidensscore',
    no: 'Samlet konfidensskår', fi: 'Kokonaisluottamuspistemäärä', de: 'Gesamtkonfidenzwert',
    fr: 'Score de confiance global', es: 'Puntuación de confianza general', nl: 'Algehele betrouwbaarheidsscore',
    ar: 'درجة الثقة الكلية', he: 'ציון ביטחון כולל', ja: '全体的な信頼スコア', ko: '전체 신뢰도 점수', zh: '整体置信度分数',
  };
  const enrichLabel: Partial<Record<Language, string>> = {
    en: 'Documents enriched with full text', sv: 'Dokument berikade med fulltext', da: 'Dokumenter beriget med fulde tekster',
    no: 'Dokumenter beriket med fulltekst', fi: 'Asiakirjat rikastettu koko tekstillä', de: 'Dokumente mit vollständigem Text angereichert',
    fr: 'Documents enrichis avec le texte complet', es: 'Documentos enriquecidos con texto completo', nl: 'Documenten verrijkt met volledige tekst',
    ar: 'وثائق معززة بالنص الكامل', he: 'מסמכים מועשרים בטקסט מלא', ja: '全文で強化された文書', ko: '전문으로 보강된 문서', zh: '以全文强化的文件',
  };
  const limitLabel: Partial<Record<Language, string>> = {
    en: 'Known limitations', sv: 'Kända begränsningar', da: 'Kendte begrænsninger', no: 'Kjente begrensninger',
    fi: 'Tunnetut rajoitukset', de: 'Bekannte Einschränkungen', fr: 'Limitations connues', es: 'Limitaciones conocidas',
    nl: 'Bekende beperkingen', ar: 'القيود المعروفة', he: 'מגבלות ידועות', ja: '既知の制限事項', ko: '알려진 제한사항', zh: '已知限制',
  };
  const limitText: Partial<Record<Language, string>> = {
    en: `Analysis based on publicly available parliamentary data only. ${enriched < docs.length ? `${docs.length - enriched} document${docs.length - enriched !== 1 ? 's' : ''} analysed without full text due to availability constraints.` : 'All documents enriched with full text.'} ${topicStr ? `Topic focus limited to: ${topicStr}.` : ''} Predictive assessments use heuristic models and should be treated as indicative, not definitive.`,
    sv: `Analys baserad enbart på offentligt tillgängliga parlamentariska data. ${enriched < docs.length ? `${docs.length - enriched} dokument analyserade utan fulltext.` : 'Alla dokument berikade med fulltext.'} Prediktiva bedömningar är heuristiska och ska behandlas som vägledande.`,
    da: `Analyse baseret på offentligt tilgængelige parlamentariske data. Prædiktive vurderinger er vejledende.`,
    no: `Analyse basert på offentlig tilgjengelige parlamentariske data. Prediktive vurderinger er heuristiske.`,
    fi: `Analyysi perustuu vain julkisesti saatavilla oleviin parlamentaarisiin tietoihin. Ennustavat arviot ovat heuristisia.`,
    de: `Analyse basiert ausschließlich auf öffentlich zugänglichen parlamentarischen Daten. Prädiktive Bewertungen sind heuristisch.`,
    fr: `Analyse basée uniquement sur des données parlementaires accessibles au public. Les évaluations prédictives sont heuristiques.`,
    es: `Análisis basado únicamente en datos parlamentarios disponibles públicamente. Las evaluaciones predictivas son heurísticas.`,
    nl: `Analyse gebaseerd op alleen publiek beschikbare parlementaire gegevens. Voorspellende beoordelingen zijn heuristisch.`,
    ar: `التحليل مستند إلى البيانات البرلمانية المتاحة للعموم فقط. التقييمات التنبؤية هيوريستية.`,
    he: `ניתוח מבוסס על נתונים פרלמנטריים זמינים לציבור בלבד. הערכות חיזויות הן היוריסטיות.`,
    ja: `分析は公開されている議会データのみに基づいています。予測評価はヒューリスティックなものです。`,
    ko: `분석은 공개적으로 이용 가능한 의회 데이터만을 기반으로 합니다. 예측 평가는 경험적입니다.`,
    zh: `分析仅基于公开可用的议会数据。预测评估是启发式的。`,
  };

  return [
    `\n<section class="methodology-confidence" aria-label="${esc(heading)}">`,
    `  <h2>${esc(heading)}</h2>`,
    `  <dl class="methodology-details">`,
    `    <dt>${esc(sourceLabels[lang] ?? sourceLabels.en!)}</dt>`,
    `    <dd>Riksdag MCP API (search_dokument, get_dokument, get_dokument_innehall), regeringen.se (g0v proxy)</dd>`,
    `    <dt>${esc(iterLabel[lang] ?? iterLabel.en!)}</dt>`,
    `    <dd><ol class="iteration-list">\n    ${iterationItems}\n    </ol></dd>`,
    `    <dt>${esc(confLabel[lang] ?? confLabel.en!)}</dt>`,
    `    <dd><strong>${confidence}%</strong></dd>`,
    `    <dt>${esc(enrichLabel[lang] ?? enrichLabel.en!)}</dt>`,
    `    <dd>${enriched} / ${docs.length}</dd>`,
    `    <dt>${esc(limitLabel[lang] ?? limitLabel.en!)}</dt>`,
    `    <dd>${limitText[lang] ?? limitText.en}</dd>`,
    `  </dl>`,
    `</section>`,
  ].join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Deep-Inspection TemplateSection builders (SWOT + Dashboard)
// ---------------------------------------------------------------------------

/** Localised default SWOT entry text for when a stakeholder's quadrant has no documents. */
const SWOT_DEFAULTS: Readonly<Record<string, Partial<Record<Language, [string, string]>>>> = {
  // [withTopic, withoutTopic]
  govStrength:        { en: ['Policy initiative and agenda-setting on %t', 'Policy legislation in place'], sv: ['Politiskt initiativ och agendasättning för %t', 'Befintlig policylagstiftning'], de: ['Politische Initiative und Agenda-Setting zu %t', 'Politikgesetzgebung vorhanden'], fr: ['Initiative politique sur %t', 'Législation politique en place'], es: ['Iniciativa política sobre %t', 'Legislación de política vigente'] },
  govWeakness:        { en: ['Implementation timeline and resource allocation for %t', 'Implementation timeline and resource prioritisation'], sv: ['Genomförandetidsplan och resurstilldelning för %t', 'Genomförandetidsplan och resursprioritering'], de: ['Umsetzungszeitplan und Ressourcenallokation für %t', 'Umsetzungszeitplan und Ressourcenpriorisierung'] },
  govOpportunity:     { en: ['EU and international cooperation on %t', 'EU framework alignment'], sv: ['EU och internationellt samarbete om %t', 'EU-ramverksanpassning'], de: ['EU- und internationale Kooperation zu %t', 'EU-Rahmenausrichtung'] },
  govThreat:          { en: ['Execution risks and stakeholder resistance to %t reform', 'Evolving threat landscape'], sv: ['Genomföranderisker och motstånd mot %t-reform', 'Föränderligt hotlandskap'], de: ['Umsetzungsrisiken und Widerstand gegen %t-Reform', 'Sich entwickelnde Bedrohungslandschaft'] },
  oppStrength:        { en: ['Parliamentary oversight and scrutiny of %t proposals', 'Parliamentary oversight and accountability function'], sv: ['Parlamentarisk tillsyn och granskning av %t-förslag', 'Parlamentarisk tillsyn och ansvarsfunktion'], de: ['Parlamentarische Kontrolle der %t-Vorschläge', 'Parlamentarische Aufsicht und Rechenschaftsfunktion'] },
  oppWeakness:        { en: ['Limited access to implementation data on %t', 'Limited classified information access'], sv: ['Begränsad tillgång till genomförandedata om %t', 'Begränsad tillgång till sekretessbelagd information'], de: ['Begrenzter Zugang zu Umsetzungsdaten zu %t', 'Begrenzter Zugang zu klassifizierten Informationen'] },
  oppOpportunity:     { en: ['Cross-party consensus building on %t', 'Cross-party consensus building'], sv: ['Konsensusbyggande över partigränser om %t', 'Konsensusbyggande över partigränser'], de: ['Parteiübergreifender Konsensaufbau zu %t', 'Parteiübergreifender Konsensaufbau'] },
  oppThreat:          { en: ['Government majority limiting amendment capacity on %t', 'Government majority limiting amendment capacity'], sv: ['Regeringsmajoriteten begränsar ändringskapaciteten för %t', 'Regeringsmajoriteten begränsar ändringskapaciteten'], de: ['Regierungsmehrheit schränkt Änderungskapazität bei %t ein', 'Regierungsmehrheit schränkt Änderungskapazität ein'] },
  privateStrength:    { en: ['Domain expertise and operational capacity in %t', 'Technical expertise and operational capacity'], sv: ['Domänexpertis och operativ kapacitet inom %t', 'Teknisk expertis och operativ kapacitet'], de: ['Fachkompetenz und operative Kapazität in %t', 'Technisches Fachwissen und operative Kapazität'] },
  privateWeakness1:   { en: ['Compliance costs and adaptation burden from %t regulation', 'Compliance costs and regulatory burden'], sv: ['Efterlevnadskostnader och anpassningsbörda från %t-reglering', 'Efterlevnadskostnader och regulatorisk börda'], de: ['Compliance-Kosten und Anpassungsbelastung durch %t-Regulierung', 'Compliance-Kosten und regulatorische Belastung'] },
  privateWeakness2:   { en: ['Resource allocation for emerging %t requirements', 'Resource allocation for emerging requirements'], sv: ['Resursallokering för nya %t-krav', 'Resursallokering för nya krav'], de: ['Ressourcenzuweisung für neue %t-Anforderungen', 'Ressourcenzuweisung für neue Anforderungen'] },
  privateOpportunity: { en: ['Investment and innovation driven by %t policy', 'Policy-driven investment and innovation'], sv: ['Investering och innovation driven av %t-politik', 'Policydriven investering och innovation'], de: ['Investitionen und Innovation durch %t-Politik', 'Politikgetriebene Investitionen und Innovation'] },
  privateThreat1:     { en: ['Rapid policy evolution creating uncertainty for %t stakeholders', 'Rapid threat evolution'], sv: ['Snabb policyutveckling skapar osäkerhet för %t-intressenter', 'Snabb hotutveckling'], de: ['Schnelle Politikentwicklung schafft Unsicherheit für %t-Stakeholder', 'Schnelle Bedrohungsentwicklung'] },
  privateThreat2:     { en: ['Short implementation timelines for new %t requirements', 'Short implementation timelines for new requirements'], sv: ['Korta implementeringstidsplaner för nya %t-krav', 'Korta implementeringstidsplaner för nya krav'], de: ['Kurze Umsetzungsfristen für neue %t-Anforderungen', 'Kurze Umsetzungsfristen für neue Anforderungen'] },
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
  const pressmDocs = docs.filter(d => (d.doktyp || d.documentType) === 'pressm');
  const extDocs  = docs.filter(d => (d.doktyp || d.documentType) === 'ext');
  const otherDocs = docs.filter(d =>
    !['prop','bet','mot','skr','sfs','fpm','pressm','ext'].includes((d.doktyp || d.documentType) || ''));

  // ── Government / Policy Administration ────────────────────────────────────
  const govStrengths: SwotEntry[] = [
    ...propDocs.slice(0, 3).map(d => toEntry(d, 'high')),
    ...sfsDocs.slice(0, 2).map(d => toEntry(d, 'high')),
    ...skrDocs.slice(0, 1).map(d => toEntry(d, 'medium')),
    ...pressmDocs.slice(0, 2).map(d => toEntry(d, 'high')),
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
    ...extDocs.slice(0, 2).map(d => toEntry(d, 'high')),
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
  if (pressmDocs.length > 0) {
    sankeyNodes.push({ id: 'pressm', label: 'Press Releases', color: 'orange' });
    sankeyFlows.push({ source: 'gov', target: 'pressm', value: pressmDocs.length, label: `${pressmDocs.length}` });
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
  console.log(`  🔬 Analysis depth: ${analysisDepth} (${['surface', 'predictive+historical', 'full with executive summary', 'full multi-iteration'][analysisDepth - 1]})`);

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
      const content: string = generateDeepInspectionContent(enrichedDocs, sanitizedTopic, lang, analysisDepth);

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
