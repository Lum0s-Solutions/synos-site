# Application and Web Security

# Application and Web Security

Application and web security is the practice of building and defending software that accepts untrusted input over the network without letting that input subvert the program's intent. This hub is the read-to-learn entry point above the vault's atomic notes on injection, broken access control, request and session handling, authentication tokens, and secure development. The framing throughout is defensive — understanding these flaws so you can prevent, detect, and remediate them.

## The injection family

Nearly every classic web vulnerability shares one root cause: [[injection-flaws-treat-untrusted-input-as-code]] rather than as inert data. When user input crosses into a SQL query, an attacker can read the database directly, and [[blind-sql-injection-infers-hidden-data-from-response-differences]] shows this works even when no query output is returned. Cross-site scripting injects into the browser instead: [[reflected-xss-executes-a-script-from-a-crafted-link]] fires from a malicious URL, [[stored-xss-attacks-everyone-who-views-a-page]] persists server-side to hit every visitor, and the payoff is that [[xss-steals-session-tokens-to-hijack-accounts]]. The same treat-input-as-code failure recurs in other contexts — [[server-side-template-injection-turns-templates-into-code-execution]], [[http-parameter-pollution-submits-duplicate-parameters]] to confuse parsing logic, and [[prototype-pollution-can-escalate-to-remote-code-execution]] in JavaScript runtimes. The lesson generalizes even to AI systems, where [[prompt-injection-revives-traditional-web-vulnerabilities]] and [[mcp-command-injection-without-an-llm]] proves the tooling layer is injectable on its own.

## Access-control flaws

Where injection abuses parsing, broken access control abuses trust in the client. [[mass-assignment-lets-unexpected-parameters-overwrite-protected-fields]] when a framework auto-binds a whole request body to a data model, letting an attacker set an admin or role flag through an ordinary-looking form. The defense is an allowlist of client-settable fields and setting sensitive attributes server-side — never trusting the shape of incoming input to match developer intent. The broader principle is that authorization must be enforced on the server for every object and action a request touches; the vulnerable code and the safe code often look almost identical, and the danger lives in the fields and endpoints left unguarded rather than in any visible bug.

## Request and session handling

Attacks at the protocol edge exploit how servers interpret and route requests. [[csrf-abuses-a-browsers-authenticated-session]] to force state-changing actions using a victim's ambient cookies, [[host-header-injection]] poisons links and cache keys by lying about the target host, and [[http-request-smuggling-desynchronizes-front-end-and-back-end-parsers]] so a front-end proxy and back-end server disagree on request boundaries. Server-side request forgery turns the application into a proxy against internal services, which is why [[imdsv2-blunts-ssrf-driven-cloud-credential-theft]] by requiring a token step before the metadata endpoint yields credentials. Sessions are the durable trust that ties requests to users: [[session-tokens-are-credentials-and-need-equal-protection]], [[session-ids-must-be-unpredictable-to-resist-guessing-and-brute-force]], and [[session-expiration-limits-the-window-for-a-stolen-token]].

## Authentication tokens

Delegated authentication and its tokens carry their own failure modes. [[oauth-authorizes-access-while-openid-connect-authenticates-identity]] draws the line most implementations blur, [[oauth-scopes-limit-the-damage-of-a-leaked-token]] by constraining what a stolen credential can do, and [[pkce-protects-public-oauth-clients-from-code-interception]] on mobile and single-page apps. Tokens are also phishable and stealable: [[device-code-phishing-abuses-the-oauth-device-authorization-grant]] and [[qrljacking-hijacks-qr-code-login-sessions]] both weaponize legitimate login flows. A structural caveat sits underneath all of it — [[self-contained-jwts-cannot-be-easily-revoked-before-expiry]], which is why short lifetimes, refresh tokens, and denylists matter.

## Secure development and defenses

Defense begins in architecture and continues through deserialization discipline. [[deserializing-untrusted-input-before-authorization-enables-pre-auth-rce]] is among the most dangerous patterns because it hands code execution to unauthenticated attackers, so authorization must gate deserialization, not follow it. Structurally, [[separating-web-and-data-tiers-lets-them-scale-and-fail-independently]] and contains blast radius when one tier is compromised, while [[endpoint-agent-web-filtering-protects-roaming-users]] extends control past the perimeter to devices off the corporate network. Taken together, these notes point at a defense-in-depth posture: validate and encode input at every boundary, prefer allowlists over blocklists, gate sensitive operations behind explicit authorization checks, and assume any single control can fail. A web application firewall or content-security policy can raise the cost of exploitation, but neither substitutes for input handling and access control designed correctly in the code itself.

## AI-integrated application security

Modern apps that embed language models inherit an expanded injection surface. [[prompt-injection-requires-untrusted-input-and-impactful-functionality]] frames the precondition, and the impact scales with capability: [[granting-an-llm-shell-and-file-tools-turns-prompt-injection-into-code-execution]], [[a-rag-knowledge-base-ingests-untrusted-documents-as-an-injection-vector]] widens the input channel, and [[multi-modal-prompt-injection]] hides payloads in images and audio. The primary containment strategy is least privilege — [[shared-authorization-limits-prompt-injection-blast-radius]] by ensuring the model can only act with the user's own constrained permissions.

## All component notes

- Mobile and local data exposure: [[ios-apps-store-data-in-per-app-sandboxed-sqlite-databases]], [[the-ios-files-app-shows-a-sqlite-backed-illusion-not-the-real-directory-tree]]
- Threat intelligence context: [[dark-web-breach-markets-are-an-early-warning-of-compromise]]

## Related

- [[cybersecurity-MOC]]
- [[cryptography]]
- [[identity-access]]
- [[cloud-security]]
- [[network-security]]
- [[ai-ml-security]]
