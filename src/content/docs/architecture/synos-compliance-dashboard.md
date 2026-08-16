---
tags: [general]
title: synos-compliance-dashboard — Web Compliance Monitoring Dashboard
description: synos-compliance-dashboard — Web Compliance Monitoring Dashboard
---
tags: [general]

# synos-compliance-dashboard — Web Compliance Monitoring Dashboard

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-compliance-dashboard/`  
**Milestone:** v41+  
**License:** MIT OR Apache-2.0

## What It Is

`synos-compliance-dashboard` provides a web-based dashboard for monitoring
compliance status across GDPR, HIPAA, and other frameworks. It visualizes
assessment results from `synos-compliance-runner` and provides drill-down
capabilities for auditors and security teams.

## Architecture

### Features

- Real-time compliance score visualization
- Framework-specific drill-down views
- Historical trend analysis
- Automated report generation
- Tenant-scoped dashboards

### How It's Wired

1. **synos-compliance-runner** — receives assessment results via REST API
2. **synos-tenant** — enforces tenant isolation on dashboard data
3. **synos-gamification** — integrates compliance scoring into GRIMOIRE progression
4. **Axum** — web framework for the dashboard backend

## Future Ideas

1. **Executive summary** — C-suite friendly compliance overview
2. **Anomaly detection** — ML-based detection of compliance drift
3. **Automated evidence** — pull evidence directly from audit trails
4. **Third-party integration** — SIEM/SOAR connectors for compliance events
