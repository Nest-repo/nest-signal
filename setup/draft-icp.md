# Setup — Proposta ICP e target

Obiettivo: proporre al cliente il suo ICP e i problemi che risolve, partendo da ciò che ha già scritto in `CONFIG.audience` e completando i buchi. **Non inventare**: ogni affermazione deve venire da una fonte che hai letto; dove non sai, lascia vuoto.

Fonti, in ordine:
1. `CONFIG.audience` (quello che ha già scritto: vince su tutto).
2. Il sito `CONFIG.owner.website` (home, servizi, casi, chi siamo).
3. Il profilo LinkedIn `CONFIG.owner.linkedin_url` (headline, about, ultimi 10 post) col browser di Nest Signal, in sola lettura.
4. Se `CONFIG.notion.crm_db` c'è: i clienti vinti e i lead migliori (settore, dimensione, ruolo di chi ha firmato).
5. Le ultime 5 call dalla fonte in `CONFIG.meetings` (se raggiungibile): le frasi con cui i clienti descrivono il problema.

Scrivi `DATA/drafts/draft-icp.json`:
```json
{"audience": {
  "icp": "<chi, in una riga>", "sector": "", "size": "", "decision_maker": "", "not_icp": "", "offer": "",
  "pains": [{"name": "<problema in 3-5 parole>", "mirror": "<come lo dice il cliente, verbatim se dalle call>", "cost": "<cosa gli costa>"}]
}, "fonti": ["<cosa hai letto>"], "dubbi": ["<cosa va chiesto al cliente>"]}
```
3-5 pain, ordinati per quanto tornano nelle fonti. Poi una riga di riepilogo.
