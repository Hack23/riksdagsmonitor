# Dashboard Generation Template v1

<!-- version: 1.0.0 | updated: 2026-03-14 | author: Hack23 AB -->

## Dashboard Data Interpretation Framework

Use this framework to generate dashboard sections for committee reports, propositions, and monthly review articles.

### Dashboard Types Available

1. **Party Activity Dashboard**: Motions/proposals filed per party, success rates
2. **Committee Workload Dashboard**: Reports per committee, pending/completed ratio
3. **Legislative Pipeline Dashboard**: Bills in progress, timeline estimates
4. **Economic Indicators Dashboard**: SCB/World Bank data for policy context
5. **Interpellation Accountability Dashboard**: Ministers targeted, response rates

### Data Preparation Requirements

Before generating a dashboard:
1. Fetch relevant data from MCP (get_betankanden, get_propositioner, etc.)
2. Aggregate by dimension (party, committee, time period)
3. Calculate comparative metrics (year-over-year, session-over-session)
4. Identify outliers and notable trends

### Dashboard Content Standards

#### Labels and Titles
- All text must be in the article language (use `L(lang, key)` pattern)
- Chart titles must be descriptive, not generic ("Committee Activity by Party" not "Chart 1")
- Include data source citation in dashboard footer

#### Data Integrity
- Show actual numbers, not approximations
- Include sample size where relevant ("Based on 47 documents")
- Mark estimated/projected values distinctly
- Do not extrapolate beyond available data

#### Visual Hierarchy
- Most significant metric prominently displayed
- Secondary metrics in supporting position
- Context/comparison at bottom

### Generating Dashboard HTML

Dashboard sections are rendered by:
- `generateDashboardSection()` — Chart.js-based interactive dashboard
- `generateEconomicDashboardSection()` — World Bank/SCB economic indicators

Both functions accept structured data objects. See:
`scripts/data-transformers/content-generators/dashboard-section.ts`
`scripts/data-transformers/content-generators/economic-dashboard-section.ts`

### Dashboard for Committee Reports

```typescript
// Example: Committee activity dashboard
const dashboardOptions = {
  title: L(lang, 'dashboardTitle'),
  metrics: [
    { label: 'Reports processed', value: reportCount, trend: 'up' },
    { label: 'Committees active', value: committeeCount, trend: 'stable' },
    { label: 'Pending votes', value: pendingVotes, trend: 'down' }
  ],
  lang,
};
```

### Prohibited Dashboard Patterns

❌ Empty dashboards with placeholder text
❌ Dashboards without source citations
❌ Charts showing only 1-2 data points
❌ Duplicate metrics showing same data twice
❌ Dashboard sections for articles with < 5 relevant data points
