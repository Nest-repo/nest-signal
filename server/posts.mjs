// Piano Editoriale locale: un file JSON per post in DATA/posts (cartella workspace/ del progetto).
import fs from "node:fs";
import path from "node:path";
import { DATA } from "./store.mjs";

export const POSTS = path.join(DATA, "posts");
export const STATI = ["Idea", "Bozza", "In revisione", "Da pubblicare", "Pubblicato", "Scartato"];
export const FUNNEL = ["Reach", "Connection", "Authority", "Conversion", "Referral"];

const FIELDS = ["titolo", "testo", "hooks", "stato", "data", "funnel", "formato", "cta", "pattern_hook", "creativita", "layout",
  "link_live", "metriche", "fonte", "da_confermare", "note", "autore", "testo_bozza"];

function ensure() { fs.mkdirSync(POSTS, { recursive: true }); }
const file = (id) => {
  if (!/^[a-z0-9-]{3,80}$/.test(id)) throw new Error("id non valido");
  return path.join(POSTS, `${id}.json`);
};

export function listPosts() {
  ensure();
  return fs.readdirSync(POSTS).filter((f) => f.endsWith(".json")).map((f) => {
    try { return JSON.parse(fs.readFileSync(path.join(POSTS, f), "utf8")); } catch { return null; }
  }).filter(Boolean).sort((a, b) => (a.data || "9999").localeCompare(b.data || "9999"));
}

export function getPost(id) {
  const p = file(id);
  if (!fs.existsSync(p)) throw new Error("post non trovato");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function clean(patch) {
  const out = {};
  for (const k of FIELDS) if (k in patch) out[k] = patch[k];
  if (out.stato && !STATI.includes(out.stato)) throw new Error("stato non valido");
  return out;
}

export function createPost(patch) {
  ensure();
  const slug = (patch.titolo || "post").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "post";
  const id = `${Date.now().toString(36)}-${slug}`;
  const now = new Date().toISOString();
  const post = { id, stato: "Idea", testo: "", hooks: [], metriche: {}, ...clean(patch), created: now, updated: now };
  if (post.testo && !post.testo_bozza) post.testo_bozza = post.testo;
  fs.writeFileSync(file(id), JSON.stringify(post, null, 2));
  return post;
}

export function updatePost(id, patch) {
  const cur = getPost(id);
  const next = { ...cur, ...clean(patch), updated: new Date().toISOString() };
  fs.writeFileSync(file(id), JSON.stringify(next, null, 2));
  return next;
}
