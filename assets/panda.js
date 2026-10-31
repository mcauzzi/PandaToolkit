/* PandaToolkit: stato dei tool e link di condivisione.
   Uso in un tool, al posto del try/localStorage a mano:
     let S = Panda.load("chiave-v1", DEF);         // stato salvato, o quello del link condiviso
     function save(){ Panda.save("chiave-v1", S); }
     Panda.share(() => S, DEF);                    // pulsante "Condividi" nell'header
   Il link porta solo le differenze dai default, in base64url dopo #s=. Il fragment non arriva
   mai al server: niente log, niente backend. Aperto da un link, il tool è in "vista condivisa":
   non salva sul dispositivo e nasconde il link alla home. */
(function(){
  "use strict";
  const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);

  // DEF con sopra i valori di src, ricorsivo sugli oggetti; gli array si sostituiscono interi
  function merge(def, src){
    if(!isObj(def) || !isObj(src)) return src === undefined ? structuredClone(def) : structuredClone(src);
    const out = structuredClone(def);
    for(const k of Object.keys(src)) out[k] = (k in def) ? merge(def[k], src[k]) : structuredClone(src[k]);
    return out;
  }
  // solo le chiavi che differiscono da def; undefined se uguale
  function diff(val, def){
    if(isObj(val) && isObj(def)){
      const out = {};
      for(const k of Object.keys(val)){ const d = diff(val[k], def[k]); if(d !== undefined) out[k] = d; }
      return Object.keys(out).length ? out : undefined;
    }
    return JSON.stringify(val) === JSON.stringify(def) ? undefined : val;
  }

  const b64 = {
    enc(str){ let bin = ""; for(const b of new TextEncoder().encode(str)) bin += String.fromCharCode(b);
      return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); },
    dec(s){ const bin = atob(s.replace(/-/g,"+").replace(/_/g,"/"));
      return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))); }
  };

  function fromHash(){
    const m = location.hash.match(/[#&]s=([A-Za-z0-9_-]*)/);
    if(!m) return null;
    try{ const v = JSON.parse(b64.dec(m[1]) || "{}"); return isObj(v) ? v : null; }catch(e){ return null; }
  }

  const shared = fromHash();
  const Panda = { shared: !!shared, merge, diff };

  Panda.load = function(key, def){
    if(shared) return merge(def, shared);
    try{ return merge(def, JSON.parse(localStorage.getItem(key) || "{}")); }catch(e){ return structuredClone(def); }
  };
  Panda.save = function(key, state){
    if(Panda.shared) return;
    try{ localStorage.setItem(key, JSON.stringify(state)); }catch(e){}
  };
  Panda.link = function(state, def){
    const d = diff(state, def) || {};
    return location.origin + location.pathname + "#s=" + b64.enc(JSON.stringify(d));
  };

  // Pulsante "Condividi" in fondo all'header, più l'avviso in vista condivisa
  Panda.share = function(get, def, key){
    const ready = fn => document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn();
    ready(() => {
      const header = document.querySelector("header");
      if(!header) return;
      const row = document.createElement("div");
      row.className = "sharebar";
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "btn"; btn.textContent = "Condividi";
      const msg = document.createElement("span");
      msg.className = "hint"; msg.setAttribute("role", "status");
      btn.addEventListener("click", async () => {
        const url = Panda.link(get(), def);
        if(navigator.share && matchMedia("(pointer:coarse)").matches){
          try{ await navigator.share({ title: document.title, url }); return; }catch(e){ if(e.name === "AbortError") return; }
        }
        try{ await navigator.clipboard.writeText(url); msg.textContent = "Link copiato: chi lo apre vede questo stato."; }
        catch(e){ prompt("Copia il link:", url); }
      });
      row.append(btn, msg);
      header.append(row);

      if(!Panda.shared) return;
      document.querySelectorAll(".back").forEach(a => a.hidden = true);
      const note = document.createElement("div");
      note.className = "sharenote";
      note.innerHTML = "<span>Vista condivisa: puoi cambiare i valori, ma non vengono salvati su questo dispositivo.</span>";
      if(key){
        const keep = document.createElement("button");
        keep.type = "button"; keep.className = "btn"; keep.textContent = "Tieni questi valori";
        keep.addEventListener("click", () => {
          Panda.shared = false;
          Panda.save(key, get());
          history.replaceState(null, "", location.pathname + location.search);
          note.remove();
          document.querySelectorAll(".back").forEach(a => a.hidden = false);
        });
        note.append(keep);
      }
      header.before(note);
    });
  };

  // Un altro link condiviso incollato nella stessa scheda: ricarica con il nuovo stato
  addEventListener("hashchange", () => { if(/[#&]s=/.test(location.hash)) location.reload(); });

  window.Panda = Panda;
})();
