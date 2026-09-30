import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const html=await readFile('cinema.html','utf8');
const script=html.slice(html.indexOf('<!-- ── Live chat')).match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/    import \{[\s\S]*?\} from [^;]+;/g,'');
async function setup(user, registration, assignments = []) {
 const elements=new Map(),events=new Map(),writes=[],authObservers=[],databaseObservers=new Map();
 const element=id=>{
  if(!elements.has(id)){const classes=new Set();elements.set(id,{id,value:'',disabled:false,textContent:'',children:[],classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle:(x,on)=>{on??=!classes.has(x);on?classes.add(x):classes.delete(x);}},addEventListener(type,fn){this[type]=fn;},focus(){},remove(){},appendChild(child){this.children.push(child);},get innerHTML(){return this.textContent;},set innerHTML(value){this.textContent=value;}});}
  return elements.get(id);
 };
 const academyAuth={currentUser:user};
 const context={staffCall:async()=>assignments,CustomEvent:class {constructor(type,{detail}){this.type=type;this.detail=detail;}},academyAuth,db:{},ADMIN_EMAIL:'academy@netadao.org',emailToKey:email=>email.replace(/\./g,','),
  onAcademyAuth:(auth,fn)=>authObservers.push(fn),watchDisplayName:(email,fn)=>{fn('Participant');return()=>{};},setDisplayName:async name=>name,
  ref:(db,path)=>path,query:path=>path,limitToLast:()=>100,onChildAdded:()=>{},
  onValue:(path,fn)=>{databaseObservers.set(path,fn);return()=>databaseObservers.delete(path);},
  push:async(path,record)=>writes.push({operation:'message',path,record}),remove:async path=>writes.push({operation:'clear',path}),set:async(path,value)=>writes.push({operation:'host',path,value}),
  document:{getElementById:element,createElement:()=>element('new-'+elements.size)},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  window:{dispatchEvent:event=>events.get(event.type)?.(event),addEventListener:(type,fn)=>events.set(type,fn),endCinemaScreeningPresentation:()=>writes.push({operation:'end'})},
  toastToggle:element('toastToggle'),Date,console,confirm:()=>true,alert:()=>{},setTimeout:()=>{},requestAnimationFrame:fn=>fn()
 };
 vm.runInNewContext(script,context);
 for(const observer of authObservers)await observer(user);
 for(const [path,observer] of databaseObservers)observer({val:()=>path==='chat/cinema/disabled'?false:registration});
 events.get('streamStatus')({detail:{live:true}});
 return {element,writes,events,context};
}
test('Cinema imports shared Academy identity and no longer creates an anonymous app',()=>{
 assert.doesNotMatch(html,/signInAnonymously|cinemaChatApp|HOST_TOKEN|\?host=/);
 assert.match(html,/auth as academyAuth, db/);
});
test('enrolled chat sends the existing Academy UID; ordinary user cannot invoke host controls',async()=>{
 const fixture=await setup({uid:'academy-uid',email:'participant@example.org',emailVerified:false},{enrolled:true,accountUid:'academy-uid'});
 assert.equal(fixture.element('chatSendBtn').disabled,false);
 fixture.element('chatMessageInput').value='Hello';await fixture.element('chatSendBtn').click();
 assert.equal(fixture.writes[0].record.uid,'academy-uid');
 assert.equal(fixture.element('disableChatBtn').classList.contains('visible'),false);
 fixture.element('disableChatBtn').click();fixture.element('endScreeningBtn').click();
 assert.deepEqual(fixture.writes.map(write=>write.operation),['message']);
});
test('signed-out, anonymous and non-enrolled clients cannot send chat',async()=>{
 for(const user of [null,{uid:'anon',isAnonymous:true},{uid:'ordinary',email:'ordinary@example.org',emailVerified:true}]){
  const fixture=await setup(user,null);assert.equal(fixture.element('chatSendBtn').disabled,true);
  fixture.element('chatMessageInput').value='No access';fixture.element('chatSendBtn').click();assert.equal(fixture.writes.length,0);
 }
});
test('verified Academy Admin sees and can invoke host controls without participant enrollment',async()=>{
 const fixture=await setup({uid:'admin',email:'academy@netadao.org',emailVerified:true},null);
 assert.equal(fixture.element('disableChatBtn').classList.contains('visible'),true);
 await fixture.element('disableChatBtn').click();await fixture.element('endScreeningBtn').click();
 assert.deepEqual(fixture.writes.map(write=>write.operation),['host','clear','end']);
});

test('only assigned Sex/Love instructor gets moderation, and revocation removes it',async()=>{
 const assignments=['sex-and-or-love'];
 const fixture=await setup({uid:'teacher',email:'teacher@example.org'},null,assignments);
 assert.equal(fixture.element('disableChatBtn').classList.contains('visible'),true);
 await fixture.element('disableChatBtn').click();assert.equal(fixture.writes.length,1);
 assignments.length=0;
 await fixture.element('endScreeningBtn').click();assert.equal(fixture.writes.length,1);
 assert.equal(fixture.element('disableChatBtn').classList.contains('visible'),false);
});
test('instructor assigned to another seminar gets no Cinema host authority',async()=>{
 const fixture=await setup({uid:'teacher',email:'teacher@example.org'},null,['sex-monsters-superheroes']);
 assert.equal(fixture.element('disableChatBtn').classList.contains('visible'),false);
 await fixture.element('disableChatBtn').click();await fixture.element('endScreeningBtn').click();assert.equal(fixture.writes.length,0);
});
