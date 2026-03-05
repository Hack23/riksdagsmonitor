/**
 * Script to localize meta keywords in non-English news articles.
 * Translates English keywords to the target language for all non-EN articles.
 *
 * Processes:
 * - <meta name="keywords" content="..."> in each non-English article
 * - "keywords": "..." in JSON-LD structured data
 *
 * Keywords that have no translation in the map (proper nouns, specific terms)
 * are left as-is (English fallback is acceptable for those).
 *
 * Usage: npx tsx scripts/fix-keywords-localization.ts [--dry-run]
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';

// SEO keyword translations — kept in sync with scripts/data-transformers/metadata.ts
// Maps English keyword strings to their localized equivalents for all 13 non-EN languages.
const SEO_KEYWORD_TRANSLATIONS: Record<string, Record<string, string>> = {
  'parliament':         { sv: 'riksdag', da: 'parlament', no: 'parlament', fi: 'eduskunta', de: 'parlament', fr: 'parlement', es: 'parlamento', nl: 'parlement', ar: 'برلمان', he: 'פרלמנט', ja: '議会', ko: '의회', zh: '议会' },
  'Swedish Parliament': { sv: 'Riksdagen', da: 'Svensk Parlament', no: 'Svensk Parlament', fi: 'Ruotsin Eduskunta', de: 'Schwedisches Parlament', fr: 'Parlement Suédois', es: 'Parlamento Sueco', nl: 'Zweeds Parlement', ar: 'البرلمان السويدي', he: 'הפרלמנט השבדי', ja: 'スウェーデン議会', ko: '스웨덴 의회', zh: '瑞典议会' },
  'Sweden':             { sv: 'Sverige', da: 'Sverige', no: 'Sverige', fi: 'Ruotsi', de: 'Schweden', fr: 'Suède', es: 'Suecia', nl: 'Zweden', ar: 'السويد', he: 'שבדיה', ja: 'スウェーデン', ko: '스웨덴', zh: '瑞典' },
  'politics':           { sv: 'politik', da: 'politik', no: 'politikk', fi: 'politiikka', de: 'politik', fr: 'politique', es: 'política', nl: 'politiek', ar: 'سياسة', he: 'פוליטיקה', ja: '政治', ko: '정치', zh: '政治' },
  'week ahead':         { sv: 'veckan framåt', da: 'ugen forude', no: 'uken fremover', fi: 'tuleva viikko', de: 'kommende woche', fr: 'semaine à venir', es: 'semana próxima', nl: 'week vooruit', ar: 'الأسبوع القادم', he: 'השבוע הקרוב', ja: '来週の展望', ko: '다음 주', zh: '下周展望' },
  'month ahead':        { sv: 'månaden framåt', da: 'måneden forude', no: 'måneden fremover', fi: 'tuleva kuukausi', de: 'kommender monat', fr: 'mois à venir', es: 'mes próximo', nl: 'maand vooruit', ar: 'الشهر القادم', he: 'החודש הקרוב', ja: '来月の展望', ko: '다음 달', zh: '下月展望' },
  'calendar':           { sv: 'kalender', da: 'kalender', no: 'kalender', fi: 'kalenteri', de: 'kalender', fr: 'calendrier', es: 'calendario', nl: 'kalender', ar: 'تقويم', he: 'לוח שנה', ja: 'カレンダー', ko: '일정', zh: '日历' },
  'events':             { sv: 'händelser', da: 'begivenheder', no: 'hendelser', fi: 'tapahtumat', de: 'ereignisse', fr: 'événements', es: 'eventos', nl: 'evenementen', ar: 'أحداث', he: 'אירועים', ja: '出来事', ko: '이벤트', zh: '事件' },
  'committee':          { sv: 'utskott', da: 'udvalg', no: 'komité', fi: 'valiokunta', de: 'ausschuss', fr: 'commission', es: 'comisión', nl: 'commissie', ar: 'لجنة', he: 'ועדה', ja: '委員会', ko: '위원회', zh: '委员会' },
  'committees':         { sv: 'utskott', da: 'udvalg', no: 'komiteer', fi: 'valiokunnat', de: 'ausschüsse', fr: 'commissions', es: 'comisiones', nl: 'commissies', ar: 'لجان', he: 'ועדות', ja: '委員会', ko: '위원회들', zh: '委员会' },
  'reports':            { sv: 'betänkanden', da: 'betænkninger', no: 'innstillinger', fi: 'mietinnöt', de: 'berichte', fr: 'rapports', es: 'informes', nl: 'rapporten', ar: 'تقارير', he: 'דוחות', ja: '報告書', ko: '보고서', zh: '报告' },
  'betänkanden':        { sv: 'betänkanden', da: 'betænkninger', no: 'innstillinger', fi: 'mietinnöt', de: 'parlamentsberichte', fr: 'rapports parlementaires', es: 'informes parlamentarios', nl: 'parlementaire rapporten', ar: 'تقارير برلمانية', he: 'דוחות פרלמנטריים', ja: '議会報告書', ko: '의회 보고서', zh: '议会报告' },
  'government':         { sv: 'regering', da: 'regering', no: 'regjering', fi: 'hallitus', de: 'regierung', fr: 'gouvernement', es: 'gobierno', nl: 'regering', ar: 'حكومة', he: 'ממשלה', ja: '政府', ko: '정부', zh: '政府' },
  'propositions':       { sv: 'propositioner', da: 'lovforslag', no: 'proposisjoner', fi: 'esitykset', de: 'gesetzentwürfe', fr: 'propositions de loi', es: 'proposiciones', nl: 'wetsvoorstellen', ar: 'مقترحات', he: 'הצעות חוק', ja: '法律案', ko: '법률안', zh: '提案' },
  'legislation':        { sv: 'lagstiftning', da: 'lovgivning', no: 'lovgivning', fi: 'lainsäädäntö', de: 'gesetzgebung', fr: 'législation', es: 'legislación', nl: 'wetgeving', ar: 'تشريع', he: 'חקיקה', ja: '立法', ko: '법률', zh: '立法' },
  'motions':            { sv: 'motioner', da: 'forslag', no: 'forslag', fi: 'aloitteet', de: 'anträge', fr: 'motions', es: 'mociones', nl: 'moties', ar: 'اقتراحات', he: 'הצעות', ja: '動議', ko: '동의', zh: '动议' },
  'opposition':         { sv: 'opposition', da: 'opposition', no: 'opposisjon', fi: 'oppositio', de: 'opposition', fr: 'opposition', es: 'oposición', nl: 'oppositie', ar: 'معارضة', he: 'אופוזיציה', ja: '野党', ko: '야당', zh: '反对派' },
  'proposals':          { sv: 'förslag', da: 'forslag', no: 'forslag', fi: 'ehdotukset', de: 'vorschläge', fr: 'propositions', es: 'propuestas', nl: 'voorstellen', ar: 'مقترحات', he: 'הצעות', ja: '提案', ko: '제안', zh: '提案' },
  'outlook':            { sv: 'utsikter', da: 'udsigt', no: 'utsikter', fi: 'näkymät', de: 'ausblick', fr: 'perspectives', es: 'perspectivas', nl: 'vooruitzichten', ar: 'توقعات', he: 'תחזית', ja: '見通し', ko: '전망', zh: '展望' },
  'weekly review':      { sv: 'veckans sammanfattning', da: 'ugentlig gennemgang', no: 'ukentlig gjennomgang', fi: 'viikkokatsaus', de: 'wochenbericht', fr: 'bilan hebdomadaire', es: 'revisión semanal', nl: 'wekelijks overzicht', ar: 'مراجعة أسبوعية', he: 'סקירה שבועית', ja: '週間レビュー', ko: '주간 리뷰', zh: '每周回顾' },
  'monthly review':     { sv: 'månadens sammanfattning', da: 'månedlig gennemgang', no: 'månedlig gjennomgang', fi: 'kuukausikatsaus', de: 'monatsbericht', fr: 'bilan mensuel', es: 'revisión mensual', nl: 'maandelijks overzicht', ar: 'مراجعة شهرية', he: 'סקירה חודשית', ja: '月間レビュー', ko: '월간 리뷰', zh: '每月回顾' },
  'analysis':           { sv: 'analys', da: 'analyse', no: 'analyse', fi: 'analyysi', de: 'analyse', fr: 'analyse', es: 'análisis', nl: 'analyse', ar: 'تحليل', he: 'ניתוח', ja: '分析', ko: '분석', zh: '分析' },
  'recap':              { sv: 'sammanfattning', da: 'resumé', no: 'oppsummering', fi: 'yhteenveto', de: 'zusammenfassung', fr: 'récapitulatif', es: 'resumen', nl: 'samenvatting', ar: 'ملخص', he: 'סיכום', ja: 'まとめ', ko: '요약', zh: '总结' },
  'breaking news':      { sv: 'senaste nytt', da: 'seneste nyt', no: 'siste nytt', fi: 'viimeisimmät uutiset', de: 'Eilmeldung', fr: 'dernières nouvelles', es: 'noticias de última hora', nl: 'laatste nieuws', ar: 'أخبار عاجلة', he: 'חדשות אחרונות', ja: '速報', ko: '속보', zh: '突发新闻' },
  'urgent':             { sv: 'brådskande', da: 'presserende', no: 'haster', fi: 'kiireellinen', de: 'dringend', fr: 'urgent', es: 'urgente', nl: 'dringend', ar: 'عاجل', he: 'דחוף', ja: '緊急', ko: '긴급', zh: '紧急' },
  'alert':              { sv: 'varning', da: 'advarsel', no: 'varsel', fi: 'hälytys', de: 'warnung', fr: 'alerte', es: 'alerta', nl: 'waarschuwing', ar: 'تنبيه', he: 'התראה', ja: '警告', ko: '경보', zh: '警告' },
  'debates':            { sv: 'debatter', da: 'debatter', no: 'debatter', fi: 'keskustelut', de: 'debatten', fr: 'débats', es: 'debates', nl: 'debatten', ar: 'مناقشات', he: 'דיונים', ja: '討論', ko: '토론', zh: '辩论' },
  // Additional compound keywords that appear frequently in article metadata
  'evening analysis':   { sv: 'kvällsanalys', da: 'aftenanalyse', no: 'kveldsanalyse', fi: 'ilta-analyysi', de: 'abendanalyse', fr: 'analyse du soir', es: 'análisis vespertino', nl: 'avondanalyse', ar: 'تحليل مسائي', he: 'ניתוח ערב', ja: '夜の分析', ko: '저녁 분석', zh: '晚间分析' },
  'morning briefing':   { sv: 'morgonbriefing', da: 'morgenbriefing', no: 'morgenbriefing', fi: 'aamuinfo', de: 'morgenbriefing', fr: 'briefing matinal', es: 'informe matutino', nl: 'ochtendbriefing', ar: 'إحاطة صباحية', he: 'תדריך בוקר', ja: '朝のブリーフィング', ko: '아침 브리핑', zh: '早间简报' },
  'committee reports':  { sv: 'utskottsbetänkanden', da: 'udvalgsbetænkninger', no: 'komitéinnstillinger', fi: 'valiokuntamietinnöt', de: 'ausschussberichte', fr: 'rapports de commission', es: 'informes de comisión', nl: 'commissierapporten', ar: 'تقارير اللجان', he: 'דוחות ועדה', ja: '委員会報告書', ko: '위원회 보고서', zh: '委员会报告' },
  'Government Propositions': { sv: 'Regeringspropositioner', da: 'Lovforslag fra Regeringen', no: 'Regjeringens proposisjoner', fi: 'Hallituksen esitykset', de: 'Regierungsvorlagen', fr: 'Propositions gouvernementales', es: 'Proposiciones gubernamentales', nl: 'Regeringsvoorstellen', ar: 'مقترحات الحكومة', he: 'הצעות ממשלה', ja: '政府法律案', ko: '정부 법률안', zh: '政府提案' },
  'Opposition Motions': { sv: 'Oppositionsmotioner', da: 'Oppositionsforslag', no: 'Opposisjonsforslag', fi: 'Oppositioaloitteet', de: 'Oppositionsanträge', fr: "Motions de l'opposition", es: 'Mociones de la oposición', nl: 'Oppositiemoties', ar: 'اقتراحات المعارضة', he: 'הצעות האופוזיציה', ja: '野党動議', ko: '야당 동의', zh: '反对党动议' },
  'parliamentary questions': { sv: 'parlamentariska frågor', da: 'parlamentariske spørgsmål', no: 'parlamentariske spørsmål', fi: 'parlamenttikyselyt', de: 'parlamentarische anfragen', fr: 'questions parlementaires', es: 'preguntas parlamentarias', nl: 'parlementaire vragen', ar: 'أسئلة برلمانية', he: 'שאלות פרלמנטריות', ja: '国会質問', ko: '의회 질문', zh: '议会质询' },
  'interpellations':    { sv: 'interpellationer', da: 'interpellationer', no: 'interpellasjoner', fi: 'interpellaatiot', de: 'interpellationen', fr: 'interpellations', es: 'interpelaciones', nl: 'interpellaties', ar: 'استجوابات', he: 'אינטרפלציות', ja: '質問主意書', ko: '대정부질문', zh: '质询' },
  'defence':            { sv: 'försvar', da: 'forsvar', no: 'forsvar', fi: 'puolustus', de: 'verteidigung', fr: 'défense', es: 'defensa', nl: 'defensie', ar: 'الدفاع', he: 'ביטחון', ja: '防衛', ko: '방위', zh: '国防' },
  'defense':            { sv: 'försvar', da: 'forsvar', no: 'forsvar', fi: 'puolustus', de: 'verteidigung', fr: 'défense', es: 'defensa', nl: 'defensie', ar: 'الدفاع', he: 'ביטחון', ja: '防衛', ko: '방위', zh: '国防' },
  'security':           { sv: 'säkerhet', da: 'sikkerhed', no: 'sikkerhet', fi: 'turvallisuus', de: 'sicherheit', fr: 'sécurité', es: 'seguridad', nl: 'veiligheid', ar: 'الأمن', he: 'ביטחון', ja: 'セキュリティ', ko: '보안', zh: '安全' },
  'foreign policy':     { sv: 'utrikespolitik', da: 'udenrigspolitik', no: 'utenrikspolitikk', fi: 'ulkopolitiikka', de: 'außenpolitik', fr: 'politique étrangère', es: 'política exterior', nl: 'buitenlands beleid', ar: 'السياسة الخارجية', he: 'מדיניות חוץ', ja: '外交政策', ko: '외교 정책', zh: '外交政策' },
  'migration':          { sv: 'migration', da: 'migration', no: 'migrasjon', fi: 'maahanmuutto', de: 'migration', fr: 'migration', es: 'migración', nl: 'migratie', ar: 'الهجرة', he: 'הגירה', ja: '移民', ko: '이민', zh: '移民' },
  'energy':             { sv: 'energi', da: 'energi', no: 'energi', fi: 'energia', de: 'energie', fr: 'énergie', es: 'energía', nl: 'energie', ar: 'الطاقة', he: 'אנרגיה', ja: 'エネルギー', ko: '에너지', zh: '能源' },
  'healthcare':         { sv: 'sjukvård', da: 'sundhed', no: 'helse', fi: 'terveydenhuolto', de: 'gesundheit', fr: 'santé', es: 'sanidad', nl: 'gezondheidszorg', ar: 'الرعاية الصحية', he: 'בריאות', ja: '医療', ko: '의료', zh: '医疗' },
  'education':          { sv: 'utbildning', da: 'uddannelse', no: 'utdanning', fi: 'koulutus', de: 'bildung', fr: 'éducation', es: 'educación', nl: 'onderwijs', ar: 'التعليم', he: 'חינוך', ja: '教育', ko: '교육', zh: '教育' },
  'economy':            { sv: 'ekonomi', da: 'økonomi', no: 'økonomi', fi: 'talous', de: 'wirtschaft', fr: 'économie', es: 'economía', nl: 'economie', ar: 'الاقتصاد', he: 'כלכלה', ja: '経済', ko: '경제', zh: '经济' },
  'justice':            { sv: 'rättsväsende', da: 'retsvæsen', no: 'rettsvesen', fi: 'oikeus', de: 'justiz', fr: 'justice', es: 'justicia', nl: 'justitie', ar: 'العدالة', he: 'משפט', ja: '司法', ko: '사법', zh: '司法' },
  'welfare':            { sv: 'välfärd', da: 'velfærd', no: 'velferd', fi: 'sosiaaliturva', de: 'sozialpolitik', fr: 'protection sociale', es: 'bienestar social', nl: 'sociale zekerheid', ar: 'الرعاية الاجتماعية', he: 'רווחה', ja: '社会保障', ko: '사회복지', zh: '社会保障' },
  'environment':        { sv: 'miljö', da: 'miljø', no: 'miljø', fi: 'ympäristö', de: 'umwelt', fr: 'environnement', es: 'medio ambiente', nl: 'milieu', ar: 'البيئة', he: 'סביבה', ja: '環境', ko: '환경', zh: '环境' },
  'climate':            { sv: 'klimat', da: 'klima', no: 'klima', fi: 'ilmasto', de: 'klima', fr: 'climat', es: 'clima', nl: 'klimaat', ar: 'المناخ', he: 'אקלים', ja: '気候', ko: '기후', zh: '气候' },
  'housing':            { sv: 'bostäder', da: 'boliger', no: 'boliger', fi: 'asuminen', de: 'wohnungsbau', fr: 'logement', es: 'vivienda', nl: 'huisvesting', ar: 'الإسكان', he: 'דיור', ja: '住宅', ko: '주택', zh: '住房' },
  'taxation':           { sv: 'beskattning', da: 'beskatning', no: 'beskatning', fi: 'verotus', de: 'besteuerung', fr: 'fiscalité', es: 'tributación', nl: 'belasting', ar: 'الضرائب', he: 'מיסוי', ja: '課税', ko: '과세', zh: '税收' },
  'budget':             { sv: 'budget', da: 'budget', no: 'budsjett', fi: 'budjetti', de: 'haushalt', fr: 'budget', es: 'presupuesto', nl: 'begroting', ar: 'الميزانية', he: 'תקציב', ja: '予算', ko: '예산', zh: '预算' },
};

// Build a case-insensitive lookup map keyed by lowercase English term
const LOWER_MAP = new Map<string, { original: string; translations: Record<string, string> }>();
for (const [key, translations] of Object.entries(SEO_KEYWORD_TRANSLATIONS)) {
  LOWER_MAP.set(key.toLowerCase(), { original: key, translations });
}

/** Return the localized form of a single keyword for the given language. Falls back to English. */
function localizeKeyword(keyword: string, lang: string): string {
  if (lang === 'en') return keyword;
  const trimmed = keyword.trim();
  // Try exact match first
  const exact = SEO_KEYWORD_TRANSLATIONS[trimmed];
  if (exact?.[lang]) return exact[lang];
  // Try case-insensitive match
  const lower = trimmed.toLowerCase();
  const entry = LOWER_MAP.get(lower);
  if (entry?.translations[lang]) return entry.translations[lang];
  // No translation available — keep as English (acceptable for proper nouns / specific terms)
  return trimmed;
}

/**
 * Translate a comma-separated keyword string to the target language.
 * Keywords that have no translation entry are left as-is.
 */
function localizeKeywords(keywordsStr: string, lang: string): string {
  return keywordsStr
    .split(', ')
    .map(kw => localizeKeyword(kw, lang))
    .join(', ');
}

/** Replace the meta keywords tag and JSON-LD keywords string in HTML content. */
function replaceKeywords(html: string, lang: string): string {
  let result = html;

  // 1. Replace <meta name="keywords" content="...">
  result = result.replace(
    /(<meta name="keywords" content=")([^"]+)(")/g,
    (_match, prefix, keywords, suffix) => {
      const localized = localizeKeywords(keywords, lang);
      return `${prefix}${localized}${suffix}`;
    }
  );

  // 2. Replace "keywords": "..." in JSON-LD structured data
  result = result.replace(
    /("keywords": ")([^"]+)(")/g,
    (_match, prefix, keywords, suffix) => {
      const localized = localizeKeywords(keywords, lang);
      return `${prefix}${localized}${suffix}`;
    }
  );

  return result;
}

function getLanguageFromFilename(filename: string): string | null {
  const match = filename.match(/-([a-z]{2})\.html$/);
  return match ? (match[1] ?? null) : null;
}

function processFile(filepath: string, dryRun: boolean): boolean {
  const filename = path.basename(filepath);
  const lang = getLanguageFromFilename(filename);

  // Skip English articles — they are already in the correct language
  if (!lang || lang === 'en') return false;

  const original = fs.readFileSync(filepath, 'utf-8');

  // Quick check: does this file have any keywords meta tag with translatable English terms?
  const keywordsMatch = original.match(/<meta name="keywords" content="([^"]+)"/);
  if (!keywordsMatch) return false;

  const modified = replaceKeywords(original, lang);

  if (modified === original) return false;

  if (!dryRun) {
    fs.writeFileSync(filepath, modified, 'utf-8');
  }
  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const NEWS_DIR = path.join(process.cwd(), 'news');
const dryRun = process.argv.includes('--dry-run');

console.log(`🔄 Localizing meta keywords in non-English news articles (${dryRun ? 'DRY RUN' : 'LIVE'})...\n`);

const files = fs.readdirSync(NEWS_DIR)
  .filter(f => f.endsWith('.html'))
  .sort();

let modifiedCount = 0;
let skippedCount = 0;
const langStats: Record<string, number> = {};

for (const file of files) {
  const filepath = path.join(NEWS_DIR, file);
  const lang = getLanguageFromFilename(file);

  if (processFile(filepath, dryRun)) {
    modifiedCount++;
    if (lang) langStats[lang] = (langStats[lang] ?? 0) + 1;
    if (dryRun) console.log(`  📝 Would modify: ${file}`);
  } else {
    skippedCount++;
  }
}

console.log(`\n✅ Done!`);
console.log(`  Modified: ${modifiedCount} files`);
console.log(`  Skipped:  ${skippedCount} files (no changes needed)`);

if (Object.keys(langStats).length > 0) {
  console.log(`\n📊 Changes by language:`);
  for (const [lang, count] of Object.entries(langStats).sort()) {
    console.log(`  ${lang}: ${count} files`);
  }
}

// ── Verification pass ─────────────────────────────────────────────────────────
console.log(`\n🔍 Verifying: checking for remaining English-only standard keywords in non-EN articles...`);

// Patterns that indicate untranslated standard template keywords
const ENGLISH_ONLY_PATTERNS = [
  /name="keywords"[^>]*content="government, propositions/,
  /name="keywords"[^>]*content="committee, reports, bet/,
  /name="keywords"[^>]*content="motions, opposition, parliament, proposals/,
  /name="keywords"[^>]*content="parliament, week ahead/,
  /name="keywords"[^>]*content="parliament, month ahead/,
  /name="keywords"[^>]*content="parliament, weekly review/,
  /name="keywords"[^>]*content="parliament, monthly review/,
];

let remaining = 0;
for (const file of files) {
  const lang = getLanguageFromFilename(file);
  if (!lang || lang === 'en') continue;

  const content = fs.readFileSync(path.join(NEWS_DIR, file), 'utf-8');
  for (const pattern of ENGLISH_ONLY_PATTERNS) {
    if (pattern.test(content)) {
      remaining++;
      if (remaining <= 10) {
        console.log(`  ⚠️  ${file}: still has English-only template keywords`);
      }
      break;
    }
  }
}

if (remaining === 0) {
  console.log(`  ✅ No remaining English-only standard keywords found.`);
} else {
  console.log(`  ⚠️  ${remaining} file(s) still have English-only standard keywords.`);
  process.exitCode = 1;
}
