import { auth, onAuthStateChanged, getRegistrationForSeminar } from './academy-auth.js?v=27';
import { accountError, seminarAccountLink } from './account-flow.js?v=3';

// Shared enrollment-state watcher for seminar surfaces that need to gate
// materials without rendering account-management UI in the reading flow.
export function watchEnrollmentState(seminar, onState) {
  let generation = 0;
  return onAuthStateChanged(auth, async user => {
    const request = ++generation;
    if (!user?.email) {
      onState({ status: 'signed-out', approved: false, registration: null, user: null, message: '' });
      return;
    }

    onState({ status: 'checking', approved: false, registration: null, user, message: '' });
    try {
      const registration = await getRegistrationForSeminar(user.email, seminar);
      if (request !== generation || auth.currentUser?.uid !== user.uid) return;
      if (registration?.enrolled === true) {
        onState({ status: 'enrolled', approved: true, registration, user, message: '' });
      } else if (registration) {
        onState({
          status: 'registered',
          approved: false,
          registration,
          user,
          message: `Enrollment is awaiting confirmation. DM @NetaDAO_Academy from ${registration.xHandle} to complete it.`
        });
      } else {
        onState({ status: 'not-enrolled', approved: false, registration: null, user, message: '' });
      }
    } catch (error) {
      if (request === generation) {
        onState({ status: 'error', approved: false, registration: null, user, message: accountError(error), error });
      }
    }
  });
}

// Legacy panel renderer retained for pages that still use the account-management
// panel. It now consumes the same shared state watcher as quieter seminar gates.
export function watchEnrollment(seminar, container, onChange) {
  const status = container.querySelector('[role="status"]');
  const action = container.querySelector('[data-account-link]');
  const login = container.querySelector('[data-login-link]');
  const loginPrompt = container.querySelector('[data-login-prompt]');
  const recheck = container.querySelector('[data-check-enrollment]');

  function render(state) {
    const user = state.user;
    onChange(state.approved);
    const returnTo = location.pathname + '#' + container.id;
    action.href = seminarAccountLink(seminar, user?.email ? 'signin' : 'create', returnTo);
    action.textContent = user?.email ? 'Manage enrollment →' : 'Register →';
    if (login) login.href = seminarAccountLink(seminar, 'signin', returnTo);
    if (loginPrompt) loginPrompt.hidden = !!user?.email;
    recheck.hidden = !user?.email;

    if (state.status === 'signed-out') {
      status.textContent = 'Sign in to access your materials. New participants can create an account and request enrollment.';
    } else if (state.status === 'checking') {
      status.textContent = 'Checking enrollment…';
    } else if (state.status === 'enrolled') {
      status.textContent = 'You’re enrolled. Your materials are available.';
    } else if (state.status === 'registered') {
      status.textContent = `You’re signed in as ${user.email}. ${state.message}`;
    } else if (state.status === 'not-enrolled') {
      status.textContent = `You’re signed in as ${user.email}. Request enrollment to join this seminar.`;
      action.textContent = 'Request enrollment →';
    } else if (state.status === 'error') {
      status.textContent = state.message;
    }
  }

  let stop = watchEnrollmentState(seminar, render);
  if (recheck) {
    recheck.addEventListener('click', () => {
      if (typeof stop === 'function') stop();
      stop = watchEnrollmentState(seminar, render);
    });
  }
  return () => { if (typeof stop === 'function') stop(); };
}
