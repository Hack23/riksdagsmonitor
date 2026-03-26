# Quality Criteria Self-Assessment Rubric v2

<!-- version: 2.0.0 | updated: 2026-03-26 | author: Hack23 AB -->
<!-- Replaces: v1/quality-criteria.md -->
<!-- Enhancement: Adds classification badge validation, confidence label scoring, analysis integration checks -->

## Article Quality Self-Assessment

Before committing any generated article, score it against this rubric. Minimum passing score: **7/10**.

### Scoring Dimensions

#### 1. Factual Accuracy (0–2 points)
- **2**: All claims traceable to MCP data with document IDs; pre-computed analysis files used when available
- **1**: Most claims sourced; some analytical inferences without citation; analysis files not used despite availability
- **0**: Unverified claims, fabricated content, recycled old data, or pre-computed analysis ignored

#### 2. Analytical Depth (0–2 points)
- **2**: Intelligence-level analysis (strategic motivations, power dynamics, forward implications) with confidence labels on all analytical claims
- **1**: Standard reporting level (what happened with basic context); confidence labels on some claims
- **0**: Surface-level description only (lists events without analysis); no confidence labels

#### 3. Perspective Coverage (0–2 points)
- **2**: Government + Opposition + at least one other perspective covered; all perspectives attributed to named politicians
- **1**: Only government OR only opposition perspective
- **0**: Single perspective or no attribution to named politicians

#### 4. Translation Quality (0–2 points, non-EN/SV articles)
- **2**: Zero `data-translate="true"` spans; all headings in target language; confidence labels translated; classification badges rendered correctly (RTL for ar/he)
- **1**: 1–3 untranslated spans; confidence labels in English only; minor RTL issues
- **0**: Major sections in wrong language; CJK/RTL rendering broken; classification badges missing
- *For EN/SV articles*: 2 points automatically if no data-translate spans remain

#### 5. Editorial Standards (0–2 points)
- **2**: Proper headings hierarchy (h2→h3→h4); word count ≥ minimum for article type; "What to Watch Next" section present; classification badge present when classificationLevel set
- **1**: Minor structural issues; slightly below minimum word count; forward indicator present but lacks specificity
- **0**: Missing required sections; word count well below minimum; no forward indicator; no classification badge when required

### Scoring Formula

```
Total Score = Accuracy + Depth + Perspective + Translation + Editorial
Minimum Pass = 7/10
```

---

## New in v2: Classification and Analysis Validation

### Classification Badge Check

```bash
# Check for classification badge when article is HIGH or CRITICAL
ARTICLE_FILE="news/$(date +%Y-%m-%d)-<article-type>-<lang>.html"

grep -q 'classification-badge' "$ARTICLE_FILE" && echo "✅ Classification badge found" || echo "⚠️ Missing classification badge"
grep -q 'article:classification' "$ARTICLE_FILE" && echo "✅ Classification meta tag found" || echo "⚠️ Missing classification meta tag"
grep -q 'article:risk-level' "$ARTICLE_FILE" && echo "✅ Risk level meta tag found" || echo "⚠️ Missing risk level meta tag"
```

### Confidence Label Check

```bash
# Count confidence labels in article body
CONF_COUNT=$(grep -c '\[HIGH\]\|\[MEDIUM\]\|\[LOW\]' "$ARTICLE_FILE" || echo "0")
echo "Confidence labels found: $CONF_COUNT"
[ "$CONF_COUNT" -ge 3 ] && echo "✅ Sufficient confidence labeling" || echo "⚠️ Insufficient confidence labeling (minimum 3)"
```

### Pre-Computed Analysis Usage Check

```bash
# Check if pre-computed analysis was available and used
ANALYSIS_DATE=$(date +%Y-%m-%d)
ANALYSIS_DIR="analysis/daily/$ANALYSIS_DATE"

if [ -d "$ANALYSIS_DIR" ]; then
  echo "⚠️ Pre-computed analysis available — verify it was consumed"
  ls "$ANALYSIS_DIR"
else
  echo "ℹ️ No pre-computed analysis for $ANALYSIS_DATE (inline generation used)"
fi
```

### Forward Indicator Check

```bash
# Check for "What to Watch Next" section (mandatory)
grep -qi 'what.*to.*watch\|watch.*next\|forward.*indicator\|watch.*next\|nästa.*att.*bevaka' "$ARTICLE_FILE" && echo "✅ Forward indicator found" || echo "❌ Missing forward indicator (REQUIRED)"
```

---

## Extended Quick Self-Check Commands (v2)

```bash
# Set target article file (replace with actual generated file)
ARTICLE_FILE="news/$(date +%Y-%m-%d)-<article-type>-<lang>.html"

# Check for untranslated spans (should be 0 in non-SV articles)
grep -c 'data-translate="true"' "$ARTICLE_FILE" || echo "0"

# Check word count (verify against article type minimums)
sed 's/<[^>]*>/ /g' "$ARTICLE_FILE" | tr -s '[:space:]' '\n' | grep -c '[[:alnum:]]' || echo "0"

# Check heading count (minimum 3 h2 sections)
grep -c '<h2' "$ARTICLE_FILE" || echo "0"

# Check for "Why It Matters" or equivalent
grep -qi 'why.*matters\|varför.*spelar\|warum.*wichtig\|pourquoi.*importe\|por.*qué.*importa' "$ARTICLE_FILE" && echo "✅ Why It Matters found" || echo "❌ Missing Why It Matters"

# NEW v2: Check classification badge
grep -q 'classification-badge' "$ARTICLE_FILE" && echo "✅ Classification badge found" || echo "ℹ️ No classification badge"

# NEW v2: Check confidence labels (minimum 3)
CONF_COUNT=$(grep -oE '\[HIGH\]|\[MEDIUM\]|\[LOW\]' "$ARTICLE_FILE" | wc -l || echo "0")
echo "Confidence labels: $CONF_COUNT (minimum 3 for analytical articles)"

# NEW v2: Check forward indicator
grep -qi 'what.*to.*watch\|watch.*next' "$ARTICLE_FILE" && echo "✅ Forward indicator found" || echo "❌ Missing forward indicator"
```

---

## Article Type Word Count Minimums (v2)

| Article Type | Minimum Words | Maximum Words |
|---|---|---|
| `breaking` | 300 | 500 |
| `week-ahead` | 400 | 700 |
| `deep-inspection` | 800 | 1,200 |
| `weekly-review` | 800 | 1,200 |
| `monthly-review` | 1,000 | 1,800 |
| `committee-reports` | 500 | 800 |
| `propositions` | 600 | 900 |
| `motions` | 400 | 700 |
| `interpellations` | 400 | 700 |

---

## Iterative Improvement Protocol

If score < 7:
1. **First iteration**: Identify lowest-scoring dimension(s), regenerate those sections
2. **Second iteration**: Focus on remaining gaps; add missing confidence labels; verify classification badge
3. **Third iteration (maximum)**: If still < 7, add a quality warning to the article metadata

**Never publish an article scoring below 5/10.**
**Always attempt ≥ 2 iterations for articles with score < 8/10.**

---

## Disqualifying Patterns (Auto-Fail)

The following patterns automatically fail quality validation regardless of score:

- `"Filed by: Unknown (Unknown)"` — author data missing
- `data-translate="true"` in English/non-Swedish articles
- Identical "Why It Matters" text for 3+ entries
- Article word count below minimum for article type
- Missing language switcher navigation
- CSP header without `https:` allowance
- Inline JavaScript in article body
- **NEW v2**: Missing classification badge when `classificationLevel` is CRITICAL or HIGH
- **NEW v2**: Zero confidence labels in an analytical article (non-breaking)
- **NEW v2**: Missing "What to Watch Next" section for all article types

---

## Quality Metadata Convention (v2)

Always inject quality metadata in the article:

```html
<meta name="article-quality-score" content="8.5">
<meta name="article-quality-version" content="v2">
<meta name="article-iterations" content="2">
<meta name="article-analysis-used" content="true|false">
<meta name="article:classification" content="HIGH">
<meta name="article:risk-level" content="elevated">
<meta name="article:confidence" content="HIGH">
```

> **Note**: The `article-analysis-used` meta tag indicates whether pre-computed analysis files from `analysis/daily/YYYY-MM-DD/` were consumed. Set to `"true"` when analysis files were available and used.
