# Physical Security

# Physical Security

Physical security covers the controls that protect people, facilities, and hardware from physical access by unauthorized parties — because an attacker with hands on a device can often bypass every network defense. In offensive security, physical assessments test locks, badges, and entry procedures; defensively, the same knowledge hardens sites.

## How it works
- **Access control bypass**: lockpicking, bypass tools (shimming, under-door hooks), and defeating latches.
- **Badge/credential cloning**: reading and replaying **RFID/NFC** access cards (125 kHz and 13.56 MHz).
- **Tailgating & pretexting**: walking in behind authorized staff (overlaps with social engineering).
- **Device attacks**: BadUSB drops, evil-maid attacks on unattended laptops, and console/debug access.
- **Surveillance & counter-surveillance**: understanding camera/sensor coverage and gaps.

## Tools commonly used
- **Proxmark3** and **Flipper Zero** (RFID/NFC read/emulate), lockpick sets, **BadUSB** devices.
- Community overlap with hardware-hacking and the **#ai-surveillance-takedown** wardriving/Wi-Fi recon projects.

## Defensive angle
Layered defense: mantraps/turnstiles against tailgating, high-frequency encrypted smartcards (not clonable 125 kHz prox), port control / disabled USB, full-disk encryption against evil-maid, cable locks, and guard/CCTV coverage. Physical and cyber controls must be assessed together.

## Seen in the community
**#physical_sec-ftw** (268 msgs) covered entry tradecraft and RFID work; it interlocks with **#hardware-hacking** tooling and OSINT-driven site reconnaissance.

## Related
- [[hardware-hacking]]
- [[social-engineering]]
- [[osint]]
- [[wireless-network-attacks]]
- [[reverse-engineering]]
- [[Discord Intel/discord-intel-MOC|Discord Intel]]

## Sources
- https://www.proxmark.com/
- https://en.wikipedia.org/wiki/Physical_security
- https://www.sans.org/blog/physical-penetration-testing/

## 🎴 Review
<!-- Spaced Repetition cards -->
#flashcards/security-plus

Why does physical security matter so much?::An attacker with hands on a device can often bypass every network defense.

What frequencies are used by the RFID/NFC access badges attackers clone?::125 kHz and 13.56 MHz.

Name tools commonly used in physical-security assessments.::Proxmark3 and Flipper Zero (RFID/NFC read/emulate), lockpick sets, and BadUSB devices.

What defenses counter tailgating and evil-maid attacks?::Mantraps/turnstiles against tailgating and full-disk encryption against evil-maid attacks (plus encrypted smartcards, port control, cable locks, CCTV).
