/**
 * @module Infrastructure/VisualEvidence
 * @category Infrastructure
 * 
 * @title Screenshot Capture Utility - Visual Evidence & Quality Validation
 * 
 * @description
 * **INTELLIGENCE OPERATIVE PERSPECTIVE**
 * 
 * This utility captures screenshots of articles at specified viewport sizes,
 * providing visual evidence of article publication state and enabling visual
 * regression testing. In intelligence operations, visual evidence archives
 * serve as contemporaneous documentation of what was published and when,
 * supporting incident investigation and regulatory compliance.
 * 
 * **SCREENSHOT PURPOSES:**
 * Visual capture serves multiple operational functions:
 * 1. **Publication Evidence**: Screenshot timestamp proves when article published
 * 2. **Quality Validation**: Visual check that formatting is correct
 * 3. **Accessibility Verification**: Visual representation of actual rendering
 * 4. **Regression Testing**: Comparison against previous versions
 * 5. **PR Evidence**: Screenshots included in pull requests show visual changes
 * 6. **Incident Investigation**: Archive shows what was published if dispute arises
 * 
 * **VIEWPORT CONFIGURATIONS:**
 * Captures at standard responsive design breakpoints:
 * - **Mobile** (375x667): Primary device for news consumption
 * - **Tablet** (768x1024): Secondary device for analytical reading
 * - **Desktop** (1920x1080): Full-featured reading on workstations
 * 
 * Each viewport captures how content appears on that device class.
 * 
 * **CAPTURE WORKFLOW:**
 * 1. Launch Chromium headless browser
 * 2. Navigate to article HTML file via file:// protocol
 * 3. Set viewport size
 * 4. Wait for page load completion
 * 5. Capture screenshot to PNG file
 * 6. Close browser
 * 7. Log capture result
 * 
 * **FILENAME CONVENTION:**
 * Screenshots named: `{article-date}-{lang}-{viewport}.png`
 * Example: `2026-02-13-evening-analysis-en-mobile.png`
 * 
 * **OUTPUT DIRECTORY:**
 * Screenshots saved to: `screenshots/` directory
 * - Created if doesn't exist
 * - Organized by date and language
 * - Suitable for retention in git LFS or artifact storage
 * 
 * **PERFORMANCE CHARACTERISTICS:**
 * - Browser launch: ~3 seconds (one-time per run)
 * - Page load: ~1 second per article
 * - Screenshot capture: ~500ms per viewport
 * - Total: ~5 seconds per article (3 viewports)
 * 
 * **HEADLESS BROWSER ADVANTAGES:**
 * Using Playwright with Chromium headless:
 * - No display server required (runs in CI/CD)
 * - Deterministic rendering (consistent output)
 * - Fast execution (no UI overhead)
 * - Resource efficient (minimal memory)
 * - Works in containerized environments
 * 
 * **INTELLIGENCE APPLICATIONS:**
 * 1. **Publication Verification**: Prove article was published as expected
 * 2. **Quality Audit**: Visual check of formatting consistency
 * 3. **Regression Detection**: Unintended layout changes visible immediately
 * 4. **Incident Timeline**: Screenshot timestamps prove publication sequence
 * 5. **Dispute Resolution**: Visual evidence in publication disputes
 * 
 * **COMPLIANCE & AUDIT TRAIL:**
 * Screenshot archives support regulatory compliance:
 * - **Evidence Preservation**: Timestamps prove publication state
 * - **Audit Trail**: Screenshot progression shows editorial changes
 * - **Regulatory Compliance**: Supports GDPR article preservation requirements
 * - **Dispute Resolution**: Visual evidence in copyright/licensing disputes
 * 
 * **ACCESSIBILITY VERIFICATION:**
 * Screenshots enable visual accessibility checking:
 * - Color contrast visibility
 * - Text rendering quality
 * - Layout integrity across languages
 * - Special character rendering (CJK, RTL)
 * 
 * **RTL LANGUAGE CONSIDERATIONS:**
 * Hebrew and Arabic articles displayed with RTL layout:
 * - Screenshot captures actual RTL rendering
 * - Validates right-to-left text flow
 * - Confirms punctuation/number placement
 * - Checks overall document flow direction
 * 
 * **ARCHIVAL & STORAGE:**
 * Screenshot files support long-term archival:
 * - PNG format: Lossless, standard format, browser-compatible
 * - Timestamps: Embedded in filename and metadata
 * - Retention: 180-day minimum for compliance
 * - Organization: Structured by date and language
 * 
 * **FAILURE HANDLING:**
 * - Browser launch failure: Clear error message, exit code 1
 * - Page load timeout: Report timeout, skip screenshot
 * - Screenshot write error: Log disk/permission issue
 * - File:// protocol issues: Report path resolution problem
 * 
 * **INTEGRATION WITH CI/CD:**
 * Screenshots automatically captured during:
 * - Pull request validation (visual regression check)
 * - Pre-publication verification
 * - Deployment validation
 * - Incident investigation
 * 
 * **GDPR COMPLIANCE ASPECTS:**
 * Archival of screenshots supports data governance:
 * - **Data Subject Access Requests**: Screenshots show what data published about person
 * - **Right to Erasure**: Screenshot archive shows when content was removed
 * - **Breach Notification**: Screenshots document what was exposed
 * - **Audit Trails**: Screenshots support accountability
 * 
 * **SECURITY IMPLICATIONS:**
 * Screenshot management requires care:
 * - **Access Control**: Restrict who can view screenshots
 * - **Sensitive Data**: Ensure no passwords/keys in images
 * - **Integrity**: Checksums verify screenshots unmodified
 * - **Deletion**: Secure deletion for sensitive content
 * 
 * @osint Visual Intelligence Collection
 * - Screenshots serve as intelligence evidence
 * - Timestamps create publication timeline
 * - Visual details reveal editorial decisions
 * - Archives support historical analysis
 * 
 * @risk Visual Tampering Detection
 * - Screenshot comparison detects unauthorized changes
 * - Timestamp validation prevents backdated screenshots
 * - File integrity checking prevents modification
 * - Regression testing catches subtle changes
 * 
 * @gdpr Data Visibility Documentation
 * - Screenshots show what personal data visible
 * - Supports data subject access requests
 * - Documents data retention practices
 * - Audit trail for compliance review
 * 
 * @security Content Integrity Verification
 * - Validates article HTML renders correctly
 * - Detects CSS/layout tampering
 * - Verifies expected content displays
 * - Timestamp prevents false-dated screenshots
 * 
 * @author Hack23 AB (Visual Quality & Evidence Management)
 * @license Apache-2.0
 * @version 2.0.0
 * @since 2024-07-10
 * @see https://playwright.dev/ (Browser Automation Framework)
 * @see tests/visual-regression.test.js (Visual Regression Tests)
 * @see Issue #119 (Screenshot Management)
 */
