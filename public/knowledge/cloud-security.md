# Cloud and Container Security

# Cloud and Container Security

Cloud and container platforms trade physical machines for shared, software-defined infrastructure, which relocates the security boundary from a rack you own to a kernel, an identity plane, and a provider's control surface. This hub is a defensive entry point into how that boundary actually works — where isolation is enforced, who is responsible for what, and how misconfiguration turns convenience into a breakout path. Read it to build a mental model, then follow the wikilinks into the atomic notes for specifics.

## The shared responsibility model

Every cloud engagement begins by asking which layers the provider secures and which the customer still owns. The line moves as you climb the stack: with [[serverless-architecture-runs-functions-without-managing-servers]], the provider absorbs the operating system and the always-on server surface, but the customer still owns function permissions, inputs, and invocation controls. The lesson generalizes — offloading a layer never offloads the data and identity decisions layered on top of it. [[sase-moves-security-enforcement-to-the-cloud-edge]] shows the same shift for network access: as workloads leave the data center, protection is pushed out to the cloud edge close to the services and users it guards, rather than backhauled through a central concentrator.

## IAM and least privilege in the cloud

In shared infrastructure, identity is the new perimeter, so the tightest control you own is the scope of each credential. Least privilege is the discipline of granting exactly what a workload needs and nothing more, and it applies at every layer — from cloud roles down to the process. [[dropping-linux-capabilities-confines-a-container]] is least privilege made concrete inside a container: strip root's monolithic power to the handful of capabilities a service genuinely requires, pair it with `no-new-privileges`, seccomp, and a mandatory-access-control profile, and a full-root escape attempt degrades into a cascade of "operation not permitted."

## Container isolation: namespaces, cgroups, and Docker

A container is not a small virtual machine — it is an ordinary host process the kernel has been told to show a restricted view of the world. [[namespaces-and-cgroups-are-the-kernel-primitives-behind-container-isolation]] is the foundational note here: namespaces govern what a process can *see* (PID, network, mount, UTS), and cgroups cap what it can *use*. Because [[containers-share-a-host-os-while-virtual-machines-each-run-a-full-guest-os]], every container on a box shares one kernel, so isolation is only as strong as those mechanisms — a kernel bug, an over-broad mount, or a missing limit erodes it. Two hardening moves follow directly. First, [[never-mount-the-docker-socket-into-a-container]]: the daemon socket is the root-level control interface for the whole engine, and exposing it hands the workload the ability to spawn a privileged host-mounting container. Second, [[a-rootless-daemonless-container-runtime-reduces-attack-surface]] removes the always-on root daemon as a target in the first place.

## Infrastructure as Code and serverless

Serverless (Function as a Service) reframes the compute surface — [[serverless-architecture-runs-functions-without-managing-servers]] means ephemeral functions replace standing servers, shrinking the OS patch burden while turning each invocation into an entry point that still needs authorization and input validation. The same discipline that scopes a container applies to function roles: grant narrow, temporary permissions and validate every event payload, because an over-privileged function is a standing escalation path even when it only exists for milliseconds.

## Metadata, SSRF, and storage exposure

Cloud workloads carry a hidden attack surface: the instance metadata service (IMDS) and adjacent internal endpoints that hand out credentials to anything that can reach them. A server-side request forgery flaw that coaxes an application into fetching an internal metadata URL can exfiltrate role credentials, which is why least-privilege roles and short-lived tokens limit the blast radius of such a request. Storage exposure is the sibling failure — public buckets and world-readable object stores leak data with no exploit required — and both classes are best caught before deployment through configuration review and policy-as-code gates.

## Image scanning and the supply chain

A container image stacks an OS, third-party libraries, and application code, so it silently inherits known-vulnerable packages. [[scanning-container-images-against-an-sbom-surfaces-vulnerable-dependencies]] shifts discovery left: extract a Software Bill of Materials, match it against CVE databases, and wire the scan into CI so every rebuild is re-checked — a clean layer can turn vulnerable the day a new advisory drops. Testing the runtime and its parsers matters too: [[fuzzing-feeds-malformed-input-to-uncover-hidden-flaws]] and the reminder that [[human-testers-find-flaws-automated-scanners-miss]] both argue that scanning is necessary but not sufficient. Even format-level plumbing carries risk, as [[a-filesystem-parser-must-account-for-container-header-offsets]] shows.

## All component notes

- [[containers-share-a-host-os-while-virtual-machines-each-run-a-full-guest-os]] — why the shared-kernel model differs from full-guest VMs.
- [[attacker-infrastructure-inherits-the-same-flaws-defenders-exploit]] — the tooling and misconfigurations attackers rely on are the same ones defenders can harden.
- [[fuzzing-feeds-malformed-input-to-uncover-hidden-flaws]] — dynamic testing for hidden runtime and parser bugs.
- [[human-testers-find-flaws-automated-scanners-miss]] — the limits of automated image and config scanning.
- [[a-filesystem-parser-must-account-for-container-header-offsets]] — low-level image-format handling as an attack surface.

## Related

- [[cybersecurity-MOC]]
- [[identity-access]]
- [[network-security]]
- [[supply-chain]]
- [[endpoint-hardening]]
- [[web-appsec]]
