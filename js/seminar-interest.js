// Forthcoming-seminar interest capture.
// Reuses the Academy Firebase app/database initialized by academy-auth.js,
// but stores interest separately from both newsletter signups and enrollment.
import { db } from './academy-auth.js?v=24';
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js';

export const GRAPHIC_SEMINAR_ID = 'sex-monsters-superheroes';
export const GRAPHIC_SEMINAR_TITLE = 'Sex, Monsters, and Superheroes';

export async function submitSeminarInterest(name, email, seminarId = GRAPHIC_SEMINAR_ID, seminarTitle = GRAPHIC_SEMINAR_TITLE) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedName = String(name || '').trim();
  if (!normalizedEmail || normalizedEmail.length > 120) throw new Error('A valid email is required.');
  if (normalizedName.length > 80) throw new Error('Name is too long.');
  if (seminarId !== GRAPHIC_SEMINAR_ID) throw new Error('Unknown seminar.');

  const newRef = push(ref(db, 'seminarInterests'));
  await set(newRef, {
    name: normalizedName,
    email: normalizedEmail,
    seminarId,
    seminarTitle,
    state: 'interested',
    notifyWhenEnrollmentOpens: true,
    submittedAt: Date.now()
  });

  // Notification is supplementary: persistence above is authoritative.
  // The same EmailJS service/template used elsewhere on the Academy site is
  // reused when the page has loaded the browser SDK.
  if (typeof window !== 'undefined' && window.emailjs) {
    window.emailjs.send('service_8szs7ct', 'template_di3sjur', {
      to_email: 'academy@netadao.org',
      notification_type: 'Seminar Interest',
      from_name: normalizedName || '(no name given)',
      from_email: normalizedEmail,
      details: `Seminar: ${seminarTitle} (${seminarId})\nState: interested\nNotify when enrollment opens: yes`
    }).catch((error) => console.warn('Seminar-interest notification failed:', error));
  }
}
