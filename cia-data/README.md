# CIA Platform Data Repository

This directory contains CSV data files downloaded from the [CIA Platform](https://github.com/Hack23/cia) for use in Riksdagsmonitor dashboards.

## Purpose

- **Improved Performance**: Local data loading is faster than remote fetches
- **Reliability**: Reduces dependency on external network availability
- **Offline Capability**: Dashboards work even without internet connection
- **Development**: Enables local testing without API rate limits

## Directory Structure

```
cia-data/
├── README.md                    # This file
├── download-csv.sh              # Automated download script
├── data-manifest.json           # File metadata and field descriptions
└── seasonal/                    # Seasonal activity patterns data
    ├── README.md
    └── view_riksdagen_seasonal_activity_patterns_sample.csv
```

## Data Sources

All CSV files are downloaded from:
```
https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/
```

## Usage Pattern

Dashboards implement a **local-first loading strategy**:

1. **Try Local**: Attempt to load from `cia-data/` directory
2. **Fallback Remote**: If local unavailable, fetch from GitHub
3. **Cache**: Store in browser LocalStorage for 24 hours

Example configuration:
```javascript
const CONFIG = {
  dataUrls: [
    'cia-data/seasonal/view_riksdagen_seasonal_activity_patterns_sample.csv',  // Local
    'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_seasonal_activity_patterns_sample.csv'  // Remote
  ]
};
```

## Updating Data

To refresh all CSV files:

```bash
cd cia-data
./download-csv.sh
```

This script downloads the latest data from the CIA platform repository.

## Data Categories

### Seasonal Activity Patterns (`seasonal/`)

Quarterly parliamentary activity analysis (2002-2025):
- **File**: `view_riksdagen_seasonal_activity_patterns_sample.csv`
- **Records**: 85 (11 quarters missing from full 96-quarter coverage for 2002–2025)
- **Dashboard**: Seasonal Activity Patterns Dashboard
- **Fields**: 32 columns including:
  - Time dimensions: year, quarter, is_election_year, election_cycle
  - Activity metrics: total_ballots, active_politicians, attendance_rate, documents_produced
  - Baselines: q_baseline_ballots, q_baseline_docs, q_baseline_attendance
  - Statistical: ballot_z_score, doc_z_score, attendance_z_score (anomaly detection)
  - Classifications: base_activity_classification, seasonal_pattern_classification
  - Cross-year: cross_year_quarter_avg_ballots, cross_year_z_score
  - Trends: qoq_ballot_change_pct, activity_quartile_cycle

### Anomaly Detection (`seasonal/`)

Statistical outlier identification in parliament activity (2002-2026):
- **File**: `view_riksdagen_seasonal_anomaly_detection_sample.csv`
- **Records**: 41 quarters (2002 Q1 - 2026 Q1)
- **Dashboard**: Anomaly Detection & Early Warning System
- **Purpose**: Identify unusual parliamentary activity patterns using Z-score analysis
- **Fields**: 20 columns including:
  - Time dimensions: year, quarter, is_election_year, parliamentary_period
  - Activity metrics: total_ballots, active_politicians, attendance_rate, documents_produced
  - Baselines: q_baseline_ballots, q_baseline_docs, q_baseline_attendance
  - Std Deviations: q_stddev_ballots, q_stddev_docs, q_stddev_attendance
  - Z-Scores: ballot_z_score, doc_z_score, attendance_z_score
  - Classification: activity_classification, anomaly_type, anomaly_direction
  - Severity: max_z_score, anomaly_severity (LOW, MODERATE, HIGH, CRITICAL)
  - Labels: quarter_label (Q1_JAN_MAR, Q2_APR_JUN, Q3_JUL_SEP, Q4_OCT_DEC)

**Anomaly Detection Criteria**:
- |Z| < 1.5: LOW severity (within normal range)
- 1.5 ≤ |Z| < 2.0: MODERATE severity
- 2.0 ≤ |Z| < 2.5: HIGH severity
- |Z| ≥ 2.5: CRITICAL severity

**Historical Findings** (from 41 quarters):
- 8 CRITICAL anomalies (Z ≥ 2.5)
- 2 HIGH anomalies (2.0 ≤ Z < 2.5)
- 12 MODERATE anomalies (1.5 ≤ Z < 2.0)
- 19 LOW (normal activity)
- Most extreme: 2006 Q1 document anomaly (Z = +10.97)

## Data Quality

- **Validation**: All CSV files validated against CIA platform schemas
- **Completeness**: Sample data represents key patterns and trends
- **Updates**: Data refreshed periodically from CIA platform
- **Integrity**: Files include checksums in data-manifest.json

## License

Data sourced from CIA Platform (Citizen Intelligence Agency):
- **Repository**: https://github.com/Hack23/cia
- **License**: Apache License 2.0
- **Copyright**: © 2008-2026 Hack23 AB

## Support

For questions about the data or CIA platform:
- **Website**: https://www.hack23.com/cia
- **Documentation**: https://hack23.github.io/cia/
- **Issues**: https://github.com/Hack23/cia/issues

---

**Last Updated**: 2026-02-09  
**Maintained by**: Hack23 AB
