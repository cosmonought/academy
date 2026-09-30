import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStaffService } from '../functions/staff-service.js';
import { readFile } from 'node:fs/promises';
const seminar='sex-and-or-love', graphic='sex-monsters-superheroes', participant='p@example,org';
function fixture() {
  const data={ seminarStaff:{[seminar]:{teacher:{role:'instructor'}}}, academyRegistrations:{[participant]:{[seminar]:{email:'p@example.org',name:'Participant',enrolled:true,attendance:{}},[graphic]:{email:'p@example.org',name:'Participant',enrolled:true,policyAccepted:true,policyVersion:'2026-09-29',policyAcceptedAt:1}}}, evaluations:{[participant]:{[graphic]:{request:{form:'essay',accountUid:'p'}}}}, accountMeta:{[participant]:{displayName:'P'}}, accountSeminarInterests:{[participant]:{keep:true}} };
  const users={ teacher:{uid:'teacher',email:'teacher@example.org'},p:{uid:'p',email:'p@example.org',emailVerified:true,providerData:[{providerId:'google.com'}],metadata:{creationTime:'date',lastSignInTime:'date'},passwordHash:'SECRET',tokens:'SECRET'},admin:{uid:'admin',email:'academy@netadao.org',emailVerified:true} };
  const get=path=>path.split('/').filter(Boolean).reduce((v,k)=>v?.[k],data) ?? null;
  const put=(path,value)=>{const parts=path.split('/');const last=parts.pop();let object=data;for(const part of parts)object=object[part]??={};if(value===null)delete object[last];else object[last]=structuredClone(value);};
  const db={ref:(path='')=>({get:async()=>({val:()=>structuredClone(path?get(path):data)}),set:async value=>put(path,value),update:async values=>{for(const [k,v]of Object.entries(values))put(path?path+'/'+k:k,v);}})};
  const auth={getUser:async uid=>{if(!users[uid])throw Object.assign(new Error(),{code:'auth/user-not-found'});return users[uid];},getUserByEmail:async email=>{const user=Object.values(users).find(u=>u.email===email);if(!user)throw Object.assign(new Error(),{code:'auth/user-not-found'});return user;}};
  const call=(uid,extra={})=>({auth:{uid,token:{email:users[uid]?.email,email_verified:users[uid]?.emailVerified}},data:{seminarId:seminar,emailKey:participant,...extra}});
  return {service:createStaffService({db,auth}),data,users,call};
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
