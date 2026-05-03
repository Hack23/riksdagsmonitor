<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">📋 Documentation Portfolio Audit — 2026-05-03</h1>

<p align="center">
  <strong>🔍 Drift inventory for the top-level architecture &amp; ISMS documentation portfolio</strong><br>
  <em>🧭 Evidence for ISMS continuous-improvement (Information_Security_Policy §5.5)</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/>
  <img src="https://img.shields.io/badge/Audit_Date-2026--05--03-success?style=for-the-badge" alt="Audit Date"/>
  <img src="https://img.shields.io/badge/Classification-🟢_Public-blue?style=for-the-badge" alt="Classification"/>
</p>

**📋 Document Owner:** CEO · **📅 Audit Date:** 2026-05-03 (UTC) · **🏢 Owner:** Hack23 AB (Org.nr 559534-7807) · **🏷️ Classification:** 🟢 Public · **🔗 Issue:** "Refresh architecture, workflows and ISMS-required documentation to reflect current state"

---

## 1. Purpose &amp; Scope

This audit is the **inventory pass** required by acceptance criterion #1 of the documentation-refresh issue. It enumerates every Hack23-ISMS–required Markdown deliverable at the repository root and captures each document's current header metadata (owner, version, last review date).

The audit classifies observed drift against the **current** state of the codebase, namely:

- **50 workflow files** = 22 standard `.yml` + 14 agentic `.md` + 14 compiled `.lock.yml`
- 8 MCP servers
- MCP Gateway **v0.3.1**
- gh-aw **v0.71.3**
- IMF-as-primary economic data canon
- 23-artifact analysis contract
- Chrome refactor and Reader Intelligence Guide pipeline

Each row is traced to the authoritative ISMS-PUBLIC policy that mandates the document. The matrix is the **single source of truth** for what was found, what was fixed in this PR, and what remains as a backlog item for follow-up issues.

---

## 2. Authoritative source-of-truth references

These files are treated as canonical for this audit; if a top-level document disagrees with any of them, the top-level document is in drift:

| Source of truth | Canonical for |
|---|---|
| [`.github/workflows/README.md`](../../.github/workflows/README.md) | Workflow inventory, schedules, safe-output patterns |
| [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) | gh-aw / MCP Gateway constraints, runtime config, AI-FIRST principle |
| [`.github/copilot-mcp.json`](../../.github/copilot-mcp.json) | MCP server configuration (8 servers) |
| [`.github/agents/README.md`](../../.github/agents/README.md), [`AGENTS.md`](../../AGENTS.md) | 24 custom Copilot agents |
| [`.github/skills/README.md`](../../.github/skills/README.md), [`SKILLS.md`](../../SKILLS.md) | 91 skills catalog |
| [`.github/prompts/README.md`](../../.github/prompts/README.md) | Workflow contract modules |
| [`Article-Generation.md`](../../Article-Generation.md) | Article generation pipeline |
| [`analysis/imf/README.md`](../imf/README.md), [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](../../.github/aw/ECONOMIC_DATA_CONTRACT.md) | Economic data contract v3.0 (IMF primary) |
| [Hack23 ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC) | Authority for every ISMS deliverable |

---

## 3. Documentation portfolio matrix

Legend for **Drift status**: 🟢 Aligned · 🟡 Minor (counts/dates only) · 🟠 Material (architectural facts stale) · 🔴 Major (structural rewrite needed) · ⚪ Out of audit scope.

Legend for **This PR**: ✅ Fixed in this PR · 🛠️ Partially fixed · 📋 Backlog (follow-up issue).

### 3.1 Current-state architecture &amp; ISMS docs

| # | Document | Owner | Ver | Last review | Drift status | This PR | ISMS-PUBLIC traceability |
|---|---|---|---|---|---|---|---|
| 1 | [`ARCHITECTURE.md`](../../ARCHITECTURE.md) | CEO | 2.2 → 2.3 | 2026-04-20 → 2026-05-03 | 🟠 `43 files / 11 agentic / 21 standard` stale; missing portfolio matrix | ✅ counts fixed, portfolio matrix added | [Information_Security_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) §3 (scope), [Secure_Development_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) §4 (architecture docs) |
| 2 | [`DATA_MODEL.md`](../../DATA_MODEL.md) | CEO | 1.2 | 2026-04-20 | 🟠 missing 23-artifact analysis-pipeline data model; needs Reader Intelligence Guide entity, JSON-LD `NewsArticle.isBasedOn` | 📋 backlog | [CLASSIFICATION](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) (data classification) |
| 3 | [`FLOWCHART.md`](../../FLOWCHART.md) | CEO | 1.2 | 2026-04-20 | 🟠 missing article-generation pipeline (Collection → Analysis → Gate → Aggregation → Render → Deploy) | 📋 backlog | [Secure_Development_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) §6 (process flows) |
| 4 | [`STATEDIAGRAM.md`](../../STATEDIAGRAM.md) | CEO | 1.1 | 2026-04-20 | 🟠 missing article-pipeline state machine; missing analysis-gate retry/abort transitions | 📋 backlog | [Change_Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md) §5 (workflow state) |
| 5 | [`MINDMAP.md`](../../MINDMAP.md) | CEO | 1.4 | 2026-05-03 | 🟡 `11 agentic news workflows` stale | ✅ count fixed, header bumped | [Information_Security_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) §5 (continuous improvement) |
| 6 | [`SWOT.md`](../../SWOT.md) | CEO | 1.3 | 2026-05-03 | 🟡 `11 agentic news workflows` stale | ✅ count fixed, header bumped | [Risk register](https://github.com/Hack23/ISMS-PUBLIC) (strategic posture) |
| 7 | [`THREAT_MODEL.md`](../../THREAT_MODEL.md) | CEO/CISO | 1.2 | 2026-04-20 | 🟠 needs full coverage of agentic-workflow attack surface (prompt injection, MCP-server compromise, gh-aw supply chain, egress-control bypass, secret exfil via safe outputs, MCP Gateway v0.3.1 schema constraint) | 📋 backlog | [Threat_Modeling](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md) |
| 8 | [`SECURITY_ARCHITECTURE.md`](../../SECURITY_ARCHITECTURE.md) | CEO/CISO | 2.2 → 2.3 | 2026-04-20 → 2026-05-03 | 🟡 `11 agentic` stale; five-layer model present but counts off | ✅ counts fixed | [Secure_Development_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) §10, [Cryptography_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Cryptography_Policy.md), [Access_Control_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Access_Control_Policy.md) |
| 9 | [`WORKFLOWS.md`](../../WORKFLOWS.md) | CEO | 7.3 | 2026-05-02 | 🟢 already refreshed for 50/22+14+14 split (v7.3); historical changelog references to v7.1 (`43 files`) retained intentionally as audit trail | 🟢 no change required | [Secure_Development_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) §10.1 |

### 3.2 Future-state architecture docs

| # | Document | Owner | Ver | Last review | Drift status | This PR | ISMS-PUBLIC traceability |
|---|---|---|---|---|---|---|---|
| 10 | [`FUTURE_ARCHITECTURE.md`](../../FUTURE_ARCHITECTURE.md) | CEO | 2.0 | 2026-02-24 | 🟠 roadmap items predate IMF / 14-agentic / MCP Gateway v0.3.1 changes | 📋 backlog | [Information_Security_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) §5.5 |
| 11 | [`FUTURE_DATA_MODEL.md`](../../FUTURE_DATA_MODEL.md) | CEO | 2.0 | 2026-02-24 | 🟡 needs cross-link to current 23-artifact contract | 📋 backlog | [CLASSIFICATION](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) |
| 12 | [`FUTURE_FLOWCHART.md`](../../FUTURE_FLOWCHART.md) | CEO | 2.0 | 2026-02-24 | 🟡 minor refresh | 📋 backlog | [Secure_Development_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) |
| 13 | [`FUTURE_STATEDIAGRAM.md`](../../FUTURE_STATEDIAGRAM.md) | CEO | 2.0 | 2026-02-24 | 🟡 minor refresh | 📋 backlog | [Change_Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md) |
| 14 | [`FUTURE_MINDMAP.md`](../../FUTURE_MINDMAP.md) | CEO | 2.0 | 2026-02-24 | 🟡 minor refresh | 📋 backlog | [Information_Security_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) §5.5 |
| 15 | [`FUTURE_SWOT.md`](../../FUTURE_SWOT.md) | CEO | 2.0 | 2026-02-24 | 🟡 minor refresh | 📋 backlog | [Information_Security_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) §5.5 |
| 16 | [`FUTURE_THREAT_MODEL.md`](../../FUTURE_THREAT_MODEL.md) | CEO/CISO | 1.0 | 2026-02-26 | 🟠 needs forward-looking agentic-workflow threat surface | 📋 backlog | [Threat_Modeling](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md) |
| 17 | [`FUTURE_SECURITY_ARCHITECTURE.md`](../../FUTURE_SECURITY_ARCHITECTURE.md) | CEO/CISO | 2.0 | 2026-02-24 | 🟡 minor refresh | 📋 backlog | [Secure_Development_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) |
| 18 | [`FUTURE_WORKFLOWS.md`](../../FUTURE_WORKFLOWS.md) | CEO | 6.0 | 2026-05-02 | 🟢 already current; one historical Q1 entry (`43 files / 11 agentic`) retained as roadmap baseline | 🟢 no change required | [Secure_Development_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) §10 |

### 3.3 Operational ISMS deliverables

| # | Document | Owner | Ver | Last review | Drift status | This PR | ISMS-PUBLIC traceability |
|---|---|---|---|---|---|---|---|
| 19 | [`BCPPlan.md`](../../BCPPlan.md) | CEO | 1.2 | 2026-04-20 | 🟡 next-review date refresh | 📋 backlog | [Incident_Response_Plan](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md) |
| 20 | [`CRA-ASSESSMENT.md`](../../CRA-ASSESSMENT.md) | CEO/CISO | 1.3 | 2026-04-20 | 🟡 needs gh-aw / MCP Gateway SBOM cross-link | 📋 backlog | [Open_Source_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Open_Source_Policy.md), [Vulnerability_Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md) |
| 21 | [`End-of-Life-Strategy.md`](../../End-of-Life-Strategy.md) | CEO | 1.4 | 2026-04-20 | 🟢 current | 🟢 no change required | [Information_Security_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) |
| 22 | [`FinancialSecurityPlan.md`](../../FinancialSecurityPlan.md) | CEO | 1.2 | 2026-04-20 | 🟢 current | 🟢 no change required | [Information_Security_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) |
| 23 | [`RELEASE_PROCESS.md`](../../RELEASE_PROCESS.md) | CEO | 1.0 | 2026-02-18 | 🟡 needs npm `provenance:true` / SLSA mention parity | 📋 backlog | [Change_Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md), [Secure_Development_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) §10 |
| 24 | [`TESTING.md`](../../TESTING.md) | CEO | 1.0 | (no effective date stamp) | 🟡 needs effective-date footer; verify Vitest 4.1.5 / Cypress 15.14.1 versions | 📋 backlog | [Secure_Development_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) §7 (testing) |
| 25 | [`TRANSLATION_GUIDE.md`](../../TRANSLATION_GUIDE.md) | CEO | 1.0 | 2026-02-10 | 🟡 14-language scope confirmed; verify BCP-47 `nb` migration text | 📋 backlog | [Information_Security_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) §3 |
| 26 | [`SECURITY.md`](../../SECURITY.md) | CEO/CISO | 1.0 | 2026-02-20 | 🟢 current (vulnerability disclosure procedure) | 🟢 no change required | [Vulnerability_Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md) |
| 27 | [`LABELS.md`](../../LABELS.md) | CEO | 1.0 → 1.1 | 2026-02-15 → 2026-05-03 | 🟠 claims **46 labels**; live label set has **159** including `agent:*`, `component:*`, `priority:*`, `agentic-workflows`, `news-*`, `lang:*`, horizon labels | ✅ count corrected, agentic categories added | [Information_Security_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) §3 |
| 28 | [`SKILLS.md`](../../SKILLS.md) | CEO | (auto) | 2026-04-22 | 🟢 current (91 skills) | 🟢 no change required | [Secure_Development_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) §4 |
| 29 | [`AGENTS.md`](../../AGENTS.md) | CEO | (auto) | n/a | 🟢 current (24 agents) | 🟢 no change required | [AI_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md) |
| 30 | [`Article-Generation.md`](../../Article-Generation.md) | CEO | (auto) | n/a | 🟢 current (23-artifact contract) | 🟢 no change required | [AI_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md) §4 |

### 3.4 Project README

| # | Document | Owner | Ver | Last review | Drift status | This PR | ISMS-PUBLIC traceability |
|---|---|---|---|---|---|---|---|
| 31 | [`README.md`](../../README.md) | CEO | (live) | n/a | 🟡 stale `43 files / 11 agentic` mentions in five distinct lines | ✅ counts fixed | [Information_Security_Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) §3 |

---

## 4. Drift summary &amp; remediation in this PR

### 4.1 What was fixed in this PR (✅)

1. **`ARCHITECTURE.md`** — `43 files / 11 agentic / 21 standard` updated to `50 files / 14 agentic / 22 standard`; **Documentation Portfolio Matrix** section added; version bumped 2.2 → 2.3 with 2026-05-03 stamp and changelog entry.
2. **`SECURITY_ARCHITECTURE.md`** — `11 agentic news workflows` updated to `14`.
3. **`MINDMAP.md`** — `11 agentic news workflows` updated to `14`.
4. **`SWOT.md`** — `11 agentic news workflows` updated to `14` (strengths section).
5. **`README.md`** — five stale count mentions updated to current values (14 agentic, 50 workflow files).
6. **`LABELS.md`** — count claim updated from `46` to `159`; agentic-workflow / agent / component / size / horizon label categories acknowledged; version bumped 1.0 → 1.1 with 2026-05-03 stamp.

### 4.2 What is intentionally left for follow-up issues (📋)

Wholesale rewrites of `THREAT_MODEL.md` (3,079 lines), `DATA_MODEL.md` (2,671 lines), `FLOWCHART.md`, `STATEDIAGRAM.md`, `BCPPlan.md`, `CRA-ASSESSMENT.md`, `End-of-Life-Strategy.md`, `FinancialSecurityPlan.md`, `RELEASE_PROCESS.md`, `TESTING.md`, `TRANSLATION_GUIDE.md`, and the eight `FUTURE_*` documents are **out of scope** for this single drift-reconciliation PR.

Each of those will be addressed by a dedicated follow-up issue that:

1. Adds the missing **agentic-workflow attack surface** to `THREAT_MODEL.md` (prompt injection, MCP-server compromise, gh-aw / MCP Gateway / npm supply chain, egress-control bypass via Squid/iptables misconfiguration, secret exfiltration via safe outputs).
2. Adds the **23-artifact analysis-pipeline data model** to `DATA_MODEL.md` (artifact catalogue, aggregation order, Reader Intelligence Guide entity, JSON-LD `NewsArticle.isBasedOn`).
3. Adds the **article-generation state machine** to `FLOWCHART.md` and `STATEDIAGRAM.md` (Collection → Analysis → Gate → Aggregation → Render → Deploy with retry/abort transitions on the analysis gate).
4. Adds a full **compliance cross-walk** (ISO 27001:2022 Annex A · NIST CSF 2.0 · CIS Controls v8.1 · GDPR · NIS2 · EU CRA) mapped to specific repo files/lines.
5. Refreshes the **future-state portfolio** to incorporate IMF, MCP Gateway v0.3.1, 14-agentic, and the chrome refactor.
6. Adds a **per-document "Last Reviewed" footer block** tied to ISMS continuous-improvement (each doc currently has the equivalent in its header badge block; a standardised footer is a separate change).

### 4.3 ISMS continuous-improvement evidence

This audit + the corrective changes in this PR satisfy the **continuous-improvement** clause of [Information_Security_Policy §5.5](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md): observed drift is documented, a remediation plan is stated, and the high-signal stale facts are corrected immediately while the remainder is queued as backlog. The audit file itself is the change record per [Change_Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md).

---

## 5. Verification commands used

```bash
ls .github/workflows/*.yml | wc -l                           # → 36 (= 22 standard + 14 lock files)
ls .github/workflows/*.lock.yml | wc -l                      # → 14 agentic (compiled)
ls .github/workflows/*.md | grep -v lock | wc -l             # → 15 (= 14 agentic sources + README.md)
gh label list --repo Hack23/riksdagsmonitor --limit 300 | wc -l   # → 159
grep -nE '11 agentic|43 files|21 standard' *.md              # → drift hits
```

---

**Maintained by:** Hack23 AB (Org.nr 559534-7807) · CEO &amp; CISO · **License:** Apache 2.0 · **Authority:** [Hack23 ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC)
