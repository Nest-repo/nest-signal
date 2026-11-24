# Modulo — Performance loop

Leggi prima `KIT/modules/_common.md` (se non l'hai già fatto).

Misura ogni post pubblicato, attribuisce i lead al post da cui arrivano e tiene `DATA/performance-ledger.md`: la memoria dei risultati che il content engine usa per replicare ciò che **porta persone** (follower, visite al profilo, commenti, lead). Le impressioni contano, ma vengono dopo. Non scrive post.

## Step 0 — Allinea il piano con LinkedIn

Esegui `KIT/modules/_sync-piano.md`: segna come pubblicati i post usciti, con link, data e testo vero, e aggiunge quelli pubblicati fuori dal piano. Così lo Step 1 li misura subito.

## Step 1 — Post da misurare

Da `DATA/posts/`: post con `stato: Pubblicato` e `link_live` valorizzato.
- tutti quelli pubblicati negli ultimi 30 giorni;
- i più vecchi con `Metriche al` vuoto (backfill), max 15 per run.

ID attività: regex `activity[:-](\d{19})` su `link_live`. Se manca, cercalo nella pagina `https://www.linkedin.com/analytics/creator/top-posts/?metricType=IMPRESSIONS&timeRange=past_28_days` facendo match sui primi 60 caratteri dell'hook; se non lo trovi, salta il post.

## Step 2 — Metriche (Claude in Chrome)

Per ogni post: `https://www.linkedin.com/analytics/post-summary/urn:li:activity:<ID>/` e `get_page_text`. Il numero sta nella riga **prima** dell'etichetta. Etichette:

| Campo | Italiano | English |
|---|---|---|
| Impressioni | Impressioni | Impressions |
| Utenti raggiunti | Utenti raggiunti | Members reached |
| Visite profilo | Visitatori del profilo da questo post | Profile viewers from this post |
| Follower acquisiti | Follower acquisiti da questo post | Followers gained from this post |
| Interazioni | Interazioni social | Social engagement |
| Commenti | Commenti | Comments |
| Repost | Diffusioni del post | Reposts |
| Salvataggi | Salvataggi | Saves |

- `Questo post è stato promosso` / `This post was promoted` → post **promosso**: fuori dalle classifiche di reach, resta in quelle di conversione con nota.
- "Principali dati demografici": tieni la prima voce di dimensione azienda e anzianità (dice se il post ha raggiunto il target).
- Separatore migliaia: `8.771` (it) / `8,771` (en) = 8771. Max 40 post per run.

## Step 3 — Scrivi

Nel post, oggetto `metriche`: `impressioni`, `interazioni`, `commenti`, `repost`, `follower_acquisiti`, `visite_profilo`, `metriche_al` = oggi (e `lead` = n. lead attribuiti). Se un valore letto è minore di quello già salvato, tieni il vecchio (errore di lettura). Appendi una riga JSON per post in `DATA/state/performance-snapshots.jsonl`: `{"date","page","activity","impr","reach","followers","profile_visits","comments","reposts","saves","promoted","age_days","company_size","seniority"}`.

## Step 4 — Attribuzione dei lead

Candidati: chi negli ultimi giorni (dall'ultimo run) ha **scritto all'autore** o **si è collegato** su LinkedIn (messaggi e "La mia rete", sola lettura) ed è in target secondo `audience` in CONFIG. Salta chi è già in `DATA/leads.jsonl`. Prove, dalla più forte:
1. nel messaggio cita un post o il suo tema → **certo**
2. ha commentato un post dell'autore nei 21 giorni prima → **certo**
3. ha messo una reazione nei 14 giorni prima → **probabile**
4. nessuna prova → **incerto**

Per ognuno aggiungi una riga in `DATA/leads.jsonl` (`{"ts","nome","profilo","post_id","certezza","prova"}`; `post_id` vuoto se incerto). Per certo/probabile aumenta di 1 `metriche.lead` del post. Gli incerti vanno nel diario come domanda (`tipo: "suggerimento"`, «Da quale post arriva <nome>?»), così l'autore lo dice alla sua AI.

## Step 5 — Riscrivi `DATA/performance-ledger.md`

Ricostruiscilo dai post + snapshots. La sezione `## Note dell'autore` si ricopia verbatim.

Indice di conversione (solo post con impressioni ≥ `performance.min_impressions`):
`conv = (followers×w.followers + profile_visits×w.profile_visits + comments×w.comments + leads×w.leads) / impressioni × 1000` con i pesi di `performance.conversion_weights`.

Classifiche sulla fotografia a 7 giorni (`age_days` 6-9) quando c'è; i post con meno di 6 giorni vanno in "In osservazione".

Sezioni (stesso ordine del template `templates/performance-ledger.md`):
1. **Regole che i dati confermano** — 3-6 regole in imperativo con la prova tra parentesi. Una regola entra solo con ≥ 3 post a sostegno.
2. Top 5 per conversione · 3. Top 5 per reach (non promossi) · 4. Flop (bottom 3 conv) con il perché
5. Lead per post · 6. Segnali per funzione, formato, CTA, orario, tema (gruppi ≥ 3 post)
7. Ipotesi da testare (1-2 post forti) · 8. In osservazione · Note dell'autore · Storico run

## Step 6 — Report

```
📈 LinkedIn — performance
• Misurati <N> post · top conversione: «<hook>» (<follower> follower, <visite> visite profilo)
• Lead attribuiti: <N> · Da chiarire: <nome> — da quale post? (<post1>, <post2>)
• Regola nuova: <se c'è>
```
