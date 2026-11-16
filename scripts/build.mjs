import {mkdir,copyFile,cp,stat,writeFile,readFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),dist=resolve(root,'dist');
const entries=JSON.parse(await readFile(resolve(root,'asset-manifest.json'),'utf8'));
const referencedPhotos=new Set(Object.values(entries).map(file=>resolve(root,file)));
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
for(const file of ['index.html','style.css','effects.css','theme.css','app.js','background-transition.js','asset-loader.js','assets-default.js','story.js','audio.js','event-sounds.js','phone-chat.js','portraits.js','albums.js','scene-effects.js','todo-physics.js','legacy-scenes.js'])await copyFile(resolve(root,file),resolve(dist,file));
for(const folder of ['assets','img_bg','img_human','audio']){try{await stat(resolve(root,folder));await cp(resolve(root,folder),resolve(dist,folder),{recursive:true,filter:source=>!(/[/\\]assets[/\\]photos[/\\].+\.(?:jpg|webp)$/i.test(source))||referencedPhotos.has(source)});}catch(e){if(e.code!=='ENOENT')throw e;}}
const groups={img_bg:['chechuang','xiaomen','wenguan','tushuguan','xiaonanhu','ercantang','sushe','junxun','jiaoshi','zoulang','wenguanmenkou','yelu'],img_human:['zhujue','banzhang','tuanzhishu','shenghuo','zuxuan','xuewei','wenti','xuezhang','xinli'],audio:['bgm_open','bgm_ke','bgm_banwei','bgm_xingfu','bgm_qiuzhu','bgm_shouwei']};
for(const[kind,names]of Object.entries(groups))for(const name of names){const file=`${kind}/${name}.${kind==='audio'?'mp3':'png'}`;try{await stat(resolve(root,file));entries[name]=file;}catch{}}
await writeFile(resolve(dist,'asset-manifest.json'),JSON.stringify(entries,null,2));
await writeFile(resolve(dist,'assets-default.js'),'export const defaultAssets = '+JSON.stringify(entries,null,2)+';\n');
await writeFile(resolve(dist,'.nojekyll'),'');
console.log('已构建到 dist/；素材清单已更新。');
