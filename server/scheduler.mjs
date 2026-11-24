// Scheduler interno (il "battito" di Paperclip): ogni modulo attivo parte al suo orario finché il pannello è acceso.
import { Cron } from "croner";
import { loadConfig } from "./store.mjs";
import { moduleSettings } from "./modules.mjs";
import { enqueue } from "./runner.mjs";

let jobs = [];

export function reschedule() {
  for (const j of jobs) j.stop();
  jobs = [];
  const cfg = loadConfig();
  if (!cfg.onboarding.done) return [];
  for (const m of moduleSettings(cfg)) {
    if (!m.enabled) continue;
    try {
      jobs.push(new Cron(m.cron, { timezone: cfg.owner.timezone, name: m.id }, () => enqueue("module", m.id, "orario")));
    } catch (e) {
      console.error(`Orario non valido per ${m.id}: ${m.cron}`);
    }
  }
  return jobs;
}

export function nextRuns() {
  const out = {};
  for (const j of jobs) out[j.name] = j.nextRun()?.toISOString() || null;
  return out;
}
