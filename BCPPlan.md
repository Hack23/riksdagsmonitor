# 🔄 Riksdagsmonitor - Business Continuity Plan

**Classification:** Public  
**Owner:** Hack23 AB (Org.nr 5595347807)

## Executive Summary

Dual-deployment strategy ensures riksdagsmonitor.com operational continuity. AWS primary (CloudFront + S3 multi-region), GitHub Pages disaster recovery.

**Key Metrics:**
- **RTO:** <30 seconds (origin failover) or 15 minutes (DNS failover)
- **RPO:** 0 minutes (synchronized deployments)
- **Availability:** 99.998%

## Infrastructure

**Primary: AWS**
- CloudFront CDN → S3 us-east-1 (primary) + S3 eu-west-1 (replica)
- Automatic origin failover on 500+ HTTP errors (<30 seconds)
- Route 53 DNS with health checks

**Disaster Recovery: GitHub Pages**
- Standby deployment (automatic from main branch)
- DNS failover via Route 53 (15 minutes)

## Disaster Recovery Scenarios

### Scenario 1: S3 us-east-1 Unavailable
**Recovery:** CloudFront automatic failover to eu-west-1  
**RTO:** <30 seconds (transparent to users)  
**RPO:** 0 minutes (real-time replication)

### Scenario 2: CloudFront Outage
**Recovery:** Route 53 DNS failover to GitHub Pages  
**RTO:** 15 minutes (DNS TTL)  
**RPO:** 0 minutes (synchronized deployment)

### Scenario 3: Both S3 Regions Fail
**Recovery:** DNS failover to GitHub Pages  
**RTO:** 15 minutes  
**RPO:** 0 minutes

### Scenario 4: AWS Account Compromise
**Recovery:** Immediate DNS failover + credential rotation + CloudTrail audit  
**RTO:** 15 minutes (failover) + 2 hours (security validation)  
**RPO:** 0 minutes (restore from Git)

### Scenario 5: GitHub Outage
**Impact:** AWS primary unaffected, no action required  
**RTO:** 0 minutes

## Failover Configuration

**Route 53 Health Checks:**
- Interval: 30 seconds
- Failure threshold: 3 consecutive failures (90 seconds detection)
- DNS TTL: 60 seconds
- **Total failover time:** 2-3 minutes

**CloudFront Origin Failover:**
- Trigger: HTTP 500, 502, 503, 504 errors from us-east-1
- Action: Automatic switch to eu-west-1 origin
- **Failover time:** <30 seconds

## Testing Schedule

| Test | Frequency | Purpose |
|------|-----------|---------|
| DNS Failover | Quarterly | Verify Route 53 failover |
| Origin Failover | Quarterly | Verify CloudFront failover |
| S3 Replication | Monthly | Verify replication health |
| Full DR Simulation | Annually | End-to-end validation |

## Recovery Procedures

**Manual DNS Failover:**
1. Access Route 53 console
2. Update A record to point to GitHub Pages
3. Verify DNS propagation (nslookup)
4. Monitor website accessibility

**Rollback:**
1. Git revert to known-good commit
2. Redeploy via GitHub Actions (3 minutes)
3. CloudFront cache invalidation (5-15 minutes)
4. Or: Restore from S3 versioning (immediate)

---

**Related Documentation:**
- [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) - Security controls
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [THREAT_MODEL.md](THREAT_MODEL.md) - Threat analysis
