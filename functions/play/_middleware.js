// _middleware.js for /play/* — the browser game is no longer public.
// Return a neutral 404 (no hint that a gated /play-test exists). The local
// GRIMOIRE daemon (localhost:8090) and the source file public/play/index.html
// are unaffected; this only governs the public synos-linux.pro edge.
export function onRequest() {
  return new Response(
    `<!doctype html><meta charset=utf-8><title>Not found</title>` +
    `<style>body{background:#08060a;color:#f5f1ee;font:15px/1.6 ui-monospace,Menlo,monospace;display:grid;place-items:center;height:100vh;margin:0}a{color:#d94a4a}</style>` +
    `<div>404 — not found. <a href="/">synos-linux.pro</a></div>`,
    { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } }
  );
}
