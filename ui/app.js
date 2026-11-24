import { h, render } from "/vendor/preact.mjs";
import { useState, useEffect, useRef } from "/vendor/hooks.mjs";
import htm from "/vendor/htm.mjs";
import { marked } from "/vendor/marked.mjs";
const html = htm.bind(h);

// ---------- API ----------
async function api(path, opts = {}) {
  const r = await fetch(path, { ...opts, headers: { "Content-Type": "application/json", "X-Nest-Signal": "1", ...(opts.headers || {}) } });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
}
const post = (p, b) => api(p, { method: "POST", body: JSON.stringify(b || {}) });
const put = (p, b) => api(p, { method: "PUT", body: JSON.stringify(b || {}) });

function useHash() {
  const [hash, set] = useState(location.hash || "#/oggi");
  useEffect(() => { const f = () => set(location.hash || "#/oggi"); addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  return hash;
}

// ---------- utilità ----------
const DAYS = { "1-5": "lun-ven", "*": "ogni giorno", "1": "lun", "2": "mar", "3": "mer", "4": "gio", "5": "ven", "6": "sab", "0": "dom", "1,4": "lun e gio" };
function cronHuman(c) {
  const p = (c || "").trim().split(/\s+/);
  if (p.length !== 5) return c;
  const [m, hh, , , dw] = p;
  const hours = hh.split(",").map((x) => `${x.padStart(2, "0")}:${m.padStart(2, "0")}`).join(" · ");
  return `${DAYS[dw] || dw} ${hours}`;
}
const when = (iso) => iso ? new Date(iso).toLocaleString("it-IT", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
const pill = (s) => html`<span class=${"pill " + (s === "ok" ? "ok" : s === "errore" || s === "interrotto" ? "err" : s === "in corso" || s === "in coda" ? "run" : "")}>${s}</span>`;

function useJob() {
  // lancia un lavoro (modulo o setup) e ne segue lo stato
  const [run, setRun] = useState(null);
  const [log, setLog] = useState("");
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);
  const start = async (kind, target, onDone) => {
    const r = await post("/api/run", { kind, target });
    setRun(r); setLog("");
    clearInterval(timer.current);
    timer.current = setInterval(async () => {
      const all = await api("/api/runs");
      const cur = all.find((x) => x.id === r.id);
      const l = await api(`/api/runs/${r.id}/log`);
      setRun(cur); setLog(l.log);
      if (cur && !["in coda", "in corso"].includes(cur.status)) { clearInterval(timer.current); onDone && onDone(cur, l.log); }
    }, 2500);
  };
  return { run, log, start, busy: run && ["in coda", "in corso"].includes(run.status) };
}

function JobBox({ job, label }) {
  if (!job.run) return null;
  return html`<div class="card soft stack" style="margin-top:14px">
    <div class="row"><b>${label}</b> ${pill(job.run.status)} <span class="hint">${job.busy ? "L'AI sta lavorando: può volerci qualche minuto." : ""}</span></div>
    ${job.log && html`<pre class="log">${job.log.slice(-4000)}</pre>`}
  </div>`;
}

function NestCTA({ cfg, title, text, cta }) {
  return html`<div class="nest-cta">
    <div class="kicker">Nest · Growth partner</div>
    <h3 style="margin-top:8px">${title}</h3><p>${text}</p>
    <a class="btn accent" href=${cfg?.nest?.booking_url || "https://cal.com/meet-nest/ops-partner"} target="_blank" rel="noopener">${cta || "Prenota 30 minuti con Nest"} →</a>
  </div>`;
}

// ---------- ONBOARDING ----------
const STEPS = ["Benvenuto", "La tua AI", "Chi sei", "Connessioni", "ICP e target", "Come comunichi", "Creatività", "Piano Editoriale", "Moduli e orari", "Si parte"];

function Onboarding({ st, reload }) {
  const cfg = st.config;
  const [step, setStep] = useState(Math.min(cfg.onboarding.step || 0, STEPS.length - 1));
  const [draft, setDraft] = useState(cfg);
  const set = (path, value) => {
    const next = structuredClone(draft); let o = next; const k = path.split(".");
    k.slice(0, -1).forEach((x) => (o = o[x])); o[k.at(-1)] = value; setDraft(next);
  };
  const go = async (n, patch) => {
    await post("/api/config", { ...(patch || draft), onboarding: { step: n, done: false } });
    await reload(); setStep(n); scrollTo(0, 0);
  };
  const Body = [StepWelcome, StepAI, StepProfile, StepConnections, StepICP, StepVoice, StepCreative, StepNotion, StepModules, StepFinish][step];
  return html`<div class="ob">
    <aside class="ob-rail">
      <div class="brand"><img src="/brand/nest-logo.svg" alt="" />Nest Signal <small>by Nest</small></div>
      ${STEPS.map((s, i) => html`<div class=${"step " + (i < step ? "done" : i === step ? "on" : "")} onClick=${() => i < step && setStep(i)} style=${i < step ? "cursor:pointer" : ""}>
        <span class="dot">${i < step ? "✓" : i + 1}</span>${s}</div>`)}
      <div style="flex:1"></div>
      <p class="hint">Tutto resta sul tuo computer, in <span class="mono">${st.home}</span>.</p>
    </aside>
    <main class="ob-main">
      <${Body} st=${st} cfg=${cfg} draft=${draft} set=${set} setDraft=${setDraft} reload=${reload} next=${(patch) => go(step + 1, patch)} />
      ${step > 0 && step < STEPS.length - 1 && html`<div class="ob-foot"><button class="btn ghost" onClick=${() => setStep(step - 1)}>← Indietro</button><span class="hint">Passo ${step + 1} di ${STEPS.length}</span></div>`}
    </main>
  </div>`;
}

function StepWelcome({ cfg, next }) {
  return html`<div class="stack">
    <div class="kicker">Benvenuto</div>
    <h1>LinkedIn che porta call,<br/><em>senza scrivere da zero.</em></h1>
    <p style="font-size:19px;max-width:620px">Nest Signal scrive le bozze nella tua voce partendo dai problemi veri dei tuoi clienti, crea l'immagine di ogni post, misura cosa porta follower, visite e lead, e ogni settimana migliora da solo. Tu approvi e pubblichi.</p>
    <div class="cards">
      <div class="card feature"><span class="n">1</span><h3>10 minuti</h3><p class="hint">Colleghiamo la tua AI, Notion, il browser e dove registri le call.</p></div>
      <div class="card feature"><span class="n">2</span><h3>Ti conosce</h3><p class="hint">Mappiamo ICP, target e il tuo modo di comunicare, con l'AI che legge i tuoi post.</p></div>
      <div class="card feature"><span class="n">3</span><h3>Gira da solo</h3><p class="hint">Le routine partono agli orari che scegli. Niente viene pubblicato senza di te.</p></div>
    </div>
    <div class="row" style="margin-top:28px"><button class="btn accent" onClick=${() => next()}>Iniziamo →</button></div>
    <p class="hint" style="margin-top:22px">Costruito da Nest, growth partner per founder che vogliono un sistema e non più ore. <a href=${cfg.nest.site} target="_blank" rel="noopener">usanest.it</a></p>
  </div>`;
}

function StepAI({ st, draft, set, next }) {
  const [det, setDet] = useState(null);
  const job = useJob();
  useEffect(() => { api("/api/detect").then(setDet); }, []);
  const ok = job.run?.status === "ok" && /NEST SIGNAL OK/.test(job.log);
  return html`<div class="stack">
    <div class="kicker">Passo 2 · Motore</div>
    <h2>Quale AI fa il lavoro?</h2>
    <p class="hint">Nest Signal non ha un'AI sua: usa quella che hai già, dal terminale. Il pannello la lancia agli orari dei moduli.</p>
    ${!det ? html`<p class="hint">Cerco le AI installate…</p>` : Object.entries(st.adapters).map(([id, a]) => {
      const d = det[id]; const on = draft.ai.adapter === id;
      return html`<label class=${"choice " + (on ? "on" : "")}>
        <input type="radio" name="ai" checked=${on} onChange=${() => set("ai.adapter", id)} />
        <div style="flex:1"><b>${a.label}</b> ${id !== "custom" && (d?.installed ? html`<span class="pill ok">installata ${d.version}</span>` : html`<span class="pill">non trovata</span>`)}
          ${id !== "custom" && !d?.installed && a.install && html`<p class="hint">Installala da <a href=${a.install} target="_blank" rel="noopener">${a.install}</a>, poi ricarica.</p>`}
          ${id === "custom" && html`<p class="hint">Qualsiasi CLI che accetta un prompt. Scrivi il comando con <span class="mono">{prompt}</span> dove va il testo.</p>`}
          ${id === "custom" && on && html`<input placeholder="es. opencode run '{prompt}'" value=${draft.ai.custom_command} onInput=${(e) => set("ai.custom_command", e.target.value)} />`}
        </div></label>`;
    })}
    <label class=${"choice " + (draft.ai.unattended ? "on" : "")}>
      <input type="checkbox" checked=${draft.ai.unattended} onChange=${(e) => set("ai.unattended", e.target.checked)} />
      <div><b>Esecuzione senza conferme</b><p class="hint">Le routine girano mentre non ci sei: l'AI usa i suoi strumenti (file, Notion, browser) senza chiederti il permesso a ogni passo. Le istruzioni dei moduli vietano di pubblicare, commentare o scrivere su LinkedIn. Se lo togli, l'AI potrebbe fermarsi ad aspettare una conferma.</p></div>
    </label>
    <div class="row" style="margin-top:18px">
      <button class="btn ghost" disabled=${job.busy} onClick=${async () => { await post("/api/config", { ai: draft.ai }); job.start("setup", "test-ai"); }}>Prova il collegamento</button>
      ${ok && html`<span class="pill ok">funziona</span>`}
    </div>
    <${JobBox} job=${job} label="Prova dell'AI" />
    ${job.run?.status && !job.busy && /not logged in|log ?in|login|unauthori[sz]ed|api key/i.test(job.log) && !ok && html`<div class="card" style="border:1.5px solid var(--accent)"><h3>L'AI non ha fatto l'accesso</h3><p class="hint">${st.adapters[draft.ai.adapter]?.login || "Fai il login nella tua AI dal terminale, poi riprova."}</p></div>`}
    <div class="row" style="margin-top:22px"><button class="btn accent" onClick=${() => next({ ai: draft.ai })}>Continua →</button>${!ok && html`<span class="hint">Consigliato: prova prima il collegamento.</span>`}</div>
  </div>`;
}

function StepProfile({ draft, set, next }) {
  const o = draft.owner;
  const upload = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => post("/api/avatar", { dataUrl: r.result }).then(() => set("owner.avatar", "ok")); r.readAsDataURL(f);
  };
  return html`<div class="stack">
    <div class="kicker">Passo 3 · Profilo</div>
    <h2>Chi pubblica?</h2>
    <div class="grid2">
      <div><label>Nome e cognome</label><input value=${o.name} onInput=${(e) => set("owner.name", e.target.value)} /></div>
      <div><label>Ruolo (va sotto il nome nelle creatività)</label><input placeholder="es. Founder, Acme" value=${o.role} onInput=${(e) => set("owner.role", e.target.value)} /></div>
      <div><label>Azienda</label><input value=${o.company} onInput=${(e) => set("owner.company", e.target.value)} /></div>
      <div><label>Sito</label><input placeholder="https://" value=${o.website} onInput=${(e) => set("owner.website", e.target.value)} /></div>
      <div><label>Profilo LinkedIn</label><input placeholder="https://www.linkedin.com/in/…" value=${o.linkedin_url} onInput=${(e) => set("owner.linkedin_url", e.target.value)} /></div>
      <div><label>Lingua dei post</label><select value=${o.language} onChange=${(e) => set("owner.language", e.target.value)}><option value="it">Italiano</option><option value="en">English</option></select></div>
    </div>
    <label>Foto (per la firma delle creatività)</label>
    <div class="row">${o.avatar && html`<img src=${"/avatar?" + Date.now()} style="width:56px;height:56px;border-radius:50%;object-fit:cover" />`}<input type="file" accept="image/png,image/jpeg" onChange=${upload} style="width:auto" /></div>
    <div class="row" style="margin-top:22px"><button class="btn accent" disabled=${!o.name || !o.linkedin_url} onClick=${() => next({ owner: draft.owner })}>Continua →</button></div>
  </div>`;
}

const MEETING_SOURCES = [
  ["notion", "Notion (database dei meeting)"], ["granola", "Granola"], ["fireflies", "Fireflies"], ["notta", "Notta"], ["tldv", "tl;dv"],
  ["drive", "Google Drive / Meet (transcript)"], ["altro", "Altro strumento"], ["nessuno", "Non registro le call"],
];

function StepConnections({ st, cfg, draft, set, next }) {
  const [mcp, setMcp] = useState(null);
  const ad = draft.ai.adapter; const prof = st.home + "/browser";
  const check = async () => { setMcp({ text: "Controllo…" }); setMcp(await api("/api/mcp")); };
  const has = (n) => mcp?.text && new RegExp(n, "i").test(mcp.text);
  const cmds = ad === "claude" ? [
    ["Notion (obbligatorio)", "claude mcp add --scope user --transport http notion https://mcp.notion.com/mcp", "Poi apri claude nel terminale, scrivi /mcp e completa il login a Notion."],
    ["Browser per LinkedIn", `claude mcp add --scope user playwright -- npx -y @playwright/mcp@latest --user-data-dir "${prof}"`, "Usa un profilo browser dedicato: fai login a LinkedIn una volta col pulsante qui sotto."],
    ["Slack (facoltativo, per i report)", "Aggiungi il connettore Slack della tua organizzazione (claude mcp add …) oppure lascia vuoto: i report andranno in una pagina Notion.", ""],
  ] : ad === "codex" ? [
    ["Notion e browser in ~/.codex/config.toml", `[mcp_servers.notion]\nurl = "https://mcp.notion.com/mcp"\n\n[mcp_servers.playwright]\ncommand = "npx"\nargs = ["-y", "@playwright/mcp@latest", "--user-data-dir", "${prof}"]`, "Poi esegui codex mcp login notion (o segui la guida di Codex per i server remoti)."],
  ] : [["Server MCP", `Configura nella tua AI: Notion (https://mcp.notion.com/mcp) e Playwright MCP con --user-data-dir "${prof}".`, ""]];
  return html`<div class="stack">
    <div class="kicker">Passo 4 · Connessioni</div>
    <h2>Colleghiamo i tuoi sistemi</h2>
    <p class="hint">L'AI lavora con i connettori che le dai. Copia i comandi nel terminale, poi verifica.</p>
    ${cmds.map(([t, c, n]) => html`<div class="card"><h3>${t}</h3><code class="cmd">${c}</code>${n && html`<p class="hint">${n}</p>`}</div>`)}
    <div class="row"><button class="btn ghost" onClick=${check}>Verifica connessioni</button>
      <button class="btn ghost" onClick=${() => post("/api/browser-login").then(() => alert("Si apre una finestra del browser di Nest Signal: fai login a LinkedIn e poi chiudila."))}>Apri il browser e fai login a LinkedIn</button></div>
    ${mcp && html`<div class="card">${["notion", "playwright", "slack"].map((n) => html`<div class="check"><span class=${"s " + (has(n) ? "ok" : "no")}>${has(n) ? "✓" : "!"}</span><b style="text-transform:capitalize">${n}</b><span class="hint">${has(n) ? "trovato" : n === "slack" ? "facoltativo" : "non trovato"}</span></div>`)}
      <details><summary class="hint">Risposta completa</summary><pre class="log">${mcp.text}</pre></details></div>`}

    <h2 style="margin-top:30px">Dove registri le call?</h2>
    <p class="hint">Le call sono la miniera migliore: i clienti dicono i loro problemi con le loro parole, e tu parli come scrivi.</p>
    ${MEETING_SOURCES.map(([id, l]) => html`<label class=${"choice " + (draft.meetings.source === id ? "on" : "")}><input type="radio" name="ms" checked=${draft.meetings.source === id} onChange=${() => set("meetings.source", id)} /><b>${l}</b></label>`)}
    ${draft.meetings.source && draft.meetings.source !== "nessuno" && html`<div><label>Dove li trovo? (link al database Notion, cartella Drive, nome dello spazio…)</label><input value=${draft.meetings.details} onInput=${(e) => set("meetings.details", e.target.value)} /><p class="hint">Assicurati che la tua AI abbia il connettore giusto (es. Notion, Granola, Google Drive).</p></div>`}
    ${draft.meetings.source === "nessuno" && html`<${NestCTA} cfg=${cfg} title="Senza call registrate il sistema scrive alla cieca." text="È la prima cosa che impostiamo con i clienti Nest: registrazione, trascrizione e un database delle call che alimenta vendite e contenuti. In 30 minuti vediamo come farlo da te." cta="Impostiamolo insieme" />`}
    <div class="row" style="margin-top:22px"><button class="btn accent" disabled=${!draft.meetings.source} onClick=${() => next({ meetings: draft.meetings })}>Continua →</button></div>
  </div>`;
}

function painMd(pains) {
  return "# Mappa dei problemi del target\n\n<!-- Dall'onboarding. Il content engine la arricchisce con le frasi vere delle call. -->\n\n" +
    pains.filter((p) => p.name).map((p, i) => `## Pain ${i + 1} — ${p.name}\n- **Frase-specchio**: «${p.mirror || ""}»\n- **Cosa costa**: ${p.cost || "da completare"}\n- **Citazioni vere**: (dalle call)\n`).join("\n");
}

function StepICP({ cfg, draft, set, setDraft, next }) {
  const a = draft.audience; const pains = a.pains?.length ? a.pains : [{}, {}, {}];
  const job = useJob();
  const setPain = (i, k, v) => { const p = pains.map((x) => ({ ...x })); p[i][k] = v; set("audience.pains", p); };
  const ai = async () => {
    await post("/api/config", { owner: draft.owner, audience: draft.audience });
    job.start("setup", "draft-icp", async (r) => {
      const d = await api("/api/drafts/draft-icp");
      if (d?.audience) setDraft({ ...draft, audience: { ...draft.audience, ...Object.fromEntries(Object.entries(d.audience).filter(([, v]) => v && (!Array.isArray(v) || v.length))) } });
    });
  };
  return html`<div class="stack">
    <div class="kicker">Passo 5 · ICP e target</div>
    <h2>A chi parli, e di che problema?</h2>
    <p class="hint">Scrivi quello che sai: l'AI può proporre il resto leggendo il tuo sito, il tuo profilo e (se c'è) il tuo CRM. Poi correggi tu.</p>
    <div class="row"><button class="btn ghost" disabled=${job.busy} onClick=${ai}>✦ Fammi una proposta con l'AI</button></div>
    <${JobBox} job=${job} label="Proposta ICP" />
    <label>Il tuo cliente ideale, in una riga</label><input placeholder="es. Founder di agenzie B2B da 15-30 persone che non reggono più il ritmo" value=${a.icp} onInput=${(e) => set("audience.icp", e.target.value)} />
    <div class="grid2">
      <div><label>Settore</label><input value=${a.sector} onInput=${(e) => set("audience.sector", e.target.value)} /></div>
      <div><label>Dimensione (persone, fatturato)</label><input value=${a.size} onInput=${(e) => set("audience.size", e.target.value)} /></div>
      <div><label>Chi decide l'acquisto</label><input value=${a.decision_maker} onInput=${(e) => set("audience.decision_maker", e.target.value)} /></div>
      <div><label>Chi NON è il tuo target</label><input value=${a.not_icp} onInput=${(e) => set("audience.not_icp", e.target.value)} /></div>
      <div><label>Cosa vendi, in una riga</label><input value=${a.offer} onInput=${(e) => set("audience.offer", e.target.value)} /></div>
      <div><label>Cosa conta come successo</label><select value=${a.goal} onChange=${(e) => set("audience.goal", e.target.value)}><option>call prenotate</option><option>lead in entrata</option><option>follower in target</option></select></div>
    </div>
    <h3 style="margin-top:22px">I 3-5 problemi che risolvi</h3>
    <p class="hint">Per ognuno: come lo direbbe il tuo cliente, con le sue parole. È la cosa più importante dell'onboarding.</p>
    ${pains.map((p, i) => html`<div class="card" style="margin-top:10px"><div class="grid2">
      <div><label>Problema ${i + 1}</label><input placeholder="es. Il follow-up dei lead" value=${p.name || ""} onInput=${(e) => setPain(i, "name", e.target.value)} /></div>
      <div><label>Come lo dice il cliente</label><input placeholder="«Il CRM lo aggiorno quando mi ricordo»" value=${p.mirror || ""} onInput=${(e) => setPain(i, "mirror", e.target.value)} /></div></div>
      <label>Cosa gli costa</label><input placeholder="ore, soldi, clienti persi…" value=${p.cost || ""} onInput=${(e) => setPain(i, "cost", e.target.value)} /></div>`)}
    ${pains.length < 5 && html`<button class="btn ghost small" style="margin-top:10px" onClick=${() => set("audience.pains", [...pains, {}])}>+ Aggiungi un problema</button>`}
    <${NestCTA} cfg=${cfg} title="Non hai chiaro il tuo ICP?" text="È il punto da cui partono tutti i progetti Nest: in una call mappiamo chi compra davvero, perché e con quali parole. Il sistema poi parte da lì." cta="Mappiamo l'ICP insieme" />
    <div class="row" style="margin-top:22px"><button class="btn accent" disabled=${!a.icp || !pains.some((p) => p.name)} onClick=${async () => { await put("/api/data/pain-map.md", { content: painMd(pains) }); next({ audience: { ...a, pains } }); }}>Continua →</button></div>
  </div>`;
}

function StepVoice({ draft, set, next }) {
  const v = draft.voice; const job = useJob();
  const [persona, setPersona] = useState("");
  useEffect(() => { api("/api/data/persona.md").then((d) => setPersona(d.content)); }, []);
  const read = async () => { await post("/api/config", { owner: draft.owner, voice: draft.voice }); job.start("setup", "draft-voice", async () => setPersona((await api("/api/data/persona.md")).content)); };
  return html`<div class="stack">
    <div class="kicker">Passo 6 · Modello comunicativo</div>
    <h2>Come parli tu</h2>
    <p class="hint">L'AI legge i tuoi ultimi post su LinkedIn (dal browser di Nest Signal) e scrive il tuo modello di scrittura. Lo correggi qui sotto.</p>
    <div class="grid2">
      <div><label>Profili che scrivono bene per il tuo pubblico (handle LinkedIn, separati da virgola)</label><input placeholder="es. virgit, andrenogueira3" value=${(draft.hook_lab.reference_creators || []).join(", ")} onInput=${(e) => set("hook_lab.reference_creators", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></div>
      <div><label>Lunghezza dei post</label><select value=${v.length} onChange=${(e) => set("voice.length", e.target.value)}><option value="300-600">Corti (300-600 caratteri)</option><option value="500-1000">Medi (500-1.000)</option><option value="1000-1500">Lunghi (1.000-1.500)</option></select></div>
    </div>
    <label>Cosa non dici mai (toni, parole, argomenti)</label><input placeholder="es. niente frasi da guru, niente emoji nell'hook, mai prezzi" value=${v.never} onInput=${(e) => set("voice.never", e.target.value)} />
    <div class="row" style="margin-top:12px"><button class="btn ghost" disabled=${job.busy} onClick=${read}>✦ Leggi i miei post e scrivi il mio modello</button></div>
    <${JobBox} job=${job} label="Modello comunicativo" />
    <label>Il tuo modello di scrittura (persona.md)</label><textarea style="min-height:260px" value=${persona} onInput=${(e) => setPersona(e.target.value)}></textarea>
    <div class="row" style="margin-top:22px"><button class="btn accent" onClick=${async () => { await put("/api/data/persona.md", { content: persona }); next({ voice: v, hook_lab: draft.hook_lab }); }}>Continua →</button></div>
  </div>`;
}

const img = (p) => "/creative-img?p=" + encodeURIComponent(p);

function StepCreative({ cfg, draft, set, next }) {
  const c = draft.creative; const job = useJob();
  const [refs, setRefs] = useState([]); const [res, setRes] = useState(null); const [fb, setFb] = useState(""); const [up, setUp] = useState(false);
  const loadRefs = () => api("/api/references").then(setRefs);
  useEffect(() => { loadRefs(); api("/api/drafts/design-template").then(setRes); }, []);
  const upload = async (files) => {
    setUp(true);
    for (const f of files) {
      if (f.size > 5.5e6) { alert(`${f.name}: massimo 5 MB per file`); continue; }
      const dataUrl = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });
      await post("/api/references", { name: f.name, dataUrl }).catch((e) => alert(`${f.name}: ${e.message}`));
    }
    setUp(false); loadRefs();
  };
  const build = async (feedback) => {
    const creative = { ...c, feedback: feedback ? [...(c.feedback || []), `${new Date().toLocaleDateString("it-IT")}: ${feedback}`] : c.feedback || [], approved: false };
    set("creative", creative); await post("/api/config", { owner: draft.owner, creative }); setRes(null); setFb("");
    job.start("setup", "design-template", async () => setRes(await api("/api/drafts/design-template")));
  };
  const enough = refs.length > 0 || c.figma_url;
  return html`<div class="stack">
    <div class="kicker">Passo 7 · Creatività</div>
    <h2>Le tue creatività, non quelle di un kit</h2>
    <p class="hint">Ogni post esce con un'immagine. Per farla tua, partiamo dalle tue reference: la tua brand identity, grafiche che hai già, post di altri che ti piacciono, oppure un file Figma. L'AI ne ricava colori, font e stile e costruisce il tuo template.</p>
    <div class="card">
      <h3>Carica le reference</h3>
      <p class="hint">Immagini o PDF (max 5 MB l'uno): logo, brand book, 3-6 grafiche o post che ti rappresentano.</p>
      <label class="choice" style="justify-content:center;border-style:dashed;padding:26px"><input type="file" multiple accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf" style="display:none" onChange=${(e) => upload([...e.target.files])} /><b>${up ? "Carico…" : "Scegli i file"}</b></label>
      ${refs.length > 0 && html`<div class="row" style="margin-top:12px">${refs.map((r) => html`<div style="position:relative">
        ${/\.(png|jpe?g|webp|svg)$/i.test(r.name) ? html`<img src=${img(r.path)} style="width:96px;height:96px;object-fit:cover;border-radius:10px;border:1px solid var(--line)" />` : html`<div class="card soft" style="width:96px;height:96px;padding:8px;font-size:12px">${r.name.split(".").pop().toUpperCase()}</div>`}
        <button class="btn small ghost" style="position:absolute;top:-8px;right:-8px;padding:2px 8px;background:#fff" onClick=${() => post("/api/references/delete", { name: r.name }).then(loadRefs)} aria-label="togli">×</button></div>`)}</div>`}
      <label>Oppure un file Figma (link al file o al frame)</label><input placeholder="https://www.figma.com/design/…" value=${c.figma_url} onInput=${(e) => set("creative.figma_url", e.target.value)} />
      <p class="hint">Per leggere Figma la tua AI deve avere il connettore Figma. In alternativa esporta i frame in PNG e caricali qui sopra.</p>
      <label>Cosa ti piace, cosa evitare</label><input placeholder="es. tanto spazio bianco, niente gradienti, il blu del logo solo come accento" value=${c.notes} onInput=${(e) => set("creative.notes", e.target.value)} />
      <div class="row" style="margin-top:14px"><button class="btn accent" disabled=${!enough || job.busy} onClick=${() => build()}>✦ Crea il mio template</button>${!enough && html`<span class="hint">Carica almeno una reference o un link Figma.</span>`}</div>
    </div>
    <${JobBox} job=${job} label="Template delle creatività" />
    ${res && html`<div class="card stack">
      <div class="kicker">Il tuo stile</div><h3>${res.stile}</h3><p class="hint">${res.sintesi}</p>
      ${res.scelte?.length > 0 && html`<ul class="hint">${res.scelte.map((s) => html`<li>${s}</li>`)}</ul>`}
      <div class="row" style="align-items:flex-start">${(res.anteprime || []).map((p) => html`<a href=${img(p)} target="_blank"><img src=${img(p) + "&t=" + Date.now()} style="width:230px;border-radius:12px;border:1px solid var(--line)" /></a>`)}</div>
      ${res.dubbi?.length > 0 && html`<p class="hint">Da chiarire: ${res.dubbi.join(" · ")}</p>`}
      <label>Non ti convince? Dimmi cosa cambiare</label><input placeholder="es. titolo più grande, meno arancio, firma in alto" value=${fb} onInput=${(e) => setFb(e.target.value)} />
      <div class="row"><button class="btn accent" onClick=${() => { set("creative.approved", true); next({ creative: { ...c, approved: true } }); }}>Mi piace, usalo →</button>
        <button class="btn ghost" disabled=${!fb.trim() || job.busy} onClick=${() => build(fb.trim())}>Rifallo con questa nota</button></div>
    </div>`}
    <${NestCTA} cfg=${cfg} title="Vuoi un template disegnato su misura?" text="Il designer di Nest può costruire con te un sistema visivo per i tuoi contenuti, che poi Nest Signal usa in automatico." cta="Parliamone" />
    <div class="row" style="margin-top:12px"><button class="btn ghost small" onClick=${() => next({ creative: c })}>Salta per ora (le creatività restano spente)</button></div>
  </div>`;
}

function StepNotion({ draft, set, setDraft, next }) {
  const n = draft.notion; const job = useJob();
  const create = async () => { await post("/api/config", { notion: n }); job.start("setup", "notion-setup", async () => { const s = await api("/api/status"); setDraft({ ...draft, notion: s.config.notion }); }); };
  return html`<div class="stack">
    <div class="kicker">Passo 8 · Notion</div>
    <h2>Il Piano Editoriale</h2>
    <p class="hint">È dove arrivano le bozze con la loro immagine, e dove approvi. Se ne hai già uno lo adattiamo aggiungendo solo le colonne che mancano.</p>
    <label>Database esistente (facoltativo)</label><input placeholder="link al database Notion, oppure lascia vuoto per crearlo" value=${n.editorial_db} onInput=${(e) => set("notion.editorial_db", e.target.value)} />
    <label>CRM in Notion (facoltativo: serve per collegare i lead ai post)</label><input placeholder="link al database del CRM" value=${n.crm_db} onInput=${(e) => set("notion.crm_db", e.target.value)} />
    <label>Canale Slack per i report (facoltativo)</label><input placeholder="ID canale, es. C0123ABC" value=${draft.delivery.slack_channel} onInput=${(e) => set("delivery.slack_channel", e.target.value)} />
    <div class="row" style="margin-top:12px"><button class="btn ghost" disabled=${job.busy} onClick=${create}>✦ ${n.editorial_db ? "Adatta il database" : "Crea il Piano Editoriale"}</button></div>
    <${JobBox} job=${job} label="Notion" />
    <div class="row" style="margin-top:22px"><button class="btn accent" onClick=${() => next({ notion: draft.notion, delivery: draft.delivery })}>Continua →</button></div>
  </div>`;
}

function StepModules({ st, draft, set, next }) {
  const mods = st.modules;
  const get = (id, k, d) => draft.modules?.[id]?.[k] ?? d;
  const setM = (id, k, v) => set("modules", { ...(draft.modules || {}), [id]: { ...(draft.modules?.[id] || {}), [k]: v } });
  return html`<div class="stack">
    <div class="kicker">Passo 9 · Moduli</div>
    <h2>Cosa gira, e quando</h2>
    <p class="hint">Orari in formato cron (minuto ora giorno mese giorno-settimana). Girano finché il pannello resta acceso.</p>
    <div class="cards">${mods.map((m) => { const on = get(m.id, "enabled", m.enabled); return html`<div class="card module">
      <h3>${m.name}<button class=${"toggle " + (on ? "on" : "")} onClick=${() => setM(m.id, "enabled", !on)} aria-label="attiva"></button></h3>
      <p class="hint">${m.desc}</p>
      <label>Orario · <span class="hint">${cronHuman(get(m.id, "cron", m.cron))}</span></label><input class="mono" value=${get(m.id, "cron", m.cron)} onInput=${(e) => setM(m.id, "cron", e.target.value)} />
      ${m.browser && html`<p class="hint">Usa il browser di Nest Signal (LinkedIn), in sola lettura.</p>`}
    </div>`; })}</div>
    <div class="row" style="margin-top:22px"><button class="btn accent" onClick=${() => next({ modules: draft.modules })}>Continua →</button></div>
  </div>`;
}

function strategyMd(c) {
  const a = c.audience;
  return `# Strategia LinkedIn\n\n<!-- Generata dall'onboarding il ${new Date().toLocaleDateString("it-IT")}. Modificala dal pannello (Strategia): è la fonte delle regole editoriali. -->\n\n## Obiettivo\n- ${a.goal}. Ogni post si misura su follower, visite al profilo, commenti e lead, poi sulle impression.\n\n## Target\n- **Chi**: ${a.icp}\n- Settore: ${a.sector || "—"} · Dimensione: ${a.size || "—"} · Decide: ${a.decision_maker || "—"}\n- **Non è il target**: ${a.not_icp || "—"}\n- **Cosa vendo**: ${a.offer || "—"} (mai in ogni post)\n\n## La settimana\n| Giorno | Funzione |\n|---|---|\n| lun | Reach — il problema riconoscibile |\n| mar | Connection — persona e processo |\n| mer | Authority — un caso con un numero |\n| gio | Conversion — il prossimo passo ovvio |\n\n## Come si scrive\n- Lunghezza ${c.voice.length} caratteri, una idea per post, prima persona: mostrare come lavoro, non insegnare.\n- Hook come frase normale, con posta in gioco (vedi hook-library.md sezione 0).\n- Mai: ${c.voice.never || "—"}\n\n## CTA ammesse\n- ${c.voice.cta.join("\n- ")}\n\n## Creatività\n- Visuali, non testuali: il testo è già nel post. Template con i colori del brand.\n`;
}

function StepFinish({ st, cfg, reload }) {
  const [busy, setBusy] = useState(false);
  const finish = async (runFirst) => {
    setBusy(true);
    const cur = (await api("/api/data/strategy.md")).content;
    if (!cur || cur.includes("<!-- TEMPLATE -->") || cur.length < 400) await put("/api/data/strategy.md", { content: strategyMd(cfg) });
    await post("/api/onboarding/finish");
    if (runFirst) { await post("/api/run", { kind: "module", target: "performance" }); await post("/api/run", { kind: "module", target: "content-engine" }); }
    await reload(); location.hash = "#/oggi";
  };
  return html`<div class="stack">
    <div class="kicker">Fatto</div>
    <h1>Il sistema è pronto.<br/><em>Ora lavora lui.</em></h1>
    <p style="font-size:18px">Le routine partono agli orari scelti finché il pannello resta acceso. Le bozze arrivano nel Piano Editoriale con la loro immagine: tu approvi e pubblichi.</p>
    <div class="row" style="margin-top:20px">
      <button class="btn accent" disabled=${busy} onClick=${() => finish(true)}>Avvia e fai il primo giro adesso</button>
      <button class="btn ghost" disabled=${busy} onClick=${() => finish(false)}>Vai al pannello</button>
    </div>
    <div style="margin-top:30px"><${NestCTA} cfg=${cfg} title="Vuoi che il sistema lavori anche dietro LinkedIn?" text="Nest progetta e gestisce il sistema operativo della tua azienda: processi, CRM, automazioni, reporting. Nest Signal è un pezzo di come lavoriamo." cta="Parliamone" /></div>
  </div>`;
}

// ---------- PANNELLO (layout Comperio: top bar + sidebar, testata a blocco, card ariose, liste a righe) ----------
const P = {
  oggi: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/>',
  moduli: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  strategia: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  risultati: '<path d="M4 4v16h16"/><path d="m7.5 14 3.5-4 3 3 4.5-6"/>',
  attivita: '<path d="M4 12h3.5l2.5-6 4 12 2.5-6H20"/>',
  impostazioni: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  orologio: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calendario: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  play: '<path d="M7 5v14l11-7z"/>',
  log: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12h6M9 16h6"/>',
  browser: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M3 9h18"/>',
  freccia: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chat: '<path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 21l1.4-4.6A8.5 8.5 0 1 1 20.5 12z"/>',
};
const I = (n) => html`<svg class="i" viewBox="0 0 24 24" dangerouslySetInnerHTML=${{ __html: P[n] || "" }}></svg>`;
const NAV = [["#/oggi", "Oggi", "oggi"], ["#/moduli", "Moduli", "moduli"], ["#/strategia", "Strategia", "strategia"], ["#/risultati", "Risultati", "risultati"], ["#/attivita", "Attività", "attivita"], ["#/impostazioni", "Impostazioni", "impostazioni"]];
const initials = (n) => (n || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function Shell({ st, hash, children }) {
  const o = st.config.owner;
  return html`<div class="app">
    <header class="topnav">
      <div class="brand"><img src="/brand/nest-logo.svg" alt="" />Nest Signal <small>by Nest</small></div>
      <div class="user">
        ${st.running.length > 0 && html`<span class="pill run">al lavoro: ${st.running.map((r) => r.target).join(", ")}</span>`}
        <span class="av">${o.avatar ? html`<img src="/avatar" alt="" />` : initials(o.name)}</span>
        <div class="who"><b>${o.name || "—"}</b><span>${o.role || o.company || ""}</span></div>
      </div>
    </header>
    <div class="shell">
      <aside class="side">
        ${NAV.map(([href, l, ic]) => html`<a class=${"nav " + (hash.startsWith(href) ? "on" : "")} href=${href}>${I(ic)}${l}</a>`)}
        <div class="grow"></div>
        <div class="help"><b>Ti serve una mano?</b><p>Nest imposta il sistema con te: call registrate, ICP, CRM.</p>
          <a class="btn small dark" href=${st.config.nest.booking_url} target="_blank" rel="noopener">Prenota una call</a></div>
      </aside>
      <main class="main">${children}</main>
    </div>
  </div>`;
}

function Hero({ kicker, title, text, children }) {
  return html`<section class="hero"><div><div class="kicker">${kicker}</div><h1>${title}</h1>${text && html`<p>${text}</p>`}</div>${children && html`<div class="row">${children}</div>`}</section>`;
}

function Question() {
  const [q, setQ] = useState(undefined); const [a, setA] = useState(""); const [done, setDone] = useState(false);
  useEffect(() => { api("/api/question").then(setQ); }, []);
  return html`<div class="card">
    <h3>${I("chat")} Domanda del giorno</h3>
    ${!q?.domanda ? html`<p class="hint">Arriva alla prossima esecuzione del modulo.</p>` : html`
      <p style="font-size:17px;margin-top:12px">${q.domanda}</p>
      ${done ? html`<p class="hint" style="margin-top:10px">Grazie: diventa materiale per i prossimi post.</p>` : html`
        <textarea style="font-family:var(--sans);font-size:15px;min-height:96px;margin-top:12px" placeholder="Due righe, come le diresti a voce" value=${a} onInput=${(e) => setA(e.target.value)}></textarea>
        <div class="row" style="margin-top:12px"><button class="btn primary small" disabled=${!a.trim()} onClick=${() => post("/api/answer", { domanda: q.domanda, risposta: a }).then(() => setDone(true))}>Rispondi</button></div>`}`}
  </div>`;
}

function Today({ st }) {
  const [feed, setFeed] = useState(null);
  useEffect(() => { api("/api/feed").then(setFeed); }, []);
  const next = [...st.modules].filter((m) => m.enabled && m.next_run).sort((a, b) => a.next_run.localeCompare(b.next_run));
  const first = st.config.owner.name.split(" ")[0] || "";
  return html`<div>
    <${Hero} kicker="Oggi" title=${html`Ciao ${first}, <em>ecco cosa c'è da guardare.</em>`} text="Le bozze arrivano nel tuo Piano Editoriale con la loro immagine: tu approvi e pubblichi.">
      ${next[0] && html`<span class="chip">${I("orologio")} prossimo: ${next[0].name} · ${when(next[0].next_run)}</span>`}
      ${st.config.notion.editorial_db && html`<a class="btn primary" href=${st.config.notion.editorial_db.startsWith("http") ? st.config.notion.editorial_db : "https://www.notion.so"} target="_blank" rel="noopener">Apri il Piano Editoriale ${I("freccia")}</a>`}
    <//>
    <div class="cols">
      <div class="card">
        <h2>Cosa ha fatto il sistema</h2>
        ${!feed ? html`<p class="hint">Carico…</p>` : !feed.length ? html`<p class="hint">Ancora niente: il primo giro del content engine scrive qui le bozze nuove.</p>` : html`<div>
          ${feed.map((f) => html`<div class="feed-item">
            <div><b style="font-weight:500">${f.titolo || f.title}</b><div class="row" style="margin-top:6px"><span class="pill">${f.tipo || f.type}</span><span class="when">${f.modulo || f.module} · ${when(f.ts)}</span></div>
              ${f.immagine && html`<a href=${"/creative-img?p=" + encodeURIComponent(f.immagine)} target="_blank"><img src=${"/creative-img?p=" + encodeURIComponent(f.immagine)} style="width:150px;border-radius:10px;margin-top:10px;border:1px solid var(--line)" /></a>`}</div>
            ${f.link && html`<a class="btn small ghost" href=${f.link} target="_blank" rel="noopener">Apri</a>`}</div>`)}</div>`}
      </div>
      <div class="stack" style="margin:0">
        <${Question} />
        <div class="card"><h3>${I("calendario")} Prossimi giri</h3>
          ${next.length ? html`<div>${next.slice(0, 6).map((m) => html`<div class="check"><span style="flex:1">${m.name}</span><span class="hint">${when(m.next_run)}</span></div>`)}</div>` : html`<p class="hint">Nessun modulo attivo.</p>`}</div>
      </div>
    </div>
  </div>`;
}

function Modules({ st, reload }) {
  const [logFor, setLogFor] = useState(null); const [log, setLog] = useState("");
  const save = async (id, patch) => { await post("/api/config", { modules: { [id]: patch } }); reload(); };
  const showLog = async (r) => { setLogFor(r); setLog((await api(`/api/runs/${r.id}/log`)).log); };
  const on = st.modules.filter((m) => m.enabled).length;
  return html`<div>
    <${Hero} kicker="Moduli" title="Le routine" text="Ogni modulo gira al suo orario finché il pannello è acceso. Puoi metterlo in pausa o lanciarlo subito.">
      <span class="chip">${on} attivi su ${st.modules.length}</span>
    <//>
    ${logFor && html`<div class="card" style="margin-bottom:16px"><div class="row" style="justify-content:space-between"><h3>${I("log")} ${logFor.target} ${pill(logFor.status)}</h3><button class="btn small ghost" onClick=${() => setLogFor(null)}>Chiudi</button></div><pre class="log" style="margin-top:12px">${log || "(vuoto)"}</pre></div>`}
    <div class="rows">${st.modules.map((m) => html`<div class="item">
      <div>
        <div class="row"><span class="t">${m.name}</span>${!m.enabled && html`<span class="pill">in pausa</span>`}${m.browser && html`<span class="pill">${I("browser")} LinkedIn</span>`}</div>
        <div class="d">${m.desc}</div>
        <div class="chips">
          <span class="chip">${I("orologio")} ${cronHuman(m.cron)}</span>
          ${m.enabled && html`<span class="chip">${I("calendario")} prossimo ${when(m.next_run)}</span>`}
          ${m.last_run ? html`<button class="chip" style="border:0" onClick=${() => showLog(m.last_run)}>${I("log")} ultimo: ${m.last_run.status} · ${when(m.last_run.ended_at || m.last_run.started_at)}</button>` : html`<span class="chip">${I("log")} mai eseguito</span>`}
        </div>
      </div>
      <div class="act">
        <input class="mono" style="width:150px;min-height:40px" value=${m.cron} onChange=${(e) => save(m.id, { cron: e.target.value })} title="orario (cron)" aria-label="orario" />
        <button class="btn" onClick=${() => post("/api/run", { kind: "module", target: m.id }).then(reload)}>${I("play")} Esegui ora</button>
        <button class=${"toggle " + (m.enabled ? "on" : "")} onClick=${() => save(m.id, { enabled: !m.enabled })} aria-label="attiva o metti in pausa"></button>
      </div>
    </div>`)}</div>
  </div>`;
}

const FILES = [["strategy.md", "Strategia"], ["pain-map.md", "Problemi del target"], ["persona.md", "La tua voce"], ["hook-library.md", "Libreria hook"]];
function Strategy() {
  const [f, setF] = useState(FILES[0][0]); const [txt, setTxt] = useState(""); const [saved, setSaved] = useState("");
  useEffect(() => { api(`/api/data/${f}`).then((d) => { setTxt(d.content); setSaved(""); }); }, [f]);
  return html`<div>
    <${Hero} kicker="Strategia" title="Da dove pesca il sistema" text="La strategia è l'unica fonte delle regole editoriali. I dati (cosa converte, hook validati) li aggiornano i moduli da soli." />
    <div class="card stack">
      <div class="tabs">${FILES.map(([n, l]) => html`<button class=${"tab " + (f === n ? "on" : "")} onClick=${() => setF(n)}>${l}</button>`)}</div>
      <textarea style="min-height:460px" value=${txt} onInput=${(e) => setTxt(e.target.value)}></textarea>
      <div class="row"><button class="btn primary" onClick=${async () => { await put(`/api/data/${f}`, { content: txt }); setSaved("Salvato"); }}>Salva</button><span class="hint">${saved}</span></div>
    </div>
  </div>`;
}

function Results() {
  const [t, setT] = useState("performance-ledger.md"); const [txt, setTxt] = useState("");
  useEffect(() => { api(`/api/data/${t}`).then((d) => setTxt(d.content)); }, [t]);
  return html`<div>
    <${Hero} kicker="Risultati" title="Cosa funziona davvero" text="Si aggiorna da solo con il Performance loop (lun e gio) e l'Hook Lab (mar)." />
    <div class="card stack">
      <div class="tabs">${[["performance-ledger.md", "Cosa converte"], ["hook-library.md", "Hook validati"], ["hook-swipe.md", "Hook trovati fuori"]].map(([n, l]) => html`<button class=${"tab " + (t === n ? "on" : "")} onClick=${() => setT(n)}>${l}</button>`)}</div>
      <div class="md" dangerouslySetInnerHTML=${{ __html: marked.parse((txt || "").replace(/<!--[\s\S]*?-->/g, "")) }}></div>
    </div>
  </div>`;
}

function Activity() {
  const [list, setList] = useState([]); const [open, setOpen] = useState(null); const [log, setLog] = useState("");
  useEffect(() => { api("/api/runs").then(setList); }, []);
  return html`<div>
    <${Hero} kicker="Attività" title="Ogni giro, con il suo log" />
    ${open && html`<div class="card" style="margin-bottom:16px"><div class="row" style="justify-content:space-between"><h3>${I("log")} ${open.target} ${pill(open.status)}</h3><button class="btn small ghost" onClick=${() => setOpen(null)}>Chiudi</button></div><pre class="log" style="margin-top:12px">${log || "(vuoto)"}</pre></div>`}
    <div class="rows">${list.length ? list.map((r) => html`<div class="item">
      <div><div class="row"><span class="t" style="font-size:16px">${r.target}</span>${pill(r.status)}</div>
        <div class="chips"><span class="chip">${I("calendario")} ${when(r.started_at || r.queued_at)}</span><span class="chip">${r.kind === "setup" ? "onboarding" : "modulo"} · ${r.trigger}</span></div></div>
      <div class="act"><button class="btn small ghost" onClick=${async () => { setOpen(r); setLog((await api(`/api/runs/${r.id}/log`)).log); scrollTo(0, 0); }}>${I("log")} Log</button></div>
    </div>`) : html`<div class="card"><p class="hint">Nessun giro ancora.</p></div>`}</div>
  </div>`;
}

function Settings({ st, reload }) {
  const [c, setC] = useState(st.config); const [ok, setOk] = useState("");
  const save = async () => { await post("/api/config", { ai: c.ai, delivery: c.delivery, notion: c.notion, brand: c.brand }); setOk("Salvato"); reload(); };
  const reopen = async (step) => { await post("/api/config", { onboarding: { done: false, step } }); await reload(); location.hash = "#/onboarding"; };
  return html`<div>
    <${Hero} kicker="Impostazioni" title="Motore e collegamenti" />
    <div class="cols">
      <div class="card">
        <h2>Collegamenti</h2>
        <div class="grid2">
          <div><label>AI che fa il lavoro</label><select value=${c.ai.adapter} onChange=${(e) => setC({ ...c, ai: { ...c.ai, adapter: e.target.value } })}>${Object.entries(st.adapters).map(([id, a]) => html`<option value=${id}>${a.label}</option>`)}</select></div>
          <div><label>Comando personalizzato</label><input value=${c.ai.custom_command} placeholder="usa {prompt}" onInput=${(e) => setC({ ...c, ai: { ...c.ai, custom_command: e.target.value } })} /></div>
          <div><label>Piano Editoriale (Notion)</label><input value=${c.notion.editorial_db} onInput=${(e) => setC({ ...c, notion: { ...c.notion, editorial_db: e.target.value } })} /></div>
          <div><label>Canale Slack per i report</label><input value=${c.delivery.slack_channel} onInput=${(e) => setC({ ...c, delivery: { ...c.delivery, slack_channel: e.target.value } })} /></div>
        </div>
        <div class="row" style="margin-top:20px"><button class="btn primary" onClick=${save}>Salva</button><span class="hint">${ok}</span></div>
      </div>
      <div class="stack" style="margin:0">
        <div class="card"><h3>Rifai un passo</h3><p class="hint">Riapre l'onboarding dal punto scelto, senza perdere il resto.</p>
          <div class="stack" style="margin-top:14px"><button class="btn ghost" style="width:100%" onClick=${() => reopen(6)}>Template delle creatività</button>
            <button class="btn ghost" style="width:100%" onClick=${() => reopen(4)}>ICP e target</button>
            <button class="btn ghost" style="width:100%" onClick=${() => reopen(1)}>Tutto l'onboarding</button></div></div>
        <div class="card"><h3>Dati</h3><p class="hint mono" style="margin-top:8px;word-break:break-all">${st.home}</p></div>
      </div>
    </div>
  </div>`;
}

// ---------- APP ----------
function App() {
  const hash = useHash();
  const [st, setSt] = useState(null); const [err, setErr] = useState("");
  const reload = () => api("/api/status").then((s) => { setErr(""); setSt(s); }).catch((e) => setErr(e.message));
  useEffect(() => { reload(); const t = setInterval(reload, 15000); return () => clearInterval(t); }, []);
  if (err && !st) return html`<div class="main"><h2>Il pannello non risponde</h2><p class="hint">${err}. Riprovo da solo ogni 15 secondi: controlla che nest-signal sia acceso.</p></div>`;
  if (!st) return html`<div class="main"><p class="hint">Avvio…</p></div>`;
  if (!st.config.onboarding.done || hash.startsWith("#/onboarding")) return html`<${Onboarding} st=${st} reload=${reload} />`;
  const Page = { "#/oggi": Today, "#/moduli": Modules, "#/strategia": Strategy, "#/risultati": Results, "#/attivita": Activity, "#/impostazioni": Settings }[hash.split("?")[0]] || Today;
  return html`<${Shell} st=${st} hash=${hash}><${Page} st=${st} reload=${reload} /><//>`;
}

render(html`<${App} />`, document.getElementById("app"));
