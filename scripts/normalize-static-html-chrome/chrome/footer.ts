/**
 * @module normalize-static-html-chrome/chrome/footer
 * @description Legacy site-footer renderer + replace helper.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import { chromeStrings } from '../../render-lib/chrome-i18n.js';
import { LANGUAGE_META } from '../../sitemap-html/i18n.js';
import { API_DOCS_URL, ISSUE_URL, type PageFamily } from '../constants.js';
import { languageGrid } from './language-bar.js';

/** Render the canonical legacy site-footer for static landing pages. */
export function footer(prefix: string, family: PageFamily, current: Language): string {
  const cs = chromeStrings(current);
  const t = LANGUAGE_META[current].translations;
  const indexFile = current === 'en' ? 'index.html' : `index_${current}.html`;
  const newsFile = current === 'en' ? 'news/index.html' : `news/index_${current}.html`;
  const dashboardFile = current === 'en' ? 'dashboard/index.html' : `dashboard/index_${current}.html`;
  const piFile = current === 'en' ? 'political-intelligence.html' : `political-intelligence_${current}.html`;
  const politiciansFile = current === 'en' ? 'politician-dashboard.html' : `politician-dashboard_${current}.html`;
  const sitemapFile = current === 'en' ? 'sitemap.html' : `sitemap_${current}.html`;
  const year = new Date().getUTCFullYear();

  return `<footer role="contentinfo" class="site-footer" data-rm-static-footer="true">
  <div class="footer-content">
    <div class="footer-section">
      <a href="${prefix}${indexFile}" aria-label="Riksdagsmonitor ${t.home}">
        <img src="${prefix}images/riksdagsmonitor-logo.webp" srcset="${prefix}images/riksdagsmonitor-logo-96w.webp 96w, ${prefix}images/riksdagsmonitor-logo-180w.webp 180w" sizes="80px" alt="Riksdagsmonitor" class="footer-logo" width="80" height="80" loading="lazy">
      </a>
      <h3><span aria-hidden="true">📖</span> ${cs.legacyAboutHeading}</h3>
      <p>${cs.legacyAboutBody}</p>
      <p>${cs.footerCybersecurityTagline}</p>
      <ul class="footer-stats">
        <li><strong>349 ${cs.legacyStatMps}</strong> ${cs.legacyStatTracked}</li>
        <li><strong>45 ${cs.legacyStatRiskRules}</strong> ${cs.legacyStatActive}</li>
        <li><strong>14 ${cs.legacyStatLanguages}</strong> ${cs.legacyStatSupported}</li>
        <li><strong>${cs.legacyStatYears}</strong> ${cs.legacyStatHistorical}</li>
      </ul>
    </div>
    <div class="footer-section">
      <h3><span aria-hidden="true">🔗</span> ${cs.legacyQuickLinksHeading}</h3>
      <ul>
        <li><a href="${prefix}${indexFile}">${t.home}</a></li>
        <li><a href="${prefix}${newsFile}">${cs.news}</a></li>
        <li><a href="${prefix}${dashboardFile}">${cs.dashboard}</a></li>
        <li><a href="${prefix}${politiciansFile}"><span aria-hidden="true">👤</span> ${cs.politicians}</a></li>
        <li><a href="${prefix}${piFile}"><span aria-hidden="true">🧠</span> ${cs.politicalIntelligence}</a></li>
        <li><a href="${prefix}${sitemapFile}"><span aria-hidden="true">🗺️</span> ${t.siteMap}</a></li>
        <li><a href="${API_DOCS_URL}"><span aria-hidden="true">📚</span> ${cs.linkApiDocs}</a></li>
        <li><a href="https://github.com/Hack23/cia" target="_blank" rel="noopener noreferrer">${cs.linkCiaPlatform}</a></li>
        <li><a href="https://github.com/Hack23/riksdagsmonitor" target="_blank" rel="noopener noreferrer">${cs.linkGithubRepo}</a></li>
        <li><a href="https://www.riksdagen.se" target="_blank" rel="noopener noreferrer">${cs.linkRiksdag}</a></li>
      </ul>
    </div>
    <div class="footer-section">
      <h3><span aria-hidden="true">🏢</span> ${cs.footerBuiltByHeading}</h3>
      <p>${cs.footerCybersecurityTagline}</p>
      <ul>
        <li><a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">${cs.linkHack23Home}</a></li>
        <li><a href="https://www.hack23.com/riksdagsmonitor.html" target="_blank" rel="noopener noreferrer">${cs.linkHack23Riksdagsmonitor}</a></li>
        <li><a href="https://www.hack23.com/riksdagsmonitor-features.html" target="_blank" rel="noopener noreferrer">${cs.linkHack23Features}</a></li>
        <li><a href="https://github.com/sponsors/Hack23" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">💖</span> ${cs.linkSponsorHack23}</a></li>
        <li><a href="https://www.linkedin.com/company/hack23/" target="_blank" rel="noopener noreferrer">${cs.linkLinkedin}</a></li>
        <li><a href="https://github.com/Hack23" target="_blank" rel="noopener noreferrer">${cs.linkHack23Org}</a></li>
        <li><a href="mailto:info@hack23.com">${cs.linkContactUs}</a></li>
        <li><a href="${ISSUE_URL}" target="_blank" rel="noopener noreferrer">${cs.linkReportIssue}</a></li>
      </ul>
    </div>
    <div class="footer-section rm-footer-isms">
      <h3><span aria-hidden="true">🛡️</span> ${cs.footerIsmsHeading}</h3>
      <p>${cs.footerIsmsTagline}</p>
      <ul>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer">${cs.linkPublicIsmsRepo}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md" target="_blank" rel="noopener noreferrer">${cs.linkInfoSecPolicy}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Privacy_Policy.md" target="_blank" rel="noopener noreferrer">${cs.linkPrivacyPolicy}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer">${cs.linkSecureDevPolicy}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md" target="_blank" rel="noopener noreferrer">${cs.linkAiPolicy}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md" target="_blank" rel="noopener noreferrer">${cs.linkThreatModeling}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md" target="_blank" rel="noopener noreferrer">${cs.linkVulnMgmt}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md" target="_blank" rel="noopener noreferrer">${cs.linkIncidentResponse}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Access_Control_Policy.md" target="_blank" rel="noopener noreferrer">${cs.linkAccessControl}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Cryptography_Policy.md" target="_blank" rel="noopener noreferrer">${cs.linkCryptoPolicy}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Open_Source_Policy.md" target="_blank" rel="noopener noreferrer">${cs.linkOpenSourcePolicy}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md" target="_blank" rel="noopener noreferrer">${cs.linkChangeMgmt}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md" target="_blank" rel="noopener noreferrer">${cs.linkClassification}</a></li>
        <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Security_Metrics.md" target="_blank" rel="noopener noreferrer">${cs.linkSecurityMetrics}</a></li>
      </ul>
    </div>
    <div class="footer-section">
      <h3><span aria-hidden="true">🌍</span> ${cs.legacyLanguagesHeading}</h3>
      <div class="language-grid">
${languageGrid(prefix, family, current)}
      </div>
    </div>
  </div>
  <nav class="rm-footer-trust-badges" aria-label="${cs.trustBadgesAria}">
    <a href="https://www.npmjs.com/package/riksdagsmonitor" target="_blank" rel="noopener noreferrer" aria-label="Riksdagsmonitor on npmjs"><img src="https://img.shields.io/npm/v/riksdagsmonitor.svg?logo=npm&label=npm" alt="Riksdagsmonitor on npmjs" width="100" height="20" loading="lazy" decoding="async"></a>
    <a href="https://scorecard.dev/viewer/?uri=github.com/Hack23/riksdagsmonitor" target="_blank" rel="noopener noreferrer" aria-label="OpenSSF Scorecard"><img src="https://api.securityscorecards.dev/projects/github.com/Hack23/riksdagsmonitor/badge" alt="OpenSSF Scorecard" width="120" height="20" loading="lazy" decoding="async"></a>
    <a href="https://www.bestpractices.dev/projects/12069" target="_blank" rel="noopener noreferrer" aria-label="OpenSSF Best Practices"><img src="https://www.bestpractices.dev/projects/12069/badge" alt="OpenSSF Best Practices" width="124" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/codeql.yml" target="_blank" rel="noopener noreferrer" aria-label="CodeQL workflow status"><img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/codeql.yml/badge.svg" alt="CodeQL workflow status" width="120" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/quality-checks.yml" target="_blank" rel="noopener noreferrer" aria-label="Quality checks workflow status"><img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/quality-checks.yml/badge.svg" alt="Quality checks workflow status" width="160" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/dependency-review.yml" target="_blank" rel="noopener noreferrer" aria-label="Dependency review workflow status"><img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/dependency-review.yml/badge.svg" alt="Dependency review workflow status" width="170" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/riksdagsmonitor/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" aria-label="Apache-2.0 License"><img src="https://img.shields.io/github/license/Hack23/riksdagsmonitor" alt="Apache-2.0 License" width="120" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer" aria-label="Hack23 ISMS-PUBLIC"><img src="https://img.shields.io/badge/Hack23-ISMS-blue?logo=shield" alt="Hack23 ISMS-PUBLIC" width="100" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="ISO 27001:2022 alignment"><img src="https://img.shields.io/badge/ISO-27001:2022-purple" alt="ISO 27001:2022 alignment" width="110" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="NIST CSF 2.0 alignment"><img src="https://img.shields.io/badge/NIST-CSF_2.0-orange" alt="NIST CSF 2.0 alignment" width="100" height="20" loading="lazy" decoding="async"></a>
    <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="CIS Controls v8.1 alignment"><img src="https://img.shields.io/badge/CIS-Controls_v8.1-red" alt="CIS Controls v8.1 alignment" width="120" height="20" loading="lazy" decoding="async"></a>
    <a href="https://riksdagsmonitor.com" target="_blank" rel="noopener noreferrer" aria-label="Riksdagsmonitor.com website status"><img src="https://img.shields.io/website?url=https%3A%2F%2Friksdagsmonitor.com" alt="Riksdagsmonitor.com website status" width="120" height="20" loading="lazy" decoding="async"></a>
  </nav>
  <div class="footer-bottom">
    <p>&copy; 2008-<time datetime="${year}">${year}</time> <a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">Hack23 AB</a> (Org.nr 5595347807) | Gothenburg, Sweden</p>
    <p class="footer-disclaimer">⚠️ <a href="${ISSUE_URL}" target="_blank" rel="noopener noreferrer">${cs.linkReportIssue}</a></p>
  </div>
</footer>`;
}

/** Replace any existing `<footer>` block with the canonical legacy footer. */
export function replaceFooter(html: string, prefix: string, family: PageFamily, lang: Language): string {
  const nextFooter = footer(prefix, family, lang);
  if (/<footer\b[\s\S]*?<\/footer>/i.test(html)) {
    return html.replace(/<footer\b[\s\S]*?<\/footer>/i, nextFooter);
  }
  return html.replace(/<\/body>/i, `${nextFooter}\n</body>`);
}
