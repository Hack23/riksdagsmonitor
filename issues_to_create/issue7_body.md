## 📋 Issue Type
**Feature** - Automated daily news generation workflow

## 🎯 Objective
Create GitHub Actions workflow that generates daily news items covering Riksdag updates, scheduled committee meetings, future event analysis, and OSINT-driven insights with automated multi-language content generation.

## 📊 Current State
- **News Generation**: Manual updates only
- **Automation**: No automated workflows
- **Committee Tracking**: No automated meeting detection
- **Event Prediction**: No predictive analysis
- **Multi-Language**: No automated translation
- **RSS Feed**: None exists
- **Social Media**: No automated posting

## 🚀 Desired State
- **Daily Automation**: Nightly workflow (2 AM UTC / 3 AM CET)
- **News Generation**: Automated HTML news items from Riksdag updates
- **Committee Meeting Tracking**: Scheduled meetings and agenda items
- **Event Predictions**: Predictive analysis for future Riksdag events
- **Multi-Language**: Automated news in all 14 languages
- **RSS Feed**: Automated feed generation and updates
- **Social Media Ready**: Post-ready content with metadata
- **Historical Archive**: Searchable news database

## 📊 CIA Data Integration Context

**Nightly News Workflow** (Automated Content Generation):

**Data Sources**:
- **Riksdag API**: http://data.riksdagen.se/
  - Daily calendar: `/api/kalender/`
  - Committee meetings: `/api/utskottsmoten/`
  - Bills and motions: `/api/dokument/`
  - Voting results: `/api/voteringar/`
  - MP activities: `/api/ledamot-aktivitet/`

- **CIA Platform**:
  - Party performance updates
  - MP activity tracking
  - Committee influence changes
  - Prediction model outputs
  - OSINT intelligence summaries

- **OSINT Methodologies**: https://github.com/Hack23/cia/blob/master/DATA_ANALYSIS_INTOP_OSINT.md (451.4 KB)
- **Business Product Doc**: https://github.com/Hack23/cia/blob/master/BUSINESS_PRODUCT_DOCUMENT.md

**News Categories**:
1. **Legislative Updates**: New bills, passed laws, voting results
2. **Committee News**: Scheduled meetings, reports, decisions
3. **MP Activities**: New appointments, resignations, key speeches
4. **Party News**: Coalition changes, policy announcements
5. **Predictions**: Upcoming votes, expected outcomes
6. **Analysis**: OSINT-driven insights, trend detection

**Implementation Notes**:
- Leverage Riksdag API for real-time updates
- Integrate CIA OSINT methodologies for predictive analysis
- Use event detection algorithms from DATA_ANALYSIS_INTOP_OSINT.md
- Generate multi-language content using translation templates

## 🔧 Implementation Approach

### Phase 1: Workflow Setup (Weeks 1-2)
1. **GitHub Actions Workflow**
   - Create `.github/workflows/nightly-news.yml`
   - Schedule: cron `0 2 * * *` (2 AM UTC daily)
   - Permissions: contents:write for committing news files
   - Secrets: RIKSDAG_API_KEY (if needed), CIA_API_TOKEN

2. **Data Fetching Layer**
   - Python script: `scripts/fetch_riksdag_updates.py`
   - Fetch daily calendar events
   - Fetch committee meetings scheduled
   - Fetch new bills and motions
   - Fetch voting results
   - Fetch MP activities

3. **CIA Platform Integration**
   - Fetch party performance updates
   - Fetch MP activity metrics
   - Fetch committee influence changes
   - Fetch prediction model outputs

### Phase 2: News Generation Engine (Weeks 3-4)
1. **Event Detection & Analysis**
   - Implement OSINT event detection algorithms
   - Pattern recognition for significant events
   - Trend analysis (compare with historical data)
   - Anomaly detection (unusual activity)
   - Predictive analysis (future event likelihood)

2. **Content Generation**
   - Template-based news article generation
   - Event categorization (legislative, committee, MP, party, prediction)
   - Headline generation (concise, informative)
   - Summary generation (2-3 paragraphs)
   - Metadata: date, category, tags, related entities (MPs, parties, committees)

3. **Multi-Language Generation**
   - English (primary)
   - Swedish (native)
   - 12 additional languages (automated translation or templates)
   - Filename: `news-YYYY-MM-DD_[lang].html`
   - Directory: `news/YYYY/MM/`

### Phase 3: Output & Integration (Week 5)
1. **HTML News Files**
   - Generate `news-YYYY-MM-DD_en.html` (and 13 other languages)
   - Responsive layout matching site theme
   - Metadata tags: og:image, og:description, keywords
   - Internal links: MPs, parties, committees, bills
   - External links: Riksdag official pages

2. **RSS Feed Generation**
   - Generate/update `news-feed.xml`
   - Per-language feeds: `news-feed_en.xml`, `news-feed_sv.xml`, etc.
   - Include: title, description, link, pub date, categories
   - Validate against RSS 2.0 specification

3. **Index Page Updates**
   - Update `news-index.html` with latest news links
   - Archive links by year/month
   - Search functionality (client-side)
   - Filter by category, date, entity

4. **Social Media Content**
   - Generate social media posts (JSON format)
   - Twitter/X: 280-character summary
   - LinkedIn: professional summary
   - Facebook: longer description
   - Include hashtags, mentions, links

### Phase 4: Testing & Monitoring (Week 6)
1. **Workflow Testing**
   - Test workflow manually (workflow_dispatch)
   - Validate API connections (Riksdag, CIA)
   - Verify file generation (all 14 languages)
   - Check RSS feed validity
   - Test error handling and retries

2. **Monitoring & Alerts**
   - Workflow failure notifications (GitHub Actions)
   - Data quality checks (missing fields, broken links)
   - RSS feed validation
   - File size limits (prevent huge files)
   - API rate limiting handling

3. **Documentation**
   - NEWS_WORKFLOW.md documenting the system
   - Troubleshooting guide for failures
   - Adding new news categories procedure
   - Manual trigger instructions

## 🤖 Recommended Agent
**devops-engineer** - Expert in GitHub Actions, automation workflows, API integration, and CI/CD pipelines

**Rationale**: Specializes in workflow orchestration, scheduled automation, API integration, and error handling. Perfect for building robust nightly automation.

## ✅ Acceptance Criteria

### Functional Requirements
- [ ] GitHub Actions workflow operational (nightly at 2 AM UTC)
- [ ] Daily news generation for all 14 languages
- [ ] Riksdag API integration (calendar, meetings, bills, votes, MPs)
- [ ] CIA platform integration (performance, predictions, insights)
- [ ] Event detection and analysis functional
- [ ] Multi-language news file generation (news-YYYY-MM-DD_[lang].html)
- [ ] RSS feed generation and updates (per language)
- [ ] News index page auto-updates
- [ ] Social media content generation (JSON)

### Workflow Requirements
- [ ] Schedule: cron `0 2 * * *` (2 AM UTC daily)
- [ ] Manual trigger: workflow_dispatch enabled
- [ ] Permissions: contents:write for commits
- [ ] Error handling: retries on API failures
- [ ] Notifications: failure alerts via GitHub Actions
- [ ] Execution time: <10 minutes per run

### Content Requirements
- [ ] 6 news categories: legislative, committee, MP, party, predictions, analysis
- [ ] Headline: concise, informative (≤80 characters)
- [ ] Summary: 2-3 paragraphs (150-300 words)
- [ ] Metadata: date, category, tags, related entities
- [ ] Internal links: MPs, parties, committees, bills
- [ ] External links: Riksdag official pages

### Multi-Language Requirements
- [ ] 14 language versions generated daily
- [ ] Consistent structure across languages
- [ ] Translated headlines and summaries
- [ ] Proper date/number formatting per locale
- [ ] Language-specific RSS feeds

### Output Requirements
- [ ] HTML news files: `news/YYYY/MM/news-YYYY-MM-DD_[lang].html`
- [ ] RSS feeds: `news-feed_[lang].xml` (14 feeds)
- [ ] News index: `news-index.html` (auto-updated)
- [ ] Social media JSON: `social/news-YYYY-MM-DD.json`
- [ ] Archive structure: `/news/2024/01/`, `/news/2024/02/`, etc.

### Performance & Reliability
- [ ] Workflow execution: <10 minutes
- [ ] API rate limiting: respect Riksdag API limits
- [ ] Error handling: graceful failures with retries
- [ ] Data validation: check for missing/invalid data
- [ ] File size limits: prevent generation failures

### Documentation Requirements
- [ ] NEWS_WORKFLOW.md created
- [ ] API integration guide
- [ ] Troubleshooting guide
- [ ] Adding new categories procedure
- [ ] Manual trigger instructions

## 📚 References

### Repository & Architecture
- **Repository**: https://github.com/Hack23/riksdagsmonitor
- **Architecture**: [ARCHITECTURE.md](https://github.com/Hack23/riksdagsmonitor/blob/main/ARCHITECTURE.md)
- **Workflows**: [WORKFLOWS.md](https://github.com/Hack23/riksdagsmonitor/blob/main/WORKFLOWS.md)

### Data Sources
- **Riksdag API**: http://data.riksdagen.se/
- **Riksdag Calendar**: http://data.riksdagen.se/api/kalender/
- **Committee Meetings**: http://data.riksdagen.se/api/utskottsmoten/
- **OSINT Methods**: https://github.com/Hack23/cia/blob/master/DATA_ANALYSIS_INTOP_OSINT.md
- **Business Product Doc**: https://github.com/Hack23/cia/blob/master/BUSINESS_PRODUCT_DOCUMENT.md

### GitHub Actions
- **GitHub Actions**: https://docs.github.com/en/actions
- **Cron Syntax**: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule
- **Workflow Dispatch**: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch

### RSS & Social Media
- **RSS 2.0 Specification**: https://www.rssboard.org/rss-specification
- **Open Graph Protocol**: https://ogp.me/
- **Twitter Cards**: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards

### ISMS & Compliance
- **ISO 27001 A.12.6**: Technical vulnerability management
- **NIST CSF 2.0 DE.CM-7**: Monitoring for unauthorized activity
- **Security Architecture**: [SECURITY_ARCHITECTURE.md](https://github.com/Hack23/riksdagsmonitor/blob/main/SECURITY_ARCHITECTURE.md)

## 📝 Additional Context

### News Categories & Examples

**Legislative Updates**:
- "Riksdag Passes Climate Law with 200-149 Vote"
- "5 New Bills Proposed on Healthcare Reform"

**Committee News**:
- "Finance Committee Meeting Scheduled: Budget Review"
- "Defense Committee Report: Military Modernization"

**MP Activities**:
- "Anna Andersson Appointed Vice Chair of Education Committee"
- "Lars Larsson Resigns from Transport Committee"

**Party News**:
- "Social Democrats Announce New Climate Policy"
- "Coalition Parties Reach Agreement on Tax Reform"

**Predictions**:
- "Election Bill Expected to Pass with 180+ Votes"
- "Cabinet Reshuffle Likely in Q2 2024"

**Analysis**:
- "OSINT Analysis: Voting Patterns Shift on Defense Issues"
- "Trend Detection: Increased Cross-Party Collaboration"

### Workflow Schedule
- **Daily**: 2 AM UTC (3 AM CET) - Main news generation
- **On-Demand**: Manual trigger via workflow_dispatch
- **Retry Logic**: 3 attempts with exponential backoff (1min, 5min, 15min)

### Error Handling
- API failures: retry with backoff
- Data validation: skip invalid entries, log warnings
- File generation: continue on single-language failure
- Notifications: GitHub Actions failure alerts

---

**Estimated Effort**: 6 weeks  
**Priority**: High  
**Complexity**: Medium-High  
**Dependencies**: Issue #1 (schema validation) recommended
