// Session-centric attendance editor shared by staff surfaces.
// The canonical event model stays event-level (lecture/screening/discussion),
// while the interface follows the instructor's actual task: record one meeting.

const formatEventDate = date => {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month:'short', day:'numeric', year:'numeric', timeZone:'UTC'
    }).format(new Date(date + 'T12:00:00Z'));
  } catch {
    return date;
  }
};

export function groupAttendanceEvents(events = []) {
  const groups = [];
  const byParent = new Map();
  for (const event of events) {
    const parent = event.parent || event.key;
    let group = byParent.get(parent);
    if (!group) {
      group = {
        parent,
        parentIndex: Number.isFinite(event.parentIndex) ? event.parentIndex : groups.length,
        title: event.parentTitle || event.label || parent,
        events:[]
      };
      byParent.set(parent, group);
      groups.push(group);
    }
    group.events.push(event);
  }
  groups.sort((a,b) => a.parentIndex - b.parentIndex);
  return groups;
}

function dateValue(value) {
  if (!value) return NaN;
  const parsed = Date.parse(value + (value.length === 10 ? 'T23:59:59Z' : ''));
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function operationalGroupIndex(groups, now = Date.now()) {
  let best = null;
  groups.forEach((group, index) => {
    for (const event of group.events) {
      const when = dateValue(event.date);
      if (!Number.isFinite(when) || when < now) continue;
      if (!best || when < best.when) best = { index, when };
    }
  });
  return best?.index ?? -1;
}

function eventHeading(event) {
  const kind = event.type === 'screening'
    ? 'Screening'
    : event.type === 'lecture'
      ? 'Lecture'
      : event.type === 'discussion'
        ? 'Discussion'
        : event.type || 'Event';
  const date = formatEventDate(event.date);
  if (event.type === 'screening') {
    return [kind, date, event.label].filter(Boolean).join(' · ');
  }
  return [kind, date].filter(Boolean).join(' · ');
}

function attendanceState(value) {
  return value === true ? 'attended' : value === false ? 'absent' : 'unrecorded';
}

function makeStateButton(doc, label, state, current, onSelect) {
  const button = doc.createElement('button');
  button.type = 'button';
  button.className = 'attendance-state-btn';
  button.dataset.state = state;
  button.textContent = state === 'attended' ? '✓' : state === 'absent' ? '—' : '?';
  button.setAttribute('aria-label', `${label}: ${state}`);
  button.setAttribute('aria-pressed', String(current === state));
  button.title = state[0].toUpperCase() + state.slice(1);
  button.addEventListener('click', () => onSelect(state, button));
  return button;
}

function renderEvent(doc, event, rows, saveAttendance) {
  const eventEl = doc.createElement('section');
  eventEl.className = 'attendance-event';

  const heading = doc.createElement('div');
  heading.className = 'attendance-event-heading';
  const title = doc.createElement('h4');
  title.textContent = eventHeading(event);
  heading.append(title);
  eventEl.append(heading);

  const roster = doc.createElement('div');
  roster.className = 'attendance-roster';

  for (const { emailKey, reg } of rows) {
    const row = doc.createElement('div');
    row.className = 'attendance-person';
    const identity = doc.createElement('div');
    identity.className = 'attendance-person-name';
    identity.textContent = reg.name || reg.email || '(unknown participant)';
    if (reg.name && reg.email) {
      const email = doc.createElement('span');
      email.textContent = reg.email;
      identity.append(email);
    }

    const controls = doc.createElement('div');
    controls.className = 'attendance-state';
    controls.setAttribute('role','group');
    controls.setAttribute('aria-label', `Attendance for ${reg.name || reg.email || 'participant'} at ${eventHeading(event)}`);

    const current = attendanceState(reg.attendance?.[event.key]);
    const participantLabel = reg.name || reg.email || 'Participant';

    const apply = async (state, clicked) => {
      const previous = attendanceState(reg.attendance?.[event.key]);
      const value = state === 'attended' ? true : state === 'absent' ? false : null;
      [...controls.querySelectorAll('button')].forEach(button => { button.disabled = true; });
      try {
        await saveAttendance(emailKey, event.key, value);
        reg.attendance ||= {};
        if (value === null) delete reg.attendance[event.key];
        else reg.attendance[event.key] = value;
        [...controls.querySelectorAll('button')].forEach(button => {
          button.setAttribute('aria-pressed', String(button.dataset.state === state));
        });
      } catch (error) {
        console.error('Attendance save failed', error);
        [...controls.querySelectorAll('button')].forEach(button => {
          button.setAttribute('aria-pressed', String(button.dataset.state === previous));
        });
        const status = row.querySelector('.attendance-save-status');
        status.textContent = 'Could not save';
      } finally {
        [...controls.querySelectorAll('button')].forEach(button => { button.disabled = false; });
        clicked.focus();
      }
    };

    controls.append(
      makeStateButton(doc, participantLabel, 'attended', current, apply),
      makeStateButton(doc, participantLabel, 'absent', current, apply),
      makeStateButton(doc, participantLabel, 'unrecorded', current, apply)
    );

    const legend = doc.createElement('span');
    legend.className = 'attendance-state-legend';
    legend.textContent = '✓ Attended  ·  — Absent  ·  ? Unrecorded';

    const status = doc.createElement('span');
    status.className = 'attendance-save-status';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');

    row.append(identity, controls, legend, status);
    roster.append(row);
  }

  eventEl.append(roster);
  return eventEl;
}

function renderGroup(doc, group, rows, saveAttendance, { open = false, current = false } = {}) {
  const details = doc.createElement('details');
  details.className = 'attendance-session';
  details.open = open;
  if (current) details.classList.add('attendance-session-current');

  const summary = doc.createElement('summary');
  const num = /^s(\d+)$/.exec(group.parent)?.[1];
  const heading = doc.createElement('span');
  heading.className = 'attendance-session-heading';
  heading.innerHTML = `${num != null ? `<span class="attendance-session-number">Session ${Number(num)}</span>` : ''}<strong></strong>`;
  heading.querySelector('strong').textContent = group.title;
  const meta = doc.createElement('span');
  meta.className = 'attendance-session-meta';
  meta.textContent = current ? 'Current / next' : `${group.events.length} event${group.events.length === 1 ? '' : 's'}`;
  summary.append(heading, meta);
  details.append(summary);

  const body = doc.createElement('div');
  body.className = 'attendance-session-body';
  for (const event of group.events) body.append(renderEvent(doc, event, rows, saveAttendance));
  details.append(body);
  return details;
}

export function renderAttendanceEditor(root, {
  seminarId,
  events,
  participants,
  onSetAttendance,
  now = Date.now()
}) {
  root.replaceChildren();
  root.classList.add('attendance-editor');

  if (!participants.length) {
    const empty = root.ownerDocument.createElement('p');
    empty.className = 'attendance-empty';
    empty.textContent = 'No enrolled participants yet.';
    root.append(empty);
    return;
  }
  if (!events.length) {
    const empty = root.ownerDocument.createElement('p');
    empty.className = 'attendance-empty';
    empty.textContent = 'No attendance events are scheduled for this seminar yet.';
    root.append(empty);
    return;
  }

  const doc = root.ownerDocument;
  const groups = groupAttendanceEvents(events);
  const currentIndex = operationalGroupIndex(groups, now);
  const saveAttendance = (emailKey, eventKey, value) =>
    onSetAttendance(emailKey, seminarId, eventKey, value);

  if (currentIndex >= 0) {
    const currentLabel = doc.createElement('p');
    currentLabel.className = 'attendance-section-label';
    currentLabel.textContent = 'Current / next session';
    root.append(currentLabel, renderGroup(doc, groups[currentIndex], participants, saveAttendance, { open:true, current:true }));
  }

  const past = groups.filter((_, index) => currentIndex < 0 || index < currentIndex);
  const upcoming = currentIndex >= 0 ? groups.filter((_, index) => index > currentIndex) : [];

  if (past.length) {
    const history = doc.createElement('details');
    history.className = 'attendance-history';
    const summary = doc.createElement('summary');
    summary.textContent = currentIndex >= 0 ? `Past sessions · ${past.length}` : `Attendance history · ${past.length} sessions`;
    history.append(summary);
    const body = doc.createElement('div');
    body.className = 'attendance-history-body';
    for (const group of past) body.append(renderGroup(doc, group, participants, saveAttendance));
    history.append(body);
    root.append(history);
  }

  if (upcoming.length) {
    const future = doc.createElement('details');
    future.className = 'attendance-history attendance-upcoming';
    const summary = doc.createElement('summary');
    summary.textContent = `Upcoming sessions · ${upcoming.length}`;
    future.append(summary);
    const body = doc.createElement('div');
    body.className = 'attendance-history-body';
    for (const group of upcoming) body.append(renderGroup(doc, group, participants, saveAttendance));
    future.append(body);
    root.append(future);
  }
}
