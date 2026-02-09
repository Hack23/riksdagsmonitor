---
name: electoral-analysis
description: Election forecasting, campaign analysis, coalition prediction, voter behavior modeling
license: Apache-2.0
---

# Electoral Analysis Skill

## Purpose

Election forecasting and voter behavior analysis for Riksdagsmonitor's political intelligence platform.

## Core Capabilities

### 1. Election Forecasting
- Historical trend analysis (1970-present)
- Polling aggregation and weighting
- Swing calculations and projections
- Confidence intervals and uncertainty modeling

### 2. Campaign Analysis
- Media visibility tracking
- Issue positioning analysis
- Coalition signaling detection
- Electoral strategy assessment

### 3. Coalition Prediction
- Seat projection modeling
- Coalition viability assessment
- Policy alignment analysis
- Historical pattern recognition

### 4. Voter Behavior Modeling
- Demographic voting patterns
- Regional variations
- Issue salience impact
- Turnout forecasting

## Swedish Electoral Context

### Key Metrics
- **Turnout**: Typically 85-90% (very high)
- **Volatility**: Moderate (10-15% vote swing)
- **Fragmentation**: 8 parties in parliament
- **Threshold Effects**: 4% creates uncertainty for L, KD

### Historical Data (Elections 1970-2024)
- 14 parliamentary elections
- Party performance trends
- Coalition formation patterns
- Electoral system changes

## Visualization for Riksdagsmonitor

### HTML/CSS Dashboard Elements
```html
<section class="election-forecast">
  <h2>Valprognos 2026</h2>
  <div class="seat-projection">
    <div class="party" data-party="s" style="--seats: 107">
      <span class="party-name">S</span>
      <span class="seats">107</span>
      <span class="confidence">±5</span>
    </div>
    <!-- More parties... -->
  </div>
</section>
```

## ISMS Compliance

### ISO 27001:2022
- **A.5.10**: Objective forecasting methods
- **A.8.3**: Electoral data access control

## References

- **Valmyndigheten**: https://www.val.se/
- **Historical Data**: CIA election datasets
- **Forecasting Methods**: Nate Silver, FiveThirtyEight
