# Hardware and Physical Security

# Hardware and Physical Security

Every software defense ultimately rests on hardware behaving as promised — the CPU enforcing privilege, the chip guarding a key, the cable carrying only what its shape implies. This hub is the read-to-learn entry point for the layer beneath the operating system: roots of trust, physical attack surface, side channels, and the supply chain that delivers the silicon. The recurring lesson is defensive: trust in hardware must be earned and verified, never assumed from appearance.

## Roots of trust and hardware-enforced boundaries

Trust has to start somewhere, and the strongest anchor is a component you can rely on to bootstrap trust in everything loaded after it. a tpm provides a hardware root of trust describes how a dedicated security processor stores keys and boot measurements in tamper-resistant silicon, enabling full-disk encryption sealed to boot state, measured/secure boot that detects tampered firmware, and hardware-backed attestation. This anchor resists offline disk theft and bootkits that pure-software defenses cannot. The other hardware-enforced boundary is privilege itself: cpu protection rings separate kernel from user code explains why a compromised ring-3 application does not automatically become a compromised ring-0 kernel — the processor refuses privileged operations from user space, and most privilege-escalation effort is precisely the fight to cross that line.

## Hardware CPU flaws below every software layer

Those boundaries hold only while the silicon obeys its own rules. a hardware cpu flaw defeats every software isolation layer uses the GhostWrite defect to show how a single unprivileged instruction writing to physical memory sits *below* sandboxes, hypervisors, and containers — because all of them delegate address translation and privilege enforcement to the CPU, none can contain a CPU that ignores its own contract. Defenders who treat VMs as absolute quarantine are wrong when the underlying hardware is flawed. Finding these unpatchable defects before attackers do is its own discipline: differential fuzzing finds cpu defects by comparing implementations runs identical generated programs across many independent implementations of an open spec like RISC-V and flags the outlier — the hotel safe that springs open when the other four stay locked — using only cheap commodity boards and no vendor cooperation.

## Side channels and physical memory attacks

Even a correct CPU can leak secrets through *how long* it works or *what remains* in memory. constant time comparison closes the timing side channel on secrets shows how a naive equality check that short-circuits on the first mismatched byte turns comparison time into an oracle an attacker reconstructs byte by byte; the fix is to compare every byte so total work is independent of the secret. This timing discipline generalizes to any branch or memory access whose duration depends on secret data — the same class of physical-emanation leak that makes cold-boot RAM remanence and cache side channels so dangerous, since the data is exposed by physics rather than by any logic bug the vendor can patch cleanly.

## Debug interfaces, cables, and embedded attack surface

Physical ports and peripherals are computers, not passive conduits. usb c cables can contain active electronics that mask their capabilities tears down cables sharing an identical plug to find some are bare wires and others hide full integrated circuits — one capable of running Doom. Appearance is not evidence of function, and a hostile implant exploits exactly that uniform form factor, so treat cables and adapters as untrusted computing devices sourced only from known-good suppliers. The same reasoning drives the strongest peripheral control: physically removing a component is more trustworthy than disabling it argues that a software toggle is merely a policy a device promises to honor, while removing a microphone, camera, or radio eliminates the capability entirely — a part that is not wired in has no code path that can re-enable it.

## RF, wireless, and physical infrastructure

Radios extend a device's reach beyond any cable, and location itself becomes both a control and a dependency. geofencing restricts data access by physical location uses network subnet, GPS, or visible wireless SSIDs to gate sensitive data to trusted places, adding a dimension a stolen password cannot satisfy. At the largest scale, redundant physical paths let internet traffic reroute around failures treats availability as a security goal: undersea-cable redundancy and dynamic routing let traffic survive a cut, but shared chokepoints reveal where that resilience quietly runs out.

## Supply chain, provenance, and counterfeit hardware

Hardware carries an identity from the moment it is made. a hardware serial number ties a device to its buyer from the point of sale explains how a purchase binds name, payment, and address to a serial before the machine is ever powered on — provenance that aids attribution for defenders and matters to anyone reasoning about a clean chain of custody. That same chain, when it runs through untrusted resellers or mixed used parts, is where counterfeit and implanted hardware enter, tying this domain directly to the broader supply-chain problem.

## All component notes

- a tpm provides a hardware root of trust
- cpu protection rings separate kernel from user code
- a hardware cpu flaw defeats every software isolation layer
- differential fuzzing finds cpu defects by comparing implementations
- constant time comparison closes the timing side channel on secrets
- usb c cables can contain active electronics that mask their capabilities
- physically removing a component is more trustworthy than disabling it
- geofencing restricts data access by physical location
- redundant physical paths let internet traffic reroute around failures
- a hardware serial number ties a device to its buyer from the point of sale

## Related

- cybersecurity MOC
- supply chain
- endpoint hardening
- cryptography
- network security
- forensics ir
