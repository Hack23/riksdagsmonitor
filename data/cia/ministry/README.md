# CIA Ministry Data

This directory contains sample CSV data files for the Government Minister Risk & Influence Analytics Dashboard.

## Data Files

### Sample Data (Development/Testing)
- `sample_risk_levels.csv` - Ministry risk assessment scores (demo data)
- `sample_productivity.csv` - Ministry productivity comparisons (demo data)
- `sample_influence.csv` - Minister influence metrics (demo data)
- `sample_decision_impact.csv` - Decision effectiveness over time (demo data)

### Production Data Sources
In production, the dashboard fetches data from the CIA Platform GitHub repository:
- https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/

## Data Schema

### Risk Levels (`distribution_ministry_risk_levels.csv`)
```
ministry,riskScore,alerts
Finansdepartementet,7.2,12
```

### Productivity Matrix (`distribution_ministry_productivity_matrix.csv`)
```
ministry,currentQuarter,previousQuarter
Finansdepartementet,92.5,88.3
```

### Influence Metrics (`percentile_politician_influence_metrics.csv`)
```
name,ministry,influence
Ulf Kristersson,Statsrådsberedningen,94.5
```

### Decision Impact (`distribution_ministry_decision_impact.csv`)
```
ministry,period,impact
Finansdepartementet,Q1 2024,87.5
```

## Risk Level Categories
- **Critical (>8.0):** Multiple major violations, systemic failures
- **High (6.0-8.0):** Frequent violations, concerning patterns
- **Medium (4.0-6.0):** Occasional violations, monitoring required
- **Low (<4.0):** Minimal violations, good compliance

## Data Processing
- All data processing is client-side (browser JavaScript)
- Data is cached locally for 1 hour to reduce API calls
- No personally identifiable information (PII) is stored
- Aggregate statistics only

## Security & Privacy
- HTTPS-only data fetching
- SRI hash verification for external libraries
- CSP-compliant implementation
- WCAG 2.1 AA accessible
- No user tracking or analytics

## Data Attribution
All visualizations display: "📊 Data by CIA Platform | www.hack23.com/cia"

## License
Data sourced from CIA Platform (https://github.com/Hack23/cia) - Open Source under Apache 2.0 License
