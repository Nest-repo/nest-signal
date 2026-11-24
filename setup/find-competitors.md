# Setup — Trova i competitor del cliente

Proponi **3-6 competitor su LinkedIn**: persone o aziende che vendono a `CONFIG.audience.icp` qualcosa di simile a `CONFIG.audience.offer` (o che competono per la stessa attenzione) e che **pubblicano davvero** (almeno 2 post nell'ultimo mese). Non inventare: ogni proposta deve venire da una fonte letta.

## Dove cercare

1. La knowledge base del cliente (`CONFIG.knowledge`): documenti su concorrenza, posizionamento, alternative citate dai clienti nelle call.
2. Quello che la tua AI sa già del cliente (istruzioni e memoria).
3. Le call (`CONFIG.meetings`): alternative che i prospect nominano ("stiamo sentendo anche…").
4. LinkedIn col browser di Nest Signal (sola lettura): ricerca persone/aziende con le parole dell'offerta e del settore; controlla che pubblichino.

Salta chi è già in `CONFIG.competitors`.

## Risultato

Scrivi `DATA/drafts/competitors.json`:
```json
{"proposte": [{"name": "…", "url": "https://www.linkedin.com/in/… o /company/…", "perche": "<una riga: perché è un competitor>", "fonte": "<dove l'hai trovato>"}]}
```
Poi una riga di riepilogo. Non modificare `CONFIG`: il cliente sceglie nel pannello chi aggiungere.
