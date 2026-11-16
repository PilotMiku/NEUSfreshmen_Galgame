import test from 'node:test';
import assert from 'node:assert/strict';
import {story,sceneIndex,normalizeSave} from '../story.js';
import {resolvedTodoState} from '../resolved-todos.js';
import {sceneCue} from '../event-sounds.js';

test('Ending tasks follow narration order and never complete Python',()=>{
 const sequence=['math','group','feeling','meeting'];
 for(let step=0;step<=4;step++){
  const scene=story[sceneIndex['s'+(77+step)]],tasks=resolvedTodoState(scene);
  assert.equal(scene.resolvedCount,step);
  assert.deepEqual(tasks.filter(t=>t.checked).map(t=>t.id).sort(),sequence.slice(0,Math.max(0,step-1)).sort());
  assert.deepEqual(tasks.filter(t=>t.current).map(t=>t.id),step?[sequence[step-1]]:[]);
  assert(!tasks.find(t=>t.id==='python').checked);
  assert.equal(sceneCue(scene),null,'Only completing a row should trigger its check sound');
 }
});

test('Rewinding or loading an ending scene derives its checks from that scene',()=>{
 for(const id of ['s81','s78','s80','s77']){
  const saved=normalizeSave({version:2,sceneId:id,index:0,name:'同学',trail:[],trailIds:[],branch:null,notes:{},date:''});
  const scene=story[saved.index],tasks=resolvedTodoState(scene);
  assert.equal(tasks.filter(t=>t.checked).length,Math.max(0,scene.resolvedCount-1));
 }
 assert(resolvedTodoState(story[sceneIndex.s82]).every(t=>!t.checked&&!t.current));
});
