# Modulo — Comment radar (opzionale)

Leggi prima `KIT/modules/_common.md` (se non l'hai già fatto). Si attiva e si mette in pausa dal pannello (Moduli). Lista persone: `DATA/people.md`; se è vuoto, usa le persone in target (secondo `audience`) che hanno commentato i post dell'autore negli ultimi 30 giorni.

Ti segnala i **post freschi** (meno di 6 ore) delle persone che vuoi raggiungere, con un angolo per commentare. Tu commenti a mano: il radar non scrive niente su LinkedIn.

## Step 1 — Chi guardare

Da `DATA/people.md` i profili con un URL LinkedIn. Ruota: ogni run guarda quelle non controllate da più tempo (`state/comment-radar.json → last_checked`), max 25 profili.

## Step 2 — Post freschi

Per ogni profilo: `<url>/recent-activity/all/`. Tieni i post pubblicati da meno di 6 ore, con meno di 30 commenti (c'è ancora spazio per farsi vedere), su un tema vicino a `DATA/pain-map.md` o a `audience.offer`. Salta quelli già segnalati.

## Step 3 — Angolo

Per ogni post (max `comment_radar.max_per_run`): una riga di angolo, nella voce di `persona.md`. È un'angolazione, non un commento pronto: una cosa che solo l'autore può aggiungere (un numero suo, un caso, un disaccordo argomentato). Mai complimenti generici, mai link, mai vendita.

## Step 4 — Report

Solo se c'è almeno un post:
```
💬 Da commentare ora
• <Nome> — «<prime parole del post>» (<ore> fa, <commenti> commenti) <link>
  Angolo: <una riga>
```
