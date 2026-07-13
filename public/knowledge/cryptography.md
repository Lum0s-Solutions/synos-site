# Cryptography

# Cryptography

Cryptography is the discipline of protecting information with mathematics: keeping it confidential, proving it has not been altered, and establishing who sent it. This hub is the read-to-learn entry point above the vault's atomic notes on ciphers, hashing, key exchange, PKI, transport security, cryptographic attacks, and the post-quantum transition. The framing throughout is defensive — understanding these primitives so you can deploy, audit, and harden them, not break them.

## First principles

Two properties anchor everything else: [[encryption-provides-confidentiality-hashing-provides-integrity]]. Encryption is reversible and hides data; hashing is one-way and verifies data — confusing the two (for example, reversibly encrypting stored passwords) is a foundational error. Modern schemes also rest on Kerckhoffs's principle, that [[security-depends-on-a-secret-key-not-a-secret-algorithm]]: algorithms are published so the world can attack them, and only the key stays secret. That is exactly why [[cryptographic-attacks-target-implementation-not-the-algorithm]] — attackers hit key handling, protocol negotiation, and configuration rather than the vetted math. Two more baseline cautions: [[predictable-pseudo-random-generators-are-unsafe-for-security-secrets]], and [[error-detection-codes-protect-against-noise-not-adversaries]] (a CRC catches accidental corruption but an attacker can recompute it).

## Symmetric vs asymmetric

Symmetric ciphers such as AES use one shared key and are fast, but [[symmetric-encryption-is-fast-but-has-a-key-distribution-problem]]: getting that key to the other party securely is the hard part. Asymmetric cryptography answers this because [[a-key-pair-lets-anyone-encrypt-but-only-the-owner-decrypt]], trading raw speed for the ability to communicate without a pre-shared secret. History shows the failure modes of weak schemes: [[classical-substitution-ciphers-fall-to-frequency-analysis]], undersized blocks mean [[a-small-block-cipher-leaks-data-after-a-birthday-bound-of-traffic]], and obfuscation is not encryption — [[voice-inversion-scrambling-obscures-but-does-not-encrypt-radio]].

## Hashing and integrity

A hash proves data is untouched, which is why you [[compare-file-hashes-to-verify-download-integrity]]. Its guarantee weakens as collisions become findable: [[hash-collisions-and-the-birthday-attack]] explains why the effective strength is roughly half the digest length, and [[hash-collisions-undermine-integrity-and-deprecate-algorithms]] is why MD5 and SHA-1 are retired. Naive keyed hashing has its own trap — [[a-length-extension-attack-forges-a-mac-without-the-secret]] — motivating HMAC and AEAD constructions. Building on public-key math, [[digital-signatures-provide-integrity-authentication-and-non-repudiation]] in a single operation.

## Passwords and key hardening

Stored password hashes need defenses tuned for an attacker working offline, because [[offline-password-cracking-operates-on-captured-hashes]] at full speed. Layered countermeasures: [[salting-passwords-defeats-rainbow-tables]] by making precomputation useless, [[key-stretching-strengthens-keys-against-brute-force]] by iterating, and [[deliberately-slow-memory-hard-hashes-blunt-offline-password-cracking]] (Argon2, scrypt) by making each guess expensive in time and memory. Even hashes that are never cracked can be abused, as [[pass-the-hash-authentication]] shows when the hash itself becomes the credential.

## Key exchange and PKI

Encrypted channels bootstrap trust from nothing: [[diffie-hellman-agrees-a-shared-secret-over-a-public-channel]] so two strangers derive a secret an eavesdropper cannot reconstruct. But secrecy against a passive listener is not identity, so [[authenticating-the-key-owner-defeats-a-man-in-the-middle-in-key-exchange]]. That authentication is delivered by public-key infrastructure, where [[a-digital-certificate-binds-a-public-key-to-a-validated-identity]] and [[certificate-authorities-sell-validation-not-signatures]] — you pay for identity checking, not cryptography. Operational PKI spans coverage and lifecycle: [[a-wildcard-certificate-covers-multiple-hostnames-under-one-domain]], [[device-certificates-authenticate-machines-that-cannot-type-a-password]], [[certificate-revocation-via-crl-and-ocsp-invalidates-compromised-certificates]], and the public audit trail where [[certificate-transparency-logs-reveal-subdomains]]. Clients can go further — [[certificate-pinning-rejects-intercepted-tls-connections]] — while [[key-escrow-stores-private-keys-for-recovery]] trades resilience for a custody risk.

## Transport and network encryption

On the wire, [[plaintext-network-protocols-expose-credentials-use-encrypted-successors]] is the first hardening step, followed by [[pruning-weak-cipher-suites-hardens-a-services-encrypted-channels]]. Encryption defends specific layers: [[a-vpn-encrypts-traffic-across-an-untrusted-network]], [[tls-vpns-use-port-443-to-pass-through-firewalls]], [[encrypted-wifi-defeats-passive-sniffing-without-the-key]], and DNS gains confidentiality where [[encrypted-and-validated-dns-resists-poisoning-and-surveillance]] via [[encrypted-dns-dot-doh-doq]]. Metadata leaks remain even under TLS, which is why [[encrypted-client-hello-conceals-the-sni-hostname-from-on-path-observers]]. Encryption also shapes visibility for defenders: [[host-based-firewall-inspects-traffic-before-and-after-encryption]] is where endpoint inspection wins, and [[a-packet-analyzer-decrypts-tls-only-when-given-the-session-keys]].

## Cryptographic attacks

Well-chosen algorithms fail through their edges. [[a-padding-oracle-leaks-plaintext-through-error-differences]] recovers plaintext one byte at a time from a single bit of feedback; [[downgrade-attacks-force-weaker-or-no-encryption]] by stripping negotiation; and [[compressing-before-encrypting-can-leak-secrets-through-ciphertext-size]] turns length into a side channel. Endpoints are attacked directly too: [[an-adversary-in-the-middle-phishing-proxy-steals-live-mfa-session-cookies]], [[man-in-the-browser-malware-defeats-encryption-from-inside-the-client]] after decryption, and [[clipboard-hijacking-malware-silently-swaps-cryptocurrency-addresses]] before signing.

## Encryption at rest and applied confidentiality

[[encryption-at-rest-vs-encryption-in-transit]] separates protecting stored data from protecting moving data, and real deployments choose granularity: [[client-side-encryption-keeps-a-cloud-provider-from-reading-your-files]], [[column-level-encryption-selectively-protects-database-fields]], and [[field-level-encryption-with-an-hsm-survives-perimeter-breach]]. Practical caveats abound: [[a-seized-device-that-is-still-logged-in-defeats-its-encryption]], [[backing-up-a-disk-encryption-key-to-a-provider-account-exposes-it-to-legal-compulsion]], and [[a-hidden-encrypted-volume-provides-deniable-encryption]]. Sharing and disposal have cryptographic answers too — [[peer-to-peer-encrypted-file-transfer-avoids-a-trusted-intermediary-store]] and [[a-certificate-of-destruction-proves-third-party-media-disposal]].

## Post-quantum

The long-horizon threat is factoring: [[shors-algorithm-lets-a-quantum-computer-break-rsa-by-fast-factoring]] would retroactively expose today's RSA-protected data under a "harvest now, decrypt later" strategy. The mitigation already shipping is [[hybrid-post-quantum-key-exchange-hedges-against-harvest-now-decrypt-later]], pairing a lattice scheme (ML-KEM) with a proven classical curve so both must break to lose the session.

## All component notes

- Trust and consent tokens: [[cryptographic-opt-in-consent-tokens-gate-sensitive-data-sharing]], [[pinning-mcp-tool-descriptions-by-hash-detects-post-approval-tampering]]
- Cryptographic destinations and routing: [[a-distributed-network-database-resolves-cryptographic-destinations-without-a-central-authority]]
- Adversary tradecraft: [[mass-collection-and-targeted-access-are-complementary-adversary-tactics]], [[predictable-routines-let-adversaries-plan-an-attack]], [[mac-randomization-does-not-defeat-preferred-network-fingerprinting]], [[directory-traversal-escapes-the-web-root]]
- AI and cryptographic assurance: [[ai-generated-attacks-rehash-known-techniques-so-existing-defenses-hold]], [[on-demand-ai-malware-regeneration-defeats-signature-based-detection]], [[llm-applications-need-adversarial-scanning-before-deployment]], [[mitre-atlas-maps-adversarial-tactics-against-ai-systems]], [[cloud-ai-services-retain-and-can-disclose-user-conversations]], [[ai-hallucinations-are-confident-fabrications-not-random-glitches]], [[ai-systems-can-hide-implicit-value-hierarchies-until-adversarially-probed]]

## Related

- [[cybersecurity-MOC]]
- [[network-security]]
- [[identity-access]]
- [[web-appsec]]
- [[malware-analysis]]
