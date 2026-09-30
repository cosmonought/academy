import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACADEMY_SEMINAR_POLICY_VERSION } from '../js/seminar-policies.js';
import { createStaffService } from '../functions/staff-service.js';
import { readFile } from 'node:fs/promises';
const seminar='sex-and-or-love', graphic='sex-monsters-superheroes', participant='p@example,org';
function fixture(options = {}) {
  const data={ seminarStaff:{[seminar]:{teacher:{role:'instructor'}}}, academyRegistrations:{[participant]:{[seminar]:{email:'p@example.org',name:'Participant',accountUid:'p',enrolled:true,attendance:{}},[graphic]:{email:'p@example.org',name:'Participant',enrolled:true,policyAccepted:true,policyVersion:ACADEMY_SEMINAR_POLICY_VERSION,policyAcceptedAt:1}}}, evaluations:{[participant]:{[graphic]:{request:{form:'essay',accountUid:'p'}}}}, accountMeta:{[participant]:{displayName:'P'}}, accountSeminarInterests:{[participant]:{keep:true}} };
  const users={ teacher:{uid:'teacher',email:'teacher@example.org'},p:{uid:'p',email:'p@example.org',emailVerified:true,providerData:[{providerId:'google.com'}],metadata:{creationTime:'date',lastSignInTime:'date'},passwordHash:'SECRET',tokens:'SECRET'},admin:{uid:'admin',email:'academy@netadao.org',emailVerified:true} };
  const get=path=>path.split('/').filter(Boolean).reduce((v,k)=>v?.[k],data) ?? null;
  const put=(path,value)=>{const parts=path.split('/');const last=parts.pop();let object=data;for(const part of parts)object=object[part]??={};if(value===null)delete object[last];else object[last]=structuredClone(value);};
  const db={ref:(path='')=>({get:async()=>({val:()=>structuredClone(path?get(path):data)}),set:async value=>put(path,value),transaction:async fn=>{const next=fn(structuredClone(data));for(const k of Object.keys(data))delete data[k];Object.assign(data,next);return {committed:true};},update:async values=>{for(const [k,v]of Object.entries(values))put(path?path+'/'+k:k,v);}})};
  const auth={getUser:async uid=>{if(!users[uid])throw Object.assign(new Error(),{code:'auth/user-not-found'});return users[uid];},getUserByEmail:async email=>{const user=Object.values(users).find(u=>u.email===email);if(!user)throw Object.assign(new Error(),{code:'auth/user-not-found'});return user;}};
  const call=(uid,extra={})=>({auth:{uid,token:{email:users[uid]?.email,email_verified:users[uid]?.emailVerified}},data:{seminarId:seminar,emailKey:participant,...extra}});
  return {service:createStaffService({db,auth,...options}),data,users,call};
}
const denied=promise=>assert.rejects(promise,{code:'permission-denied'});
test('all operations require authentication; participant has no staff authority',async()=>{
  const {service,call}=fixture();
  for(const fn of Object.values(service))await assert.rejects(fn({data:{}}),{code:'unauthenticated'});
  for(const name of ['getTeachingRoster','staffSetEnrollment','staffSetAttendance','staffSetEvaluation','adminGetAuthSummary','adminListInstructors','adminAssignInstructor','adminRevokeInstructor','adminDeleteRegistration'])await denied(service[name](call('p')));
});
test('UID assignments; only assigned roster returned; instructor can also attend',async()=>{
  const {service,data,call}=fixture();data.academyRegistrations['teacher@example,org']={[graphic]:{name:'Teacher as participant'}};
  assert.deepEqual(await service.getTeachingAssignments(call('teacher')),[seminar]);
  const rows=await service.getTeachingRoster(call('teacher'));assert.equal(rows.length,1);assert.equal(rows[0].registration.email,'p@example.org');assert.deepEqual(rows[0].evaluation,{});
  await denied(service.getTeachingRoster(call('teacher',{seminarId:graphic})));
});
test('enrollment preserves history and permits re-enrollment; revocation immediately blocks operations',async()=>{
  const {service,data,call}=fixture();data.academyRegistrations[participant][seminar].attendance={'lecture-s0':true};
  await service.staffSetEnrollment(call('teacher',{enrolled:false}));assert.equal(data.academyRegistrations[participant][seminar].attendance['lecture-s0'],true);
  await assert.rejects(service.staffSetAttendance(call('teacher',{eventKey:'lecture-s0',attended:true})),{code:'failed-precondition'});
  await service.staffSetEnrollment(call('teacher',{enrolled:true}));
  delete data.seminarStaff[seminar].teacher;
  for(const name of ['getTeachingRoster','staffSetEnrollment','staffSetAttendance','staffSetEvaluation'])await denied(service[name](call('teacher')));
});
test('attendance validates real events, scope, boolean type, and path keys',async()=>{
  const {service,data,call}=fixture();
  for(const eventKey of ['lecture-s0','screening-mother'])await service.staffSetAttendance(call('teacher',{eventKey,attended:true}));
  assert.equal(Object.keys(data.academyRegistrations[participant][seminar].attendance).length,2);
  for(const extra of [{eventKey:'s0',attended:true},{eventKey:'lecture-s0',attended:'true'},{emailKey:'../other'}])await assert.rejects(service.staffSetAttendance(call('teacher',extra)),{code:'invalid-argument'});
  await denied(service.staffSetAttendance(call('teacher',{seminarId:graphic,eventKey:'lecture-s0',attended:true})));
});
test('evaluation writes instructor fields only and supports agreed, in-progress, completed',async()=>{
  const {service,data,call}=fixture();data.seminarStaff[graphic]={teacher:{role:'instructor'}};
  for(const state of ['agreed','in-progress','completed']) {
    const record={state,form:'essay',feedback:'Substantive feedback'};if(state==='completed')record.outcome='distinction';
    await service.staffSetEvaluation(call('teacher',{seminarId:graphic,record}));
  }
  assert.equal(data.evaluations[participant][graphic].request.accountUid,'p');
  for(const record of [{state:'completed',form:'essay',feedback:''},{state:'agreed',form:'essay',feedback:'',request:{}},{state:'agreed',form:'essay',feedback:'',outcome:'merit'}])await assert.rejects(service.staffSetEvaluation(call('teacher',{seminarId:graphic,record})),{code:'invalid-argument'});
  delete data.seminarStaff[graphic];await denied(service.staffSetEvaluation(call('teacher',{seminarId:graphic})));
});
test('admin deletion is confirmed, narrow, and unavailable to instructors',async()=>{
  const {service,data,call}=fixture();
  await denied(service.adminDeleteRegistration(call('teacher')));
  await assert.rejects(service.adminDeleteRegistration(call('admin')),{code:'failed-precondition'});
  await service.adminDeleteRegistration(call('admin',{seminarId:graphic,confirm:`${participant}/${graphic}`}));
  assert.equal(data.academyRegistrations[participant][graphic],undefined);assert.equal(data.evaluations[participant][graphic],undefined);
  assert.ok(data.academyRegistrations[participant][seminar]);assert.ok(data.accountMeta[participant]);assert.ok(data.accountSeminarInterests[participant]);
});
test('admin assignment resolves a real Auth UID and revokes just that seminar',async()=>{
  const {service,data,call}=fixture();
  await service.adminAssignInstructor(call('admin',{seminarId:graphic,uid:'teacher'}));assert.equal(data.seminarStaff[graphic].teacher.assignedBy,'admin');
  await service.adminRevokeInstructor(call('admin',{seminarId:graphic,uid:'teacher'}));assert.ok(data.seminarStaff[seminar].teacher);
  await assert.rejects(service.adminAssignInstructor(call('admin',{uid:'imaginary'})),{code:'auth/user-not-found'});
});
test('safe Auth summaries distinguish provider, missing account, missing registration, and legacy uncertainty',async()=>{
  const {service,data,users,call}=fixture();
  let result=await service.adminGetAuthSummary(call('admin',{email:'p@example.org'}));assert.ok(result.account);assert.equal(result.registrations.length,2);assert.ok(!JSON.stringify(result).includes('SECRET'));assert.deepEqual(result.account.providers,['google.com']);
  users.p.providerData=[{providerId:'password'}];result=await service.adminGetAuthSummary(call('admin',{email:'p@example.org'}));assert.equal(result.account.passwordStatus,'Unknown / legacy account');
  delete users.p;result=await service.adminGetAuthSummary(call('admin',{email:'p@example.org'}));assert.equal(result.account,null);assert.equal(result.registrations.length,2);
  result=await service.adminGetAuthSummary(call('admin',{email:'missing@example.org'}));assert.equal(result.account,null);assert.equal(result.registrations.length,0);
});
test('unverified administrator and disabled instructor fail closed',async()=>{
  const {service,users,call}=fixture();users.admin.emailVerified=false;await denied(service.adminListInstructors(call('admin')));users.teacher.disabled=true;await assert.rejects(service.getTeachingAssignments(call('teacher')),{code:'unauthenticated'});
});
test('deployment attendance catalog exactly matches browser source',async()=>{
  for(const file of ['academy-record.js','seminar-data.js','seminar-policies.js'])assert.equal(await readFile('functions/shared/'+file,'utf8'),await readFile('js/'+file,'utf8'));
});

test('administrator retains global enrollment and historical evaluation correction',async()=>{
  const {service,data,call}=fixture();
  for(const enrolled of [false,true,false])await service.staffSetEnrollment(call('admin',{seminarId:graphic,enrolled}));
  await service.staffSetEvaluation(call('admin',{seminarId:graphic,record:{state:'completed',form:'essay',feedback:'Correction',outcome:'completed'}}));
  assert.equal(data.evaluations[participant][graphic].instructor.feedback,'Correction');
  assert.deepEqual(await service.getTeachingAssignments(call('admin')),[]);
});

test('staff enrollment preserves the current Graphic policy requirement',async()=>{
  const {service,data,call}=fixture();data.seminarStaff[graphic]={teacher:{role:'instructor'}};
  delete data.academyRegistrations[participant][graphic].policyAccepted;
  await assert.rejects(service.staffSetEnrollment(call('teacher',{seminarId:graphic,enrolled:true})),{code:'failed-precondition'});
  await service.staffSetEnrollment(call('admin',{seminarId:graphic,enrolled:false}));
});

test('bulk attendance is atomic, scoped, enrolled-only for instructors, and preserves other records',async()=>{
 const {service,data,call}=fixture();
 const before=structuredClone(data);
 await assert.rejects(service.staffMarkAllAttended(call('teacher',{eventKey:'lecture-s0',emailKeys:[participant,'missing@example,org']})),{code:'failed-precondition'});
 assert.deepEqual(data,before);
 await denied(service.staffMarkAllAttended(call('p',{eventKey:'lecture-s0',emailKeys:[participant]})));
 await denied(service.staffMarkAllAttended(call('teacher',{seminarId:graphic,eventKey:'lecture-s0',emailKeys:[participant]})));
 await service.staffMarkAllAttended(call('teacher',{eventKey:'screening-mother',emailKeys:[participant]}));
 assert.equal(data.academyRegistrations[participant][seminar].attendance['screening-mother'],true);
 assert.deepEqual(data.academyRegistrations[participant][graphic],before.academyRegistrations[participant][graphic]);
 data.academyRegistrations[participant][seminar].enrolled=false;
 await assert.rejects(service.staffMarkAllAttended(call('teacher',{eventKey:'lecture-s0',emailKeys:[participant]})),{code:'failed-precondition'});
 await service.staffMarkAllAttended(call('admin',{eventKey:'lecture-s0',emailKeys:[participant]}));
 await service.staffSetAttendance(call('admin',{eventKey:'lecture-s0',attended:null}));
 assert.equal(data.academyRegistrations[participant][seminar].attendance['lecture-s0'],undefined);
});
test('participant evaluation enforces enabled state, canonical attendance, ownership and explicit cutoff',async()=>{
 const cutoff='2030-01-01T00:00:00Z';let clock=Date.parse(cutoff)-1;
 const {service,data,call}=fixture({evaluationConfig:{[seminar]:{enabled:true,minimumAttendanceEvents:1,requestCutoff:cutoff}},now:()=>clock});
 const request=extra=>call('p',{optIn:true,form:'essay',...extra});
 await assert.rejects(service.participantSetEvaluationRequest(request({seminarId:graphic})),{code:'failed-precondition'});
 data.academyRegistrations[participant][seminar].attendance={s0:true};
 await assert.rejects(service.participantSetEvaluationRequest(request()),{code:'failed-precondition'});
 data.academyRegistrations[participant][seminar].attendance['lecture-s0']=true;
 await service.participantSetEvaluationRequest(request());
 assert.equal(data.evaluations[participant][seminar].request.accountUid,'p');
 data.evaluations[participant][seminar].instructor={state:'agreed',form:'essay',feedback:'Keep this'};
 await service.participantSetEvaluationRequest(request({optIn:false}));
 assert.equal(data.evaluations[participant][seminar].request,undefined);
 assert.equal(data.evaluations[participant][seminar].instructor.feedback,'Keep this');
 await service.participantSetEvaluationRequest(request());
 clock=Date.parse(cutoff);
 for(const optIn of [true,false])await assert.rejects(service.participantSetEvaluationRequest(request({optIn})),{code:'failed-precondition'});
 const reg=data.academyRegistrations[participant][seminar];reg.accountUid='somebody-else';
 await denied(service.participantSetEvaluationRequest(request()));
});
test('old policy assent cannot authorize enrollment under revised policy',async()=>{
 const {service,data,call}=fixture();data.academyRegistrations[participant][graphic].policyVersion='2026-09-29';
 await assert.rejects(service.staffSetEnrollment(call('admin',{seminarId:graphic,enrolled:true})),{code:'failed-precondition'});
 assert.equal(data.academyRegistrations[participant][graphic].policyVersion,'2026-09-29');
});

test('staff can correct evaluation participation after cutoff only inside assigned scope',async()=>{
 const {service,data,call}=fixture({evaluationConfig:{[seminar]:{enabled:true,minimumAttendanceEvents:1,requestCutoff:'2000-01-01T00:00:00Z'}}});
 await denied(service.staffSetEvaluationRequest(call('p',{optIn:true,form:'essay'})));
 await service.staffSetEvaluationRequest(call('teacher',{optIn:true,form:'essay'}));
 assert.equal(data.evaluations[participant][seminar].request.accountUid,'p');
 await service.staffSetEvaluationRequest(call('admin',{optIn:false}));
 assert.equal(data.evaluations[participant][seminar].request,undefined);
 delete data.seminarStaff[seminar].teacher;
 await denied(service.staffSetEvaluationRequest(call('teacher',{optIn:true,form:'essay'})));
});

 test('completed evaluation blocks participant changes before cutoff while Admin can correct participation',async()=>{
 const {service,data,call}=fixture({evaluationConfig:{[seminar]:{enabled:true,minimumAttendanceEvents:1,requestCutoff:null}}});
 data.academyRegistrations[participant][seminar].attendance={'lecture-s0':true};
 const instructor={state:'completed',form:'essay',outcome:'completed',feedback:'Historical feedback'};
 data.evaluations[participant][seminar]={request:{form:'essay',accountUid:'p',requestedAt:1},instructor};
 const original=structuredClone(data.evaluations[participant][seminar]);
 for(const optIn of [false,true]) {
  await assert.rejects(service.participantSetEvaluationRequest(call('p',{optIn,form:'presentation'})),{code:'failed-precondition'});
  assert.deepEqual(data.evaluations[participant][seminar],original);
 }
 await service.staffSetEvaluationRequest(call('admin',{optIn:false}));
 assert.equal(data.evaluations[participant][seminar].request,undefined);
 assert.deepEqual(data.evaluations[participant][seminar].instructor,instructor);
 await service.staffSetEvaluationRequest(call('admin',{optIn:true,form:'essay'}));
 assert.equal(data.evaluations[participant][seminar].request.form,'essay');
 assert.deepEqual(data.evaluations[participant][seminar].instructor,instructor);
 await assert.rejects(service.participantSetEvaluationRequest(call('p',{optIn:false})),{code:'failed-precondition'});
 });
