# Red Teaming

# Red Teaming

Red teaming is goal-oriented adversary emulation: an authorized team mimics a specific threat actor end-to-end — initial access, persistence, privilege escalation, lateral movement, and exfiltration — to test an organization's *detection and response*, not just its patch level. It is broader and stealthier than a standard penetration test, and it exists to make the **blue team** better.

## How it works
- **Threat modeling / TTP selection**: choose an adversary and map goals to MITRE ATT&CK techniques.
- **Initial access**: phishing, exposed services, or physical entry.
- **Post-exploitation**: C2 beaconing, credential access (e.g., Kerberoasting), and **lateral movement** toward crown-jewel targets.
- **Objectives & OPSEC**: reach a defined goal (domain admin, data theft) while evading detection; document every step.
- **Purple teaming**: red and blue collaborate live to tune detections.

## Tools commonly used
- **C2**: Cobalt Strike, Sliver, Havoc, Mythic.
- **AD attack path mapping**: BloodHound; **credential access**: Mimikatz.
- **Recon/exploitation**: Nmap, Metasploit, Impacket.
- Community tooling: `GATEkeeper`, `REDflare-v2`, `CredSpy`, and `apex` featured in the intel.

## Defensive angle
Red-team output is measured by *what the blue team caught*. Findings drive new detections (Sigma/YARA), logging gaps, segmentation, and IR-playbook improvements. Frameworks like ATT&CK provide a shared language for coverage.

## Related
- command and control
- lateral movement
- kerberoasting
- bloodhound
- cyber kill chain

## Sources
- https://attack.mitre.org/
- https://github.com/BloodHoundAD/BloodHound
- https://redteam.guide/
- https://en.wikipedia.org/wiki/Red_team

## 🎴 Review
<!-- Spaced Repetition cards -->
#flashcards/security-plus

How does red teaming differ from a standard penetration test?::It is goal-oriented adversary emulation testing detection and response end-to-end; broader and stealthier than a pen test.

What is the purpose of red teaming relative to the blue team?::It exists to make the blue team better; its output is measured by what the blue team caught.

Name common C2 frameworks used in red teaming.::Cobalt Strike, Sliver, Havoc, and Mythic.

What is purple teaming?::Red and blue teams collaborating live to tune detections.

What tool maps Active Directory attack paths in red-team operations?::BloodHound.
