/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — 14-language localisation map
 *
 * @description
 * Provides per-language translations of the Reader Intelligence Guide
 * table chrome (heading, preamble, column headers) and per-entry
 * `label` / `readerValue` strings so that every rendered article
 * presents the guide in the article's own language rather than English
 * fallback.
 *
 * Shape mirrors {@link ../chrome-i18n.ts} — one record per supported
 * {@link Language}.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';

/**
 * Chrome strings for the Reader Intelligence Guide table — heading,
 * preamble paragraph, and column headers.
 */
export interface ReaderGuideChrome {
  readonly heading: string;
  readonly preamble: string;
  readonly colReaderNeed: string;
  readonly colWhatYouGet: string;
  readonly colSourceArtifact: string;
  /** Label for the per-document intelligence row. */
  readonly perDocLabel: string;
  readonly perDocValue: string;
  /** Label for the audit appendix pointer row. */
  readonly auditLabel: string;
  readonly auditValue: string;
}

/**
 * Per-entry i18n: maps each artifact file to translated `label` and
 * `readerValue` strings.
 */
export interface ReaderGuideEntryI18n {
  readonly label: string;
  readonly readerValue: string;
}

/**
 * Full i18n bundle for one language.
 */
export interface ReaderGuideI18nBundle {
  readonly chrome: ReaderGuideChrome;
  readonly entries: Readonly<Record<string, ReaderGuideEntryI18n>>;
}

// ── English (source of truth) ─────────────────────────────────────────────

const EN_CHROME: ReaderGuideChrome = {
  heading: 'Reader Intelligence Guide',
  preamble: 'Use this guide to read the article as a political-intelligence product rather than a raw artifact dump. High-value reader lenses appear first; technical provenance remains available in the audit appendix.',
  colReaderNeed: 'Reader need',
  colWhatYouGet: "What you'll get",
  colSourceArtifact: 'Source artifact',
  perDocLabel: 'Per-document intelligence',
  perDocValue: 'dok_id-level evidence, named actors, dates, and primary-source traceability',
  auditLabel: 'Audit appendix',
  auditValue: 'classification, cross-reference, methodology and manifest evidence for reviewers',
};

const EN_ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'BLUF and editorial decisions',
    readerValue: 'fast answer to what happened, why it matters, who is accountable, and the next dated trigger',
  },
  'intelligence-assessment.md': {
    label: 'Key Judgments',
    readerValue: 'confidence-bearing political-intelligence conclusions and collection gaps',
  },
  'significance-scoring.md': {
    label: 'Significance scoring',
    readerValue: 'why this story outranks or trails other same-day parliamentary signals',
  },
  'media-framing-analysis.md': {
    label: 'Media framing & influence operations',
    readerValue: 'frame packages with Entman functions, cognitive-vulnerability map, DISARM manipulation indicators, narrative-laundering chain, comparative-international cognates, frame lifecycle and half-life, RRPA impact, an Outlet Bias Audit (no outlet is neutral — every outlet declared with ownership, funding, board-appointment authority and editorial lean), and the L1–L5 counter-resilience ladder',
  },
  'forward-indicators.md': {
    label: 'Forward indicators',
    readerValue: 'dated watch items that let readers verify or falsify the assessment later',
  },
  'scenario-analysis.md': {
    label: 'Scenarios',
    readerValue: 'alternative outcomes with probabilities, triggers, and warning signs',
  },
  'risk-assessment.md': {
    label: 'Risk assessment',
    readerValue: 'policy, electoral, institutional, communications, and implementation risk register',
  },
};

// ── Swedish ───────────────────────────────────────────────────────────────

const SV_CHROME: ReaderGuideChrome = {
  heading: 'Läsarens underrättelseguide',
  preamble: 'Använd denna guide för att läsa artikeln som en politisk underrättelseprodukt snarare än en rå artefaktsamling. Högt värde för läsaren visas först; teknisk härkomst finns i revisionsappendixet.',
  colReaderNeed: 'Läsarbehov',
  colWhatYouGet: 'Vad du får',
  colSourceArtifact: 'Källartefakt',
  perDocLabel: 'Dokumentspecifik underrättelse',
  perDocValue: 'dok_id-nivå bevisning, namngivna aktörer, datum och primärkällspårbarhet',
  auditLabel: 'Revisionsappendix',
  auditValue: 'klassificering, korsreferens, metodik och manifestbevisning för granskare',
};

const SV_ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'BLUF och redaktionella beslut',
    readerValue: 'snabbt svar på vad som hände, varför det spelar roll, vem som är ansvarig och nästa daterade utlösare',
  },
  'intelligence-assessment.md': {
    label: 'Nyckelbedömningar',
    readerValue: 'konfidensgrundade politisk-underrättelse slutsatser och insamlingsgap',
  },
  'significance-scoring.md': {
    label: 'Betydelsepoängsättning',
    readerValue: 'varför denna nyhet rangordnas högre eller lägre än andra parlamentariska signaler samma dag',
  },
  'media-framing-analysis.md': {
    label: 'Mediegestaltning och påverkansoperationer',
    readerValue: 'gestaltningspaket med Entman-funktioner, kognitiv sårbarhetsanalys, DISARM-indikatorer och motståndskraftsstege L1–L5',
  },
  'forward-indicators.md': {
    label: 'Framåtblickande indikatorer',
    readerValue: 'daterade bevakningspunkter som låter läsare verifiera eller falsifiera bedömningen senare',
  },
  'scenario-analysis.md': {
    label: 'Scenarier',
    readerValue: 'alternativa utfall med sannolikheter, utlösare och varningssignaler',
  },
  'risk-assessment.md': {
    label: 'Riskbedömning',
    readerValue: 'policy-, val-, institutionell-, kommunikations- och implementeringsriskregister',
  },
};

// ── Danish ────────────────────────────────────────────────────────────────

const DA_CHROME: ReaderGuideChrome = {
  heading: 'Læserens efterretningsguide',
  preamble: 'Brug denne guide til at læse artiklen som et politisk efterretningsprodukt frem for en rå artefaktsamling. Højværdi-læserperspektiver vises først; teknisk oprindelse er tilgængelig i revisionsappendiksset.',
  colReaderNeed: 'Læserbehov',
  colWhatYouGet: 'Hvad du får',
  colSourceArtifact: 'Kildeartefakt',
  perDocLabel: 'Dokumentspecifik efterretning',
  perDocValue: 'dok_id-niveau bevismateriale, navngivne aktører, datoer og primærkildesporing',
  auditLabel: 'Revisionsappendiks',
  auditValue: 'klassifikation, krydsreference, metodik og manifest-bevismateriale til anmeldere',
};

const DA_ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'BLUF og redaktionelle beslutninger',
    readerValue: 'hurtigt svar på hvad der skete, hvorfor det betyder noget, hvem der er ansvarlig, og den næste daterede udløser',
  },
  'intelligence-assessment.md': {
    label: 'Nøglevurderinger',
    readerValue: 'konfidensbærende politisk-efterretningskonklusioner og indsamlingshuller',
  },
  'significance-scoring.md': {
    label: 'Betydelighedsscoring',
    readerValue: 'hvorfor denne historie rangerer højere eller lavere end andre parlamentariske signaler samme dag',
  },
  'media-framing-analysis.md': {
    label: 'Medieframing og påvirkningsoperationer',
    readerValue: 'framingpakker med Entman-funktioner, kognitivsårbarheds-kort og DISARM-indikatorer',
  },
  'forward-indicators.md': {
    label: 'Fremadrettede indikatorer',
    readerValue: 'daterede overvågningspunkter der lader læsere verificere eller falsificere vurderingen senere',
  },
  'scenario-analysis.md': {
    label: 'Scenarier',
    readerValue: 'alternative udfald med sandsynligheder, udløsere og advarselstegn',
  },
  'risk-assessment.md': {
    label: 'Risikovurdering',
    readerValue: 'politik-, valg-, institutionelt-, kommunikations- og implementeringsrisikoregister',
  },
};

// ── Norwegian ─────────────────────────────────────────────────────────────

const NO_CHROME: ReaderGuideChrome = {
  heading: 'Leserens etterretningsguide',
  preamble: 'Bruk denne guiden for å lese artikkelen som et politisk etterretningsprodukt i stedet for en rå artefaktsamling. Høyverdiperspektiver for leseren vises først; teknisk opprinnelse er tilgjengelig i revisjonsvedlegget.',
  colReaderNeed: 'Leserbehov',
  colWhatYouGet: 'Hva du får',
  colSourceArtifact: 'Kildeartefakt',
  perDocLabel: 'Dokumentspesifikk etterretning',
  perDocValue: 'dok_id-nivå bevis, navngitte aktører, datoer og primærkildesporing',
  auditLabel: 'Revisjonsvedlegg',
  auditValue: 'klassifisering, kryssreferanse, metodikk og manifest-bevis for anmeldere',
};

const NO_ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'BLUF og redaksjonelle beslutninger',
    readerValue: 'raskt svar på hva som skjedde, hvorfor det betyr noe, hvem som er ansvarlig og neste daterte utløser',
  },
  'intelligence-assessment.md': {
    label: 'Nøkkelvurderinger',
    readerValue: 'konfidensbærende politisk-etterretningskonklusjoner og innsamlingshull',
  },
  'significance-scoring.md': {
    label: 'Betydelighetsscoring',
    readerValue: 'hvorfor denne saken rangerer høyere eller lavere enn andre parlamentariske signaler samme dag',
  },
  'media-framing-analysis.md': {
    label: 'Medieframing og påvirkningsoperasjoner',
    readerValue: 'framingpakker med Entman-funksjoner, kognitivsårbarhets-kart og DISARM-indikatorer',
  },
  'forward-indicators.md': {
    label: 'Fremadrettede indikatorer',
    readerValue: 'daterte overvåkningspunkter som lar lesere verifisere eller falsifisere vurderingen senere',
  },
  'scenario-analysis.md': {
    label: 'Scenarier',
    readerValue: 'alternative utfall med sannsynligheter, utløsere og advarselstegn',
  },
  'risk-assessment.md': {
    label: 'Risikovurdering',
    readerValue: 'politikk-, valg-, institusjons-, kommunikasjons- og implementeringsrisikoregister',
  },
};

// ── Finnish ───────────────────────────────────────────────────────────────

const FI_CHROME: ReaderGuideChrome = {
  heading: 'Lukijan tiedusteluopas',
  preamble: 'Käytä tätä opasta lukeaksesi artikkelin poliittisena tiedustelutuotteena raa\'an artefaktikokoelman sijaan. Korkean arvon lukijanäkökulmat esitetään ensin; tekninen alkuperä on saatavilla tarkastusliitteessä.',
  colReaderNeed: 'Lukijan tarve',
  colWhatYouGet: 'Mitä saat',
  colSourceArtifact: 'Lähdeartefakti',
  perDocLabel: 'Dokumenttikohtainen tiedustelu',
  perDocValue: 'dok_id-tason todistusaineisto, nimetyt toimijat, päivämäärät ja alkuperäislähteen jäljitettävyys',
  auditLabel: 'Tarkastusliite',
  auditValue: 'luokitus, ristiviittaus, metodologia ja manifest-todistusaineisto tarkastajille',
};

const FI_ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'BLUF ja toimitukselliset päätökset',
    readerValue: 'nopea vastaus siihen mitä tapahtui, miksi sillä on väliä, kuka on vastuussa ja seuraava päivätty laukaisin',
  },
  'intelligence-assessment.md': {
    label: 'Keskeiset arviot',
    readerValue: 'luottamustasoon perustuvat poliittis-tiedustelulliset johtopäätökset ja tiedonkeruuaukot',
  },
  'significance-scoring.md': {
    label: 'Merkittävyyspisteytys',
    readerValue: 'miksi tämä juttu sijoittuu korkeammalle tai matalammalle kuin muut saman päivän parlamentaariset signaalit',
  },
  'media-framing-analysis.md': {
    label: 'Mediakehystys ja vaikutusoperaatiot',
    readerValue: 'kehyspaketit Entman-funktioilla, kognitiivisen haavoittuvuuden kartta ja DISARM-indikaattorit',
  },
  'forward-indicators.md': {
    label: 'Tulevaisuusindikaattorit',
    readerValue: 'päivätyt seurantakohteet, joiden avulla lukijat voivat myöhemmin todentaa tai kumota arvion',
  },
  'scenario-analysis.md': {
    label: 'Skenaariot',
    readerValue: 'vaihtoehtoiset lopputulokset todennäköisyyksineen, laukaisimineen ja varoitusmerkkeineen',
  },
  'risk-assessment.md': {
    label: 'Riskiarvio',
    readerValue: 'politiikka-, vaali-, institutionaalinen, viestintä- ja toimeenpanoriskien rekisteri',
  },
};

// ── German ────────────────────────────────────────────────────────────────

const DE_CHROME: ReaderGuideChrome = {
  heading: 'Nachrichtendienstlicher Leseleitfaden',
  preamble: 'Nutzen Sie diesen Leitfaden, um den Artikel als nachrichtendienstliches Produkt statt als rohe Artefaktsammlung zu lesen. Hochwertige Leseperspektiven erscheinen zuerst; technische Herkunft ist im Prüfungsanhang verfügbar.',
  colReaderNeed: 'Leserbedarf',
  colWhatYouGet: 'Was Sie erhalten',
  colSourceArtifact: 'Quellartefakt',
  perDocLabel: 'Dokumentspezifische Analyse',
  perDocValue: 'dok_id-Ebene Beweismaterial, benannte Akteure, Daten und Primärquellenrückverfolgbarkeit',
  auditLabel: 'Prüfungsanhang',
  auditValue: 'Klassifizierung, Querverweise, Methodik und Manifest-Beweismaterial für Prüfer',
};

const DE_ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'BLUF und redaktionelle Entscheidungen',
    readerValue: 'schnelle Antwort auf was geschah, warum es wichtig ist, wer verantwortlich ist und der nächste datierte Auslöser',
  },
  'intelligence-assessment.md': {
    label: 'Kernbewertungen',
    readerValue: 'konfidenzbasierte nachrichtendienstliche Schlussfolgerungen und Erfassungslücken',
  },
  'significance-scoring.md': {
    label: 'Bedeutungsbewertung',
    readerValue: 'warum diese Meldung höher oder niedriger eingestuft wird als andere parlamentarische Signale desselben Tages',
  },
  'media-framing-analysis.md': {
    label: 'Medienrahmung und Einflussoperationen',
    readerValue: 'Rahmungspakete mit Entman-Funktionen, kognitive Schwachstellenkarte und DISARM-Indikatoren',
  },
  'forward-indicators.md': {
    label: 'Vorausschauende Indikatoren',
    readerValue: 'datierte Beobachtungspunkte, mit denen Leser die Bewertung später verifizieren oder falsifizieren können',
  },
  'scenario-analysis.md': {
    label: 'Szenarien',
    readerValue: 'alternative Ergebnisse mit Wahrscheinlichkeiten, Auslösern und Warnsignalen',
  },
  'risk-assessment.md': {
    label: 'Risikobewertung',
    readerValue: 'Politik-, Wahl-, institutionelles, Kommunikations- und Umsetzungsrisikoregister',
  },
};

// ── French ────────────────────────────────────────────────────────────────

const FR_CHROME: ReaderGuideChrome = {
  heading: 'Guide de renseignement du lecteur',
  preamble: "Utilisez ce guide pour lire l'article comme un produit de renseignement politique plutôt qu'une collection brute d'artefacts. Les perspectives à haute valeur apparaissent en premier ; la provenance technique est disponible dans l'annexe d'audit.",
  colReaderNeed: 'Besoin du lecteur',
  colWhatYouGet: 'Ce que vous obtenez',
  colSourceArtifact: 'Artefact source',
  perDocLabel: 'Renseignement par document',
  perDocValue: "preuve au niveau dok_id, acteurs nommés, dates et traçabilité de la source primaire",
  auditLabel: "Annexe d'audit",
  auditValue: "classification, références croisées, méthodologie et preuve manifeste pour les réviseurs",
};

const FR_ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'BLUF et décisions éditoriales',
    readerValue: "réponse rapide sur ce qui s'est passé, pourquoi c'est important, qui est responsable et le prochain déclencheur daté",
  },
  'intelligence-assessment.md': {
    label: 'Jugements clés',
    readerValue: 'conclusions de renseignement politique avec niveau de confiance et lacunes de collecte',
  },
  'significance-scoring.md': {
    label: 'Score de significativité',
    readerValue: 'pourquoi cette information est classée plus haut ou plus bas que les autres signaux parlementaires du même jour',
  },
  'media-framing-analysis.md': {
    label: 'Cadrage médiatique et opérations d\'influence',
    readerValue: "paquets de cadrage avec fonctions Entman, carte de vulnérabilité cognitive et indicateurs DISARM",
  },
  'forward-indicators.md': {
    label: 'Indicateurs prospectifs',
    readerValue: "points de surveillance datés permettant aux lecteurs de vérifier ou falsifier l'évaluation ultérieurement",
  },
  'scenario-analysis.md': {
    label: 'Scénarios',
    readerValue: 'résultats alternatifs avec probabilités, déclencheurs et signaux d\'alerte',
  },
  'risk-assessment.md': {
    label: 'Évaluation des risques',
    readerValue: 'registre des risques politiques, électoraux, institutionnels, de communication et de mise en œuvre',
  },
};

// ── Spanish ───────────────────────────────────────────────────────────────

const ES_CHROME: ReaderGuideChrome = {
  heading: 'Guía de inteligencia del lector',
  preamble: 'Use esta guía para leer el artículo como un producto de inteligencia política en lugar de una colección bruta de artefactos. Las perspectivas de alto valor aparecen primero; la procedencia técnica está disponible en el apéndice de auditoría.',
  colReaderNeed: 'Necesidad del lector',
  colWhatYouGet: 'Lo que obtendrá',
  colSourceArtifact: 'Artefacto fuente',
  perDocLabel: 'Inteligencia por documento',
  perDocValue: 'evidencia a nivel de dok_id, actores nombrados, fechas y trazabilidad de fuente primaria',
  auditLabel: 'Apéndice de auditoría',
  auditValue: 'clasificación, referencias cruzadas, metodología y evidencia manifiesta para revisores',
};

const ES_ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'BLUF y decisiones editoriales',
    readerValue: 'respuesta rápida sobre qué sucedió, por qué importa, quién es responsable y el próximo disparador fechado',
  },
  'intelligence-assessment.md': {
    label: 'Juicios clave',
    readerValue: 'conclusiones de inteligencia política con nivel de confianza y brechas de recopilación',
  },
  'significance-scoring.md': {
    label: 'Puntuación de significancia',
    readerValue: 'por qué esta noticia se clasifica más alto o más bajo que otras señales parlamentarias del mismo día',
  },
  'media-framing-analysis.md': {
    label: 'Encuadre mediático y operaciones de influencia',
    readerValue: 'paquetes de encuadre con funciones Entman, mapa de vulnerabilidad cognitiva e indicadores DISARM',
  },
  'forward-indicators.md': {
    label: 'Indicadores prospectivos',
    readerValue: 'puntos de vigilancia fechados que permiten a los lectores verificar o falsificar la evaluación posteriormente',
  },
  'scenario-analysis.md': {
    label: 'Escenarios',
    readerValue: 'resultados alternativos con probabilidades, disparadores y señales de advertencia',
  },
  'risk-assessment.md': {
    label: 'Evaluación de riesgos',
    readerValue: 'registro de riesgos de política, electorales, institucionales, de comunicación y de implementación',
  },
};

// ── Dutch ─────────────────────────────────────────────────────────────────

const NL_CHROME: ReaderGuideChrome = {
  heading: 'Inlichtingengids voor de lezer',
  preamble: 'Gebruik deze gids om het artikel te lezen als een politiek inlichtingenproduct in plaats van een ruwe artefactverzameling. Perspectieven met hoge waarde verschijnen eerst; technische herkomst is beschikbaar in de auditbijlage.',
  colReaderNeed: 'Lezersbehoefte',
  colWhatYouGet: 'Wat u krijgt',
  colSourceArtifact: 'Bronartefact',
  perDocLabel: 'Documentspecifieke inlichtingen',
  perDocValue: 'bewijs op dok_id-niveau, benoemde actoren, datums en traceerbaarheid van primaire bron',
  auditLabel: 'Auditbijlage',
  auditValue: 'classificatie, kruisverwijzingen, methodologie en manifest-bewijs voor beoordelaars',
};

const NL_ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'BLUF en redactionele beslissingen',
    readerValue: 'snel antwoord op wat er gebeurde, waarom het ertoe doet, wie verantwoordelijk is en de volgende gedateerde trigger',
  },
  'intelligence-assessment.md': {
    label: 'Kernbeoordelingen',
    readerValue: 'op vertrouwen gebaseerde politiek-inlichtingenconclusies en verzamelingshiaten',
  },
  'significance-scoring.md': {
    label: 'Significantiescoring',
    readerValue: 'waarom dit verhaal hoger of lager gerangschikt is dan andere parlementaire signalen van dezelfde dag',
  },
  'media-framing-analysis.md': {
    label: 'Mediaframing en beïnvloedingsoperaties',
    readerValue: 'framingpakketten met Entman-functies, cognitieve kwetsbaarheidskaart en DISARM-indicatoren',
  },
  'forward-indicators.md': {
    label: 'Toekomstgerichte indicatoren',
    readerValue: 'gedateerde bewakingspunten waarmee lezers de beoordeling later kunnen verifiëren of weerleggen',
  },
  'scenario-analysis.md': {
    label: "Scenario's",
    readerValue: 'alternatieve uitkomsten met waarschijnlijkheden, triggers en waarschuwingssignalen',
  },
  'risk-assessment.md': {
    label: 'Risicobeoordeling',
    readerValue: 'register van beleids-, verkiezings-, institutionele, communicatie- en implementatierisico\'s',
  },
};

// ── Arabic ────────────────────────────────────────────────────────────────

const AR_CHROME: ReaderGuideChrome = {
  heading: 'دليل القارئ الاستخباراتي',
  preamble: 'استخدم هذا الدليل لقراءة المقال كمنتج استخباراتي سياسي بدلاً من مجموعة خام من المصنوعات. تظهر عدسات القراءة عالية القيمة أولاً؛ المصدر التقني متاح في ملحق التدقيق.',
  colReaderNeed: 'حاجة القارئ',
  colWhatYouGet: 'ما ستحصل عليه',
  colSourceArtifact: 'المصنوع المصدر',
  perDocLabel: 'استخبارات لكل وثيقة',
  perDocValue: 'أدلة على مستوى dok_id، فاعلون مسمّون، تواريخ، وتتبع المصدر الأساسي',
  auditLabel: 'ملحق التدقيق',
  auditValue: 'تصنيف، إسناد ترافقي، منهجية وأدلة بيان للمراجعين',
};

const AR_ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'الخلاصة والقرارات التحريرية',
    readerValue: 'إجابة سريعة عما حدث، ولماذا يهم، ومن المسؤول، والمحفز المؤرخ التالي',
  },
  'intelligence-assessment.md': {
    label: 'الأحكام الرئيسية',
    readerValue: 'استنتاجات استخباراتية سياسية قائمة على الثقة وثغرات الجمع',
  },
  'significance-scoring.md': {
    label: 'تقييم الأهمية',
    readerValue: 'لماذا تتفوق هذه القصة أو تتأخر عن إشارات برلمانية أخرى في نفس اليوم',
  },
  'media-framing-analysis.md': {
    label: 'التأطير الإعلامي وعمليات التأثير',
    readerValue: 'حزم التأطير بوظائف إنتمان، خريطة الضعف المعرفي ومؤشرات DISARM',
  },
  'forward-indicators.md': {
    label: 'المؤشرات الاستشرافية',
    readerValue: 'نقاط مراقبة مؤرخة تتيح للقراء التحقق من التقييم أو دحضه لاحقاً',
  },
  'scenario-analysis.md': {
    label: 'السيناريوهات',
    readerValue: 'نتائج بديلة مع احتمالات ومحفزات وإشارات تحذير',
  },
  'risk-assessment.md': {
    label: 'تقييم المخاطر',
    readerValue: 'سجل المخاطر السياسية والانتخابية والمؤسسية والاتصالية والتنفيذية',
  },
};

// ── Hebrew ────────────────────────────────────────────────────────────────

const HE_CHROME: ReaderGuideChrome = {
  heading: 'מדריך המודיעין לקורא',
  preamble: 'השתמש במדריך זה כדי לקרוא את המאמר כמוצר מודיעין פוליטי ולא כאוסף גולמי של ממצאים. עדשות קריאה בעלות ערך גבוה מופיעות ראשונות; מקור טכני זמין בנספח הביקורת.',
  colReaderNeed: 'צורך הקורא',
  colWhatYouGet: 'מה תקבל',
  colSourceArtifact: 'ממצא מקור',
  perDocLabel: 'מודיעין לכל מסמך',
  perDocValue: 'ראיות ברמת dok_id, שחקנים בשם, תאריכים ועקיבות מקור ראשוני',
  auditLabel: 'נספח ביקורת',
  auditValue: 'סיווג, הפניות צולבות, מתודולוגיה וראיות מניפסט לסוקרים',
};

const HE_ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'תמצית והחלטות עריכה',
    readerValue: 'תשובה מהירה למה שקרה, למה זה חשוב, מי אחראי והטריגר המתוארך הבא',
  },
  'intelligence-assessment.md': {
    label: 'הערכות מפתח',
    readerValue: 'מסקנות מודיעין פוליטי מבוססות רמת ביטחון ופערי איסוף',
  },
  'significance-scoring.md': {
    label: 'ציון משמעותיות',
    readerValue: 'מדוע סיפור זה מדורג גבוה או נמוך יותר מאותות פרלמנטריים אחרים באותו יום',
  },
  'media-framing-analysis.md': {
    label: 'מסגור תקשורתי ופעולות השפעה',
    readerValue: 'חבילות מסגור עם פונקציות אנטמן, מפת פגיעות קוגניטיבית ומדדי DISARM',
  },
  'forward-indicators.md': {
    label: 'אינדיקטורים צופי פני עתיד',
    readerValue: 'נקודות מעקב מתוארכות המאפשרות לקוראים לאמת או להפריך את ההערכה מאוחר יותר',
  },
  'scenario-analysis.md': {
    label: 'תרחישים',
    readerValue: 'תוצאות חלופיות עם הסתברויות, טריגרים וסימני אזהרה',
  },
  'risk-assessment.md': {
    label: 'הערכת סיכונים',
    readerValue: 'רישום סיכוני מדיניות, בחירות, מוסדות, תקשורת ויישום',
  },
};

// ── Japanese ──────────────────────────────────────────────────────────────

const JA_CHROME: ReaderGuideChrome = {
  heading: '読者向けインテリジェンスガイド',
  preamble: 'このガイドを使用して、記事を生のアーティファクト集ではなく政治インテリジェンス製品として読んでください。高価値の読者視点が最初に表示されます。技術的来歴は監査付録で確認できます。',
  colReaderNeed: '読者のニーズ',
  colWhatYouGet: '得られる内容',
  colSourceArtifact: 'ソースアーティファクト',
  perDocLabel: '文書別インテリジェンス',
  perDocValue: 'dok_idレベルの証拠、名前付きアクター、日付、一次資料の追跡可能性',
  auditLabel: '監査付録',
  auditValue: '分類、相互参照、方法論、レビュアー向けマニフェスト証拠',
};

const JA_ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'BLUFおよび編集方針',
    readerValue: '何が起きたか、なぜ重要か、誰が責任を負うか、次の日付付きトリガーへの迅速な回答',
  },
  'intelligence-assessment.md': {
    label: '主要判断',
    readerValue: '信頼度に基づく政治インテリジェンス結論と収集ギャップ',
  },
  'significance-scoring.md': {
    label: '重要度スコアリング',
    readerValue: 'この記事が同日の他の議会シグナルより上位または下位にランクされる理由',
  },
  'media-framing-analysis.md': {
    label: 'メディアフレーミングと影響工作',
    readerValue: 'Entman機能によるフレームパッケージ、認知脆弱性マップ、DISARM指標',
  },
  'forward-indicators.md': {
    label: '将来指標',
    readerValue: '読者が後で評価を検証または反証できる日付付き監視項目',
  },
  'scenario-analysis.md': {
    label: 'シナリオ',
    readerValue: '確率、トリガー、警告サインを伴う代替的結果',
  },
  'risk-assessment.md': {
    label: 'リスク評価',
    readerValue: '政策・選挙・制度・コミュニケーション・実施リスクレジスター',
  },
};

// ── Korean ────────────────────────────────────────────────────────────────

const KO_CHROME: ReaderGuideChrome = {
  heading: '독자 인텔리전스 가이드',
  preamble: '이 가이드를 사용하여 기사를 원시 아티팩트 모음이 아닌 정치 인텔리전스 제품으로 읽으십시오. 고가치 독자 관점이 먼저 나타나며, 기술적 출처는 감사 부록에서 확인할 수 있습니다.',
  colReaderNeed: '독자 필요',
  colWhatYouGet: '제공되는 내용',
  colSourceArtifact: '소스 아티팩트',
  perDocLabel: '문서별 인텔리전스',
  perDocValue: 'dok_id 수준 증거, 명명된 행위자, 날짜 및 1차 출처 추적 가능성',
  auditLabel: '감사 부록',
  auditValue: '분류, 교차 참조, 방법론 및 검토자를 위한 매니페스트 증거',
};

const KO_ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'BLUF 및 편집 결정',
    readerValue: '무엇이 일어났는지, 왜 중요한지, 누가 책임이 있는지, 다음 날짜 지정 트리거에 대한 빠른 답변',
  },
  'intelligence-assessment.md': {
    label: '핵심 판단',
    readerValue: '신뢰도 기반 정치 인텔리전스 결론 및 수집 격차',
  },
  'significance-scoring.md': {
    label: '중요도 점수',
    readerValue: '이 기사가 같은 날 다른 의회 신호보다 높거나 낮게 순위가 매겨지는 이유',
  },
  'media-framing-analysis.md': {
    label: '미디어 프레이밍 및 영향 공작',
    readerValue: 'Entman 기능이 포함된 프레임 패키지, 인지 취약성 맵 및 DISARM 지표',
  },
  'forward-indicators.md': {
    label: '전방 지표',
    readerValue: '독자가 나중에 평가를 검증하거나 반증할 수 있는 날짜 지정 감시 항목',
  },
  'scenario-analysis.md': {
    label: '시나리오',
    readerValue: '확률, 트리거 및 경고 신호가 포함된 대안적 결과',
  },
  'risk-assessment.md': {
    label: '위험 평가',
    readerValue: '정책, 선거, 제도, 커뮤니케이션 및 이행 위험 레지스터',
  },
};

// ── Chinese ───────────────────────────────────────────────────────────────

const ZH_CHROME: ReaderGuideChrome = {
  heading: '读者情报指南',
  preamble: '使用本指南将文章作为政治情报产品而非原始工件集合来阅读。高价值读者视角优先显示；技术来源可在审计附录中查阅。',
  colReaderNeed: '读者需求',
  colWhatYouGet: '您将获得',
  colSourceArtifact: '来源工件',
  perDocLabel: '逐文档情报',
  perDocValue: 'dok_id级别证据、命名行动者、日期和一手来源可追溯性',
  auditLabel: '审计附录',
  auditValue: '分类、交叉引用、方法论和审阅者清单证据',
};

const ZH_ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'BLUF与编辑决策',
    readerValue: '快速回答发生了什么、为何重要、谁负责以及下一个带日期的触发器',
  },
  'intelligence-assessment.md': {
    label: '关键判断',
    readerValue: '基于置信度的政治情报结论和收集差距',
  },
  'significance-scoring.md': {
    label: '重要性评分',
    readerValue: '为何此新闻的排名高于或低于同日其他议会信号',
  },
  'media-framing-analysis.md': {
    label: '媒体框架与影响力行动',
    readerValue: '含Entman功能的框架包、认知脆弱性图和DISARM指标',
  },
  'forward-indicators.md': {
    label: '前瞻性指标',
    readerValue: '带日期的监测项目，使读者能够后续验证或证伪评估',
  },
  'scenario-analysis.md': {
    label: '情景分析',
    readerValue: '带有概率、触发因素和警告信号的替代结果',
  },
  'risk-assessment.md': {
    label: '风险评估',
    readerValue: '政策、选举、制度、沟通和实施风险登记册',
  },
};

// ── Assemble the full map ─────────────────────────────────────────────────

export const READER_GUIDE_I18N: Record<Language, ReaderGuideI18nBundle> = {
  en: { chrome: EN_CHROME, entries: EN_ENTRIES },
  sv: { chrome: SV_CHROME, entries: SV_ENTRIES },
  da: { chrome: DA_CHROME, entries: DA_ENTRIES },
  no: { chrome: NO_CHROME, entries: NO_ENTRIES },
  fi: { chrome: FI_CHROME, entries: FI_ENTRIES },
  de: { chrome: DE_CHROME, entries: DE_ENTRIES },
  fr: { chrome: FR_CHROME, entries: FR_ENTRIES },
  es: { chrome: ES_CHROME, entries: ES_ENTRIES },
  nl: { chrome: NL_CHROME, entries: NL_ENTRIES },
  ar: { chrome: AR_CHROME, entries: AR_ENTRIES },
  he: { chrome: HE_CHROME, entries: HE_ENTRIES },
  ja: { chrome: JA_CHROME, entries: JA_ENTRIES },
  ko: { chrome: KO_CHROME, entries: KO_ENTRIES },
  zh: { chrome: ZH_CHROME, entries: ZH_ENTRIES },
};

/**
 * Get the i18n bundle for a given language, with English fallback.
 */
export function readerGuideI18n(lang: Language): ReaderGuideI18nBundle {
  return READER_GUIDE_I18N[lang] ?? READER_GUIDE_I18N.en;
}
