import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=process.cwd();
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.json':'application/json; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://localhost');const path=decodeURIComponent(url.pathname);if(path==='/asset-manifest.json'){const entries=JSON.parse(await readFile(resolve(root,"asset-manifest.json"),"utf8"));for(const [kind,names]of Object.entries({img_bg:['chechuang','xiaomen','wenguan','tushuguan','xiaonanhu','ercantang','sushe','junxun','jiaoshi','zoulang','wenguanmenkou','yelu'],img_human:['zhujue','banzhang','tuanzhishu','shenghuo','zuxuan','xuewei','wenti','xuezhang','xinli','wenti_stand'],audio:['bgm_open','bgm_ke','bgm_banwei','bgm_xingfu','bgm_qiuzhu','bgm_shouwei']})){for(const name of names){const file=`${kind}/${name}.${kind==='audio'?'mp3':'png'}`;try{await stat(resolve(root,file));entries[name]=file;}catch{}}}res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(entries));return;}const file=resolve(root,'.'+(path==='/'?'/index.html':path));if(!file.startsWith(root+sep)||path.split('/').some(s=>s.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);}catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`新生 · Local: http://127.0.0.1:${port}`));
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
