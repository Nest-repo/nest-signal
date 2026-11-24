# Prompt di installazione

Copia il testo qui sotto e incollalo nella tua AI da terminale (Claude Code, Codex, Gemini CLI…), aperta in una cartella dove vuoi tenere Nest Signal.

---

Installa e avvia **Nest Signal** sul mio computer, passo per passo, spiegandomi in una riga cosa fai prima di ogni comando. Parla in italiano.

1. **Controlla i requisiti**: `git`, **Node.js 20 o più** (`node -v`) e **Python 3** (`python3 --version`, serve per le immagini dei post). Se manca qualcosa, dimmi come installarlo sul mio sistema e aspetta il mio ok prima di installare.
2. **Scarica il progetto**:
   `git clone https://github.com/Nest-repo/nest-signal.git && cd nest-signal`
   Se GitHub chiede l'accesso, fermati e dimmelo: devo essere stato invitato al repository (oppure usare il link che mi ha mandato Nest).
3. **Installa**: `npm install` dentro la cartella `nest-signal`.
4. **Avvia l'onboarding**: `npm run onboard` in background, poi apri `http://127.0.0.1:3210` (nel browser integrato se lo hai, altrimenti nel mio browser).
5. **Accompagnami nell'onboarding**, che è guidato nel pannello:
   - *La tua AI*: scelgo quella che sto usando adesso; se non ha fatto l'accesso dal terminale, il pannello ha il bottone «Accedi».
   - *Chi sei, ICP, Come comunichi, Creatività*: ogni pagina ha «✦ Compila» che legge la mia knowledge base. Se sai già cose su di me (istruzioni, memoria, documenti in questa cartella), dimmelo così le usiamo.
   - *Connessioni*: il browser per LinkedIn (Playwright MCP con il profilo dedicato che il pannello mi indica) e dove registro le call.
6. **Alla fine** leggi `AGENTS.md` nella cartella `nest-signal`: da lì in poi gestisci tu il mio Piano editoriale quando te lo chiedo («fammi vedere i post della settimana», «accorcia il post di giovedì», «lancia l'Hook Lab adesso»).

Regole: i miei dati restano nella cartella `workspace/` sul mio computer; su LinkedIn Nest Signal lavora **solo in lettura** (mai pubblicare, commentare, mettere like o mandare messaggi); niente comandi con `sudo` senza chiedermelo. Il pannello resta acceso finché la finestra del terminale è aperta: dimmi come riaprirlo (`npm start` nella cartella).

---

Ti serve una mano a configurarlo, a registrare le call o a mettere a fuoco l'ICP? [Prenota 30 minuti con Nest](https://cal.com/meet-nest/ops-partner).
