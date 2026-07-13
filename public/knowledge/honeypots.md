# Honeypots

# Honeypots

A honeypot is a deliberately exposed, monitored decoy system designed to attract attackers so their tools, credentials, and techniques can be observed and studied. Because *no legitimate user* should ever touch a honeypot, any interaction is high-signal — making honeypots a low-false-positive detection and research tool. A collection of coordinated honeypots is a *honeynet*.

## How it works
- **Interaction level**: *low-interaction* emulates a few services (fast, safe); *high-interaction* exposes real OSes/apps (richer data, higher risk).
- **Placement**: internet-facing to catch mass scanning/worms, or internal as "canaries" to detect lateral movement.
- **Capture**: log every command, uploaded payload, and C2 callback; pull malware samples (e.g., worms off an SSH honeypot) for later reverse engineering.
- **Isolation**: honeypots must be sandboxed so a compromise cannot pivot into production.

## Tools commonly used
- **Cowrie** (SSH/Telnet), **Dionaea**, **T-Pot** (all-in-one), **Canarytokens** for tripwire files.
- Community references: `cowrie/cowrie` and ekomsSavior's `Honeypot_data_assessment_guide` were shared for analyzing captured data.

## Defensive angle
Honeypots deliver early warning, threat intelligence (fresh IOCs and IPs), and malware samples for signature development. The captured C2 IPs and droppers feed blocklists and YARA rules. Care is required: a poorly isolated high-interaction honeypot can leak real credentials — a lesson members shared firsthand.

## Seen in the community
**#honeypot-palace** members ran SSH/Pi honeypots, caught live worms and "the whole botnet," extracted C2 IPs via `strings`, and offered binaries for group static analysis.

## Related
- [[botnets]]
- [[malware-development]]
- [[reverse-engineering]]
- [[command-and-control]]
- [[threat-hunting-MOC]]
- [[Discord Intel/discord-intel-MOC|Discord Intel]]

## Sources
- https://github.com/cowrie/cowrie
- https://github.com/telekom-security/tpotce
- https://en.wikipedia.org/wiki/Honeypot_(computing)

## 🎴 Review
<!-- Spaced Repetition cards -->
#flashcards/security-plus

What is a honeypot?::A deliberately exposed, monitored decoy system designed to attract attackers so their tools, credentials, and techniques can be observed and studied.

Why is any interaction with a honeypot high-signal?::Because no legitimate user should ever touch a honeypot, so any interaction is high-signal with low false positives.

What is the difference between low- and high-interaction honeypots?::Low-interaction emulates a few services (fast, safe); high-interaction exposes real OSes/apps (richer data, higher risk).

What is a honeynet?::A collection of coordinated honeypots.

Which tools are common for honeypots?::Cowrie (SSH/Telnet), Dionaea, T-Pot (all-in-one), and Canarytokens for tripwire files.
