/**
 * @module Tests/RenderLib/Seo/BudgetWindows
 * @category Intelligence Operations / Tests
 * @name SERP budget windows — 14-language matrix
 *
 * @description
 * Verifies the per-language SERP budgets in
 * `scripts/render-lib/aggregator/seo/serp-budgets.ts` against the
 * canonical contract in `.github/prompts/seo-metadata-contract.md` §4:
 *
 *   - Latin LTR (`en sv da no fi de fr es nl`) → title 55-70, desc 140-200
 *   - RTL       (`ar he`)                       → title 45-60, desc 120-170
 *   - CJK       (`ja ko zh`)                    → title 30-45, desc 70-120
 *
 * Also exercises the renderer's `buildSeoTitle` and `buildSeoDescription`
 * for all 14 languages so a single broken language code is caught in a
 * single test rather than as a downstream rendering regression.
 *
 * Pre-2026-05-24 the renderer hardcoded 70-char title / 200-char
 * description for every language, shipping CJK SERP entries at ~3× the
 * visual budget and RTL at ~15 % over.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  LANG_TITLE_WINDOWS,
  LANG_DESCRIPTION_WINDOWS,
  titleWindowForLanguage,
  descriptionWindowForLanguage,
  normalisePrimaryLangSubtag,
} from '../scripts/render-lib/aggregator/seo/serp-budgets.js';
import {
  buildSeoTitle,
  buildSeoDescription,
} from '../scripts/render-lib/article-seo.js';

const SUPPORTED_LANGS = [
  'en',
  'sv',
  'da',
  'no',
  'fi',
  'de',
  'fr',
  'es',
  'nl',
  'ar',
  'he',
  'ja',
  'ko',
  'zh',
] as const;

const LATIN_LTR = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl'];
const RTL = ['ar', 'he'];
const CJK = ['ja', 'ko', 'zh'];

describe('serp-budgets — contract parity for all 14 languages', () => {
  it('declares every supported language in LANG_TITLE_WINDOWS', () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(LANG_TITLE_WINDOWS[lang], `missing title window for ${lang}`).toBeDefined();
    }
  });

  it('declares every supported language in LANG_DESCRIPTION_WINDOWS', () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(
        LANG_DESCRIPTION_WINDOWS[lang],
        `missing description window for ${lang}`,
      ).toBeDefined();
    }
  });

  it.each(LATIN_LTR)('honours the Latin LTR contract for %s (55-70 / 140-200)', (lang) => {
    expect(LANG_TITLE_WINDOWS[lang]).toEqual({ softMin: 55, hardMax: 70 });
    expect(LANG_DESCRIPTION_WINDOWS[lang]).toEqual({ softMin: 140, hardMax: 200 });
  });

  it.each(RTL)('honours the RTL contract for %s (45-60 / 120-170)', (lang) => {
    expect(LANG_TITLE_WINDOWS[lang]).toEqual({ softMin: 45, hardMax: 60 });
    expect(LANG_DESCRIPTION_WINDOWS[lang]).toEqual({ softMin: 120, hardMax: 170 });
  });

  it.each(CJK)('honours the CJK contract for %s (30-45 / 70-120)', (lang) => {
    expect(LANG_TITLE_WINDOWS[lang]).toEqual({ softMin: 30, hardMax: 45 });
    expect(LANG_DESCRIPTION_WINDOWS[lang]).toEqual({ softMin: 70, hardMax: 120 });
  });
});

describe('normalisePrimaryLangSubtag — BCP-47 → primary subtag', () => {
  it.each([
    ['zh-CN', 'zh'],
    ['zh-Hans-CN', 'zh'],
    ['JA', 'ja'],
    ['Ar', 'ar'],
    ['  de  ', 'de'],
    ['nb-NO', 'nb'],
    ['en_US', 'en'],
  ])('normalises %s → %s', (input, expected) => {
    expect(normalisePrimaryLangSubtag(input)).toBe(expected);
  });

  it('returns null for null / undefined / whitespace', () => {
    expect(normalisePrimaryLangSubtag(null)).toBeNull();
    expect(normalisePrimaryLangSubtag(undefined)).toBeNull();
    expect(normalisePrimaryLangSubtag('   ')).toBeNull();
  });
});

describe('titleWindowForLanguage / descriptionWindowForLanguage — fallback', () => {
  it('falls back to EN window for null / undefined / unknown lang', () => {
    const enT = LANG_TITLE_WINDOWS.en;
    const enD = LANG_DESCRIPTION_WINDOWS.en;
    expect(titleWindowForLanguage(null)).toEqual(enT);
    expect(titleWindowForLanguage(undefined)).toEqual(enT);
    expect(titleWindowForLanguage('xx-YY')).toEqual(enT);
    expect(descriptionWindowForLanguage(null)).toEqual(enD);
    expect(descriptionWindowForLanguage(undefined)).toEqual(enD);
    expect(descriptionWindowForLanguage('xx-YY')).toEqual(enD);
  });

  it('resolves BCP-47 region variants to the primary-subtag window', () => {
    // zh-CN, zh-TW, zh-Hans → all map to the CJK zh window
    expect(titleWindowForLanguage('zh-CN')).toEqual(LANG_TITLE_WINDOWS.zh);
    expect(titleWindowForLanguage('zh-TW')).toEqual(LANG_TITLE_WINDOWS.zh);
    expect(descriptionWindowForLanguage('zh-Hans-CN')).toEqual(
      LANG_DESCRIPTION_WINDOWS.zh,
    );
    expect(titleWindowForLanguage('JA')).toEqual(LANG_TITLE_WINDOWS.ja);
  });
});

describe('buildSeoTitle — 14-language matrix never overshoots hardMax', () => {
  // A pathologically long H1 (>140 chars in every script) — the renderer
  // must clamp to the per-language hardMax for every supported language.
  const LONG_H1s: Record<string, string> = {
    en: 'Sweden Abolishes Permanent Residence and Expands Security Deportation: A Pre-Election Legislative Reckoning That Shapes the 2026 Campaign',
    sv: 'Sverige Avskaffar Permanent Uppehållstillstånd och Utökar Säkerhetsutvisning: En Förvalslagstiftningsuppgörelse Som Formar 2026 Års Kampanj',
    da: 'Sverige Afskaffer Permanent Opholdstilladelse og Udvider Sikkerhedsudvisning: Et Førvalg Lovgivningsmæssigt Opgør Der Former 2026-Kampagnen',
    no: 'Sverige Avskaffer Permanent Oppholdstillatelse og Utvider Sikkerhetsutvisning: Et Førvalg Lovgivningsmessig Oppgjør Som Former 2026-Kampanjen',
    fi: 'Ruotsi Lakkauttaa Pysyvän Oleskeluluvan ja Laajentaa Turvallisuuskarkotusta: Vaaleja Edeltävä Lainsäädännöllinen Tilinteko Joka Muokkaa Vuoden 2026 Kampanjaa',
    de: 'Schweden Schafft Dauerhaften Aufenthaltstitel ab und Erweitert Sicherheitsabschiebung: Eine Vorwahllegislative Abrechnung die die Kampagne 2026 Prägt',
    fr: 'La Suède Abolit le Permis de Séjour Permanent et Étend l’Expulsion de Sécurité: Un Règlement Législatif Préélectoral Qui Façonne la Campagne 2026',
    es: 'Suecia Abole el Permiso de Residencia Permanente y Amplía la Deportación de Seguridad: Un Ajuste Legislativo Preelectoral que Da Forma a la Campaña 2026',
    nl: 'Zweden Schaft Permanente Verblijfsvergunning Af en Breidt Veiligheidsuitzetting Uit: Een Pre-Verkiezings Wetgevende Afrekening Die de Campagne 2026 Vormgeeft',
    ar: 'السويد تلغي الإقامة الدائمة وتوسع الترحيل الأمني: محاسبة تشريعية قبل الانتخابات تشكل حملة عام ألفين وستة وعشرين القادمة بشكل جوهري ومحوري للناخبين',
    he: 'שבדיה מבטלת תושבות קבע ומרחיבה גירוש ביטחוני: התחשבנות חקיקתית טרום־בחירות שמעצבת את מערכת הבחירות לשנת אלפיים עשרים ושש בצורה מהותית ומרכזית למצביעים',
    ja: 'スウェーデンは永住権を廃止し安全保障に基づく国外退去措置を拡大する選挙前の立法的清算が二〇二六年の選挙運動を形作る重要な政治的転換点となるであろうことについての包括的な分析',
    ko: '스웨덴은 영주권을 폐지하고 안보 추방을 확대하는 선거 전 입법적 청산이 이천이십육년 선거 운동을 형성하는 중요한 정치적 전환점이 될 것임에 대한 포괄적인 분석과 평가',
    zh: '瑞典废除永久居留权并扩大安全驱逐出境措施这一选举前的立法清算将塑造二零二六年的竞选活动成为重要的政治转折点这是对当前北欧政治格局的全面分析与评估报告内容',
  };

  it.each(SUPPORTED_LANGS)(
    'clamps a long H1 to ≤ hardMax for lang=%s',
    (lang) => {
      const h1 = LONG_H1s[lang]!;
      const { hardMax } = titleWindowForLanguage(lang);
      const result = buildSeoTitle({
        title: h1,
        description: '',
        lang,
        date: '2026-05-22',
        articleTypeLabel: 'Motions',
        articleTypeId: 'motions',
      });
      expect(
        result.length,
        `lang=${lang} result="${result}" (length=${result.length}) exceeds hardMax=${hardMax}`,
      ).toBeLessThanOrEqual(hardMax);
    },
  );

  it('CJK ja: 50-glyph H1 clamps to ≤ 45 glyphs and drops brand suffix', () => {
    // 50-glyph Japanese H1 (>45 budget) — brand suffix must be dropped
    // and the title clamped to the CJK budget.
    const h1 = 'センタパルティエットが労働組合の政党献金法をめぐりティドーブロックから離脱を表明した重要会議';
    const result = buildSeoTitle({
      title: h1,
      description: '',
      lang: 'ja',
      date: '2026-05-22',
      articleTypeLabel: '動議',
      articleTypeId: 'motions',
    });
    expect(result.length).toBeLessThanOrEqual(45);
    expect(result).not.toMatch(/Riksdagsmonitor/);
  });

  it('RTL ar: a 100-char Arabic H1 clamps to ≤ 60 chars', () => {
    const h1 = 'السويد تلغي الإقامة الدائمة وتوسع الترحيل الأمني محاسبة تشريعية قبل الانتخابات تشكل حملة عام ألفين وستة وعشرين';
    const result = buildSeoTitle({
      title: h1,
      description: '',
      lang: 'ar',
      date: '2026-05-22',
      articleTypeLabel: 'مقترحات',
      articleTypeId: 'motions',
    });
    expect(result.length).toBeLessThanOrEqual(60);
  });

  it('Latin LTR: existing 70-char SERP budget unchanged for EN', () => {
    const h1 = 'Sweden Abolishes Permanent Residence and Expands Security Deportation: A Pre-Election Legislative Reckoning';
    const result = buildSeoTitle({
      title: h1,
      description: '',
      lang: 'en',
      date: '2026-05-22',
      articleTypeLabel: 'Motions',
      articleTypeId: 'motions',
    });
    expect(result.length).toBeLessThanOrEqual(70);
  });
});

describe('buildSeoDescription — 14-language matrix never overshoots hardMax', () => {
  // A pathologically long description (≥250 chars) for every language.
  const LONG_DESC = {
    en: 'Sweden\'s Riksdag has voted to abolish permanent residence and expand security-based deportation in a sweeping pre-election legislative package that consolidates the Tidö coalition\'s migration agenda and reshapes Sweden\'s integration regime for the next decade by tightening pathways to citizenship across multiple statutory channels.',
    sv: 'Sveriges Riksdag har röstat för att avskaffa permanent uppehållstillstånd och utöka säkerhetsutvisning i ett omfattande förvalslagstiftningspaket som befäster Tidökoalitionens migrationsagenda och omformar Sveriges integrationsregim för det kommande decenniet genom att skärpa vägar till medborgarskap.',
    da: 'Sveriges Rigsdag har stemt for at afskaffe permanent opholdstilladelse og udvide sikkerhedsbaseret udvisning i en omfattende lovgivningspakke før valget som konsoliderer Tidö-koalitionens migrationsagenda og omformer Sveriges integrationsregime for det næste årti gennem strammere veje til statsborgerskab.',
    no: 'Sveriges Riksdag har stemt for å avskaffe permanent oppholdstillatelse og utvide sikkerhetsbasert utvisning i en omfattende lovgivningspakke før valget som konsoliderer Tidö-koalisjonens migrasjonsagenda og omformer Sveriges integrasjonsregime for det neste tiåret gjennom strammere veier til statsborgerskap.',
    fi: 'Ruotsin Valtiopäivät on äänestänyt pysyvän oleskeluluvan lakkauttamisen ja turvallisuusperustaisen karkotuksen laajentamisen puolesta laajassa vaaleja edeltävässä lainsäädäntöpaketissa joka vahvistaa Tidö-koalition maahanmuuttoagendaa ja muokkaa Ruotsin integraatiojärjestelmää seuraavalle vuosikymmenelle tiukentamalla kansalaisuuden saamisen polkuja.',
    de: 'Schwedens Reichstag hat dafür gestimmt, die dauerhafte Aufenthaltserlaubnis abzuschaffen und die sicherheitsbasierte Abschiebung in einem umfassenden Vorwahlgesetzespaket auszuweiten, das die Migrationsagenda der Tidö-Koalition konsolidiert und Schwedens Integrationsregime für das nächste Jahrzehnt durch eine Verschärfung der Wege zur Staatsbürgerschaft umgestaltet.',
    fr: 'Le Riksdag suédois a voté pour abolir le permis de séjour permanent et étendre l\'expulsion fondée sur la sécurité dans un vaste paquet législatif préélectoral qui consolide l\'agenda migratoire de la coalition Tidö et remodèle le régime d\'intégration de la Suède pour la prochaine décennie en resserrant les voies vers la citoyenneté à travers plusieurs canaux statutaires.',
    es: 'El Riksdag de Suecia ha votado a favor de abolir la residencia permanente y ampliar la deportación basada en seguridad en un amplio paquete legislativo preelectoral que consolida la agenda migratoria de la coalición Tidö y reconfigura el régimen de integración de Suecia para la próxima década al endurecer las vías hacia la ciudadanía a través de múltiples canales estatutarios oficiales.',
    nl: 'De Zweedse Rijksdag heeft gestemd om de permanente verblijfsvergunning af te schaffen en de veiligheidsgebaseerde uitzetting uit te breiden in een uitgebreid pre-electoraal wetgevend pakket dat de migratieagenda van de Tidö-coalitie consolideert en het integratieregime van Zweden voor het komende decennium hervormt door de wegen naar het staatsburgerschap aan te scherpen.',
    ar: 'صوّت البرلمان السويدي على إلغاء الإقامة الدائمة وتوسيع الترحيل الأمني في حزمة تشريعية شاملة قبل الانتخابات تعزز أجندة الهجرة لتحالف تيدو وتعيد تشكيل نظام الاندماج في السويد للعقد المقبل من خلال تشديد مسارات الجنسية عبر قنوات قانونية متعددة لكافة المتقدمين الحاليين والمستقبليين.',
    he: 'הריקסדאג השוודי הצביע לבטל את התושבות הקבע ולהרחיב את הגירוש על רקע ביטחוני בחבילת חקיקה מקיפה לפני הבחירות שמגבשת את סדר היום של ההגירה של קואליציית תידו ומעצבת מחדש את משטר השילוב של שוודיה לעשור הקרוב על ידי הידוק נתיבי האזרחות במספר ערוצים סטטוטוריים שונים.',
    ja: 'スウェーデン議会は永住権を廃止し安全保障に基づく国外退去措置を拡大する選挙前の包括的な立法パッケージを可決しティドー連立政権の移民政策議題を統合し今後十年間のスウェーデンの統合体制を再構築するため国籍取得への複数の法定経路を厳格化する措置を含む重要法案であります。',
    ko: '스웨덴 의회는 영주권을 폐지하고 안보 기반 추방을 확대하는 선거 전 포괄적 입법 패키지를 통과시켜 티도 연정의 이민 의제를 통합하고 향후 십 년간 스웨덴의 통합 체제를 재편하기 위해 여러 법적 경로를 통한 시민권 취득 경로를 엄격하게 강화하는 중요 조치를 포함하는 법안입니다.',
    zh: '瑞典国会投票通过废除永久居留权并扩大基于安全的驱逐出境措施这一选举前的全面立法方案该方案巩固了蒂多联盟的移民议程并通过收紧多个法定渠道的入籍途径重塑瑞典未来十年的融合体制为下届选举前最重要的立法行动之一具有深远战略意义。',
  } as const;

  it.each(SUPPORTED_LANGS)(
    'clamps a long description to ≤ hardMax for lang=%s',
    (lang) => {
      const description = LONG_DESC[lang]!;
      const { hardMax } = descriptionWindowForLanguage(lang);
      const result = buildSeoDescription({
        title: 'Test',
        description,
        lang,
        date: '2026-05-22',
        articleTypeLabel: 'Motions',
        articleTypeId: 'motions',
      });
      expect(
        result.length,
        `lang=${lang} result.length=${result.length} exceeds hardMax=${hardMax}`,
      ).toBeLessThanOrEqual(hardMax);
    },
  );

  it('falls back to EN 200-char budget when lang is omitted', () => {
    const desc = LONG_DESC.en;
    const result = buildSeoDescription({
      title: 'Test',
      description: desc,
      // @ts-expect-error — exercising the no-lang fallback path
      lang: undefined,
      date: '2026-05-22',
      articleTypeLabel: 'Motions',
      articleTypeId: 'motions',
    });
    expect(result.length).toBeLessThanOrEqual(200);
  });
});
