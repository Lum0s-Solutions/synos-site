# Bug Bounty Hunting

# Bug Bounty Hunting

Bug bounty hunting is the practice of finding and responsibly reporting security vulnerabilities in scoped targets in exchange for recognition or monetary rewards, typically through a program on a platform like HackerOne or Bugcrowd. It channels offensive skill into legal, disclosure-driven work and is a major on-ramp into professional security.

## How it works
- **Scope & rules**: read the program policy; only test in-scope assets and honor safe-harbor terms.
- **Recon**: enumerate subdomains, endpoints, and technologies (OSINT-heavy).
- **Vulnerability hunting**: probe for OWASP Top 10 classes — IDOR, XSS, SSRF, auth bypass, injection — plus business-logic flaws.
- **Triage & PoC**: build a minimal, non-destructive proof of concept.
- **Report**: clear write-up with impact, reproduction, and remediation; coordinate disclosure.

## Tools commonly used
- **Burp Suite** (proxy/scanner), **Nuclei** (templated scanning), **ffuf/gobuster** (content discovery), **subfinder/amass** (recon), **sqlmap** for injection testing.
- Community tools: `chimera`, `Scalpel`, and `JS-Tap` (client-side JS recon) appeared in the intel.

## Defensive angle
Bug bounties are a defensive control: crowd-sourced, continuous testing that surfaces real exploitable issues before criminals do. Programs pair with a **vulnerability disclosure policy (VDP)**, clear scope, and fast remediation SLAs. The same recon that finds bugs (e.g., an auth-bypass CVE exposing an RTSP stream in client-side JS) shows defenders what they leak.

## Seen in the community
**#bug-bounty-city** shared recon/exploitation tooling and CVE-hunting workflows, overlapping with **#exploit-dev-talk** disclosure discussions.

## Related
- [[burp-suite]]
- [[sqlmap]]
- [[osint]]
- [[exploit-development]]
- [[cve]]
- [[Discord Intel/discord-intel-MOC|Discord Intel]]

## Sources
- https://owasp.org/www-project-top-ten/
- https://docs.hackerone.com/
- https://github.com/projectdiscovery/nuclei

## 🎴 Review
<!-- Spaced Repetition cards -->
#flashcards/security-plus

What is bug bounty hunting?::Finding and responsibly reporting security vulnerabilities in scoped targets for recognition or money, typically via a platform like HackerOne or Bugcrowd.

Which vulnerability classes do bug bounty hunters commonly probe?::OWASP Top 10 classes (IDOR, XSS, SSRF, auth bypass, injection) plus business-logic flaws.

Why must a hunter honor a program's scope and safe-harbor terms?::Only in-scope assets may be tested; honoring scope and safe-harbor keeps the testing legal.

Which tools are common in bug bounty work?::Burp Suite (proxy/scanner), Nuclei (templated scanning), ffuf/gobuster (content discovery), subfinder/amass (recon), and sqlmap.

How are bug bounties a defensive control?::They provide crowd-sourced, continuous testing that surfaces real exploitable issues before criminals do, paired with a VDP.
