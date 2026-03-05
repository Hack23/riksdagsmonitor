/**
 * Script to replace "The Economist" branding references in old news articles
 * with OSINT/INTOP political intelligence branding across all 14 languages.
 *
 * Usage: npx tsx scripts/fix-old-articles-branding.ts [--dry-run]
 *
 * Replaces:
 * - site-tagline div content (language-specific from SITE_TAGLINE constants)
 * - "style: The Economist" in HTML comment frontmatter
 * - "The Economist" references in article body/disclaimers
 * - "Journalism Standards" footer text
 *
 * Preserves:
 * - External links to economist.com (legitimate references)
 */

import * as fs from 'fs';
import * as path from 'path';

// New taglines from scripts/article-template/constants.ts
const SITE_TAGLINE: Record<string, string> = {
  en: "Latest news and analysis from Sweden's Riksdag. AI-generated political intelligence based on OSINT/INTOP data covering parliament, government, and agencies with systematic transparency.",
  sv: 'Senaste nyheter och analyser från Sveriges riksdag. AI-genererad politisk underrättelsejournalistik baserad på OSINT/INTOP-data som bevakar riksdagen, regeringen och myndigheter med systematisk transparens.',
  da: 'Seneste nyheder og analyser fra Sveriges Riksdag. AI-genereret politisk efterretningsjournalistik baseret på OSINT/INTOP-data, der dækker parlament, regering og myndigheder med systematisk gennemsigtighed.',
  no: 'Siste nyheter og analyser fra Sveriges riksdag. AI-generert politisk etterretningsjournalistikk basert på OSINT/INTOP-data som dekker parlament, regjering og myndigheter med systematisk åpenhet.',
  fi: 'Uusimmat uutiset ja analyysit Ruotsin valtiopäiviltä. Tekoälyn tuottama poliittinen tiedustelujournalismi OSINT/INTOP-dataan perustuen, joka kattaa eduskunnan, hallituksen ja viranomaiset järjestelmällisellä läpinäkyvyydellä.',
  de: 'Aktuelle Nachrichten und Analysen aus dem schwedischen Riksdag. KI-generierter politischer Nachrichtendienst-Journalismus basierend auf OSINT/INTOP-Daten über Parlament, Regierung und Behörden mit systematischer Transparenz.',
  fr: 'Dernières nouvelles et analyses du Riksdag suédois. Journalisme de renseignement politique généré par IA basé sur des données OSINT/INTOP couvrant le parlement, le gouvernement et les agences avec une transparence systématique.',
  es: 'Últimas noticias y análisis del Riksdag sueco. Periodismo de inteligencia política generado por IA basado en datos OSINT/INTOP que cubre el parlamento, el gobierno y las agencias con transparencia sistemática.',
  nl: 'Laatste nieuws en analyses van de Zweedse Riksdag. AI-gegenereerde politieke inlichtingenjournalistiek gebaseerd op OSINT/INTOP-data over parlement, regering en instanties met systematische transparantie.',
  ar: 'أحدث الأخبار والتحليلات من البرلمان السويدي. صحافة استخبارات سياسية مولّدة بالذكاء الاصطناعي مبنية على بيانات OSINT/INTOP تغطي البرلمان والحكومة والوكالات بشفافية منهجية.',
  he: 'חדשות ניתוחים אחרונים מהריקסדאג השוודי. עיתונות מודיעין פוליטי מבוססת AI ונתוני OSINT/INTOP המכסה פרלמנט, ממשלה וסוכנויות עם שקיפות שיטתית.',
  ja: 'スウェーデン議会リクスダーグの最新ニュースと分析。OSINT/INTOPデータに基づくAI生成の政治インテリジェンスジャーナリズムで、議会、政府、機関を体系的な透明性で報道。',
  ko: '스웨덴 의회 릭스다그의 최신 뉴스와 분석. OSINT/INTOP 데이터 기반 AI 생성 정치 인텔리전스 저널리즘으로 의회, 정부, 기관을 체계적인 투명성으로 보도.',
  zh: '来自瑞典议会的最新新闻和分析。基于OSINT/INTOP数据的AI生成政治情报新闻，以系统性透明度报道议会、政府和机构。',
};

const NEWS_DIR = path.join(process.cwd(), 'news');
const dryRun = process.argv.includes('--dry-run');

function getLanguageFromFilename(filename: string): string | null {
  const match = filename.match(/-([a-z]{2})\.html$/);
  return match ? match[1] : null;
}

function replaceTagline(html: string, lang: string): string {
  const tagline = SITE_TAGLINE[lang];
  if (!tagline) return html;

  // Replace site-tagline div content
  return html.replace(
    /(<div class="site-tagline">)([^<]*?)(<\/div>)/g,
    `$1${tagline}$3`
  );
}

function replaceEconomistReferences(html: string): string {
  let result = html;

  // 1. Replace "style: The Economist" in HTML comment frontmatter
  result = result.replace(/style: The Economist\b/g, 'style: OSINT/INTOP');

  // 2. Replace "Journalism Standards" footer patterns (en + sv)
  result = result.replace(
    /Journalism Standards<\/strong>: The Economist style/g,
    'Journalism Standards</strong>: OSINT/INTOP data-driven AI-generated political intelligence'
  );
  result = result.replace(
    /Journalistiska standarder<\/strong>: The Economist-stil/g,
    'Journalistiska standarder</strong>: OSINT/INTOP-datadriven AI-genererad politisk underrättelsejournalistik'
  );

  // 3. Skip lines containing economist.com URLs (legitimate external references)
  // Process line by line to preserve external links
  const lines = result.split('\n');
  const processedLines = lines.map(line => {
    // Skip lines with economist.com URLs
    if (line.includes('economist.com')) return line;

    // Replace "The Economist" patterns not already handled
    // Various editorial standards patterns
    line = line.replace(/following The Economist editorial standards/g, 'following OSINT/INTOP editorial standards');
    line = line.replace(/enligt The Economist-standarder/g, 'enligt OSINT/INTOP-standarder');
    line = line.replace(/enligt The Economists redaktionella standard/g, 'enligt OSINT/INTOP redaktionella standard');
    line = line.replace(/i enlighet med The Economists redaktionella standard/g, 'i enlighet med OSINT/INTOP redaktionella standard');
    line = line.replace(/in The Economist style/g, 'in OSINT/INTOP style');
    line = line.replace(/i The Economist-stil/g, 'i OSINT/INTOP-stil');

    // English patterns
    line = line.replace(/The Economist-style analysis/g, 'OSINT/INTOP data-driven analysis');
    line = line.replace(/The Economist-style political journalism emphasizing/g, 'OSINT/INTOP data-driven AI-generated political intelligence emphasizing');
    line = line.replace(/The Economist-style political journalism/g, 'OSINT/INTOP data-driven political journalism');
    line = line.replace(/The Economist-style/g, 'OSINT/INTOP data-driven');

    // Generic "The Economist" that references the brand, not external links
    // Replace remaining "The Economist" in article contexts (not in <a> tags)
    // Use negative lookahead to avoid replacing inside link text to economist.com
    line = line.replace(/The Economist noted in its/g, 'As noted in a');

    // Swedish patterns
    line = line.replace(/The Economist-inspirerad/g, 'OSINT/INTOP-baserad');

    // Danish patterns
    line = line.replace(/The Economist-inspireret/g, 'OSINT/INTOP-baseret');

    // Norwegian patterns
    line = line.replace(/The Economist-inspirert/g, 'OSINT/INTOP-basert');

    // Generic suffix patterns across Scandinavian languages
    line = line.replace(/The Economist-stil\b/g, 'OSINT/INTOP-stil');

    // Dutch
    line = line.replace(/The Economist-stijl\b/g, 'OSINT/INTOP-stijl');

    // German (with and without "The ")
    line = line.replace(/The Economist-Stil\b/g, 'OSINT/INTOP-Stil');
    line = line.replace(/im Economist-Stil\b/g, 'im OSINT/INTOP-Stil');
    line = line.replace(/Economist-Stil\b/g, 'OSINT/INTOP-Stil');

    // Dutch (without "The " prefix)
    line = line.replace(/in Economist-stijl\b/g, 'in OSINT/INTOP-stijl');
    line = line.replace(/Economist-stijl\b/g, 'OSINT/INTOP-stijl');

    // Finnish (note the space before the hyphen)
    line = line.replace(/The Economist -tyylinen/g, 'OSINT/INTOP -tyylinen');
    line = line.replace(/The Economist -tyyliin/g, 'OSINT/INTOP -tyyliin');
    line = line.replace(/The Economist-tyylinen/g, 'OSINT/INTOP-tyylinen');

    // French
    line = line.replace(/style The Economist\b/g, 'style OSINT/INTOP');
    line = line.replace(/The Economist couvrant/g, 'OSINT/INTOP couvrant');
    line = line.replace(/The Economist avec/g, 'OSINT/INTOP avec');

    // Spanish
    line = line.replace(/estilo The Economist\b/g, 'estilo OSINT/INTOP');
    line = line.replace(/The Economist que cubre/g, 'OSINT/INTOP que cubre');
    line = line.replace(/The Economist cubriendo/g, 'OSINT/INTOP cubriendo');
    line = line.replace(/The Economist sobre/g, 'OSINT/INTOP sobre');
    line = line.replace(/The Economist con/g, 'OSINT/INTOP con');

    // Dutch additional
    line = line.replace(/The Economist over/g, 'OSINT/INTOP over');
    line = line.replace(/The Economist met/g, 'OSINT/INTOP met');
    line = line.replace(/The Economist politieke/g, 'OSINT/INTOP politieke');

    // German additional
    line = line.replace(/The Economist mit/g, 'OSINT/INTOP mit');
    line = line.replace(/The Economist zu /g, 'OSINT/INTOP zu ');
    line = line.replace(/The Economist über/g, 'OSINT/INTOP über');

    // Hebrew
    line = line.replace(/The Economist המכסה/g, 'OSINT/INTOP המכסה');
    line = line.replace(/The Economist עם/g, 'OSINT/INTOP עם');

    // Arabic
    line = line.replace(/The Economist تغطي/g, 'OSINT/INTOP تغطي');

    // Japanese
    line = line.replace(/The Economist スタイル/g, 'OSINT/INTOP スタイル');

    // Chinese
    line = line.replace(/The Economist 风格/g, 'OSINT/INTOP 风格');
    line = line.replace(/The Economist风格/g, 'OSINT/INTOP風格');

    // Korean
    line = line.replace(/The Economist 스타일/g, 'OSINT/INTOP 스타일');

    // Catch remaining "The Economist." and "The Economist," sentence endings
    // But not "The Economist:" (which is a reference title)
    line = line.replace(/The Economist\./g, 'OSINT/INTOP.');
    line = line.replace(/The Economist,/g, 'OSINT/INTOP,');

    // HTML entity versions
    line = line.replace(/The Economist-stil som t&#228;cker/g, 'OSINT/INTOP-stil som täcker');
    line = line.replace(/The Economist-stil som dekker riksdag, regjering og myndigheter med systematisk &#229;penhet/g,
      'OSINT/INTOP-stil som dekker riksdag, regjering og myndigheter med systematisk åpenhet');
    line = line.replace(/The Economist-stil der d&#230;kker/g, 'OSINT/INTOP-stil der dækker');
    line = line.replace(/The Economist couvrant le parlement, le gouvernement et les agences avec une transparence syst&#233;matique/g,
      'OSINT/INTOP couvrant le parlement, le gouvernement et les agences avec une transparence systématique');
    line = line.replace(/The Economist cubriendo parlamento, gobierno y agencias con transparencia sistem&#225;tica/g,
      'OSINT/INTOP cubriendo parlamento, gobierno y agencias con transparencia sistemática');
    line = line.replace(/The Economist -tyylin poliittista journalismia, joka kattaa parlamentin, hallituksen ja virastot systemaattisella l&#228;pin&#228;kyvyydell&#228;/g,
      'OSINT/INTOP -tyylin poliittista journalismia, joka kattaa parlamentin, hallituksen ja virastot systemaattisella läpinäkyvyydellä');

    return line;
  });

  return processedLines.join('\n');
}

function processFile(filepath: string): boolean {
  const filename = path.basename(filepath);
  const lang = getLanguageFromFilename(filename);

  if (!lang) {
    console.warn(`  ⚠️ Could not determine language for: ${filename}`);
    return false;
  }

  const original = fs.readFileSync(filepath, 'utf-8');

  // Check if file contains any Economist references
  if (!original.includes('Economist')) {
    return false;
  }

  let modified = original;

  // Replace site-tagline
  modified = replaceTagline(modified, lang);

  // Replace other Economist references
  modified = replaceEconomistReferences(modified);

  if (modified === original) {
    return false;
  }

  if (!dryRun) {
    fs.writeFileSync(filepath, modified, 'utf-8');
  }

  return true;
}

// Main execution
console.log(`🔄 Fixing old articles branding (${dryRun ? 'DRY RUN' : 'LIVE'})...\n`);

const files = fs.readdirSync(NEWS_DIR)
  .filter(f => f.endsWith('.html'))
  .sort();

let modified = 0;
let skipped = 0;
const langStats: Record<string, number> = {};

for (const file of files) {
  const filepath = path.join(NEWS_DIR, file);
  const lang = getLanguageFromFilename(file);

  if (processFile(filepath)) {
    modified++;
    if (lang) {
      langStats[lang] = (langStats[lang] || 0) + 1;
    }
    if (dryRun) {
      console.log(`  📝 Would modify: ${file}`);
    }
  } else {
    skipped++;
  }
}

console.log(`\n✅ Done!`);
console.log(`  Modified: ${modified} files`);
console.log(`  Skipped: ${skipped} files (no changes needed)`);
console.log(`\n📊 Changes by language:`);
for (const [lang, count] of Object.entries(langStats).sort()) {
  console.log(`  ${lang}: ${count} files`);
}

// Verify no remaining Economist references (except legitimate external links)
console.log(`\n🔍 Checking for remaining "Economist" references...`);
let remaining = 0;
for (const file of files) {
  const filepath = path.join(NEWS_DIR, file);
  const content = dryRun
    ? fs.readFileSync(filepath, 'utf-8')
    : fs.readFileSync(filepath, 'utf-8');

  // Split into lines and check each
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Economist') && !lines[i].includes('economist.com')) {
      remaining++;
      if (remaining <= 20) {
        console.log(`  ⚠️ ${file}:${i + 1}: ${lines[i].trim().substring(0, 120)}`);
      }
    }
  }
}

if (remaining > 20) {
  console.log(`  ... and ${remaining - 20} more`);
}

if (remaining === 0) {
  console.log('  ✅ No remaining references (except legitimate external links)');
} else {
  console.log(`\n  ⚠️ ${remaining} remaining references found`);
}
