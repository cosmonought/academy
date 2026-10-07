const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright' : 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawn}=require('node:child_process');
const screenshots=process.env.ACADEMY_SCREENSHOTS || '/tmp/academy-staff-ui';
const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});
process.on('exit',()=>server.kill());
(async()=>{
 await new Promise((resolve,reject)=>{const began=Date.now();const ready=async()=>{try{await fetch('http://127.0.0.1:8765/profile.html');resolve();}catch(error){if(Date.now()-began>5000)reject(error);else setTimeout(ready,50);}};ready();});
 const browser=await chromium.launch({executablePath:process.env.ACADEMY_CHROMIUM || undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-zygote'],headless:true});
 const context=await browser.newContext();
 await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   // Admin → Fork reads the database directly (a plain string body here: refinement-ui.cjs takes the first template body as its auth mock)
   if(url.hostname==='www.gstatic.com'&&url.pathname.endsWith('/firebase-database.js'))return route.fulfill({contentType:'application/javascript',body:"export const ref=(db,path)=>path;\nexport const get=async path=>{if(window.denyFork&&path==='forkInterests')throw {code:'PERMISSION_DENIED',message:'Permission denied'};return {val:()=>window.mockDb?.[path]??null};};"});
   if(url.hostname!=='127.0.0.1'){ if(url.pathname.includes('email.min.js'))return route.fulfill({contentType:'application/javascript',body:'window.emailjs={init(){},send(){return Promise.resolve();}}'}); return route.abort(); }
   if(url.pathname==='/js/academy-auth.js')return route.fulfill({contentType:'application/javascript',body:`
     export * from '/js/academy-record.js';
     export const SEMINAR_TITLES={'sex-and-or-love':'Sex, and/or Love','sex-monsters-superheroes':'Sex, Monsters, and Superheroes','coining-reason-unit-1':'Coining Reason — Unit I','coining-reason-unit-2':'Coining Reason — Unit II'};
     export const SEMINAR_COMPLETED={}; export const ADMIN_EMAIL='academy@netadao.org';
     export const auth={currentUser:window.mockUser};
     export const onAuthStateChanged=(auth,fn)=>{queueMicrotask(()=>fn(auth.currentUser));};
     export const signOut=async()=>{},completeSignInIfNeeded=async()=>false,initNavAccountWidget=()=>{};
     export const getRegistrations=async()=>({'sex-and-or-love':window.mockRoster[0].registration}),getDisplayName=async()=> 'Test Instructor',setDisplayName=async name=>name,getEvaluation=async()=>({}),requestEvaluation=async()=>{},cancelEvaluationRequest=async()=>{},getOwnSeminarInterests=async()=>({});
     export const approveRegistration=async()=>window.operations.push('enroll'),revokeRegistration=async()=>window.operations.push('unenroll'),setAttendance=async()=>window.operations.push('attendance'),setInstructorEvaluation=async()=>window.operations.push('evaluation');
     export const getAllRegistrations=async()=>({'p@example,org':{'sex-and-or-love':window.mockRoster[0].registration}}),getAllEvaluations=async()=>({}),getAllInterestSignups=async()=>window.mockDb?.interestSignups||{};
     export const db={};
     export const sendPasswordReset=async()=>window.operations.push('reset'),signInWithGoogle=async()=>{if(window.googleConflict)throw {code:'auth/account-exists-with-different-credential'};auth.currentUser={uid:'google-same-uid',email:'p@example.org',providerData:[{providerId:'google.com'}]};return {user:auth.currentUser};},signInWithPassword=async()=>{},checkPasswordReset=async()=>'',finishPasswordReset=async()=>{},createPasswordAccount=async()=>{},getRegistrationForSeminar=async()=>null,submitRegistration=async()=>{};
   `});
   if(url.pathname==='/js/staff-api.js')return route.fulfill({contentType:'application/javascript',body:`
    export const staffError=e=>e.message||'Unavailable';
    export async function staffCall(name,data){
      if(name==='getTeachingAssignments')return window.assignments;
      if(name==='getTeachingAssignmentRoles')return window.assignmentRoles || {};
      if(name==='getTeachingRoster'){if(window.revoked)throw {code:'functions/permission-denied'};return window.mockRoster;}
      if(name==='adminListInstructors')return {};
      if(name==='adminGetAuthSummary')return {email:'p@example.org',account:{uid:'p',providers:['google.com'],emailVerified:true,passwordStatus:'Not required for Google sign-in'},registrations:[]};
      window.operations.push(name);return {};
    }
   `});
   return route.continue();
 });
 const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // a fixed day: 3 Oct 2026, four days before the Dogtooth screening (7 Oct), the current meeting
 await page.clock.setFixedTime(new Date('2026-10-03T12:00:00Z'));
 await page.addInitScript(()=>{
   window.mockUser={uid:'teacher',email:'teacher@example.org',emailVerified:true,providerData:[{providerId:'google.com'}]};window.assignments=['sex-and-or-love','sex-monsters-superheroes'];window.assignmentRoles={'sex-and-or-love':'instructor','sex-monsters-superheroes':'instructor'};window.operations=[];
   window.mockDb={forkInterests:{a:{name:'Ada Reader',email:'ada@example.org',interest:'editorial',area:'Political theory',source:'fork.netadao.org',submittedAt:1790000000000}},
     interestSignups:{b:{name:'Early Fork',email:'early@example.org',interest:'submitting',source:'fork.netadao.org',submittedAt:1789990000000},c:{name:'General Reader',email:'g@example.org',proposingLecture:false,proposal:'',submittedAt:1}}};
   window.mockRoster=[{emailKey:'p@example,org',registration:{name:'Participant Example',email:'p@example.org',xHandle:'@participant',reason:'To study together.',enrolled:true,attendance:{}},evaluation:{request:{form:'essay'}}}];
 });
 const results=[];fs.mkdirSync(screenshots,{recursive:true});
 for(const width of [1440,1280,1024,390]){
  await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:8765/profile.html');await page.locator('#profileTeachingTab').waitFor({state:'visible'});
  assert.equal(await page.locator('#profileSeminarsPanel').isVisible(),true);assert.equal(await page.locator('#profilePasswordRow').isVisible(),false);
  await page.click('#profileTeachingTab');await page.locator('#teachingAttendance .attendance-check').first().waitFor();
  assert.equal(await page.locator('#teachingSeminar option').count(),2);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false,'Profile overflow at '+width);
  await page.screenshot({path:screenshots+'/teaching-'+width+'.png',fullPage:true});
  await page.selectOption('#teachingSeminar','sex-monsters-superheroes');await page.locator('#teachingEvaluation textarea').waitFor();
  await page.selectOption('#teachingEvaluation select[name=state]','completed');await page.selectOption('#teachingEvaluation select[name=outcome]','merit');await page.fill('#teachingEvaluation textarea','Thoughtful work.');await page.locator('#teachingEvaluation button').first().click();await page.waitForFunction(()=>window.operations.includes('evaluation'));
  results.push({width,overflow:false,teaching:true,evaluationSaved:true});
 }
 // Attendance: one table, participants down the left, every meeting across the top. It opens at the current meeting,
 // highlighted, as far left as it goes; each cell is present or absent, nothing else.
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:8765/profile.html');await page.click('#profileTeachingTab');
 await page.locator('#teachingAttendance .attendance-check').first().waitFor();
 const currentCol=page.locator('#teachingAttendance th.attendance-col.is-current');
 assert.equal(await currentCol.count(),1);
 assert.equal(await currentCol.locator('.attendance-title').textContent(),'Dogtooth');
 assert.equal(await currentCol.locator('.attendance-kicker').textContent(),'Session 6 · Screening 4');
 assert.equal(await currentCol.locator('.attendance-now').textContent(),'Next');
 const columnCount=await page.locator('#teachingAttendance th.attendance-col').count();
 assert.equal(await page.locator('#teachingAttendance .attendance-check').count(),columnCount,'one box per meeting for the one participant');
 assert.equal(await page.locator('#teachingAttendance').getByText(/unrecorded/i).count(),0);
 const place=await page.evaluate(()=>{const s=document.querySelector('#teachingAttendance .attendance-scroll'),c=s.querySelector('th.is-current'),n=s.querySelector('thead .attendance-name');
   const first=[...s.querySelectorAll('th.attendance-col')].find(th=>th.getBoundingClientRect().right>n.getBoundingClientRect().right+1);
   return {left:s.scrollLeft,max:s.scrollWidth-s.clientWidth,width:c.offsetWidth,gap:c.getBoundingClientRect().left-n.getBoundingClientRect().right,whole:Math.abs(first.getBoundingClientRect().left-n.getBoundingClientRect().right)<2};});
 // as far left as it goes: right after the names, or, near the table's end, within a column of that, on a whole column
 assert.ok(place.left>0 && place.whole && (Math.abs(place.gap)<2 || (place.max-place.left<place.width && place.gap<place.width+2)),'current meeting placed leftmost: '+JSON.stringify(place));
 await page.screenshot({path:screenshots+'/attendance-1440.png',fullPage:false,clip:await page.locator('#teachingAttendance').boundingBox()});
 const box=page.locator('#teachingAttendance td.is-current .attendance-check');await box.check();await page.waitForFunction(()=>window.operations.includes('staffSetAttendance'));
 assert.equal(await page.locator('#teachingAttendance td.attendance-act.is-current .attendance-tally').textContent(),'1 of 1 present');
 await box.uncheck();assert.equal(await box.isChecked(),false);
 // Participants: Unenroll is on the row; the details still fold open
 const unenroll=page.locator('#teachingParticipants .staff-participant__unenroll');
 assert.equal(await unenroll.isVisible(),true);assert.equal(await page.locator('#teachingParticipants details').first().evaluate(d=>d.open),false);
 page.once('dialog',dialog=>dialog.accept());await unenroll.click();await page.waitForFunction(()=>window.operations.includes('unenroll'));
 await page.setViewportSize({width:390,height:900});await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>{const s=document.querySelector('#teachingAttendance .attendance-scroll');return Math.abs(s.querySelector('th.is-current').getBoundingClientRect().left-s.querySelector('thead .attendance-name').getBoundingClientRect().right)<2;}),true,'kept at the current meeting through a resize');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no page overflow at 390');
 await page.locator('#teachingAttendance').screenshot({path:screenshots+'/attendance-390.png'});await page.locator('#teachingParticipants').screenshot({path:screenshots+'/participants-390.png'});
 await page.setViewportSize({width:1440,height:1000});
 await page.evaluate(()=>{window.assignmentRoles={'sex-and-or-love':'ta','sex-monsters-superheroes':'ta'};});await page.click('#teachingRefresh');await page.locator('#teachingRoleBadge').getByText('TA',{exact:true}).waitFor();
 assert.equal(await page.locator('#teachingBody h3').allTextContents().then(items=>items.join('|')),'Attendance|Participants');
 await page.locator('#teachingParticipants .staff-participant__name').first().waitFor();assert.equal(await page.locator('#teachingParticipants .staff-participant p').count(),0);assert.equal(await page.locator('#teachingParticipants button, #teachingParticipants details').count(),0);
 // a teaching assistant never sees a film before the syllabus does: the screening goes by its session's title
 assert.equal(await page.locator('#teachingAttendance th.is-current .attendance-title').textContent(),'Intermezzo: Sin or Sine or Sign or—the Curve');assert.equal(await page.locator('#teachingAttendance').getByText('Hiroshima, Mon Amour').count(),0);assert.equal(await page.locator('#teachingAttendance').getByText('Dogtooth').count(),0);
assert.equal(await page.locator('#teachingBody').getByText('To study together.').count(),0);
 await page.evaluate(()=>{window.assignments=[];window.revoked=true;});await page.click('#teachingRefresh');await page.locator('#profileTeachingTab').waitFor({state:'hidden'});assert.equal(await page.locator('#profileSeminarsPanel').isVisible(),true);
 // Ordinary participant, from the initial render.
 await page.addInitScript(()=>{window.assignments=[];});await page.reload();await page.waitForFunction(()=>document.getElementById('profileDisplayName').textContent==='Test Instructor');assert.equal(await page.locator('#profileTeachingTab').isVisible(),false);
 // Admin Account Assistance / provider-aware recovery.
 await page.addInitScript(()=>{window.mockUser={uid:'admin',email:'academy@netadao.org',emailVerified:true};});await page.goto('http://127.0.0.1:8765/admin.html');await page.fill('#supportEmail','p@example.org');await page.locator('#accountLookup button').click();await page.locator('#accountSupportResult').getByText('Auth account exists',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Send password setup/reset link'}).count(),0);
 // Admin's seminar tab draws the same attendance table
 await page.locator('#attendanceWrap-sex-and-or-love .attendance-table').waitFor({state:'attached'});assert.equal(await page.locator('#attendanceWrap-sex-and-or-love th.attendance-col.is-current .attendance-title').textContent(),'Dogtooth');
 // Admin → Fork: registrations from forkInterests and, before that rule is live, the general list (kept out of Inquiries).
 await page.click('[data-admin-view="fork"]');await page.locator('#forkTableBody tr').nth(1).waitFor();
 assert.equal(await page.locator('#adminFork').isVisible(),true);assert.equal(await page.locator('#adminInquiries').isVisible(),false);assert.equal(await page.locator('#adminSeminars').isVisible(),false);
 assert.deepEqual(await page.locator('#forkTableBody tr').first().locator('td').allTextContents(),['Ada Reader','ada@example.org','Editorial board','Political theory','21 Sep 2026 · 14:13 UTC']);
 assert.equal(await page.locator('#forkTableBody tr').nth(1).locator('td').nth(2).textContent(),'Submitting work');
 assert.match(await page.locator('#forkStatusLine').textContent(),/^2 registrations · 1 submitting work · 1 editorial board\.$/);assert.equal(await page.locator('#forkRuleNote').isVisible(),false);assert.equal(await page.locator('#forkCopyBtn').isDisabled(),false);
 await page.evaluate(()=>{window.denyFork=true;});await page.click('#forkRefreshBtn');await page.waitForFunction(()=>document.querySelectorAll('#forkTableBody tr').length===1);assert.equal(await page.locator('#forkRuleNote').isVisible(),true);
 await page.click('[data-admin-view="inquiries"]');assert.deepEqual(await page.locator('#signupsTableBody td:first-child').allTextContents(),['General Reader']);
 await page.click('[data-admin-view="fork"]');await page.screenshot({path:screenshots+'/admin-fork-'+(await page.evaluate(()=>innerWidth))+'.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Admin overflow');await page.screenshot({path:screenshots+'/admin-390.png',fullPage:true});
 // Guest Google path and provider-conflict copy.
 await page.addInitScript(()=>{window.mockUser=null;});await page.goto('http://127.0.0.1:8765/account.html');await page.locator('#googleSignIn').waitFor({state:'visible'});await page.evaluate(()=>window.googleConflict=true);await page.click('#googleSignIn');await page.waitForFunction(()=>document.getElementById('googleStatus').textContent.includes('existing email and password'));
 await page.evaluate(()=>window.googleConflict=false);await page.click('#googleSignIn');await page.locator('#accountMember').waitFor({state:'visible'});assert.equal(await page.locator('#enrollmentFormWrap').isVisible(),false);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({results,revokedFallsBack:true,participantHasNoTeaching:true,googleFlow:true,errors}));await browser.close();server.kill();
})().catch(error=>{server.kill();console.error(error);process.exit(1);});
