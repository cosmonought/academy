import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {EVALUATION_FORMS,EVALUATION_OUTCOMES} from '../js/academy-record.js';
const source=await readFile('profile.html','utf8');
const between=source.slice(source.indexOf('function evaluationHtml('),source.search(/\n[ \t]*function makeRow/));   // whatever the page's indentation
const fn=between.slice(0,between.lastIndexOf('}')+1);   // up to its closing brace, leaving any comment that introduces makeRow
const config={disabled:{enabled:false},enabled:{enabled:true,minimumAttendanceEvents:1,requestCutoff:null},locked:{enabled:true,minimumAttendanceEvents:1,requestCutoff:'2000-01-01T00:00:00Z'}};
const render=vm.runInNewContext('('+fn+')',{EVALUATION_CONFIG:config,EVALUATION_FORMS,EVALUATION_OUTCOMES,escape:String,Date});
test('disabled evaluations do not present fake failures; enabled failures are explicit',()=>{
 assert.match(render('disabled',{unavailable:true},{attended:1}),/Not offered for this seminar/);
 assert.match(render('enabled',{unavailable:true},{attended:1}),/Unavailable/);
});
test('minimum events gate the request UI and cutoff removes participant controls',()=>{
 assert.doesNotMatch(render('enabled',{}, {attended:0}),/evaluation-request/);
 assert.match(render('enabled',{}, {attended:1}),/evaluation-request/);
 assert.doesNotMatch(render('locked',{request:{form:'essay'}},{attended:1}),/evaluation-optout/);
 assert.match(render('locked',{}, {attended:1}),/locked after/);
});
test('opt-out and re-opt-in remain available before cutoff even after staff arrangement',()=>{
 for(const state of ['agreed','in-progress']) {
  const instructor={state,form:'essay',feedback:'Written feedback',outcome:'completed'};
  assert.match(render('enabled',{request:{form:'essay'},instructor},{attended:1}),/evaluation-optout/);
  assert.match(render('enabled',{instructor},{attended:1}),/evaluation-request/);
 }
});

test('completed evaluations preserve feedback without participant participation controls',()=>{
 const instructor={state:'completed',form:'essay',feedback:'Historical feedback',outcome:'completed'};
 for(const request of [undefined,{form:'essay'}]) {
  const html=render('enabled',{request,instructor},{attended:1});
  assert.match(html,/Historical feedback/);
  assert.match(html,/part of your record/);
  assert.doesNotMatch(html,/evaluation-optout|evaluation-request/);
 }
});
