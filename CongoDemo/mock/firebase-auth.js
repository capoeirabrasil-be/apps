// Demo: nobody signs in. The visitor is signed in straight away as the demo member or the demo admin (?as=admin).
const D = window.__DEMO; let cbs = [];
const auth = { get currentUser() { return D.user; } };
export const getAuth = () => auth;
export class GoogleAuthProvider { setCustomParameters() {} static credential(t) { return { t }; } }
export class OAuthProvider { setCustomParameters() {} }
export async function signInWithCredential() {} export async function signInWithPopup() {} export async function signInWithRedirect() {}
export async function getRedirectResult() { return null; }
export function onAuthStateChanged(a, f) { cbs.push(f); setTimeout(() => f(D.user), 10); return () => {}; }
export async function signOut() { location.href = location.pathname; }
