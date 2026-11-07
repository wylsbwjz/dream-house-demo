import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiHandler } from './agent.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
try{process.loadEnvFile(path.join(root,'.env'));}catch{}
const production=process.argv.includes('--production');
const vite=production?null:await (await import('vite')).createServer({server:{middlewareMode:true},appType:'spa'});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
  try{
    if(req.url.startsWith('/api/')){
      let bytes=0;const chunks=[];for await(const c of req){bytes+=c.length;if(bytes>150000){res.writeHead(413);return res.end();}chunks.push(c);}
      const controller=new AbortController();res.on('close',()=>controller.abort());
      const request=new Request(`http://${req.headers.host}${req.url}`,{method:req.method,headers:req.headers,signal:controller.signal,...(req.method!=='GET'?{body:Buffer.concat(chunks)}:{})});
      const response=await apiHandler(request,process.env);res.writeHead(response.status,Object.fromEntries(response.headers));
      if(response.body)for await(const c of response.body){if(res.destroyed)break;res.write(c);}res.end();
    }else if(vite)vite.middlewares(req,res);
    else{
      const base=path.join(root,'dist/client');let p=path.resolve(base,'.'+decodeURIComponent(req.url.split('?')[0]));
      if(!p.startsWith(base+path.sep)&&p!==base){res.writeHead(403);return res.end();}
      if(!fs.existsSync(p)||fs.statSync(p).isDirectory())p=path.join(base,'index.html');
      res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(res);
    }
  }catch{res.writeHead(500);res.end('请求未完成，请刷新后重试。');}
});
const port=Number(process.env.PORT||4317);
server.listen(port,'127.0.0.1',()=>console.log(`Dream House ready: http://127.0.0.1:${port} (${production?'production':'development'})`));
