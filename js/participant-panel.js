import { participantPlan } from './seminar-now.js?v=3';
import { screeningText } from './seminar-screenings.js';

export function createParticipantPanel(root = document, now = () => Date.now()) {
  const panel = root.getElementById('participantPanel');
  const page = root.querySelector('.seminar-page');
  let enrolled = false, lastKey = '';
  const make = (tag, className, text) => {
    const node = root.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const link = (text, href, className = 'text-link') => {
    const node = make('a', className, text); node.href = href; return node;
  };
  function render(force = false) {
    const plan = enrolled ? participantPlan(now()) : null;
    if (!plan) {
      panel.hidden = true; panel.replaceChildren(); page.classList.remove('is-enrolled'); lastKey = ''; return;
    }
    const source = root.getElementById(plan.session.id);
    if (!source) return;
    const filmName = plan.film ? screeningText(plan.film, true, now()) : '';
    const key = `${plan.kind}|${plan.session.id}|${plan.film?.id}|${plan.underway}|${plan.today}|${filmName}`;
    if (!force && key === lastKey) return;
    lastKey = key;
    page.classList.add('is-enrolled'); panel.hidden = false;
    const top = make('div', 'participant-panel-top');
    top.append(make('p', 'participant-kicker', plan.underway ? 'Screening night · Your seminar' : 'Up next · Your seminar'), link('Full syllabus →', '#sessions'));
    const grid = make('div', 'participant-panel-grid');
    const event = make('div', 'participant-next');
    const readingSection = make('div', 'participant-readings');
    const sessionTitle = source.querySelector('.session-title').textContent;
    const lectureDate = source.querySelector('.lecture-date')?.textContent || 'Date TBD';
    if (plan.kind === 'screening') {
      const filmRow = source.querySelector(`[data-screening="${plan.film.id}"]`)?.closest('li');
      const heading = filmRow?.querySelector('.screening-title-lead')?.textContent.replace(/,$/, '') || 'Film screening';
      const subtitle = filmRow?.querySelector('.screening-title-subtitle')?.textContent;
      event.append(make('p', 'participant-event-type', plan.underway ? 'Screening & conversation' : 'Next screening'));
      const title = make('h2', '', heading); title.id = 'participantPanelTitle'; event.append(title);
      if (subtitle) event.append(make('p', 'participant-subtitle', subtitle));
      event.append(make('p', 'participant-date', `${plan.film.date} · 10 p.m. Eastern / 7 p.m. Pacific`));
      event.append(make('p', 'participant-film', filmName));
      event.append(link('Open Cinema →', '/cinema.html', 'btn btn-primary'));
      readingSection.append(make('p', 'participant-event-type', 'Then · Lecture & discussion'), make('h3', '', sessionTitle), make('p', 'participant-date', lectureDate));
    } else {
      event.append(make('p', 'participant-event-type', plan.kind === 'unscheduled' ? 'Coming next · Dates to be announced' : plan.today ? 'Lecture today' : 'Next lecture & discussion'));
      const title = make('h2', '', sessionTitle); title.id = 'participantPanelTitle'; event.append(title);
      event.append(make('p', 'participant-date', lectureDate));
      if (plan.kind === 'unscheduled') {
        event.append(make('p', '', 'A film screening will precede the lecture. Screening and lecture dates will appear here once announced.'));
        event.append(link('View session details →', '#' + plan.session.id));
      } else {
        event.append(link('Open X Spaces →', 'https://x.com/NetaDAO_Academy', 'btn btn-primary'));
      }
      readingSection.append(make('h3', '', 'Readings'));
    }
    const readings = source.querySelector('.reading-list')?.cloneNode(true);
    if (readings) readingSection.append(readings);
    readingSection.append(link('Session details & readings →', '#' + plan.session.id));
    grid.append(event, readingSection); panel.replaceChildren(top, grid);
  }
  return {
    setEnrolled(value) { enrolled = value === true; render(true); },
    refresh() { render(true); },
    tick() { render(); }
  };
}
