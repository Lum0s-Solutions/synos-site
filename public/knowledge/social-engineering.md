# Social Engineering & Phishing

# Social Engineering & Phishing

Social engineering is the manipulation of people — rather than machines — into divulging information or performing actions that compromise security. Phishing is its most common digital form. Because it targets human trust, it bypasses most technical controls and remains the leading cause of breaches, which is why awareness and process controls matter as much as technology.

## How it works
- **Pretexting**: a fabricated scenario/identity (IT support, vendor, authority) to justify a request.
- **Phishing family**: bulk email phishing, **spear-phishing** (targeted), **whaling** (executives), **smishing** (SMS), and **vishing** (voice).
- **Payload or credential harvest**: a fake login page or a malicious attachment/macro leading to malware.
- **Physical/tailgating**: following staff through doors, dropped USB "baiting," impersonation.
- **Urgency & authority** are the psychological levers exploited.

## Tools commonly used
- **Awareness/testing**: GoPhish, King Phisher, the Social-Engineer Toolkit (SET) for authorized simulations.
- **Intel**: PhishTank (known-phish corpus, referenced in-channel), certificate transparency for lookalike domains.

## Defensive angle
Defenses are layered: MFA (ideally phishing-resistant FIDO2), email authentication (SPF/DKIM/DMARC), attachment sandboxing, URL rewriting, and — most importantly — recurring user training and easy reporting. Verification callbacks and least-privilege limit blast radius when someone is fooled.

## Seen in the community
Phishing corpora (PhishTank) and social/physical-entry tradecraft surfaced in **#physical_sec-ftw** and **#general-chat**, complementing the OSINT used to craft convincing pretexts.

## Related
- [[osint]]
- [[physical-security]]
- [[malware-development]]
- [[red-teaming]]
- [[cyber-kill-chain]]
- [[Discord Intel/discord-intel-MOC|Discord Intel]]

## Sources
- https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks
- https://getgophish.com/
- https://phishtank.org/
- https://attack.mitre.org/techniques/T1566/

## 🎴 Review
<!-- Spaced Repetition cards -->
#flashcards/security-plus

What is social engineering?::The manipulation of people (rather than machines) into divulging information or performing actions that compromise security.

Distinguish spear-phishing, whaling, smishing, and vishing.::Spear-phishing is targeted; whaling targets executives; smishing uses SMS; vishing uses voice.

What psychological levers does social engineering exploit?::Urgency and authority.

What is the strongest layered defense against phishing?::Phishing-resistant MFA (FIDO2) plus recurring user training and easy reporting, with SPF/DKIM/DMARC and attachment sandboxing.
