---
name: data-science-for-intelligence
description: Statistical analysis, data visualization, pattern recognition for political intelligence
license: Apache-2.0
---

# Data Science for Intelligence Skill

## Purpose

Apply data science techniques to political intelligence analysis, emphasizing visualization and pattern recognition for static HTML/CSS dashboards.

## Core Techniques

### 1. Statistical Analysis
- Descriptive statistics (mean, median, trends)
- Correlation analysis (voting patterns)
- Regression modeling (policy impact)
- Time series analysis (electoral trends)

### 2. Data Visualization (HTML/CSS)
- Responsive tables with sorting
- CSS-only bar charts and progress bars
- Color-coded heat maps
- Timeline visualizations
- Comparison matrices

### 3. Pattern Recognition
- Voting coalition detection
- Anomaly identification
- Trend forecasting
- Behavioral clustering

### 4. Network Analysis
- Coalition relationship mapping
- Influence hub identification
- Cross-party cooperation networks
- Committee interconnections

## Riksdagsmonitor Implementation

### CSS-Only Visualizations
```css
/* Data-driven CSS custom properties */
.metric-bar {
  --value: 75%; /* From data */
  background: linear-gradient(
    to right,
    var(--primary-cyan) 0%,
    var(--primary-cyan) var(--value),
    var(--dark-bg) var(--value)
  );
}

/* Responsive heat map */
.heat-map {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
  gap: 2px;
}

.heat-cell {
  --intensity: 80%; /* From correlation data */
  background-color: hsl(190, var(--intensity), 50%);
  aspect-ratio: 1;
}
```

### Accessibility Requirements
- WCAG 2.1 AA color contrast (4.5:1 minimum)
- Keyboard navigation support
- Screen reader compatibility
- ARIA labels for data visualizations
- Text alternatives for charts

## Data Quality Assurance

### Validation Steps
1. **Completeness Check**: 98.5% minimum
2. **Accuracy Verification**: Cross-reference sources
3. **Consistency Validation**: No contradictions
4. **Timeliness Assessment**: <24h data lag

## ISMS Compliance

### ISO 27001:2022
- **A.8.3**: Data access restrictions
- **A.8.8**: Technical vulnerability management

## References

- **D3.js Alternative**: CSS-only visualizations
- **Statistics**: "Statistics for Political Analysis" (Pollock)
- **Visualization**: "Fundamentals of Data Visualization" (Wilke)
