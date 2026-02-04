## 📋 Issue Type
**Feature** - Dynamic visualizations for party metrics and ministry scorecards

## 🎯 Objective
Implement comprehensive dynamic visualizations for party performance metrics and government ministry scorecards using CIA platform data, enabling real-time monitoring of Swedish political performance.

## 📊 Current State
- **Party Visualization**: None - only external links to CIA platform
- **Cabinet Scorecard**: None - only external links
- **Data Integration**: No direct CIA data integration
- **Visualizations**: Static content, no charts or graphs
- **Real-time Updates**: Manual updates only
- **Multi-language**: Basic pages exist but no data visualization

## 🚀 Desired State
- **Party Dashboard**: Interactive visualizations showing performance metrics for all 8 Swedish parties
- **Ministry Scorecards**: Dynamic scorecards for all government ministries
- **CIA Integration**: Real-time data from CIA JSON endpoints
- **Responsive Design**: Mobile-first, accessible visualizations
- **Auto-update**: Daily data refresh from CIA platform
- **Multi-language**: Fully functional in all 14 languages

## 📊 CIA Data Integration Context

**Party Performance Product** (CIA Product #2):
- **Schema**: `party-schema.md` - https://github.com/Hack23/cia/blob/master/json-export-specs/schemas/party-schema.md
- **Data Points**:
  - Party identification: name, abbreviation, color, founding date
  - Performance metrics: votes, seats, vote share percentage
  - Voting patterns: party discipline score, rebellion rate
  - Legislative activity: bills proposed, bills passed, amendments
  - Government participation: years in power, ministerial posts
  - Historical trends: longitudinal performance 1970-2024

**Government Cabinet Product** (CIA Product #3):
- **Schema**: `ministry-schema.md` - https://github.com/Hack23/cia/blob/master/json-export-specs/schemas/ministry-schema.md
- **Data Points**:
  - Ministry identification: name, minister, party affiliation
  - Scorecard metrics: budget utilization, legislative productivity
  - Performance indicators: bills passed, policy implementation rate
  - Minister activity: committee appearances, parliamentary questions
  - Public visibility: media mentions, citizen engagement

**Data Sources**:
- **CIA Platform**:
  - Party performance: `/api/parties/{partyId}/performance`
  - Ministry scorecards: `/api/ministries/{ministryId}/scorecard`
  - Sample data: https://github.com/Hack23/cia/tree/master/service.data.impl/sample-data
  
- **Riksdag Open Data**:
  - Voting records: https://data.riksdagen.se/data/voteringslista/
  - Bills and motions: https://data.riksdagen.se/data/dokument/
  - Committee work: https://data.riksdagen.se/data/utskottsforslag/

**OSINT Methodologies** (DATA_ANALYSIS_INTOP_OSINT.md):
- Party performance scoring algorithms
- Ministry effectiveness metrics
- Voting pattern analysis and visualization
- Longitudinal trend detection
- Comparative analysis frameworks

**Implementation Notes**:
- Review party-schema.md and ministry-schema.md for complete data model
- Leverage CIA sample data for development and testing
- Validate against OSINT methodologies for metric accuracy
- Reference Business Product Doc (133.5 KB) for visualization specifications

## 🔧 Implementation Approach

### Phase 1: Data Integration (Weeks 1-2)
1. **Schema Review & Validation**
   - Review party-schema.md for all available metrics
   - Review ministry-schema.md for scorecard data points
   - Validate sample data against schemas
   - Document data model for riksdagsmonitor

2. **API Integration**
   - Connect to CIA JSON endpoints (if available)
   - Fallback: Static JSON files from CIA export
   - Create data fetching layer (client-side JavaScript)
   - Implement caching strategy (localStorage, 24h TTL)
   - Error handling and retry logic

3. **Data Processing**
   - Parse CIA JSON responses
   - Transform data for visualization
   - Calculate derived metrics (trends, percentages, rankings)
   - Multi-language data transformation

### Phase 2: Party Performance Dashboard (Weeks 3-4)
1. **Party Overview Visualization**
   - **Riksdag Composition**: Pie chart showing seat distribution (349 seats, 8 parties)
   - **Vote Share Trends**: Line chart showing historical vote percentages (1970-2024)
   - **Party Comparison**: Radar chart comparing 5 key metrics across parties
   - **Government Participation**: Timeline visualization of coalition history

2. **Individual Party Pages**
   - Party profile card: logo, founding date, ideology, leader
   - Performance metrics dashboard: 6-8 key metrics
   - Voting pattern analysis: party discipline, rebellion rate
   - Legislative productivity: bills proposed vs. passed
   - Historical trends: longitudinal performance graphs

3. **Interactive Features**
   - Party filter and selection
   - Time range selector (1 year, 5 years, 10 years, all-time)
   - Metric comparison tool (compare 2-3 parties side-by-side)
   - Export to PNG/PDF functionality
   - Mobile-responsive touch interactions

### Phase 3: Cabinet Scorecard Dashboard (Weeks 5-6)
1. **Government Overview**
   - **Ministry Grid**: Card layout for all 10-12 ministries
   - **Overall Performance**: Aggregate scorecard for current government
   - **Budget Utilization**: Bar chart showing spending vs. budget per ministry
   - **Legislative Success**: Pie chart of bills passed vs. rejected

2. **Individual Ministry Scorecards**
   - Minister profile: photo, name, party, tenure
   - Scorecard metrics: 5-7 key performance indicators
   - Budget analysis: allocated, spent, remaining
   - Legislative activity: bills introduced, passed, rejected
   - Public engagement: media mentions, citizen feedback
   - Committee work: appearances, questions answered

3. **Visualization Components**
   - **Scorecard Cards**: Clean, modern design with color-coded metrics
   - **Progress Bars**: Budget utilization, policy implementation
   - **Trend Indicators**: Up/down arrows for performance changes
   - **Comparison Matrix**: Compare ministries on key metrics
   - **Timeline View**: Minister tenure and key milestones

### Phase 4: Integration & Testing (Week 7)
1. **Multi-Language Support**
   - Dashboard text in all 14 languages
   - Party names: preserve Swedish originals (Socialdemokraterna, Moderaterna, etc.)
   - Metric labels translated per language
   - Number/date formatting per locale

2. **Performance Optimization**
   - Lazy loading for chart data
   - Progressive rendering (show cached data first, update with fresh data)
   - Image optimization for party logos/minister photos
   - Minified CSS/JS (while maintaining static site architecture)

3. **Accessibility & Compliance**
   - WCAG 2.1 AA compliance verification
   - Keyboard navigation for all interactive elements
   - Screen reader support (ARIA labels, roles, live regions)
   - Color contrast testing (≥4.5:1 ratio)
   - Focus indicators for keyboard users

4. **Testing & QA**
   - Cross-browser testing (Chrome, Firefox, Safari, Edge)
   - Mobile testing (iOS Safari, Android Chrome)
   - Tablet testing (iPad, Android tablets)
   - Accessibility audit (WAVE, axe DevTools)
   - Performance testing (Lighthouse, WebPageTest)
   - Data accuracy verification against CIA platform

## 🤖 Recommended Agent
**frontend-specialist** - Expert in static site visualization, responsive design, Chart.js/D3.js, and political data presentation

**Rationale**: Specializes in static HTML/CSS sites with JavaScript visualizations, responsive design, and accessibility. Ideal for building client-side dashboards with external data integration.

## ✅ Acceptance Criteria

### Functional Requirements
- [ ] Party performance dashboard operational for all 8 Swedish parties
- [ ] Ministry scorecard dashboard for all 10-12 government ministries
- [ ] Real-time CIA data integration (or daily refresh)
- [ ] Historical trend visualization (1970-2024)
- [ ] Party comparison tool functional
- [ ] Ministry comparison matrix operational
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Multi-language support (14 languages)

### Visualization Requirements
- [ ] 10+ chart types implemented (pie, bar, line, radar, timeline, cards)
- [ ] Party color coding consistent (S=red, M=blue, SD=yellow, V=red, etc.)
- [ ] Interactive tooltips with detailed data
- [ ] Zoom/pan functionality for complex charts
- [ ] Export to PNG/PDF for all visualizations
- [ ] Print-friendly styles

### Data Integration Requirements
- [ ] CIA JSON endpoint integration (party-schema, ministry-schema)
- [ ] Fallback to static JSON files
- [ ] Client-side data fetching (fetch API)
- [ ] Caching strategy (localStorage, 24h TTL)
- [ ] Error handling and user feedback
- [ ] Data validation against schemas

### Performance Requirements
- [ ] Load time <3 seconds (with visualizations)
- [ ] Lazy loading for below-the-fold charts
- [ ] Progressive rendering (cached data first)
- [ ] Lighthouse score ≥90 (performance)
- [ ] First Contentful Paint <1.5s
- [ ] Largest Contentful Paint <2.5s

### Accessibility Requirements
- [ ] WCAG 2.1 AA compliant (verified with axe)
- [ ] Keyboard navigation functional
- [ ] Screen reader compatible (tested with NVDA/JAWS)
- [ ] Color contrast ≥4.5:1 (all text)
- [ ] Focus indicators visible
- [ ] ARIA labels for all interactive elements

### Multi-Language Requirements
- [ ] Dashboard text in all 14 languages
- [ ] Party names preserved (Swedish originals)
- [ ] Metric labels translated
- [ ] Number formatting per locale (Swedish: 12 345,67)
- [ ] Date formatting per locale (Swedish: 2024-01-29)
- [ ] Proper pluralization per language

### Documentation Requirements
- [ ] PARTY_DASHBOARD.md created with user guide
- [ ] CABINET_SCORECARD.md created with metric definitions
- [ ] DATA_INTEGRATION.md for CIA platform connection
- [ ] API documentation for data endpoints
- [ ] Contributor guide for adding new visualizations

## 📚 References

### Repository & Architecture
- **Repository**: https://github.com/Hack23/riksdagsmonitor
- **Architecture**: [ARCHITECTURE.md](https://github.com/Hack23/riksdagsmonitor/blob/main/ARCHITECTURE.md)

### CIA Data Sources
- **Party Schema**: https://github.com/Hack23/cia/blob/master/json-export-specs/schemas/party-schema.md
- **Ministry Schema**: https://github.com/Hack23/cia/blob/master/json-export-specs/schemas/ministry-schema.md
- **Sample Data**: https://github.com/Hack23/cia/tree/master/service.data.impl/sample-data
- **OSINT Methods**: https://github.com/Hack23/cia/blob/master/DATA_ANALYSIS_INTOP_OSINT.md
- **Business Product Doc**: https://github.com/Hack23/cia/blob/master/BUSINESS_PRODUCT_DOCUMENT.md (133.5 KB)

### Riksdag Open Data
- **Voting Records**: https://data.riksdagen.se/data/voteringslista/
- **Bills and Motions**: https://data.riksdagen.se/data/dokument/
- **Committee Work**: https://data.riksdagen.se/data/utskottsforslag/
- **MP Data**: https://data.riksdagen.se/data/ledamot/

### Visualization Libraries
- **Chart.js**: https://www.chartjs.org/ (recommended for static sites)
- **D3.js**: https://d3js.org/ (if advanced custom charts needed)
- **Chart.js Plugins**: https://www.chartjs.org/docs/latest/developers/plugins.html
- **Accessibility**: https://www.chartjs.org/docs/latest/general/accessibility.html

### Swedish Political Context
- **8 Riksdag Parties** (2022-2026):
  1. **S** (Socialdemokraterna) - Social Democrats - Red
  2. **M** (Moderaterna) - Moderates - Blue
  3. **SD** (Sverigedemokraterna) - Sweden Democrats - Yellow/Blue
  4. **C** (Centerpartiet) - Centre Party - Green
  5. **V** (Vänsterpartiet) - Left Party - Red
  6. **KD** (Kristdemokraterna) - Christian Democrats - Blue
  7. **L** (Liberalerna) - Liberals - Blue
  8. **MP** (Miljöpartiet) - Green Party - Green

### ISMS & Compliance
- **ISO 27001 A.14.2**: Security in development and support
- **NIST CSF 2.0 PR.DS-2**: Data-in-transit protected
- **WCAG 2.1 AA**: Web accessibility standard
- **Security Architecture**: [SECURITY_ARCHITECTURE.md](https://github.com/Hack23/riksdagsmonitor/blob/main/SECURITY_ARCHITECTURE.md)

## 📝 Additional Context

### Party Performance Metrics (from party-schema.md)
1. **Electoral Performance**: Votes received, vote share %, seats won
2. **Legislative Productivity**: Bills proposed, bills passed, pass rate %
3. **Party Discipline**: Voting cohesion score (0-100%)
4. **Government Participation**: Years in power, ministerial posts held
5. **Public Visibility**: Media mentions, social media engagement
6. **Policy Impact**: Successful amendments, policy implementations

### Ministry Scorecard Metrics (from ministry-schema.md)
1. **Budget Management**: Allocated budget, spent amount, utilization %
2. **Legislative Success**: Bills introduced, bills passed, success rate %
3. **Policy Implementation**: Policies planned, policies implemented, completion %
4. **Parliamentary Engagement**: Questions answered, committee appearances
5. **Public Accountability**: FOI requests handled, response time
6. **Media Presence**: Press conferences, media mentions
7. **Citizen Satisfaction**: Public approval rating, complaint resolution

### Visualization Best Practices
- **Color Accessibility**: Use patterns/textures in addition to color
- **Responsive Charts**: Mobile-first design, touch-friendly interactions
- **Data Labels**: Clear, concise labels on all axes and data points
- **Tooltips**: Context-rich tooltips with additional detail
- **Loading States**: Skeleton screens while data loads
- **Error States**: User-friendly error messages with retry options

### Swedish Government Structure (2024)
- **Prime Minister**: Ulf Kristersson (M)
- **Deputy PM**: Ebba Busch (KD)
- **Ministries**: ~12 departments (varies by government)
- **Coalition**: M, SD, KD, L (Tidö Agreement 2022-2026)

---

**Estimated Effort**: 7 weeks  
**Priority**: High  
**Complexity**: High  
**Dependencies**: Issue #1 (schema validation) recommended but not blocking