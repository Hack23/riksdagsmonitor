# CloudFront Subdirectory Index Issue - Troubleshooting Guide

**Document Classification:** 🟢 Public  
**Created:** 2026-02-11  
**Issue:** `/news/` not serving `index.html`  
**Status:** ✅ Diagnosed & Solution Provided

## 🔍 Issue Summary

### Problem
When accessing `https://riksdagsmonitor.com/news/`, users don't see the news section page. Instead, they see:
- The main website page without data, or
- A CloudFront error, or
- An S3 access denied error

### Root Cause
**CloudFront's `DefaultRootObject` limitation:** This setting only applies to the root path (`/`), not subdirectories like `/news/`.

```
✅ Works: https://riksdagsmonitor.com/        → serves /index.html
✅ Works: https://riksdagsmonitor.com/news/index.html
❌ Fails: https://riksdagsmonitor.com/news/   → does NOT serve /news/index.html
```

This is a well-documented CloudFront behavior, not a bug.

## 🔬 Diagnostic Steps

### Step 1: Verify S3 Content
```bash
# Check if news/index.html exists in S3
aws s3 ls s3://riksdagsmonitor-frontend-us-east-1-172017021075/news/

# Expected output should include:
# index.html
# index_sv.html
# index_da.html
# (etc.)
```

✅ **Result:** Files exist in S3

### Step 2: Test Direct S3 URLs
```bash
# If S3 static website hosting is enabled, test:
curl -I http://riksdagsmonitor-frontend-us-east-1-172017021075.s3-website-us-east-1.amazonaws.com/news/

# S3 static website hosting DOES support automatic index.html
# But CloudFront in front of S3 (not S3 website hosting) does NOT
```

✅ **Result:** S3 static website would work, but we're using CloudFront → S3 bucket origin (not S3 website endpoint)

### Step 3: Check CloudFront Configuration
```bash
# Get CloudFront distribution config
DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name riksdagsmonitor-frontend \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

aws cloudfront get-distribution-config --id $DIST_ID > dist-config.json

# Check DefaultRootObject
jq '.DistributionConfig.DefaultRootObject' dist-config.json
# Returns: "index.html"

# Check if CloudFront Functions are associated
jq '.DistributionConfig.DefaultCacheBehavior.FunctionAssociations' dist-config.json
# Returns: null or empty (no functions currently configured)
```

❌ **Result:** No CloudFront Function for directory index handling

### Step 4: Test CloudFront Behavior
```bash
# Test various URL patterns
curl -sI https://riksdagsmonitor.com/ | grep "HTTP"
# Expected: HTTP/2 200

curl -sI https://riksdagsmonitor.com/index.html | grep "HTTP"
# Expected: HTTP/2 200

curl -sI https://riksdagsmonitor.com/news/index.html | grep "HTTP"
# Expected: HTTP/2 200

curl -sI https://riksdagsmonitor.com/news/ | grep "HTTP"
# Expected: HTTP/2 403 (Access Denied) or 404 or redirects to main page
```

❌ **Result:** `/news/` fails as expected

## 🛠️ Solution

### Option 1: CloudFront Function (Recommended ✅)

Deploy the CloudFront Function we've created:

1. **Function Location:** `.github/cloudfront-functions/url-rewrite.js`
2. **Deployment Guide:** `docs/CLOUDFRONT_FUNCTION_DEPLOYMENT.md`
3. **Type:** Viewer Request function
4. **Performance:** Sub-millisecond, runs at all edge locations
5. **Cost:** $0.10 per 1 million requests

**Benefits:**
- ✅ Fast (sub-millisecond)
- ✅ Cost-effective
- ✅ Runs at edge (minimal latency)
- ✅ Simple to implement
- ✅ AWS-native solution

**Deployment Time:** 5-10 minutes (CloudFront propagation)

See detailed instructions in: [`docs/CLOUDFRONT_FUNCTION_DEPLOYMENT.md`](CLOUDFRONT_FUNCTION_DEPLOYMENT.md)

### Option 2: Lambda@Edge (Not Recommended ⚠️)

Lambda@Edge can also handle URL rewriting, but:
- ❌ Slower (5-50ms vs. <1ms)
- ❌ More expensive ($0.60/million vs. $0.10/million)
- ❌ More complex (Node.js runtime, IAM roles, replication)
- ❌ Overkill for simple URL rewriting

### Option 3: Update All Links (Workaround 🔧)

Temporary mitigation while deploying CloudFront Function:

```bash
# Find all links to /news/ and update to /news/index.html
grep -r 'href="/news/"' /home/runner/work/riksdagsmonitor/riksdagsmonitor/*.html

# Update links in all language versions
sed -i 's|href="/news/"|href="/news/index.html"|g' index*.html
```

**Impact:** 
- ✅ Works immediately
- ❌ Doesn't fix direct URL access (`riksdagsmonitor.com/news/` in browser)
- ❌ User experience degradation (ugly URLs)

### Option 4: GitHub Pages as Primary (Alternative 🏗️)

Promote GitHub Pages from DR fallback to primary hosting:

**Benefits:**
- ✅ Automatic `index.html` handling (no CloudFront Function needed)
- ✅ Free HTTPS
- ✅ Simple configuration

**Drawbacks:**
- ❌ Slower than CloudFront (fewer edge locations)
- ❌ Less control over caching
- ❌ No multi-region failover

**Implementation:**
1. Update DNS CNAME: `riksdagsmonitor.com` → `hack23.github.io`
2. Update canonical URLs in HTML files
3. Disable S3/CloudFront deployment

**Deployment Time:** 5-10 minutes (DNS propagation)

## 🧪 Verification Tests

After deploying the solution, run these tests:

### Automated Testing
```bash
# Test script
#!/bin/bash
echo "Testing CloudFront directory index handling..."

test_url() {
  local url=$1
  local expected=$2
  local response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  if [ "$response" -eq "$expected" ]; then
    echo "✅ PASS: $url → $response"
  else
    echo "❌ FAIL: $url → $response (expected $expected)"
  fi
}

test_url "https://riksdagsmonitor.com/" 200
test_url "https://riksdagsmonitor.com/index.html" 200
test_url "https://riksdagsmonitor.com/news/" 200
test_url "https://riksdagsmonitor.com/news" 200
test_url "https://riksdagsmonitor.com/news/index.html" 200
test_url "https://riksdagsmonitor.com/news/index_sv.html" 200
test_url "https://riksdagsmonitor.com/news/2026-02-10-week-ahead-en.html" 200

echo "Tests complete!"
```

### Manual Browser Testing
1. Open browser (Chrome/Firefox/Safari)
2. Navigate to `https://riksdagsmonitor.com/news/`
3. Verify:
   - ✅ News index page displays correctly
   - ✅ No 403/404 errors
   - ✅ Page title is "News - Riksdagsmonitor"
   - ✅ Articles are listed
4. Open DevTools → Network tab
5. Verify:
   - ✅ Status: 200 OK
   - ✅ Response URL: `/news/index.html` (CloudFront rewrote it)

### Cache Validation
```bash
# Clear CloudFront cache after deployment
aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths "/news/*" "/news"

# Wait 2-5 minutes for invalidation to complete
aws cloudfront get-invalidation \
  --distribution-id $DIST_ID \
  --id <invalidation-id>
```

## 📊 Monitoring

### CloudFront Metrics to Watch
- **4xx Error Rate:** Should decrease after deploying fix
- **Cache Hit Rate:** Should remain stable (~90%+)
- **Request Count:** Monitor for any unexpected spikes

### CloudWatch Alarms (Recommended)
```bash
# Create alarm for 4xx errors
aws cloudwatch put-metric-alarm \
  --alarm-name cloudfront-4xx-errors \
  --metric-name 4xxErrorRate \
  --namespace AWS/CloudFront \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=DistributionId,Value=$DIST_ID
```

## 🔄 Rollback Plan

If issues arise after deploying CloudFront Function:

### Immediate Rollback (5 minutes)
```bash
# Remove function association from CloudFront distribution
# 1. Get current config
aws cloudfront get-distribution-config --id $DIST_ID > config.json
ETAG=$(jq -r .ETag config.json)

# 2. Edit config to remove FunctionAssociations
# Set DefaultCacheBehavior.FunctionAssociations.Quantity = 0

# 3. Update distribution
aws cloudfront update-distribution \
  --id $DIST_ID \
  --distribution-config file://config-rollback.json \
  --if-match $ETAG

# 4. Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths "/*"
```

### Verify Rollback
```bash
# Test that direct URLs with /index.html still work
curl -I https://riksdagsmonitor.com/news/index.html
# Expected: 200 OK
```

## 📚 Related Documentation

- [CloudFront Function Deployment Guide](CLOUDFRONT_FUNCTION_DEPLOYMENT.md)
- [AWS CloudFront Functions Documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html)
- [CloudFront Default Root Object Limitation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DefaultRootObject.html)

## 🤝 Support

For questions or issues:
- **Repository:** [Hack23/riksdagsmonitor](https://github.com/Hack23/riksdagsmonitor)
- **Owner:** James Pether Sörling, CISSP, CISM
- **Created:** 2026-02-11

---

**Document Control:**
- Version: 1.0
- Status: Active
- Classification: 🟢 Public
- Next Review: 2026-05-11 (Quarterly)
