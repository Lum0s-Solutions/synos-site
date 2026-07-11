// POST /play-test/auth/login/begin — issue a WebAuthn assertion challenge.
import { bytesToB64url, makeSession, cookie, adminCredential, RP_ID } from '../../_lib.js';

export async function onRequestPost({ env }) {
  if (!env.PLAYTEST_SESSION_SECRET) return json({ error: 'unconfigured' }, 503);
  const cred = adminCredential(env);
  if (!cred) return json({ error: 'not_enrolled', message: 'No passkey enrolled yet. Visit /play-test/login and choose “Enrol a passkey”.' }, 409);

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const chalB64 = bytesToB64url(challenge);
  const options = {
    challenge: chalB64,
    rpId: RP_ID,
    allowCredentials: [{ type: 'public-key', id: cred.id, transports: ['internal', 'hybrid', 'usb', 'nfc', 'ble'] }],
    userVerification: 'preferred',
    timeout: 60000,
  };
  const chalCookie = await makeSession({ t: 'auth', chal: chalB64 }, env.PLAYTEST_SESSION_SECRET, 300);
  return json(options, 200, { 'Set-Cookie': cookie('pt_chal', chalCookie, { maxAge: 300 }) });
}

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store', ...extra } });
}
