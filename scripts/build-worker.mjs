import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.resolve('vite'));
const { build }=require('esbuild');
const root=process.cwd();const assets={};
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else{const key='/'+path.relative(path.join(root,'dist/client'),p).replaceAll('\\','/');assets[key]=(await fs.readFile(p)).toString('base64');}}}
await walk(path.join(root,'dist/client'));
const entry=`import {apiHandler} from './server/agent.mjs';const assets=${JSON.stringify(assets)};export default {async fetch(request,env){const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return apiHandler(request,env);const key=assets[url.pathname]?url.pathname:'/index.html';const ext=key.split('.').pop();const type=({html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',png:'image/png',json:'application/json'})[ext]||'application/octet-stream';const raw=atob(assets[key]);return new Response(Uint8Array.from(raw,c=>c.charCodeAt(0)),{headers:{'Content-Type':type,'Cache-Control':key==='/index.html'?'no-cache':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});}};`;
await fs.mkdir('dist/server',{recursive:true});
await build({stdin:{contents:entry,resolveDir:root,sourcefile:'worker-entry.js'},bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/server/index.js',minify:true});
console.log('Worker built with embedded local assets. No API credentials included.');
