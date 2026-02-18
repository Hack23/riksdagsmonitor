# Release Process Guide

This guide describes how to create releases for Riksdagsmonitor with full attestations and documentation-as-code.

**Document Classification:** 🟢 Public  
**Last Updated:** 2026-02-18  
**Owner:** Hack23 AB  
**Review Cycle:** Per release

## Table of Contents

1. [Overview](#overview)
2. [Release Workflow](#release-workflow)
3. [Triggering a Release](#triggering-a-release)
4. [Release Artifacts](#release-artifacts)
5. [Documentation as Code](#documentation-as-code)
6. [Security & Attestations](#security--attestations)
7. [Deployment](#deployment)
8. [Verification](#verification)
9. [Troubleshooting](#troubleshooting)

## Overview

Riksdagsmonitor follows a comprehensive release process that includes:

- ✅ Automated testing (unit + E2E)
- ✅ Documentation generation (API, coverage, E2E reports)
- ✅ SLSA Build Provenance attestations
- ✅ SBOM (Software Bill of Materials) generation
- ✅ Dual deployment (S3/CloudFront + GitHub Pages)
- ✅ Automated release notes

## Release Workflow

The release workflow consists of 3 jobs:

### 1. Prepare Job

**Purpose**: Build, test, and generate all documentation

**Steps**:
1. Set up test environment (Xvfb, Chrome, dependencies)
2. Install npm dependencies
3. Build application with Vite
4. Run unit tests with coverage
5. Run E2E tests with Cypress
6. Clean old documentation
7. Generate API documentation (JSDoc)
8. Generate dependency tree
9. Copy test reports to docs/
10. Create documentation index (docs/index.html)
11. Update sitemap.xml
12. Deploy documentation to GitHub Pages

**Duration**: ~10-15 minutes

### 2. Build Job

**Purpose**: Create release artifacts with attestations

**Steps**:
1. Build production application
2. Create release zip file
3. Generate SHA-256 checksum
4. Generate SBOM (SPDX format)
5. Create build provenance attestation
6. Create SBOM attestation
7. Upload artifacts

**Duration**: ~5 minutes

### 3. Release Job

**Purpose**: Create GitHub release and deploy to production

**Steps**:
1. Download build and security artifacts
2. Generate release notes with Release Drafter
3. Create GitHub Release with all artifacts
4. Extract build to repository root
5. Deploy to S3/CloudFront with cache headers
6. Invalidate CloudFront cache
7. Display deployment summary

**Duration**: ~5-10 minutes

**Total Workflow Duration**: ~20-30 minutes

## Triggering a Release

### Option 1: Manual Release (Recommended)

1. Go to Actions → Release with Attestations → Run workflow
2. Enter version (e.g., `v1.0.0`)
3. Select prerelease flag (if applicable)
4. Click "Run workflow"

This will:
- Update package.json version
- Create and push a git tag
- Trigger the full release workflow

### Option 2: Tag-based Release

1. Create and push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

This will automatically trigger the release workflow.

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **Major** (v2.0.0): Breaking changes
- **Minor** (v1.1.0): New features (backward compatible)
- **Patch** (v1.0.1): Bug fixes (backward compatible)

## Release Artifacts

Each release includes the following artifacts:

### Application Artifacts

- **`riksdagsmonitor-vX.Y.Z.zip`** - Production build
  - Minified and optimized for production
  - All HTML, CSS, JS, and assets
  - Ready for deployment

- **`riksdagsmonitor-vX.Y.Z.zip.sha256`** - Checksum
  - SHA-256 hash for integrity verification

### Security Artifacts

- **`riksdagsmonitor-vX.Y.Z.spdx.json`** - SBOM
  - Software Bill of Materials in SPDX format
  - Complete dependency inventory
  - License information

- **`riksdagsmonitor-vX.Y.Z.zip.intoto.jsonl`** - Build Provenance
  - SLSA Build Provenance attestation
  - Verifiable build metadata
  - Supply chain security

- **`riksdagsmonitor-vX.Y.Z.spdx.json.intoto.jsonl`** - SBOM Attestation
  - Attestation for the SBOM
  - Cryptographically signed

## Documentation as Code

All documentation is generated during the release and committed to the `docs/` directory:

### Generated Documentation

```
docs/
├── index.html                    # Documentation hub (landing page)
├── .nojekyll                     # Bypass Jekyll processing
├── api/                          # JSDoc API documentation
│   ├── index.html
│   ├── global.html
│   └── ...
├── coverage/                     # Vitest coverage reports
│   ├── index.html               # Interactive coverage viewer
│   ├── lcov.info
│   └── coverage-final.json
├── test-results/                 # Vitest test results
├── cypress/                      # Cypress E2E test reports
├── dependencies/                 # npm dependency tree
│   ├── dependency-tree.json
│   └── dependency-tree.txt
└── diagrams/                     # Architecture diagrams
```

### Accessing Documentation

- **Documentation Hub**: https://riksdagsmonitor.com/docs/
- **API Documentation**: https://riksdagsmonitor.com/docs/api/
- **Test Coverage**: https://riksdagsmonitor.com/docs/coverage/
- **E2E Reports**: https://riksdagsmonitor.com/docs/cypress/
- **Dependencies**: https://riksdagsmonitor.com/docs/dependencies/

## Security & Attestations

### SLSA Build Provenance

Every release includes [SLSA Build Provenance](https://slsa.dev/) attestations that:

- Prove the artifact was built by GitHub Actions
- Include build metadata (commit SHA, workflow, runner)
- Are cryptographically signed and verifiable

### SBOM (Software Bill of Materials)

Every release includes an SBOM in SPDX format that:

- Lists all dependencies (direct + transitive)
- Includes version information
- Provides license details
- Enables vulnerability tracking

### Verification

Verify attestations using the GitHub CLI:

```bash
# Install GitHub CLI
brew install gh

# Verify build provenance
gh attestation verify riksdagsmonitor-v1.0.0.zip -R Hack23/riksdagsmonitor

# View attestation details
gh attestation view riksdagsmonitor-v1.0.0.zip -R Hack23/riksdagsmonitor
```

### Checksum Verification

Verify artifact integrity:

```bash
# Download artifacts
wget https://github.com/Hack23/riksdagsmonitor/releases/download/v1.0.0/riksdagsmonitor-v1.0.0.zip
wget https://github.com/Hack23/riksdagsmonitor/releases/download/v1.0.0/riksdagsmonitor-v1.0.0.zip.sha256

# Verify checksum
sha256sum -c riksdagsmonitor-v1.0.0.zip.sha256
```

## Deployment

### Dual Deployment Strategy

Every release is deployed to two locations:

#### 1. Primary: AWS S3/CloudFront

- **URL**: https://riksdagsmonitor.com
- **Infrastructure**: S3 bucket + CloudFront CDN
- **Benefits**: 
  - Global CDN (low latency worldwide)
  - Custom cache headers (1 hour HTML, 1 year assets)
  - CloudFront edge locations
  - 99.9% SLA

#### 2. Backup: GitHub Pages

- **URL**: https://hack23.github.io/riksdagsmonitor (via main branch)
- **Infrastructure**: GitHub Pages
- **Benefits**:
  - Free hosting
  - Automatic SSL
  - Version control integration
  - Disaster recovery

### Cache Strategy

Optimized cache headers for performance:

- **HTML files**: `max-age=3600, must-revalidate` (1 hour)
- **CSS/JS/Images**: `max-age=31536000, immutable` (1 year)
- **Metadata (XML/JSON)**: `max-age=86400` (1 day)
- **Documentation**: `max-age=86400` (1 day)

### CloudFront Invalidation

After deployment, CloudFront cache is invalidated (`/*`) to ensure fresh content.

## Verification

After a release, verify:

### 1. GitHub Release

- [ ] Release created at https://github.com/Hack23/riksdagsmonitor/releases
- [ ] All artifacts uploaded
- [ ] Release notes generated
- [ ] Attestations available

### 2. Primary Deployment (S3/CloudFront)

- [ ] Visit https://riksdagsmonitor.com
- [ ] Verify application loads
- [ ] Check version in footer or version.txt
- [ ] Test key functionality

### 3. Backup Deployment (GitHub Pages)

- [ ] Visit GitHub Pages URL
- [ ] Verify application loads
- [ ] Compare with primary deployment

### 4. Documentation

- [ ] Visit https://riksdagsmonitor.com/docs/
- [ ] Check API documentation
- [ ] Review coverage report
- [ ] Verify E2E test reports

### 5. Attestations

```bash
# Verify build provenance
gh attestation verify riksdagsmonitor-v1.0.0.zip -R Hack23/riksdagsmonitor

# Should output: ✓ Verification succeeded!
```

## Troubleshooting

### Build Failure

**Symptom**: Prepare job fails during build or tests

**Common Causes**:
- Test failures (unit or E2E)
- Build errors (Vite)
- Missing dependencies

**Solution**:
1. Review workflow logs
2. Fix failing tests or build errors
3. Test locally: `npm run build && npm test && npm run e2e`
4. Re-trigger release

### Attestation Generation Failure

**Symptom**: Build job fails during attestation generation

**Common Causes**:
- Missing OIDC permissions
- Artifact not found
- SBOM generation failure

**Solution**:
1. Verify `id-token: write` and `attestations: write` permissions
2. Check artifact was uploaded correctly
3. Review SBOM action logs

### S3 Deployment Failure

**Symptom**: Release job fails during S3 sync

**Common Causes**:
- AWS credentials expired
- S3 bucket not accessible
- CloudFront distribution not found

**Solution**:
1. Verify AWS OIDC role configuration
2. Check S3 bucket exists and is accessible
3. Verify CloudFront distribution ID

### Documentation Not Generated

**Symptom**: docs/ directory empty or incomplete

**Common Causes**:
- JSDoc generation failed
- Coverage report not created
- Test reports missing

**Solution**:
1. Review prepare job logs
2. Check for errors in documentation generation steps
3. Verify all scripts in package.json are correct

### Release Notes Not Generated

**Symptom**: Release notes are empty or incorrect

**Common Causes**:
- .github/release-drafter.yml misconfigured
- Labels missing on PRs
- Release Drafter action failed

**Solution**:
1. Verify .github/release-drafter.yml exists
2. Check PR labels match release-drafter.yml categories
3. Review Release Drafter action logs

## Best Practices

### Before Release

1. ✅ Ensure all tests pass locally
2. ✅ Review CHANGELOG or recent PRs
3. ✅ Update version in package.json (if manual release)
4. ✅ Tag commit with descriptive message
5. ✅ Notify team of upcoming release

### After Release

1. ✅ Verify deployment on both primary and backup
2. ✅ Test key functionality
3. ✅ Review documentation
4. ✅ Announce release to stakeholders
5. ✅ Monitor for issues

### Security Checklist

- [ ] All GitHub Actions pinned to SHA
- [ ] Harden-runner enabled
- [ ] OIDC authentication for AWS (no long-lived credentials)
- [ ] Least privilege permissions
- [ ] Attestations generated and verifiable
- [ ] SBOM included
- [ ] CodeQL scanning passed
- [ ] Dependency scanning passed
- [ ] Secret scanning passed

## References

- [SLSA Framework](https://slsa.dev/)
- [SPDX Specification](https://spdx.dev/)
- [GitHub Attestations](https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds)
- [Release Drafter](https://github.com/release-drafter/release-drafter)
- [Semantic Versioning](https://semver.org/)

---

**Maintained by**: Hack23 AB  
**License**: Apache License 2.0  
**Support**: https://github.com/Hack23/riksdagsmonitor/issues
