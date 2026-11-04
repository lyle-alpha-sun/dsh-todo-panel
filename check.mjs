import assert from 'node:assert/strict'
import http from 'node:http'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply, applyAction, readTasks, writeTasks, inject } from './lib/index.js'
assert.deepEqual(inject, ['webServer'])
const dir = await mkdtemp(join(tmpdir(),'todo-check-'))
const file = join(dir,'nested/tasks.json')
const initial = { version:1, custom:'preserve', tasks:[{id:'a',title:'Task A',custom:7,status:'todo',steps:[{text:'First',minutes:1,done:false,custom:'keep'},{text:'Second',minutes:2,done:false}]},{id:'b',title:'Task B',steps:[{text:'Third',minutes:3,done:false}]}] }
await writeTasks(file,initial)
// Assistant-written task files can omit updatedAt.
await writeFile(file,JSON.stringify(initial))
let route; const disposers=[]; const warnings=[]
const ctx={ get:name=>name==='webServer'?{register:({handler})=>{route=handler;return()=>{route=null}}}:null, logger:{warn:m=>warnings.push(m)}, effect:f=>{const d=f();if(typeof d==='function')disposers.push(d);return d}, on:()=>{} }
apply(ctx,{dataFile:file,notify:false})
assert.equal(typeof route,'function')
const server=http.createServer((q,r)=>route(q,r));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const url='http://127.0.0.1:'+server.address().port
async function req(body,headers={}){const res=await fetch(url,{method:body?'POST':'GET',headers:{'content-type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{})});return{status:res.status,data:await res.json()}}
try{
 const values=await Promise.all([req({action:'toggle',taskId:'a',step:0,done:true}),req({action:'toggle',taskId:'a',step:1,done:true})]);assert(values.every(v=>v.status===200))
 let doc=await readTasks(file);assert.equal(doc.tasks[0].status,'done');assert(doc.tasks[0].steps.every(s=>s.done));assert.equal(doc.custom,'preserve');assert.equal(doc.tasks[0].steps[0].custom,'keep')
 await req({action:'toggle',taskId:'a',step:0,done:true});assert.equal((await readTasks(file)).tasks[0].steps[0].done,true)
 await req({action:'toggle',taskId:'a',step:0,done:false});assert.equal((await readTasks(file)).tasks[0].status,'todo');assert.equal((await readTasks(file)).tasks[0].steps[0].startedAt,null)
 await req({action:'start',taskId:'a',step:0});await req({action:'start',taskId:'b',step:0});doc=await readTasks(file);assert.equal(doc.tasks[0].steps[0].startedAt,null);assert(doc.tasks[1].steps[0].startedAt)
 await req({action:'pause',taskId:'b',step:0});assert.equal((await readTasks(file)).tasks[1].steps[0].startedAt,null)
 assert.equal((await req({action:'toggle',taskId:'bad',step:0})).status,400)
 assert.equal((await req({action:'explode'})).status,400)
 assert.equal((await req({action:'inbox',text:'Keep this idea'})).status,200);assert.match(await readFile(join(dir,'nested/待拆.md'),'utf8'),/Keep this idea/)
 assert.equal((await req({action:'inbox',text:'attack'},{origin:'https://evil.invalid'})).status,403)
 assert.equal((await req({action:'start',taskId:'a',step:0},{origin:'dsh-app://app'})).status,200)
 const before=await readFile(file,'utf8');assert.equal((await req({action:'toggle',taskId:'a',step:'0'})).status,400);assert.equal(await readFile(file,'utf8'),before)
 for(let i=0;i<100;i++) assert.equal(applyAction(initial,{action:'addTask',title:'x'}).tasks.length,3)
 console.log('PASS: concurrent saves, idempotent completion, undo, pause, single active timer, metadata preservation, validation, origin checks, inbox, synchronous registration')
} finally { for(const d of disposers.reverse())d();await new Promise(resolve=>server.close(resolve)) }
