---
title: "Forward Indicators — Week 20 Outlook"
date: "2026-05-08"
---

# Forward Indicators

## Indicator Framework

Forward indicators (FI) are observable events that signal which scenario trajectory is active. Monitor these by stated date/trigger.

## Priority Forward Indicators

### FI-001: FöU18 Vote Count
**Observable**: Riksdag voting register (voteringsresultat) for FöU18, expected week of May 11-15
**Threshold**: 
- Ja > 190: Strong mandate signal; government entering summer on security strength
- Ja 175-190: Bare majority; moderate narrative damage from close vote
- Ja < 175: Upset (almost impossible with current coalition math — but would be historic)
**Implication**: Vote count determines opposition's ability to claim "near-miss mandate" in media. [B2]

### FI-002: Flotilla Status Update (Monday May 11, morning)
**Observable**: MFA Twitter/press releases; AFP/Reuters on Global Sumud boarding outcome
**Threshold**:
- No Swedish casualties + vessel released: Scenario A confirmed (routine week)
- Swedish citizens detained: Scenario B activating (crisis)
- Swedish citizens injured: Emergency protocol; full crisis scenario
**Implication**: This single observable determines whether week 20 is "security legislation week" or "flotilla crisis week." [B2]

### FI-003: L/C Monday Party Group Statements on FöU18
**Observable**: Partigruppsmöte outcomes Monday May 11; party press releases by noon
**Threshold**:
- L/C: "We will vote Ja with reservations" → Scenario A
- L/C: "We will table sunset clause amendment" → Scenario D (delay risk)
- L/C: "We cannot support without Lagrådet" → Major surprise; Scenario D escalation
**Implication**: Determines whether government faces embarrassing amendment votes. [B3]

### FI-004: IMY Statement on HD03261
**Observable**: IMY press releases during week 20
**Threshold**:
- No statement: Neutral — normal process
- Statement with concern: Elevates opposition narrative; gives DN editorial ammunition
**Implication**: Data protection watchdog legitimises or deflects the "surveillance state" frame. [C2]

### FI-005: Lagrådet Website (week of May 18)
**Observable**: lagradet.se new yttranden section
**Threshold**:
- Any new yttrande for HD03267/HD03261/HD03250: Extremely fast (unusual); monitor content
- No yttranden by May 15: Expected/normal; confirms timeline as June-July
**Implication**: Confirms or modifies constitutional risk assessment. [B3]

### FI-006: IMF API Status Recovery
**Observable**: data/imf-context.json status field; test via `npx tsx scripts/imf-fetch.ts weo --country SWE`
**Threshold**:
- Status returns to "live": Can supplement analysis with monthly IFS data
- Status remains "degraded": Continue WEO/FM-only citations
**Implication**: Economic context precision for subsequent week-ahead and month-ahead analyses. [A1]

## Weekly Surveillance Checklist

For the next analysis cycle (week-ahead 2026-05-15):

- [ ] FöU18 vote count recorded
- [ ] UbU28 vote count recorded
- [ ] Flotilla diplomatic outcome confirmed
- [ ] Any new Lagrådet yttranden for HD03267/HD03261/HD03250
- [ ] New propositions from Tidö government (expected: migration batch part II)
- [ ] EU Council outcome (Education, May 11-12) for Swedish positioning confirmation
- [ ] EU-nämnden meeting outcome (May 13)
- [ ] IMF SDMX API status check
