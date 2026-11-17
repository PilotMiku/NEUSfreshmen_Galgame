import test from 'node:test';
import assert from 'node:assert/strict';
import {musicTracks,musicStep} from '../music-score.js';
import {story} from '../story.js';

test('Every chapter track has a finite sixteen-bar phrase with a varied second half',()=>{
 for(const track of new Set(story.map(s=>s.music).filter(t=>t!=='off'))){
  assert(musicTracks[track]);assert(musicTracks[track].bpm>=72&&musicTracks[track].bpm<=112);
  for(let step=0;step<128;step++){
   const score=musicStep(track,step);assert.deepEqual(score,musicStep(track,step+128));
   for(const note of score){for(const field of ['at','duration','frequency','end','level'])assert(Number.isFinite(note[field]));assert(note.duration>0&&note.duration<3);assert(note.frequency>0&&note.end>0);assert(note.level>0&&note.level<.35);}
  }
  const first=Array.from({length:64},(_,step)=>musicStep(track,step));
  const second=Array.from({length:64},(_,step)=>musicStep(track,step+64));
  assert.notDeepEqual(first,second,track+' develops after eight bars');
  assert(first.flat().some(n=>n.frequency<150),track+' has a bass foundation');
  assert(first.flat().some(n=>n.frequency>400),track+' has a melody');
 }
 assert.deepEqual(musicStep('off',0),[]);
});
test('Quiet scenes have breathing space and no drum kit; course scenes keep a tight pulse',()=>{
 const notes=track=>Array.from({length:128},(_,step)=>musicStep(track,step)).flat();
 for(const track of ['xingfu','qiuzhu','shouwei'])assert(notes(track).every(n=>n.type!=='noise'&&n.frequency===n.end));
 const sparse=Array.from({length:128},(_,step)=>musicStep('qiuzhu',step));
 assert(sparse.filter(score=>score.length===0).length>80,'Help music leaves pauses between phrases');
 assert(notes('ke').some(n=>n.type==='noise'));
 assert(notes('ke').some(n=>n.type==='square'));
});
