// Installazione e accesso dell'AI dal pannello, senza Terminale.
// - Installazione: npm dentro la cartella del progetto (.ai/), niente sudo e niente modifiche globali.
// - Accesso: lancia il login della CLI, che apre il browser; se la CLI chiede un codice, il pannello lo passa.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ADAPTERS, AI_DIR } from "./adapters.mjs";

const sessions = new Map(); // id -> { id, kind, adapter, proc, log, status, url }
const MAX_LOG = 20000;

function npmBin() {
  const dir = path.dirname(process.execPath);
  const cands = process.platform === "win32" ? ["npm.cmd"] : ["npm"];
  for (const c of cands) if (fs.existsSync(path.join(dir, c))) return path.join(dir, c);
  return "npm";
}

function track(kind, adapter, proc) {
  const id = `${kind}-${adapter}-${Date.now().toString(36)}`;
  const s = { id, kind, adapter, proc, log: "", status: "in corso", url: "", needsCode: false };
  const onData = (d) => {
    s.log = (s.log + d.toString()).slice(-MAX_LOG);
    const m = /(https:\/\/[^\s"'<>]+)/.exec(s.log.replace(/\x1b\[[0-9;]*m/g, ""));
    if (m && !s.url) s.url = m[1];
    if (/paste.*code|incolla.*codice|enter.*code/i.test(s.log)) s.needsCode = true;
  };
  proc.stdout?.on("data", onData);
  proc.stderr?.on("data", onData);
  proc.on("error", (e) => { s.status = "errore"; s.log += `\n${e.message}`; });
  proc.on("close", (code) => { if (s.status === "in corso") s.status = code === 0 ? "ok" : "errore"; s.proc = null; });
  sessions.set(id, s);
  return s;
}

const view = (s) => ({ id: s.id, kind: s.kind, adapter: s.adapter, status: s.status, url: s.url, needsCode: s.needsCode, log: s.log.slice(-3000) });

function adapterOf(id) {
  const a = ADAPTERS[id];
  if (!a || !a.bin) throw new Error("AI non valida");
  return a;
}

export function install(adapter) {
  const a = adapterOf(adapter);
  if (!a.npm) throw new Error("Installazione automatica non disponibile");
  fs.mkdirSync(AI_DIR, { recursive: true });
  const pkgJson = path.join(AI_DIR, "package.json");
  if (!fs.existsSync(pkgJson)) fs.writeFileSync(pkgJson, JSON.stringify({ name: "nest-signal-ai", private: true }, null, 2));
  const proc = spawn(npmBin(), ["install", "--no-audit", "--no-fund", a.npm], {
    cwd: AI_DIR, env: process.env, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32",
  });
  return view(track("install", adapter, proc));
}

export function login(adapter) {
  const a = adapterOf(adapter);
  if (!a.loginArgs) throw new Error("Accesso dal pannello non disponibile per questa AI: usa «Apri il Terminale».");
  for (const s of sessions.values()) if (s.adapter === adapter && s.kind === "login" && s.proc) s.proc.kill();
  const proc = spawn(a.bin, a.loginArgs, { cwd: os.homedir(), env: process.env, stdio: ["pipe", "pipe", "pipe"] });
  return view(track("login", adapter, proc));
}

export function sendCode(id, code) {
  const s = sessions.get(id);
  if (!s?.proc?.stdin) throw new Error("Sessione di accesso non attiva: riprova «Accedi».");
  const clean = String(code || "").trim();
  if (!clean || clean.length > 2000 || /[\r\n]/.test(clean)) throw new Error("Codice non valido");
  s.proc.stdin.write(clean + "\n");
  s.needsCode = false;
  return view(s);
}

export function session(id) {
  const s = sessions.get(id);
  if (!s) throw new Error("sessione non trovata");
  return view(s);
}

// Apre il Terminale con il comando dell'AI (per le CLI che fanno il login solo in modo interattivo).
export function openTerminal(adapter) {
  const a = adapterOf(adapter);
  const cmd = a.terminalCmd || a.bin;
  if (process.platform === "darwin") {
    const p = spawn("osascript", ["-e", `tell application "Terminal" to do script "${cmd.replace(/"/g, '\\"')}"`, "-e", 'tell application "Terminal" to activate'], { stdio: "ignore", detached: true });
    p.unref();
    return { ok: true, opened: true, cmd };
  }
  return { ok: true, opened: false, cmd };
}
