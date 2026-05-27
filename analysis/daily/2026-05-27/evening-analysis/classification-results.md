# Classification Results — Evening Analysis 2026-05-27

**Date**: 2026-05-27 | **Workflow**: news-evening-analysis | **Pass**: 1

## ARCA Classification Framework

Each document classified across four axes:
- **Policy Domain** (primary / secondary)
- **Legislative Stage**
- **Urgency Class**
- **Partisan Salience**

## Classification Table

| dok_id | primary domain | secondary domain | stage | urgency | partisan salience |
|--------|---------------|-----------------|-------|---------|-------------------|
| HD01FöU15 | National Security / Cybersecurity | Defence, EU Affairs | Betänkande → vote | CRITICAL | MEDIUM (cross-party on security) |
| HD01JuU38 | Criminal Justice | Social Policy | Betänkande → vote | HIGH | HIGH (crime = election issue) |
| HD01UU18 | Defence / Arms Control | Foreign Affairs, Trade | Betänkande → vote | HIGH | HIGH (Ukraine/NATO context) |
| HD01SfU34 | Migration | Human Rights, Justice | Betänkande → vote | HIGH | HIGH (asylum policy contested) |
| HD01SfU25 | Pension / Social Insurance | Economics | Betänkande → vote | MEDIUM | LOW (automatic mechanism) |
| HD01KrU9 | Cultural Policy / Built Environment | Urban Planning, Housing | Betänkande → vote | MEDIUM | LOW (cross-party consensus) |
| HD10516 | Healthcare / Elder Care | Local Government Finance | Interpellation | MEDIUM | MEDIUM |
| HD10517 | Healthcare / Dental Care | Youth Policy | Interpellation | MEDIUM | MEDIUM |
| HD10518 | Healthcare / Primary Care | Market Regulation (LOV) | Interpellation | MEDIUM | MEDIUM |
| HD10519 | Labour Market / Regional | Unemployment | Interpellation | MEDIUM | LOW |
| HD11840 | Rule of Law / Legal Remediation | Forensics, Criminal Procedure | Skriftlig fråga | MEDIUM | LOW |
| HD11841 | LGBTQ+ Rights / Education | Social Policy | Skriftlig fråga | MEDIUM | HIGH (SD/KD diverge) |
| HD11842 | Road Safety / Criminal Justice | Traffic | Skriftlig fråga | LOW | LOW |
| HD11843 | Social Cohesion / Youth | Education | Skriftlig fråga | LOW | LOW |
| HD11844 | Gender Norms / Social Policy | Education, Youth | Skriftlig fråga | LOW | LOW |
| HD11845 | Criminal Justice / Gang Crime | Organised Crime | Skriftlig fråga | MEDIUM | HIGH |

## Policy Domain Frequency

| domain | count | share |
|--------|------:|------:|
| National Security / Defence | 2 | 12.5% |
| Criminal Justice | 3 | 18.8% |
| Healthcare | 3 | 18.8% |
| Social Policy / Welfare | 3 | 18.8% |
| Foreign Affairs / Arms | 1 | 6.3% |
| Education / Youth | 2 | 12.5% |
| Other (Architecture, Labour) | 2 | 12.5% |

## Security and Rights Flags

| flag | documents |
|------|-----------|
| 🔐 National Security | HD01FöU15, HD01UU18 |
| ⚖️ Fundamental Rights | HD01SfU34, HD11841 |
| 💰 Macro-economic | HD01SfU25 |
| 🌍 EU/NATO alignment | HD01FöU15, HD01UU18 |
| 🏛️ Rule of Law | HD11840, HD01JuU38 |
