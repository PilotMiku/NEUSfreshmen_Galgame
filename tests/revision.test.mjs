import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {story,sceneIndex,normalizeSave,validSave,backgrounds} from '../story.js';
import {legacySceneIds} from '../legacy-scenes.js';
import {albums} from '../albums.js';

const oldSave=id=>({version:1,index:legacySceneIds.indexOf(id),name:'同学',trail:[0,1,2],branch:'cry',notes:{'help-feeling':'有一点紧张'},date:'2026-11-16T00:00:00Z'});
test('Existing progress stays on the same scene after the narrative expands',()=>{
 const result=normalizeSave(oldSave('courses'));
 assert(validSave(result));assert.equal(result.version,2);assert.equal(result.sceneId,'courses');assert.equal(result.index,sceneIndex.courses);assert.equal(result.branch,'cry');assert.equal(result.notes['help-feeling'],'有一点紧张');
});
test('The removed font-direction page resumes at its merged binding scene',()=>{
 const result=normalizeSave(oldSave('s10'));assert.equal(result.sceneId,'s8');assert(story[result.index].text.includes('（屏幕上的字从黑体变成了像素字。）'));
});
test('New saves recover by scene ID rather than a stale array offset',()=>{
 const result=normalizeSave({...oldSave('courses'),version:2,sceneId:'courses',index:0,trailIds:['s0','s1'],trail:[30,31]});
 assert(validSave(result));assert.equal(result.index,sceneIndex.courses);assert.deepEqual(result.trail,[sceneIndex.s0,sceneIndex.s1]);
});
test('Invalid and inherited scene names are rejected without throwing',()=>{
 for(const sceneId of ['missing','__proto__','constructor'])assert.equal(normalizeSave({...oldSave('courses'),version:2,sceneId,trailIds:[]}),null);
});
test('Every original scene can still be restored after replacing the help scenarios',()=>{
 for(const id of legacySceneIds){const result=normalizeSave(oldSave(id));assert(validSave(result),id);}
});
test('Retired version 2 help scenes and trails migrate while preserving personal notes',()=>{
 const oldIds=['s57','s58','help-senior','s60','s61','help-friend','s63','s64','help-partner','s66','s67','s68','help-feeling','s70','s71','s72','help-kfc','s74','s75'];
 for(const id of oldIds){
  const result=normalizeSave({...oldSave('s57'),version:2,sceneId:id,index:70,trailIds:['s55','pause',...oldIds],trail:[],notes:{'help-feeling':'有一点紧张','help-friend':'想找朋友聊聊'}});
  assert(validSave(result),id);assert.equal(result.sceneId,'new-difficulties');assert.deepEqual(result.trailIds,['s55','pause']);
  assert.equal(result.notes['help-feeling'],'有一点紧张');assert.equal(result.notes['help-friend'],'想找朋友聊聊');
 }
 const end=normalizeSave({...oldSave('s77'),version:2,sceneId:'s77',trailIds:['pause',...oldIds,'next-step']});
 assert.equal(end.sceneId,'s77');assert.deepEqual(end.trailIds,['pause','new-difficulties','next-step']);
});
test('No personal status bars or early simulator popup remain',()=>{
 assert(story.every(scene=>scene.stats===undefined));
 assert(story.slice(0,sceneIndex.s8).every(scene=>!scene.sim));
 assert.equal(story[sceneIndex.s5].who,'我');assert.equal(story[sceneIndex.s8].effect,'binding');
 assert(!story.some(scene=>scene.text.includes('听力波纹')));
});
test('Every gallery photo resolves to a packaged real photograph',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../asset-manifest.json',import.meta.url),'utf8'));
 for(const album of Object.values(albums))for(const photo of album.photos){assert(manifest[photo.key],photo.key);assert((await stat(new URL('../'+manifest[photo.key],import.meta.url))).isFile());}
 assert.equal(albums.album.photos.length,8);assert(albums.training.photos.some(photo=>photo.key==='trainingPractice'));
});
test('Confirmed dorm and rain photos retain their correct meaning',async()=>{
 const map=JSON.parse(await readFile(new URL('../photo-map.json',import.meta.url),'utf8'));
 assert.equal(map.sushe,1248);assert.equal(map.rainCampus,1259);assert.equal(map.openingCeremony,1230);assert.equal(map.trainingPractice,'军训1.jpg');
 assert(albums.rainDiary.photos[0].caption.includes('同学'));assert.equal(story[sceneIndex['opening-ceremony']].bg,'开学典礼');
});
test('WebP gallery images and thumbnails remain separate from responsive backgrounds',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../asset-manifest.json',import.meta.url),'utf8'));
 for(const key of new Set(Object.values(albums).flatMap(album=>album.photos.map(photo=>photo.key)))){
  for(const prefix of ['gallery_','thumb_']){const path=manifest[prefix+key];assert(path?.endsWith('.webp'));const bytes=await readFile(new URL('../'+path,import.meta.url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');}
 }
 for(const key of Object.values(backgrounds))if(manifest[key])assert(manifest[key].endsWith('.bg.webp'));
});
