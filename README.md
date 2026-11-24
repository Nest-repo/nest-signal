# Nest Signal

**LinkedIn che porta call, senza scrivere da zero.** Nest Signal scrive le bozze nella tua voce partendo dai problemi veri dei tuoi clienti, crea l'immagine di ogni post, misura cosa porta follower, visite e lead, e ogni settimana migliora da solo. Tu approvi e pubblichi.

Costruito da [Nest](https://usanest.it), il partner operativo che progetta e ottimizza i processi delle aziende in crescita: operation prima, tecnologia dopo.

## Come funziona

Un pannello locale (stile [Paperclip](https://github.com/paperclipai/paperclip)) con:
- **Analytics**: impressioni, follower, visite al profilo, commenti e lead per post e per settimana, conversione per funzione e per pattern di hook, lead arrivati;
- **Competitor**: aggiungi i competitor (o falli trovare alla tua AI) e vedi frequenza, formati, temi, il loro post migliore e dove posizionarti;
- **Piano editoriale nel pannello**: bacheca per stato, calendario, scheda del post (testo, hook alternativi, immagine, approva, segna pubblicato);
- **onboarding guidato nel browser**: la tua AI → chi sei → connessioni (la tua knowledge base, il browser per LinkedIn, dove registri le call, Slack facoltativo) → ogni pagina si **compila dalla tua knowledge base** e tu correggi → ICP e target → modello comunicativo (l'AI legge i tuoi post) → **creatività** (carichi le tue reference o un file Figma e l'AI costruisce il **tuo** template: colori, font, cornice) → moduli e orari;
- **scheduler interno**: i moduli partono ai loro orari finché il pannello è acceso; pausa, "esegui ora" e log di ogni giro;
- **la tua AI fa il lavoro**: Claude Code, OpenAI Codex CLI, Gemini CLI o qualsiasi comando che accetta un prompt (adapter).

```
 Strategia (tua) ──► Content engine ──► Piano editoriale (locale) ──► tu approvi e pubblichi
      ▲                  ▲     ▲                 ▲
      │          hook-library  performance-ledger │ Creatività: immagine col tuo template
      │                  ▲            ▲           │
      └── Voce ◄── Hook Lab (mar) · Performance loop (lun·gio) ◄── i tuoi post pubblicati
```

| Modulo | Default | Cosa fa |
|---|---|---|
| Content engine | lun-ven 17:00 | 2-3 bozze complete nella tua voce, sui pain veri, ripetendo ciò che converte |
| Creatività | lun-ven 17:40 | immagine per ogni bozza col **tuo** template (dalle tue reference): infografica visuale, non testo |
| Domanda del giorno | lun-ven 08:15 | una domanda: rispondi dal pannello, diventa materiale vero |
| Voce | lun 09:00 | aggiorna il tuo modello di scrittura |
| Performance loop | lun e gio 08:40 | follower, visite profilo, commenti e lead per post → cosa converte |
| Hook Lab | mar 09:30 | hook che funzionano su LinkedIn, validati sui tuoi dati |
| Radar competitor | mer 10:00 | cosa pubblicano i tuoi competitor e cosa funziona a loro → spazi liberi e angoli per posizionarti (letto dal content engine, mai copiato) |
| Radar commenti | lun-ven 3 volte (opz.) | post freschi delle persone in target, con un angolo per commentare |

## Requisiti

- **Node.js 20+**
- **Un account AI**: Claude (Pro, Max o superiore), ChatGPT (anche gratuito, con limiti più bassi) o Google per Gemini. Non serve la chat nel browser: l'onboarding installa la versione da terminale ([Claude Code](https://docs.claude.com/en/docs/claude-code), [Codex CLI](https://github.com/openai/codex) o [Gemini CLI](https://github.com/google-gemini/gemini-cli)) dentro la cartella `.ai/` e ti fa entrare col tuo account con un clic, senza Terminale
- **Browser per LinkedIn**: [Playwright MCP](https://github.com/microsoft/playwright-mcp) con un profilo dedicato (te lo configura l'onboarding) e `npm install playwright` per il login
- **Python 3** per le creatività (usa Playwright per Python se c'è, altrimenti quello di Node)

## Installazione

```bash
git clone https://github.com/Nest-repo/nest-signal.git
cd nest-signal
npm install
npm run onboard
```

Si apre il pannello su `http://127.0.0.1:3210` con l'onboarding. Dopo:

```bash
npm start                         # pannello + routine (lascialo acceso)
node bin/nest-signal.mjs status   # moduli e ultimi giri
node bin/nest-signal.mjs run content-engine
```

## Gestirlo con la tua AI

Il Piano editoriale sta nel pannello (bacheca, calendario, scheda del post). Per modificarlo a parole apri la tua AI **in questa cartella** e chiedi, per esempio: «sposta il post sui lead a lunedì», «accorcia il post di giovedì», «rifai l'immagine del post X», «lancia l'Hook Lab adesso». Anche il resto passa da lì: «configuriamo Nest Signal» fa partire l'onboarding, «apri Nest Signal» il pannello. Le istruzioni per l'AI sono in `AGENTS.md` (letto da Codex; `CLAUDE.md` e `GEMINI.md` lo richiamano per Claude Code e Gemini).

## Dove stanno i dati

Tutto nella cartella `workspace/` del progetto (esclusa da git; cambia con `NEST_SIGNAL_HOME`): `config.json`, `data/` (Piano editoriale in `posts/`, strategia, problemi del target, voce, hook, risultati, lead, diario, `knowledge/` per i tuoi documenti), `runs/` (log), `browser/` (profilo del browser di Nest Signal). Nessun database online: niente esce dal tuo computer se non verso gli strumenti che colleghi tu.

## Regole che il sistema rispetta sempre

- Su LinkedIn **solo lettura**: niente post, commenti, like, inviti o messaggi automatici.
- Niente viene pubblicato senza di te.
- La strategia la scrivi tu (`strategy.md`, pagina Strategia): i dati la migliorano, non la sostituiscono.
- In modalità "senza conferme" l'AI usa i suoi strumenti senza chiederti il permesso a ogni passo: le istruzioni dei moduli vietano qualsiasi scrittura su LinkedIn, ma valuta tu se lasciarla attiva.

## Struttura

| Cartella | Cosa |
|---|---|
| `bin/` | comando `nest-signal` |
| `server/` | API locale, adapter delle AI, scheduler, esecuzioni |
| `ui/` | pannello e onboarding (Preact, senza build) |
| `modules/` | istruzioni dei moduli (`_common.md` + uno per modulo) |
| `setup/` | lavori dell'onboarding (compila dalla knowledge base, proposta ICP, modello comunicativo, template creatività, controllo connessioni) |
| `templates/` | file di partenza dei dati |
| `creative/` | motore delle infografiche (6 tipi) + contratto del template del cliente (`TEMPLATE.md`) |

## Ti serve una mano?

Se non registri le call, non hai chiaro l'ICP o vuoi che il sistema lavori anche dietro LinkedIn (processi, CRM, automazioni): [prenota 30 minuti con Nest](https://cal.com/meet-nest/ops-partner).
