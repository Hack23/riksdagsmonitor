---
name: input-validation
description: Input validation and sanitization patterns for preventing XSS, injection attacks, and ensuring data integrity
license: Apache-2.0
---

# Input Validation Skill

## Purpose
Defines input validation and sanitization patterns for preventing security vulnerabilities and ensuring data integrity.

## Core Principles
1. **Validate all input** — Never trust user-supplied data
2. **Allowlist over denylist** — Define what IS allowed
3. **Validate on server-side** — Client-side validation is UX only
4. **Encode output** — Context-appropriate encoding
5. **Fail securely** — Reject invalid input with safe defaults

## HTML/Static Site Validation
- Sanitize any user-generated content before rendering
- Use `textContent` instead of `innerHTML` when possible
- Escape HTML entities (`&`, `<`, `>`, `"`, `'`)
- Validate URL inputs (protocol allowlist: https only)
- Use Content Security Policy (CSP) headers

## XSS Prevention
```javascript
// Use DOMPurify or built-in escaping
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

## JSON Schema Validation
- Validate API response data against schemas
- Use AJV for JSON Schema validation
- Define strict schemas for all data structures

## URL Validation
- Allowlist protocols (https only)
- Validate domain against known sources
- Sanitize query parameters
- Prevent open redirect vulnerabilities

## ISO 27001 Mapping
- A.8.26 — Application security requirements
- A.8.28 — Secure coding

## Related Policies
- [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md)
