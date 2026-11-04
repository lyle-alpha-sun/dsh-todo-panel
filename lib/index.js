/**
 * dsh-todo-panel — 宿主侧
 *
 * 只做两件事：读写本地任务 JSON，并把它通过一个小 HTTP 路由暴露给右侧面板。
 * 面板点勾 → POST → 写回文件；助理在聊天里改文件 → 面板下次轮询就刷新。
 */
import { readFile, writeFile, rename, appendFile, mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { dateKey, taskDay, taskDone, isWaitingStep, visibleSteps, planDay } from './model.js'

export const name = 'dsh-todo-panel'
export const inject = ['webServer']

const ROUTE = '/api/dsh-todo-panel'

const DSH_HOME = resolve(process.env.DSH_HOME || join(homedir(), '.dsh'))

const DEFAULTS = {
  enabled: true,
  notify: false,
  nudgeCooldownMs: 45 * 60 * 1000,
  dataFile: join(DSH_HOME, 'todo-panel', 'tasks.json'),
  bindingsFile: join(DSH_HOME, 'heartbeat-data', 'settings', 'bindings.json'),
}

const EMPTY = () => ({ version: 1, updatedAt: new Date().toISOString(), tasks: [] })

function normalize(raw) {
  const doc = raw && typeof raw === 'object' ? raw : {}
  const tasks = Array.isArray(doc.tasks) ? doc.tasks : []
  return {
    ...doc,
    version: 1,
    updatedAt: doc.updatedAt || new Date().toISOString(),
    presenceNote: doc.presenceNote,
    tasks: tasks
      .filter((task) => task && typeof task === 'object')
      .map((task, i) => ({
        ...task,
        id: String(task.id || `t${i + 1}`),
        title: String(task.title || '（未命名）'),
        status: task.status === 'done' ? 'done' : 'todo',
        day: taskDay(task, doc),
        createdAt: task.createdAt,
        doneAt: task.doneAt,
        steps: (Array.isArray(task.steps) ? task.steps : [])
          .filter((step) => step && typeof step === 'object')
          .map((step, index) => ({
            ...step,
            id: String(step.id || `${task.id || `t${i+1}`}-s${index}`),
            elapsedMs: Math.max(0, Number(step.elapsedMs) || 0),
            text: String(step.text || ''),
            minutes: Number.isFinite(Number(step.minutes)) && Number(step.minutes) > 0 ? Number(step.minutes) : 5,
            done: step.done === true,
            startedAt: step.startedAt || null,
            doneAt: step.doneAt || null,
          })),
      })),
  }
}

export async function readTasks(file) {
  try {
    const text = await readFile(file, 'utf8')
    return normalize(JSON.parse(text))
  } catch (error) {
    if (error && error.code === 'ENOENT') return EMPTY()
    throw error
  }
}

export async function writeTasks(file, doc) {
  const next = { ...normalize(doc), updatedAt: new Date().toISOString() }
  await mkdir(dirname(file), { recursive: true })
  const tmp = `${file}.tmp-${randomUUID()}`
  await writeFile(tmp, JSON.stringify(next, null, 2) + '\n', 'utf8')
  await rename(tmp, file)
  return next
}

/** 纯函数：把一次面板操作应用到任务文档上，返回新文档。 */
export function applyAction(doc, action) {
  const next = normalize(doc)
  const now = new Date().toISOString()
  if (!action || typeof action !== 'object') throw new Error('无效操作')
  const task = next.tasks.find((item) => item.id === action.taskId)
  if (action.stepId && task) action = { ...action, step: task.steps.findIndex(s => s.id === action.stepId) }
  if (action.expectedText && task?.steps[action.step]?.text !== action.expectedText) throw new Error('这一步刚被修改，请刷新后重试')
  const syncStatus = () => { task.status = taskDone({...task,status:'todo'}) ? 'done' : 'todo'; task.doneAt = task.status === 'done' ? (task.doneAt || now) : null }


  switch (action.action) {
    case 'toggle': {
      if (!task || !Number.isInteger(action.step) || !task.steps[action.step] || task.steps[action.step].deletedAt) throw new Error('找不到这一步，请刷新后重试')
      const step = task.steps[action.step]
      step.done = typeof action.done === 'boolean' ? action.done : !step.done
      if (step.done) {
        step.doneAt = now
        if (step.startedAt) step.elapsedMs += Math.max(0, Date.now() - new Date(step.startedAt).getTime())
        step.startedAt = null
      } else {
        step.doneAt = null
      }
      const allDone = visibleSteps(task).length > 0 && visibleSteps(task).every((s) => s.done)
      task.status = allDone ? 'done' : 'todo'
      task.doneAt = allDone ? now : null
      return next
    }
    case 'start':
    case 'pause': {
      if (!task || !Number.isInteger(action.step) || !task.steps[action.step] || task.steps[action.step].done || task.steps[action.step].deletedAt) throw new Error('无法计时：这一步已完成或不存在')
      const step = task.steps[action.step]
      const pause = (s) => {
        if (s.startedAt && !s.done) s.elapsedMs = (s.elapsedMs || 0) + Math.max(0, Date.now() - new Date(s.startedAt).getTime())
        s.startedAt = null
      }
      if (action.action === 'pause') pause(step)
      else if (!step.startedAt) {
        for (const t of next.tasks) for (const s of t.steps) if (!s.done && !s.deletedAt && s.startedAt && !isWaitingStep(s) && !isWaitingStep(step)) pause(s)
        step.startedAt = now
      }
      return next
    }
    case 'addTask': {
      const steps = (Array.isArray(action.steps) ? action.steps : [])
        .map((s) => (typeof s === 'string' ? { text: s, minutes: 5 } : s))
        .filter((s) => s && String(s.text || '').trim())
        .map((s) => ({
          text: String(s.text).trim(),
          minutes: Number(s.minutes) > 0 ? Number(s.minutes) : 5,
          done: false,
          startedAt: null,
          doneAt: null,
        }))
      next.tasks.push({
        id: `t${randomUUID()}`,
        title: String(action.title || '新任务').trim(),
        status: 'todo',
        day: /^\d{4}-\d{2}-\d{2}$/.test(action.day || '') ? action.day : dateKey(now),
        createdAt: now,
        doneAt: null,
        steps,
      })
      return next
    }
    case 'addStep': {
      if (!task) return next
      const text = String(action.text || '').trim()
      if (!text) return next
      task.steps.push({
        id: randomUUID(),
        kind: action.kind === 'wait' ? 'wait' : 'focus',
        text,
        minutes: Number(action.minutes) > 0 ? Number(action.minutes) : 5,
        done: false,
        startedAt: null,
        doneAt: null,
      })
      task.status = 'todo'
      task.doneAt = null
      return next
    }
    case 'removeStep':
    case 'restoreStep': {
      const step = task?.steps[action.step]
      if (!step) throw new Error('找不到这一步，请刷新后重试')
      if (action.action === 'removeStep') {
        if (step.startedAt && !step.done) step.elapsedMs += Math.max(0,Date.now()-new Date(step.startedAt).getTime())
        step.startedAt = null;step.deletedAt=now
      } else delete step.deletedAt
      syncStatus();return next
    }
    case 'editStep': {
      const step=task?.steps[action.step]
      if(!step || step.deletedAt || !String(action.text || '').trim())throw new Error('请填写步骤内容')
      const minutes=Number(action.minutes)
      if(!Number.isFinite(minutes)||minutes<=0||minutes>1440)throw new Error('预计用时须在 1–1440 分钟内')
      step.text=String(action.text).trim();step.minutes=minutes;step.kind=action.kind==='wait'?'wait':'focus'
      return next
    }
    case 'setDay': {
      if(!task || !/^\d{4}-\d{2}-\d{2}$/.test(action.day || '') || dateKey(action.day+'T12:00:00+08:00')!==action.day)throw new Error('请选择有效日期')
      task.day=action.day;return next
    }
    case 'moveTask': {
      if(!task)throw new Error('找不到工作')
      const peers=next.tasks.filter(t=>!t.deletedAt&&t.day===task.day&&!taskDone(t));const at=peers.indexOf(task);const target=peers[at+(action.direction==='up'?-1:1)]
      if(target){const a=next.tasks.indexOf(task),b=next.tasks.indexOf(target);[next.tasks[a],next.tasks[b]]=[next.tasks[b],next.tasks[a]]}
      return next
    }
    case 'removeTask':
    case 'restoreTask': {
      if(!task)throw new Error('找不到工作')
      if(action.action==='removeTask'){task.deletedAt=now;for(const step of task.steps)if(step.startedAt&&!step.done){step.elapsedMs+=Math.max(0,Date.now()-new Date(step.startedAt).getTime());step.startedAt=null}}
      else delete task.deletedAt
      return next
    }
    default:
      throw new Error('不支持的操作')
  }
}

function responseJson(res, status, body) {
  const bytes = Buffer.from(JSON.stringify(body))
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Length', String(bytes.length))
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.writeHead(status)
  res.end(bytes)
}

async function awaitBody(req, maxBytes) {
  const chunks = []
  let bytes = 0
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    bytes += part.length
    if (bytes > maxBytes) throw new RangeError('request body too large')
    chunks.push(part)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export function apply(ctx, config) {
  return boot(ctx, config)
}

export function resolveConfig(config = {}) {
  const cfg = { ...DEFAULTS, ...config }
  for (const key of ['dataFile', 'bindingsFile']) {
    const value = String(cfg[key] || DEFAULTS[key])
    cfg[key] = resolve(value.startsWith('~/') ? join(homedir(), value.slice(2)) : value)
  }
  return cfg
}

function boot(ctx, config) {
  const cfg = resolveConfig(config || {})
  if (cfg.enabled === false) return
  const file = cfg.dataFile || DEFAULTS.dataFile

  let disposed = false
  /** 超时催办的去重表：`taskId:stepIndex` → 上次催的时间。 */
  const lastNudge = new Map()
  const nudgeFile = join(dirname(file), '.todo-reminders.json')
  let notificationError = null
  const reminderReady = readFile(nudgeFile, 'utf8').then(text => { for (const [k,v] of Object.entries(JSON.parse(text))) lastNudge.set(k, v) }).catch(() => {})

  /** 目标会话：优先生效于心跳绑定的那个会话，其次配置项。 */
  async function resolveSessionId() {
    if (cfg.notifySession) return cfg.notifySession
    try {
      const raw = JSON.parse(await readFile(cfg.bindingsFile, 'utf8'))
      const list = Array.isArray(raw) ? raw : raw && Array.isArray(raw.bindings) ? raw.bindings : []
      const hit = list.find((item) => item && item.sessionId && item.deliver !== false)
      if (hit) return hit.sessionId
    } catch {
      /* 没有绑定文件就退回配置 */
    }
    return null
  }

  /** 往会话里塞一条“用户消息”，触发助理开口。失败就安静跳过。 */
  async function pushToAgent(text) {
    if (cfg.notify === false || disposed) return false
    try {
      const agents = ctx.get('agents')
      if (!agents || typeof agents.get !== 'function') throw new Error('助理服务尚未就绪')
      const sessionId = await resolveSessionId()
      if (!sessionId) throw new Error('尚未绑定提醒会话')
      const agent = agents.get(sessionId)
      if (!agent || typeof agent.followup !== 'function') throw new Error('提醒会话未打开，请打开专属助理会话')
      // DSH UserMessage contract: immutable content with a stable identity and producer source.
      // Keep this local plugin independent of the app archive's module resolution.
      const message = Object.freeze({
        id: randomUUID(), role: 'user',
        content: Object.freeze([Object.freeze({ type: 'text', text })]),
        source: Object.freeze({ kind: 'todo-panel', plugin: 'dsh-todo-panel' }),
      })
      agent.followup(message)
      notificationError = null
      return true
    } catch (error) {
      ctx.logger?.warn?.(`dsh-todo-panel: notify failed: ${error.message}`)
      notificationError = error.message
      return false
    }
  }

  function praiseText(task, step) {
    return `（任务台）我把「${step.text}」勾掉了（${task.title}）。用一句话夸我，别啰嗦。`
  }

  function nudgeText(task, step, overMinutes) {
    if (isWaitingStep(step)) {
      const following=visibleSteps(task).find(s=>!s.done&&!s.startedAt&&s!==step)
      return `（任务台）「${task.title}」的等待时间到了：${step.text}。提醒我回来检查${following?'，接下来：'+following.text:''}。不要自动勾选。`
    }
    const budget = step.minutes < 1 ? `${Math.round(step.minutes * 60)} 秒` : `${step.minutes} 分钟`
    const overLabel = overMinutes < 1 ? `${Math.max(10, Math.round(overMinutes * 60))} 秒` : `${Math.round(overMinutes)} 分钟`
    return `（任务台）「${step.text}」建议 ${budget}，已经超时 ${overLabel}还没勾。催我一句，问我要不要砍成更小的一步。`
  }

  const handleRequest = async (req, res) => {
    try {
      if (req.method === 'GET') {
        const doc = await readTasks(file)
        responseJson(res, 200, { ok: true, value: { tasks: doc, plan: planDay(doc) } })
        return
      }
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST')
        responseJson(res, 405, { ok: false, error: { code: 'method-not-allowed', message: 'Use GET or POST' } })
        return
      }
      // 只接受本机页面发起的请求，别让外部网页改你的清单。
      const site = req.headers['sec-fetch-site']
      const origin = req.headers.origin
      if (site === 'cross-site') {
        responseJson(res, 403, { ok: false, error: { code: 'origin-rejected', message: 'cross-site' } })
        return
      }
      if (origin) {
        try {
          const host = req.headers.host
          if (origin !== 'dsh-app://app' && (!host || new URL(origin).host !== host)) {
            responseJson(res, 403, { ok: false, error: { code: 'origin-rejected', message: 'origin mismatch' } })
            return
          }
        } catch {
          responseJson(res, 403, { ok: false, error: { code: 'origin-rejected', message: 'bad origin' } })
          return
        }
      }
      let action
      try {
        action = JSON.parse(await awaitBody(req, 64 * 1024))
      } catch (error) {
        responseJson(res, 400, { ok: false, error: { code: 'invalid-request', message: String(error.message || error) } })
        return
      }
      const snapshot = await readFile(file, 'utf8').catch(error => { if (error.code === 'ENOENT') return null; throw error })
      const current = snapshot === null ? EMPTY() : normalize(JSON.parse(snapshot))
      if (action && action.action === 'inbox') {
        const text = String(action.text || '').trim()
        if (!text || text.length > 4000) throw new Error('请填写 1–4000 字的任务想法')
        if (text) {
          await mkdir(dirname(file), { recursive: true })
          const inbox = join(dirname(file), '待拆.md')
          const stamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
          await appendFile(inbox, `- [${stamp}] ${text}\n`, 'utf8')
        }
        responseJson(res, 200, { ok: true, value: { tasks: current } })
        return
      }
      let updated
      try { updated = applyAction(current, action) } catch (error) { responseJson(res, 400, { ok: false, error: { message: error.message } }); return }
      if (await readFile(file, 'utf8').catch(error => { if (error.code === 'ENOENT') return null; throw error }) !== snapshot) {
        responseJson(res, 409, { ok: false, error: { message: '助理刚刚更新了清单，请刷新后重试' } }); return
      }
      const saved = await writeTasks(file, updated)

      // 勾掉一步 → 让助理开口夸；退勾不吭声。
      if (action && action.action === 'toggle') {
        const task = saved.tasks.find((item) => item.id === action.taskId)
        const step = task && (action.stepId ? task.steps.find(s=>s.id===action.stepId) : task.steps[Number(action.step)])
        const oldTask=current.tasks.find(t=>t.id===action.taskId)
        const oldStep=action.stepId?oldTask?.steps.find(s=>s.id===action.stepId):oldTask?.steps[action.step]
        if (task && step && step.done && !oldStep?.done) {
          lastNudge.delete(`${task.id}:${step.text}`)
          await pushToAgent(praiseText(task, step))
        }
      }

      responseJson(res, 200, { ok: true, value: { tasks: saved, notice: notificationError } })
    } catch (error) {
      ctx.logger?.warn?.(`dsh-todo-panel: ${error.message}`)
      try {
        responseJson(res, 500, { ok: false, error: { code: 'internal', message: error instanceof SyntaxError ? '任务清单格式有误，已保留原文件。请让助理修复后重试。' : '暂时无法读写任务清单，请稍后重试。' } })
      } catch {
        /* 响应已发出 */
      }
    }
  }

  // ponytail: one file, one serialized queue; split by file only if multiple boards are introduced.
  let pending = Promise.resolve()
  const handler = (req, res) => { const result = pending.then(() => handleRequest(req, res)); pending = result.catch(() => {}); return result }

  let routeRegistered = false
  const registerRoute = () => {
    if (routeRegistered || disposed) return
    const ws = ctx.get('webServer')
    if (!ws) return
    try {
      const detach = ws.register({ kind: 'exact', path: ROUTE, handler })
      routeRegistered = true
      ctx.effect(() => detach, 'dsh-todo-panel: route')
    } catch (error) {
      ctx.logger?.warn?.(`dsh-todo-panel: route failed: ${error.message}`)
    }
  }
  registerRoute()
  ctx.on('internal/service', (serviceName) => {
    if (serviceName === 'webServer') registerRoute()
  })

  // 超时没勾 → 催。同一小步 45 分钟内只催一次，避免变噪音。
  const watch = setInterval(async () => {
    if (disposed || cfg.notify === false) return
    try {
      const doc = await readTasks(file)
      const now = Date.now()
      await reminderReady
      const opportunity=planDay(doc,now).opportunities[0]
      if(opportunity){
        const waiting=doc.tasks.find(t=>t.title===opportunity.waitingTask)
        const step=waiting&&visibleSteps(waiting).find(s=>!s.done&&s.startedAt&&isWaitingStep(s))
        const key=step&&`parallel:${waiting.id}:${step.id}:${step.startedAt}`
        if(key&&!lastNudge.has(key)){
          const text=`（任务台·顺手安排）「${opportunity.waitingTask}」还在等待，预计 ${new Date(opportunity.until).toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit'})} 结束。现在可以先做「${opportunity.title}」，约 ${opportunity.minutes} 分钟。简短提醒我这个选择，不要自动勾选或暂停等待计时。`
          if(await pushToAgent(text)){lastNudge.set(key,now);await mkdir(dirname(file),{recursive:true});await writeFile(nudgeFile,JSON.stringify(Object.fromEntries(lastNudge)),'utf8')}
          return
        }
      }
      for (const task of doc.tasks) {
        if (task.deletedAt || taskDone(task)) continue
        for (let i = 0; i < task.steps.length; i++) {
          const step = task.steps[i]
          if (step.deletedAt || step.done || !step.startedAt) continue
          const deadline = new Date(step.startedAt).getTime() + step.minutes * 60000 - (step.elapsedMs || 0)
          const overMs = now - deadline
          // 超时 12 秒就催：短步骤（10 秒级）也能在下一跳被抓到。
          if (overMs < 12000) continue
          const over = overMs / 60000
          await reminderReady
          const key = `${task.id}:${step.text}`
          const last = lastNudge.get(key) || 0
          if (now - last < cfg.nudgeCooldownMs) continue
          if (await pushToAgent(nudgeText(task, step, over))) {
            lastNudge.set(key, now)
            await mkdir(dirname(file), { recursive: true })
            await writeFile(nudgeFile, JSON.stringify(Object.fromEntries(lastNudge)), 'utf8')
          }
          return
        }
      }
    } catch (error) {
      ctx.logger?.warn?.(`dsh-todo-panel: watcher: ${error.message}`)
    }
  }, 15000)
  if (typeof watch.unref === 'function') watch.unref()

  ctx.effect(() => () => {
    disposed = true
    clearInterval(watch)
  }, 'dsh-todo-panel: dispose')
}
