# CIA Platform Sample Data

This directory contains CSV data files from the [Citizen Intelligence Agency (CIA)](https://github.com/Hack23/cia) platform for use in riksdagsmonitor dashboards.

## 📁 Directory Structure

```
cia-data/
├── seasonal/           # Seasonal activity patterns and anomaly detection
├── election-cycle/     # Election cycle analysis and predictive intelligence
├── party/              # Party performance, effectiveness, and longitudinal data
├── politician/         # Politician risk, behavior, and influence metrics
├── committee/          # Committee productivity and effectiveness
├── ministry/           # Ministry risk, effectiveness, and productivity
├── voting/             # Voting anomalies and patterns
└── distribution/       # Statistical distributions and trends
```

## 📊 Data Categories

### Seasonal & Temporal Analysis
- `view_riksdagen_seasonal_anomaly_detection_sample.csv` - Z-score based anomaly detection (2002-2025)
- `view_riksdagen_seasonal_activity_patterns_sample.csv` - Quarterly activity patterns
- `view_riksdagen_voting_anomaly_detection_sample.csv` - Voting behavior anomalies

### Election Cycle Intelligence
- `view_riksdagen_election_proximity_trends_sample.csv` - Activity trends near elections
- `view_election_cycle_comparative_analysis_sample.csv` - Cross-cycle comparisons
- `view_election_cycle_predictive_intelligence_sample.csv` - Election forecasting models
- `view_riksdagen_pre_election_quarterly_activity_sample.csv` - Pre-election activity

### Party Performance
- `distribution_annual_party_votes.csv` - Annual voting records by party (2002-2026)
- `distribution_party_performance.csv` - Party effectiveness metrics
- `view_party_performance_metrics_sample.csv` - Comprehensive party metrics
- `view_party_effectiveness_trends_sample.csv` - Temporal effectiveness analysis
- `view_riksdagen_party_longitudinal_performance_sample.csv` - 50+ years party evolution

### Committee Analysis
- `view_committee_productivity_sample.csv` - Committee output metrics
- `view_committee_productivity_matrix_sample.csv` - Cross-committee comparisons
- `distribution_committee_productivity_matrix.csv` - Productivity distribution

### Ministry Governance
- `view_ministry_risk_evolution_sample.csv` - Ministry risk tracking
- `view_ministry_effectiveness_trends_sample.csv` - Ministry performance trends
- `view_ministry_productivity_matrix_sample.csv` - Ministry output analysis
- `distribution_ministry_risk_levels.csv` - Risk classification

### Politician Metrics
- `view_politician_risk_summary_sample.csv` - Individual MP risk assessments
- `view_politician_behavioral_trends_sample.csv` - Behavioral pattern analysis
- `view_riksdagen_politician_influence_metrics_sample.csv` - Influence network metrics

### Statistical Distributions
- `distribution_decision_trends.csv` - Decision-making patterns
- `distribution_risk_score_buckets.csv` - Risk score distributions
- `distribution_coalition_alignment.csv` - Coalition behavior patterns

## 🔄 Data Updates

### Source
All CSV files are sourced from the CIA platform's sample data repository:
```
https://github.com/Hack23/cia/tree/master/service.data.impl/sample-data
```

### Update Frequency
- **Anomaly Detection**: Updated quarterly (after each parliamentary quarter)
- **Party/Politician Data**: Updated annually
- **Committee/Ministry**: Updated monthly
- **Election Cycle**: Updated during election years

### Manual Update
To download the latest versions of all CSV files:
```bash
cd cia-data
bash download-csv.sh
```

## 📈 Dashboard Usage

### Anomaly Detection Dashboard
**Files Used**:
- `seasonal/view_riksdagen_seasonal_anomaly_detection_sample.csv` (primary)
- `voting/view_riksdagen_voting_anomaly_detection_sample.csv` (supplementary)

**Features**:
- Z-score based statistical outlier detection
- 41 quarters analyzed (2002-2026)
- Severity classification: CRITICAL (≥2.5σ), HIGH (≥2.0σ), MODERATE (≥1.5σ), LOW (<1.5σ)
- 6 visualizations (Chart.js + D3.js)

### Future Dashboards
Additional dashboards can leverage:
- Election cycle data for forecasting
- Party longitudinal data for trend analysis
- Committee data for productivity tracking
- Ministry data for governance oversight

## 🔍 Data Fields

### Anomaly Detection CSV
Key fields in `view_riksdagen_seasonal_anomaly_detection_sample.csv`:
- `year`, `quarter` - Time period
- `total_ballots`, `documents_produced`, `attendance_rate` - Activity metrics
- `ballot_z_score`, `doc_z_score`, `attendance_z_score` - Statistical scores
- `anomaly_type` - BALLOT_ANOMALY, DOCUMENT_ANOMALY, ATTENDANCE_ANOMALY, NO_ANOMALY
- `anomaly_severity` - CRITICAL, HIGH, MODERATE, LOW
- `anomaly_direction` - UNUSUALLY_HIGH, UNUSUALLY_LOW, WITHIN_NORMAL_RANGE
- `max_z_score` - Highest absolute Z-score for the period

## 📄 License

Data is provided by the CIA platform under Apache 2.0 license.

## 🔗 References

- **CIA Platform**: https://www.hack23.com/cia
- **GitHub Repository**: https://github.com/Hack23/cia
- **Data Source**: https://github.com/Hack23/cia/tree/master/service.data.impl/sample-data
- **Riksdagsmonitor**: https://riksdagsmonitor.com

---

**Last Updated**: 2026-02-09  
**Total Files**: 25 CSV files (~636KB)  
**Coverage**: 1994-2034 (election cycles), 2002-2025 (seasonal), 50+ years (longitudinal)
