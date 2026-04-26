---
name: automated-content-generation
description: Template-based content generation, intelligence reports, and multi-language automated content
license: CC-BY-4.0
---

# Automated Content Generation Skill


## 🔴 AI FIRST Quality Principle

> **This skill MUST be applied with the AI FIRST principle: never accept first-pass quality. ALL analysis and content MUST go through minimum 2 complete iterations. After first pass, read ALL output back completely and systematically improve every section — strengthen evidence, deepen analysis, add specific citations, broaden perspectives. Spend ALL allocated time on real work. Single-pass output is NEVER acceptable. NO SHORTCUTS.**

## Purpose
Expert knowledge in automated content generation using templates, focusing on intelligence reports, news generation, and multi-language content.

## Core Principles
1. **Template-Based** - Reusable content templates
2. **Multi-Language** - Support for 14 languages
3. **Data-Driven** - Content generated from structured data
4. **Quality Assured** - Validation before publication
5. **SEO Optimized** - Search engine friendly content

## Enforces
- Markdown/HTML template engines
- Multi-language content generation (14 languages)
- Scheduled content generation (daily/weekly)
- Content validation and quality checks
- SEO meta tags and structured data
- RSS feed generation

## Content Types
- Intelligence reports
- News summaries
- Data analysis reports
- Multi-language translations
- Newsletter generation

## When to Use
- Automated news generation
- Intelligence report creation
- Multi-language content
- Scheduled content updates
- RSS feed generation

## References
- [Markdown Guide](https://www.markdownguide.org/)
- [SEO Best Practices](https://developers.google.com/search/docs)

---
**Version**: 1.0 | **Last Updated**: 2026-02-06 | **Category**: Development & Operations


---

## 🔗 Integration with agentic workflows & analysis artifacts

This skill is consumed by the 11 agentic news workflows in `.github/workflows/news-*.md`. The authoritative contract lives in [`.github/prompts/README.md`](../../prompts/README.md); this skill supplies domain expertise on top of that contract.

- **Analysis product** → [`ai-driven-analysis-guide.md`](../../../analysis/methodologies/ai-driven-analysis-guide.md) + every template in [`analysis/templates/`](../../../analysis/templates/).
- **Required before any article**: 9 core artifacts (14 for Tier-C) in `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`; [`05-analysis-gate.md`](../../prompts/05-analysis-gate.md) is the single blocking gate.
- **gh-aw v0.69.3** docs: [abridged](https://github.github.com/gh-aw/llms-small.txt) · [complete](https://github.github.com/gh-aw/llms-full.txt) · [blog series](https://github.github.com/gh-aw/_llms-txt/agentic-workflows.txt).
