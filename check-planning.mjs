import assert from 'node:assert/strict'
import {applyAction} from './lib/index.js'
import {dateKey,dayTasks,planDay,visibleSteps,taskDone,isWaitingStep} from './lib/model.js'
const now=new Date('2026-11-04T20:00:00+08:00').getTime()
const doc={updatedAt:new Date(now).toISOString(),tasks:[
 {id:'wash',title:'洗衣服',createdAt:new Date(now).toISOString(),steps:[{text:'等柔洗 45 分钟',minutes:45,startedAt:new Date(now).toISOString(),done:false},{text:'晾衣服',minutes:10,done:false}]},
 {id:'write',title:'写建议',createdAt:new Date(now).toISOString(),steps:[{text:'写三条建议',minutes:10,done:false}]},
 {id:'old',title:'昨天的工作',createdAt:'2026-11-03T12:00:00+08:00',status:'done',steps:[{text:'旧',done:true,minutes:1}]},
 {id:'completed',title:'今日已完成',createdAt:new Date(now).toISOString(),status:'done',steps:[{text:'完成',done:true,minutes:1}]}
]}
assert.equal(dateKey('2026-11-03T18:00:00Z'),'2026-11-04')
assert.equal(dayTasks(doc,'2026-11-04').length,3)
assert.equal(dayTasks(doc,'2026-11-04').filter(t=>!taskDone(t)).length,2)
const plan=planDay(doc,now);assert.equal(plan.opportunities[0].title,'写建议')
assert.equal(plan.blocks.find(b=>b.taskId==='write').start,now)
assert.equal(plan.blocks.find(b=>b.text==='晾衣服').start,now+45*60000)
let next=applyAction(doc,{action:'start',taskId:'write',step:0});assert(next.tasks[0].steps[0].startedAt,'starting focus must preserve machine wait')
next=applyAction(next,{action:'removeStep',taskId:'write',step:0});assert.equal(visibleSteps(next.tasks[1]).length,0);assert.equal(next.tasks[1].steps[0].startedAt,null)
next=applyAction(next,{action:'restoreStep',taskId:'write',step:0});assert.equal(visibleSteps(next.tasks[1]).length,1)
const id=next.tasks[1].steps[0].id
next=applyAction(next,{action:'editStep',taskId:'write',stepId:id,text:'新版建议',minutes:8,kind:'focus'});assert.equal(next.tasks[1].steps[0].text,'新版建议')
assert.throws(()=>applyAction(next,{action:'removeStep',taskId:'write',stepId:id,expectedText:'旧内容'}))
next=applyAction(next,{action:'setDay',taskId:'write',day:'2026-11-05'});assert(!dayTasks(next,'2026-11-04').some(t=>t.id==='write'))
assert.throws(()=>applyAction(next,{action:'setDay',taskId:'write',day:'2026-02-31'}))
assert.equal(isWaitingStep({text:'等待 45 分钟',kind:'focus'}),false)
const waitingId=next.tasks[0].steps[0].id
next=applyAction(next,{action:'removeStep',taskId:'wash',stepId:waitingId});assert.equal(next.tasks[0].steps[0].startedAt,null)
next=applyAction(next,{action:'restoreStep',taskId:'wash',stepId:waitingId});assert.equal(next.tasks[0].steps[0].startedAt,null,'undo deletion must not restart a timer')
console.log('PASS: Shanghai date filter, completed separation, parallel wait + focus, schedule gaps, soft delete and undo, step editing, stale edit guard, day rescheduling')
