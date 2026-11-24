// Salute dei moduli: cosa serve a ogni routine, cosa c'è davvero e com'è andato l'ultimo giro.
// I controlli sono locali e non usano l'AI (niente crediti consumati). Quelli lenti sono in cache.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { PKG, DATA, loadConfig, loadState } from "./store.mjs";
import { MODULES, moduleSettings } from "./modules.mjs";
import { detect, mcpServers } from "./adapters.mjs";
const run = promisify(execFile);

// Cosa può mancare, come si chiama per il cliente e dove si sistema.
export const NEEDS = {
  ai: { label: "AI collegata", missing: "L'AI non ha fatto l'accesso", fix: { step: 1, label: "Collega l'AI" } },
  browser: { label: "Browser per LinkedIn", missing: "Il browser per LinkedIn non è collegato all'AI", fix: { step: 3, label: "Collega il browser" } },
  linkedin: { label: "Accesso a LinkedIn", missing: "LinkedIn ha chiesto il login nel browser di Nest Signal", fix: { action: "browser-login", label: "Fai il login a LinkedIn" } },
  meetings: { label: "Call registrate", missing: "Le call non sono collegate: i post nascono senza le parole vere dei clienti", fix: { step: 3, label: "Collega le call" },
    cta: { product: "Nest Core", title: "Non registri le call?", text: "Nest imposta registrazione e archivio delle call: diventano post, ma anche note e follow-up per il commerciale." } },
  python: { label: "Generatore immagini", missing: "Manca Python 3 per creare le immagini", fix: { hint: "Installa Python 3 da python.org, poi ricarica" } },
  icp: { label: "ICP definito", missing: "L'ICP è vuoto: le routine non sanno per chi scrivere", fix: { step: 4, label: "Definisci l'ICP" },
    cta: { product: "Sales Engine", title: "ICP poco chiaro?", text: "Il Sales Engine di Nest parte da lì: chi comprare, con che segnale, con che messaggio." } },
};

const TTL = { ai: 5 * 60e3, browser: 10 * 60e3, python: 30 * 60e3 };
const cache = {};
async function cached(key, fn) {
  const c = cache[key];
  if (c && Date.now() - c.at < TTL[key]) return c.value;
  if (c?.pending) return c.value ?? null;
  cache[key] = { ...(c || {}), pending: true };
  try { const value = await fn(); cache[key] = { at: Date.now(), value }; return value; }
  catch { cache[key] = { at: Date.now(), value: false }; return false; }
}
export function invalidate(key) { if (key) delete cache[key]; else for (const k of Object.keys(cache)) delete cache[k]; }

async function checkAI(cfg) {
  if (cfg.ai.adapter === "custom") return !!cfg.ai.custom_command;
  const d = (await detect())[cfg.ai.adapter];
  return !!(d?.installed && d.loggedIn !== false);
}

async function checkBrowser(cfg) {
  if (cfg.ai.adapter === "custom") return null; // non sappiamo leggere i suoi strumenti
  const r = await mcpServers(cfg.ai.adapter);
  if (!r.ok) return null;
  return /playwright|browser|chrome/i.test(r.text);
}

async function checkPython() {
  try { await run("python3", ["--version"], { timeout: 10000 }); } catch { return false; }
  // serve Playwright per Python oppure quello di Node incluso in Nest Signal
  if (fs.existsSync(path.join(PKG, "node_modules", "playwright"))) return true;
  try { await run("python3", ["-c", "import playwright"], { timeout: 10000 }); return true; } catch { return false; }
}

// Controlli immediati: quelli lenti partono in background e arrivano al giro dopo.
// fast = per la chat all'avvio: salta il controllo lento del browser (resta "da verificare").
export async function checks({ fresh = false, fast = false } = {}) {
  const cfg = loadConfig();
  if (fresh) invalidate();
  const [ai, browser, python] = await Promise.all([
    cached("ai", () => checkAI(cfg)),
    fast ? Promise.resolve(cache.browser?.value ?? null) : cached("browser", () => checkBrowser(cfg)),
    cached("python", checkPython),
  ]);
  const src = cfg.meetings?.source;
  return {
    ai, browser, python,
    meetings: !!src && src !== "nessuno",
    icp: !!(cfg.audience?.icp || "").trim(),
  };
}

// Requisiti per modulo: hard = senza non parte; soft = parte ma lavora a metà.
export const REQUIRES = {
  "content-engine": { hard: ["ai", "icp"], soft: ["meetings"] },
  creative: { hard: ["ai", "python"], soft: [] },
  "daily-question": { hard: ["ai"], soft: [] },
  "voice-refresh": { hard: ["ai"], soft: ["meetings"] },
  performance: { hard: ["ai", "browser"], soft: [] },
  "hook-lab": { hard: ["ai", "browser", "icp"], soft: [] },
  "comment-radar": { hard: ["ai", "browser", "icp"], soft: [] },
};

// Esito scritto dall'AI in DATA/state/<modulo>.json → { livello, saltato[], nota, ts }
function lastOutcome(id) {
  try {
    const s = JSON.parse(fs.readFileSync(path.join(DATA, "state", `${id}.json`), "utf8"));
    return s.esito || null;
  } catch { return null; }
}

export function blockers(id, c) {
  const req = REQUIRES[id] || { hard: ["ai"], soft: [] };
  return req.hard.filter((n) => c[n] === false);
}

export async function health({ fresh = false, fast = false } = {}) {
  const c = await checks({ fresh, fast });
  const cfg = loadConfig();
  const runs = loadState().runs;
  const modules = {};
  for (const m of moduleSettings(cfg)) {
    const req = REQUIRES[m.id] || { hard: ["ai"], soft: [] };
    const hard = req.hard.filter((n) => c[n] === false);
    const soft = req.soft.filter((n) => c[n] === false);
    const last = runs.find((r) => r.target === m.id && r.status !== "in coda" && r.status !== "in corso");
    const out = lastOutcome(m.id);
    const outFresh = out && last?.started_at && out.ts >= last.started_at;
    let level = "ok", missing = [], note = "";
    if (hard.length) { level = "bloccato"; missing = hard; }
    else if (last?.status === "errore" || last?.status === "bloccato") { level = "bloccato"; missing = last.missing || []; note = last.error || "L'ultimo giro non è andato: apri il log."; }
    else if (outFresh && out.livello && out.livello !== "completo") {
      level = out.livello === "bloccato" ? "bloccato" : "parziale";
      missing = (out.saltato || []).filter((n) => NEEDS[n]); note = out.nota || "";
    }
    if (level === "ok" && soft.length) { level = "parziale"; missing = soft; }
    if (!last && level === "ok") level = "mai";
    modules[m.id] = { level, missing, note, enabled: m.enabled };
  }
  return { checks: c, modules, needs: NEEDS };
}
