// _middleware.js — the /play-test admin gate. Runs for EVERY request under
// /play-test/*. Two independent factors, both required to reach the game:
//
//   1. Cloudflare Access  — a valid, signature-verified Access JWT whose email
//      is on the admin allowlist. When Access sits in front (the intended
//      config) this is already enforced at the edge; we re-verify so that if
//      Access is somehow bypassed or unconfigured, we still DENY.
//   2. Passkey session    — an HMAC-signed session cookie minted only after a
//      successful WebAuthn assertion (see auth/login/finish.js).
//
// FAIL CLOSED: any missing env var, bad signature, or parse error => deny.
// The login page + auth endpoints require factor 1 only (you must pass Access
// to reach them), so the passkey ceremony can run; everything else needs both.

import { verifyAccessJwt, verifySession, parseCookies, adminEmails } from './_lib.js';

const OPEN_TO_AUTHED = [/^\/play-test\/login(?:\.html)?\/?$/, /^\/play-test\/auth\//];

function deny(msg, status) {
  return new Response(
    `<!doctype html><meta charset=utf-8><title>Access denied</title>` +
    `<style>body{background:#08060a;color:#f5f1ee;font:15px/1.6 ui-monospace,Menlo,monospace;` +
    `display:grid;place-items:center;height:100vh;margin:0}b{color:#d94a4a}</style>` +
    `<div><b>play-test // access denied</b><br>${msg}</div>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow' } }
  );
}
// The game client is inline-scripted, so it needs 'unsafe-inline'; the world
// socket is pinned to exactly one host. Set ONE authoritative CSP here so
// /play-test never inherits a second (intersecting) CSP from the global
// _headers rule — the duplicate-CSP trap that currently breaks /play.
const PLAYTEST_CSP =
  "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; " +
  "font-src 'self' data:; script-src 'self' 'unsafe-inline'; " +
  "connect-src 'self' wss://world.synos-linux.pro; frame-ancestors 'none'; " +
  "base-uri 'self'; form-action 'self'; object-src 'none'";

function noStore(res) {
  const h = new Headers(res.headers);
  h.set('cache-control', 'private, no-store, must-revalidate');
  h.set('x-robots-tag', 'noindex, nofollow');
  h.set('x-frame-options', 'DENY');
  h.set('x-content-type-options', 'nosniff');
  h.set('referrer-policy', 'strict-origin-when-cross-origin');
  h.set('cross-origin-opener-policy', 'same-origin');
  h.set('cross-origin-resource-policy', 'same-origin');
  h.set('content-security-policy', PLAYTEST_CSP);
  return new Response(res.body, { status: res.status, headers: h });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // ---- Factor 1: Cloudflare Access (required for ALL /play-test/*) ----
  const token = request.headers.get('Cf-Access-Jwt-Assertion') ||
    parseCookies(request.headers.get('Cookie'))['CF_Authorization'];
  const access = await verifyAccessJwt(token, {
    teamDomain: env.CF_ACCESS_TEAM_DOMAIN,
    aud: env.CF_ACCESS_AUD,
    emails: adminEmails(env),
  });
  if (!access) {
    // Unconfigured or unauthorized. If Access is meant to be in front, an
    // unauthenticated visitor never gets here; getting here means DENY.
    return deny('Cloudflare Access authorization required.', 403);
  }

  // ---- login page + auth endpoints: factor 1 is enough ----
  if (OPEN_TO_AUTHED.some(re => re.test(path))) {
    return noStore(await next());
  }

  // ---- Factor 2: passkey session (required for the game shell) ----
  const session = await verifySession(
    parseCookies(request.headers.get('Cookie'))['pt_session'],
    env.PLAYTEST_SESSION_SECRET
  );
  if (!session || session.email !== access.email) {
    const to = new URL('/play-test/login', url);
    to.searchParams.set('next', path);
    return new Response(null, { status: 302, headers: { Location: to.toString(), 'cache-control': 'private, no-store' } });
  }

  return noStore(await next());
}
