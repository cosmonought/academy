// ════════════════════════════════════════════════════════════
// Neta DAO Academy — shared authentication + entitlement module
// Shared by the account, seminar, profile, cinema, and admin pages.
// ════════════════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, verifyPasswordResetCode, confirmPasswordReset, isSignInWithEmailLink, signInWithEmailLink,
  signInWithEmailAndPassword, sendPasswordResetEmail,
  updatePassword, signInWithPopup, GoogleAuthProvider,
  onAuthStateChanged as _onAuthStateChanged, signOut as _signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import {
  getDatabase, ref, get, update, set, push, onValue
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
// the account page) when signed out. When signed in, the link becomes
// "Your profile" and takes you to /profile.html, where account
// status and sign-out both live. If the signed-in email matches
// ADMIN_EMAIL, also injects "Admin" and "Cinema" nav links visible only
// to that account — nobody else ever sees them, since they're only
// added to the DOM when the admin's own auth state is detected.
export function initNavAccountWidget() {
  const signInHref = '/account.html?returnTo=%2Fprofile.html';
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
      navAccountLink.textContent = 'Your profile';
      navAccountLink.setAttribute('aria-label', `Your profile, signed in as ${user.email}`);
      navAccountLink.setAttribute('href', '/profile.html');
      if (user.email === ADMIN_EMAIL && user.emailVerified) {
        ensureAdminNavLinks();
      } else {
        removeAdminNavLinks();
      }
    } else {
      navAccountItem.classList.remove('signed-in');
      navAccountLink.textContent = 'Sign In';
      navAccountLink.removeAttribute('aria-label');
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

// Compatibility for email sign-in links issued before password-first signup.
// New sign-in links are no longer sent by the site.
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
        alert('That sign-in link is invalid or expired. Use Set or reset a password on the account page.');
      }
    }
    window.history.replaceState({}, document.title, window.location.pathname);
    return false;
  }
  return false;
}

// Password-first accounts. Enable only after deploying the matching database rules.
export async function createPasswordAccount(email, password) {
  let ready;
  try { ready = await get(ref(db, 'academyConfig/passwordAccountsEnabled')); }
  catch (error) {
    if (error.code !== 'PERMISSION_DENIED' && error.code !== 'database/permission-denied') throw error;
    throw Object.assign(new Error('Signup not enabled'), { code: 'academy/signup-unavailable' });
  }
  if (ready.val() !== true) throw Object.assign(new Error('Signup not enabled'), { code: 'academy/signup-unavailable' });
  return createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
}

export async function signInWithPassword(email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function checkPasswordReset(code) { return verifyPasswordResetCode(auth, code); }
export function finishPasswordReset(code, password) { return confirmPasswordReset(auth, code, password); }

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
      // Deliberately NOT under academyRegistrations/{key} — that node's
      // children are iterated as {seminarId: registrationRecord} pairs by
      // getRegistrations() (profile.html) and getAllRegistrations()
      // (admin.html), and a stray 'hasPassword' sibling there would show
      // up as a fake seminar registration in both places. accountMeta is
      // a separate top-level tree neither of those readers touches.
      await set(ref(db, `accountMeta/${key}/hasPassword`), true);
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
    const snap = await get(ref(db, `accountMeta/${key}/hasPassword`));
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
  if (!email) return null;
  const pairs = await Promise.all(Object.keys(SEMINAR_TITLES).map(async id => [id, await getRegistrationForSeminar(email, id)]));
  const registrations = Object.fromEntries(pairs.filter(([, record]) => record));
  return Object.keys(registrations).length ? registrations : null;
}

// Do not hide a denied or failed lookup as “not registered.” The UI must offer recovery.
export async function getRegistrationForSeminar(email, seminarId) {
  const key = emailToKey(email);
  if (!key) return null;
  const snap = await get(ref(db, `academyRegistrations/${key}/${seminarId}`));
  return snap.exists() ? snap.val() : null;
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

// New registrations belong to the authenticated UID from the outset.
// The rules reject attempts to overwrite or claim an existing registration.
export async function submitRegistration(email, name, xHandle, seminarId, reason, seminarTitle) {
  const user = auth.currentUser;
  if (!user?.email || user.email.toLowerCase() !== email.toLowerCase()) throw new Error('Sign in first.');
  const key = emailToKey(user.email);
  await update(ref(db, `academyRegistrations/${key}/${seminarId}`), {
    email: user.email.toLowerCase(), name, xHandle, reason,
    accountUid: user.uid, requestedAt: Date.now()
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

// ── Participant record ──
import { ATTENDANCE_EVENTS, EVALUATION_CONFIG, attendanceRecord } from './academy-record.js';
export { ATTENDANCE_EVENTS, EVALUATION_CONFIG, EVALUATION_OFFERED, EVALUATION_FORMS, EVALUATION_OUTCOMES, attendanceRecord, participantAttendanceRecord } from './academy-record.js';
export const SEMINAR_TITLES = {
  'sex-and-or-love': 'Sex, and/or Love',
  'coining-reason-unit-1': 'Coining Reason — Unit I',
  'coining-reason-unit-2': 'Coining Reason — Unit II',
  'sex-monsters-superheroes': 'Sex, Monsters, and Superheroes'
};
export const SEMINAR_COMPLETED = {
  'sex-and-or-love': false,
  'coining-reason-unit-1': true,
  'coining-reason-unit-2': false,
  'sex-monsters-superheroes': false
};
export async function setAttendance(emailKey, seminarId, eventKey, attended) {
  if (!ATTENDANCE_EVENTS[seminarId]?.some(event => event.key === eventKey)) throw new Error('Unknown attendance event.');
  if (![true, false, null].includes(attended)) throw new Error('Attendance must be attended, absent, or unrecorded.');
  await set(ref(db, `academyRegistrations/${emailKey}/${seminarId}/attendance/${eventKey}`), attended);
}
export const computeAttendance = attendanceRecord;

export async function getDisplayName(email) {
  const key = emailToKey(email);
  if (!key) return '';
  const snap = await get(ref(db, `accountMeta/${key}/displayName`));
  return snap.exists() ? snap.val() : '';
}
export function watchDisplayName(email, onName, onError) {
  const key = emailToKey(email);
  if (!key) throw new Error('Account email is required.');
  return onValue(ref(db, `accountMeta/${key}/displayName`), snapshot => onName(snapshot.val() || ''), onError);
}
export async function setDisplayName(name) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('Sign in to set your display name.');
  const trimmed = String(name).trim();
  if (!trimmed || trimmed.length > 40 || /[\x00-\x1f\x7f]/.test(trimmed)) throw new Error('Use a name of 1–40 characters.');
  await set(ref(db, `accountMeta/${emailToKey(user.email)}/displayName`), trimmed);
  return trimmed;
}
export async function getEvaluation(email, seminarId) {
  const snap = await get(ref(db, `evaluations/${emailToKey(email)}/${seminarId}`));
  return snap.val() || {};
}
function evaluationRequestOpen(config, now = Date.now()) {
  if (!config?.enabled) return false;
  return !(typeof config.requestCutoff === 'number' && now > config.requestCutoff);
}

export async function requestEvaluation(seminarId, form) {
  const user = auth.currentUser;
  if (!user?.email || !['essay','presentation','discussion','other'].includes(form)) throw new Error('Choose an evaluation form.');
  const config = EVALUATION_CONFIG[seminarId];
  if (!evaluationRequestOpen(config)) throw new Error('Evaluation requests are not open for this seminar.');
  const registration = (await get(ref(db, `academyRegistrations/${emailToKey(user.email)}/${seminarId}`))).val();
  if (!registration || registration.enrolled !== true) throw new Error('Enrollment is required to request evaluation.');
  const attended = attendanceRecord(seminarId, registration).attended;
  if (attended < (config.minimumAttendanceEvents || 0)) throw new Error('Attend at least one session before opting in to evaluation.');
  await set(ref(db, `evaluations/${emailToKey(user.email)}/${seminarId}/request`), {
    form, requestedAt: Date.now(), accountUid: user.uid
  });
}

export async function cancelEvaluationRequest(seminarId) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('Sign in to change evaluation participation.');
  const config = EVALUATION_CONFIG[seminarId];
  if (!evaluationRequestOpen(config)) throw new Error('The evaluation opt-in window has closed.');
  const evaluationRef = ref(db, `evaluations/${emailToKey(user.email)}/${seminarId}`);
  const current = (await get(evaluationRef)).val() || {};
  if (current.instructor?.state === 'completed') throw new Error('Completed evaluation records cannot be withdrawn.');
  await set(ref(db, `evaluations/${emailToKey(user.email)}/${seminarId}/request`), null);
}
export async function getAllEvaluations() {
  const snap = await get(ref(db, 'evaluations'));
  return snap.val() || {};
}
export async function setInstructorEvaluation(emailKey, seminarId, record) {
  await set(ref(db, `evaluations/${emailKey}/${seminarId}/instructor`), record);
}
export async function getOwnSeminarInterests(email) {
  const seminarId = 'sex-monsters-superheroes';
  const snap = await get(ref(db, `accountSeminarInterests/${emailToKey(email)}/${seminarId}`));
  return snap.exists() ? { [seminarId]: snap.val() } : {};
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
