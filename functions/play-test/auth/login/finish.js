// POST /play-test/auth/login/finish — verify the WebAuthn assertion and, on
// success, mint the passkey session cookie bound to the Access identity.
import {
  b64urlToBytes, verifySession, parseCookies, parseAuthData, sha256,
  verifyAssertionSignature, verifyAccessJwt, adminEmails, adminCredential,
  makeSession, cookie, RP_ID, ORIGIN, SESSION_TTL,
} from '../../_lib.js';

const td = new TextDecoder();

export async function onRequestPost({ request, env }) {
  if (!env.PLAYTEST_SESSION_SECRET) return json({ error: 'unconfigured' }, 503);
  const cred = adminCredential(env);
  if (!cred) return json({ error: 'not_enrolled' }, 409);

  const chal = await verifySession(parseCookies(request.headers.get('Cookie'))['pt_chal'], env.PLAYTEST_SESSION_SECRET);
  if (!chal || chal.t !== 'auth') return json({ error: 'challenge_expired' }, 400);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const resp = body && body.response;
  if (!resp || !resp.clientDataJSON || !resp.authenticatorData || !resp.signature) return json({ error: 'malformed' }, 400);
  if (body.id !== cred.id) return json({ error: 'unknown_credential' }, 400);

  // clientDataJSON checks
  let cd;
  try { cd = JSON.parse(td.decode(b64urlToBytes(resp.clientDataJSON))); } catch { return json({ error: 'bad_clientdata' }, 400); }
  if (cd.type !== 'webauthn.get') return json({ error: 'wrong_type' }, 400);
  if (cd.origin !== ORIGIN) return json({ error: 'bad_origin', got: cd.origin }, 400);
  if (cd.challenge !== chal.chal) return json({ error: 'challenge_mismatch' }, 400);

  // authenticatorData checks
  const authData = b64urlToBytes(resp.authenticatorData);
  const parsed = parseAuthData(authData);
  const expectRp = await sha256(new TextEncoder().encode(RP_ID));
  if (!eqBytes(parsed.rpIdHash, expectRp)) return json({ error: 'rpid_mismatch' }, 400);
  if (!parsed.up) return json({ error: 'user_presence_required' }, 400);

  // signature verification (the security-relevant step)
  const ok = await verifyAssertionSignature({
    jwk: cred.jwk, alg: cred.alg,
    authData, clientDataJSON: b64urlToBytes(resp.clientDataJSON), signature: b64urlToBytes(resp.signature),
  });
  if (!ok) return json({ error: 'bad_signature' }, 401);

  // bind the session to the verified Access identity
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || parseCookies(request.headers.get('Cookie'))['CF_Authorization'];
  const access = await verifyAccessJwt(token, { teamDomain: env.CF_ACCESS_TEAM_DOMAIN, aud: env.CF_ACCESS_AUD, emails: adminEmails(env) });
  if (!access) return json({ error: 'access_lost' }, 403);

  const session = await makeSession({ email: access.email }, env.PLAYTEST_SESSION_SECRET, SESSION_TTL);
  return json({ ok: true }, 200, { 'Set-Cookie': [cookie('pt_session', session, { maxAge: SESSION_TTL }), cookie('pt_chal', '', { maxAge: 0 })] });
}

function eqBytes(a, b) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; }
function json(obj, status = 200, extra = {}) {
  const h = new Headers({ 'content-type': 'application/json', 'cache-control': 'private, no-store' });
  for (const [k, v] of Object.entries(extra)) { if (Array.isArray(v)) v.forEach(x => h.append(k, x)); else h.set(k, v); }
  return new Response(JSON.stringify(obj), { status, headers: h });
}
