# Nest Signal

**LinkedIn che porta call, senza scrivere da zero.** Nest Signal scrive le bozze nella tua voce partendo dai problemi veri dei tuoi clienti, crea l'immagine di ogni post, misura cosa porta follower, visite e lead, e ogni settimana migliora da solo. Tu approvi e pubblichi.

Costruito da [Nest](https://usanest.it), growth partner per founder che vogliono un sistema e non più ore.

## Come funziona

Un pannello locale (stile [Paperclip](https://github.com/paperclipai/paperclip)) con:
- **onboarding guidato nel browser**: la tua AI → chi sei → connessioni (Notion, browser, Slack, dove registri le call) → ICP e target (anche con proposta dell'AI) → modello comunicativo (l'AI legge i tuoi post) → **creatività** (carichi le tue reference o un file Figma e l'AI costruisce il **tuo** template: colori, font, cornice) → Piano Editoriale → moduli e orari;
- **scheduler interno**: i moduli partono ai loro orari finché il pannello è acceso; pausa, "esegui ora" e log di ogni giro;
- **la tua AI fa il lavoro**: Claude Code, OpenAI Codex CLI, Gemini CLI o qualsiasi comando che accetta un prompt (adapter).

```
 Strategia (tua) ──► Content engine ──► Piano Editoriale (Notion) ──► tu approvi e pubblichi
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
| Radar commenti | lun-ven 3 volte (opz.) | post freschi delle persone in target, con un angolo per commentare |

## Requisiti

- **Node.js 20+**
- **Una AI da terminale**, con login fatto: [Claude Code](https://docs.claude.com/en/docs/claude-code) (consigliato), [Codex CLI](https://github.com/openai/codex) o [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- **Notion** (Piano Editoriale), collegato alla tua AI come server MCP
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

## Dove stanno i dati

Tutto in `~/.nest-signal/` (cambia con `NEST_SIGNAL_HOME`): `config.json`, `data/` (strategia, problemi del target, voce, hook, risultati, diario), `runs/` (log), `browser/` (profilo del browser di Nest Signal). Niente esce dal tuo computer se non verso gli strumenti che colleghi tu.

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
| `setup/` | lavori dell'onboarding (proposta ICP, modello comunicativo, Notion, controllo connessioni) |
| `templates/` | file di partenza dei dati |
| `creative/` | motore delle infografiche (6 tipi) + contratto del template del cliente (`TEMPLATE.md`) |

## Ti serve una mano?

Se non registri le call, non hai chiaro l'ICP o vuoi che il sistema lavori anche dietro LinkedIn (processi, CRM, automazioni): [prenota 30 minuti con Nest](https://cal.com/meet-nest/ops-partner).
