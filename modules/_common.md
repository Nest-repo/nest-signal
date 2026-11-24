# Regole comuni a tutti i moduli di Nest Signal

Leggile prima del modulo. I percorsi `KIT`, `DATA`, `CONFIG` e `PROFILO BROWSER` sono nel prompt con cui sei stato lanciato.

## Percorsi

- `CONFIG` (JSON): configurazione del cliente. Se `onboarding.done` è `false` o mancano `owner.name` / `audience.icp`, fermati e scrivi nel log: «Onboarding non completato: apri il pannello di Nest Signal».
- `KIT/modules/` istruzioni, `KIT/templates/` modelli di partenza, `KIT/creative/` generatore delle immagini.
- `DATA/` dati vivi del cliente (solo sul suo computer):
  - `strategy.md` — **l'unica fonte delle regole editoriali** (obiettivo, target, settimana, come si scrive, CTA, cosa non si dice mai). Se un modulo la contraddice, vince lei.
  - `pain-map.md` — i problemi del target con le frasi vere (fonte principale degli argomenti)
  - `persona.md` — la voce dell'autore
  - `hook-library.md` — come si scrive l'hook (sezione 0 a mano; 1, 2, 4 dall'Hook Lab)
  - `performance-ledger.md` — cosa converte (dal Performance loop): la sezione 1 sono vincoli
  - `hook-swipe.md`, `answers.md`
  - `state/<modulo>.json` — stato di ogni modulo (`last_run` e ciò che serve)
  - `feed.jsonl` — diario per il pannello (vedi sotto)
- Se un file di `DATA/` manca, copialo da `KIT/templates/` e prosegui.

## Ordine di autorità

1. `strategy.md` · 2. `performance-ledger.md` sezione 1 · 3. `hook-library.md` sezioni 0 e 4 · 4. `persona.md` · 5. `pain-map.md` e le fonti fresche.

## Valori di default (se mancano in CONFIG)

`content.days` = lun, mar, mer, gio · `content.max_proposals_per_run` = 2 · `content.experiment_ratio` = 0.25 · `performance.min_impressions` = 300 · pesi conversione: follower 3, visite profilo 1, commenti 2, lead 25 · `hook_lab.web_research_every_days` = 28.

## Fonti

- **Meeting**: `meetings.source` dice dove il cliente registra le call (`notion`, `granola`, `fireflies`, `notta`, `tldv`, `drive`, `altro`, `nessuno`) e `meetings.details` dove trovarle. Usa il connettore corrispondente se ce l'hai; se non ce l'hai o la fonte è `nessuno`, salta e scrivilo nel feed una volta a settimana (`tipo: "suggerimento"`, `titolo: "Colleghiamo le call: Nest ti aiuta a impostarlo"`, `link`: `nest.booking_url`).
- **Notion**: Piano Editoriale in `notion.editorial_db`; prima di una query fai `notion-fetch` per avere i nomi esatti delle colonne. Colonne attese in `KIT/setup/notion-setup.md`.
- **LinkedIn**: solo con il browser di Nest Signal (Playwright MCP sul profilo `PROFILO BROWSER`, o il browser che la tua AI ha collegato). **Sola lettura, sempre**: mai pubblicare, commentare, mettere like, inviare inviti o messaggi. Pausa 2-4 secondi tra le pagine. Se LinkedIn chiede il login o il browser non c'è: salta quelle parti, fai il resto, scrivilo nel log.

## Lingua

Post, bozze e report nella lingua `owner.language`.

## Diario per il pannello (obbligatorio)

Per ogni cosa che produci aggiungi **una riga JSON** in fondo a `DATA/feed.jsonl`:
`{"ts":"<ISO>","modulo":"<id>","tipo":"bozza|creatività|commento|report|regola|suggerimento","titolo":"<max 90 caratteri>","link":"<url Notion o LinkedIn, se c'è>"}`
Mai riscrivere le righe esistenti.

## Report

Se `delivery.slack_channel` è valorizzato: messaggio breve col connettore Slack (max 8 righe). Altrimenti basta il diario: il pannello lo mostra in «Oggi».

## Stato

Lavora su "dall'ultimo run" (in `DATA/state/<modulo>.json`), non su "oggi": il computer può essere stato spento.
