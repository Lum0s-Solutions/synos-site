# Reverse Engineering

# Reverse Engineering

Reverse engineering (RE) is the process of analyzing a compiled program, firmware image, or protocol to recover its structure, logic, and behavior without source code. In security it powers malware analysis, vulnerability research, firmware auditing, and interoperability work. Defenders reverse malware to write detections; researchers reverse software to find and report bugs.

## How it works
- **Static analysis**: disassembly and decompilation to read code without running it — identify functions, strings, cryptographic constants, and control flow.
- **Dynamic analysis**: run the sample in a sandbox/VM, observe API calls, network traffic, and memory; use debuggers and instrumentation (Frida) to hook functions.
- **String/behavioral triage**: `strings`, imports, and packers reveal quick indicators (e.g., pulling C2 IPs from a dropper).
- **Firmware/binary RE**: unpack images, locate bootloaders, and analyze embedded logic.

## Tools commonly used
- **Ghidra** (NSA, open source), **IDA Pro**, **radare2/Cutter**, **Binary Ninja** — disassemblers/decompilers.
- **x64dbg**, **GDB** — debuggers; **Frida** — dynamic instrumentation.
- **Wireshark** for protocol RE; **Volatility** for memory forensics.
- Reference corpora such as **vx-underground's MalwareSourceCode** (shared in the community) support study of real families in isolated labs.

## Defensive angle
RE turns unknown binaries into signatures (YARA), IOCs, and ATT&CK mappings. Malware authors respond with packing, anti-debug, anti-VM, and obfuscation, so RE is an arms race. Always analyze in an isolated, network-controlled lab.

## Seen in the community
The **#reverse-engineering** channel (top keyword `malware`) hosted static-analysis requests — e.g., a worm pulled off an SSH honeypot offered up for group binary analysis.

## Related
- [[malware-development]]
- [[exploit-development]]
- [[volatility]]
- [[honeypots]]
- [[hardware-hacking]]
- [[Discord Intel/discord-intel-MOC|Discord Intel]]

## Sources
- https://ghidra-sre.org/
- https://frida.re/
- https://github.com/vxunderground/MalwareSourceCode
- https://attack.mitre.org/

## 🎴 Review
<!-- Spaced Repetition cards -->
#flashcards/security-plus

What is reverse engineering in security?::Analyzing a compiled program, firmware image, or protocol to recover its structure, logic, and behavior without source code.

What is the difference between static and dynamic analysis in RE?::Static reads code without running it (disassembly/decompilation); dynamic runs the sample in a sandbox/VM to observe API calls, traffic, and memory.

Name common RE disassemblers/decompilers.::Ghidra, IDA Pro, radare2/Cutter, and Binary Ninja.

How does reverse engineering support defense?::It turns unknown binaries into signatures (YARA), IOCs, and ATT&CK mappings.
