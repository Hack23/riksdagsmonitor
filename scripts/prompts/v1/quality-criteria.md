# Quality Criteria Self-Assessment Rubric v1

<!-- version: 1.0.0 | updated: 2026-03-14 | author: Hack23 AB -->

## Article Quality Self-Assessment

Before committing any generated article, score it against this rubric. Minimum passing score: **7/10**.

### Scoring Dimensions

#### 1. Factual Accuracy (0–2 points)
- **2**: All claims traceable to MCP data with document IDs
- **1**: Most claims sourced, some analytical inferences without citation
- **0**: Unverified claims, fabricated content, or recycled old data

#### 2. Analytical Depth (0–2 points)
- **2**: Intelligence-level analysis (strategic motivations, power dynamics, forward implications)
- **1**: Standard reporting level (what happened with basic context)
- **0**: Surface-level description only (lists events without analysis)

#### 3. Perspective Coverage (0–2 points)
- **2**: Government + Opposition + at least one other perspective covered
- **1**: Only government OR only opposition perspective
- **0**: Single perspective or no attribution to named politicians

#### 4. Translation Quality (0–2 points, non-EN/SV articles)
- **2**: Zero `data-translate="true"` spans, all headings in target language
- **1**: 1–3 untranslated spans (minor omissions)
- **0**: Major sections in wrong language, CJK/RTL rendering broken
- *For EN/SV articles*: 2 points automatically if no data-translate spans remain

#### 5. Editorial Standards (0–2 points)
- **2**: Proper headings hierarchy (h2→h3→h4), word count ≥ 500, "Why It Matters" section present
- **1**: Minor structural issues, word count 300–500
- **0**: Missing required sections, word count < 300, broken HTML structure

### Scoring Formula

```
Total Score = Accuracy + Depth + Perspective + Translation + Editorial
Minimum Pass = 7/10
```

### Iterative Improvement Protocol

If score < 7:
1. **First iteration**: Identify lowest-scoring dimension(s), regenerate those sections
2. **Second iteration**: Focus on remaining gaps, add missing analytical depth
3. **Third iteration (maximum)**: If still < 7, add a quality warning to the article metadata

**Never publish an article scoring below 5/10.**
**Always attempt ≥ 2 iterations for articles with score < 8/10.**

### Quick Self-Check Commands

```bash
# Check for untranslated spans (should be 0 in non-SV articles)
grep -c 'data-translate="true"' "$ARTICLE_FILE" || echo "0"

# Check word count (minimum 500)
sed 's/<[^>]*>/ /g' "$ARTICLE_FILE" | tr -s '[:space:]' '\n' | grep -c '[[:alnum:]]' || echo "0"

# Check heading count (minimum 3 h2 sections)
grep -c '<h2' "$ARTICLE_FILE" || echo "0"

# Check for "Why It Matters" or equivalent
grep -qi 'why.*matters\|varför.*spelar\|warum.*wichtig\|pourquoi.*importe\|por.*qué.*importa' "$ARTICLE_FILE" && echo "✅ Why It Matters found" || echo "❌ Missing Why It Matters"
```

### Disqualifying Patterns (Auto-Fail)

The following patterns automatically fail quality validation regardless of score:

- `"Filed by: Unknown (Unknown)"` — author data missing
- `data-translate="true"` in English/non-Swedish articles
- Identical "Why It Matters" text for 3+ entries
- Article word count < 300
- Missing language switcher navigation
- CSP header without `https:` allowance
- Inline JavaScript in article body

### Quality Metadata

After scoring, inject quality metadata into the article:
```html
<meta name="article-quality-score" content="8.5">
<meta name="article-quality-version" content="v1">
<meta name="article-iterations" content="2">
```

These are used by the quality monitoring dashboard to track generation quality over time.
