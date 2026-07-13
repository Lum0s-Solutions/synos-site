# Hardware Hacking

# Hardware Hacking

Hardware hacking is the analysis and manipulation of physical devices — embedded systems, IoT, peripherals, and radios — to understand or alter their behavior. It spans firmware extraction, debug-port access, side-channel analysis, and RF work. It matters because billions of embedded devices ship with weak firmware, exposed debug interfaces, and no secure-boot, making them a soft attack surface and a rich research field.

## How it works
- **Firmware extraction & analysis**: dump flash over SPI/I2C, unpack images (binwalk), and reverse the code (top keyword `firmware` in the channel).
- **Debug interfaces**: **UART**, **JTAG/SWD**, and bootloader consoles give shell or memory access.
- **Bus sniffing/injection**: logic analyzers and tools read SPI/I2C/CAN traffic.
- **RF/wireless**: capture and replay sub-GHz, BLE, NFC/RFID, and Wi-Fi.
- **HID/USB attacks**: "BadUSB" devices emulate keyboards to inject keystrokes.

## Tools commonly used
- **Flipper Zero** (multi-tool), **Proxmark3** (RFID/NFC), **HackRF/RTL-SDR** (radio), **Bus Pirate**, **logic analyzers**, **binwalk** for firmware.
- Community projects: `BruceButBetter` (ESP32 firmware), `supertooth` (Bluetooth), `usbliter8`, `hzgl-air-bridge`, and wardriving platforms.

## Defensive angle
Manufacturers defend with secure boot, signed firmware, disabled/authenticated debug ports, encrypted storage, and RF authentication (rolling codes vs. replay). Defenders audit their own devices for exposed UART/JTAG and unsigned update paths.

## Seen in the community
**#hardware-hacking** (top keyword `firmware` ×9) shared firmware-mod projects, Bluetooth/RFID tooling, and BadUSB-style experiments; it overlaps with the **#ai-surveillance-takedown** wardriving/Wi-Fi recon work.

## Related
- [[reverse-engineering]]
- [[wireless-network-attacks]]
- [[physical-security]]
- [[malware-development]]
- [[osint]]
- [[Discord Intel/discord-intel-MOC|Discord Intel]]

## Sources
- https://docs.flipper.net/
- https://github.com/ReFirmLabs/binwalk
- https://proxmark.com/
- https://en.wikipedia.org/wiki/Physical_computing

## 🎴 Review
<!-- Spaced Repetition cards -->
#flashcards/security-plus

What is hardware hacking?::The analysis and manipulation of physical devices (embedded systems, IoT, peripherals, radios) to understand or alter their behavior.

Why are embedded devices a soft attack surface?::Billions ship with weak firmware, exposed debug interfaces, and no secure boot.

Which debug interfaces give shell or memory access in hardware hacking?::UART, JTAG/SWD, and bootloader consoles.

What is a "BadUSB" attack?::A HID/USB attack where a device emulates a keyboard to inject keystrokes.

Which tools are common in hardware hacking?::Flipper Zero, Proxmark3 (RFID/NFC), HackRF/RTL-SDR (radio), Bus Pirate, logic analyzers, and binwalk for firmware.
