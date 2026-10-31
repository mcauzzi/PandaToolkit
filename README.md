# 🐼 PandaToolkit

Raccolta di mini siti statici, uno per cartella, con una home che li elenca.

```
index.html        home, legge tools.json
tools.json        elenco degli strumenti
assets/panda.css  stile condiviso: colori, font, tema chiaro/scuro, controlli comuni
<slug>/index.html un tool, autocontenuto
```

## Aggiungere un tool

1. Crea `<slug>/index.html` (HTML autocontenuto, percorsi relativi) e includi lo stile comune:
   ```html
   <link rel="stylesheet" href="../assets/panda.css">
   ```
   Nel `<style>` della pagina metti solo il layout specifico del tool. Dentro `panda.css` trovi già
   `.wrap`, `.back` (link alla home), `.card`, `.fields`/`.field`/`.inp` per i campi con unità, `.chip`,
   `.seg`, `.btn`, `.hint`, `.label`, `.warn`, `.tag` e le tabelle (`class="n"` per le colonne numeriche).
   Per cambiare colori o font di tutto il sito si tocca solo quel file.
2. Aggiungi una voce in `tools.json`:
   ```json
   { "slug": "<slug>", "name": "Nome", "description": "Cosa fa", "tags": ["..."], "emoji": "🔧" }
   ```
3. Push. Il deploy parte da solo.

## Provarlo in locale

La home usa `fetch`, quindi serve un server:

```sh
python3 -m http.server 8000
```

## Deploy

A ogni push su `main` la workflow `deploy.yml` valida `tools.json` (ogni `slug` deve avere la sua cartella con `index.html`), poi builda un'immagine `nginx:stable-alpine` con dentro il sito e la pubblica come `ghcr.io/mcauzzi/pandatoolkit:latest` (più il tag con lo SHA).

Sul server gira come stack Komodo da `deploy/compose.yml`: container read-only, porta host `PORT` (default `8090`), davanti un reverse proxy con HTTPS. Komodo aggiorna il container quando esce l'immagine nuova.

In alternativa funziona anche come sito statico su Cloudflare Pages (preset **None**, build command vuoto, output `/`) o GitHub Pages (c'è `.nojekyll`).

## Dietro login (Authelia)

Il sito non ha login suo: lo protegge Authelia tramite forward auth del reverse proxy, come gli altri servizi interni. Il container resta com'è, servono due modifiche fuori da questo repo.

1. **Authelia** (config in `homelab-stack`): una regola per l'host, prima di eventuali regole generiche. Poi riavvia il container `authelia`, perché la config montata come file singolo non viene riletta al Deploy.
   ```yaml
   access_control:
     rules:
       - domain: pandatoolkit.<dominio>
         policy: two_factor
   ```
2. **Caddy su OPNsense**: nuovo dominio `pandatoolkit.<dominio>` con upstream `<NAS>:8090` e forward auth attiva, come per `home.<dominio>`. Il certificato è già coperto dal wildcard.

Facoltativo: aggiungere `https://pandatoolkit.<dominio>/` ai target blackbox per il monitoraggio.
