// Strategia editoriale generata dalla configurazione dell'onboarding.
// Si scrive solo se strategy.md è ancora il modello di partenza: mai sopra una strategia scritta dal cliente.
import fs from "node:fs";
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

// Scrive la strategia se è ancora il modello (o se force). Ritorna true se l'ha scritta.
export function ensureStrategy({ force = false } = {}) {
  if (!force && !strategyIsTemplate()) return false;
  fs.writeFileSync(path.join(DATA, "strategy.md"), strategyMd());
  return true;
}
