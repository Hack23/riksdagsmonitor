# CIA Schema Integration Documentation

> **Integration with CIA Platform JSON Schemas for Validation Framework**

## 📋 Overview

This document describes the integration between Riksdagsmonitor and the CIA (Citizen Intelligence Agency) platform's JSON schemas. The CIA platform is the authoritative source for all data schemas, and Riksdagsmonitor consumes these schemas for validation, type safety, and data integrity.

**Key Principle**: **CIA = Schema Authority | Riksdagsmonitor = Schema Consumer**

## 🎯 Purpose

The CIA schema integration provides:

1. **Data Validation** - Automated validation of CIA exports against authoritative schemas
2. **Type Safety** - Generated TypeScript types for development (optional)
3. **Schema Versioning** - Track schema versions and detect updates
4. **CI/CD Integration** - Automated validation in continuous integration
5. **Quality Assurance** - Ensure data integrity across all CIA products

## 📊 CIA Data Products

The CIA platform provides 19 data visualization products, each with a corresponding JSON schema:

### Intelligence Dashboards
- **overview-dashboard** - Complete Riksdag intelligence snapshot
- **party-performance** - Longitudinal party analysis and effectiveness
- **cabinet-scorecard** - Ministry-level performance metrics
- **election-analysis** - Historical election patterns and trends

### Top 10 Rankings
- **top10-influential-mps** - Network influence analysis
- **top10-productive-mps** - Legislative output rankings
- **top10-controversial-mps** - Voting pattern analysis
- **top10-absent-mps** - Attendance tracking
- **top10-rebels** - Cross-party voting behavior
- **top10-coalition-brokers** - Collaboration patterns
- **top10-rising-stars** - Emerging political figures
- **top10-electoral-risk** - MPs at electoral risk
- **top10-ethics-concerns** - Transparency issues
- **top10-media-presence** - Public visibility metrics

### Advanced Analytics
- **committee-network** - Committee influence and assignments
- **politician-career** - Career trajectory analysis
- **party-longitudinal** - 50+ years of party evolution
- **riksdag-overview** - Parliamentary system overview
- **ministry-performance** - Government ministry analysis

## 🔧 Scripts

### 1. Schema Synchronization

```bash
npm run sync-schemas
```

Fetches all 19 CIA schemas from upstream CIA repository.

### 2. Data Validation

```bash
npm run validate-data
```

Validates CIA data exports against their respective schemas.

### 3. Update Detection

```bash
npm run check-updates
```

Checks for CIA schema updates in upstream repository.

### 4. Type Generation (Optional)

```bash
npm run generate-types
```

Generates TypeScript type definitions from schemas.

## 🔄 CI/CD Workflows

### 1. Validate CIA Data
- **Trigger**: Push to data/schemas, daily schedule, manual
- **Purpose**: Validates all CIA exports against schemas

### 2. Check CIA Schema Updates
- **Trigger**: Weekly (Monday 6 AM UTC), manual
- **Purpose**: Detects schema updates and creates PR

### 3. Sync CIA Schemas
- **Trigger**: Manual dispatch, script changes
- **Purpose**: Manual schema synchronization

## 📚 References

- **CIA Repository**: https://github.com/Hack23/cia
- **JSON Schemas**: https://github.com/Hack23/cia/tree/master/json-export-specs/schemas
- **ISMS Policy**: https://github.com/Hack23/ISMS-PUBLIC

---

**Maintained by**: Hack23 AB  
**Last Updated**: 2026-02-05
