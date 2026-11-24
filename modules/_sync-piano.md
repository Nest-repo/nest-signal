# Procedura comune — Allinea il Piano editoriale con LinkedIn

La eseguono il **Performance loop** e l'**Hook Lab** all'inizio del giro, quando sono già su LinkedIn col browser di Nest Signal. Così il cliente non deve segnare a mano cosa ha pubblicato.

**Salta** se `DATA/state/sync-piano.json → last_sync` è di meno di 20 ore fa (l'ha già fatta l'altro modulo) o se il browser non c'è / LinkedIn chiede il login (in quel caso scrivilo nel log e in `esito.saltato` metti `browser` o `linkedin`). Solo lettura su LinkedIn, sempre.

## 1. Leggi i post recenti dell'autore

`<CONFIG.owner.linkedin_url>/recent-activity/all/` (scorri finché arrivi a 21 giorni fa, max 30 post). Tieni **solo i post scritti dall'autore** (non repost, non commenti). Per ognuno: link (`https://www.linkedin.com/feed/update/urn:li:activity:<ID>/`), data di pubblicazione, testo completo (apri "…altro").

## 2. Abbina ai post del piano

Candidati in `DATA/posts/`: stato `Idea`, `Bozza`, `In revisione`, `Da pubblicare` (e `Pubblicato` senza `link_live`). Normalizza (minuscole, niente emoji/punteggiatura/spazi doppi) e confronta:
- **certo**: le prime ~60 lettere dell'hook coincidono, oppure ≥ 70% delle frasi del testo coincidono;
- **probabile**: stesso tema e ≥ 40% delle frasi coincidono → abbina, ma metti `da_confermare: "Abbinato in automatico al post pubblicato il <data>: controlla"`;
- sotto → nessun abbinamento.
Un post online si abbina a **un solo** post del piano (il più simile).

## 3. Aggiorna il piano

Per ogni abbinamento, nel file del post (mai toccare `testo_bozza`):
- `stato: "Pubblicato"`, `link_live`, `data` = data vera di pubblicazione;
- `testo` = **il testo davvero online** (se diverso dalla bozza: è ciò che l'autore ha cambiato, il Voice refresh lo usa);
- `titolo` = la prima riga online;
- `note`: aggiungi «Pubblicato il <data>, rilevato da Nest Signal».

Per ogni post online **senza abbinamento** e non già presente (stesso `link_live`): crea un post `stato: "Pubblicato"` con `titolo`, `testo`, `link_live`, `data`, `fonte: "pubblicato fuori dal piano"`, `autore: CONFIG.owner.name`. Così viene misurato anche lui.

## 4. Post previsti e non usciti

Post `Da pubblicare` con `data` passata da più di 1 giorno e nessun abbinamento: non cambiarli. Mettili nel diario (`tipo: "suggerimento"`, `titolo: "«<titolo>» era previsto per <giorno> e non risulta pubblicato"`, `link: "#/piano/<id>"`), una volta sola per post (tieni gli id in `sync-piano.json → avvisati`).

## 5. Registra

Una riga nel diario per ogni post aggiornato o creato (`tipo: "bozza"`, `titolo: "Pubblicato: «<titolo>»"`, `link: "#/piano/<id>"`). Poi `DATA/state/sync-piano.json` = `{"last_sync": "<ISO>", "aggiornati": [<id>], "creati": [<id>], "avvisati": [<id>…]}`.
