---
title: Doc Writing Standards
description: Standards and guidelines for contributing documentation to Syn_OS
---

# Doc Writing Standards

Guidelines for writing, formatting, and organizing Syn_OS documentation.

---

## File Naming

- Use **kebab-case** for all filenames: `synos-security.md`, `custom-kernel.md`
- Avoid spaces and special characters
- Use `.md` extension for Markdown content
- Use `.astro` extension for Astro components only

## Frontmatter

Every Markdown doc must include frontmatter:

```yaml
---
title: Page Title Here
description: One or two sentence summary for SEO and search.
---
```

## Markdown Style

- Use **sentence case** for headings: `Custom kernel`, not `Custom Kernel`
- Use **bold** for emphasis, not ALL CAPS
- Prefer tables over bullet lists for structured data
- Use code fences with language tags: ` ```rust `, ` ```bash `
- Wrap long lines at 100 characters
- Use `<details>` for long config examples and optional content

## Admonitions

Use Starlight admonitions for important information:

```markdown
:::note[Note]
Contextual information that doesn't fit the main narrative.
:::

:::warning[Warning]
Something that could cause data loss or security issues.
:::

:::danger[Master-only]
Requires CAP_SYS_ADMIN. Do not run in production without review.
:::
```

## Code Blocks

- Always include a language tag
- Test all commands before committing
- Use `cp` for copy operations, not `cp -r` unless necessary
- Comment why, not what

## Linking

- Use relative links for internal docs: `[Overview](architecture/overview.md)`
- Use absolute URLs for external sites: `[Syn_OS](https://synos-linux.pro)`
- Avoid bare URLs — wrap them in descriptive link text

## Security Markings

- Add `**Classification:** PUBLIC` or `**Classification:** INTERNAL` at the top of sensitive docs
- Never commit keys, passwords, or certificates
- Reference secrets via environment variables, not hardcoded values

## Diagrams

- Use Mermaid for architecture diagrams when possible
- Keep diagrams under 20 nodes for readability
- Use `graph TD` (top-down) or `graph LR` (left-to-right) consistently

## Review Checklist

Before submitting a PR:

- [ ] Frontmatter is complete and accurate
- [ ] All code blocks have been tested
- [ ] Links resolve correctly
- [ ] No secrets or credentials are exposed
- [ ] Markdown lint passes (`npx markdownlint-cli2`)
- [ ] Screenshots updated if UI changed
- [ ] Last-modified date reflects the change
