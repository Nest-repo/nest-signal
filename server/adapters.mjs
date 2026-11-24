// Adapter: come Nest Signal lancia l'AI del cliente. Come in Paperclip, qualsiasi AI che sa
// leggere file ed eseguire istruzioni da riga di comando può fare da motore.
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);

export const ADAPTERS = {
  claude: {
    label: "Claude Code",
    bin: "claude",
    install: "https://docs.claude.com/en/docs/claude-code",
    // -p = esecuzione senza interfaccia. In modalità non presidiata salta le richieste di permesso.
    args: (prompt, { pkg, data, unattended }) => ["-p", prompt, "--add-dir", pkg, "--add-dir", data, "--output-format", "text",
      ...(unattended ? ["--dangerously-skip-permissions"] : ["--permission-mode", "acceptEdits"])],
    mcpList: ["mcp", "list"],
    login: "Apri il Terminale, scrivi claude e poi /login (serve un abbonamento Claude o una chiave API). Poi riprova.",
  },
  codex: {
    label: "OpenAI Codex CLI",
    bin: "codex",
    install: "https://github.com/openai/codex",
    args: (prompt, { unattended }) => ["exec", ...(unattended ? ["--full-auto"] : []), prompt],
    mcpList: ["mcp", "list"],
    login: "Apri il Terminale e scrivi codex login. Poi riprova.",
  },
  gemini: {
    label: "Gemini CLI",
    bin: "gemini",
    install: "https://github.com/google-gemini/gemini-cli",
    args: (prompt, { unattended }) => ["-p", prompt, ...(unattended ? ["--yolo"] : [])],
    mcpList: ["mcp", "list"],
    login: "Apri il Terminale e scrivi gemini per fare il login. Poi riprova.",
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
      out[id] = { installed: true, path: stdout.trim(), version };
    } catch {
      out[id] = { installed: false };
    }
  }
  return out;
}

// Elenco dei server MCP configurati nell'AI scelta (Notion, Slack, browser...). Testo grezzo: lo interpreta il pannello.
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
