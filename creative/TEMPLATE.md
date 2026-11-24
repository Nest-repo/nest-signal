# Il template del cliente — contratto

Ogni cliente ha il **suo** template, costruito in onboarding dalle sue reference (immagini, PDF, file Figma, il sito). Il generatore (`bin/post_creative.py`) lo riempie a ogni post. La cornice di esempio del kit non si usa per i clienti: le creatività sarebbero tutte uguali.

Due file in `DATA/creative/`:

## 1. `tokens.json` — il linguaggio visivo

```json
{
  "nome": "<nome dello stile, es. Editoriale caldo>",
  "colori": {
    "sfondo": "#…", "testo": "#…", "accento": "#…",
    "testo_secondario": "#…", "linee": "#…", "superficie": "#…", "superficie_2": "#…", "inattivo": "#…", "etichette": "#…"
  },
  "font": { "titoli": "<Google Font>", "testo": "<Google Font>", "etichette": "<Google Font mono o sans>" },
  "google_fonts_url": "https://fonts.googleapis.com/css2?family=…&display=swap",
  "area": { "left": 72, "right": 1008, "top": 300, "bottom": 880 },
  "area_senza_chiusura": { "left": 72, "right": 1008, "top": 330, "bottom": 1130 },
  "logo": "<percorso del logo caricato, facoltativo>",
  "note": "<3-5 righe: da quali reference viene ogni scelta>"
}
```
- `area` = dove il generatore disegna l'infografica (coordinate in px su 1080×1350). Deve stare tra titolo e chiusura/firma del template, larghezza minima 760 px, altezza minima 540 px.
- I colori devono avere contrasto leggibile (testo su sfondo ≥ 4,5:1). L'accento si usa solo per il punto del post.

## 2. `template.html` — la cornice

Una pagina HTML completa, 1080×1350, con l'elemento radice `<div id="c" style="position:relative;width:1080px;height:1350px;overflow:hidden;…">` e questi segnaposto:

| Segnaposto | Cosa diventa |
|---|---|
| `{{KICKER}}` | etichetta sopra il titolo (2-4 parole per parte) |
| `{{TITOLO}}` · `{{TITOLO_ACCENTO}}` | l'hook diviso in due: situazione · svolta (la seconda col colore d'accento) |
| `{{INFOGRAFICA}}` | va dentro un `<div style="position:absolute;left:0;top:0;width:1080px;height:1350px">` (il generatore la posiziona nell'`area`) |
| `{{CHIUSURA}}` · `{{CHIUSURA_ACCENTO}}` | frase finale facoltativa: mettila in un elemento con classe `solo-chiusura` (sparisce se il post non la usa) |
| `{{NOME}}` · `{{RUOLO}}` · `{{AVATAR}}` | firma dell'autore (`{{AVATAR}}` è un'immagine data-URI da mettere in `src`) |
| `{{LOGO}}` | logo (data-URI), facoltativo |
| `{{CTA}}` | invito finale (default "Salva per dopo") |

Regole:
- Titoli che devono stare su una riga: avvolgi le due righe in un elemento con classe `fit` (il generatore riduce la dimensione finché entrano).
- Niente JavaScript oltre a quello che inietta il generatore; niente immagini esterne (solo data-URI o i segnaposto).
- Font solo da Google Fonts (`google_fonts_url`).
- Gli elementi decorativi (forme, linee, texture piatte, blocchi di colore) nascono dalle reference: è lì che il template diventa del cliente.
