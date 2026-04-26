---
name: product-management-patterns
description: Product management patterns including roadmap planning, feature prioritization, user feedback, and agile practices
license: Apache-2.0
---

# Product Management Patterns Skill


## 🔴 AI FIRST Quality Principle

> **Apply the AI FIRST principle: never accept first-pass quality. Minimum 2 iterations. Read all output, improve every section. No shortcuts.**

## Purpose
Defines product management patterns for prioritizing features, planning roadmaps, and managing the riksdagsmonitor platform.

## Prioritization Frameworks
### MoSCoW Method
- **Must Have** — Critical for current release
- **Should Have** — Important but not critical
- **Could Have** — Nice to have
- **Won't Have** — Out of scope for now

### Impact/Effort Matrix
| | Low Effort | High Effort |
|---|---|---|
| **High Impact** | Quick Wins ✅ | Major Projects |
| **Low Impact** | Fill-ins | Avoid ❌ |

## Feature Lifecycle
1. **Discovery** — User needs, market research
2. **Definition** — Requirements, acceptance criteria
3. **Design** — Architecture, UI/UX mockups
4. **Development** — Implementation, testing
5. **Delivery** — Deployment, monitoring
6. **Iteration** — Feedback, improvement

## GitHub Issues Best Practices
- Clear title with category prefix
- Detailed description with context
- Acceptance criteria as checklist
- Labels for type, priority, component
- Agent assignment for Copilot delegation
- Link related issues and PRs

## Metrics
- Feature adoption rate
- Time to delivery
- Quality metrics (bugs, test coverage)
- User satisfaction
- Performance benchmarks

## Related Policies
- [Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md)


---

## 🔗 Integration with agentic workflows & analysis artifacts

This skill is consumed by the 11 agentic news workflows in `.github/workflows/news-*.md`. The authoritative contract lives in [`.github/prompts/README.md`](../../prompts/README.md); this skill supplies domain expertise on top of that contract.

- **Analysis product** → [`ai-driven-analysis-guide.md`](../../../analysis/methodologies/ai-driven-analysis-guide.md) + every template in [`analysis/templates/`](../../../analysis/templates/).
- **Required before any article**: 9 core artifacts (14 for Tier-C) in `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`; [`05-analysis-gate.md`](../../prompts/05-analysis-gate.md) is the single blocking gate.
- **gh-aw v0.69.3** docs: [abridged](https://github.github.com/gh-aw/llms-small.txt) · [complete](https://github.github.com/gh-aw/llms-full.txt) · [blog series](https://github.github.com/gh-aw/_llms-txt/agentic-workflows.txt).
