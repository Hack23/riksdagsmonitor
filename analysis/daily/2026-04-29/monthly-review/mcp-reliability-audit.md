# MCP Reliability Audit — Monthly Review 2026-04-29

| MCP Server | Status | Calls Made | Success Rate | Notes |
|-----------|--------|------------|-------------|-------|
| riksdag-regering | ✅ LIVE | ~15 | 100% | All data calls successful |
| IMF SDMX | ❌ UNAVAILABLE | 1 (compare) | 0% | Returned null; used WEO Apr-2026 cache |
| SCB | ✅ N/A | 0 | — | Not required for monthly-review |
| World Bank | ✅ N/A | 0 | — | Not required (governance residue only) |
| GitHub | ✅ LIVE | File ops | 100% | All file operations successful |

**IMF Fallback**: Used WEO Apr-2026 pre-warm data with `<full-text-fallback:imf-weo-apr-2026-cached>` annotation. All economic claims flagged with B2 confidence and vintage annotation per contract.

**Availability**: riksdag-regering MCP reported `status: live, generated_at: 2026-04-29T07:33:40.529Z`
