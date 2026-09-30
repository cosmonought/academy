import { readFile } from 'node:fs/promises';
import { test, before, after } from 'node:test';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { ref, get, set } from 'firebase/database';
let env;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-academy-staff',database:{host:'127.0.0.1',port:9005,rules:await readFile('firebase-rules-latest.json','utf8')}});await env.withSecurityRulesDisabled(async context=>{const db=context.database();await set(ref(db,'seminarStaff/sex-and-or-love/teacher'),{role:'instructor'});await set(ref(db,'academyRegistrations/p@example,org/sex-and-or-love'),{email:'p@example.org',name:'P',xHandle:'@p',reason:'Learn',requestedAt:1,accountUid:'p',enrolled:true});});});
after(async()=>env?.cleanup());
test('instructor assignment does not grant browser root reads, private data, or writes',async()=>{
 const db=env.authenticatedContext('teacher',{email:'teacher@example.org',email_verified:true}).database();
 for(const path of ['academyRegistrations','academyRegistrations/p@example,org/sex-and-or-love','evaluations','interestSignups','seminarStaff'])await assertFails(get(ref(db,path)));
 await assertFails(set(ref(db,'seminarStaff/sex-and-or-love/teacher'),{role:'instructor'}));
 await assertFails(set(ref(db,'academyRegistrations/p@example,org/sex-and-or-love/attendance/lecture-s0'),true));
 await assertFails(set(ref(db,'academyRegistrations/p@example,org/sex-and-or-love'),null));
});
test('participant cannot mark attendance or write instructor evaluation fields',async()=>{
 const db=env.authenticatedContext('p',{email:'p@example.org',email_verified:true}).database();
 await assertFails(set(ref(db,'academyRegistrations/p@example,org/sex-and-or-love/attendance/lecture-s0'),true));
 await assertFails(set(ref(db,'evaluations/p@example,org/sex-and-or-love/instructor'),{state:'agreed',form:'essay',feedback:'fake'}));
});

test('participant and staff browsers cannot create or delete evaluation requests directly',async()=>{
 await env.withSecurityRulesDisabled(async context=>set(ref(context.database(),'evaluations/p@example,org/sex-and-or-love/request'),{form:'essay',requestedAt:1,accountUid:'p'}));
 for(const [uid,email] of [['p','p@example.org'],['teacher','teacher@example.org'],['admin','academy@netadao.org']]) {
  const db=env.authenticatedContext(uid,{email,email_verified:true}).database();
  await assertFails(set(ref(db,'evaluations/p@example,org/sex-and-or-love/request'),{form:'essay',requestedAt:2,accountUid:uid}));
  await assertFails(set(ref(db,'evaluations/p@example,org/sex-and-or-love/request'),null));
 }
});
