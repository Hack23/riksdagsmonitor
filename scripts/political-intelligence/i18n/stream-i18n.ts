/**
 * @module Infrastructure/PoliticalIntelligence/I18n/StreamI18n
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Stream metadata, names, descriptions + helpers (14 languages)
 *
 * @description
 * Owns the workflow-stream (propositions / motions / committeeReports /
 * realtime-HHMM …) bounded context: icons, English canonical descriptions,
 * per-language display names + descriptions, plus the helpers
 * `prettifyStream`, `streamIcon`, `streamDisplayName`, `streamDescription`.
 *
 * Round-6 split: extracted from `scripts/generate-political-intelligence.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';

export const STREAM_META: Record<string, { icon: string; description: string }> = {
  propositions: { icon: '📜', description: 'Government propositions (bills tabled by the Cabinet).' },
  motions: { icon: '✍️', description: 'Member motions (bills and proposals introduced by MPs).' },
  interpellations: { icon: '❓', description: 'Interpellations — formal ministerial questions and responses.' },
  committeeReports: { icon: '🏛️', description: 'Parliamentary committee reports (betänkanden) and recommendations.' },
  'committee-reports': { icon: '🏛️', description: 'Parliamentary committee reports (betänkanden) and recommendations.' },
  'evening-analysis': { icon: '🌙', description: 'Evening analysis synthesising the day\'s parliamentary and government developments.' },
  'deep-inspection': { icon: '🔬', description: 'Deep inspection — long-form structured analysis of a focused topic.' },
  'week-ahead': { icon: '📅', description: 'Week-ahead prospective coverage of scheduled parliamentary activity.' },
  'month-ahead': { icon: '📆', description: 'Month-ahead forward-looking intelligence covering scheduled activity.' },
  'weekly-review': { icon: '🗓️', description: 'Weekly review synthesising the week\'s political and legislative developments.' },
  'monthly-review': { icon: '📊', description: 'Monthly review synthesising the month\'s political and legislative developments.' },
  'breaking-news': { icon: '🚨', description: 'Breaking-news intelligence products generated in response to significant events.' },
};

// ---------------------------------------------------------------------------
// Per-language description overlays — every stream, methodology, template, and
// artifact filename has a concise localised description for all 14 supported
// languages. Helpers fall back to English when a specific key/lang is missing.
// ---------------------------------------------------------------------------

/** Per-language display name for each known stream slug. */

export const STREAM_NAME_I18N: Record<string, Record<Language, string>> = {
  propositions: {
    en: 'Propositions', sv: 'Propositioner', da: 'Propositioner', no: 'Proposisjoner', fi: 'Propositiot',
    de: 'Propositionen', fr: 'Propositions', es: 'Proposiciones', nl: 'Proposities',
    ar: 'المقترحات الحكومية', he: 'הצעות חוק ממשלתיות', ja: '政府法案', ko: '정부 제안', zh: '政府法案',
  },
  motions: {
    en: 'Motions', sv: 'Motioner', da: 'Motioner', no: 'Motsjoner', fi: 'Aloitteet',
    de: 'Motionen', fr: 'Motions', es: 'Mociones', nl: 'Moties',
    ar: 'عرائض برلمانية', he: 'הצעות חוק פרטיות', ja: '動議', ko: '의안', zh: '动议',
  },
  interpellations: {
    en: 'Interpellations', sv: 'Interpellationer', da: 'Interpellationer', no: 'Interpellasjoner', fi: 'Interpellaatiot',
    de: 'Interpellationen', fr: 'Interpellations', es: 'Interpelaciones', nl: 'Interpellaties',
    ar: 'استجوابات وزارية', he: 'שאילתות', ja: '質問主意書', ko: '질의', zh: '质询',
  },
  committeeReports: {
    en: 'Committee Reports', sv: 'Betänkanden', da: 'Udvalgsrapporter', no: 'Komitérapporter', fi: 'Valiokuntaraportit',
    de: 'Ausschussberichte', fr: 'Rapports de commission', es: 'Informes de comité', nl: 'Commissierapporten',
    ar: 'تقارير اللجان', he: 'דוחות ועדה', ja: '委員会報告', ko: '위원회 보고서', zh: '委员会报告',
  },
  'committee-reports': {
    en: 'Committee Reports', sv: 'Betänkanden', da: 'Udvalgsrapporter', no: 'Komitérapporter', fi: 'Valiokuntaraportit',
    de: 'Ausschussberichte', fr: 'Rapports de commission', es: 'Informes de comité', nl: 'Commissierapporten',
    ar: 'تقارير اللجان', he: 'דוחות ועדה', ja: '委員会報告', ko: '위원회 보고서', zh: '委员会报告',
  },
  'evening-analysis': {
    en: 'Evening Analysis', sv: 'Kvällsanalys', da: 'Aftenanalyse', no: 'Kveldsanalyse', fi: 'Ilta-analyysi',
    de: 'Abendanalyse', fr: 'Analyse du soir', es: 'Análisis vespertino', nl: 'Avondanalyse',
    ar: 'تحليل مسائي', he: 'ניתוח ערב', ja: '夜間分析', ko: '저녁 분석', zh: '晚间分析',
  },
  'deep-inspection': {
    en: 'Deep Inspection', sv: 'Djupgranskning', da: 'Dybdeinspektion', no: 'Dybdegranskning', fi: 'Syvätarkastelu',
    de: 'Tiefeninspektion', fr: 'Inspection approfondie', es: 'Inspección profunda', nl: 'Diepte-inspectie',
    ar: 'فحص معمق', he: 'בדיקה מעמיקה', ja: '詳細調査', ko: '심층 조사', zh: '深度检查',
  },
  'week-ahead': {
    en: 'Week Ahead', sv: 'Veckan framåt', da: 'Ugen forude', no: 'Uken fremover', fi: 'Tuleva viikko',
    de: 'Kommende Woche', fr: 'Semaine à venir', es: 'Semana próxima', nl: 'Komende week',
    ar: 'الأسبوع القادم', he: 'השבוע הקרוב', ja: '今後一週間', ko: '다음 주', zh: '未来一周',
  },
  'month-ahead': {
    en: 'Month Ahead', sv: 'Månaden framåt', da: 'Måneden forude', no: 'Måneden fremover', fi: 'Tuleva kuukausi',
    de: 'Kommender Monat', fr: 'Mois à venir', es: 'Mes próximo', nl: 'Komende maand',
    ar: 'الشهر القادم', he: 'החודש הקרוב', ja: '今後一か月', ko: '다음 달', zh: '未来一月',
  },
  'weekly-review': {
    en: 'Weekly Review', sv: 'Veckoöversikt', da: 'Ugeoversigt', no: 'Ukesoppsummering', fi: 'Viikkokatsaus',
    de: 'Wochenrückblick', fr: 'Revue hebdomadaire', es: 'Resumen semanal', nl: 'Weekoverzicht',
    ar: 'المراجعة الأسبوعية', he: 'סקירה שבועית', ja: '週次レビュー', ko: '주간 리뷰', zh: '每周综述',
  },
  'monthly-review': {
    en: 'Monthly Review', sv: 'Månadsöversikt', da: 'Månedsoversigt', no: 'Månedsoppsummering', fi: 'Kuukausikatsaus',
    de: 'Monatsrückblick', fr: 'Revue mensuelle', es: 'Resumen mensual', nl: 'Maandoverzicht',
    ar: 'المراجعة الشهرية', he: 'סקירה חודשית', ja: '月次レビュー', ko: '월간 리뷰', zh: '每月综述',
  },
  'breaking-news': {
    en: 'Breaking News', sv: 'Senaste nytt', da: 'Breaking news', no: 'Siste nytt', fi: 'Uutisvirta',
    de: 'Eilmeldungen', fr: 'Actualité urgente', es: 'Noticias de última hora', nl: 'Laatste nieuws',
    ar: 'أخبار عاجلة', he: 'חדשות בוערות', ja: '速報', ko: '속보', zh: '突发新闻',
  },
  documents: {
    en: 'Documents', sv: 'Dokument', da: 'Dokumenter', no: 'Dokumenter', fi: 'Asiakirjat',
    de: 'Dokumente', fr: 'Documents', es: 'Documentos', nl: 'Documenten',
    ar: 'الوثائق', he: 'מסמכים', ja: '文書', ko: '문서', zh: '文档',
  },
};

/** Per-language description for each known stream slug. */
export const STREAM_DESC_I18N: Record<string, Record<Language, string>> = {
  propositions: {
    en: 'Government propositions (bills tabled by the Cabinet).',
    sv: 'Regeringens propositioner (lagförslag från regeringen).',
    da: 'Regeringens propositioner (lovforslag fra kabinettet).',
    no: 'Regjeringens proposisjoner (lovforslag fra regjeringen).',
    fi: 'Hallituksen esitykset (hallituksen lakiehdotukset).',
    de: 'Regierungsvorlagen (vom Kabinett eingebrachte Gesetzentwürfe).',
    fr: 'Propositions gouvernementales (projets de loi déposés par le gouvernement).',
    es: 'Proposiciones del Gobierno (proyectos de ley presentados por el Gabinete).',
    nl: 'Regeringsvoorstellen (wetsvoorstellen ingediend door het Kabinet).',
    ar: 'مقترحات حكومية (مشاريع قوانين مقدمة من مجلس الوزراء).',
    he: 'הצעות חוק ממשלתיות (הצעות שהונחו על־ידי הקבינט).',
    ja: '政府提出法案（内閣が提出する法律案）。',
    ko: '정부 제안 법안(내각이 제출한 법률안).',
    zh: '政府法案（内阁提交的法案）。',
  },
  motions: {
    en: 'Member motions (bills and proposals introduced by MPs).',
    sv: 'Motioner (förslag från enskilda riksdagsledamöter).',
    da: 'Motioner (lovforslag indbragt af folketingsmedlemmer).',
    no: 'Motsjoner (forslag fra enkelte stortingsrepresentanter).',
    fi: 'Kansanedustajien aloitteet (edustajien lakialoitteet ja ehdotukset).',
    de: 'Anträge von Abgeordneten (von Parlamentariern eingebrachte Gesetzentwürfe und Vorschläge).',
    fr: 'Motions parlementaires (projets et propositions déposés par les députés).',
    es: 'Mociones de miembros (proyectos y propuestas presentados por los parlamentarios).',
    nl: 'Moties van leden (wetsvoorstellen en voorstellen ingediend door Kamerleden).',
    ar: 'عرائض النواب (مشاريع قوانين ومقترحات يقدمها أعضاء البرلمان).',
    he: 'הצעות חוק פרטיות של חברי פרלמנט.',
    ja: '議員発議の動議（議員が提出する法案・提案）。',
    ko: '의원 발의 의안(의원이 제출한 법안 및 제안).',
    zh: '议员动议（国会议员提出的法案和提案）。',
  },
  interpellations: {
    en: 'Interpellations — formal ministerial questions and responses.',
    sv: 'Interpellationer — formella ministerfrågor och svar.',
    da: 'Interpellationer — formelle ministerspørgsmål og svar.',
    no: 'Interpellasjoner — formelle statsrådsspørsmål og svar.',
    fi: 'Interpellaatiot — ministeriöille esitettyjä muodollisia kysymyksiä ja vastauksia.',
    de: 'Interpellationen — formelle Anfragen an Minister und deren Antworten.',
    fr: 'Interpellations — questions ministérielles formelles et réponses.',
    es: 'Interpelaciones: preguntas ministeriales formales y sus respuestas.',
    nl: 'Interpellaties — formele ministeriële vragen en antwoorden.',
    ar: 'استجوابات — أسئلة وزارية رسمية وإجاباتها.',
    he: 'שאילתות — שאלות רשמיות לשרים ותשובותיהם.',
    ja: '質問主意書 — 閣僚に対する正式な質問と回答。',
    ko: '질의 — 장관에 대한 공식 질문과 답변.',
    zh: '质询 — 向部长提出的正式问题及其答复。',
  },
  committeeReports: {
    en: 'Parliamentary committee reports (betänkanden) and recommendations.',
    sv: 'Riksdagens utskottsbetänkanden och rekommendationer.',
    da: 'Udvalgsbetænkninger og anbefalinger fra Folketingets udvalg.',
    no: 'Komitébetenkninger og tilrådninger fra Stortingets komiteer.',
    fi: 'Eduskunnan valiokuntien mietinnöt ja suositukset.',
    de: 'Berichte und Empfehlungen der Parlamentsausschüsse (betänkanden).',
    fr: 'Rapports des commissions parlementaires (betänkanden) et recommandations.',
    es: 'Informes y recomendaciones de las comisiones parlamentarias (betänkanden).',
    nl: 'Rapporten en aanbevelingen van parlementaire commissies (betänkanden).',
    ar: 'تقارير لجان البرلمان السويدي (بيتينكانديْن) وتوصياتها.',
    he: 'דוחות והמלצות של ועדות הפרלמנט (betänkanden).',
    ja: '国会委員会報告（betänkanden）と勧告。',
    ko: '의회 위원회 보고서(betänkanden)와 권고.',
    zh: '议会委员会报告（betänkanden）及建议。',
  },
  'committee-reports': {
    en: 'Parliamentary committee reports (betänkanden) and recommendations.',
    sv: 'Riksdagens utskottsbetänkanden och rekommendationer.',
    da: 'Udvalgsbetænkninger og anbefalinger fra Folketingets udvalg.',
    no: 'Komitébetenkninger og tilrådninger fra Stortingets komiteer.',
    fi: 'Eduskunnan valiokuntien mietinnöt ja suositukset.',
    de: 'Berichte und Empfehlungen der Parlamentsausschüsse (betänkanden).',
    fr: 'Rapports des commissions parlementaires (betänkanden) et recommandations.',
    es: 'Informes y recomendaciones de las comisiones parlamentarias (betänkanden).',
    nl: 'Rapporten en aanbevelingen van parlementaire commissies (betänkanden).',
    ar: 'تقارير لجان البرلمان السويدي (بيتينكانديْن) وتوصياتها.',
    he: 'דוחות והמלצות של ועדות הפרלמנט (betänkanden).',
    ja: '国会委員会報告（betänkanden）と勧告。',
    ko: '의회 위원회 보고서(betänkanden)와 권고.',
    zh: '议会委员会报告（betänkanden）及建议。',
  },
  'evening-analysis': {
    en: 'Evening analysis synthesising the day\'s parliamentary and government developments.',
    sv: 'Kvällsanalys som sammanfattar dagens händelser i riksdag och regering.',
    da: 'Aftenanalyse der samler dagens parlaments- og regeringsudvikling.',
    no: 'Kveldsanalyse som oppsummerer dagens hendelser i parlament og regjering.',
    fi: 'Ilta-analyysi, joka kokoaa päivän parlamentti- ja hallituskehityksen.',
    de: 'Abendanalyse, die die parlamentarischen und Regierungsereignisse des Tages zusammenfasst.',
    fr: 'Analyse du soir synthétisant les développements parlementaires et gouvernementaux du jour.',
    es: 'Análisis vespertino que sintetiza los acontecimientos parlamentarios y gubernamentales del día.',
    nl: 'Avondanalyse die de parlementaire en regeringsontwikkelingen van de dag samenvat.',
    ar: 'تحليل مسائي يُجمِل تطورات البرلمان والحكومة خلال اليوم.',
    he: 'ניתוח ערב המסכם את התפתחויות הפרלמנט והממשלה מהיום.',
    ja: '議会と政府のその日の動向をまとめる夜間分析。',
    ko: '당일 의회 및 정부 상황을 종합한 저녁 분석.',
    zh: '汇总当日议会和政府动态的晚间分析。',
  },
  'deep-inspection': {
    en: 'Deep inspection — long-form structured analysis of a focused topic.',
    sv: 'Djupgranskning — utförlig strukturerad analys av ett fokuserat ämne.',
    da: 'Dybdeinspektion — lang, struktureret analyse af et fokuseret emne.',
    no: 'Dybdegranskning — lang strukturert analyse av et fokusert emne.',
    fi: 'Syvätarkastelu — pitkä, jäsennelty analyysi rajatusta aiheesta.',
    de: 'Tiefeninspektion — strukturierte Langform-Analyse zu einem fokussierten Thema.',
    fr: 'Inspection approfondie — analyse structurée et longue sur un sujet ciblé.',
    es: 'Inspección profunda: análisis estructurado y extenso sobre un tema concreto.',
    nl: 'Diepte-inspectie — lange, gestructureerde analyse van een specifiek onderwerp.',
    ar: 'فحص معمق — تحليل منظم ومفصل لموضوع محدد.',
    he: 'בדיקה מעמיקה — ניתוח מובנה וארוך על נושא ממוקד.',
    ja: '特定のテーマに焦点を当てた長編の構造化分析（詳細調査）。',
    ko: '특정 주제에 초점을 맞춘 장문의 구조화 분석(심층 조사).',
    zh: '针对特定主题的长篇结构化分析（深度检查）。',
  },
  'week-ahead': {
    en: 'Week-ahead prospective coverage of scheduled parliamentary activity.',
    sv: 'Prospektiv bevakning för kommande vecka i riksdagen.',
    da: 'Fremadrettet dækning af den kommende uges parlamentariske aktivitet.',
    no: 'Framskuende dekning av neste ukes parlamentariske aktivitet.',
    fi: 'Tulevan viikon eduskuntatoiminnan ennakkokatsaus.',
    de: 'Vorausschauende Berichterstattung zur parlamentarischen Tagesordnung der kommenden Woche.',
    fr: 'Couverture prospective de l\'activité parlementaire prévue pour la semaine à venir.',
    es: 'Cobertura prospectiva de la actividad parlamentaria prevista para la semana próxima.',
    nl: 'Vooruitblik op de parlementaire agenda van de komende week.',
    ar: 'تغطية استشرافية لأنشطة البرلمان في الأسبوع القادم.',
    he: 'סקירה צופה פני עתיד של פעילות הפרלמנט בשבוע הקרוב.',
    ja: '翌週に予定されている議会活動の先行分析。',
    ko: '다음 주 의회 활동에 대한 사전 분석.',
    zh: '对未来一周议会活动的前瞻报道。',
  },
  'month-ahead': {
    en: 'Month-ahead forward-looking intelligence covering scheduled activity.',
    sv: 'Framåtblickande underrättelser för kommande månad.',
    da: 'Fremadrettet efterretning for den kommende måned.',
    no: 'Framskuende etterretning for neste måneds planlagte aktivitet.',
    fi: 'Tulevan kuukauden ennakoiva tiedustelukatsaus.',
    de: 'Vorausschauende Intelligenz zur geplanten Tätigkeit im kommenden Monat.',
    fr: 'Renseignement prospectif couvrant l\'activité planifiée du mois à venir.',
    es: 'Inteligencia prospectiva sobre la actividad programada del próximo mes.',
    nl: 'Vooruitkijkende inlichtingen voor de geplande activiteit van de komende maand.',
    ar: 'استخبارات استشرافية تغطي النشاط المخطط للشهر القادم.',
    he: 'מודיעין צופה פני עתיד לפעילות המתוכננת בחודש הקרוב.',
    ja: '翌月の予定活動に関する先読みインテリジェンス。',
    ko: '다음 달 예정 활동을 다루는 사전 인텔리전스.',
    zh: '覆盖未来一月预定活动的前瞻性情报。',
  },
  'weekly-review': {
    en: 'Weekly review synthesising the week\'s political and legislative developments.',
    sv: 'Veckoöversikt som sammanfattar veckans politiska och lagstiftningsmässiga händelser.',
    da: 'Ugeoversigt der samler ugens politiske og lovgivningsmæssige udvikling.',
    no: 'Ukeoppsummering som samler ukens politiske og lovgivende utvikling.',
    fi: 'Viikkokatsaus, joka kokoaa viikon poliittiset ja lainsäädännölliset tapahtumat.',
    de: 'Wochenrückblick, der die politischen und legislativen Entwicklungen der Woche zusammenfasst.',
    fr: 'Revue hebdomadaire synthétisant les développements politiques et législatifs de la semaine.',
    es: 'Resumen semanal que sintetiza los desarrollos políticos y legislativos de la semana.',
    nl: 'Weekoverzicht dat de politieke en wetgevende ontwikkelingen van de week samenvat.',
    ar: 'مراجعة أسبوعية تُجمل التطورات السياسية والتشريعية للأسبوع.',
    he: 'סקירה שבועית המסכמת את ההתפתחויות הפוליטיות והחקיקתיות מהשבוע.',
    ja: '週の政治・立法動向をまとめる週次レビュー。',
    ko: '한 주의 정치·입법 동향을 종합한 주간 리뷰.',
    zh: '汇总本周政治与立法动态的每周综述。',
  },
  'monthly-review': {
    en: 'Monthly review synthesising the month\'s political and legislative developments.',
    sv: 'Månadsöversikt som sammanfattar månadens politiska och lagstiftningsmässiga händelser.',
    da: 'Månedsoversigt der samler månedens politiske og lovgivningsmæssige udvikling.',
    no: 'Månedsoppsummering som samler månedens politiske og lovgivende utvikling.',
    fi: 'Kuukausikatsaus, joka kokoaa kuukauden poliittiset ja lainsäädännölliset tapahtumat.',
    de: 'Monatsrückblick, der die politischen und legislativen Entwicklungen des Monats zusammenfasst.',
    fr: 'Revue mensuelle synthétisant les développements politiques et législatifs du mois.',
    es: 'Resumen mensual que sintetiza los desarrollos políticos y legislativos del mes.',
    nl: 'Maandoverzicht dat de politieke en wetgevende ontwikkelingen van de maand samenvat.',
    ar: 'مراجعة شهرية تُجمل التطورات السياسية والتشريعية للشهر.',
    he: 'סקירה חודשית המסכמת את ההתפתחויות הפוליטיות והחקיקתיות מהחודש.',
    ja: '月の政治・立法動向をまとめる月次レビュー。',
    ko: '한 달의 정치·입법 동향을 종합한 월간 리뷰.',
    zh: '汇总本月政治与立法动态的每月综述。',
  },
  'breaking-news': {
    en: 'Breaking-news intelligence products generated in response to significant events.',
    sv: 'Underrättelseprodukter som produceras direkt vid betydande händelser.',
    da: 'Efterretningsprodukter genereret som reaktion på væsentlige begivenheder.',
    no: 'Etterretningsprodukter laget som svar på betydelige hendelser.',
    fi: 'Merkittäviin tapahtumiin reagoivat uutisluokan tiedustelutuotteet.',
    de: 'Intelligenzprodukte, die als Reaktion auf bedeutende Ereignisse erstellt werden.',
    fr: 'Produits de renseignement générés en réponse à des événements majeurs.',
    es: 'Productos de inteligencia generados en respuesta a eventos significativos.',
    nl: 'Inlichtingenproducten die als reactie op belangrijke gebeurtenissen worden gegenereerd.',
    ar: 'منتجات استخباراتية عاجلة تُنتج استجابةً لأحداث بارزة.',
    he: 'מוצרי מודיעין הנוצרים בתגובה לאירועים משמעותיים.',
    ja: '重要な出来事に応じて生成される速報インテリジェンス製品。',
    ko: '중요한 사건에 대응하여 생성되는 속보 인텔리전스 제품.',
    zh: '针对重大事件即时产出的突发新闻情报产品。',
  },
  documents: {
    en: 'Raw source documents and supporting materials for this stream.',
    sv: 'Källdokument och stödmaterial som ligger till grund för strömmen.',
    da: 'Kildedokumenter og støttemateriale til denne strøm.',
    no: 'Kildedokumenter og støttemateriale for denne strømmen.',
    fi: 'Tämän virran lähdeasiakirjat ja tukimateriaalit.',
    de: 'Quelldokumente und Hintergrundmaterial für diesen Strom.',
    fr: 'Documents sources et éléments d\'appui pour ce flux.',
    es: 'Documentos fuente y materiales de apoyo de este flujo.',
    nl: 'Brondocumenten en ondersteunend materiaal voor deze stroom.',
    ar: 'الوثائق المصدرية والمواد الداعمة لهذا التيار.',
    he: 'מסמכי מקור וחומרי עזר לזרם זה.',
    ja: 'このストリームの原資料および補足資料。',
    ko: '이 스트림의 원본 문서 및 보조 자료.',
    zh: '本流的原始文档和支持材料。',
  },
};

/** Per-language realtime description template. */
export const REALTIME_DESC_I18N: Record<Language, string> = {
  en: 'Realtime snapshot capturing the parliamentary and government state at a specific time.',
  sv: 'Realtidssnapshot som fångar riksdagens och regeringens tillstånd vid en specifik tid.',
  da: 'Realtidsoptagelse der fanger parlamentets og regeringens tilstand på et bestemt tidspunkt.',
  no: 'Sanntidssnapshot som fanger parlamentets og regjeringens tilstand på et gitt tidspunkt.',
  fi: 'Reaaliaikainen tilannekuva, joka tallentaa parlamentin ja hallituksen tilan tietyllä hetkellä.',
  de: 'Echtzeit-Snapshot, der den parlamentarischen und Regierungszustand zu einem bestimmten Zeitpunkt festhält.',
  fr: 'Capture en temps réel de l\'état du parlement et du gouvernement à un moment donné.',
  es: 'Instantánea en tiempo real que captura el estado del parlamento y del Gobierno en un momento concreto.',
  nl: 'Realtime snapshot die de staat van parlement en regering op een specifiek moment vastlegt.',
  ar: 'لقطة في الزمن الحقيقي ترصد حالة البرلمان والحكومة في وقت محدد.',
  he: 'תמונת זמן אמת הלוכדת את מצב הפרלמנט והממשלה ברגע מסוים.',
  ja: 'ある時点における議会と政府の状態を捉えたリアルタイム・スナップショット。',
  ko: '특정 시점의 의회 및 정부 상태를 포착한 실시간 스냅샷.',
  zh: '捕捉某一时刻议会和政府状态的实时快照。',
};

/** Generic fallback for unknown streams, keyed by language. The "%s" placeholder
 *  is replaced by the prettified stream name. */
export const STREAM_GENERIC_DESC_I18N: Record<Language, string> = {
  en: 'Analytical content stream: %s.',
  sv: 'Analytisk innehållsström: %s.',
  da: 'Analytisk indholdsstrøm: %s.',
  no: 'Analytisk innholdsstrøm: %s.',
  fi: 'Analyyttinen sisältövirta: %s.',
  de: 'Analytischer Inhaltsstrom: %s.',
  fr: 'Flux de contenu analytique : %s.',
  es: 'Flujo de contenido analítico: %s.',
  nl: 'Analytische inhoudsstroom: %s.',
  ar: 'تيار محتوى تحليلي: %s.',
  he: 'זרם תוכן אנליטי: %s.',
  ja: '分析コンテンツストリーム: %s。',
  ko: '분석 콘텐츠 스트림: %s.',
  zh: '分析内容流：%s。',
};

// ---------------------------------------------------------------------------
// Localised descriptions for every methodology file, template file and
// recurring artifact filename. Entries fall back to the English META
// description when a specific key/lang combination is missing.
// ---------------------------------------------------------------------------



/**
 * Convert `propositions` → `Propositions`, `committee_reports` → `Committee Reports`.
 * Pure string transform; English-only — used as the cross-language fallback.
 */
export function prettifyStream(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Pick the icon for a stream. Falls back to bucket-specific icons for
 * realtime / morning / midday / evening cycle prefixes, then to a generic
 * package icon.
 */
export function streamIcon(name: string): string {
  if (STREAM_META[name]) return STREAM_META[name].icon;
  if (name === 'documents') return '📂';
  if (name.startsWith('realtime-')) return '⏱️';
  if (name.startsWith('morning-')) return '🌅';
  if (name.startsWith('midday-')) return '🕛';
  if (name.startsWith('evening-')) return '🌙';
  return '📦';
}

/** Localised stream display name (falls back to English prettify). */
export function streamDisplayName(name: string, lang: Language): string {
  const hit = STREAM_NAME_I18N[name]?.[lang];
  if (hit) return hit;
  // Preserve timestamp suffix for realtime-HHMM → "Realtime HH:MM" variants
  const match = name.match(/^realtime-(\d{2})(\d{2})$/);
  if (match) {
    const base = STREAM_NAME_I18N['breaking-news']?.[lang] ?? 'Realtime';
    // Use English "Realtime" label for clarity across languages
    return `${lang === 'en' ? 'Realtime' : base.replace(/breaking[-\s]?news?/i, 'Realtime')} ${match[1]}:${match[2]}`;
  }
  return prettifyStream(name);
}

/** Localised stream description. Falls back through realtime → generic. */
export function streamDescription(name: string, lang: Language): string {
  const hit = STREAM_DESC_I18N[name]?.[lang];
  if (hit) return hit;
  if (name.startsWith('realtime-')) return REALTIME_DESC_I18N[lang];
  const generic = STREAM_GENERIC_DESC_I18N[lang] ?? STREAM_GENERIC_DESC_I18N.en;
  return generic.replace('%s', streamDisplayName(name, lang));
}
