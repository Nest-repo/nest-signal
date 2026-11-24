// Analytics: tutto dai dati che Nest Signal traccia già (post con metriche, fotografie del Performance loop, lead).
import fs from "node:fs";
import path from "node:path";
import { DATA, loadConfig } from "./store.mjs";
import { listPosts } from "./posts.mjs";

const num = (v) => (Number.isFinite(+v) ? +v : 0);
function jsonl(name) {
  const p = path.join(DATA, name);
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

// periodo precedente della stessa durata, per dare contesto ai numeri (es. "+12% rispetto ai 30 giorni prima")
function prevKpi(days, minImpr, w) {
  if (!(days > 0)) return null;
  const from = new Date(Date.now() - 2 * days * 864e5).toISOString().slice(0, 10);
  const to = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const rows = listPosts().filter((p) => p.stato === "Pubblicato" && (p.data || "") >= from && (p.data || "") < to).map((p) => p.metriche || {});
  if (!rows.length) return null;
  const s = (k) => rows.reduce((a, m) => a + num(m[k]), 0);
  const impr = s("impressioni");
  const convs = rows.filter((m) => num(m.impressioni) >= minImpr).map((m) => ((num(m.follower_acquisiti) * w.followers + num(m.visite_profilo) * w.profile_visits + num(m.commenti) * w.comments + num(m.lead) * w.leads) / num(m.impressioni)) * 1000);
  return { pubblicati: rows.length, impressioni: impr, follower: s("follower_acquisiti"), visite: s("visite_profilo"), commenti: s("commenti"), lead: s("lead"), conv_media: convs.length ? +(convs.reduce((a, b) => a + b, 0) / convs.length).toFixed(1) : null };
}

export function analytics({ days = 90 } = {}) {
  const cfg = loadConfig();
  const w = { followers: 3, profile_visits: 1, comments: 2, leads: 25, ...(cfg.performance?.conversion_weights || {}) };
  const minImpr = cfg.performance?.min_impressions ?? 300;
  const since = days > 0 ? new Date(Date.now() - days * 864e5).toISOString().slice(0, 10) : "0000";

  const pub = listPosts().filter((p) => p.stato === "Pubblicato" && (p.data || "") >= since);
  const rows = pub.map((p) => {
    const m = p.metriche || {};
    const r = {
      id: p.id, titolo: p.titolo, data: p.data, funnel: p.funnel || "—", pattern: p.pattern_hook || "—", link: p.link_live || "",
      impressioni: num(m.impressioni), follower: num(m.follower_acquisiti), visite: num(m.visite_profilo),
      commenti: num(m.commenti), interazioni: num(m.interazioni), repost: num(m.repost), lead: num(m.lead), misurato: !!m.metriche_al,
    };
    r.conv = r.impressioni >= minImpr ? +(((r.follower * w.followers + r.visite * w.profile_visits + r.commenti * w.comments + r.lead * w.leads) / r.impressioni) * 1000).toFixed(1) : null;
    return r;
  }).sort((a, b) => (a.data || "").localeCompare(b.data || ""));

  const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
  const measured = rows.filter((r) => r.misurato);
  const convs = rows.filter((r) => r.conv !== null).map((r) => r.conv);
  const kpi = {
    pubblicati: rows.length, misurati: measured.length,
    impressioni: sum("impressioni"), follower: sum("follower"), visite: sum("visite"), commenti: sum("commenti"), lead: sum("lead"),
    conv_media: convs.length ? +(convs.reduce((a, b) => a + b, 0) / convs.length).toFixed(1) : null,
  };

  const group = (key) => {
    const g = {};
    for (const r of measured) (g[r[key]] ||= []).push(r);
    return Object.entries(g).map(([k, list]) => {
      const c = list.filter((r) => r.conv !== null).map((r) => r.conv);
      const impr = list.map((r) => r.impressioni).sort((a, b) => a - b);
      return { nome: k, post: list.length, conv: c.length ? +(c.reduce((a, b) => a + b, 0) / c.length).toFixed(1) : null, impressioni_mediane: impr[Math.floor(impr.length / 2)] || 0, follower: list.reduce((s, r) => s + r.follower, 0), lead: list.reduce((s, r) => s + r.lead, 0) };
    }).sort((a, b) => (b.conv ?? -1) - (a.conv ?? -1));
  };

  // andamento settimanale (settimana della data di pubblicazione)
  const weekOf = (d) => { const x = new Date(d + "T12:00:00"); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x.toISOString().slice(0, 10); };
  const weeks = {};
  for (const r of measured) if (r.data) { const k = weekOf(r.data); (weeks[k] ||= { settimana: k, impressioni: 0, follower: 0, visite: 0, commenti: 0, lead: 0, post: 0 }); const wk = weeks[k]; wk.post++; for (const f of ["impressioni", "follower", "visite", "commenti", "lead"]) wk[f] += r[f]; }

  const leads = jsonl("leads.jsonl").filter((l) => (l.ts || "") >= since).reverse().slice(0, 30)
    .map((l) => ({ ...l, post_titolo: rows.find((r) => r.id === l.post_id)?.titolo || "" }));

  return {
    days, kpi, kpi_prev: prevKpi(days, minImpr, w), posts: rows,
    top_conv: [...rows].filter((r) => r.conv !== null).sort((a, b) => b.conv - a.conv).slice(0, 5),
    top_reach: [...rows].sort((a, b) => b.impressioni - a.impressioni).slice(0, 5),
    per_funzione: group("funnel"), per_pattern: group("pattern"),
    settimane: Object.values(weeks).sort((a, b) => a.settimana.localeCompare(b.settimana)),
    leads, pesi: w, min_impressioni: minImpr,
  };
}
