import { auth, onAuthStateChanged, signOut, initNavAccountWidget,
  signInWithPassword, sendPasswordReset, checkPasswordReset, finishPasswordReset,
  getRegistrationForSeminar, submitRegistration, SEMINAR_TITLES } from './academy-auth.js?v=26';
import { signInDestination, destinationLabel, passwordIssue, accountError, seminarPages } from './account-flow.js?v=4';
import { createAccount } from './account-create.js?v=1';

const el = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const seminar = Object.hasOwn(SEMINAR_TITLES, params.get('seminar')) ? params.get('seminar') : null;
const returnTo = signInDestination(params.get('returnTo') || seminarPages[seminar] || '/profile.html');
let view = ['create', 'recover'].includes(params.get('view')) ? params.get('view') : 'signin';
let resetCode = params.get('mode') === 'resetPassword' ? params.get('oobCode') : null;
let resetActive = params.get('mode') === 'resetPassword';
let resetEmail = '';
let busy = false;
let generation = 0;
initNavAccountWidget();
if (seminar) {
  el('accountContext').hidden = false;
  el('accountContext').textContent = `Joining: ${SEMINAR_TITLES[seminar]}`;
}

function panel(id) {
  for (const name of ['accountLoading', 'accountGuest', 'accountMember', 'accountReset', 'accountResetDone']) el(name).hidden = name !== id;
}
function showGuest() {
  panel('accountGuest');
  document.querySelectorAll('[data-panel]').forEach(node => { node.hidden = node.dataset.panel !== view; });
  document.querySelectorAll('[data-view]').forEach(link => {
    link.toggleAttribute('aria-current', link.dataset.view === view);
    const query = new URLSearchParams({ view: link.dataset.view, returnTo });
    if (seminar) query.set('seminar', seminar);
    link.href = '/account.html?' + query;
  });
}

async function refresh(user) {
  const request = ++generation;
  if (resetActive || busy) return;
  if (!user?.email || view === 'recover') { showGuest(); return; }
  panel('accountMember');
  el('memberEmail').textContent = user.email;
  el('memberStatus').textContent = '';
  el('enrollmentFormWrap').hidden = true;
  el('enrollmentPending').hidden = true;
  el('continueLink').href = returnTo;
  el('continueLink').textContent = destinationLabel(returnTo);
  if (!seminar) return;
  el('memberStatus').textContent = 'Checking seminar enrollment…';
  try {
    const reg = await getRegistrationForSeminar(user.email, seminar);
    if (request !== generation || auth.currentUser?.uid !== user.uid) return;
    el('memberStatus').textContent = '';
    if (reg?.enrolled === true) {
      el('memberStatus').textContent = `You’re enrolled in ${SEMINAR_TITLES[seminar]}. Your materials are ready.`;
    } else if (reg) {
      el('enrollmentPending').hidden = false;
      el('pendingDetail').textContent = `Your request for ${SEMINAR_TITLES[seminar]} is saved. Registered X handle: ${reg.xHandle}.`;
    } else {
      el('enrollmentTitle').textContent = `Join ${SEMINAR_TITLES[seminar]}`;
      el('enrollmentFormWrap').hidden = false;
    }
  } catch (error) {
    if (request !== generation) return;
    el('memberStatus').textContent = accountError(error) + ' Your account reference: ' + user.uid;
  }
}

document.querySelectorAll('[data-view]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  if (busy) return;
  resetCode = null;
  resetActive = false;
  view = link.dataset.view;
  history.replaceState({}, '', link.href);
  showGuest();
  document.querySelector(`[data-panel="${view}"] input`)?.focus();
}));
document.querySelectorAll('[data-reveal]').forEach(button => button.addEventListener('click', () => {
  const input = el(button.dataset.reveal);
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  button.textContent = show ? 'Hide' : 'Show';
  button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  button.setAttribute('aria-pressed', String(show));
}));

function formHandler(id, action) {
  const form = el(id);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const button = form.querySelector('[type="submit"]');
    const status = form.querySelector('[role="status"]');
    const label = button.textContent;
    busy = true;
    button.disabled = true;
    button.textContent = 'Please wait…';
    status.textContent = '';
    try { await action(form, status); }
    catch (error) { status.textContent = accountError(error); }
    finally { busy = false; button.disabled = false; button.textContent = label; }
  });
}

formHandler('signInForm', async form => {
  await signInWithPassword(form.elements.email.value, form.elements.password.value);
  form.reset();
  busy = false;
  await refresh(auth.currentUser);
});
formHandler('createAccountForm', async (form, status) => {
  await createAccount(form.elements.email.value, form.elements.password.value, form.elements.confirmation.value);
  form.reset();
  busy = false;
  el('memberHeading').textContent = 'Account created. You’re signed in.';
  await refresh(auth.currentUser);
});
formHandler('recoverForm', async (form, status) => {
  try { await sendPasswordReset(form.elements.email.value.trim()); }
  catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
  status.textContent = 'If an account uses that email, a password reset link has been sent. Open it, choose a password, then return here to sign in. If nothing arrives, use the help options below.';
});
formHandler('resetPasswordForm', async (form, status) => {
  const issue = passwordIssue(form.elements.password.value, form.elements.confirmation.value);
  if (issue) { status.textContent = issue; return; }
  await finishPasswordReset(resetCode, form.elements.password.value);
  resetCode = null;
  form.reset();
  const query = new URLSearchParams({ view: 'signin', returnTo });
  if (seminar) query.set('seminar', seminar);
  history.replaceState({}, '', '/account.html?' + query);
  panel('accountResetDone');
  el('resetDoneHeading').focus();
});
el('resetSignIn').addEventListener('click', () => {
  resetActive = false;
  view = 'signin';
  showGuest();
  el('signInEmail').value = resetEmail;
  el('signInPassword').focus();
});
formHandler('enrollmentForm', async (form, status) => {
  const user = auth.currentUser;
  if (!user?.email || !seminar) { status.textContent = 'Please sign in again.'; return; }
  const name = form.elements.name.value.trim(), handle = form.elements.xHandle.value.trim(), reason = form.elements.reason.value.trim();
  if (!name || !handle || !reason) { status.textContent = 'Please complete all three fields.'; return; }
  await submitRegistration(user.email, name, handle, seminar, reason, SEMINAR_TITLES[seminar]);
  form.reset();
  busy = false;
  await refresh(user);
});
el('checkEnrollment').addEventListener('click', () => refresh(auth.currentUser));
el('accountSignOut').addEventListener('click', async () => {
  try { view = 'signin'; await signOut(auth); }
  catch (error) { el('memberStatus').textContent = accountError(error); }
});

if (resetActive) {
  panel('accountReset');
  el('resetPasswordForm').hidden = true;
  try {
    if (!resetCode) throw { code: 'auth/invalid-action-code' };
    resetEmail = await checkPasswordReset(resetCode);
    el('resetEmail').textContent = 'Account: ' + resetEmail;
    el('resetPasswordForm').hidden = false;
  } catch (error) { el('resetEmail').textContent = accountError(error); }
}
onAuthStateChanged(auth, user => { refresh(user); });
