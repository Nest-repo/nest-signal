# Modulo — Creatività

Leggi prima `KIT/modules/_common.md` (se non l'hai già fatto), poi `KIT/creative/GRAFICI.md` (regole e campi delle infografiche).

Per ogni bozza del Piano Editoriale senza immagine crea una creatività col template di Nest Signal: cornice fissa (etichetta, titolo su due righe, infografica, firma dell'autore), infografica scelta in base all'intento del post. **Visuale, non testuale**: il testo è già nel post. Non pubblica nulla e non tocca il testo dei post.

## Step 1 — Cosa fare

Nel Piano Editoriale (`notion.editorial_db`) prendi le righe con stato Bozza / In revisione / Da pubblicare, **senza immagine** (colonna Creatività vuota), con data di pubblicazione tra oggi e oggi+14 giorni, dalla più vicina. **Max 6 per run.** Salta le righe con data passata o vuota.

## Step 2 — Per ogni post

1. Leggi il testo del post dalla pagina. **Intento in una frase**: cosa deve capire chi scorre il feed?
2. Scegli il tipo di infografica con la tabella di `GRAFICI.md` (timeline, barre, prima_dopo, passi, flusso, numero). Etichette di 1-2 parole, icone, max ~15 parole nell'infografica. Numeri solo se sono nel post; mai nomi di clienti.
3. Scrivi lo spec JSON in `DATA/creative/<YYYY-MM-DD>-<slug>/spec.json` (campi in `GRAFICI.md`): `kicker`, `titolo` + `titolo_arancio` (l'hook diviso in due), `grafico`; `chiusura` solo se aggiunge qualcosa che l'immagine non dice.
4. Genera: `python3 KIT/creative/bin/post_creative.py --spec <spec> --out <cartella> --config CONFIG` → `creativita.png` (2160×2700, con foto, nome e colori del cliente).
5. **Guarda il PNG** (obbligatorio): coprendo il titolo, l'infografica da sola fa capire il post? Si legge da telefono? Niente testo tagliato o linee sopra le etichette? Se no, correggi lo spec e rigenera (max 3 tentativi).
6. Allega l'immagine alla riga del Piano Editoriale, colonna Creatività, col caricamento file del connettore Notion. Se il tuo connettore non sa caricare file, lascia l'immagine dov'è e scrivi nel corpo della pagina una riga «🎨 Creatività pronta: apri il pannello di Nest Signal».
7. Diario: `{"tipo":"creatività","titolo":"<hook>","link":"<pagina Notion>","immagine":"<percorso del PNG>"}`.

Se Python 3 o Playwright mancano, fermati e scrivi nel log cosa installare (`pip3 install playwright && python3 -m playwright install chromium`, oppure `npm install playwright` nel kit).
