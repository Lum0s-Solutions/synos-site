// Unit tests for the /play-test auth crypto core. Runs under `node --test`.
// Node 20+ exposes WebCrypto (`crypto.subtle`) — the same primitives the
// Cloudflare Pages runtime uses — so these exercise the real code paths.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign as nodeSign, randomBytes } from 'node:crypto';
import {
  bytesToB64url, b64urlToBytes, constantTimeEqual, makeSession, verifySession,
  parseCookies, derToRawEcdsa, verifyAssertionSignature, verifyAccessJwt,
  parseAuthData, cborDecodeFirst, coseToJwk, sha256,
} from '../functions/play-test/_lib.js';

const enc = new TextEncoder();
const b64url = buf => Buffer.from(buf).toString('base64url');

test('base64url round-trips arbitrary bytes', () => {
  for (const n of [0, 1, 2, 3, 31, 32, 64, 200]) {
    const b = randomBytes(n);
    assert.deepEqual(Buffer.from(b64urlToBytes(bytesToB64url(b))), b);
  }
});

test('constantTimeEqual', () => {
  assert.ok(constantTimeEqual('abc', 'abc'));
  assert.ok(!constantTimeEqual('abc', 'abd'));
  assert.ok(!constantTimeEqual('abc', 'ab'));
});

test('HMAC session: make/verify, tamper, and expiry all behave', async () => {
  const secret = 'test-secret-key-please-rotate';
  const tok = await makeSession({ email: 'ty@synos-linux.pro' }, secret, 60);
  const v = await verifySession(tok, secret);
  assert.equal(v.email, 'ty@synos-linux.pro');

  assert.equal(await verifySession(tok, 'wrong-secret'), null, 'wrong secret => null');
  assert.equal(await verifySession(tok + 'x', secret), null, 'tampered sig => null');
  const [body] = tok.split('.');
  assert.equal(await verifySession(body + '.deadbeef', secret), null, 'forged sig => null');

  const expired = await makeSession({ email: 'x' }, secret, -1);
  assert.equal(await verifySession(expired, secret), null, 'expired => null');
  assert.equal(await verifySession('', secret), null);
  assert.equal(await verifySession(tok, ''), null, 'no secret => null (fail closed)');
});

test('parseCookies', () => {
  const c = parseCookies('a=1; pt_session=abc.def; CF_Authorization=xyz');
  assert.equal(c.pt_session, 'abc.def');
  assert.equal(c.CF_Authorization, 'xyz');
  assert.deepEqual(parseCookies(null), {});
});

test('derToRawEcdsa converts a real DER ECDSA signature to verifiable 64-byte raw', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const msg = Buffer.from('hello');
  // ECDSA is randomized, so convert THE SAME signature and prove it still verifies.
  const der = nodeSign('sha256', msg, { key: privateKey, dsaEncoding: 'der' });
  const raw = derToRawEcdsa(der, 32);
  assert.equal(raw.length, 64);
  const jwk = publicKey.export({ format: 'jwk' });
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  assert.ok(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, raw, msg), 'converted raw sig verifies');
});

test('verifyAssertionSignature (ES256): accepts a valid DER assertion, rejects tampering', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicKey.export({ format: 'jwk' }); // {kty:'EC',crv:'P-256',x,y}

  const authData = Buffer.concat([randomBytes(32), Buffer.from([0x01]), Buffer.from([0, 0, 0, 5])]); // rpIdHash|flags(UP)|signCount
  const clientDataJSON = enc.encode(JSON.stringify({ type: 'webauthn.get', challenge: 'abc', origin: 'https://synos-linux.pro' }));
  const clientHash = await sha256(clientDataJSON);
  const signedMsg = Buffer.concat([authData, Buffer.from(clientHash)]);
  const der = nodeSign('sha256', signedMsg, { key: privateKey, dsaEncoding: 'der' });

  assert.ok(await verifyAssertionSignature({ jwk, alg: -7, authData, clientDataJSON, signature: der }), 'valid assertion verifies');

  const badSig = Buffer.from(der); badSig[badSig.length - 1] ^= 0xff;
  assert.ok(!await verifyAssertionSignature({ jwk, alg: -7, authData, clientDataJSON, signature: badSig }), 'tampered sig fails');

  const badAuth = Buffer.from(authData); badAuth[0] ^= 0xff;
  assert.ok(!await verifyAssertionSignature({ jwk, alg: -7, authData: badAuth, clientDataJSON, signature: der }), 'tampered authData fails');
});

test('parseAuthData extracts flags/signCount and attested credential', () => {
  const rpIdHash = randomBytes(32);
  const flags = Buffer.from([0x41]); // UP + AT
  const signCount = Buffer.from([0, 0, 0, 7]);
  const aaguid = Buffer.alloc(16);
  const credId = randomBytes(20);
  const credIdLen = Buffer.from([0, credId.length]);
  // minimal COSE EC2 key as CBOR: map(5){1:2, 3:-7, -1:1, -2:x(32), -3:y(32)}
  const x = randomBytes(32), y = randomBytes(32);
  const cose = cborEc2(x, y);
  const ad = Buffer.concat([rpIdHash, flags, signCount, aaguid, credIdLen, credId, cose]);
  const p = parseAuthData(ad);
  assert.equal(p.up, true);
  assert.equal(p.at, true);
  assert.equal(p.signCount, 7);
  assert.deepEqual(Buffer.from(p.credentialId), credId);
  const jwk = coseToJwk(p.coseKey);
  assert.equal(jwk.kty, 'EC');
  assert.equal(jwk.crv, 'P-256');
  assert.equal(jwk.x, bytesToB64url(x));
});

test('cborDecodeFirst decodes an attestationObject-shaped map', () => {
  // map(3){ "fmt":"none", "attStmt": map(0){}, "authData": bytes(4) }
  const authData = Buffer.from([1, 2, 3, 4]);
  const obj = Buffer.concat([
    Buffer.from([0xa3]), // map(3)
    txt('fmt'), txt('none'),
    txt('attStmt'), Buffer.from([0xa0]), // map(0)
    txt('authData'), bstr(authData),
  ]);
  const m = cborDecodeFirst(obj);
  assert.equal(m.get('fmt'), 'none');
  assert.deepEqual(Buffer.from(m.get('authData')), authData);
});

test('verifyAccessJwt: accepts a valid RS256 token, rejects bad aud/email/exp/sig', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' });
  jwk.kid = 'kid-1'; jwk.alg = 'RS256'; jwk.use = 'sig';
  const team = 'synos.cloudflareaccess.com';
  const aud = 'aud-tag-123';

  // mock the JWKS endpoint
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (u) => {
    assert.ok(String(u).includes(`https://${team}/cdn-cgi/access/certs`));
    return { ok: true, status: 200, json: async () => ({ keys: [jwk] }) };
  };
  try {
    const mk = (payload) => {
      const h = b64url(JSON.stringify({ alg: 'RS256', kid: 'kid-1', typ: 'JWT' }));
      const p = b64url(JSON.stringify(payload));
      const sig = nodeSign('sha256', Buffer.from(`${h}.${p}`), privateKey).toString('base64url');
      return `${h}.${p}.${sig}`;
    };
    const now = Math.floor(Date.now() / 1000);
    const good = mk({ aud: [aud], iss: `https://${team}`, email: 'TY@synos-linux.pro', exp: now + 300 });

    const r = await verifyAccessJwt(good, { teamDomain: team, aud, emails: ['ty@synos-linux.pro'] });
    assert.equal(r.email, 'ty@synos-linux.pro', 'valid token passes, email normalized');

    assert.equal(await verifyAccessJwt(good, { teamDomain: team, aud: 'other', emails: [] }), null, 'wrong aud => null');
    assert.equal(await verifyAccessJwt(good, { teamDomain: team, aud, emails: ['someone@else.com'] }), null, 'email not allowlisted => null');

    const expired = mk({ aud, iss: `https://${team}`, email: 'ty@synos-linux.pro', exp: now - 10 });
    assert.equal(await verifyAccessJwt(expired, { teamDomain: team, aud, emails: [] }), null, 'expired => null');

    const forged = good.slice(0, -4) + 'AAAA';
    assert.equal(await verifyAccessJwt(forged, { teamDomain: team, aud, emails: [] }), null, 'bad signature => null');

    assert.equal(await verifyAccessJwt(good, { teamDomain: team, aud: '', emails: [] }), null, 'no aud config => fail closed');
    assert.equal(await verifyAccessJwt(null, { teamDomain: team, aud, emails: [] }), null, 'no token => null');
  } finally {
    globalThis.fetch = realFetch;
  }
});

/* ---- CBOR builder helpers (test-only) — handle lengths >=24 (0x58/0x78 long form) ---- */
function hdr(major, len) {
  const m = major << 5;
  if (len < 24) return Buffer.from([m | len]);
  if (len < 256) return Buffer.from([m | 24, len]);
  return Buffer.from([m | 25, (len >> 8) & 0xff, len & 0xff]);
}
function txt(s) { const b = Buffer.from(s, 'utf8'); return Buffer.concat([hdr(3, b.length), b]); }
function bstr(b) { return Buffer.concat([hdr(2, b.length), b]); }
function negOne(n) { return Buffer.from([0x20 | (n - 1)]); } // small negative int -n  (major 1)
function cborEc2(x, y) {
  // map(5){ 1:2, 3:-7, -1:1, -2:bstr(x), -3:bstr(y) }
  return Buffer.concat([
    Buffer.from([0xa5]),
    Buffer.from([0x01]), Buffer.from([0x02]),      // 1: 2 (kty EC2)
    Buffer.from([0x03]), Buffer.from([0x26]),      // 3: -7 (alg ES256)  (-7 => 0x20|6)
    negOne(1), Buffer.from([0x01]),                // -1: 1 (crv P-256)
    negOne(2), bstr(x),                            // -2: x
    negOne(3), bstr(y),                            // -3: y
  ]);
}
