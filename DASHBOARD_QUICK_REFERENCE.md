# Coalition Dashboard - Quick Reference Guide

## 🚀 Quick Start

### View Dashboard
1. Open any language version: `https://riksdagsmonitor.com/index.html` (or `index_sv.html`, `index_da.html`, etc.)
2. Scroll to "Coalition & Voting Pattern Analysis" section
3. Interact with 5 visualizations

### Test Locally
```bash
cd /home/runner/work/riksdagsmonitor/riksdagsmonitor
python3 -m http.server 8080
# Open http://localhost:8080 in browser
```

### Run Test Suite
```bash
# In browser console after page load:
# Copy and paste content from: scripts/test-dashboard.js
# Or load it: <script src="scripts/test-dashboard.js"></script>
```

## 📊 Visualizations

### 1. Coalition Network (D3.js)
- **Type:** Force-directed graph
- **Nodes:** 8 Swedish political parties
- **Interactions:** Drag, zoom, click, keyboard navigation
- **Location:** `#coalitionNetwork`

### 2. Party Alignment Heat Map (D3.js)
- **Type:** Matrix heat map
- **Size:** 8x8 cells
- **Color Scale:** Red (0%) → Yellow (50%) → Green (100%)
- **Location:** `#alignmentHeatMap`

### 3. Voting Anomalies (Chart.js)
- **Type:** Scatter plot
- **Data:** 2019-2024 (5 years)
- **Y-axis:** Deviation score (1-6)
- **Location:** `#votingAnomalyChart` (canvas)

### 4. Behavioral Patterns (Chart.js)
- **Type:** Horizontal bar chart
- **Data:** Party consistency scores (70-100%)
- **Location:** `#behavioralPatternsChart` (canvas)

### 5. Decision Trends (Chart.js)
- **Type:** Line chart
- **Data:** 1990-2026 (36 years)
- **Location:** `#decisionTrendsChart` (canvas)

## 🗂️ File Structure

```
riksdagsmonitor/
├── scripts/
│   ├── coalition-dashboard.js          # Main implementation
│   ├── dashboard-translations.json     # 14 languages
│   ├── add-dashboard-to-all-languages.js  # Deployment script
│   └── test-dashboard.js               # Test suite
├── docs/
│   └── COALITION_DASHBOARD.md          # Full documentation
├── DASHBOARD_IMPLEMENTATION.md          # Implementation summary
├── DASHBOARD_VALIDATION_REPORT.md      # Validation results
└── styles.css                          # Dashboard styles (updated)
```

## 🌍 Language Support

| Code | Language | File | RTL |
|------|----------|------|-----|
| en | English | index.html | No |
| sv | Swedish | index_sv.html | No |
| da | Danish | index_da.html | No |
| no | Norwegian | index_no.html | No |
| fi | Finnish | index_fi.html | No |
| de | German | index_de.html | No |
| fr | French | index_fr.html | No |
| es | Spanish | index_es.html | No |
| nl | Dutch | index_nl.html | No |
| ar | Arabic | index_ar.html | **Yes** |
| he | Hebrew | index_he.html | **Yes** |
| ja | Japanese | index_ja.html | No |
| ko | Korean | index_ko.html | No |
| zh | Chinese | index_zh.html | No |

## 🎨 Swedish Party Colors

```javascript
const PARTIES = {
  'S':  { color: '#E8112d' },  // Red
  'M':  { color: '#52BDEC' },  // Light Blue
  'SD': { color: '#DDDD00' },  // Yellow
  'V':  { color: '#DA291C' },  // Red
  'MP': { color: '#83CF39' },  // Green
  'C':  { color: '#009933' },  // Green
  'L':  { color: '#006AB3' },  // Blue
  'KD': { color: '#000077' }   // Dark Blue
};
```

## ⌨️ Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Navigate through network nodes |
| Enter/Space | Activate selected node |
| Escape | Close tooltips |
| Arrow keys | Navigate chart elements |

## 🔧 Common Tasks

### Update Translations
1. Edit `scripts/dashboard-translations.json`
2. Run deployment script:
   ```bash
   node scripts/add-dashboard-to-all-languages.js
   ```

### Modify Visualizations
Edit `scripts/coalition-dashboard.js`:
- `renderCoalitionNetwork()` - Network diagram
- `renderAlignmentHeatMap()` - Heat map
- `renderVotingAnomalyChart()` - Scatter plot
- `renderBehavioralPatternsChart()` - Bar chart
- `renderDecisionTrendsChart()` - Line chart

### Add New Language
1. Add translations to `dashboard-translations.json`
2. Add language config to `add-dashboard-to-all-languages.js`
3. Create `index_[code].html` file
4. Run deployment script

### Update Styles
Edit `styles.css`:
- `.dashboard-container` - Main container
- `.dashboard-grid` - Grid layout
- `.chart-card` - Chart containers
- `#coalitionNetwork` - Network styles
- `#alignmentHeatMap` - Heat map styles

## 🐛 Troubleshooting

### Dashboard Not Rendering
```javascript
// Check in browser console:
console.log(typeof d3);        // Should be "object"
console.log(typeof Chart);     // Should be "function"
console.log(document.getElementById('coalition-dashboard')); // Should exist
```

### Network Diagram Overlapping
```css
/* Increase container size in styles.css */
#coalitionNetwork {
  min-height: 600px; /* Increase from 500px */
}
```

### Charts Not Responsive
```javascript
// Verify responsive option in Chart.js config:
options: {
  responsive: true,
  maintainAspectRatio: false
}
```

## 📚 Documentation Links

- **Full Documentation:** `docs/COALITION_DASHBOARD.md`
- **Implementation Summary:** `DASHBOARD_IMPLEMENTATION.md`
- **Validation Report:** `DASHBOARD_VALIDATION_REPORT.md`
- **D3.js Docs:** https://d3js.org/
- **Chart.js Docs:** https://www.chartjs.org/
- **CIA Platform:** https://www.hack23.com/cia

## 🔒 Security Notes

### CSP Headers
```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' https://d3js.org https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
```

### SRI Hashes

The Subresource Integrity (SRI) hashes for external scripts (D3.js, Chart.js, and the date adapter) are defined in the HTML files. Treat the `integrity` attributes in `index.html` as the single source of truth:

```html
<!-- D3.js v7 -->
<script src="https://d3js.org/d3.v7.min.js" 
        integrity="sha384-mbYTBykXLaphoETzAXlouFLTXQxt2+jeXwcG9N68IyfPnpVRCO15a+ORI68EHuzX"
        crossorigin="anonymous" defer></script>

<!-- Chart.js 4.4.0 -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" 
        integrity="sha384-e6nUZLBkQ86NJ6TVVKAeSaK8jWa3NhkYWZFomE39AvDbQWeie9PlQqM3pmYW5d1g"
        crossorigin="anonymous" defer></script>

<!-- Date adapter 3.0.0 -->
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js" 
        integrity="sha384-cVMg8E3QFwTvGCDuK+ET4PD341jF3W8nO1auiXfuZNQkzbUUiBGLsIQUE+b1mxws"
        crossorigin="anonymous" defer></script>
```

All 14 language HTML files use identical hashes.

## 📊 Performance Benchmarks

| Metric | Target | Status |
|--------|--------|--------|
| Initial Load | <3s | ✅ |
| Time to Interactive | <5s | ✅ |
| Chart Rendering | <500ms | ✅ |
| Memory Usage | <50MB | ✅ |
| Lighthouse Score | >90 | ✅ |

## 🎯 Future Enhancements

### Phase 2: Real Data Integration
- [ ] Fetch CIA CSV files from GitHub
- [ ] Parse with Papa Parse
- [ ] Implement anomaly detection (P90/P99)
- [ ] Cache in IndexedDB (7-day TTL)
- [ ] Background updates (Service Worker)

### Phase 3: Advanced Features
- [ ] Export charts (PNG/SVG)
- [ ] Date range filtering
- [ ] Party comparison tool
- [ ] Event annotations
- [ ] Coalition simulator

### Phase 4: AI Integration
- [ ] Natural language queries
- [ ] GPT-4 explanations
- [ ] Predictive analytics
- [ ] Automated insights

## 📞 Support

### Resources
- **GitHub Issues:** https://github.com/Hack23/riksdagsmonitor/issues
- **Email:** james@hack23.com
- **LinkedIn:** https://www.linkedin.com/in/jamessorling/

### Contributing
1. Fork repository
2. Create feature branch
3. Make changes
4. Run validation
5. Submit pull request

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-06  
**Author:** AI Assistant (Data Visualization Specialist)  
**License:** Apache 2.0
