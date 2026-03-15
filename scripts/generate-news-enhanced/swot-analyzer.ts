/**
 * @module generate-news-enhanced/swot-analyzer
 * @description Multi-stakeholder SWOT analysis derived from document metadata
 * (types, titles, and document IDs). Classifies documents by type and uses
 * title keywords to produce metadata-driven SWOT entries for up to 9
 * stakeholder perspectives in all 14 supported languages. Replaces the static
 * SWOT_DEFAULTS template system.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import type { SwotEntry, SwotData } from '../types/article.js';
import type { StakeholderSwot, StakeholderCategory } from '../data-transformers/content-generators/stakeholder-swot-section.js';
import type { RawDocument } from '../data-transformers/types.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Extract the best available title from a raw document, capped at 80 chars */
function titleOf(d: RawDocument): string {
  return (d.titel || d.title || d.dokumentnamn || d.dok_id || '').slice(0, 80);
}

/** Derive lower-case keyword text from a document for stakeholder/EU detection */
function searchTextOf(d: RawDocument): string {
  return (d.titel || d.title || d.dokumentnamn || '').toLowerCase();
}

/** Extract the document ID for use as an evidence reference */
function refOf(d: RawDocument): string | undefined {
  return d.dok_id || undefined;
}

/** Convert raw docs into SWOT entries, collecting dok_ids as evidence refs.
 *  Docs whose derived title is empty are skipped to avoid blank list items. */
function docsToEntries(
  docs: RawDocument[],
  impact: 'high' | 'medium' | 'low' = 'medium',
  limit = 3,
): { entries: SwotEntry[]; refs: string[] } {
  const slice = docs.slice(0, limit);
  const entries: SwotEntry[] = [];
  const refs: string[] = [];
  for (const d of slice) {
    const text = titleOf(d);
    if (text) {
      entries.push({ text, impact });
    }
    const r = refOf(d);
    if (r) refs.push(r);
  }
  return { entries, refs };
}

// ---------------------------------------------------------------------------
// 14-language localised fallback strings (one per stakeholder × quadrant)
// These replace the old SWOT_DEFAULTS template strings and cover all languages.
// ---------------------------------------------------------------------------

type LangMap = Partial<Record<Language, string>>;

function loc(map: LangMap, lang: Language): string {
  return map[lang] ?? map.en ?? '';
}

// Government Coalition fallbacks
const GOV_S: LangMap = {
  en: 'Parliamentary majority and agenda-setting capacity',
  sv: 'Parlamentarisk majoritet och förmåga att sätta agendan',
  da: 'Parlamentarisk flertal og dagsordenskapacitet',
  no: 'Parlamentarisk flertall og evne til å sette dagsorden',
  fi: 'Parlamentaarinen enemmistö ja kyky asettaa asialista',
  de: 'Parlamentarische Mehrheit und Agenda-Setting-Kapazität',
  fr: "Majorité parlementaire et capacité à fixer l'ordre du jour",
  es: 'Mayoría parlamentaria y capacidad de establecer la agenda',
  nl: 'Parlementaire meerderheid en agendabepalende capaciteit',
  ar: 'الأغلبية البرلمانية وقدرة تحديد جدول الأعمال',
  he: 'רוב פרלמנטרי וכושר הגדרת סדר היום',
  ja: '議会過半数と議題設定能力',
  ko: '의회 다수결과 의제 설정 역량',
  zh: '议会多数席位和议程设定能力',
};
const GOV_W: LangMap = {
  en: 'Implementation resource constraints and timeline pressures',
  sv: 'Resursbegränsningar och tidspressen vid genomförande',
  da: 'Ressourcebegrænsninger og tidspres ved implementering',
  no: 'Ressursbegrensninger og tidspress ved implementering',
  fi: 'Toteutuksen resurssirajoitteet ja aikataulupaineet',
  de: 'Umsetzungsressourcen und Zeitdruck bei der Implementierung',
  fr: "Contraintes de ressources et pression des délais d'exécution",
  es: 'Restricciones de recursos de implementación y presiones de plazo',
  nl: 'Implementatieresourcebeperkingen en tijdsdruk',
  ar: 'قيود موارد التنفيذ وضغوط الجدول الزمني',
  he: 'מגבלות משאבי יישום ולחצי לוח זמנים',
  ja: '実施リソースの制約とスケジュールのプレッシャー',
  ko: '이행 자원 제약 및 일정 압박',
  zh: '实施资源限制和时间表压力',
};
const GOV_O: LangMap = {
  en: 'EU and Nordic policy framework alignment opportunities',
  sv: 'Möjligheter till EU- och nordisk policyanpassning',
  da: 'Muligheder for EU- og nordisk politikrammetilpasning',
  no: 'Muligheter for EU- og nordisk rammeverksanpasning',
  fi: 'EU- ja pohjoismaisten kehysten yhdenmukaistamismahdollisuudet',
  de: 'Möglichkeiten zur EU- und nordischen Rahmenanpassung',
  fr: "Opportunités d'alignement EU et cadre nordique",
  es: 'Oportunidades de alineación con el marco de la UE y nórdico',
  nl: 'Kansen voor EU- en Noordse beleidsraamwerkafstemming',
  ar: 'فرص مواءمة الإطار السياسي الأوروبي والنوردي',
  he: 'הזדמנויות לתאימות עם מסגרת ה-EU והנורדית',
  ja: 'EU・北欧政策フレームワーク整合の機会',
  ko: 'EU 및 북유럽 정책 프레임워크 정렬 기회',
  zh: '欧盟和北欧政策框架协调机会',
};
const GOV_T: LangMap = {
  en: 'Opposition scrutiny and public implementation resistance',
  sv: 'Oppositionens granskning och offentligt motstånd mot genomförande',
  da: 'Oppositionens granskning og offentlig implementeringsmodstand',
  no: 'Opposisjonens gransking og offentlig implementeringsmotstand',
  fi: 'Opposition valvonta ja julkinen vastustus toteutukselle',
  de: 'Oppositionskontrolle und öffentlicher Widerstand gegen Umsetzung',
  fr: "Contrôle de l'opposition et résistance publique à la mise en œuvre",
  es: 'Escrutinio de la oposición y resistencia pública a la implementación',
  nl: 'Oppositiecontrole en publieke implementatieweerstand',
  ar: 'تدقيق المعارضة والمقاومة العامة للتنفيذ',
  he: 'בדיקת האופוזיציה והתנגדות ציבורית ליישום',
  ja: '野党の監視と実施に対する公的抵抗',
  ko: '야당의 감시 및 공공 이행 저항',
  zh: '反对派审查和公众对实施的抵制',
};

// Opposition fallbacks
const OPP_S: LangMap = {
  en: 'Parliamentary scrutiny and accountability function',
  sv: 'Parlamentarisk granskning och ansvarsfunktion',
  da: 'Parlamentarisk kontrol og ansvarsfunktion',
  no: 'Parlamentarisk kontroll og ansvarsfunksjon',
  fi: 'Parlamentaarinen valvonta ja vastuufunktio',
  de: 'Parlamentarische Kontrolle und Rechenschaftsfunktion',
  fr: 'Contrôle parlementaire et fonction de responsabilité',
  es: 'Escrutinio parlamentario y función de rendición de cuentas',
  nl: 'Parlementaire controle en verantwoordingsfunctie',
  ar: 'الرقابة البرلمانية ووظيفة المساءلة',
  he: 'בקרה פרלמנטרית ותפקיד אחריות',
  ja: '議会の精査と説明責任機能',
  ko: '의회 감시 및 책임 기능',
  zh: '议会监督和问责职能',
};
const OPP_W: LangMap = {
  en: 'Limited access to government implementation data',
  sv: 'Begränsad tillgång till statens genomförandedata',
  da: 'Begrænset adgang til regeringsimplementeringsdata',
  no: 'Begrenset tilgang til regjeringens implementeringsdata',
  fi: 'Rajoitettu pääsy hallituksen toteutustietoihin',
  de: 'Eingeschränkter Zugang zu Regierungsumsetzungsdaten',
  fr: "Accès limité aux données d'exécution gouvernementales",
  es: 'Acceso limitado a datos de implementación gubernamental',
  nl: 'Beperkte toegang tot overheidsimplementatiegegevens',
  ar: 'محدودية الوصول إلى بيانات تنفيذ الحكومة',
  he: 'גישה מוגבלת לנתוני יישום ממשלתיים',
  ja: '政府の実施データへの限定的なアクセス',
  ko: '정부 이행 데이터에 대한 제한적 접근',
  zh: '对政府实施数据的访问有限',
};
const OPP_O: LangMap = {
  en: 'Cross-party consensus building and committee oversight',
  sv: 'Konsensusbyggande över partigränser och utskottsgranskning',
  da: 'Tværpolitisk konsensusopbygning og udvalgsovervågning',
  no: 'Tverrpolitisk konsensusbygging og komitéoversikt',
  fi: 'Puoluerajat ylittävä konsensuksenrakennus ja valiokunnan valvonta',
  de: 'Parteiübergreifender Konsensaufbau und Ausschusskontrolle',
  fr: 'Consensus multipartite et contrôle des commissions',
  es: 'Construcción de consenso multipartidista y supervisión de comisiones',
  nl: 'Partijoverstijgende consensusvorming en commissietoezicht',
  ar: 'بناء توافق بين الأحزاب والرقابة اللجنوية',
  he: 'בניית קונסנזוס בין-מפלגתי ופיקוח ועדתי',
  ja: '超党派合意形成と委員会監視',
  ko: '초당적 합의 형성과 위원회 감독',
  zh: '跨党共识建设和委员会监督',
};
const OPP_T: LangMap = {
  en: 'Government majority constraining amendment capacity',
  sv: 'Regeringsmajoriteten begränsar kapaciteten att lägga ändringsförslag',
  da: 'Regeringsflertallet begrænser ændringskapaciteten',
  no: 'Regjeringsflertallets begrenser endringskapasiteten',
  fi: 'Hallitusenemmistö rajoittaa muutoskapasiteettia',
  de: 'Regierungsmehrheit schränkt Änderungskapazität ein',
  fr: "La majorité gouvernementale limite la capacité d'amendement",
  es: 'La mayoría gubernamental limita la capacidad de enmienda',
  nl: 'Regeringsmeerderheid beperkt amendementcapaciteit',
  ar: 'الأغلبية الحكومية تُقيّد قدرة تعديل التشريعات',
  he: 'הרוב הממשלתי מגביל את יכולת ההגשה של תיקונים',
  ja: '政府多数派が修正能力を制約',
  ko: '정부 다수파가 개정 역량 제한',
  zh: '执政多数党限制修正能力',
};

// Private Sector fallbacks
const PVT_S: LangMap = {
  en: 'Technical expertise and sector operational capacity',
  sv: 'Teknisk expertis och sektorns operativa kapacitet',
  da: 'Teknisk ekspertise og sektoroperationel kapacitet',
  no: 'Teknisk ekspertise og sektoroperasjonell kapasitet',
  fi: 'Tekninen asiantuntemus ja sektorin toimintakapasiteetti',
  de: 'Technisches Fachwissen und operative Kapazität des Sektors',
  fr: 'Expertise technique et capacité opérationnelle du secteur',
  es: 'Experiencia técnica y capacidad operativa del sector',
  nl: 'Technische expertise en sectoroperationele capaciteit',
  ar: 'الخبرة التقنية والطاقة التشغيلية للقطاع',
  he: 'מומחיות טכנית וקיבולת תפעולית של המגזר',
  ja: '技術的専門知識とセクターの運用能力',
  ko: '기술 전문성과 부문 운영 역량',
  zh: '技术专长和行业运营能力',
};
const PVT_W: LangMap = {
  en: 'Compliance costs and regulatory adaptation burden',
  sv: 'Efterlevnadskostnader och regelbörda vid anpassning',
  da: 'Overholdelsesomkostninger og regulatorisk tilpasningsbyrde',
  no: 'Etterlevelseskostnader og regulatorisk tilpasningsbyrde',
  fi: 'Vaatimustenmukaisuuskulut ja sääntelyllinen sopeutusrasite',
  de: 'Compliance-Kosten und regulatorische Anpassungslast',
  fr: "Coûts de conformité et charge d'adaptation réglementaire",
  es: 'Costes de cumplimiento y carga de adaptación regulatoria',
  nl: 'Nalevingskosten en regelgevende aanpassingslast',
  ar: 'تكاليف الامتثال وعبء التكيف التنظيمي',
  he: 'עלויות ציות ועומס הסתגלות רגולטורי',
  ja: 'コンプライアンスコストと規制適応負担',
  ko: '규정 준수 비용 및 규제 적응 부담',
  zh: '合规成本和监管适应负担',
};
const PVT_O: LangMap = {
  en: 'Policy-driven investment and innovation opportunities',
  sv: 'Policydriven investering och innovationsmöjligheter',
  da: 'Politikdrevet investering og innovationsmuligheder',
  no: 'Politikkdrevne investerings- og innovasjonsmuligheter',
  fi: 'Politiikkaohjatut investointi- ja innovointimahdollisuudet',
  de: 'Politikgetriebene Investitions- und Innovationsmöglichkeiten',
  fr: "Opportunités d'investissement et d'innovation pilotées par les politiques",
  es: 'Oportunidades de inversión e innovación impulsadas por políticas',
  nl: 'Beleidsgedreven investerings- en innovatiemogelijkheden',
  ar: 'فرص الاستثمار والابتكار القائمة على السياسات',
  he: 'הזדמנויות השקעה וחדשנות מונעות מדיניות',
  ja: '政策主導の投資とイノベーションの機会',
  ko: '정책 주도 투자 및 혁신 기회',
  zh: '政策驱动的投资和创新机会',
};
const PVT_T: LangMap = {
  en: 'Regulatory uncertainty and short implementation timelines',
  sv: 'Regulatorisk osäkerhet och korta genomförandetidsplaner',
  da: 'Regulatorisk usikkerhed og korte implementeringstidslinjer',
  no: 'Regulatorisk usikkerhet og korte implementeringstidslinjer',
  fi: 'Sääntelyepävarmuus ja lyhyet toteutusaikataulut',
  de: 'Regulatorische Unsicherheit und kurze Umsetzungsfristen',
  fr: "Incertitude réglementaire et délais d'exécution courts",
  es: 'Incertidumbre regulatoria y plazos cortos de implementación',
  nl: 'Regelgevende onzekerheid en korte implementatietijdlijnen',
  ar: 'الغموض التنظيمي وقصر جداول التنفيذ',
  he: 'אי-וודאות רגולטורית ולוחות זמנים קצרים ליישום',
  ja: '規制の不確実性と短い実施期間',
  ko: '규제 불확실성과 짧은 이행 일정',
  zh: '监管不确定性和较短的实施时间表',
};

// Civil Society fallbacks
const CIV_S: LangMap = {
  en: 'Grassroots representation and public interest advocacy',
  sv: 'Gräsrotsrepresentation och folklig intressebevakning',
  da: 'Græsrodsrepræsentation og offentlig interessefortalervirksomhed',
  no: 'Grasrotrepresentasjon og offentlig interesseforkjemping',
  fi: 'Ruohonjuuritason edustus ja yleinen edunvalvonta',
  de: 'Basisrepräsentation und Interessenvertretung für das Gemeinwohl',
  fr: "Représentation populaire et plaidoyer dans l'intérêt public",
  es: 'Representación popular y defensa del interés público',
  nl: 'Basisvertegenwoordiging en publiek belangen-advocacy',
  ar: 'التمثيل الشعبي والمناصرة للصالح العام',
  he: 'ייצוג עממי ודיגול האינטרס הציבורי',
  ja: '草の根代表と公益のアドボカシー',
  ko: '풀뿌리 대표와 공익 옹호',
  zh: '基层代表和公共利益倡导',
};
const CIV_W: LangMap = {
  en: 'Limited formal representation in the policy process',
  sv: 'Begränsad formell representation i beslutsprocessen',
  da: 'Begrænset formel repræsentation i politikprocessen',
  no: 'Begrenset formell representasjon i politikkprosessen',
  fi: 'Rajoitettu muodollinen edustus poliittisessa prosessissa',
  de: 'Eingeschränkte formelle Vertretung im Politikprozess',
  fr: 'Représentation formelle limitée dans le processus politique',
  es: 'Representación formal limitada en el proceso político',
  nl: 'Beperkte formele vertegenwoordiging in het beleidsproces',
  ar: 'تمثيل رسمي محدود في العملية السياسية',
  he: 'ייצוג רשמי מוגבל בתהליך המדיניות',
  ja: '政策プロセスにおける公式参加の制限',
  ko: '정책 과정에서의 제한적 공식 대표',
  zh: '在政策过程中正式代表权有限',
};
const CIV_O: LangMap = {
  en: 'Public consultation processes and transparency requirements',
  sv: 'Remissprocesser och transparenskrav',
  da: 'Offentlige høringsprocesser og transparenskrav',
  no: 'Offentlige høringsprosesser og transparenskrav',
  fi: 'Julkiset kuulemisprosessit ja avoimuusvaatimukset',
  de: 'Öffentliche Konsultationsprozesse und Transparenzanforderungen',
  fr: 'Processus de consultation publique et exigences de transparence',
  es: 'Procesos de consulta pública y requisitos de transparencia',
  nl: 'Openbare consultatieprocessen en transparantievereisten',
  ar: 'عمليات الاستشارة العامة ومتطلبات الشفافية',
  he: 'תהליכי ייעוץ ציבורי ודרישות שקיפות',
  ja: '公開協議プロセスと透明性要件',
  ko: '공공 협의 프로세스 및 투명성 요건',
  zh: '公众咨询流程和透明度要求',
};
const CIV_T: LangMap = {
  en: 'Rapid legislative change without adequate civil society consultation',
  sv: 'Snabb lagstiftningsprocess utan tillräcklig remissrunda',
  da: 'Hurtige lovændringer uden tilstrækkelig civilsamfundshøring',
  no: 'Rask lovgivningsendring uten tilstrekkelig sivilsamfunnskonsultasjon',
  fi: 'Nopeat lainsäädäntömuutokset ilman riittävää kansalaisyhteiskunnan kuulemista',
  de: 'Rasche Gesetzesänderungen ohne ausreichende Konsultation der Zivilgesellschaft',
  fr: 'Changements législatifs rapides sans consultation adéquate de la société civile',
  es: 'Cambios legislativos rápidos sin consulta adecuada de la sociedad civil',
  nl: 'Snelle wetgevingswijzigingen zonder voldoende maatschappelijk overleg',
  ar: 'تغييرات تشريعية سريعة دون مشاورة كافية مع المجتمع المدني',
  he: 'שינויים חקיקתיים מהירים ללא התייעצות מספקת עם החברה האזרחית',
  ja: '市民社会への十分な協議なしの急速な立法変更',
  ko: '시민 사회와의 충분한 협의 없는 신속한 입법 변화',
  zh: '没有充分征询市民社会意见的快速立法变化',
};

// Municipalities & Regions fallbacks
const MUN_S: LangMap = {
  en: 'Local implementation capacity and proximity to citizens',
  sv: 'Lokal genomförandekapacitet och nära medborgarkontakt',
  da: 'Lokal implementeringskapacitet og nærhed til borgere',
  no: 'Lokal implementeringskapasitet og nærhet til innbyggerne',
  fi: 'Paikallinen toteutuskapasiteetti ja läheisyys kansalaisiin',
  de: 'Lokale Umsetzungskapazität und Bürgernähe',
  fr: 'Capacité de mise en œuvre locale et proximité citoyenne',
  es: 'Capacidad de implementación local y proximidad a los ciudadanos',
  nl: 'Lokale implementatiecapaciteit en nabijheid tot burgers',
  ar: 'القدرة التنفيذية المحلية وقرب المواطنين',
  he: 'יכולת יישום מקומית וקרבה לאזרחים',
  ja: '地方実施能力と市民への近接性',
  ko: '지방 이행 역량과 시민과의 근접성',
  zh: '地方实施能力和与公民的接近性',
};
const MUN_W: LangMap = {
  en: 'Resource constraints and unfunded central government mandates',
  sv: 'Resursbrist och statliga uppdrag utan tillräcklig finansiering',
  da: 'Ressourcebegrænsninger og ufinansierede statslige mandater',
  no: 'Ressursbegrensninger og ufinansierte statlige mandater',
  fi: 'Resurssirajoitteet ja rahoittamattomat valtion toimeksiannot',
  de: 'Ressourcenengpässe und unfinanzierte Zentralregierungsmandate',
  fr: 'Contraintes de ressources et mandats gouvernementaux non financés',
  es: 'Limitaciones de recursos y mandatos gubernamentales centrales no financiados',
  nl: 'Resourcebeperkingen en onvergoed overheidsbeleid',
  ar: 'قيود الموارد وتفويضات حكومية مركزية غير ممولة',
  he: 'מגבלות משאבים ומנדטים ממשלתיים מרכזיים ללא מימון',
  ja: 'リソース制約と資金未提供の中央政府指令',
  ko: '자원 제약 및 자금 지원 없는 중앙정부 위임',
  zh: '资源限制和无资金的中央政府授权',
};
const MUN_O: LangMap = {
  en: 'Local policy innovation and adaptation latitude',
  sv: 'Lokalt policyinnovationsutrymme och anpassningsmöjligheter',
  da: 'Lokal politikinnovation og tilpasningsmuligheder',
  no: 'Lokal politikkinnovasjon og tilpasningsmuligheter',
  fi: 'Paikallinen poliittinen innovaatio ja sopeutumismahdollisuudet',
  de: 'Lokale Politikinnovation und Anpassungsspielraum',
  fr: "Innovation politique locale et marge d'adaptation",
  es: 'Innovación política local y margen de adaptación',
  nl: 'Lokale beleidsinnovatie en aanpassingsruimte',
  ar: 'الابتكار السياسي المحلي وهامش التكيف',
  he: 'חדשנות מדיניות מקומית ומרחב הסתגלות',
  ja: '地方政策の革新と適応の余地',
  ko: '지방 정책 혁신 및 적응 여지',
  zh: '地方政策创新和适应空间',
};
const MUN_T: LangMap = {
  en: 'Central government cost-shifting and unfunded implementation obligations',
  sv: 'Statens kostnadsövervältring och ogenomförbara finansieringskrav',
  da: 'Central statslig omkostningsovervæltning og ufinansierede implementeringsforpligtelser',
  no: 'Statlig kostnadsoverveltning og ufinansierte implementeringsforpliktelser',
  fi: 'Valtion kustannusten siirtäminen ja rahoittamattomat täytäntöönpanovelvoitteet',
  de: 'Kostenabwälzung der Zentralregierung und unfinanzierte Umsetzungsverpflichtungen',
  fr: 'Transfert de coûts du gouvernement central et obligations de mise en œuvre non financées',
  es: 'Traslado de costes del gobierno central y obligaciones de implementación no financiadas',
  nl: 'Kostenafwenteling centrale overheid en onvergoed implementatieverplichtingen',
  ar: 'تحويل التكاليف الحكومي المركزي والتزامات التنفيذ غير الممولة',
  he: 'העברת עלויות של ממשלת המרכז וחובות יישום ללא מימון',
  ja: '中央政府のコスト移転と資金未提供の実施義務',
  ko: '중앙정부 비용 전가 및 자금 지원 없는 이행 의무',
  zh: '中央政府成本转移和无资金实施义务',
};

// International / EU fallbacks
const INT_S: LangMap = {
  en: 'EU regulatory framework and international cooperation structures',
  sv: 'EU:s regelverk och internationella samarbetsstrukturer',
  da: 'EU-reguleringsramme og internationale samarbejdsstrukturer',
  no: 'EU-rammeverk og internasjonale samarbeidsstrukturer',
  fi: 'EU:n sääntelykehys ja kansainväliset yhteistyörakenteet',
  de: 'EU-Regulierungsrahmen und internationale Kooperationsstrukturen',
  fr: "Cadre réglementaire de l'UE et structures de coopération internationale",
  es: 'Marco regulatorio de la UE y estructuras de cooperación internacional',
  nl: 'EU-regelgevingskader en internationale samenwerkingsstructuren',
  ar: 'الإطار التنظيمي الأوروبي وهياكل التعاون الدولي',
  he: 'מסגרת רגולטורית אירופית ומבני שיתוף פעולה בינלאומי',
  ja: 'EU規制枠組みと国際協力構造',
  ko: 'EU 규제 프레임워크와 국제 협력 구조',
  zh: '欧盟监管框架和国际合作结构',
};
const INT_W: LangMap = {
  en: 'National sovereignty constraints and EU compliance burden',
  sv: 'Nationell suveränitetsbegränsning och EU-efterlevnadsbörda',
  da: 'Nationale suverænitetsbegrænsninger og EU-efterlevningsbyrde',
  no: 'Nasjonale suverenitetsbegrensninger og EU-etterlevningsbyrde',
  fi: 'Kansallisen suvereenisuuden rajoitteet ja EU:n noudattamisrasite',
  de: 'Nationale Souveränitätsbeschränkungen und EU-Compliance-Last',
  fr: "Contraintes de souveraineté nationale et charge de conformité à l'UE",
  es: 'Restricciones de soberanía nacional y carga de cumplimiento de la UE',
  nl: 'Nationale soevereiniteitsbelemmeringen en EU-nalevingslast',
  ar: 'قيود السيادة الوطنية وعبء الامتثال للاتحاد الأوروبي',
  he: 'מגבלות ריבונות לאומית ועומס ציות לה-EU',
  ja: '国家主権の制約とEUコンプライアンス負担',
  ko: '국가 주권 제약 및 EU 규정 준수 부담',
  zh: '国家主权限制和欧盟合规负担',
};
const INT_O: LangMap = {
  en: 'EU funding opportunities and international technical assistance',
  sv: 'EU-finansieringsmöjligheter och internationellt tekniskt stöd',
  da: 'EU-finansieringsmuligheder og international teknisk bistand',
  no: 'EU-finansieringsmuligheter og internasjonal teknisk bistand',
  fi: 'EU-rahoitusmahdollisuudet ja kansainvälinen tekninen apu',
  de: 'EU-Fördermöglichkeiten und internationale technische Hilfe',
  fr: "Opportunités de financement de l'UE et assistance technique internationale",
  es: 'Oportunidades de financiación de la UE y asistencia técnica internacional',
  nl: 'EU-financieringsmogelijkheden en internationale technische bijstand',
  ar: 'فرص تمويل الاتحاد الأوروبي والمساعدة التقنية الدولية',
  he: 'הזדמנויות מימון ה-EU וסיוע טכני בינלאומי',
  ja: 'EU資金調達の機会と国際技術支援',
  ko: 'EU 자금 지원 기회와 국제 기술 지원',
  zh: '欧盟资金机会和国际技术援助',
};
const INT_T: LangMap = {
  en: 'Policy divergence from EU obligations and compliance risk',
  sv: 'Policyavvikelse från EU-skyldigheter och efterlevnadsrisk',
  da: 'Politisk afvigelse fra EU-forpligtelser og efterlevelsesrisiko',
  no: 'Politisk avvik fra EU-forpliktelser og etterlevelsesrisiko',
  fi: 'Poliittinen poikkeama EU-velvoitteista ja noudattamisriski',
  de: 'Politische Abweichung von EU-Verpflichtungen und Compliance-Risiko',
  fr: "Divergence politique par rapport aux obligations de l'UE et risque de conformité",
  es: 'Divergencia política de las obligaciones de la UE y riesgo de incumplimiento',
  nl: 'Beleidsdivergentie van EU-verplichtingen en nalevingsrisico',
  ar: 'تباين السياسات عن التزامات الاتحاد الأوروبي ومخاطر الامتثال',
  he: 'סטייה מדינית מחובות ה-EU וסיכון ציות',
  ja: 'EU義務からの政策乖離とコンプライアンスリスク',
  ko: 'EU 의무로부터의 정책 일탈과 규정 준수 위험',
  zh: '政策偏离欧盟义务和合规风险',
};

// Media & Transparency fallbacks
const MED_S: LangMap = {
  en: 'Free press scrutiny and democratic accountability function',
  sv: 'Fri pressgranskning och demokratisk ansvarsfunktion',
  da: 'Fri presse og demokratisk ansvarlighedsfunktion',
  no: 'Fri presse og demokratisk ansvarsfunksjon',
  fi: 'Vapaan lehdistön valvonta ja demokraattinen vastuufunktio',
  de: 'Pressefreiheit und demokratische Rechenschaftsfunktion',
  fr: 'Contrôle de la presse libre et fonction de responsabilité démocratique',
  es: 'Escrutinio de la prensa libre y función de responsabilidad democrática',
  nl: 'Vrije persmedia-controle en democratische verantwoordingsfunctie',
  ar: 'رقابة الصحافة الحرة ووظيفة المساءلة الديمقراطية',
  he: 'ביקורת עיתונות חופשית ותפקיד אחריות דמוקרטי',
  ja: '自由報道の監視と民主的説明責任機能',
  ko: '자유 언론 감시 및 민주적 책임 기능',
  zh: '自由媒体监督和民主问责职能',
};
const MED_W: LangMap = {
  en: 'Access restrictions and information asymmetry with government',
  sv: 'Begränsad tillgång och informationsasymmetri gentemot regeringen',
  da: 'Adgangsbegrænsninger og informationsasymmetri med regeringen',
  no: 'Tilgangsbegrensninger og informasjonsasymmetri med regjeringen',
  fi: 'Pääsyn rajoitukset ja informaatioepäsymmetria hallituksen kanssa',
  de: 'Zugangsbeschränkungen und Informationsasymmetrie mit der Regierung',
  fr: "Restrictions d'accès et asymétrie d'information avec le gouvernement",
  es: 'Restricciones de acceso y asimetría de información con el gobierno',
  nl: 'Toegangsbeperkingen en informatieasymmetrie met de overheid',
  ar: 'قيود الوصول وعدم تماثل المعلومات مع الحكومة',
  he: 'הגבלות גישה ואי-סמטריה מידע מול הממשלה',
  ja: 'アクセス制限と政府との情報非対称性',
  ko: '접근 제한 및 정부와의 정보 비대칭',
  zh: '访问限制和与政府的信息不对称',
};
const MED_O: LangMap = {
  en: 'Transparency requirements and open government data access',
  sv: 'Transparenskrav och tillgång till öppna myndighetsdata',
  da: 'Transparenskrav og adgang til åbne offentlige data',
  no: 'Transparenskrav og tilgang til åpne offentlige data',
  fi: 'Avoimuusvaatimukset ja julkinen data-pääsy',
  de: 'Transparenzanforderungen und offene Behördendaten',
  fr: "Exigences de transparence et accès aux données gouvernementales ouvertes",
  es: 'Requisitos de transparencia y acceso a datos gubernamentales abiertos',
  nl: 'Transparantievereisten en open overheidsdata-toegang',
  ar: 'متطلبات الشفافية والوصول إلى بيانات حكومية مفتوحة',
  he: 'דרישות שקיפות וגישה לנתוני ממשל פתוחים',
  ja: '透明性要件とオープン政府データアクセス',
  ko: '투명성 요건 및 공개 정부 데이터 접근',
  zh: '透明度要求和开放政府数据访问',
};
const MED_T: LangMap = {
  en: 'Government information control and reduced media transparency',
  sv: 'Statlig informationskontroll och reducerad mediagranskning',
  da: 'Statslig informationskontrol og reduceret medietransparens',
  no: 'Statlig informasjonskontroll og redusert medietransparens',
  fi: 'Hallituksen tiedonhallinta ja media-avoimuuden heikentyminen',
  de: 'Staatliche Informationskontrolle und verminderte Medientransparenz',
  fr: "Contrôle de l'information gouvernementale et transparence médiatique réduite",
  es: 'Control de información gubernamental y reducida transparencia mediática',
  nl: 'Overheidsinformatiecontrole en verminderde mediatransparantie',
  ar: 'الرقابة الحكومية على المعلومات وتراجع الشفافية الإعلامية',
  he: 'שליטה ממשלתית במידע והפחתת שקיפות תקשורתית',
  ja: '政府の情報管理とメディア透明性の低下',
  ko: '정부 정보 통제 및 미디어 투명성 감소',
  zh: '政府信息管控和媒体透明度降低',
};

// Academia & Research fallbacks
const ACA_S: LangMap = {
  en: 'Independent evidence-based analysis and research expertise',
  sv: 'Oberoende evidensbaserad analys och forskningskompetens',
  da: 'Uafhængig evidensbaseret analyse og forskningsekspertise',
  no: 'Uavhengig evidensbasert analyse og forskningsekspertise',
  fi: 'Riippumaton näyttöön perustuva analyysi ja tutkimusasiantuntemus',
  de: 'Unabhängige evidenzbasierte Analyse und Forschungsexpertise',
  fr: "Analyse indépendante fondée sur des preuves et expertise en recherche",
  es: 'Análisis independiente basado en evidencia y experiencia investigadora',
  nl: 'Onafhankelijke evidence-based analyse en onderzoeksexpertise',
  ar: 'تحليل مستقل قائم على الأدلة وخبرة بحثية',
  he: 'ניתוח עצמאי מבוסס-ראיות ומומחיות מחקרית',
  ja: '独立した証拠に基づく分析と研究の専門知識',
  ko: '독립적 증거 기반 분석 및 연구 전문성',
  zh: '独立的循证分析和研究专长',
};
const ACA_W: LangMap = {
  en: 'Limited formal policy channel for research input',
  sv: 'Begränsad formell kanal för forskningsinput till policyarbetet',
  da: 'Begrænset formel politikkanal for forskningsbidrag',
  no: 'Begrenset formell politikkkanal for forskningsbidrag',
  fi: 'Rajoitettu muodollinen politiikkakanava tutkimuspanoselle',
  de: 'Eingeschränkter formeller Politikkanal für Forschungsbeiträge',
  fr: 'Canal politique formel limité pour les contributions à la recherche',
  es: 'Canal político formal limitado para la aportación de investigación',
  nl: 'Beperkt formeel beleidskanaal voor onderzoeksinput',
  ar: 'قناة سياسة رسمية محدودة للمساهمة البحثية',
  he: 'ערוץ מדיניות רשמי מוגבל לתרומת מחקר',
  ja: '研究インプットのための公式政策チャネルが限られている',
  ko: '연구 투입을 위한 제한적 공식 정책 채널',
  zh: '研究投入的正式政策渠道有限',
};
const ACA_O: LangMap = {
  en: 'Research funding opportunities and evidence-policy partnerships',
  sv: 'Forskningsfinansieringsmöjligheter och evidens-policypartnerskap',
  da: 'Forskningsfinansieringsmuligheder og evidens-politikpartnerskaber',
  no: 'Forskningsfinansieringsmuligheter og evidens-politikkpartnerskap',
  fi: 'Tutkimuksen rahoitusmahdollisuudet ja näyttö-politiikkayhteistyö',
  de: 'Forschungsfinanzierungsmöglichkeiten und Evidenz-Politik-Partnerschaften',
  fr: "Opportunités de financement de la recherche et partenariats evidence-politique",
  es: 'Oportunidades de financiación de investigación y asociaciones evidencia-política',
  nl: 'Onderzoeksfinancieringsmogelijkheden en evidentie-beleidspartnerschappen',
  ar: 'فرص تمويل البحوث وشراكات الأدلة-السياسة',
  he: 'הזדמנויות מימון מחקר ושותפויות ראיות-מדיניות',
  ja: '研究資金調達の機会と証拠政策パートナーシップ',
  ko: '연구 자금 기회와 근거 정책 파트너십',
  zh: '研究资金机会和证据政策合作',
};
const ACA_T: LangMap = {
  en: 'Political constraints on independent research and funding dependency',
  sv: 'Politiska begränsningar på oberoende forskning och finansieringsberoende',
  da: 'Politiske begrænsninger for uafhængig forskning og finansieringsafhængighed',
  no: 'Politiske begrensninger på uavhengig forskning og finansieringsavhengighet',
  fi: 'Poliittiset rajoitteet riippumattomalle tutkimukselle ja rahoitusriippuvuus',
  de: 'Politische Beschränkungen unabhängiger Forschung und Finanzierungsabhängigkeit',
  fr: 'Contraintes politiques sur la recherche indépendante et dépendance aux financements',
  es: 'Restricciones políticas a la investigación independiente y dependencia de financiación',
  nl: 'Politieke beperkingen op onafhankelijk onderzoek en financieringsafhankelijkheid',
  ar: 'القيود السياسية على البحوث المستقلة واعتماد التمويل',
  he: 'מגבלות פוליטיות על מחקר עצמאי ותלות מימון',
  ja: '独立研究に対する政治的制約と資金依存',
  ko: '독립적 연구에 대한 정치적 제약 및 자금 의존',
  zh: '对独立研究的政治限制和资金依赖',
};

// Trade Unions & Workers fallbacks
const LAB_S: LangMap = {
  en: 'Collective bargaining capacity and worker representation',
  sv: 'Kollektivt förhandlingsmandat och arbetstagarrepresentation',
  da: 'Kollektiv forhandlingskapacitet og arbejdstagerrepræsentation',
  no: 'Kollektiv forhandlingskapasitet og arbeidstakerrepresentasjon',
  fi: 'Kollektiivinen neuvottelukapasiteetti ja työntekijöiden edustus',
  de: 'Tarifverhandlungskapazität und Arbeitnehmervertretung',
  fr: 'Capacité de négociation collective et représentation des travailleurs',
  es: 'Capacidad de negociación colectiva y representación de trabajadores',
  nl: 'Collectieve onderhandelingscapaciteit en werknemersvertegenwoordiging',
  ar: 'قدرة المفاوضة الجماعية وتمثيل العمال',
  he: 'כושר מיקוח קולקטיבי וייצוג עובדים',
  ja: '団体交渉能力と労働者代表',
  ko: '단체교섭 역량과 근로자 대표',
  zh: '集体谈判能力和工人代表',
};
const LAB_W: LangMap = {
  en: 'Declining union density and fragmented worker representation',
  sv: 'Sjunkande facklig organisationsgrad och splittrad arbetstagar-representation',
  da: 'Faldende fagforeningsdensitet og fragmenteret arbejdstagerrepræsentation',
  no: 'Synkende fagforeningsandel og fragmentert arbeidstakerrepresentasjon',
  fi: 'Laskeva ammattiliiton jäsenyystiheys ja pirstoutunut työntekijöiden edustus',
  de: 'Rückläufige Gewerkschaftsdichte und fragmentierte Arbeitnehmervertretung',
  fr: 'Densité syndicale en baisse et représentation fragmentée des travailleurs',
  es: 'Densidad sindical decreciente y representación fragmentada de trabajadores',
  nl: 'Dalende vakbondsdichtheid en gefragmenteerde werknemersvertegenwoordiging',
  ar: 'تراجع كثافة النقابات وتشتت تمثيل العمال',
  he: 'ירידה בצפיפות האיגודים המקצועיים ופיצול ייצוג העובדים',
  ja: '組合組織率の低下と断片化した労働者代表',
  ko: '노조 가입률 감소 및 파편화된 근로자 대표',
  zh: '工会密度下降和工人代表碎片化',
};
const LAB_O: LangMap = {
  en: 'Labour market reform and improved worker protection standards',
  sv: 'Arbetsmarknadsreformer och förbättrade anställningsskyddsnormer',
  da: 'Arbejdsmarkedsreformer og forbedrede arbejdstagerretsbeskyttelsesstandarder',
  no: 'Arbeidsmarkedsreformer og forbedrede arbeidstakerbeskyttelsesstandarder',
  fi: 'Työmarkkina-uudistukset ja parannetut työntekijöiden suojelunormit',
  de: 'Arbeitsmarktreformen und verbesserte Arbeitnehmerschutzstandards',
  fr: 'Réformes du marché du travail et amélioration des normes de protection des travailleurs',
  es: 'Reformas del mercado laboral y mejores estándares de protección de trabajadores',
  nl: 'Arbeidsmarkthervorming en verbeterde arbeidsbeschermingsnormen',
  ar: 'إصلاحات سوق العمل وتحسين معايير حماية العمال',
  he: 'רפורמות בשוק העבודה ושיפור תקני הגנת העובדים',
  ja: '労働市場改革と改善された労働者保護基準',
  ko: '노동시장 개혁 및 개선된 노동자 보호 기준',
  zh: '劳动市场改革和改进的劳动保护标准',
};
const LAB_T: LangMap = {
  en: 'Market deregulation risks and wage suppression pressures',
  sv: 'Marknadsavregleringsrisker och lönepress',
  da: 'Markedsdereguleringrisici og lønpresrisici',
  no: 'Markedsdereguleringrisiko og lønnspresrisiko',
  fi: 'Markkinoiden sääntelyn purkamisen riskit ja palkkakuristuspaineet',
  de: 'Marktderegulierungsrisiken und Lohndruckrisiken',
  fr: 'Risques de dérèglementation du marché et pressions sur les salaires',
  es: 'Riesgos de desregulación del mercado y presiones de supresión salarial',
  nl: 'Marktdereguleringrisico\'s en loondrukpressies',
  ar: 'مخاطر إلغاء تنظيم السوق وضغوط كبح الأجور',
  he: 'סיכוני ביטול רגולציה שוק ולחצי דיכוי שכר',
  ja: '市場規制緩和リスクと賃金抑制圧力',
  ko: '시장 규제 완화 위험 및 임금 억제 압력',
  zh: '市场监管放松风险和工资抑制压力',
};

// ---------------------------------------------------------------------------
// Stakeholder localised names (all 14 languages)
// ---------------------------------------------------------------------------

type StakeholderNames = Readonly<Partial<Record<Language, string>>>;

export const STAKEHOLDER_NAMES: Readonly<Record<StakeholderCategory, StakeholderNames>> = {
  government: {
    en: 'Government Coalition', sv: 'Regeringskoalitionen',
    da: 'Regeringskoalitionen', no: 'Regjeringskoalisjonen',
    fi: 'Hallituskoalitio', de: 'Regierungskoalition',
    fr: 'Coalition gouvernementale', es: 'Coalición gubernamental',
    nl: 'Regeringscoalitie', ar: 'الائتلاف الحكومي',
    he: 'קואליציית הממשלה', ja: '与党連立', ko: '정부 연립', zh: '执政联盟',
  },
  opposition: {
    en: 'Opposition Parties', sv: 'Oppositionspartierna',
    da: 'Oppositionspartierne', no: 'Opposisjonspartiene',
    fi: 'Oppositiopuolueet', de: 'Oppositionsparteien',
    fr: "Partis d'opposition", es: 'Partidos de oposición',
    nl: 'Oppositiepartijen', ar: 'أحزاب المعارضة',
    he: 'מפלגות האופוזיציה', ja: '野党', ko: '야당', zh: '反对党',
  },
  private: {
    en: 'Private Sector / Industry', sv: 'Näringsliv / Industri',
    da: 'Privat sektor / Industri', no: 'Privat sektor / Industri',
    fi: 'Yksityinen sektori / Teollisuus', de: 'Privatwirtschaft / Industrie',
    fr: 'Secteur privé / Industrie', es: 'Sector privado / Industria',
    nl: 'Private sector / Industrie', ar: 'القطاع الخاص / الصناعة',
    he: 'המגזר הפרטי / תעשייה', ja: '民間セクター / 産業界', ko: '민간 부문 / 산업계', zh: '私营部门 / 产业界',
  },
  'civil-society': {
    en: 'Civil Society / Citizens', sv: 'Civilsamhälle / Medborgare',
    da: 'Civilsamfund / Borgere', no: 'Sivilsamfunn / Borgere',
    fi: 'Kansalaisyhteiskunta / Kansalaiset', de: 'Zivilgesellschaft / Bürger',
    fr: 'Société civile / Citoyens', es: 'Sociedad civil / Ciudadanos',
    nl: 'Maatschappelijk middenveld / Burgers', ar: 'المجتمع المدني / المواطنون',
    he: 'החברה האזרחית / האזרחים', ja: '市民社会 / 市民', ko: '시민 사회 / 시민', zh: '公民社会 / 市民',
  },
  municipal: {
    en: 'Municipalities & Regions', sv: 'Kommuner och regioner',
    da: 'Kommuner og regioner', no: 'Kommuner og regioner',
    fi: 'Kunnat ja alueet', de: 'Kommunen und Regionen',
    fr: 'Communes et régions', es: 'Municipios y regiones',
    nl: 'Gemeenten en regio\'s', ar: 'البلديات والمناطق',
    he: 'עיריות ומחוזות', ja: '市区町村・地域', ko: '지방자치단체 및 지역', zh: '市政和地区',
  },
  international: {
    en: 'International / EU Bodies', sv: 'Internationella organ / EU',
    da: 'Internationale organer / EU', no: 'Internasjonale organer / EU',
    fi: 'Kansainväliset elimet / EU', de: 'Internationale Institutionen / EU',
    fr: 'Institutions internationales / UE', es: 'Organismos internacionales / UE',
    nl: 'Internationale instanties / EU', ar: 'الهيئات الدولية / الاتحاد الأوروبي',
    he: 'גופים בינלאומיים / האיחוד האירופי', ja: '国際機関 / EU', ko: '국제 기관 / EU', zh: '国际机构 / 欧盟',
  },
  media: {
    en: 'Media & Transparency', sv: 'Media och transparens',
    da: 'Medier og transparens', no: 'Medier og transparens',
    fi: 'Media ja avoimuus', de: 'Medien und Transparenz',
    fr: 'Médias et transparence', es: 'Medios de comunicación y transparencia',
    nl: 'Media en transparantie', ar: 'الإعلام والشفافية',
    he: 'תקשורת ושקיפות', ja: 'メディアと透明性', ko: '언론과 투명성', zh: '媒体与透明度',
  },
  academia: {
    en: 'Academia & Research', sv: 'Akademi och forskning',
    da: 'Akademi og forskning', no: 'Akademia og forskning',
    fi: 'Akateeminen maailma ja tutkimus', de: 'Wissenschaft und Forschung',
    fr: 'Milieu universitaire et recherche', es: 'Academia e investigación',
    nl: 'Academische wereld en onderzoek', ar: 'الأكاديمية والبحوث',
    he: 'אקדמיה ומחקר', ja: '学術界・研究機関', ko: '학계 및 연구', zh: '学界与研究',
  },
  labor: {
    en: 'Trade Unions & Workers', sv: 'Fackföreningar och arbetstagare',
    da: 'Fagforeninger og arbejdstagere', no: 'Fagforeninger og arbeidstakere',
    fi: 'Ammattiliitot ja työntekijät', de: 'Gewerkschaften und Arbeitnehmer',
    fr: 'Syndicats et travailleurs', es: 'Sindicatos y trabajadores',
    nl: 'Vakbonden en werknemers', ar: 'النقابات والعمال',
    he: 'האיגודים המקצועיים והעובדים', ja: '労働組合・労働者', ko: '노동조합 및 근로자', zh: '工会与劳动者',
  },
};

// Stakeholder roles — localised for all 14 languages
const STAKEHOLDER_ROLES: Readonly<Record<StakeholderCategory, Partial<Record<Language, string>>>> = {
  government: {
    en: 'Tidö Agreement: M, KD, L + SD support',
    sv: 'Tidöavtalet: M, KD, L + SD-stöd',
    da: 'Tidö-aftalen: M, KD, L + SD-støtte',
    no: 'Tidö-avtalen: M, KD, L + SD-støtte',
    fi: 'Tidö-sopimus: M, KD, L + SD-tuki',
    de: 'Tidö-Abkommen: M, KD, L + SD-Unterstützung',
    fr: 'Accord de Tidö : M, KD, L + soutien SD',
    es: 'Acuerdo de Tidö: M, KD, L + apoyo SD',
    nl: 'Tidö-akkoord: M, KD, L + SD-steun',
    ar: 'اتفاقية تيدو: M, KD, L + دعم SD',
    he: 'הסכם טידו: M, KD, L + תמיכת SD',
    ja: 'ティドー協定：M, KD, L + SD支持',
    ko: '티되 협약: M, KD, L + SD 지지',
    zh: '蒂德协议：M, KD, L + SD支持',
  },
  opposition: {
    en: 'S, V, C, MP — parliamentary accountability',
    sv: 'S, V, C, MP — parlamentarisk ansvarsutkrävande',
    da: 'S, V, C, MP — parlamentarisk ansvarlighed',
    no: 'S, V, C, MP — parlamentarisk ansvarliggjøring',
    fi: 'S, V, C, MP — parlamentaarinen vastuuvelvollisuus',
    de: 'S, V, C, MP — parlamentarische Verantwortlichkeit',
    fr: 'S, V, C, MP — responsabilité parlementaire',
    es: 'S, V, C, MP — responsabilidad parlamentaria',
    nl: 'S, V, C, MP — parlementaire verantwoording',
    ar: 'S, V, C, MP — المساءلة البرلمانية',
    he: 'S, V, C, MP — אחריות פרלמנטרית',
    ja: 'S, V, C, MP — 議会の説明責任',
    ko: 'S, V, C, MP — 의회 책임',
    zh: 'S, V, C, MP — 议会问责',
  },
  private: {
    en: 'Industry, employers\' federations, SMEs',
    sv: 'Industri, arbetsgivarorganisationer, SME',
    da: 'Industri, arbejdsgiverforeninger, SMV',
    no: 'Industri, arbeidsgiverforeninger, SMB',
    fi: 'Teollisuus, työnantajaliitot, pk-yritykset',
    de: 'Industrie, Arbeitgeberverbände, KMU',
    fr: 'Industrie, fédérations patronales, PME',
    es: 'Industria, federaciones patronales, PYME',
    nl: 'Industrie, werkgeversorganisaties, MKB',
    ar: 'الصناعة، اتحادات أصحاب العمل، الشركات الصغيرة',
    he: 'תעשייה, התאחדויות מעסיקים, עסקים קטנים',
    ja: '産業界、使用者団体、中小企業',
    ko: '산업, 고용주 연합, 중소기업',
    zh: '产业界、雇主联合会、中小企业',
  },
  'civil-society': {
    en: 'NGOs, civil rights organisations, public interest',
    sv: 'Civilsamhällsorganisationer, medborgerliga rättigheter, allmänintresse',
    da: 'NGO\'er, borgerrettighedsorganisationer, offentlig interesse',
    no: 'NGO-er, borgerrettighetsorganisasjoner, offentlig interesse',
    fi: 'Kansalaisjärjestöt, kansalaisoikeusjärjestöt, yleinen etu',
    de: 'NGOs, Bürgerrechtsorganisationen, Gemeinwohl',
    fr: 'ONG, organisations de droits civiques, intérêt public',
    es: 'ONG, organizaciones de derechos civiles, interés público',
    nl: 'NGO\'s, burgerrechtenorganisaties, publiek belang',
    ar: 'المنظمات غير الحكومية، منظمات الحقوق المدنية، المصلحة العامة',
    he: 'ארגונים לא-ממשלתיים, ארגוני זכויות אזרח, אינטרס ציבורי',
    ja: 'NGO、公民権団体、公益',
    ko: 'NGO, 시민권 단체, 공익',
    zh: '非政府组织、公民权利组织、公共利益',
  },
  municipal: {
    en: 'SKR, local government, county councils',
    sv: 'SKR, kommuner, regioner',
    da: 'KL, kommuner, regioner',
    no: 'KS, kommuner, fylkeskommuner',
    fi: 'Kuntaliitto, kunnat, maakunnat',
    de: 'SKR, Kommunen, Kreistage',
    fr: 'SKR, collectivités locales, conseils de comté',
    es: 'SKR, gobierno local, consejos de condado',
    nl: 'SKR, lokaal bestuur, provincies',
    ar: 'SKR، الحكومات المحلية، مجالس المقاطعات',
    he: 'SKR, שלטון מקומי, מועצות מחוזיות',
    ja: 'SKR、地方自治体、県議会',
    ko: 'SKR, 지방 정부, 카운티 의회',
    zh: 'SKR、地方政府、县议会',
  },
  international: {
    en: 'EU institutions, Nordic cooperation, OECD',
    sv: 'EU-institutioner, nordiskt samarbete, OECD',
    da: 'EU-institutioner, nordisk samarbejde, OECD',
    no: 'EU-institusjoner, nordisk samarbeid, OECD',
    fi: 'EU-instituutiot, pohjoismainen yhteistyö, OECD',
    de: 'EU-Institutionen, nordische Zusammenarbeit, OECD',
    fr: 'Institutions européennes, coopération nordique, OCDE',
    es: 'Instituciones de la UE, cooperación nórdica, OCDE',
    nl: 'EU-instellingen, Noordse samenwerking, OESO',
    ar: 'مؤسسات الاتحاد الأوروبي، التعاون النوردي، OECD',
    he: 'מוסדות ה-EU, שיתוף פעולה נורדי, OECD',
    ja: 'EU機関、北欧協力、OECD',
    ko: 'EU 기관, 북유럽 협력, OECD',
    zh: '欧盟机构、北欧合作、OECD',
  },
  media: {
    en: 'Press, broadcast, OSINT — public scrutiny',
    sv: 'Press, etermedia, OSINT — offentlig granskning',
    da: 'Presse, medier, OSINT — offentlig kontrol',
    no: 'Presse, kringkasting, OSINT — offentlig gransking',
    fi: 'Lehdistö, media, OSINT — julkinen valvonta',
    de: 'Presse, Rundfunk, OSINT — öffentliche Kontrolle',
    fr: 'Presse, médias, OSINT — contrôle public',
    es: 'Prensa, medios, OSINT — escrutinio público',
    nl: 'Pers, media, OSINT — publieke controle',
    ar: 'الصحافة، الإعلام، OSINT — الرقابة العامة',
    he: 'עיתונות, שידור, OSINT — ביקורת ציבורית',
    ja: '報道、放送、OSINT — 公的監視',
    ko: '언론, 방송, OSINT — 공적 감시',
    zh: '新闻、广播、OSINT — 公众监督',
  },
  academia: {
    en: 'Universities, think tanks, independent research',
    sv: 'Universitet, tankesmedjor, oberoende forskning',
    da: 'Universiteter, tænketanke, uafhængig forskning',
    no: 'Universiteter, tankesmier, uavhengig forskning',
    fi: 'Yliopistot, ajatushautomot, riippumaton tutkimus',
    de: 'Universitäten, Denkfabriken, unabhängige Forschung',
    fr: 'Universités, think tanks, recherche indépendante',
    es: 'Universidades, centros de pensamiento, investigación independiente',
    nl: 'Universiteiten, denktanks, onafhankelijk onderzoek',
    ar: 'الجامعات، مراكز الفكر، البحوث المستقلة',
    he: 'אוניברסיטאות, מכוני מחקר, מחקר עצמאי',
    ja: '大学、シンクタンク、独立研究機関',
    ko: '대학, 싱크탱크, 독립 연구',
    zh: '大学、智库、独立研究',
  },
  labor: {
    en: 'LO, TCO, Saco — labour market organisations',
    sv: 'LO, TCO, Saco — arbetsmarknadsorganisationer',
    da: 'LO, FTF, AC — arbejdsmarkedsorganisationer',
    no: 'LO, YS, Unio — arbeidsmarkedsorganisasjoner',
    fi: 'SAK, STTK, Akava — työmarkkinajärjestöt',
    de: 'LO, TCO, Saco — Arbeitsmarktorganisationen',
    fr: 'LO, TCO, Saco — organisations du marché du travail',
    es: 'LO, TCO, Saco — organizaciones del mercado laboral',
    nl: 'LO, TCO, Saco — arbeidsmarktorganisaties',
    ar: 'LO, TCO, Saco — منظمات سوق العمل',
    he: 'LO, TCO, Saco — ארגוני שוק העבודה',
    ja: 'LO, TCO, Saco — 労働市場組織',
    ko: 'LO, TCO, Saco — 노동시장 조직',
    zh: 'LO, TCO, Saco — 劳动市场组织',
  },
};

// ---------------------------------------------------------------------------
// Document type → stakeholder relevance
// ---------------------------------------------------------------------------

/** Determine the set of stakeholder categories relevant to this document set */
function selectRelevantStakeholders(
  docs: RawDocument[],
): StakeholderCategory[] {
  const types = new Set(docs.map(d => d.doktyp || d.documentType || ''));
  // Build keyword text from the same canonical sources titleOf() uses
  const titles = docs.map(d => searchTextOf(d)).join(' ');
  // SFS docs may lack doktyp but have dokumentnamn starting with "SFS"
  const hasSfs = types.has('sfs') || docs.some(d => (d.dokumentnamn || '').startsWith('SFS'));

  const categories: StakeholderCategory[] = ['government', 'opposition', 'private', 'civil-society'];

  // Municipal/regional — added when there are laws (SFS), propositions, or
  // content concerning municipalities/regions/kommuner.
  // NOTE: 'skr' (skrivelse / government communication) is intentionally excluded
  // as it represents government communications, not municipal/regional matters.
  if (types.has('prop') || hasSfs
      || titles.includes('kommuner') || titles.includes('region')
      || titles.includes('municipality') || titles.includes('local government')) {
    categories.push('municipal');
  }

  // International/EU — primarily triggered by EU position papers (fpm);
  // also triggered by title keywords indicating EU/international policy scope.
  // Uses word-boundary regex for 'eu' to catch "EU-förordning", "EU budget", etc.
  if (types.has('fpm') || types.has('eu')
      || /\beu\b/i.test(titles) || titles.includes('europa')
      || titles.includes('international') || titles.includes('nato')
      || titles.includes('nordic') || titles.includes('norden')) {
    categories.push('international');
  }

  // Media — primarily triggered by press releases (pressm);
  // also triggered by title keywords indicating transparency/public scrutiny topics
  if (types.has('pressm') || titles.includes('offentlig') || titles.includes('public')
      || titles.includes('transparens') || titles.includes('transparency')
      || titles.includes('press') || titles.includes('media')) {
    categories.push('media');
  }

  // Academia — added for research/evidence-heavy policy areas
  if (titles.includes('utredning') || titles.includes('forskning') || titles.includes('research')
      || titles.includes('studie') || titles.includes('rapport') || titles.includes('utvärd')
      || types.has('sou') || types.has('ds')) {
    categories.push('academia');
  }

  // Labour/unions — added when labour market content detected
  if (titles.includes('arbetsmarknad') || titles.includes('labour') || titles.includes('labor')
      || titles.includes('anställning') || titles.includes('lön') || titles.includes('wage')
      || titles.includes('facklig') || titles.includes('union')) {
    categories.push('labor');
  }

  return categories;
}

// ---------------------------------------------------------------------------
// Per-stakeholder SWOT builders
// ---------------------------------------------------------------------------

function buildGovernmentSwot(
  propDocs: RawDocument[],
  sfsDocs: RawDocument[],
  skrDocs: RawDocument[],
  pressmDocs: RawDocument[],
  betDocs: RawDocument[],
  motDocs: RawDocument[],
  euDocs: RawDocument[],
  lang: Language,
): { swot: SwotData; refs: string[] } {
  const refs: string[] = [];

  const sProps = docsToEntries(propDocs, 'high', 3);
  const sSfs   = docsToEntries(sfsDocs, 'high', 2);
  const sSkr   = docsToEntries(skrDocs, 'medium', 1);
  const sPress = docsToEntries(pressmDocs, 'high', 2);
  const strengths: SwotEntry[] = [...sProps.entries, ...sSfs.entries, ...sSkr.entries, ...sPress.entries];
  refs.push(...sProps.refs, ...sSfs.refs, ...sSkr.refs, ...sPress.refs);
  if (strengths.length === 0) strengths.push({ text: loc(GOV_S, lang), impact: 'high' });

  const wBet = docsToEntries(betDocs, 'medium', 2);
  const weaknesses: SwotEntry[] = [...wBet.entries];
  refs.push(...wBet.refs);
  if (weaknesses.length === 0) weaknesses.push({ text: loc(GOV_W, lang), impact: 'medium' });

  const oEu  = docsToEntries(euDocs, 'high', 2);
  const oSkr = docsToEntries(skrDocs.slice(1), 'medium', 1);
  const opportunities: SwotEntry[] = [...oEu.entries, ...oSkr.entries];
  refs.push(...oEu.refs, ...oSkr.refs);
  if (opportunities.length === 0) opportunities.push({ text: loc(GOV_O, lang), impact: 'high' });

  const tMot = docsToEntries(motDocs, 'medium', 2);
  const threats: SwotEntry[] = [...tMot.entries];
  refs.push(...tMot.refs);
  if (threats.length === 0) threats.push({ text: loc(GOV_T, lang), impact: 'medium' });

  return { swot: { strengths, weaknesses, opportunities, threats }, refs: [...new Set(refs)] };
}

function buildOppositionSwot(
  betDocs: RawDocument[],
  motDocs: RawDocument[],
  propDocs: RawDocument[],
  lang: Language,
): { swot: SwotData; refs: string[] } {
  const refs: string[] = [];

  const sBet = docsToEntries(betDocs, 'high', 3);
  const sMot = docsToEntries(motDocs, 'medium', 2);
  const strengths: SwotEntry[] = [...sBet.entries, ...sMot.entries];
  refs.push(...sBet.refs, ...sMot.refs);
  if (strengths.length === 0) strengths.push({ text: loc(OPP_S, lang), impact: 'high' });

  const weaknesses: SwotEntry[] = [{ text: loc(OPP_W, lang), impact: 'medium' }];

  const oBet = docsToEntries(betDocs.slice(3), 'medium', 2);
  const opportunities: SwotEntry[] = [...oBet.entries];
  refs.push(...oBet.refs);
  if (opportunities.length === 0) opportunities.push({ text: loc(OPP_O, lang), impact: 'high' });

  const tProp = docsToEntries(propDocs, 'medium', 1);
  const threats: SwotEntry[] = [...tProp.entries];
  refs.push(...tProp.refs);
  if (threats.length === 0) threats.push({ text: loc(OPP_T, lang), impact: 'medium' });

  return { swot: { strengths, weaknesses, opportunities, threats }, refs: [...new Set(refs)] };
}

function buildPrivateSectorSwot(
  extDocs: RawDocument[],
  sfsDocs: RawDocument[],
  propDocs: RawDocument[],
  euDocs: RawDocument[],
  lang: Language,
): { swot: SwotData; refs: string[] } {
  const refs: string[] = [];

  const sExt = docsToEntries(extDocs, 'high', 2);
  const sSfs = docsToEntries(sfsDocs, 'medium', 1);
  const strengths: SwotEntry[] = [...sExt.entries, ...sSfs.entries];
  refs.push(...sExt.refs, ...sSfs.refs);
  if (strengths.length === 0) strengths.push({ text: loc(PVT_S, lang), impact: 'high' });

  const wProp = docsToEntries(propDocs, 'medium', 2);
  const weaknesses: SwotEntry[] = [...wProp.entries];
  refs.push(...wProp.refs);
  if (weaknesses.length === 0) weaknesses.push({ text: loc(PVT_W, lang), impact: 'medium' });

  const oProp = docsToEntries(propDocs.slice(2), 'high', 1);
  const oEu   = docsToEntries(euDocs, 'high', 1);
  const opportunities: SwotEntry[] = [...oProp.entries, ...oEu.entries];
  refs.push(...oProp.refs, ...oEu.refs);
  if (opportunities.length === 0) opportunities.push({ text: loc(PVT_O, lang), impact: 'high' });

  const threats: SwotEntry[] = [{ text: loc(PVT_T, lang), impact: 'medium' }];

  return { swot: { strengths, weaknesses, opportunities, threats }, refs: [...new Set(refs)] };
}

function buildCivilSocietySwot(
  motDocs: RawDocument[],
  extDocs: RawDocument[],
  betDocs: RawDocument[],
  euDocs: RawDocument[],
  propDocs: RawDocument[],
  lang: Language,
): { swot: SwotData; refs: string[] } {
  const refs: string[] = [];

  const sMot = docsToEntries(motDocs, 'medium', 2);
  const sExt = docsToEntries(extDocs, 'medium', 1);
  const strengths: SwotEntry[] = [...sMot.entries, ...sExt.entries];
  refs.push(...sMot.refs, ...sExt.refs);
  if (strengths.length === 0) strengths.push({ text: loc(CIV_S, lang), impact: 'medium' });

  const weaknesses: SwotEntry[] = [{ text: loc(CIV_W, lang), impact: 'medium' }];

  const oBet = docsToEntries(betDocs, 'medium', 2);
  const oEu  = docsToEntries(euDocs, 'medium', 1);
  const opportunities: SwotEntry[] = [...oBet.entries, ...oEu.entries];
  refs.push(...oBet.refs, ...oEu.refs);
  if (opportunities.length === 0) opportunities.push({ text: loc(CIV_O, lang), impact: 'high' });

  const tProp = docsToEntries(propDocs, 'medium', 1);
  const threats: SwotEntry[] = [...tProp.entries];
  refs.push(...tProp.refs);
  if (threats.length === 0) threats.push({ text: loc(CIV_T, lang), impact: 'medium' });

  return { swot: { strengths, weaknesses, opportunities, threats }, refs: [...new Set(refs)] };
}

function buildMunicipalSwot(
  propDocs: RawDocument[],
  sfsDocs: RawDocument[],
  skrDocs: RawDocument[],
  lang: Language,
): { swot: SwotData; refs: string[] } {
  const refs: string[] = [];

  const strengths: SwotEntry[] = [{ text: loc(MUN_S, lang), impact: 'high' }];

  const wProp = docsToEntries(propDocs, 'high', 2);
  const wSfs  = docsToEntries(sfsDocs, 'medium', 1);
  const weaknesses: SwotEntry[] = [...wProp.entries, ...wSfs.entries];
  refs.push(...wProp.refs, ...wSfs.refs);
  if (weaknesses.length === 0) weaknesses.push({ text: loc(MUN_W, lang), impact: 'high' });

  const opportunities: SwotEntry[] = [{ text: loc(MUN_O, lang), impact: 'medium' }];

  const tSkr = docsToEntries(skrDocs, 'medium', 1);
  const threats: SwotEntry[] = [...tSkr.entries];
  refs.push(...tSkr.refs);
  if (threats.length === 0) threats.push({ text: loc(MUN_T, lang), impact: 'high' });

  return { swot: { strengths, weaknesses, opportunities, threats }, refs: [...new Set(refs)] };
}

function buildInternationalSwot(
  euDocs: RawDocument[],
  propDocs: RawDocument[],
  lang: Language,
): { swot: SwotData; refs: string[] } {
  const refs: string[] = [];

  const sEu = docsToEntries(euDocs, 'high', 3);
  const strengths: SwotEntry[] = [...sEu.entries];
  refs.push(...sEu.refs);
  if (strengths.length === 0) strengths.push({ text: loc(INT_S, lang), impact: 'high' });

  const weaknesses: SwotEntry[] = [{ text: loc(INT_W, lang), impact: 'medium' }];

  const oEu = docsToEntries(euDocs.slice(3), 'high', 2);
  const opportunities: SwotEntry[] = [...oEu.entries];
  refs.push(...oEu.refs);
  if (opportunities.length === 0) opportunities.push({ text: loc(INT_O, lang), impact: 'high' });

  const tProp = docsToEntries(propDocs, 'medium', 1);
  const threats: SwotEntry[] = [...tProp.entries];
  refs.push(...tProp.refs);
  if (threats.length === 0) threats.push({ text: loc(INT_T, lang), impact: 'medium' });

  return { swot: { strengths, weaknesses, opportunities, threats }, refs: [...new Set(refs)] };
}

function buildMediaSwot(
  pressmDocs: RawDocument[],
  propDocs: RawDocument[],
  lang: Language,
): { swot: SwotData; refs: string[] } {
  const refs: string[] = [];

  const sPress = docsToEntries(pressmDocs, 'high', 2);
  const strengths: SwotEntry[] = [...sPress.entries];
  refs.push(...sPress.refs);
  if (strengths.length === 0) strengths.push({ text: loc(MED_S, lang), impact: 'high' });

  const weaknesses: SwotEntry[] = [{ text: loc(MED_W, lang), impact: 'medium' }];

  const opportunities: SwotEntry[] = [{ text: loc(MED_O, lang), impact: 'high' }];

  const tProp = docsToEntries(propDocs, 'low', 1);
  const threats: SwotEntry[] = [...tProp.entries];
  refs.push(...tProp.refs);
  if (threats.length === 0) threats.push({ text: loc(MED_T, lang), impact: 'medium' });

  return { swot: { strengths, weaknesses, opportunities, threats }, refs: [...new Set(refs)] };
}

function buildAcademiaSwot(
  lang: Language,
): { swot: SwotData; refs: string[] } {
  return {
    swot: {
      strengths:     [{ text: loc(ACA_S, lang), impact: 'high' }],
      weaknesses:    [{ text: loc(ACA_W, lang), impact: 'medium' }],
      opportunities: [{ text: loc(ACA_O, lang), impact: 'high' }],
      threats:       [{ text: loc(ACA_T, lang), impact: 'medium' }],
    },
    refs: [],
  };
}

function buildLaborSwot(
  lang: Language,
): { swot: SwotData; refs: string[] } {
  return {
    swot: {
      strengths:     [{ text: loc(LAB_S, lang), impact: 'high' }],
      weaknesses:    [{ text: loc(LAB_W, lang), impact: 'medium' }],
      opportunities: [{ text: loc(LAB_O, lang), impact: 'high' }],
      threats:       [{ text: loc(LAB_T, lang), impact: 'medium' }],
    },
    refs: [],
  };
}

// ---------------------------------------------------------------------------
// Confidence level assessment
// ---------------------------------------------------------------------------

/** Assess confidence based on how many evidence refs a stakeholder has.
 *  Thresholds chosen to reflect quality tiers:
 *  - HIGH (≥4 refs): Multiple document types corroborate the analysis
 *  - MEDIUM (1–3 refs): Some documentary evidence supports the analysis
 *  - LOW (0 refs): Fallback text only; no direct document evidence
 */
function assessConfidence(refCount: number): 'high' | 'medium' | 'low' {
  if (refCount >= 4) return 'high';
  if (refCount >= 1) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build multi-stakeholder SWOT analyses for a deep-inspection article.
 *
 * Analyses the provided documents by type to produce document-specific SWOT
 * entries for 4–9 stakeholder perspectives. Every SWOT entry that can be
 * traced back to a source document carries an evidence reference (`dok_id`).
 *
 * Stakeholder selection is dynamic: the four core perspectives (government,
 * opposition, private sector, civil society) are always included. Up to five
 * additional perspectives (municipal, international, media, academia, labor)
 * are added when the document mix indicates their relevance.
 *
 * @param docs  Classified parliamentary documents to analyse
 * @param lang  Target language for localised stakeholder names and fallbacks
 * @returns Array of 4–9 `StakeholderSwot` objects with evidence refs
 */
export function buildMultiStakeholderSwot(
  docs: RawDocument[],
  lang: Language,
): StakeholderSwot[] {
  if (docs.length === 0) return [];

  // Classify by document type
  const propDocs   = docs.filter(d => (d.doktyp || d.documentType) === 'prop');
  const betDocs    = docs.filter(d => (d.doktyp || d.documentType) === 'bet');
  const motDocs    = docs.filter(d => (d.doktyp || d.documentType) === 'mot');
  const skrDocs    = docs.filter(d => (d.doktyp || d.documentType) === 'skr');
  const sfsDocs    = docs.filter(d =>
    (d.doktyp || d.documentType) === 'sfs' || (d.dokumentnamn || '').startsWith('SFS'));
  // EU docs: includes fpm/eu doc types AND docs whose titles/names match EU keywords,
  // so the international SWOT is grounded in the same docs that trigger the
  // international stakeholder in selectRelevantStakeholders().
  const euDocs     = docs.filter(d => {
    const t = d.doktyp || d.documentType;
    if (t === 'fpm' || t === 'eu') return true;
    const text = searchTextOf(d);
    return /\beu\b/i.test(text) || /europa/i.test(text);
  });
  const pressmDocs = docs.filter(d => (d.doktyp || d.documentType) === 'pressm');
  const extDocs    = docs.filter(d => (d.doktyp || d.documentType) === 'ext');

  // Select relevant stakeholder categories for this document mix
  const categories = selectRelevantStakeholders(docs);

  const stakeholders: StakeholderSwot[] = [];

  for (const cat of categories) {
    let result: { swot: SwotData; refs: string[] };

    switch (cat) {
      case 'government':
        result = buildGovernmentSwot(propDocs, sfsDocs, skrDocs, pressmDocs, betDocs, motDocs, euDocs, lang);
        break;
      case 'opposition':
        result = buildOppositionSwot(betDocs, motDocs, propDocs, lang);
        break;
      case 'private':
        result = buildPrivateSectorSwot(extDocs, sfsDocs, propDocs, euDocs, lang);
        break;
      case 'civil-society':
        result = buildCivilSocietySwot(motDocs, extDocs, betDocs, euDocs, propDocs, lang);
        break;
      case 'municipal':
        result = buildMunicipalSwot(propDocs, sfsDocs, skrDocs, lang);
        break;
      case 'international':
        result = buildInternationalSwot(euDocs, propDocs, lang);
        break;
      case 'media':
        result = buildMediaSwot(pressmDocs, propDocs, lang);
        break;
      case 'academia':
        result = buildAcademiaSwot(lang);
        break;
      case 'labor':
        result = buildLaborSwot(lang);
        break;
      default:
        continue;
    }

    const name = STAKEHOLDER_NAMES[cat]?.[lang] ?? STAKEHOLDER_NAMES[cat]?.en ?? cat;

    stakeholders.push({
      name,
      role: STAKEHOLDER_ROLES[cat]?.[lang] ?? STAKEHOLDER_ROLES[cat]?.en,
      category: cat,
      swot: result.swot,
      evidenceRefs: result.refs.length > 0 ? result.refs : undefined,
      confidenceLevel: assessConfidence(result.refs.length),
    });
  }

  return stakeholders;
}
