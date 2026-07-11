// POST /play-test/auth/register/begin — one-time passkey enrolment (behind Access).
// Allowed only when no admin credential is configured yet, or PLAYTEST_ALLOW_REGISTER=1.
import { bytesToB64url, makeSession, cookie, sha256, adminCredential, RP_ID } from '../../_lib.js';

export async function onRequestPost({ request, env }) {
  const already = adminCredential(env);
  if (already && env.PLAYTEST_ALLOW_REGISTER !== '1') {
    return json({ error: 'registration_closed', message: 'A passkey is already enrolled. Set PLAYTEST_ALLOW_REGISTER=1 to re-enrol.' }, 403);
  }
  if (!env.PLAYTEST_SESSION_SECRET) return json({ error: 'unconfigured' }, 503);

  const email = (request.headers.get('Cf-Access-Authenticated-User-Email') || 'admin@synos-linux.pro').toLowerCase();
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const chalB64 = bytesToB64url(challenge);
  const userId = bytesToB64url(await sha256(new TextEncoder().encode(email)));

  const options = {
    rp: { id: RP_ID, name: 'Syn_OS · play-test' },
    user: { id: userId, name: email, displayName: 'play-test admin' },
    challenge: chalB64,
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
    attestation: 'none',
    timeout: 60000,
  };
  const chalCookie = await makeSession({ t: 'reg', chal: chalB64, email }, env.PLAYTEST_SESSION_SECRET, 300);
  return json(options, 200, { 'Set-Cookie': cookie('pt_chal', chalCookie, { maxAge: 300 }) });
}

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store', ...extra } });
}
