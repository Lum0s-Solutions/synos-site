---
tags: [general]
title: synos-compliance-runner — Automated Compliance Assessment
description: synos-compliance-runner — Automated Compliance Assessment
---
tags: [general]

# synos-compliance-runner — Automated Compliance Assessment

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-compliance-runner/`  
**Milestone:** v41+  
**License:** MIT OR Apache-2.0

## What It Is

`synos-compliance-runner` performs automated compliance assessments across
multiple frameworks: NIST SP 800-53, ISO 27001, PCI DSS, GDPR, SOX, HIPAA,
and FedRAMP Moderate. It evaluates system configurations against control
baselines and produces audit-ready reports.

## Architecture

### Supported Frameworks

| Framework | Controls | Source |
|-----------|----------|--------|
| NIST SP 800-53 | 800+ controls | `fruit/crates/syn-security/compliance/nist/` |
| ISO 27001 | 114 controls | `fruit/crates/syn-security/compliance/iso27001/` |
| PCI DSS | 12 requirements | `fruit/crates/syn-security/compliance/pci/` |
| GDPR | 99 articles | `fruit/crates/syn-security/compliance/gdpr/` |
| SOX | 10 controls | `fruit/crates/syn-security/compliance/sox/` |
| HIPAA | 18 identifiers | `fruit/crates/syn-security/compliance/hipaa/` |
| FedRAMP Moderate | 325 controls | `fruit/crates/syn-security/compliance/fedramp/` |

### How It's Wired

1. **syn-security** — reads security configurations from the syn-security crate
2. **synos-audit-trail** — logs all assessment results for audit purposes
3. **synos-compliance-dashboard** — feeds assessment results to the web dashboard
4. **synos-tenant** — enforces tenant-scoped compliance policies

## Future Ideas

1. **Continuous compliance** — real-time monitoring instead of batch assessments
2. **Auto-remediation** — suggest or apply fixes for non-compliant configurations
3. **Evidence collection** — automated evidence gathering for auditors
4. **Cross-framework mapping** — map controls between frameworks automatically
