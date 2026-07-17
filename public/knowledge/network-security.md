# Network Security

# Network Security

Network security is the discipline of protecting data as it moves between hosts, and of controlling which hosts may reach which resources at all. It spans the addressing and protocol machinery that makes communication possible, the trust assumptions baked into that machinery, the attacks that exploit those assumptions, and the layered architecture, encryption, and monitoring defenders use to contain the damage. Because nearly every compromise either traverses or targets the network, reasoning clearly about it is foundational to every other security domain.

## Layered models and addressing

Defenders think in layers. each osi layer has its own trust assumption and attack surface because each level accepts what the layer below hands it on faith, and layered network models locate where data and attacks move. Addressing itself carries assumptions: a subnet mask splits an address into network and host bits, subnetting borrows host bits to resize a network, and every ip subnet reserves its first and last address. A host reaches the wider world through a default gateway is a hosts only exit to other networks, and a misconfiguration where a host with gateway outside its subnet cannot reach the network breaks connectivity outright. Globally, ip address allocation flows from iana through regional registries, which is why reserved ip ranges should never appear as internet source traffic and why nat is an incidental not a deliberate security boundary — a distinction that matters more as ipv6 end to end addressing removes nats incidental inbound shielding. At the transport layer, tcp sequence numbers order packets and hinder blind connection hijacking, while tcp ip header fields leak operating system fingerprints to any observer.

## Protocols and their broken trust

The core protocols were built for a cooperative internet, and their missing authentication is now the attack surface. arp has no authentication enabling spoofing and man in the middle, and the same broadcast behavior means arp host discovery defeats icmp and tcp filtering on the local segment. dns lacks authentication so spoofed responses can redirect victims because dns correlates stateless queries and responses with a transaction id that an attacker can race, and dns resolution depends on both udp and tcp. Resolution is also a chain of trust: a dns client trusts an opaque chain of forwarders and resolvers, devices with hardcoded dns resolvers bypass network dns policy, and a dns zone transfer misconfiguration exposes the full record set. Defenders reclaim control through a self hosted recursive resolver removes dependence on third party dns and protective dns response policy zones, accepting that dns blocklists cannot stop content served from its own domain. Cleartext remains a persistent liability: legacy cleartext protocols expose credentials to sniffing and plaintext credentials on a shared network can be captured by sniffing, so disabling legacy authentication protocols removes relay and downgrade paths.

## Attacks, evasion, and covert channels

Some attacks starve availability rather than steal data: half open tcp connections exhaust server state in a syn flood. Others smuggle traffic past controls — tunneling traffic over icmp evades port based firewalls, encapsulated packets can smuggle traffic into a trusted network, and packet fragmentation evades inspection that skips reassembly. dns as malware command and control channel is a classic covert path, and reverse shells bypass inbound firewall restrictions entirely by dialing outward. Detection follows: detect protocol tunneling by process lineage not just destination, and network simulation reveals malware command and control. Impersonation attacks target the physical and radio edge: a rogue access point impersonates a network to intercept public wi fi, cell site simulators intercept phones by impersonating a tower, and malicious usb devices can impersonate keyboards, while counterfeit hardware enters the network through untrusted resellers and a network partition opens a window to hijack names and resources.

## Firewalls, segmentation, and architecture

Filtering is a spectrum. firewall rules evaluate top down ending in implicit deny, and firewall generations trade simplicity for context awareness: stateless packet filtering firewalls are spoofable and application blind, whereas stateful packet inspection tracks connection state so that stateful firewalls resist crafted tcp flag probes, and a next generation firewall filters by application not just port. At the edges, a host based firewall isolates endpoints from lateral movement and a web application firewall blocks exploit variants but does not replace patching — though a detectable web application firewall aids its own evasion. Architecture contains blast radius: network segmentation limits breach blast radius, screened subnet isolates internet facing services, and a jump server is a hardened gateway into an internal network. VLANs partition switched fabric — a switched network delivers a host only its own traffic unless the port is mirrored, a trunk port carries multiple vlans over one link using tags, and pruning allowed vlans on a trunk enforces least privilege — but a native vlan mismatch can leak traffic across segments and a downstream router reclaims segmentation on a network you dont control. VPNs extend trust: a site to site vpn merges two sites into one trust domain, though site to site and remote access vpns serve different endpoints, a vpns protection depends on its protocol and independent audits, and overlay vpn coordination servers broker connections without seeing traffic.

## Access control and attack-surface reduction

Before a device gets an address, network access control governs who may join the network and posture assessment gates network access on device compliance. Shrinking surface is continuous: disabling upnp reduces network attack surface, unused software and open ports expand attack surface, and internet exposed database ports invite direct compromise. Knowing your own exposure means mapping a listening port to its owning process exposes rogue services, recognizing any unprivileged user can run a network service on a high port, and that critical apps on non standard ports is obscurity, not security.

## Wireless, monitoring, and privacy

Radio is a broad seam: wireless and rf interfaces are a broad often unsecured attack surface. wpa3 sae eliminates offline handshake cracking, yet wifi probe requests leak a devices saved network names and wardriving databases map a network name to a physical location. On the monitoring side, monitor mode enables full packet capture and capture filters discard packets permanently while display filters only hide them; tooling like nmap port states and netcat is a general purpose tcp ip tool map exposure — though unauthorized port scanning legal risk is real. Detection demands judgment: false positives vs false negatives in security alerting, and no detected activity is not proof that a network is clean. Privacy is always partial: network anonymity is reduction not elimination of traceable signals, since an isp can see that you use an anonymity network even when it cannot see what and traffic correlation deanonymizes low latency anonymity networks.

## All component notes

Addressing and models:
- dns resolution depends on both udp and tcp

Protocols and DNS:
- a package manager trusts every configured repository

Segmentation and access:
- byod cope and cyod balance device ownership and control
- an asset inventory assigns ownership across the device lifecycle
- data classification enables proportional protection

Mesh and off-grid networks:
- decentralized mesh radio provides off grid communication
- mesh nodes relay messages hop by hop to extend range beyond one radio
- a manet reroutes around offline nodes without central coordination
- a remote sensor network can be defeated by feeding it decoy signals
- a wireless site survey maps signal and interference before deployment

Peer-to-peer and federation trust:
- sybil attacks exploit cheap identities to overwhelm peer to peer networks
- an open federated network trusts every peer it accepts
- coordinated inauthentic accounts age before they activate
- network effects create switching costs that let platforms erode privacy
- volunteer hosted hidden services trade availability for censorship resistance
- a browser exploit deanonymizes an anonymity network user

Detection and frontline response:
- dismissing frontline user reports lets intrusions dwell
- a reported phishing email triggers response that protects every other inbox

Social engineering and impersonation:
- spearphishing tailors the lure to a specific target
- vishing uses caller id spoofing to impersonate trusted callers
- out of band verification defeats impersonation pretexts
- structured rapport frameworks are social engineering elicitation tools

OSINT and metadata hygiene:
- managed attribution for osint
- osint relies only on public information so self audit reveals exposure
- strip file metadata before sharing

Vulnerability disclosure and testing:
- a strong vulnerability report and proof of concept earn the bounty
- ai generated bogus vulnerability reports overwhelm security triage
- flooding triage with fake reports can mask a real vulnerability
- requiring disclosure of ai use filters low effort vulnerability reports
- security research disclosure evolved from full to coordinated
- penetration test value is the report

Software and supply-chain surface:
- memory safe languages eliminate whole classes of vulnerabilities
- a binary import table reveals its capabilities

AI agents and system access:
- a terminal ai agent inherits the operators file and network access
- model context protocol
- neural networks learn by adjusting connection weights not hand coded rules
- reward hacking optimizes the proxy metric not the intended goal
- shizuku rootless privilege proxy

## Related
- cybersecurity MOC
- cryptography
- web appsec
- threat intel
- endpoint security
