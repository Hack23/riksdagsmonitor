# Risk Assessment — Realtime Monitor 2026-06-13

## Risk Register

This risk register analyzes the policy, operational, institutional, and human rights risks associated with the comprehensive state hardening package cleared during the extraordinary Saturday session.

| Risk ID | Risk Category | Risk Description | Probability | Impact | Mitigation Strategy |
|---|---|---|:---:|:---:|---|
| **R-PRISON-01** | Operational | Severe prison system overcrowding and collapse due to sentencing surge from `HD01JuU42` paired with pre-existing staff shortages and abuse (`HD10557`). | **HIGH** | **CRITICAL** | Emergency funding for prison construction; temporary modular facilities; salary increases for Kriminalvården staff; phasing implementation of the joint-sentencing cap removal. |
| **R-VANDEL-01** | Legal / HR | Arbitrary deportation decisions and international human rights challenges targeting the conduct-based "vandel" criteria of `HD01SfU36`. | **HIGH** | **HIGH** | Establish a clear, legally-binding administrative handbook defining "bristande vandel" to prevent subjective or arbitrary decisions by case officers. |
| **R-DEF-01** | Institutional | "Defensive bureaucracy" and paralysis among civil servants fearing criminal prosecution under the expanded "abuse of public office" offense (`HD01JuU40`). | **MEDIUM** | **HIGH** | Provide comprehensive training and legal support for public servants; clearly demarcate criminal "abuse of office" from honest administrative errors. |
| **R-TRANS-01** | Operational | Transition and permitting delays during the centralizing shift of environmental permitting from 21 regional boards to the new national agency (`HD01MJU24`). | **MEDIUM** | **MEDIUM** | Phase the transition over 12 months; allow regional boards to process existing backlogs while the national agency assumes new applications. |
| **R-SURV-01** | Technical | Technical failure or evasion of electronic monitoring and tagging devices deployed for migrant tracking under `HD01SfU31`. | **MEDIUM** | **MEDIUM** | Partner with proven enterprise surveillance vendors; implement real-time tracking audits and rapid-response police teams for signal losses. |
| **R-WELFARE-01** | Social | Rise in recidivism or homelessness due to stripping social security benefits and charging upkeep fees for community-monitored prisoners (`HD01SfU29`). | **MEDIUM** | **MEDIUM** | Implement localized social-work integration programs; provide transitional housing support during electronic monitoring. |

---

## Detailed Risk Analyses

### 1. Prison Capacity Crisis (R-PRISON-01)
* **Underlying Documents**: `HD01JuU42` (Sentencing Surge) and `HD10557` (Kriminalvården Strain)
* **Analysis**: `HD01JuU42` introduces double sentences for gang crimes and removes the 10-year joint-sentencing cap. This will lead to a rapid, exponential rise in the inmate population. However, `HD10557` reveals that Kriminalvården is already struggling with severe staff shortages, overcrowding, and systemic safety failures. Pushing thousands of long-term inmates into an already broken system without an immediate, massive expansion of physical prison capacity will lead to an operational breakdown, characterized by a spike in prison violence, safety failures, and a collapse in rehabilitation programs.

### 2. The Arbitrary Migration Gate (R-VANDEL-01)
* **Underlying Documents**: `HD01SfU36` (Conduct-Based Deportations)
* **Analysis**: Shifting the deportation threshold from objective criminal convictions to conduct-based "bristande vandel" evaluation is a highly-coercive tool. Criteria such as "earning a living dishonestly" or "having significant debts" are subject to broad administrative interpretation. If Migrationsverket officers apply these standards inconsistently, Sweden will face a wave of domestic court challenges, European Court of Human Rights (ECHR) appeals, and accusations of institutional discrimination.

### 3. Public Service Paralysis (R-DEF-01)
* **Underlying Documents**: `HD01JuU40` (Civil Service Liability)
* **Analysis**: While raising the minimum sentence for gross misconduct and criminalizing "abuse of public office" is designed to combat internal corruption, it introduces a massive risk of risk-aversion among public servants. Fearing that complex decisions might be interpreted as "improperly disadvantaging another" under the vague terms of `JuU40`, bureaucrats are likely to delay key permits, refuse to make decisions, or default to defensive, excessively slow processes, directly undermining the "execution and capacity" goal of the state.

```mermaid
flowchart TD
  R1[\"R-PRISON-01<br/>Prison Overcrowding\"] --> C1{\"Risk Landscape\"}
  R2[\"R-VANDEL-01<br/>Arbitrary Deportations\"] --> C1
  R3[\"R-DEF-01<br/>Defensive Bureaucracy\"] --> C1
  R4[\"R-WELFARE-01<br/>Welfare Deprivation\"] --> C1
  C1 --> OUT[\"Implementation Frictions\"]
  style C1 fill:#ff006e,stroke:#0a0e27,color:#ffffff,stroke-width:2px
```
