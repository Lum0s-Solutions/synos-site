# Reverse Shell

> [Defensive analysis only.]

---
title: Reverse Shell
tags: [concept, cybersecurity, technique]
---

A reverse shell is a remote-access technique in which a compromised target initiates an outbound connection back to an attacker-controlled listener, granting the attacker interactive command execution on the victim. It is typically favored over a bind shell because outbound connections more easily bypass firewalls and NAT. Tools such as Netcat, Metasploit, and msfvenom are commonly used to generate and catch them.

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

What is a reverse shell?::A technique where a compromised target initiates an outbound connection back to an attacker's listener, granting interactive command execution on the victim.

Why is a reverse shell favored over a bind shell?::Outbound connections more easily bypass firewalls and NAT.

What tools commonly generate and catch reverse shells?::Netcat, Metasploit, and msfvenom.

## Detection & Mitigation

> Detect and mitigate this technique via EDR telemetry, logging, least-privilege, and the controls in the linked hubs.
