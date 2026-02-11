# CloudFront Function Deployment Guide

**Document Classification:** 🟢 Public  
**Last Updated:** 2026-02-11  
**Owner:** Hack23 AB (Org.nr 5595347807)  
**Review Cycle:** Quarterly

## 📋 Overview

This document provides instructions for deploying the CloudFront Function that fixes the subdirectory index issue (`/news/` not serving `index.html`).

## 🎯 Problem Statement

CloudFront's `DefaultRootObject` only applies to the root path (`/`), not subdirectories. When users access `https://riksdagsmonitor.com/news/`, CloudFront doesn't automatically serve `news/index.html`, resulting in an error or fallback to the main page.

## 🔧 Solution: CloudFront Function

We've created a lightweight CloudFront Function that rewrites directory requests to append `index.html`:

- **Function:** `.github/cloudfront-functions/url-rewrite.js`
- **Type:** Viewer Request function
- **Purpose:** Automatic directory index handling

## 📦 Deployment Methods

### Method 1: AWS Console (Manual)

#### Step 1: Create the Function

1. Open AWS Console → CloudFront → Functions
2. Click **Create function**
3. Configure:
   - **Name:** `riksdagsmonitor-url-rewrite`
   - **Runtime:** CloudFront Functions
4. Paste the code from `.github/cloudfront-functions/url-rewrite.js`
5. Click **Save changes**

#### Step 2: Test the Function

1. In the function editor, go to **Test** tab
2. Create test events:

**Test Event 1: Directory with trailing slash**
```json
{
  "version": "1.0",
  "context": {
    "eventType": "viewer-request"
  },
  "viewer": {
    "ip": "1.2.3.4"
  },
  "request": {
    "method": "GET",
    "uri": "/news/",
    "headers": {}
  }
}
```
Expected: `uri` should be rewritten to `/news/index.html`

**Test Event 2: Directory without trailing slash**
```json
{
  "version": "1.0",
  "context": {
    "eventType": "viewer-request"
  },
  "viewer": {
    "ip": "1.2.3.4"
  },
  "request": {
    "method": "GET",
    "uri": "/news",
    "headers": {}
  }
}
```
Expected: `uri` should be rewritten to `/news/index.html`

**Test Event 3: Direct file (no change)**
```json
{
  "version": "1.0",
  "context": {
    "eventType": "viewer-request"
  },
  "viewer": {
    "ip": "1.2.3.4"
  },
  "request": {
    "method": "GET",
    "uri": "/news/article.html",
    "headers": {}
  }
}
```
Expected: `uri` remains `/news/article.html` (unchanged)

3. Click **Test** for each event
4. Verify the output shows expected URI rewrites

#### Step 3: Publish the Function

1. Once testing passes, click **Publish** tab
2. Click **Publish function**
3. Note the function ARN (e.g., `arn:aws:cloudfront::172017021075:function/riksdagsmonitor-url-rewrite`)

#### Step 4: Associate with CloudFront Distribution

1. Open CloudFront → Distributions
2. Find the distribution for `riksdagsmonitor.com`
3. Go to **Behaviors** tab
4. Edit the **Default (*)** behavior
5. Scroll to **Function associations**
6. Under **Viewer request**, select:
   - **Function type:** CloudFront Functions
   - **Function ARN:** `riksdagsmonitor-url-rewrite`
7. Click **Save changes**
8. Wait 5-10 minutes for distribution update to complete

#### Step 5: Verify the Fix

1. Wait for CloudFront distribution status to change from "Deploying" to "Deployed"
2. Test the URLs:
   - `https://riksdagsmonitor.com/news/` → Should show news index
   - `https://riksdagsmonitor.com/news` → Should show news index
   - `https://riksdagsmonitor.com/` → Should show main page
3. Check browser Network tab to confirm proper responses (200 OK)

### Method 2: AWS CLI (Automated)

```bash
# 1. Create the function
aws cloudfront create-function \
  --name riksdagsmonitor-url-rewrite \
  --function-config Comment="URL rewrite for directory index",Runtime=cloudfront-js-2.0 \
  --function-code fileb://.github/cloudfront-functions/url-rewrite.js \
  --region us-east-1

# 2. Get the ETag from the response (needed for publish)
ETAG=$(aws cloudfront describe-function \
  --name riksdagsmonitor-url-rewrite \
  --query 'ETag' \
  --output text \
  --region us-east-1)

# 3. Publish the function
aws cloudfront publish-function \
  --name riksdagsmonitor-url-rewrite \
  --if-match $ETAG \
  --region us-east-1

# 4. Get CloudFront distribution ID
DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name riksdagsmonitor-frontend \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text \
  --region us-east-1)

# 5. Get current distribution config
aws cloudfront get-distribution-config \
  --id $DIST_ID \
  --output json > /tmp/dist-config.json

# 6. Update the config to include the function (requires manual JSON editing)
# Add to DefaultCacheBehavior.FunctionAssociations:
# {
#   "Quantity": 1,
#   "Items": [
#     {
#       "FunctionARN": "arn:aws:cloudfront::172017021075:function/riksdagsmonitor-url-rewrite",
#       "EventType": "viewer-request"
#     }
#   ]
# }

# 7. Update distribution with new config
aws cloudfront update-distribution \
  --id $DIST_ID \
  --distribution-config file:///tmp/dist-config-updated.json \
  --if-match $(jq -r .ETag /tmp/dist-config.json)
```

### Method 3: GitHub Actions (Infrastructure as Code)

**Future Enhancement:** Add CloudFront Function deployment to `.github/workflows/deploy-s3.yml`

This would require:
1. Storing the function code in the repository (✅ Done: `.github/cloudfront-functions/url-rewrite.js`)
2. Adding AWS CLI commands to create/update the function
3. Associating the function with the CloudFront distribution
4. Handling idempotency (check if function exists before creating)

## 🧪 Testing

### Manual Testing Checklist

- [ ] `/news/` returns 200 OK and displays news index
- [ ] `/news` (no trailing slash) returns 200 OK and displays news index
- [ ] `/news/index.html` returns 200 OK
- [ ] `/` returns 200 OK and displays main page
- [ ] `/index.html` returns 200 OK
- [ ] Specific article URLs work (e.g., `/news/2026-02-10-week-ahead-en.html`)
- [ ] All 14 language news pages work (e.g., `/news/index_sv.html`, `/news/index_ja.html`)

### Automated Testing

```bash
# Test news directory (with trailing slash)
curl -I https://riksdagsmonitor.com/news/

# Test news directory (without trailing slash)
curl -I https://riksdagsmonitor.com/news

# Test specific article
curl -I https://riksdagsmonitor.com/news/2026-02-10-week-ahead-en.html

# Expected: All return 200 OK
```

## 📊 Performance Impact

CloudFront Functions are:
- **Fast:** Sub-millisecond execution time
- **Efficient:** Run at all CloudFront edge locations (400+ globally)
- **Cost-effective:** $0.10 per 1 million invocations
- **Lightweight:** 10KB maximum function size (our function is <1KB)

## 🔄 Alternative Solutions

### Option 1: Lambda@Edge (Not Recommended)

Lambda@Edge is more powerful but:
- **Slower:** 5-50ms execution time (vs. <1ms for CloudFront Functions)
- **More expensive:** $0.60 per 1 million requests + compute time
- **Complex:** Requires Node.js runtime, IAM roles, replication to all edge locations
- **Overkill:** For simple URL rewriting, CloudFront Functions are sufficient

### Option 2: S3 Static Website Hosting (Not Viable)

Using S3 static website hosting directly:
- ✅ Automatic `index.html` handling
- ❌ No HTTPS by default
- ❌ Slower than CloudFront CDN
- ❌ No custom domain support without CloudFront
- ❌ No edge caching

### Option 3: GitHub Pages as Primary (Fallback)

Promoting GitHub Pages to primary hosting:
- ✅ Automatic `index.html` handling
- ✅ Free HTTPS
- ✅ Custom domain support
- ❌ Slower than CloudFront CDN (fewer edge locations)
- ❌ Limited control over caching headers
- ❌ No multi-region failover

**Current Setup:** GitHub Pages is configured as a Disaster Recovery (DR) fallback, not primary hosting.

## 📝 Rollback Plan

If issues arise after deploying the CloudFront Function:

1. **Immediate Rollback:**
   - Open CloudFront Console → Distribution → Behaviors
   - Edit Default (*) behavior
   - Remove function association from Viewer request
   - Save changes (takes 5-10 minutes to propagate)

2. **Temporary Mitigation:**
   - Update all internal links to include `/index.html` explicitly
   - Example: `/news/` → `/news/index.html`
   - This bypasses the need for URL rewriting

3. **Permanent Alternative:**
   - Promote GitHub Pages to primary hosting
   - Update DNS CNAME to point to GitHub Pages
   - GitHub Pages handles `index.html` automatically

## 🔒 Security Considerations

### CloudFront Function Security

- **Input Validation:** Function checks URI format before rewriting
- **Path Traversal:** No user input is used to construct file paths
- **Injection Attacks:** Function only appends static string (`index.html`)
- **Performance:** Lightweight function with minimal computational cost

### ISMS Compliance

- **ISO 27001:2022 A.8.9:** Configuration Management
- **NIST CSF 2.0 PR.IP-1:** Baseline configuration maintained
- **CIS Controls v8.1 Control 4.1:** Secure configuration for network devices

## 📚 References

- [CloudFront Functions Documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html)
- [CloudFront Functions Event Structure](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html)
- [Implementing Default Directory Indexes](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/example-function-add-index.html)
- [CloudFront Functions Quotas](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html#limits-functions)

## 🤝 Support

For questions or issues:
- **Repository:** [Hack23/riksdagsmonitor](https://github.com/Hack23/riksdagsmonitor)
- **Owner:** James Pether Sörling, CISSP, CISM
- **Email:** Via GitHub issues

---

**Document Control:**
- Version: 1.0
- Created: 2026-02-11
- Status: Active
- Classification: 🟢 Public
