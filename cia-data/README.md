# CIA Platform Sample Data

This directory contains CSV sample data files downloaded from the [CIA (Citizen Intelligence Agency) platform](https://github.com/Hack23/cia) for use in riksdagsmonitor dashboards.

## 📁 Directory Structure

```
cia-data/
├── party/          # Party-level metrics and analysis (9 files)
├── voting/         # Voting patterns and ballot data (7 files)
├── committee/      # Committee activity and productivity (5 files)
├── ministry/       # Government ministry effectiveness (4 files)
├── risk/           # Risk assessment data (3 files)
├── politician/     # Politician distribution metrics (3 files)
├── election/       # Election regions and cycles (1 file)
└── anomaly/        # Anomaly detection patterns (1 file)
```

**Total**: 33 CSV files, ~260KB

## 📊 Data Categories

### Party Data (9 files)
Files related to political party performance, effectiveness, and behavioral patterns.

| File | Description | Use Case |
|------|-------------|----------|
| `distribution_party_performance.csv` | Overall party performance metrics | Party dashboard comparison chart |
| `distribution_party_effectiveness_trends.csv` | Historical effectiveness trends (1990-2026) | Party dashboard line chart |
| `distribution_party_momentum.csv` | Current party momentum indicators | Party dashboard momentum chart |
| `distribution_coalition_alignment.csv` | Coalition collaboration patterns | Party dashboard network visualization |
| `distribution_annual_party_members.csv` | Annual party membership counts | Historical trend analysis |
| `distribution_gender_by_party.csv` | Gender distribution per party | Diversity analytics |
| `distribution_experience_by_party.csv` | Experience levels per party | Competency analysis |
| `distribution_behavioral_patterns_by_party.csv` | Behavioral analysis per party | Pattern recognition |
| `distribution_decision_patterns_by_party.csv` | Decision-making patterns per party | Legislative strategy analysis |

### Voting Data (7 files)
Voting patterns, ballot data, and document processing statistics.

| File | Description | Use Case |
|------|-------------|----------|
| `distribution_annual_party_votes.csv` | Annual voting records by party (2002-2026) | Voting trend analysis |
| `distribution_annual_ballots.csv` | Annual ballot counts | Legislative activity tracking |
| `distribution_decision_trends.csv` | Decision-making trend analysis | Governance patterns |
| `distribution_document_types.csv` | Distribution of document types | Document analytics |
| `distribution_annual_document_types.csv` | Annual document type trends | Document processing trends |
| `distribution_document_status.csv` | Document status distribution | Workflow analysis |
| `distribution_annual_document_status.csv` | Annual document status trends | Process efficiency |

### Committee Data (5 files)
Committee productivity, activity levels, and assignment patterns.

| File | Description | Use Case |
|------|-------------|----------|
| `distribution_committee_activity.csv` | Committee activity levels | Committee dashboard activity chart |
| `distribution_committee_productivity.csv` | Committee productivity metrics | Performance comparison |
| `distribution_committee_productivity_matrix.csv` | Productivity matrix analysis | Heat map visualization |
| `distribution_annual_committee_assignments.csv` | Annual committee assignments | Assignment trend analysis |
| `distribution_annual_committee_documents.csv` | Annual committee documents | Document output tracking |

### Ministry Data (4 files)
Government ministry effectiveness, productivity, and decision impact.

| File | Description | Use Case |
|------|-------------|----------|
| `distribution_ministry_effectiveness.csv` | Ministry effectiveness scores | Ministry dashboard comparison |
| `distribution_ministry_productivity_matrix.csv` | Ministry productivity matrix | Performance heat map |
| `distribution_ministry_decision_impact.csv` | Decision impact analysis | Policy effectiveness |
| `distribution_annual_ministry_assignments.csv` | Annual ministry assignments | Assignment history |

### Risk Data (3 files)
Risk assessment levels and crisis resilience metrics.

| File | Description | Use Case |
|------|-------------|----------|
| `distribution_ministry_risk_levels.csv` | Ministry risk level distribution | Risk dashboard overview |
| `distribution_ministry_risk_quarterly.csv` | Quarterly risk trends | Risk monitoring |
| `distribution_crisis_resilience.csv` | Crisis resilience indicators | Stability assessment |

### Politician Data (3 files)
Individual politician metrics and distribution patterns.

| File | Description | Use Case |
|------|-------------|----------|
| `distribution_experience_levels.csv` | Experience level distribution | Politician analytics |
| `distribution_assignment_roles.csv` | Role distribution patterns | Assignment analysis |
| `distribution_influence_buckets.csv` | Influence level distribution | Influence network analysis |

### Election Data (1 file)
Election region distribution and electoral data.

| File | Description | Use Case |
|------|-------------|----------|
| `distribution_election_regions.csv` | Election region distribution | Electoral geography |

### Anomaly Data (1 file)
Anomaly detection and pattern analysis.

| File | Description | Use Case |
|------|-------------|----------|
| `distribution_anomaly_by_party.csv` | Anomaly patterns by party | Outlier detection |

## 🔄 Updating Data

To refresh all CSV files from the CIA repository:

```bash
./cia-data/download-csv.sh
```

This script downloads the latest sample data from:
```
https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/
```

## 🎯 Dashboard Integration

### Party Performance Dashboard
Uses: `party/*.csv` files
- Location: `js/party-dashboard.js`
- Visualizations: Line charts, bar charts, network diagrams, doughnut charts

### Committee Dashboard
Uses: `committee/*.csv` files
- Location: `scripts/committees-dashboard.js`
- Visualizations: Activity charts, productivity matrices

### Ministry Dashboard
Uses: `ministry/*.csv` and `risk/*.csv` files
- Location: `js/ministry-dashboard.js`
- Visualizations: Effectiveness charts, risk heat maps

### Coalition Dashboard
Uses: `party/distribution_coalition_alignment.csv`, `voting/*.csv`
- Location: `scripts/coalition-dashboard.js`
- Visualizations: Force-directed graphs, decision trends

### Risk Assessment Dashboard
Uses: `risk/*.csv`, `anomaly/*.csv`
- Location: Integrated into main dashboards
- Visualizations: Risk level indicators, anomaly alerts

## 📈 Data Coverage

- **Time Range**: 1990-2026 (varies by dataset)
- **Annual Data**: 2002-2026 (voting records)
- **Parties**: 8 Swedish political parties (S, M, SD, C, V, KD, L, MP)
- **Committees**: All Riksdag committees
- **Ministries**: All government ministries
- **Politicians**: 349 Riksdag members

## 🔗 Data Source

**Repository**: [Hack23/cia](https://github.com/Hack23/cia)  
**Path**: `service.data.impl/sample-data/`  
**License**: Apache 2.0  
**Methodology**: [DATA_ANALYSIS_INTOP_OSINT.md](https://github.com/Hack23/cia/blob/master/service.data.impl/src/main/resources/DATA_ANALYSIS_INTOP_OSINT.md)

## 📝 Notes

- All CSV files use UTF-8 encoding
- Files are updated weekly in the CIA repository
- Sample data represents real patterns but may be anonymized
- For production use, consider integrating with live CIA API

## 🔒 Security

- Data is publicly available sample data
- No personal identifiable information (PII)
- All data follows GDPR compliance guidelines
- Suitable for public transparency platforms

---

**Last Updated**: 2026-02-09  
**Version**: 1.0  
**Maintained by**: Hack23 AB
