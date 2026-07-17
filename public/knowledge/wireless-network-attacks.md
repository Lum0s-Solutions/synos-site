# Wireless Network Attacks & Wardriving

# Wireless Network Attacks & Wardriving

Wireless attacks target the radio layer — Wi-Fi, Bluetooth, and other RF — where signals leave the physical perimeter and can be observed or manipulated from nearby. **Wardriving** is the survey side: mapping wireless networks and their locations while moving. Understanding these techniques is essential for securing the ever-growing wireless attack surface.

## How it works
- **Discovery/wardriving**: scan for APs and clients, log SSIDs, encryption, and GPS positions to build coverage maps.
- **Wi-Fi attacks**: capturing WPA2 handshakes/PMKID for offline cracking, deauthentication, and **rogue/evil-twin APs** that impersonate legitimate networks to harvest credentials.
- **Bluetooth/BLE**: sniffing, spoofing, and abusing weak pairing.
- **RF replay**: capturing and replaying sub-GHz signals (garage doors, sensors).
- Surveillance-tech recon (e.g., mapping ALPR/"Flock" cameras) was a community focus.

## Tools commonly used
- **Aircrack-ng** suite, **Kismet** (wardriving/IDS), **hcxdumptool + Hashcat** (PMKID cracking), **Wireshark**, **HackRF/RTL-SDR**, **WiGLE** for mapping.
- Community projects: `flock-you-wifi-recon`, `wardriving_platform`, `WatchFlock`, and `supertooth`.

## Defensive angle
Defend with WPA3/enterprise auth, strong passphrases, management-frame protection (802.11w) against deauth, wireless IDS to spot rogue APs, and disabling unused radios. Wardriving your own estate reveals rogue and misconfigured access points before attackers do.

## Related
- aircrack ng
- hashcat
- hardware hacking
- physical security
- osint

## Sources
- https://www.aircrack-ng.org/
- https://www.kismetwireless.net/
- https://wigle.net/
- https://hashcat.net/wiki/doku.php?id=hashcat

## 🎴 Review
<!-- Spaced Repetition cards -->
#flashcards/security-plus

What is wardriving?::The survey side of wireless attacks — mapping wireless networks and their locations while moving.

What is an evil-twin AP?::A rogue access point that impersonates a legitimate network to harvest credentials.

Name tools used for Wi-Fi attacks and wardriving.::Aircrack-ng, Kismet, hcxdumptool + Hashcat (PMKID cracking), HackRF/RTL-SDR, and WiGLE.

What defenses counter wireless attacks?::WPA3/enterprise auth, strong passphrases, management-frame protection (802.11w) against deauth, and wireless IDS to spot rogue APs.
