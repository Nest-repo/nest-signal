# Modulo — Creatività

Leggi prima `KIT/modules/_common.md` (se non l'hai già fatto), poi `KIT/creative/GRAFICI.md` (regole e campi delle infografiche) e `KIT/creative/TEMPLATE.md`.

**Template del cliente obbligatorio.** Se non esistono `DATA/creative/template.html` e `DATA/creative/tokens.json`, oppure `CONFIG.creative.approved` è `false`: non generare nulla, aggiungi al diario `{"tipo":"suggerimento","titolo":"Crea il tuo template creatività dal pannello (Impostazioni)"}` e fermati. Non usare mai la cornice di esempio del kit per un cliente.

Per ogni bozza del Piano Editoriale senza immagine crea una creatività col **template del cliente** (la sua cornice, i suoi colori e font), infografica scelta in base all'intento del post. **Visuale, non testuale**: il testo è già nel post. Non pubblica nulla e non tocca il testo dei post.

## Step 1 — Cosa fare

In `DATA/posts/` prendi i post con stato Bozza / In revisione / Da pubblicare, **senza immagine** (`creativita` vuoto), con data di pubblicazione tra oggi e oggi+14 giorni, dalla più vicina. **Max 6 per run.** Salta le righe con data passata o vuota.

## Step 2 — Per ogni post

1. Leggi il testo del post dalla pagina. **Intento in una frase**: cosa deve capire chi scorre il feed?
2. Scegli il tipo di infografica con la tabella di `GRAFICI.md` (timeline, barre, prima_dopo, passi, flusso, numero). Etichette di 1-2 parole, icone, max ~15 parole nell'infografica. Numeri solo se sono nel post; mai nomi di clienti.
3. Scrivi lo spec JSON in `DATA/creative/<YYYY-MM-DD>-<slug>/spec.json` (campi in `GRAFICI.md`): `kicker`, `titolo` + `titolo_arancio` (l'hook diviso in due), `grafico`; `chiusura` solo se aggiunge qualcosa che l'immagine non dice.
4. Genera: `python3 KIT/creative/bin/post_creative.py --spec <spec> --out <cartella> --config CONFIG --template DATA/creative/template.html --tokens DATA/creative/tokens.json` → `creativita.png` (2160×2700).
5. **Guarda il PNG** (obbligatorio): coprendo il titolo, l'infografica da sola fa capire il post? Si legge da telefono? Niente testo tagliato o linee sopra le etichette? Se no, correggi lo spec e rigenera (max 3 tentativi).
6. Scrivi nel post `creativita` = percorso assoluto del PNG e `layout` = tipo di infografica. Se c'è Notion collegato, carica l'immagine anche nella colonna Creatività della riga corrispondente (se il connettore non sa caricare file, salta).
7. Diario: `{"tipo":"creatività","titolo":"<hook>","link":"#/piano/<id>","immagine":"<percorso del PNG>"}`.

Se Python 3 o Playwright mancano, fermati e scrivi nel log cosa installare (`pip3 install playwright && python3 -m playwright install chromium`, oppure `npm install playwright` nel kit).
