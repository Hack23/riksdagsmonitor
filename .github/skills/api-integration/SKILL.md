---
name: api-integration
description: REST/GraphQL API client design, rate limiting, error handling, and authentication best practices
license: CC-BY-4.0
---

# API Integration Skill

## Purpose
Expert knowledge in building robust API clients with proper error handling, rate limiting, authentication, and retry logic.

## Core Principles
1. **Resilience** - Handle failures gracefully
2. **Rate Limiting** - Respect API limits
3. **Retry Logic** - Exponential backoff
4. **Circuit Breaker** - Fail fast when needed
5. **Security** - Secure credential storage

## Enforces
- REST/GraphQL client patterns
- Rate limiting and throttling
- Retry logic with exponential backoff
- Circuit breaker pattern
- Error handling and recovery
- Authentication (OAuth, API keys, JWT)
- Request/response logging
- Timeout configuration

## API Client Pattern
```javascript
class APIClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
    this.circuitBreaker = new CircuitBreaker();
  }
  
  async request(endpoint, options = {}) {
    if (this.circuitBreaker.isOpen()) {
      throw new Error('Circuit breaker open');
    }
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(
          `${this.baseUrl}${endpoint}`,
          { ...options, timeout: this.timeout }
        );
        
        if (!response.ok) {
          throw new APIError(response.status, response.statusText);
        }
        
        this.circuitBreaker.recordSuccess();
        return await response.json();
      } catch (error) {
        if (attempt === this.retries) {
          this.circuitBreaker.recordFailure();
          throw error;
        }
        await this.delay(1000 * Math.pow(2, attempt));
      }
    }
  }
}
```

## When to Use
- Building API clients
- Integrating external services
- Handling API failures
- Rate limit management
- Authentication implementation

## References
- [REST API Design](https://restfulapi.net/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

---
**Version**: 1.0 | **Last Updated**: 2026-02-06 | **Category**: Development & Operations
