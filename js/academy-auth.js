// ════════════════════════════════════════════════════════════
// Neta DAO Academy — shared authentication + entitlement module
// Used by current.html and cinema.html for gated seminar access
// ════════════════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import {
  getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
  onAuthStateChanged as _onAuthStateChanged, signOut as _signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import {
  getDatabase, ref, get, update
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

// Firebase Realtime Database keys can't contain "." — this is the
// standard safe encoding for using an email address as a key.
export function emailToKey(email) {
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
// it completes sign-in and cleans the URL. Returns true if a
// sign-in was just completed (useful for showing a "welcome" state).
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
      } catch (err) {
        console.error('Sign-in link error:', err);
        alert('That sign-in link is invalid or expired. Please request a new one.');
      }
    }
    // Clean the long Firebase auth params out of the visible URL either way
    window.history.replaceState({}, document.title, window.location.pathname);
    return true;
  }
  return false;
}

// ── Registration + entitlement lookups ──
// Returns null if this email has never registered.
export async function getRegistration(email) {
  const snap = await get(ref(db, `academyRegistrations/${emailToKey(email)}`));
  return snap.exists() ? snap.val() : null;
}

// Creates or updates a registration request. Only touches the fields
// a registrant is allowed to set — approval fields (readingsAccess,
// seminarAccess) are admin-only and set manually in the Firebase console.
export async function submitRegistration(email, name, xHandle, seminarId) {
  const key = emailToKey(email);
  await update(ref(db, `academyRegistrations/${key}`), {
    email, name, xHandle, seminarId,
    requestedAt: Date.now()
  });
}

// Fetches the actual reading URLs for a seminar. Firebase security
// rules only allow this to succeed if the signed-in user's
// registration record has readingsAccess === true — so the real
// URLs never sit in this site's HTML source at all.
export async function getSeminarReadings(seminarId) {
  try {
    const snap = await get(ref(db, `seminarReadings/${seminarId}`));
    return snap.exists() ? snap.val() : null;
  } catch (err) {
    // Permission denied simply means: not entitled yet. Not an error to alarm over.
    return null;
  }
}
