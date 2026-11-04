import assert from 'node:assert/strict'
import http from 'node:http'
import { mkdtemp,readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply,writeTasks,readTasks } from './lib/index.js'
const dir=await mkdtemp(join(tmpdir(),'todo-notify-'));const file=join(dir,'tasks.json');const messages=[];let route,watch;let callbacks=[]
function mount(available=true){
 const previous=global.setInterval;global.setInterval=f=>{watch=f;return{unref(){}}}
 const ctx={get:n=>n==='webServer'?{register:({handler})=>{route=handler;return()=>{}}}:n==='agents'?{get:()=>available?{followup:m=>{assert(m.id);assert.equal(m.role,'user');assert(Object.isFrozen(m));messages.push(m)}}:null}:null,logger:{warn:()=>{}},effect:f=>{callbacks.push(f())},on:()=>{}}
 try{apply(ctx,{dataFile:file,notify:true,notifySession:'test'})}finally{global.setInterval=previous}
}
await writeTasks(file,{tasks:[{id:'t',title:'Test',steps:[{text:'One',minutes:1,done:false}]}]});mount()
const server=http.createServer((q,r)=>route(q,r));await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port
async function send(body){return(await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})).json()}
try{
 await send({action:'toggle',taskId:'t',step:0,done:true});assert.equal(messages.length,1);assert.match(messages[0].content[0].text,/夸我/)
 await send({action:'toggle',taskId:'t',step:0,done:true});assert.equal(messages.length,1)
 await writeTasks(file,{tasks:[{id:'n',title:'Nudge',steps:[{text:'Slow step',minutes:1,done:false,startedAt:new Date(Date.now()-180000).toISOString()}]}]})
 await watch();assert.equal(messages.length,2);assert.match(messages[1].content[0].text,/超时/)
 await watch();assert.equal(messages.length,2)
 assert(await readFile(join(dir,'.todo-reminders.json'),'utf8'))
 for(const f of callbacks.splice(0))if(typeof f==='function')f();mount();await watch();assert.equal(messages.length,2,'restart must retain cooldown')
 for(const f of callbacks.splice(0))if(typeof f==='function')f();mount(false)
 const data=await send({action:'toggle',taskId:'n',step:0,done:true});assert.equal(data.ok,true);assert.match(data.value.notice,/未打开/);assert.equal((await readTasks(file)).tasks[0].steps[0].done,true)
 for(const f of callbacks.splice(0))if(typeof f==='function')f();mount(true)
 await writeTasks(file,{tasks:[{id:'wait',title:'洗衣机',steps:[{text:'等待 45 分钟',minutes:45,startedAt:new Date().toISOString(),done:false}]},{id:'focus',title:'整理书桌',steps:[{text:'收拾纸张',minutes:5,done:false}]}]})
 const count=messages.length;await watch();assert.equal(messages.length,count+1);assert.match(messages.at(-1).content[0].text,/顺手安排/)
 await watch();assert.equal(messages.length,count+1,'parallel suggestion should not spam')
 console.log('PASS: completion sends exactly once, identified immutable message, overdue nudge, cooldown across restart, delivery failure keeps saved task and returns visible notice')
}finally{for(const f of callbacks)if(typeof f==='function')f();await new Promise(r=>server.close(r))}
