/**
 * @module data-transformers/content-generators/ai-mindmap-analyzer
 * @description AI-driven conceptual mindmap analyzer for political documents.
 *
 * Analyzes a set of parliamentary documents and produces a structured
 * `AIMindmapAnalysis` that maps political relationships across five dimensions:
 *
 * 1. **Power Dynamics** — who holds influence and who is affected
 * 2. **Policy Impact** — what changes and for whom
 * 3. **Timeline & Urgency** — when effects materialize
 * 4. **Geographic / Institutional Scope** — where this applies
 * 5. **Motivations & Rationale** — why this matters
 *
 * Each dimension branch includes:
 * - AI-weighted items (critical / significant / moderate / minor)
 * - Stakeholder sub-branches (Government, Opposition, Civil Society)
 *
 * Cross-branch connections show relationships between dimensions.
 *
 * The returned `AIMindmapAnalysis` is designed to be passed directly to
 * `generateMindmapSection` via `buildMindmapOptionsFromAnalysis()`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import type { RawDocument } from '../types.js';
import { detectPolicyDomains } from '../policy-analysis.js';
import type {
  MindmapBranch,
  MindmapConnection,
  AIMindmapItem,
  SubBranch,
  MindmapSectionOptions,
} from './mindmap-section.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Complete AI-driven mindmap analysis output */
export interface AIMindmapAnalysis {
  /** AI-synthesized thesis statement for the central node */
  centralThesis: string;
  /** Five political dimension branches */
  branches: MindmapBranch[];
  /** Cross-branch connection indicators */
  connections: MindmapConnection[];
  /** Confidence score in [0, 1] based on data richness */
  confidenceScore: number;
}

// ---------------------------------------------------------------------------
// Localised labels (14 languages)
// ---------------------------------------------------------------------------

const DIMENSION_LABELS: Record<string, Partial<Record<Language, string>>> = {
  power: {
    en: 'Power Dynamics', sv: 'Maktdynamik', da: 'Magtdynamik', no: 'Maktdynamikk',
    fi: 'Valtadynamiikka', de: 'Machtdynamik', fr: 'Dynamiques de pouvoir', es: 'Dinámicas de poder',
    nl: 'Machtsdynamiek', ar: 'ديناميكيات القوة', he: 'דינמיקת כוח', ja: '権力力学', ko: '권력 역학', zh: '权力动态',
  },
  impact: {
    en: 'Policy Impact', sv: 'Politisk påverkan', da: 'Politisk påvirkning', no: 'Politisk innvirkning',
    fi: 'Politiikan vaikutus', de: 'Politische Auswirkungen', fr: 'Impact politique', es: 'Impacto político',
    nl: 'Beleidsimpact', ar: 'الأثر السياسي', he: 'השפעת מדיניות', ja: '政策影響', ko: '정책 영향', zh: '政策影响',
  },
  timeline: {
    en: 'Timeline & Urgency', sv: 'Tidslinje & Angelägenhet', da: 'Tidslinje & Hastighed', no: 'Tidslinje & Hastighet',
    fi: 'Aikajana & Kiireellisyys', de: 'Zeitplan & Dringlichkeit', fr: 'Calendrier & Urgence', es: 'Cronograma & Urgencia',
    nl: 'Tijdlijn & Urgentie', ar: 'الجدول الزمني والإلحاح', he: 'ציר זמן ודחיפות', ja: 'タイムライン・緊急性', ko: '타임라인 & 긴급성', zh: '时间线与紧迫性',
  },
  scope: {
    en: 'Geographic / Institutional Scope', sv: 'Geografisk / Institutionell räckvidd', da: 'Geografisk / Institutionel rækkevidde',
    no: 'Geografisk / Institusjonell rekkevidde', fi: 'Maantieteellinen / Institutionaalinen laajuus',
    de: 'Geografischer / Institutioneller Geltungsbereich', fr: 'Portée géographique / institutionnelle',
    es: 'Alcance geográfico / institucional', nl: 'Geografisch / Institutioneel bereik',
    ar: 'النطاق الجغرافي / المؤسسي', he: 'היקף גיאוגרפי / מוסדי', ja: '地理的・制度的範囲', ko: '지리적 / 제도적 범위', zh: '地理/制度范围',
  },
  motivation: {
    en: 'Motivations & Rationale', sv: 'Motiveringar & Rationale', da: 'Motivationer & Begrundelse', no: 'Motivasjoner & Begrunnelse',
    fi: 'Motivaatiot & Perustelu', de: 'Motivationen & Begründung', fr: 'Motivations & Justification', es: 'Motivaciones & Justificación',
    nl: 'Motivaties & Rationale', ar: 'الدوافع والمبررات', he: 'מניעים והנמקות', ja: '動機と根拠', ko: '동기 및 근거', zh: '动机与理由',
  },
};

const STAKEHOLDER_LABELS: Record<string, Partial<Record<Language, string>>> = {
  gov: {
    en: 'Government', sv: 'Regering', da: 'Regering', no: 'Regjering', fi: 'Hallitus',
    de: 'Regierung', fr: 'Gouvernement', es: 'Gobierno', nl: 'Regering',
    ar: 'الحكومة', he: 'ממשלה', ja: '政府', ko: '정부', zh: '政府',
  },
  opp: {
    en: 'Opposition', sv: 'Opposition', da: 'Opposition', no: 'Opposisjon', fi: 'Oppositio',
    de: 'Opposition', fr: 'Opposition', es: 'Oposición', nl: 'Oppositie',
    ar: 'المعارضة', he: 'אופוזיציה', ja: '野党', ko: '야당', zh: '反对派',
  },
  civil: {
    en: 'Civil Society', sv: 'Civilsamhälle', da: 'Civilsamfund', no: 'Sivilsamfunn', fi: 'Kansalaisyhteiskunta',
    de: 'Zivilgesellschaft', fr: 'Société civile', es: 'Sociedad civil', nl: 'Maatschappelijk middenveld',
    ar: 'المجتمع المدني', he: 'החברה האזרחית', ja: '市民社会', ko: '시민 사회', zh: '公民社会',
  },
  other: {
    en: 'Other actors', sv: 'Övriga aktörer', da: 'Andre aktører', no: 'Andre aktører', fi: 'Muut toimijat',
    de: 'Andere Akteure', fr: 'Autres acteurs', es: 'Otros actores', nl: 'Andere actoren',
    ar: 'جهات أخرى', he: 'גורמים אחרים', ja: 'その他の関係者', ko: '기타 관계자', zh: '其他相关方',
  },
};

/** Singular/plural document count formatter for each language */
const DOC_COUNT_FORMATTERS: Partial<Record<Language, (n: number) => string>> = {
  en: n => n === 1 ? 'document' : 'documents',
  sv: n => n === 1 ? 'dokument' : 'dokument',
  da: n => n === 1 ? 'dokument' : 'dokumenter',
  no: n => n === 1 ? 'dokument' : 'dokumenter',
  fi: n => n === 1 ? 'asiakirja' : 'asiakirjaa',
  de: n => n === 1 ? 'Dokument' : 'Dokumente',
  fr: n => n === 1 ? 'document' : 'documents',
  es: n => n === 1 ? 'documento' : 'documentos',
  nl: n => n === 1 ? 'document' : 'documenten',
  ar: () => 'وثيقة',
  he: n => n === 1 ? 'מסמך' : 'מסמכים',
  ja: () => '件',
  ko: n => n === 1 ? '문서' : '문서',
  zh: () => '份文件',
};

/** Fallback labels for when no policy domain is detected */
const FALLBACK_IMPACT_LABELS: Partial<Record<Language, string>> = {
  en: 'Legislative change', sv: 'Lagstiftningsändring', da: 'Lovgivningsændring', no: 'Lovendring',
  fi: 'Lainsäädännön muutos', de: 'Gesetzliche Änderung', fr: 'Changement législatif', es: 'Cambio legislativo',
  nl: 'Wetswijziging', ar: 'تغيير تشريعي', he: 'שינוי חקיקה', ja: '立法変更', ko: '입법 변경', zh: '立法变更',
};

/** Fallback labels used when topic or domains are absent in the central thesis */
const THESIS_FALLBACK_LABELS: Record<string, Partial<Record<Language, string>>> = {
  topic: {
    en: 'parliamentary activity', sv: 'riksdagsverksamhet', da: 'parlamentarisk aktivitet', no: 'parlamentarisk aktivitet',
    fi: 'parlamentaarinen toiminta', de: 'parlamentarische Tätigkeit', fr: 'activité parlementaire', es: 'actividad parlamentaria',
    nl: 'parlementaire activiteit', ar: 'النشاط البرلماني', he: 'פעילות פרלמנטרית', ja: '議会活動', ko: '의회 활동', zh: '议会活动',
  },
  domains: {
    en: 'policy', sv: 'politikområden', da: 'politikområder', no: 'politikkområder',
    fi: 'politiikka', de: 'Politik', fr: 'politique', es: 'política',
    nl: 'beleid', ar: 'السياسة', he: 'מדיניות', ja: '政策', ko: '정책', zh: '政策',
  },
};

/** Timeline branch localized item labels */
const TIMELINE_LABELS: Record<string, Partial<Record<Language, (n: number) => string>>> = {
  recentActivity: {
    en: n => `Recent activity: ${n} documents (last 3 months)`,
    sv: n => `Senaste aktivitet: ${n} dokument (senaste 3 månaderna)`,
    da: n => `Seneste aktivitet: ${n} dokumenter (seneste 3 måneder)`,
    no: n => `Nylig aktivitet: ${n} dokumenter (siste 3 måneder)`,
    fi: n => `Viimeaikainen toiminta: ${n} asiakirjaa (viimeinen 3 kuukautta)`,
    de: n => `Aktuelle Aktivität: ${n} Dokumente (letzte 3 Monate)`,
    fr: n => `Activité récente : ${n} documents (3 derniers mois)`,
    es: n => `Actividad reciente: ${n} documentos (últimos 3 meses)`,
    nl: n => `Recente activiteit: ${n} documenten (afgelopen 3 maanden)`,
    ar: n => `النشاط الأخير: ${n} وثيقة (آخر 3 أشهر)`,
    he: n => `פעילות אחרונה: ${n} מסמכים (3 חודשים אחרונים)`,
    ja: n => `最近の活動: ${n}件（過去3ヶ月）`,
    ko: n => `최근 활동: ${n}건 (지난 3개월)`,
    zh: n => `近期活动: ${n}份文件（最近3个月）`,
  },
  activePropositions: {
    en: n => `Active propositions: ${n}`,
    sv: n => `Aktiva propositioner: ${n}`,
    da: n => `Aktive forslag: ${n}`,
    no: n => `Aktive proposisjoner: ${n}`,
    fi: n => `Aktiiviset esitykset: ${n}`,
    de: n => `Aktive Vorlagen: ${n}`,
    fr: n => `Propositions actives : ${n}`,
    es: n => `Proposiciones activas: ${n}`,
    nl: n => `Actieve voorstellen: ${n}`,
    ar: n => `الاقتراحات النشطة: ${n}`,
    he: n => `הצעות פעילות: ${n}`,
    ja: n => `審議中の議案: ${n}件`,
    ko: n => `활성 의안: ${n}건`,
    zh: n => `活跃议案: ${n}`,
  },
  totalPipeline: {
    en: n => `Total legislative pipeline: ${n}`,
    sv: n => `Totalt lagstiftningspipeline: ${n}`,
    da: n => `Samlet lovgivningspipeline: ${n}`,
    no: n => `Total lovgivningspipeline: ${n}`,
    fi: n => `Koko lainsäädäntöputki: ${n}`,
    de: n => `Gesamte Gesetzgebungspipeline: ${n}`,
    fr: n => `Pipeline législatif total : ${n}`,
    es: n => `Pipeline legislativo total: ${n}`,
    nl: n => `Totale wetgevingspijplijn: ${n}`,
    ar: n => `إجمالي خط الأنابيب التشريعي: ${n}`,
    he: n => `צינור חקיקה כולל: ${n}`,
    ja: n => `立法パイプライン合計: ${n}件`,
    ko: n => `전체 입법 파이프라인: ${n}건`,
    zh: n => `立法管道总计: ${n}`,
  },
};

/** Scope branch — n-argument formatters (national scope, EU count) */
const SCOPE_FNS: Record<'nationalScope' | 'euInternational', Partial<Record<Language, (n: number) => string>>> = {
  nationalScope: {
    en: n => `National scope: ${n} parliamentary documents`,
    sv: n => `Nationell räckvidd: ${n} riksdagsdokument`,
    da: n => `Nationalt omfang: ${n} parlamentsdokumenter`,
    no: n => `Nasjonal rekkevidde: ${n} parlamentsdokumenter`,
    fi: n => `Kansallinen laajuus: ${n} parlamenttiasiakirjaa`,
    de: n => `Nationaler Geltungsbereich: ${n} Parlamentsdokumente`,
    fr: n => `Portée nationale : ${n} documents parlementaires`,
    es: n => `Alcance nacional: ${n} documentos parlamentarios`,
    nl: n => `Nationaal bereik: ${n} parlementaire documenten`,
    ar: n => `النطاق الوطني: ${n} وثيقة برلمانية`,
    he: n => `היקף לאומי: ${n} מסמכים פרלמנטריים`,
    ja: n => `国内範囲: 議会文書${n}件`,
    ko: n => `국가 범위: 의회 문서 ${n}건`,
    zh: n => `国家范围: ${n}份议会文件`,
  },
  euInternational: {
    en: n => `EU / international: ${n} documents`,
    sv: n => `EU / internationell: ${n} dokument`,
    da: n => `EU / international: ${n} dokumenter`,
    no: n => `EU / internasjonal: ${n} dokumenter`,
    fi: n => `EU / kansainvälinen: ${n} asiakirjaa`,
    de: n => `EU / international: ${n} Dokumente`,
    fr: n => `UE / international : ${n} documents`,
    es: n => `UE / internacional: ${n} documentos`,
    nl: n => `EU / internationaal: ${n} documenten`,
    ar: n => `الاتحاد الأوروبي / دولي: ${n} وثيقة`,
    he: n => `האיחוד האירופי / בינלאומי: ${n} מסמכים`,
    ja: n => `EU/国際: ${n}件`,
    ko: n => `EU / 국제: ${n}건`,
    zh: n => `欧盟 / 国际: ${n}份`,
  },
};

/** Scope branch — plain string labels */
const SCOPE_STRINGS: Record<
  'committee' | 'nationalImpl' | 'euTransposition' | 'domesticReg' | 'parliamentaryCommittees' | 'sectorCompliance' | 'regionalVariation',
  Partial<Record<Language, string>>
> = {
  committee: {
    en: 'Committee', sv: 'Utskott', da: 'Udvalg', no: 'Komité', fi: 'Valiokunta',
    de: 'Ausschuss', fr: 'Commission', es: 'Comité', nl: 'Commissie',
    ar: 'لجنة', he: 'ועדה', ja: '委員会', ko: '위원회', zh: '委员会',
  },
  nationalImpl: {
    en: 'National implementation', sv: 'Nationellt genomförande', da: 'National implementering', no: 'Nasjonal gjennomføring',
    fi: 'Kansallinen täytäntöönpano', de: 'Nationale Umsetzung', fr: 'Mise en œuvre nationale', es: 'Implementación nacional',
    nl: 'Nationale implementatie', ar: 'التنفيذ الوطني', he: 'יישום לאומי', ja: '国内実施', ko: '국내 이행', zh: '国家实施',
  },
  euTransposition: {
    en: 'EU transposition', sv: 'EU-transposition', da: 'EU-transposition', no: 'EU-transposisjon',
    fi: 'EU-täytäntöönpano', de: 'EU-Umsetzung', fr: 'Transposition UE', es: 'Transposición UE',
    nl: 'EU-omzetting', ar: 'نقل تشريعات الاتحاد الأوروبي', he: 'יישום חקיקת האיחוד האירופי', ja: 'EU指令の国内法化', ko: 'EU 입법 전환', zh: '欧盟指令转化',
  },
  domesticReg: {
    en: 'Domestic regulation', sv: 'Inhemsk reglering', da: 'Indenlandsk regulering', no: 'Innenlandsk regulering',
    fi: 'Kotimainen sääntely', de: 'Inländische Regulierung', fr: 'Réglementation nationale', es: 'Regulación nacional',
    nl: 'Binnenlandse regulering', ar: 'اللوائح المحلية', he: 'רגולציה מקומית', ja: '国内規制', ko: '국내 규제', zh: '国内监管',
  },
  parliamentaryCommittees: {
    en: 'Parliamentary committees', sv: 'Riksdagsutskott', da: 'Parlamentariske udvalg', no: 'Parlamentariske komiteer',
    fi: 'Valiokunnat', de: 'Parlamentarische Ausschüsse', fr: 'Commissions parlementaires', es: 'Comisiones parlamentarias',
    nl: 'Parlementaire commissies', ar: 'اللجان البرلمانية', he: 'ועדות הפרלמנט', ja: '議会委員会', ko: '의회 위원회', zh: '议会委员会',
  },
  sectorCompliance: {
    en: 'Sector-wide compliance', sv: 'Sektorsövergripande efterlevnad', da: 'Sektoromspændende overholdelse', no: 'Sektoromfattende overholdelse',
    fi: 'Koko sektorin vaatimustenmukaisuus', de: 'Branchenweite Compliance', fr: 'Conformité sectorielle', es: 'Cumplimiento sectorial',
    nl: 'Sectorale naleving', ar: 'الامتثال على مستوى القطاع', he: 'ציות ברמת הסקטור', ja: '業界全体のコンプライアンス', ko: '섹터 전반 준수', zh: '行业合规',
  },
  regionalVariation: {
    en: 'Regional variation', sv: 'Regional variation', da: 'Regional variation', no: 'Regional variasjon',
    fi: 'Alueellinen vaihtelu', de: 'Regionale Variation', fr: 'Variation régionale', es: 'Variación regional',
    nl: 'Regionale variatie', ar: 'تباين إقليمي', he: 'שינויים אזוריים', ja: '地域的差異', ko: '지역적 변이', zh: '地区差异',
  },
};

/** Motivation branch — single-string-argument formatters */
const MOTIVATION_FNS1: Record<'policyObjective' | 'advanceAgenda' | 'scrutinise', Partial<Record<Language, (t: string) => string>>> = {
  policyObjective: {
    en: t => `Policy objective: ${t}`,
    sv: t => `Politiskt mål: ${t}`,
    da: t => `Politisk målsætning: ${t}`,
    no: t => `Politisk målsetting: ${t}`,
    fi: t => `Poliittinen tavoite: ${t}`,
    de: t => `Politisches Ziel: ${t}`,
    fr: t => `Objectif politique : ${t}`,
    es: t => `Objetivo político: ${t}`,
    nl: t => `Beleidsdoelstelling: ${t}`,
    ar: t => `الهدف السياسي: ${t}`,
    he: t => `מטרת מדיניות: ${t}`,
    ja: t => `政策目標: ${t}`,
    ko: t => `정책 목표: ${t}`,
    zh: t => `政策目标: ${t}`,
  },
  advanceAgenda: {
    en: t => `Advance ${t} agenda`,
    sv: t => `Driva ${t}-agendan`,
    da: t => `Fremme ${t}-dagsorden`,
    no: t => `Fremme ${t}-agenda`,
    fi: t => `Edistää ${t}-agendaa`,
    de: t => `${t}-Agenda vorantreiben`,
    fr: t => `Faire avancer l'agenda ${t}`,
    es: t => `Avanzar la agenda de ${t}`,
    nl: t => `${t}-agenda bevorderen`,
    ar: t => `تعزيز أجندة ${t}`,
    he: t => `קידום אג'נדת ${t}`,
    ja: t => `${t}アジェンダの推進`,
    ko: t => `${t} 의제 추진`,
    zh: t => `推进${t}议程`,
  },
  scrutinise: {
    en: t => `Scrutinise ${t} implementation`,
    sv: t => `Granska ${t}-genomförande`,
    da: t => `Granske ${t}-implementering`,
    no: t => `Granske ${t}-implementering`,
    fi: t => `Tarkastella ${t}:n täytäntöönpanoa`,
    de: t => `${t}-Umsetzung prüfen`,
    fr: t => `Examiner la mise en œuvre de ${t}`,
    es: t => `Examinar la implementación de ${t}`,
    nl: t => `Implementatie van ${t} controleren`,
    ar: t => `التدقيق في تنفيذ ${t}`,
    he: t => `בחינת יישום ${t}`,
    ja: t => `${t}の実施を精査`,
    ko: t => `${t} 이행 검토`,
    zh: t => `审查${t}的实施`,
  },
};

/** Motivation branch — two-string-argument formatters */
const MOTIVATION_FNS2: Record<'addressedAreas', Partial<Record<Language, (t: string, d: string) => string>>> = {
  addressedAreas: {
    en: (t, d) => `Addressed areas: ${d || t}`,
    sv: (t, d) => `Berörda områden: ${d || t}`,
    da: (t, d) => `Behandlede områder: ${d || t}`,
    no: (t, d) => `Berørte områder: ${d || t}`,
    fi: (t, d) => `Käsitellyt alueet: ${d || t}`,
    de: (t, d) => `Adressierte Bereiche: ${d || t}`,
    fr: (t, d) => `Domaines traités : ${d || t}`,
    es: (t, d) => `Áreas abordadas: ${d || t}`,
    nl: (t, d) => `Behandelde gebieden: ${d || t}`,
    ar: (t, d) => `المجالات المعالجة: ${d || t}`,
    he: (t, d) => `תחומים שטופלו: ${d || t}`,
    ja: (t, d) => `対象分野: ${d || t}`,
    ko: (t, d) => `다루는 분야: ${d || t}`,
    zh: (t, d) => `涉及领域: ${d || t}`,
  },
};

/** Motivation branch — plain string labels */
const MOTIVATION_STRINGS: Record<
  'euCommitments' | 'constituentConcerns' | 'operationalCompliance' | 'sectorInvestment',
  Partial<Record<Language, string>>
> = {
  euCommitments: {
    en: 'Meet EU / international commitments', sv: 'Uppfylla EU- / internationella åtaganden',
    da: 'Opfylde EU-/internationale forpligtelser', no: 'Oppfylle EU-/internasjonale forpliktelser',
    fi: 'Täyttää EU- / kansainväliset sitoumukset', de: 'EU-/internationale Verpflichtungen erfüllen',
    fr: 'Respecter les engagements UE/internationaux', es: 'Cumplir compromisos UE/internacionales',
    nl: 'EU-/internationale verplichtingen nakomen', ar: 'الوفاء بالالتزامات الأوروبية / الدولية',
    he: 'עמידה בהתחייבויות האיחוד האירופי / הבינלאומי', ja: 'EU/国際コミットメントの履行', ko: 'EU/국제 공약 이행', zh: '履行欧盟/国际承诺',
  },
  constituentConcerns: {
    en: 'Represent constituent concerns', sv: 'Representera väljares intressen',
    da: 'Repræsentere vælgernes interesser', no: 'Representere velgernes interesser',
    fi: 'Edustaa äänestäjien huolia', de: 'Wählerinteressen vertreten',
    fr: 'Représenter les préoccupations des électeurs', es: 'Representar las preocupaciones de los electores',
    nl: 'Kiezersbelangen vertegenwoordigen', ar: 'تمثيل مخاوف الناخبين',
    he: 'ייצוג חששות הבוחרים', ja: '有権者の懸念を代表', ko: '유권자 우려 대변', zh: '代表选民关切',
  },
  operationalCompliance: {
    en: 'Operational compliance', sv: 'Operativ efterlevnad', da: 'Operationel overholdelse', no: 'Operasjonell overholdelse',
    fi: 'Operatiivinen vaatimustenmukaisuus', de: 'Operative Compliance', fr: 'Conformité opérationnelle', es: 'Cumplimiento operacional',
    nl: 'Operationele naleving', ar: 'الامتثال التشغيلي', he: 'ציות תפעולי', ja: '業務上のコンプライアンス', ko: '운영 준수', zh: '运营合规',
  },
  sectorInvestment: {
    en: 'Sector investment planning', sv: 'Sektorinvesteringsplanering', da: 'Sektorinvesteringsplanlægning', no: 'Sektorinvesteringsplanlegging',
    fi: 'Sektorin investointisuunnittelu', de: 'Sektorinvestitionsplanung', fr: 'Planification des investissements sectoriels', es: 'Planificación de inversión sectorial',
    nl: 'Sectorinvesteringsplanning', ar: 'تخطيط الاستثمار القطاعي', he: 'תכנון השקעות סקטוריאלי', ja: '業界投資計画', ko: '섹터 투자 계획', zh: '行业投资规划',
  },
};

/** Localized sub-branch labels for the Timeline branch */
const TIMELINE_SUBBRANCH_LABELS: Record<string, Partial<Record<Language, string>>> = {
  implementationPlanning: {
    en: 'Implementation planning', sv: 'Genomförandeplanering', da: 'Implementeringsplanlægning', no: 'Implementeringsplanlegging',
    fi: 'Toteutuksen suunnittelu', de: 'Implementierungsplanung', fr: 'Planification de la mise en œuvre', es: 'Planificación de implementación',
    nl: 'Implementatieplanning', ar: 'تخطيط التنفيذ', he: 'תכנון יישום', ja: '実施計画', ko: '이행 계획', zh: '实施规划',
  },
  resourceAllocation: {
    en: 'Resource allocation', sv: 'Resursallokering', da: 'Ressourceallokering', no: 'Ressursallokering',
    fi: 'Resurssien kohdentaminen', de: 'Ressourcenallokation', fr: 'Allocation des ressources', es: 'Asignación de recursos',
    nl: 'Resourceallocatie', ar: 'تخصيص الموارد', he: 'הקצאת משאבים', ja: 'リソース配分', ko: '자원 배분', zh: '资源分配',
  },
  amendmentWindow: {
    en: 'Amendment window', sv: 'Ändringstillfälle', da: 'Ændringsvindue', no: 'Endringsvindu',
    fi: 'Muutosikkuna', de: 'Änderungszeitraum', fr: 'Fenêtre d\'amendement', es: 'Ventana de enmienda',
    nl: 'Wijzigingsvenster', ar: 'نافذة التعديل', he: 'חלון תיקונים', ja: '修正期間', ko: '개정 기간', zh: '修正窗口',
  },
  scrutinyDeadlines: {
    en: 'Scrutiny deadlines', sv: 'Granskningsdeadlines', da: 'Kontrolfrister', no: 'Granskningstidsfrister',
    fi: 'Tarkastusmääräajat', de: 'Prüfungsfristen', fr: 'Délais d\'examen', es: 'Plazos de escrutinio',
    nl: 'Controletijdlijnen', ar: 'مواعيد التدقيق', he: 'מועדי ביקורת', ja: '審査期限', ko: '심의 기한', zh: '审查期限',
  },
  complianceTimeline: {
    en: 'Compliance timeline', sv: 'Efterlevnadstidsplan', da: 'Efterlevelsestidsplan', no: 'Overholdelsesfrist',
    fi: 'Vaatimustenmukaisuuden aikataulu', de: 'Compliance-Zeitplan', fr: 'Calendrier de conformité', es: 'Cronograma de cumplimiento',
    nl: 'Nalevingstijdlijn', ar: 'الجدول الزمني للامتثال', he: 'לוח זמנים לציות', ja: 'コンプライアンススケジュール', ko: '준수 일정', zh: '合规时间线',
  },
  adaptationPeriod: {
    en: 'Adaptation period', sv: 'Anpassningsperiod', da: 'Tilpasningsperiode', no: 'Tilpasningsperiode',
    fi: 'Sopeutumisaika', de: 'Anpassungszeitraum', fr: 'Période d\'adaptation', es: 'Período de adaptación',
    nl: 'Aanpassingsperiode', ar: 'فترة التكيف', he: 'תקופת הסתגלות', ja: '適応期間', ko: '적응 기간', zh: '适应期',
  },
};

const THESIS_TEMPLATES: Partial<Record<Language, (topic: string, count: number, domains: string) => string>> = {
  en: (t, n, d) => `Parliamentary analysis of ${t} encompasses ${n} document${n !== 1 ? 's' : ''} spanning ${d}, reflecting active legislative engagement across power, impact, and scope dimensions.`,
  sv: (t, n, d) => `Riksdagsanalys av ${t} omfattar ${n} dokument inom ${d}, vilket speglar aktivt lagstiftningsengagemang.`,
  da: (t, n, d) => `Parlamentarisk analyse af ${t} dækker ${n} dokument${n !== 1 ? 'er' : ''} inden for ${d}.`,
  no: (t, n, d) => `Parlamentarisk analyse av ${t} dekker ${n} dokument${n !== 1 ? 'er' : ''} innen ${d}.`,
  fi: (t, n, d) => `Parlamentaarinen analyysi aiheesta ${t} kattaa ${n} asiakirja${n !== 1 ? 'a' : 'n'} alueella ${d}.`,
  de: (t, n, d) => `Parlamentarische Analyse zu ${t} umfasst ${n} Dokument${n !== 1 ? 'e' : ''} in den Bereichen ${d}.`,
  fr: (t, n, d) => `L'analyse parlementaire de ${t} couvre ${n} document${n !== 1 ? 's' : ''} dans les domaines ${d}.`,
  es: (t, n, d) => `El análisis parlamentario de ${t} abarca ${n} documento${n !== 1 ? 's' : ''} en los ámbitos ${d}.`,
  nl: (t, n, d) => `Parlementaire analyse van ${t} omvat ${n} document${n !== 1 ? 'en' : ''} over ${d}.`,
  ar: (t, n, _d) => `التحليل البرلماني لـ${t} يشمل ${n} وثيقة.`,
  he: (t, n, _d) => `הניתוח הפרלמנטרי של ${t} כולל ${n} מסמכים.`,
  ja: (t, n, d) => `${t}に関する議会分析は${d}にわたる${n}件の文書を包含しています。`,
  ko: (t, n, d) => `${t}에 대한 의회 분석은 ${d}에 걸쳐 ${n}개의 문서를 포함합니다.`,
  zh: (t, n, d) => `关于${t}的议会分析涵盖${d}领域的${n}份文件。`,
};

const CONNECTION_LABELS: Record<string, Partial<Record<Language, string>>> = {
  powerImpact: {
    en: 'Power holders shape impact', sv: 'Maktinnehavare formar påverkan', da: 'Magtindehavere former indvirkning',
    no: 'Maktinnehavere former innvirkning', fi: 'Vallanpitäjät muovaavat vaikutusta',
    de: 'Machtinhaber gestalten Wirkung', fr: 'Les détenteurs du pouvoir façonnent l\'impact',
    es: 'Los titulares del poder dan forma al impacto', nl: 'Machthebbers vormen impact',
    ar: 'أصحاب السلطة يشكلون التأثير', he: 'בעלי הכוח מעצבים את ההשפעה', ja: '権力保有者が影響を形成', ko: '권력 보유자가 영향을 형성', zh: '权力持有者塑造影响',
  },
  timelineScope: {
    en: 'Timeline shapes institutional reach', sv: 'Tidslinje formar institutionell räckvidd', da: 'Tidslinje former institutionel rækkevidde',
    no: 'Tidslinje former institusjonell rekkevidde', fi: 'Aikajana muokkaa institutionaalista ulottuvuutta',
    de: 'Zeitplan prägt institutionelle Reichweite', fr: 'Le calendrier façonne la portée institutionnelle',
    es: 'El cronograma da forma al alcance institucional', nl: 'Tijdlijn vormt institutioneel bereik',
    ar: 'الجدول الزمني يشكل النطاق المؤسسي', he: 'ציר הזמן מעצב את ההיקף המוסדי', ja: 'タイムラインが制度的範囲を形成', ko: '타임라인이 제도적 범위를 형성', zh: '时间线塑造制度影响范围',
  },
  impactMotivation: {
    en: 'Policy outcomes drive stakeholder motivation', sv: 'Politiska utfall driver intressentmotivation',
    da: 'Politiske resultater driver interessentmotivation', no: 'Politiske resultater driver interessentmotivasjon',
    fi: 'Politiikan tulokset ohjaavat sidosryhmien motivaatiota', de: 'Politikergebnisse treiben Stakeholder-Motivation an',
    fr: 'Les résultats politiques motivent les parties prenantes', es: 'Los resultados políticos impulsan la motivación',
    nl: 'Beleidsresultaten drijven stakeholdermotivatie aan', ar: 'النتائج السياسية تدفع دوافع أصحاب المصلحة',
    he: 'תוצאות המדיניות מניעות את מוטיבציית בעלי העניין', ja: '政策成果が利害関係者の動機を促進', ko: '정책 결과가 이해관계자 동기 유발', zh: '政策结果推动利益相关者动机',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function l(lang: Language | string, map: Partial<Record<Language, string>>): string {
  return map[lang as Language] ?? map.en ?? '';
}

/** Typed helper: call a (number → string) formatter for a given language */
function lfN(lang: Language | string, map: Partial<Record<Language, (n: number) => string>>, n: number): string {
  const fn = map[lang as Language] ?? map.en;
  return fn ? fn(n) : '';
}

/** Typed helper: call a (string → string) formatter for a given language */
function lfS(lang: Language | string, map: Partial<Record<Language, (t: string) => string>>, t: string): string {
  const fn = map[lang as Language] ?? map.en;
  return fn ? fn(t) : '';
}

/** Typed helper: call a (string, string → string) formatter for a given language */
function lfSS(lang: Language | string, map: Partial<Record<Language, (t: string, d: string) => string>>, t: string, d: string): string {
  const fn = map[lang as Language] ?? map.en;
  return fn ? fn(t, d) : '';
}

function getDocTitle(d: RawDocument): string {
  return (d.titel || d.title || d.rubrik || d.dokumentnamn || d.dok_id || '').slice(0, 60);
}

function classify(count: number): AIMindmapItem['weight'] {
  if (count >= 5) return 'critical';
  if (count >= 3) return 'significant';
  if (count >= 1) return 'moderate';
  return 'minor';
}

/** Classify domain item weight by rank (0 = most important) */
function classifyByRank(rank: number): AIMindmapItem['weight'] {
  if (rank === 0) return 'critical';
  if (rank < 3) return 'significant';
  return 'moderate';
}

function docCount(n: number, lang: Language | string): string {
  const fn = DOC_COUNT_FORMATTERS[lang as Language] ?? DOC_COUNT_FORMATTERS.en!;
  return `${n} ${fn(n)}`;
}

// ---------------------------------------------------------------------------
// Branch builders
// ---------------------------------------------------------------------------

function buildPowerBranch(
  docs: RawDocument[],
  lang: Language | string,
): MindmapBranch {
  // Single-pass classification using Sets for O(n) performance
  const GOV_TYPES = new Set(['prop', 'skr', 'pressm']);
  const OPP_TYPES = new Set(['bet', 'mot']);

  const govDocs: RawDocument[]   = [];
  const oppDocs: RawDocument[]   = [];
  const otherDocs: RawDocument[] = [];

  for (const d of docs) {
    const typ = d.doktyp || d.documentType || '';
    if (GOV_TYPES.has(typ)) govDocs.push(d);
    else if (OPP_TYPES.has(typ)) oppDocs.push(d);
    else otherDocs.push(d);
  }

  const aiItems: AIMindmapItem[] = [
    {
      text: `${l(lang, STAKEHOLDER_LABELS.gov)}: ${docCount(govDocs.length, lang)}`,
      weight: classify(govDocs.length),
    },
    {
      text: `${l(lang, STAKEHOLDER_LABELS.opp)}: ${docCount(oppDocs.length, lang)}`,
      weight: classify(oppDocs.length),
    },
  ];
  if (otherDocs.length > 0) {
    aiItems.push({
      text: `${l(lang, STAKEHOLDER_LABELS.other)}: ${docCount(otherDocs.length, lang)}`,
      weight: classify(otherDocs.length),
    });
  }

  const subBranches: SubBranch[] = [
    {
      label: l(lang, STAKEHOLDER_LABELS.gov),
      items: govDocs.slice(0, 2).map(d => getDocTitle(d)).filter(Boolean),
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.opp),
      items: oppDocs.slice(0, 2).map(d => getDocTitle(d)).filter(Boolean),
    },
  ].filter(sb => sb.items && sb.items.length > 0);

  return {
    label: l(lang, DIMENSION_LABELS.power),
    color: 'cyan',
    icon: '🏛️',
    dimension: 'power',
    aiItems,
    subBranches,
  };
}

function buildImpactBranch(
  domainList: string[],
  lang: Language | string,
): MindmapBranch {
  const aiItems: AIMindmapItem[] = domainList.slice(0, 5).map((domain, i) => ({
    text: domain,
    weight: classifyByRank(i),
  }));

  if (aiItems.length === 0) {
    aiItems.push({ text: l(lang, FALLBACK_IMPACT_LABELS), weight: 'moderate' });
  }

  const subBranches: SubBranch[] = [
    {
      label: l(lang, STAKEHOLDER_LABELS.gov),
      items: domainList.slice(0, 2),
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.opp),
      items: domainList.slice(1, 3),
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.civil),
      items: domainList.slice(0, 2),
    },
  ].filter(sb => sb.items && sb.items.length > 0);

  return {
    label: l(lang, DIMENSION_LABELS.impact),
    color: 'red',
    icon: '⚡',
    dimension: 'impact',
    aiItems,
    subBranches,
  };
}

function buildTimelineBranch(
  docs: RawDocument[],
  lang: Language | string,
): MindmapBranch {
  const recentDocs = docs.filter(d => {
    if (!d.datum) return false;
    const date = new Date(d.datum);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);
    return date >= cutoff;
  });

  const propDocs = docs.filter(d => ['prop'].includes(d.doktyp || d.documentType || ''));
  const urgencyWeight: AIMindmapItem['weight'] =
    recentDocs.length > 5 ? 'critical' :
    recentDocs.length > 2 ? 'significant' :
    recentDocs.length > 0 ? 'moderate' : 'minor';

  const aiItems: AIMindmapItem[] = [
    { text: lfN(lang, TIMELINE_LABELS.recentActivity, recentDocs.length), weight: urgencyWeight },
    { text: lfN(lang, TIMELINE_LABELS.activePropositions, propDocs.length), weight: classify(propDocs.length) },
    { text: lfN(lang, TIMELINE_LABELS.totalPipeline, docs.length), weight: classify(docs.length) },
  ];

  const subBranches: SubBranch[] = [
    {
      label: l(lang, STAKEHOLDER_LABELS.gov),
      items: [
        l(lang, TIMELINE_SUBBRANCH_LABELS.implementationPlanning),
        l(lang, TIMELINE_SUBBRANCH_LABELS.resourceAllocation),
      ],
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.opp),
      items: [
        l(lang, TIMELINE_SUBBRANCH_LABELS.amendmentWindow),
        l(lang, TIMELINE_SUBBRANCH_LABELS.scrutinyDeadlines),
      ],
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.civil),
      items: [
        l(lang, TIMELINE_SUBBRANCH_LABELS.complianceTimeline),
        l(lang, TIMELINE_SUBBRANCH_LABELS.adaptationPeriod),
      ],
    },
  ];

  return {
    label: l(lang, DIMENSION_LABELS.timeline),
    color: 'yellow',
    icon: '⏱️',
    dimension: 'timeline',
    aiItems,
    subBranches,
  };
}

function buildScopeBranch(
  intlDocs: RawDocument[],
  docs: RawDocument[],
  lang: Language | string,
): MindmapBranch {
  const committees = [...new Set(docs.map(d => d.organ || d.committee || '').filter(Boolean))].slice(0, 3);
  const hasEU = intlDocs.length > 0;

  const aiItems: AIMindmapItem[] = [
    {
      text: lfN(lang, SCOPE_FNS.nationalScope, docs.length),
      weight: classify(docs.length),
    },
  ];
  if (hasEU) {
    aiItems.push({
      text: lfN(lang, SCOPE_FNS.euInternational, intlDocs.length),
      weight: classify(intlDocs.length),
    });
  }
  const committeeLabel = l(lang, SCOPE_STRINGS.committee);
  committees.forEach((c, i) => {
    aiItems.push({ text: `${committeeLabel}: ${c}`, weight: i === 0 ? 'significant' : 'moderate' });
  });

  const subBranches: SubBranch[] = [
    {
      label: l(lang, STAKEHOLDER_LABELS.gov),
      items: [
        l(lang, SCOPE_STRINGS.nationalImpl),
        hasEU
          ? l(lang, SCOPE_STRINGS.euTransposition)
          : l(lang, SCOPE_STRINGS.domesticReg),
      ].filter(Boolean),
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.opp),
      items: committees.length > 0
        ? committees
        : [l(lang, SCOPE_STRINGS.parliamentaryCommittees)],
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.civil),
      items: [
        l(lang, SCOPE_STRINGS.sectorCompliance),
        l(lang, SCOPE_STRINGS.regionalVariation),
      ],
    },
  ].filter(sb => sb.items && sb.items.length > 0);

  return {
    label: l(lang, DIMENSION_LABELS.scope),
    color: 'blue',
    icon: '🌍',
    dimension: 'scope',
    aiItems,
    subBranches,
  };
}

function buildMotivationBranch(
  docs: RawDocument[],
  topic: string | null,
  domainList: string[],
  lang: Language | string,
): MindmapBranch {
  const topicStr = topic || l(lang, THESIS_FALLBACK_LABELS.topic);
  const keyTitles = docs.slice(0, 3).map(d => getDocTitle(d)).filter(Boolean);
  const domainsStr = domainList.slice(0, 2).join(', ');

  const aiItems: AIMindmapItem[] = [
    {
      text: lfS(lang, MOTIVATION_FNS1.policyObjective, topicStr),
      weight: 'critical',
    },
    {
      text: lfSS(lang, MOTIVATION_FNS2.addressedAreas, topicStr, domainsStr),
      weight: 'significant',
    },
    ...keyTitles.map((t): AIMindmapItem => ({ text: t, weight: 'moderate' })),
  ];

  const subBranches: SubBranch[] = [
    {
      label: l(lang, STAKEHOLDER_LABELS.gov),
      items: [
        lfS(lang, MOTIVATION_FNS1.advanceAgenda, topicStr),
        l(lang, MOTIVATION_STRINGS.euCommitments),
      ],
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.opp),
      items: [
        lfS(lang, MOTIVATION_FNS1.scrutinise, topicStr),
        l(lang, MOTIVATION_STRINGS.constituentConcerns),
      ],
    },
    {
      label: l(lang, STAKEHOLDER_LABELS.civil),
      items: [
        l(lang, MOTIVATION_STRINGS.operationalCompliance),
        l(lang, MOTIVATION_STRINGS.sectorInvestment),
      ],
    },
  ];

  return {
    label: l(lang, DIMENSION_LABELS.motivation),
    color: 'green',
    icon: '💡',
    dimension: 'motivation',
    aiItems,
    subBranches,
  };
}

// ---------------------------------------------------------------------------
// Connection builder
// ---------------------------------------------------------------------------

function buildConnections(branches: MindmapBranch[], lang: Language | string): MindmapConnection[] {
  const labelOf = (dim: string): string => {
    const branch = branches.find(b => b.dimension === dim);
    return branch?.label ?? dim;
  };

  return [
    {
      fromBranch: labelOf('power'),
      toBranch:   labelOf('impact'),
      relationship: l(lang, CONNECTION_LABELS.powerImpact),
    },
    {
      fromBranch: labelOf('timeline'),
      toBranch:   labelOf('scope'),
      relationship: l(lang, CONNECTION_LABELS.timelineScope),
    },
    {
      fromBranch: labelOf('impact'),
      toBranch:   labelOf('motivation'),
      relationship: l(lang, CONNECTION_LABELS.impactMotivation),
    },
  ].filter(c => c.fromBranch && c.toBranch);
}

// ---------------------------------------------------------------------------
// Central thesis builder
// ---------------------------------------------------------------------------

function buildCentralThesis(
  docs: RawDocument[],
  topic: string | null,
  domainList: string[],
  lang: Language | string,
): string {
  const count = docs.length;
  const topicStr = topic || l(lang, THESIS_FALLBACK_LABELS.topic);
  const domainsStr = domainList.slice(0, 3).join(', ') || l(lang, THESIS_FALLBACK_LABELS.domains);

  const templateFn = THESIS_TEMPLATES[lang as Language] ?? THESIS_TEMPLATES.en!;
  return templateFn(topicStr, count, domainsStr);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build an AI-driven mindmap analysis from a set of parliamentary documents.
 *
 * Produces a structured `AIMindmapAnalysis` with five political dimension
 * branches, stakeholder sub-branches, AI-weighted items, cross-branch
 * connections, and a synthesized central thesis statement.
 *
 * @example
 * ```ts
 * const analysis = buildAIMindmapAnalysis(docs, 'Cybersecurity Policy', 'en');
 * const opts = buildMindmapOptionsFromAnalysis(analysis, 'en');
 * const section = generateMindmapSection(opts);
 * ```
 */
export function buildAIMindmapAnalysis(
  docs: RawDocument[],
  topic: string | null,
  lang: Language | string,
  precomputedDomains?: string[],
): AIMindmapAnalysis {
  // Use pre-computed domains when provided (avoids duplicate iteration by caller)
  let domainList: string[];
  if (precomputedDomains) {
    domainList = precomputedDomains.slice(0, 6);
  } else {
    const allDomains = new Set<string>();
    docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
    domainList = [...allDomains].slice(0, 6);
  }

  // Classify EU / international documents
  const intlDocs = docs.filter(d => ['fpm', 'eu'].includes(d.doktyp || d.documentType || ''));

  // Build the five dimension branches
  const branches: MindmapBranch[] = [
    buildPowerBranch(docs, lang),
    buildImpactBranch(domainList, lang),
    buildTimelineBranch(docs, lang),
    buildScopeBranch(intlDocs, docs, lang),
    buildMotivationBranch(docs, topic, domainList, lang),
  ];

  // Build cross-branch connections
  const connections = buildConnections(branches, lang);

  // Synthesize central thesis
  const centralThesis = buildCentralThesis(docs, topic, domainList, lang);

  // Confidence score: data richness proxy
  const confidenceScore = Math.min(
    1,
    (Math.min(docs.length, 10) / 10) * 0.6 + (Math.min(domainList.length, 6) / 6) * 0.4,
  );

  return { centralThesis, branches, connections, confidenceScore };
}

/**
 * Convert an `AIMindmapAnalysis` to `MindmapSectionOptions` for rendering.
 *
 * @param analysis - Output from `buildAIMindmapAnalysis`
 * @param lang - Target language for section labels
 * @param topic - Central topic text for the mindmap root node
 * @param overrides - Optional overrides for title, summary, etc.
 */
export function buildMindmapOptionsFromAnalysis(
  analysis: AIMindmapAnalysis,
  lang: Language | string,
  topic: string,
  overrides?: Partial<Pick<MindmapSectionOptions, 'title' | 'summary'>>,
): MindmapSectionOptions {
  return {
    topic,
    branches: analysis.branches,
    lang,
    centralThesis: analysis.centralThesis,
    connections: analysis.connections,
    ...overrides,
  };
}
