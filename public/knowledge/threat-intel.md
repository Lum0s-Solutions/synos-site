# Threat Intelligence and Hunting

> [Defensive analysis only] This node is provided for blue-team understanding, detection engineering, and mitigation — not for offensive use.

# Threat Intelligence and Hunting

Threat intelligence is the discipline of turning scattered observations about
adversaries into decisions a defender can act on: which flaw to patch first,
which log to watch, which behavior signals a breach in progress. This hub is
the read-first entry point to a cluster of atomic notes spanning vulnerability
prioritization, shared adversary frameworks, proactive hunting, and the
tradecraft that separates a nuisance actor from a nation-state. The framing
throughout is defensive: understanding how attacks work so they can be
anticipated, detected, and disrupted.

## Vulnerability prioritization

No team can patch everything, so intelligence begins with ranking. The
cvss scores vulnerabilities to prioritize remediation system gives each CVE
a vendor-neutral 0-to-10 severity, but severity alone is a starting point, not
a verdict. epss estimates the probability a vulnerability will be exploited
answers the complementary question of likelihood, and pairing the two, ideally
alongside the CISA KEV catalog of vulnerabilities confirmed exploited in the
wild, lets defenders patch by expected risk rather than raw score. That
calculus is the practical form of risk equals vulnerability times threat.
Inventory matters too: known vulnerable components inherit their cves, so a
dependency's flaws become yours, and low-level classes such as
fixed width integer types have bounded ranges attackers can overflow show
why some CVEs exist at all.

## Frameworks: ATT&CK, D3FEND, and ATLAS

Threat-informed defense runs on shared knowledge bases. The
mitre attack vs d3fend pairing is the backbone: ATT&CK catalogs adversary
tactics, techniques, and procedures observed in the real world, while D3FEND
encodes the matching countermeasures, so an observed technique maps to a
concrete defense instead of a guess. MITRE ATLAS extends the same model to
machine-learning systems, and emerging agentic threats such as the
tool poisoning attack and the tool shadowing attack show why that
extension matters as AI tooling widens the attack surface. Underpinning all of
it is the principle that
understanding how each attack class works is the basis of defense.

## Threat hunting and telemetry

Knowing a technique exists is not the same as being able to see it happen.
mapping attack ttps to detection telemetry guides threat hunting closes that
gap by tying each technique to the exact data source that reveals it, letting a
blue team build SIEM queries before an alert ever fires. That is why
attackers abuse powershell as a living off the land tool after compromise is
a priority hunt target, and why social-engineering lures like
clickfix attacks trick users into running attacker commands leave
scriptable traces. Hunting also exploits the fact that
attack noise increases from recon to exploitation, giving defenders a
detectable signal as an intrusion escalates. Endpoint sensors such as a
host based ips detects attacks against the operating system feed the
telemetry, and snapshots capture a point in time and store only later changes
preserve state for retrospective hunting and forensic comparison.

## APT tradecraft and attribution

Attribution starts with characterization:
threat actors are characterized by origin resources sophistication and motivation.
At the top end, advanced persistent threats trade speed for long term access,
favoring stealth and dwell time over smash-and-grab. Not every threat is
external, though, since insider threats abuse legitimate access they already have
and evade perimeter controls entirely. Tradecraft also diffuses over time:
publishing an attack technique turns it into a commodity, collapsing the gap
between elite and commodity actors. Defenders can push back on infrastructure,
for example null routing c2 infrastructure pressures attackers into mistakes,
forcing operational errors that aid attribution.

## Indicators of compromise and attack surface

Intelligence feeds an inventory of what to defend. Much of the cluster maps the
attack surface an adversary studies during reconnaissance:
staging and development subdomains are a soft underbelly of the attack surface,
convenient zero config remote access expands a devices attack surface,
shipped debug interfaces are an unintended attack surface,
hidden diagnostic and recovery interfaces expand a devices attack surface,
always on screen capture features expand the data at rest attack surface, and
internet connected industrial control systems expand the attack surface. The
defensive response is to
minimize attack surface by restricting management interfaces and to add
containment such as egress filtering blocks attacks inbound rules miss. Even
physical memory is in scope, since
ram retains data after power loss enabling cold boot attacks.

## The intelligence lifecycle

All of the above hangs on process. The
intelligence life cycle turns raw data into finished intelligence through
five iterative phases, separating collection from analysis so findings are
auditable and repeatable rather than ad hoc. Because the cycle loops, analysis
that surfaces a gap sends the analyst back to planning or collection, which is
how a hunt hypothesis matures into a durable detection instead of a one-off
alert. That same discipline governs adversarial testing, where
black box testing simulates an external attacker and
bug bounty hunting begins with reviewing program scope to keep effort
lawful and in-bounds. Run end to end, the result is a defensible chain from raw
signal to finished intelligence to prioritized action, the whole point of the
practice.

## All component notes

- Social engineering and influence: attackers exploit deference to authority and visual cues, flooding contradictory narratives attacks shared reality itself
- Attack classes and network reach: reflection and amplification attacks magnify ddos with a spoofed source, routers bound broadcast domains limiting layer 2 attack reach, validating public keys on the curve prevents invalid curve attacks

## Related

- cybersecurity MOC
- network security
- forensics ir
- malware re
- appsec web

## Detection & Mitigation
- **Detection:** monitor for the indicators and behaviors associated with this technique/tool via EDR telemetry, host/credential-access auditing, Sysmon, and log correlation; write YARA/Sigma rules for known artifacts.
- **Mitigation:** apply least privilege, credential protection/hardening, network segmentation, MFA, and application allowlisting to reduce exposure.
- **Framing:** studied here for defensive analysis and blue-team readiness only.
