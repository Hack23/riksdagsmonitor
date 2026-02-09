# CIA Data Files

This directory contains CSV data files downloaded from the CIA (Citizen Intelligence Agency) platform for use in the Riksdagsmonitor dashboards.

## Data Source

**Base URL**: https://github.com/Hack23/cia/tree/master/service.data.impl/sample-data

All CSV files are downloaded from the CIA platform's sample data directory, which provides intelligence analysis data for Swedish Parliament (Riksdag) monitoring.

## Available Data Files

### Risk Assessment Data

1. **distribution_politician_risk_levels.csv** (83 bytes)
   - Risk level distribution across MPs
   - Columns: `risk_level`, `politician_count`, `percentage`
   - Categories: HIGH, MEDIUM, LOW

2. **distribution_risk_by_party.csv** (466 bytes)
   - Party-level risk aggregation
   - Columns: `party`, `risk_level`, `politician_count`, `avg_risk_score`
   - Breaks down risk by political party

3. **distribution_risk_score_buckets.csv** (164 bytes)
   - Risk score ranges and distributions
   - Columns: `score_bucket`, `politician_count`, `avg_score`, `min_score`, `max_score`
   - Buckets: 10-29 (Low), 30-49 (Medium), 50-69 (High)

4. **percentile_risk_score_evolution.csv** (519 bytes)
   - Statistical percentiles for risk metrics
   - Columns: `column_name`, `data_type`, `distinct_count`, `min_value`, `max_value`, `p1`, `p10`, `p25`, `median`, `p75`, `p90`, `p99`
   - Metrics: absence_rate, rebel_rate, ballot_count, document_count

### Anomaly Detection Data

5. **distribution_voting_anomaly_classification.csv** (66 bytes)
   - Classification of voting anomalies
   - Columns: `anomaly_classification`, `politician_count`, `percentage`, `avg_rebellions`
   - Currently empty/placeholder

6. **percentile_voting_anomaly_detection.csv** (278 bytes)
   - Statistical percentiles for anomaly metrics
   - Columns: `column_name`, `data_type`, `distinct_count`, `min_value`, `max_value`, `p1`, `p10`, `p25`, `median`, `p75`, `p90`, `p99`
   - Metrics: total_rebellions, strong_consensus_rebellions, very_strong_consensus_rebellions, avg_consensus_strength_rebelled_against

### Crisis Resilience Data

7. **distribution_crisis_resilience.csv** (441 bytes)
   - Party and MP crisis resilience scores
   - Columns: `party`, `resilience_classification`, `politician_count`, `avg_resilience_score`
   - Classifications: HIGHLY_RESILIENT, INSUFFICIENT_DATA

### Top 10 Lists

8. **top10_ethics_concerns.csv** (14 bytes)
   - Top 10 MPs with highest ethics risk scores
   - Status: Not available (404) - placeholder file

9. **top10_electoral_risk.csv** (14 bytes)
   - Top 10 MPs with highest electoral vulnerability
   - Status: Not available (404) - placeholder file

## Data Format

All CSV files use comma-separated values with UTF-8 encoding. Files include:
- Header row with column names
- Data rows with actual values
- Some files may be empty or contain placeholder data

## Usage in Dashboards

These CSV files are used by the **Risk Assessment & Anomaly Detection Dashboard** implemented in `index.html`:

- **Risk Heat Map**: Uses politician risk levels and score buckets
- **Risk Distribution Chart**: Uses risk score buckets
- **Anomaly Detection**: Uses voting anomaly classification and detection percentiles
- **Crisis Resilience**: Uses crisis resilience distribution
- **Top 10 Lists**: Uses ethics concerns and electoral risk (when available)

## Data Update

To refresh the data files, run:

```bash
./download-csv.sh
```

This will download the latest versions from the CIA platform repository.

## Last Updated

**Date**: 2026-02-09  
**Source Commit**: master branch  
**Total Files**: 9 CSV files  
**Total Size**: ~44KB

## Data Quality Notes

- Some metrics may be sparse or empty (e.g., rebel_rate, document_count showing 0)
- Top 10 lists are not yet available in the source repository (404 responses)
- Percentile data provides P1, P10, P25, P50 (median), P75, P90, P99 for statistical analysis
- Party codes: S, M, SD, C, V, KD, L, MP (Swedish political parties)

## Integration with Dashboard

The dashboard currently fetches data from remote URLs but can be updated to use these local files for:
- Faster load times
- Offline capability
- Reduced external dependencies
- Version control of data snapshots

## License

Data provided by the CIA (Citizen Intelligence Agency) platform under open data principles for transparency and democratic accountability.

**Project**: https://github.com/Hack23/cia  
**Platform**: https://www.hack23.com/cia/
