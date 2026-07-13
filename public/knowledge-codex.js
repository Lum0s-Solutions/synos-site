// GRIMOIRE Field Codex - self-contained, additive, guarded overlay.
// Surfaces the sanitized defensive-security knowledge nodes (window.KNOWLEDGE),
// grouped by city district, findable in-game. Never touches the game engine;
// if anything is missing it silently no-ops. Trigger: [ CODEX ] button or K.
(function(){
  "use strict";
  function ready(fn){ if(document.readyState!=="loading") fn(); else document.addEventListener("DOMContentLoaded",fn); }
  function esc(s){ return String(s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];}); }
  function md(t){
    var f=[]; t=t.replace(/```[\s\S]*?```/g,function(m){ f.push(m.slice(3,-3)); return "@@F"+(f.length-1)+"F@@"; });
    var h=esc(t);
    h=h.replace(/^#{1,6}\s+(.*)$/gm,"<h4>$1</h4>");
    h=h.replace(/^\s*[-*]\s+(.*)$/gm,"<li>$1</li>").replace(/(<li>[\s\S]*?<\/li>)/g,"<ul>$1</ul>");
    h=h.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g,"<i>$2</i>").replace(/\[\[([^\]]+)\]\]/g,"<i>$1</i>");
    h=h.replace(/\[([^\]]+)\]\(([^)]+)\)/g,"<a href='$2' target='_blank' rel='noopener'>$1</a>");
    h=h.replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>").replace(/`([^`]+)`/g,"<code>$1</code>");
    h=h.replace(/@@F(\d+)F@@/g,function(m,i){ return "<pre>"+esc(f[+i])+"</pre>"; });
    h=h.split(/\n{2,}/).map(function(p){ return /^\s*<(h4|ul|pre)/.test(p)?p:"<p>"+p.replace(/\n/g,"<br>")+"</p>"; }).join("");
    return h;
  }
  function myDistrict(){
    try{
      if(typeof players!=="undefined" && typeof me!=="undefined" && typeof districtAt==="function"){
        var p=players.get(me); if(p){ var d=districtAt(p.rx||0,p.rz||0); return d?d.id:null; }
      }
    }catch(e){}
    return null;
  }
  ready(function(){
    try{
      if(!window.KNOWLEDGE || !window.KNOWLEDGE.length) return;
      var byDist={}, distName={};
      window.KNOWLEDGE.forEach(function(k){ (byDist[k.district]=byDist[k.district]||[]).push(k); distName[k.district]=k.districtName||k.district; });
      var css=document.createElement("style");
      css.textContent=
        ".kc-btn{position:fixed;right:14px;bottom:14px;z-index:9998;background:rgba(10,12,16,.9);border:1px solid #39d0c8;color:#39d0c8;font:12px monospace;letter-spacing:1px;padding:8px 12px;border-radius:5px;cursor:pointer}.kc-btn:hover{background:rgba(57,208,200,.15)}"+
        "#kc-panel{position:fixed;top:0;right:0;width:min(460px,94vw);height:100%;z-index:9999;display:none;background:linear-gradient(180deg,#0b1016,#070a0d);border-left:2px solid #39d0c8;box-shadow:-10px 0 34px rgba(0,0,0,.6);overflow-y:auto;font-family:monospace;color:#cfe}"+
        "#kc-panel .kc-h{padding:16px 18px;border-bottom:1px solid #14323a;display:flex;justify-content:space-between;align-items:center}"+
        "#kc-panel .kc-h b{color:#39d0c8;letter-spacing:2px}#kc-panel .kc-x{cursor:pointer;color:#7aa;border:1px solid #244;padding:2px 9px;border-radius:4px}"+
        "#kc-panel .kc-dist{margin:14px 18px 4px;color:#8fd;font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.8}"+
        "#kc-panel .kc-dist.here{color:#39d0c8;opacity:1}#kc-panel .kc-dist.here:after{content:' - here';font-size:10px;opacity:.6}"+
        "#kc-panel .kc-row{margin:3px 14px;padding:8px 12px;border:1px solid #16303a;border-radius:5px;cursor:pointer;font-size:13px}"+
        "#kc-panel .kc-row:hover{background:rgba(57,208,200,.1);border-color:#39d0c8}#kc-panel .kc-row .kc-badge{float:right;font-size:10px;opacity:.5}"+
        "#kc-read{padding:6px 20px 60px;line-height:1.6;font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;display:none}"+
        "#kc-read h3{color:#39d0c8}#kc-read h4{color:#8fe;margin:14px 0 6px}#kc-read code{background:#122;padding:1px 5px;border-radius:3px}#kc-read pre{background:#0a0f12;border:1px solid #1a3a40;padding:10px;overflow-x:auto;border-radius:5px}"+
        "#kc-read a{color:#39d0c8}.kc-back{margin:12px 0;display:inline-block;color:#39d0c8;border:1px solid #39d0c8;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px}";
      document.head.appendChild(css);
      var btn=document.createElement("div"); btn.className="kc-btn"; btn.textContent="[ CODEX ]";
      btn.title="Field manuals - defensive security knowledge (K)"; document.body.appendChild(btn);
      var panel=document.createElement("div"); panel.id="kc-panel";
      panel.innerHTML="<div class='kc-h'><b>FIELD CODEX</b><span class='kc-x'>close</span></div><div id='kc-list'></div><div id='kc-read'></div>";
      document.body.appendChild(panel);
      var listEl=panel.querySelector("#kc-list"), readEl=panel.querySelector("#kc-read");
      function renderList(){
        readEl.style.display="none"; listEl.style.display="block";
        var here=myDistrict();
        var order=Object.keys(byDist).sort(function(a,b){ if(a===here)return -1; if(b===here)return 1; return distName[a].localeCompare(distName[b]); });
        var html=""; order.forEach(function(did){
          html+="<div class='kc-dist"+(did===here?" here":"")+"'>"+esc(distName[did])+"</div>";
          byDist[did].forEach(function(k){ html+="<div class='kc-row' data-file='"+esc(k.file)+"' data-title='"+esc(k.title)+"'>"+esc(k.title)+"<span class='kc-badge'>"+esc(k.type)+"</span></div>"; });
        });
        listEl.innerHTML=html;
        Array.prototype.forEach.call(listEl.querySelectorAll(".kc-row"),function(row){
          row.addEventListener("click",function(){ openNode(row.getAttribute("data-file"),row.getAttribute("data-title")); });
        });
      }
      function backBtn(){ var b=readEl.querySelector(".kc-back"); if(b) b.addEventListener("click",renderList); }
      function openNode(file,title){
        listEl.style.display="none"; readEl.style.display="block";
        readEl.innerHTML="<span class='kc-back'>&lt; back</span><p>loading...</p>"; backBtn();
        fetch("/"+file).then(function(r){return r.text();}).then(function(t){
          readEl.innerHTML="<span class='kc-back'>&lt; back</span><h3>"+esc(title)+"</h3>"+md(t); backBtn();
        }).catch(function(){ readEl.innerHTML="<span class='kc-back'>&lt; back</span><p>could not load.</p>"; backBtn(); });
      }
      function toggle(open){ var show=(open===undefined)?panel.style.display!=="block":open; panel.style.display=show?"block":"none"; if(show) renderList(); }
      btn.addEventListener("click",function(){toggle();});
      panel.querySelector(".kc-x").addEventListener("click",function(){toggle(false);});
      document.addEventListener("keydown",function(e){
        var tag=(e.target&&e.target.tagName)||""; if(tag==="INPUT"||tag==="TEXTAREA") return;
        if(e.key==="k"||e.key==="K") toggle();
        else if(e.key==="Escape"&&panel.style.display==="block") toggle(false);
      });
      var announced={};
      setInterval(function(){ try{
        var d=myDistrict(); if(!d||announced[d]||!byDist[d]) return; announced[d]=1;
        if(typeof wlog==="function") wlog(">> field-manual cache in "+distName[d]+" - press K for the Codex");
      }catch(e){} },4000);
    }catch(e){}
  });
})();
