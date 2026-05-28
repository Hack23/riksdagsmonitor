/**
 * @module Infrastructure/RenderLib/Aggregator/ReaderGuideI18n/KO
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Reader Intelligence Guide — Korean bundle
 *
 * @description
 * Korean translations for the Reader Intelligence Guide
 * chrome (heading, preamble, column headers) and per-entry label /
 * readerValue strings. Exports `CHROME` and `ENTRIES`; the barrel
 * `./index.ts` composes the 14 bundles into `READER_GUIDE_I18N`.
 *
 * Translation guide: https://github.com/Hack23/homepage/blob/main/Korean-Translation-Guide.md
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { ReaderGuideChrome, ReaderGuideEntryI18n } from './types.js';

export const CHROME: ReaderGuideChrome = {
  heading: '독자 인텔리전스 가이드',
  preamble: '이 가이드를 사용하여 기사를 원시 아티팩트 모음이 아닌 정치 인텔리전스 제품으로 읽으십시오. 고가치 독자 관점이 먼저 나타나며, 기술적 출처는 감사 부록에서 확인할 수 있습니다.',
  colReaderNeed: '독자 필요',
  colWhatYouGet: '제공되는 내용',
  perDocLabel: '문서별 인텔리전스',
  perDocValue: 'dok_id 수준 증거, 명명된 행위자, 날짜 및 1차 출처 추적 가능성',
  auditLabel: '감사 부록',
  auditValue: '분류, 교차 참조, 방법론 및 검토자를 위한 매니페스트 증거',
  colIcon: '아이콘',
  defaultReaderValue: '1차 자료 증거와 추적 가능한 인용이 포함된 보조 분석 렌즈',
};

export const ENTRIES: Record<string, ReaderGuideEntryI18n> = {
  'executive-brief.md': {
    label: '리드 문단 및 편집 결정',
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
