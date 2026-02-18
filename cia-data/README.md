# CIA Platform Data Repository

This directory contains CSV data files downloaded from the [CIA Platform](https://github.com/Hack23/cia) for use in Riksdagsmonitor dashboards.

## 📊 Data Quality Upgrade (2026-02-18)

**Comprehensive CIA Intelligence Data Integration**
- ✅ **69 total files** (was 36) 
- ✅ **33 new files added**: Risk views, anomaly detection, percentile time-series, committee data
- ✅ **403 real politicians** with complete risk assessment (was 3 aggregated rows)
- ✅ **All files validated**: 0 errors, 0 warnings
- ✅ **Mock data removed**: Dashboards now use authentic CIA Platform intelligence

### Key Improvements
1. **Risk Assessment**: 69KB detailed politician risk data (403 MPs × 45 rules)
2. **Anomaly Detection**: 13KB seasonal patterns + voting anomaly detection
3. **Temporal Analysis**: 23 percentile files for trend visualization
4. **Committee Intelligence**: 2.8MB of committee decision data (10,000+ records)
5. **Data Validation**: Automated validation script ensures quality

## Purpose

- **Improved Performance**: Local data loading is faster than remote fetches
- **Reliability**: Reduces dependency on external network availability
- **Offline Capability**: Dashboards work even without internet connection
- **Development**: Enables local testing without API rate limits
- **Data Quality**: Real CIA Platform intelligence (no synthetic mock data)

## Directory Structure

```
cia-data/
├── README.md                                      # This file
├── data-manifest.json                             # File metadata (v2.0)
├── download-csv.sh                                # Automated download (69 files)
├── validate-csv.sh                                # Data validation script
│
├── risk/                                          # Risk Assessment (69KB)
│   ├── distribution_ministry_risk_levels.csv     # Ministry risk aggregation (91 bytes)
│   ├── distribution_ministry_risk_quarterly.csv  # Quarterly trends (405 bytes)
│   ├── distribution_crisis_resilience.csv        # Crisis resilience (441 bytes)
│   ├── view_politician_risk_summary_sample.csv   # 403 politicians (69KB) ★
│   ├── view_ministry_risk_evolution_sample.csv   # Ministry temporal risk (1.8KB)
│   └── view_risk_score_evolution_sample.csv      # Risk evolution (5.5KB)
│
├── anomaly/                                       # Anomaly Detection (13KB)
│   ├── distribution_anomaly_by_party.csv         # Party anomaly patterns (61 bytes)
│   ├── view_riksdagen_voting_anomaly_detection_sample.csv      # Voting anomalies (197 bytes)
│   ├── view_riksdagen_seasonal_anomaly_detection_sample.csv    # Seasonal patterns (13KB) ★
│   └── view_election_cycle_anomaly_pattern_sample.csv          # Election cycle anomalies (4.1KB)
│
├── percentile/                                    # Temporal Analysis (23 files)
│   ├── percentile_risk_score_evolution.csv       # Risk percentiles
│   ├── percentile_voting_anomaly_detection.csv   # Anomaly percentiles
│   ├── percentile_crisis_resilience_indicators.csv
│   ├── percentile_seasonal_activity_patterns.csv
│   ├── percentile_committee_productivity*.csv    # Committee percentiles (2 files)
│   ├── percentile_ministry_*.csv                 # Ministry percentiles (4 files)
│   ├── percentile_party_*.csv                    # Party percentiles (3 files)
│   ├── percentile_politician_*.csv               # Politician percentiles (8 files)
│   └── percentile_election_proximity_trends.csv
│
├── committee/                                     # Committee Data (2.8MB)
│   ├── distribution_committee_activity.csv
│   ├── distribution_committee_productivity.csv
│   ├── distribution_committee_productivity_matrix.csv
│   ├── distribution_annual_committee_assignments.csv
│   ├── distribution_annual_committee_documents.csv
│   ├── view_riksdagen_committee_decisions_sample.csv                  # 1.1MB, 5,006 records ★
│   └── view_riksdagen_committee_ballot_decision_party_summary_sample.csv # 1.7MB, 5,028 records ★
│
├── party/                                         # Party Performance
│   ├── distribution_party_performance.csv
│   ├── distribution_party_effectiveness_trends.csv
│   ├── distribution_party_momentum.csv
│   ├── distribution_coalition_alignment.csv
│   ├── distribution_annual_party_members.csv
│   ├── distribution_gender_by_party.csv
│   ├── distribution_experience_by_party.csv
│   ├── distribution_behavioral_patterns_by_party.csv
│   └── distribution_decision_patterns_by_party.csv
│
├── politician/                                    # Politician Data
│   ├── distribution_experience_levels.csv
│   ├── distribution_assignment_roles.csv
│   ├── distribution_influence_buckets.csv
│   └── distribution_person_status.csv
│
├── ministry/                                      # Ministry Effectiveness
│   ├── distribution_ministry_effectiveness.csv
│   ├── distribution_ministry_productivity_matrix.csv
│   ├── distribution_ministry_decision_impact.csv
│   └── distribution_annual_ministry_assignments.csv
│
├── voting/                                        # Voting & Ballot Data
│   ├── distribution_annual_party_votes.csv
│   ├── distribution_annual_ballots.csv
│   ├── distribution_decision_trends.csv
│   ├── distribution_document_types.csv
│   ├── distribution_annual_document_types.csv
│   ├── distribution_document_status.csv
│   └── distribution_annual_document_status.csv
│
├── election/                                      # Election Data
│   └── distribution_election_regions.csv
│
├── election-cycle/                                # Election Cycle Analysis
│   ├── view_election_cycle_comparative_analysis_sample.csv
│   ├── view_election_cycle_decision_intelligence_sample.csv
│   ├── view_election_cycle_predictive_intelligence_sample.csv
│   └── view_election_cycle_temporal_trends_sample.csv
│
├── seasonal/                                      # Seasonal Activity
│   └── view_riksdagen_seasonal_activity_patterns_sample.csv
│
└── Root-Level Files                               # Large detailed datasets
    ├── view_riksdagen_politician_sample.csv                      # 540KB
    ├── view_riksdagen_politician_experience_summary_sample.csv   # 5.7MB
    ├── view_riksdagen_party_summary_sample.csv                   # 3.6KB
    ├── view_riksdagen_party_role_member_sample.csv               # 42KB
    ├── view_riksdagen_party_document_summary_sample.csv          # 1.5KB
    ├── view_riksdagen_committee_decisions.csv                    # 111KB (existing)
    ├── view_riksdagen_committee_ballot_decision_party_summary.csv # 172KB (existing)
    └── extraction_summary_report.csv                             # 16KB
```

★ = New high-value files added in 2026-02-18 upgrade

## Data Files

### Election Cycle Data (election-cycle/)

#### 1. view_election_cycle_comparative_analysis_sample.csv
**Size**: ~153KB | **Records**: 1,110+  
**Dashboard**: Election Cycle Intelligence Dashboard  
**Purpose**: Party performance evolution across 9 election cycles (1994-2034)

**Key Fields**:
- `election_cycle_id`: Election cycle identifier (e.g., "2022-2026")
- `cycle_year`: Cycle numeric identifier
- `calendar_year`: Specific year within cycle
- `semester`: Time period (annual, spring, autumn)
- `party`: Political party abbreviation (M, S, SD, C, V, MP, KD, L)
- `performance_score`: Overall performance metric (0-100)
- `party_win_rate`: Win percentage in votes (0-100)
- `party_participation_rate`: Participation percentage
- `discipline_score`: Party discipline metric
- `rank_by_performance`: Performance ranking
- `ntile_party_tier`: Performance tier (1-4, 1=best)
- `competitiveness_index`: Competitiveness metric
- `change_performance_pct`: Performance change percentage
- `performance_trend`: Trend indicator (stable, improving, declining)

**Use Cases**:
- Timeline chart showing party performance evolution
- Party tier distribution analysis
- Historical trend comparison
- Performance ranking visualization

---

#### 2. view_election_cycle_decision_intelligence_sample.csv
**Size**: ~59KB | **Records**: 414+  
**Dashboard**: Election Cycle Intelligence Dashboard  
**Purpose**: Legislative decision-making effectiveness by party and cycle

**Key Fields**:
- `election_cycle_id`: Election cycle identifier
- `party`: Political party abbreviation
- `total_proposals`: Number of proposals submitted
- `approved_proposals`: Number approved
- `rejected_proposals`: Number rejected
- `avg_approval_rate`: Average approval rate percentage
- `decision_effectiveness`: Effectiveness category (LOWLY_EFFECTIVE, MODERATELY_EFFECTIVE, HIGHLY_EFFECTIVE)
- `legislative_momentum`: Momentum score
- `ministry_impact_score`: Ministry impact metric (0-100)
- `ministries_with_decisions`: Count of ministries involved
- `rank_by_success_rate`: Success ranking
- `ntile_effectiveness`: Effectiveness quartile (1-4)
- `change_success_pct`: Success rate change percentage
- `decision_trend`: Trend indicator

**Use Cases**:
- Decision effectiveness heatmap (D3.js)
- Approval rate analysis by party/cycle
- Legislative momentum tracking
- Ministry impact assessment

---

#### 3. view_election_cycle_predictive_intelligence_sample.csv
**Size**: ~3.9KB | **Records**: 41+  
**Dashboard**: Election Cycle Intelligence Dashboard  
**Purpose**: Predictive risk forecasting and early warning indicators

**Key Fields**:
- `election_cycle_id`: Election cycle identifier
- `semester`: Time period
- `risk_forecast_category`: Risk level (STABLE, RAPID_ESCALATION)
- `politicians_at_risk`: Count of politicians at risk
- `avg_risk_score_change`: Average risk score change
- `ministries_at_risk`: Count of ministries at risk
- `avg_party_win_rate_trend`: Average win rate trend
- `parties_with_increasing_absence`: Count of parties with rising absences
- `risk_trajectory`: Risk trajectory indicator
- `forecast_confidence`: Confidence level (low, moderate, high)
- `predictive_alert_level`: Alert level (low, medium, high)

**Use Cases**:
- Risk forecast scatter chart
- Early warning system visualization
- Risk trajectory analysis
- Confidence interval display

---

#### 4. view_election_cycle_temporal_trends_sample.csv
**Size**: ~8.7KB | **Records**: 74+  
**Dashboard**: Election Cycle Intelligence Dashboard  
**Purpose**: Temporal voting patterns and activity trends

**Key Fields**:
- `election_cycle_id`: Election cycle identifier
- `semester`: Time period
- `is_pre_election_semester`: Boolean indicator
- `months_until_election`: Months remaining until election
- `active_politicians`: Count of active MPs
- `avg_attendance_rate`: Average attendance percentage
- `total_ballots`: Total ballot count
- `total_votes`: Total votes cast
- `avg_win_rate`: Average win rate
- `avg_rebel_rate`: Average rebellion rate
- `violation_count`: Rule violation count
- `total_decisions`: Total decisions made
- `avg_approval_rate`: Average approval rate
- `avg_committee_productivity`: Committee productivity metric
- `stddev_attendance`: Attendance standard deviation
- `stddev_win_rate`: Win rate standard deviation
- `volatility_assessment`: Volatility indicator (stable, moderate, high)
- `change_attendance_pct`: Attendance change percentage
- `change_decisions_pct`: Decision volume change percentage
- `forecast_trend`: Forecast trend indicator

**Use Cases**:
- Temporal trends multi-axis chart
- Pre-election period analysis
- Activity pattern visualization
- Volatility assessment

---

## Data Source

All data files are sourced from the CIA platform sample data repository:
```
https://github.com/Hack23/cia/tree/master/service.data.impl/sample-data
```

**Base URL**: `https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/`

## Updating Data

To update all CSV files, run the download script:

```bash
cd cia-data
chmod +x download-csv.sh
./download-csv.sh
```

Or manually download specific files:

```bash
cd cia-data/election-cycle
curl -O https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_election_cycle_comparative_analysis_sample.csv
curl -O https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_election_cycle_decision_intelligence_sample.csv
curl -O https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_election_cycle_predictive_intelligence_sample.csv
curl -O https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_election_cycle_temporal_trends_sample.csv
```

## Dashboard Integration

### Election Cycle Dashboard

**File**: `js/election-cycle-dashboard.js`  
**Strategy**: Local-first with remote fallback

The dashboard attempts to load data from local files first, then falls back to remote GitHub URLs if local files are unavailable:

```javascript
const CONFIG = {
  dataUrls: {
    comparative: [
      'cia-data/election-cycle/view_election_cycle_comparative_analysis_sample.csv',
      'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_election_cycle_comparative_analysis_sample.csv'
    ],
    // ... other files
  }
};
```

## Data Freshness

- **Update Frequency**: Sample data is relatively static
- **Last Updated**: 2026-02-09
- **Recommended Update**: Monthly or when CIA platform releases updates

## Size Information

Total size: ~225KB (4 CSV files)

| File | Size | Records |
|------|------|---------|
| comparative_analysis | 153KB | 1,110+ |
| decision_intelligence | 59KB | 414+ |
| predictive_intelligence | 3.9KB | 41+ |
| temporal_trends | 8.7KB | 74+ |

## Data Quality

All CSV files include:
- ✅ Header row with field names
- ✅ Comma-separated values
- ✅ UTF-8 encoding
- ✅ Consistent date formats
- ✅ Numeric values properly formatted

## Related Documentation

- [ELECTION_CYCLE_DASHBOARD.md](../ELECTION_CYCLE_DASHBOARD.md) - Dashboard implementation guide
- [CIA Platform](https://github.com/Hack23/cia) - Source repository
- [Riksdagsmonitor README](../README.md) - Project overview

## License

Data is provided by the CIA platform under Apache License 2.0.

## Contributing

To add new data files:
1. Download from CIA platform sample-data directory
2. Place in appropriate subdirectory
3. Update this README with file description
4. Update download-csv.sh script
5. Commit both CSV and documentation

---

**Maintained by**: Hack23 AB  
**Last Updated**: 2026-02-09

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

## New High-Value Datasets (2026-02-18)

### Risk Assessment - view_politician_risk_summary_sample.csv

**Size**: 69KB | **Records**: 403 politicians  
**Dashboard**: Risk Assessment Dashboard (`js/risk-dashboard.js`)  
**Source**: CIA Platform 45-rule risk scoring engine

**Purpose**: Complete risk assessment for all 403 current Swedish MPs with detailed violation tracking and risk classification.

**Key Fields**:
- `person_id`: Unique politician identifier
- `first_name`, `last_name`, `party`: Politician details
- `status`: Current status (e.g., "Tjänstgörande riksdagsledamot")
- `total_violations`: Total number of policy/conduct violations
- `latest_violation_date`: Most recent violation timestamp
- `absenteeism_violations`, `effectiveness_violations`, `discipline_violations`, `productivity_violations`, `collaboration_violations`: Violation breakdowns
- `annual_absence_rate`: Annual absence percentage
- `annual_rebel_rate`: Annual rebellion rate percentage
- `annual_vote_count`: Total votes cast annually
- `documents_last_year`: Documents produced in last year
- `risk_score`: Overall risk score (0-100 scale)
- `risk_level`: Classification (LOW, MEDIUM, HIGH, CRITICAL)
- `risk_assessment`: Textual assessment summary

**Heat Map Transformation**:
Each politician generates 45 data points: `403 politicians × 45 rules = 18,135 risk assessment data points`

### Anomaly Detection - view_riksdagen_seasonal_anomaly_detection_sample.csv

**Size**: 13KB | **Records**: 42 seasonal patterns  
**Purpose**: Detect unusual parliamentary activity using z-score statistical analysis

**Key Fields**:
- `ballot_z_score`, `doc_z_score`, `attendance_z_score`: Statistical deviations
- `anomaly_type`: NO_ANOMALY, DOCUMENT_ANOMALY, etc.
- `anomaly_severity`: LOW, CRITICAL, etc.

### Committee Intelligence Files

**view_riksdagen_committee_decisions_sample.csv**: 1.1MB, 5,006 decisions  
**view_riksdagen_committee_ballot_decision_party_summary_sample.csv**: 1.7MB, 5,028 party votes

**Purpose**: Complete committee decision tracking with party voting patterns

## Data Validation

Run validation: `./cia-data/validate-csv.sh`

**Checks**: UTF-8/ASCII encoding, CSV structure, file sizes, column consistency

## Dashboard → CSV Mapping

| Dashboard | Primary CSV Files |
|-----------|------------------|
| **Risk Assessment** | `risk/view_politician_risk_summary_sample.csv` (403 politicians) |
| **Committee** | `committee/view_riksdagen_committee_decisions_sample.csv` (5,006 records) |
| **Coalition** | `party/distribution_coalition_alignment.csv` |
| **Ministry** | `risk/view_ministry_risk_evolution_sample.csv` |

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

**Last Updated**: 2026-02-18  
**Maintained by**: Hack23 AB
