/**
 * @module ai-analysis/coalition-detector
 * @description Heuristic-based coalition tension detector for the AI analysis pipeline.
 *
 * Analyses a document set to identify convergence/divergence patterns between
 * government and opposition parties. Tension is derived from the ratio of
 * opposition challenge documents (motions, interpellations) to all political
 * documents (government + opposition; committee reports excluded).
 *
 * Implements the `CoalitionTensionDetector` interface so it can be swapped
 * for an LLM-backed implementation in the future.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import type { RawDocument } from '../data-transformers/types.js';
import type {
  CoalitionTensionResult,
  CoalitionStressLevel,
  CoalitionTensionDetector,
} from './types.js';

// ---------------------------------------------------------------------------
// Document classification helpers
// ---------------------------------------------------------------------------

/** Normalise document type string for comparison (falls back to documentType). */
function docType(d: RawDocument): string {
  const raw = d.doktyp ?? d.documentType ?? '';
  return raw.toLowerCase().trim();
}

/** Extract document ID. */
function docId(d: RawDocument): string {
  return d.dok_id ?? '';
}

/** Government-aligned document types (propositions, laws, govt comms, press releases, SOU, departmental series, directives). */
const GOVERNMENT_DOC_TYPES = new Set(['prop', 'sfs', 'skr', 'pressm', 'ds', 'sou', 'dir']);

/** Opposition challenge document types (motions, interpellations). */
const OPPOSITION_DOC_TYPES = new Set(['mot', 'ip']);

// ---------------------------------------------------------------------------
// Localised narrative templates
// ---------------------------------------------------------------------------

type LangRecord = Partial<Record<Language, string>>;

const STRESS_LOW: LangRecord = {
  en: 'Low coalition tension — government output dominates with limited opposition challenge.',
  sv: 'Låg koalitionsspänning — regeringens produktion dominerar med begränsad oppositionsutmaning.',
  da: 'Lav koalitionsspænding — regeringsproduktionen dominerer med begrænset oppositionsudfordring.',
  no: 'Lav koalisjonsspenning — regjeringens produksjon dominerer med begrenset opposisjonsutfordring.',
  fi: 'Matala koalitiojännite — hallituksen tuotanto hallitsee rajallisella opposition haasteella.',
  de: 'Geringe Koalitionsspannung — die Regierungsproduktion dominiert bei begrenzter Oppositionsherausforderung.',
  fr: 'Faible tension de coalition — la production gouvernementale domine avec un défi d\'opposition limité.',
  es: 'Baja tensión de coalición — la producción gubernamental domina con desafío opositor limitado.',
  nl: 'Lage coalitiespanning — de regeringsproductie domineert met beperkte oppositie-uitdaging.',
  ar: 'توتر ائتلافي منخفض — إنتاج الحكومة يهيمن مع تحدٍ محدود من المعارضة.',
  he: 'מתח קואליציוני נמוך — תפוקת הממשלה שולטת עם אתגר אופוזיציוני מוגבל.',
  ja: '連立の緊張度 低 — 政府の生産が支配的で、野党の挑戦は限定的。',
  ko: '연립 긴장도 낮음 — 정부 산출이 지배적이며 야당의 도전이 제한적.',
  zh: '联盟紧张度低 — 政府产出占主导地位，反对派挑战有限。',
};

const STRESS_MEDIUM: LangRecord = {
  en: 'Moderate coalition tension — significant opposition activity through motions and interpellations.',
  sv: 'Måttlig koalitionsspänning — betydande oppositionsaktivitet genom motioner och interpellationer.',
  da: 'Moderat koalitionsspænding — betydelig oppositionsaktivitet gennem beslutningsforslag og interpellationer.',
  no: 'Moderat koalisjonsspenning — betydelig opposisjonsaktivitet gjennom forslag og interpellasjoner.',
  fi: 'Kohtalainen koalitiojännite — merkittävää oppositioaktiviteettia aloitteiden ja välikysymysten kautta.',
  de: 'Mäßige Koalitionsspannung — bedeutende Oppositionsaktivität durch Anträge und Interpellationen.',
  fr: 'Tension de coalition modérée — activité d\'opposition significative par motions et interpellations.',
  es: 'Tensión de coalición moderada — actividad opositora significativa mediante mociones e interpelaciones.',
  nl: 'Matige coalitiespanning — aanzienlijke oppositieactiviteit door moties en interpellaties.',
  ar: 'توتر ائتلافي معتدل — نشاط معارض كبير من خلال الاقتراحات والاستجوابات.',
  he: 'מתח קואליציוני בינוני — פעילות אופוזיציונית משמעותית באמצעות הצעות ושאילתות.',
  ja: '連立の緊張度 中 — 動議と質問を通じた野党の顕著な活動。',
  ko: '연립 긴장도 보통 — 동의안과 질의를 통한 상당한 야당 활동.',
  zh: '联盟紧张度中等 — 反对派通过动议和质询展开重大活动。',
};

const STRESS_HIGH: LangRecord = {
  en: 'High coalition tension — opposition challenges outpace government output, signalling policy contestation.',
  sv: 'Hög koalitionsspänning — oppositionens utmaningar överträffar regeringens produktion, vilket signalerar politisk konfrontation.',
  da: 'Høj koalitionsspænding — oppositionens udfordringer overgår regeringsproduktionen, hvilket signalerer politisk konfrontation.',
  no: 'Høy koalisjonsspenning — opposisjonens utfordringer overgår regjeringens produksjon, noe som signaliserer politisk konfrontasjon.',
  fi: 'Korkea koalitiojännite — opposition haasteet ylittävät hallituksen tuotannon, mikä viestii poliittisesta kiistasta.',
  de: 'Hohe Koalitionsspannung — die Herausforderungen der Opposition übersteigen die Regierungsproduktion und signalisieren politische Konfrontation.',
  fr: 'Haute tension de coalition — les défis de l\'opposition dépassent la production gouvernementale, signalant une contestation politique.',
  es: 'Alta tensión de coalición — los desafíos de la oposición superan la producción gubernamental, señalando contestación política.',
  nl: 'Hoge coalitiespanning — oppositie-uitdagingen overtreffen de regeringsproductie, wat wijst op politieke confrontatie.',
  ar: 'توتر ائتلافي مرتفع — تحديات المعارضة تفوق إنتاج الحكومة، مما يشير إلى مواجهة سياسية.',
  he: 'מתח קואליציוני גבוה — אתגרי האופוזיציה עולים על תפוקת הממשלה, מה שמסמן עימות מדיני.',
  ja: '連立の緊張度 高 — 野党の挑戦が政府の生産を上回り、政策上の争いを示唆。',
  ko: '연립 긴장도 높음 — 야당의 도전이 정부 산출을 앞서며 정책 논쟁을 시사.',
  zh: '联盟紧张度高 — 反对派挑战超越政府产出，表明政策争议。',
};

// ---------------------------------------------------------------------------
// Heuristic implementation
// ---------------------------------------------------------------------------

/**
 * Determine coalition stress level from the challenge ratio.
 * - low:    challengeRatio < 0.3
 * - medium: 0.3 ≤ challengeRatio < 0.6
 * - high:   challengeRatio ≥ 0.6
 *
 * When ≥5 interpellations are present, stress is bumped by one level
 * (low→medium, medium→high) to reflect ministerial accountability pressure.
 */
function classifyStress(challengeRatio: number, ipCount: number): CoalitionStressLevel {
  const ipBoost = ipCount >= 5;

  // Base level from challenge ratio alone
  let level: CoalitionStressLevel;
  if (challengeRatio >= 0.6) {
    level = 'high';
  } else if (challengeRatio >= 0.3) {
    level = 'medium';
  } else {
    level = 'low';
  }

  // Apply one-level bump if interpellations are high and we are below 'high'
  if (ipBoost && level !== 'high') {
    level = level === 'low' ? 'medium' : 'high';
  }

  return level;
}

function narrativeForStress(level: CoalitionStressLevel, lang: Language): string {
  switch (level) {
    case 'high': return STRESS_HIGH[lang] ?? STRESS_HIGH.en!;
    case 'medium': return STRESS_MEDIUM[lang] ?? STRESS_MEDIUM.en!;
    default: return STRESS_LOW[lang] ?? STRESS_LOW.en!;
  }
}

/**
 * Heuristic coalition tension detector.
 *
 * Classifies coalition stress from the distribution of government vs.
 * opposition documents, using the challenge ratio (opposition docs / total)
 * and interpellation count as primary signals.
 */
function detectCoalitionTension(
  docs: RawDocument[],
  lang: Language,
): CoalitionTensionResult {
  if (docs.length === 0) {
    return {
      stressLevel: 'low',
      narrative: narrativeForStress('low', lang),
      governmentDocCount: 0,
      oppositionDocCount: 0,
      challengeRatio: 0,
      sourceDocIds: [],
    };
  }

  let governmentDocCount = 0;
  let oppositionDocCount = 0;
  let ipCount = 0;
  const sourceDocIds: string[] = [];

  for (const d of docs) {
    const dt = docType(d);
    const id = docId(d);
    if (id) sourceDocIds.push(id);

    if (GOVERNMENT_DOC_TYPES.has(dt)) {
      governmentDocCount++;
    } else if (OPPOSITION_DOC_TYPES.has(dt)) {
      oppositionDocCount++;
      if (dt === 'ip') ipCount++;
    }
    // Committee reports (bet) are neutral and excluded from gov/opp counts
  }

  // Challenge ratio: opposition challenge documents divided by
  // (government + opposition), with committee reports excluded from the denominator.
  // Round to 2 decimals before classification so the returned ratio is always
  // consistent with the stress level (avoids threshold ambiguity near 0.3/0.6).
  const denominator = governmentDocCount + oppositionDocCount;
  const challengeRatio = denominator > 0
    ? Math.round((oppositionDocCount / denominator) * 100) / 100
    : 0;

  const stressLevel = classifyStress(challengeRatio, ipCount);
  const narrative = narrativeForStress(stressLevel, lang);

  return {
    stressLevel,
    narrative,
    governmentDocCount,
    oppositionDocCount,
    challengeRatio,
    sourceDocIds,
  };
}

// ---------------------------------------------------------------------------
// Exported singleton implementing CoalitionTensionDetector
// ---------------------------------------------------------------------------

/**
 * Default heuristic coalition tension detector.
 * Swap this implementation for an LLM-backed one when ready.
 */
export const coalitionDetector: CoalitionTensionDetector = {
  detect: detectCoalitionTension,
};
