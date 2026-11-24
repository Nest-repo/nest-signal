# Modulo — Voice refresh

Leggi prima `KIT/modules/_common.md` (se non l'hai già fatto).

Tiene `DATA/persona.md` allineato a come l'autore scrive **adesso**. Non tocca `hook-library.md` (è dell'Hook Lab).

## Step 1 — Campioni (ultimi 7-14 giorni)

1. **Post pubblicati** in `DATA/posts/` (`stato: Pubblicato`): il testo davvero online.
2. **Bozza vs pubblicato**: per ogni post confronta `testo_bozza` (com'era uscito dal content engine) con `testo` (com'è dopo le modifiche dell'autore). Cosa ha tagliato, cosa ha aggiunto, cosa ha riscritto: è il segnale più forte.
3. **Bozze scartate** (`Status = Scartato`) con una nota: cosa non gli piaceva.
4. `DATA/answers.md`: come scrive quando non sta "facendo un post".
5. Se c'è `content.inputs.slack_ideas_channel`: i suoi messaggi lì.

## Step 2 — Aggiorna `persona.md`

Mantieni la struttura del template (chi è, cosa pensa, come scrive, parole sue, cosa lo fa sembrare finto, esempi). Regole:
- Cambia solo ciò che i campioni mostrano. Ogni modifica ha una riga nel "Registro aggiornamenti" in fondo, con data e prova.
- Le sezioni marcate `<!-- a mano -->` non si toccano.
- Le "parole sue" sono citazioni verbatim, non parafrasi.
- La sezione "cosa mi fa sembrare finto" cresce con ogni modifica che l'autore ha fatto alle bozze (es. "ha tolto tutti i due punti a effetto").

## Step 3 — Report

```
🗣️ Voce aggiornata — <N> campioni
• Cambiato: <1-2 righe>
• Nuovo anti-pattern: <se c'è>
```
