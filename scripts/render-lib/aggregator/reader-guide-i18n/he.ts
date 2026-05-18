/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/HE
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — Hebrew (RTL) bundle
 *
 * @description
 * Hebrew (RTL) translations for the Reader Intelligence Guide
 * chrome (heading, preamble, column headers) and per-entry label /
 * readerValue strings. Exports `CHROME` and `ENTRIES`; the barrel
 * `./index.ts` composes the 14 bundles into `READER_GUIDE_I18N`.
 *
 * RTL: Layout direction is provided by `dir="rtl"` from `LANGUAGE_META`.
 * See `Article-Generation.md §🌍 Language Switchers and Translation Model`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { ReaderGuideChrome, ReaderGuideEntryI18n } from './types.js';

export const CHROME: ReaderGuideChrome = {
  heading: 'מדריך המודיעין לקורא',
  preamble: 'השתמש במדריך זה כדי לקרוא את המאמר כמוצר מודיעין פוליטי ולא כאוסף גולמי של ממצאים. עדשות קריאה בעלות ערך גבוה מופיעות ראשונות; מקור טכני זמין בנספח הביקורת.',
  colReaderNeed: 'צורך הקורא',
  colWhatYouGet: 'מה תקבל',
  perDocLabel: 'מודיעין לכל מסמך',
  perDocValue: 'ראיות ברמת dok_id, שחקנים בשם, תאריכים ועקיבות מקור ראשוני',
  auditLabel: 'נספח ביקורת',
  auditValue: 'סיווג, הפניות צולבות, מתודולוגיה וראיות מניפסט לסוקרים',
  colIcon: 'אייקון',
  defaultReaderValue: 'עדשה אנליטית תומכת עם ראיות ממקור ראשון וציטוטים ניתנים למעקב',
};

export const ENTRIES: Record<string, ReaderGuideEntryI18n> = {
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
