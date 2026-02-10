# 🏗️ Riksdagsmonitor - System Architecture

**Document Version:** 1.3  
**Last Updated:** 2026-02-10  
**Classification:** Public  
**Owner:** Hack23 AB (Org.nr 5595347807)

## Executive Summary

Riksdagsmonitor is a web application providing Swedish Parliament intelligence through interactive dashboards (Chart.js/D3.js) and CIA platform integration. Deployed on AWS CloudFront with multi-region S3 storage (us-east-1 primary, eu-west-1 replica) and GitHub Pages disaster recovery. This document describes the system architecture, component interactions, data flows, and design decisions aligned with Hack23 AB's ISMS standards.

## 1. System Overview

### 1.1 Architecture Diagram

```mermaid
graph TB
    subgraph "User Layer"
        Users[End Users<br/>Global Audience]
        Browsers[Web Browsers<br/>Chrome, Safari, Firefox]
    end
    
    subgraph "Content Delivery Layer"
        Route53[AWS Route 53<br/>DNS + Health Checks]
        CF[AWS CloudFront<br/>600+ Edge Locations]
        GHCDN[GitHub Pages CDN<br/>DR Standby]
    end
    
    subgraph "Application Layer"
        Static[Static Website<br/>HTML/CSS]
        Index[index.html<br/>14 Languages]
        Styles[styles.css<br/>107KB]
    end
    
    subgraph "Storage Layer"
        S3US[S3 us-east-1<br/>Primary Storage]
        S3EU[S3 eu-west-1<br/>Replica Storage]
    end
    
    subgraph "Data Layer"
        CIA[CIA Platform<br/>www.hack23.com/cia]
        Riksdag[Swedish Parliament<br/>data.riksdagen.se]
        Val[Election Authority<br/>val.se]
        ESV[Financial Authority<br/>esv.se]
        WB[World Bank<br/>data.worldbank.org]
    end
    
    subgraph "Infrastructure Layer"
        GitHub[GitHub Repository<br/>Version Control]
        Actions[GitHub Actions<br/>CI/CD Dual Deploy]
        Pages[GitHub Pages<br/>DR Hosting]
    end
    
    Users --> Browsers
    Browsers -->|DNS Query| Route53
    Route53 -->|DNS Response: CF Primary| Browsers
    Route53 -.->|DNS Response: GHCDN on Failover| Browsers
    Browsers -->|HTTPS/TLS 1.3| CF
    Browsers -.->|HTTPS/TLS 1.3 (DR)| GHCDN
    CF -->|Origin| S3US
    CF -.->|Origin Failover on 500+ errors| S3EU
    S3US -.->|S3 CRR (Async, &lt;15 min target)| S3EU
    CF --> Static
    GHCDN --> Pages
    Pages --> Static
    Static --> Index
    Static --> Styles
    
    Browsers -->|External Links| CIA
    CIA --> Riksdag
    CIA --> Val
    CIA --> ESV
    CIA --> WB
    
    GitHub --> Actions
    Actions -->|Deploy| S3US
    Actions -->|Deploy| Pages
    
    style Users fill:#e1f5ff
    style CF fill:#4caf50
    style S3US fill:#2196f3
    style S3EU fill:#64b5f6
    style GHCDN fill:#90caf9
    style Static fill:#81c784
    style CIA fill:#9c27b0
    style GitHub fill:#ff9800
```

### 1.2 Component Responsibilities

| Component | Responsibility | Technology | Status |
|-----------|---------------|------------|--------|
| **Interactive Dashboards** | Data visualization | Chart.js v4.4.1, D3.js v7 | ✅ Active |
| **Static Website** | Present intelligence content | HTML/CSS/JavaScript | ✅ Active |
| **AWS CloudFront** | Primary CDN | 600+ global PoPs | ✅ Active |
| **S3 us-east-1** | Primary storage | Amazon S3 + versioning | ✅ Active |
| **S3 eu-west-1** | Replica storage | S3 replication | ✅ Active |
| **Route 53** | DNS + health checks | AWS managed DNS | ✅ Active |
| **GitHub Pages** | DR hosting | GitHub CDN | ✅ Standby |
| **GitHub Actions** | CI/CD automation | YAML workflows | ✅ Active |
| **CIA Platform** | Data processing & analysis | Java/Spring Boot | ✅ External |
| **Data Sources** | Raw political data | Open APIs | ✅ External |

## 2. Data Flow Architecture

### 2.1 Content Delivery Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant DNS as Route 53 DNS
    participant CDN as AWS CloudFront
    participant S3 as S3 us-east-1
    participant CIA as CIA Platform
    
    User->>Browser: Visit riksdagsmonitor.com
    Browser->>DNS: Resolve domain
    DNS-->>Browser: CloudFront endpoint
    Browser->>CDN: HTTPS request
    CDN->>S3: Fetch index.html
    S3-->>CDN: HTML content
    CDN-->>Browser: Render page
    Browser->>CDN: Fetch styles.css
    CDN->>S3: Get CSS
    S3-->>CDN: CSS content
    CDN-->>Browser: Apply styling
    
    Note over Browser,CIA: User clicks CIA link
    Browser->>CIA: Navigate to dashboard
    CIA-->>Browser: Interactive data
    
    Note over Browser: Static content cached
    Note over CDN: Edge caching active (600+ PoPs)
```

### 2.2 CI/CD Deployment Flow

```mermaid
graph LR
    A[Developer Commit] --> B[GitHub Push]
    B --> C[Trigger Workflows]
    
    C --> D[Quality Checks]
    C --> E[Dependency Review]
    
    D --> F{HTML Valid?}
    E --> G{No Vulnerabilities?}
    
    F -->|Yes| H[Links OK?]
    F -->|No| I[Block Deployment]
    
    G -->|Yes| J[Approve]
    G -->|No| I
    
    H -->|Yes| K[Merge to Main]
    H -->|No| I
    
    J --> K
    K --> L[Dual Deploy: S3 + GitHub Pages]
    L --> M[CloudFront Update Primary]
    L --> N[GitHub Pages DR Standby]
    M --> O[Live on riksdagsmonitor.com]
    
    style D fill:#4caf50
    style E fill:#ff9800
    style K fill:#2196f3
    style I fill:#f44336
    style N fill:#4caf50
```

## 3. Component Architecture

### 3.1 Static Website Structure

```mermaid
graph TD
    subgraph "HTML Pages"
        Index[index.html<br/>English + 4 Functional Dashboards]
        LangSV[index_sv.html<br/>Swedish]
        LangDA[index_da.html<br/>Danish]
        LangNO[index_no.html<br/>Norwegian]
        LangOther[10 other languages...]
    end
    
    subgraph "JavaScript Dashboards"
        InlineScript[Inline Script<br/>946 lines<br/>Risk + Anomaly Detection]
        ExtJS1[scripts/committees-dashboard.js<br/>39KB - Committee]
        ExtJS2[scripts/coalition-dashboard.js<br/>33KB - Coalition]
        ExtJS3[js/election-cycle-dashboard.js<br/>46KB - Election Cycle]
        Placeholders[5 Placeholder Sections<br/>Party, Seasonal, Pre-Election,<br/>Ministry, Anomaly Detection<br/>HTML only, no JS]
    end
    
    subgraph "Styling"
        CSS[styles.css<br/>107KB]
        Fonts[Google Fonts<br/>Inter, Orbitron]
    end
    
    subgraph "External Libraries"
        Chart[Chart.js v4.4.1<br/>via CDN + SRI]
        D3[D3.js v7<br/>via CDN + SRI]
    end
    
    subgraph "Configuration"
        CNAME[CNAME<br/>riksdagsmonitor.com]
        Sitemap[sitemap.xml<br/>14 pages]
        Robots[robots.txt<br/>SEO config]
    end
    
    subgraph "Documentation"
        Readme[README.md]
        Security[SECURITY_ARCHITECTURE.md]
        Threat[THREAT_MODEL.md]
        Workflows[WORKFLOWS.md]
        Arch[ARCHITECTURE.md]
    end
    
    Index --> InlineScript
    Index --> ExtJS1
    Index --> ExtJS2
    Index --> ExtJS3
    Index --> Placeholders
    Index --> CSS
    
    LangSV --> CSS
    LangDA --> CSS
    LangNO --> CSS
    LangOther --> CSS
    
    InlineScript --> Chart
    InlineScript --> D3
    ExtJS1 --> Chart
    ExtJS1 --> D3
    ExtJS2 --> Chart
    ExtJS2 --> D3
    ExtJS3 --> Chart
    ExtJS3 --> D3
    
    CSS --> Fonts
    
    style Index fill:#4caf50
    style InlineScript fill:#ff9800
    style Placeholders fill:#9e9e9e
    style CSS fill:#2196f3
    style Chart fill:#ff9800
    style D3 fill:#ff9800
    style Security fill:#f44336
```

### 3.2 External Integration Architecture

```mermaid
graph TB
    subgraph "Riksdagsmonitor"
        Website[Static Website]
    end
    
    subgraph "CIA Platform"
        Dashboard[Intelligence Dashboard]
        Party[Party Performance]
        Cabinet[Government Cabinet]
        Politicians[Politician Analysis]
        Top10[Top 10 Rankings]
    end
    
    subgraph "Data Sources"
        Riksdag[Swedish Parliament API]
        Val[Election Authority]
        ESV[Financial Authority]
        WorldBank[World Bank Data]
    end
    
    Website -->|External Links| Dashboard
    Website -->|External Links| Party
    Website -->|External Links| Cabinet
    Website -->|External Links| Politicians
    Website -->|External Links| Top10
    
    Dashboard --> Riksdag
    Party --> Riksdag
    Cabinet --> Riksdag
    Politicians --> Riksdag
    Top10 --> Riksdag
    
    Dashboard --> Val
    Dashboard --> ESV
    Dashboard --> WorldBank
    
    style Website fill:#4caf50
    style Dashboard fill:#9c27b0
    style Riksdag fill:#ff9800
```

### 3.3 GitHub Copilot MCP Server Integration

Riksdagsmonitor leverages GitHub Copilot with Model Context Protocol (MCP) servers for advanced political intelligence analysis and automation.

#### MCP Server Architecture

```mermaid
graph TB
    subgraph "GitHub Copilot Environment"
        Agent[intelligence-operative Agent]
        Skills[18 Strategic Skills]
    end
    
    subgraph "MCP Servers"
        RR[riksdag-regering-mcp<br/>HTTP: riksdag-regering-ai.onrender.com/mcp]
        GH[GitHub MCP<br/>HTTP: api.githubcopilot.com/mcp/insiders]
        FS[Filesystem MCP<br/>Local: mcp-server-filesystem]
        Mem[Memory MCP<br/>Local: mcp-server-memory]
        PW[Playwright MCP<br/>Local: @playwright/mcp]
    end
    
    subgraph "Data Sources"
        Riksdag[Riksdagen API<br/>data.riksdagen.se]
        Regering[Regeringen<br/>via g0v.se]
    end
    
    Agent --> Skills
    Agent --> RR
    Agent --> GH
    Agent --> FS
    Agent --> Mem
    Agent --> PW
    
    RR --> Riksdag
    RR --> Regering
    
    style Agent fill:#9c27b0
    style Skills fill:#4caf50
    style RR fill:#ff9800
    style GH fill:#2196f3
```

#### riksdag-regering-mcp Server

**Purpose**: Provides specialized access to Swedish political data for intelligence analysis

**Configuration**:
```json
{
  "riksdag-regering": {
    "type": "http",
    "url": "https://riksdag-regering-ai.onrender.com/mcp",
    "tools": ["*"]
  }
}
```

**32 Available Tools**:
1. **Ledamöter (MPs)**: Information, activities, assignments, biographical data
2. **Riksdagsdokument (Documents)**: Motions, written questions, interpellations, bills
3. **Anföranden (Speeches)**: Chamber debates, committee statements, plenary speeches
4. **Voteringar (Votes)**: Voting records, party discipline, coalition patterns
5. **Regeringsdokument (Government)**: SOU reports, propositions, press releases

**Data Sources**:
- **Riksdagen API**: https://data.riksdagen.se/ (Official Parliament API, 98.5% completeness)
- **Regeringen via g0v.se**: https://g0v.se/ (Open government data)

**Use Cases**:
- Political intelligence dashboards
- Voting pattern analysis
- Coalition behavior tracking
- Legislative monitoring
- Risk assessment for democratic accountability

#### Integration Benefits

| Capability | Without MCP | With MCP |
|------------|-------------|----------|
| **Data Access** | Manual API calls | Automated via 32 specialized tools |
| **Analysis** | Generic prompts | Domain-specific intelligence-operative agent |
| **Expertise** | Basic knowledge | 18 strategic skills (political science, OSINT, Swedish politics) |
| **Efficiency** | Multi-step workflows | Integrated single-step operations |
| **Compliance** | Manual GDPR checks | Built-in GDPR compliance skill |

**Security Considerations**:
- HTTP-only MCP server (no local execution risk)
- Public data sources only (GDPR Article 6(1)(e) compliance)
- No authentication required (public API access)
- Rate limiting handled by remote server
- See [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) for full details

## 4. Security Architecture Integration

### 4.1 Defense-in-Depth Layers

```mermaid
graph TD
    Layer1[Layer 1: Network Security<br/>HTTPS/TLS 1.3, CDN DDoS Protection]
    Layer2[Layer 2: Application Security<br/>Static HTML/CSS Only, No Server-Side Code]
    Layer3[Layer 3: Access Control<br/>GitHub MFA, SSH Keys, GPG Signing]
    Layer4[Layer 4: Data Integrity<br/>Git Immutable History, Branch Protection]
    Layer5[Layer 5: Monitoring<br/>Dependabot, CodeQL, Secret Scanning]
    Layer6[Layer 6: Incident Response<br/>Documented Procedures, Rollback Capability]
    
    Layer1 --> Layer2
    Layer2 --> Layer3
    Layer3 --> Layer4
    Layer4 --> Layer5
    Layer5 --> Layer6
    
    style Layer1 fill:#4caf50
    style Layer2 fill:#4caf50
    style Layer3 fill:#ff9800
    style Layer4 fill:#ff9800
    style Layer5 fill:#2196f3
    style Layer6 fill:#f44336
```

### 4.2 Security Control Mapping

See [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) for comprehensive security controls documentation.

## 5. Data Architecture

### 5.1 Content Structure

```mermaid
graph LR
    subgraph "Content Types"
        HTML[HTML Pages<br/>14 Languages]
        CSS[Stylesheets<br/>Responsive Design]
        Images[Images<br/>CIA Logo, Icons]
        Config[Configuration<br/>Sitemap, Robots, CNAME]
    end
    
    subgraph "Storage"
        Git[Git Repository<br/>Version Control]
        CDN[GitHub Pages CDN<br/>Global Distribution]
    end
    
    HTML --> Git
    CSS --> Git
    Images --> Git
    Config --> Git
    
    Git --> CDN
    
    style Git fill:#ff9800
    style CDN fill:#90caf9
```

### 5.2 Data Sources

| Source | Type | Update Frequency | Integration |
|--------|------|------------------|-------------|
| **Swedish Parliament** | Votes, Documents, MPs | Real-time | CIA Platform |
| **Election Authority** | Results, Statistics | Post-election | CIA Platform |
| **Financial Authority** | Budget, Spending | Monthly | CIA Platform |
| **World Bank** | Country Indicators | Quarterly | CIA Platform |

## 6. Scalability Architecture

### 6.1 Traffic Handling

```mermaid
graph TB
    Users[End Users<br/>Global Traffic]
    
    subgraph "CDN Layer"
        Edge1[Edge Server<br/>North America]
        Edge2[Edge Server<br/>Europe]
        Edge3[Edge Server<br/>Asia]
    end
    
    subgraph "Origin"
        GitHub[GitHub Pages<br/>Primary Origin]
    end
    
    Users --> Edge1
    Users --> Edge2
    Users --> Edge3
    
    Edge1 -->|Cache Miss| GitHub
    Edge2 -->|Cache Miss| GitHub
    Edge3 -->|Cache Miss| GitHub
    
    Edge1 -->|Cache Hit| Users
    Edge2 -->|Cache Hit| Users
    Edge3 -->|Cache Hit| Users
    
    style GitHub fill:#ff9800
    style Edge1 fill:#90caf9
    style Edge2 fill:#90caf9
    style Edge3 fill:#90caf9
```

### 6.2 Performance Characteristics

| Metric | Target | Current | Method |
|--------|--------|---------|--------|
| **First Contentful Paint** | <1.5s | <1s | Static files, CDN caching |
| **Time to Interactive** | <3s | <2s | No JavaScript dependencies |
| **Largest Contentful Paint** | <2.5s | <2s | Optimized CSS, cached fonts |
| **Cumulative Layout Shift** | <0.1 | <0.05 | Stable layout, no dynamic content |

## 7. Monitoring Architecture

### 7.1 Observability Stack

```mermaid
graph TB
    subgraph "Monitoring Sources"
        GH[GitHub Actions<br/>Workflow Results]
        Pages[GitHub Pages<br/>Deployment Status]
        Security[GitHub Security<br/>Dependabot, CodeQL]
    end
    
    subgraph "Alerting"
        Email[Email Notifications]
        PR[PR Comments]
        Dashboard[GitHub Dashboard]
    end
    
    subgraph "Metrics"
        Quality[Quality Metrics<br/>HTML Validation, Links]
        Deps[Dependency Metrics<br/>Vulnerabilities, Updates]
        Deploy[Deployment Metrics<br/>Success Rate, Frequency]
    end
    
    GH --> Quality
    Pages --> Deploy
    Security --> Deps
    
    Quality --> Email
    Deps --> PR
    Deploy --> Dashboard
    
    style GH fill:#ff9800
    style Security fill:#f44336
    style Dashboard fill:#2196f3
```

### 7.2 Metrics Collection

**Tracked Metrics:**
- Workflow execution success rate
- HTML validation pass rate
- Link check failure count
- Dependency vulnerability count
- Deployment frequency
- Time to deploy

**Retention Policy:**
- Workflow runs: 90 days
- Artifacts: 30 days
- Security findings: Permanent
- Deployment logs: 90 days

## 8. Technology Stack

### 8.1 Frontend Stack

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **HTML5** | Standard | Content structure | Universal browser support |
| **CSS3** | Standard | Styling & layout | Responsive design, no framework overhead |
| **JavaScript ES6+** | Standard | Interactive dashboards | Modern browser features |
| **Chart.js** | v4.4.1 | Data visualization | Industry standard, 62k+ GitHub stars |
| **D3.js** | v7 | Advanced visualizations | Powerful, flexible, 108k+ GitHub stars |
| **Google Fonts** | Latest | Typography | Professional appearance, cached globally |

### 8.2 Infrastructure Stack

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **AWS CloudFront** | Latest | Primary CDN | Global edge locations, DDoS protection |
| **AWS S3** | Latest | Primary storage | Reliable, scalable, versioning support |
| **AWS Route 53** | Latest | DNS with failover | Health checks, automatic failover |
| **GitHub Pages** | Latest | DR hosting | Free, reliable, global CDN |
| **GitHub Actions** | Latest | CI/CD | Integrated with repository, secure |
| **HTMLHint** | Latest | HTML validation | Industry standard validator |
| **Linkinator** | v6 | Link checking | Reliable, actively maintained |
| **npm** | Latest | Package management | JavaScript dependency management |

### 8.3 External Dependencies

| Dependency | Type | Risk Level | Mitigation |
|------------|------|------------|------------|
| **AWS CloudFront** | Infrastructure | LOW | 99.95% SLA, GitHub Pages DR |
| **AWS S3** | Infrastructure | LOW | Cross-region replication, versioning |
| **AWS Route 53** | Infrastructure | LOW | 100% SLA, health checks |
| **GitHub Pages** | Infrastructure (DR) | LOW | 99.9% SLA |
| **Chart.js CDN** | External Library | LOW | SRI hash validation, trusted CDN |
| **D3.js CDN** | External Library | LOW | SRI hash validation, trusted CDN |
| **Google Fonts** | CDN | LOW | Cached, fallback fonts available |
| **CIA Platform** | External Service | LOW | Independent service, documented links |

## 9. Deployment Architecture

### 9.1 Deployment Pipeline

```mermaid
graph LR
    Dev[Development] --> Commit[Git Commit]
    Commit --> Push[Git Push]
    Push --> PR[Pull Request]
    
    PR --> Quality[Quality Checks]
    PR --> Security[Security Checks]
    
    Quality --> Review[Code Review]
    Security --> Review
    
    Review --> Merge[Merge to Main]
    Merge --> Deploy[GitHub Pages Deploy]
    Deploy --> Live[Live Site]
    
    style Quality fill:#4caf50
    style Security fill:#f44336
    style Deploy fill:#2196f3
    style Live fill:#4caf50
```

### 9.2 Rollback Strategy

**Rollback Methods:**
1. **Git Revert:** Immediate rollback via git revert command
2. **Branch Protection:** Required reviews prevent bad code
3. **Immutable History:** Complete audit trail for forensics
4. **Rapid Deployment:** Re-deploy takes <2 minutes

**Rollback SLA:**
- Detection: <5 minutes (monitoring alerts)
- Decision: <10 minutes (review incident)
- Execution: <2 minutes (git revert + deploy)
- **Total RTO:** <17 minutes

## 10. Future Architecture

### 10.1 Planned Enhancements

See [FUTURE_SECURITY_ARCHITECTURE.md](FUTURE_SECURITY_ARCHITECTURE.md) for detailed roadmap.

**Q2 2026:**
- DAST scanning integration
- Performance monitoring (Lighthouse CI)
- Automated translation workflows

**Q3 2026:**
- Advanced link monitoring
- Security header enhancement
- Accessibility improvements

**Q4 2026:**
- Multi-language content generation
- A/B testing framework
- Analytics integration

## 11. Design Decisions

### 11.1 Key Architectural Choices

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| **Interactive Dashboards (Chart.js/D3.js)** | Rich data visualization, modern UX | Increases attack surface, requires JavaScript |
| **AWS CloudFront Primary** | 600+ PoPs, DDoS protection, 99.95% SLA | Cost for high traffic, vendor lock-in |
| **GitHub Pages DR** | Free, reliable secondary deployment | Platform dependency |
| **External CIA Platform** | Reuse existing OSINT infrastructure | External service dependency |
| **Client-Side Rendering** | No server-side code, reduced attack surface | Browser compatibility requirements |
| **Multi-language Files** | SEO optimization, clear URL structure | File duplication |
| **SRI for CDN Resources** | Supply chain security, tamper detection | Requires version pinning, update coordination |

### 11.2 Architecture Principles

1. **Security by Design:** Dual deployment with automatic failover, defense-in-depth
2. **Defense in Depth:** Multiple security layers (AWS Shield, CSP, SRI, OIDC)
3. **Resilience:** Multi-region storage, cross-region replication, automatic failover
4. **Transparency:** Open source, public ISMS, documented architecture
5. **Performance:** CDN caching, client-side rendering, optimized assets
6. **Usability:** Interactive dashboards with modern visualizations

## 12. Related Documentation

### ISMS Documentation
- [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) - Security controls and compliance
- [THREAT_MODEL.md](THREAT_MODEL.md) - STRIDE analysis and risk assessment
- [WORKFLOWS.md](WORKFLOWS.md) - CI/CD workflows and automation
- [FUTURE_SECURITY_ARCHITECTURE.md](FUTURE_SECURITY_ARCHITECTURE.md) - Future roadmap

### External References
- [Hack23 ISMS](https://github.com/Hack23/ISMS)
- [Secure Development Policy](https://github.com/Hack23/ISMS/blob/main/Secure_Development_Policy.md)
- [CIA Platform Architecture](https://github.com/Hack23/cia/blob/master/ARCHITECTURE.md)

---

**Document Control:**
- **Repository:** https://github.com/Hack23/riksdagsmonitor
- **Path:** /ARCHITECTURE.md
- **Format:** Markdown with Mermaid diagrams
- **Classification:** Public
- **Next Review:** 2026-05-10
