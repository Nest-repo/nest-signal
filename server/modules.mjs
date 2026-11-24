// I moduli di Nest Signal: ognuno è un file di istruzioni in modules/ eseguito dall'AI scelta.
export const MODULES = [
  { id: "content-engine", name: "Content engine", desc: "Scrive 2-3 bozze complete nella tua voce, sui problemi veri del tuo target, ripetendo ciò che converte.", cron: "0 17 * * 1-5", browser: false, needs: [] },
  { id: "creative", name: "Creatività", desc: "Per ogni bozza crea un'immagine visuale col tuo template (infografica, non testo).", cron: "40 17 * * 1-5", browser: false, needs: ["python"] },
  { id: "daily-question", name: "Domanda del giorno", desc: "Ti fa una domanda al giorno: la risposta diventa materiale vero per i post.", cron: "15 8 * * 1-5", browser: false, needs: [] },
  { id: "voice-refresh", name: "Voce", desc: "Aggiorna il tuo modello di scrittura da post pubblicati e modifiche alle bozze.", cron: "0 9 * * 1", browser: false, needs: [] },
  { id: "performance", name: "Performance loop", desc: "Misura follower, visite profilo, commenti e lead di ogni post e scrive cosa converte.", cron: "40 8 * * 1,4", browser: true, needs: ["browser"] },
  { id: "hook-lab", name: "Hook Lab", desc: "Cerca su LinkedIn gli hook che funzionano e li valida sui tuoi dati.", cron: "30 9 * * 2", browser: true, needs: ["browser"] },
  { id: "competitor-radar", name: "Radar competitor", desc: "Ogni settimana legge cosa pubblicano i tuoi competitor e cosa funziona a loro, per posizionarti nella stessa nicchia senza copiarli.", cron: "0 10 * * 3", browser: true, needs: ["browser"] },
  { id: "comment-radar", name: "Radar commenti", desc: "Ti segnala i post freschi delle persone in target, con un angolo per commentare.", cron: "0 9,13,17 * * 1-5", browser: true, needs: ["browser"], optional: true },
];

export const SETUP_JOBS = {
  "test-ai": { name: "Prova dell'AI", file: null },
  "check-connections": { name: "Controllo connessioni", file: "setup/check-connections.md" },
  "draft-icp": { name: "Proposta ICP e target", file: "setup/draft-icp.md" },
  "draft-strategy": { name: "Strategia editoriale", file: "setup/draft-strategy.md" },
  "find-competitors": { name: "Trova i competitor", file: "setup/find-competitors.md" },
  "draft-voice": { name: "Modello comunicativo dai tuoi post", file: "setup/draft-voice.md" },
  "design-template": { name: "Template delle creatività", file: "setup/design-template.md" },
  "prefill-profilo": { name: "Profilo dalla knowledge base", file: "setup/prefill.md", page: "profilo" },
  "prefill-icp": { name: "ICP e target dalla knowledge base", file: "setup/prefill.md", page: "icp" },
  "prefill-voce": { name: "Modello comunicativo dalla knowledge base", file: "setup/prefill.md", page: "voce" },
  "prefill-creativita": { name: "Creatività dalla knowledge base", file: "setup/prefill.md", page: "creativita" },
};

export function moduleSettings(cfg) {
  return MODULES.map((m) => {
    const s = cfg.modules?.[m.id] || {};
    return { ...m, enabled: s.enabled ?? !m.optional, cron: s.cron || m.cron };
  });
}
