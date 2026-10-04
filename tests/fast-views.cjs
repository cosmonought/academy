// Profile and Admin draw at once on a return visit, from this browser's last copy (js/view-cache.js), before sign-in
// is confirmed; the copy belongs to one account and goes when someone else, or no one, turns out to be signed in.
// The record never waits on the teaching-roles staff service. Uses staff-ui.cjs's auth mock with slow sign-in and data.
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright' : 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawn}=require('node:child_process');
const mock=fs.readFileSync('tests/staff-ui.cjs','utf8').split('body:`')[1].split('`});')[0]
 .replace('export const onAuthStateChanged=(auth,fn)=>{queueMicrotask(()=>fn(auth.currentUser));};',
          'export const onAuthStateChanged=(auth,fn)=>{setTimeout(()=>fn(auth.currentUser),window.authDelay||0);};')
 .replace("export const getRegistrations=async()=>({'sex-and-or-love':window.mockRoster[0].registration})",
          "export const getRegistrations=async()=>{await new Promise(r=>setTimeout(r,window.dataDelay||0));return {'sex-and-or-love':window.mockRoster[0].registration};}")
 .replace("export const getAllRegistrations=async()=>({'p@example,org':{'sex-and-or-love':window.mockRoster[0].registration}})",
          "export const getAllRegistrations=async()=>{await new Promise(r=>setTimeout(r,window.dataDelay||0));return {'p@example,org':{'sex-and-or-love':window.mockRoster[0].registration}};}");
assert.ok(mock.includes('window.authDelay') && mock.includes('window.dataDelay'), 'mock patched');
const server=spawn('python3',['-m','http.server','8767','--bind','127.0.0.1'],{stdio:'ignore'});
process.on('exit',()=>server.kill());
(async()=>{
 await new Promise((resolve,reject)=>{const began=Date.now();const ready=async()=>{try{await fetch('http://127.0.0.1:8767/profile.html');resolve();}catch(error){if(Date.now()-began>5000)reject(error);else setTimeout(ready,50);}};ready();});
 const browser=await chromium.launch({executablePath:process.env.ACADEMY_CHROMIUM || undefined,headless:true});
 const context=await browser.newContext();
 await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname==='www.gstatic.com'&&url.pathname.endsWith('/firebase-database.js'))return route.fulfill({contentType:'application/javascript',body:"export const ref=(db,path)=>path;\nexport const get=async path=>({val:()=>null});"});
   if(url.hostname!=='127.0.0.1'){ if(url.pathname.includes('email.min.js'))return route.fulfill({contentType:'application/javascript',body:'window.emailjs={init(){},send(){return Promise.resolve();}}'}); return route.abort(); }
   if(url.pathname==='/js/academy-auth.js')return route.fulfill({contentType:'application/javascript',body:mock});
   if(url.pathname==='/js/staff-api.js')return route.fulfill({contentType:'application/javascript',body:"export const staffError=e=>e.message||'Unavailable';\nexport async function staffCall(name){const wait=ms=>new Promise(r=>setTimeout(r,ms));if(name==='getTeachingAssignmentRoles'){await wait(window.rolesDelay||0);return window.assignmentRoles||{};}if(name==='getTeachingAssignments'){await wait(window.rolesDelay||0);return window.assignments||[];}if(name==='adminListInstructors'){await wait(window.rolesDelay||0);return {};}return {};}"});
   return route.continue();
 });
 const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
   const q=new URLSearchParams(location.search);
   window.authDelay=+(q.get('auth')||0); window.dataDelay=+(q.get('data')||0); window.rolesDelay=+(q.get('roles')||0);
   const who=q.get('who')||'p';
   window.mockUser=who==='none'?null:who==='admin'?{uid:'admin',email:'academy@netadao.org',emailVerified:true,providerData:[{providerId:'password'}]}:{uid:who,email:who+'@example.org',emailVerified:true,providerData:[{providerId:'password'}]};
   window.assignments=[];window.assignmentRoles={'sex-and-or-love':'instructor'};window.operations=[];
   window.mockRoster=[{emailKey:'p@example,org',registration:{name:'Participant Example',email:'p@example.org',xHandle:'@participant',reason:'To study together.',enrolled:true,attendance:{}}}];
 });
 const results={};
 const listed=()=>page.evaluate(()=>document.querySelectorAll('#profileRegistrationsList .pg-record').length);
 const shownIn=async(fn,limit)=>{const t0=Date.now();while(Date.now()-t0<limit){if(await fn())return Date.now()-t0;await page.waitForTimeout(25);}return null;};

 // 1 · first visit: nothing cached; the record waits for sign-in and the data, but not for the slow teaching roles
 await page.goto('http://127.0.0.1:8767/profile.html?auth=400&data=300&roles=3000');
 const first=await shownIn(listed,2500);
 assert.ok(first!==null && first<1600,'first visit: record shown without waiting for teaching roles ('+first+'ms)');
 assert.equal(await page.locator('#profileRegistrationsList .pg-record__role').count(),0,'roles not yet in');
 await page.locator('#profileRegistrationsList .pg-record__role').first().waitFor({timeout:5000});
 results.firstVisitMs=first;

 // 2 · return visit, same account: the record is on screen before sign-in is confirmed, with the roles it last had
 await page.goto('http://127.0.0.1:8767/profile.html?auth=1500&data=500&roles=3000');
 const again=await shownIn(listed,1200);
 assert.ok(again!==null && again<400,'return visit drawn at once ('+again+'ms)');
 assert.equal(await page.locator('#profileRegistrationsList .pg-record__role').count(),1,'cached roles drawn too');
 assert.equal(await page.locator('#profileSignedIn').isVisible(),true);
 results.returnVisitMs=again;

 // 3 · someone else signs in on this browser: the copy is dropped when sign-in says so, and never kept for them
 await page.goto('http://127.0.0.1:8767/profile.html?who=q&auth=600&data=200');
 await page.waitForTimeout(900);
 const owners=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('nda-view:')).map(k=>JSON.parse(localStorage.getItem(k)).uid));
 assert.ok(owners.every(uid=>uid==='q'),'only the new account’s copies remain: '+owners.join(','));
 assert.equal(await page.locator('#profileEmailLine').textContent(),'q@example.org');

 // 4 · no one signed in: the signed-out view, and every copy gone
 await page.goto('http://127.0.0.1:8767/profile.html?who=none&auth=300');
 await page.waitForTimeout(600);
 assert.equal(await page.locator('#profileSignedOut').isVisible(),true);
 assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('nda-view:')).length),0,'copies cleared');

 // 5 · Admin: first visit fills the copy; the return visit draws the tables at once, inert until sign-in confirms
 await page.goto('http://127.0.0.1:8767/admin.html?who=admin&auth=300&data=300');
 await page.locator('#regTableBody-sex-and-or-love tr').first().waitFor({timeout:4000});
 await page.waitForTimeout(300);
 await page.goto('http://127.0.0.1:8767/admin.html?who=admin&auth=1500&data=800');
 const adminAgain=await shownIn(()=>page.evaluate(()=>document.querySelectorAll('#regTableBody-sex-and-or-love tr').length>0),1200);
 assert.ok(adminAgain!==null && adminAgain<400,'admin return visit drawn at once ('+adminAgain+'ms)');
 assert.equal(await page.evaluate(()=>document.getElementById('adminApproved').inert),true,'actions wait for sign-in');
 await page.waitForFunction(()=>document.getElementById('adminApproved').inert===false,null,{timeout:4000});
 results.adminReturnVisitMs=adminAgain;

 // 6 · the Admin copy is not shown to anyone else: a participant signs in, it goes
 await page.goto('http://127.0.0.1:8767/admin.html?who=p&auth=300');
 await page.waitForTimeout(600);
 assert.equal(await page.locator('#adminApproved').isVisible(),false);
 assert.equal(await page.evaluate(()=>localStorage.getItem('nda-view:admin')),null,'admin copy dropped');

 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({results,errors}));
 await browser.close();server.kill();
})().catch(error=>{server.kill();console.error(error);process.exit(1);});
