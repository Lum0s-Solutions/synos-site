// Same-origin proxy so the /play-test GRIMOIRE client can reach its auth/hub
// daemon without CORS. The client (served at synos-linux.pro/play-test) resolves
// RPG="" and calls /api/v1/*  (same-origin); this forwards those to the GRIMOIRE
// daemon behind world.synos-linux.pro/api/v1/*. The game WebSocket still goes
// straight to wss://world.synos-linux.pro (unchanged).
//
// The daemon's own /api/v1/auth is already public at world.synos-linux.pro, so
// this exposes no new surface — it just gives the apex a same-origin door.
const UPSTREAM = 'https://world.synos-linux.pro';

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const target = UPSTREAM + url.pathname + url.search;   // pathname includes /api/...

  const headers = new Headers(request.headers);
  headers.delete('host');            // let fetch set Host: world.synos-linux.pro
  headers.delete('cf-connecting-ip');

  const method = request.method;
  const body = (method === 'GET' || method === 'HEAD') ? undefined : await request.arrayBuffer();

  let resp;
  try {
    resp = await fetch(target, { method, headers, body, redirect: 'manual' });
  } catch (e) {
    return new Response('play-test api proxy: upstream unreachable — ' + e.message,
      { status: 502, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });
  }

  const out = new Headers(resp.headers);
  out.set('cache-control', 'no-store');
  out.set('x-robots-tag', 'noindex, nofollow');
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: out });
}
