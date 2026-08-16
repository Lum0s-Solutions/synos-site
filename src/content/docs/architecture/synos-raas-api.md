---
title: synos-raas-api — RaaS API surface
description: synos-raas-api — RaaS API surface
---

# synos-raas-api — RaaS API surface

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-raas-api/`  
**Milestone:** v57+  
**License:** Apache-2.0  
**Version:** v111.0.0 "Last Light"

## What It Is

`synos-raas-api` is the REST API surface for Recommendations as a Service (RaaS), delivering continuous security intelligence to MSSP clients. Built on Axum with Tower middleware, it provides JWT-authenticated tenant isolation, compliance assessment triggers, prioritized recommendation feeds, report generation, and v57 Phoenix Eye LLM red-team-as-a-service scan queuing. The API integrates with `synos-tenant` for RBAC, `synos-audit-trail` for compliance logging, `synos-cmmc-gap` for assessment, `synos-report` for output, and `synos-raas-engine` for recommendation logic.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `auth` | JWT authentication middleware and tenant identity extraction |
| `handlers` | Axum request handlers for all API endpoints |
| `llm_rt` | v57 Phoenix Eye LLM red-team-as-a-service scan queuing and findings retrieval |
| `recommendations` | Prioritized security recommendation engine integration |
| `router` | Axum `build_router()` assembly with Tower middleware stack |
| `state` | `RaasState` shared application state holding tenant, audit, and assessment services |

### How It's Wired

1. **synos-tenant** — `auth` middleware extracts tenant identity from JWT claims and injects it into `RaasState`, ensuring all downstream handlers are tenant-scoped.
2. **synos-audit-trail** — Every API mutation is logged to the audit trail for compliance reporting and forensic replay.
3. **synos-cmmc-gap** — `handlers` trigger `CmmcGapEngine` assessments via `POST /api/v1/tenants/:id/scan`, returning control gap analysis.
4. **synos-report** — Report generation endpoints consume `synos-report` builder to produce PDF/Markdown compliance reports downloadable via `GET /api/v1/tenants/:id/reports/:rid`.
5. **synos-llm-rt + synos-raas-engine** — `llm_rt` module queues LLM hardening scans via `POST /api/v1/llm-rt/scan` and retrieves findings via `GET /api/v1/llm-rt/findings/{run_id}`, powered by `synos-raas-engine`.
6. **Tower middleware** — `tower-http` provides CORS, compression, and request tracing; `tower` provides timeout and retry layers.

## Future Ideas

1. Add `synos-raas-api-graphql` for flexible client-side query shaping over the recommendation engine.
2. Implement webhook delivery for scan completion events so MSSP clients can poll less.
3. Wire `synos-raas-api` into `synos-findings-store` so that assessment findings from the API are content-addressed and deduplicated across tools.
