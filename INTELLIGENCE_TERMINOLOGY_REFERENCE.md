# Intelligence Operations Framework & Terminology Reference

**Comprehensive reference for intelligence terminology, analytical frameworks, and OSINT methodologies implemented in the enhanced JSDoc headers.**

---

## Table of Contents
1. [Intelligence Operations Framework](#intelligence-operations-framework)
2. [OSINT Methodologies](#osint-methodologies)
3. [Analytical Techniques](#analytical-techniques)
4. [Risk Assessment Framework](#risk-assessment-framework)
5. [Editorial Intelligence Framework](#editorial-intelligence-framework)
6. [Data Protection Framework](#data-protection-framework)
7. [Security Architecture](#security-architecture)
8. [Compliance Frameworks](#compliance-frameworks)

---

## Intelligence Operations Framework

### 1. Automated Intelligence Reporting Workflow

**Definition**: Systematic pipeline for collecting raw data, processing into intelligence products, and distributing to end users.

**Three-Stage Pipeline**:

#### Stage 1: OSINT Data Collection
- **Continuous Monitoring**: Real-time collection from official sources
- **Source Validation**: Verification against authoritative records
- **Data Integrity**: Schema validation and completeness checking
- **Audit Trails**: Git-based version control for reproducibility

**Implemented in**: `mcp-client.js` (32 specialized collection tools)

**Collection Methods**:
- Calendar-based collection (parliamentary schedules)
- Document discovery (legislative proposals, reports)
- Voting record analysis (party positions)
- Debate monitoring (parliamentary speeches)
- Government watch (policy announcements)

#### Stage 2: Intelligent Data Transformation
- **Semantic Processing**: Extract meaning from formal parliamentary language
- **Cross-Referencing**: Link related documents and voting patterns
- **Risk Extraction**: Identify fiscal, timeline, and political risks
- **Metadata Synthesis**: Generate publication metadata and citations

**Implemented in**: `data-transformers.js` (4 transformation functions)

**Processing Functions**:
- `transformCalendarToEventGrid()` - Temporal normalization
- `generateArticleContent()` - Semantic content synthesis
- `extractWatchPoints()` - Intelligence point identification
- `generateMetadata()` - Publication metadata

#### Stage 3: Automated Content Generation & Publication
- **Template-Based Rendering**: Professional HTML article generation
- **Multi-Language Distribution**: 14-language parallel publishing
- **SEO Optimization**: Structured data and social media sharing
- **Accessibility Compliance**: WCAG 2.1 AA standards

**Implemented in**: `article-template.js` (template engine)

### 2. Five Editorial Pillars Framework

**Definition**: Standardized content organization ensuring balanced political coverage.

**Framework Structure**:

| Pillar | Focus | Intelligence Purpose |
|--------|-------|---------------------|
| **Parliamentary Pulse** | Main legislative development | Identify lead story impact |
| **Government Watch** | Executive announcements/actions | Track policy implementation |
| **Opposition Dynamics** | Cross-party political analysis | Assess coalition stability |
| **Committee Intelligence** | Specialized committee work | Monitor policy development |
| **Looking Ahead** | Tomorrow's scheduled events | Forecast political activity |

**Implemented in**: `editorial-pillars.js` (EDITORIAL_PILLAR_HEADINGS export)

**Intelligence Applications**:
- Ensures balanced coverage across political actors
- Prevents editorial bias through structured framework
- Enables readers to track policy across branches
- Supports predictive analysis and forecasting

### 3. Statistical Intelligence Integration

**Definition**: Aggregated metrics providing context for political analysis.

**Statistical Categories**:
- Member demographics (age, gender, party distribution)
- Legislative productivity (bills, passes, rejections)
- Committee composition and party representation
- Voting patterns and consensus indices
- Government performance indicators
- Historical trend analysis

**Implemented in**: `load-cia-stats.js` (CIA database integration)

**Intelligence Applications**:
- Trend analysis (voting pattern shifts)
- Comparative analysis (cross-parliament benchmarking)
- Risk assessment (coalition stability)
- Forecasting (likely legislative outcomes)
- Public reporting (statistical transparency)

---

## OSINT Methodologies

### 1. Primary Source Collection Strategy

**Source Hierarchy**:
1. **Primary**: riksdag-regering-mcp server (official parliament/government API)
2. **Secondary**: CIA production database (historical statistics)
3. **Tertiary**: Riksdagen.se and Regeringen.se (direct access for validation)

**Collection Principles**:
- **Authoritative Sources**: Only official government/parliament APIs
- **Continuous Monitoring**: Real-time updates on parliamentary activity
- **Complete Coverage**: All major political actors and institutions
- **Historical Preservation**: Full archival of all data

**Implemented in**: `mcp-client.js` (32 specialized collection tools)

### 2. Source Validation Framework

**Validation Techniques**:

#### Schema Validation
- Verify expected fields present in API responses
- Type checking (strings, numbers, dates)
- Range validation (percentages 0-100, counts > 0)
- Format verification (ISO 8601 dates, email addresses)

#### Consistency Checking
- Cross-field validation (vote counts sum correctly)
- Temporal ordering (dates in correct sequence)
- Semantic validation (member counts match roster)
- Referential integrity (linked documents exist)

#### Freshness Verification
- Timestamp validation (data not older than threshold)
- Sync status checking (API updates completed)
- Health monitoring (API availability)
- Change detection (schema version tracking)

**Implemented in**: All modules use `escapeHtml()` and schema validation

### 3. Source Attribution & Transparency

**Attribution Requirements**:
- Hyperlinked document references to official sources
- MCP tool references (reproducible collection)
- Publication dates aligned with data collection
- Source status indicators (official, preliminary, final)

**Transparency Practices**:
- Published source attribution in articles
- API integration documented in privacy policy
- Processing impact assessment (low-risk: public data)
- Audit trails maintained via Git history

**Implemented in**: `article-template.js` (source links), all modules (Git tracking)

---

## Analytical Techniques

### 1. Legislative Intent Analysis

**Definition**: Extracting implicit meaning from formal parliamentary language.

**Techniques**:

#### Keyword Detection
- Policy domain identification (fiscal, healthcare, defense, education)
- Regulatory vs. advisory language classification
- Implementation timeline signals
- Stakeholder references

#### Stakeholder Identification
- Ministry/agency references
- Party group positions
- Committee jurisdictions
- External affected parties

#### Impact Type Classification
- Regulatory impact (new rules, restrictions)
- Fiscal impact (revenue, spending)
- Social impact (public services, rights)
- Implementation impact (timeline, resources)

#### Timeline Extraction
- Decision deadlines
- Implementation dates
- Phase rollout schedules
- Dependency chains

**Implemented in**: `data-transformers.js` (generateArticleContent)

### 2. Party Position Inference

**Definition**: Mapping voting records and statements to political positions.

**Techniques**:

#### Consensus Detection
- Unanimous votes (all parties agree)
- Supermajority (broad coalition support)
- Divided votes (fundamental disagreement)
- Absences (parliamentary absences indicate priority)

#### Coalition Formation Analysis
- Which parties vote together consistently?
- Which parties form temporary coalitions?
- Geographic representation patterns
- Committee assignment patterns

#### Opposition Mapping
- Which parties consistently oppose?
- Issue-based vs. blanket opposition
- Individual MP deviation patterns
- Party discipline indicators

#### Swing Vote Identification
- MPs changing positions across votes
- Party members crossing party lines
- Temporal evolution of positions
- Pressure point identification

**Implemented in**: `data-transformers.js` (extractWatchPoints)

### 3. Risk Indicator Extraction

**Definition**: Identifying critical intelligence points and risk factors.

**Risk Categories**:

#### Fiscal Risks
- Budget impact quantification
- Revenue vs. expenditure implications
- Fiscal sustainability implications
- Economic multiplier effects

#### Timeline Risks
- Implementation deadline pressure
- Interdependency constraints
- Decision sequence requirements
- Bottleneck identification

#### Political Risks
- Coalition stability threats
- Government longevity implications
- Electoral cycle timing
- Public opinion implications

#### Implementation Risks
- Resource requirements
- Stakeholder resistance
- Technical complexity
- Unintended consequences

**Implemented in**: `data-transformers.js` (extractWatchPoints)

---

## Risk Assessment Framework

### 1. Threat Modeling Methodology

**Definition**: Systematic identification of threats to intelligence operations.

**Threat Categories**:

#### Data Threats
- **Staleness**: Cached/delayed data not reflecting current situation
- **Corruption**: Compromised data modifying analysis
- **Loss**: Data unavailability blocking operations
- **Leakage**: Unauthorized pre-publication disclosure

#### System Threats
- **Unavailability**: API outages, network failures
- **Malfunction**: Bug-induced incorrect processing
- **Compromise**: Security breach affecting data integrity
- **Overload**: Rate limiting, DoS conditions

#### Process Threats
- **Bias**: Algorithmic or human bias in analysis
- **Error**: Incorrect analytical conclusions
- **Omission**: Missed critical intelligence
- **Confusion**: Misinterpretation of data

### 2. Mitigation Strategies

**For Each Threat**:
- **Detection**: How to identify when threat occurs
- **Prevention**: Proactive measures to prevent threat
- **Containment**: Limiting impact if threat occurs
- **Recovery**: Restoring operations after incident

**Implemented in**: Each module documents specific mitigations

### 3. Residual Risk Assessment

**Risk Evaluation**:
1. **Likelihood**: Probability threat will occur
2. **Impact**: Consequence if threat occurs
3. **Detectability**: How quickly we detect
4. **Recoverability**: Time to resume operations
5. **Acceptable Risk**: Risk level acceptable for operations

**Documented in**: @risk sections of each file

---

## Editorial Intelligence Framework

### 1. Content Curation Methodology

**Definition**: Journalistic process of selecting, prioritizing, and presenting information.

**Curation Principles**:

#### Newsworthiness Assessment
- **Significance**: Importance to readers
- **Impact**: Consequence for society
- **Timeliness**: Relevance to current events
- **Proximity**: Geographic/cultural relevance

#### Importance Ranking
- Lead story (most significant development)
- Secondary stories (important but less critical)
- Context (background and explanation)
- Forward-looking (implications and predictions)

#### Balance Verification
- Proportional coverage of different political actors
- Representation of multiple viewpoints
- Avoidance of false balance (don't equate consensus with fringe)
- Transparent source attribution

**Implemented in**: `editorial-pillars.js` (5-Pillar structure)

### 2. Narrative Construction Techniques

**Definition**: Organizing facts into coherent, understandable story.

**Structure Patterns**:

#### Inverted Pyramid
1. Lede (most important fact)
2. Summary (key facts)
3. Context (why it matters)
4. Details (supporting information)
5. Sources (documentation)

#### Contextual Framing
- Historical precedent (similar past events)
- Policy context (related initiatives)
- Political context (party positions)
- Public opinion context (reader expectations)

#### Predictive Analysis
- Likely implications
- Related upcoming events
- Potential complications
- Alternative outcomes

**Implemented in**: `data-transformers.js`, `article-template.js`

### 3. Multiple Perspective Integration

**Definition**: Ensuring all major viewpoints represented.

**Perspective Categories**:
- **Government**: Official policy position
- **Majority**: Parliamentary majority coalition view
- **Opposition**: Alternative policy proposals
- **Affected Parties**: Stakeholder impacts
- **Public**: Popular opinion (when relevant)

**Perspective Presentation**:
- Direct quotes when available
- Paraphrase of position
- Historical voting behavior
- Public statements

**Implemented in**: `editorial-pillars.js` (Opposition Dynamics pillar)

---

## Data Protection Framework

### 1. GDPR Compliance Architecture

**Legal Basis**: Article 6(1)(e) - Processing necessary for public interest

**Data Processing Principles**:

#### Lawfulness
- Public interest in democratic transparency
- Legitimate journalism purpose
- No commercial surveillance

#### Fairness
- Transparent processing (published source attribution)
- No hidden data use
- No unexpected processing
- Clear privacy policy

#### Transparency
- Published article sources
- API integration documented
- Processing methods explained
- Data retention policies explicit

**Implemented in**: All modules include @gdpr sections

### 2. Data Minimization Strategy

**Principle**: Collect/process only data necessary for stated purpose.

**Application**:

#### Exclusions (What NOT to collect)
- Personal contact information
- Family relationships/associations
- Medical/health information
- Biometric data
- Location tracking
- Behavioral profiling

#### Inclusions (What to collect)
- Public parliamentary records
- Official voting records
- Published government documents
- Public party positions
- Official committee memberships

**Implemented in**: Each module specifies data categories processed

### 3. Purpose Limitation Framework

**Principle**: Use data only for stated, lawful purpose.

**Allowed Purposes**:
- Journalism (news article generation)
- Democratic transparency (government accountability)
- Public information (historical records)
- Research (political science)

**Prohibited Purposes**:
- Commercial surveillance
- Political targeting/advertising
- Financial profiling
- Behavioral manipulation
- Data broker resale

**Implemented in**: @gdpr sections of each file

---

## Security Architecture

### 1. Threat Model - Transport Layer

**Threats**:
- **Man-in-the-Middle (MITM)**: Attacker intercepts HTTPS traffic
- **DNS Hijacking**: Traffic redirected to malicious server
- **SSL Stripping**: Force downgrade to HTTP

**Mitigations**:
- HTTPS-only communication (no HTTP fallback)
- Certificate verification (no self-signed certs)
- TLS 1.2+ minimum (strong encryption)
- HSTS headers (force HTTPS for repeat visits)

**Implemented in**: `mcp-client.js` (HTTPS-only MCP server)

### 2. Threat Model - Authentication Layer

**Threats**:
- **Token Theft**: Credentials stolen/compromised
- **Token Replay**: Stolen token reused
- **Brute Force**: Dictionary attack on credentials

**Mitigations**:
- Environment variables (secrets not in code)
- Token rotation policies
- Rate limiting on failed attempts
- Audit logging of authentication events

**Implemented in**: `mcp-client.js` (MCP_AUTH_TOKEN)

### 3. Threat Model - Data Validation Layer

**Threats**:
- **SQL Injection**: Malicious SQL in parameters
- **Script Injection**: Malicious JavaScript
- **Path Traversal**: Access unauthorized files
- **Command Injection**: Execute system commands

**Mitigations**:
- Input validation (type checking)
- Parameterized queries (where applicable)
- HTML entity escaping (content output)
- No eval() or dynamic code execution
- Whitelist validation (against known tools)

**Implemented in**: All modules via `escapeHtml()` helper

### 4. Threat Model - Dependency Security

**Threats**:
- **Supply Chain Attack**: Malicious dependency update
- **Outdated Dependencies**: Known vulnerabilities
- **Dependency Bloat**: Unnecessary transitive dependencies

**Mitigations**:
- Pinned dependency versions
- Regular vulnerability scanning
- Minimal external dependencies
- Source verification
- Build artifact signing

**Implemented in**: `package.json` with pinned versions

---

## Compliance Frameworks

### 1. ISO 27001:2022 - Information Security Management

**Applicable Controls**:

| Control | Requirement | Implementation |
|---------|------------|----------------|
| A.5.23 | Access Control | GitHub auth, branch protection |
| A.5.33 | Protection of Records | Git audit trails, version control |
| A.5.34 | Privacy/PII | Public officials only, no sensitive data |
| A.8.10 | Information Deletion | Documented retention policies |
| A.8.19 | Security in Use | HTTPS-only, CSP headers |

**Documented in**: @security sections of each file

### 2. NIST Cybersecurity Framework 2.0

**Relevant Categories**:

| Function | Category | Implementation |
|----------|----------|----------------|
| **Govern** | GV.RK-01 | Data classification, retention |
| **Identify** | ID.AM-05 | Resource prioritization (PUBLIC data) |
| **Protect** | PR.DS-05 | Protections against data leaks |
| **Detect** | DE.CM-04 | Malicious code detection |
| **Respond** | RS.CO-02 | Incident response procedures |

**Documented in**: @security and @risk sections

### 3. CIS Controls v8.1

**Critical Controls Implemented**:

| Control | Requirement | Implementation |
|---------|------------|----------------|
| 3.1 | Data Inventory | Documented public data sources |
| 6.1 | Secure Development | Code review requirements |
| 8.3 | Address Unauthorized Software | Dependency pinning |
| 10.2 | Audit Log Retention | Git history maintenance |
| 14.2 | Security in Development | No hardcoded secrets |

**Documented in**: @security sections of each file

### 4. GDPR - General Data Protection Regulation

**Articles Addressed**:

| Article | Requirement | Implementation |
|---------|------------|----------------|
| 6(1)(e) | Lawfulness | Public interest processing |
| 9(2)(e) | Special Categories | Political opinions manifestly public |
| 13 | Information Provided | Transparent source attribution |
| 17 | Right to Erasure | Not applicable (historical records) |
| 32 | Security | HTTPS, input validation, access control |

**Documented in**: @gdpr sections of each file

---

## Terminology Reference

### Intelligence Operations Terms

| Term | Definition | Usage |
|------|-----------|-------|
| **OSINT** | Open Source Intelligence | Collection from public sources |
| **Intelligence Reporting** | Structured information for decision makers | News article generation |
| **Source Validation** | Verification of information accuracy | Schema validation, cross-reference |
| **Watch Points** | Critical intelligence requiring monitoring | Risk indicators extracted from data |
| **Threat Modeling** | Systematic identification of security threats | @risk sections in headers |
| **Coalition Dynamics** | Alliance patterns between political actors | Party position inference |
| **Political Risk** | Possibility of political decisions impacting outcomes | Timeline, stakeholder, implementation risks |
| **Intelligence Product** | Finished output for end users | Generated news articles |

### Analytical Framework Terms

| Term | Definition | Usage |
|------|-----------|-------|
| **Intent Analysis** | Extracting meaning from formal language | Legislative intent extraction |
| **Stakeholder Mapping** | Identifying affected parties | Government department identification |
| **Risk Extraction** | Identifying potential problems | Fiscal, timeline, political risks |
| **Narrative Coherence** | Logical connection of facts | Cross-reference validation |
| **Impact Assessment** | Evaluating consequences | Policy impact quantification |
| **Feasibility Analysis** | Evaluating likelihood of success | Coalition stability assessment |
| **Forward Analysis** | Predictive assessment of future events | "Looking Ahead" pillar |

### Data Protection Terms

| Term | Definition | Usage |
|------|-----------|-------|
| **Data Minimization** | Collect only necessary data | Personal data exclusion |
| **Purpose Limitation** | Use data only for stated purpose | Journalism purpose only |
| **Transparency** | Clear processing disclosure | Source attribution requirements |
| **Integrity** | Data accuracy and completeness | Schema validation |
| **Confidentiality** | Preventing unauthorized access | HTTPS-only, access control |
| **Retention** | Time data is kept | Indefinite for articles, 90 days for logs |

---

## Summary

The enhanced JSDoc headers implement a comprehensive intelligence operations framework incorporating:

✅ **OSINT Methodologies**: Professional intelligence collection techniques  
✅ **Analytical Frameworks**: Structured analysis of political data  
✅ **Risk Assessment**: Systematic threat identification and mitigation  
✅ **Editorial Intelligence**: 5-Pillar balanced coverage framework  
✅ **Data Protection**: GDPR compliance and privacy controls  
✅ **Security Architecture**: Multi-layer threat model and controls  
✅ **Compliance Integration**: ISO 27001, NIST CSF, CIS Controls mapping  

This positions Riksdagsmonitor as an intelligence-grade platform for democratic transparency and journalistic operations.

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-20  
**Classification**: Open Source / Public Information  
**Author**: Hack23 AB - Intelligence Operations Team
