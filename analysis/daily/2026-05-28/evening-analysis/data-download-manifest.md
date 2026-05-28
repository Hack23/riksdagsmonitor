# Data Download Manifest — Evening Analysis 2026-05-28

<!-- artifact: data-download-manifest | family: D | pass: 1 -->

**Date**: 2026-05-28 | **Run ID**: 26595402071 | **Agent**: claude-sonnet-4.6

## Data Sources Summary

| Source | Status | Documents | Method |
|--------|--------|-----------|--------|
| riksdag-regering-mcp | ✅ Live | voteringar (AU10/Mar-2026), anföranden (Frågestund) | MCP health check 2026-05-28T19:00Z |
| propositions sibling analysis | ✅ Complete | HD03270, HD03271 (2026-05-26) | Sibling folder synthesis |
| committee-reports sibling | ✅ Complete | HD01FöU15, HD01JuU38, HD01KrU9, HD01SfU25, HD01SfU34 (2026-05-27) | Sibling folder synthesis |
| motions sibling | ✅ Complete | HD024185-HD024192 | Sibling folder synthesis |
| interpellations sibling | ✅ Complete | HD10511-HD10520+ (20 interpellations) | Sibling folder synthesis |
| monthly-review sibling | ✅ Complete | HD03275, HD03276, HD01NU20 | Sibling folder synthesis |
| IMF WEO-2026-04 | ✅ OK | WEO, FM dataflows | data/imf-context.json (Datamapper, age 1 month) |
| Prior PIRs | ✅ Complete | 8 open PIRs carried forward | analysis/daily/2026-05-27/evening-analysis/pir-status.json |

## MCP Health Gate
- **riksdag-regering**: ✅ Live — sources: data.riksdagen.se, g0v.se
- **IMF Datamapper**: ✅ OK — WEO-2026-04, vintage age 1 month (not stale)
- **IMF SDMX**: ⚠ Not tested (key forwarded via awf --env-all)

## Data Limitations

1. **HD01UU18**: Metadata-only in committee-reports sibling — no text content
2. **Anföranden text**: Empty anforandetext for today's Frågestund (Riksdag API limitation)
3. **2026-05-28 voting records**: Not yet published by Riksdag API (committee votes 2026-05-27 not yet in API)
4. **Polling data**: No new polling data available; using IMF unemployment as proxy

## Artifact Count

- **Total artifacts created (Pass 1)**: 23 (all required always-on artifacts)
- **Family A Core Synthesis**: 9/9 ✅
- **Family B Structural Metadata**: 2/2 ✅
- **Family C Strategic Extensions**: 5/5 ✅
- **Family D Electoral & Domain Lenses**: 7/7 ✅
- **Family E per-document**: 0 (Tier-C aggregation workflow — per-document analysis in sibling folders)

*Scaffold marker written before MCP calls — resilience guarantee maintained.* — scaffold

**Workflow**: News Evening Analysis
**Run**: 26595402071 attempt 1
**Started (UTC)**: 2026-05-28T18:58:58Z
**Requested date**: 2026-05-28
**Subfolder**: evening-analysis
**Improvement mode**: false
**Status**: scaffold — populated as the pipeline progresses.

> This file is written before any MCP call so even a fully-failed run
> produces a non-empty diff and a partial PR rather than a silent no-op.

## MCP attempts
_(populated by 02-mcp-access.md §Three-attempt connect protocol)_

## Per-document table
_(populated by `scripts/download-parliamentary-data` via `writeManifest()`)_
