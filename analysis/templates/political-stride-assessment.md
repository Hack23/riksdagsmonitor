<!-- SPDX-FileCopyrightText: 2024-2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Political STRIDE Assessment — {{ARTICLE_TYPE}} · {{ARTICLE_DATE}}

> **Analytical supplementary (optional).** STRIDE adapted to **political, electoral and institutional** threat surfaces. Produce for election-adjacent events, integrity incidents, disinformation spikes, critical-infrastructure votes, or any scoped entity where the adversary model matters. Pairs with `threat-analysis.md` (kill chain / MITRE mapping) and `risk-assessment.md` (Institutional + Corruption dimensions).
>
> **Methodology** → [`analysis/methodologies/analytical-supplementary-methodology.md § STRIDE-political`](../methodologies/analytical-supplementary-methodology.md#stride-political).
> **Not counted in the 23 core artifacts.** Non-blocking in `05-analysis-gate.md`.

## 🔄 Tradecraft Context

- **Artifact class** — Analytical supplementary (optional, never blocking)
- **Use when** — Election-adjacent events, integrity incidents, disinformation spikes, critical-infrastructure votes, or any scoped entity where the adversary model matters
- **Pairs with** — `threat-analysis.md` (kill chain / MITRE mapping), `risk-assessment.md` (Institutional + Corruption dimensions)
- **Methodology** — [`analytical-supplementary-methodology.md § STRIDE-political`](../methodologies/analytical-supplementary-methodology.md#stride-political)
- **Workflow status** — Not counted in the 23 core artifacts; non-blocking in [`05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md)

## 📋 Scope declaration

- **Entity under assessment** — [party / coalition / Riksdag committee / government agency / electoral system component]
- **Trust boundary** — [define: voter ↔ ballot, MP ↔ vote-casting system, minister ↔ decision record, citizen ↔ FOI channel]
- **Time horizon** — [pre-election / governing cycle / post-event]
- **Adversary model** — [nation-state / domestic actor / insider / organised crime / bad-faith opposition]

---

## 🎭 STRIDE × Political dimensions

### S — Spoofing of political identity

| Vector | Target | Likelihood (1–5) | Impact (1–5) | Mitigation (existing) | Residual risk | Evidence |
|--------|--------|------------------|--------------|----------------------|--------------|----------|
| Impersonation of MP on social media | | | | platform-integrity | | |
| Fake press release (domain clone) | | | | HSTS + brand policing | | |
| AI-generated voice of party leader | | | | detection + rapid rebuttal | | |
| Ghost-candidate registration | | | | Valmyndigheten controls | | |

### T — Tampering with political evidence / process

| Vector | Target | Likelihood | Impact | Mitigation | Residual | Evidence |
|--------|--------|-----------|--------|-----------|---------|----------|
| Altering Riksdag vote record | voteringar API | | | RA + audit log | | |
| Editing betänkande draft | committee staff | | | version control | | |
| Ballot tampering | valdag | | | manual paper-trail | | |
| Voter-roll modification | Skatteverket | | | PuL + audit | | |

### R — Repudiation of political decision

| Vector | Example | Likelihood | Impact | Mitigation | Residual | Evidence |
|--------|---------|-----------|--------|-----------|---------|----------|
| MP denies registered vote | | | | protokoll H-nummer | | |
| Minister denies written pledge | | | | protokoll + digital dok | | |
| Party denies campaign commitment | | | | manifesto archive | | |
| Agency denies FOI response | | | | offentlighetsprincipen | | |

### I — Information disclosure (political secrecy violations)

| Vector | Data class | Likelihood | Impact | Mitigation | Residual | Evidence |
|--------|-----------|-----------|--------|-----------|---------|----------|
| Leaked draft legislation | | | | sekretess-klass | | |
| Unauthorised committee minutes | | | | KU granskning | | |
| Campaign donor list leak | | | | transparency register | | |
| Intelligence briefing exposure | | | | MUST / Säpo controls | | |

### D — Denial of democratic function

| Vector | Target | Likelihood | Impact | Mitigation | Residual | Evidence |
|--------|--------|-----------|--------|-----------|---------|----------|
| DDoS on voting-day infra | val.se | | | CDN + MSB | | |
| Filibuster beyond norm | kammaren | | | talmannen | | |
| Parliamentary paralysis (no-confidence loop) | | | | Regeringsformen 6:5 | | |
| Disinfo saturation crowd-out | media space | | | fact-check orgs | | |

### E — Elevation of political privilege

| Vector | Example | Likelihood | Impact | Mitigation | Residual | Evidence |
|--------|---------|-----------|--------|-----------|---------|----------|
| Proxy-voting abuse | kammaren | | | närvaro-kontroll | | |
| Committee-chair unilateral action | utskott | | | reglemente | | |
| Minister bypassing remiss | regeringen | | | lagrådet | | |
| Capture of regulator (myndighets-styrning) | myndighet | | | instruktion + JO | | |

---

## 🌀 Attack trees (≥ 2)

```mermaid
%%{init: {'theme':'dark'}}%%
graph TD
  Goal[Goal: e.g. Discredit party X before election]
  Goal --> S1[Spoof] --> S1a[Deepfake leader]
  Goal --> T1[Tamper] --> T1a[Edit Wikipedia]
  Goal --> I1[Info-disclose] --> I1a[Leak internal memo]
  style Goal fill:#ff006e,color:#fff
  style S1 fill:#00d9ff,color:#000
  style T1 fill:#ffbe0b,color:#000
  style I1 fill:#00d9ff,color:#000
```

## 🔗 MITRE ATT&CK style TTP mapping (political adaptation)

| Tactic | Technique (political adaptation) | Observed / assessed | Cross-link |
|--------|----------------------------------|--------------------|------------|
| Reconnaissance | OSINT profiling of MPs | | threat-analysis.md |
| Resource development | Domain typosquat | | |
| Initial access | Social-engineering staffer | | |
| Execution | Publish fabricated document | | |
| Persistence | Infiltrate party youth wing | | |
| Defence evasion | Cut-out accounts | | |
| Collection | Scrape Riksdag email leak | | |
| Exfiltration | Dark-web posting | | |
| Impact | Drop vote share / coalition collapse | | |

## 🎯 PIR feedback

| PIR | Covered dimension(s) | Gap | Action |
|-----|--------------------|-----|--------|
| PIR-1 | | | |

## 🛡 Recommended controls (mapped to Hack23 ISMS + NIST CSF 2.0)

| Control | Dimension(s) | Framework map | Owner | Priority |
|---------|--------------|---------------|-------|----------|
| | | ISO 27001:A.5.x · NIST PR.AC | | |

---

## 🔗 Cross-links

- [`threat-analysis.md`](threat-analysis.md) — deeper kill-chain + MITRE canonical mapping
- [`risk-assessment.md`](risk-assessment.md) — Institutional + Corruption dimensions
- [`stakeholder-impact.md`](stakeholder-impact.md) — adversary / defender actor mapping
- [`scenario-analysis.md`](scenario-analysis.md) — worst-case threat realisation path

---

**Template version:** v1.2 · **Last updated:** 2026-04-25

---

## ✅ Pass-2 Self-Audit Checklist (v4.4 — required)

> **Purpose:** AI-FIRST principle requires a Pass-2 read-back-and-improve. After producing this artifact in Pass 1, re-read it end-to-end and verify each item below. Document any remediation in [`methodology-reflection.md`](methodology-reflection.md) §"Pass-2 audit log". Any unchecked ❌ box at the end of Pass 2 forces a Pass-3 rewrite of the affected section.

- [ ] **Tradecraft anchors honoured** — F3EAD stage matches the artifact's role; PIRs declared in the §Tradecraft Context block are actually addressed in the body; Admiralty grades attached to every external source; WEP band + ODNI confidence on every probabilistic judgement.
- [ ] **Source diversity floor met** — at least the minimum number of independent MCP sources required by the artifact's tradecraft block are cited; single-source claims are explicitly labelled `[SINGLE-SOURCE — corroboration pending]`.
- [ ] **Evidence specificity** — every quantified claim cites a `dok_id` (Riksdag), an SCB / IMF dataflow code, or a named external source with date; no "according to data" / "studies show" hand-waves.
- [ ] **Named-actor discipline** — every political claim names ≥ 1 person (party + role + dated act/quote) or labels the absence (`[diffuse — no named actor]`).
- [ ] **Counter-narrative present** — at least one explicit competing hypothesis, dissent quote, or framed objection appears in the body; "no opposition recorded" is itself a finding to label, not silence.
- [ ] **Election 2026 lens applied** — the §"Election 2026 Implications" subsection (or equivalent) addresses electoral salience, coalition pressure, and forward indicators; not boilerplate.
- [ ] **No illustrative content shipped as fact** — every `[REQUIRED]` placeholder is filled OR removed; every `Example:` block is clearly fenced or removed; no fabricated `dok_id`, vote count, or quote leaks into the final artifact.
- [ ] **Cross-references resolve** — every `[link](file.md)` in this artifact points to a file that exists in the run folder (`analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`) or to a methodology / template under `analysis/`.
- [ ] **Mermaid renders** — every fenced ` ```mermaid ` block parses (no missing class definitions, no orphan nodes, no >40-node graphs that overflow viewport on mobile).
- [ ] **Line-floor check** — artifact length ≥ the per-artifact floor in [`reference-quality-thresholds.json`](../methodologies/reference-quality-thresholds.json); shorter artifacts trigger Pass-2 rewrite, never a `[truncated]` note.

