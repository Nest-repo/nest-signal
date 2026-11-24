# Modulo — Radar competitor

Leggi prima `KIT/modules/_common.md` (se non l'hai già fatto).

Ogni settimana guarda **cosa pubblicano i competitor del cliente e cosa funziona per loro**, così il content engine può posizionare l'autore nella stessa nicchia **senza copiarli**: stessi problemi del target, angolo diverso, spazi che loro lasciano liberi. Solo lettura su LinkedIn, sempre. Non scrive post.

Competitor: `CONFIG.competitors` = `[{"name", "url", "note"}]` (profilo personale o pagina aziendale LinkedIn). Se è vuoto: scrivi nel diario una volta (`tipo: "suggerimento"`, `titolo: "Aggiungi i tuoi competitor: la tua AI li confronta ogni settimana"`, `link: "#/competitor"`), esito `bloccato` con nota, e fermati.

## Step 1 — Leggi i loro post (ultimi 21 giorni, dall'ultimo run)

Per ogni competitor (max 8): `<url>/recent-activity/all/` per i profili, `<url>/posts/` per le pagine aziendali. Pausa 2-4 secondi tra le pagine, max 15 post per competitor, salta i link già in `DATA/competitors/posts.jsonl`. Per ogni post **scritto da loro** (non repost):
- link, data, testo completo (apri "…altro"), **hook** (il testo prima di "…altro"), formato (`testo`, `immagine`, `carosello`, `video`, `documento`, `sondaggio`), reazioni, commenti, repost;
- **pattern dell'hook** con la tassonomia di `DATA/hook-library.md` sezione 4 (o quella dell'Hook Lab);
- **tema** in 2-4 parole e, se c'è, il **pain** di `DATA/pain-map.md` a cui parla (o ✗);
- **CTA** usata (nessuna, domanda, commenta-parola, link, call).

Appendi una riga JSON per post in `DATA/competitors/posts.jsonl`:
`{"competitor","url_competitor","link","data","hook","formato","pattern","tema","pain","cta","reazioni","commenti","repost","letto_il"}`

Se la pagina mostra i follower, annotali.

## Step 2 — Riepilogo per competitor

Riscrivi `DATA/competitors/summary.json` = `{"aggiornato": "<ISO>", "competitor": [ ... ]}` con, per ciascuno, sugli ultimi 30 giorni di `posts.jsonl`:
`{"name","url","follower","post_30g","frequenza_settimana","reazioni_mediane","commenti_mediani","formati":{"<formato>":n},"temi_top":["…"],"pattern_top":["…"],"cta_top":"…","post_migliore":{"hook","link","reazioni","commenti","formato"},"nota":"<una riga: cosa li distingue>"}`

"Ha funzionato" = commenti ≥ 2× la loro mediana, oppure reazioni ≥ 2× la loro mediana.

## Step 3 — `DATA/competitor-insights.md` (lo legge il content engine)

Riscrivilo ogni volta, in `owner.language`, max ~600 parole, con queste sezioni:

```
# Competitor — cosa fanno e dove posizionarsi
<!-- Scritto dal Radar competitor il <data>. Letto dal content engine: mai copiare, solo posizionarsi. -->

## 1. Cosa funziona a loro      ← 3-5 pattern/formati/temi con la prova (competitor, n. post, mediana commenti)
## 2. Temi saturi               ← di cosa parlano tutti: entrarci solo con un angolo nettamente diverso
## 3. Spazi liberi              ← pain di pain-map.md che nessuno copre (o copre male): qui l'autore può prendersi la nicchia
## 4. Come posizionarsi         ← 3-5 angoli concreti che differenziano l'autore, coerenti con strategy.md
## 5. Da adattare, non copiare  ← 3-5 hook/strutture che funzionano a loro, riscritti come schema (non il testo)
## 6. Da evitare                ← cose che fanno e che strategy.md vieta, o che a loro non funzionano
```

Regole: niente numeri inventati; i loro testi non si riportano interi (max una frase per esempio, citando competitor e link); mai suggerire di nominare o attaccare un competitor.

## Step 4 — Diario, esito, report

Una riga nel diario: `tipo: "report"`, `titolo: "Competitor: <n> post letti · spazio libero: <il più interessante>"`, `link: "#/competitor"`. Esito nel file di stato (`_common.md`). Report breve se c'è Slack:
```
🔭 Competitor — settimana
• Letti <N> post di <M> competitor · funziona a loro: <pattern/formato>
• Spazio libero per te: <pain>
```
