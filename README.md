# 🐼 PandaToolkit

Raccolta di mini siti statici, uno per cartella, con una home che li elenca.

```
index.html        home, legge tools.json
tools.json        elenco degli strumenti
assets/panda.css  stile condiviso: colori, font, tema chiaro/scuro, controlli comuni
assets/panda.js   stato salvato nel browser e link di condivisione
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

   Se il tool ha uno stato da ricordare o da condividere, includi anche `../assets/panda.js` e tieni lo stato in un oggetto:
   ```js
   let S = Panda.load("<slug>-v1", DEF);      // salvato nel browser, o quello di un link condiviso
   Panda.share(() => S, DEF, "<slug>-v1");    // pulsante "Condividi" nell'header
   function save(){ Panda.save("<slug>-v1", S); }
   ```
   Il link porta solo le differenze da `DEF`, dopo `#s=`: il fragment non arriva al server. Chi apre il link vede la "vista condivisa": niente link alla home e niente salvataggio finché non sceglie di tenere i valori.
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

Sul server gira come stack Komodo da `deploy/compose.yml`: container read-only, porta host `PORT` (default `8092`), davanti un reverse proxy con HTTPS. Komodo aggiorna il container quando esce l'immagine nuova.

In alternativa funziona anche come sito statico su Cloudflare Pages (preset **None**, build command vuoto, output `/`) o GitHub Pages (c'è `.nojekyll`).
