import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const script=(await readFile('js/cinema-navigation.js','utf8')).replace(/^import[^\n]*\n/gm,'');
async function setup(user,registrations={},assignments=[]) {
 let observer,item=null;const auth={currentUser:user};
 const menu={insertBefore:node=>{item=node;}};
 const document={querySelector:selector=>selector==='.nav-links'?menu:item,getElementById:()=>null,
 createElement:()=>({dataset:{},append(){},remove(){item=null;}})};
 vm.runInNewContext(script,{auth,document,ADMIN_EMAIL:'academy@netadao.org',onAuthStateChanged:(_,fn)=>observer=fn,getRegistrations:async()=>registrations,staffCall:async()=>assignments});
 await observer(user);return {item,auth,observer,getItem:()=>item};
}
test('Cinema nav follows real enrollment, relevant assignment, or verified Admin',async()=>{
 const user={uid:'p',email:'p@example.org'};
 assert.ok((await setup(user,{'sex-and-or-love':{enrolled:true}})).item);
 assert.ok((await setup(user,{},['sex-and-or-love'])).item);
 assert.equal((await setup(user,{},['coining-reason-unit-1'])).item,null);
 assert.equal((await setup(user)).item,null);
 assert.ok((await setup({uid:'admin',email:'academy@netadao.org',emailVerified:true})).item);
 assert.equal((await setup({uid:'admin',email:'academy@netadao.org',emailVerified:false})).item,null);
 assert.equal((await setup(null)).item,null);
});
test('sign-out removes Cinema entitlement from navigation',async()=>{
 const state=await setup({uid:'p',email:'p@example.org'},{'sex-and-or-love':{enrolled:true}});
 state.auth.currentUser=null;await state.observer(null);assert.equal(state.getItem(),null);
});
