import { auth, onAuthStateChanged, getRegistrationForSeminar } from './academy-auth.js?v=24';
import { accountError, seminarAccountLink } from './account-flow.js?v=3';

// Each refresh closes the gate first. A late response from a previous account
// must never unlock the current account's page.
export function watchEnrollment(seminar, container, onChange) {
  let generation = 0;
  const status = container.querySelector('[role="status"]');
  const action = container.querySelector('[data-account-link]');
  const login = container.querySelector('[data-login-link]');
  const loginPrompt = container.querySelector('[data-login-prompt]');
  const recheck = container.querySelector('[data-check-enrollment]');
  async function refresh(user) {
    const request = ++generation;
    onChange(false);
    const returnTo = location.pathname + '#' + container.id;
    action.href = seminarAccountLink(seminar, user?.email ? 'signin' : 'create', returnTo);
    action.textContent = user?.email ? 'Manage enrollment →' : 'Register →';
    if (login) login.href = seminarAccountLink(seminar, 'signin', returnTo);
    if (loginPrompt) loginPrompt.hidden = !!user?.email;
    recheck.hidden = !user?.email;
    if (!user?.email) {
      status.textContent = 'Sign in to access your materials. New participants can create an account and request enrollment.';
      return;
    }
    status.textContent = 'Checking enrollment…';
    try {
      const registration = await getRegistrationForSeminar(user.email, seminar);
      if (request !== generation || auth.currentUser?.uid !== user.uid) return;
      if (registration?.enrolled === true) {
        status.textContent = 'You’re enrolled. Your materials are available.';
        onChange(true);
      } else if (registration) {
        status.textContent = `You’re signed in as ${user.email}. Enrollment is awaiting confirmation. DM @NetaDAO_Academy from ${registration.xHandle} to complete it.`;
      } else {
        status.textContent = `You’re signed in as ${user.email}. Request enrollment to join this seminar.`;
        action.textContent = 'Request enrollment →';
      }
    } catch (error) {
      if (request === generation) status.textContent = accountError(error);
    }
  }
  recheck.addEventListener('click', () => refresh(auth.currentUser));
  return onAuthStateChanged(auth, refresh);
}
