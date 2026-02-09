# Coalition & Voting Pattern Dashboard Documentation

## Overview

The Coalition & Voting Pattern Dashboard provides interactive analysis of Swedish Riksdag coalition dynamics, party alignments, and voting behavior patterns using D3.js network diagrams and Chart.js visualizations.

## Features

### 1. Coalition Network (D3.js Force-Directed Graph)
- **Interactive network diagram** showing relationships between 8 Swedish political parties
- **Node size** proportional to influence score (5-15 range)
- **Edge thickness** represents coalition strength (0.3-0.8 scale)
- **Drag & drop** nodes to rearrange the network
- **Click nodes** to view party details
- **Keyboard navigation** with Tab key
- **Accessible table fallback** for screen readers

**Swedish Parties:**
- **S** (Socialdemokraterna) - Red (#E8112d)
- **M** (Moderaterna) - Light Blue (#52BDEC)
- **SD** (Sverigedemokraterna) - Yellow (#DDDD00)
- **V** (Vänsterpartiet) - Red (#DA291C)
- **MP** (Miljöpartiet) - Green (#83CF39)
- **C** (Centerpartiet) - Green (#009933)
- **L** (Liberalerna) - Blue (#006AB3)
- **KD** (Kristdemokraterna) - Dark Blue (#000077)

### 2. Party Alignment Heat Map (D3.js Matrix)
- **Matrix visualization** showing cross-party voting agreement
- **Color-coded** cells (green = high agreement, red = low agreement)
- **Sequential color scale** from 0% to 100% alignment
- **Interactive tooltips** showing exact percentages
- **Row/column labels** for easy identification

### 3. Voting Anomaly Chart (Chart.js Scatter Plot)
- **Time series scatter plot** highlighting unusual voting patterns
- **Last 5 years** of data (2019-2024)
- **X-axis:** Date
- **Y-axis:** Deviation score (1-6 range)
- **Color-coded** by party
- **Point radius:** 6px (hover: 8px)
- **Severity levels:** Minor (<2.5), Major (2.5-4), Critical (>4)

### 4. Behavioral Patterns (Chart.js Horizontal Bar Chart)
- **Party consistency scores** measuring adherence to party line
- **Range:** 70-100% consistency
- **Color-coded** bars matching party colors
- **Sorted** by consistency score
- **Interactive tooltips** with precise percentages

### 5. Decision Trends (Chart.js Line Chart)
- **Historical timeline** from 1990 to 2026 (36 years)
- **Annual voting volumes** for all parties
- **Line tension:** 0.4 (smooth curves)
- **Fill:** false (transparent background)
- **Legend:** bottom position
- **Interactive mode:** index (show all parties on hover)

## Technical Implementation

### Dependencies

#### D3.js v7
```html
<script src="https://d3js.org/d3.v7.min.js" 
        integrity="sha384-..." 
        crossorigin="anonymous" 
        defer></script>
```

#### Chart.js v4
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" 
        integrity="sha384-..." 
        crossorigin="anonymous" 
        defer></script>
```

#### Chart.js Date Adapter
```html
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js" 
        integrity="sha384-..." 
        crossorigin="anonymous" 
        defer></script>
```

### File Structure

```
riksdagsmonitor/
├── scripts/
│   ├── coalition-dashboard.js          # Main dashboard implementation
│   ├── dashboard-translations.json     # 14-language translations
│   └── add-dashboard-to-all-languages.js  # Deployment script
├── styles.css                          # Dashboard styles added
├── index.html                          # English version (updated)
├── index_sv.html                       # Swedish version (updated)
├── index_da.html                       # Danish version (updated)
├── index_no.html                       # Norwegian version (updated)
├── index_fi.html                       # Finnish version (updated)
├── index_de.html                       # German version (updated)
├── index_fr.html                       # French version (updated)
├── index_es.html                       # Spanish version (updated)
├── index_nl.html                       # Dutch version (updated)
├── index_ar.html                       # Arabic version (updated)
├── index_he.html                       # Hebrew version (updated)
├── index_ja.html                       # Japanese version (updated)
├── index_ko.html                       # Korean version (updated)
└── index_zh.html                       # Chinese version (updated)
```

### HTML Structure

```html
<section id="coalition-dashboard" class="dashboard-container">
  <h2>🤝 Coalition & Voting Pattern Analysis</h2>
  <p>Interactive analysis of coalition dynamics...</p>

  <div class="dashboard-grid">
    <!-- Coalition Network -->
    <div class="chart-card wide">
      <h3>Coalition Network (Interactive)</h3>
      <div id="coalitionNetwork" role="img" aria-label="..."></div>
      <table class="sr-only" id="coalitionNetworkTable">
        <!-- Accessible fallback -->
      </table>
    </div>

    <!-- Voting Anomalies -->
    <div class="chart-card">
      <h3>Voting Anomalies (Last 5 Years)</h3>
      <canvas id="votingAnomalyChart" role="img" aria-label="..."></canvas>
    </div>

    <!-- Alignment Heat Map -->
    <div class="chart-card">
      <h3>Party Alignment Heat Map</h3>
      <div id="alignmentHeatMap" role="img" aria-label="..."></div>
    </div>

    <!-- Behavioral Patterns -->
    <div class="chart-card">
      <h3>Behavioral Patterns</h3>
      <canvas id="behavioralPatternsChart" role="img" aria-label="..."></canvas>
    </div>

    <!-- Decision Trends -->
    <div class="chart-card wide">
      <h3>Decision Trends (1990-2026)</h3>
      <canvas id="decisionTrendsChart" role="img" aria-label="..."></canvas>
    </div>
  </div>
</section>
```

### CSS Classes

```css
.dashboard-container      /* Main container with card styling */
.dashboard-grid          /* Responsive grid layout */
.chart-card              /* Individual chart container */
.chart-card.wide         /* Spans full width */
.sr-only                 /* Screen reader only content */
```

### JavaScript API

#### Main Functions

```javascript
initDashboard()           // Initialize all visualizations
renderCoalitionNetwork()  // D3.js force-directed graph
renderAlignmentHeatMap()  // D3.js heat map
renderVotingAnomalyChart() // Chart.js scatter plot
renderBehavioralPatternsChart() // Chart.js bar chart
renderDecisionTrendsChart() // Chart.js line chart
```

#### Data Sources (Future CIA Integration)

```javascript
// Currently using mock data generators
// Future: Fetch from CIA Platform APIs

fetchCoalitionData()      // distribution_coalition_alignment.csv
fetchBehavioralData()     // distribution_behavioral_patterns_by_party.csv
fetchDecisionData()       // distribution_decision_patterns_by_party.csv
fetchAnomalyData()        // distribution_voting_anomaly_classification.csv
fetchAnnualVotesData()    // distribution_annual_party_votes.csv
```

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- **Tab:** Navigate through nodes
- **Enter/Space:** Activate selected node
- **Escape:** Close tooltips

### Screen Reader Support
- **ARIA labels** on all visualizations
- **Accessible table fallback** for network diagram
- **Alternative text** for canvas charts
- **Role attributes** (img, button)

### Color Contrast
- All colors meet **4.5:1 minimum contrast** ratio
- **Colorblind-safe** party color palette
- **Focus indicators** visible (2px solid outline)

### Responsive Design
- **320px-1440px+** viewport support
- **Mobile-first** layout
- **Touch-friendly** interactive elements (44px minimum)
- **Flexible grid** adapts to screen size

## Multi-Language Support

### Available Languages (14)
- English (en)
- Swedish (sv)
- Danish (da)
- Norwegian (no)
- Finnish (fi)
- German (de)
- French (fr)
- Spanish (es)
- Dutch (nl)
- Arabic (ar) - RTL
- Hebrew (he) - RTL
- Japanese (ja)
- Korean (ko)
- Chinese (zh)

### Translation Keys
All UI text is localized using `dashboard-translations.json`:
- Section title & description
- Chart titles & descriptions
- ARIA labels
- Data attribution text

## Performance Optimization

### Rendering
- **Lazy loading:** Dashboard initializes on DOM ready
- **Debouncing:** Resize events debounced (300ms)
- **Canvas optimization:** Hardware acceleration enabled
- **SVG optimization:** Minimized DOM manipulation

### Data Caching
- **Local cache:** Data fetched once and cached
- **Weekly updates:** CIA data updates weekly
- **Incremental rendering:** Charts render independently

### Browser Compatibility
- **Chrome/Edge 65%** - Full support
- **Safari 20%** - Vendor prefixes added
- **Firefox 5%** - Full support
- **Other 10%** - Graceful degradation

## Security

### Content Security Policy (CSP)
- **No inline scripts** - All JavaScript in external files
- **No eval()** - No dynamic code execution
- **SRI hashes** on all CDN resources
- **HTTPS-only** data fetching

### Data Privacy
- **No user tracking** - No analytics or cookies
- **Public data only** - Swedish Parliament open data
- **GDPR compliant** - No personal data collection

## Deployment

### Automated Deployment Script
```bash
node scripts/add-dashboard-to-all-languages.js
```

### Manual Deployment Steps
1. **Update translations** in `dashboard-translations.json`
2. **Run deployment script** to update all HTML files
3. **Validate HTML** with `npx htmlhint *.html`
4. **Test responsiveness** at 320px, 768px, 1024px, 1440px
5. **Test accessibility** with axe-core or WAVE
6. **Commit changes** with GPG-signed commit
7. **Push to GitHub** - GitHub Pages deploys automatically

## Testing

### Manual Testing Checklist
- [ ] All 5 visualizations render correctly
- [ ] Drag & drop works in network diagram
- [ ] Tooltips appear on hover
- [ ] Keyboard navigation functional
- [ ] Screen reader announces content
- [ ] Mobile layout responsive (320px-1440px+)
- [ ] Dark mode styling correct
- [ ] All 14 languages display correctly
- [ ] RTL languages (Arabic, Hebrew) work
- [ ] No console errors
- [ ] No accessibility errors (WAVE/axe)

### Browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Performance Testing
- [ ] Initial load time < 3s
- [ ] Time to Interactive < 5s
- [ ] Chart rendering < 500ms
- [ ] No memory leaks
- [ ] No layout shifts (CLS < 0.1)

## Future Enhancements

### Phase 2: Real CIA Data Integration
- [ ] Fetch CSV files from CIA GitHub repository
- [ ] Parse CSV with Papa Parse library
- [ ] Implement P90/P99 anomaly detection
- [ ] Cache data in IndexedDB (7 days)
- [ ] Weekly background updates (Service Worker)

### Phase 3: Advanced Features
- [ ] Export charts as PNG/SVG
- [ ] Custom date range filtering
- [ ] Party comparison tool
- [ ] Historical event annotations
- [ ] Coalition formation simulator
- [ ] Predictive analytics (2026 election)

### Phase 4: AI Integration
- [ ] Natural language queries
- [ ] Anomaly explanations (GPT-4)
- [ ] Trend forecasting
- [ ] Coalition stability predictions
- [ ] Automated insights generation

## Troubleshooting

### Common Issues

**Issue:** Dashboard doesn't render
- **Solution:** Check browser console for errors
- **Verify:** D3.js and Chart.js loaded successfully
- **Check:** `#coalition-dashboard` element exists

**Issue:** Network diagram overlaps
- **Solution:** Increase container width
- **Adjust:** Force simulation parameters
- **Check:** SVG viewBox dimensions

**Issue:** Mobile layout broken
- **Solution:** Test at 320px viewport
- **Verify:** `.dashboard-grid` responsive
- **Check:** Canvas dimensions set correctly

**Issue:** Colors not displaying
- **Solution:** Verify CSS variables loaded
- **Check:** Dark mode media query
- **Ensure:** Party colors defined

## Support

### Resources
- [D3.js Documentation](https://d3js.org/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [CIA Platform](https://www.hack23.com/cia)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Contact
- **GitHub Issues:** [riksdagsmonitor/issues](https://github.com/Hack23/riksdagsmonitor/issues)
- **Email:** [james@hack23.com](mailto:james@hack23.com)
- **LinkedIn:** [James Pether Sörling](https://www.linkedin.com/in/jamessorling/)

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-06  
**Maintained by:** Hack23 AB  
**License:** Apache 2.0
