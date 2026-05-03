# MCP Reliability Audit — Monthly Review 2026-05-03

| MCP Server | Status | Tools used | Success rate |
|------------|--------|-----------|-------------|
| riksdag-regering | ✅ LIVE | get_sync_status, search_dokument, get_dokument, get_dokument_innehall | ~95% (minor text truncation) |
| scb | ⚠️ NOT TESTED | — | N/A |
| world-bank | ⚠️ NOT TESTED | — | N/A |
| IMF scripts (tsx) | ❌ FAILED | imf-fetch.ts (all calls) | 0% (API unreachable) |

## riksdag-regering Detail

- **get_sync_status**: SUCCESS — returned `{"status":"live"}` at session start
- **search_dokument**: SUCCESS for all 21 documents
- **get_dokument**: SUCCESS for HD03262, HD03254, HD03258 metadata
- **get_dokument_innehall**: SUCCESS for HD03262, HD03254, HD03258 full text (saved to /tmp/)
- **Failure mode observed**: HD03262 full text truncated in MCP response; workaround: fetched in chunks
- **Metadata-only fallback**: 18 documents retrieved as metadata-only (full text not retrieved)

## IMF API Failure Analysis

All calls to `scripts/imf-fetch.ts` failed with "fetch failed" error. Likely causes:
1. www.imf.org or sdmxcentral.imf.org not in firewall allowlist for this run
2. Network timeout during initial connection
3. IMF API endpoint changes

**Remediation for June review**: Verify IMF domains are in workflow network allowlist; add explicit pre-flight IMF health check.
