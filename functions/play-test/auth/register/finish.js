// POST /play-test/auth/register/finish — verify the enrolment ceremony and
// emit the credential record for the admin to store in PLAYTEST_ADMIN_CREDENTIAL.
import {
  b64urlToBytes, bytesToB64url, verifySession, parseCookies, cborDecodeFirst,
  parseAuthData, coseToJwk, sha256, makeSession, cookie, RP_ID, ORIGIN, SESSION_TTL,
} from '../../_lib.js';

const td = new TextDecoder();

export async function onRequestPost({ request, env }) {
  if (!env.PLAYTEST_SESSION_SECRET) return json({ error: 'unconfigured' }, 503);
  const chal = await verifySession(parseCookies(request.headers.get('Cookie'))['pt_chal'], env.PLAYTEST_SESSION_SECRET);
  if (!chal || chal.t !== 'reg') return json({ error: 'challenge_expired' }, 400);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const resp = body && body.response;
  if (!resp || !resp.clientDataJSON || !resp.attestationObject) return json({ error: 'malformed' }, 400);

  // clientDataJSON checks
  let cd;
  try { cd = JSON.parse(td.decode(b64urlToBytes(resp.clientDataJSON))); } catch { return json({ error: 'bad_clientdata' }, 400); }
  if (cd.type !== 'webauthn.create') return json({ error: 'wrong_type' }, 400);
  if (cd.origin !== ORIGIN) return json({ error: 'bad_origin', got: cd.origin }, 400);
  if (cd.challenge !== chal.chal) return json({ error: 'challenge_mismatch' }, 400);

  // attestationObject -> authData -> COSE key
  let authData, cose, alg;
  try {
    const att = cborDecodeFirst(b64urlToBytes(resp.attestationObject));
    authData = parseAuthData(att.get('authData'));
    if (!authData.at || !authData.coseKey) throw new Error('no attested cred');
    cose = authData.coseKey;
    alg = cose.get(3);
  } catch (e) { return json({ error: 'bad_attestation', detail: String(e) }, 400); }

  // rpIdHash must match sha256(rpId)
  const expectRp = await sha256(new TextEncoder().encode(RP_ID));
  if (!eqBytes(authData.rpIdHash, expectRp)) return json({ error: 'rpid_mismatch' }, 400);
  if (!authData.up) return json({ error: 'user_presence_required' }, 400);

  let jwk;
  try { jwk = coseToJwk(cose); } catch (e) { return json({ error: 'bad_cose', detail: String(e) }, 400); }

  const record = { id: bytesToB64url(authData.credentialId), jwk, alg, created: new Date().toISOString(), email: chal.email };

  // Log the credential in the ceremony has to land in an env var; return it so
  // the admin can paste it. Also log-echo to console for wrangler dev capture.
  console.log('[play-test] enrolled credential:', JSON.stringify({ id: record.id, jwk: record.jwk, alg: record.alg }));

  // Convenience: also mint a session so registration doubles as first login.
  const session = await makeSession({ email: chal.email }, env.PLAYTEST_SESSION_SECRET, SESSION_TTL);
  return json(
    { ok: true, message: 'Passkey enrolled. Store the `credential` value below in the PLAYTEST_ADMIN_CREDENTIAL env var, then set PLAYTEST_ALLOW_REGISTER=0.', credential: record },
    200,
    { 'Set-Cookie': [cookie('pt_session', session, { maxAge: SESSION_TTL }), cookie('pt_chal', '', { maxAge: 0 })] }
  );
}

function eqBytes(a, b) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; }
function json(obj, status = 200, extra = {}) {
  const h = new Headers({ 'content-type': 'application/json', 'cache-control': 'private, no-store' });
  for (const [k, v] of Object.entries(extra)) { if (Array.isArray(v)) v.forEach(x => h.append(k, x)); else h.set(k, v); }
  return new Response(JSON.stringify(obj), { status, headers: h });
}
