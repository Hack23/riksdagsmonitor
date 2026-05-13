# Threat Analysis — Opposition Motions 2026-05-13

**Author**: James Pether Sörling  
**Date**: 2026-05-13  

---

## Political Threat Taxonomy

### Threat Type 1: Legitimacy Attack

**Actor**: Socialdemokraterna (S) — Jennie Nilsson, Hans Ekström, et al.  
**Target**: Tidö coalition (M/KD/SD/L) + specifically the government proposition process for prop. 258  
**Method**: Parliamentary motion explicitly characterising legislation as "ämnat att försvaga det största oppositionspartiets finansiering"  
**Vector**: Constitutional framing (RF ch. 2:1) + electoral mobilisation narrative  
**TTP Pattern**: Narrative-first attack — establishing a parliamentary record that converts policy disagreement into legitimacy challenge before the election.  

*Kill chain*: HD024151 filed → mainstream media amplification → Lagrådet advisory → public debate → election campaign issue

### Threat Type 2: Procedural Resistance

**Actor**: Vänsterpartiet (V) — Tony Haddou et al.  
**Target**: Migration propositions 263 + 264  
**Method**: Dual simultaneous committee motion rejection; ECHR Art. 8 proportionality argument  
**Vector**: SfU committee process  
**TTP Pattern**: Procedural delay + rights-framing — not a legislative victory but a record-building exercise for election messaging on migration and human rights.

### Threat Type 3: Cross-Bloc Coalition Building

**Actors**: MP + C + V  
**Target**: Prop. 246 — criminal responsibility age 13  
**Method**: Three-party convergence in JuU committee; Nordic comparator evidence  
**Vector**: JuU committee reservation (*reservation*)  
**TTP Pattern**: Minority coalition amplification — three parties with different ideologies aligned on a single "Nordic norms" argument to maximise media resonance.

## Attack Tree: Prop. 258 Legitimacy

```
Root: Prop. 258 fails or is discredited
├── Lagrådet constitutional veto [P=0.35]
│   └── Government forced to withdraw → S claims vindication
├── Sustained election campaign narrative [P=0.70]
│   ├── S amplifies "partisan law" in campaign events
│   └── Media frames as governance quality issue
└── SD distances itself [P=0.20]
    └── Coalition friction becomes public
```

## MITRE-Style TTP Mapping

| TTP ID | Description | dok_id |
|--------|-------------|--------|
| TTP-LEG-01 | Legislative narrative construction — create parliamentary record for election use | HD024151 |
| TTP-LEG-02 | Proportionality challenge — use constitutional language to frame rights violation | HD024149, HD024150 |
| TTP-LEG-03 | Cross-bloc coalition — unite ideologically divergent parties on single symbol issue | HD024146, HD024148 |
| TTP-LEG-04 | Nordic framing — invoke Nordic comparators to isolate Sweden as outlier | HD024148, HD024142 |
| TTP-ADM-01 | Committee procedural delay — motion process to extend public debate timeline | All motions |

## Procedural Legitimacy Attack Surface

The S motion (HD024151) marks the first time in the 2022–2026 riksmöte cycle that a major opposition party has formally and publicly characterised a government proposition as partisan electoral manipulation in the parliamentary record. This is a significant escalation. The attack surface created:
- Future propositions touching opposition party resources face automatic legitimacy scrutiny
- Media will reference HD024151 text in every coverage of prop. 258 committee work
- Lagrådet advisory (when issued) becomes a disproportionately political event
