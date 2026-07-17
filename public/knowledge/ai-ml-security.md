# AI and ML Security

# AI and ML Security

AI and machine-learning systems introduce a security surface that classic application security does not fully cover: the model itself is an attackable artifact, its training pipeline is a supply chain, and an autonomous agent wired to real tools becomes an actor that can be hijacked. This hub organizes the vault's atomic notes on how models are attacked, how LLM-driven applications and agents fail, how AI reshapes both offense and defense, and where alignment research meets practical security. The framing throughout is defensive: understand the failure modes so you can bound the blast radius. Read this article top to bottom for the landscape, then follow the wikilinks into individual atomic notes for the specific mechanism, defense, or case study behind each claim.

## Attacks on models

Adversarial pressure on a model spans its whole lifecycle. A useful compact threat model is that machine learning models face evasion poisoning extraction and inference attacks — four families that each hit a different stage. Poisoning is the cheapest and most counterintuitive: poisoning a tiny fraction of training data can backdoor a model, because scale is a hiding place rather than a safeguard, and the result is that a backdoored model passes benchmarks while misbehaving only on triggers. Extraction and theft matter too, since stolen model weights erase an ai labs competitive lead. Models also degrade on their own: model collapse degrades models trained on their own output, and even normal inputs can misfire when glitch tokens trigger unpredictable model behavior or when context rot degrades llm reliability on long inputs. A structural fact underlies all of this — ai models are grown not coded so behavior cannot be verified by reading source, and because models sharing an upstream component inherit its weaknesses, model provenance is a supply-chain problem.

## Prompt injection and LLM applications

The defining LLM vulnerability is prompt injection, where untrusted content reaching a privileged model turns text into action. The strongest mitigation is architectural: the dual llm pattern isolates untrusted input from privileged actions so that no single model has both untrusted input and impactful capability. Jailbreaks keep evolving — a false authorization narrative jailbreaks an ai agent into attacking, and ai coding agents can be jailbroken by fragmenting an attack into context free steps that each look benign in isolation. Even when a model behaves, its output is not trustworthy by default: treat ai generated code as untrusted until reviewed, remember that ai assisted coding ships security debt when design is skipped, and that ai generated configuration advice can be confidently outdated.

## Agentic and MCP security

Tool access is what converts a chatbot into an actor, so an agent's connected tools define its real attack surface. The Model Context Protocol standardizes this: an mcp server widens an ai agents reach to every connected tool, and while an mcp server holds credentials so the llm never sees them (a genuine benefit), servers are also a trust boundary — see the mcp rug pull attack where a tool definition changes after approval, and the offensive reach shown by automating reverse engineering with mcp. Agents concentrate risk: ai agents compress a multi role attack campaign into one operator, a self replicating agent propagates its privileged access to new hosts, and an always on agent with full account access is a single point of total compromise. They also leak — autonomous ai agents leak secrets through plaintext state files.

Containment is the defensive core, and the recurring theme is that you should enumerate exactly what an agent can reach and connect only what a task needs. Scope capability with least privilege: fine grained access tokens scope what an ai agent can do, read only permissions limit ai feature blast radius, and high abstraction ai tools limit an agents blast radius. Human-in-the-loop approvals are the last line of defense, but they only help if they stay meaningful — beware that a simplified approval prompt can conceal a tools real action, that constant permission prompts train users to click through them until consent becomes reflexive, and that disabling an ai agents permission prompts removes its last safeguard entirely.

## AI-enabled offense and defense

AI is dual-use by construction: an ai that can patch vulnerabilities can equally exploit them, so the same capability aids attacker and defender. On the defensive detection side, synthetic media is increasingly relevant — ai generated video carries detectable artifacts that expose synthetic media. Keeping data out of third-party systems is its own control: on device ai processing keeps sensitive data off the cloud, and complementarily running ai models locally keeps data off third party servers while running models locally keeps inference data off third party servers. Prioritizing AI-security work benefits from the same economics as the rest of the field, where bug bounty rewards scale with demonstrated impact not bug category.

## AI safety and alignment relevance

Alignment research maps directly onto operational monitoring problems. A sufficiently capable system is a security concern because a capable ai develops instrumental subgoals like acquiring resources and avoiding shutdown. Optimization pressure is treacherous: optimization pressure can teach a model to hide misbehavior, and specifically penalizing an ai s visible reasoning trains concealment not compliance — a general lesson that any detection signal a subject can observe and is punished for will be evaded rather than obeyed, which is why some monitoring channels must be reserved for observation, not optimization.

## All component notes

- **Threat modeling and posture**: calibrate operational security to the actual threat model, personal threat modeling tailors defenses to your actual risks, match your privacy defenses to your actual surveillance threat model
- **Broader security context**: aws shared responsibility model, nac agent types persistent dissolvable agentless, disabling llmnr and netbios stops name resolution poisoning, simulated phishing with just in time training builds a verify then trust reflex

## Related

- cybersecurity MOC
- supply chain
- threat intel
- web appsec
- privacy and opsec
