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
├── ministry/                    # Ministry dashboard data
│   ├── README.md
│   ├── download-ministry-data.sh
│   └── *.csv (15 CSV files, ~252KB)
└── seasonal/                    # Seasonal activity patterns data
    ├── README.md
    └── view_riksdagen_seasonal_activity_patterns_sample.csv
```

## Data Sources

All data is sourced from the CIA platform:
- **Repository**: https://github.com/Hack23/cia
- **Data Location**: `service.data.impl/sample-data/`
- **Base URL**: https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/

## Available Datasets

### 1. Ministry Data (`ministry/`)

Government minister risk & influence analytics:
- Ministry risk levels and distributions
- Productivity metrics over time
- Decision impact analysis
- Minister influence rankings

**Files**: 15 CSV files (~252KB, 1,880+ records)
**Coverage**: Current government + 5 years historical
**Documentation**: See `ministry/README.md`

### 2. Seasonal Activity Patterns (`seasonal/`)

Parliament activity patterns by season and time:
- Activity levels by month/quarter
- Document types by season
- Voting patterns over time
- Committee activity trends

**Files**: 1 CSV file
**Documentation**: See `seasonal/README.md`

## Data Updates

To update all datasets:

```bash
cd cia-data
./download-csv.sh
```

For ministry-specific data:

```bash
cd cia-data/ministry
./download-ministry-data.sh
```

## Dashboard Integration

Dashboards use local-first data loading with remote fallback:

1. **Primary**: Try local file from `cia-data/`
2. **Fallback**: Fetch from GitHub raw URL
3. **Cache**: 1-hour LocalStorage cache

## Compliance & Security

- **GDPR**: Only public data, no personal information
- **ISO 27001**: Data handling documented in `SECURITY_ARCHITECTURE.md`
- **NIST CSF**: Secure data transmission (HTTPS-only)
- **CIS Controls**: Data protection and integrity

## Related Documentation

- **Ministry Dashboard**: See the main dashboard implementation documentation in `js/ministry-dashboard.js`
- **Security**: `SECURITY_ARCHITECTURE.md`
- **Architecture**: `ARCHITECTURE.md`
