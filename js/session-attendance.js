import { SCREENING_WINDOW_MS } from './seminar-data.js';
import { attendanceColumns, DAY } from './attendance-columns.js';
import { staffCall, staffError } from './staff-api.js';

// Attendance for staff (the profile's Teaching tab and Admin): one table, participants down the left, every meeting
// across the top in order (js/attendance-columns.js). It opens scrolled to the current meeting, highlighted, as far
// left as it goes. Each cell is present or absent. A teaching assistant sees a screening by its session's title until
// the syllabus reveals the film.

export function renderSessionAttendance(root, seminarId, rows, { admin = false, ta = false, onAccessChanged = () => {}, now = Date.now() } = {}) {
  root.replaceChildren(); root.classList.add('session-attendance');
  const participants = rows.filter(row => admin || row.registration.enrolled === true)
    .sort((a, b) => (a.registration.name || a.registration.email || '').localeCompare(b.registration.name || b.registration.email || ''));
  const columns = attendanceColumns(seminarId, { now, ta });
  if (!columns.length || !participants.length) { root.textContent = !columns.length ? 'Attendance events have not been scheduled for this seminar.' : 'No enrolled participants.'; return; }

  const status = document.createElement('p'); status.className = 'staff-note attendance-status'; status.setAttribute('role', 'status');
  const scroller = document.createElement('div'); scroller.className = 'attendance-scroll'; scroller.tabIndex = 0;
  scroller.setAttribute('role', 'region'); scroller.setAttribute('aria-label', 'Attendance, scrolls sideways');
  const table = document.createElement('table'); table.className = 'attendance-table';
  // two header rows: each meeting (kicker, title, date), then its tally and All present, so those line up across
  const thead = table.createTHead(), head = thead.insertRow(), actions = thead.insertRow(), body = table.createTBody();
  head.className = 'attendance-meetings'; actions.className = 'attendance-actions';
  const corner = document.createElement('th'); corner.scope = 'col'; corner.rowSpan = 2; corner.className = 'attendance-name'; corner.textContent = 'Participant'; head.append(corner);

  const value = (row, column) => row.registration.attendance?.[column.event.key] ?? null;
  const tallies = new Map();
  const tally = column => { const node = tallies.get(column); if (node) node.textContent = `${participants.filter(row => value(row, column) === true).length} of ${participants.length} present`; };
  const boxes = new Map(columns.map(column => [column, []]));
  const save = async (operation, data, inputs, apply, revert) => {
    inputs.forEach(input => { input.disabled = true; }); status.textContent = 'Saving…';
    try { await staffCall(operation, data); apply(); status.textContent = 'Saved.'; }
    catch (error) {
      revert(); status.textContent = staffError(error);
      if (['functions/permission-denied', 'functions/unauthenticated'].includes(error.code)) onAccessChanged();
    } finally { inputs.forEach(input => { input.disabled = false; }); }
  };

  for (const column of columns) {
    const th = document.createElement('th'); th.scope = 'col'; th.className = 'attendance-col is-' + column.state;
    th.dataset.event = column.event.key;
    const flag = column.state === 'current' ? `<span class="attendance-now">${column.end !== null && now >= (column.end - (column.event.type === 'screening' ? SCREENING_WINDOW_MS : DAY)) ? 'Now' : 'Next'}</span>` : '';
    th.innerHTML = `<span class="attendance-kicker"></span><span class="attendance-title"></span><span class="attendance-when"><span class="attendance-date"></span>${flag}</span>`;
    // the kicker breaks only between its parts ("Session 6 · / Screening 4"), never inside one
    const kicker = th.querySelector('.attendance-kicker');
    column.kicker.split(' · ').forEach((part, index) => {
      if (index) kicker.append(' · ');
      const piece = document.createElement('span'); piece.textContent = part; kicker.append(piece);
    });
    th.querySelector('.attendance-title').textContent = column.title;
    th.querySelector('.attendance-date').textContent = column.date;
    const act = document.createElement('td'); act.className = 'attendance-act is-' + column.state;
    act.innerHTML = '<span class="attendance-tally"></span>';
    tallies.set(column, act.querySelector('.attendance-tally'));
    const all = document.createElement('button'); all.type = 'button'; all.className = 'attendance-all'; all.textContent = 'All present';
    all.setAttribute('aria-label', `Mark everyone present: ${column.title}, ${column.date}`);
    all.onclick = () => {
      const before = new Map(participants.map(row => [row, value(row, column)]));
      save('staffMarkAllAttended', { seminarId, eventKey: column.event.key, emailKeys: participants.map(row => row.emailKey) }, [all, ...boxes.get(column)],
        () => { participants.forEach(row => { (row.registration.attendance ||= {})[column.event.key] = true; }); boxes.get(column).forEach(box => { box.checked = true; }); tally(column); },
        () => { participants.forEach(row => { box(row, column).checked = before.get(row) === true; }); });
    };
    act.append(all); head.append(th); actions.append(act);
  }

  const inputs = new Map();
  const box = (row, column) => inputs.get(row.emailKey + '|' + column.event.key);
  for (const row of participants) {
    const tr = body.insertRow();
    const name = document.createElement('th'); name.scope = 'row'; name.className = 'attendance-name';
    const who = row.registration.name || row.registration.email || '(unnamed participant)';
    name.textContent = who; tr.append(name);
    if (admin && row.registration.enrolled !== true) {   // Admin lists every registration; say which aren't enrolled
      const flag = document.createElement('span'); flag.className = 'attendance-flag';
      flag.textContent = row.registration.enrolled === false ? 'Unenrolled' : 'Pending'; name.append(flag);
    }
    for (const column of columns) {
      const td = tr.insertCell(); td.className = 'attendance-cell is-' + column.state;
      const input = document.createElement('input'); input.type = 'checkbox'; input.className = 'attendance-check';
      input.checked = value(row, column) === true;
      input.setAttribute('aria-label', `${who}, present at ${column.title} (${column.date})`);
      input.onchange = () => {
        const present = input.checked;
        save('staffSetAttendance', { seminarId, emailKey: row.emailKey, eventKey: column.event.key, attended: present }, [input],
          () => { (row.registration.attendance ||= {})[column.event.key] = present; tally(column); },
          () => { input.checked = !present; });
      };
      inputs.set(row.emailKey + '|' + column.event.key, input); boxes.get(column).push(input);
      td.append(input);
    }
  }
  columns.forEach(tally);
  scroller.append(table); root.append(status, scroller);

  // open on the current meeting: its column as far left as it goes, just right of the names. Near the end of the
  // table, where it can't go all the way, the view starts on a whole column rather than a sliver under the names.
  // The table may be drawn while its tab is hidden, so this waits for a size; and it keeps the place through resizes
  // (a phone turned, a window narrowed) until someone scrolls the table themselves.
  const current = table.querySelector('th.is-current');
  if (current) {
    let kept = true;
    const starts = [...head.querySelectorAll('th.attendance-col')];
    const place = () => {
      if (!kept || !scroller.clientWidth) return;
      const want = Math.min(current.offsetLeft - corner.offsetWidth, scroller.scrollWidth - scroller.clientWidth);
      scroller.scrollLeft = Math.max(0, ...starts.map(th => th.offsetLeft - corner.offsetWidth).filter(left => left <= want + 1));
    };
    for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown']) scroller.addEventListener(type, () => { kept = false; }, { passive: true, once: true });
    place();
    if ('ResizeObserver' in window) {
      const watch = new ResizeObserver(() => { if (!scroller.isConnected || !kept) watch.disconnect(); else place(); });
      watch.observe(scroller);
    }
  }
}
