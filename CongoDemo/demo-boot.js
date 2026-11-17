// Congo Capoeira Calendar DEMO: loads before the app. Fake sign-in, fake data, nothing saved outside this browser tab.
(() => {
  const q = new URLSearchParams(location.search);
  const AS = q.get("as") === "admin" ? "admin" : "member";
  // The demo must never touch the real app's settings (same website address): its own "localStorage" lives in this tab only.
  const SS = window.sessionStorage, P = "demo.ls.";
  const fake = { getItem: k => SS.getItem(P + k), setItem: (k, v) => SS.setItem(P + k, String(v)), removeItem: k => SS.removeItem(P + k),
    clear() { Object.keys(SS).filter(k => k.startsWith(P)).forEach(k => SS.removeItem(k)); }, key: i => Object.keys(SS).filter(k => k.startsWith(P))[i]?.slice(P.length) ?? null,
    get length() { return Object.keys(SS).filter(k => k.startsWith(P)).length; } };
  try { Object.defineProperty(window, "localStorage", { value: fake, configurable: true }); } catch {}
  if (q.get("lang") && /^(en|nl|pt|fr|es|pl|uk|de)$/.test(q.get("lang"))) fake.setItem("ccc.lang", q.get("lang"));
  if (!fake.getItem("demoInit")) { fake.setItem("demoInit", "1"); ["newsOff1", "newsPush2", "newsCar1", "newsLng1"].forEach(k => fake.setItem("ccc." + k, "1")); fake.setItem("ccc.news", "sug1"); }   // no "what is new" pop-ups: the demo shows the app as it is
  window.CCC_FB_BASE = "./mock"; window.CCC_FIREBASE = {}; window.CCC_DEMO = true;

  const LG = (() => { const x = fake.getItem("ccc.lang") || (navigator.language || "en").slice(0, 2); return window.__DEMO_TEXTS[x] ? x : "en"; })(), X = window.__DEMO_TEXTS[LG];
  const day = 864e5, now = Date.now();
  const ymd = o => new Date(now + o * day).toISOString().slice(0, 10);
  const ts = (o, h = 12) => new Date(now + o * day - (12 - h) * 36e5).toISOString();
  const ago = h => new Date(now - h * 36e5).toISOString();
  const ADM = "demo.admin@example.com", MEM = "demo.member@example.com";
  const P_ = [  // email, first, last, capo
    ["bruno@example.com", "Bruno", "Maes", "Formiga"], ["carla@example.com", "Carla", "Peeters", "Beija-flor"], ["diego@example.com", "Diego", "Santos", "Tucano"],
    ["elise@example.com", "Elise", "Janssens", "Lua"], ["felipe@example.com", "Felipe", "Costa", "Gato"], ["gabi@example.com", "Gabriela", "Lima", "Pitanga"],
    ["hugo@example.com", "Hugo", "Willems", "Trovão"], ["ines@example.com", "Inês", "Ribeiro", "Sereia"], ["joao@example.com", "João", "Silva", "Cobra"], ["kim@example.com", "Kim", "Vermeulen", "Pantera"]];
  const C = { Antwerpen: [51.22, 4.40], Gent: [51.05, 3.72], Brussel: [50.85, 4.35], Leuven: [50.88, 4.70], Brugge: [51.21, 3.22], Mechelen: [51.03, 4.48], Hasselt: [50.93, 5.34], Rotterdam: [51.92, 4.48], Utrecht: [52.09, 5.12], Amsterdam: [52.37, 4.90], Eindhoven: [51.44, 5.48], Maastricht: [50.85, 5.69], Köln: [50.94, 6.96], Aachen: [50.78, 6.08], Lille: [50.63, 3.06], Paris: [48.86, 2.35], Lisboa: [38.72, -9.14], Porto: [41.15, -8.61], Barcelona: [41.39, 2.17], Salvador: [-12.97, -38.50], "Rio de Janeiro": [-22.91, -43.17], Luik: [50.63, 5.57] };
  const CC = { Antwerpen: "BE", Gent: "BE", Brussel: "BE", Leuven: "BE", Brugge: "BE", Mechelen: "BE", Hasselt: "BE", Luik: "BE", Rotterdam: "NL", Utrecht: "NL", Amsterdam: "NL", Eindhoven: "NL", Maastricht: "NL", Köln: "DE", Aachen: "DE", Lille: "FR", Paris: "FR", Lisboa: "PT", Porto: "PT", Barcelona: "ES", Salvador: "BR", "Rio de Janeiro": "BR" };
  const NM = { roda: "Roda", workshop: "Workshop", encontro: "Encontro de capoeira", formatura: "Batizado & troca de cordas" };
  // [days from today, length in days, type, city]
  const PLAN = [[3, 2, "workshop", "Antwerpen"], [10, 1, "roda", "Gent"], [24, 2, "formatura", "Brussel"], [38, 1, "roda", "Leuven"], [59, 3, "encontro", "Köln"], [80, 2, "workshop", "Rotterdam"], [108, 2, "formatura", "Lille"], [140, 3, "encontro", "Lisboa"], [170, 1, "roda", "Brugge"], [200, 2, "workshop", "Utrecht"],
    [-2, 1, "roda", "Mechelen"], [-9, 2, "formatura", "Hasselt"], [-30, 3, "encontro", "Barcelona"], [-55, 2, "workshop", "Amsterdam"], [-80, 1, "roda", "Antwerpen"], [-120, 2, "formatura", "Paris"], [-160, 2, "workshop", "Eindhoven"], [-200, 1, "roda", "Gent"], [-250, 2, "formatura", "Luik"], [-290, 1, "roda", "Brussel"], [-340, 5, "encontro", "Salvador"], [-380, 3, "encontro", "Rio de Janeiro"], [-420, 2, "workshop", "Aachen"], [-470, 2, "formatura", "Maastricht"], [-520, 2, "workshop", "Porto"], [-560, 1, "roda", "Antwerpen"], [-640, 3, "encontro", "Lisboa"]];
  const D_EN = "Example event (fake data)." + "\n\nSaturday\n10:00 - Welcome\n10:30 - Workshop\n13:00 - Lunch\n14:00 - Workshop + roda\n\nSunday\n11:00 - Roda and closing words\n\nPrice: €60 for 2 days";
  const D_TR = { pl: "Przykładowe wydarzenie (fałszywe dane).\n\nSobota\n10:00 - Powitanie\n10:30 - Warsztat\n13:00 - Lunch\n14:00 - Warsztat + roda\n\nNiedziela\n11:00 - Roda i słowo na zakończenie\n\nCena: 60 € za 2 dni", uk: "Приклад події (фейкові дані).\n\nСубота\n10:00 - Вітання\n10:30 - Воркшоп\n13:00 - Обід\n14:00 - Воркшоп + рода\n\nНеділя\n11:00 - Рода і завершальне слово\n\nЦіна: 60 € за 2 дні", de: "Beispiel-Veranstaltung (Fake-Daten).\n\nSamstag\n10:00 - Begrüßung\n10:30 - Workshop\n13:00 - Mittagessen\n14:00 - Workshop + Roda\n\nSonntag\n11:00 - Roda und Schlussworte\n\nPreis: 60 € für 2 Tage", nl: "Voorbeeld-event (nepdata).\n\nZaterdag\n10u - Onthaal\n10u30 - Workshop\n13u - Lunch\n14u - Workshop + roda\n\nZondag\n11u - Roda en slotwoord\n\nPrijs: €60 voor 2 dagen", pt: "Evento de exemplo (dados falsos).\n\nSábado\n10:00 - Boas-vindas\n10:30 - Workshop\n13:00 - Almoço\n14:00 - Workshop + roda\n\nDomingo\n11:00 - Roda e palavras finais\n\nPreço: €60 por 2 dias", fr: "Événement d'exemple (fausses données).\n\nSamedi\n10h - Accueil\n10h30 - Workshop\n13h - Déjeuner\n14h - Workshop + roda\n\nDimanche\n11h - Roda et mot de la fin\n\nPrix : 60 € les 2 jours", es: "Evento de ejemplo (datos falsos).\n\nSábado\n10:00 - Bienvenida\n10:30 - Taller\n13:00 - Comida\n14:00 - Taller + roda\n\nDomingo\n11:00 - Roda y palabras finales\n\nPrecio: 60 € por 2 días" };
  const djb2 = s => { let h = 5381; for (const ch of s) h = ((h * 33) ^ ch.codePointAt(0)) >>> 0; return h.toString(16); };
  const ev = [], meta = {}, types = {}, E = {};   // E[offset] = id
  PLAN.forEach(([o, n, ty, city], i) => {
    const id = "demo" + String(i).padStart(2, "0"), t = `${NM[ty]} ${city}`; E[o] = id;
    ev.push({ id, title: t, start: ymd(o), end: ymd(o + n - 1), time: "", location: i === 0 ? "Sporthal Example, Antwerpen" : "", description: i === 0 ? D_EN : "" });
    meta[id] = { t, place: city, cc: CC[city], type: ty }; types[id] = ty;
  });
  ev.sort((a, b) => a.start.localeCompare(b.start));
  const data = { snapshotAt: ymd(-1), snapshot: ev, confirmed: [E[3], E[24], E[59], E[140], E[-2], E[-9], E[-30], E[-55], E[-120], E[-340], E[-380]], missed: [E[-80]], types, meta, cities: C,
    descI18n: { [E[3]]: { src: "en", h: djb2(D_EN), t: D_TR } } };

  const db = {};
  const doc = (path, v) => { db[path] = v; };
  doc("cal/main", { json: JSON.stringify(data), at: ago(1) });
  doc("access/" + ADM, { role: "owner", at: ts(-200) });
  doc("access/" + MEM, { role: "viewer", at: ts(-40) });
  P_.forEach(([e, f, l, c], i) => { doc("access/" + e, { role: "viewer", at: ts(-180 + i * 12), ...(i === 9 ? { revoked: true, revokedAt: ts(-20) } : {}) });
    doc("profiles/" + e, { first: f, last: l, capo: c, at: ts(-100) });
    doc("seen/" + e, { last: ago(i < 3 ? 2 + i * 5 : 30 + i * 40), days: [0, 1, 3, 4, 8, 10, 15, 21].slice(0, 8 - i % 4).map(d => ymd(-d - i)), opens: 6 + i * 7, phone: i % 3 === 0 ? "Android" : "iPhone" }); });
  doc("profiles/" + ADM, { first: "Demo", last: "Admin", capo: "Mestre Demo", at: ts(-100) });
  doc("profiles/" + MEM, { first: "Demo", last: "Member", capo: "Visitante", at: ts(-30) });
  doc("seen/" + MEM, { last: ago(0.1), days: [0, 1, 2, 5].map(d => ymd(-d)), opens: 12, phone: "iPhone" });
  doc("seen/" + ADM, { last: ago(0.1), days: [0, 1, 2, 3].map(d => ymd(-d)), opens: 90, phone: "iPhone" });
  doc("accessreq/newbie1@example.com", { email: "newbie1@example.com", name: "Sofie De Smet", at: ago(5) });
  doc("accessreq/newbie2@example.com", { email: "newbie2@example.com", name: "Marc Dupont", at: ago(30) });
  P_.slice(0, 6).forEach(([e], i) => doc("pushTokens/" + e, { devices: { a: { token: "x", at: ago(100), ua: i % 2 ? "iPhone" : "Android; Pixel 7", lang: ["nl", "en", "pt"][i % 3] } } }));

  // confirmed (Congo goes), with how he goes
  data.confirmed.forEach(id => doc("confirmed/" + id, { confirmed: true, missed: false, title: meta[id].t, start: ev.find(x => x.id === id).start, at: ago(500), role: id === E[24] ? "teacher" : "special" }));
  doc("confirmed/" + E[-80], { confirmed: false, missed: true, title: meta[E[-80]].t, start: ymd(-80), at: ago(2500) });
  // an event an admin added that is waiting to join the official calendar
  doc("added/addDemo1", { title: X.addT, start: ymd(17), end: ymd(17), time: "20:00", place: "Mechelen", cc: "BE", location: "Café De Roda", description: X.addD, type: "roda", calendar: "pending", at: ago(20) });

  // who goes where
  const going = { [MEM]: [E[3], E[24], E[-9]], "bruno@example.com": [E[3], E[10]], "carla@example.com": [E[3], E[24], E[59]], "diego@example.com": [E[3], E[-9]], "elise@example.com": [E[10], E[24], E[-9]], "felipe@example.com": [E[3], E[-2]], "gabi@example.com": [E[3], E[59], E[-2]], "hugo@example.com": [E[24], E[-9]], "ines@example.com": [E[3], E[-2]], "joao@example.com": [E[-2], E[-9]] };
  Object.entries(going).forEach(([e, ids]) => doc("going/" + e, { events: ids, at: ago(48) }));
  doc("going/" + ADM, { events: [], at: ago(48) });
  // car pool: next event + two past events with costs
  const car = (ev_, drv, name, seats, riders, extra) => doc(`cars/${ev_}~${drv}`, { event: ev_, driver: drv, driverName: name, seats, riders, from: "", leave: "", split: false, at: ago(60), ...extra });
  car(E[3], "bruno@example.com", "Formiga", 3, ["carla@example.com", "gabi@example.com"], { from: "Groenplaats, Antwerpen", leave: "09:00", split: true, note: X.cn1 });
  car(E[3], "felipe@example.com", "Gato", 4, ["ines@example.com"], { from: "Brussel-Zuid", leave: "08:30", split: false, note: X.cn2 });
  car(E[3], "diego@example.com", "Tucano", 0, [], { byAdmin: true });
  car(E[-2], "joao@example.com", "Cobra", 3, ["felipe@example.com", "ines@example.com"], { from: "Station Mechelen", leave: "18:00", split: true, byAdmin: false });
  car(E[-9], "hugo@example.com", "Trovão", 3, ["diego@example.com", MEM], { from: "Gent-Sint-Pieters", leave: "09:30", split: true, cost: { gas: 38.4, toll: 0, parking: 12, other: 0, note: X.cost }, paid: ["diego@example.com"] });
  car(E[-9], "elise@example.com", "Lua", 3, [], { from: "Leuven", leave: "10:00", split: false });
  // chats
  const m = (eid, by, name, txt, h) => doc(`chats/${eid}/m/${Math.random().toString(36).slice(2, 8)}`, { text: txt, by, name, at: ago(h), until: ts(7) });
  [[E[3], "bruno@example.com", "Formiga", X.c1, 30], [E[3], "carla@example.com", "Beija-flor", X.c2, 28], [E[3], ADM, "Demo Admin", X.c3, 20], [E[3], "gabi@example.com", "Pitanga", X.c4, 6], [E[10], "elise@example.com", "Lua", X.c5, 10]]
    .forEach(([e, by, n, txt, h]) => { m(e, by, n, txt, h); });
  doc("chats/" + E[3], { until: ts(7), at: ago(6), lastBy: "gabi@example.com" }); doc("chats/" + E[10], { until: ts(14), at: ago(10), lastBy: "elise@example.com" });
  // a private chat between the demo member and the admin about the next event
  const did = E[3] + "~" + MEM;
  doc("dms/" + did, { until: ts(7), at: ago(3), last: X.d3, lastBy: MEM, lastName: "Demo Member", title: meta[E[3]].t });
  doc(`dms/${did}/m/a1`, { text: X.d1, by: MEM, name: "Demo Member", at: ago(5), until: ts(7) });
  doc(`dms/${did}/m/a2`, { text: X.d2, by: ADM, name: "Demo Admin", at: ago(4), until: ts(7) });
  doc(`dms/${did}/m/a3`, { text: X.d3, by: MEM, name: "Demo Member", at: ago(3), until: ts(7) });
  doc("messages/" + MEM, { items: [{ id: "m1", text: X.org, at: ago(1), by: ADM }] });
  // ideas, bugs and feedback
  const sg = (id, by, name, text, status, kind, extra) => doc("suggestions/" + id, { text, by, byName: name, at: ago(Math.abs(extra?.h ?? 100)), status, kind, ...extra });
  sg("s1", MEM, "Demo Member", X.s1, "done", "idea", { reply: X.s1r, doneAt: ago(30), seenBy: false, h: 200 });
  sg("s2", MEM, "Demo Member", X.s2, "go", "bug", { h: 60, goAt: ago(40) });
  sg("s3", "carla@example.com", "Beija-flor", X.s3, "go", "idea", { goAt: ago(80), h: 150 });
  sg("s4", "bruno@example.com", "Formiga", X.s4, "new", "idea", { h: 12 });
  sg("s5", "gabi@example.com", "Pitanga", X.s5, "ask", "feedback", { question: X.s5q, reply: "", h: 25 });
  sg("s6", "hugo@example.com", "Trovão", X.s6, "nogo", "idea", { nogoComment: X.s6c, nogoAt: ago(70), h: 300 });
  sg("s7", "ines@example.com", "Sereia", X.s7, "new", "feedback", { h: 5, react: "like" });
  window.__DEMO = { role: AS === "admin" ? "owner" : "member", user: { email: AS === "admin" ? ADM : MEM, displayName: AS === "admin" ? "Demo Admin" : "Demo Member" }, as: AS, db };
  try { const sv = SS.getItem("demo.db"); if (sv) { const o = JSON.parse(sv); for (const k of Object.keys(db)) delete db[k]; Object.assign(db, o); } } catch {}
  // banner
  const css = document.createElement("style");
  css.textContent = "#demobar{position:fixed;top:0;left:0;right:0;height:30px;z-index:2147483000;display:flex;gap:8px;align-items:center;justify-content:center;padding:0 8px;background:#b45309;color:#fff;font:600 12px/1 system-ui,sans-serif;white-space:nowrap;overflow:hidden}#demobar a,#demobar button{color:#fff;background:rgba(255,255,255,.2);border:0;border-radius:10px;padding:5px 9px;font:inherit;text-decoration:none;cursor:pointer}body{padding-top:30px!important;box-sizing:border-box}";
  document.head.appendChild(css);
  addEventListener("DOMContentLoaded", () => {
    const b = document.createElement("div"); b.id = "demobar";
    const L = location.pathname;
    b.innerHTML = `<span>${X.bar[0]} ${AS === "admin" ? X.bar[1] : X.bar[2]}</span><a href="${L}?as=${AS === "admin" ? "member" : "admin"}">${AS === "admin" ? X.sw[1] : X.sw[0]}</a><button id="demoreset">${X.reset}</button>`;
    document.body.prepend(b);
    document.getElementById("demoreset").onclick = () => { SS.clear(); location.href = L + (AS === "admin" ? "?as=admin" : ""); };
  });
})();
