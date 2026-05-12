# Deploying synos-linux.pro

The site is an [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) static build. It is hosted on **Cloudflare Pages**, with the apex domain (`synos-linux.pro`) registered at **Namecheap**. Two deploy paths are supported, and both are wired in this repo:

1. **Cloudflare's GitHub integration** *(recommended — zero-config auto-deploy)*
2. **GitHub Actions → Cloudflare Pages action** *(backup / explicit-control)*

Pick one. The instructions below cover both, plus the Namecheap DNS step that is the same for either.

---

## Option 1 — Cloudflare's GitHub integration (recommended)

One-time setup, ~3 minutes.

1. Sign in to **[Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages)**.
2. **Create application → Pages → Connect to Git**.
3. Choose **GitHub**, authorise the Cloudflare GitHub app for the `Lum0s-Solutions` org, and pick `Lum0s-Solutions/synos-site` (the GitHub repo; Cloudflare project name is `synos-linux-pro` to match the domain).
4. Configure the build:

   | Field                | Value           |
   |----------------------|-----------------|
   | Production branch    | `main`          |
   | Framework preset     | `Astro`         |
   | Build command        | `npm run build` |
   | Build output dir     | `dist`          |
   | Root directory       | `/`             |
   | Node version         | `20`            |

5. **Save and Deploy.**

Cloudflare Pages will publish to `synos-linux-pro.pages.dev` on every push to `main`. The first build takes ~2 minutes.

After the first successful deploy, jump to **[Namecheap DNS](#namecheap-dns--apex-and-www)** below.

---

## Option 2 — GitHub Actions deploy

Use this if you want CI control (preview branches, status checks blocking deploys, etc.) instead of the integrated CF dashboard pull. The workflow is already at `.github/workflows/deploy-cloudflare.yml`.

You need **two GitHub secrets** on this repo:

- `CLOUDFLARE_API_TOKEN` — a token with `Account → Cloudflare Pages: Edit` permission
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID (visible in any zone's overview)

### Create the API token

1. **[Cloudflare → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)** → **Create Token**.
2. Use **Custom token**:
   - **Permissions:** `Account` · `Cloudflare Pages` · `Edit`
   - **Account Resources:** `Include` · *(your account)*
   - **Zone Resources:** All zones (or scope to `synos-linux.pro` once it exists)
3. Create, copy the token *(it is only shown once)*.

### Add the secrets to GitHub

```bash
gh secret set CLOUDFLARE_API_TOKEN  --body "$YOUR_TOKEN"  -R Lum0s-Solutions/synos-site
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$ACCOUNT_ID" -R Lum0s-Solutions/synos-site
```

The workflow (`.github/workflows/deploy-cloudflare.yml`) uses [`cloudflare/pages-action`](https://github.com/cloudflare/pages-action) and ships a deploy on every push to `main`. The Pages project must be created (empty is fine) under the `synos-linux-pro` name once before the first action run; the easiest way is to do the first deploy from the dashboard (Option 1) and then move the cadence to Actions.

---

## Namecheap DNS — apex and www

Once Cloudflare Pages publishes `synos-linux-pro.pages.dev`, you bind it to the real domain. You have two choices.

### Option A — full Cloudflare nameservers *(recommended)*

This gives you the full Cloudflare CDN, security, and analytics layer; the Pages custom-domain configuration is one click after that.

1. **In Cloudflare:** Add Site → enter `synos-linux.pro` → Free plan → Cloudflare assigns two nameservers (e.g. `bonita.ns.cloudflare.com` and `tucker.ns.cloudflare.com`).
2. **In Namecheap:** Domain List → `synos-linux.pro` → **Manage** → **Nameservers** → set **Custom DNS** to the two Cloudflare nameservers.
3. Wait for propagation (Cloudflare emails when active — usually ≤30 min).
4. **Back in Cloudflare Pages → synos-linux-pro → Custom domains** → add `synos-linux.pro` and `www.synos-linux.pro`. Cloudflare Pages will create the necessary CNAME / flattened-A records automatically inside its own DNS zone.

After this, every push to `main` rebuilds and serves to `https://synos-linux.pro`.

### Option B — keep Namecheap as DNS provider

Use this if you don't want to delegate nameservers to Cloudflare.

1. Cloudflare Pages → `synos-linux-pro` → Custom domains → **Set up a custom domain** → `synos-linux.pro` (and again for `www`). Cloudflare will give you a CNAME target like `synos-linux-pro.pages.dev`.
2. **In Namecheap:** Domain List → `synos-linux.pro` → **Advanced DNS** → add records:

   | Type           | Host  | Value                              | TTL       |
   |----------------|-------|------------------------------------|-----------|
   | CNAME          | `www` | `synos-linux-pro.pages.dev`             | Automatic |
   | ALIAS / ANAME  | `@`   | `synos-linux-pro.pages.dev`             | Automatic |

   Namecheap calls apex CNAMEs **ALIAS** records. If your Namecheap UI doesn't expose ALIAS, use the four Cloudflare-Pages **A-record** targets they hand you instead (Cloudflare prints them in the Custom Domain dialog).

3. **In Cloudflare Pages:** wait for the DNS check to flip to green; HTTPS provisions automatically (Cloudflare uses ACME / Universal SSL).

---

## Verify the live site

```bash
# Cloudflare Pages canonical URL
curl -sI https://synos-linux-pro.pages.dev | head -1

# Apex (after DNS propagates)
curl -sI https://synos-linux.pro    | head -1
curl -sI https://www.synos-linux.pro | head -1

# Security headers (from public/_headers)
curl -sI https://synos-linux.pro \
    | grep -iE '(strict-transport|content-security|x-frame|referrer-policy)'
```

---

## Local dev

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # → dist/
npm run preview      # serves dist/ for sanity-check
```

---

## Updating content

Push to `main` is the only deploy trigger. If a Syn_OS release bumps the version, the **`synos-site` Claude agent** can be invoked to mirror the README/CHANGELOG into the matching content pages and open a PR. See `~/.claude/agents/synos-site.md`.

## Quick facts

| | |
|--|--|
| GitHub repo | `Lum0s-Solutions/synos-site` |
| Cloudflare Pages project | `synos-linux-pro` |
| Cloudflare account ID | `8f63953bddc5bdf004b63cad5cc0c702` |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output | `dist` |
| Node version | `22` (`engines.node >=22.12.0`, `.nvmrc`) |
| Custom domains | `synos-linux.pro`, `www.synos-linux.pro` |
| Deploy preview subdomain | `synos-linux-pro.pages.dev` |
