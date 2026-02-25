<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🚀 Riksdagsmonitor — Future State Diagrams</h1>

<p align="center">
  <strong>🔮 Advanced System Behavior and State Transitions</strong><br>
  <em>🎯 AI-Driven Processes · Real-Time Streaming · Predictive Analytics</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-2.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--02--24-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Review-Quarterly-orange?style=for-the-badge" alt="Review Cycle"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 2.0 | **📅 Last Updated:** 2026-02-24 (UTC)  
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-05-20  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 🎯 Purpose

This document outlines the future state transition models for Riksdagsmonitor over the next 3-11 years (2026-2037). Building on the current [State Diagrams](STATEDIAGRAM.md), this roadmap introduces AI-driven state management, real-time streaming states, predictive analytics lifecycle, and multi-parliament coordination states.

## 📚 Architecture Documentation Map

| Document | Focus | Description |
|----------|-------|-------------|
| [🏛️ Architecture](ARCHITECTURE.md) | 🏗️ C4 Models | System context, containers, components |
| [📊 Data Model](DATA_MODEL.md) | 📊 Data | Entity relationships and data dictionary |
| [🔄 Flowchart](FLOWCHART.md) | 🔄 Processes | Business and data flow diagrams |
| [📈 State Diagram](STATEDIAGRAM.md) | 📈 States | System state transitions and lifecycles |
| [🧠 Mindmap](MINDMAP.md) | 🧠 Concepts | System conceptual relationships |
| [💼 SWOT](SWOT.md) | 💼 Strategy | Strategic analysis and positioning |
| [🛡️ Security Architecture](SECURITY_ARCHITECTURE.md) | 🔒 Security | Current security controls and design |
| [🚀 Future Security](FUTURE_SECURITY_ARCHITECTURE.md) | 🔮 Security | Planned security improvements |
| [🎯 Threat Model](THREAT_MODEL.md) | 🎯 Threats | STRIDE/MITRE ATT&CK analysis |
| [🚀 Future Architecture](FUTURE_ARCHITECTURE.md) | 🔮 Evolution | Architectural evolution roadmap |
| [📊 Future Data Model](FUTURE_DATA_MODEL.md) | 🔮 Data | Enhanced data architecture plans |
| [🔄 Future Flowchart](FUTURE_FLOWCHART.md) | 🔮 Processes | Improved process workflows |
| **[📈 Future State Diagram](FUTURE_STATEDIAGRAM.md)** | **🔮 States** | **Advanced state management** |
| [🧠 Future Mindmap](FUTURE_MINDMAP.md) | 🔮 Concepts | Capability expansion plans |
| [💼 Future SWOT](FUTURE_SWOT.md) | 🔮 Strategy | Future strategic opportunities |

---

## 1. 🤖 AI Content Generation Lifecycle (2026-2028)

```mermaid
stateDiagram-v2
    [*] --> EventDetected

    EventDetected --> DataCollection: Riksdag Event Triggers
    DataCollection --> ContentGeneration: Sufficient Data Collected

    ContentGeneration --> QualityAssessment: AI Content Generated
    ContentGeneration --> AIError: Generation Failed

    QualityAssessment --> MultiModalGeneration: Quality Score >= 0.8
    QualityAssessment --> ContentGeneration: Quality Score < 0.8 (Retry)

    MultiModalGeneration --> TextComplete: Article in 14+ Languages
    MultiModalGeneration --> ImageGeneration: Infographics Generated
    MultiModalGeneration --> AudioGeneration: TTS Narration Created

    TextComplete --> HumanReview: All Modalities Complete
    ImageGeneration --> HumanReview
    AudioGeneration --> HumanReview

    HumanReview --> Published: Approved
    HumanReview --> ContentGeneration: Rejected (Revise)

    AIError --> FallbackTemplate: Max Retries Exceeded
    FallbackTemplate --> HumanReview: Template Content Ready

    Published --> Archived: Content Age > 90 Days
    Published --> Updated: New Data Available
    Updated --> QualityAssessment: Re-evaluate

    Archived --> [*]

    note right of ContentGeneration
        GPT-5 with Swedish political context
        riksdag-regering-mcp data feeds
        Hallucination detection active
    end note

    note right of MultiModalGeneration
        Text: 14+ languages
        Images: Stability AI SDXL 3.0
        Audio: ElevenLabs TTS
    end note
```

---

## 2. 📊 Predictive Model Lifecycle (2027-2028)

```mermaid
stateDiagram-v2
    [*] --> DataIngestion

    DataIngestion --> FeatureEngineering: Raw Data Processed
    FeatureEngineering --> ModelTraining: Features Extracted

    ModelTraining --> Validation: Training Complete
    Validation --> ShadowMode: Validation R-squared >= 0.85
    Validation --> ModelTraining: Performance Below Threshold

    ShadowMode --> ABTesting: 7-Day Shadow Period Complete
    ShadowMode --> Rollback: Shadow Performance Degraded

    ABTesting --> GradualRollout: A/B Results Positive
    ABTesting --> Rollback: A/B Results Negative

    GradualRollout --> state "5% Traffic" as T5
    T5 --> state "25% Traffic" as T25: Metrics Stable
    T25 --> state "50% Traffic" as T50: Metrics Stable
    T50 --> FullDeployment: All Metrics Green

    FullDeployment --> Monitoring: Model Live
    Monitoring --> Retraining: Performance Drift Detected
    Monitoring --> FullDeployment: Performance Stable

    Retraining --> DataIngestion: New Training Cycle

    Rollback --> FullDeployment: Revert to Previous Model

    note right of ModelTraining
        TensorFlow.js for client-side inference
        XGBoost/Random Forest for training
        50+ years historical data
    end note

    note right of ABTesting
        Statistical significance: p < 0.05
        Minimum sample: 1,000 users
        Key metric: prediction accuracy
    end note
```

---

## 3. 🌊 Real-Time Streaming States (2028+)

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> Connecting: Parliamentary Session Starts
    Connecting --> Streaming: WebSocket Connected

    Streaming --> Processing: Event Received
    Processing --> Enrichment: Event Parsed

    Enrichment --> Broadcasting: Context Added
    Broadcasting --> Streaming: Push to Clients

    Streaming --> Buffering: High Volume Burst
    Buffering --> Processing: Buffer Flushed

    Streaming --> Reconnecting: Connection Lost
    Reconnecting --> Streaming: Reconnected
    Reconnecting --> Degraded: Max Retries Exceeded

    Degraded --> PollingFallback: Switch to REST Polling
    PollingFallback --> Streaming: WebSocket Restored

    Streaming --> SessionEnd: Parliamentary Session Ends
    SessionEnd --> Archiving: Archive Stream Data
    Archiving --> Idle: Archive Complete

    Processing --> ErrorState: Processing Failure
    ErrorState --> DeadLetterQueue: Event Quarantined
    DeadLetterQueue --> Processing: Manual Retry

    note right of Streaming
        Apache Kafka topics
        Sub-second latency target
        10K events/second peak
    end note

    note right of Degraded
        Graceful degradation
        REST polling every 30s
        User notification displayed
    end note
```

---

## 4. 🗳️ Election Forecast Model States (2026-2028)

```mermaid
stateDiagram-v2
    [*] --> PreElection

    PreElection --> DataCollection: Election Cycle Begins
    DataCollection --> ModelCalibration: Polls + Historical Data

    ModelCalibration --> WeeklyPrediction: > 30 Days to Election
    ModelCalibration --> DailyPrediction: <= 30 Days to Election

    WeeklyPrediction --> DataCollection: New Week
    DailyPrediction --> DataCollection: New Day

    DailyPrediction --> ElectionDay: Election Date Reached
    ElectionDay --> LiveTracking: Polls Close

    LiveTracking --> ResultComparison: Results Coming In
    ResultComparison --> PostElection: Final Results Published

    PostElection --> AccuracyAnalysis: Compare Predictions vs Results
    AccuracyAnalysis --> ModelRetraining: Lessons Learned

    ModelRetraining --> Archived: Model Updated for Next Cycle
    Archived --> [*]

    note right of WeeklyPrediction
        Monte Carlo: 10,000 simulations
        Confidence intervals: 90% and 95%
        Coalition probability matrix
    end note

    note right of ElectionDay
        No predictions published
        Avoid voter influence
        Ethical commitment
    end note
```

---

## 5. 🌍 Multi-Parliament Coordination (2028+)

```mermaid
stateDiagram-v2
    [*] --> Initialization

    Initialization --> SwedishRiksdag: Configure Sweden
    Initialization --> DanishFolketing: Configure Denmark
    Initialization --> NorwegianStorting: Configure Norway
    Initialization --> FinnishEduskunta: Configure Finland

    SwedishRiksdag --> DataSync: API Connected
    DanishFolketing --> DataSync: API Connected
    NorwegianStorting --> DataSync: API Connected
    FinnishEduskunta --> DataSync: API Connected

    DataSync --> SchemaNormalization: Raw Data Collected
    SchemaNormalization --> EntityResolution: Unified Schema

    EntityResolution --> CrossCountryAnalysis: Entities Matched
    CrossCountryAnalysis --> ComparativeDashboard: Analysis Complete

    ComparativeDashboard --> Monitoring: Dashboard Live
    Monitoring --> DataSync: Refresh Cycle

    DataSync --> APIError: API Unavailable
    APIError --> CachedData: Serve Stale Data
    CachedData --> DataSync: API Restored

    note right of SchemaNormalization
        4 different API formats
        XML, JSON, HTML, PDF
        Language normalization
    end note

    note right of CrossCountryAnalysis
        Voting pattern comparison
        Legislative productivity
        Gender/age diversity
        Budget priorities
    end note
```

---

## 6. 🤖 AI/LLM Model Evolution Lifecycle (2026-2037)

```mermaid
stateDiagram-v2
    [*] --> CurrentModel

    CurrentModel --> MinorUpdate: Every ~2.3 Months
    MinorUpdate --> Evaluation: Opus 4.7, 4.8, 4.9...
    
    Evaluation --> Integration: Performance Improved
    Evaluation --> CurrentModel: No Significant Gain
    
    Integration --> ShadowTesting: Deploy Shadow Mode
    ShadowTesting --> GradualRollout: Quality Verified
    ShadowTesting --> Rollback: Quality Degraded
    
    GradualRollout --> CurrentModel: New Model Active
    Rollback --> CurrentModel: Revert to Previous

    CurrentModel --> MajorUpgrade: Annual Major Version
    MajorUpgrade --> ArchitectureReview: Opus 5.0, 6.0, 7.0...
    
    ArchitectureReview --> CapabilityAssessment: Architecture Compatible
    ArchitectureReview --> PlatformRedesign: Breaking Changes
    
    CapabilityAssessment --> FeatureExpansion: New Capabilities Available
    FeatureExpansion --> Integration: Enable New Features
    
    PlatformRedesign --> MigrationPlanning: Plan Architecture Update
    MigrationPlanning --> Integration: Migration Complete

    CurrentModel --> CompetitorEvaluation: Quarterly Review
    CompetitorEvaluation --> ModelSwitch: Competitor Superior
    CompetitorEvaluation --> CurrentModel: Current Model Best
    
    ModelSwitch --> Integration: Multi-Model via Bedrock

    CurrentModel --> AGITransition: 2033-2037
    AGITransition --> AutonomousMode: AGI Capabilities Confirmed
    AGITransition --> EnhancedMode: Pre-AGI Improvements
    
    AutonomousMode --> GlobalPlatform: 195 Parliaments
    EnhancedMode --> CurrentModel: Incremental Enhancement
    
    GlobalPlatform --> [*]

    note right of MinorUpdate
        Anthropic minor releases
        ~2.3 month cadence
        Backward compatible
    end note

    note right of MajorUpgrade
        Annual major versions
        Opus 5.0 (2027)
        Opus 6.0 (2028)
        Through 2037 or successor
    end note

    note right of AGITransition
        Scenario planning for
        transformative AI capabilities
        Human oversight maintained
    end note
```

---

## 📋 Future State Summary

| # | State Model | Timeline | Key Technology | Status |
|---|-------------|----------|----------------|--------|
| 1 | AI Content Generation | 2026-2028 | Opus 4.6-6.x, Stability AI, ElevenLabs | 🟡 Planned |
| 2 | Predictive Model Lifecycle | 2027-2028 | TensorFlow.js, XGBoost | 🔴 Research |
| 3 | Real-Time Streaming | 2028+ | Kafka, Flink, WebSocket | 🔴 Research |
| 4 | Election Forecast | 2026-2028 | Monte Carlo, Statistical Models | 🟡 Planned |
| 5 | Multi-Parliament | 2028+ | Multi-API Integration | 🔴 Research |
| 6 | AI/LLM Model Evolution | 2026-2037 | Opus 4.6→AGI, Multi-Model Strategy | 🟡 Planned |

---

## 📚 Architecture Documentation Map

| Document | Focus | Description |
|----------|-------|-------------|
| [🏛️ Architecture](ARCHITECTURE.md) | 🏗️ C4 Models | System context, containers, components |
| [📊 Data Model](DATA_MODEL.md) | 📊 Data | Entity relationships and data dictionary |
| [🔄 Flowchart](FLOWCHART.md) | 🔄 Processes | Business and data flow diagrams |
| [📈 State Diagram](STATEDIAGRAM.md) | 📈 States | System state transitions and lifecycles |
| [🧠 Mindmap](MINDMAP.md) | 🧠 Concepts | System conceptual relationships |
| [💼 SWOT](SWOT.md) | 💼 Strategy | Strategic analysis and positioning |
| [🛡️ Security Architecture](SECURITY_ARCHITECTURE.md) | 🔒 Security | Current security controls and design |
| [🚀 Future Security](FUTURE_SECURITY_ARCHITECTURE.md) | 🔮 Security | Planned security improvements |
| [🎯 Threat Model](THREAT_MODEL.md) | 🎯 Threats | STRIDE/MITRE ATT&CK analysis |
| [🚀 Future Architecture](FUTURE_ARCHITECTURE.md) | 🔮 Evolution | Architectural evolution roadmap |
| [📊 Future Data Model](FUTURE_DATA_MODEL.md) | 🔮 Data | Enhanced data architecture plans |
| [🔄 Future Flowchart](FUTURE_FLOWCHART.md) | 🔮 Processes | Improved process workflows |
| **[📈 Future State Diagram](FUTURE_STATEDIAGRAM.md)** | **🔮 States** | **Advanced state management** |
| [🧠 Future Mindmap](FUTURE_MINDMAP.md) | 🔮 Concepts | Capability expansion plans |
| [💼 Future SWOT](FUTURE_SWOT.md) | 🔮 Strategy | Future strategic opportunities |

---

---

## 7. 📄 Content Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Draft

    Draft --> PendingValidation : Submit for Validation
    Draft --> Abandoned : Author Cancels

    PendingValidation --> SchemaValidation : Validation Started
    SchemaValidation --> QualityCheck : Schema OK
    SchemaValidation --> Draft : Schema Errors Found

    QualityCheck --> TranslationCheck : Quality Score OK
    QualityCheck --> Draft : Quality Below Threshold

    TranslationCheck --> IntegrityCheck : All 14 Languages Valid
    TranslationCheck --> Draft : Translation Errors

    IntegrityCheck --> ReadyForReview : Integrity Hash OK
    IntegrityCheck --> Draft : Hash Mismatch

    ReadyForReview --> UnderReview : Reviewer Assigned
    UnderReview --> Approved : Review Passed
    UnderReview --> Draft : Changes Requested
    UnderReview --> Rejected : Critical Issues Found

    Approved --> Published : Deploy Pipeline Complete
    Published --> Active : CDN Cache Warm
    Active --> Stale : Data Age More Than 7 Days
    Active --> Updated : New Data Available
    Updated --> Active : Update Published
    Stale --> Refreshing : Refresh Triggered
    Refreshing --> Active : Refresh Complete
    Refreshing --> Expired : Refresh Failed
    Expired --> Archived : Manual Archive Decision
    Active --> Archived : Content Age More Than 90 Days
    Archived --> [*]
    Rejected --> [*]
    Abandoned --> [*]

    note right of QualityCheck
        Quality score computed by
        LLM self-evaluation
        Threshold: 0.8 of 1.0
    end note

    note right of Published
        Content live in 14 languages
        SHA-256 hash recorded
        Git commit signed
    end note
```

---

## 8. ⚙️ MCP Pipeline Orchestration State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> Scheduled : Cron Trigger Fires
    Idle --> ManualTrigger : Manual Dispatch

    Scheduled --> Initializing : Pipeline Starts
    ManualTrigger --> Initializing

    Initializing --> MCPHandshake : Runtime Ready
    MCPHandshake --> ToolDiscovery : MCP Server Connected
    MCPHandshake --> InitError : Connection Failed

    ToolDiscovery --> Fetching : 32 Tools Discovered
    ToolDiscovery --> InitError : Tool Discovery Fails

    Fetching --> FetchingPropositions : Parallel Fetch Starts
    Fetching --> FetchingMotions : Parallel
    Fetching --> FetchingCommittee : Parallel
    Fetching --> FetchingVoting : Parallel

    FetchingPropositions --> Aggregating : Propositions Ready
    FetchingMotions --> Aggregating : Motions Ready
    FetchingCommittee --> Aggregating : Committee Data Ready
    FetchingVoting --> Aggregating : Voting Data Ready

    Aggregating --> Validating : All Data Collected
    Aggregating --> PartialData : Some Fetches Failed

    PartialData --> Validating : Minimum Threshold Met
    PartialData --> FetchError : Below Minimum

    Validating --> Processing : Validation Passed
    Validating --> ValidationError : Data Invalid

    Processing --> Generating : Context Built
    Generating --> LLMCall : Prompt Ready
    LLMCall --> ResponseReceived : LLM Responded
    LLMCall --> LLMTimeout : API Timeout
    LLMTimeout --> LLMRetry : Retry Available
    LLMRetry --> LLMCall : Retry Attempt
    LLMRetry --> LLMFailed : Max Retries

    ResponseReceived --> QualityEval : Response Parsed
    QualityEval --> Translating : Quality OK
    QualityEval --> Generating : Quality Low Retry

    Translating --> TranslationComplete : 13 Languages Done
    TranslationComplete --> Publishing : PR Created
    Publishing --> Complete : Merged and Deployed
    Publishing --> PublishError : Deploy Failed

    InitError --> ErrorRecovery : Error Handler
    FetchError --> ErrorRecovery
    ValidationError --> ErrorRecovery
    LLMFailed --> ErrorRecovery
    PublishError --> ErrorRecovery

    ErrorRecovery --> ErrorLog : Log Error Details
    ErrorLog --> Notification : Alert Owner
    Notification --> Idle : Reset for Next Run

    Complete --> Idle : Pipeline Done

    note right of LLMCall
        Amazon Bedrock API
        Claude Opus model
        30s timeout per call
        Max 3 retries
    end note

    note right of ErrorRecovery
        All errors route here
        Log to GitHub Actions
        No silent failures
    end note
```

---

## 9. 📊 Data Freshness State Machine

```mermaid
stateDiagram-v2
    [*] --> Fresh

    Fresh --> SlightlyStale : Data Age 1-3 Days
    SlightlyStale --> Fresh : Refresh Successful
    SlightlyStale --> Stale : Age Exceeds 3 Days

    Stale --> Critical : Age Exceeds 7 Days
    Stale --> Refreshing : Refresh Triggered

    Critical --> Expired : Age Exceeds 14 Days
    Critical --> Refreshing : Emergency Refresh

    Refreshing --> FetchingData : Fetch in Progress
    FetchingData --> Validating : Data Received
    FetchingData --> RefreshFailed : Network Error

    Validating --> Fresh : Validation Passed
    Validating --> RefreshFailed : Validation Failed

    RefreshFailed --> CacheAvailable : Check Cache
    CacheAvailable --> ServingCache : Cache Valid
    CacheAvailable --> Expired : No Valid Cache

    ServingCache --> Stale : Cache Served
    Expired --> ManualIntervention : Operator Alert
    ManualIntervention --> Refreshing : Manual Retry
    ManualIntervention --> [*] : Service Degraded

    note right of Fresh
        Fresh = data less than 24h old
        Normal operational state
        Banner: Data current
    end note

    note right of Expired
        Expired = data more than 14 days old
        Show prominent stale banner
        Trigger PagerDuty alert
    end note
```

---

## 10. 🛡️ Security Incident Response State Machine

```mermaid
stateDiagram-v2
    [*] --> Monitoring

    Monitoring --> AlertReceived : Security Alert Fired
    AlertReceived --> Triaging : On-Call Notified

    Triaging --> P1Critical : CVSS 9.0+
    Triaging --> P2High : CVSS 7.0-8.9
    Triaging --> P3Medium : CVSS 4.0-6.9
    Triaging --> P4Low : CVSS Less Than 4.0
    Triaging --> FalsePositive : Not a Real Incident

    FalsePositive --> Monitoring : Close and Tune Alert

    P1Critical --> ImmediateContainment : Within 15 Minutes
    P2High --> Containment : Within 1 Hour
    P3Medium --> Containment : Within 4 Hours
    P4Low --> Remediation : Within 7 Days

    ImmediateContainment --> TakeOffline : Disable Affected Service
    TakeOffline --> EvidenceCollection : Preserve Logs

    Containment --> IsolateComponent : Limit Blast Radius
    IsolateComponent --> EvidenceCollection

    EvidenceCollection --> RootCauseAnalysis : Evidence Preserved
    RootCauseAnalysis --> Eradication : Root Cause Found
    RootCauseAnalysis --> EscalateUnknown : Root Cause Unknown

    EscalateUnknown --> ExternalSupport : Need Expert Help
    ExternalSupport --> RootCauseAnalysis : Analysis Resumed

    Eradication --> PatchApplied : Fix Developed
    PatchApplied --> Testing : Fix Verified
    Testing --> Recovery : Tests Pass
    Testing --> Eradication : Tests Fail

    Recovery --> ServiceRestored : Deploy to Production
    ServiceRestored --> PostIncident : Service Healthy

    PostIncident --> LessonsLearned : 72h Post-Incident Review
    LessonsLearned --> ControlUpdate : Update Security Controls
    ControlUpdate --> Documentation : Document Changes
    Documentation --> Monitoring : Return to Normal

    Remediation --> ControlUpdate

    note right of P1Critical
        Examples:
        Credential exposure
        Content tampering
        Data breach
        Response: 15 min SLA
    end note

    note right of PostIncident
        Required within 72 hours:
        Timeline reconstruction
        Impact assessment
        Control improvements
        NIS2 notification if required
    end note
```

---

## 11. 🚀 Deployment Pipeline State Machine with Approval Gates

```mermaid
stateDiagram-v2
    [*] --> CodeCommitted

    CodeCommitted --> PRCreated : Developer Opens PR
    PRCreated --> AutomatedChecks : CI Pipeline Starts

    AutomatedChecks --> Linting : ESLint HTMLHint
    AutomatedChecks --> UnitTests : Vitest Suite
    AutomatedChecks --> SecurityScan : CodeQL Dependabot
    AutomatedChecks --> BuildCheck : Vite Build

    Linting --> LintGate : Results
    UnitTests --> TestGate : Results
    SecurityScan --> SecurityGate : Results
    BuildCheck --> BuildGate : Results

    LintGate --> AutomatedChecksFailed : Lint Errors
    TestGate --> AutomatedChecksFailed : Test Failures
    SecurityGate --> AutomatedChecksFailed : Security Issues
    BuildGate --> AutomatedChecksFailed : Build Error

    LintGate --> AllChecksPass : Lint Clean
    TestGate --> AllChecksPass : Tests Pass
    SecurityGate --> AllChecksPass : Security OK
    BuildGate --> AllChecksPass : Build OK

    AutomatedChecksFailed --> CodeCommitted : Fix Required

    AllChecksPass --> E2ETests : Deploy to Staging
    E2ETests --> E2EGate : Cypress Complete
    E2EGate --> E2EFailed : E2E Failures
    E2EFailed --> CodeCommitted : Fix Required

    E2EGate --> AwaitingApproval : E2E Passed
    AwaitingApproval --> UnderReview : Reviewer Assigned
    UnderReview --> ChangesRequested : Review Feedback
    ChangesRequested --> CodeCommitted : Author Updates
    UnderReview --> Approved : LGTM

    Approved --> MergeTrigger : Merge to Main
    MergeTrigger --> DeploymentBuild : Build Release
    DeploymentBuild --> SLSAAttestation : Sign Provenance
    SLSAAttestation --> DeployToGHPages : Push to gh-pages
    DeployToGHPages --> CDNInvalidation : CloudFront Invalidate
    CDNInvalidation --> SmokeTest : Verify Live
    SmokeTest --> SmokeGate : Check Results
    SmokeGate --> DeployFailed : Smoke Failed
    SmokeGate --> DeploymentComplete : Smoke Passed

    DeployFailed --> Rollback : Auto Revert
    Rollback --> PreviousVersion : Restore Prior
    PreviousVersion --> PostMortem : Investigate Failure
    PostMortem --> CodeCommitted : Fix and Redeploy

    DeploymentComplete --> [*]

    note right of AwaitingApproval
        Required approvers:
        James Pether Sorling (CEO)
        Branch protection enforced
        No force push allowed
    end note

    note right of SLSAAttestation
        SLSA Level 2+
        Sigstore signing
        Build provenance
        Tamper-evident log
    end note
```

---

## 12. ⏱️ API Rate Limiting State Machine

```mermaid
stateDiagram-v2
    [*] --> Available

    Available --> Requesting : API Call Made
    Requesting --> BudgetCheck : Check Rate Budget
    BudgetCheck --> WithinBudget : Tokens Available
    BudgetCheck --> BudgetExceeded : No Tokens

    WithinBudget --> DeductToken : Consume Token
    DeductToken --> ExecuteCall : Token Deducted
    ExecuteCall --> SuccessResponse : 200 OK
    ExecuteCall --> ThrottledResponse : 429 Too Many Requests
    ExecuteCall --> ErrorResponse : 5xx Error

    SuccessResponse --> Available : Call Complete

    ThrottledResponse --> BackoffWait : Exponential Backoff
    BackoffWait --> BackoffCheck : Wait Complete
    BackoffCheck --> Requesting : Retry Available
    BackoffCheck --> MaxRetries : Retries Exhausted

    ErrorResponse --> RetryEligible : Retryable Error
    RetryEligible --> BackoffWait
    ErrorResponse --> FatalError : Non-Retryable

    BudgetExceeded --> QuotaWindow : Next Window
    QuotaWindow --> Available : Window Resets
    QuotaWindow --> AlertLow : Budget Critical
    AlertLow --> Available : Continue with Warning

    MaxRetries --> FallbackCache : Use Cached Data
    FallbackCache --> Available : Served from Cache
    FatalError --> ErrorLog : Log Failure
    ErrorLog --> Available : Reset

    note right of BackoffWait
        Exponential backoff:
        1s, 2s, 4s, 8s, 16s
        Max 5 retries per request
    end note

    note right of BudgetExceeded
        Riksdag API rate limits:
        Respect Retry-After header
        Daily quota tracking
    end note
```

---

## 13. 🔑 Credential Rotation State Machine

```mermaid
stateDiagram-v2
    [*] --> Active

    Active --> MonitorAge : Daily Age Check
    MonitorAge --> StillValid : Age Less Than 60 Days
    MonitorAge --> ApproachingExpiry : Age 60-89 Days
    MonitorAge --> ExpiryCritical : Age 90+ Days
    MonitorAge --> Expired : Age 120+ Days

    StillValid --> Active : Continue Normal Operation

    ApproachingExpiry --> RotationScheduled : Schedule Rotation
    RotationScheduled --> AwaitingRotation : 7-Day Notice Sent
    AwaitingRotation --> RotationInitiated : Rotation Window Opens

    ExpiryCritical --> ImmediateRotation : Emergency Rotation
    ImmediateRotation --> RotationInitiated

    RotationInitiated --> NewCredentialCreated : New Credential Generated
    NewCredentialCreated --> DualActive : Both Old and New Active
    DualActive --> NewCredentialTested : Test New Credential
    NewCredentialTested --> TestPassed : Validation OK
    NewCredentialTested --> TestFailed : Validation Failed

    TestPassed --> MigrateServices : Update All References
    MigrateServices --> GHSecretUpdated : GitHub Secret Updated
    GHSecretUpdated --> OldRevoked : Revoke Old Credential
    OldRevoked --> Active : Rotation Complete

    TestFailed --> NewCredentialRevoked : Revoke Failed Credential
    NewCredentialRevoked --> RotationInitiated : Retry Rotation

    Expired --> EmergencyRevoke : Immediate Revoke
    EmergencyRevoke --> ServiceDegradation : Service Impact
    ServiceDegradation --> EmergencyNew : Create Emergency Cred
    EmergencyNew --> Active : Emergency Restore

    Active --> Compromised : Security Alert
    Compromised --> ImmediateRevoke : Revoke Now
    ImmediateRevoke --> IncidentResponse : Trigger IR
    IncidentResponse --> EmergencyNew

    note right of Active
        Credentials in scope:
        Amazon Bedrock API key
        GitHub PAT tokens
        MCP server keys
        Rotation policy: 90 days
    end note

    note right of DualActive
        Zero-downtime rotation
        Old credential still valid
        during migration window
        (max 24 hour overlap)
    end note
```

---

## 14. 📝 Content Versioning State Machine

```mermaid
stateDiagram-v2
    [*] --> v1Created

    v1Created --> v1Active : First Publish
    v1Active --> v1Updated : Minor Edit
    v1Updated --> v1Active : Edit Published
    v1Active --> v2Draft : Major Revision Started

    v2Draft --> v2Review : v2 Content Ready
    v2Review --> v2Approved : Review Passed
    v2Review --> v2Draft : Changes Requested

    v2Approved --> MigrationCheck : Check Compatibility
    MigrationCheck --> BreakingChange : Schema Changed
    MigrationCheck --> NonBreaking : Compatible

    NonBreaking --> v2Deploy : Deploy v2
    BreakingChange --> RedirectSetup : Create Redirects
    RedirectSetup --> v2Deploy

    v2Deploy --> v1Archived : Archive v1
    v2Deploy --> v2Active : v2 Live
    v1Archived --> v1Restorable : Keep for 90 Days

    v2Active --> v2Updated : Minor Edit
    v2Updated --> v2Active : Published
    v2Active --> v3Draft : Next Major Version

    v1Restorable --> v1Restored : Rollback Decision
    v1Restored --> v1Active : Emergency Rollback
    v1Restorable --> v1Deleted : Retention Expired
    v1Deleted --> [*]

    note right of v1Active
        All versions stored in Git
        Full history preserved
        Rollback possible at any time
        Git tag per release
    end note

    note right of BreakingChange
        Breaking changes require:
        URL redirect mapping
        SEO impact assessment
        Hreflang updates for 14 langs
    end note
```

---

## Updated Future State Summary

| # | State Model | Timeline | Key Technology | Status |
|---|-------------|----------|----------------|--------|
| 1 | AI Content Generation | 2026-2028 | Opus 4.6-6.x, Stability AI, ElevenLabs | Planned |
| 2 | Predictive Model Lifecycle | 2027-2028 | TensorFlow.js, XGBoost | Research |
| 3 | Real-Time Streaming | 2028+ | Kafka, Flink, WebSocket | Research |
| 4 | Election Forecast | 2026-2028 | Monte Carlo, Statistical Models | Planned |
| 5 | Multi-Parliament | 2028+ | Multi-API Integration | Research |
| 6 | AI/LLM Model Evolution | 2026-2037 | Opus 4.6 to AGI, Multi-Model Strategy | Planned |
| 7 | Content Lifecycle | 2026 | Git, SHA-256, HTMLHint | Active |
| 8 | MCP Pipeline Orchestration | 2026 | riksdag-regering-mcp, Amazon Bedrock | Active |
| 9 | Data Freshness | 2026 | Cache layer, staleness detection | Active |
| 10 | Security Incident Response | 2026 | GitHub Security, ISMS playbooks | Active |
| 11 | Deployment Pipeline | 2026 | GitHub Actions, SLSA, Sigstore | Active |
| 12 | API Rate Limiting | 2026 | Exponential backoff, quota tracking | Active |
| 13 | Credential Rotation | 2026 | GitHub Secrets, 90-day policy | Active |
| 14 | Content Versioning | 2026 | Git tags, redirects, archiving | Active |

---

**📋 Document Control:**  
**✅ Approved by:** James Pether Sörling, CEO  
**📤 Distribution:** Public  
**🏷️ Classification:** [![Confidentiality: Public](https://img.shields.io/badge/C-Public-lightgrey?style=flat-square)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md#confidentiality-levels)  
**📅 Effective Date:** 2026-02-25  
**⏰ Next Review:** 2026-05-25  
**🎯 Framework Compliance:** [![ISO 27001](https://img.shields.io/badge/ISO_27001-2022_Aligned-blue?style=flat-square&logo=iso&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) [![NIST CSF 2.0](https://img.shields.io/badge/NIST_CSF-2.0_Aligned-green?style=flat-square&logo=nist&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) [![CIS Controls](https://img.shields.io/badge/CIS_Controls-v8.1_Aligned-orange?style=flat-square&logo=cisecurity&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md)
