/**
 * @module Infrastructure/RenderLib/Chrome/Footer
 * @category Intelligence Operations / Supporting Infrastructure
 * @name HTML site footer builder (columns, trust badges, language row)
 *
 * @description
 * Pure, stateless string builder for the `</main>…<footer>…</footer>
 * </body></html>` block including the four-column layout (brand,
 * navigate, ISMS, compliance), trust badges, secondary language row,
 * and Mermaid/theme bootstrap scripts.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { LANGUAGE_META, escapeHtml } from '../../sitemap-html/index.js';
import { GITHUB_BLOB, LANGUAGES } from '../constants.js';
import { chromeStrings } from '../chrome-i18n.js';
import type { ChromeOptions } from './types.js';
import { depth, fallbackAlternateHref } from './helpers.js';

/**
 * Build the complete `</main>…<footer>…</footer></body></html>` block.
 */
export function buildFooterHtml(opts: ChromeOptions): string {
  const meta = LANGUAGE_META[opts.lang];
  const t = meta.translations;
  const cs = chromeStrings(opts.lang);
  const prefix = depth(opts.canonicalPath);
  const indexFile = opts.lang === 'en' ? 'index.html' : `index_${opts.lang}.html`;
  const sitemapFile = opts.lang === 'en' ? 'sitemap.html' : `sitemap_${opts.lang}.html`;
  const piFile = opts.lang === 'en' ? 'political-intelligence.html' : `political-intelligence_${opts.lang}.html`;
  const newsFile = opts.lang === 'en' ? 'news/index.html' : `news/index_${opts.lang}.html`;
  const dashboardFile = opts.lang === 'en' ? 'dashboard/index.html' : `dashboard/index_${opts.lang}.html`;
  const rssHref = opts.rssHref ?? (opts.lang === 'en' ? '/rss.xml' : `/rss_${opts.lang}.xml`);
  const apiDocsHref = 'https://riksdagsmonitor.com/docs/api/index.html';
  const issueHref = 'https://github.com/Hack23/riksdagsmonitor/issues/new/choose';
  const lastUpdatedIso = opts.modifiedIso ?? new Date().toISOString();
  const lastUpdatedDisplay = lastUpdatedIso.slice(0, 16).replace('T', ' ') + ' UTC';

  const altBase = opts.defaultAlternateBase ?? 'index.html';

  // Footer inline lang-switcher
  const footerLangRow = LANGUAGES
    .filter((l) => l !== opts.lang)
    .map((l) => {
      const lm = LANGUAGE_META[l];
      const href = opts.hreflangAlternates?.[l] ?? fallbackAlternateHref(l, altBase);
      const displayCode = l === 'no' ? 'NO' : lm.hreflang.toUpperCase();
      return `          <a href="${prefix}${href}" lang="${lm.hreflang}" title="${escapeHtml(lm.nativeName)}"><span aria-hidden="true">${lm.flag}</span> <span class="rm-lang-code">${displayCode}</span></a>`;
    })
    .join('\n');

  return `    </main>
    <footer class="rm-site-footer" role="contentinfo">
      <div class="rm-site-footer-inner">
        <section class="rm-footer-col rm-footer-brand" aria-labelledby="rm-ft-about">
          <h2 id="rm-ft-about" class="rm-footer-heading">${escapeHtml(cs.footerAboutHeading)}</h2>
          <p>${escapeHtml(meta.translations.mainPlatformDesc)}</p>
          <p>${escapeHtml(cs.footerCybersecurityTagline)}</p>
          <p class="rm-footer-attribution">
            ${escapeHtml(cs.footerPoweredBy)}
            <a href="https://github.com/Hack23/cia" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkCiaPlatform)}</a>
            · ${escapeHtml(cs.footerBuiltBy)}
            <a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">Hack23 AB</a>
          </p>
          <p class="rm-footer-updated"><small>${escapeHtml(cs.footerLastUpdated)} <time datetime="${lastUpdatedIso}">${escapeHtml(lastUpdatedDisplay)}</time></small></p>
        </section>
        <section class="rm-footer-col rm-footer-navigate" aria-labelledby="rm-ft-nav">
          <h2 id="rm-ft-nav" class="rm-footer-heading">${escapeHtml(cs.footerQuickLinksHeading)}</h2>
          <ul>
            <li><a href="${prefix}${indexFile}">${escapeHtml(t.home)}</a></li>
            <li><a href="${prefix}${newsFile}">${escapeHtml(cs.news)}</a></li>
            <li><a href="${prefix}${dashboardFile}">${escapeHtml(cs.dashboard)}</a></li>
            <li><a href="${prefix}${piFile}"><span aria-hidden="true">🧠</span> ${escapeHtml(cs.politicalIntelligence)}</a></li>
            <li><a href="${prefix}${sitemapFile}"><span aria-hidden="true">🗺️</span> ${escapeHtml(t.siteMap)}</a></li>
            <li><a href="${apiDocsHref}"><span aria-hidden="true">📚</span> ${escapeHtml(cs.linkApiDocs)}</a></li>
            <li><a href="https://github.com/Hack23/cia" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkCiaPlatform)}</a></li>
            <li><a href="https://github.com/Hack23/riksdagsmonitor" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkGithubRepo)}</a></li>
            <li><a href="https://www.riksdagen.se" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkRiksdag)}</a></li>
            <li><a href="${rssHref}" type="application/rss+xml" rel="alternate"><span aria-hidden="true">📡</span> ${escapeHtml(cs.linkRss)}</a></li>
          </ul>
        </section>
        <section class="rm-footer-col rm-footer-trust" aria-labelledby="rm-ft-trust">
          <h2 id="rm-ft-trust" class="rm-footer-heading">${escapeHtml(cs.footerBuiltByHeading)}</h2>
          <ul>
            <li><a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkHack23Home)}</a></li>
            <li><a href="https://www.hack23.com/riksdagsmonitor.html" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkHack23Riksdagsmonitor)}</a></li>
            <li><a href="https://www.hack23.com/riksdagsmonitor-features.html" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkHack23Features)}</a></li>
            <li><a href="https://github.com/sponsors/Hack23" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">💖</span> ${escapeHtml(cs.linkSponsorHack23)}</a></li>
            <li><a href="https://www.linkedin.com/company/hack23/" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkLinkedin)}</a></li>
            <li><a href="https://www.euparliamentmonitor.com" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkEuParliamentMonitor)}</a></li>
            <li><a href="https://www.hack23.com/blog.html" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkHack23Blog)}</a></li>
            <li><a href="https://github.com/Hack23" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkHack23Org)}</a></li>
            <li><a href="mailto:info@hack23.com">${escapeHtml(cs.linkContactUs)}</a></li>
          </ul>
        </section>
        <section class="rm-footer-col rm-footer-isms" aria-labelledby="rm-ft-isms">
          <h2 id="rm-ft-isms" class="rm-footer-heading"><span aria-hidden="true">🛡️</span> ${escapeHtml(cs.footerIsmsHeading)}</h2>
          <p class="rm-footer-isms-tagline">${cs.footerIsmsTagline}</p>
          <ul>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkPublicIsmsRepo)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkInfoSecPolicy)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Privacy_Policy.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkPrivacyPolicy)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkSecureDevPolicy)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkAiPolicy)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkThreatModeling)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkVulnMgmt)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkIncidentResponse)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Access_Control_Policy.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkAccessControl)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Cryptography_Policy.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkCryptoPolicy)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Open_Source_Policy.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkOpenSourcePolicy)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkChangeMgmt)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkClassification)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Security_Metrics.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkSecurityMetrics)}</a></li>
          </ul>
        </section>
        <section class="rm-footer-col rm-footer-trust" aria-labelledby="rm-ft-compliance">
          <h2 id="rm-ft-compliance" class="rm-footer-heading"><span aria-hidden="true">🔐</span> ${cs.footerComplianceHeading}</h2>
          <ul>
            <li><a href="${GITHUB_BLOB}/SECURITY.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkSecurityPolicy)}</a></li>
            <li><a href="${GITHUB_BLOB}/CRA-ASSESSMENT.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkCraAssessment)}</a></li>
            <li><a href="${GITHUB_BLOB}/THREAT_MODEL.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkThreatModel)}</a></li>
            <li><a href="${GITHUB_BLOB}/TRANSLATION_GUIDE.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkTranslationGuide)}</a></li>
            <li><a href="${GITHUB_BLOB}/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkContributing)}</a></li>
            <li><a href="${GITHUB_BLOB}/CODE_OF_CONDUCT.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkCodeOfConduct)}</a></li>
            <li><a href="${GITHUB_BLOB}/CHANGELOG.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkChangelog)}</a></li>
            <li><a href="${GITHUB_BLOB}/LICENSE" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkLicense)}</a></li>
            <li><a href="${issueHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkReportIssue)}</a></li>
          </ul>
        </section>
      </div>
      <nav class="rm-footer-trust-badges" aria-label="${escapeHtml(cs.trustBadgesAria)}">
        <a href="https://www.npmjs.com/package/riksdagsmonitor" target="_blank" rel="noopener noreferrer" aria-label="Riksdagsmonitor on npmjs">
          <img src="https://img.shields.io/npm/v/riksdagsmonitor.svg?logo=npm&label=npm" alt="Riksdagsmonitor on npmjs" width="100" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://scorecard.dev/viewer/?uri=github.com/Hack23/riksdagsmonitor" target="_blank" rel="noopener noreferrer" aria-label="OpenSSF Scorecard">
          <img src="https://api.securityscorecards.dev/projects/github.com/Hack23/riksdagsmonitor/badge" alt="OpenSSF Scorecard" width="120" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://www.bestpractices.dev/projects/12069" target="_blank" rel="noopener noreferrer" aria-label="OpenSSF Best Practices">
          <img src="https://www.bestpractices.dev/projects/12069/badge" alt="OpenSSF Best Practices" width="124" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/codeql.yml" target="_blank" rel="noopener noreferrer" aria-label="CodeQL workflow status">
          <img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/codeql.yml/badge.svg" alt="CodeQL workflow status" width="120" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/quality-checks.yml" target="_blank" rel="noopener noreferrer" aria-label="Quality checks workflow status">
          <img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/quality-checks.yml/badge.svg" alt="Quality checks workflow status" width="160" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/dependency-review.yml" target="_blank" rel="noopener noreferrer" aria-label="Dependency review workflow status">
          <img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/dependency-review.yml/badge.svg" alt="Dependency review workflow status" width="170" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/riksdagsmonitor/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" aria-label="Apache-2.0 License">
          <img src="https://img.shields.io/github/license/Hack23/riksdagsmonitor" alt="Apache-2.0 License" width="120" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer" aria-label="Hack23 ISMS-PUBLIC">
          <img src="https://img.shields.io/badge/Hack23-ISMS-blue?logo=shield" alt="Hack23 ISMS-PUBLIC" width="100" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="ISO 27001:2022 alignment">
          <img src="https://img.shields.io/badge/ISO-27001:2022-purple" alt="ISO 27001:2022 alignment" width="110" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="NIST CSF 2.0 alignment">
          <img src="https://img.shields.io/badge/NIST-CSF_2.0-orange" alt="NIST CSF 2.0 alignment" width="100" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="CIS Controls v8.1 alignment">
          <img src="https://img.shields.io/badge/CIS-Controls_v8.1-red" alt="CIS Controls v8.1 alignment" width="120" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://riksdagsmonitor.com" target="_blank" rel="noopener noreferrer" aria-label="Riksdagsmonitor.com website status">
          <img src="https://img.shields.io/website?url=https%3A%2F%2Friksdagsmonitor.com" alt="Riksdagsmonitor.com website status" width="120" height="20" loading="lazy" decoding="async">
        </a>
      </nav>
      <nav class="rm-footer-langs" aria-label="${escapeHtml(cs.footerLangsAria)}">
        <span class="rm-footer-langs-label" aria-hidden="true">🌐</span>
${footerLangRow}
      </nav>
      <p class="rm-footer-legal">
        © ${new Date().getFullYear()} ${cs.footerLegal}
      </p>
    </footer>
    <!-- Mermaid + back-to-top + theme toggle bootstrap.
         The src strings below are imperatively assembled at runtime so that
         Vite's HTML/script-tag transformer does NOT try to bundle, hash and
         re-emit the underlying modules under \`/assets/…\` (which previously
         caused 404s like \`/assets/mermaid.esm.min-XXXX.mjs\` whenever the
         pinned \`mermaid\` devDependency was upgraded between deploys).
         The unhashed runtime files live under \`/js/lib/\` and \`/js/\` and are
         deployed verbatim to S3 by the "Copy JS libraries to build output"
         step in \`.github/workflows/deploy-s3.yml\`. -->
    <script>
      (function () {
        function inject(src, isModule) {
          var s = document.createElement('script');
          if (isModule) s.type = 'module';
          else s.defer = true;
          s.src = src;
          document.head.appendChild(s);
        }
        inject('/js/lib/mermaid-init.mjs', true);
        inject('/js/back-to-top.js', true);
        inject('/js/theme-toggle.js', false);
      })();
    </script>
  </body>
</html>
`;
}
