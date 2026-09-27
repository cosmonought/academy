import { screenings } from './seminar-screenings.js';
import { SCREENING_WINDOW_MS } from './seminar-now.js?v=3';

export function screeningSchedule(now = Date.now()) {
  const past = screenings.filter(film => film.screened ||
    (Number.isFinite(Date.parse(film.startsAt)) && now >= Date.parse(film.startsAt) + SCREENING_WINDOW_MS));
  const next = screenings.filter(film => !past.includes(film) && Number.isFinite(Date.parse(film.startsAt)))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
  return { pastIds: past.map(film => film.id), nextId: next?.id || null };
}

export function renderScreeningSchedule(root, enrolled, now = Date.now()) {
  const { pastIds, nextId } = screeningSchedule(now);
  const cinemaLink = root.getElementById('screeningCinemaLink');
  for (const film of screenings) {
    const row = root.querySelector(`[data-screening="${film.id}"]`)?.closest('li');
    if (!row) continue;
    const past = pastIds.includes(film.id);
    row.classList.toggle('screening-past', past);
    let status = row.querySelector('.screening-state');
    if (!status) {
      status = root.createElement('span');
      status.className = 'screening-state';
      row.querySelector('.screening-date').append(status);
    }
    const label = past ? ' · Screened' : '';
    if (status.textContent !== label) status.textContent = label;
    if (cinemaLink && film.id === nextId && cinemaLink.parentElement !== row) row.append(cinemaLink);
  }
  // Public schedule refreshes may move or retire the link, but never grant access.
  if (cinemaLink && (typeof enrolled === 'boolean' || !nextId)) cinemaLink.classList.toggle('hidden', !enrolled || !nextId);
}
