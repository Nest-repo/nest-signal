# Modulo — Content engine

Leggi prima `KIT/modules/_common.md` (se non l'hai già fatto).

Scrive **1-2 proposte di post per run** nel Piano Editoriale, nella voce dell'autore, su problemi veri del target, replicando quello che ha già funzionato. Non pubblica, non programma, non invia nulla.

## Step 0 — Contesto (sempre)

Leggi, in quest'ordine di autorità:
1. `DATA/strategy.md`.
2. `DATA/performance-ledger.md` — sezione 1 "Regole che i dati confermano" = **vincoli**; sezione 4 "Flop" = cosa non rifare; sezione 6 = quali formati, CTA e temi portano persone.
3. `DATA/hook-library.md` — sezione 0 (filtro forza, scritta dall'autore) prima di tutto; poi sezione 4 "Hook pronti per i pain" e "Da non usare".
4. `DATA/persona.md` — come scrive l'autore. Vince su tutto quando si parla di stile.
5. `DATA/pain-map.md` — la fonte principale degli argomenti.
6. `DATA/competitor-insights.md` (se c'è, dal Radar competitor) — sezioni 3 "Spazi liberi" e 4 "Come posizionarsi" per scegliere l'angolo, 1 e 5 per formato e struttura che funzionano nella nicchia. **Mai copiare un loro post o hook**, mai nominarli: serve a prendersi lo spazio, non a imitarli. Se contraddice `strategy.md`, vince la strategia.

## Step 1 — Riconciliazione leggera del Piano Editoriale

Leggi `DATA/posts/`: post in `Bozza`/`In revisione` degli ultimi 30 giorni (per non duplicare temi) e `Pubblicato` degli ultimi 14 giorni (per variare). Se l'autore ha modificato una bozza prima di pubblicarla, la differenza è oro per il Voice refresh: non toccarla.

## Step 2 — Materiale (dall'ultimo run)

Raccogli candidati da:
1. `DATA/answers.md` — risposte alla domanda del giorno non ancora usate (priorità alta: è materiale vero).
2. `content.inputs.slack_ideas_channel` se c'è — idee buttate lì dall'autore (priorità massima).
3. **Le call** (fonte in `meetings.source` / `meetings.details`, vedi `_common.md`) — frasi in cui l'autore si espone o dà un numero, e frasi in cui un cliente/prospect descrive un problema (anonimizzate: niente nomi, aziende, città, cifre di fatturato).
4. `DATA/pain-map.md` — se non c'è materiale fresco, prendi il pain meno usato nelle ultime 3 settimane.

Scarta ciò che non parla a `audience.icp`, ciò che è già stato proposto, e ciò che serve solo a parlare di sé senza un problema del lettore dentro.

## Step 3 — Scegli giorno, funzione e pattern

- Giorno: il primo slot libero tra `content.days`.
- Funzione del post (scegline una): **Reach** (gente nuova), **Connection** (persona e processo), **Authority** (prova che consegni), **Conversion** (prossimo passo ovvio), **Referral** (prova da clienti). Bilancia sulla settimana secondo `strategy.md` e sulla sezione 6 del ledger.
- Pattern dell'hook: da `hook-library.md` sezione 4, solo ✅ Validati o 🧪 Da testare. Al massimo `content.experiment_ratio` delle proposte (default 1 su 4) è un esperimento 🧪.

## Step 4 — Scrivi la proposta

Per ogni proposta:
- **Scheda di evidenza** (3-5 righe): da dove viene (fonte e data), quale pain, quale frase vera.
- **4 hook** con voto 🟢/🟡/🔴 secondo la sezione 0 della hook-library; almeno 2 🟢. Il primo è quello consigliato.
- **Copy completo** nella voce di `persona.md`: 500-1.200 caratteri salvo regole diverse nel ledger o nella strategia. Una sola idea. Chiusura secondo la CTA scelta.
- **Replica**: `Replica: <pattern> — come «<hook di un nostro post>», conv <x>` oppure `Esperimento: <pattern>`.
- **Da confermare**: dati o dettagli che l'autore deve verificare prima di pubblicare.

Prima di salvare rileggi il copy contro `persona.md` (sezione "cosa mi fa sembrare finto") e contro le regole del ledger.

## Step 5 — Salva nel Piano Editoriale

Un post per proposta in `DATA/posts/` (vedi `_common.md`): `titolo` = hook consigliato, `hooks` = gli altri hook con voto (`[{"testo":"…","voto":"🟢"}]`), `testo` e `testo_bozza` = il copy, `stato` = `Bozza`, `data` = giorno scelto, `funnel`, `cta`, `formato`, `pattern_hook`, `fonte` (scheda di evidenza in 2-3 righe + "Replica: …" o "Esperimento: …"), `da_confermare`. Se esiste già un post `Idea` sullo stesso tema, sviluppa quello invece di crearne uno nuovo.

Zero proposte è un esito valido se il materiale è debole: meglio niente che 4 hook 🟡.

La creatività non la fai tu: la genera il modulo Creatività sui post senza immagine. Scrivi il post in modo che il suo intento stia in una frase.

Per ogni bozza aggiungi una riga al diario (`tipo: "bozza"`, `titolo`: l'hook, `link`: `#/piano/<id>`).

## Step 6 — Report

```
✍️ LinkedIn — <N> bozze nuove
• «<hook>» — <funzione> · <giorno> · <Replica|Esperimento>: <pattern> — <link>
```
