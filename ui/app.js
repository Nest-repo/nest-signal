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
const pill = (s) => html`<span class=${"pill " + (s === "ok" ? "ok" : s === "errore" || s === "interrotto" || s === "bloccato" ? "err" : s === "parziale" ? "warn" : s === "in corso" || s === "in coda" ? "run" : "")}>${s}</span>`;

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

function NestCTA({ cfg, product, title, text, cta }) {
  return html`<div class="nest-cta">
    <div class="kicker">Nest · ${product || "Il tuo OPS Partner"}</div>
    <h3 style="margin-top:8px">${title}</h3><p>${text}</p>
    <a class="btn dark" href=${cfg?.nest?.booking_url || "https://cal.com/meet-nest/ops-partner"} target="_blank" rel="noopener">${cta || "Prenota 30 minuti con Nest"} →</a>
  </div>`;
}

// Compila una pagina dalla knowledge base del cliente (lavoro "prefill-<pagina>"); se trova poco, CTA Nest.
function KBFill({ cfg, draft, page, apply, label }) {
  const job = useJob(); const [res, setRes] = useState(null);
  const run = async () => {
    await post("/api/config", { owner: draft.owner, audience: draft.audience, voice: draft.voice, knowledge: draft.knowledge, meetings: draft.meetings, creative: draft.creative });
    setRes(null);
    job.start("setup", "prefill-" + page, async () => { const d = await api("/api/drafts/prefill-" + page); setRes(d); if (d?.campi) apply(d.campi); });
  };
  const weak = (job.run && !job.busy && job.run.status !== "ok") || (res && (res.copertura === "bassa" || !Object.keys(res.campi || {}).length));
  return html`<div class="card soft">
    <div class="row" style="justify-content:space-between">
      <div><b>${label || "Compila dalla tua knowledge base"}</b><p class="hint" style="margin-top:2px">La tua AI legge i tuoi documenti, il sito, LinkedIn e le call e propone i campi. Poi li correggi tu.</p></div>
      <button class="btn soft" disabled=${job.busy} onClick=${run}>${job.busy ? "Sto leggendo…" : "✦ Compila"}</button>
    </div>
    ${job.busy && html`<p class="hint" style="margin-top:10px">Può volerci qualche minuto.</p>`}
    ${res && html`<div style="margin-top:12px">
      <span class=${"pill " + (res.copertura === "alta" ? "ok" : res.copertura === "media" ? "warn" : "err")}>copertura ${res.copertura || "—"}</span>
      ${res.fonti?.length > 0 && html`<p class="hint" style="margin-top:8px">Da: ${res.fonti.join(" · ")}</p>`}
      ${res.mancano?.length > 0 && html`<p class="hint" style="margin-top:4px">Non ho trovato: ${res.mancano.join(" · ")}</p>`}
    </div>`}
    ${job.run && !job.busy && job.run.status !== "ok" && html`<details style="margin-top:10px"><summary class="hint">Cosa è successo</summary><pre class="log">${job.log.slice(-2000)}</pre></details>`}
    ${weak && html`<div style="margin-top:14px"><${NestCTA} cfg=${cfg} product="Company Brain" title="La tua AI non trova abbastanza su di te." text="Una knowledge base ordinata (chi sei, cosa vendi, a chi, come parli, le tue call) fa lavorare meglio ogni AI, non solo Nest Signal. Con Nest la costruiamo insieme e la teniamo aggiornata." cta="Miglioriamo la tua knowledge base" /></div>`}
  </div>`;
}

const fillEmpty = (cur, inc) => { const o = { ...cur }; for (const [k, v] of Object.entries(inc || {})) if (v && (!o[k] || (Array.isArray(o[k]) && !o[k].length))) o[k] = v; return o; };

// ---------- KIT UI (pattern Nitido: ogni stato disegnato, niente popup del browser) ----------
// Toast: conferme brevi in basso a destra.
const toastBus = new EventTarget();
const toast = (text, tone = "ok") => toastBus.dispatchEvent(new CustomEvent("t", { detail: { id: Math.random(), text, tone } }));
function Toasts() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const f = (e) => { setList((l) => [...l, e.detail]); setTimeout(() => setList((l) => l.filter((x) => x.id !== e.detail.id)), 4200); };
    toastBus.addEventListener("t", f); return () => toastBus.removeEventListener("t", f);
  }, []);
  return html`<div class="toasts" role="status" aria-live="polite">${list.map((t) => html`<div class=${"toast " + t.tone}><span class="dot"></span>${t.text}</div>`)}</div>`;
}
// Modale di conferma (o con un campo): ask({title, text, ok, tone, input}) → Promise<valore | null>
const modalBus = new EventTarget();
const ask = (opts) => new Promise((resolve) => modalBus.dispatchEvent(new CustomEvent("m", { detail: { ...opts, resolve } })));
function Modal() {
  const [m, setM] = useState(null); const [val, setVal] = useState("");
  useEffect(() => { const f = (e) => { setM(e.detail); setVal(e.detail.input?.value || ""); }; modalBus.addEventListener("m", f); return () => modalBus.removeEventListener("m", f); }, []);
  useEffect(() => { if (!m) return; const k = (e) => { if (e.key === "Escape") close(null); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [m]);
  if (!m) return null;
  const close = (v) => { m.resolve(v); setM(null); };
  return html`<div class="veil" onClick=${(e) => e.target === e.currentTarget && close(null)}>
    <div class="modal" role="dialog" aria-modal="true" aria-label=${m.title}>
      <h3>${m.title}</h3>
      ${m.text && html`<p class="hint" style="margin-top:8px">${m.text}</p>`}
      ${m.input && html`<input autofocus style="margin-top:14px" placeholder=${m.input.placeholder || ""} value=${val} onInput=${(e) => setVal(e.target.value)} onKeyDown=${(e) => e.key === "Enter" && val.trim() && close(val.trim())} />`}
      <div class="row" style="justify-content:flex-end;margin-top:20px">
        <button class="btn ghost" onClick=${() => close(null)}>${m.cancel || "Annulla"}</button>
        <button class=${"btn " + (m.tone === "danger" ? "danger" : "primary")} disabled=${m.input && !val.trim()} onClick=${() => close(m.input ? val.trim() : true)}>${m.ok || "Conferma"}</button>
      </div>
    </div>
  </div>`;
}
// Stato vuoto: icona, titolo, una riga e (se serve) l'azione.
function Empty({ icon = "log", title, text, children }) {
  return html`<div class="empty"><span class="eicon">${I(icon)}</span><b>${title}</b>${text && html`<p class="hint">${text}</p>`}${children && html`<div class="row" style="justify-content:center;margin-top:12px">${children}</div>`}</div>`;
}
// Metrica con contesto (pattern Nitido "Metrica"): etichetta → valore → unità → confronto → frase che lo spiega.
function Metric({ label, value, unit, prev, note, main, invert }) {
  let delta = null;
  if (prev != null && value != null && prev !== 0) {
    const d = Math.round(((value - prev) / Math.abs(prev)) * 100);
    const good = invert ? d < 0 : d > 0;
    delta = html`<span class=${"delta " + (d === 0 ? "" : good ? "up" : "down")}>${d > 0 ? "▲" : d < 0 ? "▼" : "="} ${Math.abs(d)}%</span>`;
  }
  return html`<div class=${"kpi" + (main ? " main" : "")}>
    <span>${label}</span>
    <div class="kv"><b>${value == null ? "—" : fmt(value)}</b>${unit && html`<small class="unit">${unit}</small>`}</div>
    ${(delta || note) && html`<small>${delta} ${note || ""}</small>`}
  </div>`;
}

// ---------- ONBOARDING ----------
const STEPS = ["Benvenuto", "La tua AI", "Chi sei", "Connessioni", "ICP e target", "Come comunichi", "Creatività", "Moduli e orari", "Si parte"];

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
  const Body = [StepWelcome, StepAI, StepProfile, StepConnections, StepICP, StepVoice, StepCreative, StepModules, StepFinish][step];
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
      <div class="card feature"><span class="n">1</span><h3>10 minuti</h3><p class="hint">Colleghiamo la tua AI, il browser per LinkedIn e dove registri le call.</p></div>
      <div class="card feature"><span class="n">2</span><h3>Ti conosce</h3><p class="hint">Mappiamo ICP, target e il tuo modo di comunicare, con l'AI che legge i tuoi post.</p></div>
      <div class="card feature"><span class="n">3</span><h3>Gira da solo</h3><p class="hint">Le routine partono agli orari che scegli. Niente viene pubblicato senza di te.</p></div>
    </div>
    <div class="row" style="margin-top:28px"><button class="btn accent" onClick=${() => next()}>Iniziamo →</button></div>
    <p class="hint" style="margin-top:22px">Costruito da Nest, il partner operativo che progetta e ottimizza i processi delle aziende in crescita. <a href=${cfg.nest.site} target="_blank" rel="noopener">usanest.it</a></p>
  </div>`;
}

const LOGIN_LABEL = { claude: "Accedi con Claude", codex: "Accedi con ChatGPT", gemini: "Apri il Terminale" };

// Installazione e accesso di una AI dal pannello: niente Terminale.
function AISetup({ id, a, d, refresh }) {
  const [sess, setSess] = useState(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [term, setTerm] = useState(null);
  const timer = useRef(null);
  useEffect(() => {
    api("/api/ai/active").then((a) => a?.[id] && follow(a[id])).catch(() => {});
    return () => clearInterval(timer.current);
  }, [id]);
  const follow = (s) => {
    setSess(s); clearInterval(timer.current);
    timer.current = setInterval(async () => {
      const n = await api("/api/ai/session/" + s.id).catch(() => null);
      if (!n) return;
      setSess(n);
      if (n.status !== "in corso") { clearInterval(timer.current); refresh(); }
    }, 1500);
  };
  const act = async (fn) => { setErr(""); try { await fn(); } catch (e) { setErr(e.message); } };
  const doInstall = () => act(async () => follow(await post("/api/ai/install", { adapter: id })));
  const doLogin = () => act(async () => {
    if (!a.panel_login) { setTerm(await post("/api/ai/terminal", { adapter: id })); return; }
    follow(await post("/api/ai/login", { adapter: id }));
  });
  const sendCode = () => act(async () => { setSess(await post("/api/ai/code", { id: sess.id, code })); setCode(""); });
  const busy = sess?.status === "in corso";

  if (!d?.installed) return html`<div class="ai-setup">
    <p class="hint">Non è installata su questo computer.${a.auto_install ? " La installo io dentro la cartella di Nest Signal: niente permessi di amministratore, la togli cancellando la cartella." : ""}</p>
    ${a.auto_install ? html`<button class="btn ghost small" disabled=${busy} onClick=${(e) => { e.preventDefault(); doInstall(); }}>${busy ? "Installo… (1-2 minuti)" : "Installa " + a.label}</button>`
      : html`<p class="hint">Installala da <a href=${a.install} target="_blank" rel="noopener">${a.install}</a>, poi ricarica.</p>`}
    ${sess?.status === "errore" && html`<details style="margin-top:8px" open><summary class="hint">L'installazione non è andata</summary><pre class="log">${sess.log}</pre></details>`}
    ${err && html`<p class="hint" style="color:var(--err)">${err}</p>`}
  </div>`;

  if (d.loggedIn) return null;
  return html`<div class="ai-setup">
    <p class="hint">${a.login}</p>
    ${a.plan && html`<p class="hint" style="margin-top:2px">${a.plan}</p>`}
    <div class="row" style="margin-top:8px">
      <button class="btn primary small" disabled=${busy} onClick=${(e) => { e.preventDefault(); doLogin(); }}>${busy ? "Aspetto che tu entri…" : LOGIN_LABEL[id] || "Accedi"}</button>
      ${busy && sess?.url && html`<a class="btn ghost small" href=${sess.url} target="_blank" rel="noopener">Il browser non si è aperto? Apri la pagina di accesso</a>`}
    </div>
    ${busy && html`<div class="row" style="margin-top:10px">
      <input style="flex:1" placeholder="Hai fatto l'accesso e la pagina mostra un codice? Incollalo qui" value=${code} onInput=${(e) => setCode(e.target.value)} />
      <button class="btn ghost small" disabled=${!code.trim()} onClick=${(e) => { e.preventDefault(); sendCode(); }}>Invia codice</button>
    </div>`}
    ${sess?.status === "errore" && html`<details style="margin-top:8px"><summary class="hint">L'accesso non è andato: cosa è successo</summary><pre class="log">${sess.log}</pre></details>`}
    ${term && html`<p class="hint" style="margin-top:8px">${term.opened ? "Ho aperto il Terminale con " : "Apri il Terminale e scrivi "}<span class="mono">${term.cmd}</span>. Quando hai finito, <a href="#" onClick=${(e) => { e.preventDefault(); refresh(); }}>controlla di nuovo</a>.</p>`}
    ${err && html`<p class="hint" style="color:var(--err)">${err}</p>`}
  </div>`;
}

function StepAI({ st, cfg, draft, set, next }) {
  const [det, setDet] = useState(null);
  const job = useJob();
  const refresh = () => api("/api/detect").then(setDet);
  useEffect(() => { refresh(); }, []);
  const ok = job.run?.status === "ok" && /NEST SIGNAL OK/.test(job.log);
  const ready = det && Object.values(det).some((d) => d.installed && d.loggedIn);
  return html`<div class="stack">
    <div class="kicker">Passo 2 · Motore</div>
    <h2>Quale AI fa il lavoro?</h2>
    <p class="hint">Nest Signal non ha un'AI sua: usa il tuo account Claude, ChatGPT o Google. Serve la versione che gira sul computer (non la chat nel browser): se non ce l'hai la installo io, poi entri col tuo account con un clic.</p>
    ${!det ? html`<p class="hint">Cerco le AI installate…</p>` : Object.entries(st.adapters).map(([id, a]) => {
      const d = det[id]; const on = draft.ai.adapter === id;
      return html`<label class=${"choice " + (on ? "on" : "")}>
        <input type="radio" name="ai" checked=${on} onChange=${() => set("ai.adapter", id)} />
        <div style="flex:1"><b>${a.label}</b> ${id !== "custom" && (d?.installed
            ? html`<span class="pill ok">installata</span> ${d.loggedIn ? html`<span class="pill ok">accesso fatto</span>` : d.loggedIn === false ? html`<span class="pill warn">accesso da fare</span>` : ""}`
            : html`<span class="pill">non installata</span>`)}
          ${id !== "custom" && on && html`<${AISetup} id=${id} a=${a} d=${d} refresh=${refresh} />`}
          ${id === "custom" && html`<p class="hint">Qualsiasi CLI che accetta un prompt. Scrivi il comando con <span class="mono">{prompt}</span> dove va il testo.</p>`}
          ${id === "custom" && on && html`<input placeholder="es. opencode run '{prompt}'" value=${draft.ai.custom_command} onInput=${(e) => set("ai.custom_command", e.target.value)} />`}
        </div></label>`;
    })}
    <label class=${"choice " + (draft.ai.unattended ? "on" : "")}>
      <input type="checkbox" checked=${draft.ai.unattended} onChange=${(e) => set("ai.unattended", e.target.checked)} />
      <div><b>Esecuzione senza conferme</b><p class="hint">Le routine girano mentre non ci sei: l'AI usa i suoi strumenti (file, browser) senza chiederti il permesso a ogni passo. Le istruzioni dei moduli vietano di pubblicare, commentare o scrivere su LinkedIn. Se lo togli, l'AI potrebbe fermarsi ad aspettare una conferma.</p></div>
    </label>
    <div class="row" style="margin-top:18px">
      <button class="btn ghost" disabled=${job.busy} onClick=${async () => { await post("/api/config", { ai: draft.ai }); job.start("setup", "test-ai"); }}>Prova il collegamento</button>
      ${ok && html`<span class="pill ok">funziona</span>`}
    </div>
    <${JobBox} job=${job} label="Prova dell'AI" />
    ${job.run?.status && !job.busy && /not logged in|log ?in|login|unauthori[sz]ed|api key/i.test(job.log) && !ok && html`<div class="banner err"><h3>L'AI non ha fatto l'accesso</h3><p class="hint">${st.adapters[draft.ai.adapter]?.login || "Fai l'accesso alla tua AI, poi riprova."}</p></div>`}
    ${det && !ready && !ok && html`<${NestCTA} cfg=${cfg} title="Non riesci a collegare la tua AI?" text="Te la configuriamo noi in una call di 30 minuti: AI, browser per LinkedIn e call registrate. Esci dalla call con Nest Signal già acceso." cta="Prenota il setup con Nest" />`}
    <div class="row" style="margin-top:22px"><button class="btn accent" onClick=${() => next({ ai: draft.ai })}>Continua →</button>${!ok && html`<span class="hint">Consigliato: prova prima il collegamento.</span>`}</div>
  </div>`;
}

function StepProfile({ cfg, draft, set, setDraft, next }) {
  const o = draft.owner;
  const upload = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => post("/api/avatar", { dataUrl: r.result }).then(() => set("owner.avatar", "ok")); r.readAsDataURL(f);
  };
  return html`<div class="stack">
    <div class="kicker">Passo 3 · Profilo</div>
    <h2>Chi pubblica?</h2>
    <${KBFill} cfg=${cfg} draft=${draft} page="profilo" apply=${(c) => setDraft({ ...draft, owner: fillEmpty(draft.owner, c.owner) })} />
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
  ["cartella", "Una cartella di transcript (li copio in workspace/data/meetings)"], ["granola", "Granola"], ["fireflies", "Fireflies"], ["notta", "Notta"], ["tldv", "tl;dv"],
  ["drive", "Google Drive / Meet (transcript)"], ["altro", "Altro strumento"], ["nessuno", "Non registro le call"],
];

const KB_SOURCES = [["cartella", "Una cartella di documenti (li copio in workspace/data/knowledge)"], ["drive", "Google Drive"], ["confluence", "Confluence / wiki aziendale"], ["sito", "Solo il sito e LinkedIn"], ["altro", "Altro (la mia AI sa dove)"], ["nessuna", "Non ho una knowledge base"]];

function StepConnections({ st, cfg, draft, set, next }) {
  const [mcp, setMcp] = useState(null);
  const ad = draft.ai.adapter; const prof = st.home + "/browser";
  const check = async () => { setMcp({ text: "Controllo…" }); setMcp(await api("/api/mcp")); };
  const has = (n) => mcp?.text && new RegExp(n, "i").test(mcp.text);
  const cmds = ad === "claude" ? [
    ["Browser per LinkedIn", `claude mcp add --scope user playwright -- npx -y @playwright/mcp@latest --user-data-dir "${prof}"`, "Serve per leggere i tuoi post, le statistiche e cosa funziona su LinkedIn (solo lettura). Poi fai login una volta col pulsante qui sotto."],
    ["Slack (facoltativo)", "Aggiungi il connettore Slack della tua organizzazione alla tua AI (claude mcp add …), se vuoi ricevere i riepiloghi anche lì.", "Senza Slack trovi tutto nel pannello, alla pagina Oggi."],
  ] : ad === "codex" ? [
    ["Browser in ~/.codex/config.toml", `[mcp_servers.playwright]\ncommand = "npx"\nargs = ["-y", "@playwright/mcp@latest", "--user-data-dir", "${prof}"]`, "Serve per leggere i tuoi post e le statistiche su LinkedIn (solo lettura)."],
  ] : [["Browser", `Configura nella tua AI il browser Playwright MCP con --user-data-dir "${prof}".`, ""]];
  return html`<div class="stack">
    <div class="kicker">Passo 4 · Connessioni</div>
    <h2>Colleghiamo i tuoi sistemi</h2>
    <p class="hint">Tutti i tuoi dati restano in una cartella sul tuo computer (workspace/). All'AI servono solo il browser per LinkedIn e, se vuoi, Slack. Copia i comandi nel terminale, poi verifica.</p>
    ${cmds.map(([t, c, n]) => html`<div class="card"><h3>${t}</h3><code class="cmd">${c}</code>${n && html`<p class="hint">${n}</p>`}</div>`)}
    <div class="row"><button class="btn ghost" onClick=${check}>Verifica connessioni</button>
      <button class="btn ghost" onClick=${() => post("/api/browser-login").then(() => toast("Si apre una finestra del browser di Nest Signal: fai login a LinkedIn e poi chiudila.", "info"))}>Apri il browser e fai login a LinkedIn</button></div>
    ${mcp && html`<div class="card">${[["playwright", "Browser"], ["slack", "Slack"]].map(([n, l]) => html`<div class="check"><span class=${"s " + (has(n) ? "ok" : "no")}>${has(n) ? "✓" : "!"}</span><b style="font-weight:500">${l}</b><span class="hint">${has(n) ? "collegato" : n === "playwright" ? "non trovato" : "facoltativo"}</span></div>`)}
      <details><summary class="hint">Risposta completa</summary><pre class="log">${mcp.text}</pre></details></div>`}

    <h2 style="margin-top:30px">Dove sta la tua knowledge base?</h2>
    <p class="hint">Documenti su chi sei, cosa vendi, i tuoi clienti, il tuo tono di voce, il brand. Da qui l'AI compila le prossime pagine al posto tuo.</p>
    ${KB_SOURCES.map(([id, l]) => html`<label class=${"choice " + (draft.knowledge.source === id ? "on" : "")}><input type="radio" name="kb" checked=${draft.knowledge.source === id} onChange=${() => set("knowledge.source", id)} /><b>${l}</b></label>`)}
    ${["drive", "confluence", "altro"].includes(draft.knowledge.source) && html`<div><label>Dove esattamente? (cartella, spazio, link)</label><input value=${draft.knowledge.details} onInput=${(e) => set("knowledge.details", e.target.value)} /><p class="hint">Serve il connettore giusto nella tua AI (es. Google Drive).</p></div>`}
    ${draft.knowledge.source === "cartella" && html`<p class="hint">Metti i documenti (pdf, docx, md, txt) nella cartella workspace/data/knowledge.</p>`}
    ${draft.knowledge.source === "nessuna" && html`<${NestCTA} cfg=${cfg} product="Company Brain" title="Senza knowledge base ogni AI riparte da zero." text="Con Nest costruiamo la knowledge base della tua azienda (chi sei, offerta, clienti, processi, tono di voce, call) e la teniamo aggiornata: la usano Nest Signal e tutte le tue AI." cta="Costruiamola insieme" />`}

    <h2 style="margin-top:30px">Dove registri le call?</h2>
    <p class="hint">Le call sono la miniera migliore: i clienti dicono i loro problemi con le loro parole, e tu parli come scrivi.</p>
    ${MEETING_SOURCES.map(([id, l]) => html`<label class=${"choice " + (draft.meetings.source === id ? "on" : "")}><input type="radio" name="ms" checked=${draft.meetings.source === id} onChange=${() => set("meetings.source", id)} /><b>${l}</b></label>`)}
    ${draft.meetings.source && draft.meetings.source !== "nessuno" && html`<div><label>Dove li trovo? (cartella Drive, spazio Granola, nome del workspace…)</label><input value=${draft.meetings.details} onInput=${(e) => set("meetings.details", e.target.value)} /><p class="hint">${draft.meetings.source === "cartella" ? "Metti i transcript (.txt, .md, .vtt) nella cartella workspace/data/meetings: il sistema li legge da lì." : "Assicurati che la tua AI abbia il connettore giusto (es. Granola, Google Drive)."}</p></div>`}
    ${draft.meetings.source === "nessuno" && html`<${NestCTA} cfg=${cfg} product="Nest Core" title="Senza call registrate il sistema scrive alla cieca." text="Con Nest Core partiamo dai processi: in un mese mappiamo come lavori e impostiamo registrazione, trascrizione e un archivio delle call che alimenta vendite e contenuti. Poi lo implementiamo con te." cta="Parliamo di Nest Core" />`}
    <div class="row" style="margin-top:22px"><button class="btn accent" disabled=${!draft.meetings.source || !draft.knowledge.source} onClick=${() => next({ meetings: draft.meetings, knowledge: draft.knowledge })}>Continua →</button></div>
  </div>`;
}

function painMd(pains) {
  return "# Mappa dei problemi del target\n\n<!-- Dall'onboarding. Il content engine la arricchisce con le frasi vere delle call. -->\n\n" +
    pains.filter((p) => p.name).map((p, i) => `## Pain ${i + 1} — ${p.name}\n- **Frase-specchio**: «${p.mirror || ""}»\n- **Cosa costa**: ${p.cost || "da completare"}\n- **Citazioni vere**: (dalle call)\n`).join("\n");
}

function StepICP({ cfg, draft, set, setDraft, next }) {
  const a = draft.audience; const pains = a.pains?.length ? a.pains : [{}, {}, {}];
  const setPain = (i, k, v) => { const p = pains.map((x) => ({ ...x })); p[i][k] = v; set("audience.pains", p); };
  return html`<div class="stack">
    <div class="kicker">Passo 5 · ICP e target</div>
    <h2>A chi parli, e di che problema?</h2>
    <${KBFill} cfg=${cfg} draft=${draft} page="icp" apply=${(c) => setDraft({ ...draft, audience: fillEmpty({ ...draft.audience, pains: (draft.audience.pains || []).filter((p) => p.name) }, c.audience) })} />
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
    ${pains.length < 5 && html`<button class="btn ghost smallall" style="margin-top:10px" onClick=${() => set("audience.pains", [...pains, {}])}>+ Aggiungi un problema</button>`}
    <${NestCTA} cfg=${cfg} product="Sales Engine" title="Non hai chiaro il tuo ICP?" text="Il Sales Engine di Nest parte da lì: definiamo chi compra davvero e con quali parole, costruiamo le liste e l'outbound che portano call qualificate, e colleghiamo tutto al CRM." cta="Scopri il Sales Engine" />
    <div class="row" style="margin-top:22px"><button class="btn accent" disabled=${!a.icp || !pains.some((p) => p.name)} onClick=${async () => { await put("/api/data/pain-map.md", { content: painMd(pains) }); next({ audience: { ...a, pains } }); }}>Continua →</button></div>
  </div>`;
}

function StepVoice({ cfg, draft, set, setDraft, next }) {
  const v = draft.voice; const job = useJob();
  const [persona, setPersona] = useState("");
  useEffect(() => { api("/api/data/persona.md").then((d) => setPersona(d.content)); }, []);
  const read = async () => { await post("/api/config", { owner: draft.owner, voice: draft.voice }); job.start("setup", "draft-voice", async () => setPersona((await api("/api/data/persona.md")).content)); };
  return html`<div class="stack">
    <div class="kicker">Passo 6 · Modello comunicativo</div>
    <h2>Come parli tu</h2>
    <p class="hint">L'AI legge i tuoi ultimi post su LinkedIn (dal browser di Nest Signal) e scrive il tuo modello di scrittura. Lo correggi qui sotto.</p>
    <${KBFill} cfg=${cfg} draft=${draft} page="voce" label="Compila dalla tua knowledge base (guida al tono di voce, riferimenti)" apply=${(c) => setDraft({ ...draft, voice: fillEmpty(draft.voice, c.voice), hook_lab: fillEmpty(draft.hook_lab, c.hook_lab) })} />
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

function StepCreative({ cfg, draft, set, setDraft, next }) {
  const c = draft.creative; const job = useJob();
  const [refs, setRefs] = useState([]); const [res, setRes] = useState(null); const [fb, setFb] = useState(""); const [up, setUp] = useState(false);
  const loadRefs = () => api("/api/references").then(setRefs);
  useEffect(() => { loadRefs(); api("/api/drafts/design-template").then(setRes); }, []);
  const upload = async (files) => {
    setUp(true);
    for (const f of files) {
      if (f.size > 5.5e6) { toast(`${f.name}: massimo 5 MB per file`, "err"); continue; }
      const dataUrl = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });
      await post("/api/references", { name: f.name, dataUrl }).catch((e) => toast(`${f.name}: ${e.message}`, "err"));
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
    <${KBFill} cfg=${cfg} draft=${draft} page="creativita" label="Cerca logo, brand book e grafiche nella tua knowledge base" apply=${(c) => { setDraft({ ...draft, creative: fillEmpty(draft.creative, c.creative) }); loadRefs(); }} />
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
    <${NestCTA} cfg=${cfg} product="Design" title="Vuoi un template disegnato su misura?" text="Il designer di Nest può costruire con te un sistema visivo per i tuoi contenuti, che poi Nest Signal usa in automatico." cta="Parliamone" />
    <div class="row" style="margin-top:12px"><button class="btn ghost smallall" onClick=${() => next({ creative: c })}>Salta per ora (le creatività restano spente)</button></div>
  </div>`;
}

function StepModules({ st, draft, set, next }) {
  const mods = st.modules;
  const get = (id, k, d) => draft.modules?.[id]?.[k] ?? d;
  const setM = (id, k, v) => set("modules", { ...(draft.modules || {}), [id]: { ...(draft.modules?.[id] || {}), [k]: v } });
  return html`<div class="stack">
    <div class="kicker">Passo 8 · Moduli</div>
    <h2>Cosa gira, e quando</h2>
    <p class="hint">Orari in formato cron (minuto ora giorno mese giorno-settimana). Girano finché il pannello resta acceso.</p>
    <div class="cards">${mods.map((m) => { const on = get(m.id, "enabled", m.enabled); return html`<div class="card module">
      <h3>${m.name}<button class=${"toggle " + (on ? "on" : "")} onClick=${() => setM(m.id, "enabled", !on)} aria-label="attiva"></button></h3>
      <p class="hint">${m.desc}</p>
      <label>Orario · <span class="hint">${cronHuman(get(m.id, "cron", m.cron))}</span></label><input class="mono" value=${get(m.id, "cron", m.cron)} onInput=${(e) => setM(m.id, "cron", e.target.value)} />
      ${m.browser && html`<p class="hint">Usa il browser di Nest Signal (LinkedIn), in sola lettura.</p>`}
    </div>`; })}</div>
    <div class="card"><label style="margin-top:0">Canale Slack per i riepiloghi (facoltativo)</label><input placeholder="ID canale, es. C0123ABC — vuoto: riepiloghi solo nel pannello" value=${draft.delivery.slack_channel} onInput=${(e) => set("delivery.slack_channel", e.target.value)} /></div>
    <div class="row" style="margin-top:22px"><button class="btn accent" onClick=${() => next({ modules: draft.modules, delivery: draft.delivery })}>Continua →</button></div>
  </div>`;
}

function StepFinish({ st, cfg, reload }) {
  const [busy, setBusy] = useState(false);
  const finish = async (runFirst) => {
    setBusy(true);
    await post("/api/onboarding/finish"); // scrive anche la strategia dalla configurazione, se è ancora il modello
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
    <div style="margin-top:30px"><${NestCTA} cfg=${cfg} product="Nest Core" title="Vuoi che il sistema lavori anche dietro LinkedIn?" text="Con Nest Core progettiamo e ottimizziamo i processi della tua azienda (operation prima, tecnologia dopo) e poi li implementiamo: CRM, automazioni, dashboard. Nest Signal è un pezzo di come lavoriamo." cta="Parliamo di Nest Core" /></div>
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
  competitor: '<circle cx="9" cy="9" r="3.5"/><circle cx="16.5" cy="10.5" r="2.5"/><path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5M14.5 15.2c.6-.3 1.3-.4 2-.4 2.3 0 4 1.4 4.5 4.2"/>',
  chat: '<path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 21l1.4-4.6A8.5 8.5 0 1 1 20.5 12z"/>',
};
const I = (n) => html`<svg class="i" viewBox="0 0 24 24" dangerouslySetInnerHTML=${{ __html: P[n] || "" }}></svg>`;
const NAV = [["#/oggi", "Oggi", "oggi"], ["#/piano", "Piano editoriale", "calendario"], ["#/moduli", "Moduli", "moduli"], ["#/strategia", "Strategia", "strategia"], ["#/analytics", "Analytics", "risultati"], ["#/competitor", "Competitor", "competitor"], ["#/attivita", "Attività", "attivita"], ["#/impostazioni", "Impostazioni", "impostazioni"]];
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
        <div class="row" style="margin-top:12px"><button class="btn primary smallall" disabled=${!a.trim()} onClick=${() => post("/api/answer", { domanda: q.domanda, risposta: a }).then(() => setDone(true))}>Rispondi</button></div>`}`}
  </div>`;
}

// Salute dei moduli: cosa manca e dove si sistema (dati da /api/health).
const NEED_FIX = { ai: 1, browser: 3, meetings: 3, icp: 4 };
function useHealth() {
  const [h, setH] = useState(null);
  useEffect(() => { api("/api/health").then(setH).catch(() => {}); const t = setInterval(() => api("/api/health").then(setH).catch(() => {}), 60000); return () => clearInterval(t); }, []);
  return h;
}
const reopenStep = async (step) => { await post("/api/config", { onboarding: { done: false, step } }); location.hash = "#/onboarding"; location.reload(); };
function FixButton({ need }) {
  const n = { ai: "Collega l'AI", browser: "Collega il browser", linkedin: "Fai il login a LinkedIn", meetings: "Collega le call", icp: "Definisci l'ICP", python: "Come installarlo" }[need];
  if (need === "linkedin") return html`<button class="btn small" onClick=${() => post("/api/browser-login").then(() => toast("Si apre il browser di Nest Signal: fai login a LinkedIn e chiudilo", "info"))}>${n}</button>`;
  if (need === "python") return html`<a class="btn small ghost" href="https://www.python.org/downloads/" target="_blank" rel="noopener">${n} ↗</a>`;
  return NEED_FIX[need] != null ? html`<button class="btn small" onClick=${() => reopenStep(NEED_FIX[need])}>${n}</button>` : null;
}
function HealthBanner({ st, h }) {
  if (!h) return null;
  const bad = Object.entries(h.modules).filter(([, m]) => m.enabled && (m.level === "bloccato" || m.level === "parziale"));
  if (!bad.length) return null;
  const needs = [...new Set(bad.flatMap(([, m]) => m.missing))];
  const causes = needs.map((n) => [n, bad.filter(([, m]) => m.missing.includes(n)).map(([id]) => id)]);
  const other = bad.filter(([, m]) => !m.missing.length);
  const blocked = bad.filter(([, m]) => m.level === "bloccato").length;
  return html`<div class=${"banner " + (blocked ? "err" : "warn")}>
    <div class="row" style="justify-content:space-between;align-items:flex-start">
      <div style="min-width:0;flex:1 1 320px">
        <h3>${bad.length === 1 ? "1 routine non lavora al pieno" : `${bad.length} routine non lavorano al pieno`}</h3>
        <ul class="blist">${causes.map(([need, ids]) => html`<li><b>${h.needs[need]?.missing || need}</b> · ${ids.map((id) => jobName(st, id)).join(", ")} ${ids.some((id) => h.modules[id].level === "bloccato") ? (ids.length > 1 ? "sono ferme" : "è ferma") : (ids.length > 1 ? "lavorano a metà" : "lavora a metà")}</li>`)}${other.map(([id, m]) => html`<li><b>${jobName(st, id)}</b> · ${m.note || "l'ultimo giro non è andato: apri il log"}</li>`)}</ul>
      </div>
      <div class="row">${needs.map((n) => html`<${FixButton} need=${n} />`)}<a class="btn small ghost" href="#/moduli">Vedi i moduli</a></div>
    </div>
  </div>`;
}

function Today({ st }) {
  const [feed, setFeed] = useState(null); const [posts, setPosts] = useState(null); const [an, setAn] = useState(null);
  const h = useHealth();
  useEffect(() => { api("/api/feed").then(setFeed); api("/api/posts").then((d) => setPosts(d.posts)); api("/api/analytics?days=30").then(setAn).catch(() => {}); }, []);
  const next = [...st.modules].filter((m) => m.enabled && m.next_run).sort((a, b) => a.next_run.localeCompare(b.next_run));
  const first = st.config.owner.name.split(" ")[0] || "";
  const today = new Date().toISOString().slice(0, 10), in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const toApprove = (posts || []).filter((p) => ["Bozza", "In revisione"].includes(p.stato));
  const week = (posts || []).filter((p) => p.stato === "Da pubblicare" && p.data >= today && p.data <= in7);
  const late = (posts || []).filter((p) => p.stato === "Da pubblicare" && p.data && p.data < today);
  return html`<div>
    <${Hero} kicker="Oggi" title=${html`Ciao ${first}, <em>ecco cosa c'è da guardare.</em>`} text="Le bozze arrivano nel Piano editoriale con la loro immagine: tu approvi e pubblichi.">
      ${next[0] && html`<span class="chip">${I("orologio")} prossimo: ${next[0].name} · ${when(next[0].next_run)}</span>`}
      <a class="btn primary" href="#/piano">Apri il Piano editoriale ${I("freccia")}</a>
    <//>
    <${HealthBanner} st=${st} h=${h} />
    ${posts && html`<div class="kpis four" style="margin-bottom:20px">
      <${Metric} label="Da approvare" value=${toApprove.length} note=${toApprove.length ? "bozze pronte da leggere" : "niente in attesa"} />
      <${Metric} label="In uscita in 7 giorni" value=${week.length} note=${late.length ? `${late.length} in ritardo sulla data` : week.length ? "approvati, da pubblicare" : "nessun post approvato"} />
      <${Metric} label="Lead · 30 giorni" value=${an?.kpi?.lead ?? 0} prev=${an?.kpi_prev?.lead} note=${an?.kpi_prev ? "rispetto ai 30 giorni prima" : "dai post misurati"} />
      <${Metric} label="Follower · 30 giorni" value=${an?.kpi?.follower ?? 0} prev=${an?.kpi_prev?.follower} note=${an?.kpi_prev ? "rispetto ai 30 giorni prima" : "dai post misurati"} />
    </div>`}
    <div class="cols">
      <div class="card">
        <div class="shead"><h3>Cosa ha fatto il sistema</h3><a class="btn small ghost" href="#/attivita">Tutta l'attività</a></div>
        ${!feed ? html`<p class="hint">Carico…</p>` : !feed.length ? html`<${Empty} icon="attivita" title="Ancora niente" text="Al primo giro il content engine scrive qui le bozze nuove, con la loro immagine." />` : html`<div>
          ${feed.map((f) => html`<div class="feed-item">
            <div style="min-width:0"><b style="font-weight:500">${f.titolo || f.title}</b><div class="row" style="margin-top:6px"><span class="pill">${f.tipo || f.type}</span><span class="when">${jobName(st, f.modulo || f.module)} · ${when(f.ts)}</span></div>
              ${f.immagine && html`<a href=${"/creative-img?p=" + encodeURIComponent(f.immagine)} target="_blank"><img onError=${(e) => (e.currentTarget.parentNode.style.display = "none")} src=${"/creative-img?p=" + encodeURIComponent(f.immagine)} style="width:150px;border-radius:10px;margin-top:10px;border:1px solid var(--line)" /></a>`}</div>
            ${f.link && html`<a class="btn small ghost" href=${f.link} target=${f.link.startsWith("http") ? "_blank" : undefined} rel="noopener">Apri</a>`}</div>`)}</div>`}
      </div>
      <div class="stack" style="margin:0">
        <${Question} />
        <div class="card"><h3>${I("calendario")} Prossimi giri</h3>
          ${next.length ? html`<div>${next.slice(0, 6).map((m) => html`<div class="check"><span style="flex:1">${m.name}</span>${h?.modules?.[m.id] && ["bloccato", "parziale"].includes(h.modules[m.id].level) && html`<span class=${"pill " + (h.modules[m.id].level === "bloccato" ? "err" : "warn")}>${h.modules[m.id].level === "bloccato" ? "fermo" : "a metà"}</span>`}<span class="hint">${when(m.next_run)}</span></div>`)}</div>` : html`<${Empty} icon="moduli" title="Nessun modulo attivo" text="Accendili dalla pagina Moduli." />`}</div>
      </div>
    </div>
  </div>`;
}

const LEVEL = { ok: ["ok", "funziona"], mai: ["", "mai partito"], parziale: ["warn", "a metà"], bloccato: ["err", "fermo"] };
function Modules({ st, reload }) {
  const [logFor, setLogFor] = useState(null); const [log, setLog] = useState("");
  const h = useHealth();
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
        <div class="row"><span class="t">${m.name}</span>${!m.enabled ? html`<span class="pill">in pausa</span>` : h?.modules?.[m.id] && html`<span class=${"pill " + LEVEL[h.modules[m.id].level][0]}>${LEVEL[h.modules[m.id].level][1]}</span>`}${m.browser && html`<span class="chip sm">${I("browser")} usa LinkedIn</span>`}</div>
        <div class="d">${m.desc}</div>
        ${m.enabled && h?.modules?.[m.id] && ["bloccato", "parziale"].includes(h.modules[m.id].level) && html`<div class=${"inline-note " + (h.modules[m.id].level === "bloccato" ? "err" : "warn")}>
          <span>${h.modules[m.id].missing.length ? h.modules[m.id].missing.map((n) => h.needs[n]?.missing || n).join(" · ") : h.modules[m.id].note || "L'ultimo giro non è andato: apri il log."}</span>
          <span class="row">${h.modules[m.id].missing.map((n) => html`<${FixButton} need=${n} />`)}</span>
        </div>`}
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
function Strategy({ st, reload }) {
  const [f, setF] = useState(FILES[0][0]); const [txt, setTxt] = useState(""); const [saved, setSaved] = useState("");
  const [ss, setSs] = useState(null); const [showDraft, setShowDraft] = useState(false);
  const job = useJob();
  const load = () => { api(`/api/data/${f}`).then((d) => { setTxt(d.content); setSaved(""); }); api("/api/strategy/status").then(setSs); };
  useEffect(load, [f]);
  const aiRunning = job.busy || st.running.some((r) => r.target === "draft-strategy");
  useEffect(() => { if (!aiRunning) return; const t = setInterval(() => { reload(); load(); }, 5000); return () => clearInterval(t); }, [aiRunning, f]);
  const writeWithAI = async () => {
    if (ss && !ss.untouched && !(await ask({ title: "Riscrivo la strategia con la tua AI?", text: "Legge knowledge base, problemi del target, voce e post pubblicati. La tua l'hai modificata a mano: non la tocco, ti arriva come proposta e decidi tu.", ok: "Scrivila" }))) return;
    job.start("setup", "draft-strategy", () => { setF("strategy.md"); load(); reload(); });
  };
  const quick = async () => { await post("/api/strategy/generate", { force: false }); setF("strategy.md"); load(); setSaved("Partenza veloce scritta"); };
  const apply = async () => { await post("/api/strategy/apply"); setShowDraft(false); setF("strategy.md"); load(); setSaved("Nuova strategia applicata"); };
  const discard = async () => { await post("/api/strategy/discard"); setShowDraft(false); load(); };
  const by = ss?.source === "ai" ? "scritta dalla tua AI" : ss?.source === "onboarding" ? "partenza veloce dai dati dell'onboarding" : ss?.source === "cliente" ? "modificata da te" : "";
  return html`<div>
    <${Hero} kicker="Strategia" title="Da dove pesca il sistema" text="La strategia è l'unica fonte delle regole editoriali: tutti i moduli la leggono per prima. La scrive la tua AI dalla tua knowledge base, oppure la scrivi tu.">
      ${by && html`<span class="chip">${I("strategia")} ${by}</span>`}
    <//>
    ${aiRunning && html`<div class="card soft" style="margin-bottom:16px"><div class="row"><span class="pill run">in corso</span><b>La tua AI sta scrivendo la strategia</b></div><p class="hint" style="margin-top:6px">Legge knowledge base, problemi del target, voce e post pubblicati. Può volerci qualche minuto: se non hai toccato la strategia, la applico da sola.</p></div>`}
    ${ss?.draft && !aiRunning && html`<div class="banner" style="margin-bottom:16px">
      <h3>La tua AI ha scritto una nuova strategia</h3>
      <p class="hint" style="margin-top:6px">${ss.untouched ? "Ha letto la tua knowledge base, i problemi del target, la voce e i post. Guardala e usala al posto della partenza veloce." : "Non l'ho applicata perché la tua l'hai modificata a mano. Guardala e decidi."}</p>
      <div class="row" style="margin-top:12px"><button class="btn primary" onClick=${apply}>Usa questa</button><button class="btn ghost" onClick=${() => setShowDraft(!showDraft)}>${showDraft ? "Nascondi" : "Guardala"}</button><button class="btn ghost" onClick=${discard}>Tieni la mia</button></div>
      ${showDraft && html`<pre class="log" style="margin-top:12px;white-space:pre-wrap;max-height:420px">${ss.draft_text}</pre>`}
    </div>`}
    ${ss?.template && !aiRunning && html`<div class="banner" style="margin-bottom:16px">
      <h3>La strategia è ancora il modello vuoto</h3>
      <p class="hint" style="margin-top:6px">Falla scrivere alla tua AI: legge la tua knowledge base, quello che hai messo nell'onboarding e i tuoi post. Oppure scrivila tu qui sotto.</p>
      <div class="row" style="margin-top:12px"><button class="btn primary" onClick=${writeWithAI}>✦ Scrivila con la tua AI</button><button class="btn ghost" onClick=${quick}>Partenza veloce dai dati dell'onboarding</button></div>
    </div>`}
    ${job.run && !job.busy && job.run.status !== "ok" && html`<${JobBox} job=${job} label="Strategia dalla tua AI" />`}
    <div class="card stack">
      <div class="tabs">${FILES.map(([n, l]) => html`<button class=${"tab " + (f === n ? "on" : "")} onClick=${() => setF(n)}>${l}</button>`)}</div>
      <textarea style="min-height:460px" value=${txt} onInput=${(e) => setTxt(e.target.value)}></textarea>
      <div class="row"><button class="btn primary" onClick=${async () => { await put(`/api/data/${f}`, { content: txt }); setSaved("Salvato"); load(); }}>Salva</button>${f === "strategy.md" && !ss?.template && html`<button class="btn ghost" disabled=${aiRunning} onClick=${writeWithAI}>✦ Riscrivila con la tua AI</button>`}<span class="hint">${saved}</span></div>
    </div>
  </div>`;
}

// ---------- ANALYTICS ----------
const fmt = (n) => n == null ? "—" : Number(n).toLocaleString("it-IT");
const median = (arr) => { const a = [...arr].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };
const ddmm = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }) : "";

// Barre verticali, una serie: barre sottili con angoli in alto, griglia leggera, tooltip al passaggio.
function BarChart({ data, height = 180, width = 640, unit = "" }) {
  const [hov, setHov] = useState(null);
  if (!data.length) return html`<p class="hint">Ancora nessun dato.</p>`;
  const W = width, H = height, padL = 36, padB = 22, padT = 10;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = (W - padL) / data.length, bw = Math.max(6, Math.min(W < 400 ? 10 : 14, step - 2));
  const y = (v) => padT + (H - padT - padB) * (1 - v / max);
  const ticks = [0, max / 2, max];
  return html`<div class="chart" onMouseLeave=${() => setHov(null)}>
    <svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${data.map((d) => `${d.label}: ${fmt(d.value)}${unit}`).join(", ")}>
      ${ticks.map((t) => html`<g><line x1=${padL} x2=${W} y1=${y(t)} y2=${y(t)} class="grid" /><text x=${padL - 6} y=${y(t) + 4} class="ax" text-anchor="end">${fmt(Math.round(t))}</text></g>`)}
      ${data.map((d, i) => {
        const x = padL + i * step + (step - bw) / 2, h = Math.max(0, H - padB - y(d.value)), r = Math.min(4, bw / 2, h);
        return html`<g onMouseEnter=${() => setHov(i)}>
          <rect x=${padL + i * step} y=${padT} width=${step} height=${H - padT - padB} fill="transparent" />
          ${h > 0 && html`<path class=${"bar " + (hov === i ? "on" : "")} d=${`M${x},${H - padB} V${H - padB - h + r} Q${x},${H - padB - h} ${x + r},${H - padB - h} H${x + bw - r} Q${x + bw},${H - padB - h} ${x + bw},${H - padB - h + r} V${H - padB} Z`} />`}
          ${(i % Math.ceil(data.length / (W < 400 ? 3 : 12)) === 0) && html`<text x=${padL + i * step + step / 2} y=${H - 6} class="ax" text-anchor="middle">${d.label}</text>`}
        </g>`;
      })}
    </svg>
    ${hov !== null && html`<div class="tip" style=${`left:${((padL + hov * step + step / 2) / W) * 100}%`}><b>${fmt(data[hov].value)}${unit}</b><span>${data[hov].sub || data[hov].label}</span></div>`}
  </div>`;
}

// Barre orizzontali con valore: per confronti tra categorie (funzione, pattern).
function HBars({ rows, field = "conv", label = "conversione" }) {
  const max = Math.max(1, ...rows.map((r) => r[field] || 0));
  return html`<div class="hbars">${rows.map((r) => html`<div class="hrow" title=${`${r.nome}: ${label} ${fmt(r[field])} · ${r.post} post · impressioni mediane ${fmt(r.impressioni_mediane)} · ${r.follower} follower · ${r.lead} lead`}>
    <span class="hname">${r.nome}</span>
    <span class="htrack"><span class="hfill" style=${`width:${((r[field] || 0) / max) * 100}%`}></span></span>
    <span class="hval">${r[field] == null ? "—" : fmt(r[field])}</span><span class="hint hn">${r.post} post</span>
  </div>`)}</div>`;
}

function Overview() {
  const [days, setDays] = useState(90); const [a, setA] = useState(null);
  useEffect(() => { setA(null); api(`/api/analytics?days=${days}`).then(setA); }, [days]);
  const K = a?.kpi, P = a?.kpi_prev;
  const prevLabel = days ? `ai ${days} giorni prima` : "";
  const tiles = K ? [["Lead", K.lead], ["Follower acquisiti", K.follower], ["Visite al profilo", K.visite], ["Commenti", K.commenti], ["Impressioni", K.impressioni], ["Post pubblicati", K.pubblicati, `${K.misurati} misurati`]] : [];
  const wk = a?.settimane || [];
  return html`<div class="stack" style="margin:0">
    <div class="row" style="justify-content:space-between"><div class="seg">${[[30, "30 giorni"], [90, "90 giorni"], [0, "Tutto"]].map(([d, l]) => html`<button class=${days === d ? "on" : ""} onClick=${() => setDays(d)}>${l}</button>`)}</div>
      <span class="hint">Aggiornati dal Performance loop (lun e gio)</span></div>
    ${!a ? html`<p class="hint">Carico…</p>` : !K.misurati ? html`<div class="card"><h3>Ancora nessun post misurato</h3><p class="hint" style="margin-top:6px">I numeri arrivano dal Performance loop, che legge le statistiche dei tuoi post su LinkedIn col browser di Nest Signal. Pubblica, collega il browser (Impostazioni → Connessioni) e al primo giro vedi qui impressioni, follower, visite al profilo, commenti e lead per post.</p></div>` : html`
      <div class="kpis">
        <${Metric} main label="Conversione media" value=${K.conv_media} unit="/ 1.000 impr." prev=${P?.conv_media} note=${P ? `rispetto ${prevLabel}` : "follower, visite, commenti e lead ogni 1.000 impressioni: il numero che conta"} />
        <${Metric} label="Lead" value=${K.lead} prev=${P?.lead} note=${K.lead && K.impressioni ? `1 ogni ${fmt(Math.round(K.impressioni / K.lead))} impressioni` : "nessuno nel periodo"} />
        <${Metric} label="Follower acquisiti" value=${K.follower} prev=${P?.follower} note=${K.pubblicati ? `${fmt(Math.round(K.follower / Math.max(1, K.misurati)))} per post` : ""} />
        <${Metric} label="Visite al profilo" value=${K.visite} prev=${P?.visite} note=${K.pubblicati ? `${fmt(Math.round(K.visite / Math.max(1, K.misurati)))} per post` : ""} />
        <${Metric} label="Commenti" value=${K.commenti} prev=${P?.commenti} note=${K.pubblicati ? `${fmt(Math.round(K.commenti / Math.max(1, K.misurati)))} per post` : ""} />
        <${Metric} label="Impressioni" value=${K.impressioni} prev=${P?.impressioni} note=${K.misurati ? `mediana ${fmt(median(a.posts.filter((p) => p.misurato).map((p) => p.impressioni)))} per post` : ""} />
        <${Metric} label="Post pubblicati" value=${K.pubblicati} prev=${P?.pubblicati} note=${`${K.misurati} misurati`} />
      </div>
      <div class="card"><div class="shead"><h3>Impressioni per settimana</h3><div class="total"><b>${fmt(K.impressioni)}</b><small>impressioni</small></div></div><${BarChart} data=${wk.map((w) => ({ label: ddmm(w.settimana), value: w.impressioni, sub: `settimana del ${ddmm(w.settimana)} · ${w.post} post` }))} /></div>
      <div class="grid3">${[["Follower acquisiti", "follower"], ["Visite al profilo", "visite"], ["Lead", "lead"]].map(([l, f]) => html`<div class="card"><div class="shead"><h3>${l}</h3><div class="total"><b>${fmt(K[f])}</b></div></div><${BarChart} width=${300} height=${190} data=${wk.map((w) => ({ label: ddmm(w.settimana), value: w[f], sub: `settimana del ${ddmm(w.settimana)}` }))} /></div>`)}</div>
      <div class="grid2">
        <div class="card"><h3>Per funzione</h3><p class="hint" style="margin:4px 0 12px">Conversione media: follower, visite, commenti e lead ogni 1.000 impressioni</p><${HBars} rows=${a.per_funzione} /></div>
        <div class="card"><h3>Per pattern di hook</h3><p class="hint" style="margin:4px 0 12px">Quali aperture portano persone</p><${HBars} rows=${a.per_pattern} /></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>Top per conversione</h3>${a.top_conv.map((p) => html`<a class="toprow" href=${"#/piano/" + p.id}><span class="tt">${p.titolo}</span><span class="chip sm">${fmt(p.conv)}</span><span class="hint">${fmt(p.follower)} follower · ${fmt(p.lead)} lead</span></a>`)}</div>
        <div class="card"><h3>Top per impressioni</h3>${a.top_reach.map((p) => html`<a class="toprow" href=${"#/piano/" + p.id}><span class="tt">${p.titolo}</span><span class="chip sm">${fmt(p.impressioni)}</span><span class="hint">${ddmm(p.data)}</span></a>`)}</div>
      </div>
      <div class="card"><h3>Lead arrivati da LinkedIn</h3>${a.leads.length ? html`<div class="tblwrap"><table class="tbl"><thead><tr><th>Quando</th><th>Chi</th><th>Da quale post</th><th>Certezza</th></tr></thead><tbody>${a.leads.map((l) => html`<tr><td>${ddmm((l.ts || "").slice(0, 10))}</td><td>${l.profilo ? html`<a href=${l.profilo} target="_blank" rel="noopener">${l.nome}</a>` : l.nome}</td><td>${l.post_titolo || "—"}</td><td><span class=${"pill " + (l.certezza === "certo" ? "ok" : l.certezza === "probabile" ? "warn" : "")}>${l.certezza}</span></td></tr>`)}</tbody></table></div>` : html`<p class="hint">Nessun lead nel periodo.</p>`}</div>
      <details class="card"><summary><b>Tutti i post (tabella)</b></summary><div class="tblwrap"><table class="tbl"><thead><tr><th>Data</th><th>Post</th><th>Impr.</th><th>Follower</th><th>Visite</th><th>Comm.</th><th>Lead</th><th>Conv.</th></tr></thead><tbody>${[...a.posts].reverse().map((p) => html`<tr><td>${ddmm(p.data)}</td><td><a href=${"#/piano/" + p.id}>${(p.titolo || "").slice(0, 60)}</a></td><td>${fmt(p.impressioni)}</td><td>${fmt(p.follower)}</td><td>${fmt(p.visite)}</td><td>${fmt(p.commenti)}</td><td>${fmt(p.lead)}</td><td>${fmt(p.conv)}</td></tr>`)}</tbody></table></div></details>`}
  </div>`;
}

function Results() {
  const [t, setT] = useState("panoramica"); const [txt, setTxt] = useState("");
  useEffect(() => { if (t !== "panoramica") api(`/api/data/${t}`).then((d) => setTxt(d.content)); }, [t]);
  return html`<div>
    <${Hero} kicker="Analytics" title="Cosa porta persone, davvero" text="Impressioni, follower, visite al profilo, commenti e lead di ogni post, e quali funzioni e hook convertono. Si aggiorna da solo." />
    <div class="tabs" style="margin-bottom:16px">${[["panoramica", "Panoramica"], ["performance-ledger.md", "Cosa converte"], ["hook-library.md", "Hook validati"], ["hook-swipe.md", "Hook trovati fuori"]].map(([n, l]) => html`<button class=${"tab " + (t === n ? "on" : "")} onClick=${() => setT(n)}>${l}</button>`)}</div>
    ${t === "panoramica" ? html`<${Overview} />` : html`<div class="card"><div class="md" dangerouslySetInnerHTML=${{ __html: marked.parse((txt || "").replace(/<!--[\s\S]*?-->/g, "")) }}></div></div>`}
  </div>`;
}

// ---------- COMPETITOR ----------
function Competitors({ st, reload }) {
  const [d, setD] = useState(null); const [f, setF] = useState({ name: "", url: "", note: "" }); const [err, setErr] = useState(""); const [tab, setTab] = useState("insight");
  const job = useJob();
  const load = () => api("/api/competitors").then(setD);
  useEffect(() => { load(); }, []);
  const add = async (c) => { setErr(""); try { await post("/api/competitors", c); setF({ name: "", url: "", note: "" }); load(); reload(); } catch (e) { setErr(e.message); } };
  const remove = async (c) => { if (!(await ask({ title: `Togli ${c.name} dal radar?`, text: "Non lo leggo più dalla prossima settimana. I post già letti restano nello storico.", ok: "Togli", tone: "danger" }))) return; await post("/api/competitors/remove", { url: c.url }); load(); toast(`${c.name} tolto dal radar`); };
  const radar = st.modules.find((m) => m.id === "competitor-radar");
  const sum = Object.fromEntries((d?.summary?.competitor || []).map((c) => [c.url, c]));
  return html`<div>
    <${Hero} kicker="Competitor" title="Cosa fanno loro, dove ti posizioni tu" text="Ogni settimana la tua AI legge cosa pubblicano i tuoi competitor e cosa funziona a loro. Il content engine lo usa per prenderti la stessa nicchia con un angolo tuo, senza copiarli.">
      ${radar && html`<span class="chip">${I("orologio")} ${cronHuman(radar.cron)}${d?.summary?.aggiornato ? " · aggiornato " + when(d.summary.aggiornato) : ""}</span>`}
      <button class="btn primary" disabled=${!d?.list.length} onClick=${() => post("/api/run", { kind: "module", target: "competitor-radar" }).then(reload)}>${I("play")} Aggiorna ora</button>
    <//>
    ${!d ? html`<p class="hint">Carico…</p>` : html`
    <div class="cols">
      <div class="stack" style="margin:0">
        ${d.list.length === 0 && html`<div class="card"><h3>Nessun competitor ancora</h3><p class="hint" style="margin-top:6px">Aggiungili qui accanto, oppure fai trovare alla tua AI chi vende al tuo stesso target e pubblica su LinkedIn.</p></div>`}
        <div class="compgrid">${d.list.map((c) => { const s = sum[c.url]; return html`<div class="card comp">
          <div class="row" style="justify-content:space-between"><a href=${c.url} target="_blank" rel="noopener"><b>${c.name}</b> ↗</a><button class="btn small ghost" onClick=${() => remove(c)}>Togli</button></div>
          ${c.note && html`<p class="hint">${c.note}</p>`}
          ${s ? html`<div class="mini">
            <div><span>Post/settimana</span><b>${fmt(s.frequenza_settimana)}</b></div>
            <div><span>Commenti mediani</span><b>${fmt(s.commenti_mediani)}</b></div>
            <div><span>Reazioni mediane</span><b>${fmt(s.reazioni_mediane)}</b></div>
          </div>
          ${s.formati && html`<div class="chips">${Object.entries(s.formati).sort((a, b) => b[1] - a[1]).map(([k, v]) => html`<span class="chip sm">${k} · ${v}</span>`)}</div>`}
          ${s.temi_top?.length > 0 && html`<p class="hint" style="margin-top:8px">Temi: ${s.temi_top.join(" · ")}</p>`}
          ${s.post_migliore?.hook && html`<a class="best" href=${s.post_migliore.link} target="_blank" rel="noopener"><span class="kicker">Il post che ha funzionato di più</span><span>«${s.post_migliore.hook}»</span><small>${fmt(s.post_migliore.reazioni)} reazioni · ${fmt(s.post_migliore.commenti)} commenti · ${s.post_migliore.formato || ""}</small></a>`}
          ${s.nota && html`<p class="hint" style="margin-top:8px">${s.nota}</p>`}` : html`<p class="hint" style="margin-top:8px">Dati al prossimo giro del radar.</p>`}
        </div>`; })}</div>
        ${(d.insights || d.top.length > 0) && html`<div class="card">
          <div class="tabs" style="margin-bottom:14px">${[["insight", "Dove posizionarti"], ["top", "I loro post migliori"]].map(([k, l]) => html`<button class=${"tab " + (tab === k ? "on" : "")} onClick=${() => setTab(k)}>${l}</button>`)}</div>
          ${tab === "insight" ? html`<div class="md" dangerouslySetInnerHTML=${{ __html: marked.parse((d.insights || "Arriva col primo giro del radar.").replace(/<!--[\s\S]*?-->/g, "")) }}></div>`
            : html`<div class="tblwrap"><table class="tbl"><thead><tr><th>Chi</th><th>Hook</th><th>Formato</th><th>Reaz.</th><th>Comm.</th><th>Tema</th></tr></thead><tbody>${d.top.map((p) => html`<tr><td>${p.competitor}</td><td><a href=${p.link} target="_blank" rel="noopener">${(p.hook || "").slice(0, 90)}</a></td><td>${p.formato}</td><td>${fmt(p.reazioni)}</td><td>${fmt(p.commenti)}</td><td>${p.tema || ""}${p.pain && p.pain !== "✗" ? html`<br/><small class="hint">${p.pain}</small>` : ""}</td></tr>`)}</tbody></table></div>`}
        </div>`}
      </div>
      <div class="stack" style="margin:0">
        <div class="card stack">
          <h3>Aggiungi un competitor</h3>
          <div><label style="margin-top:0">Nome</label><input placeholder="es. Mario Rossi o Acme Srl" value=${f.name} onInput=${(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><label>Link LinkedIn</label><input placeholder="https://www.linkedin.com/in/… o /company/…" value=${f.url} onInput=${(e) => setF({ ...f, url: e.target.value })} /></div>
          <div><label>Perché lo guardi (facoltativo)</label><input placeholder="es. stesso target, prezzo più basso" value=${f.note} onInput=${(e) => setF({ ...f, note: e.target.value })} /></div>
          ${err && html`<p class="hint" style="color:var(--err)">${err}</p>`}
          <button class="btn primary" disabled=${!f.url.trim()} onClick=${() => add(f)}>Aggiungi</button>
        </div>
        <div class="card stack">
          <h3>Non sai chi sono?</h3>
          <p class="hint">La tua AI li cerca nella tua knowledge base, nelle call e su LinkedIn, e te ne propone 3-6. Scegli tu chi aggiungere.</p>
          <button class="btn" disabled=${job.busy} onClick=${() => job.start("setup", "find-competitors", load)}>${job.busy ? "Li sto cercando…" : "✦ Trovali con la tua AI"}</button>
          ${job.run && !job.busy && job.run.status !== "ok" && html`<details><summary class="hint">Non è andata: cosa è successo</summary><pre class="log">${job.log.slice(-1500)}</pre></details>`}
          ${d.proposte.map((p) => html`<div class="prop"><div><b>${p.name}</b><p class="hint">${p.perche}</p><a class="hint" href=${p.url} target="_blank" rel="noopener">${p.url.replace("https://www.linkedin.com", "")}</a></div><button class="btn small" onClick=${() => add({ name: p.name, url: p.url, note: p.perche })}>Aggiungi</button></div>`)}
        </div>
      </div>
    </div>`}
  </div>`;
}

const jobName = (st, id) => st?.modules?.find((m) => m.id === id)?.name || st?.setup_jobs?.[id]?.name || id;
const TRIGGER = { orario: "all'orario", manuale: "lanciato da te", onboarding: "dall'onboarding", terminale: "dal terminale" };

function Activity({ st }) {
  const [list, setList] = useState(null); const [open, setOpen] = useState(null); const [log, setLog] = useState("");
  useEffect(() => { api("/api/runs").then(setList); }, []);
  const dayLabel = (iso) => { const d = (iso || "").slice(0, 10), t = new Date().toISOString().slice(0, 10), y = new Date(Date.now() - 864e5).toISOString().slice(0, 10); return d === t ? "Oggi" : d === y ? "Ieri" : new Date(d + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }); };
  const groups = {}; for (const r of list || []) (groups[dayLabel(r.started_at || r.queued_at)] ||= []).push(r);
  const dur = (r) => r.started_at && r.ended_at ? Math.max(1, Math.round((new Date(r.ended_at) - new Date(r.started_at)) / 60000)) + " min" : "";
  return html`<div>
    <${Hero} kicker="Attività" title="Ogni giro, con il suo log" text="Cosa ha fatto ogni routine, quando, e com'è andata. Se qualcosa non va, il log dice perché." />
    ${open && html`<div class="card" style="margin-bottom:16px"><div class="row" style="justify-content:space-between"><h3>${I("log")} ${jobName(st, open.target)} ${pill(open.status)}</h3><button class="btn small ghost" onClick=${() => setOpen(null)}>Chiudi</button></div><pre class="log" style="margin-top:12px">${log || "(vuoto)"}</pre></div>`}
    ${!list ? html`<p class="hint">Carico…</p>` : !list.length ? html`<div class="card"><${Empty} icon="attivita" title="Nessun giro ancora" text="Le routine partono ai loro orari. Puoi lanciarne una subito dalla pagina Moduli."><a class="btn" href="#/moduli">Vai ai moduli</a><//></div>` :
      Object.entries(groups).map(([day, runs]) => html`<section class="tgroup">
        <div class="kicker" style="margin:4px 0 10px">${day}</div>
        <div class="card tl">${runs.map((r) => html`<div class="trow">
          <div class="ttime">${new Date(r.started_at || r.queued_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}<small>${dur(r)}</small></div>
          <div style="min-width:0"><div class="row"><b>${jobName(st, r.target)}</b>${pill(r.status)}</div>
            <div class="hint">${r.kind === "setup" ? "Preparazione" : "Modulo"} · ${TRIGGER[r.trigger] || r.trigger}${r.error ? " · " + r.error : ""}</div></div>
          <button class="btn small ghost" onClick=${async () => { setOpen(r); setLog((await api(`/api/runs/${r.id}/log`)).log); scrollTo(0, 0); }}>${I("log")} Log</button>
        </div>`)}</div>
      </section>`)}
  </div>`;
}

function Settings({ st, reload }) {
  const [c, setC] = useState(st.config); const [ok, setOk] = useState("");
  const save = async () => { await post("/api/config", { ai: c.ai, delivery: c.delivery, brand: c.brand }); setOk("Salvato"); reload(); };
  const reopen = async (step) => { await post("/api/config", { onboarding: { done: false, step } }); await reload(); location.hash = "#/onboarding"; };
  return html`<div>
    <${Hero} kicker="Impostazioni" title="Motore e collegamenti" />
    <div class="cols">
      <div class="card">
        <h3>Collegamenti</h3>
        <div>
          <div><label>AI che fa il lavoro</label><select value=${c.ai.adapter} onChange=${(e) => setC({ ...c, ai: { ...c.ai, adapter: e.target.value } })}>${Object.entries(st.adapters).map(([id, a]) => html`<option value=${id}>${a.label}</option>`)}</select></div>
          ${c.ai.adapter === "custom" && html`<div><label>Comando personalizzato</label><input value=${c.ai.custom_command} placeholder="usa {prompt}" onInput=${(e) => setC({ ...c, ai: { ...c.ai, custom_command: e.target.value } })} /></div>`}
          <div><label>Canale Slack per i report (facoltativo)</label><input placeholder="es. #linkedin" value=${c.delivery.slack_channel} onInput=${(e) => setC({ ...c, delivery: { ...c.delivery, slack_channel: e.target.value } })} /></div>
        </div>
        <div class="row" style="margin-top:20px"><button class="btn primary" onClick=${save}>Salva</button><span class="hint">${ok}</span></div>
      </div>
      <div class="stack" style="margin:0">
        <div class="card"><h3>Rifai un passo</h3><p class="hint">Riapre l'onboarding dal punto scelto, senza perdere il resto.</p>
          <div class="stack" style="margin-top:14px">${[[1, "La tua AI"], [3, "Connessioni: browser, call, knowledge base"], [4, "ICP e target"], [5, "Come comunichi"], [6, "Template delle creatività"]].map(([n, l]) => html`<button class="btn ghost" style="width:100%;justify-content:flex-start" onClick=${() => reopen(n)}>${l}</button>`)}</div></div>
        <div class="card"><h3>Dati</h3><p class="hint mono" style="margin-top:8px;word-break:break-all">${st.home}</p></div>
      </div>
    </div>
  </div>`;
}

// ---------- PIANO EDITORIALE ----------
const COLS = ["Idea", "Bozza", "In revisione", "Da pubblicare", "Pubblicato"];
const shortDate = (d) => d ? new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "2-digit" }) : "senza data";
const thumb = (p) => p.creativita ? "/creative-img?p=" + encodeURIComponent(p.creativita) : null;
const toneOf = (s) => ({ "Da pubblicare": "run", Pubblicato: "ok", Scartato: "err", "In revisione": "warn" })[s] || "";

// Post segnato come pubblicato da Nest Signal leggendo LinkedIn (procedura _sync-piano)
const autoSynced = (p) => p.stato === "Pubblicato" && (/rilevato da Nest Signal/i.test(p.note || "") || p.fonte === "pubblicato fuori dal piano");

const METRIC_LABEL = { impressioni: "Impressioni", interazioni: "Interazioni", commenti: "Commenti", repost: "Repost", follower_acquisiti: "Follower acquisiti", visite_profilo: "Visite al profilo", lead: "Lead", metriche_al: "Aggiornati il" };

function PostCard({ p }) {
  return html`<a class="pcard" href=${"#/piano/" + p.id}>
    ${thumb(p) && html`<img src=${thumb(p)} alt="" onError=${(e) => (e.currentTarget.style.display = "none")} />`}
    <div class="pt">${p.titolo || "(senza titolo)"}</div>
    <div class="row" style="gap:6px;margin-top:8px"><span class="chip sm">${I("calendario")} ${shortDate(p.data)}</span>${p.funnel && html`<span class="chip sm">${p.funnel}</span>`}${autoSynced(p) && html`<span class="chip sm" title="Rilevato su LinkedIn da Nest Signal">${I("browser")} da LinkedIn</span>`}</div>
  </a>`;
}

function Plan({ st, hash }) {
  const [data, setData] = useState(null); const [view, setView] = useState("bacheca");
  const load = () => api("/api/posts").then(setData);
  useEffect(() => { load(); }, [hash]);
  const id = hash.split("/")[2];
  if (id) return html`<${PostDetail} id=${id} st=${st} back=${() => { location.hash = "#/piano"; }} />`;
  if (!data) return html`<p class="hint">Carico…</p>`;
  const posts = data.posts.filter((p) => p.stato !== "Scartato");
  const n = (s) => posts.filter((p) => p.stato === s).length;
  const add = async () => { const p = await post("/api/posts", { titolo: "Nuova idea", stato: "Idea" }); location.hash = "#/piano/" + p.id; };
  return html`<div>
    <${Hero} kicker="Piano editoriale" title=${html`I tuoi post, <em>dall'idea al pubblicato.</em>`} text="Il sistema scrive le bozze con la loro immagine. Tu le apri, le correggi, le approvi e le pubblichi. Puoi chiedere modifiche anche alla tua AI.">
      <span class="chip">${n("Bozza") + n("In revisione")} da approvare</span><span class="chip">${n("Da pubblicare")} pronti</span>
      <button class="btn primary" onClick=${add}>+ Nuova idea</button>
    <//>
    <div class="row" style="justify-content:space-between;margin-bottom:16px">
      <div class="tabs"><button class=${"tab " + (view === "bacheca" ? "on" : "")} onClick=${() => setView("bacheca")}>Bacheca</button><button class=${"tab " + (view === "calendario" ? "on" : "")} onClick=${() => setView("calendario")}>Calendario</button></div>
      <span class="hint">${posts.length} post · ${data.posts.length - posts.length} scartati</span>
    </div>
    ${view === "bacheca" ? html`<div class="board">${COLS.map((c) => html`<div class="bcol">
        <div class="bhead"><span>${c}</span><span class="count">${n(c)}</span></div>
        ${posts.filter((p) => p.stato === c).map((p) => html`<${PostCard} p=${p} />`)}
        ${!n(c) && c !== "Idea" && html`<p class="colempty">${{ Bozza: "Le bozze del content engine arrivano qui.", "In revisione": "Quello che stai rileggendo.", "Da pubblicare": "Approva una bozza e finisce qui.", Pubblicato: "Lo segna Nest Signal quando lo trova su LinkedIn." }[c]}</p>`}
        ${c === "Idea" && html`<button class="addcard" onClick=${add}>+ Aggiungi</button>`}
      </div>`)}</div>` : html`<${Calendar} posts=${posts} />`}
  </div>`;
}

function Calendar({ posts }) {
  const start = new Date(); start.setHours(12, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 7);
  const days = Array.from({ length: 28 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const key = (d) => d.toISOString().slice(0, 10);
  const today = key(new Date());
  return html`<div class="cal">
    ${["lun", "mar", "mer", "gio", "ven", "sab", "dom"].map((d) => html`<div class="cal-h">${d}</div>`)}
    ${days.map((d) => html`<div class=${"cal-d " + (key(d) === today ? "today" : "") + (key(d) < today ? " past" : "")}>
      <div class="cal-n">${d.getDate()}${d.getDate() === 1 || d === days[0] ? " " + d.toLocaleDateString("it-IT", { month: "short" }) : ""}</div>
      ${posts.filter((p) => (p.data || "").slice(0, 10) === key(d)).map((p) => html`<a class=${"cal-p " + toneOf(p.stato)} href=${"#/piano/" + p.id}>${p.titolo || "(senza titolo)"}</a>`)}
    </div>`)}
  </div>`;
}

// CTA: apre la tua AI nella cartella di Nest Signal con la richiesta sul post già scritta.
function AskAI({ st, p, reloadPost }) {
  const [req, setReq] = useState("accorcia il testo e rendi l'hook più diretto");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const label = st.adapters[st.config.ai.adapter]?.label || "la tua AI";
  const open = async () => {
    setErr(""); setMsg("");
    try {
      const r = await post("/api/ai/chat", { post_id: p.id, prompt: req });
      setMsg(r.opened ? `Ho aperto ${r.label} con la tua richiesta. Quando ha finito, ricarica il post.` : `Apri il Terminale e incolla: ${r.cmd}`);
    } catch (e) { setErr(e.message); }
  };
  return html`<div class="card selected">
    <div class="kicker" style="color:var(--moss);display:flex;gap:6px;align-items:center">${I("chat")} Cambialo con ${label}</div>
    <h3 style="margin-top:6px">Cosa vuoi cambiare?</h3>
    <textarea style="min-height:72px;margin-top:10px;font-family:var(--sans);font-size:15px" value=${req} onInput=${(e) => setReq(e.target.value)}></textarea>
    <div class="row" style="margin-top:12px">
      <button class="btn accent" disabled=${!req.trim()} onClick=${open}>Apri in ${label} →</button>
      ${msg && html`<button class="btn small ghost" onClick=${reloadPost}>Ricarica il post</button>`}
    </div>
    ${msg && html`<p class="hint" style="margin-top:10px">${msg}</p>`}
    ${err && html`<p class="hint" style="margin-top:10px;color:var(--err)">${err}</p>`}
  </div>`;
}

function PostDetail({ id, st, back }) {
  const [p, setP] = useState(null); const [saved, setSaved] = useState(""); const [meta, setMeta] = useState({ stati: [], funnel: [] });
  useEffect(() => { api(`/api/posts/${id}`).then(setP); api("/api/posts").then((d) => setMeta(d)); }, [id]);
  if (!p) return html`<p class="hint">Carico…</p>`;
  const set = (k, v) => { setP({ ...p, [k]: v }); setSaved(""); };
  const save = async (patch) => { const n = await put(`/api/posts/${id}`, patch || p); setP(n); setSaved(""); toast(patch?.stato && patch.stato !== p.stato ? `Spostato in «${patch.stato}»` : "Salvato"); };
  const chars = (p.testo || "").length;
  return html`<div>
    <div class="row" style="margin-bottom:14px"><button class="btn small ghost" onClick=${back}>← Piano editoriale</button><span class=${"pill " + toneOf(p.stato)}>${p.stato}</span><span class="hint">${saved}</span></div>
    <div class="cols wide">
      <div class="card stack">
        <div><label style="margin-top:0">Hook (prima riga e titolo)</label><input style="font-size:18px;font-weight:500" value=${p.titolo || ""} onInput=${(e) => set("titolo", e.target.value)} /></div>
        ${p.hooks?.length > 0 && html`<div><div class="kicker">Altri hook proposti</div><div class="stack" style="margin-top:8px">${p.hooks.map((h) => html`<button class="hookopt" onClick=${() => set("titolo", typeof h === "string" ? h : h.testo)}>${typeof h === "string" ? h : `${h.voto || ""} ${h.testo}`}</button>`)}</div></div>`}
        <div><label>Testo del post</label><textarea style="font-family:var(--sans);font-size:15px;line-height:1.6;min-height:380px" value=${p.testo || ""} onInput=${(e) => set("testo", e.target.value)}></textarea>
          <p class="hint" style="margin-top:6px">${chars} caratteri${chars > 3000 ? " · oltre il limite di LinkedIn (3.000)" : ""}</p></div>
        ${autoSynced(p) && html`<div class="card soft"><b>${I("browser")} Rilevato su LinkedIn</b><p class="hint" style="margin-top:6px">${p.fonte === "pubblicato fuori dal piano" ? "Questo post l'hai pubblicato fuori dal piano: l'ho aggiunto io, così viene misurato." : "Nest Signal l'ha trovato online e ha aggiornato stato, data, link e testo (quello vero pubblicato). La bozza originale resta salvata per il modulo Voce."}</p></div>`}
        ${p.da_confermare && html`<div class="card soft"><b>${p.stato === "Pubblicato" ? "Da controllare" : "Da confermare prima di pubblicare"}</b><p class="hint" style="margin-top:6px;white-space:pre-wrap">${p.da_confermare}</p></div>`}
        <div class="row">
          <button class=${["Bozza", "In revisione", "Idea"].includes(p.stato) ? "btn" : "btn primary"} onClick=${() => save()}>Salva</button>
          <button class="btn ghost" onClick=${() => { navigator.clipboard.writeText(`${p.testo || ""}`); toast("Testo copiato: incollalo su LinkedIn"); }}>Copia testo</button>
          ${["Bozza", "In revisione", "Idea"].includes(p.stato) && html`<button class="btn primary" onClick=${() => save({ ...p, stato: "Da pubblicare" })}>Approva</button>`}
          ${p.stato === "Da pubblicare" && html`<button class="btn ghost" title="Di solito non serve: il Performance loop e l'Hook Lab lo rilevano da soli su LinkedIn" onClick=${async () => { const l = await ask({ title: "Segna come pubblicato", text: "Di solito non serve: il Performance loop e l'Hook Lab lo trovano da soli su LinkedIn. Se vuoi farlo ora, incolla il link del post.", input: { placeholder: "https://www.linkedin.com/feed/update/…" }, ok: "Segna pubblicato" }); if (l) { await save({ ...p, stato: "Pubblicato", link_live: l }); toast("Segnato come pubblicato"); } }}>Segna a mano come pubblicato</button>`}
          ${p.stato !== "Scartato" && html`<button class="btn ghost" onClick=${() => save({ ...p, stato: "Scartato" })}>Scarta</button>`}
        </div>
      </div>
      <div class="stack" style="margin:0">
        <div class="card">
          <h3>Immagine</h3>
          ${thumb(p) ? html`<a href=${thumb(p)} target="_blank"><img onError=${(e) => (e.currentTarget.style.display = "none")} src=${thumb(p) + "&t=" + Date.now()} style="width:100%;border-radius:12px;border:1px solid var(--line);margin-top:12px" /></a>` : html`<p class="hint">Arriva col prossimo giro del modulo Creatività (post con data nei prossimi 14 giorni).</p>`}
          <div class="row" style="margin-top:12px"><button class="btn small" onClick=${async () => { await save({ ...p, creativita: "" }); await post("/api/run", { kind: "module", target: "creative" }); setSaved("Immagine in rigenerazione"); }}>${thumb(p) ? "Rigenera" : "Generala ora"}</button></div>
        </div>
        <div class="card">
          <h3>Dettagli</h3>
          <label>Stato</label><select value=${p.stato} onChange=${(e) => set("stato", e.target.value)}>${meta.stati.map((s) => html`<option>${s}</option>`)}</select>
          <label>Data di pubblicazione</label><input type="date" value=${(p.data || "").slice(0, 10)} onInput=${(e) => set("data", e.target.value)} />
          <label>Funzione</label><select value=${p.funnel || ""} onChange=${(e) => set("funnel", e.target.value)}><option value="">—</option>${meta.funnel.map((s) => html`<option>${s}</option>`)}</select>
          <label>CTA</label><input value=${p.cta || ""} onInput=${(e) => set("cta", e.target.value)} />
          ${p.link_live && html`<label>Link</label><a class="btn small ghost" href=${p.link_live} target="_blank" rel="noopener">Apri su LinkedIn ↗</a>`}
          ${p.fonte && html`<label>Da dove nasce</label><p class="hint">${p.fonte}</p>`}
          <div class="row" style="margin-top:16px"><button class="btn" onClick=${() => save()}>Salva i dettagli</button></div>
        </div>
        ${p.metriche && Object.keys(p.metriche).length > 0 && html`<div class="card"><h3>Risultati</h3>${Object.entries(p.metriche).map(([k, v]) => html`<div class="check"><span style="flex:1">${METRIC_LABEL[k] || k.replace(/_/g, " ")}</span><b style="font-weight:500">${k === "metriche_al" ? ddmm(String(v).slice(0, 10)) : fmt(v)}</b></div>`)}</div>`}
        <${AskAI} st=${st} p=${p} reloadPost=${() => api(`/api/posts/${id}`).then(setP)} />
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
  if (!st.config.onboarding.done || hash.startsWith("#/onboarding")) return html`<${Onboarding} st=${st} reload=${reload} /><${Toasts} /><${Modal} />`;
  const Page = { "#/oggi": Today, "#/piano": Plan, "#/moduli": Modules, "#/strategia": Strategy, "#/risultati": Results, "#/analytics": Results, "#/competitor": Competitors, "#/attivita": Activity, "#/impostazioni": Settings }["#/" + (hash.split("?")[0].split("/")[1] || "oggi")] || Today;
  return html`<${Shell} st=${st} hash=${hash}><${Page} st=${st} reload=${reload} hash=${hash} /><//><${Toasts} /><${Modal} />`;
}

render(html`<${App} />`, document.getElementById("app"));
