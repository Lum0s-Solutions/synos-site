# Digital Forensics and Incident Response

# Digital Forensics and Incident Response

Digital Forensics and Incident Response (DFIR) is the discipline of detecting, containing, and reconstructing security incidents while preserving evidence to a standard that survives technical and legal scrutiny. This hub is a read-to-learn entry point that ties together the granular notes on how defenders run the response loop, acquire and protect evidence, build timelines from logs, recognize indicators of compromise, and see through anti-forensic tradecraft. Everything here is framed defensively: the goal is faster detection, cleaner evidence, and durable organizational learning.

## The incident response lifecycle

Response is a rehearsed, repeating loop rather than an improvised scramble. The [[nist-incident-response-lifecycle]] structures that loop through preparation, identification, containment, eradication, recovery, and lessons learned, so a team acts from a playbook under stress. The metric that drives urgency is [[dwell-time-measures-the-gap-between-breach-and-detection]] — the months attackers often operate undetected while escalating and exfiltrating. Because perfect prevention is unattainable, [[reactive-defense-cedes-the-dwell-time-attackers-need-to-win]] argues for shifting investment toward telemetry and rapid response. Even mature programs retain leftover exposure, which is why [[cyber-insurance-transfers-residual-risk-rather-than-preventing-incidents]] rather than removing it. Understanding attacker workflow also sharpens the defense: the [[five-phase-penetration-testing-methodology]] mirrors how real intrusions progress from recon to actions-on-objective, giving responders a map of what to look for at each stage.

## Evidence handling and chain of custody

Findings are only useful if they hold up. A [[chain-of-custody-preserves-evidence-integrity]] by documenting every person who collected, handled, and stored evidence, so any claim of tampering can be rebutted. At acquisition time, [[a-forensic-write-blocker-preserves-evidence-by-blocking-all-writes-to-seized-media]], because an analysis host will silently touch a disk — updating access times or replaying journals — unless a hardware barrier denies every write. The disciplined pattern is attach through the blocker, hash the original, image it, and work only from the verified copy.

## Memory and disk acquisition

Modern intrusions increasingly avoid the filesystem, so acquisition must reach memory. [[a-memory-resident-backdoor-leaves-no-files-on-disk-to-scan]] shows why file-based scanning misses fileless implants that vanish on reboot, making live memory capture essential. Effective disk and host analysis depends on knowing where artifacts live — [[knowing-the-linux-filesystem-layout-speeds-hardening-and-forensics]] turns a triage sweep into a targeted one. The isolation guarantees that shape memory forensics come from the OS itself: [[per-process-page-tables-isolate-one-programs-memory-from-another]] explains why one process cannot silently read another's address space, and [[omitting-privilege-levels-and-memory-isolation-trades-security-for-simplicity]] shows what breaks when those boundaries are absent. Even collection-tool design matters, since [[avoiding-runtime-memory-allocation-removes-a-class-of-failures]] in the acquisition path. On mobile endpoints, subtle signals count too — [[battery-drain-as-a-wakelock-forensic-signal]] can betray a background process no file scan would catch.

## Timeline and log analysis

Reconstruction is only possible when events can be ordered. [[authenticated-time-synchronization-underpins-forensic-timelines]] and, more broadly, [[synchronized-time-is-a-prerequisite-for-log-correlation]] — without a trusted clock, events from different systems cannot be stitched into a coherent narrative. Centralized visibility comes from a [[siem-centralizes-and-correlates-security-logs]] across hosts, while [[shipping-logs-to-a-remote-host-preserves-them-after-a-compromise]] so an attacker who wipes a box cannot also erase the record of what they did. Authentication logs feed active defenses like [[fail2ban-bans-brute-force-sources-from-authentication-logs]], and the same append-only discipline that protects databases via [[write-ahead-logging-enables-crash-recovery-and-replication]] illustrates why ordered, durable records are the backbone of both recovery and investigation.

## Indicators of compromise

Signatures alone are insufficient against adaptive adversaries. [[behavioral-indicators-of-attack-detect-what-static-iocs-miss]] by focusing on what an intruder does rather than a known-bad hash. One of the strongest behavioral signals is absence: [[missing-or-deleted-logs-are-an-indicator-of-compromise]], because attackers clean up after themselves. Prioritization draws on external intelligence, since [[the-cisa-kev-catalog-lists-vulnerabilities-confirmed-exploited-in-the-wild]] and tells defenders which exposures are actually being weaponized. Detection engineering has limits worth naming — [[fuzzers-find-crashes-but-miss-non-crashing-logic-flaws]], a reminder that automated discovery covers only part of the attack surface.

## Anti-forensics and detection evasion

Sophisticated actors actively fight investigation. [[amnesic-live-operating-systems-leave-no-persistent-forensic-trace]], erasing evidence by design once powered off, which is precisely why live acquisition and memory capture matter. Yet attackers are not infallible — [[attacker-operational-mistakes-enable-forensic-attribution]], and the reused infrastructure, leaked handles, and timezone slips they leave behind are often what finally unmasks them. The defender's job is to widen the aperture so those mistakes surface.

## All component notes

- [[nist-incident-response-lifecycle]]
- [[dwell-time-measures-the-gap-between-breach-and-detection]]
- [[reactive-defense-cedes-the-dwell-time-attackers-need-to-win]]
- [[cyber-insurance-transfers-residual-risk-rather-than-preventing-incidents]]
- [[five-phase-penetration-testing-methodology]]
- [[chain-of-custody-preserves-evidence-integrity]]
- [[a-forensic-write-blocker-preserves-evidence-by-blocking-all-writes-to-seized-media]]
- [[a-memory-resident-backdoor-leaves-no-files-on-disk-to-scan]]
- [[knowing-the-linux-filesystem-layout-speeds-hardening-and-forensics]]
- [[per-process-page-tables-isolate-one-programs-memory-from-another]]
- [[omitting-privilege-levels-and-memory-isolation-trades-security-for-simplicity]]
- [[avoiding-runtime-memory-allocation-removes-a-class-of-failures]]
- [[battery-drain-as-a-wakelock-forensic-signal]]
- [[authenticated-time-synchronization-underpins-forensic-timelines]]
- [[synchronized-time-is-a-prerequisite-for-log-correlation]]
- [[siem-centralizes-and-correlates-security-logs]]
- [[shipping-logs-to-a-remote-host-preserves-them-after-a-compromise]]
- [[fail2ban-bans-brute-force-sources-from-authentication-logs]]
- [[write-ahead-logging-enables-crash-recovery-and-replication]]
- [[behavioral-indicators-of-attack-detect-what-static-iocs-miss]]
- [[missing-or-deleted-logs-are-an-indicator-of-compromise]]
- [[the-cisa-kev-catalog-lists-vulnerabilities-confirmed-exploited-in-the-wild]]
- [[fuzzers-find-crashes-but-miss-non-crashing-logic-flaws]]
- [[amnesic-live-operating-systems-leave-no-persistent-forensic-trace]]
- [[attacker-operational-mistakes-enable-forensic-attribution]]

## Related

- [[cybersecurity-MOC]]
- [[dfir-forensics-MOC]]
- [[threat-intel]]
- [[network-security]]
- [[threat-hunting-MOC]]
- [[soc-analyst-MOC]]
