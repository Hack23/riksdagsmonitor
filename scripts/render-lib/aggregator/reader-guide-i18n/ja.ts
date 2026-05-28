/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/JA
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — Japanese bundle
 *
 * @description
 * Japanese translations for the Reader Intelligence Guide
 * chrome (heading, preamble, column headers) and per-entry label /
 * readerValue strings. Exports `CHROME` and `ENTRIES`; the barrel
 * `./index.ts` composes the 14 bundles into `READER_GUIDE_I18N`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { ReaderGuideChrome, ReaderGuideEntryI18n } from './types.js';

export const CHROME: ReaderGuideChrome = {
  heading: '読者向けインテリジェンスガイド',
  preamble: 'このガイドを使用して、記事を生のアーティファクト集ではなく政治インテリジェンス製品として読んでください。高価値の読者視点が最初に表示されます。技術的来歴は監査付録で確認できます。',
  colReaderNeed: '読者のニーズ',
  colWhatYouGet: '得られる内容',
  perDocLabel: '文書別インテリジェンス',
  perDocValue: 'dok_idレベルの証拠、名前付きアクター、日付、一次資料の追跡可能性',
  auditLabel: '監査付録',
  auditValue: '分類、相互参照、方法論、レビュアー向けマニフェスト証拠',
  colIcon: 'アイコン',
  defaultReaderValue: '一次資料の証拠と監査追跡可能な引用を備えた補完的分析レンズ',
};

export const ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: 'リード段落と編集方針',
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
