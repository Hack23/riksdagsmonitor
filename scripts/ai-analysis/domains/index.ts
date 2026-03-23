/**
 * @module ai-analysis/domains
 * @description Policy assessment, watch-point, and EU/Nordic comparative
 *   analysis builders extracted from the monolithic analysis pipeline.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import type { RawDocument } from '../../data-transformers/types.js';
import {
  detectPolicyDomains,
  detectNarrativeFrames,
  assessConfidenceLevel,
  DOMAIN_NAME_TO_KEY,
  type DomainKey,
} from '../../data-transformers/policy-analysis.js';
import {
  type LangRecord,
  docType,
  docTitle,
  docId,
  isSfsDoc,
  isMetadataEnriched,
  hasFullTextContent,
} from '../helpers.js';
import type {
  AnalysisDepth,
  AnalysisWatchPoint,
  PolicyAssessment,
} from '../types.js';

// ---------------------------------------------------------------------------
// Watch point labels (14 languages)
// ---------------------------------------------------------------------------

/** "Active Government Propositions" */
const WP_ACTIVE_PROPS: LangRecord = {
  en: 'Active Government Propositions', sv: 'Aktiva propositioner',
  da: 'Aktive regeringsforslag', no: 'Aktive regjeringsproposisjoner',
  fi: 'Aktiiviset hallituksen esitykset', de: 'Aktive Regierungsvorschläge',
  fr: 'Propositions gouvernementales actives', es: 'Proposiciones gubernamentales activas',
  nl: 'Actieve regeringsvoorstellen', ar: 'مقترحات حكومية نشطة',
  he: 'הצעות ממשלה פעילות', ja: '活動中の政府提案', ko: '활성 정부 제안', zh: '活跃的政府提案',
};

/** "proposition(s) require parliamentary action" */
const WP_PROPS_DESC: Partial<Record<Language, (n: number) => string>> = {
  en: (n) => `${n} proposition${n !== 1 ? 's' : ''} ${n === 1 ? 'requires' : 'require'} parliamentary action`,
  sv: (n) => `${n} proposition${n !== 1 ? 'er' : ''} kräver parlamentarisk behandling`,
  da: (n) => `${n} forslag kræver parlamentarisk behandling`,
  no: (n) => `${n} proposisjon${n !== 1 ? 'er' : ''} krever parlamentarisk behandling`,
  fi: (n) => `${n} esitys${n !== 1 ? 'tä' : ''} vaatii parlamentaarista käsittelyä`,
  de: (n) => `${n} Regierungsvorlage${n !== 1 ? 'n' : ''} ${n === 1 ? 'erfordert' : 'erfordern'} parlamentarische Bearbeitung`,
  fr: (n) => `${n} proposition${n !== 1 ? 's' : ''} ${n === 1 ? 'nécessite' : 'nécessitent'} un examen parlementaire`,
  es: (n) => `${n} proposición${n !== 1 ? 'es' : ''} ${n === 1 ? 'requiere' : 'requieren'} acción parlamentaria`,
  nl: (n) => `${n} voorstel${n !== 1 ? 'len' : ''} ${n === 1 ? 'vereist' : 'vereisen'} parlementaire behandeling`,
  ar: (n) => `${n} مقترح${n !== 1 ? 'ات' : ''} ${n === 1 ? 'يتطلب' : 'تتطلب'} إجراء برلمانيا`,
  he: (n) => `${n} הצעות דורשות טיפול פרלמנטרי`,
  ja: (n) => `${n}件の提案が国会審議を必要とする`,
  ko: (n) => `${n}건의 제안이 의회 심의를 필요로 함`,
  zh: (n) => `${n}项提案需要议会审议`,
};

/** "Committee Reports to Monitor" */
const WP_COMMITTEE: LangRecord = {
  en: 'Committee Reports to Monitor', sv: 'Utskottsbetänkanden att följa',
  da: 'Udvalgsrapporter at følge', no: 'Komitérapporter å følge',
  fi: 'Seurattavat valiokuntamietinnöt', de: 'Zu beobachtende Ausschussberichte',
  fr: 'Rapports de commission à suivre', es: 'Informes de comisión a seguir',
  nl: 'Commissierapporten om te volgen', ar: 'تقارير اللجان للمتابعة',
  he: 'דוחות ועדות למעקב', ja: '監視すべき委員会報告', ko: '모니터링할 위원회 보고서', zh: '需要关注的委员会报告',
};

/** "committee report(s) shaping the parliamentary position" */
const WP_COMMITTEE_DESC: Partial<Record<Language, (n: number) => string>> = {
  en: (n) => `${n} committee report${n !== 1 ? 's' : ''} shaping the parliamentary position`,
  sv: (n) => `${n} betänkande${n !== 1 ? 'n' : ''} formar den parlamentariska ståndpunkten`,
  da: (n) => `${n} udvalgsrapport${n !== 1 ? 'er' : ''} former den parlamentariske holdning`,
  no: (n) => `${n} komitérapport${n !== 1 ? 'er' : ''} former den parlamentariske posisjonen`,
  fi: (n) => `${n} mietintö${n !== 1 ? 'ä' : ''} muokkaa parlamentaarista kantaa`,
  de: (n) => `${n} Ausschussbericht${n !== 1 ? 'e' : ''} ${n === 1 ? 'prägt' : 'prägen'} die parlamentarische Position`,
  fr: (n) => `${n} rapport${n !== 1 ? 's' : ''} de commission ${n === 1 ? 'façonne' : 'façonnent'} la position parlementaire`,
  es: (n) => `${n} informe${n !== 1 ? 's' : ''} de comisión ${n === 1 ? 'moldea' : 'moldean'} la posición parlamentaria`,
  nl: (n) => `${n} commissierapport${n !== 1 ? 'en' : ''} ${n === 1 ? 'vormt' : 'vormen'} de parlementaire positie`,
  ar: (n) => `${n} تقرير${n !== 1 ? 'ات' : ''} لجان تشكل الموقف البرلماني`,
  he: (n) => `${n} דוחות ועדות מעצבים את עמדת הפרלמנט`,
  ja: (n) => `${n}件の委員会報告が議会の立場を形成`,
  ko: (n) => `${n}건의 위원회 보고서가 의회 입장을 형성`,
  zh: (n) => `${n}份委员会报告正在塑造议会立场`,
};

/** "Enacted Laws in Force" */
const WP_SFS: LangRecord = {
  en: 'Enacted Laws in Force', sv: 'Antagna lagar i kraft',
  da: 'Vedtagne love i kraft', no: 'Vedtatte lover i kraft',
  fi: 'Voimassa olevat lait', de: 'Erlassene Gesetze in Kraft',
  fr: 'Lois promulguées en vigueur', es: 'Leyes promulgadas en vigor',
  nl: 'Uitgevaardigde wetten van kracht', ar: 'قوانين صادرة سارية المفعول',
  he: 'חוקים שנחקקו בתוקף', ja: '施行中の制定法', ko: '시행 중인 법률', zh: '已生效的法律',
};

/** "enacted law(s) establish the legal framework — stakeholders must conduct compliance review" */
const WP_SFS_DESC: Partial<Record<Language, (n: number) => string>> = {
  en: (n) => `${n} enacted law${n !== 1 ? 's' : ''} ${n === 1 ? 'establishes' : 'establish'} the legal framework — stakeholders must conduct compliance review`,
  sv: (n) => `${n} lag/förordning${n !== 1 ? 'ar' : ''} etablerar rättslig ram — intressenter behöver genomföra efterlevnadsgranskning`,
  da: (n) => `${n} lov${n !== 1 ? 'e' : ''} etablerer den juridiske ramme — interessenter skal foretage overholdelsesvurdering`,
  no: (n) => `${n} lov${n !== 1 ? 'er' : ''} etablerer det juridiske rammeverket — interessenter må gjennomføre samsvarsvurdering`,
  fi: (n) => `${n} laki${n !== 1 ? 'a' : ''} muodostaa oikeudellisen kehyksen — sidosryhmien on suoritettava vaatimustenmukaisuustarkistus`,
  de: (n) => n === 1
    ? `${n} Gesetz bildet den Rechtsrahmen — Stakeholder müssen Compliance-Prüfung durchführen`
    : `${n} Gesetze bilden den Rechtsrahmen — Stakeholder müssen Compliance-Prüfung durchführen`,
  fr: (n) => `${n} loi${n !== 1 ? 's' : ''} ${n === 1 ? 'établit' : 'établissent'} le cadre juridique — les parties prenantes doivent procéder à un examen de conformité`,
  es: (n) => `${n} ley${n !== 1 ? 'es' : ''} ${n === 1 ? 'establece' : 'establecen'} el marco legal — las partes interesadas deben realizar una revisión de cumplimiento`,
  nl: (n) => `${n} wet${n !== 1 ? 'ten' : ''} ${n === 1 ? 'vormt' : 'vormen'} het juridische kader — belanghebbenden moeten een nalevingsonderzoek uitvoeren`,
  ar: (n) => `${n} ${n === 1 ? 'قانون يؤسس' : 'قوانين تؤسس'} الإطار القانوني — يجب على أصحاب المصلحة إجراء مراجعة الامتثال`,
  he: (n) => `${n} חוקים מבססים את המסגרת המשפטית — בעלי עניין חייבים לבצע בדיקת ציות`,
  ja: (n) => `${n}件の制定法が法的枠組みを確立 — 利害関係者はコンプライアンスレビューを実施すべき`,
  ko: (n) => `${n}건의 법률이 법적 프레임워크를 수립 — 이해관계자는 컴플라이언스 검토를 수행해야 함`,
  zh: (n) => `${n}项法律确立了法律框架 — 利益相关者必须进行合规审查`,
};

/** "Opposition Motions to Track" */
const WP_MOTIONS: LangRecord = {
  en: 'Opposition Motions to Track', sv: 'Oppositionsmotioner att bevaka',
  da: 'Oppositionsforslag at følge', no: 'Opposisjonsmotioner å følge',
  fi: 'Seurattavat oppositioaloitteet', de: 'Oppositionsanträge zu verfolgen',
  fr: 'Motions de l\'opposition à suivre', es: 'Mociones de la oposición a seguir',
  nl: 'Oppositiemoties om te volgen', ar: 'مقترحات المعارضة للمتابعة',
  he: 'הצעות אופוזיציה למעקב', ja: '追跡すべき野党動議', ko: '추적할 야당 동의', zh: '需要跟踪的反对派动议',
};

/** "motion(s) signal alternative policy directions" */
const WP_MOTIONS_DESC: Partial<Record<Language, (n: number) => string>> = {
  en: (n) => `${n} motion${n !== 1 ? 's' : ''} ${n === 1 ? 'signals' : 'signal'} alternative policy directions`,
  sv: (n) => `${n} motion${n !== 1 ? 'er' : ''} signalerar alternativa politiska inriktningar`,
  da: (n) => `${n} forslag signalerer alternative politiske retninger`,
  no: (n) => `${n} motjon${n !== 1 ? 'er' : ''} signaliserer alternative politiske retninger`,
  fi: (n) => `${n} aloite${n !== 1 ? 'tta' : ''} viestii vaihtoehtoisista politiikan suunnista`,
  de: (n) => `${n} ${n !== 1 ? 'Anträge signalisieren' : 'Antrag signalisiert'} alternative Politikrichtungen`,
  fr: (n) => `${n} motion${n !== 1 ? 's' : ''} ${n === 1 ? 'signale' : 'signalent'} des orientations politiques alternatives`,
  es: (n) => `${n} moción${n !== 1 ? 'es' : ''} ${n === 1 ? 'señala' : 'señalan'} direcciones políticas alternativas`,
  nl: (n) => `${n} motie${n !== 1 ? 's' : ''} ${n === 1 ? 'signaleert' : 'signaleren'} alternatieve beleidsrichtingen`,
  ar: (n) => `${n} مقترح${n !== 1 ? 'ات' : ''} تشير إلى اتجاهات سياسية بديلة`,
  he: (n) => `${n} הצעות מסמנות כיווני מדיניות חלופיים`,
  ja: (n) => `${n}件の動議が代替政策の方向性を示唆`,
  ko: (n) => `${n}건의 동의가 대안적 정책 방향을 시사`,
  zh: (n) => `${n}项动议显示替代政策方向`,
};

/** "EU Dimension" */
const WP_EU: LangRecord = {
  en: 'EU Dimension', sv: 'EU-dimension',
  da: 'EU-dimension', no: 'EU-dimensjon',
  fi: 'EU-ulottuvuus', de: 'EU-Dimension',
  fr: 'Dimension UE', es: 'Dimensión UE',
  nl: 'EU-dimensie', ar: 'البعد الأوروبي',
  he: 'ממד אירופי', ja: 'EU次元', ko: 'EU 차원', zh: 'EU维度',
};

/** "EU position paper(s) reveal European dimension — EU law may constrain national policy options" */
const WP_EU_DESC: Partial<Record<Language, (n: number) => string>> = {
  en: (n) => `${n} EU position paper${n !== 1 ? 's' : ''} ${n === 1 ? 'reveals' : 'reveal'} European dimension — EU law may constrain national policy options`,
  sv: (n) => `${n} EU-faktapromemoria avslöjar Europaperspektiv — EU-regelverket kan begränsa nationell handlingsfrihet`,
  da: (n) => `${n} EU-positionspapir${n !== 1 ? 'er' : ''} afslører europæisk dimension — EU-lovgivning kan begrænse nationale politiske muligheder`,
  no: (n) => `${n} EU-posisjonspapir${n !== 1 ? 'er' : ''} avslører europeisk dimensjon — EU-lovgivning kan begrense nasjonale politiske alternativer`,
  fi: (n) => `${n} EU-asiakirja${n !== 1 ? 'a' : ''} paljastaa eurooppalaisen ulottuvuuden — EU-lainsäädäntö voi rajoittaa kansallisia vaihtoehtoja`,
  de: (n) => `${n} EU-Positionspapier${n !== 1 ? 'e' : ''} ${n === 1 ? 'zeigt' : 'zeigen'} die europäische Dimension — EU-Recht kann nationale Politikoptionen einschränken`,
  fr: (n) => `${n} document${n !== 1 ? 's' : ''} de position UE ${n === 1 ? 'révèle' : 'révèlent'} la dimension européenne — le droit de l'UE peut limiter les options nationales`,
  es: (n) => `${n} documento${n !== 1 ? 's' : ''} de posición de la UE ${n === 1 ? 'revela' : 'revelan'} la dimensión europea — la legislación de la UE puede limitar las opciones nacionales`,
  nl: (n) => `${n} EU-positiedocument${n !== 1 ? 'en' : ''} ${n === 1 ? 'onthult' : 'onthullen'} de Europese dimensie — EU-wetgeving kan nationale beleidsopties beperken`,
  ar: (n) => `${n} ${n === 1 ? 'وثيقة موقف أوروبي تكشف' : 'وثائق موقف أوروبي تكشف'} البعد الأوروبي — قد يقيد قانون الاتحاد الأوروبي خيارات السياسة الوطنية`,
  he: (n) => `${n} מסמכי עמדה של האיחוד האירופי חושפים את הממד האירופי — חוק האיחוד עשוי להגביל אפשרויות מדיניות לאומיות`,
  ja: (n) => `${n}件のEU意見書が欧州次元を明示 — EU法が国内政策の選択肢を制約する可能性`,
  ko: (n) => `${n}건의 EU 입장 문서가 유럽 차원을 드러냄 — EU법이 국내 정책 옵션을 제한할 수 있음`,
  zh: (n) => `${n}份EU立场文件揭示欧洲维度 — EU法律可能限制国内政策选择`,
};

/** "Interpellations — Ministerial Accountability" */
const WP_IP: LangRecord = {
  en: 'Interpellations — Ministerial Accountability', sv: 'Interpellationer — Ministeransvar',
  da: 'Interpellationer — Ministeransvar', no: 'Interpellasjoner — Ministeransvar',
  fi: 'Interpellaatiot — Ministerivastuu', de: 'Interpellationen — Ministerielle Verantwortung',
  fr: 'Interpellations — Responsabilité ministérielle', es: 'Interpelaciones — Responsabilidad ministerial',
  nl: 'Interpellaties — Ministeriële verantwoordelijkheid', ar: 'استجوابات — المساءلة الوزارية',
  he: 'אינטרפלציות — אחריות שרים', ja: '質問主意書 — 大臣の説明責任', ko: '대정부질문 — 장관 책임', zh: '质询 — 部长问责',
};

/** "interpellation(s) signal opposition scrutiny of ministerial performance" */
const WP_IP_DESC: Partial<Record<Language, (n: number) => string>> = {
  en: (n) => `${n} interpellation${n !== 1 ? 's' : ''} ${n === 1 ? 'signals' : 'signal'} opposition scrutiny of ministerial performance — direct accountability pressure on government`,
  sv: (n) => `${n} interpellation${n !== 1 ? 'er' : ''} signalerar oppositionens granskning av ministrarnas arbete — direkt ansvarsutkrävande gentemot regeringen`,
  da: (n) => `${n} interpellation${n !== 1 ? 'er' : ''} signalerer oppositions granskning af ministeriel præstation`,
  no: (n) => `${n} interpellasjon${n !== 1 ? 'er' : ''} signaliserer opposisjonens granskning av ministeriell ytelse`,
  fi: (n) => `${n} välikysymys${n !== 1 ? 'tä' : ''} viestii opposition valvonnasta ministerien suorituskyvyn suhteen`,
  de: (n) => `${n} Interpellation${n !== 1 ? 'en' : ''} ${n === 1 ? 'signalisiert' : 'signalisieren'} die oppositionelle Kontrolle der ministeriellen Leistung`,
  fr: (n) => `${n} interpellation${n !== 1 ? 's' : ''} ${n === 1 ? 'signale' : 'signalent'} l'examen de l'opposition sur la performance ministérielle`,
  es: (n) => `${n} interpelación${n !== 1 ? 'es' : ''} ${n === 1 ? 'señala' : 'señalan'} el escrutinio de la oposición sobre el desempeño ministerial`,
  nl: (n) => `${n} interpellatie${n !== 1 ? 's' : ''} ${n === 1 ? 'signaleert' : 'signaleren'} oppositietoezicht op ministeriële prestaties`,
  ar: (n) => `${n} استجواب${n !== 1 ? 'ات' : ''} تشير إلى رقابة المعارضة على الأداء الوزاري`,
  he: (n) => `${n} אינטרפלציות מסמנות ביקורת אופוזיציה על ביצועי השרים`,
  ja: (n) => `${n}件の質問主意書が大臣の業績に対する野党の監視を示唆`,
  ko: (n) => `${n}건의 대정부질문이 장관 성과에 대한 야당 감시를 시사`,
  zh: (n) => `${n}项质询显示反对派对部长绩效的监督`,
};

/** "Narrative Frames to Monitor" */
const WP_NARRATIVE: LangRecord = {
  en: 'Narrative Frames to Monitor', sv: 'Narrativa ramar att övervaka',
  da: 'Narrative rammer at overvåge', no: 'Narrative rammer å overvåke',
  fi: 'Seurattavat narratiiviset kehykset', de: 'Zu beobachtende narrative Rahmen',
  fr: 'Cadres narratifs à surveiller', es: 'Marcos narrativos a supervisar',
  nl: 'Narratieve kaders om te monitoren', ar: 'الأطر السردية للمراقبة',
  he: 'מסגרות נרטיביות למעקב', ja: '監視すべきナラティブフレーム', ko: '모니터링할 서사 프레임', zh: '需要监控的叙事框架',
};

/** "Political rhetorical frames identified: " */
const WP_NARRATIVE_DESC: LangRecord = {
  en: 'Political rhetorical frames identified: ', sv: 'Politiska retoriska ramar identifierade: ',
  da: 'Politiske retoriske rammer identificeret: ', no: 'Politiske retoriske rammer identifisert: ',
  fi: 'Poliittisia retorisia kehyksiä tunnistettu: ', de: 'Politische rhetorische Rahmen identifiziert: ',
  fr: 'Cadres rhétoriques politiques identifiés : ', es: 'Marcos retóricos políticos identificados: ',
  nl: 'Politieke retorische kaders geïdentificeerd: ', ar: 'تم تحديد أطر بلاغية سياسية: ',
  he: 'מסגרות רטוריות פוליטיות שזוהו: ', ja: '政治的修辞フレーム特定: ', ko: '정치적 수사 프레임 확인: ', zh: '已识别的政治修辞框架: ',
};

export const DASHBOARD_DOCS_ANALYSED: Partial<Record<Language, (n: number) => string>> = {
  en: (n) => `${n} parliamentary document${n !== 1 ? 's' : ''} analysed`,
  sv: (n) => `${n} riksdagsdokument ${n !== 1 ? 'analyserade' : 'analyserat'}`,
  da: (n) => `${n} parlamentsdokument${n !== 1 ? 'er' : ''} analyseret`,
  no: (n) => `${n} parlamentsdokument${n !== 1 ? 'er' : ''} analysert`,
  fi: (n) => `${n} asiakirja${n !== 1 ? 'a' : ''} analysoitu`,
  de: (n) => `${n} parlamentarische${n === 1 ? 's' : ''} Dokument${n !== 1 ? 'e' : ''} analysiert`,
  fr: (n) => `${n} document${n !== 1 ? 's' : ''} parlementaire${n !== 1 ? 's' : ''} analysé${n !== 1 ? 's' : ''}`,
  es: (n) => `${n} documento${n !== 1 ? 's' : ''} parlamentario${n !== 1 ? 's' : ''} analizado${n !== 1 ? 's' : ''}`,
  nl: (n) => `${n} parlementair${n !== 1 ? 'e' : ''} document${n !== 1 ? 'en' : ''} geanalyseerd`,
  ar: (n) => `${n} وثيقة برلمانية تم تحليلها`,
  he: (n) => `${n} מסמכים פרלמנטריים נותחו`,
  ja: (n) => `${n}件の議会文書を分析`,
  ko: (n) => `${n}건의 의회 문서 분석됨`,
  zh: (n) => `${n}份议会文件已分析`,
};

// ---------------------------------------------------------------------------
// Policy narrative labels (14 languages)
// ---------------------------------------------------------------------------

const NARRATIVE_ANALYSIS_OF: LangRecord = {
  en: 'Analysis of', sv: 'Analys av',
  da: 'Analyse af', no: 'Analyse av',
  fi: 'Analyysi', de: 'Analyse von',
  fr: 'Analyse de', es: 'Análisis de',
  nl: 'Analyse van', ar: 'تحليل',
  he: 'ניתוח', ja: '分析:', ko: '분석:', zh: '分析',
};

const NARRATIVE_REVEALS: LangRecord = {
  en: 'reveals', sv: 'visar',
  da: 'afslører', no: 'avslører',
  fi: 'paljastaa', de: 'zeigt',
  fr: 'révèle', es: 'revela',
  nl: 'onthult', ar: 'يكشف',
  he: 'חושף', ja: 'が示す', ko: '이(가) 드러남', zh: '揭示',
};

const NARRATIVE_POLICY_ACTIVITY: LangRecord = {
  en: 'policy activity in', sv: 'politikaktivitet inom',
  da: 'politisk aktivitet i', no: 'politisk aktivitet innen',
  fi: 'poliittista toimintaa alueella', de: 'politische Aktivität in',
  fr: 'activité politique dans', es: 'actividad política en',
  nl: 'beleidsactiviteit in', ar: 'نشاط سياسي في',
  he: 'פעילות מדיניותית ב', ja: 'の政策活動', ko: '의 정책 활동', zh: '中的政策活动',
};

const NARRATIVE_PARLIAMENTARY_ACTIVITY: LangRecord = {
  en: 'parliamentary activity', sv: 'parlamentarisk aktivitet',
  da: 'parlamentarisk aktivitet', no: 'parlamentarisk aktivitet',
  fi: 'parlamentaarista toimintaa', de: 'parlamentarische Aktivität',
  fr: 'activité parlementaire', es: 'actividad parlamentaria',
  nl: 'parlementaire activiteit', ar: 'نشاط برلماني',
  he: 'פעילות פרלמנטרית', ja: '議会活動', ko: '의회 활동', zh: '议会活动',
};

const NARRATIVE_WITH_FULL_TEXT: Partial<Record<Language, (total: number, enriched: number) => string>> = {
  en: (t, e) => `${t} documents (${e} with enriched full text)`,
  sv: (t, e) => `${t} dokument (${e} med berikad fulltext)`,
  da: (t, e) => `${t} dokumenter (${e} med beriget fuldtekst)`,
  no: (t, e) => `${t} dokumenter (${e} med beriket fulltekst)`,
  fi: (t, e) => `${t} asiakirjaa (${e} rikastetulla kokotekstillä)`,
  de: (t, e) => `${t} Dokumente (${e} mit angereichertem Volltext)`,
  fr: (t, e) => `${t} documents (${e} avec texte intégral enrichi)`,
  es: (t, e) => `${t} documentos (${e} con texto completo enriquecido)`,
  nl: (t, e) => `${t} documenten (${e} met verrijkte volledige tekst)`,
  ar: (t, e) => `${t} وثيقة (${e} بنص كامل مُثرى)`,
  he: (t, e) => `${t} מסמכים (${e} עם טקסט מלא מועשר)`,
  ja: (t, e) => `${t}件の文書 (${e}件はフルテキスト充実)`,
  ko: (t, e) => `${t}건의 문서 (${e}건 전문 보강)`,
  zh: (t, e) => `${t}份文件 (${e}份含完整文本)`,
};

const NARRATIVE_WITH_METADATA: Partial<Record<Language, (total: number, enriched: number) => string>> = {
  en: (t, e) => `${t} documents (${e} with enriched metadata)`,
  sv: (t, e) => `${t} dokument (${e} med berikad metadata)`,
  da: (t, e) => `${t} dokumenter (${e} med beriget metadata)`,
  no: (t, e) => `${t} dokumenter (${e} med beriket metadata)`,
  fi: (t, e) => `${t} asiakirjaa (${e} rikastetulla metatiedolla)`,
  de: (t, e) => `${t} Dokumente (${e} mit angereicherten Metadaten)`,
  fr: (t, e) => `${t} documents (${e} avec métadonnées enrichies)`,
  es: (t, e) => `${t} documentos (${e} con metadatos enriquecidos)`,
  nl: (t, e) => `${t} documenten (${e} met verrijkte metadata)`,
  ar: (t, e) => `${t} وثيقة (${e} ببيانات وصفية مُثرية)`,
  he: (t, e) => `${t} מסמכים (${e} עם מטא-נתונים מועשרים)`,
  ja: (t, e) => `${t}件の文書 (${e}件はメタデータ充実)`,
  ko: (t, e) => `${t}건의 문서 (${e}건 메타데이터 보강)`,
  zh: (t, e) => `${t}份文件 (${e}份含丰富元数据)`,
};

const NARRATIVE_FOCUS: LangRecord = {
  en: 'with focus on', sv: 'med fokus på',
  da: 'med fokus på', no: 'med fokus på',
  fi: 'painopisteenä', de: 'mit Fokus auf',
  fr: 'avec un accent sur', es: 'con enfoque en',
  nl: 'met focus op', ar: 'مع التركيز على',
  he: 'עם דגש על', ja: 'に焦点を当てて', ko: '에 초점을 맞추어', zh: '重点关注',
};

// ---------------------------------------------------------------------------
// EU/Nordic comparative dimension — enriches policy narratives for deep depth
// ---------------------------------------------------------------------------

/**
 * Domain-level EU directive and Nordic parliament cross-references.
 * Maps policy domains to relevant EU/Nordic context for comparative framing.
 *
 * Currently provides translations for `en` and `sv` only.  For other languages
 * the comparative suffix is intentionally omitted (buildEuNordicComparative
 * returns null) rather than falling back to English, to avoid mixed-language
 * output.  Additional language variants can be added here as needed.
 */
const EU_NORDIC_CONTEXT: Partial<Record<DomainKey, Partial<Record<Language, string>>>> = {
  fiscal: {
    en: 'In the EU context, fiscal policy aligns with the Stability and Growth Pact framework. Nordic peers (Denmark, Norway, Finland) pursue similar fiscal consolidation strategies.',
    sv: 'I EU-sammanhang ansluter finanspolitiken till stabilitets- och tillväxtpakten. Nordiska grannar (Danmark, Norge, Finland) bedriver liknande finanspolitisk konsolidering.',
  },
  defence: {
    en: 'Defence policy intersects with EU Common Security and Defence Policy (CSDP) and NATO commitments. Nordic neighbours Denmark, Norway, and Finland share similar defence posture adjustments.',
    sv: 'Försvarspolitiken korsar EU:s gemensamma säkerhets- och försvarspolitik (GSFP) och NATO-åtaganden. Nordiska grannar Danmark, Norge och Finland genomför liknande försvarsanpassningar.',
  },
  environment: {
    en: 'Environmental policy aligns with EU Green Deal targets and Fit for 55 legislative package. Nordic parliaments in Denmark, Norway, and Finland pursue comparable climate legislation.',
    sv: 'Miljöpolitiken ansluter till EU:s gröna giv och Fit for 55-lagstiftningspaketet. Nordiska parlament i Danmark, Norge och Finland bedriver jämförbar klimatlagstiftning.',
  },
  education: {
    en: 'Education policy develops within the European Education Area framework. Nordic peers (Denmark, Norway, Finland) share similar education quality and equity goals.',
    sv: 'Utbildningspolitiken utvecklas inom det europeiska utbildningsområdets ramverk. Nordiska grannar (Danmark, Norge, Finland) delar liknande mål för utbildningskvalitet och jämlikhet.',
  },
  healthcare: {
    en: 'Healthcare policy intersects with EU Health Union initiatives and European Health Data Space. Nordic systems (Denmark, Norway, Finland) share universal coverage models.',
    sv: 'Hälso- och sjukvårdspolitiken korsar EU:s hälsounion och det europeiska hälsodataområdet. Nordiska system (Danmark, Norge, Finland) delar universella täckningsmodeller.',
  },
  migration: {
    en: 'Migration policy aligns with the EU Pact on Migration and Asylum. Nordic neighbours (Denmark, Norway, Finland) pursue coordinated border and asylum approaches.',
    sv: 'Migrationspolitiken ansluter till EU:s migrations- och asylpakt. Nordiska grannar (Danmark, Norge, Finland) bedriver samordnade gräns- och asylansatser.',
  },
  'eu-foreign': {
    en: 'EU foreign affairs policy connects to Common Foreign and Security Policy (CFSP). Nordic partners coordinate through Nordic Council and EU Council positions.',
    sv: 'EU:s utrikespolitik kopplar till den gemensamma utrikes- och säkerhetspolitiken (GUSP). Nordiska partners samordnar genom Nordiska rådet och EU-rådets positioner.',
  },
  justice: {
    en: 'Justice policy aligns with EU Area of Freedom, Security and Justice. Nordic cooperation through the Nordic Council ensures harmonised legal frameworks.',
    sv: 'Rättspolitiken ansluter till EU:s område för frihet, säkerhet och rättvisa. Nordiskt samarbete genom Nordiska rådet säkerställer harmoniserade rättsliga ramverk.',
  },
  labour: {
    en: 'Labour policy intersects with the European Pillar of Social Rights. Nordic labour markets (Denmark, Norway, Finland) share flexicurity model characteristics.',
    sv: 'Arbetsmarknadspolitiken korsar den europeiska pelaren för sociala rättigheter. Nordiska arbetsmarknader (Danmark, Norge, Finland) delar flexicurity-modellens egenskaper.',
  },
  housing: {
    en: 'Housing policy develops in the context of EU cohesion funding and Affordable Housing Initiative. Nordic peers face similar urbanisation and housing affordability challenges.',
    sv: 'Bostadspolitiken utvecklas i sammanhanget av EU:s sammanhållningsfonder och initiativet för överkomligt boende. Nordiska grannar möter liknande urbaniserings- och bostadskostnadsutmaningar.',
  },
  transport: {
    en: 'Transport policy aligns with TEN-T network and EU Sustainable and Smart Mobility Strategy. Nordic countries coordinate through Nordic Transport Ministers.',
    sv: 'Transportpolitiken ansluter till TEN-T-nätverket och EU:s strategi för hållbar och smart mobilitet. Nordiska länder samordnar genom nordiska transportministrar.',
  },
  trade: {
    en: 'Trade policy falls under EU common commercial policy. Nordic economies share open-trade orientations and similar exposure to global supply chain dynamics.',
    sv: 'Handelspolitiken faller under EU:s gemensamma handelspolitik. Nordiska ekonomier delar frihandelsorienteringar och liknande exponering mot globala leveranskedjedynamiker.',
  },
};

/**
 * Build an EU/Nordic comparative sentence for the first detected policy domains.
 * Domains are iterated in detection order (not ranked by frequency).
 * Returns null when no domain has a comparative entry for the requested
 * language — does not fall back to English to avoid mixed-language output.
 */
function buildEuNordicComparative(domains: string[], lang: Language): string | null {
  for (const domain of domains) {
    // Reverse-lookup from localised domain name to canonical key
    const key = DOMAIN_NAME_TO_KEY[domain] ?? DOMAIN_NAME_TO_KEY[domain.toLowerCase()];
    if (!key) continue;
    const entry = EU_NORDIC_CONTEXT[key];
    if (entry?.[lang]) {
      return entry[lang]!;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Policy assessment builder
// ---------------------------------------------------------------------------

export function buildPolicyAssessment(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
  depth: AnalysisDepth = 'quick',
): PolicyAssessment {
  const allDomains = new Set<string>();
  docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => allDomains.add(dom)));
  const domains = [...allDomains].slice(0, 8);
  const primaryDomain = domains[0] ?? null;

  const metadataEnrichedCount = docs.filter(isMetadataEnriched).length;
  const fullTextCount = docs.filter(hasFullTextContent).length;
  // Confidence baseline: 40 (raw metadata), 60 (metadata-enriched), 80 (full-text available)
  const baseConfidence = fullTextCount > 0 ? 80 : metadataEnrichedCount > 0 ? 60 : 40;
  const confidence = assessConfidenceLevel(docs.length, baseConfidence);

  // Build a narrative from available evidence — topic + primary domain + document count
  // Use "full text" wording only when fullTextCount > 0; fall back to "metadata" wording
  const docsLabelFn = DASHBOARD_DOCS_ANALYSED[lang] ?? DASHBOARD_DOCS_ANALYSED.en!;
  let evidenceDesc: string;
  if (fullTextCount > 0) {
    const fullTextFn = NARRATIVE_WITH_FULL_TEXT[lang] ?? NARRATIVE_WITH_FULL_TEXT.en!;
    evidenceDesc = fullTextFn(docs.length, fullTextCount);
  } else if (metadataEnrichedCount > 0) {
    const metadataFn = NARRATIVE_WITH_METADATA[lang] ?? NARRATIVE_WITH_METADATA.en!;
    evidenceDesc = metadataFn(docs.length, metadataEnrichedCount);
  } else {
    evidenceDesc = docsLabelFn(docs.length);
  }

  const analysisOf = NARRATIVE_ANALYSIS_OF[lang] ?? NARRATIVE_ANALYSIS_OF.en!;
  const reveals = NARRATIVE_REVEALS[lang] ?? NARRATIVE_REVEALS.en!;
  const policyActivity = NARRATIVE_POLICY_ACTIVITY[lang] ?? NARRATIVE_POLICY_ACTIVITY.en!;
  const parlActivity = NARRATIVE_PARLIAMENTARY_ACTIVITY[lang] ?? NARRATIVE_PARLIAMENTARY_ACTIVITY.en!;
  const focusLabel = NARRATIVE_FOCUS[lang] ?? NARRATIVE_FOCUS.en!;

  const domainList = domains.slice(0, 3).join(', ');
  const activityPhrase = domains.length > 0
    ? `${policyActivity} ${domainList}`
    : parlActivity;
  const topicPhrase = topic ? ` ${focusLabel} ${topic}` : '';
  let narrative = `${analysisOf} ${evidenceDesc} ${reveals} ${activityPhrase}${topicPhrase}.`;

  // EU/Nordic comparative dimension for deep analysis
  if (depth === 'deep' && domains.length > 0) {
    const euNordicSuffix = buildEuNordicComparative(domains.slice(0, 3), lang);
    if (euNordicSuffix) {
      narrative += ` ${euNordicSuffix}`;
    }
  }

  return { domains, primaryDomain, narrative, confidence };
}

// ---------------------------------------------------------------------------
// Watch point builder
// ---------------------------------------------------------------------------

export function buildWatchPoints(
  docs: RawDocument[],
  topic: string | null,
  lang: Language,
): AnalysisWatchPoint[] {
  const points: AnalysisWatchPoint[] = [];

  const propDocs = docs.filter(d => docType(d) === 'prop');
  const betDocs  = docs.filter(d => docType(d) === 'bet');
  const motDocs  = docs.filter(d => docType(d) === 'mot');
  const sfsDocs  = docs.filter(isSfsDoc);
  const euDocs   = docs.filter(d => docType(d) === 'fpm' || docType(d) === 'eu');

  const topicSuffix = topic ? ` (${topic})` : '';

  if (propDocs.length > 0) {
    const titles = propDocs.slice(0, 2).map(d => docTitle(d)).join('; ');
    const descFn = WP_PROPS_DESC[lang] ?? WP_PROPS_DESC.en!;
    points.push({
      title: `${WP_ACTIVE_PROPS[lang] ?? WP_ACTIVE_PROPS.en!}${topicSuffix}`,
      description: `${descFn(propDocs.length)}: ${titles}`,
      urgency: 'high',
      sourceDocIds: propDocs.map(docId).filter(Boolean),
    });
  }

  if (betDocs.length > 0) {
    const descFn = WP_COMMITTEE_DESC[lang] ?? WP_COMMITTEE_DESC.en!;
    // Heuristic: treat three or more committee reports as a critical-volume signal
    const betUrgency = betDocs.length >= 3 ? 'critical' as const : 'high' as const;
    points.push({
      title: `${WP_COMMITTEE[lang] ?? WP_COMMITTEE.en!}${topicSuffix}`,
      description: `${descFn(betDocs.length)}${topicSuffix}`,
      urgency: betUrgency,
      sourceDocIds: betDocs.map(docId).filter(Boolean),
    });
  }

  if (sfsDocs.length > 0) {
    const descFn = WP_SFS_DESC[lang] ?? WP_SFS_DESC.en!;
    points.push({
      title: `${WP_SFS[lang] ?? WP_SFS.en!}${topicSuffix}`,
      description: descFn(sfsDocs.length),
      urgency: 'critical',
      sourceDocIds: sfsDocs.map(docId).filter(Boolean),
    });
  }

  if (motDocs.length > 0) {
    const descFn = WP_MOTIONS_DESC[lang] ?? WP_MOTIONS_DESC.en!;
    points.push({
      title: `${WP_MOTIONS[lang] ?? WP_MOTIONS.en!}${topicSuffix}`,
      description: `${descFn(motDocs.length)}${topicSuffix}`,
      urgency: 'medium',
      sourceDocIds: motDocs.map(docId).filter(Boolean),
    });
  }

  if (euDocs.length > 0) {
    const descFn = WP_EU_DESC[lang] ?? WP_EU_DESC.en!;
    points.push({
      title: `${WP_EU[lang] ?? WP_EU.en!}${topicSuffix}`,
      description: descFn(euDocs.length),
      urgency: 'medium',
      sourceDocIds: euDocs.map(docId).filter(Boolean),
    });
  }

  // Interpellations — ministerial accountability pressure
  const ipDocs = docs.filter(d => docType(d) === 'ip');
  if (ipDocs.length > 0) {
    const descFn = WP_IP_DESC[lang] ?? WP_IP_DESC.en!;
    points.push({
      title: `${WP_IP[lang] ?? WP_IP.en!}${topicSuffix}`,
      description: descFn(ipDocs.length),
      urgency: ipDocs.length >= 5 ? 'high' : 'medium',
      sourceDocIds: ipDocs.map(docId).filter(Boolean),
    });
  }

  // Detect narrative frames for additional watch points
  const allFrames = new Set<string>();
  docs.slice(0, 10).forEach(d => detectNarrativeFrames(d).forEach(f => allFrames.add(f)));
  if (allFrames.size > 0) {
    const frameList = [...allFrames].slice(0, 3).join(', ');
    points.push({
      title: WP_NARRATIVE[lang] ?? WP_NARRATIVE.en!,
      description: `${WP_NARRATIVE_DESC[lang] ?? WP_NARRATIVE_DESC.en!}${frameList}`,
      urgency: 'low',
      sourceDocIds: [],
    });
  }

  return points;
}
