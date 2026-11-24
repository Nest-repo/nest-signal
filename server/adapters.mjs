// Adapter: come Nest Signal lancia l'AI del cliente. Come in Paperclip, qualsiasi AI che sa
// leggere file ed eseguire istruzioni da riga di comando può fare da motore.
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PKG } from "./store.mjs";
const run = promisify(execFile);

// Dove cerchiamo le CLI: l'installazione locale di Nest Signal (.ai/) e i posti dove finiscono di solito,
// anche quando non sono nel PATH (es. ~/.local/bin dell'installer di Claude Code o dell'app desktop).
export const AI_DIR = path.join(PKG, ".ai");
const EXTRA_BIN = [
  path.join(AI_DIR, "node_modules", ".bin"),
  path.join(os.homedir(), ".local", "bin"),
  path.join(os.homedir(), ".npm-global", "bin"),
  path.join(os.homedir(), ".claude", "local"),
  "/opt/homebrew/bin", "/usr/local/bin",
  path.dirname(process.execPath),
];
{
  const cur = (process.env.PATH || "").split(path.delimiter);
  process.env.PATH = [...EXTRA_BIN.filter((d) => !cur.includes(d)), ...cur].join(path.delimiter);
}

export const ADAPTERS = {
  claude: {
    label: "Claude Code",
    bin: "claude",
    install: "https://docs.claude.com/en/docs/claude-code",
    // -p = esecuzione senza interfaccia. In modalità non presidiata salta le richieste di permesso.
    args: (prompt, { pkg, data, unattended }) => ["-p", prompt, "--add-dir", pkg, "--add-dir", data, "--output-format", "text",
      ...(unattended ? ["--dangerously-skip-permissions"] : ["--permission-mode", "acceptEdits"])],
    mcpList: ["mcp", "list"],
    npm: "@anthropic-ai/claude-code",
    loginArgs: ["auth", "login"],
    plan: "Serve un abbonamento Claude Pro, Max o superiore (il piano gratuito non include Claude Code).",
    login: "Premi «Accedi con Claude»: si apre il browser, entri col tuo account Claude e torni qui.",
  },
  codex: {
    label: "OpenAI Codex CLI",
    bin: "codex",
    install: "https://github.com/openai/codex",
    args: (prompt, { unattended }) => ["exec", ...(unattended ? ["--full-auto"] : []), prompt],
    mcpList: ["mcp", "list"],
    npm: "@openai/codex",
    loginArgs: ["login"],
    plan: "Basta un account ChatGPT: i limiti d'uso dipendono dal piano (più alti con Plus o Pro).",
    login: "Premi «Accedi con ChatGPT»: si apre il browser, entri col tuo account ChatGPT e torni qui.",
  },
  gemini: {
    label: "Gemini CLI",
    bin: "gemini",
    install: "https://github.com/google-gemini/gemini-cli",
    args: (prompt, { unattended }) => ["-p", prompt, ...(unattended ? ["--yolo"] : [])],
    mcpList: ["mcp", "list"],
    npm: "@google/gemini-cli",
    loginArgs: null,
    terminalCmd: "gemini",
    plan: "Basta un account Google personale (gratuito, con limiti giornalieri).",
    login: "Premi «Apri il Terminale»: scegli «Login with Google», entra col tuo account e chiudi con /quit. Poi torna qui.",
  },
  custom: {
    label: "Comando personalizzato",
    bin: null,
    install: "",
    args: null,
  },
};

export async function detect() {
  const out = {};
  for (const [id, a] of Object.entries(ADAPTERS)) {
    if (!a.bin) continue;
    try {
      const { stdout } = await run("/usr/bin/env", ["which", a.bin], { env: process.env });
      let version = "";
      try { version = (await run(a.bin, ["--version"], { timeout: 15000 })).stdout.trim().split("\n")[0]; } catch {}
      out[id] = { installed: true, path: stdout.trim(), version, loggedIn: await loggedIn(id) };
    } catch {
      out[id] = { installed: false };
    }
  }
  return out;
}

// L'AI ha già fatto l'accesso? (true / false / null = non lo sappiamo dire)
async function loggedIn(id) {
  try {
    if (id === "claude") {
      if (process.env.ANTHROPIC_API_KEY) return true;
      const { stdout } = await run("claude", ["auth", "status"], { timeout: 15000 });
      return !!JSON.parse(stdout).loggedIn;
    }
    if (id === "codex") {
      if (process.env.OPENAI_API_KEY) return true;
      await run("codex", ["login", "status"], { timeout: 15000 });
      return true;
    }
    if (id === "gemini") {
      if (process.env.GEMINI_API_KEY) return true;
      return fs.existsSync(path.join(os.homedir(), ".gemini", "oauth_creds.json"));
    }
  } catch (e) {
    if (id === "codex") return false;
    if (id === "claude" && /loggedIn/.test(String(e.stdout || ""))) return false;
    return id === "claude" ? false : null;
  }
  return null;
}

// Elenco dei server MCP configurati nell'AI scelta (browser, Slack, meeting...). Testo grezzo: lo interpreta il pannello.
export async function mcpServers(adapterId) {
  const a = ADAPTERS[adapterId];
  if (!a?.mcpList) return { ok: false, text: "Controllo automatico non disponibile per questo adapter." };
  try {
    const { stdout, stderr } = await run(a.bin, a.mcpList, { timeout: 60000 });
    return { ok: true, text: (stdout + stderr).trim() };
  } catch (e) {
    return { ok: false, text: String(e.stdout || e.message) };
  }
}

// Avvia l'AI con un prompt; restituisce il processo figlio (stdout/stderr vanno nel log del run).
export function launch(cfg, prompt, ctx) {
  const id = cfg.ai.adapter;
  if (id === "custom") {
    const cmd = (cfg.ai.custom_command || "").replace("{prompt}", prompt.replace(/'/g, "'\\''"));
    if (!cmd) throw new Error("Comando personalizzato vuoto: impostalo nel pannello (usa {prompt}).");
    return spawn("/bin/sh", ["-c", cmd], { cwd: ctx.data, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
  }
  const a = ADAPTERS[id];
  if (!a) throw new Error(`Adapter sconosciuto: ${id}`);
  return spawn(a.bin, a.args(prompt, { ...ctx, unattended: cfg.ai.unattended }), { cwd: ctx.data, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
}
