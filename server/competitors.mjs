// Competitor: lista in CONFIG.competitors, dati scritti dal modulo Radar competitor in DATA/competitors/.
import fs from "node:fs";
import path from "node:path";
import { DATA, loadConfig, saveConfig } from "./store.mjs";

const DIR = () => path.join(DATA, "competitors");
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return d; } };

function cleanUrl(u) {
  const s = String(u || "").trim();
  if (!/^https:\/\/([a-z]+\.)?linkedin\.com\/(in|company)\/[^/?#\s]+/i.test(s)) throw new Error("Serve il link LinkedIn del profilo (/in/…) o della pagina aziendale (/company/…)");
  return s.replace(/[?#].*$/, "").replace(/\/+$/, "") + "/";
}

export function competitorsData() {
  const cfg = loadConfig();
  const posts = fs.existsSync(path.join(DIR(), "posts.jsonl"))
    ? fs.readFileSync(path.join(DIR(), "posts.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
    : [];
  const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const recent = posts.filter((p) => (p.data || "") >= since);
  const top = [...recent].sort((a, b) => (b.commenti * 3 + b.reazioni) - (a.commenti * 3 + a.reazioni)).slice(0, 15);
  const ip = path.join(DATA, "competitor-insights.md");
  return {
    list: cfg.competitors || [],
    summary: readJson(path.join(DIR(), "summary.json"), null),
    insights: fs.existsSync(ip) ? fs.readFileSync(ip, "utf8") : "",
    top,
    proposte: readJson(path.join(DATA, "drafts", "competitors.json"), { proposte: [] }).proposte || [],
  };
}

export function addCompetitor({ name, url, note }) {
  const u = cleanUrl(url);
  const cfg = loadConfig();
  const list = (cfg.competitors || []).filter((c) => c.url !== u);
  list.push({ name: String(name || "").trim().slice(0, 80) || u.split("/").filter(Boolean).pop(), url: u, note: String(note || "").slice(0, 200) });
  if (list.length > 8) throw new Error("Massimo 8 competitor");
  saveConfig({ competitors: list });
  // tolgo la proposta accettata
  const dp = path.join(DATA, "drafts", "competitors.json");
  const d = readJson(dp, null);
  if (d?.proposte) { d.proposte = d.proposte.filter((p) => cleanUrlSafe(p.url) !== u); fs.writeFileSync(dp, JSON.stringify(d, null, 2)); }
  return { list };
}
const cleanUrlSafe = (u) => { try { return cleanUrl(u); } catch { return u; } };

export function removeCompetitor({ url }) {
  const cfg = loadConfig();
  const list = (cfg.competitors || []).filter((c) => c.url !== url);
  // saveConfig fa merge: per gli array sostituisce
  saveConfig({ competitors: list });
  return { list };
}
