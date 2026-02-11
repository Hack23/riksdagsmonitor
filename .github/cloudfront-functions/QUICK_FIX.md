# Quick Fix Guide: /news/ Not Working

**Issue:** `https://riksdagsmonitor.com/news/` not showing news section  
**Cause:** CloudFront doesn't serve `index.html` for subdirectories  
**Status:** ✅ Solution Ready (Deployment Required)

## ⚡ Quick Fix (5 Minutes)

### AWS Console Method

1. **Open AWS Console** → CloudFront → Functions
2. **Create Function:**
   - Name: `riksdagsmonitor-url-rewrite`
   - Runtime: CloudFront Functions
   - Code: Copy from `.github/cloudfront-functions/url-rewrite.js`
3. **Test Function** (Test tab):
   - Event: `{"request": {"uri": "/news/"}}`
   - Expected: `uri` changes to `/news/index.html`
4. **Publish Function** → Click "Publish" button
5. **Associate with Distribution:**
   - CloudFront → Distributions → riksdagsmonitor.com
   - Behaviors tab → Edit Default (*)
   - Function associations → Viewer request → Select function
   - Save changes
6. **Wait 5-10 minutes** for CloudFront propagation
7. **Test:** Visit `https://riksdagsmonitor.com/news/`

### AWS CLI Method

```bash
# 1. Create and publish function
aws cloudfront create-function \
  --name riksdagsmonitor-url-rewrite \
  --function-config Comment="URL rewrite",Runtime=cloudfront-js-2.0 \
  --function-code fileb://.github/cloudfront-functions/url-rewrite.js

ETAG=$(aws cloudfront describe-function \
  --name riksdagsmonitor-url-rewrite \
  --query 'ETag' --output text)

aws cloudfront publish-function \
  --name riksdagsmonitor-url-rewrite \
  --if-match $ETAG

# 2. Associate with distribution (requires manual config update)
# See docs/CLOUDFRONT_FUNCTION_DEPLOYMENT.md for full CLI steps
```

## 📋 What This Fixes

| URL | Before | After |
|-----|--------|-------|
| `/news/` | ❌ 403/404 | ✅ 200 (shows news) |
| `/news` | ❌ 403/404 | ✅ 200 (shows news) |
| `/news/index.html` | ✅ 200 | ✅ 200 |
| `/` | ✅ 200 | ✅ 200 |

## 🧪 Verify Fix

```bash
curl -I https://riksdagsmonitor.com/news/
# Expected: HTTP/2 200
```

## 📚 Full Documentation

- **Deployment:** [`docs/CLOUDFRONT_FUNCTION_DEPLOYMENT.md`](../docs/CLOUDFRONT_FUNCTION_DEPLOYMENT.md)
- **Troubleshooting:** [`docs/TROUBLESHOOTING_CLOUDFRONT_SUBDIRECTORY.md`](../docs/TROUBLESHOOTING_CLOUDFRONT_SUBDIRECTORY.md)

## 🔄 Alternative: Use GitHub Pages

If CloudFront deployment is not possible:

```bash
# Update CNAME DNS record
riksdagsmonitor.com → hack23.github.io

# GitHub Pages handles /news/ → /news/index.html automatically
# Trade-off: Slower CDN, but works immediately
```

## ❓ Why This Happens

CloudFront's `DefaultRootObject` only applies to `/`, not `/news/` or other subdirectories. This is standard CloudFront behavior.

**Solution:** CloudFront Function rewrites URLs at edge locations before S3 request.

---

**Created:** 2026-02-11  
**Status:** Ready for Deployment  
**Impact:** Low (1KB function, <1ms execution)
