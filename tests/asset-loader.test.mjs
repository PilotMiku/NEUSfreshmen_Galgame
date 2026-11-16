import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fetchManifest,backgroundSource,loadImage} from '../asset-loader.js';
import {backgrounds} from '../story.js';
import {defaultAssets} from '../assets-default.js';

test('All responsive backgrounds exist, are WebP, and stay below size budgets',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../asset-manifest.json',import.meta.url),'utf8'));
 assert.deepEqual(defaultAssets,manifest,'Bundled fallback must match the manifest');
 for(const key of new Set(Object.values(backgrounds))){
  if(!manifest[key])continue;
  for(const prefix of ['', 'mobile_']){
   const file=manifest[prefix+key];assert(file.endsWith('.webp'));
   const bytes=await readFile(new URL('../'+file,import.meta.url));
   assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
   assert(bytes.length<(prefix?400_000:1_500_000),file+' exceeds size budget');
  }
 }
});
test('User backgrounds take precedence over mobile versions',()=>{
 const assets={xiaomen:'assets/photos/xiaomen.bg.webp',mobile_xiaomen:'assets/photos/xiaomen.mobile.webp'};
 assert.equal(backgroundSource('xiaomen',assets,true),assets.mobile_xiaomen);
 assert.equal(backgroundSource('xiaomen',assets),assets.xiaomen);
 assert.equal(backgroundSource('xiaomen',{...assets,xiaomen:'img_bg/xiaomen.png'},true),'img_bg/xiaomen.png');
 assert.equal(backgroundSource('ercantang',assets,true),'assets/ercantang.svg');
});
test('Manifest errors and stalled responses are bounded and reject invalid data',async t=>{
 for(const value of [[],null,{}, {photo:'../secret'}, {photo:3}]){
  t.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>value}));
  await assert.rejects(fetchManifest());t.mock.restoreAll();
 }
 t.mock.method(globalThis,'fetch',async()=>({ok:false}));await assert.rejects(fetchManifest());t.mock.restoreAll();
 t.mock.method(globalThis,'fetch',(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('timeout')))));
 await assert.rejects(fetchManifest('asset-manifest.json',10),/timeout/);t.mock.restoreAll();
 t.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>({photo:'assets/photos/example.webp'})}));
 assert.deepEqual(await fetchManifest(),{photo:'assets/photos/example.webp'});
});
test('Image cancellation and timeouts detach handlers and reject promptly',async t=>{
 const instances=[];
 const previous=globalThis.Image;
 globalThis.Image=class{constructor(){instances.push(this);}set src(value){this.value=value;}};
 t.after(()=>{if(previous===undefined)delete globalThis.Image;else globalThis.Image=previous;});
 await assert.rejects(loadImage('slow.webp',{timeout:10}),/超时/);
 assert.equal(instances[0].onload,null);assert.equal(instances[0].onerror,null);
 const controller=new AbortController();const pending=loadImage('old.webp',{signal:controller.signal});controller.abort();
 await assert.rejects(pending,{name:'AbortError'});
 const ready=loadImage('ready.webp');instances.at(-1).onload();assert.equal((await ready).value,'ready.webp');
});
test('Replacement photos are mapped by filename and library appears in the campus album',async()=>{
 const map=JSON.parse(await readFile(new URL('../photo-map.json',import.meta.url),'utf8'));
 assert.equal(map.tushuguan,'图书馆.jpg');assert.equal(map.zoulang,'过道.jpg');
 const {albums}=await import('../albums.js');assert(albums.campus2.photos.some(photo=>photo.key==='tushuguan'));
});

test('The four corrected album photos use fresh upright URLs and baked orientation',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../asset-manifest.json',import.meta.url),'utf8'));
 for(const key of ['journeyNight','journeyDusk','sushe','treeRoad'])for(const prefix of ['gallery_', 'thumb_']){
  const path=manifest[prefix+key];assert(path.includes('.upright.'),'The old cached URL must change');
  const bytes=await readFile(new URL('../'+path,import.meta.url));
  let dimensions;
  for(let offset=12;offset+8<=bytes.length;){
   const type=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4),start=offset+8;
   assert.notEqual(type,'EXIF','Do not leave orientation to browser EXIF handling');
   if(type==='VP8X')dimensions=[bytes.readUIntLE(start+4,3)+1,bytes.readUIntLE(start+7,3)+1];
   if(type==='VP8 ')dimensions=[bytes.readUInt16LE(start+6)&0x3fff,bytes.readUInt16LE(start+8)&0x3fff];
   offset+=8+size+(size%2);
  }
  assert(dimensions&&dimensions[1]>dimensions[0],key+prefix+' must have upright portrait pixels');
 }
});
