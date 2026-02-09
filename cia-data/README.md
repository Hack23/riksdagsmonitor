# CIA Platform Data Directory

This directory contains CSV data files downloaded from the CIA (Citizen Intelligence Agency) platform for Swedish Parliament (Riksdag) analysis.

## Data Source
- **Repository**: https://github.com/Hack23/cia
- **Sample Data**: https://github.com/Hack23/cia/tree/master/service.data.impl/sample-data/
- **License**: Apache 2.0

## Directory Structure

```
cia-data/
├── coalition/          # Coalition alignment and partnership data
├── voting/            # Voting patterns and anomalies
├── parties/           # Party-level behavioral and decision data
└── README.md          # This file
```

## Data Files

### Coalition Data
- `distribution_coalition_alignment.csv` - Party alignment scores and coalition strength metrics

### Voting Data
- `distribution_voting_anomaly_classification.csv` - Classification of voting anomalies
- `distribution_anomaly_by_party.csv` - Anomaly counts by political party
- `distribution_annual_party_votes.csv` - Annual voting volumes (1971-2026)

### Party Data
- `distribution_behavioral_patterns_by_party.csv` - Behavioral consistency analysis
- `distribution_decision_patterns_by_party.csv` - Decision-making patterns

## Update Frequency
- Data files should be refreshed weekly from the CIA platform
- Last update: Check file modification timestamps

## Data Format
All files are in CSV (Comma-Separated Values) format with:
- Header row with column names
- UTF-8 encoding
- Comma delimiter

## Usage
Dashboard scripts in `/scripts/` automatically load these CSV files for visualization.
