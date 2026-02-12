# 📰 News Workflow Architecture Diagram

## Current State (BROKEN)

```
┌─────────────────────────────────────────────────────────────────┐
│ GitHub Actions Workflow (.github/workflows/news-generation.yml) │
│                                                                   │
│  Schedule: Every 12 hours (00:00, 12:00 UTC)                    │
│  Check: Skip if last run < 11 hours ago                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ scripts/generate-news.js (PLACEHOLDER - DOES NOTHING)           │
│                                                                   │
│  ✅ Parses command-line args                                     │
│  ❌ Does NOT query MCP server                                    │
│  ❌ Does NOT generate articles                                   │
│  ✅ Saves metadata: "0 articles generated"                       │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ NO ARTICLES CREATED                                              │
│                                                                   │
│  Result: news/ directory unchanged                               │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ scripts/generate-sitemap.js (WORKS)                             │
│                                                                   │
│  ✅ Scans news/*.html (finds existing 16 articles)               │
│  ✅ Generates sitemap.xml with hreflang tags                     │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ CRITICAL PROBLEM: Index Pages NOT Updated                    │
│                                                                   │
│  news/index.html      → Hardcoded 8-article array                │
│  news/index_sv.html   → Hardcoded 8-article array                │
│  news/index_da.html   → Hardcoded 8-article array                │
│  ... (12 more files)  → Hardcoded 8-article array                │
│                                                                   │
│  Even if articles were generated, they'd be INVISIBLE!           │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Result: No PR created (0 articles generated)                     │
│                                                                   │
│  Workflow succeeds ✅ but does nothing useful                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Target State (FIXED)

```
┌─────────────────────────────────────────────────────────────────┐
│ GitHub Actions Workflow (.github/workflows/news-generation.yml) │
│                                                                   │
│  Schedule: Every 12 hours (00:00, 12:00 UTC)                    │
│  Check: Skip if last run < 11 hours ago                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ scripts/generate-news.js (FULLY IMPLEMENTED)                    │
│                                                                   │
│  ✅ Connects to riksdag-regering-mcp server                      │
│  ✅ Queries: get_calendar_events, search_dokument, etc.          │
│  ✅ Analyzes data, generates narrative                           │
│  ✅ Renders HTML using templates                                 │
│  ✅ Creates article pairs (EN + SV)                              │
│  ✅ Saves to news/YYYY-MM-DD-{slug}-{lang}.html                  │
│  ✅ Updates metadata/last-generation.json                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ NEWS ARTICLES CREATED (2-4 per run)                             │
│                                                                   │
│  news/2026-02-12-week-ahead-en.html     ✨ NEW                   │
│  news/2026-02-12-week-ahead-sv.html     ✨ NEW                   │
│  news/2026-02-12-committees-en.html     ✨ NEW                   │
│  news/2026-02-12-committees-sv.html     ✨ NEW                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ scripts/generate-news-indexes.js (NEW - CRITICAL FIX)          │
│                                                                   │
│  ✅ Scans news/ directory for *.html files                       │
│  ✅ Parses YAML frontmatter from HTML comments                   │
│  ✅ Extracts metadata (title, date, excerpt, topics, tags)       │
│  ✅ Groups articles by language (EN, SV)                         │
│  ✅ Renders news/index.html (EN articles)                        │
│  ✅ Renders news/index_sv.html (SV articles)                     │
│  ✅ Renders news/index_{lang}.html (other 12 languages)          │
│  ✅ Includes filtering, sorting, search features                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ INDEX PAGES DYNAMICALLY GENERATED                                │
│                                                                   │
│  news/index.html      → Shows 20+ EN articles (dynamic)          │
│  news/index_sv.html   → Shows 20+ SV articles (dynamic)          │
│  news/index_da.html   → Shows EN articles (fallback until DA)    │
│  ... (12 more files)  → Shows EN articles (fallback)             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ scripts/generate-sitemap.js (ENHANCED)                          │
│                                                                   │
│  ✅ Scans news/*.html (finds all articles)                       │
│  ✅ Supports 14 language suffixes (not just EN/SV)               │
│  ✅ Generates sitemap.xml with hreflang tags                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ PR Created with Generated Content                                │
│                                                                   │
│  Branch: news-generation/automated-{timestamp}                   │
│  Files Changed:                                                  │
│    - news/2026-02-12-week-ahead-{en,sv}.html                     │
│    - news/2026-02-12-committees-{en,sv}.html                     │
│    - news/index.html                                             │
│    - news/index_sv.html                                          │
│    - news/index_{da,de,es,...}.html (12 files)                   │
│    - sitemap.xml                                                 │
│    - news/metadata/last-generation.json                          │
│                                                                   │
│  Labels: automated-news, needs-editorial-review                  │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Editorial Review → Merge → Deploy to GitHub Pages               │
│                                                                   │
│  ✅ New articles visible immediately                             │
│  ✅ Indexes automatically updated                                │
│  ✅ Sitemap includes new articles                                │
│  ✅ SEO optimized, multilingual, accessible                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure Before vs After

### BEFORE (Current - 16 articles)

```
news/
├── index.html                 [458 lines] ⚠️ Hardcoded 8-article array
├── index_sv.html              [459 lines] ⚠️ Hardcoded 8-article array
├── index_{da,de,es,...}.html  [~500 lines each] ⚠️ Same hardcoded array
│
├── 2026-02-10-week-ahead-feb-10-17-en.html ✅ High quality
├── 2026-02-10-week-ahead-feb-10-17-sv.html ✅ High quality
├── 2026-02-10-pm-eu-summit-en.html         ✅ High quality
├── 2026-02-10-pm-eu-summit-sv.html         ✅ High quality
├── [...8 more article pairs...]
│
└── metadata/
    ├── last-generation.json   {"generated": 0, "note": "placeholder"}
    └── generation-result.json {"generated": 0, "errors": 0}
```

### AFTER (Fixed - 24+ articles)

```
news/
├── index.html                 [~500 lines] ✅ Dynamically generated
├── index_sv.html              [~500 lines] ✅ Dynamically generated
├── index_{da,de,es,...}.html  [~500 lines each] ✅ Dynamically generated
│
├── 2026-02-10-*.html          [16 files] ✅ Existing articles
├── 2026-02-12-*.html          [4 files]  ✨ NEW: Generated by workflow
├── 2026-02-14-*.html          [4 files]  ✨ NEW: Generated by workflow
├── [...future articles...]
│
└── metadata/
    ├── last-generation.json   {"generated": 2, "types": ["week-ahead"]}
    └── generation-result.json {"generated": 2, "errors": 0}
```

---

## Data Flow: MCP Server → Article → Index

```
┌──────────────────────────────────────────────────────────────┐
│ 1. MCP SERVER (riksdag-regering-mcp)                         │
│                                                               │
│    32 specialized tools for Swedish Parliament data:         │
│    - get_calendar_events()    → Upcoming meetings           │
│    - search_dokument()        → Bills, reports, motions     │
│    - get_betankanden()        → Committee reports           │
│    - search_anforanden()      → Parliamentary speeches      │
│    - search_voteringar()      → Voting records              │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     ▼ MCP Response (JSON)
┌──────────────────────────────────────────────────────────────┐
│ 2. DATA TRANSFORMATION (scripts/generate-news.js)            │
│                                                               │
│    analyzeWeekAhead(events, debates, questions)              │
│    ├── Extract significant events                            │
│    ├── Group by date                                         │
│    ├── Generate narrative structure                          │
│    └── Apply The Economist style                             │
│                                                               │
│    Output: Article data object                               │
│    {                                                          │
│      title: { en: "...", sv: "..." },                        │
│      excerpt: { en: "...", sv: "..." },                      │
│      sections: [...],                                        │
│      sources: ["get_calendar_events", ...]                   │
│    }                                                          │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     ▼ Article Data
┌──────────────────────────────────────────────────────────────┐
│ 3. TEMPLATE RENDERING (scripts/generate-news.js)             │
│                                                               │
│    renderArticleHTML(data, 'en')                             │
│    ├── Generate HTML5 structure                              │
│    ├── Add SEO metadata (Open Graph, Twitter Card)           │
│    ├── Include Schema.org NewsArticle                        │
│    ├── Add hreflang tags (EN ↔ SV)                           │
│    └── Embed YAML frontmatter (in HTML comment)              │
│                                                               │
│    Save to: news/2026-02-12-week-ahead-en.html               │
│    Save to: news/2026-02-12-week-ahead-sv.html               │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     ▼ HTML Files Created
┌──────────────────────────────────────────────────────────────┐
│ 4. INDEX GENERATION (scripts/generate-news-indexes.js)       │
│                                                               │
│    scanNewsDirectory()                                        │
│    ├── Find: news/*.html (exclude index*)                    │
│    ├── Parse: YAML frontmatter from each file                │
│    ├── Extract: title, date, excerpt, topics, tags           │
│    └── Group: By language (EN articles, SV articles)         │
│                                                               │
│    renderIndexHTML('en', enArticles)                          │
│    ├── Sort by date (newest first)                           │
│    ├── Generate article cards with metadata                  │
│    ├── Include filters (type, topic, date)                   │
│    └── Add pagination (20 per page)                          │
│                                                               │
│    Save to: news/index.html (EN)                             │
│    Save to: news/index_sv.html (SV)                          │
│    Save to: news/index_{lang}.html (other 12, fallback EN)   │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     ▼ Index Pages Generated
┌──────────────────────────────────────────────────────────────┐
│ 5. USER EXPERIENCE                                            │
│                                                               │
│    User visits: https://riksdagsmonitor.com/news/            │
│                                                               │
│    1. Loads: news/index.html (or index_sv.html)              │
│    2. Sees: Grid of 20+ article cards                        │
│    3. Filters: By type, topic, date                          │
│    4. Clicks: Article card                                   │
│    5. Reads: Full article (EN or SV version)                 │
│    6. Switches: Language via hreflang links                  │
│                                                               │
│    ✅ All articles automatically visible                      │
│    ✅ No manual updates required                             │
│    ✅ Fully automated pipeline                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Key Differences: Current vs Target

| Aspect | Current (Broken) | Target (Fixed) |
|--------|------------------|----------------|
| **Article Generation** | Placeholder only | Full MCP integration |
| **Index Updates** | Manual (hardcoded) | Automatic (dynamic) |
| **Workflow Result** | 0 articles generated | 2-4 articles per run |
| **New Article Visibility** | Hidden until manual update | Visible immediately |
| **Languages Supported** | 2 (EN, SV articles only) | 14 (all indexes functional) |
| **Automation Level** | 0% (manual everywhere) | 100% (fully automated) |
| **Scalability** | Limited to ~10 articles | Unlimited (scales to 1000+) |
| **Maintenance Burden** | High (manual updates) | Zero (self-maintaining) |

---

## The Critical Fix: generate-news-indexes.js

This ONE script fixes the entire automation pipeline:

```javascript
// Pseudo-code for the critical fix
async function generateNewsIndexes() {
  // 1. Scan news/ directory
  const articleFiles = fs.readdirSync('news/')
    .filter(f => f.endsWith('.html') && !f.startsWith('index'));
  
  // 2. Parse each article
  const articles = articleFiles.map(file => {
    const html = fs.readFileSync(`news/${file}`);
    const frontmatter = parseYAMLFromComment(html);
    const lang = file.match(/-(en|sv)\.html$/)[1];
    return { ...frontmatter, slug: file, lang };
  });
  
  // 3. Group by language
  const enArticles = articles.filter(a => a.lang === 'en');
  const svArticles = articles.filter(a => a.lang === 'sv');
  
  // 4. Generate index files
  fs.writeFileSync('news/index.html', renderIndex(enArticles, 'en'));
  fs.writeFileSync('news/index_sv.html', renderIndex(svArticles, 'sv'));
  
  // 5. Other languages (fallback to EN for now)
  for (const lang of ['da','de','es','fi','fr','nl','no','ar','he','ja','ko','zh']) {
    fs.writeFileSync(`news/index_${lang}.html`, renderIndex(enArticles, lang, 'en'));
  }
}
```

**This single script enables:**
- ✅ Fully automated article publication
- ✅ No manual index updates
- ✅ Scalable to 1000+ articles
- ✅ Multi-language support ready
- ✅ Self-maintaining system

---

**Diagram Created By:** Content Generator Agent  
**Full Report:** NEWS_WORKFLOW_ANALYSIS_REPORT.md  
**Executive Summary:** NEWS_WORKFLOW_EXECUTIVE_SUMMARY.md
