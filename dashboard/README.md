# CIA Intelligence Dashboard

Interactive visualization of Swedish Riksdag intelligence exports from the Citizen Intelligence Agency (CIA) platform.

## 📊 Overview

This dashboard provides real-time visualization of:
- **Overview Metrics**: 349 MPs, 8 parties, 45 risk rules, coalition analysis
- **Party Performance**: Seats distribution, voting cohesion, rebellion rates
- **Election 2026 Predictions**: CIA forecasting model with coalition scenarios
- **Top 10 Rankings**: Most influential MPs based on network analysis
- **Voting Patterns**: Party agreement matrix and heatmap visualization
- **Committee Network**: Parliamentary committee influence mapping

## 🚀 Features

### Data Visualization
- Interactive charts powered by Chart.js
- Responsive design (mobile-first, 320px - 1440px+)
- Real-time data loading with fallback strategy
- Error handling and loading states

### Accessibility
- WCAG 2.1 AA compliant structure
- Semantic HTML5 markup
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatible

### Performance
- Lazy loading for charts
- Progressive enhancement
- Optimized asset delivery
- Client-side rendering only (static site)

## 📁 File Structure

```
dashboard/
├── index.html                  # Main dashboard page (English)
├── index_sv.html              # Main dashboard page (Swedish)
├── styles.css                  # Dashboard-specific styles
├── cia-data-loader.js         # Data loading module
├── cia-visualizations.js      # Chart rendering module
└── election-predictions.js    # Election 2026 predictions renderer

data/cia-exports/current/
├── overview-dashboard.json     # Key metrics data
├── election-analysis.json      # 2026 election predictions
├── party-performance.json      # Party performance metrics
├── top10-influential-mps.json  # MP influence rankings
├── committee-network.json      # Committee network data
└── voting-patterns.json        # Voting agreement matrix
```

## 🔧 Development

### Local Development

```bash
# Navigate to repository root
cd riksdagsmonitor

# Start local server
python3 -m http.server 8080

# Open in browser
open http://localhost:8080/dashboard/index.html
```

### Data Loading Strategy

1. **Primary**: Load from local cache (`../data/cia-exports/current/`)
2. **Fallback**: Load from CIA API (`https://www.hack23.com/cia/api/`)
3. **Error Handling**: Display user-friendly error message with retry button

### Adding New Visualizations

1. Add data to appropriate JSON export file in `data/cia-exports/current/`
2. Update renderer in `cia-visualizations.js` or create new module
3. Add HTML container in `index.html`
4. Style in `styles.css`

## 📊 Data Sources

All data is provided by the **Citizen Intelligence Agency (CIA)** platform:
- **Platform**: https://www.hack23.com/cia/
- **Documentation**: https://hack23.github.io/cia/
- **Visualizations Spec**: https://github.com/Hack23/cia/tree/master/json-export-specs/visualizations

### Data Update Frequency
- **Real-time**: Voting data, risk alerts
- **Daily**: Documents, committee work
- **Weekly**: Performance metrics, rankings
- **Monthly**: Trend analysis, forecasting

## 🎨 Design System

### Color Palette
- Primary: `#006633` (Green)
- Success: `#008838`
- Warning: `#B35A00`
- Danger: `#DC3545`
- Info: `#117a8b`

### Typography
- Primary: Inter, sans-serif
- Mono: Share Tech Mono, monospace
- Base: 16px (1rem)

### Breakpoints
- Mobile: 320px - 767px (default)
- Tablet: 768px - 1023px
- Desktop: 1024px - 1439px
- Large: 1440px+

## 🌐 Multi-Language Support

Dashboard will be available in 14 languages:
- English (EN)
- Swedish (SV)
- Danish (DA)
- Norwegian (NO)
- Finnish (FI)
- German (DE)
- French (FR)
- Spanish (ES)
- Dutch (NL)
- Arabic (AR) - RTL
- Hebrew (HE) - RTL
- Japanese (JA)
- Korean (KO)
- Chinese (ZH)

## ✅ Quality Standards

### HTML Validation
```bash
htmlhint dashboard/index.html
```

### Accessibility Testing
- Keyboard navigation
- Screen reader testing
- Color contrast checker (4.5:1 minimum)
- ARIA label verification

### Performance Testing
```bash
# Lighthouse CI
lighthouse http://localhost:8080/dashboard/index.html --view
```

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

## 🔒 Security

### Content Security Policy
- Chart.js loaded via CDN with SRI (Subresource Integrity)
- No inline scripts; inline styles being phased out (CSP hardening in progress)
- HTTPS-only connections

### Data Handling
- Client-side rendering only
- No server-side data processing
- Data validation on load
- Error handling for malformed data

## 📚 Dependencies

### External Libraries
- **Chart.js v4.4.1**: Chart rendering (60KB minified)
  - CDN: `https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js`
  - SRI: `sha384-VzJbN2v1vFcGJCeP5T5XREFm3+OIH7d2qRMOA/fHtfDO5Cd2Qc6bjqH8R5RZqQkQ`
  - License: MIT

### Font Dependencies
- **Google Fonts**:
  - Inter (400, 500, 600, 700)
  - Orbitron (400, 500, 600, 700)
  - Share Tech Mono

## 🤝 Contributing

Follow Hack23's secure development standards:
1. Use semantic HTML5
2. Follow mobile-first responsive design
3. Ensure WCAG 2.1 AA compliance
4. Test across browsers
5. Validate HTML/CSS
6. Document changes

## 📄 License

Copyright © 2008-2026 Hack23 AB (Org.nr 5595347807)

Licensed under the Apache License, Version 2.0. See [LICENSE](../LICENSE) file for details.

## 🔗 Links

- **Dashboard**: https://riksdagsmonitor.com/dashboard/
- **CIA Platform**: https://www.hack23.com/cia/
- **GitHub**: https://github.com/Hack23/riksdagsmonitor
- **ISMS**: https://github.com/Hack23/ISMS-PUBLIC

## 👨‍💻 Maintainer

**James Pether Sörling**  
CISSP, CISM  
CEO, Hack23 AB  
[LinkedIn](https://www.linkedin.com/in/jamessorling/) | [GitHub](https://github.com/pethers)

---

*Interactive visualization of Swedish parliamentary intelligence*
