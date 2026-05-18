/**
 * @module Infrastructure/RenderLib/ChromeI18n/Types
 * @category Intelligence Operations / Supporting Infrastructure
 * @name ChromeStrings — shape of the 14-language chrome i18n table
 *
 * @description
 * Pure type module — declares the `ChromeStrings` interface consumed by
 * every per-language file in this directory and re-exported from
 * `./index.ts`. Type-only, zero runtime cost. Split from the legacy
 * single-file `scripts/render-lib/chrome-i18n.ts` (1 505 lines) so each
 * language can be reviewed in isolation.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

export interface ChromeStrings {
  // ── Header CTAs ────────────────────────────────────────────────
  readonly transparencyLabel: string;          // 🔐 button label
  readonly transparencyTitle: string;          // tooltip / aria-label
  readonly sponsorLabel: string;               // 💖 button label
  readonly sponsorTitle: string;               // tooltip / aria-label
  readonly politicalIntelligenceLabel: string; // 🧠 CTA button label
  readonly politicalIntelligenceTitle: string; // tooltip / aria-label
  readonly themeLabel: string;                 // theme toggle label
  readonly themeAria: string;                  // theme toggle aria-label
  readonly themeToLight: string;               // data-label-dark
  readonly themeToDark: string;                // data-label-light
  readonly skipToMain: string;                 // skip-link label
  // ── Header brand row ───────────────────────────────────────────
  readonly headerTagline: string;              // sub-brand tagline under the rm-logo (under "Riksdagsmonitor")
  // ── Static-page hero block (index_*.html) ─────────────────────
  // Used by `scripts/normalize-static-html-chrome.ts` to inject a
  // localized hero block consistently across the 14-language landing
  // pages so editorial copy can't drift between variants.
  readonly heroSubtitle: string;               // h1 subtitle, e.g. "Swedish election intelligence platform 2026"
  readonly heroTagline: string;                // <p class="tagline">…</p>
  readonly electionCountdownLabel: string;     // "Election in:" prefix
  readonly electionDateLong: string;           // "13 September 2026 (Second Sunday in September)"
  readonly heroStatPoliticians: string;        // "Politicians monitored"
  readonly heroStatBallots: string;            // "Riksdag ballots"
  readonly heroStatDocuments: string;          // "Documents processed"
  readonly heroStatBills: string;              // "Government bills"
  readonly heroStatDecisions: string;          // "Committee decisions"
  readonly switchLanguage: string;             // <details> aria-label
  readonly thisPageInOtherLanguages: string;   // horizontal lang bar aria-label
  readonly pageContext: string;                // sub-nav aria-label
  readonly breadcrumb: string;                 // breadcrumb aria-label
  readonly mainNav: string;                    // primary nav aria-label
  readonly news: string;                       // primary nav: News
  readonly dashboard: string;                  // primary nav: Dashboard
  readonly politicalIntelligence: string;      // primary nav: Political Intelligence
  readonly politicians: string;                // primary nav: Politicians (MP profiles)
  // ── Footer column headings ─────────────────────────────────────
  readonly footerAboutHeading: string;         // h2: Riksdagsmonitor (about col)
  readonly footerQuickLinksHeading: string;    // h2: Quick Links
  readonly footerBuiltByHeading: string;       // h2: Built by Hack23 AB
  readonly footerIsmsHeading: string;          // h2: 🛡️ Hack23 ISMS
  readonly footerComplianceHeading: string;    // h2: 🔐 Transparency & compliance
  // ── Footer paragraphs ─────────────────────────────────────────
  readonly footerCybersecurityTagline: string; // "Swedish cybersecurity consultancy …"
  readonly footerPoweredBy: string;            // "Powered by"
  readonly footerBuiltBy: string;              // "Built by"
  readonly footerLastUpdated: string;          // "Last updated:"
  readonly footerIsmsTagline: string;          // "Public ISMS aligned with …"
  // ── Footer Quick Links ────────────────────────────────────────
  readonly linkApiDocs: string;                // "API Documentation (TypeDoc)"
  readonly linkCiaPlatform: string;            // "CIA Platform"
  readonly linkGithubRepo: string;             // "GitHub Repository"
  readonly linkRiksdag: string;                // "Sveriges Riksdag"
  readonly linkRss: string;                    // "RSS feed"
  // ── Footer Built-by-Hack23 column ─────────────────────────────
  readonly linkHack23Home: string;             // "Hack23.com"
  readonly linkHack23Riksdagsmonitor: string;  // "Hack23 · Riksdagsmonitor"
  readonly linkHack23Features: string;         // "Hack23 · Features"
  readonly linkSponsorHack23: string;          // "Sponsor Hack23"
  readonly linkLinkedin: string;               // "Company LinkedIn"
  readonly linkHack23Org: string;              // "Hack23 GitHub Org"
  readonly linkContactUs: string;              // "Contact Us"
  readonly linkEuParliamentMonitor: string;    // "EU Parliament Monitor"
  readonly linkHack23Blog: string;             // "Hack23 Blog"
  // ── Footer Hack23 ISMS column links ───────────────────────────
  readonly linkPublicIsmsRepo: string;         // "Public ISMS repository"
  readonly linkInfoSecPolicy: string;          // "Information Security Policy"
  readonly linkPrivacyPolicy: string;          // "Privacy Policy"
  readonly linkSecureDevPolicy: string;        // "Secure Development Policy"
  readonly linkAiPolicy: string;               // "AI Policy"
  readonly linkThreatModeling: string;         // "Threat Modeling"
  readonly linkVulnMgmt: string;               // "Vulnerability Management"
  readonly linkIncidentResponse: string;       // "Incident Response Plan"
  readonly linkAccessControl: string;          // "Access Control Policy"
  readonly linkCryptoPolicy: string;           // "Cryptography Policy"
  readonly linkOpenSourcePolicy: string;       // "Open Source Policy"
  readonly linkChangeMgmt: string;             // "Change Management"
  readonly linkClassification: string;         // "Classification"
  readonly linkSecurityMetrics: string;        // "Security Metrics"
  // ── Footer Transparency & compliance column links ────────────
  readonly linkSecurityPolicy: string;         // "Security Policy"
  readonly linkCraAssessment: string;          // "EU CRA assessment"
  readonly linkThreatModel: string;            // "Threat model"
  readonly linkTranslationGuide: string;       // "Translation guide"
  readonly linkContributing: string;           // "Contributing"
  readonly linkCodeOfConduct: string;          // "Code of Conduct"
  readonly linkChangelog: string;              // "Changelog"
  readonly linkLicense: string;                // "License (Apache-2.0)"
  readonly linkReportIssue: string;            // "Report a GitHub issue"
  // ── Trust-badges row ─────────────────────────────────────────
  readonly trustBadgesAria: string;            // nav aria-label
  // ── Footer language switcher + legal ─────────────────────────
  readonly footerLangsAria: string;            // "Switch language" (footer)
  readonly footerLegal: string;                // © year Hack23 AB · Apache-2.0 · public political data only — GDPR Art. 9(2)(e,g). No cookies, no tracking, no advertising.
  // ── Legacy news footer extras ─────────────────────────────────
  readonly legacyAboutHeading: string;         // h3: About Riksdagsmonitor
  readonly legacyAboutBody: string;            // "Live intelligence platform …"
  readonly legacyQuickLinksHeading: string;    // h3: Quick Links
  readonly legacyLanguagesHeading: string;     // h3: Languages
  readonly legacyStatTracked: string;          // "tracked"
  readonly legacyStatActive: string;           // "active"
  readonly legacyStatSupported: string;        // "supported"
  readonly legacyStatHistorical: string;       // "historical data"
  readonly legacyStatMps: string;              // "MPs"
  readonly legacyStatRiskRules: string;        // "risk rules"
  readonly legacyStatLanguages: string;        // "languages"
  readonly legacyStatYears: string;            // "50+ years"
}
