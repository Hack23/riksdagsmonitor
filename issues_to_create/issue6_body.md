## 📋 Issue Type
**Feature** - Interactive network visualization for committee influence mapping

## 🎯 Objective
Build advanced interactive network visualization showing committee assignments, influence patterns, collaboration networks, and hub/bridge identification for 349 MPs and 15 Riksdag committees using D3.js force-directed graphs.

## 📊 Current State
- **Network Visualization**: None exists
- **Committee Data**: No committee network integration
- **Influence Metrics**: No network centrality calculations
- **CIA Integration**: External links only
- **Visualization**: Static content
- **Collaboration Analysis**: No pattern detection

## 🚀 Desired State
- **Interactive Network Graph**: D3.js force-directed graph with 364 nodes (349 MPs + 15 committees)
- **Network Centrality**: Degree, betweenness, closeness, eigenvector centrality calculations
- **Influence Mapping**: PageRank-style influence scoring
- **Collaboration Patterns**: Edge-based relationship visualization
- **Hub/Bridge Identification**: Key connectors and information brokers
- **Committee Profiles**: Individual pages for all 15 committees
- **Responsive Design**: Mobile, tablet, desktop support
- **Multi-Language**: Functional in all 14 languages

## 📊 CIA Data Integration Context

**Committee Network Analysis Product** (CIA Product #15):

**Data Sources**:
- **Committee Schema**: https://github.com/Hack23/cia/blob/master/json-export-specs/schemas/committee-schema.md (11.4 KB)
- **Politician Schema**: https://github.com/Hack23/cia/blob/master/json-export-specs/schemas/politician-schema.md (21.9 KB)
- **Sample Data**: https://github.com/Hack23/cia/tree/master/service.data.impl/sample-data
- **OSINT Methods**: https://github.com/Hack23/cia/blob/master/DATA_ANALYSIS_INTOP_OSINT.md (451.4 KB)
- **Business Product Doc**: https://github.com/Hack23/cia/blob/master/BUSINESS_PRODUCT_DOCUMENT.md (Product #15)

**Network Components**:

1. **Nodes** (364 total):
   - **349 MP Nodes**: Sized by influence score
   - **15 Committee Nodes**: Sized by member count
   - Color-coded by party/function

2. **Edges** (relationships):
   - **Committee Memberships**: MP ↔ Committee links
   - **Collaboration Patterns**: MP ↔ MP co-sponsorship
   - **Leadership Roles**: Chairperson, deputy relationships
   - Edge thickness: collaboration strength

3. **Network Metrics**:
   - **Degree Centrality**: Direct connections count
   - **Betweenness Centrality**: Information flow control
   - **Closeness Centrality**: Network efficiency
   - **Eigenvector Centrality**: Connection to influential nodes
   - **PageRank**: Influence scoring algorithm

4. **15 Riksdag Committees**:
   - Constitutional Committee (KU)
   - Finance Committee (FiU)
   - Tax Committee (SkU)
   - Justice Committee (JuU)
   - Defense Committee (FöU)
   - Social Insurance Committee (SfU)
   - Health and Welfare Committee (SoU)
   - Cultural Committee (KrU)
   - Education Committee (UbU)
   - Transport Committee (TU)
   - Environment Committee (MJU)
   - Agriculture Committee (MJU)
   - Labor Market Committee (AU)
   - Civil Affairs Committee (CU)
   - Foreign Affairs Committee (UU)

**Implementation Notes**:
- Review committee-schema.md and politician-schema.md for complete data model
- Leverage CIA OSINT methodologies for network analysis algorithms
- Validate against sample data for accuracy
- Reference Business Product Doc for visualization specifications

## 🔧 Implementation Approach

### Phase 1: Data & Network Analysis (Weeks 1-2)
1. **Schema Review & Data Collection**
   - Review committee-schema.md (11.4 KB)
   - Review politician-schema.md (21.9 KB)
   - Collect 349 MP profiles with committee assignments
   - Collect 15 committee profiles with membership lists
   - Extract collaboration data (co-sponsored bills, shared votes)

2. **Network Graph Construction**
   - Build adjacency matrix (364x364)
   - MP-Committee edges (membership links)
   - MP-MP edges (collaboration patterns)
   - Edge weighting (collaboration frequency/strength)

3. **Centrality Calculations**
   - Implement degree centrality algorithm
   - Implement betweenness centrality (shortest paths)
   - Implement closeness centrality (inverse distances)
   - Implement eigenvector centrality (iterative)
   - Implement PageRank algorithm (influence scoring)

### Phase 2: D3.js Visualization (Weeks 3-4)
1. **Force-Directed Graph**
   - D3.js v7 force simulation
   - Node rendering: circles with labels
   - Edge rendering: lines with varying thickness
   - Color coding: parties, committees
   - Node sizing: influence-based
   - Collision detection and constraints

2. **Interactive Features**
   - Zoom and pan (d3-zoom)
   - Node drag and drop
   - Node click: show details panel
   - Node hover: highlight connections
   - Filter controls: by party, committee, metric
   - Search: find specific MPs or committees
   - Time slider: historical network evolution

3. **Layout Options**
   - Force-directed (default)
   - Hierarchical (committee-centric)
   - Circular (party-grouped)
   - Matrix view (adjacency matrix heatmap)

### Phase 3: Committee & MP Profiles (Weeks 5-6)
1. **Committee Profile Pages** (15 pages)
   - Committee overview: name, mandate, members
   - Member list: all MPs with roles (chair, deputy, member)
   - Influence metrics: collective centrality scores
   - Legislative output: bills, reports, decisions
   - Meeting schedule and attendance
   - Historical composition and changes
   - Network visualization: committee-centric view

2. **MP Profile Integration**
   - Network tab on MP profile pages
   - Personal network visualization
   - Committee memberships timeline
   - Collaboration partners (top 10)
   - Influence score and rank
   - Centrality metrics breakdown

### Phase 4: Integration & Testing (Weeks 7-8)
1. **Performance Optimization**
   - Web Workers for centrality calculations
   - Canvas rendering for large graphs (>1000 nodes/edges)
   - Level-of-detail rendering (hide labels on zoom out)
   - Graph simplification (edge bundling for dense areas)
   - Lazy loading for profile details

2. **Multi-Language Support**
   - Network UI in all 14 languages
   - Committee names translated
   - Metric labels translated
   - Tooltips and help text

3. **Accessibility & Compliance**
   - Keyboard navigation (tab through nodes)
   - Screen reader: alt graph representation (table/list)
   - ARIA labels for all interactive elements
   - Color contrast verification
   - Focus indicators

4. **Testing & QA**
   - Cross-browser testing
   - Mobile testing (touch interactions)
   - Performance testing (large graphs)
   - Accessibility audit
   - Data accuracy verification

## 🤖 Recommended Agent
**frontend-specialist** - Expert in D3.js network visualizations, graph algorithms, and interactive data visualization

**Rationale**: Specializes in advanced D3.js visualizations, network analysis, and static site integration. Perfect for building complex force-directed graphs with network metrics.

## ✅ Acceptance Criteria

### Functional Requirements
- [ ] Interactive network graph with 364 nodes (349 MPs + 15 committees)
- [ ] 5 centrality metrics calculated (degree, betweenness, closeness, eigenvector, PageRank)
- [ ] Zoom, pan, and drag interactions functional
- [ ] Node click: details panel with metrics
- [ ] Node hover: highlight connections
- [ ] Filter controls: party, committee, metric
- [ ] Search functionality: find MPs/committees
- [ ] 15 committee profile pages created
- [ ] Multi-language support (14 languages)

### Visualization Requirements
- [ ] D3.js v7 force-directed graph
- [ ] 4 layout options: force-directed, hierarchical, circular, matrix
- [ ] Color-coded nodes: party (MPs), function (committees)
- [ ] Node sizing: influence-based
- [ ] Edge thickness: collaboration strength
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Performance: <2s initial render for full graph

### Network Analysis Requirements
- [ ] Adjacency matrix constructed (364x364)
- [ ] 5 centrality algorithms implemented
- [ ] Hub identification (highest degree centrality)
- [ ] Bridge identification (highest betweenness)
- [ ] Influence ranking (PageRank scores)
- [ ] Collaboration strength calculation

### Data Integration Requirements
- [ ] CIA committee-schema.md integrated
- [ ] CIA politician-schema.md integrated
- [ ] 349 MP profiles with committee assignments
- [ ] 15 committee profiles with members
- [ ] Real-time or daily data refresh
- [ ] Data validation against schemas

### Performance Requirements
- [ ] Initial graph render <2 seconds
- [ ] Centrality calculations <5 seconds (Web Worker)
- [ ] Smooth zoom/pan interactions (60 FPS)
- [ ] Node drag responsive
- [ ] Lighthouse score ≥85
- [ ] Canvas rendering for large graphs

### Accessibility Requirements
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation functional
- [ ] Screen reader: alternative table/list view
- [ ] Color contrast ≥4.5:1
- [ ] Focus indicators visible
- [ ] ARIA labels for all nodes/controls

### Documentation Requirements
- [ ] NETWORK_ANALYSIS.md created
- [ ] CENTRALITY_METRICS.md documenting algorithms
- [ ] COMMITTEE_GUIDE.md for committee profiles
- [ ] D3.js implementation guide for contributors

## 📚 References

### Repository & Architecture
- **Repository**: https://github.com/Hack23/riksdagsmonitor
- **Architecture**: [ARCHITECTURE.md](https://github.com/Hack23/riksdagsmonitor/blob/main/ARCHITECTURE.md)

### CIA Data Sources
- **Committee Schema**: https://github.com/Hack23/cia/blob/master/json-export-specs/schemas/committee-schema.md
- **Politician Schema**: https://github.com/Hack23/cia/blob/master/json-export-specs/schemas/politician-schema.md
- **Sample Data**: https://github.com/Hack23/cia/tree/master/service.data.impl/sample-data
- **OSINT Methods**: https://github.com/Hack23/cia/blob/master/DATA_ANALYSIS_INTOP_OSINT.md
- **Business Product Doc**: https://github.com/Hack23/cia/blob/master/BUSINESS_PRODUCT_DOCUMENT.md (Product #15)

### D3.js & Network Analysis
- **D3.js**: https://d3js.org/
- **D3-Force**: https://github.com/d3/d3-force
- **D3-Zoom**: https://github.com/d3/d3-zoom
- **Network Analysis**: https://en.wikipedia.org/wiki/Centrality
- **PageRank**: https://en.wikipedia.org/wiki/PageRank

### Riksdag Committees
- **Committee System**: https://www.riksdagen.se/en/how-the-riksdag-works/committees/
- **Committee Composition**: https://data.riksdagen.se/data/utskott/

### ISMS & Compliance
- **ISO 27001 A.14.2**: Security in development and support
- **WCAG 2.1 AA**: Web accessibility standard
- **Security Architecture**: [SECURITY_ARCHITECTURE.md](https://github.com/Hack23/riksdagsmonitor/blob/main/SECURITY_ARCHITECTURE.md)

## 📝 Additional Context

### Network Metrics Explained

**Degree Centrality**: Number of direct connections
- High degree = well-connected, active in multiple committees

**Betweenness Centrality**: Number of shortest paths through node
- High betweenness = information broker, bridge between groups

**Closeness Centrality**: Inverse of average distance to all nodes
- High closeness = efficient information access, central position

**Eigenvector Centrality**: Quality of connections (connected to important nodes)
- High eigenvector = influential connections

**PageRank**: Recursive importance based on connections
- High PageRank = overall influence in network

### Visualization Best Practices
- **Node Sizing**: Logarithmic scale for influence (avoid huge nodes)
- **Edge Bundling**: Group parallel edges to reduce clutter
- **Level-of-Detail**: Show/hide labels based on zoom level
- **Color Palette**: Colorblind-friendly party colors
- **Performance**: Use Canvas for >1000 nodes, SVG for <1000

---

**Estimated Effort**: 8 weeks  
**Priority**: High  
**Complexity**: High  
**Dependencies**: Issue #5 (MP profiles) recommended
