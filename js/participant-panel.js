import { participantPlan } from './seminar-now.js?v=3';

export function createParticipantPanel(root = document, now = () => Date.now()) {
  const panel = root.getElementById('participantPanel');
  let enrolled = false, lastKey = '';
  const make = (tag, className, text) => {
    const node = root.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const link = (text, href) => {
    const node = make('a', 'text-link', text); node.href = href; return node;
  };
  function render(force = false) {
    const plan = enrolled ? participantPlan(now()) : null;
    if (!plan) {
      panel.hidden = true; panel.replaceChildren(); lastKey = ''; return;
    }
    const source = root.getElementById(plan.session.id);
    if (!source) return;
    const key = `${plan.kind}|${plan.session.id}|${plan.film?.id}|${plan.underway}|${plan.today}`;
    if (!force && key === lastKey) return;
    lastKey = key;
    panel.hidden = false;
    const kicker = make('p', 'participant-kicker', plan.underway ? 'Screening night' : plan.today ? 'Today' : 'Up next');
    const detail = make('div', 'participant-detail');
    const sessionTitle = source.querySelector('.session-title').textContent;
    let title = sessionTitle;
    let date = source.querySelector('.lecture-date')?.textContent || 'Date TBD';
    if (plan.kind === 'screening') {
      const row = source.querySelector(`[data-screening="${plan.film.id}"]`)?.closest('li');
      const heading = row?.querySelector('.screening-title-lead')?.textContent.replace(/,$/, '');
      title = heading || sessionTitle;
      date = `${plan.film.date} · 10 p.m. Eastern / 7 p.m. Pacific`;
    } else if (plan.kind !== 'unscheduled') {
      title += ' · Lecture';
    }
    const heading = make('h2', '', ''); heading.id = 'participantPanelTitle';
    heading.append(link(title, '#' + plan.session.id));
    if (plan.kind === 'screening') {
      heading.append(root.createTextNode(' · '), link('Screening ↗', '/cinema.html'));
    }
    detail.append(heading, make('p', 'participant-date', date));
    panel.replaceChildren(kicker, detail);
  }
  return {
    setEnrolled(value) { enrolled = value === true; render(true); },
    refresh() { render(true); },
    tick() { render(); }
  };
}
