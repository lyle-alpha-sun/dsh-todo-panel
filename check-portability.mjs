import assert from 'node:assert/strict'
import {join,resolve} from 'node:path'
import {homedir} from 'node:os'
import {resolveConfig} from './lib/index.js'
const cfg=resolveConfig()
assert.equal(cfg.dataFile,join(resolve(process.env.DSH_HOME||join(homedir(),'.dsh')),'todo-panel','tasks.json'))
assert.equal(cfg.notify,false)
assert.equal(resolveConfig({dataFile:'~/todo/tasks.json'}).dataFile,join(homedir(),'todo/tasks.json'))
console.log('PASS: portable data paths, DSH_HOME isolation, explicit notification opt-in')
