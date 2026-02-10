# Ministry Dashboard Data

This directory contains CSV data files for the Government Minister Risk & Influence Analytics Dashboard.

## Data Source

All CSV files are downloaded from the CIA (Citizen Intelligence Agency) platform:
- **Repository**: https://github.com/Hack23/cia
- **Data Location**: `service.data.impl/sample-data/`
- **Base URL**: https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/

## Files Overview

### Core Distribution Files (Used by Dashboard)

#### 1. distribution_ministry_risk_levels.csv (91 bytes, 3 lines)
- **Purpose**: Ministry risk level distribution
- **Fields**: risk_level, period_count, percentage, avg_documents
- **Risk Levels**: CRITICAL, HIGH, MEDIUM, LOW
- **Used In**: Ministry Risk Heat Map (D3.js visualization)

#### 2. distribution_ministry_productivity_matrix.csv (2.7KB, 38 lines)
- **Purpose**: Ministry productivity metrics over time
- **Fields**: ministry, quarter, year, productivity_score, documents_count
- **Coverage**: Multiple quarters for each ministry
- **Used In**: Ministry Productivity Bar Chart (Chart.js)

#### 3. distribution_ministry_effectiveness.csv (1.3KB, 14 lines)
- **Purpose**: Ministry effectiveness metrics
- **Fields**: ministry, effectiveness_score, success_rate
- **Used In**: Ministry effectiveness comparisons

#### 4. distribution_ministry_decision_impact.csv (8.4KB, 201 lines)
- **Purpose**: Ministry decision impact analysis
- **Fields**: ministry_code, committee, decision_type, total_proposals, approved_proposals, rejected_proposals, approval_rate
- **Coverage**: Detailed decision tracking per ministry and committee
- **Used In**: Decision Impact Timeline (Chart.js)

### Quarterly & Temporal Files

#### 5. distribution_ministry_risk_quarterly.csv (405 bytes, 17 lines)
- **Purpose**: Ministry risk trends by quarter
- **Fields**: ministry, quarter, year, risk_score
- **Used In**: Risk trend analysis

#### 6. distribution_annual_ministry_assignments.csv (6.1KB, 187 lines)
- **Purpose**: Annual ministry assignments
- **Fields**: year, ministry, politician_count, avg_tenure
- **Coverage**: Historical ministry staffing data

### Percentile Distribution Files

#### 7. percentile_ministry_risk_evolution.csv (599 bytes, 10 lines)
- **Purpose**: Risk evolution percentiles (P1-P99)
- **Fields**: percentile, risk_score
- **Used In**: Risk benchmarking

#### 8. percentile_ministry_productivity_matrix.csv (818 bytes, 11 lines)
- **Purpose**: Productivity percentiles
- **Fields**: percentile, productivity_score
- **Used In**: Productivity benchmarking

#### 9. percentile_ministry_effectiveness_trend.csv (87 bytes, 1 line)
- **Purpose**: Effectiveness percentiles
- **Fields**: percentile, effectiveness_score

#### 10. percentile_ministry_decision_impact.csv (667 bytes, 12 lines)
- **Purpose**: Decision impact percentiles
- **Fields**: percentile, impact_score
- **Used In**: Decision impact benchmarking (P50, P75, P90)

#### 11. percentile_politician_influence_metrics.csv (231 bytes, 3 lines)
- **Purpose**: Politician influence percentiles
- **Fields**: percentile, influence_score
- **Used In**: Influence Network Diagram (D3.js)

### View Files (Sample Data with Full Details)

#### 12. view_ministry_risk_evolution_sample.csv (1.8KB, 9 lines)
- **Purpose**: Detailed risk evolution sample data
- **Fields**: Extended risk metrics with historical context

#### 13. view_ministry_productivity_matrix_sample.csv (5.7KB, 38 lines)
- **Purpose**: Detailed productivity matrix sample
- **Fields**: Extended productivity metrics

#### 14. view_ministry_effectiveness_trends_sample.csv (3.6KB, 14 lines)
- **Purpose**: Detailed effectiveness trends sample
- **Fields**: Extended effectiveness metrics

#### 15. view_ministry_decision_impact_sample.csv (146KB, 1,328 lines)
- **Purpose**: Comprehensive decision impact sample data
- **Fields**: Full decision tracking with detailed metadata
- **Size**: Largest file with extensive historical data

## Total Dataset

- **Total Files**: 15 CSV files
- **Total Size**: ~180KB
- **Total Records**: ~1,880 data points
- **Coverage**: Current government period + 5 years historical

## Swedish Government Ministries

The data covers 10-12 Swedish government ministries:
1. **Finansdepartementet** (Ministry of Finance)
2. **Utrikesdepartementet** (Ministry of Foreign Affairs)
3. **Försvarsdepartementet** (Ministry of Defence)
4. **Justitiedepartementet** (Ministry of Justice)
5. **Socialdepartementet** (Ministry of Health and Social Affairs)
6. **Utbildningsdepartementet** (Ministry of Education)
7. **Näringsdepartementet** (Ministry of Enterprise)
8. **Miljödepartementet** (Ministry of Environment)
9. **Kulturdepartementet** (Ministry of Culture)
10. **Infrastrukturdepartementet** (Ministry of Infrastructure)

## Dashboard Integration

The ministry dashboard (`js/ministry-dashboard.js`) uses these files to generate:

1. **Ministry Risk Heat Map** (D3.js)
   - Files: distribution_ministry_risk_levels.csv, percentile_ministry_risk_evolution.csv
   - Displays: Color-coded risk levels (Critical/High/Medium/Low)

2. **Top 10 Influential Ministers** (Chart.js)
   - Files: percentile_politician_influence_metrics.csv
   - Displays: Horizontal bar chart of influence scores

3. **Ministry Productivity Matrix** (Chart.js)
   - Files: distribution_ministry_productivity_matrix.csv, percentile_ministry_productivity_matrix.csv
   - Displays: Quarterly productivity comparison

4. **Decision Impact Timeline** (Chart.js)
   - Files: distribution_ministry_decision_impact.csv, percentile_ministry_decision_impact.csv
   - Displays: Multi-ministry decision effectiveness trends

## Data Update Frequency

- **CIA Platform Updates**: Weekly (government changes quarterly)
- **Local Cache**: 1 hour (configured in ministry-dashboard.js)
- **Manual Update**: Run `./download-ministry-data.sh` to refresh all files

## Risk Assessment Methodology

Risk scores are calculated using 45 risk rules from CIA platform:
- **Politician-Level**: 20 rules (attendance, voting consistency, role conflicts, productivity)
- **Party-Level**: 12 rules (coalition discipline, ideological drift, internal conflicts)
- **Committee-Level**: 8 rules (legislative productivity, partisan deadlock, expert testimony)
- **Ministry-Level**: 5 rules (budget overruns, policy failures, accountability lapses)

## Data Quality

- **Source**: Official Swedish Parliament (Riksdagen) open data APIs
- **Processing**: CIA platform aggregation and risk analysis
- **Validation**: Ministry names validated against Swedish government structure
- **Format**: CSV with UTF-8 encoding
- **Delimiter**: Comma-separated
- **Headers**: First row contains column names

## Usage

### JavaScript (Dashboard)
```javascript
const baseUrl = 'cia-data/ministry/';
const response = await fetch(`${baseUrl}distribution_ministry_risk_levels.csv`);
const csvText = await response.text();
const data = parseCSV(csvText);
```

### Command Line
```bash
# Download all files
./download-ministry-data.sh

# View a specific file
cat distribution_ministry_risk_levels.csv

# Count records
wc -l *.csv
```

## Related Files

- **Dashboard**: `js/ministry-dashboard.js` (1,373 lines)
- **Styles**: `styles.css` (dashboard section, lines 3552-4003)
- **Documentation**: See main repository README and inline documentation in `js/ministry-dashboard.js`
- **HTML**: All 14 language files (index*.html) with dashboard section

## License

Data provided by CIA platform (https://github.com/Hack23/cia) under open source license.

## Last Updated

2026-02-09

## Contact

For questions about the data or dashboard implementation:
- **Repository**: https://github.com/Hack23/riksdagsmonitor
- **CIA Platform**: https://www.hack23.com/cia/
- **Issues**: https://github.com/Hack23/riksdagsmonitor/issues
