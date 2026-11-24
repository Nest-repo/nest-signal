# Setup — Scrivi la strategia editoriale del cliente

La strategia (`DATA/strategy.md`) è **l'unica fonte delle regole editoriali**: tutti i moduli la leggono per prima. Scrivila partendo da quello che il cliente ha già detto e scritto, non da regole generiche. **Non inventare nulla**: ogni scelta deve venire da una fonte che hai letto. Dove una fonte manca, scrivi la regola più prudente e segnalalo in `## Da confermare`.

## Leggi (sola lettura), in quest'ordine

1. `CONFIG`: `owner`, `audience` (ICP, settore, chi decide, chi non è target, offerta, obiettivo, problemi), `voice` (lunghezza, CTA, `never`, `note`), `content.days`.
2. La **knowledge base del cliente** (`CONFIG.knowledge`, vedi `_common.md`): posizionamento, offerta, prezzi da non dire, decisioni recenti, tono di voce, brand. Se ci sono documenti di decisioni o di strategia, vince **il più recente**.
3. Quello che la tua AI sa già del cliente (istruzioni personali e memoria), se esiste.
4. `DATA/pain-map.md`, `DATA/persona.md`, `DATA/hook-library.md` (sezione 0), `DATA/performance-ledger.md` (sezione 1 = vincoli già provati dai dati), `DATA/answers.md`.
5. I post pubblicati in `DATA/posts/` (`stato: "Pubblicato"`), con le metriche se ci sono.
6. Se il browser di Nest Signal è collegato: gli ultimi 10-15 post del profilo `CONFIG.owner.linkedin_url` (sola lettura, pausa 2-4 secondi tra le pagine). Se non c'è, salta.

## Scrivi `DATA/drafts/strategy.md`

In `owner.language`, asciutta (max ~900 parole), con **esattamente** queste sezioni:

```
# Strategia LinkedIn
<!-- Scritta dalla tua AI il <data>. È la fonte delle regole editoriali: cambiala dal pannello (Strategia) o chiedilo alla tua AI. -->

## Obiettivo            ← cosa misura il successo (di solito call prenotate) e come si legge un post
## Posizionamento       ← come si presenta il cliente, con le parole che usa lui (e quelle da non usare)
## Target               ← chi sì, chi no, chi decide; cosa vende (mai in ogni post)
## I problemi di cui parliamo ← 3-6 problemi, ognuno con la frase vera del cliente/prospect e il costo
## La settimana         ← tabella Giorno | Funzione | Di cosa parla (giorni da content.days; funnel Reach → Connection → Authority → Conversion → Referral)
## Come si scrive       ← lunghezza, struttura, hook, voce (dalla persona e dai post che hanno funzionato)
## CTA ammesse          ← quali e con che frequenza; prodotti/servizi da citare e come
## Mai                  ← argomenti, toni, dati, nomi e prezzi che non vanno in un post
## Creatività           ← visuali, non testuali, col template del cliente
## Da confermare        ← le scelte che hai dovuto fare senza una fonte chiara (anche vuota)
## Fonti                ← i documenti e le pagine che hai letto
```

Regole: numeri, nomi di clienti e citazioni solo se sono nelle fonti; se la knowledge base dice che qualcosa è superato o in discussione, non usarlo come regola; se `performance-ledger.md` sezione 1 contiene vincoli, riportali in `Come si scrive`.

Poi aggiungi una riga al diario (`tipo: "regola"`, `titolo: "Nuova strategia editoriale pronta"`, `link: "#/strategia"`) e chiudi con una riga di riepilogo. **Non scrivere direttamente `DATA/strategy.md`**: ci pensa il pannello (la applica da solo se il cliente non l'ha ancora toccata, altrimenti gliela propone).
