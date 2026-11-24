# Setup — Compila una pagina dell'onboarding dalla knowledge base del cliente

`PAGINA` (nel prompt) è una di: `profilo`, `icp`, `voce`, `creativita`. Il tuo compito è proporre i valori dei campi di quella pagina **partendo da ciò che il cliente ha già scritto da qualche parte**, così non deve riscriverlo. **Non inventare nulla**: ogni valore deve venire da una fonte che hai letto. Dove non trovi, lascia vuoto e mettilo in `mancano`.

## Dove cercare (in quest'ordine)

1. **La knowledge base del cliente**, indicata in `CONFIG.knowledge`:
   - `cartella` → i file in `DATA/knowledge/` (e in `CONFIG.knowledge.details` se è un percorso);
   - `drive`, `confluence`, `sito`, `altro` → usa il connettore che hai per quella fonte (Google Drive, Confluence, ecc.) e cerca documenti tipo: chi siamo, offerta/servizi, clienti ideali, brand book, tone of voice, case study, presentazioni commerciali. Solo lettura.
2. **Quello che la tua AI sa già del cliente**: le sue istruzioni personali e la memoria (es. `~/.claude/CLAUDE.md`, file di progetto, memorie), se esistono.
3. **Il sito** `CONFIG.owner.website` e il **profilo LinkedIn** `CONFIG.owner.linkedin_url` (browser di Nest Signal, sola lettura).
4. **Le call** dalla fonte in `CONFIG.meetings` (per `icp` e `voce`: le parole con cui i clienti descrivono il problema, il modo in cui parla l'autore).

## Campi per pagina

- `profilo`: `{"owner": {"name", "role", "company", "website", "linkedin_url", "language"}}`
- `icp`: `{"audience": {"icp", "sector", "size", "decision_maker", "not_icp", "offer", "goal", "pains": [{"name", "mirror", "cost"}]}}` — 3-5 pain, `mirror` verbatim se viene da una call o da un documento
- `voce`: `{"voice": {"length", "never"}, "hook_lab": {"reference_creators": ["handle LinkedIn"]}}` — più, se trovi una guida al tono di voce, una sintesi in `note`
- `creativita`: `{"creative": {"notes": "<colori, font, stile che piacciono o da evitare>", "figma_url": "<se c'è>"}}` — e **copia** in `DATA/creative/references/` i file visivi trovati (logo, brand book, grafiche: png, jpg, svg, pdf, max 6, max 5 MB l'uno)

## Risultato

Scrivi `DATA/drafts/prefill-<PAGINA>.json`:
```json
{"campi": { …solo i campi trovati, nella forma sopra… },
 "copertura": "alta|media|bassa",
 "fonti": ["<documento o pagina letta>"],
 "mancano": ["<campo o informazione che non hai trovato>"],
 "note": "<1-2 righe utili al cliente>"}
```
`copertura`: **alta** se hai trovato quasi tutto in fonti scritte dal cliente, **media** se una parte, **bassa** se hai trovato poco o solo il sito. Poi una riga di riepilogo.
