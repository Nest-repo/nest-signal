#!/usr/bin/env node
// Nest Signal — riga di comando.
//   nest-signal onboard     avvia il pannello e apre l'onboarding guidato
//   nest-signal start       avvia il pannello (le routine girano finché resta acceso)
//   nest-signal run <id>    esegue subito un modulo e stampa il log
//   nest-signal status      moduli, prossimi giri, ultimi run
import { exec } from "node:child_process";
import { start } from "../server/index.mjs";
import { loadConfig } from "../server/store.mjs";
import { moduleSettings } from "../server/modules.mjs";
import { enqueue, runs, runLog } from "../server/runner.mjs";

const [cmd = "start", arg] = process.argv.slice(2);

function open(url) {
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${opener} ${url}`);
}

if (cmd === "onboard" || cmd === "start") {
  const url = await start();
  const cfg = loadConfig();
  const target = cfg.onboarding.done && cmd === "start" ? url : `${url}/#/onboarding`;
  console.log(`\n  Nest Signal è acceso → ${target}\n  Le routine girano finché questa finestra resta aperta (Ctrl+C per fermare).\n`);
  if (!process.env.NEST_SIGNAL_NO_OPEN) open(target);
} else if (cmd === "run") {
  if (!arg) { console.error("Uso: nest-signal run <modulo>"); process.exit(1); }
  const r = enqueue("module", arg, "terminale");
  const t = setInterval(() => {
    const cur = runs(50).find((x) => x.id === r.id);
    if (cur && !["in coda", "in corso"].includes(cur.status)) { clearInterval(t); console.log(runLog(r.id)); console.log(`\n→ ${cur.status}`); process.exit(cur.status === "ok" ? 0 : 1); }
  }, 2000);
} else if (cmd === "status") {
  const cfg = loadConfig();
  for (const m of moduleSettings(cfg)) {
    const last = runs(200).find((r) => r.target === m.id);
    console.log(`${m.enabled ? "●" : "○"} ${m.name.padEnd(20)} ${m.cron.padEnd(18)} ultimo: ${last ? `${last.status} ${last.ended_at || ""}` : "—"}`);
  }
} else {
  console.log("Comandi: onboard · start · run <modulo> · status");
}
