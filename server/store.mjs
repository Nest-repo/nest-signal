// Dati locali di Nest Signal: tutto in ~/.nest-signal (o NEST_SIGNAL_HOME). Niente esce dal computer.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const HOME = process.env.NEST_SIGNAL_HOME || path.join(os.homedir(), ".nest-signal");
export const DATA = path.join(HOME, "data");
export const RUNS = path.join(HOME, "runs");
export const BROWSER_PROFILE = path.join(HOME, "browser");
const CONFIG = path.join(HOME, "config.json");
const STATE = path.join(HOME, "state.json");

export const DEFAULT_CONFIG = {
  owner: { name: "", role: "", company: "", website: "", linkedin_url: "", language: "it", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, avatar: "" },
  audience: { icp: "", sector: "", size: "", decision_maker: "", not_icp: "", offer: "", goal: "call prenotate", pains: [] },
  voice: { references: [], length: "500-1000", cta: ["Domanda nei commenti", "Porta aperta (scrivimi)"], never: "" },
  ai: { adapter: "claude", custom_command: "", unattended: true },
  notion: { editorial_db: "", crm_db: "", crm_post_relation: "", report_page: "" },
  delivery: { slack_channel: "" },
  meetings: { source: "", details: "" },
  hook_lab: { reference_creators: [], search_topics: [], audience_list_db: "" },
  comment_radar: { audience_list_db: "", max_per_run: 5 },
  brand: { bg: "#eee8de", ink: "#171717", accent: "#ff4700" },
  creative: { figma_url: "", notes: "", feedback: [], approved: false },
  content: { days: ["lun", "mar", "mer", "gio"], max_proposals_per_run: 2, experiment_ratio: 0.25, inputs: { slack_ideas_channel: "" } },
  performance: { min_impressions: 300, conversion_weights: { followers: 3, profile_visits: 1, comments: 2, leads: 25 } },
  modules: {},
  onboarding: { step: 0, done: false },
  nest: { booking_url: "https://cal.com/meet-nest/ops-partner", site: "https://usanest.it" },
};

function ensureDirs() {
  for (const d of [HOME, DATA, RUNS, path.join(DATA, "state"), path.join(DATA, "drafts"), path.join(DATA, "creative", "references")]) fs.mkdirSync(d, { recursive: true });
  // file di conoscenza: si copiano dai template solo se mancano
  const tdir = path.join(PKG, "templates");
  for (const f of fs.readdirSync(tdir)) {
    const dst = path.join(DATA, f);
    if (!fs.existsSync(dst)) fs.copyFileSync(path.join(tdir, f), dst);
  }
}

function deepMerge(base, over) {
  if (Array.isArray(base) || typeof base !== "object" || base === null) return over === undefined ? base : over;
  const out = { ...base };
  for (const k of Object.keys(over || {})) out[k] = k in base ? deepMerge(base[k], over[k]) : over[k];
  return out;
}

export function loadConfig() {
  ensureDirs();
  const raw = fs.existsSync(CONFIG) ? JSON.parse(fs.readFileSync(CONFIG, "utf8")) : {};
  return deepMerge(DEFAULT_CONFIG, raw);
}

export function saveConfig(patch) {
  const cfg = deepMerge(loadConfig(), patch);
  fs.writeFileSync(CONFIG, JSON.stringify(cfg, null, 2));
  return cfg;
}

export function loadState() {
  ensureDirs();
  return fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : { runs: [] };
}

export function saveState(s) {
  ensureDirs();
  fs.writeFileSync(STATE, JSON.stringify(s, null, 2));
}

// file di conoscenza modificabili dal pannello (solo questi: niente path arbitrari)
export const EDITABLE = ["strategy.md", "pain-map.md", "persona.md", "hook-library.md", "performance-ledger.md", "hook-swipe.md", "answers.md"];

export function readData(name) {
  if (!EDITABLE.includes(name)) throw new Error("file non ammesso");
  const p = path.join(DATA, name);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

export function writeData(name, content) {
  if (!["strategy.md", "pain-map.md", "persona.md", "hook-library.md"].includes(name)) throw new Error("file non modificabile dal pannello");
  fs.writeFileSync(path.join(DATA, name), content);
}

export function readFeed(limit = 80) {
  const p = path.join(DATA, "feed.jsonl");
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, "utf8").trim().split("\n").filter(Boolean).slice(-limit).reverse().map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}
