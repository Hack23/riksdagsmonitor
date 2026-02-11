# CloudFront Functions

This directory contains CloudFront Functions used by the riksdagsmonitor distribution.

## 📁 Files

### `url-rewrite.js`
**Purpose:** Automatic directory index handling for CloudFront

**Problem:** CloudFront's `DefaultRootObject` only applies to the root path (`/`). When users access `/news/`, CloudFront doesn't automatically serve `/news/index.html`.

**Solution:** This CloudFront Function rewrites directory requests to append `index.html`:
- `/news/` → `/news/index.html`
- `/news` → `/news/index.html`
- `/dashboard/` → `/dashboard/index.html`

**Type:** Viewer Request function

**Deployment:** See [CLOUDFRONT_FUNCTION_DEPLOYMENT.md](../../docs/CLOUDFRONT_FUNCTION_DEPLOYMENT.md) for deployment instructions.

## 🔧 Testing Locally

CloudFront Functions can be tested in the AWS Console:

1. AWS Console → CloudFront → Functions
2. Create/open function
3. Use the Test tab with sample events
4. Verify URI rewrites as expected

## 📚 Documentation

- [CloudFront Functions Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html)
- [Deployment Instructions](../../docs/CLOUDFRONT_FUNCTION_DEPLOYMENT.md)

## 🔒 Security

- **Input Validation:** URI format checks before rewriting
- **No External Dependencies:** Pure JavaScript, no external libraries
- **Minimal Footprint:** <1KB function size (10KB limit)
- **Fast Execution:** Sub-millisecond at edge locations

## 📋 ISMS Compliance

- **ISO 27001:2022 A.8.9:** Configuration Management
- **NIST CSF 2.0 PR.IP-1:** Baseline configuration maintained
- **CIS Controls v8.1 Control 4.1:** Secure configuration for network devices
