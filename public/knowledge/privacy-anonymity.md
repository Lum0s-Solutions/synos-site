# Privacy and Anonymity

# Privacy and Anonymity

Privacy is the ability to control what is known about you; anonymity is the harder property of acting without that action being linkable back to you. This hub is a defensive, read-to-learn entry point into how anonymity is engineered, how it is broken, and why the hardest failures are almost never the cryptography — they are metadata, correlation, and human operational error. Everything here is framed for defenders, journalists, researchers, and anyone modeling their own exposure, not for evading accountability.

## Threat modeling and OPSEC

Effective privacy begins with a threat model: who the adversary is, what they can observe, and what they are willing to spend. That framing determines which controls matter, and it makes clear that [[compliance-is-a-trailing-indicator-not-a-security-guarantee]] — passing an audit describes yesterday's paper state, not whether you are actually unlinkable today. Quantifying exposure helps prioritize: the [[exposure-factor-quantifies-potential-loss-from-a-vulnerability]] by estimating the fraction of an asset's value lost if a given weakness is realized, which turns vague privacy worries into rankable risk. The recurring lesson across real cases is that anonymity is a system property that fails at its weakest human seam, not at its strongest algorithm.

## Anonymity networks: Tor and I2P

The core mechanism of modern anonymity is distributing trust so no single party can unmask you. [[onion-routing-distributes-trust-across-three-independent-relays]] is the canonical design: the guard sees your IP but not your destination, the exit sees your destination but not your IP, and no one hop sees both. This is why a single-provider VPN and Tor solve different problems — Tor removes the single subpoena-able point a VPN represents. Anonymity networks can also host services, and [[self-hosting-a-service-over-tor-removes-third-party-custody-of-data]] shows how an onion service keeps data out of a third-party provider's hands entirely, shrinking the surface a subpoena or breach can reach. But the design's residual weaknesses are real and specific: [[guard-discovery-attacks-locate-a-tor-users-entry-node]] by inducing many connections until an attacker-run relay lands next to your guard, converting an anonymous target into a fixed IP an ISP can then expose. Keeping current defenses (such as Vanguards) enabled is itself an OPSEC requirement.

## Metadata, correlation, and deanonymization

The most durable lesson of the surveillance era is that content encryption is not enough. [[bulk-metadata-reveals-behavior-without-reading-message-content]] — who contacted whom, when, and from where maps social graphs, routines, and locations without ever reading a payload. That same correlation logic defeats "anonymized" data at scale: [[anonymized-telemetry-can-be-re-identified-by-correlation]] against outside datasets, and [[correlating-a-device-across-locations-and-times-reveals-surveillance]] by fingerprinting a device's movement pattern. Content itself is an identifier too. [[stylometric-fingerprinting-can-deanonymize-anonymous-authors]] by measuring unconscious word-choice habits, and more broadly [[behavioral-patterns-like-writing-style-can-deanonymize-separate-accounts]] even after names and headers are scrubbed. Images leak location the same way: [[photographs-can-be-geolocated-from-metadata-and-visual-cues]] embedded in EXIF or visible in the frame.

## Data brokers, re-identification, and de-identification

Legal de-identification standards create a dangerous false comfort. [[removing-listed-identifiers-does-not-make-a-dataset-anonymous]] because quasi-identifiers like ZIP, birthdate, and gender uniquely single out most people once correlated. Sweeney, the Netflix re-identification, and the Strava heatmap all prove the point: [[legal-de-identification-is-a-floor-not-a-guarantee-of-anonymity]]. The rigorous countermeasure is mathematical rather than list-based — [[differential-privacy-adds-calibrated-noise-to-hide-individuals]] so that any one person's presence or absence cannot be inferred from an aggregate query. Two structural facts make this urgent: [[persistent-records-make-deanonymization-irreversible]] once a linkage is recorded, and any leak feeds a downstream market where profiles are assembled and sold indefinitely.

## Surveillance, tracking, and operational compartmentalization

Where a network can watch enough of the path, low-latency anonymity degrades through traffic correlation — so defenders must assume a global-ish observer is a real threat model, not a hypothetical. The most common failure, though, is self-inflicted linkage. [[reusing-work-or-institutional-email-on-anonymous-accounts-unmasks-you]] is the archetype: a single .gov or corporate address in a breached registration table ties a pseudonym to a real institution permanently, defeating every other precaution. The control is compartmentalization — dedicated identities with zero crossover between pseudonymous, professional, and personal life, so a breach of one system cannot cascade into deanonymizing the others. Compartmentation is a discipline enforced continuously, not a one-time setup.

## All component notes

- [[compliance-is-a-trailing-indicator-not-a-security-guarantee]]
- [[exposure-factor-quantifies-potential-loss-from-a-vulnerability]]
- [[onion-routing-distributes-trust-across-three-independent-relays]]
- [[self-hosting-a-service-over-tor-removes-third-party-custody-of-data]]
- [[guard-discovery-attacks-locate-a-tor-users-entry-node]]
- [[bulk-metadata-reveals-behavior-without-reading-message-content]]
- [[anonymized-telemetry-can-be-re-identified-by-correlation]]
- [[correlating-a-device-across-locations-and-times-reveals-surveillance]]
- [[stylometric-fingerprinting-can-deanonymize-anonymous-authors]]
- [[behavioral-patterns-like-writing-style-can-deanonymize-separate-accounts]]
- [[photographs-can-be-geolocated-from-metadata-and-visual-cues]]
- [[removing-listed-identifiers-does-not-make-a-dataset-anonymous]]
- [[legal-de-identification-is-a-floor-not-a-guarantee-of-anonymity]]
- [[differential-privacy-adds-calibrated-noise-to-hide-individuals]]
- [[persistent-records-make-deanonymization-irreversible]]
- [[reusing-work-or-institutional-email-on-anonymous-accounts-unmasks-you]]

## Related

- [[cybersecurity-MOC]]
- [[network-security]]
- [[identity-access]]
- [[threat-intel]]
- [[forensics-ir]]
- [[cryptography]]
