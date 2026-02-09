# Seasonal Activity Patterns Data

Quarterly parliamentary activity analysis for the Swedish Riksdag (2002-2025).

## Files

### view_riksdagen_seasonal_activity_patterns_sample.csv

**Size**: ~35KB  
**Records**: 86 data rows (23 years × 4 quarters, some quarters missing)  
**Time Range**: 2002-2025  
**Update Frequency**: Quarterly

**Fields** (32 columns):

#### Time Dimensions
- `year` - Calendar year (2002-2025)
- `quarter` - Quarter number (1-4)
- `is_election_year` - Boolean flag (t/f)
- `election_cycle` - Election cycle identifier (e.g., "2022-2026")
- `quarter_label` - Descriptive label (Q1_WINTER, Q2_SPRING, Q3_SUMMER, Q4_AUTUMN)
- `parliamentary_period` - Session description

#### Activity Metrics
- `total_ballots` - Number of votes/ballots
- `active_politicians` - Number of active MPs
- `attendance_rate` - Attendance percentage
- `documents_produced` - Number of documents

#### Quarterly Baselines
- `q_baseline_ballots` - Quarter baseline for ballots
- `q_stddev_ballots` - Standard deviation for ballots
- `q_baseline_docs` - Quarter baseline for documents
- `q_stddev_docs` - Standard deviation for documents
- `q_baseline_attendance` - Quarter baseline for attendance
- `q_stddev_attendance` - Standard deviation for attendance

#### Statistical Analysis (Z-Scores)
- `ballot_z_score` - Z-score for ballot volume (anomaly detection)
- `doc_z_score` - Z-score for document production
- `attendance_z_score` - Z-score for attendance rate

**Z-Score Interpretation**:
- `|Z| < 1.0`: Normal variation
- `1.0 ≤ |Z| < 2.0`: Moderate deviation
- `|Z| ≥ 2.0`: Significant anomaly (flagged in dashboard)

#### Activity Classifications
- `base_activity_classification` - Primary classification:
  - NORMAL_ACTIVITY
  - ELEVATED_ACTIVITY
  - REDUCED_ACTIVITY
  - ANOMALY_DETECTED
- `seasonal_pattern_classification` - Seasonal pattern:
  - NORMAL_SEASONAL_PATTERN
  - Q3_SUMMER_LULL
  - Q4_ELEVATED_ACTIVITY
  - UNUSUALLY_HIGH_ACTIVITY
  - UNUSUALLY_LOW_ACTIVITY

#### Temporal Comparisons
- `prev_quarter_ballots` - Previous quarter ballot count
- `next_quarter_ballots` - Next quarter ballot count
- `prev_quarter_attendance` - Previous quarter attendance
- `prev_quarter_documents` - Previous quarter documents
- `qoq_ballot_change_pct` - Quarter-over-quarter change percentage

#### Cross-Year Analysis
- `cross_year_quarter_avg_ballots` - Average ballots for this quarter across all years
- `cross_year_quarter_stddev_ballots` - Standard deviation across years
- `cross_year_quarter_avg_docs` - Average documents across years
- `cross_year_z_score` - Z-score compared to historical average
- `deviation_from_typical_quarter` - Deviation from typical quarter

#### Activity Quartiles
- `activity_quartile_cycle` - Quartile ranking (1-4) within election cycle

## Key Insights

### Quarterly Patterns

**Q1 (Winter Session - Jan-Mar)**
- Baseline: ~136 ballots, ~251 documents
- Typical attendance: 100%

**Q2 (Spring Session - Apr-Jun)**
- Baseline: ~193 ballots, ~225 documents
- Highest ballot activity
- Typical attendance: 100%

**Q3 (Summer Recess - Jul-Sep)**
- Baseline: ~5 ballots, ~849 documents
- **Lowest activity quarter** (summer break)
- Minimal voting, document processing continues

**Q4 (Autumn Session - Oct-Dec)**
- Baseline: ~90 ballots, ~2,964 documents
- **Highest document production**
- Moderate ballot activity

### Anomalies Detected

Records with `|Z| ≥ 2.0`:
- **2021 Q2**: 336 ballots (Z=2.17) - Unusually high activity
- **2004 Q3**: 17 ballots (Z=2.80) - Anomaly during summer recess

Note: 2022 Q4 (Z=-1.66) and 2023 Q4 (Z=-1.57) show reduced activity but do not meet the |Z| ≥ 2.0 threshold for classification as statistical anomalies.

### Election Year Effects

Election years show:
- Reduced Q4 activity (transition period)
- Pattern disruption in autumn sessions
- Quick recovery post-election

## Dashboard Usage

This data powers the **Seasonal Activity Patterns Dashboard** with:
- D3.js heat map visualization (year × quarter grid)
- Z-score anomaly detection timeline
- Cross-year quarter comparison charts
- Activity classification distribution
- Quarter-over-quarter trend analysis

## Data Source

**URL**: https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_seasonal_activity_patterns_sample.csv

**CIA Platform**: https://github.com/Hack23/cia

## Updates

To refresh this data:
```bash
curl -o view_riksdagen_seasonal_activity_patterns_sample.csv \
  'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/view_riksdagen_seasonal_activity_patterns_sample.csv'
```

Or use the parent directory's download script:
```bash
cd ../
./download-csv.sh
```

---

**Last Updated**: 2026-02-09  
**Data Coverage**: 2002-2025
