# Modulo — Hook Lab

Leggi prima `KIT/modules/_common.md` (se non l'hai già fatto).

Ogni settimana migliora `DATA/hook-library.md` con tre passaggi: **fuori** (cosa funziona su LinkedIn) → **target** (parla a un pain del nostro pubblico?) → **dentro** (sui post dell'autore ha funzionato davvero?). Un pattern diventa regola solo se i dati dell'autore lo confermano; quello che funziona fuori ma non è ancora provato entra come 🧪 da testare, così il content engine lo prova.

È l'**unico** modulo che scrive `hook-library.md`. La sezione 0 (scritta dall'autore) e la sezione 3 non si riscrivono mai: si ricopiano verbatim.

## Step 0 — Chi, a chi, perché

Da `CONFIG` (`audience.*`), `DATA/strategy.md`, `DATA/pain-map.md`: ICP in una riga, 5-8 pain con la frase-specchio, cosa non si dice mai.

## Step 1 — Scouting (Claude in Chrome, ultimi 14 giorni, 25-40 post)

Salta i post già in `state/hook-lab.json → seen_posts`.
1. **Creator di riferimento** (`hook_lab.reference_creators`): `https://www.linkedin.com/in/<handle>/recent-activity/all/`.
2. **Cosa legge il target** (profili in `DATA/people.md`, se ci sono): per 10 profili, `/recent-activity/reactions/` e `/recent-activity/comments/`. Peso doppio: è ciò che il tuo pubblico nota davvero.
3. **Per tema** (`hook_lab.search_topics`): `https://www.linkedin.com/search/results/content/?keywords=<tema>&datePosted="past-week"`.

Per ogni post: autore, link, data, reazioni, commenti, e l'**hook** (il testo prima di "…altro"/"…more"). Tieni quelli che hanno funzionato: commenti ≥ 30, oppure reazioni ≥ 10× la mediana dell'autore, oppure commentati da ≥ 2 persone del target. Max 60 pagine.

## Step 2 — Anatomia

Per ogni hook tenuto:
- **Pattern** (tassonomia; estendila solo se nessuno calza e scrivi la definizione in sezione 4): `numero-preciso` · `confessione` · `posizione-attaccabile` · `scena-concreta` · `domanda-specchio` · `contrasto` · `lista-promessa` · `citazione-reale` · `nome-e-cognome`
- **Meccanica**: cosa fa fermare, in una riga.
- **Filtro forza**: passa la sezione 0 della hook-library?
- **Fit**: a quale pain parla, o ✗ (pubblico sbagliato).

Appendi in `DATA/hook-swipe.md` (max 150 righe, togli le più vecchie):
`| data | autore | hook | pattern | reazioni/commenti | fit | link |`

## Step 3 — Best practice dal web (ogni `hook_lab.web_research_every_days`)

2-3 ricerche web su hook LinkedIn attuali. 3-6 principi con fonte. Niente numeri non scritti nella fonte.

## Step 4 — Validazione sui dati dell'autore

1. In `DATA/posts/` scrivi `pattern_hook` sui post `Pubblicato` che non lo hanno (max 30 per run).
2. Per pattern: n. post, conv media (indice del ledger), impressioni mediane, confronto con la media generale.
3. Verdetto: ✅ **Validato** (≥ 3 post e conv ≥ media) · 🧪 **Da testare** (funziona fuori, fit sì, < 3 post nostri) · ❌ **Smentito** (≥ 3 post e conv < 0,7× media).
4. Dove un hook esterno forte e un hook nostro debole parlano dello stesso pain: una riga su cosa cambia tra i due.

## Step 5 — Riscrivi `DATA/hook-library.md`

Solo intestazione e sezioni 1, 2, 4; 0 e 3 verbatim.
- **1. Pattern dai tuoi post**: top 5 per conversione, top 5 per reach (non promossi), bottom 3, dal ledger.
- **2. Pattern da fuori**: 5-8 hook esterni forti con fit, + principi web con fonte.
- **4. Pattern validati sui dati**: tabella `| Pattern | Verdetto | Post nostri | conv vs media | Impr mediane | Miglior esempio nostro | Esempio esterno |`, poi **Hook pronti per i pain** (2 per pain, nella voce di `persona.md`, pattern ✅ o 🧪, prima riga ≤ 12 parole, 🧪 marcati), poi **Da non usare** (❌ con la prova).

Se il file è assente o rotto non riscriverlo da zero: fermati e chiedi all'autore di ripristinare la sezione 0.

## Step 6 — Report

```
🪝 Hook Lab
• Analizzati <N> post fuori · tenuti <N>
• ✅ <pattern> · 🧪 <pattern> · ❌ <pattern>
• Hook più forte trovato: «<hook>» — <autore>, <commenti> commenti
```
