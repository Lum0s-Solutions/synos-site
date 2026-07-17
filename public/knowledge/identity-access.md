# Identity and Access Management

# Identity and Access Management

Identity and Access Management (IAM) is the discipline of proving who a subject is and constraining what that subject may do. It rests on a clean separation of three steps — identification authentication and authorization are distinct steps — where a claimed identity is verified by evidence and then matched against a policy that grants only the necessary rights. This hub is the read-first entry point into the cluster; treat everything here as defensive design for protecting accounts, credentials, and privileged operations.

## Authentication factors and MFA

Authentication proves a claimed identity using one or more independent factors. A single password is fragile, so multi factor authentication adds a second factor pairs something you know with something you have or are, turning a stolen password into a dead end. Not all second factors are equal: sms delivered codes are the weakest form of multi factor authentication because SMS is interceptable and SIM-swappable, whereas authenticator app codes are generated offline defeating sim swap. Recovery paths deserve the same care as primary factors, since mfa recovery codes bypass authentication and need equal protection. Enterprise authentication is increasingly context-aware: adaptive identity adjusts authentication strength by context, stepping up challenges when signals look risky. At the network edge, 802 1x splits authentication into supplicant authenticator and server so that ports stay closed until identity is proven, and centralized designs matter because centralized aaa consolidates authentication and speeds deprovisioning.

## Authorization models and least privilege

Once identity is established, authorization decides scope. The keystone habit is principle of least privilege in iam — grant only what a task requires — because over-permissioned identities convert a small compromise into a full takeover. Least privilege is not set-and-forget: least privilege needs periodic recertification to stop privilege creep. Access scales cleanly when group based authorization scales access management rather than being pinned to individuals, and finer-grained designs use tokens, since capability based security grants access through unforgeable tokens. Cloud identity favors ephemeral grants where iam roles provide temporary credentials instead of long-lived keys. Authorization also fails in predictable ways: vertical and horizontal privilege escalation describes movement up or sideways, broken object level authorization lets users reach other users data when object IDs go unchecked, and the fix is that server side authorization must validate entitlement not trust client ids. Operationally, change control limits you to the authorized scope keeps even legitimate actors inside their mandate.

## Kerberos, Active Directory, and credential attacks

Directory-backed environments concentrate credentials in high-value processes, making them a prime target. On Windows, credential guard isolates lsass secrets with virtualization to keep secrets out of reach, while defenders watch for theft because lsass process access telemetry reveals credential dumping. Local administrator sprawl is contained when laps issues a unique local admin password per machine, denying attackers a reusable master key. A tamper-evident trail matters too: auditd builds a tamper evident record of privileged actions. On Unix hosts the escalation surface shrinks when minimizing suid binaries shrinks the privilege escalation surface, while world writable file modes violate least privilege and building software as an unprivileged user isolates the host close common footholds.

## Federation, SSO, OAuth, and JWT

Federated identity lets many services delegate authentication to a shared authority. federation lets users authenticate with an external identity provider so a site never stores the user's password, and sso with mfa centralizes identity and access to concentrate strong controls in one place — at the cost of making that provider a critical dependency. Delegated authorization runs on tokens, and bearer tokens grant access to whoever holds them, which means a leaked token is a live credential requiring HTTPS, short lifetimes, and prompt revocation. At the boundary, an api gateway enforces throttling and authorization before the backend centralizes token validation and rate limits before requests reach services.

## Zero trust

Zero trust discards perimeter assumptions: zero trust replaces perimeter trust with continuous verification, re-evaluating every request against identity, device posture, and context so a stolen credential is confined to its narrow verified purpose. Trust anchors extend down to hardware — a boot time asset check can gate out unauthorized hardware and the uefi boot manager runs any authorized efi application before the os — reminding defenders that verification begins before the OS loads.

## Credential hygiene

Most breaches trace back to weak or mishandled secrets. default credentials are a primary attack vector and reusing a password turns one breach into many account takeovers, so unique, strong secrets are non-negotiable; note that a multi word passphrase resists cracking better than a short complex password. Attackers automate guessing, and rule based password mutation shows how predictable human patterns fall quickly. Recovery is its own attack surface — mind the password reset flow attack surface. Where sensitive values must be stored or passed around, tokenization replaces sensitive data with a meaningless substitute.

## All component notes

- Authentication and factors: identification authentication and authorization are distinct steps, multi factor authentication adds a second factor, sms delivered codes are the weakest form of multi factor authentication, authenticator app codes are generated offline defeating sim swap, mfa recovery codes bypass authentication and need equal protection, adaptive identity adjusts authentication strength by context, 802 1x splits authentication into supplicant authenticator and server, centralized aaa consolidates authentication and speeds deprovisioning
- Authorization and least privilege: principle of least privilege in iam, least privilege needs periodic recertification to stop privilege creep, group based authorization scales access management, capability based security grants access through unforgeable tokens, iam roles provide temporary credentials, vertical and horizontal privilege escalation, broken object level authorization lets users reach other users data, server side authorization must validate entitlement not trust client ids, change control limits you to the authorized scope
- Directory, credential theft, and host privilege: credential guard isolates lsass secrets with virtualization, lsass process access telemetry reveals credential dumping, laps issues a unique local admin password per machine, auditd builds a tamper evident record of privileged actions, minimizing suid binaries shrinks the privilege escalation surface, world writable file modes violate least privilege, building software as an unprivileged user isolates the host
- Federation, SSO, and tokens: federation lets users authenticate with an external identity provider, sso with mfa centralizes identity and access, bearer tokens grant access to whoever holds them, an api gateway enforces throttling and authorization before the backend
- Zero trust and hardware roots: zero trust replaces perimeter trust with continuous verification, a boot time asset check can gate out unauthorized hardware, the uefi boot manager runs any authorized efi application before the os, weak unauthenticated radio signals like gps are easy to jam
- Credential hygiene: default credentials are a primary attack vector, reusing a password turns one breach into many account takeovers, a multi word passphrase resists cracking better than a short complex password, rule based password mutation, password reset flow attack surface, tokenization replaces sensitive data with a meaningless substitute

## Related

- cybersecurity MOC
- cryptography
- network security
- endpoint hardening
- cloud security
