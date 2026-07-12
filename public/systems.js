// GRIMOIRE — Game Systems layer (wires the remaining dossier recs into the client).
// Education engine is the spine: curriculum(kill-chain) + career classes + verifiable certs + live CTF.
// Plus progression (roguelike runs / raids / prestige), economy (market / crafting / cosmetics),
// and competitive/social (arena ladder / mentorship). Renders reuse the HUB CSS classes.
// Reads real daemon data where endpoints exist; client-authoritative models are labelled as game systems.
window.GSYS = (function(){
  const esc = s => (s+"").replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const bar = (pct,col) => '<div style="height:7px;background:#17121c;border-radius:5px;overflow:hidden;margin:4px 0"><div style="height:100%;width:'+Math.max(0,Math.min(100,pct))+'%;background:'+col+';border-radius:5px"></div></div>';

  // ═══ R24/R26 — CAREER CLASSES (the education engine's spine) ═══
  // Five specialist tracks, each a real cyber discipline mapped to districts + labs.
  const CLASSES = [
    { id:"redteam", name:"Red Team Operator", district:"foundry", col:"#ff7a1a", creed:"Break in. Prove it's possible before an adversary does.",
      tracks:["RedTeam","WebSec","Cloud"], skills:["Exploitation","Privilege Escalation","Persistence","Evasion"], ranks:["Initiate","Operator","Specialist","Lead","Ghost"] },
    { id:"blueteam", name:"Blue Team Defender", district:"citadel", col:"#3b9dff", creed:"Assume breach. Detect, contain, harden.",
      tracks:["BlueTeam"], skills:["Detection Engineering","Incident Response","Hardening","Threat Hunting"], ranks:["Analyst I","Analyst II","Responder","Architect","Sentinel"] },
    { id:"osint", name:"OSINT Analyst", district:"slums", col:"#2fbfb6", creed:"See everything before you touch anything.",
      tracks:["OSINT"], skills:["Passive Recon","Network Mapping","Social Engineering","Attribution"], ranks:["Watcher","Tracer","Profiler","Handler","Oracle"] },
    { id:"crypto", name:"Cryptographer", district:"vault", col:"#c9a227", creed:"Trust the math, not the men.",
      tracks:["Crypto"], skills:["Symmetric/Asymmetric","Key Management","Side-Channels","Protocol Analysis"], ranks:["Novice","Adept","Cryptanalyst","Keeper","Cipher"] },
    { id:"dfir", name:"DFIR / RE Investigator", district:"cold", col:"#9d8cff", creed:"Every byte is evidence. Read the ghost.",
      tracks:["ReverseEngineering","Hardware","KernelSecurity"], skills:["Disk Forensics","Memory Analysis","Reverse Engineering","Anti-Forensics"], ranks:["Examiner","Investigator","Reconstructor","Lead","Specter"] },
  ];
  // map a daemon career-track record (loose naming) to a class id
  function matchTrack(tracks, cls){ if(!Array.isArray(tracks))return null;
    return tracks.find(t=>{ const k=(''+(t.track||t.name||t.id||"")).toLowerCase();
      return k.includes(cls.id) || (cls.id==="redteam"&&(k.includes("red")||k.includes("offens"))) ||
             (cls.id==="blueteam"&&(k.includes("blue")||k.includes("defen"))) || (cls.id==="dfir"&&(k.includes("forens")||k.includes("dfir"))) ||
             (cls.id==="osint"&&k.includes("osint")) || (cls.id==="crypto"&&(k.includes("crypt")||k.includes("cipher"))); }); }

  function renderClasses(career, labs){ const tracks=(career&&career.tracks)||[];
    const allLabs=Array.isArray(labs)?labs:(labs&&labs.labs)||[];
    const byTrack={}; allLabs.forEach(l=>{ const k=l.track||l.category; byTrack[k]=(byTrack[k]||0)+1; });
    let h='<div class="labhdr">◈ CAREER CLASSES — five disciplines mapped to '+(allLabs.length||"—")+' real labs. Clear a class\'s labs to rank up. This is where a recruit becomes a specialist.</div>';
    for(const c of CLASSES){ const t=matchTrack(tracks,c); const rank=(t&&(t.current_rank??t.rank))||0, done=(t&&(t.labs_completed||t.labs))||0, flags=(t&&(t.flags_captured||t.flags))||0;
      const avail=(c.tracks||[]).reduce((s,tr)=>s+(byTrack[tr]||0),0);
      const rn=Math.max(0,Math.min(c.ranks.length-1,rank)); const pct=avail?Math.min(100,(done/avail)*100):(rn/(c.ranks.length-1))*100;
      h+='<div class="lab" style="border-left:3px solid '+c.col+'"><div class="labtop"><span class="nm" style="color:'+c.col+'">'+c.name+'</span><span class="badge d-Medium">'+esc(c.ranks[rn])+'</span></div>'+
         '<div class="labdesc">'+esc(c.creed)+'</div>'+ bar(pct,c.col)+
         '<div class="labfoot"><span class="meta">'+c.skills.join(" · ")+'</span></div>'+
         '<div class="labfoot"><span class="meta">'+done+'/'+(avail||"?")+' labs cleared · '+flags+' flags · '+esc((c.tracks||[]).join("/"))+' track</span></div></div>'; }
    return h; }

  // ═══ R24 — CURRICULUM: the Cyber Kill-Chain mapped to the world ═══
  const KILLCHAIN = [
    { phase:"1 · Reconnaissance", district:"Silicon Slums", skill:"OSINT, passive mapping", col:"#2fbfb6" },
    { phase:"2 · Weaponization", district:"The Foundry", skill:"Payload + exploit crafting", col:"#ff7a1a" },
    { phase:"3 · Delivery", district:"Data Haven", skill:"Phishing, staging, transfer", col:"#d048c0" },
    { phase:"4 · Exploitation", district:"The Foundry", skill:"Initial access, RCE", col:"#ff7a1a" },
    { phase:"5 · Installation", district:"The Vault", skill:"Persistence, key theft", col:"#c9a227" },
    { phase:"6 · Command & Control", district:"The Citadel", skill:"C2, lateral movement (vs. Blue)", col:"#3b9dff" },
    { phase:"7 · Actions & Exfil", district:"Cold Storage", skill:"Exfiltration, anti-forensics", col:"#9d8cff" },
  ];
  function renderCurriculum(prog){
    let h='<div class="labhdr">◈ THE KILL-CHAIN — every district teaches one layer of a real intrusion. Walk the chain, learn the craft end to end.'+(prog?' · '+(prog.objectives_completed||0)+' objectives cleared':'')+'</div>';
    KILLCHAIN.forEach((k,i)=>{ h+='<div class="row" style="border-left:3px solid '+k.col+';padding-left:10px"><span class="nm" style="color:'+k.col+'">'+esc(k.phase)+'</span><span class="meta">'+esc(k.district)+' — '+esc(k.skill)+'</span></div>'; });
    return h; }

  // ═══ R25 — VERIFIABLE CERTIFICATIONS ═══
  // A cert is minted when a class reaches a rank threshold. Verification code = deterministic hash of
  // (player · class · rank · issue-epoch). Real deployment signs server-side; this surfaces the credential.
  function fnv(str){ let h=0x811c9dc5; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=(h+((h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24)))>>>0; } return ("0000000"+h.toString(16)).slice(-8).toUpperCase(); }
  function certsFor(career, player){ const tracks=(career&&career.tracks)||[]; const who=(player&&(player.username||player.name||player.id))||"operator"; const out=[];
    for(const c of CLASSES){ const t=matchTrack(tracks,c); const rank=(t&&(t.current_rank??t.rank))||0;
      // cert tiers at ranks 2 and 4
      [[2,"Associate"],[4,"Expert"]].forEach(([need,tier])=>{ if(rank>=need){ const code="GRM-"+c.id.slice(0,3).toUpperCase()+"-"+fnv(who+"|"+c.id+"|"+need); out.push({cls:c,tier,code}); } }); }
    return out; }
  function renderCerts(career, player){ const certs=certsFor(career,player);
    let h='<div class="labhdr">◈ CERTIFICATIONS — earned by advancing a class. Each carries a verification code; Church of Malware validates it against the ledger.</div>';
    if(!certs.length) return h+'<div class="huberr">No certs yet. Reach Specialist rank in a class to earn your first credential.</div>';
    for(const c of certs){ h+='<div class="lab" style="border-left:3px solid '+c.cls.col+'"><div class="labtop"><span class="nm" style="color:'+c.cls.col+'">'+esc(c.tier)+' · '+esc(c.cls.name)+'</span><span class="badge d-Hard">CERTIFIED</span></div>'+
      '<div class="labfoot"><span class="meta">Skills: '+c.cls.skills.join(" · ")+'</span></div>'+
      '<div class="labfoot"><span class="meta">Verification: <b style="color:var(--acc);letter-spacing:1px">'+c.code+'</b></span></div></div>'; }
    return h; }

  // ═══ R27 — LIVE CTF EVENTS ═══ (schedule model; joins wire to wargames when live)
  const CTF = [
    { id:"ctf_weekly", name:"Weekly Jeopardy CTF", cadence:"Every Sat 20:00 UTC", cats:["web","pwn","crypto","forensics","osint"], tier:"All ranks", col:"#f5c518" },
    { id:"ctf_kingofhill", name:"King of the Hill — The Foundry", cadence:"Sun 18:00 UTC", cats:["attack/defense"], tier:"Operator+", col:"#ff7a1a" },
    { id:"ctf_bwraid", name:"Blackwall Breach — raid CTF", cadence:"Monthly · 1st Fri", cats:["multi-stage","boss"], tier:"Specialist+", col:"#ff1e1e" },
  ];
  function renderCTF(){ let h='<div class="labhdr">◈ LIVE CTF — scheduled competitive events against real isolated targets. Solve, submit flags, climb the season board.</div>';
    for(const e of CTF){ h+='<div class="lab" style="border-left:3px solid '+e.col+'"><div class="labtop"><span class="nm" style="color:'+e.col+'">'+esc(e.name)+'</span><span class="badge d-Medium">'+esc(e.tier)+'</span></div>'+
      '<div class="labdesc">'+e.cats.map(esc).join(" · ")+'</div><div class="labfoot"><span class="meta">'+esc(e.cadence)+'</span><button class="launch" data-ctf="'+e.id+'">◈ Register</button></div></div>'; }
    return h; }

  // ═══ R06 — ROGUELIKE RUNS ═══ (seeded lab sequence + escalating mutators)
  const MUTATORS = [
    { n:"Blackout", d:"No hints. Recon tools disabled — pure skill." },
    { n:"Time Dilation", d:"Solve timer halved; bonus XP on clear." },
    { n:"Hardened Targets", d:"Every box one difficulty higher." },
    { n:"Trace Active", d:"An IDS hunts you — noisy actions cost score." },
    { n:"Glass Cannon", d:"One failed flag ends the run. Triple rewards." },
    { n:"Chained", d:"Each box's loot unlocks the next exploit." },
  ];
  function renderRuns(labs){ const pool=(Array.isArray(labs)?labs:[]).length;
    let h='<div class="labhdr">◈ ROGUELIKE RUNS — a seeded gauntlet of '+(pool||"—")+' labs with escalating mutators. Bank a run score, chase the daily seed leaderboard, die and start fresh.</div>';
    h+='<div class="qsec">TODAY\'S MUTATORS</div>';
    MUTATORS.forEach(m=>{ h+='<div class="row"><span class="nm">'+esc(m.n)+'</span><span class="meta">'+esc(m.d)+'</span></div>'; });
    h+='<div class="qsec">START A RUN</div><div class="lab"><div class="labtop"><span class="nm">Daily Seed Gauntlet</span><span class="badge d-Hard">Escalating</span></div><div class="labdesc">5 labs, +1 difficulty each floor, 2 random mutators. Clear all 5 for a season-board score.</div><div class="labfoot"><span class="meta">Roguelike · permadeath run</span><button class="launch" data-run="daily">▶ Begin run</button></div></div>';
    return h; }

  // ═══ R08 — BLACKWALL RAIDS ═══ (multi-stage co-op vs. the Guardian)
  const RAIDS = [
    { id:"bw_t1", name:"The Outer Wall", stages:["Breach the perimeter ICE","Disable the sentries","Plant the beacon"], size:"3–5 ops", col:"#ff5555", rec:"Specialist" },
    { id:"bw_t2", name:"The Guardian's Cache", stages:["Route past the honeynet","Crack the vault cipher","Exfil the fragments","Survive the trace-back"], size:"5 ops", col:"#ff1e1e", rec:"Lead" },
  ];
  function renderRaids(raidData){ const live=(raidData&&raidData.raids)||(Array.isArray(raidData)?raidData:[]);
    let h='<div class="labhdr">◈ BLACKWALL RAIDS — coordinated multi-stage assaults on the Guardian AI beyond the wall. Bring a team. Death is real here.</div>';
    if(live.length){ h+='<div class="qsec">LIVE RAIDS</div>';
      h+= live.map(r=>{ const ph=r.phases||r.stages||[]; const cur=r.current_phase!=null?(' · phase '+(r.current_phase+1)+'/'+ph.length):'';
        return '<div class="lab" style="border-left:3px solid #ff1e1e"><div class="labtop"><span class="nm" style="color:#ff5555">'+esc(r.name||r.id)+'</span><span class="badge d-Hard">'+esc(r.status||"open")+cur+'</span></div>'+
        '<div class="labfoot"><span class="meta">'+((r.members||r.member_count||0))+'/'+((r.max_members||r.size||5))+' ops · leader '+esc(r.leader||r.host||"—")+'</span><button class="launch" data-raidjoin="'+esc(r.id)+'">◈ Join raid</button></div></div>'; }).join(""); }
    h+='<div class="qsec">RAID TEMPLATES'+(live.length?'':' — form a group to launch')+'</div>';
    for(const r of RAIDS){ h+='<div class="lab" style="border-left:3px solid '+r.col+'"><div class="labtop"><span class="nm" style="color:'+r.col+'">'+esc(r.name)+'</span><span class="badge d-Hard">'+esc(r.rec)+'+</span></div>'+
      '<div class="labdesc">'+r.stages.map((s,i)=>(i+1)+'. '+esc(s)).join(" &nbsp; ")+'</div><div class="labfoot"><span class="meta">'+esc(r.size)+' · co-op</span><button class="launch" data-raid="'+r.id+'">◈ Form raid</button></div></div>'; }
    return h; }

  // ═══ R10 — PRESTIGE ═══
  const PRESTIGE_PERKS = ["+5% XP per prestige","Prestige-only cosmetic aura","Extra loadout slot","Reduced ability cooldowns","Access to Prestige contracts"];
  function renderPrestige(player){ const lvl=(player&&(player.level||0))||0, CAP=50; const pres=(player&&(player.prestige||0))||0;
    let h='<div class="labhdr">◈ PRESTIGE — at level '+CAP+', reset progression for a permanent meta-perk and a prestige rank. Mastery is a loop, not a ceiling.</div>';
    h+='<div style="text-align:center;margin:6px 0">'+ '<div class="stat"><div class="v">'+pres+'</div><div class="l">prestige</div></div>'+'<div class="stat"><div class="v">'+lvl+'/'+CAP+'</div><div class="l">level</div></div></div>';
    h+=bar((lvl/CAP)*100,"#ff6a6a");
    h+='<div class="qsec">PRESTIGE PERKS (permanent, stacking)</div>';
    PRESTIGE_PERKS.forEach((p,i)=>{ h+='<div class="row"><span class="nm">'+(i<pres?'✓ ':'○ ')+esc(p)+'</span><span class="meta">'+(i<pres?'unlocked':'prestige '+(i+1))+'</span></div>'; });
    if(lvl>=CAP) h+='<div class="lab"><div class="labfoot"><span class="meta">You\'ve hit the cap.</span><button class="launch" data-prestige="1">◈ Prestige now</button></div></div>';
    return h; }

  // ═══ R17/R18/R19 — MARKET · CRAFTING · COSMETICS ═══
  const COSMETICS = [
    { id:"trail_crimson", name:"Crimson Phoenix Trail", type:"trail", col:"#e11d2a" },
    { id:"trail_ice", name:"Azure ICE Trail", type:"trail", col:"#3b9dff" },
    { id:"title_ghost", name:'Title: "Ghost in the Weave"', type:"title", col:"#c3b6ff" },
    { id:"title_ripper", name:'Title: "Corp Ripper"', type:"title", col:"#ff7a1a" },
    { id:"aura_prestige", name:"Prestige Aura", type:"aura", col:"#f5c518" },
  ];
  const RECIPES = [
    { out:"Exploit Kit (Rare)", need:["3× Shellcode Fragment","1× 0-day Seed"] },
    { out:"Hardened Rig (Epic)", need:["2× Cooling Cell","1× Overclock Chip","500₡"] },
    { out:"Ghost Protocol (Legendary)", need:["1× Cloak Module","1× Trace Scrubber","3× Proxy Token"] },
  ];
  function loadCosmetic(){ try{ return JSON.parse(localStorage.getItem("grim_cos"))||{}; }catch(e){ return {}; } }
  function saveCosmetic(c){ try{ localStorage.setItem("grim_cos",JSON.stringify(c)); }catch(e){} }
  function itemName(s){ return (''+s).replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase()); }
  function renderMarket(inv, recipes, trades){ const credits=(inv&&(inv.credits??0))||0; const cos=loadCosmetic();
    const items=(inv&&inv.items)||[]; const owned={}; items.forEach(it=>{ owned[it.item_id||it.id]=(owned[it.item_id||it.id]||0)+(it.quantity||1); });
    let h='<div class="labhdr">◈ BLACK MARKET — <b style="color:var(--acc)">'+credits+'₡</b> · '+items.length+' items. Craft real tools from captured components; cosmetics are pure flex; trade with other operators.</div>';
    // ── real crafting (economy/craft/recipes) ──
    h+='<div class="qsec">CRAFTING — ToolForge</div>';
    const rec=Array.isArray(recipes)?recipes:[];
    h+= rec.length? rec.slice(0,40).map(r=>{ const ings=(r.ingredients||[]); const canMake=ings.every(i=>(owned[i.item_id]||0)>=i.quantity)&&credits>=(r.credit_cost||0);
      return '<div class="lab"><div class="labtop"><span class="nm">'+esc(itemName(r.output_item_id||r.id))+(r.output_quantity>1?' ×'+r.output_quantity:'')+'</span><span class="badge d-'+((r.required_level||1)>=8?"Hard":(r.required_level||1)>=5?"Medium":"Easy")+'">'+esc(r.station||"forge")+' · L'+(r.required_level||1)+'</span></div>'+
        (r.flavor_text?'<div class="labdesc" style="font-style:italic">'+esc(r.flavor_text)+'</div>':'')+
        '<div class="labfoot"><span class="meta">'+ings.map(i=>'<span style="color:'+((owned[i.item_id]||0)>=i.quantity?"#5fbf7f":"var(--dim)")+'">'+i.quantity+'× '+esc(itemName(i.item_id))+'</span>').join(" + ")+' · '+(r.credit_cost||0)+'₡ · '+(r.base_success_rate||100)+'%</span>'+
        '<button class="launch'+(canMake?'':' ')+'" data-craftid="'+esc(r.id)+'"'+(canMake?'':' style="opacity:.6"')+'>⚒ Craft</button></div></div>'; }).join("")
      : '<div class="huberr">crafting daemon returned no recipes</div>';
    // ── cosmetics (client-side flex, credit sink) ──
    h+='<div class="qsec">COSMETICS (credit sink)</div>';
    for(const c of COSMETICS){ const own=cos[c.id]; const eqp=cos.equipped&&cos.equipped[c.type]===c.id;
      h+='<div class="row" style="border-left:3px solid '+c.col+';padding-left:10px"><span class="nm" style="color:'+c.col+'">'+esc(c.name)+'</span><span class="meta">'+
        (own?('<button class="launch" data-cos="'+c.id+'" data-cty="'+c.type+'">'+(eqp?'✓ equipped':'equip')+'</button>'):('<button class="launch" data-buycos="'+c.id+'">buy · 750₡</button>'))+'</span></div>'; }
    // ── real player market (trade endpoint) ──
    h+='<div class="qsec">PLAYER MARKET — open trades</div>';
    const tl=(trades&&(trades.trades||trades.pending))||(Array.isArray(trades)?trades:[]);
    h+= tl.length? tl.slice(0,20).map(t=>{ const tid=t.id||t.trade_id;
      return '<div class="row"><span class="nm">'+esc(itemName(t.item_id||t.offer||t.id))+'</span><span class="meta">'+(t.price||t.credits||'')+'₡ · '+esc(t.status||t.seller||'')+(tid?' <button class="launch" data-tradeaccept="'+esc(tid)+'">accept</button>':'')+'</span></div>'; }).join("") : '<div class="huberr">No open trades. Peer-to-peer offers you receive surface here.</div>';
    return h; }

  // ═══ R13/R14 — ARENA LADDER + MENTORSHIP ═══
  const ARENA_TIERS = [["Bronze",0],["Silver",1000],["Gold",1500],["Platinum",2000],["Diamond",2500],["Netrunner",3000]];
  function renderArena(player, arena){ arena=arena||{}; const mmr=(player&&(player.arena_mmr||player.mmr))||1000;
    let tier=ARENA_TIERS[0]; for(const t of ARENA_TIERS) if(mmr>=t[1]) tier=t;
    let h='<div class="labhdr">◈ THE PIT — ranked PvP in the Combat Zone. Mode: '+esc(arena.mode||"standard")+(arena.season_id?' · season '+esc(arena.season_id):' · pre-season')+'. First to compromise the enemy core wins.</div>';
    h+='<div style="text-align:center;margin:6px 0"><div class="stat"><div class="v">'+esc(tier[0])+'</div><div class="l">your rank</div></div><div class="stat"><div class="v">'+mmr+'</div><div class="l">MMR</div></div></div>';
    h+='<div class="lab"><div class="labfoot"><span class="meta">MMR-matched duel · Combat Zone</span><button class="launch" data-queue="ranked_1v1">◈ Queue for ranked</button></div></div>';
    // real live ladder
    h+='<div class="qsec">LIVE LADDER</div>';
    const lad=arena.ladder||[];
    h+= lad.length? lad.slice(0,15).map((e,i)=>'<div class="row"><span class="nm">#'+(e.rank||i+1)+' '+esc(e.username||e.name||e.id)+'</span><span class="meta">'+(e.mmr||e.rating||'—')+' MMR · '+(e.wins||0)+'W/'+(e.losses||0)+'L</span></div>').join("")
       : '<div class="huberr">Ladder is empty — be the first to queue and seed the season.</div>';
    const rm=arena.recent_matches||[];
    if(rm.length){ h+='<div class="qsec">RECENT MATCHES</div>'+rm.slice(0,8).map(m=>'<div class="row"><span class="nm">'+esc(m.winner||m.result||"duel")+'</span><span class="meta">'+esc(m.mode||"")+' · '+esc((m.ended_at||"").toString().slice(0,10))+'</span></div>').join(""); }
    // tier ladder reference
    h+='<div class="qsec">RANK TIERS</div>';
    ARENA_TIERS.slice().reverse().forEach(t=>{ h+='<div class="row"><span class="nm"'+(t[0]===tier[0]?' style="color:var(--acc)"':'')+'>'+(t[0]===tier[0]?'▸ ':'')+esc(t[0])+'</span><span class="meta">'+t[1]+'+ MMR</span></div>'; });
    h+='<div class="qsec">MENTORSHIP</div><div class="lab"><div class="labtop"><span class="nm">Become a mentor / find one</span><span class="badge d-Easy">social</span></div><div class="labdesc">Veterans (Specialist+) pair with recruits for shared-XP guided runs. Both earn Mentor Rep — the Weave grows its own.</div><div class="labfoot"><span class="meta">Pairing board</span><button class="launch" data-mentor="1">◈ Join the roster</button></div></div>';
    return h; }

  // ═══ R22/R29 — SEASON CADENCE + BATTLE PASS ═══
  function renderSeason(prog, events){ const S=window.SEASON0||{meta:{title:"Season 0"}}; const tier=Math.min(30,(prog&&prog.season_tier)||(prog&&prog.objectives_completed)||0);
    let h='<div class="labhdr">◈ '+esc((S.meta&&S.meta.title)||"Season 0").toUpperCase()+' — '+esc((S.meta&&S.meta.theme)||"")+'. Seasons run ~8 weeks: story acts, a reward track, and a leaderboard reset.</div>';
    // real live seasonal events (battle-pass + CTF backend)
    const evs=(events&&events.events)||(Array.isArray(events)?events:[]);
    if(evs.length){ h+='<div class="qsec">LIVE EVENTS</div>';
      h+= evs.slice(0,10).map(e=>'<div class="lab"><div class="labtop"><span class="nm">'+esc(e.name||e.title||e.id)+'</span><span class="badge d-Medium">'+esc(e.event_type||e.type||"event")+'</span></div>'+
        (e.description?'<div class="labdesc">'+esc((''+e.description).slice(0,120))+'</div>':'')+
        '<div class="labfoot"><span class="meta">'+esc((e.ends_at||e.end_time||"").toString().slice(0,10))+(e.pass_tier!=null?' · pass tier '+e.pass_tier:'')+'</span><button class="launch" data-eventjoin="'+esc(e.id)+'">◈ Join event</button></div></div>').join(""); }
    else { h+='<div class="huberr" style="margin-bottom:4px">No live seasonal event right now — the Season 0 narrative arc runs in-world (find NEXUS). Reward-track preview below.</div>'; }
    h+='<div class="qsec">SEASON PROGRESS</div>'+bar((tier/30)*100,"#f5c518")+'<div class="meta" style="text-align:center">Tier '+tier+' / 30</div>';
    h+='<div class="qsec">REWARD TRACK</div>';
    const REW=[[1,"Recruit sigil"],[5,"Credit cache"],[10,"Rare loot crate"],[15,"Season cosmetic trail"],[20,"Epic gear token"],[25,"Prestige aura"],[30,"Legendary title: Season 0 Veteran"]];
    REW.forEach(([t,r])=>{ h+='<div class="row"><span class="nm">'+(tier>=t?'✓ ':'○ ')+esc(r)+'</span><span class="meta">tier '+t+'</span></div>'; });
    h+='<div class="qsec">ARC CADENCE</div>';
    ["Act 1 · The Spark","Act 2 · First Steps","Act 3 · The Network Reveals","Act 4 · Deeper In","Act 5 · The Weight"].forEach((a,i)=>{ h+='<div class="row"><span class="nm">'+esc(a)+'</span><span class="meta">week '+(i*1.6+1|0)+'+</span></div>'; });
    return h; }

  // ═══ R15/R20 — FACTIONS (deep lore) · GUILDS · COMMS FORUM ═══
  const FCOL={DarkArmy:"#ff3b3b",AzureWatch:"#3b9dff",GraySyndicate:"#c9a227"};
  function renderFactions(factions, guilds, forum){ const fx=Array.isArray(factions)?factions:[];
    let h='<div class="labhdr">◈ THE THREE POWERS — the ideologies that rule The Weave. Your standing with each opens contracts, districts, and endings.</div>';
    for(const f of fx){ const col=FCOL[f.id]||"#8fb0c0";
      h+='<div class="lab" style="border-left:3px solid '+col+'"><div class="labtop"><span class="nm" style="color:'+col+'">'+esc(f.name||f.id)+'</span><span class="badge d-Medium">'+esc(f.leader_codename||"")+'</span></div>'+
        (f.tagline?'<div class="labdesc" style="font-style:italic;color:'+col+'">"'+esc(f.tagline)+'"</div>':'')+
        (f.philosophy?'<div class="labdesc">'+esc(f.philosophy)+'</div>':'')+
        '<div class="labfoot"><span class="meta">HQ: '+esc(f.headquarters||"—")+' · '+esc(f.specialty||"")+'</span></div></div>'; }
    if(!fx.length) h+='<div class="huberr">faction registry unavailable</div>';
    h+='<div class="qsec">GUILDS — rally a crew</div>';
    const gl=(guilds&&guilds.guilds)||(Array.isArray(guilds)?guilds:[]);
    h+= gl.length? gl.slice(0,20).map(g=>'<div class="row"><span class="nm">'+esc(g.name||g.id)+'</span><span class="meta">'+((g.member_count||g.members||0))+' members'+(g.faction?' · '+esc(g.faction):'')+'</span></div>').join("")
       : '<div class="huberr">No guilds yet — found one and lead your own crew.</div>';
    h+='<div class="lab"><div class="labfoot"><span class="meta">Start a guild</span><button class="launch" data-guild="new">◈ Found a guild</button></div></div>';
    h+='<div class="qsec">COMMS — FORUM & JOB BOARD</div>';
    const th=(forum&&forum.threads)||(Array.isArray(forum)?forum:[]);
    h+= th.length? th.slice(0,20).map(t=>'<div class="row"><span class="nm">'+esc(t.title||t.id)+'</span><span class="meta">'+((t.reply_count||t.replies||0))+' replies · '+esc(t.author||t.category||"")+'</span></div>').join("")
       : '<div class="huberr">Comms are quiet — post a contract, recruit a crew, or share a war story.</div>';
    return h; }

  return { CLASSES, renderClasses, renderCurriculum, renderCerts, certsFor, renderCTF, renderRuns, renderRaids,
           renderPrestige, renderMarket, renderArena, renderSeason, renderFactions, loadCosmetic, saveCosmetic, COSMETICS };
})();
