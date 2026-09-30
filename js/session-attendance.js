import { ATTENDANCE_EVENTS } from './academy-record.js';
import { staffCall, staffError } from './staff-api.js';
export function attendanceSessions(seminarId, now = Date.now()) {
  const groups = new Map();
  for (const event of ATTENDANCE_EVENTS[seminarId] || []) {
    if (!groups.has(event.parent)) groups.set(event.parent, { key:event.parent, events:[] });
    groups.get(event.parent).events.push(event);
  }
  const sessions = [...groups.values()];
  const upcoming = sessions.flatMap(session => session.events.map(event => ({ session, event })))
    .filter(({event}) => event.date && Date.parse(event.date + 'T23:59:59Z') >= now)
    .sort((a,b) => a.event.date.localeCompare(b.event.date));
  const current = upcoming[0]?.session || sessions.at(-1);
  return sessions.map(session => ({ ...session,
    label: `Session ${session.key.slice(1)} — ${(session.events.find(event => event.type !== 'screening') || session.events[0]).label}`,
    category: session === current ? 'current' : session.events.some(event => !event.date || Date.parse(event.date + 'T23:59:59Z') >= now) ? 'upcoming' : 'past'
  }));
}
export function renderSessionAttendance(root, seminarId, rows, { admin = false, onAccessChanged = () => {} } = {}) {
  root.replaceChildren(); root.classList.add('session-attendance');
  const participants = rows.filter(row => admin || row.registration.enrolled === true);
  const sessions = attendanceSessions(seminarId);
  if (!sessions.length || !participants.length) { root.textContent = !sessions.length ? 'Attendance events have not been scheduled for this seminar.' : 'No enrolled participants.'; return; }
  for (const category of ['current','upcoming','past']) {
    const section = document.createElement('section');
    const heading = document.createElement('h4'); heading.textContent = {current:'Current / next session',upcoming:'Upcoming sessions',past:'Past sessions'}[category]; section.append(heading);
    for (const session of sessions.filter(item => item.category === category)) {
      const block = document.createElement(category === 'current' ? 'section' : 'details'); block.className='attendance-session';
      const title = document.createElement(category === 'current' ? 'h5' : 'summary'); title.textContent=session.label; block.append(title);
      for (const event of session.events) {
        const eventBlock = document.createElement('section'); eventBlock.className='attendance-event';
        const label = document.createElement('h6'); label.textContent=`${event.type.toUpperCase()} · ${event.label}`;
        const date = document.createElement('p'); date.className='staff-note'; date.textContent=event.date || 'Date not scheduled';
        const status=document.createElement('p'); status.setAttribute('role','status'); status.className='staff-note';
        const bulk = document.createElement('button'); bulk.type='button'; bulk.textContent='Mark all attended';
        eventBlock.append(label,date,bulk,status);
        const updateState = () => {
          eventBlock.querySelectorAll('[data-mark]').forEach(button => {
            const participant = participants.find(row => row.emailKey === button.dataset.participant);
            const value=participant.registration.attendance?.[event.key] ?? null;
            button.setAttribute('aria-pressed', String(value === JSON.parse(button.dataset.mark)));
          });
        };
        const save = async (operation,data,apply) => {
          eventBlock.querySelectorAll('button').forEach(button=>button.disabled=true); status.textContent='Saving…';
          try { await staffCall(operation,data); apply(); updateState(); status.textContent='Saved.'; }
          catch(error) { status.textContent=staffError(error); if (['functions/permission-denied','functions/unauthenticated'].includes(error.code)) onAccessChanged(); }
          finally { eventBlock.querySelectorAll('button').forEach(button=>button.disabled=false); }
        };
        bulk.onclick=()=>save('staffMarkAllAttended',{seminarId,eventKey:event.key,emailKeys:participants.map(row=>row.emailKey)},()=>participants.forEach(row=>(row.registration.attendance ||= {})[event.key]=true));
        for (const { emailKey,registration:reg } of participants) {
          const line=document.createElement('div'); line.className='attendance-person';
          const name=document.createElement('strong');name.textContent=reg.name || reg.email || emailKey;line.append(name);
          const controls=document.createElement('div'); controls.className='attendance-marks';controls.setAttribute('role','group');controls.setAttribute('aria-label',`${name.textContent}: ${event.type} ${event.label}`);
          for (const [value,symbol,meaning] of [[true,'✓','Attended'],[false,'—','Absent'],[null,'?','Unrecorded']]) {
            const button=document.createElement('button');button.type='button';button.textContent=symbol;button.title=meaning;button.setAttribute('aria-label',meaning);button.dataset.mark=JSON.stringify(value);button.dataset.participant=emailKey;
            button.onclick=()=>save('staffSetAttendance',{seminarId,emailKey,eventKey:event.key,attended:value},()=>{(reg.attendance ||= {})[event.key]=value;});controls.append(button);
          }
          line.append(controls);eventBlock.append(line);
        }
        updateState();block.append(eventBlock);
      }
      section.append(block);
    }
    if (section.children.length > 1) root.append(section);
  }
}
