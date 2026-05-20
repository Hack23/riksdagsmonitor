/**
 * @module download-parliamentary-data/pre-article-analysis
 * @description Re-export shim — original 531-line implementation was split
 * into `./pre-article-analysis/{index,document-filter,retry-merge,coverage-tagging,output-writer}.ts`.
 * Kept so historic imports (`pre-article-analysis.js`) keep resolving.
 */
export {
  runPreArticleAnalysis,
  type RunPreArticleAnalysisOptions,
} from './pre-article-analysis/index.js';
