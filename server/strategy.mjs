// Strategia editoriale generata dalla configurazione dell'onboarding.
// Si scrive solo se strategy.md è ancora il modello di partenza: mai sopra una strategia scritta dal cliente.
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { PKG, DATA, loadConfig } from "./store.mjs";

const FUNZIONI = {
  lun: "Reach — il problema riconoscibile, porta gente nuova",
  mar: "Connection — persona e processo, come lavoro davvero",
  mer: "Authority — un caso con un numero vero",
  gio: "Conversion — il prossimo passo ovvio",
  ven: "Referral — un cliente o un partner che racconta",
};

const norm = (s) => s.replace(/\s+/g, " ").trim();

export function strategyIsTemplate() {
  const p = path.join(DATA, "strategy.md");
  if (!fs.existsSync(p)) return true;
  const cur = fs.readFileSync(p, "utf8");
  const tpl = fs.readFileSync(path.join(PKG, "templates", "strategy.md"), "utf8");
  return !cur.trim() || norm(cur) === norm(tpl);
}

export function strategyMd(c = loadConfig()) {
  const a = c.audience, v = c.voice;
  const giorni = (c.content?.days?.length ? c.content.days : ["lun", "mar", "mer", "gio"]).filter((d) => FUNZIONI[d]);
  const pains = (a.pains || []).filter((p) => p?.name);
  const lines = [
    "# Strategia LinkedIn",
    "",
    `<!-- Generata dall'onboarding il ${new Date().toLocaleDateString("it-IT")}. È la fonte delle regole editoriali: cambiala dal pannello (Strategia) o chiedilo alla tua AI. -->`,
    "",
    "## Obiettivo",
    `- ${a.goal || "call prenotate"}. Ogni post si misura su follower, visite al profilo, commenti e lead, poi sulle impression.`,
    "",
    "## Target",
    `- **Chi**: ${a.icp || "—"}`,
    `- Settore: ${a.sector || "—"} · Dimensione: ${a.size || "—"} · Decide: ${a.decision_maker || "—"}`,
    `- **Non è il target**: ${a.not_icp || "—"}`,
    `- **Cosa vendo**: ${a.offer || "—"} (mai in ogni post)`,
    "",
  ];
  if (pains.length) {
    lines.push("## I problemi di cui parliamo", "Ogni post parte da uno di questi (dettagli e frasi vere in pain-map.md).");
    for (const p of pains) lines.push(`- **${p.name}**${p.mirror ? ` — «${p.mirror}»` : ""}${p.cost ? ` · costo: ${p.cost}` : ""}`);
    lines.push("");
  }
  lines.push("## La settimana", "| Giorno | Funzione |", "|---|---|", ...giorni.map((d) => `| ${d} | ${FUNZIONI[d]} |`), "");
  lines.push("## Come si scrive",
    `- Lunghezza ${v.length || "500-1000"} caratteri, una idea per post, prima persona: mostrare come lavoro, non insegnare.`,
    "- Hook come frase normale, con posta in gioco (vedi hook-library.md sezione 0).",
    "- Numeri, nomi e citazioni solo se veri e presenti nelle fonti.");
  if (v.note) lines.push(`- Voce: ${v.note}`);
  lines.push("", "## CTA ammesse", ...(v.cta?.length ? v.cta : ["Domanda nei commenti"]).map((x) => `- ${x}`), "");
  lines.push("## Mai", `- ${v.never || "—"}`, "");
  lines.push("## Creatività", "- Visuali, non testuali: il testo è già nel post. Sempre col template del cliente.", "");
  return lines.join("\n");
}

// Traccia l'ultima strategia scritta in automatico: se il cliente non l'ha toccata, la si può sostituire.
const STATE = () => path.join(DATA, "state", "strategy.json");
const DRAFT = () => path.join(DATA, "drafts", "strategy.md");
const hash = (t) => crypto.createHash("sha1").update(norm(t)).digest("hex");
const current = () => { try { return fs.readFileSync(path.join(DATA, "strategy.md"), "utf8"); } catch { return ""; } };

function writeAuto(content, source) {
  fs.writeFileSync(path.join(DATA, "strategy.md"), content);
  fs.mkdirSync(path.dirname(STATE()), { recursive: true });
  fs.writeFileSync(STATE(), JSON.stringify({ auto_hash: hash(content), source, ts: new Date().toISOString() }, null, 2));
}

const noComments = (t) => t.replace(/<!--[\s\S]*?-->/g, "");
export function strategyUntouched() {
  if (strategyIsTemplate()) return true;
  // ancora identica alla partenza veloce (anche se scritta prima che tenessimo traccia)
  if (norm(noComments(current())) === norm(noComments(strategyMd()))) return true;
  try { return JSON.parse(fs.readFileSync(STATE(), "utf8")).auto_hash === hash(current()); } catch { return false; }
}

// Partenza veloce dalla configurazione, solo se la strategia è ancora il modello (o se force).
export function ensureStrategy({ force = false } = {}) {
  if (!force && !strategyIsTemplate()) return false;
  writeAuto(strategyMd(), "onboarding");
  return true;
}

// Bozza scritta dall'AI (setup/draft-strategy.md): si applica da sola se il cliente non ha toccato la strategia,
// altrimenti resta come proposta finché non la accetta.
export function applyDraft({ force = false } = {}) {
  if (!fs.existsSync(DRAFT())) return { applied: false, draft: false };
  if (!force && !strategyUntouched()) return { applied: false, draft: true };
  writeAuto(fs.readFileSync(DRAFT(), "utf8"), "ai");
  fs.renameSync(DRAFT(), path.join(DATA, "drafts", "strategy-applicata.md"));
  return { applied: true, draft: false };
}

export function discardDraft() {
  if (fs.existsSync(DRAFT())) fs.renameSync(DRAFT(), path.join(DATA, "drafts", "strategy-scartata.md"));
  return { ok: true };
}

export function strategyStatus() {
  let source = null;
  try { source = JSON.parse(fs.readFileSync(STATE(), "utf8")).source; } catch {}
  return { template: strategyIsTemplate(), untouched: strategyUntouched(), draft: fs.existsSync(DRAFT()), draft_text: fs.existsSync(DRAFT()) ? fs.readFileSync(DRAFT(), "utf8") : "", source: strategyUntouched() ? source : "cliente" };
}
