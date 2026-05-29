/**
 * @fileoverview Tests for article scannability post-processing transforms.
 */
import { describe, it, expect } from 'vitest';
import {
  transformConfidenceChips,
  transformAdmiraltyBadges,
  transformTimelineIndicators,
  transformProgressiveDisclosure,
  generateArticleToc,
  renderMethodologyFooter,
  applyScannabilityTransforms,
} from '../scripts/render-lib/article-scannability.js';

describe('Article Scannability Transforms', () => {
  describe('transformConfidenceChips', () => {
    it('wraps HIGH confidence in a green chip', () => {
      const html = '<p>Confidence: HIGH (A2)</p>';
      const result = transformConfidenceChips(html);
      expect(result).toContain('class="rm-confidence rm-confidence--high"');
      expect(result).toContain('aria-label="Confidence: HIGH"');
    });

    it('wraps MEDIUM confidence in an amber chip', () => {
      const html = '<p>Assessment: MEDIUM</p>';
      const result = transformConfidenceChips(html);
      expect(result).toContain('rm-confidence--medium');
    });

    it('wraps LOW confidence in a red chip', () => {
      const html = '<p>This has LOW reliability</p>';
      const result = transformConfidenceChips(html);
      expect(result).toContain('rm-confidence--low');
    });

    it('handles multiple confidence levels in same string', () => {
      const html = '<p>HIGH for X, LOW for Y</p>';
      const result = transformConfidenceChips(html);
      expect(result).toContain('rm-confidence--high');
      expect(result).toContain('rm-confidence--low');
    });

    it('is case-insensitive', () => {
      const html = '<p>confidence: High</p>';
      const result = transformConfidenceChips(html);
      expect(result).toContain('rm-confidence--high');
    });

    it('does not modify heading id attributes containing high/medium/low', () => {
      const html = '<h2 id="rm-medium-threats">Medium Threats</h2>';
      const result = transformConfidenceChips(html);
      expect(result).toContain('id="rm-medium-threats"');
      // Text content should still be wrapped
      expect(result).toContain('rm-confidence--medium');
    });

    it('does not modify href attributes containing high/medium/low', () => {
      const html = '<a href="#rm-low-priority">Low priority</a>';
      const result = transformConfidenceChips(html);
      expect(result).toContain('href="#rm-low-priority"');
      // Text content should still be wrapped
      expect(result).toContain('rm-confidence--low');
    });

    it('does not inject spans into class or data attributes', () => {
      const html = '<div class="high-impact" data-level="MEDIUM"><p>HIGH confidence</p></div>';
      const result = transformConfidenceChips(html);
      expect(result).toContain('class="high-impact"');
      expect(result).toContain('data-level="MEDIUM"');
      expect(result).toContain('rm-confidence--high');
    });
  });

  describe('transformAdmiraltyBadges', () => {
    it('wraps Admiralty codes in styled badges with tooltips', () => {
      const html = '<p>Rating (A2) confirmed</p>';
      const result = transformAdmiraltyBadges(html);
      expect(result).toContain('class="rm-admiralty"');
      expect(result).toContain('title="Completely reliable; Probably true"');
      expect(result).toContain('aria-label="Admiralty code A2');
    });

    it('handles multiple codes', () => {
      const html = '<p>(A1) and (C3) and (F6)</p>';
      const result = transformAdmiraltyBadges(html);
      expect(result).toContain('Completely reliable; Confirmed by other sources');
      expect(result).toContain('Fairly reliable; Possibly true');
      expect(result).toContain('Reliability cannot be judged; Truth cannot be judged');
    });

    it('does not match non-Admiralty patterns', () => {
      const html = '<p>(G1) or (A7) should not match</p>';
      const result = transformAdmiraltyBadges(html);
      expect(result).not.toContain('rm-admiralty');
    });

    it('does not modify attributes containing Admiralty-like patterns', () => {
      const html = '<a href="#section-(A2)">Rating (A2)</a>';
      const result = transformAdmiraltyBadges(html);
      expect(result).toContain('href="#section-(A2)"');
    });
  });

  describe('transformTimelineIndicators', () => {
    it('wraps T+7d as urgent', () => {
      const html = '<p>Expected T+7d from now</p>';
      const result = transformTimelineIndicators(html);
      expect(result).toContain('rm-timeline--urgent');
      expect(result).toContain('aria-label="Next 7 days"');
    });

    it('wraps T+30d as near', () => {
      const html = '<p>Expected T+30d</p>';
      const result = transformTimelineIndicators(html);
      expect(result).toContain('rm-timeline--near');
    });

    it('wraps T+90d as horizon', () => {
      const html = '<p>Expected T+90d</p>';
      const result = transformTimelineIndicators(html);
      expect(result).toContain('rm-timeline--horizon');
    });

    it('preserves original text inside span', () => {
      const html = '<p>T+14d</p>';
      const result = transformTimelineIndicators(html);
      expect(result).toContain('>T+14d</span>');
    });

    it('does not modify attributes containing timeline-like patterns', () => {
      const html = '<h2 id="rm-T+7d-outlook">T+7d outlook</h2>';
      const result = transformTimelineIndicators(html);
      expect(result).toContain('id="rm-T+7d-outlook"');
      // Text content should still be wrapped
      expect(result).toContain('rm-timeline--urgent');
    });
  });

  describe('transformProgressiveDisclosure', () => {
    it('wraps Document Analysis H2 in details element', () => {
      const html = '<h2 id="rm-doc-analysis">Document Analysis</h2><p>Content here</p><h2 id="rm-next">Next Section</h2>';
      const result = transformProgressiveDisclosure(html);
      expect(result).toContain('<details class="rm-disclosure">');
      expect(result).toContain('<summary>Document Analysis</summary>');
      expect(result).toContain('rm-disclosure-content');
    });

    it('wraps Intelligence Notes in details element', () => {
      const html = '<h2 id="rm-intel">Intelligence Notes</h2><p>Notes</p>';
      const result = transformProgressiveDisclosure(html);
      expect(result).toContain('<details class="rm-disclosure">');
      expect(result).toContain('<summary>Intelligence Notes</summary>');
    });

    it('does not wrap non-matching headings', () => {
      const html = '<h2 id="rm-brief">Executive Brief</h2><p>Content</p>';
      const result = transformProgressiveDisclosure(html);
      expect(result).not.toContain('<details');
    });

    it('escapes residual markup in the disclosure summary', () => {
      const html = '<h2 id="rm-doc">Document Analysis <script</h2><p>x</p>';
      const result = transformProgressiveDisclosure(html);
      // Incomplete tag left by tag-stripping must be neutralised, not emitted raw.
      expect(result).toContain('<summary>Document Analysis &lt;script</summary>');
      expect(result).not.toContain('<summary>Document Analysis <script');
    });

    it('strips overlapping tags without reconstituting markup in the summary', () => {
      // A single tag-stripping pass on "<scr<a>ipt>" can reconstitute "<script>".
      const html = '<h2 id="rm-doc">Document Analysis <scr<a>ipt>alert(1)</h2><p>x</p>';
      const result = transformProgressiveDisclosure(html);
      const summary = result.slice(
        result.indexOf('<summary>') + '<summary>'.length,
        result.indexOf('</summary>'),
      );
      // No reconstituted opening tag should survive inside the summary text.
      expect(summary).not.toContain('<script');
      expect(summary).not.toContain('<a>');
    });

    it('handles Swedish headings', () => {
      const html = '<h2 id="rm-dok">Dokumentanalys</h2><p>Innehåll</p>';
      const result = transformProgressiveDisclosure(html);
      expect(result).toContain('<details class="rm-disclosure">');
    });
  });

  describe('generateArticleToc', () => {
    it('generates TOC from H2 headings', () => {
      const html = '<h2 id="rm-section-a">Section A</h2><p>A</p><h2 id="rm-section-b">Section B</h2><p>B</p><h2 id="rm-section-c">Section C</h2><p>C</p>';
      const result = generateArticleToc(html, 'en');
      expect(result).toContain('class="rm-article-toc"');
      expect(result).toContain('class="rm-article-toc-container"');
      expect(result).toContain('Contents');
      expect(result).toContain('href="#rm-section-a"');
      expect(result).toContain('>Section A</span>');
      expect(result).toContain('>Section B</span>');
    });

    it('wraps the TOC in a collapsible sidebar disclosure', () => {
      const html = '<h2 id="rm-a">A</h2><p>X</p><h2 id="rm-b">B</h2><p>Y</p>';
      const result = generateArticleToc(html, 'en');
      expect(result).toContain('<aside class="rm-article-toc-container"');
      expect(result).toContain('<details class="rm-article-toc-details" open>');
      expect(result).toContain('class="rm-article-toc-summary"');
      expect(result).toContain('class="rm-article-toc-list"');
    });

    it('assigns canonical icons and reading-depth layers from the section id', () => {
      const html = [
        '<h2 id="rm-what-happened">What Happened</h2><p>X</p>',
        '<h2 id="rm-risk-assessment-7">Risk Assessment</h2><p>Y</p>',
        '<h2 id="rm-threat-analysis">Threat Analysis</h2><p>Z</p>',
      ].join('');
      const result = generateArticleToc(html, 'en');
      // L1 quick read for the lead section, with its icon.
      expect(result).toContain('data-layer="quick"');
      expect(result).toContain('📰');
      // Trailing -<n> dedup suffix is normalized → risk-assessment (L2 analysis).
      expect(result).toContain('rm-toc-layer--analysis');
      expect(result).toContain('⚠️');
      // Threat analysis is an L3 intelligence/deep-dive section.
      expect(result).toContain('rm-toc-layer--intelligence');
      expect(result).toContain('🛡️');
    });

    it('falls back to a default icon for unknown dynamic sections', () => {
      const html = '<h2 id="rm-quux-unknown">Quux</h2><p>X</p><h2 id="rm-b">B</h2><p>Y</p>';
      const result = generateArticleToc(html, 'en');
      expect(result).toContain('📌');
    });

    it('returns empty string for single-section articles', () => {
      const html = '<h2 id="rm-only">Only Section</h2><p>Content</p>';
      const result = generateArticleToc(html, 'en');
      expect(result).toBe('');
    });

    it('uses Swedish label for sv lang', () => {
      const html = '<h2 id="rm-a">A</h2><p>X</p><h2 id="rm-b">B</h2><p>Y</p>';
      const result = generateArticleToc(html, 'sv');
      expect(result).toContain('Innehåll');
    });

    it('localizes the layer badge label for non-English languages', () => {
      const html = '<h2 id="rm-what-happened">A</h2><p>X</p><h2 id="rm-b">B</h2><p>Y</p>';
      const result = generateArticleToc(html, 'sv');
      // Swedish layer name for the quick-read layer.
      expect(result).toContain('Snabbläsning');
    });

    it('escapes residual markup in TOC link text', () => {
      const html = '<h2 id="rm-a">Section <script</h2><p>X</p><h2 id="rm-b">Section B</h2><p>Y</p>';
      const result = generateArticleToc(html, 'en');
      expect(result).toContain('Section &lt;script');
      expect(result).not.toContain('Section <script');
    });
  });

  describe('renderMethodologyFooter', () => {
    it('renders English methodology footer', () => {
      const result = renderMethodologyFooter('en');
      expect(result).toContain('class="rm-methodology-footer"');
      expect(result).toContain('Assessment Methodology');
      expect(result).toContain('Confidence Levels');
      expect(result).toContain('Admiralty Code');
      expect(result).toContain('Source Verification');
      expect(result).toContain('Data Freshness');
    });

    it('renders Swedish methodology footer', () => {
      const result = renderMethodologyFooter('sv');
      expect(result).toContain('Bedömningsmetodik');
    });

    it('falls back to English for unsupported languages', () => {
      const result = renderMethodologyFooter('ja');
      expect(result).toContain('Assessment Methodology');
    });
  });

  describe('applyScannabilityTransforms', () => {
    it('applies inline transforms and returns TOC + footer (no progressive disclosure)', () => {
      const html = '<h2 id="rm-brief">Executive Brief</h2><p>Confidence: HIGH (A2), expected T+7d</p><h2 id="rm-detail">Document Analysis</h2><p>Detail</p><h2 id="rm-end">Summary</h2><p>End</p>';
      const { transformedBody, tocHtml, methodologyFooterHtml } = applyScannabilityTransforms(html, 'en');

      // Confidence chip applied
      expect(transformedBody).toContain('rm-confidence--high');
      // Admiralty badge applied
      expect(transformedBody).toContain('rm-admiralty');
      // Timeline applied
      expect(transformedBody).toContain('rm-timeline--urgent');
      // Progressive disclosure is NOT applied by applyScannabilityTransforms
      // (it must be called separately after body splitting)
      expect(transformedBody).not.toContain('rm-disclosure');
      // TOC generated
      expect(tocHtml).toContain('rm-article-toc');
      // Methodology footer generated
      expect(methodologyFooterHtml).toContain('rm-methodology-footer');
    });
  });
});
