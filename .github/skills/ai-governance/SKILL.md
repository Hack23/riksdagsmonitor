---
name: ai-governance
description: AI/LLM governance policies, ethical AI use, prompt security, and responsible AI development practices
license: Apache-2.0
---

# AI Governance Skill

## Purpose
Defines governance policies for responsible AI/LLM use in development, ensuring ethical practices and security compliance.

## Core Principles
1. **Transparency** — Document AI use in development
2. **Accountability** — Human review of AI-generated code
3. **Security** — Prevent prompt injection and data leakage
4. **Quality** — AI output must meet same standards as human work
5. **Privacy** — No PII in AI prompts or training data

## AI in Development
- Review all AI-generated code before merging
- Validate AI suggestions against security policies
- Document AI-assisted decisions in commit messages
- Ensure AI-generated tests are meaningful

## Prompt Security (OWASP LLM Top 10)
- LLM01: Prompt Injection prevention
- LLM02: Insecure Output Handling
- LLM06: Sensitive Information Disclosure
- Never include secrets in prompts
- Validate AI outputs before use

## GitHub Copilot Agent Governance
- Custom agents must follow ISMS policies
- Agent configurations reviewed by security team
- Tool access follows least privilege principle
- MCP server configurations use secrets (not hard-coded tokens)

## Compliance Mapping
- ISO 27001 A.5.1 — Policies for information security
- NIST AI RMF — AI Risk Management Framework
- EU AI Act — Risk-based AI regulation

## Related Policies
- [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md)
