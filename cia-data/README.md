# CIA Data Directory

This directory contains CSV data files downloaded from the CIA (Citizen Intelligence Agency) platform for use in riksdagsmonitor dashboards.

## Directory Structure

```
cia-data/
├── README.md (this file)
└── ministry/
    ├── README.md
    ├── download-ministry-data.sh
    └── *.csv (15 CSV files, ~180KB)
```

## Data Sources

All data is sourced from the CIA platform:
- **Repository**: https://github.com/Hack23/cia
- **Data Location**: `service.data.impl/sample-data/`
- **Base URL**: https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/

## Available Datasets

### 1. Ministry Data (`ministry/`)

Government minister risk & influence analytics:
- 15 CSV files (~180KB, 1,880+ records)
- Risk levels, productivity metrics, decision impact, influence scores
- Used by: Ministry Dashboard (`js/ministry-dashboard.js`)

**Key Files:**
- `distribution_ministry_risk_levels.csv` - Risk level distribution
- `distribution_ministry_productivity_matrix.csv` - Productivity metrics
- `distribution_ministry_decision_impact.csv` - Decision impact analysis
- `percentile_politician_influence_metrics.csv` - Influence scores

**Update Command:**
```bash
cd cia-data/ministry && ./download-ministry-data.sh
```

## Dashboard Integration

### Ministry Dashboard

**Location**: `js/ministry-dashboard.js`

**Visualizations:**
1. **Ministry Risk Heat Map** (D3.js) - Color-coded risk levels
2. **Top 10 Influential Ministers** (Chart.js) - Influence rankings
3. **Ministry Productivity Matrix** (Chart.js) - Quarterly productivity
4. **Decision Impact Timeline** (Chart.js) - Effectiveness trends

**Data Loading:**
```javascript
const baseUrl = 'cia-data/ministry/';
const files = {
  riskLevels: 'distribution_ministry_risk_levels.csv',
  productivity: 'distribution_ministry_productivity_matrix.csv',
  influence: 'percentile_politician_influence_metrics.csv',
  decisionImpact: 'distribution_ministry_decision_impact.csv'
};
```

## Data Update Frequency

- **CIA Platform**: Weekly updates (government changes quarterly)
- **Local Cache**: 1 hour (dashboard-level caching)
- **Manual Update**: Run download scripts in each subdirectory

## Future Datasets

Additional datasets can be added following the same pattern:

```bash
cia-data/
├── coalition/      # Coalition stability data
├── committee/      # Committee performance data
├── party/          # Party analytics data
└── risk/           # Risk assessment data
```

Each subdirectory should include:
- `README.md` - Dataset documentation
- `download-*.sh` - Data download script
- `*.csv` - CSV data files

## Data Quality & Validation

- **Source**: Official Swedish Parliament (Riksdagen) open data APIs
- **Processing**: CIA platform aggregation and analysis
- **Format**: CSV with UTF-8 encoding, comma-separated
- **Headers**: First row contains column names
- **Validation**: Ministry names validated against Swedish government structure

## Swedish Government Context

The data covers Swedish government ministries and parliament (Riksdagen):
- **349 MPs** monitored across **8 parties**
- **10-12 government ministries** tracked
- **45 risk rules** across 4 domains (politician, party, committee, ministry)
- **50+ years** of historical data (1971-2026)

## Risk Assessment Methodology

CIA platform uses comprehensive risk analysis:
- **Politician-Level**: 20 rules (attendance, voting, conflicts, productivity)
- **Party-Level**: 12 rules (discipline, drift, internal conflicts)
- **Committee-Level**: 8 rules (productivity, deadlock, testimony)
- **Ministry-Level**: 5 rules (budget, policy failures, accountability)

## Usage Examples

### Load Ministry Risk Data
```javascript
const response = await fetch('cia-data/ministry/distribution_ministry_risk_levels.csv');
const csvText = await response.text();
const data = parseCSV(csvText);
```

### Command Line Analysis
```bash
# Count total records across all ministry files
wc -l cia-data/ministry/*.csv

# View risk levels
cat cia-data/ministry/distribution_ministry_risk_levels.csv

# Download latest data
cd cia-data/ministry && ./download-ministry-data.sh
```

## Related Documentation

- **Ministry Dashboard**: See the main dashboard implementation documentation in `js/ministry-dashboard.js`
- **Security Architecture**: `SECURITY_ARCHITECTURE.md` (Section 2.3.1)
- **Overall Architecture**: `ARCHITECTURE.md`
- **CIA Platform**: https://hack23.github.io/cia/

## Compliance & Security

- **GDPR**: Only public data, no personal information
- **ISO 27001:2022**: A.9.2, A.10.1, A.18.1
- **NIST CSF 2.0**: PR.AC-1, PR.DS-2, PR.DS-5
- **CIS Controls v8.1**: 3.3, 3.10, 6.8
- **HTTPS-only**: All data fetched over secure connections
- **Data Minimization**: Only necessary fields stored

## License

Data provided by CIA platform under open source license.

## Last Updated

2026-02-09

## Contact

- **Repository**: https://github.com/Hack23/riksdagsmonitor
- **CIA Platform**: https://www.hack23.com/cia/
- **Issues**: https://github.com/Hack23/riksdagsmonitor/issues
