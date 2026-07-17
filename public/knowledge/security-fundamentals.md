# Security Fundamentals

# Security Fundamentals

This hub is the read-to-learn entry point for the bedrock ideas every other cybersecurity topic builds on: what security is trying to protect, how safeguards are organized, how risk is reasoned about, and how systems are kept recoverable. The framing throughout is defensive — these are the mental models a defender uses to design, evaluate, and harden real systems. Start here, then branch into the specialist hubs linked at the bottom.

## The CIA triad and core goals

Almost everything in security maps back to three properties, captured by the cia triad confidentiality integrity availability: confidentiality (data seen only by the authorized), integrity (data unaltered and verifiable), and availability (systems reachable when legitimate users need them). Most attacks are simply an assault on one of the three — theft breaks confidentiality, tampering breaks integrity, and a denial-of-service breaks availability. Holding the triad in mind gives you a shared vocabulary for asking, of any control or threat, "which property does this protect or attack?"

## Security controls and defense-in-depth

Controls are organized along two independent axes. First, by mechanism: security controls fall into four implementation categories — technical (firewalls, permissions), managerial (policies), operational (people running a process), and physical (locks, badge readers). Second, by timing: security control types are defined by when they act — preventive, deterrent, detective, corrective, compensating, and directive. A mature posture layers many independent controls so no single failure is fatal, but layering must not become a maze: overly complex security controls get bypassed by users, so friction belongs on the adversary, not the authorized user. Controls must also be enforced where an attacker cannot reach them — client side validation is not a security control because anything running in the user's browser can be tampered with, so trust boundaries have to sit on the server. Some layers are about reducing what reaches users at all, as when website reputation scoring blocks high risk sites before a request is ever made.

## Risk and threat modeling

Defenders spend finite resources against near-infinite threats, so they reason in terms of blast radius and likelihood. Architectural choices change the risk profile: aggregating data into one master database concentrates breach risk, turning many siloed systems into one high-value target, which is the first-principles argument for data minimization and segmentation. Unmanaged surface is the quiet killer — shadow it creates unmanaged risk inside the organization because assets nobody tracks are assets nobody patches, and incompletely removed software leaves residual configuration and risk when leftover files, services, and registry keys persist after an uninstall. Time itself is a risk multiplier: sustained covert operation accumulates exposure risk over time, meaning the longer any operation or foothold runs undetected, the greater the chance of exposure. Even ordinary code carries threat surface, as when unbounded loops are a denial of service risk that an attacker can trigger to exhaust resources.

## Least privilege and change discipline

Sound design minimizes what any single actor, component, or change can touch. The same logic that argues against data aggregation argues for least-privilege access and tight scoping everywhere. Change is a distinct risk to manage on its own terms: mandatory updates need reversible rollout and pre change backups so that a bad patch can be rolled back rather than becoming an outage. Dependency choices are also a long-horizon exposure — proprietary tool lock in is a business continuity risk because a vendor's failure, price change, or discontinuation can strand the organization with no exit.

## Resilience, backup, and availability

Availability and recoverability are separate disciplines that are easy to confuse. Redundancy keeps systems running: high availability means continuous operation not just redundancy, and while raid survives a disk failure but is not a backup, it faithfully replicates deletions, ransomware, and corruption to every disk at once. Recovery is what backups provide, and only if they are real: backups must be tested offline and retained to survive ransomware, because an untested or always-connected backup is one that ransomware encrypts alongside production. Placement matters too — onsite backups restore fast offsite backups survive disasters, so a sound posture keeps both. Recovery capability is measurable: mean time to repair measures recovery resilience, quantifying how quickly service is restored after failure.

## Governance basics

Governance ties the technical picture to accountability: policies (managerial controls), asset inventory that eliminates shadow IT, documented change and update procedures, data classification that drives proportional protection, and continuity planning that names owners and recovery targets. Governance is where risk decisions — what to centralize, what to retain, what to accept — are recorded and revisited rather than made ad hoc.

## All component notes

- cia triad confidentiality integrity availability
- security controls fall into four implementation categories
- security control types are defined by when they act
- overly complex security controls get bypassed by users
- client side validation is not a security control
- website reputation scoring blocks high risk sites
- aggregating data into one master database concentrates breach risk
- shadow it creates unmanaged risk inside the organization
- incompletely removed software leaves residual configuration and risk
- sustained covert operation accumulates exposure risk over time
- unbounded loops are a denial of service risk
- mandatory updates need reversible rollout and pre change backups
- proprietary tool lock in is a business continuity risk
- high availability means continuous operation not just redundancy
- raid survives a disk failure but is not a backup
- backups must be tested offline and retained to survive ransomware
- onsite backups restore fast offsite backups survive disasters
- mean time to repair measures recovery resilience

## Related

- cybersecurity MOC
- network security
- endpoint hardening
- identity access
- cryptography
- web appsec
