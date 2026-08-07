// ════════════════════════════════════════════════════════════
// Neta DAO Academy — shared authentication + entitlement module
// Used by current.html, cinema.html, and admin.html
// ════════════════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import {
  getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
  signInWithEmailAndPassword, linkWithCredential, EmailAuthProvider, sendPasswordResetEmail,
  onAuthStateChanged as _onAuthStateChanged, signOut as _signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import {
  getDatabase, ref, get, update, set
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6b9HOs3rB46PloDDvrTg8BIx0T7r5HzA",
  authDomain: "neta-dao-cinema.firebaseapp.com",
  databaseURL: "https://neta-dao-cinema-default-rtdb.firebaseio.com",
  projectId: "neta-dao-cinema",
  storageBucket: "neta-dao-cinema.firebasestorage.app",
  messagingSenderId: "857402063474",
  appId: "1:857402063474:web:1e3a5c9ea8625cb0a8e0eb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const onAuthStateChanged = _onAuthStateChanged;
export const signOut = _signOut;

export const ADMIN_EMAIL = 'academy@netadao.org';

// Firebase Realtime Database keys can't contain "." — this is the
// standard safe encoding for using an email address as a key.
// Returns null if email is missing (guards against Firebase's
// onAuthStateChanged occasionally firing with a transitional user
// object that hasn't finished loading its email yet).
export function emailToKey(email) {
  if (!email) return null;
  return email.toLowerCase().trim().replace(/\./g, ',');
}

// ── Sending + completing magic-link sign-in ──
function actionCodeSettings() {
  return {
    url: window.location.origin + window.location.pathname,
    handleCodeInApp: true,
  };
}

export async function sendMagicLink(email) {
  await sendSignInLinkToEmail(auth, email, actionCodeSettings());
  window.localStorage.setItem('academyEmailForSignIn', email);
}

// Call this once on every page load. If the URL is a sign-in link,
// it completes sign-in and cleans the URL. Returns 'magic-link' if a
// magic-link sign-in was just completed (useful for triggering the
// "set a password" prompt), or false if this wasn't a sign-in link.
export async function completeSignInIfNeeded() {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('academyEmailForSignIn');
    if (!email) {
      email = window.prompt('Confirm the email you registered with to finish signing in:');
    }
    if (email) {
      try {
        await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem('academyEmailForSignIn');
        window.history.replaceState({}, document.title, window.location.pathname);
        return 'magic-link';
      } catch (err) {
        console.error('Sign-in link error:', err);
        alert('That sign-in link is invalid or expired. Please request a new one.');
      }
    }
    window.history.replaceState({}, document.title, window.location.pathname);
    return false;
  }
  return false;
}

// ── Password sign-in (Option C: set once after first magic-link use) ──

export async function signInWithPassword(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Attaches a password to the CURRENTLY signed-in user's account (must
// already be authenticated, e.g. via a fresh magic-link sign-in). After
// this, they can sign in with email + password going forward instead of
// requesting a new magic link every time.
export async function setPasswordForCurrentUser(password) {
  if (!auth.currentUser || !auth.currentUser.email) throw new Error('No signed-in user to attach a password to.');
  const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
  await linkWithCredential(auth.currentUser, credential);
}

export async function sendPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

// ── Registration + entitlement lookups ──

// Returns null if this email has never registered, OR if email is
// missing/not-yet-loaded on the auth object — callers should treat
// both cases as "nothing to show yet."
export async function getRegistration(email) {
  const key = emailToKey(email);
  if (!key) return null;
  try {
    const snap = await get(ref(db, `academyRegistrations/${key}`));
    return snap.exists() ? snap.val() : null;
  } catch (err) {
    console.error('getRegistration failed:', err);
    return null;
  }
}

// Creates a NEW registration. Does NOT require prior sign-in — this
// is intentional, so people can register in one step before ever
// touching the magic-link flow. Security rules only allow this to
// succeed for a brand-new entry; once created, only the verified
// owner (or admin) can modify it further.
export async function submitRegistration(email, name, xHandle, seminarId) {
  const key = emailToKey(email);
  await update(ref(db, `academyRegistrations/${key}`), {
    email, name, xHandle, seminarId,
    requestedAt: Date.now()
  });
}

// Fetches the actual reading URLs for a seminar — only succeeds if
// the signed-in user's registration record has readingsAccess === true.
export async function getSeminarReadings(seminarId) {
  try {
    const snap = await get(ref(db, `seminarReadings/${seminarId}`));
    return snap.exists() ? snap.val() : null;
  } catch (err) {
    console.error('seminarReadings fetch failed:', err.code, err.message);
    return null;
  }
}

// ── Admin-only functions (require signing in as ADMIN_EMAIL) ──

export async function getAllRegistrations() {
  try {
    const snap = await get(ref(db, 'academyRegistrations'));
    return snap.exists() ? snap.val() : {};
  } catch (err) {
    console.error('getAllRegistrations failed (are you signed in as the admin email?):', err);
    return null;
  }
}

export async function approveRegistration(emailKey, seminarId) {
  await update(ref(db, `academyRegistrations/${emailKey}`), {
    readingsAccess: true,
    [`seminarAccess/${seminarId}`]: true
  });
}

// Revokes a person's access entirely — sets readingsAccess to false and
// clears their seminarAccess for this specific seminar. Does not delete
// their registration record itself, so their name/handle/history stays
// visible in the admin list, and they can be re-approved later if needed.
export async function revokeRegistration(emailKey, seminarId) {
  await update(ref(db, `academyRegistrations/${emailKey}`), {
    readingsAccess: false,
    [`seminarAccess/${seminarId}`]: false
  });
}
