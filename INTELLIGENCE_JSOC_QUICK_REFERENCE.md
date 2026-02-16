# Intelligence Operations JSDoc Quick Reference

A quick reference guide to the enhanced JSDoc headers in 6 core intelligence scripts.

---

## 🔗 Module Map

```
Intelligence Operations (6 Core Scripts)
├── 1. generate-news-enhanced.js
│   └── Module: Intelligence Operations/Automated News Generation
│       Category: Automated Intelligence Reporting
│       Purpose: Real-time news generation from parliament/government data
│
├── 2. mcp-client.js
│   └── Module: Intelligence Operations/MCP Intelligence Server Client
│       Category: MCP Intelligence Server Client
│       Purpose: 32-tool OSINT collection API client
│
├── 3. data-transformers.js
│   └── Module: Intelligence Operations/Data Transformation Pipeline
│       Category: Intelligence Data Transformation
│       Purpose: Raw data → structured intelligence content
│
├── 4. article-template.js
│   └── Module: Intelligence Operations/Article Template Generation
│       Category: Intelligence Report Templates
│       Purpose: Intelligence data → professional HTML articles
│
├── 5. editorial-pillars.js
│   └── Module: Intelligence Operations/Editorial Intelligence Framework
│       Category: Editorial Intelligence Framework
│       Purpose: 5-Pillar content strategy framework
│
└── 6. load-cia-stats.js
    └── Module: Intelligence Operations/CIA Statistical Intelligence
        Category: CIA Statistical Intelligence
        Purpose: Parliamentary/government statistics aggregation
```

---

## 📊 By Intelligence Function

### Automated Intelligence Reporting
- **Primary**: `generate-news-enhanced.js`
- **Support**: `mcp-client.js`, `data-transformers.js`, `article-template.js`
- **Context**: `editorial-pillars.js`, `load-cia-stats.js`

### OSINT Collection
- **Primary**: `mcp-client.js` (32 specialized tools)
- **Support**: `load-cia-stats.js` (CIA database integration)
- **Integration**: `generate-news-enhanced.js` orchestration

### Data Intelligence
- **Collection**: `mcp-client.js` (riksdag-regering-mcp)
- **Transformation**: `data-transformers.js` (semantic processing)
- **Analysis**: `load-cia-stats.js` (aggregated metrics)
- **Presentation**: `article-template.js` (visual intelligence)

### Editorial Intelligence
- **Framework**: `editorial-pillars.js` (5-Pillar structure)
- **Integration**: `generate-news-enhanced.js` (article generation)
- **Validation**: All scripts aligned to framework

---

## 🛡️ Security & Compliance Framework

### Threat Modeling
Each file documents specific threats with mitigations:

| Script | Threat | Mitigation |
|--------|--------|-----------|
| generate-news-enhanced.js | Data staleness | Fallback cache, health checks |
| | Source manipulation | Schema validation, integrity checking |
| mcp-client.js | API unavailability | Cache fallback, health checks |
| | Rate limiting | Request throttling, exponential backoff |
| data-transformers.js | Semantic loss | Preserve original language, human review |
| | Data hallucination | Fact-based extraction only |
| article-template.js | XSS injection | HTML entity escaping |
| | CSS injection | Style sandboxing |
| editorial-pillars.js | Editorial bias | Structured 5-Pillar framework |
| | False balance | Editorial judgment weighting |
| load-cia-stats.js | Data staleness | Timestamp validation, age indicators |
| | Statistical misinterpretation | Require context documentation |

### GDPR Compliance
All scripts align with:
- **Article 6(1)(e)**: Public interest processing (democratic transparency)
- **Article 9(2)(e)**: Political opinions manifestly made public
- **Article 17**: Right to erasure NOT applicable (historical records)

### ISO 27001 Controls
- **A.5.33**: Protection of records (Git audit trails)
- **A.5.34**: Privacy/PII protection (public officials only)
- **A.8.10**: Information deletion (documented retention)
- **A.8.19**: Security in use (HTTPS-only, CSP headers)

---

## 🔍 OSINT Capabilities by Tool

### Calendar Events (`mcp-client.js` → `generate-news-enhanced.js`)
- **Tool**: `get_calendar_events`
- **Output**: `transformCalendarToEventGrid()` → Week-ahead article
- **Intelligence**: Parliamentary schedule, event clustering, timeline analysis

### Document Discovery (`mcp-client.js` → `data-transformers.js`)
- **Tools**: `search_dokument`, `search_dokument_fulltext`, `search_regering`
- **Output**: `generateArticleContent()` → Committee reports, propositions
- **Intelligence**: Legislative intent analysis, impact assessment

### Voting Analysis (`mcp-client.js` → `data-transformers.js`)
- **Tool**: `search_voteringar`, `get_voting_group`
- **Output**: Party positions, coalition dynamics, risk indicators
- **Intelligence**: Party positioning, consensus/conflict patterns

### Statistics (`load-cia-stats.js`)
- **Source**: CIA production database (extraction_summary_report.csv)
- **Output**: Member demographics, productivity metrics, historical trends
- **Intelligence**: Comparative analysis, forecasting, benchmark data

---

## 📝 Analytical Techniques Documented

### Legislative Intent Analysis
- Keyword detection (policy domains)
- Stakeholder identification (ministries, parties)
- Impact type classification (fiscal, regulatory, social)
- Timeline extraction (implementation dates)
- Precedent linking (historical context)

### Party Position Inference
- Consensus detection (unanimous vs. split)
- Coalition formation (voting patterns)
- Opposition mapping (consistent opposition)
- Swing vote identification (position changes)

### Risk Indicator Extraction
- Fiscal implications
- Timeline constraints
- Stakeholder conflicts
- Implementation risks
- Political feasibility

---

## 🌍 Multi-Language Support (14 Languages)

All scripts support comprehensive multi-language operations:

**Supported Languages**:
1. English (en)
2. Swedish (sv)
3. Danish (da)
4. Norwegian (no)
5. Finnish (fi)
6. German (de)
7. French (fr)
8. Spanish (es)
9. Dutch (nl)
10. Arabic (ar) - RTL support
11. Hebrew (he) - RTL support
12. Japanese (ja)
13. Korean (ko)
14. Simplified Chinese (zh)

**Language-Specific Considerations**:
- Localized breadcrumbs: `getBreadcrumbName(lang, type)`
- Date formatting per language/locale
- Terminology mapping for political concepts
- RTL layout support (Arabic, Hebrew)
- Character encoding (UTF-8 with BOM handling)

---

## 📚 Documentation Links

### Architecture
- `docs/INTELLIGENCE_OPERATIONS.md` - Overall intelligence methodology
- `docs/MCP_INTEGRATION.md` - MCP server integration guide
- `docs/DATA_TRANSFORMATION_GUIDE.md` - Semantic processing algorithms

### Operations
- `docs/OSINT_COLLECTION.md` - Collection procedures
- `docs/EDITORIAL_STRATEGY.md` - Content strategy framework
- `docs/INTELLIGENCE_EXTRACTION.md` - Analysis techniques

### Compliance
- `docs/GDPR_COMPLIANCE.md` - GDPR framework
- `docs/COMPLIANCE_MATRIX.md` - ISMS mapping (ISO 27001, NIST CSF, CIS)
- `docs/SECURITY_STANDARDS.md` - Security controls

### Operational Details
- `docs/MCP_DATA_SCHEMA.md` - API response schemas
- `docs/TEMPLATE_ARCHITECTURE.md` - HTML template design
- `docs/ACCESSIBILITY_STANDARDS.md` - WCAG 2.1 AA compliance

---

## 🔧 Quick Code Examples

### Using Enhanced Headers in IDE

```javascript
// Hover in VS Code shows rich intelligence context:
import { generateArticleHTML } from './article-template.js';
// ↓ Hover reveals: @intelligence, @osint, @gdpr, @security sections

// Autocomplete shows parameter hints:
const html = generateArticleHTML({
  // IDE shows: "Content parameters validated against expected types"
  // + "HTML strings escaped via escapeHtml() helper"
  // + "@security Input Validation section..."
  title: "",
  content: ""
});
```

### Generating Documentation

```bash
# Generate comprehensive JSDoc documentation:
npx jsdoc scripts/generate-news-enhanced.js \
  scripts/mcp-client.js \
  scripts/data-transformers.js \
  scripts/article-template.js \
  scripts/editorial-pillars.js \
  scripts/load-cia-stats.js \
  --destination docs/api

# Result: HTML documentation with all intelligence context
```

### IDE Integration Benefits

1. **Parameter Hints**: Shows security considerations, data protections
2. **Type Information**: Links to GDPR compliance, risk models
3. **Return Type Docs**: Intelligence output format, validation requirements
4. **Cross-References**: Links between related modules
5. **Compliance Notes**: ISMS control references

---

## 🎯 Usage Patterns

### Pattern 1: Basic News Generation
```javascript
// generate-news-enhanced.js orchestrates full pipeline:
1. MCPClient.fetchCalendarEvents() → @osint
2. transformCalendarToEventGrid() → @intelligence
3. generateArticleHTML() → @security (input validation)
// Result: Professional intelligence article
```

### Pattern 2: Risk Assessment
```javascript
// load-cia-stats.js + mcp-client.js provides metrics:
1. Get coalition voting patterns → @intelligence
2. Extract risk indicators → @osint (source validation)
3. Publish with timestamps → @gdpr (transparency)
// Result: Political risk indicators with audit trail
```

### Pattern 3: Multi-Language Operations
```javascript
// All scripts support 14-language publishing:
1. Collect Swedish source data (MCP)
2. Transform to content (data-transformers)
3. Generate in 14 languages (article-template)
4. Respect locale conventions (editorial-pillars)
// Result: Global intelligence distribution
```

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| **Total Enhanced Scripts** | 6 |
| **JSDoc Tags Added** | 72 (12 per file) |
| **Intelligence Threats Modeled** | 30+ |
| **OSINT Collection Methods** | 32 (via MCP) |
| **Editorial Pillars** | 5 |
| **Supported Languages** | 14 |
| **GDPR Articles Referenced** | 6 |
| **ISO 27001 Controls Referenced** | 8+ |
| **NIST CSF Categories** | 5+ |
| **CIS Controls** | 3+ |

---

## ✅ Verification Checklist

**Header Completeness** (all 6 files):
- ✅ @module - Intelligence Operations domain
- ✅ @category - Intelligence Operations category
- ✅ @description - 100-150+ line comprehensive
- ✅ @intelligence - Analytical techniques
- ✅ @osint - Collection strategies
- ✅ @risk - Threat modeling
- ✅ @gdpr - Compliance mapping
- ✅ @security - Threat models
- ✅ @author - Hack23 AB
- ✅ @license - Apache-2.0
- ✅ @version - 2.0.0
- ✅ @see - Module cross-references

**Quality Standards**:
- ✅ Intelligence-grade documentation
- ✅ Practical threat modeling
- ✅ Compliance framework integration
- ✅ OSINT methodology documentation
- ✅ Cross-module references
- ✅ Developer experience optimization

---

## 🚀 Next Steps

1. **IDE Integration**: Configure JSDoc support in your editor
2. **Documentation Generation**: Create HTML docs from JSDoc
3. **Team Training**: Use enhanced headers for intelligence analyst onboarding
4. **Security Review**: Conduct threat model validation
5. **Compliance Audit**: Verify ISMS control alignment
6. **Operational Handover**: Use documentation for incident response training

---

**Last Updated**: 2025-01-20  
**Enhancement Status**: ✅ COMPLETE  
**Quality Standard**: Intelligence Operations Grade
