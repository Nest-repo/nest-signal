// Esecuzioni: un run alla volta (il profilo browser non ama i run paralleli), coda FIFO, log su file.
import fs from "node:fs";
import path from "node:path";
import { PKG, DATA, RUNS, BROWSER_PROFILE, loadConfig, loadState, saveState } from "./store.mjs";
import { MODULES, SETUP_JOBS } from "./modules.mjs";
import { launch } from "./adapters.mjs";
import { checks, blockers, NEEDS } from "./health.mjs";
import { applyDraft } from "./strategy.mjs";

const queue = [];
let current = null;

function promptFor(kind, target) {
  const cfgPath = path.join(path.dirname(DATA), "config.json");
  const head = `Sei Nest Signal, il motore LinkedIn del cliente. KIT = ${PKG} · DATA = ${DATA} · CONFIG = ${cfgPath} · PROFILO BROWSER = ${BROWSER_PROFILE}.`;
  if (kind === "setup" && target === "test-ai") return `${head} Questo è solo un test di collegamento: non leggere né scrivere file, rispondi esattamente "NEST SIGNAL OK" e nient'altro.`;
  const file = kind === "setup" ? SETUP_JOBS[target].file : `modules/${target}.md`;
  const common = kind === "setup" ? `Leggi ${PKG}/modules/_common.md solo per percorsi e regole (ignora il controllo "onboarding non completato": sei proprio nell'onboarding)` : `Leggi per intero ${PKG}/modules/_common.md`;
  const page = kind === "setup" && SETUP_JOBS[target].page ? ` PAGINA = ${SETUP_JOBS[target].page}.` : "";
  return `${head}${page} ${common}, poi leggi per intero ed esegui ESATTAMENTE ${PKG}/${file}. Lavora in italiano salvo diversa lingua in CONFIG.`;
}

export function enqueue(kind, target, trigger = "manuale") {
  const known = kind === "module" ? MODULES.some((m) => m.id === target) : !!SETUP_JOBS[target];
  if (!known) throw new Error(`Lavoro sconosciuto: ${target}`);
  const st = loadState();
  if (current?.target === target || queue.some((q) => q.target === target)) {
    return st.runs.find((r) => r.target === target && (r.status === "in coda" || r.status === "in corso"));
  }
  const run = { id: `${Date.now().toString(36)}-${target}`, kind, target, trigger, status: "in coda", queued_at: new Date().toISOString() };
  st.runs.unshift(run); st.runs = st.runs.slice(0, 300); saveState(st);
  queue.push(run);
  setImmediate(next);
  return run;
}

function update(id, patch) {
  const st = loadState();
  const r = st.runs.find((x) => x.id === id);
  if (r) Object.assign(r, patch);
  saveState(st);
  return r;
}

async function next() {
  if (current || !queue.length) return;
  current = queue.shift();
  const cfg = loadConfig();
  const logPath = path.join(RUNS, `${current.id}.log`);
  // Prima di lanciare l'AI: se manca qualcosa di indispensabile il giro non parte (niente crediti sprecati).
  if (current.kind === "module") {
    let miss = [];
    try { miss = blockers(current.target, await checks()); } catch {}
    if (miss.length) {
      const msg = "Giro non partito. Manca: " + miss.map((n) => NEEDS[n].missing).join("; ") + ".";
      fs.writeFileSync(logPath, msg + "\n");
      update(current.id, { status: "bloccato", missing: miss, error: msg, started_at: new Date().toISOString(), ended_at: new Date().toISOString() });
      current = null; return next();
    }
  }
  const startedAt = new Date().toISOString();
  const log = fs.createWriteStream(logPath);
  update(current.id, { status: "in corso", started_at: startedAt });
  let child;
  try {
    child = launch(cfg, promptFor(current.kind, current.target), { pkg: PKG, data: DATA });
  } catch (e) {
    log.end(String(e.message));
    update(current.id, { status: "errore", ended_at: new Date().toISOString(), error: e.message });
    current = null; return next();
  }
  const limitMs = 45 * 60 * 1000; // un modulo non dovrebbe superare i 45 minuti
  const timer = setTimeout(() => child.kill("SIGTERM"), limitMs);
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  child.on("error", (e) => log.write(`\n[errore di avvio] ${e.message}\n`));
  child.on("close", (code) => {
    clearTimeout(timer);
    log.end();
    const out = fs.existsSync(logPath) ? fs.readFileSync(logPath, "utf8") : "";
    let esito = null;
    if (current.kind === "module") {
      try {
        const st = JSON.parse(fs.readFileSync(path.join(DATA, "state", `${current.target}.json`), "utf8"));
        if (st.esito?.ts >= startedAt) esito = st.esito;
      } catch {}
    }
    if (current.kind === "setup" && current.target === "draft-strategy" && code === 0) { try { applyDraft(); } catch {} }
    const status = code !== 0 ? "errore" : esito?.livello === "bloccato" ? "bloccato" : esito?.livello === "parziale" ? "parziale" : "ok";
    update(current.id, { status, esito, missing: esito?.saltato || [], exit_code: code, ended_at: new Date().toISOString(), summary: out.trim().split("\n").slice(-6).join("\n").slice(0, 600) });
    current = null;
    next();
  });
}

export function runLog(id) {
  if (!/^[a-z0-9-]+$/.test(id)) return "";
  const p = path.join(RUNS, `${id}.log`);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

export function runs(limit = 60) {
  return loadState().runs.slice(0, limit);
}

// al riavvio del server i run rimasti "in corso" non esistono più
export function recover() {
  const st = loadState();
  for (const r of st.runs) if (r.status === "in corso" || r.status === "in coda") { r.status = "interrotto"; r.ended_at = new Date().toISOString(); }
  saveState(st);
}
