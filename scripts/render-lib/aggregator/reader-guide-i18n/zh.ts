/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/ZH
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — Chinese (Simplified) bundle
 *
 * @description
 * Chinese (Simplified) translations for the Reader Intelligence Guide
 * chrome (heading, preamble, column headers) and per-entry label /
 * readerValue strings. Exports `CHROME` and `ENTRIES`; the barrel
 * `./index.ts` composes the 14 bundles into `READER_GUIDE_I18N`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { ReaderGuideChrome, ReaderGuideEntryI18n } from './types.js';

export const CHROME: ReaderGuideChrome = {
  heading: '读者情报指南',
  preamble: '使用本指南将文章作为政治情报产品而非原始工件集合来阅读。高价值读者视角优先显示；技术来源可在审计附录中查阅。',
  colReaderNeed: '读者需求',
  colWhatYouGet: '您将获得',
  perDocLabel: '逐文档情报',
  perDocValue: 'dok_id级别证据、命名行动者、日期和一手来源可追溯性',
  auditLabel: '审计附录',
  auditValue: '分类、交叉引用、方法论和审阅者清单证据',
  colIcon: '图标',
  defaultReaderValue: '具有原始资料证据和可审计引用的补充分析视角',
};

export const ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: '导语与编辑决策',
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
