---
name: secure-code-review
description: Security code review for HTML/CSS/JavaScript in static websites
license: Apache-2.0
---

# Secure Code Review (Static Site)

## Purpose

Perform security-focused code reviews for static HTML/CSS websites.

## Review Checklist

### HTML Security
- ✅ No inline JavaScript (CSP compliance)
- ✅ Semantic HTML5 elements
- ✅ ARIA labels for accessibility
- ✅ Proper `<meta>` tags (CSP, referrer, viewport)
- ✅ External links use `rel="noopener noreferrer"`
- ✅ Forms use `method="POST"` and HTTPS action

### CSS Security
- ✅ No `@import` from external domains
- ✅ No `url()` to untrusted sources
- ✅ Inline styles minimized
- ✅ No user-controlled CSS injection

### Link Security
- ✅ All links use HTTPS
- ✅ No broken links (linkinator check)
- ✅ External links reviewed for legitimacy

### Configuration Security
- ✅ No secrets in repository
- ✅ `.gitignore` configured correctly
- ✅ Workflow permissions minimal
- ✅ Branch protection enabled

## Automated Checks

```yaml
# PR review workflow
- HTMLHint validation
- CSSLint validation  
- Link checking
- Secret scanning
- Accessibility audit
```

## References

- **SECURITY.md**: Security policy
- **CONTRIBUTING.md**: Contribution guidelines
