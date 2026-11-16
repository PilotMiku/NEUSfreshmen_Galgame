import {readFile,writeFile,readdir,stat,unlink} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {backgrounds} from '../story.js';
import {albums} from '../albums.js';
import {withOrientedPhoto} from './photo-source.mjs';
const run=promisify(execFile),root=new URL('../',import.meta.url),path=name=>fileURLToPath(new URL(name,root));
const map=JSON.parse(await readFile(path('photo-map.json'),'utf8')),manifest=JSON.parse(await readFile(path('asset-manifest.json'),'utf8'));
const backgroundKeys=new Set(Object.values(backgrounds)),galleryKeys=new Set(Object.values(albums).flatMap(album=>album.photos.map(photo=>photo.key)));
let originals=[];try{originals=await readdir(path('图片/'));}catch{}
// New names prevent older, sideways previews from surviving in browser caches.
const uprightPhotos=new Set(['journeyNight','journeyDusk','sushe','treeRoad']);
let before=0,after=0;
for(const [key,reference] of Object.entries(map)){
 const name=originals.find(name=>typeof reference==='number'?name.includes('_'+reference+'_'):name===reference);
 const source=name?path('图片/'+name):path(manifest[key]);
 if(!name&&manifest[key].endsWith('.webp'))continue;
 if(backgroundKeys.has(key)&&!galleryKeys.has(key))continue;
 const basename=key+(uprightPhotos.has(key)?'.upright':'');
 const output='assets/photos/'+basename+'.webp';
 await withOrientedPhoto(source,async normalized=>{
 await run('cwebp',['-quiet','-q','80','-m','6','-metadata','icc','-resize','1600','0',normalized,'-o',path(output)]);
 before+=(await stat(source)).size;after+=(await stat(path(output))).size;
 if(galleryKeys.has(key)){
  const thumb='assets/photos/'+basename+'.thumb.webp';
  await run('cwebp',['-quiet','-q','74','-m','5','-metadata','icc','-resize','384','0',normalized,'-o',path(thumb)]);
  manifest['gallery_'+key]=output;manifest['thumb_'+key]=thumb;
 }
 });
 if(!backgroundKeys.has(key)){manifest[key]=output;await unlink(path('assets/photos/'+key+'.jpg')).catch(error=>{if(error.code!=='ENOENT')throw error;});}
}
await writeFile(path('asset-manifest.json'),JSON.stringify(manifest,null,2));
console.log(`相册图片：${(before/1048576).toFixed(1)} MB → ${(after/1048576).toFixed(1)} MB；全屏背景另行生成适配版本。`);

await import('./optimize-backgrounds.mjs');
