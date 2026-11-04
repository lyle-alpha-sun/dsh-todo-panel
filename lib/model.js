// Shared by the host and the generated browser bundle. No network or model calls.
export function dateKey(value = Date.now()) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}
export function visibleSteps(task) { return (task.steps || []).filter(s => !s.deletedAt) }
export function taskDone(task) { const steps = visibleSteps(task); return steps.length > 0 ? steps.every(s => s.done) : task.status === 'done' }
export function taskDay(task, doc) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(task.day || task.planDate || '')) return task.day || task.planDate
  const stamp = task.createdAt || (taskDone(task) && task.doneAt) || (task.steps || []).flatMap(s => [s.startedAt,s.doneAt]).filter(v => dateKey(v)).sort((a,b)=>new Date(a)-new Date(b))[0] || doc.updatedAt
  return dateKey(stamp) || dateKey()
}
export function dayTasks(doc, day = dateKey()) { return (doc.tasks || []).filter(t => !t.deletedAt && taskDay(t,doc) === day) }
export function isWaitingStep(step) {
  if (step.kind === 'wait') return true
  if (step.kind === 'focus') return false
  return /等待|等.{0,12}(?:分钟|小时)|浸泡|烘干中|充电中|机器运行/.test(step.text || '')
}
export function remainingMs(step, now = Date.now()) {
  const elapsed = Number.isFinite(Number(step.elapsedMs)) ? Number(step.elapsedMs) : 0
  const since = step.startedAt && Number.isFinite(new Date(step.startedAt).getTime()) ? Math.max(0,now-new Date(step.startedAt).getTime()) : 0
  return Math.max(0, (Number(step.minutes) || 5)*60000-elapsed-since)
}
export function planDay(doc, now = Date.now(), day = dateKey(now)) {
  const tasks = dayTasks(doc,day).filter(t=>!taskDone(t)).sort((a,b)=>Number(visibleSteps(b).some(s=>!s.done&&s.startedAt&&!isWaitingStep(s)))-Number(visibleSteps(a).some(s=>!s.done&&s.startedAt&&!isWaitingStep(s))))
  const waits = []; const blocks = []; let cursor = now
  for (const task of tasks) for (const step of visibleSteps(task)) {
    if (!step.done && step.startedAt && isWaitingStep(step)) waits.push({taskId:task.id,taskTitle:task.title,text:step.text,end:now+remainingMs(step,now)})
  }
  for (const task of tasks) {
    let available=now
    for (const step of visibleSteps(task)) {
      if (step.done) continue
      const duration=remainingMs(step,now)
      if (isWaitingStep(step)) {
        const start=step.startedAt?now:Math.max(cursor,available)
        available=start+duration
        if (!step.startedAt) waits.push({taskId:task.id,taskTitle:task.title,text:step.text,end:available,planned:true})
        blocks.push({taskId:task.id,text:step.text,start,end:available,kind:'wait'})
      } else {
        const start=Math.max(cursor,available);const end=start+duration
        blocks.push({taskId:task.id,taskTitle:task.title,text:step.text,start,end,kind:'focus'});cursor=end;available=end
      }
    }
  }
  // Fill a running machine's wait window with a whole, independent task that fits.
  const opportunities=[]
  for(const wait of waits.filter(w=>!w.planned && w.end>now).sort((a,b)=>a.end-b.end).slice(0,1)) {
    for(const task of tasks) {
      if(task.id===wait.taskId)continue
      const steps=visibleSteps(task).filter(s=>!s.done)
      if(!steps.length || steps.some(isWaitingStep))continue
      const duration=steps.reduce((n,s)=>n+remainingMs(s,now),0)
      if(duration>wait.end-now)continue
      opportunities.push({waitingTask:wait.taskTitle,taskId:task.id,title:task.title,minutes:Math.ceil(duration/60000),until:wait.end})
      const own=blocks.filter(b=>b.taskId===task.id);let at=now
      for(const b of own){const size=b.end-b.start;b.start=at;b.end=at+size;at=b.end}
      break
    }
  }
  // A candidate can occupy only one wait window; avoid presenting multiple overlapping suggestions.
  const unique=opportunities.filter((o,i,a)=>a.findIndex(x=>x.taskId===o.taskId)===i)
  const focus=blocks.filter(b=>b.kind==='focus').sort((a,b)=>a.start-b.start)
  let end=now
  for(const b of focus){const duration=b.end-b.start;b.start=Math.max(b.start,end);b.end=b.start+duration;end=b.end}
  return {waits,blocks:blocks.sort((a,b)=>a.start-b.start),opportunities:unique,end:Math.max(now,...blocks.map(b=>b.end))}
}
