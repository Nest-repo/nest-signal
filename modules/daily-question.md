# Modulo — Domanda del giorno

Leggi prima `KIT/modules/_common.md` (se non l'hai già fatto).

Trasforma la vita vera dell'autore in materiale per i post, senza chiedergli di "scrivere contenuti". L'autore risponde **dal pannello** (pagina Oggi), oppure su Slack se `delivery.slack_channel` è impostato.

## Step 1 — Raccogli le risposte

- Le risposte date dal pannello sono già in `DATA/answers.md` (il pannello le scrive lui). Non duplicarle.
- Se c'è Slack: leggi col connettore le risposte dell'autore nel thread dell'ultima domanda (`slack_ts` in `DATA/state/daily-question.json`) e, se nuove, appendile in `DATA/answers.md`:
```
## <data> — <domanda>
<risposta verbatim>
<!-- usata: no -->
```

## Step 2 — Fai la domanda di oggi

Una domanda sola, concreta, a cui si risponde in 2 minuti dal telefono. Ruota tra questi tipi (non lo stesso due giorni di fila, vedi `last_types` nello stato):
- una scena: "Cosa è successo oggi che un cliente non vede mai?"
- un numero: "Quante ore ti ha preso X questa settimana?"
- un errore: "Cosa rifaresti diversamente nell'ultimo progetto?"
- una posizione: "Su cosa non sei d'accordo con il tuo settore?"
- un cliente: "Cosa ti ha detto un cliente che ti è rimasto in testa?" (anonimo)
- personale: sport, viaggi, abitudini — solo se `strategy.md` lo prevede.

Aggancia la domanda a un pain di `pain-map.md` poco coperto, se possibile. Mai domande su dati riservati di clienti.

## Step 3 — Salva e avvisa

Scrivi `DATA/state/daily-question.json`:
`{"last_run":"<ISO>","domanda":"<testo>","tipo":"<tipo>","data":"<YYYY-MM-DD>","last_types":[...ultimi 5],"slack_ts":"<se inviata su Slack>"}`
— il pannello legge `domanda` e la mostra in Oggi con il campo per rispondere.
Se c'è Slack, inviala anche lì. Aggiungi una riga al diario (`tipo: "report"`, `titolo`: "Domanda del giorno: <testo>").
