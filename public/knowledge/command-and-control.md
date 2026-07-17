# Command-and-Control (C2) Frameworks

# Command-and-Control (C2) Frameworks

Command-and-control (C2, also C&C) refers to the infrastructure and software an operator uses to remotely direct compromised hosts ("agents," "implants," or "beacons") after initial access. In legitimate work, red teams and penetration testers use C2 frameworks to emulate real adversaries; the same techniques underpin criminal botnets and RATs, which is why C2 is a core detection target for blue teams.

## How it works
- **Agent/implant** runs on the victim and periodically *beacons* out to the operator, inverting the connection so it survives NAT and egress firewalls.
- **Team server / listener** receives check-ins and queues tasking (run command, upload/download, pivot).
- **Communication channels** hide traffic in ordinary protocols: HTTP(S), DNS, WebSocket/WebRTC, and increasingly *domain fronting*, CDN fronting, and blockchain memos (all patterns discussed in the community's noPROXY-c2s experiments).
- **Malleable profiles** let operators reshape traffic to blend with normal web activity and evade signatures.

## Tools commonly used
- **Cobalt Strike** — the dominant commercial red-team C2 (and heavily abused).
- **Sliver** (BishopFox), **Mythic**, **Havoc**, and **Metasploit/Meterpreter** — widely used open-source frameworks.
- Community-built projects seen in the intel: Havoc, `c2itall`, `noPROXY-c2s`, `RANGER_C3`, and various "vibe-coded" C2 experiments.

## Defensive angle
C2 detection relies on spotting *beaconing* (regular, jittered callbacks), unusual JA3/TLS fingerprints, DNS tunneling volume, and known malleable profiles. Frameworks like MITRE ATT&CK map C2 sub-techniques (TA0011) so defenders can build coverage; EDR, network detection (Zeek/Suricata), and threat intel feeds on C2 IPs/domains are the standard countermeasures.

## Related
- cobalt strike
- botnets
- reverse shell
- malware development
- red teaming

## Sources
- https://attack.mitre.org/tactics/TA0011/
- https://github.com/BishopFox/sliver
- https://github.com/HavocFramework/Havoc
- https://en.wikipedia.org/wiki/Command_and_control_(malware)

## 🎴 Review
<!-- Spaced Repetition cards -->
#flashcards/security-plus

What is command-and-control (C2)?::The infrastructure and software an operator uses to remotely direct compromised hosts (agents/implants/beacons) after initial access.

Why does a C2 agent "beacon" out to the operator?::Beaconing inverts the connection so the implant survives NAT and egress firewalls.

How does C2 traffic hide from detection?::By blending into ordinary protocols (HTTP(S), DNS, WebSocket), using domain/CDN fronting, and malleable profiles.

Which open-source C2 frameworks are widely used?::Sliver (BishopFox), Mythic, Havoc, and Metasploit/Meterpreter.

How do defenders detect C2?::Spotting beaconing (regular, jittered callbacks), unusual JA3/TLS fingerprints, DNS tunneling volume, and known malleable profiles.
