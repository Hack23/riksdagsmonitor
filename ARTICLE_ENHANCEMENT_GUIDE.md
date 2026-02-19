# Article Enhancement Guide

**Version:** 2.0  
**Last Updated:** 2026-02-19  
**Classification:** Public  
**Owner:** Hack23 AB  
**Repository:** [Hack23/riksdagsmonitor](https://github.com/Hack23/riksdagsmonitor)

---

## 📋 Overview

This guide documents the complete workflow for generating, enhancing, translating, and publishing news articles on Riksdagsmonitor. It consolidates proven patterns from Issues [#306–#334](https://github.com/Hack23/riksdagsmonitor/issues) and successful PRs [#307](https://github.com/Hack23/riksdagsmonitor/pull/307), [#312](https://github.com/Hack23/riksdagsmonitor/pull/312), [#313](https://github.com/Hack23/riksdagsmonitor/pull/313), [#314](https://github.com/Hack23/riksdagsmonitor/pull/314), [#326](https://github.com/Hack23/riksdagsmonitor/pull/326), [#333](https://github.com/Hack23/riksdagsmonitor/pull/333), and [#334](https://github.com/Hack23/riksdagsmonitor/pull/334) that collectively enhanced 176 articles.

---

## 🗺️ Architecture Overview

```
riksdag-regering-mcp (32 tools)
         │
         ▼
scripts/generate-daily-news.js   ← nightly orchestrator
         │  (decides which types to generate based on doc count ≥ threshold)
         ▼
scripts/generate-news-enhanced.js ← multi-language article engine
         │
         ├── scripts/mcp-client.js         ← MCP transport layer
         ├── scripts/data-transformers.js  ← semantic transformation
         ├── scripts/article-template.js   ← HTML generation
         ├── scripts/editorial-pillars.js  ← 5-pillar content strategy
         └── scripts/news-types/           ← per-type generators
                   ├── committee-reports.js
                   ├── propositions.js
                   ├── motions.js
                   ├── week-ahead.js
                   └── breaking-news.js

Output: news/YYYY-MM-DD-{type}-{lang}.html (× 14 languages)
        news/metadata/daily-report.json
        sitemap.xml (updated by update-news-indexes-and-sitemap.py)
```

---

## 🚀 Quick Start

### Automated Nightly Generation (Recommended)

The workflow runs automatically at **02:00 CET** via GitHub Actions:

```bash
# Trigger manually via GitHub CLI
gh workflow run nightly-news-generation.yml

# With options
gh workflow run nightly-news-generation.yml \
  -f languages=all \
  -f threshold=5 \
  -f types=committee-reports,propositions,motions,week-ahead
```

### Manual Generation (Local)

```bash
# Install dependencies
npm ci

# Generate today's news (all languages, threshold=5)
node scripts/generate-daily-news.js --languages=all --threshold=5

# Generate with custom date window
node scripts/generate-daily-news.js --date=2026-02-18 --languages=nordic

# Generate specific types only
node scripts/generate-daily-news.js --types=committee-reports,propositions

# Dry run (no files written)
node scripts/generate-daily-news.js --dry-run --languages=en
```

### Legacy Enhanced Generator

```bash
# Direct invocation (used internally by generate-daily-news.js)
node scripts/generate-news-enhanced.js \
  --types=week-ahead,committee-reports,propositions,motions \
  --languages=all \
  --skip-existing
```

---

## 📐 Step-by-Step Workflow

### Step 1: Fetch Documents from MCP

The nightly script queries the **riksdag-regering-mcp** server for documents published since yesterday.

```javascript
// Internal implementation in scripts/generate-daily-news.js
const result = await client.request('search_dokument', {
  doktyp:    'bet',         // 'bet' | 'prop' | 'mot'
  from_date: '2026-02-18', // yesterday
  limit:     100
});
```

**Document type codes:**

| Code | Article type | Swedish | Description |
|------|-------------|---------|-------------|
| `bet` | `committee-reports` | Betänkanden | Committee reports |
| `prop` | `propositions` | Propositioner | Government bills |
| `mot` | `motions` | Motioner | Parliamentary motions |

### Step 2: Apply Document Threshold

Generation only proceeds when **≥ 5 documents** of a type are found (configurable via `--threshold`).  This prevents sparse daily articles that lack analytical value.

```bash
✅ 'committee-reports': 9 documents ≥ threshold (5) → will generate
⏭️  'propositions':     3 documents < threshold (5) → skipping
✅ 'motions':           7 documents ≥ threshold (5) → will generate
```

### Step 3: Enrich Documents with MCP Content

For each document the generator calls `get_dokument_innehall` to fetch the full text, which enables 150–400 word analysis sections.

```javascript
// Handled by MCPClient.enrichDocumentsWithContent()
reports = await client.enrichDocumentsWithContent(reports, 3); // max 3 docs enriched
```

### Step 4: Generate Articles (14 Languages)

The enhanced generator produces one HTML file per language:

```
news/2026-02-19-committee-reports-en.html
news/2026-02-19-committee-reports-sv.html
news/2026-02-19-committee-reports-da.html
... (14 files total)
```

Each file contains:
- Semantic HTML5 with WCAG 2.1 AA compliance
- Schema.org `NewsArticle` structured data (JSON-LD)
- Correct `<html lang="...">` and `dir="rtl"` for Arabic/Hebrew
- hreflang links to all 14 language versions
- Cyberpunk theme via external `styles.css`

### Step 5: Update Indexes and Sitemap

```bash
# Run after generation
python3 scripts/update-news-indexes-and-sitemap.py

# Or via npm scripts
node scripts/generate-news-indexes.js
node scripts/generate-sitemap.js
```

The index updater:
1. Scans all `news/*.html` files
2. Extracts metadata (title, description, date, language)
3. Updates all 14 `index_*.html` files with current article lists
4. Regenerates `sitemap.xml` with ~574 URLs (articles + API docs + coverage)

### Step 6: Validate HTML

```bash
# Validate generated files
npx htmlhint news/2026-02-19-*.html

# Or full validation
npm run htmlhint
```

### Step 7: Create Pull Request

The workflow automatically creates a PR via `peter-evans/create-pull-request`:

```
Branch:  auto/daily-news-2026-02-19
Title:   📰 Daily news: 2026-02-19
Labels:  automated-pipeline, news-article, content
```

---

## 🔧 MCP Tool Reference (All 32 Tools)

The `MCPClient` in `scripts/mcp-client.js` provides typed wrappers for all 32 tools.

### Riksdag Tools (15 tools)

#### 1. `get_ledamoter` — MP list

```javascript
const mps = await client.request('get_ledamoter', { limit: 50 });
```

#### 2. `get_ledamot` — MP details

```javascript
const mp = await client.request('get_ledamot', { intressent_id: '0980680893021' });
```

#### 3. `search_ledamoter` — MP search

```javascript
const results = await client.request('search_ledamoter', {
  parti: 'S',       // S, M, SD, V, MP, C, L, KD
  valkrets: 'Stockholm'
});
```

#### 4. `get_motioner` — All motions

```javascript
const motions = await client.request('get_motioner', {
  rm: '2025/26',
  limit: 20
});
```

#### 5. `search_dokument` — Document search

```javascript
const docs = await client.request('search_dokument', {
  doktyp:    'bet',          // bet | prop | mot | skr | sou
  from_date: '2026-02-18',
  limit:     50
});
```

#### 6. `search_dokument_fulltext` — Full-text search

```javascript
const results = await client.request('search_dokument_fulltext', {
  query: 'klimat energi',
  limit: 20
});
```

#### 7. `get_dokument` — Specific document

```javascript
const doc = await client.request('get_dokument', {
  dok_id: 'H901FiU1',
  include_full_text: false
});
```

#### 8. `get_dokument_innehall` — Document content + summary

```javascript
const content = await client.request('get_dokument_innehall', {
  dok_id: 'H901FiU1',
  include_full_text: false
});
```

#### 9. `get_propositioner` — Recent propositions

```javascript
const props = await client.request('get_propositioner', {
  rm: '2025/26',
  limit: 10
});
```

#### 10. `get_betankanden` — Recent committee reports

```javascript
const reports = await client.request('get_betankanden', {
  organ: 'FiU',   // Committee code, optional
  limit: 10
});
```

#### 11. `get_fragor` — Written questions

```javascript
const questions = await client.request('get_fragor', {
  rm: '2025/26',
  limit: 10
});
```

#### 12. `get_interpellationer` — Interpellations

```javascript
const interpellations = await client.request('get_interpellationer', {
  rm: '2025/26',
  limit: 10
});
```

#### 13. `search_voteringar` — Vote search

```javascript
const votes = await client.request('search_voteringar', {
  rm:    '2025/26',
  parti: 'S',
  rost:  'Nej',     // Ja | Nej | Avstår | Frånvarande
  limit: 20
});
```

#### 14. `search_anforanden` — Speech search

```javascript
const speeches = await client.request('search_anforanden', {
  talare: 'Ulf Kristersson',
  rm:     '2025/26',
  limit:  10
});
```

#### 15. `get_calendar_events` — Parliamentary calendar

```javascript
const events = await client.request('get_calendar_events', {
  from:  '2026-02-24',
  tom:   '2026-03-01',
  limit: 200
});
```

### Government Tools (7 tools)

#### 16. `search_regering` — Government document search

```javascript
const govDocs = await client.request('search_regering', {
  title:    'klimat',
  dateFrom: '2026-01-01',
  dateTo:   '2026-02-19',
  limit:    10
});
```

#### 17. `get_regering_document` — Government document

```javascript
const doc = await client.request('get_regering_document', {
  document_id: 'klimat-och-miljo-2026',
  type:         'propositioner'
});
```

#### 18. `summarize_regering_document` — Document summary

```javascript
const summary = await client.request('summarize_regering_document', {
  document_id: 'klimat-och-miljo-2026',
  max_length:  500
});
```

#### 19. `get_g0v_document_content` — Markdown content

```javascript
const markdown = await client.request('get_g0v_document_content', {
  regeringenUrl: 'https://www.regeringen.se/...'
});
```

#### 20. `get_g0v_document_types` — Available document types

```javascript
const types = await client.request('get_g0v_document_types', {});
```

#### 21. `get_g0v_category_codes` — Category codes

```javascript
const codes = await client.request('get_g0v_category_codes', {});
```

#### 22. `analyze_g0v_by_department` — Department analysis

```javascript
const analysis = await client.request('analyze_g0v_by_department', {
  dateFrom: '2026-01-01',
  dateTo:   '2026-02-19'
});
```

### Statistical & Metadata Tools (5 tools)

#### 23. `get_utskott` — Committee list

```javascript
const committees = await client.request('get_utskott', {});
```

#### 24. `get_sync_status` — Server health check

```javascript
const status = await client.request('get_sync_status', {});
// Response: { last_sync: '2026-02-19T01:00:00Z', status: 'ok' }
```

#### 25. `get_data_dictionary` — Field descriptions

```javascript
const dict = await client.request('get_data_dictionary', {
  dataset: 'dokument'  // optional
});
```

#### 26. `fetch_paginated_documents` — Paginated document retrieval

```javascript
const page = await client.request('fetch_paginated_documents', {
  doktyp:   'bet',
  rm:       '2025/26',
  page:     1,
  pageSize: 50
});
```

#### 27. `fetch_paginated_anforanden` — Paginated speeches

```javascript
const page = await client.request('fetch_paginated_anforanden', {
  parti:    'M',
  rm:       '2025/26',
  page:     1,
  pageSize: 100
});
```

### Aggregation Tools (5 tools)

#### 28. `enhanced_government_search` — Combined search

```javascript
const results = await client.request('enhanced_government_search', {
  query:              'bostadspolitik',
  includeRegeringen:  true,
  limit:              20,
  regeringenLimit:    5
});
```

#### 29. `get_voting_group` — Group vote results

```javascript
const groups = await client.request('get_voting_group', {
  bet:     'FiU10',
  punkt:   '1',
  groupBy: 'parti'   // parti | valkrets | namn
});
```

#### 30. `batch_fetch_documents` — Multi-session fetch

```javascript
const batch = await client.request('batch_fetch_documents', {
  doktyp:         'bet',
  riksmoten:      ['2024/25', '2025/26'],
  maxPerRiksmote: 100
});
```

#### 31. `list_reports` — Available reports

```javascript
const reports = await client.request('list_reports', {});
```

#### 32. `fetch_report` — Named report

```javascript
const report = await client.request('fetch_report', {
  report: 'ledamotsstatistik',  // ledamotsstatistik | kontaktutskott | ...
  limit:  200
});
```

---

## 📝 Content Quality Standards

### Word Count Targets

| Article type | Target | Minimum | Maximum |
|-------------|--------|---------|---------|
| Week Ahead | 250 | 150 | 400 |
| Committee Reports | 300 | 150 | 400 |
| Government Propositions | 350 | 200 | 400 |
| Opposition Motions | 300 | 150 | 400 |
| Breaking News | 200 | 100 | 300 |

### The Economist Style Guidelines

1. **Lede paragraph** — 2–3 sentences. State the most newsworthy fact first.
2. **H2 sections** — Use 3–5 thematic sections per article.
3. **H3 subsections** — Use sparingly; maximum 2 per H2.
4. **No bullet lists** in body text — use prose instead.
5. **Tone** — Formal, analytical, neutral. Avoid partisan framing.
6. **Numbers** — Spell out one through ten; use digits for 11 and above.
7. **Dates** — Use `DD Month YYYY` format (e.g., `19 February 2026`).
8. **Attribution** — Always attribute: "according to the Finance Committee" not "reportedly".

### Article Structure Template

```html
<!-- Lede: most important fact in 2-3 sentences -->
<p class="lede">…</p>

<h2>Context</h2>
<p>…background and significance…</p>

<h2>Key Developments</h2>
<p>…specific documents/events covered…</p>

<h2>Policy Implications</h2>
<p>…analysis of impact…</p>

<h2>Watch Points</h2>
<ul>
  <li>…item 1…</li>
  <li>…item 2…</li>
</ul>

<h2>Looking Ahead</h2>
<p>…next steps, upcoming votes, deadlines…</p>
```

### Schema.org NewsArticle Requirements

Every article **must** include synchronized metadata in four locations:

```html
<!-- 1. Meta description -->
<meta name="description" content="DESCRIPTION">

<!-- 2. Open Graph -->
<meta property="og:description" content="DESCRIPTION">

<!-- 3. Twitter Card -->
<meta name="twitter:description" content="DESCRIPTION">

<!-- 4. JSON-LD -->
<script type="application/ld+json">
{
  "@type": "NewsArticle",
  "headline": "TITLE",
  "description": "DESCRIPTION",   <!-- must match meta description -->
  "wordCount": 300,
  "inLanguage": "en"
}
</script>
```

All four description fields **must be identical**. See PR #307 for the fix script (`scripts/fix-pr-review-comments.py`) when they drift.

---

## 🌐 Translation Workflow (14 Languages)

### Language Codes and File Patterns

| Language | Code | File suffix | Direction |
|----------|------|-------------|-----------|
| English | `en` | `-en.html` | LTR (master) |
| Swedish | `sv` | `-sv.html` | LTR |
| Danish | `da` | `-da.html` | LTR |
| Norwegian | `no` | `-no.html` | LTR |
| Finnish | `fi` | `-fi.html` | LTR |
| German | `de` | `-de.html` | LTR |
| French | `fr` | `-fr.html` | LTR |
| Spanish | `es` | `-es.html` | LTR |
| Dutch | `nl` | `-nl.html` | LTR |
| Arabic | `ar` | `-ar.html` | **RTL** |
| Hebrew | `he` | `-he.html` | **RTL** |
| Japanese | `ja` | `-ja.html` | LTR |
| Korean | `ko` | `-ko.html` | LTR |
| Chinese | `zh` | `-zh.html` | LTR |

### Automated Translation (Built-in)

The enhanced generator creates all 14 language files automatically. Run:

```bash
node scripts/generate-news-enhanced.js --types=committee-reports --languages=all
```

### Manual Translation Improvement

When improving machine-generated translations:

```
1. Update title/meta/OG/Twitter metadata
2. Replace full article body with translated text
   - Maintain H2/H3 structure
   - Match word count targets (150–400 words)
   - Apply The Economist style
3. Update Schema.org (headline, description, wordCount)
4. Update navigation: "← Back to News" with localized text:
   - Swedish:  "← Tillbaka till nyheter"
   - Danish:   "← Tilbage til nyheder"
   - Norwegian:"← Tilbake til nyheter"
   - Finnish:  "← Takaisin uutisiin"
   - German:   "← Zurück zu den Nachrichten"
   - French:   "← Retour aux actualités"
   - Spanish:  "← Volver a las noticias"
   - Dutch:    "← Terug naar nieuws"
   - Arabic:   "← العودة إلى الأخبار"
   - Hebrew:   "← חזרה לחדשות"
   - Japanese: "← ニュースに戻る"
   - Korean:   "← 뉴스로 돌아가기"
   - Chinese:  "← 返回新闻"
5. Validate with HTMLHint
6. Commit individually per language
```

**⚠️ Critical:** The `generate-content-based-titles.py` script defaults to `--english-only` mode. Use `--overwrite-translations` with interactive `YES` confirmation only when intentionally replacing professional translations.

### Translation Workflow Order (Efficiency)

Process languages in this order for maximum efficiency:
1. **English** (master/source)
2. **Swedish** (closest to source material)
3. **Danish** (similar to Swedish, ~10 min)
4. **Norwegian** (similar to Danish, ~10 min)
5. **Finnish** (independent, ~15 min)
6. **German, French, Spanish, Dutch** (~15 min each)
7. **Arabic, Hebrew** (RTL — require `dir="rtl"` on `<html>`, ~20 min each)
8. **Japanese, Korean, Chinese** (~15 min each)

### RTL Languages Special Requirements

For Arabic (`ar`) and Hebrew (`he`) articles:

```html
<html lang="ar" dir="rtl">
<!-- OR -->
<html lang="he" dir="rtl">
```

CSS variables from `styles.css` handle the rest automatically — no inline styles needed.

---

## ✅ Validation Checklist

### Pre-Commit (Manual)

```bash
# 1. HTML validation (zero errors required)
npx htmlhint news/YYYY-MM-DD-*.html

# 2. Link checking (internal links)
python3 -m http.server 8080 &
linkinator http://localhost:8080/news/ --recurse --skip "http://localhost:8080/docs"

# 3. Schema.org consistency check
grep -h '"description"' news/YYYY-MM-DD-*.html | sort | uniq -c

# 4. Word count check (aim for 150-400 words)
for f in news/YYYY-MM-DD-*-en.html; do
  wc=$(cat "$f" | sed 's/<[^>]*>//g' | wc -w)
  echo "$f: $wc words"
done
```

### Post-Commit (Automated CI)

The `quality-checks.yml` workflow validates:
- ✅ HTMLHint on all `*.html` and `news/*.html`
- ✅ ESLint on all `*.js` scripts
- ✅ Translation consistency (`validate-translations.js`)
- ✅ News translation completeness (`validate-news-translations.js`)

---

## 🔄 Index and Sitemap Update

After generating new articles, always run the index updater:

```bash
python3 scripts/update-news-indexes-and-sitemap.py
```

This script:
1. Scans all `news/*.html` files (currently ~347 articles)
2. Extracts metadata: title, description, date, language
3. Updates all 14 `index_*.html` files with article lists
4. Regenerates `sitemap.xml` with all URLs including:
   - News articles (priority 0.4–0.8, age-based)
   - API documentation in `docs/api/` (priority 0.5)
   - Test coverage in `docs/coverage/` (priority 0.4)
   - Root pages (priority 0.9–1.0)

**Sitemap priorities:**

| URL type | Priority |
|----------|----------|
| `index.html` (English) | 1.0 |
| `index_sv.html` (Swedish) | 0.9 |
| Recent news (< 7 days) | 0.8 |
| Nordic language indexes | 0.7 |
| Other language indexes | 0.6 |
| `docs/api/` pages | 0.5 |
| Old articles + coverage | 0.4 |

---

## 🐛 Common Pitfalls

### 1. MCP Server Cold Start (30–60 s)

**Problem:** First request fails with timeout.

**Solution:** The `generate-daily-news.js` script warm-up step sends `get_sync_status` before any data queries.  Set `MCP_CLIENT_TIMEOUT_MS=90000` in CI.

### 2. Inconsistent Schema.org Descriptions

**Problem:** `meta description` and `NewsArticle.description` differ.

**Solution:** Always update all four fields together (meta, og:description, twitter:description, JSON-LD description). Use `scripts/fix-pr-review-comments.py` pattern for bulk fixes.

### 3. English UI on Non-English Pages

**Problem:** Non-English articles show "← Back to News" in English.

**Solution:** Use language-specific navigation strings (see Translation Workflow section above).

### 4. Professional Translation Overwrite

**Problem:** Script accidentally overwrites human-translated articles.

**Solution:** `scripts/generate-content-based-titles.py` requires `--overwrite-translations` flag with interactive `YES` confirmation. Default `--english-only` mode is safe.

### 5. PR Format-Patch Size Limit

**Problem:** PRs with 50+ changed files fail with `ENOBUFS` when `sitemap.xml` diff exceeds 1 MB.

**Solution:** Commit sitemap updates separately from article files, or use the nightly workflow which handles this automatically.

### 6. Missing Article Threshold

**Problem:** Articles generated with only 1–2 documents provide no analytical value.

**Solution:** Use `--threshold=5` (default in `generate-daily-news.js`). Adjust only for breaking news (`--threshold=1`).

### 7. Hard-coded Absolute Paths

**Problem:** Scripts with `/home/runner/work/…` paths fail in local environments.

**Solution:** Always use `Path('news')` (relative) or `path.join(__dirname, '..', 'news')` patterns. See `scripts/generate-daily-news.js` as reference.

### 8. Merge Conflicts with Professional Translations

**Problem:** Auto-generated articles conflict with human translations in PR.

**Solution:** Always accept the professional translation (`--theirs` for the specific file). Professional translations are canonical; auto-generated content is a starting point only.

---

## 📊 5 Editorial Pillars Framework

All generated content aligns with the five pillars defined in `scripts/editorial-pillars.js`:

| Pillar | Focus | Primary types |
|--------|-------|---------------|
| 1. Parliamentary Pulse | Main legislative developments | committee-reports, propositions |
| 2. Government Watch | Executive announcements | propositions |
| 3. Opposition Dynamics | Cross-party positioning | motions |
| 4. Committee Intelligence | Specialist analysis | committee-reports |
| 5. Looking Ahead | Political forecasting | week-ahead |

---

## 🔒 Security and Compliance

### Authentication

```bash
# Set MCP auth token (optional, but required for production)
export MCP_AUTH_TOKEN="Bearer your-token-here"

# Or via GitHub Secrets (recommended)
# Repository Settings → Secrets → MCP_AUTH_TOKEN
```

The `mcp-client.js` reads from `process.env.MCP_AUTH_TOKEN`.  Never commit tokens to source code.

### GDPR Compliance

All generated content covers:
- **Public officials in official capacity only** — no personal data processing
- **Right to be forgotten not applicable** — historical parliamentary records
- **Purpose limitation** — journalism and democratic transparency only
- **Data minimization** — process only publicly available parliamentary data

Legal basis: Article 6(1)(e) GDPR — processing in the public interest.

### Data Quality

The MCP server is the **single authoritative source**. Always:
1. Validate document IDs against official Riksdagen records
2. Cross-reference document titles with `dok_id` field
3. Use `get_dokument` for definitive metadata when in doubt

---

## 📚 Related Documentation

| Document | Purpose |
|----------|---------|
| `NEWS_ARTICLE_STYLING_GUIDE.md` | HTML/CSS styling conventions |
| `TRANSLATION_GUIDE.md` | Translation terminology tables |
| `COMMITTEE_REPORTS_TRANSLATION_WORKFLOW.md` | Committee reports specific workflow |
| `WORKFLOWS.md` | GitHub Actions workflow overview |
| `TESTING.md` | Test suite documentation |
| `scripts/generate-daily-news.js` | Nightly generation orchestrator |
| `scripts/generate-news-enhanced.js` | Multi-language article engine |
| `scripts/mcp-client.js` | MCP transport layer (all 32 tools) |
| `scripts/article-template.js` | HTML template generator |
| `scripts/update-news-indexes-and-sitemap.py` | Index and sitemap updater |
| `.github/workflows/nightly-news-generation.yml` | Automated nightly workflow |

---

## 🗓️ Proven Patterns from Issues #306–334

### Pattern: Bulk Enhancement Script

For systematic enhancement of multiple articles (e.g., 176 articles across Issues #306–334):

```python
# scripts/enhance-batch-articles.py pattern
ARTICLES = {
  '2026-02-14': {
    'bet': [
      {'id': 'H801AU10', 'title': 'Arbetsmarknadsfrågor', 'dept': 'AU', 'date': '2026-02-14'}
    ]
  }
}

for date, types in ARTICLES.items():
  for doctype, docs in types.items():
    enhance_article(date, doctype, docs)
```

See `scripts/enhance-2026-02-19-articles.py` for a complete example.

### Pattern: Content-Based Titles

Generate titles from actual document content rather than generic templates:

```python
# scripts/generate-content-based-titles.py --english-only
# Generates: "Finance Committee Approves 2026 Budget Framework"
# Instead of: "Committee Reports: Parliamentary Priorities This Week"
```

Run with `--english-only` (safe default) before any PR.  Requires `--overwrite-translations` with `YES` confirmation to update translated files.

### Pattern: Post-Generation Validation

After every batch generation, run the full validation pipeline:

```bash
# 1. HTMLHint (zero errors required)
npm run htmlhint

# 2. Translation consistency
npm run validate-news

# 3. Index/sitemap update
python3 scripts/update-news-indexes-and-sitemap.py

# 4. Commit in logical groups (< 1 MB per commit to stay within safe-outputs limits)
git add news/2026-02-19-*.html
git commit -m "news: 2026-02-19 committee reports (14 languages)"

git add index*.html sitemap.xml
git commit -m "chore: update indexes and sitemap for 2026-02-19"
```

---

*Last Updated: 2026-02-19 | Issues: #306–339 | PRs: #307, #312, #313, #314, #326, #333, #334*
