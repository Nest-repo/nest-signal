# Setup — Controllo connessioni

Verifica, senza modificare nulla, quali strumenti hai a disposizione e scrivi il risultato in `DATA/drafts/check-connections.json`:
`{"slack": true|false, "browser": true|false, "linkedin_login": true|false, "meetings": "<cosa riesci a leggere della fonte in CONFIG.meetings, o 'non raggiungibile'>", "note": "<cosa manca e come rimediare, in una riga per voce>"}`

- Slack: elenca un canale (solo se il connettore c'è).
- Browser: apri `https://www.linkedin.com/feed/` col browser di Nest Signal; `linkedin_login` è true solo se vedi il feed e non la pagina di login. Non cliccare nulla.
- Meeting: prova a leggere l'ultima call dalla fonte indicata in `CONFIG.meetings`.
Rispondi in fondo con una riga di riepilogo.
