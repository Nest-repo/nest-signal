// Server locale di Nest Signal: pannello + API. Ascolta solo su 127.0.0.1.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { PKG, HOME, DATA, loadConfig, saveConfig, readData, writeData, readFeed, EDITABLE } from "./store.mjs";
import { MODULES, SETUP_JOBS, moduleSettings } from "./modules.mjs";
import { ADAPTERS, detect, mcpServers } from "./adapters.mjs";
import { install as aiInstall, login as aiLogin, sendCode as aiCode, session as aiSession, openTerminal } from "./ai-setup.mjs";
import { enqueue, runs, runLog, recover } from "./runner.mjs";
import { reschedule, nextRuns } from "./scheduler.mjs";
import { listPosts, getPost, createPost, updatePost, STATI, FUNNEL } from "./posts.mjs";

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".json": "application/json" };
const VENDOR = {
  "preact.mjs": "node_modules/preact/dist/preact.module.js",
  "hooks.mjs": "node_modules/preact/hooks/dist/hooks.module.js",
  "htm.mjs": "node_modules/htm/dist/htm.module.js",
  "marked.mjs": "node_modules/marked/lib/marked.esm.js",
};

function send(res, code, body, type = "application/json") {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

function serveFile(res, file) {
  if (!fs.existsSync(file)) return send(res, 404, { error: "non trovato" });
  let body = fs.readFileSync(file);
  // la UI importa "preact" come specifier nudo dentro hooks: lo riscriviamo
  if (file.endsWith("hooks.module.js")) body = body.toString().replace(/from"preact"|from "preact"/g, 'from"/vendor/preact.mjs"');
  send(res, 200, body, MIME[path.extname(file)] || "application/octet-stream");
}

async function readBody(req) {
  let raw = "";
  for await (const c of req) { raw += c; if (raw.length > 8e6) throw new Error("troppo grande"); }
  return raw ? JSON.parse(raw) : {};
}

function status() {
  const cfg = loadConfig();
  const nr = nextRuns();
  const all = runs(200);
  return {
    config: cfg, home: HOME, data: DATA,
    adapters: Object.fromEntries(Object.entries(ADAPTERS).map(([k, a]) => [k, { label: a.label, install: a.install, login: a.login || "", plan: a.plan || "", auto_install: !!a.npm, panel_login: !!a.loginArgs }])),
    modules: moduleSettings(cfg).map((m) => ({ ...m, next_run: nr[m.id] || null, last_run: all.find((r) => r.target === m.id) || null })),
    setup_jobs: SETUP_JOBS,
    running: all.filter((r) => r.status === "in corso" || r.status === "in coda"),
  };
}

const routes = {
  "GET /api/status": async () => status(),
  "GET /api/detect": async () => detect(),
  "POST /api/ai/install": async (b) => aiInstall(b.adapter),
  "POST /api/ai/login": async (b) => aiLogin(b.adapter),
  "POST /api/ai/code": async (b) => aiCode(b.id, b.code),
  "POST /api/ai/terminal": async (b) => openTerminal(b.adapter),
  "GET /api/mcp": async () => mcpServers(loadConfig().ai.adapter),
  "POST /api/config": async (b) => { const c = saveConfig(b); reschedule(); return c; },
  "GET /api/runs": async () => runs(),
  "GET /api/feed": async () => readFeed(),
  "POST /api/run": async (b) => enqueue(b.kind === "setup" ? "setup" : "module", b.target, "manuale"),
  "POST /api/onboarding/finish": async () => { const c = saveConfig({ onboarding: { done: true, step: 99 } }); reschedule(); return c; },
  "GET /api/posts": async () => ({ posts: listPosts(), stati: STATI, funnel: FUNNEL }),
  "POST /api/posts": async (b) => createPost(b),
  "GET /api/question": async () => {
    const p = path.join(DATA, "state", "daily-question.json");
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
  },
  "POST /api/answer": async (b) => {
    const q = (b.domanda || "").slice(0, 400), a = (b.risposta || "").trim().slice(0, 8000);
    if (!a) throw new Error("risposta vuota");
    fs.appendFileSync(path.join(DATA, "answers.md"), `\n## ${new Date().toISOString().slice(0, 10)} — ${q}\n${a}\n<!-- usata: no -->\n`);
    fs.appendFileSync(path.join(DATA, "feed.jsonl"), JSON.stringify({ ts: new Date().toISOString(), modulo: "daily-question", tipo: "risposta", titolo: a.slice(0, 90) }) + "\n");
    return { ok: true };
  },
  "GET /api/references": async () => {
    const dir = path.join(DATA, "creative", "references");
    return fs.readdirSync(dir).filter((f) => !f.startsWith(".")).map((f) => ({ name: f, path: path.join(dir, f), size: fs.statSync(path.join(dir, f)).size }));
  },
  "POST /api/references": async (b) => {
    const m = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.+)$/.exec(b.dataUrl || "");
    const ok = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg", "application/pdf": "pdf" };
    if (!m || !ok[m[1]]) throw new Error("formato non ammesso (png, jpg, webp, svg, pdf)");
    const base = (b.name || "reference").toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9-]+/g, "-").slice(0, 40) || "reference";
    const file = path.join(DATA, "creative", "references", `${Date.now().toString(36)}-${base}.${ok[m[1]]}`);
    fs.writeFileSync(file, Buffer.from(m[2], "base64"));
    return { ok: true, name: path.basename(file) };
  },
  "POST /api/references/delete": async (b) => {
    const f = path.join(DATA, "creative", "references", path.basename(b.name || ""));
    if (fs.existsSync(f)) fs.unlinkSync(f);
    return { ok: true };
  },
  "POST /api/browser-login": async () => {
    const p = spawn(process.execPath, [path.join(PKG, "scripts/browser-login.mjs")], { detached: true, stdio: "ignore" });
    p.unref();
    return { ok: true };
  },
  "POST /api/avatar": async (b) => {
    const m = /^data:image\/(png|jpe?g);base64,(.+)$/.exec(b.dataUrl || "");
    if (!m) throw new Error("immagine non valida (png o jpg)");
    const file = path.join(HOME, `avatar.${m[1] === "png" ? "png" : "jpg"}`);
    fs.writeFileSync(file, Buffer.from(m[2], "base64"));
    saveConfig({ owner: { avatar: file } });
    return { ok: true, file };
  },
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    // protezione minima: niente richieste da altri siti (DNS rebinding / CSRF)
    const host = (req.headers.host || "").split(":")[0];
    if (!["127.0.0.1", "localhost"].includes(host)) return send(res, 403, { error: "host non ammesso" });
    if (req.method !== "GET" && req.headers["x-nest-signal"] !== "1") return send(res, 403, { error: "richiesta non ammessa" });

    if (url.pathname.startsWith("/api/")) {
      const key = `${req.method} ${url.pathname}`;
      if (routes[key]) return send(res, 200, await routes[key](req.method === "GET" ? null : await readBody(req)));
      let m;
      if (req.method === "GET" && (m = /^\/api\/runs\/([a-z0-9-]+)\/log$/.exec(url.pathname))) return send(res, 200, { log: runLog(m[1]) });
      if (req.method === "GET" && (m = /^\/api\/ai\/session\/([a-z0-9-]+)$/.exec(url.pathname))) return send(res, 200, aiSession(m[1]));
      if ((m = /^\/api\/data\/([a-z-]+\.md)$/.exec(url.pathname)) && EDITABLE.includes(m[1])) {
        if (req.method === "GET") return send(res, 200, { name: m[1], content: readData(m[1]) });
        if (req.method === "PUT") { writeData(m[1], (await readBody(req)).content || ""); return send(res, 200, { ok: true }); }
      }
      if ((m = /^\/api\/posts\/([a-z0-9-]+)$/.exec(url.pathname))) {
        if (req.method === "GET") return send(res, 200, getPost(m[1]));
        if (req.method === "PUT") return send(res, 200, updatePost(m[1], await readBody(req)));
      }
      if (req.method === "GET" && (m = /^\/api\/drafts\/([a-z-]+)$/.exec(url.pathname))) {
        const p = path.join(DATA, "drafts", `${m[1]}.json`);
        return send(res, 200, fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null);
      }
      return send(res, 404, { error: "API sconosciuta" });
    }
    if (url.pathname.startsWith("/vendor/")) {
      const f = VENDOR[url.pathname.slice(8)];
      return f ? serveFile(res, path.join(PKG, f)) : send(res, 404, { error: "non trovato" });
    }
    if (url.pathname === "/creative-img") {
      const p = path.resolve(url.searchParams.get("p") || "");
      const inside = [path.join(DATA, "creative"), path.join(DATA, "drafts")].some((d) => p.startsWith(d + path.sep));
      if (!inside || !/\.(png|jpe?g|webp|svg)$/i.test(p)) return send(res, 403, { error: "no" });
      return serveFile(res, p);
    }
    if (url.pathname === "/avatar") {
      const a = loadConfig().owner.avatar;
      return a && fs.existsSync(a) ? serveFile(res, a) : send(res, 404, { error: "nessun avatar" });
    }
    const rel = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\/+/, "");
    const file = path.join(PKG, "ui", path.normalize(rel));
    if (!file.startsWith(path.join(PKG, "ui"))) return send(res, 403, { error: "no" });
    return serveFile(res, fs.existsSync(file) ? file : path.join(PKG, "ui", "index.html"));
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

export function start(port = Number(process.env.NEST_SIGNAL_PORT || 3210)) {
  recover();
  reschedule();
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(`http://127.0.0.1:${port}`)));
}
