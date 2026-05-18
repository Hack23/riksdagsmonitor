/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/AR
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — Arabic (RTL) bundle
 *
 * @description
 * Arabic (RTL) translations for the Reader Intelligence Guide
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
  heading: 'دليل القارئ الاستخباراتي',
  preamble: 'استخدم هذا الدليل لقراءة المقال كمنتج استخباراتي سياسي بدلاً من مجموعة خام من المصنوعات. تظهر عدسات القراءة عالية القيمة أولاً؛ المصدر التقني متاح في ملحق التدقيق.',
  colReaderNeed: 'حاجة القارئ',
  colWhatYouGet: 'ما ستحصل عليه',
  perDocLabel: 'استخبارات لكل وثيقة',
  perDocValue: 'أدلة على مستوى dok_id، فاعلون مسمّون، تواريخ، وتتبع المصدر الأساسي',
  auditLabel: 'ملحق التدقيق',
  auditValue: 'تصنيف، إسناد ترافقي، منهجية وأدلة بيان للمراجعين',
  colIcon: 'أيقونة',
  defaultReaderValue: 'عدسة تحليلية مساندة مع أدلة من مصادر أولية واقتباسات قابلة للتتبع',
};

export const ENTRIES: Record<string, ReaderGuideEntryI18n> = {
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
