// _middleware.js — the /download/* members gate. Runs for EVERY request under
// /download/*. Requires a valid, signature-verified Cloudflare Access JWT before
// any bytes of a members-only image (e.g. the Church of Malware ISO) are served.
//
// WHO is allowed is decided by the Cloudflare Access APPLICATION POLICY placed in
// front of synos-linux.pro/download/* in the Zero Trust dashboard (email OTP list,
// a Discord/GitHub IdP for the CoM roster, etc.). This middleware RE-VERIFIES the
// Access JWT at the edge so that if Access is ever bypassed or unconfigured, the
// download still DENIES (fail closed) — the ISO is never exposed unauthenticated.
//
// Optional extra in-code allowlist: DOWNLOAD_ALLOWED_EMAILS (comma-separated). If
// set, the verified Access email must also be on that list; if unset, any identity
// the Access application admits is allowed (the dashboard policy is the source of
// truth for a members roster too large to hardcode) — the intended default.
//
// FAIL CLOSED: missing env, bad signature, expired/aud/iss mismatch => 403.

import { verifyAccessJwt, parseCookies } from '../play-test/_lib.js';

function deny(msg, status) {
  return new Response(
    `<!doctype html><meta charset=utf-8><title>Access denied</title>` +
    `<style>body{background:#08060a;color:#f5f1ee;font:15px/1.6 ui-monospace,Menlo,monospace;` +
    `display:grid;place-items:center;height:100vh;margin:0}b{color:#39d353}a{color:#5ff07a}</style>` +
    `<div><b>church of malware // access denied</b><br>${msg}</div>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow' } }
  );
}

function downloadAllowedEmails(env) {
  return (env.DOWNLOAD_ALLOWED_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
}

export async function onRequest(context) {
  const { request, env, next } = context;

  const token = request.headers.get('Cf-Access-Jwt-Assertion') ||
    parseCookies(request.headers.get('Cookie'))['CF_Authorization'];

  const access = await verifyAccessJwt(token, {
    teamDomain: env.CF_ACCESS_TEAM_DOMAIN,
    // Prefer a dedicated Access app for downloads; fall back to the shared AUD.
    aud: env.CF_ACCESS_DOWNLOAD_AUD || env.CF_ACCESS_AUD,
    emails: downloadAllowedEmails(env),
  });

  if (!access) {
    return deny(
      'Cloudflare Access authorization required. The Church of Malware image is ' +
      'members-only — request access at <a href="https://churchofmalware.org">churchofmalware.org</a>.',
      403
    );
  }

  const res = await next();
  const h = new Headers(res.headers);
  h.set('cache-control', 'private, no-store, must-revalidate');
  h.set('x-robots-tag', 'noindex, nofollow');
  h.set('x-content-type-options', 'nosniff');
  h.set('referrer-policy', 'strict-origin-when-cross-origin');
  return new Response(res.body, { status: res.status, headers: h });
}
