---
title: "MCP Reliability Audit"
date: 2026-05-13
language: en
subfolder: election-cycle/current
classification: PUBLIC
workflow: news-election-cycle
---

# MCP Reliability Audit

## Servers used
- **riksdag-regering** (HTTPS, https://riksdag-regering-ai.onrender.com/mcp): primary document fetch (6 documents) — OK
- **scb** (container): not invoked this run
- **world-bank** (container): not invoked this run (IMF preferred per contract)
- **github** (toolset all): used for safeoutputs PR creation — OK

## Reliability metrics
- riksdag-regering: 6/6 document fetches OK; latency ~1-3s/doc
- IMF context (cached file): WEO Apr-2026, age 1 month, ok
- IMF SDMX subscription key: not invoked this run
- safeoutputs server: healthy

## Failures or degradations
- None observed during artifact-generation phase

## Recommendations for next run
- Pre-warm IMF SDMX path for inflation/labour data if available
- Cache MCP responses for 24h reuse window
