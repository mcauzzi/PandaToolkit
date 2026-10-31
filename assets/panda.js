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

  // DEF con sopra i valori di src, che può arrivare da un link di chiunque: si tengono solo
  // le chiavi di DEF e solo valori dello stesso tipo, il resto torna al default. Gli array
  // seguono il primo elemento di DEF come modello. strict (link condivisi) scarta anche le
  // stringhe con caratteri HTML, così niente di quello che arriva da fuori può finire come
  // markup negli innerHTML dei tool.
  const BAD = new Set(["__proto__", "constructor", "prototype"]);
  const NUMSTR = /^[-+]?\d*[.,]?\d*(e[-+]?\d+)?$/i;
  function value(def, src, strict){
    const t = typeof def;
    if(t === "number"){
      if(typeof src === "number") return isFinite(src) ? src : def;
      // i campi dei form a volte salvano il numero come stringa
      return typeof src === "string" && src.length < 32 && NUMSTR.test(src) ? src : def;
    }
    if(t === "string"){
      if(typeof src === "number" && isFinite(src)) return String(src);
      if(typeof src !== "string" || src.length > 4000) return def;
      return strict && /[<>"'`&]/.test(src) ? def : src;
    }
    if(t === "boolean") return typeof src === "boolean" ? src : def;
    return def;
  }
  function merge(def, src, strict){
    if(src === undefined) return structuredClone(def);
    if(Array.isArray(def)){
      if(!Array.isArray(src)) return structuredClone(def);
      const tpl = def[0];
      return src.slice(0, 64).flatMap(item => {
        if(tpl === undefined) return ["string", "number"].includes(typeof item) ? [value(typeof item === "number" ? 0 : "", item, strict)] : [];
        if(isObj(tpl)) return isObj(item) ? [merge(tpl, item, strict)] : [];
        const v = value(tpl, item, strict);
        return typeof v === typeof tpl && v === item ? [v] : [];
      });
    }
    if(isObj(def)){
      if(!isObj(src)) return structuredClone(def);
      const out = structuredClone(def);
      for(const k of Object.keys(src)) if(!BAD.has(k) && Object.hasOwn(def, k)) out[k] = merge(def[k], src[k], strict);
      return out;
    }
    return def === null ? def : value(def, src, strict);
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
    if(shared) return merge(def, shared, true);
    try{ return merge(def, JSON.parse(localStorage.getItem(key) || "{}")); }catch(e){ return structuredClone(def); }
  };
  Panda.save = function(key, state){
    if(Panda.shared) return;
    try{ localStorage.setItem(key, JSON.stringify(state)); }catch(e){}
  };
  Panda.link = function(state, def){
    const d = diff(state, def) || {};
    // href e non origin+pathname: da file:// origin vale "null"
    return location.href.split("#")[0] + "#s=" + b64.enc(JSON.stringify(d));
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
      let timer;
      const say = t => { msg.textContent = t; clearTimeout(timer); timer = setTimeout(() => msg.textContent = "", 4000); };
      btn.addEventListener("click", async () => {
        const url = Panda.link(get(), def);
        if(navigator.share && matchMedia("(pointer:coarse)").matches){
          try{ await navigator.share({ title: document.title, url }); return; }catch(e){ if(e.name === "AbortError") return; }
        }
        try{ await navigator.clipboard.writeText(url); say("Link copiato: chi lo apre vede questo stato."); }
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

  // Link condiviso incollato nella stessa scheda, o Indietro da un link condiviso: ricarica,
  // così stato e vista condivisa seguono sempre l'URL
  addEventListener("hashchange", () => { if(/[#&]s=/.test(location.hash) || Panda.shared) location.reload(); });

  window.Panda = Panda;
})();
