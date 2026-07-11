// _lib.js — shared crypto/auth helpers for the /play-test admin gate.
// Runs on the Cloudflare Pages Functions runtime (WebCrypto global `crypto`,
// `fetch`, `TextEncoder`). Written to also run under Node 20+ for unit tests
// (node exposes the same WebCrypto + fetch + TextEncoder globals).
//
// Security posture: everything here FAILS CLOSED. Missing config, bad
// signatures, expired tokens, and parse errors all resolve to "deny".

const te = new TextEncoder();
const td = new TextDecoder();

/* ---------------- base64url ---------------- */
export function bytesToB64url(bytes) {
  let bin = '';
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function b64urlToBytes(str) {
  const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ---------------- constant-time compare ---------------- */
export function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ---------------- SHA-256 ---------------- */
export async function sha256(bytes) {
  const d = await crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(d);
}

/* ---------------- HMAC session cookies ---------------- */
async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', te.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function hmacSignB64url(secret, data) {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, te.encode(data));
  return bytesToB64url(new Uint8Array(sig));
}
// Session token = base64url(JSON payload).base64url(HMAC). Payload carries exp.
export async function makeSession(payload, secret, ttlSeconds) {
  if (!secret) throw new Error('makeSession: missing secret');
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const b = bytesToB64url(te.encode(JSON.stringify(body)));
  const sig = await hmacSignB64url(secret, b);
  return `${b}.${sig}`;
}
export async function verifySession(token, secret) {
  if (!secret || !token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const b = token.slice(0, dot), sig = token.slice(dot + 1);
  const expect = await hmacSignB64url(secret, b);
  if (!constantTimeEqual(sig, expect)) return null;
  let payload;
  try { payload = JSON.parse(td.decode(b64urlToBytes(b))); } catch { return null; }
  if (!payload || typeof payload.exp !== 'number') return null;
  if (Math.floor(Date.now() / 1000) >= payload.exp) return null;
  return payload;
}

/* ---------------- cookies ---------------- */
export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
export function cookie(name, value, { maxAge, secure = true, httpOnly = true, path = '/play-test', sameSite = 'Strict' } = {}) {
  let c = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
  if (httpOnly) c += '; HttpOnly';
  if (secure) c += '; Secure';
  if (typeof maxAge === 'number') c += `; Max-Age=${maxAge}`;
  return c;
}

/* ---------------- Cloudflare Access JWT (RS256 via team JWKS) ---------------- */
const _jwksCache = new Map(); // teamDomain -> { at, keys }
async function fetchJwks(teamDomain) {
  const now = Date.now();
  const c = _jwksCache.get(teamDomain);
  if (c && now - c.at < 3600_000) return c.keys;
  const url = `https://${teamDomain}/cdn-cgi/access/certs`;
  const res = await fetch(url, { cf: { cacheTtl: 3600 } });
  if (!res.ok) throw new Error(`jwks fetch ${res.status}`);
  const data = await res.json();
  const keys = data.keys || [];
  _jwksCache.set(teamDomain, { at: now, keys });
  return keys;
}
function decodeJwtSegment(seg) { return JSON.parse(td.decode(b64urlToBytes(seg))); }

// Returns { email, sub } on success, or null (deny). Verifies signature, aud, iss, exp, and email allowlist.
export async function verifyAccessJwt(token, { teamDomain, aud, emails }) {
  try {
    if (!token || !teamDomain || !aud) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = decodeJwtSegment(parts[0]);
    const payload = decodeJwtSegment(parts[1]);
    if (header.alg !== 'RS256') return null;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || now >= payload.exp) return null;
    if (payload.nbf && now < payload.nbf) return null;
    // aud may be string or array
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!auds.includes(aud)) return null;
    if (payload.iss !== `https://${teamDomain}`) return null;
    const jwks = await fetchJwks(teamDomain);
    const jwk = jwks.find(k => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const signed = te.encode(`${parts[0]}.${parts[1]}`);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), signed);
    if (!ok) return null;
    const email = (payload.email || '').toLowerCase();
    if (Array.isArray(emails) && emails.length) {
      const allow = emails.map(e => e.toLowerCase().trim());
      if (!allow.includes(email)) return null;
    }
    return { email, sub: payload.sub };
  } catch { return null; }
}

/* ---------------- minimal CBOR decode (for WebAuthn attestationObject/COSE) ---------------- */
// Supports the subset the WebAuthn registration path needs: unsigned/negative
// ints, byte/text strings, arrays, and maps (incl. integer keys for COSE).
export function cborDecodeFirst(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let p = 0;
  function u(n) { let v = 0; for (let i = 0; i < n; i++) v = v * 256 + u8[p++]; return v; }
  function len(ai) { if (ai < 24) return ai; if (ai === 24) return u(1); if (ai === 25) return u(2); if (ai === 26) return u(4); if (ai === 27) return u(8); throw new Error('cbor len'); }
  function item() {
    const b = u8[p++]; const major = b >> 5; const ai = b & 0x1f;
    switch (major) {
      case 0: return len(ai);
      case 1: return -1 - len(ai);
      case 2: { const n = len(ai); const s = u8.slice(p, p + n); p += n; return s; }
      case 3: { const n = len(ai); const s = td.decode(u8.slice(p, p + n)); p += n; return s; }
      case 4: { const n = len(ai); const a = []; for (let i = 0; i < n; i++) a.push(item()); return a; }
      case 5: { const n = len(ai); const m = new Map(); for (let i = 0; i < n; i++) { const k = item(); const v = item(); m.set(k, v); } return m; }
      case 7: { if (ai === 20) return false; if (ai === 21) return true; if (ai === 22) return null; throw new Error('cbor simple'); }
      default: throw new Error('cbor major ' + major);
    }
  }
  return item();
}

/* ---------------- WebAuthn authenticatorData ---------------- */
export function parseAuthData(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (u8.length < 37) throw new Error('authData too short');
  const rpIdHash = u8.slice(0, 32);
  const flags = u8[32];
  const signCount = (u8[33] << 24) | (u8[34] << 16) | (u8[35] << 8) | u8[36];
  const out = { rpIdHash, flags, signCount, up: !!(flags & 0x01), uv: !!(flags & 0x04), at: !!(flags & 0x40) };
  let p = 37;
  if (out.at) {
    p += 16; // AAGUID
    const idLen = (u8[p] << 8) | u8[p + 1]; p += 2;
    out.credentialId = u8.slice(p, p + idLen); p += idLen;
    out.coseKey = cborDecodeFirst(u8.slice(p)); // remaining bytes = COSE key (+ optional extensions)
  }
  return out;
}

// COSE key (Map) -> JWK for import. Supports EC2/P-256 (alg -7) and RSA (alg -257).
export function coseToJwk(cose) {
  const kty = cose.get(1);
  if (kty === 2) { // EC2
    const crvMap = { 1: 'P-256', 2: 'P-384', 3: 'P-521' };
    return { kty: 'EC', crv: crvMap[cose.get(-1)] || 'P-256', x: bytesToB64url(cose.get(-2)), y: bytesToB64url(cose.get(-3)), ext: true };
  }
  if (kty === 3) { // RSA
    return { kty: 'RSA', n: bytesToB64url(cose.get(-1)), e: bytesToB64url(cose.get(-2)), ext: true };
  }
  throw new Error('unsupported COSE kty ' + kty);
}

// Convert an ASN.1 DER ECDSA signature (SEQ of two INTEGERs) to raw r||s of `size` bytes each.
export function derToRawEcdsa(der, size = 32) {
  const u8 = der instanceof Uint8Array ? der : new Uint8Array(der);
  let p = 0;
  if (u8[p++] !== 0x30) throw new Error('der: no seq');
  let seqLen = u8[p++];
  if (seqLen & 0x80) { const n = seqLen & 0x7f; seqLen = 0; for (let i = 0; i < n; i++) seqLen = (seqLen << 8) | u8[p++]; }
  function readInt() {
    if (u8[p++] !== 0x02) throw new Error('der: no int');
    let l = u8[p++];
    let v = u8.slice(p, p + l); p += l;
    // strip leading zero(s), then left-pad to `size`
    while (v.length > 1 && v[0] === 0x00) v = v.slice(1);
    if (v.length > size) throw new Error('der: int too long');
    const out = new Uint8Array(size); out.set(v, size - v.length); return out;
  }
  const r = readInt(), s = readInt();
  const raw = new Uint8Array(size * 2); raw.set(r, 0); raw.set(s, size);
  return raw;
}

// Verify a WebAuthn assertion signature.
// signature is DER (ES256) or raw (RS256). Returns boolean.
export async function verifyAssertionSignature({ jwk, alg, authData, clientDataJSON, signature }) {
  try {
    const clientHash = await sha256(clientDataJSON instanceof Uint8Array ? clientDataJSON : new Uint8Array(clientDataJSON));
    const ad = authData instanceof Uint8Array ? authData : new Uint8Array(authData);
    const signed = new Uint8Array(ad.length + clientHash.length);
    signed.set(ad, 0); signed.set(clientHash, ad.length);
    const sig = signature instanceof Uint8Array ? signature : new Uint8Array(signature);
    if (alg === -7) { // ES256 / P-256
      const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      const raw = sig.length === 64 ? sig : derToRawEcdsa(sig, 32);
      return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, raw, signed);
    }
    if (alg === -257) { // RS256
      const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, signed);
    }
    return false;
  } catch { return false; }
}

/* ---------------- config helpers ---------------- */
export function adminCredential(env) {
  // PLAYTEST_ADMIN_CREDENTIAL = JSON {"id":"<b64url credId>","jwk":{...},"alg":-7}
  try { return env.PLAYTEST_ADMIN_CREDENTIAL ? JSON.parse(env.PLAYTEST_ADMIN_CREDENTIAL) : null; } catch { return null; }
}
export function adminEmails(env) {
  return (env.PLAYTEST_ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
}
export const RP_ID = 'synos-linux.pro';
export const ORIGIN = 'https://synos-linux.pro';
export const SESSION_TTL = 60 * 60 * 8; // 8h admin session
