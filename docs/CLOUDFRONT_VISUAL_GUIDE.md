# CloudFront Subdirectory Index Issue - Visual Explanation

## 🔍 Problem Visualization

### Current Behavior (Before Fix)

```
┌─────────────────────────────────────────────────────────────┐
│ User Browser                                                 │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ Request: GET /news/
                ↓
┌─────────────────────────────────────────────────────────────┐
│ CloudFront CDN (400+ Edge Locations)                         │
│                                                               │
│ ┌────────────────────────────────────────┐                  │
│ │ DefaultRootObject: index.html          │                  │
│ │ ✅ Applies to: /                       │                  │
│ │ ❌ Does NOT apply to: /news/           │                  │
│ └────────────────────────────────────────┘                  │
│                                                               │
│ Decision: URI = /news/ → Forward to S3 as-is               │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ Request: GET /news/
                ↓
┌─────────────────────────────────────────────────────────────┐
│ S3 Bucket Origin                                             │
│ riksdagsmonitor-frontend-us-east-1-172017021075             │
│                                                               │
│ Objects:                                                      │
│   ✅ /index.html          (exists)                          │
│   ✅ /news/index.html     (exists)                          │
│   ❌ /news/               (does NOT exist - is directory)   │
│                                                               │
│ Result: 403 Access Denied                                    │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ Response: 403 Forbidden
                ↓
┌─────────────────────────────────────────────────────────────┐
│ User sees:                                                    │
│ - Error page, OR                                              │
│ - Main page fallback, OR                                      │
│ - "Access Denied" message                                     │
└─────────────────────────────────────────────────────────────┘
```

### Fixed Behavior (After CloudFront Function)

```
┌─────────────────────────────────────────────────────────────┐
│ User Browser                                                 │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ Request: GET /news/
                ↓
┌─────────────────────────────────────────────────────────────┐
│ CloudFront CDN (400+ Edge Locations)                         │
│                                                               │
│ ┌────────────────────────────────────────┐                  │
│ │ CloudFront Function (Viewer Request)   │                  │
│ │ url-rewrite.js                         │                  │
│ │                                         │                  │
│ │ if (uri.endsWith('/'))                 │                  │
│ │   uri = uri + 'index.html'             │                  │
│ │                                         │                  │
│ │ /news/ → /news/index.html              │                  │
│ └────────────────────────────────────────┘                  │
│                                                               │
│ ✅ URI Rewritten: /news/ → /news/index.html                 │
│ ⚡ Execution Time: <1ms                                      │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ Request: GET /news/index.html (rewritten)
                ↓
┌─────────────────────────────────────────────────────────────┐
│ S3 Bucket Origin                                             │
│ riksdagsmonitor-frontend-us-east-1-172017021075             │
│                                                               │
│ Objects:                                                      │
│   ✅ /news/index.html     (exists) ← Requested              │
│                                                               │
│ Result: 200 OK                                                │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ Response: 200 OK + HTML content
                ↓
┌─────────────────────────────────────────────────────────────┐
│ User sees:                                                    │
│ ✅ News section page                                         │
│ ✅ All articles listed                                        │
│ ✅ Language switcher works                                    │
│ ✅ Proper HTML rendering                                      │
└─────────────────────────────────────────────────────────────┘
```

## 📐 Architecture Comparison

### Option 1: S3 Static Website Hosting (Not Used)

```
User → Route53 → S3 Website Endpoint → S3 Bucket
                  ↑
                  Automatic index.html handling
                  ❌ No CloudFront (slower, no CDN)
                  ❌ No HTTPS by default
                  ❌ Limited header control
```

### Option 2: CloudFront + S3 Bucket Origin (Current - Broken)

```
User → Route53 → CloudFront → S3 Bucket Origin
                  ↑
                  DefaultRootObject: index.html
                  ✅ HTTPS, CDN, headers
                  ❌ No subdirectory index handling
```

### Option 3: CloudFront + Function + S3 (Recommended Fix)

```
User → Route53 → CloudFront → CloudFront Function → S3 Bucket Origin
                               ↑
                               URL Rewrite Logic
                               ✅ HTTPS, CDN, headers
                               ✅ Subdirectory index handling
                               ✅ <1ms execution time
```

## 🔄 Request Flow Timeline

### Before Fix (Failure)

```
0ms    User requests /news/
1ms    DNS resolution (Route53 → CloudFront)
5ms    CloudFront receives request
6ms    Check DefaultRootObject (only applies to /)
7ms    Forward /news/ to S3 as-is
50ms   S3 returns 403 (object /news/ doesn't exist)
51ms   CloudFront serves error/fallback
52ms   User sees error ❌
```

### After Fix (Success)

```
0ms    User requests /news/
1ms    DNS resolution (Route53 → CloudFront)
5ms    CloudFront receives request
5.5ms  CloudFront Function executes (<1ms)
       → Rewrites /news/ to /news/index.html
6ms    Forward /news/index.html to S3
50ms   S3 returns 200 (object exists)
50ms   CloudFront caches response
51ms   User receives HTML ✅
```

**Performance Impact:** +0.5ms (negligible)

## 🌍 Global Edge Execution

```
┌─────────────────────────────────────────────────────────────┐
│ CloudFront Global Network (400+ Edge Locations)              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Americas (90+)        Europe (80+)         Asia (150+)      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Seattle      │    │ Stockholm    │    │ Tokyo        │  │
│  │ San Jose     │    │ London       │    │ Singapore    │  │
│  │ New York     │    │ Frankfurt    │    │ Mumbai       │  │
│  │ ...          │    │ ...          │    │ ...          │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
│  Each location runs url-rewrite.js                          │
│  ⚡ Sub-millisecond execution                                │
│  🔄 Automatic deployment to all locations                    │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 URL Rewriting Logic

```javascript
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Case 1: /news/ → /news/index.html
    if (uri.endsWith('/')) {
        request.uri = uri + 'index.html';
    }
    
    // Case 2: /news → /news/index.html
    else if (!uri.includes('.') && uri !== '/') {
        request.uri = uri + '/index.html';
    }
    
    // Case 3: /news/article.html → unchanged
    // Case 4: / → unchanged (DefaultRootObject handles this)
    
    return request;
}
```

### Test Cases

| Input URI | Output URI | Reasoning |
|-----------|------------|-----------|
| `/news/` | `/news/index.html` | Ends with `/` |
| `/news` | `/news/index.html` | No extension, not root |
| `/news/article.html` | `/news/article.html` | Has extension (unchanged) |
| `/` | `/` | Root path (DefaultRootObject handles) |
| `/dashboard/` | `/dashboard/index.html` | Ends with `/` |
| `/styles.css` | `/styles.css` | Has extension (unchanged) |

## 💰 Cost Comparison

### CloudFront Functions vs. Lambda@Edge

```
Scenario: 1 million requests to /news/

┌────────────────────────────────────────────────────────────┐
│ CloudFront Functions                                        │
├────────────────────────────────────────────────────────────┤
│ Cost: $0.10 per 1M invocations                             │
│ Execution: <1ms per request                                │
│ Total: $0.10                                               │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Lambda@Edge                                                 │
├────────────────────────────────────────────────────────────┤
│ Cost: $0.60 per 1M requests                                │
│      + $0.0000002 per 128MB-ms compute                     │
│ Execution: 5-50ms per request                              │
│ Total: $0.60 + compute = ~$1.00                            │
└────────────────────────────────────────────────────────────┘

Savings: 90% cheaper with CloudFront Functions ✅
```

## 🔒 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: DNS (Route53)                                       │
│ - DNSSEC enabled                                              │
│ - DDoS protection                                             │
└───────────────┬─────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: CloudFront                                           │
│ - TLS 1.3 encryption                                          │
│ - AWS Shield Standard (DDoS)                                  │
│ - WAF integration (optional)                                  │
└───────────────┬─────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: CloudFront Function                                  │
│ - Input validation (URI format)                               │
│ - No external dependencies                                    │
│ - Sandboxed execution                                         │
│ - <1KB code size                                              │
└───────────────┬─────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: S3 Bucket                                            │
│ - Block public access                                         │
│ - Bucket policy (CloudFront OAI only)                         │
│ - Versioning enabled                                          │
│ - Encryption at rest (AES-256)                                │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Monitoring & Metrics

```
CloudWatch Metrics to Monitor:

┌─────────────────────────────────────────────────────────────┐
│ CloudFront Distribution                                       │
├─────────────────────────────────────────────────────────────┤
│ 4xxErrorRate        [Should DECREASE after fix]             │
│ CacheHitRate        [Should remain ~90%+]                   │
│ Requests            [Monitor for anomalies]                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CloudFront Function                                           │
├─────────────────────────────────────────────────────────────┤
│ Invocations         [Should match request count]            │
│ ExecutionTime       [Should be <1ms]                        │
│ ThrottledRequests   [Should be 0]                           │
└─────────────────────────────────────────────────────────────┘

Alert Thresholds:
- 4xxErrorRate > 5% → Investigate
- ExecutionTime > 5ms → Performance issue
- ThrottledRequests > 0 → Quota issue
```

## 🎓 Key Takeaways

1. **CloudFront Limitation:**
   - `DefaultRootObject` ≠ automatic subdirectory index
   - Only applies to root path (`/`)
   - Standard behavior, not a bug

2. **Solution Pattern:**
   - Use CloudFront Functions for lightweight URL manipulation
   - Lambda@Edge for complex compute requirements only
   - Always test at edge before S3 request

3. **Performance:**
   - CloudFront Functions: <1ms execution
   - No impact on cache hit rate
   - Global execution at all edge locations

4. **Cost:**
   - CloudFront Functions: $0.10 per 1M invocations
   - 90% cheaper than Lambda@Edge
   - Negligible for typical traffic volumes

---

**Visual Guide Version:** 1.0  
**Created:** 2026-02-11  
**For:** riksdagsmonitor CloudFront subdirectory issue
