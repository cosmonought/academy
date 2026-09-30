const buttons = [...document.querySelectorAll('[data-profile-tab]')];
const panels = [...document.querySelectorAll('[data-profile-panel]')];
let teachingAvailable = false;
let requested = location.hash.slice(1);
export function activateProfileTab(tab, updateHash = true) {
  if (!['seminars','transcript','account','teaching'].includes(tab) || (tab === 'teaching' && !teachingAvailable)) tab = 'seminars';
  for (const button of buttons) {
    const active = button.dataset.profileTab === tab;
    button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
  }
  for (const panel of panels) panel.hidden = panel.dataset.profilePanel !== tab;
  if (updateHash) history.replaceState(null, '', '#' + tab);
  document.dispatchEvent(new CustomEvent('profile-tab-change', { detail: tab }));
}
export function setTeachingAvailable(available, resolveInitial = true) {
  teachingAvailable = available;
  document.getElementById('profileTeachingTab').hidden = !available;
  if (resolveInitial && requested === 'teaching') { activateProfileTab(available ? 'teaching' : 'seminars'); requested = ''; }
  else if (resolveInitial && !available && !document.getElementById('profileTeachingPanel').hidden) activateProfileTab('seminars');
}
document.querySelector('.profile-tabs').addEventListener('click', event => {
  const button = event.target.closest('[data-profile-tab]');
  if (button && !button.hidden) { requested = ''; activateProfileTab(button.dataset.profileTab); }
});
addEventListener('hashchange', () => activateProfileTab(location.hash.slice(1)));
activateProfileTab(requested, false);
