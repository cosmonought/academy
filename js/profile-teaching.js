import { evaluationParticipationControl } from './evaluation-correction.js';
import { setTeachingAvailable } from './profile-tabs.js';
import { renderSessionAttendance } from './session-attendance.js';
import { auth, onAuthStateChanged, SEMINAR_TITLES, ATTENDANCE_EVENTS, EVALUATION_FORMS, EVALUATION_OUTCOMES, EVALUATION_OFFERED, approveRegistration, revokeRegistration, setAttendance, setInstructorEvaluation } from './academy-auth.js?v=27';
import { staffCall, staffError } from './staff-api.js';
const el = id => document.getElementById(id);
const escape = value => { const span = document.createElement('span'); span.textContent = value ?? ''; return span.innerHTML; };
const options = object => Object.entries(object).map(([key,label]) => `<option value="${escape(key)}">${escape(label)}</option>`).join('');
let assignments = [], assignmentRoles = {}, current = '', generation = 0, mode = 'attending';
async function refreshAssignments() {
  const request = ++generation, uid = auth.currentUser?.uid;
  el('teachingBody').replaceChildren();
  if (!uid) { assignments = []; assignmentRoles = {}; updateRoleBadge(); setTeachingAvailable(false); return; }
  try {
    const result = await staffCall('getTeachingAssignments');
    const roles = await staffCall('getTeachingAssignmentRoles');
    if (request !== generation || auth.currentUser?.uid !== uid) return;
    el('teachingAvailability').textContent = '';
    assignments = result; assignmentRoles = roles; setTeachingAvailable(!!result.length);
    current = result.includes(current) ? current : result[0] || '';
    el('teachingSeminar').innerHTML = options(Object.fromEntries(result.map(id => [id, SEMINAR_TITLES[id]])));
    el('teachingSeminar').value = current; el('teachingSelector').hidden = result.length < 2;
    updateRoleBadge();
    if (mode === 'teaching') loadRoster();
  } catch {
    if (request !== generation) return;
    assignments = []; assignmentRoles = {}; updateRoleBadge(); setTeachingAvailable(false);
    el('teachingAvailability').textContent = 'Teaching services could not be checked. Refresh the page to retry.';
  }
}
function updateRoleBadge() {
  const role = assignmentRoles[current];
  el('teachingRoleBadge').hidden = !role;
  el('teachingRoleBadge').textContent = role === 'ta' ? 'TA' : 'Instructor';
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
    const isInstructor = assignmentRoles[id] === 'instructor';
    el('teachingSummary').textContent = `${rows.filter(row=>row.registration.enrolled === true).length} enrolled${isInstructor ? ` · ${rows.filter(row=>row.registration.enrolled !== true).length} pending · ${EVALUATION_OFFERED[id] ? rows.filter(row=>row.evaluation.request && row.evaluation.instructor?.state !== 'completed').length : 0} evaluation requests` : ''}`;
    render(rows,id);
  } catch (error) {
    if (request !== generation) return;
    el('teachingSummary').textContent = staffError(error);
    if (['functions/permission-denied','functions/unauthenticated'].includes(error.code)) await refreshAssignments();
  }
}
function render(rows,id) {
  const root = el('teachingBody'), isInstructor = assignmentRoles[id] === 'instructor';
  root.replaceChildren();
  const pending = rows.filter(row=>row.registration.enrolled !== true);
  if (isInstructor && pending.length) {
    const section=document.createElement('section');section.innerHTML='<h3>Pending Enrollments</h3><div></div>';const list=section.lastElementChild;
    for(const {emailKey,registration:reg} of pending){const row=document.createElement('article');row.className='staff-row';const name=document.createElement('strong');name.textContent=reg.name||reg.email||'Pending participant';const email=document.createElement('p');email.textContent=reg.email||'';const button=document.createElement('button');button.textContent='Enroll';button.onclick=()=>run(button,()=>approveRegistration(emailKey,id,reg.email,reg.name,SEMINAR_TITLES[id]));row.append(name,email,button);list.append(row);}
    root.append(section);
  }
  const attendance=document.createElement('section');attendance.innerHTML='<h3>Attendance</h3><div id="teachingAttendance" class="staff-table-scroll"></div>';root.append(attendance);
  renderSessionAttendance(el('teachingAttendance'),id,rows,{onAccessChanged:refreshAssignments});
  const enrolled=rows.filter(row=>row.registration.enrolled===true);
  const participants=document.createElement('section');participants.innerHTML='<h3>Participants</h3><div id="teachingParticipants"></div>';const participantRoot=el('teachingParticipants');root.append(participants);
  if(!enrolled.length)participantRoot.textContent='No enrolled participants.';
  for(const {emailKey,registration:reg} of enrolled){
    const row=document.createElement('details');row.className='staff-participant';const summary=document.createElement('summary');summary.textContent=reg.name||reg.email||'Participant';row.append(summary);
    if(isInstructor){const detail=document.createElement('div');detail.innerHTML=`<p>${escape(reg.email||'')} · ${escape(reg.xHandle||'')}</p><p>${escape(reg.reason||'')}</p>`;const button=document.createElement('button');button.textContent='Unenroll';button.onclick=()=>{if(confirm(`Unenroll ${reg.name||reg.email} from ${SEMINAR_TITLES[id]}? Their attendance and evaluation history will be preserved.`))run(button,()=>revokeRegistration(emailKey,id));};detail.append(button);row.append(detail);}
    participantRoot.append(row);
  }
  if(!isInstructor)return;
  const evaluationRoot=document.createElement('section');evaluationRoot.innerHTML='<h3>Evaluation</h3><div id="teachingEvaluation"></div>';const evaluationList=el('teachingEvaluation');root.append(evaluationRoot);
  if(!EVALUATION_OFFERED[id]){evaluationList.textContent='Evaluation is not offered for this seminar.';return;}
  for(const {emailKey,registration:reg,evaluation} of enrolled){
    const section=document.createElement('section');section.className='staff-row';
    if(!evaluation.request&&!evaluation.instructor){const name=document.createElement('strong');name.textContent=reg.name||reg.email;section.append(name);evaluationParticipationControl(section,id,emailKey,evaluation,loadRoster);evaluationList.append(section);continue;}
    section.innerHTML=`<strong>${escape(reg.name||reg.email)}</strong><p>Requested: ${escape(EVALUATION_FORMS[evaluation.request?.form]||'—')}</p><form><label>State<select name="state"><option value="agreed">Agreed</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label><label>Agreed form<select name="form">${options(EVALUATION_FORMS)}</select></label><label>Outcome<select name="outcome"><option value="">Pending</option>${options(EVALUATION_OUTCOMES)}</select></label><label style="flex-basis:100%">Written feedback<textarea name="feedback" rows="5" maxlength="10000"></textarea></label><button>Save evaluation</button><span role="status"></span></form>`;
    const form=section.querySelector('form'),field=name=>form.elements.namedItem(name);field('state').value=evaluation.instructor?.state||'agreed';field('form').value=evaluation.instructor?.form||evaluation.request?.form||'other';field('outcome').value=evaluation.instructor?.outcome||'';field('feedback').value=evaluation.instructor?.feedback||'';
    form.onsubmit=event=>{event.preventDefault();const record={state:field('state').value,form:field('form').value,feedback:field('feedback').value};if(record.state==='completed'){if(!field('outcome').value){form.querySelector('[role=status]').textContent='Choose an outcome.';return;}record.outcome=field('outcome').value;}run(form.querySelector('button'),()=>setInstructorEvaluation(emailKey,id,record));};
    evaluationParticipationControl(section,id,emailKey,evaluation,loadRoster);evaluationList.append(section);
  }
  if(!evaluationList.children.length)evaluationList.textContent='No evaluation requests from enrolled participants.';
}
document.addEventListener('profile-tab-change', event => { mode = event.detail; if (mode === 'teaching') loadRoster(); });
el('teachingSeminar').onchange=event=> { current=event.target.value; updateRoleBadge(); loadRoster(); };
el('teachingRefresh').onclick=()=>refreshAssignments();
onAuthStateChanged(auth,()=> { mode='seminars'; refreshAssignments(); });
