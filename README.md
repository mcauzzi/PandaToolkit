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

Cloudflare Pages: collega il repo, framework preset **None**, build command vuoto, output directory `/`.
Funziona uguale anche con GitHub Pages (c'è `.nojekyll`).
