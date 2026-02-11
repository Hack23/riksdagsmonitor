# News Directory

This directory contains the automated news experience for the Riksdagsmonitor platform, focusing on political journalism about the Swedish Parliament (Riksdag) and Government (Regering).

## Overview

The news system provides:

- **News index pages** - Browsing and discovery interface for articles (EN/SV)
- **Automated generation** - Scripts and workflows for content creation
- **Sitemap integration** - Automatic SEO optimization

## Documentation

For implementation details, refer to the canonical documentation in the repository:

- **Architecture**: See `ARCHITECTURE.md` for system design and news subsystem
- **Workflows**: See `.github/workflows/` and workflow documentation for automation details
- **Scripts**: See `scripts/generate-news.js` and `scripts/generate-sitemap.js` for implementation

This README is intentionally minimal to maintain a single source of truth and reduce documentation drift.

## Article Types

The automated news system focuses on recurring political coverage patterns:
- Forward-looking previews (Week Ahead)
- Committee-related analyses
- Government propositions
- Opposition motions
- Event-driven explainers

See the workflow and script documentation for specific article type definitions, templates, and generation rules.

---

*For historical context: Earlier versions of this file contained detailed workflow, script, and example output descriptions. These were intentionally consolidated into repo-wide documentation to prevent duplication and maintain accuracy.*
