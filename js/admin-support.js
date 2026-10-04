import { auth, onAuthStateChanged, ADMIN_EMAIL, SEMINAR_TITLES, sendPasswordReset } from './academy-auth.js?v=27';
import { staffCall, staffError } from './staff-api.js';
import { readView, writeView } from './view-cache.js';
const el=id=>document.getElementById(id);
const escape=value=>{const span=document.createElement('span');span.textContent=value ?? '';return span.innerHTML;};
let generation=0, account=null;
const humanProvider=id=>({'google.com':'Google',password:'Email'}[id] || id);
el('assignSeminar').innerHTML=Object.entries(SEMINAR_TITLES).map(([id,title])=>`<option value="${id}">${escape(title)}</option>`).join('');
async function instructors() {
  const request=generation;
  try {
    const staff=await staffCall('adminListInstructors');
    if(request!==generation)return;
    renderInstructors(staff);
    if(auth.currentUser)writeView('admin-instructors',auth.currentUser.uid,staff);
  } catch(error) { if(request===generation)el('assignmentStatus').textContent=staffError(error); }
}
// the list of teaching assignments, from the staff service or this browser's last copy of it
function renderInstructors(staff) {
    el('instructorList').replaceChildren();
    for(const [id,users] of Object.entries(staff)) for(const [uid,record] of Object.entries(users)) {
      const row=document.createElement('div');row.className='staff-row';
      row.innerHTML=`<p>${escape(SEMINAR_TITLES[id] || id)} · <strong>${record.role === 'ta' ? 'Teaching Assistant' : 'Instructor'}</strong> · ${escape(record.email || uid)}</p>`;
      const button=document.createElement('button');button.textContent='Revoke teaching access';
      button.onclick=async()=>{ if(!confirm(`Revoke ${record.email || uid}’s teaching access to ${SEMINAR_TITLES[id] || id}?`))return;button.disabled=true;try{await staffCall('adminRevokeInstructor',{seminarId:id,uid});await instructors();}catch(error){el('assignmentStatus').textContent=staffError(error);button.disabled=false;} };
      row.append(button);el('instructorList').append(row);
    }
    if(!el('instructorList').children.length)el('instructorList').textContent='No instructors assigned.';
}
{ const cached=readView('admin-instructors'); if(cached?.data)renderInstructors(cached.data); }
el('accountLookup').onsubmit=async event=>{
  event.preventDefault();const request=++generation;account=null;el('assignInstructor').disabled=true;el('accountSupportResult').replaceChildren();el('supportStatus').textContent='Looking up account…';
  const button=el('accountLookup').querySelector('button');button.disabled=true;
  try {
    const result=await staffCall('adminGetAuthSummary',{email:el('supportEmail').value});
    if(request!==generation)return;
    account=result.account;
    el('supportStatus').textContent='';
    const root=el('accountSupportResult');
    const summary=document.createElement('div');summary.className='staff-row';
    summary.innerHTML=`<h3>${account?'Auth account exists':'No Auth account found'}</h3><p>${escape(result.email)}</p>`;
    if(account) {
      summary.insertAdjacentHTML('beforeend',`<p>Firebase UID: ${escape(account.uid)}</p><p>Sign-in method: ${escape(account.providers.map(humanProvider).join(', ') || 'Unknown')}</p><p>Email verified: ${account.emailVerified?'Yes':'No'} · Disabled: ${account.disabled?'Yes':'No'}</p><p>Created: ${escape(account.createdAt || 'Unknown')}<br>Last sign-in: ${escape(account.lastSignInAt || 'Not recorded')}</p><p>Password status: ${escape(account.passwordStatus)}</p>`);
      if(account.providers.includes('google.com'))summary.insertAdjacentHTML('beforeend','<p>Use Continue with Google on the Academy account page with this email address.</p>');
      if(account.providers.includes('password')) {
        summary.insertAdjacentHTML('beforeend','<p>Use your email and password, or Set or reset a password to establish a new password. The participant chooses it privately.</p>');
        const reset=document.createElement('button');reset.textContent='Send password setup/reset link';
        reset.onclick=async()=>{reset.disabled=true;try{await sendPasswordReset(result.email);el('supportStatus').textContent='Password setup/reset email requested. Ask the participant to check their inbox and spam folder.';}catch{el('supportStatus').textContent='Could not send the reset email. Please try again.';}finally{reset.disabled=false;}};
        summary.append(reset);
      }
      el('assignInstructor').disabled=account.disabled;
      el('assignmentAccount').textContent=`Selected account: ${result.email} (${account.uid})`;
    } else { summary.insertAdjacentHTML('beforeend','<p>A registration does not create an Auth account. Ask this participant to use Create account or Continue with Google with their registration email. Older registrations require verified identity before access.</p>');el('assignmentAccount').textContent='Look up an existing Auth account before granting teaching access.'; }
    summary.insertAdjacentHTML('beforeend',`<h3>${result.registrations.length?'Registration exists':'No registrations found'}</h3>`);
    for(const reg of result.registrations)summary.insertAdjacentHTML('beforeend',`<p>${escape(SEMINAR_TITLES[reg.seminarId] || reg.seminarId)} · ${escape(reg.name)} · ${reg.enrolled?'Enrolled':'Not enrolled'}</p>`);
    root.append(summary); await instructors();
  }catch(error){if(request===generation)el('supportStatus').textContent=staffError(error);}finally{button.disabled=false;}
};
el('instructorAssignment').onsubmit=async event=>{
  event.preventDefault();if(!account)return;const button=el('assignInstructor');button.disabled=true;
  try{await staffCall('adminAssignInstructor',{seminarId:el('assignSeminar').value,uid:account.uid,role:el('assignRole').value});el('assignmentStatus').textContent='Teaching access granted.';await instructors();}
  catch(error){el('assignmentStatus').textContent=staffError(error);}finally{button.disabled=false;}
};
onAuthStateChanged(auth,user=>{
  generation++;account=null;el('accountSupportResult').replaceChildren();el('assignInstructor').disabled=true;
  if(!(user?.email===ADMIN_EMAIL && user.emailVerified))el('instructorList').replaceChildren();
  el('accountAssistance').hidden=!(user?.email===ADMIN_EMAIL && user.emailVerified);
  if(!el('accountAssistance').hidden)instructors();
});
