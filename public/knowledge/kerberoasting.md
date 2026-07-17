# Kerberoasting

> [Defensive analysis only.]

---
title: Kerberoasting
tags: [concept, cybersecurity, technique]
---

Kerberoasting is an Active Directory attack that abuses the Kerberos protocol by requesting service tickets (TGS) for accounts that have a Service Principal Name (SPN), then cracking each ticket's encrypted portion offline to recover the service account's password. Because any authenticated domain user can request these tickets, it is a low-privilege path to potentially privileged credentials. Mitigations include strong service-account passwords, Group Managed Service Accounts, and AES-only encryption.

> Part of cybersecurity MOC

## Mentioned in
```dataview
LIST
FROM
SORT file.name
```

## 🎴 Review
<!-- Spaced Repetition cards -->
#flashcards/security-plus

What is Kerberoasting?::An Active Directory attack that requests Kerberos service tickets (TGS) for accounts with an SPN, then cracks the encrypted portion offline to recover the service account's password.

Why is Kerberoasting a low-privilege attack?::Any authenticated domain user can request the service tickets, making it a low-privilege path to potentially privileged credentials.

What makes an account eligible for Kerberoasting?::Having a Service Principal Name (SPN), which lets any user request a TGS ticket for it.

What mitigates Kerberoasting?::Strong service-account passwords, Group Managed Service Accounts, and AES-only encryption.

## Detection & Mitigation

> Detect and mitigate this technique via EDR telemetry, logging, least-privilege, and the controls in the linked hubs.
