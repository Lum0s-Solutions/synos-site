# Botnets

# Botnets

A botnet is a network of internet-connected devices ("bots" or "zombies") infected with malware and controlled collectively by an operator (the "bot herder") through a command-and-control channel. Botnets monetize scale — thousands of hosts acting in concert — and are used for DDoS, spam, credential stuffing, cryptomining, and proxy/residential-IP resale. Studying how they are built and coordinated is essential to detecting and dismantling them.

## How it works
- **Recruitment**: hosts are compromised via exploits, phishing, weak/default credentials, or trojanized software; IoT devices are prime targets (see Mirai).
- **Topologies**: classic *centralized* (IRC/HTTP C2), *P2P* (resilient, no single takedown point), and *hybrid* designs.
- **Tasking**: the herder issues commands (flood a target, scan, drop secondary payloads).
- **Resilience**: domain generation algorithms (DGAs), fast-flux DNS, and fronting keep C2 reachable after takedowns.

## Tools and examples
- **Mirai** (IoT) and its many forks are the canonical open-source reference for how modern botnets are structured.
- Community projects in the intel emphasized C2 plumbing (`noPROXY-c2s`, `RANGER_C3`, `c3po-node`) rather than mass infection.

## Defensive angle
Defenders sinkhole C2 domains, monitor for beaconing and DGA traffic, and coordinate takedowns with registrars/hosts. Network egress filtering, patching IoT firmware, changing default credentials, and rate-limiting help prevent enrollment. Threat-intel sharing of bot IPs feeds firewalls and blocklists.

## Seen in the community
The dedicated **#b0tnets** channel (284 msgs, top keyword `c2`) is where members shared C2 panels and debated botnet-vs-RAT terminology, and cross-posted honeypot captures of live worms.

## Related
- [[command-and-control]]
- [[malware-development]]
- [[honeypots]]
- [[reverse-engineering]]
- [[red-teaming]]
- [[Discord Intel/discord-intel-MOC|Discord Intel]]

## Sources
- https://attack.mitre.org/tactics/TA0011/
- https://en.wikipedia.org/wiki/Botnet
- https://www.cloudflare.com/learning/ddos/what-is-a-ddos-botnet/

## 🎴 Review
<!-- Spaced Repetition cards -->
#flashcards/security-plus

What is a botnet?::A network of internet-connected devices ("bots"/"zombies") infected with malware and controlled collectively by an operator (bot herder) via a command-and-control channel.

What are botnets commonly used for?::DDoS, spam, credential stuffing, cryptomining, and proxy/residential-IP resale.

What are the three botnet C2 topologies?::Centralized (IRC/HTTP C2), P2P (resilient, no single takedown point), and hybrid designs.

How do botnets stay resilient after takedowns?::Domain generation algorithms (DGAs), fast-flux DNS, and domain fronting keep the C2 reachable.

Which malware is the canonical open-source reference for modern botnet structure?::Mirai (an IoT botnet) and its many forks.
