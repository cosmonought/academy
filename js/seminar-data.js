// Canonical schedule. Dates without announced times are Eastern calendar dates.
export const SCREENING_WINDOW_MS = 4 * 60 * 60 * 1000;
export const sessions = [
  { id: 'session0', lectureDate: '2026-02-18' },
  { id: 'session1', lectureDate: '2026-03-04' },
  { id: 'session2', lectureDate: '2026-04-08' },
  { id: 'session3', lectureDate: '2026-05-27' },
  { id: 'session4', lectureDate: '2026-07-29' },
  { id: 'session5', lectureDate: '2026-08-12' },
  { id: 'session6', lectureDate: '2026-10-14' },
  { id: 'session7', lectureDate: null },
  { id: 'session8', lectureDate: null }
];
export function formatDate(date) {
  return date ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z')) : 'Date TBD';
}
export const screenings = [
  { id: 'skin', director: 'Marina de Van', session: 'session4', title: 'Dans Ma Peau', screenedOn: '2026-07-22', screened: true },
  { id: 'sister', director: 'Catherine Breillat', session: 'session5', title: 'À ma sœur!', screenedOn: '2026-08-05', screened: true },
  { id: 'cook', director: 'Peter Greenaway', session: 'session6', title: 'The Cook, the Thief, His Wife & Her Lover', screenedOn: '2026-09-16', screened: true },
  { id: 'mother', director: 'Christophe Honoré', session: 'session6', title: 'Ma Mère', screenedOn: '2026-09-23', screened: true },
  { id: 'park', director: 'Larry Clark and Ed Lachman', session: 'session6', title: 'Ken Park', startsAt: '2026-09-30T22:00:00-04:00' },
  { id: 'hiroshima', director: 'Alain Resnais', session: 'session6', title: 'Hiroshima, Mon Amour', startsAt: '2026-10-07T22:00:00-04:00' },
  { id: 'tambien', director: 'Alfonso Cuarón', session: 'session7', title: 'Y Tu Mamá También', startsAt: null },
  { id: 'someone', director: 'Abbas Kiarostami', session: 'session8', title: 'Like Someone in Love', startsAt: null }
].map(film => ({ ...film, date: formatDate(film.screenedOn || film.startsAt?.slice(0, 10)) }));

export function screeningDateText(film) {
  const date = film.date.replace(/ \d{4}$/, '');
  if (!film.startsAt) return date;
  const time = zone => new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit' }).format(new Date(film.startsAt));
  return `${date} · ${time('America/New_York')} Eastern / ${time('America/Los_Angeles')} Pacific`;
}
export function screeningSummary(sessionId) {
  const dates = screenings.filter(film => film.session === sessionId).map(film => film.date);
  const year = dates.at(-1)?.match(/\d{4}$/)?.[0];
  return dates.map((date, index) => year && index < dates.length - 1 && date.endsWith(year) ? date.slice(0, -5) : date).join(', ');
}
