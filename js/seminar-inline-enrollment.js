import { auth, onAuthStateChanged, submitRegistration, SEMINAR_TITLES } from './academy-auth.js?v=24';
import { accountError } from './account-flow.js?v=3';
import { createAccount } from './account-create.js?v=1';

export function initInlineSeminarEnrollment(root = document) {
  const form = root.getElementById('inlineEnrollmentForm');
  const step = root.getElementById('inlineAccountStep');
  const result = root.getElementById('inlineEnrollmentResult');
  const signedIn = root.getElementById('inlineSignedInNotice');
  if (!form || !step || !result || !signedIn) return;

  const seminar = 'sex-and-or-love';
  let creating = false;
  let complete = false;

  step.addEventListener('toggle', () => {
    if (step.open) form.elements.email.focus();
  });

  onAuthStateChanged(auth, user => {
    if (creating || complete) return;
    const authenticated = Boolean(user?.email);
    step.hidden = authenticated;
    signedIn.hidden = !authenticated;
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (creating || !form.reportValidity()) return;
    const status = form.querySelector('[role="status"]');
    const submit = form.querySelector('[type="submit"]');
    const originalLabel = submit.textContent;
    const name = form.elements.name.value.trim();
    const xHandle = form.elements.xHandle.value.trim();
    const reason = form.elements.reason.value.trim();
    if (!name || !xHandle || !reason) {
      status.textContent = 'Please complete your name, X handle, and reason for joining.';
      return;
    }

    creating = true;
    let accountCreated = false;
    submit.disabled = true;
    submit.textContent = 'Creating account…';
    status.textContent = '';
    try {
      await createAccount(form.elements.email.value, form.elements.password.value, form.elements.confirmation.value);
      accountCreated = true;
      submit.textContent = 'Saving enrollment request…';
      const user = auth.currentUser;
      if (!user?.email) throw new Error('Please sign in again.');
      await submitRegistration(user.email, name, xHandle, seminar, reason, SEMINAR_TITLES[seminar]);
      complete = true;
      form.reset();
      step.open = false;
      step.hidden = true;
      result.hidden = false;
      result.classList.remove('is-error');
      result.textContent = 'Account created ✓ Your enrollment request is saved. Next, DM @NetaDAO_Academy from your registered X handle to confirm enrollment.';
    } catch (error) {
      if (accountCreated) {
        step.hidden = true;
        signedIn.hidden = false;
        result.hidden = false;
        result.classList.add('is-error');
        result.textContent = 'Your account was created, but the enrollment request could not be saved. Complete it in your account before verifying on X.';
      } else {
        status.textContent = accountError(error);
      }
    } finally {
      creating = false;
      submit.disabled = false;
      submit.textContent = originalLabel;
    }
  });
}
