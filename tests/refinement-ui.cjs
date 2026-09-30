const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const mock=fs.readFileSync('tests/staff-ui.cjs','utf8').split("body:`")[1].split('`});')[0]
 .replace('export const SEMINAR_COMPLETED={};',"export const SEMINAR_COMPLETED={'coining-reason-unit-1':true};")
 .replace("getDisplayName=async()=> 'Test Instructor'","getDisplayName=async()=> ''")
 .replace("getRegistrations=async()=>({'sex-and-or-love':window.mockRoster[0].registration})","getRegistrations=async()=>({'sex-and-or-love':window.mockRoster[0].registration,'coining-reason-unit-1':{enrolled:true,attendance:{s0:true}}})")
 + '\nexport const db={},emailToKey=email=>email.replaceAll(".",","),submitInterestSignup=async()=>{},watchDisplayName=(email,fn)=>{fn("Study Name");return()=>{};};\nexport const getRegistrationForSeminar=async()=>({enrolled:true}),getSeminarReadings=async()=>({}),watchRegistration=(email,id,fn)=>{queueMicrotask(()=>fn({enrolled:true}));return()=>{};};';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.ACADEMY_CHROMIUM || undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],proxy:{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}});
 const baselineCinema=require('node:child_process').execFileSync('git',['show','214b0df:cinema.html'],{encoding:'utf8'});
 const context=await browser.newContext({ignoreHTTPSErrors:true});
 await context.route('**/cinema-base.html',route=>route.fulfill({contentType:'text/html',body:baselineCinema}));
 await context.route('**/js/academy-auth.js*',route=>route.fulfill({contentType:'application/javascript',body:mock.replace(/getRegistrationForSeminar=async\(\)=>null,?/,'')}));
 await context.route('**/js/staff-api.js*',route=>route.fulfill({contentType:'application/javascript',body:`export const staffError=e=>e.message||'Unavailable';export async function staffCall(name,data){if(name==='getTeachingAssignments')return window.assignments;if(name==='getTeachingRoster')return window.mockRoster;if(name==='adminListInstructors')return {};window.operations.push({name,data});return {};}`}));
 await context.route('**/firebase-database.js*',route=>route.fulfill({contentType:'application/javascript',body:'export const ref=(db,path)=>({path}),get=async()=>({exists:()=>false,val:()=>null}),set=async()=>{},push=()=>({}),onValue=(r,fn)=>{queueMicrotask(()=>fn({val:()=>null}));return()=>{};},onChildAdded=()=>()=>{},query=r=>r,limitToLast=()=>({}),onChildRemoved=()=>()=>{},remove=async()=>{},serverTimestamp=()=>Date.now();'}));
 await context.route('**/email.min.js',route=>route.fulfill({contentType:'application/javascript',body:'window.emailjs={init(){},send(){return Promise.resolve()}}'}));
 await context.addInitScript(()=>{
   if(location.search.includes('testIntro=1'))localStorage.removeItem('academy-intro-seen-v3');else localStorage.setItem('academy-intro-seen-v3','1');
   window.mockUser={uid:'teacher',email:'teacher@example.org',emailVerified:true,providerData:[{providerId:'google.com'}]};window.assignments=['sex-and-or-love'];window.operations=[];
   window.mockRoster=[{emailKey:'p@example,org',registration:{name:'Participant Example',email:'p@example.org',enrolled:true,attendance:{'lecture-s0':true,s0:true}},evaluation:{}}];
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 fs.mkdirSync('/tmp/academy-refinement-ui',{recursive:true});const results=[];
 for(const width of [1440,1280,1024,390]){
  await page.setViewportSize({width,height:1000});
  for(const path of ['/','/CoiningReason/','/SexMonstersSuperheroes/','/cinema.html']){
   await page.goto('http://127.0.0.1:8765'+path);await page.waitForTimeout(450);await page.evaluate(async()=>{await document.fonts.ready;document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));await new Promise(resolve=>setTimeout(resolve,550));});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   if(path!=='/cinema.html')assert.equal(overflow,false,path+" overflow at "+width);else if(overflow)console.log('Cinema overflow elements',await page.evaluate(()=>[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,class:el.className,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})).filter(el=>el.right>innerWidth+1)));results.push({width,path,overflow});await page.screenshot({path:'/tmp/academy-refinement-ui/'+(path.replaceAll('/','')||'home')+'-'+width+'.png',fullPage:true});
  }
  await page.goto('http://127.0.0.1:8765/profile.html#teaching');await page.waitForTimeout(200);await page.locator('.attendance-person').first().waitFor();
  assert.equal(await page.locator('#profileTeachingPanel').isVisible(),true);assert.equal(await page.locator('#teachingAttendance table').count(),0);
  assert.match(await page.locator('#teachingAttendance').textContent(),/SCREENING · Ma Mère/);
  await page.screenshot({path:'/tmp/academy-refinement-ui/teaching-'+width+'.png',fullPage:true});
  await page.click('[data-profile-tab=transcript]');assert.equal(await page.locator('.transcript-row').count(),1);
  await page.screenshot({path:'/tmp/academy-refinement-ui/transcript-'+width+'.png',fullPage:true});
  await page.click('[data-profile-tab=seminars]');await page.click('#profileDisplayName');await page.fill('#identityDisplayNameInput','Study Name');await page.locator('#identityDisplayNameForm button').click();assert.equal(await page.locator('#profileDisplayName').textContent(),'Study Name');
 }
 for(const zoom of [.8,1,1.25,1.5,1.75,2]){
  await page.setViewportSize({width:Math.round(1440/zoom),height:Math.round(1000/zoom)});await page.goto('http://127.0.0.1:8765/');await page.evaluate(async()=>{await document.fonts.ready;document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));await new Promise(resolve=>setTimeout(resolve,550));});
  results.push({zoom,effectiveWidth:Math.round(1440/zoom),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
  await page.screenshot({path:'/tmp/academy-refinement-ui/home-zoom-'+zoom+'.png',fullPage:true});
 }
 await page.setViewportSize({width:390,height:850});await page.goto('http://127.0.0.1:8765/SexMonstersSuperheroes/');
 const policy=page.getByRole('link',{name:'Review Academy Seminar Policies'});await policy.click();await page.locator('dialog[open]').waitFor();
 assert.equal(await page.evaluate(()=>document.activeElement.className),'academy-policy-dialog-close');await page.keyboard.press('Escape');assert.equal(await policy.evaluate(el=>el===document.activeElement),true);
 await policy.click();await page.screenshot({path:'/tmp/academy-refinement-ui/policy-390.png'});await page.keyboard.press('Escape');
 await page.goto('http://127.0.0.1:8765/seminar.html?test=1#unit1AccessPanel');assert.equal(new URL(page.url()).pathname,'/CoiningReason/');assert.equal(new URL(page.url()).search,'?test=1');assert.equal(await page.locator('#unit1-section').isVisible(),true);
 await page.addInitScript(()=>window.assignments=[]);await page.goto('http://127.0.0.1:8765/profile.html#teaching');await page.waitForTimeout(200);assert.equal(await page.locator('#profileTeachingTab').isVisible(),false);assert.equal(await page.locator('#profileSeminarsPanel').isVisible(),true);
 // Admin correction uses exactly the same component.
 await page.addInitScript(()=>window.mockUser={uid:'admin',email:'academy@netadao.org',emailVerified:true,providerData:[]});await page.goto('http://127.0.0.1:8765/admin.html');await page.locator('.attendance-person').first().waitFor();await page.screenshot({path:'/tmp/academy-refinement-ui/admin-390.png',fullPage:true});
 // First visit: skip remains outside aria-hidden content and nav is above the intro.
 await page.goto('http://127.0.0.1:8765/?testIntro=1');await page.locator('.academy-intro-skip').waitFor();assert.equal(await page.locator('.academy-intro-skip').evaluate(el=>!!el.closest('[aria-hidden=true]')),false);await page.screenshot({path:'/tmp/academy-refinement-ui/intro-390.png'});await page.keyboard.press('Escape');await page.locator('.academy-intro-splash').waitFor({state:'detached'});
 // The frog enters once, settles, and bypasses motion when requested.
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('http://127.0.0.1:8765/SexMonstersSuperheroes/');
 const frog=page.locator('.graphic-lild');
 assert.equal(await frog.evaluate(el=>getComputedStyle(el).animationIterationCount),'1');
 assert.equal(await frog.evaluate(el=>getComputedStyle(el).animationDuration),'1.6s');
 await page.waitForTimeout(1700);
 assert.equal(await frog.evaluate(el=>getComputedStyle(el).transform),'matrix(1, 0, 0, 1, 0, 0)');
 assert.equal(await frog.evaluate(el=>el.naturalWidth>0),true);
 await page.screenshot({path:'/tmp/academy-refinement-ui/frog-390.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
 assert.equal(await frog.evaluate(el=>getComputedStyle(el).animationName),'none');
 assert.equal(await frog.evaluate(el=>getComputedStyle(el).transform),'none');
 await page.emulateMedia({reducedMotion:'no-preference'});
 const cinemaBaseline=[];for(const width of [1440,1280,1024,390]){await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:8765/cinema-base.html');await page.waitForTimeout(300);cinemaBaseline.push({width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({results,cinemaBaseline,errors},null,2));await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
