import { sessions, screenings, formatDate, screeningDateText, screeningSummary, SCREENING_WINDOW_MS } from './seminar-data.js';
import { easternDate } from './seminar-now.js?v=3';

export function sessionStates(now = Date.now()) {
  const today = easternDate(now);
  let nextAssigned = false;
  return sessions.map(session => {
    const films = screenings.filter(film => film.session === session.id);
    const filmPending = films.some(film => !film.screened && (!film.startsAt || now < Date.parse(film.startsAt) + SCREENING_WINDOW_MS));
    const begun = films.some(film => (film.screened && film.screenedOn <= today) || (film.startsAt && now >= Date.parse(film.startsAt)));
    let label, state;
    if (session.lectureDate && session.lectureDate < today && !filmPending) {
      label = 'Past'; state = 'past';
    } else if (session.lectureDate === today || begun) {
      label = 'In progress'; state = 'current'; nextAssigned = true;
    } else {
      const dated = session.lectureDate || films.some(film => film.startsAt);
      label = dated ? (nextAssigned ? 'Scheduled' : 'Next') : 'Date TBD';
      state = 'upcoming';
      if (dated) nextAssigned = true;
    }
    return { id: session.id, label, state };
  });
}

export function scheduleLabels() {
  return [
    ...sessions.map(session => ({ attribute: 'data-lecture-date', id: session.id, text: formatDate(session.lectureDate) })),
    ...sessions.filter(session => screenings.some(film => film.session === session.id)).map(session => ({ attribute: 'data-screening-summary', id: session.id, text: screeningSummary(session.id) })),
    ...screenings.map(film => ({ attribute: 'data-screening-date', id: film.id, text: screeningDateText(film) }))
  ];
}

export function renderSessionSchedule(root, now = Date.now()) {
  for (const { attribute, id, text } of scheduleLabels()) {
    const node = root.querySelector(`[${attribute}="${id}"]`);
    if (node && node.textContent !== text) node.textContent = text;
  }
  for (const { id, label, state } of sessionStates(now)) {
    const row = root.getElementById(id);
    const badge = row?.querySelector('.session-status');
    if (!badge) continue;
    for (const value of ['past', 'current', 'upcoming']) {
      row.classList.toggle('session-' + value, value === state);
      badge.classList.toggle('status-' + value, value === state);
    }
    // Design-system rows (SessionRow): pink marks the present; a collapsible past row stays a <details>.
    if (row.classList.contains('nda-session')) {
      row.classList.toggle('nda-session--current', state === 'current');
      if (row.tagName === 'DETAILS') row.classList.toggle('nda-session--past', state === 'past');
      const variant = state === 'upcoming' ? { Next: 'next', Scheduled: 'scheduled' }[label] : state;
      for (const value of ['past', 'current', 'next', 'scheduled']) badge.classList.toggle('nda-status--' + value, value === variant);
    }
    if (badge.textContent !== label) badge.textContent = label;
  }
}
