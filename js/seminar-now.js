import { screenings, sessions, SCREENING_WINDOW_MS } from './seminar-data.js';
export { SCREENING_WINDOW_MS } from './seminar-data.js';
export const upcomingSessions = sessions;
export function easternDate(now) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(now));
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function currentScreening(now = Date.now()) {
  return screenings.find(film => Number.isFinite(Date.parse(film.startsAt)) && now >= Date.parse(film.startsAt) && now < Date.parse(film.startsAt) + SCREENING_WINDOW_MS) || null;
}
export function participantPlan(now = Date.now()) {
  const day = easternDate(now);
  for (const session of upcomingSessions) {
    const film = screenings.filter(item => item.session === session.id && !item.screened && Number.isFinite(Date.parse(item.startsAt)) && now < Date.parse(item.startsAt) + SCREENING_WINDOW_MS)
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
    if (film) return { kind: 'screening', session, film, underway: now >= Date.parse(film.startsAt) };
    if (session.lectureDate && session.lectureDate >= day) return { kind: 'lecture', session, today: session.lectureDate === day };
    if (!session.lectureDate) return { kind: 'unscheduled', session, film: screenings.find(item => item.session === session.id && !item.screened) };
  }
  return null;
}

// Keep navigation available throughout the gathering, independent of playback.
export function bannerState(now) {
  const film = currentScreening(now);
  return film ? { film, label: 'Screening night' } : null;
}
