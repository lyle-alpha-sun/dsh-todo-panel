/* Local task board. Uses the same tab and theme contracts as DSH's built-in files panel. */
window.__ModuleLoader__.load({
  id: 'dsh-todo-panel',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const TAB_ID = '@local/dsh-todo-panel'
    const ROUTE = '/api/dsh-todo-panel'
    const CSS = `
    .dsh-todo{--ink:var(--dsw-alias-label-primary,#202d3c);--muted:var(--dsw-alias-label-secondary,#67768b);--line:var(--dsw-alias-border-l2,#e3e9f0);--paper:var(--dsw-alias-bg-base,#fff);--accent:#287c92;box-sizing:border-box;height:100%;min-width:0;display:flex;flex-direction:column;color:var(--ink);background:var(--paper);font:13px/1.55 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}
    .dsh-todo *{box-sizing:border-box}.dsh-todo button,.dsh-todo input{font:inherit}.dsh-todo button{cursor:pointer;color:inherit}.dsh-todo button:disabled{opacity:.45;cursor:wait}.dsh-todo button:focus-visible,.dsh-todo input:focus-visible,.dsh-todo summary:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
    .dsh-todo .top{padding:20px 18px 14px;border-bottom:1px solid var(--line)}.dsh-todo .brand{display:flex;gap:10px;align-items:center}.dsh-todo .fish{font-size:22px;display:grid;place-items:center;width:40px;height:40px;border-radius:14px;background:#287c9214}.dsh-todo h2{font-size:15px;margin:0;font-weight:650;letter-spacing:.2px}.dsh-todo .sub{font-size:11px;color:var(--muted);margin:2px 0 0}.dsh-todo .count{margin-left:auto;color:var(--accent);font-weight:650;font-size:12px;white-space:nowrap}
    .dsh-todo progress{appearance:none;width:100%;height:5px;display:block;margin-top:15px;border:0;border-radius:9px;overflow:hidden;background:var(--line)}.dsh-todo progress::-webkit-progress-bar{background:var(--line)}.dsh-todo progress::-webkit-progress-value{background:var(--accent);border-radius:9px}
    .dsh-todo .body{flex:1;min-height:0;overflow:auto;padding:16px 16px 24px}.dsh-todo .section{font-size:10px;font-weight:650;letter-spacing:1px;color:var(--muted);margin:0 0 8px}.dsh-todo .task-title{font-size:14px;font-weight:600;margin:0 0 12px;overflow-wrap:anywhere}.dsh-todo .focus{border:1px solid #287c9240;background:#287c9209;border-radius:16px;padding:14px;margin-bottom:18px}.dsh-todo .focus .section{color:var(--accent)}.dsh-todo .focus p{margin:0 0 12px;font-size:15px;line-height:1.6;overflow-wrap:anywhere}.dsh-todo .focus-foot{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.dsh-todo .time{color:var(--muted);font-size:11px;margin-right:auto}.dsh-todo .overdue{color:#bd7133}.dsh-todo .btn{border:1px solid var(--line);background:transparent;border-radius:9px;padding:6px 10px;font-size:12px;white-space:nowrap}.dsh-todo .primary{color:#fff;background:var(--accent);border-color:var(--accent)}
    .dsh-todo .row{display:flex;gap:10px;align-items:flex-start;padding:10px 1px;border-bottom:1px solid var(--line)}.dsh-todo .row input{accent-color:var(--accent);width:16px;height:16px;margin:3px 0;flex:none;cursor:pointer}.dsh-todo .row label{flex:1;overflow-wrap:anywhere;cursor:pointer}.dsh-todo .row .duration{font-size:11px;white-space:nowrap;color:var(--muted);padding-top:2px}.dsh-todo .done label{text-decoration:line-through;color:var(--muted)}.dsh-todo details{margin-top:16px}.dsh-todo summary{font-size:12px;color:var(--muted);cursor:pointer;list-style-position:inside}.dsh-todo .queue{display:block;text-align:left;width:100%;border:1px solid var(--line);border-radius:12px;background:transparent;padding:10px 12px;margin-top:8px;overflow-wrap:anywhere}.dsh-todo .queue[aria-pressed=true]{border-color:var(--accent);background:#287c9209}.dsh-todo .queue small{display:block;color:var(--muted);margin-top:2px}
    .dsh-todo .empty{padding:28px 6px;text-align:center;color:var(--muted)}.dsh-todo .empty span{display:block;font-size:28px;margin-bottom:8px}.dsh-todo .alert{font-size:12px;line-height:1.5;padding:10px 16px;background:#bf763014;color:var(--ink);border-bottom:1px solid var(--line);overflow-wrap:anywhere}.dsh-todo .alert button{border:0;background:transparent;color:var(--accent);margin-left:8px}
    .dsh-todo .footer{padding:14px 16px 16px;border-top:1px solid var(--line)}.dsh-todo .footer label{display:block;font-size:11px;color:var(--muted);margin-bottom:7px}.dsh-todo form{display:flex;gap:7px}.dsh-todo form input{width:0;flex:1;min-width:0;padding:9px 10px;border:1px solid var(--line);background:transparent;color:inherit;border-radius:10px}.dsh-todo .hint{font-size:10px;color:var(--muted);margin:8px 0 0;line-height:1.5}

    .dsh-todo .view-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:14px}.dsh-todo input[type=date]{font:inherit;font-size:11px;padding:5px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;min-width:0}.dsh-todo .work-tabs{display:flex;gap:7px;overflow-x:auto;padding:12px 0 2px}.dsh-todo .work-tab{flex:none;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:1px solid var(--line);border-radius:10px;background:transparent;padding:7px 10px;font-size:12px}.dsh-todo .work-tab[aria-selected=true]{background:#287c9212;border-color:var(--accent);color:var(--accent);font-weight:600}.dsh-todo .task-heading{display:flex;gap:10px;align-items:baseline}.dsh-todo .task-heading .task-title{flex:1;margin:0}.dsh-todo .delete-step{border:0;background:transparent;flex:none;font-size:18px;line-height:20px;color:var(--muted);padding:0 4px}.dsh-todo .edit-step{margin:0 0 2px 26px}.dsh-todo .edit-step summary{font-size:10px}.dsh-todo .edit-form{display:flex;flex-direction:column;gap:7px;padding:8px 0}.dsh-todo .edit-form input{width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit}.dsh-todo .edit-controls{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.dsh-todo .edit-controls input[type=number]{width:65px;flex:none}.dsh-todo select{font:inherit;font-size:12px;border:1px solid var(--line);border-radius:8px;padding:6px;background:var(--paper);color:inherit}.dsh-todo .opportunity{font-size:12px;background:#287c9210;border-radius:12px;padding:12px;margin-bottom:14px}.dsh-todo .opportunity button{display:block;margin-top:8px}.dsh-todo .day-plan{border-top:1px solid var(--line);padding-top:14px;margin-top:20px}.dsh-todo .plan-row{display:flex;gap:10px;font-size:12px;padding:9px 0;border-bottom:1px solid var(--line)}.dsh-todo .plan-row>span{font-size:11px;color:var(--accent);white-space:nowrap}.dsh-todo .plan-row small{display:block;color:var(--muted);font-size:10px}
    `
    async function request(body, signal) {
      const res = await fetch(ROUTE, body ? {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal,
      } : { headers: { Accept: 'application/json' }, cache: 'no-store', signal })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message || '任务台暂时无法连接，请稍后重试')
      return data.value
    }
    function useTasks() {
      const [doc, setDoc] = React.useState(null)
      const [error, setError] = React.useState('')
      const [notice, setNotice] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const lock = React.useRef(false)
      const seq = React.useRef(0)
      const alive = React.useRef(true)
      async function load() {
        if (lock.current) return
        const id = ++seq.current
        try {
          const value = await request()
          if (alive.current && id === seq.current) { setDoc(value.tasks); setError('') }
        } catch (e) { if (alive.current && id === seq.current) setError(e.message) }
      }
      async function act(body) {
        if (lock.current) return false
        lock.current = true; ++seq.current; setBusy(true)
        try {
          const value = await request(body)
          if (alive.current) { setDoc(value.tasks); setError(''); setNotice(value.notice ? '清单已保存；提醒尚未送达：' + value.notice : body.action === 'inbox' ? '已记到待拆清单，告诉助理「拆一下」即可。' : '') }
          return true
        } catch (e) { if (alive.current) setError(e.message); return false }
        finally { lock.current = false; if (alive.current) setBusy(false) }
      }
      React.useEffect(() => {
        alive.current = true; load()
        const timer = setInterval(load, 4000)
        return () => { alive.current = false; ++seq.current; clearInterval(timer) }
      }, [])
      return { doc, error, notice, busy, act, load }
    }
    function timeText(step) {
      const elapsed = (step.elapsedMs || 0) + (step.startedAt ? Math.max(0, Date.now() - new Date(step.startedAt).getTime()) : 0)
      if (!step.startedAt) return { text: elapsed ? '已暂停 · 剩余 ' + Math.max(0, Math.ceil(step.minutes - elapsed / 60000)) + ' 分' : '建议 ' + step.minutes + ' 分钟', over: false }
      const left = step.minutes - elapsed / 60000
      return { text: left <= 0 ? '超时 ' + Math.max(1, Math.ceil(-left)) + ' 分钟' : '还剩 ' + Math.ceil(left) + ' 分钟', over: left <= 0 }
    }
// Shared by the host and the generated browser bundle. No network or model calls.
function dateKey(value = Date.now()) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}
function visibleSteps(task) { return (task.steps || []).filter(s => !s.deletedAt) }
function taskDone(task) { const steps = visibleSteps(task); return steps.length > 0 ? steps.every(s => s.done) : task.status === 'done' }
function taskDay(task, doc) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(task.day || task.planDate || '')) return task.day || task.planDate
  const stamp = task.createdAt || (taskDone(task) && task.doneAt) || (task.steps || []).flatMap(s => [s.startedAt,s.doneAt]).filter(v => dateKey(v)).sort((a,b)=>new Date(a)-new Date(b))[0] || doc.updatedAt
  return dateKey(stamp) || dateKey()
}
function dayTasks(doc, day = dateKey()) { return (doc.tasks || []).filter(t => !t.deletedAt && taskDay(t,doc) === day) }
function isWaitingStep(step) {
  if (step.kind === 'wait') return true
  if (step.kind === 'focus') return false
  return /等待|等.{0,12}(?:分钟|小时)|浸泡|烘干中|充电中|机器运行/.test(step.text || '')
}
function remainingMs(step, now = Date.now()) {
  const elapsed = Number.isFinite(Number(step.elapsedMs)) ? Number(step.elapsedMs) : 0
  const since = step.startedAt && Number.isFinite(new Date(step.startedAt).getTime()) ? Math.max(0,now-new Date(step.startedAt).getTime()) : 0
  return Math.max(0, (Number(step.minutes) || 5)*60000-elapsed-since)
}
function planDay(doc, now = Date.now(), day = dateKey(now)) {
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

    function Panel() {
      const { doc, error, notice, busy, act, load } = useTasks()
      const [selected, select] = React.useState(null)
      const [mode, setMode] = React.useState('work')
      const [chosenDay, setDay] = React.useState(null)
      const [draft, setDraft] = React.useState('')
      const [undo, setUndo] = React.useState(null)
      const [, tick] = React.useState(0)
      React.useEffect(() => { const timer = setInterval(() => tick(n => n + 1), 1000); return () => clearInterval(timer) }, [])
      const day=chosenDay || dateKey()
      const daily=dayTasks(doc || {tasks:[]},day)
      const active=daily.filter(t=>!taskDone(t))
      const done=daily.filter(taskDone)
      const choices=mode==='done'?done:active
      const task=choices.find(t=>t.id===selected) || choices[0]
      const steps=task?.steps || []
      const current=steps.findIndex(s=>!s.done&&!s.deletedAt)
      const finished=visibleSteps(task || {}).filter(s=>s.done).length
      const total=visibleSteps(task || {}).length
      const next=steps[current]
      const clock=next?timeText(next):null
      const plan=planDay(doc || {tasks:[]},Date.now(),day)
      const format=time=>new Date(time).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Shanghai'})
      function action(kind,i,extra={}) { return act({action:kind,taskId:task.id,step:i,stepId:steps[i]?.id,expectedText:steps[i]?.text,...extra}) }
      async function removeStep(i) {
        const removed={action:'restoreStep',taskId:task.id,stepId:steps[i].id,text:steps[i].text}
        if(await action('removeStep',i))setUndo(removed)
      }
      function row(step,i) {
        if(step.deletedAt)return null
        return h('div',{key:step.id || i,className:'step-item'},[
          h('div',{className:'row'+(step.done?' done':'')},[
            h('input',{id:'todo-'+task.id+'-'+i,type:'checkbox',checked:step.done,disabled:busy,onChange:e=>action('toggle',i,{done:e.target.checked}),'aria-label':(step.done?'取消完成：':'完成：')+step.text}),
            h('label',{htmlFor:'todo-'+task.id+'-'+i},step.text),
            h('span',{className:'duration'},(isWaitingStep(step)?'等待 ':'')+step.minutes+' 分'),
            h('button',{className:'delete-step',title:'删除这一步（可撤销）','aria-label':'删除步骤：'+step.text,disabled:busy,onClick:()=>removeStep(i)},'×'),
          ]),
          h('details',{className:'edit-step'},[
            h('summary',null,'编辑'),
            h('form',{className:'edit-form',onSubmit:async e=>{e.preventDefault();const data=new FormData(e.currentTarget);await action('editStep',i,{text:data.get('text'),minutes:Number(data.get('minutes')),kind:data.get('kind')})}},[
              h('input',{name:'text','aria-label':'步骤内容',defaultValue:step.text,required:true,maxLength:1000}),
              h('div',{className:'edit-controls'},[
                h('input',{name:'minutes',type:'number',min:1,max:1440,defaultValue:step.minutes,'aria-label':'预计分钟',required:true}),
                h('select',{name:'kind',defaultValue:isWaitingStep(step)?'wait':'focus','aria-label':'步骤类型'},[h('option',{value:'focus'},'需要动手'),h('option',{value:'wait'},'等待 · 可并行')]),
                h('button',{className:'btn',disabled:busy,type:'submit'},'保存步骤'),
              ]),
            ]),
          ]),
        ])
      }
      async function addStep(e){
        e.preventDefault();const form=e.currentTarget;const data=new FormData(form)
        if(await act({action:'addStep',taskId:task.id,text:data.get('text'),minutes:Number(data.get('minutes')),kind:data.get('kind')}))form.reset()
      }
      async function submit(e) { e.preventDefault();if(draft.trim()&&await act({action:'inbox',text:draft.trim()}))setDraft('') }
      async function createTask(){if(draft.trim()&&await act({action:'addTask',title:draft.trim(),steps:[],day})) {setDraft('');setMode('work');select(null)}}
      return h('section',{className:'dsh-todo','aria-label':'大肥鱼的鞭策'},[
        h('style',{key:'style'},CSS),
        h('header',{key:'head',className:'top'},[
          h('div',{className:'brand'},[h('span',{className:'fish','aria-hidden':true},'🐟'),h('div',null,[h('h2',null,'大肥鱼的鞭策'),h('p',{className:'sub'},day+' · 一步一步来')]),h('span',{className:'count'},active.length+' 件待办')]),
          h('div',{className:'view-bar'},[
            h('button',{className:'btn'+(mode==='work'?' primary':''),onClick:()=>{setMode('work');select(null)}},'待办 '+active.length),
            h('button',{className:'btn'+(mode==='done'?' primary':''),onClick:()=>{setMode('done');select(null)}},'已完成 '+done.length),
            h('input',{type:'date',key:day,defaultValue:day,'aria-label':'查看日期',onInput:e=>{if(e.target.value){setDay(e.target.value);select(null)}}}),
            chosenDay&&h('button',{className:'btn',onClick:()=>{setDay(null);setMode('work');select(null)}},'回今天'),
          ]),
          h('div',{className:'work-tabs',role:'tablist','aria-label':mode==='done'?'已完成工作':'今日工作'},choices.map(t=>h('button',{type:'button',role:'tab',key:t.id,'aria-selected':task?.id===t.id,className:'work-tab',onClick:()=>select(t.id)},[(visibleSteps(t).some(s=>!s.done&&s.startedAt&&isWaitingStep(s))?'⏳ ':'' )+t.title]))),
        ]),
        (error||notice)&&h('div',{key:'error',className:'alert',role:'status'},[error||notice,error&&h('button',{disabled:busy,onClick:load},'重试')]),
        undo&&h('div',{key:'undo',className:'alert',role:'status'},['已移除「'+undo.text+'」',h('button',{disabled:busy,onClick:async()=>{if(await act(undo))setUndo(null)}},'撤销删除')]),
        h('div',{key:'body',className:'body'},!doc?h('div',{className:'empty'},error?'清单暂时无法读取，请重试。':'正在读取清单…'):[
          task&&h('div',{key:task.id},[
            h('div',{className:'task-heading'},[h('p',{className:'task-title'},task.title),h('span',{className:'count'},finished+' / '+total)]),
            h('progress',{max:total||1,value:finished,'aria-label':'当前任务完成进度'}),
            next&&h('div',{className:'focus',style:{marginTop:16}},[
              h('div',{className:'section'},(isWaitingStep(next)?'等待中也能安排别的事':'眼前这一小步')+' · '+(visibleSteps(task).indexOf(next)+1)+' / '+total),h('p',null,next.text),
              h('div',{className:'focus-foot'},[h('span',{className:'time'+(clock.over?' overdue':''),role:'timer'},clock.text),h('button',{className:'btn',disabled:busy,onClick:()=>action(next.startedAt?'pause':'start',current)},next.startedAt?'暂停':next.elapsedMs?'继续':'开始'),h('button',{className:'btn primary',disabled:busy,onClick:()=>action('toggle',current,{done:true})},'完成这一步')]),
            ]),
            !next&&h('div',{className:'empty'},[h('span',null,total?'✓':'＋'),total?'这一件做完了，干得漂亮。':'先添加一个小步骤，或者请助理帮你拆分。']),
            ...plan.opportunities.filter(o=>mode==='work'&&day===dateKey()&&o.taskId!==task.id).map(o=>h('div',{className:'opportunity',key:o.taskId},['顺手做一点 · '+o.waitingTask+'预计 '+format(o.until)+' 结束，可以先做「'+o.title+'」（约 '+o.minutes+' 分钟）。',h('button',{className:'btn',onClick:()=>{setMode('work');select(o.taskId)}},'切过去看看')])),
            mode==='work'&&plan.waits.some(w=>!w.planned)&&!plan.opportunities.length&&h('p',{className:'hint'},'等待结束前可以休息一下；计时继续，切换工作不会暂停机器等待。'),
            h('div',null,[h('p',{className:'section'},'步骤清单'),...steps.map((s,i)=>!s.done&&row(s,i))]),
            finished>0&&h('details',null,[h('summary',null,'已完成 '+finished+' 步 · 可取消勾选'),...steps.map((s,i)=>s.done&&row(s,i))]),
            steps.some(s=>s.deletedAt)&&h('details',null,[h('summary',null,'已移除 '+steps.filter(s=>s.deletedAt).length+' 步 · 可恢复'),...steps.map((s,i)=>s.deletedAt&&h('div',{className:'row',key:s.id},[h('span',{style:{flex:1}},s.text),h('button',{className:'btn',disabled:busy,onClick:()=>action('restoreStep',i)},'恢复步骤')]))]),
            h('details',{className:'add-step'},[h('summary',null,'＋ 添加步骤'),h('form',{className:'edit-form',onSubmit:addStep},[h('input',{name:'text',placeholder:'这一小步要做什么？','aria-label':'新步骤内容',required:true,maxLength:1000}),h('div',{className:'edit-controls'},[h('input',{type:'number',name:'minutes',min:1,max:1440,defaultValue:5,'aria-label':'新步骤分钟',required:true}),h('select',{name:'kind','aria-label':'新步骤类型'},[h('option',{value:'focus'},'需要动手'),h('option',{value:'wait'},'等待 · 可并行')]),h('button',{className:'btn',disabled:busy,type:'submit'},'添加步骤')])])]),
            h('details',{className:'task-options'},[h('summary',null,'工作安排'),h('div',{className:'edit-controls'},[h('button',{className:'btn',disabled:busy,onClick:()=>act({action:'moveTask',taskId:task.id,direction:'up'})},'顺序提前'),h('button',{className:'btn',disabled:busy,onClick:()=>act({action:'moveTask',taskId:task.id,direction:'down'})},'顺序延后'),h('input',{type:'date',key:taskDay(task,doc),defaultValue:taskDay(task,doc),'aria-label':'安排工作日期',onInput:e=>e.target.value&&act({action:'setDay',taskId:task.id,day:e.target.value})})])]),
          ]),
          !task&&h('div',{className:'empty',key:'empty'},[h('span',null,mode==='done'?'✓':'☁'),mode==='done'?'这一天还没有完成的工作。':'这一天的待办清了。完成的工作已收进「已完成」。']),
          mode==='work'&&day===dateKey()&&plan.blocks.length>0&&h('details',{key:'plan',className:'day-plan'},[
            h('summary',null,'时间安排 · 预计 '+format(plan.end)+' 收尾'),h('p',{className:'hint'},'按当前工作顺序和预计用时安排；等待可并行，实际进度变化后会更新。'),
            ...plan.blocks.map((b,i)=>h('div',{className:'plan-row',key:i},[h('span',null,format(b.start)+'–'+format(b.end)),h('div',null,[(b.kind==='wait'?'⏳ ':'')+b.text,h('small',null,b.kind==='wait'?'等待期间可做别的工作':b.taskTitle)])])),
          ]),
        ]),
        h('footer',{key:'footer',className:'footer'},[h('label',{htmlFor:'todo-idea'},'想做什么？直接新建工作，或先记下让助理拆分'),h('form',{onSubmit:submit},[h('input',{id:'todo-idea',placeholder:'比如：做一套雅思听力',value:draft,maxLength:4000,disabled:busy,onChange:e=>setDraft(e.target.value),onKeyDown:e=>{if(e.nativeEvent?.isComposing&&e.key==='Enter')e.preventDefault()}}),h('button',{className:'btn',disabled:busy||!draft.trim(),type:'submit'},'记下'),h('button',{className:'btn primary',disabled:busy||!draft.trim(),type:'button',onClick:createTask},'新建')]),h('p',{className:'hint'},'动手步骤同一时间只计一件；洗衣等等待可同时计时。')]),
      ])
    }
    function apply(ctx) {
      ctx.effect(() => ctx.sidebarRightTabs.register({ id: TAB_ID, kind: 'todo', multiple: false, title: () => '大肥鱼的鞭策' }), 'todo: tab')
      ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({ name: 'sidebar.right.pane.tab', key: TAB_ID }, Panel)), 'todo: content')
      ctx.effect(() => {
        const timer = setTimeout(() => ctx.sidebarRight.openTab('todo', {}), 500)
        return () => clearTimeout(timer)
      }, 'todo: open')
    }
    return { apply, inject: ['slots', 'sidebarRightTabs', 'sidebarRight'] }
  },
})
