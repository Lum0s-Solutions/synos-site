// gen-play-test.mjs — derive the admin test client (public/play-test/index.html)
// from the canonical GRIMOIRE web client (public/play/index.html) at build time.
//
// This keeps a SINGLE source of truth: whatever the game-graphics work commits
// into public/play/index.html is automatically what the gated /play-test route
// serves on the next deploy — including "the graphics from the other day".
//
// The only transforms: a fixed "ADMIN TEST" banner, a pinned live world-server,
// a distinct <title>, and noindex. The auth gate lives in functions/play-test/.
//
// Fails LOUD if the source markers move, so a future /play refactor can't
// silently emit a broken test client.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'public', 'play', 'index.html');
const OUT_DIR = join(root, 'public', 'play-test');
const OUT = join(OUT_DIR, 'index.html');

let html = readFileSync(SRC, 'utf8');

function must(cond, msg) { if (!cond) { console.error(`[gen-play-test] FAIL: ${msg}`); process.exit(1); } }

// 1) distinct title (noindex handled by the gate's headers + meta below)
must(/<title>[^<]*<\/title>/.test(html), 'no <title> in source client');
html = html.replace(/<title>[^<]*<\/title>/, '<title>GRIMOIRE · play-test (admin)</title><meta name="robots" content="noindex,nofollow">');

// 2) pin the live world-server + mark test mode, BEFORE the client script reads
//    window.SYNOS_WORLD_SERVER (public/play/index.html line ~270).
must(html.includes('<head>'), 'no <head> in source client');
html = html.replace('<head>',
  `<head><script>window.SYNOS_PLAYTEST=true;window.SYNOS_WORLD_SERVER=window.SYNOS_WORLD_SERVER||'wss://world.synos-linux.pro';</script>`);

// 3) fixed corner banner (position:fixed → does not disturb the client's flex layout)
const banner =
  `<style>#pt-banner{position:fixed;top:6px;right:8px;z-index:99999;font:700 10px/1 ui-monospace,Menlo,monospace;` +
  `letter-spacing:.12em;text-transform:uppercase;color:#f5f1ee;background:linear-gradient(180deg,#bf1f1f,#8f1212);` +
  `border:1px solid #d94a4a;border-radius:5px;padding:5px 8px;box-shadow:0 0 16px -4px rgba(191,31,31,.7);pointer-events:none}` +
  `#pt-banner b{color:#ffd7d7}</style>` +
  `<div id="pt-banner">Admin test · <b>live world-server</b></div>`;
const bodyOpen = html.match(/<body[^>]*>/);
must(bodyOpen, 'no <body> tag in source client');
html = html.replace(bodyOpen[0], bodyOpen[0] + banner);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, html);
console.log(`[gen-play-test] wrote ${OUT} (${(html.length / 1024).toFixed(0)} KB) from public/play/index.html`);
