import {readFile,writeFile} from 'node:fs/promises'
const root=new URL('../',import.meta.url)
const model=await readFile(new URL('lib/model.js',root),'utf8')
const file=new URL('lib/client.js',root)
const client=await readFile(file,'utf8')
const start=client.indexOf('// Shared by the host')
const end=client.indexOf('    function Panel()',start)
if(start<0||end<0)throw new Error('Shared model markers missing')
await writeFile(file,client.slice(0,start)+model.replaceAll('export function','function')+'\n'+client.slice(end))
