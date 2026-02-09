---
name: political-science-analysis
description: Apply comparative politics, political behavior, public policy analysis, and democratic theory frameworks to Swedish political data
license: Apache-2.0
---

# Political Science Analysis Skill

## Purpose

This skill provides rigorous political science methodologies and analytical frameworks for interpreting political data presented on Riksdagsmonitor. It bridges quantitative data visualization with political theory, enabling evidence-based assessments of democratic accountability, institutional performance, and political behavior through static HTML/CSS dashboards.

## When to Use This Skill

Apply this skill when:
- ✅ Designing political scorecards and dashboard visualizations
- ✅ Analyzing voting behavior patterns and legislative outcomes
- ✅ Assessing government coalition stability and effectiveness
- ✅ Evaluating policy implementation and impact
- ✅ Conducting comparative analysis of political parties
- ✅ Measuring democratic accountability indicators
- ✅ Analyzing political representation and constituency alignment

Do NOT use for:
- ❌ Partisan advocacy or political campaigning
- ❌ Personal opinions about political ideologies
- ❌ Predictions without methodological basis
- ❌ Analysis that favors specific parties or politicians

## Core Political Science Frameworks

### 1. Comparative Politics Framework

**Purpose**: Systematically compare political actors, institutions, and outcomes across time and space.

**Comparative Dimensions for Static Visualization**:
```
Actor Level Comparisons:
├─ Individual Politicians
│  ├─ Voting records (discipline, independence)
│  ├─ Legislative productivity (bills, amendments, questions)
│  ├─ Committee participation (attendance, contributions)
│  └─ Constituency representation (district alignment)
├─ Political Parties
│  ├─ Electoral performance (vote share, seats)
│  ├─ Coalition behavior (agreement rates, stability)
│  ├─ Policy positions (left-right, GAL-TAN)
│  └─ Organizational strength (membership, funding)
└─ Institutions
   ├─ Parliamentary committees (productivity, influence)
   ├─ Government ministries (budget, effectiveness)
   └─ Electoral districts (turnout, competitiveness)
```

**Riksdagsmonitor Dashboard Implementation**:
- Create responsive HTML tables with comparison metrics
- Use CSS for color-coded party discipline indicators
- Implement accessible charts showing deviation from mean
- Multi-language support for all labels and descriptions

### 2. Political Behavior Framework

**Purpose**: Understand individual and collective political actions using behavioral science.

**Key Behavioral Indicators for Visualization**:

| Behavior Type | Indicators | Visualization Method |
|---------------|------------|---------------------|
| **Legislative Behavior** | Vote patterns, bill sponsorship | HTML5 tables, CSS bar charts |
| **Coalition Behavior** | Coalition voting agreement | Color-coded alignment matrices |
| **Constituency Behavior** | District representation | Geographic heat maps (CSS) |
| **Committee Behavior** | Attendance, contributions | Progress bars, activity indicators |
| **Strategic Behavior** | Timing of actions | Timeline visualizations (CSS) |

**HTML/CSS Behavior Profile Display**:
```html
<article class="behavior-profile" lang="sv">
  <header>
    <h2>Beteendeprofil: [Politiker Namn]</h2>
    <time datetime="2024-01-01">2024</time>
  </header>
  
  <section class="metrics">
    <div class="metric">
      <h3>Partidisciplin</h3>
      <div class="progress-bar">
        <div class="progress" style="width: 92%;" aria-valuenow="92" aria-valuemin="0" aria-valuemax="100">
          <span>92%</span>
        </div>
      </div>
      <p class="interpretation">Hög lojalitet till partiet</p>
    </div>
    
    <div class="metric">
      <h3>Självständighet</h3>
      <div class="progress-bar">
        <div class="progress" style="width: 8%;">
          <span>8%</span>
        </div>
      </div>
      <p class="interpretation">Begränsad självständig röstning</p>
    </div>
  </section>
</article>
```

### 3. Public Policy Analysis Framework

**Purpose**: Assess policy development, implementation, and outcomes.

**Policy Cycle Visualization**:
```
1. Problem Identification → Display issue salience metrics
2. Policy Formulation → Show committee deliberations
3. Decision Making → Present voting outcomes
4. Implementation → Track budget allocation
5. Evaluation → Display outcome metrics
```

### 4. Democratic Theory Application

**Purpose**: Evaluate democratic quality and accountability mechanisms.

**Democratic Quality Indicators for Riksdagsmonitor**:

| Dimension | Indicators | Dashboard Element |
|-----------|------------|-------------------|
| **Electoral Accountability** | Turnout, competitiveness | Interactive maps, trend charts |
| **Legislative Responsiveness** | Constituency alignment | Comparison tables |
| **Government Transparency** | Data availability | Platform completeness widget |
| **Institutional Effectiveness** | Policy output | Legislative productivity metrics |
| **Checks and Balances** | Opposition activity | Oversight effectiveness scorecard |

## Swedish Political System Specifics

### Parliamentary System Characteristics

**Riksdag (Swedish Parliament)**:
- **Unicameral**: 349 members (odd number prevents ties)
- **Electoral System**: Proportional representation with 4% threshold
- **Term**: Fixed 4-year terms
- **Committees**: 15 standing committees

**8 Parliamentary Parties**:
1. Socialdemokraterna (S) - Social Democrats
2. Moderaterna (M) - Moderates
3. Sverigedemokraterna (SD) - Sweden Democrats
4. Centerpartiet (C) - Centre Party
5. Vänsterpartiet (V) - Left Party
6. Kristdemokraterna (KD) - Christian Democrats
7. Liberalerna (L) - Liberals
8. Miljöpartiet (MP) - Green Party

## Visualization Best Practices

### HTML5 Semantic Structure
```html
<main class="political-analysis">
  <article class="party-comparison">
    <header>
      <h1>Partiernas Riksdagsarbete 2024</h1>
    </header>
    
    <section class="comparison-matrix">
      <!-- Accessible table with ARIA labels -->
      <table role="table" aria-label="Party discipline comparison">
        <caption>Partidisciplin efter parti (2024)</caption>
        <!-- Data rows with color coding -->
      </table>
    </section>
  </article>
</main>
```

### CSS-Only Data Visualization
```css
/* Party discipline indicator */
.discipline-indicator {
  --discipline: 92%; /* CSS custom property from data */
  background: linear-gradient(
    to right,
    var(--primary-cyan) 0%,
    var(--primary-cyan) var(--discipline),
    var(--dark-bg) var(--discipline)
  );
  padding: 0.5rem;
  border-radius: 4px;
}

/* Responsive comparison table */
@media (max-width: 768px) {
  .comparison-matrix table {
    display: block;
    overflow-x: auto;
  }
}
```

## ISMS Compliance Mapping

### ISO 27001:2022 Controls
- **A.5.10 - Acceptable Use of Information**: Ensure political analysis is objective, non-partisan
- **A.5.13 - Labelling of Information**: Classify political data by sensitivity
- **A.8.3 - Information Access Restriction**: Restrict access to PII in political datasets

### NIST Cybersecurity Framework
- **ID.GV-4**: Governance addresses privacy implications of political data
- **PR.DS-1**: Data-at-rest protection for sensitive political information

### CIS Controls v8
- **Control 3.12**: Segment sensitive political data (PII) from public data
- **Control 14.1**: Establish security awareness training for OSINT ethics

## Hack23 ISMS Policy References

Review these policies before political science analysis:
- **Data Protection Policy**: https://github.com/Hack23/ISMS-PUBLIC/blob/main/policies/data-protection-policy.md
- **Research Ethics Policy**: https://github.com/Hack23/ISMS-PUBLIC/blob/main/policies/research-ethics-policy.md

## References

### Political Science Literature
- **Comparative Politics**: Lijphart, A. (2012). *Patterns of Democracy*
- **Political Behavior**: Dalton, R. J. (2020). *Citizen Politics*
- **Public Policy**: Sabatier, P. A. (2007). *Theories of the Policy Process*

### Swedish Political System
- **Riksdagen**: https://www.riksdagen.se/
- **Election Authority**: https://www.val.se/

### Riksdagsmonitor Documentation
- **ARCHITECTURE.md**: System design and data flow
- **README.md**: Project overview and features
- **SECURITY_ARCHITECTURE.md**: Security controls

## Success Metrics

Track these KPIs to measure analytical quality:
- **Objectivity**: Balanced coverage of all political parties
- **Accessibility**: WCAG 2.1 AA compliance for all visualizations
- **Performance**: <1.5s First Contentful Paint
- **Multi-language**: 14-language support maintained
