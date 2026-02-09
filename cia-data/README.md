# CIA Platform Data Files

This directory contains CSV data files exported from the [CIA (Citizen Intelligence Agency) Platform](https://www.hack23.com/cia) for use in riksdagsmonitor dashboards.

## Overview

The CIA platform analyzes Swedish parliamentary data from the Riksdag (Swedish Parliament) and provides comprehensive intelligence on political activity, voting patterns, and legislative behavior. These CSV files contain pre-computed analytical data that powers the interactive dashboards on riksdagsmonitor.com.

## Directory Structure

```
cia-data/
├── README.md                          # This file
├── pre-election/                      # Pre-election monitoring data
│   ├── view_riksdagen_pre_election_quarterly_activity_sample.csv
│   └── view_riksdagen_q4_election_year_comparison_sample.csv
└── download-csv.sh                    # Script to update all CSV files
```

## Data Files

### Pre-Election Monitoring (pre-election/)

#### 1. `view_riksdagen_pre_election_quarterly_activity_sample.csv`

**Description**: Tracks Q4 (October-December) parliamentary activity in the critical 12-24 months before Swedish elections.

**Time Period**: 2023-2025 (3 years, 4 rows including header)

**Use Case**: Pre-Election Monitoring Dashboard (PR #67)

**Key Fields**:
- `year` - Calendar year (2023, 2024, 2025)
- `is_election_year` - Boolean flag (t/f)
- `total_ballots` - Number of parliamentary votes in Q4
- `active_politicians` - Number of MPs active in Q4
- `avg_attendance_rate` - Average MP attendance percentage
- `total_documents` - Documents produced in Q4
- `total_proposals` - Legislative proposals introduced
- `total_motions` - Motions filed
- `total_new_assignments` - New committee/role assignments
- `avg_party_win_rate` - Average party voting success rate
- `avg_party_absence_rate` - Average party absence rate
- `party_documents_total` - Total documents by all parties
- `baseline_ballots` - Multi-year Q4 ballot baseline
- `baseline_documents` - Multi-year Q4 document baseline
- `baseline_assignments` - Multi-year Q4 assignment baseline
- `ballot_deviation_from_baseline` - Absolute deviation from baseline
- `document_deviation_from_baseline` - Absolute deviation from baseline
- `ballot_percent_change_from_baseline` - Percentage change from baseline
- `document_percent_change_from_baseline` - Percentage change from baseline
- `q4_activity_classification` - Activity level (REDUCED_ACTIVITY, NORMAL_ACTIVITY, ELEVATED_ACTIVITY)
- `prev_year_ballots` - Previous year's ballot count
- `yoy_ballot_change_pct` - Year-over-year percentage change
- `rank_by_q4_activity` - Ranking by activity level (1=highest, 3=lowest)

**Sample Data** (2025 Q4):
```
Year: 2025
Ballots: 16,750 (+4.34% vs baseline)
Documents: 3,451 (+25.55% vs baseline)
Attendance: 85.75%
Party Win Rate: 59.72%
Classification: NORMAL_ACTIVITY
```

#### 2. `view_riksdagen_q4_election_year_comparison_sample.csv`

**Description**: Historical comparison of Q4 parliamentary activity between election years and non-election years.

**Time Period**: 2002-2025 (24 years, 25 rows including header)

**Use Case**: Pre-Election Monitoring Dashboard - Historical Pattern Analysis

**Key Fields**:
- `year` - Calendar year (2002-2025)
- `is_election_year` - Boolean flag (t/f)
- `total_ballots` - Number of parliamentary votes in Q4
- `active_politicians` - Number of MPs active in Q4
- `attendance_rate` - MP attendance percentage
- `documents_produced` - Documents produced in Q4
- `baseline_ballots` - Multi-year Q4 ballot baseline (90.17 avg)
- `baseline_docs` - Multi-year Q4 document baseline (2,963.67 avg)
- `baseline_attendance` - Multi-year Q4 attendance baseline (100%)
- `ballot_deviation_from_baseline` - Absolute deviation from baseline
- `doc_deviation_from_baseline` - Absolute deviation from baseline
- `attendance_deviation_from_baseline` - Absolute deviation from baseline
- `ballot_percent_change` - Percentage change from baseline
- `doc_percent_change` - Percentage change from baseline
- `q4_pattern` - Pattern classification (NORMAL_Q4, NORMAL_ELECTION_Q4)
- `ballot_z_score` - Z-score for ballot deviation
- `doc_z_score` - Z-score for document deviation
- `attendance_z_score` - Z-score for attendance deviation
- `activity_classification` - Activity level (NORMAL_ACTIVITY, REDUCED_ACTIVITY, ELEVATED_ACTIVITY)

**Key Insights**:
- **Election Years** (2022, 2018, 2014, 2010, 2006, 2002): Typically show -30% to -65% ballot reduction in Q4
- **Non-Election Years**: More stable activity around baseline (90.17 ballots, 2,963.67 documents)
- **2022 Election Q4**: -65.62% ballots, -14.36% documents (REDUCED_ACTIVITY)
- **2014 Election Q4**: -73.38% ballots, +5.65% documents (REDUCED_ACTIVITY)

## Data Source

All CSV files are sourced from the CIA Platform's GitHub repository:

**Base URL**: `https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/`

**Repository**: https://github.com/Hack23/cia

**Note**: These are **sample data files** (indicated by `_sample` suffix) intended for development and demonstration purposes. The full CIA platform contains complete historical data from 1971-2024.

## Data Updates

### Manual Update

To manually download the latest CSV files:

```bash
cd cia-data
./download-csv.sh
```

### Automatic Updates

Dashboards implement a **local-first loading strategy** with automatic fallback:

1. **Try Local**: Load from `cia-data/` directory
2. **Fallback to Remote**: If local file unavailable, fetch from GitHub
3. **Cache**: Store in LocalStorage for 24 hours

This ensures dashboards work offline while staying up-to-date when online.

## Dashboard Integration

### Pre-Election Monitoring Dashboard

**JavaScript**: `js/pre-election-dashboard.js`

**Data Files Used**:
- `cia-data/pre-election/view_riksdagen_pre_election_quarterly_activity_sample.csv`
- `cia-data/pre-election/view_riksdagen_q4_election_year_comparison_sample.csv`

**Visualizations**:
1. Q4 Activity Timeline (2023-2025)
2. Election vs Non-Election Q4 Patterns
3. Deviation from Baseline Radar
4. Party Performance Trends
5. Year-over-Year Waterfall
6. Early Warning Indicator Matrix

## Data Quality

### Validation

All CSV files are validated against the following criteria:
- **Encoding**: UTF-8
- **Delimiter**: Comma (`,`)
- **Header**: First row contains column names
- **Numeric Fields**: Validated for proper decimal formatting
- **Date Fields**: ISO 8601 format (YYYY-MM-DD) where applicable

### Data Freshness

| File | Last Updated | Records | Size |
|------|--------------|---------|------|
| `view_riksdagen_pre_election_quarterly_activity_sample.csv` | 2026-02-09 | 3 | 1.8 KB |
| `view_riksdagen_q4_election_year_comparison_sample.csv` | 2026-02-09 | 24 | 7.4 KB |

## License

All data files are licensed under the same terms as the CIA platform:

**Copyright**: © 2008-2026 Hack23 AB (Org.nr 5595347807)

**License**: Apache License 2.0

See [LICENSE](../LICENSE) for full details.

## Support

For questions about the data or CIA platform:

- **Website**: https://www.hack23.com/cia
- **GitHub**: https://github.com/Hack23/cia
- **Email**: pether@hack23.com
- **Maintainer**: James Pether Sörling (CISSP, CISM)

## References

- [CIA Platform Documentation](https://hack23.github.io/cia/)
- [Swedish Parliament (Riksdag) Open Data](http://data.riksdagen.se/)
- [Swedish Election Authority](http://www.val.se/)

---

**Last Updated**: 2026-02-09  
**Version**: 1.0  
**Maintained by**: Hack23 AB
