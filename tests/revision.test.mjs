import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {story,sceneIndex,normalizeSave,validSave} from '../story.js';
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
test('Old scene IDs remain available except for the deliberately merged note',()=>{
 for(const id of legacySceneIds.filter(id=>id!=='s10'))assert(Number.isInteger(sceneIndex[id]),id);
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
