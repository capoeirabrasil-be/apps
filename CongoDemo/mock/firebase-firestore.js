// Demo Firestore: everything lives in this tab (sessionStorage), nothing ever leaves the page.
const D = window.__DEMO;
const deny = () => Object.assign(new Error("Missing or insufficient permissions."), { code: "permission-denied" });
const isOwner = () => D.role === "owner";
const store = D.db;                       // { "col/id": data, "chats/e1/m/x": data }
let timer = 0; const save = () => { clearTimeout(timer); timer = setTimeout(() => { try { sessionStorage.setItem("demo.db", JSON.stringify(store)); } catch {} }, 150); };
const subs = new Set(); const emit = () => { save(); subs.forEach(s => s()); };
const segs = a => a.flatMap(x => String(x).split("/"));
export const getFirestore = () => ({});
export const initializeFirestore = () => ({});
export const persistentLocalCache = o => o; export const persistentMultipleTabManager = () => ({});
export async function clearIndexedDbPersistence() {} export async function terminate() {}
export const collection = (fs, ...p) => ({ kind: "c", path: segs(p).join("/"), w: [] });
export const doc = (fs, ...p) => { const s = segs(p); return { kind: "d", path: s.join("/"), id: s[s.length - 1], col: s.slice(0, -1).join("/") }; };
export const where = (f, op, v) => ({ f, v }); export const limit = n => ({ lim: n });
export const query = (c, ...w) => ({ ...c, w: [...c.w, ...w.filter(x => x && x.f)], lim: (w.find(x => x && x.lim) || {}).lim });
export const increment = n => ({ __i: n }); export const arrayUnion = (...v) => ({ __u: v }); export const arrayRemove = (...v) => ({ __r: v }); export const deleteField = () => ({ __d: 1 });
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
function apply(cur, data, merge) {
  const out = merge ? clone(cur || {}) : {};
  for (const [k, v] of Object.entries(data)) {
    if (k.includes(".")) { const [a, b] = k.split("."); out[a] = out[a] || {}; if (v && v.__d) delete out[a][b]; else out[a][b] = v; continue; }
    if (v && v.__i !== undefined) out[k] = (out[k] || 0) + v.__i;
    else if (v && v.__u) { const base = Array.isArray(out[k]) ? out[k] : []; out[k] = [...base, ...v.__u.filter(x => !base.some(y => JSON.stringify(y) === JSON.stringify(x)))]; }
    else if (v && v.__r) out[k] = (out[k] || []).filter(x => !v.__r.some(y => JSON.stringify(y) === JSON.stringify(x)));
    else if (v && v.__d) delete out[k];
    else if (merge && v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object" && !Array.isArray(out[k])) out[k] = { ...out[k], ...clone(v) };
    else out[k] = clone(v);
  }
  return out;
}
const snapDoc = (path, id) => ({ id, exists: () => path in store, data: () => clone(store[path]), ref: { path } });
const listDocs = c => Object.keys(store).filter(p => p.startsWith(c.path + "/") && p.slice(c.path.length + 1).indexOf("/") < 0)
  .map(p => [p, p.slice(c.path.length + 1)]).filter(([p]) => (c.w || []).every(q => store[p][q.f] === q.v)).slice(0, c.lim || 1e9).map(([p, id]) => snapDoc(p, id));
const OWNER_ONLY = new Set(["access", "going", "seen", "pushTokens", "profiles", "refresh", "accessreq", "emailChanges"]);
const colAllowed = c => isOwner() || !OWNER_ONLY.has(c.path.split("/")[0]);
const qsnap = c => { const docs = listDocs(c); return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false }, forEach: f => docs.forEach(f) }; };
export async function getDoc(r) { return snapDoc(r.path, r.id); }
export const getDocFromServer = getDoc;
export async function getDocFromCache() { throw Object.assign(new Error("not cached"), { code: "unavailable" }); }
export async function getDocs(c) { if (!colAllowed(c)) throw deny(); return qsnap(c); }
export const getDocsFromServer = getDocs;
export function onSnapshot(ref, a, b, c) {
  const cb = typeof a === "function" ? a : b, err = typeof a === "function" ? b : c; let off = false;
  const run = () => { if (off) return; if (ref.kind === "d") return cb(snapDoc(ref.path, ref.id)); if (!colAllowed(ref)) { off = true; return err && err(deny()); } cb(qsnap(ref)); };
  subs.add(run); setTimeout(run, 5); return () => { off = true; subs.delete(run); };
}
const put = (r, d) => { store[r.path] = d; };
export async function setDoc(r, data, opt) { put(r, apply(store[r.path], data, !!opt?.merge)); emit(); }
export async function updateDoc(r, data) { if (!(r.path in store)) throw Object.assign(new Error("not found"), { code: "not-found" }); put(r, apply(store[r.path], data, true)); emit(); }
export async function deleteDoc(r) { delete store[r.path]; emit(); }
export async function addDoc(c, data) { const id = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); const r = { kind: "d", path: c.path + "/" + id, id, col: c.path }; put(r, apply(null, data, false)); emit(); return r; }
export async function runTransaction(fs, fn) {
  const w = []; const tx = { get: async r => getDoc(r), set: (r, d, o) => w.push(["s", r, d, o]), update: (r, d) => w.push(["u", r, d]), delete: r => w.push(["x", r]) };
  const res = await fn(tx);
  for (const [k, r, d, o] of w) { if (k === "x") delete store[r.path]; else put(r, apply(store[r.path], d, k === "u" || !!o?.merge)); }
  emit(); return res;
}
