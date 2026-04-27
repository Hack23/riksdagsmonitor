# MCP Reliability Audit — Monthly Review 2026-04-27

**Tier-C Supplementary**

## MCP Server Performance

| Server | Status | Operations | Errors | Notes |
|--------|--------|------------|--------|-------|
| riksdag-regering | LIVE | sync_status, document reads | 0 | Last sync: 2026-04-27T16:28:43Z |
| scb | AVAILABLE | Not called this cycle | N/A | Available for Swedish statistics |
| world-bank | AVAILABLE | Not called this cycle | N/A | Available; IMF is primary for economic |

## IMF Connectivity
- `data/imf-context.json` pre-warm: SUCCESSFUL
- Indicators available: WEO, FM, IFS, BOP, DOTS, GFS_COFOG
- Sweden GDP +2.1% (WEO Apr-2026): CONFIRMED

## Full-Text Fetch Outcomes
- HD03253: synthesis-summary [SUCCESS]
- HD01FiU48: synthesis-summary [SUCCESS]  
- HD10448: interpellation text via MCP [SUCCESS]
- HD01JuU31: committeeReport text [SUCCESS]

## Full-Text Fetch Outcomes (for analysis gate check-10)
- **Successful fetches**: 4 (HD03253, HD01FiU48, HD10448, HD01JuU31)
- **Fallback annotations**: 0
