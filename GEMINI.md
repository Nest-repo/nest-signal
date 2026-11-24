# Nest Signal — istruzioni per l'AI del cliente

Questa cartella è **Nest Signal**: il sistema che scrive i post LinkedIn del cliente, crea le immagini, misura cosa porta call e migliora da solo. Il cliente ti apre qui (Claude Code, Codex, Gemini…) e ti chiede di gestire il suo **Piano editoriale** o il sistema. Rispondi in italiano, in modo breve e operativo.

## Dove stanno le cose

- Dati del cliente: `~/.nest-signal/` (oppure la cartella in `NEST_SIGNAL_HOME`)
  - `config.json` — chi è, ICP, target, voce, AI, orari dei moduli, colori
  - `data/posts/<id>.json` — **il Piano editoriale**: un file per post (schema in `modules/_common.md`, sezione Fonti)
  - `data/strategy.md` — la strategia editoriale (l'unica fonte delle regole)
  - `data/pain-map.md`, `data/persona.md`, `data/hook-library.md`, `data/performance-ledger.md` — problemi del target, voce, hook, cosa converte
  - `data/creative/` — template e immagini; `data/feed.jsonl` — diario mostrato nel pannello
- Istruzioni dei moduli: `modules/` · lavori di onboarding: `setup/` · generatore immagini: `creative/`
- Pannello: `npm start` → http://127.0.0.1:3210 (Piano editoriale in `#/piano`)

## Cosa ti chiederà il cliente, e come farlo

| Richiesta | Come |
|---|---|
| «Fammi vedere i post della settimana» | leggi `data/posts/*.json`, filtra per `data`, rispondi con titolo · stato · data |
| «Accorcia / riscrivi il post X», «hook più diretto» | trova il post per titolo, modifica `testo` e/o `titolo`; **non toccare `testo_bozza`**; segui `data/persona.md` e la sezione 0 di `data/hook-library.md` |
| «Spostalo a lunedì», «approvalo», «scartalo» | cambia `data` (YYYY-MM-DD) o `stato` (`Da pubblicare`, `Scartato`…) e `updated` |
| «Nuova idea: …» | crea un post `stato: "Idea"` (API `POST /api/posts` se il pannello è acceso, altrimenti scrivi il file) |
| «Scrivimi il post su …» | segui `modules/content-engine.md` dallo Step 0 per quell'unico post |
| «Rifai l'immagine» | metti `creativita: ""` nel post e lancia `node bin/nest-signal.mjs run creative` |
| «Lancia il modulo X adesso» | `node bin/nest-signal.mjs run <content-engine|creative|daily-question|voice-refresh|performance|hook-lab|comment-radar>` |
| «Cambia la strategia / il target» | modifica `data/strategy.md` (e `config.json` → `audience` per l'ICP); di' al cliente cosa hai cambiato |

Con il pannello acceso puoi usare l'API locale (header obbligatorio `X-Nest-Signal: 1`):
`GET /api/posts` · `POST /api/posts` · `GET|PUT /api/posts/<id>` · `POST /api/run {"kind":"module","target":"<id>"}`.

## Regole

- **Su LinkedIn non pubblicare, non commentare, non mettere like, non mandare inviti o messaggi.** Il cliente pubblica da solo.
- Numeri, nomi e citazioni solo se sono nelle fonti del cliente: mai inventarli.
- Non cancellare file di `data/`: per togliere un post usa `stato: "Scartato"`.
- Prima di modifiche grandi (strategia, molti post insieme) di' in una riga cosa stai per fare.
- Se il cliente non ha chiaro ICP, call registrate o processi: Nest può aiutarlo → `config.json` → `nest.booking_url`.
