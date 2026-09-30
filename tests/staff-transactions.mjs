import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createStaffService} from '../functions/staff-service.js';
const require=createRequire(new URL('../functions/index.js',import.meta.url));
const {initializeApp,deleteApp}=require('firebase-admin/app');
const {getDatabase}=require('firebase-admin/database');
let app,db,service;
const seminar='sex-and-or-love',a='a@example,org',b='b@example,org';
const call=(uid,data={})=>({auth:{uid,token:{email:uid==='teacher'?'teacher@example.org':'a@example.org',email_verified:true}},data:{seminarId:seminar,...data}});
before(async()=>{
 process.env.FIREBASE_DATABASE_EMULATOR_HOST='127.0.0.1:9005';
 app=initializeApp({projectId:'demo-academy-transactions',databaseURL:'https://demo-academy-transactions-default-rtdb.firebaseio.com'},'transaction-tests');db=getDatabase(app);
 const auth={getUser:async uid=>({uid,email:uid==='teacher'?'teacher@example.org':'a@example.org',emailVerified:true})};
 service=createStaffService({db,auth,evaluationConfig:{[seminar]:{enabled:true,minimumAttendanceEvents:1,requestCutoff:null}}});
 await db.ref().set({seminarStaff:{[seminar]:{teacher:{role:'instructor'}}},academyRegistrations:{[a]:{[seminar]:{accountUid:'a',email:'a@example.org',enrolled:true,attendance:{s0:true}}},[b]:{[seminar]:{accountUid:'b',email:'b@example.org',enrolled:true}}}});
});
after(async()=>{await db?.ref().set(null);await deleteApp(app);});
test('real RTDB transaction leaves zero partial attendance changes on invalid roster',async()=>{
 await assert.rejects(service.staffMarkAllAttended(call('teacher',{eventKey:'lecture-s0',emailKeys:[a,'missing@example,org']})),{code:'failed-precondition'});
 assert.equal((await db.ref(`academyRegistrations/${a}/${seminar}/attendance/lecture-s0`).get()).val(),null);
 await service.staffMarkAllAttended(call('teacher',{eventKey:'lecture-s0',emailKeys:[a,b]}));
 for(const emailKey of [a,b])assert.equal((await db.ref(`academyRegistrations/${emailKey}/${seminar}/attendance/lecture-s0`).get()).val(),true);
});
test('real evaluation transaction rejects legacy-only eligibility and supports opt-out',async()=>{
 await db.ref(`academyRegistrations/${a}/${seminar}/attendance/lecture-s0`).set(null);
 await assert.rejects(service.participantSetEvaluationRequest(call('a',{optIn:true,form:'essay'})),{code:'failed-precondition'});
 assert.equal((await db.ref(`evaluations/${a}/${seminar}`).get()).val(),null);
 await service.staffSetAttendance(call('teacher',{emailKey:a,eventKey:'lecture-s0',attended:true}));
 await service.participantSetEvaluationRequest(call('a',{optIn:true,form:'essay'}));
 assert.equal((await db.ref(`evaluations/${a}/${seminar}/request/accountUid`).get()).val(),'a');
 await service.participantSetEvaluationRequest(call('a',{optIn:false}));
 assert.equal((await db.ref(`evaluations/${a}/${seminar}/request`).get()).val(),null);
 await service.participantSetEvaluationRequest(call('a',{optIn:true,form:'essay'}));
 await db.ref(`evaluations/${a}/${seminar}/instructor`).set({state:'completed',form:'essay',outcome:'completed',feedback:'Historical feedback'});
 const original=(await db.ref(`evaluations/${a}/${seminar}`).get()).val();
 for(const optIn of [true,false]) {
  await assert.rejects(service.participantSetEvaluationRequest(call('a',{optIn,form:'presentation'})),{code:'failed-precondition'});
  assert.deepEqual((await db.ref(`evaluations/${a}/${seminar}`).get()).val(),original);
 }
});
