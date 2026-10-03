import { auth, onAuthStateChanged, getRegistrations, ADMIN_EMAIL } from './academy-auth.js?v=27';
import { staffCall } from './staff-api.js';
let generation = 0;
onAuthStateChanged(auth, async user => {
  const request = ++generation;
  document.querySelector('[data-conditional-cinema]')?.remove();
  const menu = document.querySelector('.nav-links');
  // The design system's header always lists Cinema; this only adds it to the older pages' menu.
  if (!menu || !user?.email || document.querySelector('.nda-header')) return;
  let entitled = user.email === ADMIN_EMAIL && user.emailVerified === true;
  if (!entitled) {
    const [registration, assignments] = await Promise.allSettled([getRegistrations(user.email),staffCall('getTeachingAssignments')]);
    entitled = registration.status === 'fulfilled' && registration.value?.['sex-and-or-love']?.enrolled === true || assignments.status === 'fulfilled' && assignments.value.includes('sex-and-or-love');
  }
  if (!entitled || request !== generation || auth.currentUser?.uid !== user.uid) return;
  const item=document.createElement('li');item.dataset.conditionalCinema='true';
  const link=document.createElement('a');link.href='/cinema.html';link.textContent='Cinema';item.append(link);
  menu.insertBefore(item,document.getElementById('navAccountItem'));
});
