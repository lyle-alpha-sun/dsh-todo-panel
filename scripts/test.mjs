import {spawnSync} from 'node:child_process'
for(const test of ['check.mjs','check-notify.mjs','check-planning.mjs','check-portability.mjs']) {
 const run=spawnSync(process.execPath,[test],{cwd:new URL('../',import.meta.url),stdio:'inherit',env:{...process.env,TZ:'Asia/Shanghai'}})
 if(run.status!==0)process.exit(run.status||1)
}
