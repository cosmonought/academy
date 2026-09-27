import { auth, onAuthStateChanged, getRegistrationForSeminar } from './academy-auth.js?v=24';
import { accountError } from './account-flow.js?v=3';

// This seminar communicates access beside Sessions, without an account-management panel.
export function watchSeminarAccess(onChange, root = document) {
  const el = id => root.getElementById(id);
  let generation = 0;
  function display(state, message = '') {
    const enrolled = state === 'Enrolled';
    const pending = state === 'Registered';
    const loading = state === 'Checking access…';
    el('seminarEnrollmentBadge').textContent = state;
    el('seminarEnrollmentBadge').classList.toggle('is-enrolled', enrolled);
    el('seminarEnrollmentBadge').classList.toggle('is-registered', pending);
    el('seminarEnrollmentBadge').classList.toggle('is-not-enrolled', state === 'Not enrolled');
    el('participation').hidden = enrolled || loading;
    el('syllabusAccessNote').hidden = enrolled;
    el('participationAccount').hidden = enrolled || pending || loading;
    el('participationStatus').hidden = !(enrolled || pending || loading);
    el('participationStatus').textContent = pending ? 'Awaiting enrollment confirmation' : state;
    el('seminarAccessMessage').textContent = message;
  }
  return onAuthStateChanged(auth, async user => {
    const request = ++generation;
    onChange(false);
    if (!user?.email) { display('Not enrolled'); return; }
    display('Checking access…');
    try {
      const registration = await getRegistrationForSeminar(user.email, 'sex-and-or-love');
      if (request !== generation || auth.currentUser?.uid !== user.uid) return;
      if (registration?.enrolled === true) {
        display('Enrolled');
        onChange(true);
      } else if (registration) {
        display('Registered', 'Your registration is saved. DM @NetaDAO_Academy from your registered X handle to confirm enrollment.');
      } else {
        display('Not enrolled');
      }
    } catch (error) {
      if (request === generation) display('Access unavailable', accountError(error));
    }
  });
}
