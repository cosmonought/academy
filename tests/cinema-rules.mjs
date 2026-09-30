import { readFile } from 'node:fs/promises';
import { test, before, after, beforeEach } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, get, set, remove, update } from 'firebase/database';
let env;
const registrationPath='academyRegistrations/participant@example,org/sex-and-or-love';
const message={name:'Participant',text:'Discussion',timestamp:1,uid:'participant'};
const user=(uid='participant',email='participant@example.org',verified=false,provider='password')=>env.authenticatedContext(uid,{email,email_verified:verified,firebase:{sign_in_provider:provider}}).database();
const admin=()=>user('admin','academy@netadao.org',true);
const seed=async(path,value)=>env.withSecurityRulesDisabled(context=>set(ref(context.database(),path),value));
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-academy-cinema',database:{host:'127.0.0.1',port:9005,rules:await readFile('firebase-rules-latest.json','utf8')}});});
after(async()=>env?.cleanup());
beforeEach(async()=>{await env.clearDatabase();await seed(registrationPath,{email:'participant@example.org',name:'P',xHandle:'@p',reason:'Learn',requestedAt:1,accountUid:'participant',enrolled:true});});
test('anonymous, signed-out and non-enrolled identities cannot write chat or host state',async()=>{
 for(const db of [env.unauthenticatedContext().database(),env.authenticatedContext('anonymous',{firebase:{sign_in_provider:'anonymous'}}).database(),user('other','other@example.org'),user('participant','participant@example.org',false,'anonymous')]){
  await assertFails(set(ref(db,'chat/cinema/messages/new'),message));
  await assertFails(set(ref(db,'chat/cinema/disabled'),true));
 }
});
test('UID-bound password and Google participants can create messages, not forge identity or edit/delete history',async()=>{
 for(const provider of ['password','google.com'])await assertSucceeds(set(ref(user('participant','participant@example.org',false,provider),`chat/cinema/messages/${provider.replace('.','-')}`),message));
 const db=user();await assertFails(set(ref(db,'chat/cinema/messages/forged'),{...message,uid:'someone-else'}));
 await assertFails(update(ref(db,'chat/cinema/messages/password'),{text:'changed'}));
 await assertFails(remove(ref(db,'chat/cinema/messages/password')));
 await assertFails(remove(ref(db,'chat/cinema/messages')));
 await assertFails(set(ref(db,'chat/cinema/disabled'),false));
});
test('legacy enrollment needs verified email and mismatched bound UID never gains access',async()=>{
 await seed(registrationPath,{email:'participant@example.org',enrolled:true});
 await assertFails(set(ref(user(),'chat/cinema/messages/new'),message));
 await assertSucceeds(set(ref(user('participant','participant@example.org',true),'chat/cinema/messages/new'),message));
 await seed(registrationPath,{email:'participant@example.org',enrolled:true,accountUid:'different'});
 await assertFails(set(ref(user('participant','participant@example.org',true),'chat/cinema/messages/other'),message));
});
test('banned, unenrolled and host-disabled chat deny new participant messages',async()=>{
 const db=user();await seed('banned/participant',true);await assertFails(set(ref(db,'chat/cinema/messages/new'),message));
 await seed('banned/participant',null);await seed(registrationPath+'/enrolled',false);await assertFails(set(ref(db,'chat/cinema/messages/new'),message));
 await seed(registrationPath+'/enrolled',true);await seed('chat/cinema/disabled',true);await assertFails(set(ref(db,'chat/cinema/messages/new'),message));
});
test('only verified real Admin can moderate and clear history; content validation remains restrictive',async()=>{
 const db=admin();await seed('chat/cinema/messages/history',message);
 await assertFails(set(ref(user('admin','academy@netadao.org',false),'chat/cinema/disabled'),true));
 await assertFails(set(ref(user('admin','academy@netadao.org',true,'anonymous'),'chat/cinema/disabled'),true));
 await assertSucceeds(set(ref(db,'chat/cinema/disabled'),true));
 await assertFails(set(ref(db,'chat/cinema/disabled'),'yes'));
 await assertFails(set(ref(db,'chat/cinema/messages/new'),{...message,uid:'admin'}));
 await assertSucceeds(remove(ref(db,'chat/cinema/messages')));
 await assertSucceeds(set(ref(db,'chat/cinema/disabled'),false));
 await assertSucceeds(set(ref(db,'chat/cinema/messages/new'),{...message,uid:'admin'}));
 await assertFails(set(ref(db,'chat/cinema/messages/extra'),{...message,uid:'admin',extra:'field'}));
 await assertFails(set(ref(db,'chat/cinema/messages/empty'),{...message,uid:'admin',text:''}));
 await assertSucceeds(get(ref(env.unauthenticatedContext().database(),'chat/cinema/messages')));
});

test('Sex/Love instructors may moderate; other-seminar and revoked instructors cannot',async()=>{
 const db=user('teacher','teacher@example.org');
 await seed('seminarStaff/sex-monsters-superheroes/teacher',{role:'instructor'});
 await seed('chat/cinema/messages/history',message);
 await assertFails(set(ref(db,'chat/cinema/disabled'),true));
 await assertFails(remove(ref(db,'chat/cinema/messages')));
 await seed('seminarStaff/sex-and-or-love/teacher',{role:'instructor'});
 await assertSucceeds(set(ref(db,'chat/cinema/messages/teacher'),{...message,uid:'teacher'}));
 await assertSucceeds(set(ref(db,'chat/cinema/disabled'),true));
 await assertSucceeds(remove(ref(db,'chat/cinema/messages')));
 await assertSucceeds(set(ref(db,'chat/cinema/disabled'),false));
 await seed('chat/cinema/messages/history',message);
 await seed('seminarStaff/sex-and-or-love/teacher',null);
 await assertFails(set(ref(db,'chat/cinema/disabled'),true));
 await assertFails(remove(ref(db,'chat/cinema/messages')));
});
