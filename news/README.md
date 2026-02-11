# 📰 Automated News Generation System

## Overview

This directory contains an automated news generation system that produces **The Economist-style** political journalism for the Riksdagsmonitor platform. The system integrates with the **riksdag-regering-mcp** server (32 specialized tools) to generate timely, accurate news articles about Swedish Parliament (Riksdag) and Government (Regering).

## Architecture

### Components

1. **News Index** (`news/index.html`)
   - Article listing with filtering and sorting
   - Responsive design (320px-1440px+)
   - Integration with existing news posts

2. **GitHub Actions Workflow** (`.github/workflows/news-generation.yml`)
   - Runs every 12 hours (00:00 UTC, 12:00 UTC)
   - Uses riksdag-regering-mcp for data
   - Creates PRs with generated articles
   - Includes validation and quality checks

3. **News Generation Script** (`scripts/generate-news.js`)
   - Queries riksdag-regering-mcp for updates
   - Generates articles from templates
   - Supports 5 article types
   - Multi-language generation (EN/SV)

4. **Sitemap Generator** (`scripts/generate-sitemap.js`)
   - Automatically updates sitemap.xml
   - Proper hreflang tags
   - Language grouping

## Article Types

### 1. Week Ahead (Prospective)
**Frequency:** Weekly (Monday morning)  
**MCP Tools:**
- `get_calendar_events` - Upcoming parliamentary events
- `search_dokument` - Scheduled bills and debates
- `get_utskott` - Committee schedules

**Example Output:**
```
Week Ahead: Brussels Summit Tests Swedish EU Strategy
- Critical week for Swedish European policy...
```

### 2. Committee Reports (Analysis)
**Frequency:** As published (typically weekly)  
**MCP Tools:**
- `get_betankanden` - Latest committee reports
- `search_dokument` - Report content
- `get_utskott` - Committee information

**Example Output:**
```
Committee Reports February 2026
- Parliamentary committees deliver comprehensive reports...
```

### 3. Government Propositions (Analysis)
**Frequency:** As published (weekly/bi-weekly)  
**MCP Tools:**
- `get_propositioner` - Government bills
- `search_regering` - Government documents
- `get_dokument` - Full proposition text

**Example Output:**
```
Government Propositions February 2026
- Policy offensive across financial supervision...
```

### 4. Opposition Motions (Analysis)
**Frequency:** As filed (typically weekly)  
**MCP Tools:**
- `get_motioner` - Opposition motions
- `search_ledamoter` - MP information
- `search_dokument` - Motion content

**Example Output:**
```
Opposition Motions February 2026
- Opposition parties intensify legislative pressure...
```

### 5. Breaking News (Event-Driven)
**Frequency:** On-demand (significant events)  
**MCP Tools:**
- `search_anforanden` - Major debates
- `search_voteringar` - Critical votes
- `get_calendar_events` - Urgent meetings
- `search_regering` - Government announcements

**Example Output:**
```
Prime Minister Faces Parliament Before Brussels Summit
- In rare open EU Committee meeting...
```

## riksdag-regering-mcp Integration

### Available Tools (32 total)

#### Document Search
```javascript
// Search all Riksdag documents
await mcp.search_dokument({
  query: "klimatlag",
  doktyp: "prop",  // propositioner (government bills)
  rm: "2025/26",   // riksmöte (parliamentary session)
  limit: 10
});

// Get specific document
await mcp.get_dokument({
  dok_id: "HD03105",
  include_full_text: false
});
```

#### Calendar & Events
```javascript
// Get upcoming events
await mcp.get_calendar_events({
  from: "2026-02-10",
  tom: "2026-02-17",
  org: "UU",  // Utrikesutskottet (Foreign Affairs Committee)
  limit: 50
});
```

#### Parliament Activity
```javascript
// List recent propositions
await mcp.get_propositioner({
  rm: "2025/26",
  limit: 20
});

// Get committee reports
await mcp.get_betankanden({
  rm: "2025/26",
  organ: "FiU",  // Finansutskottet (Finance Committee)
  limit: 20
});

// Get opposition motions
await mcp.get_motioner({
  rm: "2025/26",
  limit: 20
});
```

#### MPs & Voting
```javascript
// Search MPs
await mcp.search_ledamoter({
  namn: "Kristersson",
  parti: "M",
  status: "tjänstgörande"
});

// Search votes
await mcp.search_voteringar({
  rm: "2025/26",
  bet: "2025/26:FiU10",
  groupBy: "parti"
});
```

#### Debates
```javascript
// Search speeches
await mcp.search_anforanden({
  talare: "Ulf Kristersson",
  rm: "2025/26",
  text: "ekonomi",
  limit: 10
});
```

#### Government Documents
```javascript
// Search government documents
await mcp.search_regering({
  title: "klimat",
  type: "propositioner",
  departement: "Miljödepartementet",
  dateFrom: "2026-01-01",
  dateTo: "2026-02-28",
  limit: 10
});

// Get government document content
await mcp.get_g0v_document_content({
  regeringenUrl: "https://www.regeringen.se/..."
});
```

### Integration Pattern

```javascript
// Example: Generate Week Ahead article

async function generateWeekAhead() {
  // 1. Get upcoming events
  const events = await mcp.get_calendar_events({
    from: getMonday(),
    tom: getSunday(),
    limit: 100
  });
  
  // 2. Get scheduled debates
  const debates = await mcp.search_dokument({
    from_date: getMonday(),
    to_date: getSunday(),
    doktyp: "deb",
    limit: 50
  });
  
  // 3. Get ministerial question times
  const questions = await mcp.get_fragor({
    rm: getCurrentSession(),
    limit: 20
  });
  
  // 4. Generate article content
  const article = {
    title: `Week Ahead: ${getWeekRange()}`,
    date: new Date().toISOString(),
    type: 'prospective',
    content: renderTemplate({
      events,
      debates,
      questions
    })
  };
  
  // 5. Write article files (EN/SV)
  await writeArticle(article, 'en');
  await writeArticle(article, 'sv');
  
  return article;
}
```

## Workflow Details

### Schedule
```yaml
schedule:
  - cron: '0 0,12 * * *'  # Every 12 hours
```

**Runs at:**
- 00:00 UTC (01:00 CET / 02:00 CEST)
- 12:00 UTC (13:00 CET / 14:00 CEST)

### Workflow Steps

1. **Check Updates**
   - Verify last generation time
   - Skip if < 11 hours since last run (unless forced)

2. **Generate Articles**
   - Query riksdag-regering-mcp
   - Generate article content
   - Write HTML files (EN/SV)
   - Update metadata

3. **Update Sitemap**
   - Scan news/ directory
   - Generate sitemap.xml
   - Include hreflang tags
   - Validate XML

4. **Validate Content**
   - HTML validation
   - Link checking
   - Accessibility audit (future)

5. **Create Pull Request**
   - Branch: `news-generation/automated-{run_number}`
   - Label: `automated-news`, `needs-editorial-review`
   - Assignee: `news-journalist`

### Manual Triggering

Via GitHub Actions UI:
1. Go to Actions → Automated News Generation
2. Click "Run workflow"
3. Options:
   - `force_generation`: Override time check
   - `article_types`: Comma-separated types

Via GitHub CLI:
```bash
gh workflow run news-generation.yml \
  -f force_generation=true \
  -f article_types="week-ahead,breaking"
```

## Article Structure

### HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- SEO metadata -->
  <title>Article Title - Riksdagsmonitor</title>
  <meta name="description" content="...">
  
  <!-- Open Graph -->
  <meta property="og:title" content="...">
  <meta property="og:type" content="article">
  
  <!-- Schema.org -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "...",
    "datePublished": "..."
  }
  </script>
  
  <!-- YAML frontmatter (in HTML comment) -->
  <!--
  ---
  title: "Article Title"
  date: 2026-02-10
  type: prospective-news
  topics: [eu, parliament]
  author: News Journalist Agent
  mcp_server: riksdag-regering-mcp
  ---
  -->
</head>
<body>
  <article>
    <!-- Article content -->
  </article>
</body>
</html>
```

### YAML Frontmatter Fields

```yaml
---
title: "Article Title"           # Required
date: 2026-02-10                 # Required (ISO 8601)
type: prospective-news           # Required (prospective|retrospective|analysis)
topics: [eu, parliament]         # Required (array)
riksmote: 2025/26               # Optional (parliamentary session)
documents: [HD03105, HD03106]    # Optional (document IDs)
ministers: [Ulf Kristersson]     # Optional (minister names)
events: [eu-summit, debate]      # Optional (event types)
languages: [en, sv]              # Required (available languages)
author: News Journalist Agent    # Required
style: The Economist            # Required
generated: automated            # Optional (manual|automated)
mcp_server: riksdag-regering-mcp # Optional (data source)
---
```

## Quality Standards

### The Economist Style

**Core Principles:**
- ✅ Clarity above all
- ✅ Analytical depth
- ✅ Elegant prose
- ✅ Objectivity

**Article Structure:**
1. **Lead Paragraph** (50 words)
   - Who, what, when, where, why
   - Most important information first

2. **Context** (150-200 words)
   - Background and history
   - Why this matters

3. **Evidence** (300-400 words)
   - Data, quotes, documents
   - Multiple perspectives

4. **Analysis** (200-300 words)
   - Interpretation
   - Implications
   - Future outlook

5. **Conclusion** (100 words)
   - Synthesis
   - Broader significance

### Journalism Ethics

**Mandatory Checks:**
- [ ] Two independent sources for major claims
- [ ] Direct quotes properly attributed
- [ ] Statistical claims cited with sources
- [ ] Balanced representation of viewpoints
- [ ] GDPR compliance for political data
- [ ] No partisan bias or favoritism

### Accessibility

**WCAG 2.1 AA Requirements:**
- ✅ Semantic HTML5 structure
- ✅ Proper heading hierarchy
- ✅ Alt text for images
- ✅ Color contrast ≥ 4.5:1
- ✅ Keyboard navigation
- ✅ Screen reader compatible

## Multi-Language Support

### Current Status
- ✅ English (en) - Primary
- ✅ Swedish (sv) - Primary
- ⏳ 12 additional languages (future)

### Translation Workflow

1. **Generate English First**
   - English is source language
   - Complete article with all sources

2. **Translate to Swedish**
   - Maintain tone and style
   - Adapt for Swedish audience
   - Keep source citations

3. **Future: Auto-translate**
   - Use translation service for 12 languages
   - Human review for quality
   - Cultural adaptation

### File Naming Convention

```
news/
├── YYYY-MM-DD-slug-en.html  # English
├── YYYY-MM-DD-slug-sv.html  # Swedish
├── YYYY-MM-DD-slug-da.html  # Danish (future)
└── ...
```

## Maintenance

### Daily Monitoring

Check GitHub Actions:
- Go to Actions → Automated News Generation
- Review latest runs
- Check PR status

### Weekly Review

1. **Quality Metrics**
   - Article count (target: 3-5/week)
   - Error rate (target: <5%)
   - PR merge rate (target: >90%)

2. **Content Review**
   - Accuracy of facts
   - Source diversity
   - Editorial balance

3. **Technical Health**
   - Workflow success rate
   - MCP server availability
   - Sitemap validity

### Monthly Audit

1. **Coverage Analysis**
   - Topic diversity
   - Source variety
   - Language balance

2. **Traffic Analysis**
   - Page views per article
   - Average time on page
   - Referral sources

3. **SEO Performance**
   - Search rankings
   - Click-through rates
   - Organic traffic

## Troubleshooting

### Workflow Fails

**Check:**
1. GitHub Actions logs
2. MCP server availability
3. Script error messages
4. Permission issues

**Common Issues:**
```bash
# MCP server timeout
Error: riksdag-regering-mcp connection timeout
Solution: Check server status at https://riksdag-regering-ai.onrender.com/health

# No new content
Warning: No articles generated (no new content found)
Solution: Normal behavior - only generates when updates available

# Validation errors
Error: HTML validation failed
Solution: Review generated HTML, check template syntax
```

### Manual Generation

If automated workflow fails:

```bash
# 1. Clone repository
git clone https://github.com/Hack23/riksdagsmonitor.git
cd riksdagsmonitor

# 2. Install dependencies
npm install
npm install -g riksdag-regering-mcp

# 3. Generate news
node scripts/generate-news.js --types="week-ahead"

# 4. Update sitemap
node scripts/generate-sitemap.js

# 5. Validate
npm run htmlhint news/*.html

# 6. Commit and push
git add news/ sitemap.xml
git commit -m "news: Manual generation"
git push
```

## Future Enhancements

### Phase 1 (Complete)
- [x] News index page
- [x] Automated workflow
- [x] Sitemap generation
- [x] Script framework

### Phase 2 (In Progress)
- [ ] Full MCP integration
- [ ] Template refinement
- [ ] Content quality checks
- [ ] Editorial review process

### Phase 3 (Planned)
- [ ] 14-language support
- [ ] RSS feed generation
- [ ] Email notifications
- [ ] Analytics dashboard

### Phase 4 (Future)
- [ ] AI content generation
- [ ] Image generation
- [ ] Video summaries
- [ ] Social media integration

## References

- **riksdag-regering-mcp**: [npm package](https://www.npmjs.com/package/riksdag-regering-mcp)
- **The Economist Style**: [Style Guide](https://www.economist.com/style-guide)
- **GDPR Compliance**: [Hack23 ISMS](https://github.com/Hack23/ISMS-PUBLIC)
- **Journalism Ethics**: [SPJ Code](https://www.spj.org/ethicscode.asp)

## Support

**Issues:** https://github.com/Hack23/riksdagsmonitor/issues  
**Discussions:** https://github.com/Hack23/riksdagsmonitor/discussions  
**Contact:** James Pether Sörling (james@hack23.com)

---

**Last Updated:** 2026-02-11  
**Version:** 1.0  
**Maintained by:** Hack23 AB
