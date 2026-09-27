// Spoiler presentation for the seminar page. Enrollment remains controlled by
// academy-auth.js and Firebase. Unscheduled titles stay hidden in the interface.
import { screenings } from './seminar-data.js';
export { screenings } from './seminar-data.js';

export function canRevealTitle(screening, enrolled, now = Date.now()) {
  if (!enrolled) return false;
  if (screening.screened) return true;
  if (!screening.startsAt) return false;
  const start = Date.parse(screening.startsAt);
  return Number.isFinite(start) && now >= start;
}

export function screeningText(screening, enrolled, now = Date.now()) {
  if (canRevealTitle(screening, enrolled, now)) return screening.title;
  if (screening.screened) return '';
  return 'Film title revealed to enrolled participants when the screening begins.';
}

export function renderScreenings(root, enrolled, now = Date.now()) {
  for (const screening of screenings) {
    const node = root.querySelector(`[data-screening="${screening.id}"]`);
    if (!node) continue;
    const text = canRevealTitle(screening, enrolled, now) ? screening.title : '';
    // Avoid repeated live-region announcements when the minute ticks over.
    if (node.textContent !== text) node.textContent = text;
    node.classList.toggle('film-revealed', canRevealTitle(screening, enrolled, now));
  }
}
