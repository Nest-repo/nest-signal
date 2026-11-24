# Setup — Il template delle creatività del cliente

Obiettivo: creare il **template del cliente** (`DATA/creative/tokens.json` + `DATA/creative/template.html`) partendo dalle **sue** reference, seguendo il contratto in `KIT/creative/TEMPLATE.md`. Le creatività devono sembrare sue, non di un kit.

**Vietato partire dalla cornice di esempio del kit** (crema/nero/arancio, etichetta mono con quadratino, titolo sottile su due righe con seconda riga arancio, firma con «SALVA PER DOPO»). Puoi riusare solo il motore delle infografiche. Se le reference del cliente somigliano per caso a quella cornice, va bene, ma ogni scelta deve venire dalle sue reference.

## Step 1 — Leggi le reference

In ordine:
1. **File caricati** in `DATA/creative/references/` (immagini: guardale una per una; PDF: leggine le pagine). Sono post che gli piacciono, la sua brand identity, vecchie grafiche, screenshot.
2. **Figma** se `CONFIG.creative.figma_url` c'è: se hai il connettore Figma, prendi screenshot e contesto di design (colori, font, componenti) del file o del frame indicato. Se non ce l'hai, scrivilo in `dubbi` e prosegui con il resto.
3. **Note del cliente** in `CONFIG.creative.notes` (cosa gli piace, cosa evitare) e `CONFIG.creative.feedback` (commenti sulle anteprime precedenti: **vincono su tutto**).
4. **Sito** `CONFIG.owner.website`: aprilo e guarda colori, font, logo, stile (solo se le reference sono poche).
5. Se c'è un logo tra i file, usa quello (`tokens.logo` = percorso del file).

## Step 2 — Decidi il linguaggio visivo

Scrivi per te, in 6 righe: palette (con i codici presi dalle reference), font (il Google Font più vicino a quello delle reference), gerarchia del titolo, densità (quanto spazio vuoto), segno grafico (linee sottili/spesse, angoli tondi/vivi, forme, blocchi di colore), dove sta la firma. Ogni scelta cita la reference da cui viene.

## Step 3 — Scrivi i due file

- `DATA/creative/tokens.json` e `DATA/creative/template.html` secondo `KIT/creative/TEMPLATE.md`.
- L'`area` dell'infografica deve stare libera da ogni altro elemento del template.

## Step 4 — Anteprime e controllo

Genera 3 anteprime con contenuti di esempio diversi:
```
python3 KIT/creative/bin/post_creative.py --spec KIT/creative/examples/<esempio>.json --out DATA/drafts/creative-preview-<n> --config CONFIG --template DATA/creative/template.html --tokens DATA/creative/tokens.json --scale 1
```
con gli esempi `prima-dopo.json`, `numero.json` e `passi.json`. **Guarda ogni PNG**: testo leggibile e non tagliato, infografica dentro l'area senza toccare titolo o firma, contrasto buono, aspetto coerente con le reference. Se qualcosa non va, correggi i file e rigenera (max 4 giri).

## Step 5 — Riepilogo per il pannello

Scrivi `DATA/drafts/design-template.json`:
```json
{"stile": "<nome dello stile>", "sintesi": "<3 righe: da cosa nasce>", "scelte": ["<palette — da quale reference>", "<font — …>", "<layout — …>"],
 "anteprime": ["<percorso assoluto PNG 1>", "<PNG 2>", "<PNG 3>"], "dubbi": ["<cosa chiedere al cliente>"]}
```
Poi una riga di riepilogo.
