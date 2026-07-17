// =====================================================================
// knowledge-collection.js  --  GRIMOIRE Knowledge-Map GATHER & COLLECT
// =====================================================================
// Self-contained, framework-free browser module implementing the
// "Data Shard" collection metagame described in docs/50-GAME-INTEGRATION.md
// recommendations #26-#37. No build step, no dependencies, ASCII-only.
//
// It attaches window.KnowledgeCollection and works in TWO modes:
//   1. STANDALONE DEMO  -- collection state persists to
//      localStorage["grimoire_collection"]; the client asserts collection.
//   2. SERVER-AUTHORITATIVE (production) -- every mutation is proof-gated by
//      the world-server (cloning the v88 node-capture proof flow). The client
//      never trusts its own "collected" flag; localStorage is a display cache.
//      Every swap point is marked with a `// SERVER-AUTH:` comment so the seam
//      is unambiguous when the backend takes over.
//
// This module is a DATA + UI layer. It has NO hard THREE.js dependency: if a
// scene is present it can place 3D shard markers, and it degrades to a no-op
// when THREE / scene are absent (e.g. running headless under `node --check`).
//
// PARSE SAFETY: the file is browser JS but must survive `node --check`. All
// window / document / localStorage access is guarded (typeof checks) and never
// executed at top-level module scope -- everything lives inside the IIFE below
// and reads host globals lazily at call time.
// =====================================================================

(function (root) {
  "use strict";

  // ---- host-global guards (safe under node --check / headless test) ----
  var HAS_WIN = (typeof window !== "undefined");
  var HAS_DOC = (typeof document !== "undefined");
  var G = HAS_WIN ? window : (typeof globalThis !== "undefined" ? globalThis : root || {});

  // localStorage may be absent (node) or blocked (private mode) -> memory shim.
  var _mem = {};
  function _lsGet(k) {
    try {
      if (typeof localStorage !== "undefined") return localStorage.getItem(k);
    } catch (e) { /* blocked */ }
    return Object.prototype.hasOwnProperty.call(_mem, k) ? _mem[k] : null;
  }
  function _lsSet(k, v) {
    try {
      if (typeof localStorage !== "undefined") { localStorage.setItem(k, v); return; }
    } catch (e) { /* blocked -> fall through to memory */ }
    _mem[k] = String(v);
  }

  function _esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c];
    });
  }

  // =====================================================================
  // CONFIG
  // =====================================================================
  var STORAGE_KEY = "grimoire_collection";

  // Key binding for the collection panel. The palace/game already uses (via
  // e.code): B C E F G J K L M N O P Q R T U X Y Z, WASD (move), Tab, Slash,
  // Backquote, Enter, Escape, arrows. Free letters are H, I, V. We bind KeyV
  // ("Vault" of shards) and gate it so it never fights game/text input.
  var PANEL_KEY = "KeyV";

  // #26/#27 -- 6-tier RARITY ladder with crimson/cyber display colors.
  // (Live data currently uses common/uncommon/epic/legendary; rare + mythic are
  // reserved for gap-ghost bounties (#33) and the kill-chain reward (#32).)
  var RARITY = {
    common:    { label: "COMMON",    color: "#8a94a6", weight: 1 },
    uncommon:  { label: "UNCOMMON",  color: "#34d399", weight: 2 },
    rare:      { label: "RARE",      color: "#4fc3f7", weight: 3 },
    epic:      { label: "EPIC",      color: "#b39ddb", weight: 4 },
    legendary: { label: "LEGENDARY", color: "#ffd54f", weight: 5 },
    mythic:    { label: "MYTHIC",    color: "#ff2d55", weight: 6 }
  };
  function rarityColor(r) { return (RARITY[r] || RARITY.common).color; }
  function rarityLabel(r) { return (RARITY[r] || RARITY.common).label; }

  // #29 -- fraction of the previous tier that must be collected to unlock a
  // district. Demo default; SERVER-AUTH governs the real gate.
  var UNLOCK_THRESHOLD = 0.5;

  // #32 -- kill-chain meta-set: 7 ordered phases mapped to districts. Collect a
  // shard in each district, in order, to complete the chain (title + Mythic
  // shard, awarded server-side). Districts reference real KNOWLEDGE districts.
  var KILLCHAIN = [
    { phase: "reconnaissance",   district: "slums"    }, // threat-intel / OSINT
    { phase: "weaponization",    district: "blackwall" }, // malware-re
    { phase: "delivery",         district: "sprawl"   }, // social-engineering
    { phase: "exploitation",     district: "foundry"  }, // web/app + hardware
    { phase: "installation",     district: "citadel"  }, // endpoint hardening
    { phase: "command-control",  district: "docks"    }, // network security
    { phase: "actions",          district: "cold"     }  // forensics / exfil
  ];

  // =====================================================================
  // INTERNAL STATE
  // =====================================================================
  var _inited = false;
  var _nodes = [];             // node records
  var _byId = {};              // id -> node
  var _byDistrict = {};        // districtId -> node[]
  var _edges = [];             // optional [{source,target,type}]
  var collected = {};          // id -> true  (Set-as-object for JSON ease)
  var discovered = {};         // id -> true
  var crafted = {};            // districtId -> hubId  (#31 synthesized codices)
  var _three = null, _scene = null; // optional 3D refs

  // Normalize an edge from many shapes into {source,target,type}.
  function _normEdge(e) {
    if (!e) return null;
    if (Array.isArray(e)) return { source: e[0], target: e[1], type: e[2] || "link" };
    var s = e.source != null ? e.source : (e.a != null ? e.a : e.from);
    var t = e.target != null ? e.target : (e.b != null ? e.b : e.to);
    if (s == null || t == null) return null;
    return { source: s, target: t, type: e.type || e.rel || "link" };
  }

  function _loadState() {
    collected = {}; discovered = {}; crafted = {};
    // SERVER-AUTH: replace this localStorage read with
    //   GET /api/v1/knowledge/collection  (returns server-verified sets).
    var raw = _lsGet(STORAGE_KEY);
    if (!raw) return;
    try {
      var st = JSON.parse(raw);
      (st.collected || []).forEach(function (id) { collected[id] = true; });
      (st.discovered || []).forEach(function (id) { discovered[id] = true; });
      Object.keys(st.crafted || {}).forEach(function (d) { crafted[d] = st.crafted[d]; });
    } catch (e) { /* corrupt cache -> start clean */ }
  }

  function _saveState() {
    // SERVER-AUTH: in production the server is the source of truth; this write
    // is only a local display cache. Real mutations go through collect()'s
    // POST /api/v1/knowledge/collect below, never by trusting this blob.
    var st = {
      v: 1,
      collected: Object.keys(collected),
      discovered: Object.keys(discovered),
      crafted: crafted
    };
    _lsSet(STORAGE_KEY, JSON.stringify(st));
  }

  function _indexNodes(nodes) {
    _nodes = Array.isArray(nodes) ? nodes.slice() : [];
    _byId = {}; _byDistrict = {};
    _nodes.forEach(function (n) {
      if (!n || n.id == null) return;
      _byId[n.id] = n;
      var d = n.district || "grid";
      (_byDistrict[d] = _byDistrict[d] || []).push(n);
    });
  }

  // Lazy-init from window.KNOWLEDGE if init() was never called explicitly.
  function _ensure() {
    if (_inited) return;
    var src = (G && G.KNOWLEDGE && Array.isArray(G.KNOWLEDGE.nodes)) ? G.KNOWLEDGE.nodes : [];
    init([], { nodes: src });
  }

  // =====================================================================
  // PUBLIC: init
  // =====================================================================
  // init(edges, opts)
  //   edges : optional array for #35 Connection cards. Accepts
  //           [{source,target,type}] | [{a,b}] | [[from,to], ...]. Absent is fine.
  //   opts  : { nodes: <node[]> override (else window.KNOWLEDGE.nodes),
  //             storageKey: <string> }
  function init(edges, opts) {
    opts = opts || {};
    if (opts.storageKey) STORAGE_KEY = opts.storageKey;
    var nodes = opts.nodes ||
      ((G && G.KNOWLEDGE && Array.isArray(G.KNOWLEDGE.nodes)) ? G.KNOWLEDGE.nodes : []);
    _indexNodes(nodes);
    _edges = [];
    if (Array.isArray(edges)) {
      edges.forEach(function (e) { var ne = _normEdge(e); if (ne) _edges.push(ne); });
    }
    _loadState();
    _inited = true;
    return API;
  }

  // =====================================================================
  // FEATURE 1 -- Collection state
  // =====================================================================
  function isDiscovered(id) { _ensure(); return !!discovered[id]; }
  function isCollected(id) { _ensure(); return !!collected[id]; }

  // Reveal a node (fog-of-war). You must discover (scan) before you can collect.
  function discover(id) {
    _ensure();
    if (!_byId[id]) return { ok: false, reason: "unknown node: " + id };
    if (discovered[id]) return { ok: true, already: true, id: id };
    discovered[id] = true;
    _saveState();
    return { ok: true, id: id };
  }

  // Collect a discovered shard whose prereqs are met.
  function collect(id) {
    _ensure();
    if (!_byId[id]) return { ok: false, reason: "unknown node: " + id };
    if (collected[id]) return { ok: true, already: true, id: id };
    if (!discovered[id]) return { ok: false, reason: "not discovered -- scan its district first" };
    var gate = canCollect(id);
    if (!gate.ok) return { ok: false, reason: gate.reason, missing: gate.missing };

    // SERVER-AUTH: replace with POST /api/v1/knowledge/collect {proof}
    //   The client must first obtain a one-time, unforgeable proof (v88
    //   node-capture flow: a graded micro-check / lab flag + dwell minimum,
    //   rate-limited per account -- #43/#45). Credit ONLY after the server
    //   re-validates the proof. Do not trust this local flag in production.
    collected[id] = true;
    _saveState();
    _syncMarkers();
    return { ok: true, id: id, rarity: (_byId[id].rarity || "common") };
  }

  function reset() {
    _ensure();
    collected = {}; discovered = {}; crafted = {};
    // SERVER-AUTH: local demo only. Server progress is never wiped client-side.
    _saveState();
    _syncMarkers();
    return { ok: true };
  }

  // =====================================================================
  // SERVER ADAPTER -- production, server-authoritative (recs #43/#44/#45)
  // =====================================================================
  // In production the grimoire daemon is the source of truth. Wire the game's
  // REST helper in ONCE -- KnowledgeCollection.useServer(hapi) -- and collection
  // flows through the proof-gated /api/v1/knowledge/* endpoints; localStorage
  // becomes a display cache only. Base URL + Bearer auth are inherited from the
  // passed hapi(path, opts)->Promise<parsedJSON> function (same contract the
  // game already uses for every other /api/v1 call).
  var _srv = { hapi: null, on: false };

  function useServer(hapiFn) {
    if (typeof hapiFn !== "function") return API;
    _srv.hapi = hapiFn; _srv.on = true;
    return API;
  }
  function serverEnabled() { return !!(_srv.on && _srv.hapi); }

  function _wait(ms) {
    return new Promise(function (res) {
      if (ms > 0 && typeof setTimeout === "function") setTimeout(res, ms); else res();
    });
  }

  // Replace the static window.KNOWLEDGE node set with the server manifest so
  // the client can never drift from what the server will grade (#44).
  function loadManifestFromServer() {
    if (!serverEnabled()) return Promise.resolve({ ok: false, reason: "server not enabled" });
    return _srv.hapi("/api/v1/knowledge/manifest").then(function (m) {
      var nodes = (m && Array.isArray(m.nodes)) ? m.nodes : null;
      if (!nodes) return { ok: false, reason: "bad manifest" };
      _indexNodes(nodes); _inited = true;
      return { ok: true, count: nodes.length, version: m.version };
    });
  }

  // Pull the server-verified collection and make it local truth (#44).
  function syncFromServer() {
    if (!serverEnabled()) return Promise.resolve({ ok: false, reason: "server not enabled" });
    _ensure();
    return _srv.hapi("/api/v1/knowledge/collection").then(function (c) {
      collected = {}; discovered = {};
      var col = (c && (c.collected || c.nodes)) || [];
      col.forEach(function (x) {
        var id = (x && x.node_id) || (x && x.id) || x;
        if (id != null) { collected[id] = true; discovered[id] = true; }
      });
      ((c && c.discovered) || []).forEach(function (id) { discovered[id] = true; });
      _saveState(); _syncMarkers();
      return { ok: true, count: Object.keys(collected).length, server: c };
    });
  }

  // The real, proof-gated collect: begin -> (dwell | lab) -> collect. Returns a
  // Promise. For lab-gated (hub) nodes it returns { needsLab } so the game can
  // route the player into the lab that mints the capture proof; call
  // completeLabCollect() once the lab-flag submission yields the proof.
  function collectViaServer(id) {
    if (!serverEnabled()) return Promise.resolve(collect(id)); // graceful demo fallback
    _ensure();
    if (!_byId[id]) return Promise.resolve({ ok: false, reason: "unknown node: " + id });
    if (collected[id]) return Promise.resolve({ ok: true, already: true, id: id });
    var gate = canCollect(id); // client pre-check for fast UX; server re-checks authoritatively
    if (!gate.ok) return Promise.resolve({ ok: false, reason: gate.reason, missing: gate.missing });
    var H = _srv.hapi;
    return H("/api/v1/knowledge/begin", { method: "POST", body: JSON.stringify({ node_id: id }) })
      .then(function (ch) {
        if (!ch || ch.challenge_id == null) {
          return { ok: false, reason: (ch && (ch.error || ch.reason)) || "begin failed", missing: ch && ch.missing };
        }
        var chId = ch.challenge_id;
        if (ch.kind === "lab") {
          return { ok: false, needsLab: true, lab_id: ch.lab_id, challenge_id: chId, node_id: id };
        }
        return _wait((ch.dwell_seconds || 0) * 1000).then(function () {
          return H("/api/v1/knowledge/collect", {
            method: "POST", body: JSON.stringify({ node_id: id, challenge_id: chId })
          });
        }).then(function (res) {
          if (res && res.collected) {
            discovered[id] = true; collected[id] = true; _saveState(); _syncMarkers();
            return { ok: true, id: id, reward: res.reward, collection_count: res.collection_count,
                     rarity: (_byId[id].rarity || "common") };
          }
          return { ok: false, reason: (res && (res.error || res.reason)) || "collect rejected" };
        });
      })
      .catch(function (e) {
        return { ok: false, reason: "server error: " + (e && e.message ? e.message : e) };
      });
  }

  // Finish a lab-gated collection: the game solved the lab, the daemon minted a
  // knowledge capture proof on the pending challenge -- redeem it here (#43).
  function completeLabCollect(id, challengeId, proof) {
    if (!serverEnabled()) return Promise.resolve({ ok: false, reason: "server not enabled" });
    return _srv.hapi("/api/v1/knowledge/collect", {
      method: "POST", body: JSON.stringify({ node_id: id, challenge_id: challengeId, proof: proof })
    }).then(function (res) {
      if (res && res.collected) {
        _ensure(); discovered[id] = true; collected[id] = true; _saveState(); _syncMarkers();
        return { ok: true, id: id, reward: res.reward, collection_count: res.collection_count };
      }
      return { ok: false, reason: (res && (res.error || res.reason)) || "collect rejected" };
    });
  }

  // Submit a player-authored node to the moderation queue (#50). Never published
  // live; the daemon runs it through sanitize.py + validate_node.py before an
  // officer approves it into a future manifest build.
  function submitNode(nodeJson) {
    if (!serverEnabled()) return Promise.resolve({ ok: false, reason: "server not enabled" });
    return _srv.hapi("/api/v1/knowledge/submit", {
      method: "POST", body: JSON.stringify({ node_json: nodeJson })
    });
  }

  // =====================================================================
  // FEATURE 2 -- Shards & rarity (#26/#27)
  // =====================================================================
  // A display view of one node as a collectible Data Shard.
  function shard(id) {
    _ensure();
    var n = _byId[id];
    if (!n) return null;
    var rar = n.rarity || "common";
    return {
      id: n.id,
      title: n.title,
      type: n.type,                 // 'hub' | 'concept'
      district: n.district,
      districtName: n.districtName,
      discipline: n.discipline,
      tier: n.tier,
      rarity: rar,
      rarityLabel: rarityLabel(rar),
      color: rarityColor(rar),
      summary: n.summary,
      file: n.file,
      mitre: n.mitre || [],
      sources: n.sources || [],
      prereq: n.prereq || [],
      state: collected[n.id] ? "collected" : (discovered[n.id] ? "discovered" : "hidden")
    };
  }

  // =====================================================================
  // FEATURE 3 -- Fog-of-war discovery (#28)
  // =====================================================================
  // scanDistrict reveals (discovers) every node in a district. This is the
  // collection VERB: scan to reveal silhouettes, then collect.
  function scanDistrict(districtId) {
    _ensure();
    var list = _byDistrict[districtId] || [];
    // SERVER-AUTH: scan range/yield is gated on the Scanning SPECIAL + OSINT
    //   class server-side -- POST /api/v1/knowledge/scan {district}. The demo
    //   reveals the whole district; the server may reveal a partial cone.
    var revealed = [];
    list.forEach(function (n) {
      if (!discovered[n.id]) { discovered[n.id] = true; revealed.push(n.id); }
    });
    if (revealed.length) _saveState();
    return { ok: true, district: districtId, revealed: revealed, total: list.length };
  }

  // A node not yet discovered is hidden/silhouetted. UIs should mask it.
  function isHidden(id) { _ensure(); return !!_byId[id] && !discovered[id] && !collected[id]; }

  // =====================================================================
  // FEATURE 4 -- Prereq gating (#22/#29)
  // =====================================================================
  // canCollect returns {ok, reason, missing[]}. A node cannot be collected
  // until ALL its prereq node ids are already collected -- enforcing the
  // defensive-learning path (no "weapon shopping" straight to offensive nodes).
  function canCollect(id) {
    _ensure();
    var n = _byId[id];
    if (!n) return { ok: false, reason: "unknown node: " + id, missing: [] };
    var missing = (n.prereq || []).filter(function (p) { return !collected[p]; });
    if (missing.length) {
      return {
        ok: false,
        reason: "prereqs not met: " + missing.join(", "),
        missing: missing
      };
    }
    // SERVER-AUTH: also require a server-graded comprehension micro-check +
    //   dwell minimum + per-account rate limit here (#45) before returning ok.
    return { ok: true, reason: "", missing: [] };
  }

  // =====================================================================
  // FEATURE 5 -- Collect-to-unlock district progression (#29)
  // =====================================================================
  // A district is gated on collecting UNLOCK_THRESHOLD of the *previous tier's*
  // nodes. Tier<=1 districts are always open (the outer ring / starting zones).
  function _districtTier(districtId) {
    var list = _byDistrict[districtId] || [];
    if (!list.length) return 1;
    return list.reduce(function (m, n) {
      return Math.min(m, (typeof n.tier === "number" ? n.tier : 1));
    }, Infinity);
  }

  function districtUnlocked(districtId) {
    _ensure();
    var tier = _districtTier(districtId);
    if (tier <= 1) return true;
    var prevTier = tier - 1;
    var prev = _nodes.filter(function (n) { return n.tier === prevTier; });
    if (!prev.length) return true; // nothing to gate on
    var have = prev.filter(function (n) { return collected[n.id]; }).length;
    return (have / prev.length) >= UNLOCK_THRESHOLD;
  }

  // =====================================================================
  // FEATURE 6 -- Completion meters (#36)
  // =====================================================================
  function _meter(list) {
    var total = list.length;
    var have = list.filter(function (n) { return collected[n.id]; }).length;
    var pct = total ? Math.round((have / total) * 1000) / 10 : 0;
    return { collected: have, total: total, pct: pct };
  }

  function districtCompletion(districtId) {
    _ensure();
    return _meter(_byDistrict[districtId] || []);
  }

  function globalCompletion() {
    _ensure();
    return _meter(_nodes);
  }

  // Per-rarity tally: {rarity: {collected,total,pct}}
  function rarityTally() {
    _ensure();
    var out = {};
    Object.keys(RARITY).forEach(function (r) { out[r] = { collected: 0, total: 0, pct: 0 }; });
    _nodes.forEach(function (n) {
      var r = RARITY[n.rarity] ? n.rarity : "common";
      out[r].total++;
      if (collected[n.id]) out[r].collected++;
    });
    Object.keys(out).forEach(function (r) {
      var o = out[r];
      o.pct = o.total ? Math.round((o.collected / o.total) * 1000) / 10 : 0;
    });
    return out;
  }

  // Per-discipline tally: {discipline: {collected,total,pct}}
  function disciplineTally() {
    _ensure();
    var out = {};
    _nodes.forEach(function (n) {
      var d = n.discipline || "(uncategorized)";
      out[d] = out[d] || { collected: 0, total: 0, pct: 0 };
      out[d].total++;
      if (collected[n.id]) out[d].collected++;
    });
    Object.keys(out).forEach(function (d) {
      var o = out[d];
      o.pct = o.total ? Math.round((o.collected / o.total) * 1000) / 10 : 0;
    });
    return out;
  }

  // =====================================================================
  // FEATURE 7 -- Connection cards (#35)
  // =====================================================================
  // If manifest edges were supplied via init(edges), a "Connection" unlocks
  // when BOTH endpoints are collected. Graceful when edges are absent.
  function isConnectionUnlocked(a, b) {
    _ensure();
    return !!collected[a] && !!collected[b];
  }

  function connections() {
    _ensure();
    var out = [];
    _edges.forEach(function (e) {
      // Only surface edges whose endpoints are both real, known nodes.
      if (!_byId[e.source] || !_byId[e.target]) return;
      out.push({
        source: e.source,
        target: e.target,
        type: e.type,
        unlocked: isConnectionUnlocked(e.source, e.target)
      });
    });
    return out;
  }

  // =====================================================================
  // FEATURE 8 -- Crafting / synthesize (#31)
  // =====================================================================
  // craftHubCodex: when ALL concept nodes in a district are collected, "craft"
  // that district's hub node into a completed Hub Codex (atomic concepts roll
  // up into a discipline). The hub shard is marked collected as the payoff.
  function craftHubCodex(districtId) {
    _ensure();
    var list = _byDistrict[districtId] || [];
    if (!list.length) return { ok: false, reason: "no such district: " + districtId };
    var hub = list.filter(function (n) { return n.type === "hub"; })[0];
    if (!hub) return { ok: false, reason: "district has no hub node to craft" };
    var concepts = list.filter(function (n) { return n.type !== "hub"; });
    var pending = concepts.filter(function (n) { return !collected[n.id]; });
    if (pending.length) {
      return {
        ok: false,
        reason: "collect all concept shards first (" + pending.length + " remaining)",
        remaining: pending.map(function (n) { return n.id; })
      };
    }
    // SERVER-AUTH: replace with POST /economy/craft {recipe:<hubId>} -- the
    //   server verifies the full concept set is server-collected, mints the
    //   Hub Codex + any cert (#39), then flips the hub shard. Client cannot
    //   self-award a legendary hub.
    collected[hub.id] = true;
    discovered[hub.id] = true;
    crafted[districtId] = hub.id;
    _saveState();
    _syncMarkers();
    return { ok: true, hubId: hub.id, district: districtId };
  }

  function isCrafted(districtId) { _ensure(); return !!crafted[districtId]; }

  // =====================================================================
  // FEATURE 9 -- Kill-chain meta-set (#32)
  // =====================================================================
  // killchainProgress: for each ordered phase, is at least one shard collected
  // in that district? Returns per-phase status plus how many are satisfied
  // consecutively FROM THE START (the "in order" completion count).
  function killchainProgress() {
    _ensure();
    var phases = KILLCHAIN.map(function (p) {
      var list = _byDistrict[p.district] || [];
      var satisfied = list.some(function (n) { return collected[n.id]; });
      return { phase: p.phase, district: p.district, satisfied: satisfied };
    });
    var inOrder = 0;
    for (var i = 0; i < phases.length; i++) {
      if (phases[i].satisfied) inOrder++; else break;
    }
    return {
      phases: phases,
      inOrder: inOrder,
      total: phases.length,
      complete: inOrder === phases.length && phases.length > 0
    };
  }

  // =====================================================================
  // Optional 3D shard markers -- degrade gracefully when THREE/scene absent
  // =====================================================================
  // attachScene lets the palace hand us its live scene so collected shards can
  // pulse in-world. We do NOT bake positions here (rec #11: baked layout is the
  // baker<->renderer contract); without positions this is a safe no-op.
  function attachScene(scene, THREE) {
    _scene = scene || null;
    _three = THREE || (G && G.THREE) || null;
    return { ok: !!(_scene && _three) };
  }
  function _syncMarkers() {
    // No THREE / no scene / no baked positions -> nothing to do (headless-safe).
    if (!_three || !_scene) return;
    // Intentionally minimal: real marker placement belongs to scene.js's
    // bucketed InstancedMesh path (#5). Hook left as a documented seam.
  }

  // =====================================================================
  // FEATURE 10 -- UI panel (crimson/cyber overlay, ASCII-only)
  // =====================================================================
  var _panelEl = null, _keyBound = false;

  function _isTyping() {
    if (!HAS_DOC) return false;
    var a = document.activeElement;
    return !!a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable);
  }

  function _ensurePanel() {
    if (!HAS_DOC) return null;
    if (_panelEl) return _panelEl;
    var el = document.createElement("div");
    el.id = "kc-panel";
    el.style.cssText =
      "position:fixed;right:18px;top:60px;z-index:37;display:none;" +
      "width:min(420px,92vw);max-height:82vh;overflow:auto;" +
      "background:rgba(11,11,13,.96);color:#e8e8ea;border:1px solid #ff2d55;" +
      "border-radius:8px;padding:14px 16px;box-shadow:0 8px 40px rgba(0,0,0,.6);" +
      "font:13px/1.45 'DejaVu Sans Mono',Consolas,monospace;letter-spacing:.2px;";
    document.body.appendChild(el);
    // Click delegation for scan / collect / craft buttons.
    el.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      var act = t.getAttribute("data-kc");
      if (!act) return;
      var arg = t.getAttribute("data-id");
      if (act === "scan") scanDistrict(arg);
      else if (act === "collect") {
        // Server-authoritative when wired; async, so re-render on resolve.
        if (serverEnabled()) { collectViaServer(arg).then(function () { renderPanel(true); }); }
        else collect(arg);
      }
      else if (act === "craft") craftHubCodex(arg);
      else if (act === "reset") reset();
      else if (act === "close") { hidePanel(); return; }
      renderPanel(true); // re-render in place
    });
    _panelEl = el;
    return el;
  }

  function _bar(pct, color) {
    color = color || "#ff2d55";
    var w = Math.max(0, Math.min(100, pct));
    return "<div style='background:#1a1a1f;border:1px solid #333;border-radius:4px;" +
      "height:10px;overflow:hidden'><div style='height:100%;width:" + w + "%;" +
      "background:" + color + "'></div></div>";
  }

  function _btn(label, act, id, color) {
    color = color || "#ff2d55";
    return "<span data-kc='" + act + "' data-id='" + _esc(id || "") + "' " +
      "style='cursor:pointer;border:1px solid " + color + ";color:" + color + ";" +
      "border-radius:4px;padding:1px 7px;margin-left:6px;font-size:11px;" +
      "user-select:none'>" + label + "</span>";
  }

  function _panelHTML() {
    _ensure();
    var g = globalCompletion();
    var kc = killchainProgress();
    var h = [];
    h.push("<div style='display:flex;justify-content:space-between;align-items:center'>");
    h.push("<b style='color:#ff2d55;letter-spacing:1px'>[ DATA SHARD ARCHIVE ]</b>");
    h.push(_btn("X", "close", "", "#8a94a6") + "</div>");

    h.push("<div style='margin:8px 0 4px'>GLOBAL " + g.collected + "/" + g.total +
      "  (" + g.pct + "%)</div>");
    h.push(_bar(g.pct, "#ff2d55"));

    // kill-chain strip (#32)
    h.push("<div style='margin:10px 0 3px;color:#ffd54f'>KILL-CHAIN " +
      kc.inOrder + "/" + kc.total + (kc.complete ? "  COMPLETE" : "") + "</div>");
    h.push("<div style='font-size:11px;color:#9aa'>");
    h.push(kc.phases.map(function (p) {
      return (p.satisfied ? "[x] " : "[ ] ") + p.phase;
    }).join("  &middot;  "));
    h.push("</div>");

    // per-district shard list
    var districts = Object.keys(_byDistrict);
    districts.forEach(function (d) {
      var list = _byDistrict[d];
      var dc = districtCompletion(d);
      var unlocked = districtUnlocked(d);
      var dn = (list[0] && list[0].districtName) || d;
      h.push("<div style='margin-top:12px;border-top:1px solid #262630;padding-top:8px'>");
      h.push("<div style='display:flex;justify-content:space-between;align-items:center'>");
      h.push("<b>" + _esc(dn) + "</b> <span style='color:#9aa;font-size:11px'>" +
        dc.collected + "/" + dc.total + (unlocked ? "" : "  [LOCKED]") + "</span>");
      h.push("<span>" + _btn("SCAN", "scan", d, "#4fc3f7") + "</span></div>");
      h.push("<div style='margin:5px 0'>" + _bar(dc.pct, "#4fc3f7") + "</div>");

      list.forEach(function (n) {
        var col = rarityColor(n.rarity);
        var st = collected[n.id] ? "collected" : (discovered[n.id] ? "discovered" : "hidden");
        var name = (st === "hidden")
          ? "<span style='color:#555'>??? &mdash; silhouette</span>"
          : _esc(n.title);
        var badge = "<span style='color:" + col + ";font-size:10px'>[" +
          rarityLabel(n.rarity) + "]</span>";
        var mark = collected[n.id] ? "<span style='color:#34d399'>&#10003;</span>"
          : (discovered[n.id] ? "<span style='color:#4fc3f7'>&deg;</span>"
            : "<span style='color:#555'>&middot;</span>");
        var actions = "";
        if (st === "discovered") {
          var gate = canCollect(n.id);
          actions = gate.ok
            ? _btn("COLLECT", "collect", n.id, "#34d399")
            : "<span title='" + _esc(gate.reason) + "' style='color:#8a94a6;" +
              "font-size:10px;margin-left:6px'>[locked: prereq]</span>";
        }
        h.push("<div style='display:flex;justify-content:space-between;" +
          "align-items:center;margin:2px 0'>");
        h.push("<span>" + mark + " " + name + " " + badge + "</span>");
        h.push("<span>" + actions + "</span></div>");
      });

      // craft button when all concepts collected (#31)
      var craftRes = craftHubCodexDryRun(d);
      if (craftRes.eligible && !isCrafted(d)) {
        h.push("<div style='margin-top:4px'>" +
          _btn("SYNTHESIZE HUB CODEX", "craft", d, "#ffd54f") + "</div>");
      } else if (isCrafted(d)) {
        h.push("<div style='margin-top:4px;color:#ffd54f;font-size:11px'>" +
          "HUB CODEX SYNTHESIZED</div>");
      }
      h.push("</div>");
    });

    h.push("<div style='margin-top:12px;text-align:right'>" +
      _btn("RESET (demo)", "reset", "", "#8a94a6") + "</div>");
    h.push("<div style='margin-top:6px;color:#555;font-size:10px'>" +
      "Demo state -> localStorage. Production is proof-gated (server-authoritative)." +
      "</div>");
    return h.join("");
  }

  // Non-mutating check used by the panel to decide whether to show CRAFT.
  function craftHubCodexDryRun(districtId) {
    _ensure();
    var list = _byDistrict[districtId] || [];
    var hub = list.filter(function (n) { return n.type === "hub"; })[0];
    if (!hub) return { eligible: false };
    var pending = list.filter(function (n) { return n.type !== "hub" && !collected[n.id]; });
    return { eligible: pending.length === 0, hubId: hub.id };
  }

  // renderPanel(force): build/refresh the overlay. With no arg it TOGGLES
  // visibility; with force===true it re-renders without toggling. Headless-safe.
  function renderPanel(force) {
    if (!HAS_DOC) return { ok: false, reason: "no document (headless)" };
    var el = _ensurePanel();
    var showing = el.style.display !== "none";
    if (force === true) {
      el.innerHTML = _panelHTML();
      return { ok: true, visible: showing };
    }
    if (showing) { el.style.display = "none"; return { ok: true, visible: false }; }
    el.innerHTML = _panelHTML();
    el.style.display = "block";
    return { ok: true, visible: true };
  }

  function hidePanel() {
    if (_panelEl) _panelEl.style.display = "none";
    return { ok: true };
  }

  // Bind the panel key. Own listener, gated so it never fights game/text input.
  function bindKey() {
    if (!HAS_DOC || _keyBound) return;
    document.addEventListener("keydown", function (e) {
      if (_isTyping()) return;               // never while typing in a field
      if (e.code === "Escape") { hidePanel(); return; }
      if (e.code === PANEL_KEY) {            // KeyV -- unused by palace/game
        // Don't hijack when a modifier is held (leave OS/browser shortcuts).
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        renderPanel();
        e.preventDefault();
      }
    });
    _keyBound = true;
  }

  // =====================================================================
  // PUBLIC API
  // =====================================================================
  var API = {
    // lifecycle
    init: init,
    reset: reset,
    // state (#1)
    discover: discover,
    collect: collect,
    isCollected: isCollected,
    isDiscovered: isDiscovered,
    isHidden: isHidden,
    // shards & rarity (#26/#27)
    shard: shard,
    RARITY: RARITY,
    rarityColor: rarityColor,
    rarityLabel: rarityLabel,
    // fog-of-war (#28)
    scanDistrict: scanDistrict,
    // prereq gate (#22/#29)
    canCollect: canCollect,
    // district unlock (#29)
    districtUnlocked: districtUnlocked,
    // completion (#36)
    districtCompletion: districtCompletion,
    globalCompletion: globalCompletion,
    rarityTally: rarityTally,
    disciplineTally: disciplineTally,
    // connection cards (#35)
    connections: connections,
    isConnectionUnlocked: isConnectionUnlocked,
    // crafting (#31)
    craftHubCodex: craftHubCodex,
    isCrafted: isCrafted,
    // kill-chain (#32)
    killchainProgress: killchainProgress,
    KILLCHAIN: KILLCHAIN,
    // server adapter (#43/#44/#45) -- production, server-authoritative
    useServer: useServer,
    serverEnabled: serverEnabled,
    loadManifestFromServer: loadManifestFromServer,
    syncFromServer: syncFromServer,
    collectViaServer: collectViaServer,
    completeLabCollect: completeLabCollect,
    submitNode: submitNode,
    // 3D (optional, degrades)
    attachScene: attachScene,
    // UI (#36 overlay)
    renderPanel: renderPanel,
    hidePanel: hidePanel,
    bindKey: bindKey,
    PANEL_KEY: PANEL_KEY,
    // introspection helpers (for tooling/tests)
    _nodes: function () { _ensure(); return _nodes.slice(); }
  };

  // Attach to window (browser) and to module.exports (node test harness).
  if (HAS_WIN) window.KnowledgeCollection = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;

  // Auto-bind the key + auto-init once the DOM is ready, in the browser only.
  if (HAS_DOC) {
    var _boot = function () { _ensure(); bindKey(); };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", _boot);
    } else { _boot(); }
  }

})(typeof globalThis !== "undefined" ? globalThis : this);
