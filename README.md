# 🐼 PandaToolkit

Raccolta di mini siti statici, uno per cartella, con una home che li elenca.

```
index.html        home, legge tools.json
tools.json        elenco degli strumenti
<slug>/index.html un tool, autocontenuto
```

## Aggiungere un tool

1. Crea `<slug>/index.html` (HTML autocontenuto, percorsi relativi).
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
