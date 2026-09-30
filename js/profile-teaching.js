import { evaluationParticipationControl } from './evaluation-correction.js';
import { setTeachingAvailable } from './profile-tabs.js';
import { renderSessionAttendance } from './session-attendance.js';
import { auth, onAuthStateChanged, SEMINAR_TITLES, ATTENDANCE_EVENTS, EVALUATION_FORMS, EVALUATION_OUTCOMES, EVALUATION_OFFERED, approveRegistration, revokeRegistration, setAttendance, setInstructorEvaluation } from './academy-auth.js?v=26';
import { staffCall, staffError } from './staff-api.js';
const el = id => document.getElementById(id);
const escape = value => { const span = document.createElement('span'); span.textContent = value ?? ''; return span.innerHTML; };
const options = object => Object.entries(object).map(([key,label]) => `<option value="${escape(key)}">${escape(label)}</option>`).join('');
let assignments = [], current = '', generation = 0, mode = 'attending';
async function refreshAssignments() {
  const request = ++generation, uid = auth.currentUser?.uid;
  el('teachingBody').replaceChildren();
  if (!uid) { assignments = []; setTeachingAvailable(false); return; }
  try {
    const result = await staffCall('getTeachingAssignments');
    if (request !== generation || auth.currentUser?.uid !== uid) return;
    el('teachingAvailability').textContent = '';
    assignments = result; setTeachingAvailable(!!result.length);
    current = result.includes(current) ? current : result[0] || '';
    el('teachingSeminar').innerHTML = options(Object.fromEntries(result.map(id => [id, SEMINAR_TITLES[id]])));
    el('teachingSeminar').value = current; el('teachingSelector').hidden = result.length < 2;
    if (mode === 'teaching') loadRoster();
  } catch {
    if (request !== generation) return;
    assignments = []; setTeachingAvailable(false);
    el('teachingAvailability').textContent = 'Teaching services could not be checked. Refresh the page to retry.';
  }
}
async function run(control, action) {
  control.disabled = true;
  try { await action(); el('teachingStatus').textContent = 'Saved.'; await loadRoster(); }
  catch (error) {
    el('teachingStatus').textContent = staffError(error);
    if (['functions/permission-denied','functions/unauthenticated'].includes(error.code)) { await refreshAssignments(); el('teachingAvailability').textContent = 'Teaching access changed. Your assignments have been refreshed.'; }
  } finally { control.disabled = false; }
}
async function loadRoster() {
  if (!current || !assignments.includes(current)) return;
  const request = ++generation, id = current;
  el('teachingHeading').textContent = SEMINAR_TITLES[id]; el('teachingBody').replaceChildren();
  el('teachingSummary').textContent = 'Loading roster…';
  try {
    const rows = await staffCall('getTeachingRoster', { seminarId:id });
    if (request !== generation || id !== current) return;
    el('teachingSummary').textContent = `${rows.filter(row=>row.registration.enrolled === true).length} enrolled · ${rows.filter(row=>row.registration.enrolled === undefined).length} pending · ${EVALUATION_OFFERED[id] ? rows.filter(row=>row.evaluation.request && row.evaluation.instructor?.state !== 'completed').length : 0} evaluation requests`;
    render(rows,id);
  } catch (error) {
    if (request !== generation) return;
    el('teachingSummary').textContent = staffError(error);
    if (['functions/permission-denied','functions/unauthenticated'].includes(error.code)) await refreshAssignments();
  }
}
function render(rows,id) {
  const root = el('teachingBody');
  root.innerHTML = '<h3>Enrollment</h3><div id="teachingEnrollment"></div><h3>Attendance</h3><div id="teachingAttendance"></div><h3>Evaluation</h3><div id="teachingEvaluation"></div>';
  if (!rows.length) el('teachingEnrollment').textContent = 'No registrations yet.';
  for (const {emailKey,registration:reg} of rows) {
    const row = document.createElement('article'); row.className = 'staff-row';
    row.innerHTML = `<strong>${escape(reg.name || reg.email)}</strong><p>${escape(reg.email)} · ${escape(reg.xHandle)}</p><p>${escape(reg.reason)}</p><p>${reg.enrolled === true ? 'Enrolled' : reg.enrolled === false ? 'Unenrolled' : 'Pending'} · Policy: ${reg.policyAccepted === true ? 'Accepted (' + escape(reg.policyVersion || 'version unavailable') + ')' : 'Not recorded'}</p>`;
    const button = document.createElement('button'); button.textContent = reg.enrolled === true ? 'Unenroll' : 'Enroll';
    button.onclick = () => { if (reg.enrolled === true && !confirm(`Unenroll ${reg.name || reg.email} from ${SEMINAR_TITLES[id]}? Their attendance and evaluation history will be preserved.`)) return; run(button,()=>reg.enrolled === true ? revokeRegistration(emailKey,id) : approveRegistration(emailKey,id,reg.email,reg.name,SEMINAR_TITLES[id])); };
    row.append(button); el('teachingEnrollment').append(row);
  }
  const enrolled = rows.filter(row=>row.registration.enrolled === true);
  renderSessionAttendance(el('teachingAttendance'), id, rows, { onAccessChanged: refreshAssignments });
  const evaluationRoot = el('teachingEvaluation');
  if (!EVALUATION_OFFERED[id]) { evaluationRoot.textContent='Evaluation is not offered for this seminar.'; return; }
  for (const {emailKey,registration:reg,evaluation} of enrolled) {
    const section=document.createElement('section'); section.className='staff-row';
    if (!evaluation.request && !evaluation.instructor) { const name=document.createElement('strong'); name.textContent=reg.name || reg.email; section.append(name); evaluationParticipationControl(section,id,emailKey,evaluation,loadRoster); evaluationRoot.append(section); continue; }
    section.innerHTML=`<strong>${escape(reg.name || reg.email)}</strong><p>Requested: ${escape(EVALUATION_FORMS[evaluation.request?.form] || '—')}</p><form><label>State<select name="state"><option value="agreed">Agreed</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label><label>Agreed form<select name="form">${options(EVALUATION_FORMS)}</select></label><label>Outcome<select name="outcome"><option value="">Pending</option>${options(EVALUATION_OUTCOMES)}</select></label><label style="flex-basis:100%">Written feedback<textarea name="feedback" rows="5" maxlength="10000"></textarea></label><button>Save evaluation</button><span role="status"></span></form>`;
    const form=section.querySelector('form'), field=name=>form.elements.namedItem(name);
    field('state').value=evaluation.instructor?.state || 'agreed'; field('form').value=evaluation.instructor?.form || evaluation.request?.form || 'other'; field('outcome').value=evaluation.instructor?.outcome || ''; field('feedback').value=evaluation.instructor?.feedback || '';
    form.onsubmit=event=> { event.preventDefault(); const record={state:field('state').value,form:field('form').value,feedback:field('feedback').value}; if (record.state === 'completed') { if (!field('outcome').value) { form.querySelector('[role=status]').textContent='Choose an outcome.'; return; } record.outcome=field('outcome').value; } run(form.querySelector('button'),()=>setInstructorEvaluation(emailKey,id,record)); };
    evaluationParticipationControl(section,id,emailKey,evaluation,loadRoster);
    evaluationRoot.append(section);
  }
  if (!evaluationRoot.children.length) evaluationRoot.textContent='No evaluation requests from enrolled participants.';
}
document.addEventListener('profile-tab-change', event => { mode = event.detail; if (mode === 'teaching') loadRoster(); });
el('teachingSeminar').onchange=event=> { current=event.target.value; loadRoster(); };
el('teachingRefresh').onclick=()=>refreshAssignments();
onAuthStateChanged(auth,()=> { mode='seminars'; refreshAssignments(); });
