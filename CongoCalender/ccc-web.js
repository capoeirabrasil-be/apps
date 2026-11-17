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
// "Available offline" (Settings, per device): Firestore keeps a copy of the calendar on the phone (IndexedDB),
// so the app opens without internet. ccc.offline = "on" | "clear" (switched off: wipe the copy once) | unset.
const OFFLINE = (() => { try { return localStorage.getItem("ccc.offline"); } catch { return null; } })();
let fs;
if (OFFLINE === "refresh") {   // "Clear cache and refresh": wipe the saved copy (calendar data + app files), keep offline switched on, reload once
  window.cccOffline = { on: false, set() {} };
  fs = F.getFirestore(app);
  try { await F.clearIndexedDbPersistence(fs); } catch {}
  try { for (const k of await caches.keys()) if (k.startsWith("ccc") && k !== "ccc-flag") await caches.delete(k); } catch {}
  try { localStorage.setItem("ccc.offline", "on"); } catch {}
  location.reload(); await new Promise(() => {});
} else if (OFFLINE === "on") { try { fs = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) }); } catch { fs = F.getFirestore(app); } }
else { fs = F.getFirestore(app); if (OFFLINE === "clear") { try { await F.clearIndexedDbPersistence(fs); localStorage.removeItem("ccc.offline"); } catch {} try { for (const k of await caches.keys()) if (k.startsWith("ccc") && k !== "ccc-flag") await caches.delete(k); } catch {} } }
// Tell the service worker whether this phone has "Available offline" on: then the app page opens from the phone's copy first and refreshes in the background.
try { if (OFFLINE === "on") caches.open("ccc-flag").then(c => c.put("ccc-flag-on", new Response("1"))); else caches.delete("ccc-flag"); } catch {}
window.cccOffline = {
  on: OFFLINE === "on",
  set(on) { try { localStorage.setItem("ccc.offline", on ? "on" : "clear"); } catch {} location.reload(); },
};

// ---- gate UI (own small dictionary: the app's I18N isn't loaded yet) ----
const G = {
  en: { req: "Request access", reqOk: "Request sent. Formando Congo will see it and let you in.", ms: "Sign in with Microsoft", alt: "Sign-in not working? Try another way", about: "What is this app? Watch the 1-minute video →", tip: "On a phone, open this page in Safari or Chrome, not inside WhatsApp or Instagram.", h: "Members only", p: "The Congo Capoeira Calendar is for invited people. Sign in with the Google account your invite was sent to.", b: "Sign in with Google", wait: "Loading the calendar…", noH: "No access yet", noP: "{e} isn't on the guest list. Ask Formando Congo for an invite, or sign in with another Google account.", other: "Use another account", err: "Sign-in didn't work. Please try again." },
  nl: { req: "Toegang aanvragen", reqOk: "Aanvraag verstuurd. Formando Congo ziet het en laat je binnen.", ms: "Aanmelden met Microsoft", alt: "Lukt aanmelden niet? Probeer een andere manier", about: "Wat is deze app? Bekijk de video van 1 minuut →", tip: "Op een telefoon: open deze pagina in Safari of Chrome, niet binnen WhatsApp of Instagram.", h: "Alleen voor leden", p: "De Congo Capoeira Calendar is voor genodigden. Meld je aan met het Google-account waarnaar je uitnodiging werd gestuurd.", b: "Aanmelden met Google", wait: "Kalender laden…", noH: "Nog geen toegang", noP: "{e} staat niet op de gastenlijst. Vraag Formando Congo om een uitnodiging, of meld je aan met een ander Google-account.", other: "Ander account gebruiken", err: "Aanmelden lukte niet. Probeer opnieuw." },
  pt: { req: "Pedir acesso", reqOk: "Pedido enviado. O Formando Congo vai ver e deixar você entrar.", ms: "Entrar com Microsoft", alt: "Não consegue entrar? Tente de outro jeito", about: "O que é este app? Veja o vídeo de 1 minuto →", tip: "No celular, abra esta página no Safari ou no Chrome, não dentro do WhatsApp ou do Instagram.", h: "Só para membros", p: "O Congo Capoeira Calendar é para convidados. Entre com a conta Google para a qual o convite foi enviado.", b: "Entrar com Google", wait: "Carregando o calendário…", noH: "Ainda sem acesso", noP: "{e} não está na lista de convidados. Peça um convite ao Formando Congo, ou entre com outra conta Google.", other: "Usar outra conta", err: "Não deu para entrar. Tente de novo." },
  fr: { req: "Demander l'accès", reqOk: "Demande envoyée. Formando Congo la verra et vous laissera entrer.", ms: "Se connecter avec Microsoft", alt: "La connexion ne marche pas ? Essayez autrement", about: "C'est quoi cette app ? Voir la vidéo d'1 minute →", tip: "Sur téléphone, ouvrez cette page dans Safari ou Chrome, pas dans WhatsApp ou Instagram.", h: "Réservé aux membres", p: "Le Congo Capoeira Calendar est réservé aux invités. Connectez-vous avec le compte Google qui a reçu l'invitation.", b: "Se connecter avec Google", wait: "Chargement du calendrier…", noH: "Pas encore d'accès", noP: "{e} n'est pas sur la liste des invités. Demandez une invitation à Formando Congo, ou connectez-vous avec un autre compte Google.", other: "Utiliser un autre compte", err: "La connexion a échoué. Réessayez." },
  es: { req: "Pedir acceso", reqOk: "Solicitud enviada. Formando Congo la verá y te dejará entrar.", ms: "Iniciar sesión con Microsoft", alt: "¿No puedes iniciar sesión? Prueba de otra forma", about: "¿Qué es esta app? Mira el vídeo de 1 minuto →", tip: "En el móvil, abre esta página en Safari o Chrome, no dentro de WhatsApp o Instagram.", h: "Solo para miembros", p: "El Congo Capoeira Calendar es para invitados. Inicia sesión con la cuenta de Google a la que se envió la invitación.", b: "Iniciar sesión con Google", wait: "Cargando el calendario…", noH: "Aún sin acceso", noP: "{e} no está en la lista de invitados. Pide una invitación a Formando Congo, o inicia sesión con otra cuenta de Google.", other: "Usar otra cuenta", err: "No se pudo iniciar sesión. Inténtalo de nuevo." },
  pl: { req: "Poproś o dostęp", reqOk: "Prośba wysłana. Formando Congo ją zobaczy i wpuści Cię.", ms: "Zaloguj się przez Microsoft", alt: "Logowanie nie działa? Spróbuj inaczej", about: "Co to za aplikacja? Obejrzyj 1-minutowy film →", tip: "Na telefonie otwórz tę stronę w Safari lub Chrome, nie wewnątrz WhatsApp czy Instagrama.", h: "Tylko dla członków", p: "Congo Capoeira Calendar jest dla zaproszonych osób. Zaloguj się kontem Google, na które wysłano zaproszenie.", b: "Zaloguj się przez Google", wait: "Ładowanie kalendarza…", noH: "Brak dostępu", noP: "{e} nie ma na liście gości. Poproś Formando Congo o zaproszenie lub zaloguj się innym kontem Google.", other: "Użyj innego konta", err: "Logowanie nie zadziałało. Spróbuj ponownie." },
  uk: { req: "Попросити доступ", reqOk: "Запит надіслано. Formando Congo побачить його і впустить вас.", ms: "Увійти через Microsoft", alt: "Вхід не працює? Спробуйте інакше", about: "Що це за застосунок? Подивіться відео на 1 хвилину →", tip: "На телефоні відкрийте цю сторінку в Safari або Chrome, а не всередині WhatsApp чи Instagram.", h: "Лише для учасників", p: "Congo Capoeira Calendar призначений для запрошених людей. Увійдіть через обліковий запис Google, на який надіслано запрошення.", b: "Увійти через Google", wait: "Завантаження календаря…", noH: "Поки що немає доступу", noP: "{e} немає в списку гостей. Попросіть у Formando Congo запрошення або увійдіть через інший обліковий запис Google.", other: "Використати інший обліковий запис", err: "Вхід не вдався. Спробуйте ще раз." },
  de: { req: "Zugang anfragen", reqOk: "Anfrage gesendet. Formando Congo sieht sie und lässt dich rein.", ms: "Mit Microsoft anmelden", alt: "Anmeldung klappt nicht? Versuche es anders", about: "Was ist das für eine App? Sieh dir das 1-Minuten-Video an →", tip: "Öffne diese Seite auf dem Handy in Safari oder Chrome, nicht in WhatsApp oder Instagram.", h: "Nur für Mitglieder", p: "Der Congo Capoeira Calendar ist für eingeladene Leute. Melde dich mit dem Google-Konto an, an das die Einladung ging.", b: "Mit Google anmelden", wait: "Kalender wird geladen …", noH: "Noch kein Zugang", noP: "{e} steht nicht auf der Gästeliste. Frag Formando Congo nach einer Einladung oder melde dich mit einem anderen Google-Konto an.", other: "Anderes Konto verwenden", err: "Die Anmeldung hat nicht geklappt. Bitte versuche es erneut." },
};
const lang = (() => { try { const s = localStorage.getItem("ccc.lang"); if (G[s]) return s; } catch {} const n = (navigator.language || "en").slice(0, 2); return G[n] ? n : "en"; })();
const g = (k, v = {}) => G[lang][k].replace(/\{(\w+)\}/g, (_, x) => v[x] ?? "");
const gate = document.getElementById("gate");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function show(html) { gate.hidden = false; gate.querySelector(".gbody").innerHTML = html; }
// Microsoft sign-in (Firebase provider microsoft.com). Keep false until Steven has registered the app in Entra, enabled the
// provider in the Firebase console AND pasted the rules that accept Microsoft accounts (firestore-rules-to-paste.txt) and said "firestore rules updated".
const MS_READY = false;
const msBtn = () => MS_READY ? `<button class="gbtn" id="msign" style="margin-top:10px"><svg viewBox="0 0 23 23" width="20" height="20" aria-hidden="true"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg> ${g("ms")}</button>` : "";
const signInBtn = `<button class="gbtn" id="gsign"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>${g("b")}</button>`;
// Firefox (Android and desktop) blocks the third-party cookies Google's own button needs and has no FedCM,
// so it gets the Firebase popup button. Everyone else gets Google's button plus a link to the popup way.
const FIREFOX = /Firefox\/|FxiOS\//.test(navigator.userAgent);
const CID = FIREFOX ? "" : (window.CCC_GOOGLE_CLIENT_ID || "");
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
  show(`<h2>${g("h")}</h2><p>${g("p")}</p>${CID ? `<div id="gsibtn" class="gsi"></div><p class="gtip"><a href="#" id="galt">${g("alt")}</a></p>` : signInBtn}${msBtn()}${err ? `<p class="gerr">${g("err")}</p>` : ""}<p class="gtip">${g("tip")}</p><p class="gabout"><a href="info/?lang=${lang}">${g("about")}</a></p>`);
  if (CID) renderGis();
}
function showNoAccess(email) { show(`<h2>${g("noH")}</h2><p>${esc(g("noP", { e: email }))}</p>${ACCESSREQ_READY ? `<button class="gbtn" id="greq" style="margin-bottom:10px">🙋 ${g("req")}</button>` : ""}<button class="gbtn" id="gother">${g("other")}</button><p class="gabout"><a href="info/?lang=${lang}">${g("about")}</a></p>`); }

async function signIn() {
  const p = new A.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
  try { await A.signInWithPopup(auth, p); }
  catch (e) { if (e?.code !== "auth/popup-closed-by-user" && e?.code !== "auth/cancelled-popup-request") showSignIn(true); }
}
async function signInMs() {
  const p = new A.OAuthProvider("microsoft.com"); p.setCustomParameters({ prompt: "select_account", tenant: "consumers" }); p.addScope("email"); // personal Microsoft accounts only: their email is verified, work/school (Entra) emails can be faked
  try { await A.signInWithPopup(auth, p); }
  catch (e) { if (e?.code !== "auth/popup-closed-by-user" && e?.code !== "auth/cancelled-popup-request") showSignIn(true); }
}
gate.addEventListener("click", ev => {
  if (ev.target.closest("#gsign")) signIn();
  if (ev.target.closest("#msign")) signInMs();
  if (ev.target.closest("#galt")) { ev.preventDefault(); signIn(); }
  if (ev.target.closest("#greq")) { const u = auth.currentUser, b = document.getElementById("greq"); if (u && b) { b.disabled = true; F.setDoc(F.doc(fs, "accessreq", lc(u.email)), { email: lc(u.email), name: String(u.displayName || "").slice(0, 80), at: new Date().toISOString() }).then(() => { b.outerHTML = `<p class="gtip">✅ ${g("reqOk")}</p>`; }).catch(() => { b.disabled = false; }); } }
  if (ev.target.closest("#gother")) { try { window.google?.accounts?.id?.disableAutoSelect(); } catch {} A.signOut(auth); }
});
// Signing out also wipes the offline copy on this device (the switch stays on for the next sign-in).
window.cccSignOut = () => A.signOut(auth).then(async () => { if (OFFLINE === "on") { try { await F.terminate(fs); await F.clearIndexedDbPersistence(fs); } catch {} } location.reload(); });

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
// Features that need Firestore rules Steven has not confirmed yet stay off until he says "firestore rules updated".
// Bump RULES_READY to true only after that confirmation (and a check that the live rules match firestore.rules.final).
// Access requests (accessreq/{email}) need a rules block: stays off until Steven confirms "Firestore rules updated".
const ACCESSREQ_READY = true;
// Drivers, car cost sharing and paid marks (cars/{id} updates by the driver) need a rules block: off until Steven confirms "Firestore rules updated".
const CARCOST_READY = true;
// Members choose for themselves to be a driver (needs the cars create/delete rule): keep false until Steven says "firestore rules updated" and the live rules match the file.
const SELFDRIVE_READY = true;
const RULES_READY = true;
// Phone push for owners: pushTokens/{email} {devices: {<deviceId>: {token, at, ua, lang}}}. Needs the pushTokens rule
// and the public web push (VAPID) key in firebase-config.js. Off until Steven says "firestore rules updated".
const PUSH_READY = true;
// Push for regular members too (pushTokens rule changed to isViewer); owners see invitees' phone type. Keep false until Steven says "firestore rules updated" and the live rules match the file.
const MPUSH_READY = true;
// Phone type in the "last online" record (seen/{email}.phone) needs the seen rule to allow the key "phone". Keep false until Steven says "firestore rules updated" and the live rules match the file.
const SEENPHONE_READY = true;
// Organiser messages to members, and change of login e-mail (messages/{email}, emailChanges/{old}) need new Firestore rules. Keep false until Steven says "firestore rules updated" and the live rules match the file.
const MSG_READY = true;
// Event chat (chats/{eventId} + chats/{eventId}/m/{id}) needs new Firestore rules. Keep false until Steven says "firestore rules updated" and the live rules match the file.
const CHAT_READY = true;
// Private chat per person per event (dms/{eventId~email} + /m/{id}) needs new Firestore rules. Keep false until Steven says "firestore rules updated" and the live rules match the file.
const DM_READY = true;
const phoneLabel = () => { const u = navigator.userAgent, m = /Android[^;)]*;\s*([^;)]+)/.exec(u); return /iPhone/.test(u) ? "iPhone" : /iPad/.test(u) ? "iPad" : /Android/.test(u) ? "Android" + (m && !/^(K|Mobile)$/.test(m[1].trim()) ? " (" + m[1].trim().slice(0, 40) + ")" : "") : /Windows|Macintosh|Linux/.test(u) ? "Computer" : "?"; };
// Flyers need new Firestore rules (flyers + flyerImg). Keep false until Steven says "firestore rules updated" and live rules match the file.
const FLYERS_READY = true;
// Linked accounts: these emails share one profile, going list and car seats (Steven, 15 Nov). Needs the rule change for going/profiles
// (owners may write them). Keep false until Steven says "firestore rules updated" and the live rules match the file; then run the data move.
const LINKS_READY = true;
// Description edits (descs/{id}) need a new Firestore rule. Keep false until Steven says "firestore rules updated" and the live rules match the file.
const DESC_READY = true;
const LINKS = { "steven.demei@gmail.com": "visaodojogo@gmail.com", "congocapoeira@gmail.com": "visaodojogo@gmail.com", "capoeirabrasilbelgium@gmail.com": "visaodojogo@gmail.com" };
const PUSH_ON = () => PUSH_READY && !!window.CCC_VAPID && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
let MSG = null;
async function messaging() {
  if (MSG) return MSG;
  const M = await import(`${FB}/firebase-messaging.js`);
  if (!(await M.isSupported())) throw Object.assign(new Error("unsupported"), { code: "unsupported" });
  return (MSG = { M, m: M.getMessaging(app) });
}
const devId = () => { try { let d = localStorage.getItem("ccc.dev"); if (!d) { d = Math.random().toString(36).slice(2, 12); localStorage.setItem("ccc.dev", d); } return d; } catch { return "web"; } };
function makeHub(user, owner) {
  const real = lc(user.email); const me = LINKS_READY && LINKS[real] ? LINKS[real] : real; const ids = LINKS_READY && (LINKS[real] || Object.values(LINKS).includes(real)) ? [...new Set([...Object.keys(LINKS), ...Object.values(LINKS)])] : [real]; const subs = [];
  const st = { going: [], profile: {}, cars: [], allGoing: [], profiles: {}, sugg: [], seen: {}, flyers: {}, descs: {} };
  let fire = () => {};
  const on = (ref, f) => subs.push(F.onSnapshot(ref, f, () => {}));
  return {
    me, own: e => ids.includes(lc(e)), owner, msgReady: MSG_READY, chatReady: CHAT_READY, dmReady: DM_READY, rulesReady: RULES_READY, accessReady: ACCESSREQ_READY, carCostReady: CARCOST_READY, selfDriveReady: SELFDRIVE_READY, flyersReady: FLYERS_READY, descsReady: DESC_READY,
    watch(cb) {
      fire = () => cb(st);
      on(F.doc(fs, "going", me), s => { st.going = s.exists() ? s.data().events || [] : []; st.goingRoles = s.exists() ? s.data().roles || {} : {}; fire(); });
      on(F.doc(fs, "profiles", me), s => { st.profile = s.exists() ? s.data() : {}; st.profileLoaded = true; fire(); });
      on(F.collection(fs, "cars"), qs => { st.cars = qs.docs.map(d => ({ id: d.id, ...d.data() })); fire(); });
      // suggestions/{id} {text, by, byName, at, status: new|ask|answered|go|done|nogo, question, reply}: members see their own, owners all.
      const sq = owner ? F.collection(fs, "suggestions") : F.query(F.collection(fs, "suggestions"), F.where("by", "==", real));
      on(sq, qs => { st.sugg = qs.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.at).localeCompare(String(a.at))); fire(); });
      if (MSG_READY) on(F.doc(fs, "messages", real), s => { st.msgs = s.exists() ? s.data() : {}; fire(); });
      if (FLYERS_READY) on(F.collection(fs, "flyers"), qs => { st.flyers = Object.fromEntries(qs.docs.map(d => [d.id, d.data()])); fire(); });
      if (DESC_READY) on(F.collection(fs, "descs"), qs => { st.descs = Object.fromEntries(qs.docs.map(d => [d.id, d.data()])); fire(); });
      if (owner) {
        on(F.collection(fs, "going"), qs => { st.allGoing = qs.docs.map(d => ({ email: d.id, events: d.data().events || [], roles: d.data().roles || {} })); fire(); });
        if (MPUSH_READY) on(F.collection(fs, "pushTokens"), qs => { st.tokens = Object.fromEntries(qs.docs.map(d => [d.id, d.data()])); fire(); });
        on(F.collection(fs, "seen"), qs => { st.seen = Object.fromEntries(qs.docs.map(d => [d.id, d.data()])); fire(); });
        on(F.collection(fs, "profiles"), qs => { st.profiles = Object.fromEntries(qs.docs.map(d => [d.id, d.data()])); fire(); });
      }
    },
    chatWatch: (eid, cb) => F.onSnapshot(F.collection(fs, "chats", String(eid), "m"), qs => cb(qs.docs.map(d => ({ id: d.id, ...d.data() }))), () => cb([])),
    async chatSend(eid, text, name, until) {
      eid = String(eid); const at = new Date().toISOString();
      await F.setDoc(F.doc(fs, "chats", eid), { until, at, lastBy: real }, { merge: true });
      await F.addDoc(F.collection(fs, "chats", eid, "m"), { text: String(text).slice(0, 500), by: real, name: String(name || "").slice(0, 60), at, until });
    },
    chatMeta(eids, cb) { // unread highlight: latest message time per chat (group: chats/{eid}, private: dms/{eid~email})
      const m = { g: {}, d: {} }, offs = [], fire = () => cb({ g: { ...m.g }, d: { ...m.d } });
      const put = (k, id, d) => { if (d) m[k][id] = { at: d.at || "", lastBy: d.lastBy || "" }; else delete m[k][id]; };
      if (!CHAT_READY && !DM_READY) return () => {};
      if (eids === null) {
        if (CHAT_READY) offs.push(F.onSnapshot(F.collection(fs, "chats"), qs => { m.g = {}; qs.docs.forEach(d => put("g", d.id, d.data())); fire(); }, () => {}));
        if (DM_READY) offs.push(F.onSnapshot(F.collection(fs, "dms"), qs => { m.d = {}; qs.docs.forEach(d => put("d", d.id, d.data())); fire(); }, () => {}));
      } else eids.forEach(e => {
        if (CHAT_READY) offs.push(F.onSnapshot(F.doc(fs, "chats", String(e)), s => { put("g", e, s.exists() ? s.data() : null); fire(); }, () => {}));
        if (DM_READY) offs.push(F.onSnapshot(F.doc(fs, "dms", e + "~" + real), s => { put("d", e + "~" + real, s.exists() ? s.data() : null); fire(); }, () => {}));
      });
      return () => offs.forEach(o => { try { o(); } catch {} });
    },
    dmWatch: (did, cb) => F.onSnapshot(F.collection(fs, "dms", String(did), "m"), qs => cb(qs.docs.map(d => ({ id: d.id, ...d.data() }))), () => cb([])),
    async dmSend(did, text, name, until, title) {
      did = String(did); const at = new Date().toISOString(), txt = String(text).slice(0, 500);
      await F.setDoc(F.doc(fs, "dms", did), { until, at, last: txt.slice(0, 200), lastBy: real, lastName: String(name || "").slice(0, 60), title: String(title || "").slice(0, 120) }, { merge: true });
      await F.addDoc(F.collection(fs, "dms", did, "m"), { text: txt, by: real, name: String(name || "").slice(0, 60), at, until });
    },
    sendMsg: (em, text) => F.setDoc(F.doc(fs, "messages", lc(em)), { items: F.arrayUnion({ id: Date.now().toString(36), text: String(text).slice(0, 500), at: new Date().toISOString(), by: real }) }, { merge: true }),
    msgRead: at => F.setDoc(F.doc(fs, "messages", real), { readUpTo: String(at) }, { merge: true }),
    async changeLogin(old, neu) {
      old = lc(old); neu = lc(neu); const at = new Date().toISOString(), cur = ACCESS.find(x => x.email === old);
      await F.setDoc(F.doc(fs, "access", neu), { role: cur?.role || "viewer", at, revoked: false, revokedAt: "" });
      await F.setDoc(F.doc(fs, "access", old), { role: cur?.role || "viewer", at: cur?.at || at, revoked: true, revokedAt: at, movedTo: neu });
      await F.setDoc(F.doc(fs, "emailChanges", old), { to: neu, at, by: real, done: false });
    },
    setDesc: (id, text, extra) => F.setDoc(F.doc(fs, "descs", String(id)), { text: String(text).slice(0, 4000), by: real, at: new Date().toISOString(), synced: false, ...(extra ? { src: extra.src, t: extra.t } : { src: F.deleteField(), t: F.deleteField() }) }, { merge: true }),
    setLoc: (id, loc) => F.setDoc(F.doc(fs, "descs", String(id)), { loc: String(loc).slice(0, 300), by: real, at: new Date().toISOString(), synced: false }, { merge: true }),
    flyerLocUsed: id => F.setDoc(F.doc(fs, "flyers", String(id)), { locUsed: true }, { merge: true }),
    flyerImg: async id => { const d = await F.getDoc(F.doc(fs, "flyerImg", String(id))); return d.exists() ? d.data().img : null; },
    setFlyer: async (id, img) => { id = String(id); const at = new Date().toISOString(); await F.setDoc(F.doc(fs, "flyerImg", id), { img, at, by: real }); await F.setDoc(F.doc(fs, "flyers", id), { has: true, read: false, by: real, at, imgAt: at }, { merge: true }); },
    pubDecide: (id, choice) => F.setDoc(F.doc(fs, "flyers", String(id)), { choice, choiceAt: new Date().toISOString() }, { merge: true }),
    flyerUsed: id => F.setDoc(F.doc(fs, "flyers", String(id)), { descUsed: true }, { merge: true }),
    delFlyer: async id => { id = String(id); await F.deleteDoc(F.doc(fs, "flyerImg", id)); await F.setDoc(F.doc(fs, "flyers", id), { has: false, imgRemovedAt: new Date().toISOString() }, { merge: true }); },
    suggest: (text, byName, kind, shots) => F.addDoc(F.collection(fs, "suggestions"), { text: String(text).slice(0, 2000), by: real, byName: String(byName || "").slice(0, 80), at: new Date().toISOString(), status: "new", kind: kind === "bug" || kind === "feedback" ? kind : "idea", ...((kind === "bug" || kind !== "feedback") && Array.isArray(shots) && shots.length ? { shots: shots.filter(x => typeof x === "string" && x.startsWith("data:image/")).slice(0, 3) } : {}) }),
    sugReply: (id, reply) => F.updateDoc(F.doc(fs, "suggestions", id), { reply: String(reply).slice(0, 2000), status: "answered", repliedAt: new Date().toISOString() }),
    sugSeen: (id, field) => F.updateDoc(F.doc(fs, "suggestions", id), { [field === "seenNogo" ? "seenNogo" : "seenBy"]: true }),
    sugResubmit: (id, text) => F.updateDoc(F.doc(fs, "suggestions", id), { text: String(text).slice(0, 2000), status: "new", resubmittedAt: new Date().toISOString(), seenNogo: true }),
    sugSet: (id, data) => F.updateDoc(F.doc(fs, "suggestions", id), { ...data, by_owner: real, changedAt: new Date().toISOString() }),
    setGoing: (id, yes) => F.setDoc(F.doc(fs, "going", me), { events: yes ? F.arrayUnion(id) : F.arrayRemove(id), at: new Date().toISOString() }, { merge: true }),
    setGoingRole: (id, role) => F.setDoc(F.doc(fs, "going", me), { roles: { [String(id)]: role }, at: new Date().toISOString() }, { merge: true }),
    // Owner-written feature for the build list (no Go / No Go): created as "new" (rules), then set to "go" at once.
    async adminFeature(text, byName, now, shots) {
      const at = new Date().toISOString();
      const r = await F.addDoc(F.collection(fs, "suggestions"), { text: String(text).slice(0, 2000), by: real, byName: String(byName || "").slice(0, 80), at, status: "new", kind: "idea", admin: true, notified: "go", ...(Array.isArray(shots) && shots.length ? { shots: shots.filter(x => typeof x === "string" && x.startsWith("data:image/")).slice(0, 3) } : {}) });
      await F.updateDoc(r, { status: "go", buildNow: !!now, notified: "go", goAt: at, by_owner: real, changedAt: at });
    },
    setProfile: p => F.setDoc(F.doc(fs, "profiles", me), { first: String(p.first || "").slice(0, 60), last: String(p.last || "").slice(0, 60), capo: String(p.capo || "").slice(0, 60), at: new Date().toISOString() }),
    async setCar(event, seats, driverName, from = "", leave = "", split) {
      const ref = F.doc(fs, "cars", `${event}~${me}`);
      if (!seats) return F.deleteDoc(ref);
      await F.runTransaction(fs, async tx => {
        const s = await tx.get(ref); const riders = s.exists() ? s.data().riders || [] : [];
        tx.set(ref, { event, driver: me, driverName: driverName || "", seats: Math.max(seats, riders.length), riders, from: String(from).slice(0, 120), leave: String(leave).slice(0, 5), at: new Date().toISOString(), ...(split === undefined ? {} : { split: !!split }) }, { merge: true });
      });
    },
    // Admins pick who drives to an event: creates (or removes) cars/{event~driver}; the driver then sets seats, cost sharing and costs.
    async setDriver(event, email, name, on) {
      const ref = F.doc(fs, "cars", `${event}~${lc(email)}`);
      if (!on) return F.deleteDoc(ref);
      await F.runTransaction(fs, async tx => { const s = await tx.get(ref); if (!s.exists()) tx.set(ref, { event, driver: lc(email), driverName: String(name || "").slice(0, 60), seats: 0, riders: [], from: "", leave: "", split: false, byAdmin: lc(email) !== me, at: new Date().toISOString() }); });
    },
    // The driver (or an admin) edits seats / from / leave / split / cost / paid of one car (rules: driver or owner).
    setCarFields: (carId, patch) => F.updateDoc(F.doc(fs, "cars", String(carId)), { ...patch, at: new Date().toISOString() }),
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
    // push.state(): "unsupported" | "install" (iPhone, not opened from the home screen) | "denied" | "on" | "off"
    push: {
      get ready() { return (owner || MPUSH_READY) && PUSH_ON(); },
      state() {
        if (!this.ready) { const ios = /iP(hone|ad|od)/.test(navigator.userAgent); return ios && PUSH_READY && (owner || MPUSH_READY) && !navigator.standalone ? "install" : "unsupported"; }
        if (Notification.permission === "denied") return "denied";
        try { return Notification.permission === "granted" && localStorage.getItem("ccc.push") === "on" ? "on" : "off"; } catch { return "off"; }
      },
      async enable(lang) {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") throw Object.assign(new Error("denied"), { code: "denied" });
        const reg = await navigator.serviceWorker.register("sw.js");
        await navigator.serviceWorker.ready;
        const { M, m } = await messaging();
        const token = await M.getToken(m, { vapidKey: window.CCC_VAPID, serviceWorkerRegistration: reg });
        if (!token) throw new Error("no token");
        await F.setDoc(F.doc(fs, "pushTokens", real), { devices: { [devId()]: { token, at: new Date().toISOString(), ua: navigator.userAgent.slice(0, 160), lang: String(lang || "en").slice(0, 2) } } }, { merge: true });
        try { localStorage.setItem("ccc.push", "on"); } catch {}
      },
      async disable() {
        try { const { M, m } = await messaging(); await M.deleteToken(m); } catch {}
        await F.updateDoc(F.doc(fs, "pushTokens", real), { [`devices.${devId()}`]: F.deleteField() }).catch(() => {});
        try { localStorage.setItem("ccc.push", "off"); } catch {}
      },
    },
    requestRefresh: () => F.setDoc(F.doc(fs, "refresh", "request"), { at: new Date().toISOString(), by: real, done: false }),
  };
}

async function startApp(user) {
  show(`<p class="gwait">${g("wait")}</p>`);
  let data, calAt = "", fromCache = false;
  try {
    // Available offline: start from the phone's copy straight away (no waiting for the network); the update follows in the background (see fresh() below).
    let snap = null;
    if (OFFLINE === "on") { try { const c = await F.getDocFromCache(F.doc(fs, "cal", "main")); if (c.exists()) { snap = c; fromCache = true; } } catch {} }
    if (!snap) snap = await F.getDoc(F.doc(fs, "cal", "main"));
    if (!snap.exists()) throw Object.assign(new Error("empty"), { code: "not-found" });
    data = JSON.parse(snap.data().json); calAt = snap.data().at || "";
  } catch (e) {
    started = false;
    if (e?.code === "permission-denied") return showNoAccess(user.email);
    return show(`<h2>${g("noH")}</h2><p>${esc(e?.message || e)}</p>`);
  }
  // Owner = may list the access collection (rules allow that for the owner only).
  // Asked of the server (a cached answer would wrongly say yes); offline, the last server answer for this email is used.
  let owner = false; const ok = "ccc.owner." + lc(user.email);
  const askOwner = async () => {
    try { await F.getDocsFromServer(F.query(F.collection(fs, "access"), F.limit(1))); try { localStorage.setItem(ok, "1"); } catch {} return true; }
    catch (e) { if (e?.code === "permission-denied") { try { localStorage.setItem(ok, "0"); } catch {} return false; } try { return localStorage.getItem(ok) === "1"; } catch { return false; } }
  };
  let known = null; try { known = localStorage.getItem(ok); } catch {}
  if (OFFLINE === "on" && (known === "1" || known === "0")) {
    // Offline first: use the last known answer now, check it with the server in the background (reload if it changed).
    owner = known === "1";
    askOwner().then(o => { if (o !== owner && navigator.onLine) location.reload(); });
  } else owner = await askOwner();
  window.__CCC = data;
  // Available offline: the calendar was read from the phone's copy when there was no internet. As soon as the
  // phone is online again (or the app comes back to the front), fetch the server copy and reload if it is newer.
  if (OFFLINE === "on") {
    const busy = d => { window.__cccBusy = Math.max(0, (window.__cccBusy || 0) + d); window.dispatchEvent(new Event("ccc-sync")); };
    const fresh = async () => { if (!navigator.onLine) return; busy(1); try { const s = await F.getDocFromServer(F.doc(fs, "cal", "main")); if (s.exists() && (s.data().at || "") !== calAt) { window.__cccNewData = true; window.dispatchEvent(new Event("ccc-newdata")); } } catch {} busy(-1); };
    addEventListener("online", fresh);
    if (fromCache) fresh();   // the calendar above came from the phone's copy: fetch the server copy now, in the background
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") fresh(); });
  }
  const HUB = makeHub(user, owner);
  // "Last online" for the owner's member list: seen/{email} {last, days:[YYYY-MM-DD], opens}. At most one write per 15 minutes.
  const ping = () => {
    if (document.visibilityState !== "visible") return;
    let prev = 0; try { prev = +localStorage.getItem("ccc.ping") || 0; } catch {}
    if (Date.now() - prev < 15 * 60e3) return;
    try { localStorage.setItem("ccc.ping", String(Date.now())); } catch {}
    const now = new Date(), day = now.toISOString().slice(0, 10);
    F.setDoc(F.doc(fs, "seen", lc(user.email)), { last: now.toISOString(), days: F.arrayUnion(day), opens: F.increment(1), ...(SEENPHONE_READY ? { phone: phoneLabel() } : {}) }, { merge: true }).catch(() => {});
  };
  if (RULES_READY) { ping(); document.addEventListener("visibilitychange", ping); }
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
