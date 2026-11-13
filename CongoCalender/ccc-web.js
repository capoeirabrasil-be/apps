// CCC website: Google sign-in gate + Firebase adapter that gives the app the same
// window.claude.use("user" | "db" | "downloads") interface it has inside Claude.
// Data (calendar, titles, places, cities) is NOT in the public files: it is read from
// Firestore cal/main after sign-in, and only invited emails (access/{email}) may read it.
const V = "10.14.1";
const FB = window.CCC_FB_BASE || `https://www.gstatic.com/firebasejs/${V}`;
const [{ initializeApp }, A, F] = await Promise.all([
  import(`${FB}/firebase-app.js`), import(`${FB}/firebase-auth.js`), import(`${FB}/firebase-firestore.js`)]);

const app = initializeApp(window.CCC_FIREBASE);
const auth = A.getAuth(app);
const fs = F.getFirestore(app);

// ---- gate UI (own small dictionary: the app's I18N isn't loaded yet) ----
const G = {
  en: { about: "What is this app? Watch the 1-minute video →", tip: "On a phone, open this page in Safari or Chrome, not inside WhatsApp or Instagram.", h: "Members only", p: "The Congo Capoeira Calendar is for invited people. Sign in with the Google account your invite was sent to.", b: "Sign in with Google", wait: "Loading the calendar…", noH: "No access yet", noP: "{e} isn't on the guest list. Ask Formando Congo for an invite, or sign in with another Google account.", other: "Use another account", err: "Sign-in didn't work. Please try again." },
  nl: { about: "Wat is deze app? Bekijk de video van 1 minuut →", tip: "Op een telefoon: open deze pagina in Safari of Chrome, niet binnen WhatsApp of Instagram.", h: "Alleen voor leden", p: "De Congo Capoeira Calendar is voor genodigden. Meld je aan met het Google-account waarnaar je uitnodiging werd gestuurd.", b: "Aanmelden met Google", wait: "Kalender laden…", noH: "Nog geen toegang", noP: "{e} staat niet op de gastenlijst. Vraag Formando Congo om een uitnodiging, of meld je aan met een ander Google-account.", other: "Ander account gebruiken", err: "Aanmelden lukte niet. Probeer opnieuw." },
  pt: { about: "O que é este app? Veja o vídeo de 1 minuto →", tip: "No celular, abra esta página no Safari ou no Chrome, não dentro do WhatsApp ou do Instagram.", h: "Só para membros", p: "O Congo Capoeira Calendar é para convidados. Entre com a conta Google para a qual o convite foi enviado.", b: "Entrar com Google", wait: "Carregando o calendário…", noH: "Ainda sem acesso", noP: "{e} não está na lista de convidados. Peça um convite ao Formando Congo, ou entre com outra conta Google.", other: "Usar outra conta", err: "Não deu para entrar. Tente de novo." },
  fr: { about: "C'est quoi cette app ? Voir la vidéo d'1 minute →", tip: "Sur téléphone, ouvrez cette page dans Safari ou Chrome, pas dans WhatsApp ou Instagram.", h: "Réservé aux membres", p: "Le Congo Capoeira Calendar est réservé aux invités. Connectez-vous avec le compte Google qui a reçu l'invitation.", b: "Se connecter avec Google", wait: "Chargement du calendrier…", noH: "Pas encore d'accès", noP: "{e} n'est pas sur la liste des invités. Demandez une invitation à Formando Congo, ou connectez-vous avec un autre compte Google.", other: "Utiliser un autre compte", err: "La connexion a échoué. Réessayez." },
  es: { about: "¿Qué es esta app? Mira el vídeo de 1 minuto →", tip: "En el móvil, abre esta página en Safari o Chrome, no dentro de WhatsApp o Instagram.", h: "Solo para miembros", p: "El Congo Capoeira Calendar es para invitados. Inicia sesión con la cuenta de Google a la que se envió la invitación.", b: "Iniciar sesión con Google", wait: "Cargando el calendario…", noH: "Aún sin acceso", noP: "{e} no está en la lista de invitados. Pide una invitación a Formando Congo, o inicia sesión con otra cuenta de Google.", other: "Usar otra cuenta", err: "No se pudo iniciar sesión. Inténtalo de nuevo." },
};
const lang = (() => { try { const s = localStorage.getItem("ccc.lang"); if (G[s]) return s; } catch {} const n = (navigator.language || "en").slice(0, 2); return G[n] ? n : "en"; })();
const g = (k, v = {}) => G[lang][k].replace(/\{(\w+)\}/g, (_, x) => v[x] ?? "");
const gate = document.getElementById("gate");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function show(html) { gate.hidden = false; gate.querySelector(".gbody").innerHTML = html; }
const signInBtn = `<button class="gbtn" id="gsign"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>${g("b")}</button>`;
const CID = window.CCC_GOOGLE_CLIENT_ID || "";
function loadGis() { return new Promise((res, rej) => { if (window.google?.accounts?.id) return res(); const x = document.createElement("script"); x.src = "https://accounts.google.com/gsi/client"; x.async = true; x.onload = res; x.onerror = rej; document.head.appendChild(x); }); }
let gisReady = false;
async function renderGis() {
  try {
    await loadGis();
    if (!gisReady) {
      google.accounts.id.initialize({ client_id: CID, ux_mode: "popup", auto_select: false, itp_support: true, use_fedcm_for_prompt: true,
        callback: async r => { try { await A.signInWithCredential(auth, A.GoogleAuthProvider.credential(r.credential)); } catch { showSignIn(true); } } });
      gisReady = true;
    }
    const el = document.getElementById("gsibtn"); if (!el) return;
    el.innerHTML = "";
    google.accounts.id.renderButton(el, { theme: "outline", size: "large", shape: "pill", text: "signin_with", locale: lang, width: 280 });
  } catch { const el = document.getElementById("gsibtn"); if (el) el.outerHTML = signInBtn; }
}
// Google's own button (Google Identity Services) signs in on this page itself, so it works on iPhone,
// where the Firebase popup/redirect flow breaks on storage partitioning. Falls back to the popup button.
function showSignIn(err) {
  show(`<h2>${g("h")}</h2><p>${g("p")}</p>${CID ? `<div id="gsibtn" class="gsi"></div>` : signInBtn}${err ? `<p class="gerr">${g("err")}</p>` : ""}<p class="gtip">${g("tip")}</p><p class="gabout"><a href="info/?lang=${lang}">${g("about")}</a></p>`);
  if (CID) renderGis();
}
function showNoAccess(email) { show(`<h2>${g("noH")}</h2><p>${esc(g("noP", { e: email }))}</p><button class="gbtn" id="gother">${g("other")}</button><p class="gabout"><a href="info/?lang=${lang}">${g("about")}</a></p>`); }

async function signIn() {
  const p = new A.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
  try { await A.signInWithPopup(auth, p); }
  catch (e) { if (e?.code !== "auth/popup-closed-by-user" && e?.code !== "auth/cancelled-popup-request") showSignIn(true); }
}
gate.addEventListener("click", ev => {
  if (ev.target.closest("#gsign")) signIn();
  if (ev.target.closest("#gother")) { try { window.google?.accounts?.id?.disableAutoSelect(); } catch {} A.signOut(auth); }
});
window.cccSignOut = () => A.signOut(auth).then(() => location.reload());

// ---- db adapter: Firestore behind the app's db interface ----
const lc = s => String(s || "").trim().toLowerCase();
const snapOf = (docs, fromCache = false) => ({ docs, size: docs.length, metadata: { fromCache } });
const wrapDocs = qs => qs.docs.map(d => ({ id: d.id, data: () => d.data() }));
let ACCESS = []; // owner only: [{email, role, revoked, at, revokedAt}]
function collectionAdapter(name) {
  if (name === "revoked") { // access is enforced by the rules; nothing to watch or write
    return { onSnapshot(cb) { cb(snapOf([])); return () => {}; }, doc: () => ({ set: async () => {}, delete: async () => {} }) };
  }
  if (name === "invites") { // invites are access/{email} docs
    return {
      onSnapshot(cb, err) {
        return F.onSnapshot(F.collection(fs, "access"), qs => {
          ACCESS = qs.docs.map(d => ({ email: d.id, ...d.data() }));
          cb(snapOf(ACCESS.filter(x => x.role !== "owner").map(x => ({ id: x.email, data: () => ({ email: x.email, at: x.at || "", revoked: !!x.revoked, revokedAt: x.revokedAt || "" }) }))));
        }, err);
      },
      doc(id) {
        return {
          async set(data) {
            const email = lc(data.email || id); if (!email.includes("@")) return;
            const cur = ACCESS.find(x => x.email === email);
            await F.setDoc(F.doc(fs, "access", email), { role: cur?.role || "viewer", at: data.at || cur?.at || new Date().toISOString(), revoked: !!data.revoked, revokedAt: data.revokedAt || "" });
          },
          async delete() { const email = lc(id); if (email.includes("@")) await F.deleteDoc(F.doc(fs, "access", email)); },
        };
      },
    };
  }
  const col = F.collection(fs, name);
  return {
    onSnapshot(cb, err) { return F.onSnapshot(col, { includeMetadataChanges: false }, qs => cb(snapOf(wrapDocs(qs), qs.metadata.fromCache)), err); },
    doc(id) { const r = F.doc(fs, name, id); return { set: data => F.setDoc(r, data), delete: () => F.deleteDoc(r) }; },
  };
}


// ---- hub: per-person data (going, profile, car seats, refresh request) ----
// going/{email} {events:[ids]} and profiles/{email} {first,last,capo}: each person writes only their own; owners read all.
// cars/{event~driver} {event, driver, driverName, seats, riders:[emails]}: owners write; members add or remove only themselves.
function makeHub(user, owner) {
  const me = lc(user.email); const subs = [];
  const st = { going: [], profile: {}, cars: [], allGoing: [], profiles: {}, sugg: [], seen: {} };
  let fire = () => {};
  const on = (ref, f) => subs.push(F.onSnapshot(ref, f, () => {}));
  return {
    me, owner,
    watch(cb) {
      fire = () => cb(st);
      on(F.doc(fs, "going", me), s => { st.going = s.exists() ? s.data().events || [] : []; fire(); });
      on(F.doc(fs, "profiles", me), s => { st.profile = s.exists() ? s.data() : {}; fire(); });
      on(F.collection(fs, "cars"), qs => { st.cars = qs.docs.map(d => ({ id: d.id, ...d.data() })); fire(); });
      // suggestions/{id} {text, by, byName, at, status: new|ask|answered|go|done|nogo, question, reply}: members see their own, owners all.
      const sq = owner ? F.collection(fs, "suggestions") : F.query(F.collection(fs, "suggestions"), F.where("by", "==", me));
      on(sq, qs => { st.sugg = qs.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.at).localeCompare(String(a.at))); fire(); });
      if (owner) {
        on(F.collection(fs, "going"), qs => { st.allGoing = qs.docs.map(d => ({ email: d.id, events: d.data().events || [] })); fire(); });
        on(F.collection(fs, "seen"), qs => { st.seen = Object.fromEntries(qs.docs.map(d => [d.id, d.data()])); fire(); });
        on(F.collection(fs, "profiles"), qs => { st.profiles = Object.fromEntries(qs.docs.map(d => [d.id, d.data()])); fire(); });
      }
    },
    suggest: (text, byName) => F.addDoc(F.collection(fs, "suggestions"), { text: String(text).slice(0, 2000), by: me, byName: String(byName || "").slice(0, 80), at: new Date().toISOString(), status: "new" }),
    sugReply: (id, reply) => F.updateDoc(F.doc(fs, "suggestions", id), { reply: String(reply).slice(0, 2000), status: "answered", repliedAt: new Date().toISOString() }),
    sugSeen: (id, field) => F.updateDoc(F.doc(fs, "suggestions", id), { [field === "seenNogo" ? "seenNogo" : "seenBy"]: true }),
    sugResubmit: (id, text) => F.updateDoc(F.doc(fs, "suggestions", id), { text: String(text).slice(0, 2000), status: "new", resubmittedAt: new Date().toISOString(), seenNogo: true }),
    sugSet: (id, data) => F.updateDoc(F.doc(fs, "suggestions", id), { ...data, by_owner: me, changedAt: new Date().toISOString() }),
    setGoing: (id, yes) => F.setDoc(F.doc(fs, "going", me), { events: yes ? F.arrayUnion(id) : F.arrayRemove(id), at: new Date().toISOString() }, { merge: true }),
    setProfile: p => F.setDoc(F.doc(fs, "profiles", me), { first: String(p.first || "").slice(0, 60), last: String(p.last || "").slice(0, 60), capo: String(p.capo || "").slice(0, 60), at: new Date().toISOString() }),
    async setCar(event, seats, driverName, from = "", leave = "") {
      const ref = F.doc(fs, "cars", `${event}~${me}`);
      if (!seats) return F.deleteDoc(ref);
      await F.runTransaction(fs, async tx => {
        const s = await tx.get(ref); const riders = s.exists() ? s.data().riders || [] : [];
        tx.set(ref, { event, driver: me, driverName: driverName || "", seats: Math.max(seats, riders.length), riders, from: String(from).slice(0, 120), leave: String(leave).slice(0, 5), at: new Date().toISOString() });
      });
    },
    // First come, first served: the transaction re-reads the car, so two people can't take the last seat.
    async seat(carId, take) {
      const ref = F.doc(fs, "cars", carId);
      return F.runTransaction(fs, async tx => {
        const s = await tx.get(ref); if (!s.exists()) throw Object.assign(new Error("gone"), { code: "gone" });
        const c = s.data(), r = c.riders || [];
        if (take) { if (r.includes(me)) return "ok"; if (r.length >= c.seats) throw Object.assign(new Error("full"), { code: "full" }); tx.update(ref, { riders: [...r, me] }); }
        else { if (!r.includes(me)) return "ok"; tx.update(ref, { riders: r.filter(x => x !== me) }); }
        return "ok";
      });
    },
    requestRefresh: () => F.setDoc(F.doc(fs, "refresh", "request"), { at: new Date().toISOString(), by: me, done: false }),
  };
}

async function startApp(user) {
  show(`<p class="gwait">${g("wait")}</p>`);
  let data;
  try {
    const snap = await F.getDoc(F.doc(fs, "cal", "main"));
    if (!snap.exists()) throw Object.assign(new Error("empty"), { code: "not-found" });
    data = JSON.parse(snap.data().json);
  } catch (e) {
    started = false;
    if (e?.code === "permission-denied") return showNoAccess(user.email);
    return show(`<h2>${g("noH")}</h2><p>${esc(e?.message || e)}</p>`);
  }
  // Owner = may list the access collection (rules allow that for the owner only).
  let owner = false;
  try { await F.getDocs(F.query(F.collection(fs, "access"), F.limit(1))); owner = true; } catch {}
  window.__CCC = data;
  const HUB = makeHub(user, owner);
  // "Last online" for the owner's member list: seen/{email} {last, days:[YYYY-MM-DD], opens}. At most one write per 15 minutes.
  const ping = () => {
    if (document.visibilityState !== "visible") return;
    let prev = 0; try { prev = +localStorage.getItem("ccc.ping") || 0; } catch {}
    if (Date.now() - prev < 15 * 60e3) return;
    try { localStorage.setItem("ccc.ping", String(Date.now())); } catch {}
    const now = new Date(), day = now.toISOString().slice(0, 10);
    F.setDoc(F.doc(fs, "seen", lc(user.email)), { last: now.toISOString(), days: F.arrayUnion(day), opens: F.increment(1) }, { merge: true }).catch(() => {});
  };
  ping(); document.addEventListener("visibilitychange", ping);
  window.claude = {
    async use(cap) {
      if (cap === "user") return { isOwner: async () => owner, me: async () => ({ email: user.email || "", name: user.displayName || "" }) };
      if (cap === "db") return { collection: collectionAdapter };
      if (cap === "hub") return HUB;
      if (cap === "downloads") return { async save({ filename, data }) { const u = URL.createObjectURL(data); const a = document.createElement("a"); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); } };
      throw new Error("unavailable: " + cap);
    },
  };
  const s = document.createElement("script");
  s.textContent = document.getElementById("cccapp").textContent;
  document.body.appendChild(s);
  gate.hidden = true;
}

let started = false;
A.onAuthStateChanged(auth, user => {
  if (!user) { if (started) location.reload(); else showSignIn(false); return; }
  if (!started) { started = true; startApp(user); }
});
