# Open-Source Intelligence (OSINT)

# Open-Source Intelligence (OSINT)

OSINT is the collection and analysis of information from publicly available sources — search engines, social media, public records, DNS/WHOIS, code repositories, breach corpora, and imagery — to build knowledge about a target. It is the reconnaissance backbone of penetration testing, threat intelligence, fraud investigation, and journalism, and it is entirely passive when done well (no direct interaction with target systems).

## How it works
- **Footprinting**: enumerate domains, subdomains, emails, employees, and technologies from public data.
- **People/geo**: correlate usernames across platforms, geolocate photos, and map physical sites.
- **Infrastructure**: WHOIS, certificate transparency, passive DNS, and exposed-service search.
- **Breach & leak review**: check whether credentials appear in public dumps (defensively, to force resets).
- **Analysis**: pivot across data points to build a link graph.

## Tools commonly used
- **Maltego** (link analysis), **SpiderFoot** (automation), **theHarvester**, **recon-ng**, **Shodan/Censys** (exposed services).
- **PhishTank** for known-phish corpora; community projects like `protorecon`, `geo-scout`, and `Gobbledegook` featured in the intel.

## Defensive angle
Organizations run OSINT against *themselves* (attack-surface management) to find leaked credentials, exposed dashboards, and oversharing before adversaries do. Countermeasures include reducing metadata exposure, monitoring certificate transparency logs, and employee awareness training.

## Related
- shodan
- theharvester
- social engineering
- bug bounty hunting
- wireless network attacks

## Sources
- https://www.maltego.com/
- https://www.spiderfoot.net/
- https://osintframework.com/
- https://attack.mitre.org/tactics/TA0043/

## 🎴 Review
<!-- Spaced Repetition cards -->
#flashcards/security-plus

What is OSINT?::The collection and analysis of information from publicly available sources to build knowledge about a target; entirely passive when done well.

Why is well-done OSINT considered passive?::It involves no direct interaction with target systems.

Name common OSINT tools.::Maltego (link analysis), SpiderFoot (automation), theHarvester, recon-ng, and Shodan/Censys.

How do organizations use OSINT defensively?::They run OSINT against themselves (attack-surface management) to find leaked credentials, exposed dashboards, and oversharing before adversaries do.
