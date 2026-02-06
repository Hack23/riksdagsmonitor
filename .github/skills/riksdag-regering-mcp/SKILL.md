---
name: riksdag-regering-mcp
description: Riksdag-Regering MCP server with 32 specialized tools for Swedish political data (Parliament, Government, MPs, votes, documents)
license: Apache-2.0
---

# Riksdag-Regering MCP Server

## Purpose

Provide comprehensive access to Swedish political data through the `riksdag-regering-mcp` Model Context Protocol (MCP) server. Enables intelligence operatives and political analysts to query, analyze, and visualize data from the Swedish Riksdag (Parliament) and Regeringen (Government).

## Core Principles

1. **Authoritative Data Source**: Official Swedish government data (data.riksdagen.se, regeringen.se)
2. **Comprehensive Coverage**: 50+ years of historical data (1971-2024)
3. **Structured API**: 32 specialized tools for different data types
4. **Real-Time Access**: Latest parliamentary and government activities
5. **GDPR Compliance**: Public interest basis (Article 6(1)(e)), no personal data beyond official capacity
6. **Multi-Source Integration**: Riksdag documents + Government publications

## Available Tools (32 Total)

### 🔍 Search & Discovery (6 tools)
- **search_ledamoter**: Search for MPs (349 members) by name, party, constituency
- **search_dokument**: Search parliamentary documents (motions, bills, reports)
- **search_dokument_fulltext**: Full-text search across document content
- **search_anforanden**: Search speeches and parliamentary debates
- **search_voteringar**: Search voting records and roll calls
- **search_regering**: Search government documents (propositions, SOU, Dir)

### 📊 Detailed Information (6 tools)
- **get_dokument**: Get complete document with metadata and content
- **get_ledamot**: Get MP profile with assignments, activities, bio
- **get_dokument_innehall**: Get document content and summary
- **get_g0v_document_content**: Get government document in Markdown
- **get_discussion**: Get specific discussion thread
- **get_discussion_comments**: Get comments from a discussion

### 📝 Parliamentary Documents (6 tools)
- **get_motioner**: Latest motions (proposals from MPs)
- **get_propositioner**: Latest government propositions
- **get_betankanden**: Latest committee reports
- **get_fragor**: Latest written questions
- **get_interpellationer**: Latest interpellations (formal questions)
- **get_utskott**: List parliamentary committees (15 committees)

### 🏛️ Government Documents (4 tools)
- **get_regering_document**: Get government document by ID
- **summarize_regering_document**: AI-powered government document summary
- **get_g0v_document_types**: List available government document types
- **get_g0v_category_codes**: List government policy area codes

### 📈 Analytics & Aggregation (5 tools)
- **get_voting_group**: Get votes grouped by party/constituency
- **list_reports**: List available statistical reports
- **fetch_report**: Get statistical report (MP stats, committee data)
- **analyze_g0v_by_department**: Analyze government documents by department
- **get_g0v_latest_update**: Check latest government data update

### 🔄 Advanced Queries (5 tools)
- **fetch_paginated_documents**: Batch fetch with pagination
- **fetch_paginated_anforanden**: Batch fetch speeches
- **batch_fetch_documents**: Multi-year document batches
- **get_calendar_events**: Parliamentary calendar (debates, committees)
- **enhanced_government_search**: Combined Riksdag + Government search

## Data Coverage

### Swedish Riksdag (Parliament)
- **349 MPs**: Current members across 8 parties
- **15 Committees**: AU, FiU, JuU, KU, SkU, SfU, UU, UtU, etc.
- **Documents**: 50+ years (1971-2024)
  - Motions (mot): MP proposals
  - Propositions (prop): Government bills
  - Reports (bet): Committee reports
  - Questions (fr): Written questions
  - Interpellations (ip): Formal questions
- **Votes**: Complete voting records with party/MP breakdown
- **Speeches**: Parliamentary debates (anföranden)

### Swedish Government (Regeringen)
- **Document Types**: Propositions, SOU (state investigations), Dir (committee directives), DS (department series), Remisser (referrals)
- **Departments**: All 10 ministries
- **Historical Data**: Government documents from 1990s+
- **G0V Integration**: Markdown-formatted documents via g0v.se

### 8 Parliamentary Parties
- **S** - Socialdemokraterna (Social Democrats)
- **M** - Moderaterna (Moderates)
- **SD** - Sverigedemokraterna (Sweden Democrats)
- **MP** - Miljöpartiet (Green Party)
- **C** - Centerpartiet (Centre Party)
- **V** - Vänsterpartiet (Left Party)
- **KD** - Kristdemokraterna (Christian Democrats)
- **L** - Liberalerna (Liberals)

## When to Use

- **Political Intelligence**: Analyze voting patterns, coalition behavior
- **Legislative Monitoring**: Track bills, motions, committee work
- **MP Analysis**: Profile MPs, track activities, voting discipline
- **Coalition Analysis**: Assess government stability, party cooperation
- **Policy Research**: Trace policy development through documents
- **Voting Analysis**: Party cohesion, rebels, cross-party voting
- **Government Oversight**: Track government proposals, investigations
- **Electoral Research**: Historical trends, party evolution
- **Transparency Dashboards**: Real-time political metrics
- **Risk Assessment**: Identify democratic accountability gaps

## Examples

### Good Pattern: MP Voting Discipline Analysis
```javascript
// Get all votes from current riksmöte
const votes = await riksdag_regering_mcp.search_voteringar({
  rm: "2024/25",
  limit: 200
});

// Analyze party cohesion
const partyDiscipline = {};
for (const party of ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP']) {
  const partyVotes = await riksdag_regering_mcp.get_voting_group({
    rm: "2024/25",
    groupBy: "parti",
    limit: 200
  });
  
  // Calculate cohesion metric
  partyDiscipline[party] = calculateCohesion(partyVotes);
}
```

### Good Pattern: Committee Productivity Analysis
```javascript
// Get reports from all committees
const committees = ['AU', 'FiU', 'JuU', 'KU', 'SkU', 'SfU', 'UU'];
const productivity = {};

for (const committee of committees) {
  const reports = await riksdag_regering_mcp.get_betankanden({
    organ: committee,
    rm: "2024/25",
    limit: 100
  });
  
  productivity[committee] = {
    count: reports.length,
    avgProcessingTime: calculateAvgTime(reports)
  };
}
```

### Good Pattern: Government Document Analysis
```javascript
// Search government propositions on specific topic
const props = await riksdag_regering_mcp.search_regering({
  type: "propositioner",
  title: "migration",
  dateFrom: "2024-01-01",
  limit: 50
});

// Get full content for analysis
for (const prop of props) {
  const content = await riksdag_regering_mcp.get_g0v_document_content({
    regeringenUrl: prop.url
  });
  
  // Analyze policy positions
  analyzePolicy(content);
}
```

### Good Pattern: Multi-Language Political Dashboard
```javascript
// Get latest parliamentary activity
const motions = await riksdag_regering_mcp.get_motioner({ limit: 10 });
const props = await riksdag_regering_mcp.get_propositioner({ limit: 10 });
const questions = await riksdag_regering_mcp.get_fragor({ limit: 10 });

// Create bilingual dashboard (Swedish/English)
const dashboard = {
  sv: formatDashboardSV({ motions, props, questions }),
  en: formatDashboardEN({ motions, props, questions })
};
```

### Anti-Pattern: Over-Fetching Without Filtering
```javascript
// ❌ BAD: Fetching too much data
const allDocs = await riksdag_regering_mcp.search_dokument({
  limit: 200 // Default, could be thousands
});

// ✅ GOOD: Targeted query with filters
const recentDocs = await riksdag_regering_mcp.search_dokument({
  rm: "2024/25",
  doktyp: "mot",
  organ: "FiU",
  limit: 50
});
```

### Anti-Pattern: Ignoring Pagination
```javascript
// ❌ BAD: Only getting first page
const votes = await riksdag_regering_mcp.search_voteringar({ limit: 20 });

// ✅ GOOD: Handling pagination
const allVotes = await riksdag_regering_mcp.fetch_paginated_documents({
  doktyp: "votering",
  rm: "2024/25",
  fetchAll: true,
  maxPages: 10
});
```

## MCP Server Configuration

### HTTP Endpoint (Production)
```json
{
  "mcpServers": {
    "riksdag-regering": {
      "type": "http",
      "url": "https://riksdag-regering-ai.onrender.com/mcp",
      "tools": ["*"]
    }
  }
}
```

### Local Installation (Development)
```bash
# Install globally
npm install -g riksdag-regering-mcp

# Run locally
riksdag-regering-mcp
# Listens on http://localhost:3000/mcp
```

## Data Quality Considerations

### Completeness
- **Historical Data**: Complete from 1971 for most document types
- **Real-Time Updates**: Government data updated daily
- **Missing Data**: Some older documents may lack full text

### Accuracy
- **Official Source**: Direct from Swedish government APIs
- **Validation**: Schema validation for all responses
- **Versioning**: API versioned for stability

### Timeliness
- **Parliamentary Data**: Updated within hours of publication
- **Government Data**: Updated daily from regeringen.se
- **Latency**: HTTP endpoint may have cold start delays (~30s)

## GDPR Compliance

### Legal Basis
- **Article 6(1)(e)**: Processing necessary for task carried out in public interest
- **Article 9(2)(g)**: Processing necessary for substantial public interest
- **Offentlighetsprincipen**: Swedish Public Access to Information and Secrecy Act

### Data Minimization
- ✅ Only official capacity data (no private lives)
- ✅ No personal contact information
- ✅ No tracking or cookies
- ✅ No data retention beyond cache

### Transparency
- ✅ Clear data sources documented
- ✅ Open-source MCP server
- ✅ Public API documentation
- ✅ GDPR compliance statement

## Remember

- **Use HTTP endpoint** for production (no local installation needed)
- **Filter queries** with riksmöte (rm), organ, party parameters
- **Handle pagination** for large datasets (use `fetchAll` carefully)
- **Verify data quality** - some older documents may be incomplete
- **Respect rate limits** - HTTP endpoint may throttle heavy usage
- **Cache responses** - avoid redundant API calls
- **GDPR compliance** - only official capacity data, no personal information
- **Multi-language support** - Display data in all 14 supported languages
- **Document IDs** follow pattern: H901FiU1 (Riksmöte + Type + Committee + Number)

## References

- [riksdag-regering-mcp npm package](https://www.npmjs.com/package/riksdag-regering-mcp)
- [Swedish Riksdag Open Data](http://data.riksdagen.se/)
- [Swedish Government Publications](https://www.regeringen.se/)
- [G0V.se - Government Document Archive](https://g0v.se/)
- [Hack23 ISMS - GDPR Compliance](https://github.com/Hack23/ISMS-PUBLIC)

---

**Version**: 1.0  
**Last Updated**: 2026-02-06  
**Maintained by**: Hack23 AB
