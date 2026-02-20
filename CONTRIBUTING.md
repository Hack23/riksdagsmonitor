<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🤝 Contributing — Riksdagsmonitor</h1>

<p align="center">
  <strong>🛡️ Secure Contribution Guidelines</strong><br>
  <em>🎯 Building Democratic Transparency Through Collaborative Excellence</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--02--20-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Review-Quarterly-orange?style=for-the-badge" alt="Review Cycle"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-02-20 (UTC)  
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-05-20  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 🎯 **Purpose Statement**

This contributing guide establishes secure contribution procedures for Riksdagsmonitor, implementing [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) and [Change Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md) from Hack23 AB's ISMS framework.

We believe in **security through transparency** and **continuous improvement**, welcoming contributions that enhance democratic transparency while maintaining our high security standards.

*— James Pether Sörling, CEO/Founder*

---

## Contributing

[fork]: /fork
[pr]: /compare
[code-of-conduct]: CODE_OF_CONDUCT.md

Hi there! We're thrilled that you'd like to contribute to Riksdagsmonitor. Your help is essential for keeping it great.

Please note that this project is released with a [Contributor Code of Conduct][code-of-conduct]. By participating in this project you agree to abide by its terms.

## Issues and PRs

If you have suggestions for how this project could be improved, or want to report a bug, open an issue! We'd love all and any contributions. If you have questions, too, we'd love to hear them.

We'd also love PRs. If you're thinking of a large PR, we advise opening up an issue first to talk about it, though! Look at the links below if you're not sure how to open a PR.

## Submitting a Pull Request

1. [Fork][fork] and clone the repository.
2. Install dependencies: `npm install`
3. Make sure the tests pass on your machine: `npm test`
4. Create a new branch: `git checkout -b my-branch-name`
5. Make your change, add tests, and make sure the tests still pass.
6. Validate HTML: `npx htmlhint *.html`
7. Push to your fork and [submit a pull request][pr].
8. Pat yourself on the back and wait for your pull request to be reviewed and merged.

Here are a few things you can do that will increase the likelihood of your pull request being accepted:

- Follow the existing code style (HTML5 semantic markup, CSS custom properties, mobile-first design)
- Write and update tests (Vitest for unit tests, Cypress for E2E)
- Keep your changes as focused as possible
- Ensure WCAG 2.1 AA accessibility compliance
- Validate HTML with HTMLHint before submitting
- Write a [good commit message](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html)

Work in Progress pull requests are also welcome to get feedback early on.

## 🏗️ Project Structure

| Directory | Purpose |
|-----------|---------|
| `*.html` | Multi-language index pages (14 languages) |
| `styles.css` | Cyberpunk theme design system |
| `js/` | Dashboard JavaScript modules (Chart.js, D3.js) |
| `dashboard/` | Interactive intelligence dashboards |
| `news/` | Generated political news articles |
| `scripts/` | Build, generation, and utility scripts |
| `tests/` | Vitest unit tests |
| `cypress/` | Cypress E2E tests |
| `cia-data/` | CIA platform data exports |

## ✅ Quality Gates

All PRs must pass these quality gates before merge:

| Check | Tool | Purpose |
|-------|------|---------|
| HTML Validation | HTMLHint | Standards compliance |
| Link Checking | Linkinator | Verify internal/external links |
| JavaScript Linting | ESLint | Code quality |
| Unit Tests | Vitest | Functionality verification |
| Security Scanning | CodeQL, Dependabot | Vulnerability detection |
| Secret Scanning | GitHub | Credential leak prevention |

## 🌐 Multi-Language Support

Riksdagsmonitor supports 14 languages. When making content changes:

- Update all affected language files
- Use `lang` attribute on `<html>` tags
- Support RTL for Arabic (`index_ar.html`) and Hebrew (`index_he.html`)
- Include `hreflang` tags for SEO
- See [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md) for vocabulary reference

## 🤖 GitHub Copilot Agents

This project has 14 specialized GitHub Copilot agents to assist development:

- **security-architect** — Security architecture and ISMS compliance
- **documentation-architect** — C4 models and technical documentation
- **quality-engineer** — HTML/CSS validation and accessibility
- **frontend-specialist** — Responsive design and multi-language support
- **intelligence-operative** — Political data analysis
- **content-generator** — Automated news generation

Learn more in [AGENTS.md](AGENTS.md).

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://help.github.com)

---

## 📚 Related Documents

### 🛠️ Development & Security Policies
- [🛠️ Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md) — Development security standards
- [📝 Change Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md) — Change control procedures
- [🔐 Information Security Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) — Overall security governance
- [🔍 Vulnerability Management](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md) — Security testing and remediation

### 📝 Project Documentation
- [📋 README](README.md) — Project overview and classification
- [🔐 Security Policy](SECURITY.md) — Vulnerability reporting
- [📜 Code of Conduct](CODE_OF_CONDUCT.md) — Community standards
- [🏗️ Architecture](ARCHITECTURE.md) — System architecture
- [🔧 Workflows](WORKFLOWS.md) — CI/CD documentation
- [🧪 Testing](TESTING.md) — Test strategy and coverage

---

**📋 Document Control:**  
**✅ Approved by:** James Pether Sörling, CEO  
**📤 Distribution:** Public  
**🏷️ Classification:** [![Confidentiality: Public](https://img.shields.io/badge/C-Public-lightgrey?style=flat-square)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md#confidentiality-levels)  
**📅 Effective Date:** 2026-02-20  
**⏰ Next Review:** 2026-05-20  
**🎯 Framework Compliance:** [![ISO 27001](https://img.shields.io/badge/ISO_27001-2022_Aligned-blue?style=flat-square&logo=iso&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) [![NIST CSF 2.0](https://img.shields.io/badge/NIST_CSF-2.0_Aligned-green?style=flat-square&logo=nist&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) [![CIS Controls](https://img.shields.io/badge/CIS_Controls-v8.1_Aligned-orange?style=flat-square&logo=cisecurity&logoColor=white)](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md)
