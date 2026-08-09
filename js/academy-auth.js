// ════════════════════════════════════════════════════════════
// Neta DAO Academy — shared authentication + entitlement module
// Used by current.html, cinema.html, and admin.html
// ════════════════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import {
  getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
  signInWithEmailAndPassword, sendPasswordResetEmail,
  updatePassword, signInWithPopup, GoogleAuthProvider,
  onAuthStateChanged as _onAuthStateChanged, signOut as _signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import {
  getDatabase, ref, get, update, set, push
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

// Wires up the shared nav account widget (#navAccountItem / #navAccountLink)
// on any page that includes that markup. Shows "Sign In" (linking to
// signInHref) when signed out. When signed in, the link becomes
// "Signed in: email" and takes you to /profile.html, where account
// status and sign-out both live. If the signed-in email matches
// ADMIN_EMAIL, also injects "Admin" and "Cinema" nav links visible only
// to that account — nobody else ever sees them, since they're only
// added to the DOM when the admin's own auth state is detected.
export function initNavAccountWidget(signInHref) {
  const navAccountItem = document.getElementById('navAccountItem');
  const navAccountLink = document.getElementById('navAccountLink');
  if (!navAccountItem || !navAccountLink) return;

  function ensureAdminNavLinks() {
    if (document.getElementById('navAdminLink')) return;
    const adminLi = document.createElement('li');
    adminLi.id = 'navAdminLink';
    adminLi.innerHTML = '<a href="/admin.html">Admin</a>';
    navAccountItem.parentNode.insertBefore(adminLi, navAccountItem);

    const cinemaLi = document.createElement('li');
    cinemaLi.id = 'navCinemaAdminLink';
    cinemaLi.innerHTML = '<a href="/cinema.html">Cinema</a>';
    navAccountItem.parentNode.insertBefore(cinemaLi, navAccountItem);
  }

  function removeAdminNavLinks() {
    const a = document.getElementById('navAdminLink');
    if (a) a.remove();
    const c = document.getElementById('navCinemaAdminLink');
    if (c) c.remove();
  }

  function updateNavAccount(user) {
    if (user && user.email) {
      navAccountItem.classList.add('signed-in');
      navAccountLink.textContent = `Signed in: ${user.email}`;
      navAccountLink.setAttribute('href', '/profile.html');
      if (user.email === ADMIN_EMAIL) {
        ensureAdminNavLinks();
      } else {
        removeAdminNavLinks();
      }
    } else {
      navAccountItem.classList.remove('signed-in');
      navAccountLink.textContent = 'Sign In';
      navAccountLink.setAttribute('href', signInHref);
      removeAdminNavLinks();
    }
  }

  _onAuthStateChanged(auth, (user) => {
    if (user && !user.email) return; // transitional auth state, wait for the next update
    updateNavAccount(user);
  });
}

export const ADMIN_EMAIL = 'academy@netadao.org';

// ── EmailJS notifications (admin alerts + participant confirmations) ──
// Requires the EmailJS SDK to be loaded as a plain <script> tag on the
// page (not imported as a module — EmailJS's browser build is UMD-style
// and exposes a global `emailjs`). Fails silently (with a console warning)
// on any page that hasn't loaded it, and never blocks or throws on the
// caller — a failed notification should never break an actual registration
// or signup.
const EMAILJS_SERVICE_ID = 'service_8szs7ct';
const EMAILJS_TEMPLATE_ID = 'template_di3sjur';

function sendNotificationEmail(toEmail, type, name, email, details) {
  if (typeof window === 'undefined' || typeof window.emailjs === 'undefined') {
    console.warn('EmailJS not loaded on this page — skipping notification.');
    return;
  }
  window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email: toEmail,
    notification_type: type,
    from_name: name || '(no name given)',
    from_email: email,
    details: details || ''
  }).catch((err) => console.error('EmailJS notification failed:', err));
}

function notifyAdmin(type, name, email, details) {
  sendNotificationEmail(ADMIN_EMAIL, type, name, email, details);
}

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
// The magic link always lands on /set-password.html — a dedicated,
// unmissable page — rather than bouncing back to wherever the person
// requested it from and burying the "set a password" prompt in the
// middle of a longer page.
function actionCodeSettings() {
  return {
    url: window.location.origin + '/set-password.html',
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

// Sets a password on the CURRENTLY signed-in user's account (must already
// be authenticated, e.g. via a fresh magic-link sign-in). After this, they
// can sign in with email + password going forward instead of requesting a
// new magic link every time.
//
// Deliberately uses updatePassword(), NOT linkWithCredential(). Email-link
// sign-in and email/password sign-in are both surfaced under the SAME
// Firebase Auth provider ID ('password') — signing in via magic link
// already registers a 'password' provider entry on the account. Calling
// linkWithCredential() with a new EmailAuthProvider credential then tries
// to attach a second credential under that already-claimed provider ID,
// which Firebase always rejects with 'auth/provider-already-linked' — on
// literally the first attempt, regardless of whether a real password was
// ever set. updatePassword() sets the password directly on the existing
// provider entry instead of trying to link a new one, which is the
// correct call for this flow and has no such conflict.
export async function setPasswordForCurrentUser(password) {
  if (!auth.currentUser || !auth.currentUser.email) throw new Error('No signed-in user to attach a password to.');
  await updatePassword(auth.currentUser, password);
  const key = emailToKey(auth.currentUser.email);
  if (key) {
    try {
      await set(ref(db, `academyRegistrations/${key}/hasPassword`), true);
    } catch (err) {
      // Non-fatal: the password itself is already set above. Losing this
      // flag just means set-password.html shows "first time" framing
      // again next time instead of "update your password" — annoying,
      // not broken.
      console.error('Failed to record hasPassword flag:', err);
    }
  }
}

// Whether this account has ever actually set a password, as opposed to
// only ever using passwordless magic-link sign-in. Firebase Auth can't
// answer this reliably on its own — signInWithEmailLink registers the
// same 'password' providerId that a real password would, so checking
// auth.currentUser.providerData can't distinguish the two (this is the
// same quirk that caused the linkWithCredential bug above). We track it
// ourselves instead, via the flag set by setPasswordForCurrentUser().
export async function hasPasswordSet(email) {
  const key = emailToKey(email);
  if (!key) return false;
  try {
    const snap = await get(ref(db, `academyRegistrations/${key}/hasPassword`));
    return snap.exists() && snap.val() === true;
  } catch (err) {
    console.error('hasPasswordSet check failed:', err);
    return false;
  }
}

export async function sendPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

// ── Google sign-in ──
// Works both as a first-time sign-in (no password ever needed, since
// Google itself proves identity each time) and as a returning sign-in.
// If this email already has an account via password/email-link, Firebase
// deliberately refuses to sign in via Google (a security measure against
// account hijacking) and throws 'auth/account-exists-with-different-credential'
// — callers should catch this and tell the person to use their existing
// method instead.
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

// ── Registration + entitlement lookups ──
// Data model: academyRegistrations/{emailKey}/{seminarId} — one record
// PER SEMINAR per person, so someone can be registered/enrolled in
// multiple seminars (e.g. Sex, and/or Love AND a Coining Reason unit)
// independently, without one overwriting the other.

// Returns ALL of a person's seminar registrations, keyed by seminarId.
// Returns null if they've never registered for anything, or if email is
// missing/not-yet-loaded on the auth object.
export async function getRegistrations(email) {
  const key = emailToKey(email);
  if (!key) return null;
  try {
    const snap = await get(ref(db, `academyRegistrations/${key}`));
    return snap.exists() ? snap.val() : null;
  } catch (err) {
    console.error('getRegistrations failed:', err);
    return null;
  }
}

// Returns a single seminar's registration record for this person, or null.
export async function getRegistrationForSeminar(email, seminarId) {
  const key = emailToKey(email);
  if (!key) return null;
  try {
    const snap = await get(ref(db, `academyRegistrations/${key}/${seminarId}`));
    return snap.exists() ? snap.val() : null;
  } catch (err) {
    console.error('getRegistrationForSeminar failed:', err);
    return null;
  }
}

// Pulls name/xHandle from ANY of a person's existing registrations, so a
// second (or third) registration for a different seminar doesn't need to
// ask for that info again. Returns null if they have no registrations
// anywhere yet (a genuinely new person).
export async function getExistingProfile(email) {
  const regs = await getRegistrations(email);
  if (!regs) return null;
  const values = Object.values(regs);
  if (values.length === 0) return null;
  const first = values[0];
  return { name: first.name || '', xHandle: first.xHandle || '' };
}

// Creates a NEW registration for a specific seminar. Does NOT require
// prior sign-in — this is intentional, so people can register in one
// step before ever touching the magic-link flow. Security rules only
// allow this to succeed for a brand-new entry at this seminar; once
// created, only the verified owner (or admin) can modify it further.
// seminarTitle is just for the confirmation email's wording — pass the
// human-readable name (e.g. "Sex, and/or Love") rather than the raw id.
export async function submitRegistration(email, name, xHandle, seminarId, reason, seminarTitle) {
  const key = emailToKey(email);
  await update(ref(db, `academyRegistrations/${key}/${seminarId}`), {
    email, name, xHandle, reason,
    requestedAt: Date.now()
  });
  notifyAdmin('Seminar Registration', name, email, `X handle: ${xHandle}\nSeminar: ${seminarId}\n\nReason for joining:\n${reason}`);
  sendNotificationEmail(
    email,
    'Registration Received',
    name,
    email,
    `Thanks for registering for ${seminarTitle || seminarId}! This does not confirm your enrollment. To complete enrollment, please DM @NetaDAO_Academy on X from your registered handle (${xHandle}).`
  );
}

// Fetches the actual reading URLs for a seminar — only succeeds if
// the signed-in user's registration record for THIS seminar has
// enrolled === true (enforced by security rules).
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

// Returns the full nested tree: { [emailKey]: { [seminarId]: {...} } }.
// Callers should flatten this themselves for display.
export async function getAllRegistrations() {
  try {
    const snap = await get(ref(db, 'academyRegistrations'));
    return snap.exists() ? snap.val() : {};
  } catch (err) {
    console.error('getAllRegistrations failed (are you signed in as the admin email?):', err);
    return null;
  }
}

// Approves (enrolls) a person for a seminar, and sends them a
// confirmation email if EmailJS is loaded on this page (it's loaded
// on admin.html) and a participant email is provided. seminarTitle is
// just for the email's wording — pass the human-readable name, e.g.
// "Sex, and/or Love" rather than the raw seminarId.
export async function approveRegistration(emailKey, seminarId, participantEmail, participantName, seminarTitle) {
  await update(ref(db, `academyRegistrations/${emailKey}/${seminarId}`), {
    enrolled: true
  });
  if (participantEmail) {
    sendNotificationEmail(
      participantEmail,
      'Enrollment Confirmed',
      participantName,
      participantEmail,
      `You're enrolled in ${seminarTitle || seminarId}! Sign in at academy.netadao.org to access readings, the Cinema screening, and speaking access during live X Spaces discussions.`
    );
  }
}

// Revokes a person's enrollment in this specific seminar. Does not delete
// the registration record itself, so their name/handle/reason/history
// stays visible in the admin list, and they can be re-approved later.
export async function revokeRegistration(emailKey, seminarId) {
  await update(ref(db, `academyRegistrations/${emailKey}/${seminarId}`), {
    enrolled: false
  });
}

// ── Session lists + attendance ──
// Single source of truth for each seminar's session list, shared between
// admin.html (tracking) and profile.html (the participant-facing X/Y
// transcript). Keys are simple ('s0', 's1'...) since Firebase keys can't
// contain '.' — the display label carries the real session numbering
// (e.g. "1.0", "2.X").
export const SEMINAR_TITLES = {
  'sex-and-or-love': 'Sex, and/or Love',
  'coining-reason-unit-1': 'Coining Reason — Unit I',
  'coining-reason-unit-2': 'Coining Reason — Unit II'
};

// Seminars that have fully concluded — every session already happened,
// nothing left to attend. This is about the SEMINAR's own lifecycle,
// not any individual participant's attendance count, so it's a flat
// per-seminar flag rather than derived from attendance data.
export const SEMINAR_COMPLETED = {
  'sex-and-or-love': false,
  'coining-reason-unit-1': true,
  'coining-reason-unit-2': false
};

export const SEMINAR_SESSIONS = {
  'sex-and-or-love': [
    { key: 's0', label: '0' }, { key: 's1', label: '1' }, { key: 's2', label: '2' }, { key: 's3', label: '3' },
    { key: 's4', label: '4' }, { key: 's5', label: '5' }, { key: 's6', label: '6' }, { key: 's7', label: '7' }
  ],
  'coining-reason-unit-1': [
    { key: 's0', label: '1.0' }, { key: 's1', label: '1.1' }, { key: 's2', label: '1.2' }, { key: 's3', label: '1.3' },
    { key: 's4', label: '1.4' }, { key: 's5', label: '1.5' }, { key: 's6', label: '1.6' }, { key: 's7', label: '1.7' },
    { key: 's8', label: '1.8' }
  ],
  'coining-reason-unit-2': [
    { key: 's0', label: '2.0' }, { key: 's1', label: '2.1' }, { key: 's2', label: '2.2' }, { key: 's3', label: '2.3' },
    { key: 's4', label: '2.4' }, { key: 's5', label: '2.5' }, { key: 's6', label: '2.6' }, { key: 's7', label: '2.7' },
    { key: 's8', label: '2.8' }, { key: 's9', label: '2.9' }, { key: 's10', label: '2.X' }, { key: 's11', label: '2.Xb' },
    { key: 's12', label: '2.10' }, { key: 's13', label: '2.11' }, { key: 's14', label: '2.12' }, { key: 's15', label: '2.13' },
    { key: 's16', label: '2.14' }, { key: 's17', label: '2.15' }, { key: 's18', label: '2.16' }
  ]
};

// Admin-only: marks a single session attended/not-attended for one
// person's enrollment in a seminar.
export async function setAttendance(emailKey, seminarId, sessionKey, attended) {
  await update(ref(db, `academyRegistrations/${emailKey}/${seminarId}/attendance`), {
    [sessionKey]: attended
  });
}

// Computes { attended, total } for one seminar's registration record
// (as returned by getRegistrations/getRegistrationForSeminar). Counts
// only sessions defined in SEMINAR_SESSIONS, so stray/legacy keys in
// the data never inflate the total.
export function computeAttendance(seminarId, reg) {
  const sessions = SEMINAR_SESSIONS[seminarId] || [];
  const attendance = (reg && reg.attendance) || {};
  const attended = sessions.filter(s => attendance[s.key] === true).length;
  return { attended, total: sessions.length };
}

// ── General interest signups (homepage footer form) ──
// Public, no sign-in required — anyone can submit. Security rules only
// allow creating a brand-new entry (never editing/reading others' entries),
// so this is safe to leave fully open to unauthenticated visitors.

export async function submitInterestSignup(name, email, proposingLecture, proposal) {
  const newRef = push(ref(db, 'interestSignups'));
  await set(newRef, {
    name: name || '',
    email,
    proposingLecture: !!proposingLecture,
    proposal: proposingLecture ? (proposal || '') : '',
    submittedAt: Date.now()
  });
  const type = proposingLecture ? 'Guest Lecture Proposal' : 'General Interest Signup';
  const details = proposingLecture ? (proposal || '(no details given)') : '(general updates signup, no proposal)';
  notifyAdmin(type, name, email, details);
}

// Admin-only (requires signing in as ADMIN_EMAIL)
export async function getAllInterestSignups() {
  try {
    const snap = await get(ref(db, 'interestSignups'));
    return snap.exists() ? snap.val() : {};
  } catch (err) {
    console.error('getAllInterestSignups failed (are you signed in as the admin email?):', err);
    return null;
  }
}
