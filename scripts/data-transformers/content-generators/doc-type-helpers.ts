/**
 * @module data-transformers/content-generators/doc-type-helpers
 * @description Document type display names (multi-language) and title suffix templates.
 * Provides DOC_TYPE_DISPLAY lookup table, localizeDocType utility, and
 * TITLE_SUFFIX_TEMPLATES for inverted-pyramid lede construction.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';

/** Localized singular/plural display names for a Riksdag document type code. */
export type DocTypeLocalization = {
  singular: Partial<Record<Language, string>>;
  plural: Partial<Record<Language, string>>;
};

/** Multi-language display names for known Riksdag document type codes. */
export const DOC_TYPE_DISPLAY: Readonly<Record<string, DocTypeLocalization>> = {
  prop: {
    singular: {
      en: 'Proposition', sv: 'Proposition', da: 'Proposition', no: 'Proposisjon',
      fi: 'Hallituksen esitys', de: 'Regierungsvorlage', fr: 'Projet de loi', es: 'Proposición',
      nl: 'Wetsvoorstel', ar: 'مقترح قانون', he: 'הצעת חוק', ja: '法案', ko: '정부 제출 법안', zh: '政府法案',
    },
    plural: {
      en: 'Propositions', sv: 'Propositioner', da: 'Propositioner', no: 'Proposisjoner',
      fi: 'Hallituksen esitykset', de: 'Regierungsvorlagen', fr: 'Projets de loi', es: 'Proposiciones',
      nl: 'Wetsvoorstellen', ar: 'مقترحات قوانين', he: 'הצעות חוק', ja: '法案', ko: '정부 제출 법안', zh: '政府法案',
    },
  },
  bet: {
    singular: {
      en: 'Committee Report', sv: 'Betänkande', da: 'Udvalgsbetænkning', no: 'Komitéinnstilling',
      fi: 'Valiokunnan mietintö', de: 'Ausschussbericht', fr: 'Rapport de commission', es: 'Informe de comisión',
      nl: 'Commissieverslag', ar: 'تقرير لجنة', he: 'דוח ועדה', ja: '委員会報告書', ko: '위원회 보고서', zh: '委员会报告',
    },
    plural: {
      en: 'Committee Reports', sv: 'Betänkanden', da: 'Udvalgsbetænkninger', no: 'Komitéinnstillinger',
      fi: 'Valiokunnan mietinnöt', de: 'Ausschussberichte', fr: 'Rapports de commission', es: 'Informes de comisión',
      nl: 'Commissieverslagen', ar: 'تقارير لجان', he: 'דוחות ועדה', ja: '委員会報告書', ko: '위원회 보고서', zh: '委员会报告',
    },
  },
  mot: {
    singular: {
      en: 'Motion', sv: 'Motion', da: 'Forslag', no: 'Forslag',
      fi: 'Aloite', de: 'Antrag', fr: 'Motion', es: 'Moción',
      nl: 'Motie', ar: 'مقترح', he: 'הצעה', ja: '動議', ko: '동의안', zh: '动议',
    },
    plural: {
      en: 'Motions', sv: 'Motioner', da: 'Forslag', no: 'Forslag',
      fi: 'Aloitteet', de: 'Anträge', fr: 'Motions', es: 'Mociones',
      nl: 'Moties', ar: 'مقترحات', he: 'הצעות', ja: '動議', ko: '동의안', zh: '动议',
    },
  },
  skr: {
    singular: {
      en: 'Government Communication', sv: 'Skrivelse', da: 'Regeringsskrivelse', no: 'Regjeringsskriv',
      fi: 'Valtioneuvoston kirjelmä', de: 'Regierungsschreiben', fr: 'Communication du gouvernement', es: 'Comunicación del gobierno',
      nl: 'Regeringsmededeling', ar: 'مذكرة حكومية', he: 'מכתב ממשלתי', ja: '政府通信文書', ko: '정부 통신문', zh: '政府公文',
    },
    plural: {
      en: 'Government Communications', sv: 'Skrivelser', da: 'Regeringsskrivelser', no: 'Regjeringsskriv',
      fi: 'Valtioneuvoston kirjelmät', de: 'Regierungsschreiben', fr: 'Communications du gouvernement', es: 'Comunicaciones del gobierno',
      nl: 'Regeringsmededelingen', ar: 'مذكرات حكومية', he: 'מכתבים ממשלתיים', ja: '政府通信文書', ko: '정부 통신문', zh: '政府公文',
    },
  },
  sfs: {
    singular: {
      en: 'Law/Statute', sv: 'Lag/förordning', da: 'Lov/forordning', no: 'Lov/forordning',
      fi: 'Laki/asetus', de: 'Gesetz/Verordnung', fr: 'Loi/Règlement', es: 'Ley/Reglamento',
      nl: 'Wet/Verordening', ar: 'قانون / لائحة', he: 'חוק/תקנה', ja: '法律／条例', ko: '법률/법규', zh: '法律/法规',
    },
    plural: {
      en: 'Laws/Statutes', sv: 'Lagar/förordningar', da: 'Love/forordninger', no: 'Lover/forordninger',
      fi: 'Lait/asetukset', de: 'Gesetze/Verordnungen', fr: 'Lois/Règlements', es: 'Leyes/Reglamentos',
      nl: 'Wetten/Verordeningen', ar: 'قوانين / لوائح', he: 'חוקים/תקנות', ja: '法律／条例', ko: '법률/법규', zh: '法律/法规',
    },
  },
  fpm: {
    singular: {
      en: 'EU Position Paper', sv: 'Faktapromemoria', da: 'EU-faktanota', no: 'EU-faktanotat',
      fi: 'EU-tietomuistio', de: 'EU-Positionspapier', fr: 'Note de position UE', es: 'Documento de posición de la UE',
      nl: 'EU-positiepaper', ar: 'ورقة موقف للاتحاد الأوروبي', he: 'מסמך עמדה של האיחוד האירופי', ja: 'EUポジションペーパー', ko: 'EU 입장 문서', zh: '欧盟立场文件',
    },
    plural: {
      en: 'EU Position Papers', sv: 'Faktapromemorior', da: 'EU-faktanotaer', no: 'EU-faktanotater',
      fi: 'EU-tietomuistiot', de: 'EU-Positionspapiere', fr: 'Notes de position UE', es: 'Documentos de posición de la UE',
      nl: 'EU-positiepapers', ar: 'أوراق موقف للاتحاد الأوروبي', he: 'מסמכי עמדה של האיחוד האירופי', ja: 'EUポジションペーパー', ko: 'EU 입장 문서', zh: '欧盟立场文件',
    },
  },
  pressm: {
    singular: {
      en: 'Press Release', sv: 'Pressmeddelande', da: 'Pressemeddelelse', no: 'Pressemelding',
      fi: 'Lehdistötiedote', de: 'Pressemitteilung', fr: 'Communiqué de presse', es: 'Comunicado de prensa',
      nl: 'Persbericht', ar: 'بيان صحفي', he: 'הודעה לעיתונות', ja: 'プレスリリース', ko: '보도자료', zh: '新闻稿',
    },
    plural: {
      en: 'Press Releases', sv: 'Pressmeddelanden', da: 'Pressemeddelelser', no: 'Pressemeldinger',
      fi: 'Lehdistötiedotteet', de: 'Pressemitteilungen', fr: 'Communiqués de presse', es: 'Comunicados de prensa',
      nl: 'Persberichten', ar: 'بيانات صحفية', he: 'הודעות לעיתונות', ja: 'プレスリリース', ko: '보도자료', zh: '新闻稿',
    },
  },
  ext: {
    singular: {
      en: 'External Reference', sv: 'Extern referens', da: 'Ekstern reference', no: 'Ekstern referanse',
      fi: 'Ulkoinen viite', de: 'Externe Referenz', fr: 'Référence externe', es: 'Referencia externa',
      nl: 'Externe referentie', ar: 'مرجع خارجي', he: 'הפניה חיצונית', ja: '外部参照', ko: '외부 참조', zh: '外部参考',
    },
    plural: {
      en: 'External References', sv: 'Externa referenser', da: 'Eksterne referencer', no: 'Eksterne referanser',
      fi: 'Ulkoiset viitteet', de: 'Externe Referenzen', fr: 'Références externes', es: 'Referencias externas',
      nl: 'Externe referenties', ar: 'مراجع خارجية', he: 'הפניות חיצוניות', ja: '外部参照', ko: '외부 참조', zh: '외부参考',
    },
  },
  other: {
    singular: {
      en: 'Other Document', sv: 'Övrigt dokument', da: 'Andet dokument', no: 'Annet dokument',
      fi: 'Muu asiakirja', de: 'Sonstiges Dokument', fr: 'Autre document', es: 'Otro documento',
      nl: 'Overig document', ar: 'مستند آخر', he: 'מסמך אחר', ja: 'その他の文書', ko: '기타 문서', zh: '其他文件',
    },
    plural: {
      en: 'Other Documents', sv: 'Övriga dokument', da: 'Andre dokumenter', no: 'Andre dokumenter',
      fi: 'Muut asiakirjat', de: 'Sonstige Dokumente', fr: 'Autres documents', es: 'Otros documentos',
      nl: 'Overige documenten', ar: 'مستندات أخرى', he: 'מסמכים אחרים', ja: 'その他の文書', ko: '기타 문서', zh: '其他文件',
    },
  },
};

/** Localise raw Riksdag document type codes for display (singular/plural-aware, multi-language). */
export function localizeDocType(code: string, lang: Language | string, count?: number): string {
  const entry = DOC_TYPE_DISPLAY[code];
  if (!entry) return code;
  const usePlural = count !== 1;
  const primary = usePlural ? entry.plural : entry.singular;
  const fallback = usePlural ? entry.singular : entry.plural;
  return primary[lang as Language] ?? primary.en ?? fallback[lang as Language] ?? fallback.en ?? code;
}

/** Per-language title-suffix templates for inverted-pyramid lede construction. */
export const TITLE_SUFFIX_TEMPLATES: Readonly<Record<string, (t: string) => string>> = {
  sv: t => ` — inklusive "${t}"`,
  da: t => ` — herunder "${t}"`,
  no: t => ` — inkludert "${t}"`,
  fi: t => ` — mukaan lukien "${t}"`,
  de: t => ` — darunter "${t}"`,
  fr: t => ` — notamment "${t}"`,
  es: t => ` — incluyendo "${t}"`,
  nl: t => ` — inclusief "${t}"`,
  ar: t => ` — بما فيها "${t}"`,
  he: t => ` — כולל "${t}"`,
  ja: t => `、「${t}」を含む`,
  ko: t => `, "${t}" 포함`,
  zh: t => `，包括"${t}"`,
};
