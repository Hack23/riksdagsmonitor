/**
 * @module ai-analysis/swot/placeholders
 * @description Structural placeholder text builders for SWOT quadrants.
 *
 * These are fallback sentences used **only** when no document evidence exists
 * for a particular stakeholder × quadrant combination. Content-derived entries
 * always take precedence. Future LLM integration point: replace
 * `buildPlaceholderText` with an API call.
 *
 * Covers all 14 supported languages (en, sv, da, no, fi, de, fr, es, nl, ar,
 * he, ja, ko, zh).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';

// ---------------------------------------------------------------------------
// SWOT composition builders (per-language)
// ---------------------------------------------------------------------------

type SwotRoleCompositions = Record<string, Record<string, string>>;
type SwotCompositionBuilder = (topicFrag: string, domainFrag: string) => SwotRoleCompositions;

/**
 * Per-language SWOT placeholder composition builders.
 * Covers sv, da, no, fi, de, fr, es, nl, ar, he, ja, ko, zh (13 non-English languages).
 * English is handled by the caller (applyLanguageFraming returns enText directly).
 */
const SWOT_LANGUAGE_BUILDERS: Partial<Record<Language, { domainPrep: string; builder: SwotCompositionBuilder }>> = {
  sv: {
    domainPrep: 'inom',
    builder: (tf, df) => ({
      government: {
        strengths: `Lagstiftningsbehörighet och exekutiv agendasättningskapacitet${tf}${df} genom propositioner och förordningar`,
        weaknesses: `Genomföranderisker och resursallokeringsutmaningar${tf}${df} som kräver myndighetssamordning`,
        opportunities: `EU-reglering och internationella samarbetsramverk${tf}${df} för politikutveckling`,
        threats: `Parlamentarisk oppositionsgranskning och utskottsändringsrisker${tf}${df} som kan fördröja eller modifiera lagstiftningsresultat`,
      },
      parliament: {
        strengths: `Tillsynsmandat och utskottsgranskning${tf}${df} genom betänkanden och kammardebatten`,
        weaknesses: `Informationsasymmetri gentemot den exekutiva grenen${tf}${df} i genomförandedetaljer`,
        opportunities: `Konsensusbyggande över partigränser${tf}${df} för att stärka lagstiftning`,
        threats: `Regeringsmajoriteten begränsar effektiv ändringskapacitet${tf}${df} i utskott och kammare`,
      },
      'private-sector': {
        strengths: `Domänexpertis, operativ kapacitet och sektorsspecifik kunskap${tf}${df} som påverkar policyutformning`,
        weaknesses: `Efterlevnadsanpassningsbörda och regulatorisk osäkerhet${tf}${df} som skapar planeringsutmaningar`,
        opportunities: `Policydriven investering, innovationspotential och marknadsutveckling${tf}${df}`,
        threats: `Snabb policyutveckling och korta genomförandetidsplaner${tf}${df} skapar konkurrensmässig osäkerhet`,
      },
    }),
  },
  da: {
    domainPrep: 'inden for',
    builder: (tf, df) => ({
      government: {
        strengths: `Lovgivningsmyndighed og dagsordensættende kapacitet${tf}${df} gennem regeringsforslag og lovgivningsinstrumenter`,
        weaknesses: `Implementeringsrisici og ressourceallokeringsudfordringer${tf}${df} der kræver tværministeriel koordinering`,
        opportunities: `EU-reguleringstilpasning og internationale samarbejdsrammer${tf}${df} for politikudvikling`,
        threats: `Parlamentarisk oppositionsgranskning og udvalgsændringsrisici${tf}${df} der kan forsinke eller ændre lovgivningsresultater`,
      },
      parliament: {
        strengths: `Tilsynsmandat og tværudvalgs-granskning${tf}${df} gennem betænkninger og kammerdebatter`,
        weaknesses: `Informationsasymmetri i forhold til den udøvende magt${tf}${df} om implementeringsdetaljer`,
        opportunities: `Konsensusopbygning på tværs af partier${tf}${df} for at styrke lovgivningen`,
        threats: `Regeringsflertal begrænser effektiv ændringskapacitet${tf}${df} i udvalg og kamre`,
      },
      'private-sector': {
        strengths: `Domæneekspertise, operationel kapacitet og sektorspecifik viden${tf}${df} der påvirker politikudformning`,
        weaknesses: `Compliance-tilpasningsbyrde og regulatorisk usikkerhed${tf}${df} der skaber planlægningsudfordringer`,
        opportunities: `Politikdrevet investering, innovationspotentiale og markedsudvikling${tf}${df}`,
        threats: `Hurtig politikudvikling og korte implementeringstidslinjer${tf}${df} der skaber konkurrencemæssig usikkerhed`,
      },
    }),
  },
  no: {
    domainPrep: 'innen',
    builder: (tf, df) => ({
      government: {
        strengths: `Lovgivningsmyndighet og dagsordensettende kapasitet${tf}${df} gjennom regjeringsforslag og lovgivningsinstrumenter`,
        weaknesses: `Implementeringsrisikoer og ressursallokeringsutfordringer${tf}${df} som krever tverretatlig koordinering`,
        opportunities: `EU-reguleringstilpasning og internasjonale samarbeidsrammer${tf}${df} for politikkutvikling`,
        threats: `Parlamentarisk opposisjonsgranskning og komitéendringsrisikoer${tf}${df} som kan forsinke eller endre lovgivningsresultater`,
      },
      parliament: {
        strengths: `Tilsynsmandat og tverrkomitégranskning${tf}${df} gjennom komitéinnstillinger og kammerdebatter`,
        weaknesses: `Informasjonsasymmetri overfor den utøvende makt${tf}${df} om implementeringsdetaljer`,
        opportunities: `Konsensusbygging på tvers av partier${tf}${df} for å styrke lovgivningen`,
        threats: `Regjeringsflertall begrenser effektiv endringskapasitet${tf}${df} i komiteer og kamre`,
      },
      'private-sector': {
        strengths: `Domeneekspertise, operasjonell kapasitet og sektorspesifikk kunnskap${tf}${df} som påvirker politikkutforming`,
        weaknesses: `Etterlevelsestilpasningsbyrde og regulatorisk usikkerhet${tf}${df} som skaper planleggingsutfordringer`,
        opportunities: `Politikkdrevet investering, innovasjonspotensial og markedsutvikling${tf}${df}`,
        threats: `Rask politikkutvikling og korte implementeringstidslinjer${tf}${df} som skaper konkurransemessig usikkerhet`,
      },
    }),
  },
  fi: {
    domainPrep: 'alueella',
    builder: (tf, df) => ({
      government: {
        strengths: `Lainsäädäntövalta ja toimeenpanovallan agendanasettamiskyky${tf}${df} hallituksen esitysten ja asetusten kautta`,
        weaknesses: `Täytäntöönpanoriskit ja resurssien kohdentamishaasteet${tf}${df} edellyttävät hallinnonalojen välistä koordinointia`,
        opportunities: `EU-sääntelyn yhdenmukaistaminen ja kansainväliset yhteistyökehykset${tf}${df} politiikan edistämiseksi`,
        threats: `Eduskuntaopposition valvonta ja valiokunnan muutosriskit${tf}${df} voivat viivästyttää tai muuttaa lainsäädäntötuloksia`,
      },
      parliament: {
        strengths: `Valvontamandaatti ja valiokuntien välinen tarkastelu${tf}${df} mietintöjen ja täysistuntokeskustelujen kautta`,
        weaknesses: `Tietoepäsymmetria toimeenpanovallan suhteen${tf}${df} täytäntöönpanon yksityiskohdissa`,
        opportunities: `Puoluerajat ylittävä konsensuksen rakentaminen${tf}${df} lainsäädännön vahvistamiseksi`,
        threats: `Hallituksen enemmistö rajoittaa tehokasta muutoskykyä${tf}${df} valiokunnissa ja täysistunnoissa`,
      },
      'private-sector': {
        strengths: `Alan asiantuntemus, operatiivinen kapasiteetti ja sektorikohtainen tieto${tf}${df} vaikuttavat politiikan suunnitteluun`,
        weaknesses: `Säädösten noudattamisen sopeutumisrasite ja sääntely-epävarmuus${tf}${df} luovat suunnitteluhaasteita`,
        opportunities: `Politiikkalähtöinen investointi, innovaatiopotentiaali ja markkinakehitys${tf}${df}`,
        threats: `Nopea politiikkakehitys ja lyhyet täytäntöönpanoaikataulut${tf}${df} luovat kilpailullista epävarmuutta`,
      },
    }),
  },
  de: {
    domainPrep: 'im Bereich',
    builder: (tf, df) => ({
      government: {
        strengths: `Gesetzgebungskompetenz und exekutive Agenda-Setting-Kapazität${tf}${df} durch Regierungsvorlagen und Verordnungen`,
        weaknesses: `Umsetzungsrisiken und Ressourcenallokationsherausforderungen${tf}${df} die behördenübergreifende Koordinierung erfordern`,
        opportunities: `EU-Regulierungsanpassung und internationale Kooperationsrahmen${tf}${df} für Politikentwicklung`,
        threats: `Parlamentarische Oppositionsprüfung und Ausschussänderungsrisiken${tf}${df} die Gesetzgebungsergebnisse verzögern oder ändern können`,
      },
      parliament: {
        strengths: `Aufsichtsmandat und ausschussübergreifende Prüfung${tf}${df} durch Berichte und Kammerdebatten`,
        weaknesses: `Informationsasymmetrie gegenüber der Exekutive${tf}${df} bei Umsetzungsdetails`,
        opportunities: `Parteiübergreifender Konsensaufbau${tf}${df} zur Stärkung der Gesetzgebung`,
        threats: `Regierungsmehrheit beschränkt effektive Änderungskapazität${tf}${df} in Ausschüssen und Kammern`,
      },
      'private-sector': {
        strengths: `Fachkompetenz, operative Kapazität und branchenspezifisches Wissen${tf}${df} mit Einfluss auf Politikgestaltung`,
        weaknesses: `Compliance-Anpassungslast und regulatorische Unsicherheit${tf}${df} die Planungsherausforderungen schaffen`,
        opportunities: `Politikgetriebene Investitionen, Innovationspotenzial und Marktentwicklung${tf}${df}`,
        threats: `Schnelle Politikentwicklung und kurze Umsetzungsfristen${tf}${df} schaffen wettbewerbliche Unsicherheit`,
      },
    }),
  },
  fr: {
    domainPrep: 'dans le domaine',
    builder: (tf, df) => ({
      government: {
        strengths: `Autorité législative et capacité d'établissement de l'agenda exécutif${tf}${df} à travers propositions et instruments réglementaires`,
        weaknesses: `Risques de mise en œuvre et défis d'allocation des ressources${tf}${df} nécessitant une coordination interministérielle`,
        opportunities: `Alignement réglementaire UE et cadres de coopération internationale${tf}${df} pour le développement politique`,
        threats: `Contrôle de l'opposition parlementaire et risques d'amendement en commission${tf}${df} pouvant retarder ou modifier les résultats législatifs`,
      },
      parliament: {
        strengths: `Mandat de surveillance et examen transversal en commission${tf}${df} à travers rapports et débats en séance`,
        weaknesses: `Asymétrie d'information face au pouvoir exécutif${tf}${df} sur les détails de mise en œuvre`,
        opportunities: `Construction de consensus transpartisan${tf}${df} pour renforcer la législation`,
        threats: `La majorité gouvernementale limite la capacité effective d'amendement${tf}${df} en commission et en séance`,
      },
      'private-sector': {
        strengths: `Expertise sectorielle, capacité opérationnelle et connaissances spécifiques${tf}${df} influençant l'élaboration des politiques`,
        weaknesses: `Charge d'adaptation à la conformité et incertitude réglementaire${tf}${df} créant des défis de planification`,
        opportunities: `Investissement guidé par les politiques, potentiel d'innovation et développement de marché${tf}${df}`,
        threats: `Évolution rapide des politiques et délais de mise en œuvre courts${tf}${df} créant une incertitude concurrentielle`,
      },
    }),
  },
  es: {
    domainPrep: 'en el ámbito de',
    builder: (tf, df) => ({
      government: {
        strengths: `Autoridad legislativa y capacidad ejecutiva de establecimiento de agenda${tf}${df} mediante proposiciones y instrumentos normativos`,
        weaknesses: `Riesgos de implementación y desafíos de asignación de recursos${tf}${df} que requieren coordinación interinstitucional`,
        opportunities: `Alineación regulatoria de la UE y marcos de cooperación internacional${tf}${df} para el avance político`,
        threats: `Escrutinio de la oposición parlamentaria y riesgos de enmienda en comisión${tf}${df} que pueden retrasar o modificar resultados legislativos`,
      },
      parliament: {
        strengths: `Mandato de supervisión y escrutinio transversal en comisión${tf}${df} mediante informes y debates en pleno`,
        weaknesses: `Asimetría de información frente al poder ejecutivo${tf}${df} en detalles de implementación`,
        opportunities: `Construcción de consenso entre partidos${tf}${df} para fortalecer la legislación`,
        threats: `La mayoría gubernamental limita la capacidad efectiva de enmienda${tf}${df} en comisión y pleno`,
      },
      'private-sector': {
        strengths: `Experiencia sectorial, capacidad operativa y conocimiento específico${tf}${df} que influye en el diseño de políticas`,
        weaknesses: `Carga de adaptación al cumplimiento e incertidumbre regulatoria${tf}${df} que genera desafíos de planificación`,
        opportunities: `Inversión impulsada por políticas, potencial de innovación y desarrollo de mercado${tf}${df}`,
        threats: `Evolución rápida de políticas y plazos de implementación cortos${tf}${df} que generan incertidumbre competitiva`,
      },
    }),
  },
  nl: {
    domainPrep: 'op het gebied van',
    builder: (tf, df) => ({
      government: {
        strengths: `Wetgevende bevoegdheid en uitvoerende agendabepalende capaciteit${tf}${df} via wetsvoorstellen en regelgevende instrumenten`,
        weaknesses: `Implementatierisico's en uitdagingen bij toewijzing van middelen${tf}${df} die interdepartementale coördinatie vereisen`,
        opportunities: `EU-regelgevingsafstemming en internationale samenwerkingskaders${tf}${df} voor beleidsontwikkeling`,
        threats: `Parlementaire oppositiecontrole en commissieamenderingsrisico's${tf}${df} die wetgevingsresultaten kunnen vertragen of wijzigen`,
      },
      parliament: {
        strengths: `Toezichtsmandaat en commissie-overstijgend onderzoek${tf}${df} via rapporten en Kamerdebatten`,
        weaknesses: `Informatieasymmetrie ten opzichte van de uitvoerende macht${tf}${df} over implementatiedetails`,
        opportunities: `Partijoverstijgende consensusvorming${tf}${df} om wetgeving te versterken`,
        threats: `Regeringsmeerderheid beperkt effectieve wijzigingscapaciteit${tf}${df} in commissies en Kamer`,
      },
      'private-sector': {
        strengths: `Domeinexpertise, operationele capaciteit en sectorspecifieke kennis${tf}${df} die beleidsontwerp beïnvloeden`,
        weaknesses: `Nalevingsaanpassingslast en regelgevende onzekerheid${tf}${df} die planningsuitdagingen creëren`,
        opportunities: `Beleidsgedreven investeringen, innovatiepotentieel en marktontwikkeling${tf}${df}`,
        threats: `Snelle beleidsontwikkeling en korte implementatietijdlijnen${tf}${df} die concurrentieonzekerheid creëren`,
      },
    }),
  },
  ar: {
    domainPrep: 'في مجال',
    builder: (tf, df) => ({
      government: {
        strengths: `السلطة التشريعية وقدرة وضع الأجندة التنفيذية${tf}${df} من خلال مقترحات الحكومة والأدوات القانونية`,
        weaknesses: `مخاطر التنفيذ وتحديات تخصيص الموارد${tf}${df} التي تتطلب التنسيق بين الوكالات`,
        opportunities: `التوافق التنظيمي مع الاتحاد الأوروبي وأطر التعاون الدولي${tf}${df} لتطوير السياسات`,
        threats: `رقابة المعارضة البرلمانية ومخاطر التعديل في اللجان${tf}${df} التي قد تؤخر أو تعدل النتائج التشريعية`,
      },
      parliament: {
        strengths: `تفويض الرقابة والتدقيق عبر اللجان${tf}${df} من خلال التقارير والمناقشات البرلمانية`,
        weaknesses: `عدم تماثل المعلومات مقارنة بالسلطة التنفيذية${tf}${df} في تفاصيل التنفيذ`,
        opportunities: `بناء التوافق عبر الأحزاب${tf}${df} لتعزيز التشريعات`,
        threats: `الأغلبية الحكومية تحد من قدرة التعديل الفعالة${tf}${df} في اللجان والجلسات العامة`,
      },
      'private-sector': {
        strengths: `الخبرة القطاعية والقدرة التشغيلية والمعرفة المتخصصة${tf}${df} التي تؤثر على تصميم السياسات`,
        weaknesses: `عبء التكيف مع الامتثال وعدم اليقين التنظيمي${tf}${df} مما يخلق تحديات في التخطيط`,
        opportunities: `استثمار مدفوع بالسياسات وإمكانات الابتكار وتطوير السوق${tf}${df}`,
        threats: `تطور سريع للسياسات وجداول زمنية قصيرة للتنفيذ${tf}${df} تخلق عدم يقين تنافسي`,
      },
    }),
  },
  he: {
    domainPrep: 'בתחום',
    builder: (tf, df) => ({
      government: {
        strengths: `סמכות חקיקה ויכולת קביעת סדר יום ביצועי${tf}${df} באמצעות הצעות ממשלה ומכשירים חוקיים`,
        weaknesses: `סיכוני יישום ואתגרי הקצאת משאבים${tf}${df} הדורשים תיאום בין-משרדי`,
        opportunities: `התאמה לרגולציה של האיחוד האירופי ומסגרות שיתוף פעולה בינלאומי${tf}${df} לקידום מדיניות`,
        threats: `ביקורת אופוזיציה פרלמנטרית וסיכוני תיקון בוועדות${tf}${df} העלולים לעכב או לשנות תוצאות חקיקה`,
      },
      parliament: {
        strengths: `מנדט פיקוח ובחינה חוצת-ועדות${tf}${df} באמצעות דוחות ודיונים במליאה`,
        weaknesses: `אי-סימטריית מידע מול הרשות המבצעת${tf}${df} בפרטי יישום`,
        opportunities: `בניית קונצנזוס חוצה-מפלגות${tf}${df} לחיזוק החקיקה`,
        threats: `רוב ממשלתי מגביל יכולת תיקון אפקטיבית${tf}${df} בוועדות ובמליאה`,
      },
      'private-sector': {
        strengths: `מומחיות תחומית, יכולת תפעולית וידע ענפי-ספציפי${tf}${df} המשפיעים על עיצוב מדיניות`,
        weaknesses: `נטל התאמה לציות ואי-ודאות רגולטורית${tf}${df} היוצרים אתגרי תכנון`,
        opportunities: `השקעה מונעת-מדיניות, פוטנציאל חדשנות ופיתוח שוק${tf}${df}`,
        threats: `התפתחות מהירה של מדיניות ולוחות זמנים קצרים ליישום${tf}${df} יוצרים אי-ודאות תחרותית`,
      },
    }),
  },
  ja: {
    domainPrep: 'の分野における',
    builder: (tf, df) => ({
      government: {
        strengths: `立法権限と行政アジェンダ設定能力${tf}${df}（政府提案と法的手段を通じて）`,
        weaknesses: `実施リスクとリソース配分の課題${tf}${df}（省庁間の調整が必要）`,
        opportunities: `EU規制の整合性と国際協力の枠組み${tf}${df}（政策推進のため）`,
        threats: `議会野党の監視と委員会修正リスク${tf}${df}（立法成果を遅延・修正する可能性）`,
      },
      parliament: {
        strengths: `監視権限と委員会横断的審査${tf}${df}（報告書と本会議討論を通じて）`,
        weaknesses: `行政府に対する情報の非対称性${tf}${df}（実施詳細について）`,
        opportunities: `党派を超えた合意形成${tf}${df}（立法を強化するため）`,
        threats: `政府多数派が有効な修正能力を制限${tf}${df}（委員会と本会議で）`,
      },
      'private-sector': {
        strengths: `専門知識、運営能力、業界固有の知識${tf}${df}（政策設計に影響）`,
        weaknesses: `コンプライアンス適応負担と規制の不確実性${tf}${df}（計画上の課題を生成）`,
        opportunities: `政策主導の投資、イノベーション可能性、市場開発${tf}${df}`,
        threats: `急速な政策展開と短い実施期限${tf}${df}（競争上の不確実性を生成）`,
      },
    }),
  },
  ko: {
    domainPrep: '분야에서',
    builder: (tf, df) => ({
      government: {
        strengths: `입법 권한과 행정부 의제 설정 역량${tf}${df} (정부 제안과 법적 수단을 통해)`,
        weaknesses: `시행 리스크와 자원 배분 과제${tf}${df} (부처 간 조정 필요)`,
        opportunities: `EU 규제 조화와 국제 협력 체계${tf}${df} (정책 발전을 위해)`,
        threats: `의회 야당 감시와 위원회 수정 리스크${tf}${df} (입법 결과를 지연 또는 변경 가능)`,
      },
      parliament: {
        strengths: `감독 권한과 위원회 간 심사${tf}${df} (보고서와 본회의 토론을 통해)`,
        weaknesses: `행정부에 대한 정보 비대칭${tf}${df} (시행 세부사항에 대해)`,
        opportunities: `초당적 합의 형성${tf}${df} (입법 강화를 위해)`,
        threats: `정부 다수당이 효과적 수정 역량을 제한${tf}${df} (위원회와 본회의에서)`,
      },
      'private-sector': {
        strengths: `전문 지식, 운영 역량, 업종별 지식${tf}${df} (정책 설계에 영향)`,
        weaknesses: `컴플라이언스 적응 부담과 규제 불확실성${tf}${df} (계획 수립 과제 야기)`,
        opportunities: `정책 주도 투자, 혁신 잠재력, 시장 개발${tf}${df}`,
        threats: `빠른 정책 변화와 짧은 시행 기한${tf}${df} (경쟁 불확실성 야기)`,
      },
    }),
  },
  zh: {
    domainPrep: '领域',
    builder: (tf, df) => ({
      government: {
        strengths: `立法权力和行政议程设定能力${tf}${df}（通过政府提案和法律文书）`,
        weaknesses: `实施风险和资源分配挑战${tf}${df}（需要跨部门协调）`,
        opportunities: `欧盟监管协调和国际合作框架${tf}${df}（推动政策发展）`,
        threats: `议会反对派审查和委员会修改风险${tf}${df}（可能延迟或修改立法成果）`,
      },
      parliament: {
        strengths: `监督权限和跨委员会审查${tf}${df}（通过报告和全体会议辩论）`,
        weaknesses: `相对行政部门的信息不对称${tf}${df}（在实施细节方面）`,
        opportunities: `跨党派共识构建${tf}${df}（加强立法）`,
        threats: `政府多数限制有效修改能力${tf}${df}（在委员会和全体会议中）`,
      },
      'private-sector': {
        strengths: `领域专长、运营能力和行业专业知识${tf}${df}（影响政策设计）`,
        weaknesses: `合规适应负担和监管不确定性${tf}${df}（造成规划挑战）`,
        opportunities: `政策驱动投资、创新潜力和市场发展${tf}${df}`,
        threats: `快速政策演变和紧迫的实施时间表${tf}${df}（造成竞争不确定性）`,
      },
    }),
  },
};

/**
 * Apply language-specific framing to a placeholder text.
 * Provides localised SWOT placeholder compositions for all 14 supported languages
 * so non-English articles render in their target language.
 */
function applyLanguageFraming(
  enText: string,
  lang: Language,
  role: string,
  quadrant: string,
  topic: string | null,
  domain: string | null,
): string {
  if (lang === 'en') return enText;

  const entry = SWOT_LANGUAGE_BUILDERS[lang];
  if (entry) {
    const topicFrag = topic ? ` (${topic})` : '';
    const domainFrag = domain ? ` ${entry.domainPrep} ${domain}` : '';
    const compositions = entry.builder(topicFrag, domainFrag);
    const roleComposition = compositions[role] ?? compositions['government']!;
    const text = roleComposition[quadrant];
    if (text) return text;
  }

  return enText;
}

/**
 * Build a structural fallback SWOT text from role × quadrant × topic × domain.
 * Used only when no document evidence exists for a particular quadrant;
 * content-derived entries always take precedence over these placeholders.
 *
 * @param role - Stakeholder role (government, parliament, private-sector)
 * @param quadrant - SWOT quadrant (strengths, weaknesses, opportunities, threats)
 * @param topic - Optional focus topic
 * @param domain - Optional primary policy domain
 * @param lang - Target language
 * @returns Localised placeholder text
 */
export function buildPlaceholderText(
  role: string,
  quadrant: string,
  topic: string | null,
  domain: string | null,
  lang: Language,
): string {
  const topicFrag = topic ? ` (${topic})` : '';
  const domainFrag = domain ? ` in ${domain}` : '';

  const compositions: Record<string, Record<string, string>> = {
    government: {
      strengths: `Legislative authority and executive agenda-setting capacity${topicFrag}${domainFrag} through government propositions and statutory instruments`,
      weaknesses: `Implementation timeline risks and resource allocation challenges${topicFrag}${domainFrag} requiring interagency coordination`,
      opportunities: `EU regulatory alignment and international cooperation frameworks${topicFrag}${domainFrag} for policy advancement`,
      threats: `Parliamentary opposition scrutiny and committee amendment risks${topicFrag}${domainFrag} that may delay or modify legislative outcomes`,
    },
    parliament: {
      strengths: `Oversight mandate and cross-committee scrutiny capacity${topicFrag}${domainFrag} through committee reports and chamber debates`,
      weaknesses: `Information asymmetry relative to executive branch${topicFrag}${domainFrag} on implementation details and classified material`,
      opportunities: `Cross-party consensus-building and coalition amendment capacity${topicFrag}${domainFrag} to strengthen legislation`,
      threats: `Government majority limiting effective amendment capacity${topicFrag}${domainFrag} in committee and chamber votes`,
    },
    'private-sector': {
      strengths: `Domain expertise, operational capacity, and sector-specific knowledge${topicFrag}${domainFrag} influencing policy design`,
      weaknesses: `Compliance adaptation burden and regulatory uncertainty${topicFrag}${domainFrag} creating planning challenges`,
      opportunities: `Policy-driven investment, innovation potential, and market development${topicFrag}${domainFrag}`,
      threats: `Rapid policy evolution and short implementation timelines${topicFrag}${domainFrag} creating competitive uncertainty`,
    },
  };

  const roleCompositions = compositions[role] ?? compositions['government']!;
  const text = roleCompositions[quadrant] ?? `Policy analysis${topicFrag}${domainFrag}`;

  return applyLanguageFraming(text, lang, role, quadrant, topic, domain);
}
